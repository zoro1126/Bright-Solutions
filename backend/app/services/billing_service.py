from datetime import datetime
from typing import Dict, Any, List
from fastapi import HTTPException, status
from app.repositories.billing_repo import BillingRepository
from app.repositories.patient_repo import PatientRepository
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

            subtotal = sum(item["total_price"] for item in line_items_data)
            discount = 0.00
            ins_covered = 0.00
            if (insurance_type or "").upper() == "INSURANCE":
                ins_covered = round(subtotal * 0.8, 2)
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
        settling_cashier_id = req.cashier_id or bill["cashier_id"] or 5

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
