from typing import Optional, List, Dict, Any
from app.repositories.audit_repo import AuditRepository

class AuditService:
    @staticmethod
    def log(
        category: str,
        severity: str,
        details: str,
        user_id: Optional[int] = None,
        user_name: str = "SYSTEM",
        user_role: str = "SYSTEM",
        patient_mrn: Optional[str] = None
    ) -> int:
        return AuditRepository.insert_audit_log(
            category=category,
            severity=severity,
            details=details,
            user_id=user_id,
            user_name=user_name,
            user_role=user_role,
            patient_mrn=patient_mrn
        )

    @staticmethod
    def get_audit_logs(
        category: Optional[str] = None,
        severity: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        rows = AuditRepository.list_audit_logs(category=category, severity=severity, limit=limit)
        formatted = []
        for r in rows:
            created_at_val = r["created_at"].isoformat() if r.get("created_at") and hasattr(r["created_at"], "isoformat") else str(r.get("created_at") or "")
            formatted.append({
                "id": r["id"],
                "user_id": r["user_id"],
                "user_name": r["user_name"],
                "user_role": r["user_role"],
                "category": r["category"],
                "severity": r["severity"],
                "patient_mrn": r["patient_mrn"],
                "details": r["details"],
                "timestamp": created_at_val,
                "created_at": created_at_val
            })
        return formatted
