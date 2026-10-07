# Clinic Management System (ClinicOS) &mdash; Software Engineering Methodology (SEM) Assignment

**Academic Level:** Bachelor of Engineering / Technology &mdash; Semester 6  
**Subject:** Software Engineering Methodology (SEM)  
**Project Domain:** Outpatient Department (OPD) General Physician Clinic Management  
**File Delivery Standard:** Native draw.io / diagrams.net XML Specifications  

---

## 1. Executive Summary & Problem Scope

Modern independent outpatient clinics (General Practitioners / Family Medicine) face intense operational bottlenecks during peak consulting hours. Typical paper-based or basic electronic spreadsheets suffer from:
1. **Intake Latency:** Manual typing of patient chief complaints and history leads to long queues.
2. **Disconnected Diagnostics:** Diagnostic artifacts (such as resting ECG strips, DICOM X-ray files, and lab blood panels) arrive as disjointed papers or WhatsApp attachments, failing to integrate into the electronic encounter.
3. **Clinical Decision Fatigue:** Critical triage vital anomalies (e.g., stage-1/2 hypertension, tachycardia, hypoxemia) and drug-allergy contraindications get overlooked in high-volume general practice.
4. **Billing Friction:** Delays in reconciling physician consulting fees, test orders, and basic cashless/insurance copay deductions.

**ClinicOS** resolves these issues through a lean, three-tiered clinical workflow:
- **Reception Desk:** Rapid demographic registration, automated triage vital capture (BP, Pulse, SpO2, Temp, BMI), speech-to-text (voice-enabled) questionnaire intake, queuing token allocation, and external diagnostic report ingestion (DICOM / ECG / Lab PDFs).
- **Doctor Consultation Desk:** Longitudinal encounter review, synchronized DICOM/ECG inspection, deterministic rules engine (alerting on vital thresholds and drug-allergy contraindications without black-box AI risk), formulary-guided drug recommendations, and physician insight sign-off.
- **Cashier Desk:** Real-time itemized invoice compilation, simple cashless/insurance policy verification with copay deduction, and multi-mode payment settlement (Cash, UPI, Card).

---

## 2. Directory Manifest & Generated Artifacts

All diagrams are provided in clean, standard **draw.io / diagrams.net XML format** in this directory:

| Filename | Diagram Type | Scope / Coverage |
| :--- | :--- | :--- |
| `01_use_case_diagram.xml` | UML Use Case Diagram | 4 Human Actors, 1 System Actor, 3 Subsystem Packages, 15 Use Cases (`<<include>>`, `<<extend>>`) |
| `02_class_diagram.xml` | UML Class Diagram | 16 Domain Classes with full attributes, visibility, operations, inheritance, and compositions |
| `03_sequence_diagrams.xml` | UML Sequence Diagrams | 3 End-to-End Lifeline Workflows (Reception Triage, Doctor Consultation, Cashier Billing) |
| `04_dfd_level_0.xml` | DFD Level 0 (Context Diagram) | System boundary, 5 External Entities, Central Process 0.0, balanced data flows |
| `05_dfd_level_1.xml` | DFD Level 1 Decomposition | 6 Major System Processes, 8 Data Stores (D1–D8), comprehensive interconnects |
| `06_dfd_level_2.xml` | DFD Level 2 Detailed Explosions | Decompositions of Process 1.0 (Registration), Process 4.0 (Consultation), Process 6.0 (Billing) |
| `07_er_diagram_mysql.xml` | Relational ER Diagram | MySQL 8.0 schema with 13 Normalized Tables, PKs, FKs, Datatypes, and Crow's Foot notations |
| `all_clinic_diagrams_master.drawio` | **Master Multi-Tab Draw.io** | Single file containing all 7 diagrams above as navigable tabs in draw.io |
| `all_clinic_diagrams_master.xml` | **Master Multi-Tab XML** | XML duplicate of the master `.drawio` file for maximum compatibility |
| `mysql_schema.sql` | Executable Database DDL | Production-ready MySQL script with tables, constraints, foreign keys, indexes, and test seeds |
| `README_DIAGRAMS.md` | Academic Documentation | This comprehensive submission specification and system manual |

---

## 3. Detailed Technical Analysis of Diagrams

### 3.1 UML Use Case Diagram (`01_use_case_diagram.xml`)
- **Primary Actors:**
  - **Receptionist:** Conducts registration, measures and inputs triage vitals, operates voice-enabled intake questionnaire, manages live queue tokens, and uploads external diagnostic reports.
  - **Patient:** Provides identification, verbally states symptoms during voice intake, and tenders payment at cashier.
  - **Doctor (General Physician):** Retrieves medical history, reviews past visit conclusions and external ECG/DICOM reports, triggers deterministic rules evaluation, overrides/signs clinical insights, and issues finalized electronic prescriptions.
  - **Cashier:** Retrieves visit service ledger, verifies cashless/insurance policies, records multi-mode payment, and issues official receipts.
- **Secondary Actor:**
  - **Deterministic Clinical Rules Engine:** Automated rules evaluation service executing threshold tests and drug safety validation without requiring opaque AI models.
- **Key Relationships:**
  - `UC03: Conduct Voice-Enabled Intake Questionnaire` &laquo;include&raquo; `UC03a: Transcribe Audio via STT` and `UC03b: Auto-Extract Chief Complaints`.
  - `UC08: Run Deterministic Rules Engine` &laquo;include&raquo; `UC08a: Check Vital Thresholds` and `UC08b: Screen Drug Allergies`.
  - `UC13: Verify Cashless Policy` &laquo;extend&raquo; `UC13a: Apply Copay & Policy Deductible`.

---

### 3.2 UML Class Diagram (`02_class_diagram.xml`)
- **Inheritance Hierarchy:**
  - Abstract base class `User` encapsulates authentication credentials, roles, and timestamps.
  - Specializations: `Receptionist` (desk location, intake operations), `Doctor` (medical license, clinical methods), `Cashier` (counter id, settlement methods).
- **Core Entity Aggregations & Compositions:**
  - `Patient (1) *--- (0..*) Visit`: A patient has zero or more lifetime encounters.
  - `Visit (1) *--- (1) VitalSign`: Every encounter possesses exactly one mandatory vital sign record.
  - `Visit (1) *--- (0..1) IntakeQuestionnaire`: Encapsulates speech-to-text transcript and triage complaint parameters.
  - `Visit (1) *--- (0..*) ExternalReport`: Stores DICOM, resting ECG strips, and lab bloodwork records.
  - `Visit (1) *--- (0..*) DeterministicInsight`: Captures rules engine outputs (HTN staging, allergy warnings).
  - `Visit (1) *--- (0..1) Prescription`: Attending doctor's approved outpatient prescription.
  - `Prescription (1) *--- (1..*) PrescriptionItem`: Itemized medications tied to `DrugFormulary`.
  - `Visit (1) *--- (1) Bill`: Itemized invoice containing `BillItem` and `Payment` ledgers.

---

### 3.3 UML Sequence Diagrams (`03_sequence_diagrams.xml`)
Structured into three side-by-side execution lifelines:
1. **Sequence 1: Patient Check-in, Triage & Voice Intake**
   - Trace: `Patient` $ightarrow$ `Receptionist` $ightarrow$ `:ReceptionUI` $ightarrow$ `:VoiceSTTService` $ightarrow$ `:ReportStorage` $ightarrow$ `:ClinicDatabase`.
   - Captures arrival, manual vitals recording, real-time voice streaming to STT parser, multi-file upload (DICOM/ECG), and atomic queue token `#Q-104` generation.
2. **Sequence 2: Physician Consultation & Deterministic Decision Support**
   - Trace: `Doctor` $ightarrow$ `:DoctorUI` $ightarrow$ `:DeterministicEngine` $ightarrow$ `:FormularyService` $ightarrow$ `:ClinicDatabase`.
   - Captures queue token selection, longitudinal record fetching, evaluation of vital thresholds (Stage 1 HTN alert), allergy screening against beta-lactams, filtered formulary selection, doctor review/sign-off, and electronic prescription generation.
3. **Sequence 3: Cashier Itemized Billing & Settlement**
   - Trace: `Patient` $ightarrow$ `Cashier` $ightarrow$ `:CashierUI` $ightarrow$ `:BillingService` $ightarrow$ `:PolicyVerifier` $ightarrow$ `:PaymentGateway` $ightarrow$ `:ClinicDatabase`.
   - Captures visit charge lookup ($1,200.00 gross), cashless policy eligibility verification ($960.00 covered), copay balance calculation ($240.00 due), UPI/Card payment authorization, and encounter status transition to `COMPLETED`.

---

### 3.4 Data Flow Diagrams (DFD Level 0, Level 1, Level 2)

#### DFD Level 0 &mdash; Context Diagram (`04_dfd_level_0.xml`)
- Enforces strict Software Engineering conventions: Process `0.0` represents the holistic system boundary.
- Interacts strictly with external environmental entities: `PATIENT`, `RECEPTIONIST`, `DOCTOR`, `CASHIER`, and `DIAGNOSTIC LAB`.
- Proves zero data store leakage at Context Level.

#### DFD Level 1 &mdash; Subsystem Decomposition (`05_dfd_level_1.xml`)
Decomposes the system into 6 discrete functional processes:
- `1.0 Patient Registration & Triage Vitals`
- `2.0 Voice Intake & Questionnaire Processing`
- `3.0 External Report Upload & Archival`
- `4.0 Doctor Consultation & Deterministic Rules Engine`
- `5.0 Formulary Lookup & Prescription Issuance`
- `6.0 Itemized Billing & Payment Settlement`
Connected across 8 institutional data stores:
- `D1: Patients Master`
- `D2: Visits & Queue Store`
- `D3: Vital Signs Store`
- `D4: Intake Questionnaires Store`
- `D5: External Reports Store`
- `D6: Drug Formulary Store`
- `D7: Prescriptions Store`
- `D8: Billing & Payments Store`

#### DFD Level 2 &mdash; Sub-Process Explosions (`06_dfd_level_2.xml`)
Explodes the three most critical operational processes:
- **Process 1.0 Explosion:**
  - `1.1 Verify Existing / Create Patient Record` (queries/writes to `D1`)
  - `1.2 Measure & Validate Triage Vitals` (writes to `D3`)
  - `1.3 Allocate OPD Token & Route to Queue` (writes to `D2`)
- **Process 4.0 Explosion:**
  - `4.1 Retrieve Longitudinal History & Reports` (reads `D1`, `D5`)
  - `4.2 Execute Deterministic Clinical Rules Engine` (reads `D3`, `D4`)
  - `4.3 Synthesize Guideline Insights & Drug Recommendations` (reads `D6`)
  - `4.4 Doctor Review Findings & Sign Encounter Conclusion` (writes `D7`, `D2`)
- **Process 6.0 Explosion:**
  - `6.1 Aggregate Service Line Items` (Consultation + Diagnostics)
  - `6.2 Validate Cashless Policy & Apply Copay Deduction`
  - `6.3 Process Multi-Mode Payment & Issue Official Receipt` (writes `D8`)

---

### 3.5 MySQL Relational ER Diagram (`07_er_diagram_mysql.xml`)
- Complies with Third Normal Form (3NF).
- Features 13 normalized tables with Crow's Foot connectors, explicit Primary Keys (PK), Foreign Keys (FK), and InnoDB referential integrity constraints.
- Foreign Key cascades (`ON DELETE CASCADE` for child encounter rows like `vital_signs`, `intake_questionnaires`, `bill_items`; `ON DELETE RESTRICT` for master tables like `patients`, `users`, `drug_formulary`).

---

## 4. Comprehensive Data Dictionary

| Table Name | Column Name | Data Type | Nullable | Key | Constraints & Business Logic |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **users** | id | INT AUTO_INCREMENT | NO | PK | System User Surrogate Identifier |
| | username | VARCHAR(50) | NO | UNIQUE | Alphanumeric login handle |
| | password_hash | VARCHAR(255) | NO | &mdash; | Bcrypt cryptographic password digest |
| | role | ENUM | NO | &mdash; | `'RECEPTIONIST'`, `'DOCTOR'`, `'CASHIER'`, `'ADMIN'` |
| | is_active | TINYINT(1) | NO | &mdash; | Default 1; soft-delete switch |
| **patients** | id | INT AUTO_INCREMENT | NO | PK | Internal Patient Key |
| | uhid | VARCHAR(30) | NO | UNIQUE | Unique Hospital Identification code (e.g., `UHID-2026-00104`) |
| | dob | DATE | NO | &mdash; | Date of birth for precise age derivation |
| | blood_group | ENUM | YES | &mdash; | Standard ABO/Rh blood group system |
| **visits** | id | INT AUTO_INCREMENT | NO | PK | Outpatient encounter key |
| | patient_id | INT | NO | FK | References `patients(id)` |
| | doctor_id | INT | YES | FK | References `users(id)`; attending physician |
| | queue_token | VARCHAR(20) | NO | &mdash; | Daily queue identifier (e.g., `Q-104`) |
| | status | ENUM | NO | &mdash; | `'REGISTERED'`, `'TRIAGED'`, `'IN_CONSULTATION'`, `'CONSULTED'`, `'BILLED'`, `'COMPLETED'`, `'CANCELLED'` |
| **vital_signs** | id | INT AUTO_INCREMENT | NO | PK | Vital sign record key |
| | visit_id | INT | NO | FK | 1:1 Foreign key referencing `visits(id)` |
| | systolic_bp | INT | NO | &mdash; | Systolic Blood Pressure in mmHg ($60 \le x \le 260$) |
| | diastolic_bp | INT | NO | &mdash; | Diastolic Blood Pressure in mmHg ($40 \le x \le 160$) |
| | pulse_rate | INT | NO | &mdash; | Heart beats per minute ($30 \le x \le 220$) |
| | temperature_f | DECIMAL(4,1) | NO | &mdash; | Body temperature ($94.0 \le x \le 108.0$) |
| | bmi | DECIMAL(4,1) | NO | &mdash; | Computed as $	ext{weight (kg)} / (	ext{height (m)})^2$ |
| **intake_questionnaires** | id | INT AUTO_INCREMENT | NO | PK | Intake questionnaire key |
| | voice_audio_url | VARCHAR(500) | YES | &mdash; | Web URI to audio intake recording |
| | transcript_text | TEXT | YES | &mdash; | Speech-to-text verbatim transcript |
| | severity_scale | INT | NO | &mdash; | Visual Analogue Scale (1 to 10) |
| **external_reports** | id | INT AUTO_INCREMENT | NO | PK | Diagnostic artifact key |
| | report_type | ENUM | NO | &mdash; | `'DICOM'`, `'ECG'`, `'LAB_PDF'`, `'XRAY'`, `'OTHER'` |
| | file_path | VARCHAR(500) | NO | &mdash; | Object storage key or local file path |
| **deterministic_insights** | id | INT AUTO_INCREMENT | NO | PK | Rules engine alert key |
| | rule_code | VARCHAR(50) | NO | &mdash; | Deterministic identifier (e.g., `RULE_HTN_STAGE1`) |
| | severity_level | ENUM | NO | &mdash; | `'INFO'`, `'WARNING'`, `'CRITICAL'` |
| | is_signed | TINYINT(1) | NO | &mdash; | Set to 1 upon physician verification |
| **drug_formulary** | id | INT AUTO_INCREMENT | NO | PK | Approved clinic drug key |
| | generic_name | VARCHAR(100) | NO | &mdash; | Active pharmaceutical ingredient (API) |
| | dosage_form | ENUM | NO | &mdash; | `'TABLET'`, `'CAPSULE'`, `'SYRUP'`, `'INJECTION'`, `'OINTMENT'`, `'DROPS'` |
| **prescriptions** | id | INT AUTO_INCREMENT | NO | PK | Electronic prescription key |
| | status | ENUM | NO | &mdash; | `'DRAFT'`, `'FINALIZED'`, `'DISPENSED'` |
| **prescription_items** | id | INT AUTO_INCREMENT | NO | PK | Medication item line key |
| | drug_id | INT | NO | FK | References `drug_formulary(id)` |
| | frequency | VARCHAR(50) | NO | &mdash; | Dosing frequency (e.g., `OD`, `BD`, `TID`, `QID`, `SOS`) |
| **bills** | id | INT AUTO_INCREMENT | NO | PK | Encounter invoice key |
| | gross_amount | DECIMAL(10,2) | NO | &mdash; | Total sum of all bill items |
| | insurance_covered | DECIMAL(10,2) | NO | &mdash; | Sum paid by cashless policy |
| | net_amount | DECIMAL(10,2) | NO | &mdash; | Balance payable by patient copay |
| | payment_status | ENUM | NO | &mdash; | `'PENDING'`, `'PARTIAL'`, `'PAID'`, `'WAIVED'` |
| **payments** | id | INT AUTO_INCREMENT | NO | PK | Payment transaction key |
| | payment_mode | ENUM | NO | &mdash; | `'CASH'`, `'UPI'`, `'CARD'`, `'INSURANCE_DIRECT'` |
| | transaction_ref | VARCHAR(100) | NO | &mdash; | Payment reference or gateway authorization code |

---

## 5. How to Open and Convert Diagram Files

### Option A: View All Diagrams Together in One Window (Recommended)
1. Navigate to [draw.io](https://app.diagrams.net/) in any web browser or open the Draw.io Desktop application.
2. Click **Open Existing Diagram** (or `File -> Open From -> Device`).
3. Select `all_clinic_diagrams_master.drawio` (or `all_clinic_diagrams_master.xml`).
4. At the bottom of the canvas, you will see 7 distinct tabs:
   - `1. Use Case Diagram`
   - `2. Class Diagram`
   - `3. Sequence Diagrams`
   - `4. DFD Level 0 (Context)`
   - `5. DFD Level 1`
   - `6. DFD Level 2`
   - `7. Relational ER (MySQL)`

### Option B: Open Individual Diagram XML Files
- Open any individual XML file (e.g., `01_use_case_diagram.xml`, `07_er_diagram_mysql.xml`) directly in draw.io.

### Option C: Exporting to High-Resolution Images (PNG, SVG, PDF)
1. In draw.io, go to **File $ightarrow$ Export as $ightarrow$ PNG...** (or SVG / PDF).
2. Set Zoom to `200%` or `300%` for crisp, high-DPI college report printouts.
3. Check **Transparent Background** (optional) and click **Export**.

---
*Assignment documentation prepared for Semester 6 Software Engineering Methodology.*
