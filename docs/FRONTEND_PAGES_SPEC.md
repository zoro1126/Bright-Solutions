# Bright Solutions — Frontend Pages & Website Flow

**Product**: Bright Solutions (General OPD Clinic Operating System)
**Frontend**: React 18 + Vite
**This document defines pages, flow, functions and data only.**

---

## 1. End-to-End Website Flow

```
Login (/login) -> role portal

Patient journey across roles:
 RECEPTIONIST : register patient + vitals -> token issued -> intake questionnaire -> upload outside reports -> patient waits in live queue
 DOCTOR       : sees prioritized queue -> calls next patient -> reviews dossier + questionnaire + reports -> consultation (diagnosis, safety checks, e-prescription) -> signs off
 CASHIER      : sees signed-off visits -> itemized bill (consultation + diagnostics + medicines) -> insurance co-pay/discount -> takes payment -> prints receipt -> encounter closed
 ADMIN        : analytics dashboard, staff accounts, audit trail of overrides/edits
```

Each role only sees its own portal.

```
[ Gateway: Staff Login & 1-Click Demo Personas (/login) ]
       |
       +---> RECEPTIONIST PORTAL
       |        P-REC-01 Dashboard            /receptionist/dashboard
       |        P-REC-02 Patient Registration /receptionist/intake
       |        P-REC-03 Intake Questionnaire /receptionist/intake/questionnaire
       |        P-REC-04 Reports Upload       /receptionist/reports
       |        P-REC-05 Live Queue & Tokens  /receptionist/queue
       |
       +---> DOCTOR PORTAL
       |        P-DOC-01 Dashboard            /doctor/dashboard
       |        P-DOC-02 Patient Dossier      /doctor/patient/:id
       |        P-DOC-03 Diagnostic Viewer    /doctor/viewer/:visitId
       |        P-DOC-04 Consultation Studio  /doctor/consultation/:visitId
       |
       +---> CASHIER PORTAL
       |        P-CSH-01 Dashboard            /cashier/dashboard
       |        P-CSH-02 Itemized Invoice     /cashier/billing/:visitId
       |        P-CSH-03 Payment & Receipt    /cashier/receipt/:billId
       |
       +---> ADMIN PORTAL
                P-ADM-01 Dashboard            /admin/dashboard
                P-ADM-02 Staff Management     /admin/staff
                P-ADM-03 Audit Logs           /admin/audit-logs
```

---

## 2. Pages



### P-00: Staff Gateway & Role Login Page
- **Route**: `/login`
- **Role**: All Staff & Guests
- **Primary Objective**: Secure staff authentication with zero-friction development testing.

**Content / fields**
- 1-click demo personas (Receptionist, Physician, Consultant, Cashier, Admin) that log in instantly
- Manual login: username + password

**Features**

| Feature | Purpose | Data / Interaction |
| :--- | :--- | :--- |
| **`DemoPersonaLogin`** | Allows instant role switching in 1 click without typing passwords during busy clinic shifts or demos. | Calls `loginUser(username, 'password123')` and immediately loads target role portal. |
| **`CredentialLoginForm`** | Production-ready credentials authentication for formal staff sign-in. | Submits to `POST /api/auth/login`; persists token in `localStorage`. |
| **`SignInAction`** | Unmistakable primary submit trigger. | Disabled state with spinner while authenticating. |

---

### P-REC-01: Receptionist Operations Dashboard
- **Route**: `/receptionist/dashboard`
- **Role**: `RECEPTIONIST`
- **Primary Objective**: Real-time front-desk command center tracking walk-in footfall, triage backlog, and physician queue balance.

**Features**

| Feature | Purpose | Data / Interaction |
| :--- | :--- | :--- |
| **`RegisterNewPatientShortcut`** | Welcomes receptionist, shows today's date, and provides instant `+ Register New Patient` CTA. | Click triggers registration flow or quick patient lookup. |
| **`TodayIntakeCount`** | Tells the receptionist exactly how many patients have been admitted today. | Displays count from `GET /api/dashboard/stats`. |
| **`NextTokenNumber`** | Eliminates token guesswork; shows the exact token number that will be handed to the next walk-in. | Polled from `GET /api/tokens/next`. |
| **`AvgTriageTime`** | Actionable operational benchmark so staff can see if the desk is falling behind. | Computed from intake timestamps. |
| **`HourlyWalkInData`** | Helps staff anticipate lunch surges and assign relief staff during peak OPD rush hours. | Plotted dynamically from visit timestamps. |
| **`DoctorQueueBalanceData`** | Prevents overloading one doctor while another sits idle; guides receptionist on doctor assignment. | Computed from active visits grouped by `doctor_id`. |
| **`RecentRegistrationsList`** | Allows receptionist to reprint slips or verify the last 5 registered patients at a glance. | Direct data binding to `recent_patients` feed. |

---

### P-REC-02: Patient Intake & Triage Registration Page
- **Route**: `/receptionist/intake`
- **Role**: `RECEPTIONIST`
- **Primary Objective**: Comprehensive walk-in patient onboarding, real-time vital signs capture, and token assignment.

**Content / fields**
- Demographics: first name, last name, date of birth (age auto-computed), gender, blood group, phone, address, assigned doctor, billing mode (Cash / Self, Insurance)
- Triage vitals: systolic BP, diastolic BP, pulse, temperature (°F), SpO2, weight (kg), height (cm), respiratory rate
- Live evaluation shown while typing: AHA BP stage and BMI category
- Quick-fill presets for testing: Sample Patient, Normal Vitals, High BP Alert
- Actions: Cancel, Confirm Registration & Issue Token (then show printable token slip)

**Features**

| Feature | Purpose | Data / Interaction |
| :--- | :--- | :--- |
| **`DemoPresets`** | Speeds up testing and allows receptionist to auto-populate standard baseline templates. | Populates form state with 1 click. |
| **`DemographicsFields`** | Captures patient legal identity, auto-computes age from DOB, and binds contact information. | Validates phone number format and non-empty name fields. |
| **`DoctorSelector`** | Assigns patient directly to an active on-duty physician. | Fetched dynamically from `GET /api/doctors`. |
| **`LiveBmiCalculation`** | Eliminates manual math; gives receptionist and doctor instant obesity/malnutrition alerts. | Updates in real-time as Height and Weight are keyed in. |
| **`LiveAhaBpStage`** | Immediately flags dangerously high BP (>180/120) for fast-tracking. | Updates in real-time as Systolic/Diastolic inputs change. |
| **`ConfirmRegistrationAction`** | Commits patient to database, assigns sequential token, and displays printable slip. | Submits payload to `POST /api/patients`. |

---

### P-REC-03: Clinical Intake Questionnaire Page (MCQ & Voice-Assisted)
- **Route**: `/receptionist/intake/questionnaire`
- **Role**: `RECEPTIONIST`
- **Primary Objective**: Structured anamnesis intake via standardized Multiple-Choice Questions ($Q_1, Q_2, Q_3 \dots Q_{20}$), where each selected option is stored as an integer index (`0, 1, 2, 3...`) in dedicated DB columns (`q1, q2, q3...`), with optional voice-to-text dictation.

**Content / fields**
- Header shows active token, patient name, UHID and answered count (e.g. 8/12)
- Questions Q1..Q20 (extensible), each with 4 mutually exclusive options stored as integers 0-3. Example: Q1 primary symptom severity, Q2 onset duration, Q3 associated fever, Q4 known drug allergy flag. Final question text is not fixed; render dynamically
- Voice notes / clinical observations field with microphone dictation
- Action: Save Questionnaire & Proceed to Queue

**Features**

| Feature | Purpose | Data / Interaction |
| :--- | :--- | :--- |
| **`ActiveTokenInfo`** | Ensures screening responses are strictly bound to the correct encounter. | Binds to active `visit_id` and `patient_id`. |
| **`McqQuestions`** | Standardizes preliminary screening data into integer columns (`q1`, `q2`...) so clinical rules can evaluate numerical codes deterministically. | Radio selection updates integer index state (`0 = Option 0`, `1 = Option 1`, etc.). |
| **`VoiceDictation`** | Enables hands-free dictation: staff can voice-select options (e.g. "Question 2, Option 1") or dictate qualitative observations. | Uses Web Speech API; appends qualitative text into `intake_questionnaires.voice_notes`. |
| **`QuestionnaireProgress`** | Gives receptionist instant visual pacing during fast walk-in intake. | Computed from non-null `q` fields. |
| **`SaveQuestionnaireAction`** | Submits the completed numerical response payload to backend. | Submits via `POST /api/visits/{id}/questionnaire`. |

---

### P-REC-04: External Diagnostic Reports Ingestion Page
- **Route**: `/receptionist/reports`
- **Role**: `RECEPTIONIST`
- **Primary Objective**: Upload and archive past patient scans (DICOM files, ECG strips, lab blood panels).

**Features**

| Feature | Purpose | Data / Interaction |
| :--- | :--- | :--- |
| **`PatientTokenSelector`** | Ensures scans are associated with the correct patient encounter. | Selects active patient from queue. |
| **`FileDropUpload`** | Zero-friction upload of heavy scan archives or mobile photos of past reports. | Native HTML5 drag-and-drop file ingestion. |
| **`ReportTypeSelector`** | Categorizes the document so the doctor's viewer launches the correct medical visualizer. | Sets `report_type` enum in database. |
| **`UploadList`** | Confirms file upload integrity before passing patient to doctor lounge. | Uploads via `POST /api/visits/{id}/reports/upload`. |

---

### P-REC-05: Live OPD Patient Queue & Token Roster Page
- **Route**: `/receptionist/queue`
- **Role**: `RECEPTIONIST`
- **Primary Objective**: Comprehensive token management, wait-time monitoring, and reprint center.

**Features**

| Feature | Purpose | Data / Interaction |
| :--- | :--- | :--- |
| **`QueueStatusFilter`** | Allows receptionist to filter out discharged patients and focus only on waiting lounge crowding. | Filter state switch on queue array. |
| **`LiveQueueList`** | Central truth for the entire front desk; tracks who is next in line. | Refreshes every 15s via polling. |
| **`PrintSlipAction`** | Allows 1-click reprinting of lost token slips or patient intake sheets. | Launches `window.print()` formatted slip. |

---

### P-DOC-01: Physician Clinical Dashboard
- **Route**: `/doctor/dashboard`
- **Role**: `DOCTOR`
- **Primary Objective**: Action-oriented clinical cockpit showing waiting room queue, triage alerts, and consultation metrics.

**Features**

| Feature | Purpose | Data / Interaction |
| :--- | :--- | :--- |
| **`NextPatientCall`** | Enables the physician to immediately call the next patient without searching through tables. | Button calls `POST /api/doctor/queue/{id}/call` and navigates straight to consultation room. |
| **`WaitingCount`** | Tells the doctor how many patients remain outside in the consultation lounge. | Filtered from doctor's active queue. |
| **`AvgConsultDuration`** | Helps the doctor manage consultation pacing to prevent clinic delays. | Computed from visit start to sign-off duration. |
| **`TriageAlertsCount`** | Alerts the physician to prioritize high-risk patients over routine follow-ups. | Highlighted risk items from vitals. |
| **`TriageRiskBreakdown`** | Gives physician instant epidemiological overview of today's case severity. | Plotted from `GET /api/dashboard/stats`. |
| **`TopDiagnoses`** | Actionable epidemiological snapshot (e.g. noticing seasonal spike in viral fever). | Aggregated from today's completed encounters. |
| **`PrioritizedQueue`** | Clean view of waiting patients with 1-click `Open Encounter` button. | Binds to `GET /api/doctor/queue`. |

---

### P-DOC-02: Patient Longitudinal Dossier & Triage View
- **Route**: `/doctor/patient/:id`
- **Role**: `DOCTOR`
- **Primary Objective**: Review historical visit conclusions, chronic conditions, and today's intake vitals.

**Features**

| Feature | Purpose | Data / Interaction |
| :--- | :--- | :--- |
| **`PatientSummary`** | Verifies patient identity and biological baseline before starting clinical examination. | Data binding from `GET /api/doctor/patients/{id}/dossier`. |
| **`AllergiesWarning`** | High-visibility safeguard against accidental prescription of dangerous allergens. | Shown as a prominent warning. |
| **`TodayVitals`** | Provides immediate review of the patient's current hemodynamic status. | Binds to `vital_signs` table. |
| **`IntakeQuestionnaireReview`** | Gives physician immediate visibility into screening anamnesis captured at front desk. | Binds to `GET /api/visits/{id}/questionnaire`. |
| **`PastVisits`** | Provides longitudinal context so the doctor understands what was tried and discussed in previous visits. | Chronological array from patient history. |

---

### P-DOC-03: Diagnostic Media & Scans Viewer
- **Route**: `/doctor/viewer/:visitId`
- **Role**: `DOCTOR`
- **Primary Objective**: High-resolution examination of patient DICOM imaging, 12-lead ECG traces, and lab PDFs.

**Features**

| Feature | Purpose | Data / Interaction |
| :--- | :--- | :--- |
| **`ReportSelector`** | Allows physician to toggle between Brain MRI, ECG, and Blood Lab reports. | Binds to `external_reports` records for visit. |
| **`DicomViewer`** | Enables radiological inspection of CT/MRI/X-Ray DICOM scans within the web browser. | Renders DICOM slices via HTML5 Canvas. |
| **`EcgViewer`** | Allows cardiologist or general physician to detect arrhythmias, ST elevations, or bundle branch blocks. | Canvas trace rendering from ECG dataset. |
| **`LabPdfViewer`** | Review external blood, pathology, and urine laboratory reports. | Embedded secure PDF object view. |

---

### P-DOC-04: CDSS Safety Engine & E-Prescription Studio
- **Route**: `/doctor/consultation/:visitId`
- **Role**: `DOCTOR`
- **Primary Objective**: Formulate differential diagnosis, evaluate deterministic clinical safety rules, and sign off e-prescription.

**Content / fields**
- Patient strip: name, UHID, BP, known allergens
- Section 1 Assessment: diagnosis, clinical examination notes
- Section 2 Safety rules (CDSS): triage rule, allergy check, drug interaction check; CRITICAL alerts require an override note before sign-off
- Section 3 E-prescription: formulary drug search, dosage, frequency (OD/BD/TDS), duration, food timing, items table with remove
- Actions: Save Draft, Sign-Off & Lock Prescription (moves visit to billing)

**Features**

| Feature | Purpose | Data / Interaction |
| :--- | :--- | :--- |
| **`AssessmentNotes`** | Records legal physician findings into medical record. | Binds to `visits.conclusion_notes`. |
| **`CdssSafetyChecks`** | Automatically flags dangerous drug-allergy contraindications and dosage anomalies in real-time. | Evaluated via `POST /api/doctor/visits/{id}/insights/evaluate`. |
| **`FormularySearch`** | Prevents spelling errors and standardizes drug names, strengths, and units. | Queries clinic drug catalog. |
| **`PrescriptionItems`** | Clean visual review of final medication plan before signing. | Manages array in local component state. |
| **`SignOffAction`** | Digitally signs encounter, locks editing, and transitions patient to Cashier Billing Desk. | Calls `POST /api/doctor/visits/{id}/sign-off`. |

---

### P-CSH-01: Cashier Billing Operations Dashboard
- **Route**: `/cashier/dashboard`
- **Role**: `CASHIER`
- **Primary Objective**: Billing station financial overview, unbilled queue tracking, and revenue reconciliation.

**Features**

| Feature | Purpose | Data / Interaction |
| :--- | :--- | :--- |
| **`GrossCollections`** | Primary financial target: tells cashier exact money collected in their shift. | Sum of all payments processed today. |
| **`UnbilledQueueCount`** | Alerts cashier if billing counter is accumulating a line. | Count from `GET /api/cashier/queue`. |
| **`InvoicesSettledCount`** | Shift throughput metric. | Count of completed receipts. |
| **`PaymentModeSummary`** | Essential for end-of-shift drawer balancing: cashier knows exactly how much physical cash should be in register. | Aggregated tender summary. |
| **`HourlyRevenueData`** | Visualizes peak cash collection hours to optimize counter staffing. | Plotted from payment timestamps. |
| **`PendingBillingList`** | The primary working queue: click opens itemized checkout immediately. | Direct binding to `GET /api/cashier/queue`. |

---

### P-CSH-02: Itemized Invoice & Insurance Reconciliation Page
- **Route**: `/cashier/billing/:visitId`
- **Role**: `CASHIER`
- **Primary Objective**: Review automatically aggregated line items (consultation, diagnostics, pharmacy), apply insurance copay, and compute net balance.

**Content / fields**
- Line items: consultation fee, diagnostic reports, prescribed pharmacy medicines
- Discount, insurance co-pay deduction, net payable total
- Action: Proceed to Payment

**Features**

| Feature | Purpose | Data / Interaction |
| :--- | :--- | :--- |
| **`InvoicePatientInfo`** | Verifies invoice recipient before charging. | Loaded from visit encounter. |
| **`ItemizedLineItems`** | Full transparency for the patient; zero mystery charges. | Aggregated line items from bill schema. |
| **`InsuranceCopay`** | Auto-calculates covered percentage, approved claim amount, and remaining patient copay. | Binds to `bills.insurance_copay_deduction`. |
| **`NetPayable`** | The final amount cashier must collect. | Computed net total after discounts/copay. |
| **`ProceedToPaymentAction`** | Transitions to tender settlement screen. | Navigates to `/cashier/receipt/:billId`. |

---

### P-CSH-03: Multi-Mode Payment Tender & Official Tax Receipt Page
- **Route**: `/cashier/receipt/:billId`
- **Role**: `CASHIER`
- **Primary Objective**: Process payment tender (Cash, UPI QR, Card), print tax receipt, and close the encounter.

**Content / fields**
- Tender modes: Cash (amount received, change due), UPI (QR from UPI payment URI), Card
- Official receipt (printable, 80mm) with clinic header and bill summary
- Action: Close Encounter (visit becomes COMPLETED)

**Features**

| Feature | Purpose | Data / Interaction |
| :--- | :--- | :--- |
| **`PaymentModeSelector`** | Gives patient choice of tender method with zero friction. | Switches tender interface. |
| **`UpiQrCode`** | Patient scans with Google Pay / PhonePe / Paytm; instant cashless payment with zero card fees. | Generates standard UPI payment URI. |
| **`CashChangeCalculator`** | Eliminates cashier mental math errors during physical cash transactions. | Live computed change display. |
| **`OfficialReceipt`** | Official legal patient receipt for tax deductions and medical claims. | Triggered by `window.print()`. |
| **`CloseEncounterAction`** | Marks bill `PAID`, discharges patient, and updates encounter status to `COMPLETED`. | Submits to `POST /api/bills/{id}/payments`. |

---

### P-ADM-01: Executive Governance & Clinic Analytics Dashboard
- **Route**: `/admin/dashboard`
- **Role**: `ADMIN`
- **Primary Objective**: High-level institutional governance: footfall trends, revenue velocity, doctor utilization, and clinical quality metrics.

**Features**

| Feature | Purpose | Data / Interaction |
| :--- | :--- | :--- |
| **`ExecutiveKpis`** | High-altitude KPI health check for hospital management: Footfall, Revenue, Resolution Rate, and Throughput. | Binds to `GET /api/admin/dashboard`. |
| **`WeeklyFootfallData`** | Guides hospital administration on doctor scheduling and nurse staffing requirements. | Plotted from historical visits table. |
| **`DoctorWorkload`** | Ensures fair distribution of patient loads across internal medicine staff. | Grouped by `doctor_id`. |
| **`DiseasePrevalence`** | Essential clinical intelligence for pharmacy stock planning and hospital health camps. | Aggregated from clinical diagnoses. |

---

### P-ADM-02: Staff Provisioning & Duty Roster Management Page
- **Route**: `/admin/staff`
- **Role**: `ADMIN`
- **Primary Objective**: Provision staff accounts, set roles, and manage active consultation room shifts.

**Features**

| Feature | Purpose | Data / Interaction |
| :--- | :--- | :--- |
| **`AddStaffAction`** | Opens modal to onboard new doctors, nurses, receptionists, or billing staff. | Launches provisioning modal. |
| **`StaffList`** | Central administrative directory of all authorized hospital users. | Binds to `users` table. |
| **`AccountStatusToggle`** | Instantly deactivates former employees or off-duty staff accounts for HIPAA/data security. | Calls `PUT /api/admin/staff/{id}/status`. |

---

### P-ADM-03: Immutable Clinical Audit Trail & Quality Logs Page
- **Route**: `/admin/audit-logs`
- **Role**: `ADMIN`
- **Primary Objective**: Transparent audit logs of clinical rule overrides, triage edits, and invoice adjustments for medical-legal compliance.

**Features**

| Feature | Purpose | Data / Interaction |
| :--- | :--- | :--- |
| **`AuditFilters`** | Enables compliance officers to investigate specific medical-legal incidents quickly. | Filter state switch on log table. |
| **`AuditTrail`** | Unalterable legal record protecting the hospital against malpractice claims. | Fetched from system audit logs. |

---

## 3. Master Page Catalog

| Page ID | Route | Role | Objective |
| :--- | :--- | :--- | :--- |
| **P-00** | `/login` | All | Role-based authentication & 1-click personas |
| **P-REC-01** | `/receptionist/dashboard` | Receptionist | Front-desk command center & footfall |
| **P-REC-02** | `/receptionist/intake` | Receptionist | Patient demographic onboarding & vitals |
| **P-REC-03** | `/receptionist/intake/questionnaire` | Receptionist | Speech-to-text symptom intake |
| **P-REC-04** | `/receptionist/reports` | Receptionist | External DICOM, ECG, and Lab PDF archival |
| **P-REC-05** | `/receptionist/queue` | Receptionist | Live token queue & printable token slips |
| **P-DOC-01** | `/doctor/dashboard` | Doctor | Consultation cockpit & risk triage priority |
| **P-DOC-02** | `/doctor/patient/:id` | Doctor | Longitudinal patient dossier & past visits |
| **P-DOC-03** | `/doctor/viewer/:visitId` | Doctor | Diagnostic scans inspection |
| **P-DOC-04** | `/doctor/consultation/:visitId` | Doctor | CDSS rules evaluation & e-Rx sign-off |
| **P-CSH-01** | `/cashier/dashboard` | Cashier | Billing station revenue & unbilled queue |
| **P-CSH-02** | `/cashier/billing/:visitId` | Cashier | Itemized billing ledger & insurance copay |
| **P-CSH-03** | `/cashier/receipt/:billId` | Cashier | Tender collection & official receipt |
| **P-ADM-01** | `/admin/dashboard` | Administrator | Hospital executive governance |
| **P-ADM-02** | `/admin/staff` | Administrator | Staff account provisioning & shifts |
| **P-ADM-03** | `/admin/audit-logs` | Administrator | Medical-legal audit trail |
