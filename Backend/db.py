import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "beyond_hype.db"


class DatabaseMissing(Exception):
    """Raised when beyond_hype.db has not been built yet."""


def connect():
    """Open the database read-only: the website can never change the data."""
    try:
        uri = DB_PATH.resolve().as_uri() + "?mode=ro"
        return sqlite3.connect(uri, uri=True)
    except sqlite3.OperationalError:
        return sqlite3.connect(DB_PATH)      # fallback if the URI form is refused


def query(sql, params=()):
    """Run a SELECT and return a list of dicts."""
    if not DB_PATH.exists():
        raise DatabaseMissing("Database file not found. Run: python build_db.py")
    conn = connect()
    conn.row_factory = sqlite3.Row
    try:
        return [dict(row) for row in conn.execute(sql, params).fetchall()]
    finally:
        conn.close()