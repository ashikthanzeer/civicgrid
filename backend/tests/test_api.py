"""
API endpoint tests — credential-free using MockClassifier.

These tests exercise the FastAPI routes, database layer, and request
validation. No Gemini API key is required.
"""
from __future__ import annotations

import os
import tempfile

import pytest
from fastapi.testclient import TestClient

# Force MockClassifier and local isolated SQLite for all tests in this module
os.environ["USE_MOCK_CLASSIFIER"] = "true"
os.environ["DATABASE_URL"] = ""

# Use an isolated temp database so tests don't pollute production data
_tmpdir = tempfile.mkdtemp()
os.environ["CIVICGRID_DB_PATH"] = os.path.join(_tmpdir, "test.db")

from civicgrid.api import app  # noqa: E402 — env must be set before import
from civicgrid import database as db  # noqa: E402


@pytest.fixture(autouse=True)
def fresh_db():
    """Re-initialise the database before every test."""
    db.init_db()
    yield
    # Teardown: delete all rows so tests are isolated
    import sqlite3
    conn = sqlite3.connect(os.environ["CIVICGRID_DB_PATH"])
    conn.execute("DELETE FROM complaints")
    conn.commit()
    conn.close()


client = TestClient(app)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# Submit complaint
# ---------------------------------------------------------------------------

def test_submit_complaint_returns_201():
    r = client.post("/api/complaints", json={"text": "The road near the school has a deep pothole.", "location": "Ward 7"})
    assert r.status_code == 201
    body = r.json()
    assert body["success"] is True
    complaint = body["complaint"]
    assert complaint["id"].startswith("COMP-")
    assert complaint["raw_text"] == "The road near the school has a deep pothole."
    assert complaint["status"] == "New"
    assert "created_at" in complaint
    assert "updated_at" in complaint


def test_submit_complaint_text_too_short_returns_422():
    r = client.post("/api/complaints", json={"text": "short", "location": "Ward 1"})
    assert r.status_code == 422


def test_submit_complaint_missing_location_returns_422():
    r = client.post("/api/complaints", json={"text": "The road near the school has a deep pothole."})
    assert r.status_code == 422


def test_submit_complaint_persists_in_database():
    client.post("/api/complaints", json={"text": "Garbage not collected for 5 days in our area.", "location": "Ward 3"})
    complaints, total = db.list_complaints()
    assert total == 1
    assert complaints[0]["raw_text"] == "Garbage not collected for 5 days in our area."


# ---------------------------------------------------------------------------
# List complaints
# ---------------------------------------------------------------------------

def test_list_complaints_empty():
    r = client.get("/api/complaints")
    assert r.status_code == 200
    body = r.json()
    assert body["complaints"] == []
    assert body["total"] == 0


def test_list_complaints_returns_submitted():
    client.post("/api/complaints", json={"text": "Streetlight broken near the market for a week.", "location": "Ward 5"})
    r = client.get("/api/complaints")
    assert r.status_code == 200
    assert r.json()["total"] == 1


def test_list_complaints_search_filter():
    client.post("/api/complaints", json={"text": "Pothole on the main road near the hospital gate.", "location": "Ward 2"})
    client.post("/api/complaints", json={"text": "Electricity outage every evening for three hours.", "location": "Ward 4"})

    r = client.get("/api/complaints", params={"search": "pothole"})
    assert r.status_code == 200
    assert r.json()["total"] == 1


# ---------------------------------------------------------------------------
# Get complaint by ID
# ---------------------------------------------------------------------------

def test_get_complaint_by_id():
    submit = client.post("/api/complaints", json={"text": "Water pipe burst on the main road near Ward 9 junction.", "location": "Ward 9"})
    complaint_id = submit.json()["complaint"]["id"]

    r = client.get(f"/api/complaints/{complaint_id}")
    assert r.status_code == 200
    assert r.json()["id"] == complaint_id


def test_get_complaint_not_found_returns_404():
    r = client.get("/api/complaints/DOES-NOT-EXIST")
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# Update status
# ---------------------------------------------------------------------------

def test_update_status():
    submit = client.post("/api/complaints", json={"text": "Broken drain cover flooding our street every time it rains.", "location": "Ward 6"})
    complaint_id = submit.json()["complaint"]["id"]

    r = client.patch(f"/api/complaints/{complaint_id}", json={"status": "In Progress"})
    assert r.status_code == 200
    assert r.json()["status"] == "In Progress"


def test_update_status_invalid_returns_422():
    submit = client.post("/api/complaints", json={"text": "No water supply in our area for the last two days.", "location": "Ward 10"})
    complaint_id = submit.json()["complaint"]["id"]

    r = client.patch(f"/api/complaints/{complaint_id}", json={"status": "InvalidStatus"})
    assert r.status_code == 422


def test_update_status_not_found_returns_404():
    r = client.patch("/api/complaints/DOES-NOT-EXIST", json={"status": "Resolved"})
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

def test_stats_empty():
    r = client.get("/api/complaints/stats")
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 0
    assert body["by_status"] == {}


def test_stats_after_submission():
    client.post("/api/complaints", json={"text": "Tree fell on the road blocking traffic for hours.", "location": "Ward 11"})
    client.post("/api/complaints", json={"text": "Public toilet near the bus stand is locked and broken.", "location": "Ward 12"})

    r = client.get("/api/complaints/stats")
    body = r.json()
    assert body["total"] == 2
    assert body["by_status"].get("New", 0) == 2


def test_duplicate_complaint_merges_and_escalates_priority():
    r1 = client.post("/api/complaints", json={"text": "Water pipeline burst on main road causing severe flooding.", "location": "Ward 7"})
    assert r1.status_code == 201
    orig_id = r1.json()["complaint"]["id"]

    r2 = client.post("/api/complaints", json={"text": "Another report of water pipeline burst flooding Ward 7.", "location": "Ward 7"})
    assert r2.status_code == 201
    body2 = r2.json()["complaint"]
    assert body2["is_duplicate"] is True
    assert body2["duplicate_of_id"] == orig_id
    assert body2["citizen_reports_count"] == 2


def test_fuzzy_landmark_pincode_duplicate_matching():
    r1 = client.post("/api/complaints", json={"text": "Garbage dumping near the main market complex.", "location": "MG Road, Indiranagar, Jaipur 302006"})
    assert r1.status_code == 201
    orig_id = r1.json()["complaint"]["id"]

    r2 = client.post("/api/complaints", json={"text": "Overflowing trash bin near MG Road market area.", "location": "Near MG Road, 302006"})
    assert r2.status_code == 201
    body2 = r2.json()["complaint"]
    assert body2["is_duplicate"] is True
    assert body2["duplicate_of_id"] == orig_id
    assert body2["citizen_reports_count"] == 2


def test_translate_endpoint():
    r = client.post("/api/translate", json={"text": "Water leakage on Main Street", "target_language": "hi"})
    assert r.status_code == 200
    body = r.json()
    assert body["original_text"] == "Water leakage on Main Street"
    assert body["target_language"] == "hi"
    assert len(body["translated_text"]) > 0


def test_tts_endpoint():
    r = client.get("/api/tts", params={"text": "Test", "lang": "ml"})
    print("TTS STATUS:", r.status_code, "CONTENT_TYPE:", r.headers.get("content-type"), "LEN:", len(r.content))
    assert r.status_code in (200, 502)





