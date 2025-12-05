from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class ECGPredictRequest(BaseModel):
    patient_id: str = Field(..., example="patient_123")
    signal: List[float] = Field(..., description="Preprocessed ECG signal values")


class ECGPredictResponse(BaseModel):
    patient_id: str
    prediction: str
    confidence: float
    report_id: str
    result_file_url: str


class PKPDSimulateRequest(BaseModel):
    patient_id: str
    drug_name: str
    dose_mg: float
    dosing_interval_h: float
    duration_h: float
    weight_kg: Optional[float] = None


class PKPDSimulateResponse(BaseModel):
    patient_id: str
    drug_name: str
    summary: str
    report_id: str
    result_file_url: str
    simulation_data: Optional[dict] = None


