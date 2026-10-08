# Bright Solutions — Frontend Incremental PR Roadmap & To-Do List

**Target Subsystem**: `frontend/` (React 18, Vite, Vanilla CSS Design System, Lucide React)  
**Strict Git Isolation Rule**: **Frontend developers MUST ONLY create/edit files inside `frontend/` and `docs/FRONTEND_PR_LIST.md`. NEVER touch `backend/`.**  
This isolation guarantees that branch rebases (`git rebase origin/main`) remain completely free of merge conflicts with backend development.

---

## 1. Design & Typography Contract Reminder

All frontend PRs must strictly adhere to the brand design system:
- **Primary Color**: **Canary / Radiant Yellow** (`#FFE500` / `#FACC15`), text in dark high-contrast `#051A30`.
- **Framing Complementary**: Midnight Navy (`#0A2540` / `#051A30`), Gold/Ochre Support (`#B89C14`), Vivid Red Alert (`#DC2626`).
- **Headings (`<h1>` through `<h6>`)**: [Libre Baskerville](https://fonts.google.com/specimen/Libre+Baskerville) (Serif).
- **Body, Controls, Tables & Buttons**: [DM Sans](https://fonts.google.com/specimen/DM+Sans) (Sans-Serif).
- **Breathable UI Philosophy**: Zero vanity gauges, zero unexplained numbers, generous whitespace, high scannability.

---

## 2. Developer Git Discipline & Workflow Protocol

1. **Branch Naming Standard**: `feat/fe-<component-or-page-name>` (e.g. `feat/fe-mcq-questionnaire`)
2. **Rebase Protocol**:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
3. **Commit Message Standard**: Conventional Commits format (`feat(frontend): ...`, `fix(frontend): ...`, `chore(frontend): ...`).
4. **One PR = One Atomic Unit**: Max 1–2 component files per PR, under 250 lines of logic.
5. **Local Verification**:
   ```bash
   cd frontend
   npm run build # Validates JSX and bundle syntax
   npm run dev   # Check UI in browser at http://localhost:3000
   ```

## 3. Dynamic Routing & On-Demand Data Fetching Standard (Zero Hidden DB Hits)

1. **Separation of Routes & Mandatory `/api/` Backend Calls**:
   - **Frontend SPA Routes**: Clean, semantic client URL routes without `/api/`:
     - Receptionist: `/receptionist/dashboard`, `/receptionist/intake`, `/receptionist/intake/questionnaire`, `/receptionist/reports`, `/receptionist/queue`
     - Doctor: `/doctor/dashboard`, `/doctor/patient/:id`, `/doctor/viewer/:visitId`, `/doctor/consultation/:visitId`
     - Cashier: `/cashier/dashboard`, `/cashier/checkout/:visitId`
     - Admin: `/admin/dashboard`, `/admin/users`
   - **Backend API Requests**: Every HTTP fetch request originating from `frontend/services/api.js` **MUST strictly use the `/api/` prefix** (`/api/visits/*`, `/api/patients/*`, `/api/doctor/*`, `/api/cashier/*`, etc.), routed through Vite's dev server proxy to port `8000`.

2. **On-Demand Data Fetching Rule ("Zero Hidden DB Hits")**:
   - **Components must NEVER make network or DB requests while unmounted, hidden, or in the background.**
   - **Lazy-Load Modal & Page Data**:
     - Do NOT prefetch questionnaire data until `QuestionnaireModal` opens.
     - Do NOT fetch scans / PDF buffers until `DiagnosticViewerModal` opens.
     - Do NOT execute CDSS safety checks until the doctor explicitly enters `ConsultationRoomModal`.
     - Do NOT load billing invoice breakdowns until the cashier clicks `Checkout`.
   - **Polling Hygiene**: Active queue polling (e.g. 15s interval) MUST pause when:
     - The browser tab is hidden (`document.visibilityState === 'hidden'`).
     - A full-screen modal or separate sub-route is active.
   - **Clean Unmounts**: Use `AbortController` or cancel flags in `useEffect` cleanup functions to discard in-flight requests when navigating away.

---

## 4. Frontend PR Implementation Queue

```
[PR-FE-01] API Client Extension: Endpoints for Questionnaire, Reports, CDSS & Billing
   ↓
[PR-FE-02] P-REC-03: Clinical Intake MCQ Questionnaire Modal with Voice Dictation
   ↓
[PR-FE-03] P-REC-04: External Diagnostic Reports Ingestion Modal (DICOM, ECG, PDF)
   ↓
[PR-FE-04] P-REC-05: Dedicated Live OPD Patient Queue & Token Roster View
   ↓
[PR-FE-05] P-DOC-01: Doctor Clinical Dashboard & Triage Risk Stratification
   ↓
[PR-FE-06] P-DOC-02: Patient Dossier Modal with MCQ Intake Review Card
   ↓
[PR-FE-07] P-DOC-03: Diagnostic Media Canvas Viewer (DICOM, ECG Waveform & PDF)
   ↓
[PR-FE-08] P-DOC-04: CDSS Safety Alerts & Formulary E-Prescription Studio
   ↓
[PR-FE-09] P-CSH-01 to P-CSH-03: Cashier Dashboard, Itemized Checkout & Thermal Receipt
   ↓
[PR-FE-10] P-ADM-01 to P-ADM-03: Admin Executive Analytics & Staff Provisioning Portal
```

---

## 5. Atomic PR Specifications

### [PR-FE-01] API Client Extension: Endpoints for Questionnaire, Reports, CDSS & Billing
- **Scope**: `frontend/services/api.js`
- **Objective**: Add strongly-typed client helper functions for upcoming backend routes:
  - `saveQuestionnaire(visitId, payload)` & `getQuestionnaire(visitId)`
  - `uploadExternalReport(visitId, formData)` & `getReports(visitId)`
  - `getDoctorQueue()`, `getDoctorInsights(visitId)`, `signDoctorEncounter(visitId, data)`
  - `searchFormulary(query)`, `createPrescription(visitId, payload)`
  - `getCashierQueue()`, `getBillForVisit(visitId)`, `recordPayment(billId, payload)`
  - `getAdminAnalytics()`, `createStaffUser(userData)`
- **Verification**: Import into a test script or console, confirm endpoints point correctly through `/api` Vite proxy.
- **Commit Message**:
  ```git
  feat(frontend): extend api service layer with questionnaire, cdss, and cashier endpoints
  ```

---

### [PR-FE-02] P-REC-03: Clinical Intake MCQ Questionnaire Modal with Voice Dictation
- **Scope**: `frontend/components/QuestionnaireModal.jsx`, `frontend/App.jsx`
- **Depends On**: `PR-FE-01`
- **Objective**: Standardized anamnesis MCQ grid for active patient encounter.
- **Key Details**:
  - 2-column card grid for screening questions ($Q_1 \dots Q_{12}$ extensible to $Q_{20}$).
  - Mutually exclusive radio option chips mapped to integer indices: `(0) None / Absent`, `(1) Mild`, `(2) Moderate`, `(3) Severe`.
  - Linear progress bar showing answered count (e.g. `8/12 Answered`).
  - Web Speech API microphone button streaming live transcript into `voice_notes` textarea.
  - Canary Yellow CTA submitting payload `{ patient_id, answers: { q1: 0, q2: 1, ... }, voice_notes }`.
- **Verification**: Launch questionnaire modal from patient queue row, choose options, record voice note, verify submit API call.
- **Commit Message**:
  ```git
  feat(frontend): implement clinical intake mcq questionnaire modal with voice dictation
  ```

---

### [PR-FE-03] P-REC-04: External Diagnostic Reports Ingestion Modal
- **Scope**: `frontend/components/ReportsUploadModal.jsx`
- **Depends On**: `PR-FE-01`
- **Objective**: File dropzone allowing receptionist to archive patient external tests.
- **Key Details**:
  - Drag-and-drop zone supporting `.dcm`, `.pdf`, `.png`, `.jpg`.
  - Modality toggle pills: `DICOM Scan`, `ECG Waveform`, `Lab Bloodwork`, `Discharge Summary`.
  - Visual upload progress bar and file size display.
  - Submits via `multipart/form-data` calling `api.uploadExternalReport`.
- **Verification**: Drop sample PDF and image, select modality, verify upload confirmation badge.
- **Commit Message**:
  ```git
  feat(frontend): create external diagnostic reports upload modal with modality classifier
  ```

---

### [PR-FE-04] P-REC-05: Dedicated Live OPD Patient Queue & Token Roster View
- **Scope**: `frontend/components/LiveQueueRoster.jsx`
- **Depends On**: `PR-FE-01`
- **Objective**: Dedicated high-density queue monitoring screen with token reprint slip.
- **Key Details**:
  - Filter tabs: `All Tokens`, `Waiting Consultation`, `In Room`, `Completed`.
  - Row badges: Token ID (`#Q-102`), UHID, Doctor name, AHA BP Stage color pill.
  - 1-click `Print Slip` button triggering browser print dialog for patient token slip.
- **Verification**: Switch filter tabs, verify active patient count updates, test print slip format.
- **Commit Message**:
  ```git
  feat(frontend): implement live queue roster view with status filters and token reprint action
  ```

---

### [PR-FE-05] P-DOC-01: Doctor Clinical Dashboard & Triage Risk Stratification
- **Scope**: `frontend/components/DoctorDashboardView.jsx`, `frontend/App.jsx`
- **Depends On**: `PR-FE-01`
- **Objective**: Physician cockpit showing actionable metrics and prioritized patient queue.
- **Key Details**:
  - Hero Card: `Next Patient in Line` with chief complaint and BP stage with 1-click `Call into Room` button.
  - Minimalist KPI cards: Waiting Patients, Avg Consultation Duration (`10.4 mins`), Triage Alerts.
  - Graph 1: Triage Risk Stratification bar chart (Normal, Stage 1 HTN, Stage 2 HTN, Crisis).
  - Graph 2: Top OPD Diagnoses horizontal bar ranking.
  - Prioritized queue table with high-risk patients pinned at top in red accent.
- **Verification**: Switch active persona to `Dr. Vikram Kulkarni`, verify doctor dashboard renders with zero visual clutter.
- **Commit Message**:
  ```git
  feat(frontend): implement doctor clinical dashboard with triage risk breakdown and queue
  ```

---

### [PR-FE-06] P-DOC-02: Patient Dossier Modal with MCQ Intake Review Card
- **Scope**: `frontend/components/PatientDossierModal.jsx`
- **Depends On**: `PR-FE-05`
- **Objective**: Longitudinal health record viewer for physician before examination.
- **Key Details**:
  - Demographic header with UHID, verified phone, and age/gender.
  - High-visibility `Allergies Warning Banner` with vivid red/yellow chips.
  - 6-metric vitals pill strip: BP, Pulse, Temp, SpO2, BMI, Respiratory rate.
  - `IntakeQuestionnaireReviewCard`: Clean collapsible card displaying numerical MCQ screening answers ($Q_1 \dots Q_{20}$) mapped to human-readable option labels alongside receptionist voice notes.
  - Past visits timeline with historical doctor notes.
- **Verification**: Click any patient in Doctor queue, verify vitals strip and questionnaire answers display properly.
- **Commit Message**:
  ```git
  feat(frontend): add patient longitudinal dossier modal with mcq intake review card
  ```

---

### [PR-FE-07] P-DOC-03: Diagnostic Media Canvas Viewer (DICOM, ECG & PDF)
- **Scope**: `frontend/components/DiagnosticViewerModal.jsx`
- **Depends On**: `PR-FE-06`
- **Objective**: In-browser diagnostic inspection of radiological scans and cardiac waveforms.
- **Key Details**:
  - Tab toolbar toggling between uploaded DICOM, ECG traces, and Lab PDFs.
  - HTML5 Canvas DICOM viewer with window level (contrast/brightness) slider and slice scroll.
  - Medical millimeter-grid pink canvas plotting 12-lead ECG voltage waveforms.
  - Embedded PDF preview pane for lab blood panels.
- **Verification**: Open viewer modal, test canvas contrast adjusters and waveform rendering.
- **Commit Message**:
  ```git
  feat(frontend): build diagnostic media viewer with html5 dicom canvas and ecg waveform renderer
  ```

---

### [PR-FE-08] P-DOC-04: CDSS Safety Alerts & Formulary E-Prescription Studio
- **Scope**: `frontend/components/ConsultationRoomModal.jsx`
- **Depends On**: `PR-FE-06`
- **Objective**: Physician clinical assessment, deterministic safety validation, and e-prescribing.
- **Key Details**:
  - Assessment: Diagnosis search and clinical examination notes textarea.
  - Deterministic CDSS Banner: Evaluates vitals and allergy contraindications; alerts tagged `CRITICAL` require override notes to proceed.
  - Drug Formulary Search: Autocomplete dropdown searching approved clinic medicines.
  - Prescription item builder: Dosage, frequency (OD, BD, TDS), duration, and food timing chips.
  - Radiant Yellow Sign-off CTA locking prescription and transitioning patient to billing.
- **Verification**: Trigger a mock penicillin allergy conflict, verify critical banner blocks sign-off until override note is supplied.
- **Commit Message**:
  ```git
  feat(frontend): create cdss clinical safety banner and formulary e-prescription studio
  ```

---

### [PR-FE-09] P-CSH-01 to P-CSH-03: Cashier Dashboard, Itemized Checkout & Thermal Receipt
- **Scope**: `frontend/components/CashierDashboardView.jsx`, `frontend/components/BillingCheckoutModal.jsx`
- **Depends On**: `PR-FE-08`
- **Objective**: Front-desk billing, itemized invoice calculation, insurance copay, and thermal receipt print.
- **Key Details**:
  - Cashier Dashboard: Today's OPD collection total, Cash vs UPI vs Card breakdown, and Ready for Billing table.
  - Checkout Modal: Itemized line items (Consultation, diagnostic reports, prescribed pharmacy medicines), discount input, insurance copay deduction, and payment method selector.
  - Thermal Receipt Slip: 80mm monospace printable slip with QR code placeholder and clinic header.
- **Verification**: Open billing checkout for a signed patient, tender payment, click `Print Receipt`, verify print dialog.
- **Commit Message**:
  ```git
  feat(frontend): build cashier financial dashboard, itemized checkout, and thermal receipt slip
  ```

---

### [PR-FE-10] P-ADM-01 to P-ADM-03: Admin Executive Analytics & Staff Provisioning Portal
- **Scope**: `frontend/components/AdminDashboardView.jsx`, `frontend/components/StaffManagementModal.jsx`
- **Depends On**: `PR-FE-09`
- **Objective**: Executive overview of clinic operations, doctor workloads, and staff user provisioning.
- **Key Details**:
  - Executive KPI cards: Total Patient Volume, Avg Turnaround Time, Collection Total.
  - Operational charts: Hourly patient arrival flow, department workload distribution.
  - Staff Management Modal: Table of staff accounts with role badges (`RECEPTIONIST`, `DOCTOR`, `CASHIER`, `ADMIN`), active status toggles, and modal to invite/create new staff.
- **Verification**: Switch role to `ADMIN`, view analytics figures, test staff creation form.
- **Commit Message**:
  ```git
  feat(frontend): implement admin executive analytics dashboard and staff access management
  ```
