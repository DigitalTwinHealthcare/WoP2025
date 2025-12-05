# ehr_pipeline/fhir_converter.py — FINAL 100% WORKING VERSION

from pathlib import Path

from fhir.resources.patient import Patient
from fhir.resources.observation import Observation
from fhir.resources.bundle import Bundle
from fhir.resources.medicationstatement import MedicationStatement
from fhir.resources.humanname import HumanName
from fhir.resources.reference import Reference
from fhir.resources.condition import Condition
from fhir.resources.codeableconcept import CodeableConcept

import json
import uuid
from datetime import datetime

EHR_BASE_DIR = Path(__file__).resolve().parents[1]
FHIR_DIR = EHR_BASE_DIR / "data" / "processed" / "fhir"
FHIR_DIR.mkdir(parents=True, exist_ok=True)

def save_fhir_bundle(patient_id: str, patient_data: dict):
    print("FHIR CONVERTER LOADED FROM:", __file__)

    # Patient resource
    patient = Patient.model_construct(
        id=patient_id,
        gender=patient_data["gender"].lower() if patient_data["gender"] in ["M", "F"] else "unknown",
        birthDate=f"{datetime.now().year - patient_data['age']}-01-01"
    )
          # === PRIVACY-COMPLIANT PATIENT NAME ===
    # We never store real names in training data → use anonymized display
    patient_display = f"Patient {patient_id}"
    name = HumanName.model_construct(text=patient_display)
    patient.name = [name]
    entries = [{
        "fullUrl": f"Patient/{patient_id}",
        "resource": patient.model_dump(by_alias=True, exclude_none=True)
    }]

    def create_quantity_observation(loinc_code: str, display: str, value: float, unit: str, code_override: str = None):
        obs = Observation.model_construct(
            id=str(uuid.uuid4()),
            status="final",
            code={
                "coding": [{
                    "system": "http://loinc.org",
                    "code": loinc_code,
                    "display": display
                }]
            },
            valueQuantity={
                "value": value,
                "unit": unit,
                "system": "http://unitsofmeasure.org",
                "code": code_override or unit
            },
            effectiveDateTime=datetime.now().isoformat(),
            subject=Reference.model_construct(reference=f"Patient/{patient_id}")
        )
        entries.append({
            "fullUrl": f"Observation/{obs.id}",
            "resource": obs.model_dump(by_alias=True, exclude_none=True)
        })

    # Heart Rate
    if patient_data.get("heart_rate") is not None:
        try:
            hr_val = float(patient_data["heart_rate"])
            create_quantity_observation(
                loinc_code="8867-4",
                display="Heart rate",
                value=hr_val,
                unit="beats/min",
                code_override="beats/min"
            )
        except (ValueError, TypeError):
            pass

    # Systolic BP
    if patient_data.get("bp_systolic") is not None:
        try:
            sbp_val = float(patient_data["bp_systolic"])
            create_quantity_observation(
                loinc_code="8480-6",
                display="Systolic blood pressure",
                value=sbp_val,
                unit="mmHg",
                code_override="mm[Hg]"
            )
        except (ValueError, TypeError):
            pass

    # Diastolic BP
    if patient_data.get("bp_diastolic") is not None:
        try:
            dbp_val = float(patient_data["bp_diastolic"])
            create_quantity_observation(
                loinc_code="8462-4",
                display="Diastolic blood pressure",
                value=dbp_val,
                unit="mmHg",
                code_override="mm[Hg]"
            )
        except (ValueError, TypeError):
            pass

    # Weight (LOINC 29463-7)
    if patient_data.get("weight_kg") is not None:
        try:
            wt_val = float(patient_data["weight_kg"])
            create_quantity_observation(
                loinc_code="29463-7",
                display="Body Weight",
                value=wt_val,
                unit="kg",
                code_override="kg"
            )
        except (ValueError, TypeError):
            pass

    # Height (LOINC 8302-2)
    if patient_data.get("height_cm") is not None:
        try:
            ht_val = float(patient_data["height_cm"])
            create_quantity_observation(
                loinc_code="8302-2",
                display="Body Height",
                value=ht_val,
                unit="cm",
                code_override="cm"
            )
        except (ValueError, TypeError):
            pass

    # Myocardial Infarction condition
    if patient_data.get("myocardial_infarction") is True:
        mi_condition = Condition.model_construct(
            id=str(uuid.uuid4()),
            clinicalStatus={
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                    "code": "active",
                    "display": "Active"
                }]
            },
            code={
                "coding": [{
                    "system": "http://snomed.info/sct",
                    "code": "22298006",
                    "display": "Myocardial infarction"
                }]
            },
            subject=Reference.model_construct(reference=f"Patient/{patient_id}")
        )
        entries.append({
            "fullUrl": f"Condition/{mi_condition.id}",
            "resource": mi_condition.model_dump(by_alias=True, exclude_none=True)
        })

    # Medications (Indian brand → generic)
    meds_text = patient_data.get("medications_standardized", "")
    if meds_text.strip():
        med_list = [m.strip() for m in meds_text.split(",") if m.strip()]
        for med in med_list:
            med_stmt = MedicationStatement.model_construct(
                id=str(uuid.uuid4()),
                status="active",
                medication=CodeableConcept.model_construct(
                    text=med
                ),
                subject=Reference.model_construct(reference=f"Patient/{patient_id}"),
                effectiveDateTime=datetime.now().isoformat()
            )
            entries.append({
                "fullUrl": f"MedicationStatement/{med_stmt.id}",
                "resource": med_stmt.model_dump(by_alias=True, exclude_none=True)
            })

    # Final Bundle
    bundle = Bundle.construct(
        id=str(uuid.uuid4()),
        type="collection",
        entry=entries
    )

    filename = FHIR_DIR / f"{patient_id}.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(bundle.model_dump(by_alias=True, exclude_none=True), f, indent=2)

    print(f"FHIR bundle saved for patient {patient_id} → {filename.name}")