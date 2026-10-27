# D22 — User Stories & Acceptance Criteria
## Bright Solutions: Clinical Hospital Operating System

> **Document ID:** D22  
> **Version:** 1.0  
> **Status:** APPROVED ARCHITECTURE SPECIFICATION  
> **Depends On:** [01_PRD.md](file:///home/prem/Desktop/pbt/COS/docs/design/01_PRD.md), [02_feature_spec.md](file:///home/prem/Desktop/pbt/COS/docs/design/02_feature_spec.md), [09_database_schema_ddl.sql](file:///home/prem/Desktop/pbt/COS/docs/design/09_database_schema_ddl.sql), [11_api_endpoint_inventory.md](file:///home/prem/Desktop/pbt/COS/docs/design/11_api_endpoint_inventory.md), [12_service_layer_design.md](file:///home/prem/Desktop/pbt/COS/docs/design/12_service_layer_design.md), [13_rbac_permission_matrix.md](file:///home/prem/Desktop/pbt/COS/docs/design/13_rbac_permission_matrix.md)  
> **Prepared By:** Bright Solutions Backend Engineering Team  
> **Last Updated:** October 2026  

---

## Table of Contents

1. [Specification Standards & Story Format](#1-specification-standards--story-format)
2. [Module 1 — Patient Registration Stories](#2-module-1--patient-registration-stories)
3. [Module 2 — OPD Queue Management Stories](#3-module-2--opd-queue-management-stories)
4. [Module 3 — Vital Signs & Triage Stories](#4-module-3--vital-signs--triage-stories)
5. [Module 4 — Doctor Consultation Stories](#5-module-4--doctor-consultation-stories)
6. [Module 5 — E-Prescription & Pharmacy Stories](#6-module-5--e-prescription--pharmacy-stories)
7. [Module 6 — IPD Admission, Stay & Discharge Stories](#7-module-6--ipd-admission-stay--discharge-stories)
8. [Module 7 — Pathology & Laboratory Stories](#8-module-7--pathology--laboratory-stories)
9. [Module 8 — Multi-Point Billing & Payments Stories](#9-module-8--multi-point-billing--payments-stories)
10. [Module 9 — CDSS & Clinical Safety Stories](#10-module-9--cdss--clinical-safety-stories)
11. [Module 10 & 11 — Auth & Admin Configuration Stories](#11-module-10--11--auth--admin-configuration-stories)
12. [Module 12 — Waiting Room Display Stories](#12-module-12--waiting-room-display-stories)

---

## 1. Specification Standards & Story Format

Every user story in Bright Solutions follows the standard behavioral format:

- **As a** `<Role / Persona>`
- **I want to** `<Action / Capability>`
- **So that** `<Clinical, Operational, or Statutory Value>`

### Acceptance Criteria Format (Gherkin)
- **Given** `<Initial State / Preconditions>`
- **When** `<Action Executed via API or UI>`
- **Then** `<Expected Verifiable Outcome & Side Effects>`

**Priority Scale:**
- 🔴 **P0 (Critical / Blocker):** Non-negotiable for 4-week MVP go-live.
- 🟡 **P1 (High):** Required for production MVP operations.

---

## 2. Module 1 — Patient Registration Stories

### US-REG-01: First-Time Patient Registration with Auto-UHID
- **Role:** Receptionist | **Priority:** 🔴 P0
- **Story:** As a Receptionist, I want to register a new walk-in patient with demographics and contact details, so that the patient receives a permanent unique hospital identifier (UHID).
- **Acceptance Criteria:**
  - **Given** a receptionist is logged in with `patient:create` permission.
  - **When** they submit valid patient details (Name, DOB, Gender, Phone `9876543210`, Address).
  - **Then** the system locks the `system_sequences` table, increments the `UHID` counter, generates a monotonic UHID (e.g. `BS-001042`), returns HTTP `201 Created`, and writes a registration audit event.

### US-REG-02: De-Duplication via Aadhaar Hash
- **Role:** Receptionist | **Priority:** 🔴 P0
- **Story:** As a Receptionist, I want the system to alert me if an incoming patient has an existing file based on their Aadhaar, so that we prevent duplicate medical charts.
- **Acceptance Criteria:**
  - **Given** an existing patient was registered with Aadhaar `123456789012` (stored as SHA-256 hash).
  - **When** the receptionist attempts to register another patient with the same 12-digit Aadhaar.
  - **Then** the backend computes the HMAC-SHA-256 hash, identifies the collision, rejects the request with HTTP `409 Conflict` (`DUPLICATE_PATIENT`), and returns the existing patient's UHID.

---

## 3. Module 2 — OPD Queue Management Stories

### US-OPD-01: OPD Visit Check-In & Token Issuance
- **Role:** Receptionist | **Priority:** 🔴 P0
- **Story:** As a Receptionist, I want to check in a patient for an outpatient consultation, assign a consulting doctor, and generate a numbered token, so that the patient is queued for care.
- **Acceptance Criteria:**
  - **Given** an active patient and an available doctor.
  - **When** the receptionist posts check-in details with fee collection.
  - **Then** the system generates a global monotonic OPD number (`OPD-004521`), allocates the next sequential daily token for that doctor (e.g. Token #14), sets token status to `WAITING`, creates an OPD consultation invoice, and emits an update to the TV display stream.

### US-OPD-02: Doctor Calling Token & Chamber Progression
- **Role:** Doctor | **Priority:** 🔴 P0
- **Story:** As a Doctor, I want to call the next waiting token into my chamber, so that patient consultation commences and the waiting room display updates in real time.
- **Acceptance Criteria:**
  - **Given** Token #14 is in `WAITING` status in the doctor's queue.
  - **When** the doctor clicks "Call Token" (`POST /queue/tokens/{uuid}/call`).
  - **Then** the token status transitions to `CALLED`, `called_at` is timestamped, and the waiting room smart TV highlights "Token 14, Room 102".

---

## 4. Module 3 — Vital Signs & Triage Stories

### US-TRI-01: Nursing Station Vitals Intake with Automatic BMI
- **Role:** Staff Nurse | **Priority:** 🔴 P0
- **Story:** As a Nurse, I want to record patient vitals at the triage desk before they see the doctor, so that the physician has immediate baseline physiological data.
- **Acceptance Criteria:**
  - **Given** an active OPD visit in `WAITING` status.
  - **When** the nurse enters Height `172 cm`, Weight `76.5 kg`, Pulse `82 bpm`, BP `120/80 mmHg`, Temp `98.4°F`, and SpO2 `98%`.
  - **Then** the system automatically calculates `bmi = 25.9`, sets `is_abnormal = 0`, persists to `vital_signs`, and makes the record visible in the doctor's consultation chart.

### US-TRI-02: Critical Vital Signs Red-Flag Trigger
- **Role:** Staff Nurse / Doctor | **Priority:** 🔴 P0
- **Story:** As a Nurse or Doctor, I want the system to automatically flag dangerous physiological parameters, so that clinical emergencies are expedited.
- **Acceptance Criteria:**
  - **Given** an incoming patient with acute respiratory distress.
  - **When** the nurse records `spo2_percentage = 88` and `blood_pressure_systolic = 195`.
  - **Then** the system flags `is_abnormal = 1`, populates `abnormal_flags_json` with `"Critical Hypoxia (SpO2 88%)"` and `"Critical Hypertension"`, and raises an alert banner on the doctor's workstation.

---

## 5. Module 4 — Doctor Consultation Stories

### US-CON-01: Structured SOAP Notes & Diagnostic Coding
- **Role:** Doctor | **Priority:** 🔴 P0
- **Story:** As a Doctor, I want to record subjective complaints, objective physical findings, assessment, and care plan, with linked ICD-10 diagnostic codes, so that patient history is standardized.
- **Acceptance Criteria:**
  - **Given** a patient is in consultation (`token.status = 'IN_CONSULTATION'`).
  - **When** the doctor types narrative SOAP notes and attaches ICD-10 code `A90` (Dengue Fever).
  - **Then** the system autosaves the draft to `consultations` and links diagnosis in `consultation_diagnoses`.

### US-CON-02: Finalizing & Digitally Signing Consultation Note
- **Role:** Doctor | **Priority:** 🔴 P0
- **Story:** As a Doctor, I want to finalize and sign the consultation encounter, so that the clinical chart is legally locked and the queue token is marked completed.
- **Acceptance Criteria:**
  - **Given** a draft consultation note with at least one attached diagnosis.
  - **When** the doctor submits `POST /consultations/{uuid}/sign`.
  - **Then** the system sets `status = 'SIGNED'`, timestamps `signed_at = NOW()`, closes the queue token (`status = 'COMPLETED'`), and locks the record against any subsequent modifications.

---

## 6. Module 5 — E-Prescription & Pharmacy Stories

### US-PHM-01: E-Prescribing with Mandatory DDI Safety Override
- **Role:** Doctor | **Priority:** 🔴 P0
- **Story:** As a Doctor, I want to prescribe medications from the hospital formulary, so that the pharmacist can dispense verified items with automatic drug interaction safety checks.
- **Acceptance Criteria:**
  - **Given** a doctor adds Warfarin and Aspirin to an e-prescription.
  - **When** the prescription is submitted without a contraindication override.
  - **Then** the system blocks the request with HTTP `400 Bad Request` (`UNJUSTIFIED_CONTRAINDICATION`).
  - **When** the doctor re-submits with a written justification (`"Under strict daily INR monitoring"`).
  - **Then** the prescription is created (`RX-001042`), and an override audit log entry is saved in `cdss_alerts_log`.

### US-PHM-02: Pharmacist Medication Dispensation & Stock Deduction
- **Role:** Pharmacist / Chemist | **Priority:** 🔴 P0
- **Story:** As a Pharmacist, I want to view unfulfilled prescriptions in my queue and dispense medications from active batches, so that physical stock is decremented and pharmacy bills are generated.
- **Acceptance Criteria:**
  - **Given** an unfulfilled prescription in the pharmacy queue.
  - **When** the pharmacist selects batch lot `#B2026-04` and dispenses 15 tablets.
  - **Then** the batch `available_quantity` decrements by 15, `prescription.status` transitions to `DISPENSED`, and a pharmacy invoice is automatically created.

---

## 7. Module 6 — IPD Admission, Stay & Discharge Stories

### US-IPD-01: Inpatient Admission & Bed Allocation
- **Role:** Receptionist / Admission Clerk | **Priority:** 🔴 P0
- **Story:** As an Admission Clerk, I want to admit a patient to an available bed in a designated ward, so that inpatient care commences and bed tariffs are locked.
- **Acceptance Criteria:**
  - **Given** Bed `ICU-04` is in `AVAILABLE` status.
  - **When** the clerk posts an admission request with provisional diagnosis and ₹5,000 advance.
  - **Then** the system generates IPD number `IPD-000512`, marks Bed `ICU-04` as `OCCUPIED`, initializes `ipd_bed_allocations` with ICU rate (₹5,000/day), and issues an advance payment receipt.

### US-IPD-02: Inter-Ward Bed Transfer with Rate Split
- **Role:** Nurse / Ward Supervisor | **Priority:** 🔴 P0
- **Story:** As a Nurse, I want to transfer a stabilized patient from the ICU to a General Ward bed, so that the bed ledger accurately reflects the rate change.
- **Acceptance Criteria:**
  - **Given** a patient currently admitted in `ICU-04`.
  - **When** the nurse executes a transfer to Bed `GEN-12` (Rate: ₹800/day).
  - **Then** the system sets `released_at = NOW()` on the ICU allocation, marks `ICU-04` as `CLEANING`, creates a new allocation for `GEN-12` with ₹800 rate, and updates `ipd_admissions.current_bed_id`.

### US-IPD-03: Consolidated Inpatient Discharge Settlement (10 Heads)
- **Role:** Billing Clerk | **Priority:** 🔴 P0
- **Story:** As a Billing Clerk, I want to generate a single consolidated final invoice covering all 10 IPD cost centers, so that the patient can settle their bill before departure.
- **Acceptance Criteria:**
  - **Given** an admitted inpatient ready for discharge with a signed discharge summary.
  - **When** the clerk requests `POST /billing/ipd/{uuid}/generate-final`.
  - **Then** the system aggregates Bed Rent, Doctor Visits, Nursing, Procedures, Pharmacy, Lab, and Consumables, credits the ₹5,000 advance, generates `INV-IPD-000052`, and outputs the remaining balance due.

---

## 8. Module 7 — Pathology & Laboratory Stories

### US-LAB-01: Test Ordering & Specimen Collection Acknowledgment
- **Role:** Doctor / Lab Technician | **Priority:** 🔴 P0
- **Story:** As a Doctor, I want to order lab panels (e.g. Complete Blood Count), and as a Lab Tech, I want to confirm blood sample collection.
- **Acceptance Criteria:**
  - **Given** a doctor creates order `LAB-001042` containing CBC.
  - **When** the lab technician draws the EDTA blood sample and clicks "Collect Sample".
  - **Then** order status transitions to `SAMPLE_COLLECTED`, timestamps `sample_collected_at`, and triggers an entry in the lab processing queue.

### US-LAB-02: Parameter Result Entry with Automatic Panic Alert
- **Role:** Lab Technician | **Priority:** 🔴 P0
- **Story:** As a Lab Technician, I want to input component results for ordered tests, so that abnormal and life-threatening panic values are automatically flagged.
- **Acceptance Criteria:**
  - **Given** a CBC sample in analysis.
  - **When** the technician enters Platelet Count `42000` (Panic limit: `< 50000 /mcL`).
  - **Then** the system sets `is_panic = 1` and `is_abnormal = 1` on the result row, displays a red panic warning, and notifies the ordering physician.

---

## 9. Module 8 — Multi-Point Billing & Payments Stories

### US-BIL-01: Multi-Point Payment Collection & Receipt Issuance
- **Role:** Cashier / Billing Clerk | **Priority:** 🔴 P0
- **Story:** As a Cashier, I want to collect payments via Cash, UPI, or Card against an invoice, so that patient bills are settled and physical receipts are printed.
- **Acceptance Criteria:**
  - **Given** an unpaid or partially paid invoice with a balance of ₹7,350.
  - **When** the cashier submits payment of ₹7,350 via UPI with transaction reference `UPI/123456789`.
  - **Then** the system generates receipt sequence `RCP-001042`, increments `invoices.paid_amount`, sets `balance_amount = 0.00`, and transitions invoice status to `PAID`.

---

## 10. Module 9 — CDSS & Clinical Safety Stories

### US-CDSS-01: Real-Time Drug-Drug Interaction Warning
- **Role:** Doctor | **Priority:** 🔴 P0
- **Story:** As a Doctor, I want immediate warnings if two drugs I selected interact, so that medication toxicity is prevented before prescribing.
- **Acceptance Criteria:**
  - **Given** a doctor is selecting medications in the consultation module.
  - **When** `POST /cdss/check-ddi` is triggered with generic drug names.
  - **Then** the system queries `cdss_ddi_rules` and returns severity (`CONTRAINDICATED`), mechanism, and management guidance within 10 milliseconds.

---

## 11. Module 10 & 11 — Auth & Admin Configuration Stories

### US-AUTH-01: Role-Based Access Enforcement
- **Role:** Hospital Staff | **Priority:** 🔴 P0
- **Story:** As an Administrator, I want staff accounts restricted strictly to their functional roles, so that receptionists cannot sign prescriptions and doctors cannot alter billing rates.
- **Acceptance Criteria:**
  - **Given** a staff user logged in with the `RECEPTIONIST` role.
  - **When** they attempt to POST to `/api/v1/prescriptions`.
  - **Then** the API rejects the request with HTTP `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`).

---

## 12. Module 12 — Waiting Room Display Stories

### US-DSP-01: Privacy-Compliant Waiting Room Smart TV Board
- **Role:** Waiting Patient / Public | **Priority:** 🔴 P0
- **Story:** As a Patient in the waiting room, I want to see my token number displayed on the smart TV when called, without my name or medical details being broadcast.
- **Acceptance Criteria:**
  - **Given** a public smart TV browser connected to `GET /api/v1/display/queue`.
  - **When** Doctor Roy calls Token #14.
  - **Then** the TV screen displays "Token 14 — Room 102 (Dr. Ananya Roy)" with zero patient names, phone numbers, or diagnoses present in the network payload.
