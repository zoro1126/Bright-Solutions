from typing import Optional, List, Literal
from pydantic import BaseModel, Field

FrequencyType = Literal["OD", "BD", "TID", "QID", "PRN", "STAT", "OTHER"]
RouteType = Literal["ORAL", "IV", "IM", "SC", "TOPICAL", "INHALATION", "OTHER"]
FoodRelationType = Literal["BEFORE_FOOD", "AFTER_FOOD", "WITH_FOOD", "EMPTY_STOMACH", "NO_RELATION"]
UrgencyType = Literal["ROUTINE", "URGENT", "EMERGENCY"]

class PrescriptionItemInput(BaseModel):
    drug_name: str = Field(..., description="Brand or generic medication name")
    dosage: str = Field(..., description="Dosage specification e.g. 500mg, 1 tablet")
    frequency: FrequencyType = Field("BD", description="Dose schedule: OD, BD, TID, QID, PRN, STAT")
    route: RouteType = Field("ORAL", description="Administration route: ORAL, IV, IM, SC, etc.")
    duration_days: int = Field(5, ge=1, le=180, description="Duration in days")
    quantity_prescribed: int = Field(10, ge=1, le=1000, description="Total units to dispense")
    food_relation: FoodRelationType = Field("AFTER_FOOD", description="Relation to meals")
    special_instructions: Optional[str] = Field(None, description="Clinical notes for pharmacist or patient")

class PrescriptionCreateRequest(BaseModel):
    patient_uuid: Optional[str] = Field(None, description="Patient public UUID")
    uhid: Optional[str] = Field(None, description="Patient UHID")
    consultation_uuid: Optional[str] = Field(None, description="Optional linked consultation UUID")
    general_instructions: Optional[str] = Field(None, description="Overall prescription instructions")
    items: List[PrescriptionItemInput] = Field(..., min_length=1, description="List of medications prescribed")

class PrescriptionItemResponse(BaseModel):
    id: int
    drug_name: str
    dosage: str
    frequency: str
    route: str
    duration_days: int
    quantity_prescribed: int
    food_relation: str
    special_instructions: Optional[str] = None

class PrescriptionResponse(BaseModel):
    public_id: str
    prescription_number: str
    uhid: str
    patient_name: str
    doctor_name: str
    doctor_uuid: str
    consultation_uuid: Optional[str] = None
    status: str
    general_instructions: Optional[str] = None
    items: List[PrescriptionItemResponse]
    created_at: str

class DdiCheckRequest(BaseModel):
    drug_generics: List[str] = Field(..., min_length=2, description="List of generic active ingredients to cross-check")

class DdiInteractionItem(BaseModel):
    drug_a: str
    drug_b: str
    severity: str
    clinical_mechanism: str
    management_advice: str

class DdiCheckResponse(BaseModel):
    has_interactions: bool
    interactions: List[DdiInteractionItem]

class IpdReferralRequest(BaseModel):
    provisional_diagnosis: str = Field(..., min_length=2, description="Primary clinical diagnosis prompting admission")
    preferred_bed_category: str = Field("GENERAL", description="Requested ward category: GENERAL, SEMI_PRIVATE, ICU")
    clinical_urgency: UrgencyType = Field("ROUTINE", description="Triage urgency: ROUTINE, URGENT, EMERGENCY")
    reason_for_admission: Optional[str] = Field(None, description="Clinical justification for inpatient stay")

