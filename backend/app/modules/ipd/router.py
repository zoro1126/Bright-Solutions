"""
Inpatient (IPD) & Bed Matrix API Router
Guarded by SaaS ModuleGuard ('IPD') and fine-grained RBAC permissions.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import require_module, require_permission
from app.modules.ipd.schemas import (
    AdmissionResponse,
    BedDetailResponse,
    BedMatrixResponse,
    CreateAdmissionRequest,
    UpdateBedStatusRequest,
    WardSummaryResponse,
)
from app.modules.ipd.service import IPDService

router = APIRouter(tags=["Inpatient (IPD) & Bed Matrix"])


@router.get(
    "/beds/matrix",
    response_model=BedMatrixResponse,
    dependencies=[Depends(require_module("IPD"))],
)
def get_bed_occupancy_matrix(
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    Returns visual bed occupancy matrix (wards -> rooms -> beds with live occupancy details).
    Guarded by @require_module('IPD') and 'ipd:read' permission.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    return IPDService.get_bed_matrix(hospital_id)


@router.get(
    "/wards",
    response_model=List[WardSummaryResponse],
    dependencies=[Depends(require_module("IPD"))],
)
def list_wards(
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    Lists hospital wards with real-time bed capacity and occupancy totals.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    return IPDService.list_wards(hospital_id)


@router.patch(
    "/beds/{bed_uuid}/status",
    response_model=BedDetailResponse,
    dependencies=[Depends(require_module("IPD"))],
)
def update_bed_status(
    bed_uuid: str,
    payload: UpdateBedStatusRequest,
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    Updates bed maintenance/cleaning state (AVAILABLE, CLEANING, MAINTENANCE, RESERVED).
    Guarded against unauthorized modification of active OCCUPIED inpatient beds.
    """
    role = str(current_user.get("role", "")).upper()
    allowed_roles = {"SUPER_ADMIN", "ADMIN", "NURSE", "RECEPTIONIST"}
    if role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only nursing or administrative personnel can update bed status.",
        )

    hospital_id = int(current_user.get("hospital_id", 1))
    user_id = int(current_user.get("user_id", 1))

    return IPDService.update_bed_status(
        hospital_id=hospital_id,
        bed_uuid=bed_uuid,
        new_status=payload.status.value,
        notes=payload.notes,
        user_id=user_id,
    )


@router.post(
    "/ipd/admissions",
    response_model=AdmissionResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_module("IPD"))],
)
def create_ipd_admission(
    payload: CreateAdmissionRequest,
    current_user: Dict[str, Any] = Depends(require_permission("ipd:admit")),
):
    """
    Dual-path Inpatient Admission:
    - Path A: OPD Referral handoff via referral_uuid (auto-links diagnosis, doctor, opd appointment).
    - Path B: Direct / Emergency Walk-In (supports independent IPD module operation).
    Enforces concurrency-safe bed row lock (SELECT ... FOR UPDATE) and monotonic IPD_NUMBER sequence.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    user_id = int(current_user.get("user_id", 1))

    return IPDService.create_admission(
        hospital_id=hospital_id,
        req=payload,
        created_by=user_id,
    )


@router.get(
    "/ipd/admissions/{admission_uuid}",
    response_model=AdmissionResponse,
    dependencies=[Depends(require_module("IPD"))],
)
def get_ipd_admission(
    admission_uuid: str,
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    Retrieves full Inpatient Admission record including patient, assigned bed, and attending doctor.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    return IPDService.get_admission(hospital_id, admission_uuid)


@router.get(
    "/ipd/admissions",
    response_model=List[AdmissionResponse],
    dependencies=[Depends(require_module("IPD"))],
)
def list_ipd_admissions(
    status_filter: Optional[str] = Query("ADMITTED", description="Filter by admission status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    Lists hospital inpatients with real-time bed and demographic details.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    return IPDService.list_admissions(
        hospital_id=hospital_id,
        status_filter=status_filter,
        limit=limit,
        offset=offset,
    )

