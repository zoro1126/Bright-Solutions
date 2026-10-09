from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

class VitalSignsInput(BaseModel):
    systolic_bp: Optional[int] = Field(None, ge=40, le=300, description="Systolic Blood Pressure (mmHg)")
    diastolic_bp: Optional[int] = Field(None, ge=30, le=200, description="Diastolic Blood Pressure (mmHg)")
    pulse_rate: Optional[int] = Field(None, ge=30, le=250, description="Pulse Rate (bpm)")
    temperature_f: Optional[float] = Field(None, ge=90.0, le=110.0, description="Body Temperature (°F)")
    resp_rate: Optional[int] = Field(None, ge=5, le=60, description="Respiratory Rate (breaths/min)")
    spo2_pct: Optional[int] = Field(None, ge=50, le=100, description="Oxygen Saturation (%)")
    weight_kg: Optional[float] = Field(None, ge=1.0, le=350.0, description="Weight (kg)")
    height_cm: Optional[float] = Field(None, ge=30.0, le=250.0, description="Height (cm)")

class PatientRegistrationRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    dob: date = Field(..., description="Date of birth YYYY-MM-DD")
    gender: str = Field(..., description="MALE, FEMALE, or OTHER")
    blood_group: Optional[str] = Field("UNKNOWN", description="e.g. A+, B+, O+, AB+, etc.")
    phone: str = Field(..., min_length=7, max_length=20)
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    doctor_id: int = Field(..., description="Assigned Physician User ID")
    chief_complaint: Optional[str] = None
    insurance_type: Optional[str] = Field("CASH", description="CASH, INSURANCE, GOVT_SCHEME")
    insurance_provider: Optional[str] = None
    policy_number: Optional[str] = None
    vitals: Optional[VitalSignsInput] = None
