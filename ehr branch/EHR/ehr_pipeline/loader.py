# ehr_pipeline/loader.py
# FINAL VERSION - contains process_all_data() used by run.py

import os
from pathlib import Path

import pandas as pd

from ehr_pipeline.normalizer import normalize_row
from ehr_pipeline.fhir_converter import save_fhir_bundle

EHR_BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = EHR_BASE_DIR / "data"
RAW_DATA = DATA_DIR / "raw"
UPLOADS = RAW_DATA / "uploads"
PROCESSED_DIR = DATA_DIR / "processed"
PATIENTS_DIR = PROCESSED_DIR / "patients"
FHIR_DIR = PROCESSED_DIR / "fhir"

def process_all_data():
    print("Starting to process all raw CSV files...")
    
    # Ensure output folders exist
    PATIENTS_DIR.mkdir(parents=True, exist_ok=True)
    FHIR_DIR.mkdir(parents=True, exist_ok=True)
    
    processed = 0
    for csv_path in list(RAW_DATA.rglob("*.csv")) + list(UPLOADS.rglob("*.csv")):
        if csv_path.name.startswith("~$"):  # Skip temporary Excel files
            continue
            
        print(f"Processing: {csv_path.name}")
        try:
            df = pd.read_csv(csv_path, dtype=str, na_filter=False)
            df['_source_file'] = csv_path.name
            
            for _, row in df.iterrows():
                normalized = normalize_row(row.to_dict())
                patient_id = normalized["patient_id"]
                
                # Save normalized patient JSON
                patient_file = PATIENTS_DIR / f"{patient_id}.json"
                with open(patient_file, "w", encoding="utf-8") as f:
                    import json
                    json.dump(normalized, f, indent=2, ensure_ascii=False)
                
                # Save FHIR bundle
                save_fhir_bundle(patient_id, normalized)
                
                processed += 1
        except Exception as e:
            print(f"Error processing {csv_path.name}: {e}")
    
    print(f"All processed! Total patients: {processed}")