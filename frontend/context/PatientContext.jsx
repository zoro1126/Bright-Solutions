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
      doctorAssigned: patientData.doctorAssigned || "Dr. Kiran Patel (Medical Oncology)",
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
        const hasPriorCancer = responses.priorCancer && !responses.priorCancer.includes('No Prior');
        const hasSignificantWeightLoss = responses.weightLoss && responses.weightLoss.includes('Significant');
        const hasSmokingRisk = responses.smokingStatus && (responses.smokingStatus.includes('Active') || responses.smokingStatus.includes('Heavy'));
        const hasFamilyHistory = responses.familyHistory && !responses.familyHistory.includes('No Known');
        const hasSeverePain = responses.painScore && responses.painScore.includes('Severe');
        const hasBSymptoms = responses.feverSweats && responses.feverSweats.includes('Drenching');

        const flags = [];
        let riskLevel = "LOW";
        let confidenceScore = 86;

        if (hasPriorCancer) {
          flags.push({
            label: "Prior Malignancy Recurrence Alert",
            severity: "HIGH",
            note: `History: ${responses.cancerType || 'previous primary'}. Prior treatment: ${(responses.priorTreatments || []).join(', ') || 'recorded'}. Recurrence risk elevated.`
          });
          riskLevel = "HIGH";
          confidenceScore = 92;
        }

        if (hasSignificantWeightLoss || hasBSymptoms) {
          flags.push({
            label: "High Constitutional / B-Symptom Index",
            severity: "HIGH",
            note: `${hasSignificantWeightLoss ? 'Significant unintentional weight loss' : ''} ${hasBSymptoms ? 'Drenching night sweats' : ''}. Strongly correlates with active advanced disease.`
          });
          riskLevel = "HIGH";
          confidenceScore = 89;
        }

        if (hasSmokingRisk) {
          flags.push({
            label: "Tobacco Carcinogen Burden",
            severity: "HIGH",
            note: `Active tobacco use history: ${responses.smokingStatus}. Correlates with elevated thoracic / upper aerodigestive primary risk.`
          });
          if (riskLevel !== "HIGH") riskLevel = "MEDIUM";
        }

        if (hasFamilyHistory) {
          flags.push({
            label: "Familial Malignancy Clustering",
            severity: "MEDIUM",
            note: `${responses.familyHistory}. Family tumor sites: ${(responses.familyTumors || []).join(', ') || 'Specified'}. Genetic germline consult recommended.`
          });
          if (riskLevel !== "HIGH") riskLevel = "MEDIUM";
        }

        if (hasSeverePain) {
          flags.push({
            label: "Urgent Palliative Analgesia Required",
            severity: "HIGH",
            note: "Patient reports severe/excruciating pain score (7-10/10). Immediate oncologist pain management review needed."
          });
        }

        if (flags.length === 0) {
          flags.push({
            label: "Baseline Oncology Triage",
            severity: "LOW",
            note: "No immediate critical flags detected from intake screening. Standard oncology evaluation recommended."
          });
          riskLevel = "LOW";
          confidenceScore = 93;
        }

        const generatedInsights = {
          generatedAt: fullTime,
          modelVersion: "OncoInsight-v2.1",
          overallRisk: riskLevel,
          confidence: confidenceScore,
          riskFlags: flags,
          symptomSummary: `${p.age}yo ${p.gender.toLowerCase()} presenting with ${responses.chiefComplaint} (${responses.primarySite || 'General'}, duration: ${responses.durationMonths || '1-3 months'}). Functional status: ${responses.ecogPerformance || 'ECOG 1'}.`,
          recommendedInvestigations: [
            { id: `inv-${Date.now()}-1`, name: `Diagnostic Contrast CT / PET-CT (${responses.primarySite || 'Chest/Abdomen'})`, urgency: riskLevel === 'HIGH' ? 'Urgent' : 'Routine' },
            { id: `inv-${Date.now()}-2`, name: "Complete Hemogram & Serum Biomarkers", urgency: 'Routine' },
            { id: `inv-${Date.now()}-3`, name: "Metabolic Organ Function Panel", urgency: 'Routine' }
          ]
        };

        return {
          ...p,
          status: "INSIGHTS_READY",
          mlInsights: generatedInsights
        };
      }));

      addToast(`✨ AI Insights generated & pushed to Oncologist Dashboard for ${patients.find(p => p.id === patientId)?.fullName || 'patient'}!`, 'success');
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
