# D18 — Wireframes & Screen Layout Specifications
## Bright Solutions: Clinical Hospital Operating System

> **Document ID:** D18  
> **Version:** 1.1 (Audit-Revised)  
> **Status:** APPROVED FRONTEND ARCHITECTURE SPECIFICATION  
> **Revision Notes:** v1.1: DEFECT-10 fixed — Bed Card Color State Map table added mapping each `BedOccupancyCard` status to exact D17 tokens
> **Depends On:** [01_PRD.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/01_PRD.md), [02_feature_spec.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/02_feature_spec.md), [15_page_route_map.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/15_page_route_map.md), [16_ui_component_inventory.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/16_ui_component_inventory.md), [17_design_system_tokens.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/17_design_system_tokens.md)  
> **Prepared By:** Bright Solutions Frontend Engineering Team  
> **Last Updated:** October 2026  

---

## Table of Contents

1. [Wireframing Principles & Grid Systems](#1-wireframing-principles--grid-systems)
2. [Reception & Front-Desk Queue Wireframe (`/reception/queue`)](#2-reception--front-desk-queue-wireframe-receptionqueue)
3. [Doctor OPD Consultation Chamber Wireframe (`/doctor/consultation/:id`)](#3-doctor-opd-consultation-chamber-wireframe-doctorconsultationid)
4. [Inpatient (IPD) Ward Bed Matrix Wireframe (`/ipd/beds`)](#4-inpatient-ipd-ward-bed-matrix-wireframe-ipdbeds)
5. [Inpatient Clinical Folio Wireframe (6-Day Book Digitization)](#5-inpatient-clinical-folio-wireframe-6-day-book-digitization)
   - 5.1 [Tab 1: Face Sheet & Consent (Forms 8 & 9)](#51-tab-1-face-sheet--consent-forms-8--9)
   - 5.2 [Tab 2: Doctor H&P Admission Note (Form 10)](#52-tab-2-doctor-hp-admission-note-form-10)
   - 5.3 [Tab 3: Inpatient Treatment Sheet & MAR (Form 29)](#53-tab-3-inpatient-treatment-sheet--mar-form-29)
   - 5.4 [Tab 4: 24h Fluid Intake & Output Chart (Form 61)](#54-tab-4-24h-fluid-intake--output-chart-form-61)
   - 5.5 [Tab 5: Nurse Vitals & Shift Notes (Form 72)](#55-tab-5-nurse-vitals--shift-notes-form-72)
6. [Billing Counter: Consolidated 10-Head IPD Settlement Wireframe](#6-billing-counter-consolidated-10-head-ipd-settlement-wireframe)
7. [Waiting Room TV Display Wireframe (`/display/waiting-room`)](#7-waiting-room-tv-display-wireframe-displaywaiting-room)

---

## 1. Wireframing Principles & Grid Systems

All Bright Solutions screen layouts conform to structured ASCII and spatial coordinates designed for pixel-perfect translation into React components:

1. **Fixed Vertical Scroll Containment:** Top bars and patient banners are pinned (`position: sticky; top: 0; z-index: 10;`). Inner workspaces manage their own scrolling (`overflow-y: auto`) with zero full-page browser jumping.
2. **Predictable Focus Paths:** Data entry forms enforce programmatic autofocus on primary inputs (e.g. Patient Search input on Reception load, Chief Complaint on Doctor Consultation open) with tab indexing mapped to physical paper-flow order.
3. **Ergonomic Breakpoints:** Desktop clinical screens assume a baseline canvas of `1536×730` (standard 15" laptop or 22" desktop monitor).

---

## 2. Reception & Front-Desk Queue Wireframe (`/reception/queue`)

```
+------------------------------------------------------------------------------------------------------------------------+
| BRIGHT SOLUTIONS  |  Counter 01: Front Desk Receptionist  | Shift: MORNING-A  |  [ Edge LAN Active ]  | User: Priya R. |
+------------------------------------------------------------------------------------------------------------------------+
|  [ + Register New Patient (F2) ]   [ Search UHID / Mobile / Name (Ctrl+K) __________________________ ]   [ Filter: All ]
+------------------------------------------------------------------------------------------------------------------------+
|  ACTIVE QUEUE DISPATCH (TODAY'S ENCOUNTERS)                                    | QUICK REGISTER DRAWER (F2)             |
|  +---------------------------------------------------------------------------+ | +------------------------------------+ |
|  | Token | UHID         | Patient Name      | Dept / Doctor     | Status     | | | Full Name:* [Ananya Sharma       ] | |
|  |-------|--------------|-------------------|-------------------|------------| | | Mobile:*    [9841088210          ] | |
|  | T-142 | BS-2026-00142| Ananya Sharma (52F| Int Med (Dr Kiran)| IN CHAMBER | | | Age/Gen:*   [52 ] [Female    |v] | |
|  | T-143 | BS-2026-00143| Rajan Pillai (67M)| Int Med (Dr Kiran)| WAITING    | | | Category:*  [Domestic (India)|v] | |
|  | T-144 | BS-2026-00144| Meera Nair (44F)  | Cardiology (Dr S) | WAITING    | | | Payer:*     [Star Health TPA |v] | |
|  | T-145 | BS-2026-00145| Devendra K. (58M) | Pulmonology (Dr V)| WAITING    | | | Ref Doctor: [Dr. M. S. Rao       ] | |
|  | T-146 | BS-2026-00146| Sunita Rao (61F)  | Int Med (Dr Kiran)| WAITING    | | | Assign Cab: [Cabin 01 (Dr Kiran) |v] | |
|  +---------------------------------------------------------------------------+ | | Consultation Fee:  INR 500.00      | |
|                                                                                | | [x] Collect Fee Now (Cash/UPI)     | |
|                                                                                | | [ Issue Token & Print Slip (F9)  ] | |
|                                                                                | +------------------------------------+ |
+------------------------------------------------------------------------------------------------------------------------+
```

---

## 3. Doctor OPD Consultation Chamber Wireframe (`/doctor/consultation/:id`)

```
+------------------------------------------------------------------------------------------------------------------------+
| Bright • OPD Consultation • Cabin 01 • Dr. Kiran Patel, MD | [Edge LAN Active] | [Consultation Guide] | [Logout]       |
+------------------------------------------------------------------------------------------------------------------------+
| [AS]  ANANYA SHARMA  Master UHID: BS-2026-00142 | Token #142 | New Registration | Domestic | Active in Consultation        |
|       52y Female • Chennai • Payer: Star Health TPA • Ref: Dr. M. S. Rao (+91 98410 88210)                             |
|       [BP: 126/82] • [HR: 74 bpm] • [SpO2: 99%] • [Temp: 98.6°F] • [BMI: 22.1] | [! Allergy: Penicillin]               |
|                                                     [ Official Rx (PDF) ]  [ Sign & Lock Consultation (Ctrl+Enter) ]   |
+------------------------------------+-----------------------------------------------------------------------------------+
| OPD QUEUE • CABIN 01    (3 Waiting)| [1. SOAP Note & ICD-10] [2. E-Prescription (3)] [3. Lab Orders] [4. Referral]    |
| [ Zap Call Next Patient (Token)  ] +-----------------------------------------------------------------------------------+
| [All (6)] [Wait (3)] [Done (1)]    | CLINICAL ASSESSMENT & STRUCTURED SOAP DOCUMENTATION                               |
| [ Search name, token, UHID...    ] |                                                                                   |
| +--------------------------------+ | S — SUBJECTIVE (HISTORY & COMPLAINTS)                                             |
| | T-142 Ananya Sharma            | | [ Severe tension-type headache and dizziness for 2-3 weeks...                     ] |
| | BS-00142 • 52y F • Wait: 23m   | |                                                                                   |
| | [● In Chamber]                 | | O — OBJECTIVE (EXAMINATION & VITALS)                                             |
| +--------------------------------+ | [ Conscious, oriented, afebrile. S1 S2 heard, chest clear to auscultation...       ] |
| | T-143 Rajan Pillai             | |                                                                                   |
| | BS-00143 • 67y M • Wait: 20m   | | A — ASSESSMENT & ICD-10 DIAGNOSES  [NABH Mandatory Sign-off Requirement]        |
| | [⏳ Waiting]     [ Call In ↗ ] | | [Primary: I10 - Essential (primary) hypertension [x]]  [+ Add ICD-10 Code]       |
| +--------------------------------+ |                                                                                   |
| | T-144 Meera Nair               | | P — PLAN (CARE PLAN & LIFESTYLE ADVICE)                                           |
| | BS-00144 • 44y F • Wait: 12m   | | [ Dietary sodium restriction (< 2g/day), 30 mins walking, review in 7 days...    ] |
| | [⏳ Waiting]     [ Call In ↗ ] | +-----------------------------------------------------------------------------------+
| +--------------------------------+ | DETERMINISTIC PLAIN-LANGUAGE SUMMARY (NLP-F1 Rule Template)                       |
| | T-145 Devendra Kapoor          | | "Patient Ananya Sharma, 52y Female, presented with recurrent headache for 2-3 wks.|
| | BS-00145 • 58y M • Wait: 25m   | | Diagnosed with [I10] Essential hypertension. Prescribed 3 medications. Review 7d."|
+------------------------------------+-----------------------------------------------------------------------------------+
```

---

## 4. Inpatient (IPD) Ward Bed Matrix Wireframe (`/ipd/beds`)

```
+------------------------------------------------------------------------------------------------------------------------+
| Bright • Inpatient Ward Station • Shift: MORNING (06:00 - 14:00) • Inpatient Census: 24/30 Beds (80% Occupancy)        |
+------------------------------------------------------------------------------------------------------------------------+
| WARD FILTER: [ All Wards ] [ General Ward A (10/12) ] [ Semi-Private (8/10) ] [ ICU (6/8) ] | [ + New Admission (F3) ] |
+------------------------------------------------------------------------------------------------------------------------+
| BED 101 - Male Gen Ward            | BED 102 - Male Gen Ward            | BED 103 - Male Gen Ward                      |
| [OCCUPIED] • Day 2 of 6            | [OCCUPIED] • Day 4 of 6            | [VACANT - CLEAN]                             |
| Devendra Kapoor (58M) • BS-00145   | Rajan Pillai (67M) • BS-00143      | Ready for Admission                          |
| Dx: Acute Exacerbation of Asthma   | Dx: Type 2 Diabetes w/ Cellulitis  | Tariff: INR 1,200 / day                      |
| Dr. V. Swaminathan (Pulmonology)   | Dr. Kiran Patel (Internal Med)     |                                              |
| Vitals: BP 132/84 • SpO2 96%       | Vitals: BP 138/88 • SpO2 97%       |                                              |
| [ Open Clinical Folio (6-Day) ↗ ]  | [ Open Clinical Folio (6-Day) ↗ ]  | [ Assign Admitted Patient ]                  |
+------------------------------------+------------------------------------+----------------------------------------------+
| BED 104 - Male Gen Ward            | BED 201 - Semi-Private Ward        | BED 301 - Intensive Care Unit (ICU)          |
| [VACANT - DIRTY / HOUSEKEEPING]    | [OCCUPIED] • Day 1 of 6            | [OCCUPIED] • Day 3 of 6 • [CRITICAL]         |
| Housekeeping Requested 10:15 AM    | Ananya Sharma (52F) • BS-00142     | David Arthur Miller (54M) • BS-00147         |
| Estimated Clean: 10:45 AM          | Dx: Severe HTN w/ Hypertensive Urg | Dx: Acute Coronary Syndrome (STEMI)          |
|                                    | Dr. Kiran Patel (Internal Med)     | Dr. S. Ramanathan (Cardiology)               |
| [ Mark Bed Clean & Ready ]         | Vitals: BP 150/95 • SpO2 99%       | Vitals: BP 168/102 • HR 112 • SpO2 93%       |
|                                    | [ Open Clinical Folio (6-Day) ↗ ]  | [ Open Clinical Folio (6-Day) ↗ ]            |
+------------------------------------------------------------------------------------------------------------------------+
```

### 4.1 Bed Card Color State Map (D17 Token Reference)

The `BedOccupancyCard` component (D16 §3.7) must apply the following background, border, and badge token combinations per bed `status` × `latestVitalsState`:

| `status` | `latestVitalsState` | Card Background Token | Card Border Token | Status Badge Token | Badge Label |
|:---|:---|:---|:---|:---|:---|
| `OCCUPIED` | `STABLE` | `--color-triage-priority-bg` (`#eff6ff`) | `--color-triage-priority-border` (`#bfdbfe`) | `--color-triage-priority-solid` (`#2563eb`) | OCCUPIED – STABLE |
| `OCCUPIED` | `ABNORMAL` | `--color-triage-urgent-bg` (`#fef3c7`) | `--color-triage-urgent-border` (`#fde68a`) | `--color-triage-urgent-solid` (`#d97706`) | OCCUPIED – REVIEW |
| `OCCUPIED` | `CRITICAL` | `--color-triage-emergency-bg` (`#fee2e2`) | `--color-triage-emergency-border` (`#fca5a5`) | `--color-triage-emergency-solid` (`#dc2626`) | OCCUPIED – CRITICAL |
| `VACANT_CLEAN` | N/A | `--color-triage-routine-bg` (`#ccfbf1`) | `--color-triage-routine-border` (`#99f6e4`) | `--color-triage-routine-solid` (`#0d9488`) | VACANT – READY |
| `VACANT_DIRTY` | N/A | `--color-surface-subtle` (`#f1f5f9`) | `--color-border-default` (`#e2e8f0`) | `--color-text-muted` (`#64748b`) | HOUSEKEEPING |
| `MAINTENANCE` | N/A | `--color-surface-subtle` (`#f1f5f9`) | `--color-border-default` (`#e2e8f0`) | `--color-text-secondary` (`#475569`) | MAINTENANCE |

> **Note:** The `[CRITICAL]` badge shown on BED 301 (ICU) in the wireframe above uses `--color-triage-emergency-solid` background with white text. Apply `animation: radarPing 2s infinite` (D17 §5) to the status dot for live pulse effect.

---

## 5. Inpatient Clinical Folio Wireframe (6-Day Book Digitization)

Mounted at `/ipd/admissions/:admissionId/folio`. Digitize the client's physical 6-Day Inpatient Book:

```
+------------------------------------------------------------------------------------------------------------------------+
| [AS]  ANANYA SHARMA  Master UHID: BS-2026-00142 | IPD Adm: IPD-2026-00891 | Bed: Semi-Private 201 | Day 2 of 6 Days    |
|       52y Female • Admitted: 26 Oct 2026, 11:30 AM • Consultant: Dr. Kiran Patel, MD | [MLC Case: No]                  |
+------------------------------------------------------------------------------------------------------------------------+
| [Tab 1: Face Sheet (F8/9)] [Tab 2: H&P Note (F10)] [Tab 3: MAR Sheet (F29)] [Tab 4: Fluid I/O (F61)] [Tab 5: Notes (F72)]|
+------------------------------------------------------------------------------------------------------------------------+
```

### 5.1 Tab 1: Face Sheet & Consent (Forms 8 & 9)
```
+------------------------------------------------------------------------------------------------------------------------+
| FORM 8 & 9: PATIENT ADMISSION FACE SHEET & GENERAL / SURGICAL CONSENT RECORD                                           |
+------------------------------------------------------------------------------------------------------------------------+
| Next of Kin / Guardian:* [Suresh Sharma                  ]  Relationship:* [Spouse           ]  Phone:* [9841099999]   |
| Medico-Legal Case (MLC): [ ] Yes  [x] No                     Police Station (if MLC): [N/A                       ]     |
| Billing Category:        [x] TPA / Cashless (Star Health)    Policy / Claim No:       [SH-POL-992819             ]     |
| Provisional Diagnosis:   [Essential Hypertension with Hypertensive Urgency (ICD-10: I10)                        ]     |
| Consent Clause (NABH):   "I hereby authorize the hospital medical staff to perform diagnostic & clinical treatments..."|
| Patient/Kin Signature:   [x] Signed Digitally on Tablet (26 Oct 2026, 11:45 AM)     [ Print Form 8/9 Face Sheet ]      |
+------------------------------------------------------------------------------------------------------------------------+
```

### 5.2 Tab 2: Doctor H&P Admission Note (Form 10)
```
+------------------------------------------------------------------------------------------------------------------------+
| FORM 10: DOCTOR COMPREHENSIVE HISTORY & PHYSICAL (H&P) ADMISSION NOTE                                                  |
+------------------------------------------------------------------------------------------------------------------------+
| CHIEF COMPLAINTS:          [Severe throbbing occipital headache, blurred vision, dizziness for 48 hours               ]|
| HISTORY OF PRESENT ILLNESS:[Patient is a known hypertensive for 4 years on irregular medications. Presented with SBP  ]|
| PAST MEDICAL / SURGICAL:   [No prior hospitalizations. No diabetes or bronchial asthma.                               ]|
| SYSTEMIC EXAMINATION:      [CVS: S1 S2 normal. RS: Bilateral vesicular breath sounds. CNS: No focal neurological deficit]|
| ADMISSION ORDERS:          [1. Bed rest. 2. IV Access. 3. Continuous BP & Cardiac telemetry. 4. Low salt diet.       ]|
| Doctor Digital Sign:       [ Dr. Kiran Patel, MD (Reg: MC-84920-CA) • Signed & Locked 26 Oct 2026, 12:15 PM ]          |
+------------------------------------------------------------------------------------------------------------------------+
```

### 5.3 Tab 3: Inpatient Treatment Sheet & MAR (Form 29)
```
+------------------------------------------------------------------------------------------------------------------------+
| FORM 29: INPATIENT TREATMENT SHEET & 6-DAY MEDICATION ADMINISTRATION RECORD (MAR)                                      |
| Oxygen Therapy: [x] Active • Flow Rate: [2 L/min] via [Nasal Cannula |v] • Target SpO2: [> 95%] • Checked By: Nurse SR |
+------------------------------------------------------------------------------------------------------------------------+
| DRUG NAME & STRENGTH  | ROUTE | FREQ  | DAY 1 (26/10)     | DAY 2 (27/10) [TODAY] | DAY 3 (28/10)     | DAYS 4-6       |
|                       |       |       | 06  12  18  22    | 06   12   18   22     | 06  12  18  22    |                |
|-----------------------|-------|-------|-------------------|-----------------------|-------------------|----------------|
| Inj. Labetalol 20mg   | IV    | STAT  | [G] --  --  --    | --   --   --   --     | --  --  --  --    | [Discontinued] |
| Tab. Telmisartan 40mg | Oral  | 1-0-0 | --  --  --  --    | [G]  --   --   --     | [S] --  --  --    | [Scheduled]    |
| Tab. Amlodipine 5mg   | Oral  | 0-0-1 | --  --  --  [G]   | --   --   --   [S]    | --  --  --  [S]   | [Scheduled]    |
| IV Normal Saline 500ml| IV Inf| 80ml/h| [===== 500ml =====| [==== 350/500ml ====] | --  --  --  --    |                |
+------------------------------------------------------------------------------------------------------------------------+
| Legend: [G] = Given (Nurse Initials stamped) • [S] = Scheduled • [O] = Omitted (Reason required) • [H] = Held          |
| CLICK CELL ACTION: Clicking Day 2 / 22:00 opens Popover -> [ Administer Now (Initials) ] [ Omit / Hold ] [ Reschedule ]|
+------------------------------------------------------------------------------------------------------------------------+
```

### 5.4 Tab 4: 24h Fluid Intake & Output Chart (Form 61)
```
+------------------------------------------------------------------------------------------------------------------------+
| FORM 61: DAILY 24-HOUR INTAKE & OUTPUT CHART • DAY 2 (27 OCT 2026)                                                     |
| [ LIVE 24h SUMMARY: Total Intake: 1,850 mL | Total Output: 1,400 mL | Net Balance: +450 mL (Balanced Fluid State) ]    |
+------------------------------------------------------------------------------------------------------------------------+
| TIME  | SHIFT   | INTAKE: Oral/NG | INTAKE: IV Fluids (Type & mL) | OUTPUT: Urine | OUTPUT: Drain/Vomit | RUNNING NET  |
|-------|---------|-----------------|-------------------------------|---------------|---------------------|--------------|
| 06:00 | MORNING | 100 mL (Water)  | NS 0.9% @ 80 mL/hr (80 mL)    | 250 mL        | 0 mL                | -70 mL       |
| 08:00 | MORNING | 150 mL (Tea)    | NS 0.9% @ 80 mL/hr (160 mL)   | 200 mL        | 0 mL                | +40 mL       |
| 12:00 | MORNING | 200 mL (Soup)   | NS 0.9% @ 80 mL/hr (320 mL)   | 350 mL        | 0 mL                | +210 mL      |
| 14:00 | SHIFT 1 | SUBTOTAL: 450 mL| SUBTOTAL: 560 mL (Tot: 1010)  | SUBTOTAL: 800 | SUBTOTAL: 0 mL      | NET: +210 mL |
| 18:00 | EVENING | 200 mL (Water)  | DNS @ 50 mL/hr (200 mL)       | 300 mL        | 0 mL                | +310 mL      |
| 22:00 | SHIFT 2 | SUBTOTAL: 400 mL| SUBTOTAL: 400 mL (Tot: 800)   | SUBTOTAL: 500 | SUBTOTAL: 0 mL      | NET: +300 mL |
+------------------------------------------------------------------------------------------------------------------------+
| [ + Log Hourly Fluid Entry ]                             [ Print Form 61 Fluid Balance Sheet (A4 Landscape) ]          |
+------------------------------------------------------------------------------------------------------------------------+
```

### 5.5 Tab 5: Nurse Vitals & Shift Notes (Form 72)
```
+------------------------------------------------------------------------------------------------------------------------+
| FORM 72: NURSE SHIFT OBSERVATIONS, DAILY VITALS & NEWS2 EARLY WARNING MONITOR                                          |
+------------------------------------------------------------------------------------------------------------------------+
| ACTIVE SHIFT: [ MORNING (06:00 - 14:00) ] • Staff Nurse on Duty: S. Ramani, RN                                        |
|                                                                                                                        |
| SHIFT VITALS INTAKE:                                                                                                   |
| BP: [136] / [84] mmHg | Pulse: [76] bpm | SpO2: [98]% on Room Air | Temp: [98.4]°F | Resp Rate: [16] bpm               |
| Pain Score (0-10): [ 2 ] (Mild headache, Wong-Baker scale 2)                                                           |
| NEWS2 SCORE: [ 0 ] (Low Clinical Risk - Routine Ward Monitoring Every 12 Hours)                                        |
|                                                                                                                        |
| NURSING OBSERVATIONS & INTERVENTIONS:                                                                                  |
| [ Patient resting comfortably in bed. Morning oral medications administered at 06:15 AM after breakfast.              ]
| [ Peripheral IV line on left forearm patent without phlebitis or swelling. Urine output clear and adequate.            ]
|                                                                                                                        |
| CLINICAL HANDOFF NOTE (FOR EVENING SHIFT NURSE):                                                                       |
| [ Repeat sitting Blood Pressure check scheduled at 16:00. Fasting lipid profile sample drawn and sent to lab at 07:00. ]
|                                                                                                                        |
| [ Save Nurse Shift Record (SR-RN) ]                    [ Print Form 72 Nursing Records (A4 Portrait) ]                 |
+------------------------------------------------------------------------------------------------------------------------+
```

---

## 6. Billing Counter: Consolidated 10-Head IPD Settlement Wireframe

Mounted at `/billing/ipd-settlement/:admissionId`:

```
+------------------------------------------------------------------------------------------------------------------------+
| Bright Cashier POS • IPD Final Settlement • Patient: Ananya Sharma (BS-00142) • Admission: IPD-2026-00891 (2 Days)     |
+-------------------------------------------------------------------+----------------------------------------------------+
| CONSOLIDATED 10-HEAD INPATIENT BILL BREAKDOWN (NABH/IRDAI)        | SETTLEMENT PAYMENT COLLECTION                      |
|                                                                   |                                                    |
| 1. Bed Charges (Semi-Private 201: 2 Days @ 2,500/day)   5,000.00  | Total Gross Bill:                    INR 17,050.00 |
| 2. Nursing Care & RMO Charges (2 Days @ 600/day)        1,200.00  | Less Concession / Staff Discount:      -INR 500.00 |
| 3. Doctor Consultation & Daily Visits (Dr. Kiran Patel) 2,000.00  | Taxable Hospital Amount:             INR 16,550.00 |
| 4. Pathology & Diagnostic Lab Tests (Lipid, CBC, ECG)   2,350.00  | Add CGST (2.5%) + SGST (2.5%) on Meds: +INR 140.00 |
| 5. Pharmacy Drugs & IV Fluids Dispensed                 2,800.00  | Total Net Payable:                   INR 16,690.00 |
| 6. Medical Oxygen Therapy (8 Hours @ 150/hr)            1,200.00  |                                                    |
| 7. Consumables, Syringes & IV Infusion Sets             1,100.00  | Less Advance Deposit Paid (26 Oct): -INR 10,000.00 |
| 8. Operation Theatre & Recovery (N/A Medical Adm)           0.00  | -------------------------------------------------- |
| 9. Anaesthesia Charges (N/A Medical Adm)                    0.00  | FINAL OUTSTANDING BALANCE DUE:        INR 6,690.00 |
| 10. Administrative, Admission & Medical Records Fee       900.00  |                                                    |
| ----------------------------------------------------------------- | Payment Mode:* [x] UPI (QR / UTR) [ ] Cash [ ] Card|
| TOTAL GROSS IPD INVOICE AMOUNT:                    INR 17,050.00  | UPI Reference / UTR Number:* [UTR9928104812      ] |
|                                                                   | [ Process Settlement & Discharge Clearance (F9)  ] |
+-------------------------------------------------------------------+----------------------------------------------------+
```

---

## 7. Waiting Room TV Display Wireframe (`/display/waiting-room`)

Fullscreen chromeless layout for LED monitors:

```
+------------------------------------------------------------------------------------------------------------------------+
|                                              BRIGHT SOLUTIONS HOSPITAL                                                |
|                                            OUTPATIENT CONSULTATION QUEUE                                              |
+------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                        |
|                       CURRENTLY CALLING                                  UP NEXT IN QUEUE                             |
|                                                                                                                        |
|                  +--------------------------+                      +------------------------------------+              |
|                  |                          |                      |  Token #143    Cabin 01 (Dr Kiran) |              |
|                  |       TOKEN #142         |                      +------------------------------------+              |
|                  |                          |                      |  Token #144    Cabin 02 (Dr Raman) |              |
|                  +--------------------------+                      +------------------------------------+              |
|                                                                    |  Token #145    Cabin 03 (Dr Swami) |              |
|                      CABIN 01 (ROOM 104)                           +------------------------------------+              |
|                      DR. KIRAN PATEL, MD                           |  Token #146    Cabin 01 (Dr Kiran) |              |
|                   GENERAL & INTERNAL MEDICINE                      +------------------------------------+              |
|                                                                                                                        |
+------------------------------------------------------------------------------------------------------------------------+
| >>> PLEASE PROCEED TO YOUR RESPECTIVE CABIN WHEN YOUR TOKEN IS ANNOUNCED • KEEP YOUR PRESCRIPTION SLIP READY >>>       |
+------------------------------------------------------------------------------------------------------------------------+
```
