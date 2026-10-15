from typing import Optional
from fastapi import APIRouter, status, Query
from fastapi.responses import HTMLResponse
from app.services.billing_service import BillingService
from app.schemas.billing import PaymentTenderRequest

router = APIRouter(tags=["Cashier Billing & Payments"])

@router.get("/cashier/queue")
def get_cashier_queue():
    """
    FEAT-09 / 6.1: Lists patient encounters currently in READY_FOR_BILLING status awaiting cashier clearance.
    """
    return BillingService.get_cashier_queue()

@router.get("/bills/visit/{visit_id}")
@router.get("/cashier/bills/{visit_id}")
def get_visit_bill(visit_id: int):
    """
    FEAT-09 / 6.2: Auto-aggregates and retrieves the itemized bill for a visit encounter:
    - Physician Consultation Fee (₹500)
    - Diagnostic Archive Tariffs (₹150 per external diagnostic scan)
    - Prescribed Medicines from formulary (₹60 per prescribed line item)
    Computes insurance coverage deductions and net copay payable.
    """
    return BillingService.get_or_create_bill(visit_id)

@router.post("/bills/{bill_id}/payments", status_code=status.HTTP_201_CREATED)
@router.post("/cashier/bills/{bill_id}/payments", status_code=status.HTTP_201_CREATED)
def process_bill_payment(bill_id: int, req: PaymentTenderRequest):
    """
    FEAT-11 & 12 / 6.3: Processes multi-mode payment tender (Cash, UPI QR, Card),
    marks bill as PAID, transitions visit encounter to COMPLETED, and issues receipt serial.
    """
    return BillingService.process_payment(bill_id, req)

@router.get("/bills/{bill_id}/receipt")
@router.get("/cashier/bills/{bill_id}/receipt")
def get_bill_receipt(bill_id: int, format: Optional[str] = Query(None)):
    """
    Returns full receipt details for patient settlement.
    Pass `?format=html` to render a printable thermal invoice in the browser.
    """
    if format == "html":
        html_content = BillingService.get_receipt_html(bill_id)
        return HTMLResponse(content=html_content, status_code=status.HTTP_200_OK)
    return BillingService.get_receipt(bill_id)

@router.get("/bills/{bill_id}/receipt/html", response_class=HTMLResponse)
@router.get("/cashier/bills/{bill_id}/receipt/html", response_class=HTMLResponse)
def get_bill_receipt_html(bill_id: int):
    """
    Returns printable HTML receipt directly.
    """
    return HTMLResponse(content=BillingService.get_receipt_html(bill_id), status_code=status.HTTP_200_OK)

