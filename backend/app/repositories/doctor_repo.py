from typing import Optional, List, Dict, Any
from datetime import datetime
from app.core.database import get_connection

class DoctorRepository:
    @staticmethod
    def get_queue(doctor_id: Optional[int] = None) -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                query = """
                    SELECT 
                        v.id AS visit_id,
                        v.queue_token,
                        v.patient_id,
                        p.uhid,
                        CONCAT(p.first_name, ' ', p.last_name) AS full_name,
                        TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
                        p.gender,
                        v.chief_complaint,
                        v.status,
                        v.visit_date,
                        v.created_at,
                        vs.systolic_bp,
                        vs.diastolic_bp,
                        vs.bp_stage,
                        vs.pulse_rate,
                        vs.spo2_pct,
                        vs.temperature_f,
                        vs.bmi
                    FROM visits v
                    JOIN patients p ON p.id = v.patient_id
                    LEFT JOIN vital_signs vs ON vs.visit_id = v.id
                    WHERE v.status IN ('TRIAGED', 'IN_CONSULTATION')
                """
                params = []
                if doctor_id:
                    query += " AND v.doctor_id = %s"
                    params.append(doctor_id)

                query += """
                    ORDER BY 
                        FIELD(v.status, 'IN_CONSULTATION', 'TRIAGED'),
                        v.id ASC;
                """
                cur.execute(query, tuple(params))
                return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def update_visit_status(visit_id: int, new_status: str):
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("UPDATE visits SET status = %s WHERE id = %s;", (new_status, visit_id))
        finally:
            conn.close()

    @staticmethod
    def lock_and_sign_off_visit(visit_id: int, conclusion_notes: str, signed_at: datetime, doctor_id: int):
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE visits
                    SET status = 'READY_FOR_BILLING',
                        conclusion_notes = %s,
                        conclusion_signed_at = %s,
                        doctor_id = %s
                    WHERE id = %s;
                """, (conclusion_notes, signed_at, doctor_id, visit_id))
        finally:
            conn.close()
