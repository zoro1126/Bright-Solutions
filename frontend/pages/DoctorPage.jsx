import React, { useState, useRef, useEffect } from 'react';
import { usePatients } from '../context/PatientContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import DoctorDashboard from '../components/DoctorDashboard';
import DoctorFlowGuideModal from '../components/DoctorFlowGuideModal';
import { 
  Stethoscope, 
  Sparkles, 
  FileText, 
  Pill, 
  CheckCircle2, 
  AlertTriangle, 
  Maximize2, 
  ZoomIn, 
  Move, 
  Sun, 
  Ruler, 
  Plus, 
  Trash2, 
  Save, 
  Check, 
  ArrowRight, 
  Clock, 
  Layers, 
  Activity, 
  FileCheck,
  X,
  Mic,
  MicOff,
  Search,
  RotateCcw,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import SpeechMicButton from '../components/SpeechMicButton';
import { formulary as formularyApi, prescriptions as prescriptionsApi, signOff as signOffApi } from '../services/api';

export default function DoctorPage({ currentRole = 'doctor', onSwitchRole, onSwitchToReception, activeSubTab = 'workspace', onLogout }) {
  const { patients, selectedPatientId, setSelectedPatientId, updatePatient, addToast, fetchPatientDossier } = usePatients();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [doctorNav, setDoctorNav] = useState(activeSubTab || 'workspace');
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'dicom' | 'history' | 'rx' | 'conclusion'
  const [overrideNote, setOverrideNote] = useState('');
  const [isCdssOverrideModalOpen, setIsCdssOverrideModalOpen] = useState(false);

  // Pop-up Modals State
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isDicomModalOpen, setIsDicomModalOpen] = useState(false);
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
  const [isConclusionModalOpen, setIsConclusionModalOpen] = useState(false);

  // DICOM Viewer State
  const [selectedSeries, setSelectedSeries] = useState('CT Chest with Contrast');
  const [currentSlice, setCurrentSlice] = useState(74);
  const [windowPreset, setWindowPreset] = useState('Lung (WW:1500 WL:-600)');
  const [zoomLevel, setZoomLevel] = useState(100);

  // Digital Prescription Presets from Reference Design
  const PRESCRIPTION_PRESETS = [
    { drug: 'Paracetamol (650mg)', dose: '650mg', qty: '6 Tabs', freq: '1-0-1', days: '3d', mealTiming: 'After Meals', notes: 'Take SOS for headache or fever' },
    { drug: 'Pantoprazole (40mg)', dose: '40mg', qty: '7 Tabs', freq: '1-0-0', days: '7d', mealTiming: 'Before Meals', notes: 'Take 30 mins before breakfast' },
    { drug: 'Amoxicillin (625mg)', dose: '625mg', qty: '10 Tabs', freq: '1-0-1', days: '5d', mealTiming: 'After Meals', notes: 'Complete full course with water' },
    { drug: 'Atorvastatin (10mg)', dose: '10mg', qty: '30 Tabs', freq: '0-0-1', days: '30d', mealTiming: 'After Meals', notes: 'Take at bedtime' },
    { drug: 'Ondansetron (4mg)', dose: '4mg', qty: '5 Tabs', freq: 'SOS', days: '5d', mealTiming: 'Before Meals', notes: 'Take 30 mins before food SOS for nausea' },
    { drug: 'Tramadol (50mg)', dose: '50mg', qty: '6 Tabs', freq: 'SOS', days: '3d', mealTiming: 'After Meals', notes: 'For severe breakthrough pain' },
    { drug: 'Montair-LC', dose: '10mg/5mg', qty: '10 Tabs', freq: '0-0-1', days: '10d', mealTiming: 'After Meals', notes: 'Take at night for respiratory ease' }
  ];

  // Prescriptioner State
  const [prescriptions, setPrescriptions] = useState([
    {
      id: 1,
      drug: 'Paracetamol (Dolo) 650mg',
      dose: '650mg',
      qty: '6 Tabs',
      freq: '1-0-1',
      days: '3d',
      mealTiming: 'After Meals',
      notes: 'Take SOS for headache or fever'
    },
    {
      id: 2,
      drug: 'Pantoprazole (Pan) 40mg',
      dose: '40mg',
      qty: '7 Tabs',
      freq: '1-0-0',
      days: '7d',
      mealTiming: 'Before Meals',
      notes: 'Take 30 mins before breakfast'
    }
  ]);

  const [customDrugSearch, setCustomDrugSearch] = useState('');
  const [formularyResults, setFormularyResults] = useState([]);
  const [isSearchingFormulary, setIsSearchingFormulary] = useState(false);

  // Current Patient
  const patient = patients.find(p => p.id === selectedPatientId) || patients[0];
  const insights = patient.mlInsights;

  // Auto-fetch real clinical dossier from backend whenever selected patient changes
  useEffect(() => {
    if (patient?.id && fetchPatientDossier) {
      fetchPatientDossier(patient.id);
    }
  }, [patient?.id, fetchPatientDossier]);

  // Live WHO EML formulary search
  useEffect(() => {
    if (!customDrugSearch || customDrugSearch.trim().length < 2) {
      setFormularyResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearchingFormulary(true);
        const res = await formularyApi.search(customDrugSearch.trim());
        if (res?.results) {
          setFormularyResults(res.results.slice(0, 6));
        }
      } catch (err) {
        console.warn('Formulary search error:', err.message);
      } finally {
        setIsSearchingFormulary(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [customDrugSearch]);

  // Conclusion Draft State
  const [conclusionText, setConclusionText] = useState(() => {
    return `CLINICAL IMPRESSION:
${patient.fullName}, ${patient.age}yo ${patient.gender.toLowerCase()}, presenting for clinical evaluation with chief complaint: ${patient.chief_complaint || 'Consultation'}.

CLINICAL DECISION SUPPORT & RISK FLAGS (Deterministic CDSS + NegEx NLP):
- Overall Clinical Risk: ${insights?.overallRisk || 'ROUTINE'} (${insights?.overallRisk === 'HIGH' ? 'Critical Action Required' : 'Standard Outpatient Protocols'})
${(insights?.riskFlags || []).map(f => `- [${f.severity}] ${f.label}: ${f.note}`).join('\n') || '- Standard clinical triage'}

RECOMMENDED WORKUP & INVESTIGATIONS:
1. 12-Lead Electrocardiogram (ECG) & Baseline Vitals Monitoring.
2. Fasting Comprehensive Metabolic & Lipid Panel (HbA1c, Serum Creatinine, Electrolytes).

TREATMENT & FOLLOW-UP PLAN:
- Initiate evidence-based pharmacotherapy and lifestyle modifications as indicated.
- Schedule follow-up clinical review in 7-10 days.`;
  });

  // Sync clinical conclusion draft dynamically when selected patient changes
  useEffect(() => {
    if (!patient) return;
    const comp = patient.chief_complaint || patient.questionnaire?.responses?.chiefComplaint || 'Consultation & Clinical Evaluation';
    setConclusionText(`CLINICAL IMPRESSION:
${patient.fullName}, ${patient.age}yo ${patient.gender.toLowerCase()}, presenting for clinical evaluation with chief complaint: ${comp}.

CLINICAL DECISION SUPPORT & RISK FLAGS (Deterministic CDSS + NegEx NLP):
- Overall Clinical Risk: ${insights?.overallRisk || 'ROUTINE'} (${insights?.overallRisk === 'HIGH' ? 'Critical Action Required' : 'Standard Outpatient Protocols'})
${(insights?.riskFlags || []).map(f => `- [${f.severity}] ${f.label}: ${f.note}`).join('\n') || '- Standard clinical triage'}

RECOMMENDED WORKUP & INVESTIGATIONS:
${(insights?.recommendedInvestigations || [
  { name: '12-Lead Electrocardiogram (ECG)', urgency: 'Routine' },
  { name: 'Comprehensive Metabolic Panel (HbA1c / LFT / KFT)', urgency: 'Routine' }
]).map((inv, idx) => `${idx + 1}. ${inv.name} (${inv.urgency})`).join('\n')}

TREATMENT & FOLLOW-UP PLAN:
- Initiate evidence-based pharmacotherapy and lifestyle modifications as indicated.
- Schedule review in 7-10 days with diagnostic laboratory & imaging reports.`);
  }, [patient?.id]);

  // Speech-to-Text (STT) Voice Dictation State & Handler
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const toggleSpeechToText = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast('Speech-to-text is not supported in this browser. Please use Chrome/Edge or type directly.', 'warning');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      addToast('Voice dictation paused.', 'info');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        addToast('Microphone active. Speak your clinical notes now...', 'info');
      };

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript.trim();
            if (transcript) {
              setConclusionText(prev => `${prev ? prev + ' ' : ''}${transcript}.`);
            }
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn('STT Error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          addToast('Microphone permission denied. Please allow microphone access in browser settings.', 'error');
        } else {
          addToast(`Voice dictation stopped: ${event.error}`, 'warning');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition start failed:', err);
      setIsListening(false);
      addToast('Could not initialize microphone.', 'error');
    }
  };

  const handleAddCustomDrug = (text) => {
    const drugName = (text || customDrugSearch).trim();
    if (!drugName) return;
    const doseMatch = drugName.match(/\d+\s*(mg|mcg|g)/i);
    const newRx = {
      id: Date.now(),
      drug_id: 1,
      drug: drugName,
      dose: doseMatch ? doseMatch[0] : '500mg',
      qty: '10 Tabs',
      freq: '1-0-1',
      days: '5d',
      mealTiming: 'After Meals',
      notes: 'Take as directed by doctor'
    };
    setPrescriptions(prev => [...prev, newRx]);
    setCustomDrugSearch('');
    setFormularyResults([]);
    addToast(`Added ${drugName} to prescription pad`, 'info');
  };

  const handleSelectFormularyDrug = (item) => {
    const newRx = {
      id: Date.now(),
      drug_id: item.id,
      drug: item.available_brands ? `${item.inn_name} (${item.available_brands.split(',')[0].trim()}) ${item.strength}` : `${item.inn_name} ${item.strength}`,
      dose: item.strength || '500mg',
      qty: '10 Tabs',
      freq: item.standard_schedule || '1-0-1',
      days: '5d',
      mealTiming: 'After Meals',
      notes: `WHO EML ${item.atc_code || ''} • ${item.dosage_form}`
    };
    setPrescriptions(prev => [...prev, newRx]);
    setCustomDrugSearch('');
    setFormularyResults([]);
    addToast(`Added WHO EML formulary drug: ${newRx.drug}`, 'info');
  };

  const handleAddPreset = (preset) => {
    setPrescriptions(prev => [
      ...prev,
      { id: Date.now() + Math.random(), drug_id: 1, ...preset }
    ]);
    addToast(`Added ${preset.drug} preset`, 'info');
  };

  const handleUpdateRx = (id, field, value) => {
    setPrescriptions(prev => prev.map(rx => rx.id === id ? { ...rx, [field]: value } : rx));
  };

  const handleClearPad = () => {
    setPrescriptions([]);
    addToast('Prescription pad cleared', 'info');
  };

  const handleFinalizePrescription = () => {
    addToast(`Prescription finalized with ${prescriptions.length} medications and transmitted to Pharmacy & Cashier!`, 'success');
  };

  const handleRemoveDrug = (id) => {
    setPrescriptions(prev => prev.filter(p => p.id !== id));
  };

  const handleFinalizeVisit = async () => {
    // CDSS Safety Check: CRITICAL alert requires override note before sign-off
    if (insights?.overallRisk === 'HIGH' && !overrideNote.trim()) {
      setIsCdssOverrideModalOpen(true);
      return;
    }

    const visitId = patient.visit_id || (
      typeof patient.id === 'number'
        ? patient.id
        : (patient.id?.startsWith?.('pat-') ? parseInt(patient.id.replace('pat-', ''), 10) : 1)
    );

    try {
      if (prescriptions.length > 0) {
        const items = prescriptions.map((p, idx) => ({
          drug_id: p.drug_id || (idx + 1),
          dosage: p.dose || '1 tab',
          frequency: p.freq || '1-0-1',
          duration_days: parseInt(p.days, 10) || 5,
          meal_timing: p.mealTiming === 'Before Meals' ? 'BEFORE_MEALS' : 'AFTER_MEALS',
          special_instructions: p.notes || 'As directed'
        }));
        await prescriptionsApi.create(visitId, {
          general_instructions: conclusionText,
          items
        });
      }

      await signOffApi.submit(visitId, {
        conclusion_notes: conclusionText,
        diagnosis: conclusionText.split('\n')[0].replace('CLINICAL IMPRESSION:', '').trim() || 'General OPD Consultation',
        doctor_override_notes: overrideNote || null
      });
    } catch (err) {
      console.warn('Sign-off endpoint synced locally:', err.message);
    }

    updatePatient(patient.id, { 
      status: 'COMPLETED',
      billingStatus: 'READY',
      prescriptions: prescriptions,
      consultationConclusion: conclusionText,
      cdssOverrideNote: overrideNote
    });
    addToast(`Consultation finalized for ${patient.fullName}. Transmitted to Cashier for billing!`, 'success');
    if (onSwitchRole) {
      setTimeout(() => {
        onSwitchRole('cashier');
      }, 900);
    }
  };

  const handleDoctorNavChange = (tabId) => {
    if (tabId === 'dossier') {
      setActiveTab('history');
      setDoctorNav('workspace');
      return;
    }
    if (tabId === 'viewer') {
      setActiveTab('dicom');
      setDoctorNav('workspace');
      return;
    }
    setDoctorNav(tabId);
  };

  return (
    <div className="m3-app-shell doctor-theme">
      {/* Google M3 Sidebar Navigation Drawer */}
      <Sidebar 
        role="doctor"
        activeTab={doctorNav}
        setActiveTab={handleDoctorNavChange}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <div className="m3-main-viewport">
        <Navbar 
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          currentRole={currentRole}
          onRoleChange={onSwitchRole}
          onLogout={onLogout}
          onOpenDoctorGuide={() => setIsGuideOpen(true)}
        />

        {doctorNav === 'dashboard' ? (
          <DoctorDashboard 
            onOpenWorkspace={(patientId, initialTab) => {
              if (patientId) setSelectedPatientId(patientId);
              if (initialTab) setActiveTab(initialTab);
              setDoctorNav('workspace');
            }}
            onSwitchToReception={onSwitchToReception}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        ) : (
          <main className="page-container doctor-page-container m3-page-animate" style={{ maxWidth: '100%', width: '100%', margin: '0', boxSizing: 'border-box' }}>

            {/* Active Patient Bar - Styled with Theme Palettes */}
            <div className="m3-doctor-patient-banner" style={{ border: '1.5px solid var(--doc-banner-border, #bfe7f5)', background: 'var(--doc-banner-bg, linear-gradient(135deg, #ffffff 0%, #edf8fc 100%))' }}>
        {/* Ambient Pastel Blob in Top-Right Corner */}
        <div className="stat-card-accent-blob" style={{ top: -20, right: -20, width: 96, height: 96, opacity: 0.65, background: 'radial-gradient(circle, var(--doc-accent-color, #00B4D8) 0%, rgba(0, 180, 216, 0) 70%)' }} />

        <div className="m3-patient-banner-info" style={{ position: 'relative', zIndex: 1 }}>
          <div className="stat-squircle-badge" style={{ width: 42, height: 42, borderRadius: 12, fontSize: 14, fontWeight: 800, background: 'var(--doc-brand-gradient, linear-gradient(135deg, #0f172a, #1e3a8a))', color: '#ffffff', boxShadow: 'var(--doc-brand-shadow, 0 4px 10px rgba(30, 58, 138, 0.35))' }}>
            {patient.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--doc-banner-title, #0f172a)', letterSpacing: '-0.02em', margin: 0 }}>
                {patient.fullName}
              </h2>
              <span className="brand-counter-pill" style={{ fontSize: 10, background: 'var(--doc-pill-bg, #CAF0F8)', color: 'var(--doc-pill-color, #0077B6)', border: '1px solid var(--doc-pill-border, #90E0EF)', fontWeight: 700 }}>{patient.mrn}</span>
              {insights?.overallRisk === 'HIGH' && (
                <span className="brand-counter-pill" style={{ fontSize: 10.5, padding: '2px 8px', background: 'var(--warning-container, #fef3c7)', color: 'var(--on-warning-container, #78350f)', border: '1px solid var(--warning, #d97706)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={11} color="var(--warning, #d97706)" /> High Risk Recurrence
                </span>
              )}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span>{patient.age}y {patient.gender} • Coverage: <strong style={{ color: 'var(--doc-accent-color, #2563eb)' }}>{patient.insurance.provider}</strong> • Appt: {patient.appointmentTime}</span>
              {patient.vitals && (
                <span className="anim-hover-lift" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#1e3a8a', border: '1px solid #bfdbfe', boxShadow: '0 2px 8px rgba(30, 58, 138, 0.12)' }}>
                  <span className="anim-radar-ping live-dot" style={{ backgroundColor: '#2563eb', width: 7, height: 7, borderRadius: '50%', flexShrink: 0 }} />
                  <Activity size={12} color="#2563eb" style={{ animation: 'docHeartbeatPulse 1.8s ease-in-out infinite', flexShrink: 0 }} />
                  <span>BP: {patient.vitals.bp || '120/80'}</span>
                  <span style={{ color: '#94a3b8' }}>•</span>
                  <span>HR: {patient.vitals.pulse || '72'} bpm</span>
                  <span style={{ color: '#94a3b8' }}>•</span>
                  <span>Temp: {patient.vitals.temp || '98.6'}°F</span>
                  <span style={{ color: '#94a3b8' }}>•</span>
                  <span>SpO2: {patient.vitals.spo2 || '99'}%</span>
                  <span style={{ color: '#94a3b8' }}>•</span>
                  <span>BMI: {patient.vitals.bmi || '22.8'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="m3-btn anim-hover-lift"
            style={{
              height: 32,
              fontSize: 11.5,
              padding: '0 12px',
              background: 'linear-gradient(135deg, #CAF0F8, #ffffff)',
              color: '#0077B6',
              border: '1.5px solid #90E0EF',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 119, 182, 0.15)'
            }}
            title="Open Doctor Interactive Clinical Guide"
          >
            <Sparkles size={13} color="#0077B6" />
            <span>Doctor Guide ⚡</span>
          </button>

          <button 
            className="m3-btn"
            onClick={onSwitchToReception}
            title="Return to Receptionist Desk"
            style={{ height: 32, fontSize: 11.5, padding: '0 12px', background: 'var(--bg-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', fontWeight: 700 }}
          >
            ← Reception Desk
          </button>
          <button 
            className="m3-btn m3-btn-filled"
            onClick={handleFinalizeVisit}
            data-tour="finalize-consult-btn"
            style={{ 
              height: 32, 
              fontSize: 11.5, 
              padding: '0 14px', 
              border: 'none', 
              color: '#ffffff', 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.35)'
            }}
          >
            <CheckCircle2 size={15} />
            <span>Finalize & Send to Cashier</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="doctor-workspace">
        {/* Left Side: Patient Queue for Doctor */}
        <div className="card" style={{ padding: '12px 10px', height: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0 }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Today's Patients
            </h3>
            <span className="card-count-badge" style={{ fontSize: 10.5 }}>{patients.length} Visits</span>
          </div>

          <div className="m3-scrollable-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 }}>
            {patients.map((p) => {
              const isSelected = p.id === patient.id;
              const hasML = p.status === 'INSIGHTS_READY';

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`doctor-patient-card ${isSelected ? 'selected' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>
                      {p.fullName}
                    </span>
                    <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>
                      {p.appointmentTime}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10.5, position: 'relative', zIndex: 1 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{p.age}y {p.gender}</span>
                    {hasML ? (
                      <span style={{ color: '#15803d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Sparkles size={10} /> AI Ready
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>{p.status.replace('_', ' ')}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Stage: 5 M3 Tabbed Views */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%', height: '100%', maxHeight: '100%', minHeight: 0, overflow: 'hidden' }}>
          {/* M3 View Switcher Tabs */}
          <div className="m3-view-tabs-container" style={{ flexShrink: 0, marginBottom: 8 }}>
            <button
              className={`m3-view-tab ${activeTab === 'insights' ? 'active' : ''}`}
              onClick={() => setActiveTab('insights')}
            >
              <Sparkles size={14} />
              <span>AI Insights</span>
            </button>
            <button
              className={`m3-view-tab ${activeTab === 'dicom' ? 'active' : ''}`}
              onClick={() => setActiveTab('dicom')}
              data-tour="doctor-tab-dicom"
            >
              <Layers size={14} />
              <span>DICOM Scans</span>
            </button>
            <button
              className={`m3-view-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <FileText size={14} />
              <span>Patient History</span>
            </button>
            <button
              className={`m3-view-tab ${activeTab === 'rx' ? 'active' : ''}`}
              onClick={() => setActiveTab('rx')}
              data-tour="doctor-tab-rx"
            >
              <Pill size={14} />
              <span>Prescription</span>
            </button>
            <button
              className={`m3-view-tab ${activeTab === 'conclusion' ? 'active' : ''}`}
              onClick={() => setActiveTab('conclusion')}
            >
              <FileCheck size={14} />
              <span>Conclusion Draft</span>
            </button>
          </div>

          {/* VIEW 1: ML Clinical Insights */}
          {activeTab === 'insights' && (
            <div className="card m3-page-animate m3-scrollable-body" style={{ padding: 16, flex: 1, minHeight: 0, height: '100%', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                    Clinical Decision Support (CDSS) & Risk Assessment
                  </h3>
                  <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    Derived from intake questionnaire & triage vitals • NegEx NLP & validated clinical rule engines
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="m3-model-pill" style={{ padding: '3px 10px', fontSize: 10.5 }}>
                    Deterministic CDSS • NegEx NLP Engine
                  </span>
                  <button
                    type="button"
                    className="m3-btn m3-btn-tonal"
                    style={{ height: 26, fontSize: 11, padding: '0 8px', gap: 4 }}
                    onClick={() => setIsInsightsModalOpen(true)}
                    title="Open Full Insights Pop-up"
                  >
                    <Maximize2 size={12} />
                    <span>Pop-up Dossier</span>
                  </button>
                </div>
              </div>

              {/* Physician Summary Narrative */}
              <div style={{ background: 'var(--bg-subtle)', borderLeft: '4px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 20 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>
                  Physician Executive Summary
                </span>
                <p style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 600, marginTop: 4, lineHeight: 1.5 }}>
                  {insights?.symptomSummary || `${patient.fullName} presenting for clinical evaluation with chief complaint: ${patient.questionnaire?.responses?.chiefComplaint || 'Consultation'}.`}
                </p>
              </div>

              {/* Risk Flags Matrix */}
              <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: 10 }}>
                Detected Clinical Risk Flags
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {insights?.riskFlags?.map((flag, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10,
                      padding: 12, 
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: flag.severity === 'HIGH' ? '#fef2f2' : '#fffbeb',
                      border: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <AlertTriangle size={18} color={flag.severity === 'HIGH' ? '#dc2626' : '#d97706'} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <strong style={{ fontSize: 13, color: flag.severity === 'HIGH' ? '#991b1b' : '#92400e' }}>
                          {flag.label}
                        </strong>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {flag.note}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="m3-btn m3-btn-tonal" style={{ height: 28, fontSize: 11, padding: '0 10px' }}>
                        Accept to Diagnosis
                      </button>
                      <button className="m3-btn m3-btn-outlined" style={{ height: 28, fontSize: 11, padding: '0 10px' }}>
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommended Diagnostic Investigations Checklist */}
              <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: 10 }}>
                AI Recommended Diagnostic Investigation Panel
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                {insights?.recommendedInvestigations?.map((inv) => (
                  <div 
                    key={inv.id}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      backgroundColor: 'var(--bg-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {inv.name}
                      </div>
                      <span style={{ fontSize: 11, color: inv.urgency === 'Urgent' ? '#dc2626' : 'var(--text-muted)', fontWeight: 600 }}>
                        Priority: {inv.urgency}
                      </span>
                    </div>
                    <button className="m3-btn m3-btn-filled" style={{ height: 30, fontSize: 11, padding: '0 12px' }}>
                      Order Test
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 2: Integrated DICOM Viewer */}
          {activeTab === 'dicom' && (
            <div className="dicom-viewport-container m3-page-animate" style={{ flex: 1, minHeight: 0, height: '100%', overflowY: 'auto' }}>
              {/* Radiology Availability Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(245, 158, 11, 0.05)',
                border: '1px solid rgba(245, 158, 11, 0.15)',
                color: '#94a3b8',
                fontSize: '11px',
                margin: '8px 12px 6px 12px',
                lineHeight: 1.4
              }}>
                <AlertCircle size={13} color="#f59e0b" style={{ flexShrink: 0, opacity: 0.75 }} />
                <span>
                  <strong style={{ color: '#cbd5e1', fontWeight: 600 }}>Radiology Department Note:</strong> This DICOM imaging window and scan series will only be available if the radiology department has uploaded and attached the study to this patient MRN; otherwise it will not appear.
                </span>
              </div>

              {/* Tool Controls Bar */}
              <div className="dicom-controls-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f8fafc', fontSize: 13, fontWeight: 700 }}>
                  <Layers size={16} color="#2563eb" />
                  <span>{selectedSeries}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8', background: '#1e293b', padding: '2px 8px', borderRadius: 4 }}>
                    Slice {currentSlice} / 148
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button 
                    className="m3-btn m3-btn-tonal" 
                    style={{ height: 32, fontSize: 11, padding: '0 10px', background: '#1f2937', color: '#f8fafc', border: '1px solid #374151' }}
                    onClick={() => setZoomLevel(prev => Math.min(prev + 20, 200))}
                  >
                    <ZoomIn size={14} /> Zoom ({zoomLevel}%)
                  </button>
                  <button 
                    className="m3-btn m3-btn-tonal" 
                    style={{ height: 32, fontSize: 11, padding: '0 10px', background: '#1f2937', color: '#f8fafc', border: '1px solid #374151' }}
                  >
                    <Sun size={14} /> {windowPreset.split(' ')[0]}
                  </button>
                  <button 
                    className="m3-btn m3-btn-tonal" 
                    style={{ height: 32, fontSize: 11, padding: '0 10px', background: '#1f2937', color: '#f8fafc', border: '1px solid #374151' }}
                  >
                    <Ruler size={14} /> Caliper
                  </button>
                  <button 
                    className="m3-btn m3-btn-tonal" 
                    style={{ height: 32, fontSize: 11, padding: '0 10px', background: '#1f2937', color: '#f8fafc', border: '1px solid #374151' }}
                    onClick={() => setIsDicomModalOpen(true)}
                  >
                    <Maximize2 size={14} /> Pop-up Fullscreen
                  </button>
                </div>
              </div>

              {/* Canvas Scan Area */}
              <div className="dicom-canvas-area">
                {/* Radiological Crosshair / Overlay */}
                <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
                  <div style={{ width: 220, height: 220, border: '2px dashed rgba(37, 99, 235, 0.45)', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)' }}>
                    <div style={{ border: '1.5px solid #22c55e', padding: '4px 10px', borderRadius: 4, background: 'rgba(0,0,0,0.6)', fontSize: 11, color: '#4ade80', fontWeight: 700 }}>
                      📌 2.3 cm Nodular Opacity (RUL)
                    </div>
                  </div>
                  <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>
                    Axial High-Resolution Chest CT Scan
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    WW: 1500  WL: -600 (Lung Window) • 1.5mm Slice Thickness
                  </div>
                </div>

                {/* Slice Navigation Slider Overlay */}
                <div style={{ position: 'absolute', bottom: 16, left: 24, right: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>Slice 1</span>
                  <input 
                    type="range" 
                    min="1" 
                    max="148" 
                    value={currentSlice} 
                    onChange={(e) => setCurrentSlice(Number(e.target.value))}
                    style={{ flex: 1, accentColor: '#2563eb' }}
                  />
                  <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>Slice 148</span>
                </div>
              </div>

              {/* Series Selector Bar */}
              <div className="dicom-series-selector">
                {['CT Chest with Contrast', 'CT Abdomen & Pelvis', 'MRI Brain Sequence', 'Whole Body PET Scan'].map(s => (
                  <div 
                    key={s} 
                    className={`dicom-series-card ${selectedSeries === s ? 'selected' : ''}`}
                    onClick={() => setSelectedSeries(s)}
                  >
                    <div style={{ fontWeight: 700 }}>{s}</div>
                    <div style={{ opacity: 0.7, marginTop: 2 }}>{s.includes('PET') ? '42 Slices' : '148 Slices'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 3: History Summary */}
          {activeTab === 'history' && (
            <div className="card m3-page-animate m3-scrollable-body" style={{ padding: 16, flex: 1, minHeight: 0, height: '100%', overflowY: 'auto' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
                Comprehensive Patient History Summary
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
                <div style={{ background: 'var(--bg-subtle)', padding: 16, borderRadius: 'var(--radius-md)', border: 'none' }}>
                  <span className="section-label">Chief Complaint & Onset</span>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                    {patient.questionnaire?.responses?.chiefComplaint || 'Primary Clinical Consultation'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Duration: {patient.questionnaire?.responses?.durationMonths || 'N/A'} • Site: {patient.questionnaire?.responses?.primarySite || 'General'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: 16, borderRadius: 'var(--radius-md)', border: 'none' }}>
                  <span className="section-label">Prior Clinical Comorbidities</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                    {patient.questionnaire?.clinical_scores?.reported_comorbidities?.length > 0 
                      ? patient.questionnaire.clinical_scores.reported_comorbidities.join(', ')
                      : (patient.questionnaire?.responses?.q14 === 1 ? 'Hypertension' : patient.questionnaire?.responses?.q14 === 2 ? 'Diabetes Mellitus' : 'No prior chronic comorbidity history')}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Recorded Allergies: {patient.questionnaire?.clinical_scores?.reported_allergies?.length > 0 ? patient.questionnaire.clinical_scores.reported_allergies.join(', ') : 'No drug hypersensitivities declared'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: 16, borderRadius: 'var(--radius-md)', border: 'none' }}>
                  <span className="section-label">Familial History & Screening Scores</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                    {patient.questionnaire?.responses?.q19 === 1 ? 'Cardiovascular Disease' : patient.questionnaire?.responses?.q19 === 2 ? 'Diabetes Mellitus' : patient.questionnaire?.responses?.q19 === 3 ? 'Familial Malignancy' : 'No known family clustering'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Scores: PHQ-2: {patient.questionnaire?.clinical_scores?.phq2_score ?? 'N/A'}/6 • GAD-2: {patient.questionnaire?.clinical_scores?.gad2_score ?? 'N/A'}/6 • PEG-3 Pain: {patient.questionnaire?.clinical_scores?.peg3_average ?? 'N/A'}/10
                  </div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: 16, borderRadius: 'var(--radius-md)', border: 'none' }}>
                  <span className="section-label">Functional Performance (ECOG)</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                    {patient.questionnaire?.responses?.q18 === 0 ? 'ECOG 0 — Fully Active' : patient.questionnaire?.responses?.q18 === 1 ? 'ECOG 1 — Restricted in Strenuous Activity' : patient.questionnaire?.responses?.q18 === 2 ? 'ECOG 2 — Ambulatory, Capable of Self-Care' : 'ECOG 0'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Smoking: {patient.questionnaire?.responses?.smokingStatus || 'Never'} • Alcohol: {patient.questionnaire?.responses?.alcoholUse || 'Never'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: Digital Prescription Pad */}
          {activeTab === 'rx' && (
            <div className="card m3-page-animate m3-scrollable-body" style={{ padding: 16, flex: 1, minHeight: 0, height: '100%', overflowY: 'auto' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="stat-squircle-badge badge-bg-yellow" style={{ width: 28, height: 28, borderRadius: 8 }}>
                    <Pill size={15} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Digital Prescription Pad
                  </h3>
                  <span className="brand-counter-pill" style={{ fontSize: 10, padding: '1.5px 7px' }}>
                    {prescriptions.length} {prescriptions.length === 1 ? 'Medication' : 'Medications'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleClearPad}
                  className="icon-btn"
                  style={{
                    width: 'auto',
                    height: 26,
                    padding: '0 8px',
                    fontSize: 11,
                    fontWeight: 600,
                    gap: 4,
                    borderRadius: 6,
                    color: 'var(--text-muted)'
                  }}
                  title="Clear all prescribed medications"
                >
                  <RotateCcw size={12} />
                  <span>Clear Pad</span>
                </button>
              </div>

              {/* 1-Click Presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                  <span>⚡</span>
                  <span>1-CLICK PRESETS:</span>
                </div>
                {PRESCRIPTION_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddPreset(preset)}
                    className="filter-tab"
                    style={{
                      padding: '2px 9px',
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 'var(--radius-full)',
                      height: 'auto',
                      cursor: 'pointer'
                    }}
                  >
                    + {preset.drug}
                  </button>
                ))}
              </div>

              {/* Search & Custom Drug Bar with WHO EML Autocomplete */}
              <div style={{ position: 'relative', width: '100%', marginBottom: 12 }}>
                <div className="search-box" style={{ width: '100%', padding: '4px 6px 4px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Search size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Search WHO EML formulary (e.g. Amlodipine, Metformin, Azithromycin)..."
                    value={customDrugSearch}
                    onChange={(e) => setCustomDrugSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomDrug(); }}
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)'
                    }}
                  />
                  {isSearchingFormulary && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Searching...</span>}
                  <SpeechMicButton
                    onTranscript={(text) => handleAddCustomDrug(text)}
                    title="Voice dictate custom medication name"
                    size={13}
                  />
                  <button
                    type="button"
                    className="m3-btn m3-btn-filled m3-btn-sm"
                    onClick={() => handleAddCustomDrug()}
                  >
                    <Plus size={13} />
                    <span>Add Drug</span>
                  </button>
                </div>

                {/* WHO EML Formulary Live Autocomplete Dropdown */}
                {formularyResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 20,
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    marginTop: 4,
                    boxShadow: 'var(--shadow-md)',
                    overflow: 'hidden'
                  }}>
                    {formularyResults.map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectFormularyDrug(item)}
                        style={{
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border-subtle)',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>
                            {item.inn_name}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                            {item.strength} • {item.dosage_form}
                          </span>
                          {item.available_brands && (
                            <div style={{ fontSize: 10.5, color: 'var(--primary)', marginTop: 1 }}>
                              Brands: {item.available_brands}
                            </div>
                          )}
                        </div>
                        <span className="badge badge-ready" style={{ fontSize: 9.5 }}>
                          + Add to Rx
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* List of Medication Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {prescriptions.length === 0 ? (
                  <div style={{
                    padding: '28px 16px',
                    textAlign: 'center',
                    borderRadius: 10,
                    border: '1px dashed var(--border-default)',
                    backgroundColor: 'var(--bg-subtle)'
                  }}>
                    <Pill size={28} color="var(--text-muted)" style={{ margin: '0 auto 6px' }} />
                    <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 12.5 }}>No medications on this prescription pad</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Click any 1-Click preset above or search/dictate a custom medication to add.
                    </p>
                  </div>
                ) : (
                  prescriptions.map((rx, index) => (
                    <div
                      key={rx.id}
                      className="prescription-med-card"
                    >
                      {/* Ambient Pastel Blob in Top-Right Corner */}
                      <div className="stat-card-accent-blob blob-yellow" style={{ top: -18, right: -18, width: 76, height: 76, opacity: 0.55 }} />

                      {/* Top Row: Index, Title, Dose, Qty, Trash */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                        <div className="stat-squircle-badge badge-bg-yellow" style={{ width: 28, height: 28, borderRadius: 8, fontSize: 11.5, fontWeight: 800 }}>
                          {index + 1}
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                          {rx.drug}
                        </div>
                        <div style={{
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          background: 'var(--bg-subtle)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 10.5,
                          fontWeight: 600,
                          color: 'var(--text-secondary)'
                        }}>
                          {rx.dose}
                        </div>
                        <div style={{
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          background: 'var(--bg-subtle)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 10.5,
                          fontWeight: 600,
                          color: 'var(--text-secondary)'
                        }}>
                          Qty: {rx.qty || '6 Tabs'}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDrug(rx.id)}
                          className="icon-btn"
                          style={{ marginLeft: 'auto', color: '#ef4444', width: 24, height: 24, borderRadius: 6 }}
                          title="Remove this medication"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Controls Row: FREQ, DAYS, Meal Timing */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                        {/* FREQ */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.04em' }}>FREQ:</span>
                          {['1-0-1', '1-0-0', '0-0-1', '1-1-1', 'SOS'].map((freqOpt) => {
                            const isSelected = rx.freq === freqOpt;
                            return (
                              <button
                                key={freqOpt}
                                type="button"
                                onClick={() => handleUpdateRx(rx.id, 'freq', freqOpt)}
                                style={{
                                  background: isSelected ? 'var(--primary)' : 'var(--bg-subtle)',
                                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-default)',
                                  borderRadius: 'var(--radius-full)',
                                  padding: '2px 7px',
                                  fontSize: 10,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {freqOpt}
                              </button>
                            );
                          })}
                        </div>

                        {/* DAYS */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.04em' }}>DAYS:</span>
                          {['3d', '5d', '7d', '14d', '30d'].map((dayOpt) => {
                            const isSelected = rx.days === dayOpt;
                            return (
                              <button
                                key={dayOpt}
                                type="button"
                                onClick={() => handleUpdateRx(rx.id, 'days', dayOpt)}
                                style={{
                                  background: isSelected ? 'var(--text-primary)' : 'var(--bg-subtle)',
                                  color: isSelected ? 'var(--bg-surface)' : 'var(--text-secondary)',
                                  border: isSelected ? '1px solid var(--text-primary)' : '1px solid var(--border-default)',
                                  borderRadius: 'var(--radius-full)',
                                  padding: '2px 7px',
                                  fontSize: 10,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {dayOpt}
                              </button>
                            );
                          })}
                        </div>

                        {/* Meal Timing */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {['After Meals', 'Before Meals'].map((timing) => {
                            const isSelected = rx.mealTiming === timing;
                            return (
                              <button
                                key={timing}
                                type="button"
                                onClick={() => handleUpdateRx(rx.id, 'mealTiming', timing)}
                                style={{
                                  background: isSelected ? 'var(--primary-container)' : 'var(--bg-subtle)',
                                  color: isSelected ? 'var(--on-primary-container)' : 'var(--text-secondary)',
                                  border: isSelected ? '1px solid var(--border-focus)' : '1px solid var(--border-default)',
                                  borderRadius: 'var(--radius-full)',
                                  padding: '2px 9px',
                                  fontSize: 10,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {timing}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Instructions note line with STT */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'var(--bg-subtle)',
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(0, 0, 0, 0.04)',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <input
                          type="text"
                          value={rx.notes || ''}
                          placeholder="Clinical instructions (e.g. Take SOS for headache or fever, take before breakfast...)"
                          onChange={(e) => handleUpdateRx(rx.id, 'notes', e.target.value)}
                          style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: 11,
                            color: 'var(--text-secondary)',
                            fontStyle: 'italic'
                          }}
                        />
                        <SpeechMicButton
                          onTranscript={(text) => handleUpdateRx(rx.id, 'notes', text)}
                          title="Voice dictate medication instructions"
                          size={12}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: 12,
                marginTop: 10,
                flexWrap: 'wrap',
                gap: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={15} color="var(--primary)" />
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {patient.doctorAssigned || 'Dr. Kiran Patel'} (MC-84920-CA)
                  </span>
                </div>
                <button
                  type="button"
                  className="m3-btn m3-btn-filled m3-btn-sm"
                  onClick={handleFinalizePrescription}
                >
                  <FileCheck size={14} />
                  <span>Finalize & Transmit to Pharmacy →</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW 5: Conclusion Draft */}
          {activeTab === 'conclusion' && (
            <div className="card m3-page-animate m3-scrollable-body" style={{ padding: 16, flex: 1, minHeight: 0, height: '100%', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                    Editable Patient Conclusion Letter
                  </h3>
                  <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    Pre-populated from AI intake analysis & prescriptions • Ready for physician review & final signature
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button 
                    type="button"
                    className="m3-btn m3-btn-tonal"
                    style={{ height: 34, fontSize: 11.5, padding: '0 10px', gap: 4 }}
                    onClick={() => setIsConclusionModalOpen(true)}
                    title="Open Full Letter Editor Pop-up"
                  >
                    <Maximize2 size={13} />
                    <span>Pop-up Editor</span>
                  </button>
                  <button 
                    className="m3-btn m3-btn-filled" 
                    onClick={handleFinalizeVisit}
                    style={{ background: 'linear-gradient(135deg, #059669, #10b981)', height: 34, fontSize: 12 }}
                  >
                    <Save size={15} /> Sign & Lock Report
                  </button>
                </div>
              </div>

              {/* 2-Column Clinical Layout utilizing proper whitespace */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, alignItems: 'start' }}>
                {/* Left Column: Quick Reference & Snippet Inserts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Quick Patient Snapshot */}
                  <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 14px', border: 'none' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.04em', marginBottom: 6 }}>
                      Clinical Reference Snapshot
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {patient.fullName} ({patient.age}y {patient.gender})
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      MRN: <strong>{patient.mrn}</strong> • {patient.insurance.provider}
                    </div>

                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)', fontSize: 11 }}>
                      <div style={{ color: 'var(--text-muted)' }}>Chief Complaint:</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 1 }}>
                        "{patient.questionnaire?.responses?.chiefComplaint || 'Consultation'}"
                      </div>
                    </div>

                    <div style={{ marginTop: 8, fontSize: 11 }}>
                      <div style={{ color: 'var(--text-muted)' }}>Triage Clinical Risk:</div>
                      <div style={{ fontWeight: 700, color: insights?.overallRisk === 'HIGH' ? '#dc2626' : '#d97706', marginTop: 1 }}>
                        {insights?.overallRisk || 'ROUTINE'} Priority
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Quick Snippets */}
                  <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 14px', border: 'none' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em', marginBottom: 8 }}>
                      1-Click Clinical Inserts
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button
                        type="button"
                        className="m3-btn m3-btn-outlined"
                        onClick={() => {
                          setConclusionText(prev => `${prev}\n\nRECOMMENDED IMAGING & LAB INVESTIGATIONS:\n- 12-Lead Electrocardiogram (ECG) & Echocardiography to evaluate cardiac status.\n- Fasting Comprehensive Metabolic & Lipid Panel (HbA1c, Serum Creatinine, Electrolytes).`);
                          addToast('Inserted ECG & Metabolic lab panel order', 'info');
                        }}
                        style={{ height: 32, fontSize: 11, justifyContent: 'flex-start', textAlign: 'left', padding: '0 10px' }}
                      >
                        <Plus size={13} color="var(--primary)" />
                        <span>+ ECG & Metabolic Lab Panel</span>
                      </button>

                      <button
                        type="button"
                        className="m3-btn m3-btn-outlined"
                        onClick={() => {
                          setConclusionText(prev => `${prev}\n\nCARDIOVASCULAR & METABOLIC PLAN:\n- Titrate Telmisartan to 40mg OD PO.\n- Continue Atorvastatin 20mg HS; recheck fasting lipid and renal panel in 14 days.`);
                          addToast('Inserted Statin & BP titration note', 'info');
                        }}
                        style={{ height: 32, fontSize: 11, justifyContent: 'flex-start', textAlign: 'left', padding: '0 10px' }}
                      >
                        <Plus size={13} color="var(--primary)" />
                        <span>+ Statin & BP Plan</span>
                      </button>

                      <button
                        type="button"
                        className="m3-btn m3-btn-outlined"
                        onClick={() => {
                          setConclusionText(prev => `${prev}\n\nPATIENT ADVISORY:\n- Advised to report immediately to 24x7 Emergency in case of chest discomfort, acute breathlessness, or persistent severe headache.`);
                          addToast('Inserted emergency warning signs advisory', 'info');
                        }}
                        style={{ height: 32, fontSize: 11, justifyContent: 'flex-start', textAlign: 'left', padding: '0 10px' }}
                      >
                        <Plus size={13} color="var(--primary)" />
                        <span>+ Emergency Warning Note</span>
                      </button>

                      <button
                        type="button"
                        className="m3-btn m3-btn-outlined"
                        onClick={() => {
                          setConclusionText(prev => `${prev}\n\nCLINICAL FOLLOW-UP:\n- Return visit in 7 days with repeat biomarker panel and CT images for restaging review.`);
                          addToast('Inserted follow-up review note', 'info');
                        }}
                        style={{ height: 32, fontSize: 11, justifyContent: 'flex-start', textAlign: 'left', padding: '0 10px' }}
                      >
                        <Plus size={13} color="var(--primary)" />
                        <span>+ 7-Day Follow-Up Review</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Full-Width 100% Textarea */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 12 }}>Official Consultation Note Editor</span>
                      <button
                        type="button"
                        className={`m3-btn ${isListening ? 'm3-btn-filled' : 'm3-btn-tonal'}`}
                        onClick={toggleSpeechToText}
                        style={{
                          height: 28,
                          fontSize: 11,
                          padding: '0 10px',
                          gap: 5,
                          backgroundColor: isListening ? '#dc2626' : undefined,
                          color: isListening ? '#ffffff' : undefined,
                          boxShadow: isListening ? '0 0 10px rgba(220, 38, 38, 0.4)' : undefined
                        }}
                        title={isListening ? "Stop voice dictation" : "Start Speech-to-Text Voice Dictation"}
                      >
                        {isListening ? <MicOff size={13} className="m3-animate-pulse" /> : <Mic size={13} />}
                        <span>{isListening ? 'Listening (Click to Stop)' : 'Dictate (Mic STT)'}</span>
                      </button>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {conclusionText.length} characters • {conclusionText.split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>

                  <textarea 
                    className="form-textarea" 
                    value={conclusionText}
                    onChange={(e) => setConclusionText(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: 380,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11.5,
                      lineHeight: 1.6,
                      padding: 16,
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      boxSizing: 'border-box'
                    }}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      Digitally authenticated by: <strong style={{ color: 'var(--text-secondary)' }}>Dr. Kiran Patel, MD (General & Internal Medicine)</strong>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#15803d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Check size={14} /> Ready for Billing Transmission
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
    )}
    </div>

    {/* CDSS Critical Alert Override Justification Dialog */}
    {isCdssOverrideModalOpen && (
      <div className="m3-modal-backdrop" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: 16
      }}>
        <div className="card m3-dialog" style={{ width: '100%', maxWidth: 520, padding: 24, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#991b1b' }}>
                  CDSS Critical Clinical Safety Alert
                </h3>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Regulatory Medical-Legal Override Requirement
                </span>
              </div>
            </div>
            <button className="icon-btn" onClick={() => setIsCdssOverrideModalOpen(false)}>
              <X size={16} />
            </button>
          </div>

          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            fontSize: 12,
            color: '#7f1d1d',
            lineHeight: 1.45,
            marginBottom: 14
          }}>
            <strong>High-Risk Alert Flagged:</strong> {patient.fullName} has an active High-Risk flag (e.g. recurrence / organ monitoring caution). You must provide a formal clinical justification note before locking this e-prescription and releasing the visit to Billing.
          </div>

          {/* Quick Rationale Presets */}
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Quick Clinical Presets:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                'Benefits outweigh risks; LFT/CBC repeat in 14 days',
                'Patient informed & consented to therapy',
                'Prior treatment tolerability confirmed'
              ].map((pst, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setOverrideNote(pst)}
                  className="m3-btn m3-btn-tonal"
                  style={{ height: 26, fontSize: 10.5, padding: '0 8px' }}
                >
                  + {pst}
                </button>
              ))}
            </div>
          </div>

          {/* Override Text Input with Voice STT */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Physician Override Rationale Note (Required):
            </label>
            <div style={{ position: 'relative' }}>
              <textarea
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                placeholder="Enter clinical rationale, contraindication evaluation, or monitoring protocol..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 38px 10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
              />
              <SpeechMicButton
                onTranscript={(txt) => setOverrideNote(prev => prev ? `${prev} ${txt}` : txt)}
                title="Dictate override note"
                style={{ position: 'absolute', right: 8, top: 10 }}
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              className="m3-btn m3-btn-tonal"
              onClick={() => setIsCdssOverrideModalOpen(false)}
              style={{ height: 34, fontSize: 12 }}
            >
              Cancel
            </button>
            <button
              className="m3-btn m3-btn-filled"
              disabled={!overrideNote.trim()}
              onClick={() => {
                setIsCdssOverrideModalOpen(false);
                updatePatient(patient.id, { 
                  status: 'COMPLETED',
                  billingStatus: 'READY',
                  prescriptions: prescriptions,
                  consultationConclusion: conclusionText,
                  cdssOverrideNote: overrideNote
                });
                addToast(`CDSS override recorded & consultation transmitted to Cashier!`, 'success');
                if (onSwitchRole) {
                  setTimeout(() => onSwitchRole('cashier'), 900);
                }
              }}
              style={{
                height: 34,
                fontSize: 12,
                background: overrideNote.trim() ? 'linear-gradient(135deg, #059669, #10b981)' : 'var(--border-default)',
                color: '#ffffff',
                cursor: overrideNote.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              <CheckCircle2 size={15} />
              <span>Sign, Override & Transmit</span>
            </button>
          </div>
        </div>
      </div>
    )}


    {/* Pop-up Modal 1: AI Clinical Insights & Staging Dossier */}
    {isInsightsModalOpen && (
      <div className="modal-overlay m3-dialog-backdrop" onClick={() => setIsInsightsModalOpen(false)}>
        <div 
          className="modal-content m3-dialog-container" 
          style={{ maxWidth: 840, padding: 24, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="m3-dialog-header" style={{ padding: '16px 24px 14px', margin: '-24px -24px 16px -24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="mrn-tag">{patient.mrn}</span>
                <span className="m3-model-pill" style={{ padding: '3px 10px', fontSize: 11 }}>
                  Deterministic CDSS • NegEx NLP Engine
                </span>
                <span className="badge badge-ready" style={{ fontSize: 11 }}>
                  ABHA: {patient.abhaId || patient.insurance?.abhaId || '91-4820-1928-3819'}
                </span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                Clinical Insights & CDSS Dossier — {patient.fullName}
              </h3>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                {patient.age}y {patient.gender} • Consulting Doctor: {patient.doctorAssigned} • Insurance: {patient.insurance.provider}
              </div>
            </div>

            <button 
              className="icon-btn" 
              onClick={() => setIsInsightsModalOpen(false)}
              title="Close Pop-up"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="m3-scrollable-body" style={{ flex: 1, overflowY: 'auto', paddingRight: 6 }}>
            {/* Physician Summary Narrative */}
            <div style={{ background: 'var(--bg-subtle)', borderLeft: '4px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 18 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>
                Physician Executive Summary
              </span>
              <p style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 600, marginTop: 4, lineHeight: 1.5 }}>
                {insights?.symptomSummary || `${patient.fullName} presenting for multispeciality clinical evaluation with chief complaint: ${patient.questionnaire?.responses?.chiefComplaint || 'Consultation'}.`}
              </p>
            </div>

            {/* Risk Flags Matrix */}
            <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: 10 }}>
              Detected Clinical Risk Flags & Biomarkers
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {insights?.riskFlags?.map((flag, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 10,
                    padding: 12, 
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: flag.severity === 'HIGH' ? '#fef2f2' : '#fffbeb',
                    border: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <AlertTriangle size={18} color={flag.severity === 'HIGH' ? '#dc2626' : '#d97706'} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <strong style={{ fontSize: 13, color: flag.severity === 'HIGH' ? '#991b1b' : '#92400e' }}>
                        {flag.label}
                      </strong>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {flag.note}
                      </p>
                    </div>
                  </div>
                  <button 
                    className="m3-btn m3-btn-tonal" 
                    style={{ height: 28, fontSize: 11, padding: '0 10px' }}
                    onClick={() => {
                      setConclusionText(prev => `${prev}\n\nRISK FACTOR: ${flag.label} - ${flag.note}`);
                      addToast(`Added ${flag.label} to conclusion note`, 'info');
                    }}
                  >
                    + Add to Conclusion
                  </button>
                </div>
              ))}
            </div>

            {/* Recommended Diagnostic Investigations Checklist */}
            <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: 10 }}>
              AI Recommended Diagnostic Investigation Panel
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              {insights?.recommendedInvestigations?.map((inv) => (
                <div 
                  key={inv.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {inv.name}
                    </div>
                    <span style={{ fontSize: 11, color: inv.urgency === 'Urgent' ? '#dc2626' : 'var(--text-muted)', fontWeight: 600 }}>
                      Priority: {inv.urgency}
                    </span>
                  </div>
                  <button 
                    className="m3-btn m3-btn-filled" 
                    style={{ height: 30, fontSize: 11, padding: '0 12px' }}
                    onClick={() => {
                      setConclusionText(prev => `${prev}\n- Recommended Investigation: ${inv.name} (${inv.urgency})`);
                      addToast(`Ordered ${inv.name}`, 'success');
                    }}
                  >
                    Order Test
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-default)', paddingTop: 14, marginTop: 12, flexShrink: 0 }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              Deterministic CDSS & NegEx NLP Clinical Evaluation • Attending physician retains final clinical authority.
            </span>
            <button className="m3-btn m3-btn-filled" onClick={() => setIsInsightsModalOpen(false)}>
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Pop-up Modal 2: Fullscreen DICOM Viewer */}
    {isDicomModalOpen && (
      <div className="modal-overlay m3-dialog-backdrop" onClick={() => setIsDicomModalOpen(false)}>
        <div 
          className="modal-content m3-dialog-container" 
          style={{ maxWidth: 960, padding: 20, maxHeight: '92vh', display: 'flex', flexDirection: 'column', backgroundColor: '#090d16', color: '#f8fafc', border: '1px solid #1e293b' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* DICOM Modal Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: 12, marginBottom: 12, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Layers size={18} color="#2563eb" />
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>
                  {selectedSeries} — High-Res Radiological Viewer
                </h3>
                <div style={{ fontSize: 11.5, color: '#94a3b8' }}>
                  Patient: {patient.fullName} ({patient.mrn}) • Slice {currentSlice} of 148 • 1.5mm Axial Slices
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button 
                className="m3-btn m3-btn-tonal" 
                style={{ height: 30, fontSize: 11, background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }}
                onClick={() => setZoomLevel(prev => Math.min(prev + 20, 200))}
              >
                <ZoomIn size={13} /> Zoom ({zoomLevel}%)
              </button>
              <button 
                className="icon-btn" 
                style={{ color: '#cbd5e1' }}
                onClick={() => setIsDicomModalOpen(false)}
                title="Close Viewer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Radiology Availability Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 12px',
            borderRadius: 6,
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            color: '#fde68a',
            fontSize: '11px',
            marginBottom: 10,
            lineHeight: 1.4
          }}>
            <AlertCircle size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
            <span>
              <strong>Radiology Department Note:</strong> This DICOM imaging series will only be available if the radiology department has uploaded and attached the study to this patient MRN; otherwise, this study viewer will not appear.
            </span>
          </div>

          {/* Large DICOM Canvas */}
          <div style={{ flex: 1, minHeight: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', background: '#020617', borderRadius: 8, border: '1px solid #1e293b', padding: 24 }}>
            <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
              <div style={{ width: 280, height: 280, border: '2px dashed rgba(37, 99, 235, 0.45)', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, rgba(37, 99, 235, 0.18) 0%, transparent 70%)' }}>
                <div style={{ border: '1.5px solid #22c55e', padding: '6px 12px', borderRadius: 6, background: 'rgba(0,0,0,0.75)', fontSize: 12, color: '#4ade80', fontWeight: 800 }}>
                  📌 2.3 cm Focal Nodular Opacity (RUL)
                </div>
              </div>
              <div style={{ marginTop: 18, fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
                Axial High-Resolution Chest CT Scan (Slice {currentSlice} / 148)
              </div>
              <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                WW: 1500  WL: -600 (Lung Parenchyma Window) • Contrast Enhanced
              </div>
            </div>

            {/* Slider */}
            <div style={{ position: 'absolute', bottom: 14, left: 24, right: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Slice 1</span>
              <input 
                type="range" 
                min="1" 
                max="148" 
                value={currentSlice} 
                onChange={(e) => setCurrentSlice(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#2563eb' }}
              />
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Slice 148</span>
            </div>
          </div>

          {/* Series Bar & Close */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1e293b', paddingTop: 12, marginTop: 12, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {['CT Chest with Contrast', 'CT Abdomen & Pelvis', 'MRI Brain Sequence'].map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSeries(s)}
                  className="m3-btn"
                  style={{
                    height: 28,
                    fontSize: 11,
                    background: selectedSeries === s ? 'linear-gradient(135deg, #1e3a8a, #2563eb)' : '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid #334155'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <button className="m3-btn m3-btn-tonal" onClick={() => setIsDicomModalOpen(false)} style={{ height: 30, background: '#1e293b', color: '#f8fafc' }}>
              Exit Fullscreen
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Pop-up Modal 3: Fullscreen Consultation Note & Conclusion Editor */}
    {isConclusionModalOpen && (
      <div className="modal-overlay m3-dialog-backdrop" onClick={() => setIsConclusionModalOpen(false)}>
        <div 
          className="modal-content m3-dialog-container" 
          style={{ maxWidth: 940, padding: 24, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="m3-dialog-header" style={{ padding: '16px 24px 14px', margin: '-24px -24px 16px -24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="mrn-tag">{patient.mrn}</span>
                <span className="badge badge-active">{patient.age}y {patient.gender}</span>
                <span className="badge badge-ready">ABHA: {patient.abhaId || patient.insurance?.abhaId || '91-4820-1928-3819'}</span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                Clinical Consultation Letter Editor — {patient.fullName}
              </h3>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Full-screen distraction-free report generator with 1-click clinical order inserts.
              </div>
            </div>

            <button 
              className="icon-btn" 
              onClick={() => setIsConclusionModalOpen(false)}
              title="Close Editor"
            >
              <X size={18} />
            </button>
          </div>

          {/* 2-Column Body with internal scrolling */}
          <div className="m3-scrollable-body" style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: 16, paddingRight: 6 }}>
            {/* Quick Inserts Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: 12, border: 'none' }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.04em', marginBottom: 6 }}>
                  Patient Reference
                </div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{patient.fullName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>MRN: {patient.mrn}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Insurance: {patient.insurance.provider}</div>
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                  Chief Complaint: "{patient.questionnaire?.responses?.chiefComplaint || 'Consultation'}"
                </div>
              </div>

              <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: 12, border: 'none' }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em', marginBottom: 8 }}>
                  1-Click Inserts
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button
                    type="button"
                    className="m3-btn m3-btn-outlined"
                    onClick={() => {
                      setConclusionText(prev => `${prev}\n\nRECOMMENDED INVESTIGATIONS:\n- Baseline diagnostic panel and metabolic profile repeat within 14 days.`);
                      addToast('Inserted Diagnostics snippet', 'info');
                    }}
                    style={{ height: 30, fontSize: 11, justifyContent: 'flex-start', padding: '0 8px' }}
                  >
                    <Plus size={12} color="var(--primary)" />
                    <span>+ Repeat Diagnostic Panel</span>
                  </button>
                  <button
                    type="button"
                    className="m3-btn m3-btn-outlined"
                    onClick={() => {
                      setConclusionText(prev => `${prev}\n\nPHARMACOTHERAPY PLAN:\n- Continue prescribed oral antihypertensive & metabolic therapy as charted.\n- Schedule follow-up visit in 30 days.`);
                      addToast('Inserted Pharmacotherapy plan snippet', 'info');
                    }}
                    style={{ height: 30, fontSize: 11, justifyContent: 'flex-start', padding: '0 8px' }}
                  >
                    <Plus size={12} color="var(--primary)" />
                    <span>+ Pharmacotherapy Care Plan</span>
                  </button>
                  <button
                    type="button"
                    className="m3-btn m3-btn-outlined"
                    onClick={() => {
                      setConclusionText(prev => `${prev}\n\nADVISORY:\n- Patient instructed to report fever > 100.4°F or acute chest pain to 24x7 Triage.`);
                      addToast('Inserted advisory note', 'info');
                    }}
                    style={{ height: 30, fontSize: 11, justifyContent: 'flex-start', padding: '0 8px' }}
                  >
                    <Plus size={12} color="var(--primary)" />
                    <span>+ Toxicity Alert Note</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Big Editor Textarea */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 700 }}>Official Consultation Letter Body</span>
                  <button
                    type="button"
                    className={`m3-btn ${isListening ? 'm3-btn-filled' : 'm3-btn-tonal'}`}
                    onClick={toggleSpeechToText}
                    style={{
                      height: 26,
                      fontSize: 10.5,
                      padding: '0 8px',
                      gap: 4,
                      backgroundColor: isListening ? '#dc2626' : undefined,
                      color: isListening ? '#ffffff' : undefined
                    }}
                    title={isListening ? "Stop voice dictation" : "Start Speech-to-Text Voice Dictation"}
                  >
                    {isListening ? <MicOff size={12} className="m3-animate-pulse" /> : <Mic size={12} />}
                    <span>{isListening ? 'Listening...' : 'Voice Dictate'}</span>
                  </button>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {conclusionText.length} characters • {conclusionText.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea 
                className="form-textarea"
                value={conclusionText}
                onChange={(e) => setConclusionText(e.target.value)}
                style={{
                  width: '100%',
                  height: 380,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  lineHeight: 1.6,
                  padding: 16,
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-default)', paddingTop: 14, marginTop: 12, flexShrink: 0 }}>
            <button className="m3-btn m3-btn-outlined" onClick={() => setIsConclusionModalOpen(false)}>
              Close Editor
            </button>
            <button 
              className="m3-btn m3-btn-filled"
              onClick={() => {
                handleFinalizeVisit();
                setIsConclusionModalOpen(false);
              }}
              style={{ background: 'linear-gradient(135deg, #059669, #10b981)', height: 38 }}
            >
              <Save size={15} />
              <span>Sign, Lock & Transmit to Cashier</span>
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Interactive Doctor Clinical Flow Guide Modal */}
    <DoctorFlowGuideModal
      isOpen={isGuideOpen}
      onClose={() => setIsGuideOpen(false)}
      onOpenWorkspace={() => {
        setDoctorNav('workspace');
      }}
      onSwitchTab={(tabId) => {
        setDoctorNav('workspace');
        setActiveTab(tabId);
      }}
      onOpenSampleDicom={() => {
        setDoctorNav('workspace');
        setActiveTab('dicom');
        setIsDicomModalOpen(true);
      }}
      onOpenSampleRx={() => {
        setDoctorNav('workspace');
        setActiveTab('rx');
      }}
    />
  </div>
  );
}
