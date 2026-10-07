import React, { useState, useEffect } from 'react';
import { useWalkthrough, WALKTHROUGH_STEPS } from '../context/WalkthroughContext';
import { usePatients } from '../context/PatientContext';
import { 
  Gamepad2, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Minimize2, 
  Maximize2, 
  Zap, 
  CheckCircle2, 
  Trophy, 
  Flame, 
  Compass, 
  ShieldCheck, 
  ArrowRight,
  RotateCcw,
  Star,
  Award
} from 'lucide-react';

export default function GameGuideWalkthrough({ onSwitchRole, currentRole }) {
  const { 
    isGuideActive, 
    currentStep, 
    totalSteps, 
    currentStepData, 
    isMinimized, 
    setIsMinimized, 
    completedSteps, 
    stopGuide, 
    nextStep, 
    prevStep, 
    goToStep,
    startGuide 
  } = useWalkthrough();

  const { registerPatient, submitQuestionnaire, updatePatient, setSelectedPatientId, addToast, patients } = usePatients();
  const [isAutoPiloting, setIsAutoPiloting] = useState(false);
  const [showVictory, setShowVictory] = useState(false);

  // If walkthrough is completed
  const isFinished = completedSteps.length >= 5 && currentStep === 5;

  // Handle Auto-Pilot action for current stage
  const handleAutoPilot = () => {
    setIsAutoPiloting(true);

    if (currentStep === 1) {
      addToast('🎮 Auto-Pilot: Registering PM-JAY Golden Card patient...', 'info');
      setTimeout(() => {
        const newPat = registerPatient({
          fullName: 'Sangeetha Krishnan',
          dob: '1974-06-18',
          age: '52',
          gender: 'Female',
          phone: '+91 98400 98210',
          address: 'Plot 44, Gandhi Road, Tambaram, Chennai',
          emergencyContactName: 'Murali Krishnan (Son)',
          emergencyContactPhone: '+91 98400 98211',
          doctorAssigned: 'Dr. Kiran Patel (Medical Oncology)',
          insuranceType: 'GOVT_SCHEME',
          insuranceProvider: 'Ayushman Bharat — PM-JAY (AB-PMJAY)',
          policyNumber: 'PMJAY-TN-9821034',
          groupNumber: 'NHA-ABDM-01',
          coveragePct: 100,
          deductible: 0,
          preAuthNumber: 'PMJAY-PREAUTH-APPROVED',
          govtSchemeName: 'Ayushman Bharat — PM-JAY (AB-PMJAY)',
          beneficiaryId: 'PMJAY-TN-9821034',
          abhaId: '91-4820-1928-3819',
          abhaAddress: 'sangeetha.krishnan@abdm'
        });
        setSelectedPatientId(newPat.id);
        setIsAutoPiloting(false);
        addToast('✨ Stage 1 Complete! +150 XP. Proceeding to Clinical Intake & AI Staging...', 'success');
        nextStep();
      }, 900);
    } else if (currentStep === 2) {
      addToast('🎮 Auto-Pilot: Submitting Clinical Intake & triggering OncoInsight AI...', 'info');
      setTimeout(() => {
        const targetPat = patients.find(p => p.status === 'QUESTIONNAIRE_PENDING') || patients[0];
        if (targetPat) {
          submitQuestionnaire(targetPat.id, {
            chiefComplaint: 'Palpable Right Breast Mass & Bone Pain',
            primarySite: 'Breast / Mammary',
            durationMonths: '2-3 months',
            weightLoss: 'Significant Unintentional (>5kg)',
            appetite: 'Reduced Intake / Anorexia',
            painScore: 'Level 4-6: Moderate Pain',
            feverSweats: 'Drenching Night Sweats',
            priorCancer: 'Invasive Ductal Carcinoma (Right Breast)',
            cancerType: 'Invasive Ductal Carcinoma',
            priorTreatments: ['Chemotherapy (AC-T)', 'Radiation Therapy'],
            familyHistory: 'Maternal Ovarian Carcinoma at age 49',
            familyTumors: ['Breast', 'Ovary'],
            currentMedications: ['Letrozole 2.5mg OD'],
            allergies: ['Penicillin (rash)'],
            ecogPerformance: 'ECOG 1: Ambulatory',
            smokingStatus: 'Never Smoked'
          });
        }
        setIsAutoPiloting(false);
        addToast('✨ Stage 2 Complete! +200 XP. OncoInsight AI risk analysis active!', 'success');
        nextStep();
      }, 1000);
    } else if (currentStep === 3) {
      addToast('🎮 Auto-Pilot: Teleporting to Dr. Patel\'s Daycare Command Center...', 'info');
      setTimeout(() => {
        if (onSwitchRole) onSwitchRole('doctor');
        setIsAutoPiloting(false);
        addToast('✨ Stage 3 Complete! +250 XP. Chemotherapy flow pumps & Sentinel alerts active!', 'success');
        nextStep();
      }, 700);
    } else if (currentStep === 4) {
      addToast('🎮 Auto-Pilot: Reviewing CT Chest DICOM & Transmitting Digital Rx to Cashier...', 'info');
      setTimeout(() => {
        if (onSwitchRole) onSwitchRole('doctor');
        const pat = patients[0];
        if (pat) {
          updatePatient(pat.id, {
            status: 'COMPLETED',
            billingStatus: 'READY',
            prescriptions: [
              { drug: 'Letrozole (2.5mg)', dose: '2.5mg', qty: '30 Tabs', freq: '0-0-1', days: '30d', mealTiming: 'After Meals', notes: 'Daily endocrine therapy' },
              { drug: 'Ondansetron (4mg)', dose: '4mg', qty: '10 Tabs', freq: 'SOS', days: '5d', mealTiming: 'Before Meals', notes: 'Take 30m prior to chemotherapy' },
              { drug: 'Pantoprazole (40mg)', dose: '40mg', qty: '14 Tabs', freq: '1-0-0', days: '14d', mealTiming: 'Before Meals', notes: 'Early morning with water' }
            ]
          });
        }
        setIsAutoPiloting(false);
        addToast('✨ Stage 4 Complete! +300 XP. Consultation signed and transmitted to Cashier!', 'success');
        nextStep();
      }, 1000);
    } else if (currentStep === 5) {
      addToast('🎮 Auto-Pilot: Processing 100% Cashless PM-JAY hospital settlement...', 'info');
      setTimeout(() => {
        if (onSwitchRole) onSwitchRole('cashier');
        const pat = patients.find(p => p.insurance?.type === 'GOVT_SCHEME') || patients[0];
        if (pat) {
          updatePatient(pat.id, { billingStatus: 'PAID', status: 'COMPLETED' });
        }
        setIsAutoPiloting(false);
        setShowVictory(true);
        addToast('🏆 QUEST COMPLETE! +400 XP. Full Hospital Care Stream Executed!', 'success');
      }, 1100);
    }
  };

  if (!isGuideActive) return null;

  // Minimized Floating Game Badge
  if (isMinimized) {
    return (
      <div 
        className="game-hud-minimized m3-animate-slide-up"
        onClick={() => setIsMinimized(false)}
        title="Click to expand Demo Guide HUD"
      >
        <div className="game-hud-mini-icon">
          <Gamepad2 size={18} color="#f59e0b" className="m3-animate-pulse" />
        </div>
        <div className="game-hud-mini-info">
          <span className="game-hud-mini-quest">STAGE {currentStep}/5</span>
          <span className="game-hud-mini-title">{currentStepData.badge}</span>
        </div>
        <button className="game-hud-mini-btn" onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}>
          <Maximize2 size={13} />
        </button>
      </div>
    );
  }

  // Percentage for progress bar
  const progressPct = Math.round((currentStep / totalSteps) * 100);

  return (
    <>
      {/* Gamified Floating HUD Card */}
      <div className="game-walkthrough-hud m3-animate-slide-up">
        {/* Ambient RPG Glowing Blob */}
        <div className="stat-card-accent-blob blob-yellow" style={{ top: -30, right: -30, width: 120, height: 120, opacity: 0.45 }} />

        {/* HUD Top Bar */}
        <div className="game-hud-header">
          <div className="game-hud-title-group">
            <div className="game-hud-badge-container">
              <span className="game-quest-pill">
                <Flame size={12} color="#f59e0b" fill="#f59e0b" />
                <span>{currentStepData.quest}</span>
              </span>
              <span className="game-xp-pill">{currentStepData.xp}</span>
            </div>
            <h3 className="game-hud-headline">
              {currentStepData.title}
            </h3>
          </div>

          <div className="game-hud-controls">
            <button 
              className="game-hud-ctrl-btn" 
              onClick={() => setIsMinimized(true)}
              title="Minimize HUD to corner badge"
            >
              <Minimize2 size={14} />
            </button>
            <button 
              className="game-hud-ctrl-btn" 
              onClick={stopGuide}
              title="Exit Guide"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* HUD Level Progress Bar */}
        <div className="game-hud-progress-wrapper">
          <div className="game-hud-progress-labels">
            <span>{currentStepData.level}</span>
            <span>{progressPct}% COMPLETED</span>
          </div>
          <div className="game-hud-progress-track">
            <div 
              className="game-hud-progress-fill" 
              style={{ width: `${progressPct}%` }}
            />
          </div>
          
          {/* Stage Step Indicators */}
          <div className="game-hud-steps-indicator">
            {WALKTHROUGH_STEPS.map((s) => {
              const isDone = completedSteps.includes(s.step);
              const isCurr = s.step === currentStep;
              return (
                <div 
                  key={s.step} 
                  className={`game-step-dot ${isCurr ? 'active' : isDone ? 'completed' : ''}`}
                  onClick={() => goToStep(s.step)}
                  title={`Stage ${s.step}: ${s.title}`}
                >
                  {isDone ? '✓' : s.step}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mission Briefing Box */}
        <div className="game-hud-body">
          <div className="game-hud-avatar-briefing">
            <div className="game-hud-guide-avatar">
              <span>DB</span>
              <div className="guide-avatar-badge">AI</div>
            </div>
            <div className="game-hud-briefing-text">
              <div className="game-hud-speaker">Dr. Bright • Clinical Onboarding Guide</div>
              <p className="game-hud-narrative">
                "{currentStepData.narrative}"
              </p>
            </div>
          </div>

          {/* Quest Objectives Checklist */}
          <div className="game-hud-checklist">
            <span className="game-checklist-header">MISSION OBJECTIVES:</span>
            {currentStepData.checklist.map((item, idx) => (
              <div key={idx} className="game-checklist-item">
                <div className="game-check-bullet">
                  <CheckCircle2 size={13} color="var(--primary)" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Pro-Tip Hint */}
          <div className="game-hud-hint">
            <Sparkles size={13} color="#f59e0b" style={{ flexShrink: 0 }} />
            <span>{currentStepData.hint}</span>
          </div>
        </div>

        {/* HUD Action Footer */}
        <div className="game-hud-footer">
          <div className="game-hud-footer-left">
            <button
              className="game-nav-btn"
              onClick={prevStep}
              disabled={currentStep === 1 || isAutoPiloting}
              title="Previous Quest"
            >
              <ChevronLeft size={15} />
              <span>Back</span>
            </button>
            <button
              className="game-nav-btn"
              onClick={nextStep}
              disabled={currentStep === totalSteps || isAutoPiloting}
              title="Next Quest"
            >
              <span>Next</span>
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="game-hud-footer-right">
            <button
              className="game-autopilot-btn anim-hover-lift"
              onClick={handleAutoPilot}
              disabled={isAutoPiloting}
              title="Automatically execute this stage for a seamless client demo!"
            >
              <Zap size={14} className={isAutoPiloting ? "m3-animate-pulse" : ""} fill="#ffffff" />
              <span>{isAutoPiloting ? 'Executing Quest...' : '⚡ Auto-Pilot Stage'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Victory Celebration Modal */}
      {showVictory && (
        <div className="modal-overlay m3-dialog-backdrop" onClick={() => setShowVictory(false)}>
          <div 
            className="modal-content m3-dialog-container game-victory-modal m3-animate-scale"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520, textAlign: 'center', padding: '32px 28px' }}
          >
            <div className="victory-trophy-container">
              <Trophy size={48} color="#f59e0b" />
            </div>

            <span className="game-quest-pill" style={{ margin: '12px auto 6px' }}>
              <Award size={13} color="#f59e0b" fill="#f59e0b" />
              <span>LEVEL 5 MAX • ALL QUESTS CLEARED</span>
            </span>

            <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginTop: 8 }}>
              Hospital Care Stream Mastered!
            </h2>
            
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
              You have successfully completed the entire end-to-end oncology hospital flow: from <strong>1-Click Registration</strong>, <strong>AI Staging Triage</strong>, <strong>Daycare Chemotherapy Monitoring</strong>, <strong>DICOM & Digital Rx</strong>, through to <strong>100% Cashless PM-JAY Settlement & Tax Invoicing</strong>!
            </p>

            <div className="victory-stats-grid">
              <div className="victory-stat-item">
                <span className="victory-stat-val">5 / 5</span>
                <span className="victory-stat-lbl">Quests Cleared</span>
              </div>
              <div className="victory-stat-item">
                <span className="victory-stat-val">+1,300</span>
                <span className="victory-stat-lbl">Total Demo XP</span>
              </div>
              <div className="victory-stat-item">
                <span className="victory-stat-val">100%</span>
                <span className="victory-stat-lbl">Cashless Settled</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
              <button 
                className="m3-btn m3-btn-outlined"
                onClick={() => {
                  setShowVictory(false);
                  startGuide();
                }}
              >
                <RotateCcw size={14} />
                <span>Replay Walkthrough</span>
              </button>
              <button 
                className="m3-btn m3-btn-filled"
                onClick={() => {
                  setShowVictory(false);
                  stopGuide();
                }}
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#ffffff' }}
              >
                <span>Free Exploration Mode</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
