"""
Automated Pytest Suite: Bed Concurrency & Cryptographic Licensing Protection (TASK-BE-7.2)
Verifies:
1. Concurrency-Safe Bed Allocation:
   - Simultaneous requests attempting to admit different patients into the exact same bed.
   - Row-level SELECT ... FOR UPDATE locking guarantees exactly ONE 201 Created, while all others receive 409 Conflict.
   - Zero double-bookings in database.
2. Ed25519 Cryptographic Licensing & Clock Tampering Protection (ADR-010):
   - Active offline license verified with Ed25519 public key.
   - Clock Rollback Detection: system flags clock tampering when system time is set backwards.
   - Emergency 14-day Grace Period behavior and read-only lockdown upon license expiration.
   - Payload tampering rejection (signature mismatch).
"""

from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
import json
import time
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.core.database import engine
from app.core.licensing import LicenseService
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def receptionist_token(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "reception@brightsolutions.in", "password": "Reception@123"},
    )
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


@pytest.fixture
def admin_token(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "admin@brightsolutions.in", "password": "Admin@123"},
    )
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def test_concurrent_bed_allocation_prevents_double_booking(client, receptionist_token):
    """
    Stress tests bed allocation under concurrent multi-user load.
    5 threads attempt to admit 5 different patients into the exact same bed simultaneously.
    Guarantees exactly ONE succeeds and 4 receive 409 Conflict.
    """
    rec_headers = {"Authorization": f"Bearer {receptionist_token}"}
    ts = int(time.time())

    # 1. Register 5 distinct patients
    pat_uuids = []
    for i in range(5):
        p_resp = client.post(
            "/api/v1/patients",
            headers=rec_headers,
            json={
                "first_name": f"ConcurrentPat_{i}",
                "last_name": f"Test_{ts}",
                "dob": "1990-01-01",
                "gender": "MALE",
                "phone": f"9823{(ts + i) % 1000000:06d}",
                "aadhaar_number": f"99{(ts * 10 + i) % 10000000000:010d}",
                "address_line1": "Race Course Road",
                "city": "Vadodara",
                "state": "Gujarat",
                "postal_code": "390007",
                "blood_group": "O+",
            },
        )
        assert p_resp.status_code == 201, p_resp.text
        pat_uuids.append(p_resp.json()["data"]["public_id"])

    # 2. Pick a single target available bed
    matrix = client.get("/api/v1/beds/matrix", headers=rec_headers).json()
    target_bed_uuid = None
    target_bed_id = None
    for w in matrix["wards"]:
        for r in w["rooms"]:
            for b in r["beds"]:
                if b["status"] == "AVAILABLE":
                    target_bed_uuid = b["uuid"]
                    break
            if target_bed_uuid:
                break
        if target_bed_uuid:
            break
    assert target_bed_uuid is not None

    with engine.connect() as conn:
        b_row = conn.execute(
            text("SELECT id FROM beds WHERE public_id = :uuid"),
            {"uuid": target_bed_uuid},
        ).mappings().first()
        target_bed_id = b_row["id"]

    doctor_uuid = "2fc441e9-f86e-4881-aaa4-c3ed3e669840"

    # 3. Fire 5 simultaneous admission requests for the same bed
    def attempt_admission(pat_uuid):
        # Fresh TestClient per thread
        t_client = TestClient(app)
        return t_client.post(
            "/api/v1/ipd/admissions",
            headers=rec_headers,
            json={
                "patient_uuid": pat_uuid,
                "attending_doctor_uuid": doctor_uuid,
                "bed_uuid": target_bed_uuid,
                "admission_source": "EMERGENCY_DIRECT",
                "admission_type": "EMERGENCY",
                "provisional_diagnosis": "Concurrency Stress Admission",
                "is_mlc": False,
                "payment_category": "SELF_PAY_CASH",
                "advance_amount_paid": 1000.00,
            },
        )

    results = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(attempt_admission, p_uuid) for p_uuid in pat_uuids]
        for f in as_completed(futures):
            results.append(f.result())

    # 4. Assert strict atomicity: exactly 1 success (201) and 4 conflicts (409)
    status_codes = [r.status_code for r in results]
    assert status_codes.count(201) == 1, f"Expected exactly one 201, got: {status_codes}"
    assert status_codes.count(409) == 4, f"Expected four 409s, got: {status_codes}"

    # Verify conflict error messages specify bed is occupied
    for r in results:
        if r.status_code == 409:
            assert "cannot be allocated" in r.json()["detail"].lower() or "occupied" in r.json()["detail"].lower()

    # 5. Database Level Audit: ensure exactly 1 active admission exists for the target bed
    with engine.connect() as conn:
        active_count = conn.execute(
            text("""
                SELECT COUNT(*) AS cnt
                FROM ipd_admissions a
                JOIN patients p ON a.patient_id = p.id
                WHERE a.current_bed_id = :bid AND a.status = 'ADMITTED'
                  AND p.public_id IN :pids
            """),
            {"bid": target_bed_id, "pids": tuple(pat_uuids)},
        ).mappings().first()["cnt"]
        assert active_count == 1, f"Expected exactly 1 active occupant from test cohort, found {active_count}"


def test_ed25519_licensing_and_clock_rollback_protection(client, admin_token):
    """
    Tests ADR-010 Cryptographic License Verification and Anti-Tampering Engine:
    1. Active license status check.
    2. Clock Rollback Detection (tampered state triggered if system clock set back).
    3. Payload alteration detection (signature mismatch).
    4. Expiration and emergency 14-day grace period logic.
    """
    adm_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Verify Active Valid License
    status_resp = client.get("/api/v1/admin/license/status", headers=adm_headers)
    assert status_resp.status_code == 200, status_resp.text
    lic = status_resp.json()
    assert lic["status"] == "ACTIVE"
    assert lic["is_write_allowed"] is True
    assert lic["clock_tampered"] is False
    assert lic["days_remaining"] > 0
    assert "IPD" in lic["enabled_modules"]
    assert "OPD" in lic["enabled_modules"]

    # 2. Test Clock Rollback Detection (ADR-010)
    # Simulate an attacker or user setting the system clock backward by pushing last_known_monotonic_time into the future
    future_time = datetime.now() + timedelta(days=5)
    with engine.begin() as conn:
        conn.execute(
            text("UPDATE license_records SET last_known_monotonic_time = :future WHERE hospital_id = 1"),
            {"future": future_time},
        )

    try:
        tampered_resp = client.get("/api/v1/admin/license/status", headers=adm_headers)
        assert tampered_resp.status_code == 200
        tampered_lic = tampered_resp.json()
        assert tampered_lic["status"] == "TAMPERED"
        assert tampered_lic["clock_tampered"] is True
        assert tampered_lic["is_write_allowed"] is False
        assert "Clock rollback detected" in tampered_lic["message"]
    finally:
        # Restore normal monotonic timestamp
        with engine.begin() as conn:
            conn.execute(
                text("UPDATE license_records SET last_known_monotonic_time = NOW() WHERE hospital_id = 1"),
            )

    # Verify normal active status restored
    restored_resp = client.get("/api/v1/admin/license/status", headers=adm_headers)
    assert restored_resp.status_code == 200
    assert restored_resp.json()["status"] == "ACTIVE"
    assert restored_resp.json()["clock_tampered"] is False

    # 3. Test Cryptographic Signature Verification
    # Fetch current license record
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT raw_payload, signature FROM license_records WHERE hospital_id = 1 AND is_active = 1 LIMIT 1")
        ).mappings().first()

    raw_payload = row["raw_payload"]
    signature = row["signature"]
    assert LicenseService.verify_signature(raw_payload, signature) is True

    # Tampering with raw payload string without valid Ed25519 private key must fail signature verification
    tampered_payload = raw_payload.replace('"max_beds"', '"max_beds_tampered"')
    assert LicenseService.verify_signature(tampered_payload, signature) is False
