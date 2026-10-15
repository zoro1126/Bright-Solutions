import json

collection = {
    "info": {
        "_postman_id": "b1c3a6e0-8e12-4d2c-9a2d-clinicos-opd-suite-v2",
        "name": "Bright Solutions — OPD Clinic OS API Suite (Turnkey)",
        "description": "Complete turnkey REST API test collection for Bright Solutions (OPD Clinic OS). Covers Authentication, Receptionist Registration & NEWS2 Triage, Intake Questionnaire Scoring (PHQ-2/GAD-2/PEG-3), Multipart Diagnostic Vault, Doctor Queue, Patient Dossier with NegEx NLP Brief, Tier-1 CDSS Evaluation & Insight Overrides, WHO EML Drug Formulary, Real-time DDI & Dosage Ceiling Safety Engine, Prescriptions, Cashier Itemized Invoicing, Multi-tender Payment & Thermal/A4 HTML Receipts, Admin Governance, Staff Lifecycle, Audit Logs, and Real-time Dashboard KPIs.",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "variable": [
        {"key": "baseUrl", "value": "http://localhost:8000", "type": "string"},
        {"key": "token", "value": "clinicos_session_2_doctor", "type": "string"},
        {"key": "visitId", "value": "1", "type": "string"},
        {"key": "patientId", "value": "1", "type": "string"},
        {"key": "billId", "value": "1", "type": "string"},
        {"key": "doctorId", "value": "2", "type": "string"},
        {"key": "insightId", "value": "1", "type": "string"},
        {"key": "staffUserId", "value": "1", "type": "string"}
    ],
    "item": [
        {
            "name": "01. Authentication & Session Management",
            "item": [
                {
                    "name": "Health Check",
                    "request": {
                        "method": "GET",
                        "header": [],
                        "url": {
                            "raw": "{{baseUrl}}/api/health",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "health"]
                        },
                        "description": "System health and MySQL connection status check."
                    }
                },
                {
                    "name": "Login — Doctor (Vikram Kulkarni)",
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Content-Type", "value": "application/json"}],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "username": "dr_kulkarni",
                                "password": "password123"
                            }, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/auth/login",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "auth", "login"]
                        },
                        "description": "Authenticates Dr. Vikram Kulkarni (Doctor persona) and returns session Bearer token."
                    }
                },
                {
                    "name": "Login — Receptionist (Anita Sharma)",
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Content-Type", "value": "application/json"}],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "username": "receptionist_anita",
                                "password": "password123"
                            }, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/auth/login",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "auth", "login"]
                        },
                        "description": "Authenticates Anita Sharma (Receptionist persona) and returns session Bearer token."
                    }
                },
                {
                    "name": "Login — Cashier (Rahul Verma)",
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Content-Type", "value": "application/json"}],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "username": "cashier_rahul",
                                "password": "password123"
                            }, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/auth/login",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "auth", "login"]
                        },
                        "description": "Authenticates Rahul Verma (Cashier persona) and returns session Bearer token."
                    }
                },
                {
                    "name": "Login — Admin (Sunil Mehta)",
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Content-Type", "value": "application/json"}],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "username": "admin_sunil",
                                "password": "password123"
                            }, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/auth/login",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "auth", "login"]
                        },
                        "description": "Authenticates Dr. Sunil Mehta (Admin persona) and returns session Bearer token."
                    }
                },
                {
                    "name": "Current Staff User Profile",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/auth/me",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "auth", "me"]
                        },
                        "description": "Returns current logged in user details."
                    }
                },
                {
                    "name": "List Staff Persona Users",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/auth/users",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "auth", "users"]
                        },
                        "description": "Lists active users without leaking sensitive password hashes."
                    }
                },
                {
                    "name": "Logout Staff Session",
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/auth/logout",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "auth", "logout"]
                        },
                        "description": "Terminates active session."
                    }
                }
            ]
        },
        {
            "name": "02. Reception Desk & Patient Registration",
            "item": [
                {
                    "name": "Get Next OPD Queue Token",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/tokens/next",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "tokens", "next"]
                        },
                        "description": "Generates the next sequential OPD token (e.g. Q-101) for today."
                    }
                },
                {
                    "name": "List On-Duty Consulting Doctors",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/doctors",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "doctors"]
                        },
                        "description": "Returns active consulting physicians for encounter assignment."
                    }
                },
                {
                    "name": "Register Patient & Record Triage Vitals",
                    "request": {
                        "method": "POST",
                        "header": [
                            {"key": "Content-Type", "value": "application/json"},
                            {"key": "Authorization", "value": "Bearer {{token}}"}
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "first_name": "Rohan",
                                "last_name": "Kapur",
                                "dob": "1988-11-15",
                                "gender": "MALE",
                                "phone": "9820011223",
                                "email": "rohan.kapur@example.com",
                                "address": "Flat 402, Sea View Apartments, Bandra West, Mumbai",
                                "blood_group": "B+",
                                "doctor_id": 2,
                                "receptionist_id": 1,
                                "insurance_type": "INSURANCE",
                                "insurance_provider": "HDFC ERGO Health",
                                "policy_number": "POL-HDFC-99201",
                                "systolic_bp": 150,
                                "diastolic_bp": 96,
                                "pulse_rate": 84,
                                "temperature_f": 99.2,
                                "resp_rate": 18,
                                "spo2_pct": 98.0,
                                "weight_kg": 76.5,
                                "height_cm": 174.0,
                                "chief_complaint": "Severe throbbing right temporal headache, nausea, and photophobia for 3 days."
                            }, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/patients",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "patients"]
                        },
                        "description": "Creates master patient index, generates UHID-YYYY-XXXXX, computes BMI & AHA BP stage, and assigns doctor token."
                    }
                },
                {
                    "name": "Search & List Registered Patients",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/patients?search=Rohan&page=1&page_size=10",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "patients"],
                            "query": [
                                {"key": "search", "value": "Rohan", "description": "Search by name, phone, or UHID"},
                                {"key": "page", "value": "1"},
                                {"key": "page_size", "value": "10"}
                            ]
                        },
                        "description": "Paginated master patient index directory search."
                    }
                },
                {
                    "name": "Get Patient Master Card by ID",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/patients/{{patientId}}",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "patients", "{{patientId}}"]
                        },
                        "description": "Retrieves demographics, insurance metadata, and emergency contact."
                    }
                },
                {
                    "name": "Live Receptionist Queue with NEWS2 Acuity",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/receptionist/queue",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "receptionist", "queue"]
                        },
                        "description": "Real-time queue with computed NEWS2 acuity scores (EMERGENCY / URGENT / ROUTINE) and estimated wait times."
                    }
                }
            ]
        },
        {
            "name": "03. Clinical Intake Questionnaire & Diagnostic Reports",
            "item": [
                {
                    "name": "Submit Intake Questionnaire (MCQs & Voice Notes)",
                    "request": {
                        "method": "POST",
                        "header": [
                            {"key": "Content-Type", "value": "application/json"},
                            {"key": "Authorization", "value": "Bearer {{token}}"}
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "patient_id": 1,
                                "q1": 0, "q2": 0, "q3": 0,
                                "q4": 1, "q5": 2, "q6": 1,
                                "q7": 0, "q8": 0,
                                "q9": 6, "q10": 5, "q11": 5,
                                "q12": 0, "q13": 0, "q14": 0, "q15": 0,
                                "q16": 0, "q17": 0, "q18": 0, "q19": 0, "q20": 0,
                                "voice_notes": "Patient denies chest pain, denies shortness of breath, reports severe pulsating headache on right side for 4 days, allergic to penicillin."
                            }, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/visits/{{visitId}}/questionnaire",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "visits", "{{visitId}}", "questionnaire"]
                        },
                        "description": "Calculates validated clinical scores: PHQ-2, GAD-2, PEG-3, flags red-flags, and links recommended WHO EML medicines with contraindication masking."
                    }
                },
                {
                    "name": "Get Intake Questionnaire & Candidate EML Drugs",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/visits/{{visitId}}/questionnaire",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "visits", "{{visitId}}", "questionnaire"]
                        },
                        "description": "Retrieves questionnaire answers, psychometric scores, red flags, and WHO EML candidate recommendations."
                    }
                },
                {
                    "name": "Upload External Diagnostic Report (Multipart)",
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "body": {
                            "mode": "formdata",
                            "formdata": [
                                {"key": "file", "type": "file", "src": "/path/to/ecg_strip.pdf"},
                                {"key": "report_type", "value": "ECG", "type": "text"},
                                {"key": "modality", "value": "12-Lead ECG Strip", "type": "text"},
                                {"key": "findings_summary", "value": "Normal sinus rhythm, HR 78 bpm, no ST elevation or acute ischemic changes.", "type": "text"}
                            ]
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/visits/{{visitId}}/reports/upload",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "visits", "{{visitId}}", "reports", "upload"]
                        },
                        "description": "Multipart binary archive for DICOM, ECG strips, Lab PDF reports, or X-rays stored under /uploads/{visit_id}/."
                    }
                },
                {
                    "name": "List Diagnostic Reports for Encounter",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/visits/{{visitId}}/reports",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "visits", "{{visitId}}", "reports"]
                        },
                        "description": "Lists all external diagnostic reports archived for the patient encounter."
                    }
                }
            ]
        },
        {
            "name": "04. Doctor Consultation Queue & Clinical Dossier",
            "item": [
                {
                    "name": "Get Doctor Consultation Waiting Queue",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/doctor/queue?doctor_id={{doctorId}}",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "doctor", "queue"],
                            "query": [{"key": "doctor_id", "value": "{{doctorId}}"}]
                        },
                        "description": "Acuity-sorted waiting list for Dr. Vikram Kulkarni."
                    }
                },
                {
                    "name": "Call Patient into Consultation Room",
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/doctor/queue/{{visitId}}/call",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "doctor", "queue", "{{visitId}}", "call"]
                        },
                        "description": "Transitions visit encounter from WAITING_DOCTOR to IN_CONSULTATION."
                    }
                },
                {
                    "name": "Get Patient Dossier with NegEx NLP Brief",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/doctor/patients/{{patientId}}/dossier",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "doctor", "patients", "{{patientId}}", "dossier"]
                        },
                        "description": "Full 360-degree patient timeline with offline Clinical NegEx NLP executive summary, vitals history, diagnostic scans, and previous prescriptions."
                    }
                },
                {
                    "name": "Trigger Tier-1 CDSS Evaluation",
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/doctor/visits/{{visitId}}/insights/evaluate",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "doctor", "visits", "{{visitId}}", "insights", "evaluate"]
                        },
                        "description": "Evaluates Tier-1 deterministic CDSS rules against active vitals and questionnaires, generating actionable clinical alerts."
                    }
                },
                {
                    "name": "Get Active CDSS Insights & Alerts",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/doctor/visits/{{visitId}}/insights",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "doctor", "visits", "{{visitId}}", "insights"]
                        },
                        "description": "Lists all active alerts for this encounter."
                    }
                },
                {
                    "name": "Review / Override CDSS Safety Alert",
                    "request": {
                        "method": "PATCH",
                        "header": [
                            {"key": "Content-Type", "value": "application/json"},
                            {"key": "Authorization", "value": "Bearer {{token}}"}
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "is_reviewed": True,
                                "doctor_override_notes": "Patient BP 150/96 is stage 2 hypertension. Rechecked in left arm; initiated CCB monotherapy and scheduled ambulatory BP monitoring."
                            }, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/doctor/insights/{{insightId}}",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "doctor", "insights", "{{insightId}}"]
                        },
                        "description": "Attaches physician clinical override justification to satisfy safety governance."
                    }
                },
                {
                    "name": "Doctor Encounter Sign-off & Lock",
                    "request": {
                        "method": "POST",
                        "header": [
                            {"key": "Content-Type", "value": "application/json"},
                            {"key": "Authorization", "value": "Bearer {{token}}"}
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "doctor_id": 2,
                                "diagnosis": "Migraine without aura (G43.009) with Stage 2 Essential Hypertension (I10)",
                                "conclusion_notes": "Advised lifestyle modifications, sleep hygiene, low salt diet. Prescribed Amlodipine 5mg OD and symptomatic Paracetamol SOS.",
                                "doctor_override_notes": "All critical triage and drug interaction alerts acknowledged and reviewed."
                            }, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/doctor/visits/{{visitId}}/sign-off",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "doctor", "visits", "{{visitId}}", "sign-off"]
                        },
                        "description": "Validates that all critical CDSS alerts have been reviewed, signs clinical flags, and transitions encounter to READY_FOR_BILLING."
                    }
                }
            ]
        },
        {
            "name": "05. E-Prescriptions, Formulary & DDI Safety",
            "item": [
                {
                    "name": "Search Drug Formulary & Trade Brands",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/doctor/formulary?q=Telma",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "doctor", "formulary"],
                            "query": [{"key": "q", "value": "Telma", "description": "Substring search across WHO EML generic molecules and commercial brand trade names"}]
                        },
                        "description": "Fast indexed search of drug formulary."
                    }
                },
                {
                    "name": "Pre-flight Prescription DDI & Safety Check",
                    "request": {
                        "method": "POST",
                        "header": [
                            {"key": "Content-Type", "value": "application/json"},
                            {"key": "Authorization", "value": "Bearer {{token}}"}
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps([
                                {"drug_id": 2, "frequency": "1-0-0", "dosage": "5mg"},
                                {"drug_id": 4, "frequency": "1-0-1", "dosage": "650mg"}
                            ], indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/doctor/visits/{{visitId}}/prescriptions/check-safety",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "doctor", "visits", "{{visitId}}", "prescriptions", "check-safety"]
                        },
                        "description": "Pre-flight preview that evaluates potential drug-drug interactions, duplicate therapeutic classes, and daily dose ceiling violations."
                    }
                },
                {
                    "name": "Create E-Prescription with DDI Validation",
                    "request": {
                        "method": "POST",
                        "header": [
                            {"key": "Content-Type", "value": "application/json"},
                            {"key": "Authorization", "value": "Bearer {{token}}"}
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "doctor_id": 2,
                                "general_instructions": "Take medicines with warm water after meals. Do not skip morning antihypertensive dose.",
                                "status": "FINALIZED",
                                "items": [
                                    {
                                        "drug_id": 2,
                                        "dosage": "1 tablet (5mg)",
                                        "frequency": "1-0-0",
                                        "duration_days": 30,
                                        "meal_timing": "AFTER_MEALS",
                                        "special_instructions": "Take daily in the morning after breakfast."
                                    },
                                    {
                                        "drug_id": 4,
                                        "dosage": "1 tablet (650mg)",
                                        "frequency": "1-0-1",
                                        "duration_days": 5,
                                        "meal_timing": "AFTER_MEALS",
                                        "special_instructions": "Take only if severe headache or fever > 100 F."
                                    }
                                ]
                            }, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/doctor/visits/{{visitId}}/prescriptions",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "doctor", "visits", "{{visitId}}", "prescriptions"]
                        },
                        "description": "Saves prescription line items, performs automatic DDI checks, and links items for cashier billing."
                    }
                },
                {
                    "name": "Get Encounter E-Prescription",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/doctor/visits/{{visitId}}/prescriptions",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "doctor", "visits", "{{visitId}}", "prescriptions"]
                        },
                        "description": "Retrieves finalized prescription with joined medication items, dosage forms, and instructions."
                    }
                }
            ]
        },
        {
            "name": "06. Cashier Billing & Checkout",
            "item": [
                {
                    "name": "Cashier Active Billing Queue",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/cashier/queue",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "cashier", "queue"]
                        },
                        "description": "Lists all patient encounters in READY_FOR_BILLING status awaiting cashier clearance."
                    }
                },
                {
                    "name": "Get Itemized Bill Breakdown",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/cashier/bills/{{visitId}}",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "cashier", "bills", "{{visitId}}"]
                        },
                        "description": "Auto-aggregates physician consultation fee (₹500), diagnostic scan archival (₹150), and prescribed medicines (₹60 each), deducting insurance copay."
                    }
                },
                {
                    "name": "Process Multi-Mode Payment Tender (UPI / Cash / Card)",
                    "request": {
                        "method": "POST",
                        "header": [
                            {"key": "Content-Type", "value": "application/json"},
                            {"key": "Authorization", "value": "Bearer {{token}}"}
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "payment_mode": "UPI",
                                "amount_paid": 154.0,
                                "transaction_reference": "UPI-G6-POSTMAN-9988",
                                "cashier_id": 1,
                                "notes": "Settled via PhonePe QR scanner at counter #1"
                            }, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/bills/{{billId}}/payments",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "bills", "{{billId}}", "payments"]
                        },
                        "description": "Tenders payment, marks bill as PAID, transitions visit to COMPLETED, and issues receipt serial."
                    }
                },
                {
                    "name": "Get Printable Receipt (JSON Format)",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/bills/{{billId}}/receipt",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "bills", "{{billId}}", "receipt"]
                        },
                        "description": "Structured JSON receipt with hospital metadata, patient demographics, line items, and transaction reference."
                    }
                },
                {
                    "name": "Get Printable Thermal / A4 Receipt (HTML Preview)",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Accept", "value": "text/html"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/bills/{{billId}}/receipt?format=html",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "bills", "{{billId}}", "receipt"],
                            "query": [{"key": "format", "value": "html"}]
                        },
                        "description": "Renders an elegant printable thermal/A4 invoice in the browser with hospital header, GSTIN, and CSS print media rules."
                    }
                }
            ]
        },
        {
            "name": "07. Admin & Hospital Governance",
            "item": [
                {
                    "name": "Executive Analytics Dashboard",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/admin/analytics",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "admin", "analytics"]
                        },
                        "description": "Hospital executive summary, daily footfall, revenue by payment mode, doctor consultation workload, and recent activity."
                    }
                },
                {
                    "name": "Admin Dashboard (Alias)",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/admin/dashboard",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "admin", "dashboard"]
                        },
                        "description": "Consolidated governance overview alias."
                    }
                },
                {
                    "name": "List Hospital Staff Directory",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/admin/staff",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "admin", "staff"]
                        },
                        "description": "Complete staff directory ordered by role (ADMIN, DOCTOR, RECEPTIONIST, CASHIER) with stripped password hashes."
                    }
                },
                {
                    "name": "Provision Hospital Staff User (Bcrypt)",
                    "request": {
                        "method": "POST",
                        "header": [
                            {"key": "Content-Type", "value": "application/json"},
                            {"key": "Authorization", "value": "Bearer {{token}}"}
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "username": "dr_rohit_sharma",
                                "password": "SecurePassword@123",
                                "full_name": "Dr. Rohit Sharma, MD (Cardiology)",
                                "role": "DOCTOR",
                                "email": "rohit.sharma@brightsolutions.in",
                                "phone": "+919876543299"
                            }, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/admin/staff",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "admin", "staff"]
                        },
                        "description": "Provisions new staff account with 12-round bcrypt password encryption and writes an audit log."
                    }
                },
                {
                    "name": "Toggle Staff Account Status (Active / Inactive)",
                    "request": {
                        "method": "PUT",
                        "header": [
                            {"key": "Content-Type", "value": "application/json"},
                            {"key": "Authorization", "value": "Bearer {{token}}"}
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "active": False
                            }, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/admin/staff/{{staffUserId}}/status",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "admin", "staff", "{{staffUserId}}", "status"]
                        },
                        "description": "Enables or disables staff account access and logs the governance event."
                    }
                },
                {
                    "name": "Governance Audit Trail Logs",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/admin/audit-logs?category=USER_AUTH&severity=INFO&limit=50",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "admin", "audit-logs"],
                            "query": [
                                {"key": "category", "value": "USER_AUTH", "description": "CDSS_OVERRIDE, BILLING_ADJUSTMENT, TRIAGE_EDIT, USER_AUTH, PRESCRIPTION_LOCK"},
                                {"key": "severity", "value": "INFO", "description": "INFO, LOW, MEDIUM, HIGH"},
                                {"key": "limit", "value": "50"}
                            ]
                        },
                        "description": "Tamper-evident immutable governance audit stream."
                    }
                }
            ]
        },
        {
            "name": "08. Real-Time Dashboard Analytics",
            "item": [
                {
                    "name": "OPD KPI Dashboard & Vitals Staging Distribution",
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {
                            "raw": "{{baseUrl}}/api/dashboard/stats",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "dashboard", "stats"]
                        },
                        "description": "Real-time statistics including active doctors, today's footfall, next arrival token, AHA BP distribution, and recent triage feed."
                    }
                }
            ]
        }
    ]
}

with open("/home/prem/Desktop/pbt/COS/postman_collection.json", "w") as f:
    json.dump(collection, f, indent=2)

print("postman_collection.json updated successfully!")
