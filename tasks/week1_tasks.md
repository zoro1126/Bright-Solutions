# Week 1 Master Program Plan — Dual-Workstream Hospital OS
## Bright Solutions: Outpatient to Inpatient Clinical Core & Modular SaaS

> **Program Document:** Cycle 1, Week 1 Dual-Workstream Master Index  
> **Workspace Location:** `tasks/week1_tasks.md`  
> **Status:** 🟡 SPRINT ACTIVE (Dual-Workstream Architecture Activated)  
> **Staffing Allocation:** 2 Concurrent Developers (Developer 1: Backend Core & APIs; Developer 2: Frontend UX & Inpatient Folio)  
> **Design References:** [01_PRD.md](file:///home/prem/Desktop/pbt/COS/docs/design/01_PRD.md), [03_technical_architecture.md](file:///home/prem/Desktop/pbt/COS/docs/design/03_technical_architecture.md), [04_data_model_spec.md](file:///home/prem/Desktop/pbt/COS/docs/design/04_data_model_spec.md), [09_database_schema_ddl.sql](file:///home/prem/Desktop/pbt/COS/docs/design/09_database_schema_ddl.sql), [11_api_endpoint_inventory.md](file:///home/prem/Desktop/pbt/COS/docs/design/11_api_endpoint_inventory.md), [13_rbac_permission_matrix.md](file:///home/prem/Desktop/pbt/COS/docs/design/13_rbac_permission_matrix.md), [15_page_route_map.md](file:///home/prem/Desktop/pbt/COS/docs/design/15_page_route_map.md), [16_ui_component_inventory.md](file:///home/prem/Desktop/pbt/COS/docs/design/16_ui_component_inventory.md), [17_design_system_tokens.md](file:///home/prem/Desktop/pbt/COS/docs/design/17_design_system_tokens.md), [21_adrs.md](file:///home/prem/Desktop/pbt/COS/docs/design/21_adrs.md), [23_cycle_1_pitch.md](file:///home/prem/Desktop/pbt/COS/docs/design/23_cycle_1_pitch.md)  
> **Client Clinical Dossier:** `docs/client_docs/IPD Book 6 Days.pdf` (86 Pages / 14 Clinical Forms)  

---

## ⚠️ Dual-Workstream Git Conflict Prevention Protocol

To eliminate merge conflicts in the **Change Log** and task progress trackers when two developers commit concurrently:

1. **Workstream A (Backend Developer):**
   - **Dedicated File:** [`tasks/week1_backend_tasks.md`](file:///home/prem/Desktop/pbt/COS/tasks/week1_backend_tasks.md)
   - Make all backend task checkbox updates `[x]` and append backend changelog entries **strictly** inside `tasks/week1_backend_tasks.md`.
   - Never edit the frontend changelog.
2. **Workstream B (Frontend Developer):**
   - **Dedicated File:** [`tasks/week1_frontend_tasks.md`](file:///home/prem/Desktop/pbt/COS/tasks/week1_frontend_tasks.md)
   - Make all frontend task checkbox updates `[x]` and append frontend changelog entries **strictly** inside `tasks/week1_frontend_tasks.md`.
   - Never edit the backend changelog.
3. **Master Program Document (`tasks/week1_tasks.md`):**
   - Acts as the high-level roadmap and synchronized sprint dashboard.
   - Updated only during major phase milestones or sprint reviews.

---

## High-Level Program Progress Summary

| Workstream | Dedicated File | Total Tasks | Completed | In Progress | Pending | Completion Rate | Velocity Status |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---|
| **Workstream A: Backend Engineering (Lead 1)** | [`week1_backend_tasks.md`](file:///home/prem/Desktop/pbt/COS/tasks/week1_backend_tasks.md) | 38 | 12 | 1 | 25 | **31.6%** | 🟢 On Schedule (Phases BE-1 & BE-2 Completed) |
| **Workstream B: Frontend Engineering (Lead 2)** | [`week1_frontend_tasks.md`](file:///home/prem/Desktop/pbt/COS/tasks/week1_frontend_tasks.md) | 38 | 0 | 1 | 37 | **0.0%** | 🟡 Sprint Kickoff (Phase FE-1 Active) |
| **COMBINED PROGRAM TOTAL** | | **76** | **12** | **2** | **62** | **15.8%** | 🚀 Active Parallel Execution |

---

## Workstream A: Backend Engineering Overview
> **Full Details & Live Changelog:** [tasks/week1_backend_tasks.md](file:///home/prem/Desktop/pbt/COS/tasks/week1_backend_tasks.md)  
> **Lead Scope:** Database DDL, Multi-Tenancy, Argon2id Auth, RBAC, Ed25519 Licensing, Monotonic Sequences, OPD/IPD Endpoints, Form Submission Engine, 10-Head Billing Ledger, Concurrency Pytest Suites.

### Backend Milestone Phases (38 Tasks)

| Milestone Phase | Total Tasks | Completed | In Progress | Pending | Status |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Phase BE-1: Database Provisioning & Master Seeds (SaaS Ready)** | 6 | 6 | 0 | 0 | 🟢 Completed |
| **Phase BE-2: Auth, Ed25519 Licensing & Sequences** | 6 | 6 | 0 | 0 | 🟢 Completed |
| **Phase BE-3: Outpatient (OPD) Flow & Module Guard** | 6 | 0 | 1 | 5 | 🟡 In Progress |
| **Phase BE-4: Inpatient (IPD) Admission, Bed Allocations & Consents** | 5 | 0 | 0 | 5 | ⚪ Not Started |
| **Phase BE-5: 14-Form Inpatient Clinical Suite (Form Engine)** | 8 | 0 | 0 | 8 | ⚪ Not Started |
| **Phase BE-6: Inpatient Discharge & Consolidated 10-Head Billing** | 4 | 0 | 0 | 4 | ⚪ Not Started |
| **Phase BE-7: End-to-End API Integration & Concurrency Hardening** | 3 | 0 | 0 | 3 | ⚪ Not Started |
| **BACKEND TOTAL** | **38** | **12** | **1** | **25** | **31.6% Completed** |

---

## Workstream B: Frontend Architecture & Design Overview
> **Full Details & Live Changelog:** [tasks/week1_frontend_tasks.md](file:///home/prem/Desktop/pbt/COS/tasks/week1_frontend_tasks.md)  
> **Lead Scope:** React 18, Vite, Specialized Layout Shells (`Chamber`, `Ward`, `Counter`), Auth Context & License Indicators, Patient Registration & Live Token Queue, Ward Bed Matrix, 14-Form Inpatient Folio, 10-Head Inpatient Ledger, Waiting Room TV Displays, Design System Tokens & Tablet Polish.

### Frontend Milestone Phases (38 Tasks)

| Milestone Phase | Total Tasks | Completed | In Progress | Pending | Status |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Phase FE-1: Modular SaaS Shell, Auth Context & License Guard** | 6 | 0 | 1 | 5 | 🟡 In Progress |
| **Phase FE-2: Outpatient (OPD) Workspaces & Live Queue Polish** | 6 | 0 | 0 | 6 | ⚪ Not Started |
| **Phase FE-3: Inpatient (IPD) Bed Matrix & Dual-Path Intake Modals** | 5 | 0 | 0 | 5 | ⚪ Not Started |
| **Phase FE-4: Digitized 14-Form Inpatient Folio (Client 6-Day Suite)** | 8 | 0 | 0 | 8 | ⚪ Not Started |
| **Phase FE-5: Inpatient 10-Head Discharge Settlement & Receipt Polish** | 4 | 0 | 0 | 4 | ⚪ Not Started |
| **Phase FE-6: Chromeless Waiting Room TV Display & Edge LAN Beacon** | 3 | 0 | 0 | 3 | ⚪ Not Started |
| **Phase FE-7: Design System Polish, Typography & Responsive Review** | 6 | 0 | 0 | 6 | ⚪ Not Started |
| **FRONTEND TOTAL** | **38** | **0** | **1** | **37** | **0.0% Completed** |

---

## Sprint Release Milestones & Acceptance Criteria

1. **Milestone M1 (Foundations & Security — Completed Oct 28):**
   - 56 InnoDB MySQL tables provisioned with multi-tenancy & generated columns.
   - Argon2id authentication, RBAC permission checker, and Asymmetric Ed25519 offline licensing verified.
   - Concurrency-safe monotonic sequence service (`UHID`, `OPD`, `IPD`, `BILL`).

2. **Milestone M2 (Outpatient to Inpatient Referral):**
   - Full OPD check-in $\to$ nurse vitals $\to$ doctor SOAP notes $\to$ e-Rx $\to$ IPD referral handoff.
   - Front desk registration with duplicate Aadhaar check and thermal slip printing.

3. **Milestone M3 (Interactive Inpatient Care & Bed Allocation):**
   - Real-time Ward Bed Occupancy Matrix with state transitions (`AVAILABLE`, `OCCUPIED`, `CLEANING`).
   - Dual-path IPD admission booking (OPD referral vs direct casualty).
   - Form 8 (Admission Consent) & Form 9 (Face Sheet) generation.

4. **Milestone M4 (Digitized 14-Form Clinical Folio):**
   - Full digitization of client 6-day admission binder (`IPD Book 6 Days.pdf`).
   - Doctor Treatment Orders & Nurse 6-Day MAR (Form 29) with shift administration logging.
   - 24h Fluid Balance Chart (Form 61) with real-time intake/output net tally.
   - Surgical OT suite (Pre-anaesthesia Form 15, OT Checklist Form 54, Operation Notes).
   - Nurse care plans (Form 71) and shift handover notes (Form 72) with automated NEWS2 scoring.

5. **Milestone M5 (Discharge Settlement & Hardening):**
   - Doctor clinical discharge summary and encounter lock.
   - Consolidated 10-head inpatient billing ledger with advance deduction.
   - Exact rupee balance reconciliation, final A4 invoice print, and bed transition to `CLEANING`.
   - Automated end-to-end pytest regression test suite passing with zero race conditions.
