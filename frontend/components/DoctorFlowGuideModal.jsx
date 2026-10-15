import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  Activity,
  Layers,
  Pill,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  Move,
  Sun,
  Ruler,
  Plus,
  Trash2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  Compass,
  Award,
  Mic,
  Sliders,
  FlaskConical,
  Receipt
} from 'lucide-react';

export default function DoctorFlowGuideModal({
  isOpen,
  onClose,
  onOpenWorkspace,
  onSwitchTab,
  onOpenSampleDicom,
  onOpenSampleRx
}) {
  const [activeMode, setActiveMode] = useState('walkthrough'); // 'walkthrough' | 'blueprint' | 'quiz' | 'cheatsheet'
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  // Simulator State Step 1: Patient Selection
  const [selectedPat, setSelectedPat] = useState('pat1');

  // Simulator State Step 2: AI Risk Score
  const [showBiomarkers, setShowBiomarkers] = useState(false);
  const [cdssOverridden, setCdssOverridden] = useState(false);

  // Simulator State Step 3: DICOM CT Scrubber
  const [simSlice, setSimSlice] = useState(74);
  const [simPreset, setSimPreset] = useState('lung'); // 'lung' | 'mediastinum' | 'bone'

  // Simulator State Step 4: Allergy Alert
  const [allergyChecked, setAllergyChecked] = useState(true);

  // Simulator State Step 5: Digital Prescription Builder
  const [simRxList, setSimRxList] = useState([
    { id: 1, drug: 'Telmisartan (40mg)', dose: '40mg', freq: '1-0-0', timing: 'After Breakfast', qty: '30 Tabs' },
    { id: 2, drug: 'Pantoprazole (40mg)', dose: '40mg', freq: '1-0-0', timing: 'Before Breakfast', qty: '14 Tabs' }
  ]);

  // Simulator State Step 6: Voice Dictation & Lab Orders
  const [isDictating, setIsDictating] = useState(false);
  const [dictatedText, setDictatedText] = useState('Clinical Impression: Patient shows Grade 2 Essential Hypertension with tension headache.');
  const [selectedLabs, setSelectedLabs] = useState(['ecg']);

  // Simulator State Step 7: Finalize & Cashier Transit
  const [isFinalized, setIsFinalized] = useState(false);

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Keyboard Navigation (Esc to close, Left/Right for steps)
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

  // 7 Clinical Steps Definitions
  const steps = [
    {
      num: 1,
      badge: 'Step 01 • Patient Inflow',
      title: 'Consultation Roster & Patient Triage Selection',
      subtitle: 'Select waiting patients from your assigned OPD room queue based on triage urgency tags.',
      icon: Stethoscope,
      color: '#0077B6',
      bg: '#CAF0F8',
      actions: [
        'Inspect the patient queue on the left sidebar sorted by triage priority (Urgent vs Standard).',
        'Review patient age, gender, vital signs baseline, and chief complaint.',
        'Click any patient row to instantly hydrate their longitudinal electronic health record.'
      ],
      proTip: 'Priority 1 (Red) patients are flagged with < 5 min target times — attend to them ahead of routine follow-ups.',
      actionBtnText: 'Open Patient Consultation Workspace',
      actionFn: () => {
        onOpenWorkspace?.();
        onClose();
      }
    },
    {
      num: 2,
      badge: 'Step 02 • Diagnostic Intelligence',
      title: 'CDSS Clinical Risk Stratification & NegEx NLP',
      subtitle: 'Inspect deterministic CDSS flags, validated scores (PHQ-2, GAD-2, PEG-3, NEWS2), and NegEx SOAP brief.',
      icon: Sparkles,
      color: '#0284c7',
      bg: '#e0f2fe',
      actions: [
        'Navigate to the "AI Staging" tab to inspect the automated clinical risk assessment.',
        'Review risk flags (e.g. Stage 2 Essential Hypertension, Dyslipidemia risk).',
        'Use the "Clinical Decision Override" modal if your clinical judgement modifies the AI suggestion.'
      ],
      proTip: 'AI recommendations provide diagnostic guidance, but your physician signature retains final clinical authority.',
      actionBtnText: 'Inspect AI Clinical Staging',
      actionFn: () => {
        onSwitchTab?.('insights');
        onClose();
      }
    },
    {
      num: 3,
      badge: 'Step 03 • Imaging & Radiology',
      title: 'High-Resolution Axial DICOM Scans Review',
      subtitle: 'Analyze 148 axial chest CT / MRI slices with Hounsfield window presets and measurement calipers.',
      icon: Layers,
      color: '#0077B6',
      bg: '#CAF0F8',
      actions: [
        'Click the "DICOM Scans" tab to inspect axial imaging series.',
        'Use the slice scrubber slider to navigate from apical slices down to diaphragmatic base.',
        'Toggle window presets between Lung (WW:1500 WL:-600), Mediastinum, and Bone settings.'
      ],
      proTip: 'Double click on the DICOM viewport or click "Expand Viewport" to launch full-screen diagnostic review.',
      actionBtnText: 'Launch DICOM CT Viewer',
      actionFn: () => {
        onSwitchTab?.('dicom');
        onClose();
      }
    },
    {
      num: 4,
      badge: 'Step 04 • Longitudinal Care',
      title: 'Clinical History & Safety Contraindication Checks',
      subtitle: 'Review patient-reported symptoms, prior treatments, family history, and drug allergies.',
      icon: ShieldCheck,
      color: '#059669',
      bg: '#ecfdf5',
      actions: [
        'Open the "Medical History" tab to see prior oncology, cardiology, and metabolic diagnoses.',
        'Inspect the Triage Questionnaire responses captured by the reception desk tablet.',
        'Cross-check the Drug Allergy banner (e.g. Penicillin, NSAIDs) before prescribing.'
      ],
      proTip: 'The system automatically highlights contraindicated medication classes if an active allergy is recorded.',
      actionBtnText: 'View Longitudinal History',
      actionFn: () => {
        onSwitchTab?.('history');
        onClose();
      }
    },
    {
      num: 5,
      badge: 'Step 05 • Pharmacotherapy',
      title: 'Digital Prescription Builder & Drug Titration',
      subtitle: 'Prescribe branded/generic drugs with frequency codes (1-0-1), meal timing, and auto-dispense routing.',
      icon: Pill,
      color: '#0077B6',
      bg: '#CAF0F8',
      actions: [
        'Click the "Prescription" tab to formulate the therapeutic medication plan.',
        'Use 1-click drug presets (Paracetamol, Pantoprazole, Atorvastatin, Telmisartan) or search custom drugs.',
        'Specify dosage, frequency (1-0-0, 1-0-1, SOS), duration (days), and meal timing instructions.'
      ],
      proTip: 'Prescribed oral drugs automatically calculate dispensing tablet quantities for the pharmacy inventory.',
      actionBtnText: 'Open Prescription Pad',
      actionFn: () => {
        onSwitchTab?.('rx');
        onClose();
      }
    },
    {
      num: 6,
      badge: 'Step 06 • Documentation & Workup',
      title: 'Clinical Impression, Lab Orders & Voice Dictation',
      subtitle: 'Dictate definitive impressions with voice speech-to-text and order diagnostic investigations.',
      icon: FileText,
      color: '#8b5cf6',
      bg: '#ede9fe',
      actions: [
        'Switch to the "Clinical Impression & Orders" tab to finalize the consult narrative.',
        'Click the microphone button to dictate findings hands-free via real-time clinical speech-to-text.',
        'Select recommended investigations (12-Lead ECG, 2D-Echo, Comprehensive Metabolic Panel HbA1c/LFT).'
      ],
      proTip: 'Dictated notes automatically format into standard SOAP (Subjective, Objective, Assessment, Plan) structure.',
      actionBtnText: 'Go to Clinical Conclusion',
      actionFn: () => {
        onSwitchTab?.('conclusion');
        onClose();
      }
    },
    {
      num: 7,
      badge: 'Step 07 • Care Coordination',
      title: 'Finalize Consultation & Transmit Bill to Cashier',
      subtitle: 'Digitally lock the clinical consult note and auto-route itemized charges to Cashier Counter B-02.',
      icon: Receipt,
      color: '#059669',
      bg: '#ecfdf5',
      actions: [
        'Review the complete patient summary, prescribed regimen, and follow-up timeline.',
        'Click the high-contrast "Finalize & Send to Cashier" button to lock the clinical encounter.',
        'Prescription is archived, and the billing charge sheet appears instantly at the Cashier settlement desk.'
      ],
      proTip: 'Finalizing locks the patient visit with your digital timestamp and moves them to "Pending Settlement" queue.',
      actionBtnText: 'Return to Doctor Workspace',
      actionFn: () => {
        onOpenWorkspace?.();
        onClose();
      }
    }
  ];

  const currentStepData = steps[currentStep - 1];

  // Quiz Questions Data for Doctor Competency
  const quizQuestions = [
    {
      id: 'qd1',
      question: 'A patient has an active allergy flag: "Penicillin (rash & hives)". Which antibiotic class is contraindicated?',
      options: [
        { id: 'a', text: 'Macrolides (e.g. Azithromycin)' },
        { id: 'b', text: 'Beta-lactam antibiotics (e.g. Amoxicillin, Ampicillin)', correct: true },
        { id: 'c', text: 'Fluoroquinolones (e.g. Ciprofloxacin)' }
      ],
      explanation: 'Beta-lactam antibiotics share cross-reactivity with penicillin and must be strictly avoided in allergic patients.'
    },
    {
      id: 'qd2',
      question: 'Which Hounsfield window preset in the DICOM viewer is optimal for detecting subtle pulmonary nodules and ground-glass opacities?',
      options: [
        { id: 'a', text: 'Lung Window (WW: 1500, WL: -600)', correct: true },
        { id: 'b', text: 'Mediastinum Window (WW: 350, WL: 40)' },
        { id: 'c', text: 'Bone Window (WW: 2000, WL: 500)' }
      ],
      explanation: 'The wide window width (1500 HU) and negative window level (-600 HU) maximize lung parenchyma detail.'
    },
    {
      id: 'qd3',
      question: 'What happens immediately when you click "Finalize Consultation & Send to Cashier"?',
      options: [
        { id: 'a', text: 'The patient is discharged without any records saved.' },
        { id: 'b', text: 'The clinical note is digitally locked, Rx dispatches to pharmacy, and bill routes to Cashier Counter B-02.', correct: true },
        { id: 'c', text: 'The patient is sent back to the Reception queue for re-registration.' }
      ],
      explanation: 'Finalization locks the medical record for legal compliance and immediately queues the patient for cashier billing.'
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
      className="m3-modal-backdrop doctor-theme"
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
          boxShadow: '0 25px 50px -12px rgba(0, 119, 182, 0.25), 0 0 0 1px var(--border-default, #e2e8f0)',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.25s ease-out'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-default, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #CAF0F8, #ffffff)',
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
                background: 'linear-gradient(135deg, #0077B6, #1E3A8A)',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(0, 119, 182, 0.35)'
              }}
            >
              <Stethoscope size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: '#0077B6',
                    backgroundColor: '#CAF0F8',
                    border: '1px solid #90E0EF',
                    padding: '2px 8px',
                    borderRadius: 9999,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}
                >
                  Clinical Master Guide
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>•</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1E3A8A' }}>
                  Physician Workflow & EHR Architecture
                </span>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                Doctor Clinical Desk • End-to-End Operational Flow
              </h3>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                display: 'inline-flex',
                background: 'rgba(0, 119, 182, 0.1)',
                padding: 3,
                borderRadius: 10,
                border: '1px solid rgba(0, 119, 182, 0.2)'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveMode('walkthrough')}
                style={{
                  border: 'none',
                  background: activeMode === 'walkthrough' ? '#ffffff' : 'transparent',
                  color: activeMode === 'walkthrough' ? '#0077B6' : '#1E3A8A',
                  fontWeight: 800,
                  fontSize: 11.5,
                  padding: '5px 12px',
                  borderRadius: 7,
                  cursor: 'pointer',
                  boxShadow: activeMode === 'walkthrough' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                7-Step Flow
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('blueprint')}
                style={{
                  border: 'none',
                  background: activeMode === 'blueprint' ? '#ffffff' : 'transparent',
                  color: activeMode === 'blueprint' ? '#0077B6' : '#1E3A8A',
                  fontWeight: 800,
                  fontSize: 11.5,
                  padding: '5px 12px',
                  borderRadius: 7,
                  cursor: 'pointer',
                  boxShadow: activeMode === 'blueprint' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Clinical Blueprint
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('quiz')}
                style={{
                  border: 'none',
                  background: activeMode === 'quiz' ? '#ffffff' : 'transparent',
                  color: activeMode === 'quiz' ? '#0077B6' : '#1E3A8A',
                  fontWeight: 800,
                  fontSize: 11.5,
                  padding: '5px 12px',
                  borderRadius: 7,
                  cursor: 'pointer',
                  boxShadow: activeMode === 'quiz' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Case Quiz
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('cheatsheet')}
                style={{
                  border: 'none',
                  background: activeMode === 'cheatsheet' ? '#ffffff' : 'transparent',
                  color: activeMode === 'cheatsheet' ? '#0077B6' : '#1E3A8A',
                  fontWeight: 800,
                  fontSize: 11.5,
                  padding: '5px 12px',
                  borderRadius: 7,
                  cursor: 'pointer',
                  boxShadow: activeMode === 'cheatsheet' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
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
          
          {/* TAB 1: 7-STEP CLINICAL WALKTHROUGH */}
          {activeMode === 'walkthrough' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Stepper Header Pills */}
              <div
                style={{
                  background: 'var(--bg-subtle, #f8fafc)',
                  padding: '12px 16px',
                  borderRadius: 14,
                  border: '1px solid var(--border-default, #e2e8f0)',
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
                        padding: '6px 10px',
                        borderRadius: 10,
                        border: isCurrent
                          ? '1.5px solid #0077B6'
                          : isPassed
                          ? '1px solid #86efac'
                          : '1px solid transparent',
                        background: isCurrent
                          ? '#CAF0F8'
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
                            ? '#0077B6'
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
                            ? '#0077B6'
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

              {/* 2-Column Split: Clinical Guidance Left, Interactive Simulator Right */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: 20,
                  alignItems: 'stretch'
                }}
              >
                {/* Left Column: Conceptual Protocol */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-default, #e2e8f0)',
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
                        Stage {currentStep} of {totalSteps}
                      </span>
                    </div>

                    <h4 style={{ fontSize: 18.5, fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                      {currentStepData.title}
                    </h4>

                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {currentStepData.subtitle}
                    </p>

                    {/* Action Protocol Checklist */}
                    <div
                      style={{
                        background: 'var(--bg-subtle, #f8fafc)',
                        borderRadius: 12,
                        padding: '14px 16px',
                        border: '1px solid var(--border-default, #e2e8f0)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#1E3A8A', textTransform: 'uppercase' }}>
                        Physician Action Protocol:
                      </span>
                      {currentStepData.actions.map((act, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 9999,
                              background: '#CAF0F8',
                              color: '#0077B6',
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
                        background: '#CAF0F8',
                        border: '1px solid #90E0EF',
                        borderRadius: 12,
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10
                      }}
                    >
                      <Sparkles size={16} color="#0077B6" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: 11.5, color: '#03045E', lineHeight: 1.4 }}>
                        <strong>Physician Clinical Tip:</strong> {currentStepData.proTip}
                      </div>
                    </div>
                  </div>

                  {/* Primary Workspace Jump Button */}
                  <button
                    type="button"
                    onClick={currentStepData.actionFn}
                    className="m3-btn m3-btn-filled"
                    style={{
                      height: 38,
                      fontSize: 12.5,
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #0077B6, #1E3A8A)',
                      color: '#ffffff',
                      boxShadow: '0 2px 8px rgba(0, 119, 182, 0.3)',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <span>{currentStepData.actionBtnText}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* Right Column: Live Doctor Interactive Simulator */}
                <div
                  style={{
                    background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
                    border: '1px solid var(--border-default, #e2e8f0)',
                    borderRadius: 16,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div className="stat-card-accent-blob blob-blue" style={{ top: -20, right: -20, opacity: 0.35 }} />

                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#0077B6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        ⚡ Live Clinical Simulator
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
                        Doctor Desk Simulator
                      </span>
                    </div>

                    {/* SIMULATOR STEP 1: PATIENT QUEUE SELECTOR */}
                    {currentStep === 1 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                          Click a queued patient to hydrate their clinical chart:
                        </div>

                        {[
                          { id: 'pat1', name: 'Sangeetha Krishnan', age: '52F', bp: '158/96', priority: 'Priority 1 (Urgent)', color: '#ef4444', chief: 'Severe occipital headache & palpitations' },
                          { id: 'pat2', name: 'Ananya Sharma', age: '34F', bp: '124/80', priority: 'Priority 2 (Standard)', color: '#f59e0b', chief: 'Follow-up hypertension review' },
                          { id: 'pat3', name: 'Rohan Mehra', age: '46M', bp: '130/84', priority: 'Priority 3 (Routine)', color: '#10b981', chief: 'Routine health checkup' }
                        ].map((p) => (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPat(p.id)}
                            style={{
                              padding: 12,
                              borderRadius: 10,
                              border: selectedPat === p.id ? '2px solid #0077B6' : '1px solid var(--border-default)',
                              background: selectedPat === p.id ? '#CAF0F8' : '#ffffff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
                                {p.name} ({p.age})
                              </div>
                              <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                                BP: <strong>{p.bp} mmHg</strong> • {p.chief}
                              </div>
                            </div>
                            <span style={{ fontSize: 9.5, fontWeight: 800, color: p.color, background: `${p.color}15`, padding: '2px 6px', borderRadius: 4 }}>
                              {p.priority.split(' ')[0]}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SIMULATOR STEP 2: AI CLINICAL RISK & CDSS */}
                    {currentStep === 2 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ background: '#ffffff', borderRadius: 12, padding: 14, border: '1px solid var(--border-default)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#1E3A8A' }}>
                              Deterministic CDSS Evaluation
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 800, background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 4 }}>
                              Moderate Priority Alert
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                            Primary Risk: <strong>Cardiovascular / Grade 2 Essential Hypertension</strong> with elevated LDL-C (168 mg/dL).
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => setShowBiomarkers(!showBiomarkers)}
                            className="m3-btn m3-btn-sm"
                            style={{ flex: 1, background: '#CAF0F8', color: '#0077B6', border: '1px solid #90E0EF', fontWeight: 700 }}
                          >
                            <FlaskConical size={13} />
                            <span>{showBiomarkers ? 'Hide Biomarkers' : 'Inspect Biomarkers'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setCdssOverridden(!cdssOverridden)}
                            className="m3-btn m3-btn-sm"
                            style={{ flex: 1, background: cdssOverridden ? '#ecfdf5' : '#ffffff', color: cdssOverridden ? '#065f46' : 'var(--text-primary)', border: '1px solid var(--border-default)', fontWeight: 700 }}
                          >
                            <Sliders size={13} />
                            <span>{cdssOverridden ? '✓ Override Logged' : 'Log CDSS Override'}</span>
                          </button>
                        </div>

                        {showBiomarkers && (
                          <div style={{ fontSize: 10.5, background: '#f8fafc', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', color: '#334155' }}>
                            Biomarker Breakdown: Total Chol 238 mg/dL (High), LDL-C 168 mg/dL (High), Serum Creatinine 0.9 mg/dL (Normal).
                          </div>
                        )}
                      </div>
                    )}

                    {/* SIMULATOR STEP 3: AXIAL DICOM VIEWER SCRUBBER */}
                    {currentStep === 3 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div
                          style={{
                            background: '#090d16',
                            borderRadius: 12,
                            padding: 16,
                            color: '#ffffff',
                            textAlign: 'center',
                            border: '1px solid #1e293b',
                            position: 'relative'
                          }}
                        >
                          <div style={{ fontSize: 10, color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>
                            Axial Chest CT with Contrast • Slice {simSlice} of 148
                          </div>

                          <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0', border: '1px dashed #334155', borderRadius: 8, background: simPreset === 'lung' ? '#0f172a' : simPreset === 'bone' ? '#334155' : '#1e293b' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>
                              [CT Viewport Simulation • WW: {simPreset === 'lung' ? '1500 WL:-600' : '350 WL:40'}]
                            </span>
                          </div>

                          <input
                            type="range"
                            min="1"
                            max="148"
                            value={simSlice}
                            onChange={(e) => setSimSlice(Number(e.target.value))}
                            style={{ width: '100%', cursor: 'pointer', accentColor: '#0077B6' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                          {[
                            { id: 'lung', label: 'Lung Window' },
                            { id: 'mediastinum', label: 'Mediastinum' },
                            { id: 'bone', label: 'Bone Window' }
                          ].map((pr) => (
                            <button
                              key={pr.id}
                              type="button"
                              onClick={() => setSimPreset(pr.id)}
                              style={{
                                flex: 1,
                                padding: '5px 8px',
                                fontSize: 10.5,
                                fontWeight: 700,
                                borderRadius: 6,
                                border: simPreset === pr.id ? '1.5px solid #0077B6' : '1px solid var(--border-default)',
                                background: simPreset === pr.id ? '#CAF0F8' : '#ffffff',
                                color: simPreset === pr.id ? '#0077B6' : 'var(--text-secondary)',
                                cursor: 'pointer'
                              }}
                            >
                              {pr.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SIMULATOR STEP 4: ALLERGY & CONTRAINDICATION SAFETY */}
                    {currentStep === 4 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div
                          style={{
                            background: '#fee2e2',
                            border: '1px solid #fca5a5',
                            borderRadius: 10,
                            padding: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertTriangle size={18} color="#dc2626" />
                            <div>
                              <strong style={{ fontSize: 11.5, color: '#991b1b' }}>Allergy Warning Detected</strong>
                              <div style={{ fontSize: 10.5, color: '#b91c1c' }}>Patient is severely allergic to Penicillin (Skin Rash / Urticaria)</div>
                            </div>
                          </div>
                          <span style={{ fontSize: 9.5, fontWeight: 800, background: '#dc2626', color: '#ffffff', padding: '2px 6px', borderRadius: 4 }}>
                            HIGH ALERT
                          </span>
                        </div>

                        <div style={{ background: '#ffffff', borderRadius: 10, padding: 12, border: '1px solid var(--border-default)', fontSize: 11 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Safety Guard:</span>{' '}
                          <strong>Amoxicillin, Augmentin & Ampicillin disabled in Rx Presets.</strong>
                        </div>
                      </div>
                    )}

                    {/* SIMULATOR STEP 5: DIGITAL PRESCRIPTION PAD */}
                    {currentStep === 5 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ background: '#ffffff', borderRadius: 10, padding: 10, border: '1px solid var(--border-default)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, marginBottom: 6, color: '#1E3A8A' }}>
                            <span>Active Regimen ({simRxList.length} Drugs)</span>
                            <span>Auto-dispense Qty</span>
                          </div>

                          {simRxList.map((item) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', borderBottom: '1px dashed #e2e8f0' }}>
                              <span><strong>{item.drug}</strong> • {item.freq}</span>
                              <span style={{ color: '#0077B6', fontWeight: 700 }}>{item.qty}</span>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!simRxList.find((r) => r.drug.includes('Atorvastatin'))) {
                              setSimRxList((prev) => [
                                ...prev,
                                { id: 3, drug: 'Atorvastatin (20mg)', dose: '20mg', freq: '0-0-1', timing: 'At Bedtime', qty: '30 Tabs' }
                              ]);
                            }
                          }}
                          className="m3-btn m3-btn-sm"
                          style={{ background: '#CAF0F8', color: '#0077B6', border: '1px solid #90E0EF', fontWeight: 700, justifyContent: 'center', gap: 6 }}
                        >
                          <Plus size={14} />
                          <span>+ Add Atorvastatin 20mg (Bedtime OD)</span>
                        </button>
                      </div>
                    )}

                    {/* SIMULATOR STEP 6: VOICE DICTATION & LAB ORDERS */}
                    {currentStep === 6 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ background: '#ffffff', borderRadius: 10, padding: 12, border: '1px solid var(--border-default)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)' }}>Consultation Note Draft</span>
                            <button
                              type="button"
                              onClick={() => setIsDictating(!isDictating)}
                              style={{
                                border: 'none',
                                background: isDictating ? '#fee2e2' : '#CAF0F8',
                                color: isDictating ? '#dc2626' : '#0077B6',
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: 10,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <Mic size={12} />
                              <span>{isDictating ? 'Recording...' : 'Voice Dictate'}</span>
                            </button>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>
                            "{dictatedText}"
                          </div>
                        </div>

                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                          Recommended Investigations:
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {[
                            { id: 'ecg', label: '12-Lead ECG' },
                            { id: 'echo', label: '2D-Echocardiogram' },
                            { id: 'lipid', label: 'Lipid & HbA1c Panel' }
                          ].map((lab) => (
                            <button
                              key={lab.id}
                              type="button"
                              onClick={() => {
                                setSelectedLabs((prev) =>
                                  prev.includes(lab.id) ? prev.filter((x) => x !== lab.id) : [...prev, lab.id]
                                );
                              }}
                              style={{
                                flex: 1,
                                padding: '5px 4px',
                                fontSize: 10,
                                fontWeight: 700,
                                borderRadius: 6,
                                border: selectedLabs.includes(lab.id) ? '1.5px solid #0077B6' : '1px solid var(--border-default)',
                                background: selectedLabs.includes(lab.id) ? '#CAF0F8' : '#ffffff',
                                color: selectedLabs.includes(lab.id) ? '#0077B6' : 'var(--text-secondary)',
                                cursor: 'pointer'
                              }}
                            >
                              {selectedLabs.includes(lab.id) ? `✓ ${lab.label}` : lab.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SIMULATOR STEP 7: FINALIZE & ROUTE TO CASHIER */}
                    {currentStep === 7 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div
                          style={{
                            background: '#ffffff',
                            borderRadius: 12,
                            padding: 14,
                            border: '1px solid #a7f3d0',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <CheckCircle2 size={16} color="#059669" />
                              <strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                                Sangeetha Krishnan (#TK-141)
                              </strong>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 800, background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: 4 }}>
                              Consultation Complete
                            </span>
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 6 }}>
                            Charges Generated: <strong>OPD Consult (₹600) + ECG (₹450) + Rx Pharmacy (₹800)</strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsFinalized(true)}
                          className="m3-btn"
                          style={{
                            background: isFinalized ? '#ecfdf5' : 'linear-gradient(135deg, #0077B6, #1E3A8A)',
                            color: isFinalized ? '#065f46' : '#ffffff',
                            border: isFinalized ? '1px solid #a7f3d0' : 'none',
                            fontWeight: 800,
                            fontSize: 11.5,
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          <Receipt size={14} />
                          <span>{isFinalized ? '✓ Bill Routed to Cashier Counter B-02' : 'Simulate Finalize & Send to Cashier'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Simulator Stepper Footer */}
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
                      <span>Previous Stage</span>
                    </button>

                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                      Stage {currentStep} / {totalSteps}
                    </span>

                    <button
                      type="button"
                      disabled={currentStep === totalSteps}
                      onClick={() => setCurrentStep((prev) => Math.min(prev + 1, totalSteps))}
                      className="m3-btn m3-btn-sm"
                      style={{
                        background: '#CAF0F8',
                        border: '1px solid #90E0EF',
                        color: '#0077B6',
                        fontWeight: 800,
                        fontSize: 11,
                        opacity: currentStep === totalSteps ? 0.4 : 1
                      }}
                    >
                      <span>Next Stage</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLINICAL BLUEPRINT */}
          {activeMode === 'blueprint' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#CAF0F8', padding: '12px 16px', borderRadius: 12, border: '1px solid #90E0EF', fontSize: 12, color: '#03045E' }}>
                <strong>Doctor Clinical Consultation Journey:</strong> Click any milestone to jump directly into its operational guide.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                {[
                  { step: 1, title: '1. Queue & Triage Intake', desc: 'Select patient from waiting roster; review vital signs & chief complaints.', icon: Stethoscope, color: '#0077B6' },
                  { step: 2, title: '2. CDSS Risk Stratification', desc: 'Deterministic CDSS risk flags, validated scores, and NegEx NLP SOAP brief.', icon: Sparkles, color: '#0284c7' },
                  { step: 3, title: '3. DICOM Imaging Review', desc: '148-slice axial CT/MRI viewer with Lung, Mediastinum, and Bone windowing.', icon: Layers, color: '#0077B6' },
                  { step: 4, title: '4. History & Contraindications', desc: 'Longitudinal EHR timeline, past admissions, and drug allergy cross-checks.', icon: ShieldCheck, color: '#059669' },
                  { step: 5, title: '5. Digital Prescription Pad', desc: 'Formulate drug dosage, frequency (1-0-1), meal timing, and auto-dispense.', icon: Pill, color: '#0077B6' },
                  { step: 6, title: '6. Notes & Voice Dictation', desc: 'SOAP documentation, speech-to-text dictation, and diagnostic lab orders.', icon: FileText, color: '#8b5cf6' },
                  { step: 7, title: '7. Finalize & Cashier Transit', desc: 'Lock consultation note; itemized bill dispatches to Cashier Counter B-02.', icon: Receipt, color: '#059669' }
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
                      <span style={{ fontSize: 10, fontWeight: 800, color: item.color }}>STAGE 0{item.step}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CASE QUIZ */}
          {activeMode === 'quiz' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  background: '#CAF0F8',
                  padding: '14px 18px',
                  borderRadius: 12,
                  border: '1px solid #90E0EF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10
                }}
              >
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#03045E', margin: 0 }}>
                    Clinical Practice & Chart Competency Assessment
                  </h4>
                  <div style={{ fontSize: 11.5, color: '#0077B6', marginTop: 2 }}>
                    Answer 3 clinical situational questions to test your mastery of the Doctor portal.
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
                    <span>Score: {getQuizScore()} / 3</span>
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
                        Case Q{qIndex + 1}: {q.question}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {q.options.map((opt) => {
                          const isPicked = selected === opt.id;
                          let optBg = '#f8fafc';
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
                            optBg = '#CAF0F8';
                            optBorder = '#0077B6';
                            optColor = '#03045E';
                          }

                          return (
                            <div
                              key={opt.id}
                              onClick={() => handleSelectQuiz(q.id, opt.id)}
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
                    style={{ background: '#CAF0F8', color: '#0077B6', border: '1px solid #90E0EF', fontWeight: 700 }}
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
                      background: 'linear-gradient(135deg, #0077B6, #1E3A8A)',
                      color: '#ffffff',
                      fontWeight: 800,
                      opacity: Object.keys(quizAnswers).length < 3 ? 0.5 : 1
                    }}
                  >
                    <span>Submit & Verify Answers</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CHEATSHEET */}
          {activeMode === 'cheatsheet' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <div style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 14, padding: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0077B6', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Pill size={15} /> Standard Rx Frequency Codes
                </h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li><strong>1-0-0:</strong> Morning dose with breakfast (e.g. Antihypertensives, PPIs).</li>
                  <li><strong>1-0-1:</strong> Twice daily with morning and dinner meals.</li>
                  <li><strong>0-0-1:</strong> Night time dose (e.g. Statins for lipid synthesis inhibition).</li>
                  <li><strong>SOS:</strong> Take only when required (e.g. Analgesics, Anti-emetics).</li>
                </ul>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 14, padding: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: '#dc2626', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={15} /> Red Flag Escalations
                </h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li>Systolic BP &gt; 180 mmHg or Diastolic &gt; 120 mmHg: Order urgent IV labetalol/nitroglycerin.</li>
                  <li>SpO2 &lt; 92% on room air: Initiate supplemental O2 via nasal cannula.</li>
                  <li>Acute ST-elevation on ECG: Escalate to emergency cath lab.</li>
                </ul>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 14, padding: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: '#059669', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={15} /> EHR Efficiency Shortcuts
                </h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li>Click <strong>"Voice Dictate"</strong> on clinical conclusion to dictate hands-free.</li>
                  <li>Use 1-click Rx presets to add full dosing regimens with one tap.</li>
                  <li>Finalizing auto-populates itemized billing for the cashier.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--border-default, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle, #f8fafc)'
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Use <strong>← / → arrow keys</strong> to navigate stages • <strong>Esc</strong> to close
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
                onOpenWorkspace?.();
                onClose();
              }}
              className="m3-btn m3-btn-filled"
              style={{
                background: 'linear-gradient(135deg, #0077B6, #1E3A8A)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 11.5,
                gap: 6
              }}
            >
              <Stethoscope size={14} />
              <span>Resume Patient Consult</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
