import React, { createContext, useContext, useState } from 'react';
import { INITIAL_PATIENTS } from '../utils/mockData';

const PatientContext = createContext();

export function PatientProvider({ children }) {
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState("pat-001");
  const [toasts, setToasts] = useState([]);

  // Toast notification helper
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, message, type, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  // Register a new patient
  const registerPatient = (patientData) => {
    const nextNum = 140 + patients.length + 1;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newPatient = {
      id: `pat-${Date.now()}`,
      mrn: `MRN-2026-0${nextNum}`,
      fullName: patientData.fullName,
      age: parseInt(patientData.age, 10) || 0,
      gender: patientData.gender,
      dob: patientData.dob,
      phone: patientData.phone,
      address: patientData.address,
      emergencyContact: {
        name: patientData.emergencyContactName || 'N/A',
        phone: patientData.emergencyContactPhone || 'N/A'
      },
      appointmentTime: timeStr,
      doctorAssigned: patientData.doctorAssigned || "Dr. Ananya Sharma (General & Internal Medicine)",
      status: "QUESTIONNAIRE_PENDING",
      registeredAt: timeStr,
      abhaId: patientData.abhaId || "",
      abhaAddress: patientData.abhaAddress || "",
      insurance: {
        type: patientData.insuranceType || "INSURANCE",
        provider: patientData.insuranceType === 'GOVT_SCHEME' 
          ? (patientData.govtSchemeName || "Ayushman Bharat — PM-JAY (AB-PMJAY)")
          : (patientData.insuranceProvider || "Self-Pay / Cash"),
        policyNumber: patientData.policyNumber || patientData.beneficiaryId || "N/A",
        groupNumber: patientData.groupNumber || "N/A",
        coveragePct: patientData.insuranceType === 'GOVT_SCHEME' 
          ? 100 
          : (Number(patientData.coveragePct) || (patientData.insuranceType === 'CASH' ? 0 : 80)),
        deductible: patientData.insuranceType === 'GOVT_SCHEME' ? 0 : (Number(patientData.deductible) || 0),
        preAuthNumber: patientData.preAuthNumber || (patientData.insuranceType === 'GOVT_SCHEME' ? 'PMJAY-AUTO-PREAUTH' : ''),
        abhaId: patientData.abhaId || "",
        abhaAddress: patientData.abhaAddress || "",
        govtSchemeName: patientData.govtSchemeName || "",
        beneficiaryId: patientData.beneficiaryId || patientData.policyNumber || ""
      },
      vitals: {
        weight: patientData.weight || '62',
        height: patientData.height || '165',
        bmi: patientData.bmi || '22.8',
        bp: patientData.bp || '120/80',
        pulse: patientData.pulse || '72',
        temp: patientData.temp || '98.4',
        spo2: patientData.spo2 || '99',
        respRate: patientData.respRate || '16',
        recordedAt: timeStr
      },
      questionnaire: {
        completed: false,
        completedAt: null,
        responses: null
      },
      mlInsights: null
    };

    setPatients(prev => [newPatient, ...prev]);
    setSelectedPatientId(newPatient.id);
    addToast(`Patient ${newPatient.fullName} registered (${newPatient.mrn}). Ready for intake questionnaire.`, 'success');
    return newPatient;
  };

  // Update existing patient data
  const updatePatient = (id, updates) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // Submit questionnaire and trigger ML insight generation
  const submitQuestionnaire = (patientId, responses) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Step 1: Set questionnaire as completed & status to generating
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        status: "INSIGHTS_GENERATING",
        questionnaire: {
          completed: true,
          completedAt: timeStr,
          responses
        }
      };
    }));

    addToast(`Questionnaire submitted. AI model analysis in progress...`, 'info');

    // Step 2: Simulate ML / DL model inference (takes 1.8 seconds)
    setTimeout(() => {
      setPatients(prev => prev.map(p => {
        if (p.id !== patientId) return p;

        // Determine dynamic risk flags based on MCQ choices
        const hasPriorChronic = responses.priorCancer && !responses.priorCancer.includes('No Prior');
        const hasSignificantWeightLoss = responses.weightLoss && responses.weightLoss.includes('Significant');
        const hasSmokingRisk = responses.smokingStatus && (responses.smokingStatus.includes('Active') || responses.smokingStatus.includes('Heavy'));
        const hasFamilyHistory = responses.familyHistory && !responses.familyHistory.includes('No Known');
        const hasSeverePain = responses.painScore && responses.painScore.includes('Severe');
        const hasBSymptoms = responses.feverSweats && responses.feverSweats.includes('Drenching');

        const flags = [];
        let riskLevel = "LOW";
        let confidenceScore = 88;

        if (hasPriorChronic) {
          flags.push({
            label: "Chronic Comorbidity Management Alert",
            severity: "HIGH",
            note: `History: ${responses.cancerType || 'diagnosed medical conditions'}. Treatments: ${(responses.priorTreatments || []).join(', ') || 'ongoing'}. Close organ monitoring indicated.`
          });
          riskLevel = "HIGH";
          confidenceScore = 92;
        }

        if (hasSignificantWeightLoss || hasBSymptoms) {
          flags.push({
            label: "Constitutional Metabolic Red Flag",
            severity: "HIGH",
            note: `${hasSignificantWeightLoss ? 'Significant unintentional weight loss' : ''} ${hasBSymptoms ? 'Drenching night sweats' : ''}. Requires urgent diagnostic workup.`
          });
          riskLevel = "HIGH";
          confidenceScore = 89;
        }

        if (hasSmokingRisk) {
          flags.push({
            label: "Cardiovascular & Respiratory Risk (Tobacco)",
            severity: "HIGH",
            note: `Tobacco use history: ${responses.smokingStatus}. Correlates with elevated cardiovascular and airway disease risk.`
          });
          if (riskLevel !== "HIGH") riskLevel = "MEDIUM";
        }

        if (hasFamilyHistory) {
          flags.push({
            label: "Familial Cardiovascular / Metabolic Clustering",
            severity: "MEDIUM",
            note: `${responses.familyHistory}. Family conditions: ${(responses.familyTumors || []).join(', ') || 'Specified'}. Preventive risk scoring advised.`
          });
          if (riskLevel !== "HIGH") riskLevel = "MEDIUM";
        }

        if (hasSeverePain) {
          flags.push({
            label: "Acute Analgesia & Pain Stabilization Required",
            severity: "HIGH",
            note: "Patient reports severe/excruciating pain score (7-10/10). Immediate physician review and analgesic titration needed."
          });
        }

        if (flags.length === 0) {
          flags.push({
            label: "Routine Clinical Triage",
            severity: "LOW",
            note: "No acute critical red flags detected. Standard outpatient clinical consultation recommended."
          });
          riskLevel = "LOW";
          confidenceScore = 94;
        }

        const generatedInsights = {
          generatedAt: fullTime,
          modelVersion: "ClinicalInsight-v2.1",
          overallRisk: riskLevel,
          confidence: confidenceScore,
          riskFlags: flags,
          symptomSummary: `${p.age}yo ${p.gender.toLowerCase()} presenting with ${responses.chiefComplaint} (${responses.primarySite || 'General'}, duration: ${responses.durationMonths || '1-3 months'}). Functional status: ${responses.ecogPerformance || 'ECOG 1'}.`,
          recommendedInvestigations: [
            { id: `inv-${Date.now()}-1`, name: "12-Lead Electrocardiogram (ECG) & 2D Echo", urgency: riskLevel === 'HIGH' ? 'Urgent' : 'Routine' },
            { id: `inv-${Date.now()}-2`, name: "Comprehensive Metabolic Panel (HbA1c, LFT, KFT)", urgency: 'Routine' },
            { id: `inv-${Date.now()}-3`, name: "High-Resolution Chest Radiography / USG Abdomen", urgency: 'Routine' }
          ]
        };

        return {
          ...p,
          status: "INSIGHTS_READY",
          mlInsights: generatedInsights
        };
      }));

      addToast(`✨ AI Insights generated & pushed to Doctor Dashboard for ${patients.find(p => p.id === patientId)?.fullName || 'patient'}!`, 'success');
    }, 1800);
  };

  // Quick stats
  const stats = {
    total: patients.length,
    registered: patients.filter(p => p.status === 'REGISTERED').length,
    pendingQuestionnaire: patients.filter(p => p.status === 'QUESTIONNAIRE_PENDING').length,
    insightsReady: patients.filter(p => p.status === 'INSIGHTS_READY').length,
    inConsultation: patients.filter(p => p.status === 'IN_CONSULTATION').length,
    completed: patients.filter(p => p.status === 'COMPLETED').length
  };

  return (
    <PatientContext.Provider value={{
      patients,
      selectedPatient,
      selectedPatientId,
      setSelectedPatientId,
      registerPatient,
      updatePatient,
      submitQuestionnaire,
      stats,
      toasts,
      addToast,
      removeToast
    }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
}
