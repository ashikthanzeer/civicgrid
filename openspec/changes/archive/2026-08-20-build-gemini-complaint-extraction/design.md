## Context

CivicGrid currently has a frontend MVP but no backend extraction boundary. This change adds a standalone Python 3.11+ module under `backend/` that future FastAPI code can import without taking on HTTP, persistence, authentication, or analytics responsibilities.

The module depends on the current official `google-genai` SDK, Pydantic, `python-dotenv`, and pytest. Gemini must return a response constrained by the complaint schema through structured output; application code must validate the SDK result as a `CivicComplaint` before returning it.

## Goals / Non-Goals

**Goals:**

- Expose a small synchronous `classify_complaint(text: str) -> CivicComplaint` API.
- Constrain category, severity, and urgency at the schema boundary.
- Support English and Malayalam complaint meaning without a translation pipeline.
- Preserve missing location/facility information as `Unknown` rather than hallucinating.
- Produce clear errors for invalid input, missing credentials, API failures, and invalid structured responses.
- Make unit tests credential-free and live integration tests explicitly opt in.

**Non-Goals:**

- FastAPI routes, request/response models, Firestore, authentication, dashboards, analytics, deployment, or frontend changes.
- Local rule-based classification, regex extraction, manual text splitting, or parsing unstructured model prose.
- Silent fallback data when Gemini is unavailable.

## Decisions

- **Use `google-genai` with Gemini structured output and a Pydantic response schema.** The SDK's typed/schema support keeps response shape enforcement at the model boundary and avoids treating free-form prose as JSON. The deprecated `google-generativeai` package and manual `json.loads()` parsing are excluded.
- **Use enums for the category taxonomy, severity, and urgency.** This prevents arbitrary top-level categories and invalid priority labels from entering the integration boundary. Free-form strings remain appropriate for subcategory, location, facility, and summary because those values need to express complaint-specific detail.
- **Keep prompt construction in `prompts.py` and client orchestration in `gemini.py`.** Prompt text is independently unit-testable, while configuration, input validation, SDK invocation, and final Pydantic validation remain in one small integration module.
- **Load configuration with `python-dotenv` without embedding secrets.** `.env.example` documents `GEMINI_API_KEY` and a documented supported default model. The API key is read only from the process environment after dotenv loading; missing configuration raises an actionable exception.
- **Use opt-in pytest integration tests.** Unit tests validate schema, prompt, and local failure behavior without network access. Live examples are marked `integration` and skipped when `GEMINI_API_KEY` is absent, with a separate command for running them deliberately.
- **Represent missing extracted values as the literal `Unknown`.** The prompt and schema documentation give Gemini a deterministic value for absent location or facility data while retaining the exact seven-field public object contract.

## Risks / Trade-offs

- [Gemini model availability or SDK response API can change] -> Pin a compatible `google-genai` dependency range, isolate SDK calls in `gemini.py`, and run opt-in integration tests against the documented model.
- [Model classification can still be semantically imperfect] -> Provide explicit taxonomy, severity/urgency definitions, multilingual guidance, examples, and validate every returned object.
- [Network/API failures make integration tests nondeterministic] -> Keep normal tests offline and mark live tests as `integration`; surface failures instead of returning fabricated data.
- [A synchronous API may block a future web request] -> Keep the function stateless and isolated so a later FastAPI layer can move the call to an appropriate worker or async boundary without changing the schema contract.

## Migration Plan

1. Install the backend requirements and copy `.env.example` to `.env` with a valid key.
2. Run unit tests, then run marked integration tests when API access is available.
3. Import `classify_complaint` from future backend code and serialize the returned model with `model_dump()`.
4. Rollback consists of removing the new `backend/` module and dependency/configuration additions; no existing data or routes are migrated.

## Open Questions

- Confirm the preferred production Gemini model at deployment time if the documented current default changes before integration.
- Decide whether the future FastAPI layer should invoke this synchronous function in a worker or replace it with an async wrapper.
