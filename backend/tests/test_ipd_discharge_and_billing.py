"""
Automated Pytest Suite: Inpatient Discharge & Consolidated 10-Head Billing (Phase BE-6)
Covers TASK-BE-6.1, TASK-BE-6.2, TASK-BE-6.3, and TASK-BE-6.4.
Verifies:
1. Doctor authors & signs structured discharge summary (immutability, 409 conflict on re-sign).
2. Live accrued 10-head inpatient charges calculation (NABH/IRDAI standard).
3. Consolidated final IPD invoice generation (monotonic INV-IPD sequence, advance deduction, payments, exact rupee balance).
4. Discharge balance lock (CANNOT_DISCHARGE if unsettled balance or missing signed summary).
5. Formal discharge execution (admission status DISCHARGED, bed allocation released, bed status transitioned to CLEANING).
"""

from decimal import Decimal
import time
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.core.database import engine
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


@pytest.fixture
def admin_token(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "admin@brightsolutions.in", "password": "Admin@123"},
    )
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def test_ipd_discharge_summary_and_10_head_billing(
    client,
    receptionist_token,
    doctor_token,
    nurse_token,
    billing_token,
    admin_token,
):
    rec_headers = {"Authorization": f"Bearer {receptionist_token}"}
    doc_headers = {"Authorization": f"Bearer {doctor_token}"}
    nurse_headers = {"Authorization": f"Bearer {nurse_token}"}
    bill_headers = {"Authorization": f"Bearer {billing_token}"}
    adm_headers = {"Authorization": f"Bearer {admin_token}"}
    ts = int(time.time())

    # =========================================================================
    # Step 1: Register Patient and Admit to IPD with Advance Deposit
    # =========================================================================
    p_resp = client.post(
        "/api/v1/patients",
        headers=rec_headers,
        json={
            "first_name": "Ramesh",
            "last_name": f"Patel_{ts}",
            "dob": "1978-04-15",
            "gender": "MALE",
            "phone": f"9824{ts % 1000000:06d}",
            "aadhaar_number": f"66{ts % 10000000000:010d}",
            "address_line1": "72, Sayaji Baug",
            "city": "Vadodara",
            "state": "Gujarat",
            "postal_code": "390001",
        },
    )
    assert p_resp.status_code == 201, p_resp.text
    pat_uuid = p_resp.json()["data"]["public_id"]

    # Pick an available bed
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
    assert bed_uuid is not None, "An available bed is required"

    doc_uuid = "2fc441e9-f86e-4881-aaa4-c3ed3e669840"

    # Admit with advance payment of ₹5,000.00
    adm_resp = client.post(
        "/api/v1/ipd/admissions",
        headers=rec_headers,
        json={
            "patient_uuid": pat_uuid,
            "attending_doctor_uuid": doc_uuid,
            "bed_uuid": bed_uuid,
            "admission_source": "EMERGENCY_DIRECT",
            "admission_type": "EMERGENCY",
            "provisional_diagnosis": "Acute Severe Bronchospasm with Hypoxia",
            "is_mlc": False,
            "guardian_name": "Meenaben Patel",
            "guardian_relationship": "Spouse",
            "guardian_phone": "9824011223",
            "payment_category": "SELF_PAY_CASH",
            "advance_amount_paid": 5000.00,
        },
    )
    assert adm_resp.status_code == 201, adm_resp.text
    adm_data = adm_resp.json()
    admission_uuid = adm_data["uuid"]
    ipd_number = adm_data["ipd_number"]
    assert Decimal(str(adm_data["advance_amount_paid"])) == Decimal("5000.00")

    # =========================================================================
    # Step 2: Inpatient Flowsheet Orders (Oxygen & Daily Progress Note)
    # =========================================================================
    # 2a. Doctor prescribes Oxygen Therapy
    o2_order_resp = client.post(
        f"/api/v1/ipd/admissions/{admission_uuid}/treatment-orders",
        headers=doc_headers,
        json={
            "order_type": "O2_THERAPY",
            "o2_device": "NASAL_PRONGS",
            "o2_flow_rate_lpm": 4.0,
            "instructions": "Maintain SpO2 > 95%",
        },
    )
    assert o2_order_resp.status_code == 201, o2_order_resp.text

    # =========================================================================
    # Step 3: TASK-BE-6.1 - Doctor Authors & Signs Structured Discharge Summary
    # =========================================================================
    # 3a. Unauthorized role (Nurse) blocked from authoring discharge summary
    nurse_fail_summary = client.post(
        f"/api/v1/ipd/admissions/{admission_uuid}/discharge-summary",
        headers=nurse_headers,
        json={
            "final_diagnosis": "Acute Bronchospasm - Resolved",
            "hospital_course": "Patient admitted with severe wheezing, treated with bronchodilators.",
            "condition_at_discharge": "STABLE",
        },
    )
    assert nurse_fail_summary.status_code == 403

    # 3b. Attending Doctor authors and signs discharge summary
    summary_payload = {
        "final_diagnosis": "Acute Severe Bronchospasm - Clinically Resolved (ICD-10 J45.901)",
        "hospital_course": (
            "Patient presented with acute dyspnea and wheeze. Placed on O2 via nasal prongs at 4 L/min. "
            "Received nebulization and IV hydrocortisone. Dyspnea resolved, chest clear on auscultation. "
            "Patient is clinically stable, ambulating well, and ready for home care."
        ),
        "condition_at_discharge": "STABLE",
        "procedures_performed": "Bedside Nebulization, Continuous O2 Oximetry Monitoring",
        "discharge_vitals": {
            "bp_systolic": 120,
            "bp_diastolic": 78,
            "pulse": 76,
            "temperature_f": 98.4,
            "spo2": 99,
        },
        "discharge_medications": [
            {
                "drug_name": "Tab Montelukast + Levocetirizine",
                "dosage": "10mg/5mg",
                "frequency": "OD at night",
                "duration_days": 10,
                "instructions": "Take after dinner",
            },
            {
                "drug_name": "Inhaler Budecort 200mcg",
                "dosage": "2 puffs",
                "frequency": "BD",
                "duration_days": 14,
                "instructions": "Rinse mouth after inhalation",
            },
        ],
        "follow_up_instructions": "Review in Pulmonary OPD on Day 7 (Dr. Sharma). Avoid cold drinks and dust exposure.",
        "emergency_warning_signs": "Return immediately to Casualty if breathing difficulty recurs or blue lips observed.",
    }

    doc_summary_resp = client.post(
        f"/api/v1/ipd/admissions/{admission_uuid}/discharge-summary",
        headers=doc_headers,
        json=summary_payload,
    )
    assert doc_summary_resp.status_code == 201, doc_summary_resp.text
    summary_data = doc_summary_resp.json()
    assert summary_data["admission_uuid"] == admission_uuid
    assert summary_data["condition_at_discharge"] == "STABLE"
    assert summary_data["signed_at"] is not None
    assert "Dr." in summary_data["doctor_name"]

    # 3c. Verify immutability: re-submitting summary is rejected with 409 Conflict
    conflict_summary = client.post(
        f"/api/v1/ipd/admissions/{admission_uuid}/discharge-summary",
        headers=doc_headers,
        json=summary_payload,
    )
    assert conflict_summary.status_code == 409

    # 3d. Fetch signed discharge summary via GET
    get_summary_resp = client.get(
        f"/api/v1/ipd/admissions/{admission_uuid}/discharge-summary",
        headers=bill_headers,
    )
    assert get_summary_resp.status_code == 200, get_summary_resp.text
    get_data = get_summary_resp.json()
    assert get_data["final_diagnosis"] == summary_payload["final_diagnosis"]
    assert len(get_data["discharge_medications"]) == 2

    # =========================================================================
    # Step 4: TASK-BE-6.2 - Live Accrued 10-Head Inpatient Ledger Calculation
    # =========================================================================
    accrued_resp = client.get(
        f"/api/v1/billing/ipd/{admission_uuid}/accrued-charges",
        headers=bill_headers,
    )
    assert accrued_resp.status_code == 200, accrued_resp.text
    accrued = accrued_resp.json()

    assert accrued["ipd_number"] == ipd_number
    heads = accrued["charge_heads"]
    assert "bed_rent" in heads
    assert "doctor_visits" in heads
    assert "nursing_charges" in heads
    assert "procedures" in heads
    assert "pharmacy_medications" in heads
    assert "laboratory_investigations" in heads
    assert "operation_theatre" in heads
    assert "anaesthesia" in heads
    assert "oxygen_support" in heads
    assert "consumables" in heads

    # Verify rates and totals
    assert Decimal(str(heads["bed_rent"]["total"])) >= Decimal("1500.00")
    assert Decimal(str(heads["doctor_visits"]["total"])) == Decimal("600.00")
    assert Decimal(str(heads["nursing_charges"]["total"])) == Decimal("500.00")
    assert Decimal(str(heads["oxygen_support"]["total"])) == Decimal("300.00")
    assert Decimal(str(heads["consumables"]["total"])) == Decimal("350.00")

    # Gross total must equal sum of all line items
    calculated_gross = (
        Decimal(str(heads["bed_rent"]["total"]))
        + Decimal(str(heads["doctor_visits"]["total"]))
        + Decimal(str(heads["nursing_charges"]["total"]))
        + Decimal(str(heads["procedures"]["total"]))
        + Decimal(str(heads["pharmacy_medications"]["total"]))
        + Decimal(str(heads["laboratory_investigations"]["total"]))
        + Decimal(str(heads["operation_theatre"]["total"]))
        + Decimal(str(heads["anaesthesia"]["total"]))
        + Decimal(str(heads["oxygen_support"]["total"]))
        + Decimal(str(heads["consumables"]["total"]))
    )
    assert Decimal(str(accrued["gross_total"])) == calculated_gross
    assert Decimal(str(accrued["advance_paid"])) == Decimal("5000.00")

    # =========================================================================
    # Step 5: TASK-BE-6.4 Safety Guard - Cannot discharge before bill generated
    # =========================================================================
    early_discharge = client.post(
        f"/api/v1/ipd/admissions/{admission_uuid}/discharge",
        headers=bill_headers,
        json={"discharge_type": "NORMAL"},
    )
    assert early_discharge.status_code == 400
    assert "CANNOT_DISCHARGE" in early_discharge.json()["detail"]

    # =========================================================================
    # Step 6: TASK-BE-6.3 - Final Inpatient Invoice Generation & Settlement
    # =========================================================================
    # We add custom items so gross amount exceeds advance deposit:
    # Gross accrued ~ 3250.00.
    # Add custom OT + specialist charge so total becomes 10,250.00.
    # Advance credited: 5,000.00.
    # Remaining: 5,250.00.
    # We pay 3,250.00 now -> leaving 2,000.00 balance (PARTIALLY_PAID).
    invoice_payload = {
        "admission_uuid": admission_uuid,
        "discount_amount": 0.00,
        "payment_method": "UPI",
        "paid_amount": 3250.00,
        "transaction_reference": "UPI-9928104812",
        "notes": "Partial settlement via GooglePay UPI",
        "custom_items": [
            {
                "item_type": "OT",
                "item_name": "Specialist Bronchoscopy Suite Setup",
                "quantity": 1.0,
                "unit_price": 5000.00,
                "tax_amount": 0.00,
            },
            {
                "item_type": "PROCEDURE",
                "item_name": "Diagnostic Spirometry & Peak Flow Analysis",
                "quantity": 1.0,
                "unit_price": 2000.00,
                "tax_amount": 0.00,
            },
        ],
    }

    inv_resp = client.post(
        "/api/v1/billing/invoices/ipd-final",
        headers=bill_headers,
        json=invoice_payload,
    )
    assert inv_resp.status_code == 201, inv_resp.text
    inv_data = inv_resp.json()

    invoice_uuid = inv_data["public_id"]
    invoice_number = inv_data["invoice_number"]
    assert invoice_number.startswith("INV-IPD-")
    assert inv_data["invoice_type"] == "IPD_FINAL"
    assert inv_data["status"] == "PARTIALLY_PAID"

    net_amt = Decimal(str(inv_data["net_amount"]))
    adv_credited = Decimal(str(inv_data["advance_credited"]))
    cash_paid = Decimal(str(inv_data["cashier_paid"]))
    tot_paid = Decimal(str(inv_data["paid_amount"]))
    bal_amt = Decimal(str(inv_data["balance_amount"]))

    assert adv_credited == Decimal("5000.00")
    assert cash_paid == Decimal("3250.00")
    assert tot_paid == Decimal("8250.00")
    # Exact rupee balance assertion: net_amount == paid_amount + balance_amount
    assert net_amt == tot_paid + bal_amt
    assert bal_amt == Decimal("2000.00")
    assert len(inv_data["items"]) >= 7
    assert len(inv_data["payments"]) == 2  # Advance credit + Cashier UPI payment

    # Verify duplicate final invoice generation rejected with 409
    dup_inv = client.post(
        "/api/v1/billing/invoices/ipd-final",
        headers=bill_headers,
        json=invoice_payload,
    )
    assert dup_inv.status_code == 409

    # =========================================================================
    # Step 7: TASK-BE-6.4 Safety Guard - Discharge blocked with unsettled balance
    # =========================================================================
    unsettled_discharge = client.post(
        f"/api/v1/ipd/admissions/{admission_uuid}/discharge",
        headers=bill_headers,
        json={"discharge_type": "NORMAL"},
    )
    assert unsettled_discharge.status_code == 400
    assert "CANNOT_DISCHARGE" in unsettled_discharge.json()["detail"]
    assert "unsettled balance" in unsettled_discharge.json()["detail"].lower()

    # =========================================================================
    # Step 8: Settle remaining balance to ₹0.00
    # =========================================================================
    settle_pay_resp = client.post(
        f"/api/v1/billing/invoices/{invoice_uuid}/payments",
        headers=bill_headers,
        json={
            "amount": 2000.00,
            "payment_method": "CASH",
            "transaction_reference": "CASH-DESK-01",
            "notes": "Full and final balance clearance at cash counter",
        },
    )
    assert settle_pay_resp.status_code == 201, settle_pay_resp.text
    settled_inv = settle_pay_resp.json()
    assert settled_inv["status"] == "PAID"
    assert Decimal(str(settled_inv["balance_amount"])) == Decimal("0.00")
    assert Decimal(str(settled_inv["paid_amount"])) == Decimal(str(settled_inv["net_amount"]))

    # =========================================================================
    # Step 9: TASK-BE-6.4 - Formal Inpatient Discharge & Bed Release
    # =========================================================================
    formal_dc_resp = client.post(
        f"/api/v1/ipd/admissions/{admission_uuid}/discharge",
        headers=bill_headers,
        json={
            "discharge_type": "NORMAL",
            "notes": "Patient discharged in stable condition. Family given summary and prescriptions.",
        },
    )
    assert formal_dc_resp.status_code == 200, formal_dc_resp.text
    dc_data = formal_dc_resp.json()
    assert dc_data["status"] == "DISCHARGED"
    assert dc_data["discharge_type"] == "NORMAL"
    assert dc_data["bed_released"] is True
    assert dc_data["bed_status"] == "CLEANING"
    assert dc_data["invoice_number"] == invoice_number
    assert Decimal(str(dc_data["balance_amount"])) == Decimal("0.00")

    # 9a. Verify Bed Matrix confirms bed transitioned to 'CLEANING'
    matrix_after = client.get("/api/v1/beds/matrix", headers=rec_headers).json()
    target_bed = None
    for w in matrix_after["wards"]:
        for r in w["rooms"]:
            for b in r["beds"]:
                if b["uuid"] == bed_uuid:
                    target_bed = b
                    break
            if target_bed:
                break
        if target_bed:
            break
    assert target_bed is not None
    assert target_bed["status"] == "CLEANING"
    assert target_bed["occupant"] is None  # Occupant cleared upon bed release

    # 9b. Verify double discharge rejected
    double_dc = client.post(
        f"/api/v1/ipd/admissions/{admission_uuid}/discharge",
        headers=bill_headers,
        json={"discharge_type": "NORMAL"},
    )
    assert double_dc.status_code == 400

    # 9c. Housekeeper cleans bed and transitions state to 'AVAILABLE'
    clean_resp = client.patch(
        f"/api/v1/beds/{bed_uuid}/status",
        headers=nurse_headers,
        json={"status": "AVAILABLE", "notes": "Sanitization and linen change completed"},
    )
    assert clean_resp.status_code == 200
    assert clean_resp.json()["status"] == "AVAILABLE"
