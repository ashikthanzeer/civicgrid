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
    TranslateTextIn,
    TranslateTextOut,
    AssignComplaintIn,
    ResolveComplaintIn,
    VerifyComplaintIn,
    TimelineEventOut,
    ResolutionOut,
    VerificationOut,
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

# Robust CORS middleware configuration supporting Vercel and Render deployments
_cors_env = os.getenv("CORS_ORIGINS", "").strip()
_allowed_origins = [o.strip() for o in _cors_env.split(",") if o.strip()] if _cors_env and _cors_env != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.onrender\.com|http://localhost:\d+",
    allow_credentials=True if _allowed_origins != ["*"] else False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.options("/{full_path:path}", include_in_schema=False)
async def options_preflight_handler(full_path: str):  # noqa: ARG001
    """Global OPTIONS preflight handler to prevent 405 CORS issues."""
    return {}


from fastapi.responses import JSONResponse
from fastapi.requests import Request
from starlette.exceptions import HTTPException as StarletteHTTPException

def _add_cors_headers(request: Request, response: JSONResponse) -> JSONResponse:
    origin = request.headers.get("origin")
    if origin:
        response.headers["access-control-allow-origin"] = origin
        response.headers["access-control-allow-credentials"] = "true"
        response.headers["access-control-allow-methods"] = "*"
        response.headers["access-control-allow-headers"] = "*"
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception: %s", exc, exc_info=True)
    response = JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred. Please try again later."},
    )
    return _add_cors_headers(request, response)


@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
    return _add_cors_headers(request, response)



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

    # ALWAYS prioritize user-input location over AI extraction
    location = req.location.strip() if (req.location and req.location.strip() != "") else classification.location

    # Auto-flag as Rejected / Spam if Gemini detects gibberish or inappropriate content
    is_spam = classification.is_spam or classification.category.value == "Spam / Invalid"
    status = "Rejected / Spam" if is_spam else "New"

    # Check for duplicate open complaints at the same landmark / pincode / location & category
    is_duplicate = False
    duplicate_of_id = None
    if not is_spam and location not in ("", "Unknown"):
        matching_cand = db.find_matching_duplicate_complaint(
            location=location,
            category=classification.category.value,
            latitude=req.latitude,
            longitude=req.longitude,
        )
        if matching_cand:
            cand_sub = (matching_cand.get("subcategory") or "").lower()
            new_sub = (classification.subcategory or "").lower()
            if new_sub in cand_sub or cand_sub in new_sub or classification.category.value != "Other":
                is_duplicate = True
                duplicate_of_id = matching_cand["id"]

    # If duplicate, MERGE into the original complaint and escalate support count & priority
    if is_duplicate and duplicate_of_id:
        merged_row = db.merge_duplicate_into_original(
            original_id=duplicate_of_id,
            new_text=req.text,
            image_url=req.image_b64 if req.image_b64 else None,
            new_severity=classification.severity.value,
            new_urgency=classification.urgency.value,
        )
        if merged_row:
            cleaned = _clean_complaint(merged_row)
            cleaned.is_duplicate = True
            cleaned.duplicate_of_id = duplicate_of_id
            return SubmitComplaintResponse(success=True, complaint=cleaned)

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
        is_duplicate=False,
        duplicate_of_id=None,
        detected_language=getattr(classification, "detected_language", "English"),
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


from fastapi.responses import PlainTextResponse

@app.get(
    "/api/reports/policy-brief",
    response_class=PlainTextResponse,
    summary="Generate AI policy brief",
    tags=["reports"],
)
def get_policy_brief() -> str:
    """Generate an AI-driven policy brief from stats and hotspots."""
    stats = db.get_stats()
    hotspots = db.get_critical_hotspots(limit=10)
    
    from .gemini import generate_policy_brief
    return generate_policy_brief(stats, hotspots)


def _clean_complaint(row: dict) -> ComplaintOut:
    """Safely sanitize database row to prevent Pydantic 422 validation errors."""
    try:
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

        # Safely cast citizen_reports_count to int
        try:
            cleaned["citizen_reports_count"] = int(cleaned.get("citizen_reports_count") or 1)
        except (ValueError, TypeError):
            cleaned["citizen_reports_count"] = 1

        # Remove None values for string fields so Pydantic schema defaults kick in
        for k in list(cleaned.keys()):
            if cleaned[k] is None and k not in ("latitude", "longitude", "image_url", "image_analysis", "duplicate_of_id"):
                del cleaned[k]

        return ComplaintOut(**cleaned)
    except Exception as exc:
        logger.warning("Failed to clean complaint row %s: %s", row.get("id"), exc)
        return ComplaintOut(
            id=str(row.get("id", "COMP-2026-0000")),
            raw_text=str(row.get("raw_text", "")),
            category=str(row.get("category", "Other")),
            subcategory=str(row.get("subcategory", "General Civic Issue")),
            severity="Medium",
            urgency="Routine",
            location=str(row.get("location", "Unknown")),
            affected_facility=str(row.get("affected_facility", "Unknown")),
            summary=str(row.get("summary", "")),
            status=str(row.get("status", "New")),
            created_at=str(row.get("created_at", "")),
            updated_at=str(row.get("updated_at", "")),
        )


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
@app.delete(
    "/api/complaints/{complaint_id}",
    summary="Permanently delete complaint (Officer only)",
    tags=["complaints"],
)
def delete_complaint(complaint_id: str) -> dict:
    """Physically remove a complaint entry."""
    success = db.delete_complaint(complaint_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Complaint '{complaint_id}' not found.")
    return {"success": True, "message": f"Complaint '{complaint_id}' deleted."}


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


@app.post(
    "/api/translate",
    response_model=TranslateTextOut,
    summary="Translate text to another language using Gemini AI",
    tags=["translation"],
)
def translate_text_endpoint(req: TranslateTextIn) -> TranslateTextOut:
    """Translate civic complaint text or summary to target language using stored source language or auto-detection."""
    from .gemini import translate_text
    result = translate_text(req.text, req.target_language, req.source_language)
    return TranslateTextOut(
        original_text=req.text,
        translated_text=result["translated_text"],
        target_language=result["target_language"],
        detected_language=result["source_language"],
    )


@app.get(
    "/api/tts",
    summary="Generate high-quality native audio stream for regional languages",
    tags=["translation"],
)
async def tts_endpoint(text: str = Query(..., max_length=1000), lang: str = Query("en", max_length=10)):
    """Return high-quality native MP3 audio stream for Malayalam and Indian regional languages."""
    import urllib.parse
    import httpx
    from fastapi.responses import Response

    lang_code = lang.lower().split("-")[0]
    encoded_text = urllib.parse.quote(text[:500])
    google_tts_url = f"https://translate.google.com/translate_tts?ie=UTF-8&tl={lang_code}&client=tw-ob&q={encoded_text}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(google_tts_url, headers=headers)
            if resp.status_code == 200 and resp.content:
                return Response(
                    content=resp.content,
                    media_type="audio/mpeg",
                    headers={
                        "Cache-Control": "public, max-age=86400",
                        "Accept-Ranges": "bytes",
                    },
                )
    except Exception as exc:
        logger.warning("TTS audio fetch failed for %s: %s", lang, exc)

    raise HTTPException(status_code=502, detail="TTS service temporarily unavailable")


@app.get(
    "/api/complaints/track/{tracking_token}",
    summary="Track complaint by public tracking token or ID",
    tags=["tracking"],
)
def track_complaint(tracking_token: str) -> dict:
    row = db.get_complaint_by_tracking_token(tracking_token)
    if not row:
        raise HTTPException(status_code=404, detail="Invalid or expired tracking token.")

    complaint_id = row["id"]
    events = db.get_complaint_events(complaint_id)
    resolution = db.get_resolution(complaint_id)
    verification = db.get_verification(complaint_id)

    return {
        "complaint": _clean_complaint(row),
        "events": events,
        "resolution": resolution,
        "verification": verification,
    }


@app.post(
    "/api/complaints/{complaint_id}/assign",
    response_model=ComplaintOut,
    summary="Assign complaint to department, ward, and officer (Officer only)",
    tags=["lifecycle"],
)
def assign_complaint_endpoint(complaint_id: str, req: AssignComplaintIn) -> ComplaintOut:
    row = db.assign_complaint(
        complaint_id=complaint_id,
        department=req.department,
        ward=req.ward,
        assigned_to=req.assigned_to,
        sla_hours=req.sla_hours,
        actor="Officer",
    )
    if not row:
        raise HTTPException(status_code=404, detail=f"Complaint '{complaint_id}' not found.")
    return _clean_complaint(row)


@app.post(
    "/api/complaints/{complaint_id}/resolve",
    response_model=ComplaintOut,
    summary="Submit resolution proof and mark as Resolved (Officer only)",
    tags=["lifecycle"],
)
def resolve_complaint_endpoint(complaint_id: str, req: ResolveComplaintIn) -> ComplaintOut:
    row = db.submit_resolution(
        complaint_id=complaint_id,
        note=req.note,
        evidence_image=req.evidence_image,
        actor="Officer",
    )
    if not row:
        raise HTTPException(status_code=404, detail=f"Complaint '{complaint_id}' not found.")
    return _clean_complaint(row)


@app.post(
    "/api/complaints/{complaint_id}/verify",
    response_model=ComplaintOut,
    summary="Submit citizen verification feedback (Public/Citizen)",
    tags=["lifecycle"],
)
def verify_complaint_endpoint(complaint_id: str, req: VerifyComplaintIn) -> ComplaintOut:
    try:
        row = db.verify_resolution(
            complaint_id=complaint_id,
            result=req.result,
            feedback=req.feedback,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if not row:
        raise HTTPException(status_code=404, detail=f"Complaint '{complaint_id}' not found.")
    return _clean_complaint(row)


@app.get(
    "/api/complaints/{complaint_id}/timeline",
    response_model=list[TimelineEventOut],
    summary="Get chronological timeline events for a complaint",
    tags=["lifecycle"],
)
def get_complaint_timeline_endpoint(complaint_id: str) -> list[TimelineEventOut]:
    events = db.get_complaint_events(complaint_id)
    return [TimelineEventOut(**e) for e in events]


@app.get("/api/health", summary="Health check", tags=["system"])
def health() -> dict:
    return {"status": "ok", "version": "1.0.0"}


