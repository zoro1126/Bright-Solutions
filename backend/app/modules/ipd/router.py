"""
Inpatient (IPD) & Bed Matrix API Router
Guarded by SaaS ModuleGuard ('IPD') and fine-grained RBAC permissions.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.engine import Connection

from app.core.database import get_db_connection
from app.core.dependencies import require_module, require_permission, UserContext
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
    current_user: UserContext = Depends(require_permission("ipd:read")),
    conn: Connection = Depends(get_db_connection),
):
    """
    Returns visual bed occupancy matrix (wards -> rooms -> beds with live occupancy details).
    Guarded by @require_module('IPD') and 'ipd:read' permission.
    """
    return IPDService.get_bed_matrix(conn, current_user.hospital_id)


@router.get(
    "/wards",
    response_model=List[WardSummaryResponse],
    dependencies=[Depends(require_module("IPD"))],
)
def list_wards(
    current_user: UserContext = Depends(require_permission("ipd:read")),
    conn: Connection = Depends(get_db_connection),
):
    """
    Lists hospital wards with real-time bed capacity and occupancy totals.
    """
    return IPDService.list_wards(conn, current_user.hospital_id)


@router.patch(
    "/beds/{bed_uuid}/status",
    response_model=BedDetailResponse,
    dependencies=[Depends(require_module("IPD"))],
)
def update_bed_status(
    bed_uuid: str,
    payload: UpdateBedStatusRequest,
    current_user: UserContext = Depends(require_permission("ipd:read")),
    conn: Connection = Depends(get_db_connection),
):
    """
    Updates bed maintenance/cleaning state (AVAILABLE, CLEANING, MAINTENANCE, RESERVED).
    Guarded against unauthorized modification of active OCCUPIED inpatient beds.
    """
    allowed_roles = {"SUPER_ADMIN", "ADMIN", "NURSE", "RECEPTIONIST"}
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only nursing or administrative personnel can update bed status.",
        )

    return IPDService.update_bed_status(
        conn=conn,
        hospital_id=current_user.hospital_id,
        bed_uuid=bed_uuid,
        new_status=payload.status.value,
        notes=payload.notes,
        user_id=current_user.user_id,
    )
