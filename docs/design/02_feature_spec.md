# D2 — Feature Specification
## Bright Solutions: Clinical Hospital Operating System

> **Document ID:** D2  
> **Version:** 1.0  
> **Status:** DRAFT  
> **Depends On:** D1 (PRD)  
> **Prepared By:** Bright Solutions Engineering Team  
> **Last Updated:** October 2026  

---

## Table of Contents

1. [How to Read This Document](#1-how-to-read-this-document)
2. [Module 1 — Patient Registration](#2-module-1--patient-registration)
3. [Module 2 — OPD Queue Management](#3-module-2--opd-queue-management)
4. [Module 3 — Vital Signs & Intake Questionnaire](#4-module-3--vital-signs--intake-questionnaire)
5. [Module 4 — Doctor Consultation](#5-module-4--doctor-consultation)
6. [Module 5 — E-Prescription & Pharmacy](#6-module-5--e-prescription--pharmacy)
7. [Module 6 — IPD Admission](#7-module-6--ipd-admission)
8. [Module 7 — Pathology / Laboratory](#8-module-7--pathology--laboratory)
9. [Module 8 — Billing](#9-module-8--billing)
10. [Module 9 — CDSS & AI Features](#10-module-9--cdss--ai-features)
11. [Module 10 — Auth & User Management](#11-module-10--auth--user-management)
12. [Module 11 — Admin Configuration](#12-module-11--admin-configuration)
13. [Module 12 — Waiting Room Display](#13-module-12--waiting-room-display)
14. [Cross-Module Business Rules](#14-cross-module-business-rules)
15. [Status & Lifecycle State Machines](#15-status--lifecycle-state-machines)

---

## 1. How to Read This Document

Each module section contains:
- **Overview** — what the module does and who uses it
- **Features** — numbered list with priority (P0 = must ship, P1 = should ship, P2 = nice to have in MVP)
- **Business Rules** — constraints and logic that must be enforced
- **Acceptance Criteria** — Given/When/Then statements used to verify correctness
- **Edge Cases** — failure modes and boundary conditions to handle

**Priority Key:**
- 🔴 **P0** — Blocks go-live. Non-negotiable for MVP.
- 🟡 **P1** — Ships in MVP but not a blocker if delayed to Week 4 polish.
- 🟢 **P2** — Post-MVP (Weeks 5+).

---

## 2. Module 1 — Patient Registration

**Actor:** Receptionist  
**Entry Point:** Patient walks in (new or follow-up)  
**Exit Point:** Patient assigned to OPD queue with token  

### Features

| ID | Feature | Priority |
|:--|:---|:---:|
| REG-F1 | Create new patient record with full demographics | 🔴 P0 |
| REG-F2 | Auto-generate UHID in admin-configured format (prefix + padded sequence) | 🔴 P0 |
| REG-F3 | Detect returning patient by phone number or UHID — prompt for follow-up instead of new registration | 🔴 P0 |
| REG-F4 | Collect multiple contact numbers (primary mobile, secondary mobile, emergency contact name + relation + number) | 🔴 P0 |
| REG-F5 | Categorized address — house/flat no., street, area (typeahead), city (dropdown), state, PIN code | 🔴 P0 |
| REG-F6 | Capture patient photo — webcam preferred, file upload fallback (JPG/PNG, max 2MB) | 🔴 P0 |
| REG-F7 | ABHA number field (14-digit, optional, no API validation in MVP) | 🔴 P0 |
| REG-F8 | Aadhaar number field — stored masked (only last 4 digits displayed after save) | 🔴 P0 |
| REG-F9 | Referred-by field — free text OR lookup from a pre-configured referring doctor/facility list | 🔴 P0 |
| REG-F10 | FRRO section for foreign nationals — Nationality, Passport No., Visa No., Visa Type, Visa Expiry Date | 🔴 P0 |
| REG-F11 | New vs. Follow-up flag — set at registration, linked to original encounter if follow-up | 🔴 P0 |
| REG-F12 | Assign patient to doctor + department at registration; generates OPD number + token | 🔴 P0 |
| REG-F13 | Religion, marital status, occupation (optional fields) | 🟡 P1 |
| REG-F14 | Print patient registration slip / token at end of registration | 🟡 P1 |
| REG-F15 | Edit patient demographics after registration (audit logged) | 🟡 P1 |
| REG-F16 | Patient photo retake / re-upload after initial save | 🟡 P1 |

### Business Rules

| ID | Rule |
|:--|:---|
| BR-REG-01 | UHID is permanent and never reused or deleted. Once assigned, it belongs to that patient for life. |
| BR-REG-02 | UHID format = `{configured_prefix}{zero_padded_sequence}`. Prefix and digit count set by admin in hospital settings. |
| BR-REG-03 | Phone number uniqueness is NOT enforced globally (families share phones) — receptionist is warned but can proceed. |
| BR-REG-04 | Aadhaar number stored encrypted at rest. Display masked as `XXXX-XXXX-{last4}` after initial save. Never shown in full again except by Superadmin with audit log. |
| BR-REG-05 | FRRO section only appears if receptionist checks "Foreign National" checkbox — hidden by default. |
| BR-REG-06 | If returning patient detected by phone/UHID, system shows existing record and prompts: "Create new OPD visit?" rather than creating a duplicate patient. |
| BR-REG-07 | OPD number = `{configured_opd_prefix}{global_auto_increment}`. Each new OPD visit (even same day, same patient) gets a new OPD number. |
| BR-REG-08 | Consultation fee is collected at registration. Billing module creates a receipt for the consultation fee at this point. |

### Acceptance Criteria

```
AC-REG-01: New Patient Registration
  Given: A receptionist enters all required fields and submits
  When: The form is submitted
  Then: A unique UHID is generated in configured format
    AND an OPD number is generated
    AND a queue token is created and the patient enters the OPD queue
    AND a success screen shows UHID + token number

AC-REG-02: Duplicate Detection
  Given: A receptionist enters a phone number that already exists in the system
  When: The phone number field loses focus (onBlur)
  Then: A warning banner appears showing the existing patient's name + UHID
    AND two options appear: "Continue as New Patient" and "Register Follow-up Visit"

AC-REG-03: Aadhaar Masking
  Given: A receptionist enters a 12-digit Aadhaar number and saves
  When: The record is saved and displayed again
  Then: The Aadhaar field shows XXXX-XXXX-{last4}
    AND the full number is NOT retrievable from any UI

AC-REG-04: FRRO fields
  Given: "Foreign National" checkbox is unchecked
  Then: FRRO section (Passport, Visa fields) is hidden
  Given: "Foreign National" checkbox is checked
  Then: FRRO section appears with Passport No., Visa No., Visa Type, Visa Expiry as optional fields
```

### Edge Cases

| Case | Handling |
|:---|:---|
| Webcam not available / denied | Silently fall back to file upload UI without error |
| Photo upload > 2MB | Show inline error "Photo must be under 2MB" — do not block registration |
| ABHA number entered with incorrect digit count | Inline warning "ABHA number should be 14 digits" — not a blocking error |
| Aadhaar number < 12 digits | Blocking inline validation — cannot save until corrected |
| OPD number sequence gap (e.g. failed transaction) | Sequence gaps are acceptable — do not attempt to fill gaps |

---

## 3. Module 2 — OPD Queue Management

**Actor:** Receptionist (queue management), Doctor (calling patients), Nurse (triage)  
**Entry Point:** Patient registered and token assigned  
**Exit Point:** Patient consultation completed / No-Show marked  

### Features

| ID | Feature | Priority |
|:--|:---|:---:|
| OPD-F1 | Real-time queue board — shows all patients in queue grouped by doctor with token, name, status | 🔴 P0 |
| OPD-F2 | Doctor view — shows only their queue; one-click "Call Next" advances current token | 🔴 P0 |
| OPD-F3 | Queue statuses: Waiting → In Triage → With Doctor → Completed / No-Show / Cancelled | 🔴 P0 |
| OPD-F4 | Receptionist marks token as No-Show or Cancelled (with reason) | 🔴 P0 |
| OPD-F5 | New vs. Follow-up badge visible on each token in queue | 🔴 P0 |
| OPD-F6 | Follow-up auto-assigns to original doctor; receptionist can manually override | 🔴 P0 |
| OPD-F7 | Receptionist can reorder tokens (move patient up/down in queue) with reason logged | 🟡 P1 |
| OPD-F8 | Receptionist can transfer a token to a different doctor / department | 🟡 P1 |
| OPD-F9 | Queue resets / archives at end of day (configurable cutoff time) | 🟡 P1 |

### Business Rules

| ID | Rule |
|:--|:---|
| BR-OPD-01 | A patient can only be "With Doctor" (active consultation) one at a time — one active token per patient per day. |
| BR-OPD-02 | No-Show and Cancelled tokens cannot be re-activated — a new OPD visit must be registered if patient returns same day. |
| BR-OPD-03 | Token reordering is logged with: actor (receptionist), timestamp, reason, before/after position. |
| BR-OPD-04 | Follow-up default doctor = the doctor who signed the last consultation for that patient in the same department. If that doctor is not available today, receptionist is notified and must manually assign. |
| BR-OPD-05 | Doctor can only see and call patients assigned to their queue — cannot view other doctors' queues. |

### Acceptance Criteria

```
AC-OPD-01: Doctor Calls Next Patient
  Given: A doctor has patients in their queue with status "Waiting"
  When: Doctor clicks "Call Next"
  Then: The next patient's token status changes to "With Doctor"
    AND the waiting room display (if active) updates to show the called token number

AC-OPD-02: No-Show Marking
  Given: A patient's token is in "Waiting" or "In Triage" status
  When: Receptionist selects "Mark No-Show" and confirms
  Then: Token status changes to "No-Show"
    AND token is grayed out in queue view
    AND cannot be re-activated

AC-OPD-03: Follow-up Auto-Assignment
  Given: A patient returns for a follow-up and was last seen by Dr. X
  When: Receptionist registers the follow-up visit
  Then: System auto-assigns Dr. X
    AND if Dr. X is not on the active doctor list today, a warning appears prompting manual assignment
```

### Edge Cases

| Case | Handling |
|:---|:---|
| Doctor marks consultation complete without signing SOAP note | Status moves to "Pending Sign-off" — billing cannot be triggered until signed |
| All doctors offline / no doctors active today | Queue registration still works; tokens remain in "Waiting" until a doctor logs in |
| Patient registered twice by mistake | Second registration triggers duplicate detection — receptionist must confirm |

---

## 4. Module 3 — Vital Signs & Intake Questionnaire

**Actor:** Triage Nurse  
**Entry Point:** Patient token reaches "In Triage" status  
**Exit Point:** Vitals saved → token status moves to "Waiting" for doctor  

### Features

| ID | Feature | Priority |
|:--|:---|:---:|
| VIT-F1 | Enter vitals: Systolic BP, Diastolic BP, Pulse rate, Temperature (°F), SpO2 (%), Respiratory rate, Weight (kg), Height (cm) | 🔴 P0 |
| VIT-F2 | BMI auto-calculated from weight + height | 🔴 P0 |
| VIT-F3 | Vitals flagged Normal / Warning / Critical against hardcoded clinical thresholds | 🔴 P0 |
| VIT-F4 | Structured intake questionnaire — chief complaint (select + free text), symptom checklist, duration, severity (1–10) | 🔴 P0 |
| VIT-F5 | Questionnaire responses stored as structured JSON for CDSS processing | 🔴 P0 |
| VIT-F6 | Nurse can update vitals after initial save (re-measurement) — audit logged | 🟡 P1 |

### Vital Sign Alert Thresholds

| Parameter | Normal Range | Warning | Critical |
|:---|:---|:---|:---|
| Systolic BP | 90–140 mmHg | 141–180 or 80–89 | > 180 or < 80 |
| Diastolic BP | 60–90 mmHg | 91–110 or 50–59 | > 110 or < 50 |
| Pulse Rate | 60–100 bpm | 101–120 or 50–59 | > 120 or < 50 |
| Temperature | 97.0–99.5 °F | 99.6–103.0 | > 103.0 or < 95.0 |
| SpO2 | ≥ 95% | 90–94% | < 90% |
| Respiratory Rate | 12–20 /min | 21–30 or 10–11 | > 30 or < 10 |

### Business Rules

| ID | Rule |
|:--|:---|
| BR-VIT-01 | One vitals record per encounter. Nurse can amend but all versions are retained in audit log. |
| BR-VIT-02 | Critical vitals trigger a red alert banner visible to the nurse immediately on save AND visible in the doctor's patient view. |
| BR-VIT-03 | Questionnaire is not mandatory — nurse can skip if patient is unable to respond (unconscious, etc.). |
| BR-VIT-04 | Questionnaire response JSON is stored immutably — it feeds the CDSS engine and cannot be edited after the doctor opens the consultation. |

### Acceptance Criteria

```
AC-VIT-01: Vital Signs Critical Alert
  Given: Nurse enters SpO2 = 88%
  When: The field loses focus or form is submitted
  Then: SpO2 field is highlighted red with label "CRITICAL"
    AND a banner appears: "Critical vital detected — patient requires immediate attention"

AC-VIT-02: BMI Calculation
  Given: Nurse enters Weight = 70 kg and Height = 170 cm
  When: Height field loses focus
  Then: BMI field auto-populates with 24.2 (read-only)

AC-VIT-03: Questionnaire Storage
  Given: Nurse completes the intake questionnaire and saves
  When: Doctor opens the consultation
  Then: Questionnaire responses are visible in structured format
    AND CDSS engine has already processed them and shows any relevant suggestions
```

---

## 5. Module 4 — Doctor Consultation

**Actor:** Doctor (Medical Officer / Consultant / Specialist)  
**Entry Point:** Doctor calls patient from queue (token = "With Doctor")  
**Exit Point:** Doctor signs consultation → triggers prescription flow + pharmacy queue  

### Features

| ID | Feature | Priority |
|:--|:---|:---:|
| CON-F1 | Patient summary panel — demographics, UHID, ABHA, photo, all previous encounters summary | 🔴 P0 |
| CON-F2 | Current encounter panel — today's vitals + questionnaire responses + CDSS alerts | 🔴 P0 |
| CON-F3 | SOAP note editor — Subjective, Objective, Assessment, Plan (rich text per section) | 🔴 P0 |
| CON-F4 | ICD-10 code search and assignment (primary diagnosis + secondary/comorbidities) | 🔴 P0 |
| CON-F5 | E-Prescription panel inline within consultation (see Module 5) | 🔴 P0 |
| CON-F6 | Lab order panel — order tests directly from consultation (see Module 7) | 🔴 P0 |
| CON-F7 | Doctor signs and locks the consultation — locks SOAP note + prescription | 🔴 P0 |
| CON-F8 | NLP summary — auto-generated plain-language paragraph from SOAP note (rule-based) | 🔴 P0 |
| CON-F9 | Internal referral — refer patient to another department (creates referral record) | 🟡 P1 |
| CON-F10 | Follow-up scheduling — set follow-up date + assign doctor | 🟡 P1 |
| CON-F11 | Doctor can add free-text clinical notes beyond SOAP structure | 🟡 P1 |
| CON-F12 | Previous encounter history expandable in sidebar (chronological, collapsible) | 🟡 P1 |

### Business Rules

| ID | Rule |
|:--|:---|
| BR-CON-01 | At least one ICD-10 code (primary diagnosis) is mandatory before sign-off — NABH requirement. |
| BR-CON-02 | Once doctor signs, SOAP note is locked. Amendments require a new addendum entry (not editing the original). |
| BR-CON-03 | Sign-off triggers: (a) prescription sent to pharmacy queue, (b) lab orders sent to pathology queue, (c) encounter status → "Completed". |
| BR-CON-04 | Doctor can only sign their own consultations — cannot sign on behalf of another doctor. |
| BR-CON-05 | CDSS alerts are informational — doctor can proceed regardless. Override of a CRITICAL alert must have a reason entered. |
| BR-CON-06 | ICD-10 search uses a locally bundled ICD-10 India Edition dataset — no external API call. |

### Acceptance Criteria

```
AC-CON-01: Mandatory ICD-10 on Sign-off
  Given: Doctor attempts to sign consultation without assigning an ICD-10 code
  When: "Sign & Lock" button is clicked
  Then: Sign-off is blocked
    AND inline error appears: "Primary diagnosis (ICD-10 code) is required before signing"

AC-CON-02: NLP Summary Generation
  Given: Doctor has filled the SOAP note fields
  When: Doctor clicks "Generate Summary"
  Then: A plain-language paragraph is generated from the SOAP fields
    AND shown in a preview panel for doctor review before sign-off

AC-CON-03: Consultation Lock
  Given: Doctor clicks "Sign & Lock" with ICD-10 assigned
  When: Confirmation dialog is accepted
  Then: SOAP note fields become read-only
    AND prescription is dispatched to pharmacy queue
    AND lab orders (if any) are dispatched to pathology queue
    AND encounter status = "Completed"
```

---

## 6. Module 5 — E-Prescription & Pharmacy

### 5A — E-Prescription (Doctor)

**Actor:** Doctor  

| ID | Feature | Priority |
|:--|:---|:---:|
| RX-F1 | Drug entry via typeahead from formulary + ability to add off-formulary drug with reason | 🔴 P0 |
| RX-F2 | Per drug: Dosage, Frequency (OD/BD/TID/QID/SOS/custom), Route (oral/IV/topical/IM/SC), Duration (days), Instructions (before/after/with food) | 🔴 P0 |
| RX-F3 | DDI (Drug-Drug Interaction) check — deterministic alert when two drugs with known interactions are added | 🔴 P0 |
| RX-F4 | Schedule H/H1 flag on controlled substances — shown as warning badge on the drug | 🔴 P0 |
| RX-F5 | Prescription locked on consultation sign-off — no edits after signing | 🔴 P0 |
| RX-F6 | Print Rx — PDF with clinic letterhead, patient demographics, date, doctor name + license no. + signature block, drug table, NABH fields | 🔴 P0 |
| RX-F7 | Thermal printer format — condensed 80mm slip layout | 🟡 P1 |

### Business Rules — E-Prescription

| ID | Rule |
|:--|:---|
| BR-RX-01 | DDI check runs automatically whenever a drug is added or removed from the prescription — no manual trigger needed. |
| BR-RX-02 | Off-formulary drugs (not in formulary) require a reason field (free text, mandatory). This is logged. |
| BR-RX-03 | DDI alert severity: WARNING (doctor can proceed without reason) vs CRITICAL (doctor must enter override reason). |
| BR-RX-04 | Prescription is unsigned until consultation is signed. Cannot print until signed. |
| BR-RX-05 | Schedule H/H1 drugs are tagged in the formulary — badge is informational only in MVP (no additional workflow block). |

### 5B — Pharmacy Module

**Actor:** Pharmacist  
**Entry Point:** Doctor signs consultation → prescription appears in pharmacy queue  
**Exit Point:** Pharmacist dispenses drugs + generates pharmacy bill  

| ID | Feature | Priority |
|:--|:---|:---:|
| PH-F1 | Pharmacy queue — shows all pending prescriptions from signed consultations | 🔴 P0 |
| PH-F2 | Pharmacist opens prescription, marks each drug as "Dispensed", "Partial", or "Not Available" | 🔴 P0 |
| PH-F3 | Generate pharmacy bill — drug name × quantity × unit price from pharmacy price list | 🔴 P0 |
| PH-F4 | Print pharmacy bill (PDF) | 🔴 P0 |
| PH-F5 | Pharmacy inventory (stock levels, reorder alerts) | 🟢 P2 — Post-MVP |

### Business Rules — Pharmacy

| ID | Rule |
|:--|:---|
| BR-PH-01 | Pharmacy bill is separate from OPD consultation bill (which was paid at registration). |
| BR-PH-02 | Pharmacist cannot edit the prescribed drugs — can only mark as dispensed/partial/unavailable. |
| BR-PH-03 | If a drug is marked "Not Available", the system flags it — doctor is notified (informational only in MVP). |

---

## 7. Module 6 — IPD Admission

**Actor:** IPD Admissions Officer  
**Entry Point:** Doctor or receptionist initiates IPD admission  
**Exit Point:** Patient assigned to ward + bed + attending doctor  

### Features

| ID | Feature | Priority |
|:--|:---|:---:|
| IPD-F1 | Create IPD admission linked to existing UHID | 🔴 P0 |
| IPD-F2 | Auto-generate IPD number — admin-configured format, global auto-increment (not date-reset) | 🔴 P0 |
| IPD-F3 | Assign ward, room type (General / Semi-Private / Private / ICU), bed number | 🔴 P0 |
| IPD-F4 | Room type affects billing rate — pre-configured daily rate per room type | 🔴 P0 |
| IPD-F5 | Assign admitting doctor + admitting diagnosis (ICD-10) | 🔴 P0 |
| IPD-F6 | Admission type: Emergency / Elective / Transfer | 🔴 P0 |
| IPD-F7 | Admission date/time + tentative discharge date | 🔴 P0 |
| IPD-F8 | IPD patient list — shows all currently admitted patients with ward + bed + doctor | 🟡 P1 |
| IPD-F9 | Discharge patient — records discharge date + discharge diagnosis + discharge summary | 🟡 P1 |

### Business Rules

| ID | Rule |
|:--|:---|
| BR-IPD-01 | A bed cannot be occupied by two patients simultaneously — bed assignment validates current occupancy. |
| BR-IPD-02 | IPD number format configured independently from UHID and OPD number prefixes. |
| BR-IPD-03 | IPD daily room charge begins from admission date and is added to the IPD bill on discharge. |
| BR-IPD-04 | IPD admission does not require a prior OPD visit — can be a direct admission (e.g., emergency). |

---

## 8. Module 7 — Pathology / Laboratory

**Actor:** Doctor (orders), Lab Technician (processes results)  
**Entry Point:** Doctor creates lab order from consultation  
**Exit Point:** Results entered, flagged, and visible to ordering doctor  

### Features

| ID | Feature | Priority |
|:--|:---|:---:|
| PATH-F1 | Doctor creates lab order from consultation — selects tests from admin-configured catalog | 🔴 P0 |
| PATH-F2 | Lab order fields: test name, urgency (Routine / Urgent / STAT), specimen type, clinical notes | 🔴 P0 |
| PATH-F3 | Lab queue — technician sees pending orders sorted by urgency then time | 🔴 P0 |
| PATH-F4 | Technician enters results: observed value, unit, reference range (auto-filled from catalog) | 🔴 P0 |
| PATH-F5 | Results auto-flagged: Normal / High / Low / Critical vs catalog reference ranges | 🔴 P0 |
| PATH-F6 | Critical result flag triggers notification visible to ordering doctor in consultation | 🔴 P0 |
| PATH-F7 | Completed results visible in patient's encounter timeline | 🔴 P0 |
| PATH-F8 | Lab report print (PDF) with hospital letterhead | 🟡 P1 |
| PATH-F9 | Lab billing — lab tests appear on billing counter bill (not OPD consultation fee) | 🔴 P0 |

### Business Rules

| ID | Rule |
|:--|:---|
| BR-PATH-01 | Pathology test catalog is admin-configured — admin sets test name, specimen type, reference ranges, unit, price before go-live. |
| BR-PATH-02 | STAT orders appear at the top of the lab queue regardless of order time. |
| BR-PATH-03 | Lab technician cannot modify the test ordered — can only enter results and flag status. |
| BR-PATH-04 | Lab bill is generated at the billing counter (separate from consultation fee and pharmacy bill). |
| BR-PATH-05 | A test can have multiple reference ranges based on patient gender and age — admin can configure age/gender-specific ranges per test. |

---

## 9. Module 8 — Billing

**Actor:** Billing Officer (lab bill), Pharmacist (pharmacy bill), Receptionist (consultation fee)  

### Payment Flow

```
Patient Journey → Payment Points:

1. Registration (Reception)
   └── Consultation fee paid here (fixed rate per doctor/department)
       └── Receipt printed

2. After Consultation (Pharmacy counter)
   └── Pharmacy bill generated by pharmacist on drug dispensing
       └── Receipt printed

3. After Lab (Billing counter)
   └── Lab bill generated for all ordered tests
       └── Receipt printed

4. IPD Discharge (Billing counter)
   └── Consolidated IPD bill: room charges + procedures + lab + pharmacy
       └── Receipt printed
```

### Features

| ID | Feature | Priority |
|:--|:---|:---:|
| BILL-F1 | Consultation fee receipt at registration (auto-filled rate from doctor/dept config) | 🔴 P0 |
| BILL-F2 | Pharmacy bill generation at pharmacy counter | 🔴 P0 |
| BILL-F3 | Lab bill generation at billing counter | 🔴 P0 |
| BILL-F4 | IPD consolidated bill at discharge | 🔴 P0 |
| BILL-F5 | Payment modes: Cash / UPI / Card / Insurance (recorded manually, no gateway) | 🔴 P0 |
| BILL-F6 | Print receipt PDF for all bill types | 🔴 P0 |
| BILL-F7 | Bill statuses: Draft → Confirmed → Paid / Partially Paid / Refunded / Written Off | 🔴 P0 |
| BILL-F8 | Discount entry with reason (requires supervisor authorization above configurable threshold) | 🟡 P1 |
| BILL-F9 | GST breakdown on receipt if applicable | 🟡 P1 |
| BILL-F10 | Daily billing summary report | 🟡 P1 |

### Business Rules

| ID | Rule |
|:--|:---|
| BR-BILL-01 | Consultation fee is fixed per doctor / department — configured by admin. Not itemized further. |
| BR-BILL-02 | Pharmacy and lab bills are independent of each other and of the consultation fee. |
| BR-BILL-03 | No automatic payment gateway integration in MVP — billing officer manually selects mode and confirms receipt of payment. |
| BR-BILL-04 | A paid bill cannot be edited — only a refund entry can be created against it. |
| BR-BILL-05 | Discount above configured threshold (e.g., > 20%) requires a second approval by admin/billing supervisor before confirmation. |

---

## 10. Module 9 — CDSS & AI Features

**Actor:** System (automated), Doctor (reviews)  
**Trigger:** Vitals saved (CDSS runs immediately), Questionnaire submitted (differential runs), Drug added to Rx (DDI check)  

### 9A — CDSS Deterministic Engine

| ID | Feature | Priority |
|:--|:---|:---:|
| CDSS-F1 | Vital signs alerts (thresholds defined in Module 3) | 🔴 P0 |
| CDSS-F2 | Questionnaire pattern matching — symptom combinations trigger clinical flags (e.g., chest pain + diaphoresis → Cardiac alert) | 🔴 P0 |
| CDSS-F3 | ICD-10 diagnosis + vital combination rules (e.g., patient with diabetes ICD E11 + HbA1c lab critical → glycemic alert) | 🔴 P0 |
| CDSS-F4 | DDI alerts from prescription drug combinations (hardcoded interaction database) | 🔴 P0 |
| CDSS-F5 | All CDSS alerts shown in doctor consultation view with severity (INFO / WARNING / CRITICAL) | 🔴 P0 |
| CDSS-F6 | Doctor can dismiss INFO/WARNING without reason; CRITICAL requires reason to override | 🔴 P0 |

### Questionnaire Pattern Rules (Seed Set — MVP)

| Pattern | Alert Title | Severity |
|:---|:---|:---:|
| Chest pain + Breathlessness | Possible Cardiac / Pulmonary Event | CRITICAL |
| Chest pain + Diaphoresis + Radiation to arm | Possible ACS — Consider ECG | CRITICAL |
| High fever + Stiff neck + Headache | Possible Meningitis — Refer immediately | CRITICAL |
| Fever > 5 days + Rash | Possible Dengue / Typhoid | WARNING |
| Polyuria + Polydipsia + Weight loss | Possible Diabetes — Check FBS/HbA1c | WARNING |
| Breathlessness + Ankle swelling | Possible Cardiac Failure | WARNING |
| Headache + Visual disturbance + High BP | Hypertensive Urgency | WARNING |

### 9B — NLP Consultation Summary

| ID | Feature | Priority |
|:--|:---|:---:|
| NLP-F1 | Auto-generate plain-language summary from SOAP note fields (rule-based template, not LLM) | 🔴 P0 |
| NLP-F2 | Doctor can regenerate / edit the summary before sign-off | 🔴 P0 |
| NLP-F3 | Summary saved as part of the signed encounter | 🔴 P0 |

**NLP Summary Template (rule-based):**
```
Patient {name}, {age}y {gender}, presented with {chief_complaint} for {duration}.
On examination: {objective_findings_summary}.
Assessment: {primary_icd10_description} {secondary_diagnoses_if_any}.
Plan: {plan_narrative_summary}.
Follow-up in {followup_days} days.
```

### 9C — Questionnaire-Based Differential Suggestion

| ID | Feature | Priority |
|:--|:---|:---:|
| DIFF-F1 | After questionnaire is submitted, system generates a differential checklist of possible diagnoses | 🔴 P0 |
| DIFF-F2 | Differential is shown in doctor's consultation view as a collapsible "Suggested Differentials" panel | 🔴 P0 |
| DIFF-F3 | Each differential has: condition name, reasoning (which symptoms triggered it), suggested workup | 🔴 P0 |
| DIFF-F4 | Doctor can dismiss individual differentials or mark one as confirmed (links to ICD-10 assignment) | 🟡 P1 |

### Business Rules — CDSS & AI

| ID | Rule |
|:--|:---|
| BR-CDSS-01 | All CDSS outputs are advisory — they cannot block the doctor from proceeding. |
| BR-CDSS-02 | CRITICAL alerts require an override reason which is stored in the encounter audit log. |
| BR-CDSS-03 | NLP summary is generated client-side from structured data — no external API call. |
| BR-CDSS-04 | Differential suggestion uses only the local symptom→diagnosis rule set — expandable post-MVP. |

---

## 11. Module 10 — Auth & User Management

**Actor:** Hospital Admin / Superadmin  

### Features

| ID | Feature | Priority |
|:--|:---|:---:|
| AUTH-F1 | OAuth 2.0 + JWT — individual staff accounts | 🔴 P0 |
| AUTH-F2 | Role definitions: Superadmin, Hospital Admin, Doctor (MO/Consultant), Nurse, Receptionist, Lab Technician, Pharmacist, Billing Officer, HR Staff | 🔴 P0 |
| AUTH-F3 | Department assignment per user | 🔴 P0 |
| AUTH-F4 | RBAC — each role has predefined module access (see D13 RBAC Matrix) | 🔴 P0 |
| AUTH-F5 | Account lock after 5 failed login attempts — unlock by Admin | 🔴 P0 |
| AUTH-F6 | All logins and PHI access events logged with user_id, IP, timestamp, resource | 🔴 P0 |
| AUTH-F7 | Admin UI — create / edit / deactivate staff accounts | 🔴 P0 |
| AUTH-F8 | Password reset (email link or admin-forced reset) | 🔴 P0 |
| AUTH-F9 | Session timeout after 30 minutes of inactivity (configurable) | 🟡 P1 |
| AUTH-F10 | Force password change on first login | 🟡 P1 |

### Business Rules

| ID | Rule |
|:--|:---|
| BR-AUTH-01 | A user can have only one role. Roles cannot be combined. |
| BR-AUTH-02 | Deactivated users cannot log in but their data remains intact (audit trail preserved). |
| BR-AUTH-03 | JWT access token expires in 1 hour. Refresh token valid for 24 hours. |
| BR-AUTH-04 | Superadmin can see all hospitals (post-MVP multi-tenant). Hospital Admin can only see their own hospital's users. |

---

## 12. Module 11 — Admin Configuration

**Actor:** Hospital Admin  

### Features

| ID | Feature | Priority |
|:--|:---|:---:|
| ADMIN-F1 | Hospital profile setup — name, address, logo, contact, registration number | 🔴 P0 |
| ADMIN-F2 | UHID number format configuration — prefix + digit count | 🔴 P0 |
| ADMIN-F3 | OPD number format configuration — prefix + digit count | 🔴 P0 |
| ADMIN-F4 | IPD number format configuration — prefix + digit count | 🔴 P0 |
| ADMIN-F5 | Department management — create/edit/deactivate departments | 🔴 P0 |
| ADMIN-F6 | Doctor schedule — which doctors are active today (used for queue availability check) | 🔴 P0 |
| ADMIN-F7 | Consultation fee setup — fee per doctor / per department | 🔴 P0 |
| ADMIN-F8 | Ward + bed configuration — ward name, room types, beds per ward | 🔴 P0 |
| ADMIN-F9 | IPD room type daily rate configuration | 🔴 P0 |
| ADMIN-F10 | Pathology test catalog management — test name, specimen, reference ranges, unit, price | 🔴 P0 |
| ADMIN-F11 | Pharmacy formulary management — drug name, generic name, form, strength, price, Schedule H/H1 flag | 🔴 P0 |
| ADMIN-F12 | Referring doctor / facility list management | 🟡 P1 |
| ADMIN-F13 | City and area master list management (for patient registration address typeahead) | 🟡 P1 |
| ADMIN-F14 | GST configuration per service type | 🟡 P1 |

---

## 13. Module 12 — Waiting Room Display

**Actor:** Public (no login required)  
**URL:** `/display` — designed for fullscreen TV  

### Features

| ID | Feature | Priority |
|:--|:---|:---:|
| DISP-F1 | Public-facing `/display` route — no authentication required | 🔴 P0 |
| DISP-F2 | Shows currently called token number in large font | 🔴 P0 |
| DISP-F3 | Shows recently called tokens (last 5) below the current token | 🟡 P1 |
| DISP-F4 | Auto-refreshes via polling or WebSocket — no manual reload needed | 🔴 P0 |
| DISP-F5 | Hospital name + logo displayed | 🟡 P1 |
| DISP-F6 | Configurable: filter by department (e.g., only show OPD tokens) | 🟡 P1 |

### Business Rules

| ID | Rule |
|:--|:---|
| BR-DISP-01 | Patient name is NOT shown on the display — token number only (privacy). |
| BR-DISP-02 | Display URL is unauthenticated but rate-limited — no patient data is exposed, only token numbers. |

---

## 14. Cross-Module Business Rules

These rules span multiple modules and must be enforced system-wide.

| ID | Rule |
|:--|:---|
| XBR-01 | **Audit Trail:** Every create, update, delete on any clinical or financial record is logged with: `user_id`, `role`, `ip_address`, `timestamp`, `action`, `table`, `record_id`, `before_value`, `after_value`. |
| XBR-02 | **PHI Access Log:** Every read of a patient record logs: `user_id`, `patient_id`, `timestamp`, `module`. |
| XBR-03 | **Soft Delete:** No patient or clinical records are hard-deleted. Soft delete only (is_deleted flag + deleted_by + deleted_at). |
| XBR-04 | **Encounter Lock Cascade:** Once an encounter is signed/locked, all sub-records (SOAP note, vitals, prescription, lab orders) become read-only. New information requires a new encounter or addendum. |
| XBR-05 | **Consultation fee first:** No OPD token is assigned to a doctor's queue until the consultation fee receipt is generated at reception. |
| XBR-06 | **Role-based data visibility:** Users only see data relevant to their role — doctor sees their own patients, lab tech sees only pending orders, billing sees only billing data. Cross-module views are always filtered by role. |

---

## 15. Status & Lifecycle State Machines

### Patient Encounter (OPD) Status

```
[Registered] → [In Triage] → [Waiting] → [With Doctor] → [Completed]
                                    ↘                          
                                [No-Show]
                                [Cancelled]
```

### IPD Admission Status

```
[Admitted] → [Active] → [Discharge Initiated] → [Discharged]
                ↘
           [Transferred] (to another ward/hospital)
```

### Prescription Status

```
[Draft] → [Signed] → [Sent to Pharmacy]
                            ↓
                    [Dispensed] / [Partial] / [Not Available]
```

### Lab Order Status

```
[Ordered] → [Received by Lab] → [In Progress] → [Results Entered] → [Verified]
```

### Bill Status

```
[Draft] → [Confirmed] → [Paid]
                    ↘ [Partially Paid] → [Paid]
                    ↘ [Written Off]
          [Paid] → [Refunded]
```
