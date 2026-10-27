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

import { 
  INITIAL_WARD_BEDS, 
  INITIAL_MAR_RECORDS, 
  INITIAL_NURSING_TASKS, 
  INITIAL_PHARMACY_QUEUE, 
  INITIAL_PHARMACY_INVENTORY 
} from '../utils/nursingAndPharmacyData';

const PatientContext = createContext();

export function PatientProvider({ children }) {
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState("pat-001");
  const [toasts, setToasts] = useState([]);

  // Nursing OS State
  const [wardBeds, setWardBeds] = useState(INITIAL_WARD_BEDS);
  const [marRecords, setMarRecords] = useState(INITIAL_MAR_RECORDS);
  const [nursingTasks, setNursingTasks] = useState(INITIAL_NURSING_TASKS);

  // Pharmacy / Chemist OS State
  const [pharmacyQueue, setPharmacyQueue] = useState(INITIAL_PHARMACY_QUEUE);
  const [pharmacyInventory, setPharmacyInventory] = useState(INITIAL_PHARMACY_INVENTORY);

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

    const isForeign = patientData.patientCategory === 'FOREIGN' || Boolean(patientData.passportNumber);
    const resolvedCity = patientData.city || (isForeign ? (patientData.stayCityInIndia || 'Chennai') : 'Chennai');
    const streetAddr = patientData.address || (isForeign ? (patientData.stayAddressInIndia || patientData.stayPlaceName || '') : '');
    const fullDisplayAddress = streetAddr 
      ? (resolvedCity && !streetAddr.toLowerCase().includes(resolvedCity.toLowerCase()) ? `${streetAddr}, ${resolvedCity}` : streetAddr)
      : resolvedCity;

    const newPatient = {
      id: `pat-${Date.now()}`,
      uhid: `UHID-2026-0${nextNum}`,
      opdId: `OPD-26-${Math.floor(1000 + Math.random() * 9000)}`,
      mrn: `UHID-2026-0${nextNum}`,
      tokenNumber: nextNum,
      fullName: patientData.fullName,
      photoUrl: patientData.photoUrl || '',
      patientCategory: isForeign ? 'FOREIGN' : 'DOMESTIC',
      aadhaarNumber: patientData.aadhaarNumber || (isForeign ? '' : '4521 8840 9123'),
      city: resolvedCity,
      state: patientData.state || (isForeign ? (patientData.stayStateInIndia || 'Tamil Nadu') : 'Tamil Nadu'),
      pincode: patientData.pincode || (isForeign ? (patientData.stayPincodeInIndia || '600006') : '600045'),
      nationality: patientData.nationality || (isForeign ? 'Foreign National' : 'Indian'),
      age: parseInt(patientData.age, 10) || 0,
      gender: patientData.gender,
      dob: patientData.dob,
      phone: patientData.phone,
      address: fullDisplayAddress,
      referredBy: patientData.referredBy || '',
      referrerContact: patientData.referrerContact || '',
      emergencyContact: {
        name: patientData.emergencyContactName || 'N/A',
        phone: patientData.emergencyContactPhone || 'N/A'
      },
      frroDetails: isForeign ? {
        isForeignNational: true,
        nationality: patientData.nationality || 'Foreign National',
        passportNumber: patientData.passportNumber || 'N/A',
        passportCountry: patientData.passportCountry || patientData.nationality || 'Overseas',
        passportExpiry: patientData.passportExpiry || '2030-12-31',
        visaNumber: patientData.visaNumber || 'V-MED-2026',
        visaType: patientData.visaType || 'MED',
        visaExpiry: patientData.visaExpiry || '2027-01-31',
        visaPlaceOfIssue: patientData.visaPlaceOfIssue || 'Indian Mission / e-Visa Portal',
        arrivalDate: patientData.arrivalDate || new Date().toISOString().split('T')[0],
        portOfEntry: patientData.portOfEntry || 'Delhi (IGI Airport)',
        comingFromCountry: patientData.comingFromCountry || patientData.nationality || 'Overseas',
        expectedDepartureDate: patientData.expectedDepartureDate || '',
        stayAccommodationType: patientData.stayAccommodationType || 'Hospital Inpatient Suite',
        stayPlaceName: patientData.stayPlaceName || 'Bright Solutions Hospital Suite',
        stayAddressInIndia: patientData.stayAddressInIndia || 'Hospital Medical Campus, Greams Road',
        stayCityInIndia: resolvedCity,
        stayStateInIndia: patientData.stayStateInIndia || 'Tamil Nadu',
        stayPincodeInIndia: patientData.stayPincodeInIndia || '600006',
        localContactPhone: patientData.localContactPhone || patientData.phone || '',
        permanentAddressAbroad: patientData.permanentAddressAbroad || 'Home Country Address',
        homeCountryCity: patientData.homeCountryCity || 'London',
        homeCountry: patientData.homeCountry || patientData.nationality || 'United Kingdom',
        overseasEmergencyContact: patientData.overseasEmergencyContact || 'Emergency Contact Abroad',
        formCNumber: patientData.formCNumber || `FRRO-C-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        formCStatus: patientData.formCStatus || 'COMPLIANT_SUBMITTED'
      } : null,
      appointmentTime: timeStr,
      checkInTime: timeStr,
      consultationStartTime: null,
      checkOutTime: null,
      waitTimeMinutes: 0,
      consultationDurationMinutes: 0,
      doctorAssigned: patientData.doctorAssigned || "Dr. Kiran Patel (General & Internal Medicine)",
      status: "WAITING",
      registeredAt: timeStr,
      abhaId: patientData.abhaId || "",
      abhaAddress: patientData.abhaAddress || "",
      insurance: {
        type: patientData.insuranceType || "INSURANCE",
        provider: patientData.insuranceType === 'GOVT_SCHEME' 
          ? (patientData.govtSchemeName || "Ayushman Bharat — PM-JAY (AB-PMJAY)")
          : (patientData.insuranceProvider || (isForeign ? "BUPA International Medical Travel Insurance" : "Self-Pay / Cash")),
        policyNumber: patientData.policyNumber || patientData.beneficiaryId || (isForeign ? "INT-GOP-992140" : "N/A"),
        groupNumber: patientData.groupNumber || "N/A",
        coveragePct: patientData.insuranceType === 'GOVT_SCHEME' 
          ? 100 
          : (Number(patientData.coveragePct) || (patientData.insuranceType === 'CASH' ? 0 : 80)),
        deductible: patientData.insuranceType === 'GOVT_SCHEME' ? 0 : (Number(patientData.deductible) || 0),
        preAuthNumber: patientData.preAuthNumber || (patientData.insuranceType === 'GOVT_SCHEME' ? 'PMJAY-AUTO-PREAUTH' : (isForeign ? 'FRRO-GOP-APPROVED' : '')),
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
    const catLabel = isForeign ? '🌍 Foreign National (FRRO Form-C Compliant)' : '🇮🇳 Domestic Resident';
    addToast(`Patient ${newPatient.fullName} registered with Master UHID ${newPatient.uhid} (OPD Token #${newPatient.tokenNumber}) as ${catLabel}.`, 'success');
    return newPatient;
  };

  // Issue a Follow-Up Consultation Token for an existing registered patient
  const issueFollowUpToken = (existingPatientId, followUpData = {}) => {
    const existing = patients.find(p => p.id === existingPatientId || p.uhid === existingPatientId);
    if (!existing) {
      addToast('Patient record not found for follow-up.', 'error');
      return null;
    }

    const nextTokenNum = 140 + patients.length + 1;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Generate a new encounter for this existing patient while preserving Master UHID and demographics
    const followUpEncounter = {
      ...existing,
      id: `pat-${Date.now()}`,
      opdId: `OPD-26-${Math.floor(1000 + Math.random() * 9000)}`,
      tokenNumber: nextTokenNum,
      isFollowUp: true,
      visitType: 'FOLLOW_UP',
      previousVisitDate: existing.registeredAt || 'Previous OPD Visit',
      followUpReason: followUpData.followUpReason || 'Routine Post-Consultation Follow-Up',
      doctorAssigned: followUpData.doctorAssigned || existing.doctorAssigned || "Dr. Kiran Patel (General & Internal Medicine)",
      status: "WAITING",
      appointmentTime: timeStr,
      checkInTime: timeStr,
      consultationStartTime: null,
      checkOutTime: null,
      waitTimeMinutes: 0,
      consultationDurationMinutes: 0,
      registeredAt: timeStr,
      billingType: followUpData.billingType || (existing.insurance?.type === 'GOVT_SCHEME' ? 'PM-JAY Cashless' : 'Follow-Up (₹200)'),
      notes: followUpData.notes || 'Follow-up encounter'
    };

    setPatients(prev => [followUpEncounter, ...prev]);
    setSelectedPatientId(followUpEncounter.id);
    addToast(`🔁 Follow-Up Token #${nextTokenNum} issued for ${existing.fullName} (Master UHID: ${existing.uhid})`, 'success');
    return followUpEncounter;
  };

  // Update existing patient data
  const updatePatient = (id, updates) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // Receptionist manual timing & status editor
  const updatePatientTiming = (patientId, timingUpdates) => {
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        ...timingUpdates
      };
    }));
    addToast(`Updated clinic check-in / consultation timings for patient.`, 'success');
  };

  // Re-assign doctor on the ongoing queue
  const updatePatientDoctor = (patientId, newDoctor) => {
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        doctorAssigned: newDoctor
      };
    }));
    const doctorShort = newDoctor.split('(')[0];
    addToast(`Transferred patient queue to ${doctorShort}`, 'info');
  };

  // 1-Click status progressor (Waiting -> In Consultation -> Completed)
  const updatePatientStatus = (patientId, newStatus) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      const updates = { status: newStatus };
      if (newStatus === 'IN_CONSULTATION') {
        if (!p.consultationStartTime) updates.consultationStartTime = timeStr;
      } else if (newStatus === 'COMPLETED') {
        if (!p.checkOutTime) updates.checkOutTime = timeStr;
      }
      return { ...p, ...updates };
    }));
    addToast(`Patient status transitioned to ${newStatus}.`, 'info');
  };

  // Doctor calls next waiting patient into consultation chamber (OPD-F2, AC-OPD-01)
  const callNextPatient = (doctorName) => {
    const nextPatient = patients.find(p => 
      p.status === 'WAITING' || 
      p.status === 'REGISTERED' || 
      p.status === 'INSIGHTS_READY' || 
      p.status === 'IN_TRIAGE'
    );

    if (!nextPatient) {
      addToast('No waiting patients in queue for OPD consultation.', 'info');
      return null;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setPatients(prev => prev.map(p => {
      if (p.id === nextPatient.id) {
        return {
          ...p,
          status: 'IN_CONSULTATION',
          consultationStartTime: p.consultationStartTime || timeStr
        };
      }
      return p;
    }));

    setSelectedPatientId(nextPatient.id);
    addToast(`📢 Called Token #${nextPatient.tokenNumber} (${nextPatient.fullName}) into Cabin 01 for OPD Consultation!`, 'success');
    return nextPatient;
  };

  // Sign & Lock Consultation Note (CON-F7, BR-CON-01, BR-CON-02, BR-CON-03, AC-CON-01)
  const signAndLockConsultation = (patientId, consultationData) => {
    const hasIcd10 = consultationData?.icd10Diagnoses && consultationData.icd10Diagnoses.length > 0;
    if (!hasIcd10) {
      addToast('Primary diagnosis (ICD-10 code) is mandatory before signing — NABH Statutory Requirement', 'error');
      return false;
    }

    const targetPatient = patients.find(p => p.id === patientId);
    if (!targetPatient) return false;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Lock patient consultation
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        status: 'COMPLETED',
        checkOutTime: timeStr,
        isLocked: true,
        signedAt: timeStr,
        signedBy: consultationData.signedBy || 'Dr. Kiran Patel (Reg: MC-84920-CA)',
        consultationData: consultationData,
        prescriptions: consultationData.prescriptions || p.prescriptions || [],
        labOrders: consultationData.labOrders || [],
        followUp: consultationData.followUp || null,
        internalReferral: consultationData.internalReferral || null,
        nlpSummary: consultationData.nlpSummary || ''
      };
    }));

    // 2. Dispatch prescription to pharmacy queue (BR-CON-03)
    if (consultationData.prescriptions && consultationData.prescriptions.length > 0) {
      const newPharmacyRx = {
        id: `rx-${Date.now()}`,
        tokenNumber: `T-${targetPatient.tokenNumber}`,
        patientId: targetPatient.id,
        patientName: targetPatient.fullName,
        mrn: targetPatient.uhid || targetPatient.mrn,
        age: targetPatient.age,
        gender: targetPatient.gender,
        prescribedBy: consultationData.signedBy || "Dr. Kiran Patel (Internal Medicine)",
        prescribedAt: timeStr,
        wardBed: "OPD Consultation • Cabin 01",
        schemeType: targetPatient.insurance?.provider || "Self-Pay / Cash",
        schemeBadge: targetPatient.insurance?.type === 'GOVT_SCHEME' ? '100% Cashless Govt' : (targetPatient.insurance?.coveragePct ? `${targetPatient.insurance.coveragePct}% Covered` : 'Cash Direct'),
        status: "PENDING_VERIFICATION",
        cdssAlerts: consultationData.ddiAlerts || [],
        items: consultationData.prescriptions.map((rx, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          drug: rx.drug,
          brand: (rx.drug || '').split('(')[0].trim(),
          form: rx.form || "Tablet",
          qty: parseInt(rx.qty, 10) || 10,
          unitPrice: 5.50,
          stockAvailable: 250,
          batch: `BAT-2026-${Math.floor(100 + Math.random() * 900)}`,
          expiry: "12/2027",
          status: "In Stock",
          dosage: rx.dose,
          frequency: rx.freq,
          duration: rx.days,
          route: rx.route || "Oral (PO)",
          instructions: rx.notes || rx.mealTiming
        })),
        subtotal: consultationData.prescriptions.length * 60,
        insuranceCovered: (targetPatient.insurance?.coveragePct ? (consultationData.prescriptions.length * 60 * targetPatient.insurance.coveragePct / 100) : 0),
        patientPayable: (targetPatient.insurance?.coveragePct ? (consultationData.prescriptions.length * 60 * (100 - targetPatient.insurance.coveragePct) / 100) : consultationData.prescriptions.length * 60)
      };

      setPharmacyQueue(prev => [newPharmacyRx, ...prev]);
    }

    addToast(`✅ Consultation digitally signed & locked for ${targetPatient.fullName}. Prescriptions sent to Pharmacy!`, 'success');
    return true;
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

  // Nursing Handlers: Administer Medication via MAR
  const administerMedication = (marId, details = {}) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMarRecords(prev => prev.map(rec => {
      if (rec.id !== marId) return rec;
      return {
        ...rec,
        status: 'GIVEN',
        windowStatus: 'GIVEN',
        administeredAt: nowTime,
        administeredBy: details.administeredBy || 'Sr. Mini Joseph, RN',
        notes: details.notes || 'Bedside 5-Rights Barcode Verified'
      };
    }));
    addToast(`✅ MAR: Dose verified & recorded at ${nowTime}`, 'success');
  };

  // Nursing Handlers: Record Bed Vitals & NEWS2
  const recordBedVitals = (bedId, newVitals, calculatedNews2 = 2) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let riskTier = 'LOW';
    if (calculatedNews2 >= 7) riskTier = 'HIGH';
    else if (calculatedNews2 >= 5) riskTier = 'MEDIUM';

    setWardBeds(prev => prev.map(bed => {
      if (bed.id !== bedId) return bed;
      return {
        ...bed,
        news2Score: calculatedNews2,
        news2Risk: riskTier,
        status: calculatedNews2 >= 7 ? 'CRITICAL_WATCH' : bed.status,
        vitals: {
          ...bed.vitals,
          ...newVitals,
          lastRecorded: timeStr
        }
      };
    }));

    if (calculatedNews2 >= 7) {
      addToast(`🚨 CRITICAL NEWS2 ALERT (${calculatedNews2}): Rapid Response / MET Escalation advised!`, 'error');
    } else {
      addToast(`Telemetry logged for ${bedId}. NEWS2 Score: ${calculatedNews2} (${riskTier} Risk)`, 'info');
    }
  };

  // Nursing Handlers: Toggle Task
  const toggleNursingTask = (taskId) => {
    setNursingTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const willBe = !t.completed;
      if (willBe) addToast(`Completed task: "${t.title}"`, 'success');
      return { ...t, completed: willBe };
    }));
  };

  // Pharmacy Handlers: Verify Rx
  const verifyPharmacyRx = (rxId) => {
    setPharmacyQueue(prev => prev.map(rx => {
      if (rx.id !== rxId) return rx;
      return { ...rx, status: 'READY_FOR_DISPENSE' };
    }));
    addToast(`Clinical pharmacist verified e-Rx ${rxId}. Ready for dispensing!`, 'success');
  };

  // Pharmacy Handlers: Dispense Rx
  const dispensePharmacyRx = (rxId, dispenseMeta = {}) => {
    setPharmacyQueue(prev => prev.map(rx => {
      if (rx.id !== rxId) return rx;
      // Decrement inventory stock
      if (rx.items && Array.isArray(rx.items)) {
        setPharmacyInventory(invPrev => invPrev.map(invItem => {
          const matchedItem = rx.items.find(i => i.drug.toLowerCase().includes(invItem.genericName.toLowerCase()));
          if (matchedItem) {
            const newStock = Math.max(0, invItem.stock - (matchedItem.qty || 1));
            return {
              ...invItem,
              stock: newStock,
              status: newStock <= 0 ? 'OUT_OF_STOCK' : newStock <= invItem.minThreshold ? 'LOW_STOCK' : 'IN_STOCK'
            };
          }
          return invItem;
        }));
      }
      return { 
        ...rx, 
        status: 'DISPENSED', 
        dispensedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dispensedBy: dispenseMeta.dispensedBy || 'Karthik Ramamurthy, RPh',
        labelPrinted: true
      };
    }));
    addToast(`Dispensed Rx ${rxId}. Medication label generated & stock inventory decremented.`, 'success');
  };

  // Pharmacy Handlers: Reorder Stock
  const reorderInventoryItem = (itemId, addQty = 100) => {
    setPharmacyInventory(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const updatedStock = item.stock + addQty;
      return {
        ...item,
        stock: updatedStock,
        status: updatedStock > item.minThreshold ? 'IN_STOCK' : 'LOW_STOCK'
      };
    }));
    addToast(`Reorder PO generated: +${addQty} units restocked for ${itemId}`, 'success');
  };

  // Quick stats
  const stats = {
    total: patients.length,
    waiting: patients.filter(p => p.status === 'WAITING' || p.status === 'REGISTERED' || p.status === 'QUESTIONNAIRE_PENDING' || p.status === 'INSIGHTS_READY').length,
    registered: patients.filter(p => p.status === 'REGISTERED').length,
    pendingQuestionnaire: patients.filter(p => p.status === 'QUESTIONNAIRE_PENDING').length,
    insightsReady: patients.filter(p => p.status === 'INSIGHTS_READY').length,
    inConsultation: patients.filter(p => p.status === 'IN_CONSULTATION').length,
    completed: patients.filter(p => p.status === 'COMPLETED').length,
    // Nursing stats
    activeBeds: wardBeds.length,
    medsDueNow: marRecords.filter(m => m.status === 'DUE_NOW' || m.status === 'OVERDUE').length,
    criticalNews2: wardBeds.filter(b => b.news2Score >= 7).length,
    pendingTasks: nursingTasks.filter(t => !t.completed).length,
    // Pharmacy stats
    pendingRx: pharmacyQueue.filter(q => q.status === 'PENDING_VERIFICATION').length,
    readyToDispense: pharmacyQueue.filter(q => q.status === 'READY_FOR_DISPENSE').length,
    dispensedToday: pharmacyQueue.filter(q => q.status === 'DISPENSED').length + 38,
    lowStockCount: pharmacyInventory.filter(i => i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK').length
  };

  return (
    <PatientContext.Provider value={{
      patients,
      selectedPatient,
      selectedPatientId,
      setSelectedPatientId,
      registerPatient,
      issueFollowUpToken,
      updatePatient,
      updatePatientTiming,
      updatePatientDoctor,
      updatePatientStatus,
      callNextPatient,
      signAndLockConsultation,
      submitQuestionnaire,
      stats,
      toasts,
      addToast,
      removeToast,
      // Nursing
      wardBeds,
      marRecords,
      nursingTasks,
      administerMedication,
      recordBedVitals,
      toggleNursingTask,
      // Pharmacy
      pharmacyQueue,
      pharmacyInventory,
      verifyPharmacyRx,
      dispensePharmacyRx,
      reorderInventoryItem
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
