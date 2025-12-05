"""
Pharmacokinetic model - MULTIPLE DOSE PK
Uses Bateman function + superposition
"""
import numpy as np
import pickle
from datetime import datetime
from scipy.integrate import trapezoid
from schemas import PatientBaseline, DrugConcentration


class PKModel:
    """
    One-compartment PK model with:
    - First-order absorption
    - First-order elimination
    - Multiple dosing (superposition)
    """

    DRUG_PARAMS = {
        'metoprolol': {
            'ka': 1.5,
            'ke': 0.20,
            'Vd': 5.5,      # L/kg
            'F': 0.50,
        },
        'atenolol': {
            'ka': 1.0,
            'ke': 0.12,
            'Vd': 1.2,
            'F': 0.60,
        }
    }

    def __init__(self, drug_name: str, dose_mg: float, patient_weight: float,
                 tau_hours=12, n_days=7):
        """
        tau_hours = dosing interval (12 hours = BID)
        n_days    = total therapy duration
        """
        self.drug_name = drug_name.lower()
        self.dose = dose_mg
        self.weight = patient_weight
        self.tau = tau_hours
        self.n_days = n_days

        if self.drug_name not in self.DRUG_PARAMS:
            raise ValueError(f"Unknown drug: {drug_name}")

        # Load parameters
        p = self.DRUG_PARAMS[self.drug_name]
        self.ka = p['ka']
        self.ke = p['ke']
        self.Vd = p['Vd'] * patient_weight    # L
        self.F = p['F']

    # -------------------------------------------------------------------------
    # SINGLE DOSE (BATEMAN EQUATION)
    # -------------------------------------------------------------------------
    def C_single(self, t):
        if t < 0:
            return 0
        ka, ke, Vd = self.ka, self.ke, self.Vd
        Dose = self.dose
        F = self.F

        return (F * Dose * ka) / (Vd * (ka - ke)) * (
            np.exp(-ke * t) - np.exp(-ka * t)
        ) * 1000  # mg/L → ng/mL

    # -------------------------------------------------------------------------
    # MULTIPLE DOSE SUPERPOSITION
    # -------------------------------------------------------------------------
    def C_multiple(self, t, n_doses):
        total = 0
        for i in range(n_doses):
            dose_time = i * self.tau
            if t >= dose_time:
                total += self.C_single(t - dose_time)
        return total

    # -------------------------------------------------------------------------
    # MAIN SIMULATION
    # -------------------------------------------------------------------------
    def simulate(
        self,
        baseline_path: str,
        output_path: str = "data/drug_concentration.pkl",
        duration_hours: float = None,
    ):
        """Simulates PK over days using multiple dosing"""

        # ------------------------------------
        # Load baseline (weight, renal etc.)
        # ------------------------------------
        with open(baseline_path, "rb") as f:
            baseline = pickle.load(f)

        # Total doses
        n_doses = self.n_days * (24 // self.tau)
        total_time = self.n_days * 24 if duration_hours is None else duration_hours

        # Time vector
        t = np.linspace(0, total_time, 5000)

        # Full profile
        concentration_total = np.array([
            self.C_multiple(tt, n_doses) for tt in t
        ])

        # ------------------------------
        # Steady-state within interval
        # ------------------------------
        tau = self.tau
        ka, ke, Vd, Dose, F = self.ka, self.ke, self.Vd, self.dose, self.F

        t_interval = np.linspace(0, tau, 500)
        C_ss_interval = np.zeros_like(t_interval)

        for i, tt in enumerate(t_interval):
            num_elim = np.exp(-ke * tt) / (1 - np.exp(-ke * tau))
            num_abs = np.exp(-ka * tt) / (1 - np.exp(-ka * tau))
            C_ss_interval[i] = (F * Dose * ka * 1000) / (Vd * (ka - ke)) * (
                    num_elim - num_abs
            )

        # Steady-state PK parameters
        Cmax_ss = np.max(C_ss_interval)
        Cmin_ss = C_ss_interval[-1]
        AUC_ss = trapezoid(C_ss_interval, t_interval)
        Cavg_ss = AUC_ss / tau
        R = 1 / (1 - np.exp(-ke * tau))
        fluctuation = (Cmax_ss - Cmin_ss) / Cavg_ss * 100

        # ------------------------------
        # Save output object
        # ------------------------------
        pk_output = DrugConcentration(
            drug_name=self.drug_name,
            dose_mg=self.dose,
            route='oral',
            time_hours=t,
            concentration_mg_L=concentration_total / 1000.0,  # convert back to mg/L
            absorption_rate=self.ka,
            elimination_rate=self.ke,
            volume_distribution=self.Vd,
            bioavailability=self.F,
            Cmax_ss=Cmax_ss,
            Cmin_ss=Cmin_ss,
            Cavg_ss=Cavg_ss,
            AUC_ss=AUC_ss,
            accumulation_factor=R,
            fluctuation_percent=fluctuation,
            timestamp=datetime.now().isoformat()
        )

        with open(output_path, "wb") as f:
            pickle.dump(pk_output, f)

        # Print summary (same as your script)
        print("=" * 70)
        print(f"{self.drug_name.upper()} {self.dose} mg - MULTIPLE DOSE PK")
        print("=" * 70)
        print("\n📊 STEADY-STATE PARAMETERS:")
        print(f"  Cmax,ss (Peak)             = {Cmax_ss:.1f} ng/mL")
        print(f"  Cmin,ss (Trough)           = {Cmin_ss:.1f} ng/mL")
        print(f"  Cavg,ss (Average)          = {Cavg_ss:.1f} ng/mL")
        print(f"  Accumulation Factor (R)    = {R:.2f}")
        print(f"  Fluctuation                = {fluctuation:.1f}%")

        print("\n⏱️ TIME TO STEADY STATE:")
        t_half = np.log(2) / self.ke
        print(f"  Half-life                  = {t_half:.2f} hours")
        print(f"  Time to steady state       ≈ {4*t_half:.1f} hours")

        print("\n💊 DOSING REGIMEN:")
        print(f"  Dose                       = {self.dose} mg")
        print(f"  Frequency                  = Every {tau} hours")
        print(f"  Total doses in {self.n_days} days = {n_doses}")
        print("=" * 70)

        return pk_output


# Example usage
if __name__ == "__main__":
    pk = PKModel(
        drug_name="metoprolol",
        dose_mg=100,
        patient_weight=82,
        tau_hours=12,
        n_days=7
    )

    pk.simulate(
        baseline_path="data/patient_baseline.pkl",
        duration_hours=168
    )
