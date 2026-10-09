from typing import Dict, Any, List
from fastapi import HTTPException, status
from app.repositories.user_repo import UserRepository
from app.core.security import verify_password, hash_password
from app.schemas.auth import LoginRequest, CreateUserRequest

class AuthService:
    @staticmethod
    def login(req: LoginRequest) -> Dict[str, Any]:
        user = UserRepository.get_by_username(req.username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or staff account is inactive."
            )

        pwd_hash = user.get("password_hash") or ""
        if not verify_password(req.password, pwd_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password for staff account."
            )

        # Never leak password hash in API response
        user_safe = {k: v for k, v in user.items() if k != "password_hash"}
        token = f"clinicos_session_{user['id']}_{user['role'].lower()}"
        return {
            "token": token,
            "user": user_safe,
            "message": f"Welcome back, {user['full_name']}!"
        }

    @staticmethod
    def list_users() -> List[Dict[str, Any]]:
        return UserRepository.list_active_users()

    @staticmethod
    def create_staff_user(req: CreateUserRequest) -> Dict[str, Any]:
        clean_username = req.username.strip().lower()
        clean_role = req.role.strip().upper()

        if clean_role not in ("RECEPTIONIST", "DOCTOR", "CASHIER", "ADMIN"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid staff role '{req.role}'. Must be one of: RECEPTIONIST, DOCTOR, CASHIER, ADMIN."
            )

        existing = UserRepository.get_by_username(clean_username)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Staff user with username '{req.username.strip()}' already exists."
            )

        raw_password = (req.password or "Clinic@123").strip()
        pwd_hash = hash_password(raw_password)

        user_id = UserRepository.create_user(
            username=clean_username,
            password_hash=pwd_hash,
            full_name=req.full_name.strip(),
            role=clean_role,
            email=str(req.email) if req.email else None,
            phone=req.phone.strip() if req.phone else None
        )

        return {
            "message": "Hospital staff user account provisioned successfully",
            "user_id": user_id,
            "username": clean_username,
            "full_name": req.full_name.strip(),
            "role": clean_role,
            "email": str(req.email) if req.email else None,
            "phone": req.phone.strip() if req.phone else None,
            "is_active": True
        }
