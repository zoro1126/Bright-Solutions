from typing import Optional, List
from pydantic import BaseModel, Field

class ExternalReportItem(BaseModel):
    id: int
    visit_id: int
    patient_id: int
    report_type: str = Field(..., description="DICOM, ECG, LAB_PDF, XRAY, or OTHER")
    modality: Optional[str] = Field(None, description="Modality or scan title (e.g. Brain MRI T2 FLAIR)")
    file_path: str = Field(..., description="Relative or web URL path to the static uploaded file")
    file_size_mb: float = Field(..., description="File size in megabytes")
    findings_summary: Optional[str] = Field(None, description="Clinical impressions or lab values")
    upload_date: Optional[str] = Field(None, description="ISO timestamp of report upload")
    created_at: Optional[str] = Field(None, description="Creation timestamp")

class ExternalReportUploadResponse(BaseModel):
    message: str = "External report uploaded successfully"
    report_id: int
    visit_id: int
    patient_id: int
    file_name: str
    report_type: str
    modality: Optional[str] = None
    file_size_bytes: int
    file_size_mb: float
    file_path: str
    uploaded_at: str

class ExternalReportListResponse(BaseModel):
    visit_id: int
    patient_id: int
    count: int
    reports: List[ExternalReportItem]
