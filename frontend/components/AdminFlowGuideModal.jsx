import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  Activity,
  Users,
  FileText,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Search,
  ArrowRight,
  RotateCcw,
  Compass,
  Award,
  Sliders,
  Receipt,
  UserCheck,
  UserX,
  Plus
} from 'lucide-react';

export default function AdminFlowGuideModal({
  isOpen,
  onClose,
  onSwitchTab,
  onOpenAddStaff
}) {
  const [activeMode, setActiveMode] = useState('walkthrough'); // 'walkthrough' | 'blueprint' | 'quiz' | 'cheatsheet'
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Simulator State Step 1: Analytics KPI
  const [metricView, setMetricView] = useState('revenue'); // 'revenue' | 'intake' | 'alerts'

  // Simulator State Step 2: Staff Toggle
  const [simStaffStatus, setSimStaffStatus] = useState(true);

  // Simulator State Step 3: Audit Filter
  const [simAuditCategory, setSimAuditCategory] = useState('ALL');

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Keyboard navigation (Esc to close, Left/Right for steps)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && activeMode === 'walkthrough') {
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      } else if (e.key === 'ArrowLeft' && activeMode === 'walkthrough') {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeMode, totalSteps, onClose]);

  if (!isOpen) return null;

  // 4 Crisp Executive Steps
  const steps = [
    {
      num: 1,
      badge: 'Step 01 • Oversight',
      title: 'Executive Hospital Analytics & Key Metrics',
      subtitle: 'Monitor facility footfall, aggregate revenue, active staff on duty, and clinical risk flags.',
      icon: TrendingUp,
      color: '#1e40af',
      bg: '#dbeafe',
      actions: [
        'Review the 4 Executive KPI cards: Total Intake, Next Queued Token, Avg Triage Velocity, and AI Clinical Alerts.',
        'Track hourly patient arrivals and departmental load distribution.',
        'Monitor active financial collections and cashless government scheme clearances.'
      ],
      proTip: 'Use Executive Analytics to anticipate peak OPD footfall and balance doctor shift staffing.',
      actionBtnText: 'View Executive Dashboard',
      actionFn: () => {
        onSwitchTab?.('dashboard');
        onClose();
      }
    },
    {
      num: 2,
      badge: 'Step 02 • Personnel',
      title: 'Staff Duty Roster & Credential Management',
      subtitle: 'Oversee physicians, triage nurses, and cashier operators across all hospital wings.',
      icon: Users,
      color: '#0284c7',
      bg: '#e0f2fe',
      actions: [
        'Switch to "Staff Directory" to view active healthcare providers by department and shift.',
        'Toggle active duty availability (e.g. mark staff On-Duty vs On-Leave).',
        'Click "+ Add New Staff Member" to onboard new physicians or administrative desk operators.'
      ],
      proTip: 'Deactivating a doctor temporarily hides them from the Reception queue intake dropdown.',
      actionBtnText: 'Inspect Staff Directory',
      actionFn: () => {
        onSwitchTab?.('staff');
        onClose();
      }
    },
    {
      num: 3,
      badge: 'Step 03 • Governance',
      title: 'Clinical Audit Trail & Regulatory Compliance',
      subtitle: 'Inspect immutable records of CDSS diagnostic overrides, billing adjustments, and role access logs.',
      icon: FileText,
      color: '#059669',
      bg: '#d1fae5',
      actions: [
        'Open "Compliance Audit Trail" to review all tamper-evident system transactions.',
        'Filter by category: CDSS Overrides, Billing Adjustments, Triage Edits, and User Auth.',
        'Export audit records as structured reports for national healthcare accreditation inspections.'
      ],
      proTip: 'Every clinical override requires an associated medical justification note for legal liability protection.',
      actionBtnText: 'Open Audit Log Trail',
      actionFn: () => {
        onSwitchTab?.('audit');
        onClose();
      }
    },
    {
      num: 4,
      badge: 'Step 04 • Supervision',
      title: 'Supervisory Role Switching & Department Control',
      subtitle: 'Directly observe and support front-desk operations across Reception, Doctor, and Cashier.',
      icon: ShieldCheck,
      color: '#1e3a8a',
      bg: '#dbeafe',
      actions: [
        'Use the top role switcher in the navigation bar to inspect any department live.',
        'Verify front desk queue velocity without interrupting active patient consultations.',
        'Supervise cashier settlement accuracy and end-of-day bank reconciliations.'
      ],
      proTip: 'As an Executive Administrator, your account has full sovereign oversight across all medical modules.',
      actionBtnText: 'Finish Guide & Explore Portal',
      actionFn: () => {
        onClose();
      }
    }
  ];

  const currentStepData = steps[currentStep - 1];

  // Quick 2-Question Quiz for Admin
  const quizQuestions = [
    {
      id: 'qa1',
      question: 'Why are Physician CDSS (Clinical Decision Support) Overrides logged in the Audit Trail?',
      options: [
        { id: 'a', text: 'To automatically deduct physician consultation pay.' },
        { id: 'b', text: 'For legal compliance, patient safety oversight, and accreditation governance.', correct: true },
        { id: 'c', text: 'To delete the prescription before the pharmacy sees it.' }
      ],
      explanation: 'Audit logs preserve immutable proof of physician clinical intent for medical-legal compliance.'
    },
    {
      id: 'qa2',
      question: 'What happens when an administrator deactivates a doctor in the Staff Directory?',
      options: [
        { id: 'a', text: 'The doctor is temporarily hidden from new Reception queue assignments.', correct: true },
        { id: 'b', text: 'All past patient records of that doctor are deleted.' },
        { id: 'c', text: 'The hospital network connection is shut down.' }
      ],
      explanation: 'Toggling active duty status manages shift availability without affecting historical patient charts.'
    }
  ];

  const handleSelectQuiz = (qId, optId) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [qId]: optId }));
  };

  const getQuizScore = () => {
    let score = 0;
    quizQuestions.forEach((q) => {
      const correctOpt = q.options.find((o) => o.correct)?.id;
      if (quizAnswers[q.id] === correctOpt) score += 1;
    });
    return score;
  };

  return (
    <div
      className="m3-modal-backdrop admin-theme"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16
      }}
    >
      <div
        className="card m3-dialog"
        style={{
          width: '100%',
          maxWidth: 900,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface, #ffffff)',
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(30, 58, 138, 0.25), 0 0 0 1px var(--border-default, #cbd5e1)',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.25s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-default, #cbd5e1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #dbeafe, #ffffff)',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              className="stat-squircle-badge badge-bg-blue"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(30, 58, 138, 0.35)'
              }}
            >
              <ShieldCheck size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: '#1e40af',
                    backgroundColor: '#dbeafe',
                    border: '1px solid #93c5fd',
                    padding: '2px 8px',
                    borderRadius: 9999,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}
                >
                  Executive Quick Guide
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>•</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1e3a8a' }}>
                  Hospital Governance & Oversight
                </span>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                Admin Portal Operational Flow (4 Quick Steps)
              </h3>
            </div>
          </div>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                display: 'inline-flex',
                background: 'rgba(30, 58, 138, 0.08)',
                padding: 3,
                borderRadius: 10,
                border: '1px solid rgba(30, 58, 138, 0.15)'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveMode('walkthrough')}
                style={{
                  border: 'none',
                  background: activeMode === 'walkthrough' ? '#ffffff' : 'transparent',
                  color: activeMode === 'walkthrough' ? '#1e3a8a' : '#475569',
                  fontWeight: 800,
                  fontSize: 11.5,
                  padding: '5px 12px',
                  borderRadius: 7,
                  cursor: 'pointer',
                  boxShadow: activeMode === 'walkthrough' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                4-Step Flow
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('blueprint')}
                style={{
                  border: 'none',
                  background: activeMode === 'blueprint' ? '#ffffff' : 'transparent',
                  color: activeMode === 'blueprint' ? '#1e3a8a' : '#475569',
                  fontWeight: 800,
                  fontSize: 11.5,
                  padding: '5px 12px',
                  borderRadius: 7,
                  cursor: 'pointer',
                  boxShadow: activeMode === 'blueprint' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                Blueprint
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('quiz')}
                style={{
                  border: 'none',
                  background: activeMode === 'quiz' ? '#ffffff' : 'transparent',
                  color: activeMode === 'quiz' ? '#1e3a8a' : '#475569',
                  fontWeight: 800,
                  fontSize: 11.5,
                  padding: '5px 12px',
                  borderRadius: 7,
                  cursor: 'pointer',
                  boxShadow: activeMode === 'quiz' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                Quick Quiz
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('cheatsheet')}
                style={{
                  border: 'none',
                  background: activeMode === 'cheatsheet' ? '#ffffff' : 'transparent',
                  color: activeMode === 'cheatsheet' ? '#1e3a8a' : '#475569',
                  fontWeight: 800,
                  fontSize: 11.5,
                  padding: '5px 12px',
                  borderRadius: 7,
                  cursor: 'pointer',
                  boxShadow: activeMode === 'cheatsheet' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                Cheatsheet
              </button>
            </div>

            <button
              onClick={onClose}
              className="icon-btn"
              title="Close Guide (Esc)"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(0,0,0,0.04)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* TAB 1: 4-STEP WALKTHROUGH */}
          {activeMode === 'walkthrough' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Stepper Pills */}
              <div
                style={{
                  background: 'var(--bg-subtle, #f8fafc)',
                  padding: '12px 16px',
                  borderRadius: 14,
                  border: '1px solid var(--border-default, #cbd5e1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  overflowX: 'auto'
                }}
              >
                {steps.map((st) => {
                  const isCurrent = currentStep === st.num;
                  const isPassed = currentStep > st.num;

                  return (
                    <button
                      key={st.num}
                      type="button"
                      onClick={() => setCurrentStep(st.num)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '6px 12px',
                        borderRadius: 10,
                        border: isCurrent
                          ? '1.5px solid #1e3a8a'
                          : isPassed
                          ? '1px solid #86efac'
                          : '1px solid transparent',
                        background: isCurrent
                          ? '#dbeafe'
                          : isPassed
                          ? '#f0fdf4'
                          : 'transparent',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 800,
                          background: isCurrent
                            ? '#1e3a8a'
                            : isPassed
                            ? '#059669'
                            : 'rgba(0,0,0,0.06)',
                          color: isCurrent || isPassed ? '#ffffff' : 'var(--text-muted)'
                        }}
                      >
                        {isPassed ? <CheckCircle2 size={13} strokeWidth={3} /> : st.num}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: isCurrent ? 800 : 600,
                          color: isCurrent
                            ? '#1e40af'
                            : isPassed
                            ? '#065f46'
                            : 'var(--text-secondary)'
                        }}
                      >
                        {st.title.split('&')[0].trim()}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 2-Column Split: Protocol Left, Interactive Simulator Right */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                  gap: 20,
                  alignItems: 'stretch'
                }}
              >
                {/* Left Column */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-default, #cbd5e1)',
                    borderRadius: 16,
                    padding: 22,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: currentStepData.color,
                          backgroundColor: currentStepData.bg,
                          padding: '3px 8px',
                          borderRadius: 6,
                          letterSpacing: '0.04em'
                        }}
                      >
                        {currentStepData.badge}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>•</span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        Step {currentStep} of {totalSteps}
                      </span>
                    </div>

                    <h4 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                      {currentStepData.title}
                    </h4>

                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {currentStepData.subtitle}
                    </p>

                    {/* Action Checklist */}
                    <div
                      style={{
                        background: 'var(--bg-subtle, #f8fafc)',
                        borderRadius: 12,
                        padding: '14px 16px',
                        border: '1px solid var(--border-default, #cbd5e1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase' }}>
                        Executive Governance Actions:
                      </span>
                      {currentStepData.actions.map((act, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 9999,
                              background: '#dbeafe',
                              color: '#1e40af',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              fontWeight: 800,
                              flexShrink: 0,
                              marginTop: 1
                            }}
                          >
                            {i + 1}
                          </div>
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>

                    {/* Pro Tip */}
                    <div
                      style={{
                        background: '#dbeafe',
                        border: '1px solid #93c5fd',
                        borderRadius: 12,
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10
                      }}
                    >
                      <Sparkles size={16} color="#1e40af" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: 11.5, color: '#1e3a8a', lineHeight: 1.4 }}>
                        <strong>Governance Tip:</strong> {currentStepData.proTip}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={currentStepData.actionFn}
                    className="m3-btn m3-btn-filled"
                    style={{
                      height: 38,
                      fontSize: 12.5,
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
                      color: '#ffffff',
                      boxShadow: '0 2px 8px rgba(30, 58, 138, 0.3)',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <span>{currentStepData.actionBtnText}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* Right Column: Live Simulator */}
                <div
                  style={{
                    background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
                    border: '1px solid var(--border-default, #cbd5e1)',
                    borderRadius: 16,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div className="stat-card-accent-blob blob-blue" style={{ top: -20, right: -20, opacity: 0.3 }} />

                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        ⚡ Live Governance Simulator
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: '#ecfdf5',
                          color: '#065f46',
                          border: '1px solid #a7f3d0',
                          padding: '2px 8px',
                          borderRadius: 9999
                        }}
                      >
                        Interactive Preview
                      </span>
                    </div>

                    {/* SIMULATOR STEP 1: ANALYTICS METRIC TOGGLE */}
                    {currentStep === 1 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {[
                            { id: 'revenue', label: 'Collections' },
                            { id: 'intake', label: 'Patient Inflow' },
                            { id: 'alerts', label: 'Sentinel Alerts' }
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setMetricView(tab.id)}
                              style={{
                                flex: 1,
                                padding: '6px 4px',
                                fontSize: 10.5,
                                fontWeight: 700,
                                borderRadius: 6,
                                border: metricView === tab.id ? '1.5px solid #1e3a8a' : '1px solid var(--border-default)',
                                background: metricView === tab.id ? '#dbeafe' : '#ffffff',
                                color: metricView === tab.id ? '#1e40af' : 'var(--text-secondary)',
                                cursor: 'pointer'
                              }}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        <div style={{ background: '#ffffff', borderRadius: 12, padding: 16, border: '1px solid var(--border-default)', textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {metricView === 'revenue' ? 'Gross OPD Collections (Reconciled)' : metricView === 'intake' ? 'Today Total Walk-in Registrations' : 'Sentinel Clinical Risk Warnings'}
                          </div>
                          <div style={{ fontSize: 28, fontWeight: 900, color: '#1e3a8a', margin: '4px 0' }}>
                            {metricView === 'revenue' ? '₹3,42,800' : metricView === 'intake' ? '142 Patients' : '3 High-Alert Cases'}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#059669', fontWeight: 700 }}>
                            {metricView === 'revenue' ? '+18.4% vs Yesterday' : metricView === 'intake' ? 'Target velocity 5.2m avg' : '100% Attended by Dr. Patel'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SIMULATOR STEP 2: STAFF DUTY TOGGLE */}
                    {currentStep === 2 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div
                          style={{
                            background: '#ffffff',
                            borderRadius: 12,
                            padding: 14,
                            border: '1px solid var(--border-default)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
                              Dr. Kiran Patel (Senior Physician)
                            </div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                              Station 03 • Shift: 08:00 - 14:00
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              background: simStaffStatus ? '#ecfdf5' : '#fee2e2',
                              color: simStaffStatus ? '#065f46' : '#991b1b',
                              border: simStaffStatus ? '1px solid #a7f3d0' : '1px solid #fca5a5',
                              padding: '2px 8px',
                              borderRadius: 9999
                            }}
                          >
                            {simStaffStatus ? 'ON DUTY ✓' : 'OFF DUTY'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSimStaffStatus(!simStaffStatus)}
                          className="m3-btn"
                          style={{
                            background: simStaffStatus ? '#fee2e2' : '#ecfdf5',
                            color: simStaffStatus ? '#991b1b' : '#065f46',
                            border: simStaffStatus ? '1px solid #fca5a5' : '1px solid #a7f3d0',
                            fontWeight: 700,
                            fontSize: 11.5,
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          {simStaffStatus ? <UserX size={14} /> : <UserCheck size={14} />}
                          <span>{simStaffStatus ? 'Simulate Mark Off-Duty (On-Break)' : 'Simulate Mark Active On-Duty'}</span>
                        </button>
                      </div>
                    )}

                    {/* SIMULATOR STEP 3: AUDIT LOG VIEWER */}
                    {currentStep === 3 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {['ALL', 'CDSS_OVERRIDE', 'BILLING'].map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setSimAuditCategory(cat)}
                              style={{
                                flex: 1,
                                padding: '5px 4px',
                                fontSize: 10,
                                fontWeight: 700,
                                borderRadius: 6,
                                border: simAuditCategory === cat ? '1.5px solid #1e3a8a' : '1px solid var(--border-default)',
                                background: simAuditCategory === cat ? '#dbeafe' : '#ffffff',
                                color: simAuditCategory === cat ? '#1e40af' : 'var(--text-secondary)',
                                cursor: 'pointer'
                              }}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        <div style={{ background: '#ffffff', borderRadius: 10, padding: 12, border: '1px solid var(--border-default)', fontSize: 11 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <strong>Dr. Kiran Patel (10:42 AM)</strong>
                            <span style={{ fontSize: 9.5, fontWeight: 800, color: '#1e40af', background: '#dbeafe', padding: '1px 6px', borderRadius: 4 }}>
                              CDSS OVERRIDE
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: 10.5 }}>
                            Patient MRN-2026-0142: Confirmed Telmisartan titration with repeat lipid panel in 14 days.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SIMULATOR STEP 4: INTER-DEPARTMENTAL SWITCHER */}
                    {currentStep === 4 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                          Click a Department to supervise its live operational status:
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {[
                            { name: 'Reception Triage', desk: 'Counter 01', status: 'Live Footfall Normal', color: '#d97706' },
                            { name: 'Doctor OPD', desk: 'Room 03', status: 'In Consultation', color: '#0077B6' },
                            { name: 'Cashier Desk', desk: 'Counter B-02', status: '100% Reconciled', color: '#059669' },
                            { name: 'Admin Hub', desk: 'Supervisory', status: 'All Systems Active', color: '#1e3a8a' }
                          ].map((d, i) => (
                            <div key={i} style={{ padding: 10, borderRadius: 8, border: `1px solid ${d.color}40`, background: `${d.color}08` }}>
                              <div style={{ fontSize: 11.5, fontWeight: 800, color: d.color }}>{d.name}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.desk} • {d.status}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stepper Footer Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-subtle, #f1f5f9)' }}>
                    <button
                      type="button"
                      disabled={currentStep === 1}
                      onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
                      className="m3-btn m3-btn-sm"
                      style={{
                        background: '#ffffff',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)',
                        fontSize: 11,
                        opacity: currentStep === 1 ? 0.4 : 1
                      }}
                    >
                      <ChevronLeft size={13} />
                      <span>Previous</span>
                    </button>

                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                      Step {currentStep} / {totalSteps}
                    </span>

                    <button
                      type="button"
                      disabled={currentStep === totalSteps}
                      onClick={() => setCurrentStep((prev) => Math.min(prev + 1, totalSteps))}
                      className="m3-btn m3-btn-sm"
                      style={{
                        background: '#dbeafe',
                        border: '1px solid #93c5fd',
                        color: '#1e40af',
                        fontWeight: 800,
                        fontSize: 11,
                        opacity: currentStep === totalSteps ? 0.4 : 1
                      }}
                    >
                      <span>Next</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BLUEPRINT */}
          {activeMode === 'blueprint' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              {[
                { step: 1, title: '1. Executive KPI Analytics', desc: 'Real-time hospital footfall, revenue reconciliation, and sentinel warnings.', icon: TrendingUp, color: '#1e40af' },
                { step: 2, title: '2. Staff Duty Directory', desc: 'Physician, nurse, and cashier shift management with availability toggles.', icon: Users, color: '#0284c7' },
                { step: 3, title: '3. Compliance Audit Trail', desc: 'Immutable CDSS override logs and regulatory inspection export readiness.', icon: FileText, color: '#059669' },
                { step: 4, title: '4. Inter-Desk Oversight', desc: 'Cross-departmental live switching between Reception, Doctor, and Billing.', icon: ShieldCheck, color: '#1e3a8a' }
              ].map((item) => (
                <div
                  key={item.step}
                  onClick={() => {
                    setCurrentStep(item.step);
                    setActiveMode('walkthrough');
                  }}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-default)',
                    borderRadius: 14,
                    padding: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${item.color}15`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <item.icon size={16} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: item.color }}>STEP 0{item.step}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: QUIZ */}
          {activeMode === 'quiz' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#dbeafe', padding: '12px 16px', borderRadius: 12, border: '1px solid #93c5fd', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#1e40af' }}>
                  Hospital Governance Quick Check (2 Questions)
                </span>
                {quizSubmitted && (
                  <span style={{ fontSize: 11, fontWeight: 800, background: '#059669', color: '#ffffff', padding: '2px 8px', borderRadius: 9999 }}>
                    Score: {getQuizScore()} / 2
                  </span>
                )}
              </div>

              {quizQuestions.map((q, idx) => {
                const picked = quizAnswers[q.id];

                return (
                  <div key={q.id} style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                      Q{idx + 1}: {q.question}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {q.options.map((opt) => {
                        const isSelected = picked === opt.id;
                        let bg = '#f8fafc';
                        let border = 'var(--border-default)';
                        let color = 'var(--text-primary)';

                        if (quizSubmitted) {
                          if (opt.correct) {
                            bg = '#d1fae5';
                            border = '#10b981';
                            color = '#065f46';
                          } else if (isSelected && !opt.correct) {
                            bg = '#fee2e2';
                            border = '#ef4444';
                            color = '#991b1b';
                          }
                        } else if (isSelected) {
                          bg = '#dbeafe';
                          border = '#1e3a8a';
                          color = '#1e40af';
                        }

                        return (
                          <div
                            key={opt.id}
                            onClick={() => handleSelectQuiz(q.id, opt.id)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 8,
                              border: `1px solid ${border}`,
                              background: bg,
                              color: color,
                              fontSize: 11.5,
                              fontWeight: isSelected ? 700 : 500,
                              cursor: quizSubmitted ? 'default' : 'pointer'
                            }}
                          >
                            {opt.text}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                {quizSubmitted ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuizSubmitted(false);
                      setQuizAnswers({});
                    }}
                    className="m3-btn m3-btn-sm"
                    style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', fontWeight: 700 }}
                  >
                    <RotateCcw size={13} />
                    <span>Retake Quiz</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={Object.keys(quizAnswers).length < 2}
                    onClick={() => setQuizSubmitted(true)}
                    className="m3-btn m3-btn-filled"
                    style={{
                      background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
                      color: '#ffffff',
                      fontWeight: 800,
                      opacity: Object.keys(quizAnswers).length < 2 ? 0.5 : 1
                    }}
                  >
                    <span>Check Answers</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CHEATSHEET */}
          {activeMode === 'cheatsheet' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              <div style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 12, padding: 14 }}>
                <h4 style={{ fontSize: 12.5, fontWeight: 800, color: '#1e40af', margin: '0 0 6px' }}>
                  Accreditation Readiness
                </h4>
                <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  Maintain 100% logging of high-severity CDSS overrides. Periodic audits are mandated for clinical quality certification.
                </p>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 12, padding: 14 }}>
                <h4 style={{ fontSize: 12.5, fontWeight: 800, color: '#059669', margin: '0 0 6px' }}>
                  Financial Reconciliation
                </h4>
                <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  Cashier settlement reports must balance PM-JAY cashless credits against physical cash & UPI transactions at 16:00 shift end.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--border-default, #cbd5e1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle, #f8fafc)'
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Use <strong>← / → arrow keys</strong> to navigate • <strong>Esc</strong> to close
          </div>

          <button
            type="button"
            onClick={onClose}
            className="m3-btn m3-btn-filled"
            style={{
              background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 11.5
            }}
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
