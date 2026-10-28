import jwt
from typing import Optional, Dict, Any, Set
from fastapi import Depends, HTTPException, Header, status
from app.core.config import settings

# -----------------------------------------------------------------------------
# Canonical RBAC Permission Matrix (Cached in-memory from D13 Specification)
# -----------------------------------------------------------------------------
ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    "SUPER_ADMIN": {"*"},
    "ADMIN": {
        "patient:create", "patient:read", "patient:update", "patient:delete", "patient:allergy_write",
        "opd:checkin", "opd:read", "opd:cancel",
        "triage:vitals_read", "triage:questionnaire_read",
        "consultation:read",
        "rx:read", "pharmacy:queue_read", "pharmacy:inventory_write", "pharmacy:inventory_read",
        "ipd:admit", "ipd:read", "ipd:transfer_bed", "ipd:discharge",
        "lab:order_read", "lab:verify", "lab:catalog_write",
        "billing:invoice_create", "billing:invoice_read", "billing:payment_collect", "billing:discount_apply", "billing:tariff_manage",
        "cdss:evaluate", "cdss:rule_manage",
        "admin:user_manage", "admin:config_manage", "admin:audit_read"
    },
    "HOSPITAL_ADMIN": {
        "patient:create", "patient:read", "patient:update", "patient:delete", "patient:allergy_write",
        "opd:checkin", "opd:read", "opd:cancel",
        "triage:vitals_read", "triage:questionnaire_read",
        "consultation:read",
        "rx:read", "pharmacy:queue_read", "pharmacy:inventory_write", "pharmacy:inventory_read",
        "ipd:admit", "ipd:read", "ipd:transfer_bed", "ipd:discharge",
        "lab:order_read", "lab:verify", "lab:catalog_write",
        "billing:invoice_create", "billing:invoice_read", "billing:payment_collect", "billing:discount_apply", "billing:tariff_manage",
        "cdss:evaluate", "cdss:rule_manage",
        "admin:user_manage", "admin:config_manage", "admin:audit_read"
    },
    "RECEPTIONIST": {
        "patient:create", "patient:read", "patient:update",
        "opd:checkin", "opd:read", "opd:cancel",
        "triage:vitals_read",
        "ipd:admit", "ipd:read", "ipd:transfer_bed",
        "billing:invoice_create", "billing:invoice_read", "billing:payment_collect"
    },
    "NURSE": {
        "patient:read", "patient:allergy_write",
        "opd:read",
        "triage:vitals_write", "triage:vitals_read", "triage:questionnaire_write", "triage:questionnaire_read",
        "consultation:read",
        "rx:read", "pharmacy:inventory_read",
        "ipd:read", "ipd:transfer_bed", "ipd:nurse_record_write",
        "lab:order_read",
        "cdss:evaluate"
    },
    "DOCTOR": {
        "patient:read", "patient:allergy_write",
        "opd:read", "opd:call", "opd:start", "opd:complete",
        "triage:vitals_write", "triage:vitals_read", "triage:questionnaire_write", "triage:questionnaire_read",
        "consultation:write", "consultation:read", "consultation:sign", "consultation:diagnose",
        "rx:write", "rx:read", "pharmacy:inventory_read",
        "ipd:read", "ipd:daily_notes_write", "ipd:procedure_write", "ipd:discharge_summary_write",
        "lab:order_create", "lab:order_read", "lab:verify",
        "cdss:evaluate", "cdss:override"
    },
    "PHARMACIST": {
        "patient:read",
        "opd:read",
        "rx:read", "pharmacy:queue_read", "pharmacy:dispense", "pharmacy:inventory_write", "pharmacy:inventory_read",
        "ipd:read",
        "billing:invoice_create", "billing:invoice_read", "billing:payment_collect",
        "cdss:evaluate"
    },
    "LAB_TECHNICIAN": {
        "patient:read",
        "opd:read",
        "ipd:read",
        "lab:order_read", "lab:sample_collect", "lab:result_write"
    },
    "BILLING_CLERK": {
        "patient:read",
        "opd:read",
        "ipd:read", "ipd:discharge",
        "lab:order_read",
        "billing:invoice_create", "billing:invoice_read", "billing:payment_collect", "billing:discount_apply"
    }
}

# -----------------------------------------------------------------------------
# User Authentication Extraction
# -----------------------------------------------------------------------------
def get_current_active_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Extracts and validates JWT Bearer access token from Authorization header.
    Returns decoded token dictionary containing user identity, role, and hospital claims.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header. Expected 'Bearer <token>'."
        )

    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Access token has expired.")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token.")

    return payload

# -----------------------------------------------------------------------------
# RBAC Permission Checker Dependency
# -----------------------------------------------------------------------------
class PermissionChecker:
    """
    FastAPI dependency enforcing granular RBAC against 13_rbac_permission_matrix.md.
    Evaluates against in-memory cached permission sets for zero-database overhead.
    """
    def __init__(self, required_permission: str):
        self.required_permission = required_permission

    def __call__(self, current_user: Dict[str, Any] = Depends(get_current_active_user)) -> Dict[str, Any]:
        user_role = (current_user.get("role") or "").strip().upper()

        if user_role == "SUPER_ADMIN":
            return current_user

        granted = ROLE_PERMISSIONS.get(user_role, set())
        if "*" in granted or self.required_permission in granted:
            return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Forbidden: Role '{user_role}' lacks required permission '{self.required_permission}'."
        )

def require_permission(permission_code: str):
    """Convenience factory returning a PermissionChecker dependency."""
    return PermissionChecker(permission_code)

