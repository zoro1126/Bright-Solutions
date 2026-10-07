// Initial oncology patient dataset for CancerCare OS (COS)

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
    doctorAssigned: "Dr. Kiran Patel (Medical Oncology)",
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
        chiefComplaint: "Persistent right upper chest pain and progressive fatigue over the last 8 weeks.",
        durationMonths: "2-3 months",
        priorCancer: "Yes",
        cancerType: "Invasive Ductal Carcinoma (Right Breast)",
        diagnosisYear: "2019",
        priorTreatments: ["Chemotherapy (AC-T)", "Radiation Therapy", "Lumpectomy"],
        familyHistory: "Mother diagnosed with breast cancer at age 56. Maternal aunt with ovarian cancer.",
        currentMedications: "Letrozole 2.5mg OD, Calcium + Vit D3 daily, occasional Paracetamol",
        allergies: "Penicillin (rash)",
        smokingStatus: "Never",
        alcoholUse: "Occasional (social)",
        ecogPerformance: "1 - Symptomatic but completely ambulatory"
      }
    },
    mlInsights: {
      generatedAt: "09:12:28 AM",
      modelVersion: "OncoInsight-v2.1",
      overallRisk: "HIGH",
      confidence: 88,
      riskFlags: [
        { label: "High Recurrence / Metastatic Risk", severity: "HIGH", note: "History of IDC with new chest pain symptoms; letrozole adherence check recommended." },
        { label: "Medication Caution: Letrozole Adherence", severity: "MEDIUM", note: "Monitor bone mineral density and liver function panel." },
        { label: "Familial Clustering: BRCA Risk", severity: "HIGH", note: "First and second-degree breast/ovarian history suggests genetic screening panel (BRCA1/2)." }
      ],
      symptomSummary: "52yo female with 2019 right breast carcinoma post-lumpectomy and adjuvant chemoradiation. Presents with 2-month progressive right chest wall discomfort and fatigue. Letrozole therapy ongoing.",
      recommendedInvestigations: [
        { id: "inv-1", name: "High-resolution Contrast CT Chest", urgency: "Urgent" },
        { id: "inv-2", name: "Serum Tumour Markers (CA 15-3, CEA)", urgency: "Routine" },
        { id: "inv-3", name: "Comprehensive Metabolic Panel + Liver Function", urgency: "Routine" },
        { id: "inv-4", name: "Whole-Body Bone Scintigraphy (Tc-99m)", urgency: "Recommended" }
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
    doctorAssigned: "Dr. Kiran Patel (Medical Oncology)",
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
    doctorAssigned: "Dr. Swaminathan (Surgical Oncology)",
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
    doctorAssigned: "Dr. Kiran Patel (Medical Oncology)",
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
        chiefComplaint: "Unexplained 8kg weight loss over 4 months with chronic dry cough.",
        durationMonths: "4 months",
        priorCancer: "No",
        cancerType: "None",
        diagnosisYear: "N/A",
        priorTreatments: [],
        familyHistory: "Father died of colorectal cancer at age 72.",
        currentMedications: "Metformin 500mg BD, Telmisartan 40mg OD",
        allergies: "None known",
        smokingStatus: "Former (smoked 1 pack/day for 20 years, quit 2 years ago)",
        alcoholUse: "Occasional",
        ecogPerformance: "1 - Restricted in physically strenuous activity"
      }
    },
    mlInsights: {
      generatedAt: "08:50:35 AM",
      modelVersion: "OncoInsight-v2.1",
      overallRisk: "HIGH",
      confidence: 84,
      riskFlags: [
        { label: "High Thoracic Neoplasm Index", severity: "HIGH", note: "Smoking history + rapid unintentional weight loss + dry cough." },
        { label: "Metabolic Monitoring Required", severity: "MEDIUM", note: "Type 2 diabetes with possible paraneoplastic catabolism." }
      ],
      symptomSummary: "58yo male ex-smoker presenting with 8kg weight loss over 4 months and non-productive chronic cough. High suspicion for pulmonary primary malignancy.",
      recommendedInvestigations: [
        { id: "inv-201", name: "Low-Dose Helical Chest CT", urgency: "Immediate" },
        { id: "inv-202", name: "Sputum Cytology x 3 days", urgency: "Routine" },
        { id: "inv-203", name: "Fasting Blood Glucose & HbA1c", urgency: "Routine" }
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
    doctorAssigned: "Dr. Swaminathan (Surgical Oncology)",
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
        chiefComplaint: "Post-operative routine 6-month surveillance follow-up.",
        durationMonths: "6 months",
        priorCancer: "Yes",
        cancerType: "Endometrial Carcinoma Stage 1A",
        diagnosisYear: "2024",
        priorTreatments: ["Total Abdominal Hysterectomy with BSO"],
        familyHistory: "No known malignancy",
        currentMedications: "Multivitamins",
        allergies: "Sulfa drugs",
        smokingStatus: "Never",
        alcoholUse: "Never",
        ecogPerformance: "0 - Fully active"
      }
    },
    mlInsights: {
      generatedAt: "08:30:19 AM",
      modelVersion: "OncoInsight-v2.1",
      overallRisk: "LOW",
      confidence: 94,
      riskFlags: [
        { label: "Low Recurrence Risk", severity: "LOW", note: "Stage 1A clear margins, asymptomatic surveillance visit." }
      ],
      symptomSummary: "61yo female 6-months post-TAH-BSO for Stage 1A endometrial cancer. Asymptomatic, excellent functional capacity.",
      recommendedInvestigations: [
        { id: "inv-301", name: "Pelvic Ultrasound", urgency: "Routine" },
        { id: "inv-302", name: "Vault Cytology Pap Smear", urgency: "Routine" }
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
  "Dr. Kiran Patel (Medical Oncology)",
  "Dr. Swaminathan (Surgical Oncology)",
  "Dr. Radhika Sen (Radiation Oncology)",
  "Dr. Anand Deshmukh (Hematologic Oncology)"
];

export const GOVT_SCHEMES = [
  "Ayushman Bharat — PM-JAY (AB-PMJAY)",
  "CGHS (Central Government Health Scheme)",
  "ECHS (Ex-Servicemen Contributory Health Scheme)",
  "State Govt CM Cancer Scheme (CMCHIS / Aarogyasri)",
  "ESIC (Employees' State Insurance Corporation)",
  "Rashtriya Arogya Nidhi (RAN - BPL Grant)"
];

