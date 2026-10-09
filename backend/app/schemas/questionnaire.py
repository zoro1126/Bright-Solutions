from pydantic import BaseModel, Field
from typing import Optional, Dict

class QuestionnaireInput(BaseModel):
    patient_id: int = Field(..., description="Patient Master ID")
    answers: Dict[str, Optional[int]] = Field(
        default_factory=dict,
        description="Key-value mapping of questions (q1..q20) to chosen integer MCQ option index (0, 1, 2, 3...)"
    )
    voice_notes: Optional[str] = Field(None, description="Optional dictated voice notes from triage intake")
