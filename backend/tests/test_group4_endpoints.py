import io
import os
import sys
import unittest
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.database import get_connection

class TestGroup4Endpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        # Create a dedicated test patient and visit to prevent test contamination
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                # 1. Insert test patient
                cur.execute("""
                    INSERT INTO patients (uhid, first_name, last_name, dob, gender, phone)
                    VALUES ('UHID-GRP4-TEST', 'TestGroup4', 'Patient', '1988-06-15', 'MALE', '9998887770')
                    ON DUPLICATE KEY UPDATE first_name='TestGroup4';
                """)
                cur.execute("SELECT id FROM patients WHERE uhid = 'UHID-GRP4-TEST';")
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
                    VALUES (%s, %s, %s, 'Q-G4-99', 'REGISTERED', 'High fever, sore throat and severe knee pain')
                    ON DUPLICATE KEY UPDATE status='REGISTERED';
                """, (cls.patient_id, cls.doctor_id, cls.receptionist_id))
                cls.visit_id = cur.lastrowid or 1
                if cur.lastrowid == 0:
                    cur.execute("SELECT id FROM visits WHERE queue_token = 'Q-G4-99';")
                    cls.visit_id = cur.fetchone()["id"]

                # 3. Insert baseline vitals for this visit
                cur.execute("""
                    INSERT INTO vital_signs (visit_id, systolic_bp, diastolic_bp, pulse_rate, temperature_f, resp_rate, spo2_pct, bmi)
                    VALUES (%s, 142, 92, 88, 101.5, 20, 98.0, 24.5)
                    ON DUPLICATE KEY UPDATE systolic_bp=142, diastolic_bp=92, temperature_f=101.5;
                """, (cls.visit_id,))
        finally:
            conn.close()

    @classmethod
    def tearDownClass(cls):
        # Clean up test records
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM external_reports WHERE visit_id = %s;", (cls.visit_id,))
                cur.execute("DELETE FROM intake_questionnaires WHERE visit_id = %s;", (cls.visit_id,))
                cur.execute("DELETE FROM vital_signs WHERE visit_id = %s;", (cls.visit_id,))
                cur.execute("DELETE FROM deterministic_insights WHERE visit_id = %s;", (cls.visit_id,))
                cur.execute("DELETE FROM visits WHERE id = %s;", (cls.visit_id,))
                cur.execute("DELETE FROM patients WHERE id = %s;", (cls.patient_id,))
        finally:
            conn.close()

    def test_01_questionnaire_not_found(self):
        """GET /api/visits/{id}/questionnaire on fresh visit should return 404"""
        res = self.client.get(f"/api/visits/{self.visit_id}/questionnaire")
        self.assertEqual(res.status_code, 404)
        self.assertIn("No questionnaire responses recorded", res.json()["detail"])

    def test_02_questionnaire_submit_deterministic_cdss(self):
        """POST /api/visits/{id}/questionnaire submits responses, evaluates scores, predicts conditions, checks safety"""
        payload = {
            "patient_id": self.patient_id,
            "answers": {
                "q1": 1,
                "q2": 0,
                "q4": 1,  # Penicillin allergy reported via MCQ
                "q5": 3,  # PHQ-2 item 1: nearly every day
                "q6": 2,  # PHQ-2 item 2: more than half days -> score 5 (Depression screen positive)
                "q7": 1,  # GAD-2 item 1: several days
                "q8": 2,  # GAD-2 item 2: more than half days -> score 3 (Anxiety screen positive)
                "q9": 6,  # PEG-3 pain intensity: 6
                "q10": 5, # PEG-3 enjoyment: 5
                "q11": 4, # PEG-3 activity: 4 -> average 5.0 (Significant pain)
                "q14": 5  # Chronic comorbidity: CKD / Kidney
            },
            "voice_notes": "Patient reports severe throat pain and depression for 3 weeks.",
            "allergies": ["Penicillin"],
            "comorbidities": ["CKD"]
        }
        res = self.client.post(f"/api/visits/{self.visit_id}/questionnaire", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        # Check structure
        self.assertEqual(data["visit_id"], self.visit_id)
        self.assertIn("clinical_scores", data)
        self.assertIn("predicted_conditions", data)
        self.assertIn("recommended_medications", data)

        # Check clinical scores
        scores = data["clinical_scores"]
        self.assertEqual(scores["phq2_score"], 5)
        self.assertTrue(scores["phq2_positive"])
        self.assertEqual(scores["gad2_score"], 3)
        self.assertTrue(scores["gad2_positive"])
        self.assertEqual(scores["peg3_average"], 5.0)
        self.assertTrue(scores["peg3_significant_pain"])
        self.assertIn("PENICILLIN", scores["reported_allergies"])
        self.assertIn("CKD", scores["reported_comorbidities"])

        # Check predicted conditions (HTN Stage 2 from vitals, Fever from temp 101.5, URI, Pain, Depression, Anxiety)
        cond_codes = [c["disease_code"] for c in data["predicted_conditions"]]
        self.assertIn("HYPERTENSION_STAGE2", cond_codes)
        self.assertIn("ACUTE_FEVER_PYREXIA", cond_codes)
        self.assertIn("MAJOR_DEPRESSION_SCREEN", cond_codes)
        self.assertIn("ANXIETY_DISORDER", cond_codes)
        self.assertIn("ACUTE_MUSCULOSKELETAL_PAIN", cond_codes)

        # Check medication safety filtering
        meds = data["recommended_medications"]
        self.assertTrue(len(meds) > 0)
        
        # Penicillin / Amoxicillin should be marked CONTRAINDICATED
        penicillin_meds = [m for m in meds if "AMOXICILLIN" in m["inn_name"].upper()]
        for p_med in penicillin_meds:
            self.assertEqual(p_med["safety_status"], "CONTRAINDICATED")
            self.assertFalse(p_med["is_recommended"])
            self.assertIn("allergy", p_med["safety_notes"].lower())

        # Ibuprofen should be marked CONTRAINDICATED due to CKD comorbidity
        ibuprofen_meds = [m for m in meds if "IBUPROFEN" in m["inn_name"].upper()]
        for ib_med in ibuprofen_meds:
            self.assertEqual(ib_med["safety_status"], "CONTRAINDICATED")
            self.assertFalse(ib_med["is_recommended"])
            self.assertIn("renal", ib_med["safety_notes"].lower())

        # Paracetamol should be CLEAR and recommended
        paracetamol_meds = [m for m in meds if "PARACETAMOL" in m["inn_name"].upper()]
        self.assertTrue(len(paracetamol_meds) > 0)
        for para in paracetamol_meds:
            self.assertEqual(para["safety_status"], "CLEAR")
            self.assertTrue(para["is_recommended"])

    def test_03_get_questionnaire(self):
        """GET /api/visits/{id}/questionnaire returns stored questionnaire with clinical scoring"""
        res = self.client.get(f"/api/visits/{self.visit_id}/questionnaire")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["visit_id"], self.visit_id)
        self.assertEqual(data["patient_id"], self.patient_id)
        self.assertEqual(data["answers"]["q5"], 3)
        self.assertEqual(data["clinical_scores"]["phq2_score"], 5)
        self.assertTrue(len(data["recommended_medications"]) > 0)

    def test_04_upload_report_validation(self):
        """POST /api/visits/{id}/reports/upload validates report_type and visit existence"""
        # Non-existent visit ID
        res = self.client.post(
            "/api/visits/999999/reports/upload",
            data={"report_type": "DICOM"},
            files={"file": ("dummy.dcm", b"DICM...", "application/dicom")}
        )
        self.assertEqual(res.status_code, 404)

        # Invalid report type
        res2 = self.client.post(
            f"/api/visits/{self.visit_id}/reports/upload",
            data={"report_type": "INVALID_SCAN_TYPE"},
            files={"file": ("dummy.dcm", b"DICM...", "application/dicom")}
        )
        self.assertEqual(res2.status_code, 400)
        self.assertIn("Invalid report_type", res2.json()["detail"])

    def test_05_upload_and_list_reports(self):
        """POST /api/visits/{id}/reports/upload and GET /api/visits/{id}/reports work for DICOM, ECG, and LAB_PDF"""
        # Upload DICOM
        dcm_data = b"DICOM_BINARY_STREAM_MAGIC_12345"
        res_dcm = self.client.post(
            f"/api/visits/{self.visit_id}/reports/upload",
            data={
                "report_type": "DICOM",
                "modality": "Knee MRI Coronal",
                "findings_summary": "Mild medial meniscus tear, no ligament rupture."
            },
            files={"file": ("knee_mri.dcm", io.BytesIO(dcm_data), "application/dicom")}
        )
        self.assertEqual(res_dcm.status_code, 201)
        dcm_json = res_dcm.json()
        self.assertEqual(dcm_json["report_type"], "DICOM")
        self.assertEqual(dcm_json["modality"], "Knee MRI Coronal")
        report_id_1 = dcm_json["report_id"]

        # Upload ECG
        ecg_data = b"ECG_12LEAD_TRACE_VECTOR_XYZ"
        res_ecg = self.client.post(
            f"/api/visits/{self.visit_id}/reports/upload",
            data={
                "report_type": "ECG",
                "modality": "12-Lead Resting ECG",
                "findings_summary": "Sinus rhythm, normal axis, no ST-T elevation."
            },
            files={"file": ("ecg_trace.pdf", io.BytesIO(ecg_data), "application/pdf")}
        )
        self.assertEqual(res_ecg.status_code, 201)
        ecg_json = res_ecg.json()
        self.assertEqual(ecg_json["report_type"], "ECG")
        report_id_2 = ecg_json["report_id"]

        # List reports
        res_list = self.client.get(f"/api/visits/{self.visit_id}/reports")
        self.assertEqual(res_list.status_code, 200)
        list_json = res_list.json()
        self.assertEqual(list_json["visit_id"], self.visit_id)
        self.assertEqual(list_json["count"], 2)
        self.assertEqual(len(list_json["reports"]), 2)

        # Get single report
        res_single = self.client.get(f"/api/visits/{self.visit_id}/reports/{report_id_1}")
        self.assertEqual(res_single.status_code, 200)
        self.assertEqual(res_single.json()["modality"], "Knee MRI Coronal")

        # Delete report
        res_del = self.client.delete(f"/api/visits/{self.visit_id}/reports/{report_id_1}")
        self.assertEqual(res_del.status_code, 200)

        # Verify count decreased to 1
        res_list_after = self.client.get(f"/api/visits/{self.visit_id}/reports")
        self.assertEqual(res_list_after.json()["count"], 1)

if __name__ == "__main__":
    unittest.main()
