"""CivicGrid FastAPI application."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from . import database as db
from .classifier import make_classifier
from .gemini import ComplaintInputError, GeminiConfigurationError, GeminiExtractionError
from .models import (
    ComplaintOut,
    ListComplaintsResponse,
    StatsResponse,
    SubmitComplaintIn,
    SubmitComplaintResponse,
    UpdateStatusIn,
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(application: FastAPI):  # noqa: ARG001
    db.init_db()
    yield


app = FastAPI(
    title="CivicGrid API",
    version="1.0.0",
    description="Civic complaint intelligence platform",
    lifespan=lifespan,
)

import os

# Configurable CORS origins with safe development defaults
_cors_env = os.getenv("CORS_ORIGINS", "")
_allowed_origins = [o.strip() for o in _cors_env.split(",") if o.strip()] or [
    "http://localhost:5173",  # Vite dev
    "http://localhost:4173",  # Vite preview
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.post(
    "/api/complaints",
    response_model=SubmitComplaintResponse,
    status_code=201,
    summary="Submit a new civic complaint",
    tags=["complaints"],
)
def submit_complaint(req: SubmitComplaintIn) -> SubmitComplaintResponse:
    """
    Classify complaint text with Gemini and persist the result.

    Falls back to MockClassifier when GEMINI_API_KEY is absent or
    USE_MOCK_CLASSIFIER=true.
    """
    classifier = make_classifier()
    try:
        classification = classifier.classify(req.text)
    except ComplaintInputError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except GeminiConfigurationError as exc:
        logger.error("Gemini configuration error: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Classification service is not configured. Please contact support.",
        ) from exc
    except GeminiExtractionError as exc:
        logger.warning("Gemini extraction error: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Classification service is temporarily unavailable. Please try again shortly.",
        ) from exc
    except Exception as exc:
        logger.error("Unexpected classifier error: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred.") from exc

    # Prefer AI-extracted location; fall back to user-provided.
    location = classification.location if classification.location not in ("", "Unknown") else req.location

    row = db.insert_complaint(
        raw_text=req.text,
        category=classification.category.value,
        subcategory=classification.subcategory,
        severity=classification.severity.value,
        urgency=classification.urgency.value,
        location=location,
        affected_facility=classification.affected_facility,
        summary=classification.summary,
    )
    return SubmitComplaintResponse(success=True, complaint=ComplaintOut(**row))


@app.get(
    "/api/complaints/stats",
    response_model=StatsResponse,
    summary="Aggregate complaint statistics",
    tags=["complaints"],
)
def get_stats() -> StatsResponse:
    """Return total count and breakdowns by status, category, and severity."""
    return StatsResponse(**db.get_stats())


@app.get(
    "/api/complaints",
    response_model=ListComplaintsResponse,
    summary="List complaints with filters",
    tags=["complaints"],
)
def list_complaints(
    status: Annotated[list[str] | None, Query(description="Filter by status")] = None,
    category: Annotated[list[str] | None, Query(description="Filter by category")] = None,
    severity: Annotated[list[str] | None, Query(description="Filter by severity")] = None,
    location: Annotated[list[str] | None, Query(description="Filter by location")] = None,
    search: Annotated[str | None, Query(description="Full-text search")] = None,
    sort: Annotated[str, Query(description="newest|oldest|highest_severity|highest_urgency")] = "newest",
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
) -> ListComplaintsResponse:
    rows, total = db.list_complaints(
        status=status,
        category=category,
        severity=severity,
        location=location,
        search=search,
        sort=sort,
        skip=skip,
        limit=limit,
    )
    return ListComplaintsResponse(
        complaints=[ComplaintOut(**r) for r in rows],
        total=total,
    )


@app.get(
    "/api/complaints/{complaint_id}",
    response_model=ComplaintOut,
    summary="Get complaint by ID",
    tags=["complaints"],
)
def get_complaint(complaint_id: str) -> ComplaintOut:
    row = db.get_complaint(complaint_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Complaint '{complaint_id}' not found.")
    return ComplaintOut(**row)


@app.patch(
    "/api/complaints/{complaint_id}",
    response_model=ComplaintOut,
    summary="Update complaint status",
    tags=["complaints"],
)
def update_complaint(complaint_id: str, req: UpdateStatusIn) -> ComplaintOut:
    """Update the status of an existing complaint."""
    try:
        row = db.update_complaint_status(complaint_id, req.status)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if not row:
        raise HTTPException(status_code=404, detail=f"Complaint '{complaint_id}' not found.")
    return ComplaintOut(**row)


@app.get("/api/health", summary="Health check", tags=["system"])
def health() -> dict:
    return {"status": "ok", "version": "1.0.0"}
