from typing import Optional, List
from fastapi import APIRouter, Depends, status

from app.core.dependencies import require_permission, get_current_active_user
from app.modules.prescription.schemas import (
    PrescriptionCreateRequest,
    PrescriptionResponse,
    DdiCheckRequest,
    DdiCheckResponse,
    IpdReferralRequest
)
from app.modules.prescription.service import PrescriptionService

router = APIRouter(tags=["E-Prescriptions, CDSS & IPD Referrals"])

@router.post(
    "/prescriptions",
    status_code=status.HTTP_201_CREATED,
    summary="Create e-prescription order with multiple medications"
)
def create_prescription(
    req: PrescriptionCreateRequest,
    current_user: dict = Depends(require_permission("rx:write"))
):
    """
    Formulates a multi-item e-prescription order:
    - Generates sequential monotonic prescription number (e.g. RX-001001)
    - Records drug, dosage, route, frequency (OD, BD, TID, etc.), and duration
    - Links to patient and active consultation encounter
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    user_id = int(current_user.get("user_id", 1))

    rx = PrescriptionService.create_prescription(req=req, hospital_id=hospital_id, user_id=user_id)
    return {
        "success": True,
        "data": rx,
        "message": f"Prescription #{rx['prescription_number']} generated successfully"
    }

@router.post(
    "/cdss/check-ddi",
    summary="Evaluate potential Drug-Drug Interactions across prescribed medications"
)
def check_drug_interactions(
    req: DdiCheckRequest,
    current_user: dict = Depends(require_permission("cdss:evaluate"))
):
    """
    Evaluates clinical Drug-Drug Interactions (DDIs) across a list of prescribed generics
    against the deterministic CDSS rule catalog.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    result = PrescriptionService.check_ddi(drug_generics=req.drug_generics, hospital_id=hospital_id)
    return {
        "success": True,
        "data": result
    }

@router.post(
    "/consultations/{consultation_uuid}/refer-ipd",
    status_code=status.HTTP_201_CREATED,
    summary="Create 'Admit to IPD' Inpatient Referral Order from consultation chamber"
)
def refer_to_inpatient(
    consultation_uuid: str,
    req: IpdReferralRequest,
    current_user: dict = Depends(require_permission("consultation:write"))
):
    """
    Flags patient for Inpatient Admission from doctor consultation chamber:
    - Records provisional diagnosis, preferred bed category (General/Semi-Private/ICU), and clinical urgency
    - Enqueues patient into the IPD Admission Desk queue for bed allocation
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    user_id = int(current_user.get("user_id", 1))

    referral = PrescriptionService.refer_patient_to_ipd(
        consultation_uuid=consultation_uuid,
        req=req,
        hospital_id=hospital_id,
        user_id=user_id
    )

    return {
        "success": True,
        "data": referral,
        "message": f"Patient referred for IPD admission ({referral['clinical_urgency']})."
    }

@router.get(
    "/opd/referrals/ipd",
    summary="List pending IPD admission referrals from OPD chamber"
)
def list_pending_referrals(
    current_user: dict = Depends(require_permission("opd:read"))
):
    """Returns the worklist of patients referred for IPD admission awaiting bed allocation."""
    hospital_id = int(current_user.get("hospital_id", 1))
    referrals = PrescriptionService.list_pending_ipd_referrals(hospital_id=hospital_id)
    return {
        "success": True,
        "data": referrals,
        "count": len(referrals)
    }

