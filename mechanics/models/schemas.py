"""
Data schemas for digital twin pipeline
Ensures all pickle files have consistent structure
"""
from dataclasses import dataclass
import numpy as np
from typing import Optional

@dataclass
class PatientBaseline:
    """Output from ODE initialization (Step 1)"""
    # Patient metadata
    patient_id: str
    age: int
    sex: str
    weight: float  # kg
    height: float  # cm
    
    # Baseline vitals
    hr_baseline: float  # bpm
    sbp_baseline: float  # mmHg
    dbp_baseline: float  # mmHg
    
    # ODE initial conditions
    lv_volume: float  # mL (left ventricle)
    aortic_pressure: float  # mmHg
    contractility: float  # dimensionless parameter
    vascular_resistance: float  # mmHg·s/mL
    
    # Computed metrics
    ejection_fraction: float  # %
    cardiac_output: float  # L/min
    
    # ECG risk score (from your CNN)
    arrhythmia_risk: float  # 0-1
    
    timestamp: str  # ISO format


@dataclass
class DrugConcentration:
    """Output from PK model (Step 2)"""

    # Drug + dosing info
    drug_name: str
    dose_mg: float
    route: str  # "oral", "IV", etc.

    # Time series data
    time_hours: np.ndarray  # [0 ... 168] for 7 days
    concentration_mg_L: np.ndarray  # mg/L (converted from ng/mL if needed)

    # PK parameters used
    absorption_rate: float  # ka (1/hr)
    elimination_rate: float  # ke (1/hr)
    volume_distribution: float  # Vd (L)
    bioavailability: float  # F (0-1)

    # ---- NEW: Steady-state PK metrics ----
    Cmax_ss: float            # ng/mL (peak at steady state)
    Cmin_ss: float            # ng/mL (trough at steady state)
    Cavg_ss: float            # ng/mL (average concentration)
    AUC_ss: float             # ng·hr/mL (AUC at steady state over tau)
    accumulation_factor: float  # R = 1 / (1 - exp(-ke*tau))
    fluctuation_percent: float  # (Cmax - Cmin)/Cavg * 100

    timestamp: str  # ISO timestamp



@dataclass
class PhysiologicalEffects:
    """Output from PD model (Step 3)"""
    drug_name: str
    
    # Time-matched to DrugConcentration.time_hours
    time_hours: np.ndarray
    
    # Delta effects (change from baseline)
    delta_hr: np.ndarray  # bpm change (negative for β-blockers)
    delta_sbp: np.ndarray  # mmHg change
    delta_dbp: np.ndarray  # mmHg change
    delta_contractility: np.ndarray  # fractional change
    delta_vascular_resistance: np.ndarray  # fractional change
    
    # Safety flags
    bradycardia_risk: bool  # HR < 60
    hypotension_risk: bool  # SBP < 90
    
    timestamp: str


@dataclass
class SimulationTrajectory:
    """Output from ODE forward simulation (Step 4)"""
    patient_id: str
    drug_applied: str
    
    # Time series results
    time_hours: np.ndarray
    heart_rate: np.ndarray  # bpm
    systolic_bp: np.ndarray  # mmHg
    diastolic_bp: np.ndarray  # mmHg
    cardiac_output: np.ndarray  # L/min
    ejection_fraction: np.ndarray  # %
    
    # Derived metrics
    mean_arterial_pressure: np.ndarray  # mmHg
    stroke_volume: np.ndarray  # mL
    
    # Comparison to baseline
    hr_percent_change: float
    bp_percent_change: float
    
    # Adverse event flags
    adverse_events: list  # ["bradycardia at t=48h", ...]
    
    timestamp: str


@dataclass
class LSTMFeatures:
    """Prepared features for LSTM training (Step 5)"""
    patient_id: str
    
    # Static features (don't change over time)
    age: float
    weight: float
    baseline_hr: float
    baseline_bp: float
    baseline_ef: float
    arrhythmia_risk: float
    
    # Time series features (shape: [n_timesteps, n_features])
    time_hours: np.ndarray
    drug_concentration: np.ndarray
    heart_rate_history: np.ndarray
    bp_history: np.ndarray
    co_history: np.ndarray
    
    # Engineered features
    hr_velocity: np.ndarray  # rate of change
    bp_velocity: np.ndarray
    concentration_gradient: np.ndarray
    
    # Target variable (what LSTM should predict)
    target_hr_next_24h: np.ndarray  # for forecasting
    target_adverse_event: int  # 0/1 for classification
    
    timestamp: str