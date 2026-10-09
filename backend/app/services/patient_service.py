import math
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple
from fastapi import HTTPException, status
from app.repositories.patient_repo import PatientRepository
from app.repositories.user_repo import UserRepository
from app.schemas.patient import PatientRegistrationRequest

def compute_bmi_and_category(weight_kg: Optional[float], height_cm: Optional[float]) -> Tuple[Optional[float], Optional[str]]:
    if not weight_kg or not height_cm or height_cm <= 0:
        return None, None
    height_m = height_cm / 100.0
    bmi = round(weight_kg / (height_m * height_m), 1)
    if bmi < 18.5:
        category = "Underweight"
    elif bmi < 25.0:
        category = "Normal Weight"
    elif bmi < 30.0:
        category = "Overweight"
    else:
        category = "Obese"
    return bmi, category

def compute_bp_stage(systolic: Optional[int], diastolic: Optional[int]) -> Optional[str]:
    if not systolic or not diastolic:
        return None
    if systolic >= 180 or diastolic >= 120:
        return "Hypertensive Crisis"
    elif systolic >= 140 or diastolic >= 90:
        return "Stage 2 Hypertension"
    elif (130 <= systolic <= 139) or (80 <= diastolic <= 89):
        return "Stage 1 Hypertension"
    elif (120 <= systolic <= 129) and diastolic < 80:
        return "Elevated BP"
    elif systolic < 120 and diastolic < 80:
        return "Normal Blood Pressure"
    return "Borderline"

class PatientService:
    @staticmethod
    def list_doctors() -> Dict[str, Any]:
        doctors = UserRepository.list_active_doctors()
        return {"count": len(doctors), "doctors": doctors}

    @staticmethod
    def get_next_token() -> Dict[str, str]:
        today_count = PatientRepository.get_today_token_count()
        next_num = 101 + today_count
        return {"next_token": f"Q-{next_num}"}

    @staticmethod
    def list_patients(
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
        limit: Optional[int] = None
    ) -> Dict[str, Any]:
        effective_page_size = limit if isinstance(limit, int) else (page_size if isinstance(page_size, int) else 20)
        cur_page = page if isinstance(page, int) else 1
        offset = (cur_page - 1) * effective_page_size
        search_term = search.strip() if isinstance(search, str) and search.strip() else None

        total_count = PatientRepository.count_matching_patients(search_term)
        total_pages = math.ceil(total_count / effective_page_size) if total_count > 0 else 1

        patients = PatientRepository.fetch_patients_paginated(search_term, effective_page_size, offset)
        return {
            "total_count": total_count,
            "page": cur_page,
            "page_size": effective_page_size,
            "total_pages": total_pages,
            "count": len(patients),
            "patients": patients
        }

    @staticmethod
    def register_patient(req: PatientRegistrationRequest) -> Dict[str, Any]:
        doctor = UserRepository.get_by_id(req.doctor_id)
        if not doctor or doctor.get("role") != "DOCTOR":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Doctor with ID {req.doctor_id} not found or inactive."
            )

        # Default receptionist
        receptionist_id = 1

        current_year = datetime.now().year
        patient_count_year = PatientRepository.get_patient_count_for_year(current_year)
        patient_seq = patient_count_year + 1
        uhid = f"UHID-{current_year}-{patient_seq:05d}"

        patient_id = PatientRepository.insert_patient(
            uhid=uhid,
            first_name=req.first_name.strip(),
            last_name=req.last_name.strip(),
            dob=req.dob,
            gender=req.gender.upper(),
            blood_group=req.blood_group.upper() if req.blood_group else "UNKNOWN",
            phone=req.phone.strip(),
            email=req.email.strip() if req.email else None,
            address=req.address.strip() if req.address else None,
            emergency_contact=req.emergency_contact.strip() if req.emergency_contact else None,
            insurance_type=req.insurance_type or "CASH",
            insurance_provider=req.insurance_provider,
            policy_number=req.policy_number
        )

        today_visits = PatientRepository.get_today_token_count()
        token_num = 101 + today_visits
        queue_token = f"Q-{token_num}"

        visit_id = PatientRepository.insert_visit(
            patient_id=patient_id,
            doctor_id=req.doctor_id,
            receptionist_id=receptionist_id,
            queue_token=queue_token,
            chief_complaint=req.chief_complaint or "Routine General OPD Consultation"
        )

        vitals_data = req.vitals
        bmi = None
        bmi_category = None
        bp_stage = None
        vital_id = None

        if vitals_data:
            bmi, bmi_category = compute_bmi_and_category(vitals_data.weight_kg, vitals_data.height_cm)
            bp_stage = compute_bp_stage(vitals_data.systolic_bp, vitals_data.diastolic_bp)

            vital_id = PatientRepository.insert_vitals(
                visit_id=visit_id,
                sys_bp=vitals_data.systolic_bp,
                dia_bp=vitals_data.diastolic_bp,
                pulse=vitals_data.pulse_rate,
                temp=vitals_data.temperature_f,
                resp=vitals_data.resp_rate,
                spo2=vitals_data.spo2_pct,
                weight=vitals_data.weight_kg,
                height=vitals_data.height_cm,
                bmi=bmi,
                bmi_category=bmi_category,
                bp_stage=bp_stage
            )

        return {
            "message": "Patient registered and triage vitals recorded successfully",
            "patient": {
                "id": patient_id,
                "uhid": uhid,
                "full_name": f"{req.first_name} {req.last_name}",
                "phone": req.phone,
                "gender": req.gender,
                "dob": str(req.dob)
            },
            "visit": {
                "id": visit_id,
                "queue_token": queue_token,
                "doctor_name": doctor["full_name"],
                "status": "TRIAGED",
                "visit_date": datetime.now().isoformat()
            },
            "vitals": {
                "id": vital_id,
                "bmi": bmi,
                "bmi_category": bmi_category,
                "bp_stage": bp_stage,
                "systolic_bp": vitals_data.systolic_bp if vitals_data else None,
                "diastolic_bp": vitals_data.diastolic_bp if vitals_data else None,
                "pulse_rate": vitals_data.pulse_rate if vitals_data else None,
                "temperature_f": vitals_data.temperature_f if vitals_data else None,
                "spo2_pct": vitals_data.spo2_pct if vitals_data else None
            }
        }
