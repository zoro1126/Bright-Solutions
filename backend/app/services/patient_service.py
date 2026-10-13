import math
from datetime import datetime, date
from typing import Optional, Dict, Any, List, Tuple
from fastapi import HTTPException, status
from app.repositories.patient_repo import PatientRepository
from app.repositories.user_repo import UserRepository
from app.schemas.patient import PatientRegistrationRequest
from app.core.triage_engine import (
    calculate_news2_score,
    determine_triage_priority,
    match_complaint_to_specialty,
    estimate_wait_time_minutes
)

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
    def auto_route_doctor(
        chief_complaint: Optional[str] = None,
        requested_doctor_id: Optional[int] = None,
        requested_doctor_name: Optional[str] = None
    ) -> Tuple[int, str]:
        """
        Deterministic Queue Automation & Doctor Load Balancing:
        1. Explicit ID requested: verify physician exists & is active.
        2. Explicit name requested: match to active physician.
        3. Auto-route: map complaint symptoms to specialty, then assign to active doctor
           with the lowest current waiting queue load.
        """
        # Case 1: Explicit doctor_id provided
        if requested_doctor_id:
            doc = UserRepository.get_by_id(requested_doctor_id)
            if doc and doc.get("role") == "DOCTOR" and doc.get("is_active"):
                return doc["id"], doc["full_name"]

        # Case 2: Explicit doctor_name provided (from frontend select)
        active_doctors = UserRepository.list_active_doctors()
        if requested_doctor_name and active_doctors:
            clean_req = requested_doctor_name.lower().strip()
            for d in active_doctors:
                if clean_req in d["full_name"].lower() or d["full_name"].lower() in clean_req:
                    return d["id"], d["full_name"]

        # Case 3: Automated Load Balancing by Specialty & Queue Depth
        specialty = match_complaint_to_specialty(chief_complaint)
        loads = PatientRepository.get_active_doctor_queue_loads()

        if not loads:
            # Fallback if no active doctors found in db
            return 2, "Dr. Vikram Kulkarni, MD"

        # Check for doctors matching specialty keywords in their name/profile
        specialty_keywords = specialty.lower().split()
        specialty_matches = [
            d for d in loads
            if any(kw in d["doctor_name"].lower() for kw in specialty_keywords if len(kw) > 3)
        ]

        candidate_pool = specialty_matches if specialty_matches else loads
        # Deterministically select doctor with lowest current active load
        best_doctor = min(candidate_pool, key=lambda x: x["active_load"])
        return best_doctor["doctor_id"], best_doctor["doctor_name"]

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
    def get_receptionist_queue(search: Optional[str] = None) -> Dict[str, Any]:
        """
        Offloads heavy client logic to backend:
        - Deterministic NEWS2 scores for all arrivals
        - Dynamic triage priorities (EMERGENCY / URGENT / ROUTINE)
        - Queue positions and wait-time estimations
        - Pre-computed category counts for instant UI tab switching
        """
        search_term = search.strip() if isinstance(search, str) and search.strip() else None
        records = PatientRepository.get_receptionist_queue_records(search_term)

        counts = {
            "all": 0,
            "pending": 0,
            "insights": 0,
            "consultation": 0,
            "completed": 0
        }

        queue_items: List[Dict[str, Any]] = []
        waiting_counter = 0

        for row in records:
            # 1. Deterministic NEWS2 calculation
            news2, _ = calculate_news2_score(
                resp_rate=row.get("resp_rate"),
                spo2_pct=row.get("spo2_pct"),
                systolic_bp=row.get("systolic_bp"),
                pulse_rate=row.get("pulse_rate"),
                temperature_f=row.get("temperature_f")
            )

            # 2. Deterministic Triage Priority
            priority, rationale = determine_triage_priority(
                news2_score=news2,
                chief_complaint=row.get("chief_complaint"),
                systolic_bp=row.get("systolic_bp"),
                spo2_pct=row.get("spo2_pct")
            )

            # 3. Frontend-compatible status mapping
            raw_status = row.get("visit_status") or "TRIAGED"
            has_questionnaire = bool(row.get("questionnaire_count") and row["questionnaire_count"] > 0)
            has_insights = bool(row.get("insight_count") and row["insight_count"] > 0)

            if raw_status == "IN_CONSULTATION":
                mapped_status = "IN_CONSULTATION"
                counts["consultation"] += 1
            elif raw_status in ("COMPLETED", "READY_FOR_BILLING"):
                mapped_status = "COMPLETED"
                counts["completed"] += 1
            elif has_insights:
                mapped_status = "INSIGHTS_READY"
                counts["insights"] += 1
            elif not has_questionnaire:
                mapped_status = "QUESTIONNAIRE_PENDING"
                counts["pending"] += 1
            else:
                mapped_status = raw_status

            counts["all"] += 1

            # 4. Sequential Queue Position & Dynamic Wait Time
            if mapped_status not in ("COMPLETED", "CANCELLED"):
                waiting_counter += 1
                queue_position = waiting_counter
            else:
                queue_position = 0

            wait_mins = estimate_wait_time_minutes(queue_position, priority)

            # 5. Build rich pre-formatted queue patient item
            visit_time = row["visit_date"].strftime("%I:%M %p") if row.get("visit_date") else "Now"
            item = {
                "id": f"pat-{row['patient_id']}",
                "patient_id": row["patient_id"],
                "visit_id": row["visit_id"],
                "mrn": row["uhid"],
                "uhid": row["uhid"],
                "fullName": row["full_name"],
                "age": row["age"] or 0,
                "gender": row["gender"],
                "phone": row["phone"],
                "address": row["address"],
                "queue_token": row["queue_token"],
                "queue_position": queue_position,
                "estimated_wait_mins": wait_mins,
                "status": mapped_status,
                "triage_priority": priority,
                "triage_rationale": rationale,
                "news2_score": news2,
                "doctor_id": row.get("doctor_id"),
                "doctorAssigned": row.get("doctor_name") or "On-Duty Physician",
                "appointmentTime": visit_time,
                "registeredAt": visit_time,
                "chief_complaint": row.get("chief_complaint"),
                "insurance": {
                    "type": row.get("insurance_type") or "CASH",
                    "provider": row.get("insurance_provider") or "Self-Pay / Cash",
                    "policyNumber": row.get("policy_number") or "N/A",
                    "coveragePct": 100 if row.get("insurance_type") == "GOVT_SCHEME" else (80 if row.get("insurance_type") == "INSURANCE" else 0)
                },
                "vitals": {
                    "bp": f"{row['systolic_bp']}/{row['diastolic_bp']}" if row.get("systolic_bp") and row.get("diastolic_bp") else None,
                    "pulse": row.get("pulse_rate"),
                    "temp": row.get("temperature_f"),
                    "spo2": row.get("spo2_pct"),
                    "resp": row.get("resp_rate"),
                    "weight": row.get("weight_kg"),
                    "height": row.get("height_cm"),
                    "bmi": row.get("bmi"),
                    "bmi_category": row.get("bmi_category"),
                    "bp_stage": row.get("bp_stage")
                } if row.get("vital_id") else None,
                "questionnaire_completed": has_questionnaire,
                "insights_ready": has_insights
            }
            queue_items.append(item)

        active_docs = UserRepository.list_active_doctors()
        return {
            "counts": counts,
            "queue": queue_items,
            "active_doctors_count": len(active_docs),
            "server_timestamp": datetime.now().isoformat()
        }

    @staticmethod
    def get_patient_details(patient_id: int) -> Dict[str, Any]:
        data = PatientRepository.get_patient_details(patient_id)
        if not data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient record #{patient_id} not found."
            )

        patient = data["patient"]
        visits = data["visits"]

        # Enrich each visit encounter with NEWS2 & triage scores
        enriched_visits = []
        for v in visits:
            news2, _ = calculate_news2_score(
                resp_rate=v.get("resp_rate"),
                spo2_pct=v.get("spo2_pct"),
                systolic_bp=v.get("systolic_bp"),
                pulse_rate=v.get("pulse_rate"),
                temperature_f=v.get("temperature_f")
            )
            prio, rat = determine_triage_priority(
                news2_score=news2,
                chief_complaint=v.get("chief_complaint"),
                systolic_bp=v.get("systolic_bp"),
                spo2_pct=v.get("spo2_pct")
            )
            v_dict = dict(v)
            v_dict["news2_score"] = news2
            v_dict["triage_priority"] = prio
            v_dict["triage_rationale"] = rat
            enriched_visits.append(v_dict)

        latest_vitals = enriched_visits[0] if enriched_visits and enriched_visits[0].get("vital_id") else None

        return {
            "patient": patient,
            "latest_vitals": latest_vitals,
            "visits": enriched_visits,
            "latest_questionnaire": data["latest_questionnaire"]
        }

    @staticmethod
    def register_patient(req: PatientRegistrationRequest) -> Dict[str, Any]:
        # Handle first/last name decomposition
        first_name = (req.first_name or "").strip()
        last_name = (req.last_name or "").strip()

        if not first_name and req.full_name:
            parts = req.full_name.strip().split(" ", 1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else ""

        if not first_name:
            first_name = "Patient"

        # Handle Date of Birth vs Age
        dob = req.dob
        if not dob:
            current_year = datetime.now().year
            if req.age:
                dob = date(current_year - req.age, 1, 1)
            else:
                dob = date(1990, 1, 1)

        # Automated Doctor Routing & Load Balancing
        doctor_id, doctor_name = PatientService.auto_route_doctor(
            chief_complaint=req.chief_complaint,
            requested_doctor_id=req.doctor_id,
            requested_doctor_name=req.doctor_assigned
        )

        # Emergency Contact Formatting
        em_contact = req.emergency_contact
        if not em_contact and (req.emergency_contact_name or req.emergency_contact_phone):
            name_p = req.emergency_contact_name or "Emergency Contact"
            phone_p = req.emergency_contact_phone or ""
            em_contact = f"{name_p} ({phone_p})".strip()

        receptionist_id = 1
        current_year = datetime.now().year
        patient_count_year = PatientRepository.get_patient_count_for_year(current_year)
        patient_seq = patient_count_year + 1
        uhid = f"UHID-{current_year}-{patient_seq:05d}"

        patient_id = PatientRepository.insert_patient(
            uhid=uhid,
            first_name=first_name,
            last_name=last_name,
            dob=dob,
            gender=req.gender.upper(),
            blood_group=req.blood_group.upper() if req.blood_group else "UNKNOWN",
            phone=req.phone.strip(),
            email=req.email.strip() if req.email else None,
            address=req.address.strip() if req.address else None,
            emergency_contact=em_contact,
            insurance_type=req.insurance_type or "CASH",
            insurance_provider=req.insurance_provider or ("Ayushman Bharat PM-JAY" if req.insurance_type == "GOVT_SCHEME" else "Self-Pay / Cash"),
            policy_number=req.policy_number or req.govt_scheme_name or "N/A"
        )

        today_visits = PatientRepository.get_today_token_count()
        token_num = 101 + today_visits
        queue_token = f"Q-{token_num}"

        visit_id = PatientRepository.insert_visit(
            patient_id=patient_id,
            doctor_id=doctor_id,
            receptionist_id=receptionist_id,
            queue_token=queue_token,
            chief_complaint=req.chief_complaint or "Routine General OPD Consultation"
        )

        vitals_data = req.vitals
        bmi = None
        bmi_category = None
        bp_stage = None
        vital_id = None
        news2_score = 0
        triage_priority = "ROUTINE"
        triage_rationale = "Routine checkup"

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

            news2_score, _ = calculate_news2_score(
                resp_rate=vitals_data.resp_rate,
                spo2_pct=vitals_data.spo2_pct,
                systolic_bp=vitals_data.systolic_bp,
                pulse_rate=vitals_data.pulse_rate,
                temperature_f=vitals_data.temperature_f
            )

            triage_priority, triage_rationale = determine_triage_priority(
                news2_score=news2_score,
                chief_complaint=req.chief_complaint,
                systolic_bp=vitals_data.systolic_bp,
                spo2_pct=vitals_data.spo2_pct
            )

        return {
            "message": "Patient registered and triage vitals recorded successfully",
            "patient": {
                "id": patient_id,
                "uhid": uhid,
                "full_name": f"{first_name} {last_name}".strip(),
                "phone": req.phone,
                "gender": req.gender,
                "dob": str(dob)
            },
            "visit": {
                "id": visit_id,
                "queue_token": queue_token,
                "doctor_id": doctor_id,
                "doctor_name": doctor_name,
                "status": "TRIAGED",
                "triage_priority": triage_priority,
                "triage_rationale": triage_rationale,
                "news2_score": news2_score,
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

