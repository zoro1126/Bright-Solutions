"""
Deterministic Drug-Drug Interaction (DDI) & Prescription Safety Engine
Zero-ML, High-Performance (<1 MB RAM) Clinical Pharmacological Safety Guard.

Core Capabilities:
1. Pairwise Drug-Drug Interaction (DDI) Evaluation (WHO / Lexicomp / BNF Clinical Rules)
2. Duplicate Therapeutic Class Detection (e.g. dual NSAIDs, dual ARBs)
3. Dosage Anomaly Bounds Checking (e.g. Paracetamol > 4000mg/day ceiling)
"""

import re
from typing import Dict, Any, List, Optional, Set, Tuple

# ─── Therapeutic Drug Class Mapping ───────────────────────────────────────────

DRUG_CLASS_MAPPING = {
    # Antihypertensives
    "ENALAPRIL": "ACE_INHIBITOR",
    "LISINOPRIL": "ACE_INHIBITOR",
    "RAMIPRIL": "ACE_INHIBITOR",
    "TELMISARTAN": "ARB",
    "LOSARTAN": "ARB",
    "VALSARTAN": "ARB",
    "AMLODIPINE": "CCB_DHP",
    "NIFEDIPINE": "CCB_DHP",
    "VERAPAMIL": "CCB_NON_DHP",
    "DILTIAZEM": "CCB_NON_DHP",
    "ATENOLOL": "BETA_BLOCKER",
    "BISOPROLOL": "BETA_BLOCKER",
    "METOPROLOL": "BETA_BLOCKER",
    "HYDROCHLOROTHIAZIDE": "THIAZIDE_DIURETIC",
    "CHLORTHALIDONE": "THIAZIDE_DIURETIC",
    "SPIRONOLACTONE": "K_SPARING_DIURETIC",
    "FUROSEMIDE": "LOOP_DIURETIC",

    # Analgesics & Anti-inflammatory
    "PARACETAMOL": "ACETAMINOPHEN",
    "ACETAMINOPHEN": "ACETAMINOPHEN",
    "IBUPROFEN": "NSAID",
    "DICLOFENAC": "NSAID",
    "NAPROXEN": "NSAID",
    "CELECOXIB": "NSAID",
    "ASPIRIN": "ANTIPLATELET_NSAID",
    "TRAMADOL": "OPIOID",

    # Antimicrobials
    "AMOXICILLIN": "PENICILLIN",
    "AMPICILLIN": "PENICILLIN",
    "AZITHROMYCIN": "MACROLIDE",
    "ERYTHROMYCIN": "MACROLIDE",
    "CLARITHROMYCIN": "MACROLIDE",
    "CIPROFLOXACIN": "FLUOROQUINOLONE",
    "LEVOFLOXACIN": "FLUOROQUINOLONE",
    "DOXYCYCLINE": "TETRACYCLINE",
    "METRONIDAZOLE": "NITROIMIDAZOLE",

    # Antidiabetic
    "METFORMIN": "BIGUANIDE",
    "GLIMEPIRIDE": "SULFONYLUREA",
    "GLICLAZIDE": "SULFONYLUREA",

    # Statins
    "ATORVASTATIN": "STATIN",
    "ROSUVASTATIN": "STATIN",
    "SIMVASTATIN": "STATIN",

    # GI & Antacids
    "OMEPRAZOLE": "PPI",
    "PANTOPRAZOLE": "PPI",
    "RABEPRAZOLE": "PPI",
    "RANITIDINE": "H2_BLOCKER",

    # Psychotropics
    "FLUOXETINE": "SSRI",
    "SERTRALINE": "SSRI",
    "ESCITALOPRAM": "SSRI"
}

# ─── Pairwise Clinical Interaction Rules ───────────────────────────────────────

PAIRWISE_INTERACTIONS = [
    # 1. Dual Renin-Angiotensin Blockade
    {
        "classes": ("ACE_INHIBITOR", "ARB"),
        "severity": "CONTRAINDICATED",
        "title": "Dual Renin-Angiotensin System Blockade",
        "description": "Concurrent use of ACE inhibitor and ARB is contraindicated due to increased risk of severe hypotension, hyperkalemia, and acute renal impairment without additive benefit.",
        "recommendation": "Prescribe either an ACE inhibitor OR an ARB; do not administer concurrently."
    },
    # 2. NSAID + ACEi / ARB
    {
        "classes": ("NSAID", "ACE_INHIBITOR"),
        "severity": "MAJOR",
        "title": "NSAID Blunting Antihypertensive & Renal Vasoconstriction",
        "description": "NSAIDs inhibit renal prostaglandins, reducing the antihypertensive effect of ACE inhibitors and drastically increasing the risk of acute kidney injury (triple whammy risk).",
        "recommendation": "Use Paracetamol as first-line analgesic. If NSAID is required, monitor renal function (Cr/eGFR) and blood pressure."
    },
    {
        "classes": ("NSAID", "ARB"),
        "severity": "MAJOR",
        "title": "NSAID Blunting Antihypertensive & Renal Vasoconstriction",
        "description": "NSAIDs inhibit renal prostaglandins, reducing the antihypertensive effect of ARBs and increasing acute kidney injury risk.",
        "recommendation": "Substitute NSAID with Paracetamol for analgesia. Limit NSAID duration to under 3–5 days if unavoidable."
    },
    # 3. NSAID + Antiplatelet / Aspirin
    {
        "classes": ("NSAID", "ANTIPLATELET_NSAID"),
        "severity": "MAJOR",
        "title": "Synergistic Gastrointestinal Bleeding Risk",
        "description": "Combining non-aspirin NSAIDs with low-dose Aspirin synergistically multiplies gastric mucosal injury and upper gastrointestinal bleeding risk.",
        "recommendation": "Avoid concurrent non-selective NSAIDs; co-prescribe a gastroprotective PPI (e.g. Pantoprazole) if combination is clinically essential."
    },
    # 4. Beta-Blocker + Non-Dihydropyridine CCB
    {
        "classes": ("BETA_BLOCKER", "CCB_NON_DHP"),
        "severity": "CONTRAINDICATED",
        "title": "Additive Cardiodepression & AV Nodal Block",
        "description": "Combining Beta-blockers with non-dihydropyridine CCBs (Verapamil, Diltiazem) causes severe additive negative inotropic and dromotropic effects, risking severe bradycardia, complete heart block, and asystole.",
        "recommendation": "Do not co-prescribe. Substitute non-DHP CCB with a dihydropyridine CCB (e.g. Amlodipine) if dual therapy is indicated."
    },
    # 5. Macrolide + Statin
    {
        "classes": ("MACROLIDE", "STATIN"),
        "severity": "MAJOR",
        "title": "CYP3A4 Inhibition & Statin Rhabdomyolysis Risk",
        "description": "Macrolide antibiotics (Erythromycin, Clarithromycin, Azithromycin) inhibit CYP3A4 metabolism of statins (Atorvastatin, Simvastatin), markedly elevating serum statin concentrations and increasing rhabdomyolysis / acute myopathy risk.",
        "recommendation": "Temporarily suspend statin therapy during the short antimicrobial course, or monitor for acute muscle pain/weakness and dark urine."
    },
    # 6. Potassium-Sparing Diuretic + ACEi / ARB
    {
        "classes": ("K_SPARING_DIURETIC", "ACE_INHIBITOR"),
        "severity": "MAJOR",
        "title": "Refractory Hyperkalemia Risk",
        "description": "Concomitant Spironolactone with ACE inhibitors can lead to life-threatening severe hyperkalemia, particularly in patients with baseline borderline renal dysfunction.",
        "recommendation": "Check baseline serum potassium and creatinine before initiating. Repeat electrolyte panel at 1 week."
    },
    {
        "classes": ("K_SPARING_DIURETIC", "ARB"),
        "severity": "MAJOR",
        "title": "Refractory Hyperkalemia Risk",
        "description": "Concomitant Spironolactone with ARBs significantly elevates serum potassium, risking cardiac conduction abnormalities.",
        "recommendation": "Regularly monitor serum potassium. Instruct patient to avoid dietary potassium supplements."
    },
    # 7. SSRI + Tramadol
    {
        "classes": ("SSRI", "OPIOID"),
        "severity": "MAJOR",
        "title": "Serotonin Syndrome Warning",
        "description": "Tramadol inhibits serotonin reuptake and, when combined with SSRIs (Fluoxetine, Sertraline, Escitalopram), can trigger central Serotonin Toxicity / Syndrome (tremor, hyperreflexia, hyperthermia, confusion).",
        "recommendation": "Avoid Tramadol in patients on therapeutic SSRI regimen; prefer non-serotonergic analgesics."
    }
]

# ─── Max Daily Therapeutic Dose Ceilings ─────────────────────────────────────────

DAILY_DOSE_LIMITS = {
    "PARACETAMOL": 4000.0,
    "ACETAMINOPHEN": 4000.0,
    "IBUPROFEN": 2400.0,
    "DICLOFENAC": 150.0,
    "AMLODIPINE": 10.0,
    "TELMISARTAN": 80.0,
    "LOSARTAN": 100.0,
    "ENALAPRIL": 40.0,
    "ATENOLOL": 100.0,
    "BISOPROLOL": 10.0,
    "METFORMIN": 2550.0,
    "AZITHROMYCIN": 500.0,
    "OMEPRAZOLE": 40.0,
    "PANTOPRAZOLE": 80.0
}


class DDIEngine:
    """
    Deterministic Drug-Drug Interaction, Therapeutic Duplication, and Dosage Anomaly Engine.
    """

    @classmethod
    def resolve_drug_classes(cls, drug_name: str) -> List[str]:
        name_clean = drug_name.strip().upper()
        classes = []
        for molecule, dclass in DRUG_CLASS_MAPPING.items():
            if molecule in name_clean:
                if dclass not in classes:
                    classes.append(dclass)
        return classes

    @classmethod
    def resolve_drug_class(cls, drug_name: str) -> Optional[str]:
        classes = cls.resolve_drug_classes(drug_name)
        return classes[0] if classes else None

    @classmethod
    def parse_strength_mg(cls, strength_str: Optional[str]) -> Optional[float]:
        if not strength_str:
            return None
        match = re.search(r"(\d+(?:\.\d+)?)\s*(?:mg|milligram)", strength_str, re.IGNORECASE)
        if match:
            return float(match.group(1))
        return None

    @classmethod
    def parse_daily_multiplier(cls, frequency_str: Optional[str]) -> int:
        """
        Parses standard clinical frequencies:
        '1-0-0' -> 1
        '1-0-1' -> 2
        '1-1-1' -> 3
        'OD' -> 1, 'BD' -> 2, 'TDS' -> 3, 'QID' -> 4
        """
        if not frequency_str:
            return 1
        freq = frequency_str.strip().upper()
        if "-" in freq:
            tokens = freq.split("-")
            total = 0
            for t in tokens:
                try:
                    total += int(t)
                except ValueError:
                    pass
            return max(1, total) if total > 0 else 1
        if "QID" in freq or "4" in freq:
            return 4
        if "TDS" in freq or "3" in freq:
            return 3
        if "BD" in freq or "BID" in freq:
            return 2
        return 1

    @classmethod
    def evaluate_prescription_safety(
        cls,
        prescribed_items: List[Dict[str, Any]],
        patient_allergies: Optional[List[str]] = None,
        patient_comorbidities: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Evaluates a set of prescription line items against:
        1. Pairwise Drug-Drug Interactions
        2. Duplicate Therapeutic Classes
        3. Daily Dose Ceilings
        4. Patient Allergy Cross-Checks
        """
        allergies = [a.strip().upper() for a in (patient_allergies or []) if a and a.strip()]
        interactions: List[Dict[str, Any]] = []
        duplicate_classes: List[Dict[str, Any]] = []
        dosage_warnings: List[Dict[str, Any]] = []
        allergy_alerts: List[Dict[str, Any]] = []

        # Map each item to generic name and classes
        analyzed_items = []
        for item in prescribed_items:
            raw_name = (item.get("generic_name") or item.get("brand_name") or item.get("drug_name") or "").strip()
            dclasses = cls.resolve_drug_classes(raw_name)
            strength_mg = cls.parse_strength_mg(item.get("strength") or item.get("dosage"))
            daily_mult = cls.parse_daily_multiplier(item.get("frequency"))
            daily_dose_mg = (strength_mg * daily_mult) if strength_mg else None

            analyzed_items.append({
                "item_id": item.get("drug_id") or item.get("id"),
                "name": raw_name,
                "classes": dclasses,
                "strength_mg": strength_mg,
                "daily_dose_mg": daily_dose_mg,
                "frequency": item.get("frequency")
            })

        # 1. Check Allergy Conflicts
        for ai in analyzed_items:
            name_upper = ai["name"].upper()
            classes_set = set(ai["classes"])
            for al in allergies:
                if al in name_upper or name_upper in al or any(c in al or al in c for c in classes_set):
                    allergy_alerts.append({
                        "severity": "CRITICAL",
                        "drug_name": ai["name"],
                        "allergy_trigger": al,
                        "title": f"Known Patient Allergy Alert: {ai['name']}",
                        "message": f"Patient has documented hypersensitivity to '{al}'. Prescribing {ai['name']} is contraindicated."
                    })

        # 2. Check Duplicate Therapeutic Classes
        class_to_drugs: Dict[str, List[str]] = {}
        for ai in analyzed_items:
            for c in ai["classes"]:
                class_to_drugs.setdefault(c, []).append(ai["name"])

        for dclass, drugs in class_to_drugs.items():
            if len(drugs) > 1 and dclass in ("NSAID", "ACE_INHIBITOR", "ARB", "BETA_BLOCKER", "PPI", "STATIN"):
                duplicate_classes.append({
                    "severity": "WARNING",
                    "class": dclass,
                    "drugs": drugs,
                    "title": f"Duplicate Therapeutic Class: {dclass}",
                    "message": f"Multiple agents from the same pharmacological class ({', '.join(drugs)}) prescribed simultaneously. Increases toxicity without synergistic efficacy."
                })

        # 3. Check Pairwise Interactions across all component classes
        n = len(analyzed_items)
        seen_pairs = set()
        for i in range(n):
            for j in range(i + 1, n):
                classes_i = analyzed_items[i]["classes"]
                classes_j = analyzed_items[j]["classes"]
                if not classes_i or not classes_j:
                    continue

                for c1 in classes_i:
                    for c2 in classes_j:
                        for rule in PAIRWISE_INTERACTIONS:
                            rc1, rc2 = rule["classes"]
                            if (c1 == rc1 and c2 == rc2) or (c1 == rc2 and c2 == rc1):
                                pair_key = tuple(sorted([analyzed_items[i]["name"], analyzed_items[j]["name"], rule["title"]]))
                                if pair_key in seen_pairs:
                                    continue
                                seen_pairs.add(pair_key)

                                interactions.append({
                                    "severity": rule["severity"],
                                    "drug_a": analyzed_items[i]["name"],
                                    "drug_b": analyzed_items[j]["name"],
                                    "title": rule["title"],
                                    "description": rule["description"],
                                    "recommendation": rule["recommendation"]
                                })

        # 4. Check Daily Dosage Ceilings
        for ai in analyzed_items:
            if ai["daily_dose_mg"] and ai["name"]:
                for molecule, max_limit in DAILY_DOSE_LIMITS.items():
                    if molecule in ai["name"].upper():
                        if ai["daily_dose_mg"] > max_limit:
                            dosage_warnings.append({
                                "severity": "WARNING",
                                "drug_name": ai["name"],
                                "prescribed_daily_mg": ai["daily_dose_mg"],
                                "max_safe_daily_mg": max_limit,
                                "title": f"Dosage Ceiling Exceeded: {ai['name']}",
                                "message": f"Calculated daily dose ({ai['daily_dose_mg']} mg) exceeds standard maximum therapeutic ceiling ({max_limit} mg/day)."
                            })
                        break

        has_critical = any(a["severity"] == "CRITICAL" for a in allergy_alerts) or any(i["severity"] == "CONTRAINDICATED" for i in interactions)
        is_safe = (len(allergy_alerts) == 0 and len(interactions) == 0 and len(duplicate_classes) == 0 and len(dosage_warnings) == 0)

        return {
            "is_safe": is_safe,
            "has_critical": has_critical,
            "total_alerts": len(allergy_alerts) + len(interactions) + len(duplicate_classes) + len(dosage_warnings),
            "allergy_alerts": allergy_alerts,
            "interactions": interactions,
            "duplicate_classes": duplicate_classes,
            "dosage_warnings": dosage_warnings
        }
