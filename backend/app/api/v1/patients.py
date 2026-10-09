from typing import Optional
from fastapi import APIRouter, Query, status
from app.services.patient_service import PatientService
from app.schemas.patient import PatientRegistrationRequest

router = APIRouter()

@router.get("/doctors", tags=["Staff"])
def list_doctors():
    """Returns active doctors available for consultation assignment."""
    return PatientService.list_doctors()

@router.get("/tokens/next", tags=["Queue"])
def preview_next_token():
    """Generates preview for next OPD queue token."""
    return PatientService.get_next_token()

@router.get("/patients", tags=["Patients & Vitals"])
def list_registered_patients(
    search: Optional[str] = Query(None, description="Search by name, phone, or UHID"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    limit: Optional[int] = Query(None, ge=1, le=200, description="Deprecated limit parameter for backwards compatibility")
):
    """Lists registered patients with pagination, search, latest visit encounter, and triage vital signs."""
    return PatientService.list_patients(
        search=search,
        page=page,
        page_size=page_size,
        limit=limit
    )

@router.post("/patients", tags=["Patients & Vitals"], status_code=status.HTTP_201_CREATED)
def register_patient_and_triage(req: PatientRegistrationRequest):
    """
    FEAT-01: Registers a new patient, calculates real-time BMI and BP stages,
    allocates the next sequential OPD Queue Token (#Q-xxx), and persists triage vitals.
    """
    return PatientService.register_patient(req)
