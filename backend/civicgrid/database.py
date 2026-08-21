"""SQLite persistence layer for CivicGrid complaints."""
from __future__ import annotations

import os
import sqlite3
import threading
from datetime import datetime, timezone
from typing import Any

_DB_PATH_DEFAULT = os.path.join(os.path.dirname(__file__), "..", "data", "civicgrid.db")
DB_PATH = os.environ.get("CIVICGRID_DB_PATH", _DB_PATH_DEFAULT)

_lock = threading.Lock()

_CREATE_SQL = """
CREATE TABLE IF NOT EXISTS complaints (
    id               TEXT PRIMARY KEY,
    raw_text         TEXT NOT NULL,
    category         TEXT NOT NULL,
    subcategory      TEXT NOT NULL,
    severity         TEXT NOT NULL,
    urgency          TEXT NOT NULL,
    location         TEXT NOT NULL,
    affected_facility TEXT NOT NULL,
    summary          TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'New',
    created_at       TEXT NOT NULL,
    updated_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_complaints_status   ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created  ON complaints(created_at);
"""

VALID_STATUSES: frozenset[str] = frozenset(
    {"New", "Under Review", "Assigned", "In Progress", "Resolved"}
)


def _connect() -> sqlite3.Connection:
    path = os.path.abspath(DB_PATH)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db() -> None:
    """Create tables and indexes if they do not already exist."""
    with _lock:
        conn = _connect()
        try:
            conn.executescript(_CREATE_SQL)
            conn.commit()
        finally:
            conn.close()


def _next_id(conn: sqlite3.Connection) -> str:
    year = datetime.now(timezone.utc).year
    row = conn.execute("SELECT COUNT(*) FROM complaints").fetchone()
    n = (row[0] or 0) + 1
    return f"COMP-{year}-{n:04d}"


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
) -> dict[str, Any]:
    """Insert a new complaint and return the full record."""
    now = datetime.now(timezone.utc).isoformat()
    with _lock:
        conn = _connect()
        try:
            complaint_id = _next_id(conn)
            conn.execute(
                """
                INSERT INTO complaints
                  (id, raw_text, category, subcategory, severity, urgency,
                   location, affected_facility, summary, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', ?, ?)
                """,
                (
                    complaint_id, raw_text, category, subcategory, severity, urgency,
                    location, affected_facility, summary, now, now,
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
        conn = _connect()
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

    def _in(col: str, vals: list[str]) -> None:
        placeholders = ",".join("?" * len(vals))
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
        conditions.append("(summary LIKE ? OR raw_text LIKE ? OR subcategory LIKE ?)")
        like = f"%{search}%"
        params.extend([like, like, like])

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
        conn = _connect()
        try:
            total = conn.execute(
                f"SELECT COUNT(*) FROM complaints {where}", params
            ).fetchone()[0]
            rows = conn.execute(
                f"SELECT * FROM complaints {where} ORDER BY {order} LIMIT ? OFFSET ?",
                params + [limit, skip],
            ).fetchall()
            return [dict(r) for r in rows], total
        finally:
            conn.close()


def update_complaint_status(complaint_id: str, new_status: str) -> dict[str, Any] | None:
    """Update complaint status. Returns updated record, or None if not found."""
    if new_status not in VALID_STATUSES:
        raise ValueError(f"Invalid status {new_status!r}. Must be one of: {sorted(VALID_STATUSES)}")
    now = datetime.now(timezone.utc).isoformat()
    with _lock:
        conn = _connect()
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
    """Return aggregate statistics across all complaints."""
    with _lock:
        conn = _connect()
        try:
            total = conn.execute("SELECT COUNT(*) FROM complaints").fetchone()[0]

            _ALLOWED_STATS_COLS = frozenset({"status", "category", "severity"})

            def _group(col: str) -> dict[str, int]:
                if col not in _ALLOWED_STATS_COLS:
                    raise ValueError(f"Invalid column for stats grouping: {col!r}")
                return {
                    row[0]: row[1]
                    for row in conn.execute(
                        f"SELECT {col}, COUNT(*) FROM complaints GROUP BY {col}"
                    ).fetchall()
                }

            return {
                "total": total,
                "by_status": _group("status"),
                "by_category": _group("category"),
                "by_severity": _group("severity"),
            }
        finally:
            conn.close()
