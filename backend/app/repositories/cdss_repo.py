from typing import Optional, List, Dict, Any
from app.core.database import get_connection

class CDSSRepository:
    @staticmethod
    def get_vitals_by_visit_id(visit_id: int) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM vital_signs WHERE visit_id = %s;", (visit_id,))
                return cur.fetchone()
        finally:
            conn.close()

    @staticmethod
    def get_insights_by_visit_id(visit_id: int) -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, visit_id, rule_code, severity_level, category, title, description, recommendation,
                           is_reviewed, is_signed, doctor_override_notes, created_at
                    FROM deterministic_insights
                    WHERE visit_id = %s
                    ORDER BY FIELD(severity_level, 'CRITICAL', 'WARNING', 'INFO'), id ASC;
                """, (visit_id,))
                rows = cur.fetchall()
                for r in rows:
                    if r.get("created_at") and hasattr(r["created_at"], "isoformat"):
                        r["created_at"] = r["created_at"].isoformat()
                return rows
        finally:
            conn.close()

    @staticmethod
    def sync_insights(visit_id: int, rules: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT rule_code, is_reviewed, is_signed, doctor_override_notes 
                    FROM deterministic_insights 
                    WHERE visit_id = %s;
                """, (visit_id,))
                existing_map = {row["rule_code"]: row for row in cur.fetchall()}
                active_rule_codes = {r["rule_code"] for r in rules}

                # Delete obsolete rules
                if existing_map:
                    for old_code in existing_map:
                        if old_code not in active_rule_codes:
                            cur.execute(
                                "DELETE FROM deterministic_insights WHERE visit_id = %s AND rule_code = %s;",
                                (visit_id, old_code)
                            )

                # Upsert evaluated rules
                for r in rules:
                    code = r["rule_code"]
                    if code in existing_map:
                        cur.execute("""
                            UPDATE deterministic_insights
                            SET severity_level = %s, title = %s, description = %s, recommendation = %s
                            WHERE visit_id = %s AND rule_code = %s;
                        """, (r["severity_level"], r["title"], r["description"], r["recommendation"], visit_id, code))
                    else:
                        cur.execute("""
                            INSERT INTO deterministic_insights
                            (visit_id, rule_code, severity_level, category, title, description, recommendation)
                            VALUES (%s, %s, %s, %s, %s, %s, %s);
                        """, (visit_id, code, r["severity_level"], r["category"], r["title"], r["description"], r["recommendation"]))

                cur.execute("""
                    SELECT id, visit_id, rule_code, severity_level, category, title, description, recommendation,
                           is_reviewed, is_signed, doctor_override_notes, created_at
                    FROM deterministic_insights
                    WHERE visit_id = %s
                    ORDER BY FIELD(severity_level, 'CRITICAL', 'WARNING', 'INFO'), id ASC;
                """, (visit_id,))
                rows = cur.fetchall()
                for r in rows:
                    if r.get("created_at") and hasattr(r["created_at"], "isoformat"):
                        r["created_at"] = r["created_at"].isoformat()
                return rows
        finally:
            conn.close()

    @staticmethod
    def get_insight_by_id(insight_id: int) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, visit_id, rule_code, severity_level FROM deterministic_insights WHERE id = %s;",
                    (insight_id,)
                )
                return cur.fetchone()
        finally:
            conn.close()

    @staticmethod
    def update_insight_review(insight_id: int, is_reviewed: bool, doctor_override_notes: Optional[str]) -> bool:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE deterministic_insights
                    SET is_reviewed = %s, doctor_override_notes = %s
                    WHERE id = %s;
                """, (
                    1 if is_reviewed else 0,
                    doctor_override_notes.strip() if doctor_override_notes else None,
                    insight_id
                ))
                return cur.rowcount > 0
        finally:
            conn.close()

    @staticmethod
    def override_critical_alerts(visit_id: int, override_text: str):
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE deterministic_insights
                    SET is_reviewed = 1,
                        doctor_override_notes = %s
                    WHERE visit_id = %s 
                      AND severity_level = 'CRITICAL' 
                      AND (is_reviewed = 0 OR doctor_override_notes IS NULL OR doctor_override_notes = '');
                """, (override_text, visit_id))
        finally:
            conn.close()

    @staticmethod
    def sign_all_insights(visit_id: int):
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE deterministic_insights
                    SET is_signed = 1
                    WHERE visit_id = %s;
                """, (visit_id,))
        finally:
            conn.close()
