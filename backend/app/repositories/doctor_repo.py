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

    @staticmethod
    def get_patient_dossier_data(patient_id: int) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                # 1. Patient Master
                cur.execute("""
                    SELECT 
                        p.id, p.uhid, p.first_name, p.last_name, 
                        CONCAT(p.first_name, ' ', p.last_name) AS full_name,
                        p.dob, TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
                        p.gender, p.blood_group, p.phone, p.email, p.address,
                        p.emergency_contact, p.insurance_type, p.insurance_provider, p.policy_number,
                        p.created_at
                    FROM patients p WHERE p.id = %s;
                """, (patient_id,))
                patient = cur.fetchone()
                if not patient:
                    return None

                # 2. Active or most recent visit
                cur.execute("""
                    SELECT 
                        v.id AS visit_id, v.queue_token, v.status, v.chief_complaint, 
                        v.visit_date, v.doctor_id, u.full_name AS doctor_assigned,
                        v.conclusion_notes, v.conclusion_signed_at
                    FROM visits v
                    LEFT JOIN users u ON u.id = v.doctor_id
                    WHERE v.patient_id = %s
                    ORDER BY 
                        FIELD(v.status, 'IN_CONSULTATION', 'TRIAGED', 'REGISTERED', 'READY_FOR_BILLING', 'COMPLETED', 'CANCELLED'),
                        v.id DESC
                    LIMIT 1;
                """, (patient_id,))
                active_visit = cur.fetchone()
                active_visit_id = active_visit["visit_id"] if active_visit else None

                # 3. Active Vitals
                active_vitals = None
                if active_visit_id:
                    cur.execute("SELECT * FROM vital_signs WHERE visit_id = %s;", (active_visit_id,))
                    active_vitals = cur.fetchone()

                # 4. Active Intake Questionnaire
                active_questionnaire = None
                if active_visit_id:
                    cur.execute("SELECT * FROM intake_questionnaires WHERE visit_id = %s;", (active_visit_id,))
                    active_questionnaire = cur.fetchone()

                # 5. External Reports
                cur.execute("""
                    SELECT id, visit_id, report_type, modality, file_path, file_size_mb, findings_summary, upload_date
                    FROM external_reports
                    WHERE patient_id = %s
                    ORDER BY upload_date DESC;
                """, (patient_id,))
                reports = cur.fetchall()

                # 6. Past Visits History
                cur.execute("""
                    SELECT 
                        v.id AS visit_id, v.queue_token, v.visit_date, v.status, 
                        v.chief_complaint, v.conclusion_notes, v.conclusion_signed_at,
                        u.full_name AS doctor_name,
                        vs.systolic_bp, vs.diastolic_bp, vs.bp_stage, vs.pulse_rate, vs.temperature_f
                    FROM visits v
                    LEFT JOIN users u ON u.id = v.doctor_id
                    LEFT JOIN vital_signs vs ON vs.visit_id = v.id
                    WHERE v.patient_id = %s AND (v.id != %s OR %s IS NULL)
                    ORDER BY v.visit_date DESC, v.id DESC
                    LIMIT 10;
                """, (patient_id, active_visit_id, active_visit_id))
                past_visits = cur.fetchall()

                # 7. Past Prescriptions
                cur.execute("""
                    SELECT 
                        p.id AS prescription_id, p.visit_id, p.status, p.created_at,
                        COALESCE(df.brand_name, 'Medication') AS drug_name,
                        df.generic_name, pi.dosage, pi.frequency, pi.duration_days, pi.meal_timing, pi.special_instructions
                    FROM prescriptions p
                    JOIN prescription_items pi ON pi.prescription_id = p.id
                    LEFT JOIN drug_formulary df ON df.id = pi.drug_id
                    JOIN visits v ON v.id = p.visit_id
                    WHERE v.patient_id = %s
                    ORDER BY p.created_at DESC;
                """, (patient_id,))
                past_prescriptions = cur.fetchall()

                # 8. Active CDSS Insights
                active_insights = []
                if active_visit_id:
                    cur.execute("""
                        SELECT id, rule_code, severity_level, category, title, description, recommendation, is_reviewed, is_signed, doctor_override_notes
                        FROM deterministic_insights
                        WHERE visit_id = %s
                        ORDER BY FIELD(severity_level, 'CRITICAL', 'WARNING', 'INFO');
                    """, (active_visit_id,))
                    active_insights = cur.fetchall()

                return {
                    "patient": patient,
                    "active_visit": active_visit,
                    "vitals": active_vitals,
                    "questionnaire": active_questionnaire,
                    "reports": reports,
                    "past_visits": past_visits,
                    "past_prescriptions": past_prescriptions,
                    "insights": active_insights
                }
        finally:
            conn.close()

