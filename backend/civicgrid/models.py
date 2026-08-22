"""Pydantic models for the CivicGrid REST API (separate from AI extraction schemas)."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

# Match the frontend ComplaintStatus type
ComplaintStatusLiteral = Literal["New", "Under Review", "Assigned", "In Progress", "Resolved", "Rejected / Spam"]


class SubmitComplaintIn(BaseModel):
    text: str = Field(min_length=20, max_length=2000, description="Complaint description in plain language")
    location: str = Field(min_length=1, max_length=100, description="Ward or location name")
    latitude: float | None = Field(default=None, description="Optional geographic latitude")
    longitude: float | None = Field(default=None, description="Optional geographic longitude")
    image_b64: str | None = Field(default=None, description="Optional base64 image data for multimodal vision")


class UpdateStatusIn(BaseModel):
    status: ComplaintStatusLiteral = Field(description="New complaint status")


class ComplaintOut(BaseModel):
    id: str
    raw_text: str = ""
    category: str = "Other"
    subcategory: str = "General Civic Issue"
    severity: str = "Medium"
    urgency: str = "Routine"
    location: str = "Unknown"
    affected_facility: str = "Unknown"
    summary: str = ""
    status: str = "New"
    created_at: str = ""
    updated_at: str = ""
    latitude: float | None = None
    longitude: float | None = None
    image_url: str | None = None
    image_analysis: str | None = None
    is_duplicate: bool = False
    duplicate_of_id: str | None = None


class SubmitComplaintResponse(BaseModel):
    success: bool = True
    complaint: ComplaintOut


class ListComplaintsResponse(BaseModel):
    complaints: list[ComplaintOut]
    total: int


class StatsResponse(BaseModel):
    total: int
    by_status: dict[str, int]
    by_category: dict[str, int]
    by_severity: dict[str, int]


class OfficerLoginIn(BaseModel):
    officer_id: str = Field(min_length=1, description="Unique Officer Identification Code")
    password: str = Field(min_length=1, description="Officer Password")


class OfficerLoginOut(BaseModel):
    success: bool
    officer_id: str
    name: str
    department: str
    token: str


class ChangePasswordIn(BaseModel):
    officer_id: str = Field(min_length=1, description="Unique Officer Identification Code")
    old_password: str = Field(min_length=1, description="Current Officer Password")
    new_password: str = Field(min_length=6, description="New Officer Password")


class ChangePasswordOut(BaseModel):
    success: bool
    message: str
