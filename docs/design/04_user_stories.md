# User Stories Specification: HealthOS Modular AI SaaS

## Epic 1: Multi-Tenant Onboarding & Service Rental (Entitlement Engine)

| ID | As a... | I want to... | So that... | Priority | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-TEN-01** | Platform Superadmin | provision a new hospital or clinic organization with selectable module subscriptions | the client can immediately access only the specific services they agreed to rent. | P0 (Must Have) | Ready for Review |
| **US-TEN-02** | Hospital IT Director | generate a scoped API Key restricted strictly to `AI_SCRIBE` and `AI_CDSS` modules | our existing hospital EHR can consume those two microservices without accessing unrented systems. | P0 (Must Have) | Ready for Review |
| **US-TEN-03** | Clinic Administrator | manage staff accounts and assign clinical roles (`DOCTOR`, `NURSE`, `RECEPTIONIST`) | users only see permissions and workflows appropriate to their operational duties. | P0 (Must Have) | Ready for Review |
| **US-TEN-04** | Hospital Billing Lead | view real-time usage meters for audio minutes transcribed and LLM tokens consumed | our organization has full transparency into our monthly variable usage bill. | P1 (Should Have) | Ready for Review |

---

## Epic 2: Ambient AI Clinical Scribe

| ID | As a... | I want to... | So that... | Priority | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-SCR-01** | Outpatient Doctor | start ambient audio capture with a single click during a patient consultation | I can focus 100% on examining and talking to the patient without typing notes manually. | P0 (Must Have) | Ready for Review |
| **US-SCR-02** | Outpatient Doctor | see live streaming transcription and speaker separation (Doctor vs Patient) | I have visual reassurance that the audio stream is accurately capturing clinical dialogue. | P1 (Should Have) | Ready for Review |
| **US-SCR-03** | Outpatient Doctor | review an auto-generated structured SOAP note immediately after ending the session | I can quickly make edits, review extracted ICD-10 codes, and electronically sign the encounter. | P0 (Must Have) | Ready for Review |
| **US-SCR-04** | Clinic Compliance Officer | enable "Zero-Retention Audio Mode" for our tenant | no raw patient consultation audio files are permanently saved to disk, preserving strict privacy. | P0 (Must Have) | Ready for Review |

---

## Epic 3: AI Clinical Decision Support (CDSS)

| ID | As a... | I want to... | So that... | Priority | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-CDS-01** | Attending Physician | receive an immediate critical alert if entered vitals indicate a hypertensive crisis or severe hypoxemia | I can intervene with acute emergency protocols before discharging the patient. | P0 (Must Have) | Ready for Review |
| **US-CDS-02** | Prescribing Doctor | be warned of dangerous drug-drug interactions when adding a new medication to a patient's prescription | I prevent adverse drug events and medication errors. | P0 (Must Have) | Ready for Review |
| **US-CDS-03** | Junior Physician | view evidence-based differential diagnosis suggestions based on reported symptoms and lab findings | I can consider less common diagnostic possibilities with linked clinical guidelines. | P1 (Should Have) | Ready for Review |
| **US-CDS-04** | Medical Auditor | view a log of all CDSS alerts accepted, dismissed, or overridden by physicians with rationale | the hospital can audit clinical adherence and safety metrics. | P1 (Should Have) | Ready for Review |

---

## Epic 4: Conversational AI Patient Intake & Triage

| ID | As a... | I want to... | So that... | Priority | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-INT-01** | Walk-in Patient | scan a QR code in the waiting room and complete a symptom questionnaire in my native language | I don't have to wait in a crowded front-desk line or fill out paper forms. | P0 (Must Have) | Ready for Review |
| **US-INT-02** | Triage Nurse | receive an automated Emergency Severity Index (ESI) acuity score for incoming walk-in patients | high-acuity, unstable patients are immediately flagged and prioritized ahead of routine cases. | P0 (Must Have) | Ready for Review |
| **US-INT-03** | Consulting Doctor | view a synthesized pre-consultation summary card before the patient steps into my office | I understand the patient's chief complaint, duration, and symptom chronology in 10 seconds. | P0 (Must Have) | Ready for Review |

---

## Epic 5: Medical Document & Lab RAG Intelligence

| ID | As a... | I want to... | So that... | Priority | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-DOC-01** | Clinic Staff | upload past lab test PDFs and discharge summaries into a patient's profile | the system automatically extracts biomarkers (e.g., HbA1c, Creatinine) into structured longitudinal trends. | P0 (Must Have) | Ready for Review |
| **US-DOC-02** | Specialist Doctor | ask natural-language questions about a patient's historical medical records with clickable PDF citations | I can locate critical historical biopsy or surgery notes without opening dozens of PDF attachments. | P1 (Should Have) | Ready for Review |

---

## Epic 6: Smart Billing, Coding Audit & Revenue Cycle

| ID | As a... | I want to... | So that... | Priority | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-BIL-01** | Cashier | generate an itemized patient invoice from doctor consultation orders and diagnostic tariffs | the patient receives an accurate, compliant bill with instant UPI/Card/Cash receipt generation. | P0 (Must Have) | Ready for Review |
| **US-BIL-02** | Medical Coder | receive automated AI coding audit alerts highlighting unbilled procedures mentioned in the doctor's note | the clinic captures legitimate revenue that would have otherwise been missed. | P0 (Must Have) | Ready for Review |
| **US-BIL-03** | Insurance Coordinator | see an automated Claim Denial Risk score before submitting a claim to an insurer | we can fix missing pre-authorizations or mismatched ICD codes before receiving a costly rejection. | P1 (Should Have) | Ready for Review |

---

## Epic 7: Enterprise Interoperability via HL7 FHIR R4

| ID | As a... | I want to... | So that... | Priority | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-FHR-01** | Hospital EHR Developer | send an HL7 FHIR R4 `Encounter` to the Scribe Service and receive a signed `DocumentReference` | our enterprise hospital uses the AI Scribe inside our existing Epic/Cerner environment seamlessly. | P0 (Must Have) | Ready for Review |
| **US-FHR-02** | Hospital Integration Lead | invoke the CDSS service via standard CDS Hooks (`medication-prescribe`) | our hospital physicians get real-time interaction warnings directly inside their existing EHR screen. | P1 (Should Have) | Ready for Review |
