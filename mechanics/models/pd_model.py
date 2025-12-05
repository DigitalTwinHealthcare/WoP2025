"""
Pharmacodynamic model - maps drug concentration to physiological effects
Uses Hill (sigmoid Emax) model: Effect = E_max * C^γ / (EC50^γ + C^γ)
PD parameters fitted from clinical dose-response data
"""
import numpy as np
import pandas as pd
import pickle
from datetime import datetime
from scipy.optimize import curve_fit
from pathlib import Path
from schemas import DrugConcentration, PhysiologicalEffects, PatientBaseline


class PDModel:
    """
    Hill equation (sigmoid Emax) model for drug concentration-effect relationship
    """
    
    def __init__(self, drug_name: str, csv_path: str = None):
        """
        Initialize PD model. If csv_path provided, fit parameters from data.
        Otherwise use default parameters.
        
        Args:
            drug_name: Name of drug (e.g., 'metoprolol')
            csv_path: Path to CSV with columns: 
                     ['Concentration_ng_mL', 'Heart_Rate_bpm', 'Systolic_BP_mmHg', 'Diastolic_BP_mmHg']
        """
        self.drug_name = drug_name.lower()
        
        # Default parameters (fallback)
        self.default_params = {
            'metoprolol': {
                'HR': {'Emax': 25.0, 'EC50': 50.0, 'gamma': 1.5, 'baseline': 75.0},
                'SBP': {'Emax': 15.0, 'EC50': 80.0, 'gamma': 1.5, 'baseline': 120.0},
                'DBP': {'Emax': 10.0, 'EC50': 80.0, 'gamma': 1.5, 'baseline': 80.0},
                'contractility': {'Emax': 0.2, 'EC50': 50.0, 'gamma': 1.5},
                'vascular_resistance': {'Emax': 0.15, 'EC50': 80.0, 'gamma': 1.5}
            },
            'atenolol': {
                'HR': {'Emax': 20.0, 'EC50': 100.0, 'gamma': 1.5, 'baseline': 75.0},
                'SBP': {'Emax': 12.0, 'EC50': 150.0, 'gamma': 1.5, 'baseline': 120.0},
                'DBP': {'Emax': 8.0, 'EC50': 150.0, 'gamma': 1.5, 'baseline': 80.0},
                'contractility': {'Emax': 0.15, 'EC50': 100.0, 'gamma': 1.5},
                'vascular_resistance': {'Emax': 0.12, 'EC50': 150.0, 'gamma': 1.5}
            }
        }
        
        # Fit from CSV if provided, otherwise use defaults
        if csv_path and Path(csv_path).exists():
            print(f"📊 Fitting PD parameters from: {csv_path}")
            self.params = self._fit_from_csv(csv_path)
        else:
            if csv_path:
                print(f"⚠️  CSV not found: {csv_path}, using default parameters")
            self.params = self.default_params.get(self.drug_name, self.default_params['metoprolol'])
    
    def _fit_from_csv(self, csv_path: str) -> dict:
        """
        Fit Hill equation parameters from dose-response CSV data
        """
        df = pd.read_csv(csv_path)
        
        print(f"Loaded {len(df)} dose-response observations")
        
        # Calculate baselines from low concentration data (C < 10 ng/mL)
        baseline_data = df[df["Concentration_ng_mL"] < 10]
        
        if len(baseline_data) == 0:
            print("⚠️  No baseline data (C < 10), using overall mean")
            baseline_data = df[df["Concentration_ng_mL"] == df["Concentration_ng_mL"].min()]
        
        baseline_hr = baseline_data["Heart_Rate_bpm"].mean()
        baseline_sbp = baseline_data["Systolic_BP_mmHg"].mean()
        baseline_dbp = baseline_data["Diastolic_BP_mmHg"].mean()
        
        print(f"Baseline HR : {baseline_hr:.1f} bpm")
        print(f"Baseline SBP: {baseline_sbp:.1f} mmHg")
        print(f"Baseline DBP: {baseline_dbp:.1f} mmHg\n")
        
        # Calculate reductions (effect = reduction from baseline)
        df["HR_Reduction"] = baseline_hr - df["Heart_Rate_bpm"]
        df["SBP_Reduction"] = baseline_sbp - df["Systolic_BP_mmHg"]
        df["DBP_Reduction"] = baseline_dbp - df["Diastolic_BP_mmHg"]
        
        # Ensure non-negative effects
        df["HR_Reduction"] = df["HR_Reduction"].clip(lower=0)
        df["SBP_Reduction"] = df["SBP_Reduction"].clip(lower=0)
        df["DBP_Reduction"] = df["DBP_Reduction"].clip(lower=0)
        
        C = df["Concentration_ng_mL"].values
        
        # Fit Hill equation for each endpoint
        fitted_params = {}
        
        endpoints = [
            ("HR", df["HR_Reduction"].values, "bpm", baseline_hr),
            ("SBP", df["SBP_Reduction"].values, "mmHg", baseline_sbp),
            ("DBP", df["DBP_Reduction"].values, "mmHg", baseline_dbp)
        ]
        
        for name, y_data, unit, baseline in endpoints:
            params = self._fit_hill_equation(C, y_data, name, unit)
            params['baseline'] = float(baseline)
            fitted_params[name] = params
        
        # Derive contractility and vascular resistance from SBP
        # Contractility follows HR pattern (cardiac effect)
        fitted_params['contractility'] = {
            'Emax': fitted_params['HR']['Emax'] / 100.0,  # Convert to fractional
            'EC50': fitted_params['HR']['EC50'],
            'gamma': fitted_params['HR']['gamma']
        }
        
        # Vascular resistance follows BP pattern (peripheral effect)
        fitted_params['vascular_resistance'] = {
            'Emax': fitted_params['SBP']['Emax'] / 100.0,  # Convert to fractional
            'EC50': fitted_params['SBP']['EC50'],
            'gamma': fitted_params['SBP']['gamma']
        }
        
        print("✓ PD parameters fitted successfully\n")
        return fitted_params
    
    def _fit_hill_equation(self, C, y_data, name, unit):
        """
        Fit Hill equation to concentration-effect data
        Hill equation: E = (Emax * C^γ) / (EC50^γ + C^γ)
        """
        def hill(C, Emax, EC50, gamma):
            C = np.asarray(C)
            return (Emax * C**gamma) / (EC50**gamma + C**gamma)
        
        # Initial guesses
        Emax_init = float(y_data.max() * 1.2)
        
        # EC50: concentration at half-maximal effect
        half_max = y_data.max() / 2
        subset = C[y_data > half_max]
        EC50_init = float(np.median(subset)) if len(subset) > 0 else float(np.median(C))
        
        gamma_init = 1.5
        
        # Bounds
        bounds_lower = [0.0, 0.1, 0.1]
        bounds_upper = [300.0, 2000.0, 10.0]
        
        # Clip initial guesses
        Emax_init = np.clip(Emax_init, bounds_lower[0] + 1e-3, bounds_upper[0] - 1e-3)
        EC50_init = np.clip(EC50_init, bounds_lower[1] + 1e-3, bounds_upper[1] - 1e-3)
        
        try:
            popt, pcov = curve_fit(
                hill,
                C,
                y_data,
                p0=[Emax_init, EC50_init, gamma_init],
                bounds=(bounds_lower, bounds_upper),
                maxfev=10000
            )
            
            Emax, EC50, gamma = popt
            
            # Sanity check
            if EC50 <= 0.11 or EC50 >= 1999:
                print(f"⚠️  Warning: {name} EC50 ({EC50:.2f}) near bounds")
            
            print(f"{name} PD Parameters:")
            print(f"  Emax = {Emax:.2f} {unit}")
            print(f"  EC50 = {EC50:.2f} ng/mL")
            print(f"  γ    = {gamma:.2f}")
            
            return {
                'Emax': float(Emax),
                'EC50': float(EC50),
                'gamma': float(gamma)
            }
            
        except Exception as e:
            print(f"⚠️  Fitting failed for {name}: {e}")
            print(f"Using default parameters")
            return {
                'Emax': float(Emax_init),
                'EC50': float(EC50_init),
                'gamma': 1.5
            }
    
    def hill_equation(self, C, Emax, EC50, gamma):
        """
        Hill (sigmoid Emax) equation
        E = (Emax * C^γ) / (EC50^γ + C^γ)
        
        Returns: effect as reduction from baseline (positive values)
        """
        C = np.asarray(C)
        effect = (Emax * C**gamma) / (EC50**gamma + C**gamma)
        # Clip to prevent numerical issues
        effect = np.clip(effect, 0, Emax * 1.1)
        return effect
    
    def compute_effects(
        self,
        baseline_path: str,
        concentration_path: str,
        output_path: str = "data/physiological_effects.pkl"
    ):
        """
        Map concentration curve to physiological parameter changes
        """
        # Load inputs
        with open(baseline_path, 'rb') as f:
            baseline = pickle.load(f)
        
        with open(concentration_path, 'rb') as f:
            drug_conc = pickle.load(f)
        
        # Convert concentration from mg/L to ng/mL
        C_mg_L = drug_conc.concentration_mg_L
        C_ng_mL = C_mg_L * 1000.0  # mg/L → ng/mL
        
        t = drug_conc.time_hours
        
        print("Computing PD effects using Hill equation...")
        
        # Compute effects (reductions from baseline)
        hr_reduction = self.hill_equation(
            C_ng_mL,
            self.params['HR']['Emax'],
            self.params['HR']['EC50'],
            self.params['HR']['gamma']
        )
        
        sbp_reduction = self.hill_equation(
            C_ng_mL,
            self.params['SBP']['Emax'],
            self.params['SBP']['EC50'],
            self.params['SBP']['gamma']
        )
        
        dbp_reduction = self.hill_equation(
            C_ng_mL,
            self.params['DBP']['Emax'],
            self.params['DBP']['EC50'],
            self.params['DBP']['gamma']
        )
        
        contractility_reduction = self.hill_equation(
            C_ng_mL,
            self.params['contractility']['Emax'],
            self.params['contractility']['EC50'],
            self.params['contractility']['gamma']
        )
        
        vascular_resistance_reduction = self.hill_equation(
            C_ng_mL,
            self.params['vascular_resistance']['Emax'],
            self.params['vascular_resistance']['EC50'],
            self.params['vascular_resistance']['gamma']
        )
        
        # Convert reductions to deltas (negative for reductions)
        delta_hr = -hr_reduction
        delta_sbp = -sbp_reduction
        delta_dbp = -dbp_reduction
        delta_contractility = -contractility_reduction
        delta_vascular_resistance = -vascular_resistance_reduction
        
        # Safety checks
        final_hr = baseline.hr_baseline + delta_hr[-1]
        final_sbp = baseline.sbp_baseline + delta_sbp[-1]
        
        bradycardia_risk = final_hr < 60
        hypotension_risk = final_sbp < 90
        
        # Create output
        effects = PhysiologicalEffects(
            drug_name=self.drug_name,
            time_hours=t,
            delta_hr=delta_hr,
            delta_sbp=delta_sbp,
            delta_dbp=delta_dbp,
            delta_contractility=delta_contractility,
            delta_vascular_resistance=delta_vascular_resistance,
            bradycardia_risk=bradycardia_risk,
            hypotension_risk=hypotension_risk,
            timestamp=datetime.now().isoformat()
        )
        
        with open(output_path, 'wb') as f:
            pickle.dump(effects, f)
        
        print(f"✓ PD effects computed:")
        print(f"  Peak HR change: {delta_hr.min():.1f} bpm")
        print(f"  Peak BP change: {delta_sbp.min():.1f} mmHg")
        print(f"  Final HR: {final_hr:.1f} bpm {'⚠️ BRADYCARDIA' if bradycardia_risk else '✓'}")
        print(f"  Final SBP: {final_sbp:.1f} mmHg {'⚠️ HYPOTENSION' if hypotension_risk else '✓'}")
        
        return effects


# Example usage
if __name__ == "__main__":
    # Option 1: Fit from CSV
    pd = PDModel(
        drug_name='metoprolol',
        csv_path='data/metoprolol_synthetic_pd_data.csv'
    )
    
    # Option 2: Use default parameters (if CSV not available)
    # pd = PDModel(drug_name='metoprolol')
    
    effects = pd.compute_effects(
        baseline_path='data/patient_baseline.pkl',
        concentration_path='data/drug_concentration.pkl'
    )