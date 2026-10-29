# Week 1 Implementation Master Plan — Dual-Workstream Clinical Hospital OS
## Bright Solutions: Outpatient to Inpatient Clinical Core & Modular SaaS

> **Document Type:** Cycle 1, Week 1 Parallel Execution Artifact  
> **Workspace Location:** `artifacts/week1_tasks.md`  
> **Status:** 🟡 SPRINT ACTIVE (Dual-Workstream Architecture Activated Oct 28)  
> **Staffing Allocation:** 2 Concurrent Developers (Developer 1: Backend Core & APIs; Developer 2: Frontend UX & Inpatient Folio)  
> **Design References:** [01_PRD.md](file:///home/prem/Desktop/pbt/COS/docs/design/01_PRD.md), [03_technical_architecture.md](file:///home/prem/Desktop/pbt/COS/docs/design/03_technical_architecture.md), [04_data_model_spec.md](file:///home/prem/Desktop/pbt/COS/docs/design/04_data_model_spec.md), [09_database_schema_ddl.sql](file:///home/prem/Desktop/pbt/COS/docs/design/09_database_schema_ddl.sql), [11_api_endpoint_inventory.md](file:///home/prem/Desktop/pbt/COS/docs/design/11_api_endpoint_inventory.md), [13_rbac_permission_matrix.md](file:///home/prem/Desktop/pbt/COS/docs/design/13_rbac_permission_matrix.md), [15_page_route_map.md](file:///home/prem/Desktop/pbt/COS/docs/design/15_page_route_map.md), [16_ui_component_hierarchy.md](file:///home/prem/Desktop/pbt/COS/docs/design/16_ui_component_hierarchy.md), [17_frontend_state_architecture.md](file:///home/prem/Desktop/pbt/COS/docs/design/17_frontend_state_architecture.md), [21_adrs.md](file:///home/prem/Desktop/pbt/COS/docs/design/21_adrs.md), [23_cycle_1_pitch.md](file:///home/prem/Desktop/pbt/COS/docs/design/23_cycle_1_pitch.md)  
> **Client Dossier:** `docs/client_docs/IPD Book 6 Days.pdf` (86 Pages / 14 Clinical Forms)  

---

## High-Level Program Progress Summary

| Workstream | Total Tasks | Completed | In Progress | Pending | Completion Rate | Live Velocity Status |
|:---|:---:|:---:|:---:|:---:|:---:|:---|
| **Workstream A: Backend Engineering (Lead 1)** | 38 | 12 | 1 | 25 | **31.6%** | 🟢 On Schedule (Phase 1 & 2 Completed) |
| **Workstream B: Frontend Engineering (Lead 2)** | 38 | 0 | 1 | 37 | **0.0%** | 🟡 Sprint Ready (Shell & Design Kickoff) |
| **COMBINED PROGRAM TOTAL** | **76** | **12** | **2** | **62** | **15.8%** | 🚀 Active Parallel Execution |

---

## Workstream A: Backend Clinical Core & Modular SaaS (Developer 1)
*Lead Responsibility: FastAPI Domain Routers, Database Migrations, RBAC Guards, Licensing Cryptography, Concurrency Locks & Calculation Engines.*

### Backend Executive Progress Tracker

| Milestone Phase | Total Tasks | Completed | In Progress | Pending | Status |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Phase BE-1: Database Provisioning & Master Seeds (SaaS Ready)** | 6 | 6 | 0 | 0 | 🟢 Completed |
| **Phase BE-2: Auth, Ed25519 Licensing & Sequences** | 6 | 6 | 0 | 0 | 🟢 Completed |
| **Phase BE-3: Outpatient (OPD) Flow & Module Guard** | 6 | 0 | 1 | 5 | 🟡 In Progress |
| **Phase BE-4: Inpatient (IPD) Admission, Bed Allocations & Consents** | 5 | 0 | 0 | 5 | ⚪ Not Started |
| **Phase BE-5: 14-Form Inpatient Clinical Suite (Form Engine)** | 8 | 0 | 0 | 8 | ⚪ Not Started |
| **Phase BE-6: Inpatient Discharge & Consolidated 10-Head Billing** | 4 | 0 | 0 | 4 | ⚪ Not Started |
| **Phase BE-7: End-to-End API Integration & Concurrency Hardening** | 3 | 0 | 0 | 3 | ⚪ Not Started |
| **BACKEND TOTAL** | **38** | **12** | **1** | **25** | **31.6% Completed** |

---

### Backend Detailed Task Breakdown

#### Phase BE-1: Database Provisioning & Master Seeds (SaaS Ready)
*Objective: Provision all 56 MySQL 8.0 InnoDB tables, multi-tenancy structures, and master catalogs.*

- [x] **TASK-BE-1.1:** Verify MySQL 8.0 connectivity from FastAPI application (`app/core/database.py` with `QueuePool`, pool size = 20, max overflow = 10, ping pre-check enabled).
- [x] **TASK-BE-1.2:** Execute updated canonical schema DDL [`09_database_schema_ddl.sql`](file:///home/prem/Desktop/pbt/COS/docs/design/09_database_schema_ddl.sql) ensuring all tables, `tenant_modules`, `license_records`, `ipd_clinical_form_submissions` (with virtual generated columns `is_mlc`, `triage_score`), foreign keys, and indexes are created cleanly via `scripts/provision_canonical_schema.py`.
- [x] **TASK-BE-1.3:** Seed foundational multi-tenant data: `hospitals` (Default Tenant ID 1, slug `shubham`), `tenant_modules` (enabling `OPD`, `IPD`, `PHARMACY`, `PATHOLOGY`, `BILLING` for default tenant), `roles` (8 standard roles: `SUPER_ADMIN`, `ADMIN`, `DOCTOR`, `NURSE`, `RECEPTIONIST`, `PHARMACIST`, `LAB_TECHNICIAN`, `BILLING_CLERK`).
- [x] **TASK-BE-1.4:** Seed initial self-signed Ed25519 development license into `license_records` (valid for 365 days, full module access, 60 beds, 20 doctors) with initial `last_known_monotonic_time = NOW()`.
- [x] **TASK-BE-1.5:** Seed clinical infrastructure master data (`scripts/seed_clinical_infrastructure.py`):
  - Departments: General Medicine, General Surgery, Medical Oncology, Surgical Oncology.
  - Wards & Rooms: General Ward Male, General Ward Female, Semi-Private Ward, ICU.
  - Beds: 20 active beds (`BED-101` to `BED-120`) mapped to rooms and wards with initial status `AVAILABLE`.
  - Room Tariffs: General (₹1,500/day), Semi-Private (₹3,000/day), ICU (₹7,500/day).
- [x] **TASK-BE-1.6:** Seed test staff user accounts with Argon2id hashed credentials (`scripts/seed_staff_users.py`):
  - Doctor: `dr.sharma@brightsolutions.in` (Pass: `Doctor@123`) + `doctor_profiles`
  - Nurse: `nurse.anita@brightsolutions.in` (Pass: `Nurse@123`)
  - Receptionist: `reception@brightsolutions.in` (Pass: `Reception@123`)
  - Billing Officer: `billing@brightsolutions.in` (Pass: `Billing@123`)
  - Administrator: `admin@brightsolutions.in` (Pass: `Admin@123`)

#### Phase BE-2: Auth, Ed25519 Licensing & System Sequences
*Objective: Implement RBAC security guards, offline Ed25519 license validation, and concurrency-safe monotonic sequences.*

- [x] **TASK-BE-2.1:** Implement modular Auth endpoints in `app/modules/auth/router.py`:
  - `POST /api/v1/auth/login` (verifies Argon2id credentials, returns short-lived 15-min JWT access token + stateful 7-day refresh token in HTTP-only cookie, includes tenant info and active modules).
  - `POST /api/v1/auth/refresh` (handles Refresh Token Rotation and revocation check on `user_refresh_tokens`).
  - `GET /api/v1/auth/me` (returns current user profile, role, hospital context, licensed modules, and doctor profile).
- [x] **TASK-BE-2.2:** Build FastAPI `PermissionChecker` dependency in `app/core/dependencies.py` enforcing 0ms in-memory RBAC against [`13_rbac_permission_matrix.md`](file:///home/prem/Desktop/pbt/COS/docs/design/13_rbac_permission_matrix.md).
- [x] **TASK-BE-2.3:** Implement Asymmetric Ed25519 License Service (`app/core/licensing.py` — ADR-010):
  - In-memory license verification using embedded public key.
  - Clock rollback detection: check `NOW() >= last_known_monotonic_time`; update timestamp on transactions.
  - 14-day emergency grace period logic before shifting into read-only mode.
  - Endpoint `POST /api/v1/admin/license/upload` to upload/renew `.lic` offline file without server reboot.
- [x] **TASK-BE-2.4:** Build `@require_module("<MODULE_CODE>")` FastAPI route dependency in `app/core/dependencies.py`:
  - Checks if requested module is active in `tenant_modules` and license.
  - Returns `403 Forbidden: {"error": "MODULE_NOT_LICENSED", "module": "..."}` if disabled.
- [x] **TASK-BE-2.5:** Implement `SequenceService.get_next_sequence(sequence_key, tenant_id)` in `app/core/sequences.py` using `SELECT ... FOR UPDATE` row locks on `system_sequences` scoped per `(hospital_id, sequence_key)` to guarantee gapless numbers under multi-user concurrency.
- [x] **TASK-BE-2.6:** Initialize monotonic sequence counters: `UHID` (`BS-001001`), `OPD` (`OPD-001001`), `IPD` (`IPD-000501`), `BILL` (`INV-000101`).

#### Phase BE-3: Outpatient (OPD) Flow & Module Guard
*Objective: Full front-to-chamber flow from patient arrival to OPD consultation and IPD referral.*

- [ ] **TASK-BE-3.1:** Patient Registration & Master Patient Index (`POST /api/v1/patients`, `GET /api/v1/patients/search`):
  - Auto-generate gapless `UHID` via `SequenceService`.
  - Store demographic fields, contact phone, and irreversible HMAC-SHA-256 `aadhaar_hash` for duplicate checking (DPDP Act).
  - Support MPI search by name, phone, or UHID.
- [ ] **TASK-BE-3.2:** OPD Queue Check-In & Daily Token Issuance (`POST /api/v1/opd/tokens` — guarded by `@require_module("OPD")`):
  - Assign daily monotonic token (e.g. Token #12 for Dr. Sharma).
  - Record visit type (`NEW_VISIT`, `FOLLOW_UP`, `EMERGENCY`).
  - Calculate estimated wait time based on active queue length.
- [ ] **TASK-BE-3.3:** Nurse Triage Vitals Intake (`POST /api/v1/triage/vitals`):
  - Capture BP, Pulse Rate, Resp Rate, Temperature (°F), SpO2 (%), Height, Weight.
  - Auto-calculate BMI and BMI classification.
  - Evaluate CDSS vital alerts (Hypoxia SpO2 < 92%, Stage 2 Hypertension, Fever).
- [ ] **TASK-BE-3.4:** Doctor Consultation Chamber (`POST /api/v1/consultations`):
  - Autosave drafts for SOAP notes (Subjective, Objective, Assessment, Plan).
  - Search and link primary/secondary diagnoses from bundled ICD-10 India dataset (`icd10_codes`).
- [ ] **TASK-BE-3.5:** E-Prescription Creation & Inpatient Referral Flag:
  - Formulate medication prescriptions (drug name, dose, route, frequency: Stat/OD/BD/TDS, duration).
  - Run CDSS Drug-Drug Interaction (`check_ddi`) rule engine across active formulary.
  - **"Admit to IPD" Referral Order:** Flag patient for admission with provisional diagnosis, bed category preference, and clinical urgency.
- [ ] **TASK-BE-3.6:** Digital Consultation Sign-Off (`POST /api/v1/consultations/{id}/sign`):
  - Immutably lock SOAP notes (`status = 'SIGNED'`).
  - Automatically route admitted patients to the IPD Admission Desk queue.

#### Phase BE-4: Inpatient (IPD) Admission, Bed Allocations & Consents
*Objective: Support dual intake paths, bed matrix assignment, advance collection, and Forms 8 & 9.*

- [ ] **TASK-BE-4.1:** Bed Occupancy Matrix & Status API (`GET /api/v1/beds/matrix` — guarded by `@require_module("IPD")`):
  - Visual matrix of wards, rooms, and beds with real-time states (`AVAILABLE`, `OCCUPIED`, `CLEANING`, `MAINTENANCE`).
- [ ] **TASK-BE-4.2:** Dual-Path IPD Admission Endpoint (`POST /api/v1/ipd/admissions`):
  - **Path A (OPD Referral):** Handoff patient from active consultation, pre-populating provisional diagnosis and referring doctor.
  - **Path B (Direct / Emergency Walk-In):** Front-desk / Casualty direct admission without prior OPD visit (supports standalone IPD module rental).
- [ ] **TASK-BE-4.3:** Concurrency-Safe Bed Allocation (`ipd_bed_allocations`):
  - Lock chosen bed with `SELECT ... FOR UPDATE`, verify status is `AVAILABLE`, set bed to `OCCUPIED`.
  - Auto-generate monotonic `IPD_NUMBER` via `SequenceService` (e.g. `IPD-000501`).
  - Lock historical daily room rate into `ipd_bed_allocations.daily_rate`.
- [ ] **TASK-BE-4.4:** Inpatient Admission Form & Legal Flags (Forms 8 & 9 Data Capture):
  - Medico-Legal Case (`is_mlc`, police station details).
  - Next of Kin / Guardian details (name, relationship, emergency phone).
  - Payment category: Self-Pay Cash vs TPA Insurance (provider name, policy number).
  - Record initial financial advance deposit (`advance_amount_paid`).
- [ ] **TASK-BE-4.5:** Admission Consent & Face Sheet Print Payload (`GET /api/v1/ipd/admissions/{id}/consent-form`):
  - Structured data response formatted for printing **Admission Consent (AH/MRD/FORM - 8)** in English & Gujarati and **Admission Face Sheet (AH/MRD/FORM - 9)**.

#### Phase BE-5: 14-Form Inpatient Clinical Suite (Form Engine — ADR-009)
*Objective: Implement the full 14 clinical and administrative paper forms from `IPD Book 6 Days.pdf`.*

- [ ] **TASK-BE-5.1:** Universal Form Submission Infrastructure (`app/modules/ipd/services/form_service.py`):
  - `POST /api/v1/ipd/admissions/{id}/forms/{form_code}` (validates payload against registered Pydantic schema, stores in `ipd_clinical_form_submissions`).
  - `GET /api/v1/ipd/admissions/{id}/forms/{form_code}` (retrieves latest or specific version of form submission).
  - `GET /api/v1/ipd/admissions/{id}/forms` (lists all submitted forms, timestamps, signing clinicians).
- [ ] **TASK-BE-5.2:** Pydantic Registry for Intake & Assessment Forms:
  - **FORM_08:** Admission Consent & Authorization (Authorization for treatment, high-risk surgical acknowledgment, Gujarati/English translations).
  - **FORM_09:** Inpatient Face Sheet & Demographics (Emergency contact, TPA insurance card details, MLC status).
  - **FORM_10:** Doctor H&P Admission Note (Chief Complaints, HPI, past medical/surgical history, home medications, systemic review CVS/RS/PA/CNS).
  - **FORM_70:** Nursing Initial Admission Assessment (15-minute triage, Morse Fall Risk assessment, Braden Pressure Sore score, allergy verification).
- [ ] **TASK-BE-5.3:** Repeating Daily Operational Flowsheets (Relational Core):
  - **FORM_29 Doctor Treatment Orders (`ipd_treatment_orders`):** Drug name, dose, route, frequency, start/stop times; **Oxygen Therapy** device & flow rate (L/min); special diet instructions.
  - **FORM_29 Nurse MAR (`ipd_treatment_administrations`):** Timestamps for drug doses given, omitted reasons, held-by-doctor flags.
  - **FORM_61 24h Fluid Balance (`ipd_intake_output`):** Shift-wise recording of Oral/RT, IV fluids, Urine, RT aspirate/vomitus, Stool, Drains with signed net balance (`intake - output`).
- [ ] **TASK-BE-5.4:** Pydantic Registry for Daily Nursing & Care Plans:
  - **FORM_71:** Nurse Care Plan & Daily Goals (Airway patency, fluid balance maintenance, IV site care, pain control goals).
  - **FORM_72:** Nurse Progress Notes & Shift Handover (Morning, Evening, Night shift narrative, NEWS2 score, Wong-Baker 0–10 pain score).
- [ ] **TASK-BE-5.5:** Pydantic Registry for Surgical & OT Flow:
  - **FORM_15 / FORM_151:** Pre-Anaesthesia Assessment & Surgical Consent (Mallampati score, ASA grading, fasting status, tooth condition, anaesthetic risk sign-off).
  - **FORM_54:** Preoperative Nurse & OT Checklist (Surgical site marking confirmation, NPO status, jewelery removed, blood arranged).
  - **FORM_OP_NOTES:** Surgeon Pre-Op Note, Operation Note (Incisions, findings, procedure performed, swabs counted), and Post-Op Recovery Note.
- [ ] **TASK-BE-5.6:** Pydantic Registry for Clinical Transitions:
  - **FORM_HANDOVER:** Doctor Handover & Takeover Form (Attending handover, pending diagnostic tests, critical watch parameters).
  - **FORM_TRANSFER:** Department Transfer Form (Ward-to-ICU / OT transfer checklist, transport vitals, active IV infusions handoff).
- [ ] **TASK-BE-5.7:** Pydantic Registry for Experience & Feedback:
  - **FORM_FEEDBACK:** Inpatient Feedback Form (Bilingual English/Gujarati patient rating on nursing care, doctor communication, cleanliness, billing clarity).
- [ ] **TASK-BE-5.8:** Form Locking & Digital Sign-off (`POST /api/v1/ipd/admissions/{id}/forms/{form_code}/lock`):
  - Transition form `status` from `'SUBMITTED'` to `'LOCKED'`, creating an immutable audit trail entry.

#### Phase BE-6: Inpatient Discharge & Consolidated 10-Head Billing
*Objective: Clinical discharge sign-off, bed release, and itemized billing settlement.*

- [ ] **TASK-BE-6.1:** Structured Discharge Summary (`POST /api/v1/ipd/admissions/{id}/discharge-summary`):
  - Synthesize provisional diagnosis, hospital course, final ICD-10 diagnosis, condition at discharge (`STABLE`, `IMPROVED`, `LAMA`, `EXPIRED`, `TRANSFERRED`), discharge medications, and follow-up date.
  - Mandatory attending doctor digital sign-off.
- [ ] **TASK-BE-6.2:** Consolidated 10-Head Inpatient Ledger Calculation:
  - Service: `BillingService.calculate_accrued_ipd_charges(admission_id)`.
  - Calculate charges across all 10 NABH cost heads: Bed rent, Doctor rounds, Nursing, Procedures, Pharmacy, Lab, OT fees, Anaesthesia, Oxygen/Equipment, Consumables.
- [ ] **TASK-BE-6.3:** Final Invoice Generation & Payment Settlement (`POST /api/v1/billing/invoices/ipd-final` — guarded by `@require_module("BILLING")`):
  - Generate monotonic `INVOICE_IPD` number via `SequenceService` (`INV-IPD-000052`).
  - Credit previously collected `advance_amount_paid`.
  - Collect remaining balance via Cash, UPI UTR, Card auth, or Cheque.
  - Enforce exact rupee reconciliation (`net_amount == paid + balance`).
- [ ] **TASK-BE-6.4:** Formal Discharge & Bed Release (`POST /api/v1/ipd/admissions/{id}/discharge`):
  - Verify discharge summary is signed AND bill balance is zero (or authorized waiver).
  - Set `ipd_admissions.status = 'DISCHARGED'`, `discharge_date = NOW()`.
  - Release bed: set `ipd_bed_allocations.released_at = NOW()`, transition bed to `CLEANING`.

#### Phase BE-7: End-to-End API Integration & Concurrency Hardening
*Objective: Verify the complete vertical slice from registration to discharge in automated pytest suites.*

- [ ] **TASK-BE-7.1:** Automated End-to-End Pytest (`tests/test_opd_to_ipd_lifecycle.py`):
  - Walk patient through: Register $\to$ OPD Token $\to$ Triage Vitals $\to$ Doctor Chamber $\to$ IPD Referral $\to$ Bed Allocation (Form 8 & 9) $\to$ H&P Assessment (Form 10) $\to$ Treatment Order & MAR (Form 29) $\to$ Intake/Output (Form 61) $\to$ OT Checklist (Form 54) $\to$ Signed Discharge $\to$ Final Bill Payment.
- [ ] **TASK-BE-7.2:** Concurrency & License Protection Test:
  - Verify that simultaneous admission attempts for the same bed result in clean `409 Conflict` with zero double-bookings.
  - Test simulated clock rollback: verify system flags clock tampering and restricts new writes.
- [ ] **TASK-BE-7.3:** Exact Rupee Financial Balance Audit:
  - Verify advance payment credit deduction and ledger accuracy across all 10 charge heads.

---

## Workstream B: Frontend Architecture, Design Polish & Inpatient Suite (Developer 2)
*Lead Responsibility: React 18 / Tailwind Design System, Specialized Layout Shells, State Management, Inpatient 14-Form Folio, Interactive Bed Matrix & Thermal Receipts.*

### Frontend Executive Progress Tracker

| Milestone Phase | Total Tasks | Completed | In Progress | Pending | Status |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Phase FE-1: Modular SaaS Shell, Auth Context & License Guard** | 6 | 0 | 1 | 5 | 🟡 In Progress |
| **Phase FE-2: Outpatient (OPD) Workspaces & Live Queue Polish** | 6 | 0 | 0 | 6 | ⚪ Not Started |
| **Phase FE-3: Inpatient (IPD) Bed Matrix & Dual-Path Intake Modals** | 5 | 0 | 0 | 5 | ⚪ Not Started |
| **Phase FE-4: Digitized 14-Form Inpatient Folio (Client 6-Day Suite)** | 8 | 0 | 0 | 8 | ⚪ Not Started |
| **Phase FE-5: Inpatient 10-Head Discharge Settlement & Receipt Polish** | 4 | 0 | 0 | 4 | ⚪ Not Started |
| **Phase FE-6: Chromeless Waiting Room TV Display & Edge LAN Beacon** | 3 | 0 | 0 | 3 | ⚪ Not Started |
| **Phase FE-7: Design System Polish, Typography & Responsive Review** | 6 | 0 | 0 | 6 | ⚪ Not Started |
| **FRONTEND TOTAL** | **38** | **0** | **1** | **37** | **0.0% Completed** |

---

### Frontend Detailed Task Breakdown

#### Phase FE-1: Modular SaaS Shell, Auth Context & License Guard
*Objective: Build dynamic SaaS module navigation, JWT session lifecycle, and persistent License Status indicator.*

- [ ] **TASK-FE-1.1:** Upgrade Auth State Context (`frontend/src/context/AuthContext.jsx` or `frontend/context/AuthContext.jsx`):
  - Connect to backend `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, and `GET /api/v1/auth/me`.
  - Store short-lived access token in memory; handle automatic silent token refresh before 15-minute expiration via HTTP-only cookie.
  - Store authenticated user profile, role, hospital context (`shubham`), and `enabled_modules` array.
- [ ] **TASK-FE-1.2:** Dynamic Modular Sidebar Navigation (`frontend/components/Sidebar.jsx`):
  - Inspect `auth.enabled_modules` in state; dynamically show/hide sidebar menu groups (`OPD`, `IPD`, `PHARMACY`, `PATHOLOGY`, `BILLING`).
  - Gracefully render disabled/unsubscribed modules with a subtle "Add-on Module" badge or lock icon that opens a SaaS upgrade modal.
  - Implement collapsible sidebar state with persistent local preference and active route highlighting.
- [ ] **TASK-FE-1.3:** Persistent License Status Pill & Grace Period Banner (`frontend/components/Navbar.jsx`):
  - Query `GET /api/v1/admin/license` on mount.
  - Render persistent pill in Topbar:
    - 🟢 `[ ACTIVE ]` (Tooltip: "364 days remaining • Enterprise 60 Beds")
    - 🟡 `[ GRACE PERIOD - 10 Days Left ]` (Amber warning banner across all layout shells)
    - 🔴 `[ EXPIRED / READ-ONLY ]` (Red lock banner indicating write restriction)
    - ⚠️ `[ CLOCK TAMPERED ]` (Security warning banner)
- [ ] **TASK-FE-1.4:** Offline License Management UI (`frontend/pages/LicenseManagementPage.jsx` at `/admin/licensing`):
  - Visual summary card of hospital tenant, expiration date, active bed/doctor quotas, and module checklist.
  - Drag-and-drop License Upload Dropzone for `.lic` signed offline tokens and manual string paste textarea for air-gapped renewals.
  - Immediate feedback toast on successful renewal via `POST /api/v1/admin/license/upload` with zero page reload.
- [ ] **TASK-FE-1.5:** Layout Shell Architecture Implementation (`frontend/layouts/`):
  - Implement 5 core layout shells defined in `15_page_route_map.md`:
    - `ChamberLayout` (Doctor consultation with pinned patient vitals bar)
    - `WardLayout` (Inpatient ward station with bed grid navigation)
    - `CounterLayout` (High-speed reception and billing cashier views)
    - `AdminLayout` (Hospital configuration and license management)
    - `AuthLayout` (Clean, focused staff sign-in screen)
- [ ] **TASK-FE-1.6:** Declarative Frontend Route Guards (`ProtectedRoute.jsx` & `ModuleRouteGuard.jsx`):
  - Enforce authentication check (redirect to `/login` with `returnUrl`).
  - Enforce RBAC permission check via `hasPermission(permissionCode)` against D13 matrix strings.
  - Enforce SaaS module entitlement check (redirect to `/unauthorized` with `MODULE_NOT_LICENSED` explanation if tenant lacks module).

#### Phase FE-2: Outpatient (OPD) Workspaces & Live Queue Polish
*Objective: High-speed front-desk registration, nurse vitals intake, and doctor consultation chamber with pinned vitals.*

- [ ] **TASK-FE-2.1:** High-Speed Patient Registration Modal (`frontend/components/PatientRegistrationModal.jsx`):
  - Optimized keyboard-accessible form (Enter key advances to next field, `Alt+S` saves).
  - Demographic fields: First Name, Middle Name, Last Name, DOB/Age toggle, Gender, Blood Group, Phone, Address, Next of Kin.
  - Real-time duplicate Aadhaar / Phone alert via MPI check against `POST /api/v1/patients/search`.
  - Immediate modal confirmation showing generated `UHID` (`BS-001001`) with 1-click printable registration slip / barcode sticker.
- [ ] **TASK-FE-2.2:** OPD Queue Check-In & Token Issuance (`frontend/components/TokenQueueManagementView.jsx`):
  - Doctor selection dropdown with live OPD schedule indicator and current waiting queue count.
  - Visit category selector: `NEW_VISIT`, `FOLLOW_UP`, `EMERGENCY`.
  - Generates token number (e.g. `Token #12 - Dr. Sharma`) and auto-triggers 80mm thermal token print dialog.
- [ ] **TASK-FE-2.3:** Nurse Triage Vitals Intake Screen (`frontend/pages/NurseVitalsIntakePage.jsx` at `/nurse/triage/:visitId`):
  - Numeric keypad inputs for Systolic BP, Diastolic BP, Pulse, SpO2, Temp (°F), Resp Rate, Weight (kg), Height (cm).
  - Auto-calculating BMI badge with real-time WHO classification color code (`Underweight`, `Normal`, `Overweight`, `Obese`).
  - Visual CDSS Vital Panic Flags (Pulsing Red indicator for SpO2 < 92% Hypoxia, Stage 2 Hypertension, Hyperpyrexia).
- [ ] **TASK-FE-2.4:** Doctor Consultation Chamber Workspace (`frontend/pages/DoctorConsultationPage.jsx` at `/doctor/consultation/:visitId`):
  - Pinned Patient Header Bar: UHID, Name, Age/Gender, Blood Group, Allergies pill, and triage vitals.
  - Tabbed clinical workspace: Chief Complaints, SOAP Clinical Notes with autosave indicator ("Draft saved 10s ago"), ICD-10 diagnostic search picker with autocomplete.
  - `UnsavedChangesGuard`: browser warning if navigating away with uncommitted consultation notes.
- [ ] **TASK-FE-2.5:** E-Prescription Composer & Drug-Drug Interaction CDSS Modal:
  - Fast drug search with brand/generic matching, dosage form pills (Tab, Cap, Syrup, Inj), frequency selector (Stat, OD, BD, TDS, QID), and duration.
  - Real-time synchronous CDSS DDI evaluation via `POST /api/v1/cdss/check-ddi`:
    - Critical / Contraindicated interaction modal popup (blocks signing unless doctor enters justified override reason).
    - Advisory warning toasts for moderate interactions.
  - **"Admit to IPD" Action Button:** Opens rapid admission referral drawer with provisional diagnosis prefilled.
- [ ] **TASK-FE-2.6:** Consultation Digital Sign-Off & Thermal Rx Preview:
  - Two-step confirmation sign-off dialog locking SOAP notes (`status = 'SIGNED'`).
  - Printable Prescription Preview modal formatted with hospital header, doctor GMC registration, Rx symbol, dosage instructions in English/Gujarati, and digital QR code verification.

#### Phase FE-3: Inpatient (IPD) Bed Matrix & Dual-Path Intake Modals
*Objective: Real-time visual ward occupancy grid, bed reservation dialog, and Forms 8 & 9 capture.*

- [ ] **TASK-FE-3.1:** Interactive Ward Bed Occupancy Matrix (`frontend/pages/BedMatrixPage.jsx` at `/ipd/beds`):
  - Ward filter tabs: `All Wards`, `General Ward Male`, `General Ward Female`, `Semi-Private Ward`, `ICU`.
  - Grid of bed cards with color-coded live states:
    - 🟢 `AVAILABLE` (Clickable for instant admission booking)
    - 🔴 `OCCUPIED` (Shows patient UHID, name, attending doctor, admission day count, and 1-click jump to Folio)
    - 🟡 `CLEANING` (Housekeeping status badge with "Mark Ready" button)
    - ⚪ `MAINTENANCE`
  - Real-time summary statistics bar: Total Beds (20), Occupied (X), Available (Y), Occupancy Rate (Z%).
- [ ] **TASK-FE-3.2:** Dual-Path IPD Admission Booking Dialog (`frontend/components/AdmissionBookingModal.jsx`):
  - **Tab A — OPD Referral Queue:** Displays waiting list of patients flagged for admission by Dr. Sharma in OPD chamber. Selecting a patient automatically pulls their demographic data, provisional diagnosis, and referring doctor.
  - **Tab B — Direct Emergency Walk-In:** Instant intake form for direct casualty admissions without prior OPD visit (validating standalone IPD operation).
- [ ] **TASK-FE-3.3:** Concurrency-Safe Bed Selector & Rate Confirmation:
  - Interactive room and bed selector displaying locked room rates (General ₹1,500/day, Semi-Private ₹3,000/day, ICU ₹7,500/day).
  - Handles concurrent bed booking conflict: if another user books the bed first, renders immediate non-crashing `409 Conflict` modal: *"Bed BED-105 was just reserved by Nurse Anita. Please select another bed."*
- [ ] **TASK-FE-3.4:** Admission Intake Form & Legal Flags Capture (Forms 8 & 9 UI):
  - MLC (Medico-Legal Case) toggle switch: reveals police station name, FIR number, constable badge number, and accident details.
  - Next of Kin / Legal Guardian section: Name, Relationship, Phone, Address.
  - Payment Category: Self-Pay Cash vs TPA Insurance (Insurance company name, TPA card ID, pre-authorization amount).
  - Advance Deposit Receipt entry with immediate receipt printing.
- [ ] **TASK-FE-3.5:** Printable Inpatient Face Sheet & Consent Printouts:
  - **Form 8 (Admission Consent):** Bilingual English/Gujarati print template containing patient rights, financial responsibility clause, high-risk surgical consent, and patient/guardian signature lines.
  - **Form 9 (Inpatient Face Sheet):** Standard MRD admission face sheet with barcode, UHID, IPD number, provisional diagnosis, and bed location.

#### Phase FE-4: Digitized 14-Form Inpatient Folio (Client 6-Day Suite)
*Objective: The digitized client clinical binder (`/ipd/admissions/:id/folio`) supporting all 14 clinical forms from `IPD Book 6 Days.pdf`.*

- [ ] **TASK-FE-4.1:** Inpatient Folio Container & Navigation Shell (`frontend/pages/InpatientFolioPage.jsx`):
  - Persistent Inpatient Clinical Banner: UHID, IPD No, Bed No, Patient Name, Age/Gender, Admitted Date, Attending Doctor, MLC badge, Advance Paid badge.
  - Tab navigation bar matching client dossier structure:
    - Tab 1: `Intake & Consents`
    - Tab 2: `Treatment & MAR (Form 29)`
    - Tab 3: `Fluid Balance (Form 61)`
    - Tab 4: `Nursing & Care Plans (Forms 71 & 72)`
    - Tab 5: `Surgical & OT (Forms 15 & 54)`
    - Tab 6: `Handovers & Transfers`
    - Tab 7: `Discharge & Feedback`
  - URL query parameter synchronization (`?tab=mar&sub=...`) allowing direct bookmarking and tab restoration on reload.
- [ ] **TASK-FE-4.2:** Intake & Assessment Forms Workspace (Tab 1):
  - **Sub-Tab 1.1 — Form 8 (Admission Consent):** Interactive consent review, authorization toggles, bilingual Gujarati/English text view, signature timestamp recorder.
  - **Sub-Tab 1.2 — Form 9 (Inpatient Face Sheet):** Complete demographic, MLC, and insurance display with inline edit permissions for reception.
  - **Sub-Tab 1.3 — Form 10 (Doctor H&P Admission Note):** Chief complaints narrative, history of present illness (HPI), past medical/surgical history, home medications table, systemic examination (CVS, Respiratory, Abdomen, CNS), provisional diagnosis.
  - **Sub-Tab 1.4 — Form 70 (Nursing Initial Assessment):** 15-minute triage intake, Morse Fall Risk scoring calculator, Braden Pressure Ulcer risk scale, allergy wristband verification checkbox.
- [ ] **TASK-FE-4.3:** Form 29 Inpatient Treatment Orders & 6-Day Nurse MAR Grid (Tab 2):
  - **Doctor Order Composer:** Add scheduled medications, Stat doses, IV fluid orders, Oxygen therapy (device: Nasal Cannula/Face Mask/NRBM, flow rate: L/min), and special diet instructions.
  - **6-Day Nurse MAR Administration Matrix:**
    - Horizontal date header: Day 1 to Day 6 with calendar dates.
    - Rows: Active prescribed drugs with route, dosage, and scheduled shift times (08:00, 14:00, 20:00, 02:00).
    - Status cells: `Given` (Green check + nurse initials + exact timestamp), `Held` (Amber pause + reason), `Omitted` (Red cross + reason).
    - Modal dialog to log drug administration with dose confirmation and barcode scan option.
- [ ] **TASK-FE-4.4:** Form 61 Daily 24h Fluid Balance Chart (Tab 3):
  - Shift-wise tables (Morning 07:00–15:00, Evening 15:00–23:00, Night 23:00–07:00).
  - **Intake Columns:** Oral/RT fluids (ml), IV infusions (ml with fluid type), Blood products (ml).
  - **Output Columns:** Urine output (ml), RT aspirate / vomitus (ml), Drains (ml), Stool count.
  - **Auto-Calculating Net Balance Badge:** Computes `Total Intake - Total Output` in real time with visual indicator (+500 ml positive balance / negative balance warning).
- [ ] **TASK-FE-4.5:** Nursing Care Plans & Shift Handover Notes (Tab 4):
  - **Form 71 (Nurse Care Plan):** Nursing diagnosis picker, patient goals, interventions checklist, and evaluation notes.
  - **Form 72 (Nurse Shift Progress Notes):** 3-shift handover narrative, NEWS2 (National Early Warning Score) automated calculator with physiological risk level badge, Wong-Baker 0–10 visual facial pain scale selector.
- [ ] **TASK-FE-4.6:** Surgical & OT Flow Suite (Tab 5):
  - **Form 15 / 151 (Pre-Anaesthesia Assessment):** Mallampati airway classification picker (Class I to IV), ASA physical status grading (ASA I to VI), fasting status (NPO hours), loose teeth check, anaesthetic risk acknowledgment.
  - **Form 54 (Preoperative Nurse & OT Checklist):** Surgical site marking confirmed checkbox, jewellery removed, dentures removed, preoperative voiding confirmed, consent verified, blood units crossmatched.
  - **Form OP_NOTES (Operation Theatre Notes):** Surgeon pre-op note, intraoperative record (incisions, surgical findings, procedure performed, gauze/swab count sign-off), post-operative recovery orders.
- [ ] **TASK-FE-4.7:** Clinical Transitions & Experience Feedback (Tabs 6 & 7):
  - **Doctor Handover / Takeover Form:** SBAR structured clinical handover (Situation, Background, Assessment, Recommendation), pending diagnostic investigations tracker.
  - **Department Transfer Form:** Ward-to-ICU / OT transfer checklist, transport vitals, active IV line handoff verification.
  - **Form Feedback (Patient Experience Form):** Bilingual English/Gujarati 5-star rating and smiley scale on nursing responsiveness, doctor explanations, ward cleanliness, and billing transparency.
- [ ] **TASK-FE-4.8:** Generic Dynamic Form Renderer Engine (`DynamicFormRenderer.jsx`):
  - Reusable component that renders form fields, validation errors, and submission buttons dynamically from Pydantic schema specifications, ensuring future forms can be added without writing bespoke UI pages.

#### Phase FE-5: Inpatient 10-Head Discharge Settlement & Receipt Polish
*Objective: Financial ledger breakdown across 10 NABH cost heads, advance deduction, and receipt printing.*

- [ ] **TASK-FE-5.1:** Doctor Clinical Discharge Summary Page (`frontend/pages/DischargeSummaryPage.jsx` at `/ipd/admissions/:id/discharge`):
  - Clinical course of hospitalisation narrative summary, final ICD-10 diagnosis selector, procedures performed list.
  - Condition at discharge radio buttons: `STABLE`, `IMPROVED`, `RELIEVED`, `LAMA` (Left Against Medical Advice), `EXPIRED`, `TRANSFERRED`.
  - Discharge medications table with dosage instructions and follow-up appointment date.
  - Digital sign-off button locking the clinical encounter and notifying billing.
- [ ] **TASK-FE-5.2:** 10-Head Inpatient Billing Ledger & Settlement Modal (`frontend/pages/IpdSettlementPage.jsx` at `/billing/ipd-settlement/:admissionId`):
  - Collapsible accordion showing charges itemized across all 10 NABH cost heads:
    1. Bed Rent / Room Charges
    2. Doctor Consultation & Daily Rounds
    3. Nursing Care Charges
    4. Surgical & Medical Procedures
    5. Inpatient Pharmacy Medications & IV Fluids
    6. Pathology & Laboratory Investigations
    7. Operation Theatre (OT) Charges
    8. Anaesthesia Fees
    9. Oxygen Therapy & Medical Equipment
    10. Consumables & Disposable Supplies
  - Displays total gross charges, taxes, discounts applied, and prominent credit deduction of `advance_amount_paid`.
- [ ] **TASK-FE-5.3:** Multi-Mode Payment Collection & Exact Rupee Reconciliation:
  - Payment split selector: Cash, UPI (UTR reference input), Credit/Debit Card (Auth code input), Cheque/NEFT.
  - Live rupee balance reconciliation indicator: prevents checkout if `paid_amount != balance_amount`.
  - Authorised financial waiver checkbox with mandatory administrator override PIN.
- [ ] **TASK-FE-5.4:** Formal Discharge Clearance & Bed Release Trigger:
  - Invokes `POST /api/v1/ipd/admissions/:id/discharge` upon zero balance settlement.
  - Triggers printable final discharge invoice (A4 format with itemized 10-head summary and hospital tax ID/GSTIN).
  - Updates bed matrix to transition bed into `CLEANING` state.

#### Phase FE-6: Chromeless Waiting Room TV Display & Edge LAN Beacon
*Objective: Unauthenticated public display screen and edge fallback synchronization indicator.*

- [ ] **TASK-FE-6.1:** Waiting Lounge Token TV Display Page (`frontend/pages/WaitingRoomDisplayPage.jsx` at `/display/waiting-room`):
  - Chromeless, high-contrast fullscreen layout optimized for 1080p / 4K waiting room TV monitors.
  - Server-Sent Events (SSE) integration with `/api/v1/display/queue/stream` for zero-polling real-time updates.
  - Zero PHI leakage: Displays only Token Number, Consulting Doctor, Room Number, and Status (`CALLING`, `IN CONSULTATION`, `NEXT`).
  - Audio chime notification (`chime.mp3`) when a new patient token is called.
- [ ] **TASK-FE-6.2:** Inpatient Nursing Station Whiteboard Page (`frontend/pages/WardPublicBoardPage.jsx` at `/display/ward-matrix`):
  - Digital whiteboard view of active ward beds, occupied states, and on-duty nursing team.
- [ ] **TASK-FE-6.3:** Edge LAN Fallback Sync Beacon (`frontend/components/EdgeSyncBeacon.jsx`):
  - Persistent indicator in the bottom-right corner of all authenticated screens:
    - 🟢 `[ CLOUD ONLINE ]` (Connected to Contabo primary server)
    - 🟡 `[ LOCAL EDGE LAN ]` (Operating on local hospital Docker container; pending sync count badge)
  - Automatic reconnection heartbeat without interrupting active form entries.

#### Phase FE-7: Design System Polish, Typography & Responsive Review
*Objective: Production aesthetic polish, accessible typography, micro-interactions, and mobile review.*

- [ ] **TASK-FE-7.1:** Design System & Color Palette Calibration (`frontend/src/index.css` / `tailwind.config.js`):
  - Enforce professional clinical color system: Deep Medical Slate `#0F172A`, Clinical Cyan `#06B6D4`, Trust Teal `#0D9488`, Emergency Amber `#F59E0B`, Panic Crimson `#EF4444`.
  - Standardize button styles, badges, card elevations, and border radiuses across all pages.
- [ ] **TASK-FE-7.2:** Typography, Optical Sizing & Readability Review:
  - Calibrate font hierarchy using Inter / Roboto: high-legibility tabular figures for dosages, prices, and vitals (`font-mono font-medium`).
  - Ensure minimum 14px body text and high-contrast color ratios for hospital staff working under fluorescent lighting.
- [ ] **TASK-FE-7.3:** Interactive States, Skeletons & Micro-Animations:
  - Replace jarring layout shifts with sleek shimmer skeleton loaders during API queries.
  - Subtle micro-animations for modal opens, tab switches, and badge status changes (under 200ms spring timing).
- [ ] **TASK-FE-7.4:** Toast Notifications & Error Boundary Hardening:
  - Integrate unified Toast Notification manager for successful saves, warnings, and network errors.
  - Wrap clinical routes in React Error Boundaries with graceful fallback UI and 1-click error reporting.
- [ ] **TASK-FE-7.5:** Keyboard Shortcuts & Ergonomic Hotkeys:
  - Global hotkeys: `Alt + R` (Register Patient), `Alt + Q` (Queue View), `Alt + B` (Bed Matrix), `Escape` (Close Modal).
  - Autofocus initial input on modal open to enable rapid data entry without mouse dependency.
- [ ] **TASK-FE-7.6:** Responsive & Tablet Layout Review:
  - Optimize consultation chamber and inpatient folio for 10-inch hospital tablets (iPad / Android tablets used by doctors on ward rounds).
  - Ensure bedside vitals intake and MAR administration work seamlessly on touch devices.

---

## Change Log & Progress Updates
*As tasks are completed by either workstream, check the box `[x]`, update the executive progress tables above, and record the timestamp below.*

- **2026-10-28 18:02 IST**: [Backend] Completed TASK-BE-1.1 and TASK-BE-1.2. Executed `scripts/provision_canonical_schema.py` against MySQL 8.0 `test_clinicos_db`. Provisioned all 56 InnoDB canonical tables with foreign keys and verified virtual/stored generated columns (`is_mlc`, `triage_score`) in `ipd_clinical_form_submissions`.
- **2026-10-28 18:11 IST**: [Backend] Completed TASK-BE-1.3 and TASK-BE-1.4. Executed `scripts/seed_tenant_and_license.py` seeding default hospital tenant (ID 1, slug `shubham`), 8 standard RBAC roles, 5 active tenant modules (`OPD`, `IPD`, `PHARMACY`, `PATHOLOGY`, `BILLING`), and self-signed Ed25519 development license (365 days, 60 beds, 20 doctors) verified with public key.
- **2026-10-28 18:14 IST**: [Backend] Completed TASK-BE-1.5. Executed `scripts/seed_clinical_infrastructure.py` seeding 4 clinical departments, 4 wards (`GWM`, `GWF`, `SPW`, `ICU`), 4 rooms, 20 active beds (`BED-101` to `BED-120`) in `AVAILABLE` state, and tariff catalog entries.
- **2026-10-28 18:34 IST**: [Backend] Completed TASK-BE-1.6. Executed `scripts/seed_staff_users.py` seeding 5 test staff accounts (`dr.sharma`, `nurse.anita`, `reception`, `billing`, `admin`) with Argon2id hashed credentials, linked Dr. Sharma's `doctor_profiles` record, and upgraded `app/core/security.py` to support Argon2id password hashing and verification. Phase BE-1 is 100% completed.
- **2026-10-28 18:50 IST**: [Backend] Completed TASK-BE-2.1. Implemented `app/modules/auth/router.py` with `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, and `GET /api/v1/auth/me`. Created `user_refresh_tokens` table for Refresh Token Rotation (RTR) and family revocation detection, mounted router in `app/main.py`, and verified with automated test client.
- **2026-10-28 18:54 IST**: [Backend] Completed TASK-BE-2.2. Implemented `app/core/dependencies.py` with `PermissionChecker` and `require_permission()`, providing 0ms in-memory cached RBAC enforcement across all 8 roles and 40+ granular permissions from `13_rbac_permission_matrix.md`. Verified via automated tests.
- **2026-10-28 18:58 IST**: [Backend] Completed TASK-BE-2.3. Implemented `app/core/licensing.py` with `LicenseService` for asymmetric Ed25519 offline license verification, monotonic clock rollback detection, 14-day emergency grace period, and endpoint `POST /api/v1/admin/license/upload` enabling instant offline license renewal without server reboots. Mounted under `/api/v1` and verified via automated test client.
- **2026-10-28 19:01 IST**: [Backend] Completed TASK-BE-2.4. Implemented `ModuleGuard` and `require_module("<MODULE_CODE>")` dependency in `app/core/dependencies.py` to protect unpurchased SaaS modules with standard `403 Forbidden` (`MODULE_NOT_LICENSED`), supporting autonomous execution on standalone module subscriptions. Tested and verified.
- **2026-10-28 19:04 IST**: [Backend] Completed TASK-BE-2.5 and TASK-BE-2.6. Implemented `SequenceService` in `app/core/sequences.py` with `SELECT ... FOR UPDATE` row locks scoped per `(hospital_id, sequence_key)` to guarantee gapless numbers under multi-user concurrency. Initialized monotonic counters: `UHID` (`BS-001001`), `OPD` (`OPD-001001`), `IPD` (`IPD-000501`), `BILL` (`INV-000101`). Concurrency stress test passed with zero collisions. Phase BE-2 is 100% completed.
- **2026-10-28 19:08 IST**: [Planning] Restructured `artifacts/week1_tasks.md` into dual-workstream execution matrix (Workstream A: Backend Engineering with 38 tasks, Workstream B: Frontend Engineering with 38 tasks) to enable two concurrent engineers to build in parallel without branch collisions. Seeded comprehensive frontend roadmap across 7 dedicated phases incorporating all design documentation specifications.
