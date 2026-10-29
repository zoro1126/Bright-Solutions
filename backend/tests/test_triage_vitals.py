import time
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_triage_vitals_intake_and_cdss_alerts():
    # 1. Login as Nurse
    nurse_login = client.post("/api/v1/auth/login", json={
        "username": "nurse.anita@brightsolutions.in",
        "password": "Nurse@123"
    })
    assert nurse_login.status_code == 200, f"Nurse login failed: {nurse_login.text}"
    nurse_token = nurse_login.json()["access_token"]
    nurse_headers = {"Authorization": f"Bearer {nurse_token}"}

    # 2. Login as Receptionist to register and check in a patient
    rec_login = client.post("/api/v1/auth/login", json={
        "username": "reception@brightsolutions.in",
        "password": "Reception@123"
    })
    rec_token = rec_login.json()["access_token"]
    rec_headers = {"Authorization": f"Bearer {rec_token}"}

    ts = str(int(time.time() * 1000))[-6:]
    p_res = client.post("/api/v1/patients", json={
        "first_name": "Deepak",
        "last_name": f"Verma{ts}",
        "dob": "1984-07-19",
        "gender": "MALE",
        "phone": f"9876{ts}",
        "address_line1": "45/A, MG Road",
        "city": "Rajkot",
        "state": "Gujarat",
        "postal_code": "360001"
    }, headers=rec_headers)
    assert p_res.status_code == 201
    uhid = p_res.json()["data"]["uhid"]
    p_uuid = p_res.json()["data"]["public_id"]

    opd_res = client.post("/api/v1/opd/visits", json={"uhid": uhid}, headers=rec_headers)
    assert opd_res.status_code == 201
    visit_uuid = opd_res.json()["data"]["visit_uuid"]

    # 3. Normal Vitals Intake
    normal_payload = {
        "uhid": uhid,
        "opd_visit_uuid": visit_uuid,
        "temperature_f": 98.6,
        "pulse_bpm": 72,
        "blood_pressure_systolic": 120,
        "blood_pressure_diastolic": 80,
        "respiratory_rate_bpm": 18,
        "spo2_percentage": 98,
        "height_cm": 175.0,
        "weight_kg": 70.0,
        "pain_scale": 1
    }
    vitals_res1 = client.post("/api/v1/triage/vitals", json=normal_payload, headers=nurse_headers)
    assert vitals_res1.status_code == 201
    d1 = vitals_res1.json()["data"]
    assert d1["bmi"] == 22.9
    assert d1["bmi_category"] == "NORMAL"
    assert d1["is_abnormal"] is False
    assert len(d1["abnormal_flags"]) == 0

    # 4. Critical / Abnormal Vitals Intake with CDSS Panic Flags
    critical_payload = {
        "patient_uuid": p_uuid,
        "opd_visit_uuid": visit_uuid,
        "temperature_f": 104.2,                # Hyperpyrexia >= 104°F
        "pulse_bpm": 126,                      # Severe Tachycardia > 120
        "blood_pressure_systolic": 185,        # Hypertensive Crisis >= 180
        "blood_pressure_diastolic": 122,       # Hypertensive Crisis >= 120
        "respiratory_rate_bpm": 28,            # Tachypnea > 24
        "spo2_percentage": 88,                 # Severe Hypoxia < 90%
        "height_cm": 160.0,
        "weight_kg": 85.0,                     # BMI = 33.2 (OBESE)
        "pain_scale": 8
    }
    vitals_res2 = client.post("/api/v1/vitals", json=critical_payload, headers=nurse_headers)
    assert vitals_res2.status_code == 201
    d2 = vitals_res2.json()["data"]
    assert d2["bmi"] == 33.2
    assert d2["bmi_category"] == "OBESE"
    assert d2["is_abnormal"] is True
    assert len(d2["abnormal_flags"]) >= 4

    flag_text = " ".join(d2["abnormal_flags"])
    assert "Hypoxia" in flag_text
    assert "Hypertensive Crisis" in flag_text
    assert "Hyperpyrexia" in flag_text
    assert "Tachycardia" in flag_text
    assert "Tachypnea" in flag_text

    # 5. Fetch visit vitals
    get_vitals = client.get(f"/api/v1/vitals/visit/{visit_uuid}", headers=nurse_headers)
    assert get_vitals.status_code == 200
    retrieved = get_vitals.json()["data"]
    assert retrieved["opd_visit_uuid"] == visit_uuid
    assert retrieved["is_abnormal"] is True

    # 6. Unauthenticated Protection
    unauth = client.post("/api/v1/triage/vitals", json=normal_payload)
    assert unauth.status_code == 401

