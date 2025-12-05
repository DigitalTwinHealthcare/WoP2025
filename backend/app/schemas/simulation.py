from pydantic import BaseModel
from typing import Optional

class SimulationRequest(BaseModel):
    patient_id: int
    drug_name: Optional[str] = "Metoprolol"
    dose_mg: Optional[float] = 50.0
    duration_hours: int = 168
    
    # Patient parameters (optional, will be fetched from EHR if missing)
    age: Optional[int] = None
    sex: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    hr: Optional[float] = None
    sbp: Optional[float] = None
    dbp: Optional[float] = None
    sv: Optional[float] = None
    co: Optional[float] = None
    svr: Optional[float] = None
    ecg_risk: Optional[float] = None
