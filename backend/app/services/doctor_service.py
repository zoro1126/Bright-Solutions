from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status
from app.repositories.doctor_repo import DoctorRepository
from app.repositories.user_repo import UserRepository
from app.repositories.patient_repo import PatientRepository
from app.repositories.cdss_repo import CDSSRepository
from app.services.cdss_service import CDSSService
from app.schemas.cdss import DoctorSignOffRequest
from app.core.nlp_summarizer import ClinicalNarrativeSynthesizer
from app.core.cdss_engine import score_questionnaire_responses

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
    def get_patient_dossier(patient_id: int) -> Dict[str, Any]:
        raw = DoctorRepository.get_patient_dossier_data(patient_id)
        if not raw or not raw.get("patient"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient with ID {patient_id} not found."
            )

        pat = raw["patient"]
        active_visit = raw["active_visit"] or {}
        raw_vitals = raw["vitals"] or {}
        raw_q = raw["questionnaire"] or {}
        reports = raw["reports"] or []
        past_visits = raw["past_visits"] or []
        past_prescriptions = raw["past_prescriptions"] or []
        insights = raw["insights"] or []

        # Parse questionnaire answers
        answers = {}
        for i in range(1, 21):
            k = f"q{i}"
            if raw_q.get(k) is not None:
                answers[k] = raw_q[k]

        q_scores = score_questionnaire_responses(answers) if answers else {}

        # Prepare vitals dictionary
        vitals_dict = {
            "systolic_bp": raw_vitals.get("systolic_bp"),
            "diastolic_bp": raw_vitals.get("diastolic_bp"),
            "pulse_rate": raw_vitals.get("pulse_rate"),
            "temperature_f": float(raw_vitals["temperature_f"]) if raw_vitals.get("temperature_f") is not None else None,
            "resp_rate": raw_vitals.get("resp_rate"),
            "spo2_pct": raw_vitals.get("spo2_pct"),
            "weight_kg": float(raw_vitals["weight_kg"]) if raw_vitals.get("weight_kg") is not None else None,
            "height_cm": float(raw_vitals["height_cm"]) if raw_vitals.get("height_cm") is not None else None,
            "bmi": float(raw_vitals["bmi"]) if raw_vitals.get("bmi") is not None else None,
            "bp_stage": raw_vitals.get("bp_stage")
        }

        # Extract allergies
        allergies = list(q_scores.get("reported_allergies") or [])

        # Synthesize NLP Consultation Narrative & Pertinent Negatives
        chief_complaint = active_visit.get("chief_complaint") or ""
        voice_notes = raw_q.get("voice_notes") or ""
        brief = ClinicalNarrativeSynthesizer.generate_physician_consultation_brief(
            patient_name=pat.get("full_name") or "",
            age=pat.get("age"),
            gender=pat.get("gender"),
            chief_complaint=chief_complaint,
            voice_notes=voice_notes,
            vitals=vitals_dict,
            scores=q_scores,
            allergies=allergies
        )

        # Build risk flags array formatted for doctor screen popup
        risk_flags = []
        for ins in insights:
            sev = "HIGH" if ins.get("severity_level") == "CRITICAL" else "MEDIUM"
            risk_flags.append({
                "id": ins.get("id"),
                "rule_code": ins.get("rule_code"),
                "severity": sev,
                "label": ins.get("title"),
                "note": ins.get("description"),
                "recommendation": ins.get("recommendation"),
                "is_reviewed": bool(ins.get("is_reviewed")),
                "is_signed": bool(ins.get("is_signed")),
                "doctor_override_notes": ins.get("doctor_override_notes")
            })

        # Format past reports
        clean_reports = []
        for rep in reports:
            clean_reports.append({
                "id": rep["id"],
                "visit_id": rep["visit_id"],
                "report_type": rep["report_type"],
                "modality": rep.get("modality"),
                "file_path": rep["file_path"],
                "file_size_mb": float(rep["file_size_mb"]) if rep.get("file_size_mb") is not None else 0.0,
                "findings_summary": rep.get("findings_summary"),
                "upload_date": rep["upload_date"].isoformat() if hasattr(rep.get("upload_date"), "isoformat") else str(rep.get("upload_date"))
            })

        # Format past visits
        clean_past_visits = []
        for pv in past_visits:
            v_date = pv["visit_date"].isoformat() if hasattr(pv.get("visit_date"), "isoformat") else str(pv.get("visit_date"))
            clean_past_visits.append({
                "visit_id": pv["visit_id"],
                "queue_token": pv["queue_token"],
                "visit_date": v_date,
                "status": pv["status"],
                "chief_complaint": pv.get("chief_complaint"),
                "conclusion_notes": pv.get("conclusion_notes"),
                "doctor_name": pv.get("doctor_name"),
                "systolic_bp": pv.get("systolic_bp"),
                "diastolic_bp": pv.get("diastolic_bp"),
                "pulse_rate": pv.get("pulse_rate"),
                "temperature_f": float(pv["temperature_f"]) if pv.get("temperature_f") is not None else None
            })

        # Clean active visit
        v_date_active = active_visit.get("visit_date")
        clean_active_visit = {
            "id": active_visit.get("visit_id"),
            "queue_token": active_visit.get("queue_token"),
            "status": active_visit.get("status"),
            "chief_complaint": active_visit.get("chief_complaint"),
            "visit_date": v_date_active.isoformat() if hasattr(v_date_active, "isoformat") else str(v_date_active or ""),
            "doctor_assigned": active_visit.get("doctor_assigned") or "Attending Physician"
        }

        # Insurance bundle
        insurance = {
            "provider": pat.get("insurance_provider") or "Direct Self-Pay",
            "policy_number": pat.get("policy_number") or "N/A",
            "type": pat.get("insurance_type") or "CASH"
        }

        clean_patient = {
            "id": pat["id"],
            "uhid": pat["uhid"],
            "full_name": pat["full_name"],
            "dob": pat["dob"].isoformat() if hasattr(pat.get("dob"), "isoformat") else str(pat.get("dob")),
            "age": pat["age"],
            "gender": pat["gender"],
            "blood_group": pat.get("blood_group"),
            "phone": pat.get("phone"),
            "email": pat.get("email"),
            "address": pat.get("address"),
            "emergency_contact": pat.get("emergency_contact"),
            "insurance": insurance
        }

        return {
            "patient": clean_patient,
            "active_visit": clean_active_visit,
            "vitals": vitals_dict,
            "questionnaire": {
                "answers": answers,
                "voice_notes": raw_q.get("voice_notes"),
                "clinical_scores": q_scores
            },
            "reports": clean_reports,
            "past_visits": clean_past_visits,
            "past_prescriptions": past_prescriptions,
            "insights": {
                "symptomSummary": brief["symptom_summary"],
                "hpiNarrative": brief["hpi_narrative"],
                "pertinentNegatives": brief["pertinent_negatives"],
                "affirmedSymptoms": brief["affirmed_symptoms"],
                "riskFlags": risk_flags,
                "totalInsights": len(insights)
            }
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
        if not attending_doctor_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No attending physician assigned to sign off this encounter."
            )
        doc = UserRepository.get_by_id(attending_doctor_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Attending physician with ID {attending_doctor_id} not found."
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

