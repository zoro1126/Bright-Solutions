-- ============================================================================
-- CLINIC MANAGEMENT SYSTEM (ClinicOS) - MySQL 8.0 RELATIONAL SCHEMA DDL
-- Semester 6 Software Engineering Methodology (SEM) College Assignment
-- Database Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================================

CREATE DATABASE IF NOT EXISTS clinic_os_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE clinic_os_db;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bill_items;
DROP TABLE IF EXISTS bills;
DROP TABLE IF EXISTS prescription_items;
DROP TABLE IF EXISTS prescriptions;
DROP TABLE IF EXISTS drug_formulary;
DROP TABLE IF EXISTS deterministic_insights;
DROP TABLE IF EXISTS external_reports;
DROP TABLE IF EXISTS intake_questionnaires;
DROP TABLE IF EXISTS vital_signs;
DROP TABLE IF EXISTS visits;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 1. USERS & ROLES TABLE
-- Stores staff credentials, role-based access permissions, and profiles.
-- ============================================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('RECEPTIONIST', 'DOCTOR', 'CASHIER', 'ADMIN') NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_active (is_active)
) ENGINE=InnoDB;

-- ============================================================================
-- 2. PATIENTS MASTER TABLE
-- Master patient index with Unique Hospital Identification (UHID).
-- ============================================================================
CREATE TABLE patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uhid VARCHAR(30) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    dob DATE NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NULL,
    emergency_contact VARCHAR(50) NOT NULL,
    address TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_patient_uhid (uhid),
    INDEX idx_patient_phone (phone),
    INDEX idx_patient_name (last_name, first_name)
) ENGINE=InnoDB;

-- ============================================================================
-- 3. VISITS TABLE (ENCOUNTER HEADER)
-- Encapsulates a single outpatient encounter from registration to discharge.
-- ============================================================================
CREATE TABLE visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NULL,
    receptionist_id INT NOT NULL,
    visit_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    queue_token VARCHAR(20) NOT NULL,
    status ENUM('REGISTERED', 'TRIAGED', 'IN_CONSULTATION', 'CONSULTED', 'BILLED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'REGISTERED',
    chief_complaint TEXT NULL,
    conclusion_notes TEXT NULL,
    conclusion_signed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_visit_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_visit_doctor FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_visit_receptionist FOREIGN KEY (receptionist_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_visit_token (queue_token),
    INDEX idx_visit_status (status),
    INDEX idx_visit_date (visit_date)
) ENGINE=InnoDB;

-- ============================================================================
-- 4. VITAL SIGNS TABLE
-- Triage metrics measured at reception desk before physician consultation.
-- ============================================================================
CREATE TABLE vital_signs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL,
    systolic_bp INT NOT NULL COMMENT 'Systolic Blood Pressure (mmHg)',
    diastolic_bp INT NOT NULL COMMENT 'Diastolic Blood Pressure (mmHg)',
    pulse_rate INT NOT NULL COMMENT 'Heart Rate (bpm)',
    temperature_f DECIMAL(4, 1) NOT NULL COMMENT 'Body Temperature (Fahrenheit)',
    resp_rate INT NOT NULL DEFAULT 16 COMMENT 'Respiratory Rate (breaths/min)',
    spo2_pct INT NOT NULL COMMENT 'Blood Oxygen Saturation (%)',
    weight_kg DECIMAL(5, 2) NOT NULL COMMENT 'Body Weight (kg)',
    height_cm DECIMAL(5, 2) NOT NULL COMMENT 'Body Height (cm)',
    bmi DECIMAL(4, 1) NOT NULL COMMENT 'Body Mass Index (kg/m2)',
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vital_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_vital_visit (visit_id)
) ENGINE=InnoDB;

-- ============================================================================
-- 5. INTAKE QUESTIONNAIRES TABLE
-- Rapid intake questionnaire captured with speech-to-text (voice enabled).
-- ============================================================================
CREATE TABLE intake_questionnaires (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL,
    voice_audio_url VARCHAR(500) NULL COMMENT 'URI to raw audio recording',
    transcript_text TEXT NULL COMMENT 'Speech-to-text raw transcript',
    primary_symptom VARCHAR(255) NOT NULL,
    duration_days INT NOT NULL DEFAULT 1,
    severity_scale INT NOT NULL DEFAULT 5 COMMENT 'Visual Analogue Scale 1-10',
    known_allergies TEXT NULL COMMENT 'Comma-separated allergy tags',
    onset_notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_intake_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_intake_visit (visit_id)
) ENGINE=InnoDB;

-- ============================================================================
-- 6. EXTERNAL REPORTS TABLE
-- External diagnostic files (DICOM X-rays/CT, ECG traces, Lab PDF reports).
-- ============================================================================
CREATE TABLE external_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL,
    patient_id INT NOT NULL,
    report_type ENUM('DICOM', 'ECG', 'LAB_PDF', 'XRAY', 'OTHER') NOT NULL,
    modality VARCHAR(50) NOT NULL COMMENT 'e.g. 12-Lead ECG, Chest PA, CBC',
    file_path VARCHAR(500) NOT NULL COMMENT 'Relative storage or cloud bucket key',
    file_size_mb DECIMAL(5, 2) NOT NULL,
    upload_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    findings_summary TEXT NULL,
    CONSTRAINT fk_report_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_report_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_report_visit (visit_id),
    INDEX idx_report_patient (patient_id),
    INDEX idx_report_type (report_type)
) ENGINE=InnoDB;

-- ============================================================================
-- 7. DETERMINISTIC CLINICAL INSIGHTS TABLE
-- Deterministic rules engine findings (HTN staging, allergy contraindications).
-- ============================================================================
CREATE TABLE deterministic_insights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL,
    rule_code VARCHAR(50) NOT NULL COMMENT 'e.g. RULE_HTN_STAGE1, RULE_ALLERGY_PEN',
    severity_level ENUM('INFO', 'WARNING', 'CRITICAL') NOT NULL,
    category VARCHAR(50) NOT NULL COMMENT 'VITALS, DRUG_INTERACTION, SYMPTOM',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    is_reviewed TINYINT(1) NOT NULL DEFAULT 0,
    is_signed TINYINT(1) NOT NULL DEFAULT 0,
    doctor_override_notes TEXT NULL,
    evaluated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_insight_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_insight_visit (visit_id),
    INDEX idx_insight_severity (severity_level)
) ENGINE=InnoDB;

-- ============================================================================
-- 8. DRUG FORMULARY TABLE
-- Approved clinic formulary with safety constraints and contraindications.
-- ============================================================================
CREATE TABLE drug_formulary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_name VARCHAR(100) NOT NULL,
    generic_name VARCHAR(100) NOT NULL,
    dosage_form ENUM('TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'OINTMENT', 'DROPS') NOT NULL,
    strength VARCHAR(50) NOT NULL,
    standard_dosage VARCHAR(100) NOT NULL,
    contraindications TEXT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    INDEX idx_formulary_generic (generic_name),
    INDEX idx_formulary_brand (brand_name)
) ENGINE=InnoDB;

-- ============================================================================
-- 9. PRESCRIPTIONS TABLE (HEADER)
-- Outpatient electronic prescription record signed by the attending doctor.
-- ============================================================================
CREATE TABLE prescriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL,
    doctor_id INT NOT NULL,
    issue_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    general_instructions TEXT NULL,
    status ENUM('DRAFT', 'FINALIZED', 'DISPENSED') NOT NULL DEFAULT 'FINALIZED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rx_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rx_doctor FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_rx_visit (visit_id)
) ENGINE=InnoDB;

-- ============================================================================
-- 10. PRESCRIPTION ITEMS TABLE
-- Individual medications and dosing directions linked to the formulary.
-- ============================================================================
CREATE TABLE prescription_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prescription_id INT NOT NULL,
    drug_id INT NOT NULL,
    dosage VARCHAR(50) NOT NULL COMMENT 'e.g. 500mg, 1 tablet',
    frequency VARCHAR(50) NOT NULL COMMENT 'e.g. TID (Three times a day)',
    duration_days INT NOT NULL,
    special_instructions VARCHAR(255) NULL COMMENT 'e.g. Take after meals',
    CONSTRAINT fk_rxi_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rxi_drug FOREIGN KEY (drug_id) REFERENCES drug_formulary(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_rxi_prescription (prescription_id)
) ENGINE=InnoDB;

-- ============================================================================
-- 11. BILLS TABLE (INVOICE HEADER)
-- Itemized financial invoice for consultation, diagnostic, and clinic services.
-- ============================================================================
CREATE TABLE bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL,
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
    INDEX idx_bill_visit (visit_id),
    INDEX idx_bill_status (payment_status)
) ENGINE=InnoDB;

-- ============================================================================
-- 12. BILL ITEMS TABLE
-- Specific line charges for OPD fees, diagnostics, and procedures.
-- ============================================================================
CREATE TABLE bill_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    service_code VARCHAR(50) NOT NULL COMMENT 'e.g. OPD-CONSULT, ECG-12L, DICOM-ARCHIVE',
    description VARCHAR(255) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_price DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_bi_bill FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_bi_bill (bill_id)
) ENGINE=InnoDB;

-- ============================================================================
-- 13. PAYMENTS TABLE
-- Transaction audit ledger recording payment receipts across payment modes.
-- ============================================================================
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    payment_mode ENUM('CASH', 'UPI', 'CARD', 'INSURANCE_DIRECT') NOT NULL,
    transaction_ref VARCHAR(100) NOT NULL COMMENT 'UPI ref / Bank auth code / Cash receipt no',
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('SUCCESS', 'PENDING', 'FAILED') NOT NULL DEFAULT 'SUCCESS',
    payment_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_bill FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_payment_bill (bill_id),
    INDEX idx_payment_ref (transaction_ref)
) ENGINE=InnoDB;

-- ============================================================================
-- SAMPLE SEED DATA FOR DEMONSTRATION & TESTING
-- ============================================================================
INSERT INTO users (id, username, password_hash, full_name, role, email, phone) VALUES
(1, 'receptionist_anita', '$2b$12$e6y5X...', 'Anita Sharma', 'RECEPTIONIST', 'anita@clinic.com', '+919876543210'),
(2, 'dr_kulkarni', '$2b$12$w3r9T...', 'Dr. Vikram Kulkarni, MD', 'DOCTOR', 'vikram@clinic.com', '+919876543211'),
(3, 'cashier_rahul', '$2b$12$p8u1Z...', 'Rahul Verma', 'CASHIER', 'rahul@clinic.com', '+919876543212');

INSERT INTO drug_formulary (id, brand_name, generic_name, dosage_form, strength, standard_dosage, contraindications) VALUES
(1, 'Augmentin 625', 'Amoxicillin + Clavulanate', 'TABLET', '625mg', '1 tab BD for 5 days', 'Penicillin hypersensitivity, Cholestatic jaundice'),
(2, 'Amlokind 5', 'Amlodipine', 'TABLET', '5mg', '1 tab OD morning', 'Severe hypotension, cardiogenic shock'),
(3, 'Pan 40', 'Pantoprazole', 'TABLET', '40mg', '1 tab OD before breakfast', 'Known hypersensitivity'),
(4, 'Dolo 650', 'Paracetamol', 'TABLET', '650mg', '1 tab SOS (Max 3/day)', 'Severe hepatic impairment');

INSERT INTO patients (id, uhid, first_name, last_name, dob, gender, phone, blood_group, emergency_contact, address) VALUES
(1, 'UHID-2026-00104', 'Ramesh', 'Patel', '1978-04-12', 'MALE', '+919822012345', 'B+', 'Sita Patel (+919822012346)', 'Flat 402, Shanti Heights, Pune');

INSERT INTO visits (id, patient_id, doctor_id, receptionist_id, visit_date, queue_token, status, chief_complaint, conclusion_notes, conclusion_signed_at) VALUES
(1, 1, 2, 1, '2026-10-06 10:15:00', 'Q-104', 'COMPLETED', 'Occasional chest tightness and shortness of breath during exertion for 3 days', 'Stage 1 Essential Hypertension with mild exertional dyspnea. Advised lifestyle modification and low-dose Amlodipine.', '2026-10-06 10:45:00');

INSERT INTO vital_signs (id, visit_id, systolic_bp, diastolic_bp, pulse_rate, temperature_f, resp_rate, spo2_pct, weight_kg, height_cm, bmi) VALUES
(1, 1, 142, 92, 88, 98.4, 18, 98, 76.5, 172.0, 25.9);

INSERT INTO intake_questionnaires (id, visit_id, voice_audio_url, transcript_text, primary_symptom, duration_days, severity_scale, known_allergies, onset_notes) VALUES
(1, 1, '/audio/intake/q104_rec.opus', 'Patient states feeling mild chest fullness and heaviness after walking stairs. No radiating pain. Allergic to penicillin.', 'Chest tightness on exertion', 3, 6, 'Penicillin, Sulfa drugs', 'Gradual onset over 72 hours');

INSERT INTO external_reports (id, visit_id, patient_id, report_type, modality, file_path, file_size_mb, findings_summary) VALUES
(1, 1, 1, 'ECG', '12-Lead Resting ECG', '/reports/2026/ecg_ramesh_patel.pdf', 1.80, 'Normal sinus rhythm, heart rate 86 bpm. No acute ST-T segment elevation or ischemic changes.'),
(2, 1, 1, 'DICOM', 'Chest X-Ray PA View', '/reports/2026/cxr_ramesh_patel.dcm', 18.40, 'Clear lung fields, normal cardiothoracic ratio (CTR < 0.50), no pleural effusion.');

INSERT INTO deterministic_insights (id, visit_id, rule_code, severity_level, category, title, description, recommendation, is_reviewed, is_signed, doctor_override_notes) VALUES
(1, 1, 'RULE_HTN_STAGE1', 'WARNING', 'VITALS', 'Elevated Blood Pressure (Stage-1 HTN)', 'Systolic BP is 142 mmHg (>130) and Diastolic BP is 92 mmHg (>80). Patient meets criteria for Stage 1 Hypertension.', 'Consider first-line CCB (Amlodipine 5mg) or ACEi. Check renal panel and sodium intake.', 1, 1, 'Confirmed BP elevation on repeat measurement. Initiated Amlodipine 5mg OD.'),
(2, 1, 'RULE_ALLERGY_PEN', 'CRITICAL', 'DRUG_SAFETY', 'Known Penicillin Hypersensitivity', 'Patient intake questionnaire records severe allergy to Penicillin-class beta-lactams.', 'Strictly avoid Amoxicillin, Ampicillin, Piperacillin and Cephalosporin cross-reactives.', 1, 1, 'Flagged in formulary safety screen; formulary filtered successfully.');

INSERT INTO prescriptions (id, visit_id, doctor_id, general_instructions, status) VALUES
(1, 1, 2, 'Take medications regularly after food. Low salt diet. Follow up after 2 weeks with home BP log.', 'FINALIZED');

INSERT INTO prescription_items (id, prescription_id, drug_id, dosage, frequency, duration_days, special_instructions) VALUES
(1, 1, 2, '5mg', 'OD (Once Daily)', 14, 'Take in the morning after breakfast');

INSERT INTO bills (id, visit_id, cashier_id, gross_amount, discount_amount, insurance_covered, net_amount, payment_status) VALUES
(1, 1, 3, 1200.00, 0.00, 960.00, 240.00, 'PAID');

INSERT INTO bill_items (id, bill_id, service_code, description, unit_price, quantity, total_price) VALUES
(1, 1, 'OPD-CONSULT', 'Specialist Physician Consultation Fee', 800.00, 1, 800.00),
(2, 1, 'ECG-12L', '12-Lead Diagnostic ECG Trace Review', 400.00, 1, 400.00);

INSERT INTO payments (id, bill_id, payment_mode, transaction_ref, amount_paid, payment_status) VALUES
(1, 1, 'UPI', 'UPI/20261006/894729104', 240.00, 'SUCCESS');
