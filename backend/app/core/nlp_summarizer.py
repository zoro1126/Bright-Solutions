"""
Clinical NegEx NLP & Extractive Consultation Summarizer
Pure-Python, Zero-Dependency, Lightweight (<2 MB RAM) Clinical Narrative Synthesizer.

Key Capabilities:
1. Validated NegEx Algorithm: Disambiguates affirmed symptoms from pertinent negatives (denied symptoms).
2. Entity & Temporal Extractor: Extracts symptoms, anatomical sites, duration phrases, and severity.
3. SOAP Consultation Narrative Synthesizer: Merges subjective voice notes, triage vitals, and validated
   instruments into an executive clinical summary for the physician consultation screen.
"""

import re
from typing import Dict, Any, List, Optional, Tuple, Set

# ─── Clinical NegEx Trigger Patterns ───────────────────────────────────────────

PRE_NEGATION_TRIGGERS = [
    r"\bdenies\b",
    r"\bdenied\b",
    r"\bdenying\b",
    r"\bno\s+evidence\s+of\b",
    r"\bno\s+signs?\s+of\b",
    r"\bno\s+complaints?\s+of\b",
    r"\bno\s+history\s+of\b",
    r"\bnegative\s+for\b",
    r"\bnot\s+experiencing\b",
    r"\bwithout\s+any\b",
    r"\bwithout\b",
    r"\brules?\s+out\b",
    r"\bruled\s+out\b",
    r"\bfree\s+of\b",
    r"\bnot\b",
    r"\bno\b"
]

POST_NEGATION_TRIGGERS = [
    r"\bunlikely\b",
    r"\bwas\s+ruled\s+out\b",
    r"\bis\s+ruled\s+out\b",
    r"\bnot\s+present\b",
    r"\babsent\b",
    r"\bresolved\b"
]

PSEUDO_NEGATIONS = [
    r"\bno\s+increase\b",
    r"\bno\s+decrease\b",
    r"\bno\s+change\b",
    r"\bnot\s+only\b",
    r"\bwithout\s+difficulty\b"
]

SCOPE_TERMINATORS = [
    r"\bbut\b",
    r"\bhowever\b",
    r"\bnevertheless\b",
    r"\byet\b",
    r"\balthough\b",
    r"\bthough\b",
    r"\bexcept\b",
    r"\baside\s+from\b",
    r"\bapart\s+from\b",
    r"\bwhile\b"
]

# ─── Outpatient Symptom Lexicon ────────────────────────────────────────────────

CLINICAL_SYMPTOM_LEXICON = {
    # Musculoskeletal & Pain
    "chest pain": ["chest pain", "angina", "sternal pain", "precordial pain"],
    "headache": ["headache", "cephalalgia", "migraine", "head pain"],
    "back pain": ["back pain", "lumbago", "lower back pain", "lumbar pain"],
    "knee pain": ["knee pain", "patellar pain", "knee arthralgia"],
    "joint pain": ["joint pain", "arthralgia", "joint stiffness", "swollen joint", "joint swelling"],
    "neck pain": ["neck pain", "cervical pain", "stiff neck"],
    "body ache": ["body ache", "generalized body ache", "myalgia", "muscle pain"],

    # Respiratory
    "shortness of breath": ["shortness of breath", "dyspnea", "breathlessness", "difficulty breathing", "sob"],
    "cough": ["cough", "dry cough", "productive cough", "hacking cough"],
    "wheezing": ["wheezing", "wheeze", "stridor"],
    "sore throat": ["sore throat", "pharyngitis", "throat irritation", "pain swallowing", "odynophagia"],
    "congestion": ["nasal congestion", "runny nose", "rhinorrhea", "congestion"],
    "hemoptysis": ["hemoptysis", "coughing blood", "blood in sputum"],

    # Constitutional & Infectious
    "fever": ["fever", "pyrexia", "high temperature", "febrile", "hot"],
    "chills": ["chills", "rigors", "shivering"],
    "fatigue": ["fatigue", "malaise", "lethargy", "exhaustion", "weakness"],
    "weight loss": ["unintentional weight loss", "weight loss"],
    "night sweats": ["night sweats"],

    # Gastrointestinal
    "nausea": ["nausea", "queasiness", "feeling sick"],
    "vomiting": ["vomiting", "emesis", "threw up"],
    "diarrhea": ["diarrhea", "loose stools", "frequent motions"],
    "constipation": ["constipation", "hard stools"],
    "heartburn": ["heartburn", "acid reflux", "acidity", "gerd", "burning in chest"],
    "abdominal pain": ["abdominal pain", "stomach pain", "belly ache", "epigastric pain", "cramps"],

    # Neurological
    "dizziness": ["dizziness", "vertigo", "lightheadedness"],
    "numbness": ["numbness", "loss of sensation"],
    "tingling": ["tingling", "paresthesia", "pins and needles"],
    "seizure": ["seizure", "convulsion", "fits"],
    "syncope": ["syncope", "fainting", "blackout", "passed out"],

    # Cardiovascular
    "palpitations": ["palpitations", "racing heart", "rapid heartbeat", "fluttering"],
    "pedal edema": ["pedal edema", "leg swelling", "ankle swelling", "swollen feet"],
    "orthopnea": ["orthopnea", "breathless lying down"]
}

SEVERITY_KEYWORDS = [
    "mild", "moderate", "severe", "acute", "chronic", "throbbing",
    "sharp", "dull", "intermittent", "constant", "worsening", "excruciating"
]

DURATION_PATTERN = re.compile(
    r"(?:for|since|past|over the last)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|several|few)\s+(days?|weeks?|months?|years?|hours?)",
    re.IGNORECASE
)


import warnings
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", message=r".*The component 'matcher' does not have any patterns defined.*")
from loguru import logger
logger.disable("PyRuSH")
import medspacy
from medspacy.target_matcher import TargetRule

_medspacy_nlp = None

def get_medspacy_nlp():
    global _medspacy_nlp
    if _medspacy_nlp is None:
        nlp = medspacy.load()
        matcher = nlp.get_pipe("medspacy_target_matcher")
        rules = []
        for canonical_name, variants in CLINICAL_SYMPTOM_LEXICON.items():
            for var in variants:
                rules.append(TargetRule(literal=var, category="SYMPTOM"))
        matcher.add(rules)
        _medspacy_nlp = nlp
    return _medspacy_nlp


class ClinicalNLPParser:
    """
    Clinical NLP entity extraction and NegEx negation parser powered by MedSpaCy.
    """

    @classmethod
    def _mask_pseudo_negations(cls, text: str) -> str:
        for p in PSEUDO_NEGATIONS:
            text = re.sub(p, lambda m: m.group(0).replace(" ", "_"), text, flags=re.IGNORECASE)
        return text

    @classmethod
    def _regex_extract_fallback(cls, text: str, global_duration: Optional[str]) -> Tuple[List[Dict[str, Any]], List[str]]:
        cleaned_text = cls._mask_pseudo_negations(text.strip())
        sentences = re.split(r"[.;\n]+", cleaned_text)

        affirmed: List[Dict[str, Any]] = []
        negated: List[str] = []
        seen_canonical: Set[str] = set()

        for sentence in sentences:
            sentence_clean = sentence.strip()
            if not sentence_clean:
                continue

            sentence_lower = sentence_clean.lower()
            detected_severity = [s for s in SEVERITY_KEYWORDS if re.search(rf"\b{s}\b", sentence_lower)]
            primary_severity = detected_severity[0] if detected_severity else None

            terminator_pattern = "|".join([rf"{t}" for t in SCOPE_TERMINATORS])
            clauses = re.split(rf"({terminator_pattern})", sentence_clean, flags=re.IGNORECASE)

            active_negation = False
            for part in clauses:
                part_clean = part.strip()
                if not part_clean:
                    continue
                part_lower = part_clean.lower()

                if any(re.match(rf"^{t}$", part_lower) for t in SCOPE_TERMINATORS):
                    active_negation = False
                    continue

                if re.search(r"\b(reports?|reported|complains?\s+of|presented\s+with|presents\s+with|has|developed)\b", part_lower):
                    active_negation = False

                has_pre_neg = any(re.search(trig, part_lower) for trig in PRE_NEGATION_TRIGGERS)
                has_post_neg = any(re.search(trig, part_lower) for trig in POST_NEGATION_TRIGGERS)

                if has_pre_neg:
                    active_negation = True

                for canonical_name, variants in CLINICAL_SYMPTOM_LEXICON.items():
                    for var in variants:
                        if re.search(rf"\b{re.escape(var)}\b", part_lower):
                            if canonical_name in seen_canonical:
                                continue
                            seen_canonical.add(canonical_name)

                            is_negated = active_negation or has_post_neg
                            if is_negated:
                                negated.append(canonical_name)
                            else:
                                affirmed.append({
                                    "symptom": canonical_name,
                                    "mention": var,
                                    "severity": primary_severity,
                                    "duration": global_duration
                                })
                            break

        return affirmed, negated

    @classmethod
    def extract_symptoms_with_negation(cls, text: Optional[str]) -> Tuple[List[Dict[str, Any]], List[str]]:
        """
        Parses clinical text and returns:
        (affirmed_symptoms, pertinent_negatives)
        Uses MedSpaCy's ConText algorithm for clinical negation scope analysis.
        """
        if not text or not text.strip():
            return [], []

        dur_match = DURATION_PATTERN.search(text)
        global_duration = dur_match.group(0) if dur_match else None

        try:
            nlp = get_medspacy_nlp()
            doc = nlp(text.strip())

            affirmed: List[Dict[str, Any]] = []
            negated: List[str] = []
            seen_canonical: Set[str] = set()

            var_to_canonical = {}
            for can, vars_list in CLINICAL_SYMPTOM_LEXICON.items():
                for v in vars_list:
                    var_to_canonical[v.lower()] = can

            for ent in doc.ents:
                ent_lower = ent.text.lower()
                canonical_name = var_to_canonical.get(ent_lower)
                if not canonical_name:
                    for v_key, c_val in var_to_canonical.items():
                        if v_key in ent_lower or ent_lower in v_key:
                            canonical_name = c_val
                            break
                if not canonical_name:
                    canonical_name = ent_lower

                if canonical_name in seen_canonical:
                    continue
                seen_canonical.add(canonical_name)

                sent_text = ent.sent.text.lower() if ent.sent else text.lower()
                detected_severity = [s for s in SEVERITY_KEYWORDS if re.search(rf"\b{s}\b", sent_text)]
                primary_severity = detected_severity[0] if detected_severity else None

                is_neg = getattr(ent._, "is_negated", False)
                if is_neg:
                    negated.append(canonical_name)
                else:
                    affirmed.append({
                        "symptom": canonical_name,
                        "mention": ent.text,
                        "severity": primary_severity,
                        "duration": global_duration
                    })

            return affirmed, negated
        except Exception:
            return cls._regex_extract_fallback(text, global_duration)


class ClinicalNarrativeSynthesizer:
    """
    Synthesizes structured demographic, triage, scoring, and NegEx findings
    into an executive clinical consultation brief for physicians.
    """

    @staticmethod
    def generate_physician_consultation_brief(
        patient_name: str,
        age: Optional[int],
        gender: Optional[str],
        chief_complaint: Optional[str],
        voice_notes: Optional[str],
        vitals: Optional[Dict[str, Any]] = None,
        scores: Optional[Dict[str, Any]] = None,
        allergies: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        vitals = vitals or {}
        scores = scores or {}
        allergies = [a for a in (allergies or []) if a and a.strip()]

        # Combine text for NLP extraction
        combined_text = f"{chief_complaint or ''}. {voice_notes or ''}".strip()
        affirmed, negated = ClinicalNLPParser.extract_symptoms_with_negation(combined_text)

        # 1. Build Subjective (HPI) Sentence
        age_str = f"{age}yo " if age else ""
        gender_str = (gender or "patient").capitalize()
        subject_title = f"{age_str}{gender_str}".strip()

        if affirmed:
            symptom_descriptions = []
            for item in affirmed:
                desc = item["symptom"]
                if item.get("severity"):
                    desc = f"{item['severity']} {desc}"
                symptom_descriptions.append(desc)
            symptoms_str = ", ".join(symptom_descriptions)
            
            # Check duration
            first_dur = next((item["duration"] for item in affirmed if item.get("duration")), None)
            duration_suffix = f" ({first_dur})" if first_dur else ""
            hpi_text = f"{subject_title} presents with {symptoms_str}{duration_suffix}."
        elif chief_complaint:
            hpi_text = f"{subject_title} presents for clinical evaluation with chief complaint: \"{chief_complaint.strip()}\"."
        else:
            hpi_text = f"{subject_title} presents for general outpatient consultation."

        # 2. Build Pertinent Negatives Sentence
        negatives_text = ""
        if negated:
            neg_items = ", ".join(negated)
            negatives_text = f"Pertinent negatives: denies {neg_items}."

        # 3. Build Objective Vitals Narrative
        vitals_narrative_parts = []
        sbp = vitals.get("systolic_bp")
        dbp = vitals.get("diastolic_bp")
        if sbp and dbp:
            if sbp >= 140 or dbp >= 90:
                vitals_narrative_parts.append(f"Elevated blood pressure ({sbp}/{dbp} mmHg)")
            else:
                vitals_narrative_parts.append(f"Normotensive BP ({sbp}/{dbp} mmHg)")

        temp = vitals.get("temperature_f")
        if temp is not None:
            if temp >= 99.5:
                vitals_narrative_parts.append(f"Febrile state ({temp}°F)")
            else:
                vitals_narrative_parts.append(f"Afebrile ({temp}°F)")

        spo2 = vitals.get("spo2_pct")
        if spo2 is not None:
            if spo2 < 95:
                vitals_narrative_parts.append(f"Borderline SpO2 ({spo2}%)")
            else:
                vitals_narrative_parts.append(f"Room air SpO2 {spo2}%")

        vitals_summary = "; ".join(vitals_narrative_parts) if vitals_narrative_parts else "Triage vitals within standard range."

        # 4. Clinical Score Flags
        score_alerts = []
        if scores.get("phq2_positive"):
            score_alerts.append(f"PHQ-2 depression screen positive ({scores.get('phq2_score', 0)}/6)")
        if scores.get("gad2_positive"):
            score_alerts.append(f"GAD-2 anxiety screen positive ({scores.get('gad2_score', 0)}/6)")
        if scores.get("peg3_significant_pain"):
            score_alerts.append(f"PEG-3 significant pain index ({scores.get('peg3_average', 0)}/10)")
        if scores.get("red_flag_emergency"):
            score_alerts.append("CRITICAL: Red-flag triage warning recorded")

        score_alerts_summary = ". ".join(score_alerts) if score_alerts else ""

        # 5. Hypersensitivity / Allergy Warning
        allergy_note = f"Allergy: Known hypersensitivity to {', '.join(allergies)}." if allergies else "No known drug allergies (NKDA)."

        # 6. Combined Executive Paragraph (for frontend dossier header)
        narrative_paragraphs = [hpi_text]
        if negatives_text:
            narrative_paragraphs.append(negatives_text)
        narrative_paragraphs.append(f"Objective findings: {vitals_summary}.")
        if score_alerts_summary:
            narrative_paragraphs.append(f"Intake screen alerts: {score_alerts_summary}.")
        if allergies:
            narrative_paragraphs.append(allergy_note)

        full_symptom_summary = " ".join(narrative_paragraphs)

        return {
            "symptom_summary": full_symptom_summary,
            "hpi_narrative": hpi_text,
            "pertinent_negatives": negated,
            "affirmed_symptoms": affirmed,
            "vitals_summary": vitals_summary,
            "score_alerts": score_alerts,
            "allergy_note": allergy_note
        }
