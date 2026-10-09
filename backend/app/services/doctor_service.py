from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from app.repositories.doctor_repo import DoctorRepository
from app.repositories.user_repo import UserRepository
from app.repositories.patient_repo import PatientRepository
from app.repositories.cdss_repo import CDSSRepository
from app.services.cdss_service import CDSSService
from app.schemas.cdss import DoctorSignOffRequest

class DoctorService:
    @staticmethod
    def get_doctor_queue(doctor_id: Optional[int] = None) -> Dict[str, Any]:
        doctor_name = "All Physicians"
        if doctor_id:
            doc = UserRepository.get_by_id(doctor_id)
            if doc:
                doctor_name = doc["full_name"]

        rows = DoctorRepository.get_queue(doctor_id)
        queue_items = []
        for r in rows:
            bp_str = f"{r['systolic_bp']}/{r['diastolic_bp']}" if (r.get("systolic_bp") and r.get("diastolic_bp")) else None
            triage_summary = {
                "bp": bp_str,
                "bp_stage": r.get("bp_stage"),
                "pulse": r.get("pulse_rate"),
                "spo2": r.get("spo2_pct"),
                "temperature_f": float(r["temperature_f"]) if r.get("temperature_f") is not None else None,
                "bmi": float(r["bmi"]) if r.get("bmi") is not None else None
            }
            visit_date_val = r["visit_date"].isoformat() if hasattr(r.get("visit_date"), "isoformat") else str(r.get("visit_date"))
            queue_items.append({
                "visit_id": r["visit_id"],
                "queue_token": r["queue_token"],
                "patient_id": r["patient_id"],
                "uhid": r["uhid"],
                "full_name": r["full_name"],
                "age": r["age"],
                "gender": r["gender"],
                "chief_complaint": r["chief_complaint"],
                "status": r["status"],
                "visit_date": visit_date_val,
                "triage_summary": triage_summary
            })

        return {
            "doctor_id": doctor_id,
            "doctor_name": doctor_name,
            "waiting_count": len(queue_items),
            "queue": queue_items
        }

    @staticmethod
    def call_patient(visit_id: int) -> Dict[str, Any]:
        visit = PatientRepository.get_visit_by_id(visit_id)
        if not visit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visit encounter with ID {visit_id} not found."
            )

        if visit["status"] in ("READY_FOR_BILLING", "COMPLETED", "CANCELLED"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot call patient into consultation. Encounter is already in '{visit['status']}' state."
            )

        if visit["status"] != "IN_CONSULTATION":
            DoctorRepository.update_visit_status(visit_id, "IN_CONSULTATION")

        return {
            "message": "Patient called into consultation room",
            "visit_id": visit_id,
            "status": "IN_CONSULTATION",
            "consultation_started_at": datetime.now().isoformat()
        }

    @staticmethod
    def sign_off_encounter(visit_id: int, req: DoctorSignOffRequest) -> Dict[str, Any]:
        visit = PatientRepository.get_visit_by_id(visit_id)
        if not visit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visit encounter with ID {visit_id} not found."
            )

        current_status = visit["status"]
        if current_status in ("READY_FOR_BILLING", "COMPLETED"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Encounter is already signed off and locked (Status: {current_status})."
            )
        if current_status == "CANCELLED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot sign off a cancelled encounter."
            )

        notes = req.conclusion_notes.strip()
        if len(notes) < 3:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Conclusion clinical notes are required to sign off encounter."
            )

        final_notes = notes
        if req.diagnosis and req.diagnosis.strip():
            final_notes = f"Diagnosis: {req.diagnosis.strip()}\n\nClinical Notes: {notes}"

        attending_doctor_id = req.doctor_id or visit["doctor_id"]
        if req.doctor_id:
            doc = UserRepository.get_by_id(req.doctor_id)
            if not doc:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Attending physician with ID {req.doctor_id} not found."
                )

        insights = CDSSRepository.get_insights_by_visit_id(visit_id)
        if not insights:
            insights = CDSSService.evaluate_cdss_for_visit(visit_id)

        critical_alerts = [i for i in insights if i.get("severity_level") == "CRITICAL"]
        unreviewed_critical = [
            i for i in critical_alerts 
            if not i.get("is_reviewed") and not (i.get("doctor_override_notes") and str(i.get("doctor_override_notes")).strip())
        ]

        override_text = (req.doctor_override_notes or req.override_reasons or "").strip()

        if unreviewed_critical:
            if not override_text:
                alert_names = ", ".join([f"[{a['rule_code']}] {a['title']}" for a in unreviewed_critical])
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Sign-off blocked: Unreviewed CRITICAL safety alert(s) detected: {alert_names}. "
                        "You must supply 'doctor_override_notes' justifying clinical override before finalizing."
                    )
                )
            else:
                CDSSRepository.override_critical_alerts(visit_id, override_text)

        CDSSRepository.sign_all_insights(visit_id)

        now_dt = datetime.now()
        DoctorRepository.lock_and_sign_off_visit(visit_id, final_notes, now_dt, attending_doctor_id)

        return {
            "message": "Consultation signed off and locked successfully",
            "visit_id": visit_id,
            "status": "READY_FOR_BILLING",
            "doctor_id": attending_doctor_id,
            "conclusion_notes": final_notes,
            "signed_at": now_dt.isoformat(),
            "next_station": "CASHIER_BILLING_DESK",
            "critical_alerts_count": len(critical_alerts),
            "critical_alerts_overridden": len(unreviewed_critical) if override_text else 0
        }
