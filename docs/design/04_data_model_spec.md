# D4 — Data Model & Schema Specification
## Bright Solutions: Clinical Hospital Operating System

> **Document ID:** D4  
> **Version:** 1.0  
> **Status:** APPROVED ARCHITECTURE SPECIFICATION  
> **Depends On:** [01_PRD.md](file:///home/prem/Desktop/pbt/COS/docs/design/01_PRD.md), [02_feature_spec.md](file:///home/prem/Desktop/pbt/COS/docs/design/02_feature_spec.md), [09_database_schema_ddl.sql](file:///home/prem/Desktop/pbt/COS/docs/design/09_database_schema_ddl.sql), [10_er_diagrams.md](file:///home/prem/Desktop/pbt/COS/docs/design/10_er_diagrams.md), [03_technical_architecture.md](file:///home/prem/Desktop/pbt/COS/docs/design/03_technical_architecture.md)  
> **Prepared By:** Bright Solutions Backend Engineering Team  
> **Last Updated:** October 2026  

---

## Table of Contents

1. [Architectural Conventions & Engineering Standards](#1-architectural-conventions--engineering-standards)
2. [Data Dictionary — Multi-Tenancy, Sequences & Config](#2-data-dictionary--multi-tenancy-sequences--config)
3. [Data Dictionary — Auth, Roles & Users](#3-data-dictionary--auth-roles--users)
4. [Data Dictionary — Patient Demographics & Allergies](#4-data-dictionary--patient-demographics--allergies)
5. [Data Dictionary — Outpatient Queue & Tokens](#5-data-dictionary--outpatient-queue--tokens)
6. [Data Dictionary — Triage & Clinical Intake](#6-data-dictionary--triage--clinical-intake)
7. [Data Dictionary — Consultations & Encounters](#7-data-dictionary--consultations--encounters)
8. [Data Dictionary — Pharmacy Formulary & Dispensation](#8-data-dictionary--pharmacy-formulary--dispensation)
9. [Data Dictionary — IPD Admission, Beds & Stay](#9-data-dictionary--ipd-admission-beds--stay)
10. [Data Dictionary — Pathology & Diagnostics](#10-data-dictionary--pathology--diagnostics)
11. [Data Dictionary — Multi-Point Billing & Payments](#11-data-dictionary--multi-point-billing--payments)
12. [Data Dictionary — CDSS Rules & Alerts Log](#12-data-dictionary--cdss-rules--alerts-log)
13. [Indexing Strategy & High-Throughput Optimization](#13-indexing-strategy--high-throughput-optimization)
14. [Referential Integrity & Delete Policy](#14-referential-integrity--delete-policy)
15. [Alembic Migration & Schema Evolution Framework](#15-alembic-migration--schema-evolution-framework)

---

## 1. Architectural Conventions & Engineering Standards

### 1.1 Engine, Charset & Collation
- **Storage Engine:** `InnoDB` exclusively across all 49 tables (strict ACID transactions, row-level locking, foreign key constraints).
- **Character Set:** `utf8mb4` (allows 4-byte characters, full multilingual patient names in Indian scripts, medical symbols).
- **Collation:** `utf8mb4_unicode_ci` (accurate Unicode collation and case-insensitive searches).

### 1.2 Primary & Foreign Key Conventions
- **Internal Clustered Primary Key:** `id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY` (64-bit integer, sequentially stored in InnoDB B+ trees, maximizing cache locality and query join performance).
- **External Public Identifier:** `public_id CHAR(36) NOT NULL UNIQUE` (UUID v4 string for API routes, preventing sequential record harvesting).
- **Multi-Tenant Scoping:** `hospital_id INT UNSIGNED NOT NULL DEFAULT 1` foreign key referencing `hospitals(id)` on all data tables.

### 1.3 Audit & Lifecycle Columns
- **Timestamps:**
  - `created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`
  - `updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
- **Soft Deletes (Master & Config Tables Only):**
  - `deleted_at DATETIME NULL`
  - `deleted_by BIGINT UNSIGNED NULL`
- **Transaction Records (Strictly Append-Only):**
  - Clinical notes (`consultations`), prescriptions (`prescriptions`), lab orders (`lab_orders`), and invoices (`invoices`) **do not have `deleted_at`**. Lifecycle changes are recorded via explicit ENUM statuses (`CANCELLED`, `VOID`, `AMENDED`) with audit log entries.

### 1.4 Numeric & Monetary Precision
- **Monetary Amounts:** `DECIMAL(12, 2)` representing exact currency in Indian Rupees (INR), supporting up to ₹999,999,999.99 with exact paise precision.
- **Clinical Measurements:**
  - `temperature_f`: `DECIMAL(4, 1)` (e.g. `102.4`)
  - `height_cm`: `DECIMAL(5, 2)` (e.g. `175.50`)
  - `weight_kg`: `DECIMAL(5, 2)` (e.g. `72.30`)
  - `bmi`: `DECIMAL(4, 1)` (e.g. `23.5`)

---

## 2. Data Dictionary — Multi-Tenancy, Sequences & Config

### Table: `hospitals`
Stores hospital tenant profiles.
| Column | Type | Nullable | Default | Constraints / Semantics |
|:---|:---|:---:|:---:|:---|
| `id` | `INT UNSIGNED` | No | AUTO_INCREMENT | Clustered PK |
| `public_id` | `CHAR(36)` | No | — | UUID v4, Unique |
| `hospital_code` | `VARCHAR(20)` | No | — | Short code (e.g. `BSH01`), Unique |
| `name` | `VARCHAR(150)` | No | — | Hospital full trade name |
| `address_line1` | `VARCHAR(255)` | No | — | Street address |
| `city` | `VARCHAR(100)` | No | — | City |
| `state` | `VARCHAR(100)` | No | — | State |
| `postal_code` | `VARCHAR(20)` | No | — | PIN / Postal code |
| `phone` | `VARCHAR(30)` | No | — | Primary telephone |
| `tax_id_gst` | `VARCHAR(50)` | Yes | NULL | GSTIN number for tax invoices |
| `is_active` | `TINYINT(1)` | No | 1 | Boolean operational flag |
| `deleted_at` | `DATETIME` | Yes | NULL | Soft delete timestamp |

### Table: `system_sequences`
Stores monotonic sequence counters with concurrency-safe locking (`SELECT ... FOR UPDATE`).
| Column | Type | Nullable | Default | Constraints / Semantics |
|:---|:---|:---:|:---:|:---|
| `id` | `INT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `hospital_id` | `INT UNSIGNED` | No | 1 | FK `hospitals.id` |
| `sequence_key` | `VARCHAR(50)` | No | — | Sequence identifier (`UHID`, `OPD_NUMBER`, `IPD_NUMBER`, `INVOICE_*`) |
| `prefix` | `VARCHAR(20)` | No | — | Format prefix (e.g. `BS`, `OPD`, `INV-OPD`) |
| `current_value`| `BIGINT UNSIGNED` | No | 0 | Monotonic integer counter |
| `padding_length`| `TINYINT UNSIGNED` | No | 6 | Zero-padding length |
| `reset_frequency`| `ENUM` | No | 'NEVER' | `'NEVER'`, `'DAILY'`, `'YEARLY'` |
| `last_reset_date`| `DATE` | Yes | NULL | Date when counter last reset |
| **Index** | `UNIQUE KEY (hospital_id, sequence_key)` | | | Guarantees single counter row per sequence type |

---

## 3. Data Dictionary — Auth, Roles & Users

### Table: `users`
Hospital staff credentials and system access accounts.
| Column | Type | Nullable | Default | Semantics & Validation Rules |
|:---|:---|:---:|:---:|:---|
| `id` | `BIGINT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `public_id` | `CHAR(36)` | No | — | UUID v4, Unique |
| `hospital_id` | `INT UNSIGNED` | No | 1 | FK `hospitals.id` |
| `username` | `VARCHAR(50)` | No | — | Alphanumeric login handle, Unique |
| `password_hash` | `VARCHAR(255)` | No | — | Argon2id or bcrypt hash |
| `full_name` | `VARCHAR(150)` | No | — | Full legal name |
| `role_id` | `INT UNSIGNED` | No | — | FK `roles.id` |
| `email` | `VARCHAR(100)` | Yes | NULL | Staff email address |
| `phone` | `VARCHAR(30)` | Yes | NULL | Mobile contact number |
| `is_active` | `TINYINT(1)` | No | 1 | 0 = Account disabled |
| `last_login_at`| `DATETIME` | Yes | NULL | Timestamp of last successful auth |
| `deleted_at` | `DATETIME` | Yes | NULL | Soft delete timestamp |

### Table: `doctor_profiles`
Clinical metadata and consultation fees for medical officers.
| Column | Type | Nullable | Default | Semantics & Validation Rules |
|:---|:---|:---:|:---:|:---|
| `id` | `BIGINT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `public_id` | `CHAR(36)` | No | — | UUID v4, Unique |
| `user_id` | `BIGINT UNSIGNED` | No | — | FK `users.id`, Unique 1-to-1 |
| `specialization` | `VARCHAR(100)` | No | — | e.g. 'Cardiology', 'General Medicine' |
| `qualification` | `VARCHAR(100)` | No | — | e.g. 'MBBS, MD' |
| `medical_council_reg_no` | `VARCHAR(100)` | No | — | State Medical Council registration |
| `default_consultation_fee` | `DECIMAL(12, 2)` | No | 500.00 | First-time consultation rate |
| `follow_up_fee` | `DECIMAL(12, 2)` | No | 300.00 | Discounted follow-up rate |
| `follow_up_validity_days` | `INT UNSIGNED` | No | 7 | Days during which follow-up rate applies |
| `assigned_room_number` | `VARCHAR(50)` | Yes | NULL | OPD chamber room number (e.g. 'Room 102') |
| `is_available_for_opd` | `TINYINT(1)` | No | 1 | Whether doctor accepts queue check-ins today |

---

## 4. Data Dictionary — Patient Demographics & Allergies

### Table: `patients`
Master patient index (MPI) records.
| Column | Type | Nullable | Default | Semantics & Validation Rules |
|:---|:---|:---:|:---:|:---|
| `id` | `BIGINT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `public_id` | `CHAR(36)` | No | — | UUID v4, Unique |
| `hospital_id` | `INT UNSIGNED` | No | 1 | FK `hospitals.id` |
| `uhid` | `VARCHAR(30)` | No | — | Unique Hospital Identifier (e.g. `BS-001042`) |
| `first_name` | `VARCHAR(100)` | No | — | Given name |
| `middle_name` | `VARCHAR(100)` | Yes | NULL | Middle name |
| `last_name` | `VARCHAR(100)` | No | — | Family name |
| `dob` | `DATE` | No | — | Date of birth (cannot be future) |
| `gender` | `ENUM` | No | — | `'MALE'`, `'FEMALE'`, `'OTHER'` |
| `blood_group` | `ENUM` | No | 'UNKNOWN' | `'A+'`, `'A-'`, `'B+'`, `'B-'`, `'AB+'`, `'AB-'`, `'O+'`, `'O-'`, `'UNKNOWN'` |
| `phone` | `VARCHAR(20)` | No | — | 10-digit Indian mobile number |
| `aadhaar_hash` | `VARCHAR(64)` | Yes | NULL | SHA-256 hash of Aadhaar (DPDP compliant) |
| `abha_id` | `VARCHAR(100)` | Yes | NULL | ABHA address (e.g. `user@abdm`) |
| `abha_number` | `VARCHAR(20)` | Yes | NULL | 14-digit ABHA national health ID |
| `emergency_contact_phone`| `VARCHAR(20)` | Yes | NULL | Primary emergency contact number |
| `deleted_at` | `DATETIME` | Yes | NULL | Soft delete timestamp |

---

## 5. Data Dictionary — Outpatient Queue & Tokens

### Table: `opd_visits`
Outpatient visit record linking patient to consulting doctor.
| Column | Type | Nullable | Default | Semantics & Validation Rules |
|:---|:---|:---:|:---:|:---|
| `id` | `BIGINT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `public_id` | `CHAR(36)` | No | — | UUID v4, Unique |
| `opd_number` | `VARCHAR(30)` | No | — | Global auto-increment string (e.g. `OPD-004521`), Unique |
| `patient_id` | `BIGINT UNSIGNED` | No | — | FK `patients.id` |
| `doctor_id` | `BIGINT UNSIGNED` | No | — | FK `doctor_profiles.id` |
| `visit_date` | `DATE` | No | — | Date of check-in |
| `visit_type` | `ENUM` | No | 'NEW' | `'NEW'`, `'FOLLOW_UP'`, `'EMERGENCY'` |
| `status` | `ENUM` | No | 'WAITING' | `'WAITING'`, `'ENGAGED'`, `'COMPLETED'`, `'CANCELLED'`, `'NO_SHOW'` |
| `payment_status` | `ENUM` | No | 'PENDING' | `'PENDING'`, `'PAID'`, `'EXEMPT'` |
| `registered_by` | `BIGINT UNSIGNED` | No | — | FK `users.id` (receptionist who checked-in) |

### Table: `queue_tokens`
Real-time token lifecycle tracking for clinic rooms and TV displays.
| Column | Type | Nullable | Default | Semantics & Validation Rules |
|:---|:---|:---:|:---|:---|
| `id` | `BIGINT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `opd_visit_id` | `BIGINT UNSIGNED` | No | — | FK `opd_visits.id`, Unique 1-to-1 |
| `doctor_id` | `BIGINT UNSIGNED` | No | — | FK `doctor_profiles.id` |
| `token_number` | `INT UNSIGNED` | No | — | Daily sequence number for this doctor (1, 2, 3...) |
| `token_date` | `DATE` | No | — | Date token is active |
| `status` | `ENUM` | No | 'WAITING' | `'WAITING'`, `'CALLED'`, `'IN_CONSULTATION'`, `'COMPLETED'`, `'SKIPPED'`, `'CANCELLED'` |
| `called_at` | `DATETIME` | Yes | NULL | Timestamp when doctor called token |
| `consultation_started_at`| `DATETIME` | Yes | NULL | Timestamp when patient entered chamber |
| `completed_at` | `DATETIME` | Yes | NULL | Timestamp when doctor finished encounter |

---

## 6. Data Dictionary — Triage & Clinical Intake

### Table: `vital_signs`
Physiological parameters measured at nursing station or inpatient ward.
| Column | Type | Nullable | Default | Semantics & Validation Rules |
|:---|:---|:---:|:---:|:---|
| `id` | `BIGINT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `patient_id` | `BIGINT UNSIGNED` | No | — | FK `patients.id` |
| `opd_visit_id` | `BIGINT UNSIGNED` | Yes | NULL | FK `opd_visits.id` (if OPD triage) |
| `ipd_admission_id`| `BIGINT UNSIGNED` | Yes | NULL | FK `ipd_admissions.id` (if inpatient) |
| `temperature_f` | `DECIMAL(4, 1)` | Yes | NULL | Temperature in Fahrenheit (e.g. 98.6) |
| `pulse_bpm` | `INT UNSIGNED` | Yes | NULL | Heart rate in beats per minute |
| `blood_pressure_systolic`| `INT UNSIGNED` | Yes | NULL | Systolic BP in mmHg |
| `blood_pressure_diastolic`| `INT UNSIGNED` | Yes | NULL | Diastolic BP in mmHg |
| `respiratory_rate_bpm`| `INT UNSIGNED` | Yes | NULL | Breaths per minute |
| `spo2_percentage` | `INT UNSIGNED` | Yes | NULL | Oxygen saturation percentage (0-100) |
| `bmi` | `DECIMAL(4, 1)` | Yes | NULL | Body Mass Index auto-calculated from ht/wt |
| `is_abnormal` | `TINYINT(1)` | No | 0 | 1 = At least one vital breached safe threshold |
| `abnormal_flags_json` | `JSON` | Yes | NULL | Array of triggered clinical alerts |
| `recorded_by` | `BIGINT UNSIGNED` | No | — | FK `users.id` (Nurse) |

---

## 7. Data Dictionary — Consultations & Encounters

### Table: `consultations`
Structured medical consultation notes recorded by physicians.
| Column | Type | Nullable | Default | Semantics & Validation Rules |
|:---|:---|:---:|:---:|:---|
| `id` | `BIGINT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `public_id` | `CHAR(36)` | No | — | UUID v4, Unique |
| `opd_visit_id` | `BIGINT UNSIGNED` | No | — | FK `opd_visits.id`, Unique 1-to-1 |
| `patient_id` | `BIGINT UNSIGNED` | No | — | FK `patients.id` |
| `doctor_id` | `BIGINT UNSIGNED` | No | — | FK `doctor_profiles.id` |
| `subjective` | `TEXT` | Yes | NULL | Patient complaints and medical narrative |
| `objective` | `TEXT` | Yes | NULL | Physical examination findings |
| `assessment` | `TEXT` | Yes | NULL | Clinical diagnosis and differential thoughts |
| `plan` | `TEXT` | Yes | NULL | Treatment instructions and care plan |
| `follow_up_date`| `DATE` | Yes | NULL | Recommended review date |
| `status` | `ENUM` | No | 'IN_PROGRESS' | `'IN_PROGRESS'`, `'SIGNED'`, `'AMENDED'` |
| `signed_at` | `DATETIME` | Yes | NULL | Timestamp when doctor finalized and signed |
| `signed_by` | `BIGINT UNSIGNED` | Yes | NULL | FK `users.id` |

---

## 8. Data Dictionary — Pharmacy Formulary & Dispensation

### Table: `pharmacy_items`
Formulary master inventory catalog.
| Column | Type | Nullable | Default | Semantics & Validation Rules |
|:---|:---|:---:|:---:|:---|
| `id` | `BIGINT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `public_id` | `CHAR(36)` | No | — | UUID v4, Unique |
| `item_code` | `VARCHAR(50)` | No | — | Internal SKU code, Unique |
| `generic_name` | `VARCHAR(150)` | No | — | Active pharmacological molecule |
| `brand_name` | `VARCHAR(150)` | No | — | Commercial brand name |
| `drug_form` | `ENUM` | No | — | `'TABLET'`, `'CAPSULE'`, `'SYRUP'`, `'INJECTION'`, `'OINTMENT'`, `'DROPS'`, `'INHALER'`, `'OTHER'` |
| `unit_mrp` | `DECIMAL(12, 2)` | No | 0.00 | Maximum Retail Price per unit |
| `current_stock` | `INT UNSIGNED` | No | 0 | Aggregate available units across batches |
| `reorder_level` | `INT UNSIGNED` | No | 50 | Low stock alert threshold |
| `is_narcotic` | `TINYINT(1)` | No | 0 | Schedule X/H drug requiring special audit |
| `is_antibiotic` | `TINYINT(1)` | No | 0 | Antimicrobial stewardship flag |

### Table: `pharmacy_batches`
Physical inventory lot and expiry tracking.
| Column | Type | Nullable | Default | Semantics & Validation Rules |
|:---|:---|:---:|:---:|:---|
| `id` | `BIGINT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `item_id` | `BIGINT UNSIGNED` | No | — | FK `pharmacy_items.id` |
| `batch_number` | `VARCHAR(50)` | No | — | Manufacturer batch number |
| `expiry_date` | `DATE` | No | — | Expiration date |
| `available_quantity`| `INT UNSIGNED` | No | 0 | Un-dispensed units remaining in this lot |
| `unit_sale_price` | `DECIMAL(12, 2)` | No | 0.00 | Sale rate per unit for this batch |
| `is_active` | `TINYINT(1)` | No | 1 | 0 = Expired or recalled |
| **Index** | `UNIQUE KEY (item_id, batch_number)` | | | One record per batch per drug |

---

## 9. Data Dictionary — IPD Admission, Beds & Stay (6-Day IPD Book Integration)

### Table: `ipd_admissions`
Inpatient hospital stay record supporting both OPD referral and direct admission, along with legal/consent flags (Forms 8 & 9).
| Column | Type | Nullable | Default | Semantics & Validation Rules |
|:---|:---|:---:|:---:|:---|
| `id` | `BIGINT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `public_id` | `CHAR(36)` | No | — | UUID v4, Unique |
| `hospital_id` | `INT UNSIGNED` | No | 1 | Multi-tenant hospital ID |
| `ipd_number` | `VARCHAR(30)` | No | — | Global auto-increment string (e.g. `IPD-000512`), Unique |
| `patient_id` | `BIGINT UNSIGNED` | No | — | FK `patients.id` |
| `attending_doctor_id`| `BIGINT UNSIGNED` | No | — | FK `doctor_profiles.id` |
| `current_bed_id`| `BIGINT UNSIGNED` | No | — | FK `beds.id` |
| `opd_appointment_id`| `BIGINT UNSIGNED` | Yes | NULL | FK `opd_appointments.id` (source token if OPD referral) |
| `admission_source`| `ENUM` | No | 'OPD_REFERRAL' | `'OPD_REFERRAL'`, `'EMERGENCY_DIRECT'`, `'SCHEDULED_TRANSFER'` |
| `admission_date`| `DATETIME` | No | CURRENT_TIMESTAMP | Admission timestamp |
| `discharge_date`| `DATETIME` | Yes | NULL | Final discharge completion timestamp |
| `admission_type`| `ENUM` | No | 'ELECTIVE' | `'ELECTIVE'`, `'EMERGENCY'`, `'TRANSFER'` |
| `provisional_diagnosis`| `TEXT` | No | — | Initial diagnosis at admission |
| `is_mlc` | `BOOLEAN` | No | FALSE | Medico-Legal Case flag (Forms 8 & 9) |
| `mlc_details` | `VARCHAR(255)` | Yes | NULL | Police station / MLC report details |
| `guardian_name` | `VARCHAR(150)` | Yes | NULL | Next of Kin / Guardian for Admission Consent (Forms 8 & 9) |
| `guardian_relationship`| `VARCHAR(50)` | Yes | NULL | Father, Mother, Spouse, Son, Daughter, Other |
| `guardian_phone`| `VARCHAR(20)` | Yes | NULL | Emergency contact telephone number |
| `payment_category`| `ENUM` | No | 'SELF_PAY_CASH'| `'SELF_PAY_CASH'`, `'TPA_INSURANCE'`, `'CORPORATE_PANEL'`, `'AYUSHMAN_BHARAT'` |
| `tpa_provider` | `VARCHAR(100)` | Yes | NULL | TPA company name (e.g. Medi Assist, Star Health) |
| `tpa_policy_number`| `VARCHAR(100)` | Yes | NULL | Insurance card / policy reference |
| `advance_amount_paid`| `DECIMAL(12, 2)`| No | 0.00 | Financial deposit collected at intake |
| `status` | `ENUM` | No | 'ADMITTED' | `'ADMITTED'`, `'DISCHARGED'`, `'LAMA'`, `'DECEASED'`, `'TRANSFERRED'` |
| `discharge_type` | `ENUM` | Yes | NULL | `'NORMAL'`, `'AGAINST_MEDICAL_ADVICE'`, `'REFERRED'`, `'EXPIRED'` |

### Table: `ipd_bed_allocations`
Historical stay and transfer ledger (calculates split-rate bed rent accurately).
| Column | Type | Nullable | Default | Semantics & Validation Rules |
|:---|:---|:---:|:---:|:---|
| `id` | `BIGINT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `admission_id` | `BIGINT UNSIGNED` | No | — | FK `ipd_admissions.id` |
| `bed_id` | `BIGINT UNSIGNED` | No | — | FK `beds.id` |
| `allocated_at` | `DATETIME` | No | CURRENT_TIMESTAMP | Bed assignment timestamp |
| `released_at` | `DATETIME` | Yes | NULL | Transfer or discharge timestamp |
| `daily_rate` | `DECIMAL(12, 2)` | No | — | Locked daily room tariff at time of stay |
| `transfer_reason`| `VARCHAR(255)` | Yes | NULL | Clinical justification for bed change |

### Table: `ipd_admission_assessments` (Form 10)
Inpatient Doctor H&P Assessment filled by the Medical Officer / Attending Consultant upon admission.
| Column | Type | Nullable | Default | Semantics & Validation Rules |
|:---|:---|:---:|:---:|:---|
| `id` | `BIGINT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `public_id` | `CHAR(36)` | No | — | UUID v4, Unique |
| `admission_id` | `BIGINT UNSIGNED` | No | — | FK `ipd_admissions.id`, Unique per admission |
| `doctor_id` | `BIGINT UNSIGNED` | No | — | FK `doctor_profiles.id` |
| `chief_complaints` | `TEXT` | No | — | Presenting symptoms and duration |
| `history_of_present_illness` | `TEXT` | No | — | Detailed clinical narrative |
| `past_medical_surgical_history`| `TEXT` | Yes | NULL | Known comorbidities, prior surgeries |
| `current_home_medications` | `TEXT` | Yes | NULL | Home medications reconciled |
| `physical_examination_notes` | `TEXT` | No | — | General physical exam findings |
| `systemic_examination_notes` | `TEXT` | Yes | NULL | CVS, RS, PA, CNS findings |
| `provisional_diagnosis` | `TEXT` | No | — | Working diagnostic hypothesis |
| `planned_interventions` | `TEXT` | Yes | NULL | Medical / surgical treatment strategy |

### Table: `ipd_treatment_orders` (Form 29)
Doctor Treatment Sheet orders for medications, oxygen therapy, and dietary instructions.
| Column | Type | Nullable | Default | Semantics & Validation Rules |
|:---|:---|:---:|:---:|:---|
| `id` | `BIGINT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `public_id` | `CHAR(36)` | No | — | UUID v4, Unique |
| `admission_id` | `BIGINT UNSIGNED` | No | — | FK `ipd_admissions.id` |
| `doctor_id` | `BIGINT UNSIGNED` | No | — | FK `doctor_profiles.id` |
| `order_datetime` | `DATETIME` | No | CURRENT_TIMESTAMP | When doctor signed the order |
| `order_type` | `ENUM` | No | 'MEDICATION' | `'MEDICATION'`, `'O2_THERAPY'`, `'DIET'`, `'SPECIAL_INSTRUCTION'` |
| `drug_name` | `VARCHAR(200)` | Yes | NULL | Drug generic or brand name |
| `dosage` | `VARCHAR(100)` | Yes | NULL | e.g. 500mg, 1gm |
| `route` | `ENUM` | Yes | NULL | `'ORAL'`, `'IV'`, `'IM'`, `'SC'`, `'TOPICAL'`, `'INHALATION'`, `'PR'`, `'SL'`, `'OTHER'` |
| `frequency` | `VARCHAR(50)` | Yes | NULL | `Stat`, `OD`, `BD`, `TDS`, `QID`, `SOS`, `Q4H`, `Q6H` |
| `o2_device` | `ENUM` | Yes | NULL | `'NASAL_PRONGS'`, `'FACE_MASK'`, `'NRBM'`, `'VENTURI'`, `'HFNC'`, `'BIPAP'`, `'NONE'` |
| `o2_flow_rate_lpm`| `DECIMAL(4, 1)` | Yes | NULL | Oxygen flow in Litres per minute (Form 29) |
| `instructions` | `TEXT` | Yes | NULL | Administration directions or dietary rules |
| `start_time` | `DATETIME` | No | CURRENT_TIMESTAMP | Order commencement datetime |
| `stop_time` | `DATETIME` | Yes | NULL | Order termination datetime |
| `status` | `ENUM` | No | 'ACTIVE' | `'ACTIVE'`, `'COMPLETED'`, `'DISCONTINUED'` |
| `discontinued_by` | `BIGINT UNSIGNED` | Yes | NULL | FK `users.id` |
| `discontinued_reason`| `VARCHAR(255)` | Yes | NULL | Doctor's justification for stopping order |

### Table: `ipd_treatment_administrations` (Form 29 MAR)
Nurse Medication Administration Record logging execution or omission of doctor treatment orders.
| Column | Type | Nullable | Default | Semantics & Validation Rules |
|:---|:---|:---:|:---:|:---|
| `id` | `BIGINT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `treatment_order_id`| `BIGINT UNSIGNED` | No | — | FK `ipd_treatment_orders.id` |
| `admission_id` | `BIGINT UNSIGNED` | No | — | FK `ipd_admissions.id` |
| `nurse_id` | `BIGINT UNSIGNED` | No | — | FK `users.id` |
| `scheduled_time` | `DATETIME` | No | — | Scheduled administration slot |
| `administered_time`| `DATETIME` | Yes | NULL | Actual time nurse gave medication |
| `status` | `ENUM` | No | 'GIVEN' | `'GIVEN'`, `'OMITTED'`, `'REFUSED'`, `'HELD_DOCTOR_ORDER'` |
| `omitted_reason` | `VARCHAR(255)` | Yes | NULL | Clinical justification if omitted |
| `notes` | `VARCHAR(255)` | Yes | NULL | Site of injection or patient tolerance |

### Table: `ipd_intake_output` (Form 61)
Shift-wise Intake and Output Chart recording fluid balance.
| Column | Type | Nullable | Default | Semantics & Validation Rules |
|:---|:---|:---:|:---:|:---|
| `id` | `BIGINT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `public_id` | `CHAR(36)` | No | — | UUID v4, Unique |
| `admission_id` | `BIGINT UNSIGNED` | No | — | FK `ipd_admissions.id` |
| `nurse_id` | `BIGINT UNSIGNED` | No | — | FK `users.id` |
| `record_datetime` | `DATETIME` | No | CURRENT_TIMESTAMP | Timestamp of chart entry |
| `shift` | `ENUM` | No | — | `'MORNING'`, `'EVENING'`, `'NIGHT'` |
| `oral_rt_intake_ml`| `INT UNSIGNED` | No | 0 | Oral or Ryles tube intake volume |
| `iv_fluid_type` | `VARCHAR(100)` | Yes | NULL | NS, RL, DNS, D5, Albumin, etc. |
| `iv_fluid_intake_ml`| `INT UNSIGNED` | No | 0 | Intravenous infusion volume in ml |
| `blood_products_ml`| `INT UNSIGNED` | No | 0 | Blood / PRBC / FFP volume in ml |
| `urine_output_ml` | `INT UNSIGNED` | No | 0 | Urinary excretion volume in ml |
| `vomitus_rt_aspirate_ml`| `INT UNSIGNED` | No | 0 | Vomitus or RT aspiration volume in ml |
| `stool_count` | `INT UNSIGNED` | No | 0 | Number of bowel movements |
| `drain_output_ml` | `INT UNSIGNED` | No | 0 | Surgical drain discharge in ml |
| `net_balance_ml` | `INT` | No | 0 | Signed fluid balance (`total_intake - total_output`) |
| `remarks` | `VARCHAR(255)` | Yes | NULL | Nurse clinical observation |

---

## 10. Data Dictionary — Pathology & Diagnostics

### Table: `lab_tests`
Diagnostic test master catalog.
| Column | Type | Nullable | Default | Semantics & Validation Rules |
|:---|:---|:---:|:---:|:---|
| `id` | `BIGINT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `public_id` | `CHAR(36)` | No | — | UUID v4, Unique |
| `category_id` | `INT UNSIGNED` | No | — | FK `lab_categories.id` |
| `test_code` | `VARCHAR(50)` | No | — | Unique test identifier (e.g. `CBC`, `LFT`) |
| `test_name` | `VARCHAR(150)` | No | — | Descriptive test name |
| `sample_type` | `ENUM` | No | — | `'EDTA_BLOOD'`, `'SERUM'`, `'PLASMA'`, `'URINE'`, `'STOOL'`, `'CSF'`, `'SWAB'`, `'SPUTUM'`, `'OTHER'` |
| `turnaround_time_hours`| `INT UNSIGNED` | No | 24 | Estimated processing duration |
| `standard_price`| `DECIMAL(12, 2)` | No | 0.00 | Default billable tariff |

### Table: `lab_test_parameters`
Granular measurable components of a lab panel (e.g. Hemoglobin, Platelets for CBC).
| Column | Type | Nullable | Default | Semantics & Validation Rules |
|:---|:---|:---:|:---:|:---|
| `id` | `BIGINT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `test_id` | `BIGINT UNSIGNED` | No | — | FK `lab_tests.id` |
| `parameter_code`| `VARCHAR(50)` | No | — | Code within test panel (e.g. `HB`, `PLT`) |
| `parameter_name`| `VARCHAR(150)` | No | — | Component name (e.g. 'Hemoglobin') |
| `unit` | `VARCHAR(30)` | Yes | NULL | Unit of measure (e.g. `g/dL`, `/mcL`) |
| `data_type` | `ENUM` | No | 'NUMERIC' | `'NUMERIC'`, `'TEXT'`, `'OPTIONS'` |
| `default_min` | `DECIMAL(10, 3)` | Yes | NULL | Lower reference boundary |
| `default_max` | `DECIMAL(10, 3)` | Yes | NULL | Upper reference boundary |
| `panic_min` | `DECIMAL(10, 3)` | Yes | NULL | Critical lower panic alert limit |
| `panic_max` | `DECIMAL(10, 3)` | Yes | NULL | Critical upper panic alert limit |
| **Index** | `UNIQUE KEY (test_id, parameter_code)` | | | Unique component code per test |

---

## 11. Data Dictionary — Multi-Point Billing & Payments

### Table: `invoices`
Consolidated financial invoice ledger servicing all hospital billing points.
| Column | Type | Nullable | Default | Semantics & Validation Rules |
|:---|:---|:---:|:---:|:---|
| `id` | `BIGINT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `public_id` | `CHAR(36)` | No | — | UUID v4, Unique |
| `invoice_number`| `VARCHAR(30)` | No | — | Sequence string (e.g. `INV-OPD-000382`), Unique |
| `patient_id` | `BIGINT UNSIGNED` | No | — | FK `patients.id` |
| `opd_visit_id` | `BIGINT UNSIGNED` | Yes | NULL | FK `opd_visits.id` (if OPD consultation) |
| `ipd_admission_id`| `BIGINT UNSIGNED`| Yes | NULL | FK `ipd_admissions.id` (if IPD stay) |
| `invoice_type` | `ENUM` | No | — | `'OPD_CONSULTATION'`, `'PHARMACY'`, `'LAB'`, `'IPD_FINAL'` |
| `status` | `ENUM` | No | 'UNPAID' | `'DRAFT'`, `'UNPAID'`, `'PARTIALLY_PAID'`, `'PAID'`, `'CANCELLED'`, `'REFUNDED'` |
| `subtotal_amount`| `DECIMAL(12, 2)`| No | 0.00 | Gross item sum before discounts/taxes |
| `discount_amount`| `DECIMAL(12, 2)`| No | 0.00 | Total concession applied |
| `tax_amount` | `DECIMAL(12, 2)`| No | 0.00 | GST or applicable healthcare tax |
| `net_amount` | `DECIMAL(12, 2)`| No | 0.00 | `subtotal - discount + tax` |
| `paid_amount` | `DECIMAL(12, 2)`| No | 0.00 | Total settled via payments table |
| `balance_amount`| `DECIMAL(12, 2)`| No | 0.00 | Unpaid balance (`net_amount - paid_amount`) |
| `created_by` | `BIGINT UNSIGNED` | No | — | FK `users.id` (Billing Clerk or Cashier) |

### Table: `payments`
Immutable transaction ledger for collected funds.
| Column | Type | Nullable | Default | Semantics & Validation Rules |
|:---|:---|:---:|:---:|:---|
| `id` | `BIGINT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `public_id` | `CHAR(36)` | No | — | UUID v4, Unique |
| `payment_number`| `VARCHAR(30)` | No | — | Sequence string (e.g. `RCP-001042`), Unique |
| `invoice_id` | `BIGINT UNSIGNED` | No | — | FK `invoices.id` |
| `patient_id` | `BIGINT UNSIGNED` | No | — | FK `patients.id` |
| `amount` | `DECIMAL(12, 2)`| No | — | Amount paid in this transaction |
| `payment_method`| `ENUM` | No | 'CASH' | `'CASH'`, `'UPI'`, `'CARD'`, `'NET_BANKING'`, `'CHEQUE'` |
| `transaction_reference`| `VARCHAR(100)`| Yes | NULL | UPI UTR, Card Auth Code, or Cheque number |
| `received_by` | `BIGINT UNSIGNED` | No | — | FK `users.id` (Cashier) |
| `payment_date` | `DATETIME` | No | CURRENT_TIMESTAMP | Financial transaction timestamp |

---

## 12. Data Dictionary — CDSS Rules & Alerts Log

### Table: `cdss_ddi_rules`
Known drug interaction rule base.
| Column | Type | Nullable | Default | Semantics & Validation Rules |
|:---|:---|:---:|:---:|:---|
| `id` | `BIGINT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `drug_a_generic`| `VARCHAR(150)` | No | — | Molecule A (e.g. 'Warfarin') |
| `drug_b_generic`| `VARCHAR(150)` | No | — | Molecule B (e.g. 'Aspirin') |
| `severity` | `ENUM` | No | — | `'CONTRAINDICATED'`, `'MAJOR'`, `'MODERATE'`, `'MINOR'` |
| `clinical_mechanism`| `TEXT` | No | — | Medical justification of danger |
| `management_advice`| `TEXT` | No | — | Clinical mitigation steps |
| `is_active` | `TINYINT(1)` | No | 1 | Rule active switch |

### Table: `cdss_alerts_log`
Immutable medico-legal record of triggered alerts and doctor override decisions.
| Column | Type | Nullable | Default | Semantics & Validation Rules |
|:---|:---|:---:|:---:|:---|
| `id` | `BIGINT UNSIGNED` | No | AUTO_INCREMENT | PK |
| `patient_id` | `BIGINT UNSIGNED` | No | — | FK `patients.id` |
| `doctor_id` | `BIGINT UNSIGNED` | No | — | FK `doctor_profiles.id` |
| `consultation_id`| `BIGINT UNSIGNED`| Yes | NULL | FK `consultations.id` |
| `rule_type` | `ENUM` | No | — | `'DDI'`, `'VITALS'`, `'CLINICAL_COMBO'`, `'ALLERGY'` |
| `severity` | `ENUM` | No | — | `'INFO'`, `'WARNING'`, `'CRITICAL'`, `'CONTRAINDICATED'` |
| `alert_title` | `VARCHAR(150)` | No | — | Header shown to physician |
| `alert_text` | `TEXT` | No | — | Full clinical warning text |
| `doctor_action` | `ENUM` | No | 'ACKNOWLEDGED' | `'ACKNOWLEDGED'`, `'OVERRIDDEN'`, `'IGNORED'` |
| `override_reason`| `VARCHAR(255)` | Yes | NULL | Mandatory doctor justification if overridden |

---

## 13. Indexing Strategy & High-Throughput Optimization

### 13.1 Leftmost Prefix Rule on Composite Indexes

| Table | Index Name | Columns | Rationale & Query Accelerated |
|:---|:---|:---|:---|
| `queue_tokens` | `idx_tokens_display` | `(doctor_id, token_date, status)` | Powers the live TV display board query. Filtering by doctor and today's date with active status covers 100% of TV stream reads. |
| `patients` | `idx_patients_name` | `(last_name, first_name)` | Enables B-tree index range scans for patient directory searches. |
| `opd_visits` | `idx_opd_doctor_date` | `(doctor_id, visit_date)` | Accelerates doctor chamber active OPD queue rendering. |
| `invoices` | `idx_inv_patient` | `(patient_id, status)` | Speeds up unbilled/unpaid invoice lookups for patient checkout. |
| `cdss_ddi_rules`| `idx_ddi_drugs` | `(drug_a_generic, drug_b_generic)` | Accelerates bilateral drug-pair collision checking in e-prescribing. |

### 13.2 Full-Text Search Indexes
- `icd10_codes`: `FULLTEXT KEY ft_icd10_desc (description)` enables sub-millisecond medical diagnosis search across thousands of ICD-10 records.

---

## 14. Referential Integrity & Delete Policy

| Relationship | Child Table | Foreign Key Column | Parent Table | Delete Rule | Rationale |
|:---|:---|:---|:---|:---:|:---|
| **Owns Items** | `invoice_items` | `invoice_id` | `invoices` | `CASCADE` | Items cannot exist without invoice header. |
| **Owns Items** | `prescription_items`| `prescription_id` | `prescriptions` | `CASCADE` | Medication items belong strictly to the prescription. |
| **Owns Results** | `lab_order_results` | `order_item_id` | `lab_order_items` | `CASCADE` | Result parameters belong strictly to ordered test. |
| **Master Entity**| `opd_visits` | `patient_id` | `patients` | `RESTRICT` | Patient cannot be deleted if historical encounters exist. |
| **Master Entity**| `consultations` | `doctor_id` | `doctor_profiles` | `RESTRICT` | Doctor profile cannot be deleted if signed notes exist. |
| **Inventory** | `prescription_items`| `item_id` | `pharmacy_items` | `RESTRICT` | Drug cannot be deleted if referenced in patient prescriptions. |
| **Optional Link**| `vital_signs` | `opd_visit_id` | `opd_visits` | `SET NULL` | Vitals belong to patient medical history even if visit cancelled. |

---

## 15. Alembic Migration & Schema Evolution Framework

Bright Solutions manages schema changes using **Alembic** tied to our SQLAlchemy metadata.

### Directory Structure
```
backend/
├── alembic/
│   ├── env.py                  # Pulls Base.metadata and settings.DATABASE_URL
│   ├── script.py.mako          # Migration template
│   └── versions/               # Sequential migration scripts
│       ├── 0001_initial_schema.py
│       └── ...
└── alembic.ini
```

### Execution Commands
```bash
# Generate new migration from SQLAlchemy model changes
alembic revision --autogenerate -m "Add column x to table y"

# Apply pending migrations to database
alembic upgrade head

# Rollback last migration
alembic downgrade -1
```
