from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List
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
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    full_name: Optional[str] = Field(None, max_length=100, description="Optional single string name for auto-splitting")
    dob: Optional[date] = Field(None, description="Date of birth YYYY-MM-DD")
    age: Optional[int] = Field(None, ge=0, le=130, description="Optional age in years if dob is calculated")
    gender: str = Field(..., description="MALE, FEMALE, or OTHER")
    blood_group: Optional[str] = Field("UNKNOWN", description="e.g. A+, B+, O+, AB+, etc.")
    phone: str = Field(..., min_length=7, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    doctor_id: Optional[int] = Field(None, description="Assigned Physician User ID. If omitted, queue auto-routing assigns by complaint & doctor load.")
    doctor_assigned: Optional[str] = Field(None, description="Optional doctor name string if selected directly from frontend dropdown")
    chief_complaint: Optional[str] = None
    insurance_type: Optional[str] = Field("CASH", description="CASH, INSURANCE, GOVT_SCHEME")
    insurance_provider: Optional[str] = None
    policy_number: Optional[str] = None
    govt_scheme_name: Optional[str] = None
    abha_id: Optional[str] = None
    abha_address: Optional[str] = None
    coverage_pct: Optional[float] = None
    deductible: Optional[float] = None
    receptionist_id: Optional[int] = Field(None, description="Staff user ID registering the patient. Resolved dynamically if omitted.")
    vitals: Optional[VitalSignsInput] = None

    @field_validator("gender", mode="before")
    @classmethod
    def normalize_gender(cls, v: Any) -> str:
        if not v or not isinstance(v, str):
            raise ValueError("Gender must be specified as MALE, FEMALE, or OTHER.")
        clean = v.strip().upper()
        if clean in ("M", "MALE", "MAN", "BOY"):
            return "MALE"
        if clean in ("F", "FEMALE", "WOMAN", "GIRL"):
            return "FEMALE"
        if clean in ("O", "OTHER", "NON-BINARY", "TRANSGENDER"):
            return "OTHER"
        raise ValueError(f"Invalid gender '{v}'. Allowed values are MALE, FEMALE, or OTHER.")

    @field_validator("blood_group", mode="before")
    @classmethod
    def normalize_blood_group(cls, v: Any) -> str:
        if not v or not isinstance(v, str):
            return "UNKNOWN"
        clean = v.strip().upper().replace(" ", "").replace("POSITIVE", "+").replace("NEGATIVE", "-").replace("POS", "+").replace("NEG", "-")
        valid_groups = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "UNKNOWN"}
        if clean in valid_groups:
            return clean
        return "UNKNOWN"

    @field_validator("insurance_type", mode="before")
    @classmethod
    def normalize_insurance_type(cls, v: Any) -> str:
        if not v or not isinstance(v, str):
            return "CASH"
        clean = v.strip().upper().replace("-", "_").replace(" ", "_")
        if "GOVT" in clean or "SCHEME" in clean or "PMJAY" in clean or "AYUSHMAN" in clean:
            return "GOVT_SCHEME"
        if "INSUR" in clean or "CORP" in clean or "TPA" in clean:
            return "INSURANCE"
        return "CASH"

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_phone(cls, v: Any) -> str:
        if not v or not isinstance(v, str):
            raise ValueError("Phone number is required.")
        clean = v.strip()
        if len(clean) > 20:
            digits = "".join(ch for ch in clean if ch.isdigit() or ch == '+')
            clean = digits[:20] if len(digits) >= 7 else clean[:20]
        if len(clean) < 7:
            raise ValueError("Phone number must contain at least 7 characters.")
        return clean

class QueueSummaryCounts(BaseModel):
    all: int
    pending: int
    insights: int
    consultation: int
    completed: int

class QueuePatientItem(BaseModel):
    id: str  # e.g. "pat-1" for frontend compatibility
    patient_id: int
    visit_id: int
    mrn: str
    uhid: str
    fullName: str
    age: int
    gender: str
    phone: str
    address: Optional[str] = None
    queue_token: str
    queue_position: int
    estimated_wait_mins: int
    status: str
    triage_priority: str
    news2_score: int
    doctor_id: Optional[int] = None
    doctorAssigned: str
    appointmentTime: str
    registeredAt: str
    chief_complaint: Optional[str] = None
    insurance: Dict[str, Any]
    vitals: Optional[Dict[str, Any]] = None
    questionnaire_completed: bool = False
    insights_ready: bool = False

class ReceptionistQueueResponse(BaseModel):
    counts: QueueSummaryCounts
    queue: list[QueuePatientItem]
    active_doctors_count: int
    server_timestamp: str
