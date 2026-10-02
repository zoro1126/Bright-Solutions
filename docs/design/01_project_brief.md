# 01 — Project Brief
## CancerCare OS (COS) — Oncology Hospital Information System

---

## Elevator Pitch

CancerCare OS is an AI-powered, role-based Hospital Information System purpose-built for oncology clinics. It unifies the workflows of receptionists, oncologists, and cashiers on a single real-time platform — eliminating paper handoffs and redundant questioning — while an embedded ML/DL engine automatically transforms patient intake questionnaires into clinical insight summaries that land directly in the oncologist's dashboard before the consultation even begins.

---

## Problem Statement

Oncology consultations are time-constrained and high-stakes. Today, clinics typically:

- Duplicate patient history collection across receptionists and doctors, wasting 10–20 minutes per visit.
- Rely on disconnected paper forms or siloed software, causing data loss and billing errors.
- Force oncologists to manually interpret verbose patient history questionnaires instead of focusing on diagnosis.
- Struggle with billing complexity: insurance coverage vs. cash payment pathways are often handled in a spreadsheet or separately.

This inefficiency increases patient wait times, introduces clinical errors, and frustrates staff — in a care setting where minutes matter.

---

## Proposed Solution

COS provides three tightly integrated, role-specific dashboards (Doctor, Receptionist, Cashier) that share a single patient record in real-time:

1. **Receptionist** captures demographics, insurance details, and completes an oncology-specific intake questionnaire.
2. **ML/DL Pipeline** processes the questionnaire the moment it is submitted and pushes structured clinical insights to the Doctor dashboard.
3. **Oncologist** reviews the AI-generated patient summary, views DICOM scans, writes prescriptions, and drafts the patient conclusion letter — all in one place.
4. **Cashier** generates itemised bills automatically, applying insurance deductibles or cash rates, with multiple payment view options.

---

## Target Users

| Persona | Description | Key Need |
|---|---|---|
| **Dr. (Oncologist)** | Senior clinical physician seeing 15–30 patients/day | Fast, reliable patient context; no re-asking history; integrated tools in one screen |
| **Receptionist** | Front-desk staff who onboard patients | Structured data entry; guided questionnaire; instant feedback when ML is done |
| **Cashier** | Billing staff at clinic exit | Accurate, auto-populated bill; insurance vs. cash toggle; printable receipt |
| **Clinic Administrator** | Optional — oversees all three roles | Audit trail; aggregate analytics; user management |

---

## Success Metrics

- ⏱️ Average oncologist pre-consultation prep time reduced by **≥ 50%**
- 📋 Questionnaire-to-insight delivery latency **< 30 seconds**
- 💰 Billing errors reduced to **< 1%** of processed bills
- 🔄 Zero data re-entry between Receptionist → Doctor → Cashier workflows
- 🏥 System supports **≥ 50 concurrent patient sessions** without performance degradation
- 📈 Oncologist satisfaction score (NPS) **≥ 70** within 3 months of deployment

---

## Out of Scope (v1)

- Patient-facing mobile app or patient portal
- Multi-clinic / enterprise-wide federated deployment
- Integration with external national health registries (e.g., NABH, HL7 FHIR live feeds)
- Pharmacy management or drug dispensing module
- Video telemedicine / teleconsultation

---

## Assumptions & Risks

| Assumption / Risk | Mitigation |
|---|---|
| DICOM files are already stored on a PACS server or local disk accessible to the clinic's network | Use Cornerstone.js DICOM renderer; abstract PACS adapter |
| ML models are pre-trained and available as inference endpoints | Design a model-server abstraction; support local (ONNX) and hosted (REST) inference |
| Clinic staff have basic computer literacy | Provide guided, step-by-step UI with contextual help tooltips |
| Insurance data structure varies per provider | Define a flexible, schema-driven insurance input form with custom field support |
| Real patient data requires strict data privacy compliance | Architect for HIPAA/DPDP-style data-at-rest and data-in-transit encryption from day one |
| Network reliability within the clinic may be variable | Support offline-first local caching with background sync |
