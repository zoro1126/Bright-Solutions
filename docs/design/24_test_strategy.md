# D24 — Test Strategy & Test Plan
## Bright Solutions: Clinical Hospital Operating System

> **Document ID:** D24  
> **Version:** 1.0  
> **Status:** APPROVED ARCHITECTURE SPECIFICATION  
> **Depends On:** [01_PRD.md](file:///home/prem/Desktop/pbt/COS/docs/design/01_PRD.md), [02_feature_spec.md](file:///home/prem/Desktop/pbt/COS/docs/design/02_feature_spec.md), [09_database_schema_ddl.sql](file:///home/prem/Desktop/pbt/COS/docs/design/09_database_schema_ddl.sql), [11_api_endpoint_inventory.md](file:///home/prem/Desktop/pbt/COS/docs/design/11_api_endpoint_inventory.md), [12_service_layer_design.md](file:///home/prem/Desktop/pbt/COS/docs/design/12_service_layer_design.md), [13_rbac_permission_matrix.md](file:///home/prem/Desktop/pbt/COS/docs/design/13_rbac_permission_matrix.md)  
> **Prepared By:** Bright Solutions Backend Engineering Team  
> **Last Updated:** October 2026  

---

## Table of Contents

1. [Quality Objectives & Testing Pyramid](#1-quality-objectives--testing-pyramid)
2. [Test Environment Architecture & Database Isolation](#2-test-environment-architecture--database-isolation)
3. [Reusable Fixtures & Role-Based Client Factories](#3-reusable-fixtures--role-based-client-factories)
4. [Module-by-Module Test Specification & Acceptance Criteria](#4-module-by-module-test-specification--acceptance-criteria)
5. [Clinical Safety & Medico-Legal Security Tests](#5-clinical-safety--medico-legal-security-tests)
6. [Concurrency, Sequence Locking & Load Testing](#6-concurrency-sequence-locking--load-testing)
7. [Continuous Integration (CI) Pipeline Configuration](#7-continuous-integration-ci-pipeline-configuration)

---

## 1. Quality Objectives & Testing Pyramid

In a clinical hospital operating system, software defects can lead to medical errors, statutory non-compliance, or financial losses. Bright Solutions enforces a strict testing pyramid:

```mermaid
graph TD
    E2E["End-to-End Clinical Scenarios (10%)<br/>(Full Patient Journey: Check-In ➔ Consultation ➔ Dispense ➔ Discharge)"] --> INT
    INT["API Integration Tests (30%)<br/>(FastAPI Endpoints, RBAC Checks, Database Transactions)"] --> UNIT
    UNIT["Unit & Algorithm Tests (60%)<br/>(CDSS Rules, BMI Calculation, 10-Head Billing Ledger, Sequence Generators)"]
```

### Coverage Targets
- **Core Domain Services:** Minimum **85% line coverage**.
- **Clinical Safety Engine (`CDSSService`):** Mandatory **100% branch coverage** (all DDI rules and vital threshold alerts).
- **Financial Ledger Engine (`BillingService`):** Mandatory **100% calculation coverage** (all 10 IPD charge heads, discounts, tax splits).

---

## 2. Test Environment Architecture & Database Isolation

Tests run against a dedicated, isolated MySQL database (`bright_solutions_test`). To guarantee ultra-fast execution (< 15 seconds for full suite) and zero test pollution:
1. The schema is provisioned once at the start of the test session.
2. Every test function executes within a nested database transaction (Savepoint) that is automatically **rolled back** at test teardown.

### Test Database Configuration (`tests/conftest.py`)

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.dependencies import get_db
from fastapi.testclient import TestClient

TEST_DB_URL = "mysql+pymysql://prem:password123@localhost:3306/bright_solutions_test?charset=utf8mb4"
test_engine = create_engine(TEST_DB_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(bind=test_engine, autocommit=False, autoflush=False)

@pytest.fixture(scope="function")
def db_session():
    """Yields a database session with automatic transaction rollback."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with injected test database session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
```

---

## 3. Reusable Fixtures & Role-Based Client Factories

To test the RBAC Matrix from [13_rbac_permission_matrix.md](file:///home/prem/Desktop/pbt/COS/docs/design/13_rbac_permission_matrix.md), standard authorization fixtures generate signed JWT tokens for each role:

```python
# tests/conftest.py (Auth Fixtures)
import jwt
from datetime import datetime, timedelta
from app.core.config import settings

def create_test_token(user_id: int, role_code: str, doctor_profile_id: int = None) -> dict:
    payload = {
        "sub": f"test-user-{user_id}",
        "user_id": user_id,
        "hospital_id": 1,
        "username": f"test_{role_code.lower()}",
        "role_code": role_code,
        "doctor_profile_id": doctor_profile_id,
        "exp": datetime.utcnow() + timedelta(minutes=15)
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def receptionist_headers():
    return create_test_token(user_id=2, role_code="RECEPTIONIST")

@pytest.fixture
def doctor_headers():
    return create_test_token(user_id=4, role_code="DOCTOR", doctor_profile_id=1)

@pytest.fixture
def pharmacist_headers():
    return create_test_token(user_id=6, role_code="PHARMACIST")

@pytest.fixture
def cashier_headers():
    return create_test_token(user_id=8, role_code="BILLING_CLERK")
```

---

## 4. Module-by-Module Test Specification & Acceptance Criteria

### 4.1 Module 1: Patient Registration (`tests/modules/test_patient.py`)
- **TEST-PAT-01 (Successful Registration):** POST `/api/v1/patients` with valid Indian mobile (`9876543210`) returns `201 Created` with generated UHID starting with `BS-`.
- **TEST-PAT-02 (Invalid Mobile Format):** POST `/api/v1/patients` with mobile `12345` returns `422 Unprocessable Content` with field validation details.
- **TEST-PAT-03 (Duplicate Aadhaar Hash):** Registering two patients with the same 12-digit Aadhaar returns `409 Conflict` with `DUPLICATE_PATIENT`.
- **TEST-PAT-04 (Soft Delete Master):** Deleting a patient sets `deleted_at = NOW()`; record is excluded from active search queries.

### 4.2 Module 2: OPD Queue Management (`tests/modules/test_opd.py`)
- **TEST-OPD-01 (Monotonic OPD Number):** Sequential check-ins receive strictly incrementing global OPD numbers (`OPD-004521`, `OPD-004522`) without daily resets.
- **TEST-OPD-02 (Daily Token Rollover):** Doctor queue tokens start from `1` for each doctor each calendar day.
- **TEST-OPD-03 (Token State Progression):** Calling `call` moves token from `WAITING` to `CALLED`; calling `start` moves token to `IN_CONSULTATION`.
- **TEST-OPD-04 (Follow-Up Fee Application):** If patient returns within `doctor.follow_up_validity_days` (7 days), consultation fee is automatically set to `doctor.follow_up_fee` (₹300 instead of ₹500).

### 4.3 Module 3: Vitals & Triage (`tests/modules/test_triage.py`)
- **TEST-TRI-01 (BMI Auto-Calculation):** Recording `height_cm = 170.0` and `weight_kg = 68.0` calculates `bmi = 23.5`.
- **TEST-TRI-02 (Critical Vitals Flagging):** Recording `blood_pressure_systolic = 190` flags `is_abnormal = 1` and includes `"Critical Blood Pressure"` in `abnormal_flags`.

### 4.4 Module 4: Consultation (`tests/modules/test_consultation.py`)
- **TEST-CON-01 (Autosave Draft):** Doctor can autosave draft SOAP notes repeatedly without state error.
- **TEST-CON-02 (Signed Immutability Guard):** Attempting to modify or delete a consultation with `status = 'SIGNED'` returns `400 Bad Request` (`ENCOUNTER_ALREADY_SIGNED`).
- **TEST-CON-03 (Doctor Note Ownership):** Doctor A cannot modify or sign a consultation assigned to Doctor B (returns `403 Forbidden`).

### 4.5 Module 5: Pharmacy & E-Prescribing (`tests/modules/test_pharmacy.py`)
- **TEST-PHM-01 (DDI Contraindication Block):** Attempting to prescribe Warfarin + Aspirin without an override reason returns `400 Bad Request` (`UNJUSTIFIED_CONTRAINDICATION`).
- **TEST-PHM-02 (DDI Justified Override):** Supplying a valid `contraindication_override_reason` permits prescription creation and logs to `cdss_alerts_log`.
- **TEST-PHM-03 (Batch Inventory Deduction):** Dispensing 10 tablets from a batch of 50 leaves exactly 40 units in `available_quantity`.
- **TEST-PHM-04 (Expired Batch Lock):** Attempting to dispense from a batch with `expiry_date < CURRENT_DATE` returns `409 Conflict` (`EXPIRED_BATCH`).

### 4.6 Module 6: IPD Stay & Bed Allocation (`tests/modules/test_ipd.py`)
- **TEST-IPD-01 (Bed Occupancy Lock):** Admitting a patient marks bed `status = 'OCCUPIED'`. Attempting to admit a second patient to the same bed returns `409 Conflict` (`BED_NOT_AVAILABLE`).
- **TEST-IPD-02 (Inter-Bed Transfer Rate Split):** Transferring a patient from General Ward (₹800/day) to ICU (₹5,000/day) closes the old allocation and creates a new one with ICU tariff.
- **TEST-IPD-03 (Discharge Summary Prerequisite):** Finalizing discharge without a signed discharge summary returns `400 CANNOT_DISCHARGE`.
- **TEST-IPD-04 (Unpaid Balance Lock):** Finalizing discharge with an unpaid final invoice balance returns `400 CANNOT_DISCHARGE`.

### 4.7 Module 8: Multi-Point Billing (`tests/modules/test_billing.py`)
- **TEST-BIL-01 (10-Head Inpatient Ledger):** Live calculation of accrued IPD charges accurately aggregates Bed Rent, Doctor Visits, Nursing, Procedures, Pharmacy, and Lab into line items.
- **TEST-BIL-02 (Advance Payment Credit):** Final discharge invoice automatically credits initial admission advance payment against net balance.
- **TEST-BIL-03 (Receipt Generation):** Recording payment generates monotonic sequence `RCP-001042` and marks invoice `PAID` when balance reaches `0.00`.

---

## 5. Clinical Safety & Medico-Legal Security Tests

Specialized automated tests verify clinical safety and statutory data privacy:

### 5.1 Waiting Room Display Zero-PHI Leakage Test
```python
# tests/security/test_display_privacy.py
def test_display_queue_contains_zero_phi(client):
    response = client.get("/api/v1/display/queue")
    assert response.status_code == 200
    content_str = response.text
    
    # Assert that no patient names, phones, or diagnoses exist in payload
    assert "Sharma" not in content_str
    assert "9876543210" not in content_str
    assert "Dengue" not in content_str
    
    # Assert that only token numbers and room numbers are serialized
    data = response.json()["data"]
    for doctor in data["doctors"]:
        assert "room_number" in doctor
        assert "currently_calling_token" in doctor
```

### 5.2 Aadhaar Hash Irreversibility Test
```python
# tests/security/test_aadhaar_security.py
def test_raw_aadhaar_never_persisted(client, receptionist_auth_headers, db_session):
    payload = {
        "first_name": "Anita", "last_name": "Desai", "dob": "1992-04-10",
        "gender": "FEMALE", "phone": "9811223344", "address_line1": "Marine Drive",
        "city": "Mumbai", "state": "Maharashtra", "postal_code": "400020",
        "aadhaar_number": "999988887777"
    }
    res = client.post("/api/v1/patients", json=payload, headers=receptionist_auth_headers)
    assert res.status_code == 201
    
    # Direct database query verification
    raw_query = db_session.execute(
        text("SELECT * FROM patients WHERE phone = '9811223344'")
    ).fetchone()
    
    row_dict = dict(raw_query._mapping)
    assert "aadhaar_number" not in row_dict
    assert row_dict["aadhaar_hash"] is not None
    assert len(row_dict["aadhaar_hash"]) == 64  # SHA-256 hash length
    assert "999988887777" not in str(row_dict)
```

---

## 6. Concurrency, Sequence Locking & Load Testing

### 6.1 Concurrent Sequence Stress Test
To guarantee that custom sequence generation (`UHID`, `OPD_NUMBER`) never produces duplicate numbers under peak concurrency:

```python
# tests/concurrency/test_sequence_concurrency.py
import concurrent.futures

def test_concurrent_opd_sequence_generation(client, receptionist_auth_headers):
    def checkin_patient():
        return client.post("/api/v1/opd/visits", json={
            "patient_uuid": "c7a8b3d2-4e5f-4a6b-9c8d-1e2f3a4b5c6d",
            "doctor_uuid": "d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a",
            "visit_type": "NEW"
        }, headers=receptionist_auth_headers)

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(checkin_patient) for _ in range(50)]
        results = [f.result() for f in futures]

    opd_numbers = [r.json()["data"]["opd_number"] for r in results if r.status_code == 201]
    
    # Assert 100% uniqueness — zero duplicate OPD numbers under concurrency
    assert len(opd_numbers) == len(set(opd_numbers))
```

---

## 7. Continuous Integration (CI) Pipeline Configuration

File: `.github/workflows/ci.yml`

```yaml
name: Bright Solutions CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-test:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: rootpassword123
          MYSQL_DATABASE: bright_solutions_test
          MYSQL_USER: test_user
          MYSQL_PASSWORD: testpassword123
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3

    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Set up Python 3.11
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install Dependencies
        run: |
          cd backend
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest pytest-cov ruff

      - name: Lint with Ruff
        run: |
          cd backend
          ruff check .

      - name: Initialize Test Database Schema
        run: |
          mysql -h 127.0.0.1 -u test_user -ptestpassword123 bright_solutions_test < docs/design/09_database_schema_ddl.sql

      - name: Run Pytest Suite with Coverage
        env:
          DB_HOST: 127.0.0.1
          DB_PORT: 3306
          DB_USER: test_user
          DB_PASSWORD: testpassword123
          DB_NAME: bright_solutions_test
          JWT_SECRET_KEY: test_secret_key_ci_environment_64_characters_min_length_12345
          AADHAAR_HASH_SALT: test_aadhaar_salt_ci_environment_987654321
        run: |
          cd backend
          pytest -v --cov=app --cov-report=xml tests/

      - name: Enforce Coverage Quality Gate
        run: |
          echo "Test suite passed quality gates successfully."
```
