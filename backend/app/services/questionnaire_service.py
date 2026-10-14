from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from app.repositories.questionnaire_repo import QuestionnaireRepository
from app.repositories.patient_repo import PatientRepository
from app.repositories.cdss_repo import CDSSRepository
from app.schemas.questionnaire import QuestionnaireInput
from app.core.cdss_engine import (
    score_questionnaire_responses,
    predict_conditions_from_context,
    filter_candidate_medications,
    generate_clinical_insights
)

class QuestionnaireService:
    @staticmethod
    def save_questionnaire(visit_id: int, req: QuestionnaireInput) -> Dict[str, Any]:
        visit = PatientRepository.get_visit_by_id(visit_id)
        if not visit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visit encounter with ID {visit_id} not found."
            )

        patient_id = req.patient_id or visit["patient_id"]

        # 1. Upsert raw MCQ answers and voice notes into intake_questionnaires
        res = QuestionnaireRepository.upsert_questionnaire(
            visit_id=visit_id,
            patient_id=patient_id,
            answers=req.answers or {},
            voice_notes=req.voice_notes
        )

        # 2. Retrieve rich clinical context (triage vitals, demographics, complaint)
        context = QuestionnaireRepository.get_visit_clinical_context(visit_id) or {}
        vitals = {
            "systolic_bp": context.get("systolic_bp"),
            "diastolic_bp": context.get("diastolic_bp"),
            "pulse_rate": context.get("pulse_rate"),
            "temperature_f": context.get("temperature_f"),
            "resp_rate": context.get("resp_rate"),
            "spo2_pct": context.get("spo2_pct"),
            "bmi": context.get("bmi")
        }
        chief_complaint = req.chief_complaint or context.get("chief_complaint") or ""
        patient_age = context.get("age") or 35

        # 3. Deterministic Clinical Scoring (PHQ-2, GAD-2, PEG-3, Red Flags)
        scores = score_questionnaire_responses(req.answers or {})

        # 4. Deterministic Differential Condition Prediction
        conditions = predict_conditions_from_context(
            vitals=vitals,
            chief_complaint=chief_complaint,
            scores=scores,
            patient_age=patient_age
        )
        disease_codes = [c["disease_code"] for c in conditions]

        # 5. Fetch Candidate WHO EML Generic Medicines
        raw_candidates = QuestionnaireRepository.get_candidate_medications_by_disease_codes(disease_codes)

        # Extract patient allergies and chronic comorbidities
        patient_allergies = list(req.allergies or []) + scores.get("reported_allergies", [])
        patient_comorbidities = list(req.comorbidities or []) + scores.get("reported_comorbidities", [])

        # 6. Apply Deterministic Medication Safety Gate (Allergy & Organ Contraindications)
        recommended_meds = filter_candidate_medications(
            candidate_meds=raw_candidates,
            patient_allergies=patient_allergies,
            comorbidities=patient_comorbidities
        )

        has_allergy_conflicts = any(m.get("safety_status") == "CONTRAINDICATED" for m in recommended_meds)

        # 7. Generate and Sync Deterministic Insights
        insights = generate_clinical_insights(
            vitals=vitals,
            scores=scores,
            predicted_conditions=conditions,
            has_allergy_conflicts=has_allergy_conflicts
        )
        CDSSRepository.sync_insights(visit_id, insights)

        ts = res["updated_at"]
        return {
            "message": "Intake questionnaire evaluated and deterministic clinical insights generated successfully",
            "visit_id": visit_id,
            "questionnaire_id": res["id"],
            "recorded_answers": res["recorded_answers"],
            "clinical_scores": scores,
            "predicted_conditions": conditions,
            "recommended_medications": recommended_meds,
            "insights_generated_count": len(insights),
            "updated_at": ts.isoformat() if hasattr(ts, "isoformat") else str(ts or datetime.now().isoformat())
        }

    @staticmethod
    def get_questionnaire(visit_id: int) -> Dict[str, Any]:
        visit = PatientRepository.get_visit_by_id(visit_id)
        if not visit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visit encounter with ID {visit_id} not found."
            )

        row = QuestionnaireRepository.get_by_visit_id(visit_id)
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No questionnaire responses recorded for visit encounter {visit_id}."
            )

        answers = {}
        for i in range(1, 21):
            key = f"q{i}"
            if row.get(key) is not None:
                answers[key] = row[key]

        context = QuestionnaireRepository.get_visit_clinical_context(visit_id) or {}
        vitals = {
            "systolic_bp": context.get("systolic_bp"),
            "diastolic_bp": context.get("diastolic_bp"),
            "pulse_rate": context.get("pulse_rate"),
            "temperature_f": context.get("temperature_f"),
            "resp_rate": context.get("resp_rate"),
            "spo2_pct": context.get("spo2_pct"),
            "bmi": context.get("bmi")
        }
        chief_complaint = context.get("chief_complaint") or ""

        scores = score_questionnaire_responses(answers)
        conditions = predict_conditions_from_context(
            vitals=vitals,
            chief_complaint=chief_complaint,
            scores=scores,
            patient_age=context.get("age") or 35
        )
        disease_codes = [c["disease_code"] for c in conditions]
        raw_candidates = QuestionnaireRepository.get_candidate_medications_by_disease_codes(disease_codes)
        recommended_meds = filter_candidate_medications(
            candidate_meds=raw_candidates,
            patient_allergies=scores.get("reported_allergies", []),
            comorbidities=scores.get("reported_comorbidities", [])
        )

        ts = row["updated_at"] or row["created_at"]
        return {
            "visit_id": row["visit_id"],
            "patient_id": row["patient_id"],
            "questionnaire_id": row["id"],
            "answers": answers,
            "voice_notes": row["voice_notes"],
            "clinical_scores": scores,
            "predicted_conditions": conditions,
            "recommended_medications": recommended_meds,
            "recorded_at": ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
        }

