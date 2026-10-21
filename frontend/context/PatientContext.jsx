import React, { createContext, useContext, useState } from 'react';
import { INITIAL_PATIENTS } from '../utils/mockData';
import { questionnaire } from '../services/api';
import { 
  DEFAULT_QUESTIONNAIRE_ANSWERS,
  scoreQuestionnaireAnswers, 
  predictConditionsLocal, 
  generateRecommendedMedicationsLocal, 
  mapAnswersToResponses 
} from '../utils/cdssScorer';

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

  // Submit questionnaire and trigger CDSS insight generation
  const submitQuestionnaire = async (patientId, submissionData) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const patientObj = patients.find(p => p.id === patientId);

    // Extract standardized 20 questions or adapt legacy payload
    let answersToUse = submissionData?.answers;
    let voiceNotesToUse = submissionData?.voiceNotes || '';
    let allergiesToUse = submissionData?.allergies || [];
    let comorbiditiesToUse = submissionData?.comorbidities || [];
    let chiefComplaintToUse = submissionData?.chiefComplaint || patientObj?.chiefComplaint || 'General Consultation';
    let finalResponses = submissionData?.responses;

    if (!answersToUse) {
      // Legacy fallback
      answersToUse = { ...DEFAULT_QUESTIONNAIRE_ANSWERS };
      finalResponses = submissionData;
    }

    if (!finalResponses) {
      finalResponses = mapAnswersToResponses(
        answersToUse, 
        voiceNotesToUse, 
        allergiesToUse, 
        comorbiditiesToUse, 
        chiefComplaintToUse
      );
    }

    // Step 1: Set questionnaire as completed & status to generating
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        status: "INSIGHTS_GENERATING",
        questionnaire: {
          completed: true,
          completedAt: timeStr,
          answers: answersToUse,
          voiceNotes: voiceNotesToUse,
          responses: finalResponses
        }
      };
    }));

    addToast(`Questionnaire submitted. Running CDSS clinical rules...`, 'info');

    // Step 2: Call backend API if available, or fall back to local deterministic CDSS
    const visitId = patientObj?.visit_id || patientObj?.visitId || (typeof patientId === 'number' ? patientId : parseInt(String(patientId).replace(/\D/g, ''), 10) || 1);

    let recordedAnswers = answersToUse;
    let clinicalScores = null;
    let predictedConditions = [];
    let recommendedMedications = [];

    try {
      const payload = {
        patient_id: patientObj?.patient_id || patientObj?.patientId || visitId,
        answers: answersToUse,
        voice_notes: voiceNotesToUse || null,
        allergies: allergiesToUse,
        comorbidities: comorbiditiesToUse,
        chief_complaint: chiefComplaintToUse
      };
      const apiResult = await questionnaire.submit(visitId, payload);
      if (apiResult && apiResult.clinical_scores) {
        recordedAnswers = apiResult.recorded_answers || answersToUse;
        clinicalScores = apiResult.clinical_scores;
        predictedConditions = apiResult.predicted_conditions || [];
        recommendedMedications = apiResult.recommended_medications || [];
      }
    } catch (apiErr) {
      // Offline / mock fallback using local CDSS engine
      console.warn('Backend API submission skipped, running local CDSS engine:', apiErr.message);
    }

    // If API did not return scores, compute via local CDSS engine
    if (!clinicalScores) {
      clinicalScores = scoreQuestionnaireAnswers(answersToUse, allergiesToUse, comorbiditiesToUse);
      predictedConditions = predictConditionsLocal(answersToUse, clinicalScores, chiefComplaintToUse);
      recommendedMedications = generateRecommendedMedicationsLocal(clinicalScores);
    }

    // Build risk flags and CDSS insights
    const flags = [];
    let riskLevel = "LOW";
    let confidenceScore = 90;

    if (clinicalScores.red_flag_emergency) {
      flags.push({
        label: "CRITICAL RED FLAG EMERGENCY",
        severity: "CRITICAL",
        note: "Immediate physician resuscitation required: acute emergency danger signs reported (q15)."
      });
      riskLevel = "HIGH";
      confidenceScore = 98;
    }

    if (clinicalScores.phq2_positive) {
      flags.push({
        label: "Major Depression Screen Positive (PHQ-2)",
        severity: "HIGH",
        note: `PHQ-2 score ${clinicalScores.phq2_score}/6 >= 3. Positive screen indicates elevated clinical sensitivity for depressive disorder (ICD-10 F32.9). Full PHQ-9 advised.`
      });
      if (riskLevel !== "HIGH") riskLevel = "MEDIUM";
      confidenceScore = Math.max(confidenceScore, 92);
    }

    if (clinicalScores.gad2_positive) {
      flags.push({
        label: "Generalized Anxiety Screen Positive (GAD-2)",
        severity: "HIGH",
        note: `GAD-2 score ${clinicalScores.gad2_score}/6 >= 3. Meets threshold for generalized anxiety screening (ICD-10 F41.1). GAD-7 assessment advised.`
      });
      if (riskLevel !== "HIGH") riskLevel = "MEDIUM";
      confidenceScore = Math.max(confidenceScore, 91);
    }

    if (clinicalScores.peg3_significant_pain) {
      flags.push({
        label: "Significant Pain Interference (PEG-3)",
        severity: "HIGH",
        note: `PEG-3 average score: ${clinicalScores.peg3_average}/10 (>= 4.0). Substantial pain interference with enjoyment and general activity.`
      });
      if (riskLevel !== "HIGH") riskLevel = "MEDIUM";
    }

    if (answersToUse.q12 === 2) {
      flags.push({
        label: "Constitutional Metabolic Red Flag",
        severity: "HIGH",
        note: "Significant unintentional weight loss (> 5 kg) in past 6 months. High metabolic red flag for wasting / occult disease."
      });
      riskLevel = "HIGH";
      confidenceScore = Math.max(confidenceScore, 93);
    }

    if (clinicalScores.reported_allergies && clinicalScores.reported_allergies.length > 0) {
      flags.push({
        label: "Drug Hypersensitivity Alert",
        severity: "HIGH",
        note: `Documented hypersensitivity: ${clinicalScores.reported_allergies.join(', ')}. Contraindicated generic medications masked in prescription engine.`
      });
    }

    if (answersToUse.q18 >= 2) {
      flags.push({
        label: "Cardiovascular & Respiratory Risk (Tobacco)",
        severity: "HIGH",
        note: `Active tobacco use history (q18). Correlates with elevated cardiovascular and chronic airway disease risk.`
      });
      if (riskLevel === "LOW") riskLevel = "MEDIUM";
    }

    if (answersToUse.q20 > 0) {
      flags.push({
        label: "Familial Cardiovascular / Metabolic Clustering",
        severity: "MEDIUM",
        note: "Familial clustering in first-degree relatives reported (q20). Preventive cardiometabolic screening indicated."
      });
      if (riskLevel === "LOW") riskLevel = "MEDIUM";
    }

    if (flags.length === 0) {
      flags.push({
        label: "Routine Clinical Triage",
        severity: "LOW",
        note: "No acute critical red flags detected. Standard outpatient clinical consultation recommended."
      });
      riskLevel = "LOW";
      confidenceScore = 95;
    }

    const generatedInsights = {
      generatedAt: fullTime,
      modelVersion: "Deterministic-CDSS-v2.2",
      overallRisk: riskLevel,
      confidence: confidenceScore,
      riskFlags: flags,
      scores: clinicalScores,
      predictedConditions,
      recommendedMedications,
      symptomSummary: `${patientObj?.age || 35}yo ${(patientObj?.gender || 'patient').toLowerCase()} presenting with ${finalResponses.chiefComplaint} (${finalResponses.primarySite || 'General'}, duration: ${finalResponses.durationMonths || '< 24h'}). Functional status: ${finalResponses.ecogPerformance || 'ECOG 1'}.`,
      recommendedInvestigations: [
        { id: `inv-${Date.now()}-1`, name: "12-Lead Electrocardiogram (ECG) & 2D Echo", urgency: riskLevel === 'HIGH' ? 'Urgent' : 'Routine' },
        { id: `inv-${Date.now()}-2`, name: "Comprehensive Metabolic Panel (HbA1c, LFT, KFT)", urgency: 'Routine' },
        { id: `inv-${Date.now()}-3`, name: "High-Resolution Chest Radiography / USG Abdomen", urgency: 'Routine' }
      ]
    };

    // Step 3: Update patient state
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        status: "INSIGHTS_READY",
        questionnaire: {
          completed: true,
          completedAt: timeStr,
          answers: recordedAnswers,
          scores: clinicalScores,
          predictedConditions,
          recommendedMedications,
          allergies: clinicalScores.reported_allergies,
          comorbidities: clinicalScores.reported_comorbidities,
          voiceNotes: voiceNotesToUse,
          responses: finalResponses
        },
        mlInsights: generatedInsights
      };
    }));

    if (clinicalScores.red_flag_emergency) {
      addToast(`⚠️ CRITICAL RED FLAG: Emergency alert triggered for physician!`, 'error');
    } else {
      addToast(`✨ CDSS Insights generated & pushed to Doctor Dashboard!`, 'success');
    }
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
