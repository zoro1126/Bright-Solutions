import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '../context/PatientContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import DoctorDashboard from '../components/DoctorDashboard';
import DoctorFlowGuideModal from '../components/DoctorFlowGuideModal';
import DoctorPatientDossierView from '../components/DoctorPatientDossierView';
import DoctorDiagnosticScansView from '../components/DoctorDiagnosticScansView';
import PrintablePrescriptionModal from '../components/PrintablePrescriptionModal';
import SpeechMicButton from '../components/SpeechMicButton';
import { 
  ICD10_CATALOG, 
  checkDrugInteractions, 
  getDrugScheduleBadge, 
  PATHOLOGY_LAB_CATALOG, 
  HOSPITAL_DEPARTMENTS 
} from '../utils/icd10Data';
import { 
  Stethoscope, 
  Sparkles, 
  FileText, 
  Pill, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Activity, 
  FileCheck,
  X,
  Search,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  Plus,
  Trash2,
  Printer,
  Calendar,
  Clock,
  User,
  FlaskConical,
  ArrowRight,
  ChevronRight,
  Sliders,
  Check,
  Info,
  ExternalLink,
  Lock,
  Phone,
  Heart,
  Thermometer,
  Zap,
  Share2
} from 'lucide-react';

export default function DoctorPage({ 
  currentRole = 'doctor', 
  onSwitchRole, 
  onSwitchToReception, 
  activeSubTab = 'workspace', 
  onLogout 
}) {
  const { 
    patients, 
    selectedPatientId, 
    setSelectedPatientId, 
    updatePatient, 
    callNextPatient,
    signAndLockConsultation,
    addToast 
  } = usePatients();

  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [doctorNav, setDoctorNav] = useState(activeSubTab || 'workspace');
  const [activeTab, setActiveTab] = useState('soap'); // 'soap' | 'rx' | 'lab' | 'referral' | 'insights'

  // Modals
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isSignLockConfirmOpen, setIsSignLockConfirmOpen] = useState(false);

  // Queue left drawer filtering
  const [queueFilter, setQueueFilter] = useState('ALL'); // 'ALL' | 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED'
  const [queueSearch, setQueueSearch] = useState('');

  // Selected patient
  const patient = patients.find(p => p.id === selectedPatientId) || patients[0];
  const insights = patient?.mlInsights;

  // Consultation State
  const [soapNote, setSoapNote] = useState({
    subjective: '',
    duration: '2-3 weeks',
    objective: '',
    assessmentNarrative: '',
    plan: ''
  });

  // ICD-10 Diagnoses: At least 1 is required for NABH sign-off (BR-CON-01, AC-CON-01)
  const [icd10Diagnoses, setIcd10Diagnoses] = useState([
    { code: 'I10', title: 'Essential (primary) hypertension', isPrimary: true, category: 'Cardiovascular' }
  ]);
  const [icdSearchQuery, setIcdSearchQuery] = useState('');

  // Prescriptions State
  const [prescriptions, setPrescriptions] = useState([
    {
      id: 1,
      drug: 'Telmisartan (40mg)',
      dose: '40mg',
      route: 'Oral (PO)',
      qty: '30 Tabs',
      freq: '1-0-0',
      days: '30d',
      mealTiming: 'Before Meals',
      notes: 'Take 30 mins before breakfast'
    },
    {
      id: 2,
      drug: 'Atorvastatin (10mg)',
      dose: '10mg',
      route: 'Oral (PO)',
      qty: '30 Tabs',
      freq: '0-0-1',
      days: '30d',
      mealTiming: 'After Meals',
      notes: 'Take at bedtime'
    },
    {
      id: 3,
      drug: 'Paracetamol (650mg)',
      dose: '650mg',
      route: 'Oral (PO)',
      qty: '10 Tabs',
      freq: 'SOS',
      days: '5d',
      mealTiming: 'After Meals',
      notes: 'Take SOS for acute headache or fever'
    }
  ]);
  const [customDrugSearch, setCustomDrugSearch] = useState('');

  // Pathology & Lab Orders State (PATH-F1, PATH-F2)
  const [labOrders, setLabOrders] = useState([
    { id: 'lab-lipid', name: 'Lipid Profile (Total Cholesterol, Triglycerides, HDL, LDL)', urgency: 'Routine', notes: 'Fasting 12h sample required' },
    { id: 'lab-ecg', name: '12-Lead Resting Electrocardiogram (ECG)', urgency: 'Routine', notes: 'Evaluate baseline cardiac rhythm' }
  ]);

  // Follow-up & Referral State (CON-F9, CON-F10)
  const [followUpDays, setFollowUpDays] = useState('7d');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('Review in 7-10 days with fasting lipid panel and ECG tracings.');

  const [internalReferral, setInternalReferral] = useState({
    department: '',
    urgency: 'Routine',
    reason: ''
  });

  // NLP Generated Consultation Summary (CON-F8, NLP-F1, AC-CON-02)
  const [nlpSummary, setNlpSummary] = useState('');

  // CDSS Critical Override
  const [overrideNote, setOverrideNote] = useState('');

  // 1-Click Medication Presets
  const PRESCRIPTION_PRESETS = [
    { drug: 'Telmisartan (40mg)', dose: '40mg', route: 'Oral (PO)', qty: '30 Tabs', freq: '1-0-0', days: '30d', mealTiming: 'Before Meals', notes: 'Take 30 mins before breakfast' },
    { drug: 'Metformin (500mg SR)', dose: '500mg', route: 'Oral (PO)', qty: '60 Tabs', freq: '1-0-1', days: '30d', mealTiming: 'After Meals', notes: 'Take with breakfast and dinner' },
    { drug: 'Paracetamol (650mg)', dose: '650mg', route: 'Oral (PO)', qty: '10 Tabs', freq: 'SOS', days: '5d', mealTiming: 'After Meals', notes: 'Take SOS for headache or fever' },
    { drug: 'Pantoprazole (40mg)', dose: '40mg', route: 'Oral (PO)', qty: '15 Tabs', freq: '1-0-0', days: '15d', mealTiming: 'Before Meals', notes: 'Take 30 mins before food' },
    { drug: 'Amoxicillin-Clav (625mg)', dose: '625mg', route: 'Oral (PO)', qty: '10 Tabs', freq: '1-0-1', days: '5d', mealTiming: 'After Meals', notes: 'Complete full 5-day course with water' },
    { drug: 'Montair-LC (10/5mg)', dose: '10mg/5mg', route: 'Oral (PO)', qty: '10 Tabs', freq: '0-0-1', days: '10d', mealTiming: 'After Meals', notes: 'Take at bedtime for nocturnal airway ease' },
    { drug: 'Atorvastatin (20mg)', dose: '20mg', route: 'Oral (PO)', qty: '30 Tabs', freq: '0-0-1', days: '30d', mealTiming: 'After Meals', notes: 'Bedtime lipid management' },
    { drug: 'Ondansetron (4mg)', dose: '4mg', route: 'Oral (PO)', qty: '6 Tabs', freq: 'SOS', days: '3d', mealTiming: 'Before Meals', notes: 'Take SOS for nausea or vomiting' },
    { drug: 'Tramadol (50mg)', dose: '50mg', route: 'Oral (PO)', qty: '6 Tabs', freq: 'SOS', days: '3d', mealTiming: 'After Meals', notes: 'SOS severe acute breakthrough pain' }
  ];

  // Sync SOAP notes and clinical data when patient changes
  useEffect(() => {
    if (!patient) return;

    const comp = patient.questionnaire?.responses?.chiefComplaint || patient.chiefComplaint || 'Routine Medical Consultation & Evaluation';
    const dur = patient.questionnaire?.responses?.durationMonths || patient.symptomDuration || '2-3 weeks';

    setSoapNote({
      subjective: `${patient.fullName}, a ${patient.age}-year-old ${patient.gender.toLowerCase()}, presents with chief complaint of: ${comp}. Patient describes symptoms persisting for ${dur}.`,
      duration: dur,
      objective: `General Appearance: Conscious, oriented, cooperative, not in acute distress.\n` +
                 `Vitals: BP: ${patient.vitals?.bp || '120/80'} mmHg, Pulse: ${patient.vitals?.pulse || '72'} bpm, SpO2: ${patient.vitals?.spo2 || '99'}%, Temp: ${patient.vitals?.temp || '98.6'}°F, BMI: ${patient.vitals?.bmi || '22.8'} kg/m².\n` +
                 `Systemic Exam: S1 S2 heard, no murmurs. Chest: Bilateral vesicular breath sounds, no wheeze/crepitations. Abdomen: Soft, non-tender, no organomegaly. CNS: No focal neurological deficit.`,
      assessmentNarrative: `Clinical presentation consistent with Primary Essential Hypertension (I10) and associated tension-type cephalalgia. Cardiovascular status stable.`,
      plan: `1. Continue lifestyle modifications: dietary sodium restriction (< 2g/day) and 30 mins daily walking.\n` +
            `2. Optimize pharmacotherapy as per prescription pad.\n` +
            `3. Carry out fasting lipid panel & 12-lead ECG.\n` +
            `4. Scheduled follow-up in 7-10 days.`
    });

    // Seed ICD-10 if patient has previous diagnoses
    if (patient.consultationData?.icd10Diagnoses && patient.consultationData.icd10Diagnoses.length > 0) {
      setIcd10Diagnoses(patient.consultationData.icd10Diagnoses);
    } else if (patient.isFollowUp) {
      setIcd10Diagnoses([
        { code: 'I10', title: 'Essential (primary) hypertension', isPrimary: true, category: 'Cardiovascular' },
        { code: 'E78.2', title: 'Mixed hyperlipidemia', isPrimary: false, category: 'Endocrinology & Metabolism' }
      ]);
    } else {
      setIcd10Diagnoses([
        { code: 'I10', title: 'Essential (primary) hypertension', isPrimary: true, category: 'Cardiovascular' }
      ]);
    }

    if (patient.consultationData?.prescriptions) {
      setPrescriptions(patient.consultationData.prescriptions);
    }

    if (patient.consultationData?.nlpSummary) {
      setNlpSummary(patient.consultationData.nlpSummary);
    } else {
      generateNlpSummaryText(patient, comp, dur);
    }
  }, [patient?.id]);

  // Real-time Drug-Drug Interaction (DDI) alerts
  const ddiAlerts = useMemo(() => {
    return checkDrugInteractions(prescriptions);
  }, [prescriptions]);

  // Generate NLP Summary (CON-F8, NLP-F1, AC-CON-02)
  const generateNlpSummaryText = (pObj = patient, chief = soapNote.subjective, dur = soapNote.duration) => {
    if (!pObj) return;
    const primaryDiag = icd10Diagnoses.find(d => d.isPrimary) || icd10Diagnoses[0] || { code: 'I10', title: 'Essential (primary) hypertension' };
    const secondaryStr = icd10Diagnoses.filter(d => !d.isPrimary).map(d => `[${d.code}] ${d.title}`).join(', ');

    const summary = `Patient ${pObj.fullName}, ${pObj.age}y ${pObj.gender}, presented with ${chief || 'consultation'} for ${dur || 'several weeks'}. ` +
      `On examination: Vitals BP ${pObj.vitals?.bp || '120/80'} mmHg, Pulse ${pObj.vitals?.pulse || '72'} bpm, SpO2 ${pObj.vitals?.spo2 || '99'}%. Systemic examination within normal clinical limits. ` +
      `Assessment: [${primaryDiag.code}] ${primaryDiag.title}${secondaryStr ? ' with ' + secondaryStr : ''}. ` +
      `Plan: Prescribed evidence-based pharmacotherapy (${prescriptions.length} items); ordered ${labOrders.length} diagnostic investigations. ` +
      `Follow-up in ${followUpDays || '7-10 days'}.`;

    setNlpSummary(summary);
    return summary;
  };

  const handleGenerateNlpSummary = () => {
    const summary = generateNlpSummaryText();
    addToast('✨ NLP Clinical Summary generated from structured SOAP note!', 'success');
  };

  // Calling Next Patient from Queue (OPD-F2, AC-OPD-01)
  const handleCallNext = () => {
    const nextP = callNextPatient('Dr. Kiran Patel');
    if (nextP) {
      setActiveTab('soap');
    }
  };

  // ICD-10 Search Filtering
  const filteredIcdCatalog = useMemo(() => {
    if (!icdSearchQuery.trim()) return ICD10_CATALOG.filter(c => c.isCommon);
    const q = icdSearchQuery.toLowerCase();
    return ICD10_CATALOG.filter(c => 
      c.code.toLowerCase().includes(q) || 
      c.title.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  }, [icdSearchQuery]);

  const handleAddIcd = (item) => {
    if (icd10Diagnoses.some(d => d.code === item.code)) {
      addToast(`ICD-10 code ${item.code} is already added.`, 'info');
      return;
    }
    const isFirst = icd10Diagnoses.length === 0;
    setIcd10Diagnoses(prev => [...prev, { ...item, isPrimary: isFirst }]);
    setIcdSearchQuery('');
    addToast(`Added [${item.code}] ${item.title} as ${isFirst ? 'Primary' : 'Secondary'} diagnosis`, 'success');
  };

  const handleRemoveIcd = (code) => {
    setIcd10Diagnoses(prev => {
      const filtered = prev.filter(d => d.code !== code);
      if (filtered.length > 0 && !filtered.some(d => d.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handleSetPrimaryIcd = (code) => {
    setIcd10Diagnoses(prev => prev.map(d => ({
      ...d,
      isPrimary: d.code === code
    })));
    addToast(`Set ICD-10 ${code} as primary diagnosis`, 'info');
  };

  // Prescription Handlers
  const handleAddPresetDrug = (preset) => {
    const newRx = {
      id: Date.now() + Math.random(),
      ...preset
    };
    setPrescriptions(prev => [...prev, newRx]);
    addToast(`Added ${preset.drug} to prescription pad`, 'info');
  };

  const handleAddCustomDrug = (drugNameText) => {
    const text = (drugNameText || customDrugSearch).trim();
    if (!text) return;
    const doseMatch = text.match(/\d+\s*(mg|mcg|g|ml)/i);
    const newRx = {
      id: Date.now() + Math.random(),
      drug: text,
      dose: doseMatch ? doseMatch[0] : 'Standard',
      route: 'Oral (PO)',
      qty: '10 Tabs',
      freq: '1-0-1',
      days: '5d',
      mealTiming: 'After Meals',
      notes: 'Take as directed by doctor'
    };
    setPrescriptions(prev => [...prev, newRx]);
    setCustomDrugSearch('');
    addToast(`Added ${text} to prescription pad`, 'info');
  };

  const handleUpdateRx = (id, field, value) => {
    setPrescriptions(prev => prev.map(rx => rx.id === id ? { ...rx, [field]: value } : rx));
  };

  const handleRemoveDrug = (id) => {
    setPrescriptions(prev => prev.filter(rx => rx.id !== id));
  };

  // Pathology Lab Order Handlers
  const handleToggleLabTest = (testItem) => {
    const exists = labOrders.some(l => l.id === testItem.id);
    if (exists) {
      setLabOrders(prev => prev.filter(l => l.id !== testItem.id));
      addToast(`Removed ${testItem.name} order`, 'info');
    } else {
      setLabOrders(prev => [...prev, {
        id: testItem.id,
        name: testItem.name,
        urgency: 'Routine',
        specimen: testItem.specimen,
        notes: ''
      }]);
      addToast(`Added ${testItem.name} order`, 'success');
    }
  };

  // Sign & Lock Consultation Execution (CON-F7, BR-CON-01, BR-CON-02, BR-CON-03, AC-CON-01)
  const handleInitiateSignLock = () => {
    // 1. Mandatory Primary ICD-10 Validation (AC-CON-01)
    if (!icd10Diagnoses || icd10Diagnoses.length === 0) {
      addToast('⚠️ Primary diagnosis (ICD-10 code) is required before signing — NABH Statutory Requirement', 'error');
      setActiveTab('soap');
      return;
    }

    // 2. Critical DDI / Risk safety check
    const hasCriticalDdi = ddiAlerts.some(a => a.severity === 'CRITICAL');
    if (hasCriticalDdi && !overrideNote.trim()) {
      setIsSignLockConfirmOpen(true);
      return;
    }

    executeSignAndLock();
  };

  const executeSignAndLock = () => {
    const consultationPayload = {
      signedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      signedBy: 'Dr. Kiran Patel, MD (Reg: MC-84920-CA)',
      soapNote,
      icd10Diagnoses,
      prescriptions,
      ddiAlerts,
      labOrders,
      followUp: `${followUpDays} • ${followUpNotes}`,
      internalReferral: internalReferral.department ? internalReferral : null,
      nlpSummary: nlpSummary || generateNlpSummaryText(),
      overrideNote
    };

    const success = signAndLockConsultation(patient.id, consultationPayload);
    if (success) {
      setIsSignLockConfirmOpen(false);
      setIsPrescriptionModalOpen(true);
    }
  };

  // Filtered Patient Queue
  const filteredQueue = useMemo(() => {
    return patients.filter(p => {
      const q = queueSearch.toLowerCase();
      const matchSearch = 
        p.fullName.toLowerCase().includes(q) ||
        (p.uhid && p.uhid.toLowerCase().includes(q)) ||
        (p.opdId && p.opdId.toLowerCase().includes(q)) ||
        String(p.tokenNumber).includes(q);

      if (!matchSearch) return false;

      if (queueFilter === 'WAITING') {
        return p.status === 'WAITING' || p.status === 'REGISTERED' || p.status === 'INSIGHTS_READY' || p.status === 'IN_TRIAGE';
      }
      if (queueFilter === 'IN_CONSULTATION') {
        return p.status === 'IN_CONSULTATION';
      }
      if (queueFilter === 'COMPLETED') {
        return p.status === 'COMPLETED';
      }
      return true;
    });
  }, [patients, queueSearch, queueFilter]);

  const queueWaitingCount = patients.filter(p => p.status === 'WAITING' || p.status === 'REGISTERED' || p.status === 'INSIGHTS_READY' || p.status === 'IN_TRIAGE').length;
  const queueConsultingCount = patients.filter(p => p.status === 'IN_CONSULTATION').length;
  const queueCompletedCount = patients.filter(p => p.status === 'COMPLETED').length;

  return (
    <div className="m3-app-shell doctor-theme">
      {/* Sidebar Navigation */}
      <Sidebar 
        role="doctor"
        activeTab={doctorNav}
        setActiveTab={setDoctorNav}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <div className="m3-main-viewport">
        {/* Top App Bar */}
        <Navbar 
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          currentRole={currentRole}
          dept="OPD"
          onLogout={onLogout}
          onOpenDoctorGuide={() => setIsGuideOpen(true)}
        />

        {/* SUBTAB 1: OPD Overview & Analytics Hub */}
        {doctorNav === 'dashboard' && (
          <DoctorDashboard 
            onOpenWorkspace={(patientId, initialTab) => {
              if (patientId) setSelectedPatientId(patientId);
              if (initialTab) setActiveTab(initialTab);
              setDoctorNav('workspace');
            }}
            onSwitchToReception={onSwitchToReception}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        )}

        {/* SUBTAB 2: Patient Dossier & History Records */}
        {doctorNav === 'dossier' && (
          <DoctorPatientDossierView 
            patients={patients}
            onOpenWorkspace={(patientId) => {
              if (patientId) setSelectedPatientId(patientId);
              setDoctorNav('workspace');
              setActiveTab('soap');
            }}
            onOpenScans={(patientId) => {
              if (patientId) setSelectedPatientId(patientId);
              setDoctorNav('viewer');
            }}
          />
        )}

        {/* SUBTAB 3: Diagnostic Scans & PACS */}
        {doctorNav === 'viewer' && (
          <DoctorDiagnosticScansView 
            patients={patients}
            selectedPatientId={selectedPatientId}
            onSelectPatient={(patientId) => setSelectedPatientId(patientId)}
            onOpenWorkspace={(patientId) => {
              if (patientId) setSelectedPatientId(patientId);
              setDoctorNav('workspace');
            }}
          />
        )}

        {/* SUBTAB 4: Main OPD Consultation Workspace (The Core Clinical Engine) */}
        {doctorNav === 'workspace' && (
          <main className="page-container doctor-page-container m3-page-animate" style={{ maxWidth: '100%', width: '100%', margin: '0', boxSizing: 'border-box' }}>
            
            {/* Top Active Patient Encounter Strip */}
            <div 
              className="m3-doctor-patient-banner" 
              style={{ 
                border: '1.5px solid var(--doc-banner-border, #bfe7f5)', 
                background: 'var(--doc-banner-bg, linear-gradient(135deg, #ffffff 0%, #edf8fc 100%))',
                borderRadius: 14,
                padding: '12px 18px',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 14,
                flexWrap: 'wrap'
              }}
            >
              <div 
                className="m3-patient-banner-info" 
                style={{ 
                  position: 'relative', 
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  flex: '1 1 650px',
                  minWidth: 0,
                  flexWrap: 'nowrap'
                }}
              >
                <div 
                  className="stat-squircle-badge" 
                  style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 12, 
                    fontSize: 14, 
                    fontWeight: 900, 
                    background: 'linear-gradient(135deg, #0077b6, #023e8a)', 
                    color: '#ffffff', 
                    boxShadow: '0 4px 10px rgba(0, 119, 182, 0.35)',
                    flexShrink: 0
                  }}
                >
                  {patient.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>

                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                      {patient.fullName}
                    </h2>

                    {/* Master UHID Pill */}
                    <span 
                      style={{ 
                        fontSize: 10.5, 
                        background: '#eff6ff', 
                        color: '#1e40af', 
                        border: '1px solid #bfdbfe', 
                        padding: '2px 8px', 
                        borderRadius: 9999, 
                        fontWeight: 800 
                      }}
                    >
                      Master UHID: {patient.uhid || patient.mrn}
                    </span>

                    {/* OPD Encounter ID */}
                    <span 
                      style={{ 
                        fontSize: 10.5, 
                        background: '#f8fafc', 
                        color: '#475569', 
                        border: '1px solid #cbd5e1', 
                        padding: '2px 8px', 
                        borderRadius: 9999, 
                        fontWeight: 700 
                      }}
                    >
                      {patient.opdId || `OPD-26-${patient.tokenNumber}`}
                    </span>

                    {/* Token Number */}
                    <span 
                      style={{ 
                        fontSize: 10.5, 
                        background: '#fef3c7', 
                        color: '#92400e', 
                        border: '1px solid #fde68a', 
                        padding: '2px 8px', 
                        borderRadius: 9999, 
                        fontWeight: 900 
                      }}
                    >
                      Token #{patient.tokenNumber}
                    </span>

                    {/* New vs Follow-up badge (OPD-F5) */}
                    {patient.isFollowUp ? (
                      <span 
                        style={{ 
                          fontSize: 10, 
                          background: '#f3e8ff', 
                          color: '#7e22ce', 
                          border: '1px solid #e9d5ff', 
                          padding: '2px 8px', 
                          borderRadius: 9999, 
                          fontWeight: 800 
                        }}
                      >
                        🔁 Follow-Up Visit
                      </span>
                    ) : (
                      <span 
                        style={{ 
                          fontSize: 10, 
                          background: '#e0f2fe', 
                          color: '#0369a1', 
                          border: '1px solid #bae6fd', 
                          padding: '2px 8px', 
                          borderRadius: 9999, 
                          fontWeight: 800 
                        }}
                      >
                        🆕 New Registration
                      </span>
                    )}

                    {/* Patient Category Badge */}
                    <span 
                      style={{ 
                        fontSize: 10, 
                        background: patient.patientCategory === 'FOREIGN' ? '#fdf2f8' : '#f0fdf4', 
                        color: patient.patientCategory === 'FOREIGN' ? '#9d174d' : '#15803d', 
                        border: `1px solid ${patient.patientCategory === 'FOREIGN' ? '#fbcfe8' : '#bbf7d0'}`, 
                        padding: '2px 8px', 
                        borderRadius: 9999, 
                        fontWeight: 700 
                      }}
                    >
                      {patient.patientCategory === 'FOREIGN' ? '🌍 Foreign FRRO' : '🇮🇳 Domestic'}
                    </span>

                    {/* Status Pill */}
                    {patient.status === 'COMPLETED' ? (
                      <span style={{ fontSize: 10.5, padding: '2px 8px', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', borderRadius: 9999, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={11} /> Consultation Signed & Locked
                      </span>
                    ) : (
                      <span style={{ fontSize: 10.5, padding: '2px 8px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: 9999, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span className="live-dot anim-radar-ping" style={{ backgroundColor: '#2563eb', width: 6, height: 6, borderRadius: '50%' }} />
                        Active in Consultation
                      </span>
                    )}
                  </div>

                  {/* Demographics & Vitals Row */}
                  <div style={{ fontSize: 11.5, color: '#475569', marginTop: 4, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span>{patient.age}y {patient.gender} • {patient.city || 'Chennai'} • Payer: <strong>{patient.insurance?.provider || 'Self-Pay / Cash'}</strong></span>
                    
                    {patient.referredBy && (
                      <span style={{ color: '#0369a1', fontWeight: 600 }}>
                        • Ref: {patient.referredBy} {patient.referrerContact ? `(${patient.referrerContact})` : ''}
                      </span>
                    )}

                    {/* Vitals Telemetry Strip with Auto Alert Indicators (Module 3) */}
                    {patient.vitals && (
                      <span 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 6, 
                          background: '#ffffff', 
                          padding: '2px 8px', 
                          borderRadius: 8, 
                          fontSize: 11, 
                          fontWeight: 700, 
                          color: '#0f172a', 
                          border: '1px solid #cbd5e1' 
                        }}
                      >
                        <Activity size={12} color="#0077b6" />
                        <span>BP: {patient.vitals.bp || '120/80'}</span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span>HR: {patient.vitals.pulse || '72'} bpm</span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span>SpO2: {patient.vitals.spo2 || '99'}%</span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span>Temp: {patient.vitals.temp || '98.6'}°F</span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span>BMI: {patient.vitals.bmi || '22.8'}</span>
                      </span>
                    )}

                    {/* Allergy warning flag */}
                    {(patient.allergies || patient.questionnaire?.responses?.allergies) && (
                      <span style={{ fontSize: 10.5, padding: '2px 8px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: 9999, fontWeight: 700 }}>
                        ⚠️ Allergy: {patient.allergies || patient.questionnaire?.responses?.allergies}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons in Banner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', position: 'relative', zIndex: 1, flexShrink: 0, marginLeft: 'auto' }}>
                {patient.status !== 'IN_CONSULTATION' && patient.status !== 'COMPLETED' && (
                  <button
                    type="button"
                    className="m3-btn m3-btn-filled"
                    onClick={() => updatePatient(patient.id, { status: 'IN_CONSULTATION', consultationStartTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })}
                    style={{ height: 32, fontSize: 11.5, background: '#0077b6', color: '#ffffff', border: 'none', gap: 5 }}
                  >
                    <Stethoscope size={14} />
                    <span>Call In Chamber</span>
                  </button>
                )}

                <button
                  type="button"
                  className="m3-btn m3-btn-outlined"
                  onClick={() => setIsPrescriptionModalOpen(true)}
                  style={{ height: 32, fontSize: 11.5, padding: '0 12px', gap: 5, borderColor: '#0077b6', color: '#0077b6', fontWeight: 700 }}
                  title="Preview or print official NABH compliant prescription"
                >
                  <Printer size={14} />
                  <span>Official Rx (PDF)</span>
                </button>

                <button
                  type="button"
                  className="m3-btn m3-btn-filled"
                  onClick={handleInitiateSignLock}
                  style={{
                    height: 32,
                    fontSize: 11.5,
                    padding: '0 14px',
                    border: 'none',
                    fontWeight: 800,
                    background: patient.status === 'COMPLETED' ? '#16a34a' : 'linear-gradient(135deg, #059669, #10b981)',
                    color: '#ffffff',
                    gap: 5,
                    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.35)'
                  }}
                >
                  <Lock size={14} />
                  <span>{patient.status === 'COMPLETED' ? 'Update & Re-lock' : 'Sign & Lock Consultation'}</span>
                </button>
              </div>
            </div>

            {/* Main 2-Column Clinical Layout */}
            <div className="doctor-workspace" style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: 10, height: 'calc(100vh - 145px)', minHeight: 0 }}>
              
              {/* Left Column: OPD Queue Board for Doctor (Module 2) */}
              <div 
                className="card" 
                style={{ 
                  padding: '12px 10px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  overflow: 'hidden', 
                  height: '100%',
                  background: 'var(--bg-surface, #ffffff)',
                  border: '1px solid var(--border-default)' 
                }}
              >
                {/* Queue Title & Call Next */}
                <div style={{ marginBottom: 10, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        OPD Queue • Cabin 01
                      </div>
                      <div style={{ fontSize: 10.5, color: '#64748b' }}>
                        Dr. Kiran Patel (Internal Med)
                      </div>
                    </div>
                    <span 
                      style={{ 
                        fontSize: 10, 
                        background: '#eff6ff', 
                        color: '#1d4ed8', 
                        padding: '2px 7px', 
                        borderRadius: 9999, 
                        fontWeight: 800 
                      }}
                    >
                      {queueWaitingCount} Waiting
                    </span>
                  </div>

                  {/* 1-Click Call Next Patient Button (OPD-F2, AC-OPD-01) */}
                  <button
                    type="button"
                    className="m3-btn m3-btn-filled anim-hover-lift"
                    onClick={handleCallNext}
                    style={{
                      width: '100%',
                      height: 32,
                      fontSize: 11.5,
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #0077b6, #023e8a)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      gap: 6,
                      boxShadow: '0 2px 6px rgba(0, 119, 182, 0.3)'
                    }}
                  >
                    <Zap size={14} />
                    <span>Call Next Patient (Token)</span>
                  </button>
                </div>

                {/* Queue Filter Pills */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexShrink: 0 }}>
                  {[
                    { id: 'ALL', label: `All (${patients.length})` },
                    { id: 'WAITING', label: `Wait (${queueWaitingCount})` },
                    { id: 'IN_CONSULTATION', label: `Room (${queueConsultingCount})` },
                    { id: 'COMPLETED', label: `Done (${queueCompletedCount})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setQueueFilter(tab.id)}
                      style={{
                        flex: 1,
                        padding: '3px 4px',
                        fontSize: 9.5,
                        fontWeight: 700,
                        borderRadius: 9999,
                        border: 'none',
                        cursor: 'pointer',
                        background: queueFilter === tab.id ? '#0077b6' : '#f1f5f9',
                        color: queueFilter === tab.id ? '#ffffff' : '#475569',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search Queue */}
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6, 
                    background: '#f8fafc', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 8, 
                    padding: '4px 8px', 
                    marginBottom: 8,
                    flexShrink: 0
                  }}
                >
                  <Search size={12} color="#64748b" />
                  <input 
                    type="text"
                    placeholder="Search name, token, UHID..."
                    value={queueSearch}
                    onChange={(e) => setQueueSearch(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: 11,
                      width: '100%',
                      color: '#0f172a'
                    }}
                  />
                  {queueSearch && (
                    <button type="button" onClick={() => setQueueSearch('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                      <X size={11} color="#64748b" />
                    </button>
                  )}
                </div>

                {/* Scrollable Patient List */}
                <div className="m3-scrollable-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4, minHeight: 0 }}>
                  {filteredQueue.map(p => {
                    const isSelected = p.id === patient.id;
                    const isWait = p.status === 'WAITING' || p.status === 'REGISTERED' || p.status === 'INSIGHTS_READY' || p.status === 'IN_TRIAGE';
                    const isInRoom = p.status === 'IN_CONSULTATION';
                    const isDone = p.status === 'COMPLETED';

                    let tokenBg = '#f1f5f9';
                    let tokenColor = '#475569';
                    if (isWait) {
                      tokenBg = '#fef3c7';
                      tokenColor = '#92400e';
                    } else if (isInRoom) {
                      tokenBg = '#eff6ff';
                      tokenColor = '#1d4ed8';
                    } else if (isDone) {
                      tokenBg = '#dcfce7';
                      tokenColor = '#15803d';
                    }

                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPatientId(p.id)}
                        className={`doctor-patient-card ${isSelected ? 'selected' : ''}`}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 10,
                          border: isSelected ? '1.5px solid #0077b6' : '1px solid #e2e8f0',
                          background: isSelected ? 'linear-gradient(135deg, #ffffff 0%, #edf8fc 100%)' : '#ffffff',
                          cursor: 'pointer',
                          position: 'relative',
                          flexShrink: 0,
                          boxShadow: isSelected ? '0 2px 8px rgba(0, 119, 182, 0.15)' : 'none',
                          boxSizing: 'border-box'
                        }}
                      >
                        {/* Row 1: Token, Name, Follow-up badge */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                            <span 
                              style={{ 
                                fontSize: 9.5, 
                                fontWeight: 800, 
                                padding: '1.5px 6px', 
                                borderRadius: 4, 
                                background: tokenBg, 
                                color: tokenColor,
                                flexShrink: 0
                              }}
                            >
                              T-{p.tokenNumber}
                            </span>
                            <span style={{ fontWeight: 800, fontSize: 12, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.fullName}
                            </span>
                          </div>
                          
                          {p.isFollowUp && (
                            <span style={{ fontSize: 9, color: '#7e22ce', fontWeight: 800, flexShrink: 0 }}>
                              🔁 Follow-Up
                            </span>
                          )}
                        </div>

                        {/* Row 2: Demographics, UHID & Wait Time */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: '#64748b', lineHeight: 1.35 }}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.uhid || p.mrn} • {p.age}y {p.gender}
                          </span>
                          <span style={{ flexShrink: 0, marginLeft: 4, fontWeight: 600 }}>
                            Wait: {p.waitTimeMinutes || 15}m
                          </span>
                        </div>

                        {/* Row 3: Status Footnote & Quick Call */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingTop: 4, borderTop: '1px dashed #f1f5f9', fontSize: 9.5 }}>
                          <span style={{ fontWeight: 700, color: tokenColor }}>
                            {isInRoom ? '● With Doctor' : isDone ? '✓ Completed' : '⏳ Waiting'}
                          </span>

                          {isWait && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPatientId(p.id);
                                updatePatient(p.id, { status: 'IN_CONSULTATION', consultationStartTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
                                addToast(`Called Token #${p.tokenNumber} (${p.fullName}) into chamber!`, 'info');
                              }}
                              style={{
                                padding: '2px 8px',
                                fontSize: 9.5,
                                fontWeight: 800,
                                background: '#0077b6',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              Call In ↗
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: 5 Clinical Tabs (SOAP, Rx, Lab, Referral, Insights) */}
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', overflow: 'hidden' }}>
                
                {/* Workspace Navigation Tabs */}
                <div 
                  className="m3-view-tabs-container" 
                  style={{ 
                    flexShrink: 0, 
                    marginBottom: 8, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6,
                    background: '#f8fafc',
                    padding: '4px 6px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <button
                    className={`m3-view-tab ${activeTab === 'soap' ? 'active' : ''}`}
                    onClick={() => setActiveTab('soap')}
                    style={{ fontSize: 11.5, padding: '6px 12px', gap: 6 }}
                  >
                    <FileText size={14} />
                    <span>1. SOAP Note & ICD-10</span>
                  </button>

                  <button
                    className={`m3-view-tab ${activeTab === 'rx' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rx')}
                    style={{ fontSize: 11.5, padding: '6px 12px', gap: 6 }}
                  >
                    <Pill size={14} />
                    <span>2. E-Prescription ({prescriptions.length})</span>
                    {ddiAlerts.length > 0 && (
                      <span style={{ fontSize: 9.5, background: '#fee2e2', color: '#dc2626', padding: '1px 5px', borderRadius: 9999, fontWeight: 800 }}>
                        {ddiAlerts.length} DDI
                      </span>
                    )}
                  </button>

                  <button
                    className={`m3-view-tab ${activeTab === 'lab' ? 'active' : ''}`}
                    onClick={() => setActiveTab('lab')}
                    style={{ fontSize: 11.5, padding: '6px 12px', gap: 6 }}
                  >
                    <FlaskConical size={14} />
                    <span>3. Lab & Imaging Orders ({labOrders.length})</span>
                  </button>

                  <button
                    className={`m3-view-tab ${activeTab === 'referral' ? 'active' : ''}`}
                    onClick={() => setActiveTab('referral')}
                    style={{ fontSize: 11.5, padding: '6px 12px', gap: 6 }}
                  >
                    <Calendar size={14} />
                    <span>4. Follow-up & Referral</span>
                  </button>

                  <button
                    className={`m3-view-tab ${activeTab === 'insights' ? 'active' : ''}`}
                    onClick={() => setActiveTab('insights')}
                    style={{ fontSize: 11.5, padding: '6px 12px', gap: 6 }}
                  >
                    <Sparkles size={14} />
                    <span>5. CDSS Insights</span>
                  </button>

                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className="m3-btn m3-btn-sm m3-btn-tonal"
                      onClick={handleGenerateNlpSummary}
                      style={{ height: 26, fontSize: 10.5, padding: '0 8px', gap: 4 }}
                      title="Auto-generate plain language NLP summary from SOAP notes"
                    >
                      <Sparkles size={12} color="#0077b6" />
                      <span>Generate NLP Summary</span>
                    </button>
                  </div>
                </div>

                {/* TAB 1: SOAP NOTE & ICD-10 DIAGNOSES (CON-F3, CON-F4, BR-CON-01, AC-CON-01) */}
                {activeTab === 'soap' && (
                  <div className="card m3-scrollable-body" style={{ padding: 16, flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                          Clinical Assessment & Structured SOAP Documentation
                        </h3>
                        <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          Subjective, Objective, Assessment (with mandatory ICD-10 codes) and Care Plan
                        </p>
                      </div>

                      {/* Primary ICD-10 Notice Badge */}
                      <span style={{ fontSize: 10.5, padding: '3px 10px', borderRadius: 9999, background: icd10Diagnoses.length > 0 ? '#dcfce7' : '#fee2e2', color: icd10Diagnoses.length > 0 ? '#15803d' : '#991b1b', fontWeight: 800, border: `1px solid ${icd10Diagnoses.length > 0 ? '#86efac' : '#fca5a5'}` }}>
                        {icd10Diagnoses.length > 0 ? `✓ Primary ICD-10 Attached (${icd10Diagnoses.find(d => d.isPrimary)?.code || icd10Diagnoses[0].code})` : '⚠️ Missing Mandatory ICD-10 Code'}
                      </span>
                    </div>

                    {/* SOAP Sections Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                      
                      {/* S: SUBJECTIVE */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0077b6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            S — Subjective (History & Complaints)
                          </span>
                          <SpeechMicButton
                            onTranscript={(txt) => setSoapNote(prev => ({ ...prev, subjective: `${prev.subjective ? prev.subjective + ' ' : ''}${txt}` }))}
                            title="Voice dictate subjective complaints"
                            size={12}
                          />
                        </div>
                        <textarea
                          rows={4}
                          value={soapNote.subjective}
                          onChange={(e) => setSoapNote(prev => ({ ...prev, subjective: e.target.value }))}
                          placeholder="Chief complaint, symptom duration, history of present illness (HPI), patient narrative..."
                          style={{
                            width: '100%',
                            border: '1px solid #cbd5e1',
                            borderRadius: 6,
                            padding: 8,
                            fontSize: 11.5,
                            color: '#0f172a',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                          }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                          <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>Symptom Duration:</span>
                          <input
                            type="text"
                            value={soapNote.duration}
                            onChange={(e) => setSoapNote(prev => ({ ...prev, duration: e.target.value }))}
                            placeholder="e.g. 5 days, 2 months"
                            style={{
                              border: '1px solid #cbd5e1',
                              borderRadius: 4,
                              padding: '2px 6px',
                              fontSize: 10.5,
                              color: '#0f172a',
                              width: '120px'
                            }}
                          />
                        </div>
                      </div>

                      {/* O: OBJECTIVE */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0077b6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            O — Objective (Examination & Vitals)
                          </span>
                          <SpeechMicButton
                            onTranscript={(txt) => setSoapNote(prev => ({ ...prev, objective: `${prev.objective ? prev.objective + ' ' : ''}${txt}` }))}
                            title="Voice dictate physical examination findings"
                            size={12}
                          />
                        </div>
                        <textarea
                          rows={4}
                          value={soapNote.objective}
                          onChange={(e) => setSoapNote(prev => ({ ...prev, objective: e.target.value }))}
                          placeholder="General examination, physical systemic findings (cardiovascular, respiratory, abdomen, CNS)..."
                          style={{
                            width: '100%',
                            border: '1px solid #cbd5e1',
                            borderRadius: 6,
                            padding: 8,
                            fontSize: 11.5,
                            color: '#0f172a',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    {/* A: ASSESSMENT & ICD-10 DIAGNOSES (MANDATORY BR-CON-01) */}
                    <div style={{ background: '#ffffff', border: '1.5px solid #bfdbfe', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 900, color: '#1e40af', textTransform: 'uppercase' }}>
                            A — Assessment & Diagnostic Coding (ICD-10 India Edition)
                          </span>
                          <span style={{ fontSize: 9.5, background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
                            NABH Mandatory Sign-off Requirement
                          </span>
                        </div>
                      </div>

                      {/* Selected ICD-10 Codes Badges */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                        {icd10Diagnoses.length === 0 ? (
                          <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, padding: '4px 8px', background: '#fef2f2', borderRadius: 6, border: '1px dashed #f87171' }}>
                            ⚠️ No ICD-10 diagnosis attached. Please select at least one primary diagnosis from catalog below to sign off consultation.
                          </div>
                        ) : (
                          icd10Diagnoses.map((diag) => (
                            <div
                              key={diag.code}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 10px',
                                borderRadius: 6,
                                background: diag.isPrimary ? '#eff6ff' : '#f8fafc',
                                border: diag.isPrimary ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                                fontSize: 11.5
                              }}
                            >
                              <strong style={{ color: diag.isPrimary ? '#1d4ed8' : '#334155' }}>
                                [{diag.code}] {diag.title}
                              </strong>
                              {diag.isPrimary ? (
                                <span style={{ fontSize: 9, background: '#2563eb', color: '#ffffff', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>
                                  PRIMARY
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryIcd(diag.code)}
                                  style={{ fontSize: 9, background: '#e2e8f0', color: '#475569', border: 'none', padding: '1px 5px', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}
                                  title="Set as primary diagnosis"
                                >
                                  Make Primary
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveIcd(diag.code)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', padding: 0 }}
                                title="Remove diagnosis"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* ICD-10 Search Input */}
                      <div style={{ position: 'relative', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 10px' }}>
                          <Search size={13} color="#64748b" />
                          <input
                            type="text"
                            placeholder="Type to search ICD-10 code (e.g. I10, E11, Hypertension, Diabetes, Dengue, Asthma)..."
                            value={icdSearchQuery}
                            onChange={(e) => setIcdSearchQuery(e.target.value)}
                            style={{
                              border: 'none',
                              outline: 'none',
                              background: 'transparent',
                              fontSize: 11.5,
                              color: '#0f172a',
                              width: '100%'
                            }}
                          />
                          {icdSearchQuery && (
                            <button type="button" onClick={() => setIcdSearchQuery('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                              <X size={12} color="#64748b" />
                            </button>
                          )}
                        </div>

                        {/* Search Dropdown / Presets */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6, maxHeight: '96px', overflowY: 'auto' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginRight: 4, alignSelf: 'center' }}>
                            {icdSearchQuery ? 'Matching Codes:' : 'Common Presets:'}
                          </span>
                          {filteredIcdCatalog.slice(0, 10).map((catItem) => (
                            <button
                              key={catItem.code}
                              type="button"
                              onClick={() => handleAddIcd(catItem)}
                              style={{
                                padding: '2px 8px',
                                fontSize: 10.5,
                                fontWeight: 600,
                                borderRadius: 9999,
                                border: '1px solid #cbd5e1',
                                background: '#f1f5f9',
                                color: '#0f172a',
                                cursor: 'pointer'
                              }}
                            >
                              + [{catItem.code}] {catItem.title.split(',')[0]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* CDSS Suggested Differentials (DIFF-F1 to DIFF-F3) */}
                      {insights?.predictedConditions && insights.predictedConditions.length > 0 && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #e2e8f0' }}>
                          <div style={{ fontSize: 10.5, fontWeight: 800, color: '#0369a1', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Sparkles size={11} />
                            <span>CDSS Algorithmic Differential Suggestions:</span>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {insights.predictedConditions.map((diff, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleAddIcd({ code: diff.icd10_code || 'R68.89', title: diff.condition_name, category: 'CDSS Differential' })}
                                style={{
                                  padding: '2px 8px',
                                  fontSize: 10.5,
                                  fontWeight: 600,
                                  borderRadius: 4,
                                  border: '1px solid #93c5fd',
                                  background: '#eff6ff',
                                  color: '#1e40af',
                                  cursor: 'pointer'
                                }}
                              >
                                + Adopt [{diff.icd10_code || 'R68.89'}] {diff.condition_name} ({diff.probability_score || '85%'} Match)
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* P: PLAN */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0077b6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          P — Plan (Care Plan & Lifestyle Advice)
                        </span>
                        <SpeechMicButton
                          onTranscript={(txt) => setSoapNote(prev => ({ ...prev, plan: `${prev.plan ? prev.plan + ' ' : ''}${txt}` }))}
                          title="Voice dictate care plan"
                          size={12}
                        />
                      </div>
                      <textarea
                        rows={3}
                        value={soapNote.plan}
                        onChange={(e) => setSoapNote(prev => ({ ...prev, plan: e.target.value }))}
                        placeholder="Treatment plan narrative, non-pharmacological advice, dietary precautions, activity restrictions..."
                        style={{
                          width: '100%',
                          border: '1px solid #cbd5e1',
                          borderRadius: 6,
                          padding: 8,
                          fontSize: 11.5,
                          color: '#0f172a',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* NLP Clinical Summary Card (CON-F8, NLP-F1, AC-CON-02) */}
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
                            NLP Plain-Language Consultation Summary
                          </span>
                          <span style={{ fontSize: 9.5, background: '#bbf7d0', color: '#14532d', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                            Rule-Based Engine (NLP-F1)
                          </span>
                        </div>
                        <button
                          type="button"
                          className="m3-btn m3-btn-sm"
                          onClick={handleGenerateNlpSummary}
                          style={{ height: 24, fontSize: 10.5, padding: '0 8px', background: '#16a34a', color: '#ffffff', border: 'none' }}
                        >
                          <RotateCcw size={11} />
                          <span>Re-Generate</span>
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={nlpSummary}
                        onChange={(e) => setNlpSummary(e.target.value)}
                        placeholder="Auto-generated plain language clinical summary paragraph..."
                        style={{
                          width: '100%',
                          border: '1px solid #86efac',
                          borderRadius: 6,
                          padding: 8,
                          fontSize: 11.5,
                          color: '#14532d',
                          background: '#ffffff',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: E-PRESCRIPTION (RX-F1 to RX-F6, DDI CHECKS, SCHEDULE H/H1) */}
                {activeTab === 'rx' && (
                  <div className="card m3-scrollable-body" style={{ padding: 16, flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="stat-squircle-badge" style={{ width: 28, height: 28, borderRadius: 8, background: '#0077b6', color: '#ffffff' }}>
                          <Pill size={15} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                            Digital E-Prescription Pad
                          </h3>
                          <span style={{ fontSize: 11, color: '#64748b' }}>
                            {prescriptions.length} {prescriptions.length === 1 ? 'Medication' : 'Medications'} Prescribed • Auto DDI Safety Engine Active
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setPrescriptions([])}
                          className="m3-btn m3-btn-outlined m3-btn-sm"
                          style={{ height: 28, fontSize: 11, color: '#ef4444', borderColor: '#fca5a5' }}
                        >
                          <RotateCcw size={12} />
                          <span>Clear Pad</span>
                        </button>

                        <button
                          type="button"
                          className="m3-btn m3-btn-filled m3-btn-sm"
                          onClick={() => setIsPrescriptionModalOpen(true)}
                          style={{ height: 28, fontSize: 11, background: '#0077b6', color: '#ffffff', border: 'none' }}
                        >
                          <Printer size={12} />
                          <span>Print Rx (PDF / Thermal)</span>
                        </button>
                      </div>
                    </div>

                    {/* DDI Alert Banner (RX-F3, BR-RX-01, US-CDSS-01) */}
                    {ddiAlerts.length > 0 ? (
                      <div style={{ background: '#fef2f2', border: '1.5px solid #ef4444', borderRadius: 8, padding: 12, marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <AlertTriangle size={16} color="#dc2626" />
                          <strong style={{ fontSize: 12.5, color: '#991b1b' }}>
                            Drug-Drug Interaction (DDI) Alert Detected ({ddiAlerts.length})
                          </strong>
                        </div>
                        {ddiAlerts.map((alert, idx) => (
                          <div key={idx} style={{ fontSize: 11.5, color: '#7f1d1d', marginTop: 4, paddingLeft: 24 }}>
                            <div>• <strong>[{alert.severity}] {alert.title}:</strong> {alert.drugA} + {alert.drugB}</div>
                            <div style={{ fontSize: 10.5, color: '#991b1b', marginTop: 1 }}>Mechanism: {alert.mechanism}</div>
                            <div style={{ fontSize: 10.5, color: '#166534', fontWeight: 600 }}>Action: {alert.management}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#166534', fontWeight: 600 }}>
                        <ShieldCheck size={14} color="#16a34a" />
                        <span>DDI Safety Engine: All prescribed medications verified compatible. Zero adverse interactions detected.</span>
                      </div>
                    )}

                    {/* 1-Click Formulary Presets */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b', letterSpacing: '0.04em', marginBottom: 4 }}>
                        ⚡ 1-CLICK FORMULARY PRESETS:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {PRESCRIPTION_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleAddPresetDrug(preset)}
                            style={{
                              padding: '3px 9px',
                              fontSize: 10.5,
                              fontWeight: 700,
                              borderRadius: 9999,
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              color: '#0f172a',
                              cursor: 'pointer'
                            }}
                          >
                            + {preset.drug}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Search & Custom Drug Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: '4px 10px', marginBottom: 14 }}>
                      <Search size={14} color="#0077b6" />
                      <input
                        type="text"
                        placeholder="Type generic or brand drug name (e.g. Ciprofloxacin 500mg, Montair-LC, Pan-D)..."
                        value={customDrugSearch}
                        onChange={(e) => setCustomDrugSearch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomDrug(); }}
                        style={{
                          flex: 1,
                          border: 'none',
                          background: 'transparent',
                          outline: 'none',
                          fontSize: 11.5,
                          color: '#0f172a'
                        }}
                      />
                      <SpeechMicButton
                        onTranscript={(text) => handleAddCustomDrug(text)}
                        title="Voice dictate medication name"
                        size={12}
                      />
                      <button
                        type="button"
                        className="m3-btn m3-btn-filled m3-btn-sm"
                        onClick={() => handleAddCustomDrug()}
                        style={{ height: 26, fontSize: 11, background: '#0077b6', color: '#ffffff', border: 'none' }}
                      >
                        <Plus size={12} />
                        <span>Add Drug</span>
                      </button>
                    </div>

                    {/* Medications List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {prescriptions.length === 0 ? (
                        <div style={{ padding: 24, textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, color: '#64748b', fontSize: 11.5 }}>
                          No medications on this prescription pad. Use 1-Click presets or search to add medications.
                        </div>
                      ) : (
                        prescriptions.map((rx, idx) => {
                          const schedBadge = getDrugScheduleBadge(rx.drug);
                          return (
                            <div
                              key={rx.id || idx}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 10,
                                padding: '10px 14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                              }}
                            >
                              {/* Top Row: Name, Dose, Route, Schedule Badge, Delete */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ width: 22, height: 22, borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {idx + 1}
                                  </span>
                                  <strong style={{ fontSize: 13, color: '#0f172a' }}>
                                    {rx.drug}
                                  </strong>
                                  <span style={{ fontSize: 10.5, padding: '1px 7px', borderRadius: 9999, background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                                    {rx.dose || 'Standard'}
                                  </span>
                                  {schedBadge && (
                                    <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 4, background: schedBadge.bg, color: schedBadge.color, fontWeight: 800 }}>
                                      {schedBadge.label}
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveDrug(rx.id)}
                                  style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                                  title="Remove medication"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>

                              {/* Controls Row: Route, Frequency, Days, Meal Timing */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 10.5 }}>
                                {/* Route */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ fontWeight: 700, color: '#64748b' }}>Route:</span>
                                  <select
                                    value={rx.route || 'Oral (PO)'}
                                    onChange={(e) => handleUpdateRx(rx.id, 'route', e.target.value)}
                                    style={{ border: '1px solid #cbd5e1', borderRadius: 4, padding: '2px 4px', fontSize: 10.5, color: '#0f172a' }}
                                  >
                                    <option value="Oral (PO)">Oral (PO)</option>
                                    <option value="Intravenous (IV)">Intravenous (IV)</option>
                                    <option value="Intramuscular (IM)">Intramuscular (IM)</option>
                                    <option value="Subcutaneous (SC)">Subcutaneous (SC)</option>
                                    <option value="Topical">Topical</option>
                                    <option value="Inhalation">Inhalation</option>
                                  </select>
                                </div>

                                {/* Frequency */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ fontWeight: 700, color: '#64748b' }}>Freq:</span>
                                  {['1-0-1', '1-0-0', '0-0-1', '1-1-1', 'SOS'].map(f => (
                                    <button
                                      key={f}
                                      type="button"
                                      onClick={() => handleUpdateRx(rx.id, 'freq', f)}
                                      style={{
                                        padding: '1px 6px',
                                        fontSize: 10,
                                        fontWeight: 700,
                                        borderRadius: 4,
                                        border: rx.freq === f ? '1px solid #0077b6' : '1px solid #cbd5e1',
                                        background: rx.freq === f ? '#0077b6' : '#f8fafc',
                                        color: rx.freq === f ? '#ffffff' : '#334155',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {f}
                                    </button>
                                  ))}
                                </div>

                                {/* Days */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ fontWeight: 700, color: '#64748b' }}>Days:</span>
                                  {['3d', '5d', '7d', '14d', '30d'].map(d => (
                                    <button
                                      key={d}
                                      type="button"
                                      onClick={() => handleUpdateRx(rx.id, 'days', d)}
                                      style={{
                                        padding: '1px 6px',
                                        fontSize: 10,
                                        fontWeight: 700,
                                        borderRadius: 4,
                                        border: rx.days === d ? '1px solid #0f172a' : '1px solid #cbd5e1',
                                        background: rx.days === d ? '#0f172a' : '#f8fafc',
                                        color: rx.days === d ? '#ffffff' : '#334155',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {d}
                                    </button>
                                  ))}
                                </div>

                                {/* Meal Timing */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  {['Before Meals', 'After Meals', 'With Meals', 'At Bedtime'].map(m => (
                                    <button
                                      key={m}
                                      type="button"
                                      onClick={() => handleUpdateRx(rx.id, 'mealTiming', m)}
                                      style={{
                                        padding: '1px 6px',
                                        fontSize: 10,
                                        fontWeight: 600,
                                        borderRadius: 4,
                                        border: rx.mealTiming === m ? '1px solid #16a34a' : '1px solid #cbd5e1',
                                        background: rx.mealTiming === m ? '#dcfce7' : '#f8fafc',
                                        color: rx.mealTiming === m ? '#15803d' : '#334155',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {m}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Clinical Instructions with Mic */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '3px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                <input
                                  type="text"
                                  value={rx.notes || ''}
                                  placeholder="Clinical instructions (e.g. take with a full glass of water, avoid citrus juices...)"
                                  onChange={(e) => handleUpdateRx(rx.id, 'notes', e.target.value)}
                                  style={{
                                    flex: 1,
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    fontSize: 11,
                                    color: '#475569',
                                    fontStyle: 'italic'
                                  }}
                                />
                                <SpeechMicButton
                                  onTranscript={(txt) => handleUpdateRx(rx.id, 'notes', txt)}
                                  title="Voice dictate instructions"
                                  size={11}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: PATHOLOGY & DIAGNOSTIC LAB ORDERS (PATH-F1, PATH-F2) */}
                {activeTab === 'lab' && (
                  <div className="card m3-scrollable-body" style={{ padding: 16, flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                          Diagnostic Pathology & Imaging Investigation Orders
                        </h3>
                        <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          Orders are routed to Pathology & Radiology queues upon consultation sign-off
                        </p>
                      </div>

                      <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 9999, background: '#eff6ff', color: '#1e40af', fontWeight: 700 }}>
                        {labOrders.length} Tests Ordered
                      </span>
                    </div>

                    {/* Ordered Tests List */}
                    {labOrders.length > 0 && (
                      <div style={{ background: '#f0f9ff', border: '1.5px solid #90e0ef', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0077b6', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle2 size={13} />
                          <span>Currently Selected Diagnostic Orders for Today's Encounter:</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {labOrders.map(lab => (
                            <div 
                              key={lab.id} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                background: '#ffffff', 
                                padding: '6px 12px', 
                                borderRadius: 6, 
                                border: '1px solid #bfdbfe' 
                              }}
                            >
                              <div>
                                <strong style={{ fontSize: 12, color: '#0f172a' }}>{lab.name}</strong>
                                <span style={{ fontSize: 10, color: '#64748b', marginLeft: 8 }}>
                                  Specimen: {lab.specimen || 'Standard'}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <select
                                  value={lab.urgency || 'Routine'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setLabOrders(prev => prev.map(l => l.id === lab.id ? { ...l, urgency: val } : l));
                                  }}
                                  style={{
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 4,
                                    padding: '2px 6px',
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: lab.urgency === 'STAT' ? '#dc2626' : lab.urgency === 'Urgent' ? '#d97706' : '#1e40af'
                                  }}
                                >
                                  <option value="Routine">Routine</option>
                                  <option value="Urgent">Urgent</option>
                                  <option value="STAT">STAT (Immediate)</option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() => handleToggleLabTest(lab)}
                                  style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                                  title="Remove test order"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hospital Test Catalog */}
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                      Hospital Diagnostic Catalog:
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8 }}>
                      {PATHOLOGY_LAB_CATALOG.map(test => {
                        const isOrdered = labOrders.some(l => l.id === test.id);
                        return (
                          <div
                            key={test.id}
                            style={{
                              background: isOrdered ? '#eff6ff' : '#f8fafc',
                              border: isOrdered ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                              borderRadius: 8,
                              padding: '10px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 10
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                                {test.name}
                              </div>
                              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                                {test.category} • Turnaround: {test.turnaround}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleLabTest(test)}
                              style={{
                                padding: '4px 10px',
                                fontSize: 10.5,
                                fontWeight: 800,
                                borderRadius: 6,
                                border: 'none',
                                cursor: 'pointer',
                                background: isOrdered ? '#1e40af' : '#e2e8f0',
                                color: isOrdered ? '#ffffff' : '#334155',
                                flexShrink: 0
                              }}
                            >
                              {isOrdered ? '✓ Ordered' : '+ Order'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 4: FOLLOW-UP & INTERNAL REFERRAL (CON-F9, CON-F10) */}
                {activeTab === 'referral' && (
                  <div className="card m3-scrollable-body" style={{ padding: 16, flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                          Follow-Up Scheduling & Departmental Referral
                        </h3>
                        <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          Schedule patient return review or generate cross-departmental internal consultation
                        </p>
                      </div>
                    </div>

                    {/* Section 1: Follow-up Scheduling (CON-F10) */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#0077b6', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={14} />
                        <span>Scheduled Follow-Up Consultation (OPD-F6, CON-F10):</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Quick Intervals:</span>
                        {[
                          { id: '3d', label: 'In 3 Days' },
                          { id: '7d', label: 'In 7 Days' },
                          { id: '10d', label: 'In 10 Days' },
                          { id: '14d', label: 'In 2 Weeks' },
                          { id: '1m', label: 'In 1 Month' },
                          { id: 'SOS', label: 'SOS / Need Basis' }
                        ].map(int => (
                          <button
                            key={int.id}
                            type="button"
                            onClick={() => {
                              setFollowUpDays(int.label);
                              addToast(`Follow-up scheduled: ${int.label}`, 'info');
                            }}
                            style={{
                              padding: '3px 10px',
                              fontSize: 10.5,
                              fontWeight: 700,
                              borderRadius: 9999,
                              border: followUpDays === int.label ? '1px solid #0077b6' : '1px solid #cbd5e1',
                              background: followUpDays === int.label ? '#0077b6' : '#ffffff',
                              color: followUpDays === int.label ? '#ffffff' : '#334155',
                              cursor: 'pointer'
                            }}
                          >
                            {int.label}
                          </button>
                        ))}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Instructions for Next Visit:</label>
                        <input
                          type="text"
                          value={followUpNotes}
                          onChange={(e) => setFollowUpNotes(e.target.value)}
                          placeholder="e.g. Review with fasting lipid panel and ECG tracings..."
                          style={{
                            border: '1px solid #cbd5e1',
                            borderRadius: 6,
                            padding: '6px 10px',
                            fontSize: 11.5,
                            color: '#0f172a'
                          }}
                        />
                      </div>
                    </div>

                    {/* Section 2: Cross-Department Internal Referral (CON-F9) */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Share2 size={14} color="#0077b6" />
                        <span>Internal Departmental Referral (CON-F9):</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                          <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                            Target Clinical Specialty:
                          </label>
                          <select
                            value={internalReferral.department}
                            onChange={(e) => setInternalReferral(prev => ({ ...prev, department: e.target.value }))}
                            style={{
                              width: '100%',
                              border: '1px solid #cbd5e1',
                              borderRadius: 6,
                              padding: '6px 8px',
                              fontSize: 11.5,
                              color: '#0f172a'
                            }}
                          >
                            <option value="">-- No Departmental Referral --</option>
                            {HOSPITAL_DEPARTMENTS.map(d => (
                              <option key={d.id} value={d.name}>
                                {d.name} ({d.headDoctor})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                            Referral Urgency:
                          </label>
                          <select
                            value={internalReferral.urgency}
                            onChange={(e) => setInternalReferral(prev => ({ ...prev, urgency: e.target.value }))}
                            style={{
                              width: '100%',
                              border: '1px solid #cbd5e1',
                              borderRadius: 6,
                              padding: '6px 8px',
                              fontSize: 11.5,
                              color: '#0f172a'
                            }}
                          >
                            <option value="Routine">Routine Outpatient Review</option>
                            <option value="Urgent">Urgent Specialty Evaluation</option>
                            <option value="Emergency">STAT / Emergency Referral</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569' }}>
                          Clinical Reason for Referral:
                        </label>
                        <input
                          type="text"
                          value={internalReferral.reason}
                          onChange={(e) => setInternalReferral(prev => ({ ...prev, reason: e.target.value }))}
                          placeholder="e.g. Specialized 2D-Echocardiogram and Holter monitor review indicated..."
                          style={{
                            border: '1px solid #cbd5e1',
                            borderRadius: 6,
                            padding: '6px 10px',
                            fontSize: 11.5,
                            color: '#0f172a'
                          }}
                        />
                      </div>
                    </div>

                    {/* ─── Admit to IPD — OPD Referral ───────────────────── */}
                    <div style={{
                      marginTop: 20, padding: '18px 20px',
                      background: '#fff7ed', borderRadius: 12,
                      border: '1.5px solid #fed7aa',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 20 }}>🏥</span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: '#c2410c' }}>
                          Admit Patient to Inpatient (IPD)
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#7c2d12', marginBottom: 14, lineHeight: 1.6 }}>
                        Patient requires inpatient admission. Click below to open the IPD Bed Matrix
                        where you can assign a bed via <strong>OPD Referral tab</strong> using this
                        patient's consultation as the referral record.
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => navigate('/ipd')}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 22px', borderRadius: 9,
                            border: 'none', cursor: 'pointer',
                            background: 'linear-gradient(135deg,#ea580c,#c2410c)',
                            color: '#fff', fontSize: 13, fontWeight: 800,
                          }}
                        >
                          🏥 Admit to IPD — Open Bed Matrix
                        </button>
                        <button
                          type="button"
                          onClick={() => addToast && addToast('Admission referral flagged. IPD team will assign a bed.', 'info')}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '10px 18px', borderRadius: 9, cursor: 'pointer',
                            border: '1.5px solid #fed7aa', background: '#fff',
                            color: '#c2410c', fontSize: 12, fontWeight: 700,
                          }}
                        >
                          📋 Flag for IPD (notify ward)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: CDSS CLINICAL INSIGHTS & TRIAGE SCORES (CDSS-F1 to CDSS-F6) */}
                {activeTab === 'insights' && (
                  <div className="card m3-scrollable-body" style={{ padding: 16, flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                          Clinical Decision Support System (CDSS)
                        </h3>
                        <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          Deterministic clinical algorithms computed from triage vitals, intake screening & formulary checks
                        </p>
                      </div>

                      <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 9999, background: '#eff6ff', color: '#1e40af', fontWeight: 800 }}>
                        Engine: Deterministic-CDSS-v2.2
                      </span>
                    </div>

                    {/* Risk Flags Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                      {(insights?.riskFlags || [
                        { label: 'Cardiovascular Risk Surveillance', severity: 'MEDIUM', note: 'Hypertension Stage 2 documented with headache' },
                        { label: 'Lipid Surveillance', severity: 'LOW', note: 'Fasting lipid profile advised' }
                      ]).map((flag, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: flag.severity === 'CRITICAL' ? '#fee2e2' : flag.severity === 'HIGH' ? '#fff7ed' : '#f8fafc',
                            borderLeft: `4px solid ${flag.severity === 'CRITICAL' ? '#dc2626' : flag.severity === 'HIGH' ? '#ea580c' : '#0077b6'}`,
                            borderRadius: 6,
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10
                          }}
                        >
                          <AlertTriangle size={15} color={flag.severity === 'CRITICAL' ? '#dc2626' : flag.severity === 'HIGH' ? '#ea580c' : '#0077b6'} style={{ marginTop: 2 }} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                              [{flag.severity}] {flag.label}
                            </div>
                            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                              {flag.note}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Psychometric & Pain Triage Scores */}
                    {insights?.scores && (
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0077b6', marginBottom: 8 }}>
                          Intake Psychometric & Pain Scale Scores (Nurse Administered):
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                          <div style={{ background: '#ffffff', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: '#64748b' }}>PHQ-2 Depression</div>
                            <div style={{ fontSize: 15, fontWeight: 900, color: insights.scores.phq2_positive ? '#dc2626' : '#16a34a' }}>
                              {insights.scores.phq2_score || 0} / 6
                            </div>
                            <div style={{ fontSize: 9.5, color: '#64748b' }}>{insights.scores.phq2_positive ? 'Screen Positive' : 'Normal'}</div>
                          </div>

                          <div style={{ background: '#ffffff', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: '#64748b' }}>GAD-2 Anxiety</div>
                            <div style={{ fontSize: 15, fontWeight: 900, color: insights.scores.gad2_positive ? '#dc2626' : '#16a34a' }}>
                              {insights.scores.gad2_score || 0} / 6
                            </div>
                            <div style={{ fontSize: 9.5, color: '#64748b' }}>{insights.scores.gad2_positive ? 'Screen Positive' : 'Normal'}</div>
                          </div>

                          <div style={{ background: '#ffffff', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: '#64748b' }}>PEG-3 Pain Scale</div>
                            <div style={{ fontSize: 15, fontWeight: 900, color: insights.scores.peg3_significant_pain ? '#d97706' : '#16a34a' }}>
                              {insights.scores.peg3_average || 0} / 10
                            </div>
                            <div style={{ fontSize: 9.5, color: '#64748b' }}>{insights.scores.peg3_significant_pain ? 'Significant' : 'Mild / None'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </main>
        )}

        {/* Sign & Lock Confirmation / Safety Override Modal */}
        {isSignLockConfirmOpen && (
          <div 
            className="modal-overlay m3-dialog-backdrop no-print" 
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.72)',
              backdropFilter: 'blur(6px)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              zIndex: 9999,
              padding: 16
            }}
            onClick={() => setIsSignLockConfirmOpen(false)}
          >
            <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: 480, maxWidth: '92vw', padding: 20, borderRadius: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    Clinical Safety Justification Required
                  </h3>
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    NABH & DDI Clinical Audit Requirement (BR-CON-05)
                  </span>
                </div>
              </div>

              <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 12 }}>
                A critical safety warning is active on this encounter. To digitally sign and close the consultation, please provide a brief justification for the permanent medical audit trail:
              </p>

              <textarea
                rows={3}
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                placeholder="Enter justification (e.g. Under strict daily monitoring; patient tolerating well; benefits outweigh risks)..."
                style={{
                  width: '100%',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  padding: 8,
                  fontSize: 11.5,
                  color: '#0f172a',
                  marginBottom: 14,
                  boxSizing: 'border-box'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="m3-btn m3-btn-outlined"
                  onClick={() => setIsSignLockConfirmOpen(false)}
                  style={{ height: 30, fontSize: 11.5 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="m3-btn m3-btn-filled"
                  onClick={executeSignAndLock}
                  disabled={!overrideNote.trim()}
                  style={{ height: 30, fontSize: 11.5, background: '#16a34a', color: '#ffffff', border: 'none' }}
                >
                  Confirm & Lock
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Official Printable Prescription Modal (RX-F6, RX-F7) */}
        <PrintablePrescriptionModal
          isOpen={isPrescriptionModalOpen}
          onClose={() => setIsPrescriptionModalOpen(false)}
          patient={patient}
          consultationData={{
            soapNote,
            icd10Diagnoses,
            prescriptions,
            labOrders,
            followUp: `${followUpDays} • ${followUpNotes}`,
            plan: soapNote.plan
          }}
          doctorName="Dr. Kiran Patel, MD (General & Internal Medicine)"
          doctorRegNo="MC-84920-CA"
        />

        {/* Doctor Flow Interactive Guide Modal */}
        {isGuideOpen && (
          <DoctorFlowGuideModal 
            isOpen={isGuideOpen}
            onClose={() => setIsGuideOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
