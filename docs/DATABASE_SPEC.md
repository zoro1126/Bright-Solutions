# ClinicOS — Database Specification (MySQL 8.0)

**Product**: ClinicOS (General OPD Clinic Management & Decision Support System)  
**Database Engine**: MySQL 8.0 (InnoDB Storage Engine)  
**Default Character Set**: `utf8mb4`  
**Collation**: `utf8mb4_unicode_ci`  
**Document Format**: Markdown (Tables & Text Specifications — Zero Mermaid Diagrams)

---

## 1. System Architecture & Relational Topology

The ClinicOS database schema is designed to model the complete lifecycle of a General Outpatient Department (OPD) clinic encounter: from front-desk patient intake and vitals triage, to physician decision support, external diagnostic review, e-prescribing, itemized billing, and payment reconciliation.

### Relational Entity Overview (ASCII Text Map)

```
[ users ] (Staff accounts: RECEPTIONIST, DOCTOR, CASHIER)
    |
    +---< [ visits ] (Encounter Header & Token Queue)
    |         |
    |         +---(1:1)--- [ vital_signs ] (BP, Pulse, Temp, SpO2, BMI)
    |         |
    |         +---(1:0..1) [ intake_questionnaires ] (Voice transcript, symptoms, allergies)
    |         |
    |         +---(1:N)--- [ external_reports ] (DICOM scans, ECG traces, Lab PDFs)
    |         |
    |         +---(1:N)--- [ deterministic_insights ] (Clinical safety rule flags & overrides)
    |         |
    |         +---(1:0..1) [ prescriptions ] (E-Prescription Header & Conclusion)
    |         |                 |
    |         |                 +---(1:N)--- [ prescription_items ]
    |         |                                    |
    |         |     [ drug_formulary ] -----------+ (Approved clinic drug catalog)
    |         |
    |         +---(1:1)--- [ bills ] (Itemized Invoice Header & Insurance Claim)
    |                           |
    |                           +---(1:N)--- [ bill_items ] (Consultation, Scans, Pharmacy lines)
    |                           |
    |                           +---(1:N)--- [ payments ] (Tender ledger: Cash, UPI, Card)
    |
[ patients ] (Demographics & Master UHID Directory)
    |
    +---< [ visits ]
    +---< [ external_reports ]
```

---

## 2. Global Conventions & Standards

| Parameter | Standard / Convention | Rationale |
| :--- | :--- | :--- |
| **Primary Keys** | `id INT AUTO_INCREMENT` | Compact integer primary key; high indexing performance in InnoDB B+Trees. |
| **Identifiers** | Human-readable unique codes (`UHID-YYYY-XXXXX`, `Q-104`, `REC-YYYY-XXXX`) | Auditability and patient-facing clarity. |
| **Character Encoding** | `utf8mb4` | Full multilingual support (names, clinical symbols, transcripts). |
| **Timestamps** | `DATETIME` with `DEFAULT CURRENT_TIMESTAMP` | Timezone-resilient logging of clinic interactions. |
| **Monetary Values** | `DECIMAL(10, 2)` | Precision accounting; zero floating-point rounding errors for tariffs and copays. |
| **Enums** | Explicit MySQL `ENUM(...)` types | Strict integrity constraints on roles, visit stages, payment modes. |

---

## 3. Data Dictionary & Table Specifications

---

### Table 1: `users`
**Purpose**: System user directory storing clinic staff credentials, roles, and authorization levels.

| Column | Data Type | Nullable | Default | Key | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT` | NO | — | **PK** | Internal unique user ID |
| `username` | `VARCHAR(50)` | NO | — | **UQ** | Login identifier (e.g. `receptionist_anita`) |
| `password_hash` | `VARCHAR(255)` | NO | — | — | Bcrypt / Argon2 salted password hash |
| `full_name` | `VARCHAR(100)` | NO | — | — | Professional name (e.g. `Dr. Vikram Kulkarni, MD`) |
| `role` | `ENUM('RECEPTIONIST', 'DOCTOR', 'CASHIER', 'ADMIN')` | NO | — | — | Access control role |
| `email` | `VARCHAR(100)` | YES | NULL | — | Contact email address |
| `phone` | `VARCHAR(20)` | YES | NULL | — | Contact mobile number |
| `is_active` | `TINYINT(1)` | NO | `1` | — | Account status flag (`1` = Active, `0` = Disabled) |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Account creation timestamp |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Last update timestamp (`ON UPDATE CURRENT_TIMESTAMP`) |

- **Indexes**: `UNIQUE KEY uq_users_username (username)`, `INDEX idx_users_role (role)`.

---

### Table 2: `patients`
**Purpose**: Master patient index storing demographic details and unique health identification numbers (UHID).

| Column | Data Type | Nullable | Default | Key | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT` | NO | — | **PK** | Internal unique patient ID |
| `uhid` | `VARCHAR(30)` | NO | — | **UQ** | Unique Health Identifier (e.g. `UHID-2026-00104`) |
| `first_name` | `VARCHAR(50)` | NO | — | — | Given name |
| `last_name` | `VARCHAR(50)` | NO | — | — | Surname / Family name |
| `dob` | `DATE` | NO | — | — | Date of birth (used for age calculation) |
| `gender` | `ENUM('MALE', 'FEMALE', 'OTHER')` | NO | — | — | Biological gender |
| `blood_group` | `ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN')` | NO | `'UNKNOWN'` | — | Blood group |
| `phone` | `VARCHAR(20)` | NO | — | — | Primary contact number |
| `email` | `VARCHAR(100)` | YES | NULL | — | Patient email address |
| `address` | `TEXT` | YES | NULL | — | Residential address |
| `emergency_contact` | `VARCHAR(100)` | YES | NULL | — | Emergency contact person name & phone |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Registration timestamp |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Record update timestamp (`ON UPDATE CURRENT_TIMESTAMP`) |

- **Indexes**: `UNIQUE KEY uq_patients_uhid (uhid)`, `INDEX idx_patients_phone (phone)`, `INDEX idx_patients_name (last_name, first_name)`.

---

### Table 3: `visits`
**Purpose**: Central clinical encounter header tracking OPD queue tokens, consultation status, and attending staff.

| Column | Data Type | Nullable | Default | Key | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT` | NO | — | **PK** | Internal unique visit encounter ID |
| `patient_id` | `INT` | NO | — | **FK** | Foreign key to `patients(id)` |
| `doctor_id` | `INT` | NO | — | **FK** | Foreign key to `users(id)` (Attending Physician) |
| `receptionist_id` | `INT` | NO | — | **FK** | Foreign key to `users(id)` (Front Desk Staff) |
| `visit_date` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Encounter check-in timestamp |
| `queue_token` | `VARCHAR(20)` | NO | — | — | Queue token allocation (e.g. `Q-104`) |
| `status` | `ENUM('REGISTERED', 'TRIAGED', 'IN_CONSULTATION', 'READY_FOR_BILLING', 'COMPLETED', 'CANCELLED')` | NO | `'REGISTERED'` | — | Active workflow state |
| `chief_complaint` | `TEXT` | YES | NULL | — | Primary reason for visit recorded at front desk |
| `conclusion_notes` | `TEXT` | YES | NULL | — | Attending physician's diagnosis and conclusion |
| `conclusion_signed_at` | `DATETIME` | YES | NULL | — | Timestamp when doctor electronically signed conclusion |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Record creation timestamp |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Record update timestamp (`ON UPDATE CURRENT_TIMESTAMP`) |

- **Foreign Keys**:
  - `fk_visits_patient`: `FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT ON UPDATE CASCADE`
  - `fk_visits_doctor`: `FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE`
  - `fk_visits_receptionist`: `FOREIGN KEY (receptionist_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE`
- **Indexes**: `INDEX idx_visits_patient (patient_id)`, `INDEX idx_visits_doctor (doctor_id)`, `INDEX idx_visits_status (status)`, `INDEX idx_visits_date (visit_date)`.

---

### Table 4: `vital_signs`
**Purpose**: Stores objective clinical biometric measurements recorded during reception triage.

| Column | Data Type | Nullable | Default | Key | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT` | NO | — | **PK** | Unique vital signs entry ID |
| `visit_id` | `INT` | NO | — | **FK, UQ** | Foreign key to `visits(id)` (1:1 with visit) |
| `systolic_bp` | `INT` | YES | NULL | — | Systolic blood pressure (mmHg, e.g. `120`) |
| `diastolic_bp` | `INT` | YES | NULL | — | Diastolic blood pressure (mmHg, e.g. `80`) |
| `pulse_rate` | `INT` | YES | NULL | — | Heart pulse rate (beats per minute) |
| `temperature_f` | `DECIMAL(4, 1)` | YES | NULL | — | Body temperature in Fahrenheit (e.g. `98.6`) |
| `resp_rate` | `INT` | YES | NULL | — | Respiratory rate (breaths per minute) |
| `spo2_pct` | `INT` | YES | NULL | — | Blood oxygen saturation percentage (e.g. `98`) |
| `weight_kg` | `DECIMAL(5, 2)` | YES | NULL | — | Patient body weight in kilograms (e.g. `72.50`) |
| `height_cm` | `DECIMAL(5, 2)` | YES | NULL | — | Patient standing height in centimeters (e.g. `175.00`) |
| `bmi` | `DECIMAL(4, 1)` | YES | NULL | — | Body Mass Index: $\text{kg} / \text{m}^2$ (e.g. `23.7`) |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Recording timestamp |

- **Foreign Keys**: `fk_vitals_visit`: `FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE ON UPDATE CASCADE`.
- **Indexes**: `UNIQUE KEY uq_vitals_visit (visit_id)`.

---

### Table 5: `intake_questionnaires`
**Purpose**: Stores voice speech-to-text transcriptions, onset duration, symptom severity, and screened drug allergies.

| Column | Data Type | Nullable | Default | Key | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT` | NO | — | **PK** | Unique questionnaire entry ID |
| `visit_id` | `INT` | NO | — | **FK, UQ** | Foreign key to `visits(id)` (1:1 with visit) |
| `voice_audio_url` | `VARCHAR(500)` | YES | NULL | — | Storage path / URI to recorded intake audio |
| `transcript_text` | `TEXT` | YES | NULL | — | Speech-to-Text transcribed verbal patient statements |
| `primary_symptom` | `VARCHAR(255)` | YES | NULL | — | Structured chief symptom summary |
| `duration_days` | `INT` | YES | NULL | — | Onset duration in elapsed days |
| `severity_scale` | `INT` | YES | NULL | — | Patient-reported symptom severity (1 to 10 scale) |
| `known_allergies` | `TEXT` | YES | NULL | — | Comma-delimited known drug allergies (e.g. `Penicillin, NSAIDs`) |
| `onset_notes` | `TEXT` | YES | NULL | — | Additional qualitative anamnesis notes |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Form completion timestamp |

- **Foreign Keys**: `fk_iq_visit`: `FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE ON UPDATE CASCADE`.
- **Indexes**: `UNIQUE KEY uq_iq_visit (visit_id)`.

---

### Table 6: `external_reports`
**Purpose**: Catalog of external diagnostic files (DICOM imaging, 12-lead ECG waveforms, laboratory bloodwork PDFs).

| Column | Data Type | Nullable | Default | Key | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT` | NO | — | **PK** | Unique report archive ID |
| `visit_id` | `INT` | NO | — | **FK** | Foreign key to `visits(id)` |
| `patient_id` | `INT` | NO | — | **FK** | Foreign key to `patients(id)` |
| `report_type` | `ENUM('DICOM', 'ECG', 'LAB_PDF', 'XRAY', 'OTHER')` | NO | — | — | Diagnostic document classification |
| `modality` | `VARCHAR(50)` | YES | NULL | — | Modality designation (e.g. `CT Chest`, `12-Lead ECG`, `CBC`) |
| `file_path` | `VARCHAR(500)` | NO | — | — | Secure server filesystem path / object URL |
| `file_size_mb` | `DECIMAL(6, 2)` | YES | NULL | — | File size in Megabytes (MB) |
| `upload_date` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Upload registration timestamp |
| `findings_summary`| `TEXT` | YES | NULL | — | Extracted impressions / findings notes |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Record creation timestamp |

- **Foreign Keys**:
  - `fk_er_visit`: `FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE ON UPDATE CASCADE`
  - `fk_er_patient`: `FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT ON UPDATE CASCADE`
- **Indexes**: `INDEX idx_er_visit (visit_id)`, `INDEX idx_er_patient (patient_id)`, `INDEX idx_er_type (report_type)`.

---

### Table 7: `deterministic_insights`
**Purpose**: Stores objective clinical rule evaluation results generated by the deterministic decision support engine.

| Column | Data Type | Nullable | Default | Key | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT` | NO | — | **PK** | Unique insight flag ID |
| `visit_id` | `INT` | NO | — | **FK** | Foreign key to `visits(id)` |
| `rule_code` | `VARCHAR(50)` | NO | — | — | Deterministic rule identifier (e.g. `RULE_HTN_STAGE2`) |
| `severity_level` | `ENUM('INFO', 'WARNING', 'CRITICAL')` | NO | — | — | Clinical severity tier |
| `category` | `ENUM('VITALS', 'DRUG_SAFETY', 'CONTRAINDICATION', 'GUIDELINE')` | NO | — | — | Clinical evaluation category |
| `title` | `VARCHAR(255)` | NO | — | — | Human-readable alert headline |
| `description` | `TEXT` | NO | — | — | Detailed clinical finding and threshold deviation |
| `recommendation` | `TEXT` | YES | NULL | — | Evidence-based guideline action suggestion |
| `is_reviewed` | `TINYINT(1)` | NO | `0` | — | Review flag (`1` = Acknowledged by doctor) |
| `is_signed` | `TINYINT(1)` | NO | `0` | — | Formal signature flag (`1` = Sealed into record) |
| `doctor_override_notes` | `TEXT` | YES | NULL | — | Justification notes if clinician overrides critical safety alert |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Rule execution timestamp |

- **Foreign Keys**: `fk_di_visit`: `FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE ON UPDATE CASCADE`.
- **Indexes**: `INDEX idx_di_visit (visit_id)`, `INDEX idx_di_severity (severity_level)`, `INDEX idx_di_rule (rule_code)`.

---

### Table 8: `drug_formulary`
**Purpose**: Standard approved OPD medication master formulary containing generic and brand names, dosages, and safety rules.

| Column | Data Type | Nullable | Default | Key | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT` | NO | — | **PK** | Unique formulary drug ID |
| `brand_name` | `VARCHAR(100)` | NO | — | — | Trade / Commercial brand name (e.g. `Augmentin 625`) |
| `generic_name` | `VARCHAR(100)` | NO | — | — | Active pharmacological molecule (e.g. `Amoxicillin + Clavulanate`) |
| `dosage_form` | `ENUM('TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'OINTMENT', 'INHALER', 'DROPS')` | NO | `'TABLET'` | — | Physical preparation form |
| `strength` | `VARCHAR(50)` | NO | — | — | Molecule strength (e.g. `625mg`, `5mg`, `40mg`) |
| `standard_dosage`| `VARCHAR(100)` | YES | NULL | — | Default clinical posology (e.g. `1 tab BD for 5 days`) |
| `contraindications` | `TEXT` | YES | NULL | — | Documented contraindications for automated allergy checks |
| `is_active` | `TINYINT(1)` | NO | `1` | — | Availability flag (`1` = Active in clinic inventory) |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Catalog entry timestamp |

- **Indexes**: `INDEX idx_drug_generic (generic_name)`, `INDEX idx_drug_brand (brand_name)`.

---

### Table 9: `prescriptions`
**Purpose**: E-Prescription encounter document signed by the physician.

| Column | Data Type | Nullable | Default | Key | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT` | NO | — | **PK** | Unique prescription ID |
| `visit_id` | `INT` | NO | — | **FK, UQ** | Foreign key to `visits(id)` (1:1 with visit) |
| `doctor_id` | `INT` | NO | — | **FK** | Foreign key to `users(id)` (Prescribing Physician) |
| `issue_date` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Issuance timestamp |
| `general_instructions` | `TEXT` | YES | NULL | — | Dietary advice, lifestyle modifications, follow-up intervals |
| `status` | `ENUM('DRAFT', 'FINALIZED', 'DISPENSED', 'CANCELLED')` | NO | `'DRAFT'` | — | Prescription workflow status |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Record creation timestamp |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Last update timestamp (`ON UPDATE CURRENT_TIMESTAMP`) |

- **Foreign Keys**:
  - `fk_rx_visit`: `FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE ON UPDATE CASCADE`
  - `fk_rx_doctor`: `FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE`
- **Indexes**: `UNIQUE KEY uq_rx_visit (visit_id)`, `INDEX idx_rx_doctor (doctor_id)`.

---

### Table 10: `prescription_items`
**Purpose**: Individual drug lines associated with an e-prescription.

| Column | Data Type | Nullable | Default | Key | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT` | NO | — | **PK** | Unique prescription item line ID |
| `prescription_id` | `INT` | NO | — | **FK** | Foreign key to `prescriptions(id)` |
| `drug_id` | `INT` | NO | — | **FK** | Foreign key to `drug_formulary(id)` |
| `dosage` | `VARCHAR(50)` | NO | — | — | Prescribed dose quantity (e.g. `625mg`, `1 tab`) |
| `frequency` | `VARCHAR(50)` | NO | — | — | Administration schedule (e.g. `1-0-1`, `OD`, `SOS`) |
| `duration_days` | `INT` | NO | — | — | Therapy duration in calendar days |
| `meal_timing` | `VARCHAR(50)` | YES | `'AFTER_MEALS'` | — | Relation to food (e.g. `Before Meals`, `After Meals`) |
| `special_instructions` | `VARCHAR(255)` | YES | NULL | — | Specific precautions (e.g. `Take with plenty of water`) |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Line item creation timestamp |

- **Foreign Keys**:
  - `fk_rxi_prescription`: `FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE ON UPDATE CASCADE`
  - `fk_rxi_drug`: `FOREIGN KEY (drug_id) REFERENCES drug_formulary(id) ON DELETE RESTRICT ON UPDATE CASCADE`
- **Indexes**: `INDEX idx_rxi_prescription (prescription_id)`, `INDEX idx_rxi_drug (drug_id)`.

---

### Table 11: `bills`
**Purpose**: Financial invoice header recording gross charges, insurance coverage, copay balance, and settlement status.

| Column | Data Type | Nullable | Default | Key | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT` | NO | — | **PK** | Unique bill invoice ID |
| `visit_id` | `INT` | NO | — | **FK, UQ** | Foreign key to `visits(id)` (1:1 with visit) |
| `cashier_id` | `INT` | NO | — | **FK** | Foreign key to `users(id)` (Settling Cashier) |
| `gross_amount` | `DECIMAL(10, 2)` | NO | `0.00` | — | Total gross charges before deductions ($\sum \text{items}$) |
| `discount_amount` | `DECIMAL(10, 2)` | NO | `0.00` | — | Approved clinic concession / waiver |
| `insurance_covered` | `DECIMAL(10, 2)` | NO | `0.00` | — | Cashless claim approved amount by insurer/TPA |
| `net_amount` | `DECIMAL(10, 2)` | NO | `0.00` | — | Final patient copay liability: $\text{Gross} - \text{Insurance} - \text{Discount}$ |
| `payment_status` | `ENUM('PENDING', 'PARTIAL', 'PAID', 'WAIVED')` | NO | `'PENDING'` | — | Settlement status |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Invoice creation timestamp |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Invoice update timestamp (`ON UPDATE CURRENT_TIMESTAMP`) |

- **Foreign Keys**:
  - `fk_bill_visit`: `FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE RESTRICT ON UPDATE CASCADE`
  - `fk_bill_cashier`: `FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE`
- **Indexes**: `UNIQUE KEY uq_bill_visit (visit_id)`, `INDEX idx_bill_status (payment_status)`.

---

### Table 12: `bill_items`
**Purpose**: Itemized service tariff charges (Consultation, Diagnostics, Pharmacy, Procedures).

| Column | Data Type | Nullable | Default | Key | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT` | NO | — | **PK** | Unique item charge line ID |
| `bill_id` | `INT` | NO | — | **FK** | Foreign key to `bills(id)` |
| `service_code` | `VARCHAR(50)` | NO | — | — | Tariff code (e.g. `OPD-CONSULT`, `ECG-12L`, `CT-CHEST`) |
| `description` | `VARCHAR(255)` | NO | — | — | Human-readable item description |
| `unit_price` | `DECIMAL(10, 2)` | NO | — | — | Base rate per unit |
| `quantity` | `INT` | NO | `1` | — | Billed quantity |
| `total_price` | `DECIMAL(10, 2)` | NO | — | — | Line total: $\text{unit\_price} \times \text{quantity}$ |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Record creation timestamp |

- **Foreign Keys**: `fk_bi_bill`: `FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE ON UPDATE CASCADE`.
- **Indexes**: `INDEX idx_bi_bill (bill_id)`.

---

### Table 13: `payments`
**Purpose**: Transaction audit ledger capturing payments tendered across all settlement methods.

| Column | Data Type | Nullable | Default | Key | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT` | NO | — | **PK** | Unique payment transaction ID |
| `bill_id` | `INT` | NO | — | **FK** | Foreign key to `bills(id)` |
| `payment_mode` | `ENUM('CASH', 'UPI', 'CARD', 'INSURANCE_DIRECT')` | NO | — | — | Payment tender mechanism |
| `transaction_ref`| `VARCHAR(100)` | NO | — | — | External reference (UPI txn ref / Bank POS auth / Cash slip no) |
| `amount_paid` | `DECIMAL(10, 2)` | NO | — | — | Actual amount captured |
| `payment_status` | `ENUM('SUCCESS', 'PENDING', 'FAILED')` | NO | `'SUCCESS'` | — | Authorization status |
| `payment_time` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Exact payment completion timestamp |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Audit entry creation timestamp |

- **Foreign Keys**: `fk_payment_bill`: `FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE RESTRICT ON UPDATE CASCADE`.
- **Indexes**: `INDEX idx_payment_bill (bill_id)`, `INDEX idx_payment_ref (transaction_ref)`.

---

## 4. Complete Executable MySQL 8.0 DDL Script

Below is the turnkey SQL script ready to execute in MySQL 8.0 to initialize the complete database schema with foreign keys, indexes, and constraints:

```sql
-- ============================================================================
-- ClinicOS (General OPD Clinic Management System)
-- Turnkey MySQL 8.0 Schema DDL
-- ============================================================================

DROP DATABASE IF EXISTS clinicos_db;
CREATE DATABASE clinicos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clinicos_db;

-- 1. USERS
CREATE TABLE users (
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
) ENGINE=InnoDB;

-- 2. PATIENTS
CREATE TABLE patients (
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
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_patients_phone (phone),
    INDEX idx_patients_name (last_name, first_name)
) ENGINE=InnoDB;

-- 3. VISITS
CREATE TABLE visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    receptionist_id INT NOT NULL,
    visit_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    queue_token VARCHAR(20) NOT NULL,
    status ENUM('REGISTERED', 'TRIAGED', 'IN_CONSULTATION', 'READY_FOR_BILLING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'REGISTERED',
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
) ENGINE=InnoDB;

-- 4. VITAL SIGNS
CREATE TABLE vital_signs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL UNIQUE,
    systolic_bp INT NULL,
    diastolic_bp INT NULL,
    pulse_rate INT NULL,
    temperature_f DECIMAL(4, 1) NULL,
    resp_rate INT NULL,
    spo2_pct INT NULL,
    weight_kg DECIMAL(5, 2) NULL,
    height_cm DECIMAL(5, 2) NULL,
    bmi DECIMAL(4, 1) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vitals_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 5. INTAKE QUESTIONNAIRES
CREATE TABLE intake_questionnaires (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL UNIQUE,
    voice_audio_url VARCHAR(500) NULL,
    transcript_text TEXT NULL,
    primary_symptom VARCHAR(255) NULL,
    duration_days INT NULL,
    severity_scale INT NULL,
    known_allergies TEXT NULL,
    onset_notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_iq_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 6. EXTERNAL REPORTS
CREATE TABLE external_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL,
    patient_id INT NOT NULL,
    report_type ENUM('DICOM', 'ECG', 'LAB_PDF', 'XRAY', 'OTHER') NOT NULL,
    modality VARCHAR(50) NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_mb DECIMAL(6, 2) NULL,
    upload_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    findings_summary TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_er_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_er_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_er_visit (visit_id),
    INDEX idx_er_patient (patient_id),
    INDEX idx_er_type (report_type)
) ENGINE=InnoDB;

-- 7. DETERMINISTIC INSIGHTS
CREATE TABLE deterministic_insights (
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
    CONSTRAINT fk_di_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_di_visit (visit_id),
    INDEX idx_di_severity (severity_level),
    INDEX idx_di_rule (rule_code)
) ENGINE=InnoDB;

-- 8. DRUG FORMULARY
CREATE TABLE drug_formulary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_name VARCHAR(100) NOT NULL,
    generic_name VARCHAR(100) NOT NULL,
    dosage_form ENUM('TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'OINTMENT', 'INHALER', 'DROPS') NOT NULL DEFAULT 'TABLET',
    strength VARCHAR(50) NOT NULL,
    standard_dosage VARCHAR(100) NULL,
    contraindications TEXT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_drug_generic (generic_name),
    INDEX idx_drug_brand (brand_name)
) ENGINE=InnoDB;

-- 9. PRESCRIPTIONS
CREATE TABLE prescriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL UNIQUE,
    doctor_id INT NOT NULL,
    issue_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    general_instructions TEXT NULL,
    status ENUM('DRAFT', 'FINALIZED', 'DISPENSED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rx_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rx_doctor FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_rx_doctor (doctor_id)
) ENGINE=InnoDB;

-- 10. PRESCRIPTION ITEMS
CREATE TABLE prescription_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prescription_id INT NOT NULL,
    drug_id INT NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    duration_days INT NOT NULL,
    meal_timing VARCHAR(50) NULL DEFAULT 'AFTER_MEALS',
    special_instructions VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rxi_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rxi_drug FOREIGN KEY (drug_id) REFERENCES drug_formulary(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_rxi_prescription (prescription_id)
) ENGINE=InnoDB;

-- 11. BILLS
CREATE TABLE bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL UNIQUE,
    cashier_id INT NOT NULL,
    gross_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    insurance_covered DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    net_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_status ENUM('PENDING', 'PARTIAL', 'PAID', 'WAIVED') NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bill_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_bill_cashier FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_bill_status (payment_status)
) ENGINE=InnoDB;

-- 12. BILL ITEMS
CREATE TABLE bill_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    service_code VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_price DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_bi_bill FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_bi_bill (bill_id)
) ENGINE=InnoDB;

-- 13. PAYMENTS
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    payment_mode ENUM('CASH', 'UPI', 'CARD', 'INSURANCE_DIRECT') NOT NULL,
    transaction_ref VARCHAR(100) NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('SUCCESS', 'PENDING', 'FAILED') NOT NULL DEFAULT 'SUCCESS',
    payment_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_bill FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_payment_bill (bill_id),
    INDEX idx_payment_ref (transaction_ref)
) ENGINE=InnoDB;
```

---

## 5. Seed Fixtures for Quick Bootstrapping

```sql
-- Seed Core Role Users
INSERT INTO users (id, username, password_hash, full_name, role, email, phone) VALUES
(1, 'receptionist_anita', '$2b$12$e6y5X.dummyhashreceptionist', 'Anita Sharma', 'RECEPTIONIST', 'anita@clinic.com', '+919876543210'),
(2, 'dr_kulkarni', '$2b$12$w3r9T.dummyhashdoctor', 'Dr. Vikram Kulkarni, MD', 'DOCTOR', 'vikram@clinic.com', '+919876543211'),
(3, 'cashier_rahul', '$2b$12$p8u1Z.dummyhashcashier', 'Rahul Verma', 'CASHIER', 'rahul@clinic.com', '+919876543212');

-- Seed OPD Drug Formulary
INSERT INTO drug_formulary (id, brand_name, generic_name, dosage_form, strength, standard_dosage, contraindications) VALUES
(1, 'Augmentin 625', 'Amoxicillin + Clavulanate', 'TABLET', '625mg', '1 tab BD for 5 days', 'Penicillin hypersensitivity, Cholestatic jaundice'),
(2, 'Amlokind 5', 'Amlodipine', 'TABLET', '5mg', '1 tab OD morning', 'Severe hypotension, cardiogenic shock'),
(3, 'Pan 40', 'Pantoprazole', 'TABLET', '40mg', '1 tab OD before breakfast', 'Known hypersensitivity'),
(4, 'Dolo 650', 'Paracetamol', 'TABLET', '650mg', '1 tab SOS (Max 3/day)', 'Severe hepatic impairment'),
(5, 'Zoryl M2', 'Glimepiride + Metformin', 'TABLET', '2mg/500mg', '1 tab OD with dinner', 'Renal impairment, Lactic acidosis'),
(6, 'Allegra 120', 'Fexofenadine', 'TABLET', '120mg', '1 tab OD bedtime', 'Hypersensitivity to fexofenadine');
```
