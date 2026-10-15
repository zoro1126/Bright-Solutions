// Deprecated - Old walkthrough context eliminated in favor of role-based interactive flow guides
import React from 'react';

export function useWalkthrough() {
  return {
    isGuideActive: false,
    currentStep: 1,
    totalSteps: 1,
    currentStepData: null,
    startGuide: () => {},
    stopGuide: () => {},
    nextStep: () => {},
    prevStep: () => {}
  };
}

export function WalkthroughProvider({ children }) {
  return children;
}
