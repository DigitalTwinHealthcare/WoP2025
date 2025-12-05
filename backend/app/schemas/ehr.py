from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class EHRMetadata(BaseModel):
    patient_id: str
    file_name: str
    file_type: str
    storage_path: str
    file_url: Optional[str] = None
    uploaded_at: datetime
    parsed: bool = False
    notes: Optional[str] = None


class EHRUploadResponse(BaseModel):
    message: str
    ehr: EHRMetadata


