from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from app.services.firebase_service import firebase_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", summary="Signup via Firebase (client handles actual signup)")
async def signup(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Placeholder signup endpoint.

    In most Firebase architectures, signup happens client-side using the Firebase JS SDK.
    This endpoint can be extended to create initial Firestore records or custom claims.
    """

    return {"message": "Signup is handled by Firebase client SDK", "payload": payload}


@router.post("/login", summary="Login via Firebase (client handles credential exchange)")
async def login(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Placeholder login endpoint.

    Typically, the frontend uses Firebase JS SDK to obtain an ID token then calls
    backend endpoints with that token. This endpoint exists for completeness.
    """

    return {"message": "Login is handled by Firebase client SDK", "payload": payload}


@router.post("/verify", summary="Verify Firebase ID token and return decoded claims")
async def verify_token(request: Request) -> Dict[str, Any]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return {"valid": False, "detail": "Missing Authorization header"}

    token = auth_header.split(" ", 1)[1]
    decoded = await firebase_service.verify_token(token)
    return {"valid": True, "claims": decoded}


@router.get("/me", summary="Get current authenticated user info")
async def me(request: Request) -> Dict[str, Any]:
    """Return the authenticated user from request state (set by auth middleware)."""
    return {"user": request.state.user}


