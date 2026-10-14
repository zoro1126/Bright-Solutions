from app.schemas.auth import LoginRequest, CreateUserRequest
from app.schemas.patient import VitalSignsInput, PatientRegistrationRequest
from app.schemas.questionnaire import (
    QuestionnaireInput,
    QuestionnaireResponse,
    QuestionnaireDetailResponse,
    PredictedConditionItem,
    RecommendedMedicationItem
)
from app.schemas.report import (
    ExternalReportItem,
    ExternalReportUploadResponse,
    ExternalReportListResponse
)
from app.schemas.cdss import InsightReviewRequest, DoctorSignOffRequest
from app.schemas.prescription import PrescriptionItemInput, PrescriptionCreateRequest
from app.schemas.billing import PaymentTenderRequest

