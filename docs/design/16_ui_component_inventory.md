# D16 — UI Component Inventory & Design System Catalog
## Bright Solutions: Clinical Hospital Operating System

> **Document ID:** D16  
> **Version:** 1.1 (Audit-Revised)  
> **Status:** APPROVED FRONTEND ARCHITECTURE SPECIFICATION  
> **Revision Notes:** v1.1: DEFECT-05 fixed — removed invalid `duration` top-level SOAP field; replaced with `chiefComplaintDuration` with D04 column mapping
> **Depends On:** [01_PRD.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/01_PRD.md), [02_feature_spec.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/02_feature_spec.md), [04_data_model_spec.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/04_data_model_spec.md), [13_rbac_permission_matrix.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/13_rbac_permission_matrix.md), [15_page_route_map.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/15_page_route_map.md)  
> **Prepared By:** Bright Solutions Frontend Engineering Team  
> **Last Updated:** October 2026  

---

## Table of Contents

1. [Component Architecture & Technical Guardrails](#1-component-architecture--technical-guardrails)
2. [Atoms (Base Primitives)](#2-atoms-base-primitives)
   - 2.1 [Badge & StatusPill](#21-badge--statuspill)
   - 2.2 [SquircleAvatar](#22-squircleavatar)
   - 2.3 [TabularValue](#23-tabularvalue)
   - 2.4 [ClinicalInput & ClinicalSelect](#24-clinicalinput--clinicalselect)
   - 2.5 [TokenTag](#25-tokentag)
3. [Molecules (Clinical Compounds)](#3-molecules-clinical-compounds)
   - 3.1 [VitalsTelemetryStrip](#31-vitalstelemetrystrip)
   - 3.2 [DdiCollisionBanner (Deterministic CDSS)](#32-ddicollisionbanner-deterministic-cdss)
   - 3.3 [News2ScoreCard](#33-news2scorecard)
   - 3.4 [MarTimeSlotCell (Form 29)](#34-martimeslotcell-form-29)
   - 3.5 [FluidBalanceTally (Form 61)](#35-fluidbalancetally-form-61)
   - 3.6 [PatientQueueCard](#36-patientqueuecard)
   - 3.7 [BedOccupancyCard](#37-bedoccupancycard)
   - 3.8 [PainScaleSelector](#38-painscaleselector)
4. [Organisms (Complex Clinical Folios)](#4-organisms-complex-clinical-folios)
   - 4.1 [ActivePatientBanner](#41-activepatientbanner)
   - 4.2 [SoapConsultationPad](#42-soapconsultationpad)
   - 4.3 [PrescriptionPadTable](#43-prescriptionpadtable)
   - 4.4 [InpatientMarGrid (Form 29 Treatment Sheet)](#44-inpatientmargrid-form-29-treatment-sheet)
   - 4.5 [IntakeOutputLedger (Form 61 Fluid Chart)](#45-intakeoutputledger-form-61-fluid-chart)
   - 4.6 [NurseShiftLogEditor (Form 72 Shift Notes)](#46-nurseshiftlogeditor-form-72-shift-notes)
   - 4.7 [IpdDischargeBillTable (10-Head Ledger)](#47-ipddischargebilltable-10-head-ledger)
   - 4.8 [WaitingRoomDisplayBoard](#48-waitingroomdisplayboard)
5. [State, Loading Skeletons & Error Boundaries](#5-state-loading-skeletons--error-boundaries)

---

## 1. Component Architecture & Technical Guardrails

Bright Solutions UI components follow an Atomic Design taxonomy strictly tailored for hospital safety and performance:

1. **Strict Zero-AI Boundary:** In compliance with Cycle 1 architectural specifications, no component contains ambient audio recorders, speech-to-text microphones, generative AI prompts, or non-deterministic LLM calls. All clinical validation, score calculations (NEWS2, BMI), and narrative summaries are powered by deterministic relational rules, string interpolation templates, and backend REST payloads.
2. **Tabular Numerics Everywhere:** Every vital sign, token index, dosage amount, bed tariff, and INR financial total is wrapped in `tabular-nums` typography to guarantee character alignment across high-density tables.
3. **Hard Override Gating:** Medico-legal safety components (`DdiCollisionBanner`, `News2ScoreCard`) enforce physical UI blocking: action buttons (`Sign & Lock`, `Administer Dose`) remain strictly disabled until a mandatory clinical reason code is selected or justified in writing.
4. **Zero Layout Shift (CLS = 0):** Asynchronous tables and queue streams implement structured skeleton loaders matching the exact pixel dimensions of populated rows to eliminate jarring layout jumps during clinical consultation.

---

## 2. Atoms (Base Primitives)

### 2.1 Badge & StatusPill
High-contrast inline semantic status indicators with border outlines and solid backgrounds.

```typescript
export interface BadgeProps {
  variant: 
    | 'emergency'    // Red #dc2626 (Triage Red, NEWS2 >= 7, Lethal DDI)
    | 'urgent'       // Amber #d97706 (Triage Yellow, NEWS2 5-6, Caution DDI)
    | 'priority'     // Blue #2563eb (Triage Green, Active in Consultation)
    | 'routine'      // Teal #0d9488 (Completed, Normal Ranges)
    | 'neutral'      // Slate #64748b (Draft, Waiting)
    | 'followup';    // Purple #7e22ce (Repeat visit)
  size?: 'sm' | 'md' | 'lg';
  label: string;
  icon?: React.ReactNode;
  isPill?: boolean; // border-radius: 9999px
}
```

### 2.2 SquircleAvatar
Continuous-corner square avatar with dual-character initials, subtle linear gradient, and drop shadow.

```typescript
export interface SquircleAvatarProps {
  name: string;
  size?: 32 | 40 | 44 | 48 | 56;
  gradient?: 'brand' | 'emergency' | 'warning' | 'neutral';
  badgeStatus?: 'online' | 'offline' | 'consulting';
}
```
- **Initials Computation:** Deterministic extraction of first letter of first name + first letter of last name (e.g. *"Ananya Sharma"* -> `"AS"`).
- **Style:** `border-radius: 28%` (squircle formula), `background: linear-gradient(135deg, #0077b6, #023e8a)`, `color: #ffffff`, `font-weight: 900`.

### 2.3 TabularValue
Numeric rendering wrapper applying `font-variant-numeric: tabular-nums` and monospace alignment.

```typescript
export interface TabularValueProps {
  value: string | number;
  unit?: string;
  currencyPrefix?: '₹';
  abnormalState?: 'high' | 'low' | 'panic' | 'normal';
}
```

### 2.4 ClinicalInput & ClinicalSelect
Form controls engineered for rapid hospital data entry with integrated unit labels and validation states.

```typescript
export interface ClinicalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  unitLabel?: string;      // e.g. "mmHg", "bpm", "°F", "mL/hr"
  error?: string;
  isMandatory?: boolean;
  density?: 'compact' | 'normal';
}
```

### 2.5 TokenTag
High-visibility token identifier tag with distinct background tints for waiting, active chamber, and completed states.

```typescript
export interface TokenTagProps {
  tokenNumber: number | string;
  status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED';
}
```

---

## 3. Molecules (Clinical Compounds)

### 3.1 VitalsTelemetryStrip
Renders a compact horizontal row of clinical vitals with automated abnormal range flags.

```typescript
export interface VitalsTelemetryStripProps {
  vitals: {
    bpSystolic?: number;
    bpDiastolic?: number;
    pulse?: number;
    spo2?: number;
    temperature?: number;
    respRate?: number;
    heightCm?: number;
    weightKg?: number;
  };
  showBmi?: boolean;
  compact?: boolean;
}
```
- **Deterministic Range Highlights:**
  - BP: Systolic >= 140 or Diastolic >= 90 tagged `#b45309` (Amber); Systolic >= 180 tagged `#dc2626` (Red).
  - SpO2: < 95% tagged `#b45309`; < 92% tagged `#dc2626` (Hypoxia Alert).
  - Temperature: >= 100.4°F tagged `#b45309` (Febrile).
  - BMI: Auto-calculated via `weightKg / ((heightCm / 100) ** 2)`.

### 3.2 DdiCollisionBanner (Deterministic CDSS)
Alert organism rendered when two prescribed drugs conflict according to `cdss_ddi_rules`.

```typescript
export interface DdiCollisionBannerProps {
  drugA: string;
  drugB: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MODERATE';
  mechanism: string;
  clinicalEffect: string;
  onOverrideJustification: (reasonCode: string, clinicalNote: string) => void;
  isOverridden: boolean;
}
```
- **Hard Safety Lock:** When `severity === 'CRITICAL'`, renders a red alert box (`#fee2e2`). Disables the consultation sign-off button until the doctor selects an override reason from standard codes (`BENEFIT_OUTWEIGHS_RISK`, `DOSE_SEPARATED`, `MONITORING_VITALS_CLOSELY`) and enters a non-empty rationale.

### 3.3 News2ScoreCard
Calculates and displays the UK National Early Warning Score 2 (NEWS2) from Form 72 nurse vitals.

```typescript
export interface News2ScoreCardProps {
  scores: {
    respirationRateScore: number; // 0-3
    oxygenSaturationScore: number;// 0-3
    supplementalOxygenScore: number; // 0 or 2
    temperatureScore: number;     // 0-3
    systolicBpScore: number;      // 0-3
    heartRateScore: number;       // 0-3
    consciousnessScore: number;   // 0 (Alert) or 3 (CVPU)
  };
  totalScore: number; // Sum 0 to 20
  clinicalRisk: 'LOW' | 'MEDIUM' | 'HIGH'; // Low: 0-4, Med: 5-6, High: >=7
}
```

### 3.4 MarTimeSlotCell (Form 29)
Single medication administration slot for Day 1–6 in the Inpatient Treatment Sheet.

```typescript
export interface MarTimeSlotCellProps {
  scheduleId: string;
  dayIndex: 1 | 2 | 3 | 4 | 5 | 6;
  slotTime: '06:00' | '12:00' | '18:00' | '22:00';
  status: 'SCHEDULED' | 'GIVEN' | 'OMITTED' | 'HELD';
  administeredBy?: string; // Nurse Initials e.g. "SR"
  administeredAt?: string; // "06:14 AM"
  omissionReason?: string; // "NPO for Ultrasound"
  onAdminister: () => void;
  onOmit: (reason: string) => void;
}
```

### 3.5 FluidBalanceTally (Form 61)
Live 24-hour summary card displaying hourly fluid totals and net balance.

```typescript
export interface FluidBalanceTallyProps {
  totalIntakeMl: number;   // Oral + IV + Ryle's Tube
  totalOutputMl: number;   // Urine + Surgical Drains + Vomitus
  netBalanceMl: number;    // Intake - Output
  isRestricted: boolean;   // Fluid restriction flag (e.g. 1500 mL/day)
}
```
- **Visual Color Thresholds:**
  - `netBalanceMl` between `-500` and `+1000`: Neutral Balanced (`#0d9488`).
  - `netBalanceMl` > `+1500`: Fluid Retention Alert (`#dc2626`).
  - `netBalanceMl` < `-1000`: Severe Hypovolemia / Dehydration (`#d97706`).

### 3.6 PatientQueueCard
Single item in doctor or reception queue list with token badge, demographics, and action trigger.

```typescript
export interface PatientQueueCardProps {
  tokenNumber: number;
  fullName: string;
  uhid: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  waitTimeMinutes: number;
  status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED';
  isFollowUp: boolean;
  isSelected: boolean;
  onClick: () => void;
  onCallIn?: () => void;
}
```

### 3.7 BedOccupancyCard
Interactive visual bed tile in the Ward Matrix.

```typescript
export interface BedOccupancyCardProps {
  bedNumber: string;        // e.g. "Bed 302"
  wardType: 'GENERAL' | 'SEMI_PRIVATE' | 'PRIVATE' | 'ICU';
  status: 'OCCUPIED' | 'VACANT_CLEAN' | 'VACANT_DIRTY' | 'MAINTENANCE';
  patient?: {
    fullName: string;
    uhid: string;
    admissionDay: number;   // e.g. "Day 3 of 6"
    attendingDoctor: string;
    latestVitalsState: 'STABLE' | 'ABNORMAL' | 'CRITICAL';
  };
  onClick: () => void;
}
```

### 3.8 PainScaleSelector
Clinical visual 0–10 numeric pain score with standardized Wong-Baker descriptors.

```typescript
export interface PainScaleSelectorProps {
  value: number; // 0 to 10
  onChange: (score: number) => void;
  disabled?: boolean;
}
```
- **Scale Mapping:**
  - `0`: No Pain (Green)
  - `1–3`: Mild Pain (Teal)
  - `4–6`: Moderate Pain, interferes with sleep/activity (Amber)
  - `7–9`: Severe Pain, disabling (Orange-Red)
  - `10`: Worst Possible Pain (Deep Crimson)

---

## 4. Organisms (Complex Clinical Folios)

### 4.1 ActivePatientBanner
The pinned clinical strip mounted at the top of `ChamberLayout` and `WardLayout`.

```typescript
export interface ActivePatientBannerProps {
  patient: {
    fullName: string;
    uhid: string;
    opdEncounterNumber?: string;
    tokenNumber?: number;
    age: number;
    gender: string;
    category: 'DOMESTIC' | 'FOREIGN';
    allergies?: string;
    referredBy?: string;
    insuranceProvider?: string;
    vitals?: VitalsTelemetryStripProps['vitals'];
  };
  status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED';
  onCallIn?: () => void;
  onPrintRx: () => void;
  onSignAndLock: () => void;
  isSignLocked: boolean;
}
```
- **Structural Blueprint:** Pinned flex container with `flex-wrap: nowrap`. Left: Avatar Squircle (44px) fixed. Center: Name, UHID, Token, Demographics, Vitals, and Allergy warning flag. Right: Action buttons (`flex-shrink: 0`, `marginLeft: 'auto'`).

### 4.2 SoapConsultationPad
Standardized NABH-compliant 4-part outpatient clinical consultation documentation surface.

```typescript
export interface SoapConsultationPadProps {
  soapData: {
    /**
     * S — Subjective: Patient-reported history in own words.
     * Maps to D11 consultation sign payload field: `subjective`.
     */
    subjective: string;

    /**
     * chiefComplaintDuration: Duration string extracted from chief complaint
     * (e.g. "3 days", "2 weeks"). Stored as a standalone UI helper field;
     * serialized into `subjective` on save (not a separate backend column).
     * Maps to D04 opd_consultations.history_of_present_illness contextually.
     */
    chiefComplaintDuration: string;

    /**
     * O — Objective: Clinical findings from physical examination.
     * Maps to D11 consultation sign payload field: `objective`.
     */
    objective: string;

    /**
     * A — Assessment: Narrative clinical reasoning (ICD-10 codes are managed
     * separately via the icd10Diagnoses array below).
     * Maps to D11 consultation sign payload field: `assessment`.
     */
    assessmentNarrative: string;

    /**
     * P — Plan: Care plan, lifestyle advice, follow-up schedule.
     * Maps to D11 consultation sign payload field: `plan`.
     */
    plan: string;
  };
  icd10Diagnoses: Array<{
    code: string;    // e.g. "I10"
    title: string;   // e.g. "Essential (primary) hypertension"
    isPrimary: boolean;
  }>;
  onUpdateSoap: (field: keyof SoapConsultationPadProps['soapData'], value: string) => void;
  onAddIcd10: (icd: { code: string; title: string; isPrimary: boolean }) => void;
  onRemoveIcd10: (code: string) => void;
  isReadOnly: boolean;
}
```
- **Clinical Rules:** Enforces mandatory inclusion of at least one Primary ICD-10 code (`BR-CON-01`) before the consultation can be digitally locked.
- **Serialization Note:** When saving, `chiefComplaintDuration` is appended to `subjective` as a suffix (e.g. *"Severe headache for 3 days"*) before the D11 `POST /api/v1/consultations/{id}/sign` call. It is not sent as a standalone field to the backend.

### 4.3 PrescriptionPadTable
Tabular e-prescribing grid with dynamic formulary search, dosage instructions, and integrated DDI checks.

```typescript
export interface PrescriptionPadTableProps {
  prescriptions: Array<{
    id: string | number;
    drugName: string;
    dose: string;
    route: 'Oral (PO)' | 'Intravenous (IV)' | 'Subcutaneous (SC)' | 'Topical' | 'Inhalation';
    frequency: '1-0-0' | '0-1-0' | '0-0-1' | '1-0-1' | '1-1-1' | 'SOS' | 'STAT';
    durationDays: number;
    mealTiming: 'Before Meals' | 'After Meals' | 'With Food' | 'Bedtime';
    instructions: string;
    quantityTabs: number;
  }>;
  onAddPrescription: (med: any) => void;
  onRemovePrescription: (id: string | number) => void;
  isReadOnly: boolean;
}
```

### 4.4 InpatientMarGrid (Form 29 Treatment Sheet)
The 6-Day Medication Administration Record table from the client's inpatient binder.

```typescript
export interface InpatientMarGridProps {
  admissionId: string;
  patientName: string;
  admissionDate: string;
  oxygenOrders: {
    flowRateLMin: number;
    deliveryDevice: 'Nasal Cannula' | 'Face Mask' | 'NRBM' | 'Venturi' | 'None';
    targetSpo2: string;
  };
  scheduledMedications: Array<{
    orderId: string;
    drugName: string;
    dose: string;
    route: string;
    frequency: string;
    slots: Array<{
      dayIndex: 1 | 2 | 3 | 4 | 5 | 6;
      slotTime: '06:00' | '12:00' | '18:00' | '22:00';
      status: 'SCHEDULED' | 'GIVEN' | 'OMITTED';
      nurseInitials?: string;
    }>;
  }>;
  onCellClick: (orderId: string, day: number, slotTime: string) => void;
}
```

### 4.5 IntakeOutputLedger (Form 61 Fluid Chart)
Hour-by-hour 24-hour fluid balance ledger with cumulative shift sub-totals.

```typescript
export interface IntakeOutputLedgerProps {
  admissionId: string;
  dayNumber: number; // Day 1 to 6
  entries: Array<{
    hour: string; // "06:00", "07:00", ... "05:00"
    shift: 'MORNING' | 'EVENING' | 'NIGHT';
    oralIntakeMl: number;
    ivFluidType?: string;
    ivIntakeMl: number;
    urineOutputMl: number;
    drainOutputMl: number;
    vomitusMl: number;
  }>;
  onUpdateEntry: (hour: string, field: string, value: number) => void;
}
```

### 4.6 NurseShiftLogEditor (Form 72 Shift Notes)
Nursing clinical observation log capturing Shift Vitals, NEWS2 calculation, and clinical handoff notes.

```typescript
export interface NurseShiftLogEditorProps {
  admissionId: string;
  activeShift: 'MORNING' | 'EVENING' | 'NIGHT';
  vitals: VitalsTelemetryStripProps['vitals'];
  painScore: number;
  generalObservations: string;
  handoffConcerns: string;
  onSaveShiftNote: (noteData: any) => void;
}
```

### 4.7 IpdDischargeBillTable (10-Head Ledger)
Consolidated multi-point inpatient discharge invoice breakdown.

```typescript
export interface IpdDischargeBillTableProps {
  invoiceNumber: string;
  admissionPeriod: { from: string; to: string; totalDays: number };
  heads: {
    head1_bedNursing: number;
    head2_doctorVisits: number;
    head3_pathologyInvestigations: number;
    head4_pharmacyMedications: number;
    head5_operationTheatre: number;
    head6_anaesthesia: number;
    head7_oxygenTherapy: number;
    head8_consumablesSundries: number;
    head9_rmoEmergency: number;
    head10_administrativeMisc: number;
  };
  advancesPaid: number;
  concessionDiscount: number;
  gstAmount: number;
  netPayable: number;
  onCollectSettlement: (paymentMode: 'CASH' | 'UPI' | 'CARD', amount: number) => void;
}
```

### 4.8 WaitingRoomDisplayBoard
Fullscreen public TV waiting lounge queue announcer component.

```typescript
export interface WaitingRoomDisplayBoardProps {
  currentCalled: {
    tokenNumber: number;
    cabinName: string;
    doctorName: string;
    department: string;
  };
  upNextTokens: Array<{ tokenNumber: number; cabinName: string }>;
  clinicMarqueeNotice: string;
}
```

### 4.9 DynamicClinicalFormPad (14-Form Engine — ADR-009)
Generic, schema-driven clinical form viewer and editor that renders and validates any of the 14 forms from `IPD Book 6 Days.pdf` (Forms 8, 9, 10, 70, 71, 15, 54, Handover, Transfer, Feedback).

```typescript
export interface DynamicClinicalFormPadProps {
  admissionId: string;
  formCode: 'FORM_08' | 'FORM_09' | 'FORM_10' | 'FORM_70' | 'FORM_71' | 'FORM_15' | 'FORM_54' | 'FORM_HANDOVER' | 'FORM_TRANSFER' | 'FORM_FEEDBACK';
  schemaVersion: number;
  initialData?: Record<string, any>;
  isLocked: boolean;
  onSave: (payload: Record<string, any>) => Promise<void>;
  onLockSignOff?: () => Promise<void>;
  printTemplateCode?: string;
}
```

### 4.10 LicenseStatusBanner & OfflineUploader (ADR-010)
Displays on-premise SaaS license health pill (`[ ACTIVE ]`, `[ GRACE PERIOD - 12 Days Left ]`, `[ READ ONLY ]`), with drag-and-drop `.lic` file uploader and manual key string input for air-gapped on-premise deployments.

```typescript
export interface LicenseStatusBannerProps {
  tier: string;
  status: 'ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED';
  daysRemaining: number;
  enabledModules: Array<'OPD' | 'IPD' | 'PHARMACY' | 'PATHOLOGY' | 'BILLING'>;
  isClockTampered: boolean;
  onRenewClick: () => void;
}
```

---

## 5. State, Loading Skeletons & Error Boundaries

Every component cataloged above implements three mandatory visual states:

1. **Skeleton State (`isLoading`):** Uses CSS shimmering background (`linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)`) matching the exact row height and radius of the component.
2. **Empty State (`isEmpty`):** Renders a centered Lucide icon, human-friendly heading, and clear single call-to-action button (e.g. *"No Active Patients in Chamber Queue. Click 'Call Next Token' to start."*).
3. **Error Boundary Fallback (`isError`):** Renders a clinical warning box with exact backend error code (e.g. `ERR_DDI_ENGINE_FAILED`) and a safe 'Retry Fetch' button without blowing up the parent layout.
