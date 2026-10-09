from fastapi import APIRouter, status
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
def process_bill_payment(bill_id: int, req: PaymentTenderRequest):
    """
    FEAT-11 & 12 / 6.3: Processes multi-mode payment tender (Cash, UPI QR, Card),
    marks bill as PAID, transitions visit encounter to COMPLETED, and issues receipt serial.
    """
    return BillingService.process_payment(bill_id, req)
