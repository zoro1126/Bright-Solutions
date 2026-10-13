# Clinical Intake Questionnaire Specification & Blueprint

**Clinic Setting:** General Medical Outpatient / Ambulatory Clinic  
**Primary Objective:** Standardized pre-consultation clinical history capture during waiting triage  
**Target Population:** Pediatric & Adolescent (0–17 years) and Adult (18+ years)  
**Target Completion Time:** $\le 5$ minutes (16–20 targeted items with age-adaptive branching)  
**Reading Level:** 5th–6th Grade (Flesch-Kincaid Grade Level $\le 6.0$)

---

## 1. Executive Summary & Design Architecture

In a busy general medical clinic, the primary barrier to thorough pre-consultation history taking is survey fatigue. High cognitive burden leads to abandonment or inaccurate responses. To guarantee completion in $\le 5$ minutes while providing high-yield clinical utility, this questionnaire implements an **adaptive modular architecture**:

1. **Universal Core (All Patients):** Chief complaint, timeline, current medications, allergies, and constitutional red flags (2.0 minutes).
2. **Adult Path ($\ge 18$ years):** Ultra-brief validated screeners for mental health (PHQ-2, GAD-2), substance use (AUDIT-C, single-item tobacco), and pain impact (PEG-3) (1.5 minutes).
3. **Pediatric/Adolescent Path (0–17 years):** Caregiver/proxy or youth self-report addressing immunization currency, pediatric red flags, school/developmental function (PSC-17-Brief or CRAFFT for $\ge 12$ yrs) (1.5 minutes).
4. **Deterministic Clinical Alert Rules:** Auto-calculated risk scores and emergency alerts passed directly to the clinician's dossier.

```
                              [ PATIENT ARRIVAL ]
                                       │
                                       ▼
                     ┌───────────────────────────────────┐
                     │    SECTION 1: UNIVERSAL CORE      │
                     │  • Chief Complaint & HPI Matrix   │
                     │  • Vital Allergies & Medications  │
                     │  • Medical/Surgical Background    │
                     └─────────────────┬─────────────────┘
                                       │
                        Age Branching (Deterministic)
                                       ├───────────────────────────────┐
                                       ▼                               ▼
                      ┌─────────────────────────────────┐   ┌─────────────────────────────────┐
                      │    SECTION 2A: ADULT PATH       │   │   SECTION 2B: PEDIATRIC PATH    │
                      │  • Pain Impact (PEG-3 Brief)    │   │  • Caregiver/Guardian Proxy     │
                      │  • Emotional Wellbeing (PHQ-2,  │   │  • Immunization & Growth        │
                      │    GAD-2)                       │   │  • Youth Risk Screen (CRAFFT/   │
                      │  • Behavioral Lifestyle (AUDIT-C│   │    PSC-17 Brief)                │
                      │    & Tobacco)                   │   └────────────────┬────────────────┘
                      └────────────────┬────────────────┘                    │
                                       └───────────────────────────────┬─────┘
                                                                       ▼
                                                     ┌───────────────────────────────────┐
                                                     │     SECTION 3: RED-FLAG REVIEW    │
                                                     │  • Sepsis & Hemodynamic Flags     │
                                                     │  • Neurological & Acute Dyspnea   │
                                                     └─────────────────┬─────────────────┘
                                                                       │
                                                                       ▼
                                                     [ INSTANT TRIAGE REPORT TO CDSS ]
```

---

## 2. Validated Instruments & Psychometric Profiles

| Construct | Instrument Name | Number of Items | Clinical Sensitivity / Specificity | Licensing & Copyright Status |
| :--- | :--- | :---: | :--- | :--- |
| **Depression Screening** | **PHQ-2** (Patient Health Questionnaire-2) | 2 | Sensitivity: 83–90%<br>Specificity: 90–92% (for Major Depressive Disorder at cutoff $\ge 3$) | **Public Domain** (Created by Drs. Spitzer, Williams, Kroenke; Pfizer Inc. No copyright fee or permission required). |
| **Anxiety Screening** | **GAD-2** (Generalized Anxiety Disorder-2) | 2 | Sensitivity: 86%<br>Specificity: 83% (for GAD at cutoff $\ge 3$) | **Public Domain** (Drs. Spitzer, Kroenke, Williams, Löwe. Free for clinical and research use). |
| **Alcohol Misuse** | **AUDIT-C** (Alcohol Use Disorders Identification Test - Consumption) | 3 | Sensitivity: 86% (men), 73% (women)<br>Specificity: 89% (men), 91% (women) at cutoff $\ge 4$ (men) / $\ge 3$ (women) | **Public Domain** (World Health Organization - WHO). Free for electronic implementation. |
| **Adolescent Substance Use** (Ages 12–17) | **CRAFFT 2.1+N** (Brief Screen) | 3 screening items | Sensitivity: 76–88%<br>Specificity: 82–94% for problem substance use | **Free for Non-Profit/Clinical Use** (Center for Adolescent Behavioral Health Research, Boston Children's Hospital). Requires standard citation. |
| **Pain Intensity & Interference** | **PEG-3** (Pain, Enjoyment, General Activity) | 3 | High correlation ($r > 0.85$) with full 11-item Brief Pain Inventory (BPI) | **Public Domain** (US Department of Veterans Affairs - VA HSR&D, Krebs et al. 2009). No fees. |
| **Pediatric Behavioral / Psychosocial** | **PSC-17-Brief** (Pediatric Symptom Checklist - Internalizing/Externalizing/Attention) | 4 core gate items | Sensitivity: 80%<br>Specificity: 86% | **Public Domain** (Massachusetts General Hospital / J. Michael Murphy, Ed.D). Free for electronic integration. |
| **Pediatric Red-Flag Screening** | **NICE / WHO IMCI Core Triage Criteria** | 4 | High negative predictive value ($>98\%$) for acute pediatric deterioration | **Public Domain** (WHO / NICE Guidelines Open Access). |

---

## 3. Section-by-Section Questionnaire Blueprint

### Section 1: Universal Core — Presenting History & Background
*Applicable to: All Patients (Self or Guardian)*  
*Target Duration: 1.5 minutes*

#### Item 1.1: Chief Reason for Visit
* **Question Text:** What is the main reason for your visit today?
* **Construct:** Primary symptom / Chief Complaint
* **Response Format:** Multi-choice category picker + 100-character description or voice dictation.
  * `[ ] Acute Illness / Infection (Fever, cough, cold, flu, throat pain)`
  * `[ ] Pain or Injury (Headache, chest, back, stomach, joint, accident)`
  * `[ ] Chronic Disease Follow-up (Blood pressure, diabetes, thyroid, asthma)`
  * `[ ] Skin Condition (Rash, itching, swelling, ulcer)`
  * `[ ] Medication Refill / Routine Health Checkup`
  * `[ ] Other (Brief description)`
* **Clinical Value:** Direct input to deterministic specialty auto-router and doctor workspace.

#### Item 1.2: Symptom Duration & Trajectory
* **Question Text:** How long have you had this problem, and how is it changing?
* **Construct:** Onset, Duration, Course
* **Response Format:**
  * Duration: `[ ] Less than 24 hours` | `[ ] 1–7 days` | `[ ] 1–4 weeks` | `[ ] More than 1 month`
  * Trajectory: `[ ] Getting rapidly worse` | `[ ] Staying the same` | `[ ] Improving`

#### Item 1.3: Medication History
* **Question Text:** Are you currently taking any prescription medications, over-the-counter medicines, or regular supplements?
* **Construct:** Drug reconciliation & interaction risk
* **Response Format:** 
  * `( ) No, not taking any regular medications`
  * `( ) Yes (Select common classes or enter names):`
    * `[ ] Blood Pressure / Heart medicines`
    * `[ ] Diabetes medicines / Insulin`
    * `[ ] Blood thinners (Aspirin, Clopidogrel, Warfarin)`
    * `[ ] Pain relievers (NSAIDs / Paracetamol)`
    * `[ ] Antibiotics / Steroids`
    * `[ ] Other / Free text list`

#### Item 1.4: Known Allergies
* **Question Text:** Do you have any known allergies to medicines, foods, or materials?
* **Construct:** Hypersensitivity safety gate
* **Response Format:**
  * `( ) No known allergies (NKDA)`
  * `( ) Yes:`
    * `[ ] Penicillin / Amoxicillin`
    * `[ ] Sulfa drugs`
    * `[ ] NSAIDs (Ibuprofen, Aspirin)`
    * `[ ] Contrast dye / Iodine`
    * `[ ] Specific other:` `[ Text input ]`
* **Deterministic Rule:** If any drug allergy is checked, automatically flags the electronic prescription system to block contraindications.

#### Item 1.5: Prior Major Medical Conditions
* **Question Text:** Have you ever been diagnosed with any of the following? (Select all that apply)
* **Construct:** Charlson Comorbidity Index proxy
* **Response Format:** Checkbox list:
  * `[ ] Hypertension / High Blood Pressure`
  * `[ ] Diabetes Mellitus`
  * `[ ] Asthma / COPD / Chronic Lung Disease`
  * `[ ] Heart Attack / Heart Disease / Stroke`
  * `[ ] Kidney Disease / Dialysis`
  * `[ ] Cancer / Tumor (Past or Present)`
  * `[ ] None of the above`

---

### Section 2A: Adult Path ($\ge 18$ Years)
*Applicable to: Adults*  
*Target Duration: 1.5 minutes*

#### Item 2A.1: Pain Intensity & Interference (PEG-3 Brief)
* **Instrument:** PEG-3 (VA/DoD validated)
* **Gate Condition:** Triggered only if patient reported pain in Item 1.1 or answers "Yes" to pain.
* **Items (0–10 Numeric Rating Scale):**
  1. *Pain Intensity:* What number best describes your pain on average in the past week? (0 = No pain, 10 = Worst pain imaginable)
  2. *Enjoyment of Life:* What number best describes how, during the past week, pain has interfered with your enjoyment of life? (0 = Does not interfere, 10 = Completely interferes)
  3. *General Activity:* What number best describes how pain has interfered with your general activity? (0 = Does not interfere, 10 = Completely interferes)
* **Scoring:** Mean score $\ge 4.0$ indicates clinically significant chronic or acute pain requiring targeted analgesia plan.

#### Item 2A.2: Emotional & Mood Screening (PHQ-2 & GAD-2)
* **Instrument:** PHQ-2 (Kroenke et al.) + GAD-2 (Spitzer et al.)
* **Question Prompt:** Over the last 2 weeks, how often have you been bothered by any of the following problems?
* **Scale:** `0 = Not at all`, `1 = Several days`, `2 = More than half the days`, `3 = Nearly every day`
* **Items:**
  1. *PHQ-2 #1 (Anhedonia):* Little interest or pleasure in doing things?
  2. *PHQ-2 #2 (Depressed Mood):* Feeling down, depressed, or hopeless?
  3. *GAD-2 #1 (Nervousness):* Feeling nervous, anxious, or on edge?
  4. *GAD-2 #2 (Uncontrollable Worry):* Not being able to stop or control worrying?
* **Scoring & Cutoff:**
  * **PHQ-2 $\ge 3$**: Positive screen for depression (Sensitivity 83%, Specificity 92%). Flags recommendation for full PHQ-9.
  * **GAD-2 $\ge 3$**: Positive screen for anxiety (Sensitivity 86%, Specificity 83%). Flags recommendation for full GAD-7.

#### Item 2A.3: Behavioral & Substance Screening (AUDIT-C & Tobacco)
* **Instrument:** AUDIT-C (Bush et al. / WHO) + Single-item Tobacco probe
* **Items:**
  1. *Tobacco:* Do you currently use tobacco or nicotine products (cigarettes, bidi, vaping, chewing tobacco)?
     * `[ ] Never` | `[ ] Former user (Quit > 1 yr)` | `[ ] Occasional / Social` | `[ ] Daily user`
  2. *AUDIT-C Item 1:* How often do you have a drink containing alcohol?
     * `(0) Never` | `(1) Monthly or less` | `(2) 2–4 times a month` | `(3) 2–3 times a week` | `(4) 4+ times a week`
  3. *AUDIT-C Item 2:* How many standard drinks do you have on a typical day when drinking?
     * `(0) 1 or 2` | `(1) 3 or 4` | `(2) 5 or 6` | `(3) 7 to 9` | `(4) 10 or more`
  4. *AUDIT-C Item 3:* How often do you have 6 or more drinks on one occasion?
     * `(0) Never` | `(1) Less than monthly` | `(2) Monthly` | `(3) Weekly` | `(4) Daily/Almost daily`
* **Scoring:** AUDIT-C score $\ge 4$ (men) or $\ge 3$ (women/all ages) triggers brief intervention advisory in CDSS.

---

### Section 2B: Pediatric & Adolescent Path (0–17 Years)
*Applicable to: Pediatric patients (Caregiver proxy for <12; Youth self-report optional for 12–17)*  
*Target Duration: 1.5 minutes*

#### Item 2B.1: Proxy Respondent Relationship
* **Question Text:** Who is completing this form on behalf of the young patient?
* **Response Format:**
  * `[ ] Mother` | `[ ] Father` | `[ ] Grandparent / Legal Guardian` | `[ ] Patient self-reporting (Adolescent $\ge 12$)`

#### Item 2B.2: Immunization Currency
* **Question Text:** Are routine childhood vaccinations up to date according to schedule (e.g. National Universal Immunization Programme / AAP)?
* **Response Format:**
  * `( ) Yes, fully up to date`
  * `( ) Delayed / Partially up to date`
  * `( ) Unsure / Vaccination card not available today`
  * `( ) Exemption / Not vaccinated`

#### Item 2B.3: Pediatric Functional / Psychosocial Screening (PSC-17-Brief Core)
* **Instrument:** Adapted Pediatric Symptom Checklist - Brief (PSC-17)
* **Question Prompt:** Over the past month, how often does the child experience:
* **Scale:** `0 = Never`, `1 = Sometimes`, `2 = Often`
* **Items:**
  1. *School / Activity Performance:* Trouble with schoolwork or keeping up with daily activities?
  2. *Emotional Irritability:* Acts restless, irritable, or has frequent unprovoked crying/tantrums?
  3. *Physical Symptoms:* Complains of unexplained stomach aches or headaches?
* **Clinical Value:** Rapid flags for somatization, pediatric anxiety, or developmental attention deficit.

#### Item 2B.4: Adolescent Substance & Safety Screen (CRAFFT 2.1+N — Age $\ge 12$ Only)
* **Instrument:** CRAFFT (Center for Adolescent Behavioral Health Research, Boston Children's)
* **Gate Condition:** Patient age 12 to 17 years.
* **Items (Yes / No):**
  1. During the past 12 months, did you ever ride in a **C**ar driven by someone (including yourself) who was high or had been using alcohol/drugs?
  2. Do you ever use alcohol or drugs to **R**elax, feel better about yourself, or fit in?
  3. Have you ever gotten into **T**rouble while you were using alcohol or drugs?
* **Scoring:** Any $\ge 1$ positive answer indicates adolescent risk exposure requiring private physician discussion.

---

### Section 3: Universal Red-Flag Review of Systems (ROS)
*Applicable to: All Patients*  
*Target Duration: 45 seconds*

#### Item 3.1: Critical Emergency Red Flags (Deterministic Trigger Gate)
* **Question Text:** In the last 24–48 hours, have you or the patient experienced any of the following emergency warning signs?
* **Construct:** Acute life-threatening pathology (Acute Coronary Syndrome, Sepsis, Meningismus, Stroke, Anaphylaxis)
* **Response Format:** Checkbox list:
  * `[ ] Sudden severe crushing chest pain or pressure`
  * `[ ] Difficulty breathing / Inability to speak in full sentences`
  * `[ ] Sudden weakness, numbness of face/arm/leg, or slurred speech`
  * `[ ] Stiff neck accompanied by high fever or light sensitivity`
  * `[ ] Coughing up blood or vomiting coffee-ground-like blood`
  * `[ ] Extreme lethargy, confusion, or difficulty waking up`
  * `[ ] None of these emergency symptoms`
* **Deterministic Rule:** If **any** emergency checkbox is selected, the triage system **immediately interrupts the queue**, elevates triage priority to `EMERGENCY` (Red), sounds an audio-visual alert on the receptionist/nurse console, and sets estimated wait time to `0 minutes`.

---

## 4. Deterministic Scoring & Clinical Decision Support (CDSS) Matrix

The table below defines how questionnaire answers are parsed into automated alerts without requiring heavyweight ML runtimes:

| Instrument / Section | Raw Score Range | Risk Threshold | Automated Clinical Alert / CDSS Action |
| :--- | :---: | :---: | :--- |
| **Section 3 Red Flags** | 0 to 6 flags | $\ge 1$ item selected | **CRITICAL RED-FLAG ALERT**: Immediate nurse/physician interruption; patient marked for emergency bed triage. |
| **PHQ-2** | 0 to 6 | $\ge 3$ | **POSITIVE DEPRESSION SCREEN**: Suggest full PHQ-9 protocol; notify doctor to evaluate mood and suicidality. |
| **GAD-2** | 0 to 6 | $\ge 3$ | **POSITIVE ANXIETY SCREEN**: Suggest full GAD-7 protocol; consider generalized anxiety disorder evaluation. |
| **AUDIT-C** | 0 to 12 | Men $\ge 4$<br>Women $\ge 3$ | **ALCOHOL MISUSE ALERT**: Add behavioral counseling note; assess liver enzymes and alcohol-drug interactions. |
| **Tobacco Use** | Categorical | Active daily/occasional | **SMOKING CESSATION ALERT**: Prompt doctor for brief cessation counseling; compute elevated cardiovascular score. |
| **PEG-3 Pain** | 0 to 10 | $\ge 4.0$ | **SIGNIFICANT PAIN IMPACT**: Add acute/chronic pain management recommendation; verify analgesic history. |
| **Childhood Vaccines** | Categorical | Delayed / Unsure | **IMMUNIZATION GAP**: Prompt clinic to offer catch-up vaccine administration during this visit encounter. |
| **CRAFFT (Youth)** | 0 to 3 | $\ge 1$ | **ADOLESCENT SAFETY ALERT**: Prompt doctor for confidential private teen interview regarding substance use/peer safety. |

---

## 5. User Experience & Ergonomic Delivery Guidelines

To ensure the $\le 5$ minute completion target is met across diverse patient demographics:

1. **Accessibility & Form Factor:**
   - **Large Touch Targets:** Minimum button height of 48px for mobile/tablet screens.
   - **Progress Bar:** Highlighting "3 quick steps" (General Info $\to$ Health Screen $\to$ Safety Check).
   - **Multi-lingual / Regional Support:** Dual-language layout (English + local vernacular, e.g. Hindi/Tamil) with audio voice dictation option for patients with low literacy.
2. **Cognitive Load Minimization:**
   - Pre-populate demographic fields (Name, UHID, Age, Gender) from the registration step.
   - Use smart conditional skip logic (e.g. PEG-3 only appears if the patient reports pain; CRAFFT only appears for adolescents 12–17).
3. **Privacy & Confidentiality Notice:**
   - Display a reassuring top banner: *"Your answers are private, encrypted, and shared directly only with your consulting doctor to help provide the best possible care today."*
