import os
import sys
import unittest
from datetime import datetime, date
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.database import get_connection
from app.core.triage_engine import (
    calculate_news2_score,
    determine_triage_priority,
    estimate_wait_time_minutes
)
from app.services.patient_service import compute_bmi_and_category, compute_bp_stage
from app.core.cdss_engine import (
    score_questionnaire_responses,
    predict_conditions_from_context,
    filter_candidate_medications
)
from app.core.nlp_summarizer import ClinicalNLPParser, ClinicalNarrativeSynthesizer
from app.core.ddi_engine import DDIEngine
from app.repositories.analytics_repo import AnalyticsRepository

class TestAllPermutationsAndCombinations(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                # Resolve active staff IDs dynamically (no hardcoded IDs)
                cur.execute("SELECT id FROM users WHERE role = 'DOCTOR' AND is_active = 1 LIMIT 1;")
                doc_row = cur.fetchone()
                cls.doctor_id = doc_row["id"] if doc_row else 16

                cur.execute("SELECT id FROM users WHERE role = 'RECEPTIONIST' AND is_active = 1 LIMIT 1;")
                rec_row = cur.fetchone()
                cls.receptionist_id = rec_row["id"] if rec_row else 17

                cur.execute("SELECT id FROM users WHERE role = 'CASHIER' AND is_active = 1 LIMIT 1;")
                cash_row = cur.fetchone()
                cls.cashier_id = cash_row["id"] if cash_row else 18

                # Clean any prior permutation test records
                cur.execute("DELETE FROM visits WHERE queue_token LIKE 'Q-PERM-%';")
                cur.execute("DELETE FROM patients WHERE uhid LIKE 'UHID-PERM-%';")
        finally:
            conn.close()

    @classmethod
    def tearDownClass(cls):
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM payments WHERE bill_id IN (SELECT id FROM bills WHERE visit_id IN (SELECT id FROM visits WHERE queue_token LIKE 'Q-PERM-%'));")
                cur.execute("DELETE FROM bill_items WHERE bill_id IN (SELECT id FROM bills WHERE visit_id IN (SELECT id FROM visits WHERE queue_token LIKE 'Q-PERM-%'));")
                cur.execute("DELETE FROM bills WHERE visit_id IN (SELECT id FROM visits WHERE queue_token LIKE 'Q-PERM-%');")
                cur.execute("DELETE FROM prescription_items WHERE prescription_id IN (SELECT id FROM prescriptions WHERE visit_id IN (SELECT id FROM visits WHERE queue_token LIKE 'Q-PERM-%'));")
                cur.execute("DELETE FROM prescriptions WHERE visit_id IN (SELECT id FROM visits WHERE queue_token LIKE 'Q-PERM-%');")
                cur.execute("DELETE FROM deterministic_insights WHERE visit_id IN (SELECT id FROM visits WHERE queue_token LIKE 'Q-PERM-%');")
                cur.execute("DELETE FROM intake_questionnaires WHERE visit_id IN (SELECT id FROM visits WHERE queue_token LIKE 'Q-PERM-%');")
                cur.execute("DELETE FROM external_reports WHERE visit_id IN (SELECT id FROM visits WHERE queue_token LIKE 'Q-PERM-%');")
                cur.execute("DELETE FROM vital_signs WHERE visit_id IN (SELECT id FROM visits WHERE queue_token LIKE 'Q-PERM-%');")
                cur.execute("DELETE FROM visits WHERE queue_token LIKE 'Q-PERM-%';")
                cur.execute("DELETE FROM patients WHERE uhid LIKE 'UHID-PERM-%';")
        finally:
            conn.close()

    # ──────────────────────────────────────────────────────────────────────────
    # 1. MATHEMATICAL & CLINICAL SCORING ENGINE PERMUTATIONS (On-the-spot verified)
    # ──────────────────────────────────────────────────────────────────────────

    def test_01_blood_pressure_staging_permutations(self):
        """Permutations of systolic and diastolic BP correctly categorized without hardcoding"""
        cases = [
            (115, 75, "Normal Blood Pressure"),
            (125, 75, "Elevated BP"),
            (135, 85, "Stage 1 Hypertension"),
            (145, 95, "Stage 2 Hypertension"),
            (185, 110, "Hypertensive Crisis"),
            (150, 125, "Hypertensive Crisis"),
            (None, 80, None),
            (120, None, None)
        ]
        for sbp, dbp, expected in cases:
            with self.subTest(sbp=sbp, dbp=dbp):
                stage = compute_bp_stage(sbp, dbp)
                self.assertEqual(stage, expected)

    def test_02_bmi_calculation_and_category_permutations(self):
        """BMI mathematical formula weight / (height/100)^2 accurately categorizes all adult ranges"""
        cases = [
            (45.0, 170.0, 15.6, "Underweight"),
            (65.0, 170.0, 22.5, "Normal Weight"),
            (80.0, 170.0, 27.7, "Overweight"),
            (105.0, 170.0, 36.3, "Obese"),
            (0, 170.0, None, None),
            (70.0, 0, None, None)
        ]
        for wt, ht, exp_bmi, exp_cat in cases:
            with self.subTest(wt=wt, ht=ht):
                bmi, cat = compute_bmi_and_category(wt, ht)
                self.assertEqual(bmi, exp_bmi)
                self.assertEqual(cat, exp_cat)

    def test_03_news2_score_and_triage_acuity_permutations(self):
        """NHS NEWS2 score correctly sums sub-scores and maps to triage priority"""
        # Case A: Normal healthy vitals -> Score 0 -> ROUTINE
        score_a, breakdown_a = calculate_news2_score(resp_rate=16, spo2_pct=98, systolic_bp=120, pulse_rate=72, temperature_f=98.6)
        self.assertEqual(score_a, 0)
        prio_a, _ = determine_triage_priority(news2_score=score_a, chief_complaint="Routine eye checkup")
        self.assertEqual(prio_a, "ROUTINE")

        # Case B: High-acuity emergency (Critical hypoxemia SpO2 88% + Tachycardia 128 bpm + Tachypnea 26)
        score_b, breakdown_b = calculate_news2_score(resp_rate=26, spo2_pct=88, systolic_bp=88, pulse_rate=128, temperature_f=102.5)
        # 3 (resp) + 3 (spo2) + 3 (sbp) + 2 (pulse) + 2 (temp >= 102.3F) = 13
        self.assertEqual(score_b, 13)
        prio_b, _ = determine_triage_priority(news2_score=score_b, chief_complaint="Severe shortness of breath", systolic_bp=88, spo2_pct=88)
        self.assertEqual(prio_b, "EMERGENCY")

        # Case C: Dynamic wait time estimation based on queue position and acuity
        self.assertEqual(estimate_wait_time_minutes(1, "EMERGENCY"), 0)
        self.assertEqual(estimate_wait_time_minutes(2, "URGENT"), 6)
        self.assertEqual(estimate_wait_time_minutes(3, "ROUTINE"), 24)

    def test_04_questionnaire_scoring_phq2_gad2_peg3_permutations(self):
        """Clinical instruments (PHQ-2, GAD-2, PEG-3) score dynamically on the spot"""
        # Depressed (PHQ-2 >= 3), Not Anxious, High Pain (PEG-3 >= 4.0)
        answers_1 = {
            "q5": 2, "q6": 2, # PHQ-2 = 4 (positive)
            "q7": 0, "q8": 1, # GAD-2 = 1 (negative)
            "q9": 6, "q10": 7, "q11": 5, # PEG-3 = (6+7+5)/3 = 6.0 (significant pain)
            "q4": 1, # Penicillin allergy
            "q14": 5 # CKD comorbidity
        }
        res_1 = score_questionnaire_responses(answers_1)
        self.assertEqual(res_1["phq2_score"], 4)
        self.assertTrue(res_1["phq2_positive"])
        self.assertEqual(res_1["gad2_score"], 1)
        self.assertFalse(res_1["gad2_positive"])
        self.assertEqual(res_1["peg3_average"], 6.0)
        self.assertTrue(res_1["peg3_significant_pain"])
        self.assertIn("PENICILLIN", res_1["reported_allergies"])
        self.assertIn("CKD", res_1["reported_comorbidities"])

    # ──────────────────────────────────────────────────────────────────────────
    # 2. MEDSPACY CLINICAL NLP & NEGEX CONTEXT PERMUTATIONS
    # ──────────────────────────────────────────────────────────────────────────

    def test_05_medspacy_negex_scope_and_symptom_extraction(self):
        """MedSpaCy ConText NegEx accurately separates affirmed complaints from denied symptoms"""
        clinical_text = (
            "Patient is a 48-year-old male who presented with severe chest pain and breathlessness for 4 days. "
            "He denies cough, fever, nausea, or vomiting. No history of palpitations."
        )
        affirmed, negated = ClinicalNLPParser.extract_symptoms_with_negation(clinical_text)

        affirmed_symptoms = [a["symptom"] for a in affirmed]
        self.assertIn("chest pain", affirmed_symptoms)
        self.assertIn("shortness of breath", affirmed_symptoms)

        # Denied symptoms must be strictly classified into pertinent negatives
        self.assertIn("cough", negated)
        self.assertIn("fever", negated)
        self.assertIn("nausea", negated)
        self.assertIn("vomiting", negated)
        self.assertIn("palpitations", negated)

        # Verified that negated symptoms are NOT included in affirmed list
        for neg in ["cough", "fever", "nausea", "vomiting", "palpitations"]:
            self.assertNotIn(neg, affirmed_symptoms)

    def test_06_medspacy_consultation_brief_synthesis(self):
        """Clinical narrative synthesizer assembles structured HPI, pertinent negatives, and vitals"""
        brief = ClinicalNarrativeSynthesizer.generate_physician_consultation_brief(
            patient_name="Anita Roy",
            age=48,
            gender="female",
            chief_complaint="Severe chest pain and breathlessness for 4 days. Denies cough and fever.",
            voice_notes="Patient also denies dizziness.",
            vitals={"systolic_bp": 160, "diastolic_bp": 100, "temperature_f": 98.4, "spo2_pct": 94},
            scores={"phq2_positive": False, "peg3_significant_pain": True, "peg3_average": 6.0},
            allergies=["PENICILLIN"]
        )
        summary = brief["symptom_summary"]
        self.assertIn("chest pain", summary)
        self.assertIn("denies", summary)
        self.assertIn("cough", brief["pertinent_negatives"])
        self.assertIn("fever", brief["pertinent_negatives"])
        self.assertIn("dizziness", brief["pertinent_negatives"])
        self.assertIn("160/100", summary)
        self.assertIn("PENICILLIN", brief["allergy_note"])

    # ──────────────────────────────────────────────────────────────────────────
    # 3. DDI PHARMACOLOGICAL SAFETY ENGINE COMBINATIONS
    # ──────────────────────────────────────────────────────────────────────────

    def test_07_ddi_pairwise_safety_and_allergy_contraindications(self):
        """DDIEngine detects dual ARB/ACEi contraindications, NSAID warnings, and patient allergy alerts"""
        # Combination 1: Dual Renin-Angiotensin Blockade (Telmisartan + Enalapril) -> CONTRAINDICATED
        items_contra = [
            {"drug_name": "Telmisartan", "strength": "40mg", "frequency": "1-0-0", "dosage": "40mg"},
            {"drug_name": "Enalapril", "strength": "5mg", "frequency": "1-0-0", "dosage": "5mg"}
        ]
        eval_contra = DDIEngine.evaluate_prescription_safety(items_contra, patient_allergies=[])
        self.assertFalse(eval_contra["is_safe"])
        self.assertTrue(eval_contra["has_critical"])
        self.assertTrue(any(i["severity"] == "CONTRAINDICATED" for i in eval_contra["interactions"]))

        # Combination 2: ARB + NSAID (Telmisartan + Ibuprofen) -> MAJOR
        items_major = [
            {"drug_name": "Telmisartan", "strength": "40mg", "frequency": "1-0-0", "dosage": "40mg"},
            {"drug_name": "Ibuprofen", "strength": "400mg", "frequency": "1-0-1", "dosage": "400mg"}
        ]
        eval_major = DDIEngine.evaluate_prescription_safety(items_major, patient_allergies=[])
        self.assertFalse(eval_major["is_safe"])
        self.assertTrue(any(i["severity"] == "MAJOR" for i in eval_major["interactions"]))

        # Combination 3: Patient has PENICILLIN allergy + prescribed Amoxicillin -> ALLERGY ALERT
        items_allergy = [
            {"drug_name": "Amoxicillin", "strength": "500mg", "frequency": "1-1-1", "dosage": "500mg"}
        ]
        eval_allergy = DDIEngine.evaluate_prescription_safety(items_allergy, patient_allergies=["PENICILLIN"])
        self.assertFalse(eval_allergy["is_safe"])
        self.assertTrue(len(eval_allergy["allergy_alerts"]) > 0)

        # Combination 4: Clean safe combination (Amlodipine + Paracetamol) -> SAFE
        items_safe = [
            {"drug_name": "Amlodipine", "strength": "5mg", "frequency": "1-0-0", "dosage": "5mg"},
            {"drug_name": "Paracetamol", "strength": "650mg", "frequency": "1-0-0", "dosage": "650mg"}
        ]
        eval_safe = DDIEngine.evaluate_prescription_safety(items_safe, patient_allergies=[])
        self.assertTrue(eval_safe["is_safe"])
        self.assertEqual(len(eval_safe["interactions"]), 0)

    # ──────────────────────────────────────────────────────────────────────────
    # 4. FULL OUTPATIENT CLINICAL API LIFECYCLE (End-to-End Dynamic Permutations)
    # ──────────────────────────────────────────────────────────────────────────

    def test_08_end_to_end_cash_payment_encounter_flow(self):
        """Full encounter lifecycle: Register -> Intake -> CDSS -> Prescription -> Sign-Off -> Cashier Cash Settlement"""
        # 1. Register Self-Pay Cash Patient
        reg_payload = {
            "first_name": "Kavita",
            "last_name": "Sharma",
            "dob": "1994-08-12",
            "gender": "FEMALE",
            "phone": "9811122233",
            "chief_complaint": "Acute throat pain and fever for 2 days",
            "doctor_id": self.doctor_id,
            "insurance_type": "CASH",
            "vitals": {
                "systolic_bp": 122,
                "diastolic_bp": 78,
                "pulse_rate": 84,
                "temperature_f": 101.4,
                "resp_rate": 18,
                "spo2_pct": 98,
                "weight_kg": 58.0,
                "height_cm": 162.0
            }
        }
        res_reg = self.client.post("/api/patients", json=reg_payload)
        self.assertEqual(res_reg.status_code, 201)
        v_data = res_reg.json()
        visit_id = v_data["visit"]["id"]
        patient_id = v_data["patient"]["id"]

        # Verify auto-calculated BMI and BP stage in registration response
        self.assertEqual(v_data["vitals"]["bp_stage"], "Elevated BP")
        self.assertEqual(v_data["vitals"]["bmi_category"], "Normal Weight")

        # 2. Record Intake Questionnaire
        q_payload = {
            "patient_id": patient_id,
            "answers": {"q1": 0, "q2": 1, "q5": 0, "q6": 0, "q7": 0, "q8": 0, "q9": 2, "q10": 1, "q11": 1},
            "voice_notes": "Patient complains of sore throat. Denies cough or shortness of breath."
        }
        res_q = self.client.post(f"/api/visits/{visit_id}/questionnaire", json=q_payload)
        self.assertEqual(res_q.status_code, 200)

        # 3. Doctor Calls Patient & Evaluates CDSS Insights
        res_call = self.client.post(f"/api/doctor/queue/{visit_id}/call")
        self.assertEqual(res_call.status_code, 200)
        self.assertEqual(res_call.json()["status"], "IN_CONSULTATION")

        res_ins = self.client.post(f"/api/doctor/visits/{visit_id}/insights")
        self.assertEqual(res_ins.status_code, 200)
        insights = res_ins.json()["insights"]
        # Fever (101.4°F) triggers Low-Grade Fever alert
        self.assertTrue(any(i["rule_code"] == "RULE_PYREXIA_LOW" for i in insights))

        # 4. Prescribe Safe Medications (Paracetamol)
        res_form = self.client.get("/api/doctor/formulary?q=Dolo")
        dolo_id = res_form.json()["drugs"][0]["id"]
        rx_payload = {
            "doctor_id": self.doctor_id,
            "general_instructions": "Take after meals for 3 days.",
            "status": "FINALIZED",
            "items": [
                {"drug_id": dolo_id, "dosage": "650mg", "frequency": "1-0-1", "duration_days": 3, "meal_timing": "AFTER_MEALS"}
            ]
        }
        res_rx = self.client.post(f"/api/doctor/visits/{visit_id}/prescriptions", json=rx_payload)
        self.assertEqual(res_rx.status_code, 201)

        # 5. Doctor Signs Off Encounter -> READY_FOR_BILLING
        signoff_payload = {
            "doctor_id": self.doctor_id,
            "diagnosis": "Acute Pharyngitis with Low-grade Pyrexia",
            "conclusion_notes": "Symptomatic treatment prescribed. Hydration and gargles advised."
        }
        res_sign = self.client.post(f"/api/doctor/visits/{visit_id}/sign-off", json=signoff_payload)
        self.assertEqual(res_sign.status_code, 200)
        self.assertEqual(res_sign.json()["status"], "READY_FOR_BILLING")

        # 6. Cashier Bill Generation
        res_bill = self.client.get(f"/api/cashier/bills/{visit_id}")
        self.assertEqual(res_bill.status_code, 200)
        bill = res_bill.json()
        bill_id = bill["bill_id"]

        # Calculation breakdown for CASH:
        # Consultation: ₹500, Medication: ₹60 -> Subtotal: ₹560
        # Insurance deduction for CASH: ₹0.0
        # Net Payable: ₹560.0
        self.assertEqual(bill["subtotal"], 560.0)
        self.assertEqual(bill["insurance_copay_deduction"], 0.0)
        self.assertEqual(bill["net_payable"], 560.0)

        # 7. Settle Payment via Cash Tender
        pay_payload = {
            "payment_mode": "CASH",
            "amount_paid": 560.0,
            "cashier_id": self.cashier_id
        }
        res_pay = self.client.post(f"/api/bills/{bill_id}/payments", json=pay_payload)
        self.assertEqual(res_pay.status_code, 201)
        self.assertEqual(res_pay.json()["visit_status"], "COMPLETED")

        # 8. Verify Printable HTML and JSON Receipts
        res_rec_json = self.client.get(f"/api/bills/{bill_id}/receipt")
        self.assertEqual(res_rec_json.status_code, 200)
        self.assertEqual(res_rec_json.json()["payment_status"], "PAID")
        self.assertEqual(res_rec_json.json()["financials"]["balance_due"], 0.0)

        res_rec_html = self.client.get(f"/api/bills/{bill_id}/receipt?format=html")
        self.assertEqual(res_rec_html.status_code, 200)
        self.assertIn("Bright Solutions", res_rec_html.text)

    def test_09_ayushman_bharat_pmjay_full_coverage_billing_flow(self):
        """Ayushman Bharat PM-JAY / Government Scheme receives 100% insurance coverage deduction (₹0 copay)"""
        # Register PMJAY patient
        reg_payload = {
            "first_name": "Ramu",
            "last_name": "Yadav",
            "dob": "1975-03-20",
            "gender": "MALE",
            "phone": "9822233344",
            "chief_complaint": "Joint stiffness",
            "doctor_id": self.doctor_id,
            "insurance_type": "GOVT_SCHEME",
            "insurance_provider": "Ayushman Bharat PM-JAY",
            "policy_number": "PMJAY-MH-2026-9901"
        }
        res_reg = self.client.post("/api/patients", json=reg_payload)
        self.assertEqual(res_reg.status_code, 201)
        visit_id = res_reg.json()["visit"]["id"]

        # Sign off
        self.client.post(f"/api/doctor/queue/{visit_id}/call")
        self.client.post(f"/api/doctor/visits/{visit_id}/sign-off", json={
            "doctor_id": self.doctor_id,
            "diagnosis": "Mild Osteoarthritis",
            "conclusion_notes": "Physiotherapy and lifestyle changes."
        })

        # Generate bill: 100% covered by PM-JAY
        res_bill = self.client.get(f"/api/cashier/bills/{visit_id}")
        self.assertEqual(res_bill.status_code, 200)
        bill = res_bill.json()

        # Consultation = ₹500, Insurance covered = ₹500 (100%), Patient Payable = ₹0.0
        self.assertEqual(bill["subtotal"], 500.0)
        self.assertEqual(bill["insurance_copay_deduction"], 500.0)
        self.assertEqual(bill["net_payable"], 0.0)
        self.assertEqual(bill["patient_payable"], 0.0)

    # ──────────────────────────────────────────────────────────────────────────
    # 5. ADMIN ANALYTICS & DYNAMIC THROUGHPUT VERIFICATION
    # ──────────────────────────────────────────────────────────────────────────

    def test_10_admin_analytics_dynamic_throughput_calculation(self):
        """Admin analytics returns dynamic calculated throughput minutes rather than hardcoded 25.0"""
        res = self.client.get("/api/admin/analytics")
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertIn("summary", data)
        summary = data["summary"]
        self.assertIn("avg_throughput_minutes", summary)

        # Confirm avg_throughput_minutes is a computed float from database
        self.assertIsInstance(summary["avg_throughput_minutes"], (int, float))
        # Ensure it equals the direct database calculation from AnalyticsRepository
        computed_db_avg = AnalyticsRepository.get_avg_throughput_minutes()
        self.assertEqual(summary["avg_throughput_minutes"], computed_db_avg)

        # Confirm revenue by mode is properly broken down
        self.assertIn("CASH", data["revenue_by_mode"])
        self.assertIn("UPI", data["revenue_by_mode"])

if __name__ == "__main__":
    unittest.main()
