"""
Persistence layer for CivicGrid complaints.
Supports both SQLite (local/testing default) and PostgreSQL (Supabase, Neon, Render).
Automatically detects DATABASE_URL in environment.
"""
from __future__ import annotations

import os
import sqlite3
import threading
from datetime import datetime, timezone
from typing import Any

_DB_PATH_DEFAULT = os.path.join(os.path.dirname(__file__), "..", "data", "civicgrid.db")
DB_PATH = os.environ.get("CIVICGRID_DB_PATH", _DB_PATH_DEFAULT)

_lock = threading.Lock()

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
    image_analysis    TEXT
);
CREATE INDEX IF NOT EXISTS idx_complaints_status   ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created  ON complaints(created_at);
"""

VALID_STATUSES: frozenset[str] = frozenset(
    {"New", "Under Review", "Assigned", "In Progress", "Resolved"}
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
                conn.commit()
        else:
            conn = _get_sqlite_conn()
            try:
                conn.executescript(_CREATE_TABLE_SQL)
                # Migration for existing SQLite DBs
                for col in ["latitude REAL", "longitude REAL", "image_url TEXT", "image_analysis TEXT"]:
                    try:
                        conn.execute(f"ALTER TABLE complaints ADD COLUMN {col}")
                    except sqlite3.OperationalError:
                        pass
                conn.commit()
            finally:
                conn.close()


def _next_id_sqlite(conn: sqlite3.Connection) -> str:
    year = datetime.now(timezone.utc).year
    row = conn.execute("SELECT COUNT(*) FROM complaints").fetchone()
    n = (row[0] or 0) + 1
    return f"COMP-{year}-{n:04d}"


def _next_id_pg(conn) -> str:
    year = datetime.now(timezone.utc).year
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM complaints")
        row = cur.fetchone()
        count = list(row.values())[0] if isinstance(row, dict) else row[0]
        n = (count or 0) + 1
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
    latitude: float | None = None,
    longitude: float | None = None,
    image_url: str | None = None,
    image_analysis: str | None = None,
) -> dict[str, Any]:
    """Insert a new complaint and return the full record."""
    now = datetime.now(timezone.utc).isoformat()
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
                           latitude, longitude, image_url, image_analysis)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'New', %s, %s, %s, %s, %s, %s)
                        RETURNING *
                        """,
                        (
                            complaint_id, raw_text, category, subcategory, severity, urgency,
                            location, affected_facility, summary, now, now,
                            latitude, longitude, image_url, image_analysis,
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
                       latitude, longitude, image_url, image_analysis)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        complaint_id, raw_text, category, subcategory, severity, urgency,
                        location, affected_facility, summary, now, now,
                        latitude, longitude, image_url, image_analysis,
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
                    total = list(count_row.values())[0] if isinstance(count_row, dict) else count_row[0]

                    query_sql = f"SELECT * FROM complaints {where} ORDER BY {order} LIMIT %s OFFSET %s"
                    cur.execute(query_sql, params + [limit, skip])
                    rows = cur.fetchall()
                    return [dict(r) for r in rows], int(total)
        else:
            conn = _get_sqlite_conn()
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
    """Return aggregate statistics across all complaints."""
    with _lock:
        if _is_postgres():
            with _get_pg_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT COUNT(*) FROM complaints")
                    total_row = cur.fetchone()
                    total = list(total_row.values())[0] if isinstance(total_row, dict) else total_row[0]

                    def _group_pg(col: str) -> dict[str, int]:
                        if col not in _ALLOWED_STATS_COLS:
                            raise ValueError(f"Invalid column: {col!r}")
                        cur.execute(f"SELECT {col}, COUNT(*) FROM complaints GROUP BY {col}")
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
                total = conn.execute("SELECT COUNT(*) FROM complaints").fetchone()[0]

                def _group_sqlite(col: str) -> dict[str, int]:
                    if col not in _ALLOWED_STATS_COLS:
                        raise ValueError(f"Invalid column: {col!r}")
                    return {
                        row[0]: row[1]
                        for row in conn.execute(
                            f"SELECT {col}, COUNT(*) FROM complaints GROUP BY {col}"
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
