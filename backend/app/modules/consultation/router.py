from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import require_permission, get_current_active_user
from app.modules.consultation.schemas import ConsultationDraftRequest, ConsultationResponse, Icd10SearchResult
from app.modules.consultation.service import ConsultationService

router = APIRouter(prefix="/consultations", tags=["Doctor Consultation & Clinical Notes"])

@router.post(
    "",
    status_code=status.HTTP_200_OK,
    summary="Create or autosave draft SOAP clinical notes and attach ICD-10 diagnoses"
)
@router.post(
    "/draft",
    status_code=status.HTTP_200_OK,
    summary="Autosave draft SOAP consultation note"
)
def save_consultation_draft(
    req: ConsultationDraftRequest,
    current_user: dict = Depends(require_permission("consultation:write"))
):
    """
    Autosaves clinical consultation notes:
    - Subjective (Chief complaints, duration, HPI)
    - Objective (Physical exam, systemic findings)
    - Assessment (Differential evaluation, linked ICD-10 codes)
    - Plan (Investigations, treatment, follow-up advice)
    - Transitions active visit token status to IN_CONSULTATION
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    user_id = int(current_user.get("user_id", 1))
    user_role = str(current_user.get("role", "DOCTOR"))

    consultation = ConsultationService.save_draft(
        req=req,
        hospital_id=hospital_id,
        user_id=user_id,
        user_role=user_role
    )

    return {
        "success": True,
        "data": consultation,
        "message": "Consultation draft saved successfully"
    }

@router.get(
    "/icd10/search",
    summary="Typeahead autocompletion for ICD-10 diagnostic codes"
)
def search_icd10_codes(
    q: Optional[str] = Query(None, description="Diagnostic code or keyword search term"),
    limit: int = Query(20, ge=1, le=100, description="Max results to return"),
    current_user: dict = Depends(require_permission("consultation:read"))
):
    """Searches the bundled ICD-10 India diagnostic dataset."""
    results = ConsultationService.search_icd10(q=q, limit=limit)
    return {
        "success": True,
        "data": results,
        "count": len(results)
    }

@router.get(
    "/visit/{visit_uuid}",
    summary="Retrieve active or draft consultation linked to an OPD visit"
)
def get_consultation_by_visit(
    visit_uuid: str,
    current_user: dict = Depends(require_permission("consultation:read"))
):
    """Fetches consultation documentation for a specific OPD visit encounter."""
    hospital_id = int(current_user.get("hospital_id", 1))
    consultation = ConsultationService.get_by_visit_uuid(visit_uuid=visit_uuid, hospital_id=hospital_id)
    return {
        "success": True,
        "data": consultation
    }

@router.post(
    "/{consultation_uuid}/sign",
    summary="Digitally sign and finalize clinical consultation notes"
)
def sign_consultation(
    consultation_uuid: str,
    current_user: dict = Depends(require_permission("consultation:sign"))
):
    """
    Digitally signs and immutably locks an OPD consultation:
    - Sets consultation status = 'SIGNED'
    - Transitions linked OPD visit & queue token to 'COMPLETED'
    - Confirms routing of patient to IPD Admission Desk if admitted
    - Writes immutable entry to audit log
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    user_id = int(current_user.get("user_id", 1))
    user_role = str(current_user.get("role", "DOCTOR"))

    result = ConsultationService.sign_consultation(
        consultation_uuid=consultation_uuid,
        hospital_id=hospital_id,
        user_id=user_id,
        user_role=user_role
    )

    return {
        "success": True,
        "data": result,
        "message": "Consultation finalized, signed, and encounter locked."
    }


