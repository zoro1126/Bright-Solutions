"""
Inpatient (IPD) & Bed Matrix API Router
Guarded by SaaS ModuleGuard ('IPD') and fine-grained RBAC permissions.
"""

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import require_module, require_permission
from app.modules.ipd.schemas import (
    BedDetailResponse,
    BedMatrixResponse,
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
