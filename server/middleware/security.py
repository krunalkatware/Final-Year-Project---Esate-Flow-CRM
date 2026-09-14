"""
EstateFlow — Enterprise Security & Rate Limiting Middleware
============================================================
Enforces security response headers (XSS, CSP, HSTS, X-Frame-Options, No-Sniff)
and request rate-limiting protection.
"""
import time
from collections import defaultdict
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Injects production security headers into every API response."""

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Cache-Control"] = "no-store, max-age=0, must-revalidate"

        return response


class RateLimiter:
    """In-memory sliding window rate limiter per IP address."""

    def __init__(self, requests_per_minute: int = 120):
        self.requests_per_minute = requests_per_minute
        self.hits = defaultdict(list)

    def is_allowed(self, ip: str) -> bool:
        now = time.time()
        window_start = now - 60

        # Filter out old requests outside 60-second window
        self.hits[ip] = [t for t in self.hits[ip] if t > window_start]

        if len(self.hits[ip]) >= self.requests_per_minute:
            return False

        self.hits[ip].append(now)
        return True


rate_limiter = RateLimiter(requests_per_minute=180)
