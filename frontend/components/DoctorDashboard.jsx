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

export default function DoctorDashboard({ onOpenWorkspace, onSwitchToReception }) {
  const { patients, selectedPatientId, setSelectedPatientId, stats, addToast } = usePatients();

  // State: Patient Schedule Filtering & Search
  const [scheduleFilter, setScheduleFilter] = useState('ALL'); // 'ALL' | 'READY' | 'IN_ROOM' | 'COMPLETED'
  const [searchQuery, setSearchQuery] = useState('');

  // State: Case Mix & Biomarkers Interactive Selection
  const [selectedCaseMix, setSelectedCaseMix] = useState(null);
  const [selectedBiomarker, setSelectedBiomarker] = useState(null);

  // State: Daycare Chemotherapy Active Chairs
  const [infusions, setInfusions] = useState([
    {
      id: 'chair-1',
      chair: 'Chair C-01',
      patient: 'Rajan Pillai',
      mrn: 'MRN-2026-0143',
      patientId: 'pat-002',
      age: 67,
      gender: 'M',
      regimen: 'Pemetrexed (500mg/m²) + Carboplatin (AUC 5)',
      indication: 'Non-Small Cell Lung Carcinoma (Stage IIIA)',
      cycle: 'Cycle 3 of 6',
      bagVolumeMl: 500,
      flowRateMlHr: 125,
      elapsedMinutes: 95,
      totalMinutes: 150,
      vitals: { bp: '126/80', hr: 74, spo2: 99, temp: '98.4°F' },
      status: 'Infusing',
      isPaused: false,
      premeds: [
        { name: 'Ondansetron 8mg IV Push', done: true },
        { name: 'Dexamethasone 10mg IV Infusion', done: true },
        { name: 'Ranitidine 50mg IV Infusion', done: true },
        { name: 'Folic Acid 1mg oral daily', done: true }
      ]
    },
    {
      id: 'chair-2',
      chair: 'Chair C-03',
      patient: 'Devendra Kapoor',
      mrn: 'MRN-2026-0145',
      patientId: 'pat-004',
      age: 58,
      gender: 'M',
      regimen: 'mFOLFOX-6 (Oxaliplatin 85mg/m² + LV + 5-FU)',
      indication: 'Colorectal Adenocarcinoma (Stage II High-Risk)',
      cycle: 'Cycle 5 of 12',
      bagVolumeMl: 1000,
      flowRateMlHr: 140,
      elapsedMinutes: 40,
      totalMinutes: 180,
      vitals: { bp: '132/84', hr: 80, spo2: 98, temp: '98.6°F' },
      status: 'Pre-Meds Done',
      isPaused: false,
      premeds: [
        { name: 'Palonosetron 0.25mg IV Push', done: true },
        { name: 'Dexamethasone 12mg IV', done: true },
        { name: 'Atropine 0.5mg SC available SOS', done: true }
      ]
    },
    {
      id: 'chair-3',
      chair: 'Chair C-04',
      patient: 'Meera Nair',
      mrn: 'MRN-2026-0146',
      patientId: 'pat-005',
      age: 61,
      gender: 'F',
      regimen: 'Weekly Paclitaxel (Taxol 80mg/m²)',
      indication: 'High-Grade Serous Ovarian Carcinoma',
      cycle: 'Cycle 6 of 6 (Final Cycle)',
      bagVolumeMl: 250,
      flowRateMlHr: 100,
      elapsedMinutes: 110,
      totalMinutes: 120,
      vitals: { bp: '118/76', hr: 70, spo2: 100, temp: '98.2°F' },
      status: 'Near Complete',
      isPaused: false,
      premeds: [
        { name: 'Dexamethasone 20mg IV (30m prior)', done: true },
        { name: 'Diphenhydramine 50mg IV', done: true },
        { name: 'Famotidine 20mg IV', done: true }
      ]
    }
  ]);

  // State: Modals & Flowsheets
  const [selectedChair, setSelectedChair] = useState(null); // Chair object for Flowsheet modal
  const [activeAlertModal, setActiveAlertModal] = useState(null); // Alert object for Sentinel Action modal
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState(false);
  const [isAllAlertsModalOpen, setIsAllAlertsModalOpen] = useState(false);

  // State: Sentinel AI Alerts
  const [sentinelAlerts, setSentinelAlerts] = useState([
    {
      id: 1,
      level: 'CRITICAL',
      patientId: 'pat-001',
      patientName: 'Ananya Sharma',
      age: 52,
      gender: 'F',
      mrn: 'MRN-2026-0142',
      confidence: '92%',
      title: 'High Risk Recurrence & Letrozole Adherence Gap',
      desc: '2-month progressive chest wall pain post-lumpectomy (2019). Elevated serum CA 15-3. Adherence caution flagged on Letrozole.',
      recommendations: [
        'Order STAT Contrast PET-CT Torso / Thoracic re-staging',
        'Review aromatase inhibitor adherence & consider bone scan',
        'Check liver function panel & serum CA 15-3 kinetics'
      ],
      acknowledged: false
    },
    {
      id: 2,
      level: 'CAUTION',
      patientId: 'pat-004',
      patientName: 'Devendra Kapoor',
      age: 58,
      gender: 'M',
      mrn: 'MRN-2026-0145',
      confidence: '89%',
      title: 'Bone Marrow Toxicity / Neutropenia Watch',
      desc: 'Post-cycle 2 ANC 1,180/µL. Monitor CBC panel prior to Oxaliplatin dosage release today.',
      recommendations: [
        'Confirm pre-infusion ANC >= 1,500/µL and Platelets >= 100,000/µL',
        'Consider prophylactic G-CSF (Pegfilgrastim 6mg) if Grade 2+ neutropenia persists',
        'Evaluate 20% dose reduction of Oxaliplatin if symptomatic'
      ],
      acknowledged: false
    },
    {
      id: 3,
      level: 'GENOMIC',
      patientId: 'pat-001',
      patientName: 'Ananya Sharma',
      age: 52,
      gender: 'F',
      mrn: 'MRN-2026-0142',
      confidence: '95%',
      title: 'Hereditary Breast & Ovarian Cancer (HBOC) Cluster',
      desc: 'First-degree maternal ovarian malignancy at age 49. Comprehensive BRCA1/BRCA2 genetic sequencing indicated.',
      recommendations: [
        'Refer for specialized cancer genetics pre-test counseling',
        'Order Multi-gene hereditary cancer panel (BRCA1, BRCA2, PALB2, TP53)',
        'Inform surveillance recommendations for at-risk first-degree relatives'
      ],
      acknowledged: false
    }
  ]);

  // State: Shift Voice Memos
  const [quickNote, setQuickNote] = useState('');
  const [savedMemos, setSavedMemos] = useState([
    {
      id: 'memo-1',
      text: 'MDT Tumor Board note: Discuss Ananya Sharma PET-CT findings on Thursday morning conference.',
      timestamp: '11:15 AM'
    },
    {
      id: 'memo-2',
      text: 'Order repeat CBC with differential for Devendra Kapoor before Cycle 6 FOLFOX.',
      timestamp: '12:30 PM'
    }
  ]);

  // Oncology Case Mix Breakdown — Image 3 & Image 2 Palettes
  const caseMix = [
    { 
      id: 'breast', 
      site: 'Invasive Ductal Carcinoma (Breast)', 
      shortSite: 'Breast IDC', 
      count: 2, 
      percent: 40, 
      color: '#03045E', // Deep Twilight
      stage: 'Stage IIB - III',
      stages: [
        { label: 'Stage I', pct: 15 },
        { label: 'Stage II', pct: 50 },
        { label: 'Stage III', pct: 25 },
        { label: 'Stage IV', pct: 10 }
      ],
      protocols: ['AC-T (Dose-Dense)', 'TC (Docetaxel + Cyclo)', 'Letrozole + Abemaciclib'],
      patientsMatched: ['Ananya Sharma']
    },
    { 
      id: 'lung', 
      site: 'Non-Small Cell Lung Carcinoma (Thoracic)', 
      shortSite: 'Lung NSCLC', 
      count: 1, 
      percent: 20, 
      color: '#0077B6', // Bright Teal Blue
      stage: 'Stage IIIA (EGFR+)',
      stages: [
        { label: 'Stage I', pct: 20 },
        { label: 'Stage II', pct: 20 },
        { label: 'Stage III', pct: 40 },
        { label: 'Stage IV', pct: 20 }
      ],
      protocols: ['Pemetrexed + Carboplatin', 'Osimertinib 80mg', 'Pembrolizumab + Chemo'],
      patientsMatched: ['Rajan Pillai']
    },
    { 
      id: 'gi', 
      site: 'Colorectal Adenocarcinoma (GI)', 
      shortSite: 'Colorectal', 
      count: 1, 
      percent: 20, 
      color: '#00B4D8', // Turquoise Surf
      stage: 'Stage II (MSI-High)',
      stages: [
        { label: 'Stage I', pct: 25 },
        { label: 'Stage II', pct: 45 },
        { label: 'Stage III', pct: 20 },
        { label: 'Stage IV', pct: 10 }
      ],
      protocols: ['mFOLFOX-6', 'CAPOX (Capecitabine + Oxaliplatin)', 'FOLFIRI + Bevacizumab'],
      patientsMatched: ['Devendra Kapoor']
    },
    { 
      id: 'heme', 
      site: 'Diffuse Large B-Cell Lymphoma (Heme)', 
      shortSite: 'DLBCL Lymphoma', 
      count: 1, 
      percent: 20, 
      color: '#34908B', // Deep Eucalyptus Teal
      stage: 'Stage I (Ann Arbor)',
      stages: [
        { label: 'Stage I', pct: 35 },
        { label: 'Stage II', pct: 35 },
        { label: 'Stage III', pct: 20 },
        { label: 'Stage IV', pct: 10 }
      ],
      protocols: ['R-CHOP (21-Day Cycle)', 'Pola-R-CHP', 'High-Dose Methotrexate'],
      patientsMatched: ['Meera Nair']
    },
  ];

  // Biomarkers List — Harmonious Integration of Image 3 & Image 2
  const biomarkers = [
    { id: 'er_pr', label: 'ER+/PR+', prevalence: '55%', color: '#03045E', bg: '#CAF0F8', border: '#90E0EF', drug: 'Endocrine (Letrozole / Tamoxifen)' },
    { id: 'her2', label: 'HER2 Amplified', prevalence: '20%', color: '#0077B6', bg: '#e0f2fe', border: '#00B4D8', drug: 'Trastuzumab + Pertuzumab' },
    { id: 'tnbc', label: 'Triple Negative', prevalence: '15%', color: '#5c4e04', bg: '#FDF4AF', border: '#e8dc7e', drug: 'Platinum + Immunotherapy' },
    { id: 'egfr', label: 'FGFR Exon 19 Del', prevalence: '10%', color: '#1b4b48', bg: '#A5E9DD', border: '#6FBEB2', drug: 'Osimertinib 3rd Gen TKI' }
  ];

  // Diagnostic Studies Mock Data
  const pendingDiagnostics = [
    {
      id: 'diag-1',
      title: 'Contrast 18F-FDG PET-CT Whole Body',
      patient: 'Ananya Sharma',
      mrn: 'MRN-2026-0142',
      patientId: 'pat-001',
      modality: 'PET-CT',
      facility: 'Nuclear Medicine Dept',
      status: 'Ready for Review',
      urgency: 'HIGH',
      summary: 'Suspected recurrence scan. Avid uptake reported in right parasternal internal mammary node chain.'
    },
    {
      id: 'diag-2',
      title: 'High-Resolution Diagnostic Breast MRI with Dynamic Contrast',
      patient: 'Ananya Sharma',
      mrn: 'MRN-2026-0142',
      patientId: 'pat-001',
      modality: 'MRI',
      facility: 'Advanced Breast Imaging Suite',
      status: 'Ready for Review',
      urgency: 'HIGH',
      summary: 'Evaluation of right lumpectomy bed architectural distortion vs post-radiation fibrosis.'
    },
    {
      id: 'diag-3',
      title: 'Diagnostic Contrast Chest CT (64-Slice)',
      patient: 'Rajan Pillai',
      mrn: 'MRN-2026-0143',
      patientId: 'pat-002',
      modality: 'CT',
      facility: 'Thoracic Radiology Station 02',
      status: 'Prelim Available',
      urgency: 'ROUTINE',
      summary: 'Post-Cycle 2 response assessment for right upper lobe primary lesion.'
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
        const matchesName = p.fullName.toLowerCase().includes(q);
        const matchesMrn = p.mrn.toLowerCase().includes(q);
        const matchesGender = p.gender.toLowerCase().includes(q);
        const matchesComplaint = p.questionnaire?.responses?.chiefComplaint?.toLowerCase().includes(q);
        if (!matchesName && !matchesMrn && !matchesGender && !matchesComplaint) return false;
      }

      // Biomarker Filter
      if (selectedBiomarker === 'er_pr' && p.id !== 'pat-001') return false;
      if (selectedBiomarker === 'egfr' && p.id !== 'pat-002') return false;
      if (selectedBiomarker === 'her2' && p.id !== 'pat-003') return false;
      if (selectedBiomarker === 'tnbc' && p.id !== 'pat-005') return false;

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
    addToast('Oncologist shift memo saved.', 'success');
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
      {/* =========================================================================
          Top Welcome & Shift Banner - Reception Stat-Card Standard
          ===============================================================      <div className="m3-doctor-patient-banner" style={{ padding: '12px 18px', border: '1.5px solid var(--doc-banner-border, #bae6fd)', background: 'var(--doc-banner-bg, linear-gradient(120deg, #ffffff 0%, #f0f9ff 40%, #e0f2fe 80%, #ffffff 100%))' }}>
        <div className="stat-card-accent-blob" style={{ top: -20, right: -20, width: 110, height: 110, opacity: 0.5, background: 'radial-gradient(circle, var(--doc-accent-color, #bae6fd) 0%, rgba(186, 230, 253, 0) 70%)' }} />
        
        <div className="m3-patient-banner-info" style={{ position: 'relative', zIndex: 1 }}>
          <div className="stat-squircle-badge" style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--doc-brand-gradient, linear-gradient(135deg, #7dd3fc, #38bdf8))', color: '#ffffff', boxShadow: 'var(--doc-brand-shadow, 0 4px 14px rgba(56, 189, 248, 0.35))' }}>
            <Stethoscope size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--doc-banner-title, #0369a1)', letterSpacing: '-0.02em', margin: 0 }}>
                Dr. Kiran Patel, MD
              </h2>
              <span className="brand-counter-pill" style={{ textTransform: 'none', fontSize: 10, background: 'var(--doc-pill-bg, #e0f2fe)', color: 'var(--doc-pill-color, #0284c7)', border: '1px solid var(--doc-pill-border, #bae6fd)', fontWeight: 700 }}>
                Senior Medical Oncologist
              </span>
              <span style={{ fontSize: 11, color: 'var(--doc-accent-color, #0284c7)', fontWeight: 600 }}>• Station 03 • OPD Session Active</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2, fontWeight: 500 }}>
              Cancer Center Care Stream • <strong>{patients.length} Consultations Booked</strong> • <strong style={{ color: 'var(--doc-accent-color, #0284c7)' }}>{sentinelAlerts.length} Sentinel AI Warnings</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <button 
            className="m3-btn"
            onClick={onSwitchToReception}
            title="Switch to Reception Desk"
            style={{ height: 32, fontSize: 11.5, padding: '0 12px', background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', fontWeight: 700 }}
          >
            ← Reception Desk
          </button>
          <button 
            className="m3-btn"
            onClick={() => onOpenWorkspace(selectedPatientId || 'pat-001', 'insights')}
            title="Open Station 03 Clinical Consultation Workspace"
            style={{ height: 32, fontSize: 11.5, padding: '0 12px', gap: 5, background: 'var(--doc-pill-bg, #e0f2fe)', color: 'var(--doc-pill-color, #0284c7)', border: '1px solid var(--doc-pill-border, #bae6fd)', fontWeight: 700 }}
          >
            <Stethoscope size={14} />
            <span>Clinical Workspace →</span>
          </button>
          <button 
            className="m3-btn anim-hover-lift"
            onClick={() => onOpenWorkspace('pat-001', 'insights')}
            style={{ 
              background: 'var(--doc-brand-gradient, linear-gradient(135deg, #38bdf8, #0284c7))', 
              color: '#ffffff', 
              height: 34, 
              fontSize: 12, 
              padding: '0 16px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--doc-brand-shadow, 0 3px 14px rgba(14, 165, 233, 0.35))',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <span>Resume Patient: Ananya Sharma</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          4 Top Stat Cards Row — Ultra-Light Crystal Sky Blue Palette
          ========================================================================= */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 2 }}>
        
        {/* Card 1: Today's OPD Consults — Crystal Sky Blue */}
        <div 
          className="stat-card anim-hover-lift" 
          style={{ cursor: 'pointer' }} 
          onClick={() => {
            setScheduleFilter('ALL');
            addToast('Viewing all scheduled oncology patients.', 'info');
          }}
          title="Click to view all scheduled patients"
        >
          <div className="stat-card-accent-blob" style={{ background: 'radial-gradient(circle, #e0f2fe 0%, rgba(224, 242, 254, 0) 70%)' }} />
          <div className="stat-squircle-badge" style={{ background: 'linear-gradient(135deg, #7dd3fc, #38bdf8)', color: '#ffffff', boxShadow: '0 4px 12px rgba(56, 189, 248, 0.35)' }}>
            <Users size={16} strokeWidth={2.4} />
          </div>
          <div className="stat-card-value" style={{ color: 'var(--doc-banner-title, #0369a1)' }}>{patients.length}</div>
          <div className="stat-card-label">Scheduled Patients</div>
          <div style={{ fontSize: 10.5, color: 'var(--doc-accent-color, #0284c7)', marginTop: 4, fontWeight: 700 }}>
            3 AI Ready • 1 In Consultation
          </div>
        </div>

        {/* Card 2: AI Risk Alerts — Alert Crimson (#dc2626 & #b91c1c) */}
        <div 
          className="stat-card anim-hover-lift" 
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
            Recurrence Watch & Toxicity
          </div>
        </div>

        {/* Card 3: Active Chemotherapy — Luminous Cyan & Sky Blue */}
        <div 
          className="stat-card anim-hover-lift"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setSelectedChair(infusions[0]);
            addToast('Opening Chemotherapy Daycare infusion manager.', 'info');
          }}
          title="Click to inspect Daycare Chemotherapy Suite"
        >
          <div className="stat-card-accent-blob" style={{ background: 'radial-gradient(circle, #e0f2fe 0%, rgba(224, 242, 254, 0) 70%)' }} />
          <div className="stat-squircle-badge" style={{ background: 'linear-gradient(135deg, #38bdf8, #0284c7)', color: '#ffffff', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.35)' }}>
            <Pill size={16} strokeWidth={2.4} />
          </div>
          <div className="stat-card-value" style={{ color: '#0284c7' }}>{infusions.length}</div>
          <div className="stat-card-label">Active Chemo Protocols</div>
          <div style={{ fontSize: 10.5, color: '#0284c7', marginTop: 4, fontWeight: 700 }}>
            {infusions.filter(c => !c.isPaused).length} Pumps Running
          </div>
        </div>

        {/* Card 4: Diagnostic Reviews — Clinical Amber Gold (#d97706 & #b45309) */}
        <div 
          className="stat-card anim-hover-lift"
          style={{ cursor: 'pointer' }}
          onClick={() => setIsDiagnosticsModalOpen(true)}
          title="Click to inspect pending radiology & imaging studies"
        >
          <div className="stat-card-accent-blob" style={{ background: 'radial-gradient(circle, #fef3c7 0%, rgba(254, 243, 199, 0) 70%)' }} />
          <div className="stat-squircle-badge" style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', color: '#ffffff', boxShadow: '0 4px 10px rgba(217, 119, 6, 0.35)' }}>
            <Layers size={16} strokeWidth={2.4} />
          </div>
          <div className="stat-card-value" style={{ color: '#b45309' }}>{pendingDiagnostics.length}</div>
          <div className="stat-card-label">Pending Diagnostic Studies</div>
          <div style={{ fontSize: 10.5, color: '#b45309', marginTop: 4, fontWeight: 700 }}>
            2 Contrast PET-CT • 1 Breast MRI
          </div>
        </div>

      </div>

      {/* =========================================================================
          Main 2-Column Dashboard Grid with Internal Scroll Containment
          ========================================================================= */}
      <div style={{ 
        flex: 1, 
        minHeight: 'min-content', 
        display: 'grid', 
        gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)', 
        gap: 12 
      }}>

        {/* LEFT COLUMN: Visual Case Mix & Live Daycare Infusion Monitoring */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          {/* VISUAL 1: Oncological Case Mix & Cancer Staging Distribution */}
          <div className="card anim-hover-lift" style={{ padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
            <div className="stat-card-accent-blob" style={{ top: -14, right: -14, width: 72, height: 72, opacity: 0.45, background: 'radial-gradient(circle, var(--doc-pill-bg, #e0f2fe) 0%, rgba(224, 242, 254, 0) 70%)' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="stat-squircle-badge" style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--doc-brand-gradient, linear-gradient(135deg, #7dd3fc, #38bdf8))', color: '#ffffff' }}>
                  <TrendingUp size={15} />
                </div>
                <div>
                  <h3 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Active Oncology Case Mix & Staging Breakdown
                  </h3>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                    Click any tumor category to inspect staging & NCCN protocols
                  </span>
                </div>
              </div>
              <span className="brand-counter-pill" style={{ fontSize: 9.5, background: 'var(--doc-pill-bg, #e0f2fe)', color: 'var(--doc-pill-color, #0284c7)', border: '1px solid var(--doc-pill-border, #bae6fd)', fontWeight: 700 }}>Interactive Cohort</span>
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
                      addToast(isSelected ? 'Cleared tumor filter.' : `Inspecting ${item.shortSite} treatment pathway.`, 'info');
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

          {/* VISUAL 2: Daycare Chemotherapy Chair Live Infusion Tracker */}
          <div className="card anim-hover-lift" style={{ padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
            <div className="stat-card-accent-blob" style={{ top: -14, right: -14, width: 72, height: 72, opacity: 0.45, background: 'radial-gradient(circle, var(--doc-pill-bg, #e0f2fe) 0%, rgba(224, 242, 254, 0) 70%)' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="stat-squircle-badge" style={{ background: 'var(--doc-brand-gradient, linear-gradient(135deg, #7dd3fc, #38bdf8))', color: '#ffffff', boxShadow: 'var(--doc-brand-shadow, 0 4px 10px rgba(56, 189, 248, 0.35))' }}>
                  <Activity size={15} />
                </div>
                <div>
                  <h3 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Daycare Chemotherapy Live Infusion Monitor
                  </h3>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                    Real-time infusion flow pumps • Click any chair to inspect flowsheet
                  </span>
                </div>
              </div>
              <div className="brand-counter-pill" style={{ height: 22, fontSize: 9.5, background: 'var(--doc-pill-bg, #e0f2fe)', color: 'var(--doc-pill-color, #0284c7)', border: '1px solid var(--doc-pill-border, #bae6fd)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span className="live-dot" style={{ backgroundColor: 'var(--doc-accent-color, #0284c7)' }} />
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
                        <span className="mrn-tag" style={{ fontSize: 10, background: '#e0f2fe', color: '#0369a1' }}>
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
                      <span style={{ color: '#0077B6', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
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
          <div className="card anim-hover-lift" style={{ padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
            <div className="stat-card-accent-blob" style={{ top: -14, right: -14, width: 72, height: 72, opacity: 0.45, background: 'radial-gradient(circle, #fecaca 0%, rgba(254, 202, 202, 0) 70%)' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="stat-squircle-badge" style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#ffffff', boxShadow: '0 4px 10px rgba(220, 38, 38, 0.35)' }}>
                  <ShieldAlert size={15} />
                </div>
                <div>
                  <h3 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    OncoInsight Sentinel AI Watchlist
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
                const bgTint = isCrit ? 'var(--destructive-container, #fee2e2)' : isGen ? 'var(--doc-pill-bg, #e0f2fe)' : 'var(--warning-container, #fef3c7)';
                const borderTint = isCrit ? 'var(--destructive, #dc2626)' : isGen ? 'var(--doc-accent-color, #0284c7)' : 'var(--warning, #d97706)';
                const titleColor = isCrit ? 'var(--on-destructive-container, #991b1b)' : isGen ? 'var(--doc-pill-color, #0284c7)' : 'var(--on-warning-container, #78350f)';
                const btnColor = isCrit ? '#dc2626' : isGen ? '#0284c7' : '#d97706';

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
          <div className="card anim-hover-lift" style={{ padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
            <div className="stat-card-accent-blob" style={{ top: -14, right: -14, width: 72, height: 72, opacity: 0.45, background: 'radial-gradient(circle, var(--doc-pill-bg, #e0f2fe) 0%, rgba(224, 242, 254, 0) 70%)' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="stat-squircle-badge" style={{ background: 'var(--doc-brand-gradient, linear-gradient(135deg, #7dd3fc, #38bdf8))', color: '#ffffff', boxShadow: 'var(--doc-brand-shadow, 0 4px 10px rgba(56, 189, 248, 0.35))' }}>
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
              <span className="brand-counter-pill" style={{ fontSize: 10, background: 'var(--doc-pill-bg, #e0f2fe)', color: 'var(--doc-pill-color, #0284c7)', border: '1px solid var(--doc-pill-border, #bae6fd)', fontWeight: 700 }}>{filteredPatients.length} Shown</span>
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
                      border: scheduleFilter === tab.id ? '1px solid var(--doc-accent-color, #0284c7)' : '1px solid var(--border-default)',
                      backgroundColor: scheduleFilter === tab.id ? 'var(--doc-accent-color, #0284c7)' : 'var(--bg-subtle)',
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
                        <div className="patient-avatar-chip" style={{ width: 26, height: 26, fontSize: 10, background: 'linear-gradient(135deg, #03045E, #0077B6)' }}>
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
                          <span className="brand-counter-pill" style={{ fontSize: 9.5, padding: '1.5px 6px', background: '#CAF0F8', color: '#03045E', border: '1px solid #90E0EF', fontWeight: 700 }}>
                            <Sparkles size={9} /> AI Ready
                          </span>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: 9.5, padding: '1.5px 6px' }}>
                            {p.status.replace('_', ' ')}
                          </span>
                        )}
                        <span style={{ fontSize: 10.5, color: '#0077B6', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
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
                <FileText size={14} color="#0077B6" />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Oncologist Shift Voice Memo & Dictation
                </span>
              </div>
              <SpeechMicButton onTranscript={(txt) => setQuickNote(prev => prev ? `${prev} ${txt}` : txt)} />
            </div>

            <textarea
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              placeholder="Dictate or type quick clinical notes, tumor board points, or patient reminders..."
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
                  style={{ height: 26, fontSize: 10.5, padding: '0 12px', background: 'linear-gradient(135deg, #0077B6, #00B4D8)', color: '#ffffff', border: 'none' }}
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
          MODAL 1: Daycare Chemotherapy Chair Flowsheet & Pump Controller
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
                    {selectedChair.chair} — Chemotherapy Infusion Flowsheet
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
                <div className="stat-squircle-badge" style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #03045E, #0077B6)', color: '#ffffff' }}>
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="brand-counter-pill" style={{ fontSize: 9.5, background: '#CAF0F8', color: '#03045E', border: '1px solid #90E0EF', fontWeight: 700 }}>{activeAlertModal.level}</span>
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
              <div style={{ padding: 12, backgroundColor: '#CAF0F833', border: '1.5px solid #0077B6', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#03045E', marginBottom: 4 }}>
                  Patient: {activeAlertModal.patientName} ({activeAlertModal.age}y {activeAlertModal.gender}) • {activeAlertModal.mrn}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.45 }}>
                  {activeAlertModal.desc}
                </div>
              </div>

              {/* Rationale & Actions */}
              <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                  OncoInsight Model Rationale & Guidance:
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
                  <Plus size={14} color="#0077B6" />
                  <span>1-Click: Append Recommendations to Patient Treatment Plan</span>
                </button>
                <button
                  onClick={() => {
                    addToast(`Ordered STAT Biomarker Panel & Re-staging scan for ${activeAlertModal.patientName}.`, 'success');
                  }}
                  className="m3-btn m3-btn-tonal"
                  style={{ height: 34, fontSize: 11.5, justifyContent: 'flex-start' }}
                >
                  <Layers size={14} color="#00B4D8" />
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
                style={{ background: 'linear-gradient(135deg, #0077B6, #00B4D8)', height: 34, fontSize: 11.5 }}
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
                      <span className="mrn-tag" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: 10 }}>
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
                <div className="stat-squircle-badge" style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #03045E, #0077B6)', color: '#ffffff' }}>
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Active Sentinel AI Clinical Alerts ({sentinelAlerts.length})
                  </h3>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Continuous safety monitoring across Station 03 oncology patients
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
                      <span className="brand-counter-pill" style={{ fontSize: 9.5, background: '#CAF0F8', color: '#03045E', border: '1px solid #90E0EF', fontWeight: 700 }}>{alert.level}</span>
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
                      style={{ height: 26, fontSize: 10.5, background: 'linear-gradient(135deg, #0077B6, #00B4D8)', color: '#ffffff', border: 'none' }}
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
