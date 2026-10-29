import time
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_eprescription_ddi_and_ipd_referral():
    # 1. Login as Doctor
    doc_login = client.post("/api/v1/auth/login", json={
        "username": "dr.sharma@brightsolutions.in",
        "password": "Doctor@123"
    })
    assert doc_login.status_code == 200
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
        "first_name": "Nitin",
        "last_name": f"Kapadia{ts}",
        "dob": "1968-12-05",
        "gender": "MALE",
        "phone": f"9823{ts}",
        "address_line1": "Flat 5B, Skyline Tower",
        "city": "Rajkot",
        "state": "Gujarat",
        "postal_code": "360002"
    }, headers=rec_headers)
    assert p_res.status_code == 201
    uhid = p_res.json()["data"]["uhid"]

    opd_res = client.post("/api/v1/opd/visits", json={"uhid": uhid}, headers=rec_headers)
    assert opd_res.status_code == 201
    visit_uuid = opd_res.json()["data"]["visit_uuid"]

    # 3. Doctor starts consultation
    draft_res = client.post("/api/v1/consultations/draft", json={
        "opd_visit_uuid": visit_uuid,
        "subjective": "Chest tightness and severe shortness of breath.",
        "assessment": "Severe unstable angina; risk of NSTEMI."
    }, headers=doc_headers)
    assert draft_res.status_code == 200
    consultation_uuid = draft_res.json()["data"]["public_id"]

    # 4. CDSS Drug-Drug Interaction Evaluation
    # Test 4a: Dangerous combination (Warfarin + Aspirin)
    ddi_res1 = client.post("/api/v1/cdss/check-ddi", json={
        "drug_generics": ["Warfarin", "Aspirin"]
    }, headers=doc_headers)
    assert ddi_res1.status_code == 200
    r1 = ddi_res1.json()["data"]
    assert r1["has_interactions"] is True
    assert len(r1["interactions"]) >= 1
    assert r1["interactions"][0]["severity"] == "CONTRAINDICATED"
    assert "bleeding" in r1["interactions"][0]["clinical_mechanism"].lower()

    # Test 4b: Safe combination
    ddi_res2 = client.post("/api/v1/cdss/check-ddi", json={
        "drug_generics": ["Amoxicillin", "Paracetamol"]
    }, headers=doc_headers)
    assert ddi_res2.status_code == 200
    assert ddi_res2.json()["data"]["has_interactions"] is False

    # 5. Formulate E-Prescription
    rx_payload = {
        "uhid": uhid,
        "consultation_uuid": consultation_uuid,
        "general_instructions": "Take medications strictly as instructed. Immediate hospitalisation advised.",
        "items": [
            {
                "drug_name": "Telma 40 (Telmisartan)",
                "dosage": "40 mg",
                "frequency": "OD",
                "route": "ORAL",
                "duration_days": 14,
                "quantity_prescribed": 14,
                "food_relation": "BEFORE_FOOD",
                "special_instructions": "Take morning after waking"
            },
            {
                "drug_name": "Sorbitrate (Isosorbide Dinitrate)",
                "dosage": "5 mg",
                "frequency": "STAT",
                "route": "ORAL",
                "duration_days": 1,
                "quantity_prescribed": 1,
                "food_relation": "NO_RELATION",
                "special_instructions": "Sublingual stat for acute chest pain"
            }
        ]
    }
    rx_res = client.post("/api/v1/prescriptions", json=rx_payload, headers=doc_headers)
    assert rx_res.status_code == 201, f"Prescription failed: {rx_res.text}"
    rx_data = rx_res.json()["data"]
    assert rx_data["prescription_number"].startswith("RX-")
    assert len(rx_data["items"]) == 2
    assert rx_data["status"] == "PENDING"

    # 6. 'Admit to IPD' Inpatient Referral Order
    ref_payload = {
        "provisional_diagnosis": "Unstable Angina with Hypertensive Crisis",
        "preferred_bed_category": "ICU",
        "clinical_urgency": "EMERGENCY",
        "reason_for_admission": "Immediate continuous cardiac telemetry monitoring required."
    }
    ref_res = client.post(f"/api/v1/consultations/{consultation_uuid}/refer-ipd", json=ref_payload, headers=doc_headers)
    assert ref_res.status_code == 201
    ref_data = ref_res.json()["data"]
    assert ref_data["clinical_urgency"] == "EMERGENCY"
    assert ref_data["preferred_bed_category"] == "ICU"
    assert ref_data["status"] == "PENDING_ADMISSION"

    # 7. Check Inpatient Referral Desk Queue
    list_ref_res = client.get("/api/v1/opd/referrals/ipd", headers=rec_headers)
    assert list_ref_res.status_code == 200
    queue_items = list_ref_res.json()["data"]
    assert any(q["uhid"] == uhid for q in queue_items)
    matched = next(q for q in queue_items if q["uhid"] == uhid)
    assert matched["clinical_urgency"] == "EMERGENCY"
    assert matched["preferred_bed_category"] == "ICU"

    # 8. Unauthenticated Protection
    unauth = client.post("/api/v1/prescriptions", json=rx_payload)
    assert unauth.status_code == 401

