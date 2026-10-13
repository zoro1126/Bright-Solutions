# Bright Solutions — Frontend API Requirements & DB Schema Specification

**Document Version**: 2.0.0  
**Target Subsystems**: Frontend (`frontend/services/api.js`, Pages & Components) $\leftrightarrow$ Backend (`backend/app/`)  
**Database**: MySQL 8.0 (`test_clinicos_db`) — InnoDB, utf8mb4  
**Base URL**: `http://localhost:8000/api`  

---

## 1. Executive Summary

This document specifies the exact contract required by the React frontend (`frontend/services/api.js`), mapping every required API call to:
1. **HTTP Signature**: Method, Route, Headers, Query/Path Parameters.
2. **Request Body Schema**: Strict field definitions with data types and validation.
3. **Response Schema**: Expected JSON payloads and HTTP status codes.
4. **Underlying Database Tables & Column Mappings**: The exact relational schema powering each endpoint.
5. **Implementation Architecture**: Router $\to$ Service $\to$ Repository mapping following the clean backend design.

---

## 2. Global Database Architecture (13 Core Tables + 1 Extension)

The database schema is organized across clinical and administrative workflows:

```
+---------------------------------------------------------------------------------+
|                                 CORE RELATIONAL MAP                             |
|                                                                                 |
|   [users] <----+ (doctor_id)                                                    |
|     |          |                                                                |
|     +--------> [visits] <-------- [patients]                                   |
|                |   |   |                                                        |
|   +------------+   |   +-------------------+                                    |
|   |                |                       |                                    |
|   v                v                       v                                    |
| [vital_signs]  [intake_questionnaires]  [external_reports]                      |
|   |                                                                             |
|   v                                                                             |
| [deterministic_insights]                                                        |
|   |                                                                             |
|   v                                                                             |
| [prescriptions] ---> [prescription_items] <--- [drug_formulary]                  |
|   |                                                                             |
|   v                                                                             |
| [bills] -------------> [bill_items]                                             |
|   |                                                                             |
|   v                                                                             |
| [payments]                                                                      |
|                                                                                 |
| [audit_logs] (Admin Security & Governance Ledger)                                |
+---------------------------------------------------------------------------------+
```

### Table Catalog:
1. **`users`**: Clinic personnel accounts (Receptionist, Doctor, Cashier, Admin) with bcrypt password hashes.
2. **`patients`**: Master patient index with unique UHID (`UHID-YYYY-XXXXX`), demographics, ABHA ID, and insurance.
3. **`visits`**: Encounter lifecycle tracking (`REGISTERED` $\to$ `TRIAGED` $\to$ `IN_CONSULTATION` $\to$ `READY_FOR_BILLING` $\to$ `COMPLETED`).
4. **`vital_signs`**: Clinical triage measurements (BP, Pulse, Temp, SpO2, Resp, Weight, Height, BMI, BP Stage).
5. **`intake_questionnaires`**: Standardized MCQ responses (`q1` through `q20`) and voice dictation notes.
6. **`external_reports`**: Archived patient-provided diagnostics (DICOM, ECG, Lab PDFs, X-Ray) on disk.
7. **`deterministic_insights`**: Deterministic CDSS clinical safety alerts and physician override notes.
8. **`drug_formulary`**: Approved clinic medication master with brand, generic molecule, form, and strength.
9. **`prescriptions`**: Visit e-prescriptions authored by attending physicians.
10. **`prescription_items`**: Line items per prescription linked to `drug_formulary`.
11. **`bills`**: Itemized invoice records, gross amount, insurance copay deduction, and net payable.
12. **`bill_items`**: Itemized billing breakdown (Consultation, Diagnostic Tariffs, Pharmacy Medicines).
13. **`payments`**: Payment transaction logs (Cash, UPI QR, Card, Netbanking) with receipt serial numbers.
14. **`audit_logs`** *(Audit trail extension)*: Tamper-evident log of clinical overrides, status changes, and staff actions.

---

## 3. Complete Frontend API Specification & Implementation Plan

### Group 1: Authentication & Staff Sessions

#### 1.1 `POST /api/auth/login`
* **Frontend Caller**: `auth.login(username, password)` in `api.js`
* **Purpose**: Authenticates clinic staff and returns a role-scoped session token.
* **Request Body**:
```json
{
  "username": "dr_kulkarni",
  "password": "password123"
}
```
* **Response (`200 OK`)**:
```json
{
  "token": "clinicos_session_2_doctor",
  "user": {
    "id": 2,
    "username": "dr_kulkarni",
    "full_name": "Dr. Vikram Kulkarni, MD",
    "role": "DOCTOR",
    "email": "vikram@clinic.com",
    "phone": "+919876543211",
    "is_active": 1
  },
  "message": "Welcome back, Dr. Vikram Kulkarni, MD!"
}
```
* **Database Mapping**:
  * Read from `users` WHERE `LOWER(username) = LOWER(%s) AND is_active = 1`.
  * Validate with `bcrypt.checkpw()`.
  * `password_hash` is explicitly stripped before returning.

#### 1.2 `POST /api/auth/logout`
* **Frontend Caller**: `auth.logout()` in `api.js`
* **Purpose**: Invalidates the active client session token.
* **Headers**: `Authorization: Bearer <token>`
* **Response (`200 OK`)**:
```json
{
  "message": "Session terminated successfully."
}
```
* **Database Mapping**: Stateless token clearance in client localStorage; audit entry written to `audit_logs`.

#### 1.3 `GET /api/auth/me`
* **Frontend Caller**: Session verification on app mount / reload.
* **Headers**: `Authorization: Bearer <token>`
* **Response (`200 OK`)**:
```json
{
  "authenticated": true,
  "user": {
    "id": 2,
    "username": "dr_kulkarni",
    "full_name": "Dr. Vikram Kulkarni, MD",
    "role": "DOCTOR",
    "email": "vikram@clinic.com",
    "phone": "+919876543211",
    "is_active": 1
  }
}
```

---

### Group 2: OPD Dashboard & Token Previews

#### 2.1 `GET /api/dashboard/stats`
* **Frontend Caller**: `dashboard.stats()` in `api.js`
* **Purpose**: Feeds the real-time stats cards (Total Patients, Today's Visits, Active Doctors, BP/BMI Breakdown).
* **Response (`200 OK`)**:
```json
{
  "total_patients": 14,
  "today_visits": 3,
  "active_doctors": 4,
  "next_token": "Q-104",
  "bp_breakdown": [
    { "stage": "Stage 2 Hypertension", "count": 5 },
    { "stage": "Normal Blood Pressure", "count": 7 }
  ],
  "bmi_breakdown": [
    { "category": "Normal Weight", "count": 8 },
    { "category": "Overweight", "count": 4 }
  ],
  "recent_patients": [ ... ]
}
```
* **Database Mapping**:
  * `COUNT(*)` on `patients`.
  * `COUNT(*)` on `visits` WHERE `DATE(visit_date) = CURDATE()`.
  * `COUNT(*)` on `users` WHERE `role = 'DOCTOR' AND is_active = 1`.
  * Aggregation on `vital_signs.bp_stage` and `vital_signs.bmi_category`.

#### 2.2 `GET /api/tokens/next`
* **Frontend Caller**: `tokens.next()` in `api.js`
* **Purpose**: Generates live preview of the next OPD Queue Token (`#Q-xxx`).
* **Response (`200 OK`)**:
```json
{
  "next_token": "Q-104"
}
```
* **Database Mapping**: `101 + COUNT(*)` from `visits` WHERE `DATE(visit_date) = CURDATE()`.

---

### Group 3: Receptionist & Patient Triage Subsystem

#### 3.1 `GET /api/patients`
* **Frontend Caller**: `patients.list()` in `api.js`
* **Query Parameters**:
  * `search` (string, optional): Search by name, phone, or UHID.
  * `page` (int, default=1): 1-indexed page.
  * `page_size` (int, default=20): Items per page.
* **Response (`200 OK`)**:
```json
{
  "total_count": 14,
  "page": 1,
  "page_size": 20,
  "total_pages": 1,
  "count": 14,
  "patients": [
    {
      "patient_id": 1,
      "uhid": "UHID-2026-00001",
      "full_name": "Rohan Deshmukh",
      "dob": "1988-06-15",
      "age": 38,
      "gender": "MALE",
      "phone": "9876543201",
      "visit_id": 1,
      "queue_token": "Q-101",
      "visit_status": "TRIAGED",
      "doctor_name": "Dr. Vikram Kulkarni, MD",
      "systolic_bp": 145,
      "diastolic_bp": 95,
      "bp_stage": "Stage 2 Hypertension",
      "bmi": 24.2,
      "bmi_category": "Normal Weight"
    }
  ]
}
```
* **Database Mapping**:
  * Join `patients` $\to$ `visits` (latest visit per patient) $\to$ `users` (doctor) $\to$ `vital_signs`.

#### 3.2 `POST /api/patients`
* **Frontend Caller**: `patients.register(data)` in `api.js`
* **Purpose**: Registers patient demographics, computes BMI & BP Stage deterministically, assigns next queue token, and creates `TRIAGED` visit encounter.
* **Request Body**:
```json
{
  "first_name": "Rajesh",
  "last_name": "Kumar",
  "dob": "1985-04-12",
  "gender": "MALE",
  "blood_group": "O+",
  "phone": "9876543210",
  "email": "rajesh.k@example.com",
  "address": "Flat 302, Green Park, Jaipur",
  "emergency_contact": "9876543200",
  "insurance_type": "INSURANCE",
  "insurance_provider": "Star Health",
  "policy_number": "POL-987123",
  "doctor_id": 2,
  "chief_complaint": "Persistent headache and elevated blood pressure",
  "vitals": {
    "systolic_bp": 148,
    "diastolic_bp": 94,
    "pulse_rate": 82,
    "temperature_f": 98.6,
    "resp_rate": 18,
    "spo2_pct": 98,
    "weight_kg": 76.5,
    "height_cm": 174.0
  }
}
```
* **Response (`201 Created`)**:
```json
{
  "message": "Patient registered and triage vitals recorded successfully",
  "patient": {
    "id": 15,
    "uhid": "UHID-2026-00015",
    "full_name": "Rajesh Kumar",
    "phone": "9876543210",
    "gender": "MALE",
    "dob": "1985-04-12"
  },
  "visit": {
    "id": 15,
    "queue_token": "Q-104",
    "doctor_name": "Dr. Vikram Kulkarni, MD",
    "status": "TRIAGED",
    "visit_date": "2026-10-13T17:30:00.000000"
  },
  "vitals": {
    "id": 15,
    "bmi": 25.3,
    "bmi_category": "Overweight",
    "bp_stage": "Stage 2 Hypertension",
    "systolic_bp": 148,
    "diastolic_bp": 94,
    "pulse_rate": 82,
    "temperature_f": 98.6,
    "spo2_pct": 98
  }
}
```
* **Database Mapping**:
  * `INSERT INTO patients`
  * `INSERT INTO visits` (status: `TRIAGED`)
  * `INSERT INTO vital_signs` (computes `bmi = weight / (height/100)^2`, `bp_stage`)

#### 3.3 `GET /api/patients/{id}`
* **Frontend Caller**: `patients.get(id)` in `api.js`
* **Response (`200 OK`)**: Complete single patient profile with demographics, insurance, and medical record history.

#### 3.4 `GET /api/doctors`
* **Frontend Caller**: `patients.doctors()` in `api.js`
* **Response (`200 OK`)**: List of active on-duty physicians from `users WHERE role = 'DOCTOR' AND is_active = 1`.

#### 3.5 `GET /api/receptionist/queue`
* **Frontend Caller**: `queue.list()` in `api.js`
* **Response (`200 OK`)**: Real-time triage counter queue of today's waiting arrivals (`TRIAGED`, `QUESTIONNAIRE_PENDING`, `IN_CONSULTATION`).

---

### Group 4: Intake Questionnaires & Diagnostic Reports

#### 4.1 `POST /api/visits/{visit_id}/questionnaire`
* **Frontend Caller**: `questionnaire.submit(visitId, data)` in `api.js`
* **Purpose**: Records intake MCQ responses (`q1` through `q20`) and voice dictation notes. Upserts if existing record found.
* **Request Body**:
```json
{
  "patient_id": 15,
  "answers": {
    "q1": 1,
    "q2": 0,
    "q3": 2,
    "q4": 1
  },
  "voice_notes": "Patient reports severe morning headaches radiating to the neck."
}
```
* **Response (`200 OK`)**:
```json
{
  "message": "Intake questionnaire MCQ responses recorded successfully",
  "visit_id": 15,
  "questionnaire_id": 1,
  "recorded_answers": { "q1": 1, "q2": 0, "q3": 2, "q4": 1 },
  "updated_at": "2026-10-13T17:31:00.000000"
}
```
* **Database Mapping**: `INSERT INTO intake_questionnaires ... ON DUPLICATE KEY UPDATE`.

#### 4.2 `GET /api/visits/{visit_id}/questionnaire`
* **Frontend Caller**: `questionnaire.get(visitId)` in `api.js`
* **Response (`200 OK`)**: Full MCQ answer dictionary (`q1`..`q20`) and `voice_notes` for doctor consultation review.

#### 4.3 `POST /api/visits/{visit_id}/reports/upload`
* **Frontend Caller**: `reports.upload(visitId, formData)` in `api.js`
* **Content-Type**: `multipart/form-data`
* **Form Fields**:
  * `file`: Binary diagnostic file (DICOM, PDF, ECG, X-Ray)
  * `report_type`: `DICOM`, `ECG`, `LAB_PDF`, `XRAY`, or `OTHER`
  * `modality` (optional): Scan descriptor (e.g. `Brain MRI T2 FLAIR`)
  * `findings_summary` (optional): Impression notes
* **Response (`201 Created`)**:
```json
{
  "message": "External report uploaded successfully",
  "report_id": 3,
  "visit_id": 15,
  "patient_id": 15,
  "file_name": "brain_mri.dcm",
  "report_type": "DICOM",
  "modality": "Brain MRI T2 FLAIR",
  "file_size_bytes": 1048576,
  "file_size_mb": 1.0,
  "file_path": "/uploads/15/1791541347_brain_mri.dcm",
  "uploaded_at": "2026-10-13T17:32:00.000000"
}
```
* **Database Mapping**: Stores file under `uploads/{visit_id}/` on disk, inserts metadata into `external_reports`.

#### 4.4 `GET /api/visits/{visit_id}/reports`
* **Frontend Caller**: `reports.list(visitId)` in `api.js`
* **Response (`200 OK`)**: List of all uploaded external scans and lab sheets for the visit encounter.

---

### Group 5: Doctor Consultation, CDSS & Prescriptions

#### 5.1 `GET /api/doctor/queue`
* **Frontend Caller**: `doctorQueue.list()` in `api.js`
* **Query Parameters**: `doctor_id` (int, optional)
* **Response (`200 OK`)**: List of patients currently in `TRIAGED` or `IN_CONSULTATION` status, sorted by consultation priority and arrival token.

#### 5.2 `POST /api/doctor/queue/{visit_id}/call`
* **Frontend Caller**: `doctorQueue.call(queueId)` in `api.js`
* **Purpose**: Calls patient into consultation room; transitions status to `IN_CONSULTATION`.
* **Response (`200 OK`)**:
```json
{
  "message": "Patient called into consultation room",
  "visit_id": 15,
  "status": "IN_CONSULTATION",
  "consultation_started_at": "2026-10-13T17:33:00.000000"
}
```
* **Database Mapping**: `UPDATE visits SET status = 'IN_CONSULTATION' WHERE id = %s`.

#### 5.3 `GET /api/doctor/patients/{id}/dossier`
* **Frontend Caller**: `dossier.get(patientId)` in `api.js`
* **Purpose**: Aggregates comprehensive patient historical dossier: prior visits, vitals timeline, past prescriptions, external diagnostic scans, and clinical questionnaires.
* **Response (`200 OK`)**:
```json
{
  "patient": { "id": 15, "uhid": "UHID-2026-00015", "full_name": "Rajesh Kumar", "dob": "1985-04-12", "gender": "MALE" },
  "active_visit": { "id": 15, "queue_token": "Q-104", "status": "IN_CONSULTATION", "chief_complaint": "..." },
  "vitals": { "systolic_bp": 148, "diastolic_bp": 94, "pulse_rate": 82, "bmi": 25.3, "bp_stage": "Stage 2 Hypertension" },
  "questionnaire": { "answers": { "q1": 1 }, "voice_notes": "..." },
  "reports": [ ... ],
  "past_visits": [ ... ]
}
```
* **Database Mapping**: Composite query aggregating `patients`, `visits`, `vital_signs`, `intake_questionnaires`, and `external_reports`.

#### 5.4 `POST /api/doctor/visits/{visit_id}/insights` & `POST .../insights/evaluate`
* **Frontend Caller**: `cdss.evaluate(visitId, payload)` in `api.js`
* **Purpose**: Executes 100% deterministic clinical decision support rules (AHA Hypertension, Hypoxemia SpO2, Tachycardia, Pyrexia, Obesity Class) against active vitals and stores alert flags.
* **Response (`200 OK`)**:
```json
{
  "visit_id": 15,
  "insights_count": 1,
  "has_critical": false,
  "insights": [
    {
      "id": 10,
      "rule_code": "RULE_HTN_STAGE2",
      "severity_level": "WARNING",
      "category": "VITALS",
      "title": "Stage 2 Hypertension Flag",
      "description": "BP 148/94 mmHg meets Stage 2 Hypertension criteria.",
      "recommendation": "Initiate dual-agent pharmacotherapy and lifestyle counseling. Schedule 2-week follow-up.",
      "is_reviewed": 0,
      "is_signed": 0
    }
  ]
}
```
* **Database Mapping**: Upserts into `deterministic_insights`.

#### 5.5 `PATCH /api/doctor/insights/{insight_id}`
* **Purpose**: Allows physician to review an insight flag and provide clinical override justification notes.
* **Request Body**:
```json
{
  "is_reviewed": true,
  "doctor_override_notes": "Acknowledged Stage 2 HTN; initiating Telmisartan therapy."
}
```

#### 5.6 `GET /api/drugs/formulary` & `GET /api/doctor/formulary`
* **Frontend Caller**: `formulary.search(query)` in `api.js`
* **Query Parameters**:
  * `q` (string): Molecule or brand search string (e.g. `Telmi`).
  * `dosage_form` (optional): `TABLET`, `CAPSULE`, `SYRUP`, etc.
  * `limit` (default=50): Max results.
* **Response (`200 OK`)**:
```json
{
  "query": "Telmi",
  "count": 1,
  "drugs": [
    {
      "id": 12,
      "brand_name": "Telma 40",
      "generic_name": "Telmisartan",
      "dosage_form": "TABLET",
      "strength": "40mg",
      "standard_dosage": "1 tablet once daily"
    }
  ]
}
```
* **Database Mapping**: Indexed substring search on `drug_formulary WHERE is_active = 1`.

#### 5.7 `POST /api/doctor/visits/{visit_id}/prescriptions`
* **Frontend Caller**: `prescriptions.create(visitId, data)` in `api.js`
* **Status Code**: `201 Created`
* **Request Body**:
```json
{
  "doctor_id": 2,
  "general_instructions": "Take medication regularly after breakfast.",
  "status": "FINALIZED",
  "items": [
    {
      "drug_id": 12,
      "dosage": "1 tablet (40mg)",
      "frequency": "1-0-0",
      "duration_days": 30,
      "meal_timing": "AFTER_MEALS",
      "special_instructions": "Check BP weekly."
    }
  ]
}
```
* **Response (`201 Created`)**:
```json
{
  "message": "E-Prescription saved successfully",
  "prescription_id": 4,
  "visit_id": 15,
  "doctor_id": 2,
  "status": "FINALIZED",
  "items_count": 1,
  "items": [ ... ]
}
```
* **Database Mapping**: Upsert `prescriptions`, insert line items into `prescription_items`.

#### 5.8 `GET /api/doctor/visits/{visit_id}/prescriptions`
* **Frontend Caller**: `prescriptions.list(visitId)` in `api.js`
* **Response (`200 OK`)**: Prescription record with joined formulary drug details (`brand_name`, `strength`, `dosage_form`).

#### 5.9 `POST /api/doctor/visits/{visit_id}/sign-off`
* **Frontend Caller**: `signOff.submit(visitId, data)` in `api.js`
* **Purpose**: Finalizes doctor consultation, enforces clinical override notes if CRITICAL alerts exist, digitally signs all alerts, records conclusion notes, and moves encounter status to `READY_FOR_BILLING`.
* **Request Body**:
```json
{
  "doctor_id": 2,
  "diagnosis": "Essential Hypertension Stage 2",
  "conclusion_notes": "Patient started on antihypertensive therapy. Advised low salt diet and aerobic exercise.",
  "doctor_override_notes": "All safety flags reviewed."
}
```
* **Response (`200 OK`)**:
```json
{
  "message": "Consultation signed off and locked successfully",
  "visit_id": 15,
  "status": "READY_FOR_BILLING",
  "doctor_id": 2,
  "conclusion_notes": "Diagnosis: Essential Hypertension Stage 2\n\nClinical Notes: Patient started on antihypertensive therapy...",
  "signed_at": "2026-10-13T17:35:00.000000",
  "next_station": "CASHIER_BILLING_DESK",
  "critical_alerts_count": 0,
  "critical_alerts_overridden": 0
}
```
* **Database Mapping**:
  * Updates `visits` status to `READY_FOR_BILLING`
  * Sets `conclusion_notes`, `conclusion_signed_at`
  * Signs all rows in `deterministic_insights` (`is_signed = 1`)

---

### Group 6: Cashier Billing & Payments Subsystem

#### 6.1 `GET /api/cashier/queue`
* **Frontend Caller**: `cashier.queue()` in `api.js`
* **Response (`200 OK`)**: Encounters in `READY_FOR_BILLING` awaiting checkout settlement.

#### 6.2 `GET /api/bills/visit/{visit_id}` & `GET /api/cashier/bills/{visitId}`
* **Frontend Caller**: `cashier.bill(visitId)` in `api.js`
* **Purpose**: Auto-aggregates and retrieves itemized invoice:
  * Consultation Fee (₹500.00)
  * Diagnostic Archive Review Tariffs (₹150.00 per scan)
  * Prescribed Formulary Medications (₹60.00 per item)
  * Automatically calculates insurance coverage deduction (80% if private insurance; 100% if Ayushman Bharat PM-JAY scheme).
* **Response (`200 OK`)**:
```json
{
  "visit_id": 15,
  "bill_id": 5,
  "uhid": "UHID-2026-00015",
  "patient_name": "Rajesh Kumar",
  "currency": "INR",
  "line_items": [
    {
      "item_code": "CONS_GEN",
      "item_type": "CONSULTATION",
      "description": "General Physician Consultation",
      "quantity": 1,
      "unit_rate": 500.0,
      "total_amount": 500.0
    },
    {
      "item_code": "DIAG_ARCH",
      "item_type": "DIAGNOSTIC",
      "description": "External Scan Archival & Review (Brain MRI T2 FLAIR)",
      "quantity": 1,
      "unit_rate": 150.0,
      "total_amount": 150.0
    },
    {
      "item_code": "PHARM_01",
      "item_type": "MEDICATION",
      "description": "Telma 40 40mg (TABLET)",
      "quantity": 1,
      "unit_rate": 60.0,
      "total_amount": 60.0
    }
  ],
  "subtotal": 710.0,
  "tax_gst": 0.0,
  "discount": 0.0,
  "insurance_copay_deduction": 568.0,
  "net_payable": 142.0,
  "patient_payable": 142.0,
  "bill_status": "PENDING"
}
```
* **Database Mapping**: Reads/creates record in `bills` and itemizes in `bill_items`.

#### 6.3 `POST /api/bills/{bill_id}/payments`
* **Frontend Caller**: `cashier.pay(billId, data)` in `api.js`
* **Purpose**: Records multi-tender payment settlement (`CASH`, `UPI`, `CARD`, `NETBANKING`), generates receipt serial, and completes encounter.
* **Status Code**: `201 Created`
* **Request Body**:
```json
{
  "payment_mode": "UPI",
  "amount_paid": 142.0,
  "transaction_reference": "UPI-REF-99881122"
}
```
* **Response (`201 Created`)**:
```json
{
  "message": "Payment recorded and encounter closed successfully",
  "payment_id": 5,
  "receipt_number": "REC-2026-00005",
  "bill_id": 5,
  "visit_id": 15,
  "paid_amount": 142.0,
  "payment_mode": "UPI",
  "payment_timestamp": "2026-10-13T17:36:00.000000",
  "visit_status": "COMPLETED",
  "receipt_pdf_url": "/api/bills/5/receipt"
}
```
* **Database Mapping**:
  * `INSERT INTO payments`
  * `UPDATE bills SET payment_status = 'PAID'`
  * `UPDATE visits SET status = 'COMPLETED'`

---

### Group 7: Admin Governance & Staff Management

#### 7.1 `GET /api/admin/dashboard` & `GET /api/admin/analytics`
* **Frontend Caller**: `admin.dashboard()` in `api.js`
* **Response (`200 OK`)**: Hospital executive metrics, revenue by payment mode, doctor workload, and recent activity feed.

#### 7.2 `GET /api/admin/staff`
* **Frontend Caller**: `admin.staff()` in `api.js`
* **Response (`200 OK`)**: Complete staff directory from `users` (excluding `password_hash`).

#### 7.3 `POST /api/admin/staff` & `POST /api/admin/users`
* **Frontend Caller**: `admin.createStaff(data)` in `api.js`
* **Status Code**: `201 Created`
* **Request Body**:
```json
{
  "username": "dr_varun",
  "password": "SecurePassword@123",
  "full_name": "Dr. Varun Joshi, MD (Cardiology)",
  "role": "DOCTOR",
  "email": "varun@brightsolutions.in",
  "phone": "+919876543299"
}
```
* **Response (`201 Created`)**: Staff account record with 12-round bcrypt hashed credential.

#### 7.4 `PUT /api/admin/staff/{id}/status`
* **Frontend Caller**: `admin.toggleStatus(id, active)` in `api.js`
* **Request Body**: `{ "active": false }`
* **Response (`200 OK`)**: Updates staff account `is_active` flag.

#### 7.5 `GET /api/admin/audit-logs`
* **Frontend Caller**: `admin.auditLogs(filters)` in `api.js`
* **Query Parameters**: `category`, `severity`, `limit`
* **Response (`200 OK`)**: Immutable governance audit log feed.

---

## 4. Database Schema DDL Reference

Below is the complete MySQL 8.0 DDL specification supporting all frontend APIs:

```sql
-- 1. Users & Staff Credentials
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('RECEPTIONIST', 'DOCTOR', 'CASHIER', 'ADMIN') NOT NULL,
    email VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Master Patient Index
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uhid VARCHAR(30) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    dob DATE NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NULL,
    address TEXT NULL,
    emergency_contact VARCHAR(100) NULL,
    insurance_type VARCHAR(50) DEFAULT 'CASH',
    insurance_provider VARCHAR(100) NULL,
    policy_number VARCHAR(100) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_patients_phone (phone),
    INDEX idx_patients_name (last_name, first_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Encounters & Visits
CREATE TABLE IF NOT EXISTS visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    receptionist_id INT NOT NULL,
    visit_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    queue_token VARCHAR(20) NOT NULL,
    status ENUM('REGISTERED', 'TRIAGED', 'IN_CONSULTATION', 'READY_FOR_BILLING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'TRIAGED',
    chief_complaint TEXT NULL,
    conclusion_notes TEXT NULL,
    conclusion_signed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_visits_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_visits_doctor FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_visits_receptionist FOREIGN KEY (receptionist_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_visits_patient (patient_id),
    INDEX idx_visits_doctor (doctor_id),
    INDEX idx_visits_status (status),
    INDEX idx_visits_date (visit_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Clinical Triage Vital Signs
CREATE TABLE IF NOT EXISTS vital_signs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL UNIQUE,
    systolic_bp INT NULL,
    diastolic_bp INT NULL,
    pulse_rate INT NULL,
    temperature_f DECIMAL(4,1) NULL,
    resp_rate INT NULL,
    spo2_pct INT NULL,
    weight_kg DECIMAL(5,2) NULL,
    height_cm DECIMAL(5,2) NULL,
    bmi DECIMAL(4,1) NULL,
    bmi_category VARCHAR(50) NULL,
    bp_stage VARCHAR(50) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vitals_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Standardized Clinical Intake Questionnaires (q1..q20)
CREATE TABLE IF NOT EXISTS intake_questionnaires (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL UNIQUE,
    patient_id INT NOT NULL,
    q1 INT NULL, q2 INT NULL, q3 INT NULL, q4 INT NULL, q5 INT NULL,
    q6 INT NULL, q7 INT NULL, q8 INT NULL, q9 INT NULL, q10 INT NULL,
    q11 INT NULL, q12 INT NULL, q13 INT NULL, q14 INT NULL, q15 INT NULL,
    q16 INT NULL, q17 INT NULL, q18 INT NULL, q19 INT NULL, q20 INT NULL,
    voice_notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_intake_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_intake_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. External Diagnostic Reports
CREATE TABLE IF NOT EXISTS external_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL,
    patient_id INT NOT NULL,
    report_type ENUM('DICOM', 'ECG', 'LAB_PDF', 'XRAY', 'OTHER') NOT NULL,
    modality VARCHAR(100) NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_mb DECIMAL(6,2) NULL,
    findings_summary TEXT NULL,
    upload_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reports_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reports_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_reports_visit (visit_id),
    INDEX idx_reports_patient (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Deterministic Clinical Safety Insights (CDSS)
CREATE TABLE IF NOT EXISTS deterministic_insights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL,
    rule_code VARCHAR(50) NOT NULL,
    severity_level ENUM('INFO', 'WARNING', 'CRITICAL') NOT NULL,
    category ENUM('VITALS', 'DRUG_SAFETY', 'CONTRAINDICATION', 'GUIDELINE') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    recommendation TEXT NULL,
    is_reviewed TINYINT(1) NOT NULL DEFAULT 0,
    is_signed TINYINT(1) NOT NULL DEFAULT 0,
    doctor_override_notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_insights_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_insights_visit (visit_id),
    INDEX idx_insights_severity (severity_level),
    INDEX idx_insights_rule (rule_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Clinic Drug Formulary Master
CREATE TABLE IF NOT EXISTS drug_formulary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_name VARCHAR(100) NOT NULL,
    generic_name VARCHAR(100) NOT NULL,
    dosage_form ENUM('TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'OINTMENT', 'INHALER', 'DROPS') NOT NULL,
    strength VARCHAR(50) NOT NULL,
    standard_dosage VARCHAR(100) NULL,
    contraindications TEXT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_drugs_brand (brand_name),
    INDEX idx_drugs_generic (generic_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Electronic Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL UNIQUE,
    doctor_id INT NOT NULL,
    issue_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    general_instructions TEXT NULL,
    status ENUM('DRAFT', 'FINALIZED', 'DISPENSED', 'CANCELLED') NOT NULL DEFAULT 'FINALIZED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rx_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rx_doctor FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_rx_doctor (doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Prescription Items
CREATE TABLE IF NOT EXISTS prescription_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prescription_id INT NOT NULL,
    drug_id INT NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    duration_days INT NOT NULL,
    meal_timing VARCHAR(50) NULL,
    special_instructions VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rx_items_rx FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rx_items_drug FOREIGN KEY (drug_id) REFERENCES drug_formulary(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_rx_items_rx (prescription_id),
    INDEX idx_rx_items_drug (drug_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Bills & Invoices
CREATE TABLE IF NOT EXISTS bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL UNIQUE,
    cashier_id INT NULL,
    gross_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    insurance_covered DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    net_amount DECIMAL(10,2) NOT NULL,
    payment_status ENUM('PENDING', 'PARTIAL', 'PAID', 'WAIVED') NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bills_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_bills_cashier FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_bills_status (payment_status),
    INDEX idx_bills_cashier (cashier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Bill Line Items
CREATE TABLE IF NOT EXISTS bill_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    service_code VARCHAR(50) NOT NULL,
    item_type ENUM('CONSULTATION', 'DIAGNOSTIC', 'MEDICATION', 'PROCEDURE') NOT NULL,
    description VARCHAR(255) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bill_items_bill FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_bill_items_bill (bill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Payments & Receipts
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    payment_mode ENUM('CASH', 'UPI', 'CARD', 'NETBANKING', 'INSURANCE_DIRECT') NOT NULL,
    transaction_ref VARCHAR(100) NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_status ENUM('SUCCESS', 'PENDING', 'FAILED') NOT NULL DEFAULT 'SUCCESS',
    payment_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_bill FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_payments_bill (bill_id),
    INDEX idx_payments_ref (transaction_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Audit Trail Ledger (Governance & Security)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    user_name VARCHAR(100) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    category ENUM('CDSS_OVERRIDE', 'BILLING_ADJUSTMENT', 'TRIAGE_EDIT', 'USER_AUTH', 'PRESCRIPTION_LOCK') NOT NULL,
    severity ENUM('INFO', 'LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'INFO',
    patient_mrn VARCHAR(50) NULL,
    details TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_category (category),
    INDEX idx_audit_severity (severity),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 5. Frontend Alignment Roadmap & Action Checklist

To make the live frontend point seamlessly to this backend:

| Step | Action Item | Target File(s) | Status |
| :---: | :--- | :--- | :---: |
| **1** | Update `BASE = '/api'` in `api.js` to ensure route prefixes match backend endpoints | `frontend/services/api.js` | Ready |
| **2** | Wire `LoginPage.jsx` to call `auth.login()` and persist JWT token to `localStorage` | `frontend/pages/LoginPage.jsx` | Ready |
| **3** | Replace mock state in `ReceptionistPage.jsx` with `patients.list()` and `patients.register()` | `frontend/pages/ReceptionistPage.jsx` | Ready |
| **4** | Replace mock data in `DoctorPage.jsx` with `doctorQueue.list()`, `dossier.get()`, and `cdss.evaluate()` | `frontend/pages/DoctorPage.jsx` | Ready |
| **5** | Connect `CashierPage.jsx` to `cashier.queue()`, `cashier.bill()`, and `cashier.pay()` | `frontend/pages/CashierPage.jsx` | Ready |
| **6** | Connect `AdminPage.jsx` to `admin.dashboard()`, `admin.staff()`, and `admin.auditLogs()` | `frontend/pages/AdminPage.jsx` | Ready |
