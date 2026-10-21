from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status
from app.repositories.formulary_repo import FormularyRepository
from app.repositories.patient_repo import PatientRepository
from app.repositories.questionnaire_repo import QuestionnaireRepository
from app.schemas.prescription import PrescriptionCreateRequest
from app.core.ddi_engine import DDIEngine
from app.core.cdss_engine import score_questionnaire_responses

class PrescriptionService:
    @staticmethod
    def search_formulary(q: Optional[str] = None, dosage_form: Optional[str] = None, limit: int = 50) -> Dict[str, Any]:
        drugs = FormularyRepository.search_drugs(q=q, dosage_form=dosage_form, limit=limit)
        return {
            "query": q,
            "dosage_form": dosage_form,
            "count": len(drugs),
            "drugs": drugs
        }

    @staticmethod
    def check_safety(visit_id: int, items: List[Any]) -> Dict[str, Any]:
        visit = PatientRepository.get_visit_by_id(visit_id)
        if not visit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visit encounter with ID {visit_id} not found."
            )

        # Retrieve patient allergies from questionnaire if available
        q_row = QuestionnaireRepository.get_by_visit_id(visit_id) or {}
        q_answers = q_row.get("answers") or q_row
        q_scores = score_questionnaire_responses(q_answers)
        patient_allergies = q_scores.get("reported_allergies", [])

        items_for_eval = []
        unrecognized_ids = []
        for it in items:
            drug_id = getattr(it, "drug_id", None) or (it.get("drug_id") if isinstance(it, dict) else None)
            if drug_id:
                drug = FormularyRepository.get_drug_by_id(drug_id)
                if drug:
                    items_for_eval.append({
                        "drug_id": drug_id,
                        "drug_name": drug["generic_name"] or drug["brand_name"],
                        "strength": drug["strength"],
                        "frequency": getattr(it, "frequency", None) or (it.get("frequency") if isinstance(it, dict) else "1-0-0"),
                        "dosage": getattr(it, "dosage", None) or (it.get("dosage") if isinstance(it, dict) else "1 tab")
                    })
                else:
                    unrecognized_ids.append(drug_id)

        safety_res = DDIEngine.evaluate_prescription_safety(
            prescribed_items=items_for_eval,
            patient_allergies=patient_allergies
        )
        if unrecognized_ids:
            safety_res["unrecognized_drug_ids"] = unrecognized_ids
        return safety_res

    @staticmethod
    def create_prescription(visit_id: int, req: PrescriptionCreateRequest) -> Dict[str, Any]:
        visit = PatientRepository.get_visit_by_id(visit_id)
        if not visit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visit encounter with ID {visit_id} not found."
            )

        if visit["status"] in ("READY_FOR_BILLING", "COMPLETED"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot author prescription for a visit in '{visit['status']}' state. Consultation is already signed off and locked."
            )
        if visit["status"] == "CANCELLED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot author prescription for a cancelled visit encounter."
            )

        attending_doctor_id = req.doctor_id or visit["doctor_id"]
        rx_status = (req.status or "FINALIZED").upper()
        if rx_status not in ("DRAFT", "FINALIZED", "DISPENSED", "CANCELLED"):
            rx_status = "FINALIZED"

        # 1. Fetch drug details and run DDI / Safety Analysis
        q_row = QuestionnaireRepository.get_by_visit_id(visit_id) or {}
        q_answers = q_row.get("answers") or q_row
        q_scores = score_questionnaire_responses(q_answers)
        patient_allergies = q_scores.get("reported_allergies", [])

        eval_items = []
        resolved_drugs = {}
        for item in req.items:
            drug = FormularyRepository.get_drug_by_id(item.drug_id)
            if not drug:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Drug with ID {item.drug_id} does not exist in formulary master."
                )
            resolved_drugs[item.drug_id] = drug
            eval_items.append({
                "drug_id": item.drug_id,
                "drug_name": drug["generic_name"] or drug["brand_name"],
                "strength": drug["strength"],
                "frequency": item.frequency or "1-0-0",
                "dosage": item.dosage or "1 tab"
            })

        safety_eval = DDIEngine.evaluate_prescription_safety(
            prescribed_items=eval_items,
            patient_allergies=patient_allergies
        )

        # 2. Persist prescription header
        rx_id = FormularyRepository.upsert_prescription(
            visit_id=visit_id,
            doctor_id=attending_doctor_id,
            general_instructions=req.general_instructions,
            status=rx_status
        )

        # 3. Persist prescription line items
        persisted_items = []
        for item in req.items:
            drug = resolved_drugs[item.drug_id]
            spec_instr = item.special_instructions or item.instructions
            item_id = FormularyRepository.insert_prescription_item(
                prescription_id=rx_id,
                drug_id=item.drug_id,
                dosage=item.dosage or "1 tab",
                frequency=item.frequency or "1-0-1",
                duration_days=item.duration_days or 5,
                meal_timing=item.meal_timing or "AFTER_MEALS",
                special_instructions=spec_instr
            )
            persisted_items.append({
                "item_id": item_id,
                "drug_id": item.drug_id,
                "brand_name": drug["brand_name"],
                "generic_name": drug["generic_name"],
                "dosage_form": drug["dosage_form"],
                "strength": drug["strength"],
                "dosage": item.dosage or "1 tab",
                "frequency": item.frequency or "1-0-1",
                "duration_days": item.duration_days or 5,
                "meal_timing": item.meal_timing or "AFTER_MEALS",
                "special_instructions": spec_instr
            })

        return {
            "message": "E-Prescription saved successfully",
            "prescription_id": rx_id,
            "visit_id": visit_id,
            "doctor_id": attending_doctor_id,
            "status": rx_status,
            "general_instructions": req.general_instructions,
            "items_count": len(persisted_items),
            "items": persisted_items,
            "safety_analysis": safety_eval
        }

    @staticmethod
    def get_prescription(visit_id: int) -> Dict[str, Any]:
        rx = FormularyRepository.get_prescription_by_visit_id(visit_id)
        if not rx:
            return {
                "visit_id": visit_id,
                "prescription": None,
                "items": []
            }

        items = FormularyRepository.get_prescription_items(rx["id"])
        return {
            "visit_id": visit_id,
            "prescription": rx,
            "items_count": len(items),
            "items": items
        }

