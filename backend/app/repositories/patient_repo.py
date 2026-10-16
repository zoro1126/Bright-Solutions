from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
import pymysql
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
    def get_next_available_token() -> str:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT MAX(CAST(SUBSTRING(queue_token, 3) AS UNSIGNED)) as max_token
                    FROM visits
                    WHERE DATE(visit_date) = CURDATE() AND queue_token LIKE 'Q-%';
                """)
                row = cur.fetchone()
                max_tok = row["max_token"] if row and row["max_token"] is not None else 100
                next_num = max(101, max_tok + 1)
                return f"Q-{next_num}"
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
                           OR CONCAT(p.first_name, ' ', p.last_name) LIKE %s
                           OR p.phone LIKE %s 
                           OR p.uhid LIKE %s
                    """
                    term = f"%{search_term}%"
                    count_params.extend([term, term, term, term, term])
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
                           OR CONCAT(p.first_name, ' ', p.last_name) LIKE %s
                           OR p.phone LIKE %s 
                           OR p.uhid LIKE %s
                    """
                    term = f"%{search_term}%"
                    params.extend([term, term, term, term, term])
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

    @staticmethod
    def get_active_doctor_queue_loads() -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                query = """
                    SELECT 
                        u.id AS doctor_id,
                        u.full_name AS doctor_name,
                        COUNT(CASE WHEN v.status NOT IN ('COMPLETED', 'CANCELLED', 'READY_FOR_BILLING') THEN v.id ELSE NULL END) AS active_load
                    FROM users u
                    LEFT JOIN visits v ON v.doctor_id = u.id AND DATE(v.visit_date) = CURDATE()
                    WHERE u.role = 'DOCTOR' AND u.is_active = 1
                    GROUP BY u.id, u.full_name
                    ORDER BY active_load ASC, u.id ASC;
                """
                cur.execute(query)
                return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def get_receptionist_queue_records(search_term: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                query = """
                    SELECT 
                        v.id AS visit_id,
                        v.patient_id,
                        v.queue_token,
                        v.status AS visit_status,
                        v.visit_date,
                        v.chief_complaint,
                        p.uhid,
                        p.first_name,
                        p.last_name,
                        CONCAT(p.first_name, ' ', p.last_name) AS full_name,
                        p.dob,
                        TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
                        p.gender,
                        p.phone,
                        p.address,
                        p.emergency_contact,
                        p.insurance_type,
                        p.insurance_provider,
                        p.policy_number,
                        u_doc.id AS doctor_id,
                        u_doc.full_name AS doctor_name,
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
                        vt.bp_stage,
                        (SELECT COUNT(*) FROM intake_questionnaires iq WHERE iq.visit_id = v.id) AS questionnaire_count,
                        (SELECT COUNT(*) FROM deterministic_insights di WHERE di.visit_id = v.id) AS insight_count
                    FROM visits v
                    JOIN patients p ON p.id = v.patient_id
                    LEFT JOIN users u_doc ON u_doc.id = v.doctor_id
                    LEFT JOIN vital_signs vt ON vt.visit_id = v.id
                """
                params = []
                where_clauses = ["(DATE(v.visit_date) = CURDATE() OR v.status NOT IN ('COMPLETED', 'CANCELLED'))"]

                if search_term:
                    where_clauses.append("""
                        (p.first_name LIKE %s 
                         OR p.last_name LIKE %s 
                         OR CONCAT(p.first_name, ' ', p.last_name) LIKE %s
                         OR p.phone LIKE %s 
                         OR p.uhid LIKE %s 
                         OR v.queue_token LIKE %s)
                    """)
                    t = f"%{search_term}%"
                    params.extend([t, t, t, t, t, t])

                query += " WHERE " + " AND ".join(where_clauses)
                query += " ORDER BY v.id ASC;"

                cur.execute(query, params)
                return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def get_patient_details(patient_id: int) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        p.*,
                        CONCAT(p.first_name, ' ', p.last_name) AS full_name,
                        TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age
                    FROM patients p WHERE p.id = %s;
                """, (patient_id,))
                patient = cur.fetchone()
                if not patient:
                    return None

                cur.execute("""
                    SELECT 
                        v.id AS visit_id,
                        v.queue_token,
                        v.status,
                        v.visit_date,
                        v.chief_complaint,
                        v.conclusion_notes,
                        v.conclusion_signed_at,
                        u_doc.id AS doctor_id,
                        u_doc.full_name AS doctor_name,
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
                        vt.bp_stage,
                        (SELECT COUNT(*) FROM intake_questionnaires iq WHERE iq.visit_id = v.id) AS questionnaire_count,
                        (SELECT COUNT(*) FROM deterministic_insights di WHERE di.visit_id = v.id) AS insight_count
                    FROM visits v
                    LEFT JOIN users u_doc ON u_doc.id = v.doctor_id
                    LEFT JOIN vital_signs vt ON vt.visit_id = v.id
                    WHERE v.patient_id = %s
                    ORDER BY v.visit_date DESC, v.id DESC;
                """, (patient_id,))
                visits = cur.fetchall()

                latest_visit_id = visits[0]["visit_id"] if visits else None
                questionnaire = None
                if latest_visit_id:
                    cur.execute("SELECT * FROM intake_questionnaires WHERE visit_id = %s LIMIT 1;", (latest_visit_id,))
                    questionnaire = cur.fetchone()

                return {
                    "patient": patient,
                    "visits": visits,
                    "latest_questionnaire": questionnaire
                }
        finally:
            conn.close()

    @staticmethod
    def register_patient_atomic(
        patient_data: Dict[str, Any],
        visit_data: Dict[str, Any],
        vitals_data: Optional[Dict[str, Any]] = None,
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """
        Executes patient registration, initial visit creation, and optional vitals insertion
        within a single ACID transaction. Handles concurrent UHID collisions via retries.
        """
        conn = get_connection()
        try:
            current_year = datetime.now().year
            for attempt in range(max_retries):
                try:
                    conn.begin()
                    with conn.cursor() as cur:
                        # 1. Determine next UHID sequence safely
                        cur.execute("""
                            SELECT MAX(CAST(SUBSTRING_INDEX(uhid, '-', -1) AS UNSIGNED)) as max_seq
                            FROM patients
                            WHERE uhid LIKE %s;
                        """, (f"UHID-{current_year}-%",))
                        seq_row = cur.fetchone()
                        max_seq = seq_row["max_seq"] if seq_row and seq_row["max_seq"] is not None else 0
                        uhid = f"UHID-{current_year}-{(max_seq + 1 + attempt):05d}"

                        # 2. Insert patient record
                        cur.execute("""
                            INSERT INTO patients (
                                uhid, first_name, last_name, dob, gender, blood_group, 
                                phone, email, address, emergency_contact,
                                insurance_type, insurance_provider, policy_number
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                        """, (
                            uhid,
                            patient_data["first_name"],
                            patient_data["last_name"],
                            patient_data["dob"],
                            patient_data["gender"],
                            patient_data["blood_group"],
                            patient_data["phone"],
                            patient_data.get("email"),
                            patient_data.get("address"),
                            patient_data.get("emergency_contact"),
                            patient_data["insurance_type"],
                            patient_data.get("insurance_provider"),
                            patient_data.get("policy_number")
                        ))
                        patient_id = cur.lastrowid

                        # 3. Determine next OPD queue token safely
                        cur.execute("""
                            SELECT MAX(CAST(SUBSTRING(queue_token, 3) AS UNSIGNED)) as max_token
                            FROM visits
                            WHERE DATE(visit_date) = CURDATE() AND queue_token LIKE 'Q-%';
                        """)
                        tok_row = cur.fetchone()
                        max_tok = tok_row["max_token"] if tok_row and tok_row["max_token"] is not None else 100
                        queue_token = f"Q-{max(101, max_tok + 1)}"

                        # 4. Insert visit encounter
                        cur.execute("""
                            INSERT INTO visits (patient_id, doctor_id, receptionist_id, queue_token, status, chief_complaint)
                            VALUES (%s, %s, %s, %s, 'TRIAGED', %s);
                        """, (
                            patient_id,
                            visit_data["doctor_id"],
                            visit_data["receptionist_id"],
                            queue_token,
                            visit_data.get("chief_complaint") or "Routine General OPD Consultation"
                        ))
                        visit_id = cur.lastrowid

                        # 5. Insert vital signs if provided
                        vital_id = None
                        if vitals_data:
                            cur.execute("""
                                INSERT INTO vital_signs (
                                    visit_id, systolic_bp, diastolic_bp, pulse_rate, temperature_f,
                                    resp_rate, spo2_pct, weight_kg, height_cm, bmi, bmi_category, bp_stage
                                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                            """, (
                                visit_id,
                                vitals_data.get("systolic_bp"),
                                vitals_data.get("diastolic_bp"),
                                vitals_data.get("pulse_rate"),
                                vitals_data.get("temperature_f"),
                                vitals_data.get("resp_rate"),
                                vitals_data.get("spo2_pct"),
                                vitals_data.get("weight_kg"),
                                vitals_data.get("height_cm"),
                                vitals_data.get("bmi"),
                                vitals_data.get("bmi_category"),
                                vitals_data.get("bp_stage")
                            ))
                            vital_id = cur.lastrowid

                    conn.commit()
                    return {
                        "patient_id": patient_id,
                        "visit_id": visit_id,
                        "vital_id": vital_id,
                        "uhid": uhid,
                        "queue_token": queue_token
                    }
                except pymysql.err.IntegrityError as ie:
                    conn.rollback()
                    if attempt < max_retries - 1 and "Duplicate entry" in str(ie):
                        continue
                    raise
                except Exception:
                    conn.rollback()
                    raise
        finally:
            conn.close()
