from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from app.services.fhir_service import fhir_service

router = APIRouter(prefix="/fhir", tags=["fhir"])


@router.post("/convert")
async def convert_to_fhir(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert uploaded/parsed EHR data into a FHIR Bundle.
    
    Expected payload:
    {
        "patient_id": "1"
    }
    
    This will load the parsed EHR JSON from /static/ehr/{patient_id}/parsed.json
    and convert it to a FHIR Bundle.
    """
    patient_id = payload.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=400, detail="patient_id is required")
    
    # Load parsed EHR data
    parsed_file_path = Path("data/ehr") / str(patient_id) / "parsed.json"
    
    if not parsed_file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Parsed EHR data not found for patient {patient_id}. Please upload EHR first."
        )
    
    with open(parsed_file_path, "r", encoding="utf-8") as f:
        parsed_data = json.load(f)
    
    # Add patient_id to parsed data if not present
    parsed_data["patient_id"] = str(patient_id)
    
    # Convert to FHIR
    return await fhir_service.convert_to_fhir(parsed_data)


@router.get("/{patient_id}")
async def get_fhir(patient_id: str) -> Dict[str, Any]:
    """Return FHIR bundle metadata/URL for a patient."""

    return await fhir_service.get_fhir_for_patient(patient_id)


