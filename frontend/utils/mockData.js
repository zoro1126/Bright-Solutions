// Initial multispeciality hospital patient dataset for Bright Solutions (General Purpose Hospital)

export const INITIAL_PATIENTS = [
  {
    id: "pat-001",
    uhid: "UHID-2026-00142",
    opdId: "OPD-26-88142",
    mrn: "UHID-2026-00142",
    tokenNumber: 142,
    fullName: "Ananya Sharma",
    photoUrl: "",
    patientCategory: "DOMESTIC",
    nationality: "Indian",
    aadhaarNumber: "4521 8840 9123",
    age: 52,
    gender: "Female",
    dob: "1974-03-14",
    phone: "+91 98400 12345",
    address: "12 Rose Garden Avenue, Anna Nagar, Chennai",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600040",
    emergencyContact: {
      name: "Vikram Sharma (Spouse)",
      phone: "+91 98400 12346"
    },
    referredBy: "Dr. M. S. Rao (Apollo Clinic)",
    referrerContact: "+91 98410 88210",
    appointmentTime: "09:00 AM",
    checkInTime: "08:45 AM",
    consultationStartTime: "09:08 AM",
    checkOutTime: null,
    waitTimeMinutes: 23,
    consultationDurationMinutes: 14,
    doctorAssigned: "Dr. Kiran Patel (General & Internal Medicine)",
    status: "IN_CONSULTATION", // WAITING | IN_CONSULTATION | COMPLETED
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
    uhid: "UHID-2026-00143",
    opdId: "OPD-26-88143",
    mrn: "UHID-2026-00143",
    tokenNumber: 143,
    fullName: "Rajan Pillai",
    photoUrl: "",
    patientCategory: "DOMESTIC",
    nationality: "Indian",
    aadhaarNumber: "1499 2044 1278",
    age: 67,
    gender: "Male",
    dob: "1959-07-22",
    phone: "+91 94441 55678",
    address: "88 Gandhi Road, T. Nagar, Chennai",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600017",
    emergencyContact: {
      name: "Suresh Pillai (Son)",
      phone: "+91 94441 55679"
    },
    appointmentTime: "09:30 AM",
    checkInTime: "09:15 AM",
    consultationStartTime: null,
    checkOutTime: null,
    waitTimeMinutes: 20,
    consultationDurationMinutes: 0,
    doctorAssigned: "Dr. Kiran Patel (General & Internal Medicine)",
    status: "WAITING",
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
    uhid: "UHID-2026-00144",
    opdId: "OPD-26-88144",
    mrn: "UHID-2026-00144",
    tokenNumber: 144,
    fullName: "Meera Nair",
    photoUrl: "",
    patientCategory: "DOMESTIC",
    nationality: "Indian",
    aadhaarNumber: "9921 4410 8823",
    age: 44,
    gender: "Female",
    dob: "1982-11-05",
    phone: "+91 97910 88234",
    address: "34 Beach Road, Besant Nagar, Chennai",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600090",
    emergencyContact: {
      name: "Ramesh Nair (Brother)",
      phone: "+91 97910 88235"
    },
    appointmentTime: "10:00 AM",
    checkInTime: "09:40 AM",
    consultationStartTime: null,
    checkOutTime: null,
    waitTimeMinutes: 12,
    consultationDurationMinutes: 0,
    doctorAssigned: "Dr. Swaminathan (General & Laparoscopic Surgery)",
    status: "WAITING",
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
    uhid: "UHID-2026-00145",
    opdId: "OPD-26-88145",
    mrn: "UHID-2026-00145",
    tokenNumber: 145,
    fullName: "Devendra Kapoor",
    photoUrl: "",
    patientCategory: "DOMESTIC",
    nationality: "Indian",
    aadhaarNumber: "8820 1928 3819",
    age: 58,
    gender: "Male",
    dob: "1968-04-19",
    phone: "+91 98840 99012",
    address: "71 Velachery Main Road, Chennai",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600042",
    emergencyContact: {
      name: "Sunil Kapoor (Son)",
      phone: "+91 98840 99013"
    },
    appointmentTime: "10:30 AM",
    checkInTime: "08:30 AM",
    consultationStartTime: "08:55 AM",
    checkOutTime: null,
    waitTimeMinutes: 25,
    consultationDurationMinutes: 24,
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
    uhid: "UHID-2026-00146",
    opdId: "OPD-26-88146",
    mrn: "UHID-2026-00146",
    tokenNumber: 146,
    fullName: "Sunita Rao",
    photoUrl: "",
    patientCategory: "DOMESTIC",
    nationality: "Indian",
    aadhaarNumber: "7712 8840 2291",
    age: 61,
    gender: "Female",
    dob: "1965-09-02",
    phone: "+91 94440 22334",
    address: "15 Sterling Road, Nungambakkam, Chennai",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600034",
    emergencyContact: {
      name: "Arun Rao (Husband)",
      phone: "+91 94440 22335"
    },
    appointmentTime: "11:00 AM",
    checkInTime: "08:15 AM",
    consultationStartTime: "08:30 AM",
    checkOutTime: "08:48 AM",
    waitTimeMinutes: 15,
    consultationDurationMinutes: 18,
    doctorAssigned: "Dr. Swaminathan (General & Laparoscopic Surgery)",
    status: "COMPLETED",
    registeredAt: "08:15 AM",
    isFollowUp: true,
    visitType: "FOLLOW_UP",
    previousVisitDate: "2026-10-08 (OPD-26-87910)",
    followUpReason: "Post-op Laparoscopy Day 14 Wound Healing & Diet Progression",
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
  },
  {
    id: "pat-006",
    uhid: "UHID-2026-00147",
    opdId: "OPD-26-88147",
    mrn: "UHID-2026-00147",
    tokenNumber: 147,
    fullName: "David Arthur Miller",
    photoUrl: "",
    patientCategory: "FOREIGN",
    nationality: "United Kingdom",
    aadhaarNumber: "",
    age: 54,
    gender: "Male",
    dob: "1972-05-14",
    phone: "+44 7911 123456",
    address: "Room 402, ITC Grand Chola Hotel, Mount Road, Guindy, Chennai",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600032",
    emergencyContact: {
      name: "Eleanor Miller (Spouse)",
      phone: "+44 7911 123457"
    },
    frroDetails: {
      isForeignNational: true,
      nationality: "United Kingdom",
      passportNumber: "P-GBR-9921844",
      passportCountry: "United Kingdom",
      passportExpiry: "2031-08-14",
      visaNumber: "V-MED-IND-882190",
      visaType: "e-Medical",
      visaExpiry: "2026-12-10",
      visaPlaceOfIssue: "High Commission of India, London",
      arrivalDate: "2026-10-18",
      portOfEntry: "Delhi (Indira Gandhi Intl - DEL/IGI)",
      comingFromCountry: "United Kingdom",
      expectedDepartureDate: "2026-11-20",
      stayAccommodationType: "Hotel",
      stayPlaceName: "ITC Grand Chola Hotel",
      stayAddressInIndia: "63 Mount Road, Guindy",
      stayCityInIndia: "Chennai",
      stayStateInIndia: "Tamil Nadu",
      stayPincodeInIndia: "600032",
      localContactPhone: "+91 98409 11223",
      permanentAddressAbroad: "24 Kensington Palace Gardens, London W8 4QQ",
      homeCountryCity: "London",
      homeCountry: "United Kingdom",
      overseasEmergencyContact: "Eleanor Miller (Spouse) +44 7911 123457",
      formCNumber: "FRRO-C-2026-881920",
      formCStatus: "COMPLIANT_SUBMITTED"
    },
    appointmentTime: "11:30 AM",
    checkInTime: "09:00 AM",
    consultationStartTime: null,
    checkOutTime: null,
    waitTimeMinutes: 28,
    consultationDurationMinutes: 0,
    doctorAssigned: "Dr. Radhika Sen (Cardiology & Interventional Care)",
    status: "WAITING",
    registeredAt: "09:00 AM",
    insurance: {
      type: "INSURANCE",
      provider: "BUPA Global World Health",
      policyNumber: "BUPA-INT-99281-UK",
      groupNumber: "UK-EXP-2026",
      coveragePct: 90,
      deductible: 0,
      preAuthNumber: "FRRO-GOP-2026-APPROVED",
      abhaId: "",
      abhaAddress: ""
    },
    vitals: {
      weight: "78",
      height: "178",
      bmi: "24.6",
      bp: "130/84",
      pulse: "72",
      temp: "98.4",
      spo2: "99",
      respRate: "16",
      recordedAt: "09:05 AM"
    },
    questionnaire: {
      completed: true,
      completedAt: "09:25 AM",
      responses: {
        chiefComplaint: "International medical transfer for coronary artery evaluation, atypical chest tightness upon exertion, and second opinion on cardiac catheterization.",
        durationMonths: "2 months",
        priorConditions: "Yes",
        conditionType: "Coronary Artery Disease & Dyslipidemia",
        diagnosisYear: "2023",
        priorTreatments: ["Aspirin", "Rosuvastatin", "Beta-blocker therapy"],
        familyHistory: "Father had myocardial infarction at age 60.",
        currentMedications: "Rosuvastatin 20mg, Aspirin 75mg OD, Bisoprolol 5mg OD",
        allergies: "None",
        smokingStatus: "Former (quit 10 years ago)",
        alcoholUse: "Moderate social",
        generalMobility: "Fully mobile"
      }
    },
    mlInsights: {
      generatedAt: "09:25:40 AM",
      modelVersion: "ClinicalInsight-v2.1",
      overallRisk: "HIGH",
      confidence: 89,
      riskFlags: [
        { label: "Coronary Artery Disease: Exertional Angina Risk", severity: "HIGH", note: "Substernal tightness warrants selective CT coronary angiography or cath lab booking." },
        { label: "FRRO & Medical Visa Verification", severity: "LOW", note: "e-Medical Visa valid until Dec 2026. Form C registered within 24h window." }
      ],
      symptomSummary: "54yo male UK national presenting on e-Medical Visa with exertional chest tightness for interventional cardiology workup. Stable vitals.",
      recommendedInvestigations: [
        { id: "inv-401", name: "CT Coronary Angiogram (64-slice high resolution)", urgency: "Immediate" },
        { id: "inv-402", name: "High-Sensitivity Cardiac Troponin T & CK-MB", urgency: "Immediate" },
        { id: "inv-403", name: "2D Speckle Tracking Echocardiography", urgency: "Routine" }
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
