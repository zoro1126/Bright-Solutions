import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INITIAL_PATIENTS } from '../utils/mockData';
import { queue as queueApi, patients as patientsApi, questionnaire as questionnaireApi, dossier as dossierApi } from '../services/api';

const PatientContext = createContext();

export function PatientProvider({ children }) {
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);

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

  // Refresh queue from real backend MySQL database
  const refreshQueue = useCallback(async () => {
    try {
      setIsLoadingQueue(true);
      const res = await queueApi.list();
      if (res && Array.isArray(res.queue) && res.queue.length > 0) {
        setPatients(prev => {
          // Merge real backend patients, preserving any local active consultation notes if present
          const backendPatients = res.queue.map(bp => {
            const existing = prev.find(p => p.id === bp.id || p.mrn === bp.mrn);
            return existing ? { ...existing, ...bp } : bp;
          });
          return backendPatients;
        });

        // Ensure selected patient remains valid
        setSelectedPatientId(prevId => {
          const exists = res.queue.some(p => p.id === prevId);
          return exists ? prevId : res.queue[0].id;
        });
      }
    } catch (err) {
      console.warn('Queue API sync fallback to local cache:', err.message);
    } finally {
      setIsLoadingQueue(false);
    }
  }, []);

  // Sync on mount
  useEffect(() => {
    refreshQueue();
  }, [refreshQueue]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0] || null;

  // Fetch full clinical dossier (CDSS, NegEx NLP, vitals, questionnaire) from backend
  const fetchPatientDossier = useCallback(async (patientId) => {
    try {
      const targetId = typeof patientId === 'number' 
        ? patientId 
        : (patientId?.startsWith?.('pat-') ? parseInt(patientId.replace('pat-', ''), 10) : patientId);
      
      if (!targetId || isNaN(targetId)) return null;

      const dos = await dossierApi.get(targetId);
      if (dos && dos.insights) {
        setPatients(prev => prev.map(p => {
          if (p.id === patientId || p.patient_id === targetId) {
            return {
              ...p,
              mlInsights: {
                modelVersion: "Deterministic CDSS + NegEx NLP",
                overallRisk: dos.insights.riskFlags?.some(f => f.severity === 'HIGH') 
                  ? 'HIGH' 
                  : (dos.insights.riskFlags?.length > 0 ? 'MEDIUM' : 'LOW'),
                riskFlags: dos.insights.riskFlags || [],
                symptomSummary: dos.insights.symptomSummary || p.chief_complaint,
                hpiNarrative: dos.insights.hpiNarrative,
                affirmedSymptoms: dos.insights.affirmedSymptoms || [],
                pertinentNegatives: dos.insights.pertinentNegatives || [],
                clinicalScores: dos.questionnaire?.clinical_scores || null,
                recommendedInvestigations: [
                  { id: `inv-${targetId}-1`, name: "12-Lead Electrocardiogram (ECG)", urgency: "Routine" },
                  { id: `inv-${targetId}-2`, name: "Comprehensive Metabolic Panel (HbA1c, LFT, KFT)", urgency: "Routine" }
                ]
              }
            };
          }
          return p;
        }));
      }
      return dos;
    } catch (err) {
      console.warn('Could not load backend clinical dossier:', err.message);
      return null;
    }
  }, []);

  // Register a new patient via POST /api/patients
  const registerPatient = async (patientData) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let systolic_bp = null;
    let diastolic_bp = null;
    if (patientData.vitals?.bp) {
      const parts = String(patientData.vitals.bp).split('/');
      systolic_bp = parseInt(parts[0], 10) || null;
      diastolic_bp = parseInt(parts[1], 10) || null;
    } else if (patientData.bp) {
      const parts = String(patientData.bp).split('/');
      systolic_bp = parseInt(parts[0], 10) || null;
      diastolic_bp = parseInt(parts[1], 10) || null;
    }

    const regPayload = {
      full_name: patientData.fullName,
      age: parseInt(patientData.age, 10) || null,
      gender: (patientData.gender || 'OTHER').toUpperCase(),
      dob: patientData.dob || null,
      phone: patientData.phone || '9876543210',
      address: patientData.address || null,
      emergency_contact_name: patientData.emergencyContactName || null,
      emergency_contact_phone: patientData.emergencyContactPhone || null,
      doctor_assigned: patientData.doctorAssigned || null,
      chief_complaint: patientData.chiefComplaint || 'General outpatient consultation',
      insurance_type: patientData.insuranceType || 'CASH',
      insurance_provider: patientData.insuranceProvider || null,
      policy_number: patientData.policyNumber || patientData.beneficiaryId || null,
      govt_scheme_name: patientData.govtSchemeName || null,
      abha_id: patientData.abhaId || null,
      abha_address: patientData.abhaAddress || null,
      coverage_pct: patientData.coveragePct ? parseFloat(patientData.coveragePct) : null,
      deductible: patientData.deductible ? parseFloat(patientData.deductible) : null,
      vitals: {
        systolic_bp,
        diastolic_bp,
        pulse_rate: parseInt(patientData.vitals?.pulse || patientData.pulse, 10) || null,
        temperature_f: parseFloat(patientData.vitals?.temp || patientData.temp) || null,
        resp_rate: parseInt(patientData.vitals?.respRate || patientData.vitals?.resp || patientData.respRate, 10) || null,
        spo2_pct: parseInt(patientData.vitals?.spo2 || patientData.spo2, 10) || null,
        weight_kg: parseFloat(patientData.vitals?.weight || patientData.weight) || null,
        height_cm: parseFloat(patientData.vitals?.height || patientData.height) || null
      }
    };

    try {
      const res = await patientsApi.register(regPayload);
      
      const newPatientId = `pat-${res.patient?.id || res.visit?.id || Date.now()}`;
      const createdPatient = {
        id: newPatientId,
        patient_id: res.patient?.id,
        visit_id: res.visit?.id,
        mrn: res.patient?.uhid || `UHID-2026-000${res.patient?.id || '01'}`,
        uhid: res.patient?.uhid,
        fullName: res.patient?.full_name || patientData.fullName,
        full_name: res.patient?.full_name || patientData.fullName,
        age: parseInt(patientData.age, 10) || 0,
        gender: patientData.gender,
        dob: patientData.dob,
        phone: patientData.phone,
        address: patientData.address,
        doctorAssigned: res.visit?.doctor_name || patientData.doctorAssigned || "DevDoc (Consultant Physician)",
        status: "QUESTIONNAIRE_PENDING",
        appointmentTime: timeStr,
        registeredAt: timeStr,
        queue_token: res.visit?.queue_token || res.token_number || "Q-101",
        chief_complaint: patientData.chiefComplaint || "General outpatient consultation",
        insurance: {
          type: patientData.insuranceType || "CASH",
          provider: patientData.insuranceProvider || (patientData.insuranceType === 'GOVT_SCHEME' ? (patientData.govtSchemeName || 'Ayushman Bharat PM-JAY') : "Self-Pay / Cash"),
          policyNumber: patientData.policyNumber || patientData.beneficiaryId || "N/A",
          coveragePct: patientData.insuranceType === 'GOVT_SCHEME' ? 100 : (patientData.coveragePct ? parseFloat(patientData.coveragePct) : 0),
          deductible: patientData.deductible ? parseFloat(patientData.deductible) : 0
        },
        vitals: {
          bp: (systolic_bp && diastolic_bp) ? `${systolic_bp}/${diastolic_bp}` : (patientData.bp || '120/80'),
          pulse: parseInt(patientData.vitals?.pulse || patientData.pulse, 10) || 72,
          temp: parseFloat(patientData.vitals?.temp || patientData.temp) || 98.6,
          spo2: parseInt(patientData.vitals?.spo2 || patientData.spo2, 10) || 99,
          resp: parseInt(patientData.vitals?.respRate || patientData.respRate, 10) || 16,
          weight: parseFloat(patientData.vitals?.weight || patientData.weight) || 60,
          height: parseFloat(patientData.vitals?.height || patientData.height) || 165,
          bmi: patientData.bmi || '22.0'
        }
      };

      setPatients(prev => [createdPatient, ...prev.filter(p => p.id !== createdPatient.id)]);
      setSelectedPatientId(newPatientId);
      await refreshQueue();
      
      addToast(`Patient ${createdPatient.fullName} registered (${createdPatient.queue_token}). Ready for intake questionnaire.`, 'success');
      return createdPatient;
    } catch (apiErr) {
      console.warn('Backend registration failed, using local session:', apiErr);
      // Local fallback
      const nextNum = 140 + patients.length + 1;
      const newPatient = {
        id: `pat-${Date.now()}`,
        mrn: `MRN-2026-0${nextNum}`,
        fullName: patientData.fullName,
        full_name: patientData.fullName,
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
        doctorAssigned: patientData.doctorAssigned || "DevDoc (Consultant Physician)",
        status: "QUESTIONNAIRE_PENDING",
        registeredAt: timeStr,
        queue_token: `Q-${nextNum}`,
        chief_complaint: patientData.chiefComplaint || 'General outpatient consultation',
        insurance: {
          type: patientData.insuranceType || "CASH",
          provider: patientData.insuranceProvider || "Self-Pay / Cash",
          policyNumber: patientData.policyNumber || "N/A"
        },
        vitals: patientData.vitals || { bp: patientData.bp || '120/80' }
      };
      setPatients(prev => [newPatient, ...prev]);
      setSelectedPatientId(newPatient.id);
      addToast(`Patient ${newPatient.fullName} registered locally (${newPatient.mrn}). Ready for intake questionnaire.`, 'success');
      return newPatient;
    }
  };

  // Update existing patient data
  const updatePatient = (id, updates) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // Submit questionnaire to backend POST /api/visits/{id}/questionnaire
  const submitQuestionnaire = async (patientId, payload, visitId) => {
    const targetPatient = patients.find(p => p.id === patientId);
    const resolvedVisitId = visitId || targetPatient?.visit_id || (
      typeof patientId === 'number' 
        ? patientId 
        : (patientId?.startsWith?.('pat-') ? parseInt(patientId.replace('pat-', ''), 10) : 1)
    );

    // Optimistically mark questionnaire completed
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        status: "INSIGHTS_READY",
        questionnaire: {
          completed: true,
          completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          responses: payload.answers || payload
        }
      };
    }));

    try {
      const result = await questionnaireApi.submit(resolvedVisitId, payload);
      
      // Update patient with verified deterministic scores and WHO EML recommendations
      setPatients(prev => prev.map(p => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          status: "INSIGHTS_READY",
          mlInsights: {
            modelVersion: "Deterministic CDSS + NegEx NLP",
            overallRisk: result.clinical_scores?.red_flag_emergency 
              ? "HIGH" 
              : (result.clinical_scores?.phq2_positive || result.clinical_scores?.peg3_significant_pain ? "MEDIUM" : "LOW"),
            clinicalScores: result.clinical_scores,
            predictedConditions: result.predicted_conditions || [],
            recommendedMedications: result.recommended_medications || [],
            riskFlags: (result.predicted_conditions || []).map((c, i) => ({
              id: i + 1,
              label: c.disease_name,
              severity: "MEDIUM",
              note: c.rationale
            })),
            symptomSummary: payload.voice_notes || payload.chief_complaint || 'Intake questionnaire evaluated'
          }
        };
      }));

      await refreshQueue();
      addToast(`Deterministic CDSS & NegEx NLP insights generated for ${targetPatient?.fullName || 'patient'}!`, 'success');
      return result;
    } catch (err) {
      console.warn('Backend questionnaire submission error, using local fallback:', err.message);
      addToast(`Questionnaire recorded locally for ${targetPatient?.fullName || 'patient'}.`, 'info');
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
      fetchPatientDossier,
      refreshQueue,
      isLoadingQueue,
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

