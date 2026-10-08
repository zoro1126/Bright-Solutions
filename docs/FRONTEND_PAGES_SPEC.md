# Bright Solutions — Frontend Pages & Role-Based UI Architecture

**Product**: Bright Solutions (General OPD Clinic Operating System)  
**Frontend Architecture**: React 18, Vite, Vanilla CSS Design System, Lucide React  
**Typography Contract**:  
- **Headings (`<h1>` through `<h6>`) & Editorial Accents**: [Libre Baskerville](https://fonts.google.com/specimen/Libre+Baskerville) (Serif)  
- **Body Copy, Buttons, Form Inputs, Tables & Labels**: [DM Sans](https://fonts.google.com/specimen/DM+Sans) (Sans-Serif)  
**Color Contract**: **Canary / Radiant Yellow Primary** (`#FFE500` / `#FACC15`), Midnight Navy Complementary (`#0A2540` / `#051A30`), Gold/Ochre Support (`#B89C14`), Vivid Red Alert (`#DC2626`)  
**Design Philosophy**: **Clean, Breathable, Purposeful.** Zero vanity metrics, zero visual clutter. Every component solves a direct clinical or administrative need.

---

## 1. System Navigation & Role-Based Information Architecture

The application is structured into four role-based portals with shared authentication and global theme controls:

```
[ Gateway: Staff Login & 1-Click Persona Portal (/login) ]
       |
       +---> [ RECEPTIONIST PORTAL ]
       |        +-- P-REC-01: Receptionist Operations Dashboard (/receptionist/dashboard)
       |        +-- P-REC-02: Patient Registration & Triage Vitals (/receptionist/intake)
       |        +-- P-REC-03: Clinical Intake Questionnaire (/receptionist/intake/questionnaire)
       |        +-- P-REC-04: External Diagnostic Reports Ingestion (/receptionist/reports)
       |        +-- P-REC-05: Live OPD Patient Queue & Token Roster (/receptionist/queue)
       |
       +---> [ DOCTOR (PHYSICIAN) PORTAL ]
       |        +-- P-DOC-01: Physician Clinical Dashboard (/doctor/dashboard)
       |        +-- P-DOC-02: Patient Longitudinal Dossier & Triage View (/doctor/patient/:id)
       |        +-- P-DOC-03: Diagnostic Media & Scans Viewer (/doctor/viewer/:visitId)
       |        +-- P-DOC-04: CDSS Safety Engine & E-Prescription Studio (/doctor/consultation/:visitId)
       |
       +---> [ CASHIER (BILLING) PORTAL ]
       |        +-- P-CSH-01: Cashier Billing Operations Dashboard (/cashier/dashboard)
       |        +-- P-CSH-02: Itemized Invoice & Insurance Copay Reconciliation (/cashier/billing/:visitId)
       |        +-- P-CSH-03: Multi-Mode Payment Tender & Official Tax Receipt (/cashier/receipt/:billId)
       |
       +---> [ HOSPITAL ADMINISTRATOR PORTAL ]
                +-- P-ADM-01: Executive Governance & Clinic Analytics Dashboard (/admin/dashboard)
                +-- P-ADM-02: Staff Provisioning & Duty Roster Management (/admin/staff)
                +-- P-ADM-03: Immutable Clinical Audit Trail & Quality Logs (/admin/audit-logs)
```

### Global Ergonomics & Clutter-Elimination Principles

To guarantee a **breathable, distraction-free environment** across all roles:

1. **Card Separation & White Space**: Minimum 24px grid gaps; cards feature generous 20px-24px internal padding so elements never collide.
2. **Strict Metric Purpose**: No vanity numbers. If a number does not trigger a decision (e.g., *call patient*, *adjust insulin*, *collect balance*), it is eliminated.
3. **Contrast Hierarchy**: Radiant Yellow (`#FACC15`) draws immediate eye focus to primary actions and alerts, grounded by rich Midnight Navy (`#0A2540`) typography.
4. **Context-Sensitive Tools**: Controls appear only when relevant to the active patient encounter, preventing tool fatigue.

---

## 2. Common / Gateway Pages

---

### P-00: Staff Gateway & Role Login Page
- **Route**: `/login`
- **Role**: All Staff & Guests
- **Primary Objective**: Secure staff authentication with zero-friction development testing.

#### Breathable Layout Wireframe (ASCII)
```
+--------------------------------------------------------------------------+
|  [Sun Icon] Bright Solutions Hospital Suite                              |
+--------------------------------------------------------------------------+
|                                                                          |
|                   +----------------------------------+                   |
|                   |   Bright Solutions Staff Portal   |                   |
|                   |   Secure Outpatient Operating OS |                   |
|                   +----------------------------------+                   |
|                   |                                  |                   |
|                   |  ⚡ 1-Click Demo Personas:       |                   |
|                   |  [ Anita Sharma - Receptionist ] |                   |
|                   |  [ Dr. Kulkarni - Physician    ] |                   |
|                   |  [ Dr. Ananya   - Consultant   ] |                   |
|                   |  [ Rahul Verma  - Cashier      ] |                   |
|                   |  [ Dr. Suresh   - Admin        ] |                   |
|                   |                                  |                   |
|                   |  --- Or Manual Credentials ---   |                   |
|                   |  Username: [___________________] |                   |
|                   |  Password: [___________________] |                   |
|                   |                                  |                   |
|                   |  [  Sign In (Yellow Button)   ]  |                   |
|                   +----------------------------------+                   |
|                                                                          |
+--------------------------------------------------------------------------+
```

#### Component Breakdown & Purpose

| Component Name | Visual Styling & Placement | Clinical / Role Purpose | Interactions & Data Bindings |
| :--- | :--- | :--- | :--- |
| **`BrandHeader`** | Center-aligned, glowing Canary Yellow sun mark with serif title `Bright Solutions`. | Establishes immediate institutional trust and clean branding. | Static visual anchor. |
| **`OneClickPersonaGrid`** | 2-column grid of pill cards with subtle border and role icons (Stethoscope, UserCheck, Shield). | Allows instant role switching in 1 click without typing passwords during busy clinic shifts or demos. | Calls `loginUser(username, 'password123')` and immediately loads target role portal. |
| **`CredentialLoginForm`** | Spacious form inputs with warm yellow focus rings (`box-shadow: 0 0 0 3px var(--yellow-glow)`). | Production-ready credentials authentication for formal staff sign-in. | Submits to `POST /api/auth/login`; persists token in `localStorage`. |
| **`SignInCTA`** | Full-width radiant yellow button (`.btn-primary`) with dark obsidian text. | Unmistakable primary submit trigger. | Disabled state with spinner while authenticating. |

---

## 3. Receptionist Portal Pages

---

### P-REC-01: Receptionist Operations Dashboard
- **Route**: `/receptionist/dashboard`
- **Role**: `RECEPTIONIST`
- **Primary Objective**: Real-time front-desk command center tracking walk-in footfall, triage backlog, and physician queue balance.

#### Breathable Layout Wireframe (ASCII)
```
+--------------------------------------------------------------------------+
| [Sun] Bright Solutions | Reception Desk 1 | [Theme: Canary] [Anita AS v] |
+--------------------------------------------------------------------------+
|                                                                          |
|  [Welcome Banner: Reception Operations Center • 4 Active Doctors Today]  |
|                                                                          |
|  +----------------+ +----------------+ +----------------+ +------------+ |
|  | Today Intake   | | Next Token     | | Avg Triage     | | Doctor     | |
|  | 42 Patients    | | Q-143          | | 3.2 mins       | | 4 Active   | |
|  +----------------+ +----------------+ +----------------+ +------------+ |
|                                                                          |
|  +-------------------------------------+ +-----------------------------+ |
|  |  GRAPH 1: Hourly Walk-In Velocity   | | GRAPH 2: Queue Balance      | |
|  |  [08:00 - 14:00 Registration Bars]  | | [Dr. Kulkarni: 6 patients]  | |
|  |  Shows peak rush hours cleanly      | | [Dr. Ananya:   4 patients]  | |
|  |                                     | | [Dr. Priya:    5 patients]  | |
|  +-------------------------------------+ +-----------------------------+ |
|                                                                          |
|  +---------------------------------------------------------------------+ |
|  |  Recent Triage Queue Feed (Last 5 Registrations with Vitals Chips)  | |
|  |  Token | UHID | Patient Name | BP | Pulse | SpO2 | Doctor | Actions | |
|  +---------------------------------------------------------------------+ |
|                                                                          |
+--------------------------------------------------------------------------+
```

#### Component Breakdown & Purpose

| Component Name | Visual Styling & Placement | Clinical / Role Purpose | Interactions & Data Bindings |
| :--- | :--- | :--- | :--- |
| **`ReceptionHeroBanner`** | Deep Midnight Navy gradient with a 3.5px yellow bottom border. | Welcomes receptionist, shows today's date, and provides instant `+ Register New Patient` CTA. | Click triggers registration flow or quick patient lookup. |
| **`IntakeVolumeCard`** | Crisp white card with bold number and Canary Yellow accent line. | Tells the receptionist exactly how many patients have been admitted today. | Displays count from `GET /api/dashboard/stats`. |
| **`NextTokenPreviewCard`** | Large font with yellow pill badge (`#Q-143`). | Eliminates token guesswork; shows the exact token number that will be handed to the next walk-in. | Polled from `GET /api/tokens/next`. |
| **`AvgTriageSpeedCard`** | Minimalist card showing average triage time (e.g., `3.2 min`). | Actionable operational benchmark so staff can see if the desk is falling behind. | Computed from intake timestamps. |
| **`HourlyWalkInBarChart`** | Breathable CSS bar chart showing hourly registrations (8 AM to 2 PM). | Helps staff anticipate lunch surges and assign relief staff during peak OPD rush hours. | Plotted dynamically from visit timestamps. |
| **`DoctorQueueBalanceChart`** | Horizontal bar distribution comparing active patients waiting per physician. | Prevents overloading one doctor while another sits idle; guides receptionist on doctor assignment. | Computed from active visits grouped by `doctor_id`. |
| **`RecentTriageStreamTable`** | Spacious table with token badges, patient name, BP stage chip, and quick `View Slip` button. | Allows receptionist to reprint slips or verify the last 5 registered patients at a glance. | Direct data binding to `recent_patients` feed. |

---

### P-REC-02: Patient Intake & Triage Registration Page
- **Route**: `/receptionist/intake`
- **Role**: `RECEPTIONIST`
- **Primary Objective**: Comprehensive walk-in patient onboarding, real-time vital signs capture, and token assignment.

#### Breathable Layout Wireframe (ASCII)
```
+--------------------------------------------------------------------------+
|  [< Back to Dashboard]  Bright Solutions • New Patient Registration      |
+--------------------------------------------------------------------------+
|                                                                          |
|  [⚡ Quick Test Presets: Normal Vitals | High BP Alert | Auto-Fill Sample]|
|                                                                          |
|  [ SECTION 1: Patient Demographics & Profile ]                           |
|  First Name: [_______]  Last Name: [_______]  DOB: [________] (Age: 48y) |
|  Gender: [Male|Female|Other]  Blood: [B+ v]   Phone: [_________________] |
|  Address: [____________________________________________________________] |
|  Assigned Doctor: [Dr. Vikram Kulkarni v]   Billing Mode: [Cash / Self]  |
|                                                                          |
|  [ SECTION 2: Clinical Triage Vitals ]                                   |
|  Systolic BP: [120] mmHg   Diastolic BP: [80] mmHg                       |
|  Pulse Rate:  [ 72] bpm    Temperature:  [98.4] °F   SpO2: [ 98] %       |
|  Weight:      [70.0] kg    Height:       [172] cm    Resp: [ 16] bpm     |
|                                                                          |
|  +--------------------------------------------------------------------+  |
|  |  LIVE CLINICAL EVALUATION:                                         |  |
|  |  AHA Blood Pressure: [Normal BP (Green Chip)]                      |  |
|  |  Computed BMI:       [23.7 kg/m² - Normal Weight (Green Badge)]    |  |
|  +--------------------------------------------------------------------+  |
|                                                                          |
|  [ Cancel Button ]             [ Confirm Registration & Issue Token ]    |
|                                                                          |
+--------------------------------------------------------------------------+
```

#### Component Breakdown & Purpose

| Component Name | Visual Styling & Placement | Clinical / Role Purpose | Interactions & Data Bindings |
| :--- | :--- | :--- | :--- |
| **`DemoPresetsBar`** | Light yellow dashed bar with quick-action chips (`⚡ Sample Patient`, `✓ Normal Vitals`, `⚠️ High BP Alert`). | Speeds up testing and allows receptionist to auto-populate standard baseline templates. | Populates form state with 1 click. |
| **`DemographicsGrid`** | 3-column breathable input grid with clean labels and clear required indicators (`*`). | Captures patient legal identity, auto-computes age from DOB, and binds contact information. | Validates phone number format and non-empty name fields. |
| **`DoctorAssignmentDropdown`** | Styled select with doctor's full name and department (Internal Med, Cardiology). | Assigns patient directly to an active on-duty physician. | Fetched dynamically from `GET /api/doctors`. |
| **`LiveBmiCalculatorBadge`** | Dynamic card displaying computed BMI ($\text{kg/m}^2$) and color-coded status badge. | Eliminates manual math; gives receptionist and doctor instant obesity/malnutrition alerts. | Updates in real-time as Height and Weight are keyed in. |
| **`LiveAhaBpStageGauge`** | Dynamic badge showing AHA 2017 stage (*Normal*, *Elevated*, *Stage 1*, *Stage 2*, *Crisis*). | Immediately flags dangerously high BP (>180/120) with a pulsing red crisis chip for fast-tracking. | Updates in real-time as Systolic/Diastolic inputs change. |
| **`ConfirmRegistrationCTA`** | Large radiant Canary Yellow button with CheckCircle icon. | Commits patient to database, assigns sequential token, and displays printable slip. | Submits payload to `POST /api/patients`. |

---

### P-REC-03: Clinical Intake Questionnaire Page (MCQ & Voice-Assisted)
- **Route**: `/receptionist/intake/questionnaire`
- **Role**: `RECEPTIONIST`
- **Primary Objective**: Structured anamnesis intake via standardized Multiple-Choice Questions ($Q_1, Q_2, Q_3 \dots Q_{20}$), where each selected option is stored as an integer index (`0, 1, 2, 3...`) in dedicated DB columns (`q1, q2, q3...`), with optional voice-to-text dictation.

> [!NOTE]
> **Dynamic & Unfinalized Questionnaire Architecture**:
> Because the specific clinical questions are not yet finalized, the UI renders questions dynamically into a standardized card grid where selecting any radio option records its numerical index (`0, 1, 2, 3...`) into corresponding database columns (`q1, q2, q3...`). This avoids hardcoding question fields and allows future clinical updates without modifying database tables.

#### Breathable Layout Wireframe (ASCII)
```
+--------------------------------------------------------------------------+
|  Token #Q-102: Ramesh Patel (UHID-2026-00002)   [ Progress: 8/12 ] [ 🎤 ] |
+--------------------------------------------------------------------------+
|                                                                          |
|  +----------------------------------+ +--------------------------------+ |
|  | Q1: Primary Symptom Severity     | | Q2: Onset Duration             | |
|  | (o) 0 - None / Asymptomatic      | | (o) 0 - Today (< 24 hrs)       | |
|  | ( ) 1 - Mild discomfort          | | ( ) 1 - 2 to 3 days            | |
|  | ( ) 2 - Moderate impairment      | | ( ) 2 - 1 to 2 weeks           | |
|  | ( ) 3 - Severe acute distress    | | ( ) 3 - Chronic (> 1 month)    | |
|  +----------------------------------+ +--------------------------------+ |
|                                                                          |
|  +----------------------------------+ +--------------------------------+ |
|  | Q3: Associated Fever             | | Q4: Known Drug Allergy Flag    | |
|  | (o) 0 - No fever                 | | (o) 0 - NKDA (No Known)        | |
|  | ( ) 1 - Low grade (<100°F)       | | ( ) 1 - Penicillin / Beta-lact | |
|  | ( ) 2 - Moderate (100°-102°F)    | | ( ) 2 - Sulfa / Sulfonamides   | |
|  | ( ) 3 - High grade (>102°F)      | | ( ) 3 - NSAIDs / Aspirin       | |
|  +----------------------------------+ +--------------------------------+ |
|                                                                          |
|  [ Voice Notes / Clinical Observations: _________________________ ]      |
|                                                                          |
|  [ >>> Save Questionnaire & Proceed to Queue (Canary Yellow) ]          |
|                                                                          |
+--------------------------------------------------------------------------+
```

#### Component Breakdown & Purpose

| Component Name | Visual Styling & Placement | Clinical / Role Purpose | Interactions & Data Bindings |
| :--- | :--- | :--- | :--- |
| **`ActiveTokenHeader`** | Top banner showing Patient Name, UHID, and active token badge (`#Q-102`). | Ensures screening responses are strictly bound to the correct encounter. | Binds to active `visit_id` and `patient_id`. |
| **`McqQuestionGrid`** | Breathable 2-column card grid rendering Questions ($Q_1$ through $Q_{20}$). Each card displays question title and numbered radio option chips (`0`, `1`, `2`, `3`). | Standardizes preliminary screening data into integer columns (`q1`, `q2`...) so clinical rules can evaluate numerical codes deterministically. | Radio selection updates integer index state (`0 = Option 0`, `1 = Option 1`, etc.). |
| **`VoiceAssistantWidget`** | Compact microphone button with radiant yellow audio visualizer pulse. | Enables hands-free dictation: staff can voice-select options (e.g. "Question 2, Option 1") or dictate qualitative observations. | Uses Web Speech API; appends qualitative text into `intake_questionnaires.voice_notes`. |
| **`QuestionnaireProgressBar`** | Clean linear progress indicator at the top showing answered vs remaining questions (e.g., `8/12 Answered`). | Gives receptionist instant visual pacing during fast walk-in intake. | Computed from non-null `q` fields. |
| **`SaveQuestionnaireCTA`** | Full-width radiant Canary Yellow button with CheckCircle icon. | Submits the completed numerical response payload to backend. | Submits via `POST /api/visits/{id}/questionnaire`. |

---

### P-REC-04: External Diagnostic Reports Ingestion Page
- **Route**: `/receptionist/reports`
- **Role**: `RECEPTIONIST`
- **Primary Objective**: Upload and archive past patient scans (DICOM files, ECG strips, lab blood panels).

#### Component Breakdown & Purpose

| Component Name | Visual Styling & Placement | Clinical / Role Purpose | Interactions & Data Bindings |
| :--- | :--- | :--- | :--- |
| **`PatientTokenSelector`** | Top bar with search input to lock onto active registered token (`#Q-102`). | Ensures scans are associated with the correct patient encounter. | Selects active patient from queue. |
| **`DragDropDropzone`** | Generous 80px dashed box with file icons (`.dcm`, `.pdf`, `.png`). | Zero-friction upload of heavy scan archives or mobile photos of past reports. | Native HTML5 drag-and-drop file ingestion. |
| **`ModalityClassifierPills`** | 4 selectable toggle pills: `DICOM Scan`, `ECG Strip`, `Lab Blood Report`, `Discharge Summary`. | Categorizes the document so the doctor's viewer launches the correct medical visualizer. | Sets `report_type` enum in database. |
| **`UploadQueueList`** | Clean cards showing upload progress bar, file size, and deletion trigger. | Confirms file upload integrity before passing patient to doctor lounge. | Uploads via `POST /api/visits/{id}/reports/upload`. |

---

### P-REC-05: Live OPD Patient Queue & Token Roster Page
- **Route**: `/receptionist/queue`
- **Role**: `RECEPTIONIST`
- **Primary Objective**: Comprehensive token management, wait-time monitoring, and reprint center.

#### Component Breakdown & Purpose

| Component Name | Visual Styling & Placement | Clinical / Role Purpose | Interactions & Data Bindings |
| :--- | :--- | :--- | :--- |
| **`QueueFilterTabs`** | Pill tabs: `All Tokens`, `Waiting for Consultation`, `In Room`, `Completed`. | Allows receptionist to filter out discharged patients and focus only on waiting lounge crowding. | Filter state switch on queue array. |
| **`LiveQueueTable`** | Spacious table with Token badge, UHID, Patient Name, Assigned Doctor, Vitals Chip, and Wait Time. | Central truth for the entire front desk; tracks who is next in line. | Refreshes every 15s via polling. |
| **`PrintSlipAction`** | Clean button with Printer icon on every row. | Allows 1-click reprinting of lost token slips or patient intake sheets. | Launches `window.print()` formatted slip. |

---

## 4. Doctor (Physician) Portal Pages

---

### P-DOC-01: Physician Clinical Dashboard
- **Route**: `/doctor/dashboard`
- **Role**: `DOCTOR`
- **Primary Objective**: Action-oriented clinical cockpit showing waiting room queue, triage alerts, and consultation metrics.

#### Breathable Layout Wireframe (ASCII)
```
+--------------------------------------------------------------------------+
| [Sun] Bright Solutions | Dr. Vikram Kulkarni (Internal Med) | [Theme] [v] |
+--------------------------------------------------------------------------+
|                                                                          |
|  [Next Patient In Queue: #Q-102 Ramesh Patel • Stage 1 HTN (138/88)]     |
|  [  >>> Call Patient Into Room (Yellow Primary CTA) <<<  ]              |
|                                                                          |
|  +----------------+ +----------------+ +----------------+ +------------+ |
|  | Waiting Room   | | Completed Today| | Avg Consult    | | Triage     | |
|  | 3 Patients     | | 12 Consults    | | 10.4 mins      | | 2 Alerts   | |
|  +----------------+ +----------------+ +----------------+ +------------+ |
|                                                                          |
|  +-------------------------------------+ +-----------------------------+ |
|  |  GRAPH 1: Triage Risk Stratification| | GRAPH 2: Top OPD Diagnoses  | |
|  |  [Normal: 60%  Stage 1: 30% Crisis]| | [Hypertension:  5 cases]   | |
|  |  Instant visual alert breakdown     | | [Pharyngitis:   3 cases]   | |
|  |                                     | | [Type 2 DM:     4 cases]   | |
|  +-------------------------------------+ +-----------------------------+ |
|                                                                          |
|  +---------------------------------------------------------------------+ |
|  |  My OPD Patient Queue (Prioritized by Triage Severity)              | |
|  |  Token | UHID | Name | Age/Sex | Chief Complaint | BP Stage | Action  | |
|  +---------------------------------------------------------------------+ |
|                                                                          |
+--------------------------------------------------------------------------+
```

#### Component Breakdown & Purpose

| Component Name | Visual Styling & Placement | Clinical / Role Purpose | Interactions & Data Bindings |
| :--- | :--- | :--- | :--- |
| **`NextPatientCallHero`** | Prominent Canary Yellow card spotlighting the next patient in line with their chief complaint and BP stage. | Enables the physician to immediately call the next patient without searching through tables. | Button calls `POST /api/doctor/queue/{id}/call` and navigates straight to consultation room. |
| **`WaitingQueueCountCard`** | Large clean number showing waiting patients count. | Tells the doctor how many patients remain outside in the consultation lounge. | Filtered from doctor's active queue. |
| **`AvgConsultDurationCard`**| Minimalist card showing average time spent per patient (e.g. `10.4 min`). | Helps the doctor manage consultation pacing to prevent clinic delays. | Computed from visit start to sign-off duration. |
| **`TriageAlertsCountCard`** | Crimson red border card showing count of flagged patients (e.g. BP > 160 or SpO2 < 94%). | Alerts the physician to prioritize high-risk patients over routine follow-ups. | Highlighted risk items from vitals. |
| **`TriageRiskDonutChart`**  | Clean donut/bar chart showing percentage of Normal vs Elevated vs Critical triage vitals. | Gives physician instant epidemiological overview of today's case severity. | Plotted from `GET /api/dashboard/stats`. |
| **`TopDiagnosesBarChart`**  | Horizontal ranking of most frequent diagnoses in doctor's OPD today. | Actionable epidemiological snapshot (e.g. noticing seasonal spike in viral fever). | Aggregated from today's completed encounters. |
| **`PrioritizedQueueTable`** | Spacious table with high-risk patients pinned at top with red border. | Clean view of waiting patients with 1-click `Open Encounter` button. | Binds to `GET /api/doctor/queue`. |

---

### P-DOC-02: Patient Longitudinal Dossier & Triage View
- **Route**: `/doctor/patient/:id`
- **Role**: `DOCTOR`
- **Primary Objective**: Review historical visit conclusions, chronic conditions, and today's intake vitals.

#### Component Breakdown & Purpose

| Component Name | Visual Styling & Placement | Clinical / Role Purpose | Interactions & Data Bindings |
| :--- | :--- | :--- | :--- |
| **`PatientSummaryHeader`** | Clean white bar showing UHID, Name, Age, Gender, Blood Group, and verified phone number. | Verifies patient identity and biological baseline before starting clinical examination. | Data binding from `GET /api/doctor/patients/{id}/dossier`. |
| **`AllergiesBanner`** | Prominent warning banner with Red/Yellow chip tags (e.g., `⚠️ PENICILLIN (Severe Urticaria)`). | High-visibility safeguard against accidental prescription of dangerous allergens. | Highlighted in high-contrast red badge. |
| **`TodayVitalsPillStrip`** | 6-card horizontal strip: BP (`138/88`), Pulse (`76`), Temp (`98.4°F`), SpO2 (`98%`), BMI (`25.5`), Resp (`16`). | Provides immediate review of the patient's current hemodynamic status. | Binds to `vital_signs` table. |
| **`IntakeQuestionnaireReviewCard`** | Collapsible card displaying recorded MCQ screening responses ($Q_1 \dots Q_{20}$) with numerical choices (`0, 1, 2, 3...`) mapped to answer labels, alongside dictated voice notes. | Gives physician immediate visibility into screening anamnesis captured at front desk. | Binds to `GET /api/visits/{id}/questionnaire`. |
| **`PastVisitsTimeline`** | Vertical timeline listing past visit dates, attending doctors, diagnoses, and conclusion notes. | Provides longitudinal context so the doctor understands what was tried and discussed in previous visits. | Chronological array from patient history. |

---

### P-DOC-03: Diagnostic Media & Scans Viewer
- **Route**: `/doctor/viewer/:visitId`
- **Role**: `DOCTOR`
- **Primary Objective**: High-resolution examination of patient DICOM imaging, 12-lead ECG traces, and lab PDFs.

#### Component Breakdown & Purpose

| Component Name | Visual Styling & Placement | Clinical / Role Purpose | Interactions & Data Bindings |
| :--- | :--- | :--- | :--- |
| **`MediaSelectorToolbar`** | Tab bar with thumbnail previews of all scans uploaded for this visit. | Allows physician to toggle between Brain MRI, ECG, and Blood Lab reports. | Binds to `external_reports` records for visit. |
| **`DicomInteractiveCanvas`**| Dark canvas with zoom, pan, window level/contrast, and slice scroll tools. | Enables radiological inspection of CT/MRI/X-Ray DICOM scans within the web browser. | Renders DICOM slices via HTML5 Canvas. |
| **`EcgWaveformVisualizer`** | Medical millimeter-grid pink canvas plotting 12-lead voltage waveform traces. | Allows cardiologist or general physician to detect arrhythmias, ST elevations, or bundle branch blocks. | Canvas trace rendering from ECG dataset. |
| **`LabPdfViewer`** | Integrated PDF preview pane with zoom and page controls. | Review external blood, pathology, and urine laboratory reports. | Embedded secure PDF object view. |

---

### P-DOC-04: CDSS Safety Engine & E-Prescription Studio
- **Route**: `/doctor/consultation/:visitId`
- **Role**: `DOCTOR`
- **Primary Objective**: Formulate differential diagnosis, evaluate deterministic clinical safety rules, and sign off e-prescription.

#### Breathable Layout Wireframe (ASCII)
```
+--------------------------------------------------------------------------+
|  Patient: Ramesh Patel (UHID-2026-00002) • BP: 138/88 • Allergen: None   |
+--------------------------------------------------------------------------+
|                                                                          |
|  [ SECTION 1: Clinical Assessment & Diagnosis ]                          |
|  Diagnosis: [Stage 1 Essential Hypertension (Controlled)_____________]   |
|  Clinical Examination Notes: [Clear chest, regular rhythm, S1 S2 heard.] |
|                                                                          |
|  [ SECTION 2: Deterministic Safety Rules Engine (CDSS) ]                 |
|  +--------------------------------------------------------------------+  |
|  |  ✓ Triage Rule: Stage 1 HTN confirmed. Target BP < 130/80.         |  |
|  |  ✓ Allergy Check: No known drug allergies reported.                |  |
|  |  ✓ Drug Interaction: 0 conflicts detected in current regimen.      |  |
|  +--------------------------------------------------------------------+  |
|                                                                          |
|  [ SECTION 3: Formulary E-Prescription Writer ]                          |
|  Drug Search: [Amlodipine Besylate 5mg | TABLET                      v]  |
|  Dosage: [5 mg]  Freq: [OD Morning]  Duration: [30 Days]  Take: [Food]   |
|                                                                          |
|  Active Prescription Items Table:                                        |
|  1. Amlodipine 5mg Tab  | 1 tab OD morning  | 30 days | [Remove]        |
|  2. Paracetamol 650mg   | 1 tab TDS PRN     | 3 days  | [Remove]        |
|                                                                          |
|  [ Save Draft ]            [ >>> Sign-Off & Lock Prescription (Yellow) ] |
|                                                                          |
+--------------------------------------------------------------------------+
```

#### Component Breakdown & Purpose

| Component Name | Visual Styling & Placement | Clinical / Role Purpose | Interactions & Data Bindings |
| :--- | :--- | :--- | :--- |
| **`AssessmentNotesEditor`** | Generous text area with clean typography for differential diagnosis and clinical exam observations. | Records legal physician findings into medical record. | Binds to `visits.conclusion_notes`. |
| **`DeterministicCdssCard`**| Structured card with green checkmarks or vivid crimson warning badges. | Automatically flags dangerous drug-allergy contraindications and dosage anomalies in real-time. | Evaluated via `POST /api/doctor/visits/{id}/insights/evaluate`. |
| **`FormularySearchSelect`** | Fast autocomplete dropdown connected to clinic approved drug formulary. | Prevents spelling errors and standardizes drug names, strengths, and units. | Queries clinic drug catalog. |
| **`PrescriptionItemsTable`**| Breathable table listing prescribed medicines with frequency, duration, and instructions. | Clean visual review of final medication plan before signing. | Manages array in local component state. |
| **`SignOffEncounterCTA`** | Radiant Yellow button with Stethoscope icon (`.btn-primary`). | Digitally signs encounter, locks editing, and transitions patient to Cashier Billing Desk. | Calls `POST /api/doctor/visits/{id}/sign-off`. |

---

## 5. Cashier (Billing) Portal Pages

---

### P-CSH-01: Cashier Billing Operations Dashboard
- **Route**: `/cashier/dashboard`
- **Role**: `CASHIER`
- **Primary Objective**: Billing station financial overview, unbilled queue tracking, and revenue reconciliation.

#### Breathable Layout Wireframe (ASCII)
```
+--------------------------------------------------------------------------+
| [Sun] Bright Solutions | Cashier Desk 1 (Rahul Verma) | [Theme] [Logout] |
+--------------------------------------------------------------------------+
|                                                                          |
|  +----------------+ +----------------+ +----------------+ +------------+ |
|  | Gross Revenue  | | Unbilled Queue | | Invoices Paid  | | Avg Billing| |
|  | ₹ 14,850       | | 2 Patients     | | 18 Receipts    | | 2.1 mins   | |
|  +----------------+ +----------------+ +----------------+ +------------+ |
|                                                                          |
|  +-------------------------------------+ +-----------------------------+ |
|  |  GRAPH 1: Revenue by Payment Mode   | | GRAPH 2: Hourly Collections | |
|  |  [UPI QR: 55%  Cash: 35%  Card: 10%]| | [09:00 - 14:00 Revenue Bars]| |
|  |  Clear tender reconciliation donut  | | Real-time intake cashflow   | |
|  +-------------------------------------+ +-----------------------------+ |
|                                                                          |
|  +---------------------------------------------------------------------+ |
|  |  Pending Billing Queue (Patients with Signed Prescriptions Ready)   | |
|  |  Token | UHID | Patient Name | Doctor | Subtotal | Mode | Action   | |
|  +---------------------------------------------------------------------+ |
|                                                                          |
+--------------------------------------------------------------------------+
```

#### Component Breakdown & Purpose

| Component Name | Visual Styling & Placement | Clinical / Role Purpose | Interactions & Data Bindings |
| :--- | :--- | :--- | :--- |
| **`GrossCollectionsCard`** | Large bold monetary value (`₹ 14,850`) with warm yellow accent. | Primary financial target: tells cashier exact money collected in their shift. | Sum of all payments processed today. |
| **`UnbilledQueueCountCard`**| Badge card showing count of patients who have left doctor's room and are waiting to pay. | Alerts cashier if billing counter is accumulating a line. | Count from `GET /api/cashier/queue`. |
| **`InvoicesSettledCard`**   | Minimalist card showing count of successfully closed receipts (`18 Receipts`). | Shift throughput metric. | Count of completed receipts. |
| **`PaymentModeDonutChart`** | Clean donut chart displaying split between UPI QR, Cash, and Card. | Essential for end-of-shift drawer balancing: cashier knows exactly how much physical cash should be in register. | Aggregated tender summary. |
| **`HourlyRevenueBarChart`** | Hourly revenue intake bars. | Visualizes peak cash collection hours to optimize counter staffing. | Plotted from payment timestamps. |
| **`PendingBillingTable`**   | Table showing token, patient name, doctor, estimated bill, and high-visibility `Generate Bill` button. | The primary working queue: click opens itemized checkout immediately. | Direct binding to `GET /api/cashier/queue`. |

---

### P-CSH-02: Itemized Invoice & Insurance Reconciliation Page
- **Route**: `/cashier/billing/:visitId`
- **Role**: `CASHIER`
- **Primary Objective**: Review automatically aggregated line items (consultation, diagnostics, pharmacy), apply insurance copay, and compute net balance.

#### Component Breakdown & Purpose

| Component Name | Visual Styling & Placement | Clinical / Role Purpose | Interactions & Data Bindings |
| :--- | :--- | :--- | :--- |
| **`PatientInvoiceHeader`** | Clean white summary card showing UHID, Patient Name, Token, and Attending Doctor. | Verifies invoice recipient before charging. | Loaded from visit encounter. |
| **`ItemizedLedgerTable`** | Transparent, clean table showing Consultation Fee (`₹500`), Scan Archival (`₹150`), and Prescribed Medicines (`₹95`). | Full transparency for the patient; zero mystery charges. | Aggregated line items from bill schema. |
| **`InsuranceCopayModule`** | Dedicated section for Ayushman Bharat (PMJAY), CGHS, or Private TPA insurance cards. | Auto-calculates covered percentage, approved claim amount, and remaining patient copay. | Binds to `bills.insurance_copay_deduction`. |
| **`NetPayableSummaryCard`** | Large high-contrast total (`Net Payable: ₹745.00`) in bold serif font. | Prominent visual anchor: the final amount cashier must collect. | Computed net total after discounts/copay. |
| **`ProceedToPaymentCTA`** | Radiant Yellow button (`.btn-primary`) with CreditCard icon. | Transitions to tender settlement screen. | Navigates to `/cashier/receipt/:billId`. |

---

### P-CSH-03: Multi-Mode Payment Tender & Official Tax Receipt Page
- **Route**: `/cashier/receipt/:billId`
- **Role**: `CASHIER`
- **Primary Objective**: Process payment tender (Cash, UPI QR, Card), print tax receipt, and close the encounter.

#### Component Breakdown & Purpose

| Component Name | Visual Styling & Placement | Clinical / Role Purpose | Interactions & Data Bindings |
| :--- | :--- | :--- | :--- |
| **`PaymentModeTabs`** | 3 large selectable cards: `Dynamic UPI QR`, `Cash Tender`, `Card / POS`. | Gives patient choice of tender method with zero friction. | Switches tender interface. |
| **`DynamicUpiQrDisplay`** | Clean QR code generated with exact bill amount (`₹745.00`) and hospital VPA. | Patient scans with Google Pay / PhonePe / Paytm; instant cashless payment with zero card fees. | Generates standard UPI payment URI. |
| **`CashCalculatorCard`** | Input for amount received (`₹1000`) with auto-calculated change return (`₹255`). | Eliminates cashier mental math errors during physical cash transactions. | Live computed change display. |
| **`OfficialReceiptCard`** | Clean, printable tax invoice card with clinic logo, registration number, item breakdown, and QR verification stamp. | Official legal patient receipt for tax deductions and medical claims. | Triggered by `window.print()`. |
| **`CloseEncounterCTA`** | Radiant Yellow button (`.btn-primary`) with CheckCircle2 icon. | Marks bill `PAID`, discharges patient, and updates encounter status to `COMPLETED`. | Submits to `POST /api/bills/{id}/payments`. |

---

## 6. Hospital Administrator Portal Pages

---

### P-ADM-01: Executive Governance & Clinic Analytics Dashboard
- **Route**: `/admin/dashboard`
- **Role**: `ADMIN`
- **Primary Objective**: High-level institutional governance: footfall trends, revenue velocity, doctor utilization, and clinical quality metrics.

#### Breathable Layout Wireframe (ASCII)
```
+--------------------------------------------------------------------------+
| [Sun] Bright Solutions | Hospital Administration Executive Center        |
+--------------------------------------------------------------------------+
|                                                                          |
|  +----------------+ +----------------+ +----------------+ +------------+ |
|  | Today Footfall | | OPD Revenue    | | Completed      | | Average    | |
|  | 42 Patients    | | ₹ 31,450       | | 38 Encounters  | | Throughput | |
|  | (+14% vs avg)  | | (Cashless: 65%)| | (90% resolved) | | 31.5 mins  | |
|  +----------------+ +----------------+ +----------------+ +------------+ |
|                                                                          |
|  +-------------------------------------+ +-----------------------------+ |
|  |  GRAPH 1: OPD Footfall Curve (Week) | | GRAPH 2: Doctor Utilization | |
|  |  [Mon Tue Wed Thu Fri Sat Sun bars] | | [Dr. Kulkarni: 18 consults] | |
|  |  Identifies weekly surge days       | | [Dr. Ananya:   12 consults] | |
|  |                                     | | [Dr. Priya:    12 consults] | |
|  +-------------------------------------+ +-----------------------------+ |
|                                                                          |
|  +---------------------------------------------------------------------+ |
|  |  GRAPH 3: Clinical Disease Epidemiology Breakdown (AHA & ICD-10)    | |
|  |  Hypertension: 35% | Type 2 Diabetes: 25% | Respiratory: 20% | Other | |
|  +---------------------------------------------------------------------+ |
|                                                                          |
+--------------------------------------------------------------------------+
```

#### Component Breakdown & Purpose

| Component Name | Visual Styling & Placement | Clinical / Role Purpose | Interactions & Data Bindings |
| :--- | :--- | :--- | :--- |
| **`ExecutiveKpiStrip`** | 4 luxury cards with subtle top border lines in Radiant Yellow and Midnight Navy. | High-altitude KPI health check for hospital management: Footfall, Revenue, Resolution Rate, and Throughput. | Binds to `GET /api/admin/dashboard`. |
| **`WeeklyFootfallBarChart`** | Breathable 7-day bar chart showing daily patient volume. | Guides hospital administration on doctor scheduling and nurse staffing requirements. | Plotted from historical visits table. |
| **`DoctorWorkloadComparison`**| Horizontal comparative bar chart showing patient volume and average consult minutes per doctor. | Ensures fair distribution of patient loads across internal medicine staff. | Grouped by `doctor_id`. |
| **`DiseasePrevalenceDistribution`** | Multi-colored segmented bar chart illustrating top conditions diagnosed across the OPD. | Essential clinical intelligence for pharmacy stock planning and hospital health camps. | Aggregated from clinical diagnoses. |

---

### P-ADM-02: Staff Provisioning & Duty Roster Management Page
- **Route**: `/admin/staff`
- **Role**: `ADMIN`
- **Primary Objective**: Provision staff accounts, set roles, and manage active consultation room shifts.

#### Component Breakdown & Purpose

| Component Name | Visual Styling & Placement | Clinical / Role Purpose | Interactions & Data Bindings |
| :--- | :--- | :--- | :--- |
| **`AddStaffButton`** | Radiant Yellow button (`+ Provision New Staff Account`). | Opens modal to onboard new doctors, nurses, receptionists, or billing staff. | Launches provisioning modal. |
| **`StaffRosterTable`** | Clean table showing Avatar, Full Name, System Role (`DOCTOR`, `RECEPTIONIST`, `CASHIER`, `ADMIN`), Email, Active Status toggle. | Central administrative directory of all authorized hospital users. | Binds to `users` table. |
| **`AccountStatusToggle`** | Interactive toggle switch (`Active` / `Suspended`). | Instantly deactivates former employees or off-duty staff accounts for HIPAA/data security. | Calls `PUT /api/admin/staff/{id}/status`. |

---

### P-ADM-03: Immutable Clinical Audit Trail & Quality Logs Page
- **Route**: `/admin/audit-logs`
- **Role**: `ADMIN`
- **Primary Objective**: Transparent audit logs of clinical rule overrides, triage edits, and invoice adjustments for medical-legal compliance.

#### Component Breakdown & Purpose

| Component Name | Visual Styling & Placement | Clinical / Role Purpose | Interactions & Data Bindings |
| :--- | :--- | :--- | :--- |
| **`AuditFilterBar`** | Search input + Event Type filter (`Rule Override`, `Billing Discount`, `Vitals Edit`). | Enables compliance officers to investigate specific medical-legal incidents quickly. | Filter state switch on log table. |
| **`AuditTrailTable`** | High-density readable table with Timestamp, Actor, Patient UHID, Action Type, Previous Value, New Value, Justification. | Unalterable legal record protecting the hospital against malpractice claims. | Fetched from system audit logs. |

---

## 7. What is Intentionally Excluded (Clutter Elimination Index)

To guarantee the user's requirement that **no visual component is redundant or unnecessary**:

| Eliminated Clutter Item | Why It Was Omitted | What Replaces It |
| :--- | :--- | :--- |
| **Server CPU / RAM / Disk Usage Gauges** | Clinical staff and receptionists do not understand or care about server memory percentages. | Simple green/red pulse dot: `FastAPI Online`. |
| **Redundant Timestamps Everywhere** | Clutters tables with repetitive dates. | Simple relative indicators: `14 mins ago` or `Today, 10:30 AM`. |
| **Unexplained Generic Percentages** | Numbers like "Efficiency: 87%" without a clear denominator confuse staff. | Concrete operational figures: `3.2 mins avg triage` or `₹745 net payable`. |
| **Complex Nested Submenus** | Forces users to dig through multiple flyouts to perform daily tasks. | Flat 2-level navigation bar with immediate role-based workspaces. |
| **Cluttered Flashy Hero Stock Photos** | Wastes screen real estate and distracts from clinical data. | Clean, high-whitespace cards with functional data visualization. |

---

## 8. Summary Master Page Catalog

| Page ID | Route | Primary Role | Core Objective | Key Visual Figure / Graph |
| :--- | :--- | :--- | :--- | :--- |
| **P-00** | `/login` | All | Role-based authentication & 1-click personas | 1-Click Persona Cards Grid |
| **P-REC-01**| `/receptionist/dashboard` | Receptionist | Front-desk command center & footfall | Hourly Walk-in Bars + Doctor Queue Balance |
| **P-REC-02**| `/receptionist/intake` | Receptionist | Patient demographic onboarding & vitals | Live BMI Gauge + AHA BP Stage Chip |
| **P-REC-03**| `/receptionist/voice-intake` | Receptionist | Speech-to-text symptom intake | Audio Waveform + Live Transcript Stream |
| **P-REC-04**| `/receptionist/reports` | Receptionist | External DICOM, ECG, and Lab PDF archival | Upload Queue Cards + Modality Selector |
| **P-REC-05**| `/receptionist/queue` | Receptionist | Live token queue & printable token slips | Waiting Lounge Queue Table with Wait Time |
| **P-DOC-01**| `/doctor/dashboard` | Doctor | Consultation cockpit & risk triage priority | Triage Risk Donut + Top Diagnoses Bars |
| **P-DOC-02**| `/doctor/patient/:id` | Doctor | Longitudinal patient dossier & past visits | Past Visit Timeline + Today's Vitals Strip |
| **P-DOC-03**| `/doctor/viewer/:visitId` | Doctor | Diagnostic scans inspection | Interactive DICOM Canvas + 12-Lead ECG |
| **P-DOC-04**| `/doctor/consultation/:visitId` | Doctor | CDSS rules evaluation & e-Rx sign-off | Deterministic Rule Check Cards |
| **P-CSH-01**| `/cashier/dashboard` | Cashier | Billing station revenue & unbilled queue | Payment Mode Donut (UPI/Cash/Card) |
| **P-CSH-02**| `/cashier/billing/:visitId` | Cashier | Itemized billing ledger & insurance copay | Itemized Billing Table + Copay Deductions |
| **P-CSH-03**| `/cashier/receipt/:billId` | Cashier | Tender collection & official receipt | Dynamic UPI QR Display + Cash Calculator |
| **P-ADM-01**| `/admin/dashboard` | Administrator | Hospital executive governance | Weekly Footfall Curve + Doctor Workload |
| **P-ADM-02**| `/admin/staff` | Administrator | Staff account provisioning & shifts | Staff Directory Table with Active Toggles |
| **P-ADM-03**| `/admin/audit-logs` | Administrator | Medical-legal audit trail | Timestamped Audit Trail Table |
