from datetime import date, datetime
from typing import Optional, Literal, List
from pydantic import BaseModel, Field

BloodGroupType = Literal["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "UNKNOWN"]
GenderType = Literal["MALE", "FEMALE", "OTHER"]

class PatientCreateRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100, description="Patient given name")
    middle_name: Optional[str] = Field(None, max_length=100, description="Middle name or patronymic")
    last_name: str = Field(..., min_length=1, max_length=100, description="Surname or family name")
    dob: date = Field(..., description="Date of birth in YYYY-MM-DD format")
    gender: GenderType = Field(..., description="Gender: MALE, FEMALE, or OTHER")
    blood_group: BloodGroupType = Field("UNKNOWN", description="ABO blood group and Rh factor")
    phone: str = Field(..., min_length=10, max_length=20, description="Primary mobile phone number")
    alternate_phone: Optional[str] = Field(None, max_length=20, description="Alternative contact number")
    email: Optional[str] = Field(None, max_length=100, description="Patient email address")
    address_line1: str = Field(..., min_length=3, max_length=255, description="House/Flat number and street")
    address_line2: Optional[str] = Field(None, max_length=255, description="Landmark, locality or apartment name")
    city: str = Field(..., min_length=2, max_length=100, description="City / Town")
    state: str = Field(..., min_length=2, max_length=100, description="State / Province")
    postal_code: str = Field(..., min_length=4, max_length=20, description="PIN code / Postal code")
    aadhaar_number: Optional[str] = Field(None, min_length=12, max_length=12, description="Optional 12-digit Aadhaar (hashed via HMAC-SHA-256 for DPDP compliance; never stored raw)")
    abha_id: Optional[str] = Field(None, max_length=100, description="ABHA Address e.g. name@abdm")
    abha_number: Optional[str] = Field(None, max_length=20, description="14-digit ABHA identifier")
    emergency_contact_name: Optional[str] = Field(None, max_length=100, description="Emergency contact person name")
    emergency_contact_relation: Optional[str] = Field(None, max_length=50, description="Relationship e.g. Spouse, Father, Guardian")
    emergency_contact_phone: Optional[str] = Field(None, max_length=20, description="Emergency phone number")
    referred_by: Optional[str] = Field(None, max_length=150, description="Referring clinician or medical center")

class PatientSummary(BaseModel):
    public_id: str
    uhid: str
    full_name: str
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    dob: str
    gender: str
    blood_group: str
    phone: str
    alternate_phone: Optional[str] = None
    email: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    abha_id: Optional[str] = None
    abha_number: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    referred_by: Optional[str] = None
    is_active: bool
    created_at: str

class PatientSearchResponse(BaseModel):
    success: bool = True
    data: List[PatientSummary]
    meta: dict
