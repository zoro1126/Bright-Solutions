from typing import Optional, List, Dict, Any
from app.core.database import get_connection

class FormularyRepository:
    @staticmethod
    def search_drugs(q: Optional[str] = None, dosage_form: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                query = """
                    SELECT id, brand_name, generic_name, dosage_form, strength, standard_dosage, contraindications, is_active
                    FROM drug_formulary
                    WHERE is_active = 1
                """
                params = []
                if q and q.strip():
                    clean_q = f"%{q.strip()}%"
                    query += " AND (brand_name LIKE %s OR generic_name LIKE %s)"
                    params.extend([clean_q, clean_q])
                if dosage_form and dosage_form.strip():
                    query += " AND dosage_form = %s"
                    params.append(dosage_form.strip().upper())

                query += " ORDER BY brand_name ASC LIMIT %s;"
                params.append(limit)

                cur.execute(query, tuple(params))
                return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def get_drug_by_id(drug_id: int) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, brand_name, generic_name, dosage_form, strength FROM drug_formulary WHERE id = %s;",
                    (drug_id,)
                )
                return cur.fetchone()
        finally:
            conn.close()

    @staticmethod
    def get_prescription_by_visit_id(visit_id: int) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT p.id, p.visit_id, p.doctor_id, u.full_name AS doctor_name, 
                           p.issue_date, p.general_instructions, p.status, p.created_at, p.updated_at
                    FROM prescriptions p
                    LEFT JOIN users u ON u.id = p.doctor_id
                    WHERE p.visit_id = %s;
                """, (visit_id,))
                rx = cur.fetchone()
                if rx:
                    if rx.get("issue_date") and hasattr(rx["issue_date"], "isoformat"):
                        rx["issue_date"] = rx["issue_date"].isoformat()
                    if rx.get("created_at") and hasattr(rx["created_at"], "isoformat"):
                        rx["created_at"] = rx["created_at"].isoformat()
                    if rx.get("updated_at") and hasattr(rx["updated_at"], "isoformat"):
                        rx["updated_at"] = rx["updated_at"].isoformat()
                return rx
        finally:
            conn.close()

    @staticmethod
    def upsert_prescription(visit_id: int, doctor_id: int, general_instructions: Optional[str], status: str) -> int:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM prescriptions WHERE visit_id = %s;", (visit_id,))
                existing = cur.fetchone()
                if existing:
                    rx_id = existing["id"]
                    cur.execute("""
                        UPDATE prescriptions 
                        SET doctor_id = %s, general_instructions = %s, status = %s, updated_at = NOW()
                        WHERE id = %s;
                    """, (doctor_id, general_instructions, status, rx_id))
                    cur.execute("DELETE FROM prescription_items WHERE prescription_id = %s;", (rx_id,))
                    return rx_id
                else:
                    cur.execute("""
                        INSERT INTO prescriptions (visit_id, doctor_id, general_instructions, status)
                        VALUES (%s, %s, %s, %s);
                    """, (visit_id, doctor_id, general_instructions, status))
                    return cur.lastrowid
        finally:
            conn.close()

    @staticmethod
    def insert_prescription_item(
        prescription_id: int,
        drug_id: int,
        dosage: str,
        frequency: str,
        duration_days: int,
        meal_timing: str,
        special_instructions: Optional[str]
    ) -> int:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO prescription_items 
                    (prescription_id, drug_id, dosage, frequency, duration_days, meal_timing, special_instructions)
                    VALUES (%s, %s, %s, %s, %s, %s, %s);
                """, (
                    prescription_id,
                    drug_id,
                    dosage,
                    frequency,
                    duration_days,
                    meal_timing,
                    special_instructions
                ))
                return cur.lastrowid
        finally:
            conn.close()

    @staticmethod
    def get_prescription_items(prescription_id: int) -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT pi.id AS item_id, pi.drug_id, df.brand_name, df.generic_name, 
                           df.dosage_form, df.strength, pi.dosage, pi.frequency, 
                           pi.duration_days, pi.meal_timing, pi.special_instructions, pi.created_at
                    FROM prescription_items pi
                    JOIN drug_formulary df ON df.id = pi.drug_id
                    WHERE pi.prescription_id = %s
                    ORDER BY pi.id ASC;
                """, (prescription_id,))
                items = cur.fetchall()
                for item in items:
                    if item.get("created_at") and hasattr(item["created_at"], "isoformat"):
                        item["created_at"] = item["created_at"].isoformat()
                return items
        finally:
            conn.close()
