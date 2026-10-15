import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  Printer,
  FileText,
  Clock,
  UploadCloud,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  QrCode,
  Users,
  Search,
  HelpCircle,
  Award,
  Layers,
  Volume2
} from 'lucide-react';

export default function ReceptionistFlowGuideModal({
  isOpen,
  onClose,
  onOpenRegister,
  onOpenSampleSlip,
  onOpenSampleQuestionnaire,
  onSwitchTab
}) {
  const [activeTab, setActiveTab] = useState('walkthrough'); // 'walkthrough' | 'diagram' | 'quiz' | 'cheatsheet'
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  // Simulator State for Step 1: Token & Room Footfall
  const [simToken, setSimToken] = useState(141);
  const [selectedStation, setSelectedStation] = useState('st3');

  // Simulator State for Step 2: Instant Registration
  const [regData, setRegData] = useState({
    name: 'Walk-in Patient',
    age: '45',
    gender: 'Female',
    insurance: 'CASH',
    abhaVerified: false
  });

  // Simulator State for Step 3: Token Printer
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);

  // Simulator State for Step 4: Questionnaire MCQ
  const [selectedMcq, setSelectedMcq] = useState(null);

  // Simulator State for Step 5: Queue Priority
  const [simPriority, setSimPriority] = useState('standard');

  // Simulator State for Step 6: Report Upload
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Simulator State for Step 7: Doctor Callout
  const [isCalling, setIsCalling] = useState(false);
  const [callAnnounced, setCallAnnounced] = useState(false);

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Keyboard navigation (Esc to close, Left/Right for steps)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && activeTab === 'walkthrough') {
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      } else if (e.key === 'ArrowLeft' && activeTab === 'walkthrough') {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, totalSteps, onClose]);

  if (!isOpen) return null;

  // Step Definitions
  const steps = [
    {
      num: 1,
      badge: 'Step 01 • Operations Overview',
      title: 'Command Center & Live Token Tracking',
      subtitle: 'Monitor morning footfall, queue velocity, and doctor consultation loads.',
      icon: Activity,
      color: '#d97706',
      bg: '#fef3c7',
      actions: [
        'Read the top banner to check the next sequential token number (#TK-141) before issuing slips.',
        'Review the 4 Live KPIs: Today\'s Intake, Next Token, Avg Triage Speed (5.2m), and AI Insights Ready.',
        'Check Doctor Station Capacity bars to distribute patient load evenly across consult rooms.'
      ],
      proTip: 'Peak OPD rush occurs between 09:00 AM – 11:30 AM. Keep the registration screen ready for rapid intake.',
      actionBtnText: 'View Dashboard Metrics',
      actionFn: () => {
        onSwitchTab?.('dashboard');
        onClose();
      }
    },
    {
      num: 2,
      badge: 'Step 02 • Patient Intake',
      title: 'Patient Demographics & ABHA Verification',
      subtitle: 'Register walk-in patients in under 60 seconds with 1-click PM-JAY and ABHA auto-fill.',
      icon: UserPlus,
      color: '#0284c7',
      bg: '#e0f2fe',
      actions: [
        'Click "+ Register New Patient" from the dashboard banner or sidebar shortcut.',
        'Enter full name, age, phone number, and chief complaint.',
        'For Ayushman Bharat patients, click "⚡ PM-JAY 100% Cashless" to verify national ABHA ID instantly.'
      ],
      proTip: 'Always verify the WhatsApp contact number — digital prescriptions and billing receipts are dispatched there automatically.',
      actionBtnText: '+ Launch Live Registration Form',
      actionFn: () => {
        onOpenRegister?.();
        onClose();
      }
    },
    {
      num: 3,
      badge: 'Step 03 • Queue Issuance',
      title: 'Sequential Token Slip Printing',
      subtitle: 'Issue physical thermal token receipts with QR codes for waiting bay announcements.',
      icon: Printer,
      color: '#d97706',
      bg: '#fef3c7',
      actions: [
        'Upon submitting registration, the official OPD Token Slip preview opens automatically.',
        'Click "Print Token Slip" to output the receipt on your front desk thermal slip printer.',
        'Hand the slip to the patient: it displays their token number, room assignment, and scan QR code.'
      ],
      proTip: 'If a patient loses their slip, you can reprint it anytime from the Live Queue table via the "Print Slip" button.',
      actionBtnText: 'Inspect Sample Token Slip',
      actionFn: () => {
        onOpenSampleSlip?.();
        onClose();
      }
    },
    {
      num: 4,
      badge: 'Step 04 • Clinical Triage',
      title: 'Clinical Intake Questionnaire (MCQ Roster)',
      subtitle: 'Capture symptom duration, prior history, and initial vitals while the patient waits.',
      icon: FileText,
      color: '#8b5cf6',
      bg: '#ede9fe',
      actions: [
        'In the Queue, click "Start MCQ" to launch the adaptive 6-step clinical intake questionnaire.',
        'Patients can complete this on a front-desk tablet or verbally with the receptionist.',
        'Captures Chief Complaints, Pain Score (1-10), Duration, Allergies, and Baseline Vitals.'
      ],
      proTip: 'Completing the questionnaire immediately runs the ClinicalInsight AI model, saving doctors 4+ minutes of consult charting.',
      actionBtnText: 'Open Clinical Questionnaire',
      actionFn: () => {
        onOpenSampleQuestionnaire?.();
        onClose();
      }
    },
    {
      num: 5,
      badge: 'Step 05 • Queue Prioritization',
      title: 'Live OPD Queue Management & Triage Tags',
      subtitle: 'Organize and triage patients into Priority 1 (Urgent), Priority 2 (Standard), and Priority 3 (Routine).',
      icon: Clock,
      color: '#10b981',
      bg: '#d1fae5',
      actions: [
        'Switch to "Live OPD Queue" to see all waiting patients ranked by wait time and clinical severity.',
        'Use the Priority filter tabs (All, Priority 1, Priority 2, Priority 3) to triage urgent cases.',
        'Red border & pill indicate Priority 1 (< 5 min target) requiring immediate doctor escalation.'
      ],
      proTip: 'If a patient shows acute chest pain, breathlessness, or trauma, flag them as "Priority 1" to jump the waiting queue.',
      actionBtnText: 'Go to Live OPD Queue',
      actionFn: () => {
        onSwitchTab?.('queue');
        onClose();
      }
    },
    {
      num: 6,
      badge: 'Step 06 • Diagnostic Ingestion',
      title: 'External Diagnostic Reports Upload',
      subtitle: 'Attach previous blood work, biopsy reports, or DICOM scans brought by the patient.',
      icon: UploadCloud,
      color: '#0284c7',
      bg: '#e0f2fe',
      actions: [
        'Navigate to the "Reports" tab in the sidebar navigation drawer.',
        'Drag & drop laboratory PDF reports, biochemistry panels, or radiology scans.',
        'System automatically OCR-indexes the biomarkers and attaches them to the patient\'s EHR.'
      ],
      proTip: 'Uploaded lab values automatically highlight out-of-range biomarkers (e.g. elevated Creatinine or HbA1c) for the physician.',
      actionBtnText: 'Go to Reports Upload View',
      actionFn: () => {
        onSwitchTab?.('reports');
        onClose();
      }
    },
    {
      num: 7,
      badge: 'Step 07 • Physician Handoff',
      title: 'Automated Handoff to Doctor Consultation',
      subtitle: 'Patient status turns "AI Insights Ready" and alerts Dr. Kiran Patel to call them in.',
      icon: Stethoscope,
      color: '#059669',
      bg: '#ecfdf5',
      actions: [
        'Once Questionnaire and Demographics are submitted, the status turns green ("AI Insights Ready").',
        'Doctor\'s station receives the patient directly in their active consultation queue.',
        'Call the patient token number over the public address system and direct them to Room 03/04.'
      ],
      proTip: 'After the doctor finishes consult, the patient seamlessly advances to Cashier & Pharmacy Counter B-02 for billing settlement.',
      actionBtnText: 'Finish Guide & Explore Reception',
      actionFn: () => {
        onClose();
      }
    }
  ];

  const currentStepData = steps[currentStep - 1];

  // Trigger simulated slip printing
  const handleSimulatePrint = () => {
    setIsPrinting(true);
    setPrintSuccess(false);
    setTimeout(() => {
      setIsPrinting(false);
      setPrintSuccess(true);
    }, 1200);
  };

  // Trigger simulated file upload
  const handleSimulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  // Trigger doctor callout
  const handleSimulateCallout = () => {
    setIsCalling(true);
    setCallAnnounced(false);
    setTimeout(() => {
      setIsCalling(false);
      setCallAnnounced(true);
    }, 1400);
  };

  // Quiz Questions Data
  const quizQuestions = [
    {
      id: 'q1',
      question: 'A walk-in patient arrives clutching their chest with shortness of breath and BP 175/105. What is your priority action?',
      options: [
        { id: 'a', text: 'Ask them to wait until token order is reached.' },
        { id: 'b', text: 'Tag as Priority 1 (Urgent / Staging) and immediately alert Doctor Station 03.', correct: true },
        { id: 'c', text: 'Direct them to the billing cashier first for payment.' }
      ],
      explanation: 'Priority 1 (Urgent) bypasses standard routine wait times with a < 5 min triage target.'
    },
    {
      id: 'q2',
      question: 'Where should you upload historical lab reports (CBC, CT scan, Biopsy) brought by a patient?',
      options: [
        { id: 'a', text: 'External Reports tab in the sidebar for AI OCR ingestion.', correct: true },
        { id: 'b', text: 'Email them to the hospital administrator.' },
        { id: 'c', text: 'Save them only on the front desk desktop folder.' }
      ],
      explanation: 'The Reports tab automatically parses biomarkers and embeds them directly into the Doctor\'s clinical dashboard.'
    },
    {
      id: 'q3',
      question: 'What triggers the patient\'s status to turn into "AI Insights Ready" (Green)?',
      options: [
        { id: 'a', text: 'When the cashier collects the OPD fee.' },
        { id: 'b', text: 'When the 6-step Clinical Intake Questionnaire is submitted.', correct: true },
        { id: 'c', text: 'Only when the doctor manually clicks accept.' }
      ],
      explanation: 'Submitting the intake questionnaire triggers ClinicalInsight AI to score risk and flag recommendations for Dr. Patel.'
    }
  ];

  const handleSelectQuizOption = (qId, optionId) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [qId]: optionId }));
  };

  const calculateQuizScore = () => {
    let score = 0;
    quizQuestions.forEach((q) => {
      const correctOption = q.options.find((o) => o.correct)?.id;
      if (quizAnswers[q.id] === correctOption) score += 1;
    });
    return score;
  };

  return (
    <div
      className="m3-modal-backdrop receptionist-theme"
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
          maxWidth: 960,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface, #ffffff)',
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(217, 119, 6, 0.25), 0 0 0 1px var(--border-default, #e7e5d8)',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.25s ease-out'
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-default, #e7e5d8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #fef3c7, #ffffff)',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              className="stat-squircle-badge badge-bg-yellow"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
              }}
            >
              <Compass size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: '#92400e',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fde68a',
                    padding: '2px 8px',
                    borderRadius: 9999,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}
                >
                  Interactive Front Desk Guide
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>•</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#d97706' }}>
                  Receptionist Operational Training
                </span>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                End-to-End Receptionist Flow & OPD Architecture
              </h3>
            </div>
          </div>

          {/* Navigation Mode Segmented Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                display: 'inline-flex',
                background: 'rgba(245, 158, 11, 0.1)',
                padding: 3,
                borderRadius: 10,
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('walkthrough')}
                style={{
                  border: 'none',
                  background: activeTab === 'walkthrough' ? '#ffffff' : 'transparent',
                  color: activeTab === 'walkthrough' ? '#92400e' : '#78350f',
                  fontWeight: 700,
                  fontSize: 11.5,
                  padding: '5px 12px',
                  borderRadius: 7,
                  cursor: 'pointer',
                  boxShadow: activeTab === 'walkthrough' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                7-Step Flow
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('diagram')}
                style={{
                  border: 'none',
                  background: activeTab === 'diagram' ? '#ffffff' : 'transparent',
                  color: activeTab === 'diagram' ? '#92400e' : '#78350f',
                  fontWeight: 700,
                  fontSize: 11.5,
                  padding: '5px 12px',
                  borderRadius: 7,
                  cursor: 'pointer',
                  boxShadow: activeTab === 'diagram' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Visual Blueprint
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('quiz')}
                style={{
                  border: 'none',
                  background: activeTab === 'quiz' ? '#ffffff' : 'transparent',
                  color: activeTab === 'quiz' ? '#92400e' : '#78350f',
                  fontWeight: 700,
                  fontSize: 11.5,
                  padding: '5px 12px',
                  borderRadius: 7,
                  cursor: 'pointer',
                  boxShadow: activeTab === 'quiz' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Practice Quiz
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cheatsheet')}
                style={{
                  border: 'none',
                  background: activeTab === 'cheatsheet' ? '#ffffff' : 'transparent',
                  color: activeTab === 'cheatsheet' ? '#92400e' : '#78350f',
                  fontWeight: 700,
                  fontSize: 11.5,
                  padding: '5px 12px',
                  borderRadius: 7,
                  cursor: 'pointer',
                  boxShadow: activeTab === 'cheatsheet' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
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

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* TAB 1: 7-STEP INTERACTIVE WALKTHROUGH */}
          {activeTab === 'walkthrough' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Top Step Breadcrumb / Progress Bar */}
              <div
                style={{
                  background: 'var(--bg-subtle, #fbf9f1)',
                  padding: '12px 16px',
                  borderRadius: 14,
                  border: '1px solid var(--border-default, #e7e5d8)',
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
                  const StepIcon = st.icon;

                  return (
                    <button
                      key={st.num}
                      type="button"
                      onClick={() => setCurrentStep(st.num)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '6px 10px',
                        borderRadius: 10,
                        border: isCurrent
                          ? '1px solid #d97706'
                          : isPassed
                          ? '1px solid #86efac'
                          : '1px solid transparent',
                        background: isCurrent
                          ? '#fef3c7'
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
                            ? '#d97706'
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
                          fontSize: 11.5,
                          fontWeight: isCurrent ? 800 : 600,
                          color: isCurrent
                            ? '#92400e'
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

              {/* Step Card (Two Columns: Explanation Left, Interactive Simulator Right) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: 20,
                  alignItems: 'stretch'
                }}
              >
                {/* Left Column: Conceptual & Actionable Guide */}
                <div
                  style={{
                    background: 'var(--bg-surface, #ffffff)',
                    border: '1px solid var(--border-default, #e7e5d8)',
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

                    <h4 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                      {currentStepData.title}
                    </h4>

                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {currentStepData.subtitle}
                    </p>

                    {/* Step Action Checklist */}
                    <div
                      style={{
                        background: 'var(--bg-subtle, #fbf9f1)',
                        borderRadius: 12,
                        padding: '14px 16px',
                        border: '1px solid var(--border-subtle, #f4f3ea)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                        Receptionist Action Protocol:
                      </span>
                      {currentStepData.actions.map((act, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 9999,
                              background: '#fef3c7',
                              color: '#92400e',
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
                        background: '#fef3c7',
                        border: '1px solid #fde68a',
                        borderRadius: 12,
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10
                      }}
                    >
                      <Sparkles size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: 11.5, color: '#92400e', lineHeight: 1.4 }}>
                        <strong>Front Desk Pro Tip:</strong> {currentStepData.proTip}
                      </div>
                    </div>
                  </div>

                  {/* Primary Trigger Button for real action */}
                  <button
                    type="button"
                    onClick={currentStepData.actionFn}
                    className="m3-btn m3-btn-filled"
                    style={{
                      height: 38,
                      fontSize: 12.5,
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <span>{currentStepData.actionBtnText}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* Right Column: The Interactive Simulator Playground */}
                <div
                  style={{
                    background: 'linear-gradient(145deg, #ffffff, #fbf9f1)',
                    border: '1px solid var(--border-default, #e7e5d8)',
                    borderRadius: 16,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div className="stat-card-accent-blob blob-yellow" style={{ top: -20, right: -20, opacity: 0.4 }} />

                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        ⚡ Live Simulator Playground
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
                        Interactive Practice
                      </span>
                    </div>

                    {/* SIMULATOR STEP 1: TOKEN & STATION CAPACITY */}
                    {currentStep === 1 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Live OPD Sequential Token</div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: '#d97706' }}>#{simToken}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSimToken((prev) => prev + 1)}
                            className="m3-btn m3-btn-sm"
                            style={{
                              background: '#fef3c7',
                              color: '#92400e',
                              border: '1px solid #fde68a',
                              fontWeight: 700,
                              fontSize: 11.5
                            }}
                          >
                            + Simulate Walk-in (+1)
                          </button>
                        </div>

                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                          Click a Doctor Station to inspect load:
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {[
                            { id: 'st3', name: 'Dr. Kiran Patel', room: 'Room 03', queue: 4, wait: '5.8 min', max: 6, color: '#0284c7' },
                            { id: 'st1', name: 'Dr. Swaminathan', room: 'Room 01', queue: 2, wait: '7.2 min', max: 5, color: '#10b981' }
                          ].map((st) => (
                            <div
                              key={st.id}
                              onClick={() => setSelectedStation(st.id)}
                              style={{
                                padding: 12,
                                borderRadius: 10,
                                border: selectedStation === st.id ? `2px solid ${st.color}` : '1px solid var(--border-default)',
                                background: selectedStation === st.id ? 'rgba(2, 132, 199, 0.05)' : '#ffffff',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-primary)' }}>{st.name}</div>
                              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 6 }}>{st.room}</div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 700 }}>
                                <span>Queue: {st.queue}/{st.max}</span>
                                <span style={{ color: st.color }}>{st.wait}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SIMULATOR STEP 2: INSTANT REGISTRATION FORM */}
                    {currentStep === 2 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ background: '#ffffff', borderRadius: 12, padding: 12, border: '1px solid var(--border-default)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)' }}>Demographics Card</span>
                            {regData.abhaVerified && (
                              <span style={{ fontSize: 10, fontWeight: 800, color: '#059669', background: '#d1fae5', padding: '1px 6px', borderRadius: 4 }}>
                                ABHA Verified ✓
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Name:</span>{' '}
                              <strong>{regData.name}</strong>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Age/Sex:</span>{' '}
                              <strong>{regData.age}y / {regData.gender}</strong>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Scheme:</span>{' '}
                              <strong style={{ color: regData.insurance === 'PMJAY' ? '#059669' : '#d97706' }}>
                                {regData.insurance === 'PMJAY' ? 'Ayushman Bharat PM-JAY (100% Cashless)' : 'Self-Pay Cash'}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setRegData({
                              name: 'Sangeetha Krishnan',
                              age: '52',
                              gender: 'Female',
                              insurance: 'PMJAY',
                              abhaVerified: true
                            });
                          }}
                          className="m3-btn"
                          style={{
                            background: '#ecfdf5',
                            color: '#065f46',
                            border: '1px solid #a7f3d0',
                            fontWeight: 700,
                            fontSize: 11.5,
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          <Zap size={14} color="#059669" />
                          <span>⚡ Test 1-Click PM-JAY & ABHA Auto-Fill</span>
                        </button>
                      </div>
                    )}

                    {/* SIMULATOR STEP 3: THERMAL TOKEN PRINTER */}
                    {currentStep === 3 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div
                          style={{
                            background: '#ffffff',
                            borderRadius: 12,
                            padding: 14,
                            border: '1px dashed var(--border-default)',
                            textAlign: 'center',
                            position: 'relative'
                          }}
                        >
                          <div style={{ fontSize: 10, fontWeight: 800, color: '#d97706', textTransform: 'uppercase' }}>
                            Bright Solutions OPD
                          </div>
                          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', margin: '4px 0' }}>
                            #TK-141
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                            Patient: Sangeetha Krishnan (52F)
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            Room 03 • Dr. Kiran Patel • Bay C
                          </div>
                          <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f8fafc', padding: '3px 8px', borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 10 }}>
                            <QrCode size={12} /> Scan for Live Queue Status
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleSimulatePrint}
                          disabled={isPrinting}
                          className="m3-btn"
                          style={{
                            background: printSuccess ? '#ecfdf5' : '#fef3c7',
                            color: printSuccess ? '#065f46' : '#92400e',
                            border: printSuccess ? '1px solid #a7f3d0' : '1px solid #fde68a',
                            fontWeight: 700,
                            fontSize: 11.5,
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          <Printer size={14} />
                          <span>{isPrinting ? 'Printing Receipt...' : printSuccess ? '✓ Slip Printed Successfully!' : 'Test Print Token Slip'}</span>
                        </button>
                      </div>
                    )}

                    {/* SIMULATOR STEP 4: QUESTIONNAIRE MCQ */}
                    {currentStep === 4 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                          Sample Triage Question: Chief Complaint Duration
                        </div>

                        {[
                          { id: 'opt1', text: 'Acute Onset (< 24 hrs with chest tightness)', urgency: 'Priority 1 (Urgent)', color: '#ef4444' },
                          { id: 'opt2', text: 'Sub-acute (1-3 weeks headache & elevated BP)', urgency: 'Priority 2 (Standard)', color: '#f59e0b' },
                          { id: 'opt3', text: 'Routine Check-up / Medication Refill', urgency: 'Priority 3 (Routine)', color: '#10b981' }
                        ].map((opt) => (
                          <div
                            key={opt.id}
                            onClick={() => setSelectedMcq(opt.id)}
                            style={{
                              padding: 10,
                              borderRadius: 8,
                              border: selectedMcq === opt.id ? `2px solid ${opt.color}` : '1px solid var(--border-default)',
                              background: selectedMcq === opt.id ? '#ffffff' : '#fbf9f1',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: 11,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>{opt.text}</span>
                            <span style={{ fontSize: 9.5, fontWeight: 800, color: opt.color }}>{opt.urgency}</span>
                          </div>
                        ))}

                        {selectedMcq && (
                          <div style={{ fontSize: 11, color: '#059669', background: '#ecfdf5', padding: '6px 10px', borderRadius: 6, border: '1px solid #a7f3d0', fontWeight: 600 }}>
                            ✓ Clinical triage score calibrated. AI Model ready to execute on submission.
                          </div>
                        )}
                      </div>
                    )}

                    {/* SIMULATOR STEP 5: QUEUE PRIORITY TOGGLE */}
                    {currentStep === 5 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                          Simulate Patient Urgency Tagging:
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                          {[
                            { id: 'urgent', label: 'Priority 1 (Urgent)', color: '#ef4444', bg: '#fee2e2' },
                            { id: 'standard', label: 'Priority 2 (Standard)', color: '#d97706', bg: '#fef3c7' },
                            { id: 'routine', label: 'Priority 3 (Routine)', color: '#059669', bg: '#d1fae5' }
                          ].map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setSimPriority(p.id)}
                              style={{
                                flex: 1,
                                padding: '6px 4px',
                                fontSize: 10,
                                fontWeight: 800,
                                borderRadius: 6,
                                border: simPriority === p.id ? `2px solid ${p.color}` : '1px solid var(--border-default)',
                                background: simPriority === p.id ? p.bg : '#ffffff',
                                color: p.color,
                                cursor: 'pointer'
                              }}
                            >
                              {p.label.split(' ')[0]}
                            </button>
                          ))}
                        </div>

                        <div
                          style={{
                            background: '#ffffff',
                            borderRadius: 10,
                            padding: 12,
                            borderLeft: `4px solid ${
                              simPriority === 'urgent' ? '#ef4444' : simPriority === 'standard' ? '#f59e0b' : '#10b981'
                            }`,
                            borderTop: '1px solid var(--border-default)',
                            borderRight: '1px solid var(--border-default)',
                            borderBottom: '1px solid var(--border-default)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>Token #141 • Sangeetha K.</strong>
                            <span
                              style={{
                                fontSize: 9.5,
                                fontWeight: 800,
                                color: simPriority === 'urgent' ? '#dc2626' : simPriority === 'standard' ? '#d97706' : '#059669',
                                background: simPriority === 'urgent' ? '#fee2e2' : simPriority === 'standard' ? '#fef3c7' : '#d1fae5',
                                padding: '2px 6px',
                                borderRadius: 4
                              }}
                            >
                              {simPriority === 'urgent' ? 'Target: < 5 min' : simPriority === 'standard' ? 'Target: < 10 min' : 'Routine'}
                            </span>
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>
                            Chief Complaint: Essential Hypertension • Room 03 (Dr. Kiran Patel)
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SIMULATOR STEP 6: REPORT DROPZONE */}
                    {currentStep === 6 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div
                          onClick={handleSimulateUpload}
                          style={{
                            background: '#ffffff',
                            borderRadius: 12,
                            padding: 16,
                            border: '2px dashed #cbd5e1',
                            textAlign: 'center',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <UploadCloud size={24} color="#0284c7" />
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                            Click to Simulate Dropping External CBC / CT Scan
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            Supports PDF, DICOM, JPEG (Up to 25 MB)
                          </div>
                        </div>

                        {isUploading && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, marginBottom: 4 }}>
                              <span>Extracting Biomarkers...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 9999, overflow: 'hidden' }}>
                              <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#0284c7', transition: 'width 0.2s ease' }} />
                            </div>
                          </div>
                        )}

                        {uploadProgress === 100 && (
                          <div style={{ fontSize: 11, color: '#059669', background: '#ecfdf5', padding: '8px 10px', borderRadius: 8, border: '1px solid #a7f3d0', fontWeight: 600 }}>
                            ✓ Report Indexed: 14 Biomarkers & Axial CT Slice attached to Doctor Workspace.
                          </div>
                        )}
                      </div>
                    )}

                    {/* SIMULATOR STEP 7: DOCTOR CALLOUT */}
                    {currentStep === 7 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div
                          style={{
                            background: '#ffffff',
                            borderRadius: 12,
                            padding: 14,
                            border: '1px solid #a7f3d0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.12)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 9999, background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
                                Sangeetha Krishnan (#TK-141)
                              </div>
                              <div style={{ fontSize: 10.5, color: '#059669', fontWeight: 700 }}>
                                AI Insights Ready • Ready for Dr. Patel
                              </div>
                            </div>
                          </div>
                          <span style={{ fontSize: 10, background: '#ecfdf5', color: '#065f46', padding: '3px 8px', borderRadius: 6, fontWeight: 800 }}>
                            Stage Cleared
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleSimulateCallout}
                          disabled={isCalling}
                          className="m3-btn"
                          style={{
                            background: callAnnounced ? '#ecfdf5' : '#fef3c7',
                            color: callAnnounced ? '#065f46' : '#92400e',
                            border: callAnnounced ? '1px solid #a7f3d0' : '1px solid #fde68a',
                            fontWeight: 700,
                            fontSize: 11.5,
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          <Volume2 size={14} />
                          <span>{isCalling ? 'Broadcasting Announcement...' : callAnnounced ? '✓ Patient Called to Room 03' : 'Simulate PA System Callout'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Simulator Footer Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
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
                      <span>Previous Step</span>
                    </button>

                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                      {currentStep} / {totalSteps}
                    </span>

                    <button
                      type="button"
                      disabled={currentStep === totalSteps}
                      onClick={() => setCurrentStep((prev) => Math.min(prev + 1, totalSteps))}
                      className="m3-btn m3-btn-sm"
                      style={{
                        background: '#fef3c7',
                        border: '1px solid #fde68a',
                        color: '#92400e',
                        fontWeight: 700,
                        fontSize: 11,
                        opacity: currentStep === totalSteps ? 0.4 : 1
                      }}
                    >
                      <span>Next Step</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VISUAL BLUEPRINT */}
          {activeTab === 'diagram' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#fef3c7', padding: '12px 16px', borderRadius: 12, border: '1px solid #fde68a', fontSize: 12, color: '#92400e' }}>
                <strong>Interactive OPD Journey Architecture:</strong> Click any stage below to jump directly to its training step.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                {[
                  { step: 1, title: '1. Front Desk Command', desc: 'Hourly footfall tracking, token sequencing, and station capacity monitor.', icon: Activity, color: '#d97706' },
                  { step: 2, title: '2. Patient Registration', desc: 'Demographics, phone number, and 1-click PM-JAY / ABHA national ID check.', icon: UserPlus, color: '#0284c7' },
                  { step: 3, title: '3. Token Slip Issuance', desc: 'Thermal physical receipt printing with QR code and doctor room number.', icon: Printer, color: '#d97706' },
                  { step: 4, title: '4. Clinical Intake & MCQ', desc: '6-step digital symptom roster, pain score, and baseline biometrics.', icon: FileText, color: '#8b5cf6' },
                  { step: 5, title: '5. Queue Triage & Priority', desc: 'Sorting Priority 1 (Urgent < 5m) vs Priority 2/3 and tracking wait timers.', icon: Clock, color: '#10b981' },
                  { step: 6, title: '6. Diagnostic Ingestion', desc: 'Uploading past blood panels, biopsy reports, or DICOM scans for OCR.', icon: UploadCloud, color: '#0284c7' },
                  { step: 7, title: '7. Doctor Desk Handoff', desc: 'Turns "AI Insights Ready" and automatically routes into Doctor Consultation.', icon: Stethoscope, color: '#059669' }
                ].map((item) => (
                  <div
                    key={item.step}
                    onClick={() => {
                      setCurrentStep(item.step);
                      setActiveTab('walkthrough');
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
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      transition: 'transform 0.15s ease, border-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: `${item.color}15`,
                          color: item.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <item.icon size={16} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: item.color }}>STEP 0{item.step}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PRACTICE QUIZ */}
          {activeTab === 'quiz' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  background: '#fef3c7',
                  padding: '14px 18px',
                  borderRadius: 12,
                  border: '1px solid #fde68a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10
                }}
              >
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#92400e', margin: 0 }}>
                    Front Desk Competency & Triage Assessment
                  </h4>
                  <div style={{ fontSize: 11.5, color: '#78350f', marginTop: 2 }}>
                    Answer 3 quick situational questions to verify your knowledge of the Receptionist flow.
                  </div>
                </div>

                {quizSubmitted && (
                  <div
                    style={{
                      background: '#059669',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: 12,
                      padding: '4px 12px',
                      borderRadius: 9999,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Award size={14} />
                    <span>Score: {calculateQuizScore()} / 3</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {quizQuestions.map((q, qIndex) => {
                  const selected = quizAnswers[q.id];

                  return (
                    <div
                      key={q.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid var(--border-default)',
                        borderRadius: 14,
                        padding: 18,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                        Q{qIndex + 1}: {q.question}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {q.options.map((opt) => {
                          const isPicked = selected === opt.id;
                          let optBg = '#fbf9f1';
                          let optBorder = 'var(--border-default)';
                          let optColor = 'var(--text-primary)';

                          if (quizSubmitted) {
                            if (opt.correct) {
                              optBg = '#d1fae5';
                              optBorder = '#10b981';
                              optColor = '#065f46';
                            } else if (isPicked && !opt.correct) {
                              optBg = '#fee2e2';
                              optBorder = '#ef4444';
                              optColor = '#991b1b';
                            }
                          } else if (isPicked) {
                            optBg = '#fef3c7';
                            optBorder = '#d97706';
                            optColor = '#92400e';
                          }

                          return (
                            <div
                              key={opt.id}
                              onClick={() => handleSelectQuizOption(q.id, opt.id)}
                              style={{
                                padding: '10px 14px',
                                borderRadius: 8,
                                border: `1px solid ${optBorder}`,
                                background: optBg,
                                color: optColor,
                                fontSize: 12,
                                fontWeight: isPicked ? 700 : 500,
                                cursor: quizSubmitted ? 'default' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span>{opt.text}</span>
                              {quizSubmitted && opt.correct && <CheckCircle2 size={16} color="#059669" />}
                            </div>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div style={{ fontSize: 11, color: '#475569', background: '#f8fafc', padding: '6px 10px', borderRadius: 6, fontStyle: 'italic' }}>
                          💡 {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                {quizSubmitted ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuizSubmitted(false);
                      setQuizAnswers({});
                    }}
                    className="m3-btn m3-btn-sm"
                    style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', fontWeight: 700 }}
                  >
                    <RotateCcw size={13} />
                    <span>Retake Quiz</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={Object.keys(quizAnswers).length < 3}
                    onClick={() => setQuizSubmitted(true)}
                    className="m3-btn m3-btn-filled"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#ffffff',
                      fontWeight: 800,
                      opacity: Object.keys(quizAnswers).length < 3 ? 0.5 : 1
                    }}
                  >
                    <span>Submit & Check Answers</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CHEATSHEET */}
          {activeTab === 'cheatsheet' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <div style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 14, padding: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: '#dc2626', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={15} /> Emergency Red Code Protocol
                </h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li>Any chest pain, respiratory distress, or severe bleeding must be tagged as <strong>Priority 1</strong>.</li>
                  <li>Notify Doctor Station 03 verbally while completing registration.</li>
                  <li>Do not delay doctor triage for billing or insurance paperwork.</li>
                </ul>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 14, padding: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0284c7', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={15} /> Ayushman Bharat (AB-PMJAY) Rules
                </h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li>Every PM-JAY patient must have a valid 14-digit ABHA ID.</li>
                  <li>Pre-authorization coverage is 100% cashless with 0 deductible.</li>
                  <li>Prescriptions will automatically route to Cashier Counter B-02 for government claim reconciliation.</li>
                </ul>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 14, padding: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: '#d97706', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={15} /> Front Desk Efficiency Shortcuts
                </h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li>Use the <strong>"Start MCQ"</strong> button right from the queue table for rapid intake.</li>
                  <li>Reprint lost token slips by clicking the printer icon on any queue row.</li>
                  <li>Press <strong>Esc</strong> to quickly dismiss any modal on your desk.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--border-default, #e7e5d8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle, #fbf9f1)'
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Use <strong>← / → arrow keys</strong> to navigate steps • <strong>Esc</strong> to close
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              className="m3-btn m3-btn-sm"
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                fontWeight: 700
              }}
            >
              Close Guide
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenRegister?.();
                onClose();
              }}
              className="m3-btn m3-btn-filled"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                fontWeight: 800,
                fontSize: 11.5,
                gap: 6
              }}
            >
              <UserPlus size={14} />
              <span>Register Patient Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
