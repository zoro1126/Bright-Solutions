"""
Pydantic v2 Schemas for Surgical & OT Flow Forms (TASK-BE-5.5)
- FORM_15: Pre-Anaesthesia Assessment & Surgical Consent
- FORM_54: Preoperative Nurse & OT Checklist
- FORM_OP_NOTES: Operation Note & Recovery Flowsheet
"""

from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, ConfigDict, Field


class Form15PreAnaesthesia(BaseModel):
    model_config = ConfigDict(extra="ignore")

    assessment_datetime: datetime = Field(default_factory=datetime.now)
    proposed_surgery: str = Field(..., min_length=3)
    proposed_anaesthesia: Literal["GENERAL", "SPINAL", "EPIDURAL", "REGIONAL_BLOCK", "LOCAL_WITH_SEDATION"] = "GENERAL"
    mallampati_class: Literal["CLASS_I", "CLASS_II", "CLASS_III", "CLASS_IV"] = "CLASS_I"
    asa_ps_grade: Literal["ASA_I", "ASA_II", "ASA_III", "ASA_IV", "ASA_V", "ASA_VI", "ASA_E"] = "ASA_I"
    airway_and_cervical_mobility: str = Field("Normal neck flexion/extension, thyromental distance > 6.5 cm")
    dentition_status: Literal["INTACT", "LOOSE_TEETH", "DENTURES", "EDENTULOUS"] = "INTACT"
    npo_fasting_solids_hours: int = Field(8, ge=0, le=48)
    npo_fasting_clears_hours: int = Field(2, ge=0, le=24)
    anaesthetic_risk_cleared: bool = Field(True, description="Patient deemed medically fit for anaesthesia")
    special_precautions: Optional[str] = Field(None, description="Difficult airway, aspiration risk, post-op ICU bed required")
    anaesthetist_name: str = Field(..., min_length=2, max_length=150)
    anaesthetist_reg_no: Optional[str] = Field(None, max_length=50)


class Form54PreOpChecklist(BaseModel):
    model_config = ConfigDict(extra="ignore")

    checklist_datetime: datetime = Field(default_factory=datetime.now)
    patient_id_band_verified: bool = Field(True)
    informed_consent_signed: bool = Field(True)
    surgical_site_marked: bool = Field(True, description="Operating site marked by operating surgeon")
    npo_status_verified: bool = Field(True)
    clothing_and_jewellery_removed: bool = Field(True)
    dentures_and_lenses_removed: bool = Field(True)
    preop_medications_administered: bool = Field(True)
    blood_products_arranged_crossmatched: bool = Field(True)
    blood_units_available_count: int = Field(0, ge=0)
    pac_clearance_documented: bool = Field(True)
    voided_urine_time: Optional[datetime] = None
    transferring_ward_nurse: str = Field(..., min_length=2, max_length=100)
    ot_receiving_nurse: str = Field(..., min_length=2, max_length=100)


class FormOpNotes(BaseModel):
    model_config = ConfigDict(extra="ignore")

    operation_date: datetime = Field(default_factory=datetime.now)
    surgeon_name: str = Field(..., min_length=2, max_length=150)
    assistant_surgeon: Optional[str] = Field(None, max_length=150)
    anaesthetist_name: str = Field(..., min_length=2, max_length=150)
    scrub_nurse_name: str = Field(..., min_length=2, max_length=100)
    preop_diagnosis: str = Field(..., min_length=3)
    postop_diagnosis: str = Field(..., min_length=3)
    procedure_name: str = Field(..., min_length=3)
    incision_type: str = Field("Midline laparotomy", max_length=100)
    intraoperative_findings: str = Field(..., min_length=5)
    surgical_technique: str = Field(..., min_length=10)
    swab_and_instrument_count_correct: bool = Field(True, description="Strict WHO safety checklist count correct")
    estimated_blood_loss_ml: int = Field(50, ge=0)
    surgical_drain_placed: bool = Field(False)
    drain_details: Optional[str] = Field(None, max_length=100)
    specimen_sent_for_histopathology: bool = Field(False)
    postop_monitoring_instructions: str = Field(..., min_length=5)
