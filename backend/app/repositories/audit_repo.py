from typing import Optional, List, Dict, Any
from app.core.database import get_connection

class AuditRepository:
    @staticmethod
    def insert_audit_log(
        category: str,
        severity: str,
        details: str,
        user_id: Optional[int] = None,
        user_name: str = "SYSTEM",
        user_role: str = "SYSTEM",
        patient_mrn: Optional[str] = None
    ) -> int:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO audit_logs (user_id, user_name, user_role, category, severity, patient_mrn, details)
                    VALUES (%s, %s, %s, %s, %s, %s, %s);
                """, (
                    user_id,
                    user_name,
                    user_role,
                    category.upper(),
                    severity.upper(),
                    patient_mrn,
                    details
                ))
                return cur.lastrowid
        finally:
            conn.close()

    @staticmethod
    def list_audit_logs(
        category: Optional[str] = None,
        severity: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                query = "SELECT id, user_id, user_name, user_role, category, severity, patient_mrn, details, created_at FROM audit_logs WHERE 1=1"
                params = []

                if category:
                    query += " AND category = %s"
                    params.append(category.upper().strip())

                if severity:
                    query += " AND severity = %s"
                    params.append(severity.upper().strip())

                query += " ORDER BY id DESC LIMIT %s;"
                params.append(limit)

                cur.execute(query, tuple(params))
                return cur.fetchall()
        finally:
            conn.close()
