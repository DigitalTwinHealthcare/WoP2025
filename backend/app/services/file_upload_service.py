from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from fastapi import HTTPException, UploadFile
from sqlmodel import Session, select

from app.db.db import engine
from app.db.models import EHRFile
from app.schemas.ehr import EHRMetadata
from app.utils.logger import get_logger

logger = get_logger(__name__)

SupportedFileType = Literal["pdf", "csv", "json", "xml"]


class FileUploadService:
    """Handle EHR file uploads and basic parsing/metadata management using local storage."""

    async def upload_ehr_file(self, patient_id: str, file: UploadFile) -> EHRMetadata:
        ext = (file.filename or "").split(".")[-1].lower()
        if ext not in {"pdf", "csv", "json", "xml"}:
            raise HTTPException(status_code=400, detail="Unsupported file type")

        content = await file.read()
        uploaded_at = datetime.now(timezone.utc)
        
        # Create local storage directory
        base_dir = Path("data/ehr") / str(patient_id)
        base_dir.mkdir(parents=True, exist_ok=True)
        
        # Save file locally
        timestamp_str = uploaded_at.isoformat().replace(":", "-")
        file_name = file.filename or "ehr"
        file_path = base_dir / f"{timestamp_str}_{file_name}"
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Store relative path for URL generation
        relative_path = f"ehr/{patient_id}/{file_path.name}"
        file_url = f"/static/{relative_path}"
        
        # Save metadata to SQLite
        with Session(engine) as session:
            ehr_file = EHRFile(
                patient_id=int(patient_id),
                file_name=file_name,
                file_type=ext,
                file_path=str(relative_path),
                uploaded_at=uploaded_at,
            )
            session.add(ehr_file)
            session.commit()
            session.refresh(ehr_file)
        
        metadata = EHRMetadata(
            patient_id=patient_id,
            file_name=file_name,
            file_type=ext,
            storage_path=str(relative_path),
            file_url=file_url,
            uploaded_at=uploaded_at,
            parsed=False,
        )

        logger.info("Uploaded EHR for patient %s at %s", patient_id, relative_path)
        return metadata


file_upload_service = FileUploadService()


