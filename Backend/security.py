"""Basic protection for the API: rate limiting and safe response headers."""
import os
import time
from collections import defaultdict, deque

from flask import jsonify, request

# path -> (maximum requests, per this many seconds), counted per visitor
LIMITS = {
    "/api/hype-check": (30, 60),
    "/api/search": (60, 60),
}
DEFAULT_LIMIT = (300, 60)          # everything else under /api

hits = defaultdict(deque)          # "ip:bucket" -> times of recent requests


def client_ip():
    """The visitor's address. Behind Render's proxy, set TRUST_PROXY=1."""
    if os.environ.get("TRUST_PROXY") == "1":
        forwarded = request.headers.get("X-Forwarded-For", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.remote_addr or "unknown"


def check(key, limit):
    """Returns (allowed, seconds_to_wait)."""
    max_requests, window = limit
    now = time.monotonic()
    recent = hits[key]
    while recent and now - recent[0] > window:
        recent.popleft()
    if len(recent) >= max_requests:
        return False, int(window - (now - recent[0])) + 1
    recent.append(now)

    if len(hits) > 5000:           # keep memory small: forget idle visitors
        for stale in [k for k, q in hits.items() if not q]:
            del hits[stale]
    return True, 0


def init_security(app):

    @app.before_request
    def rate_limit():
        if not request.path.startswith("/api/") or request.method == "OPTIONS":
            return None
        limit = LIMITS.get(request.path, DEFAULT_LIMIT)
        bucket = request.path if request.path in LIMITS else "all"
        allowed, wait = check(f"{client_ip()}:{bucket}", limit)
        if allowed:
            return None
        response = jsonify({"error": "Too many requests. Please wait a moment and try again."})
        response.status_code = 429
        response.headers["Retry-After"] = str(wait)
        return response

    @app.after_request
    def safe_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response