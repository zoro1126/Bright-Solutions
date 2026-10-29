import time
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_doctor_consultation_draft_and_icd10():
    # 1. Login as Doctor
    doc_login = client.post("/api/v1/auth/login", json={
        "username": "dr.sharma@brightsolutions.in",
        "password": "Doctor@123"
    })
    assert doc_login.status_code == 200, f"Doctor login failed: {doc_login.text}"
    doc_token = doc_login.json()["access_token"]
    doc_headers = {"Authorization": f"Bearer {doc_token}"}

    # 2. Login as Receptionist to onboard patient and create visit
    rec_login = client.post("/api/v1/auth/login", json={
        "username": "reception@brightsolutions.in",
        "password": "Reception@123"
    })
    rec_token = rec_login.json()["access_token"]
    rec_headers = {"Authorization": f"Bearer {rec_token}"}

    ts = str(int(time.time() * 1000))[-6:]
    p_res = client.post("/api/v1/patients", json={
        "first_name": "Rajendra",
        "last_name": f"Shah{ts}",
        "dob": "1972-03-10",
        "gender": "MALE",
        "phone": f"9824{ts}",
        "address_line1": "702, Nilamber Heights",
        "city": "Rajkot",
        "state": "Gujarat",
        "postal_code": "360005"
    }, headers=rec_headers)
    assert p_res.status_code == 201
    uhid = p_res.json()["data"]["uhid"]

    opd_res = client.post("/api/v1/opd/visits", json={"uhid": uhid}, headers=rec_headers)
    assert opd_res.status_code == 201
    visit_uuid = opd_res.json()["data"]["visit_uuid"]

    # 3. Search ICD-10 Diagnostic Codes
    icd_res = client.get("/api/v1/consultations/icd10/search?q=hyper", headers=doc_headers)
    assert icd_res.status_code == 200
    results = icd_res.json()["data"]
    assert len(results) > 0
    assert any(r["code"] == "I10" for r in results)

    # 4. Save Initial Draft SOAP Consultation Notes
    draft_payload = {
        "opd_visit_uuid": visit_uuid,
        "subjective": "Patient reports recurring frontal headaches and palpitations for 10 days.",
        "objective": "Sitting BP 155/96 mmHg, pulse 84 bpm, heart sounds regular, S1/S2 heard.",
        "assessment": "Stage 2 Essential Hypertension.",
        "plan": "Start Telmisartan 40mg OD morning. Advise low sodium diet, avoid stress. Review in 7 days.",
        "follow_up_date": "2026-11-05",
        "follow_up_instructions": "Maintain daily morning BP log and return if systolic > 170.",
        "diagnoses": [
            {
                "code": "I10",
                "name": "Essential (primary) hypertension",
                "type": "FINAL",
                "is_primary": True
            },
            {
                "code": "R51",
                "name": "Headache",
                "type": "PROVISIONAL",
                "is_primary": False
            }
        ]
    }

    save_res1 = client.post("/api/v1/consultations/draft", json=draft_payload, headers=doc_headers)
    assert save_res1.status_code == 200
    c1 = save_res1.json()["data"]
    assert c1["status"] == "IN_PROGRESS"
    assert c1["uhid"] == uhid
    assert len(c1["diagnoses"]) == 2
    assert c1["diagnoses"][0]["diagnosis_code"] == "I10"
    assert c1["diagnoses"][0]["is_primary"] is True

    # 5. Autosave Update (modify subjective & plan)
    draft_payload["subjective"] = "Patient reports recurring frontal headaches for 10 days, aggravated by work stress."
    draft_payload["plan"] = "Start Telmisartan 40mg OD morning. Advise DASH diet, 30 min daily brisk walk."

    save_res2 = client.post("/api/v1/consultations", json=draft_payload, headers=doc_headers)
    assert save_res2.status_code == 200
    c2 = save_res2.json()["data"]
    assert "DASH diet" in c2["plan"]
    assert c2["public_id"] == c1["public_id"]

    # 6. Fetch Consultation by OPD Visit UUID
    fetch_res = client.get(f"/api/v1/consultations/visit/{visit_uuid}", headers=doc_headers)
    assert fetch_res.status_code == 200
    retrieved = fetch_res.json()["data"]
    assert retrieved["opd_visit_uuid"] == visit_uuid
    assert retrieved["doctor_name"] == "Dr. Ramesh Sharma"
    assert len(retrieved["diagnoses"]) == 2

    # 7. Unauthenticated Protection
    unauth = client.post("/api/v1/consultations/draft", json=draft_payload)
    assert unauth.status_code == 401

