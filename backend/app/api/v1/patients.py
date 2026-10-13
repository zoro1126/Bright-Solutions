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

@router.get("/receptionist/queue", tags=["Queue"])
def get_receptionist_triage_queue(
    search: Optional[str] = Query(None, description="Filter queue by name, phone, MRN, or token")
):
    """
    Returns real-time triage queue for the reception desk.
    Heavy client logic (NEWS2 scoring, triage priority classification, dynamic wait times,
    and tab summary counts) is computed deterministically on the backend.
    """
    return PatientService.get_receptionist_queue(search=search)

@router.get("/patients/{patient_id}", tags=["Patients & Vitals"])
def get_patient_profile_and_dossier(patient_id: int):
    """
    Returns single patient profile including demographics, insurance, all historical visits,
    latest vitals with BMI & BP stage, and intake questionnaire data.
    """
    return PatientService.get_patient_details(patient_id=patient_id)

@router.post("/patients", tags=["Patients & Vitals"], status_code=status.HTTP_201_CREATED)
def register_patient_and_triage(req: PatientRegistrationRequest):
    """
    FEAT-01: Registers a new patient, calculates real-time BMI and BP stages,
    allocates the next sequential OPD Queue Token (#Q-xxx), automates doctor routing
    if unassigned, and persists triage vitals.
    """
    return PatientService.register_patient(req)
