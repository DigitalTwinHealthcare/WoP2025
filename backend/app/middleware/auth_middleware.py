# from __future__ import annotations
# from typing import Callable

# from fastapi import Request
# from fastapi.responses import JSONResponse
# from starlette.middleware.base import BaseHTTPMiddleware

# from app.services.firebase_service import firebase_service


# class AuthMiddleware(BaseHTTPMiddleware):
#     """
#     Token-based authentication middleware using Firebase ID tokens.
#     """

#     def __init__(self, app, exempt_paths: list[str] | None = None):  # type: ignore
#         super().__init__(app)
#         self.exempt_paths = set(exempt_paths or [])

#     async def dispatch(self, request: Request, call_next: Callable):
#         path = request.url.path
#         print(f"[AUTH] Incoming path: {path}")
#         # allow exempt paths ONLY for login/register
#         if path in self.exempt_paths or path in ["/auth/login", "/auth/register"]:
#             print("[AUTH] Exempt path, skipping auth")
#             return await call_next(request)

#         # extract Authorization header
#         auth_header = request.headers.get("Authorization")
#         print(f"[AUTH] Authorization header: {auth_header}")

#         if not auth_header or not auth_header.startswith("Bearer "):
#             print("[AUTH] Missing/invalid header")
#             return JSONResponse(
#                 status_code=401,
#                 content={"detail": "Missing or invalid Authorization header"},
#             )

#         token = auth_header.split(" ", 1)[1].strip()
#         print(f"[AUTH] Extracted token (first 20 chars): {token[:20]}...")

#         try:
#             decoded = await firebase_service.verify_token(token)
#             print(f"[AUTH] Token verified, uid={decoded.get('uid')}")
#         except Exception as e:
#             print("[AUTH] Token verification FAILED:", e)
#             return JSONResponse(
#                 status_code=401,
#                 content={"detail": "Invalid authentication credentials"},
#             )

#         request.state.user = decoded
#         print("[AUTH] request.state.user set")
#         return await call_next(request)

from __future__ import annotations
from typing import Callable

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.services.firebase_service import firebase_service


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Token-based authentication middleware using Firebase ID tokens.
    """

    def __init__(self, app, exempt_paths: list[str] | None = None):  # type: ignore
        super().__init__(app)
        self.exempt_paths = set(exempt_paths or [])

    async def dispatch(self, request: Request, call_next: Callable):
        path = request.url.path
        print(f"[AUTH] Incoming path: {path}")
        
        # Allow static files, exempt paths, and health check without authentication
        if (path.startswith("/static/") or 
            path in self.exempt_paths or 
            path in ["/auth/login", "/auth/register"] or
            path == "/health"):
            return await call_next(request)

        # Allow OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)

        # extract Authorization header
        auth_header = request.headers.get("Authorization")
        print(f"[AUTH] Authorization header: {auth_header}")

        if not auth_header or not auth_header.startswith("Bearer "):
            print("[AUTH] Missing/invalid header")
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing or invalid Authorization header"},
            )

        token = auth_header.split(" ", 1)[1].strip()
        print(f"[AUTH] Extracted token (first 20 chars): {token[:20]}...")

        try:
            decoded = await firebase_service.verify_token(token)
            print(f"[AUTH] Token verified, uid={decoded.get('uid')}")
        except Exception as e:
            print("[AUTH] Token verification FAILED:", e)
            # DEV MODE BYPASS
            # If we are in development and verification fails (likely due to missing credentials),
            # we allow the request to proceed with a mock user.
            from app.config import get_settings
            settings = get_settings()
            if settings.environment == "development":
                print("[AUTH] DEV MODE: Allowing request despite auth failure")
                request.state.user = {"uid": "dev_user", "email": "dev@example.com"}
                return await call_next(request)

            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid authentication credentials"},
            )

        request.state.user = decoded
        print("[AUTH] request.state.user set")
        return await call_next(request)

