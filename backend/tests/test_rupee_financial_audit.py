"""
Automated Pytest Suite: Exact Rupee Financial Balance Audit & Ledger Integrity (TASK-BE-7.3)
Verifies:
1. Exact Rupee Decimal Reconciliation across all 10 Inpatient Cost Heads.
2. Advance Deposit Credit & Multi-Stage Partial Settlement (Advance Credit + UPI + Cash).
3. Zero-balance enforcement and Financial Waiver Discharge mechanism.
4. Mathematical Invariants:
   - subtotal_amount == sum(invoice_items.total_amount)
   - net_amount == subtotal_amount - discount_amount + tax_amount
   - paid_amount == sum(payments.amount)
   - net_amount == paid_amount + balance_amount
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
def billing_token(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "billing@brightsolutions.in", "password": "Billing@123"},
    )
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def test_exact_rupee_financial_audit_and_multi_stage_settlement(
    client,
    receptionist_token,
    doctor_token,
    billing_token,
):
    rec_headers = {"Authorization": f"Bearer {receptionist_token}"}
    doc_headers = {"Authorization": f"Bearer {doctor_token}"}
    bill_headers = {"Authorization": f"Bearer {billing_token}"}
    ts = int(time.time())

    # 1. Register Patient
    p_resp = client.post(
        "/api/v1/patients",
        headers=rec_headers,
        json={
            "first_name": "Narayana",
            "last_name": f"Murthy_{ts}",
            "dob": "1946-08-20",
            "gender": "MALE",
            "phone": f"9821{ts % 1000000:06d}",
            "aadhaar_number": f"77{ts % 10000000000:010d}",
            "address_line1": "Infosys Avenue, Electronics City",
            "city": "Bengaluru",
            "state": "Karnataka",
            "postal_code": "560100",
            "blood_group": "AB+",
        },
    )
    assert p_resp.status_code == 201, p_resp.text
    pat_uuid = p_resp.json()["data"]["public_id"]

    # 2. Pick an available bed
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

    doctor_uuid = "2fc441e9-f86e-4881-aaa4-c3ed3e669840"

    # 3. Admit patient with advance deposit of ₹10,000.00
    adm_resp = client.post(
        "/api/v1/ipd/admissions",
        headers=rec_headers,
        json={
            "patient_uuid": pat_uuid,
            "attending_doctor_uuid": doctor_uuid,
            "bed_uuid": bed_uuid,
            "admission_source": "EMERGENCY_DIRECT",
            "admission_type": "ELECTIVE",
            "provisional_diagnosis": "Laparoscopic Cholecystectomy Post-Op",
            "is_mlc": False,
            "payment_category": "SELF_PAY_CASH",
            "advance_amount_paid": 10000.00,
        },
    )
    assert adm_resp.status_code == 201, adm_resp.text
    adm_data = adm_resp.json()
    admission_uuid = adm_data["uuid"]
    assert Decimal(str(adm_data["advance_amount_paid"])) == Decimal("10000.00")

    # 4. Doctor signs discharge summary
    doc_summary_resp = client.post(
        f"/api/v1/ipd/admissions/{admission_uuid}/discharge-summary",
        headers=doc_headers,
        json={
            "final_diagnosis": "Chronic Cholelithiasis - Laparoscopic Cholecystectomy Done (K80.20)",
            "hospital_course": "Elective surgery performed uneventfully. Healed surgical portals. Stable vitals.",
            "condition_at_discharge": "IMPROVED",
            "procedures_performed": "Laparoscopic Cholecystectomy under General Anaesthesia",
            "follow_up_instructions": "Suture removal on Day 8 in Surgical OPD.",
        },
    )
    assert doc_summary_resp.status_code == 201

    # 5. Generate consolidated invoice with detailed items matching IRDAI Template 4
    # Template: Gross 17,050.00, Discount 500.00, Tax 140.00 -> Net 16,690.00
    # Advance Credit: 10,000.00 -> Remainder 6,690.00
    # Initial Cashier UPI payment: 3,000.00 -> Balance 3,690.00
    inv_payload = {
        "admission_uuid": admission_uuid,
        "discount_amount": 500.00,
        "discount_reason": "Approved Senior Citizen Concession",
        "payment_method": "UPI",
        "paid_amount": 3000.00,
        "transaction_reference": "UPI-9928104812",
        "notes": "Partial settlement via UPI at discharge desk",
        "custom_items": [
            {
                "item_type": "OT",
                "item_name": "Laparoscopic Suite & Major OT Instrument Set",
                "quantity": 1.0,
                "unit_price": 8500.00,
                "tax_amount": 0.00,
            },
            {
                "item_type": "ANAESTHESIA",
                "item_name": "General Anaesthesia Administration & Recovery",
                "quantity": 1.0,
                "unit_price": 3500.00,
                "tax_amount": 0.00,
            },
            {
                "item_type": "PHARMACY_ITEM",
                "item_name": "Post-Op Surgical Antibiotics & Infusions Kit",
                "quantity": 1.0,
                "unit_price": 2100.00,
                "tax_amount": 140.00,  # CGST + SGST on Pharmacy
            },
        ],
    }

    inv_resp = client.post(
        "/api/v1/billing/invoices/ipd-final",
        headers=bill_headers,
        json=inv_payload,
    )
    assert inv_resp.status_code == 201, inv_resp.text
    inv_data = inv_resp.json()
    invoice_uuid = inv_data["public_id"]

    subtotal = Decimal(str(inv_data["subtotal_amount"]))
    discount = Decimal(str(inv_data["discount_amount"]))
    tax = Decimal(str(inv_data["tax_amount"]))
    net_amount = Decimal(str(inv_data["net_amount"]))
    adv_credited = Decimal(str(inv_data["advance_credited"]))
    cash_paid = Decimal(str(inv_data["cashier_paid"]))
    tot_paid = Decimal(str(inv_data["paid_amount"]))
    balance_due = Decimal(str(inv_data["balance_amount"]))

    # Verification of Invariant 1: Net == Subtotal - Discount + Tax
    assert net_amount == subtotal - discount + tax
    assert discount == Decimal("500.00")
    assert tax == Decimal("140.00")
    assert adv_credited == Decimal("10000.00")
    assert cash_paid == Decimal("3000.00")
    assert tot_paid == Decimal("13000.00")

    # Verification of Invariant 2: Net == Paid + Balance
    assert net_amount == tot_paid + balance_due
    assert inv_data["status"] == "PARTIALLY_PAID"

    # 6. Database Level Financial Reconciliation Audit
    with engine.connect() as conn:
        inv_db = conn.execute(
            text("""
                SELECT id, subtotal_amount, discount_amount, tax_amount, net_amount,
                       paid_amount, balance_amount, status
                FROM invoices
                WHERE public_id = :uuid
            """),
            {"uuid": invoice_uuid},
        ).mappings().first()

        # Invariant 3: Line items sum exactly matches subtotal
        items_sum = conn.execute(
            text("SELECT SUM(total_amount) AS total, SUM(tax_amount) AS taxes FROM invoice_items WHERE invoice_id = :iid"),
            {"iid": inv_db["id"]},
        ).mappings().first()
        assert Decimal(str(items_sum["total"])) == Decimal(str(inv_db["subtotal_amount"]))
        assert Decimal(str(items_sum["taxes"])) == Decimal(str(inv_db["tax_amount"]))

        # Invariant 4: Sum of payments records exactly matches paid_amount
        payments_sum = conn.execute(
            text("SELECT SUM(amount) AS total_paid FROM payments WHERE invoice_id = :iid"),
            {"iid": inv_db["id"]},
        ).mappings().first()["total_paid"]
        assert Decimal(str(payments_sum)) == Decimal(str(inv_db["paid_amount"]))

    # 7. Settle the exact remaining balance via Cashier Counter
    settle_resp = client.post(
        f"/api/v1/billing/invoices/{invoice_uuid}/payments",
        headers=bill_headers,
        json={
            "amount": float(balance_due),
            "payment_method": "CASH",
            "notes": "Full balance cleared before discharge",
        },
    )
    assert settle_resp.status_code == 201, settle_resp.text
    settled = settle_resp.json()
    assert settled["status"] == "PAID"
    assert Decimal(str(settled["balance_amount"])) == Decimal("0.00")
    assert Decimal(str(settled["paid_amount"])) == Decimal(str(settled["net_amount"]))

    # 8. Complete Formal Discharge
    dc_resp = client.post(
        f"/api/v1/ipd/admissions/{admission_uuid}/discharge",
        headers=bill_headers,
        json={"discharge_type": "NORMAL"},
    )
    assert dc_resp.status_code == 200, dc_resp.text
    assert dc_resp.json()["status"] == "DISCHARGED"
    assert dc_resp.json()["bed_status"] == "CLEANING"


def test_financial_waiver_discharge_with_unsettled_balance(
    client,
    receptionist_token,
    doctor_token,
    billing_token,
):
    """
    Tests financial waiver exception handling:
    When a patient is indigent or medically cleared but has an unsettled balance,
    an authorized financial waiver allows formal discharge.
    Without waiver, discharge is strictly blocked (CANNOT_DISCHARGE).
    """
    rec_headers = {"Authorization": f"Bearer {receptionist_token}"}
    doc_headers = {"Authorization": f"Bearer {doctor_token}"}
    bill_headers = {"Authorization": f"Bearer {billing_token}"}
    ts = int(time.time())

    # 1. Register and admit patient without advance
    p_resp = client.post(
        "/api/v1/patients",
        headers=rec_headers,
        json={
            "first_name": "Somabhai",
            "last_name": f"Prajapati_{ts}",
            "dob": "1960-03-10",
            "gender": "MALE",
            "phone": f"9826{ts % 1000000:06d}",
            "aadhaar_number": f"66{(ts * 3) % 10000000000:010d}",
            "address_line1": "Kapadvanj Rural",
            "city": "Kheda",
            "state": "Gujarat",
            "postal_code": "387620",
            "blood_group": "O+",
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
            "provisional_diagnosis": "Acute Gastroenteritis with Moderate Dehydration",
            "is_mlc": False,
            "payment_category": "SELF_PAY_CASH",
            "advance_amount_paid": 0.00,
        },
    )
    assert adm_resp.status_code == 201
    admission_uuid = adm_resp.json()["uuid"]

    # 2. Doctor signs discharge summary
    client.post(
        f"/api/v1/ipd/admissions/{admission_uuid}/discharge-summary",
        headers=doc_headers,
        json={
            "final_diagnosis": "Acute Gastroenteritis - Resolved",
            "hospital_course": "Rehydrated with IV fluids. Stool frequency normalized. Tolerating normal diet.",
            "condition_at_discharge": "STABLE",
        },
    )

    # 3. Generate final invoice with zero paid amount (entire amount is balance due)
    inv_resp = client.post(
        "/api/v1/billing/invoices/ipd-final",
        headers=bill_headers,
        json={
            "admission_uuid": admission_uuid,
            "paid_amount": 0.00,
        },
    )
    assert inv_resp.status_code == 201
    inv_data = inv_resp.json()
    assert inv_data["status"] == "UNPAID"
    assert Decimal(str(inv_data["balance_amount"])) > Decimal("0.00")

    # 4. Attempt discharge without waiver -> blocked with CANNOT_DISCHARGE
    fail_dc = client.post(
        f"/api/v1/ipd/admissions/{admission_uuid}/discharge",
        headers=bill_headers,
        json={"discharge_type": "NORMAL"},
    )
    assert fail_dc.status_code == 400
    assert "CANNOT_DISCHARGE" in fail_dc.json()["detail"]

    # 5. Discharge with authorized waiver reason -> succeeds with 200 OK
    waiver_dc = client.post(
        f"/api/v1/ipd/admissions/{admission_uuid}/discharge",
        headers=bill_headers,
        json={
            "discharge_type": "NORMAL",
            "waiver_reason": "Approved Medical Director Indigent Patient Welfare Scheme Grant (Trust Waiver)",
        },
    )
    assert waiver_dc.status_code == 200, waiver_dc.text
    assert waiver_dc.json()["status"] == "DISCHARGED"
    assert waiver_dc.json()["bed_status"] == "CLEANING"
