from typing import Optional
from fastapi import APIRouter, status, Depends
from app.services.analytics_service import AnalyticsService
from app.services.auth_service import AuthService
from app.schemas.auth import CreateUserRequest
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

@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_staff_user(req: CreateUserRequest, current_user: Optional[dict] = Depends(get_current_user)):
    """
    FEAT-11: Provisions new hospital staff account with bcrypt password encryption
    and granular role assignment (RECEPTIONIST, DOCTOR, CASHIER, ADMIN).
    """
    return AuthService.create_staff_user(req)
