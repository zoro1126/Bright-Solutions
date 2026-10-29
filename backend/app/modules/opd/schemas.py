from typing import Optional, Literal
from pydantic import BaseModel, Field

VisitType = Literal["NEW", "FOLLOW_UP", "EMERGENCY"]
TokenStatusType = Literal["WAITING", "CALLED", "IN_CONSULTATION", "COMPLETED", "SKIPPED", "CANCELLED"]

class OpdCheckInRequest(BaseModel):
    patient_uuid: Optional[str] = Field(None, description="Patient public UUID")
    uhid: Optional[str] = Field(None, description="Patient UHID (e.g. BS-001001)")
    doctor_uuid: Optional[str] = Field(None, description="Doctor profile public UUID. If omitted, routes to first active doctor")
    visit_type: VisitType = Field("NEW", description="Type of encounter: NEW, FOLLOW_UP, or EMERGENCY")
    department: Optional[str] = Field(None, description="Department name (defaults to doctor's primary specialty)")

class OpdCheckInResponse(BaseModel):
    visit_uuid: str
    opd_number: str
    uhid: str
    patient_name: str
    doctor_name: str
    doctor_uuid: str
    department: str
    visit_type: str
    token_number: int
    token_date: str
    token_status: str
    estimated_wait_minutes: int
    consultation_fee: float
    created_at: str

class OpdVisitItem(BaseModel):
    visit_uuid: str
    opd_number: str
    uhid: str
    patient_name: str
    phone: str
    doctor_name: str
    department: str
    visit_type: str
    visit_date: str
    token_number: Optional[int] = None
    token_status: Optional[str] = None
    status: str
    created_at: str
