import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_opd_checkin_and_daily_tokens():
    # 1. Login as Receptionist (has opd:checkin, opd:read)
    login_res = client.post("/api/v1/auth/login", json={
        "username": "reception@brightsolutions.in",
        "password": "Reception@123"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Register Patient 1
    p1_res = client.post("/api/v1/patients", json={
        "first_name": "Suresh",
        "last_name": "Joshi",
        "dob": "1980-05-12",
        "gender": "MALE",
        "phone": "9876543210",
        "address_line1": "12, Shanti Nagar",
        "city": "Rajkot",
        "state": "Gujarat",
        "postal_code": "360001"
    }, headers=headers)
    assert p1_res.status_code in [201, 409]
    if p1_res.status_code == 201:
        uhid1 = p1_res.json()["data"]["uhid"]
    else:
        uhid1 = p1_res.json()["detail"]["existing_uhid"]

    # 3. Check-in Patient 1 (Token #1)
    checkin1_res = client.post("/api/v1/opd/visits", json={
        "uhid": uhid1,
        "visit_type": "NEW"
    }, headers=headers)
    assert checkin1_res.status_code == 201, f"Checkin 1 failed: {checkin1_res.text}"
    v1 = checkin1_res.json()["data"]
    assert v1["opd_number"].startswith("OPD-")
    assert v1["token_number"] >= 1
    tok1 = v1["token_number"]
    doc_uuid = v1["doctor_uuid"]

    # 4. Register Patient 2
    p2_res = client.post("/api/v1/patients", json={
        "first_name": "Kavita",
        "last_name": "Mehta",
        "dob": "1988-09-25",
        "gender": "FEMALE",
        "phone": "9876543219",
        "address_line1": "88, Ring Road",
        "city": "Rajkot",
        "state": "Gujarat",
        "postal_code": "360005"
    }, headers=headers)
    assert p2_res.status_code in [201, 409]
    if p2_res.status_code == 201:
        uhid2 = p2_res.json()["data"]["uhid"]
    else:
        uhid2 = p2_res.json()["detail"]["existing_uhid"]

    # 5. Check-in Patient 2 for same doctor (Token #2)
    checkin2_res = client.post("/api/v1/opd/tokens", json={
        "uhid": uhid2,
        "doctor_uuid": doc_uuid,
        "visit_type": "FOLLOW_UP"
    }, headers=headers)
    assert checkin2_res.status_code == 201, f"Checkin 2 failed: {checkin2_res.text}"
    v2 = checkin2_res.json()["data"]
    assert v2["token_number"] == tok1 + 1
    assert v2["consultation_fee"] == 300.0  # Follow-up fee
    assert v2["estimated_wait_minutes"] >= 15

    # 6. Check-in Patient 3 as EMERGENCY
    p3_res = client.post("/api/v1/patients", json={
        "first_name": "Vikram",
        "last_name": "Rathod",
        "dob": "1975-01-15",
        "gender": "MALE",
        "phone": "9876543222",
        "address_line1": "Civil Hospital Chowk",
        "city": "Rajkot",
        "state": "Gujarat",
        "postal_code": "360001"
    }, headers=headers)
    assert p3_res.status_code in [201, 409]
    if p3_res.status_code == 201:
        uhid3 = p3_res.json()["data"]["uhid"]
    else:
        uhid3 = p3_res.json()["detail"]["existing_uhid"]

    checkin3_res = client.post("/api/v1/opd/visits", json={
        "uhid": uhid3,
        "doctor_uuid": doc_uuid,
        "visit_type": "EMERGENCY"
    }, headers=headers)
    assert checkin3_res.status_code == 201
    v3 = checkin3_res.json()["data"]
    assert v3["visit_type"] == "EMERGENCY"
    assert v3["token_number"] == tok1 + 2

    # 7. List Active OPD Visits
    list_res = client.get("/api/v1/opd/visits", headers=headers)
    assert list_res.status_code == 200
    visits = list_res.json()["data"]
    assert len(visits) >= 3
    assert any(v["opd_number"] == v1["opd_number"] for v in visits)
    assert any(v["opd_number"] == v2["opd_number"] for v in visits)
    assert any(v["opd_number"] == v3["opd_number"] for v in visits)

    # 8. Unauthenticated Protection
    unauth_res = client.post("/api/v1/opd/visits", json={"uhid": uhid1})
    assert unauth_res.status_code == 401
