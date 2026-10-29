"""
Pydantic v2 Schemas for Clinical Transitions & Patient Experience (TASK-BE-5.6 & 5.7)
- FORM_HANDOVER: Doctor Handover & Takeover Form
- FORM_TRANSFER: Department / Ward-to-ICU Transfer Form
- FORM_FEEDBACK: Inpatient Bilingual Experience & Satisfaction Survey
"""

from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, ConfigDict, Field


class FormHandover(BaseModel):
    model_config = ConfigDict(extra="ignore")

    handover_datetime: datetime = Field(default_factory=datetime.now)
    outgoing_doctor_name: str = Field(..., min_length=2, max_length=150)
    incoming_doctor_name: str = Field(..., min_length=2, max_length=150)
    clinical_summary: str = Field(..., min_length=10, description="Active status, response to treatment")
    pending_investigations: Optional[str] = Field(None, description="Pending lab or radiology results to review")
    critical_watch_parameters: str = Field("Monitor SpO2 and hourly urine output", max_length=255)
    resuscitation_status: Literal["FULL_CODE", "DNR_DNI", "MODIFIED_CODE"] = "FULL_CODE"


class FormTransfer(BaseModel):
    model_config = ConfigDict(extra="ignore")

    transfer_datetime: datetime = Field(default_factory=datetime.now)
    from_ward_or_unit: str = Field(..., min_length=2, max_length=100)
    to_ward_or_unit: str = Field(..., min_length=2, max_length=100)
    reason_for_transfer: str = Field(..., min_length=5, description="ICU step-down, emergency escalation, postoperative recovery")
    transport_bp: str = Field("120/80 mmHg", max_length=30)
    transport_pulse: int = Field(80, ge=30, le=220)
    transport_spo2: int = Field(98, ge=50, le=100)
    active_iv_infusions: Optional[str] = Field(None, description="Running IV fluids, inotropes, or blood infusions")
    transferring_staff_name: str = Field(..., min_length=2, max_length=100)
    receiving_staff_name: str = Field(..., min_length=2, max_length=100)


class FormFeedback(BaseModel):
    model_config = ConfigDict(extra="ignore")

    submission_date: datetime = Field(default_factory=datetime.now)
    patient_or_relative_name: str = Field(..., min_length=2, max_length=150)
    nursing_care_rating: int = Field(5, ge=1, le=5, description="1 to 5 stars")
    doctor_communication_rating: int = Field(5, ge=1, le=5, description="1 to 5 stars")
    cleanliness_and_hygiene_rating: int = Field(5, ge=1, le=5, description="1 to 5 stars")
    food_and_dietary_rating: int = Field(5, ge=1, le=5, description="1 to 5 stars")
    billing_transparency_rating: int = Field(5, ge=1, le=5, description="1 to 5 stars")
    overall_satisfaction_rating: int = Field(5, ge=1, le=5, description="1 to 5 stars")
    comments_or_suggestions: Optional[str] = Field(None, max_length=1000)
    would_recommend_hospital: bool = Field(True)
