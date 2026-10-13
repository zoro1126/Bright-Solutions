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
  Gauge
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Chief Complaint', short: 'Complaint', icon: ClipboardList },
  { id: 2, title: 'Red Flags', short: 'Red Flags', icon: AlertCircle },
  { id: 3, title: 'Medical History', short: 'Medical History', icon: History },
  { id: 4, title: 'Family History', short: 'Family History', icon: Users2 },
  { id: 5, title: 'Meds & Allergies', short: 'Meds / Allergies', icon: Pill },
  { id: 6, title: 'Functional Status', short: 'Status & Submit', icon: Gauge }
];

export default function QuestionnaireModal({ isOpen, patient, onClose }) {
  const { submitQuestionnaire } = usePatients();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state initialized with 100% MCQ structured options
  const [formData, setFormData] = useState(() => {
    if (patient?.questionnaire?.responses) {
      return { ...patient.questionnaire.responses };
    }
    return {
      chiefComplaint: 'Persistent Headaches & Elevated Blood Pressure',
      primarySite: 'Cardiology & Vascular',
      durationMonths: '1-3 months',
      weightLoss: 'None (Weight Stable)',
      appetite: 'Normal Food Intake',
      painScore: 'Level 1-3: Mild Pain',
      feverSweats: 'Absent',
      priorCancer: 'No Prior Chronic Comorbidities (First Hospital Evaluation)',
      cancerType: 'None',
      priorTreatments: ['Dietary & Lifestyle Modifications'],
      familyHistory: 'No Known Family Cardiovascular / Metabolic Disease',
      familyTumors: ['None'],
      familyOnsetAge: 'Not Applicable',
      currentMedications: ['No Chronic Medications'],
      allergies: ['No Known Drug Allergies (NKDA)'],
      ecogPerformance: 'ECOG 1: Ambulatory (Restricted in strenuous physical exertion)',
      smokingStatus: 'Never Smoked',
      alcoholUse: 'Never / Abstinent'
    };
  });

  if (!isOpen || !patient) return null;

  // Single-select MCQ handler
  const handleSelect = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Multi-select MCQ handler
  const handleMultiToggle = (field, item, exclusiveItem = null) => {
    setFormData(prev => {
      const current = prev[field] || [];
      if (exclusiveItem && item === exclusiveItem) {
        return { ...prev, [field]: [exclusiveItem] };
      }
      let updated = current.filter(i => i !== exclusiveItem);
      if (updated.includes(item)) {
        updated = updated.filter(i => i !== item);
        if (updated.length === 0 && exclusiveItem) {
          updated = [exclusiveItem];
        }
      } else {
        updated = [...updated, item];
      }
      return { ...prev, [field]: updated };
    });
  };

  const handleNext = () => {
    if (currentStep < 6) setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    submitQuestionnaire(patient.id, formData);
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 600);
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
                General Multispeciality Clinical Intake & Triage Questionnaire
              </h2>
              <span className="mrn-tag" style={{ fontSize: 10, padding: '1px 6px' }}>{patient.mrn}</span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
              Patient: <strong>{patient.fullName}</strong> ({patient.age}y {patient.gender}) • <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Standardized Clinical Screening</span>
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
          {/* STEP 1: Chief Complaint & Site */}
          {currentStep === 1 && (
            <div className="m3-animate-slide-down">
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  1. Primary Presenting Symptom / Reason for Consultation
                </div>
                <div className="mcq-question-hint">Select the predominant chief complaint reported by the patient.</div>
                <div className="mcq-options-grid">
                  {[
                    'Persistent Headaches & Hypertension Check',
                    'High Blood Sugar / Diabetic Review',
                    'Chronic Cough / Breathlessness / Wheezing',
                    'Acute / Recurrent Abdominal Pain & Dyspepsia',
                    'Chest Discomfort / Exertional Palpitations',
                    'Joint Pain / Chronic Lower Back Pain',
                    'Fever / Generalized Body Ache & Malaise',
                    'Post-Surgical Follow-up & Wound Check',
                    'Routine Annual Health Check-Up',
                    'Medication Refill & Chronic Care Review'
                  ].map(opt => (
                    <div
                      key={opt}
                      className={`mcq-card ${formData.chiefComplaint === opt ? 'selected' : ''}`}
                      onClick={() => handleSelect('chiefComplaint', opt)}
                    >
                      <div className="mcq-card-icon">
                        {formData.chiefComplaint === opt && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  2. Clinical Department & Specialty Stream
                </div>
                <div className="mcq-question-hint">Categorises the specialty routing and diagnostic pathway.</div>
                <div className="mcq-options-grid">
                  {[
                    'Internal / General Medicine',
                    'Cardiology & Vascular',
                    'Pulmonology & Chest Medicine',
                    'General & Laparoscopic Surgery',
                    'Gastroenterology & Hepatology',
                    'Endocrinology & Diabetology',
                    'Nephrology & Urology',
                    'Preventive & Wellness Care'
                  ].map(site => (
                    <div
                      key={site}
                      className={`mcq-card ${formData.primarySite === site ? 'selected' : ''}`}
                      onClick={() => handleSelect('primarySite', site)}
                    >
                      <div className="mcq-card-icon">
                        {formData.primarySite === site && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{site}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  3. Symptom Duration
                </div>
                <div className="mcq-options-grid">
                  {['< 2 Weeks', '2 to 4 Weeks', '1-3 Months', '3-6 Months', '> 6 Months (Chronic)'].map(dur => (
                    <div
                      key={dur}
                      className={`mcq-card ${formData.durationMonths === dur ? 'selected' : ''}`}
                      onClick={() => handleSelect('durationMonths', dur)}
                    >
                      <div className="mcq-card-icon">
                        {formData.durationMonths === dur && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{dur}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Constitutional Red Flags */}
          {currentStep === 2 && (
            <div className="m3-animate-slide-down">
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  1. Unintentional Weight Loss in Last 6 Months
                </div>
                <div className="mcq-options-grid">
                  {[
                    { label: 'None (Weight Stable)', sub: 'No significant loss' },
                    { label: 'Mild (< 5% total body weight)', sub: 'Minor appetite dip' },
                    { label: 'Significant (> 5kg unintentional)', sub: 'High metabolic red flag' }
                  ].map(opt => (
                    <div
                      key={opt.label}
                      className={`mcq-card ${formData.weightLoss === opt.label ? 'selected' : ''}`}
                      onClick={() => handleSelect('weightLoss', opt.label)}
                    >
                      <div className="mcq-card-icon">
                        {formData.weightLoss === opt.label && <Check size={9} strokeWidth={3} />}
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
                  2. Appetite & Nutritional Intake
                </div>
                <div className="mcq-options-grid">
                  {[
                    'Normal Daily Appetite',
                    'Mild Anorexia / Decreased Intake',
                    'Severe Early Satiety / Nausea'
                  ].map(opt => (
                    <div
                      key={opt}
                      className={`mcq-card ${formData.appetite === opt ? 'selected' : ''}`}
                      onClick={() => handleSelect('appetite', opt)}
                    >
                      <div className="mcq-card-icon">
                        {formData.appetite === opt && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  3. Clinical Pain Severity
                </div>
                <div className="mcq-options-grid">
                  {[
                    { label: 'Level 0: Pain-Free', sub: 'No analgesic needed' },
                    { label: 'Level 1-3: Mild Pain', sub: 'Minor discomfort, does not limit activity' },
                    { label: 'Level 4-6: Moderate Pain', sub: 'Interferes with sleep & daily routine' },
                    { label: 'Level 7-10: Severe / Excruciating', sub: 'Constant disabling pain, needs immediate opioid review' }
                  ].map(opt => (
                    <div
                      key={opt.label}
                      className={`mcq-card ${formData.painScore === opt.label ? 'selected' : ''}`}
                      onClick={() => handleSelect('painScore', opt.label)}
                    >
                      <div className="mcq-card-icon">
                        {formData.painScore === opt.label && <Check size={9} strokeWidth={3} />}
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
                  4. B-Symptoms: Fever / Night Sweats
                </div>
                <div className="mcq-options-grid">
                  {[
                    'Absent',
                    'Low-Grade Intermittent Fever',
                    'Drenching Night Sweats (Clothes Changing Required)'
                  ].map(opt => (
                    <div
                      key={opt}
                      className={`mcq-card ${formData.feverSweats === opt ? 'selected' : ''}`}
                      onClick={() => handleSelect('feverSweats', opt)}
                    >
                      <div className="mcq-card-icon">
                        {formData.feverSweats === opt && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Prior Medical History & Comorbidities */}
          {currentStep === 3 && (
            <div className="m3-animate-slide-down">
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  1. Prior Chronic Disease / Medical History
                </div>
                <div className="mcq-options-grid">
                  {[
                    { label: 'No Prior Chronic Comorbidities (First Hospital Evaluation)', sub: 'Primary evaluation & baseline workup' },
                    { label: 'Chronic Comorbidities — Under Medical Management', sub: 'Longstanding follow-up (HTN, Diabetes, etc.)' },
                    { label: 'Recent Acute Episode / Decompensation', sub: 'Exacerbation requiring urgent stabilization' }
                  ].map(opt => (
                    <div
                      key={opt.label}
                      className={`mcq-card ${formData.priorCancer === opt.label ? 'selected' : ''}`}
                      onClick={() => handleSelect('priorCancer', opt.label)}
                    >
                      <div className="mcq-card-icon">
                        {formData.priorCancer === opt.label && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {formData.priorCancer !== 'No Prior Chronic Comorbidities (First Hospital Evaluation)' && (
                <>
                  <div className="mcq-question-block">
                    <div className="mcq-question-title">
                      2. Primary Diagnosed Condition Category
                    </div>
                    <div className="mcq-options-grid">
                      {[
                        'Essential Hypertension',
                        'Type 2 Diabetes Mellitus',
                        'Coronary Artery Disease / Angina',
                        'Bronchial Asthma / COPD',
                        'Dyslipidemia & Metabolic Syndrome',
                        'Gastroesophageal Reflux / PUD'
                      ].map(type => (
                        <div
                          key={type}
                          className={`mcq-card ${formData.cancerType === type ? 'selected' : ''}`}
                          onClick={() => handleSelect('cancerType', type)}
                        >
                          <div className="mcq-card-icon">
                            {formData.cancerType === type && <Check size={9} strokeWidth={3} />}
                          </div>
                          <div className="mcq-card-content">
                            <span className="mcq-card-title">{type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mcq-question-block">
                    <div className="mcq-question-title">
                      3. Current / Prior Therapies Received (Select All That Apply)
                    </div>
                    <div className="mcq-options-grid">
                      {[
                        'Oral Antihypertensives (Telmisartan/Amlodipine)',
                        'Oral Hypoglycemic Agents (Metformin/SGLT2i)',
                        'Lipid-Lowering Statins (Atorvastatin)',
                        'Inhaled Bronchodilators / Corticosteroids',
                        'Proton Pump Inhibitors (Pantoprazole)'
                      ].map(rx => {
                        const isChecked = (formData.priorTreatments || []).includes(rx);
                        return (
                          <div
                            key={rx}
                            className={`mcq-card ${isChecked ? 'selected' : ''}`}
                            onClick={() => handleMultiToggle('priorTreatments', rx)}
                          >
                            <div className="mcq-card-icon">
                              {isChecked && <Check size={9} strokeWidth={3} />}
                            </div>
                            <div className="mcq-card-content">
                              <span className="mcq-card-title">{rx}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 4: Family Medical History */}
          {currentStep === 4 && (
            <div className="m3-animate-slide-down">
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  1. Family Degree of Relatedness with Chronic Disease
                </div>
                <div className="mcq-options-grid">
                  {[
                    { label: 'No Known Family Cardiovascular / Metabolic Disease', sub: 'Negative hereditary cluster' },
                    { label: 'First-Degree Relative (Parent, Sibling, Child)', sub: 'High familial genetic risk index' },
                    { label: 'Second-Degree Relative (Grandparent, Aunt, Uncle)', sub: 'Moderate familial index' },
                    { label: 'Multiple Family Members Across Generations', sub: 'Strong polygenic or syndromic pattern' }
                  ].map(opt => (
                    <div
                      key={opt.label}
                      className={`mcq-card ${formData.familyHistory === opt.label ? 'selected' : ''}`}
                      onClick={() => handleSelect('familyHistory', opt.label)}
                    >
                      <div className="mcq-card-icon">
                        {formData.familyHistory === opt.label && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                        <span className="mcq-card-sub">{opt.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {formData.familyHistory !== 'No Known Family Cardiovascular / Metabolic Disease' && (
                <>
                  <div className="mcq-question-block">
                    <div className="mcq-question-title">
                      2. Disease Conditions Present in Family (Multi-Select)
                    </div>
                    <div className="mcq-options-grid">
                      {[
                        'Early Coronary Artery Disease (< 55 yrs)',
                        'Type 2 Diabetes Mellitus',
                        'Severe Essential Hypertension',
                        'Bronchial Asthma / Allergic Rhinitis',
                        'Stroke / Cerebrovascular Disease',
                        'Chronic Kidney Disease'
                      ].map(tumor => {
                        const isChecked = (formData.familyTumors || []).includes(tumor);
                        return (
                          <div
                            key={tumor}
                            className={`mcq-card ${isChecked ? 'selected' : ''}`}
                            onClick={() => handleMultiToggle('familyTumors', tumor, 'None')}
                          >
                            <div className="mcq-card-icon">
                              {isChecked && <Check size={9} strokeWidth={3} />}
                            </div>
                            <div className="mcq-card-content">
                              <span className="mcq-card-title">{tumor}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mcq-question-block">
                    <div className="mcq-question-title">
                      3. Age at Earliest Onset in Relative
                    </div>
                    <div className="mcq-options-grid">
                      {[
                        { label: 'Early Onset (< 50 Years)', sub: 'Elevated premature disease risk index' },
                        { label: 'Standard Onset (50 to 70 Years)', sub: 'Typical adult chronic disease onset' },
                        { label: 'Late Onset (> 70 Years)', sub: 'Age-associated lifestyle or geriatric pattern' }
                      ].map(ageOpt => (
                        <div
                          key={ageOpt.label}
                          className={`mcq-card ${formData.familyOnsetAge === ageOpt.label ? 'selected' : ''}`}
                          onClick={() => handleSelect('familyOnsetAge', ageOpt.label)}
                        >
                          <div className="mcq-card-icon">
                            {formData.familyOnsetAge === ageOpt.label && <Check size={9} strokeWidth={3} />}
                          </div>
                          <div className="mcq-card-content">
                            <span className="mcq-card-title">{ageOpt.label}</span>
                            <span className="mcq-card-sub">{ageOpt.sub}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 5: Medications & Allergies */}
          {currentStep === 5 && (
            <div className="m3-animate-slide-down">
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  1. Current Active Prescriptions (Select All That Apply)
                </div>
                <div className="mcq-question-hint">Identifies drug-drug interactions and organ safety profile.</div>
                <div className="mcq-options-grid">
                  {[
                    'No Chronic Medications',
                    'Hypertension (Amlodipine, Telmisartan, Beta-blocker)',
                    'Type 2 Diabetes (Metformin, SGLT2, Insulin)',
                    'Thyroid Hormone (Levothyroxine)',
                    'Blood Thinners / Aspirin / Clopidogrel',
                    'Chronic NSAIDs / Pain Medications',
                    'Hormonal Therapy (Letrozole / Tamoxifen)',
                    'Steroids (Prednisolone / Dexamethasone)'
                  ].map(med => {
                    const isChecked = (formData.currentMedications || []).includes(med);
                    return (
                      <div
                        key={med}
                        className={`mcq-card ${isChecked ? 'selected' : ''}`}
                        onClick={() => handleMultiToggle('currentMedications', med, 'No Chronic Medications')}
                      >
                        <div className="mcq-card-icon">
                          {isChecked && <Check size={9} strokeWidth={3} />}
                        </div>
                        <div className="mcq-card-content">
                          <span className="mcq-card-title">{med}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  2. Known Drug Allergies (Select All That Apply)
                </div>
                <div className="mcq-question-hint">Alerts doctor dashboard before medication prescription or contrast imaging.</div>
                <div className="mcq-options-grid">
                  {[
                    'No Known Drug Allergies (NKDA)',
                    'Penicillin / Beta-Lactam Antibiotics',
                    'Sulfa-Based Medications',
                    'NSAIDs / Aspirin Anaphylactoid',
                    'IV CT Radiocontrast Dye Allergy',
                    'Opioid / Codeine Hypersensitivity'
                  ].map(allergy => {
                    const isChecked = (formData.allergies || []).includes(allergy);
                    return (
                      <div
                        key={allergy}
                        className={`mcq-card ${isChecked ? 'selected' : ''}`}
                        onClick={() => handleMultiToggle('allergies', allergy, 'No Known Drug Allergies (NKDA)')}
                      >
                        <div className="mcq-card-icon">
                          {isChecked && <Check size={9} strokeWidth={3} />}
                        </div>
                        <div className="mcq-card-content">
                          <span className="mcq-card-title">{allergy}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: ECOG Performance Status & Submit */}
          {currentStep === 6 && (
            <div className="m3-animate-slide-down">
              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  1. ECOG Functional Performance Status
                </div>
                <div className="mcq-question-hint">Standardized clinical index evaluating patient functional mobility and physical stamina.</div>
                <div className="mcq-options-grid-2">
                  {[
                    { label: 'ECOG 0: Fully Active', sub: 'Able to carry on all pre-disease performance without restriction' },
                    { label: 'ECOG 1: Ambulatory / Strenuous Restricted', sub: 'Able to do light work; restricted in physically strenuous tasks' },
                    { label: 'ECOG 2: Capable of Self-Care / In Bed < 50%', sub: 'Up & about > 50% of waking hours; unable to perform work' },
                    { label: 'ECOG 3: Confined to Bed/Chair > 50%', sub: 'Limited self-care; spends > 50% of waking hours in bed or chair' },
                    { label: 'ECOG 4: Completely Bedbound', sub: 'Totally confined to bed or chair; 100% dependent on nursing care' }
                  ].map(ecog => (
                    <div
                      key={ecog.label}
                      className={`mcq-card ${formData.ecogPerformance === ecog.label ? 'selected' : ''}`}
                      onClick={() => handleSelect('ecogPerformance', ecog.label)}
                    >
                      <div className="mcq-card-icon">
                        {formData.ecogPerformance === ecog.label && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{ecog.label}</span>
                        <span className="mcq-card-sub">{ecog.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mcq-question-block">
                <div className="mcq-question-title">
                  2. Tobacco & Alcohol Lifestyle Risk
                </div>
                <div className="mcq-options-grid">
                  {[
                    { label: 'Never Smoked / Non-Drinker' },
                    { label: 'Former Smoker (Quit > 1 Year)' },
                    { label: 'Active Smoker (< 1 Pack/Day)' },
                    { label: 'Heavy Active Smoker (> 1 Pack/Day)' }
                  ].map(opt => (
                    <div
                      key={opt.label}
                      className={`mcq-card ${formData.smokingStatus === opt.label ? 'selected' : ''}`}
                      onClick={() => handleSelect('smokingStatus', opt.label)}
                    >
                      <div className="mcq-card-icon">
                        {formData.smokingStatus === opt.label && <Check size={9} strokeWidth={3} />}
                      </div>
                      <div className="mcq-card-content">
                        <span className="mcq-card-title">{opt.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
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
                      Submitting triggers the deep-learning classifier and NLP clinical summarizer (ClinicalInsight v2.1). Results stream directly to Dr. Kiran Patel's doctor console.
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
              title="Submit intake triage questionnaire and run ClinicalInsight AI model"
            >
              <Sparkles size={14} />
              <span>{isSubmitting ? 'Transmitting...' : '⚡ Submit & Run ClinicalInsight AI'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
