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
    OfficerLoginIn,
    OfficerLoginOut,
    ChangePasswordIn,
    ChangePasswordOut,
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

# Configurable CORS origins with public API defaults (* or specific domains)
_cors_env = os.getenv("CORS_ORIGINS", "").strip()
if _cors_env and _cors_env != "*":
    _allowed_origins = [o.strip() for o in _cors_env.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_allowed_origins,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Default: allow all origins for public civic reporting & Vercel deployments
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
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
        classification = classifier.classify(req.text, image_b64=req.image_b64)
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

    # Auto-flag as Rejected / Spam if Gemini detects gibberish or inappropriate content
    is_spam = classification.is_spam or classification.category.value == "Spam / Invalid"
    status = "Rejected / Spam" if is_spam else "New"

    row = db.insert_complaint(
        raw_text=req.text,
        category=classification.category.value,
        subcategory=classification.subcategory,
        severity=classification.severity.value,
        urgency=classification.urgency.value,
        location=location,
        affected_facility=classification.affected_facility,
        summary=classification.summary,
        status=status,
        latitude=req.latitude,
        longitude=req.longitude,
        image_url=req.image_b64 if req.image_b64 else None,
        image_analysis=classification.image_analysis,
    )
    return SubmitComplaintResponse(success=True, complaint=_clean_complaint(row))


@app.get(
    "/api/complaints/stats",
    response_model=StatsResponse,
    summary="Aggregate complaint statistics",
    tags=["complaints"],
)
def get_stats() -> StatsResponse:
    """Return total count and breakdowns by status, category, and severity."""
    return StatsResponse(**db.get_stats())


def _clean_complaint(row: dict) -> ComplaintOut:
    """Safely sanitize database row to prevent Pydantic 422 validation errors."""
    cleaned = dict(row)

    # Safely cast latitude / longitude
    for coord in ("latitude", "longitude"):
        val = cleaned.get(coord)
        if val is not None:
            try:
                cleaned[coord] = float(val)
            except (ValueError, TypeError):
                cleaned[coord] = None
        else:
            cleaned[coord] = None

    # Remove None values for string fields so Pydantic schema defaults kick in
    for k in list(cleaned.keys()):
        if cleaned[k] is None and k not in ("latitude", "longitude", "image_url", "image_analysis"):
            del cleaned[k]

    return ComplaintOut(**cleaned)


def _to_list(val: list[str] | str | None) -> list[str] | None:
    if val is None or val == "":
        return None
    if isinstance(val, str):
        return [s.strip() for s in val.split(",") if s.strip()]
    return val


@app.get(
    "/api/complaints",
    response_model=ListComplaintsResponse,
    summary="List complaints with filtering, sorting, and pagination",
    tags=["complaints"],
)
def list_complaints(
    status: list[str] | str | None = Query(None, description="Filter by status"),
    category: list[str] | str | None = Query(None, description="Filter by category"),
    severity: list[str] | str | None = Query(None, description="Filter by severity"),
    location: list[str] | str | None = Query(None, description="Filter by location"),
    search: str | None = Query(None, description="Full-text search"),
    sort: str = Query("newest", description="newest|oldest|highest_severity|highest_urgency"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> ListComplaintsResponse:
    rows, total = db.list_complaints(
        status=_to_list(status),
        category=_to_list(category),
        severity=_to_list(severity),
        location=_to_list(location),
        search=search,
        sort=sort,
        skip=skip,
        limit=limit,
    )
    return ListComplaintsResponse(
        complaints=[_clean_complaint(r) for r in rows],
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
    return _clean_complaint(row)


@app.api_route(
    "/api/complaints/{complaint_id}",
    methods=["PATCH", "PUT"],
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
    return _clean_complaint(row)


@app.post(
    "/api/officer/login",
    response_model=OfficerLoginOut,
    summary="Authenticate Municipal Officer with ID and password",
    tags=["officer"],
)
def officer_login(req: OfficerLoginIn) -> OfficerLoginOut:
    profile = db.verify_officer_credentials(req.officer_id, req.password)
    if not profile:
        raise HTTPException(status_code=401, detail="Invalid Officer ID or Password.")
    return OfficerLoginOut(
        success=True,
        officer_id=profile["officer_id"],
        name=profile["name"],
        department=profile["department"],
        token=f"officer_token_{profile['officer_id']}",
    )


@app.post(
    "/api/officer/change-password",
    response_model=ChangePasswordOut,
    summary="Change Municipal Officer password",
    tags=["officer"],
)
def change_password(req: ChangePasswordIn) -> ChangePasswordOut:
    success = db.update_officer_password(req.officer_id, req.old_password, req.new_password)
    if not success:
        raise HTTPException(status_code=400, detail="Password change failed. Check your current password.")
    return ChangePasswordOut(success=True, message="Officer password successfully updated.")


@app.get("/api/health", summary="Health check", tags=["system"])
def health() -> dict:
    return {"status": "ok", "version": "1.0.0"}
