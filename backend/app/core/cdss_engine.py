"""
Deterministic Clinical Decision Support & Medication Safety Engine
Lightweight (<100 KB RAM), zero-ML-dependency rule engine for:
1. Intake questionnaire scoring (PHQ-2, GAD-2, PEG-3, Red Flags)
2. Differential disease prediction from vitals + questionnaire symptoms
3. Guideline-directed generic medication matching from WHO EML
4. Patient allergy masking and organ-risk contraindication filtering
"""

from typing import Dict, Any, List, Optional, Tuple

def score_questionnaire_responses(answers: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes validated clinical instrument scores from questionnaire MCQ answers.
    Handles both 'q1'..'q20' index format and named keys.
    """
    scores = {
        "phq2_score": 0,
        "phq2_positive": False,
        "gad2_score": 0,
        "gad2_positive": False,
        "peg3_average": 0.0,
        "peg3_significant_pain": False,
        "red_flag_emergency": False,
        "immunization_up_to_date": True,
        "reported_allergies": [],
        "reported_comorbidities": []
    }

    if not answers:
        return scores

    # 1. Depression Screening: PHQ-2 (q5 & q6 or phq2_1 & phq2_2, 0 to 3 each)
    q_phq1 = answers.get("phq2_1", answers.get("q5", 0))
    q_phq2 = answers.get("phq2_2", answers.get("q6", 0))
    try:
        phq_val = (int(q_phq1 or 0)) + (int(q_phq2 or 0))
        scores["phq2_score"] = min(6, max(0, phq_val))
        scores["phq2_positive"] = scores["phq2_score"] >= 3
    except (ValueError, TypeError):
        pass

    # 2. Anxiety Screening: GAD-2 (q7 & q8 or gad2_1 & gad2_2, 0 to 3 each)
    q_gad1 = answers.get("gad2_1", answers.get("q7", 0))
    q_gad2 = answers.get("gad2_2", answers.get("q8", 0))
    try:
        gad_val = (int(q_gad1 or 0)) + (int(q_gad2 or 0))
        scores["gad2_score"] = min(6, max(0, gad_val))
        scores["gad2_positive"] = scores["gad2_score"] >= 3
    except (ValueError, TypeError):
        pass

    # 3. Pain Interference: PEG-3 (q9, q10, q11, 0 to 10 scale)
    q_p1 = answers.get("peg_pain", answers.get("q9", 0))
    q_p2 = answers.get("peg_enjoyment", answers.get("q10", 0))
    q_p3 = answers.get("peg_activity", answers.get("q11", 0))
    try:
        val1 = min(10.0, max(0.0, float(q_p1 or 0)))
        val2 = min(10.0, max(0.0, float(q_p2 or 0)))
        val3 = min(10.0, max(0.0, float(q_p3 or 0)))
        avg_pain = (val1 + val2 + val3) / 3.0
        scores["peg3_average"] = round(avg_pain, 1)
        scores["peg3_significant_pain"] = scores["peg3_average"] >= 4.0
    except (ValueError, TypeError):
        pass

    # 4. Emergency Red Flags (q15 or red_flag_check)
    q_red = answers.get("red_flag_check", answers.get("q15", 0))
    if q_red and int(q_red) > 0:
        scores["red_flag_emergency"] = True

    # 5. Immunization status (q16, 0 = up-to-date, >0 = delayed/incomplete)
    q_imm = answers.get("immunization_status", answers.get("q16", 0))
    if q_imm and int(q_imm) > 0:
        scores["immunization_up_to_date"] = False

    # 6. Hypersensitivity / Drug Allergy screening (q4, 0=NKDA, 1=Penicillin, 2=Sulfa, 3=NSAID)
    allergies = []
    q_allergy = answers.get("allergy_status", answers.get("q4"))
    if q_allergy == 1 or answers.get("allergy_penicillin"):
        allergies.append("PENICILLIN")
    elif q_allergy == 2 or answers.get("allergy_sulfa"):
        allergies.append("SULFA")
    elif q_allergy == 3 or answers.get("allergy_nsaid"):
        allergies.append("NSAID")

    if answers.get("allergies"):
        raw_als = answers["allergies"]
        if isinstance(raw_als, list):
            allergies.extend([str(a).strip().upper() for a in raw_als if a])
        elif isinstance(raw_als, str):
            allergies.extend([a.strip().upper() for a in raw_als.split(",") if a.strip()])
    scores["reported_allergies"] = sorted(list(set(allergies)))

    # 7. Chronic comorbidity screening (q14, 1=HTN, 2=Diabetes, 3=Asthma, 4=Cardiac, 5=CKD)
    comorbidities = []
    q_comorb = answers.get("chronic_comorbidity", answers.get("q14"))
    if q_comorb == 5 or answers.get("comorbidity_ckd") or answers.get("ckd"):
        comorbidities.append("CKD")
    elif q_comorb == 3 or answers.get("comorbidity_asthma") or answers.get("asthma"):
        comorbidities.append("ASTHMA")
    elif q_comorb == 2 or answers.get("comorbidity_diabetes") or answers.get("diabetes"):
        comorbidities.append("DIABETES")
    elif q_comorb == 1 or answers.get("comorbidity_htn") or answers.get("hypertension"):
        comorbidities.append("HYPERTENSION")
    elif q_comorb == 4 or answers.get("comorbidity_cardiac") or answers.get("cardiac"):
        comorbidities.append("CARDIAC")

    if answers.get("comorbidities"):
        raw_com = answers["comorbidities"]
        if isinstance(raw_com, list):
            comorbidities.extend([str(c).strip().upper() for c in raw_com if c])
        elif isinstance(raw_com, str):
            comorbidities.extend([c.strip().upper() for c in raw_com.split(",") if c.strip()])
    scores["reported_comorbidities"] = sorted(list(set(comorbidities)))

    return scores


def predict_conditions_from_context(
    vitals: Dict[str, Any],
    chief_complaint: Optional[str],
    scores: Dict[str, Any],
    patient_age: int = 35
) -> List[Dict[str, str]]:
    """
    Deterministically maps vitals, complaint keywords, and questionnaire scores to ICD-10 conditions.
    Returns list of dicts: {'disease_code': ..., 'icd10_code': ..., 'disease_name': ..., 'rationale': ...}
    """
    conditions: List[Dict[str, str]] = []
    complaint = (chief_complaint or "").lower()

    sys_bp = vitals.get("systolic_bp")
    dia_bp = vitals.get("diastolic_bp")
    temp = vitals.get("temperature_f")
    spo2 = vitals.get("spo2_pct")
    resp = vitals.get("resp_rate")

    # Emergency Red Flag Condition
    if scores.get("red_flag_emergency"):
        conditions.append({
            "disease_code": "ACUTE_RED_FLAG_EMERGENCY",
            "icd10_code": "R68.89",
            "disease_name": "Acute Clinical Red Flag Presentation",
            "rationale": "Patient intake flagged immediate critical warning symptoms requiring bedside physician evaluation."
        })

    # 1. Essential Hypertension (I10) / Hypertensive Crisis (I16.9)
    if (sys_bp and sys_bp >= 180) or (dia_bp and dia_bp >= 120):
        conditions.append({
            "disease_code": "HYPERTENSION_CRISIS",
            "icd10_code": "I16.9",
            "disease_name": "Hypertensive Crisis with Acute Hemodynamic Risk",
            "rationale": f"Triage blood pressure {sys_bp}/{dia_bp} mmHg exceeds crisis threshold (>= 180/120 mmHg)."
        })
    elif (sys_bp and sys_bp >= 140) or (dia_bp and dia_bp >= 90):
        conditions.append({
            "disease_code": "HYPERTENSION_STAGE2",
            "icd10_code": "I10",
            "disease_name": "Essential (Primary) Hypertension",
            "rationale": f"Triage blood pressure {sys_bp}/{dia_bp} mmHg meets Stage 2 Hypertension criteria."
        })

    # 2. Acute Respiratory Tract Infection (J06.9) / Fever (R50.9)
    uri_keywords = ["cough", "fever", "cold", "flu", "sore throat", "throat", "chills", "runny nose"]
    has_uri_symptom = any(kw in complaint for kw in uri_keywords)
    has_fever = temp is not None and temp >= 99.5

    if has_uri_symptom or has_fever:
        if has_uri_symptom:
            conditions.append({
                "disease_code": "ACUTE_RESPIRATORY_URI",
                "icd10_code": "J06.9",
                "disease_name": "Acute Upper Respiratory Tract Infection",
                "rationale": f"Acute presentation with respiratory complaints ({chief_complaint}) and body temperature {temp or 98.6}°F."
            })
        if has_fever:
            conditions.append({
                "disease_code": "ACUTE_FEVER_PYREXIA",
                "icd10_code": "R50.9",
                "disease_name": "Fever / Pyrexia of Unknown Origin",
                "rationale": f"Measured body temperature {temp}°F exceeds 99.5°F pyrexia threshold."
            })

    # 3. Bronchial Asthma / Bronchospasm (J45.9)
    asthma_keywords = ["wheeze", "wheezing", "asthma", "breathless", "shortness of breath", "chest tightness"]
    if any(kw in complaint for kw in asthma_keywords) or (spo2 and 90 <= spo2 <= 94 and resp and resp >= 22):
        conditions.append({
            "disease_code": "BRONCHIAL_ASTHMA",
            "icd10_code": "J45.9",
            "disease_name": "Bronchial Asthma and Chronic Airway Obstruction",
            "rationale": "Symptomatic respiratory distress / bronchospasm triggers identified in intake review."
        })

    # 4. Gastroesophageal Reflux & Peptic Dyspepsia (K21.9)
    gerd_keywords = ["heartburn", "acidity", "gastritis", "stomach pain", "acid reflux", "indigestion", "nausea"]
    if any(kw in complaint for kw in gerd_keywords):
        conditions.append({
            "disease_code": "GERD_ACUTE_GASTRITIS",
            "icd10_code": "K21.9",
            "disease_name": "Gastroesophageal Reflux Disease and Dyspepsia",
            "rationale": "Patient reported upper gastrointestinal / acid peptic distress."
        })

    # 5. Acute Musculoskeletal Pain & Arthralgia (M79.1)
    pain_keywords = ["back pain", "joint pain", "knee", "shoulder", "muscle pain", "sprain", "fracture", "body ache"]
    if any(kw in complaint for kw in pain_keywords) or scores.get("peg3_significant_pain"):
        conditions.append({
            "disease_code": "ACUTE_MUSCULOSKELETAL_PAIN",
            "icd10_code": "M79.1",
            "disease_name": "Myalgia and Musculoskeletal Arthralgia",
            "rationale": f"Reported musculoskeletal pain (PEG-3 score: {scores.get('peg3_average', 0)}/10)."
        })

    # 6. Major Depressive Episode Screen (F32.9)
    if scores.get("phq2_positive"):
        conditions.append({
            "disease_code": "MAJOR_DEPRESSION_SCREEN",
            "icd10_code": "F32.9",
            "disease_name": "Major Depressive Episode Screen Positive",
            "rationale": f"PHQ-2 score {scores.get('phq2_score')} >= 3 indicates high clinical sensitivity for depressive disorder."
        })

    # 7. Generalized Anxiety Screen (F41.1)
    if scores.get("gad2_positive"):
        conditions.append({
            "disease_code": "ANXIETY_DISORDER",
            "icd10_code": "F41.1",
            "disease_name": "Generalized Anxiety Disorder Screen Positive",
            "rationale": f"GAD-2 score {scores.get('gad2_score')} >= 3 indicates significant anxiety symptoms."
        })

    # Default fallback if no specific acute condition triggered
    if not conditions:
        conditions.append({
            "disease_code": "ACUTE_RESPIRATORY_URI",
            "icd10_code": "J06.9",
            "disease_name": "General Clinical Evaluation",
            "rationale": "Routine general outpatient consultation."
        })

    return conditions


def filter_candidate_medications(
    candidate_meds: List[Dict[str, Any]],
    patient_allergies: List[str],
    comorbidities: List[str]
) -> List[Dict[str, Any]]:
    """
    Applies deterministic safety gates on candidate medicines from WHO EML:
    1. Allergy trigger class check (e.g. PENICILLIN, NSAID, SULFA, MACROLIDE)
    2. Organ risk flags (e.g. RENAL_EGFR_LESS_30, HEPATIC_FAILURE, PREGNANCY)
    """
    clean_allergies = [a.strip().upper() for a in patient_allergies if a and a.strip()]
    clean_comorb = [c.strip().upper() for c in comorbidities if c and c.strip()]

    evaluated_meds = []
    seen_drugs = set()

    for med in candidate_meds:
        drug_key = (med["inn_name"], med["strength"])
        if drug_key in seen_drugs:
            continue
        seen_drugs.add(drug_key)

        allergy_class = (med.get("allergy_trigger_class") or "").upper()
        organ_risks = (med.get("organ_risk_flags") or "").upper()
        med_copy = dict(med)

        # 1. Check Allergy Conflict
        has_allergy_conflict = False
        conflict_reason = None

        if allergy_class:
            for al in clean_allergies:
                if allergy_class in al or al in allergy_class:
                    has_allergy_conflict = True
                    conflict_reason = f"Blocked: Patient has known allergy to {allergy_class} class."
                    break

        # 2. Check Chronic Organ Contraindications
        has_organ_conflict = False
        if organ_risks and clean_comorb:
            risk_tokens = [tok.strip() for tok in organ_risks.split(",") if tok.strip()]
            for cm in clean_comorb:
                # Renal / Kidney / CKD checks
                if any(k in cm for k in ["CKD", "KIDNEY", "RENAL"]):
                    if any(r in ["CKD", "RENAL", "RENAL_ARTERY_STENOSIS", "ANURIA"] or "CKD" in r or "RENAL" in r for r in risk_tokens):
                        has_organ_conflict = True
                        conflict_reason = "Blocked: Contraindicated in chronic renal insufficiency / CKD."
                        break
                # Hepatic / Liver checks
                if any(h in cm for h in ["LIVER", "HEPATIC", "CIRRHOSIS"]):
                    if any("HEPATIC" in r or "LIVER" in r for r in risk_tokens):
                        has_organ_conflict = True
                        conflict_reason = "Blocked: Contraindicated in active hepatic impairment."
                        break
                # Peptic Ulcer checks
                if any(u in cm for u in ["ULCER", "PEPTIC", "GERD"]):
                    if any("ULCER" in r for r in risk_tokens):
                        has_organ_conflict = True
                        conflict_reason = "Blocked: Contraindicated in active peptic ulcer disease."
                        break
                # Asthma / Bronchospasm checks
                if "ASTHMA" in cm:
                    if any("ASTHMA" in r or "BRADYCARDIA" in r for r in risk_tokens):
                        has_organ_conflict = True
                        conflict_reason = "Blocked: Contraindicated in bronchial asthma."
                        break
                # Direct match
                if any(cm == r or cm in r or r in cm for r in risk_tokens):
                    has_organ_conflict = True
                    conflict_reason = f"Blocked: Contraindicated in {cm}."
                    break

        if has_allergy_conflict or has_organ_conflict:
            med_copy["safety_status"] = "CONTRAINDICATED"
            med_copy["safety_notes"] = conflict_reason
            med_copy["is_recommended"] = False
        else:
            med_copy["safety_status"] = "CLEAR"
            med_copy["safety_notes"] = "Safe for prescription based on recorded clinical profile."
            med_copy["is_recommended"] = True

        evaluated_meds.append(med_copy)

    # Sort so recommended First-Line drugs appear first
    def sort_key(x):
        line_order = {"FIRST_LINE": 0, "SECOND_LINE": 1, "SYMPTOMATIC": 2, "ADJUNCT": 3}.get(x.get("line_of_treatment"), 4)
        rec_order = 0 if x.get("is_recommended") else 1
        return (rec_order, line_order)

    evaluated_meds.sort(key=sort_key)
    return evaluated_meds


def generate_clinical_insights(
    vitals: Dict[str, Any],
    scores: Dict[str, Any],
    predicted_conditions: List[Dict[str, str]],
    has_allergy_conflicts: bool = False
) -> List[Dict[str, Any]]:
    """
    Generates structured deterministic insights to sync into MySQL deterministic_insights table.
    """
    insights = []

    # 1. Emergency Red Flag
    if scores.get("red_flag_emergency"):
        insights.append({
            "rule_code": "RULE_RED_FLAG_EMERGENCY",
            "severity_level": "CRITICAL",
            "category": "VITALS",
            "title": "Immediate Red-Flag Triage Warning",
            "description": "Patient intake reported acute critical warning symptoms (chest pain, dyspnea, or neurological deficit).",
            "recommendation": "Perform immediate bedside physician assessment, check continuous vitals, and prepare emergency ECG/resuscitation."
        })

    # 2. Blood Pressure Insights
    sys_bp = vitals.get("systolic_bp")
    dia_bp = vitals.get("diastolic_bp")
    if sys_bp and dia_bp:
        if sys_bp >= 180 or dia_bp >= 120:
            insights.append({
                "rule_code": "RULE_HTN_CRISIS",
                "severity_level": "CRITICAL",
                "category": "VITALS",
                "title": "Hypertensive Crisis Alert",
                "description": f"Blood pressure {sys_bp}/{dia_bp} mmHg exceeds crisis threshold (>= 180/120 mmHg).",
                "recommendation": "Initiate IV antihypertensive protocol. Screen for acute target-organ damage."
            })
        elif sys_bp >= 140 or dia_bp >= 90:
            insights.append({
                "rule_code": "RULE_HTN_STAGE2",
                "severity_level": "WARNING",
                "category": "VITALS",
                "title": "Stage 2 Hypertension Flag",
                "description": f"Blood pressure {sys_bp}/{dia_bp} mmHg meets Stage 2 Hypertension criteria.",
                "recommendation": "Initiate dual-agent guideline antihypertensive therapy (e.g. Amlodipine + Telmisartan). Order basic metabolic panel."
            })

    # 3. Depression Screen (PHQ-2)
    if scores.get("phq2_positive"):
        insights.append({
            "rule_code": "RULE_PHQ2_DEPRESSION",
            "severity_level": "WARNING",
            "category": "GUIDELINE",
            "title": "Positive Depression Screen (PHQ-2 >= 3)",
            "description": f"Patient scored {scores.get('phq2_score')}/6 on intake depression screen (anhedonia/depressed mood).",
            "recommendation": "Administer full PHQ-9 diagnostic questionnaire. Evaluate for clinical depression and screen for active suicidal ideation."
        })

    # 4. Anxiety Screen (GAD-2)
    if scores.get("gad2_positive"):
        insights.append({
            "rule_code": "RULE_GAD2_ANXIETY",
            "severity_level": "INFO",
            "category": "GUIDELINE",
            "title": "Positive Anxiety Screen (GAD-2 >= 3)",
            "description": f"Patient scored {scores.get('gad2_score')}/6 on intake generalized anxiety screen.",
            "recommendation": "Consider formal GAD-7 evaluation. Assess for panic triggers, somatic anxiety, or concurrent insomnia."
        })

    # 5. Severe Pain (PEG-3)
    if scores.get("peg3_significant_pain"):
        insights.append({
            "rule_code": "RULE_PEG3_SIGNIFICANT_PAIN",
            "severity_level": "WARNING",
            "category": "VITALS",
            "title": "Significant Pain Impact (PEG-3 >= 4.0)",
            "description": f"Patient reports high pain intensity & life interference (average score {scores.get('peg3_average')}/10).",
            "recommendation": "Prescribe multi-modal analgesia (Paracetamol + safe NSAID/weak opioid). Assess physical functional limitations."
        })

    # 6. Allergy Conflict Warning
    if has_allergy_conflicts:
        insights.append({
            "rule_code": "RULE_DRUG_ALLERGY_BLOCKED",
            "severity_level": "WARNING",
            "category": "CONTRAINDICATION",
            "title": "Allergy-Contraindicated Medication Filtered",
            "description": "Standard first-line medication was automatically blocked due to recorded patient drug hypersensitivity.",
            "recommendation": "Review suggested alternative second-line or non-cross-reactive antimicrobial/analgesic agent."
        })

    return insights
