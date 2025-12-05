import json
from pathlib import Path

EHR_BASE_DIR = Path(__file__).resolve().parents[1]
PATIENTS_DIR = EHR_BASE_DIR / "data" / "processed" / "patients"


def save_patient_timeline(patient_id, patient_data):
    filename = PATIENTS_DIR / f"{patient_id}.json"
    PATIENTS_DIR.mkdir(parents=True, exist_ok=True)
    with open(filename, "w") as f:
        json.dump(patient_data, f, indent=2, default=str)