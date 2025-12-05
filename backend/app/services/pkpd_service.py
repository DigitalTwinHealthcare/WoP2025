from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict

from app.schemas.ml_inputs import PKPDSimulateRequest, PKPDSimulateResponse
from app.services.report_service import report_service
from app.utils.logger import get_logger
from app.utils.preprocessors import preprocess_pkpd_inputs

logger = get_logger(__name__)


import sys
import os

# Add the parent directory to sys.path to allow importing mechanics
# Assuming mechanics is at the same level as backend or one level up
# Based on file structure: Cardiology/mechanics and Cardiology/backend
# We need to add Cardiology to path
current_dir = Path(__file__).resolve().parent
cardiology_dir = current_dir.parent.parent.parent
if str(cardiology_dir) not in sys.path:
    sys.path.append(str(cardiology_dir))

# Also add mechanics/models to path so 'import schemas' in pk_model.py works
mechanics_models_dir = cardiology_dir / "mechanics" / "models"
if str(mechanics_models_dir) not in sys.path:
    sys.path.append(str(mechanics_models_dir))

try:
    from mechanics.models.pk_model import PKModel
except ImportError:
    # Fallback if path setup fails, though it should work based on structure
    logger.warning("Could not import PKModel from mechanics. Using dummy data.")
    PKModel = None

class PKPDService:
    """Full PK/PD simulation + dose comparison service."""

    def __init__(self) -> None:
        self.model = "mechanistic-pk-model"

    # --------------------------------------------------------
    # ✔ ORIGINAL FUNCTION (used by /simulate_drug)
    # --------------------------------------------------------
    async def simulate(self, payload: PKPDSimulateRequest) -> PKPDSimulateResponse:
        """Simulates PK/PD for one drug dose."""
        features = preprocess_pkpd_inputs(payload.dose_mg, payload.duration_h)
        logger.debug("PK/PD features: %s", features)

        simulation_data = {}
        summary = ""

        if PKModel:
            try:
                # Instantiate PKModel
                # Mapping payload to PKModel args
                # PKModel(drug_name, dose_mg, patient_weight, tau_hours, n_days)
                
                # Default values if not provided
                weight = payload.weight_kg if payload.weight_kg else 70.0
                tau = payload.dosing_interval_h if payload.dosing_interval_h else 12
                # duration_h to n_days (approx)
                n_days = int(payload.duration_h / 24) if payload.duration_h else 7
                if n_days < 1: n_days = 1

                pk = PKModel(
                    drug_name=payload.drug_name,
                    dose_mg=payload.dose_mg,
                    patient_weight=weight,
                    tau_hours=tau,
                    n_days=n_days
                )

                # Run simulation
                # We need a dummy baseline path or modify simulate to accept direct args
                # The PKModel.simulate method takes baseline_path. 
                # Let's look at PKModel.simulate again. It loads baseline for... nothing really important?
                # Actually it loads baseline to get nothing? Wait, let me check PKModel again.
                # It loads baseline but doesn't seem to use it for the core calculation if we passed weight in __init__.
                # Ah, wait. In __init__: self.Vd = p['Vd'] * patient_weight.
                # In simulate: loads baseline... 
                # Let's bypass the file loading if possible or create a dummy one.
                # Actually, looking at the code:
                # with open(baseline_path, "rb") as f: baseline = pickle.load(f)
                # It doesn't use 'baseline' variable after loading it! 
                # So we can just create a dummy file or try to bypass it.
                # But we can't easily bypass it without changing PKModel code.
                # I will create a dummy baseline file in data/tmp_baseline.pkl
                
                dummy_baseline_path = "data/tmp_baseline.pkl"
                # Ensure directory exists
                os.makedirs("data", exist_ok=True)
                import pickle
                with open(dummy_baseline_path, "wb") as f:
                    pickle.dump({"dummy": "data"}, f)

                # Output path
                output_path = f"data/pk_output_{payload.patient_id}_{payload.drug_name}.pkl"
                
                pk_output = pk.simulate(
                    baseline_path=dummy_baseline_path,
                    output_path=output_path,
                    duration_hours=payload.duration_h
                )
                
                # Construct simulation data for frontend
                # pk_output is a DrugConcentration object
                simulation_data = {
                    "time_hours": pk_output.time_hours.tolist(),
                    "concentration_mg_L": pk_output.concentration_mg_L.tolist(),
                    "parameters": {
                        "Cmax_ss": pk_output.Cmax_ss,
                        "Cmin_ss": pk_output.Cmin_ss,
                        "Cavg_ss": pk_output.Cavg_ss,
                        "AUC_ss": pk_output.AUC_ss,
                        "accumulation_factor": pk_output.accumulation_factor,
                        "fluctuation_percent": pk_output.fluctuation_percent
                    }
                }

                summary = (
                    f"Simulated {payload.drug_name} ({payload.dose_mg}mg q{tau}h). "
                    f"Steady-state Cmax: {pk_output.Cmax_ss:.2f} mg/L, "
                    f"Cmin: {pk_output.Cmin_ss:.2f} mg/L."
                )

            except Exception as e:
                logger.error(f"Error running PKModel: {e}")
                summary = f"Error running simulation: {e}"
        else:
            summary = "PKModel not available. Using dummy data."
            # Fallback to dummy
            sim = self.run_single_dose(payload.drug_name, payload.dose_mg, payload.duration_h)
            simulation_data = {
                "time_hours": sim["time"],
                "concentration_mg_L": sim["concentration"],
                "parameters": {
                    "Cmax_ss": sim["cmax"],
                    "AUC_ss": sim["auc"]
                }
            }

        # Save result file locally (keep existing logic for report service compatibility)
        timestamp = datetime.now(timezone.utc)
        timestamp_str = timestamp.isoformat().replace(":", "-")
        base_dir = Path("data/ml") / "pkpd" / str(payload.patient_id)
        base_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = base_dir / f"{payload.drug_name}_{timestamp_str}.json"
        relative_path = f"ml/pkpd/{payload.patient_id}/{file_path.name}"
        
        content = {
            "patient_id": payload.patient_id,
            "drug_name": payload.drug_name,
            "dose_mg": payload.dose_mg,
            "duration_h": payload.duration_h,
            "summary": summary,
            "simulation_data": simulation_data
        }
        
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(content, f, indent=2)
        
        result_url = f"/static/{relative_path}"

        # Create report
        report = await report_service.create_report(
            patient_id=payload.patient_id,
            report_type="pkpd",
            result_file_url=result_url,
            extra={"drug_name": payload.drug_name},
        )

        return PKPDSimulateResponse(
            patient_id=payload.patient_id,
            drug_name=payload.drug_name,
            summary=summary,
            report_id=str(report.id),
            result_file_url=result_url,
            simulation_data=simulation_data
        )

    # --------------------------------------------------------
    # ✔ NEW ODE SIMULATION HELPER FOR REAL PK MODEL
    # --------------------------------------------------------
    def run_single_dose(self, drug: str, dose_mg: float, duration_h: float) -> Dict:
        """
        Placeholder PK ODE simulation.
        Replace later with your real model.
        """

        # Placeholder concentration curve:
        time_points = [i for i in range(int(duration_h) + 1)]
        conc_curve = [dose_mg * (1 - (t / duration_h)) for t in time_points]

        cmax = max(conc_curve)
        auc = sum(conc_curve)

        return {
            "time": time_points,
            "concentration": conc_curve,
            "cmax": cmax,
            "auc": auc
        }

    # --------------------------------------------------------
    # ✔ NEW FUNCTION USED BY /compare_doses
    # --------------------------------------------------------
    def compare_doses(self, drug: str, doses: List[float], duration: float):
        """Simulates multiple doses and returns comparison."""
        results = []

        for dose in doses:
            sim = self.run_single_dose(drug, dose, duration)
            results.append({
                "dose": dose,
                "cmax": sim["cmax"],
                "auc": sim["auc"],
                "curve": [
                    {"t": sim["time"][i], "c": sim["concentration"][i]}
                    for i in range(len(sim["time"]))
                ]
            })

        return results


pkpd_service = PKPDService()
