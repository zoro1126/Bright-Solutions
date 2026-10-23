# D10 — Entity Relationship Diagrams (ERDs)
## Bright Solutions: Clinical Hospital Operating System

> **Document ID:** D10  
> **Version:** 1.0  
> **Status:** APPROVED ARCHITECTURE SPECIFICATION  
> **Depends On:** [09_database_schema_ddl.sql](file:///home/prem/Desktop/pbt/COS/docs/design/09_database_schema_ddl.sql)  
> **Prepared By:** Bright Solutions Engineering Team  
> **Last Updated:** October 2026  

---

## Table of Contents

1. [Architectural Overview & Reading Guide](#1-architectural-overview--reading-guide)
2. [Domain 1 — Auth, Roles & Administration](#2-domain-1--auth-roles--administration)
3. [Domain 2 — Patient Demographics & OPD Queue](#3-domain-2--patient-demographics--opd-queue)
4. [Domain 3 — Clinical Triage, Consultations & Prescriptions](#4-domain-3--clinical-triage-consultations--prescriptions)
5. [Domain 4 — Pharmacy Inventory & Dispensation](#5-domain-4--pharmacy-inventory--dispensation)
6. [Domain 5 — IPD Admission, Bed Management & Stay](#6-domain-5--ipd-admission-bed-management--stay)
7. [Domain 6 — Pathology & Laboratory Diagnostics](#7-domain-6--pathology--laboratory-diagnostics)
8. [Domain 7 — Multi-Point Billing & Payments](#8-domain-7--multi-point-billing--payments)
9. [Domain 8 — CDSS Rules & Clinical Safety Audit](#9-domain-8--cdss-rules--clinical-safety-audit)
10. [Cross-Domain Master Linkages](#10-cross-domain-master-linkages)

---

## 1. Architectural Overview & Reading Guide

This document specifies the Entity-Relationship structure for the **Bright Solutions** hospital database. To maintain readability and avoid visual clutter, diagrams are segmented into **8 cohesive functional domains**.

### Notation Key

| Symbol | Cardinality Meaning |
|:---:|:---|
| `||--||` | Exactly one to exactly one |
| `||--o|` | Exactly one to zero or one (optional) |
| `||--|{` | Exactly one to one or more (mandatory parent) |
| `||--o{` | Exactly one to zero or more (standard parent-child) |

### Key Identifier Conventions
- **`PK`**: Primary Key (`BIGINT UNSIGNED AUTO_INCREMENT` or `INT UNSIGNED AUTO_INCREMENT`).
- **`UK`**: Unique Key constraint (e.g., `public_id CHAR(36)` UUID v4 or domain code like `uhid`, `opd_number`).
- **`FK`**: Foreign Key constraint.

---

## 2. Domain 1 — Auth, Roles & Administration

Covers user authentication, role-based access control (RBAC), doctor schedules, hospital configuration, and system-wide audit logging.

```mermaid
erDiagram
    hospitals ||--o{ users : "employs"
    hospitals ||--o{ system_sequences : "maintains"
    hospitals ||--o{ hospital_config : "configures"
    hospitals ||--o{ audit_logs : "records"
    
    roles ||--o{ users : "assigned_to"
    roles ||--o{ role_permissions : "grants"
    permissions ||--o{ role_permissions : "included_in"
    
    users ||--o| doctor_profiles : "has"
    doctor_profiles ||--o{ doctor_schedules : "scheduled_for"
    users ||--o{ audit_logs : "triggers"

    hospitals {
        int id PK
        char public_id UK
        varchar hospital_code UK
        varchar name
        varchar phone
        tinyint is_active
    }

    roles {
        int id PK
        varchar role_code UK
        varchar role_name
        tinyint is_system_role
    }

    permissions {
        int id PK
        varchar permission_code UK
        varchar module
    }

    role_permissions {
        int role_id PK,FK
        int permission_id PK,FK
    }

    users {
        bigint id PK
        char public_id UK
        int hospital_id FK
        varchar username UK
        varchar password_hash
        varchar full_name
        int role_id FK
        varchar phone
        tinyint is_active
    }

    doctor_profiles {
        bigint id PK
        char public_id UK
        bigint user_id UK,FK
        int hospital_id FK
        varchar specialization
        varchar medical_council_reg_no
        decimal default_consultation_fee
        decimal follow_up_fee
        int follow_up_validity_days
        varchar assigned_room_number
    }

    doctor_schedules {
        bigint id PK
        bigint doctor_id FK
        tinyint day_of_week
        time start_time
        time end_time
        int slot_duration_minutes
        int max_tokens
        tinyint is_active
    }

    system_sequences {
        int id PK
        int hospital_id FK
        varchar sequence_key UK
        varchar prefix
        bigint current_value
        tinyint padding_length
    }

    audit_logs {
        bigint id PK
        int hospital_id FK
        bigint user_id FK
        varchar action
        varchar entity_name
        bigint entity_id
        varchar ip_address
        json details_json
        datetime created_at
    }
```

---

## 3. Domain 2 — Patient Demographics & OPD Queue

Covers patient identity (UHID), demographic details, known drug/food allergies, and monotonic OPD queue visits with token assignment.

```mermaid
erDiagram
    patients ||--o{ patient_allergies : "has"
    patients ||--o{ opd_visits : "registers_for"
    doctor_profiles ||--o{ opd_visits : "attends"
    opd_visits ||--|| queue_tokens : "generates"

    patients {
        bigint id PK
        char public_id UK
        int hospital_id FK
        varchar uhid UK
        varchar first_name
        varchar last_name
        date dob
        enum gender
        enum blood_group
        varchar phone
        varchar aadhaar_hash
        varchar abha_number
        varchar emergency_contact_phone
    }

    patient_allergies {
        bigint id PK
        char public_id UK
        bigint patient_id FK
        enum allergen_type
        varchar allergen_name
        enum severity
        date diagnosed_date
    }

    opd_visits {
        bigint id PK
        char public_id UK
        varchar opd_number UK
        bigint patient_id FK
        bigint doctor_id FK
        date visit_date
        enum visit_type
        enum status
        enum payment_status
        bigint registered_by FK
    }

    queue_tokens {
        bigint id PK
        bigint opd_visit_id UK,FK
        bigint doctor_id FK
        int token_number
        date token_date
        enum status
        datetime called_at
        datetime consultation_started_at
        datetime completed_at
    }
```

---

## 4. Domain 3 — Clinical Triage, Consultations & Prescriptions

Covers triage vitals intake, red-flag screening questionnaire, doctor SOAP consultation notes, ICD-10 diagnostic coding, and e-prescription authoring.

```mermaid
erDiagram
    opd_visits ||--o{ vital_signs : "captures"
    opd_visits ||--o| intake_questionnaires : "records"
    opd_visits ||--|| consultations : "results_in"
    
    patients ||--o{ vital_signs : "measured_on"
    patients ||--o{ intake_questionnaires : "answers"
    patients ||--o{ consultations : "examined_in"
    
    doctor_profiles ||--o{ consultations : "conducts"
    consultations ||--o{ consultation_diagnoses : "identifies"
    icd10_codes ||--o{ consultation_diagnoses : "references"
    
    consultations ||--o{ prescriptions : "orders"
    prescriptions ||--|{ prescription_items : "contains"

    vital_signs {
        bigint id PK
        char public_id UK
        bigint patient_id FK
        bigint opd_visit_id FK
        bigint ipd_admission_id FK
        decimal temperature_f
        int pulse_bpm
        int blood_pressure_systolic
        int blood_pressure_diastolic
        int respiratory_rate_bpm
        int spo2_percentage
        decimal bmi
        tinyint is_abnormal
        json abnormal_flags_json
        bigint recorded_by FK
        datetime recorded_at
    }

    intake_questionnaires {
        bigint id PK
        char public_id UK
        bigint patient_id FK
        bigint opd_visit_id FK
        text chief_complaint
        text history_of_present_illness
        json red_flag_triggers_json
        json responses_json
        bigint recorded_by FK
        datetime recorded_at
    }

    consultations {
        bigint id PK
        char public_id UK
        bigint opd_visit_id UK,FK
        bigint patient_id FK
        bigint doctor_id FK
        text subjective
        text objective
        text assessment
        text plan
        date follow_up_date
        enum status
        datetime signed_at
        bigint signed_by FK
    }

    consultation_diagnoses {
        bigint id PK
        bigint consultation_id FK
        int icd10_code_id FK
        varchar diagnosis_code
        varchar diagnosis_name
        enum diagnosis_type
        tinyint is_primary
    }

    icd10_codes {
        int id PK
        varchar code UK
        varchar description
        varchar chapter
        tinyint is_active
    }

    prescriptions {
        bigint id PK
        char public_id UK
        varchar prescription_number UK
        bigint patient_id FK
        bigint consultation_id FK
        bigint doctor_id FK
        enum status
        text general_instructions
    }

    prescription_items {
        bigint id PK
        bigint prescription_id FK
        bigint item_id FK
        varchar drug_name_custom
        varchar dosage
        enum frequency
        enum route
        int duration_days
        int quantity_prescribed
        enum food_relation
        tinyint is_off_formulary
        varchar off_formulary_reason
    }
```

---

## 5. Domain 4 — Pharmacy Inventory & Dispensation

Covers formulary master catalog, warehouse/shelf batch management with expiry tracking, pharmacist dispensing queue, partial/substitute dispensing, and stock depletion.

```mermaid
erDiagram
    pharmacy_items ||--o{ pharmacy_batches : "stocked_as"
    pharmacy_items ||--o{ prescription_items : "formulary_ref"
    
    prescriptions ||--o{ pharmacy_dispensations : "fulfilled_by"
    pharmacy_dispensations ||--|{ pharmacy_dispensation_items : "dispenses"
    
    prescription_items ||--o{ pharmacy_dispensation_items : "fulfills"
    pharmacy_items ||--o{ pharmacy_dispensation_items : "item_master"
    pharmacy_batches ||--o{ pharmacy_dispensation_items : "deducts_from"

    pharmacy_items {
        bigint id PK
        char public_id UK
        varchar item_code UK
        varchar generic_name
        varchar brand_name
        enum drug_form
        varchar strength
        decimal unit_mrp
        decimal purchase_rate
        int reorder_level
        int current_stock
        tinyint is_narcotic
        tinyint is_active
    }

    pharmacy_batches {
        bigint id PK
        bigint item_id FK
        varchar batch_number UK
        date expiry_date
        int available_quantity
        decimal unit_purchase_price
        decimal unit_sale_price
        tinyint is_active
    }

    pharmacy_dispensations {
        bigint id PK
        char public_id UK
        varchar dispensation_number UK
        bigint prescription_id FK
        bigint patient_id FK
        bigint dispensed_by FK
        bigint invoice_id FK
        enum status
        datetime dispensed_at
    }

    pharmacy_dispensation_items {
        bigint id PK
        bigint dispensation_id FK
        bigint prescription_item_id FK
        bigint item_id FK
        bigint batch_id FK
        int quantity_dispensed
        decimal unit_sale_price
        decimal total_amount
        tinyint is_substitute
        varchar substitute_reason
    }
```

---

## 6. Domain 5 — IPD Admission, Bed Management & Stay

Covers hospital infrastructure (Wards, Rooms, Beds), inpatient admission lifecycle, split-rate bed movement history, daily rounds notes, nursing medication records, surgical procedures, and final discharge summaries.

```mermaid
erDiagram
    wards ||--|{ rooms : "contains"
    rooms ||--|{ beds : "contains"
    
    patients ||--o{ ipd_admissions : "admitted_as"
    doctor_profiles ||--o{ ipd_admissions : "attends"
    beds ||--o{ ipd_admissions : "current_bed"
    
    ipd_admissions ||--|{ ipd_bed_allocations : "bed_history"
    beds ||--o{ ipd_bed_allocations : "assigned_in"
    
    ipd_admissions ||--o{ ipd_daily_notes : "daily_rounds"
    ipd_admissions ||--o{ ipd_nurse_records : "nursing_care"
    ipd_admissions ||--o{ ipd_procedures : "undergoes"
    ipd_admissions ||--o| ipd_discharge_summaries : "discharged_with"

    wards {
        int id PK
        char public_id UK
        varchar ward_code UK
        varchar ward_name
        varchar floor_number
        enum gender_restriction
        int total_beds
    }

    rooms {
        int id PK
        char public_id UK
        int ward_id FK
        varchar room_number
        enum room_type
        decimal daily_tariff
    }

    beds {
        bigint id PK
        char public_id UK
        int room_id FK
        varchar bed_number
        enum status
        tinyint is_active
    }

    ipd_admissions {
        bigint id PK
        char public_id UK
        varchar ipd_number UK
        bigint patient_id FK
        bigint attending_doctor_id FK
        bigint current_bed_id FK
        datetime admission_date
        datetime discharge_date
        enum admission_type
        text provisional_diagnosis
        decimal advance_amount_paid
        enum status
        enum discharge_type
    }

    ipd_bed_allocations {
        bigint id PK
        bigint admission_id FK
        bigint bed_id FK
        datetime allocated_at
        datetime released_at
        decimal daily_rate
        varchar transfer_reason
        bigint allocated_by FK
        bigint released_by FK
    }

    ipd_daily_notes {
        bigint id PK
        bigint admission_id FK
        bigint doctor_id FK
        datetime note_datetime
        text subjective_notes
        text objective_findings
        text plan_notes
    }

    ipd_nurse_records {
        bigint id PK
        bigint admission_id FK
        bigint nurse_id FK
        bigint vital_signs_id FK
        varchar medication_administered
        varchar dosage_given
        varchar iv_fluids_administered
        text nurse_notes
    }

    ipd_procedures {
        bigint id PK
        char public_id UK
        bigint admission_id FK
        varchar procedure_name
        varchar procedure_code
        bigint performed_by_doctor_id FK
        bigint anaesthetist_doctor_id FK
        datetime procedure_datetime
        decimal tariff_amount
    }

    ipd_discharge_summaries {
        bigint id PK
        char public_id UK
        bigint admission_id UK,FK
        bigint doctor_id FK
        text final_diagnosis
        text hospital_course
        text condition_at_discharge
        json discharge_medications_json
        text follow_up_instructions
        datetime signed_at
    }
```

---

## 7. Domain 6 — Pathology & Laboratory Diagnostics

Covers test master hierarchy, parameter reference ranges, lab test ordering, specimen collection, technician result entry with panic/abnormal flags, and pathologist sign-off.

```mermaid
erDiagram
    lab_categories ||--|{ lab_tests : "categorizes"
    lab_tests ||--|{ lab_test_parameters : "measures"
    
    patients ||--o{ lab_orders : "placed_for"
    doctor_profiles ||--o{ lab_orders : "prescribed_by"
    
    lab_orders ||--|{ lab_order_items : "includes"
    lab_tests ||--o{ lab_order_items : "ordered_test"
    
    lab_order_items ||--|{ lab_order_results : "produces"
    lab_test_parameters ||--o{ lab_order_results : "evaluated_against"
    
    lab_orders ||--o| lab_reports : "compiled_into"

    lab_categories {
        int id PK
        varchar category_code UK
        varchar category_name
        tinyint is_active
    }

    lab_tests {
        bigint id PK
        char public_id UK
        int category_id FK
        varchar test_code UK
        varchar test_name
        enum sample_type
        varchar container_type
        decimal standard_price
        tinyint is_active
    }

    lab_test_parameters {
        bigint id PK
        bigint test_id FK
        varchar parameter_code
        varchar parameter_name
        varchar unit
        enum data_type
        decimal default_min
        decimal default_max
        decimal panic_min
        decimal panic_max
    }

    lab_orders {
        bigint id PK
        char public_id UK
        varchar order_number UK
        bigint patient_id FK
        bigint opd_visit_id FK
        bigint ipd_admission_id FK
        bigint ordering_doctor_id FK
        enum status
        datetime sample_collected_at
        bigint sample_collected_by FK
    }

    lab_order_items {
        bigint id PK
        bigint order_id FK
        bigint test_id FK
        decimal test_price
        enum status
    }

    lab_order_results {
        bigint id PK
        bigint order_item_id FK
        bigint parameter_id FK
        varchar result_value
        tinyint is_abnormal
        tinyint is_panic
        varchar remarks
        bigint performed_by FK
        datetime performed_at
    }

    lab_reports {
        bigint id PK
        char public_id UK
        bigint order_id UK,FK
        bigint verified_by_doctor_id FK
        datetime verification_timestamp
        text pathologist_remarks
        varchar report_pdf_path
    }
```

---

## 8. Domain 7 — Multi-Point Billing & Payments

Covers universal service tariff catalog, multi-point invoices (OPD Consultation, Pharmacy, Lab, and IPD 10-head Consolidated), line item breakdowns, and payment collection tracking.

```mermaid
erDiagram
    hospitals ||--o{ tariffs : "maintains"
    patients ||--o{ invoices : "billed_to"
    
    opd_visits ||--o{ invoices : "opd_source"
    ipd_admissions ||--o{ invoices : "ipd_source"
    
    invoices ||--|{ invoice_items : "contains"
    invoices ||--o{ payments : "settled_by"
    patients ||--o{ payments : "paid_by"

    tariffs {
        bigint id PK
        char public_id UK
        varchar service_code UK
        varchar service_name
        enum category
        decimal base_price
        decimal tax_percentage
        tinyint is_active
    }

    invoices {
        bigint id PK
        char public_id UK
        varchar invoice_number UK
        bigint patient_id FK
        bigint opd_visit_id FK
        bigint ipd_admission_id FK
        enum invoice_type
        enum status
        decimal subtotal_amount
        decimal discount_amount
        decimal tax_amount
        decimal net_amount
        decimal paid_amount
        decimal balance_amount
        bigint created_by FK
        datetime generated_at
    }

    invoice_items {
        bigint id PK
        bigint invoice_id FK
        enum item_type
        bigint reference_id
        varchar item_name
        decimal quantity
        decimal unit_price
        decimal total_amount
        decimal discount_amount
        decimal net_amount
    }

    payments {
        bigint id PK
        char public_id UK
        varchar payment_number UK
        bigint invoice_id FK
        bigint patient_id FK
        decimal amount
        enum payment_method
        varchar transaction_reference
        bigint received_by FK
        datetime payment_date
    }
```

---

## 9. Domain 8 — CDSS Rules & Clinical Safety Audit

Covers deterministic rule bases (Drug-Drug Interactions, Vital Red Flags, Clinical Symptom Trios) and doctor override audit logging.

```mermaid
erDiagram
    patients ||--o{ cdss_alerts_log : "affects"
    doctor_profiles ||--o{ cdss_alerts_log : "viewed_by"
    consultations ||--o{ cdss_alerts_log : "triggered_during"

    cdss_ddi_rules {
        bigint id PK
        varchar drug_a_generic
        varchar drug_b_generic
        enum severity
        text clinical_mechanism
        text management_advice
        tinyint is_active
    }

    cdss_vital_rules {
        int id PK
        enum vital_code
        decimal min_threshold
        decimal max_threshold
        enum severity
        varchar alert_title
        varchar alert_message
        tinyint is_active
    }

    cdss_clinical_rules {
        bigint id PK
        varchar rule_code UK
        enum trigger_type
        json condition_json
        enum severity
        varchar alert_title
        text alert_message
        json recommended_actions_json
        tinyint is_active
    }

    cdss_alerts_log {
        bigint id PK
        bigint patient_id FK
        bigint doctor_id FK
        bigint consultation_id FK
        enum rule_type
        bigint rule_reference_id
        enum severity
        varchar alert_title
        text alert_text
        enum doctor_action
        varchar override_reason
        datetime created_at
    }
```

---

## 10. Cross-Domain Master Linkages

The diagram below illustrates how core clinical and administrative records tie across the hospital boundary.

```mermaid
erDiagram
    patients ||--o{ opd_visits : "visits"
    patients ||--o{ ipd_admissions : "admitted"
    patients ||--o{ invoices : "billed"
    
    opd_visits ||--|| consultations : "consults"
    consultations ||--o{ prescriptions : "prescribes"
    consultations ||--o{ lab_orders : "orders"
    
    prescriptions ||--o{ pharmacy_dispensations : "dispenses"
    pharmacy_dispensations ||--o| invoices : "pharmacy_bill"
    lab_orders ||--o| invoices : "lab_bill"
    
    ipd_admissions ||--o| invoices : "consolidated_ipd_bill"
    ipd_admissions ||--o{ lab_orders : "inpatient_labs"
    ipd_admissions ||--o{ prescriptions : "inpatient_rx"
```
