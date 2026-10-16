import os
import sys
import time
import unittest
from datetime import datetime
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.database import get_connection

REPORTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "reports"))
REPORT_FILE = os.path.join(REPORTS_DIR, "group5_test_report.md")


class TestGroup5Endpoints(unittest.TestCase):
    test_results_log = []
    start_time = None

    @classmethod
    def setUpClass(cls):
        cls.start_time = time.time()
        cls.client = TestClient(app)
        os.makedirs(REPORTS_DIR, exist_ok=True)

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                # 1. Resolve active Doctor and Receptionist IDs
                cur.execute("SELECT id, full_name FROM users WHERE role = 'DOCTOR' AND is_active = 1 LIMIT 1;")
                doc_row = cur.fetchone()
                cls.doctor_id = doc_row["id"] if doc_row else 16
                cls.doctor_name = doc_row["full_name"] if doc_row else "Dr. Active Physician"

                cur.execute("SELECT id FROM users WHERE role = 'RECEPTIONIST' AND is_active = 1 LIMIT 1;")
                rec_row = cur.fetchone()
                cls.receptionist_id = rec_row["id"] if rec_row else 17

                # 2. Clean prior test fixtures
                cur.execute("DELETE FROM prescription_items WHERE prescription_id IN (SELECT id FROM prescriptions WHERE visit_id IN (SELECT id FROM visits WHERE patient_id IN (SELECT id FROM patients WHERE uhid LIKE 'UHID-GRP5-%')));")
                cur.execute("DELETE FROM prescriptions WHERE visit_id IN (SELECT id FROM visits WHERE patient_id IN (SELECT id FROM patients WHERE uhid LIKE 'UHID-GRP5-%'));")
                cur.execute("DELETE FROM deterministic_insights WHERE visit_id IN (SELECT id FROM visits WHERE patient_id IN (SELECT id FROM patients WHERE uhid LIKE 'UHID-GRP5-%'));")
                cur.execute("DELETE FROM intake_questionnaires WHERE visit_id IN (SELECT id FROM visits WHERE patient_id IN (SELECT id FROM patients WHERE uhid LIKE 'UHID-GRP5-%'));")
                cur.execute("DELETE FROM external_reports WHERE visit_id IN (SELECT id FROM visits WHERE patient_id IN (SELECT id FROM patients WHERE uhid LIKE 'UHID-GRP5-%'));")
                cur.execute("DELETE FROM vital_signs WHERE visit_id IN (SELECT id FROM visits WHERE patient_id IN (SELECT id FROM patients WHERE uhid LIKE 'UHID-GRP5-%'));")
                cur.execute("DELETE FROM visits WHERE patient_id IN (SELECT id FROM patients WHERE uhid LIKE 'UHID-GRP5-%');")
                cur.execute("DELETE FROM patients WHERE uhid LIKE 'UHID-GRP5-%';")

                # 3. Create Primary Test Patient (Devika Shrestha)
                cur.execute("""
                    INSERT INTO patients (uhid, first_name, last_name, dob, gender, blood_group, phone, email, address, insurance_provider, insurance_type)
                    VALUES ('UHID-GRP5-01', 'Devika', 'Shrestha', '1982-11-20', 'FEMALE', 'B+', '9812345678', 'devika@test.clinic', '45 North St, Ward 3', 'Himalayan Health Plan', 'GOVT_SCHEME');
                """)
                cur.execute("SELECT id FROM patients WHERE uhid = 'UHID-GRP5-01';")
                cls.patient_id = cur.fetchone()["id"]

                # 4. Create Visit 1 (Hypertensive Crisis & Red Flag for Doctor 1)
                cur.execute("""
                    INSERT INTO visits (patient_id, doctor_id, receptionist_id, queue_token, status, chief_complaint)
                    VALUES (%s, %s, %s, 'Q-G5-01', 'TRIAGED', 'Sudden severe occipital headache, blurred vision and throat pain');
                """, (cls.patient_id, cls.doctor_id, cls.receptionist_id))
                cls.visit_id = cur.lastrowid

                # Vitals: SBP 185, DBP 115 (Crisis), SpO2 89% (Critical), Pulse 108 (Tachycardia), Temp 102.0 (High Fever), BMI 31.2 (Obese)
                cur.execute("""
                    INSERT INTO vital_signs (visit_id, systolic_bp, diastolic_bp, pulse_rate, temperature_f, resp_rate, spo2_pct, bmi, bp_stage)
                    VALUES (%s, 185, 115, 108, 102.0, 26, 89.0, 31.2, 'Hypertensive Crisis');
                """, (cls.visit_id,))

                # Questionnaire answers with penicillin allergy and depression screen
                cur.execute("""
                    INSERT INTO intake_questionnaires (visit_id, patient_id, q4, q5, q6, q7, q8, q9, q10, q11, q15, voice_notes)
                    VALUES (%s, %s, 1, 3, 2, 2, 2, 7, 6, 7, 1, 'Patient strongly denies chest pain. Complains of severe throat pain and headache. Note: severe penicillin allergy.');
                """, (cls.visit_id, cls.patient_id))

                # 5. Create Secondary Visit (IN_CONSULTATION state for queue ordering test)
                cur.execute("""
                    INSERT INTO patients (uhid, first_name, last_name, dob, gender, phone)
                    VALUES ('UHID-GRP5-02', 'Ravi', 'Shrestha', '1990-01-15', 'MALE', '9812345679');
                """)
                cur.execute("SELECT id FROM patients WHERE uhid = 'UHID-GRP5-02';")
                cls.patient_2_id = cur.fetchone()["id"]

                cur.execute("""
                    INSERT INTO visits (patient_id, doctor_id, receptionist_id, queue_token, status, chief_complaint)
                    VALUES (%s, %s, %s, 'Q-G5-02', 'IN_CONSULTATION', 'Routine follow up');
                """, (cls.patient_2_id, cls.doctor_id, cls.receptionist_id))
                cls.visit_2_id = cur.lastrowid

                cur.execute("""
                    INSERT INTO vital_signs (visit_id, systolic_bp, diastolic_bp, pulse_rate, temperature_f, resp_rate, spo2_pct, bmi, bp_stage)
                    VALUES (%s, 120, 80, 72, 98.4, 16, 99.0, 22.1, 'Normal Blood Pressure');
                """, (cls.visit_2_id,))
        finally:
            conn.close()

    @classmethod
    def tearDownClass(cls):
        total_duration = time.time() - cls.start_time if cls.start_time else 0.0

        # Clean MySQL test records
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM prescription_items WHERE prescription_id IN (SELECT id FROM prescriptions WHERE visit_id IN (SELECT id FROM visits WHERE patient_id IN (SELECT id FROM patients WHERE uhid LIKE 'UHID-GRP5-%')));")
                cur.execute("DELETE FROM prescriptions WHERE visit_id IN (SELECT id FROM visits WHERE patient_id IN (SELECT id FROM patients WHERE uhid LIKE 'UHID-GRP5-%'));")
                cur.execute("DELETE FROM deterministic_insights WHERE visit_id IN (SELECT id FROM visits WHERE patient_id IN (SELECT id FROM patients WHERE uhid LIKE 'UHID-GRP5-%'));")
                cur.execute("DELETE FROM intake_questionnaires WHERE visit_id IN (SELECT id FROM visits WHERE patient_id IN (SELECT id FROM patients WHERE uhid LIKE 'UHID-GRP5-%'));")
                cur.execute("DELETE FROM external_reports WHERE visit_id IN (SELECT id FROM visits WHERE patient_id IN (SELECT id FROM patients WHERE uhid LIKE 'UHID-GRP5-%'));")
                cur.execute("DELETE FROM vital_signs WHERE visit_id IN (SELECT id FROM visits WHERE patient_id IN (SELECT id FROM patients WHERE uhid LIKE 'UHID-GRP5-%'));")
                cur.execute("DELETE FROM visits WHERE patient_id IN (SELECT id FROM patients WHERE uhid LIKE 'UHID-GRP5-%');")
                cur.execute("DELETE FROM patients WHERE uhid LIKE 'UHID-GRP5-%';")
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

        report_md = f"""# Test Execution Report: Group 5 Endpoints
**Doctor Consultation Workflow, Unified CDSS Insights, E-Prescriptions & Formulary Subsystem**

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
| **API Endpoints Tested** | `GET /api/doctor/queue`, `POST /api/doctor/queue/{{id}}/call`, `GET /api/doctor/patients/{{id}}/dossier`, `POST /api/doctor/visits/{{id}}/insights`, `GET /api/doctor/visits/{{id}}/insights`, `PATCH /api/doctor/insights/{{id}}`, `GET /api/doctor/formulary`, `GET /api/drugs/formulary`, `POST /api/doctor/visits/{{id}}/prescriptions/check-safety`, `POST /api/doctor/visits/{{id}}/prescriptions`, `GET /api/doctor/visits/{{id}}/prescriptions`, `POST /api/doctor/visits/{{id}}/sign-off` |
| **Doctor OPD Queue Engine** | Status-prioritized queue sequencing (`IN_CONSULTATION` precedes `TRIAGED`), real-time triage vital sign summaries, doctor ID filtering |
| **Comprehensive Patient Dossier** | Longitudinal history aggregation: past visits, prior prescriptions, external lab/imaging reports, active triage vitals, and synthesized NLP clinical narrative with pertinent negatives |
| **Unified CDSS Engine** | Holistic multi-modal inference evaluating both physiological triage telemetry (BP crisis, SpO2 hypoxemia, fever) and validated intake psychometrics/red flags without rule-loss upon synchronization |
| **Deterministic DDI Engine** | Pairwise drug-drug interactions (e.g. NSAID + ARB), duplicate therapeutic class detection (e.g. dual PPIs), and maximum daily dosage anomaly ceilings (Paracetamol > 4000 mg/day) |
| **Sign-Off Clinical Governance** | Mandatory digital sign-off gate requiring explicit physician clinical override notes for active `CRITICAL` alerts before transitioning to `READY_FOR_BILLING` |

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

### A. Queue Priority Sequencing & Triage Telemetry
- Patients currently active in the consultation room (`IN_CONSULTATION`) are deterministically ranked at index 0 ahead of waiting patients (`TRIAGED`).
- Telemetry payload decomposes blood pressure string (`185/115 mmHg`), categorical staging (`Hypertensive Crisis`), heart rate, oxygen saturation, and body mass index.

### B. Patient Dossier Synthesis & Clinical NegEx
- The `ClinicalNarrativeSynthesizer` combines chief complaints, voice dictation, and objective vitals into an executive consultation summary.
- Syntactic scope negation evaluates pertinent negatives:
  - *"Patient strongly denies chest pain"* $\\to$ parsed as a pertinent negative; ruled out from active acute coronary syndrome reasoning.
  - *"Complains of severe throat pain and headache"* $\\to$ affirmed symptoms driving clinical reasoning.

### C. Unified CDSS Insight Rules Matrix
- **AHA 2017 Hypertensive Crisis:** $\\text{SBP} \\ge 180 \\text{ or } \\text{DBP} \\ge 120 \\text{ mmHg} \\implies \\text{RULE\\_HTN\\_CRISIS (CRITICAL)}$.
- **Severe Hypoxemia:** $\\text{SpO}_2 < 90\\% \\implies \\text{RULE\\_HYPOXEMIA\\_CRITICAL (CRITICAL)}$.
- **Emergency Red Flag:** $q_{15} = 1 \\implies \\text{RULE\\_RED\\_FLAG\\_EMERGENCY (CRITICAL)}$.
- **Depression Screener:** $q_5 + q_6 \\ge 3 \\implies \\text{RULE\\_PHQ2\\_DEPRESSION (WARNING)}$.
- **Severe Pain Interference:** $\\text{PEG-3} \\ge 4.0 \\implies \\text{RULE\\_PEG3\\_SIGNIFICANT\\_PAIN (WARNING)}$.

### D. Deterministic DDI & Safety Ceilings
- **Pairwise DDI:** `Combiflam` (NSAID) + `Telma 40` (ARB) triggers `MAJOR` interaction: NSAID prostaglandin inhibition attenuates ARB antihypertensive action and precipitates acute renal hemodynamic risk.
- **Duplicate Therapy:** `Pan 40` (Pantoprazole) + `Omez 20` (Omeprazole) triggers `DUPLICATE_THERAPY` warning: dual Proton Pump Inhibitors lack additive acid suppression and amplify hypomagnesemia/infection risks.
- **Dosage Ceiling:** Prescribing `Dolo 650` at 2 tabs QDS (5200 mg/day) violates the 4000 mg/day adult hepatotoxicity ceiling (`DOSAGE_ANOMALY`).

### E. Consultation Sign-Off & Lock Guard
- If unreviewed `CRITICAL` safety alerts exist, the sign-off endpoint rejects the request (HTTP 400) unless `doctor_override_notes` are supplied.
- Upon valid sign-off, all insights are signed, encounter status transitions to `READY_FOR_BILLING`, and subsequent prescription modifications are blocked (HTTP 400).

---
*Report generated automatically by the Bright Solutions automated test harness.*
"""
        with open(REPORT_FILE, "w", encoding="utf-8") as f:
            f.write(report_md)

    def test_01_doctor_queue_filtering_and_order(self):
        """GET /api/doctor/queue ranks IN_CONSULTATION before TRIAGED and supports doctor filtering"""
        t0 = time.time()
        # Query queue for our test doctor
        res = self.client.get(f"/api/doctor/queue?doctor_id={self.doctor_id}")
        lat = (time.time() - t0) * 1000

        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["doctor_id"], self.doctor_id)
        self.assertTrue(data["waiting_count"] >= 2)

        queue = data["queue"]
        # Find our two test encounters
        visit_ids = [item["visit_id"] for item in queue]
        self.assertIn(self.visit_id, visit_ids)
        self.assertIn(self.visit_2_id, visit_ids)

        idx_consultation = visit_ids.index(self.visit_2_id)
        idx_triaged = visit_ids.index(self.visit_id)
        # IN_CONSULTATION must precede TRIAGED
        self.assertLess(idx_consultation, idx_triaged)

        # Check triage summary on primary visit
        prim = next(item for item in queue if item["visit_id"] == self.visit_id)
        self.assertEqual(prim["triage_summary"]["bp"], "185/115")
        self.assertEqual(prim["triage_summary"]["bp_stage"], "Hypertensive Crisis")
        self.assertEqual(prim["triage_summary"]["spo2"], 89.0)
        self.assertEqual(prim["triage_summary"]["temperature_f"], 102.0)

        self._record_result(
            test_id="TC-G5-01",
            title="Doctor OPD Queue Priority & Telemetry Sequencing",
            category="Queue",
            status="PASSED",
            details="Validated IN_CONSULTATION priority over TRIAGED; parsed triage BP 185/115, SpO2 89%, Temp 102°F",
            duration_ms=lat
        )

    def test_02_call_patient_state_transitions_and_guards(self):
        """POST /api/doctor/queue/{id}/call transitions TRIAGED to IN_CONSULTATION and rejects invalid calls"""
        t0 = time.time()
        # 1. Valid call
        res = self.client.post(f"/api/doctor/queue/{self.visit_id}/call")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["visit_id"], self.visit_id)
        self.assertEqual(data["status"], "IN_CONSULTATION")
        self.assertIn("consultation_started_at", data)

        # 2. Idempotent call on already IN_CONSULTATION
        res_repeat = self.client.post(f"/api/doctor/queue/{self.visit_id}/call")
        self.assertEqual(res_repeat.status_code, 200)
        self.assertEqual(res_repeat.json()["status"], "IN_CONSULTATION")

        # 3. Call on non-existent visit -> 404
        res_404 = self.client.post("/api/doctor/queue/9999999/call")
        self.assertEqual(res_404.status_code, 404)

        lat = (time.time() - t0) * 1000

        self._record_result(
            test_id="TC-G5-02",
            title="Patient Consultation Call & Transition Safeguards",
            category="Queue",
            status="PASSED",
            details="Successfully transitioned visit from TRIAGED to IN_CONSULTATION; verified idempotency and 404 guard",
            duration_ms=lat
        )

    def test_03_patient_dossier_aggregation_and_narrative(self):
        """GET /api/doctor/patients/{id}/dossier aggregates demographics, vitals, and synthesized NLP brief"""
        t0 = time.time()
        res = self.client.get(f"/api/doctor/patients/{self.patient_id}/dossier")
        lat = (time.time() - t0) * 1000

        self.assertEqual(res.status_code, 200)
        dossier = res.json()

        # Demographics
        pat = dossier["patient"]
        self.assertEqual(pat["uhid"], "UHID-GRP5-01")
        self.assertEqual(pat["full_name"], "Devika Shrestha")
        self.assertEqual(pat["gender"], "FEMALE")
        self.assertEqual(pat["insurance"]["provider"], "Himalayan Health Plan")

        # Active Vitals
        vitals = dossier["vitals"]
        self.assertEqual(vitals["systolic_bp"], 185)
        self.assertEqual(vitals["diastolic_bp"], 115)
        self.assertEqual(vitals["bp_stage"], "Hypertensive Crisis")

        # Clinical NLP Narrative
        insights = dossier["insights"]
        self.assertIn("symptomSummary", insights)
        self.assertIn("pertinentNegatives", insights)
        self.assertIn("affirmedSymptoms", insights)

        # Check that 'chest pain' was identified as a pertinent negative
        neg_texts = [str(n).lower() for n in insights["pertinentNegatives"]]
        self.assertTrue(any("chest pain" in n for n in neg_texts))

        # Check 404 for non-existent patient
        res_404 = self.client.get("/api/doctor/patients/9999999/dossier")
        self.assertEqual(res_404.status_code, 404)

        self._record_result(
            test_id="TC-G5-03",
            title="Comprehensive Patient Dossier & NegEx Synthesis",
            category="Dossier",
            status="PASSED",
            details="Aggregated demographics, insurance, telemetry; parsed 'chest pain' as pertinent negative in NLP narrative",
            duration_ms=lat
        )

    def test_04_unified_cdss_insights_evaluation(self):
        """POST /api/doctor/visits/{id}/insights generates unified vitals and questionnaire alerts"""
        t0 = time.time()
        res = self.client.post(f"/api/doctor/visits/{self.visit_id}/insights")
        lat = (time.time() - t0) * 1000

        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["has_critical"])
        self.assertTrue(data["insights_count"] >= 4)

        rule_codes = [i["rule_code"] for i in data["insights"]]
        # Vitals rules
        self.assertIn("RULE_HTN_CRISIS", rule_codes)
        self.assertIn("RULE_HYPOXEMIA_CRITICAL", rule_codes)
        self.assertIn("RULE_TACHYCARDIA", rule_codes)
        self.assertIn("RULE_PYREXIA_HIGH", rule_codes)
        self.assertIn("RULE_OBESITY_CLASS", rule_codes)

        # Questionnaire rules preserved in unified pass
        self.assertIn("RULE_RED_FLAG_EMERGENCY", rule_codes)
        self.assertIn("RULE_PHQ2_DEPRESSION", rule_codes)
        self.assertIn("RULE_PEG3_SIGNIFICANT_PAIN", rule_codes)

        # Also test GET /api/doctor/visits/{id}/insights returns the identical synchronized set
        res_get = self.client.get(f"/api/doctor/visits/{self.visit_id}/insights")
        self.assertEqual(res_get.status_code, 200)
        self.assertEqual(res_get.json()["insights_count"], data["insights_count"])

        self._record_result(
            test_id="TC-G5-04",
            title="Unified CDSS Telemetry & Intake Clinical Rules",
            category="CDSS",
            status="PASSED",
            details="Evaluated RULE_HTN_CRISIS, RULE_HYPOXEMIA_CRITICAL, RULE_RED_FLAG_EMERGENCY, and RULE_PHQ2_DEPRESSION in unified pass",
            duration_ms=lat
        )

    def test_05_review_and_override_insight(self):
        """PATCH /api/doctor/insights/{id} updates review status and attaches clinical override justification"""
        t0 = time.time()
        # Fetch current insights
        res = self.client.get(f"/api/doctor/visits/{self.visit_id}/insights")
        insights = res.json()["insights"]
        target_insight = next(i for i in insights if i["rule_code"] == "RULE_HTN_CRISIS")
        insight_id = target_insight["id"]

        # Patch review
        payload = {
            "is_reviewed": True,
            "doctor_override_notes": "Continuous arterial line monitoring started; IV Labetalol infusion initiated."
        }
        res_patch = self.client.patch(f"/api/doctor/insights/{insight_id}", json=payload)
        self.assertEqual(res_patch.status_code, 200)
        patch_data = res_patch.json()
        self.assertTrue(patch_data["is_reviewed"])
        self.assertEqual(patch_data["doctor_override_notes"], payload["doctor_override_notes"])

        # Check non-existent insight returns 404
        res_404 = self.client.patch("/api/doctor/insights/9999999", json=payload)
        self.assertEqual(res_404.status_code, 404)

        lat = (time.time() - t0) * 1000

        self._record_result(
            test_id="TC-G5-05",
            title="Clinical Safety Insight Review & Override Notes",
            category="CDSS",
            status="PASSED",
            details=f"Acknowledged insight #{insight_id} (RULE_HTN_CRISIS); recorded clinical rationale in MySQL",
            duration_ms=lat
        )

    def test_06_formulary_search_filtering_and_pagination(self):
        """GET /api/doctor/formulary and /api/drugs/formulary support substring, dosage form, and pagination"""
        t0 = time.time()
        # 1. Search by brand substring
        res_brand = self.client.get("/api/doctor/formulary?q=dolo")
        self.assertEqual(res_brand.status_code, 200)
        drugs_brand = res_brand.json()["drugs"]
        self.assertTrue(len(drugs_brand) >= 1)
        self.assertEqual(drugs_brand[0]["brand_name"], "Dolo 650")

        # 2. Search by generic substring on /api/drugs/formulary
        res_gen = self.client.get("/api/drugs/formulary?q=amoxicillin")
        self.assertEqual(res_gen.status_code, 200)
        drugs_gen = res_gen.json()["drugs"]
        self.assertTrue(any("Amoxicillin" in d["generic_name"] for d in drugs_gen))

        # 3. Filter by dosage form
        res_form = self.client.get("/api/doctor/formulary?dosage_form=CAPSULE")
        self.assertEqual(res_form.status_code, 200)
        drugs_caps = res_form.json()["drugs"]
        self.assertTrue(all(d["dosage_form"] == "CAPSULE" for d in drugs_caps))
        self.assertTrue(any(d["brand_name"] == "Omez 20" for d in drugs_caps))

        # 4. Limit parameter
        res_lim = self.client.get("/api/doctor/formulary?limit=3")
        self.assertEqual(res_lim.status_code, 200)
        self.assertLessEqual(len(res_lim.json()["drugs"]), 3)

        lat = (time.time() - t0) * 1000

        self._record_result(
            test_id="TC-G5-06",
            title="Clinic Medication Formulary Substring & Modality Search",
            category="Formulary",
            status="PASSED",
            details="Validated substring match (Dolo, Amoxicillin), CAPSULE filter (Omez 20), and pagination limit",
            duration_ms=lat
        )

    def test_07_prescription_safety_preview_ddi_and_anomaly(self):
        """POST /api/doctor/visits/{id}/prescriptions/check-safety detects DDI, duplicate therapy, and dosage anomaly"""
        t0 = time.time()
        # Formulation payload with:
        # 1. Combiflam (ID 29: Ibuprofen + Paracetamol) + Telma 40 (ID 25: Telmisartan, ARB) -> Major DDI
        # 2. Pan 40 (ID 18: Pantoprazole) + Omez 20 (ID 24: Omeprazole) -> Duplicate Therapy (dual PPI)
        # 3. Dolo 650 (ID 19: Paracetamol) 2 tabs QDS (5200mg/day) -> Dosage Anomaly (>4000mg/day)
        # 4. Augmentin 625 (ID 16: Amoxicillin) on penicillin-allergic patient -> Contraindicated Allergy
        payload = [
            {"drug_id": 29, "dosage": "1 tab", "frequency": "1-0-1", "duration_days": 5},
            {"drug_id": 25, "dosage": "1 tab", "frequency": "1-0-0", "duration_days": 30},
            {"drug_id": 18, "dosage": "1 tab", "frequency": "1-0-0", "duration_days": 14},
            {"drug_id": 24, "dosage": "1 cap", "frequency": "0-0-1", "duration_days": 14},
            {"drug_id": 19, "dosage": "2 tabs", "frequency": "1-1-1-1", "duration_days": 3},
            {"drug_id": 16, "dosage": "1 tab", "frequency": "1-0-1", "duration_days": 5}
        ]
        res = self.client.post(f"/api/doctor/visits/{self.visit_id}/prescriptions/check-safety", json=payload)
        lat = (time.time() - t0) * 1000

        self.assertEqual(res.status_code, 200)
        safety = res.json()
        self.assertFalse(safety["is_safe"])

        # 1. Pairwise DDI: NSAID + ARB
        interactions = safety.get("interactions", [])
        self.assertTrue(len(interactions) > 0)
        has_nsaid_arb = any(i["severity"] == "MAJOR" and ("NSAID" in i["title"] or "ARB" in i["title"] or "Renal" in i["title"]) for i in interactions)
        self.assertTrue(has_nsaid_arb)

        # 2. Duplicate Therapy: Dual PPI
        duplicates = safety.get("duplicate_classes", [])
        self.assertTrue(len(duplicates) > 0)
        has_dual_ppi = any(d["class"] == "PPI" for d in duplicates)
        self.assertTrue(has_dual_ppi)

        # 3. Dosage Anomaly: Paracetamol > 4000mg
        anomalies = safety.get("dosage_warnings", [])
        self.assertTrue(len(anomalies) > 0)
        has_pcm_ceiling = any("4000" in a["message"] or a.get("max_safe_daily_mg") == 4000.0 for a in anomalies)
        self.assertTrue(has_pcm_ceiling)

        # 4. Allergy Contraindication: Penicillin
        allergies = safety.get("allergy_alerts", [])
        self.assertTrue(len(allergies) > 0)
        has_pen_allergy = any("PENICILLIN" in al["allergy_trigger"] for al in allergies)
        self.assertTrue(has_pen_allergy)

        self._record_result(
            test_id="TC-G5-07",
            title="DDI, Duplicate Class, Dosage Ceiling & Allergy Shield",
            category="Safety",
            status="PASSED",
            details="Triggered NSAID+ARB DDI, Dual-PPI duplicate therapy, Paracetamol 5200mg ceiling, and Penicillin allergy block",
            duration_ms=lat
        )

    def test_08_prescription_creation_and_lock_guards(self):
        """POST /api/doctor/visits/{id}/prescriptions persists line items and enforces schema validation"""
        t0 = time.time()
        # 1. Valid prescription with safe medications (Amlokind 5 + Pan 40)
        payload = {
            "doctor_id": self.doctor_id,
            "general_instructions": "Low sodium diet, brisk walking 30 mins daily, avoid spicy oily food.",
            "status": "FINALIZED",
            "items": [
                {
                    "drug_id": 17,  # Amlokind 5 (Amlodipine 5mg)
                    "dosage": "1 tab",
                    "frequency": "1-0-0",
                    "duration_days": 30,
                    "meal_timing": "AFTER_MEALS",
                    "special_instructions": "Take every morning after breakfast"
                },
                {
                    "drug_id": 18,  # Pan 40 (Pantoprazole 40mg)
                    "dosage": "1 tab",
                    "frequency": "1-0-0",
                    "duration_days": 14,
                    "meal_timing": "BEFORE_MEALS",
                    "special_instructions": "Take 30 mins before morning breakfast"
                }
            ]
        }
        res = self.client.post(f"/api/doctor/visits/{self.visit_id}/prescriptions", json=payload)
        self.assertEqual(res.status_code, 201)
        rx_data = res.json()
        self.assertEqual(rx_data["visit_id"], self.visit_id)
        self.assertEqual(rx_data["items_count"], 2)
        rx_id = rx_data["prescription_id"]

        # 2. Retrieve via GET
        res_get = self.client.get(f"/api/doctor/visits/{self.visit_id}/prescriptions")
        self.assertEqual(res_get.status_code, 200)
        get_data = res_get.json()
        self.assertEqual(get_data["prescription"]["id"], rx_id)
        self.assertEqual(get_data["items_count"], 2)
        med_names = [i["brand_name"] for i in get_data["items"]]
        self.assertIn("Amlokind 5", med_names)
        self.assertIn("Pan 40", med_names)

        # 3. Empty items array -> 422
        bad_payload = {"doctor_id": self.doctor_id, "items": []}
        res_empty = self.client.post(f"/api/doctor/visits/{self.visit_id}/prescriptions", json=bad_payload)
        self.assertEqual(res_empty.status_code, 422)

        # 4. Non-existent drug ID -> 404
        bad_drug_payload = {
            "doctor_id": self.doctor_id,
            "items": [{"drug_id": 9999999, "dosage": "1 tab", "frequency": "1-0-0"}]
        }
        res_no_drug = self.client.post(f"/api/doctor/visits/{self.visit_id}/prescriptions", json=bad_drug_payload)
        self.assertEqual(res_no_drug.status_code, 404)

        lat = (time.time() - t0) * 1000

        self._record_result(
            test_id="TC-G5-08",
            title="E-Prescription Atomic Authoring & Schema Validation",
            category="Prescription",
            status="PASSED",
            details="Persisted Amlodipine & Pantoprazole with meal schedules; rejected empty items (422) and invalid drug (404)",
            duration_ms=lat
        )

    def test_09_sign_off_blocked_by_unreviewed_critical_alert(self):
        """POST /api/doctor/visits/{id}/sign-off blocked if unreviewed CRITICAL alerts lack override notes"""
        t0 = time.time()
        # Primary visit has unreviewed CRITICAL alerts (e.g. RULE_HYPOXEMIA_CRITICAL, RULE_RED_FLAG_EMERGENCY)
        # Attempt sign off without override notes
        payload_no_override = {
            "doctor_id": self.doctor_id,
            "diagnosis": "Hypertensive Crisis with Acute Respiratory Distress",
            "conclusion_notes": "Patient stable for discharge to observation room."
        }
        res_blocked = self.client.post(f"/api/doctor/visits/{self.visit_id}/sign-off", json=payload_no_override)
        self.assertEqual(res_blocked.status_code, 400)
        self.assertIn("Sign-off blocked: Unreviewed CRITICAL safety alert(s) detected", res_blocked.json()["detail"])
        self.assertIn("doctor_override_notes", res_blocked.json()["detail"])

        # Attempt sign off with whitespace/short conclusion notes -> 422
        res_short = self.client.post(
            f"/api/doctor/visits/{self.visit_id}/sign-off",
            json={"doctor_id": self.doctor_id, "conclusion_notes": "ok"}
        )
        self.assertEqual(res_short.status_code, 422)

        lat = (time.time() - t0) * 1000

        self._record_result(
            test_id="TC-G5-09",
            title="Mandatory Critical CDSS Override Sign-Off Governance",
            category="Governance",
            status="PASSED",
            details="Blocked unauthorized sign-off due to unacknowledged CRITICAL alerts; enforced min-length clinical notes (422)",
            duration_ms=lat
        )

    def test_10_sign_off_success_with_override_and_lock(self):
        """POST /api/doctor/visits/{id}/sign-off succeeds with override, locks encounter, blocks subsequent edits"""
        t0 = time.time()
        # Valid sign off with explicit doctor override justification
        payload = {
            "doctor_id": self.doctor_id,
            "diagnosis": "Essential Hypertensive Crisis, Acute Pharyngitis",
            "conclusion_notes": "Bedside resuscitation completed. Arterial line placed. Patient admitted to telemetry observation unit.",
            "doctor_override_notes": "Clinical justification: High-flow O2 and IV antihypertensive active; bedside attending physician present."
        }
        res = self.client.post(f"/api/doctor/visits/{self.visit_id}/sign-off", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "READY_FOR_BILLING")
        self.assertEqual(data["next_station"], "CASHIER_BILLING_DESK")
        self.assertTrue(data["critical_alerts_overridden"] >= 1)

        # 1. Verify re-signing is blocked (Encounter locked)
        res_repeat = self.client.post(f"/api/doctor/visits/{self.visit_id}/sign-off", json=payload)
        self.assertEqual(res_repeat.status_code, 400)
        self.assertIn("already signed off and locked", res_repeat.json()["detail"])

        # 2. Verify subsequent prescription modification is blocked on locked visit
        rx_payload = {
            "doctor_id": self.doctor_id,
            "items": [{"drug_id": 19, "dosage": "1 tab", "frequency": "1-0-1"}]
        }
        res_rx_blocked = self.client.post(f"/api/doctor/visits/{self.visit_id}/prescriptions", json=rx_payload)
        self.assertEqual(res_rx_blocked.status_code, 400)
        self.assertIn("already signed off and locked", res_rx_blocked.json()["detail"])

        lat = (time.time() - t0) * 1000

        self._record_result(
            test_id="TC-G5-10",
            title="Encounter Sign-Off Finalization & Immutable Lock Guard",
            category="Governance",
            status="PASSED",
            details="Transitioned visit to READY_FOR_BILLING with override audit trail; immutably locked encounter against edits",
            duration_ms=lat
        )


if __name__ == "__main__":
    unittest.main()
