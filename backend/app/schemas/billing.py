from pydantic import BaseModel, Field
from typing import Optional

class PaymentTenderRequest(BaseModel):
    payment_mode: str = Field("CASH", description="CASH, UPI, CARD, NETBANKING, INSURANCE_DIRECT")
    tendered_amount: Optional[float] = Field(None, description="Tendered payment amount")
    amount_paid: Optional[float] = Field(None, description="Alias for tendered_amount")
    transaction_reference: Optional[str] = Field(None, description="UPI reference or bank POS txn number")
    notes: Optional[str] = Field(None, description="Cashier counter notes")
    cashier_id: Optional[int] = Field(None, description="Settling cashier staff user ID")
