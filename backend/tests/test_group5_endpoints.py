import os
import sys
import unittest
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.database import get_connection

class TestGroup5Endpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                # 1. Insert test patient
                cur.execute("""
                    INSERT INTO patients (uhid, first_name, last_name, dob, gender, phone, email, insurance_provider, insurance_type, policy_number)
                    VALUES ('UHID-GRP5-TEST', 'Aarav', 'Sharma', '1982-04-10', 'MALE', '9876500001', 'aarav@example.com', 'Star Health', 'CASHLESS', 'POL-GRP5-101')
                    ON DUPLICATE KEY UPDATE first_name='Aarav';
                """)
                cur.execute("SELECT id FROM patients WHERE uhid = 'UHID-GRP5-TEST';")
                cls.patient_id = cur.fetchone()["id"]

                cur.execute("SELECT id FROM users WHERE role = 'DOCTOR' AND is_active = 1 LIMIT 1;")
                doc_row = cur.fetchone()
                cls.doctor_id = doc_row["id"] if doc_row else 16

                cur.execute("SELECT id FROM users WHERE role = 'RECEPTIONIST' AND is_active = 1 LIMIT 1;")
                rec_row = cur.fetchone()
                cls.receptionist_id = rec_row["id"] if rec_row else 17

                # 2. Insert test visit
                cur.execute("""
                    INSERT INTO visits (patient_id, doctor_id, receptionist_id, queue_token, status, chief_complaint)
                    VALUES (%s, %s, %s, 'Q-G5-01', 'TRIAGED', 'Severe morning throbbing headaches, high fever, and knee pain')
                    ON DUPLICATE KEY UPDATE status='TRIAGED';
                """, (cls.patient_id, cls.doctor_id, cls.receptionist_id))
                cls.visit_id = cur.lastrowid
                if cls.visit_id == 0:
                    cur.execute("SELECT id FROM visits WHERE queue_token = 'Q-G5-01';")
                    cls.visit_id = cur.fetchone()["id"]

                # 3. Insert baseline vitals (Stage 2 HTN + Fever)
                cur.execute("""
                    INSERT INTO vital_signs (visit_id, systolic_bp, diastolic_bp, pulse_rate, temperature_f, resp_rate, spo2_pct, weight_kg, height_cm, bmi, bp_stage)
                    VALUES (%s, 160, 100, 92, 101.8, 22, 97.0, 78.0, 172.0, 26.4, 'Stage 2 Hypertension')
                    ON DUPLICATE KEY UPDATE systolic_bp=160, diastolic_bp=100, temperature_f=101.8;
                """, (cls.visit_id,))

                # 4. Insert questionnaire with voice notes and PEG-3 / PHQ-2
                cur.execute("""
                    INSERT INTO intake_questionnaires (visit_id, patient_id, q4, q5, q6, q9, q10, q11, voice_notes)
                    VALUES (%s, %s, 1, 3, 2, 7, 6, 6, 'Patient denies chest pain and shortness of breath, reports severe headache for 5 days.')
                    ON DUPLICATE KEY UPDATE voice_notes='Patient denies chest pain and shortness of breath, reports severe headache for 5 days.';
                """, (cls.visit_id, cls.patient_id))
        finally:
            conn.close()

    @classmethod
    def tearDownClass(cls):
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                # Clean up test records
                cur.execute("DELETE FROM prescription_items WHERE prescription_id IN (SELECT id FROM prescriptions WHERE visit_id = %s);", (cls.visit_id,))
                cur.execute("DELETE FROM prescriptions WHERE visit_id = %s;", (cls.visit_id,))
                cur.execute("DELETE FROM deterministic_insights WHERE visit_id = %s;", (cls.visit_id,))
                cur.execute("DELETE FROM intake_questionnaires WHERE visit_id = %s;", (cls.visit_id,))
                cur.execute("DELETE FROM vital_signs WHERE visit_id = %s;", (cls.visit_id,))
                cur.execute("DELETE FROM visits WHERE id = %s;", (cls.visit_id,))
                cur.execute("DELETE FROM patients WHERE id = %s;", (cls.patient_id,))
        finally:
            conn.close()

    def test_01_doctor_queue(self):
        """GET /api/doctor/queue returns waiting encounters with triage summary"""
        res = self.client.get(f"/api/doctor/queue?doctor_id={self.doctor_id}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("queue", data)
        visit_tokens = [q["queue_token"] for q in data["queue"]]
        self.assertIn("Q-G5-01", visit_tokens)

    def test_02_call_patient(self):
        """POST /api/doctor/queue/{id}/call transitions encounter status to IN_CONSULTATION"""
        res = self.client.post(f"/api/doctor/queue/{self.visit_id}/call")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "IN_CONSULTATION")
        self.assertEqual(data["visit_id"], self.visit_id)

    def test_03_patient_dossier_with_nlp_summary(self):
        """GET /api/doctor/patients/{id}/dossier returns complete clinical history and NLP summary"""
        res = self.client.get(f"/api/doctor/patients/{self.patient_id}/dossier")
        self.assertEqual(res.status_code, 200)
        data = res.json()

        # Check Patient & Active Visit
        self.assertEqual(data["patient"]["full_name"], "Aarav Sharma")
        self.assertEqual(data["active_visit"]["id"], self.visit_id)
        self.assertEqual(data["active_visit"]["status"], "IN_CONSULTATION")

        # Check Vitals
        self.assertEqual(data["vitals"]["systolic_bp"], 160)
        self.assertEqual(data["vitals"]["bp_stage"], "Stage 2 Hypertension")

        # Check NLP Executive Consultation Narrative
        insights = data["insights"]
        self.assertIn("symptomSummary", insights)
        summary = insights["symptomSummary"]
        self.assertIn("denies chest pain", summary.lower())
        self.assertIn("shortness of breath", summary.lower())
        self.assertIn("headache", summary.lower())
        self.assertIn("penicillin", summary.lower())

        # Check pertinent negatives parsed
        self.assertIn("chest pain", insights["pertinentNegatives"])
        self.assertIn("shortness of breath", insights["pertinentNegatives"])

    def test_04_cdss_evaluate_and_review(self):
        """POST /api/doctor/visits/{id}/insights/evaluate and PATCH /api/doctor/insights/{id}"""
        res = self.client.post(f"/api/doctor/visits/{self.visit_id}/insights/evaluate")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["insights_count"] > 0)
        
        # Check rule codes generated (HTN Stage 2, Pyrexia)
        rule_codes = [i["rule_code"] for i in data["insights"]]
        self.assertTrue(any("HTN" in r for r in rule_codes))
        self.assertTrue(any("PYREXIA" in r for r in rule_codes))

        # Test reviewing an insight
        first_insight = data["insights"][0]
        insight_id = first_insight["id"]
        patch_res = self.client.patch(
            f"/api/doctor/insights/{insight_id}",
            json={"is_reviewed": True, "doctor_override_notes": "Reviewed and acknowledged."}
        )
        self.assertEqual(patch_res.status_code, 200)
        self.assertTrue(patch_res.json()["is_reviewed"])

    def test_05_search_doctor_formulary(self):
        """GET /api/doctor/formulary searches standard drugs"""
        res = self.client.get("/api/doctor/formulary?q=Telma")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["count"] > 0)
        self.assertTrue(any("Telma" in d["brand_name"] or "Telmisartan" in d["generic_name"] for d in data["drugs"]))

    def test_06_prescription_ddi_safety_check(self):
        """POST /api/doctor/visits/{id}/prescriptions/check-safety detects DDI conflicts and allergy alerts"""
        res_t = self.client.get("/api/doctor/formulary?q=Telma")
        telma_id = res_t.json()["drugs"][0]["id"]
        res_c = self.client.get("/api/doctor/formulary?q=Combiflam")
        combiflam_id = res_c.json()["drugs"][0]["id"]
        res_a = self.client.get("/api/doctor/formulary?q=Augmentin")
        augmentin_id = res_a.json()["drugs"][0]["id"]

        # Telmisartan + Combiflam (NSAID interaction) + Augmentin (Penicillin allergy alert)
        payload = [
            {"drug_id": telma_id, "frequency": "1-0-0", "dosage": "40mg"},
            {"drug_id": combiflam_id, "frequency": "1-0-1", "dosage": "400mg"},
            {"drug_id": augmentin_id, "frequency": "1-0-1", "dosage": "625mg"}
        ]
        res = self.client.post(f"/api/doctor/visits/{self.visit_id}/prescriptions/check-safety", json=payload)
        self.assertEqual(res.status_code, 200)
        safety = res.json()
        self.assertFalse(safety["is_safe"])
        self.assertTrue(safety["has_critical"])
        self.assertTrue(len(safety["allergy_alerts"]) > 0)
        self.assertTrue(len(safety["interactions"]) > 0)

    def test_07_create_prescription_and_sign_off(self):
        """POST /api/doctor/visits/{id}/prescriptions creates safe Rx and POST .../sign-off moves to READY_FOR_BILLING"""
        # 1. Create safe prescription with Amlodipine + Paracetamol
        res_amlo = self.client.get("/api/doctor/formulary?q=Amlokind")
        amlo_id = res_amlo.json()["drugs"][0]["id"]
        res_dolo = self.client.get("/api/doctor/formulary?q=Dolo")
        dolo_id = res_dolo.json()["drugs"][0]["id"]

        rx_payload = {
            "doctor_id": self.doctor_id,
            "general_instructions": "Take medicines with water after breakfast.",
            "status": "FINALIZED",
            "items": [
                {
                    "drug_id": amlo_id,
                    "dosage": "1 tablet (5mg)",
                    "frequency": "1-0-0",
                    "duration_days": 30,
                    "meal_timing": "AFTER_MEALS",
                    "special_instructions": "Check BP weekly."
                },
                {
                    "drug_id": dolo_id,
                    "dosage": "1 tablet (650mg)",
                    "frequency": "1-0-1",
                    "duration_days": 5,
                    "meal_timing": "AFTER_MEALS",
                    "special_instructions": "Take SOS for headache."
                }
            ]
        }
        res_rx = self.client.post(f"/api/doctor/visits/{self.visit_id}/prescriptions", json=rx_payload)
        self.assertEqual(res_rx.status_code, 201)
        rx_data = res_rx.json()
        self.assertEqual(rx_data["items_count"], 2)
        self.assertTrue(rx_data["safety_analysis"]["is_safe"])

        # 2. Get prescription
        res_get_rx = self.client.get(f"/api/doctor/visits/{self.visit_id}/prescriptions")
        self.assertEqual(res_get_rx.status_code, 200)
        self.assertEqual(res_get_rx.json()["items_count"], 2)

        # 3. Sign-off encounter
        signoff_payload = {
            "doctor_id": self.doctor_id,
            "diagnosis": "Essential Hypertension Stage 2 with Acute Viral Prodrome",
            "conclusion_notes": "Patient started on Amlodipine 5mg OD and symptomatic antipyretic. Advised low sodium diet.",
            "doctor_override_notes": "All alerts acknowledged."
        }
        res_sign = self.client.post(f"/api/doctor/visits/{self.visit_id}/sign-off", json=signoff_payload)
        self.assertEqual(res_sign.status_code, 200)
        sign_data = res_sign.json()
        self.assertEqual(sign_data["status"], "READY_FOR_BILLING")
        self.assertEqual(sign_data["next_station"], "CASHIER_BILLING_DESK")

if __name__ == "__main__":
    unittest.main()
