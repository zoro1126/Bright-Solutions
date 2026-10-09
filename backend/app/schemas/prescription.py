from pydantic import BaseModel, Field
from typing import Optional, List

class PrescriptionItemInput(BaseModel):
    drug_id: int = Field(..., description="Foreign key to drug_formulary(id)")
    dosage: Optional[str] = Field("1 tab", description="Dosage quantity e.g. 1 tab, 5ml, 2 puffs")
    frequency: Optional[str] = Field("1-0-1", description="Schedule e.g. OD, BD, TDS, 1-0-1, SOS")
    duration_days: Optional[int] = Field(5, description="Duration in calendar days")
    meal_timing: Optional[str] = Field("AFTER_MEALS", description="BEFORE_MEALS, AFTER_MEALS, WITH_MEALS, BEDTIME")
    special_instructions: Optional[str] = Field(None, description="Patient-specific precautions")
    instructions: Optional[str] = Field(None, description="Alias for special_instructions")

class PrescriptionCreateRequest(BaseModel):
    doctor_id: Optional[int] = Field(None, description="Attending physician user ID")
    general_instructions: Optional[str] = Field(None, description="Dietary and lifestyle advice")
    status: Optional[str] = Field("FINALIZED", description="DRAFT, FINALIZED")
    items: List[PrescriptionItemInput] = Field(..., min_items=1, description="List of prescribed medications")
