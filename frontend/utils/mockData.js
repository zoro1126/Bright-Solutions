// Initial multispeciality hospital patient dataset for Bright Solutions (General Purpose Hospital)

export const INITIAL_PATIENTS = [
  {
    id: "pat-001",
    mrn: "MRN-2026-0142",
    fullName: "Ananya Sharma",
    age: 52,
    gender: "Female",
    dob: "1974-03-14",
    phone: "+91 98400 12345",
    address: "12 Rose Garden Avenue, Anna Nagar, Chennai",
    emergencyContact: {
      name: "Vikram Sharma (Spouse)",
      phone: "+91 98400 12346"
    },
    appointmentTime: "09:00 AM",
    doctorAssigned: "Dr. Kiran Patel (General & Internal Medicine)",
    status: "INSIGHTS_READY", // REGISTERED | QUESTIONNAIRE_PENDING | INSIGHTS_GENERATING | INSIGHTS_READY | IN_CONSULTATION | COMPLETED
    registeredAt: "08:45 AM",
    abhaId: "91-4820-1928-3819",
    abhaAddress: "ananya.sharma@abdm",
    insurance: {
      type: "INSURANCE", // INSURANCE | GOVT_SCHEME | CASH
      provider: "Star Health Comprehensive",
      policyNumber: "SH-2024-44781",
      groupNumber: "GRP-8821",
      coveragePct: 80,
      deductible: 5000,
      preAuthNumber: "PRE-00981",
      abhaId: "91-4820-1928-3819",
      abhaAddress: "ananya.sharma@abdm"
    },
    vitals: {
      weight: "58",
      height: "162",
      bmi: "22.1",
      bp: "126/82",
      pulse: "74",
      temp: "98.6",
      spo2: "99",
      respRate: "16",
      recordedAt: "08:48 AM"
    },
    questionnaire: {
      completed: true,
      completedAt: "09:12 AM",
      responses: {
        chiefComplaint: "Severe recurrent tension-migraine headaches, episodic dizziness, and elevated home blood pressure readings (BP 150/95).",
        durationMonths: "1-2 months",
        priorConditions: "Yes",
        conditionType: "Stage 2 Essential Hypertension & Dyslipidemia",
        diagnosisYear: "2020",
        priorTreatments: ["Antihypertensive therapy", "Lipid-lowering regimen", "Lifestyle counseling"],
        familyHistory: "Father had history of ischemic heart disease (IHD). Mother with Type 2 Diabetes.",
        currentMedications: "Telmisartan 40mg OD, Atorvastatin 10mg HS, Paracetamol 650mg SOS",
        allergies: "Penicillin (cutaneous rash)",
        smokingStatus: "Never",
        alcoholUse: "Occasional (social)",
        generalMobility: "Ambulatory & Fully Active"
      }
    },
    mlInsights: {
      generatedAt: "09:12:28 AM",
      modelVersion: "ClinicalInsight-v2.1",
      overallRisk: "HIGH",
      confidence: 88,
      riskFlags: [
        { label: "Cardiovascular Risk: Stage 2 Hypertension", severity: "HIGH", note: "Persistent elevated systolic pressure with recurrent headaches; dose titration indicated." },
        { label: "Lipid Surveillance: Statin Adherence", severity: "MEDIUM", note: "Monitor fasting lipid profile and liver enzymes (ALT/AST) panel." },
        { label: "Cardiopulmonary Reserve Caution", severity: "HIGH", note: "Family history of coronary disease suggests 12-lead ECG and baseline echocardiography." }
      ],
      symptomSummary: "52yo female with known hypertension and dyslipidemia presenting with 6-week progressive tension headaches and morning dizziness. Telmisartan and Atorvastatin ongoing.",
      recommendedInvestigations: [
        { id: "inv-1", name: "12-Lead Electrocardiogram (ECG) & 2D Echo", urgency: "Urgent" },
        { id: "inv-2", name: "Comprehensive Lipid Profile & Fasting Blood Sugar", urgency: "Routine" },
        { id: "inv-3", name: "Renal Function Panel (eGFR, Creatinine, Electrolytes)", urgency: "Routine" },
        { id: "inv-4", name: "Digital Cervical Radiograph & Chest X-Ray", urgency: "Recommended" }
      ]
    }
  },
  {
    id: "pat-002",
    mrn: "MRN-2026-0143",
    fullName: "Rajan Pillai",
    age: 67,
    gender: "Male",
    dob: "1959-07-22",
    phone: "+91 94441 55678",
    address: "88 Gandhi Road, T. Nagar, Chennai",
    emergencyContact: {
      name: "Suresh Pillai (Son)",
      phone: "+91 94441 55679"
    },
    appointmentTime: "09:30 AM",
    doctorAssigned: "Dr. Kiran Patel (General & Internal Medicine)",
    status: "QUESTIONNAIRE_PENDING",
    registeredAt: "09:15 AM",
    abhaId: "14-9920-4412-7801",
    abhaAddress: "rajan.pillai@abdm",
    insurance: {
      type: "GOVT_SCHEME",
      provider: "Ayushman Bharat — PM-JAY (AB-PMJAY)",
      policyNumber: "PMJAY-TN-9821034",
      groupNumber: "GOLDEN-CARD-A1",
      coveragePct: 100,
      deductible: 0,
      preAuthNumber: "PMJAY-AUTH-2026-881",
      abhaId: "14-9920-4412-7801",
      abhaAddress: "rajan.pillai@abdm",
      govtSchemeName: "Ayushman Bharat — PM-JAY (AB-PMJAY)",
      beneficiaryId: "PMJAY-TN-9821034"
    },
    vitals: {
      weight: "68",
      height: "168",
      bmi: "24.1",
      bp: "134/88",
      pulse: "78",
      temp: "98.4",
      spo2: "97",
      respRate: "18",
      recordedAt: "09:18 AM"
    },
    questionnaire: {
      completed: false,
      completedAt: null,
      responses: null
    },
    mlInsights: null
  },
  {
    id: "pat-003",
    mrn: "MRN-2026-0144",
    fullName: "Meera Nair",
    age: 44,
    gender: "Female",
    dob: "1982-11-05",
    phone: "+91 97910 88234",
    address: "34 Beach Road, Besant Nagar, Chennai",
    emergencyContact: {
      name: "Ramesh Nair (Brother)",
      phone: "+91 97910 88235"
    },
    appointmentTime: "10:00 AM",
    doctorAssigned: "Dr. Swaminathan (General & Laparoscopic Surgery)",
    status: "REGISTERED",
    registeredAt: "09:40 AM",
    insurance: {
      type: "CASH",
      provider: "Self-Pay / Cash",
      policyNumber: "N/A",
      groupNumber: "N/A",
      coveragePct: 0,
      deductible: 0,
      preAuthNumber: ""
    },
    vitals: {
      weight: "56",
      height: "160",
      bmi: "21.9",
      bp: "118/76",
      pulse: "72",
      temp: "98.2",
      spo2: "99",
      respRate: "15",
      recordedAt: "09:42 AM"
    },
    questionnaire: {
      completed: false,
      completedAt: null,
      responses: null
    },
    mlInsights: null
  },
  {
    id: "pat-004",
    mrn: "MRN-2026-0145",
    fullName: "Devendra Kapoor",
    age: 58,
    gender: "Male",
    dob: "1968-04-19",
    phone: "+91 98840 99012",
    address: "71 Velachery Main Road, Chennai",
    emergencyContact: {
      name: "Sunil Kapoor (Son)",
      phone: "+91 98840 99013"
    },
    appointmentTime: "10:30 AM",
    doctorAssigned: "Dr. Anand Deshmukh (Pulmonology & Critical Care)",
    status: "IN_CONSULTATION",
    registeredAt: "08:30 AM",
    insurance: {
      type: "INSURANCE",
      provider: "ICICI Lombard Health Care",
      policyNumber: "IC-8823-11209",
      groupNumber: "GRP-402",
      coveragePct: 85,
      deductible: 2500,
      preAuthNumber: "PRE-01102"
    },
    vitals: {
      weight: "72",
      height: "174",
      bmi: "23.8",
      bp: "138/90",
      pulse: "82",
      temp: "99.1",
      spo2: "96",
      respRate: "20",
      recordedAt: "08:35 AM"
    },
    questionnaire: {
      completed: true,
      completedAt: "08:50 AM",
      responses: {
        chiefComplaint: "Exertional dyspnea, chronic productive morning cough, and wheezing over the last 3 months.",
        durationMonths: "3 months",
        priorConditions: "Yes",
        conditionType: "Bronchial Asthma & COPD Overlap Syndrome (Grade II)",
        diagnosisYear: "2021",
        priorTreatments: ["Inhaled Corticosteroids (Budesonide)", "Long-acting Beta Agonists (Formoterol)", "Nebulization SOS"],
        familyHistory: "Father had chronic obstructive pulmonary disease (COPD).",
        currentMedications: "Formoterol + Budesonide Inhaler 400mcg BD, Montair-LC OD",
        allergies: "Dust mites, Cold weather exposure",
        smokingStatus: "Former (quit 5 years ago)",
        alcoholUse: "Occasional",
        generalMobility: "Ambulatory with mild exertional dyspnea"
      }
    },
    mlInsights: {
      generatedAt: "08:50:35 AM",
      modelVersion: "ClinicalInsight-v2.1",
      overallRisk: "HIGH",
      confidence: 84,
      riskFlags: [
        { label: "Moderate Obstructive Airway Exacerbation", severity: "HIGH", note: "Decreased PEFR and nocturnal cough indicate acute bronchial hyperreactivity." },
        { label: "Inhaler Technique & Adherence Verification", severity: "MEDIUM", note: "Review correct spacer and dry powder inhaler inhalation mechanics." }
      ],
      symptomSummary: "58yo male with chronic bronchial asthma presenting with 3-month worsening exertional shortness of breath, morning wheeze, and sputum production.",
      recommendedInvestigations: [
        { id: "inv-201", name: "Spirometry with Pre & Post Bronchodilator Reversibility", urgency: "Immediate" },
        { id: "inv-202", name: "Digital Chest Radiograph (PA & Lateral)", urgency: "Routine" },
        { id: "inv-203", name: "Complete Hemogram (Absolute Eosinophil Count) & Serum IgE", urgency: "Routine" }
      ]
    }
  },
  {
    id: "pat-005",
    mrn: "MRN-2026-0146",
    fullName: "Sunita Rao",
    age: 61,
    gender: "Female",
    dob: "1965-09-02",
    phone: "+91 94440 22334",
    address: "15 Sterling Road, Nungambakkam, Chennai",
    emergencyContact: {
      name: "Arun Rao (Husband)",
      phone: "+91 94440 22335"
    },
    appointmentTime: "11:00 AM",
    doctorAssigned: "Dr. Swaminathan (General & Laparoscopic Surgery)",
    status: "COMPLETED",
    registeredAt: "08:15 AM",
    insurance: {
      type: "INSURANCE",
      provider: "Star Health Comprehensive",
      policyNumber: "SH-2023-88912",
      groupNumber: "GRP-331",
      coveragePct: 90,
      deductible: 0,
      preAuthNumber: "PRE-00744"
    },
    vitals: {
      weight: "64",
      height: "163",
      bmi: "24.1",
      bp: "122/80",
      pulse: "70",
      temp: "98.4",
      spo2: "99",
      respRate: "16",
      recordedAt: "08:18 AM"
    },
    questionnaire: {
      completed: true,
      completedAt: "08:30 AM",
      responses: {
        chiefComplaint: "Routine 6-month post-operative follow-up following laparoscopic cholecystectomy. Healing well, no biliary symptoms.",
        durationMonths: "6 months",
        priorConditions: "Yes",
        conditionType: "Symptomatic Cholelithiasis (Calculous Cholecystitis)",
        diagnosisYear: "2024",
        priorTreatments: ["Laparoscopic Cholecystectomy (4-port technique)"],
        familyHistory: "No significant surgical history",
        currentMedications: "Multivitamins, occasional Antacid",
        allergies: "Sulfa drugs",
        smokingStatus: "Never",
        alcoholUse: "Never",
        generalMobility: "Fully active & normal recovery"
      }
    },
    mlInsights: {
      generatedAt: "08:30:19 AM",
      modelVersion: "ClinicalInsight-v2.1",
      overallRisk: "LOW",
      confidence: 94,
      riskFlags: [
        { label: "Optimal Post-Surgical Recovery", severity: "LOW", note: "Clean healed port sites, normal digestive tolerance, no post-cholecystectomy diarrhea." }
      ],
      symptomSummary: "61yo female 6 months post-laparoscopic cholecystectomy presenting for routine health check. Fully recovered and asymptomatic.",
      recommendedInvestigations: [
        { id: "inv-301", name: "Liver Function Panel (Bilirubin, Alk Phos, ALT)", urgency: "Routine" },
        { id: "inv-302", name: "Abdominal Ultrasound (Hepatobiliary Surveillance)", urgency: "Routine" }
      ]
    }
  }
];

export const COMMON_INSURERS = [
  "Star Health Comprehensive",
  "HDFC ERGO Health Suraksha",
  "ICICI Lombard Health Care",
  "Max Bupa / Niva Bupa ReAssure",
  "Care Health Insurance",
  "Bajaj Allianz Extra Care",
  "New India Assurance Mediclaim",
  "Self-Pay / Cash"
];

export const ONCOLOGISTS = [
  "Dr. Kiran Patel (General & Internal Medicine)",
  "Dr. Swaminathan (General & Laparoscopic Surgery)",
  "Dr. Radhika Sen (Cardiology & Interventional Care)",
  "Dr. Anand Deshmukh (Pulmonology & Critical Care)"
];

export const DOCTORS = ONCOLOGISTS;

export const GOVT_SCHEMES = [
  "Ayushman Bharat — PM-JAY (AB-PMJAY)",
  "CGHS (Central Government Health Scheme)",
  "ECHS (Ex-Servicemen Contributory Health Scheme)",
  "State Govt CM Health Scheme (CMCHIS / Aarogyasri)",
  "ESIC (Employees' State Insurance Corporation)",
  "Rashtriya Arogya Nidhi (RAN - BPL Grant)"
];
