"""
Pydantic v2 Inpatient Clinical Form Registry (ADR-009)
Central mapping of canonical clinical form codes to their validation schemas.
"""

from typing import Dict, Type
from pydantic import BaseModel

from app.modules.ipd.forms.intake_forms import (
    Form08AdmissionConsent,
    Form09InpatientFaceSheet,
    Form10DoctorHP,
    Form70NursingAssessment,
)
from app.modules.ipd.forms.nursing_forms import (
    Form71NurseCarePlan,
    Form72NurseProgressNotes,
)
from app.modules.ipd.forms.surgical_forms import (
    Form15PreAnaesthesia,
    Form54PreOpChecklist,
    FormOpNotes,
)
from app.modules.ipd.forms.transition_feedback_forms import (
    FormHandover,
    FormTransfer,
    FormFeedback,
)

FORM_SCHEMA_REGISTRY: Dict[str, Type[BaseModel]] = {
    "FORM_08": Form08AdmissionConsent,
    "FORM_09": Form09InpatientFaceSheet,
    "FORM_10": Form10DoctorHP,
    "FORM_70": Form70NursingAssessment,
    "FORM_71": Form71NurseCarePlan,
    "FORM_72": Form72NurseProgressNotes,
    "FORM_15": Form15PreAnaesthesia,
    "FORM_54": Form54PreOpChecklist,
    "FORM_OP_NOTES": FormOpNotes,
    "FORM_HANDOVER": FormHandover,
    "FORM_TRANSFER": FormTransfer,
    "FORM_FEEDBACK": FormFeedback,
}

__all__ = [
    "FORM_SCHEMA_REGISTRY",
    "Form08AdmissionConsent",
    "Form09InpatientFaceSheet",
    "Form10DoctorHP",
    "Form70NursingAssessment",
    "Form71NurseCarePlan",
    "Form72NurseProgressNotes",
    "Form15PreAnaesthesia",
    "Form54PreOpChecklist",
    "FormOpNotes",
    "FormHandover",
    "FormTransfer",
    "FormFeedback",
]
