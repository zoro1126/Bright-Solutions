"""
Pydantic Schemas for Multi-Point Billing, 10-Head Inpatient Ledger, and Payments.
"""

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class ChargeHeadDetail(BaseModel):
    model_config = ConfigDict(extra="allow")
    total: Decimal


class AccruedChargesResponse(BaseModel):
    ipd_number: str
    patient_name: str
    admission_date: datetime
    length_of_stay_days: int
    charge_heads: Dict[str, Any]
    gross_total: Decimal
    advance_paid: Decimal
    estimated_balance_due: Decimal
    itemized_lines: List[Dict[str, Any]]


class CustomChargeItem(BaseModel):
    item_type: Literal[
        "OPD_CONSULTATION",
        "BED_RENT",
        "DOCTOR_VISIT",
        "NURSING",
        "PROCEDURE",
        "PHARMACY_ITEM",
        "LAB_TEST",
        "OT",
        "ANAESTHESIA",
        "OXYGEN",
        "CONSUMABLE",
        "OTHER",
    ] = "OTHER"
    item_name: str = Field(..., min_length=2, max_length=200)
    quantity: Decimal = Field(default=Decimal("1.00"), gt=0)
    unit_price: Decimal = Field(..., ge=0)
    tax_amount: Decimal = Field(default=Decimal("0.00"), ge=0)


class IpdFinalInvoiceRequest(BaseModel):
    admission_uuid: Optional[str] = None
    discount_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    discount_reason: Optional[str] = Field(None, max_length=255)
    payment_method: Literal["CASH", "UPI", "CARD", "NET_BANKING", "CHEQUE"] = "CASH"
    paid_amount: Optional[Decimal] = Field(None, ge=0, description="Amount collected now to settle balance")
    transaction_reference: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=255)
    custom_items: Optional[List[CustomChargeItem]] = None


class InvoiceItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    item_type: str
    item_name: str
    quantity: Decimal
    unit_price: Decimal
    total_amount: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    net_amount: Decimal


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    payment_number: str
    amount: Decimal
    payment_method: str
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None
    payment_date: datetime


class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    public_id: str
    invoice_number: str
    ipd_number: Optional[str] = None
    patient_name: str
    invoice_type: str
    status: str
    subtotal_amount: Decimal
    discount_amount: Decimal
    discount_reason: Optional[str] = None
    tax_amount: Decimal
    net_amount: Decimal
    advance_credited: Decimal
    cashier_paid: Decimal
    paid_amount: Decimal
    balance_amount: Decimal
    generated_at: datetime
    items: List[InvoiceItemResponse]
    payments: List[PaymentResponse]


class RecordPaymentRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)
    payment_method: Literal["CASH", "UPI", "CARD", "NET_BANKING", "CHEQUE"] = "CASH"
    transaction_reference: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=255)


class TariffResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    public_id: str
    service_code: str
    service_name: str
    category: str
    base_price: Decimal
    tax_percentage: Decimal
    is_active: bool
