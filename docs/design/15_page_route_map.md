# D15 — Page Route Map & Navigation Architecture
## Bright Solutions: Clinical Hospital Operating System

> **Document ID:** D15  
> **Version:** 1.0  
> **Status:** APPROVED FRONTEND ARCHITECTURE SPECIFICATION  
> **Depends On:** [01_PRD.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/01_PRD.md), [02_feature_spec.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/02_feature_spec.md), [11_api_endpoint_inventory.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/11_api_endpoint_inventory.md), [13_rbac_permission_matrix.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/13_rbac_permission_matrix.md), [23_cycle_1_pitch.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/23_cycle_1_pitch.md)  
> **Prepared By:** Bright Solutions Frontend Engineering Team  
> **Last Updated:** October 2026  

---

## Table of Contents

1. [Architectural Overview & Principles](#1-architectural-overview--principles)
2. [Layout Shell Architecture](#2-layout-shell-architecture)
   - 2.1 [ChamberLayout (Doctor Consultation)](#21-chamberlayout-doctor-consultation)
   - 2.2 [WardLayout (Inpatient Station & Beds)](#22-wardlayout-inpatient-station--beds)
   - 2.3 [CounterLayout (Reception & Billing)](#23-counterlayout-reception--billing)
   - 2.4 [TVDisplayLayout (Waiting Room Public Screens)](#24-tvdisplaylayout-waiting-room-public-screens)
   - 2.5 [AuthLayout & AdminLayout](#25-authlayout--adminlayout)
3. [Route Guard Pipeline](#3-route-guard-pipeline)
4. [Master Route Inventory](#4-master-route-inventory)
5. [Inpatient (IPD) 6-Day Book Digitized Route Hierarchy](#5-inpatient-ipd-6-day-book-digitized-route-hierarchy)
6. [Navigation State, Breadcrumbs & Deep-Linking](#6-navigation-state-breadcrumbs--deep-linking)
7. [Offline Edge Fallback Routing](#7-offline-edge-fallback-routing)

---

## 1. Architectural Overview & Principles

The Bright Solutions frontend navigation architecture is designed for high-throughput Indian hospital environments (OPD clinics, multi-bed inpatient wards, 24/7 billing counters, and unauthenticated waiting room displays). It adheres to four structural mandates:

1. **Role-Isolated Workspaces:** Rather than a generic administrative dashboard with uniform margins, screens mount within specialized layout shells tailored to clinical ergonomics (e.g. pinned patient vitals bar in consultation chambers, keyboard-first numeric keypad layouts at billing counters).
2. **Zero Information Leakage on Displays:** Public waiting room screens (`/display/*`) are 100% unauthenticated, read-only, chromeless Server-Sent Events (SSE) displays that never consume or render Protected Health Information (PHI) such as patient names, diagnoses, or phone numbers.
3. **Deterministic State Preservation:** Clinical routes (`/doctor/consultation/:id`, `/ipd/admissions/:id/folio/*`) enforce navigation locks (`UnsavedChangesGuard`) to guarantee uncommitted doctor SOAP notes or nurse MAR logs cannot be accidentally destroyed by browser back buttons or route transitions.
4. **Offline Edge Alignment:** All routes function identically in cloud deployment and local hospital LAN Docker containers (`docker-compose.edge.yml`), gracefully exposing local edge synchronization indicators without route breakage.

---

## 2. Layout Shell Architecture

Every page route in Bright Solutions inherits from one of six layout shells:

```
+------------------------------------------------------------------------------------+
|                                    RootLayout                                      |
|  +------------------------------------------------------------------------------+  |
|  |                       Global Toast & Edge LAN Sync Beacon                    |  |
|  +------------------------------------------------------------------------------+  |
|         |                     |                     |                     |        |
|  +--------------+    +--------------+    +--------------+    +--------------+      |
|  | ChamberLayout|    |  WardLayout  |    |CounterLayout |    |TVDisplayLay. |      |
|  | (Doctor OPD) |    | (Nurse IPD)  |    | (Front-Desk) |    | (Chromeless) |      |
|  +--------------+    +--------------+    +--------------+    +--------------+      |
+------------------------------------------------------------------------------------+
```

### 2.1 ChamberLayout (Doctor Consultation)
- **Primary Use:** OPD Doctor Cabin Consultation, Telemetry Dossier Review.
- **Top Bar:** Fixed Hospital Identity, Cabin Number, Logged-in Doctor Name, Active Department, and Emergency Consultation Switcher.
- **Pinned Sub-Header:** Active Patient Encounter Strip containing Avatar Squircle, Patient Name, Master UHID, Token #, Vitals Badges (BP, HR, SpO2, Temp, BMI), Primary Allergy Alert Pill, and Print Rx / Sign-and-Lock action buttons.
- **Body:** Rigid 2-Column Clinical Split (`290px` Left Queue Drawer + `1fr` Tabbed Clinical Workspace with internal scroll containment).

### 2.2 WardLayout (Inpatient Station & Beds)
- **Primary Use:** Nurse Station, Bed Occupancy Matrix, Inpatient Clinical Folio (6-Day Book).
- **Top Bar:** Ward Selector (General Ward, Semi-Private, ICU, Post-Op Daycare), Active Shift Indicator (Morning, Evening, Night), Emergency Code-Blue Beacon.
- **Navigation Drawer:** Collapsible left navigation showing Bed Status (Occupied, Clean, Dirty, Reserved), Patient Roster, and Daily Medication Due Counters.
- **Body:** Full-height viewport containing either the Interactive Bed Grid or the 5-Tab Inpatient Clinical Folio.

### 2.3 CounterLayout (Reception & Billing)
- **Primary Use:** Front-Desk Patient Registration, OPD Token Check-in, Multi-Point Cashier POS, Pharmacy Dispensing Desk.
- **Top Bar:** Hospital Counter Identifier (e.g. Counter 03), Current Cashier Ledger Shift ID, Quick Cash Drawer Balance, Fast Token Call Shortcut.
- **Ergonomics:** Tabular data grids with high contrast, compact line-height (`density="compact"`), autofocus on search inputs, and hardware thermal printer trigger bindings (`Ctrl+P` / `F9`).

### 2.4 TVDisplayLayout (Waiting Room Public Screens)
- **Primary Use:** Large format waiting lounge LED TVs, hallway token annunciators.
- **Structure:** 100% Chromeless, black/navy high-visibility contrast (`#0f172a`), zero browser scrollbars (`overflow: hidden`).
- **Data Surface:** Doctor Cabin Name, Large Monospace Token Number (`#142`), Room Number, Audible Chime Trigger Hook, and scrolling clinic marquee footer. Zero patient names or clinical details.

### 2.5 AuthLayout & AdminLayout
- **AuthLayout:** Minimalist centered card container with hospital branding, facility selector, and secure login form.
- **AdminLayout:** Standard institutional drawer shell with audit log feeds, tariff master rate tables, user RBAC role assignment grids, and bed master management.

---

## 3. Route Guard Pipeline

Route transitions pass through a sequential pipeline of four client-side guards:

```mermaid
flowchart TD
    Req[Route Request] --> G1{AuthGuard}
    G1 -- Token Missing / Expired --> Login["Redirect to /login?redirect=..."]
    G1 -- Valid Token --> G2{RoleGuard}
    G2 -- Role Denied (D13) --> Forbidden["403 Access Denied Screen"]
    G2 -- Role Approved --> G3{UnsavedChangesGuard}
    G3 -- Form Dirty & Unsaved --> Prompt["Confirm Navigation Modal"]
    Prompt -- Cancel --> Stay[Stay on Page]
    Prompt -- Confirm / Discard --> G4[Mount Page Component]
    G3 -- Form Clean --> G4
```

1. **`AuthGuard`:** Validates JWT access token existence in memory. If missing or expired, triggers silent refresh via `/api/v1/auth/refresh`. If refresh fails, redirects to `/login` preserving target query URI. Public routes (`/login`, `/display/*`, `/health`) bypass this guard.
2. **`RoleGuard`:** Compares current user's role against route's `allowedRoles` array based on [13_rbac_permission_matrix.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/13_rbac_permission_matrix.md). Unauthorized attempts render `<ForbiddenView code="403" />`.
3. **`UnsavedChangesGuard`:** Checks `useConsultationStore.isDirty` or `useInpatientStore.isDirty`. If active form contains uncommitted changes, blocks navigation and renders modal: *"You have unsaved clinical documentation. Discard changes or continue editing?"*.
4. **`EdgeFallbackGuard`:** In local LAN fallback mode (`OFFLINE-MODE`), disables routes requiring live cloud gateways (e.g. external ABDM gateway sync) and badges routes with offline warnings.

---

## 4. Master Route Inventory

| Route Path | Page Component | Layout Shell | Allowed Roles (D13) | Permissions (D13) | Backend Endpoints (D11) | Description |
|:---|:---|:---|:---|:---|:---|:---|
| `/login` | `LoginPage` | `AuthLayout` | `PUBLIC` | None | `POST /auth/login` | Staff authentication with Argon2id credentials |
| `/unauthorized` | `ForbiddenPage` | `AuthLayout` | `PUBLIC` | None | None | 403 Access Denied notification screen |
| `/` | `RootRedirector` | None | Authenticated | None | None | Redirects to default role dashboard upon login |
| **OUTPATIENT (OPD)** | | | | | | |
| `/reception/queue` | `ReceptionQueuePage` | `CounterLayout` | `RECEPTIONIST`, `HOSPITAL_ADMIN`, `SUPER_ADMIN` | `queue:read`, `queue:call` | `GET /opd/queue`, `POST /opd/queue/token` | Front desk OPD token issue & patient queue tracker |
| `/reception/register` | `PatientRegisterPage` | `CounterLayout` | `RECEPTIONIST`, `HOSPITAL_ADMIN`, `SUPER_ADMIN` | `patient:create` | `POST /patients`, `GET /patients/search` | Master patient index onboarding & UHID generation |
| `/reception/patients` | `PatientDirectoryPage` | `CounterLayout` | `RECEPTIONIST`, `BILLING_CLERK`, `HOSPITAL_ADMIN` | `patient:read` | `GET /patients`, `GET /patients/search` | Hospital patient archive with filter by UHID/Phone |
| `/reception/patients/:patientId` | `PatientProfilePage` | `CounterLayout` | `RECEPTIONIST`, `BILLING_CLERK`, `HOSPITAL_ADMIN` | `patient:read`, `patient:update` | `GET /patients/{id}`, `PUT /patients/{id}` | Non-clinical demographic update & visit history |
| `/nurse/triage` | `NurseTriageQueuePage` | `CounterLayout` | `NURSE`, `HOSPITAL_ADMIN` | `vitals:read` | `GET /opd/queue` | Queue of patients waiting for triage intake |
| `/nurse/triage/:encounterId` | `NurseVitalsIntakePage` | `ChamberLayout` | `NURSE`, `HOSPITAL_ADMIN` | `vitals:create` | `POST /vitals`, `GET /patients/{id}` | Form for BP, HR, SpO2, Temp, RR, Height, Weight |
| `/doctor/queue` | `DoctorQueuePage` | `ChamberLayout` | `DOCTOR`, `HOSPITAL_ADMIN` | `queue:read`, `encounter:read` | `GET /opd/queue/doctor` | Doctor's active chamber queue & calling dashboard |
| `/doctor/consultation/:encounterId` | `DoctorConsultationPage` | `ChamberLayout` | `DOCTOR` | `encounter:write`, `cdss:read`, `rx:write` | `GET /encounters/{id}`, `POST /encounters/{id}/sign` | SOAP notes, ICD-10 linking, e-Rx, lab orders |
| `/doctor/history/:patientId` | `DoctorPatientDossierPage` | `ChamberLayout` | `DOCTOR` | `encounter:read`, `lab:read` | `GET /patients/{id}/dossier` | Longitudinal outpatient history & prior prescriptions |
| **INPATIENT (IPD)** | | | | | | |
| `/ipd/beds` | `BedMatrixPage` | `WardLayout` | `NURSE`, `DOCTOR`, `RECEPTIONIST`, `HOSPITAL_ADMIN` | `ipd:bed_read` | `GET /ipd/beds/matrix` | Visual ward bed occupancy grid with color states |
| `/ipd/admissions` | `AdmissionRosterPage` | `WardLayout` | `NURSE`, `DOCTOR`, `RECEPTIONIST`, `HOSPITAL_ADMIN` | `ipd:admission_read` | `GET /ipd/admissions` | Active admitted patient census across all wards |
| `/ipd/admissions/new` | `AdmissionIntakePage` | `CounterLayout` | `RECEPTIONIST`, `HOSPITAL_ADMIN` | `ipd:admission_write` | `POST /ipd/admissions`, `GET /ipd/beds/available` | Inpatient admission booking & bed reservation |
| `/ipd/admissions/:admissionId/folio` | `InpatientFolioPage` | `WardLayout` | `NURSE`, `DOCTOR`, `HOSPITAL_ADMIN` | `ipd:clinical_read` | `GET /ipd/admissions/{id}/folio` | Primary container for Client 6-Day Book Digitization |
| `/ipd/admissions/:admissionId/discharge`| `DischargeSummaryPage`| `ChamberLayout` | `DOCTOR` | `ipd:discharge_write` | `POST /ipd/admissions/{id}/discharge` | Mandatory doctor discharge summary & clinical lock |
| **PHARMACY & LAB** | | | | | | |
| `/pharmacy/queue` | `PharmacistQueuePage` | `CounterLayout` | `PHARMACIST`, `HOSPITAL_ADMIN` | `rx:read`, `rx:dispense` | `GET /pharmacy/dispensary/queue` | Pending e-prescription fulfillment queue |
| `/pharmacy/dispense/:rxId` | `DrugDispensationPage` | `CounterLayout` | `PHARMACIST` | `rx:dispense` | `POST /pharmacy/dispense` | Batch allocation, expiry check & counter bill |
| `/pharmacy/inventory` | `PharmacyInventoryPage` | `CounterLayout` | `PHARMACIST`, `HOSPITAL_ADMIN` | `pharmacy:inventory` | `GET /pharmacy/inventory/batches` | Stock levels, reorder alerts & lot receiving |
| `/lab/orders` | `LabOrdersQueuePage` | `CounterLayout` | `LAB_TECHNICIAN`, `HOSPITAL_ADMIN` | `lab:read` | `GET /lab/orders/pending` | Worklist of ordered tests requiring collection |
| `/lab/specimens` | `SpecimenIntakePage` | `CounterLayout` | `LAB_TECHNICIAN` | `lab:write` | `POST /lab/specimens/collect` | Specimen barcode acknowledgment & phlebotomy |
| `/lab/entry/:orderId` | `LabResultEntryPage` | `CounterLayout` | `LAB_TECHNICIAN` | `lab:write` | `POST /lab/results` | Multi-parameter numeric result entry & panic flags |
| **BILLING & CASHIER** | | | | | | |
| `/billing/pos` | `BillingCounterPage` | `CounterLayout` | `BILLING_CLERK`, `HOSPITAL_ADMIN` | `billing:create` | `POST /billing/invoices/opd` | Rapid OPD fee collection & 80mm thermal receipt |
| `/billing/invoices` | `InvoiceLedgerPage` | `CounterLayout` | `BILLING_CLERK`, `HOSPITAL_ADMIN` | `billing:read` | `GET /billing/invoices` | Master invoice ledger with filter by payment state |
| `/billing/ipd-settlement/:admissionId` | `IpdSettlementPage` | `CounterLayout` | `BILLING_CLERK`, `HOSPITAL_ADMIN` | `billing:settle` | `GET /billing/ipd/{id}/bill-draft`, `POST /settle` | 10-Head consolidated IPD bill & payment clearance |
| **HOSPITAL ADMIN** | | | | | | |
| `/admin/users` | `UserManagementPage` | `AdminLayout` | `HOSPITAL_ADMIN`, `SUPER_ADMIN` | `admin:users` | `GET /admin/users`, `POST /admin/users` | Staff credentials, role assignment & status toggle |
| `/admin/tariffs` | `TariffMasterPage` | `AdminLayout` | `HOSPITAL_ADMIN`, `SUPER_ADMIN` | `admin:tariffs` | `GET /admin/tariffs`, `PUT /admin/tariffs` | Standard service price schedules & bed tariffs |
| `/admin/beds` | `BedConfigPage` | `AdminLayout` | `HOSPITAL_ADMIN`, `SUPER_ADMIN` | `admin:beds` | `GET /admin/wards`, `POST /admin/beds` | Ward creation, room config, and bed inventory |
| `/admin/audit-logs` | `SecurityAuditLogPage` | `AdminLayout` | `HOSPITAL_ADMIN`, `SUPER_ADMIN` | `admin:audit` | `GET /admin/audit-logs` | Immutable audit trail of sign-offs & DDI overrides |
| **WAITING ROOM DISPLAY** | | | | | | |
| `/display/waiting-room` | `WaitingRoomDisplayPage`| `TVDisplayLayout` | `PUBLIC` (No Auth) | None | `SSE /display/queue/stream` | Fullscreen waiting lounge token announcer |
| `/display/ward-matrix` | `WardPublicBoardPage` | `TVDisplayLayout` | `PUBLIC` (No Auth) | None | `SSE /display/ward/stream` | Bed matrix whiteboard for nursing station TV |

---

## 5. Inpatient (IPD) 6-Day Book Digitized Route Hierarchy

To faithfully represent the client's physical 6-day admission binder (`docs/client_docs/IPD Book 6 Days.pdf`), the `/ipd/admissions/:admissionId/folio` route is structured as an integrated clinical hub with synchronized tab navigation:

```
/ipd/admissions/:admissionId/folio
  ├── ?tab=consent          --> Form 8 & 9: Face Sheet, Medico-Legal Status (MLC) & Consents
  ├── ?tab=admission-note   --> Form 10: Doctor Comprehensive H&P Admission Note
  ├── ?tab=mar              --> Form 29: Inpatient Treatment Sheet & 6-Day Medication Grid
  ├── ?tab=fluid-chart      --> Form 61: Daily 24h Intake & Output Balance Ledger
  └── ?tab=nurse-notes      --> Form 72: Nurse 3-Shift Observations & Vitals Record
```

### Route & Form Parity Table

| Tab Parameter | Client PDF Document Form | Primary Clinical Actor | Key Interactions | Print Template Binding (D20) |
|:---|:---|:---|:---|:---|
| `?tab=consent` | **Forms 8 & 9:** Face Sheet & General / High-Risk Consent | Receptionist / Admitting Nurse | MLC checkbox, Next of Kin contact, Cash/TPA scheme, Signature capture | `TEMPLATE_IPD_FACE_SHEET` (A4 Portrait) |
| `?tab=admission-note` | **Form 10:** Doctor H&P Note | Attending Consultant | Chief complaints, Past medical history, Systemic review, Provisional ICD-10 | `TEMPLATE_IPD_ADMISSION_NOTE` (A4 Portrait) |
| `?tab=mar` | **Form 29:** Treatment Sheet & MAR | Staff Nurse & Doctor | 6-Day time-slot grid (06:00, 12:00, 18:00, 22:00), O2 flow rate, IV pump mL/hr | `TEMPLATE_IPD_MAR_SHEET` (A4 Landscape) |
| `?tab=fluid-chart` | **Form 61:** 24h Intake & Output Chart | Staff Nurse | Hourly oral/IV intake vs urine/drain output, auto-calculated Net Balance | `TEMPLATE_IPD_FLUID_BALANCE` (A4 Landscape) |
| `?tab=nurse-notes` | **Form 72:** Daily Vitals & Shift Notes | Staff Nurse | Morning, Evening, Night shift logs, NEWS2 score calculation, 0–10 Pain score | `TEMPLATE_IPD_NURSE_NOTES` (A4 Portrait) |

---

## 6. Navigation State, Breadcrumbs & Deep-Linking

### 6.1 Clinical Breadcrumb Schema
Clinical routes dynamically generate breadcrumb trails to enable rapid parent navigation without losing context:
- Consultation: `OPD Queue (Cabin 01) > Consultation > Ananya Sharma (UHID-2026-00142)`
- Inpatient: `Ward Matrix > Ward 3 (Female Semi-Private) > Bed 302 > Clinical Folio (Day 3)`
- Invoicing: `Billing Counter > IPD Discharge Settlements > Rajan Pillai (INV-2026-00891)`

### 6.2 Deep-Link Query Parameters
- `?token=<num>`: Automatically highlights and focuses the requested token in queue lists.
- `?highlight=<id>`: Flashes target table row in blue accent for 1500ms after navigation.
- `?day=<1-6>`: Directly opens the target day column in Form 29 (MAR) or Form 61 (Intake/Output).
- `?filter=WAITING|IN_ROOM|COMPLETED`: Preserves active queue filter tab across page reloads.

---

## 7. Offline Edge Fallback Routing

When the hospital broadens fiber breaks and drops cloud connection, the local Edge Docker service activates. The frontend router responds through deterministic fallback mechanics:

1. **Beacon Pill:** Topbar displays persistent Amber badge: `[ LOCAL EDGE LAN ACTIVE • 4 Pending Cloud Syncs ]`.
2. **Blocked Cloud Routes:** External gateway routes (e.g. cloud ABDM health ID validation) redirect to `/offline-advisory` with a retry beacon.
3. **Preserved Core Flow:** OPD token issue, Doctor consultation, Nurse MAR execution, and Billing counter operations continue seamlessly, appending the `OFFLINE-` sequence prefix to generated IDs.
