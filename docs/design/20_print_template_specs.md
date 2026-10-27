# D20 — Medico-Legal Print Template Specifications
## Bright Solutions: Clinical Hospital Operating System

> **Document ID:** D20  
> **Version:** 1.1 (Audit-Revised)  
> **Status:** APPROVED FRONTEND ARCHITECTURE SPECIFICATION  
> **Revision Notes:**  
> - v1.1: DEFECT-07 fixed — Template 2 (Form 8 & 9) now has full HTML layout skeleton, CSS field grid spec, and NABH/IT Act footer  
> - v1.1: DEFECT-11 fixed — `printService.ts` now uses `iframe.onload` event as primary trigger with 800ms deadline fallback
> **Depends On:** [01_PRD.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/01_PRD.md), [02_feature_spec.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/02_feature_spec.md), [04_data_model_spec.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/04_data_model_spec.md), [11_api_endpoint_inventory.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/11_api_endpoint_inventory.md), [15_page_route_map.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/15_page_route_map.md), [18_wireframes_screen_layouts.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/18_wireframes_screen_layouts.md)  
> **Prepared By:** Bright Solutions Frontend Engineering Team  
> **Last Updated:** October 2026  

---

## Table of Contents

1. [Print Architecture & Technical Principles](#1-print-architecture--technical-principles)
2. [Template 1: A4 Outpatient (OPD) Prescription & Encounter Slip](#2-template-1-a4-outpatient-opd-prescription--encounter-slip)
3. [Template 2: Form 8 & 9 Inpatient Face Sheet & Admission Consent](#3-template-2-form-8--9-inpatient-face-sheet--admission-consent)
4. [Template 3: Form 61 Daily 24h Fluid Intake & Output Balance Sheet (Landscape)](#4-template-3-form-61-daily-24h-fluid-intake--output-balance-sheet-landscape)
5. [Template 4: Consolidated 10-Head Inpatient Discharge Bill (IRDAI/NABH)](#5-template-4-consolidated-10-head-inpatient-discharge-bill-irdainabh)
6. [Template 5: 80mm Thermal Queue Token & Front-Desk Cash Receipt](#6-template-5-80mm-thermal-queue-token--front-desk-cash-receipt)
7. [Canonical Isolated Iframe Print Engine (`printService.ts`)](#7-canonical-isolated-iframe-print-engine-printservicets)

---

## 1. Print Architecture & Technical Principles

Printing in Indian hospitals encompasses diverse hardware profiles: laser printers for formal A4 discharge bills, dot-matrix printers for multi-part pathology worksheets, and high-speed POS thermal receipt printers at billing desks.

To eliminate browser layout bleed, scrollbar clipping, and cross-platform formatting variations:

1. **Isolated Hidden `<iframe>` Generation:** All printing executes through an off-screen iframe (`rx-isolated-print-iframe`). Direct `window.print()` on active React pages is strictly prohibited, as it risks printing background navigation drawers, patient banners, and scrollbar thumbs.
2. **Exact `@page` CSS Rules:** Every document explicitly declares its physical sheet dimensions (`size: A4 portrait`, `size: A4 landscape`, or `size: 80mm auto`), zeroing outer browser default headers and footers (`margin: 0` reset).
3. **High-Fidelity Color Reproduction:** Enforces `-webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;` so that medical badges, triage borders, and table header backgrounds reproduce with 100% fidelity on color laser and PDF printers.
4. **Repeated Table Headers on Multi-Page Documents:** Large multi-day fluid charts and itemized pharmacy bills implement `thead { display: table-header-group; }` and `tr { page-break-inside: avoid; }` to ensure headers repeat cleanly on page splits.

---

## 2. Template 1: A4 Outpatient (OPD) Prescription & Encounter Slip

- **Identifier:** `TEMPLATE_OPD_PRESCRIPTION`
- **Physical Sheet:** Standard A4 Portrait (`210mm × 297mm`)
- **Page Margin:** `@page { size: A4 portrait; margin: 10mm 14mm; }`
- **Target Audience:** Patient, Retail Chemist, Diagnostic Center, ABDM Health Locker

### HTML & CSS Layout Blueprint
```html
<div class="print-prescription-root">
  <!-- Hospital Letterhead -->
  <header class="rx-header">
    <div class="header-left">
      <div class="hospital-brand-badge">BS</div>
      <div>
        <h1 class="hospital-title">BRIGHT SOLUTIONS HOSPITAL</h1>
        <p class="hospital-sub">Multispeciality Clinical Hospital & Research Center</p>
        <p class="hospital-address">Greams Road, Thousand Lights, Chennai 600006 • Tel: +91 44 2829 0000 • ABDM ID: IN33004812</p>
      </div>
    </div>
    <div class="header-right">
      <span class="nabh-tag">NABH ACCREDITED OPD</span>
      <p class="doctor-name">{{doctor.fullName}}</p>
      <p class="doctor-creds">{{doctor.qualification}} • Reg: {{doctor.regNumber}}</p>
      <p class="doctor-cabin">Cabin {{doctor.cabinNumber}} • {{doctor.department}}</p>
    </div>
  </header>

  <!-- Patient Encounter Strip -->
  <section class="rx-patient-strip">
    <div class="strip-col"><span>Patient Name:</span> <strong>{{patient.fullName}}</strong></div>
    <div class="strip-col"><span>Master UHID:</span> <strong>{{patient.uhid}}</strong></div>
    <div class="strip-col"><span>Encounter No:</span> <strong>{{encounter.opdNumber}}</strong></div>
    <div class="strip-col"><span>Token #:</span> <strong>Token {{encounter.tokenNumber}}</strong></div>
    <div class="strip-col"><span>Age / Gender:</span> <strong>{{patient.age}}y / {{patient.gender}}</strong></div>
    <div class="strip-col"><span>Date & Time:</span> <strong>{{encounter.timestamp}}</strong></div>
    <div class="strip-col"><span>Referred By:</span> <strong>{{patient.referredBy}}</strong></div>
    <div class="strip-col"><span>Billing Scheme:</span> <strong>{{patient.billingScheme}}</strong></div>
  </section>

  <!-- Recorded Vitals Bar -->
  <section class="rx-vitals-bar">
    <strong>Vitals Recorded:</strong>
    <span>BP: {{vitals.bp}} mmHg</span> •
    <span>Pulse: {{vitals.pulse}} bpm</span> •
    <span>SpO2: {{vitals.spo2}}%</span> •
    <span>Temp: {{vitals.temp}}°F</span> •
    <span>BMI: {{vitals.bmi}} kg/m²</span>
  </section>

  <!-- Diagnoses Section (Mandatory ICD-10) -->
  <section class="rx-diagnosis-block">
    <div class="section-label">DIAGNOSIS (ICD-10 INDIA EDITION): <small>NABH MANDATORY FIELD</small></div>
    <div class="icd-tags">
      <span class="icd-pill primary">Primary: [{{primaryIcd.code}}] {{primaryIcd.title}}</span>
      {{#each secondaryIcds}}
      <span class="icd-pill secondary">Secondary: [{{this.code}}] {{this.title}}</span>
      {{/each}}
    </div>
  </section>

  <!-- Prescribed Medications Table -->
  <section class="rx-medications-table">
    <div class="rx-symbol">Rx <span>PRESCRIBED MEDICATIONS</span></div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Medication Name & Strength</th>
          <th>Frequency</th>
          <th>Duration</th>
          <th>Timing & Clinical Instructions</th>
        </tr>
      </thead>
      <tbody>
        {{#each prescriptions}}
        <tr>
          <td>{{@index + 1}}</td>
          <td>
            <strong>{{this.drugName}}</strong><br />
            <small>Route: {{this.route}} • Qty: {{this.quantityTabs}} Tabs</small>
          </td>
          <td class="tabular-nums">{{this.frequency}}</td>
          <td class="tabular-nums">{{this.durationDays}}d</td>
          <td>
            <strong>{{this.mealTiming}}</strong><br />
            <small>{{this.instructions}}</small>
          </td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </section>

  <!-- Diagnostic Investigations Ordered -->
  {{#if labOrders.length}}
  <section class="rx-lab-orders">
    <div class="section-label">DIAGNOSTIC & LABORATORY INVESTIGATIONS ORDERED:</div>
    <ul>
      {{#each labOrders}}
      <li><strong>{{this.testName}}</strong> ({{this.urgency}}) — {{this.clinicalInstructions}}</li>
      {{/each}}
    </ul>
  </section>
  {{/if}}

  <!-- Clinical Advice & Follow-Up -->
  <section class="rx-advice-block">
    <div class="section-label">CLINICAL ADVICE & DIETARY GUIDELINES:</div>
    <p>{{consultation.clinicalAdvice}}</p>
    <div class="rx-followup">
      📅 <strong>Follow-up Review: {{consultation.followUpDays}} Days</strong> • Review with test reports.
    </div>
  </section>

  <!-- Digital Signature & Medico-Legal Disclaimer -->
  <footer class="rx-footer">
    <div class="disclaimer">
      <p>* Digitally signed in compliance with EHR Standards for India & IT Act 2000.</p>
      <p>* Valid for 15 days from issue date. Substitute drugs only per statutory formulary.</p>
    </div>
    <div class="signature-box">
      <div class="doctor-signature-text">{{doctor.fullName}}</div>
      <p><strong>{{doctor.fullName}}</strong></p>
      <p>Reg: {{doctor.regNumber}} • Medical Officer</p>
    </div>
  </footer>
</div>
```

---

## 3. Template 2: Form 8 & 9 Inpatient Face Sheet & Admission Consent

- **Identifier:** `TEMPLATE_IPD_FACE_SHEET`
- **Physical Sheet:** Standard A4 Portrait (`210mm × 297mm`)
- **Page Margin:** `@page { size: A4 portrait; margin: 12mm 15mm; }`
- **Client Reference:** Forms 8 & 9 from `IPD Book 6 Days.pdf`
- **Medico-Legal Status:** This is the primary legal consent document. The HTML output must be fully self-contained and comply with EHR Standards for India (MoHFW) and IT Act 2000 §5 digital signature requirements.

### HTML & CSS Layout Blueprint

```html
<div class="ipd-face-sheet-root">

  <!-- ===== HOSPITAL LETTERHEAD (matches OPD Rx header) ===== -->
  <header class="face-sheet-header">
    <div class="header-brand">
      <div class="brand-badge">BS</div>
      <div>
        <h1 class="hospital-title">BRIGHT SOLUTIONS HOSPITAL</h1>
        <p class="hospital-sub">Multispeciality Clinical Hospital & Research Center</p>
        <p class="hospital-addr">Greams Road, Thousand Lights, Chennai 600006 • Tel: +91 44 2829 0000</p>
      </div>
    </div>
    <div class="header-right">
      <span class="nabh-tag">NABH ACCREDITED IPD</span>
      <p class="form-title-label">INPATIENT ADMISSION RECORD</p>
      <p class="form-ids">Forms 8 & 9 — Face Sheet & General Consent</p>
    </div>
  </header>

  <!-- ===== SECTION A: ADMISSION IDENTIFIERS (2-column grid) ===== -->
  <section class="fs-section">
    <div class="fs-section-title">A. ADMISSION IDENTIFIERS</div>
    <div class="fs-grid-2col">
      <div class="fs-field">
        <span class="fs-label">IPD Admission Number</span>
        <span class="fs-value">{{admission.ipdNumber}}</span>
      </div>
      <div class="fs-field">
        <span class="fs-label">Master UHID</span>
        <span class="fs-value">{{patient.uhid}}</span>
      </div>
      <div class="fs-field">
        <span class="fs-label">Admission Date & Time</span>
        <span class="fs-value">{{admission.admittedAt}}</span>
      </div>
      <div class="fs-field">
        <span class="fs-label">Ward / Room / Bed</span>
        <span class="fs-value">{{admission.wardName}} / {{admission.roomNumber}} / {{admission.bedNumber}}</span>
      </div>
      <div class="fs-field">
        <span class="fs-label">Attending Consultant</span>
        <span class="fs-value">{{admission.doctorName}} ({{admission.doctorReg}})</span>
      </div>
      <div class="fs-field">
        <span class="fs-label">Admitting Department</span>
        <span class="fs-value">{{admission.department}}</span>
      </div>
      <div class="fs-field fs-field--full">
        <span class="fs-label">Provisional Diagnosis</span>
        <span class="fs-value">{{admission.provisionalDiagnosis}}</span>
      </div>
    </div>
  </section>

  <!-- ===== SECTION B: PATIENT DEMOGRAPHICS (2-column grid) ===== -->
  <section class="fs-section">
    <div class="fs-section-title">B. PATIENT DEMOGRAPHICS</div>
    <div class="fs-grid-2col">
      <div class="fs-field">
        <span class="fs-label">Full Name</span>
        <span class="fs-value">{{patient.fullName}}</span>
      </div>
      <div class="fs-field">
        <span class="fs-label">Age / Gender / Blood Group</span>
        <span class="fs-value">{{patient.age}}y / {{patient.gender}} / {{patient.bloodGroup}}</span>
      </div>
      <div class="fs-field">
        <span class="fs-label">Phone Number</span>
        <span class="fs-value">{{patient.phone}}</span>
      </div>
      <div class="fs-field">
        <span class="fs-label">Address</span>
        <span class="fs-value">{{patient.address}}</span>
      </div>
    </div>
  </section>

  <!-- ===== SECTION C: NEXT OF KIN / GUARDIAN ===== -->
  <section class="fs-section">
    <div class="fs-section-title">C. NEXT OF KIN / GUARDIAN (Emergency Contact)</div>
    <div class="fs-grid-2col">
      <div class="fs-field">
        <span class="fs-label">Guardian Name</span>
        <span class="fs-value">{{guardian.name}}</span>
      </div>
      <div class="fs-field">
        <span class="fs-label">Relationship to Patient</span>
        <span class="fs-value">{{guardian.relationship}}</span>
      </div>
      <div class="fs-field">
        <span class="fs-label">Emergency Mobile</span>
        <span class="fs-value">{{guardian.phone}}</span>
      </div>
      <div class="fs-field">
        <span class="fs-label">Permanent Address</span>
        <span class="fs-value">{{guardian.address}}</span>
      </div>
    </div>
  </section>

  <!-- ===== SECTION D: MEDICO-LEGAL CASE (MLC) STATUS ===== -->
  <section class="fs-section fs-section--mlc">
    <div class="fs-section-title">D. MEDICO-LEGAL CASE (MLC) STATUS</div>
    <div class="fs-mlc-row">
      <label class="fs-checkbox-label">
        <span class="fs-checkbox">{{admission.isMlc ? '☑' : '☐'}}</span>
        <strong>Medico-Legal Case (MLC)</strong>
      </label>
      <label class="fs-checkbox-label">
        <span class="fs-checkbox">{{!admission.isMlc ? '☑' : '☐'}}</span>
        <strong>Non-MLC (Routine Admission)</strong>
      </label>
    </div>
    {{#if admission.isMlc}}
    <div class="fs-grid-2col fs-mlc-details">
      <div class="fs-field">
        <span class="fs-label">Police Station</span>
        <span class="fs-value">{{admission.mlcPoliceStation}}</span>
      </div>
      <div class="fs-field">
        <span class="fs-label">Constable Name / Badge #</span>
        <span class="fs-value">{{admission.mlcConstableName}} / {{admission.mlcBadgeNumber}}</span>
      </div>
      <div class="fs-field fs-field--full">
        <span class="fs-label">MLC Incident Details</span>
        <span class="fs-value">{{admission.mlcDetails}}</span>
      </div>
    </div>
    {{/if}}
  </section>

  <!-- ===== SECTION E: BILLING & INSURANCE CATEGORY ===== -->
  <section class="fs-section">
    <div class="fs-section-title">E. BILLING & INSURANCE CATEGORY</div>
    <div class="fs-grid-2col">
      <div class="fs-field">
        <span class="fs-label">Payment Scheme</span>
        <span class="fs-value">{{admission.paymentCategory === 'TPA_INSURANCE' ? '☑ Cashless TPA / Insurance' : '☑ Direct Cash / Self-Pay'}}</span>
      </div>
      <div class="fs-field">
        <span class="fs-label">TPA / Insurance Company</span>
        <span class="fs-value">{{admission.tpaProvider || 'N/A'}}</span>
      </div>
      <div class="fs-field">
        <span class="fs-label">Policy / Claim Number</span>
        <span class="fs-value">{{admission.tpaPolicyNumber || 'N/A'}}</span>
      </div>
      <div class="fs-field">
        <span class="fs-label">Initial Advance Paid</span>
        <span class="fs-value tabular-nums">₹ {{admission.advanceAmount}}</span>
      </div>
    </div>
  </section>

  <!-- ===== SECTION F: STATUTORY CONSENT CLAUSES (Forms 8 & 9) ===== -->
  <section class="fs-section fs-consent-block">
    <div class="fs-section-title">F. PATIENT / GUARDIAN CONSENT DECLARATION (NABH Mandatory — IT Act 2000 §5)</div>
    <p class="fs-consent-text">
      I, the undersigned patient or authorized guardian, hereby voluntarily give full and informed consent
      to the physicians, surgeons, nurses, anaesthetists, and all medical and allied health staff of
      <strong>Bright Solutions Hospital</strong> to administer clinical examinations, medical treatment,
      diagnostic and laboratory investigations, intravenous infusions, blood transfusions, nursing care,
      and all medically necessary procedures during this admission. I understand that no guarantee of
      specific outcomes has been made to me, and that treatment carries inherent medical risk.
    </p>
    <p class="fs-consent-text fs-consent-highisk">
      <strong>HIGH-RISK SURGICAL / ANAESTHESIA ACKNOWLEDGMENT (Form 9):</strong>
      I further acknowledge that if my condition requires surgical intervention, the attending surgeon and
      anaesthetist have explained the nature of the procedure, associated anaesthetic risks, and
      alternatives to the extent possible given my clinical condition.
    </p>
  </section>

  <!-- ===== SECTION G: TRIPLE SIGNATURE ENDORSEMENT BOX ===== -->
  <section class="fs-signature-strip">
    <div class="fs-sig-box">
      <div class="fs-sig-line">{{#if admission.consentSignedAt}}Signed Digitally at {{admission.consentSignedAt}}{{/if}}</div>
      <div class="fs-sig-role">Patient / Guardian Signature</div>
      <div class="fs-sig-name">{{guardian.name}} ({{guardian.relationship}})</div>
    </div>
    <div class="fs-sig-box">
      <div class="fs-sig-line"></div>
      <div class="fs-sig-role">Admitting Medical Officer</div>
      <div class="fs-sig-name">{{admission.doctorName}}<br/>Reg: {{admission.doctorReg}}</div>
    </div>
    <div class="fs-sig-box">
      <div class="fs-sig-line"></div>
      <div class="fs-sig-role">Reception / Admission Desk</div>
      <div class="fs-sig-name">Counter Officer: {{admission.admittedByStaff}}</div>
    </div>
  </section>

  <!-- ===== FOOTER: LEGAL DISCLAIMER ===== -->
  <footer class="fs-footer">
    <p>* Digitally signed under EHR Standards for India (MoHFW Notification) & IT Act 2000 §5 (Electronic Records). Record generated by Bright Solutions Hospital Information System.</p>
    <p>* Original to be retained in Medical Records Department. Duplicate to be provided to patient / guardian.</p>
  </footer>

</div>
```

### CSS Specification for Form 8 & 9

```css
/* Applied inside printService.ts iframe — Template: TEMPLATE_IPD_FACE_SHEET */
.ipd-face-sheet-root {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 10.5px;
  color: #0f172a;
  line-height: 1.45;
}

.face-sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid #0077b6;
  padding-bottom: 6px;
  margin-bottom: 8px;
}

.brand-badge {
  width: 32px; height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #0077b6, #023e8a);
  color: #ffffff;
  font-weight: 900;
  font-size: 13px;
  display: flex; align-items: center; justify-content: center;
  margin-right: 8px;
  flex-shrink: 0;
}

.header-brand { display: flex; align-items: flex-start; }

.hospital-title { font-size: 13px; font-weight: 800; margin: 0; color: #0077b6; }
.hospital-sub   { font-size: 9px; margin: 2px 0 0; color: #475569; }
.hospital-addr  { font-size: 8.5px; margin: 1px 0 0; color: #64748b; }

.nabh-tag {
  background: #0077b6; color: #fff;
  font-size: 7.5px; font-weight: 700; letter-spacing: 0.05em;
  padding: 2px 5px; border-radius: 4px;
  display: block; text-align: right; margin-bottom: 4px;
}
.form-title-label { font-size: 11px; font-weight: 800; text-align: right; margin: 0; }
.form-ids         { font-size: 9px; text-align: right; margin: 1px 0 0; color: #475569; }

/* ===== SECTION BLOCKS ===== */
.fs-section {
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  margin-bottom: 6px;
  page-break-inside: avoid;
}

.fs-section--mlc { border-color: #fca5a5; }

.fs-section-title {
  background: #f1f5f9;
  padding: 3px 8px;
  font-size: 8.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #0f172a;
  border-bottom: 1px solid #e2e8f0;
}

/* ===== 2-COLUMN FIELD GRID ===== */
.fs-grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

.fs-field {
  padding: 4px 8px;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

.fs-field:nth-child(even) { border-right: none; }
.fs-field:last-child       { border-bottom: none; }

.fs-field--full {
  grid-column: 1 / -1;
  border-right: none;
}

.fs-label {
  display: block;
  font-size: 8px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 1px;
}

.fs-value {
  font-size: 10px;
  font-weight: 600;
  color: #0f172a;
}

/* ===== MLC ROW ===== */
.fs-mlc-row {
  display: flex;
  gap: 24px;
  padding: 6px 8px;
}
.fs-checkbox-label { display: flex; align-items: center; gap: 4px; font-size: 10px; }
.fs-checkbox       { font-size: 12px; }

/* ===== CONSENT BLOCK ===== */
.fs-consent-block { border-top: 2px solid #0f172a; }
.fs-consent-text  { padding: 5px 8px; font-size: 9.5px; line-height: 1.55; margin: 0; }
.fs-consent-highisk { background: #fef3c7; border-top: 1px solid #fde68a; }

/* ===== SIGNATURE STRIP (3-column) ===== */
.fs-signature-strip {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  border: 1px solid #0f172a;
  border-radius: 4px;
  margin-bottom: 6px;
  page-break-inside: avoid;
}

.fs-sig-box {
  padding: 6px 8px;
  border-right: 1px solid #0f172a;
  min-height: 50px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.fs-sig-box:last-child { border-right: none; }

.fs-sig-line {
  border-top: 1px solid #0f172a;
  padding-top: 3px;
  font-size: 8px;
  color: #64748b;
  min-height: 22px;
  display: flex;
  align-items: flex-end;
}

.fs-sig-role { font-size: 8px; font-weight: 700; margin-top: 3px; color: #0f172a; }
.fs-sig-name { font-size: 9px; color: #475569; margin-top: 1px; }

/* ===== FOOTER ===== */
.fs-footer {
  border-top: 1px solid #e2e8f0;
  padding-top: 4px;
  font-size: 8px;
  color: #64748b;
  line-height: 1.4;
}
.fs-footer p { margin: 1px 0; }
```

---

## 4. Template 3: Form 61 Daily 24h Fluid Intake & Output Balance Sheet (Landscape)

- **Identifier:** `TEMPLATE_IPD_FLUID_BALANCE`
- **Physical Sheet:** Standard A4 Landscape (`297mm × 210mm`)
- **Page Margin:** `@page { size: A4 landscape; margin: 8mm 10mm; }`
- **Client Reference:** Form 61 from `IPD Book 6 Days.pdf`

### Table Column Blueprint
```
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| BRIGHT SOLUTIONS HOSPITAL • DAILY 24-HOUR INTAKE & OUTPUT CHART (FORM 61)                                                                                   |
| Patient Name: Ananya Sharma (52F) • UHID: BS-2026-00142 • Bed: Semi-Private 201 • Day 2 of 6 Days • Date: 27 Oct 2026 • Fluid Restriction: 1,500 mL/day     |
+-------+---------+-----------------------------------+-----------------------------------------+------------------------------------+------------------------+
| TIME  | SHIFT   | INTAKE: ORAL / NG TUBE            | INTAKE: INTRAVENOUS FLUIDS              | OUTPUT: URINE & DRAINS             | FLUID BALANCE          |
| (HRS) |         | Fluid Type / Diet       | Amount  | IV Fluid Description       | Amount mL  | Urine mL | Drain 1 mL | Vomit mL   | Hourly Net | Cumul. Net|
+-------+---------+-------------------------+---------+----------------------------+------------+----------+------------+------------+------------+-----------+
| 06:00 | MORNING | Water                   | 100 mL  | Normal Saline 0.9% @ 80ml/h| 80 mL      | 250 mL   | 0 mL       | 0 mL       | -70 mL     | -70 mL    |
| 08:00 | MORNING | Tea & Toast             | 150 mL  | Normal Saline 0.9% @ 80ml/h| 160 mL     | 200 mL   | 0 mL       | 0 mL       | +110 mL    | +40 mL    |
| 10:00 | MORNING | Tender Coconut Water    | 200 mL  | Normal Saline 0.9% @ 80ml/h| 160 mL     | 180 mL   | 0 mL       | 0 mL       | +180 mL    | +220 mL   |
| 12:00 | MORNING | Dal Soup & Rice         | 200 mL  | Normal Saline 0.9% @ 80ml/h| 160 mL     | 220 mL   | 0 mL       | 0 mL       | +140 mL    | +360 mL   |
| 14:00 | MORNING | Water                   | 100 mL  | Normal Saline 0.9% @ 80ml/h| 160 mL     | 150 mL   | 0 mL       | 0 mL       | +110 mL    | +470 mL   |
+-------+---------+-------------------------+---------+----------------------------+------------+----------+------------+------------+------------+-----------+
| MORNING SHIFT TOTAL (06:00 - 14:00)       | 750 mL  | IV TOTAL:                  | 720 mL     | 1000 mL  | 0 mL       | 0 mL       | SHIFT NET: | +470 mL   |
+-------+---------+-------------------------+---------+----------------------------+------------+----------+------------+------------+------------+-----------+
| 18:00 | EVENING | Water & Fruit Juice     | 250 mL  | DNS 5% @ 50 mL/hr          | 200 mL     | 300 mL   | 0 mL       | 0 mL       | +150 mL    | +620 mL   |
| 22:00 | EVENING | Warm Milk               | 150 mL  | DNS 5% @ 50 mL/hr          | 200 mL     | 200 mL   | 0 mL       | 0 mL       | +150 mL    | +770 mL   |
+-------+---------+-------------------------+---------+----------------------------+------------+----------+------------+------------+------------+-----------+
| EVENING SHIFT TOTAL (14:00 - 22:00)       | 400 mL  | IV TOTAL:                  | 400 mL     | 500 mL   | 0 mL       | 0 mL       | SHIFT NET: | +300 mL   |
+-------+---------+-------------------------+---------+----------------------------+------------+----------+------------+------------+------------+-----------+
| NIGHT SHIFT TOTAL (22:00 - 06:00)         | 100 mL  | IV TOTAL:                  | 200 mL     | 400 mL   | 0 mL       | 0 mL       | SHIFT NET: | -100 mL   |
+=============================================================================================================================================================+
| 24-HOUR CUMULATIVE INTAKE: 2,570 mL (Oral: 1,250 mL + IV: 1,320 mL)  |  24-HOUR CUMULATIVE OUTPUT: 1,900 mL (Urine: 1,900 mL)  |  FINAL 24h NET: +670 mL   |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Nurse In-Charge: S. Ramani, RN (Staff Nurse Signature)                       Consultant Review: Dr. Kiran Patel, MD (Attending Physician Signature)         |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

---

## 5. Template 4: Consolidated 10-Head Inpatient Discharge Bill (IRDAI/NABH)

- **Identifier:** `TEMPLATE_IPD_10HEAD_BILL`
- **Physical Sheet:** Standard A4 Portrait (`210mm × 297mm`)
- **Page Margin:** `@page { size: A4 portrait; margin: 10mm 12mm; }`
- **Regulatory Standard:** IRDAI Uniform Health Insurance Invoice & NABH Financial Disclosure Standard

### 10-Head Breakdown Specification

| Head # | Category Description | Included Service Codes | Calculation Basis |
|:---|:---|:---|:---|
| **Head 1** | Room, Bed & Boarding Charges | Semi-Private Bed 201 (2 Days @ ₹2,500/day) | `bed_tariff × total_days` |
| **Head 2** | Nursing Care & RMO Routine Services | Ward Nursing Care (2 Days @ ₹600/day) | Daily flat tariff |
| **Head 3** | Medical Officer / Consultant Visits | Dr. Kiran Patel Daily Inpatient Rounds (2 visits) | Itemized visit tariff |
| **Head 4** | Diagnostic & Pathology Investigations | Lipid Profile, Complete Blood Count, 12-Lead ECG | Itemized lab master rates |
| **Head 5** | Pharmacy Drugs & Infusion Solutions | Telmisartan, Inj Labetalol, Normal Saline 500ml | Itemized dispensary billing |
| **Head 6** | Medical Oxygen Therapy | Oxygen via Nasal Cannula (8 Hours @ ₹150/hr) | Hourly meter billing |
| **Head 7** | Surgical Consumables & Disposable Sundries | IV Cannula, Infusion sets, 5ml Syringes | Itemized inventory |
| **Head 8** | Operation Theatre & Equipment Charges | N/A (Medical Admission) | Procedure schedule |
| **Head 9** | Anaesthesia & Recovery Charges | N/A (Medical Admission) | Specialist tariff |
| **Head 10**| Administrative & Medical Record Fees | Admission processing fee & IPD Folio fee | Flat institutional fee |

### Settlement Ledger Layout
```
+-------------------------------------------------------------------+
| GROSS INPATIENT BILL AMOUNT:                        INR 17,050.00 |
| Less: Hospital Concession / Approved Discount:       -INR  500.00 |
| Taxable Value of Services:                          INR 16,550.00 |
| Add: CGST (2.5%) + SGST (2.5%) on Pharmacy:          +INR  140.00 |
| NET FINAL BILL AMOUNT:                              INR 16,690.00 |
| Less: Initial Advance Deposit (Receipt #REC-00192): -INR 10,000.00 |
| ----------------------------------------------------------------- |
| BALANCE AMOUNT DUE & PAID:                           INR  6,690.00 |
| Payment Mode: UPI (UTR: 9928104812) • Cleared: 27 Oct 2026        |
| ----------------------------------------------------------------- |
| Authorized Cashier Signature               Hospital Seal & Stamp  |
+-------------------------------------------------------------------+
```

---

## 6. Template 5: 80mm Thermal Queue Token & Front-Desk Cash Receipt

- **Identifier:** `TEMPLATE_THERMAL_80MM_TOKEN`
- **Physical Sheet:** Continuous 80mm POS Thermal Roll (`80mm × auto`)
- **Page Margin:** `@page { size: 80mm auto; margin: 2mm 3mm; }`
- **Font:** Monospace (`font-family: monospace, "Courier New", sans-serif; font-size: 10px;`)

### Visual Blueprint
```
========================================
       BRIGHT SOLUTIONS HOSPITAL        
  Multispeciality Clinical Hospital     
       Greams Road, Chennai 600006      
          Tel: +91 44 2829 0000         
========================================
OPD TOKEN RECEIPT & CONSULTATION PASS   
Date: 27-Oct-2026           Time: 09:15 AM
Receipt No: REC-2026-00812
----------------------------------------

              TOKEN NUMBER              

                 #142                   

           CABIN 01 (ROOM 104)          
           DR. KIRAN PATEL, MD          
        GENERAL & INTERNAL MEDICINE     

----------------------------------------
Patient:  Ananya Sharma (52y / Female)
UHID:     BS-2026-00142
Encounter:OPD-26-88142
Type:     New Registration (Domestic)
----------------------------------------
Consultation Fee:             INR 500.00
Amount Paid:                  INR 500.00
Payment Mode:                 CASH
Cashier ID:                   USR-REC-01
----------------------------------------
            [ QR CODE HERE ]            
   Scan to check live waiting queue     
   or watch Waiting Lounge LED Screen   
----------------------------------------
* Please wait in the waiting lounge.    
* Your token will be announced on the   
  display screen when cabin is ready.   
* Token valid for today only.           
========================================
```

---

## 7. Canonical Isolated Iframe Print Engine (`printService.ts`)

The production implementation used across all pages to guarantee zero site UI bleed and zero scrollbars:

```typescript
export interface PrintOptions {
  templateId: 'OPD_RX' | 'IPD_FACE_SHEET' | 'IPD_FLUID_CHART' | 'IPD_10HEAD_BILL' | 'THERMAL_TOKEN';
  htmlContent: string;
  documentTitle: string;
}

export function printDocument({ templateId, htmlContent, documentTitle }: PrintOptions): void {
  // 1. Recycle or create isolated hidden iframe
  const frameId = 'rx-isolated-print-iframe';
  let printFrame = document.getElementById(frameId) as HTMLIFrameElement | null;
  
  if (!printFrame) {
    printFrame = document.createElement('iframe');
    printFrame.id = frameId;
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    printFrame.style.visibility = 'hidden';
    document.body.appendChild(printFrame);
  }

  const frameDoc = printFrame.contentWindow?.document;
  if (!frameDoc) return;

  // 2. Select document-specific @page geometry
  let pageSizeCss = 'A4 portrait';
  let pageMarginCss = '10mm 14mm';
  let fontFamily = 'system-ui, -apple-system, sans-serif';
  let fontSize = '11px';

  if (templateId === 'IPD_FLUID_CHART') {
    pageSizeCss = 'A4 landscape';
    pageMarginCss = '8mm 10mm';
  } else if (templateId === 'THERMAL_TOKEN') {
    pageSizeCss = '80mm auto';
    pageMarginCss = '2mm 3mm';
    fontFamily = 'monospace, "Courier New", sans-serif';
    fontSize = '10px';
  }

  // 3. Construct self-contained document
  frameDoc.open();
  frameDoc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${documentTitle}</title>
      <meta charset="utf-8" />
      <style>
        @page {
          size: ${pageSizeCss};
          margin: ${pageMarginCss};
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #0f172a !important;
          font-family: ${fontFamily};
          font-size: ${fontSize};
          line-height: 1.45;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          page-break-inside: auto;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        thead {
          display: table-header-group;
        }
        th, td {
          text-align: left;
        }
        /* Completely eliminate browser scrollbars in output */
        ::-webkit-scrollbar {
          display: none !important;
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `);
  frameDoc.close();

  // 4. Trigger print using onload event (primary) with deadline fallback
  // Rationale: setTimeout(250) was fragile on older hospital PCs with slow
  // iframe layout for large landscape tables (Form 61, MAR sheets).
  // onload fires after the iframe document is fully parsed and laid out.
  let hasPrinted = false;

  const doPrint = () => {
    if (hasPrinted) return;
    hasPrinted = true;
    try {
      printFrame?.contentWindow?.focus();
      printFrame?.contentWindow?.print();
    } catch (e) {
      console.error('Iframe print failure:', e);
    }
  };

  // Primary: fire on iframe load event
  if (printFrame.contentWindow) {
    printFrame.onload = () => {
      // Small post-render stabilisation buffer (browser needs 1 paint cycle)
      setTimeout(doPrint, 50);
    };
  }

  // Fallback: some browsers skip onload after document.write();
  // deadline at 800ms guarantees print is attempted regardless.
  setTimeout(doPrint, 800);
}
```
