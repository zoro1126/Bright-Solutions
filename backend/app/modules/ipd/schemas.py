"""
Inpatient (IPD) & Bed Matrix Data Schemas
Canonical Pydantic v2 domain schemas for ward hierarchy, bed matrix, and bed statuses.
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class BedStatusEnum(str, Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    CLEANING = "CLEANING"
    MAINTENANCE = "MAINTENANCE"
    RESERVED = "RESERVED"


class AdmissionSourceEnum(str, Enum):
    OPD_REFERRAL = "OPD_REFERRAL"
    EMERGENCY_DIRECT = "EMERGENCY_DIRECT"
    SCHEDULED_TRANSFER = "SCHEDULED_TRANSFER"


class AdmissionTypeEnum(str, Enum):
    ELECTIVE = "ELECTIVE"
    EMERGENCY = "EMERGENCY"
    TRANSFER = "TRANSFER"


class PaymentCategoryEnum(str, Enum):
    SELF_PAY_CASH = "SELF_PAY_CASH"
    TPA_INSURANCE = "TPA_INSURANCE"
    CORPORATE_PANEL = "CORPORATE_PANEL"
    AYUSHMAN_BHARAT = "AYUSHMAN_BHARAT"


class BedOccupantSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    admission_uuid: str
    ipd_number: str
    admission_date: datetime
    patient_uuid: str
    uhid: str
    patient_name: str
    patient_gender: Optional[str] = None
    attending_doctor_name: Optional[str] = None
    provisional_diagnosis: Optional[str] = None


class BedItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    uuid: str
    bed_number: str
    status: BedStatusEnum
    occupant: Optional[BedOccupantSummary] = None


class RoomWithBedsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    uuid: str
    room_number: str
    room_type: str
    daily_tariff: Decimal
    beds: List[BedItemResponse] = Field(default_factory=list)


class WardWithRoomsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    uuid: str
    ward_code: str
    ward_name: str
    floor_number: str
    gender_restriction: str
    total_beds: int
    available_count: int
    occupied_count: int
    cleaning_count: int
    maintenance_count: int
    rooms: List[RoomWithBedsResponse] = Field(default_factory=list)


class BedMatrixSummary(BaseModel):
    total_beds: int
    available_beds: int
    occupied_beds: int
    cleaning_beds: int
    maintenance_beds: int
    reserved_beds: int
    occupancy_rate_percentage: float


class BedMatrixResponse(BaseModel):
    summary: BedMatrixSummary
    wards: List[WardWithRoomsResponse]


class WardSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    uuid: str
    ward_code: str
    ward_name: str
    floor_number: str
    gender_restriction: str
    total_beds: int
    available_beds: int
    occupied_beds: int
    cleaning_beds: int
    maintenance_beds: int
    is_active: bool


class UpdateBedStatusRequest(BaseModel):
    status: BedStatusEnum
    notes: Optional[str] = Field(None, max_length=255)


class BedDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    uuid: str
    bed_number: str
    status: BedStatusEnum
    room_number: str
    room_type: str
    ward_name: str
    ward_code: str
    daily_tariff: Decimal


class CreateAdmissionRequest(BaseModel):
    bed_uuid: str
    patient_uuid: Optional[str] = None
    referral_uuid: Optional[str] = None
    attending_doctor_uuid: Optional[str] = None
    admission_source: AdmissionSourceEnum = AdmissionSourceEnum.EMERGENCY_DIRECT
    admission_type: AdmissionTypeEnum = AdmissionTypeEnum.ELECTIVE
    provisional_diagnosis: Optional[str] = Field(None, min_length=2)
    is_mlc: bool = False
    mlc_details: Optional[str] = Field(None, max_length=255)
    guardian_name: Optional[str] = Field(None, max_length=150)
    guardian_relationship: Optional[str] = Field(None, max_length=50)
    guardian_phone: Optional[str] = Field(None, max_length=20)
    payment_category: PaymentCategoryEnum = PaymentCategoryEnum.SELF_PAY_CASH
    tpa_provider: Optional[str] = Field(None, max_length=100)
    tpa_policy_number: Optional[str] = Field(None, max_length=100)
    advance_amount_paid: Decimal = Field(default=Decimal("0.00"), ge=0)


class AdmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    uuid: str
    ipd_number: str
    patient_uuid: str
    patient_name: str
    uhid: str
    attending_doctor_uuid: str
    attending_doctor_name: str
    bed_uuid: str
    bed_number: str
    room_number: str
    room_type: str
    ward_name: str
    ward_code: str
    daily_tariff: Decimal
    admission_source: str
    admission_type: str
    admission_date: datetime
    discharge_date: Optional[datetime] = None
    provisional_diagnosis: str
    is_mlc: bool
    mlc_details: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_relationship: Optional[str] = None
    guardian_phone: Optional[str] = None
    payment_category: str
    tpa_provider: Optional[str] = None
    tpa_policy_number: Optional[str] = None
    advance_amount_paid: Decimal
    status: str


class HospitalLetterhead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    address: str
    city: str
    state: str
    postal_code: str
    phone: str
    email: Optional[str] = None
    registration_number: Optional[str] = None


class PatientFaceSheetDemographics(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    patient_uuid: str
    uhid: str
    ipd_number: str
    full_name: str
    dob: Optional[str] = None
    age_years: Optional[int] = None
    gender: str
    blood_group: Optional[str] = None
    phone: str
    address: str
    admission_date: datetime
    admission_source: str
    admission_type: str


class AdmissionLocationDetails(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ward_name: str
    ward_code: str
    floor_number: str
    room_number: str
    room_type: str
    bed_number: str
    daily_tariff: Decimal


class ClinicalTeamDetails(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    attending_doctor_name: str
    specialization: Optional[str] = None
    medical_council_reg_no: Optional[str] = None
    provisional_diagnosis: str


class LegalAndInsuranceDetails(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    is_mlc: bool
    mlc_details: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_relationship: Optional[str] = None
    guardian_phone: Optional[str] = None
    payment_category: str
    tpa_provider: Optional[str] = None
    tpa_policy_number: Optional[str] = None
    advance_amount_paid: Decimal


class BilingualConsentClause(BaseModel):
    clause_number: int
    title_en: str
    title_gu: str
    text_en: str
    text_gu: str


class AdmissionConsentPayload(BaseModel):
    form_number: str = "AH/MRD/FORM - 8"
    form_title: str = "Admission Consent & Authorization / દાખલ સંમતિ અને અધિકૃતતા"
    clauses: List[BilingualConsentClause]
    patient_or_guardian_name: str
    relation_to_patient: str
    declaration_en: str
    declaration_gu: str


class AdmissionFaceSheetPayload(BaseModel):
    form_number: str = "AH/MRD/FORM - 9"
    form_title: str = "Inpatient Admission Face Sheet / ઇનપેશન્ટ એડમિશન ફેસ શીટ"
    demographics: PatientFaceSheetDemographics
    location: AdmissionLocationDetails
    clinical: ClinicalTeamDetails
    legal_and_financial: LegalAndInsuranceDetails


class AdmissionPrintDossierResponse(BaseModel):
    hospital: HospitalLetterhead
    admission_uuid: str
    ipd_number: str
    generated_at: datetime
    face_sheet: AdmissionFaceSheetPayload
    consent_form: AdmissionConsentPayload


class SubmitClinicalFormRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    day_number: Optional[int] = Field(None, ge=1, le=30)
    as_draft: bool = False
    payload: Dict[str, Any] = Field(..., description="Structured form payload validated against registered schema")


class CreateTreatmentOrderRequest(BaseModel):
    order_type: Literal["MEDICATION", "O2_THERAPY", "DIET", "SPECIAL_INSTRUCTION"] = "MEDICATION"
    drug_name: Optional[str] = Field(None, max_length=200)
    dosage: Optional[str] = Field(None, max_length=100)
    route: Optional[str] = Field(None, max_length=20)
    frequency: Optional[str] = Field(None, max_length=50)
    o2_device: Optional[str] = Field(None, max_length=30)
    o2_flow_rate_lpm: Optional[Decimal] = Field(None, ge=0, le=60)
    instructions: Optional[str] = Field(None, max_length=500)
    start_time: Optional[datetime] = None


class DiscontinueTreatmentOrderRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=255)


class RecordMarRequest(BaseModel):
    scheduled_time: datetime = Field(default_factory=datetime.now)
    status: Literal["GIVEN", "OMITTED", "REFUSED", "HELD_DOCTOR_ORDER"] = "GIVEN"
    omitted_reason: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = Field(None, max_length=255)


class RecordIntakeOutputRequest(BaseModel):
    shift: Literal["MORNING", "EVENING", "NIGHT"] = "MORNING"
    oral_rt_intake_ml: int = Field(0, ge=0)
    iv_fluid_type: Optional[str] = Field(None, max_length=100)
    iv_fluid_intake_ml: int = Field(0, ge=0)
    blood_products_ml: int = Field(0, ge=0)
    urine_output_ml: int = Field(0, ge=0)
    vomitus_rt_aspirate_ml: int = Field(0, ge=0)
    stool_count: int = Field(0, ge=0)
    drain_output_ml: int = Field(0, ge=0)
    remarks: Optional[str] = Field(None, max_length=255)




