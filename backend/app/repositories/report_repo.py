from typing import Optional, List, Dict, Any
from app.core.database import get_connection

class ReportRepository:
    @staticmethod
    def insert_report(
        visit_id: int,
        patient_id: int,
        report_type: str,
        modality: Optional[str],
        file_path: str,
        file_size_mb: float,
        findings_summary: Optional[str]
    ) -> int:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO external_reports 
                    (visit_id, patient_id, report_type, modality, file_path, file_size_mb, findings_summary)
                    VALUES (%s, %s, %s, %s, %s, %s, %s);
                """, (
                    visit_id,
                    patient_id,
                    report_type,
                    modality.strip() if modality else None,
                    file_path,
                    file_size_mb,
                    findings_summary.strip() if findings_summary else None
                ))
                return cur.lastrowid
        finally:
            conn.close()

    @staticmethod
    def list_by_visit_id(visit_id: int) -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        id, visit_id, patient_id, report_type, modality, 
                        file_path, file_size_mb, findings_summary, upload_date, created_at
                    FROM external_reports
                    WHERE visit_id = %s
                    ORDER BY upload_date DESC;
                """, (visit_id,))
                reports = cur.fetchall()
                for r in reports:
                    if r.get("upload_date") and hasattr(r["upload_date"], "isoformat"):
                        r["upload_date"] = r["upload_date"].isoformat()
                    if r.get("created_at") and hasattr(r["created_at"], "isoformat"):
                        r["created_at"] = r["created_at"].isoformat()
                    if r.get("file_size_mb") is not None:
                        r["file_size_mb"] = float(r["file_size_mb"])
                return reports
        finally:
            conn.close()

    @staticmethod
    def get_by_id(report_id: int) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        id, visit_id, patient_id, report_type, modality, 
                        file_path, file_size_mb, findings_summary, upload_date, created_at
                    FROM external_reports
                    WHERE id = %s;
                """, (report_id,))
                r = cur.fetchone()
                if r:
                    if r.get("upload_date") and hasattr(r["upload_date"], "isoformat"):
                        r["upload_date"] = r["upload_date"].isoformat()
                    if r.get("created_at") and hasattr(r["created_at"], "isoformat"):
                        r["created_at"] = r["created_at"].isoformat()
                    if r.get("file_size_mb") is not None:
                        r["file_size_mb"] = float(r["file_size_mb"])
                return r
        finally:
            conn.close()

    @staticmethod
    def delete_report(report_id: int) -> bool:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM external_reports WHERE id = %s;", (report_id,))
                return cur.rowcount > 0
        finally:
            conn.close()

