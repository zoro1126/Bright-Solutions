import React, { createContext, useContext, useState, useCallback } from 'react';

const WalkthroughContext = createContext();

export const WALKTHROUGH_STEPS = [
  {
    step: 1,
    title: 'New Patient Registration',
    role: 'receptionist',
    selector: '[data-tour="new-patient-btn"]',
    targetDescription: '+ New Patient Registration',
    description: 'Click "+ New Patient Registration" to initiate registration of a new oncology patient into the clinic care stream.',
    hint: 'Opens the clinical demographics, vital signs triage, and insurance modal with Ayushman Bharat ABHA integration.'
  },
  {
    step: 2,
    title: 'Auto-Fill PM-JAY Cashless Profile',
    role: 'receptionist',
    selector: '[data-tour="demo-pmjay-btn"]',
    targetDescription: 'Ayushman Bharat PM-JAY (100% Cashless)',
    description: 'Click "Ayushman Bharat PM-JAY" to auto-populate complete patient demographics with 100% government coverage and verified ABHA ID.',
    hint: 'Loads Sangeetha Krishnan, pre-authorisation token, and instant ABHA verification.'
  },
  {
    step: 3,
    title: 'Record & Verify Triage Vitals',
    role: 'receptionist',
    selector: '[data-tour="vitals-quick-fill"]',
    targetDescription: '⚡ Auto-fill Normal Vitals Button',
    description: 'Click "⚡ Auto-fill Normal Vitals" to record patient baseline biometrics (Blood Pressure, Heart Rate, Temp, SpO2, Weight, Height, and computed BMI).',
    hint: 'Simulates reception nursing triage entry before physician consultation.'
  },
  {
    step: 4,
    title: 'Register & Launch Clinical Intake',
    role: 'receptionist',
    selector: '[data-tour="register-submit-btn"]',
    targetDescription: 'Register & Start Intake Button',
    description: 'Click "Register & Start Intake" to submit the demographics and vitals, immediately transitioning to the clinical triage questionnaire.',
    hint: 'Commits the patient with vital signs into the clinic queue and launches the 6-step oncology screening modal.'
  },
  {
    step: 5,
    title: 'Submit Questionnaire & Run AI Model',
    role: 'receptionist',
    selector: '[data-tour="submit-intake-btn"]',
    targetDescription: '⚡ Submit & Run OncoInsight AI Button',
    description: 'Click "⚡ Submit & Run OncoInsight AI" to execute real-time deep learning classification on symptoms, family history, and ECOG score.',
    hint: 'Generates instant recurrence risk stratification, flags high-risk biomarkers, and alerts Dr. Patel.'
  },
  {
    step: 6,
    title: 'Switch to Doctor Workspace',
    role: 'receptionist',
    selector: '[data-tour="role-doctor-btn"]',
    targetDescription: 'Doctor Role Switcher Button',
    description: 'Click "Doctor" in the top navigation bar to switch to Dr. Kiran Patel\'s Oncologist Clinical Workspace.',
    hint: 'Demonstrates real-time inter-departmental patient handoff from reception to oncology consult.'
  },
  {
    step: 7,
    title: 'Inspect Axial DICOM CT Slices',
    role: 'doctor',
    selector: '[data-tour="doctor-tab-dicom"]',
    targetDescription: 'DICOM Scans Tab Button',
    description: 'Click the "DICOM Scans" tab to review high-resolution axial chest CT scans with 148 slices and Hounsfield window presets.',
    hint: 'Explore the slice slider, Lung/Mediastinum presets, and measurement calipers.'
  },
  {
    step: 8,
    title: 'Review Digital Oncology Prescription',
    role: 'doctor',
    selector: '[data-tour="doctor-tab-rx"]',
    targetDescription: 'Prescription Tab Button',
    description: 'Click the "Prescription" tab to inspect prescribed supportive systemic therapy, anti-emetics, and dosage frequency.',
    hint: 'Prescribed oral drugs automatically link to the pharmacy inventory and cashier bill!'
  },
  {
    step: 9,
    title: 'Finalize Consultation & Transmit Bill',
    role: 'doctor',
    selector: '[data-tour="finalize-consult-btn"]',
    targetDescription: 'Finalize & Send to Cashier Button',
    description: 'Click "Finalize & Send to Cashier" to digitally lock clinical findings, finalize the prescription, and route the bill to Cashier Counter B-02.',
    hint: 'Locks the patient visit and automatically transitions their status to "Pending Billing".'
  },
  {
    step: 10,
    title: 'Switch to Cashier & Billing',
    role: 'doctor',
    selector: '[data-tour="role-cashier-btn"]',
    targetDescription: 'Cashier Role Switcher Button',
    description: 'Click "Cashier" in the top navigation bar to move to Cashier Counter B-02 for billing settlement and pharmacy dispensing.',
    hint: 'Patient Ananya Sharma / Sangeetha Krishnan is queued with the completed itemized charge sheet.'
  },
  {
    step: 11,
    title: 'Open Itemized Settlement Pop-up',
    role: 'cashier',
    selector: '[data-tour="settle-bill-btn"]',
    targetDescription: 'Settle Bill Button',
    description: 'Click "Settle Bill" to open the comprehensive itemized charge sheet breakdown of clinical procedures and pharmacy medicines.',
    hint: 'Displays procedure fees, oral chemo medicines, GST breakout, and PM-JAY government claim deduction.'
  },
  {
    step: 12,
    title: '100% Cashless Settlement & Tax Invoice',
    role: 'cashier',
    selector: '[data-tour="settle-payment-btn"]',
    targetDescription: 'Settle 100% Cashless Button',
    description: 'Click "Settle 100% Cashless" to authorize zero-balance PM-JAY claim and generate the official GST Tax Invoice and dispensing slip!',
    hint: 'Completes the entire care cycle: Demographics & Triage Vitals → AI Triage → Oncologist Cockpit → 100% Cashless Invoice!'
  }
];

export function WalkthroughProvider({ children, onSwitchRole, currentRole }) {
  const [isGuideActive, setIsGuideActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isMinimized, setIsMinimized] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isAutoPiloting, setIsAutoPiloting] = useState(false);

  const totalSteps = WALKTHROUGH_STEPS.length;
  const currentStepData = WALKTHROUGH_STEPS.find(s => s.step === currentStep) || WALKTHROUGH_STEPS[0];

  const startGuide = useCallback(() => {
    setIsGuideActive(true);
    setCurrentStep(1);
    setIsMinimized(false);
    if (onSwitchRole && currentRole !== 'receptionist') {
      onSwitchRole('receptionist');
    }
  }, [onSwitchRole, currentRole]);

  const stopGuide = useCallback(() => {
    setIsGuideActive(false);
  }, []);

  const goToStep = useCallback((stepNum) => {
    const validStep = Math.max(1, Math.min(totalSteps, stepNum));
    setCurrentStep(validStep);
    const targetData = WALKTHROUGH_STEPS.find(s => s.step === validStep);
    if (targetData && onSwitchRole && targetData.role !== currentRole) {
      onSwitchRole(targetData.role);
    }
  }, [totalSteps, onSwitchRole, currentRole]);

  const nextStep = useCallback(() => {
    setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
    if (currentStep < totalSteps) {
      goToStep(currentStep + 1);
    } else {
      setCompletedSteps(Array.from({ length: totalSteps }, (_, i) => i + 1));
    }
  }, [currentStep, totalSteps, goToStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  return (
    <WalkthroughContext.Provider value={{
      isGuideActive,
      currentStep,
      totalSteps,
      currentStepData,
      isMinimized,
      setIsMinimized,
      completedSteps,
      startGuide,
      stopGuide,
      nextStep,
      prevStep,
      goToStep,
      isAutoPiloting,
      setIsAutoPiloting
    }}>
      {children}
    </WalkthroughContext.Provider>
  );
}

export function useWalkthrough() {
  const context = useContext(WalkthroughContext);
  if (!context) {
    throw new Error('useWalkthrough must be used within a WalkthroughProvider');
  }
  return context;
}
