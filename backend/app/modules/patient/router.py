from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import require_permission, get_current_active_user
from app.modules.patient.schemas import PatientCreateRequest, PatientSearchResponse
from app.modules.patient.service import PatientService

router = APIRouter(prefix="/patients", tags=["Patient Registration & Master Patient Index"])

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Register a new patient and issue sequential UHID"
)
def register_patient(
    req: PatientCreateRequest,
    current_user: dict = Depends(require_permission("patient:create"))
):
    """
    Registers a new patient record in the Master Patient Index (MPI).
    - Enforces zero-knowledge duplicate prevention using irreversible HMAC-SHA-256 Aadhaar hashing.
    - Allocates a gapless, monotonic UHID sequence (e.g. BS-001001).
    - Stores complete Indian demographic and address profile.
    """
    hospital_id = current_user.get("hospital_id", 1)
    patient = PatientService.register_patient(req=req, hospital_id=hospital_id)
    return {
        "success": True,
        "data": patient,
        "message": f"Patient registered successfully with UHID {patient['uhid']}"
    }

@router.get(
    "/search",
    summary="Master Patient Index (MPI) search by name, phone, UHID, or Aadhaar"
)
def search_mpi(
    q: Optional[str] = Query(None, description="General search string matching UHID, phone, or patient name"),
    phone: Optional[str] = Query(None, description="Exact or partial mobile phone number"),
    uhid: Optional[str] = Query(None, description="Exact or partial UHID (e.g. BS-001001)"),
    aadhaar_number: Optional[str] = Query(None, description="12-digit Aadhaar to match via HMAC-SHA-256 hash"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(require_permission("patient:read"))
):
    """
    High-performance MPI lookup for reception check-in, triage intake, and chamber consultations.
    """
    hospital_id = current_user.get("hospital_id", 1)
    return PatientService.search_patients(
        hospital_id=hospital_id,
        q=q,
        phone=phone,
        uhid=uhid,
        aadhaar_number=aadhaar_number,
        page=page,
        page_size=page_size
    )

@router.get(
    "",
    summary="List registered patients with pagination and optional filtering"
)
def list_patients(
    q: Optional[str] = Query(None, description="Search term for name, phone, or UHID"),
    phone: Optional[str] = Query(None, description="Filter by phone"),
    uhid: Optional[str] = Query(None, description="Filter by UHID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(require_permission("patient:read"))
):
    """Lists registered patients belonging to the authenticated hospital tenant."""
    hospital_id = current_user.get("hospital_id", 1)
    return PatientService.search_patients(
        hospital_id=hospital_id,
        q=q,
        phone=phone,
        uhid=uhid,
        page=page,
        page_size=page_size
    )

@router.get(
    "/{public_id}",
    summary="Retrieve single patient profile by public UUID"
)
def get_patient(
    public_id: str,
    current_user: dict = Depends(require_permission("patient:read"))
):
    """Returns demographic and contact details for a specific patient."""
    hospital_id = current_user.get("hospital_id", 1)
    patient = PatientService.get_patient_by_uuid(public_id=public_id, hospital_id=hospital_id)
    return {
        "success": True,
        "data": patient
    }

