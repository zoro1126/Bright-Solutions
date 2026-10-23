# D13 — RBAC Permission Matrix
## Bright Solutions: Clinical Hospital Operating System

> **Document ID:** D13  
> **Version:** 1.0  
> **Status:** APPROVED ARCHITECTURE SPECIFICATION  
> **Depends On:** [01_PRD.md](file:///home/prem/Desktop/pbt/COS/docs/design/01_PRD.md), [02_feature_spec.md](file:///home/prem/Desktop/pbt/COS/docs/design/02_feature_spec.md), [09_database_schema_ddl.sql](file:///home/prem/Desktop/pbt/COS/docs/design/09_database_schema_ddl.sql), [11_api_endpoint_inventory.md](file:///home/prem/Desktop/pbt/COS/docs/design/11_api_endpoint_inventory.md)  
> **Prepared By:** Bright Solutions Backend Engineering Team  
> **Last Updated:** October 2026  

---

## Table of Contents

1. [Security Principles & Architecture](#1-security-principles--architecture)
2. [Role Definitions & Scopes](#2-role-definitions--scopes)
3. [Granular Permission Catalog](#3-granular-permission-catalog)
4. [Role × Permission Master Matrix](#4-role--permission-master-matrix)
5. [Endpoint-to-Permission Mapping](#5-endpoint-to-permission-mapping)
6. [Clinical Safety & Medico-Legal Access Guards](#6-clinical-safety--medico-legal-access-guards)
7. [FastAPI Enforcement Architecture](#7-fastapi-enforcement-architecture)

---

## 1. Security Principles & Architecture

The Bright Solutions RBAC model enforces three fundamental healthcare data security tenets:

1. **Principle of Least Privilege (PoLP):** Staff members have access strictly to data and operations necessary for their clinical or administrative workflow.
2. **Separation of Clinical and Financial Duties:**
   - Clinicians (Doctors, Nurses) make clinical judgments and place orders, but cannot adjust billing rates, grant discounts, or collect payments.
   - Billing clerks and cashiers collect payments and print financial receipts, but cannot author medical notes or alter clinical records.
3. **Immutability of Signed Clinical Encounters:**
   - Once a doctor signs a consultation note or a discharge summary, it is cryptographically locked (`status = 'SIGNED'`). No role—including `SUPER_ADMIN`—can overwrite historical clinical notes. Only an addendum or amendment can be appended.

---

## 2. Role Definitions & Scopes

| Role Code | Role Name | Primary Responsibility | Data Scope |
|:---|:---|:---|:---|
| `SUPER_ADMIN` | Super Administrator | Multi-tenant setup, database migrations, security audits, disaster recovery | Entire System |
| `HOSPITAL_ADMIN` | Hospital Administrator | Staff accounts, department config, tariff schedules, bed setup, hospital reports | Hospital-Wide |
| `RECEPTIONIST` | Front Desk Receptionist | Patient registration, OPD queue check-in, OPD consultation fee collection, IPD admission desk | Patient Demographics, OPD Queue, Front-Desk Payments |
| `NURSE` | Staff Nurse | Triage vitals intake, screening questionnaires, IPD medication administration, bed status tracking | Patient Demographics, Vitals, Inpatient Care Records |
| `DOCTOR` | Medical Officer / Consultant | Clinical consultations, SOAP notes, e-prescriptions, lab orders, IPD daily rounds, discharge summaries | Full Clinical Records, Formularies, Diagnostics |
| `PHARMACIST` | Pharmacist / Chemist | Prescription fulfillment queue, batch stock receiving, drug dispensing, pharmacy counter billing | Formularies, Prescriptions, Dispensations, Pharmacy Invoices |
| `LAB_TECHNICIAN` | Pathology Lab Technician | Specimen collection, test parameter entry, abnormal value flagging, lab catalog | Diagnostic Orders, Parameter Results, Lab Master |
| `BILLING_CLERK` | Billing Clerk / Cashier | Multi-point invoice generation, IPD 10-head consolidated settlement, payment collection, receipts | Tariffs, Invoices, Payments, Billing Ledgers |

---

## 3. Granular Permission Catalog

Permissions follow the format `<module>:<action>`:

### 3.1 Patient Management (`patient`)
- `patient:create` — Register new patient records and generate UHID.
- `patient:read` — View patient demographics, contact details, and emergency contacts.
- `patient:update` — Modify non-clinical demographic information.
- `patient:delete` — Soft-delete duplicate or erroneously created records (Admin only).
- `patient:allergy_write` — Add or remove known allergies.

### 3.2 OPD Queue Management (`opd`)
- `opd:checkin` — Check-in patient, assign doctor, and issue queue token.
- `opd:read` — View daily doctor queues and waiting status.
- `opd:call` — Call patient token into consultation chamber.
- `opd:start` — Mark consultation in progress.
- `opd:complete` — Mark OPD visit completed.
- `opd:cancel` — Cancel visit before consultation begins.

### 3.3 Clinical Triage & Vitals (`triage`)
- `triage:vitals_write` — Record temperature, BP, pulse, SpO2, weight, height.
- `triage:vitals_read` — View historical vitals chart and alerts.
- `triage:questionnaire_write` — Submit intake screening responses.
- `triage:questionnaire_read` — Review intake answers and red-flag alerts.

### 3.4 Doctor Consultation (`consultation`)
- `consultation:write` — Create and autosave draft SOAP notes.
- `consultation:read` — View clinical history and consultation notes.
- `consultation:sign` — Finalize and digitally sign consultation note.
- `consultation:diagnose` — Attach ICD-10 diagnoses.

### 3.5 Prescriptions & Pharmacy (`pharmacy`)
- `rx:write` — Author e-prescriptions with dosage and duration.
- `rx:read` — View patient prescription history.
- `pharmacy:queue_read` — Access pharmacist dispensing queue.
- `pharmacy:dispense` — Dispense medications and deduct batch stock.
- `pharmacy:inventory_write` — Add drugs to formulary and receive stock batches.
- `pharmacy:inventory_read` — View stock levels and reorder alerts.

### 3.6 Inpatient (IPD) Management (`ipd`)
- `ipd:admit` — Admit patient, allocate initial bed, collect advance.
- `ipd:read` — View active inpatients, bed assignments, and stay details.
- `ipd:transfer_bed` — Transfer patient between wards/rooms/beds.
- `ipd:daily_notes_write` — Author daily clinical rounds notes.
- `ipd:nurse_record_write` — Record nursing vitals and medication administration.
- `ipd:procedure_write` — Log surgical/clinical procedures and charges.
- `ipd:discharge_summary_write` — Author and sign discharge summary.
- `ipd:discharge` — Complete inpatient discharge and release bed.

### 3.7 Pathology / Laboratory (`lab`)
- `lab:order_create` — Prescribe diagnostic tests.
- `lab:order_read` — View lab orders and tracking status.
- `lab:sample_collect` — Acknowledge specimen collection.
- `lab:result_write` — Enter test parameter values.
- `lab:verify` — Verify and sign pathology report.
- `lab:catalog_write` — Add/edit test catalog, sub-parameters, and normal ranges.

### 3.8 Billing & Payments (`billing`)
- `billing:invoice_create` — Generate OPD, Pharmacy, Lab, or IPD final invoices.
- `billing:invoice_read` — View bills, breakdown, and payment status.
- `billing:payment_collect` — Record manual payment (Cash, UPI, Card).
- `billing:discount_apply` — Apply authorized discounts with written reason.
- `billing:tariff_manage` — Manage hospital service charges and rates.

### 3.9 CDSS & Clinical Safety (`cdss`)
- `cdss:evaluate` — Trigger automated DDI and vitals rule evaluation.
- `cdss:override` — Override clinical alert with mandatory written justification.
- `cdss:rule_manage` — Configure safety rules and threshold values.

### 3.10 System & Administration (`admin`)
- `admin:user_manage` — Create, edit, and deactivate staff accounts.
- `admin:config_manage` — Update hospital profile and sequence formats.
- `admin:audit_read` — Query system security and clinical audit logs.

---

## 4. Role × Permission Master Matrix

Legend:
- `✓` = Full Access (Create / Read / Update as defined)
- `R` = Read-Only Access
- `—` = No Access

| Permission Key | `SUPER_ADMIN` | `HOSPITAL_ADMIN` | `RECEPTIONIST` | `NURSE` | `DOCTOR` | `PHARMACIST` | `LAB_TECH` | `BILLING_CLERK` |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Patient Module** | | | | | | | | |
| `patient:create` | ✓ | ✓ | ✓ | — | — | — | — | — |
| `patient:read` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `patient:update` | ✓ | ✓ | ✓ | — | — | — | — | — |
| `patient:delete` | ✓ | ✓ | — | — | — | — | — | — |
| `patient:allergy_write` | ✓ | ✓ | — | ✓ | ✓ | — | — | — |
| **OPD Queue** | | | | | | | | |
| `opd:checkin` | ✓ | ✓ | ✓ | — | — | — | — | — |
| `opd:read` | ✓ | ✓ | ✓ | ✓ | ✓ | R | R | ✓ |
| `opd:call` | ✓ | — | — | — | ✓ | — | — | — |
| `opd:start` | ✓ | — | — | — | ✓ | — | — | — |
| `opd:complete` | ✓ | — | — | — | ✓ | — | — | — |
| `opd:cancel` | ✓ | ✓ | ✓ | — | — | — | — | — |
| **Triage & Vitals** | | | | | | | | |
| `triage:vitals_write` | ✓ | — | — | ✓ | ✓ | — | — | — |
| `triage:vitals_read` | ✓ | ✓ | R | ✓ | ✓ | — | — | — |
| `triage:questionnaire_write`| ✓ | — | — | ✓ | ✓ | — | — | — |
| `triage:questionnaire_read` | ✓ | ✓ | — | ✓ | ✓ | — | — | — |
| **Consultation** | | | | | | | | |
| `consultation:write` | ✓ | — | — | — | ✓ | — | — | — |
| `consultation:read` | ✓ | ✓ | — | R | ✓ | — | — | — |
| `consultation:sign` | — | — | — | — | ✓ | — | — | — |
| `consultation:diagnose` | — | — | — | — | ✓ | — | — | — |
| **Prescriptions & Pharmacy** | | | | | | | | |
| `rx:write` | — | — | — | — | ✓ | — | — | — |
| `rx:read` | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | — |
| `pharmacy:queue_read`| ✓ | ✓ | — | — | — | ✓ | — | — |
| `pharmacy:dispense` | ✓ | — | — | — | — | ✓ | — | — |
| `pharmacy:inventory_write`| ✓ | ✓ | — | — | — | ✓ | — | — |
| `pharmacy:inventory_read` | ✓ | ✓ | — | R | ✓ | ✓ | — | — |
| **IPD Stay & Bed** | | | | | | | | |
| `ipd:admit` | ✓ | ✓ | ✓ | — | — | — | — | — |
| `ipd:read` | ✓ | ✓ | ✓ | ✓ | ✓ | R | R | ✓ |
| `ipd:transfer_bed` | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| `ipd:daily_notes_write`| — | — | — | — | ✓ | — | — | — |
| `ipd:nurse_record_write`| — | — | — | ✓ | — | — | — | — |
| `ipd:procedure_write` | — | — | — | — | ✓ | — | — | — |
| `ipd:discharge_summary_write`| — | — | — | — | ✓ | — | — | — |
| `ipd:discharge` | ✓ | ✓ | — | — | — | — | — | ✓ |
| **Pathology / Lab** | | | | | | | | |
| `lab:order_create` | — | — | — | — | ✓ | — | — | — |
| `lab:order_read` | ✓ | ✓ | — | ✓ | ✓ | — | ✓ | R |
| `lab:sample_collect` | ✓ | — | — | — | — | — | ✓ | — |
| `lab:result_write` | ✓ | — | — | — | — | — | ✓ | — |
| `lab:verify` | ✓ | — | — | — | ✓ | — | — | — |
| `lab:catalog_write` | ✓ | ✓ | — | — | — | — | — | — |
| **Billing & Payments** | | | | | | | | |
| `billing:invoice_create`| ✓ | ✓ | ✓ (OPD) | — | — | ✓ (Rx) | — | ✓ (All) |
| `billing:invoice_read` | ✓ | ✓ | ✓ (OPD) | — | — | ✓ (Rx) | — | ✓ (All) |
| `billing:payment_collect`| ✓ | ✓ | ✓ (OPD) | — | — | ✓ (Rx) | — | ✓ (All) |
| `billing:discount_apply`| ✓ | ✓ | — | — | — | — | — | ✓ |
| `billing:tariff_manage` | ✓ | ✓ | — | — | — | — | — | — |
| **CDSS Safety** | | | | | | | | |
| `cdss:evaluate` | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | — |
| `cdss:override` | — | — | — | — | ✓ | — | — | — |
| `cdss:rule_manage` | ✓ | ✓ | — | — | — | — | — | — |
| **System Administration** | | | | | | | | |
| `admin:user_manage` | ✓ | ✓ | — | — | — | — | — | — |
| `admin:config_manage`| ✓ | ✓ | — | — | — | — | — | — |
| `admin:audit_read` | ✓ | ✓ | — | — | — | — | — | — |

---

## 5. Endpoint-to-Permission Mapping

This table connects the HTTP routes defined in [11_api_endpoint_inventory.md](file:///home/prem/Desktop/pbt/COS/docs/design/11_api_endpoint_inventory.md) with our RBAC enforcement policy.

| Method | Endpoint Route | Required Permission | Allowed Roles |
|:---|:---|:---|:---|
| `POST` | `/api/v1/patients` | `patient:create` | `RECEPTIONIST`, `HOSPITAL_ADMIN`, `SUPER_ADMIN` |
| `GET` | `/api/v1/patients` | `patient:read` | `RECEPTIONIST`, `NURSE`, `DOCTOR`, `BILLING_CLERK`, `HOSPITAL_ADMIN` |
| `GET` | `/api/v1/patients/{uuid}` | `patient:read` | `RECEPTIONIST`, `NURSE`, `DOCTOR`, `BILLING_CLERK`, `HOSPITAL_ADMIN` |
| `POST` | `/api/v1/patients/{uuid}/allergies` | `patient:allergy_write` | `NURSE`, `DOCTOR` |
| `POST` | `/api/v1/opd/visits` | `opd:checkin` | `RECEPTIONIST`, `HOSPITAL_ADMIN` |
| `POST` | `/api/v1/queue/tokens/{uuid}/call` | `opd:call` | `DOCTOR` |
| `POST` | `/api/v1/queue/tokens/{uuid}/start` | `opd:start` | `DOCTOR` |
| `POST` | `/api/v1/queue/tokens/{uuid}/complete` | `opd:complete` | `DOCTOR` |
| `POST` | `/api/v1/vitals` | `triage:vitals_write` | `NURSE`, `DOCTOR` |
| `POST` | `/api/v1/triage/questionnaire` | `triage:questionnaire_write` | `NURSE`, `DOCTOR` |
| `POST` | `/api/v1/consultations/draft` | `consultation:write` | `DOCTOR` |
| `POST` | `/api/v1/consultations/{uuid}/sign` | `consultation:sign` | `DOCTOR` |
| `POST` | `/api/v1/prescriptions` | `rx:write` | `DOCTOR` |
| `GET` | `/api/v1/pharmacy/queue` | `pharmacy:queue_read` | `PHARMACIST`, `HOSPITAL_ADMIN` |
| `POST` | `/api/v1/pharmacy/dispensations` | `pharmacy:dispense` | `PHARMACIST` |
| `POST` | `/api/v1/pharmacy/items/{uuid}/batches` | `pharmacy:inventory_write`| `PHARMACIST`, `HOSPITAL_ADMIN` |
| `POST` | `/api/v1/ipd/admissions` | `ipd:admit` | `RECEPTIONIST`, `HOSPITAL_ADMIN` |
| `POST` | `/api/v1/ipd/admissions/{uuid}/transfer-bed`| `ipd:transfer_bed` | `NURSE`, `RECEPTIONIST`, `HOSPITAL_ADMIN` |
| `POST` | `/api/v1/ipd/admissions/{uuid}/daily-notes` | `ipd:daily_notes_write` | `DOCTOR` |
| `POST` | `/api/v1/ipd/admissions/{uuid}/discharge` | `ipd:discharge` | `BILLING_CLERK`, `HOSPITAL_ADMIN` |
| `POST` | `/api/v1/lab/orders` | `lab:order_create` | `DOCTOR` |
| `POST` | `/api/v1/lab/orders/{uuid}/results` | `lab:result_write` | `LAB_TECHNICIAN` |
| `POST` | `/api/v1/lab/orders/{uuid}/verify` | `lab:verify` | `DOCTOR` (Pathologist), `HOSPITAL_ADMIN` |
| `POST` | `/api/v1/invoices` | `billing:invoice_create` | `BILLING_CLERK`, `RECEPTIONIST`, `PHARMACIST`, `HOSPITAL_ADMIN` |
| `POST` | `/api/v1/invoices/{uuid}/payments` | `billing:payment_collect`| `BILLING_CLERK`, `RECEPTIONIST`, `PHARMACIST`, `HOSPITAL_ADMIN` |
| `POST` | `/api/v1/cdss/check-ddi` | `cdss:evaluate` | `DOCTOR` |
| `POST` | `/api/v1/cdss/alerts/{uuid}/action` | `cdss:override` | `DOCTOR` |
| `GET` | `/api/v1/display/queue` | None (`Public`) | Unauthenticated Public Access |

---

## 6. Clinical Safety & Medico-Legal Access Guards

In addition to coarse role checks, Bright Solutions enforces dynamic resource-level ownership constraints:

1. **Doctor Note Ownership Guard:**
   - A Doctor can only modify, autosave, or sign a consultation note if `doctor_id == current_user.doctor_profile.id`.
   - Another doctor can view the note (read-only for clinical continuity), but cannot alter or sign it.
2. **Post-Signature Immutability Guard:**
   - If `consultation.status == 'SIGNED'`, any `PUT` or `PATCH` request returns `400 Bad Request` (`ENCOUNTER_ALREADY_SIGNED`).
3. **Emergency Override Protocol:**
   - In clinical emergencies, if the assigned attending physician is unavailable, a `HOSPITAL_ADMIN` can reassign the attending physician of an IPD admission, logging an immutable audit event (`action = 'EMERGENCY_REASSIGN_ATTENDING'`).
4. **Discharge Balance Lock:**
   - The endpoint `/api/v1/ipd/admissions/{uuid}/discharge` automatically queries `invoices.balance_amount`. If any balance remains unpaid and no written financial waiver is attached, the request is rejected with `CANNOT_DISCHARGE`.
5. **Waiting Room Display Sanitization:**
   - The public `/display` endpoints strip all PHI (Patient Identifiable Information) before serialization. Tokens and room numbers are rendered; patient names, phone numbers, and diagnoses are strictly excluded at the service query level.

---

## 7. FastAPI Enforcement Architecture

In our FastAPI backend, permissions are enforced using declarative dependency injection:

```python
from fastapi import Depends, HTTPException, status
from app.core.security import get_current_active_user
from app.models.user import User

class PermissionChecker:
    def __init__(self, required_permission: str):
        self.required_permission = required_permission

    def __call__(self, user: User = Depends(get_current_active_user)) -> User:
        if user.is_super_admin:
            return user
        
        # Check if user's role contains the required permission code
        user_permissions = {p.permission_code for p in user.role.permissions}
        if self.required_permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires permission: '{self.required_permission}'"
            )
        return user

# Example Route Usage:
# @router.post("/prescriptions", dependencies=[Depends(PermissionChecker("rx:write"))])
```
