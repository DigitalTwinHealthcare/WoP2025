# DigiTwin Backend – Setup Guide

This guide explains how to install, configure, and run the DigiTwin backend. This backend powers the Cardiology, Neurology, and Pulmonology digital twins.

---

## 1. Prerequisites & Folder Structure

Ensure your project root has the following structure. The backend relies on sibling directories (`mechanics`, `ehr branch`) for simulation logic and EHR processing.

```
Cardiology/
├── backend/          <-- You are here
├── mechanics/        <-- Contains ODE models & Orchestrator
├── ehr branch/       <-- Contains EHR pipeline (normalizer, FHIR converter)
├── Neurology/        <-- Contains Neurology models & resources
└── frontend/         <-- React application
```

---

## 2. Installation

### A. Create Virtual Environment

```sh
cd backend
python -m venv venv
```

**Activate:**
*   **Windows:** `venv\Scripts\activate`
*   **Mac/Linux:** `source venv/bin/activate`

### B. Install Dependencies

```sh
pip install -r requirements.txt
```

**Note:** This now includes `nibabel` and `numpy` for Neurology MRI analysis.
```

---

## 3. Configuration

### A. Create `.env` File
Create a `.env` file in the `backend/` folder with the following keys:

```ini
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-bucket
FIREBASE_CREDENTIALS_FILE=credentials/service-account.json
```

### B. Setup Credentials
1.  Place your Firebase Admin SDK JSON file in `backend/credentials/`.
2.  Update `FIREBASE_CREDENTIALS_FILE` in `.env` to point to it.

### C. Create Data Directories
The backend requires these folders to store simulation outputs:

```sh
mkdir data
mkdir data/exports
mkdir data/simulations
```

---

## 4. Running the Backend

The frontend expects the backend to run on **Port 8001** (or 8000, check your frontend config).

```sh
# Run on port 8001 (Recommended for current frontend)
uvicorn app.main:app --reload --port 8001
```

*   **API Docs:** [http://localhost:8001/docs](http://localhost:8001/docs)
*   **Static Files:** [http://localhost:8001/static](http://localhost:8001/static)

---

## 5. Key API Endpoints

### Digital Twin Simulation
*   **`POST /twin/simulate`**: Runs the full cardiology simulation (ODE + PK/PD).
    *   *Input*: Patient ID, Drug Name, Dose.
    *   *Output*: Paths to generated PDF report and plots.

### Neurology Integration
*   **`POST /twin/analyze_scan`**: Performs volumetric analysis on uploaded NIfTI (`.nii`, `.nii.gz`) brain scans.
    *   *Logic*: Uses `nibabel` to calculate brain volume and matches it to a clinical stage (Healthy, Mild, Severe).
    *   *Output*: Returns brain volume, clinical stage, and a matching biological neuron model (`.swc` geometry) from `backend/data/neuron_library`.

### Frontend Compatibility
*   **`POST /twin/init`**: Initializes a digital twin session.
*   **`POST /twin/export`**: Saves exported reports/images from the frontend to the database.

### Patient Management
*   **`POST /patients`**: Create a new patient (supports EHR file upload).
*   **`GET /patients/{id}`**: Retrieve patient details.

---

## 6. How it Works

1.  **EHR Integration**: When a patient is created with an uploaded CSV/JSON, the backend uses `ehr branch/EHR/ehr_pipeline` to normalize the data and map Indian drug names.
2.  **Simulation**: When `/twin/simulate` is called, the backend invokes `mechanics/models/orchestrator.py`.
    *   It fetches patient parameters from the SQLite database (`digitwin.db`).
    *   It runs the ODE model and generates plots/reports in `backend/data/simulations/`.
3.  **Export**: The frontend can send generated artifacts back to `/twin/export`, which saves them in `backend/data/exports/` and logs them in the database.

---

## 7. Troubleshooting

*   **ModuleNotFoundError: No module named 'mechanics'**:
    *   Ensure you are running `uvicorn` from the `backend/` directory.
    *   Ensure the `mechanics` folder exists in the parent directory (`../mechanics`).
*   **Port Mismatch**:
    *   If the frontend says "Network Error", check if it's trying to hit port 8000 or 8001, and match your `uvicorn` command to that port.
