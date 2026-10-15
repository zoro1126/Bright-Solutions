from typing import Optional, List
from fastapi import APIRouter, status, Depends, Query
from app.services.analytics_service import AnalyticsService
from app.services.auth_service import AuthService
from app.services.audit_service import AuditService
from app.schemas.auth import CreateUserRequest, ToggleStatusRequest
from app.core.security import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin Governance"])

@router.get("/analytics")
def get_admin_analytics(current_user: Optional[dict] = Depends(get_current_user)):
    """
    FEAT-11 / 7.2: Executive clinical governance metrics:
    - Today's patient footfall and active clinic stages
    - Total gross revenue collection grouped by payment tender
    - Doctor consultation workload and throughput
    """
    return AnalyticsService.get_admin_analytics()

@router.get("/dashboard")
def get_admin_dashboard(current_user: Optional[dict] = Depends(get_current_user)):
    """Alias for /api/admin/analytics providing consolidated hospital governance stats."""
    return AnalyticsService.get_admin_analytics()

@router.get("/staff")
def list_staff(current_user: Optional[dict] = Depends(get_current_user)):
    """
    FEAT-11 / 7.2: Returns complete hospital staff directory from users table
    (excluding password hashes) ordered by role hierarchy.
    """
    return AuthService.list_staff()

@router.post("/staff", status_code=status.HTTP_201_CREATED)
@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_staff_user(req: CreateUserRequest, current_user: Optional[dict] = Depends(get_current_user)):
    """
    FEAT-11 / 7.3: Provisions new hospital staff account with bcrypt password encryption
    and granular role assignment (RECEPTIONIST, DOCTOR, CASHIER, ADMIN).
    """
    return AuthService.create_staff_user(req)

@router.put("/staff/{user_id}/status")
def toggle_staff_status(user_id: int, req: ToggleStatusRequest, current_user: Optional[dict] = Depends(get_current_user)):
    """
    FEAT-11 / 7.4: Enables or disables staff account access (active: true/false).
    """
    return AuthService.toggle_staff_status(user_id, req.get_status())

@router.get("/audit-logs")
def get_audit_logs(
    category: Optional[str] = Query(None, description="CDSS_OVERRIDE, BILLING_ADJUSTMENT, TRIAGE_EDIT, USER_AUTH, PRESCRIPTION_LOCK"),
    severity: Optional[str] = Query(None, description="INFO, LOW, MEDIUM, HIGH"),
    limit: int = Query(50, ge=1, le=200, description="Max entries to return"),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    FEAT-11 / 7.5: Immutable governance audit log feed detailing clinical overrides,
    status changes, and staff operations.
    """
    return AuditService.get_audit_logs(category=category, severity=severity, limit=limit)

