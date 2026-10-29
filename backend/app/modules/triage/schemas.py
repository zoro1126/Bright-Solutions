from typing import Optional, List
from pydantic import BaseModel, Field

class VitalsIntakeRequest(BaseModel):
    patient_uuid: Optional[str] = Field(None, description="Patient public UUID")
    uhid: Optional[str] = Field(None, description="Patient UHID (e.g. BS-001001)")
    opd_visit_uuid: Optional[str] = Field(None, description="Optional OPD Visit public UUID")
    opd_number: Optional[str] = Field(None, description="Optional OPD Number (e.g. OPD-001001)")
    temperature_f: Optional[float] = Field(None, ge=80.0, le=115.0, description="Body temperature in Fahrenheit")
    pulse_bpm: Optional[int] = Field(None, ge=20, le=300, description="Pulse rate in beats per minute")
    blood_pressure_systolic: Optional[int] = Field(None, ge=40, le=300, description="Systolic blood pressure in mmHg")
    blood_pressure_diastolic: Optional[int] = Field(None, ge=20, le=200, description="Diastolic blood pressure in mmHg")
    respiratory_rate_bpm: Optional[int] = Field(None, ge=4, le=80, description="Respiratory rate in breaths per minute")
    spo2_percentage: Optional[int] = Field(None, ge=40, le=100, description="Oxygen saturation percentage (SpO2)")
    height_cm: Optional[float] = Field(None, ge=30.0, le=280.0, description="Patient height in centimetres")
    weight_kg: Optional[float] = Field(None, ge=1.0, le=500.0, description="Patient weight in kilograms")
    pain_scale: Optional[int] = Field(None, ge=0, le=10, description="Wong-Baker/Numeric pain rating (0-10)")

class VitalsResponse(BaseModel):
    public_id: str
    patient_uuid: str
    uhid: str
    opd_visit_uuid: Optional[str] = None
    opd_number: Optional[str] = None
    temperature_f: Optional[float] = None
    pulse_bpm: Optional[int] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    respiratory_rate_bpm: Optional[int] = None
    spo2_percentage: Optional[int] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    bmi: Optional[float] = None
    bmi_category: Optional[str] = None
    pain_scale: Optional[int] = None
    is_abnormal: bool
    abnormal_flags: List[str]
    recorded_by_name: Optional[str] = None
    recorded_at: str

