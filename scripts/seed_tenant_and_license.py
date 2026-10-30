import os
import sys
import json
from datetime import datetime, timedelta, timezone
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
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

# Deterministic / Canonical Development Keypair for Bright Solutions On-Premise Licensing
DEV_PRIVATE_KEY_HEX = "ee1b82b47370193256f7c2db748809c5a2dcf2c4883d31a30670e4856f20b2d5"
DEV_PUBLIC_KEY_HEX = "1205f07fb12175107fa7c918fc58ffcce0940a920c56e780ce4c4fc9f1116126"

def seed_foundational_tenant_and_license():
    print(f"Connecting to database {engine.url.database} to seed Tenant and License records...")
    
    with engine.begin() as conn:
        # 1. Seed or Update Default Hospital Tenant (TASK-1.3)
        conn.execute(text("""
            INSERT INTO hospitals (id, public_id, hospital_code, name, address_line1, city, state, postal_code, phone, email, is_active)
            VALUES (1, UUID(), 'shubham', 'Shubham General Hospital & Onco Care', 'Plot No. 12, Ring Road', 'Surat', 'Gujarat', '395001', '+91 261 2450000', 'contact@shubhamhospital.org', 1)
            ON DUPLICATE KEY UPDATE 
                hospital_code = 'shubham',
                name = 'Shubham General Hospital & Onco Care',
                city = 'Surat',
                state = 'Gujarat';
        """))
        print("Hospital tenant 'shubham' (ID 1) configured.")

        # 2. Seed Standard Roles (TASK-1.3)
        roles_data = [
            (1, 'SUPER_ADMIN', 'Super Administrator', 'Full system access and multi-tenant management'),
            (2, 'ADMIN', 'Hospital Administrator', 'Hospital config, tariffs, staff, and audit reports'),
            (3, 'RECEPTIONIST', 'Receptionist', 'Patient registration, OPD queue ticketing, bed admissions'),
            (4, 'NURSE', 'Nurse', 'Vitals triage, MAR administration, fluid intake/output'),
            (5, 'DOCTOR', 'Doctor', 'Clinical consultation, SOAP notes, prescriptions, and IPD care'),
            (6, 'PHARMACIST', 'Pharmacist', 'Prescription dispensing and pharmacy inventory'),
            (7, 'LAB_TECHNICIAN', 'Lab Technician', 'Pathology investigations and parameter result entry'),
            (8, 'BILLING_CLERK', 'Billing Clerk', 'Consolidated billing, advance collection, final invoice settlement')
        ]
        for role_id, code, name, desc in roles_data:
            conn.execute(text("""
                INSERT INTO roles (id, role_code, role_name, description, is_system_role)
                VALUES (:id, :code, :name, :desc, 1)
                ON DUPLICATE KEY UPDATE role_code = :code, role_name = :name, description = :desc;
            """), {"id": role_id, "code": code, "name": name, "desc": desc})
        print("8 Standard RBAC roles verified.")

        # 3. Seed Tenant Modules (TASK-1.3)
        valid_until = datetime.now(timezone.utc) + timedelta(days=365)
        modules = [
            ("OPD", 20),
            ("IPD", 60),
            ("PHARMACY", None),
            ("PATHOLOGY", None),
            ("BILLING", None)
        ]
        conn.execute(text("DELETE FROM tenant_modules WHERE hospital_id = 1;"))
        for mod_code, max_units in modules:
            conn.execute(text("""
                INSERT INTO tenant_modules (hospital_id, module_code, is_active, valid_until, max_units)
                VALUES (1, :mod_code, 1, :valid_until, :max_units);
            """), {"mod_code": mod_code, "valid_until": valid_until, "max_units": max_units})
        print("Tenant modules [OPD, IPD, PHARMACY, PATHOLOGY, BILLING] enabled for hospital ID 1.")

        # 4. Generate Ed25519 Development License (TASK-1.4)
        private_key = ed25519.Ed25519PrivateKey.from_private_bytes(bytes.fromhex(DEV_PRIVATE_KEY_HEX))
        public_key = ed25519.Ed25519PublicKey.from_public_bytes(bytes.fromhex(DEV_PUBLIC_KEY_HEX))
        
        valid_from = datetime.now(timezone.utc)
        valid_until = valid_from + timedelta(days=365)
        license_payload = {
            "hospital_id": 1,
            "hospital_code": "shubham",
            "tier": "ENTERPRISE",
            "enabled_modules": ["OPD", "IPD", "PHARMACY", "PATHOLOGY", "BILLING"],
            "max_beds": 60,
            "max_doctors": 20,
            "valid_from": valid_from.isoformat(),
            "valid_until": valid_until.isoformat(),
            "grace_period_days": 14,
            "issuer": "Bright Solutions Central Licensing Authority"
        }
        
        canonical_payload_str = json.dumps(license_payload, sort_keys=True)
        payload_bytes = canonical_payload_str.encode("utf-8")
        signature_bytes = private_key.sign(payload_bytes)
        signature_hex = signature_bytes.hex()
        
        # Verify signature with public key before saving
        public_key.verify(signature_bytes, payload_bytes)
        print("Ed25519 signature cryptographically verified with public key.")

        conn.execute(text("DELETE FROM license_records WHERE hospital_id = 1;"))
        conn.execute(text("""
            INSERT INTO license_records (
                hospital_id, license_id, tier, raw_payload, signature, 
                valid_from, valid_until, grace_period_days, last_known_monotonic_time, is_active
            ) VALUES (
                1, 'LIC-2026-SHUBHAM-DEV', 'ENTERPRISE', :payload, :sig,
                :valid_from, :valid_until, 14, NOW(), 1
            );
        """), {
            "payload": canonical_payload_str,
            "sig": signature_hex,
            "valid_from": valid_from,
            "valid_until": valid_until
        })
        print("Self-signed Ed25519 development license seeded into license_records.")

    # 5. Verification Check
    with engine.connect() as conn:
        tenant = conn.execute(text("SELECT id, hospital_code, name FROM hospitals WHERE id = 1")).fetchone()
        roles_count = conn.execute(text("SELECT COUNT(*) FROM roles")).scalar()
        modules_count = conn.execute(text("SELECT COUNT(*) FROM tenant_modules WHERE hospital_id = 1 AND is_active = 1")).scalar()
        lic = conn.execute(text("SELECT license_id, tier, is_active, last_known_monotonic_time FROM license_records WHERE hospital_id = 1")).fetchone()
        
        print("\nFoundational Seed Verification:")
        print(f" - Hospital: {tenant}")
        print(f" - Active Roles: {roles_count}")
        print(f" - Licensed Modules: {modules_count}")
        print(f" - License Record: {lic}")

if __name__ == "__main__":
    seed_foundational_tenant_and_license()
