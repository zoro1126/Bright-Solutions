# Feature Specification: Modular AI SaaS Architecture

## 1. Modular Service Catalog Overview

The platform decouples healthcare workflows into **8 autonomous microservices**, each packaged with its own domain logic, persistence layer, API contract, and HL7 FHIR R4 adapter. A customer may subscribe to any single service or bundle any combination into a unified portal.

```
+--------------------------------------------------------------------------------------------------+
|                                    API Gateway & Reverse Proxy                                   |
|                        (Traefik / Kong — Tenant Resolution & Entitlement Check)                   |
+--------------------------------------------------------------------------------------------------+
          |                      |                      |                     |
          v                      v                      v                     v
+--------------------+ +--------------------+ +--------------------+ +--------------------+
| 1. Tenant &        | | 2. Ambient AI      | | 3. AI CDSS         | | 4. AI Patient      |
|    Entitlement Svc | |    Clinical Scribe | |    Guideline Engine| |    Intake & Triage |
| (Auth, Metering)   | | (Voice-to-SOAP, Rx)| | (Rules + Med LLM)  | | (Chatbot, Scoring) |
+--------------------+ +--------------------+ +--------------------+ +--------------------+
          |                      |                      |                     |
          v                      v                      v                     v
+--------------------+ +--------------------+ +--------------------+ +--------------------+
| 5. Medical Doc &   | | 6. Smart Billing & | | 7. Clinical EHR    | | 8. Queue &         |
|    Lab Intelligence| |    Revenue Auditor | |    Core Service    | |    Appointments    |
| (OCR, Vector RAG)  | | (Coding, Claims)   | | (Encounters, Rx)   | | (Tokens, Schedule) |
+--------------------+ +--------------------+ +--------------------+ +--------------------+
          |                      |                      |                     |
          +----------------------+----------------------+---------------------+
                                 | Event Bus (RabbitMQ / Kafka)
                                 v
                 [ Asynchronous Domain Event Stream ]
```

---

## 2. Detailed Service Specifications

### Module 1: Tenant, Identity & Entitlement Service (`svc-tenant-identity`)
- **Description**: The administrative backbone managing tenant organizations, user identities, role-based access control (RBAC), subscription plans, module entitlements, API keys, and usage meters.
- **Standalone Rental Role**: Automatically provisioned for all accounts; provides the API Gateway with tenant verification, API key authentication, and rate limiting.
- **Key Features**:
  - Multi-tenant organization hierarchies (Health System -> Hospital -> Department -> Clinic).
  - Fine-grained RBAC with predefined clinical roles (`DOCTOR`, `NURSE`, `RECEPTIONIST`, `BILLING_ADMIN`, `TENANT_ADMIN`, `SUPERADMIN`).
  - Cryptographically signed JWT tokens embedding active `entitlements: ["ai-scribe", "cdss", "billing"]`.
  - Granular API Key provisioning with scoping per microservice for hospital IT teams.
  - Asynchronous usage metering (audio processing minutes, LLM tokens, processed visits, storage bytes).
- **Acceptance Criteria**:
  - [ ] Generates scoped JWT access and refresh tokens with tenant ID and subscribed module claims.
  - [ ] Gateway blocks unauthorized requests to non-subscribed microservices with `403 Forbidden: Module Not Subscribed`.
  - [ ] Records API usage events asynchronously to Redis buffer and flushes to billing audit tables.
  - [ ] Supports custom SSO (SAML 2.0 / OIDC / OAuth2) for enterprise hospital directories (e.g., Azure AD).

---

### Module 2: Ambient AI Clinical Scribe Service (`svc-ai-scribe`)
- **Description**: Listens to real-time doctor-patient outpatient consultations via ambient microphone audio, filters background noise, transcribes the conversation with medical vocabulary adaptation, and synthesizes structured clinical notes (SOAP format: Subjective, Objective, Assessment, Plan) with auto-coded ICD-10 and SNOMED-CT recommendations.
- **Standalone Rental Role**: Can be purchased independently by hospitals with existing EHRs (e.g., Epic/Cerner) as a SMART on FHIR browser extension or background desktop widget that posts generated notes into the hospital's EHR via FHIR `DocumentReference`.
- **Key Features**:
  - Real-time audio streaming over secure WebSockets with chunked buffer ingestion.
  - Medical speech-to-text (Whisper Large v3 / Deepgram Nova-2 Medical) fine-tuned on clinical terminology.
  - Multi-speaker diarization distinguishing physician, patient, and attendant dialogue.
  - Automatic SOAP synthesis, extracting Chief Complaints, History of Present Illness (HPI), Review of Systems, Physical Exam observations, Differential Diagnosis, and Treatment Orders.
  - Auto-suggested prescription lines (Drug Name, Dosage, Frequency, Duration, Instructions).
  - Explicit physician review, inline editing, and electronic signature gate prior to permanence.
- **Acceptance Criteria**:
  - [ ] Audio stream receives 16kHz PCM/WAV chunks and delivers intermediate transcript within 1.5 seconds.
  - [ ] Generates complete SOAP note markdown within 5 seconds of session conclusion.
  - [ ] Automatically maps diagnosed conditions to standard ICD-10-CM codes with confidence scores.
  - [ ] Exposes FHIR R4 endpoint `POST /fhir/R4/DocumentReference` for seamless EHR push.
  - [ ] Zero raw audio persistence policy toggle for strict HIPAA-compliant zero-data-retention clients.

---

### Module 3: AI Clinical Decision Support System (CDSS) Service (`svc-ai-cdss`)
- **Description**: A dual-tier diagnostic and patient safety intelligence engine that evaluates patient vitals, active symptoms, medical history, and prescribed medications in real-time. Combines deterministic clinical guideline rules (AHA, ADA, NICE) with medical LLMs to highlight critical red flags, drug-drug interactions, and evidence-based diagnostic pathways.
- **Standalone Rental Role**: Rented by hospitals to add automated clinical safety scrubbing to existing EHR prescription and triage workflows via simple REST/FHIR hooks.
- **Key Features**:
  - Deterministic vital sign safety evaluator (Hypertensive Crisis, Severe Sepsis / qSOFA, Hypoxemia, Tachycardia, Malignant Hyperthermia).
  - Drug-Drug Interaction (DDI) and Drug-Allergy interaction checker against clinical knowledge bases.
  - LLM-assisted Differential Diagnosis generator providing top 3–5 probable diagnoses ranked with rationale and recommended diagnostic tests.
  - Real-time clinical guidance alerts categorized into `CRITICAL_ALERT` (blocking modal), `WARNING` (amber banner), and `INFO` (sidebar tip).
  - Physician feedback capture mechanism (Accept, Dismiss, Override with Reason) for continuous audit and model calibration.
- **Acceptance Criteria**:
  - [ ] Deterministic rules evaluate in < 25 milliseconds upon vital sign or prescription update.
  - [ ] Detects known contraindications (e.g., ACE inhibitors + ARBs, or penicillin allergy + amoxicillin prescription) and raises critical alert.
  - [ ] LLM differential diagnostic suggestions cite established clinical practice guidelines.
  - [ ] Implements HL7 CDS Hooks standard (`medication-prescribe`, `patient-view`) for native EHR integration.

---

### Module 4: AI Patient Intake & Triage Service (`svc-ai-intake`)
- **Description**: An automated, multilingual conversational AI patient intake portal accessible via clinic QR code, SMS/WhatsApp link, or waiting room tablet. Conducts a structured clinical interview, translates non-English responses, and computes an automated Emergency Severity Index (ESI 1–5) triage score before the patient enters the consultation room.
- **Standalone Rental Role**: Rented by outpatient clinics and hospital emergency departments to eliminate front-desk registration queues and digitize medical intake without changing backend EHRs.
- **Key Features**:
  - Adaptive conversational interview adjusting follow-up questions dynamically based on reported chief complaints (e.g., chest pain triggers onset, radiation, dyspnea, and cardiac history probes).
  - Multi-language support (English, Hindi, Spanish, Marathi, etc.) with real-time bidirectional translation to the physician's preferred clinical language.
  - Automated Acuity & Triage level computation (ESI Level 1–5: Resuscitation to Non-Urgent).
  - Pre-consultation summary card prepared for the doctor's dashboard before patient entry.
- **Acceptance Criteria**:
  - [ ] Intake session accessible via dynamic mobile web link without requiring patient app download.
  - [ ] Flags emergency keywords (e.g., severe chest pain, stroke symptoms, acute shortness of breath) with immediate audio/visual alert at the nurse triage station.
  - [ ] Publishes `Encounter` and `Observation` events to the message bus upon intake submission.
  - [ ] Syncs intake summary directly to doctor's active patient consultation view.

---

### Module 5: Medical Document & Lab RAG Intelligence Service (`svc-ai-doc-intel`)
- **Description**: A multimodal document understanding and Retrieval-Augmented Generation (RAG) microservice that ingests external patient records, historical lab PDFs, radiology reports, and discharge summaries. Extracts structured clinical biomarkers and allows physicians to query a patient's historical dossier using natural language.
- **Standalone Rental Role**: Rented by multi-specialty diagnostic centers and hospitals to index paper/PDF records and provide instant clinical search over multi-year patient histories.
- **Key Features**:
  - Multimodal OCR (LayoutLMv3 / Vision API) extracting tables, lab test names, numeric values, reference ranges, and abnormal indicator flags (High/Low).
  - Vector embedding pipeline (OpenAI `text-embedding-3-small` / `bge-base-en-v1.5`) stored in PostgreSQL `pgvector`.
  - Conversational Doctor Assistant ("Did this patient ever have elevated creatinine or cardiac stent placement in the last 3 years?").
  - Exact source attribution: Responses include highlighted bounding boxes on original PDF pages.
- **Acceptance Criteria**:
  - [ ] Extracts standard lab panels (CBC, Lipid, LFT, KFT, HbA1c) into structured JSON with >95% field accuracy.
  - [ ] Vector similarity search executes in < 150ms using HNSW indexing in `pgvector`.
  - [ ] Rejects out-of-context medical queries and enforces strict tenant and patient isolation boundaries.

---

### Module 6: Smart Billing & Revenue Cycle Auditor Service (`svc-ai-billing`)
- **Description**: A comprehensive healthcare billing, tariff management, and automated coding audit microservice. Automatically validates clinical notes against billing items to identify unbilled services, suggest compliant ICD-10 and CPT codes, and predict insurance claim denial risks before submission.
- **Standalone Rental Role**: Rented by hospital finance and insurance desks to reduce claim rejection rates and audit medical coding compliance.
- **Key Features**:
  - Configurable tariff and service master (consultation fees, lab investigations, procedures, room charges).
  - Multi-payer support (Self-Pay/Cash, Private Health Insurance, Government Schemes/Ayushman Bharat).
  - Automated AI Coding Auditor: Cross-references physician SOAP notes with invoice line items to detect missing billable procedures or mismatched diagnosis codes.
  - Claim Denial Risk Scorer: Flags missing pre-authorizations, inconsistent patient demographics, or policy coverage lapses with an actionable risk score (Low, Medium, High).
  - Split billing, cashier reconciliation, receipt generation, and payment gateway integration (Stripe, Razorpay, UPI).
- **Acceptance Criteria**:
  - [ ] Generates itemized invoices with real-time tax and insurance discount calculations.
  - [ ] Flags unbilled procedures detected in doctor's notes with one-click "Add to Invoice" recommendation.
  - [ ] Pre-audit claim checks generate actionable warnings for known insurer rejection triggers.
  - [ ] Exposes FHIR R4 `Claim` and `Coverage` resource endpoints.

---

### Module 7: Core Clinical EHR & Visit Management Service (`svc-clinical-core`)
- **Description**: Manages patient longitudinal master health records, demographic registries, outpatient encounters/visits, vital signs, physical exam templates, and digital prescription lifecycles.
- **Standalone Rental Role**: Core service used when a clinic or hospital adopts HealthOS as their primary outpatient operating system.
- **Key Features**:
  - Master Patient Index (MPI) with unique health identifier (UHID) generation and deduplication.
  - Outpatient encounter lifecycle: `REGISTERED` -> `TRIAGED` -> `IN_CONSULTATION` -> `READY_FOR_BILLING` -> `COMPLETED`.
  - Digital prescription builder with drug formulation autocomplete, dosage frequency calculator, and refill tracking.
  - Clinical audit trails logging all record accesses, updates, and signatures in compliance with HIPAA §164.312.
- **Acceptance Criteria**:
  - [ ] Enforces atomic state transitions on visits preventing invalid skips.
  - [ ] Signs and locks clinical notes post-consultation to ensure tamper-proof legal record keeping.
  - [ ] Supports full REST CRUD operations with sub-100ms response times.

---

### Module 8: Outpatient Queue & Appointment Management Service (`svc-queue-appointments`)
- **Description**: Orchestrates clinic front-desk operations, doctor outpatient schedules, slot bookings, token number allocation, waitlist prioritization, and live waiting-room display boards.
- **Standalone Rental Role**: Rented by busy clinics and outpatient departments to streamline physical walk-ins and appointment flow.
- **Key Features**:
  - Dynamic token generation algorithms balancing pre-booked appointments and physical walk-in patients.
  - Real-time WebSocket pub/sub broadcasting queue updates to waiting-room TV displays and patient smartphones.
  - Doctor status dashboard (Available, In Consultation, On Break, Delayed).
  - SMS/WhatsApp automated queue notifications ("You are 2 patients away; please proceed to Room 4").
- **Acceptance Criteria**:
  - [ ] Issues sequential queue tokens with automated specialty and doctor routing.
  - [ ] Waiting-room TV display view updates within 500ms of doctor calling the next patient.
  - [ ] Supports real-time cancellation, no-show tagging, and priority emergency bumping.

---

## 3. Nice-to-Have Features (Post-MVP)
- Telehealth WebRTC encrypted video consultation module with integrated ambient scribing.
- Outpatient Pharmacy & Inventory dispensing microservice with automated purchase orders.
- Direct wearable integration (Apple Health, Fitbit, continuous glucose monitors) streaming into AI CDSS.
- Autonomous voice AI bot for outbound post-discharge patient follow-up calls.

---

## 4. Explicitly Excluded Features
- Inpatient (IPD) ward bed allocation, nurse shift scheduling, and ICU telemetry tracking.
- Surgical theater equipment sterilization logs.
- Direct serial-port blood analyzer device driver hardware interfaces.
- Proprietary radiology PACS storage server (platform links to existing PACS via DICOMweb links).
