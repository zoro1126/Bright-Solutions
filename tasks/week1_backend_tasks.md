# Week 1 Implementation Plan — Workstream A: Backend Clinical Core & Modular SaaS
## Bright Solutions: Outpatient to Inpatient Clinical Core & Modular SaaS

> **Workstream:** Workstream A — Backend Engineering (Developer 1)  
> **Workspace Location:** `tasks/week1_backend_tasks.md`  
> **Master Program Index:** [week1_tasks.md](file:///home/prem/Desktop/pbt/COS/tasks/week1_tasks.md)  
> **Frontend Companion Plan:** [week1_frontend_tasks.md](file:///home/prem/Desktop/pbt/COS/tasks/week1_frontend_tasks.md)  
> **Status:** 🟡 SPRINT ACTIVE (Phase BE-1 & BE-2 Completed)  
> **Primary References:** [03_technical_architecture.md](file:///home/prem/Desktop/pbt/COS/docs/design/03_technical_architecture.md), [04_data_model_spec.md](file:///home/prem/Desktop/pbt/COS/docs/design/04_data_model_spec.md), [09_database_schema_ddl.sql](file:///home/prem/Desktop/pbt/COS/docs/design/09_database_schema_ddl.sql), [11_api_endpoint_inventory.md](file:///home/prem/Desktop/pbt/COS/docs/design/11_api_endpoint_inventory.md), [13_rbac_permission_matrix.md](file:///home/prem/Desktop/pbt/COS/docs/design/13_rbac_permission_matrix.md), [21_adrs.md](file:///home/prem/Desktop/pbt/COS/docs/design/21_adrs.md)  
> **Target Environment:** MySQL 8.0 (InnoDB, `utf8mb4`), FastAPI, Python 3.14 venv, SQLAlchemy 2.0 (`QueuePool`)  

---

## Backend Executive Progress Tracker

| Milestone Phase | Total Tasks | Completed | In Progress | Pending | Status |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Phase BE-1: Database Provisioning & Master Seeds (SaaS Ready)** | 6 | 6 | 0 | 0 | 🟢 Completed |
| **Phase BE-2: Auth, Ed25519 Licensing & Sequences** | 6 | 6 | 0 | 0 | 🟢 Completed |
| **Phase BE-3: Outpatient (OPD) Flow & Module Guard** | 6 | 0 | 1 | 5 | 🟡 In Progress |
| **Phase BE-4: Inpatient (IPD) Admission, Bed Allocations & Consents** | 5 | 0 | 0 | 5 | ⚪ Not Started |
| **Phase BE-5: 14-Form Inpatient Clinical Suite (Form Engine)** | 8 | 0 | 0 | 8 | ⚪ Not Started |
| **Phase BE-6: Inpatient Discharge & Consolidated 10-Head Billing** | 4 | 0 | 0 | 4 | ⚪ Not Started |
| **Phase BE-7: End-to-End API Integration & Concurrency Hardening** | 3 | 0 | 0 | 3 | ⚪ Not Started |
| **TOTAL** | **38** | **12** | **1** | **25** | **31.6% Completed** |

---

## Detailed Backend Task Breakdown

### Phase BE-1: Database Provisioning & Master Seeds (SaaS Ready)
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

---

### Phase BE-2: Auth, Ed25519 Licensing & System Sequences
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

---

### Phase BE-3: Outpatient (OPD) Flow & Module Guard
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

---

### Phase BE-4: Inpatient (IPD) Admission, Bed Allocations & Consents
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

---

### Phase BE-5: 14-Form Inpatient Clinical Suite (Form Engine — ADR-009)
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

---

### Phase BE-6: Inpatient Discharge & Consolidated 10-Head Billing
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

---

### Phase BE-7: End-to-End API Integration & Concurrency Hardening
*Objective: Verify the complete vertical slice from registration to discharge in automated pytest suites.*

- [ ] **TASK-BE-7.1:** Automated End-to-End Pytest (`tests/test_opd_to_ipd_lifecycle.py`):
  - Walk patient through: Register $\to$ OPD Token $\to$ Triage Vitals $\to$ Doctor Chamber $\to$ IPD Referral $\to$ Bed Allocation (Form 8 & 9) $\to$ H&P Assessment (Form 10) $\to$ Treatment Order & MAR (Form 29) $\to$ Intake/Output (Form 61) $\to$ OT Checklist (Form 54) $\to$ Signed Discharge $\to$ Final Bill Payment.
- [ ] **TASK-BE-7.2:** Concurrency & License Protection Test:
  - Verify that simultaneous admission attempts for the same bed result in clean `409 Conflict` with zero double-bookings.
  - Test simulated clock rollback: verify system flags clock tampering and restricts new writes.
- [ ] **TASK-BE-7.3:** Exact Rupee Financial Balance Audit:
  - Verify advance payment credit deduction and ledger accuracy across all 10 charge heads.

---

## Backend Change Log & Progress Updates
*As backend tasks are completed, check the box `[x]`, update the progress table above, and log the completion timestamp below.*

- **2026-10-28 18:02 IST**: Completed TASK-BE-1.1 and TASK-BE-1.2. Executed `scripts/provision_canonical_schema.py` against MySQL 8.0 `test_clinicos_db`. Provisioned all 56 InnoDB canonical tables with foreign keys and verified virtual/stored generated columns (`is_mlc`, `triage_score`) in `ipd_clinical_form_submissions`.
- **2026-10-28 18:11 IST**: Completed TASK-BE-1.3 and TASK-BE-1.4. Executed `scripts/seed_tenant_and_license.py` seeding default hospital tenant (ID 1, slug `shubham`), 8 standard RBAC roles, 5 active tenant modules (`OPD`, `IPD`, `PHARMACY`, `PATHOLOGY`, `BILLING`), and self-signed Ed25519 development license (365 days, 60 beds, 20 doctors) verified with public key.
- **2026-10-28 18:14 IST**: Completed TASK-BE-1.5. Executed `scripts/seed_clinical_infrastructure.py` seeding 4 clinical departments, 4 wards (`GWM`, `GWF`, `SPW`, `ICU`), 4 rooms, 20 active beds (`BED-101` to `BED-120`) in `AVAILABLE` state, and tariff catalog entries.
- **2026-10-28 18:34 IST**: Completed TASK-BE-1.6. Executed `scripts/seed_staff_users.py` seeding 5 test staff accounts (`dr.sharma`, `nurse.anita`, `reception`, `billing`, `admin`) with Argon2id hashed credentials, linked Dr. Sharma's `doctor_profiles` record, and upgraded `app/core/security.py` to support Argon2id password hashing and verification. Phase BE-1 is 100% completed.
- **2026-10-28 18:50 IST**: Completed TASK-BE-2.1. Implemented `app/modules/auth/router.py` with `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, and `GET /api/v1/auth/me`. Created `user_refresh_tokens` table for Refresh Token Rotation (RTR) and family revocation detection, mounted router in `app/main.py`, and verified with automated test client.
- **2026-10-28 18:54 IST**: Completed TASK-BE-2.2. Implemented `app/core/dependencies.py` with `PermissionChecker` and `require_permission()`, providing 0ms in-memory cached RBAC enforcement across all 8 roles and 40+ granular permissions from `13_rbac_permission_matrix.md`. Verified via automated tests.
- **2026-10-28 18:58 IST**: Completed TASK-BE-2.3. Implemented `app/core/licensing.py` with `LicenseService` for asymmetric Ed25519 offline license verification, monotonic clock rollback detection, 14-day emergency grace period, and endpoint `POST /api/v1/admin/license/upload` enabling instant offline license renewal without server reboots. Mounted under `/api/v1` and verified via automated test client.
- **2026-10-28 19:01 IST**: Completed TASK-BE-2.4. Implemented `ModuleGuard` and `require_module("<MODULE_CODE>")` dependency in `app/core/dependencies.py` to protect unpurchased SaaS modules with standard `403 Forbidden` (`MODULE_NOT_LICENSED`), supporting autonomous execution on standalone module subscriptions. Tested and verified.
- **2026-10-28 19:04 IST**: Completed TASK-BE-2.5 and TASK-BE-2.6. Implemented `SequenceService` in `app/core/sequences.py` with `SELECT ... FOR UPDATE` row locks scoped per `(hospital_id, sequence_key)` to guarantee gapless numbers under multi-user concurrency. Initialized monotonic counters: `UHID` (`BS-001001`), `OPD` (`OPD-001001`), `IPD` (`IPD-000501`), `BILL` (`INV-000101`). Concurrency stress test passed with zero collisions. Phase BE-2 is 100% completed.
- **2026-10-29 12:54 IST**: [Architecture Cleanup] Moved all legacy prototype code (`app/api`, `app/services`, `app/repositories`, `app/schemas`, legacy core engines, and tests) into git-ignored `legacy_backend/`. Cleaned `backend/app/main.py` and `backend/app/core/database.py` to match the canonical modular architecture in D03 §4.1 with zero dead code or clutter. Verified `/api/v1/health`, `/api/v1/auth/login`, and `/api/v1/admin/license`.

