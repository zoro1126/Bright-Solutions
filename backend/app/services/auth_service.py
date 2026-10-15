from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from app.repositories.user_repo import UserRepository
from app.services.audit_service import AuditService
from app.core.security import verify_password, hash_password
from app.schemas.auth import LoginRequest, CreateUserRequest, ChangePasswordRequest


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
    def logout(current_user: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
        username = current_user.get("username") if current_user else "guest"
        return {
            "message": f"Session for {username} terminated successfully."
        }

    @staticmethod
    def get_current_user_profile(current_user: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        if not current_user:
            return {"authenticated": False, "user": None}
        safe_user = {k: v for k, v in current_user.items() if k != "password_hash"}
        return {"authenticated": True, "user": safe_user}

    @staticmethod
    def list_users() -> List[Dict[str, Any]]:
        users = UserRepository.list_active_users()
        # Ensure password_hash is stripped from all user dictionaries
        return [{k: v for k, v in u.items() if k != "password_hash"} for u in users]

    @staticmethod
    def change_password(user_id: int, req: ChangePasswordRequest) -> Dict[str, str]:
        user = UserRepository.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )

        pwd_hash = user.get("password_hash") or ""
        if not verify_password(req.old_password, pwd_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password entered is incorrect."
            )

        new_hash = hash_password(req.new_password)
        UserRepository.update_password(user_id, new_hash)
        return {
            "message": "Password updated successfully."
        }

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

        AuditService.log(
            category="USER_AUTH",
            severity="INFO",
            details=f"Provisioned new staff user '{clean_username}' ({clean_role})",
            user_id=None,
            user_name="ADMIN",
            user_role="ADMIN"
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

    @staticmethod
    def list_staff() -> List[Dict[str, Any]]:
        staff = UserRepository.list_all_staff()
        result = []
        for u in staff:
            u_clean = {k: v for k, v in u.items() if k != "password_hash"}
            if u_clean.get("created_at") and hasattr(u_clean["created_at"], "isoformat"):
                u_clean["created_at"] = u_clean["created_at"].isoformat()
            if u_clean.get("updated_at") and hasattr(u_clean["updated_at"], "isoformat"):
                u_clean["updated_at"] = u_clean["updated_at"].isoformat()
            result.append(u_clean)
        return result

    @staticmethod
    def toggle_staff_status(user_id: int, is_active: bool) -> Dict[str, Any]:
        user = UserRepository.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Staff user with ID {user_id} not found."
            )

        UserRepository.update_status(user_id, is_active)

        AuditService.log(
            category="USER_AUTH",
            severity="MEDIUM",
            details=f"Changed staff user '{user['username']}' active status to {is_active}",
            user_id=user_id,
            user_name=user["username"],
            user_role=user["role"]
        )

        return {
            "message": f"Staff user '{user['username']}' status updated to {'active' if is_active else 'inactive'}",
            "user_id": user_id,
            "username": user["username"],
            "is_active": is_active
        }

