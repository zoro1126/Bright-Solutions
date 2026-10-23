# ClinicOS — Development Methodology & Essential Design Documents

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

### Why This Works for ClinicOS

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
| **D1** | **Product Requirements Document (PRD)** | What the product does, who it's for, success metrics, scope boundaries | Markdown | 5–8 | ⚠️ Partially exists as `01_project_brief.md` — needs expansion |
| **D2** | **Feature Specification** | Detailed per-module feature breakdown with acceptance criteria | Markdown | 10–15 | ⚠️ Exists as `02_feature_spec.md` — needs compliance columns |
| **D3** | **Technical Architecture Document (TAD)** | System topology, tech stack, data flow, multi-tenancy, AI pipeline | Markdown + Mermaid | 15–25 | ⚠️ Exists as `03_technical_architecture.md` — needs on-prem topology |
| **D4** | **Data Model & Schema Specification** | Every table, column, index, constraint, RLS policy across all databases | SQL DDL + ERD | 15–20 | ⚠️ Partially in TAD — needs extraction into standalone doc |
| **D5** | **API Contract Specification** | Every endpoint: method, path, request/response schemas, error codes, auth | OpenAPI 3.1 YAML + Markdown | 20–30 | ⚠️ Partially exists as `FRONTEND_API_AND_SCHEMA_SPEC.md` — needs OpenAPI formalization |
| **D6** | **Compliance & Regulatory Matrix** | NABH, ABDM, DPDP Act 2023, and other Indian healthcare standards mapped to features | Markdown table | 8–12 | ❌ **Missing — Critical** |
| **D7** | **Deployment Architecture Document** | On-prem vs. cloud topology, Docker/K8s configs, network diagrams, backup strategy | Markdown + Diagrams | 8–12 | ❌ **Missing — Critical** |
| **D8** | **Security & Access Control Specification** | RBAC matrix, authentication flows, encryption standards, audit logging, PHI handling | Markdown | 8–10 | ❌ **Missing — Important** |

### Tier 2: Living Documents (Created in Cycle 1, Updated Every Cycle)

These evolve continuously throughout development.

| # | Document | Purpose | Format | Update Frequency |
|:--|:---|:---|:---|:---|
| **D9** | **Architecture Decision Records (ADRs)** | Record every significant technical decision with context, options considered, and rationale | Markdown (1 per decision) | As decisions are made |
| **D10** | **User Stories & Acceptance Criteria** | Structured user stories with Given/When/Then acceptance criteria for every feature | Markdown | Every cycle |
| **D11** | **Cycle Pitch Documents** | Per-cycle problem statement, appetite, solution shape, no-goes | Markdown (1 per cycle) | Every cycle |
| **D12** | **Test Strategy & Test Plan** | Testing approach: unit, integration, E2E, load testing; coverage targets; CI pipeline | Markdown | Updated each cycle |
| **D13** | **API Changelog** | Breaking changes, deprecations, new endpoints — versioned | Markdown | Every release |

### Tier 3: Reference Documents (Created Once, Consulted Often)

| # | Document | Purpose | Format |
|:--|:---|:---|:---|
| **D14** | **Developer Onboarding Guide** | Setup instructions, architecture overview, coding conventions, PR process | Markdown |
| **D15** | **Coding Standards & Conventions** | Python/FastAPI patterns, naming conventions, error handling, logging standards | Markdown |
| **D16** | **Environment Configuration Guide** | All env vars, secrets management, database connection strings, feature flags | Markdown + `.env.example` |
| **D17** | **Incident Response & Rollback Playbook** | What to do when prod breaks — rollback procedures, on-call escalation | Markdown |

---

## 6. Essential Diagrams — Complete Inventory

Diagrams are not decorations. Each one answers a specific architectural question that text cannot.

### Tier 1: Must-Have Diagrams (Create Before Cycle 1)

| # | Diagram | Type | Tool | What It Answers |
|:--|:---|:---|:---|:---|
| **DG1** | **System Context Diagram** | C4 Level 1 | Mermaid / draw.io | "What external systems does ClinicOS interact with?" (ABDM, payment gateways, hospital EHRs, LLM providers) |
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
| **DG9** | **AI Scribe Pipeline Sequence** | Sequence | Mermaid | Cycle 3 (AI Services) — Audio stream → STT → PII strip → LLM → SOAP → Doctor sign-off |
| **DG10** | **CDSS Evaluation Flow** | Flowchart | Mermaid | Cycle 3 — Vitals + Medications → Deterministic rules → LLM fallback → Alert generation |
| **DG11** | **Prescription & Drug Safety Flow** | Sequence | Mermaid | Cycle 2 — Drug entry → DDI check → Allergy check → Formulary validation → Rx sign |
| **DG12** | **Billing & Invoice Lifecycle** | State Machine | Mermaid | Cycle 4 — Draft → Items Added → AI Audit → Payment → Settled/Refunded |
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

| Document | Owner | Reviewer | Created | Updated |
|:---|:---|:---|:---|:---|
| PRD (D1) | Product Lead (Dev 1) | Dev 2 | Before Cycle 1 | Major pivots only |
| Feature Spec (D2) | Product Lead | Dev 2 | Before Cycle 1 | Each cycle |
| Tech Architecture (D3) | Tech Lead (Dev 2) | Dev 1 | Before Cycle 1 | Architecture changes |
| Data Model (D4) | Tech Lead | Dev 1 | Before Cycle 1 | Schema migrations |
| API Spec (D5) | Both | Both | Before Cycle 1 | Each endpoint change |
| Compliance Matrix (D6) | Product Lead | External (NABH consultant) | Before Cycle 1 | Each compliance gate |
| Deployment Arch (D7) | Tech Lead | Dev 1 | Before Cycle 1 | Infrastructure changes |
| ADRs (D9) | Whoever makes the decision | Other dev | Ongoing | Immutable once decided |
| Cycle Pitches (D11) | Both (shaping session) | Both | Each cool-down | Immutable once cycle starts |
| Test Plan (D12) | Both | Both | Cycle 1 | Each cycle |

### When a New Dev Joins (Scaling from 2 → 5)

New developers should read documents in this exact order:

1. **D14** (Onboarding Guide) → How to set up the environment
2. **D1** (PRD) → What are we building and why
3. **D3** (Technical Architecture) → How the system is structured
4. **D4** (Data Model) → What the database looks like
5. **D6** (Compliance Matrix) → What regulatory constraints we operate under
6. **D15** (Coding Standards) → How we write code here
7. **D5** (API Spec) → The contracts between frontend and backend
8. Latest **D11** (Cycle Pitch) → What we're working on right now

Time to productive contribution: **< 1 week** with this reading order.

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

### Phase 0: Foundation & Documentation (Weeks 1–2) — Cool-down 0

**Goal:** All Tier 1 documents and diagrams created or updated.

```
Week 1:
├── Update PRD with on-prem + compliance scope (D1)
├── Create Compliance Matrix — NABH + ABDM + DPDP (D6)
├── Create Deployment Architecture — Cloud + On-Prem (D7)
├── Create Security & Access Control Spec (D8)
├── Draw System Context Diagram (DG1)
└── Draw Container Diagram (DG2)

Week 2:
├── Extract Data Model into standalone doc (D4)
├── Draw ERDs for all databases (DG3)
├── Draw Cloud + On-Prem deployment topologies (DG4, DG5)
├── Draw Auth flow sequence diagram (DG6)
├── Draw PHI Data Flow diagram (DG7)
├── Create Developer Onboarding Guide (D14)
├── Create Coding Standards doc (D15)
└── Write Cycle 1 Pitch (D11)
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
- **Compliance Gate:** Patient data encrypted at rest, UHID generation follows ABDM ✅

### Cycle 3: AI Services (Weeks 13–16)

**Pitch:** AI Scribe (WebSocket + STT + SOAP), CDSS LLM layer, Intake questionnaire + ESI triage.

- Dev 1: AI Scribe pipeline (audio → transcript → SOAP)
- Dev 2: CDSS LLM integration + Intake triage engine
- Joint: AI Gateway setup (Presidio + LiteLLM routing)
- **Compliance Gate:** PII de-identification verified, zero-retention mode functional ✅

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

| Document | Needed? | Exists? | File | Action Required |
|:---|:---:|:---:|:---|:---|
| PRD | ✅ | ⚠️ Partial | `docs/design/01_project_brief.md` | Add on-prem scope, Indian compliance, updated personas |
| Feature Spec | ✅ | ⚠️ Partial | `docs/design/02_feature_spec.md` | Add NABH/ABDM compliance columns per feature |
| Technical Architecture | ✅ | ⚠️ Partial | `docs/design/03_technical_architecture.md` | Add on-prem topology section, ABDM integration |
| User Stories | ✅ | ⚠️ Partial | `docs/design/04_user_stories.md` | Add Given/When/Then acceptance criteria |
| Roadmap | ✅ | ⚠️ Outdated | `docs/design/05_roadmap.md` | Replace with Shaped Kanban cycle plan |
| **Data Model Spec** | ✅ | ❌ | — | **Create:** Extract from TAD + add migration strategy |
| **Compliance Matrix** | ✅ | ❌ | — | **Create:** NABH + ABDM + DPDP mapping |
| **Deployment Architecture** | ✅ | ❌ | — | **Create:** Cloud + On-prem + sync topology |
| **Security Spec** | ✅ | ❌ | — | **Create:** RBAC matrix, encryption, audit logging |
| **ADRs** | ✅ | ❌ | — | **Create:** Start with "Why FastAPI", "Why MySQL→PostgreSQL", "Shaped Kanban" |
| **Coding Standards** | ✅ | ❌ | — | **Create:** Python/FastAPI patterns, PR checklist |
| **Onboarding Guide** | ✅ | ❌ | — | **Create:** Setup steps, architecture summary |
| **Test Strategy** | ✅ | ⚠️ Partial | `backend/tests/` | **Create:** Formal doc with coverage targets |
| **API Changelog** | ✅ | ❌ | — | **Create:** Start maintaining from Cycle 1 |
| System Context Diagram | ✅ | ❌ | — | **Create** |
| Container Diagram | ✅ | ⚠️ Partial | In TAD | **Extract** into standalone |
| ERDs | ✅ | ❌ | — | **Create** from DDL in TAD |
| Cloud Deployment Topology | ✅ | ❌ | — | **Create** |
| On-Prem Deployment Topology | ✅ | ❌ | — | **Create** |
| Auth Flow Sequence | ✅ | ❌ | — | **Create** |
| PHI Data Flow | ✅ | ❌ | — | **Create** |

### Summary

- **8 documents exist** (5 partially, 3 as specs)
- **9 documents missing** (4 critical, 3 important, 2 reference)
- **7 diagrams missing** (all Tier 1)

---

## 11. Appendix: Indian Healthcare Compliance Standards

These are the standards ClinicOS must comply with. Each must be mapped to specific features in the Compliance Matrix (D6).

### NABH (National Accreditation Board for Hospitals & Healthcare Providers)

| Standard Area | Key Requirements | ClinicOS Impact |
|:---|:---|:---|
| **Information Management System (IMS)** | Unique patient identification, standardized clinical documentation, data security | UHID generation, structured SOAP notes, encrypted storage |
| **Patient Rights & Education** | Informed consent tracking, patient access to records | Consent management module, patient portal |
| **Care of Patients (COP)** | Clinical protocols, medication safety, adverse event reporting | CDSS rules, DDI engine, incident logging |
| **Management of Medication (MOM)** | Formulary management, prescription validation, adverse drug reaction tracking | Formulary service, prescription safety checks |
| **Quality Management** | Clinical audits, outcome tracking, quality indicators | Reporting module, audit trail |

### ABDM (Ayushman Bharat Digital Mission)

| Component | Requirement | ClinicOS Impact |
|:---|:---|:---|
| **ABHA (Health ID)** | Verify/create 14-digit ABHA number for every patient | Patient registration integration |
| **Health Information Exchange** | Push/pull health records via HIE-CM (Health Information Exchange - Consent Manager) | FHIR-based data exchange module |
| **Health Facility Registry (HFR)** | Register clinic/hospital in HFR | Organization setup workflow |
| **Unified Health Interface (UHI)** | Discovery and booking via open protocol | Appointment booking API |

### DPDP Act 2023 (Digital Personal Data Protection)

| Requirement | ClinicOS Impact |
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

**Priority order for missing documents:**

1. 🔴 **Compliance Matrix (D6)** — Cannot build compliant software without knowing what compliance means
2. 🔴 **Deployment Architecture (D7)** — On-prem vs. cloud is an architectural fork that affects everything
3. 🟡 **Security Spec (D8)** — RBAC, encryption, and audit logging design before Cycle 1
4. 🟡 **Data Model Spec (D4)** — Extract from TAD, add migration strategy
5. 🟢 **ADRs (D9)** — Start recording decisions retroactively
6. 🟢 **Coding Standards (D15)** — Before a 3rd dev joins
7. 🟢 **Onboarding Guide (D14)** — Before a 3rd dev joins
8. 🟢 **Test Strategy (D12)** — Formalize what's already happening
9. 🟢 **API Changelog (D13)** — Start maintaining from next release

---

> **Next Step:** Review this document and confirm the methodology choice and document priorities. Once approved, we'll start creating the missing documents in priority order — beginning with the Compliance Matrix (D6) and Deployment Architecture (D7).
