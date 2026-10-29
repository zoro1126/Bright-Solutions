import json
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from cryptography.hazmat.primitives.asymmetric import ed25519

from app.core.config import settings
from app.core.database import engine

router = APIRouter(prefix="/admin/license", tags=["Licensing"])

# Embedded Ed25519 Public Verification Key for Bright Solutions On-Premise Installations
EMBEDDED_PUBLIC_KEY_HEX = os.getenv(
    "ED25519_PUBLIC_KEY",
    "1205f07fb12175107fa7c918fc58ffcce0940a920c56e780ce4c4fc9f1116126"
)

class LicenseUploadRequest(BaseModel):
    raw_payload: str = Field(..., description="JSON string of license contents")
    signature: str = Field(..., description="Hex-encoded Ed25519 cryptographic signature")

class LicenseStatusResponse(BaseModel):
    status: str  # ACTIVE, GRACE_PERIOD, EXPIRED, TAMPERED, NO_LICENSE
    license_id: Optional[str] = None
    tier: Optional[str] = None
    hospital_id: int
    hospital_code: Optional[str] = None
    enabled_modules: List[str] = []
    max_beds: Optional[int] = None
    max_doctors: Optional[int] = None
    valid_until: Optional[str] = None
    days_remaining: int = 0
    grace_period_days: int = 14
    is_write_allowed: bool = True
    clock_tampered: bool = False
    message: str = ""

class LicenseService:
    _cached_license: Optional[Dict[str, Any]] = None
    _public_key: Optional[ed25519.Ed25519PublicKey] = None

    @classmethod
    def get_public_key(cls) -> ed25519.Ed25519PublicKey:
        if cls._public_key is None:
            cls._public_key = ed25519.Ed25519PublicKey.from_public_bytes(
                bytes.fromhex(EMBEDDED_PUBLIC_KEY_HEX)
            )
        return cls._public_key

    @classmethod
    def verify_signature(cls, raw_payload_str: str, signature_hex: str) -> bool:
        try:
            pub_key = cls.get_public_key()
            sig_bytes = bytes.fromhex(signature_hex.strip())
            payload_bytes = raw_payload_str.strip().encode("utf-8")
            pub_key.verify(sig_bytes, payload_bytes)
            return True
        except Exception:
            return False

    @classmethod
    def get_license_status(cls, hospital_id: int = 1) -> Dict[str, Any]:
        with engine.connect() as conn:
            row = conn.execute(text("""
                SELECT id, license_id, tier, raw_payload, signature, valid_from, valid_until,
                       grace_period_days, last_known_monotonic_time, is_active
                FROM license_records
                WHERE hospital_id = :hid AND is_active = 1
                ORDER BY id DESC LIMIT 1
            """), {"hid": hospital_id}).fetchone()

            if not row:
                return {
                    "status": "NO_LICENSE", "hospital_id": hospital_id,
                    "is_write_allowed": False, "clock_tampered": False,
                    "message": "No active license installed."
                }

            # 1. Cryptographic Signature Verification
            if not cls.verify_signature(row.raw_payload, row.signature):
                return {
                    "status": "TAMPERED", "hospital_id": hospital_id,
                    "is_write_allowed": False, "clock_tampered": False,
                    "message": "Cryptographic signature mismatch! License payload altered."
                }

            payload = json.loads(row.raw_payload)
            now = datetime.now()

            # 2. Clock Rollback Detection (ADR-010)
            last_mono = row.last_known_monotonic_time
            if last_mono and now < (last_mono - timedelta(minutes=5)):
                return {
                    "status": "TAMPERED", "hospital_id": hospital_id,
                    "is_write_allowed": False, "clock_tampered": True,
                    "message": f"Security Alert: Clock rollback detected! Current: {now}, Monotonic high-water: {last_mono}"
                }

            # 3. Validity & Grace Period Evaluation
            valid_until = row.valid_until
            grace_days = row.grace_period_days or 14
            grace_until = valid_until + timedelta(days=grace_days)

            days_remaining = (valid_until - now).days

            if now <= valid_until:
                lic_status = "ACTIVE"
                write_allowed = True
                msg = f"License active ({days_remaining} days remaining)."
            elif now <= grace_until:
                grace_left = (grace_until - now).days
                lic_status = "GRACE_PERIOD"
                write_allowed = True
                msg = f"Subscription expired. 14-Day emergency grace period active ({grace_left} days left)."
            else:
                lic_status = "EXPIRED"
                write_allowed = False
                msg = "License and grace period expired. System operating in Read-Only mode."

        return {
            "status": lic_status,
            "license_id": row.license_id,
            "tier": row.tier,
            "hospital_id": hospital_id,
            "hospital_code": payload.get("hospital_code"),
            "enabled_modules": payload.get("enabled_modules", []),
            "max_beds": payload.get("max_beds"),
            "max_doctors": payload.get("max_doctors"),
            "valid_until": valid_until.isoformat(),
            "days_remaining": max(0, days_remaining),
            "grace_period_days": grace_days,
            "is_write_allowed": write_allowed,
            "clock_tampered": False,
            "message": msg
        }

    @classmethod
    def is_module_licensed(cls, module_code: str, hospital_id: int = 1) -> bool:
        stat = cls.get_license_status(hospital_id)
        if not stat.get("is_write_allowed") and stat.get("status") not in ("ACTIVE", "GRACE_PERIOD"):
            return False
        return module_code.upper() in [m.upper() for m in stat.get("enabled_modules", [])]

    @classmethod
    def install_license(cls, raw_payload_str: str, signature_hex: str, hospital_id: int = 1) -> Dict[str, Any]:
        if not cls.verify_signature(raw_payload_str, signature_hex):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="License signature verification failed. Untrusted or modified license file."
            )

        payload = json.loads(raw_payload_str)
        lic_hospital_id = payload.get("hospital_id", hospital_id)
        valid_from = datetime.fromisoformat(payload["valid_from"].replace("Z", "+00:00")).replace(tzinfo=None)
        valid_until = datetime.fromisoformat(payload["valid_until"].replace("Z", "+00:00")).replace(tzinfo=None)

        if valid_until <= datetime.now():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Uploaded license is already expired (valid_until: {valid_until})."
            )

        with engine.begin() as conn:
            # Archive existing licenses
            conn.execute(text("UPDATE license_records SET is_active = 0 WHERE hospital_id = :hid"), {"hid": lic_hospital_id})

            # Insert new verified license
            conn.execute(text("""
                INSERT INTO license_records (
                    hospital_id, license_id, tier, raw_payload, signature,
                    valid_from, valid_until, grace_period_days, last_known_monotonic_time, is_active
                ) VALUES (
                    :hid, :lid, :tier, :payload, :sig,
                    :vfrom, :vuntil, :grace, NOW(), 1
                )
            """), {
                "hid": lic_hospital_id,
                "lid": payload.get("license_id", f"LIC-{datetime.now().year}-{lic_hospital_id}"),
                "tier": payload.get("tier", "STANDARD"),
                "payload": raw_payload_str,
                "sig": signature_hex.strip(),
                "vfrom": valid_from,
                "vuntil": valid_until,
                "grace": payload.get("grace_period_days", 14)
            })

            # Synchronize tenant_modules
            conn.execute(text("DELETE FROM tenant_modules WHERE hospital_id = :hid"), {"hid": lic_hospital_id})
            for mod in payload.get("enabled_modules", []):
                max_u = payload.get("max_beds") if mod == "IPD" else (payload.get("max_doctors") if mod == "OPD" else None)
                conn.execute(text("""
                    INSERT INTO tenant_modules (hospital_id, module_code, is_active, valid_until, max_units)
                    VALUES (:hid, :mod, 1, :vuntil, :max_u)
                """), {"hid": lic_hospital_id, "mod": mod, "vuntil": valid_until, "max_u": max_u})

        cls._cached_license = None
        return cls.get_license_status(lic_hospital_id)


# -----------------------------------------------------------------------------
# Admin License Endpoints
# -----------------------------------------------------------------------------
@router.get("", response_model=LicenseStatusResponse)
@router.get("/status", response_model=LicenseStatusResponse)
def get_current_license(hospital_id: int = 1):
    """GET /api/v1/admin/license - Returns current license status and quotas."""
    return LicenseService.get_license_status(hospital_id)

@router.post("/upload", response_model=LicenseStatusResponse)
def upload_license(req: LicenseUploadRequest, hospital_id: int = 1):
    """
    POST /api/v1/admin/license/upload
    Instantly verifies and activates an Ed25519-signed .lic offline payload with zero server reboot.
    """
    return LicenseService.install_license(req.raw_payload, req.signature, hospital_id)

