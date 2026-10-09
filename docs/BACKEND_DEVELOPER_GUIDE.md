# Bright Solutions — Backend Developer Guide & API Reference

**Document Version**: 2.0.0  
**Target Audience**: Backend Engineers, Frontend Integrators, Full-Stack Developers  
**Architecture**: Router-Service-Repository Pattern (FastAPI + PyMySQL)  
**Database**: MySQL 8.0 (`test_clinicos_db`)  
**Base URL**: `http://localhost:8000/api`  
**Swagger UI**: `http://localhost:8000/docs`  
**ReDoc**: `http://localhost:8000/redoc`  

---

## 1. Quick Start & Execution

### 1.1 Prerequisites
- Python 3.11+ (or Python 3.12/3.14 virtual environment)
- MySQL 8.0 running locally on port 3306

### 1.2 Environment Setup (`.env`)
The backend configuration is loaded from `backend/.env`:
```ini
DB_HOST=localhost
DB_PORT=3306
DB_USER=prem
DB_PASSWORD=password123
DB_NAME=test_clinicos_db
PORT=8000
SECRET_KEY=clinicos_super_secret_jwt_key_2026
```

### 1.3 Running the Development Server
From the `backend/` directory:
```bash
cd backend
./venv/bin/uvicorn main:app --reload --port 8000
```
On startup:
1. Tables and default demo staff/formulary seeds are automatically verified and created idempotently.
2. The `/uploads` static file directory is mounted for diagnostic documents (DICOM, ECGs, Lab PDFs).
3. The server starts listening at `http://localhost:8000`.

---

## 2. Architecture: The Router-Service-Repository Pattern

The backend is organized into three distinct layers to ensure separation of concerns, testability, and zero code duplication.

```
                          [ Client Request ]
                                  |
                                  v
+-------------------------------------------------------------------+
| 1. ROUTER LAYER (app/api/v1/)                                     |
|    - Handles HTTP methods, routes, status codes, query/path args  |
|    - Validates schemas with Pydantic                              |
|    - Injects authentication dependencies (get_current_user)       |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
| 2. SERVICE LAYER (app/services/)                                  |
|    - Executes pure business & clinical logic                      |
|    - Deterministic CDSS clinical safety rules engine              |
|    - BMI & AHA BP stage classifications                           |
|    - Tariff auto-aggregation & invoice calculations               |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
| 3. REPOSITORY LAYER (app/repositories/)                           |
|    - Direct database queries (PyMySQL)                            |
|    - 100% parameterized SQL queries (%s) preventing injection     |
|    - Connection lifecycle management (try ... finally conn.close) |
+-------------------------------------------------------------------+
                                  |
                                  v
                     [ MySQL Database Engine ]
```

### 2.1 Router Layer (`app/api/v1/`)
- **Purpose**: Translates HTTP requests into method calls and maps service returns into HTTP responses.
- **Rules**:
  - Routers **NEVER** write raw SQL queries.
  - Routers **NEVER** perform complex calculations (e.g. BMI, tariffs, CDSS alerts).
  - Routers extract parameters, invoke the corresponding Service method, and return the result with appropriate HTTP status codes (e.g., `201 Created`, `200 OK`, `400 Bad Request`, `404 Not Found`).

### 2.2 Service Layer (`app/services/`)
- **Purpose**: Encapsulates business logic, domain rules, and workflow orchestration.
- **Rules**:
  - Services are framework-agnostic where possible.
  - Services handle clinical computations (e.g., `compute_bmi_and_category`, `compute_bp_stage`, AHA 2017 hypertension crisis evaluation).
  - Services orchestrate multi-step transactions (e.g., in `BillingService`, aggregating consultation fee + external report archival tariffs + prescribed medicines into an itemized bill).
  - Services sanitize outputs (e.g., stripping `password_hash` from user objects).

### 2.3 Repository Layer (`app/repositories/`)
- **Purpose**: Encapsulates all data access and persistence logic.
- **Rules**:
  - Every SQL query uses `%s` placeholders to guarantee SQL injection defense.
  - Every database connection is cleanly acquired and closed in a `try...finally` block to prevent connection leaks.
  - Repositories return pure Python primitives (dicts, lists, ints) using PyMySQL's `DictCursor`.

### 2.4 Core & Schemas (`app/core/`, `app/schemas/`)
- **`app/core/config.py`**: Central settings class using `pydantic-settings` / `python-dotenv`.
- **`app/core/database.py`**: Connection factory `get_connection()` and table initialization `init_db()`.
- **`app/core/security.py`**: 12-round bcrypt hashing, password validation, session token extraction (`get_current_user`), and Role-Based Access Control (`require_role`).
- **`app/schemas/`**: Pydantic models validating inbound payloads and outbound contracts.

---

## 3. Concrete Request Lifecycle Walkthrough

To understand how the layers collaborate, consider registering a patient via `POST /api/patients`:

```
1. Client POSTs JSON payload:
   { "first_name": "Rohan", "dob": "1990-01-01", "doctor_id": 2, "vitals": { "weight_kg": 70, "height_cm": 175, ... } }
                              |
                              v
2. Router: app/api/v1/patients.py -> register_patient_and_triage()
   - Validates JSON body against PatientRegistrationRequest Pydantic model.
   - Forwards request to PatientService.register_patient(req).
                              |
                              v
3. Service: app/services/patient_service.py -> register_patient()
   - Verifies attending doctor exists via UserRepository.get_by_id(req.doctor_id).
   - Generates sequential UHID: UHID-2026-XXXXX using PatientRepository.get_patient_count_for_year().
   - Calculates next queue token: Q-10X using PatientRepository.get_today_token_count().
   - Computes BMI = 22.9 ("Normal Weight") and BP Stage = "Stage 1 Hypertension".
   - Persists patient, visit encounter, and triage vitals via PatientRepository.
                              |
                              v
4. Repository: app/repositories/patient_repo.py
   - Executes INSERT INTO patients (...) VALUES (%s, %s, ...)
   - Executes INSERT INTO visits (...) VALUES (%s, %s, ...)
   - Executes INSERT INTO vital_signs (...) VALUES (%s, %s, ...)
                              |
                              v
5. Router returns HTTP 201 Created with structured JSON response:
   { "message": "...", "patient": { ... }, "visit": { ... }, "vitals": { ... } }
```

---

## 4. Authentication, Security & RBAC Guide

### 4.1 Demo Personas & Credentials
The database comes pre-seeded with 8 standard personas for testing:

| Username | Role | Full Name | Default Password |
| :--- | :--- | :--- | :--- |
| `receptionist_anita` | `RECEPTIONIST` | Anita Sharma | `password123` |
| `dr_kulkarni` | `DOCTOR` | Dr. Vikram Kulkarni, MD | `password123` |
| `dr_ananya` | `DOCTOR` | Dr. Ananya Sen, MBBS, DNB | `password123` |
| `dr_priya` | `DOCTOR` | Dr. Priya Nair, MD | `password123` |
| `dr_siddharth` | `DOCTOR` | Dr. Siddharth Rao, MS | `password123` |
| `cashier_rahul` | `CASHIER` | Rahul Verma | `password123` |
| `admin` | `ADMIN` | Dr. Arvind Mehta (Chief Medical Officer) | `password123` |
| `admin_super` | `ADMIN` | Super Administrator | `password123` |

### 4.2 Session Token Standard
When logging in via `POST /api/auth/login`:
- A session token is issued: `clinicos_session_{user_id}_{role_lowercase}`
  - Example: `clinicos_session_2_doctor`
- Clients pass this token in the `Authorization` header:
  ```http
  Authorization: Bearer clinicos_session_2_doctor
  ```

### 4.3 Security & Zero Credential Leak Guarantee
1. **Password Hashing**: Passwords for new staff accounts are hashed using bcrypt with **12 salt rounds**.
2. **Zero Leakage**: Responses from `/api/auth/login`, `/api/auth/users`, `/api/auth/me`, and `/api/admin/users` explicitly strip `password_hash`.
3. **Session Inspection**: Call `GET /api/auth/me` with the bearer token to verify the authenticated user context.

---

## 5. Complete API Reference (All 27 Endpoints + Session)

### 5.1 System Health

#### `GET /api/health`
- **Description**: Verifies service liveness and live MySQL connection.
- **Request Body**: None
- **Response** (`200 OK`):
```json
{
  "status": "healthy",
  "service": "Bright Solutions Backend API",
  "feature": "FEAT-01 Patient Registration & Triage Vitals",
  "database": "connected",
  "timestamp": "2026-10-09T15:52:54.427968"
}
```

---

### 5.2 Authentication & Personas

#### `POST /api/auth/login`
- **Description**: Authenticates staff and returns a session token.
- **Request Body**:
```json
{
  "username": "dr_kulkarni",
  "password": "password123"
}
```
- **Response** (`200 OK`):
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

#### `GET /api/auth/users`
- **Description**: Lists active staff accounts for testing and quick persona switching.
- **Request Body**: None
- **Response** (`200 OK`):
```json
{
  "users": [
    {
      "id": 1,
      "username": "receptionist_anita",
      "full_name": "Anita Sharma",
      "role": "RECEPTIONIST",
      "email": "anita@clinic.com"
    }
  ]
}
```

#### `GET /api/auth/me`
- **Description**: Returns profile information of the currently authenticated bearer token.
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`):
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

### 5.3 Clinical OPD Dashboard

#### `GET /api/dashboard/stats`
- **Description**: Real-time KPI counters, blood pressure stage breakdown, BMI distribution, and recent triage feed.
- **Request Body**: None
- **Response** (`200 OK`):
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

---

### 5.4 Patients, Staff & Queue Tokens

#### `GET /api/doctors`
- **Description**: Returns active doctors available for consultation queue assignment.
- **Response** (`200 OK`):
```json
{
  "count": 4,
  "doctors": [
    {
      "id": 3,
      "username": "dr_ananya",
      "full_name": "Dr. Ananya Sen, MBBS, DNB",
      "role": "DOCTOR",
      "email": "ananya@clinic.com",
      "phone": "+919876543212"
    }
  ]
}
```

#### `GET /api/tokens/next`
- **Description**: Generates preview for the next sequential OPD Queue Token (`#Q-xxx`).
- **Response** (`200 OK`):
```json
{
  "next_token": "Q-104"
}
```

#### `GET /api/patients`
- **Description**: Paginated directory of registered patients with triage vitals.
- **Query Parameters**:
  - `search` (string, optional): Search by name, phone, or UHID.
  - `page` (int, default=1): Page number (1-indexed).
  - `page_size` (int, default=20): Items per page (max 100).
- **Response** (`200 OK`):
```json
{
  "total_count": 14,
  "page": 1,
  "page_size": 20,
  "total_pages": 1,
  "count": 14,
  "patients": [ ... ]
}
```

#### `POST /api/patients`
- **Description**: Onboards a new patient, calculates real-time BMI and BP stages, allocates queue token, and creates visit encounter.
- **Status Code**: `201 Created`
- **Request Body**:
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
- **Response** (`201 Created`):
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
    "visit_date": "2026-10-09T16:00:00.000000"
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

---

### 5.5 Visits, Intake Questionnaires & Diagnostic Reports

#### `POST /api/visits/{visit_id}/questionnaire`
- **Description**: Upserts standardized intake MCQ answers (q1..q20) and optional voice notes.
- **Path Parameters**: `visit_id` (int)
- **Status Code**: `200 OK`
- **Request Body**:
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
- **Response** (`200 OK`):
```json
{
  "message": "Intake questionnaire MCQ responses recorded successfully",
  "visit_id": 15,
  "questionnaire_id": 1,
  "recorded_answers": { "q1": 1, "q2": 0, "q3": 2, "q4": 1 },
  "updated_at": "2026-10-09T16:01:00.000000"
}
```

#### `GET /api/visits/{visit_id}/questionnaire`
- **Description**: Retrieves recorded MCQ answers and voice notes for clinical review.
- **Response** (`200 OK`):
```json
{
  "visit_id": 15,
  "patient_id": 15,
  "questionnaire_id": 1,
  "answers": { "q1": 1, "q2": 0, "q3": 2, "q4": 1 },
  "voice_notes": "Patient reports severe morning headaches radiating to the neck.",
  "recorded_at": "2026-10-09T16:01:00.000000"
}
```

#### `POST /api/visits/{visit_id}/reports/upload`
- **Description**: Archives patient-provided diagnostic reports (DICOM, ECG, LAB_PDF, XRAY) to disk.
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: Binary file upload
  - `report_type`: `DICOM`, `ECG`, `LAB_PDF`, `XRAY`, or `OTHER`
  - `modality` (optional): Scan description (e.g. `Brain MRI T2 FLAIR`)
  - `findings_summary` (optional): Impression notes
- **Status Code**: `201 Created`
- **Response** (`201 Created`):
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
  "uploaded_at": "2026-10-09T16:02:00.000000"
}
```

#### `GET /api/visits/{visit_id}/reports`
- **Description**: Lists all diagnostic files uploaded for an encounter.
- **Response** (`200 OK`):
```json
{
  "visit_id": 15,
  "patient_id": 15,
  "count": 1,
  "reports": [
    {
      "id": 3,
      "report_type": "DICOM",
      "modality": "Brain MRI T2 FLAIR",
      "file_path": "/uploads/15/1791541347_brain_mri.dcm",
      "file_size_mb": 1.0,
      "findings_summary": "Normal ventricles; no acute infarct."
    }
  ]
}
```

---

### 5.6 Doctor Consultation & Clinical CDSS

#### `GET /api/doctor/queue`
- **Description**: Returns patients in the OPD consultation queue (`TRIAGED` or `IN_CONSULTATION`).
- **Query Parameters**: `doctor_id` (int, optional)
- **Response** (`200 OK`):
```json
{
  "doctor_id": 2,
  "doctor_name": "Dr. Vikram Kulkarni, MD",
  "waiting_count": 1,
  "queue": [
    {
      "visit_id": 15,
      "queue_token": "Q-104",
      "uhid": "UHID-2026-00015",
      "full_name": "Rajesh Kumar",
      "age": 41,
      "gender": "MALE",
      "chief_complaint": "Persistent headache and elevated blood pressure",
      "status": "TRIAGED",
      "triage_summary": {
        "bp": "148/94",
        "bp_stage": "Stage 2 Hypertension",
        "pulse": 82,
        "spo2": 98,
        "temperature_f": 98.6,
        "bmi": 25.3
      }
    }
  ]
}
```

#### `POST /api/doctor/queue/{visit_id}/call`
- **Description**: Moves patient from `TRIAGED` into `IN_CONSULTATION` status.
- **Response** (`200 OK`):
```json
{
  "message": "Patient called into consultation room",
  "visit_id": 15,
  "status": "IN_CONSULTATION",
  "consultation_started_at": "2026-10-09T16:03:00.000000"
}
```

#### `POST /api/doctor/visits/{visit_id}/insights`
- **Description**: Triggers 100% deterministic CDSS safety rules against triage vitals and updates insight flags.
- **Response** (`200 OK`):
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
      "title": "Stage 2 Hypertension Flag",
      "description": "BP 148/94 mmHg meets Stage 2 Hypertension criteria.",
      "recommendation": "Initiate dual-agent pharmacotherapy and lifestyle counseling. Schedule 2-week follow-up.",
      "is_reviewed": 0,
      "is_signed": 0
    }
  ]
}
```

#### `GET /api/doctor/visits/{visit_id}/insights`
- **Description**: Retrieves evaluated clinical safety alerts (evaluates automatically if not yet evaluated).
- **Response** (`200 OK`): Matches `POST /api/doctor/visits/{visit_id}/insights`.

#### `PATCH /api/doctor/insights/{insight_id}`
- **Description**: Allows physician to acknowledge a safety flag or record clinical override justification.
- **Request Body**:
```json
{
  "is_reviewed": true,
  "doctor_override_notes": "Reviewed BP Stage 2 flag. Initiated Telmisartan 40mg."
}
```
- **Response** (`200 OK`):
```json
{
  "message": "Clinical insight review status updated",
  "insight_id": 10,
  "is_reviewed": true,
  "doctor_override_notes": "Reviewed BP Stage 2 flag. Initiated Telmisartan 40mg."
}
```

#### `POST /api/doctor/visits/{visit_id}/sign-off`
- **Description**: Finalizes consultation, signs off CDSS alerts, and transitions encounter to `READY_FOR_BILLING`.
- **Validation**:
  - `conclusion_notes` must have >= 3 characters.
  - If any `CRITICAL` CDSS alert is unreviewed, `doctor_override_notes` is strictly required.
- **Request Body**:
```json
{
  "doctor_id": 2,
  "diagnosis": "Essential Hypertension Stage 2",
  "conclusion_notes": "Patient started on antihypertensive therapy. Advised low salt diet and aerobic exercise.",
  "doctor_override_notes": "All safety flags reviewed."
}
```
- **Response** (`200 OK`):
```json
{
  "message": "Consultation signed off and locked successfully",
  "visit_id": 15,
  "status": "READY_FOR_BILLING",
  "doctor_id": 2,
  "conclusion_notes": "Diagnosis: Essential Hypertension Stage 2\n\nClinical Notes: Patient started on antihypertensive therapy...",
  "signed_at": "2026-10-09T16:05:00.000000",
  "next_station": "CASHIER_BILLING_DESK",
  "critical_alerts_count": 0,
  "critical_alerts_overridden": 0
}
```

---

### 5.7 Formulary & E-Prescriptions

#### `GET /api/drugs/formulary`
- **Description**: Fast substring autocomplete search across the approved drug formulary catalog.
- **Query Parameters**:
  - `q` (string, optional): Molecule or brand name search term (e.g. `Telmi`).
  - `dosage_form` (string, optional): `TABLET`, `CAPSULE`, `SYRUP`, etc.
  - `limit` (int, default=50): Max results.
- **Response** (`200 OK`):
```json
{
  "query": "Telmi",
  "dosage_form": null,
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

#### `POST /api/doctor/visits/{visit_id}/prescriptions`
- **Description**: Authors or updates an electronic prescription with dosage, frequency, and instructions.
- **Status Code**: `201 Created`
- **Request Body**:
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
- **Response** (`201 Created`):
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

#### `GET /api/doctor/visits/{visit_id}/prescriptions`
- **Description**: Fetches prescription line items joined with drug formulary details.
- **Response** (`200 OK`):
```json
{
  "visit_id": 15,
  "prescription": {
    "id": 4,
    "doctor_name": "Dr. Vikram Kulkarni, MD",
    "general_instructions": "Take medication regularly after breakfast.",
    "status": "FINALIZED"
  },
  "items_count": 1,
  "items": [ ... ]
}
```

---

### 5.8 Cashier Billing & Payments

#### `GET /api/cashier/queue`
- **Description**: Lists encounters currently in `READY_FOR_BILLING` awaiting checkout.
- **Response** (`200 OK`):
```json
{
  "pending_invoices_count": 1,
  "billing_queue": [
    {
      "visit_id": 15,
      "queue_token": "Q-104",
      "uhid": "UHID-2026-00015",
      "patient_name": "Rajesh Kumar",
      "doctor_name": "Dr. Vikram Kulkarni, MD",
      "insurance_category": "INSURANCE",
      "ready_since": "2026-10-09T16:05:00.000000"
    }
  ]
}
```

#### `GET /api/bills/visit/{visit_id}`
- **Description**: Auto-aggregates and retrieves the itemized bill for an encounter:
  - Consultation Fee (₹500.00)
  - Diagnostic Archival Review Tariffs (₹150.00 per scan)
  - Prescribed Formulary Medications (₹60.00 per item)
  - Applies 80% coverage deduction if `insurance_type == 'INSURANCE'`.
- **Response** (`200 OK`):
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

#### `POST /api/bills/{bill_id}/payments`
- **Description**: Records multi-tender payment settlement (`CASH`, `UPI`, `CARD`, `NETBANKING`), generates receipt serial, and transitions visit encounter to `COMPLETED`.
- **Status Code**: `201 Created`
- **Request Body**:
```json
{
  "payment_mode": "UPI",
  "amount_paid": 142.0,
  "transaction_reference": "UPI-REF-99881122"
}
```
- **Response** (`201 Created`):
```json
{
  "message": "Payment recorded and encounter closed successfully",
  "payment_id": 5,
  "receipt_number": "REC-2026-00005",
  "bill_id": 5,
  "visit_id": 15,
  "paid_amount": 142.0,
  "payment_mode": "UPI",
  "payment_timestamp": "2026-10-09T16:07:00.000000",
  "visit_status": "COMPLETED",
  "receipt_pdf_url": "/api/bills/5/receipt"
}
```

---

### 5.9 Admin Governance & Staff Provisioning

#### `GET /api/admin/analytics`
- **Description**: Hospital executive KPI counters, revenue collection by tender mode, doctor consultation workloads, and recent activity audit trail.
- **Response** (`200 OK`):
```json
{
  "summary": {
    "total_patients": 15,
    "today_footfall": 4,
    "completed_consultations": 3,
    "ready_for_billing": 0,
    "in_consultation": 0,
    "gross_revenue": 142.0,
    "avg_throughput_minutes": 25.0
  },
  "revenue_by_mode": {
    "CASH": 0.0,
    "UPI": 142.0,
    "CARD": 0.0,
    "NETBANKING": 0.0,
    "INSURANCE_DIRECT": 0.0
  },
  "doctor_workload": [
    {
      "doctor_id": 2,
      "doctor_name": "Dr. Vikram Kulkarni, MD",
      "email": "vikram@clinic.com",
      "patients_seen": 2
    }
  ],
  "recent_activity": [ ... ]
}
```

#### `GET /api/admin/dashboard`
- **Description**: Alias for `GET /api/admin/analytics`.
- **Response** (`200 OK`): Matches `GET /api/admin/analytics`.

#### `POST /api/admin/users`
- **Description**: Provisions a new hospital staff account with bcrypt password hashing and role assignment (`RECEPTIONIST`, `DOCTOR`, `CASHIER`, `ADMIN`).
- **Status Code**: `201 Created`
- **Request Body**:
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
- **Response** (`201 Created`):
```json
{
  "message": "Hospital staff user account provisioned successfully",
  "user_id": 9,
  "username": "dr_varun",
  "full_name": "Dr. Varun Joshi, MD (Cardiology)",
  "role": "DOCTOR",
  "email": "varun@brightsolutions.in",
  "phone": "+919876543299",
  "is_active": true
}
```
*(Notice `password_hash` is strictly never returned in response)*.

---

## 6. How to Add a New Feature (Developer Workflow)

When extending this backend, follow the Router-Service-Repository discipline:

1. **Step 1: Define Schemas (`app/schemas/`)**:
   - Create request and response Pydantic models in `app/schemas/my_feature.py`.
2. **Step 2: Add Repository Methods (`app/repositories/`)**:
   - Write pure SQL functions with `%s` parameters in `app/repositories/my_feature_repo.py`.
   - Always wrap execution in `try ... finally conn.close()`.
3. **Step 3: Implement Business Logic (`app/services/`)**:
   - Write business rules, validations, or mathematical calculations in `app/services/my_feature_service.py`.
4. **Step 4: Expose Router (`app/api/v1/`)**:
   - Create router endpoints in `app/api/v1/my_feature.py`.
   - Mount router inside `app/api/v1/api.py`.
5. **Step 5: Verify & Test**:
   - Run `python -m py_compile` across all files.
   - Run end-to-end tests to guarantee zero route regressions.
