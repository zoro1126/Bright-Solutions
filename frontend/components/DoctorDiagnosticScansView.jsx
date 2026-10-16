import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Filter,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Sun,
  Ruler,
  AlertCircle,
  FileText,
  Download,
  Printer,
  Sparkles,
  Stethoscope,
  ChevronRight,
  Eye,
  CheckCircle2,
  Upload,
  X,
  FileCheck,
  Calendar,
  Activity,
  ArrowRight
} from 'lucide-react';
import { usePatients } from '../context/PatientContext';

// Comprehensive catalog of all uploaded scans and diagnostic reports across patients
const ALL_DIAGNOSTIC_STUDIES = [
  {
    id: 'study-101',
    patientId: 'pat-001',
    patientName: 'Ananya Sharma',
    patientMrn: 'MRN-2026-0142',
    modality: 'CT',
    title: 'High-Resolution Contrast-Enhanced Chest CT Scan',
    studyDate: 'Today, 08:30 AM',
    series: 'Axial HRCT Chest with IV Contrast',
    slicesCount: 148,
    radiologist: 'Dr. Swaminathan, MD (Consultant Radiologist)',
    findingStatus: 'ABNORMAL_URGENT',
    findingSummary: '2.3 cm nodular parenchymal opacity in Right Upper Lobe (RUL) apical segment with spiculation. Subcentimeter mediastinal lymph nodes noted.',
    reportPdfName: 'RAD-CT-2026-88102-CHEST.pdf',
    presetWindow: 'Lung (WW:1500 WL:-600)',
    urgency: 'HIGH',
    attachedBiomarker: 'CEA 4.2 ng/mL • CA 15-3 28 U/mL'
  },
  {
    id: 'study-102',
    patientId: 'pat-001',
    patientName: 'Ananya Sharma',
    patientMrn: 'MRN-2026-0142',
    modality: 'ECG',
    title: '12-Lead Electrocardiogram & 2D Transthoracic Echo',
    studyDate: 'Today, 08:40 AM',
    series: '12-Lead Standard Limb & Precordial Tracing',
    slicesCount: 1,
    radiologist: 'Dr. Radhika Sen, DM (Cardiology)',
    findingStatus: 'NORMAL',
    findingSummary: 'Normal sinus rhythm, heart rate 74 bpm. Borderline Sokolow-Lyon criteria for left ventricular hypertrophy. Ejection fraction 62%.',
    reportPdfName: 'CARD-ECG-2026-0914.pdf',
    presetWindow: 'Electrocardiograph',
    urgency: 'ROUTINE',
    attachedBiomarker: 'Trop-I < 0.01 ng/mL'
  },
  {
    id: 'study-103',
    patientId: 'pat-001',
    patientName: 'Ananya Sharma',
    patientMrn: 'MRN-2026-0142',
    modality: 'LAB',
    title: 'Comprehensive Metabolic Panel & Fasting Lipid Profile',
    studyDate: 'Today, 08:15 AM',
    series: 'Clinical Biochemistry & Automated Photometry',
    slicesCount: 4,
    radiologist: 'Dr. R. Meenakshi, MD (Pathology / Lab Medicine)',
    findingStatus: 'ABNORMAL_MONITOR',
    findingSummary: 'Fasting Blood Sugar 104 mg/dL. Total Cholesterol 224 mg/dL (Elevated), LDL 142 mg/dL. Serum Creatinine 0.9 mg/dL with eGFR 92 mL/min.',
    reportPdfName: 'LAB-BIO-2026-4401.pdf',
    presetWindow: 'Lab Report (4 Pages)',
    urgency: 'MEDIUM',
    attachedBiomarker: 'HbA1c 6.1%'
  },
  {
    id: 'study-104',
    patientId: 'pat-002',
    patientName: 'Rajan Pillai',
    patientMrn: 'MRN-2026-0143',
    modality: 'MRI',
    title: 'Brain MRI Sequence with Contrast & 3D FLAIR',
    studyDate: '12 Oct 2026',
    series: 'Axial T1/T2, Coronal FLAIR, DWI & ADC',
    slicesCount: 148,
    radiologist: 'Dr. Swaminathan, MD (Consultant Radiologist)',
    findingStatus: 'NORMAL',
    findingSummary: 'Scattered microvascular ischemic changes in deep periventricular white matter (Fazekas Grade 1). No acute cerebral infarction or intracranial mass.',
    reportPdfName: 'RAD-MRI-2026-7721-BRAIN.pdf',
    presetWindow: 'Brain (WW:80 WL:40)',
    urgency: 'ROUTINE',
    attachedBiomarker: 'HbA1c 8.4%'
  },
  {
    id: 'study-105',
    patientId: 'pat-002',
    patientName: 'Rajan Pillai',
    patientMrn: 'MRN-2026-0143',
    modality: 'USG',
    title: 'Bilateral Lower Extremity Arterial Doppler Ultrasound',
    studyDate: '12 Oct 2026',
    series: 'High-Resolution Duplex Color Doppler',
    slicesCount: 24,
    radiologist: 'Dr. Swaminathan, MD (Consultant Radiologist)',
    findingStatus: 'NORMAL',
    findingSummary: 'Triphasic velocity waveforms preserved in bilateral anterior and posterior tibial arteries. No significant arterial occlusive plaque or aneurysm.',
    reportPdfName: 'USG-DOPPLER-2026-512.pdf',
    presetWindow: 'Ultrasound',
    urgency: 'ROUTINE',
    attachedBiomarker: 'ABI 1.05 Bilateral'
  },
  {
    id: 'study-106',
    patientId: 'pat-003',
    patientName: 'Meera Nair',
    patientMrn: 'MRN-2026-0144',
    modality: 'USG',
    title: 'High-Resolution Neck & Thyroid Ultrasound with Color Doppler',
    studyDate: '08 Oct 2026',
    series: 'High-Frequency Linear Probe Scanning',
    slicesCount: 18,
    radiologist: 'Dr. Swaminathan, MD (Consultant Radiologist)',
    findingStatus: 'ABNORMAL_MONITOR',
    findingSummary: 'Diffusely heterogeneous thyroid parenchyma with coarse micronodularity and normal vascularity, characteristic of Hashimoto autoimmune thyroiditis (TIRADS 2).',
    reportPdfName: 'USG-THYROID-2026-309.pdf',
    presetWindow: 'Ultrasound',
    urgency: 'MEDIUM',
    attachedBiomarker: 'TSH 9.2 mIU/L • Anti-TPO > 450'
  },
  {
    id: 'study-107',
    patientId: 'pat-003',
    patientName: 'Meera Nair',
    patientMrn: 'MRN-2026-0144',
    modality: 'LAB',
    title: 'Complete Thyroid & Automated Hematology Panel',
    studyDate: '08 Oct 2026',
    series: 'Chemiluminescence & Automated Cell Counter',
    slicesCount: 2,
    radiologist: 'Dr. R. Meenakshi, MD (Pathology)',
    findingStatus: 'ABNORMAL_MONITOR',
    findingSummary: 'Serum TSH elevated at 9.2 mIU/L with borderline low Free T4 (0.8 ng/dL). Hemoglobin 10.4 g/dL with microcytosis (MCV 74 fL) and low ferritin (12 ng/mL).',
    reportPdfName: 'LAB-THY-2026-992.pdf',
    presetWindow: 'Lab Report',
    urgency: 'MEDIUM',
    attachedBiomarker: 'Ferritin 12 ng/mL'
  },
  {
    id: 'study-108',
    patientId: 'pat-004',
    patientName: 'Devendra Kapoor',
    patientMrn: 'MRN-2026-0145',
    modality: 'MRI',
    title: 'Lumbo-Sacral Spine MRI with Sagittal & Axial T1/T2',
    studyDate: '14 Oct 2026',
    series: 'Multi-echo Spine Protocol (L1-S1)',
    slicesCount: 96,
    radiologist: 'Dr. Swaminathan, MD (Consultant Radiologist)',
    findingStatus: 'ABNORMAL_URGENT',
    findingSummary: 'Broad-based posterocentral and right paracentral disc protrusion at L4-L5 causing mild-to-moderate thecal sac indentation and right traversing L5 root compression.',
    reportPdfName: 'RAD-MRI-2026-SPINE-L4L5.pdf',
    presetWindow: 'Bone / Soft Tissue',
    urgency: 'HIGH',
    attachedBiomarker: 'SLR Positive Right'
  },
  {
    id: 'study-109',
    patientId: 'pat-004',
    patientName: 'Devendra Kapoor',
    patientMrn: 'MRN-2026-0145',
    modality: 'X-RAY',
    title: 'Digital Standing Spine Radiograph (AP & Lateral X-Ray)',
    studyDate: '14 Oct 2026',
    series: 'Digital Radiography (DR)',
    slicesCount: 2,
    radiologist: 'Dr. Swaminathan, MD (Consultant Radiologist)',
    findingStatus: 'NORMAL',
    findingSummary: 'Mild loss of physiologic lumbar lordosis secondary to muscular spasm. Intervertebral disc space heights preserved without spondylolisthesis.',
    reportPdfName: 'RAD-XRAY-2026-LUMBAR.pdf',
    presetWindow: 'X-Ray Radiograph',
    urgency: 'ROUTINE',
    attachedBiomarker: 'Normal Alignment'
  },
  {
    id: 'study-110',
    patientId: 'pat-005',
    patientName: 'Sunita Rao',
    patientMrn: 'MRN-2026-0146',
    modality: 'USG',
    title: 'Post-Operative Upper Abdominal Ultrasound',
    studyDate: 'Today, 10:15 AM',
    series: 'Transabdominal Convex Probe (C5-2)',
    slicesCount: 12,
    radiologist: 'Dr. Swaminathan, MD (Consultant Radiologist)',
    findingStatus: 'NORMAL',
    findingSummary: 'Surgical gallbladder bed clear with no evidence of fluid collection, biloma, or hematoma. Common bile duct caliber normal at 4.2 mm with smooth flow.',
    reportPdfName: 'USG-POSTOP-2026-441.pdf',
    presetWindow: 'Ultrasound',
    urgency: 'ROUTINE',
    attachedBiomarker: 'Bilirubin Total 0.8 mg/dL'
  },
  {
    id: 'study-111',
    patientId: 'pat-005',
    patientName: 'Sunita Rao',
    patientMrn: 'MRN-2026-0146',
    modality: 'LAB',
    title: 'Surgical Gallbladder Biopsy Histopathology Report',
    studyDate: '01 Oct 2026',
    series: 'Gross & Microscopic Tissue Examination',
    slicesCount: 3,
    radiologist: 'Dr. R. Meenakshi, MD (Pathology / Histopathology)',
    findingStatus: 'NORMAL',
    findingSummary: 'Multiple mixed cholesterol and pigmented calculi. Mucosa shows chronic inflammatory infiltrate with Rokitansky-Aschoff sinuses. Negative for dysplasia or neoplasm.',
    reportPdfName: 'PATH-HISTO-2026-CHOLE.pdf',
    presetWindow: 'Pathology Report',
    urgency: 'ROUTINE',
    attachedBiomarker: 'Benign Calculous Cholecystitis'
  }
];

export default function DoctorDiagnosticScansView({
  patients = [],
  selectedPatientId,
  onSelectPatient,
  onOpenWorkspace
}) {
  const { addToast } = usePatients();
  
  // State: Modality filter
  const [modalityFilter, setModalityFilter] = useState('ALL'); // 'ALL' | 'CT' | 'MRI' | 'X-RAY' | 'USG' | 'LAB'
  const [patientFilter, setPatientFilter] = useState(selectedPatientId || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State: Active selected study in DICOM viewer
  const [activeStudyId, setActiveStudyId] = useState('study-101');
  const [currentSlice, setCurrentSlice] = useState(74);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [windowPreset, setWindowPreset] = useState('Lung (WW:1500 WL:-600)');
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // New simulated upload form
  const [uploadData, setUploadData] = useState({
    patientMrn: 'MRN-2026-0142',
    modality: 'CT',
    studyTitle: '',
    sliceCount: 120
  });

  // Filtered Studies List
  const filteredStudies = useMemo(() => {
    return ALL_DIAGNOSTIC_STUDIES.filter(s => {
      if (modalityFilter !== 'ALL' && s.modality !== modalityFilter) return false;
      if (patientFilter !== 'ALL' && s.patientId !== patientFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = s.title.toLowerCase().includes(q) ||
                      s.patientName.toLowerCase().includes(q) ||
                      s.patientMrn.toLowerCase().includes(q) ||
                      s.findingSummary.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [modalityFilter, patientFilter, searchQuery]);

  // Active Loaded Study Object
  const activeStudy = ALL_DIAGNOSTIC_STUDIES.find(s => s.id === activeStudyId) || filteredStudies[0] || ALL_DIAGNOSTIC_STUDIES[0];

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    setIsUploadModalOpen(false);
    addToast(`Successfully ingested and attached ${uploadData.studyTitle || 'New Scan Series'} to ${uploadData.patientMrn}!`, 'success');
  };

  return (
    <main 
      className="page-container doctor-page-container m3-page-animate" 
      style={{ 
        maxWidth: '100%', 
        width: '100%', 
        margin: 0, 
        padding: '16px 20px 60px', 
        boxSizing: 'border-box',
        overflowY: 'auto',
        overflowX: 'hidden',
        height: 'calc(100vh - 50px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}
    >
      
      {/* Header Banner: Hospital PACS & Diagnostic Scans Center */}
      <div className="m3-doctor-patient-banner" style={{ flexShrink: 0, marginBottom: 0, border: '1.5px solid var(--doc-banner-border, #bfdbfe)', background: 'var(--doc-banner-bg, linear-gradient(135deg, #ffffff 0%, #edf8fc 100%))' }}>
        <div className="stat-card-accent-blob" style={{ top: -20, right: -20, width: 100, height: 100, opacity: 0.65, background: 'radial-gradient(circle, var(--doc-accent-color, #00B4D8) 0%, rgba(0, 180, 216, 0) 70%)' }} />
        
        <div className="m3-patient-banner-info" style={{ position: 'relative', zIndex: 1 }}>
          <div className="stat-squircle-badge" style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--doc-brand-gradient, linear-gradient(135deg, #0f172a, #1e3a8a))', color: '#ffffff', boxShadow: 'var(--doc-brand-shadow, 0 4px 10px rgba(30, 58, 138, 0.35))' }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--doc-banner-title, #0f172a)', letterSpacing: '-0.02em', margin: 0 }}>
                Hospital PACS Diagnostic Scans & Laboratory Reports Center
              </h2>
              <span className="brand-counter-pill" style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', fontWeight: 800, fontSize: 10 }}>
                DICOM 3.0 WebPACS & Cloud Repository
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, marginBottom: 0 }}>
              Central repository for all uploaded cross-sectional DICOM series (CT, MRI), digital radiography (X-Ray), ultrasound sonography, and pathology lab reports.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
          <button
            type="button"
            className="m3-btn m3-btn-tonal"
            onClick={() => setIsUploadModalOpen(true)}
            style={{ height: 32, fontSize: 11.5, gap: 5 }}
          >
            <Upload size={13} />
            <span>+ Upload Scan Study</span>
          </button>

          <button
            type="button"
            className="m3-btn m3-btn-filled"
            onClick={() => onOpenWorkspace?.(activeStudy.patientId)}
            style={{ height: 32, fontSize: 11.5, background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: '#ffffff', gap: 6 }}
          >
            <Stethoscope size={14} />
            <span>Consult with {activeStudy.patientName.split(' ')[0]} →</span>
          </button>
        </div>
      </div>

      {/* Filter and Selection Controls Bar */}
      <div 
        className="card" 
        style={{ 
          padding: '10px 14px', 
          marginBottom: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: 12, 
          flexWrap: 'wrap',
          flexShrink: 0,
          minHeight: 'fit-content'
        }}
      >
        
        {/* Modality Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
          {[
            { id: 'ALL', label: 'All Studies (11)' },
            { id: 'CT', label: 'CT Scans' },
            { id: 'MRI', label: 'MRI Sequences' },
            { id: 'X-RAY', label: 'Digital X-Rays' },
            { id: 'USG', label: 'Ultrasound & Echo' },
            { id: 'LAB', label: 'Pathology & Lab Reports' }
          ].map(m => (
            <button
              key={m.id}
              type="button"
              className="m3-btn anim-hover-lift"
              onClick={() => setModalityFilter(m.id)}
              style={{
                height: 30,
                fontSize: 11,
                padding: '0 12px',
                borderRadius: 9999,
                fontWeight: modalityFilter === m.id ? 800 : 600,
                background: modalityFilter === m.id ? '#0077B6' : '#edf8fc',
                color: modalityFilter === m.id ? '#ffffff' : '#0077B6',
                border: modalityFilter === m.id ? 'none' : '1.5px solid #bfe7f5',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: modalityFilter === m.id ? '0 2px 8px rgba(0, 119, 182, 0.25)' : 'none'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Patient Selection Dropdown & Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <select
            value={patientFilter}
            onChange={(e) => setPatientFilter(e.target.value)}
            style={{
              height: 32,
              fontSize: 11.5,
              padding: '0 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontWeight: 600
            }}
          >
            <option value="ALL">All Consulted Patients (Entire Cohort)</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.fullName} ({p.mrn})</option>
            ))}
          </select>

          <div style={{ position: 'relative', width: 200 }}>
            <Search size={13} style={{ position: 'absolute', left: 8, top: 10, color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Filter scans / keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: 32,
                padding: '0 8px 0 28px',
                fontSize: 11.5,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
      </div>

      {/* Main PACS Split Stage: Uploaded Studies Catalog (Left) + Interactive DICOM/Report Viewer (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, alignItems: 'start', flexShrink: 0, paddingBottom: 24 }}>
        
        {/* LEFT COLUMN: Uploaded Diagnostic Studies List */}
        <div className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 'calc(100vh - 210px)', minHeight: 460, position: 'sticky', top: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Uploaded Studies ({filteredStudies.length})
            </span>
            <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
              Click to load in PACS
            </span>
          </div>

          <div className="smart-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
            {filteredStudies.map(study => {
              const isSelected = study.id === activeStudy.id;

              return (
                <div
                  key={study.id}
                  onClick={() => {
                    setActiveStudyId(study.id);
                    setCurrentSlice(Math.min(74, study.slicesCount));
                  }}
                  className="anim-hover-lift"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--doc-accent-color, #0077B6)' : '1px solid var(--border-default)',
                    background: isSelected ? 'var(--doc-pill-bg, #CAF0F8)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 3px 10px rgba(0, 119, 182, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 900,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: study.modality === 'CT' ? '#eff6ff' : study.modality === 'MRI' ? '#f5f3ff' : study.modality === 'LAB' ? '#fef2f2' : '#ecfdf5',
                      color: study.modality === 'CT' ? '#1d4ed8' : study.modality === 'MRI' ? '#6d28d9' : study.modality === 'LAB' ? '#b91c1c' : '#047857'
                    }}>
                      {study.modality}
                    </span>

                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {study.studyDate}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {study.title}
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                    {study.patientName} • <strong style={{ fontFamily: 'var(--font-mono)' }}>{study.patientMrn}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, fontSize: 10.5 }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {study.slicesCount} {study.slicesCount === 1 ? 'Frame' : 'Slices'}
                    </span>

                    {study.findingStatus === 'ABNORMAL_URGENT' ? (
                      <span style={{ color: '#dc2626', fontWeight: 700 }}>
                        ● Urgent Finding
                      </span>
                    ) : study.findingStatus === 'ABNORMAL_MONITOR' ? (
                      <span style={{ color: '#d97706', fontWeight: 700 }}>
                        ● Monitor
                      </span>
                    ) : (
                      <span style={{ color: '#15803d', fontWeight: 700 }}>
                        ✓ Normal Study
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive DICOM Imaging & Lab Report Canvas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Card 1: DICOM PACS Viewport Container */}
          <div className="dicom-viewport-container" style={{ flexShrink: 0 }}>
            
            {/* Top Toolbar */}
            <div className="dicom-controls-bar" style={{ minHeight: 48, height: 'auto', padding: '8px 14px', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f8fafc', fontSize: 13, fontWeight: 700, flexWrap: 'wrap' }}>
                <Layers size={16} color="#38bdf8" />
                <span>{activeStudy.title}</span>
                <span style={{ fontSize: 11, color: '#94a3b8', background: '#1e293b', padding: '2px 8px', borderRadius: 4 }}>
                  {activeStudy.patientName} ({activeStudy.patientMrn}) • Slice {currentSlice} / {activeStudy.slicesCount}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
                <button
                  type="button"
                  className="m3-btn m3-btn-tonal"
                  style={{ height: 28, fontSize: 11, padding: '0 8px', background: '#1f2937', color: '#f8fafc', border: '1px solid #374151', whiteSpace: 'nowrap' }}
                  onClick={() => setZoomLevel(p => Math.min(p + 20, 200))}
                  title="Zoom In"
                >
                  <ZoomIn size={13} /> {zoomLevel}%
                </button>
                <button
                  type="button"
                  className="m3-btn m3-btn-tonal"
                  style={{ height: 28, fontSize: 11, padding: '0 8px', background: '#1f2937', color: '#f8fafc', border: '1px solid #374151', whiteSpace: 'nowrap' }}
                  onClick={() => setZoomLevel(p => Math.max(p - 20, 80))}
                  title="Zoom Out"
                >
                  <ZoomOut size={13} />
                </button>
                <button
                  type="button"
                  className="m3-btn m3-btn-tonal"
                  style={{ height: 28, fontSize: 11, padding: '0 8px', background: '#1f2937', color: '#f8fafc', border: '1px solid #374151', whiteSpace: 'nowrap' }}
                >
                  <Sun size={13} /> {windowPreset.split(' ')[0]}
                </button>
                <button
                  type="button"
                  className="m3-btn m3-btn-tonal"
                  style={{ height: 28, fontSize: 11, padding: '0 8px', background: '#1f2937', color: '#f8fafc', border: '1px solid #374151', whiteSpace: 'nowrap' }}
                  onClick={() => addToast('Calibrated electronic caliper on focal lesion: 23.4 mm diameter', 'info')}
                >
                  <Ruler size={13} /> Caliper
                </button>
                <button
                  type="button"
                  className="m3-btn m3-btn-tonal"
                  style={{ height: 28, fontSize: 11, padding: '0 8px', background: '#1f2937', color: '#f8fafc', border: '1px solid #374151', whiteSpace: 'nowrap' }}
                  onClick={() => setIsFullscreenModalOpen(true)}
                  title="Maximize High-Resolution PACS Viewport"
                >
                  <Maximize2 size={13} /> Maximize
                </button>
              </div>
            </div>

            {/* Radiological Canvas Area */}
            <div className="dicom-canvas-area" style={{ height: 350, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              
              {/* Overlay Crosshair / Modality Presentation */}
              <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
                <div style={{
                  width: 200,
                  height: 200,
                  border: '2px dashed rgba(56, 189, 248, 0.45)',
                  borderRadius: '50%',
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
                  transform: `scale(${zoomLevel / 100})`,
                  transition: 'transform 0.15s ease'
                }}>
                  {activeStudy.modality === 'CT' && (
                    <div style={{ border: '1.5px solid #22c55e', padding: '4px 10px', borderRadius: 4, background: 'rgba(0,0,0,0.65)', fontSize: 11, color: '#4ade80', fontWeight: 700 }}>
                      📌 2.3 cm Nodular Opacity (RUL)
                    </div>
                  )}
                  {activeStudy.modality === 'MRI' && (
                    <div style={{ border: '1.5px solid #38bdf8', padding: '4px 10px', borderRadius: 4, background: 'rgba(0,0,0,0.65)', fontSize: 11, color: '#38bdf8', fontWeight: 700 }}>
                      🧠 High-Signal Intensity (FLAIR)
                    </div>
                  )}
                  {activeStudy.modality === 'X-RAY' && (
                    <div style={{ border: '1.5px solid #facc15', padding: '4px 10px', borderRadius: 4, background: 'rgba(0,0,0,0.65)', fontSize: 11, color: '#facc15', fontWeight: 700 }}>
                      🦴 Cortical Margin Intact
                    </div>
                  )}
                  {activeStudy.modality === 'USG' && (
                    <div style={{ border: '1.5px solid #a855f7', padding: '4px 10px', borderRadius: 4, background: 'rgba(0,0,0,0.65)', fontSize: 11, color: '#c084fc', fontWeight: 700 }}>
                      🌊 Acoustic Window Verified
                    </div>
                  )}
                  {activeStudy.modality === 'LAB' && (
                    <div style={{ border: '1.5px solid #f87171', padding: '4px 10px', borderRadius: 4, background: 'rgba(0,0,0,0.65)', fontSize: 11, color: '#fca5a5', fontWeight: 700 }}>
                      🧪 Automated Photometry Panel
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 14, fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>
                  {activeStudy.series}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  {activeStudy.presetWindow} • Ingested via DICOM PACS C-STORE Gateway
                </div>
              </div>

              {/* Multi-slice scrubber bar */}
              {activeStudy.slicesCount > 1 && (
                <div style={{ position: 'absolute', bottom: 14, left: 24, right: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>Slice 1</span>
                  <input
                    type="range"
                    min="1"
                    max={activeStudy.slicesCount}
                    value={currentSlice}
                    onChange={(e) => setCurrentSlice(Number(e.target.value))}
                    style={{ flex: 1, accentColor: '#38bdf8', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>Slice {activeStudy.slicesCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Radiologist Written Impression & Diagnostic Findings Card */}
          <div className="card" style={{ padding: 18, border: '1.5px solid var(--border-default)', boxShadow: '0 2px 12px rgba(0, 119, 182, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileCheck size={18} color="#2563eb" />
                </div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Official Radiologist Diagnostic Report & Clinical Impression
                  </h4>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                    Signed Diagnostic Findings & Clinical Correlations
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className="m3-btn m3-btn-outlined anim-hover-lift"
                  onClick={() => addToast(`Downloaded ${activeStudy.reportPdfName}`, 'success')}
                  style={{ height: 30, fontSize: 11.5, gap: 5, fontWeight: 700 }}
                >
                  <Download size={13} />
                  <span>Download Report (PDF)</span>
                </button>
                <button
                  type="button"
                  className="m3-btn m3-btn-filled anim-hover-lift"
                  onClick={() => onOpenWorkspace?.(activeStudy.patientId)}
                  style={{ height: 30, fontSize: 11.5, background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: '#ffffff', gap: 6, fontWeight: 700 }}
                >
                  <Stethoscope size={14} />
                  <span>Open Patient Consultation →</span>
                </button>
              </div>
            </div>

            {/* Findings Box */}
            <div style={{ background: 'var(--bg-subtle)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={13} color="#0077B6" />
                <span>Diagnostic Findings & Specialist Observations:</span>
              </div>
              <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>
                {activeStudy.findingSummary}
              </p>
            </div>

            {/* Metadata Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', flexWrap: 'wrap', gap: 8, paddingTop: 8, borderTop: '1px dashed var(--border-subtle)' }}>
              <div>
                Signing Specialist: <strong style={{ color: 'var(--text-primary)' }}>{activeStudy.radiologist}</strong>
              </div>
              <div>
                Linked Biomarkers: <strong style={{ color: 'var(--doc-accent-color, #0077B6)' }}>{activeStudy.attachedBiomarker}</strong>
              </div>
              <div>
                Report File: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: 4 }}>{activeStudy.reportPdfName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pop-up Fullscreen DICOM Dialog */}
      {isFullscreenModalOpen && (
        <div className="m3-modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: 16
        }}>
          <div className="card m3-dialog" style={{ width: '95vw', maxWidth: 1100, height: '85vh', padding: 18, background: '#0f172a', color: '#ffffff', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid #334155', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={18} color="#38bdf8" />
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                  Full-Screen Diagnostic WebPACS: {activeStudy.title}
                </h3>
                <span style={{ fontSize: 11, background: '#1e293b', padding: '2px 8px', borderRadius: 4, color: '#94a3b8' }}>
                  {activeStudy.patientName} ({activeStudy.patientMrn})
                </span>
              </div>
              <button className="icon-btn" onClick={() => setIsFullscreenModalOpen(false)} style={{ color: '#ffffff' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 340, height: 340, border: '2px dashed #38bdf8', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ border: '2px solid #22c55e', padding: '6px 14px', borderRadius: 6, background: 'rgba(0,0,0,0.7)', fontSize: 13, color: '#4ade80', fontWeight: 800 }}>
                    📌 Calibrated Lesion Marker (RUL)
                  </div>
                </div>
                <div style={{ marginTop: 16, fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                  Slice {currentSlice} of {activeStudy.slicesCount} • {activeStudy.presetWindow}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderTop: '1px solid #334155', paddingTop: 10 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Slice 1</span>
              <input
                type="range"
                min="1"
                max={activeStudy.slicesCount}
                value={currentSlice}
                onChange={(e) => setCurrentSlice(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#38bdf8' }}
              />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Slice {activeStudy.slicesCount}</span>
              <button className="m3-btn m3-btn-tonal" onClick={() => setIsFullscreenModalOpen(false)} style={{ height: 32, fontSize: 11 }}>
                Exit Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Upload Scan Modal */}
      {isUploadModalOpen && (
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
          zIndex: 1200,
          padding: 16
        }}>
          <div className="card m3-dialog" style={{ width: '100%', maxWidth: 480, padding: 22, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Upload size={18} color="var(--primary)" />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Upload Diagnostic Scan / PACS Study
                </h3>
              </div>
              <button className="icon-btn" onClick={() => setIsUploadModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Target Patient MRN:
                </label>
                <select
                  value={uploadData.patientMrn}
                  onChange={(e) => setUploadData(p => ({ ...p, patientMrn: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.mrn}>{p.fullName} ({p.mrn})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Imaging Modality:
                </label>
                <select
                  value={uploadData.modality}
                  onChange={(e) => setUploadData(p => ({ ...p, modality: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                >
                  <option value="CT">Computed Tomography (CT)</option>
                  <option value="MRI">Magnetic Resonance Imaging (MRI)</option>
                  <option value="X-RAY">Digital Radiograph (X-Ray)</option>
                  <option value="USG">Ultrasonography & Doppler (USG)</option>
                  <option value="LAB">Pathology & Laboratory Report</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Study Title / Protocol Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Contrast-Enhanced Chest CT Scan"
                  value={uploadData.studyTitle}
                  onChange={(e) => setUploadData(p => ({ ...p, studyTitle: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  className="m3-btn m3-btn-tonal"
                  onClick={() => setIsUploadModalOpen(false)}
                  style={{ height: 32, fontSize: 11.5 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="m3-btn m3-btn-filled"
                  style={{ height: 32, fontSize: 11.5, background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: '#ffffff' }}
                >
                  Confirm Ingestion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
