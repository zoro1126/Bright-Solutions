from typing import Optional, List, Literal
from pydantic import BaseModel, Field

DiagnosisType = Literal["PROVISIONAL", "FINAL", "DIFFERENTIAL"]

class DiagnosisInput(BaseModel):
    code: str = Field(..., description="ICD-10 classification code e.g. 'I10'")
    name: str = Field(..., description="Diagnosis name or clinical description")
    type: DiagnosisType = Field("FINAL", description="Diagnosis category: PROVISIONAL, FINAL, or DIFFERENTIAL")
    is_primary: bool = Field(False, description="Whether this is the primary reason for encounter")

class ConsultationDraftRequest(BaseModel):
    opd_visit_uuid: str = Field(..., description="Public UUID of the active OPD Visit")
    subjective: Optional[str] = Field(None, description="Chief complaints and history of present illness")
    objective: Optional[str] = Field(None, description="Physical examination and clinical systemic findings")
    assessment: Optional[str] = Field(None, description="Clinical evaluation and diagnosis rationale")
    plan: Optional[str] = Field(None, description="Investigations, lifestyle advice, and care plan")
    clinical_notes: Optional[str] = Field(None, description="Additional confidential clinical observations")
    follow_up_date: Optional[str] = Field(None, description="Follow-up review date (YYYY-MM-DD)")
    follow_up_instructions: Optional[str] = Field(None, description="Instructions to patient for next visit")
    referral_doctor_or_dept: Optional[str] = Field(None, description="Specialty referral department or consultant")
    diagnoses: Optional[List[DiagnosisInput]] = Field(default_factory=list, description="Linked ICD-10 diagnoses")

class DiagnosisResponseItem(BaseModel):
    id: int
    diagnosis_code: str
    diagnosis_name: str
    diagnosis_type: str
    is_primary: bool

class ConsultationResponse(BaseModel):
    public_id: str
    opd_visit_uuid: str
    opd_number: str
    uhid: str
    patient_name: str
    doctor_name: str
    doctor_uuid: str
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    clinical_notes: Optional[str] = None
    follow_up_date: Optional[str] = None
    follow_up_instructions: Optional[str] = None
    referral_doctor_or_dept: Optional[str] = None
    status: str
    signed_at: Optional[str] = None
    diagnoses: List[DiagnosisResponseItem] = []
    created_at: str
    updated_at: str

class Icd10SearchResult(BaseModel):
    code: str
    description: str
    chapter: Optional[str] = None

