from typing import Optional, List, Dict, Any
from app.core.database import get_connection

class PatientRepository:
    @staticmethod
    def get_today_token_count() -> int:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) as today_count FROM visits WHERE DATE(visit_date) = CURDATE();")
                row = cur.fetchone()
                return row["today_count"] if row else 0
        finally:
            conn.close()

    @staticmethod
    def count_matching_patients(search_term: Optional[str] = None) -> int:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                count_query = "SELECT COUNT(*) AS total FROM patients p"
                count_params = []
                if search_term:
                    count_query += """
                        WHERE p.first_name LIKE %s 
                           OR p.last_name LIKE %s 
                           OR p.phone LIKE %s 
                           OR p.uhid LIKE %s
                    """
                    term = f"%{search_term}%"
                    count_params.extend([term, term, term, term])
                cur.execute(count_query, count_params)
                row = cur.fetchone()
                return row["total"] if row else 0
        finally:
            conn.close()

    @staticmethod
    def fetch_patients_paginated(search_term: Optional[str], limit: int, offset: int) -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                query = """
                    SELECT 
                        p.id AS patient_id,
                        p.uhid,
                        p.first_name,
                        p.last_name,
                        CONCAT(p.first_name, ' ', p.last_name) AS full_name,
                        p.dob,
                        TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
                        p.gender,
                        p.blood_group,
                        p.phone,
                        p.email,
                        p.address,
                        p.emergency_contact,
                        p.insurance_type,
                        p.insurance_provider,
                        p.policy_number,
                        v.id AS visit_id,
                        v.queue_token,
                        v.status AS visit_status,
                        v.visit_date,
                        v.chief_complaint,
                        u_doc.full_name AS doctor_name,
                        u_doc.id AS doctor_id,
                        vt.id AS vital_id,
                        vt.systolic_bp,
                        vt.diastolic_bp,
                        vt.pulse_rate,
                        vt.temperature_f,
                        vt.resp_rate,
                        vt.spo2_pct,
                        vt.weight_kg,
                        vt.height_cm,
                        vt.bmi,
                        vt.bmi_category,
                        vt.bp_stage
                    FROM patients p
                    LEFT JOIN visits v ON v.id = (
                        SELECT id FROM visits WHERE patient_id = p.id ORDER BY visit_date DESC LIMIT 1
                    )
                    LEFT JOIN users u_doc ON u_doc.id = v.doctor_id
                    LEFT JOIN vital_signs vt ON vt.visit_id = v.id
                """
                params = []
                if search_term:
                    query += """
                        WHERE p.first_name LIKE %s 
                           OR p.last_name LIKE %s 
                           OR p.phone LIKE %s 
                           OR p.uhid LIKE %s
                    """
                    term = f"%{search_term}%"
                    params.extend([term, term, term, term])
                query += " ORDER BY v.visit_date DESC, p.created_at DESC LIMIT %s OFFSET %s;"
                params.extend([limit, offset])

                cur.execute(query, params)
                return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def get_patient_count_for_year(year: int) -> int:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) as total_patients FROM patients WHERE YEAR(created_at) = %s;", (year,))
                row = cur.fetchone()
                return row["total_patients"] if row else 0
        finally:
            conn.close()

    @staticmethod
    def insert_patient(uhid, first_name, last_name, dob, gender, blood_group, phone, email, address, emergency_contact, insurance_type, insurance_provider, policy_number) -> int:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO patients (
                        uhid, first_name, last_name, dob, gender, blood_group, 
                        phone, email, address, emergency_contact,
                        insurance_type, insurance_provider, policy_number
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, (
                    uhid, first_name, last_name, dob, gender, blood_group,
                    phone, email, address, emergency_contact,
                    insurance_type, insurance_provider, policy_number
                ))
                return cur.lastrowid
        finally:
            conn.close()

    @staticmethod
    def insert_visit(patient_id: int, doctor_id: int, receptionist_id: int, queue_token: str, chief_complaint: Optional[str]) -> int:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO visits (patient_id, doctor_id, receptionist_id, queue_token, status, chief_complaint)
                    VALUES (%s, %s, %s, %s, 'TRIAGED', %s);
                """, (patient_id, doctor_id, receptionist_id, queue_token, chief_complaint))
                return cur.lastrowid
        finally:
            conn.close()

    @staticmethod
    def insert_vitals(visit_id: int, sys_bp, dia_bp, pulse, temp, resp, spo2, weight, height, bmi, bmi_category, bp_stage) -> int:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO vital_signs (
                        visit_id, systolic_bp, diastolic_bp, pulse_rate, temperature_f,
                        resp_rate, spo2_pct, weight_kg, height_cm, bmi, bmi_category, bp_stage
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, (
                    visit_id, sys_bp, dia_bp, pulse, temp,
                    resp, spo2, weight, height, bmi, bmi_category, bp_stage
                ))
                return cur.lastrowid
        finally:
            conn.close()

    @staticmethod
    def get_visit_by_id(visit_id: int) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM visits WHERE id = %s;", (visit_id,))
                return cur.fetchone()
        finally:
            conn.close()

    @staticmethod
    def get_patient_by_id(patient_id: int) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM patients WHERE id = %s;", (patient_id,))
                return cur.fetchone()
        finally:
            conn.close()
