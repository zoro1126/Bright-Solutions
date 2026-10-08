import os
import pymysql
from pymysql.cursors import DictCursor
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "prem")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password123")
DB_NAME = os.getenv("DB_NAME", "test_clinicos_db")

def get_connection():
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset="utf8mb4",
        cursorclass=DictCursor,
        autocommit=True
    )

def init_db():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # 1. Users Table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)

            # 2. Patients Table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS patients (
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
                insurance_type VARCHAR(50) DEFAULT 'CASH',
                insurance_provider VARCHAR(100) NULL,
                policy_number VARCHAR(100) NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_patients_phone (phone),
                INDEX idx_patients_name (last_name, first_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)

            # 3. Visits Table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS visits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                patient_id INT NOT NULL,
                doctor_id INT NOT NULL,
                receptionist_id INT NOT NULL,
                visit_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                queue_token VARCHAR(20) NOT NULL,
                status ENUM('REGISTERED', 'TRIAGED', 'IN_CONSULTATION', 'READY_FOR_BILLING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'TRIAGED',
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)

            # 4. Vital Signs Table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS vital_signs (
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
                bmi_category VARCHAR(50) NULL,
                bp_stage VARCHAR(50) NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_vitals_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)

            # Seed default users if table is empty
            cur.execute("SELECT COUNT(*) AS cnt FROM users;")
            row = cur.fetchone()
            if row and row['cnt'] == 0:
                cur.execute("""
                INSERT INTO users (username, password_hash, full_name, role, email, phone) VALUES
                ('receptionist_anita', '$2b$12$dummyreceptionisthash', 'Anita Sharma', 'RECEPTIONIST', 'anita@clinic.com', '+919876543210'),
                ('dr_kulkarni', '$2b$12$dummydoctorhash', 'Dr. Vikram Kulkarni, MD', 'DOCTOR', 'vikram@clinic.com', '+919876543211'),
                ('dr_ananya', '$2b$12$dummydoctorhash2', 'Dr. Ananya Roy, MBBS, DNB', 'DOCTOR', 'ananya@clinic.com', '+919876543213'),
                ('dr_priya', '$2b$12$dummydoctorhash3', 'Dr. Priya Nair, MD (Internal Med)', 'DOCTOR', 'priya@clinic.com', '+919876543214'),
                ('cashier_rahul', '$2b$12$dummycashierhash', 'Rahul Verma', 'CASHIER', 'rahul@clinic.com', '+919876543212');
                """)
                print("Seeded default clinic staff users.")
    finally:
        conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialization complete.")
