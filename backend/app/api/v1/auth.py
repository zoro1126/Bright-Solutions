from typing import Optional
from fastapi import APIRouter, Depends
from app.services.auth_service import AuthService
from app.schemas.auth import LoginRequest
from app.core.security import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login")
def login(req: LoginRequest):
    """Authenticates clinic personnel by username and issues session token."""
    return AuthService.login(req)

@router.get("/users")
def list_auth_users():
    """Lists available clinic users to enable 1-click persona testing."""
    users = AuthService.list_users()
    return {"users": users}

@router.get("/me")
def get_current_user_profile(current_user: Optional[dict] = Depends(get_current_user)):
    """Returns profile of currently authenticated user session."""
    if not current_user:
        return {"authenticated": False, "user": None}
    safe_user = {k: v for k, v in current_user.items() if k != "password_hash"}
    return {"authenticated": True, "user": safe_user}
