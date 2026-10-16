from typing import Optional, Dict, Any
from app.core.database import get_connection

NAMED_KEY_TO_Q_SLOT = {
    "triage_urgency": "q1",
    "pain_site": "q2",
    "symptom_duration": "q3",
    "allergy_status": "q4",
    "phq2_1": "q5",
    "phq2_2": "q6",
    "gad2_1": "q7",
    "gad2_2": "q8",
    "peg_pain": "q9",
    "peg_enjoyment": "q10",
    "peg_activity": "q11",
    "chronic_comorbidity": "q14",
    "red_flag_check": "q15",
    "immunization_status": "q16",
}

class QuestionnaireRepository:
    @staticmethod
    def upsert_questionnaire(visit_id: int, patient_id: int, answers: Dict[str, Optional[int]], voice_notes: Optional[str]) -> Dict[str, Any]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                normalized_answers = dict(answers or {})
                for named_key, q_key in NAMED_KEY_TO_Q_SLOT.items():
                    if named_key in normalized_answers and q_key not in normalized_answers:
                        normalized_answers[q_key] = normalized_answers[named_key]

                valid_keys = [f"q{i}" for i in range(1, 21)]
                filtered_answers = {
                    k: normalized_answers[k] for k in valid_keys if k in normalized_answers and normalized_answers[k] is not None
                }

                cols = ["visit_id", "patient_id", "voice_notes"] + valid_keys
                vals = [visit_id, patient_id, voice_notes] + [filtered_answers.get(k) for k in valid_keys]
                
                update_clauses = ["patient_id = VALUES(patient_id)", "voice_notes = VALUES(voice_notes)"]
                for k in valid_keys:
                    update_clauses.append(f"{k} = VALUES({k})")

                placeholders = ", ".join(["%s"] * len(cols))
                update_str = ", ".join(update_clauses)
                
                upsert_query = f"""
                    INSERT INTO intake_questionnaires ({", ".join(cols)})
                    VALUES ({placeholders})
                    ON DUPLICATE KEY UPDATE {update_str};
                """
                cur.execute(upsert_query, vals)

                cur.execute("SELECT id, updated_at, created_at FROM intake_questionnaires WHERE visit_id = %s;", (visit_id,))
                row = cur.fetchone()
                return {
                    "id": row["id"] if row else cur.lastrowid,
                    "updated_at": row["updated_at"] if row and row.get("updated_at") else (row.get("created_at") if row else None),
                    "recorded_answers": filtered_answers
                }
        finally:
            conn.close()

    @staticmethod
    def get_by_visit_id(visit_id: int) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM intake_questionnaires WHERE visit_id = %s;", (visit_id,))
                return cur.fetchone()
        finally:
            conn.close()

    @staticmethod
    def get_visit_clinical_context(visit_id: int) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        v.id AS visit_id,
                        v.patient_id,
                        v.doctor_id,
                        v.status AS visit_status,
                        v.chief_complaint,
                        p.uhid,
                        p.first_name,
                        p.last_name,
                        p.dob,
                        TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
                        p.gender,
                        p.emergency_contact,
                        vt.systolic_bp,
                        vt.diastolic_bp,
                        vt.pulse_rate,
                        vt.temperature_f,
                        vt.resp_rate,
                        vt.spo2_pct,
                        vt.weight_kg,
                        vt.height_cm,
                        vt.bmi,
                        vt.bp_stage
                    FROM visits v
                    JOIN patients p ON p.id = v.patient_id
                    LEFT JOIN vital_signs vt ON vt.visit_id = v.id
                    WHERE v.id = %s;
                """, (visit_id,))
                return cur.fetchone()
        finally:
            conn.close()

    @staticmethod
    def get_candidate_medications_by_disease_codes(disease_codes: list[str]) -> list[Dict[str, Any]]:
        if not disease_codes:
            return []
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                placeholders = ", ".join(["%s"] * len(disease_codes))
                query = f"""
                    SELECT 
                        cdi.disease_code,
                        cdi.icd10_code,
                        cdi.disease_name,
                        cdi.line_of_treatment,
                        cdi.allergy_trigger_class,
                        cdi.organ_risk_flags,
                        gd.id AS generic_drug_id,
                        gd.inn_name,
                        gd.strength,
                        gd.dosage_form,
                        gd.atc_code,
                        gd.rxcui,
                        gd.standard_schedule,
                        gd.contraindication_summary,
                        (SELECT GROUP_CONCAT(btp.brand_name SEPARATOR ', ') 
                         FROM brand_trade_products btp 
                         WHERE btp.generic_drug_id = gd.id AND btp.is_in_stock = 1) AS available_brands
                    FROM clinical_disease_indications cdi
                    JOIN standard_generic_drugs gd ON gd.id = cdi.generic_drug_id
                    WHERE cdi.disease_code IN ({placeholders})
                    ORDER BY cdi.disease_code, FIELD(cdi.line_of_treatment, 'FIRST_LINE', 'SECOND_LINE', 'SYMPTOMATIC', 'ADJUNCT');
                """
                cur.execute(query, disease_codes)
                return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def update_visit_status(visit_id: int, new_status: str) -> None:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("UPDATE visits SET status = %s WHERE id = %s;", (new_status, visit_id))
        finally:
            conn.close()
