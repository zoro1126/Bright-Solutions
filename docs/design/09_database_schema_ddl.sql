-- ============================================================================
-- Bright Solutions: Clinical Hospital Operating System
-- Document ID: D9
-- Document Title: Database Schema — Full MySQL DDL
-- Target Engine: MySQL 8.0+ (InnoDB, utf8mb4)
-- Prepared By: Bright Solutions Backend Engineering Team
-- Status: APPROVED ARCHITECTURE SPECIFICATION
-- Version: 1.0
-- ============================================================================
-- Design Principles Applied:
-- 1. Hybrid Keys: BIGINT UNSIGNED AUTO_INCREMENT for clustered PKs & FKs,
--    UUID (CHAR(36)) for external API exposure, and domain codes (UHID, OPD#, IPD#).
-- 2. Immutability & Soft Deletes: Master & config tables use deleted_at/deleted_by.
--    Clinical & financial transaction tables are strictly append-only with status logs.
-- 3. Multi-Tenancy Ready: hospital_id (INT UNSIGNED) on all scoped tables.
-- 4. Financial Precision: DECIMAL(12, 2) for all currency fields in INR.
-- 5. Concurrency-Safe Sequences: Dedicated system_sequences table for gapless numbering.
-- 6. Normalized Pharmacy & Multi-Parameter Lab models.
-- 7. Consolidated Multi-Point Billing supporting OPD, Pharmacy, Lab, and 10 IPD charge heads.
-- 8. Structured CDSS rules & audit logs for medico-legal and NABH compliance.
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. SYSTEM TENANCY, SEQUENCES & CONFIGURATION
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS hospitals (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255) NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(100) NULL,
    registration_number VARCHAR(100) NULL,
    tax_id_gst VARCHAR(50) NULL,
    logo_url VARCHAR(500) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    deleted_by INT UNSIGNED NULL,
    INDEX idx_hospitals_code (hospital_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_sequences (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    sequence_key VARCHAR(50) NOT NULL,
    prefix VARCHAR(20) NOT NULL,
    current_value BIGINT UNSIGNED NOT NULL DEFAULT 0,
    padding_length TINYINT UNSIGNED NOT NULL DEFAULT 6,
    reset_frequency ENUM('NEVER', 'DAILY', 'YEARLY') NOT NULL DEFAULT 'NEVER',
    last_reset_date DATE NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_hospital_sequence (hospital_id, sequence_key),
    CONSTRAINT fk_seq_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hospital_config (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    description VARCHAR(255) NULL,
    is_public TINYINT(1) NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_hospital_config_key (hospital_id, config_key),
    CONSTRAINT fk_config_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. AUTH, ROLES & USER MANAGEMENT (Module 10)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_code VARCHAR(50) NOT NULL UNIQUE,
    role_name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    is_system_role TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permissions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    permission_code VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_perm_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT UNSIGNED NOT NULL,
    permission_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_perm FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role_id INT UNSIGNED NOT NULL,
    email VARCHAR(100) NULL,
    phone VARCHAR(30) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    deleted_by BIGINT UNSIGNED NULL,
    INDEX idx_users_hospital_role (hospital_id, role_id),
    INDEX idx_users_phone (phone),
    CONSTRAINT fk_users_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals (id),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS doctor_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    specialization VARCHAR(100) NOT NULL,
    qualification VARCHAR(100) NOT NULL,
    medical_council_reg_no VARCHAR(100) NOT NULL,
    default_consultation_fee DECIMAL(12, 2) NOT NULL DEFAULT 500.00,
    follow_up_fee DECIMAL(12, 2) NOT NULL DEFAULT 300.00,
    follow_up_validity_days INT UNSIGNED NOT NULL DEFAULT 7,
    assigned_room_number VARCHAR(50) NULL,
    is_available_for_opd TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_doc_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_doc_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS doctor_schedules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    doctor_id BIGINT UNSIGNED NOT NULL,
    day_of_week TINYINT UNSIGNED NOT NULL COMMENT '0=Sunday, 1=Monday ... 6=Saturday',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INT UNSIGNED NOT NULL DEFAULT 15,
    max_tokens INT UNSIGNED NOT NULL DEFAULT 50,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_doc_sched (doctor_id, day_of_week),
    CONSTRAINT fk_sched_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    user_id BIGINT UNSIGNED NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id BIGINT UNSIGNED NULL,
    entity_public_id CHAR(36) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    details_json JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_hospital_created (hospital_id, created_at),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_entity (entity_name, entity_id),
    CONSTRAINT fk_audit_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. PATIENT REGISTRATION (Module 1)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS patients (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    uhid VARCHAR(30) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20) NULL,
    email VARCHAR(100) NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255) NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    aadhaar_hash VARCHAR(64) NULL COMMENT 'SHA-256 hash of Aadhaar for duplicate detection',
    abha_id VARCHAR(100) NULL COMMENT 'ABHA Address (e.g. name@abdm)',
    abha_number VARCHAR(20) NULL COMMENT '14-digit ABHA ID',
    emergency_contact_name VARCHAR(100) NULL,
    emergency_contact_relation VARCHAR(50) NULL,
    emergency_contact_phone VARCHAR(20) NULL,
    referred_by VARCHAR(150) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    deleted_by BIGINT UNSIGNED NULL,
    INDEX idx_patients_hospital (hospital_id),
    INDEX idx_patients_uhid (uhid),
    INDEX idx_patients_phone (phone),
    INDEX idx_patients_name (last_name, first_name),
    INDEX idx_patients_dob (dob),
    INDEX idx_patients_aadhaar (aadhaar_hash),
    INDEX idx_patients_abha (abha_number),
    CONSTRAINT fk_patients_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS patient_allergies (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    patient_id BIGINT UNSIGNED NOT NULL,
    allergen_type ENUM('DRUG', 'FOOD', 'ENVIRONMENTAL', 'OTHER') NOT NULL,
    allergen_name VARCHAR(150) NOT NULL,
    reaction_symptoms VARCHAR(255) NULL,
    severity ENUM('MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING') NOT NULL DEFAULT 'MODERATE',
    diagnosed_date DATE NULL,
    recorded_by BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_allergy_patient (patient_id),
    CONSTRAINT fk_allergy_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
    CONSTRAINT fk_allergy_recorder FOREIGN KEY (recorded_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. OPD QUEUE & TOKEN MANAGEMENT (Module 2)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS opd_visits (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    opd_number VARCHAR(30) NOT NULL UNIQUE COMMENT 'Global monotonic auto-increment string (no date reset)',
    patient_id BIGINT UNSIGNED NOT NULL,
    doctor_id BIGINT UNSIGNED NOT NULL,
    visit_date DATE NOT NULL,
    visit_type ENUM('NEW', 'FOLLOW_UP', 'EMERGENCY') NOT NULL DEFAULT 'NEW',
    department VARCHAR(100) NOT NULL DEFAULT 'General Medicine',
    status ENUM('WAITING', 'ENGAGED', 'COMPLETED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'WAITING',
    payment_status ENUM('PENDING', 'PAID', 'EXEMPT') NOT NULL DEFAULT 'PENDING',
    registered_by BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_opd_patient (patient_id),
    INDEX idx_opd_doctor_date (doctor_id, visit_date),
    INDEX idx_opd_status (status),
    INDEX idx_opd_date (visit_date),
    CONSTRAINT fk_opd_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
    CONSTRAINT fk_opd_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles (id),
    CONSTRAINT fk_opd_registrar FOREIGN KEY (registered_by) REFERENCES users (id),
    CONSTRAINT fk_opd_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS queue_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    opd_visit_id BIGINT UNSIGNED NOT NULL UNIQUE,
    doctor_id BIGINT UNSIGNED NOT NULL,
    token_number INT UNSIGNED NOT NULL,
    token_date DATE NOT NULL,
    status ENUM('WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED', 'CANCELLED') NOT NULL DEFAULT 'WAITING',
    called_at DATETIME NULL,
    consultation_started_at DATETIME NULL,
    completed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tokens_display (doctor_id, token_date, status),
    INDEX idx_tokens_date (token_date),
    CONSTRAINT fk_tokens_visit FOREIGN KEY (opd_visit_id) REFERENCES opd_visits (id) ON DELETE CASCADE,
    CONSTRAINT fk_tokens_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. VITAL SIGNS & INTAKE QUESTIONNAIRE (Module 3)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS vital_signs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    patient_id BIGINT UNSIGNED NOT NULL,
    opd_visit_id BIGINT UNSIGNED NULL,
    ipd_admission_id BIGINT UNSIGNED NULL,
    temperature_f DECIMAL(4, 1) NULL,
    pulse_bpm INT UNSIGNED NULL,
    blood_pressure_systolic INT UNSIGNED NULL,
    blood_pressure_diastolic INT UNSIGNED NULL,
    respiratory_rate_bpm INT UNSIGNED NULL,
    spo2_percentage INT UNSIGNED NULL,
    height_cm DECIMAL(5, 2) NULL,
    weight_kg DECIMAL(5, 2) NULL,
    bmi DECIMAL(4, 1) NULL,
    pain_scale TINYINT UNSIGNED NULL COMMENT 'Scale 0-10',
    is_abnormal TINYINT(1) NOT NULL DEFAULT 0,
    abnormal_flags_json JSON NULL COMMENT 'List of vitals breaching safe ranges',
    recorded_by BIGINT UNSIGNED NOT NULL,
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vitals_patient (patient_id),
    INDEX idx_vitals_opd (opd_visit_id),
    INDEX idx_vitals_ipd (ipd_admission_id),
    CONSTRAINT fk_vitals_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
    CONSTRAINT fk_vitals_opd FOREIGN KEY (opd_visit_id) REFERENCES opd_visits (id) ON DELETE SET NULL,
    CONSTRAINT fk_vitals_recorder FOREIGN KEY (recorded_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS intake_questionnaires (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    patient_id BIGINT UNSIGNED NOT NULL,
    opd_visit_id BIGINT UNSIGNED NOT NULL,
    chief_complaint TEXT NOT NULL,
    history_of_present_illness TEXT NULL,
    past_medical_history TEXT NULL,
    current_medications_summary TEXT NULL,
    red_flag_triggers_json JSON NULL COMMENT 'Identified emergency combinations e.g. chest pain + sweating',
    responses_json JSON NOT NULL COMMENT 'Structured question-response map',
    recorded_by BIGINT UNSIGNED NOT NULL,
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_intake_patient (patient_id),
    INDEX idx_intake_opd (opd_visit_id),
    CONSTRAINT fk_intake_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
    CONSTRAINT fk_intake_opd FOREIGN KEY (opd_visit_id) REFERENCES opd_visits (id) ON DELETE CASCADE,
    CONSTRAINT fk_intake_recorder FOREIGN KEY (recorded_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. DOCTOR CONSULTATION & ENCOUNTERS (Module 4)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS icd10_codes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    chapter VARCHAR(100) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    INDEX idx_icd10_code (code),
    FULLTEXT KEY ft_icd10_desc (description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consultations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    opd_visit_id BIGINT UNSIGNED NOT NULL UNIQUE,
    patient_id BIGINT UNSIGNED NOT NULL,
    doctor_id BIGINT UNSIGNED NOT NULL,
    subjective TEXT NULL COMMENT 'Chief complaints & patient narrative',
    objective TEXT NULL COMMENT 'Clinical physical findings & examined vitals',
    assessment TEXT NULL COMMENT 'Clinical impression & differentials',
    plan TEXT NULL COMMENT 'Treatment plan & instructions',
    clinical_notes TEXT NULL,
    follow_up_date DATE NULL,
    follow_up_instructions VARCHAR(255) NULL,
    referral_doctor_or_dept VARCHAR(150) NULL,
    status ENUM('IN_PROGRESS', 'SIGNED', 'AMENDED') NOT NULL DEFAULT 'IN_PROGRESS',
    signed_at DATETIME NULL,
    signed_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_consultations_patient (patient_id),
    INDEX idx_consultations_doctor (doctor_id),
    INDEX idx_consultations_status (status),
    CONSTRAINT fk_consult_opd FOREIGN KEY (opd_visit_id) REFERENCES opd_visits (id) ON DELETE CASCADE,
    CONSTRAINT fk_consult_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
    CONSTRAINT fk_consult_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles (id),
    CONSTRAINT fk_consult_signer FOREIGN KEY (signed_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consultation_diagnoses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    consultation_id BIGINT UNSIGNED NOT NULL,
    icd10_code_id INT UNSIGNED NULL,
    diagnosis_code VARCHAR(20) NOT NULL,
    diagnosis_name VARCHAR(255) NOT NULL,
    diagnosis_type ENUM('PROVISIONAL', 'FINAL', 'DIFFERENTIAL') NOT NULL DEFAULT 'FINAL',
    is_primary TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_diag_consultation (consultation_id),
    CONSTRAINT fk_diag_consultation FOREIGN KEY (consultation_id) REFERENCES consultations (id) ON DELETE CASCADE,
    CONSTRAINT fk_diag_icd10 FOREIGN KEY (icd10_code_id) REFERENCES icd10_codes (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. E-PRESCRIPTION & PHARMACY MANAGEMENT (Module 5)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pharmacy_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    item_code VARCHAR(50) NOT NULL UNIQUE,
    generic_name VARCHAR(150) NOT NULL,
    brand_name VARCHAR(150) NOT NULL,
    drug_form ENUM('TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'OINTMENT', 'DROPS', 'INHALER', 'OTHER') NOT NULL,
    strength VARCHAR(50) NOT NULL,
    default_route VARCHAR(50) NOT NULL DEFAULT 'ORAL',
    unit_of_measure VARCHAR(30) NOT NULL DEFAULT 'STRIP',
    hsn_code VARCHAR(20) NULL,
    unit_mrp DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    purchase_rate DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    reorder_level INT UNSIGNED NOT NULL DEFAULT 50,
    current_stock INT UNSIGNED NOT NULL DEFAULT 0,
    is_narcotic TINYINT(1) NOT NULL DEFAULT 0,
    is_antibiotic TINYINT(1) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    deleted_by BIGINT UNSIGNED NULL,
    INDEX idx_pharm_item_code (item_code),
    INDEX idx_pharm_generic (generic_name),
    INDEX idx_pharm_brand (brand_name),
    CONSTRAINT fk_pharm_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pharmacy_batches (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    item_id BIGINT UNSIGNED NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    expiry_date DATE NOT NULL,
    available_quantity INT UNSIGNED NOT NULL DEFAULT 0,
    unit_purchase_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    unit_sale_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    received_date DATE NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_item_batch (item_id, batch_number),
    INDEX idx_batch_expiry (expiry_date),
    CONSTRAINT fk_batch_item FOREIGN KEY (item_id) REFERENCES pharmacy_items (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS prescriptions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    prescription_number VARCHAR(30) NOT NULL UNIQUE,
    patient_id BIGINT UNSIGNED NOT NULL,
    consultation_id BIGINT UNSIGNED NULL,
    doctor_id BIGINT UNSIGNED NOT NULL,
    status ENUM('PENDING', 'PARTIALLY_DISPENSED', 'DISPENSED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    general_instructions TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rx_patient (patient_id),
    INDEX idx_rx_consultation (consultation_id),
    INDEX idx_rx_doctor (doctor_id),
    INDEX idx_rx_status (status),
    CONSTRAINT fk_rx_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
    CONSTRAINT fk_rx_consultation FOREIGN KEY (consultation_id) REFERENCES consultations (id) ON DELETE SET NULL,
    CONSTRAINT fk_rx_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS prescription_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    prescription_id BIGINT UNSIGNED NOT NULL,
    item_id BIGINT UNSIGNED NULL COMMENT 'Null if off-formulary custom drug',
    drug_name_custom VARCHAR(150) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency ENUM('OD', 'BD', 'TID', 'QID', 'PRN', 'STAT', 'OTHER') NOT NULL DEFAULT 'BD',
    route ENUM('ORAL', 'IV', 'IM', 'SC', 'TOPICAL', 'INHALATION', 'OTHER') NOT NULL DEFAULT 'ORAL',
    duration_days INT UNSIGNED NOT NULL DEFAULT 5,
    quantity_prescribed INT UNSIGNED NOT NULL,
    food_relation ENUM('BEFORE_FOOD', 'AFTER_FOOD', 'WITH_FOOD', 'EMPTY_STOMACH', 'NO_RELATION') NOT NULL DEFAULT 'AFTER_FOOD',
    special_instructions VARCHAR(255) NULL,
    is_off_formulary TINYINT(1) NOT NULL DEFAULT 0,
    off_formulary_reason VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rx_items_prescription (prescription_id),
    CONSTRAINT fk_rx_item_header FOREIGN KEY (prescription_id) REFERENCES prescriptions (id) ON DELETE CASCADE,
    CONSTRAINT fk_rx_item_formulary FOREIGN KEY (item_id) REFERENCES pharmacy_items (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pharmacy_dispensations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    dispensation_number VARCHAR(30) NOT NULL UNIQUE,
    prescription_id BIGINT UNSIGNED NOT NULL,
    patient_id BIGINT UNSIGNED NOT NULL,
    dispensed_by BIGINT UNSIGNED NOT NULL COMMENT 'Pharmacist / Chemist user',
    invoice_id BIGINT UNSIGNED NULL COMMENT 'Linked pharmacy invoice',
    status ENUM('COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'COMPLETED',
    remarks TEXT NULL,
    dispensed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_disp_rx (prescription_id),
    INDEX idx_disp_patient (patient_id),
    INDEX idx_disp_pharmacist (dispensed_by),
    CONSTRAINT fk_disp_rx FOREIGN KEY (prescription_id) REFERENCES prescriptions (id),
    CONSTRAINT fk_disp_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
    CONSTRAINT fk_disp_user FOREIGN KEY (dispensed_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pharmacy_dispensation_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dispensation_id BIGINT UNSIGNED NOT NULL,
    prescription_item_id BIGINT UNSIGNED NOT NULL,
    item_id BIGINT UNSIGNED NOT NULL,
    batch_id BIGINT UNSIGNED NOT NULL,
    quantity_dispensed INT UNSIGNED NOT NULL,
    unit_sale_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    is_substitute TINYINT(1) NOT NULL DEFAULT 0,
    substitute_reason VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_disp_items_header (dispensation_id),
    CONSTRAINT fk_disp_item_header FOREIGN KEY (dispensation_id) REFERENCES pharmacy_dispensations (id) ON DELETE CASCADE,
    CONSTRAINT fk_disp_item_rx_item FOREIGN KEY (prescription_item_id) REFERENCES prescription_items (id),
    CONSTRAINT fk_disp_item_master FOREIGN KEY (item_id) REFERENCES pharmacy_items (id),
    CONSTRAINT fk_disp_item_batch FOREIGN KEY (batch_id) REFERENCES pharmacy_batches (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. IPD ADMISSION, STAY & DISCHARGE (Module 6)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS wards (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    ward_code VARCHAR(30) NOT NULL UNIQUE,
    ward_name VARCHAR(100) NOT NULL,
    floor_number VARCHAR(20) NOT NULL,
    gender_restriction ENUM('ANY', 'MALE_ONLY', 'FEMALE_ONLY', 'PAEDIATRIC') NOT NULL DEFAULT 'ANY',
    total_beds INT UNSIGNED NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_ward_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rooms (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    ward_id INT UNSIGNED NOT NULL,
    room_number VARCHAR(30) NOT NULL,
    room_type ENUM('GENERAL', 'SEMI_PRIVATE', 'PRIVATE', 'ICU', 'NICU', 'DELUXE') NOT NULL DEFAULT 'GENERAL',
    daily_tariff DECIMAL(12, 2) NOT NULL DEFAULT 800.00,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    deleted_by BIGINT UNSIGNED NULL,
    UNIQUE KEY uq_ward_room (ward_id, room_number),
    CONSTRAINT fk_room_ward FOREIGN KEY (ward_id) REFERENCES wards (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS beds (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    room_id INT UNSIGNED NOT NULL,
    bed_number VARCHAR(30) NOT NULL,
    status ENUM('AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE', 'RESERVED') NOT NULL DEFAULT 'AVAILABLE',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    deleted_by BIGINT UNSIGNED NULL,
    UNIQUE KEY uq_room_bed (room_id, bed_number),
    INDEX idx_beds_status (status),
    CONSTRAINT fk_bed_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ipd_admissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    ipd_number VARCHAR(30) NOT NULL UNIQUE COMMENT 'Global monotonic auto-increment string per admission',
    patient_id BIGINT UNSIGNED NOT NULL,
    attending_doctor_id BIGINT UNSIGNED NOT NULL,
    current_bed_id BIGINT UNSIGNED NOT NULL,
    admission_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    discharge_date DATETIME NULL,
    admission_type ENUM('ELECTIVE', 'EMERGENCY', 'TRANSFER') NOT NULL DEFAULT 'ELECTIVE',
    provisional_diagnosis TEXT NOT NULL,
    advance_amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status ENUM('ADMITTED', 'DISCHARGED', 'LAMA', 'DECEASED', 'TRANSFERRED') NOT NULL DEFAULT 'ADMITTED',
    discharge_type ENUM('NORMAL', 'AGAINST_MEDICAL_ADVICE', 'REFERRED', 'EXPIRED') NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ipd_patient (patient_id),
    INDEX idx_ipd_doctor (attending_doctor_id),
    INDEX idx_ipd_status (status),
    INDEX idx_ipd_bed (current_bed_id),
    CONSTRAINT fk_ipd_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
    CONSTRAINT fk_ipd_doctor FOREIGN KEY (attending_doctor_id) REFERENCES doctor_profiles (id),
    CONSTRAINT fk_ipd_bed FOREIGN KEY (current_bed_id) REFERENCES beds (id),
    CONSTRAINT fk_ipd_creator FOREIGN KEY (created_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ipd_bed_allocations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    admission_id BIGINT UNSIGNED NOT NULL,
    bed_id BIGINT UNSIGNED NOT NULL,
    allocated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    released_at DATETIME NULL,
    daily_rate DECIMAL(12, 2) NOT NULL,
    transfer_reason VARCHAR(255) NULL,
    allocated_by BIGINT UNSIGNED NOT NULL,
    released_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_alloc_admission (admission_id),
    INDEX idx_alloc_bed (bed_id),
    CONSTRAINT fk_alloc_admission FOREIGN KEY (admission_id) REFERENCES ipd_admissions (id) ON DELETE CASCADE,
    CONSTRAINT fk_alloc_bed FOREIGN KEY (bed_id) REFERENCES beds (id),
    CONSTRAINT fk_alloc_by FOREIGN KEY (allocated_by) REFERENCES users (id),
    CONSTRAINT fk_released_by FOREIGN KEY (released_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ipd_daily_notes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    admission_id BIGINT UNSIGNED NOT NULL,
    doctor_id BIGINT UNSIGNED NOT NULL,
    note_datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subjective_notes TEXT NULL,
    objective_findings TEXT NULL,
    assessment_notes TEXT NULL,
    plan_notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ipd_notes_admission (admission_id),
    CONSTRAINT fk_notes_admission FOREIGN KEY (admission_id) REFERENCES ipd_admissions (id) ON DELETE CASCADE,
    CONSTRAINT fk_notes_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ipd_nurse_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    admission_id BIGINT UNSIGNED NOT NULL,
    nurse_id BIGINT UNSIGNED NOT NULL,
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    vital_signs_id BIGINT UNSIGNED NULL,
    medication_administered VARCHAR(255) NULL,
    dosage_given VARCHAR(50) NULL,
    iv_fluids_administered VARCHAR(150) NULL,
    nurse_notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nurse_admission (admission_id),
    CONSTRAINT fk_nurse_rec_admission FOREIGN KEY (admission_id) REFERENCES ipd_admissions (id) ON DELETE CASCADE,
    CONSTRAINT fk_nurse_rec_user FOREIGN KEY (nurse_id) REFERENCES users (id),
    CONSTRAINT fk_nurse_rec_vitals FOREIGN KEY (vital_signs_id) REFERENCES vital_signs (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ipd_procedures (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    admission_id BIGINT UNSIGNED NOT NULL,
    procedure_name VARCHAR(150) NOT NULL,
    procedure_code VARCHAR(50) NULL,
    performed_by_doctor_id BIGINT UNSIGNED NOT NULL,
    procedure_datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INT UNSIGNED NULL,
    anaesthetist_doctor_id BIGINT UNSIGNED NULL,
    notes TEXT NULL,
    tariff_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_proc_admission (admission_id),
    CONSTRAINT fk_proc_admission FOREIGN KEY (admission_id) REFERENCES ipd_admissions (id) ON DELETE CASCADE,
    CONSTRAINT fk_proc_doctor FOREIGN KEY (performed_by_doctor_id) REFERENCES doctor_profiles (id),
    CONSTRAINT fk_proc_anaesthetist FOREIGN KEY (anaesthetist_doctor_id) REFERENCES doctor_profiles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ipd_discharge_summaries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    admission_id BIGINT UNSIGNED NOT NULL UNIQUE,
    doctor_id BIGINT UNSIGNED NOT NULL,
    final_diagnosis TEXT NOT NULL,
    hospital_course TEXT NOT NULL,
    procedures_performed TEXT NULL,
    condition_at_discharge VARCHAR(150) NOT NULL,
    discharge_vitals_json JSON NULL,
    discharge_medications_json JSON NOT NULL,
    follow_up_instructions TEXT NOT NULL,
    emergency_warning_signs TEXT NOT NULL,
    signed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_disch_admission FOREIGN KEY (admission_id) REFERENCES ipd_admissions (id) ON DELETE CASCADE,
    CONSTRAINT fk_disch_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. PATHOLOGY & LABORATORY (Module 7)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS lab_categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    category_code VARCHAR(30) NOT NULL UNIQUE,
    category_name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_labcat_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lab_tests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    category_id INT UNSIGNED NOT NULL,
    test_code VARCHAR(50) NOT NULL UNIQUE,
    test_name VARCHAR(150) NOT NULL,
    sample_type ENUM('EDTA_BLOOD', 'SERUM', 'PLASMA', 'URINE', 'STOOL', 'CSF', 'SWAB', 'SPUTUM', 'OTHER') NOT NULL,
    container_type VARCHAR(50) NOT NULL DEFAULT 'Vial',
    turnaround_time_hours INT UNSIGNED NOT NULL DEFAULT 24,
    standard_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    deleted_by BIGINT UNSIGNED NULL,
    INDEX idx_labtest_code (test_code),
    INDEX idx_labtest_category (category_id),
    CONSTRAINT fk_test_category FOREIGN KEY (category_id) REFERENCES lab_categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lab_test_parameters (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    test_id BIGINT UNSIGNED NOT NULL,
    parameter_code VARCHAR(50) NOT NULL,
    parameter_name VARCHAR(150) NOT NULL,
    unit VARCHAR(30) NULL,
    data_type ENUM('NUMERIC', 'TEXT', 'OPTIONS') NOT NULL DEFAULT 'NUMERIC',
    options_csv VARCHAR(255) NULL,
    default_min DECIMAL(10, 3) NULL,
    default_max DECIMAL(10, 3) NULL,
    panic_min DECIMAL(10, 3) NULL,
    panic_max DECIMAL(10, 3) NULL,
    display_order INT UNSIGNED NOT NULL DEFAULT 1,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_test_parameter (test_id, parameter_code),
    CONSTRAINT fk_param_test FOREIGN KEY (test_id) REFERENCES lab_tests (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lab_orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    order_number VARCHAR(30) NOT NULL UNIQUE,
    patient_id BIGINT UNSIGNED NOT NULL,
    opd_visit_id BIGINT UNSIGNED NULL,
    ipd_admission_id BIGINT UNSIGNED NULL,
    ordering_doctor_id BIGINT UNSIGNED NOT NULL,
    status ENUM('ORDERED', 'SAMPLE_COLLECTED', 'IN_ANALYSIS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ORDERED',
    sample_collected_at DATETIME NULL,
    sample_collected_by BIGINT UNSIGNED NULL,
    clinical_history_notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_lab_order_patient (patient_id),
    INDEX idx_lab_order_status (status),
    INDEX idx_lab_order_doctor (ordering_doctor_id),
    CONSTRAINT fk_laborder_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
    CONSTRAINT fk_laborder_opd FOREIGN KEY (opd_visit_id) REFERENCES opd_visits (id) ON DELETE SET NULL,
    CONSTRAINT fk_laborder_ipd FOREIGN KEY (ipd_admission_id) REFERENCES ipd_admissions (id) ON DELETE SET NULL,
    CONSTRAINT fk_laborder_doctor FOREIGN KEY (ordering_doctor_id) REFERENCES doctor_profiles (id),
    CONSTRAINT fk_laborder_collector FOREIGN KEY (sample_collected_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lab_order_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    test_id BIGINT UNSIGNED NOT NULL,
    test_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status ENUM('PENDING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_loi_order (order_id),
    CONSTRAINT fk_loi_order FOREIGN KEY (order_id) REFERENCES lab_orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_loi_test FOREIGN KEY (test_id) REFERENCES lab_tests (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lab_order_results (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_item_id BIGINT UNSIGNED NOT NULL,
    parameter_id BIGINT UNSIGNED NOT NULL,
    result_value VARCHAR(100) NOT NULL,
    is_abnormal TINYINT(1) NOT NULL DEFAULT 0,
    is_panic TINYINT(1) NOT NULL DEFAULT 0,
    remarks VARCHAR(255) NULL,
    performed_by BIGINT UNSIGNED NOT NULL,
    performed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_lor_order_item (order_item_id),
    CONSTRAINT fk_lor_order_item FOREIGN KEY (order_item_id) REFERENCES lab_order_items (id) ON DELETE CASCADE,
    CONSTRAINT fk_lor_parameter FOREIGN KEY (parameter_id) REFERENCES lab_test_parameters (id),
    CONSTRAINT fk_lor_technician FOREIGN KEY (performed_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lab_reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    order_id BIGINT UNSIGNED NOT NULL UNIQUE,
    verified_by_doctor_id BIGINT UNSIGNED NOT NULL COMMENT 'Doctor / Pathologist who verified results',
    verification_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pathologist_remarks TEXT NULL,
    report_pdf_path VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_labrep_order FOREIGN KEY (order_id) REFERENCES lab_orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_labrep_doctor FOREIGN KEY (verified_by_doctor_id) REFERENCES doctor_profiles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. MULTI-POINT BILLING & INVOICING (Module 8)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tariffs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    service_code VARCHAR(50) NOT NULL UNIQUE,
    service_name VARCHAR(150) NOT NULL,
    category ENUM('CONSULTATION', 'BED_RENT', 'NURSING', 'PROCEDURE', 'LAB', 'PHARMACY', 'OT', 'ANAESTHESIA', 'OXYGEN', 'CONSUMABLE', 'OTHER') NOT NULL,
    base_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    deleted_by BIGINT UNSIGNED NULL,
    INDEX idx_tariff_cat (category),
    INDEX idx_tariff_code (service_code),
    CONSTRAINT fk_tariff_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    invoice_number VARCHAR(30) NOT NULL UNIQUE,
    patient_id BIGINT UNSIGNED NOT NULL,
    opd_visit_id BIGINT UNSIGNED NULL,
    ipd_admission_id BIGINT UNSIGNED NULL,
    invoice_type ENUM('OPD_CONSULTATION', 'PHARMACY', 'LAB', 'IPD_FINAL') NOT NULL,
    status ENUM('DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'UNPAID',
    subtotal_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount_reason VARCHAR(255) NULL,
    discount_approved_by BIGINT UNSIGNED NULL,
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    net_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    balance_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_by BIGINT UNSIGNED NOT NULL,
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_inv_patient (patient_id),
    INDEX idx_inv_opd (opd_visit_id),
    INDEX idx_inv_ipd (ipd_admission_id),
    INDEX idx_inv_type (invoice_type),
    INDEX idx_inv_status (status),
    INDEX idx_inv_number (invoice_number),
    CONSTRAINT fk_inv_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
    CONSTRAINT fk_inv_opd FOREIGN KEY (opd_visit_id) REFERENCES opd_visits (id) ON DELETE SET NULL,
    CONSTRAINT fk_inv_ipd FOREIGN KEY (ipd_admission_id) REFERENCES ipd_admissions (id) ON DELETE SET NULL,
    CONSTRAINT fk_inv_creator FOREIGN KEY (created_by) REFERENCES users (id),
    CONSTRAINT fk_inv_discount_approver FOREIGN KEY (discount_approved_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoice_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT UNSIGNED NOT NULL,
    item_type ENUM(
        'OPD_CONSULTATION',
        'BED_RENT',
        'DOCTOR_VISIT',
        'NURSING',
        'PROCEDURE',
        'PHARMACY_ITEM',
        'LAB_TEST',
        'OT',
        'ANAESTHESIA',
        'OXYGEN',
        'CONSUMABLE',
        'OTHER'
    ) NOT NULL,
    reference_id BIGINT UNSIGNED NULL COMMENT 'FK to test_id, item_id, procedure_id, bed_allocation_id',
    item_name VARCHAR(200) NOT NULL,
    quantity DECIMAL(8, 2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    net_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_inv_items_header (invoice_id),
    CONSTRAINT fk_inv_item_header FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    payment_number VARCHAR(30) NOT NULL UNIQUE,
    invoice_id BIGINT UNSIGNED NOT NULL,
    patient_id BIGINT UNSIGNED NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method ENUM('CASH', 'UPI', 'CARD', 'NET_BANKING', 'CHEQUE') NOT NULL DEFAULT 'CASH',
    transaction_reference VARCHAR(100) NULL COMMENT 'UPI UTR, Card Auth Code, or Cheque Number',
    notes VARCHAR(255) NULL,
    received_by BIGINT UNSIGNED NOT NULL,
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pay_invoice (invoice_id),
    INDEX idx_pay_patient (patient_id),
    INDEX idx_pay_method (payment_method),
    INDEX idx_pay_date (payment_date),
    CONSTRAINT fk_pay_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id),
    CONSTRAINT fk_pay_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
    CONSTRAINT fk_pay_receiver FOREIGN KEY (received_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. CDSS & CLINICAL SAFETY (Module 9)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cdss_ddi_rules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    drug_a_generic VARCHAR(150) NOT NULL,
    drug_b_generic VARCHAR(150) NOT NULL,
    severity ENUM('CONTRAINDICATED', 'MAJOR', 'MODERATE', 'MINOR') NOT NULL,
    clinical_mechanism TEXT NOT NULL,
    management_advice TEXT NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ddi_drugs (drug_a_generic, drug_b_generic)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cdss_vital_rules (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    vital_code ENUM('BP_SYS', 'BP_DIA', 'SPO2', 'PULSE', 'TEMP', 'RESP') NOT NULL,
    min_threshold DECIMAL(6, 2) NULL,
    max_threshold DECIMAL(6, 2) NULL,
    severity ENUM('WARNING', 'CRITICAL') NOT NULL DEFAULT 'WARNING',
    alert_title VARCHAR(150) NOT NULL,
    alert_message VARCHAR(255) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vital_rule_code (vital_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cdss_clinical_rules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    rule_code VARCHAR(50) NOT NULL UNIQUE,
    trigger_type ENUM('QUESTIONNAIRE', 'ICD10_COMBO', 'ALLERGY') NOT NULL,
    condition_json JSON NOT NULL COMMENT 'JSON rules matching symptom combinations or ICD codes',
    severity ENUM('INFO', 'WARNING', 'CRITICAL') NOT NULL DEFAULT 'WARNING',
    alert_title VARCHAR(150) NOT NULL,
    alert_message TEXT NOT NULL,
    recommended_actions_json JSON NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cdss_alerts_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT UNSIGNED NOT NULL DEFAULT 1,
    patient_id BIGINT UNSIGNED NOT NULL,
    doctor_id BIGINT UNSIGNED NOT NULL,
    consultation_id BIGINT UNSIGNED NULL,
    opd_visit_id BIGINT UNSIGNED NULL,
    ipd_admission_id BIGINT UNSIGNED NULL,
    rule_type ENUM('DDI', 'VITALS', 'CLINICAL_COMBO', 'ALLERGY') NOT NULL,
    rule_reference_id BIGINT UNSIGNED NULL,
    severity ENUM('INFO', 'WARNING', 'CRITICAL', 'CONTRAINDICATED') NOT NULL,
    alert_title VARCHAR(150) NOT NULL,
    alert_text TEXT NOT NULL,
    doctor_action ENUM('ACKNOWLEDGED', 'OVERRIDDEN', 'IGNORED') NOT NULL DEFAULT 'ACKNOWLEDGED',
    override_reason VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_alerts_patient (patient_id),
    INDEX idx_alerts_doctor (doctor_id),
    INDEX idx_alerts_consultation (consultation_id),
    CONSTRAINT fk_alert_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
    CONSTRAINT fk_alert_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles (id),
    CONSTRAINT fk_alert_consultation FOREIGN KEY (consultation_id) REFERENCES consultations (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. INITIAL SYSTEM SEED DATA (ROLES & DEFAULT SEQUENCES)
-- ----------------------------------------------------------------------------

-- Default Hospital
INSERT INTO hospitals (id, public_id, hospital_code, name, address_line1, city, state, postal_code, phone)
VALUES (1, UUID(), 'BSH01', 'Bright Solutions Multispeciality Hospital', '100 Medical Center Blvd', 'Mumbai', 'Maharashtra', '400001', '+91 22 2500 0000')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Standard System Roles
INSERT INTO roles (id, role_code, role_name, description, is_system_role) VALUES
(1, 'SUPER_ADMIN', 'Super Administrator', 'Full system access and tenant management', 1),
(2, 'HOSPITAL_ADMIN', 'Hospital Administrator', 'Hospital config, tariffs, staff, reports', 1),
(3, 'RECEPTIONIST', 'Receptionist', 'Patient registration, OPD queue ticketing, OPD fee collection', 1),
(4, 'NURSE', 'Nurse', 'Vitals intake, triage questionnaires, IPD medication records', 1),
(5, 'DOCTOR', 'Doctor', 'Clinical consultation, SOAP notes, e-prescribing, lab orders, IPD rounds', 1),
(6, 'PHARMACIST', 'Pharmacist / Chemist', 'Prescription queue, medication dispensing, pharmacy billing', 1),
(7, 'LAB_TECHNICIAN', 'Lab Technician', 'Sample collection, lab parameter result entry, abnormal flagging', 1),
(8, 'BILLING_CLERK', 'Billing Clerk', 'Multi-point billing, IPD consolidated invoice settlement, receipt printing', 1)
ON DUPLICATE KEY UPDATE role_name=VALUES(role_name);

-- Default Number Sequences
INSERT INTO system_sequences (hospital_id, sequence_key, prefix, current_value, padding_length, reset_frequency) VALUES
(1, 'UHID', 'BS', 1000, 6, 'NEVER'),
(1, 'OPD_NUMBER', 'OPD', 1000, 6, 'NEVER'),
(1, 'IPD_NUMBER', 'IPD', 500, 5, 'NEVER'),
(1, 'INVOICE_OPD', 'INV-OPD', 100, 6, 'YEARLY'),
(1, 'INVOICE_PHARMACY', 'INV-PHM', 100, 6, 'YEARLY'),
(1, 'INVOICE_LAB', 'INV-LAB', 100, 6, 'YEARLY'),
(1, 'INVOICE_IPD', 'INV-IPD', 50, 6, 'YEARLY'),
(1, 'PRESCRIPTION', 'RX', 1000, 6, 'NEVER'),
(1, 'LAB_ORDER', 'LAB', 1000, 6, 'NEVER'),
(1, 'DISPENSATION', 'DSP', 1000, 6, 'NEVER'),
(1, 'PAYMENT', 'RCP', 1000, 6, 'YEARLY')
ON DUPLICATE KEY UPDATE prefix=VALUES(prefix);

-- Standard Vitals Safety Thresholds (CDSS)
INSERT INTO cdss_vital_rules (hospital_id, vital_code, min_threshold, max_threshold, severity, alert_title, alert_message) VALUES
(1, 'BP_SYS', 90.00, 180.00, 'CRITICAL', 'Critical Blood Pressure', 'Systolic Blood Pressure outside safe parameters (<90 or >180 mmHg)'),
(1, 'BP_DIA', 60.00, 120.00, 'CRITICAL', 'Critical Diastolic Pressure', 'Diastolic Blood Pressure outside safe parameters (<60 or >120 mmHg)'),
(1, 'SPO2', 92.00, 100.00, 'CRITICAL', 'Hypoxia Alert', 'Oxygen saturation below 92%'),
(1, 'PULSE', 50.00, 120.00, 'WARNING', 'Abnormal Heart Rate', 'Pulse rate abnormal (<50 bpm or >120 bpm)'),
(1, 'TEMP', 96.00, 102.00, 'WARNING', 'Hyperpyrexia Warning', 'Body temperature exceeds 102.0°F')
ON DUPLICATE KEY UPDATE alert_title=VALUES(alert_title);

SET FOREIGN_KEY_CHECKS = 1;
