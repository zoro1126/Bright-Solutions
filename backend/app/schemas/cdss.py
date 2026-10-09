from pydantic import BaseModel, Field
from typing import Optional

class InsightReviewRequest(BaseModel):
    is_reviewed: Optional[bool] = Field(True, description="Mark alert as acknowledged/reviewed")
    doctor_override_notes: Optional[str] = Field(None, description="Clinical justification when overriding a Critical safety alert")

class DoctorSignOffRequest(BaseModel):
    conclusion_notes: str = Field(..., min_length=3, description="Doctor final diagnosis, clinical findings, and disposition impression")
    diagnosis: Optional[str] = Field(None, description="Optional formal primary diagnosis")
    doctor_id: Optional[int] = Field(None, description="Attending physician user ID signing the encounter")
    doctor_override_notes: Optional[str] = Field(None, description="Clinical justification overriding any active CRITICAL safety alerts")
    override_reasons: Optional[str] = Field(None, description="Alias for doctor_override_notes")
