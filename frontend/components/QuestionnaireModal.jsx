import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import SpeechMicButton from './SpeechMicButton';
import { 
  DEFAULT_QUESTIONNAIRE_ANSWERS, 
  mapAnswersToResponses 
} from '../utils/cdssScorer';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Check, 
  AlertCircle, 
  AlertTriangle,
  ClipboardList,
  Activity,
  Users2,
  Pill,
  Gauge,
  ShieldCheck
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Clinical Triage & Complaint', short: 'Triage', icon: ClipboardList },
  { id: 2, title: 'Emergency Red Flags', short: 'Red Flags', icon: AlertCircle },
  { id: 3, title: 'Pain Severity (PEG-3 Scale)', short: 'Pain Scale', icon: Activity },
  { id: 4, title: 'Mental Health Wellbeing (PHQ-2 / GAD-2)', short: 'Mental Health', icon: Users2 },
  { id: 5, title: 'Meds, Allergies & Organ Safety', short: 'Meds & Safety', icon: Pill },
  { id: 6, title: 'Functional Status & Lifestyle', short: 'Status & Submit', icon: Gauge }
];

const LIKERT_OPTIONS = [
  { val: 0, label: 'Not at all', sub: '0 days in past 2 weeks' },
  { val: 1, label: 'Several days', sub: '1–6 days in past 2 weeks' },
  { val: 2, label: 'More than half the days', sub: '7–11 days in past 2 weeks' },
  { val: 3, label: 'Nearly every day', sub: '12–14 days in past 2 weeks' }
];

const ALLERGY_CHIPS = [
  { id: 'PENICILLIN', label: 'Penicillin / β-Lactams' },
  { id: 'SULFA', label: 'Sulfa Medications' },
  { id: 'NSAID', label: 'NSAIDs / Aspirin' },
  { id: 'CEPHALOSPORIN', label: 'Cephalosporins' },
  { id: 'OPIOID', label: 'Opioids / Codeine' },
  { id: 'CONTRAST_DYE', label: 'IV Radiocontrast Dye' }
];

const COMORBIDITY_CHIPS = [
  { id: 'HYPERTENSION', label: 'Hypertension (HTN)' },
  { id: 'DIABETES', label: 'Type 2 Diabetes (DM)' },
  { id: 'ASTHMA', label: 'Bronchial Asthma / COPD' },
  { id: 'CAD', label: 'Coronary Artery Disease' },
  { id: 'CKD', label: 'Chronic Kidney Disease (CKD)' },
  { id: 'LIVER_DISEASE', label: 'Chronic Liver Disease' }
];

export default function QuestionnaireModal({ isOpen, patient, onClose }) {
  const { submitQuestionnaire } = usePatients();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize standardized 20-question numeric answers
  const [answers, setAnswers] = useState(() => {
    if (patient?.questionnaire?.answers) {
      return { ...DEFAULT_QUESTIONNAIRE_ANSWERS, ...patient.questionnaire.answers };
    }
    return { ...DEFAULT_QUESTIONNAIRE_ANSWERS };
  });

  // Accompanying fields
  const [chiefComplaint, setChiefComplaint] = useState(() => {
    return patient?.chiefComplaint || patient?.chief_complaint || patient?.questionnaire?.responses?.chiefComplaint || 'General Clinical Consultation & Review';
  });

  const [voiceNotes, setVoiceNotes] = useState(() => {
    return patient?.questionnaire?.voice_notes || patient?.questionnaire?.responses?.voiceNotes || '';
  });

  const [selectedAllergies, setSelectedAllergies] = useState(() => {
    if (Array.isArray(patient?.questionnaire?.allergies)) return patient.questionnaire.allergies;
    if (Array.isArray(patient?.questionnaire?.scores?.reported_allergies)) return patient.questionnaire.scores.reported_allergies;
    return [];
  });

  const [selectedComorbidities, setSelectedComorbidities] = useState(() => {
    if (Array.isArray(patient?.questionnaire?.comorbidities)) return patient.questionnaire.comorbidities;
    if (Array.isArray(patient?.questionnaire?.scores?.reported_comorbidities)) return patient.questionnaire.scores.reported_comorbidities;
    return [];
  });

  if (!isOpen || !patient) return null;

  // Single-select numeric answer handler
  const handleAnswerChange = (qKey, val) => {
    setAnswers(prev => ({ ...prev, [qKey]: Number(val) }));
  };

  // Toggle multi-select allergy chips
  const toggleAllergy = (allergyId) => {
    setSelectedAllergies(prev => {
      if (prev.includes(allergyId)) {
        return prev.filter(a => a !== allergyId);
      }
      return [...prev, allergyId];
    });
  };

  // Toggle multi-select comorbidity chips
  const toggleComorbidity = (comorbId) => {
    setSelectedComorbidities(prev => {
      if (prev.includes(comorbId)) {
        return prev.filter(c => c !== comorbId);
      }
      return [...prev, comorbId];
    });
  };

  const handleNext = () => {
    if (currentStep < 6) setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const responses = mapAnswersToResponses(
        answers, 
        voiceNotes, 
        selectedAllergies, 
        selectedComorbidities, 
        chiefComplaint
      );

      await submitQuestionnaire(patient.id, {
        answers,
        voiceNotes,
        allergies: selectedAllergies,
        comorbidities: selectedComorbidities,
        chiefComplaint,
        responses
      });

      onClose();
    } catch (err) {
      console.error('Failed to submit questionnaire:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent = Math.round((currentStep / 6) * 100);

  // Dynamic live scores for immediate visual feedback
  const phq2Score = (Number(answers.q5) || 0) + (Number(answers.q6) || 0);
  const gad2Score = (Number(answers.q7) || 0) + (Number(answers.q8) || 0);
  const peg3Avg = Number((((Number(answers.q9) || 0) + (Number(answers.q10) || 0) + (Number(answers.q11) || 0)) / 3.0).toFixed(1));

  return (
    <div className="modal-overlay m3-dialog-backdrop" onClick={onClose}>
      <div 
        className="modal-content m3-dialog-container m3-questionnaire-dialog" 
        style={{ maxWidth: 880 }} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Top Progress Line */}
        <div className="m3-dialog-progress-bar">
          <div 
            className="m3-dialog-progress-fill" 
            style={{ width: `${progressPercent}%` }} 
          />
        </div>

        {/* M3 Dialog Header */}
        <div className="m3-dialog-header" style={{ padding: '14px 22px 10px' }}>
          <div className="m3-dialog-icon" style={{ background: '#e0f2fe', color: '#0284c7', width: 34, height: 34 }}>
            <ClipboardList size={18} strokeWidth={2.2} />
          </div>
          <div className="m3-dialog-title-block">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Standardized 20-Question Clinical Intake & Triage Battery (q1–q20)
              </h2>
              <span className="mrn-tag" style={{ fontSize: 10, padding: '1px 6px' }}>{patient.mrn}</span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
              Patient: <strong>{patient.fullName}</strong> ({patient.age}y {patient.gender}) • <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Deterministic CDSS & NLP Protocol</span>
            </p>
          </div>
          <button 
            className="m3-icon-button" 
            onClick={onClose} 
            aria-label="Close questionnaire"
            style={{ width: 32, height: 32 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* M3 Interactive Stepper Chips */}
        <div className="m3-questionnaire-stepper">
          {STEPS.map((s) => {
            const isCompleted = s.id < currentStep;
            const isActive = s.id === currentStep;
            const StepIcon = s.icon;
            return (
              <button
                key={s.id}
                className={`m3-stepper-chip ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                onClick={() => setCurrentStep(s.id)}
                title={`Jump to ${s.title}`}
              >
                <div className="m3-stepper-circle">
                  {isCompleted ? <Check size={10} strokeWidth={3} /> : <StepIcon size={10} />}
                </div>
                <span className="m3-stepper-label">{s.short}</span>
              </button>
            );
          })}
        </div>

        {/* Current Step Banner */}
        <div className="m3-step-heading-row">
          <div className="m3-step-number-tag">
            Step {currentStep} of 6
          </div>
          <h3 className="m3-step-title">
            {STEPS[currentStep - 1].title}
          </h3>
        </div>

        {/* Modal Form Step Body */}
        <div className="modal-body m3-questionnaire-body">
          
          {/* STEP 1: Clinical Triage & Complaint (q1, q2, q3 + chief complaint) */}
          {currentStep === 1 && (
            <div className="m3-animate-slide-down">
              {/* Primary Presenting Chief Complaint Input */}
              <div className="mcq-question-block" style={{ marginBottom: 14 }}>
                <div className="mcq-question-title">
                  <span>Primary Presenting Chief Complaint</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--primary)', backgroundColor: 'var(--primary-container)', padding: '1px 6px', borderRadius: 4 }}>
                    Intake Reason
                  </span>
                </div>
                <div className="mcq-question-hint">Specify or refine the primary complaint reported by the patient for this consultation.</div>
                <input
                  type="text"
                  className="m3-input-field"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="e.g., Persistent Headaches & Elevated Blood Pressure"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1.2px solid var(--border-default)',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-surface)'
                  }}
                />
              </div>

              {/* q1: Triage Acuity Level */}
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  1. Triage Acuity Level (q1)
                </div>
                <div className="mcq-question-hint">Determines queue wait priority multiplier and urgency ranking.</div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'Routine / Ambulatory', sub: 'Standard wait time, non-acute symptoms' },
                    { val: 1, label: 'Priority / Urgent Review', sub: 'Elevated triage priority, acute symptoms' },
                    { val: 2, label: 'Critical / Immediate Resuscitation', sub: 'Immediate physician interrupt required' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${answers.q1 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleAnswerChange('q1', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {answers.q1 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* q2: Primary Pain / Discomfort Location */}
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  2. Primary Pain / Discomfort Location (q2)
                </div>
                <div className="mcq-question-hint">Routes to specialty differential algorithms (e.g. chest pain triggers ECG suggestion).</div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'None / Pain-Free', sub: 'General or non-pain consultation' },
                    { val: 1, label: 'Head & Neck', sub: 'Cranial, ENT, cervical spine discomfort' },
                    { val: 2, label: 'Chest & Thorax', sub: 'Precordial, pleuritic, rib cage pain' },
                    { val: 3, label: 'Abdomen & Pelvis', sub: 'Epigastric, RUQ, pelvic tenderness' },
                    { val: 4, label: 'Musculoskeletal & Limbs', sub: 'Joints, extremities, lumbar arthralgia' },
                    { val: 5, label: 'Generalized / Multi-Site', sub: 'Diffuse body aches, malaise, fatigue' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${answers.q2 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleAnswerChange('q2', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {answers.q2 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* q3: Duration of Chief Complaint */}
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  3. Duration of Chief Complaint (q3)
                </div>
                <div className="mcq-question-hint">Distinguishes acute infection from chronic disease exacerbation.</div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'Acute (< 24 Hours)', sub: 'Sudden acute onset' },
                    { val: 1, label: 'Subacute (1–7 Days)', sub: 'Recent presentation' },
                    { val: 2, label: 'Persistent (1–4 Weeks)', sub: 'Sub-monthly duration' },
                    { val: 3, label: 'Subchronic (1–3 Months)', sub: 'Ongoing symptoms' },
                    { val: 4, label: 'Chronic (> 3 Months)', sub: 'Longstanding / recurring' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${answers.q3 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleAnswerChange('q3', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {answers.q3 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Emergency Red Flags (q15, q12, q13) */}
          {currentStep === 2 && (
            <div className="m3-animate-slide-down">
              {/* Critical Alert Warning if q15 === 1 */}
              {answers.q15 === 1 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 8,
                  backgroundColor: '#fef2f2',
                  border: '1.5px solid #ef4444',
                  marginBottom: 14,
                  color: '#b91c1c'
                }}>
                  <AlertTriangle size={18} strokeWidth={2.4} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800 }}>CRITICAL INTERRUPT: Acute Emergency Warning Signs Flagged!</div>
                    <div style={{ fontSize: 11, opacity: 0.9 }}>This visit will trigger immediate physician interruption and ICD-10 R68.89 alert.</div>
                  </div>
                </div>
              )}

              {/* q15: Acute Emergency Warning Signs */}
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  1. Acute Emergency Warning Signs (q15)
                </div>
                <div className="mcq-question-hint">Crushing chest pain, severe dyspnea, acute stroke / neurological signs, or uncontrolled hemorrhage.</div>
                <div className="mcq-options-grid-2">
                  {[
                    { val: 0, label: 'Absent (No Emergency Red Flags)', sub: 'Hemodynamically stable, no acute danger signs' },
                    { val: 1, label: '⚠️ Present (Immediate Physician Attention)', sub: 'Crushing chest pain, severe dyspnea, focal stroke signs' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${answers.q15 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleAnswerChange('q15', opt.val)}
                      style={opt.val === 1 && answers.q15 === 1 ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}
                    >
                      <div className="mcq-card-icon" style={opt.val === 1 && answers.q15 === 1 ? { backgroundColor: '#ef4444', borderColor: '#ef4444' } : {}}>
                        {answers.q15 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title" style={opt.val === 1 && answers.q15 === 1 ? { color: '#b91c1c' } : {}}>
                          {opt.label}
                        </span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* q12: Unintentional Weight Loss in Past 6 Months */}
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  2. Unintentional Weight Loss in Past 6 Months (q12)
                </div>
                <div className="mcq-question-hint">Constitutional metabolic warning screening. Significant loss triggers metabolic alert.</div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'None (Weight Stable)', sub: 'No unintended body weight loss' },
                    { val: 1, label: 'Mild (< 5% body weight)', sub: 'Minor unintentional appetite/weight dip' },
                    { val: 2, label: 'Significant (> 5 kg unintentional)', sub: 'High metabolic red flag for wasting/neoplasm' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${answers.q12 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleAnswerChange('q12', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {answers.q12 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* q13: Appetite & Nutritional Intake */}
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  3. Appetite & Nutritional Intake (q13)
                </div>
                <div className="mcq-question-hint">Alerts doctor to potential gastrointestinal, metabolic, or neoplastic distress.</div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'Normal Daily Food Intake', sub: 'Regular appetite and caloric consumption' },
                    { val: 1, label: 'Decreased / Mild Anorexia', sub: 'Reduced food intake or mild appetite dip' },
                    { val: 2, label: 'Severe Early Satiety / Nausea', sub: 'Unable to finish meals, nausea, vomiting' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${answers.q13 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleAnswerChange('q13', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {answers.q13 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Pain Severity - PEG-3 Scale (q9, q10, q11) */}
          {currentStep === 3 && (
            <div className="m3-animate-slide-down">
              {/* Live PEG-3 Summary Header Card */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                borderRadius: 8,
                backgroundColor: peg3Avg >= 4 ? '#fffbeb' : '#f0fdf4',
                border: `1.2px solid ${peg3Avg >= 4 ? '#f59e0b' : '#22c55e'}`,
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Activity size={18} color={peg3Avg >= 4 ? '#d97706' : '#16a34a'} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: peg3Avg >= 4 ? '#92400e' : '#166534' }}>
                      PEG-3 Scale Average: {peg3Avg} / 10
                    </div>
                    <div style={{ fontSize: 11, color: peg3Avg >= 4 ? '#b45309' : '#15803d' }}>
                      {peg3Avg >= 4.0 
                        ? '⚠️ Significant Pain (PEG-3 >= 4.0 triggers ICD-10 M79.1 acute musculoskeletal pain)' 
                        : '✅ Mild / Well-Tolerated Pain (< 4.0)'}
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 12,
                  backgroundColor: peg3Avg >= 4 ? '#fef3c7' : '#dcfce7',
                  color: peg3Avg >= 4 ? '#b45309' : '#15803d'
                }}>
                  {peg3Avg === 0 ? 'Pain-Free (0)' : peg3Avg < 4 ? 'Mild Pain' : peg3Avg < 7 ? 'Moderate Pain' : 'Severe / Disabling'}
                </span>
              </div>

              {/* q9: PEG-3 Item 1: Pain Intensity */}
              <div className="mcq-question-block">
                <div className="mcq-question-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>1. Pain Intensity on Average (q9)</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{answers.q9} / 10</span>
                </div>
                <div className="mcq-question-hint">In the past week, rate your pain on a scale from 0 (No pain) to 10 (Pain as bad as you can imagine).</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
                    const isSelected = answers.q9 === n;
                    let color = '#22c55e';
                    if (n >= 4 && n <= 6) color = '#f59e0b';
                    if (n >= 7) color = '#ef4444';
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleAnswerChange('q9', n)}
                        style={{
                          flex: '1 0 32px',
                          minWidth: 32,
                          height: 36,
                          borderRadius: 8,
                          border: isSelected ? `2px solid ${color}` : '1.2px solid var(--border-default)',
                          backgroundColor: isSelected ? (n === 0 ? '#f0fdf4' : n < 4 ? '#f0fdf4' : n < 7 ? '#fffbeb' : '#fef2f2') : 'var(--bg-surface)',
                          color: isSelected ? color : 'var(--text-secondary)',
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: 12.5,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isSelected ? `0 2px 6px ${color}33` : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* q10: PEG-3 Item 2: Enjoyment Interference */}
              <div className="mcq-question-block">
                <div className="mcq-question-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>2. Interference with Enjoyment of Life (q10)</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{answers.q10} / 10</span>
                </div>
                <div className="mcq-question-hint">In the past week, how much has pain interfered with your enjoyment of life? (0 = Does not interfere, 10 = Completely interferes).</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
                    const isSelected = answers.q10 === n;
                    let color = '#22c55e';
                    if (n >= 4 && n <= 6) color = '#f59e0b';
                    if (n >= 7) color = '#ef4444';
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleAnswerChange('q10', n)}
                        style={{
                          flex: '1 0 32px',
                          minWidth: 32,
                          height: 36,
                          borderRadius: 8,
                          border: isSelected ? `2px solid ${color}` : '1.2px solid var(--border-default)',
                          backgroundColor: isSelected ? (n === 0 ? '#f0fdf4' : n < 4 ? '#f0fdf4' : n < 7 ? '#fffbeb' : '#fef2f2') : 'var(--bg-surface)',
                          color: isSelected ? color : 'var(--text-secondary)',
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: 12.5,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isSelected ? `0 2px 6px ${color}33` : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* q11: PEG-3 Item 3: General Activity Interference */}
              <div className="mcq-question-block">
                <div className="mcq-question-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>3. Interference with General Activity (q11)</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{answers.q11} / 10</span>
                </div>
                <div className="mcq-question-hint">In the past week, how much has pain interfered with your general activity? (0 = Does not interfere, 10 = Completely interferes).</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
                    const isSelected = answers.q11 === n;
                    let color = '#22c55e';
                    if (n >= 4 && n <= 6) color = '#f59e0b';
                    if (n >= 7) color = '#ef4444';
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleAnswerChange('q11', n)}
                        style={{
                          flex: '1 0 32px',
                          minWidth: 32,
                          height: 36,
                          borderRadius: 8,
                          border: isSelected ? `2px solid ${color}` : '1.2px solid var(--border-default)',
                          backgroundColor: isSelected ? (n === 0 ? '#f0fdf4' : n < 4 ? '#f0fdf4' : n < 7 ? '#fffbeb' : '#fef2f2') : 'var(--bg-surface)',
                          color: isSelected ? color : 'var(--text-secondary)',
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: 12.5,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isSelected ? `0 2px 6px ${color}33` : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Mental Health Wellbeing (q5, q6, q7, q8) */}
          {currentStep === 4 && (
            <div className="m3-animate-slide-down">
              {/* Live Scores Summary Header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, marginBottom: 14 }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  backgroundColor: phq2Score >= 3 ? '#fef2f2' : '#f0fdf4',
                  border: `1.2px solid ${phq2Score >= 3 ? '#ef4444' : '#22c55e'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: phq2Score >= 3 ? '#b91c1c' : '#166534' }}>
                      PHQ-2 Depression Score: {phq2Score} / 6
                    </div>
                    <div style={{ fontSize: 10.5, color: phq2Score >= 3 ? '#dc2626' : '#15803d' }}>
                      {phq2Score >= 3 ? '⚠️ Positive Screen (>= 3): Triggers Major Depression Alert' : '✅ Negative Screen (< 3): Low depression risk'}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                    backgroundColor: phq2Score >= 3 ? '#fee2e2' : '#dcfce7',
                    color: phq2Score >= 3 ? '#b91c1c' : '#15803d'
                  }}>
                    {phq2Score >= 3 ? 'Evaluate PHQ-9' : 'Normal'}
                  </span>
                </div>

                <div style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  backgroundColor: gad2Score >= 3 ? '#fef2f2' : '#f0fdf4',
                  border: `1.2px solid ${gad2Score >= 3 ? '#ef4444' : '#22c55e'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: gad2Score >= 3 ? '#b91c1c' : '#166534' }}>
                      GAD-2 Anxiety Score: {gad2Score} / 6
                    </div>
                    <div style={{ fontSize: 10.5, color: gad2Score >= 3 ? '#dc2626' : '#15803d' }}>
                      {gad2Score >= 3 ? '⚠️ Positive Screen (>= 3): Triggers Anxiety Evaluation' : '✅ Negative Screen (< 3): Low anxiety risk'}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                    backgroundColor: gad2Score >= 3 ? '#fee2e2' : '#dcfce7',
                    color: gad2Score >= 3 ? '#b91c1c' : '#15803d'
                  }}>
                    {gad2Score >= 3 ? 'Evaluate GAD-7' : 'Normal'}
                  </span>
                </div>
              </div>

              {/* q5: PHQ-2 Item 1 (Anhedonia) */}
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  1. Little interest or pleasure in doing things (PHQ-2 Item 1 - q5)
                </div>
                <div className="mcq-question-hint">Over the last 2 weeks, how often have you been bothered by having little interest or pleasure in doing things?</div>
                <div className="mcq-options-grid">
                  {LIKERT_OPTIONS.map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${answers.q5 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleAnswerChange('q5', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {answers.q5 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* q6: PHQ-2 Item 2 (Depressed Mood) */}
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  2. Feeling down, depressed, or hopeless (PHQ-2 Item 2 - q6)
                </div>
                <div className="mcq-question-hint">Over the last 2 weeks, how often have you felt down, depressed, or hopeless?</div>
                <div className="mcq-options-grid">
                  {LIKERT_OPTIONS.map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${answers.q6 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleAnswerChange('q6', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {answers.q6 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* q7: GAD-2 Item 1 (Nervousness) */}
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  3. Feeling nervous, anxious, or on edge (GAD-2 Item 1 - q7)
                </div>
                <div className="mcq-question-hint">Over the last 2 weeks, how often have you felt nervous, anxious, or on edge?</div>
                <div className="mcq-options-grid">
                  {LIKERT_OPTIONS.map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${answers.q7 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleAnswerChange('q7', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {answers.q7 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* q8: GAD-2 Item 2 (Uncontrolled Worry) */}
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  4. Not being able to stop or control worrying (GAD-2 Item 2 - q8)
                </div>
                <div className="mcq-question-hint">Over the last 2 weeks, how often have you been unable to stop or control worrying?</div>
                <div className="mcq-options-grid">
                  {LIKERT_OPTIONS.map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${answers.q8 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleAnswerChange('q8', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {answers.q8 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Meds, Allergies & Organ Safety (q4, q14 + custom tags) */}
          {currentStep === 5 && (
            <div className="m3-animate-slide-down">
              {/* q4: Major Drug Hypersensitivity */}
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  1. Major Drug Hypersensitivity Screening (q4)
                </div>
                <div className="mcq-question-hint">Safety Gate: Blocks contraindicated medication classes (Penicillin blocks Amoxicillin, NSAID blocks Ibuprofen).</div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'No Known Drug Allergies (NKDA)', sub: 'Patient has never had adverse drug hypersensitivity' },
                    { val: 1, label: 'Penicillin & β-Lactams', sub: 'Blocks Amoxicillin, Ampicillin, Piperacillin' },
                    { val: 2, label: 'Sulfa Medications', sub: 'Blocks Co-trimoxazole, Sulfamethoxazole' },
                    { val: 3, label: 'NSAIDs / Aspirin', sub: 'Blocks Ibuprofen, Diclofenac, Naproxen' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${answers.q4 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleAnswerChange('q4', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {answers.q4 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Allergy Tag Toggles */}
                <div style={{ marginTop: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Additional Specific Drug Allergies:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {ALLERGY_CHIPS.map(chip => {
                      const isSelected = selectedAllergies.includes(chip.id);
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => toggleAllergy(chip.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 16,
                            border: isSelected ? '1.5px solid #dc2626' : '1.2px solid var(--border-default)',
                            backgroundColor: isSelected ? '#fef2f2' : 'var(--bg-surface)',
                            color: isSelected ? '#b91c1c' : 'var(--text-secondary)',
                            fontSize: 11,
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isSelected ? <Check size={11} strokeWidth={3} /> : <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#94a3b8' }} />}
                          <span>{chip.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* q14: Primary Chronic Organ Disease */}
              <div className="mcq-question-block" style={{ marginTop: 14 }}>
                <div className="mcq-question-title">
                  2. Primary Chronic Organ Disease / Comorbidity (q14)
                </div>
                <div className="mcq-question-hint">Organ Safety Gates: Asthma blocks beta-blockers (Atenolol); CKD blocks nephrotoxic NSAIDs (Ibuprofen).</div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'None / First Hospital Visit', sub: 'Baseline outpatient workup, no chronic organ disease' },
                    { val: 1, label: 'Essential Hypertension (HTN)', sub: 'Elevated arterial blood pressure under medical control' },
                    { val: 2, label: 'Type 2 Diabetes (DM)', sub: 'Insulin resistance / elevated fasting blood glucose' },
                    { val: 3, label: 'Bronchial Asthma / COPD', sub: 'Airway hyperreactivity (Contraindicates beta-blockers)' },
                    { val: 4, label: 'Coronary Artery Disease / Cardiac', sub: 'Ischemic heart disease, angina, or prior MI' },
                    { val: 5, label: 'Chronic Kidney Disease (CKD)', sub: 'Renal impairment (Contraindicates nephrotoxic NSAIDs)' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${answers.q14 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleAnswerChange('q14', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {answers.q14 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Comorbidity Tag Toggles */}
                <div style={{ marginTop: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Additional Chronic Comorbidities:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {COMORBIDITY_CHIPS.map(chip => {
                      const isSelected = selectedComorbidities.includes(chip.id);
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => toggleComorbidity(chip.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 16,
                            border: isSelected ? '1.5px solid #0284c7' : '1.2px solid var(--border-default)',
                            backgroundColor: isSelected ? '#e0f2fe' : 'var(--bg-surface)',
                            color: isSelected ? '#0369a1' : 'var(--text-secondary)',
                            fontSize: 11,
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isSelected ? <Check size={11} strokeWidth={3} /> : <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#94a3b8' }} />}
                          <span>{chip.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Functional & Lifestyle Health + Voice Dictation (q16, q17, q18, q19, q20, voice_notes) */}
          {currentStep === 6 && (
            <div className="m3-animate-slide-down">
              {/* q16: Routine Vaccination Currency */}
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  1. Routine Vaccination Currency (q16)
                </div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'Up to Date', sub: 'All recommended adult/pediatric vaccines received' },
                    { val: 1, label: 'Incomplete / Delayed', sub: 'Missed doses or overdue for booster' },
                    { val: 2, label: 'Unsure / Medical Exemption', sub: 'No records available or clinical exemption' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${answers.q16 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleAnswerChange('q16', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {answers.q16 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* q17: ECOG Functional Performance Status */}
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  2. ECOG Functional Performance Status (q17)
                </div>
                <div className="mcq-question-hint">Standardized physical stamina and mobility score.</div>
                <div className="mcq-options-grid-2">
                  {[
                    { val: 0, label: 'ECOG 0: Fully Active', sub: 'Able to carry on all pre-disease activities without restriction' },
                    { val: 1, label: 'ECOG 1: Ambulatory / Light Work', sub: 'Restricted in physically strenuous exertion; light work capable' },
                    { val: 2, label: 'ECOG 2: Capable of Self-Care / In Bed < 50%', sub: 'Up & about > 50% of waking hours; unable to work' },
                    { val: 3, label: 'ECOG 3: Confined to Bed/Chair > 50%', sub: 'Limited self-care; in bed/chair > 50% of waking hours' },
                    { val: 4, label: 'ECOG 4: Completely Bedbound', sub: 'Cannot carry on any self-care; 100% dependent on nursing' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${answers.q17 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleAnswerChange('q17', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {answers.q17 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* q18: Tobacco & Nicotine Use History */}
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  3. Tobacco & Nicotine Use History (q18)
                </div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'Never Smoked', sub: 'Lifetime non-smoker' },
                    { val: 1, label: 'Former Smoker (Quit > 1 Year)', sub: 'Cessation > 12 months' },
                    { val: 2, label: 'Active Smoker (< 1 Pack/Day)', sub: 'Light-to-moderate regular smoking' },
                    { val: 3, label: 'Heavy Active Smoker (> 1 Pack/Day)', sub: 'High risk pack-year history' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${answers.q18 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleAnswerChange('q18', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {answers.q18 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* q19: Alcohol Consumption Frequency */}
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  4. Alcohol Consumption Frequency (q19)
                </div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'Never / Abstinent', sub: 'Zero alcohol intake' },
                    { val: 1, label: 'Occasional / Social', sub: 'Monthly or rare social events' },
                    { val: 2, label: 'Moderate (1–2 times/week)', sub: 'Regular social intake' },
                    { val: 3, label: 'Daily / Heavy Intake', sub: 'Elevated hepatic risk profile' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${answers.q19 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleAnswerChange('q19', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {answers.q19 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* q20: Familial Chronic Disease Clustering */}
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  5. Familial Chronic Disease Clustering (q20)
                </div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'No Known Family Disease', sub: 'Negative hereditary cluster' },
                    { val: 1, label: 'First-Degree Relative', sub: 'Early CVD, diabetes, or HTN in parent/sibling' },
                    { val: 2, label: 'Multi-Generational Clustering', sub: 'Multiple family members across 2+ generations' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${answers.q20 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleAnswerChange('q20', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {answers.q20 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Voice Notes / Nurse Dictation Block */}
              <div className="mcq-question-block" style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div className="mcq-question-title" style={{ margin: 0 }}>
                    Voice Notes / Nurse Dictation (MedSpaCy Negation NLP)
                  </div>
                  <SpeechMicButton
                    onTranscript={(text) => setVoiceNotes(prev => (prev ? `${prev} ${text}` : text))}
                  />
                </div>
                <div className="mcq-question-hint">
                  Dictate or type clinical notes. The backend NLP engine extracts asserted symptoms and negations ("denies shortness of breath").
                </div>
                <textarea
                  className="m3-input-field"
                  rows={3}
                  placeholder="e.g., Patient reports severe right knee pain for 4 days. Denies chest pain or fever. Known severe allergy to penicillin."
                  value={voiceNotes}
                  onChange={(e) => setVoiceNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1.2px solid var(--border-default)',
                    fontSize: 12,
                    lineHeight: 1.4,
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-surface)',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* M3 Model Inference Trigger Card */}
              <div className="m3-inference-ready-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="m3-inference-icon">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div className="m3-inference-title">
                      Ready for Instant DL/NLP Clinical Inference
                    </div>
                    <p className="m3-inference-subtitle">
                      Submitting evaluates the standardized 20 questions against the deterministic CDSS and medication safety engine. Results stream directly to Dr. Kiran Patel's doctor console.
                    </p>
                  </div>
                </div>
                <div className="m3-inference-tag">
                  <ShieldCheck size={15} />
                  <span>100% Validated</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* M3 Dialog Actions Footer */}
        <div className="m3-dialog-actions">
          <div>
            {currentStep > 1 && (
              <button 
                type="button" 
                className="m3-btn m3-btn-outlined" 
                onClick={handlePrev}
                style={{ height: 34, fontSize: 11.5, padding: '0 12px' }}
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              type="button" 
              className="m3-btn m3-btn-text" 
              onClick={onClose}
              style={{ height: 34, fontSize: 11.5 }}
            >
              Cancel
            </button>

            {currentStep < 6 && (
              <button 
                type="button" 
                className="m3-btn m3-btn-outlined" 
                onClick={handleNext}
                style={{ height: 34, fontSize: 11.5, padding: '0 14px' }}
              >
                <span>Next Section</span>
                <ChevronRight size={14} />
              </button>
            )}

            <button
              type="button"
              className="m3-btn m3-btn-filled m3-btn-success"
              onClick={handleSubmit}
              disabled={isSubmitting}
              data-tour="submit-intake-btn"
              style={{ height: 34, fontSize: 11.5, padding: '0 16px' }}
              title="Submit intake triage questionnaire and run ClinicalInsight CDSS"
            >
              <Sparkles size={14} />
              <span>{isSubmitting ? 'Transmitting...' : '⚡ Submit & Run CDSS AI'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
