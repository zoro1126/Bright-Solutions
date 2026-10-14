from typing import Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, status
from app.services.questionnaire_service import QuestionnaireService
from app.services.report_service import ReportService
from app.schemas.questionnaire import (
    QuestionnaireInput,
    QuestionnaireResponse,
    QuestionnaireDetailResponse
)
from app.schemas.report import (
    ExternalReportItem,
    ExternalReportUploadResponse,
    ExternalReportListResponse
)

router = APIRouter(prefix="/visits")

@router.post(
    "/{visit_id}/questionnaire",
    tags=["Questionnaire"],
    response_model=QuestionnaireResponse,
    status_code=status.HTTP_200_OK
)
def save_visit_questionnaire(visit_id: int, req: QuestionnaireInput):
    """
    FEAT-02: Records standardized clinical intake MCQ questionnaire responses (q1..q20)
    and optional voice notes. Deterministically calculates PHQ-2, GAD-2, PEG-3 scores,
    predicts ICD-10 conditions, generates clinical insights, and queries guideline-directed
    WHO EML generic medicines with patient allergy/organ contraindication masking.
    """
    return QuestionnaireService.save_questionnaire(visit_id, req)

@router.get(
    "/{visit_id}/questionnaire",
    tags=["Questionnaire"],
    response_model=QuestionnaireDetailResponse
)
def get_visit_questionnaire(visit_id: int):
    """
    FEAT-02: Returns saved clinical intake MCQ questionnaire responses (q1..q20),
    clinical scores, predicted ICD-10 conditions, and candidate medications for doctor consultation review.
    """
    return QuestionnaireService.get_questionnaire(visit_id)

@router.post(
    "/{visit_id}/reports/upload",
    tags=["External Reports"],
    response_model=ExternalReportUploadResponse,
    status_code=status.HTTP_201_CREATED
)
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

@router.get(
    "/{visit_id}/reports",
    tags=["External Reports"],
    response_model=ExternalReportListResponse
)
def list_visit_reports(visit_id: int):
    """
    FEAT-03: Lists all external diagnostic reports archived for a visit encounter.
    """
    return ReportService.list_reports(visit_id)

@router.get(
    "/{visit_id}/reports/{report_id}",
    tags=["External Reports"],
    response_model=ExternalReportItem
)
def get_external_report(visit_id: int, report_id: int):
    """
    FEAT-03: Retrieves metadata for a specific external diagnostic report.
    """
    return ReportService.get_report(visit_id, report_id)

@router.delete(
    "/{visit_id}/reports/{report_id}",
    tags=["External Reports"],
    status_code=status.HTTP_200_OK
)
def delete_external_report(visit_id: int, report_id: int):
    """
    FEAT-03: Deletes an external diagnostic report and removes its file from disk.
    """
    return ReportService.delete_report(visit_id, report_id)

