/**
 * ICD-10 India Edition Dataset, Drug-Drug Interactions (DDI) Rules & Clinical Catalogs
 * Designed for Bright Solutions Clinical Hospital Operating System
 * Compliant with NABH Outpatient Standards & specs in docs/design/
 */

export const ICD10_CATALOG = [
  // --- Circulatory & Cardiovascular System (I00-I99) ---
  { code: 'I10', title: 'Essential (primary) hypertension', category: 'Cardiovascular', isCommon: true },
  { code: 'I11.9', title: 'Hypertensive heart disease without heart failure', category: 'Cardiovascular' },
  { code: 'I20.9', title: 'Angina pectoris, unspecified', category: 'Cardiovascular', isCommon: true },
  { code: 'I25.10', title: 'Atherosclerotic heart disease of native coronary artery', category: 'Cardiovascular' },
  { code: 'I48.91', title: 'Unspecified atrial fibrillation', category: 'Cardiovascular' },
  { code: 'I50.9', title: 'Heart failure, unspecified', category: 'Cardiovascular', isCommon: true },

  // --- Endocrine, Nutritional & Metabolic Diseases (E00-E89) ---
  { code: 'E11.9', title: 'Type 2 diabetes mellitus without complications', category: 'Endocrinology & Metabolism', isCommon: true },
  { code: 'E11.40', title: 'Type 2 diabetes mellitus with diabetic neuropathy, unspecified', category: 'Endocrinology & Metabolism' },
  { code: 'E11.22', title: 'Type 2 diabetes mellitus with diabetic chronic kidney disease', category: 'Endocrinology & Metabolism' },
  { code: 'E78.2', title: 'Mixed hyperlipidemia', category: 'Endocrinology & Metabolism', isCommon: true },
  { code: 'E78.5', title: 'Hyperlipidemia, unspecified', category: 'Endocrinology & Metabolism', isCommon: true },
  { code: 'E03.9', title: 'Hypothyroidism, unspecified', category: 'Endocrinology & Metabolism', isCommon: true },
  { code: 'E06.3', title: 'Autoimmune thyroiditis (Hashimoto disease)', category: 'Endocrinology & Metabolism' },
  { code: 'E66.9', title: 'Obesity, unspecified', category: 'Endocrinology & Metabolism' },

  // --- Respiratory System (J00-J99) ---
  { code: 'J06.9', title: 'Acute upper respiratory infection, unspecified', category: 'Respiratory', isCommon: true },
  { code: 'J20.9', title: 'Acute bronchitis, unspecified', category: 'Respiratory', isCommon: true },
  { code: 'J45.909', title: 'Unspecified asthma, uncomplicated', category: 'Respiratory', isCommon: true },
  { code: 'J44.9', title: 'Chronic obstructive pulmonary disease (COPD), unspecified', category: 'Respiratory', isCommon: true },
  { code: 'J18.9', title: 'Pneumonia, unspecified organism', category: 'Respiratory' },
  { code: 'J30.9', title: 'Allergic rhinitis, unspecified', category: 'Respiratory', isCommon: true },

  // --- Digestive System (K00-K95) ---
  { code: 'K21.9', title: 'Gastro-esophageal reflux disease without esophagitis (GERD)', category: 'Gastroenterology', isCommon: true },
  { code: 'K29.70', title: 'Gastritis, unspecified, without bleeding', category: 'Gastroenterology', isCommon: true },
  { code: 'K58.9', title: 'Irritable bowel syndrome without diarrhea', category: 'Gastroenterology' },
  { code: 'K80.20', title: 'Calculus of gallbladder without cholecystitis (Gallstones)', category: 'Gastroenterology' },
  { code: 'K76.0', title: 'Fatty (change of) liver, not elsewhere classified (NAFLD)', category: 'Gastroenterology' },

  // --- Musculoskeletal System & Connective Tissue (M00-M99) ---
  { code: 'M54.5', title: 'Low back pain, unspecified', category: 'Orthopedics & Rheumatology', isCommon: true },
  { code: 'M54.2', title: 'Cervicalgia (Neck pain)', category: 'Orthopedics & Rheumatology', isCommon: true },
  { code: 'M17.9', title: 'Osteoarthritis of knee, unspecified', category: 'Orthopedics & Rheumatology', isCommon: true },
  { code: 'M79.1', title: 'Myalgia (Musculoskeletal pain)', category: 'Orthopedics & Rheumatology' },
  { code: 'M10.9', title: 'Gout, unspecified', category: 'Orthopedics & Rheumatology' },

  // --- Nervous System & Headaches (G00-G99) ---
  { code: 'G43.909', title: 'Migraine, unspecified, not intractable', category: 'Neurology', isCommon: true },
  { code: 'G44.209', title: 'Tension-type headache, unspecified, not intractable', category: 'Neurology', isCommon: true },
  { code: 'G47.00', title: 'Insomnia, unspecified', category: 'Neurology' },
  { code: 'R51.9', title: 'Headache, unspecified', category: 'Neurology', isCommon: true },
  { code: 'R42', title: 'Dizziness and giddiness / Vertigo', category: 'Neurology', isCommon: true },

  // --- Genitourinary System (N00-N99) ---
  { code: 'N39.0', title: 'Urinary tract infection, site not specified', category: 'Nephrology & Urology', isCommon: true },
  { code: 'N18.9', title: 'Chronic kidney disease, unspecified', category: 'Nephrology & Urology' },
  { code: 'N20.1', title: 'Calculus of ureter / renal colic', category: 'Nephrology & Urology' },
  { code: 'N40.0', title: 'Benign prostatic hyperplasia without lower urinary symptoms', category: 'Nephrology & Urology' },

  // --- Infectious & Parasitic Diseases (A00-B99) ---
  { code: 'A90', title: 'Dengue fever (classical dengue)', category: 'Infectious Diseases', isCommon: true },
  { code: 'A09', title: 'Infectious gastroenteritis and colitis, unspecified', category: 'Infectious Diseases', isCommon: true },
  { code: 'A01.0', title: 'Typhoid fever', category: 'Infectious Diseases' },
  { code: 'B34.9', title: 'Viral infection, unspecified', category: 'Infectious Diseases', isCommon: true },

  // --- Mental & Behavioral Disorders (F01-F99) ---
  { code: 'F32.9', title: 'Major depressive disorder, single episode, unspecified', category: 'Psychiatry & Behavioral' },
  { code: 'F41.1', title: 'Generalized anxiety disorder', category: 'Psychiatry & Behavioral', isCommon: true },

  // --- General Symptoms, Signs & Abnormal Findings (R00-R99) ---
  { code: 'R50.9', title: 'Fever, unspecified', category: 'General Clinical Findings', isCommon: true },
  { code: 'R53.83', title: 'Other fatigue and malaise', category: 'General Clinical Findings', isCommon: true },
  { code: 'R07.9', title: 'Chest pain, unspecified', category: 'General Clinical Findings', isCommon: true },
  { code: 'R06.02', title: 'Shortness of breath / Dyspnea', category: 'General Clinical Findings' },
  { code: 'R00.0', title: 'Tachycardia, unspecified', category: 'General Clinical Findings' },
  { code: 'R68.89', title: 'Other general symptoms and acute clinical red flags', category: 'General Clinical Findings' },

  // --- Factors Influencing Health Status & Preventive Checkups (Z00-Z99) ---
  { code: 'Z00.00', title: 'Encounter for general adult medical examination without abnormal findings', category: 'Preventive Health', isCommon: true },
  { code: 'Z01.89', title: 'Encounter for other specified pre-operative or diagnostic examination', category: 'Preventive Health' }
];

/**
 * Drug-Drug Interaction (DDI) Safety Rules Engine
 * Implements deterministic clinical alerts compliant with BR-RX-01, BR-RX-03, US-CDSS-01
 */
export const DDI_RULES_DATA = [
  {
    drugA: 'warfarin',
    drugB: 'aspirin',
    severity: 'CRITICAL',
    title: 'Severe Bleeding & Hemorrhage Risk (Contraindicated)',
    mechanism: 'Additive antiplatelet and anticoagulant effect dramatically increases risk of major gastrointestinal and intracerebral bleeding.',
    management: 'Avoid concurrent administration unless strict INR monitoring and gastroprotection indicated.'
  },
  {
    drugA: 'ciprofloxacin',
    drugB: 'theophylline',
    severity: 'CRITICAL',
    title: 'Theophylline Toxicity Hazard',
    mechanism: 'Ciprofloxacin inhibits CYP1A2, elevating theophylline serum levels to potentially toxic and arrhythmogenic ranges.',
    management: 'Reduce theophylline dose by 50% and monitor serum levels, or choose alternative antibiotic.'
  },
  {
    drugA: 'tramadol',
    drugB: 'ondansetron',
    severity: 'WARNING',
    title: 'Serotonergic Interaction & Reduced Analgesia',
    mechanism: 'Ondansetron (5-HT3 antagonist) may reduce tramadol analgesic efficacy and increase mild risk of serotonin toxicity.',
    management: 'Monitor pain control; consider alternate antiemetic like Pantoprazole or Domperidone.'
  },
  {
    drugA: 'metformin',
    drugB: 'contrast',
    severity: 'CRITICAL',
    title: 'Lactic Acidosis / Contrast Nephropathy Risk',
    mechanism: 'Iodinated radiocontrast can impair renal function, leading to acute accumulation of metformin and fatal lactic acidosis.',
    management: 'Withhold metformin 48 hours before and after radiocontrast injection; verify normal serum creatinine before resuming.'
  },
  {
    drugA: 'telmisartan',
    drugB: 'spironolactone',
    severity: 'WARNING',
    title: 'Severe Hyperkalemia Risk',
    mechanism: 'Combined angiotensin receptor blocker and potassium-sparing aldosterone antagonist can cause life-threatening hyperkalemia.',
    management: 'Regularly monitor serum potassium (K+) and renal parameters within 7-10 days of co-prescription.'
  },
  {
    drugA: 'atorvastatin',
    drugB: 'clarithromycin',
    severity: 'WARNING',
    title: 'Elevated Statin Exposure / Rhabdomyolysis Risk',
    mechanism: 'Macrolides inhibit CYP3A4, causing 3-4x elevation in atorvastatin plasma concentrations and muscle toxicity.',
    management: 'Temporarily suspend statin therapy during short antimicrobial course.'
  }
];

/**
 * Schedule H & H1 Controlled Drug Classifier
 * Compliant with Indian Drugs & Cosmetics Rules 1945 and RX-F4
 */
export const SCHEDULE_DRUGS = {
  SCHEDULE_H1: [
    'tramadol',
    'alprazolam',
    'clonazepam',
    'zolpidem',
    'diazepam',
    'lorazepam',
    'cefepime',
    'meropenem',
    'imipenem',
    'moxifloxacin',
    'doripenem'
  ],
  SCHEDULE_H: [
    'ciprofloxacin',
    'amoxicillin',
    'azithromycin',
    'cefixime',
    'telmisartan',
    'atorvastatin',
    'metformin',
    'amlodipine',
    'losartan',
    'pantoprazole',
    'rosuvastatin',
    'glimepiride'
  ]
};

export function getDrugScheduleBadge(drugName = '') {
  const lower = drugName.toLowerCase();
  for (const h1 of SCHEDULE_DRUGS.SCHEDULE_H1) {
    if (lower.includes(h1)) {
      return { type: 'SCHEDULE_H1', label: 'Schedule H1 (Rx Mandatory • Red Box)', color: '#dc2626', bg: '#fee2e2' };
    }
  }
  for (const h of SCHEDULE_DRUGS.SCHEDULE_H) {
    if (lower.includes(h)) {
      return { type: 'SCHEDULE_H', label: 'Schedule H (Prescription Only)', color: '#d97706', bg: '#fef3c7' };
    }
  }
  return null;
}

/**
 * Check for DDI between all medications currently in the prescription pad
 */
export function checkDrugInteractions(prescriptions = []) {
  const alerts = [];
  if (!prescriptions || prescriptions.length < 2) return alerts;

  for (let i = 0; i < prescriptions.length; i++) {
    for (let j = i + 1; j < prescriptions.length; j++) {
      const drug1 = (prescriptions[i].drug || '').toLowerCase();
      const drug2 = (prescriptions[j].drug || '').toLowerCase();

      for (const rule of DDI_RULES_DATA) {
        const matchForward = drug1.includes(rule.drugA) && drug2.includes(rule.drugB);
        const matchBackward = drug1.includes(rule.drugB) && drug2.includes(rule.drugA);

        if (matchForward || matchBackward) {
          alerts.push({
            id: `ddi-${rule.drugA}-${rule.drugB}`,
            drugA: prescriptions[i].drug,
            drugB: prescriptions[j].drug,
            severity: rule.severity,
            title: rule.title,
            mechanism: rule.mechanism,
            management: rule.management
          });
        }
      }
    }
  }
  return alerts;
}

/**
 * Pathology & Diagnostic Lab Tests Catalog (Module 7 - PATH-F1)
 */
export const PATHOLOGY_LAB_CATALOG = [
  { id: 'lab-cbc', name: 'Complete Blood Count (CBC) with ESR', category: 'Hematology', specimen: 'EDTA Whole Blood', turnaround: '2 hours', standardCost: 350 },
  { id: 'lab-fbs', name: 'Fasting Blood Sugar (FBS) & Post-Prandial (PPBS)', category: 'Biochemistry', specimen: 'Sodium Fluoride Plasma', turnaround: '2 hours', standardCost: 200 },
  { id: 'lab-hba1c', name: 'Glycated Hemoglobin (HbA1c)', category: 'Biochemistry', specimen: 'EDTA Whole Blood', turnaround: '3 hours', standardCost: 550 },
  { id: 'lab-lft', name: 'Comprehensive Liver Function Test (LFT: Bilirubin, SGOT, SGPT, Alk Phos)', category: 'Biochemistry', specimen: 'Serum (SST)', turnaround: '4 hours', standardCost: 750 },
  { id: 'lab-kft', name: 'Kidney Function Test (KFT: BUN, Creatinine, Electrolytes, Uric Acid)', category: 'Biochemistry', specimen: 'Serum (SST)', turnaround: '4 hours', standardCost: 800 },
  { id: 'lab-lipid', name: 'Lipid Profile (Total Cholesterol, Triglycerides, HDL, LDL, VLDL)', category: 'Biochemistry', specimen: 'Serum (Fasting 12h)', turnaround: '4 hours', standardCost: 650 },
  { id: 'lab-thyroid', name: 'Thyroid Function Panel (Free T3, Free T4, Ultrasensitive TSH)', category: 'Immunology', specimen: 'Serum (SST)', turnaround: '6 hours', standardCost: 600 },
  { id: 'lab-urine', name: 'Routine & Microscopic Urinalysis', category: 'Clinical Pathology', specimen: 'Mid-stream Fresh Urine', turnaround: '1 hour', standardCost: 180 },
  { id: 'lab-ecg', name: '12-Lead Resting Electrocardiogram (ECG)', category: 'Diagnostic Cardiology', specimen: 'Electrophysiological Tracing', turnaround: 'Immediate', standardCost: 300 },
  { id: 'lab-cxr', name: 'Chest Radiography (Chest X-Ray PA View)', category: 'Diagnostic Radiology', specimen: 'Digital Radiograph', turnaround: '30 mins', standardCost: 450 },
  { id: 'lab-usg', name: 'Ultrasound (USG) Whole Abdomen & Pelvis', category: 'Diagnostic Ultrasonography', specimen: 'Real-time Sonogram', turnaround: 'Same Day', standardCost: 1200 }
];

/**
 * Hospital Clinical Departments for Internal Referral (Module 4 - CON-F9)
 */
export const HOSPITAL_DEPARTMENTS = [
  { id: 'dept-im', name: 'General & Internal Medicine', headDoctor: 'Dr. Kiran Patel, MD' },
  { id: 'dept-cardio', name: 'Cardiology & Catheterization', headDoctor: 'Dr. Anand Raman, DM (Cardio)' },
  { id: 'dept-pulmo', name: 'Pulmonology & Respiratory Medicine', headDoctor: 'Dr. Sneha Pillai, MD (Chest)' },
  { id: 'dept-ortho', name: 'Orthopedics & Joint Replacement', headDoctor: 'Dr. Vikramaditya Rathore, MS (Ortho)' },
  { id: 'dept-gastro', name: 'Gastroenterology & Hepatology', headDoctor: 'Dr. Sanjay Mukherjee, DM (Gastro)' },
  { id: 'dept-surgery', name: 'General & Minimal Access Surgery', headDoctor: 'Dr. Swaminathan Iyer, MS (Gen Surg)' },
  { id: 'dept-neuro', name: 'Neurology & Stroke Center', headDoctor: 'Dr. Rajesh Venkat, DM (Neuro)' },
  { id: 'dept-nephro', name: 'Nephrology & Renal Dialysis', headDoctor: 'Dr. Shweta Kulkarni, DM (Nephro)' },
  { id: 'dept-ent', name: 'Otorhinolaryngology (ENT)', headDoctor: 'Dr. Preeti Deshmukh, MS (ENT)' },
  { id: 'dept-ophthal', name: 'Ophthalmology & Eye Care', headDoctor: 'Dr. Arvind Sen, MS (Ophthal)' },
  { id: 'dept-gynae', name: 'Obstetrics & Gynecology (OB-GYN)', headDoctor: 'Dr. Sunita Sharma, MD (OBG)' },
  { id: 'dept-onco', name: 'Medical & Surgical Oncology', headDoctor: 'Dr. Farooq Abdullah, DNB (Oncology)' }
];
