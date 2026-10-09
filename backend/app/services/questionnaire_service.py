from datetime import datetime
from typing import Dict, Any
from fastapi import HTTPException, status
from app.repositories.questionnaire_repo import QuestionnaireRepository
from app.repositories.patient_repo import PatientRepository
from app.schemas.questionnaire import QuestionnaireInput

class QuestionnaireService:
    @staticmethod
    def save_questionnaire(visit_id: int, req: QuestionnaireInput) -> Dict[str, Any]:
        visit = PatientRepository.get_visit_by_id(visit_id)
        if not visit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visit encounter with ID {visit_id} not found."
            )

        res = QuestionnaireRepository.upsert_questionnaire(
            visit_id=visit_id,
            patient_id=req.patient_id,
            answers=req.answers,
            voice_notes=req.voice_notes
        )

        ts = res["updated_at"]
        return {
            "message": "Intake questionnaire MCQ responses recorded successfully",
            "visit_id": visit_id,
            "questionnaire_id": res["id"],
            "recorded_answers": res["recorded_answers"],
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

        ts = row["updated_at"] or row["created_at"]
        return {
            "visit_id": row["visit_id"],
            "patient_id": row["patient_id"],
            "questionnaire_id": row["id"],
            "answers": answers,
            "voice_notes": row["voice_notes"],
            "recorded_at": ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
        }
