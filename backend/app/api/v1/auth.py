from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from app.services.auth_service import AuthService
from app.schemas.auth import (
    LoginRequest,
    RegisterUserRequest,
    RegisterResponse,
    LoginResponse,
    ChangePasswordRequest
)
from app.core.security import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterUserRequest):
    """
    FEAT-AUTH-01: Registers a new clinic personnel / staff account, securely hashes
    the password with 12-round bcrypt, persists the user in MySQL, and returns an encrypted
    AES-128-CBC + HMAC-SHA256 authenticated Bearer token.
    """
    return AuthService.register(req)

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    """
    Authenticates clinic personnel by username and password.
    Returns encrypted Bearer token and safe user profile (zero password hash leakage).
    """
    return AuthService.login(req)

@router.post("/logout")
def logout(current_user: Optional[dict] = Depends(get_current_user)):
    """
    Terminates client session. Frontend clears localStorage auth_token.
    """
    return AuthService.logout(current_user)

@router.get("/users")
def list_auth_users():
    """
    Lists available clinic staff accounts for 1-click persona testing.
    Excludes password_hash.
    """
    users = AuthService.list_users()
    return {"users": users}

@router.get("/me")
def get_current_user_profile(current_user: Optional[dict] = Depends(get_current_user)):
    """
    Returns profile of currently authenticated user session.
    Used on app mount/reload to validate stored token.
    """
    return AuthService.get_current_user_profile(current_user)

@router.post("/change-password")
def change_password(req: ChangePasswordRequest, current_user: Optional[dict] = Depends(get_current_user)):
    """
    Allows authenticated personnel to update their password.
    Requires valid current password and hashes new password with 12-round bcrypt.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is required to change password."
        )
    return AuthService.change_password(current_user["id"], req)
