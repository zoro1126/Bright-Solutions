from typing import Optional
from fastapi import APIRouter, Depends, status

from app.core.dependencies import require_permission, get_current_active_user
from app.modules.triage.schemas import VitalsIntakeRequest, VitalsResponse
from app.modules.triage.service import TriageService

router = APIRouter(tags=["Vital Signs & Triage Intake"])

@router.post(
    "/vitals",
    status_code=status.HTTP_201_CREATED,
    summary="Record patient vital signs and trigger automated CDSS safety alerts"
)
@router.post(
    "/triage/vitals",
    status_code=status.HTTP_201_CREATED,
    summary="Alias for triage nurse vital signs intake"
)
def record_triage_vitals(
    req: VitalsIntakeRequest,
    current_user: dict = Depends(require_permission("triage:vitals_write"))
):
    """
    Captures patient vital signs during nurse triage or ward monitoring:
    - Auto-calculates BMI and WHO classification (Normal, Overweight, Obese)
    - Runs deterministic CDSS alerts for Hypoxia (SpO2 < 92%), Stage 2 Hypertension, Fever, etc.
    - Persists audit trail of the recording nurse/doctor
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    recorded_by_id = int(current_user.get("user_id", 1))

    vitals = TriageService.record_vitals(
        req=req,
        hospital_id=hospital_id,
        recorded_by_id=recorded_by_id
    )

    return {
        "success": True,
        "data": vitals,
        "message": "Vital signs recorded successfully"
    }

@router.get(
    "/vitals/visit/{visit_uuid}",
    summary="Get triage vitals captured for a specific OPD visit"
)
def get_visit_vitals(
    visit_uuid: str,
    current_user: dict = Depends(require_permission("triage:vitals_read"))
):
    """Retrieves the latest vital signs snapshot captured for an OPD visit."""
    hospital_id = int(current_user.get("hospital_id", 1))
    vitals = TriageService.get_vitals_by_visit(visit_uuid=visit_uuid, hospital_id=hospital_id)
    return {
        "success": True,
        "data": vitals
    }

