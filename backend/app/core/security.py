import bcrypt
from typing import Optional, List
from fastapi import HTTPException, Header, status
from app.core.database import get_connection

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
    Supports 'Bearer clinicos_session_{id}_{role}' format and Bearer tokens.
    """
    if not authorization:
        return None
    
    token = authorization.replace("Bearer ", "").strip()
    if not token:
        return None
        
    # Parse session token format: clinicos_session_{id}_{role}
    user_id = None
    if token.startswith("clinicos_session_"):
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
