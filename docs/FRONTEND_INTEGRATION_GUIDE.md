# Bright Solutions — Frontend Developer API Integration Guide
**Covers:** Group 1 (Auth), Group 2 (Patients), Group 3 (Queue), Group 4 (Questionnaires & Diagnostic Reports), Group 5 (Doctor Consultation & Prescriptions), and Group 6 (Cashier Billing & Payments).

---

## 1. Connecting Frontend to the Backend

### 1.1 Server Endpoints & URLs
* **Backend Origin**: `http://localhost:8000`
* **API Base URL**: `http://localhost:8000/api`
* **Static Diagnostic Media Uploads**: `http://localhost:8000/uploads`
* **Interactive Swagger Documentation**: `http://localhost:8000/docs`
* **ReDoc Documentation**: `http://localhost:8000/redoc`

### 1.2 Running the Backend Locally
Ensure MySQL is running on `localhost:3306` with database `test_clinicos_db`:
```bash
cd /home/prem/Desktop/pbt/COS/backend
source venv/bin/activate
PYTHONPATH=. python main.py
```
*The server will boot on port `8000` with CORS enabled (`allow_origins=["*"]`).*

### 1.3 Vite Reverse-Proxy Setup (`vite.config.js`)
If your frontend runs on port `5173` or `3000`, configure your Vite proxy so `/api` and `/uploads` seamlessly route to port `8000`:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

### 1.4 Authentication Token Handling
Store the token returned from `/api/auth/login` in `localStorage`:
```javascript
// Example: Storing token on login
localStorage.setItem('auth_token', response.token);

// Example: Sending with protected API calls
const token = localStorage.getItem('auth_token');
const headers = {
  'Content-Type': 'application/json',
  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
};
```

---

## 2. Group 1: Authentication & Staff Session

### 2.1 Staff Login
* **Endpoint**: `POST /api/auth/login`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "username": "dr_kulkarni",
  "password": "password123"
}
```
* **Response (`200 OK`)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "username": "dr_kulkarni",
    "full_name": "Dr. Ramesh Kulkarni, MD",
    "role": "DOCTOR",
    "email": "kulkarni@clinic.com",
    "phone": "9876543211",
    "is_active": true
  },
  "message": "Login successful"
}
```
* **Demo Staff Credentials**:
  * **Receptionist**: `receptionist_anita` / `password123`
  * **Doctor**: `dr_kulkarni` or `dr_ananya` / `password123`
  * **Cashier**: `cashier_rahul` / `password123`
  * **Admin**: `admin` / `password123`

### 2.2 Staff Logout
* **Endpoint**: `POST /api/auth/logout`
* **Response (`200 OK`)**: `{"message": "Logged out successfully"}`

---

## 3. Group 2: Patient Registration & Master Data

### 3.1 Get Next Queue Token
* **Endpoint**: `GET /api/tokens/next`
* **Response (`200 OK`)**: `{"next_token": "Q-105"}`

### 3.2 List On-Duty Doctors
* **Endpoint**: `GET /api/doctors`
* **Response (`200 OK`)**:
```json
[
  {
    "id": 2,
    "full_name": "Dr. Ramesh Kulkarni, MD",
    "specialty": "Internal Medicine",
    "room": "OPD Room 1"
  }
]
```

### 3.3 Register Patient & Triage Encounter
* **Endpoint**: `POST /api/patients`
* **Request Body**:
```json
{
  "first_name": "Rajesh",
  "last_name": "Kumar",
  "dob": "1982-04-10",
  "gender": "MALE",
  "phone": "9876500001",
  "email": "rajesh@example.com",
  "address": "42 MG Road, Bangalore",
  "emergency_contact": "9876500002",
  "insurance_provider": "Star Health",
  "insurance_type": "CASHLESS",
  "policy_number": "POL-9921",
  "doctor_id": 2,
  "receptionist_id": 1,
  "queue_token": "Q-105",
  "chief_complaint": "Severe throbbing headaches, high fever, and knee pain",
  "vitals": {
    "systolic_bp": 160,
    "diastolic_bp": 100,
    "pulse_rate": 92,
    "temperature_f": 101.8,
    "resp_rate": 22,
    "spo2_pct": 97.0,
    "weight_kg": 78.0,
    "height_cm": 172.0
  }
}
```
* **Response (`201 Created`)**:
```json
{
  "message": "Patient registered and triaged successfully",
  "patient_id": 15,
  "visit_id": 24,
  "uhid": "UHID-2026-00015",
  "queue_token": "Q-105",
  "vitals_summary": {
    "bmi": 26.37,
    "bmi_category": "Overweight",
    "bp_stage": "Stage 2 Hypertension"
  }
}
```

### 3.4 Search Patients Directory
* **Endpoint**: `GET /api/patients?q=Rajesh&page=1&limit=20`
* **Response (`200 OK`)**: List of matching patients with visit encounter history.

### 3.5 Get Single Patient Details
* **Endpoint**: `GET /api/patients/{patient_id}`
* **Response (`200 OK`)**: Comprehensive patient master profile.

---

## 4. Group 3: Receptionist Live Counter Queue

### 4.1 Live Receptionist Queue
* **Endpoint**: `GET /api/receptionist/queue`
* **Response (`200 OK`)**: Real-time waiting list for today with automated NEWS2 early warning score and estimated wait times.
```json
{
  "total_waiting": 3,
  "queue": [
    {
      "visit_id": 24,
      "queue_token": "Q-105",
      "patient_id": 15,
      "uhid": "UHID-2026-00015",
      "full_name": "Rajesh Kumar",
      "age": 44,
      "gender": "MALE",
      "status": "TRIAGED",
      "triage_urgency": "URGENT",
      "news2_score": 4,
      "chief_complaint": "Severe throbbing headaches, high fever, and knee pain",
      "estimated_wait_minutes": 15,
      "doctor_assigned": "Dr. Ramesh Kulkarni, MD"
    }
  ]
}
```

---

## 5. Group 4: Intake Questionnaires & Diagnostic Reports

### 5.1 Submit Intake Questionnaire (FEAT-02)
* **Endpoint**: `POST /api/visits/{visit_id}/questionnaire`
* **Frontend Caller**: `questionnaire.submit(visitId, data)`
* **Request Body**:
```json
{
  "patient_id": 15,
  "answers": {
    "q1": 1,
    "q2": 0,
    "q4": 1,
    "q5": 3,
    "q6": 2,
    "q7": 1,
    "q8": 2,
    "q9": 7,
    "q10": 6,
    "q11": 6,
    "q14": 5
  },
  "voice_notes": "Patient denies chest pain and shortness of breath, reports severe headache for 5 days.",
  "allergies": ["Penicillin"],
  "comorbidities": ["CKD"]
}
```
* **Response (`200 OK`)**: Returns validated instrument scores, predicted ICD-10 conditions, and candidate WHO EML generic medicines with allergy & organ safety checks:
```json
{
  "message": "Intake questionnaire evaluated and deterministic clinical insights generated successfully",
  "visit_id": 24,
  "questionnaire_id": 12,
  "clinical_scores": {
    "phq2_score": 5,
    "phq2_positive": true,
    "gad2_score": 3,
    "gad2_positive": true,
    "peg3_average": 6.3,
    "peg3_significant_pain": true,
    "red_flag_emergency": false,
    "reported_allergies": ["PENICILLIN"],
    "reported_comorbidities": ["CKD"]
  },
  "predicted_conditions": [
    {
      "disease_code": "HYPERTENSION_STAGE2",
      "icd10_code": "I10",
      "disease_name": "Essential (Primary) Hypertension",
      "rationale": "Triage blood pressure 160/100 mmHg meets Stage 2 Hypertension criteria."
    },
    {
      "disease_code": "ACUTE_FEVER_PYREXIA",
      "icd10_code": "R50.9",
      "disease_name": "Fever / Pyrexia of Unknown Origin",
      "rationale": "Measured body temperature 101.8°F exceeds 99.5°F pyrexia threshold."
    }
  ],
  "recommended_medications": [
    {
      "inn_name": "Paracetamol",
      "strength": "650mg",
      "dosage_form": "TABLET",
      "line_of_treatment": "FIRST_LINE",
      "safety_status": "CLEAR",
      "safety_notes": "Safe for prescription based on recorded clinical profile.",
      "is_recommended": true,
      "available_brands": "Dolo 650, Calpol 650"
    },
    {
      "inn_name": "Amoxicillin",
      "strength": "500mg",
      "dosage_form": "CAPSULE",
      "safety_status": "CONTRAINDICATED",
      "safety_notes": "Blocked: Patient has known allergy to PENICILLIN class.",
      "is_recommended": false
    },
    {
      "inn_name": "Ibuprofen",
      "strength": "400mg",
      "dosage_form": "TABLET",
      "safety_status": "CONTRAINDICATED",
      "safety_notes": "Blocked: Contraindicated in chronic renal insufficiency / CKD.",
      "is_recommended": false
    }
  ],
  "insights_generated_count": 4,
  "updated_at": "2026-10-14T18:30:00"
}
```

### 5.2 Get Saved Questionnaire
* **Endpoint**: `GET /api/visits/{visit_id}/questionnaire`
* **Frontend Caller**: `questionnaire.get(visitId)`
* **Response (`200 OK`)**: Full MCQ answer dictionary (`q1`..`q20`), voice notes, clinical scores, and recommendations.

### 5.3 Upload External Diagnostic Report (DICOM, ECG, PDF, XRAY)
* **Endpoint**: `POST /api/visits/{visit_id}/reports/upload`
* **Frontend Caller**: `reports.upload(visitId, formData)`
* **Content-Type**: `multipart/form-data`
* **Form Data Fields**:
  * `file`: (binary file)
  * `report_type`: `DICOM`, `ECG`, `LAB_PDF`, `XRAY`, or `OTHER`
  * `modality`: (optional string, e.g. `"Brain MRI T2 FLAIR"`, `"12-Lead Resting ECG"`)
  * `findings_summary`: (optional extracted notes, e.g. `"Normal sinus rhythm, regular rate"`)
* **JavaScript Upload Snippet**:
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('report_type', 'DICOM');
formData.append('modality', 'Knee MRI Coronal');
formData.append('findings_summary', 'Mild medial meniscus tear.');

const res = await fetch(`/api/visits/${visitId}/reports/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  },
  body: formData
});
const data = await res.json();
```
* **Response (`201 Created`)**:
```json
{
  "message": "External report uploaded successfully",
  "report_id": 5,
  "visit_id": 24,
  "patient_id": 15,
  "file_name": "knee_mri.dcm",
  "report_type": "DICOM",
  "modality": "Knee MRI Coronal",
  "file_size_mb": 1.25,
  "file_path": "/uploads/24/1792011234_knee_mri.dcm",
  "uploaded_at": "2026-10-14T18:35:00"
}
```

### 5.4 List Archived Diagnostic Reports
* **Endpoint**: `GET /api/visits/{visit_id}/reports`
* **Frontend Caller**: `reports.list(visitId)`
* **Response (`200 OK`)**: List of uploaded files with web URLs accessible directly at `http://localhost:8000/uploads/...`.

---

## 6. Group 5: Doctor Consultation, Dossier, CDSS & Prescriptions

### 6.1 Doctor Live Queue
* **Endpoint**: `GET /api/doctor/queue?doctor_id=2`
* **Frontend Caller**: `doctorQueue.list()`
* **Response (`200 OK`)**: Patients in `TRIAGED` or `IN_CONSULTATION` sorted by arrival urgency.

### 6.2 Call Patient into Consultation Room
* **Endpoint**: `POST /api/doctor/queue/{visit_id}/call`
* **Frontend Caller**: `doctorQueue.call(visitId)`
* **Response (`200 OK`)**:
```json
{
  "message": "Patient called into consultation room",
  "visit_id": 24,
  "status": "IN_CONSULTATION",
  "consultation_started_at": "2026-10-14T18:36:00"
}
```

### 6.3 Comprehensive Patient Dossier with Clinical NegEx NLP Summary
* **Endpoint**: `GET /api/doctor/patients/{patient_id}/dossier`
* **Frontend Caller**: `dossier.get(patientId)`
* **Response (`200 OK`)**:
```json
{
  "patient": {
    "id": 15,
    "uhid": "UHID-2026-00015",
    "full_name": "Rajesh Kumar",
    "dob": "1982-04-10",
    "age": 44,
    "gender": "MALE",
    "blood_group": "B+",
    "phone": "9876500001",
    "insurance": {
      "provider": "Star Health",
      "policy_number": "POL-9921",
      "type": "CASHLESS"
    }
  },
  "active_visit": {
    "id": 24,
    "queue_token": "Q-105",
    "status": "IN_CONSULTATION",
    "chief_complaint": "Severe throbbing headaches, high fever, and knee pain",
    "doctor_assigned": "Dr. Ramesh Kulkarni, MD"
  },
  "vitals": {
    "systolic_bp": 160,
    "diastolic_bp": 100,
    "pulse_rate": 92,
    "temperature_f": 101.8,
    "resp_rate": 22,
    "spo2_pct": 97.0,
    "bmi": 26.4,
    "bp_stage": "Stage 2 Hypertension"
  },
  "reports": [ ... ],
  "past_visits": [ ... ],
  "past_prescriptions": [ ... ],
  "insights": {
    "symptomSummary": "44yo Male presents with severe knee pain, severe fever (for 5 days). Pertinent negatives: denies chest pain, shortness of breath. Objective findings: Elevated blood pressure (160/100 mmHg); Febrile state (101.8°F); Room air SpO2 97%. Intake screen alerts: PHQ-2 depression screen positive (5/6). PEG-3 significant pain index (6.3/10). Allergy: Known hypersensitivity to PENICILLIN.",
    "pertinentNegatives": ["chest pain", "shortness of breath"],
    "affirmedSymptoms": [
      { "symptom": "knee pain", "severity": "severe", "duration": "for 5 days" },
      { "symptom": "fever", "severity": "severe", "duration": "for 5 days" }
    ],
    "riskFlags": [
      {
        "id": 10,
        "rule_code": "RULE_HTN_STAGE2",
        "severity": "MEDIUM",
        "label": "Stage 2 Hypertension Flag",
        "note": "BP 160/100 mmHg meets Stage 2 Hypertension criteria.",
        "recommendation": "Initiate dual-agent pharmacotherapy and lifestyle counseling."
      }
    ]
  }
}
```

### 6.4 Evaluate CDSS Safety Rules
* **Endpoint**: `POST /api/doctor/visits/{visit_id}/insights/evaluate`
* **Frontend Caller**: `cdss.evaluate(visitId, payload)`
* **Response (`200 OK`)**: List of active clinical rule alerts (`severity_level`: `CRITICAL`, `WARNING`, `INFO`).

### 6.5 Review / Override CDSS Alert
* **Endpoint**: `PATCH /api/doctor/insights/{insight_id}`
* **Request Body**:
```json
{
  "is_reviewed": true,
  "doctor_override_notes": "Acknowledged Stage 2 HTN; initiating Amlodipine 5mg therapy."
}
```
* **Response (`200 OK`)**: `{"message": "Clinical insight review status updated", "is_reviewed": true}`

### 6.6 Search Formulary for Prescribing
* **Endpoint**: `GET /api/doctor/formulary?q=Telma&limit=20`
* **Frontend Caller**: `formulary.search(query)`
* **Response (`200 OK`)**:
```json
{
  "query": "Telma",
  "count": 1,
  "drugs": [
    {
      "id": 10,
      "brand_name": "Telma 40",
      "generic_name": "Telmisartan",
      "dosage_form": "TABLET",
      "strength": "40mg",
      "standard_dosage": "1 tablet once daily"
    }
  ]
}
```

### 6.7 Real-Time Drug-Drug Interaction (DDI) Safety Preview
* **Endpoint**: `POST /api/doctor/visits/{visit_id}/prescriptions/check-safety`
* **Request Body**: List of items before final creation:
```json
[
  { "drug_id": 10, "frequency": "1-0-0", "dosage": "40mg" },
  { "drug_id": 14, "frequency": "1-0-1", "dosage": "400mg" },
  { "drug_id": 1, "frequency": "1-0-1", "dosage": "625mg" }
]
```
* **Response (`200 OK`)**:
```json
{
  "is_safe": false,
  "has_critical": true,
  "allergy_alerts": [
    {
      "severity": "CRITICAL",
      "drug_name": "Amoxicillin + Clavulanate",
      "allergy_trigger": "PENICILLIN",
      "title": "Known Patient Allergy Alert: Amoxicillin + Clavulanate",
      "message": "Patient has documented hypersensitivity to 'PENICILLIN'. Prescribing is contraindicated."
    }
  ],
  "interactions": [
    {
      "severity": "MAJOR",
      "drug_a": "Telmisartan",
      "drug_b": "Ibuprofen + Paracetamol",
      "title": "NSAID Blunting Antihypertensive & Renal Vasoconstriction",
      "description": "NSAIDs inhibit renal prostaglandins, reducing ARB antihypertensive effect and increasing AKI risk.",
      "recommendation": "Substitute NSAID with Paracetamol for analgesia."
    }
  ],
  "duplicate_classes": [],
  "dosage_warnings": []
}
```

### 6.8 Create E-Prescription
* **Endpoint**: `POST /api/doctor/visits/{visit_id}/prescriptions`
* **Frontend Caller**: `prescriptions.create(visitId, data)`
* **Request Body**:
```json
{
  "doctor_id": 2,
  "general_instructions": "Take medicines with water after breakfast.",
  "status": "FINALIZED",
  "items": [
    {
      "drug_id": 2,
      "dosage": "1 tablet (5mg)",
      "frequency": "1-0-0",
      "duration_days": 30,
      "meal_timing": "AFTER_MEALS",
      "special_instructions": "Check BP weekly."
    },
    {
      "drug_id": 4,
      "dosage": "1 tablet (650mg)",
      "frequency": "1-0-1",
      "duration_days": 5,
      "meal_timing": "AFTER_MEALS",
      "special_instructions": "Take SOS for headache."
    }
  ]
}
```
* **Response (`201 Created`)**:
```json
{
  "message": "E-Prescription saved successfully",
  "prescription_id": 8,
  "visit_id": 24,
  "doctor_id": 2,
  "status": "FINALIZED",
  "items_count": 2,
  "items": [ ... ],
  "safety_analysis": {
    "is_safe": true,
    "has_critical": false,
    "total_alerts": 0
  }
}
```

### 6.9 Get Active Prescription
* **Endpoint**: `GET /api/doctor/visits/{visit_id}/prescriptions`
* **Frontend Caller**: `prescriptions.list(visitId)`
* **Response (`200 OK`)**: Returns saved prescription with joined brand & generic names.

### 6.10 Doctor Consultation Sign-Off
* **Endpoint**: `POST /api/doctor/visits/{visit_id}/sign-off`
* **Frontend Caller**: `signOff.submit(visitId, data)`
* **Purpose**: Locks the consultation, enforces override notes if unreviewed `CRITICAL` alerts exist, digitally signs CDSS flags, and moves visit to `READY_FOR_BILLING`.
* **Request Body**:
```json
{
  "doctor_id": 2,
  "diagnosis": "Essential Hypertension Stage 2 with Acute Viral Prodrome",
  "conclusion_notes": "Patient started on Amlodipine 5mg OD and symptomatic antipyretic. Advised low sodium diet.",
  "doctor_override_notes": "All safety flags reviewed."
}
```
* **Response (`200 OK`)**:
```json
{
  "message": "Consultation signed off and locked successfully",
  "visit_id": 24,
  "status": "READY_FOR_BILLING",
  "doctor_id": 2,
  "conclusion_notes": "Diagnosis: Essential Hypertension Stage 2 with Acute Viral Prodrome\n\nClinical Notes: Patient started on Amlodipine 5mg OD...",
  "signed_at": "2026-10-14T18:40:00",
  "next_station": "CASHIER_BILLING_DESK",
  "critical_alerts_count": 0,
  "critical_alerts_overridden": 0
}
```

---

## 7. Group 6: Cashier Billing & Checkout Subsystem

### 7.1 Cashier Waiting Queue
* **Endpoint**: `GET /api/cashier/queue`
* **Caller in `api.js`**: `cashier.queue()`
* **Response (`200 OK`)**:
```json
{
  "pending_invoices_count": 1,
  "billing_queue": [
    {
      "visit_id": 15,
      "queue_token": "Q-101",
      "uhid": "UHID-2026-00015",
      "patient_name": "Pooja Nair",
      "doctor_name": "Dr. Vikram Kulkarni, MD",
      "insurance_category": "INSURANCE",
      "ready_since": "2026-10-15T12:00:00"
    }
  ]
}
```

### 7.2 Get Itemized Bill
* **Endpoint**: `GET /api/cashier/bills/{visit_id}` (or `GET /api/bills/visit/{visit_id}`)
* **Caller in `api.js`**: `cashier.bill(visitId)`
* **Description**: Automatically computes line items:
  - Consultation Fee (₹500.00)
  - Diagnostic Archive Tariffs (₹150.00 per uploaded external scan)
  - Formulary Medications (₹60.00 per prescribed line item)
  - Insurance Coverage Deduction (80% for Private/Cashless, 100% for Ayushman Bharat PM-JAY, 0% for Cash).
* **Response (`200 OK`)**:
```json
{
  "visit_id": 15,
  "bill_id": 5,
  "uhid": "UHID-2026-00015",
  "patient_name": "Pooja Nair",
  "currency": "INR",
  "line_items": [
    {
      "item_code": "CONS_GEN",
      "item_type": "CONSULTATION",
      "description": "General Physician Consultation",
      "quantity": 1,
      "unit_rate": 500.0,
      "total_amount": 500.0
    },
    {
      "item_code": "DIAG_ARCH",
      "item_type": "DIAGNOSTIC",
      "description": "External Scan Archival & Review (12-Lead ECG Strip)",
      "quantity": 1,
      "unit_rate": 150.0,
      "total_amount": 150.0
    },
    {
      "item_code": "PHARM_01",
      "item_type": "MEDICATION",
      "description": "Amlokind 5 5mg (TABLET)",
      "quantity": 1,
      "unit_rate": 60.0,
      "total_amount": 60.0
    }
  ],
  "subtotal": 710.0,
  "tax_gst": 0.0,
  "discount": 0.0,
  "insurance_copay_deduction": 568.0,
  "net_payable": 142.0,
  "patient_payable": 142.0,
  "bill_status": "PENDING"
}
```

### 7.3 Settle Payment & Close Encounter
* **Endpoint**: `POST /api/bills/{bill_id}/payments` (or `POST /api/cashier/bills/{bill_id}/payments`)
* **Caller in `api.js`**: `cashier.pay(billId, data)`
* **Status Code**: `201 Created`
* **Request Body**:
```json
{
  "payment_mode": "UPI",
  "amount_paid": 142.0,
  "transaction_reference": "UPI-REF-99881122",
  "cashier_id": 1,
  "notes": "Paid via PhonePe QR at counter #1"
}
```
* **Response (`201 Created`)**:
```json
{
  "message": "Payment recorded and encounter closed successfully",
  "payment_id": 5,
  "receipt_number": "REC-2026-00005",
  "bill_id": 5,
  "visit_id": 15,
  "paid_amount": 142.0,
  "payment_mode": "UPI",
  "payment_timestamp": "2026-10-15T12:06:06.000000",
  "visit_status": "COMPLETED",
  "receipt_pdf_url": "/api/bills/5/receipt"
}
```

### 7.4 Printable Receipt & Financial Breakdown
* **Endpoint**: `GET /api/bills/{bill_id}/receipt`
* **Query Parameter**: `?format=html` (optional; renders a printable thermal/A4 invoice with hospital letterhead and print styles).
* **Response (`200 OK`)**:
```json
{
  "receipt_number": "REC-2026-00005",
  "bill_id": 5,
  "visit_id": 15,
  "queue_token": "Q-101",
  "issue_date": "2026-10-15T12:06:06",
  "payment_status": "PAID",
  "clinic": {
    "name": "Bright Solutions Hospital & Clinics",
    "tagline": "Excellence in Outpatient Care & Clinical Decision Support",
    "address": "Plot 42, Health City, Sector 5, Mumbai, Maharashtra 400001",
    "phone": "+91-22-2500-1122",
    "gstin": "27AAACB2233P1Z2"
  },
  "patient": {
    "uhid": "UHID-2026-00015",
    "name": "Pooja Nair",
    "insurance_type": "INSURANCE"
  },
  "financials": {
    "subtotal": 710.0,
    "discount": 0.0,
    "insurance_copay_deduction": 568.0,
    "net_payable": 142.0,
    "amount_paid": 142.0,
    "balance_due": 0.0
  },
  "payment_details": {
    "mode": "UPI",
    "transaction_ref": "UPI-REF-99881122",
    "status": "SUCCESS"
  }
}
```

---

## 8. Standard Error Formats & Status Codes

| Status Code | Meaning | Typical Scenario | Response Format |
| :--- | :--- | :--- | :--- |
| `200 OK` | Success | Normal data retrieval or update | `{"message": "...", ...}` |
| `201 Created` | Created | Patient registered, file uploaded, Rx saved, Payment settled | `{"message": "...", "id": ...}` |
| `400 Bad Request` | Business Rule Violation | Duplicate payment attempt or sign-off blocked | `{"detail": "Bill is already settled and paid."}` |
| `401 Unauthorized` | Auth Error | Missing or expired Bearer token | `{"detail": "Invalid or expired authorization token."}` |
| `404 Not Found` | Entity Missing | Patient ID or Bill ID does not exist | `{"detail": "Bill with ID 9999 not found."}` |
| `422 Unprocessable`| Schema Validation | Missing required field in JSON payload | `{"detail": [{"loc": ["body", "payment_mode"], "msg": "Field required"}]}` |

---

## 9. Summary Table of Completed Endpoints (Groups 1 to 6)

| Domain | Method | Route | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Staff authentication with JWT Bearer token |
| **Auth** | `POST` | `/api/auth/logout` | Session invalidation |
| **Tokens** | `GET` | `/api/tokens/next` | Auto-increments daily OPD queue token (`Q-101`) |
| **Patients** | `GET` | `/api/doctors` | Lists active on-duty consulting physicians |
| **Patients** | `POST` | `/api/patients` | Registers patient, assigns token, computes BMI/BP stage |
| **Patients** | `GET` | `/api/patients` | Paginated search by name, phone, or UHID |
| **Patients** | `GET` | `/api/patients/{id}` | Complete patient master card |
| **Queue** | `GET` | `/api/receptionist/queue` | Live triage counter queue with NEWS2 scores & wait time |
| **Questionnaire** | `POST` | `/api/visits/{id}/questionnaire` | Records intake responses, scores PHQ-2/GAD-2/PEG-3, masks contraindications |
| **Questionnaire** | `GET` | `/api/visits/{id}/questionnaire` | Retrieves saved MCQ responses, scores, and candidate drugs |
| **Reports** | `POST` | `/api/visits/{id}/reports/upload` | Multipart binary upload (DICOM, ECG, LAB_PDF, XRAY) |
| **Reports** | `GET` | `/api/visits/{id}/reports` | Lists archived diagnostic scans and lab sheets |
| **Doctor** | `GET` | `/api/doctor/queue` | Doctor's consultation waiting queue |
| **Doctor** | `POST` | `/api/doctor/queue/{id}/call` | Calls patient into room; status $\to$ `IN_CONSULTATION` |
| **Doctor** | `GET` | `/api/doctor/patients/{id}/dossier` | Complete dossier with offline Clinical NegEx NLP summary & risk flags |
| **Doctor** | `POST` | `/api/doctor/visits/{id}/insights/evaluate` | Evaluates Tier-1 deterministic CDSS rules |
| **Doctor** | `PATCH` | `/api/doctor/insights/{id}` | Physician override review |
| **Doctor** | `GET` | `/api/doctor/formulary` | Fast indexed search of WHO EML and trade brands |
| **Doctor** | `POST` | `/api/doctor/visits/{id}/prescriptions/check-safety` | Real-time DDI & dosage ceiling preview |
| **Doctor** | `POST` | `/api/doctor/visits/{id}/prescriptions` | Creates e-prescription with DDI safety evaluation |
| **Doctor** | `GET` | `/api/doctor/visits/{id}/prescriptions` | Retrieves finalized prescription with joined medication items |
| **Doctor** | `POST` | `/api/doctor/visits/{id}/sign-off` | Finalizes consultation, signs CDSS flags $\to$ `READY_FOR_BILLING` |
| **Cashier** | `GET` | `/api/cashier/queue` | Cashier queue of encounters in `READY_FOR_BILLING` |
| **Cashier** | `GET` | `/api/cashier/bills/{visit_id}` | Itemized invoice (consultation + scans + Rx - insurance copay) |
| **Cashier** | `POST` | `/api/bills/{bill_id}/payments` | Multi-tender payment settlement, receipt generation $\to$ `COMPLETED` |
| **Cashier** | `GET` | `/api/bills/{bill_id}/receipt` | Printable JSON/HTML receipt breakdown with clinic metadata |
