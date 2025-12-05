"""
Digital Twin Orchestrator
Full Pipeline:
    Step 1 → ODE Baseline
    Step 2 → PK
    Step 3 → PD
    Step 4 → ODE with Drug Effects
    Step 5 → LSTM Features
    Step 6 → Auto Plots (PK, HR, BP, Dashboard)
    Step 7 → PDF Clinical Report
"""

import pickle
from datetime import datetime
from pathlib import Path
import numpy as np
import matplotlib.pyplot as plt

# PDF ReportLab imports
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch

from ode_model import CardiovascularODE
from pk_model import PKModel
from pd_model import PDModel
from schemas import (
    PatientBaseline,
    DrugConcentration,
    PhysiologicalEffects,
    SimulationTrajectory,
    LSTMFeatures,
)

# =====================================================================
# PDF REPORT
# =====================================================================
def generate_pdf_report(
    baseline: PatientBaseline,
    drug_conc: DrugConcentration,
    effects: PhysiologicalEffects,
    trajectory: SimulationTrajectory,
    pdf_path="data/clinical_report.pdf",
    image_dir="data",
):
    """Generate the clinical report PDF."""

    pdf_path = str(pdf_path)
    image_dir = Path(image_dir)

    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(pdf_path, pagesize=A4)
    elements = []

    # ------------------- TITLE -------------------
    elements.append(Paragraph("<b>Digital Twin Clinical Report</b>", styles["Title"]))
    elements.append(Spacer(1, 0.3 * inch))

    # ------------------- BASELINE -------------------
    elements.append(Paragraph("<b>Patient Baseline</b>", styles["Heading2"]))
    elements.append(Paragraph(
        f"Patient ID: {baseline.patient_id}<br/>"
        f"Age: {baseline.age}<br/>"
        f"Sex: {baseline.sex}<br/>"
        f"Weight: {baseline.weight} kg<br/>"
        f"Height: {baseline.height} cm<br/>"
        f"Baseline HR: {baseline.hr_baseline} bpm<br/>"
        f"Baseline BP: {baseline.sbp_baseline}/{baseline.dbp_baseline} mmHg<br/>"
        f"Baseline CO: {baseline.cardiac_output:.2f} L/min<br/>"
        f"Arrhythmia Risk: {baseline.arrhythmia_risk}<br/>",
        styles["BodyText"]
    ))
    elements.append(Spacer(1, 0.3 * inch))

    # ------------------- PK -------------------
    elements.append(Paragraph("<b>Pharmacokinetics (PK)</b>", styles["Heading2"]))
    elements.append(Paragraph(
        f"Dose: {drug_conc.dose_mg} mg<br/>"
        f"Cmax_ss: {drug_conc.Cmax_ss:.2f} ng/mL<br/>"
        f"Cmin_ss: {drug_conc.Cmin_ss:.2f} ng/mL<br/>"
        f"Cavg_ss: {drug_conc.Cavg_ss:.2f} ng/mL<br/>"
        f"Accumulation: {drug_conc.accumulation_factor:.2f}<br/>"
        f"Fluctuation: {drug_conc.fluctuation_percent:.1f}%<br/>",
        styles["BodyText"]
    ))
    elements.append(Spacer(1, 0.3 * inch))

    # ------------------- PD -------------------
    elements.append(Paragraph("<b>Pharmacodynamics (PD)</b>", styles["Heading2"]))
    elements.append(Paragraph(
        f"Peak HR Change: {np.min(effects.delta_hr):.1f} bpm<br/>"
        f"Peak SBP Change: {np.min(effects.delta_sbp):.1f} mmHg<br/>"
        f"Hypotension Risk: {effects.hypotension_risk}<br/>"
        f"Bradycardia Risk: {effects.bradycardia_risk}<br/>",
        styles["BodyText"]
    ))
    elements.append(Spacer(1, 0.3 * inch))

    # ------------------- ODE -------------------
    elements.append(Paragraph("<b>ODE Simulation Summary</b>", styles["Heading2"]))
    elements.append(Paragraph(
        f"Final HR: {trajectory.heart_rate[-1]:.1f} bpm<br/>"
        f"Final SBP: {trajectory.systolic_bp[-1]:.1f} mmHg<br/>"
        f"Final CO: {trajectory.cardiac_output[-1]:.2f} L/min<br/>"
        f"Adverse Events: {trajectory.adverse_events}<br/>",
        styles["BodyText"]
    ))
    elements.append(Spacer(1, 0.3 * inch))

    # ------------------- PLOTS -------------------
    elements.append(Paragraph("<b>Plots</b>", styles["Heading2"]))

    for img_name in [
        "pk_concentration.png",
        "heart_rate.png",
        "blood_pressure.png",
        "dashboard_pk_hr_bp.png",
    ]:
        img_path = str(image_dir / img_name)
        if Path(img_path).exists():
            elements.append(Image(img_path, width=5.5 * inch, height=3 * inch))
            elements.append(Spacer(1, 0.2 * inch))
        else:
            print(f"Warning: Image not found: {img_path}")

    doc.build(elements)
    print(f"✔ PDF saved → {pdf_path}")




import sys
import os

# Add backend to path to allow 'app' imports
# This ensures we share the same SQLModel metadata as the backend code
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parents[1] # mechanics/models -> mechanics -> Cardiology
backend_dir = project_root / "backend"

if str(backend_dir) not in sys.path:
    sys.path.append(str(backend_dir))

try:
    from app.db.db import engine
    from app.db.models import Patient
    from sqlmodel import Session, select
    DB_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import backend DB modules: {e}. DB features disabled.")
    DB_AVAILABLE = False

# =====================================================================
# ORCHESTRATOR
# =====================================================================
class DigitalTwinOrchestrator:

    def __init__(self, data_dir="data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)

        self.baseline_path = self.data_dir / "patient_baseline.pkl"
        self.drug_conc_path = self.data_dir / "drug_concentration.pkl"
        self.effects_path = self.data_dir / "physiological_effects.pkl"
        self.trajectory_path = self.data_dir / "final_trajectory.pkl"
        self.lstm_path = self.data_dir / "lstm_features.pkl"

    def fetch_patient_params(self, patient_id: str) -> dict:
        """Fetch patient parameters from the database."""
        if not DB_AVAILABLE:
            print("DB not available, cannot fetch patient.")
            return {}

        print(f"Fetching patient {patient_id} from DB...")
        try:
            with Session(engine) as session:
                statement = select(Patient).where(Patient.id == int(patient_id))
                patient = session.exec(statement).first()
                
                if not patient:
                    print(f"Patient {patient_id} not found in DB.")
                    return {}
                
                # Map DB fields to simulation params
                params = {
                    "patient_id": str(patient.id),
                    "age": patient.age,
                    "sex": "M" if patient.gender and patient.gender.lower() == "male" else "F", # Simple mapping
                    "weight": float(patient.weight) if patient.weight else 70.0,
                    "height": float(patient.height) if patient.height else 170.0,
                    "hr": float(patient.hr) if patient.hr else 75.0,
                    "sbp": float(patient.sbp) if patient.sbp else 120.0,
                    "dbp": float(patient.dbp) if patient.dbp else 80.0,
                }
                
                # Derived defaults if not explicit
                # We don't store SV/CO/SVR in Patient model yet, so use defaults or derive
                # CO ~ HR * SV / 1000. Let's assume standard SV if not known.
                params["sv"] = 70.0 
                params["co"] = (params["hr"] * params["sv"]) / 1000.0
                params["svr"] = 18.0 # Default
                params["ecg_risk"] = 0.1 # Default
                
                print(f"Fetched params: {params}")
                return params
                
        except Exception as e:
            print(f"Error fetching patient from DB: {e}")
            return {}

    # ----------------------------------------------------------------
    # FULL PIPELINE
    # ----------------------------------------------------------------
    def run_full_simulation(self, patient_params=None, patient_id=None, drug_name="metoprolol", dose_mg=25, duration_hours=168):

        print("=" * 60)
        print("DIGITAL TWIN – FULL PIPELINE")
        print("=" * 60)
        
        # Merge params
        final_params = {}
        
        # 1. Fetch from DB if ID provided
        if patient_id:
            db_params = self.fetch_patient_params(str(patient_id))
            final_params.update(db_params)
            
        # 2. Override/Augment with manual params if provided
        if patient_params:
            final_params.update(patient_params)
            
        # 3. Validation
        if not final_params:
            raise ValueError("No patient parameters provided (neither via DB nor manual dict).")

        print(f"Running simulation for Patient ID: {final_params.get('patient_id', 'Unknown')}")

        # STEP 1 — BASELINE
        print("\n[STEP 1] Initializing baseline...")
        ode = CardiovascularODE(final_params)
        baseline = ode.initialize(str(self.baseline_path))

        # STEP 2 — PK
        print("\n[STEP 2] Running PK model...")
        pk = PKModel(drug_name, dose_mg, final_params.get("weight", 70.0))
        drug_conc = pk.simulate(
            baseline_path=str(self.baseline_path),
            output_path=str(self.drug_conc_path),
            duration_hours=duration_hours,
        )

        # STEP 3 — PD
        print("\n[STEP 3] Running PD model...")
        pd = PDModel(drug_name)
        effects = pd.compute_effects(
            baseline_path=str(self.baseline_path),
            concentration_path=str(self.drug_conc_path),
            output_path=str(self.effects_path),
        )

        # STEP 4 — ODE with Effects
        print("\n[STEP 4] Running ODE with drug effects...")
        trajectory = ode.simulate_with_effects(
            baseline_path=str(self.baseline_path),
            effects_path=str(self.effects_path),
            output_path=str(self.trajectory_path),
            duration_hours=duration_hours,
        )

        # STEP 5 — LSTM
        print("\n[STEP 5] Preparing LSTM features...")
        lstm_features = self.prepare_lstm_features()

        # =====================================================================
        # STEP 6 — SAVE PLOTS
        # =====================================================================
        print("\n[STEP 6] Saving plots to data/...")

        # PK
        plt.figure(figsize=(10, 5))
        plt.plot(drug_conc.time_hours, drug_conc.concentration_mg_L)
        plt.title("PK Concentration Curve")
        plt.xlabel("Time (hours)")
        plt.ylabel("mg/L")
        plt.grid(True)
        plt.savefig(self.data_dir / "pk_concentration.png", dpi=300)
        plt.close()

        # HR
        plt.figure(figsize=(10, 5))
        plt.plot(trajectory.time_hours, trajectory.heart_rate, color="red")
        plt.title("Heart Rate Over Time")
        plt.xlabel("Hours")
        plt.ylabel("BPM")
        plt.grid(True)
        plt.savefig(self.data_dir / "heart_rate.png", dpi=300)
        plt.close()

        # BP
        plt.figure(figsize=(10, 5))
        plt.plot(trajectory.time_hours, trajectory.systolic_bp, label="SBP")
        plt.plot(trajectory.time_hours, trajectory.diastolic_bp, label="DBP")
        plt.title("Blood Pressure Over Time")
        plt.xlabel("Hours")
        plt.ylabel("mmHg")
        plt.legend()
        plt.grid(True)
        plt.savefig(self.data_dir / "blood_pressure.png", dpi=300)
        plt.close()

        # Combined Dashboard
        fig, axes = plt.subplots(3, 1, figsize=(12, 12), sharex=True)
        axes[0].plot(drug_conc.time_hours, drug_conc.concentration_mg_L, color='purple')
        axes[0].set_title("PK Concentration (mg/L)")
        axes[1].plot(trajectory.time_hours, trajectory.heart_rate, color='red')
        axes[1].set_title("Heart Rate Over Time")
        axes[2].plot(trajectory.time_hours, trajectory.systolic_bp, label="SBP", color='blue')
        axes[2].plot(trajectory.time_hours, trajectory.diastolic_bp, label="DBP", color='green')
        axes[2].set_title("Blood Pressure Over Time")
        axes[2].legend()
        plt.tight_layout()
        plt.savefig(self.data_dir / "dashboard_pk_hr_bp.png", dpi=300)
        plt.close()

        print("✔ All plots saved.")

        # =====================================================================
        # STEP 7 — PDF REPORT
        # =====================================================================
        print("\n[STEP 7] Generating clinical PDF report...")
        generate_pdf_report(
            baseline=baseline,
            drug_conc=drug_conc,
            effects=effects,
            trajectory=trajectory,
            pdf_path=str(self.data_dir / "clinical_report.pdf"),
            image_dir=self.data_dir,
        )

        print("\n--- Pipeline complete ---")
        return {
            "baseline": baseline,
            "pk": drug_conc,
            "pd": effects,
            "trajectory": trajectory,
            "lstm": lstm_features,
        }


    # ----------------------------------------------------------------
    # LSTM FEATURES
    # ----------------------------------------------------------------
    def prepare_lstm_features(self):
        with open(self.baseline_path, "rb") as f: baseline = pickle.load(f)
        with open(self.drug_conc_path, "rb") as f: drug = pickle.load(f)
        with open(self.trajectory_path, "rb") as f: traj = pickle.load(f)

        t = np.asarray(traj.time_hours)
        hr = np.asarray(traj.heart_rate)
        bp = np.asarray(traj.systolic_bp)
        co = np.asarray(traj.cardiac_output)

        conc = np.interp(t, drug.time_hours, drug.concentration_mg_L)

        hr_vel = np.gradient(hr, t)
        bp_vel = np.gradient(bp, t)
        conc_grad = np.gradient(conc, t)

        # 24-hour ahead target
        target_hr = []
        for i, ti in enumerate(t):
            future = ti + 24
            idx = (np.abs(t - future)).argmin()
            target_hr.append(hr[idx])
        target_hr = np.array(target_hr)

        features = LSTMFeatures(
            patient_id=baseline.patient_id,
            age=baseline.age,
            weight=baseline.weight,
            baseline_hr=baseline.hr_baseline,
            baseline_bp=baseline.sbp_baseline,
            baseline_ef=baseline.ejection_fraction,
            arrhythmia_risk=baseline.arrhythmia_risk,
            time_hours=t,
            drug_concentration=conc,
            heart_rate_history=hr,
            bp_history=bp,
            co_history=co,
            hr_velocity=hr_vel,
            bp_velocity=bp_vel,
            concentration_gradient=conc_grad,
            target_hr_next_24h=target_hr,
            target_adverse_event=1 if traj.adverse_events else 0,
            timestamp=datetime.now().isoformat(),
        )

        with open(self.lstm_path, "wb") as f:
            pickle.dump(features, f)

        return features


# =====================================================================
# MANUAL TEST
# =====================================================================
if __name__ == "__main__":
    # Example usage with DB ID
    # orchestrator = DigitalTwinOrchestrator()
    # orchestrator.run_full_simulation(patient_id="1")
    
    # Fallback manual
    example_patient = {
        "patient_id": "1",
        "age": 55,
        "sex": "M",
        "weight": 62.0,
        "height": 170.0,
        "hr": 95,
        "sbp": 150,
        "dbp": 95,
        "sv": 70,
        "co": 5.4,
        "svr": 18.0,
        "ecg_risk": 0.2,
    }

    orchestrator = DigitalTwinOrchestrator()
    orchestrator.run_full_simulation(
        patient_params=example_patient,
        drug_name="metoprolol",
        dose_mg=25,
        duration_hours=168,
    )

