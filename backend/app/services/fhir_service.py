from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from fastapi import HTTPException
from fhir.resources.bundle import Bundle
from fhir.resources.condition import Condition
from fhir.resources.humanname import HumanName
from fhir.resources.medicationstatement import MedicationStatement
from fhir.resources.observation import Observation
from fhir.resources.patient import Patient as FhirPatient
from fhir.resources.reference import Reference
from sqlmodel import Session, select, desc

from app.db.db import engine
from app.db.models import FHIRBundle
from app.utils.logger import get_logger

logger = get_logger(__name__)


class FHIRService:
    """
    FHIR R4 conversion service.

    Converts parsed EHR data into a valid FHIR Bundle with:
    - Patient resource
    - Observation resources (height, weight, BP, HR)
    - Condition resource
    - MedicationStatement resources
    """

    def build_patient(self, data: Dict[str, Any]) -> FhirPatient:
        """Build FHIR Patient resource from parsed EHR data."""
        patient_id = str(data.get("patient_id", ""))
        name = data.get("name", "Unknown")
        gender = data.get("gender", "unknown").lower()
        age = data.get("age")
        
        # Map gender to FHIR codes
        gender_code = "unknown"
        if gender == "male" or gender.startswith("m"):
            gender_code = "male"
        elif gender == "female" or gender.startswith("f"):
            gender_code = "female"
        
        # Calculate birth date from age (approximate)
        birth_date = None
        if age:
            try:
                current_year = datetime.now().year
                birth_year = current_year - int(age)
                birth_date = f"{birth_year}-01-01"  # Approximate to Jan 1
            except (ValueError, TypeError):
                pass
        
        patient = FhirPatient.construct(
            id=patient_id,
            name=[HumanName.construct(text=name)],
            gender=gender_code,
        )
        
        if birth_date:
            patient.birthDate = birth_date
        
        return patient

    def build_observations(self, data: Dict[str, Any], patient_id: str) -> List[Observation]:
        """Build FHIR Observation resources for vital signs."""
        observations = []
        timestamp = datetime.now(timezone.utc).isoformat()
        patient_ref = Reference.construct(reference=f"Patient/{patient_id}")
        
        # Height observation (LOINC 8302-2)
        if data.get("height_cm"):
            height_obs = Observation.construct(
                id=str(uuid.uuid4()),
                status="final",
                code={
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": "8302-2",
                            "display": "Body height"
                        }
                    ]
                },
                valueQuantity={
                    "value": float(data["height_cm"]),
                    "unit": "cm",
                    "system": "http://unitsofmeasure.org",
                    "code": "cm"
                },
                effectiveDateTime=timestamp,
                subject=patient_ref,
            )
            observations.append(height_obs)
        
        # Weight observation (LOINC 29463-7)
        if data.get("weight_kg"):
            weight_obs = Observation.construct(
                id=str(uuid.uuid4()),
                status="final",
                code={
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": "29463-7",
                            "display": "Body weight"
                        }
                    ]
                },
                valueQuantity={
                    "value": float(data["weight_kg"]),
                    "unit": "kg",
                    "system": "http://unitsofmeasure.org",
                    "code": "kg"
                },
                effectiveDateTime=timestamp,
                subject=patient_ref,
            )
            observations.append(weight_obs)
        
        # Systolic BP observation (LOINC 8480-6)
        if data.get("blood_pressure_sys"):
            sys_bp_obs = Observation.construct(
                id=str(uuid.uuid4()),
                status="final",
                code={
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": "8480-6",
                            "display": "Systolic blood pressure"
                        }
                    ]
                },
                valueQuantity={
                    "value": float(data["blood_pressure_sys"]),
                    "unit": "mmHg",
                    "system": "http://unitsofmeasure.org",
                    "code": "mm[Hg]"
                },
                effectiveDateTime=timestamp,
                subject=patient_ref,
            )
            observations.append(sys_bp_obs)
        
        # Diastolic BP observation (LOINC 8462-4)
        if data.get("blood_pressure_dia"):
            dia_bp_obs = Observation.construct(
                id=str(uuid.uuid4()),
                status="final",
                code={
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": "8462-4",
                            "display": "Diastolic blood pressure"
                        }
                    ]
                },
                valueQuantity={
                    "value": float(data["blood_pressure_dia"]),
                    "unit": "mmHg",
                    "system": "http://unitsofmeasure.org",
                    "code": "mm[Hg]"
                },
                effectiveDateTime=timestamp,
                subject=patient_ref,
            )
            observations.append(dia_bp_obs)
        
        # Heart rate observation (LOINC 8867-4)
        if data.get("heart_rate"):
            hr_obs = Observation.construct(
                id=str(uuid.uuid4()),
                status="final",
                code={
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": "8867-4",
                            "display": "Heart rate"
                        }
                    ]
                },
                valueQuantity={
                    "value": float(data["heart_rate"]),
                    "unit": "beats/min",
                    "system": "http://unitsofmeasure.org",
                    "code": "/min"
                },
                effectiveDateTime=timestamp,
                subject=patient_ref,
            )
            observations.append(hr_obs)
        
        return observations

    def build_condition(self, data: Dict[str, Any], patient_id: str) -> Condition | None:
        """Build FHIR Condition resource if condition exists."""
        condition_text = data.get("condition")
        if not condition_text:
            return None
        
        condition = Condition.construct(
            id=str(uuid.uuid4()),
            clinicalStatus={
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                        "code": "active",
                        "display": "Active"
                    }
                ]
            },
            code={
                "text": condition_text
            },
            subject=Reference.construct(reference=f"Patient/{patient_id}"),
        )
        
        return condition

    def build_medications(self, data: Dict[str, Any], patient_id: str) -> List[MedicationStatement]:
        """Build FHIR MedicationStatement resources for medications."""
        medications = []
        meds_list = data.get("medications", [])
        
        if not meds_list:
            return medications
        
        timestamp = datetime.now(timezone.utc).isoformat()
        patient_ref = Reference.construct(reference=f"Patient/{patient_id}")
        
        for med in meds_list:
            if not med or not str(med).strip():
                continue
            
            med_stmt = MedicationStatement.construct(
                id=str(uuid.uuid4()),
                status="active",
                medication={
                    "text": str(med).strip()
                },
                subject=patient_ref,
                effectiveDateTime=timestamp,
            )
            medications.append(med_stmt)
        
        return medications

    def build_bundle(self, resources: List[Any], patient_id: str) -> Bundle:
        """Build FHIR Bundle from resources."""
        entries = []
        
        for resource in resources:
            resource_type = resource.__class__.__name__
            resource_id = getattr(resource, "id", str(uuid.uuid4()))
            
            entries.append({
                "fullUrl": f"{resource_type}/{resource_id}",
                "resource": resource.model_dump(by_alias=True, exclude_none=True)
            })
        
        bundle = Bundle.construct(
            id=str(uuid.uuid4()),
            type="collection",
            entry=entries,
        )
        
        return bundle

    async def convert_to_fhir(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert parsed EHR data into a FHIR Bundle.
        """
        patient_id = str(data.get("patient_id", ""))
        if not patient_id:
            raise HTTPException(status_code=400, detail="patient_id is required")

        # Build all resources
        patient = self.build_patient(data)
        observations = self.build_observations(data, patient_id)
        condition = self.build_condition(data, patient_id)
        medications = self.build_medications(data, patient_id)
        
        # Collect all resources
        resources = [patient] + observations
        if condition:
            resources.append(condition)
        resources.extend(medications)
        
        # Build bundle
        bundle = self.build_bundle(resources, patient_id)
        json_data = bundle.json(indent=2)

        # Save to local storage
        timestamp = datetime.now(timezone.utc)
        timestamp_str = timestamp.isoformat().replace(":", "-")
        base_dir = Path("data/fhir") / str(patient_id)
        base_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = base_dir / f"{timestamp_str}.json"
        relative_path = f"fhir/{patient_id}/{file_path.name}"
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(json_data)
        
        file_url = f"/static/{relative_path}"

        # Store metadata in SQLite
        with Session(engine) as session:
            fhir_bundle = FHIRBundle(
                patient_id=int(patient_id),
                file_path=str(relative_path),
                created_at=timestamp,
            )
            session.add(fhir_bundle)
            session.commit()
            session.refresh(fhir_bundle)

        logger.info("Stored FHIR bundle for patient %s at %s", patient_id, relative_path)
        return {"patient_id": patient_id, "fhir_url": file_url}

    async def get_fhir_for_patient(self, patient_id: str) -> Dict[str, Any]:
        """Retrieve most recent FHIR bundle URL for a patient from SQLite."""

        with Session(engine) as session:
            statement = (
                select(FHIRBundle)
                .where(FHIRBundle.patient_id == int(patient_id))
                .order_by(desc(FHIRBundle.created_at))
                .limit(1)
            )
            result = session.exec(statement).first()
            
            if not result:
                raise HTTPException(status_code=404, detail="FHIR bundle not found")
            
            return {
                "id": str(result.id),
                "patientId": str(result.patient_id),
                "storagePath": result.file_path,
                "url": f"/static/{result.file_path}",
                "createdAt": result.created_at.isoformat(),
            }


fhir_service = FHIRService()


