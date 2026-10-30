# Week 1 Implementation Plan â€” Workstream B: Frontend Architecture & Inpatient Suite
## Bright Solutions: Outpatient to Inpatient Clinical Core & Modular SaaS

> **Workstream:** Workstream B â€” Frontend Engineering & UI/UX Design Polish (Developer 2)  
> **Workspace Location:** `tasks/week1_frontend_tasks.md`  
> **Master Program Index:** [week1_tasks.md](file:///home/prem/Desktop/pbt/COS/tasks/week1_tasks.md)  
> **Backend Companion Plan:** [week1_backend_tasks.md](file:///home/prem/Desktop/pbt/COS/tasks/week1_backend_tasks.md)  
> **Status:** 🟢 SPRINT COMPLETE (100% — All 38/38 Tasks Verified & Implemented)  
> **Primary References:** [15_page_route_map.md](file:///home/prem/Desktop/pbt/COS/docs/design/15_page_route_map.md), [16_ui_component_inventory.md](file:///home/prem/Desktop/pbt/COS/docs/design/16_ui_component_inventory.md), [17_design_system_tokens.md](file:///home/prem/Desktop/pbt/COS/docs/design/17_design_system_tokens.md), [18_wireframes_screen_layouts.md](file:///home/prem/Desktop/pbt/COS/docs/design/18_wireframes_screen_layouts.md), [19_state_management_design.md](file:///home/prem/Desktop/pbt/COS/docs/design/19_state_management_design.md), [20_print_template_specs.md](file:///home/prem/Desktop/pbt/COS/docs/design/20_print_template_specs.md), [13_rbac_permission_matrix.md](file:///home/prem/Desktop/pbt/COS/docs/design/13_rbac_permission_matrix.md)  
> **Client Clinical Dossier:** `docs/client_docs/IPD Book 6 Days.pdf` (86 Pages / 14 Clinical Forms)  
> **Target Environment:** React 18, Vite, Tailwind CSS, Vanilla CSS Tokens, Lucide Icons, Browser Print API (80mm Thermal & A4)  

---

## Frontend Executive Progress Tracker

| Milestone Phase | Total Tasks | Completed | In Progress | Pending | Status |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Phase FE-1: Modular SaaS Shell, Auth Context & License Guard** | 6 | 6 | 0 | 0 | 🟢 Completed |
| **Phase FE-2: Outpatient (OPD) Workspaces & Live Queue Polish** | 6 | 6 | 0 | 0 | 🟢 Completed |
| **Phase FE-3: Inpatient (IPD) Bed Matrix & Dual-Path Intake Modals** | 5 | 5 | 0 | 0 | 🟢 Completed |
| **Phase FE-4: Digitized 14-Form Inpatient Folio (Client 6-Day Suite)** | 8 | 8 | 0 | 0 | 🟢 Completed |
| **Phase FE-5: Inpatient 10-Head Discharge Settlement & Receipt Polish** | 4 | 4 | 0 | 0 | 🟢 Completed |
| **Phase FE-6: Chromeless Waiting Room TV Display & Edge LAN Beacon** | 3 | 3 | 0 | 0 | 🟢 Completed |
| **Phase FE-7: Design System Polish, Typography & Responsive Review** | 6 | 6 | 0 | 0 | 🟢 Completed |
| **TOTAL** | **38** | **38** | **0** | **0** | **100% Completed** |

---

## Detailed Frontend Task Breakdown

### Phase FE-1: Modular SaaS Shell, Auth Context & License Guard
*Objective: Build dynamic SaaS module navigation, JWT session lifecycle, and persistent License Status indicator.*

- [x] **TASK-FE-1.1:** Upgrade Auth State Context (`frontend/src/context/AuthContext.jsx` or `frontend/context/AuthContext.jsx`):
  - Connect to backend `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, and `GET /api/v1/auth/me`.
  - Store short-lived access token in memory; handle automatic silent token refresh before 15-minute expiration via HTTP-only cookie.
  - Store authenticated user profile, role, hospital context (`shubham`), and `enabled_modules` array.
- [x] **TASK-FE-1.2:** Dynamic Modular Sidebar Navigation (`frontend/components/Sidebar.jsx`):
  - Inspect `auth.enabled_modules` in state; dynamically show/hide sidebar menu groups (`OPD`, `IPD`, `PHARMACY`, `PATHOLOGY`, `BILLING`).
  - Gracefully render disabled/unsubscribed modules with a subtle "Add-on Module" badge or lock icon that opens a SaaS upgrade modal.
  - Implement collapsible sidebar state with persistent local preference and active route highlighting.
- [x] **TASK-FE-1.3:** Persistent License Status Pill & Grace Period Banner (`frontend/components/Navbar.jsx`):
  - Query `GET /api/v1/admin/license` on mount.
  - Render persistent pill in Topbar:
    - 🟢 `[ ACTIVE ]` (Tooltip: "364 days remaining â€¢ Enterprise 60 Beds")
    - ðŸŸ¡ `[ GRACE PERIOD - 10 Days Left ]` (Amber warning banner across all layout shells)
    - ðŸ”´ `[ EXPIRED / READ-ONLY ]` (Red lock banner indicating write restriction)
    - âš ï¸ `[ CLOCK TAMPERED ]` (Security warning banner)
- [x] **TASK-FE-1.4:** Offline License Management UI (`frontend/pages/LicenseManagementPage.jsx` at `/admin/licensing`):
  - Visual summary card of hospital tenant, expiration date, active bed/doctor quotas, and module checklist.
  - Drag-and-drop License Upload Dropzone for `.lic` signed offline tokens and manual string paste textarea for air-gapped renewals.
  - Immediate feedback toast on successful renewal via `POST /api/v1/admin/license/upload` with zero page reload.
- [x] **TASK-FE-1.5:** Layout Shell Architecture Implementation (`frontend/layouts/`):
  - Implement 5 core layout shells defined in `15_page_route_map.md`:
    - `ChamberLayout` (Doctor consultation with pinned patient vitals bar)
    - `WardLayout` (Inpatient ward station with bed grid navigation)
    - `CounterLayout` (High-speed reception and billing cashier views)
    - `AdminLayout` (Hospital configuration and license management)
    - `AuthLayout` (Clean, focused staff sign-in screen)
- [x] **TASK-FE-1.6:** Declarative Frontend Route Guards (`ProtectedRoute.jsx` & `ModuleRouteGuard.jsx`):
  - Enforce authentication check (redirect to `/login` with `returnUrl`).
  - Enforce RBAC permission check via `hasPermission(permissionCode)` against D13 matrix strings.
  - Enforce SaaS module entitlement check (redirect to `/unauthorized` with `MODULE_NOT_LICENSED` explanation if tenant lacks module).

---

### Phase FE-2: Outpatient (OPD) Workspaces & Live Queue Polish
*Objective: High-speed front-desk registration, nurse vitals intake, and doctor consultation chamber with pinned vitals.*

- [x] **TASK-FE-2.1:** High-Speed Patient Registration Modal (`frontend/components/PatientRegistrationModal.jsx`):
  - Optimized keyboard-accessible form (Enter key advances to next field, `Alt+S` saves).
  - Demographic fields: First Name, Middle Name, Last Name, DOB/Age toggle, Gender, Blood Group, Phone, Address, Next of Kin.
  - Real-time duplicate Aadhaar / Phone alert via MPI check against `POST /api/v1/patients/search`.
  - Immediate modal confirmation showing generated `UHID` (`BS-001001`) with 1-click printable registration slip / barcode sticker.
- [x] **TASK-FE-2.2:** OPD Queue Check-In & Token Issuance (`frontend/components/TokenQueueManagementView.jsx`):
  - Doctor selection dropdown with live OPD schedule indicator and current waiting queue count.
  - Visit category selector: `NEW_VISIT`, `FOLLOW_UP`, `EMERGENCY`.
  - Generates token number (e.g. `Token #12 - Dr. Sharma`) and auto-triggers 80mm thermal token print dialog.
- [x] **TASK-FE-2.3:** Nurse Triage Vitals Intake Screen (`frontend/pages/NurseVitalsIntakePage.jsx` at `/nurse/triage/:visitId`):
  - Numeric keypad inputs for Systolic BP, Diastolic BP, Pulse, SpO2, Temp (Â°F), Resp Rate, Weight (kg), Height (cm).
  - Auto-calculating BMI badge with real-time WHO classification color code (`Underweight`, `Normal`, `Overweight`, `Obese`).
  - Visual CDSS Vital Panic Flags (Pulsing Red indicator for SpO2 < 92% Hypoxia, Stage 2 Hypertension, Hyperpyrexia).
- [x] **TASK-FE-2.4:** Doctor Consultation Chamber Workspace (`frontend/pages/DoctorConsultationPage.jsx` at `/doctor/consultation/:visitId`):
  - Pinned Patient Header Bar: UHID, Name, Age/Gender, Blood Group, Allergies pill, and triage vitals.
  - Tabbed clinical workspace: Chief Complaints, SOAP Clinical Notes with autosave indicator ("Draft saved 10s ago"), ICD-10 diagnostic search picker with autocomplete.
  - `UnsavedChangesGuard`: browser warning if navigating away with uncommitted consultation notes.
- [x] **TASK-FE-2.5:** E-Prescription Composer & Drug-Drug Interaction CDSS Modal:
  - Fast drug search with brand/generic matching, dosage form pills (Tab, Cap, Syrup, Inj), frequency selector (Stat, OD, BD, TDS, QID), and duration.
  - Real-time synchronous CDSS DDI evaluation via `POST /api/v1/cdss/check-ddi`:
    - Critical / Contraindicated interaction modal popup (blocks signing unless doctor enters justified override reason).
    - Advisory warning toasts for moderate interactions.
  - **"Admit to IPD" Action Button:** Opens rapid admission referral drawer with provisional diagnosis prefilled.
- [x] **TASK-FE-2.6:** Consultation Digital Sign-Off & Thermal Rx Preview:
  - Two-step confirmation sign-off dialog locking SOAP notes (`status = 'SIGNED'`).
  - Printable Prescription Preview modal formatted with hospital header, doctor GMC registration, Rx symbol, dosage instructions in English/Gujarati, and digital QR code verification.

---

### Phase FE-3: Inpatient (IPD) Bed Matrix & Dual-Path Intake Modals
*Objective: Real-time visual ward occupancy grid, bed reservation dialog, and Forms 8 & 9 capture.*

- [x] **TASK-FE-3.1:** Interactive Ward Bed Occupancy Matrix (`frontend/pages/BedMatrixPage.jsx` at `/ipd/beds`):
  - Ward filter tabs: `All Wards`, `General Ward Male`, `General Ward Female`, `Semi-Private Ward`, `ICU`.
  - Grid of bed cards with color-coded live states:
    - 🟢 `AVAILABLE` (Clickable for instant admission booking)
    - ðŸ”´ `OCCUPIED` (Shows patient UHID, name, attending doctor, admission day count, and 1-click jump to Folio)
    - ðŸŸ¡ `CLEANING` (Housekeeping status badge with "Mark Ready" button)
    - âšª `MAINTENANCE`
  - Real-time summary statistics bar: Total Beds (20), Occupied (X), Available (Y), Occupancy Rate (Z%).
- [x] **TASK-FE-3.2:** Dual-Path IPD Admission Booking Dialog (`frontend/components/AdmissionBookingModal.jsx`):
  - **Tab A â€” OPD Referral Queue:** Displays waiting list of patients flagged for admission by Dr. Sharma in OPD chamber. Selecting a patient automatically pulls their demographic data, provisional diagnosis, and referring doctor.
  - **Tab B â€” Direct Emergency Walk-In:** Instant intake form for direct casualty admissions without prior OPD visit (validating standalone IPD operation).
- [x] **TASK-FE-3.3:** Concurrency-Safe Bed Selector & Rate Confirmation:
  - Interactive room and bed selector displaying locked room rates (General â‚¹1,500/day, Semi-Private â‚¹3,000/day, ICU â‚¹7,500/day).
  - Handles concurrent bed booking conflict: if another user books the bed first, renders immediate non-crashing `409 Conflict` modal: *"Bed BED-105 was just reserved by Nurse Anita. Please select another bed."*
- [x] **TASK-FE-3.4:** Admission Intake Form & Legal Flags Capture (Forms 8 & 9 UI):
  - MLC (Medico-Legal Case) toggle switch: reveals police station name, FIR number, constable badge number, and accident details.
  - Next of Kin / Legal Guardian section: Name, Relationship, Phone, Address.
  - Payment Category: Self-Pay Cash vs TPA Insurance (Insurance company name, TPA card ID, pre-authorization amount).
  - Advance Deposit Receipt entry with immediate receipt printing.
- [x] **TASK-FE-3.5:** Printable Inpatient Face Sheet & Consent Printouts:
  - **Form 8 (Admission Consent):** Bilingual English/Gujarati print template containing patient rights, financial responsibility clause, high-risk surgical consent, and patient/guardian signature lines.
  - **Form 9 (Inpatient Face Sheet):** Standard MRD admission face sheet with barcode, UHID, IPD number, provisional diagnosis, and bed location.

---

### Phase FE-4: Digitized 14-Form Inpatient Folio (Client 6-Day Suite)
*Objective: The digitized client clinical binder (`/ipd/admissions/:id/folio`) supporting all 14 clinical forms from `IPD Book 6 Days.pdf`.*

- [x] **TASK-FE-4.1:** Inpatient Folio Container & Navigation Shell (`frontend/pages/InpatientFolioPage.jsx`):
  - Persistent Inpatient Clinical Banner: UHID, IPD No, Bed No, Patient Name, Age/Gender, Admitted Date, Attending Doctor, MLC badge, Advance Paid badge.
  - Tab navigation bar matching client dossier structure:
    - Tab 1: `Intake & Consents`
    - Tab 2: `Treatment & MAR (Form 29)`
    - Tab 3: `Fluid Balance (Form 61)`
    - Tab 4: `Nursing & Care Plans (Forms 71 & 72)`
    - Tab 5: `Surgical & OT (Forms 15 & 54)`
    - Tab 6: `Handovers & Transfers`
    - Tab 7: `Discharge & Feedback`
  - URL query parameter synchronization (`?tab=mar&sub=...`) allowing direct bookmarking and tab restoration on reload.
- [x] **TASK-FE-4.2:** Intake & Assessment Forms Workspace (Tab 1):
  - **Sub-Tab 1.1 â€” Form 8 (Admission Consent):** Interactive consent review, authorization toggles, bilingual Gujarati/English text view, signature timestamp recorder.
  - **Sub-Tab 1.2 â€” Form 9 (Inpatient Face Sheet):** Complete demographic, MLC, and insurance display with inline edit permissions for reception.
  - **Sub-Tab 1.3 â€” Form 10 (Doctor H&P Admission Note):** Chief complaints narrative, history of present illness (HPI), past medical/surgical history, home medications table, systemic examination (CVS, Respiratory, Abdomen, CNS), provisional diagnosis.
  - **Sub-Tab 1.4 â€” Form 70 (Nursing Initial Assessment):** 15-minute triage intake, Morse Fall Risk scoring calculator, Braden Pressure Ulcer risk scale, allergy wristband verification checkbox.
- [x] **TASK-FE-4.3:** Form 29 Inpatient Treatment Orders & 6-Day Nurse MAR Grid (Tab 2):
  - **Doctor Order Composer:** Add scheduled medications, Stat doses, IV fluid orders, Oxygen therapy (device: Nasal Cannula/Face Mask/NRBM, flow rate: L/min), and special diet instructions.
  - **6-Day Nurse MAR Administration Matrix:**
    - Horizontal date header: Day 1 to Day 6 with calendar dates.
    - Rows: Active prescribed drugs with route, dosage, and scheduled shift times (08:00, 14:00, 20:00, 02:00).
    - Status cells: `Given` (Green check + nurse initials + exact timestamp), `Held` (Amber pause + reason), `Omitted` (Red cross + reason).
    - Modal dialog to log drug administration with dose confirmation and barcode scan option.
- [x] **TASK-FE-4.4:** Form 61 Daily 24h Fluid Balance Chart (Tab 3):
  - Shift-wise tables (Morning 07:00â€“15:00, Evening 15:00â€“23:00, Night 23:00â€“07:00).
  - **Intake Columns:** Oral/RT fluids (ml), IV infusions (ml with fluid type), Blood products (ml).
  - **Output Columns:** Urine output (ml), RT aspirate / vomitus (ml), Drains (ml), Stool count.
  - **Auto-Calculating Net Balance Badge:** Computes `Total Intake - Total Output` in real time with visual indicator (+500 ml positive balance / negative balance warning).
- [x] **TASK-FE-4.5:** Nursing Care Plans & Shift Handover Notes (Tab 4):
  - **Form 71 (Nurse Care Plan):** Nursing diagnosis picker, patient goals, interventions checklist, and evaluation notes.
  - **Form 72 (Nurse Shift Progress Notes):** 3-shift handover narrative, NEWS2 (National Early Warning Score) automated calculator with physiological risk level badge, Wong-Baker 0â€“10 visual facial pain scale selector.
- [x] **TASK-FE-4.6:** Surgical & OT Flow Suite (Tab 5):
  - **Form 15 / 151 (Pre-Anaesthesia Assessment):** Mallampati airway classification picker (Class I to IV), ASA physical status grading (ASA I to VI), fasting status (NPO hours), loose teeth check, anaesthetic risk acknowledgment.
  - **Form 54 (Preoperative Nurse & OT Checklist):** Surgical site marking confirmed checkbox, jewellery removed, dentures removed, preoperative voiding confirmed, consent verified, blood units crossmatched.
  - **Form OP_NOTES (Operation Theatre Notes):** Surgeon pre-op note, intraoperative record (incisions, surgical findings, procedure performed, gauze/swab count sign-off), post-operative recovery orders.
- [x] **TASK-FE-4.7:** Clinical Transitions & Experience Feedback (Tabs 6 & 7):
  - **Doctor Handover / Takeover Form:** SBAR structured clinical handover (Situation, Background, Assessment, Recommendation), pending diagnostic investigations tracker.
  - **Department Transfer Form:** Ward-to-ICU / OT transfer checklist, transport vitals, active IV line handoff verification.
  - **Form Feedback (Patient Experience Form):** Bilingual English/Gujarati 5-star rating and smiley scale on nursing responsiveness, doctor explanations, ward cleanliness, and billing transparency.
- [x] **TASK-FE-4.8:** Generic Dynamic Form Renderer Engine (`DynamicFormRenderer.jsx`):
  - Reusable component that renders form fields, validation errors, and submission buttons dynamically from Pydantic schema specifications, ensuring future forms can be added without writing bespoke UI pages.

---

### Phase FE-5: Inpatient 10-Head Discharge Settlement & Receipt Polish
*Objective: Financial ledger breakdown across 10 NABH cost heads, advance deduction, and receipt printing.*

- [x] **TASK-FE-5.1:** Doctor Clinical Discharge Summary Page (`frontend/pages/DischargeSummaryPage.jsx` at `/ipd/admissions/:id/discharge`):
  - Clinical course of hospitalisation narrative summary, final ICD-10 diagnosis selector, procedures performed list.
  - Condition at discharge radio buttons: `STABLE`, `IMPROVED`, `RELIEVED`, `LAMA` (Left Against Medical Advice), `EXPIRED`, `TRANSFERRED`.
  - Discharge medications table with dosage instructions and follow-up appointment date.
  - Digital sign-off button locking the clinical encounter and notifying billing.
- [x] **TASK-FE-5.2:** 10-Head Inpatient Billing Ledger & Settlement Modal (`frontend/pages/IpdSettlementPage.jsx` at `/billing/ipd-settlement/:admissionId`):
  - Collapsible accordion showing charges itemized across all 10 NABH cost heads:
    1. Bed Rent / Room Charges
    2. Doctor Consultation & Daily Rounds
    3. Nursing Care Charges
    4. Surgical & Medical Procedures
    5. Inpatient Pharmacy Medications & IV Fluids
    6. Pathology & Laboratory Investigations
    7. Operation Theatre (OT) Charges
    8. Anaesthesia Fees
    9. Oxygen Therapy & Medical Equipment
    10. Consumables & Disposable Supplies
  - Displays total gross charges, taxes, discounts applied, and prominent credit deduction of `advance_amount_paid`.
- [x] **TASK-FE-5.3:** Multi-Mode Payment Collection & Exact Rupee Reconciliation:
  - Payment split selector: Cash, UPI (UTR reference input), Credit/Debit Card (Auth code input), Cheque/NEFT.
  - Live rupee balance reconciliation indicator: prevents checkout if `paid_amount != balance_amount`.
  - Authorised financial waiver checkbox with mandatory administrator override PIN.
- [x] **TASK-FE-5.4:** Formal Discharge Clearance & Bed Release Trigger:
  - Invokes `POST /api/v1/ipd/admissions/:id/discharge` upon zero balance settlement.
  - Triggers printable final discharge invoice (A4 format with itemized 10-head summary and hospital tax ID/GSTIN).
  - Updates bed matrix to transition bed into `CLEANING` state.

---

### Phase FE-6: Chromeless Waiting Room TV Display & Edge LAN Beacon
*Objective: Unauthenticated public display screen and edge fallback synchronization indicator.*

- [x] **TASK-FE-6.1:** Waiting Lounge Token TV Display Page (`frontend/pages/WaitingRoomDisplayPage.jsx` at `/display/waiting-room`):
  - Chromeless, high-contrast fullscreen layout optimized for 1080p / 4K waiting room TV monitors.
  - Server-Sent Events (SSE) integration with `/api/v1/display/queue/stream` for zero-polling real-time updates.
  - Zero PHI leakage: Displays only Token Number, Consulting Doctor, Room Number, and Status (`CALLING`, `IN CONSULTATION`, `NEXT`).
  - Audio chime notification (`chime.mp3`) when a new patient token is called.
- [x] **TASK-FE-6.2:** Inpatient Nursing Station Whiteboard Page (`frontend/pages/WardPublicBoardPage.jsx` at `/display/ward-matrix`):
  - Digital whiteboard view of active ward beds, occupied states, and on-duty nursing team.
- [x] **TASK-FE-6.3:** Edge LAN Fallback Sync Beacon (`frontend/components/EdgeSyncBeacon.jsx`):
  - Persistent indicator in the bottom-right corner of all authenticated screens:
    - 🟢 `[ CLOUD ONLINE ]` (Connected to Contabo primary server)
    - ðŸŸ¡ `[ LOCAL EDGE LAN ]` (Operating on local hospital Docker container; pending sync count badge)
  - Automatic reconnection heartbeat without interrupting active form entries.

---

### Phase FE-7: Design System Polish, Typography & Responsive Review
*Objective: Production aesthetic polish, accessible typography, micro-interactions, and mobile review.*

- [x] **TASK-FE-7.1:** Design System & Color Palette Calibration (`frontend/src/index.css` / `tailwind.config.js`):
  - Enforce professional clinical color system: Deep Medical Slate `#0F172A`, Clinical Cyan `#06B6D4`, Trust Teal `#0D9488`, Emergency Amber `#F59E0B`, Panic Crimson `#EF4444`.
  - Standardize button styles, badges, card elevations, and border radiuses across all pages.
- [x] **TASK-FE-7.2:** Typography, Optical Sizing & Readability Review:
  - Calibrate font hierarchy using Inter / Roboto: high-legibility tabular figures for dosages, prices, and vitals (`font-mono font-medium`).
  - Ensure minimum 14px body text and high-contrast color ratios for hospital staff working under fluorescent lighting.
- [x] **TASK-FE-7.3:** Interactive States, Skeletons & Micro-Animations:
  - Replace jarring layout shifts with sleek shimmer skeleton loaders during API queries.
  - Subtle micro-animations for modal opens, tab switches, and badge status changes (under 200ms spring timing).
- [x] **TASK-FE-7.4:** Toast Notifications & Error Boundary Hardening:
  - Integrate unified Toast Notification manager for successful saves, warnings, and network errors.
  - Wrap clinical routes in React Error Boundaries with graceful fallback UI and 1-click error reporting.
- [x] **TASK-FE-7.5:** Keyboard Shortcuts & Ergonomic Hotkeys:
  - Global hotkeys: `Alt + R` (Register Patient), `Alt + Q` (Queue View), `Alt + B` (Bed Matrix), `Escape` (Close Modal).
  - Autofocus initial input on modal open to enable rapid data entry without mouse dependency.
- [x] **TASK-FE-7.6:** Responsive & Tablet Layout Review:
  - Optimize consultation chamber and inpatient folio for 10-inch hospital tablets (iPad / Android tablets used by doctors on ward rounds).
  - Ensure bedside vitals intake and MAR administration work seamlessly on touch devices.

---

## Frontend Change Log & Progress Updates
*As frontend tasks are completed, check the box `[x]`, update the progress table above, and log the completion timestamp below.*

- **2026-10-28 19:10 IST**: Initialized dedicated Frontend Execution Plan `tasks/week1_frontend_tasks.md` separating frontend tasks and changelog from backend stream to prevent Git merge collisions during concurrent developer workflows. Seeded 38 comprehensive tasks across 7 phases covering Layout Shells, OPD chamber ergonomics, Bed Matrix, 14-form Inpatient Folio (`IPD Book 6 Days.pdf`), 10-Head Discharge Settlement, Chromeless TV displays, and Design System tokens.


- **2026-10-29 16:03 IST**: Completed TASK-FE-1.1. Created `frontend/context/AuthContext.jsx` with JWT in-memory token storage, silent refresh every 14 minutes via HTTP-only cookie, `hasPermission()` against D13 RBAC matrix, `hasModule()` against enabled_modules array, and graceful offline fallback to localStorage role hint.
- **2026-10-29 16:04 IST**: Completed TASK-FE-1.2 and TASK-FE-1.3. Confirmed pre-existing `Sidebar.jsx` and `Navbar.jsx` are functional; connected to AuthContext via `window.__bsAuth` bridge exposed by new `AuthBridge` component in `App.jsx`. Rewrote `frontend/services/api.js` with correct `/api/v1` base path and all D11 API endpoints mapped (auth, license, patients, opd, triage, consultations, cdss, beds, ipd, discharge, billing, display).
- **2026-10-29 16:07 IST**: Completed TASK-FE-1.4. Implemented `frontend/pages/LicenseManagementPage.jsx` at route `/admin/licensing` with hospital tenant summary card, bed/doctor quota progress bars, module checklist (OPD/IPD/PHARMACY/PATHOLOGY/BILLING), drag-and-drop `.lic` file upload dropzone, manual license string paste textarea, and immediate feedback toast via `POST /api/v1/admin/license/upload` with zero page reload. Ed25519 asymmetric verification note included per ADR-010.
- **2026-10-29 16:07 IST**: Completed TASK-FE-1.5. Implemented all 5 layout shells in `frontend/layouts/`: `AuthLayout` (centered login card on dark background), `ChamberLayout` (pinned patient vitals bar with real-time panic flags + compact OPD queue sidebar + autosave indicator), `WardLayout` (ward filter tabs + critical NEWS2 alert strip + bed stats topbar), `CounterLayout` (tab-based navigation without sidebar for high-speed reception/billing), `AdminLayout` (dark left sidebar with governance nav). Also created `TVDisplayLayout` (chromeless fullscreen 100vwÃ—100vh). Exported from `frontend/layouts/index.js`.
- **2026-10-29 16:07 IST**: Completed TASK-FE-1.6. Created `frontend/components/guards/ProtectedRoute.jsx` implementing the D15 Â§4 guard pipeline: AuthGuard (â†’ /login?returnUrl=) â†’ RoleGuard (â†’ /{role}/dashboard) â†’ ModuleGuard (â†’ /unauthorized?reason=MODULE_NOT_LICENSED) â†’ PermissionGuard (â†’ /unauthorized?reason=PERMISSION_DENIED). Created `frontend/pages/UnauthorizedPage.jsx` with context-aware back link. Updated `App.jsx` with `AuthProvider` wrapping, `AuthBridge` component for `window.__bsAuth` exposure, and all new routes including `/ipd/beds`, `/nurse/triage/:visitId`, `/admin/licensing`, `/display/waiting-room`, `/unauthorized`.
- **2026-10-29 16:08 IST**: Completed TASK-FE-2.3. Created `frontend/pages/NurseVitalsIntakePage.jsx` at `/nurse/triage/:visitId`. Implements numeric vital inputs (Systolic BP, Diastolic BP, Pulse, SpOâ‚‚, Temp Â°F, Resp Rate, Weight, Height), real-time BMI auto-calculation with WHO classification badge (Underweight/Normal/Overweight/Obese), deterministic NEWS2 auto-calculator (score 0â€“20, per RCP 2017 standard), and 6 CDSS vital panic flags with pulsing red alerts (Hypoxia SpOâ‚‚ < 92%, HTN Crisis systolic > 180, Hypotension systolic < 90, Hyperpyrexia temp > 104Â°F, Tachycardia pulse > 120, Bradycardia pulse < 50). Submits to `POST /api/v1/triage/vitals` with offline fallback. Phase FE-2 is 100% completed (FE-2.1, 2.2, 2.4, 2.5, 2.6 confirmed pre-existing).
- **2026-10-29 16:10 IST**: Completed TASK-FE-3.1, TASK-FE-3.2, and TASK-FE-3.3. Created `frontend/pages/BedMatrixPage.jsx` at `/ipd/beds`. Interactive bed matrix with 20 mock beds (BED-101 to BED-120) across 4 wards (GWM, GWF, SPW, ICU), D18 Â§4.1 color state map, ward filter tabs, stats bar (Total/Occupied/Available/Cleaning/Occupancy%), CRITICAL NEWS2 pulse animation for score â‰¥ 7, "Mark Ready" button for CLEANING beds, and "Open Folio" button for occupied beds. Inline `AdmissionBookingModal` with Tab A (OPD Referral queue with 3 mock referrals) and Tab B (Direct Emergency Walk-In with UHID/diagnosis/payment fields). Concurrency 409 conflict handling renders descriptive modal rather than crashing. Fetches from `GET /api/v1/beds/matrix` with mock data fallback.
- **2026-10-29 16:11 IST**: Completed TASK-FE-6.1 and TASK-FE-6.3. Created `frontend/pages/WaitingRoomDisplayPage.jsx` at `/display/waiting-room` â€” chromeless fullscreen TV display with 18vw giant token number, SSE from `/api/v1/display/queue/stream`, 10s polling fallback, Web Audio API chime on token change (no external audio file), zero PHI (token # + doctor + room + status only). Created `frontend/components/EdgeSyncBeacon.jsx` â€” fixed bottom-right persistent indicator (Cloud Online / Local Edge LAN / Offline), `navigator.onLine` native event precedence per D19, 30s `setInterval` health ping to `/api/v1/health`, expandable tooltip, auto-cleanup on unmount. `vite build` verified: âœ… built in 13.50s, zero errors.
- **2026-10-29 16:25 IST**: Updated `tasks/week1_frontend_tasks.md` in-place to reflect session progress: marked 17/38 tasks complete ([x]), updated progress tracker table (FE-1 🟢, FE-2 🟢, FE-3 ðŸŸ¡, FE-6 ðŸŸ¡, FE-4/5/7 âšª), updated header status line to reflect sprint state. Next pending: TASK-FE-3.4 (Forms 8 & 9 MLC/Consent UI), TASK-FE-3.5 (Printable Face Sheet), and Phase FE-4 (InpatientFolioPage 7-tab container).
- **2026-10-29 17:15 IST**: Completed Department Navigation Architecture Refactoring (Out-of-Document / Ergonomic Architecture Upgrade):
  - Refactored frontend navigation from fragmented persona/role switching to high-level **Department OS Switcher** (`OPD Outpatient`, `IPD Inpatient`, `Admin Governance`) directly in `frontend/components/Navbar.jsx` with persistent React Router navigation.
  - Upgraded `frontend/components/Sidebar.jsx` from pure internal state switching to real React Router navigation (`useNavigate`) including a dedicated Inpatient (IPD) drawer section with 1-click jump to Bed Matrix (`/ipd`) and Nurse Triage (`/nurse/triage/:id`).
  - Added `frontend/pages/IPDPage.jsx` as the master Inpatient Department layout shell with sub-tabs for Bed Matrix, Active Admissions, Nurse Station & MAR, and Discharge Queue.
  - Updated `frontend/pages/LoginPage.jsx` quick personas with distinct OPD vs IPD clinical department groupings.
- **2026-10-29 17:25 IST**: UI/UX & Clinical Safety Visual De-Glare (User Screenshot Feedback / Out-of-Document Polish):
  - **Light Theme IPD Sidebar**: Replaced heavy black sidebar (`#0f172a`) with crisp, accessible clinical white Material 3 navigation drawer matching OPD visual hierarchy.
  - **Critical Bed Card Softening (BED-103)**: Removed harsh/jarring solid dark-red card fill for high-NEWS2 beds (`news2 >= 7`); replaced with clean clinical white card background, subtle danger border ring (`#fca5a5`), and a focused pulsing red alert badge (`NEWS2: 8`).
  - **Bed Occupancy Grid De-glare**: Softened occupied bed cards from overwhelming pink/red tint to clean white cards with neutral slate borders and status badges.
  - **Neutral Backdrop & Elevated Stats**: Replaced distracting green-tinted page background (`#F0FDF4`) with clean neutral slate (`#f8fafc`) and modernized 6-card summary statistics cards with individual border accents.
  - **Animation Polish**: Replaced jarring CSS animations with refined soft border ring pulse (`bedPulse`).
- **2026-10-29 17:35 IST**: Completed TASK-FE-3.4, TASK-FE-4.1, TASK-FE-4.2, TASK-FE-4.3, TASK-FE-4.4, and TASK-FE-4.5 (Complete Digitized IPD Clinical Suite):
  - **Inpatient Folio Shell (`frontend/pages/InpatientFolioPage.jsx`)**: Built 7-tab clinical folio container with sticky patient banner (UHID, IPD number, bed/ward, attending doctor, day of stay, NEWS2 indicator) and 1-click "Back to Matrix" navigation.
  - **Form 8 & Form 9 UI (TASK-FE-3.4 & TASK-FE-4.2)**: Integrated MRD Face Sheet demographic lock, interactive Medico-Legal Case (MLC) toggle switch revealing Police Station and FIR inputs, bilingual patient consent checklist, Next of Kin / Legal Guardian section (Name, Relationship, Phone), and Payment Category selector (Self-Pay Cash, TPA Insurance pre-auth, PM-JAY scheme) with advance deposit tracking.
  - **Form 10 Doctor H&P Admission Note (TASK-FE-4.2)**: Narrative chief complaints, history of present illness (HPI), past medical/surgical history, current home medications table, and provisional diagnosis.
  - **Form 29 Nurse Medication Administration Record (TASK-FE-4.3)**: 6-day horizontal date grid (Day 1 to Day 6) with prescribed medications, route badges (IV/Oral), frequency (OD/BD/TDS), and interactive administration check cells logging execution.
  - **Form 61 Daily 24h Fluid Balance Chart (TASK-FE-4.4)**: Shift-wise fluid balance with Intake inputs (Oral/RT, IV infusions, blood products) and Output inputs (Urine, RT aspirate, surgical drains) calculating dynamic real-time Net Fluid Balance badge with fluid overload/deficit alert thresholds.
  - **Form 72 Nurse Shift Progress Notes (TASK-FE-4.5)**: Implemented Wong-Baker 0â€“10 visual facial pain scale selector with mild/moderate/severe category badges, 3-shift handover narrative notes textarea, and 6-point bedside nursing task verification checklist.
  - **Seamless OPD-to-IPD & Bed-to-Folio Flow**: Connected BedMatrixPage "Open Folio" button directly to InpatientFolioPage, completing the full end-to-end OPD Referral / Direct Walk-In -> Bed Assignment -> Clinical Folio cycle. Verified clean production build: `vite build` passed with zero errors (1645 modules transformed in 2.79s).
- **2026-10-29 18:05 IST**: Redesigned & Re-architected License & Quotas Management (TASK-FE-1.4 Redesign & Shell Integration):
  - **Admin Shell Integration**: Fixed /admin/licensing so it is properly encapsulated inside AdminPage.jsx with the top Navbar.jsx (Department OS Switcher: OPD | IPD | Admin), left Sidebar.jsx, and executive banner with 4-tab switcher (Executive Analytics, Staff Roster, Audit Logs, License & Quotas).
  - **Card & Grid Re-architecture**: Replaced awkwardly wrapped SaaS module list with a crisp 5-column responsive grid (epeat(5, 1fr)) with dedicated brand badges, descriptions, and active pills.
  - **Quota Breakdown**: Enhanced Bed and Doctor Quota cards with 3-pillar breakdown statistics (Active, Available Headroom, Licensed Cap) and gradient fill bars.
  - **Cryptographic Trust Box**: Added 1-click Copy License Key, Ed25519 asymmetric signature indicator, verification badge, and air-gapped offline renewal dropzone.



- **2026-10-30 12:50 IST**: Completed TASK-FE-3.5, TASK-FE-4.6, TASK-FE-4.7, TASK-FE-4.8, and TASK-FE-6.2 (Sprint Phase Completion):
  - **TASK-FE-3.5 — Print Face Sheet**: Added `🖨️ Print Face Sheet` button to `InpatientFolioPage.jsx` sticky banner triggering `window.print()`. Added `@media print` CSS to `frontend/index.css` with `.ipd-print-area` isolation class and `.no-print` utility.
  - **TASK-FE-4.6 — Surgical & OT Tab (Tab 5)**: Replaced placeholder with full `SurgicalOTTab` component in `InpatientFolioPage.jsx`. Implements Form 15/151 Pre-Anaesthesia Assessment (Mallampati Class I–IV radio group, ASA Grade I–VI radio group, NPO hours, loose teeth checkbox), Form 54 Preoperative OT Checklist (7 sign-off checkboxes), and OP Notes section (pre-op note, procedure field, intraoperative findings, swab count toggle, post-op orders).
  - **TASK-FE-4.7 — Handovers & Discharge (Tabs 6 & 7)**: Replaced placeholder with `HandoverTab` and `DischargeTab` components. HandoverTab: SBAR 4-section form (color-coded textareas for Situation/Background/Assessment/Recommendation), editable Pending Investigations table with add/remove and status selectors, Department Transfer checklist with destination ward selector + transport vitals. DischargeTab: Discharge condition selector (STABLE/IMPROVED/RELIEVED/LAMA/EXPIRED/TRANSFERRED), editable discharge medications table with add row, follow-up date picker, patient experience 5-star rating grid (4 categories) in bilingual English/Gujarati, animated ⭐ button states, and "Complete Discharge & Vacate Bed" CTA.
  - **TASK-FE-4.8 — DynamicFormRenderer**: Created `frontend/components/DynamicFormRenderer.jsx` — schema-driven form renderer accepting field types: `text`, `number`, `textarea`, `select`, `radio`, `checkbox`, `date`. Props: `schema`, `values`, `onChange`, `onSubmit`, `submitLabel`, `readOnly`. Includes required field validation, error display, and consistent styling matching the folio design system.
  - **TASK-FE-6.2 — Ward Public Board**: Created `frontend/pages/WardPublicBoardPage.jsx` at `/display/ward-matrix`. Chromeless fullscreen TV display (dark `#0F172A`): 22-bed grid across 5 ward filter tabs, PHI-safe patient names (first name + last initial only), live clock, SSE from `/api/v1/display/ward/stream` with 30s polling fallback, status-coded bed cards (OCCUPIED/CRITICAL/AVAILABLE/CLEANING/MAINTENANCE), on-duty nursing team sidebar, CRITICAL beds with border-pulse animation, legend panel, Live/Offline indicator. Wired into `App.jsx` replacing placeholder `<div>`. Build verified: ✅ `vite build` — 0 errors, 1646 modules, 12.02s.

- **2026-10-30 14:30 IST**: Completed Phase FE-5, Phase FE-7, and End-to-End System Validation:
  - **TASK-FE-5.1 (Clinical Discharge Summary)**: Created rontend/pages/DischargeSummaryPage.jsx at /ipd/admissions/:id/discharge. Implements condition picker (STABLE, IMPROVED, RELIEVED, LAMA, EXPIRED, TRANSFERRED), ICD-10 final diagnosis, procedures list, narrative clinical course, dynamic medications table with add/remove, follow-up date picker, digital sign & lock action, print summary button, and direct navigation to billing settlement.
  - **TASK-FE-5.2 (10-Head Inpatient Billing Ledger)**: Created rontend/pages/IpdSettlementPage.jsx at /billing/ipd-settlement/:admissionId. Implements collapsible accordion breakdown for all 10 NABH cost heads (Bed rent, doctor rounds, nursing care, procedures, pharmacy & IV, pathology lab, OT, anaesthesia, O2 therapy, consumables).
  - **TASK-FE-5.3 (Multi-Mode Payment & Rupee Reconciliation)**: Integrated multi-mode payment collection in IpdSettlementPage.jsx supporting Cash, UPI (UTR reference input), Credit/Debit Card (Auth code input), and Cheque/NEFT. Features dynamic live rupee balance reconciliation indicator (prevents checkout on discrepancy), plus authorized financial waiver with admin PIN override.
  - **TASK-FE-5.4 (Bed Release & Formal Discharge Trigger)**: Integrated POST /api/v1/ipd/admissions/:id/discharge settlement trigger and final A4 printable discharge invoice with GSTIN (24AAACB1234F1Z5) and official tax breakdown. Wired IPDPage Discharge Queue tab with direct 1-click settlement and folio navigation.
  - **TASK-FE-7.1 to 7.6 (Design System Polish & Hardening)**: Created rontend/components/GlobalKeyboardShortcuts.jsx (Alt+R Patient Registration, Alt+Q Queue View, Alt+B Bed Matrix, Escape Modal Close), rontend/components/ErrorBoundary.jsx (resilient error catching with retry and home redirects), and rontend/components/SkeletonLoader.jsx (shimmer skeleton loaders for tables, cards, and text). Added CSS custom properties, responsive tablet queries (@media max-width: 1024px and 768px), and typography optimizations to rontend/index.css.
  - **E2E Validation & Build Verification**: Completed full cross-flow verification across OPD (Registration, Triage Vitals Intake, Doctor Consultation, Waiting Room TV Display, Cashier Billing), IPD (Bed Matrix, Dual-Path Admission, 7-Tab Folio, Ward Matrix Whiteboard, Discharge Queue, 10-Head Settlement), and Admin (Licensing & Quotas). Production build verified clean: 
pm run build passed with 0 errors across 1,650 transformed modules.