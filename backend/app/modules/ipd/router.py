"""
Inpatient (IPD) & Bed Matrix API Router
Guarded by SaaS ModuleGuard ('IPD') and fine-grained RBAC permissions.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import require_module, require_permission
from app.modules.ipd.schemas import (
    AdmissionPrintDossierResponse,
    AdmissionResponse,
    BedDetailResponse,
    BedMatrixResponse,
    CreateAdmissionRequest,
    CreateTreatmentOrderRequest,
    DischargeSummaryCreate,
    DischargeSummaryResponse,
    DiscontinueTreatmentOrderRequest,
    FormalDischargeRequest,
    FormalDischargeResponse,
    RecordIntakeOutputRequest,
    RecordMarRequest,
    SubmitClinicalFormRequest,
    UpdateBedStatusRequest,
    WardSummaryResponse,
)
from app.modules.ipd.service import IPDService
from app.modules.ipd.form_service import FormService
from app.modules.ipd.flowsheet_service import FlowsheetService
from app.modules.ipd.discharge_service import DischargeService

router = APIRouter(tags=["Inpatient (IPD) & Bed Matrix"])


@router.get(
    "/beds/matrix",
    response_model=BedMatrixResponse,
    dependencies=[Depends(require_module("IPD"))],
)
def get_bed_occupancy_matrix(
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    Returns visual bed occupancy matrix (wards -> rooms -> beds with live occupancy details).
    Guarded by @require_module('IPD') and 'ipd:read' permission.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    return IPDService.get_bed_matrix(hospital_id)


@router.get(
    "/wards",
    response_model=List[WardSummaryResponse],
    dependencies=[Depends(require_module("IPD"))],
)
def list_wards(
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    Lists hospital wards with real-time bed capacity and occupancy totals.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    return IPDService.list_wards(hospital_id)


@router.patch(
    "/beds/{bed_uuid}/status",
    response_model=BedDetailResponse,
    dependencies=[Depends(require_module("IPD"))],
)
def update_bed_status(
    bed_uuid: str,
    payload: UpdateBedStatusRequest,
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    Updates bed maintenance/cleaning state (AVAILABLE, CLEANING, MAINTENANCE, RESERVED).
    Guarded against unauthorized modification of active OCCUPIED inpatient beds.
    """
    role = str(current_user.get("role", "")).upper()
    allowed_roles = {"SUPER_ADMIN", "ADMIN", "NURSE", "RECEPTIONIST"}
    if role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only nursing or administrative personnel can update bed status.",
        )

    hospital_id = int(current_user.get("hospital_id", 1))
    user_id = int(current_user.get("user_id", 1))

    return IPDService.update_bed_status(
        hospital_id=hospital_id,
        bed_uuid=bed_uuid,
        new_status=payload.status.value,
        notes=payload.notes,
        user_id=user_id,
    )


@router.post(
    "/ipd/admissions",
    response_model=AdmissionResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_module("IPD"))],
)
def create_ipd_admission(
    payload: CreateAdmissionRequest,
    current_user: Dict[str, Any] = Depends(require_permission("ipd:admit")),
):
    """
    Dual-path Inpatient Admission:
    - Path A: OPD Referral handoff via referral_uuid (auto-links diagnosis, doctor, opd appointment).
    - Path B: Direct / Emergency Walk-In (supports independent IPD module operation).
    Enforces concurrency-safe bed row lock (SELECT ... FOR UPDATE) and monotonic IPD_NUMBER sequence.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    user_id = int(current_user.get("user_id", 1))

    return IPDService.create_admission(
        hospital_id=hospital_id,
        req=payload,
        created_by=user_id,
    )


@router.get(
    "/ipd/admissions/{admission_uuid}",
    response_model=AdmissionResponse,
    dependencies=[Depends(require_module("IPD"))],
)
def get_ipd_admission(
    admission_uuid: str,
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    Retrieves full Inpatient Admission record including patient, assigned bed, and attending doctor.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    return IPDService.get_admission(hospital_id, admission_uuid)


@router.get(
    "/ipd/admissions",
    response_model=List[AdmissionResponse],
    dependencies=[Depends(require_module("IPD"))],
)
def list_ipd_admissions(
    status_filter: Optional[str] = Query("ADMITTED", description="Filter by admission status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    Lists hospital inpatients with real-time bed and demographic details.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    return IPDService.list_admissions(
        hospital_id=hospital_id,
        status_filter=status_filter,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/ipd/admissions/{admission_uuid}/consent-form",
    response_model=AdmissionPrintDossierResponse,
    dependencies=[Depends(require_module("IPD"))],
)
def get_admission_consent_and_face_sheet(
    admission_uuid: str,
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    Returns structured print payload for:
    - Inpatient Admission Face Sheet (AH/MRD/FORM - 9)
    - Bilingual English & Gujarati Admission Consent & Treatment Authorization (AH/MRD/FORM - 8)
    Guarded by @require_module('IPD') and 'ipd:read' permission.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    return IPDService.get_admission_consent_and_face_sheet(hospital_id, admission_uuid)


# -----------------------------------------------------------------------------
# Phase BE-5: Universal Form Submission Infrastructure (TASK-BE-5.1 & 5.8)
# -----------------------------------------------------------------------------
@router.post(
    "/ipd/admissions/{admission_uuid}/forms/{form_code}",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_module("IPD"))],
)
def submit_clinical_form(
    admission_uuid: str,
    form_code: str,
    payload: SubmitClinicalFormRequest,
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    Validates form payload against registered Pydantic schema and persists into
    ipd_clinical_form_submissions. Supports draft saving and automatic version increments.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    user_id = int(current_user.get("user_id", 1))

    return FormService.submit_clinical_form(
        hospital_id=hospital_id,
        admission_uuid=admission_uuid,
        form_code=form_code,
        payload_data=payload.payload,
        recorded_by_user_id=user_id,
        day_number=payload.day_number,
        as_draft=payload.as_draft,
    )


@router.get(
    "/ipd/admissions/{admission_uuid}/forms/{form_code}",
    dependencies=[Depends(require_module("IPD"))],
)
def get_clinical_form(
    admission_uuid: str,
    form_code: str,
    version: Optional[int] = Query(None, description="Optional specific version number"),
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    Retrieves latest or specific version of clinical form submission.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    return FormService.get_form_submission(
        hospital_id=hospital_id,
        admission_uuid=admission_uuid,
        form_code=form_code,
        version=version,
    )


@router.get(
    "/ipd/admissions/{admission_uuid}/forms",
    dependencies=[Depends(require_module("IPD"))],
)
def list_clinical_forms(
    admission_uuid: str,
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    Lists all submitted clinical forms across the patient's stay.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    return FormService.list_admission_forms(
        hospital_id=hospital_id,
        admission_uuid=admission_uuid,
    )


@router.post(
    "/ipd/admissions/{admission_uuid}/forms/{form_code}/lock",
    dependencies=[Depends(require_module("IPD"))],
)
def lock_clinical_form(
    admission_uuid: str,
    form_code: str,
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    TASK-BE-5.8: Transitions form submission status to 'LOCKED' creating an immutable clinical audit record.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    user_id = int(current_user.get("user_id", 1))

    return FormService.lock_clinical_form(
        hospital_id=hospital_id,
        admission_uuid=admission_uuid,
        form_code=form_code,
        user_id=user_id,
    )


# -----------------------------------------------------------------------------
# Phase BE-5: Operational Flowsheets (TASK-BE-5.3)
# -----------------------------------------------------------------------------
@router.post(
    "/ipd/admissions/{admission_uuid}/treatment-orders",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_module("IPD"))],
)
def create_treatment_order(
    admission_uuid: str,
    payload: CreateTreatmentOrderRequest,
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    Doctor prescribes medication, oxygen therapy, or clinical diet order (AH/MRD/FORM - 29).
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    user_id = int(current_user.get("user_id", 1))

    return FlowsheetService.create_treatment_order(
        hospital_id=hospital_id,
        admission_uuid=admission_uuid,
        doctor_user_id=user_id,
        order_type=payload.order_type,
        drug_name=payload.drug_name,
        dosage=payload.dosage,
        route=payload.route,
        frequency=payload.frequency,
        o2_device=payload.o2_device,
        o2_flow_rate_lpm=payload.o2_flow_rate_lpm,
        instructions=payload.instructions,
        start_time=payload.start_time,
    )


@router.get(
    "/ipd/admissions/{admission_uuid}/treatment-orders",
    dependencies=[Depends(require_module("IPD"))],
)
def list_treatment_orders(
    admission_uuid: str,
    status_filter: Optional[str] = Query(None, description="ACTIVE, COMPLETED, DISCONTINUED"),
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    Lists treatment orders with dose administration counts.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    return FlowsheetService.list_treatment_orders(
        hospital_id=hospital_id,
        admission_uuid=admission_uuid,
        status_filter=status_filter,
    )


@router.patch(
    "/ipd/treatment-orders/{order_uuid}/discontinue",
    dependencies=[Depends(require_module("IPD"))],
)
def discontinue_treatment_order(
    order_uuid: str,
    payload: DiscontinueTreatmentOrderRequest,
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    Doctor discontinues treatment order with clinical justification.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    user_id = int(current_user.get("user_id", 1))

    return FlowsheetService.discontinue_treatment_order(
        hospital_id=hospital_id,
        order_uuid=order_uuid,
        user_id=user_id,
        reason=payload.reason,
    )


@router.post(
    "/ipd/treatment-orders/{order_uuid}/administer",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_module("IPD"))],
)
def record_mar_administration(
    order_uuid: str,
    payload: RecordMarRequest,
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    Nurse logs given, omitted, or refused dose administration in MAR (Form 29).
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    user_id = int(current_user.get("user_id", 1))

    return FlowsheetService.record_mar_administration(
        hospital_id=hospital_id,
        order_uuid=order_uuid,
        nurse_user_id=user_id,
        scheduled_time=payload.scheduled_time,
        mar_status=payload.status,
        omitted_reason=payload.omitted_reason,
        notes=payload.notes,
    )


@router.post(
    "/ipd/admissions/{admission_uuid}/intake-output",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_module("IPD"))],
)
def record_intake_output(
    admission_uuid: str,
    payload: RecordIntakeOutputRequest,
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    Nurse records shift intake & output with calculated net balance (AH/MRD/FORM - 61).
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    user_id = int(current_user.get("user_id", 1))

    return FlowsheetService.record_intake_output(
        hospital_id=hospital_id,
        admission_uuid=admission_uuid,
        nurse_user_id=user_id,
        shift=payload.shift,
        oral_rt_intake_ml=payload.oral_rt_intake_ml,
        iv_fluid_type=payload.iv_fluid_type,
        iv_fluid_intake_ml=payload.iv_fluid_intake_ml,
        blood_products_ml=payload.blood_products_ml,
        urine_output_ml=payload.urine_output_ml,
        vomitus_rt_aspirate_ml=payload.vomitus_rt_aspirate_ml,
        stool_count=payload.stool_count,
        drain_output_ml=payload.drain_output_ml,
        remarks=payload.remarks,
    )


@router.get(
    "/ipd/admissions/{admission_uuid}/intake-output",
    dependencies=[Depends(require_module("IPD"))],
)
def get_intake_output_history(
    admission_uuid: str,
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    Retrieves shift-wise fluid chart with cumulative 24h intake, output, and net balance.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    return FlowsheetService.get_intake_output_history(
        hospital_id=hospital_id,
        admission_uuid=admission_uuid,
    )


# -----------------------------------------------------------------------------
# TASK-BE-6.1 & TASK-BE-6.4: Inpatient Discharge & Bed Release
# -----------------------------------------------------------------------------
@router.post(
    "/ipd/admissions/{admission_uuid}/discharge-summary",
    response_model=DischargeSummaryResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_module("IPD"))],
)
def record_discharge_summary(
    admission_uuid: str,
    payload: DischargeSummaryCreate,
    current_user: Dict[str, Any] = Depends(require_permission("ipd:discharge_summary_write")),
):
    """
    Attending doctor writes and digitally signs the structured inpatient discharge summary.
    Immutably locks the summary upon sign-off.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    user_id = int(current_user.get("id", 1))
    return DischargeService.record_discharge_summary(
        hospital_id=hospital_id,
        admission_uuid=admission_uuid,
        doctor_user_id=user_id,
        payload=payload,
    )


@router.get(
    "/ipd/admissions/{admission_uuid}/discharge-summary",
    response_model=DischargeSummaryResponse,
    dependencies=[Depends(require_module("IPD"))],
)
def get_discharge_summary(
    admission_uuid: str,
    current_user: Dict[str, Any] = Depends(require_permission("ipd:read")),
):
    """
    Fetches the structured signed discharge summary for an inpatient admission.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    return DischargeService.get_discharge_summary(
        hospital_id=hospital_id,
        admission_uuid=admission_uuid,
    )


@router.post(
    "/ipd/admissions/{admission_uuid}/discharge",
    response_model=FormalDischargeResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_module("IPD"))],
)
def execute_formal_discharge(
    admission_uuid: str,
    payload: FormalDischargeRequest,
    current_user: Dict[str, Any] = Depends(require_permission("ipd:discharge")),
):
    """
    Completes formal discharge:
    1. Validates doctor signed discharge summary exists.
    2. Validates final consolidated bill is generated and balance settled to zero (or authorized waiver).
    3. Sets admission status to 'DISCHARGED' with discharge_date = NOW().
    4. Releases active bed allocation.
    5. Transitions bed in beds table to 'CLEANING'.
    """
    hospital_id = int(current_user.get("hospital_id", 1))
    return DischargeService.execute_formal_discharge(
        hospital_id=hospital_id,
        admission_uuid=admission_uuid,
        current_user=current_user,
        payload=payload,
    )




