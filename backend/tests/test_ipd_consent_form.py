"""
Automated Pytest Suite: Inpatient Consent & Face Sheet Print Payload (TASK-BE-4.5)
Verifies:
- Retrieval of structured print payload for Admission Consent (AH/MRD/FORM - 8) and Face Sheet (AH/MRD/FORM - 9).
- Bilingual Gujarati and English treatment authorization clauses and legal disclaimer texts.
- Demographic, clinical, bed location, MLC, and financial advance integration.
"""

import time
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def receptionist_token(client):
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"username": "reception@brightsolutions.in", "password": "Reception@123"},
    )
    assert login_resp.status_code == 200
    return login_resp.json()["access_token"]


@pytest.fixture
def nurse_token(client):
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"username": "nurse.anita@brightsolutions.in", "password": "Nurse@123"},
    )
    assert login_resp.status_code == 200
    return login_resp.json()["access_token"]


def test_ipd_admission_consent_and_face_sheet_payload(client, receptionist_token, nurse_token):
    rec_headers = {"Authorization": f"Bearer {receptionist_token}"}
    nurse_headers = {"Authorization": f"Bearer {nurse_token}"}
    ts = int(time.time())

    # 1. Unauthenticated test (401)
    unauth = client.get("/api/v1/ipd/admissions/00000000-0000-0000-0000-000000000000/consent-form")
    assert unauth.status_code == 401

    # 2. 404 test on missing admission
    missing = client.get(
        "/api/v1/ipd/admissions/00000000-0000-0000-0000-000000000000/consent-form",
        headers=nurse_headers,
    )
    assert missing.status_code == 404

    # 3. Find an AVAILABLE bed from Bed Matrix
    matrix = client.get("/api/v1/beds/matrix", headers=rec_headers).json()
    available_bed_uuid = None
    for w in matrix["wards"]:
        for r in w["rooms"]:
            for b in r["beds"]:
                if b["status"] == "AVAILABLE":
                    available_bed_uuid = b["uuid"]
                    break
            if available_bed_uuid:
                break
        if available_bed_uuid:
            break

    assert available_bed_uuid is not None, "At least one AVAILABLE bed required"

    # 4. Register a patient with complete address and demographics
    p_resp = client.post(
        "/api/v1/patients",
        headers=rec_headers,
        json={
            "first_name": "Haresh",
            "last_name": f"Panchal_{ts}",
            "dob": "1968-04-15",
            "gender": "MALE",
            "phone": f"9823{ts % 1000000:06d}",
            "aadhaar_number": f"99{ts % 10000000000:010d}",
            "address_line1": "7, Somnath Park, Gotri Road",
            "city": "Vadodara",
            "state": "Gujarat",
            "postal_code": "390021",
        },
    )
    assert p_resp.status_code == 201
    pat_data = p_resp.json()["data"]
    pat_uuid = pat_data["public_id"]

    # 5. Admit patient with MLC details and TPA insurance
    adm_resp = client.post(
        "/api/v1/ipd/admissions",
        headers=rec_headers,
        json={
            "patient_uuid": pat_uuid,
            "attending_doctor_uuid": "2fc441e9-f86e-4881-aaa4-c3ed3e669840",  # Dr. Sharma profile uuid
            "bed_uuid": available_bed_uuid,
            "admission_source": "EMERGENCY_DIRECT",
            "admission_type": "EMERGENCY",
            "provisional_diagnosis": "Acute Subdural Haematoma following accidental fall",
            "is_mlc": True,
            "mlc_details": "Fall from height at construction site; Police Intimation Form sent to Gotri PS.",
            "guardian_name": "Bharat Panchal",
            "guardian_relationship": "Son",
            "guardian_phone": "9823998877",
            "payment_category": "TPA_INSURANCE",
            "tpa_provider": "HDFC ERGO General Insurance",
            "tpa_policy_number": "HD/MED/2026/90218",
            "advance_amount_paid": 7500.00,
        },
    )
    assert adm_resp.status_code == 201
    adm_uuid = adm_resp.json()["uuid"]

    # 6. Fetch Admission Consent & Face Sheet print payload
    consent_resp = client.get(
        f"/api/v1/ipd/admissions/{adm_uuid}/consent-form",
        headers=nurse_headers,
    )
    assert consent_resp.status_code == 200, consent_resp.text
    dossier = consent_resp.json()

    # Verify Header & Hospital Letterhead
    assert "hospital" in dossier
    assert "Shubham" in dossier["hospital"]["name"]
    assert dossier["hospital"]["phone"] is not None

    # Verify Face Sheet (AH/MRD/FORM - 9)
    assert "face_sheet" in dossier
    fs = dossier["face_sheet"]
    assert fs["form_number"] == "AH/MRD/FORM - 9"
    assert "Face Sheet" in fs["form_title"]

    demo = fs["demographics"]
    assert demo["patient_uuid"] == pat_uuid
    assert demo["uhid"].startswith("BS-")
    assert demo["ipd_number"].startswith("IPD-")
    assert "Haresh" in demo["full_name"]
    assert demo["age_years"] >= 50
    assert "Vadodara" in demo["address"]

    loc = fs["location"]
    assert loc["bed_number"].startswith("BED-")
    assert float(loc["daily_tariff"]) > 0

    clin = fs["clinical"]
    assert clin["attending_doctor_name"] == "Dr. Ramesh Sharma"
    assert clin["specialization"] == "Medical Oncology"
    assert clin["medical_council_reg_no"] == "GMC-48291"
    assert "Subdural Haematoma" in clin["provisional_diagnosis"]

    legal = fs["legal_and_financial"]
    assert legal["is_mlc"] is True
    assert "Gotri PS" in legal["mlc_details"]
    assert legal["guardian_name"] == "Bharat Panchal"
    assert legal["guardian_relationship"] == "Son"
    assert legal["payment_category"] == "TPA_INSURANCE"
    assert legal["tpa_provider"] == "HDFC ERGO General Insurance"
    assert float(legal["advance_amount_paid"]) == 7500.00

    # Verify Consent Form (AH/MRD/FORM - 8)
    assert "consent_form" in dossier
    cf = dossier["consent_form"]
    assert cf["form_number"] == "AH/MRD/FORM - 8"
    assert "Consent" in cf["form_title"]
    assert cf["patient_or_guardian_name"] == "Bharat Panchal"
    assert cf["relation_to_patient"] == "Son"
    assert "સંમતિ" in cf["declaration_gu"]

    # Verify 4 bilingual clauses exist
    clauses = cf["clauses"]
    assert len(clauses) == 4
    # Check Clause 1: General treatment
    assert "General Consent" in clauses[0]["title_en"]
    assert "સામાન્ય સંમતિ" in clauses[0]["title_gu"]
    assert "hospital to administer" in clauses[0]["text_en"]
    assert "તબીબી" in clauses[0]["text_gu"]
    assert "સંભાળ" in clauses[0]["text_gu"]
    # Check Clause 2: Emergency resuscitation
    assert "Emergency Resuscitation" in clauses[1]["title_en"]
    assert "ઇમરજન્સી પુનર્જીવન" in clauses[1]["title_gu"]
    # Check Clause 3: Financial liability
    assert "Financial Tariff" in clauses[2]["title_en"]
    assert "નાણાકીય ટેરિફ" in clauses[2]["title_gu"]
    # Check Clause 4: Belongings disclaimer
    assert "Valuables" in clauses[3]["title_en"]
    assert "કિંમતી સામાન" in clauses[3]["title_gu"]
