# D20 — Medico-Legal Print Template Specifications
## Bright Solutions: Clinical Hospital Operating System

> **Document ID:** D20  
> **Version:** 1.0  
> **Status:** APPROVED FRONTEND ARCHITECTURE SPECIFICATION  
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

### Layout Specification
1. **Hospital Banner:** Header with registration credentials and NABH IPD Accreditation seal.
2. **Admission Demographics Table:**
   - IPD Admission Number (`IPD-2026-00891`) & Master UHID (`BS-2026-00142`).
   - Admission Date & Time (e.g. `26 Oct 2026, 11:30 AM`).
   - Ward Name, Room Number & Bed Number (e.g. `Semi-Private Ward, Room 201, Bed 201`).
   - Attending Consultant Doctor & Department.
3. **Medico-Legal Status (MLC) Section:**
   - MLC Checkbox: `[ ] Non-MLC` | `[x] Medico-Legal Case (MLC)`.
   - MLC Details: Police Station, Police Constable Name/Buckle #, Incident Details (if MLC).
4. **Next of Kin / Guardian Information:**
   - Name of Guardian, Relationship to Patient, Permanent Address, Emergency Mobile Phone.
5. **Billing & Insurance Category:**
   - Scheme: `[x] Cashless TPA / Corporate Insurance` | `[ ] Direct Cash / Self-Pay`.
   - TPA Name: Star Health Comprehensive, Claim ID: `SH-POL-992819`, Initial Pre-Auth: `₹ 25,000.00`.
6. **Statutory Consent Clause (Forms 8 & 9):**
   - *"I, the undersigned patient / guardian, hereby give voluntary consent to the doctors, nurses, and medical authorities of Bright Solutions Hospital to administer clinical examinations, medical treatment, diagnostic procedures, intravenous infusions, and nursing care..."*
   - Surgical & Anaesthesia High-Risk Acknowledgment Clause.
7. **Signature Endorsement Box:**
   - Left: Patient / Guardian Signature with date & relationship.
   - Center: Admitting Medical Officer Signature with registration seal.
   - Right: Receptionist / Admission Desk Officer Signature.

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

  // 4. Trigger print after layout calculation
  setTimeout(() => {
    try {
      printFrame?.contentWindow?.focus();
      printFrame?.contentWindow?.print();
    } catch (e) {
      console.error('Iframe print failure:', e);
    }
  }, 250);
}
```
