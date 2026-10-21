# Standardized Clinical Intake Questionnaire (q1–q20) & Frontend Implementation Specification

**Target Audience:** Frontend Engineers, UI/UX Developers, and Full-Stack Integrators  
**Applies to:** Bright Solutions / COS Medical ERP Platform (`frontend/components/QuestionnaireModal.jsx`, `frontend/context/PatientContext.jsx`, `frontend/services/api.js`)  
**Backend Endpoints:** `POST /api/visits/{visit_id}/questionnaire` & `GET /api/visits/{visit_id}/questionnaire`  
**Database Table:** `intake_questionnaires` & `deterministic_insights` (MySQL)  
**Clinical Engine:** Rule-Based Deterministic CDSS & MedSpaCy NLP Engine (`backend/app/core/cdss_engine.py`)

---

## 1. Executive Summary & Why the Current Frontend Must Be Updated

### The Problem with the Current Frontend Implementation
The existing implementation in [`frontend/components/QuestionnaireModal.jsx`](file:///home/prem/Desktop/pbt/COS/frontend/components/QuestionnaireModal.jsx) and [`frontend/context/PatientContext.jsx`](file:///home/prem/Desktop/pbt/COS/frontend/context/PatientContext.jsx) was created as a static prototype before the real backend FEAT-02 Clinical Decision Support System (CDSS) was built.

Specifically:
1. **Disconnected from the Backend API:** The current `handleSubmit` in `QuestionnaireModal.jsx` invokes `submitQuestionnaire` in `PatientContext.jsx`, which merely executes a client-side `setTimeout(..., 1800)` simulation. It **never calls** `POST /api/visits/{visit_id}/questionnaire`.
2. **Incompatible String Data Instead of Discrete Integers:** The current modal stores lengthy descriptive strings like `'Level 1-3: Mild Pain'`, `'None (Weight Stable)'`, and `'ECOG 1: Ambulatory (Restricted in strenuous physical exertion)'`. The backend CDSS mathematical engines (PHQ-2, GAD-2, PEG-3 average, red-flag triage) require discrete numerical scores (`q1` through `q20` as integers/floats).
3. **Missing CDSS Insights Sync:** Because the backend endpoint is not called, the MySQL tables `intake_questionnaires` and `deterministic_insights` remain empty. Consequently:
   - The Receptionist Queue cannot accurately transition the patient to `INSIGHTS_READY`.
   - The Doctor Dashboard cannot display real-time contraindication warnings, ICD-10 differential diagnoses, or WHO EML recommended generic medications.
   - The Prescription module cannot cross-check drug allergies (e.g., Amoxicillin vs Penicillin allergy) or organ risks (e.g., Ibuprofen vs CKD, Atenolol vs Asthma).

### The Solution
Replace the mock state and arbitrary string payloads with the standardized **20-Question (`q1`–`q20`) Clinical Intake Battery**. When submitted, call the existing `questionnaire.submit(visitId, payload)` in `frontend/services/api.js`, which triggers the backend CDSS and updates the real-time queue.

---

## 2. The 20-Question Architecture (`q1` – `q20`)

The questionnaire is partitioned into six ergonomic clinical sections. Every question is stored in the database as an integer column (`q1` through `q20`) in `intake_questionnaires`. The backend also accepts descriptive alias keys (`NAMED_KEY_TO_Q_SLOT`).

### Master Questionnaire Dictionary

| Slot | Named Alias | Clinical Section | Question Title | Format | Valid Values & Meaning | Clinical / CDSS Impact |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`q1`** | `triage_urgency` | 1. Triage | Triage Acuity Level | Single-choice | `0` = Routine / Ambulatory<br>`1` = Priority / Urgent Review<br>`2` = Critical / Immediate Resuscitation | Determines queue wait priority multiplier. |
| **`q2`** | `pain_site` | 1. Triage | Primary Pain / Discomfort Location | Single-choice | `0` = None / Pain-Free<br>`1` = Head & Neck<br>`2` = Chest & Thorax<br>`3` = Abdomen & Pelvis<br>`4` = Musculoskeletal & Limbs<br>`5` = Generalized / Multi-Site | Routes to specialty differential algorithms (e.g., chest pain triggers ECG suggestion). |
| **`q3`** | `symptom_duration` | 1. Triage | Duration of Chief Complaint | Single-choice | `0` = Acute (< 24 Hours)<br>`1` = Subacute (1–7 Days)<br>`2` = Persistent (1–4 Weeks)<br>`3` = Subchronic (1–3 Months)<br>`4` = Chronic (> 3 Months) | Distinguishes acute infection from chronic disease exacerbation. |
| **`q4`** | `allergy_status` | 5. Meds & Safety | Major Drug Hypersensitivity | Single-choice | `0` = No Known Drug Allergies (NKDA)<br>`1` = Penicillin & $\beta$-Lactams<br>`2` = Sulfa Medications<br>`3` = NSAIDs / Aspirin | **Safety Gate:** `1` blocks Amoxicillin/Ampicillin; `2` blocks Co-trimoxazole; `3` blocks Ibuprofen/Diclofenac. |
| **`q5`** | `phq2_1` | 4. Mental Health | PHQ-2 Item 1 (Anhedonia) | 4-point Likert | `0` = Not at all<br>`1` = Several days<br>`2` = More than half the days<br>`3` = Nearly every day | Sum with `q6`. If $\text{PHQ-2} \ge 3$, triggers `MAJOR_DEPRESSION_SCREEN` (ICD-10 `F32.9`). |
| **`q6`** | `phq2_2` | 4. Mental Health | PHQ-2 Item 2 (Depressed Mood) | 4-point Likert | `0` = Not at all<br>`1` = Several days<br>`2` = More than half the days<br>`3` = Nearly every day | Sum with `q5`. Positive screen generates WARNING insight to administer full PHQ-9. |
| **`q7`** | `gad2_1` | 4. Mental Health | GAD-2 Item 1 (Nervousness / On Edge) | 4-point Likert | `0` = Not at all<br>`1` = Several days<br>`2` = More than half the days<br>`3` = Nearly every day | Sum with `q8`. If $\text{GAD-2} \ge 3$, triggers `ANXIETY_DISORDER` (ICD-10 `F41.1`). |
| **`q8`** | `gad2_2` | 4. Mental Health | GAD-2 Item 2 (Uncontrolled Worry) | 4-point Likert | `0` = Not at all<br>`1` = Several days<br>`2` = More than half the days<br>`3` = Nearly every day | Sum with `q7`. Positive screen prompts anxiety evaluation advisory. |
| **`q9`** | `peg_pain` | 3. Pain (PEG-3) | PEG-3 Item 1 (Pain Intensity) | 0–10 Scale | `0` (No pain) to `10` (Worst pain imaginable) | Clamped strictly to `[0.0, 10.0]`. Average calculated with `q10` and `q11`. |
| **`q10`** | `peg_enjoyment` | 3. Pain (PEG-3) | PEG-3 Item 2 (Enjoyment Interference) | 0–10 Scale | `0` (Does not interfere) to `10` (Completely interferes) | Measures psychological impact of physical pain on daily life. |
| **`q11`** | `peg_activity` | 3. Pain (PEG-3) | PEG-3 Item 3 (General Activity Interference)| 0–10 Scale | `0` (Does not interfere) to `10` (Completely interferes) | If $\text{PEG-3 Average} \ge 4.0$, triggers `ACUTE_MUSCULOSKELETAL_PAIN` (ICD-10 `M79.1`). |
| **`q12`** | `weight_loss_status` | 2. Red Flags | Unintentional Weight Loss (Past 6 Mo) | Single-choice | `0` = None / Weight Stable<br>`1` = Mild (< 5% body weight)<br>`2` = Significant (> 5 kg unintentional) | `2` triggers Constitutional Metabolic Red Flag in patient dossier. |
| **`q13`** | `appetite_status` | 2. Red Flags | Appetite & Nutritional Intake | Single-choice | `0` = Normal Daily Food Intake<br>`1` = Decreased / Mild Anorexia<br>`2` = Severe Early Satiety / Persistent Nausea | Alerts doctor to potential gastrointestinal or neoplastic distress. |
| **`q14`** | `chronic_comorbidity`| 5. Meds & Safety | Primary Chronic Organ Disease | Single-choice | `0` = None / First Hospital Visit<br>`1` = Essential Hypertension (HTN)<br>`2` = Type 2 Diabetes (DM)<br>`3` = Bronchial Asthma / COPD<br>`4` = Coronary Artery Disease / Cardiac<br>`5` = Chronic Kidney Disease (CKD) | **Organ Safety Gates:**<br>`3` (Asthma) blocks $\beta$-blockers (Atenolol).<br>`5` (CKD) blocks NSAIDs (Ibuprofen). |
| **`q15`** | `red_flag_check` | 2. Red Flags | Acute Emergency Warning Signs | Binary | `0` = Absent (None of the emergency flags)<br>`1` = Present (Crushing chest pain, severe dyspnea, stroke signs, or severe bleeding) | **CRITICAL INTERRUPT:** Immediately sets `red_flag_emergency: true`, triggers ICD-10 `R68.89`, and logs CRITICAL severity insight. |
| **`q16`** | `immunization_status`| 6. Functional & Health | Routine Vaccination Currency | Single-choice | `0` = Up to Date according to schedule<br>`1` = Incomplete / Delayed Vaccination<br>`2` = Unsure / Exemption | Sets `immunization_up_to_date: false` if $> 0$, prompting preventive catch-up. |
| **`q17`** | `ecog_performance` | 6. Functional & Health | ECOG Functional Performance Status | 5-point Scale | `0` = ECOG 0 (Fully active)<br>`1` = ECOG 1 (Ambulatory, strenuous restricted)<br>`2` = ECOG 2 (In bed < 50% waking hours)<br>`3` = ECOG 3 (Confined to bed/chair > 50%)<br>`4` = ECOG 4 (100% bedbound) | Standard oncologic/geriatric physical stamina score. |
| **`q18`** | `smoking_status` | 6. Functional & Health | Tobacco & Nicotine Use History | Single-choice | `0` = Never Smoked<br>`1` = Former Smoker (Quit > 1 Year)<br>`2` = Active Smoker (< 1 Pack/Day)<br>`3` = Heavy Active Smoker (> 1 Pack/Day) | Correlates with elevated cardiovascular and respiratory risk scoring. |
| **`q19`** | `alcohol_use` | 6. Functional & Health | Alcohol Consumption Frequency | Single-choice | `0` = Never / Abstinent<br>`1` = Occasional / Social (Monthly or less)<br>`2` = Moderate (1–2 times/week)<br>`3` = Daily / Heavy Intake | Flags potential drug-alcohol hepatic interactions and metabolic risk. |
| **`q20`** | `family_history_risk`| 6. Functional & Health | Familial Chronic Disease Clustering | Single-choice | `0` = No Known Family Disease<br>`1` = First-Degree Relative (Early CVD / DM / HTN)<br>`2` = Multi-Generational Familial Clustering | Generates familial risk clustering badge in the doctor dossier. |

---

## 3. Accompanying Request Fields

Along with `answers: { q1: 0, ..., q20: 0 }`, the `POST /api/visits/{visit_id}/questionnaire` endpoint accepts these optional, high-yield fields:

```json
{
  "patient_id": 15,
  "answers": {
    "q1": 1,
    "q2": 4,
    "q3": 1,
    "q4": 1,
    "q5": 2,
    "q6": 1,
    "q7": 0,
    "q8": 0,
    "q9": 6,
    "q10": 5,
    "q11": 4,
    "q12": 0,
    "q13": 0,
    "q14": 5,
    "q15": 0,
    "q16": 0,
    "q17": 1,
    "q18": 0,
    "q19": 0,
    "q20": 0
  },
  "voice_notes": "Patient complains of persistent sore throat and severe right knee joint pain for 4 days. Denies chest pain or breathlessness. Known severe allergy to penicillin.",
  "allergies": ["PENICILLIN"],
  "comorbidities": ["CKD"],
  "chief_complaint": "Persistent sore throat and bilateral knee pain"
}
```

### Purpose of Additional Fields
1. **`voice_notes` (Text / Speech-to-Text):**
   - Transcribed from the triage nurse/receptionist mic or typed manually.
   - The backend runs **MedSpaCy NLP with negation detection**:
     - *"Denies shortness of breath"* $\to$ Negated symptom. Does not trigger asthma.
     - *"Severe right knee pain"* $\to$ Affirmed symptom. Triggers musculoskeletal pain.
     - *"Allergy to penicillin"* $\to$ Automatically extracts drug class to mask contraindications even if MCQ was missed!
2. **`allergies` (Array of Strings):**
   - Explicit list of patient drug hypersensitivities (e.g. `["PENICILLIN", "SULFA", "NSAID"]`).
   - Ensures any custom or secondary allergies are shielded by the WHO EML medication filter.
3. **`comorbidities` (Array of Strings):**
   - Explicit list of chronic conditions (e.g. `["CKD", "ASTHMA", "HYPERTENSION", "DIABETES"]`).
   - Ensures organ contraindications are checked even if multiple conditions exist simultaneously.
4. **`chief_complaint` (String):**
   - Updates the primary visit complaint if clarified during intake.

---

## 4. API Endpoints Specification

### 4.1 Submit / Update Intake Questionnaire
* **URL:** `POST /api/visits/{visit_id}/questionnaire`
* **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`
* **Path Parameter:** `visit_id` (Integer, e.g. `12`)

#### Sample Request:
```bash
curl -X POST "http://localhost:8000/api/visits/12/questionnaire" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 4,
    "answers": {
      "q1": 1,
      "q2": 4,
      "q3": 1,
      "q4": 1,
      "q5": 2,
      "q6": 1,
      "q7": 0,
      "q8": 0,
      "q9": 6,
      "q10": 5,
      "q11": 4,
      "q12": 0,
      "q13": 0,
      "q14": 5,
      "q15": 0,
      "q16": 0,
      "q17": 1,
      "q18": 0,
      "q19": 0,
      "q20": 0
    },
    "voice_notes": "Patient complains of acute throat pain and bilateral knee pain. Denies chest pain. Allergic to penicillin.",
    "allergies": ["PENICILLIN"],
    "comorbidities": ["CKD"]
  }'
```

#### Sample Response (`200 OK`):
```json
{
  "message": "Intake questionnaire evaluated and deterministic clinical insights generated successfully",
  "visit_id": 12,
  "questionnaire_id": 7,
  "recorded_answers": {
    "q1": 1,
    "q2": 4,
    "q3": 1,
    "q4": 1,
    "q5": 2,
    "q6": 1,
    "q7": 0,
    "q8": 0,
    "q9": 6,
    "q10": 5,
    "q11": 4,
    "q12": 0,
    "q13": 0,
    "q14": 5,
    "q15": 0,
    "q16": 0,
    "q17": 1,
    "q18": 0,
    "q19": 0,
    "q20": 0
  },
  "clinical_scores": {
    "phq2_score": 3,
    "phq2_positive": true,
    "gad2_score": 0,
    "gad2_positive": false,
    "peg3_average": 5.0,
    "peg3_significant_pain": true,
    "red_flag_emergency": false,
    "immunization_up_to_date": true,
    "reported_allergies": ["PENICILLIN"],
    "reported_comorbidities": ["CKD"]
  },
  "predicted_conditions": [
    {
      "disease_code": "ACUTE_MUSCULOSKELETAL_PAIN",
      "icd10_code": "M79.1",
      "disease_name": "Myalgia and Musculoskeletal Arthralgia",
      "rationale": "Reported musculoskeletal pain (PEG-3 score: 5.0/10)."
    },
    {
      "disease_code": "MAJOR_DEPRESSION_SCREEN",
      "icd10_code": "F32.9",
      "disease_name": "Major Depressive Episode Screen Positive",
      "rationale": "PHQ-2 score 3 >= 3 indicates high clinical sensitivity for depressive disorder."
    }
  ],
  "recommended_medications": [
    {
      "generic_drug_id": 4,
      "disease_code": "ACUTE_MUSCULOSKELETAL_PAIN",
      "icd10_code": "M79.1",
      "disease_name": "Myalgia and Musculoskeletal Arthralgia",
      "inn_name": "PARACETAMOL",
      "strength": "500 mg",
      "dosage_form": "TABLET",
      "atc_code": "N02BE01",
      "standard_schedule": "500-1000 mg PO q4-6h PRN (max 4000 mg/day)",
      "line_of_treatment": "FIRST_LINE",
      "safety_status": "CLEAR",
      "safety_notes": "Safe for prescription based on recorded clinical profile.",
      "is_recommended": true
    },
    {
      "generic_drug_id": 6,
      "disease_code": "ACUTE_MUSCULOSKELETAL_PAIN",
      "icd10_code": "M79.1",
      "disease_name": "Myalgia and Musculoskeletal Arthralgia",
      "inn_name": "IBUPROFEN",
      "strength": "400 mg",
      "dosage_form": "TABLET",
      "atc_code": "M01AE01",
      "standard_schedule": "400 mg PO TID after food",
      "line_of_treatment": "FIRST_LINE",
      "safety_status": "CONTRAINDICATED",
      "safety_notes": "Blocked: Contraindicated in chronic renal insufficiency / CKD.",
      "is_recommended": false
    },
    {
      "generic_drug_id": 1,
      "disease_code": "ACUTE_RESPIRATORY_URI",
      "icd10_code": "J06.9",
      "disease_name": "Acute Upper Respiratory Tract Infection",
      "inn_name": "AMOXICILLIN",
      "strength": "500 mg",
      "dosage_form": "CAPSULE",
      "atc_code": "J01CA04",
      "standard_schedule": "500 mg PO TID for 5-7 days",
      "line_of_treatment": "FIRST_LINE",
      "safety_status": "CONTRAINDICATED",
      "safety_notes": "Blocked: Patient has known allergy to PENICILLIN class.",
      "is_recommended": false
    }
  ],
  "insights_generated_count": 3,
  "updated_at": "2026-10-21T14:35:00.000000"
}
```

---

### 4.2 Retrieve Stored Intake Questionnaire
* **URL:** `GET /api/visits/{visit_id}/questionnaire`
* **Headers:** `Authorization: Bearer <token>`
* **Status Codes:**
  - `200 OK`: Returns the stored questionnaire answers, clinical scores, and predicted conditions.
  - `404 Not Found`: No questionnaire recorded for this visit yet.

#### Sample Response (`200 OK`):
```json
{
  "visit_id": 12,
  "patient_id": 4,
  "questionnaire_id": 7,
  "answers": {
    "q1": 1,
    "q2": 4,
    "q3": 1,
    "q4": 1,
    "q5": 2,
    "q6": 1,
    "q7": 0,
    "q8": 0,
    "q9": 6,
    "q10": 5,
    "q11": 4,
    "q12": 0,
    "q13": 0,
    "q14": 5,
    "q15": 0,
    "q16": 0,
    "q17": 1,
    "q18": 0,
    "q19": 0,
    "q20": 0
  },
  "voice_notes": "Patient complains of acute throat pain and bilateral knee pain...",
  "clinical_scores": {
    "phq2_score": 3,
    "phq2_positive": true,
    "gad2_score": 0,
    "gad2_positive": false,
    "peg3_average": 5.0,
    "peg3_significant_pain": true,
    "red_flag_emergency": false,
    "immunization_up_to_date": true,
    "reported_allergies": ["PENICILLIN"],
    "reported_comorbidities": ["CKD"]
  },
  "predicted_conditions": [ ... ],
  "recommended_medications": [ ... ],
  "recorded_at": "2026-10-21T14:35:00.000000"
}
```

---

## 5. Frontend Implementation Guide for Frontend Devs

### Step 1: Update Modal State to Hold Numeric Codes
In `frontend/components/QuestionnaireModal.jsx`, initialize state for the 20 numerical questions, voice notes, allergies, and comorbidities:

```javascript
// Default initial answers
const DEFAULT_ANSWERS = {
  q1: 0,  // Triage acuity (0=Routine)
  q2: 0,  // Pain site (0=None)
  q3: 0,  // Duration (0=<24h)
  q4: 0,  // Allergy status (0=NKDA)
  q5: 0,  // PHQ-2 #1 (0=Not at all)
  q6: 0,  // PHQ-2 #2 (0=Not at all)
  q7: 0,  // GAD-2 #1 (0=Not at all)
  q8: 0,  // GAD-2 #2 (0=Not at all)
  q9: 0,  // PEG-3 Pain (0=No pain)
  q10: 0, // PEG-3 Enjoyment (0=None)
  q11: 0, // PEG-3 Activity (0=None)
  q12: 0, // Weight loss (0=Stable)
  q13: 0, // Appetite (0=Normal)
  q14: 0, // Comorbidity (0=None)
  q15: 0, // Red flags (0=None)
  q16: 0, // Immunization (0=Up to date)
  q17: 1, // ECOG (1=Ambulatory)
  q18: 0, // Smoking (0=Never)
  q19: 0, // Alcohol (0=Never)
  q20: 0  // Family history (0=None)
};
```

When existing answers are loaded via `GET /api/visits/{visit_id}/questionnaire`, populate them:
```javascript
const [answers, setAnswers] = useState(() => {
  return patient?.questionnaire?.answers || DEFAULT_ANSWERS;
});
const [voiceNotes, setVoiceNotes] = useState(patient?.questionnaire?.voice_notes || '');
const [selectedAllergies, setSelectedAllergies] = useState([]);
const [selectedComorbidities, setSelectedComorbidities] = useState([]);
```

---

### Step 2: Organize the 6-Step UI Flow

Map the 20 questions into the 6 stepper cards in the UI:

```
Step 1: Clinical Triage & Complaint ──► q1 (Acuity), q2 (Pain Location), q3 (Duration)
Step 2: Emergency Red Flags        ──► q15 (Red Flags), q12 (Weight Loss), q13 (Appetite)
Step 3: Pain Severity (PEG-3)      ──► q9 (Intensity 0-10), q10 (Enjoyment 0-10), q11 (Activity 0-10)
Step 4: Mental Health Wellbeing    ──► q5 & q6 (PHQ-2 Depression), q7 & q8 (GAD-2 Anxiety)
Step 5: Meds, Allergies & Organs   ──► q4 (Allergy MCQ) + allergies[], q14 (Comorbidity MCQ) + comorbidities[]
Step 6: Functional & Lifestyle     ──► q16 (Vaccines), q17 (ECOG), q18 (Smoking), q19 (Alcohol), q20 (Family), voice_notes
```

---

### Step 3: Implement Option Card Components

Helper component pattern for single-select numerical MCQ:

```jsx
function NumericMcqGroup({ title, hint, value, onChange, options }) {
  return (
    <div className="mcq-question-block" style={{ marginBottom: 20 }}>
      <div className="mcq-question-title" style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
      {hint && <div className="mcq-question-hint" style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{hint}</div>}
      <div className="mcq-options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
        {options.map((opt) => {
          const isSelected = value === opt.val;
          return (
            <div
              key={opt.val}
              className={`mcq-card ${isSelected ? 'selected' : ''}`}
              style={{
                border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                background: isSelected ? '#f0f9ff' : '#ffffff',
                padding: '10px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
              onClick={() => onChange(opt.val)}
            >
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                border: isSelected ? '5px solid #0284c7' : '2px solid #cbd5e1',
                background: '#fff'
              }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: '#1e293b' }}>{opt.label}</div>
                {opt.sub && <div style={{ fontSize: 11, color: '#64748b' }}>{opt.sub}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

### Step 4: Wire `handleSubmit` to Real API Call

Replace the mock `setTimeout` in `QuestionnaireModal.jsx`:

```javascript
import { questionnaire } from '../services/api';
import { usePatients } from '../context/PatientContext';

export default function QuestionnaireModal({ isOpen, patient, onClose }) {
  const { addToast, updatePatientInQueue } = usePatients();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // 1. Resolve visit_id (required by backend)
    const visitId = patient.visit_id || patient.visitId || patient.id;
    if (!visitId) {
      addToast('Error: Patient visit identifier is missing', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // 2. Prepare payload matching QuestionnaireInput schema
      const payload = {
        patient_id: patient.patient_id || patient.patientId,
        answers: answers, // { q1: 0, q2: 4, ..., q20: 0 }
        voice_notes: voiceNotes.trim() || null,
        allergies: selectedAllergies,       // e.g. ["PENICILLIN"]
        comorbidities: selectedComorbidities, // e.g. ["CKD", "ASTHMA"]
        chief_complaint: patient.chief_complaint || patient.chiefComplaint
      };

      // 3. Call backend API
      const result = await questionnaire.submit(visitId, payload);

      // 4. Update local patient state with CDSS results
      if (updatePatientInQueue) {
        updatePatientInQueue(patient.id, {
          status: 'INSIGHTS_READY',
          questionnaire: {
            completed: true,
            completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            answers: result.recorded_answers,
            scores: result.clinical_scores,
            predictedConditions: result.predicted_conditions,
            recommendedMedications: result.recommended_medications
          }
        });
      }

      // 5. User feedback
      if (result.clinical_scores?.red_flag_emergency) {
        addToast('⚠️ RED FLAG EMERGENCY: Critical alerts triggered for physician!', 'error');
      } else {
        addToast(`✅ Intake questionnaire saved. ${result.insights_generated_count} CDSS insights generated!`, 'success');
      }

      onClose();
    } catch (err) {
      console.error('Failed to submit intake questionnaire:', err);
      addToast(`Submission failed: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
```

---

### Step 5: Wire `SpeechMicButton` for Dictation

The intake nurse or receptionist can speak into the microphone to dictate symptoms:

```jsx
import SpeechMicButton from './SpeechMicButton';

<div className="voice-dictation-block" style={{ marginTop: 16 }}>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
    <label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
      Voice Notes / Nurse Dictation (MedSpaCy Negation NLP)
    </label>
    <SpeechMicButton 
      onTranscript={(text) => setVoiceNotes(prev => (prev ? `${prev} ${text}` : text))}
    />
  </div>
  <textarea
    className="m3-input-field"
    rows={3}
    placeholder="e.g., Patient reports severe right knee pain for 4 days. Denies chest pain or fever. Has penicillin allergy."
    value={voiceNotes}
    onChange={(e) => setVoiceNotes(e.target.value)}
    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
  />
  <span style={{ fontSize: 11, color: '#64748b' }}>
    Natural language notes are parsed by the backend NLP engine to auto-detect symptoms and drug allergies.
  </span>
</div>
```

---

## 6. End-to-End Verification Checklist for Developers

Before marking frontend integration complete, verify these test steps:

- [ ] **Step 1: Form Persistence:** Open the modal for a patient, answer questions `q1` to `q20`, and click **Submit**. Check Network tab: `POST /api/visits/{id}/questionnaire` must return `200 OK`.
- [ ] **Step 2: MySQL Verification:** Inspect MySQL:
  ```sql
  SELECT * FROM intake_questionnaires WHERE visit_id = 12;
  SELECT rule_code, severity_level, title FROM deterministic_insights WHERE visit_id = 12;
  ```
- [ ] **Step 3: PHQ-2 Screening:** Set `q5 = 2` and `q6 = 2` (Total = 4). Verify response returns `phq2_positive: true` and generates `MAJOR_DEPRESSION_SCREEN`.
- [ ] **Step 4: PEG-3 Pain Calculation:** Set `q9 = 6`, `q10 = 6`, `q11 = 6`. Verify response returns `peg3_average: 6.0` and `peg3_significant_pain: true`.
- [ ] **Step 5: Medication Contraindication Safety Gate:**
  - Select `q4 = 1` (Penicillin allergy) or add `"PENICILLIN"` to `allergies`.
  - In response `recommended_medications`, verify **Amoxicillin** is returned with `safety_status: "CONTRAINDICATED"` and `is_recommended: false`.
  - Verify **Paracetamol** is returned with `safety_status: "CLEAR"` and `is_recommended: true`.
- [ ] **Step 6: Red Flag Interruption:** Select `q15 = 1`. Verify response sets `red_flag_emergency: true` and creates a `CRITICAL` severity alert `RULE_RED_FLAG_EMERGENCY`.
- [ ] **Step 7: Doctor Dashboard Parity:** Switch to Doctor role and check the queue/consultation view for this patient. The CDSS alerts, predicted conditions, and contraindications should display without any mocked data!
