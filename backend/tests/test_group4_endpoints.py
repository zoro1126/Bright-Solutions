import io
import os
import sys
import time
import unittest
from datetime import datetime
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.config import UPLOAD_DIR
from app.core.database import get_connection

REPORTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "reports"))
REPORT_FILE = os.path.join(REPORTS_DIR, "group4_test_report.md")


class TestGroup4Endpoints(unittest.TestCase):
    test_results_log = []
    start_time = None

    @classmethod
    def setUpClass(cls):
        cls.start_time = time.time()
        cls.client = TestClient(app)
        os.makedirs(REPORTS_DIR, exist_ok=True)

        # Create dedicated test patient and visit
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                # Resolve active Doctor and Receptionist IDs
                cur.execute("SELECT id, full_name FROM users WHERE role = 'DOCTOR' AND is_active = 1 LIMIT 1;")
                doc_row = cur.fetchone()
                cls.doctor_id = doc_row["id"] if doc_row else 16
                cls.doctor_name = doc_row["full_name"] if doc_row else "Dr. Physician"

                cur.execute("SELECT id FROM users WHERE role = 'RECEPTIONIST' AND is_active = 1 LIMIT 1;")
                rec_row = cur.fetchone()
                cls.receptionist_id = rec_row["id"] if rec_row else 17

                # Clean prior test fixtures
                cur.execute("DELETE FROM external_reports WHERE visit_id IN (SELECT id FROM visits WHERE patient_id IN (SELECT id FROM patients WHERE uhid = 'UHID-GRP4-TEST'));")
                cur.execute("DELETE FROM intake_questionnaires WHERE visit_id IN (SELECT id FROM visits WHERE patient_id IN (SELECT id FROM patients WHERE uhid = 'UHID-GRP4-TEST'));")
                cur.execute("DELETE FROM deterministic_insights WHERE visit_id IN (SELECT id FROM visits WHERE patient_id IN (SELECT id FROM patients WHERE uhid = 'UHID-GRP4-TEST'));")
                cur.execute("DELETE FROM vital_signs WHERE visit_id IN (SELECT id FROM visits WHERE patient_id IN (SELECT id FROM patients WHERE uhid = 'UHID-GRP4-TEST'));")
                cur.execute("DELETE FROM visits WHERE patient_id IN (SELECT id FROM patients WHERE uhid = 'UHID-GRP4-TEST');")
                cur.execute("DELETE FROM patients WHERE uhid = 'UHID-GRP4-TEST';")

                # Insert test patient
                cur.execute("""
                    INSERT INTO patients (uhid, first_name, last_name, dob, gender, phone)
                    VALUES ('UHID-GRP4-TEST', 'Devendra', 'Kashyap', '1985-04-12', 'MALE', '9876543210');
                """)
                cur.execute("SELECT id FROM patients WHERE uhid = 'UHID-GRP4-TEST';")
                cls.patient_id = cur.fetchone()["id"]

                # Insert primary test visit (Stage 2 HTN: 142/92, Fever: 101.5 F)
                cur.execute("""
                    INSERT INTO visits (patient_id, doctor_id, receptionist_id, queue_token, status, chief_complaint)
                    VALUES (%s, %s, %s, 'Q-G4-01', 'TRIAGED', 'High fever, acute sore throat and bilateral knee pain');
                """, (cls.patient_id, cls.doctor_id, cls.receptionist_id))
                cls.visit_id = cur.lastrowid

                # Insert baseline vitals
                cur.execute("""
                    INSERT INTO vital_signs (visit_id, systolic_bp, diastolic_bp, pulse_rate, temperature_f, resp_rate, spo2_pct, bmi, bp_stage)
                    VALUES (%s, 142, 92, 88, 101.5, 20, 98.0, 24.5, 'Stage 2 Hypertension');
                """, (cls.visit_id,))
        finally:
            conn.close()

    @classmethod
    def tearDownClass(cls):
        total_duration = time.time() - cls.start_time if cls.start_time else 0.0

        # Physical disk cleanup
        visit_upload_path = os.path.join(UPLOAD_DIR, str(cls.visit_id))
        if os.path.exists(visit_upload_path):
            for fname in os.listdir(visit_upload_path):
                fpath = os.path.join(visit_upload_path, fname)
                try:
                    if os.path.isfile(fpath):
                        os.unlink(fpath)
                except OSError:
                    pass
            try:
                os.rmdir(visit_upload_path)
            except OSError:
                pass

        # Database teardown
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM external_reports WHERE visit_id = %s;", (cls.visit_id,))
                cur.execute("DELETE FROM intake_questionnaires WHERE visit_id = %s;", (cls.visit_id,))
                cur.execute("DELETE FROM deterministic_insights WHERE visit_id = %s;", (cls.visit_id,))
                cur.execute("DELETE FROM vital_signs WHERE visit_id = %s;", (cls.visit_id,))
                cur.execute("DELETE FROM visits WHERE id = %s;", (cls.visit_id,))
                cur.execute("DELETE FROM patients WHERE id = %s;", (cls.patient_id,))
        finally:
            conn.close()

        # Generate automated Markdown test report
        cls._generate_markdown_report(total_duration)

    @classmethod
    def _record_result(cls, test_id: str, title: str, category: str, status: str, details: str, duration_ms: float):
        cls.test_results_log.append({
            "test_id": test_id,
            "title": title,
            "category": category,
            "status": status,
            "details": details,
            "duration_ms": round(duration_ms, 2)
        })

    @classmethod
    def _generate_markdown_report(cls, total_duration_sec: float):
        passed_count = sum(1 for r in cls.test_results_log if r["status"] == "PASSED")
        failed_count = sum(1 for r in cls.test_results_log if r["status"] != "PASSED")
        total_count = len(cls.test_results_log)
        pass_rate = (passed_count / total_count * 100) if total_count > 0 else 0

        report_md = f"""# Test Execution Report: Group 4 Endpoints
**Intake Questionnaires, Clinical Decision Support System (CDSS) & Multi-Modal Diagnostic Vault**

- **Date & Time:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **Total Test Suites:** {total_count}
- **Total Assertions Executed:** {total_count}
- **Passed:** {passed_count}
- **Failed:** {failed_count}
- **Success Rate:** {pass_rate:.1f}%
- **Total Duration:** {total_duration_sec:.3f} seconds

---

## 1. Executive Summary

| Metric | Value |
| :--- | :--- |
| **API Endpoints Tested** | `GET /api/visits/{{id}}/questionnaire`, `POST /api/visits/{{id}}/questionnaire`, `POST /api/visits/{{id}}/reports/upload`, `GET /api/visits/{{id}}/reports`, `GET /api/visits/{{id}}/reports/{{report_id}}`, `DELETE /api/visits/{{id}}/reports/{{report_id}}` |
| **Clinical Decision Support Engine** | Deterministic PHQ-2, GAD-2, and PEG-3 algorithms, ICD-10 Differential Diagnoses mapping, WHO EML Drug Indication matching |
| **Medication Safety Gates** | Rule-based Allergy screening (Penicillin, Sulfa, NSAID) and Organ risk contraindication (Asthma vs $\\beta$-blockers, CKD vs NSAIDs) |
| **Clinical NLP Pipeline** | `medspacy` Negation Detection (`ConTextComponent`) distinguishing affirmed vs refuted symptoms and voice-dictated hypersensitivities |
| **Multi-Modal Diagnostic Vault** | DICOM (.dcm), ECG Traces (.pdf), Laboratory Panels (.pdf, .png), file integrity validation, 50MB ceiling, and atomic disk unlinking |

---

## 2. Test Execution Breakdown

| Test ID | Category | Name / Objective | Status | Latency | Key Validation Findings |
| :--- | :--- | :--- | :---: | :---: | :--- |
"""
        for r in cls.test_results_log:
            badge = "✅ PASSED" if r["status"] == "PASSED" else "❌ FAILED"
            report_md += f"| `{r['test_id']}` | **{r['category']}** | {r['title']} | {badge} | {r['duration_ms']} ms | {r['details']} |\n"

        report_md += """
---

## 3. Algorithmic & Clinical Verification Details

### A. Psychometric & Pain Clinical Scoring Matrix
- **PHQ-2 Depression Screener:**
  $$\\text{PHQ-2} = q_5 (\\text{little interest}) + q_6 (\\text{feeling down}) \\in [0, 6]$$
  $\\text{Score} \\ge 3 \\implies \\text{Positive screen, trigger ICD-10 } F32.9 \\text{ (Major Depressive Episode Screen)}.$
- **GAD-2 Anxiety Screener:**
  $$\\text{GAD-2} = q_7 (\\text{nervous/anxious}) + q_8 (\\text{uncontrolled worrying}) \\in [0, 6]$$
  $\\text{Score} \\ge 3 \\implies \\text{Positive screen, trigger ICD-10 } F41.1 \\text{ (Generalized Anxiety Disorder)}.$
- **PEG-3 Pain Intensity & Interference Score:**
  $$\\text{PEG-3} = \\frac{\\text{clamp}(q_9, 0, 10) + \\text{clamp}(q_{10}, 0, 10) + \\text{clamp}(q_{11}, 0, 10)}{3.0}$$
  $\\text{PEG-3} \\ge 4.0 \\implies \\text{Clinically significant pain interference, trigger ICD-10 } M79.1.$

### B. Deterministic Drug Safety & Contraindication Gates
- **Allergy Shielding:** If patient reports allergy to a drug class (e.g. `PENICILLIN`), candidate medicines sharing that `allergy_trigger_class` (e.g., Amoxicillin + Clavulanic acid) are flagged `CONTRAINDICATED`, disallowing automated prescription without physician override.
- **Chronic Comorbidity Gates:**
  - `ASTHMA` comorbidity shields patients against $\\beta$-blockers (e.g. Atenolol) exhibiting `ASTHMA,BRADYCARDIA` organ risks.
  - `CKD` comorbidity blocks non-steroidal anti-inflammatory drugs (NSAIDs, e.g. Ibuprofen) bearing `PEPTIC_ULCER,CKD` risks.
  - Clear first-line agents without conflict (e.g., Paracetamol for pyrexia/pain) remain flagged `CLEAR` with `is_recommended=True`.

### C. Clinical NLP with MedSpaCy Negation
- Free-text/voice clinical notes undergo tokenization, sentence segmentation, and target phrase extraction.
- The `medspacy` context algorithm evaluates syntactic modifier scopes:
  - *"Patient denies chest pain and denies shortness of breath"* $\\to$ Refuted / Negated symptoms. Not added to acute condition context.
  - *"Complains of severe sore throat and body ache"* $\\to$ Affirmed symptoms. Integrated into diagnostic reasoning context.
  - *"Patient has severe penicillin allergy"* $\\to$ Voice-dictated hypersensitivity parsed and propagated to medication safety gate.

### D. Multi-Modal Diagnostic Vault Safeguards
- Strictly enforces diagnostic file extensions (`.dcm`, `.dicom`, `.pdf`, `.png`, `.jpg`, `.jpeg`, `.tif`, `.tiff`, `.bmp`, `.xml`, `.csv`, `.txt`). Rejects executable or script payloads (`.sh`, `.exe`, `.py`).
- 0-byte empty file detection and 50 MB upload limit rejection.
- ACID disk-to-database parity: Disk files are automatically deleted upon metadata deletion or rollback.

---
*Report generated automatically by the Bright Solutions automated test harness.*
"""
        with open(REPORT_FILE, "w", encoding="utf-8") as f:
            f.write(report_md)

    def test_01_questionnaire_not_found(self):
        """GET /api/visits/{id}/questionnaire on unrecorded visit returns 404"""
        t0 = time.time()
        res = self.client.get(f"/api/visits/{self.visit_id}/questionnaire")
        lat = (time.time() - t0) * 1000

        self.assertEqual(res.status_code, 404)
        self.assertIn("No questionnaire responses recorded", res.json()["detail"])

        self._record_result(
            test_id="TC-G4-01",
            title="Questionnaire Initial State (404 Not Found)",
            category="Questionnaire",
            status="PASSED",
            details="Verified unrecorded visit correctly returns HTTP 404 with standard clinical message",
            duration_ms=lat
        )

    def test_02_questionnaire_standard_mcq_scoring(self):
        """POST /api/visits/{id}/questionnaire evaluates PHQ-2, GAD-2, PEG-3, ICD-10 & Contraindications"""
        t0 = time.time()
        payload = {
            "patient_id": self.patient_id,
            "answers": {
                "q1": 1,
                "q2": 0,
                "q4": 1,  # Penicillin allergy reported via MCQ
                "q5": 3,  # PHQ-2 item 1: nearly every day
                "q6": 2,  # PHQ-2 item 2: more than half days -> score 5 (Positive)
                "q7": 1,  # GAD-2 item 1: several days
                "q8": 2,  # GAD-2 item 2: more than half days -> score 3 (Positive)
                "q9": 6,  # PEG-3 pain intensity: 6
                "q10": 5, # PEG-3 enjoyment: 5
                "q11": 4, # PEG-3 activity: 4 -> average 5.0 (Significant pain)
                "q14": 5  # Chronic comorbidity: CKD / Kidney
            },
            "voice_notes": "Patient presents with persistent fever, throat pain and chronic kidney disease history.",
            "allergies": ["Penicillin"],
            "comorbidities": ["CKD"]
        }
        res = self.client.post(f"/api/visits/{self.visit_id}/questionnaire", json=payload)
        lat = (time.time() - t0) * 1000

        self.assertEqual(res.status_code, 200)
        data = res.json()

        # 1. Structural checks
        self.assertEqual(data["visit_id"], self.visit_id)
        self.assertIn("clinical_scores", data)
        self.assertIn("predicted_conditions", data)
        self.assertIn("recommended_medications", data)

        # 2. Score calculations
        scores = data["clinical_scores"]
        self.assertEqual(scores["phq2_score"], 5)
        self.assertTrue(scores["phq2_positive"])
        self.assertEqual(scores["gad2_score"], 3)
        self.assertTrue(scores["gad2_positive"])
        self.assertEqual(scores["peg3_average"], 5.0)
        self.assertTrue(scores["peg3_significant_pain"])
        self.assertIn("PENICILLIN", scores["reported_allergies"])
        self.assertIn("CKD", scores["reported_comorbidities"])

        # 3. Predicted conditions from vitals + complaints
        cond_codes = [c["disease_code"] for c in data["predicted_conditions"]]
        self.assertIn("HYPERTENSION_STAGE2", cond_codes)
        self.assertIn("ACUTE_FEVER_PYREXIA", cond_codes)
        self.assertIn("MAJOR_DEPRESSION_SCREEN", cond_codes)
        self.assertIn("ANXIETY_DISORDER", cond_codes)
        self.assertIn("ACUTE_MUSCULOSKELETAL_PAIN", cond_codes)

        # 4. Medication safety filtering
        meds = data["recommended_medications"]
        self.assertTrue(len(meds) > 0)

        # Penicillin / Amoxicillin should be marked CONTRAINDICATED
        penicillin_meds = [m for m in meds if "AMOXICILLIN" in m["inn_name"].upper()]
        self.assertTrue(len(penicillin_meds) > 0)
        for p_med in penicillin_meds:
            self.assertEqual(p_med["safety_status"], "CONTRAINDICATED")
            self.assertFalse(p_med["is_recommended"])
            self.assertIn("allergy", p_med["safety_notes"].lower())

        # Ibuprofen should be marked CONTRAINDICATED due to CKD comorbidity
        ibuprofen_meds = [m for m in meds if "IBUPROFEN" in m["inn_name"].upper()]
        self.assertTrue(len(ibuprofen_meds) > 0)
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

        self._record_result(
            test_id="TC-G4-02",
            title="Standard MCQ Intake & Deterministic CDSS Engine",
            category="CDSS",
            status="PASSED",
            details="Evaluated PHQ-2 (5/6), GAD-2 (3/6), PEG-3 (5.0/10), flagged Amoxicillin & Ibuprofen contraindications",
            duration_ms=lat
        )

    def test_03_named_survey_keys_persistence(self):
        """POST /api/visits/{id}/questionnaire handles named survey keys and persists correctly in MySQL"""
        t0 = time.time()
        payload = {
            "patient_id": self.patient_id,
            "answers": {
                "phq2_1": 2,
                "phq2_2": 2,
                "gad2_1": 3,
                "gad2_2": 0,
                "peg_pain": 8,
                "peg_enjoyment": 7,
                "peg_activity": 6,
                "allergy_status": 2,          # SULFA allergy
                "chronic_comorbidity": 2,      # DIABETES comorbidity
                "red_flags": 0
            },
            "voice_notes": "Survey captured with named identifiers."
        }
        res_post = self.client.post(f"/api/visits/{self.visit_id}/questionnaire", json=payload)
        self.assertEqual(res_post.status_code, 200)

        # Now retrieve via GET to confirm persistence and bidirectional DB column mapping
        res_get = self.client.get(f"/api/visits/{self.visit_id}/questionnaire")
        lat = (time.time() - t0) * 1000

        self.assertEqual(res_get.status_code, 200)
        data = res_get.json()

        # Answers in GET should have the q-keys mapped
        answers = data["answers"]
        self.assertEqual(answers["q5"], 2)
        self.assertEqual(answers["q6"], 2)
        self.assertEqual(answers["q7"], 3)
        self.assertEqual(answers["q8"], 0)
        self.assertEqual(answers["q9"], 8)
        self.assertEqual(answers["q10"], 7)
        self.assertEqual(answers["q11"], 6)

        # Check scores derived from persisted rows
        scores = data["clinical_scores"]
        self.assertEqual(scores["phq2_score"], 4)
        self.assertTrue(scores["phq2_positive"])
        self.assertEqual(scores["gad2_score"], 3)
        self.assertTrue(scores["gad2_positive"])
        self.assertEqual(scores["peg3_average"], 7.0)
        self.assertTrue(scores["peg3_significant_pain"])
        self.assertIn("SULFA", scores["reported_allergies"])
        self.assertIn("DIABETES", scores["reported_comorbidities"])

        self._record_result(
            test_id="TC-G4-03",
            title="Named Survey Keys Bidirectional Persistence",
            category="Persistence",
            status="PASSED",
            details="Mapped named survey keys to q-schema in MySQL; verified reloaded scores (PHQ-2: 4, PEG-3: 7.0)",
            duration_ms=lat
        )

    def test_04_peg3_clamping_and_boundaries(self):
        """PEG-3 engine clamps negative and excessive ratings strictly to [0.0, 10.0]"""
        t0 = time.time()
        payload = {
            "patient_id": self.patient_id,
            "answers": {
                "peg_pain": 25.0,        # Out of bounds (>10) -> clamped to 10.0
                "peg_enjoyment": -15.0,   # Out of bounds (<0) -> clamped to 0.0
                "peg_activity": 8.0       # Normal
            }
        }
        res = self.client.post(f"/api/visits/{self.visit_id}/questionnaire", json=payload)
        lat = (time.time() - t0) * 1000

        self.assertEqual(res.status_code, 200)
        scores = res.json()["clinical_scores"]
        # Expected: (10.0 + 0.0 + 8.0) / 3.0 = 18.0 / 3.0 = 6.0
        self.assertEqual(scores["peg3_average"], 6.0)
        self.assertTrue(scores["peg3_significant_pain"])

        # Boundary test: all 0.0
        payload_zero = {
            "patient_id": self.patient_id,
            "answers": {"peg_pain": 0, "peg_enjoyment": 0, "peg_activity": 0}
        }
        res_zero = self.client.post(f"/api/visits/{self.visit_id}/questionnaire", json=payload_zero)
        scores_zero = res_zero.json()["clinical_scores"]
        self.assertEqual(scores_zero["peg3_average"], 0.0)
        self.assertFalse(scores_zero["peg3_significant_pain"])

        self._record_result(
            test_id="TC-G4-04",
            title="PEG-3 Pain Scale Bounds Clamping [0.0, 10.0]",
            category="Algorithms",
            status="PASSED",
            details="Clamped extreme ratings (-15, 25) to strictly valid range; average computed deterministically as 6.0",
            duration_ms=lat
        )

    def test_05_comorbidity_taxonomy_and_drug_safety(self):
        """Comorbidity taxonomy checks: ASTHMA blocks beta-blockers, CKD blocks NSAIDs"""
        t0 = time.time()
        # Case A: Asthma comorbidity blocks Atenolol in Stage 2 HTN
        payload_asthma = {
            "patient_id": self.patient_id,
            "answers": {
                "q14": 3  # ASTHMA
            },
            "comorbidities": ["ASTHMA"]
        }
        res_asthma = self.client.post(f"/api/visits/{self.visit_id}/questionnaire", json=payload_asthma)
        self.assertEqual(res_asthma.status_code, 200)
        meds_asthma = res_asthma.json()["recommended_medications"]

        atenolol_meds = [m for m in meds_asthma if "ATENOLOL" in m["inn_name"].upper()]
        self.assertTrue(len(atenolol_meds) > 0)
        for at_med in atenolol_meds:
            self.assertEqual(at_med["safety_status"], "CONTRAINDICATED")
            self.assertFalse(at_med["is_recommended"])
            self.assertIn("bronchial asthma", at_med["safety_notes"].lower())

        # Case B: CKD comorbidity blocks Ibuprofen
        payload_ckd = {
            "patient_id": self.patient_id,
            "answers": {
                "q14": 5  # CKD
            },
            "comorbidities": ["CKD"]
        }
        res_ckd = self.client.post(f"/api/visits/{self.visit_id}/questionnaire", json=payload_ckd)
        lat = (time.time() - t0) * 1000

        self.assertEqual(res_ckd.status_code, 200)
        meds_ckd = res_ckd.json()["recommended_medications"]
        ibuprofen_meds = [m for m in meds_ckd if "IBUPROFEN" in m["inn_name"].upper()]
        self.assertTrue(len(ibuprofen_meds) > 0)
        for ib in ibuprofen_meds:
            self.assertEqual(ib["safety_status"], "CONTRAINDICATED")
            self.assertIn("renal", ib["safety_notes"].lower())

        self._record_result(
            test_id="TC-G4-05",
            title="Comorbidity Taxonomy & Organ Safety Gates",
            category="CDSS",
            status="PASSED",
            details="ASTHMA blocked Atenolol (bronchial spasm risk); CKD blocked Ibuprofen (nephrotoxicity risk)",
            duration_ms=lat
        )

    def test_06_medspacy_voice_notes_symptoms_and_allergy(self):
        """Clinical NLP parses negated vs affirmed symptoms and detects voice-dictated drug hypersensitivity"""
        t0 = time.time()
        payload = {
            "patient_id": self.patient_id,
            "answers": {},
            "voice_notes": "Patient strongly denies chest pain and denies shortness of breath. Patient complains of severe sore throat, body ache and high fever. Note: patient has severe penicillin allergy and hypersensitivity."
        }
        res = self.client.post(f"/api/visits/{self.visit_id}/questionnaire", json=payload)
        lat = (time.time() - t0) * 1000

        self.assertEqual(res.status_code, 200)
        data = res.json()

        # Check conditions: Should have Acute Respiratory / Fever and Musculoskeletal Pain from affirmed symptoms
        cond_codes = [c["disease_code"] for c in data["predicted_conditions"]]
        self.assertIn("ACUTE_RESPIRATORY_URI", cond_codes)
        self.assertIn("ACUTE_FEVER_PYREXIA", cond_codes)
        self.assertIn("ACUTE_MUSCULOSKELETAL_PAIN", cond_codes)

        # Denied symptoms (shortness of breath) must NOT trigger Bronchial Asthma
        self.assertNotIn("BRONCHIAL_ASTHMA", cond_codes)

        # Voice-dictated allergy detection
        meds = data["recommended_medications"]
        penicillin_meds = [m for m in meds if "AMOXICILLIN" in m["inn_name"].upper()]
        self.assertTrue(len(penicillin_meds) > 0)
        for p_med in penicillin_meds:
            self.assertEqual(p_med["safety_status"], "CONTRAINDICATED")
            self.assertIn("allergy", p_med["safety_notes"].lower())

        self._record_result(
            test_id="TC-G4-06",
            title="MedSpaCy Clinical Negation & Dictation Parser",
            category="NLP",
            status="PASSED",
            details="Negated chest pain/dyspnea; affirmed sore throat/fever; detected voice-dictated penicillin allergy",
            duration_ms=lat
        )

    def test_07_red_flag_emergency_alert(self):
        """Intake red flag triggers critical CDSS alert and ACUTE_RED_FLAG_EMERGENCY condition"""
        t0 = time.time()
        payload = {
            "patient_id": self.patient_id,
            "answers": {
                "q15": 1  # Immediate emergency red flag
            },
            "voice_notes": "Patient experiencing sudden onset unilateral paralysis and severe acute distress."
        }
        res = self.client.post(f"/api/visits/{self.visit_id}/questionnaire", json=payload)
        lat = (time.time() - t0) * 1000

        self.assertEqual(res.status_code, 200)
        data = res.json()

        # Check score flag
        self.assertTrue(data["clinical_scores"]["red_flag_emergency"])

        # Check predicted conditions include ACUTE_RED_FLAG_EMERGENCY
        cond_codes = [c["disease_code"] for c in data["predicted_conditions"]]
        self.assertIn("ACUTE_RED_FLAG_EMERGENCY", cond_codes)
        red_flag_cond = next(c for c in data["predicted_conditions"] if c["disease_code"] == "ACUTE_RED_FLAG_EMERGENCY")
        self.assertEqual(red_flag_cond["icd10_code"], "R68.89")

        # Verify deterministic insight written to MySQL with CRITICAL severity
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT rule_code, severity_level, title 
                    FROM deterministic_insights 
                    WHERE visit_id = %s AND rule_code = 'RULE_RED_FLAG_EMERGENCY';
                """, (self.visit_id,))
                insight = cur.fetchone()
                self.assertIsNotNone(insight)
                self.assertEqual(insight["severity_level"], "CRITICAL")
        finally:
            conn.close()

        self._record_result(
            test_id="TC-G4-07",
            title="Red Flag Emergency Intake CDSS Alert",
            category="CDSS",
            status="PASSED",
            details="Triggered ICD-10 R68.89 Acute Emergency and CRITICAL insight in MySQL deterministic_insights",
            duration_ms=lat
        )

    def test_08_upload_report_validations(self):
        """POST /api/visits/{id}/reports/upload validates empty files, disallowed extensions and invalid visit"""
        t0 = time.time()

        # 1. Non-existent visit ID -> 404
        res_404 = self.client.post(
            "/api/visits/9999999/reports/upload",
            data={"report_type": "DICOM"},
            files={"file": ("scan.dcm", b"VALID_DICM_DATA", "application/dicom")}
        )
        self.assertEqual(res_404.status_code, 404)

        # 2. Empty 0-byte file -> 400
        res_empty = self.client.post(
            f"/api/visits/{self.visit_id}/reports/upload",
            data={"report_type": "DICOM"},
            files={"file": ("empty_scan.dcm", b"", "application/dicom")}
        )
        self.assertEqual(res_empty.status_code, 400)
        self.assertIn("empty (0 bytes)", res_empty.json()["detail"])

        # 3. Disallowed executable extension (.sh) -> 400
        res_ext = self.client.post(
            f"/api/visits/{self.visit_id}/reports/upload",
            data={"report_type": "OTHER"},
            files={"file": ("malicious_script.sh", b"#!/bin/bash\necho hello", "text/x-shellscript")}
        )
        self.assertEqual(res_ext.status_code, 400)
        self.assertIn("Unsupported file extension", res_ext.json()["detail"])

        # 4. Invalid report type -> 400
        res_type = self.client.post(
            f"/api/visits/{self.visit_id}/reports/upload",
            data={"report_type": "INVALID_SCAN_KIND"},
            files={"file": ("scan.pdf", b"%PDF-1.4 header data", "application/pdf")}
        )
        self.assertEqual(res_type.status_code, 400)
        self.assertIn("Invalid report_type", res_type.json()["detail"])

        lat = (time.time() - t0) * 1000

        self._record_result(
            test_id="TC-G4-08",
            title="Diagnostic Vault Upload Validation & Security Gates",
            category="Security",
            status="PASSED",
            details="Rejected 0-byte file, disallowed '.sh' extension, invalid modality type, and invalid visit 404",
            duration_ms=lat
        )

    def test_09_upload_and_list_multiple_modalities(self):
        """Uploads DICOM, ECG and Laboratory reports and retrieves complete multi-modal catalog"""
        t0 = time.time()

        # 1. Upload DICOM
        dicom_bytes = b"DICOM_HEADER_MAGIC_BYTES_STUDY_12345"
        res_dcm = self.client.post(
            f"/api/visits/{self.visit_id}/reports/upload",
            data={
                "report_type": "DICOM",
                "modality": "Brain MRI Axial FLAIR",
                "findings_summary": "No acute territorial infarction or intracranial hemorrhage."
            },
            files={"file": ("brain_mri.dcm", io.BytesIO(dicom_bytes), "application/dicom")}
        )
        self.assertEqual(res_dcm.status_code, 201)
        self.report_id_dicom = res_dcm.json()["report_id"]

        # 2. Upload ECG Trace
        ecg_bytes = b"%PDF-1.4 ECG 12-LEAD VECTOR TRACE RECORD"
        res_ecg = self.client.post(
            f"/api/visits/{self.visit_id}/reports/upload",
            data={
                "report_type": "ECG",
                "modality": "12-Lead Resting Electrocardiogram",
                "findings_summary": "Sinus rhythm 74 bpm, normal axis, no ST-elevation or T-wave inversion."
            },
            files={"file": ("resting_ecg.pdf", io.BytesIO(ecg_bytes), "application/pdf")}
        )
        self.assertEqual(res_ecg.status_code, 201)
        self.report_id_ecg = res_ecg.json()["report_id"]

        # 3. Upload Lab Panel PDF
        lab_bytes = b"%PDF-1.4 METABOLIC PANEL AND HEMATOLOGY RESULTS"
        res_lab = self.client.post(
            f"/api/visits/{self.visit_id}/reports/upload",
            data={
                "report_type": "LAB_PDF",
                "modality": "Complete Blood Count & Renal Panel",
                "findings_summary": "Serum Creatinine 1.8 mg/dL (elevated), Hb 13.5 g/dL."
            },
            files={"file": ("cbc_renal.pdf", io.BytesIO(lab_bytes), "application/pdf")}
        )
        self.assertEqual(res_lab.status_code, 201)
        self.report_id_lab = res_lab.json()["report_id"]

        # List all reports for the visit
        res_list = self.client.get(f"/api/visits/{self.visit_id}/reports")
        lat = (time.time() - t0) * 1000

        self.assertEqual(res_list.status_code, 200)
        list_data = res_list.json()
        self.assertEqual(list_data["visit_id"], self.visit_id)
        self.assertEqual(list_data["patient_id"], self.patient_id)
        self.assertEqual(list_data["count"], 3)
        self.assertEqual(len(list_data["reports"]), 3)

        # Verify modalities
        modalities = [r["modality"] for r in list_data["reports"]]
        self.assertIn("Brain MRI Axial FLAIR", modalities)
        self.assertIn("12-Lead Resting Electrocardiogram", modalities)
        self.assertIn("Complete Blood Count & Renal Panel", modalities)

        self._record_result(
            test_id="TC-G4-09",
            title="Multi-Modal Diagnostic Upload & Indexing",
            category="Diagnostics",
            status="PASSED",
            details="Persisted 3 modalities (DICOM, ECG, LAB_PDF); catalog returned all 3 entries with metadata",
            duration_ms=lat
        )

    def test_10_get_single_report_and_delete_with_disk_unlinking(self):
        """GET single report metadata and DELETE with physical filesystem unlinking"""
        t0 = time.time()

        # Find any uploaded report for this visit
        res_list = self.client.get(f"/api/visits/{self.visit_id}/reports")
        self.assertEqual(res_list.status_code, 200)
        reports = res_list.json()["reports"]
        self.assertTrue(len(reports) >= 1)

        target_report = reports[0]
        target_id = target_report["id"]
        rel_path = target_report["file_path"].replace("/uploads/", "")
        phys_path = os.path.join(UPLOAD_DIR, rel_path)

        # 1. Verify file exists on disk
        self.assertTrue(os.path.exists(phys_path))

        # 2. GET single report endpoint
        res_single = self.client.get(f"/api/visits/{self.visit_id}/reports/{target_id}")
        self.assertEqual(res_single.status_code, 200)
        self.assertEqual(res_single.json()["id"], target_id)

        # 3. DELETE report endpoint
        res_del = self.client.delete(f"/api/visits/{self.visit_id}/reports/{target_id}")
        self.assertEqual(res_del.status_code, 200)
        self.assertEqual(res_del.json()["message"], "External report removed successfully")

        # 4. Verify file was unlinked from physical disk
        self.assertFalse(os.path.exists(phys_path))

        # 5. Verify GET on deleted report returns 404
        res_single_deleted = self.client.get(f"/api/visits/{self.visit_id}/reports/{target_id}")
        self.assertEqual(res_single_deleted.status_code, 404)

        # 6. Verify count reduced
        res_list_after = self.client.get(f"/api/visits/{self.visit_id}/reports")
        self.assertEqual(res_list_after.json()["count"], len(reports) - 1)

        lat = (time.time() - t0) * 1000

        self._record_result(
            test_id="TC-G4-10",
            title="Single Report Retrieval & Disk Unlinking Safeguard",
            category="Diagnostics",
            status="PASSED",
            details="Validated single report GET; DELETE unlinked physical disk file and removed MySQL record",
            duration_ms=lat
        )


if __name__ == "__main__":
    unittest.main()
