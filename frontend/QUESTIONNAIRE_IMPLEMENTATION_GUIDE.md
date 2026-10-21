# Frontend Guide: Implementing the Real Clinical Questionnaire (q1..q20)

> **Reference Specification:** Full clinical algorithms, ICD-10 codes, and psychometric definitions are documented in [`docs/QUESTIONNAIRE_FRONTEND_SPEC.md`](file:///home/prem/Desktop/pbt/COS/docs/QUESTIONNAIRE_FRONTEND_SPEC.md).

---

## 🚀 Quick Start for Frontend Developers

### 1. What Needs Changing?
The current [`frontend/components/QuestionnaireModal.jsx`](file:///home/prem/Desktop/pbt/COS/frontend/components/QuestionnaireModal.jsx) uses static string mock values (e.g. `'Level 1-3: Mild Pain'`, `'None (Weight Stable)'`) and calls `submitQuestionnaire()` in `PatientContext.jsx`, which only executes a `setTimeout` simulator.

To make the questionnaire accurate to the backend:
1. Store answers as **numbers** keyed by `q1` through `q20` (e.g. `{ q1: 1, q2: 4, q5: 2, q6: 1, q9: 6, ... }`).
2. Call the existing API client method: `questionnaire.submit(visitId, payload)` in [`frontend/services/api.js`](file:///home/prem/Desktop/pbt/COS/frontend/services/api.js).
3. Handle the returned response containing deterministic CDSS insights (`clinical_scores`, `predicted_conditions`, `recommended_medications`).

---

## 2. API Contract Cheat Sheet

### `POST /api/visits/{visit_id}/questionnaire`

```javascript
import { questionnaire } from '../services/api';

const payload = {
  patient_id: patient.patient_id, // Integer
  answers: {
    q1: 0,   // Triage urgency (0=Routine, 1=Urgent, 2=Emergency)
    q2: 0,   // Pain location (0=None, 1=Head, 2=Chest, 3=Abdomen, 4=Joint/Extremity, 5=Generalized)
    q3: 0,   // Duration (0=<24h, 1=1-7d, 2=1-4w, 3=1-3m, 4=>3m)
    q4: 0,   // Allergy status (0=NKDA, 1=Penicillin, 2=Sulfa, 3=NSAID)
    q5: 0,   // PHQ-2 Anhedonia (0=Not at all, 1=Several days, 2=More than half, 3=Nearly every day)
    q6: 0,   // PHQ-2 Depressed mood (0=Not at all, 1=Several days, 2=More than half, 3=Nearly every day)
    q7: 0,   // GAD-2 Nervousness (0=Not at all, 1=Several days, 2=More than half, 3=Nearly every day)
    q8: 0,   // GAD-2 Uncontrolled worry (0=Not at all, 1=Several days, 2=More than half, 3=Nearly every day)
    q9: 0,   // PEG-3 Pain intensity (0-10 numeric scale)
    q10: 0,  // PEG-3 Enjoyment interference (0-10 numeric scale)
    q11: 0,  // PEG-3 General activity interference (0-10 numeric scale)
    q12: 0,  // Weight loss (0=Stable, 1=Mild <5%, 2=Significant >5kg)
    q13: 0,  // Appetite (0=Normal, 1=Decreased, 2=Severe nausea/anorexia)
    q14: 0,  // Chronic comorbidity (0=None, 1=HTN, 2=Diabetes, 3=Asthma, 4=Cardiac, 5=CKD)
    q15: 0,  // Emergency red flags (0=None, 1=Acute emergency chest pain/stroke/dyspnea)
    q16: 0,  // Vaccination currency (0=Up to date, 1=Delayed/incomplete)
    q17: 1,  // ECOG performance (0=Active, 1=Ambulatory, 2=Bed<50%, 3=Bed>50%, 4=Bedbound)
    q18: 0,  // Smoking (0=Never, 1=Former, 2=Active light, 3=Active heavy)
    q19: 0,  // Alcohol (0=Never, 1=Occasional, 2=Moderate, 3=Heavy)
    q20: 0   // Family history risk (0=None, 1=First degree early CVD/DM, 2=Multi-generational)
  },
  voice_notes: "Patient reports sore throat and joint pain. Denies chest pain. Allergic to penicillin.",
  allergies: ["PENICILLIN"],
  comorbidities: ["CKD"],
  chief_complaint: "Sore throat and joint pain"
};

// Execute API call
const response = await questionnaire.submit(visitId, payload);
console.log('CDSS Scores:', response.clinical_scores);
console.log('Predicted Conditions:', response.predicted_conditions);
console.log('Safe Medications:', response.recommended_medications);
```

---

## 3. The 20 Questions UI Matrix

### Step 1: Triage & Complaint
- **`q1` Triage Urgency**:
  - `0`: Routine / Ambulatory
  - `1`: Priority / Urgent Review
  - `2`: Critical / Immediate Resuscitation
- **`q2` Pain Site**:
  - `0`: None / Pain-Free
  - `1`: Head & Neck
  - `2`: Chest & Thorax
  - `3`: Abdomen & Pelvis
  - `4`: Musculoskeletal & Limbs
  - `5`: Generalized / Multi-Site Body Ache
- **`q3` Symptom Duration**:
  - `0`: Acute (< 24 Hours)
  - `1`: Subacute (1 to 7 Days)
  - `2`: Persistent (1 to 4 Weeks)
  - `3`: Subchronic (1 to 3 Months)
  - `4`: Chronic (> 3 Months)

### Step 2: Emergency Red Flags & Constitutional
- **`q15` Emergency Red Flags**:
  - `0`: None (No acute emergency warning signs)
  - `1`: Present (Sudden chest pain, severe dyspnea, stroke signs, or massive bleeding)
- **`q12` Unintentional Weight Loss (Past 6 Months)**:
  - `0`: None / Weight Stable
  - `1`: Mild (< 5% body weight)
  - `2`: Significant (> 5 kg unintentional)
- **`q13` Appetite & Nutritional Intake**:
  - `0`: Normal Daily Food Intake
  - `1`: Decreased / Mild Anorexia
  - `2`: Severe Early Satiety / Persistent Nausea

### Step 3: Pain Severity & Interference (PEG-3 Scale)
- **`q9` Pain Intensity (0–10)**: 0 = No pain, 10 = Worst pain imaginable
- **`q10` Enjoyment of Life Interference (0–10)**: 0 = Does not interfere, 10 = Completely interferes
- **`q11` General Activity Interference (0–10)**: 0 = Does not interfere, 10 = Completely interferes
- *Calculation:* $\text{Average} = (q_9 + q_{10} + q_{11}) / 3.0$. An average $\ge 4.0$ flags significant pain.

### Step 4: Mental Health Wellbeing (PHQ-2 & GAD-2)
*Scale for each: `0` = Not at all, `1` = Several days, `2` = More than half the days, `3` = Nearly every day*
- **`q5` PHQ-2 #1**: Little interest or pleasure in doing things?
- **`q6` PHQ-2 #2**: Feeling down, depressed, or hopeless?
  - *$\text{PHQ-2 Total} = q_5 + q_6$. Total $\ge 3$ triggers depression alert.*
- **`q7` GAD-2 #1**: Feeling nervous, anxious, or on edge?
- **`q8` GAD-2 #2**: Not being able to stop or control worrying?
  - *$\text{GAD-2 Total} = q_7 + q_8$. Total $\ge 3$ triggers anxiety alert.*

### Step 5: Allergies, Meds & Organ Safety
- **`q4` Major Drug Allergy**:
  - `0`: No Known Drug Allergies (NKDA)
  - `1`: Penicillin / Beta-Lactams (Amoxicillin)
  - `2`: Sulfa Medications (Co-trimoxazole)
  - `3`: NSAIDs / Aspirin (Ibuprofen)
- **`q14` Chronic Comorbidity**:
  - `0`: None
  - `1`: Essential Hypertension
  - `2`: Type 2 Diabetes Mellitus
  - `3`: Bronchial Asthma / COPD
  - `4`: Coronary Artery Disease / Cardiac
  - `5`: Chronic Kidney Disease (CKD)
- **Multi-select tags (`allergies` & `comorbidities`)**:
  - `allergies: ["PENICILLIN", "SULFA"]`
  - `comorbidities: ["CKD", "ASTHMA"]`

### Step 6: Functional Status, Lifestyle & Voice Notes
- **`q16` Immunization Status**: `0` = Up to Date, `1` = Incomplete / Delayed, `2` = Unsure
- **`q17` ECOG Performance Status**:
  - `0`: ECOG 0 (Fully active)
  - `1`: ECOG 1 (Ambulatory, strenuous exertion restricted)
  - `2`: ECOG 2 (In bed < 50% of day)
  - `3`: ECOG 3 (In bed > 50% of day)
  - `4`: ECOG 4 (100% bedbound)
- **`q18` Tobacco Use**: `0` = Never, `1` = Former, `2` = Active light, `3` = Active heavy
- **`q19` Alcohol Use**: `0` = Never, `1` = Occasional, `2` = Moderate, `3` = Heavy
- **`q20` Family History**: `0` = None, `1` = First-degree relative, `2` = Multi-generational
- **`voice_notes`**: Text from triage nurse or Speech-to-Text mic (`SpeechMicButton.jsx`).

---

## 4. Frontend Integration Checklist

1. [ ] Import `questionnaire` from `../services/api.js`.
2. [ ] In `QuestionnaireModal.jsx`, replace `formData` string state with `answers: { q1: 0, ..., q20: 0 }`.
3. [ ] When user clicks Submit, extract `const visitId = patient.visit_id || patient.visitId || patient.id`.
4. [ ] Call `const res = await questionnaire.submit(visitId, { answers, voice_notes, allergies, comorbidities })`.
5. [ ] Check `res.clinical_scores.red_flag_emergency`: If true, show immediate critical toast!
6. [ ] Refresh the patient queue or call `updatePatient(patient.id, { status: 'INSIGHTS_READY', ... })`.
7. [ ] Verify that opening the Doctor consultation dashboard displays the live CDSS recommendations.
