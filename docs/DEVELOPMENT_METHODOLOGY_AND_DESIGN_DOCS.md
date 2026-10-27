# Bright Solutions — Development Methodology & Essential Design Documents

> **Audience:** Core team (currently 2 devs, scaling to 5)  
> **Timeline:** 6 months (≈ 26 weeks)  
> **Product:** Dual-deployment (on-prem + cloud) healthcare SaaS with NABH & ABDM compliance  
> **Last Updated:** October 2026

---

## Table of Contents

1. [Why Methodology Matters at This Scale](#1-why-methodology-matters-at-this-scale)
2. [Methodology Comparison for Small Teams](#2-methodology-comparison-for-small-teams)
3. [Recommended: Shape Up + Kanban Hybrid ("Shaped Kanban")](#3-recommended-shape-up--kanban-hybrid-shaped-kanban)
4. [How Shaped Kanban Works — Cycle by Cycle](#4-how-shaped-kanban-works--cycle-by-cycle)
5. [Essential Design Documents — Complete Inventory](#5-essential-design-documents--complete-inventory)
6. [Essential Diagrams — Complete Inventory](#6-essential-diagrams--complete-inventory)
7. [Document Ownership & Lifecycle](#7-document-ownership--lifecycle)
8. [Tooling Recommendations](#8-tooling-recommendations)
9. [6-Month Phased Timeline](#9-6-month-phased-timeline)
10. [Existing Documents — Gap Analysis](#10-existing-documents--gap-analysis)
11. [Appendix: Indian Healthcare Compliance Standards](#11-appendix-indian-healthcare-compliance-standards)

---

## 1. Why Methodology Matters at This Scale

With 2 developers, you're operating at a scale where:

- **Ceremony kills velocity.** Every hour spent in a planning meeting is an hour not coding. A full Scrum implementation (Sprint Planning, Daily Standup, Sprint Review, Sprint Retrospective, Backlog Grooming) burns 15–20% of a 2-person team's weekly capacity.
- **Context switching is lethal.** With only 2 devs, each person carries deep context about 50% of the system. Interruptions and poorly scoped work destroy throughput.
- **You can't afford rework.** At this team size, building the wrong thing for 2 weeks means losing ~8% of your entire 6-month runway.
- **But zero process breeds chaos.** Without structured planning, a healthcare product with NABH compliance, dual-deployment, and 8+ microservices will drown in scope creep, integration bugs, and missed regulatory requirements.

The right methodology must be **lightweight enough for 2 people** but **structured enough for regulated healthcare software**.

---

## 2. Methodology Comparison for Small Teams

| Methodology | Ceremony Overhead | Fits 2 Devs? | Scales to 5? | Handles Compliance? | Verdict |
|:---|:---:|:---:|:---:|:---:|:---|
| **Full Scrum** | Heavy (5 ceremonies/sprint) | ❌ Too much overhead | ✅ | ✅ Structured artifacts | Overkill for < 5 devs |
| **Pure Kanban** | Minimal | ✅ | ✅ | ⚠️ No planning horizon | Too reactive for a 6-month regulated build |
| **XP (Extreme Programming)** | Medium | ✅ Pair programming native | ⚠️ Hard above 4 | ✅ TDD focus | Good engineering culture but weak on planning |
| **Shape Up (Basecamp)** | Low-Medium | ✅ | ✅ | ⚠️ Needs compliance bolt-on | Great scoping but assumes product maturity |
| **Shaped Kanban (Hybrid)** | **Low** | ✅ | ✅ | ✅ With compliance gates | **Best fit** — see below |

---

## 3. Recommended: Shape Up + Kanban Hybrid ("Shaped Kanban")

### Core Principles

**From Shape Up (planning & scoping):**
- Work in **4-week cycles** (not 2-week sprints — too short for meaningful healthcare features).
- Every cycle starts with a **Pitch** — a shaped problem statement with clear boundaries, not a backlog of tickets.
- **Appetite over estimates.** You decide "we'll spend 4 weeks on the prescription module" — not "how long will the prescription module take?"
- **Cool-down period** (1 week between cycles) for bug fixes, tech debt, compliance documentation, and deciding what to shape next.

**From Kanban (daily execution):**
- **No sprints.** Work flows through columns: `Shaped → In Progress → In Review → Done`.
- **WIP limits.** Each dev works on at most 1 major feature and 1 minor task at a time. Maximum 3 items in `In Progress` for the team.
- **Continuous deployment** to staging. No "sprint demo" — the demo is the staging environment.

**Added for Healthcare Compliance:**
- **Compliance gates** at the end of each cycle: a 30-minute review of whether anything built in the cycle triggers regulatory documentation updates (NABH, ABDM, DPDP).
- **Audit trail requirements** are treated as first-class stories, not afterthoughts.

### Why This Works for Bright Solutions

```
┌─────────────────────────────────────────────────────────────┐
│                    4-WEEK CYCLE STRUCTURE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Week 0 (Cool-down)     Shaping + Bug Fixes + Compliance   │
│  ─────────────────       ─────────────────────────────────  │
│  • Review last cycle     • Fix production bugs              │
│  • Shape next pitch      • Update compliance docs           │
│  • Write/update specs    • Refactor tech debt               │
│  • Decide appetite       • Update design docs               │
│                                                             │
│  Weeks 1-4 (Build)      Execution via Kanban Board          │
│  ──────────────────      ───────────────────────────────    │
│  • Dev 1: Feature A      Shaped → In Progress → Review     │
│  • Dev 2: Feature B      → Done                            │
│  • Daily async check-in  Max 3 WIP items                   │
│  • Continuous deploys    No sprint ceremonies               │
│                                                             │
│  End of Week 4          Compliance Gate                     │
│  ──────────────────      ───────────────────────────────    │
│  • 30-min review         Does this cycle's work affect:     │
│  • Ship to staging       - Patient data handling? (DPDP)   │
│                          - Clinical workflow? (NABH)        │
│                          - Health data exchange? (ABDM)     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### How Communication Works

| Activity | Frequency | Duration | Format |
|:---|:---|:---|:---|
| **Async Check-in** | Daily | 5 min each | Slack/Discord message: "Yesterday / Today / Blocked" |
| **Shaping Session** | Once per cycle (cool-down week) | 60–90 min | Live call — define next cycle's pitch |
| **Compliance Gate** | Once per cycle (end of build) | 30 min | Checklist review |
| **Architecture Decision** | As needed | 30 min | Write an ADR (see below), async review |
| **Pair Programming** | 2-3x per week | 60–120 min | On complex or risky features |
| **Full Retrospective** | Every 2 cycles (~10 weeks) | 45 min | What worked / what didn't / what to change |

---

## 4. How Shaped Kanban Works — Cycle by Cycle

### 6-Month Cycle Plan (5 build cycles + cool-downs)

```
Month 1:  [Cool-down 0: Setup]  [━━━ Cycle 1: Foundation ━━━━]
Month 2:  [CD]  [━━━ Cycle 2: Clinical Core ━━━━━━━━━━━━━━━━━]
Month 3:  [CD]  [━━━ Cycle 3: AI Services ━━━━━━━━━━━━━━━━━━━]
Month 4:  [CD]  [━━━ Cycle 4: Billing + Queue ━━━━━━━━━━━━━━━]
Month 5:  [CD]  [━━━ Cycle 5: Integration + Compliance ━━━━━━]
Month 6:  [CD]  [━━━ Hardening + Launch Prep ━━━━━━━━━━━━━━━━]

CD = Cool-down week (1 week)
```

### The Pitch Document (One Per Cycle)

Every cycle begins with a **Pitch** — a 1-2 page document that answers:

1. **Problem:** What user problem are we solving this cycle?
2. **Appetite:** How much time are we willing to spend? (4 weeks max)
3. **Solution Shape:** High-level approach with fat-marker sketches (not wireframes)
4. **Rabbit Holes:** Known complexities to avoid or time-box
5. **No-Goes:** What we're explicitly NOT building this cycle
6. **Compliance Impact:** Does this touch PHI/PII? Which standards apply?

---

## 5. Essential Design Documents — Complete Inventory

Below is every design document you need, categorized by when it's created and how often it's updated.

### Tier 1: Foundation Documents (Create BEFORE Cycle 1)

These are written once and updated infrequently. They define the "what" and "why."

| # | Document | Purpose | Format | Pages | Status |
|:--|:---|:---|:---|:---:|:---|
| **D1** | **Product Requirements Document (PRD)** | What the product does, who it's for, success metrics, scope boundaries | Markdown | 5–8 | ✅ Exists — `docs/design/01_PRD.md` |
| **D2** | **Feature Specification** | Detailed per-module feature breakdown with acceptance criteria | Markdown | 10–15 | ❌ Missing |
| **D3** | **Technical Architecture Document (TAD)** | System topology, tech stack, data flow, multi-tenancy, AI pipeline | Markdown + Mermaid | 15–25 | ❌ Needs full rewrite for MySQL + on-prem |
| **D4** | **Data Model & Schema Specification** | Every table, column, index, constraint across all MySQL databases | SQL DDL + ERD | 15–20 | ❌ Missing — must be created before backend dev starts |
| **D5** | **API Contract Specification** | Every endpoint: method, path, request/response schemas, error codes, auth | OpenAPI 3.1 YAML + Markdown | 20–30 | ⚠️ Partial — needs full OpenAPI formalization |
| **D6** | **Compliance & Regulatory Matrix** | NABH, ABDM, DPDP Act 2023, and other Indian healthcare standards mapped to features | Markdown table | 8–12 | ❌ **Missing — Critical** |
| **D7** | **Deployment Architecture Document** | Staging vs. on-prem topology, Docker configs, server setup, backup strategy | Markdown + Diagrams | 8–12 | ❌ **Missing — Critical** |
| **D8** | **Security & Access Control Specification** | RBAC matrix, authentication flows, encryption standards, audit logging, PHI handling | Markdown | 8–10 | ❌ **Missing — Important** |

---

### Tier 1B: Backend Documentation (Must Exist BEFORE Backend Dev Starts)

These documents are what the **backend lead and backend junior** work from. Without them, development cannot start in a coordinated way.

| # | Document | Purpose | Format | Owner |
|:--|:---|:---|:---|:---|
| **D9** | **Database Schema — Full DDL** | Every MySQL table, column type, constraint, index, foreign key, ENUM values — the canonical source of truth for the schema | SQL DDL file | Backend Lead |
| **D10** | **Entity Relationship Diagrams (ERDs)** | Visual representation of all table relationships per functional domain (Patient, Clinical, Billing, Auth) | Mermaid erDiagram | Backend Lead |
| **D11** | **API Endpoint Inventory** | Complete list of all REST endpoints grouped by module — method, URL, request body shape, response shape, auth required, role access | Markdown table | Backend Lead |
| **D12** | **Service Layer Design** | For each module: what the service class does, what it validates, what it returns, what DB queries it runs — before a single line of service code is written | Markdown | Backend Lead |
| **D13** | **RBAC Permission Matrix** | Every role × every endpoint/action — which roles can read, write, delete in each module | Markdown table | Backend Lead |
| **D14** | **Background Jobs & Async Tasks Spec** | Any Celery/ARQ tasks, scheduled jobs, or async operations — trigger, payload, frequency, failure handling | Markdown | Backend Lead |

---

### Tier 1C: Frontend Documentation (Must Exist BEFORE Frontend Dev Starts)

These documents are what the **frontend lead and frontend juniors** work from. Juniors especially cannot build isolated components without these.

| # | Document | Purpose | Format | Owner |
|:--|:---|:---|:---|:---|
| **D15** | **Page & Route Map** | Every page in the app — URL route, page name, which role(s) can access it, which API endpoints it consumes | Markdown table | Frontend Lead |
| **D16** | **UI Component Inventory** | Every reusable component — name, props, variants, which pages use it | Markdown | Frontend Lead |
| **D17** | **Design System & Tokens** | Color palette, typography scale, spacing system, button variants, form field styles, status colors — the design foundation every junior builds from | Markdown + CSS vars | Frontend Lead |
| **D18** | **Wireframes / Screen Mockups** | Low-fidelity screens for every page — layout, key UI elements, form fields, table columns — enough for a junior to implement without guessing | Figma / draw.io | Frontend Lead |
| **D19** | **State Management Design** | How global/shared state is managed (Context API, Zustand, etc.) — what's stored, where, how updated | Markdown | Frontend Lead |
| **D20** | **Print Template Specs** | Exact layout and content of every printable document — Rx slip, patient receipt, lab report, token slip — with field mappings | Markdown + mockup | Frontend Lead |

---

### Tier 2: Living Documents (Created Before Cycle 1, Updated Every Cycle)

These evolve continuously throughout development.

| # | Document | Purpose | Format | Update Frequency |
|:--|:---|:---|:---|:---|
| **D21** | **Architecture Decision Records (ADRs)** | Record every significant technical decision with context, options considered, and rationale | Markdown (1 per decision) | As decisions are made |
| **D22** | **User Stories & Acceptance Criteria** | Structured user stories with Given/When/Then acceptance criteria for every feature | Markdown | Every cycle |
| **D23** | **Cycle Pitch Documents** | Per-cycle problem statement, appetite, solution shape, no-goes | Markdown (1 per cycle) | Every cycle |
| **D24** | **Test Strategy & Test Plan** | Testing approach: unit, integration, E2E, load testing; coverage targets; CI pipeline | Markdown | Updated each cycle |
| **D25** | **API Changelog** | Breaking changes, deprecations, new endpoints — versioned | Markdown | Every release |

### Tier 3: Reference Documents (Created Once, Consulted Often)

| # | Document | Purpose | Format |
|:--|:---|:---|:---|
| **D26** | **Developer Onboarding Guide** | Setup instructions, architecture overview, coding conventions, PR process | Markdown |
| **D27** | **Coding Standards & Conventions** | Python/FastAPI backend patterns + React frontend patterns, naming conventions, error handling | Markdown |
| **D28** | **Environment Configuration Guide** | All env vars, secrets management, database connection strings, feature flags | Markdown + `.env.example` |
| **D29** | **Incident Response & Rollback Playbook** | What to do when prod breaks — rollback procedures, on-call escalation | Markdown |

---

## 6. Essential Diagrams — Complete Inventory

Diagrams are not decorations. Each one answers a specific architectural question that text cannot.

### Tier 1: Must-Have Diagrams (Create Before Cycle 1)

| # | Diagram | Type | Tool | What It Answers |
|:--|:---|:---|:---|:---|
| **DG1** | **System Context Diagram** | C4 Level 1 | Mermaid / draw.io | "What external systems does Bright Solutions interact with?" (ABDM, local hospital edge LAN, payment terminals) |
| **DG2** | **Container Diagram** | C4 Level 2 | Mermaid / draw.io | "What are the deployable units?" (Each microservice, databases, API gateway, message broker, AI gateway) |
| **DG3** | **Entity Relationship Diagram (ERD)** | Database | dbdiagram.io / Mermaid | "What are the tables and how do they relate?" — one ERD per database |
| **DG4** | **Deployment Topology — Cloud** | Infrastructure | draw.io / Mermaid | "How are containers deployed on AWS/Azure?" (K8s pods, managed DBs, load balancers, CDN) |
| **DG5** | **Deployment Topology — On-Premise** | Infrastructure | draw.io / Mermaid | "How does the on-prem hospital installation look?" (Docker Compose, local DB, edge GPU, VPN tunnel) |
| **DG6** | **Authentication & Authorization Flow** | Sequence | Mermaid | "How does login → JWT → tenant resolution → RBAC work end-to-end?" |
| **DG7** | **Data Flow Diagram (PHI/PII)** | Compliance | draw.io | "Where does patient data flow, where is it stored, where is it encrypted?" — Required for DPDP Act compliance |

### Tier 2: Build-Phase Diagrams (Create During Cycles)

| # | Diagram | Type | Tool | When Created |
|:--|:---|:---|:---|:---|
| **DG8** | **Patient Journey Sequence Diagram** | Sequence | Mermaid | Cycle 2 (Clinical Core) — Registration → Triage → Consultation → Prescription → Billing → Discharge |
| **DG9** | **Clinical Queue Priority Sequence** | Sequence | Mermaid | Cycle 2 (Clinical Core) — Triage vitals intake → Heuristic early warning score (NEWS2) → Automated priority queue sorting → Doctor callout |
| **DG10** | **Deterministic CDSS Evaluation Flow** | Flowchart | Mermaid | Cycle 2 (Clinical Core) — Vitals + Active Medications + Patient Allergies → Relational DDI lookup (`cdss_ddi_rules`) → Hard contraindication block / Override audit log |
| **DG11** | **Prescription & Drug Safety Flow** | Sequence | Mermaid | Cycle 2 — Drug entry → DDI check → Allergy check → Formulary validation → Rx sign |
| **DG12** | **Billing & Invoice Lifecycle** | State Machine | Mermaid | Cycle 4 — Draft → Items Added → Rule Audit → Payment → Settled/Refunded |
| **DG13** | **Queue Token Lifecycle** | State Machine | Mermaid | Cycle 4 — Generated → Waiting → Called → In-Consultation → Completed/No-Show |
| **DG14** | **ABDM Health Data Exchange** | Sequence | Mermaid | Cycle 5 — ABHA verification → Consent flow → Health record push/pull |
| **DG15** | **On-Prem ↔ Cloud Sync Flow** | Sequence | Mermaid | Cycle 5 — Offline operation → Queue sync → Conflict resolution → Cloud reconciliation |

### Tier 3: Optional but Valuable

| # | Diagram | Type | When |
|:--|:---|:---|:---|
| **DG16** | **Domain Model / Bounded Context Map** | DDD | If team grows to 5+ and service boundaries need formalization |
| **DG17** | **CI/CD Pipeline Diagram** | DevOps | When setting up automated deployment |
| **DG18** | **Monitoring & Alerting Topology** | Observability | When setting up Prometheus/Grafana |

---

## 7. Document Ownership & Lifecycle

### Core Documents

| Document | Owner | Reviewer | Must Exist Before |
|:---|:---|:---|:---|
| PRD (D1) | Backend Lead | Frontend Lead | Any development |
| Feature Spec (D2) | Backend Lead | Frontend Lead | Timeline creation |
| Tech Architecture (D3) | Backend Lead | Frontend Lead | Any development |
| Compliance Matrix (D6) | Backend Lead | Both | Any clinical feature |
| Deployment Arch (D7) | Backend Lead | Frontend Lead | Staging setup |

### Backend Documents — Backend Lead owns, Backend Junior consumes

| Document | Owner | Reviewer | Must Exist Before |
|:---|:---|:---|:---|
| Database Schema DDL (D9) | Backend Lead | Backend Junior | Backend dev starts |
| ERDs (D10) | Backend Lead | Both | Backend dev starts |
| API Endpoint Inventory (D11) | Backend Lead | Frontend Lead | Frontend dev starts |
| Service Layer Design (D12) | Backend Lead | Backend Junior | Backend junior picks up any task |
| RBAC Permission Matrix (D13) | Backend Lead | Both | Auth implementation |
| Background Jobs Spec (D14) | Backend Lead | Backend Junior | Any async task implementation |

### Frontend Documents — Backend Lead creates, Frontend Lead owns + updates during dev

| Document | Created By | Owner (During Dev) | Must Exist Before |
|:---|:---|:---|:---|
| Page & Route Map (D15) | Backend Lead | Frontend Lead | Frontend dev starts |
| UI Component Inventory (D16) | Backend Lead | Frontend Lead | Juniors write any component |
| Design System & Tokens (D17) | Backend Lead | Frontend Lead | Any UI work |
| Wireframes / Mockups (D18) | Backend Lead | Frontend Lead | Juniors implement any page |
| State Management Design (D19) | Backend Lead | Frontend Lead | Frontend dev starts |
| Print Template Specs (D20) | Backend Lead | Frontend Lead | Any print feature |

### Living Documents

| Document | Owner | Reviewer | Updated |
|:---|:---|:---|:---|
| ADRs (D21) | Whoever decides | Other Lead | As decisions are made |
| Cycle Pitches (D23) | Both Leads | Both | Each cool-down |
| Test Plan (D24) | Both | Both | Each cycle |

### When a New Dev Joins (Scaling from 2 → 5)

New developers should read documents in this exact order:

**Junior Backend Dev:**
1. **D26** (Onboarding Guide) → Environment setup
2. **D1** (PRD) → What are we building and why
3. **D9** (Database Schema DDL) → Exact table/column structure
4. **D10** (ERDs) → Visual relationships
5. **D11** (API Endpoint Inventory) → Every endpoint they might touch
6. **D12** (Service Layer Design) → How services are structured
7. **D13** (RBAC Matrix) → Who can call what
8. **D27** (Coding Standards) → How we write Python/FastAPI here
9. Latest **D23** (Cycle Pitch) → What to build right now

**Junior Frontend Dev:**
1. **D26** (Onboarding Guide) → Environment setup
2. **D1** (PRD) → What are we building and why
3. **D15** (Page & Route Map) → Every page, route, and access level
4. **D18** (Wireframes) → Visual target for every page
5. **D17** (Design System & Tokens) → Colors, typography, spacing — never deviate
6. **D16** (UI Component Inventory) → What reusable components exist already
7. **D11** (API Endpoint Inventory) → Which APIs each page consumes
8. **D27** (Coding Standards) → How we write React/CSS here
9. Latest **D23** (Cycle Pitch) → What to build right now

Time to productive contribution: **< 2 days** with this reading order.

---

## 8. Tooling Recommendations

| Need | Tool | Why |
|:---|:---|:---|
| **Project Board** | GitHub Projects (Kanban view) | Free, integrated with PRs, supports WIP limits via automation |
| **Documents** | Markdown in `/docs` (version-controlled) | Lives with code, reviewed in PRs, no vendor lock-in |
| **Diagrams** | Mermaid (in-markdown) + draw.io (complex infra) | Mermaid is text-based and diffs cleanly; draw.io for visual polish |
| **API Spec** | OpenAPI 3.1 YAML + Swagger UI | Auto-generated from FastAPI, single source of truth |
| **Database ERD** | dbdiagram.io (export PNG) or Mermaid erDiagram | Quick visual, exportable, free tier sufficient |
| **Communication** | Discord or Slack (free tier) | Async check-ins, quick decisions, screen sharing |
| **CI/CD** | GitHub Actions | Free for private repos (2000 min/month), native integration |
| **Secrets** | `.env` locally + GitHub Secrets for CI | Simple, no infra overhead for 2 devs |
| **ADRs** | `docs/adrs/NNNN-title.md` format | Standard MADR format, version-controlled |

---

## 9. 6-Month Phased Timeline

### Phase 0: Foundation & Documentation (Weeks 1–2) — MUST COMPLETE BEFORE DEV STARTS

**Goal:** All Tier 1, Tier 1B (Backend), and Tier 1C (Frontend) documents created. No development begins until both leads sign off on their respective doc sets.

```
Week 1: Architecture + Backend Docs
├── D1  PRD — ✅ Done
├── D2  Feature Specification (module-by-module with acceptance criteria)
├── D3  Technical Architecture Document (updated for MySQL + on-prem)
├── D4  Data Model & Schema Specification
├── D6  Compliance Matrix — NABH + ABDM + DPDP
├── D7  Deployment Architecture — Staging + On-Prem plan
├── D8  Security & Access Control Spec (RBAC matrix)
├── D9  Database Schema Full DDL (all MySQL tables)
├── D10 ERDs (visual — all functional domains)
├── D11 API Endpoint Inventory (all endpoints, grouped by module)
├── D12 Service Layer Design (per module)
└── D13 RBAC Permission Matrix (role × endpoint)

Week 1: Frontend Docs (parallel with Backend Lead doing backend docs)
├── D15 Page & Route Map
├── D16 UI Component Inventory (planned components)
├── D17 Design System & Tokens (palette, typography, spacing)
├── D18 Wireframes for all MVP pages
├── D19 State Management Design
└── D20 Print Template Specs (Rx, receipt, lab report, token slip)

End of Week 1: GATE — Both leads review each other's docs.
           ← No dev starts until this gate is passed →

Week 2: Reference Docs + Cycle Pitch
├── D21 First ADRs (MySQL choice, FastAPI, React+Vite, auth approach)
├── D22 User Stories + Acceptance Criteria (for Week 3–4 tasks)
├── D23 Cycle 1 Pitch document
├── D24 Test Strategy
├── D26 Developer Onboarding Guide (so juniors can onboard)
├── D27 Coding Standards (Python/FastAPI + React)
├── D28 Environment Configuration Guide + .env.example
└── Assign all Week 3 tasks to devs using D22 acceptance criteria

End of Week 2: GATE — Juniors read their onboarding docs + confirm
           environment is working → coding starts Week 3
```

### Cycle 1: Platform Foundation (Weeks 3–6)

**Pitch:** Multi-tenant auth, database setup, API gateway, React shell with dynamic module loading.

- Dev 1: Auth service + JWT + RBAC middleware
- Dev 2: Database migrations + RLS policies + API gateway setup
- Joint: React shell + routing + design system foundation
- **Compliance Gate:** Auth flow handles PHI access logging ✅

### Cycle 2: Clinical Core (Weeks 8–11)

**Pitch:** Patient registration, encounters, vitals, prescriptions, DDI engine, doctor workflow.

- Dev 1: Patient CRUD + Encounter lifecycle + Queue integration
- Dev 2: Prescription module + DDI engine + CDSS deterministic rules
- Joint: Integration testing, sequence diagrams (DG8, DG11)
### Cycle 3: Deterministic CDSS & Clinical Safety Engine (Weeks 13–16)

**Pitch:** Relational DDI Rule Engine (`cdss_ddi_rules`), Patient Allergy Cross-Check, NEWS2 Vital Threshold Heuristics, and Rule-based Template Summary Compiler.

- Dev 1: Relational CDSS DDI bilateral collision algorithm + override audit logger
- Dev 2: NEWS2 early warning triage scoring + pediatric vitals alerting engine
- Joint: Inpatient Treatment Sheet (Form 29) safety gate integration
- **Compliance Gate:** 100% deterministic, zero medical hallucination, sub-5ms query performance verified ✅

### Cycle 4: Billing + Queue + Document Intelligence (Weeks 18–21)

**Pitch:** Tariff management, invoice generation, AI coding audit, real-time queue display, document OCR + RAG.

- Dev 1: Billing module + payment integration (UPI, Stripe)
- Dev 2: Queue WebSocket + Document upload + OCR pipeline
- Joint: End-to-end patient journey testing
- **Compliance Gate:** Billing follows GST rules, queue display anonymizes patient names ✅

### Cycle 5: Integration + Compliance Hardening (Weeks 23–26)

**Pitch:** ABDM integration, NABH compliance audit, on-prem deployment packaging, security hardening.

- Dev 1: ABDM ABHA verification + consent framework + health record exchange
- Dev 2: Docker Compose on-prem packaging + offline sync engine
- Joint: Penetration testing, NABH documentation review, load testing
- **Compliance Gate:** Full NABH Information Management System checklist review ✅

### Launch Prep (Week 26)

- Production deployment to cloud (K8s)
- On-prem Docker image packaging + installation guide
- Final security audit
- Documentation freeze

---

## 10. Existing Documents — Gap Analysis

### Core Docs

| Document | Status | File | Action |
|:---|:---|:---|:---|
| PRD (D1) | ✅ Done | `docs/design/01_PRD.md` | Keep updated |
| Feature Spec (D2) | ❌ Missing | — | **Create before dev** |
| Tech Architecture (D3) | ❌ Needs rewrite | Old file archived | **Rewrite for MySQL + on-prem** |
| Data Model Spec (D4) | ❌ Missing | — | **Create before backend dev** |
| API Contract Spec (D5) | ⚠️ Partial | `FRONTEND_API_AND_SCHEMA_SPEC.md` | **Formalize into OpenAPI** |
| Compliance Matrix (D6) | ❌ Missing | — | **Create — Critical** |
| Deployment Architecture (D7) | ❌ Missing | — | **Create — Critical** |
| Security Spec (D8) | ❌ Missing | — | **Create — Important** |

### Backend Docs

| Document | Status | Action |
|:---|:---|:---|
| Database Schema Full DDL (D9) | ❌ Missing | **Create before backend dev starts** |
| ERDs (D10) | ❌ Missing | **Create before backend dev starts** |
| API Endpoint Inventory (D11) | ⚠️ Partial | **Complete before frontend dev starts** |
| Service Layer Design (D12) | ❌ Missing | **Create before backend junior picks up tasks** |
| RBAC Permission Matrix (D13) | ❌ Missing | **Create before auth implementation** |
| Background Jobs Spec (D14) | ❌ Missing | Create when async tasks are scoped |

### Frontend Docs

| Document | Status | Action |
|:---|:---|:---|
| Page & Route Map (D15) | ❌ Missing | **Create before frontend dev starts** |
| UI Component Inventory (D16) | ❌ Missing | **Create before juniors write any component** |
| Design System & Tokens (D17) | ❌ Missing | **Create before any UI work** |
| Wireframes / Mockups (D18) | ❌ Missing | **Create before frontend juniors start** |
| State Management Design (D19) | ❌ Missing | **Create before frontend dev starts** |
| Print Template Specs (D20) | ❌ Missing | **Create before any print feature** |

### Summary

- **1 document complete** (PRD)
- **8 backend/core documents missing** — block all development
- **6 frontend documents missing** — block all frontend development
- **5 living documents missing** — needed in Week 2 before coding
- **Total: 20 documents to create before timeline + work allocation**

---

## 11. Appendix: Indian Healthcare Compliance Standards

These are the standards Bright Solutions must comply with. Each must be mapped to specific features in the Compliance Matrix (D6).

### NABH (National Accreditation Board for Hospitals & Healthcare Providers)

| Standard Area | Key Requirements | Bright Solutions Impact |
|:---|:---|:---|
| **Information Management System (IMS)** | Unique patient identification, standardized clinical documentation, data security | UHID generation, structured SOAP notes, encrypted storage |
| **Patient Rights & Education** | Informed consent tracking, patient access to records | Consent management module, patient portal |
| **Care of Patients (COP)** | Clinical protocols, medication safety, adverse event reporting | CDSS rules, DDI engine, incident logging |
| **Management of Medication (MOM)** | Formulary management, prescription validation, adverse drug reaction tracking | Formulary service, prescription safety checks |
| **Quality Management** | Clinical audits, outcome tracking, quality indicators | Reporting module, audit trail |

### ABDM (Ayushman Bharat Digital Mission)

| Component | Requirement | Bright Solutions Impact |
|:---|:---|:---|
| **ABHA (Health ID)** | Verify/create 14-digit ABHA number for every patient | Patient registration integration |
| **Health Information Exchange** | Push/pull health records via HIE-CM (Health Information Exchange - Consent Manager) | FHIR-based data exchange module |
| **Health Facility Registry (HFR)** | Register clinic/hospital in HFR | Organization setup workflow |
| **Unified Health Interface (UHI)** | Discovery and booking via open protocol | Appointment booking API |

### DPDP Act 2023 (Digital Personal Data Protection)

| Requirement | Bright Solutions Impact |
|:---|:---|
| **Purpose Limitation** | PHI only processed for stated clinical purpose; explicit consent required |
| **Data Minimization** | Collect only necessary patient data |
| **Storage Limitation** | Retention policies with auto-purge |
| **Data Principal Rights** | Right to access, correct, erase personal data |
| **Cross-Border Transfer** | Health data must stay within India (for on-prem) |
| **Breach Notification** | Report breaches to Data Protection Board within 72 hours |

### Other Applicable Standards

| Standard | Scope | Relevance |
|:---|:---|:---|
| **IT Act 2000 (amended)** | Electronic health records as legal documents | Digital signature on prescriptions, SOAP notes |
| **CDSCO Drug Regulations** | Schedule H/H1 drug dispensing rules | Prescription validation for controlled substances |
| **GST Compliance** | Tax on healthcare services | Billing module tax calculation |
| **MCI/NMC Telemedicine Guidelines** | Teleconsultation documentation standards | If telemedicine feature added in future |

---

## Quick Reference: What to Create Next

**These must be done before any timeline creation or work allocation.** Both leads work in parallel on their respective docs.

### Backend Lead — Do First (Week 1)
1. 🔴 **Feature Specification (D2)** — module-by-module breakdown with acceptance criteria
2. 🔴 **Database Schema Full DDL (D9)** — all MySQL tables before any model is written
3. 🔴 **ERDs (D10)** — visual table relationships per domain
4. 🔴 **API Endpoint Inventory (D11)** — every route, method, request/response shape
5. 🔴 **RBAC Permission Matrix (D13)** — role × endpoint access before auth is built
6. 🟡 **Technical Architecture Doc (D3)** — rewrite for MySQL + on-prem
7. 🟡 **Service Layer Design (D12)** — before backend junior starts any task
8. 🟡 **Compliance Matrix (D6)** — NABH + ABDM + DPDP
9. 🟡 **Deployment Architecture (D7)** — staging + on-prem plan
10. 🟡 **Security Spec (D8)** — encryption + audit logging

### Frontend Lead — Do First (Week 1, parallel)
1. 🔴 **Page & Route Map (D15)** — every page, route, role access
2. 🔴 **Wireframes / Mockups (D18)** — every MVP page, low-fi enough to build from
3. 🔴 **Design System & Tokens (D17)** — colors, typography, spacing — before any CSS
4. 🔴 **UI Component Inventory (D16)** — what components exist / need to be built
5. 🟡 **Print Template Specs (D20)** — Rx, receipt, lab report, token slip layouts
6. 🟡 **State Management Design (D19)** — before any frontend data-fetching

### Both Leads — Week 2 (before coding starts)
7. 🟢 **Developer Onboarding Guide (D26)** — so juniors can start on Day 1 of Week 3
8. 🟢 **Coding Standards (D27)** — Python/FastAPI + React conventions
9. 🟢 **User Stories + Acceptance Criteria (D22)** — task-level specs for every Week 3 task
10. 🟢 **First Cycle Pitch (D23)** — what Week 3–6 delivers

---

> **Next Step:** Backend Lead starts D2 + D9 + D11 + D13 simultaneously. Frontend Lead starts D15 + D18 + D17 simultaneously. End of Week 1 review gate before any code is written.
