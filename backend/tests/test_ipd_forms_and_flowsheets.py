"""
Automated Pytest Suite: 14-Form Inpatient Clinical Suite & Flowsheets (Phase BE-5)
Verifies:
- TASK-BE-5.1: Universal Form Submission Engine & Versioning.
- TASK-BE-5.2 to BE-5.7: Pydantic Registry for Intake, Nursing, Surgical, and Transition Forms.
- TASK-BE-5.3: Repeating Daily Flowsheets (Treatment Orders, MAR, 24h Fluid Balance).
- TASK-BE-5.8: Form Immutability Locking.
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
    res = client.post("/api/v1/auth/login", json={"username": "reception@brightsolutions.in", "password": "Reception@123"})
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.fixture
def doctor_token(client):
    res = client.post("/api/v1/auth/login", json={"username": "dr.sharma@brightsolutions.in", "password": "Doctor@123"})
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.fixture
def nurse_token(client):
    res = client.post("/api/v1/auth/login", json={"username": "nurse.anita@brightsolutions.in", "password": "Nurse@123"})
    assert res.status_code == 200
    return res.json()["access_token"]


def test_ipd_clinical_forms_and_flowsheets(client, receptionist_token, doctor_token, nurse_token):
    rec_headers = {"Authorization": f"Bearer {receptionist_token}"}
    doc_headers = {"Authorization": f"Bearer {doctor_token}"}
    nurse_headers = {"Authorization": f"Bearer {nurse_token}"}
    ts = int(time.time())

    # 1. Setup Patient and Inpatient Admission
    p_resp = client.post(
        "/api/v1/patients",
        headers=rec_headers,
        json={
            "first_name": "Siddharth",
            "last_name": f"Desai_{ts}",
            "dob": "1984-06-12",
            "gender": "MALE",
            "phone": f"9825{ts % 1000000:06d}",
            "aadhaar_number": f"55{ts % 10000000000:010d}",
            "address_line1": "45, Alkapuri",
            "city": "Vadodara",
            "state": "Gujarat",
            "postal_code": "390007",
        },
    )
    assert p_resp.status_code == 201
    pat_uuid = p_resp.json()["data"]["public_id"]

    matrix = client.get("/api/v1/beds/matrix", headers=rec_headers).json()
    bed_uuid = None
    for w in matrix["wards"]:
        for r in w["rooms"]:
            for b in r["beds"]:
                if b["status"] == "AVAILABLE":
                    bed_uuid = b["uuid"]
                    break
            if bed_uuid:
                break
        if bed_uuid:
            break
    assert bed_uuid is not None

    adm_resp = client.post(
        "/api/v1/ipd/admissions",
        headers=rec_headers,
        json={
            "patient_uuid": pat_uuid,
            "attending_doctor_uuid": "2fc441e9-f86e-4881-aaa4-c3ed3e669840",
            "bed_uuid": bed_uuid,
            "admission_source": "EMERGENCY_DIRECT",
            "admission_type": "EMERGENCY",
            "provisional_diagnosis": "Perforated Appendicitis with Peritonitis",
        },
    )
    assert adm_resp.status_code == 201
    adm_uuid = adm_resp.json()["uuid"]

    # -------------------------------------------------------------------------
    # 2. TASK-BE-5.2: Intake Forms (FORM_10 Doctor H&P, FORM_70 Nurse Assessment)
    # -------------------------------------------------------------------------
    hp_payload = {
        "chief_complaints": "Acute abdominal pain in RIF for 2 days, vomiting, high fever.",
        "history_of_present_illness": "Pain started peri-umbilical then shifted to RIF with guarding.",
        "known_allergies": "No known drug allergies (NKDA)",
        "provisional_diagnosis": "Acute Perforated Appendicitis",
        "plan_of_management": "Emergency appendectomy under GA; IV Ceftriaxone + Metronidazole; NPO.",
    }
    f10_resp = client.post(
        f"/api/v1/ipd/admissions/{adm_uuid}/forms/FORM_10",
        headers=doc_headers,
        json={"payload": hp_payload},
    )
    assert f10_resp.status_code == 201, f10_resp.text
    f10_data = f10_resp.json()
    assert f10_data["form_code"] == "FORM_10"
    assert f10_data["form_version"] == 1
    assert f10_data["status"] == "SUBMITTED"

    # FORM_70 Nursing Assessment with Morse and Braden Scores
    nurse_assessment = {
        "temp_f": 101.4,
        "pulse_bpm": 108,
        "bp_systolic": 118,
        "bp_diastolic": 76,
        "resp_rate": 22,
        "spo2_percent": 97,
        "allergies_verified": True,
        "morse_fall_risk": {
            "history_of_falling": 0,
            "secondary_diagnosis": 15,
            "ambulatory_aid": 0,
            "iv_or_heparin_lock": 20,
            "gait_transferring": 10,
            "mental_status": 0,
            "total_score": 45,
            "risk_level": "MEDIUM_RISK",
        },
        "braden_pressure_score": {
            "sensory_perception": 4,
            "moisture": 3,
            "activity": 2,
            "mobility": 3,
            "nutrition": 3,
            "friction_and_shear": 2,
            "total_score": 17,
            "risk_category": "MILD_RISK",
        },
        "nurse_signature": "Nurse Anita",
    }
    f70_resp = client.post(
        f"/api/v1/ipd/admissions/{adm_uuid}/forms/FORM_70",
        headers=nurse_headers,
        json={"payload": nurse_assessment},
    )
    assert f70_resp.status_code == 201
    assert f70_resp.json()["form_code"] == "FORM_70"

    # -------------------------------------------------------------------------
    # 3. Validation Enforcement: Malformed Schema Rejection (422)
    # -------------------------------------------------------------------------
    invalid_f70 = dict(nurse_assessment)
    invalid_f70["spo2_percent"] = 150  # Out of range (max 100)
    err_resp = client.post(
        f"/api/v1/ipd/admissions/{adm_uuid}/forms/FORM_70",
        headers=nurse_headers,
        json={"payload": invalid_f70},
    )
    assert err_resp.status_code == 422
    assert "FORM_VALIDATION_ERROR" in err_resp.json()["detail"]["error"]

    # -------------------------------------------------------------------------
    # 4. TASK-BE-5.5: Surgical Forms (FORM_15 Pre-Anaesthesia, FORM_54 OT Checklist)
    # -------------------------------------------------------------------------
    pac_payload = {
        "proposed_surgery": "Emergency Laparoscopic Appendectomy",
        "proposed_anaesthesia": "GENERAL",
        "mallampati_class": "CLASS_II",
        "asa_ps_grade": "ASA_E",
        "airway_and_cervical_mobility": "Normal cervical movement",
        "dentition_status": "INTACT",
        "npo_fasting_solids_hours": 8,
        "npo_fasting_clears_hours": 3,
        "anaesthetic_risk_cleared": True,
        "anaesthetist_name": "Dr. Pradeep Shah (MD Anaesthesia)",
    }
    f15_resp = client.post(
        f"/api/v1/ipd/admissions/{adm_uuid}/forms/FORM_15",
        headers=doc_headers,
        json={"payload": pac_payload},
    )
    assert f15_resp.status_code == 201

    ot_checklist = {
        "patient_id_band_verified": True,
        "informed_consent_signed": True,
        "surgical_site_marked": True,
        "npo_status_verified": True,
        "clothing_and_jewellery_removed": True,
        "dentures_and_lenses_removed": True,
        "preop_medications_administered": True,
        "blood_products_arranged_crossmatched": True,
        "pac_clearance_documented": True,
        "transferring_ward_nurse": "Nurse Anita",
        "ot_receiving_nurse": "Nurse Preeti",
    }
    f54_resp = client.post(
        f"/api/v1/ipd/admissions/{adm_uuid}/forms/FORM_54",
        headers=nurse_headers,
        json={"payload": ot_checklist},
    )
    assert f54_resp.status_code == 201

    # -------------------------------------------------------------------------
    # 5. TASK-BE-5.8: Form Immutability Locking
    # -------------------------------------------------------------------------
    lock_resp = client.post(
        f"/api/v1/ipd/admissions/{adm_uuid}/forms/FORM_10/lock",
        headers=doc_headers,
    )
    assert lock_resp.status_code == 200
    assert lock_resp.json()["status"] == "LOCKED"

    # Cannot lock already locked form (400 Bad Request)
    dup_lock = client.post(
        f"/api/v1/ipd/admissions/{adm_uuid}/forms/FORM_10/lock",
        headers=doc_headers,
    )
    assert dup_lock.status_code == 400

    # -------------------------------------------------------------------------
    # 6. TASK-BE-5.3: Flowsheets (Treatment Orders, MAR, 24h Fluid Balance)
    # -------------------------------------------------------------------------
    # A. Doctor creates medication order & O2 therapy order
    med_order_resp = client.post(
        f"/api/v1/ipd/admissions/{adm_uuid}/treatment-orders",
        headers=doc_headers,
        json={
            "order_type": "MEDICATION",
            "drug_name": "Inj. Ceftriaxone 1g",
            "dosage": "1g IV",
            "route": "IV",
            "frequency": "BD",
            "instructions": "Administer slowly over 15 minutes after negative skin test",
        },
    )
    assert med_order_resp.status_code == 201
    order_uuid = med_order_resp.json()["order_uuid"]

    o2_order_resp = client.post(
        f"/api/v1/ipd/admissions/{adm_uuid}/treatment-orders",
        headers=doc_headers,
        json={
            "order_type": "O2_THERAPY",
            "o2_device": "NASAL_PRONGS",
            "o2_flow_rate_lpm": 3.0,
            "instructions": "Maintain SpO2 >= 95%",
        },
    )
    assert o2_order_resp.status_code == 201

    # B. Nurse logs dose in MAR (GIVEN)
    mar_resp = client.post(
        f"/api/v1/ipd/treatment-orders/{order_uuid}/administer",
        headers=nurse_headers,
        json={"status": "GIVEN", "notes": "Skin test negative. Dose 1 infused."},
    )
    assert mar_resp.status_code == 201
    assert mar_resp.json()["status"] == "GIVEN"

    # C. Nurse records 24h Fluid Intake & Output (FORM_61)
    # Shift 1 (Morning): Intake 1200ml, Output 800ml -> Net +400ml
    io_morn = client.post(
        f"/api/v1/ipd/admissions/{adm_uuid}/intake-output",
        headers=nurse_headers,
        json={
            "shift": "MORNING",
            "oral_rt_intake_ml": 200,
            "iv_fluid_type": "RL + DNS",
            "iv_fluid_intake_ml": 1000,
            "urine_output_ml": 750,
            "drain_output_ml": 50,
        },
    )
    assert io_morn.status_code == 201
    assert io_morn.json()["net_balance_ml"] == 400

    # Shift 2 (Evening): Intake 800ml, Output 950ml -> Net -150ml
    io_eve = client.post(
        f"/api/v1/ipd/admissions/{adm_uuid}/intake-output",
        headers=nurse_headers,
        json={
            "shift": "EVENING",
            "oral_rt_intake_ml": 300,
            "iv_fluid_type": "DNS",
            "iv_fluid_intake_ml": 500,
            "urine_output_ml": 800,
            "vomitus_rt_aspirate_ml": 150,
        },
    )
    assert io_eve.status_code == 201
    assert io_eve.json()["net_balance_ml"] == -150

    # D. Retrieve Cumulative 24h Fluid Chart
    io_hist = client.get(
        f"/api/v1/ipd/admissions/{adm_uuid}/intake-output",
        headers=nurse_headers,
    ).json()
    assert io_hist["total_records"] == 2
    assert io_hist["cumulative_intake_ml"] == 2000
    assert io_hist["cumulative_output_ml"] == 1750
    assert io_hist["cumulative_net_balance_ml"] == 250  # 2000 - 1750 = +250ml

    # E. List all forms submitted for this admission
    forms_list = client.get(
        f"/api/v1/ipd/admissions/{adm_uuid}/forms",
        headers=doc_headers,
    ).json()
    assert len(forms_list) >= 4
    codes = [f["form_code"] for f in forms_list]
    assert "FORM_10" in codes
    assert "FORM_70" in codes
    assert "FORM_15" in codes
    assert "FORM_54" in codes
