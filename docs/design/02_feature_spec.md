# 02 — Feature Specification
## CancerCare OS (COS) — Oncology Hospital Information System

---

## Core Features (MVP)

---

### Feature 1 — Patient Registration & Demographics (Receptionist)

**Description**: Receptionist creates a new patient record by entering personal, contact, and emergency contact information.

**User Value**: Single source of truth for patient identity; pre-populates all downstream forms.

**Acceptance Criteria**:
- [ ] Fields: Full Name, DOB, Gender, MRN (auto-generated), Address, Phone, Emergency Contact
- [ ] Form validates required fields before submission
- [ ] Duplicate patient detection by phone number / name + DOB
- [ ] Patient record is immediately visible in Doctor and Cashier dashboards upon creation
- [ ] Record timestamped with receptionist user ID

---

### Feature 2 — Insurance Details Capture (Receptionist)

**Description**: Receptionist enters the patient's insurance provider, policy number, coverage tier, and applicable deductible.

**User Value**: Eliminates manual billing lookup; Cashier receives pre-filled insurance context.

**Acceptance Criteria**:
- [ ] Supports "No Insurance / Cash Pay" as a selection
- [ ] Fields: Provider Name, Policy Number, Group Number, Coverage %, Deductible Amount, Pre-Auth Number (optional)
- [ ] Insurance data auto-attached to patient visit record
- [ ] Cashier dashboard reads insurance data to auto-calculate patient liability

---

### Feature 3 — Oncology Intake Questionnaire (Receptionist)

**Description**: A structured, guided multi-step questionnaire covering oncology-specific history (chief complaint, symptoms, prior treatments, family history, lifestyle factors, current medications).

**User Value**: Replaces paper forms; provides structured input to the ML pipeline.

**Acceptance Criteria**:
- [ ] Multi-step wizard with progress indicator (at least 6 sections)
- [ ] Sections: Chief Complaint, Symptom Timeline, Prior Diagnoses & Treatments, Family Cancer History, Current Medications, Lifestyle (smoking, alcohol, diet, exercise)
- [ ] Supports both single-choice, multi-choice, free-text, and numeric input types
- [ ] "Save & Continue Later" draft mode supported
- [ ] On final submission, an event is dispatched to the ML inference pipeline
- [ ] Submission confirmation shown with estimated insight delivery time (< 30 s)

---

### Feature 4 — ML/DL Insight Generation Pipeline (Backend)

**Description**: On questionnaire submission, structured data is sent to an ML inference endpoint that produces: cancer risk indicators, symptom flags, medication interaction warnings, and a plain-language patient summary.

**User Value**: Gives the oncologist an AI-generated head start, reducing history-taking time by 50%+.

**Acceptance Criteria**:
- [ ] Inference triggered automatically on questionnaire submit
- [ ] Pipeline completes and pushes results to Doctor dashboard within 30 seconds
- [ ] Insight output schema: { risk_flags[], symptom_summary, medication_warnings[], recommended_investigations[], plain_language_summary }
- [ ] Real-time push notification displayed on Doctor dashboard ("Insights ready for [Patient Name]")
- [ ] Model abstraction layer supports swapping inference backend (ONNX local / REST remote)
- [ ] Insights are versioned per visit; historical insights are retained

---

### Feature 5 — Oncologist Dashboard — Patient Queue & Overview (Doctor)

**Description**: The doctor sees a live queue of today's patients with status indicators (Waiting, In Consultation, Insights Ready, Complete).

**User Value**: Reduces cognitive overhead of managing patient flow; instant context switching.

**Acceptance Criteria**:
- [ ] Patient queue sorted by appointment time
- [ ] Status badges: Waiting | Insights Ready | In Consultation | Done
- [ ] Click patient to open their full consultation workspace
- [ ] Queue updates in real-time without page refresh

---

### Feature 6 — Patient History Summary View (Doctor)

**Description**: A structured, readable summary of the patient's demographics, insurance, prior visits, and intake questionnaire responses.

**User Value**: Eliminates re-reading raw form data; surfaces key facts in seconds.

**Acceptance Criteria**:
- [ ] Displays: Patient demographics, chief complaint, symptom timeline, prior diagnoses, medications, family history, lifestyle
- [ ] Collapsible sections for each category
- [ ] Previous visit summaries accessible as a timeline
- [ ] Exported to PDF on demand

---

### Feature 7 — ML Insights Viewer (Doctor)

**Description**: A dedicated panel displaying the AI-generated insights: risk flags, symptom analysis, medication warnings, and plain-language patient summary.

**User Value**: Converts raw questionnaire data into clinically actionable signals at a glance.

**Acceptance Criteria**:
- [ ] Risk flags displayed with severity colour coding (Low / Medium / High)
- [ ] Plain-language patient summary displayed prominently
- [ ] Medication interaction warnings listed with drug names
- [ ] Recommended investigations shown as a checklist (doctor can tick off or dismiss)
- [ ] Doctor can annotate or dismiss individual insights
- [ ] "Regenerate Insights" button available

---

### Feature 8 — DICOM Viewer (Doctor)

**Description**: An integrated DICOM image viewer for reviewing CT, MRI, PET scans and pathology slides linked to the patient's record.

**User Value**: No switching to external PACS viewer; scans and clinical context in one screen.

**Acceptance Criteria**:
- [ ] Load DICOM files from a configured PACS path or local upload
- [ ] Windowing (brightness/contrast), zoom, pan, and slice navigation controls
- [ ] Supports multi-series (CT volume stacks, MRI sequences)
- [ ] Measurement tools: linear distance, angle, ROI area
- [ ] Annotation pinning on scan frames
- [ ] Full-screen mode

---

### Feature 9 — Prescriptioner (Doctor)

**Description**: A structured prescription module where the oncologist selects or types medications, dosages, frequencies, and duration.

**User Value**: Structured, legible prescriptions; auto-attached to patient record; feeds into billing.

**Acceptance Criteria**:
- [ ] Drug search with autocomplete (formulary database or free-text)
- [ ] Fields: Drug Name, Dose, Route, Frequency, Duration, Special Instructions
- [ ] Multiple drugs per prescription
- [ ] Prescription signed with doctor's digital ID and timestamp
- [ ] Prescription auto-attached to visit record; PDF export available
- [ ] Medication list feeds into Cashier for billing (optional billable items)

---

### Feature 10 — Conclusion Draft (Doctor)

**Description**: An editable rich-text document pre-populated with AI-generated draft text summarising diagnosis impression, investigation recommendations, and treatment plan, which the doctor finalises and issues to the patient.

**User Value**: Saves 5–10 minutes of documentation per patient; ensures consistent output format.

**Acceptance Criteria**:
- [ ] Pre-populated using ML insight summary + doctor's prescription + investigation checklist
- [ ] Rich-text editor (bold, italics, bullet lists, headings)
- [ ] Doctor can edit any section before finalising
- [ ] Finalised conclusion locked with doctor's signature and timestamp
- [ ] PDF generation and print-ready output
- [ ] Automatically triggers Cashier to mark the visit as "Ready for Billing"

---

### Feature 11 — Billing & Invoicing (Cashier)

**Description**: Cashier generates an itemised bill for the patient visit, applying insurance deductibles or a full cash rate depending on the patient's coverage.

**User Value**: Accurate, audit-ready bills with no manual calculation; faster patient checkout.

**Acceptance Criteria**:
- [ ] Auto-populated with: consultation fee, investigation charges, medication items, procedure codes
- [ ] Insurance mode: shows covered amount, deductible, patient liability separately
- [ ] Cash mode: full itemised bill with clinic's standard rate
- [ ] Cashier can add/remove line items manually
- [ ] Payment status: Pending | Partially Paid | Paid
- [ ] Receipt PDF generation with clinic letterhead
- [ ] Bill linked to patient visit record for audit trail

---

### Feature 12 — Real-Time Cross-Dashboard Data Sync

**Description**: All patient data changes (registration, questionnaire, insights, prescription, conclusion, billing) are propagated instantly to all logged-in dashboard users via WebSocket / SSE.

**User Value**: Eliminates "refresh to see updates" friction; staff always see current patient state.

**Acceptance Criteria**:
- [ ] Data changes reflected across all dashboards within 2 seconds
- [ ] Optimistic UI updates on the originating dashboard
- [ ] Conflict resolution: last-write-wins with visual alert on concurrent edits
- [ ] Offline mode gracefully queues changes and syncs on reconnect

---

## Nice-to-Have Features (Post-MVP)

- Appointment scheduling module with calendar view
- SMS / WhatsApp notification to patient when insights are ready
- Radiology report generation using DL-based scan analysis
- Drug interaction checker using a live pharmacopoeia API
- Voice-to-text dictation for the Conclusion Draft
- Multi-language questionnaire (Hindi, Tamil, etc.)
- Clinic-level analytics dashboard (visits/day, revenue, insight accuracy feedback)
- Integration with NABH / ABDM health ID
- Role: Clinic Administrator with full audit log and user management

---

## Explicitly Excluded Features (v1)

- Patient self-service portal or mobile app
- Pharmacy dispensing or inventory management
- Lab equipment integration (LIS)
- Video telemedicine
- Multi-branch / chain-clinic federation
- Automated insurance claims submission
