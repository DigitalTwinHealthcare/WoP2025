from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class Patient(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    age: int
    gender: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    hr: Optional[float] = None
    sbp: Optional[float] = None
    dbp: Optional[float] = None
    ehr_uploaded: bool = False
    created_at: datetime
    updated_at: datetime


class EHRFile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="patient.id")
    file_name: str
    file_type: str
    file_path: str
    uploaded_at: datetime


class FHIRBundle(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="patient.id")
    file_path: str
    created_at: datetime


class Report(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="patient.id")
    type: str
    status: str
    result_path: str
    created_at: datetime


class DigitalTwin(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="patient.id")
    baseline: Optional[str] = None
    modules: Optional[str] = None
    status: str = "initialized"
    created_at: datetime
    updated_at: datetime


class OrthopedicScan(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="patient.id")
    scan_type: str  # e.g., "X-Ray", "MRI"
    file_path: str
    export_status: str = "pending"  # pending, exported
    created_at: datetime


class Simulation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="patient.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Paths to generated files
    report_path: Optional[str] = None
    pk_plot_path: Optional[str] = None
    hr_plot_path: Optional[str] = None
    bp_plot_path: Optional[str] = None
    dashboard_plot_path: Optional[str] = None
    
    # Paths to data files
    baseline_data_path: Optional[str] = None
    drug_conc_data_path: Optional[str] = None
    effects_data_path: Optional[str] = None
    trajectory_data_path: Optional[str] = None
    lstm_data_path: Optional[str] = None
