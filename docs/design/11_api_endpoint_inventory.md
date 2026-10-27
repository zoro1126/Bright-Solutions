# D11 — API Endpoint Inventory
## Bright Solutions: Clinical Hospital Operating System

> **Document ID:** D11  
> **Version:** 1.0  
> **Status:** APPROVED ARCHITECTURE SPECIFICATION  
> **Depends On:** [01_PRD.md](file:///home/prem/Desktop/pbt/COS/docs/design/01_PRD.md), [02_feature_spec.md](file:///home/prem/Desktop/pbt/COS/docs/design/02_feature_spec.md), [09_database_schema_ddl.sql](file:///home/prem/Desktop/pbt/COS/docs/design/09_database_schema_ddl.sql)  
> **Prepared By:** Bright Solutions Backend Engineering Team  
> **Last Updated:** October 2026  

---

## Table of Contents

1. [Global API Conventions & Envelopes](#1-global-api-conventions--envelopes)
2. [Module 1 — Patient Registration APIs](#2-module-1--patient-registration-apis)
3. [Module 2 — OPD Queue Management APIs](#3-module-2--opd-queue-management-apis)
4. [Module 3 — Vital Signs & Triage Intake APIs](#4-module-3--vital-signs--triage-intake-apis)
5. [Module 4 — Doctor Consultation & Encounters APIs](#5-module-4--doctor-consultation--encounters-apis)
6. [Module 5 — E-Prescription & Pharmacy APIs](#6-module-5--e-prescription--pharmacy-apis)
7. [Module 6 — IPD Admission, Bed Management & Discharge APIs](#7-module-6--ipd-admission-bed-management--discharge-apis)
8. [Module 7 — Pathology / Laboratory APIs](#8-module-7--pathology--laboratory-apis)
9. [Module 8 — Multi-Point Billing & Payments APIs](#9-module-8--multi-point-billing--payments-apis)
10. [Module 9 — CDSS & Clinical Decision Support APIs](#10-module-9--cdss--clinical-decision-support-apis)
11. [Module 10 — Authentication & User Management APIs](#11-module-10--authentication--user-management-apis)
12. [Module 11 — Admin Configuration APIs](#12-module-11--admin-configuration-apis)
13. [Module 12 — Waiting Room Display APIs](#13-module-12--waiting-room-display-apis)
14. [Standard Error Code Reference](#14-standard-error-code-reference)

---

## 1. Global API Conventions & Envelopes

- **Base URL:** `/api/v1`
- **Identifier Strategy:** Public UUID v4 (`public_id`) is used in path parameters (e.g. `/patients/{patient_uuid}`). Sequential domain identifiers (UHID, OPD#, IPD#, Bill#) are searchable via query parameters and returned in payloads.
- **Authentication:** `Authorization: Bearer <jwt_token>` (Required unless explicitly annotated as `Public`).
- **Standard Date/Time Format:** ISO 8601 (`YYYY-MM-DDTHH:MM:SSZ` or `YYYY-MM-DD`).
- **Currency Format:** All amounts returned as JSON numeric floating-point values rounded to 2 decimal places (e.g. `500.00`).

### Standard Success Response Envelope
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "meta": {
    "total": 120,
    "page": 1,
    "limit": 20
  }
}
```

### Standard Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input payload",
    "details": [
      {
        "field": "phone",
        "message": "Phone number must be a valid 10-digit Indian mobile number"
      }
    ]
  }
}
```

---

## 2. Module 1 — Patient Registration APIs

Base Path: `/api/v1/patients`

| Method | Endpoint Path | Summary | Roles Allowed | Success Code |
|:---|:---|:---|:---|:---:|
| `POST` | `/patients` | Register new patient & issue UHID | `RECEPTIONIST`, `ADMIN` | `201 Created` |
| `GET` | `/patients` | Search/list patients (by phone, UHID, name) | `RECEPTIONIST`, `NURSE`, `DOCTOR`, `BILLING_CLERK`, `ADMIN` | `200 OK` |
| `GET` | `/patients/{patient_uuid}` | Get full patient profile & medical history | `RECEPTIONIST`, `NURSE`, `DOCTOR`, `BILLING_CLERK`, `ADMIN` | `200 OK` |
| `PUT` | `/patients/{patient_uuid}` | Update demographics & contact info | `RECEPTIONIST`, `ADMIN` | `200 OK` |
| `GET` | `/patients/{patient_uuid}/allergies` | List patient recorded allergies | `NURSE`, `DOCTOR`, `PHARMACIST`, `ADMIN` | `200 OK` |
| `POST` | `/patients/{patient_uuid}/allergies` | Record new drug/food/environmental allergy | `NURSE`, `DOCTOR` | `201 Created` |
| `DELETE`| `/patients/{patient_uuid}/allergies/{allergy_uuid}` | Remove false/resolved allergy record | `DOCTOR`, `ADMIN` | `200 OK` |

### Endpoint Details: Register Patient
- **Endpoint:** `POST /api/v1/patients`
- **Request Body:**
```json
{
  "first_name": "Ramesh",
  "middle_name": "Kumar",
  "last_name": "Sharma",
  "dob": "1985-06-15",
  "gender": "MALE",
  "blood_group": "B+",
  "phone": "9876543210",
  "alternate_phone": "9876543211",
  "email": "ramesh.sharma@example.com",
  "address_line1": "Flat 402, Shanti Heights",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postal_code": "400001",
  "aadhaar_number": "123456789012",
  "abha_id": "ramesh@abdm",
  "emergency_contact_name": "Sunita Sharma",
  "emergency_contact_relation": "Wife",
  "emergency_contact_phone": "9876543219",
  "referred_by": "Dr. V. K. Gupta"
}
```
- **Response Data (`201 Created`):**
```json
{
  "public_id": "c7a8b3d2-4e5f-4a6b-9c8d-1e2f3a4b5c6d",
  "uhid": "BS-001042",
  "full_name": "Ramesh Kumar Sharma",
  "dob": "1985-06-15",
  "gender": "MALE",
  "blood_group": "B+",
  "phone": "9876543210",
  "created_at": "2026-10-23T10:30:00Z"
}
```

---

## 3. Module 2 — OPD Queue Management APIs

Base Path: `/api/v1/opd` & `/api/v1/queue`

| Method | Endpoint Path | Summary | Roles Allowed | Success Code |
|:---|:---|:---|:---|:---:|
| `POST` | `/opd/visits` | Check-in patient, generate OPD# & issue token | `RECEPTIONIST`, `ADMIN` | `201 Created` |
| `GET` | `/opd/visits` | Filter visits (by date, doctor, status, patient) | `RECEPTIONIST`, `NURSE`, `DOCTOR`, `ADMIN` | `200 OK` |
| `GET` | `/opd/visits/{visit_uuid}` | Get visit details and assigned token | `RECEPTIONIST`, `NURSE`, `DOCTOR`, `ADMIN` | `200 OK` |
| `PATCH`| `/opd/visits/{visit_uuid}/status` | Update visit status (`WAITING`, `CANCELLED`, etc.) | `RECEPTIONIST`, `ADMIN` | `200 OK` |
| `GET` | `/queue/doctors/{doctor_uuid}/live` | Live queue state for a doctor's OPD room | `DOCTOR`, `NURSE`, `RECEPTIONIST`, `ADMIN` | `200 OK` |
| `POST` | `/queue/tokens/{token_uuid}/call` | Doctor calls token into room | `DOCTOR` | `200 OK` |
| `POST` | `/queue/tokens/{token_uuid}/start` | Doctor begins clinical consultation | `DOCTOR` | `200 OK` |
| `POST` | `/queue/tokens/{token_uuid}/complete` | Complete consultation & remove from queue | `DOCTOR` | `200 OK` |
| `POST` | `/queue/tokens/{token_uuid}/skip` | Skip absent patient (move to skipped list) | `DOCTOR` | `200 OK` |

### Endpoint Details: Create OPD Visit
- **Endpoint:** `POST /api/v1/opd/visits`
- **Request Body:**
```json
{
  "patient_uuid": "c7a8b3d2-4e5f-4a6b-9c8d-1e2f3a4b5c6d",
  "doctor_uuid": "d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a",
  "visit_type": "NEW",
  "department": "Cardiology",
  "collect_consultation_fee_now": true,
  "payment_method": "CASH"
}
```
- **Response Data (`201 Created`):**
```json
{
  "visit_uuid": "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
  "opd_number": "OPD-004521",
  "uhid": "BS-001042",
  "patient_name": "Ramesh Kumar Sharma",
  "doctor_name": "Dr. Ananya Roy",
  "token_number": 14,
  "token_status": "WAITING",
  "consultation_fee": 500.00,
  "invoice_number": "INV-OPD-000382",
  "created_at": "2026-10-23T10:35:00Z"
}
```

---

## 4. Module 3 — Vital Signs & Triage Intake APIs

Base Path: `/api/v1/vitals` & `/api/v1/triage`

| Method | Endpoint Path | Summary | Roles Allowed | Success Code |
|:---|:---|:---|:---|:---:|
| `POST` | `/vitals` | Record vitals for OPD visit or IPD admission | `NURSE`, `DOCTOR` | `201 Created` |
| `GET` | `/vitals/patient/{patient_uuid}` | Historical vitals timeline for a patient | `NURSE`, `DOCTOR`, `ADMIN` | `200 OK` |
| `GET` | `/vitals/visit/{visit_uuid}` | Get triage vitals captured for specific OPD visit | `NURSE`, `DOCTOR`, `ADMIN` | `200 OK` |
| `POST` | `/triage/questionnaire` | Submit pre-consultation intake responses | `NURSE`, `DOCTOR` | `201 Created` |
| `GET` | `/triage/questionnaire/{visit_uuid}` | Retrieve intake response & red-flag flags | `NURSE`, `DOCTOR` | `200 OK` |

### Endpoint Details: Record Vitals
- **Endpoint:** `POST /api/v1/vitals`
- **Request Body:**
```json
{
  "patient_uuid": "c7a8b3d2-4e5f-4a6b-9c8d-1e2f3a4b5c6d",
  "opd_visit_uuid": "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
  "temperature_f": 102.4,
  "pulse_bpm": 110,
  "blood_pressure_systolic": 145,
  "blood_pressure_diastolic": 95,
  "respiratory_rate_bpm": 22,
  "spo2_percentage": 94,
  "height_cm": 172.0,
  "weight_kg": 76.5,
  "pain_scale": 4
}
```
- **Response Data (`201 Created`):**
```json
{
  "public_id": "f8a9b0c1-d2e3-4f5a-6b7c-8d9e0f1a2b3c",
  "bmi": 25.9,
  "is_abnormal": true,
  "abnormal_flags": [
    "High Temperature (102.4°F)",
    "Tachycardia (110 bpm)",
    "Stage 2 Hypertension (145/95 mmHg)"
  ],
  "recorded_at": "2026-10-23T10:40:00Z"
}
```

---

## 5. Module 4 — Doctor Consultation & Encounters APIs

Base Path: `/api/v1/consultations`

| Method | Endpoint Path | Summary | Roles Allowed | Success Code |
|:---|:---|:---|:---|:---:|
| `POST` | `/consultations/draft` | Create or autosave draft consultation notes | `DOCTOR` | `200 OK` |
| `GET` | `/consultations/{consultation_uuid}` | Fetch consultation record with SOAP & diagnoses | `DOCTOR`, `ADMIN` | `200 OK` |
| `GET` | `/consultations/visit/{visit_uuid}` | Get consultation linked to an OPD visit | `DOCTOR`, `ADMIN` | `200 OK` |
| `POST` | `/consultations/{consultation_uuid}/diagnoses` | Attach provisional/final ICD-10 diagnosis | `DOCTOR` | `201 Created` |
| `DELETE`| `/consultations/{consultation_uuid}/diagnoses/{id}`| Remove attached diagnosis | `DOCTOR` | `200 OK` |
| `POST` | `/consultations/{consultation_uuid}/sign` | Finalize & digitally sign consultation | `DOCTOR` | `200 OK` |
| `GET` | `/consultations/icd10/search` | Typeahead search ICD-10 codes | `DOCTOR`, `ADMIN` | `200 OK` |
| `GET` | `/consultations/{consultation_uuid}/print-slip` | Get consultation summary slip for printing | `DOCTOR`, `RECEPTIONIST` | `200 OK` |

### Endpoint Details: Sign Consultation
- **Endpoint:** `POST /api/v1/consultations/{consultation_uuid}/sign`
- **Request Body:**
```json
{
  "subjective": "Patient reports worsening high fever, persistent headache, and body aches for 3 days.",
  "objective": "Febrile (102.4F). Chest clear bilaterally. No signs of meningism. Throat mildly congested.",
  "assessment": "Acute Febrile Illness, suspect Viral/Dengue fever.",
  "plan": "Complete Blood Count + Dengue NS1 Antigen. Paracetamol 650mg TDS PRN. Oral rehydration.",
  "follow_up_date": "2026-10-26",
  "follow_up_instructions": "Review with CBC report on Monday or immediately if bleeding/rash develops."
}
```
- **Response Data (`200 OK`):**
```json
{
  "consultation_uuid": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "status": "SIGNED",
  "signed_by_doctor": "Dr. Ananya Roy",
  "signed_at": "2026-10-23T11:00:00Z"
}
```

---

## 6. Module 5 — E-Prescription & Pharmacy APIs

Base Path: `/api/v1/prescriptions` & `/api/v1/pharmacy`

| Method | Endpoint Path | Summary | Roles Allowed | Success Code |
|:---|:---|:---|:---|:---:|
| `POST` | `/prescriptions` | Create e-prescription with multiple drug items | `DOCTOR` | `201 Created` |
| `GET` | `/prescriptions/{rx_uuid}` | Get prescription details & fulfillment status | `DOCTOR`, `PHARMACIST`, `NURSE`, `ADMIN` | `200 OK` |
| `GET` | `/prescriptions/patient/{patient_uuid}` | List all historical prescriptions for patient | `DOCTOR`, `PHARMACIST`, `ADMIN` | `200 OK` |
| `GET` | `/pharmacy/queue` | Pharmacist active queue of unfulfilled Rx orders | `PHARMACIST`, `ADMIN` | `200 OK` |
| `GET` | `/pharmacy/items` | Search formulary drugs with stock levels | `DOCTOR`, `PHARMACIST`, `ADMIN` | `200 OK` |
| `POST` | `/pharmacy/items` | Add new drug to formulary master catalog | `PHARMACIST`, `ADMIN` | `201 Created` |
| `POST` | `/pharmacy/items/{item_uuid}/batches` | Receive stock batch (Batch#, expiry, MRP) | `PHARMACIST`, `ADMIN` | `201 Created` |
| `POST` | `/pharmacy/dispensations` | Dispense meds (full/partial), deduct batch stock & bill | `PHARMACIST` | `201 Created` |
| `GET` | `/pharmacy/dispensations/{disp_uuid}` | Fetch dispensation receipt & batch details | `PHARMACIST`, `BILLING_CLERK`, `ADMIN` | `200 OK` |

### Endpoint Details: Create Prescription
- **Endpoint:** `POST /api/v1/prescriptions`
- **Request Body:**
```json
{
  "patient_uuid": "c7a8b3d2-4e5f-4a6b-9c8d-1e2f3a4b5c6d",
  "consultation_uuid": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "general_instructions": "Drink plenty of warm liquids. Avoid heavy meals.",
  "items": [
    {
      "item_uuid": "9e8d7c6b-5a4f-3e2d-1c0b-a9b8c7d6e5f4",
      "dosage": "650 mg",
      "frequency": "TID",
      "route": "ORAL",
      "duration_days": 5,
      "quantity_prescribed": 15,
      "food_relation": "AFTER_FOOD",
      "special_instructions": "Take if temperature exceeds 100°F"
    },
    {
      "is_off_formulary": true,
      "drug_name_custom": "ORS Sachet",
      "dosage": "1 packet in 1L water",
      "frequency": "PRN",
      "route": "ORAL",
      "duration_days": 3,
      "quantity_prescribed": 6,
      "off_formulary_reason": "Electrolyte replacement formula"
    }
  ]
}
```

---

## 7. Module 6 — IPD Admission, Bed Management & Discharge APIs

Base Path: `/api/v1/ipd`, `/api/v1/wards`, `/api/v1/beds`

| Method | Endpoint Path | Summary | Roles Allowed | Success Code |
|:---|:---|:---|:---|:---:|
| `POST` | `/ipd/admissions` | Admit patient to bed (OPD referral or direct intake) with advance | `RECEPTIONIST`, `ADMIN` | `201 Created` |
| `GET` | `/ipd/admissions/active` | List all currently admitted inpatients with ward/bed details | `RECEPTIONIST`, `NURSE`, `DOCTOR`, `BILLING_CLERK`, `ADMIN` | `200 OK` |
| `GET` | `/ipd/admissions/{admission_uuid}` | Inpatient dossier (stay, bed, MAR, Intake/Output, notes, bill) | `DOCTOR`, `NURSE`, `BILLING_CLERK`, `ADMIN` | `200 OK` |
| `GET` | `/ipd/admissions/{admission_uuid}/consent-form`| Print Admission Consent & Face Sheet (Forms 8 & 9) | `RECEPTIONIST`, `NURSE`, `ADMIN` | `200 OK` |
| `POST` | `/ipd/admissions/{admission_uuid}/assessment` | Doctor logs Admission H&P Note (Form 10) | `DOCTOR` | `201 Created` |
| `GET` | `/ipd/admissions/{admission_uuid}/assessment` | Fetch Doctor Admission H&P Assessment | `DOCTOR`, `NURSE`, `ADMIN` | `200 OK` |
| `POST` | `/ipd/admissions/{admission_uuid}/treatment-orders`| Doctor prescribes Treatment Sheet orders (Form 29 / O2) | `DOCTOR` | `201 Created` |
| `GET` | `/ipd/admissions/{admission_uuid}/treatment-orders`| List active & past treatment orders with MAR status | `DOCTOR`, `NURSE`, `PHARMACIST`, `ADMIN` | `200 OK` |
| `PATCH`| `/ipd/treatment-orders/{order_uuid}/discontinue` | Doctor discontinues treatment order with justification | `DOCTOR` | `200 OK` |
| `POST` | `/ipd/treatment-orders/{order_uuid}/administer` | Nurse logs medication administration or omission (MAR) | `NURSE` | `201 Created` |
| `POST` | `/ipd/admissions/{admission_uuid}/intake-output` | Nurse logs shift Intake & Output chart (Form 61) | `NURSE` | `201 Created` |
| `GET` | `/ipd/admissions/{admission_uuid}/intake-output` | Fetch Intake & Output shift records & fluid balance | `DOCTOR`, `NURSE`, `ADMIN` | `200 OK` |
| `POST` | `/ipd/admissions/{admission_uuid}/transfer-bed`| Transfer patient to new bed (rate auto-adjusts) | `NURSE`, `RECEPTIONIST`, `ADMIN` | `200 OK` |
| `POST` | `/ipd/admissions/{admission_uuid}/daily-notes` | Doctor logs daily rounds clinical progress note | `DOCTOR` | `201 Created` |
| `POST` | `/ipd/admissions/{admission_uuid}/procedures` | Log surgical/clinical procedure & tariff charge | `DOCTOR`, `ADMIN` | `201 Created` |
| `POST` | `/ipd/admissions/{admission_uuid}/discharge-summary`| Author & digitally sign structured discharge summary | `DOCTOR` | `201 Created` |
| `POST` | `/ipd/admissions/{admission_uuid}/discharge` | Complete discharge (releases bed, finalizes bill) | `BILLING_CLERK`, `ADMIN` | `200 OK` |
| `GET` | `/wards` | List wards with floor and occupancy counts | `RECEPTIONIST`, `NURSE`, `DOCTOR`, `ADMIN` | `200 OK` |
| `GET` | `/beds/matrix` | Visual bed occupancy matrix (room type, status) | `RECEPTIONIST`, `NURSE`, `DOCTOR`, `ADMIN` | `200 OK` |
| `PATCH`| `/beds/{bed_uuid}/status` | Update bed state (`AVAILABLE`, `CLEANING`, etc.) | `NURSE`, `RECEPTIONIST`, `ADMIN` | `200 OK` |

### Endpoint Details: Inpatient Admission (Forms 8 & 9)
- **Endpoint:** `POST /api/v1/ipd/admissions`
- **Request Body:**
```json
{
  "patient_uuid": "c7a8b3d2-4e5f-4a6b-9c8d-1e2f3a4b5c6d",
  "attending_doctor_uuid": "d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a",
  "bed_uuid": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
  "admission_source": "OPD_REFERRAL",
  "opd_appointment_uuid": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "admission_type": "ELECTIVE",
  "provisional_diagnosis": "Dengue with severe thrombocytopenia",
  "is_mlc": false,
  "mlc_details": null,
  "guardian_name": "Rameshbhai Patel",
  "guardian_relationship": "Father",
  "guardian_phone": "+919876543210",
  "payment_category": "TPA_INSURANCE",
  "tpa_provider": "Star Health",
  "tpa_policy_number": "SH/2026/8492039",
  "advance_amount": 5000.00,
  "payment_method": "UPI",
  "transaction_reference": "UPI/239049203940"
}
```

---

## 8. Module 7 — Pathology / Laboratory APIs

Base Path: `/api/v1/lab`

| Method | Endpoint Path | Summary | Roles Allowed | Success Code |
|:---|:---|:---|:---|:---:|
| `POST` | `/lab/orders` | Place diagnostic order (OPD or IPD) | `DOCTOR` | `201 Created` |
| `GET` | `/lab/orders` | Filter lab orders (by status, date, patient) | `LAB_TECHNICIAN`, `DOCTOR`, `ADMIN` | `200 OK` |
| `GET` | `/lab/orders/{order_uuid}` | Fetch order details, tests, and collection state | `LAB_TECHNICIAN`, `DOCTOR`, `ADMIN` | `200 OK` |
| `POST` | `/lab/orders/{order_uuid}/collect-sample` | Acknowledge specimen collection (sample type) | `LAB_TECHNICIAN` | `200 OK` |
| `POST` | `/lab/orders/{order_uuid}/results` | Enter parameter values with abnormal auto-flag | `LAB_TECHNICIAN` | `200 OK` |
| `POST` | `/lab/orders/{order_uuid}/verify` | Pathologist/Doctor reviews & signs report | `DOCTOR`, `ADMIN` | `200 OK` |
| `GET` | `/lab/tests` | List lab test catalog with parameter schemas | `DOCTOR`, `LAB_TECHNICIAN`, `ADMIN` | `200 OK` |
| `POST` | `/lab/tests` | Create new lab test & sub-parameters | `ADMIN` | `201 Created` |
| `GET` | `/lab/reports/{order_uuid}/download` | Download compiled lab report PDF | `DOCTOR`, `LAB_TECHNICIAN`, `RECEPTIONIST`, `ADMIN` | `200 OK` |

### Endpoint Details: Enter Lab Results
- **Endpoint:** `POST /api/v1/lab/orders/{order_uuid}/results`
- **Request Body:**
```json
{
  "results": [
    {
      "parameter_code": "HB",
      "result_value": "13.5",
      "remarks": "Normal"
    },
    {
      "parameter_code": "PLT",
      "result_value": "42000",
      "remarks": "Severe Thrombocytopenia"
    },
    {
      "parameter_code": "WBC",
      "result_value": "3800",
      "remarks": "Leukopenia"
    }
  ]
}
```
- **Response Data (`200 OK`):**
```json
{
  "order_uuid": "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
  "status": "IN_ANALYSIS",
  "flagged_abnormal_count": 2,
  "panic_alerts": [
    {
      "parameter": "Platelet Count",
      "value": "42,000 /mcL",
      "threshold": "< 50,000 /mcL (Panic Critical)"
    }
  ]
}
```

---

## 9. Module 8 — Multi-Point Billing & Payments APIs

Base Path: `/api/v1/billing` & `/api/v1/invoices` & `/api/v1/payments`

| Method | Endpoint Path | Summary | Roles Allowed | Success Code |
|:---|:---|:---|:---|:---:|
| `POST` | `/invoices` | Create invoice (OPD, Pharmacy, Lab, IPD) | `BILLING_CLERK`, `RECEPTIONIST`, `PHARMACIST`, `ADMIN` | `201 Created` |
| `GET` | `/invoices` | List invoices (filter by type, status, patient) | `BILLING_CLERK`, `ADMIN` | `200 OK` |
| `GET` | `/invoices/{invoice_uuid}` | Get invoice breakdown (items, tax, payments, balance)| `BILLING_CLERK`, `RECEPTIONIST`, `ADMIN` | `200 OK` |
| `POST` | `/invoices/{invoice_uuid}/payments` | Record manual payment (Cash, UPI, Card) | `BILLING_CLERK`, `RECEPTIONIST`, `PHARMACIST`, `ADMIN` | `201 Created` |
| `POST` | `/invoices/{invoice_uuid}/discount` | Apply authorized discount with reason | `BILLING_CLERK`, `ADMIN` | `200 OK` |
| `GET` | `/billing/ipd/{admission_uuid}/accrued-charges` | Calculate live consolidated IPD charges (10 heads) | `BILLING_CLERK`, `ADMIN` | `200 OK` |
| `POST` | `/billing/ipd/{admission_uuid}/generate-final` | Generate consolidated discharge invoice | `BILLING_CLERK`, `ADMIN` | `201 Created` |
| `GET` | `/tariffs` | List all billable service tariffs | `BILLING_CLERK`, `ADMIN` | `200 OK` |
| `POST` | `/tariffs` | Add or update service tariff | `ADMIN` | `201 Created` |

### Endpoint Details: Live Accrued IPD Charges (10 Charge Heads)
- **Endpoint:** `GET /api/v1/billing/ipd/{admission_uuid}/accrued-charges`
- **Response Data (`200 OK`):**
```json
{
  "ipd_number": "IPD-000512",
  "patient_name": "Ramesh Kumar Sharma",
  "admission_date": "2026-10-20T14:00:00Z",
  "length_of_stay_days": 3,
  "charge_heads": {
    "bed_rent": {
      "days": 3,
      "rate": 1500.00,
      "total": 4500.00
    },
    "doctor_visits": {
      "count": 3,
      "rate": 600.00,
      "total": 1800.00
    },
    "nursing_charges": {
      "total": 900.00
    },
    "procedures": {
      "items": ["IV Cannulation", "Nebulization"],
      "total": 750.00
    },
    "pharmacy_medications": {
      "dispensations_count": 4,
      "total": 2450.00
    },
    "laboratory_investigations": {
      "orders_count": 2,
      "total": 1600.00
    },
    "operation_theatre": { "total": 0.00 },
    "anaesthesia": { "total": 0.00 },
    "oxygen_support": { "total": 0.00 },
    "consumables": { "total": 350.00 }
  },
  "gross_total": 12350.00,
  "advance_paid": 5000.00,
  "estimated_balance_due": 7350.00
}
```

---

## 10. Module 9 — CDSS & Clinical Decision Support APIs

Base Path: `/api/v1/cdss`

| Method | Endpoint Path | Summary | Roles Allowed | Success Code |
|:---|:---|:---|:---|:---:|
| `POST` | `/cdss/check-ddi` | Evaluate drug-drug interactions for Rx items | `DOCTOR` | `200 OK` |
| `POST` | `/cdss/evaluate-vitals` | Check vitals against critical thresholds | `NURSE`, `DOCTOR` | `200 OK` |
| `POST` | `/cdss/evaluate-intake` | Detect red-flag symptom combinations (ACS, Sepsis) | `NURSE`, `DOCTOR` | `200 OK` |
| `POST` | `/cdss/alerts/{alert_uuid}/action` | Log doctor acknowledgment or override with reason | `DOCTOR` | `200 OK` |
| `GET` | `/cdss/rules/ddi` | List active drug interaction rule catalog | `DOCTOR`, `PHARMACIST`, `ADMIN` | `200 OK` |

### Endpoint Details: Drug-Drug Interaction Check
- **Endpoint:** `POST /api/v1/cdss/check-ddi`
- **Request Body:**
```json
{
  "drug_generics": ["Warfarin", "Aspirin", "Paracetamol"]
}
```
- **Response Data (`200 OK`):**
```json
{
  "has_interactions": true,
  "interactions": [
    {
      "drug_a": "Warfarin",
      "drug_b": "Aspirin",
      "severity": "CONTRAINDICATED",
      "clinical_mechanism": "Additive anticoagulant and antiplatelet effect markedly increases major bleeding risk.",
      "management_advice": "Avoid concurrent use unless strictly indicated under continuous INR monitoring."
    }
  ]
}
```

---

## 11. Module 10 — Authentication & User Management APIs

Base Path: `/api/v1/auth` & `/api/v1/users`

| Method | Endpoint Path | Summary | Roles Allowed | Success Code |
|:---|:---|:---|:---|:---:|
| `POST` | `/auth/login` | Authenticate with username & password, returns JWT | `Public` | `200 OK` |
| `POST` | `/auth/refresh` | Refresh access token using refresh token | `Public` | `200 OK` |
| `POST` | `/auth/logout` | Invalidate active user session | Authenticated | `200 OK` |
| `GET` | `/auth/me` | Fetch currently logged-in user profile & permissions | Authenticated | `200 OK` |
| `GET` | `/users` | List hospital staff accounts | `ADMIN` | `200 OK` |
| `POST` | `/users` | Create staff account (assign role) | `ADMIN` | `201 Created` |
| `PUT` | `/users/{user_uuid}` | Update staff profile details | `ADMIN` | `200 OK` |
| `PATCH`| `/users/{user_uuid}/status`| Activate or deactivate staff account | `ADMIN` | `200 OK` |
| `GET` | `/roles` | List available roles & permission sets | `ADMIN` | `200 OK` |
| `GET` | `/audit/logs` | Query system audit trail (filter by user, entity, date) | `ADMIN` | `200 OK` |

---

## 12. Module 11 — Admin Configuration APIs

Base Path: `/api/v1/admin`

| Method | Endpoint Path | Summary | Roles Allowed | Success Code |
|:---|:---|:---|:---|:---:|
| `GET` | `/admin/config` | Get all hospital settings (branding, formats) | `ADMIN` | `200 OK` |
| `PUT` | `/admin/config` | Update hospital configuration keys | `ADMIN` | `200 OK` |
| `GET` | `/admin/sequences` | View current sequence counters (UHID, OPD#, IPD#) | `ADMIN` | `200 OK` |
| `PUT` | `/admin/sequences/{key}` | Update sequence prefix or padding length | `ADMIN` | `200 OK` |
| `GET` | `/admin/doctors` | List doctor profiles with fees and schedule rules | `ADMIN`, `RECEPTIONIST` | `200 OK` |
| `POST` | `/admin/doctors` | Create doctor profile with fees & room assignment | `ADMIN` | `201 Created` |
| `PUT` | `/admin/doctors/{doc_uuid}/schedule` | Set doctor working hours & token limits | `ADMIN` | `200 OK` |

---

## 13. Module 12 — Waiting Room Display APIs

Base Path: `/api/v1/display`

| Method | Endpoint Path | Summary | Roles Allowed | Success Code |
|:---|:---|:---|:---|:---:|
| `GET` | `/display/queue` | Public endpoint for TV display board (privacy-safe)| `Public` | `200 OK` |
| `GET` | `/display/queue/stream` | Server-Sent Events (SSE) stream for live token updates| `Public` | `200 OK` |

### Endpoint Details: Live TV Display Board
- **Endpoint:** `GET /api/v1/display/queue`
- **Authentication:** `Public` (No JWT required)
- **Response Data (`200 OK`):**
```json
{
  "hospital_name": "Bright Solutions Multispeciality Hospital",
  "current_time": "2026-10-23T11:05:00Z",
  "doctors": [
    {
      "doctor_name": "Dr. Ananya Roy",
      "specialization": "Cardiology",
      "room_number": "Room 102",
      "currently_calling_token": 14,
      "waiting_tokens": [15, 16, 17, 18],
      "status": "CONSULTING"
    },
    {
      "doctor_name": "Dr. Rajesh Varma",
      "specialization": "General Medicine",
      "room_number": "Room 105",
      "currently_calling_token": 22,
      "waiting_tokens": [23, 24, 25],
      "status": "CONSULTING"
    }
  ]
}
```
*(Notice: Patient names and demographic identifiers are strictly excluded from display responses for DPDP privacy compliance).*

---

## 14. Standard Error Code Reference

| Error Code | HTTP Status | Meaning |
|:---|:---:|:---|
| `UNAUTHORIZED` | `401` | Missing, expired, or invalid JWT bearer token |
| `FORBIDDEN` | `403` | User role lacks permission for requested endpoint |
| `RESOURCE_NOT_FOUND` | `404` | Entity with specified UUID does not exist |
| `VALIDATION_ERROR` | `422` | Request body or query parameters failed schema validation |
| `CONFLICT` | `409` | Unique constraint violated (e.g. duplicate UHID or phone) |
| `BED_NOT_AVAILABLE` | `409` | Selected bed is already occupied or under maintenance |
| `DRUG_OUT_OF_STOCK` | `409` | Insufficient batch quantity available for dispensation |
| `INSUFFICIENT_PAYMENT`| `400` | Attempting to settle bill with inadequate amount |
| `CANNOT_DISCHARGE` | `400` | Discharge blocked due to pending unsettled balance or missing summary |
| `INTERNAL_ERROR` | `500` | Unhandled server exception |
