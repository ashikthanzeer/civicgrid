"""
Persistence layer for CivicGrid complaints.
Supports both SQLite (local/testing default) and PostgreSQL (Supabase, Neon, Render).
Automatically detects DATABASE_URL in environment.
"""
from __future__ import annotations

import os
import sqlite3
import threading
import json
from datetime import datetime, timezone
from typing import Any

_DB_PATH_DEFAULT = os.path.join(os.path.dirname(__file__), "..", "data", "civicgrid.db")
DB_PATH = os.environ.get("CIVICGRID_DB_PATH", _DB_PATH_DEFAULT)

_lock = threading.RLock()

_CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS complaints (
    id                TEXT PRIMARY KEY,
    raw_text          TEXT NOT NULL,
    category          TEXT NOT NULL,
    subcategory       TEXT NOT NULL,
    severity          TEXT NOT NULL,
    urgency           TEXT NOT NULL,
    location          TEXT NOT NULL,
    affected_facility TEXT NOT NULL,
    summary           TEXT NOT NULL,
    status            TEXT NOT NULL DEFAULT 'New',
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL,
    latitude          REAL,
    longitude         REAL,
    image_url         TEXT,
    image_analysis    TEXT,
    is_duplicate      INTEGER DEFAULT 0,
    duplicate_of_id   TEXT,
    citizen_reports_count INTEGER DEFAULT 1,
    additional_updates TEXT DEFAULT '[]',
    detected_language TEXT DEFAULT 'English'
);
CREATE INDEX IF NOT EXISTS idx_complaints_status   ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created  ON complaints(created_at);

CREATE TABLE IF NOT EXISTS officers (
    officer_id    TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    department    TEXT NOT NULL,
    created_at    TEXT NOT NULL
);
"""

VALID_STATUSES: frozenset[str] = frozenset(
    {"New", "Under Review", "Assigned", "In Progress", "Resolved", "Rejected / Spam"}
)
_ALLOWED_STATS_COLS: frozenset[str] = frozenset({"status", "category", "severity"})


def _get_database_url() -> str:
    return os.environ.get("DATABASE_URL", "").strip()


def _is_postgres() -> bool:
    url = _get_database_url()
    return url.startswith("postgresql://") or url.startswith("postgres://")


def _get_pg_conn():
    import psycopg
    from psycopg.rows import dict_row
    conn_url = _get_database_url()
    if conn_url.startswith("postgres://"):
        conn_url = "postgresql://" + conn_url[11:]
    return psycopg.connect(conn_url, row_factory=dict_row)


def _get_sqlite_conn() -> sqlite3.Connection:
    path = os.path.abspath(DB_PATH)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


import hashlib

_SALT = "civicgrid_salt_2026"


def hash_password(password: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), _SALT.encode("utf-8"), 100000).hex()


def _seed_officer(conn_or_cur, is_pg: bool):
    pw_hash = hash_password("password123")
    now = datetime.now(timezone.utc).isoformat()
    if is_pg:
        conn_or_cur.execute(
            """
            INSERT INTO officers (officer_id, password_hash, name, department, created_at)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (officer_id) DO NOTHING
            """,
            ("OFFICER-2026", pw_hash, "Officer R. Sharma", "Municipal Public Works", now),
        )
    else:
        conn_or_cur.execute(
            """
            INSERT OR IGNORE INTO officers (officer_id, password_hash, name, department, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            ("OFFICER-2026", pw_hash, "Officer R. Sharma", "Municipal Public Works", now),
        )


def init_db() -> None:
    """Create tables and indexes if they do not already exist."""
    with _lock:
        if _is_postgres():
            with _get_pg_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(_CREATE_TABLE_SQL)
                    cur.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS latitude REAL;")
                    cur.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS longitude REAL;")
                    cur.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS image_url TEXT;")
                    cur.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS image_analysis TEXT;")
                    cur.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS is_duplicate INTEGER DEFAULT 0;")
                    cur.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS duplicate_of_id TEXT;")
                    cur.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS citizen_reports_count INTEGER DEFAULT 1;")
                    cur.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS additional_updates TEXT DEFAULT '[]';")
                    cur.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS detected_language TEXT DEFAULT 'English';")
                    _seed_officer(cur, is_pg=True)
                conn.commit()
        else:
            conn = _get_sqlite_conn()
            try:
                conn.executescript(_CREATE_TABLE_SQL)
                # Migration for existing SQLite DBs
                for col in ["latitude REAL", "longitude REAL", "image_url TEXT", "image_analysis TEXT", "is_duplicate INTEGER DEFAULT 0", "duplicate_of_id TEXT", "citizen_reports_count INTEGER DEFAULT 1", "additional_updates TEXT DEFAULT '[]'", "detected_language TEXT DEFAULT 'English'"]:
                    try:
                        conn.execute(f"ALTER TABLE complaints ADD COLUMN {col}")
                    except sqlite3.OperationalError:
                        pass
                _seed_officer(conn, is_pg=False)
                conn.commit()
            finally:
                conn.close()


def _next_id_sqlite(conn: sqlite3.Connection) -> str:
    year = datetime.now(timezone.utc).year
    prefix = f"COMP-{year}-"
    row = conn.execute("SELECT MAX(id) FROM complaints WHERE id LIKE ?", (prefix + "%",)).fetchone()
    if row and row[0]:
        try:
            n = int(row[0].split("-")[-1]) + 1
        except (ValueError, IndexError):
            n = 1
    else:
        n = 1
    return f"{prefix}{n:04d}"


def _next_id_pg(conn) -> str:
    year = datetime.now(timezone.utc).year
    prefix = f"COMP-{year}-"
    with conn.cursor() as cur:
        cur.execute("SELECT MAX(id) FROM complaints WHERE id LIKE %s", (prefix + "%",))
        row = cur.fetchone()
        max_id = list(row.values())[0] if isinstance(row, dict) else row[0]
        if max_id:
            try:
                n = int(max_id.split("-")[-1]) + 1
            except (ValueError, IndexError):
                n = 1
        else:
            n = 1
        return f"{prefix}{n:04d}"


def insert_complaint(
    *,
    raw_text: str,
    category: str,
    subcategory: str,
    severity: str,
    urgency: str,
    location: str,
    affected_facility: str,
    summary: str,
    status: str = "New",
    latitude: float | None = None,
    longitude: float | None = None,
    image_url: str | None = None,
    image_analysis: str | None = None,
    is_duplicate: bool = False,
    duplicate_of_id: str | None = None,
    detected_language: str = "English",
) -> dict[str, Any]:
    """Insert a new complaint and return the full record."""
    now = datetime.now(timezone.utc).isoformat()
    is_dup_int = 1 if is_duplicate else 0
    with _lock:
        if _is_postgres():
            with _get_pg_conn() as conn:
                complaint_id = _next_id_pg(conn)
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO complaints
                          (id, raw_text, category, subcategory, severity, urgency,
                           location, affected_facility, summary, status, created_at, updated_at,
                           latitude, longitude, image_url, image_analysis, is_duplicate, duplicate_of_id, detected_language)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING *
                        """,
                        (
                            complaint_id,
                            raw_text,
                            category,
                            subcategory,
                            severity,
                            urgency,
                            location,
                            affected_facility,
                            summary,
                            status,
                            now,
                            now,
                            latitude,
                            longitude,
                            image_url,
                            image_analysis,
                            is_dup_int,
                            duplicate_of_id,
                            detected_language,
                        ),
                    )
                    row = cur.fetchone()
                conn.commit()
                return dict(row)
        else:
            conn = _get_sqlite_conn()
            try:
                complaint_id = _next_id_sqlite(conn)
                conn.execute(
                    """
                    INSERT INTO complaints
                      (id, raw_text, category, subcategory, severity, urgency,
                       location, affected_facility, summary, status, created_at, updated_at,
                       latitude, longitude, image_url, image_analysis, is_duplicate, duplicate_of_id, detected_language)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        complaint_id,
                        raw_text,
                        category,
                        subcategory,
                        severity,
                        urgency,
                        location,
                        affected_facility,
                        summary,
                        status,
                        now,
                        now,
                        latitude,
                        longitude,
                        image_url,
                        image_analysis,
                        is_dup_int,
                        duplicate_of_id,
                        detected_language,
                    ),
                )
                conn.commit()
                row = conn.execute("SELECT * FROM complaints WHERE id = ?", (complaint_id,)).fetchone()
                return dict(row)
            finally:
                conn.close()


def get_complaint(complaint_id: str) -> dict[str, Any] | None:
    """Return a single complaint by ID, or None if not found."""
    with _lock:
        if _is_postgres():
            with _get_pg_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT * FROM complaints WHERE id = %s", (complaint_id,))
                    row = cur.fetchone()
                    return dict(row) if row else None
        else:
            conn = _get_sqlite_conn()
            try:
                row = conn.execute(
                    "SELECT * FROM complaints WHERE id = ?", (complaint_id,)
                ).fetchone()
                return dict(row) if row else None
            finally:
                conn.close()


def list_complaints(
    *,
    status: list[str] | None = None,
    category: list[str] | None = None,
    severity: list[str] | None = None,
    location: list[str] | None = None,
    search: str | None = None,
    sort: str = "newest",
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[dict[str, Any]], int]:
    """Return (complaints, total_count) applying filters, sort, and pagination."""
    conditions: list[str] = []
    params: list[Any] = []
    is_pg = _is_postgres()
    ph = "%s" if is_pg else "?"

    def _in(col: str, vals: list[str]) -> None:
        placeholders = ",".join(ph * len(vals))
        conditions.append(f"{col} IN ({placeholders})")
        params.extend(vals)

    if status:
        _in("status", status)
    if category:
        _in("category", category)
    if severity:
        _in("severity", severity)
    if location:
        _in("location", location)
    if search:
        op = "ILIKE" if is_pg else "LIKE"
        conditions.append(f"(summary {op} {ph} OR raw_text {op} {ph} OR subcategory {op} {ph})")
        like = f"%{search}%"
        params.extend([like, like, like])

    # Exclude standalone duplicate entries so only primary unique complaints are listed
    conditions.append("(is_duplicate = 0 OR is_duplicate IS NULL) AND duplicate_of_id IS NULL")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    _ORDER = {
        "newest": "created_at DESC",
        "oldest": "created_at ASC",
        "highest_severity": (
            "CASE severity WHEN 'Critical' THEN 4 WHEN 'High' THEN 3 "
            "WHEN 'Medium' THEN 2 ELSE 1 END DESC, created_at DESC"
        ),
        "highest_urgency": (
            "CASE urgency WHEN 'Emergency' THEN 4 WHEN 'Urgent' THEN 3 "
            "WHEN 'Soon' THEN 2 ELSE 1 END DESC, created_at DESC"
        ),
    }
    order = _ORDER.get(sort, "created_at DESC")

    with _lock:
        if _is_postgres():
            with _get_pg_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(f"SELECT COUNT(*) FROM complaints {where}", params)
                    count_row = cur.fetchone()
                    if not count_row:
                        total = 0
                    elif isinstance(count_row, dict):
                        total = list(count_row.values())[0]
                    else:
                        total = count_row[0]

                    query_sql = f"SELECT * FROM complaints {where} ORDER BY {order} LIMIT %s OFFSET %s"
                    cur.execute(query_sql, params + [limit, skip])
                    rows = cur.fetchall()
                    return [dict(r) for r in rows], int(total)
        else:
            conn = _get_sqlite_conn()
            try:
                c_row = conn.execute(
                    f"SELECT COUNT(*) FROM complaints {where}", params
                ).fetchone()
                total = c_row[0] if c_row else 0
                rows = conn.execute(
                    f"SELECT * FROM complaints {where} ORDER BY {order} LIMIT ? OFFSET ?",
                    params + [limit, skip],
                ).fetchall()
                return [dict(r) for r in rows], int(total)
            finally:
                conn.close()


def update_complaint_status(complaint_id: str, new_status: str) -> dict[str, Any] | None:
    """Update complaint status. Returns updated record, or None if not found."""
    if new_status not in VALID_STATUSES:
        raise ValueError(f"Invalid status {new_status!r}. Must be one of: {sorted(VALID_STATUSES)}")
    now = datetime.now(timezone.utc).isoformat()
    with _lock:
        if _is_postgres():
            with _get_pg_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE complaints SET status = %s, updated_at = %s WHERE id = %s RETURNING *",
                        (new_status, now, complaint_id),
                    )
                    row = cur.fetchone()
                conn.commit()
                return dict(row) if row else None
        else:
            conn = _get_sqlite_conn()
            try:
                result = conn.execute(
                    "UPDATE complaints SET status = ?, updated_at = ? WHERE id = ?",
                    (new_status, now, complaint_id),
                )
                conn.commit()
                if result.rowcount == 0:
                    return None
                row = conn.execute("SELECT * FROM complaints WHERE id = ?", (complaint_id,)).fetchone()
                return dict(row)
            finally:
                conn.close()


def get_stats() -> dict[str, Any]:
    """Return aggregate statistics across all primary non-rejected complaints."""
    stat_filter = "WHERE (is_duplicate = 0 OR is_duplicate IS NULL) AND duplicate_of_id IS NULL AND status != 'Rejected / Spam' AND category != 'Spam / Invalid'"
    with _lock:
        if _is_postgres():
            with _get_pg_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(f"SELECT COUNT(*) FROM complaints {stat_filter}")
                    total_row = cur.fetchone()
                    total = list(total_row.values())[0] if isinstance(total_row, dict) else total_row[0]

                    def _group_pg(col: str) -> dict[str, int]:
                        if col not in _ALLOWED_STATS_COLS:
                            raise ValueError(f"Invalid column: {col!r}")
                        cur.execute(f"SELECT {col}, COUNT(*) FROM complaints {stat_filter} GROUP BY {col}")
                        rows = cur.fetchall()
                        res = {}
                        for r in rows:
                            vals = list(r.values()) if isinstance(r, dict) else list(r)
                            res[vals[0]] = vals[1]
                        return res

                    return {
                        "total": int(total),
                        "by_status": _group_pg("status"),
                        "by_category": _group_pg("category"),
                        "by_severity": _group_pg("severity"),
                    }
        else:
            conn = _get_sqlite_conn()
            try:
                total = conn.execute(f"SELECT COUNT(*) FROM complaints {stat_filter}").fetchone()[0]

                def _group_sqlite(col: str) -> dict[str, int]:
                    if col not in _ALLOWED_STATS_COLS:
                        raise ValueError(f"Invalid column: {col!r}")
                    return {
                        row[0]: row[1]
                        for row in conn.execute(
                            f"SELECT {col}, COUNT(*) FROM complaints {stat_filter} GROUP BY {col}"
                        ).fetchall()
                    }

                return {
                    "total": total,
                    "by_status": _group_sqlite("status"),
                    "by_category": _group_sqlite("category"),
                    "by_severity": _group_sqlite("severity"),
                }
            finally:
                conn.close()


def verify_officer_credentials(officer_id: str, password: str) -> dict[str, Any] | None:
    """Verify officer credentials and return officer profile if valid."""
    target_hash = hash_password(password)
    with _lock:
        if _is_postgres():
            with _get_pg_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT officer_id, name, department, password_hash FROM officers WHERE officer_id = %s",
                        (officer_id,),
                    )
                    row = cur.fetchone()
                    if row and row.get("password_hash") == target_hash:
                        return {
                            "officer_id": row["officer_id"],
                            "name": row["name"],
                            "department": row["department"],
                        }
        else:
            conn = _get_sqlite_conn()
            try:
                row = conn.execute(
                    "SELECT officer_id, name, department, password_hash FROM officers WHERE officer_id = ?",
                    (officer_id,),
                ).fetchone()
                if row and row["password_hash"] == target_hash:
                    return {
                        "officer_id": row["officer_id"],
                        "name": row["name"],
                        "department": row["department"],
                    }
            finally:
                conn.close()
    return None


def update_officer_password(officer_id: str, old_password: str, new_password: str) -> bool:
    """Update officer password if old password matches."""
    old_hash = hash_password(old_password)
    new_hash = hash_password(new_password)
    with _lock:
        if _is_postgres():
            with _get_pg_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE officers SET password_hash = %s WHERE officer_id = %s AND password_hash = %s",
                        (new_hash, officer_id, old_hash),
                    )
                    updated = cur.rowcount > 0
                conn.commit()
                return updated
        else:
            conn = _get_sqlite_conn()
            try:
                cur = conn.execute(
                    "UPDATE officers SET password_hash = ? WHERE officer_id = ? AND password_hash = ?",
                    (new_hash, officer_id, old_hash),
                )
                conn.commit()
                return cur.rowcount > 0
            finally:
                conn.close()


import re
from math import radians, sin, cos, sqrt, atan2


def haversine_distance_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in meters between two lat/lng coordinates."""
    R = 6371000.0  # Earth radius in meters
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlambda = radians(lng2 - lng1)
    a = sin(dphi / 2.0) ** 2 + cos(phi1) * cos(phi2) * sin(dlambda / 2.0) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


def is_same_location(
    loc1: str,
    loc2: str,
    lat1: float | None = None,
    lng1: float | None = None,
    lat2: float | None = None,
    lng2: float | None = None,
) -> bool:
    """
    Returns True if two locations represent the same civic location:
    1. Coordinates within 500 meters.
    2. Shared 6-digit Pincode + landmark/area token overlap.
    3. Case-insensitive landmark substring match or >40% token overlap.
    """
    if not loc1 or not loc2:
        return False

    # 1. GPS Proximity Check (< 500 meters)
    if lat1 is not None and lng1 is not None and lat2 is not None and lng2 is not None:
        try:
            dist = haversine_distance_meters(float(lat1), float(lng1), float(lat2), float(lng2))
            if dist <= 500.0:  # Within 500 meters
                return True
        except (ValueError, TypeError):
            pass

    # Clean & normalize strings
    s1 = loc1.strip().lower()
    s2 = loc2.strip().lower()

    if s1 == s2:
        return True

    # 2. Extract 6-digit PIN codes
    pincodes1 = set(re.findall(r"\b[1-9]\d{5}\b", s1))
    pincodes2 = set(re.findall(r"\b[1-9]\d{5}\b", s2))

    common_pincodes = pincodes1.intersection(pincodes2)

    # Clean punctuation and tokenize
    tokens1 = set(re.findall(r"\b[a-z0-9]+\b", s1))
    tokens2 = set(re.findall(r"\b[a-z0-9]+\b", s2))

    # Stop words to ignore when comparing token overlap
    stop_words = {
        "near", "opp", "opposite", "behind", "next", "beside", "to", "at", "in", "and", "the", "of",
        "india", "karnataka", "maharashtra", "delhi", "rajasthan", "tamil", "nadu", "kerala",
        "ward", "block", "sector", "phase", "street", "st", "road", "rd", "lane", "area", "colony",
        "nagar", "city", "town", "district", "main", "no", "number"
    }
    meaningful1 = tokens1 - stop_words
    meaningful2 = tokens2 - stop_words

    # If pincode matches, check if any area/landmark token matches
    if common_pincodes:
        overlap = (meaningful1 - pincodes1).intersection(meaningful2 - pincodes2)
        if len(overlap) >= 1 or len(meaningful1 - pincodes1) == 0 or len(meaningful2 - pincodes2) == 0:
            return True

    # 3. Substring matching & token overlap
    s1_nopincode = re.sub(r"\b[1-9]\d{5}\b", "", s1).strip(", ")
    s2_nopincode = re.sub(r"\b[1-9]\d{5}\b", "", s2).strip(", ")

    if len(s1_nopincode) >= 6 and len(s2_nopincode) >= 6:
        if s1_nopincode in s2_nopincode or s2_nopincode in s1_nopincode:
            return True

    # Token Overlap >= 50% of the smaller token set
    overlap = meaningful1.intersection(meaningful2)
    min_len = min(len(meaningful1), len(meaningful2))
    if min_len > 0 and len(overlap) / min_len >= 0.5:
        return True

    return False


def find_matching_duplicate_complaint(
    location: str,
    category: str,
    latitude: float | None = None,
    longitude: float | None = None,
) -> dict[str, Any] | None:
    """Search open complaints in category and return the first matching duplicate by landmark/pincode/GPS."""
    with _lock:
        if _is_postgres():
            with _get_pg_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT id, summary, raw_text, location, subcategory, latitude, longitude FROM complaints WHERE category = %s AND status != 'Rejected / Spam' AND status != 'Resolved' ORDER BY created_at DESC LIMIT 50",
                        (category,),
                    )
                    candidates = [dict(r) for r in cur.fetchall()]
        else:
            conn = _get_sqlite_conn()
            try:
                rows = conn.execute(
                    "SELECT id, summary, raw_text, location, subcategory, latitude, longitude FROM complaints WHERE category = ? AND status != 'Rejected / Spam' AND status != 'Resolved' ORDER BY created_at DESC LIMIT 50",
                    (category,),
                ).fetchall()
                candidates = [dict(r) for r in rows]
            finally:
                conn.close()

    for cand in candidates:
        cand_loc = cand.get("location") or ""
        cand_lat = cand.get("latitude")
        cand_lng = cand.get("longitude")

        if is_same_location(
            loc1=location,
            loc2=cand_loc,
            lat1=latitude,
            lng1=longitude,
            lat2=cand_lat,
            lng2=cand_lng,
        ):
            return cand

    return None


def delete_complaint(complaint_id: str) -> bool:
    """Physically remove a complaint from the database."""
    with _lock:
        if _is_postgres():
            with _get_pg_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute("DELETE FROM complaints WHERE id = %s", (complaint_id,))
                    deleted = cur.rowcount > 0
                conn.commit()
                return deleted
        else:
            conn = _get_sqlite_conn()
            try:
                cur = conn.execute("DELETE FROM complaints WHERE id = ?", (complaint_id,))
                conn.commit()
                return cur.rowcount > 0
            finally:
                conn.close()


SEVERITY_ORDER = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}
URGENCY_ORDER = {"Routine": 1, "Soon": 2, "Urgent": 3, "Emergency": 4}
REV_SEVERITY = {1: "Low", 2: "Medium", 3: "High", 4: "Critical"}
REV_URGENCY = {1: "Routine", 2: "Soon", 3: "Urgent", 4: "Emergency"}


def calculate_escalated_priority(
    current_severity: str,
    current_urgency: str,
    new_severity: str | None,
    new_urgency: str | None,
    new_count: int,
) -> tuple[str, str]:
    """Escalate severity and urgency based on citizen report threshold & incoming complaint level."""
    sev_rank = SEVERITY_ORDER.get(current_severity, 2)
    urg_rank = URGENCY_ORDER.get(current_urgency, 1)

    if new_severity:
        sev_rank = max(sev_rank, SEVERITY_ORDER.get(new_severity, 2))
    if new_urgency:
        urg_rank = max(urg_rank, URGENCY_ORDER.get(new_urgency, 1))

    # Support count based automatic escalation thresholds
    if new_count >= 5:
        sev_rank = max(sev_rank, 4)  # Critical
        urg_rank = max(urg_rank, 4)  # Emergency
    elif new_count >= 3:
        sev_rank = max(sev_rank, 3)  # High
        urg_rank = max(urg_rank, 3)  # Urgent
    elif new_count >= 2:
        sev_rank = max(sev_rank, 2)  # Medium
        urg_rank = max(urg_rank, 2)  # Soon

    return REV_SEVERITY.get(sev_rank, "High"), REV_URGENCY.get(urg_rank, "Urgent")


def merge_duplicate_into_original(
    original_id: str,
    new_text: str,
    image_url: str | None = None,
    new_severity: str | None = None,
    new_urgency: str | None = None,
) -> dict[str, Any] | None:
    """Increment citizen_reports_count, escalate severity/urgency, and append text/photo to additional_updates array on original complaint."""
    now = datetime.now(timezone.utc).isoformat()
    update_entry = {"text": new_text, "created_at": now, "image_url": image_url}

    with _lock:
        row = get_complaint(original_id)
        if not row:
            return None

        existing_count = row.get("citizen_reports_count") or 1
        new_count = existing_count + 1

        curr_sev = row.get("severity") or "Medium"
        curr_urg = row.get("urgency") or "Routine"

        escalated_sev, escalated_urg = calculate_escalated_priority(
            curr_sev, curr_urg, new_severity, new_urgency, new_count
        )

        raw_updates = row.get("additional_updates") or "[]"
        try:
            updates_list = json.loads(raw_updates) if isinstance(raw_updates, str) else list(raw_updates)
        except Exception:
            updates_list = []
        updates_list.append(update_entry)
        new_updates_json = json.dumps(updates_list)

        if _is_postgres():
            with _get_pg_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE complaints
                        SET citizen_reports_count = %s,
                            severity = %s,
                            urgency = %s,
                            additional_updates = %s,
                            updated_at = %s
                        WHERE id = %s
                        RETURNING *
                        """,
                        (new_count, escalated_sev, escalated_urg, new_updates_json, now, original_id),
                    )
                    updated_row = cur.fetchone()
                conn.commit()
                return dict(updated_row) if updated_row else None
        else:
            conn = _get_sqlite_conn()
            try:
                conn.execute(
                    """
                    UPDATE complaints
                    SET citizen_reports_count = ?,
                        severity = ?,
                        urgency = ?,
                        additional_updates = ?,
                        updated_at = ?
                    WHERE id = ?
                    """,
                    (new_count, escalated_sev, escalated_urg, new_updates_json, now, original_id),
                )
                conn.commit()
                updated_row = conn.execute("SELECT * FROM complaints WHERE id = ?", (original_id,)).fetchone()
                return dict(updated_row) if updated_row else None
            finally:
                conn.close()
