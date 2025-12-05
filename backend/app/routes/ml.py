from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.ml_inputs import (
    ECGPredictRequest,
    ECGPredictResponse,
    PKPDSimulateRequest,
    PKPDSimulateResponse,
)
from app.services.ecg_service import ecg_service
from app.services.pkpd_service import pkpd_service

router = APIRouter(prefix="/ml", tags=["ml"])


@router.post("/ecg-predict", response_model=ECGPredictResponse)
async def ecg_predict(payload: ECGPredictRequest) -> ECGPredictResponse:
    """Run ECG classification model and return prediction + report metadata."""

    return await ecg_service.predict(payload)


@router.post("/pkpd-simulate", response_model=PKPDSimulateResponse)
async def pkpd_simulate(payload: PKPDSimulateRequest) -> PKPDSimulateResponse:
    """Run PK/PD simulation and return summary + report metadata."""

    return await pkpd_service.simulate(payload)


@router.post("/compare-doses")
async def compare_doses(payload: dict):
    """
    Compare multiple dose levels for the same drug using PKPD ODE model.
    
    Expected payload:
    {
        "drug_name": "Metoprolol",
        "doses": [25, 50, 100],
        "duration": 24
    }
    """

    required = ["drug_name", "doses", "duration"]
    if not all(k in payload for k in required):
        raise HTTPException(status_code=400, detail="Missing required fields")

    drug = payload["drug_name"]
    doses = payload["doses"]
    duration = payload["duration"]

    results = pkpd_service.compare_doses(drug, doses, duration)

    return {
        "message": "Dose comparison complete",
        "drug": drug,
        "duration": duration,
        "comparisons": results
    }
