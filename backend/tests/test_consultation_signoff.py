import time
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from app.main import app
from app.core.database import engine

client = TestClient(app)

def test_digital_consultation_signoff_and_ipd_queue():
    # 1. Login as Doctor (has consultation:write, consultation:sign)
    doc_login = client.post("/api/v1/auth/login", json={
        "username": "dr.sharma@brightsolutions.in",
        "password": "Doctor@123"
    })
    assert doc_login.status_code == 200
    doc_token = doc_login.json()["access_token"]
    doc_headers = {"Authorization": f"Bearer {doc_token}"}

    # 2. Login as Receptionist to register patient & create OPD visit
    rec_login = client.post("/api/v1/auth/login", json={
        "username": "reception@brightsolutions.in",
        "password": "Reception@123"
    })
    rec_token = rec_login.json()["access_token"]
    rec_headers = {"Authorization": f"Bearer {rec_token}"}

    ts = str(int(time.time() * 1000))[-6:]
    p_res = client.post("/api/v1/patients", json={
        "first_name": "Kishore",
        "last_name": f"Panchal{ts}",
        "dob": "1960-08-14",
        "gender": "MALE",
        "phone": f"9821{ts}",
        "address_line1": "Flat 202, Gokul Heights",
        "city": "Rajkot",
        "state": "Gujarat",
        "postal_code": "360004"
    }, headers=rec_headers)
    assert p_res.status_code == 201
    uhid = p_res.json()["data"]["uhid"]

    opd_res = client.post("/api/v1/opd/visits", json={"uhid": uhid}, headers=rec_headers)
    assert opd_res.status_code == 201
    visit_uuid = opd_res.json()["data"]["visit_uuid"]

    # 3. Doctor drafts consultation with diagnosis
    draft_res = client.post("/api/v1/consultations/draft", json={
        "opd_visit_uuid": visit_uuid,
        "subjective": "Severe acute crushing chest pain radiating to left arm.",
        "objective": "Diaphoretic, cold clammy extremities, BP 85/50 mmHg, pulse 115 bpm.",
        "assessment": "Acute Anterior Wall STEMI with Cardiogenic Shock.",
        "plan": "Immediate ICU admission, coronary angiography, loading doses of antiplatelets.",
        "diagnoses": [
            {
                "code": "I21.9",
                "name": "Acute myocardial infarction, unspecified",
                "type": "FINAL",
                "is_primary": True
            }
        ]
    }, headers=doc_headers)
    assert draft_res.status_code == 200
    consultation_uuid = draft_res.json()["data"]["public_id"]

    # 4. Doctor creates 'Admit to IPD' emergency referral
    ref_res = client.post(f"/api/v1/consultations/{consultation_uuid}/refer-ipd", json={
        "provisional_diagnosis": "Acute Anterior Wall STEMI / Cardiogenic Shock",
        "preferred_bed_category": "ICU",
        "clinical_urgency": "EMERGENCY",
        "reason_for_admission": "Immediate ICU bed and cardiac catheterization required."
    }, headers=doc_headers)
    assert ref_res.status_code == 201

    # 5. Doctor digitally signs and locks consultation
    sign_res = client.post(f"/api/v1/consultations/{consultation_uuid}/sign", headers=doc_headers)
    assert sign_res.status_code == 200, f"Signing failed: {sign_res.text}"
    signed_data = sign_res.json()["data"]
    assert signed_data["status"] == "SIGNED"
    assert signed_data["is_referred_to_ipd"] is True
    assert signed_data["referral"]["preferred_bed_category"] == "ICU"
    assert signed_data["referral"]["clinical_urgency"] == "EMERGENCY"
    assert signed_data["signed_by_doctor"] == "Dr. Ramesh Sharma"

    # 6. Immutable lock test: Draft update on signed consultation must fail (400)
    update_res = client.post("/api/v1/consultations/draft", json={
        "opd_visit_uuid": visit_uuid,
        "subjective": "Altered subjective notes"
    }, headers=doc_headers)
    assert update_res.status_code == 400
    assert "locked" in update_res.json()["detail"].lower()

    # 7. Signing an already signed consultation must fail (400)
    resign_res = client.post(f"/api/v1/consultations/{consultation_uuid}/sign", headers=doc_headers)
    assert resign_res.status_code == 400

    # 8. Verify database state transitions
    with engine.connect() as conn:
        visit_row = conn.execute(text("SELECT status FROM opd_visits WHERE public_id = :vid"), {"vid": visit_uuid}).mappings().first()
        assert visit_row["status"] == "COMPLETED"

        tok_row = conn.execute(text("""
            SELECT qt.status, qt.completed_at FROM queue_tokens qt
            JOIN opd_visits v ON qt.opd_visit_id = v.id
            WHERE v.public_id = :vid
        """), {"vid": visit_uuid}).mappings().first()
        assert tok_row["status"] == "COMPLETED"
        assert tok_row["completed_at"] is not None

        audit_row = conn.execute(text("""
            SELECT action, entity_name, entity_public_id FROM audit_logs
            WHERE action = 'CONSULTATION_SIGNED' AND entity_public_id = :cid
        """), {"cid": consultation_uuid}).mappings().first()
        assert audit_row is not None
        assert audit_row["entity_name"] == "consultations"

    # 9. Verify Patient appears in IPD Admission Desk Referral Queue
    list_ref_res = client.get("/api/v1/opd/referrals/ipd", headers=rec_headers)
    assert list_ref_res.status_code == 200
    assert any(q["uhid"] == uhid for q in list_ref_res.json()["data"])

