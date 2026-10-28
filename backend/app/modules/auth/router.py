import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Response, Header, status
from pydantic import BaseModel, Field
import jwt
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine
from app.core.security import verify_password

router = APIRouter(prefix="/auth", tags=["Auth"])

# -----------------------------------------------------------------------------
# Schemas
# -----------------------------------------------------------------------------
class LoginRequest(BaseModel):
    username: str = Field(..., description="Staff username or email")
    password: str = Field(..., description="Staff account password")

class RefreshRequest(BaseModel):
    refresh_token: Optional[str] = Field(None, description="Optional body fallback for refresh token")

# -----------------------------------------------------------------------------
# JWT Helper Utilities
# -----------------------------------------------------------------------------
def create_access_token(user_id: int, username: str, role: str, hospital_id: int, hospital_code: str, modules: List[str]) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "jti": str(uuid.uuid4()),
        "sub": str(user_id),
        "user_id": user_id,
        "username": username,
        "role": role,
        "hospital_id": hospital_id,
        "hospital_code": hospital_code,
        "enabled_modules": modules,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=15)).timestamp())
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Access token has expired")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")

def get_current_token_payload(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization Bearer token required")
    token = authorization.split(" ", 1)[1].strip()
    return decode_access_token(token)

# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------
@router.post("/login")
def login(req: LoginRequest, request: Request, response: Response):
    """
    POST /api/v1/auth/login
    Verifies Argon2id credentials, returns 15-min JWT access token and sets 7-day stateful refresh token cookie.
    """
    clean_login = req.username.strip().lower()
    with engine.begin() as conn:
        # Fetch user
        user = conn.execute(text("""
            SELECT u.id, u.public_id, u.hospital_id, u.username, u.password_hash, u.full_name,
                   u.email, u.phone, u.is_active, r.role_code, r.role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE (LOWER(u.username) = :login OR LOWER(u.email) = :login) AND u.is_active = 1
        """), {"login": clean_login}).fetchone()

        if not user or not verify_password(req.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

        # Fetch hospital context
        hosp = conn.execute(text("""
            SELECT id, hospital_code, name FROM hospitals WHERE id = :hid AND is_active = 1
        """), {"hid": user.hospital_id}).fetchone()

        # Fetch active modules
        mods = [row[0] for row in conn.execute(text("""
            SELECT module_code FROM tenant_modules
            WHERE hospital_id = :hid AND is_active = 1 AND valid_until >= NOW()
        """), {"hid": user.hospital_id}).fetchall()]

        # Update last login
        conn.execute(text("UPDATE users SET last_login_at = NOW() WHERE id = :uid"), {"uid": user.id})

        # Generate tokens
        access_token = create_access_token(user.id, user.username, user.role_code, hosp.id, hosp.hospital_code, mods)

        raw_refresh = secrets.token_urlsafe(48)
        refresh_hash = hashlib.sha256(raw_refresh.encode("utf-8")).hexdigest()
        family_id = str(uuid.uuid4())
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)

        conn.execute(text("""
            INSERT INTO user_refresh_tokens (
                user_id, token_hash, session_family_id, device_info, ip_address, is_revoked, expires_at
            ) VALUES (:uid, :thash, :fid, :dev, :ip, 0, :exp)
        """), {
            "uid": user.id,
            "thash": refresh_hash,
            "fid": family_id,
            "dev": request.headers.get("user-agent", "")[:255],
            "ip": request.client.host if request.client else None,
            "exp": expires_at
        })

    # Set HTTP-only Cookie
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 86400,
        path="/"
    )

    return {
        "access_token": access_token,
        "token_type": "Bearer",
        "expires_in": 900,
        "user": {
            "id": user.id,
            "public_id": user.public_id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role_code,
            "email": user.email,
            "phone": user.phone
        },
        "hospital": {
            "id": hosp.id,
            "hospital_code": hosp.hospital_code,
            "name": hosp.name
        },
        "enabled_modules": mods
    }

@router.post("/refresh")
def refresh(request: Request, response: Response, body: Optional[RefreshRequest] = None):
    """
    POST /api/v1/auth/refresh
    Handles Refresh Token Rotation (RTR). Revokes old token, checks family reuse, and returns new token pair.
    """
    raw_token = request.cookies.get("refresh_token")
    if not raw_token and body and body.refresh_token:
        raw_token = body.refresh_token
    if not raw_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")

    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    with engine.begin() as conn:
        token_row = conn.execute(text("""
            SELECT id, user_id, session_family_id, is_revoked, expires_at
            FROM user_refresh_tokens
            WHERE token_hash = :thash
        """), {"thash": token_hash}).fetchone()

        if not token_row:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        # Reuse of revoked token indicates compromise -> revoke entire session family
        if token_row.is_revoked:
            conn.execute(text("""
                UPDATE user_refresh_tokens SET is_revoked = 1 WHERE session_family_id = :fid
            """), {"fid": token_row.session_family_id})
            response.delete_cookie(key="refresh_token", path="/")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Revoked refresh token reused. Session terminated.")

        if token_row.expires_at < datetime.now():
            conn.execute(text("UPDATE user_refresh_tokens SET is_revoked = 1 WHERE id = :id"), {"id": token_row.id})
            response.delete_cookie(key="refresh_token", path="/")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token has expired")

        # Rotate: Invalidate current token
        conn.execute(text("UPDATE user_refresh_tokens SET is_revoked = 1 WHERE id = :id"), {"id": token_row.id})

        # Fetch user & hospital context
        user = conn.execute(text("""
            SELECT u.id, u.username, u.is_active, u.hospital_id, r.role_code, h.hospital_code
            FROM users u
            JOIN roles r ON u.role_id = r.id
            JOIN hospitals h ON u.hospital_id = h.id
            WHERE u.id = :uid AND u.is_active = 1
        """), {"uid": token_row.user_id}).fetchone()

        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account is inactive or disabled")

        mods = [row[0] for row in conn.execute(text("""
            SELECT module_code FROM tenant_modules
            WHERE hospital_id = :hid AND is_active = 1 AND valid_until >= NOW()
        """), {"hid": user.hospital_id}).fetchall()]

        # Generate new token pair with same session_family_id
        new_raw_refresh = secrets.token_urlsafe(48)
        new_refresh_hash = hashlib.sha256(new_raw_refresh.encode("utf-8")).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)

        conn.execute(text("""
            INSERT INTO user_refresh_tokens (
                user_id, token_hash, session_family_id, device_info, ip_address, is_revoked, expires_at
            ) VALUES (:uid, :thash, :fid, :dev, :ip, 0, :exp)
        """), {
            "uid": user.id,
            "thash": new_refresh_hash,
            "fid": token_row.session_family_id,
            "dev": request.headers.get("user-agent", "")[:255],
            "ip": request.client.host if request.client else None,
            "exp": expires_at
        })

        new_access_token = create_access_token(user.id, user.username, user.role_code, user.hospital_id, user.hospital_code, mods)

    # Set new cookie
    response.set_cookie(
        key="refresh_token",
        value=new_raw_refresh,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 86400,
        path="/"
    )

    return {
        "access_token": new_access_token,
        "token_type": "Bearer",
        "expires_in": 900
    }

@router.get("/me")
def get_current_user_profile(payload: Dict[str, Any] = Depends(get_current_token_payload)):
    """
    GET /api/v1/auth/me
    Returns current user profile, role, hospital context, licensed modules, and doctor profile if applicable.
    """
    user_id = payload.get("user_id")
    with engine.connect() as conn:
        user = conn.execute(text("""
            SELECT u.id, u.public_id, u.username, u.full_name, u.email, u.phone, u.is_active,
                   u.hospital_id, r.role_code, r.role_name, h.hospital_code, h.name as hospital_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            JOIN hospitals h ON u.hospital_id = h.id
            WHERE u.id = :uid AND u.is_active = 1
        """), {"uid": user_id}).fetchone()

        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")

        mods = [row[0] for row in conn.execute(text("""
            SELECT module_code FROM tenant_modules
            WHERE hospital_id = :hid AND is_active = 1 AND valid_until >= NOW()
        """), {"hid": user.hospital_id}).fetchall()]

        doc_profile = None
        if user.role_code == "DOCTOR":
            dp = conn.execute(text("""
                SELECT id, public_id, specialization, qualification, medical_council_reg_no,
                       default_consultation_fee, follow_up_fee, assigned_room_number, is_available_for_opd
                FROM doctor_profiles WHERE user_id = :uid
            """), {"uid": user.id}).fetchone()
            if dp:
                doc_profile = {
                    "id": dp.id,
                    "public_id": dp.public_id,
                    "specialization": dp.specialization,
                    "qualification": dp.qualification,
                    "medical_council_reg_no": dp.medical_council_reg_no,
                    "default_consultation_fee": float(dp.default_consultation_fee),
                    "follow_up_fee": float(dp.follow_up_fee),
                    "assigned_room_number": dp.assigned_room_number,
                    "is_available_for_opd": bool(dp.is_available_for_opd)
                }

    return {
        "user": {
            "id": user.id,
            "public_id": user.public_id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role_code,
            "role_name": user.role_name,
            "email": user.email,
            "phone": user.phone,
            "doctor_profile": doc_profile
        },
        "hospital": {
            "id": user.hospital_id,
            "hospital_code": user.hospital_code,
            "name": user.hospital_name
        },
        "enabled_modules": mods
    }

@router.post("/logout")
def logout(request: Request, response: Response):
    """
    POST /api/v1/auth/logout
    Revokes refresh token in database and removes HTTP-only cookie.
    """
    raw_token = request.cookies.get("refresh_token")
    if raw_token:
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        with engine.begin() as conn:
            conn.execute(text("UPDATE user_refresh_tokens SET is_revoked = 1 WHERE token_hash = :thash"), {"thash": token_hash})
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}
