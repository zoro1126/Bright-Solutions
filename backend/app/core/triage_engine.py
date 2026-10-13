"""
Deterministic Clinical Triage & Queue Automation Engine
Lightweight (<100 KB RAM), zero-ML-dependency clinical rule engine for:
1. NHS Royal College of Physicians NEWS2 (National Early Warning Score 2) calculation
2. Deterministic Triage Priority classification (EMERGENCY / URGENT / ROUTINE)
3. Symptom-to-Specialty Keyword Router for automated doctor assignment
4. Dynamic Queue Wait-Time Estimation
"""

from typing import Optional, Dict, Any, Tuple

# Pure deterministic keyword map for symptom-to-specialty routing
SPECIALTY_KEYWORD_RULES: Dict[str, list[str]] = {
    "Cardiology": [
        "chest pain", "angina", "palpitation", "heart", "cardiac", "shortness of breath", 
        "arrhythmia", "syncope", "high bp", "hypertension crisis"
    ],
    "Oncology": [
        "tumor", "cancer", "chemotherapy", "radiation", "biopsy", "mass", "lymph",
        "malignancy", "carcinoma", "unintentional weight loss", "night sweats"
    ],
    "General & Laparoscopic Surgery": [
        "hernia", "appendicitis", "gallbladder", "abdominal pain", "abscess", "wound",
        "suture", "trauma", "swelling", "post-op"
    ],
    "Orthopedics": [
        "fracture", "joint", "knee", "bone", "spine", "arthritis", "sprain", "dislocation",
        "back pain", "scoliosis", "ligament"
    ],
    "Dermatology": [
        "rash", "itching", "skin", "eczema", "psoriasis", "lesion", "acne", "allergy"
    ],
    "General & Internal Medicine": [
        "fever", "cough", "cold", "flu", "weakness", "fatigue", "vomiting", "diarrhea",
        "headache", "dizziness", "diabetes", "routine", "checkup", "general"
    ]
}


def calculate_news2_score(
    resp_rate: Optional[int] = None,
    spo2_pct: Optional[int] = None,
    systolic_bp: Optional[int] = None,
    pulse_rate: Optional[int] = None,
    temperature_f: Optional[float] = None
) -> Tuple[int, Dict[str, int]]:
    """
    Computes deterministic NHS NEWS2 (National Early Warning Score 2).
    Score range: 0 to 20.
    Returns: (total_score, breakdown_dict)
    """
    breakdown: Dict[str, int] = {}
    score = 0

    # 1. Respiration Rate (breaths/min)
    if resp_rate is not None:
        if resp_rate <= 8:
            r_pts = 3
        elif 9 <= resp_rate <= 11:
            r_pts = 1
        elif 12 <= resp_rate <= 20:
            r_pts = 0
        elif 21 <= resp_rate <= 24:
            r_pts = 2
        else:  # >= 25
            r_pts = 3
        breakdown["respiration"] = r_pts
        score += r_pts

    # 2. Oxygen Saturation SpO2 (%) - Scale 1 (standard)
    if spo2_pct is not None:
        if spo2_pct <= 91:
            o_pts = 3
        elif 92 <= spo2_pct <= 93:
            o_pts = 2
        elif 94 <= spo2_pct <= 95:
            o_pts = 1
        else:  # >= 96
            o_pts = 0
        breakdown["oxygen_saturation"] = o_pts
        score += o_pts

    # 3. Systolic Blood Pressure (mmHg)
    if systolic_bp is not None:
        if systolic_bp <= 90:
            bp_pts = 3
        elif 91 <= systolic_bp <= 100:
            bp_pts = 2
        elif 101 <= systolic_bp <= 110:
            bp_pts = 1
        elif 111 <= systolic_bp <= 219:
            bp_pts = 0
        else:  # >= 220
            bp_pts = 3
        breakdown["systolic_bp"] = bp_pts
        score += bp_pts

    # 4. Pulse / Heart Rate (bpm)
    if pulse_rate is not None:
        if pulse_rate <= 40:
            p_pts = 3
        elif 41 <= pulse_rate <= 50:
            p_pts = 1
        elif 51 <= pulse_rate <= 90:
            p_pts = 0
        elif 91 <= pulse_rate <= 110:
            p_pts = 1
        elif 111 <= pulse_rate <= 130:
            p_pts = 2
        else:  # >= 131
            p_pts = 3
        breakdown["pulse_rate"] = p_pts
        score += p_pts

    # 5. Body Temperature (°F)
    if temperature_f is not None:
        if temperature_f <= 95.0:  # <= 35.0 C
            t_pts = 3
        elif 95.1 <= temperature_f <= 96.8:  # 35.1 - 36.0 C
            t_pts = 1
        elif 96.9 <= temperature_f <= 100.4:  # 36.1 - 38.0 C
            t_pts = 0
        elif 100.5 <= temperature_f <= 102.2:  # 38.1 - 39.0 C
            t_pts = 1
        else:  # >= 102.3 F (> 39.0 C)
            t_pts = 2
        breakdown["temperature"] = t_pts
        score += t_pts

    return score, breakdown


def determine_triage_priority(
    news2_score: int,
    chief_complaint: Optional[str] = None,
    systolic_bp: Optional[int] = None,
    spo2_pct: Optional[int] = None
) -> Tuple[str, str]:
    """
    Determines triage category and clinical rationale.
    Returns: (category, rationale)
    Categories:
      - EMERGENCY (Red): immediate doctor review needed
      - URGENT (Yellow): priority queue
      - ROUTINE (Green): standard queue sequence
    """
    complaint_lower = (chief_complaint or "").lower()

    # Red-flag clinical triggers
    critical_triggers = [
        "cardiac arrest", "unconscious", "anaphylaxis", "severe chest pain",
        "hemorrhage", "stroke", "seizure", "unresponsive"
    ]
    if any(trigger in complaint_lower for trigger in critical_triggers):
        return "EMERGENCY", "Red-flag critical symptom detected in chief complaint"

    if (spo2_pct is not None and spo2_pct < 90) or (systolic_bp is not None and (systolic_bp < 80 or systolic_bp >= 200)):
        return "EMERGENCY", "Critical hemodynamic instability (SpO2 < 90% or Systolic BP outside safe bounds)"

    if news2_score >= 7:
        return "EMERGENCY", f"High clinical risk (NEWS2 Score: {news2_score} >= 7)"
    elif news2_score >= 5:
        return "URGENT", f"Medium clinical risk (NEWS2 Score: {news2_score})"
    
    # Check for urgent symptoms
    urgent_triggers = ["severe pain", "high fever", "bleeding", "asthma attack", "fracture", "drenching sweats"]
    if any(trigger in complaint_lower for trigger in urgent_triggers):
        return "URGENT", "Acute symptomatic distress flagged in triage assessment"

    return "ROUTINE", f"Standard outpatient clinical presentation (NEWS2 Score: {news2_score})"


def match_complaint_to_specialty(chief_complaint: Optional[str]) -> str:
    """
    Lightweight deterministic rule-matcher that maps patient complaints to specialties.
    Defaults to 'General & Internal Medicine'.
    """
    if not chief_complaint:
        return "General & Internal Medicine"

    text = chief_complaint.lower()
    for specialty, keywords in SPECIALTY_KEYWORD_RULES.items():
        if any(kw in text for kw in keywords):
            return specialty

    return "General & Internal Medicine"


def estimate_wait_time_minutes(queue_position: int, triage_priority: str, avg_consult_mins: int = 12) -> int:
    """
    Estimates dynamic queue wait time in minutes based on position and triage urgency.
    """
    if triage_priority == "EMERGENCY":
        return 0
    if queue_position <= 1:
        return 0
    
    base_wait = (queue_position - 1) * avg_consult_mins
    if triage_priority == "URGENT":
        # Urgent patients cut nominal wait time in half
        return max(3, base_wait // 2)
    return base_wait
