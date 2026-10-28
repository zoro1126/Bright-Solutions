import sys
import json
import uuid
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.core.database import engine

def seed_clinical_infrastructure():
    print(f"Connecting to database {engine.url.database} to seed clinical infrastructure...")

    with engine.begin() as conn:
        # 1. Seed Departments in hospital_config
        departments = [
            "General Medicine",
            "General Surgery",
            "Medical Oncology",
            "Surgical Oncology"
        ]
        conn.execute(text("""
            INSERT INTO hospital_config (hospital_id, config_key, config_value, description, is_public)
            VALUES (1, 'clinical_departments', :val, 'Active clinical departments for OPD/IPD routing', 1)
            ON DUPLICATE KEY UPDATE config_value = :val;
        """), {"val": json.dumps(departments)})
        print("Departments configured:", departments)

        # 2. Seed Wards
        wards_data = [
            ("GWM", "General Ward Male", "1", "MALE_ONLY", 6),
            ("GWF", "General Ward Female", "1", "FEMALE_ONLY", 6),
            ("SPW", "Semi-Private Ward", "2", "ANY", 4),
            ("ICU", "Intensive Care Unit", "2", "ANY", 4)
        ]
        ward_ids = {}
        for code, name, floor, gender, beds_cnt in wards_data:
            conn.execute(text("""
                INSERT INTO wards (public_id, hospital_id, ward_code, ward_name, floor_number, gender_restriction, total_beds, is_active)
                VALUES (:pub_id, 1, :code, :name, :floor, :gender, :beds, 1)
                ON DUPLICATE KEY UPDATE 
                    ward_name = :name,
                    floor_number = :floor,
                    gender_restriction = :gender,
                    total_beds = :beds,
                    is_active = 1;
            """), {
                "pub_id": str(uuid.uuid4()),
                "code": code,
                "name": name,
                "floor": floor,
                "gender": gender,
                "beds": beds_cnt
            })
            ward_row = conn.execute(text("SELECT id FROM wards WHERE hospital_id = 1 AND ward_code = :code"), {"code": code}).fetchone()
            ward_ids[code] = ward_row[0]
        print("Wards configured:", ward_ids)

        # 3. Seed Rooms with Tariffs
        rooms_data = [
            ("GWM", "RM-101", "GENERAL", 1500.00),
            ("GWF", "RM-102", "GENERAL", 1500.00),
            ("SPW", "RM-201", "SEMI_PRIVATE", 3000.00),
            ("ICU", "RM-202", "ICU", 7500.00)
        ]
        room_ids = {}
        for ward_code, room_no, r_type, tariff in rooms_data:
            ward_id = ward_ids[ward_code]
            conn.execute(text("""
                INSERT INTO rooms (public_id, hospital_id, ward_id, room_number, room_type, daily_tariff, is_active)
                VALUES (:pub_id, 1, :ward_id, :room_no, :r_type, :tariff, 1)
                ON DUPLICATE KEY UPDATE 
                    room_type = :r_type,
                    daily_tariff = :tariff,
                    is_active = 1;
            """), {
                "pub_id": str(uuid.uuid4()),
                "ward_id": ward_id,
                "room_no": room_no,
                "r_type": r_type,
                "tariff": tariff
            })
            room_row = conn.execute(text("SELECT id FROM rooms WHERE ward_id = :ward_id AND room_number = :room_no"), {
                "ward_id": ward_id,
                "room_no": room_no
            }).fetchone()
            room_ids[room_no] = room_row[0]
        print("Rooms configured:", room_ids)

        # 4. Seed 20 Beds (BED-101 to BED-120) with Status AVAILABLE
        # RM-101 (GWM): BED-101 .. BED-106 (6 beds)
        # RM-102 (GWF): BED-107 .. BED-112 (6 beds)
        # RM-201 (SPW): BED-113 .. BED-116 (4 beds)
        # RM-202 (ICU): BED-117 .. BED-120 (4 beds)
        bed_mapping = []
        for i in range(101, 107):
            bed_mapping.append((room_ids["RM-101"], f"BED-{i}"))
        for i in range(107, 113):
            bed_mapping.append((room_ids["RM-102"], f"BED-{i}"))
        for i in range(113, 117):
            bed_mapping.append((room_ids["RM-201"], f"BED-{i}"))
        for i in range(117, 121):
            bed_mapping.append((room_ids["RM-202"], f"BED-{i}"))

        for r_id, b_num in bed_mapping:
            conn.execute(text("""
                INSERT INTO beds (public_id, hospital_id, room_id, bed_number, status, is_active)
                VALUES (:pub_id, 1, :r_id, :b_num, 'AVAILABLE', 1)
                ON DUPLICATE KEY UPDATE 
                    status = 'AVAILABLE',
                    is_active = 1;
            """), {
                "pub_id": str(uuid.uuid4()),
                "r_id": r_id,
                "b_num": b_num
            })
        print(f"20 Beds (BED-101 to BED-120) mapped to rooms with status 'AVAILABLE'.")

        # 5. Seed Official Service Tariffs
        tariffs_data = [
            ("BED-GEN", "General Ward Bed Rent (Per Day)", "BED_RENT", 1500.00, 0.00),
            ("BED-SEMI", "Semi-Private Ward Bed Rent (Per Day)", "BED_RENT", 3000.00, 0.00),
            ("BED-ICU", "ICU Bed Rent (Per Day)", "BED_RENT", 7500.00, 0.00),
            ("CONS-GEN", "General OPD Consultation Fee", "CONSULTATION", 500.00, 0.00),
            ("NURSING-GEN", "General Nursing Care (Per Day)", "NURSING", 500.00, 0.00),
            ("NURSING-ICU", "ICU Intensive Nursing Care (Per Day)", "NURSING", 1500.00, 0.00)
        ]
        for s_code, s_name, cat, price, tax in tariffs_data:
            conn.execute(text("""
                INSERT INTO tariffs (public_id, hospital_id, service_code, service_name, category, base_price, tax_percentage, is_active)
                VALUES (:pub_id, 1, :s_code, :s_name, :cat, :price, :tax, 1)
                ON DUPLICATE KEY UPDATE 
                    service_name = :s_name,
                    category = :cat,
                    base_price = :price,
                    tax_percentage = :tax,
                    is_active = 1;
            """), {
                "pub_id": str(uuid.uuid4()),
                "s_code": s_code,
                "s_name": s_name,
                "cat": cat,
                "price": price,
                "tax": tax
            })
        print("Tariff catalog items configured.")

    # 6. Verification
    with engine.connect() as conn:
        wards_cnt = conn.execute(text("SELECT COUNT(*) FROM wards WHERE hospital_id = 1 AND is_active = 1")).scalar()
        rooms_cnt = conn.execute(text("SELECT COUNT(*) FROM rooms WHERE hospital_id = 1 AND is_active = 1")).scalar()
        beds_cnt = conn.execute(text("SELECT COUNT(*) FROM beds WHERE hospital_id = 1 AND is_active = 1")).scalar()
        avail_beds = conn.execute(text("SELECT COUNT(*) FROM beds WHERE hospital_id = 1 AND status = 'AVAILABLE'")).scalar()
        tariffs_cnt = conn.execute(text("SELECT COUNT(*) FROM tariffs WHERE hospital_id = 1 AND is_active = 1")).scalar()

        print("\nClinical Infrastructure Verification:")
        print(f" - Active Wards: {wards_cnt}")
        print(f" - Active Rooms: {rooms_cnt}")
        print(f" - Active Beds: {beds_cnt} (Available: {avail_beds})")
        print(f" - Active Tariffs: {tariffs_cnt}")

        assert wards_cnt == 4, f"Expected 4 wards, found {wards_cnt}"
        assert rooms_cnt == 4, f"Expected 4 rooms, found {rooms_cnt}"
        assert beds_cnt == 20, f"Expected 20 beds, found {beds_cnt}"
        assert avail_beds == 20, f"Expected 20 available beds, found {avail_beds}"
        assert tariffs_cnt >= 6, f"Expected at least 6 tariffs, found {tariffs_cnt}"
        print("All clinical infrastructure master data validated successfully!")

if __name__ == "__main__":
    seed_clinical_infrastructure()

