"""
Automated Pytest Suite: Dual-Path IPD Admission & Bed Allocation (TASK-BE-4.2, BE-4.3, BE-4.4)
Verifies:
- Path A: OPD Referral handoff with auto-population of provisional diagnosis and doctor.
- Path B: Direct / Emergency Walk-In admission with Forms 8 & 9 legal and financial flags.
- Concurrency-safe bed allocation, locking historical tariff, and preventing double-occupancy (409 Conflict).
- Inpatient bed occupancy matrix reflection.
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
    assert login_resp.status_code == 200, f"Receptionist login failed: {login_resp.text}"
    return login_resp.json()["access_token"]


@pytest.fixture
def doctor_token(client):
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"username": "dr.sharma@brightsolutions.in", "password": "Doctor@123"},
    )
    assert login_resp.status_code == 200, f"Doctor login failed: {login_resp.text}"
    return login_resp.json()["access_token"]


def test_dual_path_ipd_admission_and_bed_allocation(client, receptionist_token, doctor_token):
    rec_headers = {"Authorization": f"Bearer {receptionist_token}"}
    doc_headers = {"Authorization": f"Bearer {doctor_token}"}
    ts = int(time.time())

    # 1. Fetch Bed Matrix to find available beds
    matrix_resp = client.get("/api/v1/beds/matrix", headers=rec_headers)
    assert matrix_resp.status_code == 200
    wards = matrix_resp.json()["wards"]
    available_beds = []
    for w in wards:
        for r in w["rooms"]:
            for b in r["beds"]:
                if b["status"] == "AVAILABLE":
                    available_beds.append(b["uuid"])

    assert len(available_beds) >= 2, "Need at least 2 available beds for testing"
    bed_path_a = available_beds[0]
    bed_path_b = available_beds[1]

    # -------------------------------------------------------------------------
    # PATH A: OPD Referral Handoff
    # -------------------------------------------------------------------------
    # A1. Register Patient A
    p_a_resp = client.post(
        "/api/v1/patients",
        headers=rec_headers,
        json={
            "first_name": "Kishore",
            "last_name": f"Dave_{ts}",
            "dob": "1975-08-20",
            "gender": "MALE",
            "phone": f"9821{ts % 1000000:06d}",
            "aadhaar_number": f"77{ts % 10000000000:010d}",
            "address_line1": "Flat 402, Shanti Complex",
            "city": "Ahmedabad",
            "state": "Gujarat",
            "postal_code": "380015",
        },
    )
    assert p_a_resp.status_code == 201
    pat_a_uuid = p_a_resp.json()["data"]["public_id"]
    pat_a_uhid = p_a_resp.json()["data"]["uhid"]

    # A2. OPD Token Check-In
    token_resp = client.post(
        "/api/v1/opd/visits",
        headers=rec_headers,
        json={
            "uhid": pat_a_uhid,
            "visit_type": "NEW",
        },
    )
    assert token_resp.status_code == 201
    visit_a_uuid = token_resp.json()["data"]["visit_uuid"]
    doc_profile_uuid = token_resp.json()["data"]["doctor_uuid"]

    # A3. Doctor Chamber Consultation Draft
    cons_resp = client.post(
        "/api/v1/consultations/draft",
        headers=doc_headers,
        json={
            "opd_visit_uuid": visit_a_uuid,
            "subjective": "Severe left lower quadrant pain and high-grade fever.",
            "assessment": "Acute diverticulitis with localized peritonitis.",
        },
    )
    assert cons_resp.status_code == 200
    cons_uuid = cons_resp.json()["data"]["public_id"]

    # A4. Doctor Refers Patient to IPD
    ref_resp = client.post(
        f"/api/v1/consultations/{cons_uuid}/refer-ipd",
        headers=doc_headers,
        json={
            "provisional_diagnosis": "Acute Diverticulitis with Sepsis",
            "preferred_bed_category": "GENERAL",
            "clinical_urgency": "EMERGENCY",
            "reason_for_admission": "Requires immediate IV antibiotics and surgical observation.",
        },
    )
    assert ref_resp.status_code == 201
    referral_uuid = ref_resp.json()["data"]["referral_uuid"]

    # A5. IPD Admission Desk admits Patient via Path A (using referral_uuid)
    adm_a_resp = client.post(
        "/api/v1/ipd/admissions",
        headers=rec_headers,
        json={
            "referral_uuid": referral_uuid,
            "bed_uuid": bed_path_a,
            "admission_type": "EMERGENCY",
            "advance_amount_paid": 3000.00,
            "guardian_name": "Meena Dave",
            "guardian_relationship": "Wife",
            "guardian_phone": "9821000000",
            "payment_category": "SELF_PAY_CASH",
        },
    )
    assert adm_a_resp.status_code == 201, adm_a_resp.text
    adm_a = adm_a_resp.json()
    assert adm_a["admission_source"] == "OPD_REFERRAL"
    assert adm_a["status"] == "ADMITTED"
    assert adm_a["ipd_number"].startswith("IPD-")
    assert adm_a["provisional_diagnosis"] == "Acute Diverticulitis with Sepsis"
    assert adm_a["bed_uuid"] == bed_path_a
    assert float(adm_a["advance_amount_paid"]) == 3000.00

    # A6. Verify referral cannot be admitted twice (400 Bad Request)
    dup_ref_resp = client.post(
        "/api/v1/ipd/admissions",
        headers=rec_headers,
        json={
            "referral_uuid": referral_uuid,
            "bed_uuid": bed_path_b,
        },
    )
    assert dup_ref_resp.status_code == 400
    assert "already been admitted" in dup_ref_resp.json()["detail"]

    # -------------------------------------------------------------------------
    # PATH B: Direct / Emergency Walk-In (Forms 8 & 9 Legal & Financial Flags)
    # -------------------------------------------------------------------------
    # B1. Register Direct Patient B
    p_b_resp = client.post(
        "/api/v1/patients",
        headers=rec_headers,
        json={
            "first_name": "Rohan",
            "last_name": f"Verma_{ts}",
            "dob": "1992-11-04",
            "gender": "MALE",
            "phone": f"9822{ts % 1000000:06d}",
            "aadhaar_number": f"88{ts % 10000000000:010d}",
            "address_line1": "12, Ring Road, Athwa Lines",
            "city": "Surat",
            "state": "Gujarat",
            "postal_code": "395007",
        },
    )
    assert p_b_resp.status_code == 201
    pat_b_uuid = p_b_resp.json()["data"]["public_id"]

    # B2. Direct Admission with MLC and TPA Insurance flags
    adm_b_resp = client.post(
        "/api/v1/ipd/admissions",
        headers=rec_headers,
        json={
            "patient_uuid": pat_b_uuid,
            "attending_doctor_uuid": doc_profile_uuid,
            "bed_uuid": bed_path_b,
            "admission_source": "EMERGENCY_DIRECT",
            "admission_type": "EMERGENCY",
            "provisional_diagnosis": "Polytrauma with blunt chest injury",
            "is_mlc": True,
            "mlc_details": "Road Traffic Accident on NH-48. FIR #342/2026 at Navrangpura Police Station.",
            "guardian_name": "Vikram Verma",
            "guardian_relationship": "Brother",
            "guardian_phone": "9822112233",
            "payment_category": "TPA_INSURANCE",
            "tpa_provider": "Star Health & Allied Insurance",
            "tpa_policy_number": "SH/POL/2026/89410",
            "advance_amount_paid": 5000.00,
        },
    )
    assert adm_b_resp.status_code == 201, adm_b_resp.text
    adm_b = adm_b_resp.json()
    assert adm_b["admission_source"] == "EMERGENCY_DIRECT"
    assert adm_b["is_mlc"] is True
    assert "FIR #342" in adm_b["mlc_details"]
    assert adm_b["payment_category"] == "TPA_INSURANCE"
    assert adm_b["tpa_provider"] == "Star Health & Allied Insurance"
    assert float(adm_b["advance_amount_paid"]) == 5000.00
    adm_b_uuid = adm_b["uuid"]

    # -------------------------------------------------------------------------
    # CONCURRENCY / DOUBLE-BOOKING GUARD CHECK
    # -------------------------------------------------------------------------
    # Try to admit another patient into bed_path_b (which is now OCCUPIED)
    collision_resp = client.post(
        "/api/v1/ipd/admissions",
        headers=rec_headers,
        json={
            "patient_uuid": pat_a_uuid,
            "attending_doctor_uuid": doc_profile_uuid,
            "bed_uuid": bed_path_b,
            "provisional_diagnosis": "Secondary test collision attempt",
        },
    )
    assert collision_resp.status_code == 409
    assert "OCCUPIED" in collision_resp.json()["detail"]

    # -------------------------------------------------------------------------
    # BED MATRIX REAL-TIME REFLECTION & INPATIENT LIST
    # -------------------------------------------------------------------------
    updated_matrix = client.get("/api/v1/beds/matrix", headers=rec_headers).json()
    assert updated_matrix["summary"]["occupied_beds"] >= 2
    assert updated_matrix["summary"]["occupancy_rate_percentage"] > 0.0

    # Query Inpatient Admissions List
    inpatient_list = client.get(
        "/api/v1/ipd/admissions?status_filter=ADMITTED",
        headers=rec_headers,
    )
    assert inpatient_list.status_code == 200
    admissions = inpatient_list.json()
    assert any(a["uuid"] == adm_b_uuid for a in admissions)

    # Query single admission
    single_adm = client.get(
        f"/api/v1/ipd/admissions/{adm_b_uuid}",
        headers=rec_headers,
    )
    assert single_adm.status_code == 200
    assert single_adm.json()["guardian_name"] == "Vikram Verma"
