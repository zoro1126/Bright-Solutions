from typing import Optional, Dict, Any
from app.core.database import get_connection

class QuestionnaireRepository:
    @staticmethod
    def upsert_questionnaire(visit_id: int, patient_id: int, answers: Dict[str, Optional[int]], voice_notes: Optional[str]) -> Dict[str, Any]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                valid_keys = [f"q{i}" for i in range(1, 21)]
                filtered_answers = {
                    k: answers[k] for k in valid_keys if k in answers and answers[k] is not None
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
