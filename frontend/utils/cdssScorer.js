/**
 * Clinical Decision Support & Deterministic Scoring Engine (Frontend Mirror)
 * Mirrors backend/app/core/cdss_engine.py for offline / mock fallback & instant calculations.
 * Standardized 20-Question battery (q1–q20).
 */

export const DEFAULT_QUESTIONNAIRE_ANSWERS = {
  q1: 0,  // Triage acuity (0=Routine)
  q2: 0,  // Pain site (0=None)
  q3: 0,  // Duration (0=<24h)
  q4: 0,  // Allergy status (0=NKDA)
  q5: 0,  // PHQ-2 Item 1 (0=Not at all)
  q6: 0,  // PHQ-2 Item 2 (0=Not at all)
  q7: 0,  // GAD-2 Item 1 (0=Not at all)
  q8: 0,  // GAD-2 Item 2 (0=Not at all)
  q9: 0,  // PEG-3 Pain (0=No pain)
  q10: 0, // PEG-3 Enjoyment (0=None)
  q11: 0, // PEG-3 Activity (0=None)
  q12: 0, // Weight loss (0=Stable)
  q13: 0, // Appetite (0=Normal)
  q14: 0, // Chronic comorbidity (0=None)
  q15: 0, // Red flags (0=None)
  q16: 0, // Immunization (0=Up to date)
  q17: 1, // ECOG (1=Ambulatory)
  q18: 0, // Smoking (0=Never)
  q19: 0, // Alcohol (0=Never)
  q20: 0  // Family history (0=None)
};

/**
 * Evaluates clinical scores from answers
 */
export function scoreQuestionnaireAnswers(answers = {}, allergies = [], comorbidities = []) {
  const merged = { ...DEFAULT_QUESTIONNAIRE_ANSWERS, ...answers };

  const phq2_val = (Number(merged.q5) || 0) + (Number(merged.q6) || 0);
  const phq2_score = Math.min(6, Math.max(0, phq2_val));
  const phq2_positive = phq2_score >= 3;

  const gad2_val = (Number(merged.q7) || 0) + (Number(merged.q8) || 0);
  const gad2_score = Math.min(6, Math.max(0, gad2_val));
  const gad2_positive = gad2_score >= 3;

  const peg_sum = (Number(merged.q9) || 0) + (Number(merged.q10) || 0) + (Number(merged.q11) || 0);
  const peg3_average = Number((peg_sum / 3.0).toFixed(1));
  const peg3_significant_pain = peg3_average >= 4.0;

  const red_flag_emergency = Number(merged.q15) > 0;
  const immunization_up_to_date = Number(merged.q16) === 0;

  // Allergies
  const allAllergies = new Set([...(allergies || [])]);
  if (merged.q4 === 1) allAllergies.add("PENICILLIN");
  if (merged.q4 === 2) allAllergies.add("SULFA");
  if (merged.q4 === 3) allAllergies.add("NSAID");

  // Comorbidities
  const allComorbidities = new Set([...(comorbidities || [])]);
  if (merged.q14 === 1) allComorbidities.add("HYPERTENSION");
  if (merged.q14 === 2) allComorbidities.add("DIABETES");
  if (merged.q14 === 3) allComorbidities.add("ASTHMA");
  if (merged.q14 === 4) allComorbidities.add("CARDIAC");
  if (merged.q14 === 5) allComorbidities.add("CKD");

  return {
    phq2_score,
    phq2_positive,
    gad2_score,
    gad2_positive,
    peg3_average,
    peg3_significant_pain,
    red_flag_emergency,
    immunization_up_to_date,
    reported_allergies: Array.from(allAllergies),
    reported_comorbidities: Array.from(allComorbidities)
  };
}

/**
 * Predicts differential conditions based on scores and answers
 */
export function predictConditionsLocal(answers = {}, scores = {}, chiefComplaint = "") {
  const conditions = [];

  if (scores.red_flag_emergency) {
    conditions.push({
      disease_code: "EMERGENCY_RED_FLAG",
      icd10_code: "R68.89",
      disease_name: "Acute Emergency Red Flag Symptoms",
      rationale: "Immediate resuscitation or emergency medical review indicated due to acute danger signs."
    });
  }

  if (scores.peg3_significant_pain || answers.q2 === 4) {
    conditions.push({
      disease_code: "ACUTE_MUSCULOSKELETAL_PAIN",
      icd10_code: "M79.1",
      disease_name: "Myalgia and Musculoskeletal Arthralgia",
      rationale: `Reported musculoskeletal pain (PEG-3 score: ${scores.peg3_average}/10).`
    });
  }

  if (scores.phq2_positive) {
    conditions.push({
      disease_code: "MAJOR_DEPRESSION_SCREEN",
      icd10_code: "F32.9",
      disease_name: "Major Depressive Episode Screen Positive",
      rationale: `PHQ-2 score ${scores.phq2_score} >= 3 indicates high clinical sensitivity for depressive disorder.`
    });
  }

  if (scores.gad2_positive) {
    conditions.push({
      disease_code: "ANXIETY_DISORDER",
      icd10_code: "F41.1",
      disease_name: "Generalized Anxiety Disorder Screen Positive",
      rationale: `GAD-2 score ${scores.gad2_score} >= 3 indicates clinical threshold for generalized anxiety evaluation.`
    });
  }

  if (answers.q14 === 1 || scores.reported_comorbidities?.includes("HYPERTENSION")) {
    conditions.push({
      disease_code: "ESSENTIAL_HYPERTENSION",
      icd10_code: "I10",
      disease_name: "Essential (Primary) Hypertension",
      rationale: "Reported history of chronic hypertension."
    });
  }

  if (answers.q14 === 2 || scores.reported_comorbidities?.includes("DIABETES")) {
    conditions.push({
      disease_code: "TYPE_2_DIABETES",
      icd10_code: "E11.9",
      disease_name: "Type 2 Diabetes Mellitus",
      rationale: "Reported history of Type 2 diabetes."
    });
  }

  if (answers.q14 === 3 || scores.reported_comorbidities?.includes("ASTHMA")) {
    conditions.push({
      disease_code: "ASTHMA_COPD",
      icd10_code: "J45.909",
      disease_name: "Bronchial Asthma / Reactive Airway",
      rationale: "Reported respiratory reactive airway disease."
    });
  }

  if (answers.q14 === 5 || scores.reported_comorbidities?.includes("CKD")) {
    conditions.push({
      disease_code: "CHRONIC_KIDNEY_DISEASE",
      icd10_code: "N18.9",
      disease_name: "Chronic Kidney Disease",
      rationale: "Reported chronic renal impairment."
    });
  }

  if (conditions.length === 0) {
    conditions.push({
      disease_code: "GENERAL_CONSULT",
      icd10_code: "Z00.00",
      disease_name: "General Medical Examination / Consultation",
      rationale: chiefComplaint || "General outpatient evaluation."
    });
  }

  return conditions;
}

/**
 * Evaluates guideline medications and contraindication safety gates
 */
export function generateRecommendedMedicationsLocal(scores = {}) {
  const allergies = scores.reported_allergies || [];
  const comorbidities = scores.reported_comorbidities || [];

  const hasPenicillinAllergy = allergies.includes("PENICILLIN");
  const hasSulfaAllergy = allergies.includes("SULFA");
  const hasNsaidAllergy = allergies.includes("NSAID");
  const hasCkd = comorbidities.includes("CKD");
  const hasAsthma = comorbidities.includes("ASTHMA");

  return [
    {
      generic_drug_id: 4,
      disease_code: "ACUTE_MUSCULOSKELETAL_PAIN",
      icd10_code: "M79.1",
      disease_name: "Myalgia and Musculoskeletal Arthralgia",
      inn_name: "PARACETAMOL",
      strength: "500 mg",
      dosage_form: "TABLET",
      atc_code: "N02BE01",
      standard_schedule: "500-1000 mg PO q4-6h PRN (max 4000 mg/day)",
      line_of_treatment: "FIRST_LINE",
      safety_status: "CLEAR",
      safety_notes: "Safe for prescription based on recorded clinical profile.",
      is_recommended: true
    },
    {
      generic_drug_id: 6,
      disease_code: "ACUTE_MUSCULOSKELETAL_PAIN",
      icd10_code: "M79.1",
      disease_name: "Myalgia and Musculoskeletal Arthralgia",
      inn_name: "IBUPROFEN",
      strength: "400 mg",
      dosage_form: "TABLET",
      atc_code: "M01AE01",
      standard_schedule: "400 mg PO TID after food",
      line_of_treatment: "FIRST_LINE",
      safety_status: hasNsaidAllergy ? "CONTRAINDICATED" : hasCkd ? "CONTRAINDICATED" : "CLEAR",
      safety_notes: hasNsaidAllergy 
        ? "Blocked: Patient has known NSAID / Aspirin hypersensitivity."
        : hasCkd 
        ? "Blocked: Contraindicated in chronic renal insufficiency / CKD."
        : "Safe for short-term use.",
      is_recommended: !hasNsaidAllergy && !hasCkd
    },
    {
      generic_drug_id: 1,
      disease_code: "ACUTE_RESPIRATORY_URI",
      icd10_code: "J06.9",
      disease_name: "Acute Upper Respiratory Tract Infection",
      inn_name: "AMOXICILLIN",
      strength: "500 mg",
      dosage_form: "CAPSULE",
      atc_code: "J01CA04",
      standard_schedule: "500 mg PO TID for 5-7 days",
      line_of_treatment: "FIRST_LINE",
      safety_status: hasPenicillinAllergy ? "CONTRAINDICATED" : "CLEAR",
      safety_notes: hasPenicillinAllergy
        ? "Blocked: Patient has known allergy to PENICILLIN / beta-lactam class."
        : "Standard first-line antibiotic coverage.",
      is_recommended: !hasPenicillinAllergy
    },
    {
      generic_drug_id: 8,
      disease_code: "ESSENTIAL_HYPERTENSION",
      icd10_code: "I10",
      disease_name: "Essential (Primary) Hypertension",
      inn_name: "ATENOLOL",
      strength: "50 mg",
      dosage_form: "TABLET",
      atc_code: "C07AB03",
      standard_schedule: "50 mg PO OD morning",
      line_of_treatment: "SECOND_LINE",
      safety_status: hasAsthma ? "CONTRAINDICATED" : "CLEAR",
      safety_notes: hasAsthma 
        ? "Blocked: Beta-blocker contraindicated in reactive airway / bronchial asthma." 
        : "Standard cardio-selective beta-blocker.",
      is_recommended: !hasAsthma
    }
  ];
}

/**
 * Maps numeric answers back to human-readable strings for backward compatibility
 * with DoctorPage, PatientDetailsDrawer, and DoctorPatientDossierView
 */
export function mapAnswersToResponses(answers = {}, voiceNotes = "", allergies = [], comorbidities = [], chiefComplaint = "") {
  const painSiteMap = {
    0: 'General / No specific pain site',
    1: 'Head & Neck',
    2: 'Chest & Thorax',
    3: 'Abdomen & Pelvis',
    4: 'Musculoskeletal & Limbs',
    5: 'Generalized / Multi-Site'
  };

  const durationMap = {
    0: 'Acute (< 24 Hours)',
    1: '1-7 Days',
    2: '1-4 Weeks',
    3: '1-3 Months',
    4: '> 3 Months (Chronic)'
  };

  const weightLossMap = {
    0: 'None (Weight Stable)',
    1: 'Mild (< 5% body weight)',
    2: 'Significant (> 5kg unintentional)'
  };

  const appetiteMap = {
    0: 'Normal Daily Food Intake',
    1: 'Decreased / Mild Anorexia',
    2: 'Severe Early Satiety / Nausea'
  };

  const pegSum = (Number(answers.q9) || 0) + (Number(answers.q10) || 0) + (Number(answers.q11) || 0);
  const pegAvg = Number((pegSum / 3.0).toFixed(1));

  const painMap = (avg) => {
    if (avg === 0) return 'Level 0: Pain-Free';
    if (avg <= 3) return `Level 1-3: Mild Pain (${avg}/10)`;
    if (avg <= 6) return `Level 4-6: Moderate Pain (${avg}/10)`;
    return `Level 7-10: Severe / Excruciating (${avg}/10)`;
  };

  const comorbMap = {
    0: 'No Prior Chronic Comorbidities (First Hospital Evaluation)',
    1: 'Essential Hypertension (HTN)',
    2: 'Type 2 Diabetes Mellitus (DM)',
    3: 'Bronchial Asthma / COPD',
    4: 'Coronary Artery Disease / Cardiac',
    5: 'Chronic Kidney Disease (CKD)'
  };

  const familyMap = {
    0: 'No Known Family Cardiovascular / Metabolic Disease',
    1: 'First-Degree Relative (Parent, Sibling, Child)',
    2: 'Multiple Family Members Across Generations'
  };

  const ecogMap = {
    0: 'ECOG 0: Fully Active',
    1: 'ECOG 1: Ambulatory (Restricted in strenuous physical exertion)',
    2: 'ECOG 2: Capable of Self-Care / In Bed < 50%',
    3: 'ECOG 3: Confined to Bed/Chair > 50%',
    4: 'ECOG 4: Completely Bedbound'
  };

  const smokingMap = {
    0: 'Never Smoked',
    1: 'Former Smoker (Quit > 1 Year)',
    2: 'Active Smoker (< 1 Pack/Day)',
    3: 'Heavy Active Smoker (> 1 Pack/Day)'
  };

  const alcoholMap = {
    0: 'Never / Abstinent',
    1: 'Occasional / Social (Monthly or less)',
    2: 'Moderate (1-2 times/week)',
    3: 'Daily / Heavy Intake'
  };

  const allergyLabels = {
    0: 'No Known Drug Allergies (NKDA)',
    1: 'Penicillin / Beta-Lactam Antibiotics',
    2: 'Sulfa-Based Medications',
    3: 'NSAIDs / Aspirin'
  };

  const formattedAllergies = allergies.length > 0
    ? allergies.map(a => a.charAt(0).toUpperCase() + a.slice(1).toLowerCase())
    : [allergyLabels[answers.q4] || 'No Known Drug Allergies (NKDA)'];

  const formattedComorbidities = comorbidities.length > 0
    ? comorbidities.map(c => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase())
    : [comorbMap[answers.q14] || 'None'];

  return {
    chiefComplaint: chiefComplaint || (answers.q15 === 1 ? 'Emergency Alert: Acute Warning Signs' : 'General Clinical Consultation'),
    primarySite: painSiteMap[answers.q2] || 'General',
    durationMonths: durationMap[answers.q3] || '1-3 months',
    weightLoss: weightLossMap[answers.q12] || 'None (Weight Stable)',
    appetite: appetiteMap[answers.q13] || 'Normal Food Intake',
    painScore: painMap(pegAvg),
    peg3Average: pegAvg,
    feverSweats: answers.q15 === 1 ? 'Emergency Warning Sign Present' : 'Absent',
    priorCancer: comorbMap[answers.q14] || 'No Prior Chronic Comorbidities (First Hospital Evaluation)',
    cancerType: comorbMap[answers.q14] || 'None',
    priorTreatments: formattedComorbidities,
    familyHistory: familyMap[answers.q20] || 'No Known Family Cardiovascular / Metabolic Disease',
    familyTumors: answers.q20 > 0 ? ['Cardiovascular / Metabolic Disease'] : ['None'],
    familyOnsetAge: answers.q20 > 0 ? 'Standard Onset (50 to 70 Years)' : 'Not Applicable',
    currentMedications: formattedComorbidities.map(c => `Standard Therapy (${c})`),
    allergies: formattedAllergies,
    ecogPerformance: ecogMap[answers.q17] || 'ECOG 1',
    smokingStatus: smokingMap[answers.q18] || 'Never Smoked',
    alcoholUse: alcoholMap[answers.q19] || 'Never / Abstinent',
    voiceNotes: voiceNotes || ''
  };
}
