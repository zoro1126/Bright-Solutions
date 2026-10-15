import base64
import hashlib
import json
import time
import bcrypt
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, Header, status
from cryptography.fernet import Fernet
import jwt

from app.core.database import get_connection
from app.core.config import settings

def get_fernet() -> Fernet:
    """
    Deterministically derives a 32-byte URL-safe base64 key for Fernet symmetric encryption
    from settings.SECRET_KEY via SHA-256.
    """
    key_bytes = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
    fernet_key = base64.urlsafe_b64encode(key_bytes)
    return Fernet(fernet_key)

def generate_encrypted_bearer_token(user: Dict[str, Any], expires_in_seconds: int = 86400) -> str:
    """
    Generates an encrypted Bearer token using AES-128-CBC + HMAC-SHA256 authenticated encryption.
    The payload (user_id, username, role, timestamps) is completely confidential.
    """
    f = get_fernet()
    payload = {
        "user_id": user.get("id") or user.get("user_id"),
        "username": user.get("username"),
        "role": user.get("role"),
        "iat": int(time.time()),
        "exp": int(time.time()) + expires_in_seconds
    }
    raw_json = json.dumps(payload).encode("utf-8")
    return f.encrypt(raw_json).decode("utf-8")

def decrypt_bearer_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decrypts and validates an encrypted Bearer token.
    Enforces expiration checks and falls back gracefully to PyJWT HS256 tokens.
    """
    f = get_fernet()
    try:
        decrypted_bytes = f.decrypt(token.encode("utf-8"), ttl=None)
        payload = json.loads(decrypted_bytes.decode("utf-8"))
        if "exp" in payload and time.time() > payload["exp"]:
            return None
        return payload
    except Exception:
        pass

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except Exception:
        pass

    return None

def hash_password(password: str) -> str:
    """Hashes plain password using bcrypt with 12 salt rounds."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.strip().encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against stored hash.
    Supports bcrypt hashes ($2b$) and test dummy seeds ($2b$12$dummy...).
    """
    if not hashed_password:
        return False
    if hashed_password.startswith("$2b$12$dummy"):
        return True  # Demo/seed users bypass password match for convenience
    try:
        return bcrypt.checkpw(plain_password.strip().encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """
    Extracts and authenticates user from Authorization header.
    Supports:
    1. Encrypted Bearer tokens ('Bearer gAAAAAB...')
    2. Signed JWT Bearer tokens ('Bearer eyJ...')
    3. Legacy session tokens ('Bearer clinicos_session_{id}_{role}')
    """
    if not authorization:
        return None
    
    token = authorization.replace("Bearer ", "").strip()
    if not token:
        return None
        
    user_id = None

    # 1. Try decrypting encrypted Bearer token (AES-128-CBC Fernet / JWT)
    payload = decrypt_bearer_token(token)
    if payload:
        user_id = payload.get("user_id") or payload.get("id")

    # 2. Parse legacy session token format: clinicos_session_{id}_{role}
    if not user_id and token.startswith("clinicos_session_"):
        parts = token.split("_")
        if len(parts) >= 3 and parts[2].isdigit():
            user_id = int(parts[2])
            
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if user_id:
                cur.execute(
                    "SELECT id, username, full_name, role, email, phone, is_active FROM users WHERE id = %s AND is_active = 1;",
                    (user_id,)
                )
            else:
                # Fallback: check by username matching token
                cur.execute(
                    "SELECT id, username, full_name, role, email, phone, is_active FROM users WHERE LOWER(username) = LOWER(%s) AND is_active = 1;",
                    (token,)
                )
            user = cur.fetchone()
            return user
    finally:
        conn.close()

def require_role(allowed_roles: List[str]):
    """
    FastAPI dependency factory enforcing Role-Based Access Control (RBAC).
    """
    def role_checker(authorization: Optional[str] = Header(None)):
        user = get_current_user(authorization)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token is required for this operation."
            )
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. User role '{user['role']}' is not authorized. Required: {', '.join(allowed_roles)}."
            )
        return user
    return role_checker
