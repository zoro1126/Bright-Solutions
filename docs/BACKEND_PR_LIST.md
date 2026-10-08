# Bright Solutions — Backend Incremental PR Roadmap & To-Do List

**Target Subsystem**: `backend/` (FastAPI, PyMySQL, MySQL 8.0)  
**Strict Git Isolation Rule**: **Backend developers MUST ONLY create/edit files inside `backend/` and `docs/BACKEND_PR_LIST.md`. NEVER touch `frontend/` or `frontend_legacy/`.**  
This isolation guarantees that branch rebases (`git rebase origin/main`) remain completely free of merge conflicts with frontend development.

---

## 1. Developer Git Discipline & Workflow Protocol

1. **Branch Naming Standard**: `feat/be-<feature-name>` (e.g. `feat/be-intake-questionnaire`)
2. **Rebase Protocol**:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
3. **Commit Message Standard**: Conventional Commits format (`feat(backend): ...`, `fix(backend): ...`, `chore(backend): ...`).
4. **One PR = One Atomic Unit**: Do not bundle multiple PR increments together. Keep PR reviews under 200 lines of logic.
5. **Pre-push Verification**: Always verify that FastAPI starts cleanly and MySQL queries execute without syntax errors:
   ```bash
   cd backend
   python -c "from database import init_db; init_db()"
   uvicorn main:app --port 8000
   ```

## 2. Routing Standard & Server Load Optimization Contract

1. **Mandatory `/api/` Route Prefix**:
   - Every single backend route exposed by FastAPI **MUST start with the `/api/` prefix** (e.g. `/api/auth/login`, `/api/patients`, `/api/visits/{id}/questionnaire`, `/api/doctor/queue`, `/api/cashier/queue`).
   - Root paths without `/api/` (such as `/receptionist/...`, `/doctor/...`) belong exclusively to the frontend client SPA and must never be intercepted by FastAPI.

2. **Server Load Lightening & On-Demand DB Queries**:
   - **Zero Monolithic Eager Joins**: Do not fetch heavy joins (all historical visits, full CDSS rule logs, uploaded files) during routine queue roster calls.
   - **Granular Sub-Resource Endpoints**:
     - `GET /api/visits/{id}/questionnaire`: Only queries DB when the client actively requests the questionnaire modal/card.
     - `GET /api/visits/{id}/reports`: Only queries metadata and disk files when the diagnostic scan viewer is opened.
     - `POST /api/doctor/visits/{id}/insights`: Only executes the clinical decision engine when the physician explicitly opens the consultation studio.
   - **Lean Query Payloads**: Roster endpoints (`/api/doctor/queue`, `/api/reception/queue`) must select only top-level card fields (`visit_id`, `token`, `name`, `bp_stage`, `status`), keeping DB execution under 10ms.

---

## 3. Backend PR Implementation Queue

```
[PR-BE-01] Table 5: intake_questionnaires Schema & DDL
   ↓
[PR-BE-02] FEAT-02: MCQ Questionnaire REST Endpoints (POST & GET)
   ↓
[PR-BE-03] Table 6 & FEAT-03: External Diagnostic Reports Table & Upload API
   ↓
[PR-BE-04] Table 7 & FEAT-07: CDSS Decision Engine & deterministic_insights Table
   ↓
[PR-BE-05] Doctor Encounter Sign-off & Status Transition API
   ↓
[PR-BE-06] Tables 8, 9, 10: Formulary & Prescription Schema with Seeds
   ↓
[PR-BE-07] FEAT-08: Formulary Autocomplete & E-Prescription Creation Endpoints
   ↓
[PR-BE-08] Tables 11, 12, 13: Billing, Bill Items & Payments Schema
   ↓
[PR-BE-09] FEAT-09 & 10: Cashier Queue, Bill Aggregation & Payment Tender API
   ↓
[PR-BE-10] Admin Analytics & Hospital Staff Provisioning Endpoints
```

---

## 4. Atomic PR Specifications

### [PR-BE-01] Table 5: intake_questionnaires Schema & DDL
- **Scope**: `backend/database.py`
- **Objective**: Create `intake_questionnaires` table in `init_db()` to store MCQ option numbers.
- **Key Columns**:
  - `id INT AUTO_INCREMENT PRIMARY KEY`
  - `visit_id INT NOT NULL UNIQUE FK(visits.id)`
  - `patient_id INT NOT NULL FK(patients.id)`
  - `q1 INT NULL`, `q2 INT NULL`, ... `q20 INT NULL` (generic 0-indexed MCQ option integers `0, 1, 2, 3...`)
  - `voice_notes TEXT NULL`
  - `created_at`, `updated_at`
- **Verification**: Run `python -c "from database import init_db; init_db()"` and verify `DESCRIBE intake_questionnaires;` in MySQL.
- **Commit Message**:
  ```git
  feat(backend): add intake_questionnaires table with generic q1..q20 mcq columns
  ```

---

### [PR-BE-02] FEAT-02: MCQ Questionnaire REST Endpoints
- **Scope**: `backend/main.py`
- **Depends On**: `PR-BE-01`
- **Objective**: Implement `POST /api/visits/{visit_id}/questionnaire` and `GET /api/visits/{visit_id}/questionnaire`.
- **Payload Schema**:
  - Request: `{ "patient_id": int, "answers": { "q1": int, "q2": int, ... }, "voice_notes": str }`
  - Insert / Upsert with `ON DUPLICATE KEY UPDATE` on `visit_id`.
  - Response: `{ "message": "...", "visit_id": int, "questionnaire_id": int, "recorded_answers": { ... } }`
- **Verification**: Submit cURL request with `{"patient_id": 1, "answers": {"q1": 0, "q2": 1}}` and retrieve back via `GET`.
- **Commit Message**:
  ```git
  feat(backend): implement post and get endpoints for intake questionnaire mcq responses
  ```

---

### [PR-BE-03] Table 6 & FEAT-03: External Diagnostic Reports Ingestion
- **Scope**: `backend/database.py`, `backend/main.py`
- **Depends On**: `PR-BE-02`
- **Objective**: Add `external_reports` table and multipart upload endpoint `POST /api/visits/{visit_id}/reports/upload`.
- **Key Details**:
  - Table: `id`, `visit_id`, `patient_id`, `report_type` (ENUM), `modality`, `file_path`, `file_size_mb`, `findings_summary`, `created_at`.
  - Storage: Save files under `backend/uploads/{visit_id}/` (sanitized filenames).
  - Endpoints: `POST /api/visits/{visit_id}/reports/upload` and `GET /api/visits/{visit_id}/reports`.
- **Verification**: Post multipart upload with dummy PDF/PNG, verify entry in database and file on disk.
- **Commit Message**:
  ```git
  feat(backend): add external_reports table and multipart file upload endpoint
  ```

---

### [PR-BE-04] Table 7 & FEAT-07: CDSS Decision Engine & deterministic_insights Table
- **Scope**: `backend/database.py`, `backend/main.py`
- **Depends On**: `PR-BE-03`
- **Objective**: Add `deterministic_insights` table and rule execution service.
- **Rule Set**:
  - AHA 2017 Blood Pressure: Crisis (`SYS >= 180` or `DIA >= 120`), Stage 2, Stage 1.
  - Hypoxemia: SpO2 `< 90%` (Critical), `90-94%` (Warning).
  - Cardiac: Pulse `> 100` (Tachycardia), `< 50` (Bradycardia).
  - Pyrexia: Temp `>= 101.5°F` (High-grade), `99.5-101.4°F` (Low-grade).
  - Endpoint: `POST /api/doctor/visits/{id}/insights` returning active rule alerts.
- **Verification**: Test patient with BP 185/110 generates `CRITICAL` severity rule flag.
- **Commit Message**:
  ```git
  feat(backend): add deterministic_insights table and clinical decision support rules engine
  ```

---

### [PR-BE-05] Doctor Encounter Sign-off & Status Transition API
- **Scope**: `backend/main.py`
- **Depends On**: `PR-BE-04`
- **Objective**: Implement `POST /api/doctor/visits/{visit_id}/sign-off`.
- **Key Details**:
  - Validates `conclusion_notes`, signs with attending `doctor_id` and timestamp.
  - Requires `doctor_override_notes` if any unreviewed `CRITICAL` safety alerts exist.
  - Updates `visits.status` to `'READY_FOR_BILLING'`.
- **Verification**: Call sign-off endpoint, verify visit status updates to `READY_FOR_BILLING`.
- **Commit Message**:
  ```git
  feat(backend): add doctor encounter sign-off endpoint and visit status transition
  ```

---

### [PR-BE-06] Tables 8, 9, 10: Formulary & Prescription Schema with Seeds
- **Scope**: `backend/database.py`
- **Depends On**: `PR-BE-05`
- **Objective**: Create `drug_formulary`, `prescriptions`, `prescription_items` tables in `init_db()`.
- **Seed Data**: Insert 15 standard OPD drugs (Amlodipine, Metformin, Paracetamol, Amoxicillin, Cetirizine, Azithromycin, Omeprazole, etc.) with dosage forms and strength.
- **Verification**: Run `init_db()` and verify rows in `drug_formulary`.
- **Commit Message**:
  ```git
  feat(backend): create formulary, prescriptions, and prescription_items tables with seed catalog
  ```

---

### [PR-BE-07] FEAT-08: Formulary Search & E-Prescription Creation Endpoints
- **Scope**: `backend/main.py`
- **Depends On**: `PR-BE-06`
- **Objective**: Implement `GET /api/drugs/formulary` and `POST /api/doctor/visits/{id}/prescriptions`.
- **Key Details**:
  - `GET /api/drugs/formulary?q={query}` returns matching formulary items.
  - `POST /api/doctor/visits/{id}/prescriptions` accepts array of items (`drug_id`, `dosage`, `frequency`, `duration_days`, `instructions`) and persists to `prescriptions` + `prescription_items`.
- **Verification**: Query drug search, create 2-item prescription, fetch back with joined drug names.
- **Commit Message**:
  ```git
  feat(backend): implement formulary search and e-prescription authoring endpoints
  ```

---

### [PR-BE-08] Tables 11, 12, 13: Billing, Bill Items & Payments Schema
- **Scope**: `backend/database.py`
- **Depends On**: `PR-BE-07`
- **Objective**: Add `bills`, `bill_items`, and `payments` tables in `init_db()`.
- **Key Details**:
  - `bills`: `subtotal`, `discount_amount`, `insurance_covered_amount`, `net_payable_amount`, `status` (`DRAFT`, `PAID`, `CANCELLED`).
  - `bill_items`: `item_type` (`CONSULTATION`, `DIAGNOSTIC`, `MEDICATION`, `PROCEDURE`), `unit_price`, `quantity`, `total_price`.
  - `payments`: `amount_paid`, `payment_method` (`CASH`, `UPI`, `CARD`, `NETBANKING`), `transaction_reference`.
- **Verification**: Run `init_db()` and check table schemas.
- **Commit Message**:
  ```git
  feat(backend): add tables for bills, bill_items, and payments ledger
  ```

---

### [PR-BE-09] FEAT-09 & 10: Cashier Queue, Bill Aggregation & Payment Tender API
- **Scope**: `backend/main.py`
- **Depends On**: `PR-BE-08`
- **Objective**: Implement Cashier operational APIs:
  - `GET /api/cashier/queue`: Returns visits in `READY_FOR_BILLING` status.
  - `GET /api/bills/visit/{id}`: Generates or fetches itemized bill aggregating Doctor consultation fee + tests + medicines.
  - `POST /api/bills/{id}/payments`: Accepts payment tender, records in `payments`, marks bill as `PAID`, and updates visit to `COMPLETED`.
- **Verification**: Process full billing checkout for a triaged and signed patient; verify status becomes `COMPLETED`.
- **Commit Message**:
  ```git
  feat(backend): implement cashier billing queue, auto-aggregation, and payment tender endpoints
  ```

---

### [PR-BE-10] Admin Analytics & Hospital Staff Provisioning Endpoints
- **Scope**: `backend/main.py`
- **Depends On**: `PR-BE-09`
- **Objective**: Implement Executive Administration APIs:
  - `GET /api/admin/analytics`: Aggregated counts of daily patients, average wait times, revenue by payment method, doctor consultation volumes.
  - `POST /api/admin/users`: Creates new staff accounts with bcrypt hash and role assignment (`RECEPTIONIST`, `DOCTOR`, `CASHIER`, `ADMIN`).
- **Verification**: Call analytics endpoint as ADMIN, create a test user, login with created credentials.
- **Commit Message**:
  ```git
  feat(backend): add executive analytics dashboard endpoint and staff user provisioning
  ```
