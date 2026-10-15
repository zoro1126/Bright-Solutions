import React, { useState, useMemo } from 'react';
import { usePatients } from '../context/PatientContext';
import { 
  Users, 
  AlertTriangle, 
  Pill, 
  Layers, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Activity, 
  Dna, 
  HeartPulse, 
  ChevronRight, 
  FlaskConical, 
  Stethoscope, 
  Calendar, 
  ShieldAlert,
  FileText,
  TrendingUp,
  AlertCircle,
  X,
  Play,
  Pause,
  RotateCcw,
  Check,
  Copy,
  Trash2,
  Search,
  ExternalLink,
  Sliders,
  ChevronDown,
  ChevronUp,
  Eye,
  Plus
} from 'lucide-react';
import SpeechMicButton from './SpeechMicButton';
import DoctorAnalyticsHub from './DoctorAnalyticsHub';

export default function DoctorDashboard({ onOpenWorkspace, onSwitchToReception, onOpenGuide }) {
  const { patients, selectedPatientId, setSelectedPatientId, stats, addToast } = usePatients();

  // State: Patient Schedule Filtering & Search
  const [scheduleFilter, setScheduleFilter] = useState('ALL'); // 'ALL' | 'READY' | 'IN_ROOM' | 'COMPLETED'
  const [searchQuery, setSearchQuery] = useState('');

  // State: Case Mix & Biomarkers Interactive Selection
  const [selectedCaseMix, setSelectedCaseMix] = useState(null);
  const [selectedBiomarker, setSelectedBiomarker] = useState(null);

  // State: Daycare & Observation Ward Active Beds
  const [infusions, setInfusions] = useState([]);

  // State: Modals & Flowsheets
  const [selectedChair, setSelectedChair] = useState(null); // Chair object for Flowsheet modal
  const [activeAlertModal, setActiveAlertModal] = useState(null); // Alert object for Sentinel Action modal
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState(false);
  const [isAllAlertsModalOpen, setIsAllAlertsModalOpen] = useState(false);

  // State: Sentinel AI Alerts
  const [sentinelAlerts, setSentinelAlerts] = useState([]);

  // State: Shift Voice Memos
  const [quickNote, setQuickNote] = useState('');
  const [savedMemos, setSavedMemos] = useState([]);

  // General Hospital Case Mix Breakdown — Multispeciality OPD
  const caseMix = [
    { 
      id: 'cardio', 
      site: 'Cardiovascular & Essential Hypertension', 
      shortSite: 'Cardiology', 
      count: 2, 
      percent: 40, 
      color: '#1e3a8a', // Royal Navy Blue
      stage: 'Stage 1 - 2 HTN',
      stages: [
        { label: 'Mild', pct: 25 },
        { label: 'Stage 1', pct: 45 },
        { label: 'Stage 2', pct: 20 },
        { label: 'Severe', pct: 10 }
      ],
      protocols: ['Telmisartan 40mg + Amlodipine 5mg', 'Atorvastatin 20mg HS', 'Lifestyle & DASH Diet'],
      patientsMatched: ['Ananya Sharma']
    },
    { 
      id: 'diabetes', 
      site: 'Type 2 Diabetes & Metabolic Disorders', 
      shortSite: 'Diabetology', 
      count: 1, 
      percent: 25, 
      color: '#2563eb', // Royal Cobalt Blue
      stage: 'Moderate Glycemic Risk',
      stages: [
        { label: 'Pre-DM', pct: 20 },
        { label: 'Well-Controlled', pct: 35 },
        { label: 'Uncontrolled', pct: 30 },
        { label: 'Complicated', pct: 15 }
      ],
      protocols: ['Metformin 1000mg + Glimepiride 2mg', 'Dapagliflozin 10mg OD', 'Basal Insulin Glargine'],
      patientsMatched: ['Rajan Pillai']
    },
    { 
      id: 'pulmo', 
      site: 'Pulmonology & Bronchial Asthma / COPD', 
      shortSite: 'Pulmonology', 
      count: 1, 
      percent: 20, 
      color: '#1d4ed8', // Deep Royal Blue
      stage: 'Asthma-COPD Overlap',
      stages: [
        { label: 'Intermittent', pct: 25 },
        { label: 'Mild Persist', pct: 35 },
        { label: 'Moderate', pct: 25 },
        { label: 'Severe', pct: 15 }
      ],
      protocols: ['Budesonide + Formoterol 400mcg', 'Montelukast 10mg + Levocetirizine', 'SOS Levosalbutamol Inhaler'],
      patientsMatched: ['Devendra Kapoor']
    },
    { 
      id: 'gastro', 
      site: 'Gastroenterology & General Surgery', 
      shortSite: 'General Surgery', 
      count: 1, 
      percent: 15, 
      color: '#0f172a', // Midnight Navy
      stage: 'Post-Cholecystectomy',
      stages: [
        { label: 'Pre-Op', pct: 30 },
        { label: 'Acute Colic', pct: 30 },
        { label: 'Post-Op Day 1', pct: 20 },
        { label: 'Recovered', pct: 20 }
      ],
      protocols: ['Elective Laparoscopic Cholecystectomy', 'Pantoprazole 40mg IV/Oral', 'Post-Op Low-Fat Regimen'],
      patientsMatched: ['Sunita Rao', 'Meera Nair']
    },
  ];

  // Clinical Biomarkers & Panels List
  const biomarkers = [
    { id: 'er_pr', label: 'HbA1c & Fasting Glucose', prevalence: '50%', color: '#1e3a8a', bg: '#dbeafe', border: '#93c5fd', drug: 'Metformin + SGLT2i Protocol' },
    { id: 'her2', label: 'Cardiac Troponin & BNP', prevalence: '25%', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', drug: 'Cardioprotective Therapy' },
    { id: 'tnbc', label: 'Lipid Profile (LDL/HDL)', prevalence: '15%', color: '#0f172a', bg: '#dbeafe', border: '#93c5fd', drug: 'Atorvastatin 20mg Statin' },
    { id: 'egfr', label: 'Renal Panel (eGFR/KFT)', prevalence: '10%', color: '#10b981', bg: '#dcfce7', border: '#86efac', drug: 'Nephroprotective Regimen' }
  ];

  // Diagnostic Studies Mock Data
  const pendingDiagnostics = [
    {
      id: 'diag-1',
      title: '12-Lead Electrocardiogram (ECG) & 2D Doppler Echo',
      patient: 'Ananya Sharma',
      mrn: 'MRN-2026-0142',
      patientId: 'pat-001',
      modality: 'ECG / Echo',
      facility: 'Non-Invasive Cardiology Suite',
      status: 'Ready for Review',
      urgency: 'HIGH',
      summary: 'Evaluation of left ventricular hypertrophy (LVH) in chronic Stage 2 hypertension. Normal EF 62%.'
    },
    {
      id: 'diag-2',
      title: 'Digital High-Resolution Chest Radiograph (PA & Lateral)',
      patient: 'Devendra Kapoor',
      mrn: 'MRN-2026-0145',
      patientId: 'pat-004',
      modality: 'Digital X-Ray',
      facility: 'Radiology Imaging Station 01',
      status: 'Ready for Review',
      urgency: 'HIGH',
      summary: 'Bilateral hyperinflated lung fields consistent with obstructive airway disease. No focal consolidation.'
    },
    {
      id: 'diag-3',
      title: 'Whole Abdomen Ultrasound (Hepatobiliary & Renal)',
      patient: 'Rajan Pillai',
      mrn: 'MRN-2026-0143',
      patientId: 'pat-002',
      modality: 'Ultrasound',
      facility: 'Ultrasonography Dept 03',
      status: 'Prelim Available',
      urgency: 'ROUTINE',
      summary: 'Grade 1 fatty liver changes with bilateral normal kidney corticomedullary differentiation.'
    }
  ];

  // Filtered Patients for Schedule
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      // Status Filter
      if (scheduleFilter === 'READY' && p.status !== 'INSIGHTS_READY') return false;
      if (scheduleFilter === 'IN_ROOM' && p.status !== 'IN_CONSULTATION') return false;
      if (scheduleFilter === 'COMPLETED' && p.status !== 'COMPLETED') return false;

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pName = (p.fullName || p.full_name || '').toLowerCase();
        const pMrn = (p.mrn || p.uhid || '').toLowerCase();
        const pGender = (p.gender || '').toLowerCase();
        const matchesComplaint = p.questionnaire?.responses?.chiefComplaint?.toLowerCase().includes(q) || (p.chief_complaint || '').toLowerCase().includes(q);
        if (!pName.includes(q) && !pMrn.includes(q) && !pGender.includes(q) && !matchesComplaint) return false;
      }

      return true;
    });
  }, [patients, scheduleFilter, searchQuery, selectedBiomarker]);

  // Handler: Save Quick Shift Memo
  const handleSaveMemo = () => {
    if (!quickNote.trim()) {
      addToast('Please type or dictate a note before saving.', 'info');
      return;
    }
    const newMemo = {
      id: `memo-${Date.now()}`,
      text: quickNote.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setSavedMemos(prev => [newMemo, ...prev]);
    setQuickNote('');
    addToast('Physician shift memo saved.', 'success');
  };

  // Handler: Delete Memo
  const handleDeleteMemo = (id) => {
    setSavedMemos(prev => prev.filter(m => m.id !== id));
    addToast('Memo deleted.', 'info');
  };

  // Handler: Copy Memo
  const handleCopyMemo = (text) => {
    navigator.clipboard.writeText(text);
    addToast('Memo copied to clipboard.', 'success');
  };

  // Handler: Transfer Memo to Consultation
  const handleTransferMemo = (text) => {
    addToast(`Memo transferred into Ananya Sharma's active consultation draft.`, 'success');
  };

  // Handler: Toggle Infusion Pump
  const handleTogglePump = (chairId) => {
    setInfusions(prev => prev.map(c => {
      if (c.id !== chairId) return c;
      const willPause = !c.isPaused;
      addToast(willPause ? `${c.chair} (${c.patient}) pump paused.` : `${c.chair} (${c.patient}) pump resumed at ${c.flowRateMlHr} ml/hr.`, willPause ? 'info' : 'success');
      return {
        ...c,
        isPaused: willPause,
        status: willPause ? 'Paused' : 'Infusing'
      };
    }));
    if (selectedChair && selectedChair.id === chairId) {
      setSelectedChair(prev => prev ? { ...prev, isPaused: !prev.isPaused, status: !prev.isPaused ? 'Paused' : 'Infusing' } : null);
    }
  };

  // Handler: Titrate Rate
  const handleTitrateRate = (chairId, delta) => {
    setInfusions(prev => prev.map(c => {
      if (c.id !== chairId) return c;
      const newRate = Math.max(20, Math.min(300, c.flowRateMlHr + delta));
      addToast(`${c.chair} infusion rate adjusted to ${newRate} ml/hr.`, 'info');
      return { ...c, flowRateMlHr: newRate };
    }));
    if (selectedChair && selectedChair.id === chairId) {
      setSelectedChair(prev => prev ? { ...prev, flowRateMlHr: Math.max(20, Math.min(300, prev.flowRateMlHr + delta)) } : null);
    }
  };

  // Handler: Record Vitals
  const handleRecordVitals = (chairId) => {
    const sampleVitals = [
      { bp: '124/78', hr: 72, spo2: 99, temp: '98.4°F' },
      { bp: '128/82', hr: 76, spo2: 100, temp: '98.6°F' },
      { bp: '122/80', hr: 70, spo2: 98, temp: '98.3°F' }
    ];
    const picked = sampleVitals[Math.floor(Math.random() * sampleVitals.length)];
    setInfusions(prev => prev.map(c => {
      if (c.id !== chairId) return c;
      addToast(`Updated vitals recorded for ${c.patient}: BP ${picked.bp}, HR ${picked.hr} bpm.`, 'success');
      return { ...c, vitals: picked };
    }));
    if (selectedChair && selectedChair.id === chairId) {
      setSelectedChair(prev => prev ? { ...prev, vitals: picked } : null);
    }
  };

  // Handler: Complete Infusion
  const handleCompleteInfusion = (chairId) => {
    setInfusions(prev => prev.map(c => {
      if (c.id !== chairId) return c;
      addToast(`Infusion completed and discharge authorized for ${c.patient}. Daycare flow signed off.`, 'success');
      return { ...c, status: 'Completed & Signed', elapsedMinutes: c.totalMinutes };
    }));
    if (selectedChair && selectedChair.id === chairId) {
      setSelectedChair(prev => prev ? { ...prev, status: 'Completed & Signed', elapsedMinutes: prev.totalMinutes } : null);
    }
  };

  // Handler: Acknowledge Alert
  const handleAcknowledgeAlert = (alertId) => {
    setSentinelAlerts(prev => prev.filter(a => a.id !== alertId));
    setActiveAlertModal(null);
    addToast('Sentinel alert acknowledged and archived.', 'success');
  };

  return (
    <div className="page-container doctor-dashboard-container m3-page-animate" style={{ maxWidth: '100%', width: '100%', margin: '0', boxSizing: 'border-box' }}>
      
      {/* =========================================================================
          Top Welcome & Shift Banner - Reception Stat-Card Standard
          ========================================================================= */}
      <div className="m3-doctor-patient-banner" style={{ padding: '12px 18px', border: '1.5px solid var(--doc-banner-border, #bfdbfe)', background: 'var(--doc-banner-bg, linear-gradient(135deg, #ffffff 0%, #eff6ff 100%))', flexShrink: 0 }}>
        <div className="stat-card-accent-blob" style={{ top: -20, right: -20, width: 110, height: 110, opacity: 0.65, background: 'radial-gradient(circle, var(--doc-accent-color, #2563eb) 0%, rgba(37, 99, 235, 0) 70%)' }} />
        
        <div className="m3-patient-banner-info" style={{ position: 'relative', zIndex: 1 }}>
          <div className="stat-squircle-badge" style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--doc-brand-gradient, linear-gradient(135deg, #0f172a, #1e3a8a))', color: '#ffffff', boxShadow: 'var(--doc-brand-shadow, 0 4px 10px rgba(30, 58, 138, 0.35))' }}>
            <Stethoscope size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--doc-banner-title, #0f172a)', letterSpacing: '-0.02em', margin: 0 }}>
                Dr. Kiran Patel, MD
              </h2>
              <span className="brand-counter-pill" style={{ textTransform: 'none', fontSize: 10, background: 'var(--doc-pill-bg, #CAF0F8)', color: 'var(--doc-pill-color, #0077B6)', border: '1px solid var(--doc-pill-border, #90E0EF)', fontWeight: 700 }}>
                Senior Consultant Physician
              </span>
              <span style={{ fontSize: 11, color: 'var(--doc-accent-color, #0077B6)', fontWeight: 600 }}>• OPD Suite 03 • General & Internal Medicine</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2, fontWeight: 500 }}>
              General Medicine & Multispeciality Care Stream • <strong>{patients.length} Consultations Booked</strong> • <strong style={{ color: 'var(--doc-accent-color, #0077B6)' }}>{sentinelAlerts.length} Sentinel AI Warnings</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          {onOpenGuide && (
            <button
              type="button"
              onClick={onOpenGuide}
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
          )}

          <button 
            className="m3-btn"
            onClick={onSwitchToReception}
            title="Switch to Reception Desk"
            style={{ height: 32, fontSize: 11.5, padding: '0 12px', background: '#edf8fc', color: '#0077B6', border: '1px solid #bfe7f5', fontWeight: 700 }}
          >
            ← Reception Desk
          </button>
          <button 
            className="m3-btn"
            onClick={() => onOpenWorkspace(selectedPatientId || 'pat-001', 'insights')}
            title="Open Station 03 Clinical Consultation Workspace"
            style={{ height: 32, fontSize: 11.5, padding: '0 12px', gap: 5, background: 'var(--doc-pill-bg, #CAF0F8)', color: 'var(--doc-pill-color, #0077B6)', border: '1px solid var(--doc-pill-border, #90E0EF)', fontWeight: 700 }}
          >
            <Stethoscope size={14} />
            <span>Clinical Workspace →</span>
          </button>
          {patients.length > 0 && (
            <button 
              className="m3-btn anim-hover-lift"
              onClick={() => onOpenWorkspace(patients[0].id, 'insights')}
              style={{ 
                background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', 
                color: '#ffffff', 
                height: 34, 
                fontSize: 12, 
                padding: '0 16px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 4px 10px rgba(15, 23, 42, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <span>Call Next: {patients[0].fullName || patients[0].full_name}</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          4 Top Stat Cards Row — Sovereign Midnight Navy & Royal Cobalt Palette
          ========================================================================= */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 4, flexShrink: 0 }}>
        
        {/* Card 1: Today's OPD Consults — Sovereign Midnight Navy */}
        <div 
          className="stat-card anim-hover-lift doc-glass-shimmer" 
          style={{ cursor: 'pointer' }} 
          onClick={() => {
            setScheduleFilter('ALL');
            addToast('Viewing all scheduled general hospital patients.', 'info');
          }}
          title="Click to view all scheduled patients"
        >
          <div className="stat-card-accent-blob" style={{ background: 'radial-gradient(circle, #CAF0F8 0%, rgba(202, 240, 248, 0) 70%)' }} />
          <div className="stat-squircle-badge" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', color: '#ffffff', boxShadow: '0 4px 10px rgba(30, 58, 138, 0.35)' }}>
            <Users size={16} strokeWidth={2.4} />
          </div>
          <div className="stat-card-value" style={{ color: 'var(--doc-banner-title, #0f172a)' }}>{patients.length}</div>
          <div className="stat-card-label">Scheduled Patients</div>
          <div style={{ fontSize: 10.5, color: 'var(--doc-accent-color, #0077B6)', marginTop: 4, fontWeight: 700 }}>
            3 AI Ready • 1 In Consultation
          </div>
        </div>

        {/* Card 2: AI Risk Alerts — Alert Crimson (#dc2626 & #b91c1c) */}
        <div 
          className="stat-card anim-hover-lift doc-glass-shimmer" 
          style={{ cursor: 'pointer' }}
          onClick={() => setIsAllAlertsModalOpen(true)}
          title="Click to review all active sentinel AI warnings"
        >
          <div className="stat-card-accent-blob" style={{ background: 'radial-gradient(circle, #fecaca 0%, rgba(254, 202, 202, 0) 70%)' }} />
          <div className="stat-squircle-badge" style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#ffffff', boxShadow: '0 4px 10px rgba(220, 38, 38, 0.35)' }}>
            <AlertTriangle size={16} strokeWidth={2.4} />
          </div>
          <div className="stat-card-value" style={{ color: '#b91c1c' }}>{sentinelAlerts.length}</div>
          <div className="stat-card-label">Critical Sentinel Alerts</div>
          <div style={{ fontSize: 10.5, color: '#dc2626', marginTop: 4, fontWeight: 700 }}>
            Hypertension & Airway Watch
          </div>
        </div>

        {/* Card 3: Active Daycare / Observation Beds — Teal / Turquoise Palette */}
        <div 
          className="stat-card anim-hover-lift doc-glass-shimmer"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setSelectedChair(infusions[0]);
            addToast('Opening Daycare Observation Unit manager.', 'info');
          }}
          title="Click to inspect Daycare Observation Unit"
        >
          <div className="stat-card-accent-blob" style={{ background: 'radial-gradient(circle, #CAF0F8 0%, rgba(202, 240, 248, 0) 70%)' }} />
          <div className="stat-squircle-badge" style={{ background: 'linear-gradient(135deg, #0077B6, #00B4D8)', color: '#ffffff', boxShadow: '0 4px 10px rgba(0, 119, 182, 0.35)' }}>
            <Pill size={16} strokeWidth={2.4} />
          </div>
          <div className="stat-card-value" style={{ color: '#0077B6' }}>{infusions.length}</div>
          <div className="stat-card-label">Active Daycare Beds</div>
          <div style={{ fontSize: 10.5, color: '#0077B6', marginTop: 4, fontWeight: 700 }}>
            {infusions.filter(c => !c.isPaused).length} Beds Monitored • IV Fluids Running
          </div>
        </div>

        {/* Card 4: Diagnostic Reviews — Clinical Amber Gold (#d97706 & #b45309) */}
        <div 
          className="stat-card anim-hover-lift doc-glass-shimmer"
          style={{ cursor: 'pointer' }}
          onClick={() => setIsDiagnosticsModalOpen(true)}
          title="Click to inspect pending cardiology & radiology studies"
        >
          <div className="stat-card-accent-blob" style={{ background: 'radial-gradient(circle, #fef3c7 0%, rgba(254, 243, 199, 0) 70%)' }} />
          <div className="stat-squircle-badge" style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', color: '#ffffff', boxShadow: '0 4px 10px rgba(217, 119, 6, 0.35)' }}>
            <Layers size={16} strokeWidth={2.4} />
          </div>
          <div className="stat-card-value" style={{ color: '#b45309' }}>{pendingDiagnostics.length}</div>
          <div className="stat-card-label">Pending Diagnostic Studies</div>
          <div style={{ fontSize: 10.5, color: '#b45309', marginTop: 4, fontWeight: 700 }}>
            1 ECG / Echo • 1 Chest X-Ray • 1 USG
          </div>
        </div>

      </div>

      {/* =========================================================================
          HERO ANALYTICS: Modern Interactive Telemetry, Bezier Curves & AI Forecasting
          ========================================================================= */}
      <DoctorAnalyticsHub />

      {/* =========================================================================
          Main 2-Column Dashboard Grid with Internal Scroll Containment
          ========================================================================= */}
      <div style={{ 
        flex: '0 0 auto', 
        minHeight: 'min-content', 
        display: 'grid', 
        gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)', 
        gap: 12 
      }}>

        {/* LEFT COLUMN: Visual Case Mix & Live Daycare Infusion Monitoring */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          {/* VISUAL 1: General Hospital Case Mix & Clinical Triage Distribution */}
          <div className="card anim-hover-lift doc-glass-shimmer" style={{ padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
            <div className="stat-card-accent-blob" style={{ top: -14, right: -14, width: 72, height: 72, opacity: 0.45, background: 'radial-gradient(circle, var(--doc-pill-bg, #CAF0F8) 0%, rgba(202, 240, 248, 0) 70%)' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="stat-squircle-badge" style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--doc-brand-gradient, linear-gradient(135deg, #0f172a, #1e3a8a))', color: '#ffffff' }}>
                  <TrendingUp size={15} />
                </div>
                <div>
                  <h3 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Multispeciality Clinical Case Mix & Triage Distribution
                  </h3>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                    Click any specialty to inspect clinical protocols & guidelines
                  </span>
                </div>
              </div>
              <span className="brand-counter-pill" style={{ fontSize: 9.5, background: 'var(--doc-pill-bg, #CAF0F8)', color: 'var(--doc-pill-color, #0077B6)', border: '1px solid var(--doc-pill-border, #90E0EF)', fontWeight: 700 }}>Interactive Cohort</span>
            </div>

            {/* Stacked Visual Bar with hover effects */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ 
                height: 12, 
                borderRadius: 9999, 
                backgroundColor: 'var(--bg-subtle)', 
                display: 'flex', 
                overflow: 'hidden', 
                gap: 2,
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                cursor: 'pointer'
              }}>
                {caseMix.map((cm) => (
                  <div 
                    key={cm.id} 
                    onClick={() => {
                      setSelectedCaseMix(prev => prev?.id === cm.id ? null : cm);
                      addToast(`Selected ${cm.shortSite} cohort (${cm.percent}%).`, 'info');
                    }}
                    style={{ 
                      width: `${cm.percent}%`, 
                      backgroundColor: cm.color, 
                      borderRadius: 9999,
                      transition: 'all 0.3s ease',
                      opacity: selectedCaseMix && selectedCaseMix.id !== cm.id ? 0.35 : 1,
                      transform: selectedCaseMix?.id === cm.id ? 'scaleY(1.3)' : 'scaleY(1)'
                    }} 
                    title={`${cm.site}: ${cm.percent}% • Click to inspect`}
                  />
                ))}
              </div>
            </div>

            {/* Case Mix Breakdown Grid - Interactive cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {caseMix.map((item) => {
                const isSelected = selectedCaseMix?.id === item.id;
                return (
                  <div 
                    key={item.id}
                    onClick={() => {
                      setSelectedCaseMix(prev => prev?.id === item.id ? null : item);
                      addToast(isSelected ? 'Cleared specialty filter.' : `Inspecting ${item.shortSite} clinical protocol.`, 'info');
                    }}
                    style={{
                      backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-subtle)',
                      border: `1.5px solid ${isSelected ? item.color : 'var(--border-subtle)'}`,
                      borderRadius: 10,
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 2px 8px ${item.color}33` : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {item.shortSite}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: item.color }}>{item.percent}%</span>
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: 14 }}>
                      {item.stage} • {item.count} Cases
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Expandable Slide-down Details Box for Selected Tumor */}
            {selectedCaseMix && (
              <div style={{ 
                marginTop: 10, 
                padding: '10px 12px', 
                backgroundColor: 'var(--bg-subtle)', 
                border: `1px solid ${selectedCaseMix.color}40`,
                borderRadius: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                animation: 'm3SlideDown 0.25s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: selectedCaseMix.color }}>
                    {selectedCaseMix.site} — Staging & Protocol Guide
                  </span>
                  <button 
                    onClick={() => setSelectedCaseMix(null)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Staging Distribution Bars */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {selectedCaseMix.stages.map((stg, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5 }}>
                        <span style={{ fontWeight: 700 }}>{stg.label}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{stg.pct}%</span>
                      </div>
                      <div style={{ width: '100%', height: 4, backgroundColor: 'var(--border-default)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${stg.pct}%`, height: '100%', backgroundColor: selectedCaseMix.color }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Protocol Guidelines */}
                <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700 }}>Recommended Regimens:</span>
                  {selectedCaseMix.protocols.map((prot, idx) => (
                    <span key={idx} className="mrn-tag" style={{ fontSize: 9.5, background: 'var(--bg-surface)' }}>
                      {prot}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Clickable Molecular Biomarker Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Target Biomarkers:
              </span>
              {biomarkers.map((bm) => {
                const isActive = selectedBiomarker === bm.id;
                return (
                  <button
                    key={bm.id}
                    onClick={() => {
                      const next = isActive ? null : bm.id;
                      setSelectedBiomarker(next);
                      addToast(next ? `Filtered to ${bm.label} cohort (${bm.drug}).` : 'Cleared biomarker filter.', 'info');
                    }}
                    className="badge" 
                    style={{ 
                      background: isActive ? bm.color : bm.bg, 
                      color: isActive ? '#ffffff' : bm.color, 
                      fontSize: 10,
                      cursor: 'pointer',
                      border: `1px solid ${bm.color}40`,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {bm.label} ({bm.prevalence})
                  </button>
                );
              })}
            </div>
          </div>

          {/* VISUAL 2: Daycare & Observation Ward Live Infusion Tracker */}
          <div className="card anim-hover-lift doc-glass-shimmer" style={{ padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
            <div className="stat-card-accent-blob" style={{ top: -14, right: -14, width: 72, height: 72, opacity: 0.45, background: 'radial-gradient(circle, var(--doc-pill-bg, #dbeafe) 0%, rgba(219, 234, 254, 0) 70%)' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="stat-squircle-badge" style={{ background: 'var(--doc-brand-gradient, linear-gradient(135deg, #0f172a, #1e3a8a))', color: '#ffffff', boxShadow: 'var(--doc-brand-shadow, 0 4px 10px rgba(30, 58, 138, 0.35))' }}>
                  <Activity size={15} />
                </div>
                <div>
                  <h3 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Daycare & Observation Ward Live Infusion Monitor
                  </h3>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                    Real-time infusion flow pumps • Click any bed to inspect flowsheet
                  </span>
                </div>
              </div>
              <div className="brand-counter-pill" style={{ height: 22, fontSize: 9.5, background: 'var(--doc-pill-bg, #dbeafe)', color: 'var(--doc-pill-color, #1e40af)', border: '1px solid var(--doc-pill-border, #93c5fd)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span className="live-dot" style={{ backgroundColor: 'var(--doc-accent-color, #2563eb)' }} />
                <span>{infusions.filter(c => !c.isPaused).length} Active Pumps</span>
              </div>
            </div>

            {/* List of Daycare Chairs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {infusions.map((inf) => {
                const percent = Math.min(100, Math.round((inf.elapsedMinutes / inf.totalMinutes) * 100));
                const isPaused = inf.isPaused;
                
                return (
                  <div 
                    key={inf.id}
                    onClick={() => setSelectedChair(inf)}
                    style={{
                      backgroundColor: 'var(--bg-subtle)',
                      border: `1px solid ${isPaused ? '#f59e0b' : 'var(--border-subtle)'}`,
                      borderRadius: 10,
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span className="mrn-tag" style={{ fontSize: 10, background: '#dbeafe', color: '#1e3a8a' }}>
                          {inf.chair}
                        </span>
                        <strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                          {inf.patient}
                        </strong>
                        <span style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>
                          ({inf.age}y {inf.gender}) • {inf.indication}
                        </span>
                      </div>
                      
                      {/* Controls on card */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                        <span className="badge" style={{ 
                          backgroundColor: isPaused ? '#fef3c7' : '#dcfce7', 
                          color: isPaused ? '#b45309' : '#15803d', 
                          fontSize: 10,
                          fontWeight: 700 
                        }}>
                          {inf.status}
                        </span>
                        <button
                          onClick={() => handleTogglePump(inf.id)}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border-default)',
                            borderRadius: '50%',
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: isPaused ? '#10b981' : '#f59e0b'
                          }}
                          title={isPaused ? 'Resume Pump' : 'Pause Pump'}
                        >
                          {isPaused ? <Play size={11} /> : <Pause size={11} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-primary)', fontWeight: 600 }}>
                      <span>{inf.regimen} ({inf.cycle})</span>
                      <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                        {inf.elapsedMinutes}m / {inf.totalMinutes}m ({percent}%) • Rate: {inf.flowRateMlHr} ml/hr
                      </span>
                    </div>

                    {/* Animated Progress Bar */}
                    <div style={{ width: '100%', height: 6, borderRadius: 9999, backgroundColor: 'var(--border-default)', overflow: 'hidden' }}>
                      <div 
                        className={!isPaused ? 'infusion-flowing-bar' : ''}
                        style={{ 
                          width: `${percent}%`, 
                          height: '100%', 
                          background: isPaused ? '#f59e0b' : undefined,
                          borderRadius: 9999,
                          transition: 'width 0.4s ease'
                        }} 
                      />
                    </div>

                    <div style={{ fontSize: 9.5, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Vitals: {inf.vitals.bp} • HR {inf.vitals.hr} bpm • SpO2 {inf.vitals.spo2}%</span>
                      <span style={{ color: '#1e3a8a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                        Inspect Flowsheet <ChevronRight size={11} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Priority Sentinel Warnings & Quick Today's Patient Schedule */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          {/* VISUAL 3: Sentinel Risk Radar — Clinical Sentinel Watchlist */}
          <div className="card anim-hover-lift doc-glass-shimmer" style={{ padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
            <div className="stat-card-accent-blob" style={{ top: -14, right: -14, width: 72, height: 72, opacity: 0.45, background: 'radial-gradient(circle, #fecaca 0%, rgba(254, 202, 202, 0) 70%)' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="stat-squircle-badge" style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#ffffff', boxShadow: '0 4px 10px rgba(220, 38, 38, 0.35)' }}>
                  <ShieldAlert size={15} />
                </div>
                <div>
                  <h3 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Clinical CDSS Sentinel Alert Watchlist
                  </h3>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                    Immediate physician attention indicated
                  </span>
                </div>
              </div>
              <span className="brand-counter-pill" style={{ fontSize: 9.5, background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', fontWeight: 700 }}>{sentinelAlerts.length} Alerts</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sentinelAlerts.map((alert) => {
                const isCrit = alert.level === 'CRITICAL';
                const isGen = alert.level === 'GENOMIC';
                const bgTint = isCrit ? 'var(--destructive-container, #fee2e2)' : isGen ? 'var(--doc-pill-bg, #dbeafe)' : 'var(--warning-container, #fef3c7)';
                const borderTint = isCrit ? 'var(--destructive, #dc2626)' : isGen ? 'var(--doc-accent-color, #2563eb)' : 'var(--warning, #d97706)';
                const titleColor = isCrit ? 'var(--on-destructive-container, #991b1b)' : isGen ? 'var(--doc-pill-color, #1e40af)' : 'var(--on-warning-container, #78350f)';
                const btnColor = isCrit ? '#dc2626' : isGen ? '#1e3a8a' : '#d97706';

                return (
                  <div 
                    key={alert.id}
                    style={{
                      backgroundColor: bgTint,
                      border: `1.5px solid ${borderTint}`,
                      borderRadius: 10,
                      padding: '9px 11px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ 
                        fontSize: 9.5, 
                        fontWeight: 800, 
                        color: titleColor,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase'
                      }}>
                        {alert.level} ({alert.confidence}) • {alert.patientName}
                      </span>
                      <button 
                        onClick={() => setActiveAlertModal(alert)}
                        className="m3-btn m3-btn-sm"
                        style={{
                          height: 22,
                          fontSize: 10.5,
                          padding: '0 8px',
                          background: '#ffffff',
                          border: `1px solid ${borderTint}`,
                          color: btnColor,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <span>Take Action</span>
                        <ChevronRight size={11} />
                      </button>
                    </div>

                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {alert.title}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                      {alert.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VISUAL 4: Today's OPD Schedule with Search & Filters */}
          <div className="card anim-hover-lift doc-glass-shimmer" style={{ padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
            <div className="stat-card-accent-blob" style={{ top: -14, right: -14, width: 72, height: 72, opacity: 0.45, background: 'radial-gradient(circle, var(--doc-pill-bg, #dbeafe) 0%, rgba(219, 234, 254, 0) 70%)' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="stat-squircle-badge" style={{ background: 'var(--doc-brand-gradient, linear-gradient(135deg, #0f172a, #1e3a8a))', color: '#ffffff', boxShadow: 'var(--doc-brand-shadow, 0 4px 10px rgba(30, 58, 138, 0.35))' }}>
                  <Calendar size={15} />
                </div>
                <div>
                  <h3 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Today's Patient Schedule
                  </h3>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                    Filter & launch direct consultation
                  </span>
                </div>
              </div>
              <span className="brand-counter-pill" style={{ fontSize: 10, background: 'var(--doc-pill-bg, #dbeafe)', color: 'var(--doc-pill-color, #1e40af)', border: '1px solid var(--doc-pill-border, #93c5fd)', fontWeight: 700 }}>{filteredPatients.length} Shown</span>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
                {[
                  { id: 'ALL', label: `All (${patients.length})` },
                  { id: 'READY', label: 'AI Ready (3)' },
                  { id: 'IN_ROOM', label: 'In Room (1)' },
                  { id: 'COMPLETED', label: 'Completed (1)' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setScheduleFilter(tab.id)}
                    className="filter-tab"
                    style={{
                      height: 26,
                      fontSize: 10.5,
                      padding: '0 10px',
                      borderRadius: 9999,
                      border: scheduleFilter === tab.id ? '1px solid var(--doc-accent-color, #2563eb)' : '1px solid var(--border-default)',
                      backgroundColor: scheduleFilter === tab.id ? 'var(--doc-accent-color, #2563eb)' : 'var(--bg-subtle)',
                      color: scheduleFilter === tab.id ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: scheduleFilter === tab.id ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)' }} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter schedule by patient name or MRN..."
                  style={{
                    width: '100%',
                    height: 30,
                    padding: '0 26px 0 28px',
                    borderRadius: 8,
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: 11,
                    fontFamily: 'var(--font-sans)',
                    outline: 'none'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* List of Patients */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredPatients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 8px', color: 'var(--text-muted)', fontSize: 11 }}>
                  No patients match your search or filter.
                </div>
              ) : (
                filteredPatients.map((p) => {
                  const isSelected = p.id === selectedPatientId;
                  const hasML = p.status === 'INSIGHTS_READY';

                  return (
                    <div
                      key={p.id}
                      onClick={() => onOpenWorkspace(p.id, 'insights')}
                      className={`doctor-patient-card ${isSelected ? 'selected' : ''}`}
                      style={{
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-subtle)',
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        cursor: 'pointer'
                      }}
                      title="Click to start consultation"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <div className="patient-avatar-chip" style={{ width: 26, height: 26, fontSize: 10, background: 'linear-gradient(135deg, #0f172a, #1e3a8a)' }}>
                          {p.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                              {p.fullName}
                            </span>
                            <span className="mrn-tag" style={{ fontSize: 9 }}>{p.mrn}</span>
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {p.age}y {p.gender} • Appt: {p.appointmentTime}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {hasML ? (
                          <span className="brand-counter-pill" style={{ fontSize: 9.5, padding: '1.5px 6px', background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', fontWeight: 700 }}>
                            <Sparkles size={9} /> AI Ready
                          </span>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: 9.5, padding: '1.5px 6px' }}>
                            {p.status.replace('_', ' ')}
                          </span>
                        )}
                        <span style={{ fontSize: 10.5, color: '#1e3a8a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                          Start <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* VISUAL 5: Quick Doctor Voice Dictation Scratchpad with STT & Memos */}
          <div className="card anim-hover-lift" style={{ padding: '12px 14px', backgroundColor: 'var(--bg-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={14} color="#1e3a8a" />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Physician Shift Voice Memo & Dictation
                </span>
              </div>
              <SpeechMicButton onTranscript={(txt) => setQuickNote(prev => prev ? `${prev} ${txt}` : txt)} />
            </div>

            <textarea
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              placeholder="Dictate or type quick clinical notes, multispeciality points, or patient reminders..."
              rows={2}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                padding: '6px 8px',
                fontSize: 11,
                fontFamily: 'var(--font-sans)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                resize: 'none'
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
              <button
                onClick={() => setQuickNote('')}
                className="m3-btn m3-btn-sm"
                style={{ height: 26, fontSize: 10.5, padding: '0 8px', background: 'transparent' }}
              >
                Clear
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => handleTransferMemo(quickNote)}
                  className="m3-btn m3-btn-sm"
                  style={{ height: 26, fontSize: 10.5, padding: '0 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                >
                  Transfer to Patient
                </button>
                <button
                  onClick={handleSaveMemo}
                  className="m3-btn m3-btn-sm"
                  style={{ height: 26, fontSize: 10.5, padding: '0 12px', background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', color: '#ffffff', border: 'none' }}
                >
                  Save Memo
                </button>
              </div>
            </div>

            {/* List of Saved Memos */}
            {savedMemos.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Saved Shift Notes ({savedMemos.length})
                </span>
                {savedMemos.map(m => (
                  <div 
                    key={m.id}
                    style={{
                      padding: '5px 8px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 6,
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 10.5,
                      gap: 6
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <strong style={{ color: 'var(--text-muted)', marginRight: 4 }}>{m.timestamp}</strong>
                      {m.text}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                      <button 
                        onClick={() => handleCopyMemo(m.text)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 2 }}
                        title="Copy text"
                      >
                        <Copy size={11} />
                      </button>
                      <button 
                        onClick={() => handleDeleteMemo(m.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 2 }}
                        title="Delete note"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* =========================================================================
          MODAL 1: Daycare Observation Bed Flowsheet & Pump Controller
          ========================================================================= */}
      {selectedChair && (
        <div className="modal-overlay m3-dialog-backdrop" onClick={() => setSelectedChair(null)}>
          <div 
            className="modal-content m3-dialog-container" 
            style={{ maxWidth: 650, padding: 20, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="stat-squircle-badge badge-bg-blue" style={{ width: 36, height: 36, borderRadius: 10 }}>
                  <Pill size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedChair.chair} — Daycare Observation & IV Flowsheet
                  </h3>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Patient: <strong>{selectedChair.patient}</strong> ({selectedChair.mrn}) • {selectedChair.indication}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedChair(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="m3-scrollable-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 4 }}>
              
              {/* Active Protocol Card */}
              <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Prescribed Regimen</span>
                  <span className="brand-counter-pill" style={{ fontSize: 9.5 }}>{selectedChair.cycle}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedChair.regimen}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Total Bag Volume: <strong>{selectedChair.bagVolumeMl} mL Normal Saline</strong> • Elapsed: <strong>{selectedChair.elapsedMinutes} mins</strong> of {selectedChair.totalMinutes} mins
                </div>
              </div>

              {/* Pump Rate & Titration Controls */}
              <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
                    Intravenous Infusion Pump Status
                  </span>
                  <span className="badge" style={{ backgroundColor: selectedChair.isPaused ? '#fef3c7' : '#dcfce7', color: selectedChair.isPaused ? '#b45309' : '#15803d' }}>
                    {selectedChair.status}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>
                      {selectedChair.flowRateMlHr} <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>mL / hr</span>
                    </div>
                    <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Electronic volumetric control</span>
                  </div>

                  {/* Titration Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button 
                      onClick={() => handleTitrateRate(selectedChair.id, -10)}
                      className="m3-btn m3-btn-sm"
                      style={{ height: 30, fontSize: 11, background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}
                    >
                      -10 mL/h
                    </button>
                    <button 
                      onClick={() => handleTitrateRate(selectedChair.id, 10)}
                      className="m3-btn m3-btn-sm"
                      style={{ height: 30, fontSize: 11, background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}
                    >
                      +10 mL/h
                    </button>
                    <button 
                      onClick={() => handleTogglePump(selectedChair.id)}
                      className="m3-btn m3-btn-sm"
                      style={{ 
                        height: 30, 
                        fontSize: 11, 
                        background: selectedChair.isPaused ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #d97706, #f59e0b)',
                        color: '#ffffff',
                        fontWeight: 700 
                      }}
                    >
                      {selectedChair.isPaused ? 'Resume Infusion' : 'Hold / Pause'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Pre-medications Administered Checklist */}
              <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
                  Pre-medications & Hypersensitivity Protection
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                  {selectedChair.premeds.map((pm, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-primary)' }}>
                      <CheckCircle2 size={14} color="#10b981" />
                      <span>{pm.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-time Vitals & Record Button */}
              <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                    Patient Daycare Vitals Log
                  </span>
                  <button 
                    onClick={() => handleRecordVitals(selectedChair.id)}
                    className="m3-btn m3-btn-sm"
                    style={{ height: 24, fontSize: 10.5, padding: '0 8px', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}
                  >
                    Record New Vitals
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
                  <div style={{ background: 'var(--bg-subtle)', padding: 6, borderRadius: 6 }}>
                    <span style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>Blood Pressure</span>
                    <div style={{ fontWeight: 800, fontSize: 12 }}>{selectedChair.vitals.bp}</div>
                  </div>
                  <div style={{ background: 'var(--bg-subtle)', padding: 6, borderRadius: 6 }}>
                    <span style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>Heart Rate</span>
                    <div style={{ fontWeight: 800, fontSize: 12 }}>{selectedChair.vitals.hr} bpm</div>
                  </div>
                  <div style={{ background: 'var(--bg-subtle)', padding: 6, borderRadius: 6 }}>
                    <span style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>SpO2 Level</span>
                    <div style={{ fontWeight: 800, fontSize: 12 }}>{selectedChair.vitals.spo2}%</div>
                  </div>
                  <div style={{ background: 'var(--bg-subtle)', padding: 6, borderRadius: 6 }}>
                    <span style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>Body Temp</span>
                    <div style={{ fontWeight: 800, fontSize: 12 }}>{selectedChair.vitals.temp}</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-default)', paddingTop: 12, marginTop: 12 }}>
              <button className="m3-btn m3-btn-outlined" onClick={() => setSelectedChair(null)}>
                Close Window
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button 
                  className="m3-btn m3-btn-filled"
                  onClick={() => {
                    handleCompleteInfusion(selectedChair.id);
                  }}
                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)', height: 34, fontSize: 11.5 }}
                >
                  <Check size={14} />
                  <span>Authorize Discharge & Sign Cycle Off</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: Sentinel AI Alert Action Modal
          ========================================================================= */}
      {activeAlertModal && (
        <div className="modal-overlay m3-dialog-backdrop" onClick={() => setActiveAlertModal(null)}>
          <div 
            className="modal-content m3-dialog-container" 
            style={{ maxWidth: 620, padding: 22, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="stat-squircle-badge" style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', color: '#ffffff', boxShadow: '0 4px 10px rgba(30, 58, 138, 0.35)' }}>
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="brand-counter-pill" style={{ fontSize: 9.5, background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', fontWeight: 700 }}>{activeAlertModal.level}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Confidence: {activeAlertModal.confidence}</span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                    {activeAlertModal.title}
                  </h3>
                </div>
              </div>
              <button onClick={() => setActiveAlertModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="m3-scrollable-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 12, backgroundColor: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                  Patient: {activeAlertModal.patientName} ({activeAlertModal.age}y {activeAlertModal.gender}) • {activeAlertModal.mrn}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.45 }}>
                  {activeAlertModal.desc}
                </div>
              </div>

              {/* Rationale & Actions */}
              <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                  CDSS Clinical Rationale & Guidance:
                </span>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {activeAlertModal.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  onClick={() => {
                    addToast(`Added sentinel warning to ${activeAlertModal.patientName}'s clinical notes.`, 'success');
                  }}
                  className="m3-btn m3-btn-tonal"
                  style={{ height: 34, fontSize: 11.5, justifyContent: 'flex-start' }}
                >
                  <Plus size={14} color="#1e3a8a" />
                  <span>1-Click: Append Recommendations to Patient Treatment Plan</span>
                </button>
                <button
                  onClick={() => {
                    addToast(`Ordered STAT Biomarker Panel & Diagnostic Scan for ${activeAlertModal.patientName}.`, 'success');
                  }}
                  className="m3-btn m3-btn-tonal"
                  style={{ height: 34, fontSize: 11.5, justifyContent: 'flex-start' }}
                >
                  <Layers size={14} color="#2563eb" />
                  <span>1-Click: Order STAT Re-staging Diagnostic Imaging & Labs</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-default)', paddingTop: 12, marginTop: 12 }}>
              <button 
                onClick={() => handleAcknowledgeAlert(activeAlertModal.id)}
                className="m3-btn m3-btn-outlined"
                style={{ fontSize: 11 }}
              >
                Acknowledge & Archive Alert
              </button>
              <button 
                className="m3-btn m3-btn-filled"
                onClick={() => {
                  onOpenWorkspace(activeAlertModal.patientId, 'insights');
                  setActiveAlertModal(null);
                }}
                style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', height: 34, fontSize: 11.5 }}
              >
                <span>Jump to Patient Consultation Dossier</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: Pending Diagnostic Studies & Scans
          ========================================================================= */}
      {isDiagnosticsModalOpen && (
        <div className="modal-overlay m3-dialog-backdrop" onClick={() => setIsDiagnosticsModalOpen(false)}>
          <div 
            className="modal-content m3-dialog-container" 
            style={{ maxWidth: 680, padding: 22, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="stat-squircle-badge badge-bg-green" style={{ width: 36, height: 36, borderRadius: 10 }}>
                  <Layers size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Pending Diagnostic Imaging & Scan Interpretations
                  </h3>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    PACS / Radiology Department Interface • 3 Studies Ready for Review
                  </span>
                </div>
              </div>
              <button onClick={() => setIsDiagnosticsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="m3-scrollable-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingDiagnostics.map((study) => (
                <div 
                  key={study.id}
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span className="mrn-tag" style={{ background: '#dbeafe', color: '#1e3a8a', fontSize: 10 }}>
                        {study.modality}
                      </span>
                      <strong style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>
                        {study.title}
                      </strong>
                    </div>
                    <span className="badge" style={{ backgroundColor: study.urgency === 'HIGH' ? '#fee2e2' : '#f1f5f9', color: study.urgency === 'HIGH' ? '#b91c1c' : '#475569' }}>
                      {study.status}
                    </span>
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    Patient: <strong>{study.patient}</strong> ({study.mrn}) • Facility: {study.facility}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {study.summary}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                    <button
                      onClick={() => {
                        setIsDiagnosticsModalOpen(false);
                        onOpenWorkspace(study.patientId, 'dicom');
                        addToast(`Loaded ${study.modality} into integrated DICOM viewer.`, 'success');
                      }}
                      className="m3-btn m3-btn-sm"
                      style={{ height: 28, fontSize: 11, background: 'var(--primary)', color: '#ffffff', gap: 5 }}
                    >
                      <Eye size={13} />
                      <span>Open in DICOM Viewer →</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-default)', paddingTop: 12, marginTop: 12 }}>
              <button className="m3-btn m3-btn-outlined" onClick={() => setIsDiagnosticsModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: All Sentinel AI Alerts Overview
          ========================================================================= */}
      {isAllAlertsModalOpen && (
        <div className="modal-overlay m3-dialog-backdrop" onClick={() => setIsAllAlertsModalOpen(false)}>
          <div 
            className="modal-content m3-dialog-container" 
            style={{ maxWidth: 650, padding: 22, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="stat-squircle-badge" style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', color: '#ffffff', boxShadow: '0 4px 10px rgba(30, 58, 138, 0.35)' }}>
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Active Sentinel AI Clinical Alerts ({sentinelAlerts.length})
                  </h3>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Continuous safety monitoring across Station 03 clinic patients
                  </span>
                </div>
              </div>
              <button onClick={() => setIsAllAlertsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="m3-scrollable-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sentinelAlerts.map(alert => (
                <div 
                  key={alert.id}
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="brand-counter-pill" style={{ fontSize: 9.5, background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', fontWeight: 700 }}>{alert.level}</span>
                      <strong style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>{alert.title}</strong>
                    </div>
                    <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Confidence: {alert.confidence}</span>
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    Patient: <strong>{alert.patientName}</strong> ({alert.age}y {alert.gender}) • {alert.mrn}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                    {alert.desc}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="m3-btn m3-btn-sm"
                      style={{ height: 26, fontSize: 10.5, background: 'transparent', border: '1px solid var(--border-default)' }}
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => {
                        setIsAllAlertsModalOpen(false);
                        onOpenWorkspace(alert.patientId, 'insights');
                      }}
                      className="m3-btn m3-btn-sm"
                      style={{ height: 26, fontSize: 10.5, background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', color: '#ffffff', border: 'none' }}
                    >
                      <span>Take Action in Dossier →</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-default)', paddingTop: 12, marginTop: 12 }}>
              <button className="m3-btn m3-btn-outlined" onClick={() => setIsAllAlertsModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
