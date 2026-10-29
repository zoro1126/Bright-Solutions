"""
Multi-Point Billing & Payments API Router (TASK-BE-6.2 & TASK-BE-6.3)
Guarded by SaaS ModuleGuard ('BILLING') and fine-grained RBAC permissions.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import require_module, require_permission
from app.modules.billing.schemas import (
    AccruedChargesResponse,
    InvoiceResponse,
    IpdFinalInvoiceRequest,
    RecordPaymentRequest,
    TariffResponse,
)
from app.modules.billing.service import BillingService

router = APIRouter(tags=["Multi-Point Billing & Payments"])


@router.get(
    "/billing/ipd/{admission_uuid}/accrued-charges",
    response_model=AccruedChargesResponse,
    dependencies=[Depends(require_module("BILLING"))],
)
def get_accrued_ipd_charges(
    admission_uuid: str,
    current_user: Dict[str, Any] = Depends(require_permission("billing:invoice_read")),
):
    """
    Computes live accrued inpatient charges across all 10 standard NABH cost heads:
    Bed Rent, Doctor Rounds, Nursing, Procedures, Pharmacy, Lab, OT, Anaesthesia, Oxygen, Consumables.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    return BillingService.calculate_accrued_ipd_charges(hospital_id, admission_uuid)


@router.post(
    "/billing/invoices/ipd-final",
    response_model=InvoiceResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_module("BILLING"))],
)
def generate_ipd_final_invoice(
    payload: IpdFinalInvoiceRequest,
    current_user: Dict[str, Any] = Depends(require_permission("billing:invoice_create")),
):
    """
    Generates consolidated 10-head final IPD invoice:
    - Sequentially numbered via SequenceService ('INV-IPD-XXXXXX').
    - Credits patient's initial admission advance payment.
    - Records cashier payment towards remaining balance.
    - Reconciles net amount, payments, and balance with exact rupee precision.
    """
    if not payload.admission_uuid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Field 'admission_uuid' is required in request body.",
        )
    hospital_id = int(current_user.get("hospital_id", 1))
    return BillingService.generate_ipd_final_invoice(
        hospital_id=hospital_id,
        admission_uuid=payload.admission_uuid,
        payload=payload,
        current_user=current_user,
    )


@router.post(
    "/billing/ipd/{admission_uuid}/generate-final",
    response_model=InvoiceResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_module("BILLING"))],
)
def generate_ipd_final_invoice_alias(
    admission_uuid: str,
    payload: IpdFinalInvoiceRequest,
    current_user: Dict[str, Any] = Depends(require_permission("billing:invoice_create")),
):
    """
    Alternative route path for generating final IPD invoice directly from admission resource URI.
    """
    payload.admission_uuid = admission_uuid
    hospital_id = int(current_user.get("hospital_id", 1))
    return BillingService.generate_ipd_final_invoice(
        hospital_id=hospital_id,
        admission_uuid=admission_uuid,
        payload=payload,
        current_user=current_user,
    )


@router.get(
    "/billing/invoices/{invoice_uuid}",
    response_model=InvoiceResponse,
    dependencies=[Depends(require_module("BILLING"))],
)
def get_invoice(
    invoice_uuid: str,
    current_user: Dict[str, Any] = Depends(require_permission("billing:invoice_read")),
):
    """
    Retrieves full invoice details with itemized 10-head line items and payment history.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    return BillingService.get_invoice(hospital_id, invoice_uuid)


@router.post(
    "/billing/invoices/{invoice_uuid}/payments",
    response_model=InvoiceResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_module("BILLING"))],
)
def record_invoice_payment(
    invoice_uuid: str,
    payload: RecordPaymentRequest,
    current_user: Dict[str, Any] = Depends(require_permission("billing:payment_collect")),
):
    """
    Records a payment against an invoice (e.g. paying remaining balance after partial settlement).
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    return BillingService.record_payment(
        hospital_id=hospital_id,
        invoice_uuid=invoice_uuid,
        payload=payload,
        current_user=current_user,
    )


@router.get(
    "/tariffs",
    response_model=List[TariffResponse],
    dependencies=[Depends(require_module("BILLING"))],
)
def list_tariffs(
    current_user: Dict[str, Any] = Depends(require_permission("billing:invoice_read")),
):
    """
    Lists all active hospital service tariffs.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    return BillingService.list_tariffs(hospital_id)
