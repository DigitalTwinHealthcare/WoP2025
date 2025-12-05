## CardioTwin EHR Pipeline (No Server)

This branch contains a **standalone EHR data pipeline** only. It does **not** run any web server, API, or FastAPI app.

### Files and Folders
- **EHR/ehr_pipeline/loader.py**: Walks the `EHR/data/raw` and `EHR/data/raw/uploads` folders, reads CSVs, normalizes each row, saves a per-patient JSON, and creates a FHIR bundle per patient.
- **EHR/ehr_pipeline/normalizer.py**: Cleans raw tabular EHR data (age, gender, vitals, meds, MI flag, etc.) into a consistent patient schema and maps Indian brand drug names to generic names using `EHR/data/mappings/indian_drugs.csv`.
- **EHR/ehr_pipeline/fhir_converter.py**: Converts a normalized patient record into FHIR resources and writes a FHIR `Bundle` JSON for each patient under `EHR/data/processed/fhir`.
- **EHR/ehr_pipeline/timeline_builder.py** (optional): Helper to write patient timelines into `EHR/data/processed/patients`.
- **EHR/data/**: On-disk storage layout for the pipeline:
  - **mappings/indian_drugs.csv**: Lookup table for Indian brand → generic drug names.
  - **raw/**: Place raw CSVs here (and optionally under `raw/uploads/`) before running the pipeline.
  - **processed/**: The pipeline writes normalized patient JSONs under `processed/patients/` and FHIR bundles under `processed/fhir/`.
- **EHR/instruction.md**: EHR-specific usage/notes for this branch.

### How the Pipeline Works
- **Input**: You drop one or more CSV files into `EHR/data/raw` (or `EHR/data/raw/uploads`).
- **Step 1 – Normalize**: `normalizer.normalize_row()` converts each raw row into a clean, structured patient record and standardizes medication names using the Indian drug mapping.
- **Step 2 – Persist Patient JSON**: `loader.process_all_data()` writes one JSON per patient into `EHR/data/processed/patients`.
- **Step 3 – FHIR Conversion**: For each normalized patient, `fhir_converter.save_fhir_bundle()` creates a FHIR `Bundle` and writes it to `EHR/data/processed/fhir`.

### No Server in This Branch
- There is **no FastAPI app, no `main.py`, and no `server.py`** in this branch.
- The code here is intended to be **called from scripts or other services**, not to be run as an HTTP service on its own.


