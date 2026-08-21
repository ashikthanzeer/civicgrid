from __future__ import annotations

import os
import time
from typing import Any

from dotenv import load_dotenv
from google import genai
from google.genai import errors
from google.genai import types
from pydantic import ValidationError

from .prompts import build_extraction_prompt
from .schemas import CivicComplaint

DEFAULT_MODEL = "gemini-3.6-flash"
RATE_LIMIT_FALLBACK_DELAY_SECONDS = 61.0
RATE_LIMIT_RETRY_BUFFER_SECONDS = 1.0


class ComplaintInputError(ValueError):
    """Raised when the complaint input is not usable."""


class GeminiConfigurationError(RuntimeError):
    """Raised when Gemini configuration is missing or invalid."""


class GeminiExtractionError(RuntimeError):
    """Raised when Gemini cannot produce a valid structured complaint."""


def _validate_input(text: str) -> str:
    if not isinstance(text, str):
        raise ComplaintInputError("Complaint text must be a string.")
    if not text.strip():
        raise ComplaintInputError("Complaint text must not be empty or whitespace-only.")
    return text.strip()


def _create_client() -> genai.Client:
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise GeminiConfigurationError(
            "GEMINI_API_KEY is not set. Configure it in the environment or a local .env file."
        )
    return genai.Client(api_key=api_key)


def _get_model_name() -> str:
    return os.getenv("GEMINI_MODEL") or DEFAULT_MODEL


def _gemini_response_schema() -> dict[str, Any]:
    schema = CivicComplaint.model_json_schema()
    schema.pop("additionalProperties", None)
    return schema


def _parse_structured_response(response: Any) -> CivicComplaint:
    parsed = getattr(response, "parsed", None)
    if parsed is None:
        raise GeminiExtractionError(
            "Gemini returned no parsed structured complaint."
        )
    try:
        if isinstance(parsed, CivicComplaint):
            return parsed
        return CivicComplaint.model_validate(parsed)
    except ValidationError as exc:
        raise GeminiExtractionError(
            "Gemini returned a structured complaint that failed validation."
        ) from exc


def _rate_limit_retry_delay_seconds(exc: errors.ClientError) -> float | None:
    if exc.code != 429 or exc.status != "RESOURCE_EXHAUSTED":
        return None

    details = exc.details
    if isinstance(details, dict):
        error_details = details.get("error", details).get("details", [])
        if isinstance(error_details, list):
            for detail in error_details:
                if not isinstance(detail, dict):
                    continue
                retry_delay = detail.get("retryDelay")
                if isinstance(retry_delay, str) and retry_delay.endswith("s"):
                    try:
                        return float(retry_delay[:-1]) + RATE_LIMIT_RETRY_BUFFER_SECONDS
                    except ValueError:
                        break

    return RATE_LIMIT_FALLBACK_DELAY_SECONDS


def _generate_structured_content(
    client: genai.Client,
    complaint_text: str,
) -> Any:
    for attempt in range(3):
        try:
            return client.models.generate_content(
                model=_get_model_name(),
                contents=build_extraction_prompt(complaint_text),
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=_gemini_response_schema(),
                ),
            )
        except errors.APIError as exc:
            if attempt == 2:
                raise

            if isinstance(exc, errors.ClientError):
                retry_delay = _rate_limit_retry_delay_seconds(exc)
                if retry_delay is None or retry_delay > 10.0:
                    raise
                time.sleep(retry_delay)
            elif isinstance(exc, errors.ServerError):
                time.sleep(5.0)
            else:
                raise

    raise GeminiExtractionError("Gemini complaint extraction retry did not complete.")


def classify_complaint(text: str) -> CivicComplaint:
    """Classify complaint text with Gemini and return a validated complaint."""
    complaint_text = _validate_input(text)
    client = _create_client()
    try:
        response = _generate_structured_content(client, complaint_text)
    except errors.ClientError as exc:
        if exc.code == 429:
            raise GeminiExtractionError(
                f"Gemini quota exhausted (HTTP 429). "
                f"Retry after the daily free-tier limit resets, or add billing."
            ) from exc
        raise GeminiExtractionError(
            f"Gemini API client error (HTTP {exc.code}): {exc.message}"
        ) from exc
    except errors.ServerError as exc:
        raise GeminiExtractionError(
            f"Gemini API server error (HTTP {exc.code}). Try again later."
        ) from exc
    except GeminiExtractionError:
        raise
    except Exception as exc:
        raise GeminiExtractionError(
            f"Gemini complaint extraction failed: {type(exc).__name__}: {exc}"
        ) from exc
    return _parse_structured_response(response)
