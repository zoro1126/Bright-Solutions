from datetime import datetime
from typing import Dict, Any, List
from fastapi import HTTPException, status
from app.repositories.billing_repo import BillingRepository
from app.repositories.patient_repo import PatientRepository
from app.repositories.user_repo import UserRepository
from app.schemas.billing import PaymentTenderRequest

class BillingService:
    @staticmethod
    def get_cashier_queue() -> Dict[str, Any]:
        rows = BillingRepository.get_cashier_queue()
        queue_items = []
        for r in rows:
            ready_since_val = r["ready_since"].isoformat() if r.get("ready_since") and hasattr(r["ready_since"], "isoformat") else str(r.get("ready_since") or "")
            queue_items.append({
                "visit_id": r["visit_id"],
                "queue_token": r["queue_token"],
                "uhid": r["uhid"],
                "patient_name": r["patient_name"],
                "doctor_name": r["doctor_name"] or "Assigned Physician",
                "insurance_category": r["insurance_category"] or "CASH",
                "ready_since": ready_since_val
            })

        return {
            "pending_invoices_count": len(queue_items),
            "billing_queue": queue_items
        }

    @staticmethod
    def get_or_create_bill(visit_id: int) -> Dict[str, Any]:
        visit = PatientRepository.get_visit_by_id(visit_id)
        if not visit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visit encounter with ID {visit_id} not found."
            )

        patient = PatientRepository.get_patient_by_id(visit["patient_id"])
        patient_name = f"{patient['first_name']} {patient['last_name']}" if patient else "Patient"
        uhid = patient["uhid"] if patient else "UNKNOWN"
        insurance_type = patient.get("insurance_type") if patient else "CASH"

        bill = BillingRepository.get_bill_by_visit_id(visit_id)

        if not bill:
            line_items_data = []

            # 1. Consultation fee
            line_items_data.append({
                "service_code": "CONS_GEN",
                "item_type": "CONSULTATION",
                "description": "General Physician Consultation",
                "quantity": 1,
                "unit_price": 500.00,
                "total_price": 500.00
            })

            # 2. Diagnostic reports review
            reports = BillingRepository.get_external_reports_for_billing(visit_id)
            for rep in reports:
                modality = rep.get("modality") or rep.get("report_type") or "Diagnostic"
                line_items_data.append({
                    "service_code": "DIAG_ARCH",
                    "item_type": "DIAGNOSTIC",
                    "description": f"External Scan Archival & Review ({modality})",
                    "quantity": 1,
                    "unit_price": 150.00,
                    "total_price": 150.00
                })

            # 3. Prescribed medications
            rx_items = BillingRepository.get_prescribed_drugs_for_billing(visit_id)
            for idx, rxi in enumerate(rx_items, start=1):
                line_items_data.append({
                    "service_code": f"PHARM_{idx:02d}",
                    "item_type": "MEDICATION",
                    "description": f"{rxi['brand_name']} {rxi['strength']} ({rxi['dosage_form']})",
                    "quantity": 1,
                    "unit_price": 60.00,
                    "total_price": 60.00
                })

            ins_type = (insurance_type or "").upper()
            ins_prov = (patient.get("insurance_provider") or "").upper() if patient else ""
            is_pmjay = "PMJAY" in ins_type or "AYUSHMAN" in ins_type or "PMJAY" in ins_prov or "AYUSHMAN" in ins_prov
            is_private = ins_type in ("INSURANCE", "PRIVATE", "CASHLESS", "CORPORATE") or (ins_prov != "" and ins_type != "CASH")

            subtotal = sum(item["total_price"] for item in line_items_data)
            discount = 0.00
            if is_pmjay:
                ins_covered = round(subtotal * 1.0, 2)
            elif is_private:
                ins_covered = round(subtotal * 0.8, 2)
            else:
                ins_covered = 0.00
            net_amount = max(0.00, round(subtotal - discount - ins_covered, 2))

            bill = BillingRepository.create_bill(
                visit_id=visit_id,
                gross_amount=subtotal,
                discount_amount=discount,
                insurance_covered=ins_covered,
                net_amount=net_amount,
                line_items=line_items_data
            )

        items = BillingRepository.get_bill_items(bill["id"])
        formatted_items = []
        for it in items:
            formatted_items.append({
                "item_code": it["service_code"],
                "item_type": it["item_type"],
                "description": it["description"],
                "quantity": it["quantity"],
                "unit_rate": float(it["unit_price"]),
                "total_amount": float(it["total_price"])
            })

        return {
            "visit_id": visit_id,
            "bill_id": bill["id"],
            "uhid": uhid,
            "patient_name": patient_name,
            "currency": "INR",
            "line_items": formatted_items,
            "subtotal": float(bill["gross_amount"]),
            "tax_gst": 0.00,
            "discount": float(bill["discount_amount"]),
            "insurance_copay_deduction": float(bill["insurance_covered"]),
            "net_payable": float(bill["net_amount"]),
            "patient_payable": float(bill["net_amount"]),
            "bill_status": bill["payment_status"]
        }

    @staticmethod
    def process_payment(bill_id: int, req: PaymentTenderRequest) -> Dict[str, Any]:
        bill = BillingRepository.get_bill_by_id(bill_id)
        if not bill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bill with ID {bill_id} not found."
            )

        if bill["payment_status"] == "PAID":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bill is already settled and paid."
            )

        tendered = float(req.tendered_amount or req.amount_paid or bill["net_amount"])
        mode = (req.payment_mode or "CASH").upper()
        if mode not in ("CASH", "UPI", "CARD", "NETBANKING", "INSURANCE_DIRECT"):
            mode = "CASH"

        txn_ref = req.transaction_reference or f"TXN-{datetime.now().strftime('%Y%m%d%H%M%S')}-{bill_id}"
        now_dt = datetime.now()
        settling_cashier_id = req.cashier_id or bill.get("cashier_id") or UserRepository.get_default_cashier_id()

        payment_id = BillingRepository.record_payment_and_close(
            bill_id=bill_id,
            visit_id=bill["visit_id"],
            cashier_id=settling_cashier_id,
            payment_mode=mode,
            transaction_ref=txn_ref,
            amount_paid=tendered,
            now_dt=now_dt
        )

        receipt_num = f"REC-2026-{bill_id:05d}"
        return {
            "message": "Payment recorded and encounter closed successfully",
            "payment_id": payment_id,
            "receipt_number": receipt_num,
            "bill_id": bill_id,
            "visit_id": bill["visit_id"],
            "paid_amount": tendered,
            "payment_mode": mode,
            "payment_timestamp": now_dt.isoformat(),
            "visit_status": "COMPLETED",
            "receipt_pdf_url": f"/api/bills/{bill_id}/receipt"
        }

    @staticmethod
    def get_receipt(bill_id: int) -> Dict[str, Any]:
        bill = BillingRepository.get_bill_by_id(bill_id)
        if not bill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bill with ID {bill_id} not found."
            )

        visit = PatientRepository.get_visit_by_id(bill["visit_id"])
        patient = PatientRepository.get_patient_by_id(visit["patient_id"]) if visit else None
        doctor = BillingRepository.get_user_info(visit["doctor_id"]) if visit else None
        cashier = BillingRepository.get_user_info(bill["cashier_id"]) if bill.get("cashier_id") else None
        payment = BillingRepository.get_payment_by_bill_id(bill_id)
        items = BillingRepository.get_bill_items(bill_id)

        formatted_items = []
        for it in items:
            formatted_items.append({
                "item_code": it["service_code"],
                "item_type": it["item_type"],
                "description": it["description"],
                "quantity": it["quantity"],
                "unit_rate": float(it["unit_price"]),
                "total_amount": float(it["total_price"])
            })

        receipt_number = f"REC-2026-{bill_id:05d}"
        created_at_str = bill["created_at"].isoformat() if hasattr(bill["created_at"], "isoformat") else str(bill["created_at"])
        payment_time_str = payment["payment_time"].isoformat() if payment and hasattr(payment["payment_time"], "isoformat") else str(payment["payment_time"]) if payment else None

        return {
            "receipt_number": receipt_number,
            "bill_id": bill_id,
            "visit_id": bill["visit_id"],
            "queue_token": visit["queue_token"] if visit else "N/A",
            "issue_date": payment_time_str or created_at_str,
            "payment_status": bill["payment_status"],
            "clinic": {
                "name": "Bright Solutions Hospital & Clinics",
                "tagline": "Excellence in Outpatient Care & Clinical Decision Support",
                "address": "Plot 42, Health City, Sector 5, Mumbai, Maharashtra 400001",
                "phone": "+91-22-2500-1122",
                "email": "billing@brightsolutions.in",
                "gstin": "27AAACB2233P1Z2"
            },
            "patient": {
                "id": patient["id"] if patient else None,
                "uhid": patient["uhid"] if patient else "UNKNOWN",
                "name": f"{patient['first_name']} {patient['last_name']}" if patient else "Unknown",
                "phone": patient.get("phone") if patient else None,
                "gender": patient.get("gender") if patient else None,
                "insurance_type": patient.get("insurance_type") if patient else "CASH",
                "insurance_provider": patient.get("insurance_provider") if patient else None,
                "policy_number": patient.get("policy_number") if patient else None
            },
            "attending_doctor": {
                "name": doctor["full_name"] if doctor else "Attending Physician",
                "role": doctor["role"] if doctor else "DOCTOR"
            },
            "cashier": {
                "name": cashier["full_name"] if cashier else "Counter Cashier Desk",
                "id": bill.get("cashier_id")
            },
            "line_items": formatted_items,
            "financials": {
                "subtotal": float(bill["gross_amount"]),
                "tax_gst": 0.00,
                "discount": float(bill["discount_amount"]),
                "insurance_copay_deduction": float(bill["insurance_covered"]),
                "net_payable": float(bill["net_amount"]),
                "amount_paid": float(payment["amount_paid"]) if payment else (float(bill["net_amount"]) if bill["payment_status"] == "PAID" else 0.00),
                "balance_due": 0.00 if bill["payment_status"] == "PAID" else float(bill["net_amount"])
            },
            "payment_details": {
                "mode": payment["payment_mode"] if payment else None,
                "transaction_ref": payment["transaction_ref"] if payment else None,
                "payment_time": payment_time_str,
                "status": payment["payment_status"] if payment else bill["payment_status"]
            }
        }

    @staticmethod
    def get_receipt_html(bill_id: int) -> str:
        data = BillingService.get_receipt(bill_id)
        clinic = data["clinic"]
        patient = data["patient"]
        fin = data["financials"]
        pay = data["payment_details"]

        rows_html = "".join([
            f"""<tr>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">{it['item_code']}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">{it['description']}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">{it['quantity']}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹{it['unit_rate']:.2f}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">₹{it['total_amount']:.2f}</td>
            </tr>""" for it in data["line_items"]
        ])

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Receipt {data['receipt_number']} — {clinic['name']}</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; background: #f8fafc; }}
  .receipt-card {{ max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
  .header {{ text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 20px; margin-bottom: 24px; }}
  .header h1 {{ margin: 0 0 6px 0; font-size: 22px; color: #0f172a; }}
  .header p {{ margin: 2px 0; font-size: 13px; color: #64748b; }}
  .meta-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; font-size: 13px; }}
  .meta-box {{ background: #f1f5f9; padding: 12px 16px; border-radius: 8px; }}
  .meta-box strong {{ color: #334155; }}
  table {{ width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }}
  th {{ background: #f8fafc; padding: 10px 8px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #cbd5e1; }}
  .totals {{ margin-left: auto; width: 280px; font-size: 14px; margin-bottom: 24px; }}
  .totals-row {{ display: flex; justify-content: space-between; padding: 4px 0; color: #475569; }}
  .totals-row.grand {{ font-size: 16px; font-weight: 700; color: #0f172a; border-top: 2px solid #e2e8f0; border-bottom: 2px solid #e2e8f0; padding: 8px 0; margin-top: 6px; }}
  .paid-badge {{ display: inline-block; padding: 6px 14px; background: #dcfce7; color: #166534; font-weight: 700; border-radius: 9999px; font-size: 13px; }}
  .footer {{ text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; }}
  @media print {{ body {{ background: #ffffff; padding: 0; }} .receipt-card {{ border: none; box-shadow: none; padding: 0; max-width: 100%; }} }}
</style>
</head>
<body>
<div class="receipt-card">
  <div class="header">
    <h1>{clinic['name']}</h1>
    <p>{clinic['tagline']}</p>
    <p>{clinic['address']} • Tel: {clinic['phone']}</p>
    <p>GSTIN: {clinic['gstin']}</p>
  </div>

  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
    <div>
      <div style="font-size: 18px; font-weight: 700; color: #0f172a;">OPD Cash Receipt</div>
      <div style="font-size: 13px; color: #64748b;">Serial: <strong>{data['receipt_number']}</strong></div>
    </div>
    <div>
      <span class="paid-badge">{data['payment_status']}</span>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <div><strong>Patient:</strong> {patient['name']}</div>
      <div><strong>UHID:</strong> {patient['uhid']}</div>
      <div><strong>Token:</strong> {data['queue_token']}</div>
      <div><strong>Insurance:</strong> {patient['insurance_type']}</div>
    </div>
    <div class="meta-box">
      <div><strong>Date:</strong> {data['issue_date'][:19].replace('T', ' ')}</div>
      <div><strong>Doctor:</strong> {data['attending_doctor']['name']}</div>
      <div><strong>Cashier:</strong> {data['cashier']['name']}</div>
      <div><strong>Payment Mode:</strong> {pay['mode'] or 'CASH'}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Code</th>
        <th>Description</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Unit Price</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      {rows_html}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span>Gross Subtotal:</span><span>₹{fin['subtotal']:.2f}</span></div>
    <div class="totals-row"><span>Insurance/Scheme Deduction:</span><span>-₹{fin['insurance_copay_deduction']:.2f}</span></div>
    <div class="totals-row"><span>Discount:</span><span>-₹{fin['discount']:.2f}</span></div>
    <div class="totals-row grand"><span>Amount Paid:</span><span>₹{fin['amount_paid']:.2f}</span></div>
    <div class="totals-row" style="font-size: 12px; color: #64748b; margin-top: 4px;"><span>Balance Due:</span><span>₹{fin['balance_due']:.2f}</span></div>
  </div>

  <div class="footer">
    <p>Thank you for choosing Bright Solutions. Wish you a speedy recovery!</p>
    <p>Computer generated invoice — No physical signature required.</p>
  </div>
</div>
</body>
</html>"""

