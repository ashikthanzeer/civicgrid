"""
Classifier abstraction — decouples the application from the Gemini SDK.

The rest of CivicGrid depends only on the Classifier Protocol, not on the
google-genai SDK directly. This makes tests fast and deterministic.
"""
from __future__ import annotations

import os
from typing import Protocol, runtime_checkable

from .schemas import CivicComplaint, ComplaintCategory, Severity, Urgency


@runtime_checkable
class Classifier(Protocol):
    """Classifies plain-text civic complaint into a structured CivicComplaint."""

    def classify(self, text: str) -> CivicComplaint:
        ...


class GeminiClassifier:
    """Production classifier backed by the Gemini API."""

    def classify(self, text: str) -> CivicComplaint:
        from .gemini import classify_complaint
        return classify_complaint(text)


class MockClassifier:
    """
    Deterministic classifier for tests and offline development.

    Returns a valid CivicComplaint using the first 120 chars of the text
    as the summary. Category is always Other so tests can override easily.
    """

    def classify(self, text: str) -> CivicComplaint:
        summary = text.strip()
        if len(summary) > 120:
            summary = summary[:117] + "..."
        return CivicComplaint(
            category=ComplaintCategory.OTHER,
            subcategory="General Civic Issue",
            severity=Severity.MEDIUM,
            urgency=Urgency.ROUTINE,
            location="Unknown",
            affected_facility="Unknown",
            summary=summary,
        )


def make_classifier() -> Classifier:
    """
    Factory — returns the appropriate classifier based on environment.

    Uses MockClassifier when:
      - USE_MOCK_CLASSIFIER=true  (explicit override)
      - GEMINI_API_KEY is absent or empty
    Uses GeminiClassifier otherwise.
    """
    from dotenv import load_dotenv
    load_dotenv()

    if os.getenv("USE_MOCK_CLASSIFIER", "").lower() == "true":
        return MockClassifier()

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return MockClassifier()

    return GeminiClassifier()
