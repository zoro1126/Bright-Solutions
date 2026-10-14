from typing import Optional, List
from fastapi import APIRouter, Query, status, Body
from app.services.doctor_service import DoctorService
from app.services.cdss_service import CDSSService
from app.services.prescription_service import PrescriptionService
from app.schemas.cdss import InsightReviewRequest, DoctorSignOffRequest
from app.schemas.prescription import PrescriptionCreateRequest, PrescriptionItemInput

router = APIRouter(prefix="/doctor", tags=["Doctor Clinical CDSS & Consultation"])

@router.get("/queue")
def get_doctor_queue(doctor_id: Optional[int] = Query(None, description="Filter queue by attending doctor ID")):
    """
    FEAT-04 / 5.1: Returns waiting patients in OPD queue (TRIAGED or IN_CONSULTATION),
    prioritized by active consultation state and arrival token.
    """
    return DoctorService.get_doctor_queue(doctor_id)

@router.post("/queue/{visit_id}/call")
def call_patient_to_consultation(visit_id: int):
    """
    FEAT-04 / 5.2: Transitions visit status from TRIAGED to IN_CONSULTATION when doctor calls the patient.
    """
    return DoctorService.call_patient(visit_id)

@router.get("/patients/{patient_id}/dossier")
def get_patient_dossier(patient_id: int):
    """
    FEAT-05 / 5.3: Aggregates comprehensive patient historical dossier: prior visits, vitals timeline,
    past prescriptions, external diagnostic scans, intake questionnaires, and offline NLP synthesized
    executive consultation summary.
    """
    return DoctorService.get_patient_dossier(patient_id)

@router.post("/visits/{visit_id}/insights")
@router.post("/visits/{visit_id}/insights/evaluate")
def trigger_doctor_insights(visit_id: int):
    """
    FEAT-07 / 5.4: Evaluates deterministic clinical decision support rules for the active encounter.
    Generates actionable severity flags (CRITICAL, WARNING, INFO) with clinical guidance.
    """
    return CDSSService.trigger_insights(visit_id)

@router.get("/visits/{visit_id}/insights")
def get_doctor_insights(visit_id: int):
    """
    FEAT-07: Retrieves evaluated clinical safety alerts for an encounter.
    Evaluates automatically if none have been evaluated yet.
    """
    return CDSSService.get_insights(visit_id)

@router.patch("/insights/{insight_id}")
def review_doctor_insight(insight_id: int, req: InsightReviewRequest):
    """
    FEAT-07 / 5.5: Allows physician to mark a safety insight as reviewed or attach override notes.
    """
    return CDSSService.review_insight(insight_id, req)

@router.get("/formulary")
def search_doctor_formulary(
    q: Optional[str] = Query(None, description="Search term for drug brand or generic molecule"),
    dosage_form: Optional[str] = Query(None, description="Filter by TABLET, CAPSULE, SYRUP, INJECTION, etc."),
    limit: int = Query(50, ge=1, le=100)
):
    """
    FEAT-08 / 5.6: Fast indexed substring search on WHO Model List + trade products for doctor prescription lookup.
    """
    return PrescriptionService.search_formulary(q=q, dosage_form=dosage_form, limit=limit)

@router.post("/visits/{visit_id}/prescriptions/check-safety")
def check_prescription_safety(visit_id: int, items: List[PrescriptionItemInput]):
    """
    FEAT-08: Previews Drug-Drug Interaction (DDI), duplicate therapeutic class, and dosage anomaly
    safety checks in real time before finalizing prescription.
    """
    return PrescriptionService.check_safety(visit_id, items)

@router.post("/visits/{visit_id}/prescriptions", status_code=status.HTTP_201_CREATED)
def create_visit_prescription(visit_id: int, req: PrescriptionCreateRequest):
    """
    FEAT-08 / 5.7: Creates or updates an e-prescription encounter record with line items from drug_formulary,
    evaluating pairwise drug-drug interactions and patient allergy contraindications.
    """
    return PrescriptionService.create_prescription(visit_id, req)

@router.get("/visits/{visit_id}/prescriptions")
def get_visit_prescription(visit_id: int):
    """
    FEAT-08 / 5.8: Fetches the e-prescription for a visit encounter with joined formulary medication details.
    """
    return PrescriptionService.get_prescription(visit_id)

@router.post("/visits/{visit_id}/sign-off")
def sign_off_doctor_encounter(visit_id: int, req: DoctorSignOffRequest):
    """
    FEAT-08 / 5.9: Submits the clinical conclusion notes, enforces required doctor override notes
    if unreviewed CRITICAL CDSS safety alerts are active, digitally signs all encounter insights,
    records attending physician ID & timestamp, and transitions status to READY_FOR_BILLING.
    """
    return DoctorService.sign_off_encounter(visit_id, req)

