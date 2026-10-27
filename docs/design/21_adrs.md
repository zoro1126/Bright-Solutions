# D21 — Architecture Decision Records (ADRs)
## Bright Solutions: Clinical Hospital Operating System

> **Document ID:** D21  
> **Version:** 1.0  
> **Status:** APPROVED ARCHITECTURE SPECIFICATION  
> **Depends On:** [01_PRD.md](file:///home/prem/Desktop/pbt/COS/docs/design/01_PRD.md), [02_feature_spec.md](file:///home/prem/Desktop/pbt/COS/docs/design/02_feature_spec.md), [03_technical_architecture.md](file:///home/prem/Desktop/pbt/COS/docs/design/03_technical_architecture.md), [07_deployment_architecture.md](file:///home/prem/Desktop/pbt/COS/docs/design/07_deployment_architecture.md), [08_security_access_control.md](file:///home/prem/Desktop/pbt/COS/docs/design/08_security_access_control.md)  
> **Prepared By:** Bright Solutions Backend Engineering Team  
> **Last Updated:** October 2026  

---

## Table of Contents

1. [ADR Index & Architecture Principles](#1-adr-index--architecture-principles)
2. [ADR-001: Selection of MySQL 8.0 (InnoDB) over PostgreSQL](#2-adr-001-selection-of-mysql-80-innodb-over-postgresql)
3. [ADR-002: Modular Monolith in FastAPI over Microservices](#3-adr-002-modular-monolith-in-fastapi-over-microservices)
4. [ADR-003: Cloud-Primary (Contabo LAMP) with Local Docker LAN Fallback](#4-adr-003-cloud-primary-contabo-lamp-with-local-docker-lan-fallback)
5. [ADR-004: Deterministic Rule-Based CDSS over Large Language Models (LLMs)](#5-adr-004-deterministic-rule-based-cdss-over-large-language-models-llms)
6. [ADR-005: Hybrid Stateless Access JWT + Stateful Database Refresh Token](#6-adr-005-hybrid-stateless-access-jwt--stateful-database-refresh-token)
7. [ADR-006: Unified Polymorphic Billing Ledger over Segmented Counter Tables](#7-adr-006-unified-polymorphic-billing-ledger-over-segmented-counter-tables)
8. [ADR-007: Server-Sent Events (SSE) over WebSockets for Waiting Room TV Display](#8-adr-007-server-sent-events-sse-over-websockets-for-waiting-room-tv-display)
9. [ADR-008: Irreversible HMAC-SHA-256 Aadhaar Hashing over Plaintext Storage](#9-adr-008-irreversible-hmac-sha-256-aadhaar-hashing-over-plaintext-storage)

---

## 1. ADR Index & Architecture Principles

Architecture Decision Records (ADRs) capture the architectural context, evaluated options, tradeoffs, and rationale for all significant technical decisions governing **Bright Solutions**. Every record follows the standard **MADR (Markdown Architectural Decision Record)** format.

| ADR ID | Decision Title | Status | Date Decided | Impact Areas |
|:---:|:---|:---:|:---:|:---|
| **ADR-001** | Selection of MySQL 8.0 (InnoDB) over PostgreSQL | `APPROVED` | Oct 2026 | Database, Storage, Hosting |
| **ADR-002** | Modular Monolith in FastAPI over Microservices | `APPROVED` | Oct 2026 | Backend Architecture, Deployment |
| **ADR-003** | Cloud-Primary with Local Docker LAN Fallback | `APPROVED` | Oct 2026 | High Availability, Offline Operations |
| **ADR-004** | Deterministic Rule-Based CDSS over LLMs in MVP | `APPROVED` | Oct 2026 | Clinical Safety, Compliance |
| **ADR-005** | Hybrid Stateless JWT + Stateful DB Refresh Token | `APPROVED` | Oct 2026 | Authentication, Session Control |
| **ADR-006** | Unified Polymorphic Billing Ledger Engine | `APPROVED` | Oct 2026 | Billing, Financial Accounting |
| **ADR-007** | Server-Sent Events (SSE) for Waiting Room Display | `APPROVED` | Oct 2026 | Real-Time Messaging, Display |
| **ADR-008** | Irreversible HMAC-SHA-256 Aadhaar Hashing | `APPROVED` | Oct 2026 | DPDP Compliance, Identity Security |

---

## 2. ADR-001: Selection of MySQL 8.0 (InnoDB) over PostgreSQL

### Context & Problem Statement
Bright Solutions requires an ACID-compliant relational database engine to power clinical health records, e-prescriptions, and hospital financials. The target hosting environment is a Contabo LAMP VPS (`clinicalservices.paperbirdtech.com`) alongside hospital on-premise hardware. The previous legacy repository referenced PostgreSQL, but the operational infrastructure is a production LAMP environment.

### Decision Drivers
1. **Contabo LAMP Staging Compatibility:** Contabo LAMP comes pre-configured and optimized with MySQL 8.0/MariaDB. Introducing PostgreSQL requires installing and managing secondary database daemons with additional RAM overhead on an 8GB VPS.
2. **On-Premise IT Availability in Indian Hospitals:** Hospital IT technicians in tier-1/tier-2 Indian cities possess widespread familiarity with MySQL administration, backup routines, and phpMyAdmin.
3. **Clustered Index Performance:** InnoDB stores tables organized by primary key in clustered B+ trees, yielding sub-millisecond retrieval on sequential `BIGINT AUTO_INCREMENT` PK joins.

### Considered Alternatives
- **Alternative 1: PostgreSQL 16**
  - *Pros:* Native JSONB operators, advanced constraint types, rich procedural language.
  - *Cons:* Incompatible with standard Contabo LAMP base image; higher baseline memory footprint; complicates local edge server maintenance for hospital IT.
- **Alternative 2: SQLite (Local) / Cloud DB**
  - *Pros:* Zero configuration.
  - *Cons:* Table-level write locking causes concurrency bottlenecks during simultaneous OPD check-ins, prescriptions, and lab result entries.
- **Alternative 3: MySQL 8.0 (InnoDB) — Selected**

### Decision Outcome
**Chosen: MySQL 8.0 (InnoDB) with `utf8mb4` character set and `utf8mb4_unicode_ci` collation.**

#### Consequences
- **Positive:** Direct compatibility with Contabo LAMP; seamless integration with Python's PyMySQL and SQLAlchemy 2.0; excellent read/write performance on clustered integer PKs.
- **Negative:** Advanced PostgreSQL features (e.g. `EXCLUDE` constraints, native JSONB indexes) must be modeled using application-level logic or standard composite MySQL indexes.

---

## 3. ADR-002: Modular Monolith in FastAPI over Microservices

### Context & Problem Statement
Hospital workflows are deeply interconnected: Patient Registration creates an OPD Visit, which generates a Consultation, which triggers E-Prescriptions and Lab Orders, which feed into Multi-Point Invoices. We needed to choose between a distributed Microservices architecture and a Modular Monolith.

### Decision Drivers
1. **Zero Distributed Transaction Latency:** Clinical workflows require atomic consistency across multiple domain entities (e.g., admitting a patient requires simultaneously assigning a bed, locking bed status, generating an IPD number, and logging an advance payment).
2. **Lean Engineering Team:** Developing, testing, and deploying microservices with 2–3 developers creates severe devops overhead (service meshes, distributed tracing, network serialization bugs).
3. **Single-Process Deployment:** Can run comfortably on a single Contabo VPS and on a single edge fallback machine inside the hospital.

### Considered Alternatives
- **Alternative 1: Microservices (Auth Service, Patient Service, Clinical Service, Billing Service)**
  - *Pros:* Independent scaling of individual modules.
  - *Cons:* Network latency between services; complex 2-phase commit (2PC) or Saga patterns for distributed transactions; increased failure points.
- **Alternative 2: Traditional Monolith (Flat Django / Rails structure)**
  - *Pros:* Fast initial prototyping.
  - *Cons:* High coupling; circular dependencies; difficult to isolate domain code.
- **Alternative 3: Modular Monolith in FastAPI — Selected**

### Decision Outcome
**Chosen: Modular Monolith in FastAPI with domain-driven package boundaries (`app/modules/<module_name>`).**

#### Structural Guardrails
- Modules communicate exclusively through public service interfaces (`QueueService`, `BillingService`), never via direct cross-module database writes.
- Each module maintains its own Pydantic DTOs and business exception classes.

---

## 4. ADR-003: Cloud-Primary (Contabo LAMP) with Local Docker LAN Fallback

### Context & Problem Statement
Indian hospitals frequently experience broadband fiber cuts or ISP outages lasting from 15 minutes to several hours. A pure cloud hospital OS halts registrations and consultations when the internet drops. Conversely, a pure on-premise system lacks remote accessibility and centralized multi-facility management.

### Decision Drivers
1. **Uninterrupted Hospital Operations:** Doctors, nurses, and receptionists must be able to continue consultations, vitals intake, and emergency admissions even if external internet is 100% down.
2. **Cloud Accessibility:** Hospital administrators and doctors need secure remote access from outside the hospital.
3. **Zero-Configuration Client Failover:** Staff workstations should not require complex manual reconfiguration during internet outages.

### Considered Alternatives
- **Alternative 1: Pure Cloud SaaS**
  - *Cons:* Hospital completely halts when internet fails (unacceptable for clinical operations).
- **Alternative 2: Pure On-Premise Server**
  - *Cons:* No remote doctor access; difficult off-site disaster recovery; expensive local hardware maintenance.
- **Alternative 3: Cloud-Primary with Local Docker LAN Fallback — Selected**

### Decision Outcome
**Chosen: Cloud-Primary on Contabo LAMP (`clinicalservices.paperbirdtech.com`) as the authoritative production database, paired with a containerized Docker Compose edge instance on the hospital LAN.**

#### Conflict-Free Synchronization Protocol
- While online: Edge sync agent continuously pulls master data (formulary, doctor schedules, tariffs) downstream.
- While offline: Edge server issues partitioned sequences (`OFFLINE-UHID-*`, `OFFLINE-OPD-*`, `OFFLINE-INV-*`) and internal PKs starting from `100,000,000` to prevent ID collisions.
- Upon reconnection: Edge sync agent replays offline consultation and registration batches to the Contabo API (`/api/v1/sync/replay-batch`) for automated reconciliation.
- Client Failover: React frontend pings `/api/v1/healthz`; switches API base URL automatically upon 3 consecutive timeouts.

---

## 5. ADR-004: Deterministic Rule-Based CDSS over Large Language Models (LLMs)

### Context & Problem Statement
Clinical Decision Support Systems (CDSS) are required in MVP for Drug-Drug Interactions (DDI), abnormal vital thresholds, and acute syndrome trios (e.g. chest pain + sweating). We evaluated whether to use an LLM API (OpenAI/Anthropic/Local LLM) or a deterministic relational rule engine for these safety checks.

### Decision Drivers
1. **Zero Hallucination Tolerance:** Medico-legal liability and NABH standards demand 100% deterministic, reproducible safety alerts. An LLM cannot be permitted to hallucinate or miss a lethal drug contraindication (e.g. Warfarin + Aspirin).
2. **Sub-Millisecond Execution:** DDI checks must execute synchronously while the doctor is typing prescriptions in real time.
3. **Offline Fallback Capability:** The local LAN fallback server has no external internet connection during outages, meaning cloud LLM APIs cannot be reached.
4. **Auditability & Written Overrides:** NABH Section MOM requires structured audit logging of doctor override justifications against verified clinical rule IDs.

### Decision Outcome
**Chosen: Deterministic relational rule engine (`cdss_ddi_rules`, `cdss_vital_rules`, `cdss_clinical_rules`) executing synchronous SQL queries in the transaction path.**

#### Consequences
- **Positive:** 100% deterministic; sub-5ms evaluation latency; operates completely offline; clean medico-legal audit trail in `cdss_alerts_log`.
- **Negative:** Requires pre-seeding and maintaining drug interaction pairs and vital threshold ranges in the database catalog.

---

## 6. ADR-005: Hybrid Stateless Access JWT + Stateful Database Refresh Token

### Context & Problem Statement
Staff authentication needs to support fast, stateless API route authorization while retaining the ability for administrators to immediately terminate compromised staff accounts or stolen devices.

### Decision Drivers
1. **High API Throughput:** Verifying user identity on every API request must not impose a database read penalty.
2. **Immediate Revocation Capability:** Pure stateless JWTs cannot be revoked until they expire. If a staff laptop or phone is stolen, an admin must be able to revoke the session immediately.
3. **Protection against XSS:** Long-lived tokens must not be accessible via JavaScript.

### Decision Outcome
**Chosen: Hybrid Stateless Access JWT (15 min) + Stateful Opaque Refresh Token (7 days) stored in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie.**

#### Token Rotation & Revocation Protocol
- Access tokens expire in **15 minutes** and are verified purely in memory via `HS256`.
- Refresh tokens are stored as SHA-256 hashes in `user_refresh_tokens`.
- **Refresh Token Rotation (RTR):** Each refresh request invalidates the old refresh token and issues a new pair.
- **Family Revocation:** If an invalidated refresh token is reused, all tokens for that user session family are revoked immediately (detecting token theft).
- **Admin Revocation:** Updating `user_refresh_tokens.is_revoked = 1` immediately kills the session upon the next refresh attempt.

---

## 7. ADR-006: Unified Polymorphic Billing Ledger over Segmented Counter Tables

### Context & Problem Statement
Hospitals collect revenue across multiple physical counters:
1. Reception Counter: Outpatient consultation fees.
2. Pharmacy Counter: Prescribed and OTC medications.
3. Pathology Counter: Diagnostic lab investigations.
4. Billing Counter: Inpatient discharge settlement (10 charge heads).

We evaluated whether to create separate invoice tables for each counter (`opd_invoices`, `pharmacy_invoices`, `lab_invoices`, `ipd_invoices`) or a unified polymorphic ledger.

### Decision Drivers
1. **Single Source of Financial Truth:** Hospital administrators require unified daily revenue reports without complex SQL `UNION` queries across 4 disconnected schemas.
2. **Unified Payment Collection:** Inpatients frequently pay for pharmacy and lab items during discharge rather than at the individual counter.
3. **10-Head IPD Consolidated Invoicing:** The final discharge bill must aggregate bed rent, doctor visits, nursing, procedures, pharmacy, and lab charges into a single numbered tax invoice.

### Decision Outcome
**Chosen: Unified polymorphic billing schema (`invoices`, `invoice_items`, `payments`) with `invoice_type` (`OPD_CONSULTATION`, `PHARMACY`, `LAB`, `IPD_FINAL`) and `item_type` supporting all 10 IPD cost centers.**

#### Consequences
- **Positive:** Single reporting engine for hospital accounts; shared payment recording logic; seamless aggregation of unbilled pharmacy/lab items into the final IPD discharge invoice.
- **Negative:** `invoice_items.reference_id` is polymorphic (links to `pharmacy_items`, `lab_tests`, or `ipd_procedures` depending on `item_type`), requiring application-level integrity validation in `BillingService`.

---

## 8. ADR-007: Server-Sent Events (SSE) over WebSockets for Waiting Room TV Display

### Context & Problem Statement
Waiting room smart TVs display real-time doctor queue tokens. We evaluated whether to implement bidirectional WebSockets or unidirectional Server-Sent Events (SSE).

### Decision Drivers
1. **Unidirectional Communication:** Waiting room TV screens only receive token updates (`TOKEN_CALLED`, `TOKEN_COMPLETED`). They never transmit data back to the server.
2. **Reverse Proxy Compatibility:** WebSockets require complex HTTP upgrade handshakes and stateful connection tracking that frequently breaks behind Apache `.htaccess` reverse proxies.
3. **Native Auto-Reconnect:** Smart TV web browsers natively auto-reconnect SSE streams via the standard `EventSource` API with zero external client libraries.

### Decision Outcome
**Chosen: Server-Sent Events (SSE) via `GET /api/v1/display/queue/stream` with `text/event-stream` MIME type and Apache unbuffered proxy directives (`SetEnv no-gzip 1`).**

---

## 9. ADR-008: Irreversible HMAC-SHA-256 Aadhaar Hashing over Plaintext Storage

### Context & Problem Statement
Under the **DPDP Act, 2023** and **UIDAI Regulations**, storing raw 12-digit Aadhaar numbers in plaintext without an authorized, audited Aadhaar Vault is a statutory violation. However, hospitals require a mechanism to detect duplicate patient registrations when patients return under misspelled names or different phone numbers.

### Decision Drivers
1. **Statutory Compliance:** Eliminate severe civil penalties under DPDP Act Section 33 (up to ₹250 Crore for health data compromise).
2. **Duplicate Detection Capability:** The hospital must be able to verify whether a walking-in patient has an existing medical file.
3. **Zero Plaintext Footprint:** Even in the event of an unauthorized database dump, patient national identity numbers cannot be decrypted.

### Decision Outcome
**Chosen: Store an irreversible salted HMAC-SHA-256 hash (`aadhaar_hash`) in `patients.aadhaar_hash`. Raw 12-digit Aadhaar numbers are immediately discarded from memory after hash computation and are never written to disk, database, or logs.**
