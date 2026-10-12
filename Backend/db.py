import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "beyond_hype.db"


class DatabaseMissing(Exception):
    """Raised when beyond_hype.db has not been built yet."""


def query(sql, params=()):
    """Run a SELECT and return a list of dicts."""
    if not DB_PATH.exists():
        raise DatabaseMissing("Database file not found. Run: python seed.py")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        return [dict(row) for row in conn.execute(sql, params).fetchall()]
    finally:
        conn.close() 