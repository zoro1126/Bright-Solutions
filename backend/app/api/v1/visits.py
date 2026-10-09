from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, status
from app.services.questionnaire_service import QuestionnaireService
from app.services.report_service import ReportService
from app.schemas.questionnaire import QuestionnaireInput

router = APIRouter(prefix="/visits")

@router.post("/{visit_id}/questionnaire", tags=["Questionnaire"], status_code=status.HTTP_200_OK)
def save_visit_questionnaire(visit_id: int, req: QuestionnaireInput):
    """
    FEAT-02: Records standardized clinical intake MCQ questionnaire responses (q1..q20)
    and optional voice notes. Upserts if a questionnaire already exists for this visit encounter.
    """
    return QuestionnaireService.save_questionnaire(visit_id, req)

@router.get("/{visit_id}/questionnaire", tags=["Questionnaire"])
def get_visit_questionnaire(visit_id: int):
    """
    FEAT-02: Returns saved clinical intake MCQ questionnaire responses (q1..q20)
    and voice notes for physician consultation review.
    """
    return QuestionnaireService.get_questionnaire(visit_id)

@router.post("/{visit_id}/reports/upload", tags=["External Reports"], status_code=status.HTTP_201_CREATED)
def upload_external_report(
    visit_id: int,
    file: UploadFile = File(..., description="Binary report file (DICOM, PDF, ECG image, etc.)"),
    report_type: str = Form(..., description="DICOM, ECG, LAB_PDF, XRAY, or OTHER"),
    modality: Optional[str] = Form(None, description="Modality or descriptive scan title (e.g. Brain MRI T2)"),
    findings_summary: Optional[str] = Form(None, description="Optional clinical impressions or extracted notes")
):
    """
    FEAT-03: Archives patient-provided external diagnostic reports (DICOM, 12-lead ECG traces, lab PDFs)
    and stores them on disk organized by visit encounter.
    """
    return ReportService.upload_report(
        visit_id=visit_id,
        file=file,
        report_type=report_type,
        modality=modality,
        findings_summary=findings_summary
    )

@router.get("/{visit_id}/reports", tags=["External Reports"])
def list_visit_reports(visit_id: int):
    """
    FEAT-03: Lists all external diagnostic reports archived for a visit encounter.
    """
    return ReportService.list_reports(visit_id)
