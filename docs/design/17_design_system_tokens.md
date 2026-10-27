# D17 — Design System Tokens & Clinical Style Specification
## Bright Solutions: Clinical Hospital Operating System

> **Document ID:** D17  
> **Version:** 1.0  
> **Status:** APPROVED FRONTEND ARCHITECTURE SPECIFICATION  
> **Depends On:** [01_PRD.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/01_PRD.md), [02_feature_spec.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/02_feature_spec.md), [16_ui_component_inventory.md](file:///c:/Study%20Material%20And%20Projects/Intership-Paperbird_tech/bright_solutions/docs/design/16_ui_component_inventory.md)  
> **Prepared By:** Bright Solutions Frontend Engineering Team  
> **Last Updated:** October 2026  

---

## Table of Contents

1. [Design Philosophy & Hospital Usability Standards](#1-design-philosophy--hospital-usability-standards)
2. [Color Token Architecture](#2-color-token-architecture)
   - 2.1 [Clinical Brand & Authority Palette](#21-clinical-brand--authority-palette)
   - 2.2 [Triage Severity & Early Warning Alert Tokens](#22-triage-severity--early-warning-alert-tokens)
   - 2.3 [Neutral Surfaces, Backgrounds & Scrims](#23-neutral-surfaces-backgrounds--scrims)
   - 2.4 [Dark Mode / Night Shift Inpatient Ward Tokens](#24-dark-mode--night-shift-inpatient-ward-tokens)
3. [Typography Tokens & Tabular Numerics](#3-typography-tokens--tabular-numerics)
   - 3.1 [Font Families & Character Encodings](#31-font-families--character-encodings)
   - 3.2 [Type Hierarchy & Modular Scale](#32-type-hierarchy--modular-scale)
   - 3.3 [Tabular Numeric Rule (Mandatory)](#33-tabular-numeric-rule-mandatory)
4. [Spacing, Grid & Elevation Tokens](#4-spacing-grid--elevation-tokens)
   - 4.1 [4px Baseline Spacing Scale](#41-4px-baseline-spacing-scale)
   - 4.2 [Corner Radii & Squircle Geometric Formula](#42-corner-radii--squircle-geometric-formula)
   - 4.3 [Elevation & Drop Shadows](#43-elevation--drop-shadows)
5. [Micro-Interactions, Motion & Transitions](#5-micro-interactions-motion--transitions)
6. [Responsive Breakpoints & Display Standards](#6-responsive-breakpoints--display-standards)
7. [Canonical Vanilla CSS Token Stylesheet (:root)](#7-canonical-vanilla-css-token-stylesheet-root)

---

## 1. Design Philosophy & Hospital Usability Standards

Bright Solutions operates in high-stress, high-consequence Indian hospital environments characterized by harsh fluorescent lighting, dated TN-panel monitors, and extreme time pressure. The design system enforces four clinical principles:

1. **Sub-Second Scannability:** Crucial physiological indicators (SpO2, Blood Pressure, Lethal Drug-Drug Interactions) utilize unambiguous, high-contrast color boundaries with minimum contrast ratios exceeding WCAG AAA standards (7:1 for text, 4.5:1 for data graphics).
2. **Tabular Numerics Rule:** Every vital sign, monetary currency figure (₹ INR), token index, and drug dosage strictly renders with monospace tabular numbers (`font-variant-numeric: tabular-nums`). This prevents jitter during live SSE telemetry updates and guarantees column alignment in financial ledgers.
3. **No Fluff / Maximum Information Density:** Decorative padding is minimized in clinical workspaces (`ChamberLayout`, `WardLayout`) to ensure a doctor can review vitals, symptoms, prior history, and write an e-prescription on a standard 1366×768 or 1920×1080 display without excessive page scrolling.
4. **Night-Shift Dark Mode:** Inpatient wards feature an eye-strain-reducing night shift theme (`.doctor-theme-dark`, `.ward-night-shift`) utilizing deep slate-blues (`#0b132b`) rather than harsh pure blacks, preserving circadian adaptation during 2:00 AM nurse medication rounds.

---

## 2. Color Token Architecture

### 2.1 Clinical Brand & Authority Palette
The core brand palette balances sterile clinical authority with a modern, reassuring healthcare presence:

| Token Name | Hex Code | HSL Representation | Clinical Intent / Usage |
|:---|:---:|:---|:---|
| `--color-brand-primary` | `#0077b6` | `hsl(201, 100%, 36%)` | Primary hospital identity, primary buttons, active tabs |
| `--color-brand-primary-hover` | `#023e8a` | `hsl(214, 97%, 27%)` | Hover state for filled buttons, active drawer headers |
| `--color-brand-accent` | `#00b4d8` | `hsl(190, 100%, 42%)` | Telemetry highlights, vital signs icons, interactive links |
| `--color-brand-subtle` | `#edf8fc` | `hsl(196, 64%, 96%)` | Active patient banner gradient end, selected row tint |
| `--color-brand-border` | `#bfe7f5` | `hsl(195, 71%, 86%)` | Card borders in clinical chambers, table outline rings |

### 2.2 Triage Severity & Early Warning Alert Tokens
Four deterministic triage colors aligned with the Emergency Severity Index (ESI), NEWS2 score thresholds, and CDSS rules:

```
[RED: Emergency / Critical]   #dc2626  -- NEWS2 >= 7 • Lethal DDI • SpO2 < 92% • MLC Case
[AMBER: Urgent / Caution]     #d97706  -- NEWS2 5-6 • SBP >= 140 • Temp >= 100.4°F • Fluid Overload
[BLUE: Priority / Active]     #2563eb  -- Active Consultation • Token In Chamber • Normal Telemetry
[TEAL: Routine / Completed]   #0d9488  -- Consultation Signed • Normal Vitals • Dose Given • Settled
```

| Triage Level | Foreground Token | Hex | Container Background | Hex | Border Accent | Hex |
|:---|:---|:---:|:---|:---:|:---|:---:|
| **Emergency (Red)** | `--color-triage-emergency-fg` | `#991b1b` | `--color-triage-emergency-bg` | `#fee2e2` | `--color-triage-emergency-border` | `#fca5a5` |
| **Urgent (Amber)** | `--color-triage-urgent-fg` | `#92400e` | `--color-triage-urgent-bg` | `#fef3c7` | `--color-triage-urgent-border` | `#fde68a` |
| **Priority (Blue)** | `--color-triage-priority-fg` | `#1e40af` | `--color-triage-priority-bg` | `#eff6ff` | `--color-triage-priority-border` | `#bfdbfe` |
| **Routine (Teal)** | `--color-triage-routine-fg` | `#115e59` | `--color-triage-routine-bg` | `#ccfbf1` | `--color-triage-routine-border` | `#99f6e4` |

### 2.3 Neutral Surfaces, Backgrounds & Scrims

| Token Name | Hex Code | Purpose |
|:---|:---:|:---|
| `--color-surface-canvas` | `#f8fafc` | Global application shell background (Slate 50) |
| `--color-surface-card` | `#ffffff` | Elevated clinical cards, form containers, modal cards |
| `--color-surface-subtle` | `#f1f5f9` | Inactive table headers, disabled inputs, filter tab bar |
| `--color-text-primary` | `#0f172a` | Patient names, primary headings, vital values (Slate 900) |
| `--color-text-secondary` | `#475569` | Clinical labels, units, demographic subtitles (Slate 600) |
| `--color-text-muted` | `#64748b` | Timestamps, placeholder text, table footer notes |
| `--color-border-default` | `#e2e8f0` | Standard card borders, table dividers, input borders |
| `--color-scrim-backdrop` | `rgba(15, 23, 42, 0.72)` | Modal fixed backdrop scrim with `backdrop-filter: blur(6px)` |

### 2.4 Dark Mode / Night Shift Inpatient Ward Tokens
Activated via `.doctor-theme-dark` or `.ward-night-shift`:

```css
.ward-night-shift {
  --color-surface-canvas: #090e17;
  --color-surface-card: #111928;
  --color-surface-subtle: #1e293b;
  --color-text-primary: #f8fafc;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #64748b;
  --color-border-default: #1e293b;
  --color-brand-subtle: #0f2744;
  --color-brand-border: #1e3a8a;
}
```

---

## 3. Typography Tokens & Tabular Numerics

### 3.1 Font Families & Character Encodings
- **Primary Clinical Font:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`  
  *Rationale:* Superior x-height, distinct letterforms (disambiguates `I`, `l`, `1`), and universal system fallback.
- **Display Headings:** `'Outfit', 'Inter', sans-serif`  
  *Rationale:* Geometric precision for hospital titles, large token numbers, and printable letterheads.
- **Monospace Code & Thermal Receipts:** `'JetBrains Mono', 'Courier New', Courier, monospace`  
  *Rationale:* 80mm thermal receipts, drug batch numbers, and raw DICOM tags.

### 3.2 Type Hierarchy & Modular Scale

| Token Name | Size | Line Height | Weight | Letter Spacing | Clinical Usage |
|:---|:---:|:---:|:---:|:---:|:---|
| `--font-display-hero` | `28px` | `1.2` | `900` | `-0.03em` | TV Waiting Room Token #, Hospital Brand Letterhead |
| `--font-display-title` | `20px` | `1.25` | `800` | `-0.02em` | Patient Name in Chamber Banner, Ward Bed Title |
| `--font-heading-lg` | `16px` | `1.3` | `800` | `-0.01em` | Section Titles (SOAP Note, MAR Grid, Fluid Ledger) |
| `--font-heading-md` | `13.5px`| `1.35` | `700` | `0` | Card Headers, Table Column Group Headings |
| `--font-body-base` | `12px` | `1.45` | `500` | `0` | Form Input Values, Doctor Clinical Notes, Instructions |
| `--font-caption` | `10.5px`| `1.4` | `600` | `+0.01em` | Demographics Subtitle, Table Cells, Vitals Units |
| `--font-micro` | `9.5px` | `1.3` | `700` | `+0.03em` | Status Pills, Token Tags, Form 29 Time Slot Stamp |

### 3.3 Tabular Numeric Rule (Mandatory)
All elements displaying measurements, money, or codes must enforce `tabular-nums`:

```css
.tabular-nums, 
.vitals-value, 
.currency-inr, 
.token-number, 
.mar-cell-time {
  font-variant-numeric: tabular-nums lining-nums;
  -webkit-font-feature-settings: "tnum" 1, "lnum" 1;
  font-feature-settings: "tnum" 1, "lnum" 1;
}
```

---

## 4. Spacing, Grid & Elevation Tokens

### 4.1 4px Baseline Spacing Scale

| Token Name | Pixels | Intent |
|:---|:---:|:---|
| `--spacing-0.5` | `2px` | Micro badge padding, inline dot gaps |
| `--spacing-1` | `4px` | Pill padding, tight flex gaps |
| `--spacing-1.5` | `6px` | Button inline icon gaps, queue item margins |
| `--spacing-2` | `8px` | Standard element gap inside molecules |
| `--spacing-2.5` | `10px` | Table cell vertical padding, card inner padding |
| `--spacing-3` | `12px` | Card padding in compact chamber layouts |
| `--spacing-4` | `16px` | Standard card padding, modal body padding |
| `--spacing-5` | `20px` | Page container padding, modal header padding |
| `--spacing-6` | `24px` | Large section dividers, inpatient ward grid gap |
| `--spacing-8` | `32px` | TV display outer margins |

### 4.2 Corner Radii & Squircle Geometric Formula
- `--radius-xs`: `4px` (Token tags, small badges)
- `--radius-sm`: `6px` (Clinical form inputs, table buttons)
- `--radius-md`: `8px` (Standard action buttons, dropdown menus)
- `--radius-lg`: `12px` (Clinical cards, queue containers)
- `--radius-xl`: `14px` (Active Patient Banner, modal dialog card)
- `--radius-squircle`: `28%` (Continuous-corner avatar badges for patient initials)
- `--radius-full`: `9999px` (Status pills, filter buttons, round icon triggers)

### 4.3 Elevation & Drop Shadows
- `--shadow-card`: `0 2px 6px -1px rgba(0, 0, 0, 0.05), 0 1px 3px -1px rgba(0, 0, 0, 0.03)`
- `--shadow-lift`: `0 6px 18px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)`
- `--shadow-modal`: `0 25px 60px -12px rgba(15, 23, 42, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.1)`
- `--shadow-brand`: `0 4px 12px rgba(0, 119, 182, 0.35)`

---

## 5. Micro-Interactions, Motion & Transitions

Hospital software must feel snappy, predictable, and devoid of disorienting, sluggish animations:

1. **Hover Lift (`.anim-hover-lift`):**  
   `transition: transform 0.18s ease, box-shadow 0.18s ease;`  
   `&:hover { transform: translateY(-1.5px); box-shadow: var(--shadow-lift); }`
2. **Radar Ping (`.anim-radar-ping`):**  
   Subtle pulsating beacon for live consultation and active IV pumps:  
   `@keyframes radarPing { 0% { transform: scale(0.95); opacity: 0.8; } 50% { transform: scale(1.3); opacity: 0.3; } 100% { transform: scale(0.95); opacity: 0.8; } }`
3. **Modal Slide-Up (`@keyframes m3DialogEnter`):**  
   Duration: `220ms`, Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (snappy spring deceleration).

---

## 6. Responsive Breakpoints & Display Standards

| Breakpoint Name | Min-Width | Target Device & Hospital Context | Layout Rule |
|:---|:---:|:---|:---|
| `display-4k-tv` | `2560px` | Waiting Room Annunciator LED Wall | 2-Column Split: Active Token Left + Up Next Grid Right |
| `display-fhd-tv`| `1920px` | 55" Waiting Lounge TV Display | Single unified fullscreen token board (`TVDisplayLayout`) |
| `desktop-xl` | `1536px` | Doctor Chambers, Reception Multi-Monitor | Full 2-Column Clinical Workspace (`290px` Left + `1fr` Right) |
| `desktop-std` | `1280px` | Standard Hospital Nursing Workstation | Queue collapses to `240px`, compact tabular padding |
| `laptop-compact`| `1024px` | Mobile Cart Laptop on Wheels (COW) | Ward Bed Matrix switches from 6-column to 3-column |
| `tablet-pos` | `768px` | Handheld Bedside Triage Tablet | Left queue shifts to slide-out drawer via hamburger trigger |

---

## 7. Canonical Vanilla CSS Token Stylesheet (:root)

```css
:root {
  /* ==================== BRAND PALETTE ==================== */
  --color-brand-primary: #0077b6;
  --color-brand-primary-hover: #023e8a;
  --color-brand-accent: #00b4d8;
  --color-brand-subtle: #edf8fc;
  --color-brand-border: #bfe7f5;
  --color-brand-gradient: linear-gradient(135deg, #0077b6 0%, #023e8a 100%);
  --color-brand-banner-gradient: linear-gradient(135deg, #ffffff 0%, #edf8fc 100%);

  /* ==================== TRIAGE & CLINICAL SAFETY ==================== */
  --color-triage-emergency-fg: #991b1b;
  --color-triage-emergency-bg: #fee2e2;
  --color-triage-emergency-border: #fca5a5;
  --color-triage-emergency-solid: #dc2626;

  --color-triage-urgent-fg: #92400e;
  --color-triage-urgent-bg: #fef3c7;
  --color-triage-urgent-border: #fde68a;
  --color-triage-urgent-solid: #d97706;

  --color-triage-priority-fg: #1e40af;
  --color-triage-priority-bg: #eff6ff;
  --color-triage-priority-border: #bfdbfe;
  --color-triage-priority-solid: #2563eb;

  --color-triage-routine-fg: #115e59;
  --color-triage-routine-bg: #ccfbf1;
  --color-triage-routine-border: #99f6e4;
  --color-triage-routine-solid: #0d9488;

  /* ==================== SURFACES & NEUTRALS ==================== */
  --color-surface-canvas: #f8fafc;
  --color-surface-card: #ffffff;
  --color-surface-subtle: #f1f5f9;
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #64748b;
  --color-border-default: #e2e8f0;
  --color-scrim-backdrop: rgba(15, 23, 42, 0.72);

  /* ==================== TYPOGRAPHY ==================== */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-display: 'Outfit', 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', 'Courier New', monospace;

  /* ==================== SPACING ==================== */
  --spacing-0-5: 2px;
  --spacing-1: 4px;
  --spacing-1-5: 6px;
  --spacing-2: 8px;
  --spacing-2-5: 10px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;

  /* ==================== RADII ==================== */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 14px;
  --radius-full: 9999px;

  /* ==================== SHADOWS ==================== */
  --shadow-card: 0 2px 6px -1px rgba(0, 0, 0, 0.05), 0 1px 3px -1px rgba(0, 0, 0, 0.03);
  --shadow-lift: 0 6px 18px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04);
  --shadow-modal: 0 25px 60px -12px rgba(15, 23, 42, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.1);
  --shadow-brand: 0 4px 12px rgba(0, 119, 182, 0.35);
}
```
