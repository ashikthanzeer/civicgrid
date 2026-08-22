"""Pydantic models for the CivicGrid REST API (separate from AI extraction schemas)."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

# Match the frontend ComplaintStatus type
ComplaintStatusLiteral = Literal["New", "Under Review", "Assigned", "In Progress", "Resolved"]


class SubmitComplaintIn(BaseModel):
    text: str = Field(min_length=20, max_length=2000, description="Complaint description in plain language")
    location: str = Field(min_length=1, max_length=100, description="Ward or location name")
    latitude: float | None = Field(default=None, description="Optional geographic latitude")
    longitude: float | None = Field(default=None, description="Optional geographic longitude")


class UpdateStatusIn(BaseModel):
    status: ComplaintStatusLiteral = Field(description="New complaint status")


class ComplaintOut(BaseModel):
    id: str
    raw_text: str
    category: str
    subcategory: str
    severity: str
    urgency: str
    location: str
    affected_facility: str
    summary: str
    status: str
    created_at: str
    updated_at: str
    latitude: float | None = None
    longitude: float | None = None


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
