# Bright Solutions — REST API Specification & System Contract

**Product**: Bright Solutions (General OPD Clinic Operating System & Decision Support)  
**Backend Framework**: Python 3.11+ (FastAPI, Pydantic v2, PyMySQL)  
**Database**: MySQL 8.0 / MariaDB (`test_clinicos_db`)  
**Base URL**: `http://localhost:8000/api`  
**Authentication**: Bearer Token / Role-Based Session (`Authorization: Bearer <token>`)  
**Specification Standard**: OpenAPI 3.1 compliant contract  
**Document Format**: Markdown (Tables, ASCII hierarchies & JSON Schemas — Zero Mermaid Diagrams)

---

## 1. Architectural Overview & Security Model

The Bright Solutions API is a modular, high-throughput REST service powering all front-desk operations, clinical decision support, e-prescribing, and financial reconciliation in an Outpatient Department (OPD).

```
[ Client Applications: Receptionist / Doctor / Cashier / Admin Web Apps ]
                           |
                           v  (HTTPS / JSON REST API)
    +-----------------------------------------------------------+
    |                    FastAPI Application                    |
    |  - CORS Middleware                                        |
    |  - Role-Based Access Control (RBAC) Dependency Injection   |
    |  - Pydantic v2 Strict Input / Output Schema Validation     |
    +-----------------------------------------------------------+
         |            |             |              |
         v            v             v              v
    [ Auth Router ] [ Intake ] [ Doctor CDSS ] [ Cashier Billing ]
         |            |             |              |
         +------------+-------------+--------------+
                           |
                           v (PyMySQL Connection Pool)
             [ MySQL 8.0 Relational Database Engine ]
```

### Role-Based Access Control (RBAC) Matrix

Every API route is guarded by role-based authorization:

| Role Name | Scope Description | Permitted Route Prefixes |
| :--- | :--- | :--- |
| `RECEPTIONIST` | Patient demographics, vitals triage, MCQ intake questionnaire, token allocation | `/api/reception/*`, `/api/patients/*`, `/api/tokens/*`, `/api/visits/*` |
| `DOCTOR` | Clinical consultation, history review, DICOM/ECG viewer, CDSS rules, e-Rx | `/api/doctor/*`, `/api/encounters/*`, `/api/insights/*`, `/api/prescriptions/*` |
| `CASHIER` | Itemized invoice calculation, insurance copay verification, payment tender | `/api/cashier/*`, `/api/bills/*`, `/api/payments/*` |
| `ADMIN` | Hospital executive analytics, staff provisioning, immutable audit trail | `/api/admin/*`, `/api/staff/*`, `/api/audit/*` |

---

## 2. Global Error Handling Standard

All error responses return an RFC 7807 compliant JSON payload:

```json
{
  "status_code": 400,
  "error_code": "INVALID_TRIAGE_VALUE",
  "detail": "Systolic blood pressure (320 mmHg) exceeds physiological maximum limit.",
  "timestamp": "2026-10-08T10:15:30.124Z",
  "path": "/api/patients"
}
```

Common HTTP status codes used across all endpoints:
- `200 OK`: Successful retrieval or synchronous update.
- `201 Created`: Entity successfully created (Patient, Visit, Bill, Prescription).
- `400 Bad Request`: Validation failure or clinical range violation.
- `401 Unauthorized`: Missing, expired, or invalid session token.
- `403 Forbidden`: Authenticated user lacks required role permissions.
- `404 Not Found`: Target entity ID not found.
- `409 Conflict`: Duplicate unique key (e.g., duplicate Phone or UHID collision).
- `422 Unprocessable Entity`: Pydantic payload format mismatch.
- `500 Internal Server Error`: Unhandled database exception.

---

## 3. Authentication & Staff Session Endpoints

### 3.1 Authenticate Staff User (Login)
- **Method & Route**: `POST /api/auth/login`
- **Access Level**: Public
- **Description**: Authenticates clinic staff by username and password. Issues a scoped session token and returns the staff member's profile.

#### Request Body
```json
{
  "username": "receptionist_anita",
  "password": "password123"
}
```

#### Response Body (`200 OK`)
```json
{
  "token": "bright_session_1_receptionist",
  "user": {
    "id": 1,
    "username": "receptionist_anita",
    "full_name": "Anita Sharma",
    "role": "RECEPTIONIST",
    "email": "anita@brightsolutions.com",
    "phone": "+919876543210",
    "is_active": 1
  },
  "message": "Welcome back, Anita Sharma!"
}
```

---

### 3.2 List Active Staff Personas (1-Click Switcher)
- **Method & Route**: `GET /api/auth/users`
- **Access Level**: Public / Authenticated
- **Description**: Returns active clinic staff members grouped by role for rapid testing and role switching in development and demo environments.

#### Response Body (`200 OK`)
```json
{
  "users": [
    { "id": 1, "username": "receptionist_anita", "full_name": "Anita Sharma", "role": "RECEPTIONIST", "email": "anita@brightsolutions.com" },
    { "id": 2, "username": "dr_kulkarni", "full_name": "Dr. Vikram Kulkarni, MD", "role": "DOCTOR", "email": "vikram@brightsolutions.com" },
    { "id": 3, "username": "dr_ananya", "full_name": "Dr. Ananya Roy, MBBS, DNB", "role": "DOCTOR", "email": "ananya@brightsolutions.com" },
    { "id": 4, "username": "dr_priya", "full_name": "Dr. Priya Nair, MD", "role": "DOCTOR", "email": "priya@brightsolutions.com" },
    { "id": 5, "username": "cashier_rahul", "full_name": "Rahul Verma", "role": "CASHIER", "email": "rahul@brightsolutions.com" },
    { "id": 6, "username": "admin", "full_name": "Dr. Suresh Deshmukh", "role": "ADMIN", "email": "admin@brightsolutions.com" }
  ]
}
```

---

## 4. Receptionist Domain Endpoints

### 4.1 Get Next Queue Token Preview
- **Method & Route**: `GET /api/tokens/next`
- **Access Level**: `RECEPTIONIST`, `ADMIN`
- **Description**: Previews the next sequential token for the current OPD day (e.g., `#Q-104`).

#### Response Body (`200 OK`)
```json
{
  "next_token": "Q-104",
  "date": "2026-10-08",
  "today_count": 3
}
```

---

### 4.2 Register Patient & Capture Initial Triage Encounter (FEAT-01)
- **Method & Route**: `POST /api/patients`
- **Access Level**: `RECEPTIONIST`
- **Description**: Atomically registers a new patient, issues a sequential UHID (`UHID-YYYY-XXXXX`), allocates the next OPD Queue Token (`Q-XXX`), computes real-time BMI and AHA Blood Pressure stages, and inserts the encounter into `visits` with status `TRIAGED`.

#### Request Body
```json
{
  "first_name": "Ramesh",
  "last_name": "Patel",
  "dob": "1976-08-22",
  "gender": "MALE",
  "blood_group": "B+",
  "phone": "9876543210",
  "email": "ramesh.patel@example.com",
  "address": "104 Sunrise Residency, Indiranagar, Bengaluru",
  "emergency_contact": "Sunita Patel (Spouse) - 9876543219",
  "doctor_id": 2,
  "chief_complaint": "Persistent morning headache and borderline high BP monitoring",
  "insurance_type": "CASH",
  "insurance_provider": null,
  "policy_number": null,
  "vitals": {
    "systolic_bp": 138,
    "diastolic_bp": 88,
    "pulse_rate": 76,
    "temperature_f": 98.4,
    "resp_rate": 16,
    "spo2_pct": 98,
    "weight_kg": 74.5,
    "height_cm": 171.0
  }
}
```

#### Response Body (`201 Created`)
```json
{
  "message": "Patient registered and triage vitals recorded successfully",
  "patient": {
    "id": 2,
    "uhid": "UHID-2026-00002",
    "full_name": "Ramesh Patel",
    "phone": "9876543210",
    "gender": "MALE",
    "dob": "1976-08-22"
  },
  "visit": {
    "id": 2,
    "queue_token": "Q-102",
    "doctor_name": "Dr. Vikram Kulkarni, MD",
    "status": "TRIAGED",
    "visit_date": "2026-10-08T10:30:00Z"
  },
  "vitals": {
    "id": 2,
    "bmi": 25.5,
    "bmi_category": "Overweight",
    "bp_stage": "Stage 1 Hypertension",
    "systolic_bp": 138,
    "diastolic_bp": 88,
    "pulse_rate": 76,
    "temperature_f": 98.4,
    "spo2_pct": 98
  }
}
```

---

### 4.3 Search Registered Patients & Vitals History
- **Method & Route**: `GET /api/patients`
- **Access Level**: `RECEPTIONIST`, `DOCTOR`, `CASHIER`, `ADMIN`
- **Query Parameters**:
  - `search` (string, optional): Search by Name, Mobile Phone, or UHID.
  - `limit` (integer, optional, default: 50, max: 200).

#### Response Body (`200 OK`)
```json
{
  "count": 1,
  "patients": [
    {
      "patient_id": 2,
      "uhid": "UHID-2026-00002",
      "first_name": "Ramesh",
      "last_name": "Patel",
      "full_name": "Ramesh Patel",
      "dob": "1976-08-22",
      "age": 50,
      "gender": "MALE",
      "blood_group": "B+",
      "phone": "9876543210",
      "email": "ramesh.patel@example.com",
      "address": "104 Sunrise Residency, Bengaluru",
      "emergency_contact": "Sunita Patel (Spouse) - 9876543219",
      "insurance_type": "CASH",
      "visit_id": 2,
      "queue_token": "Q-102",
      "visit_status": "TRIAGED",
      "visit_date": "2026-10-08T10:30:00",
      "chief_complaint": "Persistent morning headache and borderline high BP monitoring",
      "doctor_name": "Dr. Vikram Kulkarni, MD",
      "doctor_id": 2,
      "systolic_bp": 138,
      "diastolic_bp": 88,
      "pulse_rate": 76,
      "temperature_f": 98.4,
      "spo2_pct": 98,
      "bmi": 25.5,
      "bmi_category": "Overweight",
      "bp_stage": "Stage 1 Hypertension"
    }
  ]
}
```

---

### 4.4 Save Clinical Intake Questionnaire Responses (FEAT-02)
- **Method & Route**: `POST /api/visits/{visit_id}/questionnaire`
- **Access Level**: `RECEPTIONIST`
- **Description**: Records standardized clinical screening questionnaire responses. Since the questionnaire is not yet designed, the database stores responses as columns `q1, q2, q3...` where each value is an integer (`0, 1, 2, 3...`) corresponding to the chosen MCQ option (e.g. `0` for Option A / None, `1` for Option B / Mild, `2` for Option C / Moderate, `3` for Option D / Severe). Optional voice speech-to-text dictation notes can be passed alongside.

#### Request Body
```json
{
  "patient_id": 2,
  "answers": {
    "q1": 0,
    "q2": 1,
    "q3": 0,
    "q4": 2,
    "q5": 1,
    "q6": 0,
    "q7": 3,
    "q8": 0,
    "q9": 1,
    "q10": 0,
    "q11": 0,
    "q12": 2
  },
  "voice_notes": "Patient dictated mild symptom onset 4 days ago; no prior drug allergies reported."
}
```

#### Response Body (`200 OK`)
```json
{
  "message": "Intake questionnaire MCQ responses recorded successfully",
  "visit_id": 2,
  "questionnaire_id": 1,
  "recorded_answers": {
    "q1": 0,
    "q2": 1,
    "q3": 0,
    "q4": 2,
    "q5": 1,
    "q6": 0,
    "q7": 3,
    "q8": 0,
    "q9": 1,
    "q10": 0,
    "q11": 0,
    "q12": 2
  },
  "updated_at": "2026-10-08T10:34:10Z"
}
```

---

### 4.5 Fetch Patient Intake Questionnaire Responses
- **Method & Route**: `GET /api/visits/{visit_id}/questionnaire`
- **Access Level**: `RECEPTIONIST`, `DOCTOR`
- **Description**: Returns the saved MCQ questionnaire answers (`q1, q2, q3...` as numbers `0, 1, 2, 3...`) and voice notes for clinical review during physician consultation.

#### Response Body (`200 OK`)
```json
{
  "visit_id": 2,
  "patient_id": 2,
  "questionnaire_id": 1,
  "answers": {
    "q1": 0,
    "q2": 1,
    "q3": 0,
    "q4": 2,
    "q5": 1,
    "q6": 0,
    "q7": 3,
    "q8": 0,
    "q9": 1,
    "q10": 0,
    "q11": 0,
    "q12": 2
  },
  "voice_notes": "Patient dictated mild symptom onset 4 days ago; no prior drug allergies reported.",
  "recorded_at": "2026-10-08T10:34:10Z"
}
```

---

### 4.6 Upload External Diagnostic Reports (DICOM, ECG, PDF) (FEAT-03)
- **Method & Route**: `POST /api/visits/{visit_id}/reports/upload`
- **Access Level**: `RECEPTIONIST`
- **Content-Type**: `multipart/form-data`
- **Description**: Ingests patient-provided external diagnostic reports (DICOM `.dcm`, 12-lead ECG traces, Lab report PDFs).

#### Form Data Parameters
- `file`: Binary file upload
- `report_type`: `DICOM` | `ECG` | `LAB_PDF` | `OTHER`
- `report_title`: Descriptive title (e.g., "Brain MRI T2 Axial", "12-Lead Resting ECG")
- `report_date`: Date scan was taken (`YYYY-MM-DD`)

#### Response Body (`201 Created`)
```json
{
  "message": "External report uploaded successfully",
  "report_id": 1,
  "visit_id": 2,
  "file_name": "brain_mri_t2.dcm",
  "report_type": "DICOM",
  "file_size_bytes": 1458920,
  "uploaded_at": "2026-10-08T10:36:00Z"
}
```

---

### 4.7 Receptionist Live Operations Queue
- **Method & Route**: `GET /api/reception/queue`
- **Access Level**: `RECEPTIONIST`
- **Description**: Retrieves real-time token roster partitioned by status (*Waiting Triage*, *Triaged*, *In Consultation*, *Completed*).

#### Response Body (`200 OK`)
```json
{
  "total_active": 3,
  "waiting_triage": 0,
  "triaged_waiting_doctor": 2,
  "in_consultation": 1,
  "queue_items": [
    {
      "visit_id": 2,
      "token": "Q-102",
      "uhid": "UHID-2026-00002",
      "patient_name": "Ramesh Patel",
      "doctor_name": "Dr. Vikram Kulkarni, MD",
      "status": "TRIAGED",
      "wait_time_minutes": 14,
      "has_critical_vitals": false
    }
  ]
}
```

---

## 5. Doctor Clinical Consultation Endpoints

### 5.1 Doctor Active Consultation Queue
- **Method & Route**: `GET /api/doctor/queue`
- **Access Level**: `DOCTOR`
- **Description**: Returns patients assigned to the authenticated doctor waiting in OPD queue, prioritized by triage risk level.

#### Response Body (`200 OK`)
```json
{
  "doctor_id": 2,
  "doctor_name": "Dr. Vikram Kulkarni, MD",
  "waiting_count": 2,
  "queue": [
    {
      "visit_id": 2,
      "queue_token": "Q-102",
      "patient_id": 2,
      "uhid": "UHID-2026-00002",
      "full_name": "Ramesh Patel",
      "age": 50,
      "gender": "MALE",
      "chief_complaint": "Persistent morning headache",
      "triage_summary": {
        "bp": "138/88",
        "bp_stage": "Stage 1 Hypertension",
        "pulse": 76,
        "spo2": 98,
        "bmi": 25.5
      },
      "status": "TRIAGED",
      "wait_duration": "14 mins"
    }
  ]
}
```

---

### 5.2 Call Patient into Consultation Room
- **Method & Route**: `POST /api/doctor/queue/{visit_id}/call`
- **Access Level**: `DOCTOR`
- **Description**: Transitions visit status from `TRIAGED` to `IN_CONSULTATION`, recording the start timestamp.

#### Response Body (`200 OK`)
```json
{
  "message": "Patient called into consultation room",
  "visit_id": 2,
  "status": "IN_CONSULTATION",
  "consultation_started_at": "2026-10-08T10:44:00Z"
}
```

---

### 5.3 Fetch Longitudinal Patient Dossier (FEAT-05)
- **Method & Route**: `GET /api/doctor/patients/{patient_id}/dossier`
- **Access Level**: `DOCTOR`
- **Description**: Aggregates complete medical history: past encounter notes, chronic illness profile, and historical vitals trajectories.

#### Response Body (`200 OK`)
```json
{
  "patient": {
    "uhid": "UHID-2026-00002",
    "full_name": "Ramesh Patel",
    "dob": "1976-08-22",
    "age": 50,
    "gender": "MALE",
    "blood_group": "B+",
    "known_allergies": ["Penicillin (Rash)"],
    "chronic_conditions": ["Essential Hypertension"]
  },
  "past_encounters": [
    {
      "visit_date": "2026-08-12",
      "doctor_name": "Dr. Vikram Kulkarni",
      "diagnosis": "Essential Hypertension follow-up",
      "vitals_at_visit": { "bp": "142/90", "pulse": 80 },
      "conclusion_notes": "Advised lifestyle modifications and salt reduction.",
      "prescribed_medications": ["Amlodipine 5mg OD"]
    }
  ]
}
```

---

### 5.4 Evaluate Deterministic Clinical Safety Rules (CDSS) (FEAT-07)
- **Method & Route**: `POST /api/doctor/visits/{visit_id}/insights/evaluate`
- **Access Level**: `DOCTOR`
- **Description**: Evaluates rule sets against patient vitals, diagnosis, and candidate prescription. Identifies contraindications, dosage warnings, and triage flags.

#### Request Body
```json
{
  "candidate_drugs": ["Amlodipine 5mg", "Penicillin V 500mg"],
  "primary_diagnosis": "Stage 1 Hypertension with Acute Pharyngitis"
}
```

#### Response Body (`200 OK`)
```json
{
  "alerts_count": 1,
  "safety_passed": false,
  "rule_flags": [
    {
      "severity": "CRITICAL",
      "rule_id": "ALLERGY_CONTRAINDICATION",
      "title": "Severe Drug Allergy Warning",
      "detail": "Patient has documented Penicillin allergy. Prescription of Penicillin V 500mg poses severe anaphylaxis risk.",
      "suggested_alternative": "Azithromycin 500mg OD for 3 days or Clarithromycin 250mg BD",
      "allow_override": true
    }
  ],
  "vitals_insights": [
    {
      "severity": "INFO",
      "rule_id": "STAGE1_HTN",
      "title": "BP Stage 1 Hypertension Confirmed",
      "detail": "Systolic 138 / Diastolic 88 mmHg. Consider continuing calcium channel blocker therapy."
    }
  ]
}
```

---

### 5.5 Submit E-Prescription & Clinical Sign-Off (FEAT-08)
- **Method & Route**: `POST /api/doctor/visits/{visit_id}/sign-off`
- **Access Level**: `DOCTOR`
- **Description**: Submits the final differential diagnosis, e-prescription line items, clinical notes, and digital sign-off. Locks the encounter and transitions status to `READY_FOR_BILLING`.

#### Request Body
```json
{
  "diagnosis": "Stage 1 Essential Hypertension (Controlled) & Viral Pharyngitis",
  "clinical_notes": "Patient advised salt restriction (<2g/day) and hydration. Follow-up in 14 days if headache persists.",
  "override_reasons": null,
  "prescriptions": [
    {
      "drug_name": "Amlodipine Besylate",
      "strength": "5 mg",
      "dosage_form": "TABLET",
      "frequency": "OD (Once Daily Morning)",
      "duration_days": 30,
      "instructions": "Take after breakfast with water"
    },
    {
      "drug_name": "Paracetamol",
      "strength": "650 mg",
      "dosage_form": "TABLET",
      "frequency": "TDS (Thrice Daily as needed)",
      "duration_days": 3,
      "instructions": "Take for headache relief after food"
    }
  ]
}
```

#### Response Body (`200 OK`)
```json
{
  "message": "Consultation signed off and locked successfully",
  "visit_id": 2,
  "status": "READY_FOR_BILLING",
  "prescription_id": 1,
  "signed_at": "2026-10-08T10:55:00Z",
  "next_station": "CASHIER_BILLING_DESK"
}
```

---

## 6. Cashier Billing & Finance Endpoints

### 6.1 Cashier Active Billing Queue
- **Method & Route**: `GET /api/cashier/queue`
- **Access Level**: `CASHIER`
- **Description**: Lists all patient encounters in `READY_FOR_BILLING` status awaiting payment clearance.

#### Response Body (`200 OK`)
```json
{
  "pending_invoices_count": 1,
  "billing_queue": [
    {
      "visit_id": 2,
      "queue_token": "Q-102",
      "uhid": "UHID-2026-00002",
      "patient_name": "Ramesh Patel",
      "doctor_name": "Dr. Vikram Kulkarni, MD",
      "insurance_category": "CASH",
      "ready_since": "2026-10-08T10:55:00Z"
    }
  ]
}
```

---

### 6.2 Get Itemized Bill Breakdown (FEAT-09)
- **Method & Route**: `GET /api/bills/visit/{visit_id}`
- **Access Level**: `CASHIER`
- **Description**: Aggregates line items: consultation fees, diagnostic report archival tariffs, and pharmacy line items into an itemized invoice.

#### Response Body (`200 OK`)
```json
{
  "visit_id": 2,
  "uhid": "UHID-2026-00002",
  "patient_name": "Ramesh Patel",
  "bill_id": 1,
  "currency": "INR",
  "line_items": [
    { "item_code": "CONS_GEN", "description": "General Physician Consultation (Dr. Vikram Kulkarni)", "quantity": 1, "unit_rate": 500.00, "total_amount": 500.00 },
    { "item_code": "DIAG_ARCH", "description": "External Scan Archival & Clinical Review (DICOM)", "quantity": 1, "unit_rate": 150.00, "total_amount": 150.00 },
    { "item_code": "PHARM_01", "description": "Amlodipine 5mg (Strip of 30 Tablets)", "quantity": 1, "unit_rate": 65.00, "total_amount": 65.00 },
    { "item_code": "PHARM_02", "description": "Paracetamol 650mg (Strip of 10 Tablets)", "quantity": 1, "unit_rate": 30.00, "total_amount": 30.00 }
  ],
  "subtotal": 745.00,
  "tax_gst": 0.00,
  "discount": 0.00,
  "net_payable": 745.00,
  "insurance_copay_deduction": 0.00,
  "patient_payable": 745.00,
  "bill_status": "PENDING"
}
```

---

### 6.3 Process Multi-Mode Payment Tender (FEAT-11 & FEAT-12)
- **Method & Route**: `POST /api/bills/{bill_id}/payments`
- **Access Level**: `CASHIER`
- **Description**: Records tender payment (Cash, UPI QR, Card), updates bill status to `PAID`, transitions visit encounter to `COMPLETED`, and issues receipt serial.

#### Request Body
```json
{
  "payment_mode": "UPI",
  "tendered_amount": 745.00,
  "transaction_reference": "UPI/20261008/9876543210/OKAXIS",
  "notes": "Paid via Google Pay QR scanner at Desk 1"
}
```

#### Response Body (`201 Created`)
```json
{
  "message": "Payment recorded and encounter closed successfully",
  "receipt_number": "REC-2026-00002",
  "bill_id": 1,
  "visit_id": 2,
  "paid_amount": 745.00,
  "payment_mode": "UPI",
  "payment_timestamp": "2026-10-08T11:02:15Z",
  "visit_status": "COMPLETED",
  "receipt_pdf_url": "/api/bills/1/receipt"
}
```

---

## 7. Hospital Executive & Admin Endpoints

### 7.1 Real-Time Clinical OPD Executive Analytics
- **Method & Route**: `GET /api/dashboard/stats`
- **Access Level**: `RECEPTIONIST`, `DOCTOR`, `CASHIER`, `ADMIN`
- **Description**: Returns consolidated OPD metrics: registration counts, next token preview, AHA BP stage distribution, BMI category breakdown, and recent triage feed.

#### Response Body (`200 OK`)
```json
{
  "total_patients": 2,
  "today_visits": 2,
  "active_doctors": 3,
  "next_token": "Q-103",
  "bp_breakdown": [
    { "stage": "Stage 1 Hypertension", "count": 1 },
    { "stage": "Stage 2 Hypertension", "count": 1 }
  ],
  "bmi_breakdown": [
    { "category": "Overweight", "count": 2 }
  ],
  "recent_patients": [
    {
      "patient_id": 2,
      "uhid": "UHID-2026-00002",
      "full_name": "Ramesh Patel",
      "gender": "MALE",
      "age": 50,
      "phone": "9876543210",
      "queue_token": "Q-102",
      "visit_status": "COMPLETED",
      "visit_date": "2026-10-08T10:30:00",
      "doctor_name": "Dr. Vikram Kulkarni, MD",
      "systolic_bp": 138,
      "diastolic_bp": 88,
      "bp_stage": "Stage 1 Hypertension",
      "bmi": 25.5,
      "bmi_category": "Overweight",
      "pulse_rate": 76,
      "temperature_f": 98.4,
      "spo2_pct": 98
    }
  ]
}
```

---

### 7.2 Admin Hospital Governance Analytics
- **Method & Route**: `GET /api/admin/dashboard`
- **Access Level**: `ADMIN`
- **Description**: Executive analytics including daily revenue totals, doctor workload comparisons, peak hour footfall curves, and diagnostic distribution.

#### Response Body (`200 OK`)
```json
{
  "summary": {
    "today_footfall": 2,
    "gross_revenue": 1490.00,
    "completed_consultations": 2,
    "avg_throughput_minutes": 32.5
  },
  "doctor_workload": [
    { "doctor_id": 2, "doctor_name": "Dr. Vikram Kulkarni", "patients_seen": 2, "avg_consult_minutes": 11.2 },
    { "doctor_id": 3, "doctor_name": "Dr. Ananya Roy", "patients_seen": 0, "avg_consult_minutes": 0 },
    { "doctor_id": 4, "doctor_name": "Dr. Priya Nair", "patients_seen": 0, "avg_consult_minutes": 0 }
  ],
  "revenue_by_mode": {
    "CASH": 745.00,
    "UPI": 745.00,
    "CARD": 0.00
  }
}
```

---

## 8. API Verification & Testing Checklist

| Domain | Endpoint | Method | Expected Code | Verification Status |
| :--- | :--- | :---: | :---: | :--- |
| **System** | `/api/health` | `GET` | `200 OK` | Verified Live |
| **Auth** | `/api/auth/login` | `POST` | `200 OK` | Verified Live |
| **Auth** | `/api/auth/users` | `GET` | `200 OK` | Verified Live |
| **Dashboard** | `/api/dashboard/stats` | `GET` | `200 OK` | Verified Live |
| **Staff** | `/api/doctors` | `GET` | `200 OK` | Verified Live |
| **Queue** | `/api/tokens/next` | `GET` | `200 OK` | Verified Live |
| **Intake** | `/api/patients` | `GET` | `200 OK` | Verified Live |
| **Intake** | `/api/patients` | `POST` | `201 Created`| Verified Live |
| **Intake MCQ** | `/api/visits/{id}/questionnaire` | `POST` | `200 OK` | Spec Ready |
| **Intake MCQ** | `/api/visits/{id}/questionnaire` | `GET` | `200 OK` | Spec Ready |
| **Reports** | `/api/visits/{id}/reports/upload` | `POST` | `201 Created`| Spec Ready |
| **Doctor CDSS**| `/api/doctor/visits/{id}/insights` | `POST` | `200 OK` | Spec Ready |
| **Doctor Sign**| `/api/doctor/visits/{id}/sign-off`| `POST` | `200 OK` | Spec Ready |
| **Billing** | `/api/bills/visit/{id}` | `GET` | `200 OK` | Spec Ready |
| **Payment** | `/api/bills/{id}/payments` | `POST` | `201 Created`| Spec Ready |
