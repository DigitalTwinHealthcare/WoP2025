from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException, UploadFile
from sqlmodel import Session, select

from app.db.db import engine
from app.db.models import Patient, FHIRBundle
from app.services.ehr.ehr_normalizer import normalize_row
from app.services.ehr.ehr_fhir_converter import save_fhir_bundle

router = APIRouter(prefix="/ehr", tags=["ehr"])


@router.post("/upload")
async def upload_and_process_ehr(patient_id: str, file: UploadFile):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")

    # Read CSV
    content = await file.read()
    try:
        df = pd.read_csv(BytesIO(content), dtype=str, na_filter=False)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid CSV file")

    processed = 0
    fhir_urls: list[str] = []

    with Session(engine) as session:
        for _, row in df.iterrows():
            row_dict = row.to_dict()

            # Normalize
            normalized = normalize_row(row_dict)

            # Convert to FHIR JSON string
            fhir_json = save_fhir_bundle(normalized["patient_id"], normalized)

            # Save to local storage
            timestamp = datetime.now(timezone.utc)
            timestamp_str = timestamp.isoformat().replace(":", "-")
            base_dir = Path("data/fhir") / str(normalized["patient_id"])
            base_dir.mkdir(parents=True, exist_ok=True)
            
            file_path = base_dir / f"{timestamp_str}.json"
            relative_path = f"fhir/{normalized['patient_id']}/{file_path.name}"
            
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(fhir_json)
            
            url = f"/static/{relative_path}"
            fhir_urls.append(url)

            # Save SQLite metadata
            fhir_bundle = FHIRBundle(
                patient_id=int(normalized["patient_id"]),
                file_path=str(relative_path),
                created_at=timestamp,
            )
            session.add(fhir_bundle)
            processed += 1

        # Update main patient doc
        statement = select(Patient).where(Patient.id == int(patient_id))
        patient = session.exec(statement).first()
        if patient:
            patient.ehr_uploaded = True
            patient.updated_at = datetime.now(timezone.utc)
            session.add(patient)
        
        session.commit()

    return {
        "message": "EHR uploaded & processed",
        "patient_id": patient_id,
        "processed_count": processed,
        "fhir_urls": fhir_urls,
    }


