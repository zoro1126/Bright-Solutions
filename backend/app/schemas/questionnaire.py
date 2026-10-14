from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class QuestionnaireInput(BaseModel):
    patient_id: Optional[int] = Field(None, description="Patient Master ID (auto-resolved from visit if omitted)")
    answers: Dict[str, Any] = Field(
        default_factory=dict,
        description="MCQ responses (q1..q20 or named survey fields e.g. phq2_1, peg_pain)"
    )
    voice_notes: Optional[str] = Field(None, description="Optional dictated voice notes from triage intake")
    allergies: Optional[List[str]] = Field(None, description="Optional known drug allergies (e.g. ['Penicillin', 'Sulfa'])")
    comorbidities: Optional[List[str]] = Field(None, description="Optional chronic conditions (e.g. ['CKD', 'Asthma'])")
    chief_complaint: Optional[str] = Field(None, description="Optional updated chief complaint from questionnaire")

class PredictedConditionItem(BaseModel):
    disease_code: str
    icd10_code: str
    disease_name: str
    rationale: str

class RecommendedMedicationItem(BaseModel):
    inn_name: str
    strength: str
    dosage_form: str
    atc_code: str
    rxcui: Optional[str] = None
    standard_schedule: str
    line_of_treatment: str
    safety_status: str
    safety_notes: str
    is_recommended: bool
    available_brands: Optional[str] = None

class QuestionnaireResponse(BaseModel):
    message: str
    visit_id: int
    questionnaire_id: int
    recorded_answers: Dict[str, Any]
    clinical_scores: Dict[str, Any]
    predicted_conditions: List[PredictedConditionItem]
    recommended_medications: List[RecommendedMedicationItem]
    insights_generated_count: int
    updated_at: str
