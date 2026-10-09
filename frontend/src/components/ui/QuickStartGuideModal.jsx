import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Compass,
  UserCheck,
  Stethoscope,
  Receipt,
  Shield,
  ArrowRight,
  CheckCircle2,
  Zap,
  Sparkles,
  Command,
  ChevronRight,
  ExternalLink,
  Layers,
  Clock,
  Printer
} from 'lucide-react';
import { ROUTES } from '../../routes';

export const ROLE_GUIDES = {
  RECEPTIONIST: {
    roleId: 'RECEPTIONIST',
    roleTitle: 'Receptionist & Front Desk Triage',
    icon: UserCheck,
    tagline: 'Rapid Patient Onboarding, ABHA Triage & Token Generation',
    targetBenchmark: '< 2.5 mins per patient intake',
    primaryActionLabel: 'Open Registration Modal',
    primaryActionRoute: `${ROUTES.RECEPTIONIST.DASHBOARD}?register=true`,
    summary: 'The Receptionist orchestrates patient arrivals, records baseline hemodynamic vitals, generates sequential queue tokens, conducts intake questionnaires, and balances waiting lounge capacity.',
    steps: [
      {
        step: 1,
        title: 'Walk-In Registration & ABHA Verification',
        target: 'Hero "+ Register Walk-in Patient" Button',
        desc: 'Click the "+ Register Walk-in Patient" button from the Reception Dashboard or use the quick shortcut from the sidebar. You can manually enter name, phone, age, and gender, or use 1-click "Auto-fill PM-JAY Cashless" to immediately load verified ABHA demographics.',
        hint: 'Click-Saving Tip: The Ayushman Bharat PM-JAY auto-fill instantly configures 100% government coverage and pre-authorisation tokens in 1 click.',
        actionLabel: 'Launch Register Dialog',
        route: `${ROUTES.RECEPTIONIST.DASHBOARD}?register=true`
      },
      {
        step: 2,
        title: 'Hemodynamic Triage Vitals Capture',
        target: 'Vitals Entry Section & Auto-Fill Normal',
        desc: 'Record baseline biometrics: Systolic & Diastolic BP, Heart Rate, Body Temperature, SpO2, Weight, and Height. The system dynamically computes BMI and classifies AHA Hypertension risk (Normal, Elevated, Stage 1, Stage 2).',
        hint: 'Click-Saving Tip: Use the "⚡ Auto-fill Normal Vitals" button to populate healthy baseline biometrics in one click during rapid triage drills.',
        actionLabel: 'View Triage Stream',
        route: ROUTES.RECEPTIONIST.DASHBOARD
      },
      {
        step: 3,
        title: 'Generate Sequential Token & Assign Cabin',
        target: 'Token Generation & Doctor Assignment',
        desc: 'Select the assigned attending physician (e.g. Dr. Vikram Kulkarni - Cabin 01). Upon clicking "Register & Print Token Slip", a sequential ticket (#Q-104) is generated, formatted for 80mm thermal receipt printing, and pushed to the live doctor queue.',
        hint: 'Click-Saving Tip: You can reprint token slips anytime directly from the Live Queue Roster with one click.',
        actionLabel: 'Go to Queue Roster',
        route: ROUTES.RECEPTIONIST.QUEUE
      },
      {
        step: 4,
        title: 'Clinical Intake Questionnaire (Anamnesis)',
        target: 'Intake Questionnaire Page',
        desc: 'Select registered patients to conduct structured 12-question anamnesis screening (chief complaints, pain score 1-10, symptom onset, chronic history). Alternatively, activate speech-to-text voice dictation for hands-free anamnesis.',
        hint: 'Click-Saving Tip: Select any patient from the list, click "Pre-fill Clinical Sample", and review instant OncoInsight AI risk classification.',
        actionLabel: 'Open Questionnaire',
        route: ROUTES.RECEPTIONIST.QUESTIONNAIRE
      },
      {
        step: 5,
        title: 'Diagnostic Reports & Scans Ingestion',
        target: 'Diagnostic Reports Ingestion Page',
        desc: 'Upload or verify diagnostic assets: axial DICOM CT slices, 12-lead ECG strips, and blood chemistry panels. System verifies file integrity and attaches them directly to the doctor\'s visualizer cockpit.',
        hint: 'Click-Saving Tip: Filter by patient from the left roster to view all pending diagnostic attachments.',
        actionLabel: 'Open Ingestion Hub',
        route: ROUTES.RECEPTIONIST.REPORTS
      }
    ]
  },
  DOCTOR: {
    roleId: 'DOCTOR',
    roleTitle: 'Physician & Oncologist Cockpit',
    icon: Stethoscope,
    tagline: 'Queue Triage, Longitudinal Dossiers, DICOM Scans & CDSS Rx Studio',
    targetBenchmark: '< 4 mins per consultation note',
    primaryActionLabel: 'Open Consultation Studio',
    primaryActionRoute: '/doctor/consultation/102',
    summary: 'The Doctor reviews the active lounge queue, assesses triage risk, examines longitudinal patient history, inspects high-resolution DICOM imaging, and generates safe digital prescriptions powered by CDSS alerts.',
    steps: [
      {
        step: 1,
        title: 'Live Queue & Hemodynamic Triage Roster',
        target: 'Doctor Dashboard Queue Table',
        desc: 'View real-time waiting lounge patients with elapsed wait times, chief complaints, and color-coded hemodynamic triage alerts (e.g. Stage 2 HTN flag).',
        hint: 'Click-Saving Tip: Click "Call Into Room" on any patient to instantly update lounge status and open their active clinical consultation workspace.',
        actionLabel: 'View Doctor Dashboard',
        route: ROUTES.DOCTOR.DASHBOARD
      },
      {
        step: 2,
        title: 'Longitudinal Patient Dossier',
        target: 'Patient Dossier Page',
        desc: 'Review past encounters, chronic comorbidities (Type 2 DM, Asthma), allergy alerts (Penicillin, NSAIDs), and cumulative laboratory trend charts before prescribing.',
        hint: 'Click-Saving Tip: Press ⌘K or search UHID to instantly jump into any patient\'s dossier across all historical visits.',
        actionLabel: 'Open Patient Dossier',
        route: '/doctor/patient/2'
      },
      {
        step: 3,
        title: 'High-Resolution DICOM & Media Visualizer',
        target: 'Diagnostic Media Visualizer',
        desc: 'Inspect axial CT slices with 148-frame scrub slider, window presets (Lung, Mediastinum, Bone), digital measurement calipers, zoom/pan controls, and 12-lead ECG rhythm strips.',
        hint: 'Click-Saving Tip: Use keyboard arrow keys or mouse wheel to scrub through DICOM slices smoothly.',
        actionLabel: 'Open DICOM Viewer',
        route: '/doctor/viewer/2'
      },
      {
        step: 4,
        title: 'Consultation Studio & 1-Click Rx Presets',
        target: 'Consultation & CDSS Studio',
        desc: 'Record clinical examination notes, ICD-10 diagnosis, and prescribe medications. Use 1-click clinical presets (Hypertension Protocol, Diabetic Review, Acute URI) to auto-fill complete multi-drug regimens with dosages, frequency, and timing pills.',
        hint: 'Click-Saving Tip: The 1-click presets save over 15 individual form clicks per patient visit!',
        actionLabel: 'Open Consultation Studio',
        route: '/doctor/consultation/102'
      },
      {
        step: 5,
        title: 'CDSS Contraindication Engine & Transmit Bill',
        target: 'CDSS Safety Banner & Finalize Button',
        desc: 'The deterministic Clinical Decision Support System checks drug-drug interactions, allergy flags, and hemodynamic contraindications in real time. Click "Finalize & Transmit to Cashier" to lock the visit and route to billing.',
        hint: 'Click-Saving Tip: Finalizing automatically transitions patient status to "Pending Billing" without manual handoff.',
        actionLabel: 'Go to Studio',
        route: '/doctor/consultation/102'
      }
    ]
  },
  CASHIER: {
    roleId: 'CASHIER',
    roleTitle: 'Cashier & Billing Settlement Desk',
    icon: Receipt,
    tagline: 'Itemized Charges, 100% Cashless PM-JAY, UPI QR & 80mm GST Invoice',
    targetBenchmark: '< 30 secs per invoice settlement',
    primaryActionLabel: 'Open Billing Counter',
    primaryActionRoute: ROUTES.CASHIER.DASHBOARD,
    summary: 'The Cashier audits locked doctor consultation orders, applies tariff sheets and pharmacy charges, processes PM-JAY insurance or instant UPI payments, and issues official 80mm GST Tax Invoices.',
    steps: [
      {
        step: 1,
        title: 'Real-Time Billing Desk Queue',
        target: 'Cashier Dashboard Unbilled Orders Table',
        desc: 'Monitor incoming patients who have completed doctor consultations. Each row displays patient UHID, Token, attending physician, and raw itemized total.',
        hint: 'Click-Saving Tip: Click "Settle Invoice" on any row to open the complete itemized billing breakdown.',
        actionLabel: 'View Billing Desk',
        route: ROUTES.CASHIER.DASHBOARD
      },
      {
        step: 2,
        title: 'Itemized Charge Sheet & GST Breakdown',
        target: 'Itemized Billing Page',
        desc: 'Review itemized billing line items: Physician Consultation Fee, Diagnostic Investigations (ECG, DICOM CT), and prescribed pharmacy medicines with statutory 18% GST calculation.',
        hint: 'Click-Saving Tip: Copay and insurance discounts are calculated automatically based on patient profile.',
        actionLabel: 'Open Itemized Billing',
        route: '/cashier/billing/102'
      },
      {
        step: 3,
        title: '100% Cashless PM-JAY / Multi-Mode Tender',
        target: 'Payment Tender Selection',
        desc: 'Choose payment method: 100% Cashless Ayushman Bharat PM-JAY (auto-authorizes claim for zero balance), Dynamic UPI QR Code, Card Terminal, or Cash.',
        hint: 'Click-Saving Tip: For PM-JAY patients, clicking "100% Cashless Settlement" completes the entire payment in 1 click.',
        actionLabel: 'View Payment Screen',
        route: '/cashier/receipt/102'
      },
      {
        step: 4,
        title: 'Print 80mm GST Tax Invoice & Dispensing Slip',
        target: 'Official Receipt & Print Button',
        desc: 'Click "Print Tax Invoice" to trigger formatted 80mm thermal receipt printing, complete with GSTIN, ABHA token verification, SAC codes, and pharmacy dispensing instructions.',
        hint: 'Click-Saving Tip: System automatically executes browser print dialog styled for standard POS thermal receipt printers.',
        actionLabel: 'Open Receipt Slip',
        route: '/cashier/receipt/102'
      }
    ]
  },
  ADMIN: {
    roleId: 'ADMIN',
    roleTitle: 'Hospital Administrator & Operations Governance',
    icon: Shield,
    tagline: 'OPD Census Analytics, Physician Load Balancing, RBAC & Audit Trails',
    targetBenchmark: 'Real-time clinic oversight & compliance',
    primaryActionLabel: 'Open Executive Governance',
    primaryActionRoute: ROUTES.ADMIN.DASHBOARD,
    summary: 'The Administrator monitors hospital footfall, evaluates cabin wait times, provisions medical and administrative staff credentials, and inspects tamper-evident audit trails for clinical compliance.',
    steps: [
      {
        step: 1,
        title: 'Hospital Operational Footfall & Revenue',
        target: 'Admin Dashboard Metric Bento',
        desc: 'Inspect total daily OPD census, hourly patient arrival distribution, revenue collections, and average patient turnaround time across all service points.',
        hint: 'Click-Saving Tip: Bento metric cards show live deltas comparing today against weekly averages.',
        actionLabel: 'Open Admin Dashboard',
        route: ROUTES.ADMIN.DASHBOARD
      },
      {
        step: 2,
        title: 'Physician Cabin Load Balancing',
        target: 'Cabin Efficiency Breakdown',
        desc: 'Analyze patient volume distribution among Dr. Kulkarni, Dr. Roy, and Dr. Nair to prevent bottlenecking and ensure balanced clinical workloads.',
        hint: 'Click-Saving Tip: Spot overwhelmed doctor cabins at a glance with the color-coded load balancing bar chart.',
        actionLabel: 'View Cabin Metrics',
        route: ROUTES.ADMIN.DASHBOARD
      },
      {
        step: 3,
        title: 'Staff Credentialing & RBAC Provisioning',
        target: 'Staff Management Page',
        desc: 'Create and manage user accounts, assign role permissions (Receptionist, Doctor, Cashier, Admin), update duty shift schedules, and deactivate inactive logins.',
        hint: 'Click-Saving Tip: Use the Quick Role switcher at the bottom-left sidebar to test any role experience immediately.',
        actionLabel: 'Manage Staff Roster',
        route: ROUTES.ADMIN.STAFF
      },
      {
        step: 4,
        title: 'Clinical & Billing Tamper-Evident Audit Trail',
        target: 'Audit Logs Page',
        desc: 'Inspect immutable medical-legal log entries for every vital sign update, prescription transmission, and payment transaction with ISO timestamps and user IDs.',
        hint: 'Click-Saving Tip: Filter audit logs by module (CLINICAL, BILLING, AUTH) to pinpoint events rapidly for compliance inspections.',
        actionLabel: 'Open Audit Logs',
        route: ROUTES.ADMIN.AUDIT_LOGS
      }
    ]
  }
};

export function QuickStartGuideModal({ isOpen, onClose, currentRole = 'RECEPTIONIST', onSwitchRole }) {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const navigate = useNavigate();

  // Sync selected role when modal opens with user's role
  useEffect(() => {
    if (isOpen) {
      setSelectedRole(currentRole);
      setActiveStepIndex(0);
    }
  }, [isOpen, currentRole]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentGuide = ROLE_GUIDES[selectedRole] || ROLE_GUIDES.RECEPTIONIST;
  const steps = currentGuide.steps;
  const activeStep = steps[activeStepIndex] || steps[0];

  function handleNavigate(route) {
    onClose();
    if (selectedRole !== currentRole && onSwitchRole) {
      onSwitchRole(selectedRole);
    }
    navigate(route);
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#051A30]/65 transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-4xl bg-white dark:bg-[#0A2540] text-[#0A2540] dark:text-white rounded-2xl shadow-2xl border border-[#CBD5E1] dark:border-[#1B456E] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header Banner */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-[#0A2540] to-[#0F355A] text-white flex items-center justify-between border-b border-[#1B456E]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FFC21A] text-[#0A2540] flex items-center justify-center shrink-0 shadow-xs">
                <Compass className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight">
                    Quick Start & Role Workflow Guide
                  </h2>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFC21A] text-[#0A2540] text-[10px] font-extrabold uppercase">
                    <Sparkles className="w-3 h-3" />
                    Interactive
                  </span>
                </div>
                <p className="text-[11px] text-[#CBD5E1] leading-tight mt-0.5">
                  Understand the complete 2026 clinical pipeline and shortcuts for every department
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#1B456E] transition-colors focus:outline-none"
              title="Close Guide (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Role Navigation Pills Bar */}
          <div className="px-4 py-2 bg-[#FAF6EC] dark:bg-[#071D33] border-b border-[#EAE4D3] dark:border-[#1B456E] flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] mr-1 uppercase tracking-wider font-mono">
                Select Role:
              </span>
              {[
                { r: 'RECEPTIONIST', label: 'Receptionist', icon: UserCheck },
                { r: 'DOCTOR', label: 'Physician / Dr.', icon: Stethoscope },
                { r: 'CASHIER', label: 'Cashier & Billing', icon: Receipt },
                { r: 'ADMIN', label: 'Admin Governance', icon: Shield },
              ].map(({ r, label, icon: TabIcon }) => {
                const isSelected = selectedRole === r;
                const isCurrent = currentRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSelectedRole(r);
                      setActiveStepIndex(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-[#FFC21A] text-[#0A2540] shadow-xs'
                        : 'bg-white dark:bg-[#0A2540] text-[#64748B] dark:text-[#CBD5E1] hover:text-[#0A2540] dark:hover:text-white border border-[#EAE4D3] dark:border-[#1B456E]'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{label}</span>
                    {isCurrent && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-[#0A2540] text-[#FFC21A] dark:bg-white dark:text-[#0A2540] font-mono">
                        YOU
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedRole !== currentRole && onSwitchRole && (
              <button
                type="button"
                onClick={() => onSwitchRole(selectedRole)}
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-[#0A2540] dark:text-[#FFC21A] hover:underline shrink-0"
              >
                <span>Switch active role</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Modal Body: Two-Column Bento Layout */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left Column: Steps Timeline (5 Cols) */}
            <div className="md:col-span-5 space-y-3 flex flex-col justify-between">
              {/* Role Summary Card */}
              <div className="p-3.5 rounded-xl bg-[#FAF6EC] dark:bg-[#071D33] border border-[#FFEDB8] dark:border-[#1B456E] space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#FFC21A] text-[#0A2540] flex items-center justify-center font-bold">
                    <currentGuide.icon className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <h3 className="text-xs font-bold text-[#0A2540] dark:text-white leading-tight">
                    {currentGuide.roleTitle}
                  </h3>
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-[#CBD5E1] leading-relaxed">
                  {currentGuide.summary}
                </p>
                <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-[#8A740C] dark:text-[#FFE08A]">
                  <Clock className="w-3 h-3" />
                  <span>Benchmark: {currentGuide.targetBenchmark}</span>
                </div>
              </div>

              {/* Step Sequence Pills */}
              <div className="space-y-1.5 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] font-mono px-1">
                  Workflow Sequence ({steps.length} Steps)
                </div>
                {steps.map((st, idx) => {
                  const isActive = idx === activeStepIndex;
                  return (
                    <button
                      key={st.step}
                      type="button"
                      onClick={() => setActiveStepIndex(idx)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                        isActive
                          ? 'bg-[#0A2540] text-white dark:bg-[#1B456E] shadow-sm font-bold'
                          : 'bg-white dark:bg-[#0A2540] text-[#0A2540] dark:text-[#CBD5E1] hover:bg-[#FAF6EC] dark:hover:bg-[#0F355A] border border-[#EAE4D3] dark:border-[#1B456E]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isActive
                              ? 'bg-[#FFC21A] text-[#0A2540]'
                              : 'bg-[#FAF6EC] dark:bg-[#0F355A] text-[#64748B] dark:text-[#94A3B8]'
                          }`}
                        >
                          {st.step}
                        </span>
                        <span className="truncate">{st.title}</span>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                          isActive ? 'text-[#FFC21A] translate-x-0.5' : 'text-[#94A3B8]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Primary Direct Action Button */}
              <button
                type="button"
                onClick={() => handleNavigate(currentGuide.primaryActionRoute)}
                className="w-full py-2 px-3 rounded-xl bg-[#FFC21A] hover:bg-[#F5A300] text-[#0A2540] text-xs font-extrabold flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <span>{currentGuide.primaryActionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Right Column: Step Deep Dive (7 Cols) */}
            <div className="md:col-span-7 bg-[#FFFDF8] dark:bg-[#071D33] rounded-xl border border-[#EAE4D3] dark:border-[#1B456E] p-4 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {/* Step Header */}
                <div className="flex items-center justify-between border-b border-[#EAE4D3] dark:border-[#1B456E] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#FFC21A] text-[#0A2540] font-mono text-[10px] font-bold">
                      STEP {activeStep.step} OF {steps.length}
                    </span>
                    <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                      Target: {activeStep.target}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={activeStepIndex === 0}
                      onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                      className="px-2 py-1 rounded-md text-[11px] font-bold bg-white dark:bg-[#0A2540] border border-[#EAE4D3] dark:border-[#1B456E] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF6EC]"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={activeStepIndex === steps.length - 1}
                      onClick={() => setActiveStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
                      className="px-2 py-1 rounded-md text-[11px] font-bold bg-white dark:bg-[#0A2540] border border-[#EAE4D3] dark:border-[#1B456E] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF6EC]"
                    >
                      Next
                    </button>
                  </div>
                </div>

                {/* Step Title & Main Explanation */}
                <div>
                  <h4 className="text-base font-bold text-[#0A2540] dark:text-white">
                    {activeStep.title}
                  </h4>
                  <p className="text-xs text-[#475569] dark:text-[#CBD5E1] mt-1.5 leading-relaxed">
                    {activeStep.desc}
                  </p>
                </div>

                {/* Click Saving Pro-Tip Box */}
                <div className="p-3 rounded-xl bg-[#FFF7E0] dark:bg-[#0F355A] border border-[#FFEDB8] dark:border-[#1B456E] flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-[#FFC21A] text-[#0A2540] flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-3 h-3 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-[#0A2540] dark:text-white leading-tight">
                      Click-Saving & Efficiency Shortcut
                    </div>
                    <p className="text-[11px] text-[#713F12] dark:text-[#FFE08A] mt-0.5 leading-snug">
                      {activeStep.hint}
                    </p>
                  </div>
                </div>

                {/* Shortcuts & Quick Actions Cheat Sheet */}
                <div className="pt-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] font-mono mb-1.5">
                    Universal Global Shortcuts
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-white dark:bg-[#0A2540] border border-[#EAE4D3] dark:border-[#1B456E] flex items-center justify-between">
                      <span className="text-[#64748B] dark:text-[#CBD5E1]">Spotlight Search</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-[#FAF6EC] dark:bg-[#0F355A] font-mono text-[10px] font-bold border border-[#EAE4D3]">
                        ⌘K
                      </kbd>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#0A2540] border border-[#EAE4D3] dark:border-[#1B456E] flex items-center justify-between">
                      <span className="text-[#64748B] dark:text-[#CBD5E1]">Dismiss Dialogs</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-[#FAF6EC] dark:bg-[#0F355A] font-mono text-[10px] font-bold border border-[#EAE4D3]">
                        ESC
                      </kbd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step Action Trigger Footer */}
              <div className="pt-3 border-t border-[#EAE4D3] dark:border-[#1B456E] flex items-center justify-between gap-3">
                <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                  Ready to test this step live?
                </span>
                <button
                  type="button"
                  onClick={() => handleNavigate(activeStep.route)}
                  className="px-3 py-1.5 rounded-lg bg-[#0A2540] hover:bg-[#0F355A] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>{activeStep.actionLabel}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#FFC21A]" />
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 bg-[#FAF6EC] dark:bg-[#071D33] border-t border-[#EAE4D3] dark:border-[#1B456E] flex items-center justify-between text-xs">
            <span className="text-[#64748B] dark:text-[#94A3B8] font-medium text-[11px]">
              You can reopen this Quick Start Guide anytime from the top navigation bar.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-full bg-white dark:bg-[#0A2540] border border-[#CBD5E1] dark:border-[#1B456E] hover:bg-[#FAF6EC] font-bold text-[#0A2540] dark:text-white transition-colors"
            >
              Close Guide
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
