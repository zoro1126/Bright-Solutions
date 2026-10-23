# D1 — Product Requirements Document (PRD)
## ClinicOS: Clinical Hospital Operating System

> **Document ID:** D1  
> **Version:** 1.0  
> **Status:** DRAFT — Pending Client Sign-off  
> **Prepared By:** Bright Solutions Engineering Team  
> **Last Updated:** October 2026  
> **Review Cycle:** Updated at each Shaped Kanban cool-down  

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Problem Statement](#2-problem-statement)
3. [Target Users & Personas](#3-target-users--personas)
4. [Product Goals & Success Metrics](#4-product-goals--success-metrics)
5. [MVP Scope — 4-Week Prototype](#5-mvp-scope--4-week-prototype)
6. [Full Product Scope — Post-MVP Phases](#6-full-product-scope--post-mvp-phases)
7. [Explicit Out-of-Scope (MVP)](#7-explicit-out-of-scope-mvp)
8. [Functional Requirements by Module](#8-functional-requirements-by-module)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Compliance & Regulatory Requirements](#10-compliance--regulatory-requirements)
11. [Patient Identity Model](#11-patient-identity-model)
12. [Data Migration](#12-data-migration)
13. [Deployment Model](#13-deployment-model)
14. [Team Structure & Responsibilities](#14-team-structure--responsibilities)
15. [Assumptions & Risks](#15-assumptions--risks)
16. [Open Questions — Pending Client Confirmation](#16-open-questions--pending-client-confirmation)
17. [Glossary](#17-glossary)

---

## 1. Product Overview

**ClinicOS** is a hospital clinical operating system built for Indian healthcare facilities, designed to replace legacy HIS platforms (EClinical, Gemini HIS, Vishual HIS). It provides a unified platform for managing the full patient journey — from registration at reception through OPD/IPD workflows, clinical consultation with NABH-compliant documentation, pathology orders, e-prescriptions, and billing.

The platform is architected as a **multi-tenant SaaS** from the foundation, but the first 4-week delivery is a **single-tenant prototype** for the initial hospital client, running in a staging environment and subsequently deployed on-premise.

**Core stack:**
- **Backend:** Python / FastAPI  
- **Database:** MySQL (InnoDB) — *MVP constraint*
- **Frontend:** React 18 + Vite (Vanilla CSS)
- **Staging:** Contabo LAMP server at `clinicalservices.paperbirdtech.com` (subdomain), root at `~/public_html/clinicalservices.paperbirdtech.com/`
- **Auth:** OAuth 2.0 with JWT (full user management, per-staff accounts, role-based access)

---

## 2. Problem Statement

Indian hospitals — especially mid-size (50–500 bed) facilities — are currently managing clinical workflows through one of three inadequate solutions:

1. **Paper-based systems** — manual OPD registers, handwritten prescriptions, physical lab slips, no searchability, no audit trail, NABH non-compliant.

2. **Legacy HIS platforms** (EClinical, Gemini HIS, Vishual HIS) — installed on outdated hardware, poor UI/UX, no AI-assisted clinical decision support, not designed for ABDM integration, expensive customization.

3. **Fragmented tools** — separate billing software, separate pathology software, separate OPD register, no unified patient record.

The impact:
- OPD queues are managed manually — patients wait without knowing their status.
- Doctors write prescriptions on paper; no ICD-10 coding for NABH compliance.
- Lab orders are physical slips; results are manually entered or lost.
- NABH accreditation is impossible without structured clinical documentation.
- ABDM / ABHA integration is absent — hospitals cannot participate in India's national health mission.
- Foreign patients require separate FRRO documentation — currently handled on paper.

**ClinicOS solves this** with a unified, NABH-aware, ABDM-ready hospital operating system that a small team can deploy in weeks and staff can learn in days.

---

## 3. Target Users & Personas

### 3.1 Primary Users (Day-to-Day Operators)

| Persona | Department | Core Workflow | Key Pain Points |
|:---|:---|:---|:---|
| **Receptionist / Front Desk** | Reception | Register new/follow-up patients, assign OPD/IPD numbers, manage walk-in queue, collect referred-by info, capture photo + ABHA + FRRO details | Manual paper registers, no queue visibility, no ABHA lookup |
| **Triage Nurse** | OPD Triage | Record vital signs (BP, pulse, temp, SpO2, weight, height, BMI), administer intake questionnaire, flag emergency patients | Vitals written on paper, no ESI/acuity scoring |
| **Consulting Doctor (MO/Specialist)** | OPD / Consultant Room | View patient queue, review vitals + questionnaire, write SOAP notes, assign ICD-10 codes, create e-prescription, sign consultation | Typing burden, no DDI alerts, no ICD-10 lookup |
| **IPD Admissions Officer** | IPD Desk | Admit patient, assign UHID + bed, create IPD file, link to consulting doctor | Separate admission register, no link to OPD history |
| **Pathology Lab Technician** | Laboratory | Receive lab orders from OPD/IPD, enter results, flag abnormal values | Paper lab slips, manual result entry into separate system |
| **Billing Officer** | Billing | Generate OPD/IPD bill, record payment (cash/UPI/card/insurance), print receipt | No itemized billing tied to clinical orders, manual calculation |
| **Medical Records / HR / Admin** | Admin | Manage staff accounts, view reports, manage department configurations | No central staff management, no audit trail |

### 3.2 Secondary Users (Oversight & Management)

| Persona | Role | Need |
|:---|:---|:---|
| **Hospital Administrator / CMO** | Management | Dashboard visibility — OPD throughput, billing revenue, queue wait times, department utilization |
| **SaaS Platform Operator (Bright Solutions)** | Superadmin | Tenant provisioning, license management, system health monitoring |

---

## 4. Product Goals & Success Metrics

### 4.1 Business Goals

| Goal | Metric | Target |
|:---|:---|:---|
| Replace paper-based OPD register | % of registrations done digitally | 100% within 2 weeks of go-live |
| Reduce patient waiting room confusion | Average time from token issue to doctor call notification visible to patient | < 5 minutes visibility lag |
| Enable NABH accreditation documentation | % of consultations with ICD-10 code assigned + doctor sign-off | > 95% |
| ABDM readiness | ABHA number captured at registration | > 80% of new patients |
| Reduce billing errors | Billing reconciliation discrepancy rate | < 2% |

### 4.2 Technical Goals

- **MVP delivery:** Full clinical workflow — including AI/CDSS/NLP features — functional and deployed on staging in 4 weeks.
- **AI features:** NLP-based consultation summaries, CDSS deterministic insights from vitals + questionnaire, and questionnaire-driven differential suggestions are **in scope for the 4-week MVP**.
- **Multi-tenant architecture:** Data model and service layers designed for multi-tenancy from Cycle 1, even if MVP is single-tenant.
- **Compliance foundation:** Audit logging, PHI access tracking, and NABH documentation fields present from day one.
- **Data migration readiness:** Schema and tooling ready to import from legacy HIS (specific system TBD — see Open Questions).

---

## 5. MVP Scope — 4-Week Prototype

The 4-week MVP delivers a **full clinical web app** covering the complete OPD + basic IPD patient journey including AI-assisted clinical features, deployed on the staging server at `clinicalservices.paperbirdtech.com`.

### 5.1 What the MVP Delivers

```
Week 1: Foundation
├── Auth system (OAuth2/JWT, staff accounts, department roles)
├── Patient Registration module (UHID, OPD/IPD numbering, demographics)
├── ABHA number field, Aadhaar number field, FRRO fields (Passport + Visa)
├── Multiple contact fields (mobile1, mobile2, emergency contact)
├── Categorized address (city + area + full address)
├── Patient photo (webcam capture + file upload)
├── Referred-by field
└── Database schema (MySQL) + API foundation

Week 2: OPD + IPD Core
├── OPD queue management (new vs. follow-up, token generation, call patient)
├── OPD number — globally auto-incrementing per visit
├── IPD admission + UHID assignment
├── Vital signs entry (nurse triage station)
├── Intake questionnaire (structured symptom collection)
└── Department routing (OPD, IPD, Pathology)

Week 3: Clinical + AI + Pathology
├── Doctor consultation workspace (SOAP notes, ICD-10 code search + assignment)
├── E-prescription (drug + dosage + frequency + duration + instructions)
├── Prescription print (PDF + thermal printer format, NABH-compliant letterhead)
├── Drug-Drug Interaction (DDI) deterministic checks
├── CDSS — deterministic insights from vitals + questionnaire responses
├── NLP-based consultation summary (auto-summarizes SOAP note into plain-language summary)
├── Questionnaire-driven differential suggestion (rule-based, not LLM)
├── Pathology lab order entry (from OPD/IPD doctor)
├── Pathology result entry + normal/abnormal flagging
└── Referred-by report linkage

Week 4: Billing + AI Polish + Stabilization
├── OPD/IPD billing (itemized charges, payment modes: cash/UPI/card/insurance)
├── Receipt print (PDF)
├── AI feature integration testing + edge case hardening
├── Bug fixes + end-to-end integration testing
├── Staff user management UI (Admin panel)
└── Staging deployment + client walkthrough
```

### 5.2 MVP Module Checklist

| Module | Included in MVP | Priority |
|:---|:---:|:---|
| Patient Registration (UHID, demographics, photo, ABHA, Aadhaar, FRRO) | ✅ | P0 |
| Multiple contact numbers | ✅ | P0 |
| Categorized address (city + area) | ✅ | P0 |
| Referred-by field | ✅ | P0 |
| OPD number (globally auto-incrementing per visit) | ✅ | P0 |
| OPD queue (new + follow-up, token, call system) | ✅ | P0 |
| IPD admission + bed assignment (basic) | ✅ | P0 |
| Vital signs entry | ✅ | P0 |
| Intake questionnaire | ✅ | P0 |
| Doctor consultation + SOAP notes | ✅ | P0 |
| ICD-10 code search + assignment | ✅ | P0 |
| E-Prescription + print (PDF + thermal) | ✅ | P0 |
| Pathology — lab order entry | ✅ | P1 |
| Pathology — result entry + flagging | ✅ | P1 |
| Billing — OPD/IPD itemized bill + receipt print | ✅ | P1 |
| Staff user management + RBAC | ✅ | P0 |
| FRRO fields (Passport, Visa number, nationality) | ✅ | P0 |
| **AI/NLP consultation summaries** | ✅ Week 3 | P1 |
| **CDSS deterministic insights (vitals + questionnaire)** | ✅ Week 3 | P1 |
| **Questionnaire-driven differential suggestion** | ✅ Week 3 | P1 |
| **ABDM live API integration** | ❌ Post-MVP | P3 |
| **OT / Anaesthetic notes** | ❌ Post-MVP | P3 |
| **Multitenancy (admin provisioning)** | ❌ Architecture only | — |

---

## 6. Full Product Scope — Post-MVP Phases

After the 4-week MVP (which includes core AI/CDSS), development continues in Shaped Kanban cycles:

| Phase | Cycles | Scope |
|:---|:---|:---|
| **Phase 1: AI Upgrade** | Weeks 5–6 (1 cycle) | LLM-powered SOAP note generation, Ambient AI Scribe (audio → transcript → SOAP), advanced CDSS with LLM differential diagnosis cards |
| **Phase 2: ABDM Integration** | Cycle 3 | ABHA ID verification via ABDM sandbox API, Health Facility Registry enrollment, Health Information Exchange (consent-based record sharing) |
| **Phase 3: OT & Anaesthetic** | Cycle 4 | OT scheduling, pre-operative checklist, anaesthetic notes, post-op vitals |
| **Phase 4: Full Multi-Tenancy** | Cycle 4–5 | Tenant provisioning, per-hospital config, billing across tenants, Superadmin panel |
| **Phase 5: Enterprise Features** | Cycle 5–6 | HR module, Maintenance management, NABH quality audit module, advanced reporting, SMART on FHIR / HL7 FHIR R4 endpoints |

---

## 7. Explicit Out-of-Scope (MVP)

The following are explicitly **not** in the 4-week MVP:

- Live ABDM/ABHA API calls (data field captured, API integration deferred)
- OT / Anaesthetic module
- HR module (leave management, payroll)
- Maintenance department module
- Native mobile apps (iOS/Android)
- WhatsApp / SMS patient notifications
- Insurance pre-authorization workflows
- Advanced reporting / analytics dashboard
- Multitenancy provisioning UI (architecture supports it, UI not built)
- Data migration tooling (pending confirmation of source system)
- LLM-powered AI Scribe / audio transcription (Phase 1 post-MVP)
- SMART on FHIR / HL7 FHIR R4 endpoints

---

## 8. Functional Requirements by Module

### 8.1 Patient Registration

**Actor:** Receptionist  
**Trigger:** Patient walks in or calls for appointment

| ID | Requirement | Priority |
|:--|:---|:---:|
| REG-01 | System generates a **UHID** (Unique Health ID) for each new patient — permanent, never reused | P0 |
| REG-02 | System generates an **OPD number** that is unique per day and auto-increments (e.g., OPD-231026-001) | P0 |
| REG-03 | System generates an **IPD number** per IPD admission (separate from OPD number, per-admission) | P0 |
| REG-04 | Collect: First name, last name, date of birth, gender, blood group | P0 |
| REG-05 | Collect: **Multiple contact numbers** (Primary mobile, secondary mobile, emergency contact name + relation + number) | P0 |
| REG-06 | Collect: **Categorized address** — House/flat no., street, **Area** (dropdown or typeahead), **City** (dropdown), State, PIN code | P0 |
| REG-07 | Collect: **ABHA Number** (14-digit) — optional field, not validated via API in MVP | P0 |
| REG-08 | Collect: **Aadhaar Number** — masked storage (last 4 digits visible) | P0 |
| REG-09 | Collect: **Patient Photo** — webcam capture (preferred) with file upload fallback (JPG/PNG) | P0 |
| REG-10 | Collect: **Referred by** — free text OR lookup from existing doctor/facility list | P0 |
| REG-11 | **New vs. Follow-up** flag — system checks UHID/phone to identify returning patients | P0 |
| REG-12 | **FRRO fields** for foreign nationals: Nationality, Passport Number, Visa Number, Visa Type, Visa Expiry Date | P0 |
| REG-13 | Religion, marital status, occupation — optional fields | P1 |
| REG-14 | Receptionist can edit registration details after initial entry (with audit log) | P1 |
| REG-15 | Patient registration generates a printable **Patient Card / Token slip** | P1 |

### 8.2 OPD Queue Management

**Actor:** Receptionist, Triage Nurse, Doctor

| ID | Requirement | Priority |
|:--|:---|:---:|
| OPD-01 | OPD queue displays real-time token list with patient name, token number, status (Waiting / In Triage / With Doctor / Done) | P0 |
| OPD-02 | Receptionist assigns patient to a **Doctor** and **Department** at registration time | P0 |
| OPD-03 | Doctor can see their own queue only; Nurse sees all patients in triage | P0 |
| OPD-04 | System tracks **New vs. Follow-up** per OPD visit | P0 |
| OPD-05 | Follow-up links to previous chief complaint and last consultation | P0 |
| OPD-06 | Doctor calls next patient with one click (token advances to "With Doctor") | P0 |
| OPD-07 | Waiting room display mode — shows currently called token (public-facing, no patient name, token only) | P1 |
| OPD-08 | Receptionist can reorder or skip tokens (with reason logged) | P1 |

### 8.3 Vital Signs & Triage

**Actor:** Nurse / Triage Staff

| ID | Requirement | Priority |
|:--|:---|:---:|
| VIT-01 | Enter: Systolic BP, Diastolic BP, Pulse rate, Temperature (°F), SpO2 (%), Respiratory rate, Weight (kg), Height (cm) | P0 |
| VIT-02 | BMI auto-calculated from weight + height | P0 |
| VIT-03 | Vital signs flagged as **Normal / Warning / Critical** based on hardcoded reference ranges | P0 |
| VIT-04 | Vitals linked to encounter — one vitals record per visit | P0 |
| VIT-05 | Structured intake questionnaire (chief complaint, symptom checklist, duration, severity) | P0 |
| VIT-06 | Questionnaire responses stored as structured JSON for AI processing in Phase 1 | P0 |

### 8.4 Doctor Consultation

**Actor:** Doctor (Medical Officer / Consultant / Specialist)

| ID | Requirement | Priority |
|:--|:---|:---:|
| CON-01 | Doctor sees patient's: registration details, vitals, questionnaire answers, and all previous encounter summaries | P0 |
| CON-02 | SOAP note entry: Subjective (chief complaint, history), Objective (examination findings), Assessment (diagnosis), Plan (treatment plan) | P0 |
| CON-03 | **ICD-10 code** search and assignment — mandatory for NABH-compliant encounter sign-off | P0 |
| CON-04 | Multiple ICD-10 codes per encounter (primary diagnosis + secondary/comorbidities) | P0 |
| CON-05 | Doctor signs and locks the consultation — locked encounters cannot be edited | P0 |
| CON-06 | Doctor can add **clinical notes** / free text in addition to structured SOAP | P1 |
| CON-07 | Doctor can order **follow-up** (date, same doctor or any doctor in department) | P1 |
| CON-08 | Doctor can refer patient internally to another department (generates referral record) | P1 |

### 8.5 E-Prescription

**Actor:** Doctor

| ID | Requirement | Priority |
|:--|:---|:---:|
| RX-01 | Add drugs by name (free text + typeahead from local drug database) | P0 |
| RX-02 | Per drug: Dosage (mg/ml), Frequency (OD/BD/TID/QID/SOS), Duration (days), Route (oral/IV/topical), Instructions (before/after food) | P0 |
| RX-03 | Drug-Drug Interaction (DDI) check — deterministic alerts from local rules | P0 |
| RX-04 | Prescription locked when consultation is signed | P0 |
| RX-05 | **Print Rx** — PDF download with: clinic letterhead, patient demographics, date, doctor name + license number + signature block, drug table, NABH-required fields | P0 |
| RX-06 | **Thermal printer format** — condensed Rx slip for 80mm thermal printers | P1 |
| RX-07 | Schedule H/H1 controlled substance flagging on prescription (CDSCO requirement) | P1 |

### 8.6 IPD Admission

**Actor:** IPD Admissions Officer

| ID | Requirement | Priority |
|:--|:---|:---:|
| IPD-01 | Create IPD admission record linked to existing patient UHID | P0 |
| IPD-02 | Assign **IPD number** — auto-incremented per admission (not per day) | P0 |
| IPD-03 | Assign ward, bed number, admitting doctor | P0 |
| IPD-04 | IPD admission date/time, tentative discharge date | P0 |
| IPD-05 | Admitting diagnosis (ICD-10), admission type (Emergency / Elective / Transfer) | P0 |
| IPD-06 | IPD patients appear in doctor's inpatient list separately from OPD queue | P1 |

### 8.7 Pathology (Laboratory)

**Actor:** Doctor (orders), Lab Technician (results)

| ID | Requirement | Priority |
|:--|:---|:---:|
| PATH-01 | Doctor creates lab order from OPD consultation or IPD notes | P0 |
| PATH-02 | Lab order contains: test name, urgency (routine/urgent/STAT), specimen type, ordering doctor | P0 |
| PATH-03 | Lab tech receives order in pathology queue | P0 |
| PATH-04 | Lab tech enters results: test name, observed value, unit, reference range low/high | P0 |
| PATH-05 | Results auto-flagged: **Normal / High / Low / Critical** vs reference range | P0 |
| PATH-06 | Completed results visible to ordering doctor in patient's encounter | P0 |
| PATH-07 | Lab result report print (PDF) with hospital letterhead | P1 |
| PATH-08 | Pathology test catalog managed by admin (test name, reference ranges, unit, price) | P1 |

### 8.8 Billing

**Actor:** Billing Officer

| ID | Requirement | Priority |
|:--|:---|:---:|
| BILL-01 | Generate itemized OPD bill from: consultation fee + lab orders + procedure charges | P0 |
| BILL-02 | Generate itemized IPD bill from: admission charges + daily room rate + procedures + lab + pharmacy | P0 |
| BILL-03 | Payment modes: Cash, UPI, Debit/Credit Card, Insurance | P0 |
| BILL-04 | Partial payment / split payment support | P1 |
| BILL-05 | Print receipt (PDF) — with GST breakdown if applicable | P0 |
| BILL-06 | Bill status: Draft → Confirmed → Paid / Partially Paid / Refunded / Written Off | P0 |
| BILL-07 | Configurable tariff catalog (service code, name, default price, category) managed by admin | P0 |
| BILL-08 | Discount entry with reason (requires authorization for amounts above threshold) | P1 |

### 8.9 Authentication & User Management

**Actor:** Hospital Admin / Superadmin

| ID | Requirement | Priority |
|:--|:---|:---:|
| AUTH-01 | OAuth 2.0 + JWT — individual user accounts per staff member | P0 |
| AUTH-02 | Departments: OPD, IPD, Pathology, Billing, Reception, Pharmacy, Radiology, Admin, HR, Maintenance | P0 |
| AUTH-03 | Roles: Superadmin, Hospital Admin, Doctor (MO/Consultant), Nurse, Receptionist, Lab Technician, Billing Officer, Pharmacist, Radiology Technician, HR Staff | P0 |
| AUTH-04 | Each role has predefined module access (RBAC matrix defined in D8 Security Spec) | P0 |
| AUTH-05 | Password reset, account lock after 5 failed attempts | P0 |
| AUTH-06 | All logins and data access logged for audit trail | P0 |
| AUTH-07 | Admin UI to create/edit/deactivate staff accounts, assign roles, assign departments | P0 |
| AUTH-08 | Session timeout after configurable inactivity period (default: 30 minutes) | P1 |

---

## 9. Non-Functional Requirements

| Category | Requirement |
|:---|:---|
| **Performance** | OPD registration page loads in < 2 seconds; Queue updates in < 1 second; ICD-10 search returns in < 500ms |
| **Availability** | Staging environment: 95% uptime. Production on-prem: 99.5% (hospital working hours) |
| **Security** | AES-256 encryption at rest for PHI fields; TLS 1.3 in transit; Aadhaar masked; all PHI access logged |
| **Scalability** | Database and service layers designed for multi-tenant from day one even if MVP is single-tenant |
| **Browser Support** | Chrome 120+, Firefox 120+, Edge 120+. Mobile responsive (tablets at nurse/reception desks) |
| **Print** | PDF generation for prescriptions, lab reports, receipts. Thermal printer (80mm) support for Rx + tokens |
| **Audit Trail** | Every create/update/delete on clinical records logged with: user_id, timestamp, action, before/after values |
| **Data Integrity** | UHID uniqueness enforced at DB level. OPD number uniqueness per day enforced at DB level |
| **Language** | English only for MVP UI and printouts |
| **Database** | MySQL (InnoDB) — MVP constraint. Schema designed for future PostgreSQL migration |

---

## 10. Compliance & Regulatory Requirements

### 10.1 NABH (National Accreditation Board for Hospitals & Healthcare Providers)

| NABH Standard | Area | ClinicOS Implementation |
|:---|:---|:---|
| **IMS.1** | Unique patient identification | UHID mandatory, non-reusable |
| **IMS.2** | Standardized clinical documentation | Structured SOAP notes, mandatory ICD-10 coding |
| **IMS.3** | Medical record completeness | Consultation sign-off required before billing |
| **MOM.1** | Formulary & prescription safety | Drug-drug interaction (DDI) checks on prescription |
| **MOM.2** | Controlled substance tracking | Schedule H/H1 flags on Rx (CDSCO) |
| **COP.1** | Clinical protocols documented | CDSS rules + deterministic alerts (Phase 1 AI) |
| **PAT.1** | Patient rights — consent | Consent capture at registration (post-MVP) |

### 10.2 ABDM (Ayushman Bharat Digital Mission)

| Component | MVP Status | Post-MVP Plan |
|:---|:---|:---|
| **ABHA Number field** | ✅ Field captured at registration | API verification via ABDM sandbox — Cycle 3 |
| **ABHA Number display** | ✅ Shown on patient card | — |
| **Health Facility Registry** | ❌ Not in MVP | Facility enrollment — Cycle 3 |
| **HIE-CM consent + record share** | ❌ Not in MVP | Consent framework — Cycle 3 |

### 10.3 DPDP Act 2023 (Digital Personal Data Protection Act)

| Requirement | Implementation |
|:---|:---|
| **Aadhaar masking** | Only last 4 digits displayed; full number encrypted at rest |
| **Purpose limitation** | PHI fields tagged with clinical purpose; billing access to minimum necessary |
| **Audit logging** | Every PHI access logged (user, timestamp, record accessed) |
| **Data principal rights** | Patient data export endpoint (post-MVP) |

### 10.4 IT Act 2000 & MCI Guidelines

| Standard | Implementation |
|:---|:---|
| E-prescription as legal document | Doctor license number mandatory on Rx; digital sign-off timestamp |
| Prescription sign-off | Doctor must electronically sign before prescription prints |

---

## 11. Patient Identity Model

This is a critical design decision to align on before development starts.

```
PATIENT
└── UHID: UUID — Permanent, lifetime unique per person across all visits
    │
    ├── OPD VISITS (0..*)
    │   └── OPD Number: Auto-increment per day — e.g. OPD-231026-001
    │       (Globally auto-incrementing. Each visit = new OPD number, even same day)
    │
    └── IPD ADMISSIONS (0..*)
        └── IPD Number: Auto-increment per admission — e.g. IPD-001, IPD-002
            (Does NOT reset per day. Unique globally per hospital)
```

**Key rules:**
- A patient gets **one UHID** for life, assigned at first registration.
- Each OPD visit generates a **new OPD number** (global auto-increment, no date reset — multiple visits on the same day each get a distinct OPD number).
- Each IPD admission generates a **new IPD number** (global sequence, not date-scoped).
- OPD and IPD numbers are separate sequences — OPD-001 and IPD-001 can coexist for different patients.
- Follow-up OPD visits get a new OPD number but are linked to the same UHID and optionally to the original encounter.

---

## 12. Data Migration

**Status:** ⚠️ Source system not yet confirmed.

The hospital client is currently using one of the following (to be confirmed):
- EClinical / Gemini HIS system
- Vishual HIS

**Migration scope for MVP:** TBD pending client confirmation. Tentative plan:
- Phase 1: Export existing patient registry (name, phone, UHID equivalent if any) and import as ClinicOS patients.
- Phase 2: Historical encounter data — assess feasibility post-MVP.

**Action Required:** Confirm with client which system is currently live and obtain a data export sample before end of Week 1.

---

## 13. Deployment Model

### 13.1 MVP Staging Environment

| Property | Value |
|:---|:---|
| **Environment** | Contabo LAMP server (shared hosting) |
| **URL** | `clinicalservices.paperbirdtech.com` (subdomain) |
| **Server Root** | `~/public_html/clinicalservices.paperbirdtech.com/` |
| **Config** | `.htaccess` at server root |
| **Database** | MySQL — hosted on same Contabo server |
| **Auth** | JWT tokens, HTTPS enforced |
| **Access** | Development team + client stakeholder for review |

### 13.2 Post-MVP On-Premise Deployment

- **Target:** Hospital's own server room.
- **Method:** Docker Compose (single-server on-prem bundle).
- **Data isolation:** All patient data stays on hospital premises.
- **Sync:** Optional cloud sync for backup and AI features (to be designed in Cycle 5).
- **Infrastructure planning:** Deferred until after 4-week prototype is accepted.

### 13.3 Future Multi-Tenant SaaS

- Architecture from day one supports multi-tenancy (tenant-aware data model, isolated schemas).
- Multi-tenant provisioning UI and Superadmin panel: Post-MVP (Cycle 4–5).

---

## 14. Team Structure & Responsibilities

| Role | Person | Responsibilities |
|:---|:---|:---|
| **Backend Lead (Senior Dev 1)** | You | FastAPI services, MySQL schema, business logic, DDI engine, CDSS rules, auth middleware, API design |
| **Frontend Lead (Senior Dev 2)** | Senior frontend dev | React 18 + Vite app, component architecture, UI/UX decisions, design system, all frontend pages |
| **Junior Dev (Backend)** | 1 junior | Small, isolated backend tasks under Backend Lead review: utility endpoints, data validation rules, test writing |
| **Junior Dev (Frontend)** | 1–2 juniors | Isolated UI components under Frontend Lead review: forms, tables, print templates, basic pages |

**Coding norms for juniors:**
- Juniors implement features from a clearly defined spec with acceptance criteria (no ambiguity).
- All junior PRs reviewed by respective senior before merge.
- Juniors never touch auth middleware, core database migrations, or billing logic unsupervised.
- Pair programming sessions 2–3x per week (senior + junior) for knowledge transfer.

---

## 15. Assumptions & Risks

| ID | Assumption / Risk | Severity | Mitigation |
|:--|:---|:---:|:---|
| **R1** | 4-week timeline with 10 core modules + 2 junior devs is very aggressive | 🔴 High | Strict scope discipline: AI features deferred to week 5–6; no gold-plating; daily async check-ins to catch blockers |
| **R2** | Source system for data migration not yet confirmed | 🟡 Medium | Confirm in Week 1; migration is not a blocker for MVP — fresh start is acceptable |
| **R3** | Follow-up doctor routing logic (same doctor vs. department-based) not finalized | 🟡 Medium | Default to same doctor; build as configurable field; confirm with client before Week 2 |
| **R4** | Contabo LAMP server may have Python/FastAPI constraints (shared hosting) | 🟡 Medium | Validate server supports WSGI/ASGI or use a FastAPI-compatible process manager; have fallback plan to run backend on a VPS |
| **R5** | Client may expand scope mid-development | 🟡 Medium | All scope changes require written confirmation and go through the Shaped Kanban pitch process; no informal ad-hoc feature adds |
| **R6** | Junior devs may need significant onboarding time | 🟡 Medium | Prepare Developer Onboarding Guide (D14) and Coding Standards (D15) in Week 1 before juniors start coding |
| **R7** | FRRO data handling — foreign patient data may have additional privacy requirements | 🟠 Medium-High | Store passport/visa data encrypted; minimum necessary access; confirm legal requirements with client's legal counsel |
| **R8** | ICD-10 code database must be bundled locally (no external API dependency) | 🟢 Low | Load full ICD-10 India Edition 2023 dataset into MySQL at setup; searchable via indexed text search |

---

## 16. Open Questions — Pending Client Confirmation

| # | Question | Owner | Target Date |
|:--|:---|:---|:---|
| **OQ-1** | Which HIS is currently live at the hospital — EClinical, Gemini HIS, or Vishual HIS? And is data migration required for MVP? | Backend Lead | Week 1 Day 1 |
| **OQ-2** | Follow-up patient routing: always same doctor, or configurable per department? | Backend Lead | Week 1 Day 3 |
| **OQ-3** | OPD number format: is `OPD-YYMMDD-NNN` format acceptable, or does the client have a preferred prefix (e.g., hospital abbreviation)? | Backend Lead | Week 1 Day 1 |
| **OQ-4** | Thermal printer model at the hospital? (affects Rx + token print format dimensions) | Frontend Lead | Week 2 |
| **OQ-5** | Are there existing staff accounts to import, or will all staff be created fresh in ClinicOS? | Backend Lead | Week 1 |
| **OQ-6** | NABH accreditation: is the hospital currently NABH-accredited, applying, or planning to apply? This affects how strictly NABH documentation fields must be enforced. | Backend Lead | Week 1 |
| **OQ-7** | Is the Referred-by field a free text field, or should it link to a pre-populated list of referring doctors / facilities? | Frontend Lead | Week 1 |
| **OQ-8** | Pathology test catalog: does the hospital have an existing test list with prices we should import? | Backend Lead | Week 1 |

---

## 17. Glossary

| Term | Definition |
|:---|:---|
| **UHID** | Unique Health Identifier — lifetime unique ID assigned to a patient across all visits to the hospital |
| **OPD Number** | Outpatient Department number — assigned per OPD visit, globally auto-incrementing (no date reset; multiple visits on the same day each receive a unique OPD number) |
| **IPD Number** | Inpatient Department number — assigned per admission, globally auto-incrementing |
| **NABH** | National Accreditation Board for Hospitals & Healthcare Providers — Indian hospital accreditation body |
| **ABDM** | Ayushman Bharat Digital Mission — India's national digital health initiative |
| **ABHA** | Ayushman Bharat Health Account — 14-digit national health ID for every Indian citizen |
| **FRRO** | Foreigners Regional Registration Office — Indian government registration for foreign nationals; requires passport + visa details |
| **ICD-10** | International Classification of Diseases, 10th Revision — standard diagnostic coding system |
| **SOAP** | Subjective / Objective / Assessment / Plan — standard clinical note structure |
| **DDI** | Drug-Drug Interaction — clinical safety check when multiple drugs are prescribed together |
| **CDSCO** | Central Drugs Standard Control Organisation — regulates Schedule H/H1 controlled substance prescriptions |
| **HIS** | Hospital Information System — legacy software category that ClinicOS replaces |
| **MO** | Medical Officer — junior-level hospital doctor |
| **ESI** | Emergency Severity Index — 5-level triage acuity scoring system (1=most critical, 5=non-urgent) |
| **DPDP Act** | Digital Personal Data Protection Act 2023 — India's primary personal data protection law |
