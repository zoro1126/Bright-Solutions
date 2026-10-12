# Bright Solutions — Frontend Build Order

**Target**: `frontend/` (React 18 + Vite)
Page details, fields and components: `FRONTEND_PAGES_SPEC.md`. Endpoints and payloads: `API_SPEC.md`.

---

## 1. Routes and API Calls

**Client routes (no `/api/`)**
- Login: `/login`
- Receptionist: `/receptionist/dashboard`, `/receptionist/intake`, `/receptionist/intake/questionnaire`, `/receptionist/reports`, `/receptionist/queue`
- Doctor: `/doctor/dashboard`, `/doctor/patient/:id`, `/doctor/viewer/:visitId`, `/doctor/consultation/:visitId`
- Cashier: `/cashier/dashboard`, `/cashier/billing/:visitId`, `/cashier/receipt/:billId`
- Admin: `/admin/dashboard`, `/admin/staff`, `/admin/audit-logs`

**API calls**: all requests go through `services/api.js` and start with `/api/` (proxied to the backend on port 8000).

---

## 2. Patient Flow the Frontend Must Support

1. **Receptionist** registers the patient with vitals and gets a token, fills the intake questionnaire, uploads any outside reports, and the patient appears in the live queue.
2. **Doctor** sees the prioritized queue, calls the next patient, reviews the dossier, questionnaire and reports, then runs the consultation (diagnosis, safety checks, e-prescription) and signs off.
3. **Cashier** sees signed-off visits, reviews the itemized bill, applies insurance co-pay or discount, takes payment, prints the receipt and closes the encounter.
4. **Admin** views analytics, manages staff accounts and reviews the audit trail.

---

## 3. Build Order

```
[FE-00] Foundation: app shell, routing, role guard, login
   ↓
[FE-01] API client (services/api.js)
   ↓
[FE-02] Receptionist dashboard + patient registration
   ↓
[FE-03] Intake questionnaire
   ↓
[FE-04] External reports upload
   ↓
[FE-05] Live queue & token slip
   ↓
[FE-06] Doctor dashboard
   ↓
[FE-07] Patient dossier
   ↓
[FE-08] Diagnostic viewer
   ↓
[FE-09] Consultation studio (CDSS + e-prescription)
   ↓
[FE-10] Cashier: dashboard, invoice, payment & receipt
   ↓
[FE-11] Admin: dashboard, staff, audit logs
```

---

## 4. Steps

### FE-00 — Foundation
- **Pages**: P-00 `/login`, role-based navigation, route guard.
- **Does**: Login with 1-click demo personas and manual username/password (`POST /api/auth/login`, token stored in `localStorage`). After login, redirect to the role's dashboard. Each role can only open its own routes. Logout returns to `/login`.

### FE-01 — API Client
- **File**: `frontend/services/api.js`
- **Does**: One helper per endpoint in `API_SPEC.md`, grouped by role: auth, receptionist (patients, tokens, questionnaire, reports, queue), doctor (queue, call, dossier, insights, prescriptions, sign-off, formulary), cashier (queue, bill, payment), admin (analytics, staff, audit logs).

### FE-02 — Receptionist Dashboard & Registration
- **Pages**: P-REC-01, P-REC-02
- **Does**: Dashboard shows today's intake, next token, average triage time, hourly walk-ins, and queue balance per doctor, plus the last registrations. Registration captures demographics and vitals, shows live BMI and AHA BP stage, assigns a doctor, issues a token (`POST /api/patients`) and offers a printable slip.

### FE-03 — Intake Questionnaire
- **Page**: P-REC-03
- **Depends on**: FE-01
- **Does**: MCQ questions Q1..Q20 (extensible), each answer stored as an integer 0-3, with answered count, voice dictation into voice notes, and save (`POST /api/visits/{id}/questionnaire`). Loads only for the selected visit.

### FE-04 — External Reports Upload
- **Page**: P-REC-04
- **Depends on**: FE-01
- **Does**: Select a patient/visit, drag and drop files (`.dcm`, `.pdf`, `.png`, `.jpg`), choose the report type (DICOM scan, ECG waveform, lab bloodwork, discharge summary), upload with progress (`POST /api/visits/{id}/reports/upload`).

### FE-05 — Live Queue & Token Slip
- **Page**: P-REC-05
- **Depends on**: FE-01
- **Does**: Token roster with filters (All, Waiting Consultation, In Room, Completed), shows token, UHID, doctor, BP stage and wait time, refreshes every 15 seconds (paused while the browser tab is hidden), and prints the token slip.

### FE-06 — Doctor Dashboard
- **Page**: P-DOC-01
- **Depends on**: FE-01
- **Does**: Next patient to call (`POST /api/doctor/queue/{id}/call`, then open consultation), waiting count, average consultation time, triage alert count, triage risk breakdown, top diagnoses, and the prioritized queue with high-risk patients first.

### FE-07 — Patient Dossier
- **Page**: P-DOC-02
- **Depends on**: FE-06
- **Does**: Demographics, allergy warning, today's vitals, intake questionnaire answers shown as readable labels with voice notes, and past visits timeline.

### FE-08 — Diagnostic Viewer
- **Page**: P-DOC-03
- **Depends on**: FE-07
- **Does**: Switch between the visit's uploaded reports: DICOM viewer with contrast/brightness control and slice scroll, 12-lead ECG waveform, lab PDF preview. Files load only when the viewer is opened.

### FE-09 — Consultation Studio
- **Page**: P-DOC-04
- **Depends on**: FE-07
- **Does**: Diagnosis and examination notes, safety rule results from the CDSS (`POST /api/doctor/visits/{id}/insights/evaluate`, run only when the consultation opens), CRITICAL alerts require an override note, formulary search, prescription items (drug, dosage, frequency, duration, food timing), and sign-off (`POST /api/doctor/visits/{id}/sign-off`) which moves the visit to billing.

### FE-10 — Cashier
- **Pages**: P-CSH-01, P-CSH-02, P-CSH-03
- **Depends on**: FE-09
- **Does**: Dashboard shows collections today, unbilled queue, settled invoices, payment mode split and the pending billing list. Invoice page shows the itemized bill, discount, insurance co-pay and net payable. Payment page supports Cash (change calculator), UPI (QR) and Card, then prints an 80mm receipt and closes the encounter (`POST /api/bills/{id}/payments`).

### FE-11 — Admin
- **Pages**: P-ADM-01, P-ADM-02, P-ADM-03
- **Depends on**: FE-10
- **Does**: Analytics dashboard (weekly footfall, doctor workload, disease distribution, KPIs), staff list with add-staff form, role assignment and active/inactive toggle, and a filterable audit log of rule overrides, triage edits and invoice adjustments.
