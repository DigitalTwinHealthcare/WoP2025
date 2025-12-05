"""
ODE-based digital twin using the full 4-chamber cardiovascular model
Integrates with PK–PD pipeline and produces SimulationTrajectory
"""

import numpy as np
import pickle
from datetime import datetime
from schemas import PatientBaseline, PhysiologicalEffects, SimulationTrajectory


class CardiovascularODE:
    """
    High-level cardiovascular model wrapper.

    NOTE:
    - This version does NOT solve a complex ODE system.
    - Instead, it uses the PD outputs (delta_hr, delta_sbp, etc.)
      to construct a physiologically reasonable trajectory that
      matches the SimulationTrajectory schema exactly.
    """

    def __init__(self, patient_params: dict):
        self.patient = patient_params
        self._set_physiological_parameters()

    # -------------------------------------------------------------
    # PARAMETER SETUP
    # -------------------------------------------------------------
    def _set_physiological_parameters(self):
        """Load baseline values safely with defaults."""
        self.patient_id = str(self.patient.get("patient_id", "unknown"))

        self.age = int(self.patient.get("age", 50))
        self.sex = self.patient.get("sex", "M")
        self.weight = float(self.patient.get("weight", 70.0))
        self.height = float(self.patient.get("height", 170.0))

        # Baseline vitals (required)
        self.hr = float(self.patient.get("hr", 75.0))       # bpm
        self.sbp = float(self.patient.get("sbp", 120.0))    # mmHg
        self.dbp = float(self.patient.get("dbp", 80.0))     # mmHg

        # Coarse hemodynamic values
        # Stroke volume in mL (~70), cardiac output in L/min, systemic resistance
        self.sv = float(self.patient.get("sv", 70.0))       # mL/beat
        self.co = float(self.patient.get("co", 5.0))        # L/min
        self.svr = float(self.patient.get("svr", 18.0))     # "mmHg·s/mL" equivalent

        # ECG / arrhythmia risk score (0–1)
        self.arrhythmia_risk = float(self.patient.get("ecg_risk", 0.1))

    # -------------------------------------------------------------
    # BASELINE INITIALIZATION  (STEP 1)
    # -------------------------------------------------------------
    def initialize(self, output_path: str = "data/patient_baseline.pkl") -> PatientBaseline:
        """
        Build and save a PatientBaseline object that matches schemas.PatientBaseline.
        """

        # Left ventricle end-diastolic volume (EDV) ~ 120 mL
        lv_volume = 120.0

        # Aortic pressure approx systolic
        aortic_pressure = self.sbp

        # Normalized contractility, 1.0 = normal
        contractility = 1.0

        # Convert systemic vascular resistance into mmHg·s/mL
        vascular_resistance = self.svr

        # Ejection fraction (EF) ~ 60%
        ejection_fraction = 0.60

        # If not provided, compute CO from HR and SV:
        # CO (L/min) = HR (beats/min) * SV (mL/beat) / 1000
        cardiac_output = self.co if self.co > 0 else (self.hr * self.sv / 1000.0)

        baseline = PatientBaseline(
            # Patient metadata
            patient_id=self.patient_id,
            age=self.age,
            sex=self.sex,
            weight=self.weight,
            height=self.height,

            # Baseline vitals
            hr_baseline=self.hr,
            sbp_baseline=self.sbp,
            dbp_baseline=self.dbp,

            # ODE initial conditions
            lv_volume=lv_volume,
            aortic_pressure=aortic_pressure,
            contractility=contractility,
            vascular_resistance=vascular_resistance,

            # Computed metrics
            ejection_fraction=ejection_fraction,
            cardiac_output=cardiac_output,

            # ECG risk
            arrhythmia_risk=self.arrhythmia_risk,

            timestamp=datetime.now().isoformat(),
        )

        with open(output_path, "wb") as f:
            pickle.dump(baseline, f)

        print(f"✓ Baseline cardiovascular state saved to: {output_path}")
        print(
            f"  HR={baseline.hr_baseline:.1f} bpm, "
            f"SBP={baseline.sbp_baseline:.1f} mmHg, "
            f"CO={baseline.cardiac_output:.2f} L/min"
        )

        return baseline

    # -------------------------------------------------------------
    # MAIN SIMULATION WITH PD EFFECTS (STEP 4)
    # -------------------------------------------------------------
    def simulate_with_effects(
        self,
        baseline_path: str,
        effects_path: str,
        output_path: str = "data/final_trajectory.pkl",
        duration_hours: float = 168.0,
    ) -> SimulationTrajectory:
        """
        Build a SimulationTrajectory using PD outputs.

        Instead of solving a detailed ODE, we:
        - Load PatientBaseline and PhysiologicalEffects
        - Apply PD deltas on top of baseline over time
        - Compute derived metrics (MAP, EF, SV, percent changes)
        - Save and return SimulationTrajectory
        """

        # ---------------------------------------------------------
        # Load baseline + PD effects
        # ---------------------------------------------------------
        with open(baseline_path, "rb") as f:
            baseline: PatientBaseline = pickle.load(f)

        with open(effects_path, "rb") as f:
            effects: PhysiologicalEffects = pickle.load(f)

        print("\n[STEP 4] Running cardiovascular 'ODE' with drug effects...")
        print("Using PD deltas to construct full trajectory.")

        # Time base comes from PD (ensures PK–PD alignment)
        t = np.asarray(effects.time_hours, dtype=float)

        # ---------------------------------------------------------
        # Apply PD deltas to baseline
        # ---------------------------------------------------------
        # HR(t) = baseline_hr + delta_hr(t)
        hr_series = baseline.hr_baseline + np.asarray(effects.delta_hr, dtype=float)

        # SBP/DBP(t) = baseline + delta
        sbp_series = baseline.sbp_baseline + np.asarray(effects.delta_sbp, dtype=float)
        dbp_series = baseline.dbp_baseline + np.asarray(effects.delta_dbp, dtype=float)

        # Contractility: baseline_contractility * (1 + delta_contractility)
        delta_contractility = np.asarray(effects.delta_contractility, dtype=float)
        contractility_series = baseline.contractility * (1.0 + delta_contractility)

        # Vascular resistance: baseline * (1 + delta_vascular_resistance)
        delta_vr = np.asarray(effects.delta_vascular_resistance, dtype=float)
        vr_series = baseline.vascular_resistance * (1.0 + delta_vr)

        # Cardiac output: approximate as baseline CO × contractility change
        co_series = baseline.cardiac_output * (contractility_series / baseline.contractility)

        # Ejection fraction: EF ~ baseline_EF × (contractility change)
        ef_series = baseline.ejection_fraction * (contractility_series / baseline.contractility)

        # Stroke volume (mL) from CO and HR:
        # CO (L/min) = HR (beats/min) * SV (mL) / 1000  ⇒ SV = CO * 1000 / HR
        # Avoid division by zero:
        hr_safe = np.where(hr_series <= 0, 1.0, hr_series)
        stroke_volume_series = co_series * 1000.0 / hr_safe

        # Mean arterial pressure (MAP) = DBP + (SBP - DBP)/3
        mean_arterial_pressure = dbp_series + (sbp_series - dbp_series) / 3.0

        # ---------------------------------------------------------
        # Percent change from baseline at final time
        # ---------------------------------------------------------
        hr_percent_change = float(
            (hr_series[-1] - baseline.hr_baseline) / baseline.hr_baseline * 100.0
        )

        bp_percent_change = float(
            (sbp_series[-1] - baseline.sbp_baseline) / baseline.sbp_baseline * 100.0
        )

        # ---------------------------------------------------------
        # Adverse event flags based on PD risk + trajectory
        # ---------------------------------------------------------
        adverse_events = []

        if effects.bradycardia_risk or np.min(hr_series) < 60:
            adverse_events.append(
                f"Bradycardia risk (min HR={np.min(hr_series):.1f} bpm)"
            )

        if effects.hypotension_risk or np.min(sbp_series) < 90:
            adverse_events.append(
                f"Hypotension risk (min SBP={np.min(sbp_series):.1f} mmHg)"
            )

        # ---------------------------------------------------------
        # Build SimulationTrajectory
        # ---------------------------------------------------------
        trajectory = SimulationTrajectory(
            patient_id=baseline.patient_id,
            drug_applied=effects.drug_name,
            time_hours=t,
            heart_rate=hr_series,
            systolic_bp=sbp_series,
            diastolic_bp=dbp_series,
            cardiac_output=co_series,
            ejection_fraction=ef_series,
            mean_arterial_pressure=mean_arterial_pressure,
            stroke_volume=stroke_volume_series,
            hr_percent_change=hr_percent_change,
            bp_percent_change=bp_percent_change,
            adverse_events=adverse_events,
            timestamp=datetime.now().isoformat(),
        )

        with open(output_path, "wb") as f:
            pickle.dump(trajectory, f)

        # ---------------------------------------------------------
        # Console summary (daily)
        # ---------------------------------------------------------
        duration = t[-1] if len(t) > 0 else 0.0
        num_days = max(1, int(duration // 24))

        print(f"✓ Trajectory saved to: {output_path}")
        print(f"  Total simulated time: {duration:.1f} h (~{duration/24:.1f} days)")
        print(f"  Final HR:  {hr_series[-1]:.1f} bpm "
              f"({hr_percent_change:+.1f}% from baseline)")
        print(f"  Final SBP: {sbp_series[-1]:.1f} mmHg "
              f"({bp_percent_change:+.1f}% from baseline)")
        print(f"  Adverse events: {adverse_events if adverse_events else 'None'}")

        for day in range(num_days):
            # approximate index closest to each 24 h
            target_t = 24 * (day + 1)
            idx = np.argmin(np.abs(t - target_t))
            print(
                f"  Day {day+1}: "
                f"HR={hr_series[idx]:.1f} bpm, "
                f"SBP={sbp_series[idx]:.1f} mmHg, "
                f"CO={co_series[idx]:.2f} L/min"
            )

        return trajectory


# Simple manual test
if __name__ == "__main__":
    patient = {
        "patient_id": "demo_001",
        "age": 55,
        "sex": "M",
        "weight": 82,
        "height": 175,
        "hr": 95,
        "sbp": 150,
        "dbp": 95,
        "sv": 70,
        "co": 5.4,
        "svr": 18.0,
        "ecg_risk": 0.2,
    }

    ode = CardiovascularODE(patient)
    baseline = ode.initialize()
    print("Baseline created for manual test (no PD run here).")
