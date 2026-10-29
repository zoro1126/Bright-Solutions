from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import require_permission, require_module, get_current_active_user
from app.modules.opd.schemas import OpdCheckInRequest, OpdCheckInResponse, OpdVisitItem
from app.modules.opd.service import OpdService

router = APIRouter(
    prefix="/opd",
    tags=["Outpatient (OPD) Operations"],
    dependencies=[Depends(require_module("OPD"))]
)

@router.post(
    "/visits",
    status_code=status.HTTP_201_CREATED,
    summary="Check-in patient to OPD, generate OPD#, and issue daily queue token"
)
@router.post(
    "/tokens",
    status_code=status.HTTP_201_CREATED,
    summary="Alias for OPD check-in and queue token issuance"
)
def checkin_opd_patient(
    req: OpdCheckInRequest,
    current_user: dict = Depends(require_permission("opd:checkin"))
):
    """
    Checks in a patient for Outpatient (OPD) consultation:
    - Enforces SaaS module entitlement via @require_module("OPD")
    - Generates global monotonic OPD number (e.g. OPD-001001)
    - Allocates daily monotonic queue token for the assigned doctor
    - Computes dynamic estimated wait time based on current waiting line
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    registered_by_id = int(current_user.get("user_id", 1))

    visit = OpdService.checkin_patient(
        req=req,
        hospital_id=hospital_id,
        registered_by_id=registered_by_id
    )

    return {
        "success": True,
        "data": visit,
        "message": f"Patient checked in successfully. Token #{visit['token_number']} issued."
    }

@router.get(
    "/visits",
    summary="List active OPD visits and live queue tokens for a date"
)
def list_opd_visits(
    visit_date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format (defaults to today)"),
    doctor_uuid: Optional[str] = Query(None, description="Filter by doctor public UUID"),
    status: Optional[str] = Query(None, description="Filter by visit status (WAITING, ENGAGED, COMPLETED)"),
    current_user: dict = Depends(require_permission("opd:read"))
):
    """Retrieves live OPD worklist and queue tokens."""
    hospital_id = int(current_user.get("hospital_id", 1))
    visits = OpdService.list_visits(
        hospital_id=hospital_id,
        visit_date=visit_date,
        doctor_uuid=doctor_uuid,
        status_filter=status
    )
    return {
        "success": True,
        "data": visits,
        "count": len(visits)
    }
