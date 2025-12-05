from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from fastapi import APIRouter, HTTPException, UploadFile, Response, Form, File
from sqlmodel import Session, select, desc

from app.db.db import engine
from app.db.models import Patient, OrthopedicScan
from app.schemas.ehr import EHRUploadResponse
from app.schemas.patient import PatientCreate, PatientInDB, PatientListResponse
from app.services.ehr_parser import parse_csv, parse_json, parse_xml
from app.services.file_upload_service import file_upload_service
from app.utils.logger import get_logger

router = APIRouter(prefix="/patients", tags=["patients"])
logger = get_logger(__name__)


def _model_to_patient(patient: Patient) -> PatientInDB:
    """Convert SQLModel Patient to Pydantic PatientInDB."""
    return PatientInDB(
        id=str(patient.id),
        name=patient.name,
        age=patient.age,
        gender=patient.gender,
        weight=patient.weight,
        height=patient.height,
        hr=patient.hr,
        sbp=patient.sbp,
        dbp=patient.dbp,
        created_at=patient.created_at,
        updated_at=patient.updated_at,
    )


@router.get("", response_model=PatientListResponse)
async def list_patients() -> PatientListResponse:
    with Session(engine) as session:
        statement = select(Patient).order_by(desc(Patient.created_at))
        patients_list = session.exec(statement).all()
        patients: List[PatientInDB] = [_model_to_patient(p) for p in patients_list]
        return PatientListResponse(patients=patients)


@router.get("/recent", response_model=PatientListResponse)
async def recent_patients() -> PatientListResponse:
    with Session(engine) as session:
        statement = select(Patient).order_by(desc(Patient.created_at)).limit(5)
        patients_list = session.exec(statement).all()
        patients: List[PatientInDB] = [_model_to_patient(p) for p in patients_list]
        return PatientListResponse(patients=patients)


@router.get("/{patient_id}", response_model=PatientInDB)
async def get_patient(patient_id: str) -> PatientInDB:
    with Session(engine) as session:
        statement = select(Patient).where(Patient.id == int(patient_id))
        patient = session.exec(statement).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        return _model_to_patient(patient)


@router.post("", response_model=PatientInDB, status_code=201)
async def create_patient(
    name: str = Form(None),
    age: int = Form(None),
    gender: str = Form(None),
    file: UploadFile = File(None)
) -> PatientInDB:
    now = datetime.now(timezone.utc)
    
    # Data holders
    p_name = name
    p_age = age
    p_gender = gender
    p_weight = None
    p_height = None
    p_hr = None
    p_sbp = None
    p_dbp = None
    ehr_uploaded = False
    parsed_data = {}
    
    # 1. Process File FIRST if present
    if file:
        try:
            # Detect file type
            filename = file.filename or ""
            ext = filename.split(".")[-1].lower() if "." in filename else ""
            
            if ext not in ["csv", "json", "xml"]:
                raise HTTPException(
                    status_code=400, 
                    detail="Only CSV, JSON, or XML files are supported"
                )
            
            # Read file content
            content = await file.read()
            
            # Parse based on file type
            if ext == "csv":
                parsed_data = parse_csv(content)
            elif ext == "json":
                parsed_data = parse_json(content)
            else:  # xml
                parsed_data = parse_xml(content)
            
            ehr_uploaded = True
            

            # Extract fields if not provided in Form
            # Handle Swagger/OpenAPI default "string" values
            if not p_name or p_name.lower() == "string": 
                p_name = parsed_data.get("name")
            
            if not p_age: 
                p_age = parsed_data.get("age")
                
            if not p_gender or p_gender.lower() == "string": 
                p_gender = parsed_data.get("gender")
            
            # Extract vitals (always take from EHR if available)
            p_weight = parsed_data.get("weight_kg")
            p_height = parsed_data.get("height_cm")
            p_hr = parsed_data.get("heart_rate")
            p_sbp = parsed_data.get("blood_pressure_sys")
            p_dbp = parsed_data.get("blood_pressure_dia")
            
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error("Failed to parse EHR during creation: %s", e)
            # If parsing fails, we continue only if we have minimum required fields from Form
            pass

    # 2. Validate Required Fields
    if not p_name or p_age is None:
        raise HTTPException(
            status_code=400, 
            detail="Name and Age are required. Provide them in the form or upload a valid EHR file."
        )

    # 3. Create Patient Record
    with Session(engine) as session:
        patient = Patient(
            name=p_name,
            age=p_age,
            gender=p_gender,
            weight=p_weight,
            height=p_height,
            hr=p_hr,
            sbp=p_sbp,
            dbp=p_dbp,
            ehr_uploaded=ehr_uploaded,
            created_at=now,
            updated_at=now,
        )
        session.add(patient)
        session.commit()
        session.refresh(patient)
        patient_id = str(patient.id)
        logger.info("Created patient %s", patient_id)

    # 4. Save EHR Files if we processed one
    if file and ehr_uploaded:
        try:
            base_dir = Path("data/ehr") / patient_id
            base_dir.mkdir(parents=True, exist_ok=True)
            
            timestamp = datetime.now(timezone.utc)
            timestamp_str = timestamp.isoformat().replace(":", "-")
            
            # Save raw file (we need to write 'content' which we read earlier)
            # Note: 'content' variable is available from the if block scope in Python
            raw_file_path = base_dir / f"{timestamp_str}_{filename}"
            with open(raw_file_path, "wb") as f:
                f.write(content)
            
            # Save parsed JSON
            parsed_file_path = base_dir / "parsed.json"
            with open(parsed_file_path, "w", encoding="utf-8") as f:
                json.dump(parsed_data, f, indent=2)
                
            logger.info("Saved EHR files for patient %s", patient_id)
            
        except Exception as e:
            logger.error("Failed to save EHR files for patient %s: %s", patient_id, e)

    return _model_to_patient(patient)


@router.delete("/{patient_id}", status_code=204)
async def delete_patient(patient_id: str):
    with Session(engine) as session:
        statement = select(Patient).where(Patient.id == int(patient_id))
        patient = session.exec(statement).first()
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        session.delete(patient)
        session.commit()
        logger.info("Deleted patient %s", patient_id)

    # IMPORTANT: 204 must return NO CONTENT
    return Response(status_code=204)


@router.post("/{patient_id}/upload-ehr")
async def upload_ehr(patient_id: str, file: UploadFile):
    """
    Upload EHR file (CSV or JSON) for a patient.
    
    Accepts CSV or JSON files, parses them, and saves both raw and parsed data.
    """
    
    # Verify patient exists
    with Session(engine) as session:
        statement = select(Patient).where(Patient.id == int(patient_id))
        patient = session.exec(statement).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
    
    # Detect file type
    filename = file.filename or ""
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    
    if ext not in ["csv", "json", "xml"]:
        raise HTTPException(
            status_code=400, 
            detail="Only CSV, JSON, or XML files are supported"
        )
    
    # Read file content
    content = await file.read()
    
    # Parse based on file type
    if ext == "csv":
        parsed_data = parse_csv(content)
    elif ext == "json":
        parsed_data = parse_json(content)
    else:  # xml
        parsed_data = parse_xml(content)
    
    # Create directories
    base_dir = Path("data/ehr") / str(patient_id)
    base_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now(timezone.utc)
    timestamp_str = timestamp.isoformat().replace(":", "-")
    
    # Save raw file
    raw_file_path = base_dir / f"{timestamp_str}_{filename}"
    with open(raw_file_path, "wb") as f:
        f.write(content)
    
    # Save parsed JSON
    parsed_file_path = base_dir / "parsed.json"
    with open(parsed_file_path, "w", encoding="utf-8") as f:
        json.dump(parsed_data, f, indent=2)
    
    # Update patient record
    with Session(engine) as session:
        patient.ehr_uploaded = True
        patient.updated_at = timestamp
        session.add(patient)
        session.commit()
    
    logger.info("Uploaded and parsed EHR for patient %s", patient_id)
    
    return {
        "patient_id": patient_id,
        "message": "EHR uploaded successfully",
        "parsed": f"/static/ehr/{patient_id}/parsed.json"
    }


@router.post("/{patient_id}/orthopedic/scan")
async def upload_orthopedic_scan(patient_id: str, file: UploadFile):
    """
    Upload an orthopedic scan (e.g., X-Ray, MRI).
    """
    # Verify patient exists
    with Session(engine) as session:
        statement = select(Patient).where(Patient.id == int(patient_id))
        patient = session.exec(statement).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

    # Create directories
    base_dir = Path("data/orthopedic") / str(patient_id)
    base_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now(timezone.utc)
    timestamp_str = timestamp.isoformat().replace(":", "-")
    filename = file.filename or f"scan_{timestamp_str}"
    
    file_path = base_dir / filename
    content = await file.read()
    
    with open(file_path, "wb") as f:
        f.write(content)
        
    # Save to DB
    with Session(engine) as session:
        scan = OrthopedicScan(
            patient_id=int(patient_id),
            scan_type="Orthopedic Scan", # Could be parameterized if needed
            file_path=str(file_path),
            created_at=timestamp
        )
        session.add(scan)
        session.commit()
        session.refresh(scan)
        
    logger.info("Uploaded orthopedic scan for patient %s", patient_id)
    
    return {
        "message": "Scan uploaded successfully",
        "scan_id": scan.id,
        "file_path": f"/static/orthopedic/{patient_id}/{filename}"
    }


@router.post("/{patient_id}/orthopedic/export")
async def export_orthopedic_data(patient_id: str):
    """
    Export orthopedic data to SQLite database (simulated export).
    In a real app, this might trigger a specific ETL process or external system sync.
    Here we just mark scans as exported.
    """
    with Session(engine) as session:
        # Verify patient
        statement = select(Patient).where(Patient.id == int(patient_id))
        patient = session.exec(statement).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
            
        # Find pending scans
        statement = select(OrthopedicScan).where(
            OrthopedicScan.patient_id == int(patient_id),
            OrthopedicScan.export_status == "pending"
        )
        scans = session.exec(statement).all()
        
        if not scans:
            return {"message": "No pending scans to export"}
            
        # Update status
        for scan in scans:
            scan.export_status = "exported"
            session.add(scan)
        
        session.commit()
        
    logger.info("Exported %d scans for patient %s", len(scans), patient_id)
    
    return {
        "message": "Orthopedic data exported successfully",
        "exported_count": len(scans)
    }


