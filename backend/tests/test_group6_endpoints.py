import os
import sys
import unittest
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.database import get_connection

class TestGroup6Endpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                # 1. Insert test patient with private insurance
                cur.execute("""
                    INSERT INTO patients (uhid, first_name, last_name, dob, gender, phone, email, insurance_provider, insurance_type, policy_number)
                    VALUES ('UHID-GRP6-TEST', 'Pooja', 'Nair', '1990-07-22', 'FEMALE', '9876500006', 'pooja@example.com', 'HDFC ERGO', 'INSURANCE', 'POL-GRP6-202')
                    ON DUPLICATE KEY UPDATE first_name='Pooja';
                """)
                cur.execute("SELECT id FROM patients WHERE uhid = 'UHID-GRP6-TEST';")
                cls.patient_id = cur.fetchone()["id"]

                # 2. Insert test visit for Dr. Kulkarni in READY_FOR_BILLING
                cur.execute("""
                    INSERT INTO visits (patient_id, doctor_id, receptionist_id, queue_token, status, chief_complaint, conclusion_notes, conclusion_signed_at)
                    VALUES (%s, 2, 1, 'Q-G6-01', 'READY_FOR_BILLING', 'Persistent migraine and palpitations', 'Diagnosed with Migraine. Prescribed SOS analgesics.', NOW())
                    ON DUPLICATE KEY UPDATE status='READY_FOR_BILLING', queue_token='Q-G6-01';
                """, (cls.patient_id,))
                cls.visit_id = cur.lastrowid
                if cls.visit_id == 0:
                    cur.execute("SELECT id FROM visits WHERE queue_token = 'Q-G6-01';")
                    cls.visit_id = cur.fetchone()["id"]

                # 3. Add an external diagnostic scan (e.g. ECG scan tariff ₹150)
                cur.execute("""
                    INSERT INTO external_reports (visit_id, patient_id, report_type, modality, file_path, file_size_mb)
                    VALUES (%s, %s, 'ECG', '12-Lead ECG Strip', '/uploads/test_ecg.pdf', 0.24);
                """, (cls.visit_id, cls.patient_id))

                # 4. Create a prescription with 2 line items (2 x ₹60 = ₹120)
                cur.execute("""
                    INSERT INTO prescriptions (visit_id, doctor_id, general_instructions, status)
                    VALUES (%s, 2, 'Take medications as directed after meals.', 'FINALIZED');
                """, (cls.visit_id,))
                cls.rx_id = cur.lastrowid

                # Pick 2 formulary drugs
                cur.execute("SELECT id FROM drug_formulary LIMIT 2;")
                drugs = cur.fetchall()
                cls.drug1_id = drugs[0]["id"]
                cls.drug2_id = drugs[1]["id"]

                cur.execute("""
                    INSERT INTO prescription_items (prescription_id, drug_id, dosage, frequency, duration_days, meal_timing)
                    VALUES 
                    (%s, %s, '500mg', '1-0-1', 5, 'AFTER_MEALS'),
                    (%s, %s, '10mg', '0-0-1', 10, 'AFTER_MEALS');
                """, (cls.rx_id, cls.drug1_id, cls.rx_id, cls.drug2_id))
        finally:
            conn.close()

    @classmethod
    def tearDownClass(cls):
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                # Clean up test records cascade by patient_id
                cur.execute("DELETE FROM payments WHERE bill_id IN (SELECT id FROM bills WHERE visit_id IN (SELECT id FROM visits WHERE patient_id = %s));", (cls.patient_id,))
                cur.execute("DELETE FROM bill_items WHERE bill_id IN (SELECT id FROM bills WHERE visit_id IN (SELECT id FROM visits WHERE patient_id = %s));", (cls.patient_id,))
                cur.execute("DELETE FROM bills WHERE visit_id IN (SELECT id FROM visits WHERE patient_id = %s);", (cls.patient_id,))
                cur.execute("DELETE FROM prescription_items WHERE prescription_id IN (SELECT id FROM prescriptions WHERE visit_id IN (SELECT id FROM visits WHERE patient_id = %s));", (cls.patient_id,))
                cur.execute("DELETE FROM prescriptions WHERE visit_id IN (SELECT id FROM visits WHERE patient_id = %s);", (cls.patient_id,))
                cur.execute("DELETE FROM external_reports WHERE patient_id = %s;", (cls.patient_id,))
                cur.execute("DELETE FROM visits WHERE patient_id = %s;", (cls.patient_id,))
                cur.execute("DELETE FROM patients WHERE id = %s;", (cls.patient_id,))
        finally:
            conn.close()

    def test_01_cashier_queue(self):
        """GET /api/cashier/queue lists encounters in READY_FOR_BILLING status"""
        res = self.client.get("/api/cashier/queue")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("billing_queue", data)
        self.assertTrue(data["pending_invoices_count"] > 0)
        tokens = [item["queue_token"] for item in data["billing_queue"]]
        self.assertIn("Q-G6-01", tokens)

    def test_02_get_itemized_bill(self):
        """GET /api/cashier/bills/{visit_id} auto-aggregates consultation, diagnostic, and pharmacy items"""
        res = self.client.get(f"/api/cashier/bills/{self.visit_id}")
        self.assertEqual(res.status_code, 200)
        bill = res.json()
        
        # Verify demographics & status
        self.assertEqual(bill["visit_id"], self.visit_id)
        self.assertEqual(bill["uhid"], "UHID-GRP6-TEST")
        self.assertEqual(bill["patient_name"], "Pooja Nair")
        self.assertEqual(bill["bill_status"], "PENDING")

        # Verify line items:
        # 1. Consultation (500)
        # 2. Diagnostic ECG (150)
        # 3. 2 Prescriptions (60 + 60 = 120)
        # Gross = 500 + 150 + 120 = 770
        self.assertEqual(bill["subtotal"], 770.0)
        # Private insurance copay (80% of 770 = 616.0)
        self.assertEqual(bill["insurance_copay_deduction"], 616.0)
        # Net payable = 770 - 616 = 154.0
        self.assertEqual(bill["net_payable"], 154.0)
        self.assertEqual(bill["patient_payable"], 154.0)

        # Store bill_id for subsequent payment tests
        TestGroup6Endpoints.generated_bill_id = bill["bill_id"]

    def test_03_bill_endpoint_alias(self):
        """GET /api/bills/visit/{visit_id} produces identical invoice response"""
        res = self.client.get(f"/api/bills/visit/{self.visit_id}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["bill_id"], self.generated_bill_id)
        self.assertEqual(data["net_payable"], 154.0)

    def test_04_process_payment_and_close_encounter(self):
        """POST /api/bills/{bill_id}/payments records payment, closes visit, and issues receipt number"""
        bill_id = self.generated_bill_id
        pay_payload = {
            "payment_mode": "UPI",
            "amount_paid": 154.0,
            "transaction_reference": "UPI-G6-TEST-778899",
            "cashier_id": 1,
            "notes": "Payment received via PhonePe QR"
        }
        res = self.client.post(f"/api/bills/{bill_id}/payments", json=pay_payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["bill_id"], bill_id)
        self.assertEqual(data["visit_status"], "COMPLETED")
        self.assertEqual(data["paid_amount"], 154.0)
        self.assertEqual(data["payment_mode"], "UPI")
        self.assertTrue(data["receipt_number"].startswith(f"REC-2026-"))
        self.assertEqual(data["receipt_pdf_url"], f"/api/bills/{bill_id}/receipt")

        # Verify visit status is COMPLETED in DB
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT status FROM visits WHERE id = %s;", (self.visit_id,))
                row = cur.fetchone()
                self.assertEqual(row["status"], "COMPLETED")
        finally:
            conn.close()

    def test_05_prevent_duplicate_payment(self):
        """POST /api/bills/{bill_id}/payments rejects double payment for already settled invoice"""
        bill_id = self.generated_bill_id
        pay_payload = {
            "payment_mode": "CASH",
            "amount_paid": 154.0
        }
        res = self.client.post(f"/api/bills/{bill_id}/payments", json=pay_payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn("already settled", res.json()["detail"].lower())

    def test_06_get_receipt_json(self):
        """GET /api/bills/{bill_id}/receipt returns complete financial and clinic receipt breakdown"""
        bill_id = self.generated_bill_id
        res = self.client.get(f"/api/bills/{bill_id}/receipt")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["receipt_number"], f"REC-2026-{bill_id:05d}")
        self.assertEqual(data["payment_status"], "PAID")
        self.assertEqual(data["patient"]["name"], "Pooja Nair")
        self.assertEqual(data["financials"]["subtotal"], 770.0)
        self.assertEqual(data["financials"]["net_payable"], 154.0)
        self.assertEqual(data["financials"]["balance_due"], 0.0)
        self.assertEqual(data["payment_details"]["mode"], "UPI")
        self.assertEqual(data["payment_details"]["transaction_ref"], "UPI-G6-TEST-778899")

    def test_07_get_receipt_html(self):
        """GET /api/bills/{bill_id}/receipt?format=html returns printable HTML invoice"""
        bill_id = self.generated_bill_id
        res = self.client.get(f"/api/bills/{bill_id}/receipt?format=html")
        self.assertEqual(res.status_code, 200)
        self.assertIn("text/html", res.headers.get("content-type", ""))
        html = res.text
        self.assertIn("OPD Cash Receipt", html)
        self.assertIn(f"REC-2026-{bill_id:05d}", html)
        self.assertIn("Pooja Nair", html)
        self.assertIn("Bright Solutions Hospital & Clinics", html)

if __name__ == "__main__":
    unittest.main()
