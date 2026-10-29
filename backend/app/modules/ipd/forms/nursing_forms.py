"""
Pydantic v2 Schemas for Daily Nursing & Care Plans (TASK-BE-5.4)
- FORM_71: Nurse Care Plan & Daily Goals
- FORM_72: Nurse Progress Notes & Shift Handover (NEWS2 & Wong-Baker Pain Score)
"""

from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, ConfigDict, Field


class NursingGoalItem(BaseModel):
    domain: Literal["AIRWAY", "PAIN_MANAGEMENT", "FLUID_BALANCE", "SKIN_INTEGRITY", "MOBILITY", "INFECTION_CONTROL"]
    goal_statement: str = Field(..., min_length=5)
    target_timeline_hours: int = Field(24, ge=1, le=168)
    status: Literal["IN_PROGRESS", "ACHIEVED", "REVISED"] = "IN_PROGRESS"


class Form71NurseCarePlan(BaseModel):
    model_config = ConfigDict(extra="ignore")

    care_plan_date: datetime = Field(default_factory=datetime.now)
    primary_nursing_diagnosis: str = Field(..., min_length=5)
    goals: List[NursingGoalItem] = Field(..., min_length=1)
    planned_interventions: List[str] = Field(..., min_length=1)
    airway_management: str = Field("Maintained on room air, coughing clear", max_length=255)
    iv_site_maintenance: str = Field("Right forearm IV cannula clean, dry, patent without phlebitis", max_length=255)
    pain_management_goal: str = Field("Target pain score <= 2/10 within 1 hour post-analgesic", max_length=255)
    assigned_nurse_name: str = Field(..., min_length=2, max_length=100)


class NEWS2Score(BaseModel):
    respiration_rate: int = Field(0, ge=0, le=3)
    oxygen_saturation: int = Field(0, ge=0, le=3)
    supplemental_oxygen: int = Field(0, ge=0, le=2)
    systolic_bp: int = Field(0, ge=0, le=3)
    pulse_rate: int = Field(0, ge=0, le=3)
    consciousness_level: int = Field(0, ge=0, le=3, description="0 (Alert) or 3 (CVPU: Confusion, Voice, Pain, Unresponsive)")
    temperature: int = Field(0, ge=0, le=3)
    total_score: int = Field(..., ge=0, le=20)
    clinical_risk: Literal["LOW", "LOW_MEDIUM", "MEDIUM", "HIGH"] = "LOW"


class Form72NurseProgressNotes(BaseModel):
    model_config = ConfigDict(extra="ignore")

    note_datetime: datetime = Field(default_factory=datetime.now)
    shift: Literal["MORNING", "EVENING", "NIGHT"] = "MORNING"
    news2_score: NEWS2Score
    pain_score_wong_baker: int = Field(0, ge=0, le=10, description="Wong-Baker FACES Pain Rating Scale 0-10")
    iv_cannula_phlebitis_score: int = Field(0, ge=0, le=5, description="VIP (Visual Infusion Phlebitis) score")
    narrative_progress_note: str = Field(..., min_length=10, description="Detailed shift observations and patient status changes")
    shift_handover_remarks: Optional[str] = Field(None, max_length=500, description="Special instructions handed over to next shift nurse")
    signed_nurse_name: str = Field(..., min_length=2, max_length=100)
