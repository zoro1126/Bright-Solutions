"""
Inpatient (IPD) & Bed Matrix Data Schemas
Canonical Pydantic v2 domain schemas for ward hierarchy, bed matrix, and bed statuses.
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class BedStatusEnum(str, Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    CLEANING = "CLEANING"
    MAINTENANCE = "MAINTENANCE"
    RESERVED = "RESERVED"


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
