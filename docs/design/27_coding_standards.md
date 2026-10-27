# D27 — Coding Standards & Conventions
## Bright Solutions: Clinical Hospital Operating System

> **Document ID:** D27  
> **Version:** 1.0  
> **Status:** APPROVED ARCHITECTURE SPECIFICATION  
> **Depends On:** [03_technical_architecture.md](file:///home/prem/Desktop/pbt/COS/docs/design/03_technical_architecture.md), [12_service_layer_design.md](file:///home/prem/Desktop/pbt/COS/docs/design/12_service_layer_design.md), [26_developer_onboarding_guide.md](file:///home/prem/Desktop/pbt/COS/docs/design/26_developer_onboarding_guide.md)  
> **Prepared By:** Bright Solutions Backend Engineering Team  
> **Last Updated:** October 2026  

---

## Table of Contents

1. [Philosophy & Guiding Principles](#1-philosophy--guiding-principles)
2. [Python & PEP 8 Style Standards](#2-python--pep-8-style-standards)
3. [FastAPI Route & Dependency Conventions](#3-fastapi-route--dependency-conventions)
4. [Pydantic v2 Schema & Validation Rules](#4-pydantic-v2-schema--validation-rules)
5. [SQLAlchemy 2.0 Query & Persistence Patterns](#5-sqlalchemy-20-query--persistence-patterns)
6. [Domain Exception Handling & HTTP Mapping](#6-domain-exception-handling--http-mapping)
7. [Structured Logging & PHI Sanitization Rules](#7-structured-logging--phi-sanitization-rules)
8. [Git Hygiene, Commit Format & PR Quality Gates](#8-git-hygiene-commit-format--pr-quality-gates)

---

## 1. Philosophy & Guiding Principles

Bright Solutions is a life-critical clinical software system. Code quality, predictability, and defensiveness take absolute priority over cleverness or brevity.

1. **Explicit is Better than Implicit:** Function arguments, return types, and transaction scopes must be typed and visible. Magic metaprogramming is forbidden.
2. **Defensive Clinical Validation:** Never trust client-submitted data. Validate clinical bounds (e.g. systolic BP cannot be negative or > 350 mmHg; drug dosage duration cannot be zero).
3. **Zero Plaintext PHI in Logs:** Never log patient names, contact numbers, Aadhaar hashes, or clinical notes in server standard output or log sinks.
4. **Strict Architectural Layering:** Routers only handle HTTP; Services only handle business logic; Models/Repositories only handle SQL persistence.

---

## 2. Python & PEP 8 Style Standards

### 2.1 Code Formatting Toolchain
- **Formatter & Linter:** `Ruff` (or `Black` + `Flake8` + `isort`).
- **Target Version:** Python 3.11+.
- **Maximum Line Length:** **100 characters** (balances readability with modern wide displays).
- **Quotes:** Double quotes (`"`) for strings and docstrings; single quotes (`'`) permitted for dictionary keys in inline dicts.

### 2.2 Strict Type Annotations
All function signatures, arguments, and return types must include explicit type annotations:

```python
# BAD: Missing types and ambiguous return
def process_vitals(data, user):
    return calculate(data)

# GOOD: Fully annotated with Pydantic schema and entity return
def record_vitals(
    db: Session,
    dto: VitalsCreateRequest,
    recorded_by_user_id: int
) -> VitalSigns:
    ...
```

---

## 3. FastAPI Route & Dependency Conventions

### 3.1 Router Declaration & Tags
Every module router must declare an explicit `prefix` and `tags` matching [11_api_endpoint_inventory.md](file:///home/prem/Desktop/pbt/COS/docs/design/11_api_endpoint_inventory.md):

```python
# app/modules/consultation/router.py
router = APIRouter(prefix="/consultations", tags=["Doctor Consultation"])
```

### 3.2 Thin Controllers, Rich Services
Routers must contain **zero business logic**. A router's sole responsibility is:
1. Validating request input via Pydantic.
2. Injecting database session (`get_db`) and authenticated staff (`get_current_user`).
3. Enforcing RBAC permissions (`PermissionChecker`).
4. Invoking the appropriate Service method.
5. Returning the standard `SuccessEnvelope`.

```python
# Standard Router Implementation Template
@router.post(
    "/{consultation_uuid}/sign",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(PermissionChecker("consultation:sign"))]
)
def sign_consultation_endpoint(
    consultation_uuid: UUID,
    payload: ConsultationSignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> dict:
    service = ConsultationService(db)
    signed_encounter = service.sign_consultation(
        consultation_uuid=consultation_uuid,
        dto=payload,
        doctor_profile_id=current_user.doctor_profile.id
    )
    return {
        "success": True,
        "data": signed_encounter,
        "message": "Consultation finalized and signed successfully"
    }
```

---

## 4. Pydantic v2 Schema & Validation Rules

### 4.1 Strict Input Constraints
All user inputs must declare defensive bounds:

```python
# app/modules/pharmacy/schemas.py
from pydantic import BaseModel, Field, field_validator
from decimal import Decimal

class DrugItemCreate(BaseModel):
    item_code: str = Field(..., min_length=2, max_length=50, pattern=r"^[A-Z0-9_-]+$")
    generic_name: str = Field(..., min_length=2, max_length=150)
    brand_name: str = Field(..., min_length=2, max_length=150)
    unit_mrp: Decimal = Field(..., ge=Decimal("0.00"), decimal_places=2)
    reorder_level: int = Field(default=50, ge=0, le=10000)

    @field_validator("generic_name", "brand_name")
    @classmethod
    def strip_whitespace_and_capitalize(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Field cannot be empty or purely whitespace")
        return cleaned
```

### 4.2 Separation of Request and Response Schemas
Never reuse internal database ORM models directly in router responses. Always define explicit DTO schemas (`*Request` and `*Response`) to prevent unintended attribute leaks (e.g. leaking `password_hash` or internal foreign keys).

---

## 5. SQLAlchemy 2.0 Query & Persistence Patterns

### 5.1 Prevention of N+1 Query Degradations
Lazy loading in relational joins degrades database performance under high clinical concurrency. Always specify eager loading using `joinedload` (for 1-to-1 / M-to-1) or `selectinload` (for 1-to-many):

```python
# BAD: Triggers N additional SELECT queries when iterating prescription items
prescriptions = db.query(Prescription).filter(Prescription.patient_id == patient_id).all()
for rx in prescriptions:
    print(rx.items)  # N+1 query bug!

# GOOD: Eagerly loads prescription items in a single optimized query
from sqlalchemy.orm import selectinload

prescriptions = db.query(Prescription).options(
    selectinload(Prescription.items)
).filter(Prescription.patient_id == patient_id).all()
```

### 5.2 Explicit Concurrency Locking on Financial & Sequence Operations
Whenever reading a record to increment a counter or deduct stock, acquire an exclusive row-level lock:

```python
# Acquire row lock to prevent race conditions during concurrent check-ins
sequence = db.query(SystemSequence).filter(
    SystemSequence.hospital_id == hospital_id,
    SystemSequence.sequence_key == "OPD_NUMBER"
).with_for_update().first()
```

### 5.3 Transaction Lifecycle Rules
- **Do not commit inside loops:** Batch database additions and execute a single `db.commit()` at the end of the transaction.
- **Always rollback on exception:** Enclose multi-table operations in try/except blocks to ensure rollback on failure:

```python
try:
    db.add(entity_one)
    db.add(entity_two)
    db.commit()
except Exception:
    db.rollback()
    raise
```

---

## 6. Domain Exception Handling & HTTP Mapping

Services must raise custom exceptions deriving from `BrightSolutionsException`. Never raise raw generic `HTTPException` inside service classes.

```python
# app/core/exceptions.py
class BrightSolutionsException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, details: list = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or []

# app/modules/consultation/exceptions.py
class EncounterAlreadySignedException(BrightSolutionsException):
    def __init__(self):
        super().__init__(
            code="ENCOUNTER_ALREADY_SIGNED",
            message="This consultation has already been signed and is permanently immutable.",
            status_code=400
        )
```

### Global FastAPI Exception Handler (`app/main.py`)
```python
@app.exception_handler(BrightSolutionsException)
async def bright_solutions_exception_handler(request: Request, exc: BrightSolutionsException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": false,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )
```

---

## 7. Structured Logging & PHI Sanitization Rules

### 7.1 JSON Structured Logging Format
All application log output is formatted in structured JSON:

```python
import logging
import json
from datetime import datetime

class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "correlation_id": getattr(record, "correlation_id", None)
        }
        return json.dumps(log_obj)
```

### 7.2 PHI Sanitization Checklist
Before committing any log statement, verify:
- ❌ **NEVER LOG:** Patient Full Names, Mobile Numbers, Aadhaar Numbers, Physical Addresses, Medical Diagnoses, Prescription Medication Lists.
- ✅ **PERMITTED:** Patient `uhid`, Encounter `opd_number`, User ID `user_id`, Action string (`REGISTER_PATIENT`, `SIGN_CONSULTATION`), Execution duration in ms (`duration_ms`).

---

## 8. Git Hygiene, Commit Format & PR Quality Gates

### 8.1 Branch Naming Conventions
- `feature/<module-name>-<short-description>` (e.g. `feature/opd-token-calling`)
- `fix/<module-name>-<bug-description>` (e.g. `fix/billing-tax-rounding`)
- `docs/<doc-id>-<title>` (e.g. `docs/d27-coding-standards`)

### 8.2 Conventional Commit Messages
Commits must follow the Conventional Commits specification:
```
<type>(<scope>): <short imperative summary>

[optional body explaining context and rationale]
```
- **Allowed Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.
- **Examples:**
  - `feat(pharmacy): implement batch stock reservation with FIFO expiry lock`
  - `fix(billing): correct round-off discrepancy on partial payments`
  - `test(triage): add unit tests for critical blood pressure alerting`

### 8.3 Pull Request Quality Gates
A Pull Request cannot be merged unless:
1. **Ruff / Linter Passes:** Zero linting errors or formatting warnings.
2. **Pytest Passes:** 100% of test suite passes without regressions.
3. **No Migration Gaps:** If SQLAlchemy models were modified, an accompanying Alembic migration is included.
4. **Peer Review:** Approved by the Backend Lead.
