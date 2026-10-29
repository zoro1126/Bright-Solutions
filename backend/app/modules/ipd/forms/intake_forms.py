"""
Pydantic v2 Schemas for Inpatient Intake & Assessment Forms (TASK-BE-5.2)
- FORM_08: Admission Consent & Authorization
- FORM_09: Inpatient Face Sheet & Demographics
- FORM_10: Doctor H&P Admission Assessment Note
- FORM_70: Nursing Initial Admission Assessment (Morse Fall Risk & Braden Score)
"""

from datetime import date, datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, ConfigDict, Field


class Form08AdmissionConsent(BaseModel):
    model_config = ConfigDict(extra="ignore")

    treatment_authorized: bool = Field(True, description="General consent for hospital diagnostic tests & medical treatment")
    emergency_cpr_authorized: bool = Field(True, description="Authorization for life-saving resuscitation / CPR")
    blood_transfusion_authorized: bool = Field(True, description="Authorization for emergency blood transfusion")
    tariff_and_financial_accepted: bool = Field(True, description="Acceptance of daily bed tariffs and billing charges")
    valuable_belongings_disclaimed: bool = Field(True, description="Acknowledgment of valuables loss disclaimer")
    language_explained: str = Field("GUJARATI_AND_ENGLISH", description="Language in which terms were explained")
    signatory_name: str = Field(..., min_length=2, max_length=150)
    signatory_relation: str = Field(..., max_length=50)
    signatory_phone: Optional[str] = Field(None, max_length=20)
    witness_name: Optional[str] = Field(None, max_length=150)
    witness_phone: Optional[str] = Field(None, max_length=20)


class Form09InpatientFaceSheet(BaseModel):
    model_config = ConfigDict(extra="ignore")

    patient_full_name: str = Field(..., min_length=2, max_length=150)
    uhid: str = Field(..., min_length=4, max_length=30)
    ipd_number: str = Field(..., min_length=4, max_length=30)
    dob: Optional[date] = None
    age_years: Optional[int] = Field(None, ge=0, le=130)
    gender: Literal["MALE", "FEMALE", "OTHER"] = "MALE"
    blood_group: Optional[str] = Field(None, max_length=10)
    contact_phone: str = Field(..., min_length=10, max_length=20)
    residential_address: str = Field(..., min_length=5, max_length=255)
    is_mlc: bool = Field(False, description="Medico-Legal Case flag")
    mlc_details: Optional[str] = Field(None, max_length=255)
    guardian_name: Optional[str] = Field(None, max_length=150)
    guardian_relationship: Optional[str] = Field(None, max_length=50)
    guardian_phone: Optional[str] = Field(None, max_length=20)
    payment_category: Literal["SELF_PAY_CASH", "TPA_INSURANCE", "CORPORATE_PANEL", "AYUSHMAN_BHARAT"] = "SELF_PAY_CASH"
    tpa_provider: Optional[str] = Field(None, max_length=100)
    tpa_policy_number: Optional[str] = Field(None, max_length=100)
    advance_amount_paid: float = Field(0.0, ge=0)


class Form10DoctorHP(BaseModel):
    model_config = ConfigDict(extra="ignore")

    chief_complaints: str = Field(..., min_length=3, description="Presenting complaints with duration")
    history_of_present_illness: str = Field(..., min_length=5, description="Chronological HPI narrative")
    past_medical_history: Optional[str] = Field(None, description="Diabetes, HTN, IHD, Asthma, TB history")
    past_surgical_history: Optional[str] = Field(None, description="Prior surgeries, dates, and complications")
    known_allergies: Optional[str] = Field(None, description="Drug allergies (e.g. Penicillin, Sulfa) or food allergies")
    home_medications: Optional[str] = Field(None, description="Current home prescription regimens")
    systemic_exam_cvs: Optional[str] = Field("S1 S2 heard, no murmurs", description="Cardiovascular system")
    systemic_exam_rs: Optional[str] = Field("Bilateral air entry clear, no added sounds", description="Respiratory system")
    systemic_exam_pa: Optional[str] = Field("Soft, non-tender, no organomegaly", description="Per abdomen")
    systemic_exam_cns: Optional[str] = Field("Conscious, oriented to time place person", description="Central nervous system")
    provisional_diagnosis: str = Field(..., min_length=2, description="Working admission diagnosis")
    plan_of_management: str = Field(..., min_length=5, description="Initial inpatient diagnostic and therapeutic plan")


class MorseFallRisk(BaseModel):
    history_of_falling: int = Field(0, description="0 (No) or 25 (Yes)")
    secondary_diagnosis: int = Field(0, description="0 (No) or 15 (Yes)")
    ambulatory_aid: int = Field(0, description="0 (None/bed rest), 15 (Crutches/cane/walker), 30 (Furniture)")
    iv_or_heparin_lock: int = Field(0, description="0 (No) or 20 (Yes)")
    gait_transferring: int = Field(0, description="0 (Normal/immobile), 10 (Weak), 20 (Impaired)")
    mental_status: int = Field(0, description="0 (Oriented to own ability), 15 (Overestimates/forgets limitations)")
    total_score: int = Field(..., ge=0, le=125)
    risk_level: Literal["LOW_RISK", "MEDIUM_RISK", "HIGH_RISK"] = "LOW_RISK"


class BradenPressureScore(BaseModel):
    sensory_perception: int = Field(4, ge=1, le=4)
    moisture: int = Field(4, ge=1, le=4)
    activity: int = Field(4, ge=1, le=4)
    mobility: int = Field(4, ge=1, le=4)
    nutrition: int = Field(4, ge=1, le=4)
    friction_and_shear: int = Field(3, ge=1, le=3)
    total_score: int = Field(..., ge=6, le=23)
    risk_category: Literal["NO_RISK", "MILD_RISK", "MODERATE_RISK", "HIGH_RISK", "VERY_HIGH_RISK"] = "NO_RISK"


class Form70NursingAssessment(BaseModel):
    model_config = ConfigDict(extra="ignore")

    assessment_datetime: datetime = Field(default_factory=datetime.now)
    temp_f: float = Field(..., ge=90.0, le=108.0)
    pulse_bpm: int = Field(..., ge=30, le=220)
    bp_systolic: int = Field(..., ge=50, le=280)
    bp_diastolic: int = Field(..., ge=30, le=180)
    resp_rate: int = Field(..., ge=8, le=60)
    spo2_percent: int = Field(..., ge=50, le=100)
    allergies_verified: bool = Field(True, description="Patient and wristband allergy cross-verification completed")
    allergy_details: Optional[str] = Field(None, description="Documented drug or latex allergies")
    morse_fall_risk: MorseFallRisk
    braden_pressure_score: BradenPressureScore
    bowel_sounds_present: bool = Field(True)
    diet_type: str = Field("NORMAL", description="NORMAL, SOFT, DIABETIC, RENAL, NPO")
    nurse_signature: str = Field(..., min_length=2, max_length=100)
