from typing import Optional, List, Dict, Any
from datetime import datetime
from app.core.database import get_connection

class BillingRepository:
    @staticmethod
    def get_cashier_queue() -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        v.id AS visit_id,
                        v.queue_token,
                        p.uhid,
                        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
                        u.full_name AS doctor_name,
                        p.insurance_type AS insurance_category,
                        v.conclusion_signed_at AS ready_since
                    FROM visits v
                    JOIN patients p ON p.id = v.patient_id
                    LEFT JOIN users u ON u.id = v.doctor_id
                    WHERE v.status = 'READY_FOR_BILLING'
                    ORDER BY v.conclusion_signed_at ASC, v.id ASC;
                """)
                return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def get_bill_by_visit_id(visit_id: int) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM bills WHERE visit_id = %s;", (visit_id,))
                return cur.fetchone()
        finally:
            conn.close()

    @staticmethod
    def get_bill_by_id(bill_id: int) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM bills WHERE id = %s;", (bill_id,))
                return cur.fetchone()
        finally:
            conn.close()

    @staticmethod
    def get_bill_items(bill_id: int) -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, service_code, item_type, description, unit_price, quantity, total_price
                    FROM bill_items
                    WHERE bill_id = %s
                    ORDER BY id ASC;
                """, (bill_id,))
                return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def create_bill(
        visit_id: int,
        gross_amount: float,
        discount_amount: float,
        insurance_covered: float,
        net_amount: float,
        line_items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO bills (visit_id, gross_amount, discount_amount, insurance_covered, net_amount, payment_status)
                    VALUES (%s, %s, %s, %s, %s, 'PENDING');
                """, (visit_id, gross_amount, discount_amount, insurance_covered, net_amount))
                bill_id = cur.lastrowid

                for li in line_items:
                    cur.execute("""
                        INSERT INTO bill_items (bill_id, service_code, item_type, description, unit_price, quantity, total_price)
                        VALUES (%s, %s, %s, %s, %s, %s, %s);
                    """, (
                        bill_id,
                        li["service_code"],
                        li["item_type"],
                        li["description"],
                        li["unit_price"],
                        li["quantity"],
                        li["total_price"]
                    ))

                cur.execute("SELECT * FROM bills WHERE id = %s;", (bill_id,))
                return cur.fetchone()
        finally:
            conn.close()

    @staticmethod
    def record_payment_and_close(
        bill_id: int,
        visit_id: int,
        cashier_id: int,
        payment_mode: str,
        transaction_ref: str,
        amount_paid: float,
        now_dt: datetime
    ) -> int:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                # 1. Insert into payments
                cur.execute("""
                    INSERT INTO payments (bill_id, payment_mode, transaction_ref, amount_paid, payment_status, payment_time)
                    VALUES (%s, %s, %s, %s, 'SUCCESS', %s);
                """, (bill_id, payment_mode, transaction_ref, amount_paid, now_dt))
                payment_id = cur.lastrowid

                # 2. Mark bill as PAID
                cur.execute("""
                    UPDATE bills 
                    SET payment_status = 'PAID', cashier_id = %s, updated_at = %s
                    WHERE id = %s;
                """, (cashier_id, now_dt, bill_id))

                # 3. Transition visit to COMPLETED
                cur.execute("""
                    UPDATE visits 
                    SET status = 'COMPLETED', updated_at = %s
                    WHERE id = %s;
                """, (now_dt, visit_id))

                return payment_id
        finally:
            conn.close()

    @staticmethod
    def get_external_reports_for_billing(visit_id: int) -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT id, report_type, modality FROM external_reports WHERE visit_id = %s;", (visit_id,))
                return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def get_prescribed_drugs_for_billing(visit_id: int) -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT pi.id, pi.dosage, pi.duration_days, df.brand_name, df.strength, df.dosage_form
                    FROM prescription_items pi
                    JOIN prescriptions p ON p.id = pi.prescription_id
                    JOIN drug_formulary df ON df.id = pi.drug_id
                    WHERE p.visit_id = %s;
                """, (visit_id,))
                return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def get_payment_by_bill_id(bill_id: int) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, bill_id, payment_mode, transaction_ref, amount_paid, payment_status, payment_time, created_at
                    FROM payments
                    WHERE bill_id = %s
                    ORDER BY id DESC
                    LIMIT 1;
                """, (bill_id,))
                return cur.fetchone()
        finally:
            conn.close()

    @staticmethod
    def get_user_info(user_id: int) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT id, username, full_name, role FROM users WHERE id = %s;", (user_id,))
                return cur.fetchone()
        finally:
            conn.close()

