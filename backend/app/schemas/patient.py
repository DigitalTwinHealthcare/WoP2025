from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class PatientBase(BaseModel):
    name: str = Field(..., example="John Doe")
    age: int = Field(..., ge=0, le=120, example=45)
    gender: Optional[str] = Field(default=None, example="male")
    weight: Optional[float] = Field(default=None, example=70.0)
    height: Optional[float] = Field(default=None, example=175.0)
    hr: Optional[float] = Field(default=None, example=75.0)
    sbp: Optional[float] = Field(default=None, example=120.0)
    dbp: Optional[float] = Field(default=None, example=80.0)


class PatientCreate(PatientBase):
    ehr_uploaded: bool = Field(default=False)


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = Field(default=None, ge=0, le=120)
    gender: Optional[str] = None


class PatientInDB(PatientBase):
    id: str
    created_at: datetime
    updated_at: datetime


class PatientListResponse(BaseModel):
    patients: list[PatientInDB]


