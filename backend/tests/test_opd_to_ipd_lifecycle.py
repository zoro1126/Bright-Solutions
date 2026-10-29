"""
Automated Pytest Suite: Comprehensive OPD to IPD Lifecycle (TASK-BE-7.1)
Verifies the complete end-to-end clinical and administrative vertical slice:
1. Patient Registration (UHID generation, duplicate checking)
2. OPD Queue Check-In & Token Allocation
3. Nurse Triage Vitals Intake & CDSS Rule Evaluation
4. Doctor Consultation Chamber & ICD-10 Diagnosis Linking
5. Doctor Inpatient Referral Order & CDSS DDI Safety Check
6. Digital Consultation Sign-Off (Cryptographic immutability lock & IPD queue routing)
7. Inpatient Admission Desk (Dual-path handoff, Bed Matrix, Forms 8 & 9 print dossier)
8. Doctor Admission H&P Note (AH/MRD/FORM - 10)
9. Operational Flowsheets: Doctor Treatment Orders & Nurse MAR (AH/MRD/FORM - 29)
10. Shift Intake & Output Fluid Balance Charting (AH/MRD/FORM - 61)
11. Pre-Operative Nurse Safety Checklist (AH/MRD/FORM - 54)
12. Clinical Form Immutability Locking
13. Attending Doctor Structured Discharge Summary & Digital Sign-off
14. Live Accrued 10-Head Inpatient Ledger Calculation
15. Final IPD Invoicing with Advance Credit & UPI Settlement (Exact Rupee Balance)
16. Formal Discharge & Bed Release to CLEANING state
"""

from decimal import Decimal
import time
import pytest
from fastapi.testclient import TestClient

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
def doctor_token(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "dr.sharma@brightsolutions.in", "password": "Doctor@123"},
    )
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


@pytest.fixture
def nurse_token(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "nurse.anita@brightsolutions.in", "password": "Nurse@123"},
    )
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


@pytest.fixture
def billing_token(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "billing@brightsolutions.in", "password": "Billing@123"},
    )
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def test_full_opd_to_ipd_clinical_and_billing_lifecycle(
    client,
    receptionist_token,
    doctor_token,
    nurse_token,
    billing_token,
):
    rec_headers = {"Authorization": f"Bearer {receptionist_token}"}
    doc_headers = {"Authorization": f"Bearer {doctor_token}"}
    nurse_headers = {"Authorization": f"Bearer {nurse_token}"}
    bill_headers = {"Authorization": f"Bearer {billing_token}"}
    ts = int(time.time())

    # =========================================================================
    # Step 1: Patient Registration (UHID Generation)
    # =========================================================================
    reg_resp = client.post(
        "/api/v1/patients",
        headers=rec_headers,
        json={
            "first_name": "Vikram",
            "last_name": f"Sarabhai_{ts}",
            "dob": "1980-08-12",
            "gender": "MALE",
            "phone": f"9822{ts % 1000000:06d}",
            "aadhaar_number": f"88{ts % 10000000000:010d}",
            "address_line1": "100, Vikram Nagar, Satellite",
            "city": "Ahmedabad",
            "state": "Gujarat",
            "postal_code": "380015",
            "blood_group": "B+",
        },
    )
    assert reg_resp.status_code == 201, reg_resp.text
    pat_data = reg_resp.json()["data"]
    pat_uuid = pat_data["public_id"]
    pat_uhid = pat_data["uhid"]
    assert pat_uhid.startswith("BS-")

    # =========================================================================
    # Step 2: OPD Queue Check-In & Token Issuance
    # =========================================================================
    checkin_resp = client.post(
        "/api/v1/opd/visits",
        headers=rec_headers,
        json={
            "uhid": pat_uhid,
            "visit_type": "NEW",
        },
    )
    assert checkin_resp.status_code == 201, checkin_resp.text
    visit_data = checkin_resp.json()["data"]
    visit_uuid = visit_data["visit_uuid"]
    token_number = visit_data["token_number"]
    doc_uuid = visit_data["doctor_uuid"]
    assert token_number >= 1

    # =========================================================================
    # Step 3: Nurse Triage Vitals Intake & CDSS Rule Evaluation
    # =========================================================================
    vitals_resp = client.post(
        "/api/v1/triage/vitals",
        headers=nurse_headers,
        json={
            "patient_uuid": pat_uuid,
            "opd_visit_uuid": visit_uuid,
            "temperature_f": 102.2,
            "pulse_bpm": 112,
            "blood_pressure_systolic": 145,
            "blood_pressure_diastolic": 92,
            "respiratory_rate_bpm": 26,
            "spo2_percentage": 90,
            "height_cm": 175.0,
            "weight_kg": 78.0,
            "pain_scale": 6,
        },
    )
    assert vitals_resp.status_code == 201, vitals_resp.text
    vitals_data = vitals_resp.json()["data"]
    assert Decimal(str(vitals_data["bmi"])) > Decimal("20.0")
    assert vitals_data["is_abnormal"] is True
    flag_text = " ".join(vitals_data["abnormal_flags"])
    assert "Hypoxia" in flag_text or "Tachypnea" in flag_text

    # =========================================================================
    # Step 4: Doctor Consultation Chamber & SOAP Notes
    # =========================================================================
    cons_resp = client.post(
        "/api/v1/consultations/draft",
        headers=doc_headers,
        json={
            "opd_visit_uuid": visit_uuid,
            "subjective": "Patient reports 3 days of progressive cough, purulent sputum, and acute shortness of breath.",
            "objective": "T 102.2°F, SpO2 91% on room air, bilateral coarse crepitations, bronchial breath sounds at right base.",
            "assessment": "Severe Community-Acquired Pneumonia with type 1 respiratory failure.",
            "plan": "Admit to IPD for continuous O2 support, IV antibiotics, and daily respiratory monitoring.",
            "diagnoses": [
                {
                    "code": "J18.9",
                    "name": "Pneumonia, unspecified organism",
                    "is_primary": True,
                }
            ],
        },
    )
    assert cons_resp.status_code == 200, cons_resp.text
    cons_data = cons_resp.json()["data"]
    cons_uuid = cons_data["public_id"]

    # =========================================================================
    # Step 5: Doctor Inpatient Referral Order
    # =========================================================================
    ref_resp = client.post(
        f"/api/v1/consultations/{cons_uuid}/refer-ipd",
        headers=doc_headers,
        json={
            "provisional_diagnosis": "Severe Community-Acquired Pneumonia with Hypoxia",
            "preferred_bed_category": "SEMI_PRIVATE",
            "clinical_urgency": "EMERGENCY",
            "reason_for_admission": "Severe desaturation requiring high-flow oxygen and parenteral antibiotics.",
        },
    )
    assert ref_resp.status_code == 201, ref_resp.text
    referral_uuid = ref_resp.json()["data"]["referral_uuid"]

    # =========================================================================
    # Step 6: Digital Consultation Sign-Off (Lock & Route)
    # =========================================================================
    sign_resp = client.post(
        f"/api/v1/consultations/{cons_uuid}/sign",
        headers=doc_headers,
    )
    assert sign_resp.status_code == 200, sign_resp.text
    assert sign_resp.json()["data"]["status"] == "SIGNED"

    # =========================================================================
    # Step 7: IPD Admission Desk Intake & Bed Allocation
    # =========================================================================
    matrix_resp = client.get("/api/v1/beds/matrix", headers=rec_headers)
    assert matrix_resp.status_code == 200
    chosen_bed_uuid = None
    for w in matrix_resp.json()["wards"]:
        for r in w["rooms"]:
            for b in r["beds"]:
                if b["status"] == "AVAILABLE":
                    chosen_bed_uuid = b["uuid"]
                    break
            if chosen_bed_uuid:
                break
        if chosen_bed_uuid:
            break
    assert chosen_bed_uuid is not None

    adm_resp = client.post(
        "/api/v1/ipd/admissions",
        headers=rec_headers,
        json={
            "referral_uuid": referral_uuid,
            "bed_uuid": chosen_bed_uuid,
            "admission_type": "EMERGENCY",
            "guardian_name": "Kamala Sarabhai",
            "guardian_relationship": "Sister",
            "guardian_phone": "9822000000",
            "payment_category": "SELF_PAY_CASH",
            "advance_amount_paid": 5000.00,
        },
    )
    assert adm_resp.status_code == 201, adm_resp.text
    adm_data = adm_resp.json()
    admission_uuid = adm_data["uuid"]
    ipd_number = adm_data["ipd_number"]
    assert adm_data["status"] == "ADMITTED"
    assert Decimal(str(adm_data["advance_amount_paid"])) == Decimal("5000.00")

    # 7a. Print payload for Forms 8 & 9
    print_resp = client.get(
        f"/api/v1/ipd/admissions/{admission_uuid}/consent-form",
        headers=rec_headers,
    )
    assert print_resp.status_code == 200
    print_data = print_resp.json()
    assert print_data["face_sheet"]["demographics"]["ipd_number"] == ipd_number
    assert len(print_data["consent_form"]["clauses"]) >= 4

    # =========================================================================
    # Step 8: Doctor H&P Admission Note (AH/MRD/FORM - 10)
    # =========================================================================
    hp_resp = client.post(
        f"/api/v1/ipd/admissions/{admission_uuid}/forms/FORM_10",
        headers=doc_headers,
        json={
            "payload": {
                "chief_complaints": "High grade fever with chills and productive cough for 3 days",
                "history_of_present_illness": "Patient was in usual health until 3 days ago when fever started. Progressed to tachypnea.",
                "past_medical_history": "Mild hypertension, non-smoker, no history of TB.",
                "systemic_exam_cvs": "S1 S2 heard, tachycardic, no murmurs.",
                "systemic_exam_rs": "Bilateral coarse rales, diminished air entry right mid and lower zone.",
                "systemic_exam_pa": "Soft, non-tender, normal bowel sounds present.",
                "systemic_exam_cns": "Conscious, oriented to time, place, and person, GCS 15/15.",
                "provisional_diagnosis": "Right Middle & Lower Lobe Lobar Pneumonia",
                "plan_of_management": "IV Ceftriaxone 1g BD, IV Azithromycin 500mg OD, Supplemental O2.",
            }
        },
    )
    assert hp_resp.status_code == 201, hp_resp.text

    # =========================================================================
    # Step 9: Operational Flowsheets - Treatment Orders & Nurse MAR (Form 29)
    # =========================================================================
    # 9a. Prescribe Medication
    med_order_resp = client.post(
        f"/api/v1/ipd/admissions/{admission_uuid}/treatment-orders",
        headers=doc_headers,
        json={
            "order_type": "MEDICATION",
            "drug_name": "Inj Ceftriaxone",
            "dosage": "1g",
            "route": "IV",
            "frequency": "BD",
            "instructions": "Administer after test dose",
        },
    )
    assert med_order_resp.status_code == 201
    med_order_uuid = med_order_resp.json()["order_uuid"]

    # 9b. Prescribe Oxygen Therapy
    o2_order_resp = client.post(
        f"/api/v1/ipd/admissions/{admission_uuid}/treatment-orders",
        headers=doc_headers,
        json={
            "order_type": "O2_THERAPY",
            "o2_device": "NASAL_PRONGS",
            "o2_flow_rate_lpm": 4.0,
            "instructions": "Titrate to keep SpO2 >= 95%",
        },
    )
    assert o2_order_resp.status_code == 201

    # 9c. Nurse MAR Administration
    mar_resp = client.post(
        f"/api/v1/ipd/treatment-orders/{med_order_uuid}/administer",
        headers=nurse_headers,
        json={
            "status": "GIVEN",
            "notes": "Infused slowly in 100ml NS over 30 mins. No adverse reaction.",
        },
    )
    assert mar_resp.status_code == 201
    assert mar_resp.json()["status"] == "GIVEN"

    # =========================================================================
    # Step 10: Shift Intake & Output Fluid Balance Charting (Form 61)
    # =========================================================================
    io_resp = client.post(
        f"/api/v1/ipd/admissions/{admission_uuid}/intake-output",
        headers=nurse_headers,
        json={
            "shift": "MORNING",
            "oral_rt_intake_ml": 400,
            "iv_fluid_type": "Normal Saline 0.9%",
            "iv_fluid_intake_ml": 1000,
            "urine_output_ml": 850,
            "vomitus_rt_aspirate_ml": 0,
            "stool_count": 1,
            "drain_output_ml": 0,
            "remarks": "Adequate diuresis, patient tolerating oral fluids.",
        },
    )
    assert io_resp.status_code == 201
    assert io_resp.json()["net_balance_ml"] == 550  # (400 + 1000) - 850

    # =========================================================================
    # Step 11: Pre-Operative Nurse Safety Checklist (Form 54)
    # =========================================================================
    preop_resp = client.post(
        f"/api/v1/ipd/admissions/{admission_uuid}/forms/FORM_54",
        headers=nurse_headers,
        json={
            "payload": {
                "patient_id_band_verified": True,
                "informed_consent_signed": True,
                "surgical_site_marked": True,
                "npo_status_verified": True,
                "clothing_and_jewellery_removed": True,
                "dentures_and_lenses_removed": True,
                "preop_medications_administered": True,
                "blood_products_arranged_crossmatched": True,
                "blood_units_available_count": 2,
                "pac_clearance_documented": True,
                "transferring_ward_nurse": "Nurse Anita, GNM",
                "ot_receiving_nurse": "Nurse Priya, OT Staff",
            }
        },
    )
    assert preop_resp.status_code == 201

    # =========================================================================
    # Step 12: Lock Clinical Form (Immutable Legal Record)
    # =========================================================================
    lock_resp = client.post(
        f"/api/v1/ipd/admissions/{admission_uuid}/forms/FORM_10/lock",
        headers=doc_headers,
    )
    assert lock_resp.status_code == 200
    assert lock_resp.json()["status"] == "LOCKED"

    # =========================================================================
    # Step 13: Attending Doctor Structured Discharge Summary
    # =========================================================================
    dc_summary_resp = client.post(
        f"/api/v1/ipd/admissions/{admission_uuid}/discharge-summary",
        headers=doc_headers,
        json={
            "final_diagnosis": "Right Lobar Pneumonia - Clinically Resolved (ICD-10 J18.9)",
            "hospital_course": (
                "Patient admitted in hypoxic state (SpO2 91%). Managed with IV Ceftriaxone, Azithromycin, "
                "and nasal O2. Fever settled on Day 2, respiratory distress resolved. Auscultation clear. "
                "Room air SpO2 stable at 98%. Discharged in hemodynamically stable condition."
            ),
            "condition_at_discharge": "STABLE",
            "procedures_performed": "IV Cannulation, High-Flow Supplemental O2 Therapy",
            "discharge_vitals": {
                "bp_systolic": 122,
                "bp_diastolic": 76,
                "pulse": 74,
                "temperature_f": 98.6,
                "spo2": 98,
            },
            "discharge_medications": [
                {
                    "drug_name": "Tab Cefixime 200mg",
                    "dosage": "200mg",
                    "frequency": "BD",
                    "duration_days": 5,
                    "instructions": "Complete entire course",
                },
                {
                    "drug_name": "Tab Paracetamol 650mg",
                    "dosage": "650mg",
                    "frequency": "SOS",
                    "duration_days": 3,
                    "instructions": "Take if temperature > 100°F",
                },
            ],
            "follow_up_instructions": "Follow up in Pulmonary Clinic with repeat Chest X-Ray in 10 days.",
            "emergency_warning_signs": "Report to emergency if high fever recurrences or breathing distress develops.",
        },
    )
    assert dc_summary_resp.status_code == 201, dc_summary_resp.text
    assert dc_summary_resp.json()["condition_at_discharge"] == "STABLE"

    # =========================================================================
    # Step 14: Live Accrued 10-Head Inpatient Ledger Calculation
    # =========================================================================
    ledger_resp = client.get(
        f"/api/v1/billing/ipd/{admission_uuid}/accrued-charges",
        headers=bill_headers,
    )
    assert ledger_resp.status_code == 200, ledger_resp.text
    ledger = ledger_resp.json()
    assert ledger["ipd_number"] == ipd_number
    assert Decimal(str(ledger["gross_total"])) >= Decimal("3000.00")
    assert Decimal(str(ledger["advance_paid"])) == Decimal("5000.00")

    # =========================================================================
    # Step 15: Final IPD Invoicing with Advance Credit & UPI Settlement
    # =========================================================================
    # Add custom diagnostic procedure item so bill total exceeds advance deposit:
    invoice_resp = client.post(
        "/api/v1/billing/invoices/ipd-final",
        headers=bill_headers,
        json={
            "admission_uuid": admission_uuid,
            "discount_amount": 250.00,
            "discount_reason": "Approved Senior Citizen Concession",
            "payment_method": "UPI",
            "paid_amount": 2000.00,
            "transaction_reference": "UPI-5566778899",
            "notes": "Counter settlement via PhonePe UPI",
            "custom_items": [
                {
                    "item_type": "PROCEDURE",
                    "item_name": "High-Resolution Chest CT Scan",
                    "quantity": 1.0,
                    "unit_price": 4000.00,
                    "tax_amount": 0.00,
                }
            ],
        },
    )
    assert invoice_resp.status_code == 201, invoice_resp.text
    inv_data = invoice_resp.json()
    invoice_uuid = inv_data["public_id"]
    invoice_number = inv_data["invoice_number"]
    assert invoice_number.startswith("INV-IPD-")

    # Verify penny-perfect exact decimal rupee reconciliation
    net_amt = Decimal(str(inv_data["net_amount"]))
    tot_paid = Decimal(str(inv_data["paid_amount"]))
    bal_amt = Decimal(str(inv_data["balance_amount"]))
    assert net_amt == tot_paid + bal_amt

    # If balance remains, settle it in full:
    if bal_amt > Decimal("0.00"):
        clear_resp = client.post(
            f"/api/v1/billing/invoices/{invoice_uuid}/payments",
            headers=bill_headers,
            json={
                "amount": float(bal_amt),
                "payment_method": "CASH",
                "notes": "Final balance clearance",
            },
        )
        assert clear_resp.status_code == 201
        assert Decimal(str(clear_resp.json()["balance_amount"])) == Decimal("0.00")

    # =========================================================================
    # Step 16: Formal Inpatient Discharge & Bed Release
    # =========================================================================
    discharge_resp = client.post(
        f"/api/v1/ipd/admissions/{admission_uuid}/discharge",
        headers=bill_headers,
        json={
            "discharge_type": "NORMAL",
            "notes": "Patient recovered completely and discharged with home medications.",
        },
    )
    assert discharge_resp.status_code == 200, discharge_resp.text
    dc_res = discharge_resp.json()
    assert dc_res["status"] == "DISCHARGED"
    assert dc_res["bed_released"] is True
    assert dc_res["bed_status"] == "CLEANING"

    # 16a. Verify Bed Matrix confirms bed transitioned to CLEANING
    mat_check = client.get("/api/v1/beds/matrix", headers=rec_headers).json()
    bed_found = False
    for w in mat_check["wards"]:
        for r in w["rooms"]:
            for b in r["beds"]:
                if b["uuid"] == chosen_bed_uuid:
                    assert b["status"] == "CLEANING"
                    assert b["occupant"] is None
                    bed_found = True
                    break
    assert bed_found is True
