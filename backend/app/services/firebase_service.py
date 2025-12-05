from __future__ import annotations

from typing import Any, Optional

import firebase_admin
from fastapi import HTTPException, status
from firebase_admin import auth, credentials

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class FirebaseService:
    """Firebase Admin SDK wrapper for authentication only."""

    def __init__(self) -> None:
        self._app: Optional[firebase_admin.App] = None
        self._init_app()

    def _init_app(self) -> None:
        settings = get_settings()
        if firebase_admin._apps:  # type: ignore[attr-defined]
            # Already initialized
            self._app = firebase_admin.get_app()
            return

        cred: credentials.Base = (
            credentials.Certificate(settings.firebase_credentials_file)
            if settings.firebase_credentials_file
            else credentials.ApplicationDefault()
        )

        try:
            self._app = firebase_admin.initialize_app(
                cred,
                {
                    "projectId": settings.firebase_project_id,
                },
            )
            logger.info("Initialized Firebase app (Auth only)")
        except Exception as exc:  # noqa: BLE001
            logger.error("Failed to initialize Firebase: %s", exc)
            raise

    # Auth
    async def verify_token(self, id_token: str) -> dict[str, Any]:
        """Verify Firebase ID token and return decoded claims."""
        try:
            decoded = auth.verify_id_token(id_token, app=self._app)
            return decoded
        except Exception as exc:  # noqa: BLE001
            logger.warning("Invalid Firebase token: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            ) from exc


firebase_service = FirebaseService()


