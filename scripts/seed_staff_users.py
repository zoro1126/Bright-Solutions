import sys
import uuid
from pathlib import Path

script_dir = Path(__file__).resolve().parent
if (script_dir.parent / "app").exists():
    root_dir = script_dir.parent
elif (script_dir.parent / "backend").exists():
    root_dir = script_dir.parent / "backend"
else:
    root_dir = script_dir.parent

if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from sqlalchemy import text
from app.core.database import engine
from argon2 import PasswordHasher

ph = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)

def seed_staff_users():
    print(f"Connecting to database {engine.url.database} to seed test staff user accounts...")

    with engine.begin() as conn:
        # Fetch role IDs
        roles = {
            r[1]: r[0] for r in conn.execute(text("SELECT id, role_code FROM roles")).fetchall()
        }
        print("Available roles:", roles)

        staff_data = [
            {
                "email": "dr.sharma@brightsolutions.in",
                "username": "dr.sharma@brightsolutions.in",
                "full_name": "Dr. Ramesh Sharma",
                "password": "Doctor@123",
                "role_code": "DOCTOR",
                "phone": "+91 98200 11223"
            },
            {
                "email": "nurse.anita@brightsolutions.in",
                "username": "nurse.anita@brightsolutions.in",
                "full_name": "Nurse Anita Desai",
                "password": "Nurse@123",
                "role_code": "NURSE",
                "phone": "+91 98200 22334"
            },
            {
                "email": "reception@brightsolutions.in",
                "username": "reception@brightsolutions.in",
                "full_name": "Pooja Patel (Front Desk)",
                "password": "Reception@123",
                "role_code": "RECEPTIONIST",
                "phone": "+91 98200 33445"
            },
            {
                "email": "billing@brightsolutions.in",
                "username": "billing@brightsolutions.in",
                "full_name": "Suresh Mehta (Billing Officer)",
                "password": "Billing@123",
                "role_code": "BILLING_CLERK",
                "phone": "+91 98200 44556"
            },
            {
                "email": "admin@brightsolutions.in",
                "username": "admin@brightsolutions.in",
                "full_name": "Hospital Administrator",
                "password": "Admin@123",
                "role_code": "ADMIN",
                "phone": "+91 98200 55667"
            }
        ]

        created_users = {}
        for staff in staff_data:
            role_id = roles.get(staff["role_code"])
            if not role_id:
                raise ValueError(f"Role {staff['role_code']} not found in database!")

            pwd_hash = ph.hash(staff["password"])

            conn.execute(text("""
                INSERT INTO users (
                    public_id, hospital_id, username, password_hash, full_name, 
                    role_id, email, phone, is_active
                ) VALUES (
                    :pub_id, 1, :uname, :pwd_hash, :full_name,
                    :role_id, :email, :phone, 1
                )
                ON DUPLICATE KEY UPDATE 
                    password_hash = :pwd_hash,
                    full_name = :full_name,
                    role_id = :role_id,
                    email = :email,
                    phone = :phone,
                    is_active = 1;
            """), {
                "pub_id": str(uuid.uuid4()),
                "uname": staff["username"],
                "pwd_hash": pwd_hash,
                "full_name": staff["full_name"],
                "role_id": role_id,
                "email": staff["email"],
                "phone": staff["phone"]
            })

            user_row = conn.execute(text("SELECT id FROM users WHERE hospital_id = 1 AND username = :uname"), {
                "uname": staff["username"]
            }).fetchone()
            created_users[staff["email"]] = user_row[0]

        print("Seeded staff users:", created_users)

        # Link Doctor Profile for Dr. Sharma
        doc_user_id = created_users["dr.sharma@brightsolutions.in"]
        conn.execute(text("""
            INSERT INTO doctor_profiles (
                public_id, user_id, hospital_id, specialization, qualification,
                medical_council_reg_no, default_consultation_fee, follow_up_fee,
                follow_up_validity_days, assigned_room_number, is_available_for_opd
            ) VALUES (
                :pub_id, :user_id, 1, 'Medical Oncology', 'MBBS, MD, DM (Medical Oncology)',
                'GMC-48291', 500.00, 300.00, 7, 'CONS-1', 1
            )
            ON DUPLICATE KEY UPDATE
                specialization = 'Medical Oncology',
                qualification = 'MBBS, MD, DM (Medical Oncology)',
                medical_council_reg_no = 'GMC-48291',
                default_consultation_fee = 500.00,
                assigned_room_number = 'CONS-1',
                is_available_for_opd = 1;
        """), {
            "pub_id": str(uuid.uuid4()),
            "user_id": doc_user_id
        })
        print(f"Doctor profile linked for user_id={doc_user_id} (Dr. Sharma)")

    # Verification
    with engine.connect() as conn:
        for staff in staff_data:
            row = conn.execute(text("""
                SELECT u.id, u.username, u.password_hash, r.role_code 
                FROM users u 
                JOIN roles r ON u.role_id = r.id 
                WHERE u.email = :email
            """), {"email": staff["email"]}).fetchone()
            assert row is not None, f"User {staff['email']} not found"
            assert ph.verify(row[2], staff["password"]) is True, f"Password verify failed for {staff['email']}"
            print(f"Verified {staff['email']}: User ID {row[0]}, Role {row[3]}, Argon2id Hash Verified OK")

        doc_profile = conn.execute(text("SELECT id, specialization, medical_council_reg_no FROM doctor_profiles WHERE user_id = :uid"), {
            "uid": created_users["dr.sharma@brightsolutions.in"]
        }).fetchone()
        assert doc_profile is not None
        print(f"Verified doctor profile: ID {doc_profile[0]}, Spec {doc_profile[1]}, Reg {doc_profile[2]}")

if __name__ == "__main__":
    seed_staff_users()

