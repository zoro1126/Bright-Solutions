import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Check, 
  AlertCircle, 
  ShieldCheck,
  ClipboardList,
  Activity,
  History,
  Users2,
  Pill,
  Gauge,
  Mic,
  BrainCircuit,
  HeartPulse
} from 'lucide-react';
import SpeechMicButton from './SpeechMicButton';

const STEPS = [
  { id: 1, title: 'General Health & Nutrition', short: 'General', icon: ClipboardList },
  { id: 2, title: 'Emergency Red Flags & Pain (PEG-3)', short: 'Red Flags & Pain', icon: AlertCircle },
  { id: 3, title: 'Mental Health (PHQ-2 & GAD-2)', short: 'Mental Health', icon: Activity },
  { id: 4, title: 'Medical History & Comorbidities', short: 'History & Risk', icon: History },
  { id: 5, title: 'Medications & Hypersensitivities', short: 'Meds & Allergies', icon: Pill },
  { id: 6, title: 'Functional Status & Dictation', short: 'Status & Submit', icon: Gauge }
];

export default function QuestionnaireModal({ isOpen, patient, onClose }) {
  const { submitQuestionnaire } = usePatients();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state initialized with standardized clinical questionnaire parameters (q1..q20)
  const [formData, setFormData] = useState(() => {
    if (patient?.questionnaire?.responses) {
      return { ...patient.questionnaire.responses };
    }
    return {
      q1: 1,  // General Health (1: Good)
      q2: 0,  // Weight Loss (0: Stable)
      q3: 0,  // Appetite (0: Normal)
      q4: 0,  // Hypersensitivity / Allergies (0: NKDA)
      q5: 0,  // PHQ-2 #1 (0: Not at all)
      q6: 0,  // PHQ-2 #2 (0: Not at all)
      q7: 0,  // GAD-2 #1 (0: Not at all)
      q8: 0,  // GAD-2 #2 (0: Not at all)
      q9: 0,  // PEG-3 Pain Intensity (0: None)
      q10: 0, // PEG-3 Enjoyment (0: None)
      q11: 0, // PEG-3 Activity (0: None)
      q12: 0, // Sleep (0: Normal)
      q13: 0, // Tobacco (0: Never)
      q14: 0, // Comorbidities (0: None)
      q15: 0, // Red Flags (0: None)
      q16: 0, // Immunization (0: Up to date)
      q17: 0, // Alcohol (0: Never)
      q18: 0, // ECOG Status (0: Fully Active)
      q19: 0, // Family History (0: None)
      q20: 0, // Daily Meds Count (0: None)
      voiceNotes: patient?.chief_complaint || ''
    };
  });

  if (!isOpen || !patient || typeof patient.then === 'function') return null;

  // Single-select MCQ handler for integer question values
  const handleSelect = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 6) setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Prepare answers dictionary matching backend schema
    const answers = {
      q1: Number(formData.q1 ?? 1),
      q2: Number(formData.q2 ?? 0),
      q3: Number(formData.q3 ?? 0),
      q4: Number(formData.q4 ?? 0),
      q5: Number(formData.q5 ?? 0),
      q6: Number(formData.q6 ?? 0),
      q7: Number(formData.q7 ?? 0),
      q8: Number(formData.q8 ?? 0),
      q9: Number(formData.q9 ?? 0),
      q10: Number(formData.q10 ?? 0),
      q11: Number(formData.q11 ?? 0),
      q12: Number(formData.q12 ?? 0),
      q13: Number(formData.q13 ?? 0),
      q14: Number(formData.q14 ?? 0),
      q15: Number(formData.q15 ?? 0),
      q16: Number(formData.q16 ?? 0),
      q17: Number(formData.q17 ?? 0),
      q18: Number(formData.q18 ?? 0),
      q19: Number(formData.q19 ?? 0),
      q20: Number(formData.q20 ?? 0)
    };

    // Allergies derived from q4
    const allergies = [];
    if (formData.q4 === 1) allergies.push('PENICILLIN');
    if (formData.q4 === 2) allergies.push('SULFA');
    if (formData.q4 === 3) allergies.push('NSAID');

    // Comorbidities derived from q14
    const comorbidities = [];
    if (formData.q14 === 1) comorbidities.push('HYPERTENSION');
    if (formData.q14 === 2) comorbidities.push('DIABETES');
    if (formData.q14 === 3) comorbidities.push('ASTHMA');
    if (formData.q14 === 4) comorbidities.push('CAD');
    if (formData.q14 === 5) comorbidities.push('CKD');

    const patientId = patient.patient_id || patient.id;
    const visitId = patient.visit_id || patient.id;

    const payload = {
      patient_id: patientId,
      answers,
      voice_notes: formData.voiceNotes || '',
      allergies,
      comorbidities,
      chief_complaint: patient.chief_complaint || formData.voiceNotes || 'General OPD Consultation'
    };

    try {
      await submitQuestionnaire(patient.id || patientId, payload, visitId);
    } catch (err) {
      console.error('Questionnaire submission error:', err);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  const progressPercent = Math.round((currentStep / 6) * 100);

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
                Standardized Clinical Intake & Triage Questionnaire (q1–q20)
              </h2>
              <span className="mrn-tag" style={{ fontSize: 10, padding: '1px 6px' }}>{patient.mrn || patient.uhid || 'UHID-NEW'}</span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
              Patient: <strong>{patient.fullName || patient.full_name || patient.first_name || 'Patient'}</strong> ({patient.age || '—'}y {patient.gender || '—'}) • <span style={{ color: 'var(--primary)', fontWeight: 700 }}>WHO EML &amp; Validated Psychometrics</span>
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
          {/* STEP 1: General Health & Nutrition (q1, q2, q3) */}
          {currentStep === 1 && (
            <div className="m3-animate-slide-down">
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  1. Self-Assessed General Health Status (q1)
                </div>
                <div className="mcq-question-hint">Overall baseline perception of physical wellbeing.</div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'Excellent Health', sub: 'Optimal physical wellbeing, zero systemic symptoms' },
                    { val: 1, label: 'Good Health', sub: 'Generally healthy with minor transient complaints' },
                    { val: 2, label: 'Fair Health', sub: 'Noticeable physical limitations impacting daily routine' },
                    { val: 3, label: 'Poor Health', sub: 'Significant physical impairment requiring active intervention' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${formData.q1 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleSelect('q1', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {formData.q1 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  2. Unexplained Weight Loss in Past 6 Months (q2)
                </div>
                <div className="mcq-question-hint">Constitutional metabolic screening indicator.</div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'None (Weight Stable)', sub: 'Zero unintentional weight reduction' },
                    { val: 1, label: 'Mild (< 5% body weight)', sub: 'Minor fluctuations with dietary changes' },
                    { val: 2, label: 'Significant (> 5% unintentional)', sub: 'Constitutional metabolic red flag' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${formData.q2 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleSelect('q2', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {formData.q2 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  3. Daily Appetite &amp; Nutrition Intake (q3)
                </div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'Normal Food Intake / Good Appetite', sub: 'Consistent 3 meals daily' },
                    { val: 1, label: 'Reduced Appetite / Early Satiety', sub: 'Eating noticeably less than normal' },
                    { val: 2, label: 'Severely Reduced / Poor Intake', sub: 'Marked anorexia or nausea with meals' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${formData.q3 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleSelect('q3', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {formData.q3 === opt.val && <Check size={9} strokeWidth={3} />}
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

          {/* STEP 2: Emergency Red Flags & Pain (q15, q9, q10, q11) */}
          {currentStep === 2 && (
            <div className="m3-animate-slide-down">
              <div className="mcq-question-block" style={{ borderLeft: '3px solid #ef4444', paddingLeft: 12 }}>
                <div className="mcq-question-title" style={{ color: '#b91c1c' }}>
                  1. Acute Emergency Red-Flag Warning Signs (q15)
                </div>
                <div className="mcq-question-hint">Immediate hemodynamic or neurological escalation check.</div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'No Acute Red Flags Present', sub: 'Hemodynamically stable presentation' },
                    { val: 1, label: 'Crushing Chest Pain / Jaw Radiation', sub: 'Potential Acute Coronary Syndrome (ACS)' },
                    { val: 2, label: 'Sudden Severe Dyspnea / Stridor', sub: 'Acute respiratory compromise or hypoxemia' },
                    { val: 3, label: 'Focal Neurological Deficit / Weakness', sub: 'Acute stroke or unilateral weakness' },
                    { val: 4, label: 'Active Hemoptysis / Severe GI Bleeding', sub: 'Severe acute hemorrhage' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${formData.q15 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleSelect('q15', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {formData.q15 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  2. PEG-3: Average Pain Intensity in Past Week (q9)
                </div>
                <div className="mcq-question-hint">Score &gt;= 4 indicates clinically significant pain interference.</div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: '0 — No Pain', sub: 'Completely comfortable' },
                    { val: 2, label: '2 — Mild Pain (1–3/10)', sub: 'Tolerable intermittent ache' },
                    { val: 5, label: '5 — Moderate Pain (4–6/10)', sub: 'Distracting, requires analgesia' },
                    { val: 8, label: '8 — Severe Disabling Pain (7–10/10)', sub: 'Severe constant agony' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${formData.q9 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleSelect('q9', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {formData.q9 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  3. PEG-3: Pain Interference with Enjoyment of Life (q10)
                </div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: '0 — Does Not Interfere', sub: 'Full recreational enjoyment' },
                    { val: 2, label: '2 — Mild Interference', sub: 'Slight curtailment of hobbies' },
                    { val: 5, label: '5 — Moderate Interference', sub: 'Regularly impedes enjoyable activities' },
                    { val: 8, label: '8 — Severe Interference', sub: 'Completely prevents leisure or rest' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${formData.q10 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleSelect('q10', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {formData.q10 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  4. PEG-3: Pain Interference with General Activity (q11)
                </div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: '0 — Does Not Interfere', sub: 'Full physical routine without impediment' },
                    { val: 2, label: '2 — Mild Interference', sub: 'Mild stiffness or physical slowdown' },
                    { val: 5, label: '5 — Moderate Interference', sub: 'Avoids heavy lifting or stairs' },
                    { val: 8, label: '8 — Severe Interference', sub: 'Restricted to bed or chair' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${formData.q11 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleSelect('q11', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {formData.q11 === opt.val && <Check size={9} strokeWidth={3} />}
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

          {/* STEP 3: Mental Health (q5, q6, q7, q8, q12) */}
          {currentStep === 3 && (
            <div className="m3-animate-slide-down">
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  1. PHQ-2 #1: Little interest or pleasure in doing things (q5)
                </div>
                <div className="mcq-question-hint">Validated depression screener for past 2 weeks.</div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'Not at all (0 days)' },
                    { val: 1, label: 'Several days' },
                    { val: 2, label: 'More than half the days' },
                    { val: 3, label: 'Nearly every day' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${formData.q5 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleSelect('q5', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {formData.q5 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  2. PHQ-2 #2: Feeling down, depressed, or hopeless (q6)
                </div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'Not at all (0 days)' },
                    { val: 1, label: 'Several days' },
                    { val: 2, label: 'More than half the days' },
                    { val: 3, label: 'Nearly every day' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${formData.q6 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleSelect('q6', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {formData.q6 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  3. GAD-2 #1: Feeling nervous, anxious, or on edge (q7)
                </div>
                <div className="mcq-question-hint">Validated anxiety screener for past 2 weeks.</div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'Not at all (0 days)' },
                    { val: 1, label: 'Several days' },
                    { val: 2, label: 'More than half the days' },
                    { val: 3, label: 'Nearly every day' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${formData.q7 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleSelect('q7', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {formData.q7 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  4. GAD-2 #2: Not being able to stop or control worrying (q8)
                </div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'Not at all (0 days)' },
                    { val: 1, label: 'Several days' },
                    { val: 2, label: 'More than half the days' },
                    { val: 3, label: 'Nearly every day' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${formData.q8 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleSelect('q8', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {formData.q8 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  5. Sleep Quality &amp; Nocturnal Awakenings (q12)
                </div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'Restful Normal Sleep', sub: '6–8 continuous hours nightly' },
                    { val: 1, label: 'Mild Sleep Latency', sub: 'Occasional difficulty initiating sleep' },
                    { val: 2, label: 'Frequent Nocturnal Awakenings', sub: 'Waking up 3+ times per night' },
                    { val: 3, label: 'Severe Chronic Insomnia', sub: 'Unrefreshing sleep with severe daytime fatigue' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${formData.q12 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleSelect('q12', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {formData.q12 === opt.val && <Check size={9} strokeWidth={3} />}
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

          {/* STEP 4: Medical History & Comorbidities (q14, q19, q16) */}
          {currentStep === 4 && (
            <div className="m3-animate-slide-down">
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  1. Pre-existing Chronic Comorbidity (q14)
                </div>
                <div className="mcq-question-hint">Directly informs safety contraindication filtering in the CDSS engine.</div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'No Known Chronic Comorbidities', sub: 'Zero ongoing baseline conditions' },
                    { val: 1, label: 'Essential Hypertension (HTN)', sub: 'Under active blood pressure monitoring' },
                    { val: 2, label: 'Type 2 Diabetes Mellitus (T2DM)', sub: 'Glycemic management indicated' },
                    { val: 3, label: 'Asthma / Chronic Obstructive Airway Disease', sub: 'Contraindicates non-selective beta blockers' },
                    { val: 4, label: 'Ischemic Heart Disease (CAD)', sub: 'History of angina, MI, or coronary stenting' },
                    { val: 5, label: 'Chronic Kidney Disease (CKD / Renal Impairment)', sub: 'Contraindicates NSAIDs & nephrotoxic drugs' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${formData.q14 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleSelect('q14', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {formData.q14 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  2. Family History of Premature Disease (q19)
                </div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'No Known Premature Familial Illness', sub: 'Standard population risk profile' },
                    { val: 1, label: 'Premature Coronary Artery Disease (< 55y)', sub: 'First-degree relative with early MI' },
                    { val: 2, label: 'Familial Type 2 Diabetes Mellitus', sub: 'Parents/siblings diagnosed with T2D' },
                    { val: 3, label: 'Familial Malignancy / Solid Tumors', sub: 'Clustering of solid cancers in first-degree relatives' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${formData.q19 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleSelect('q19', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {formData.q19 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  3. Routine Adult / Child Immunization Status (q16)
                </div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'Fully Vaccinated / Up to Date', sub: 'Standard national vaccination schedule met' },
                    { val: 1, label: 'Delayed / Incomplete Immunizations', sub: 'Missed scheduled boosters or doses' },
                    { val: 2, label: 'Unknown / Unverified Status', sub: 'Immunization card unavailable' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${formData.q16 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleSelect('q16', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {formData.q16 === opt.val && <Check size={9} strokeWidth={3} />}
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

          {/* STEP 5: Medications & Hypersensitivities (q4, q20) */}
          {currentStep === 5 && (
            <div className="m3-animate-slide-down">
              <div className="mcq-question-block" style={{ borderLeft: '3px solid #f59e0b', paddingLeft: 12 }}>
                <div className="mcq-question-title" style={{ color: '#b45309' }}>
                  1. Known Drug Hypersensitivities &amp; Allergies (q4)
                </div>
                <div className="mcq-question-hint">Automated safety filter: Contraindicated molecules are immediately masked from candidate prescriptions.</div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'No Known Drug Allergies (NKDA)', sub: 'Tolerates standard pharmacological classes' },
                    { val: 1, label: 'Penicillins & Beta-Lactams', sub: 'Masks Amoxicillin, Ampicillin, Cephalosporins' },
                    { val: 2, label: 'Sulfa-based Antibiotics (Sulfonamides)', sub: 'Masks Cotrimoxazole and sulfonylureas' },
                    { val: 3, label: 'NSAIDs & Aspirin', sub: 'Masks Ibuprofen, Diclofenac, Naproxen' },
                    { val: 4, label: 'Other Verified Drug Allergies', sub: 'Flags mandatory clinical review in doctor dossier' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${formData.q4 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleSelect('q4', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {formData.q4 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  2. Daily Regular Maintenance Medications Count (q20)
                </div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: '0 — No Regular Maintenance Medications', sub: 'Treatment-naive presentation' },
                    { val: 1, label: '1–2 Daily Maintenance Medications', sub: 'Low baseline drug burden' },
                    { val: 2, label: '3–4 Daily Medications', sub: 'Moderate polypharmacy' },
                    { val: 3, label: '5+ Daily Medications (Polypharmacy)', sub: 'High risk for adverse drug interactions' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${formData.q20 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleSelect('q20', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {formData.q20 === opt.val && <Check size={9} strokeWidth={3} />}
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

          {/* STEP 6: Functional Status, Lifestyle & Voice Dictation (q18, q13, q17, voiceNotes) */}
          {currentStep === 6 && (
            <div className="m3-animate-slide-down">
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  1. Functional Performance Status (ECOG Scale) (q18)
                </div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'ECOG 0: Fully Active', sub: 'Able to carry out all pre-disease performance without restriction' },
                    { val: 1, label: 'ECOG 1: Strenuous Activity Restricted', sub: 'Ambulatory; can carry out light/sedentary work' },
                    { val: 2, label: 'ECOG 2: Capable of Self-Care', sub: 'Unable to work; up and about &gt; 50% of waking hours' },
                    { val: 3, label: 'ECOG 3: Limited Self-Care', sub: 'Confined to bed or chair &gt; 50% of waking hours' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${formData.q18 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleSelect('q18', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {formData.q18 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  2. Tobacco &amp; Smoking History (q13)
                </div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'Never Smoked', sub: 'Zero lifetime tobacco exposure' },
                    { val: 1, label: 'Former Smoker (Quit &gt; 1 year)', sub: 'Past tobacco exposure' },
                    { val: 2, label: 'Current Occasional Smoker', sub: 'Non-daily / social smoking' },
                    { val: 3, label: 'Current Daily Active Smoker', sub: 'Elevated cardiovascular &amp; pulmonary risk' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${formData.q13 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleSelect('q13', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {formData.q13 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  3. Alcohol Consumption Frequency (q17)
                </div>
                <div className="mcq-options-grid">
                  {[
                    { val: 0, label: 'Never / Abstinent', sub: 'Zero alcohol consumption' },
                    { val: 1, label: 'Monthly or Less', sub: 'Infrequent social intake' },
                    { val: 2, label: '2–4 Times Monthly', sub: 'Moderate social drinking' },
                    { val: 3, label: '2–3 Times Weekly', sub: 'Regular consumption' },
                    { val: 4, label: '4+ Times Weekly / Heavy', sub: 'High metabolic &amp; hepatic burden' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`mcq-card ${formData.q17 === opt.val ? 'selected' : ''}`}
                      onClick={() => handleSelect('q17', opt.val)}
                    >
                      <div className="mcq-card-icon">
                        {formData.q17 === opt.val && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mcq-question-block" style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div className="mcq-question-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mic size={16} color="#0284c7" />
                    <span>Clinician Triage Voice Dictation (NegEx NLP Enabled)</span>
                  </div>
                  <SpeechMicButton 
                    onTranscript={(text) => {
                      setFormData(prev => ({
                        ...prev,
                        voiceNotes: prev.voiceNotes ? `${prev.voiceNotes} ${text}` : text
                      }));
                    }}
                  />
                </div>
                <div className="mcq-question-hint" style={{ marginBottom: 8 }}>
                  The backend Clinical NegEx NLP engine automatically parses affirmed symptoms vs. pertinent negatives (e.g. <em>"denies chest pain and shortness of breath, reports severe headache for 4 days"</em>).
                </div>
                <textarea
                  className="m3-input-field"
                  rows={3}
                  placeholder="Dictate or type clinical notes (e.g. Patient denies chest pain, reports severe headache for 4 days...)"
                  value={formData.voiceNotes}
                  onChange={(e) => handleSelect('voiceNotes', e.target.value)}
                  style={{ width: '100%', resize: 'vertical', fontSize: 13, padding: 10 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer m3-dialog-footer" style={{ padding: '12px 22px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                className="m3-btn m3-btn-outlined"
                onClick={handlePrev}
                disabled={isSubmitting}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {currentStep < 6 ? (
              <button
                type="button"
                className="m3-btn m3-btn-primary"
                onClick={handleNext}
              >
                <span>Next Step</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="m3-btn m3-btn-primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)' }}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner-border spinner-border-sm" role="status" style={{ width: 14, height: 14 }} />
                    <span>Evaluating CDSS Rules...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Submit &amp; Generate WHO EML Insights</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
