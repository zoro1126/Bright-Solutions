# Research Audit Report: SaaS Multi-Tenancy & Hybrid Database Architecture
## Bright Solutions: Clinical Hospital Operating System (COS)

> **Document Reference:** ARCH-AUDIT-2026-10-28-FINAL  
> **Target Scope:** MVP Database Restructuring, Modular SaaS Tenancy, 14 IPD Forms Integration  
> **Source Evidence:** [01_PRD.md](file:///home/prem/Desktop/pbt/COS/docs/design/01_PRD.md), [03_technical_architecture.md](file:///home/prem/Desktop/pbt/COS/docs/design/03_technical_architecture.md), [04_data_model_spec.md](file:///home/prem/Desktop/pbt/COS/docs/design/04_data_model_spec.md), [09_database_schema_ddl.sql](file:///home/prem/Desktop/pbt/COS/docs/design/09_database_schema_ddl.sql), [21_adrs.md](file:///home/prem/Desktop/pbt/COS/docs/design/21_adrs.md), and [IPD Book 6 Days.pdf](file:///home/prem/Desktop/pbt/COS/docs/client_docs/IPD%20Book%206%20Days.pdf)  
> **Author:** Antigravity Architecture Advisory  
> **Status:** ARCHITECTURE APPROVED & SPECIFIED VIA /GRILL-ME  

---

## 1. Executive Summary & Decisions Reached

Following a comprehensive architectural audit and `/grill-me` alignment, the architectural baseline for the Bright Solutions database and SaaS deployment has been finalized:

1. **Standardized Database Engine:** **MySQL 8.0 (InnoDB) with native `JSON` columns and Virtual / Generated Indexes**. This maintains single-engine operational simplicity across Contabo LAMP hosting and on-premise hospital servers, honoring [ADR-001](file:///home/prem/Desktop/pbt/COS/docs/design/21_adrs.md#2-adr-001-selection-of-mysql-80-innodb-over-postgresql) while preventing the operational and split-brain transaction hazards of a dual-engine polyglot stack (MySQL + MongoDB).
2. **Clinical Persistence Model (Hybrid Storage):**
   - **Structured Relational Core:** High-frequency, calculable, and cross-linked clinical entities remain normalized:
     - `ipd_admissions` (Admission lifecycle, bed allocations, financial deposit)
     - `ipd_treatment_orders` (Doctor medication/fluid/O2 orders)
     - `ipd_treatment_administrations` (Nurse MAR administration timestamps & omissions)
     - `ipd_intake_output` (24h continuous fluid balance)
     - `vital_signs` (Continuous flowsheet & red-flag alerts)
   - **Unified Document Form Engine (`ipd_clinical_form_submissions`):** All narrative assessments, consents, and surgical checklists (covering all 14 clinical forms from [`IPD Book 6 Days.pdf`](file:///home/prem/Desktop/pbt/COS/docs/client_docs/IPD%20Book%206%20Days.pdf)) are stored in a single versioned submissions table using validated `payload JSON` columns.
3. **Validation & Contract Strategy:** **Code-First Pydantic v2 Registry**. Each form code has a dedicated, versioned Pydantic model in FastAPI. Adding or customizing forms for future clients requires zero database schema migrations (`ALTER TABLE`).
4. **Scope Boundary:** **Full 14-Form Suite in MVP** utilizing the Pydantic form registry.
5. **Multi-Tenancy & "Rent-a-Module" Architecture:**
   - **Shared Schema with `tenant_id` Discriminator:** All tables contain a `tenant_id` column. Sequences (`UHID`, `IPD`, `INV`) use composite scopes `(tenant_id, sequence_key, fiscal_year)`.
   - **Autonomous Modules on Shared Kernel:** Core (Auth, Users, Tenants, Patients) is universally active. Modules (`OPD`, `IPD`, `PHARMACY`, `PATHOLOGY`, `BILLING`) operate standalone or connected.
6. **On-Premise SaaS Licensing & Offline Protection:** **Asymmetric Ed25519 Cryptographic License Keys**. Tamper-proof offline verification, dual-mode renewal (online heartbeat + offline key upload), monotonic database timestamps to prevent clock tampering, and a 14-day healthcare safety grace period.

---

## 2. Inpatient 6-Day Book: Complete 14-Form Inventory

Audit of [`IPD Book 6 Days.pdf`](file:///home/prem/Desktop/pbt/COS/docs/client_docs/IPD%20Book%206%20Days.pdf) identifies the exact 14 forms and their persistence strategy:

| Form Code | Form Title | Page Range | Storage Strategy | Key Fields / Purpose |
|:---|:---|:---:|:---:|:---|
| `FORM_08` | Admission Consent & Authorization | pp. 1–2 | `ipd_clinical_form_submissions` | Legal consent for investigations/procedures, high-risk acknowledgment, bilingual English/Gujarati |
| `FORM_09` | Admission Form / Inpatient Face Sheet | pp. 3–4 | `ipd_admissions` + Form Submissions | Demographics, MLC details, next of kin, TPA insurance card details |
| `FORM_10` | Doctor H&P Admission Assessment | pp. 45–48 | `ipd_clinical_form_submissions` | Chief complaints, HPI, past history, systemic physical exam, provisional diagnosis |
| `FORM_29` | Daily Treatment Orders (Doctor) | pp. 5–34 | `ipd_treatment_orders` (Relational) | Drug, dose, route, frequency, O2 therapy flow rate, special diet orders (6-day matrix) |
| `FORM_29_MAR` | Medication Administration Record (Nurse) | pp. 5–34 | `ipd_treatment_administrations` (Relational) | Shift-wise dose administration, nurse signature, omitted dose justification |
| `FORM_61` | 24-Hour Fluid Intake & Output Chart | pp. 35–38 | `ipd_intake_output` (Relational) | Shift-wise Oral/IV fluid intake, urine/drain output, running balance |
| `FORM_70` | Nursing Initial Admission Assessment | pp. 39–44 | `ipd_clinical_form_submissions` | 15-min triage assessment, allergy check, Morse fall risk score, Braden pressure ulcer score |
| `FORM_71` | Nurse Care Plan & Daily Goals | pp. 35–38 | `ipd_clinical_form_submissions` | Airway patency, pain management, IV site maintenance, patient daily hygiene goals |
| `FORM_72` | Nurse Progress Notes & Shift Handover | pp. 49–50 | `ipd_clinical_form_submissions` | Shift handover observations, changes in clinical status, communication logs |
| `FORM_HANDOVER` | Doctor Handover & Takeover Form | pp. 51–54 | `ipd_clinical_form_submissions` | Attending consultant handover, pending investigations, critical watch flags |
| `FORM_TRANSFER` | Internal Department Transfer Form | pp. 55–58 | `ipd_clinical_form_submissions` | Ward to ICU / OT transfer checklist, transport vitals, active medicine handoff |
| `FORM_15_151` | Pre-Anaesthesia Assessment & Consent | pp. 59–68 | `ipd_clinical_form_submissions` | Mallampati airway classification, ASA grade, anaesthetic risk acknowledgment |
| `FORM_54` | Preoperative Surgical Checklist & Notes | pp. 69–78 | `ipd_clinical_form_submissions` | Surgical site marking, NPO confirmation, blood arrangement, OT nurse handover |
| `FORM_FEEDBACK` | Inpatient Experience & Feedback | pp. 85–86 | `ipd_clinical_form_submissions` | Post-stay patient satisfaction questionnaire (Bilingual English/Gujarati) |

---

## 3. Database Schema Specification for Form Submissions & Licensing

### 3.1 Tenancy & Licensing Tables

```sql
CREATE TABLE tenants (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE COMMENT 'Subdomain identifier e.g. shubham',
    name VARCHAR(150) NOT NULL,
    license_id VARCHAR(100) NOT NULL,
    status ENUM('ACTIVE', 'GRACE_PERIOD', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    valid_until DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenants_slug (slug),
    INDEX idx_tenants_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tenant_modules (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT UNSIGNED NOT NULL,
    module_code VARCHAR(30) NOT NULL COMMENT 'OPD, IPD, PHARMACY, PATHOLOGY, BILLING',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    valid_until DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_tenant_module (tenant_id, module_code),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.2 The Universal Clinical Form Submissions Table

```sql
CREATE TABLE ipd_clinical_form_submissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    tenant_id INT UNSIGNED NOT NULL,
    admission_id BIGINT UNSIGNED NOT NULL,
    form_code VARCHAR(50) NOT NULL COMMENT 'FORM_08, FORM_10, FORM_70, FORM_71, FORM_15, FORM_54, etc.',
    form_version INT UNSIGNED NOT NULL DEFAULT 1,
    day_number SMALLINT UNSIGNED DEFAULT NULL COMMENT 'Optional day index (1-6) for multi-day daily sheets',
    recorded_by BIGINT UNSIGNED NOT NULL COMMENT 'FK users.id',
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('DRAFT', 'SUBMITTED', 'LOCKED', 'SUPERSEDED') NOT NULL DEFAULT 'SUBMITTED',
    payload JSON NOT NULL COMMENT 'Validated against Pydantic schema for form_code',
    
    -- Virtual Generated Columns for Instant Indexing & Search
    is_mlc BOOLEAN GENERATED ALWAYS AS (
        JSON_UNQUOTE(JSON_EXTRACT(payload, '$.is_mlc')) = 'true'
    ) STORED,
    triage_score VARCHAR(20) GENERATED ALWAYS AS (
        JSON_UNQUOTE(JSON_EXTRACT(payload, '$.triage_score'))
    ) VIRTUAL,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    FOREIGN KEY (admission_id) REFERENCES ipd_admissions(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_forms_tenant_admission (tenant_id, admission_id, form_code),
    INDEX idx_forms_code_recorded (form_code, recorded_at),
    INDEX idx_forms_is_mlc (is_mlc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. On-Premise Asymmetric Ed25519 Licensing Architecture

```
[ Central Cloud Licensing Portal ]
              │
              │ Signs payload with Private Key (Ed25519)
              ▼
    Signed license.lic
  ┌────────────────────────────────────────────────────────────┐
  │ tenant_id: "shubham-cancer-centre"                         │
  │ enabled_modules: ["OPD", "IPD"]                            │
  │ valid_until: "2027-10-31T23:59:59Z"                        │
  │ limits: { max_beds: 60, max_doctors: 20 }                  │
  │ signature: "MEQCIG71...3xKxN2Y1qBvP...z7q="                │
  └────────────────────────────────────────────────────────────┘
              │
              ├── [Online Mode]: Local server pings daily heartbeat
              └── [Offline Mode]: Admin uploads .lic file via UI
              │
              ▼
[ Hospital On-Premise Local Server ]
  ├── Embedded Public Key (Verification Only)
  ├── Monotonic Timestamp Tracker (Blocks BIOS Clock Rollback)
  └── Middleware (@require_module)
       ├── "IPD" Allowed   --> Access Inpatient Binder
       └── "PHARMACY" Denied --> 403 MODULE_NOT_LICENSED
```

---

## 5. Architectural Decision Log

- **ADR-001 (Maintained):** Selection of MySQL 8.0 (InnoDB) over PostgreSQL.
- **ADR-009 (New):** Hybrid Relational Core + Pydantic JSON Registry for Clinical Forms.
- **ADR-010 (New):** Asymmetric Ed25519 Cryptographic Licensing for On-Premise Modular SaaS.
