from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from app.repositories.cdss_repo import CDSSRepository
from app.repositories.patient_repo import PatientRepository
from app.schemas.cdss import InsightReviewRequest

class CDSSService:
    @staticmethod
    def evaluate_cdss_for_visit(visit_id: int) -> List[Dict[str, Any]]:
        vitals = CDSSRepository.get_vitals_by_visit_id(visit_id) or {}

        sys_bp = vitals.get("systolic_bp")
        dia_bp = vitals.get("diastolic_bp")
        pulse = vitals.get("pulse_rate")
        temp = vitals.get("temperature_f")
        spo2 = vitals.get("spo2_pct")
        resp = vitals.get("resp_rate")
        bmi = vitals.get("bmi")

        rules = []

        # Rule 1: Blood Pressure (AHA 2017)
        if sys_bp and dia_bp:
            if sys_bp >= 180 or dia_bp >= 120:
                rules.append({
                    "rule_code": "RULE_HTN_CRISIS",
                    "severity_level": "CRITICAL",
                    "category": "VITALS",
                    "title": "Hypertensive Crisis Alert",
                    "description": f"Systolic BP {sys_bp} mmHg / Diastolic BP {dia_bp} mmHg exceeds emergency threshold (>= 180/120 mmHg).",
                    "recommendation": "Initiate immediate IV antihypertensive protocol. Screen for acute organ damage (ECG, troponin, fundoscopy)."
                })
            elif sys_bp >= 140 or dia_bp >= 90:
                rules.append({
                    "rule_code": "RULE_HTN_STAGE2",
                    "severity_level": "WARNING",
                    "category": "VITALS",
                    "title": "Stage 2 Hypertension Flag",
                    "description": f"BP {sys_bp}/{dia_bp} mmHg meets Stage 2 Hypertension criteria.",
                    "recommendation": "Initiate dual-agent pharmacotherapy and lifestyle counseling. Schedule 2-week follow-up."
                })
            elif (130 <= sys_bp <= 139) or (80 <= dia_bp <= 89):
                rules.append({
                    "rule_code": "RULE_HTN_STAGE1",
                    "severity_level": "INFO",
                    "category": "VITALS",
                    "title": "Stage 1 Hypertension Observed",
                    "description": f"BP {sys_bp}/{dia_bp} mmHg meets Stage 1 criteria.",
                    "recommendation": "Recommend DASH dietary modifications, sodium reduction, and follow-up in 1 month."
                })

        # Rule 2: Hypoxemia & Respiratory
        if spo2 is not None:
            if spo2 < 90:
                rules.append({
                    "rule_code": "RULE_HYPOXEMIA_CRITICAL",
                    "severity_level": "CRITICAL",
                    "category": "VITALS",
                    "title": "Severe Hypoxemia Alert",
                    "description": f"Oxygen saturation SpO2 {spo2}% is critically depressed (< 90%).",
                    "recommendation": "Administer high-flow supplemental oxygen immediately. Assess airway and auscultate lung fields."
                })
            elif spo2 <= 94:
                rules.append({
                    "rule_code": "RULE_HYPOXEMIA_MILD",
                    "severity_level": "WARNING",
                    "category": "VITALS",
                    "title": "Moderate Hypoxemia Flag",
                    "description": f"Oxygen saturation SpO2 {spo2}% is subnormal (90 - 94%).",
                    "recommendation": "Monitor SpO2 continuously. Consider bronchodilator nebulization and chest radiograph."
                })

        if resp and resp > 24:
            rules.append({
                "rule_code": "RULE_TACHYPNEA",
                "severity_level": "WARNING",
                "category": "VITALS",
                "title": "Tachypnea Detected",
                "description": f"Respiratory rate {resp} bpm exceeds normal resting limits (> 24 bpm).",
                "recommendation": "Assess for acute dyspnea, metabolic acidosis compensation, or pulmonary embolism."
            })

        # Rule 3: Cardiac Rhythm
        if pulse is not None:
            if pulse > 100:
                rules.append({
                    "rule_code": "RULE_TACHYCARDIA",
                    "severity_level": "WARNING",
                    "category": "VITALS",
                    "title": "Sinus Tachycardia Detected",
                    "description": f"Resting pulse rate {pulse} bpm exceeds 100 bpm.",
                    "recommendation": "Check for fever, dehydration, anxiety, hyperthyroidism, or arrhythmias. Review 12-lead ECG."
                })
            elif pulse < 50:
                rules.append({
                    "rule_code": "RULE_BRADYCARDIA",
                    "severity_level": "WARNING",
                    "category": "VITALS",
                    "title": "Sinus Bradycardia Detected",
                    "description": f"Resting pulse rate {pulse} bpm is below 50 bpm.",
                    "recommendation": "Check for beta-blocker/calcium channel blocker usage, athletic baseline, or conduction blocks."
                })

        # Rule 4: Pyrexia / Fever
        if temp is not None:
            if temp >= 101.5:
                rules.append({
                    "rule_code": "RULE_PYREXIA_HIGH",
                    "severity_level": "WARNING",
                    "category": "VITALS",
                    "title": "High-Grade Pyrexia Flag",
                    "description": f"Body temperature {temp}°F is elevated (>= 101.5°F).",
                    "recommendation": "Order antipyretic therapy (Paracetamol), hydration, and complete blood count / infectious workup."
                })
            elif temp >= 99.5:
                rules.append({
                    "rule_code": "RULE_PYREXIA_LOW",
                    "severity_level": "INFO",
                    "category": "VITALS",
                    "title": "Low-Grade Fever Observed",
                    "description": f"Body temperature {temp}°F is mildly elevated (99.5 - 101.4°F).",
                    "recommendation": "Monitor temperature trajectory. Screen for upper respiratory or viral prodrome."
                })

        # Rule 5: BMI & Obesity
        if bmi and float(bmi) >= 30.0:
            rules.append({
                "rule_code": "RULE_OBESITY_CLASS",
                "severity_level": "INFO",
                "category": "GUIDELINE",
                "title": "Class 1+ Obesity Status",
                "description": f"Patient BMI {bmi} kg/m² exceeds 30.0 kg/m² threshold.",
                "recommendation": "Consider screening for metabolic syndrome, lipid profile, and HbA1c testing."
            })

        # Persist and return refreshed insights
        return CDSSRepository.sync_insights(visit_id, rules)

    @staticmethod
    def trigger_insights(visit_id: int) -> Dict[str, Any]:
        visit = PatientRepository.get_visit_by_id(visit_id)
        if not visit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visit encounter with ID {visit_id} not found."
            )

        insights = CDSSService.evaluate_cdss_for_visit(visit_id)
        has_critical = any(i["severity_level"] == "CRITICAL" for i in insights)

        return {
            "visit_id": visit_id,
            "insights_count": len(insights),
            "has_critical": has_critical,
            "insights": insights
        }

    @staticmethod
    def get_insights(visit_id: int) -> Dict[str, Any]:
        visit = PatientRepository.get_visit_by_id(visit_id)
        if not visit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visit encounter with ID {visit_id} not found."
            )

        insights = CDSSRepository.get_insights_by_visit_id(visit_id)
        if not insights:
            insights = CDSSService.evaluate_cdss_for_visit(visit_id)

        has_critical = any(i["severity_level"] == "CRITICAL" for i in insights)
        return {
            "visit_id": visit_id,
            "insights_count": len(insights),
            "has_critical": has_critical,
            "insights": insights
        }

    @staticmethod
    def review_insight(insight_id: int, req: InsightReviewRequest) -> Dict[str, Any]:
        insight = CDSSRepository.get_insight_by_id(insight_id)
        if not insight:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Insight flag with ID {insight_id} not found."
            )

        CDSSRepository.update_insight_review(
            insight_id=insight_id,
            is_reviewed=req.is_reviewed,
            doctor_override_notes=req.doctor_override_notes
        )

        return {
            "message": "Clinical insight review status updated",
            "insight_id": insight_id,
            "is_reviewed": bool(req.is_reviewed),
            "doctor_override_notes": req.doctor_override_notes
        }
