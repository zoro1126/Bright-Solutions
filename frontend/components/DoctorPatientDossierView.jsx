import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  FileText, 
  Stethoscope, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  ArrowRight, 
  Activity, 
  Pill, 
  Layers, 
  ShieldCheck, 
  Printer, 
  Download, 
  Plus, 
  ChevronRight,
  ExternalLink,
  Sparkles,
  Phone,
  MapPin,
  Heart,
  BadgeAlert,
  X,
  MoreVertical,
  Eye
} from 'lucide-react';
import { usePatients } from '../context/PatientContext';

// Extended longitudinal records for Dr. Kiran Patel's consulted cohort
const EXTENDED_PATIENT_DOSSIER = {
  'pat-001': {
    lastConsultDate: 'Today, 09:15 AM',
    lastConsultLocation: 'OPD Station 03 • Internal Medicine',
    upcomingDate: '23 Oct 2026, 09:00 AM',
    upcomingDaysLabel: 'In 7 Days',
    upcomingPurpose: 'Repeat Contrast-Enhanced Chest CT & Fasting Lipid Panel Evaluation',
    icdDiagnosis: 'I10 (Essential Primary Hypertension) • E78.2 (Mixed Hyperlipidemia) • R51.9 (Headache, Unspecified)',
    clinicalConsultSummary: 'Patient presented with 6-week progressive tension-type headaches, morning dizziness, and persistently elevated systolic readings (home monitoring 150/95 mmHg). Clinical evaluation showed no focal neurological deficits. Initiated dose titration for Telmisartan and ordered contrast-enhanced chest CT to evaluate incidental 2.3 cm nodular density seen on screening.',
    priorVisitsHistory: [
      { date: '16 Oct 2026 (Today)', doctor: 'Dr. Kiran Patel, MD', reason: 'Tension headaches, hypertension review & CT scan follow-up', outcome: 'Prescriptions titrated; 7-day follow-up booked' },
      { date: '28 Sep 2026', doctor: 'Dr. Kiran Patel, MD', reason: 'Routine 3-month cardiovascular & lipid checkup', outcome: 'Atorvastatin continued; advised sodium restriction' },
      { date: '10 Aug 2026', doctor: 'Dr. Kiran Patel, MD', reason: 'Initial outpatient intake for intermittent palpitation', outcome: 'ECG normal sinus rhythm; baseline renal panel verified' }
    ],
    vitalsHistory: [
      { date: 'Today 08:48 AM', bp: '126/82', pulse: '74 bpm', temp: '98.6°F', spo2: '99%', bmi: '22.1' },
      { date: '28 Sep 2026', bp: '138/88', pulse: '78 bpm', temp: '98.4°F', spo2: '98%', bmi: '22.3' },
      { date: '10 Aug 2026', bp: '142/92', pulse: '82 bpm', temp: '98.5°F', spo2: '99%', bmi: '22.4' }
    ],
    activePrescriptions: [
      { drug: 'Telmisartan 40mg', dose: '40mg', freq: '1-0-0 (Morning)', duration: '30 Days', instructions: 'Take 30 mins after breakfast; monitor home BP readings' },
      { drug: 'Atorvastatin 20mg', dose: '20mg', freq: '0-0-1 (Night)', duration: '30 Days', instructions: 'Take at bedtime after dinner' },
      { drug: 'Pantoprazole 40mg', dose: '40mg', freq: '1-0-0 (Morning)', duration: '14 Days', instructions: 'Take 30 mins before morning breakfast' },
      { drug: 'Paracetamol 650mg', dose: '650mg', freq: 'SOS (As needed)', duration: '5 Days', instructions: 'Take with warm water for breakthrough headaches' }
    ],
    scansAttached: [
      { id: 'scan-1', name: 'Contrast-Enhanced Chest CT Scan', date: 'Today, 08:30 AM', modality: 'CT', slices: 148, finding: '2.3 cm nodular opacity in right upper lobe (RUL) under active observation' },
      { id: 'scan-2', name: '12-Lead Electrocardiogram (ECG)', date: 'Today, 08:40 AM', modality: 'ECG', slices: 1, finding: 'Normal sinus rhythm, heart rate 74 bpm, borderline LVH voltage' },
      { id: 'scan-3', name: 'Comprehensive Metabolic Panel (CMP)', date: 'Today, 08:15 AM', modality: 'LAB', slices: 4, finding: 'Fasting Blood Sugar 104 mg/dL, Total Cholesterol 224 mg/dL, eGFR 92 mL/min' }
    ],
    chronicConditions: ['Stage 2 Essential Hypertension (Diagnosed 2020)', 'Mixed Dyslipidemia', 'History of Migraine'],
    allergies: ['Penicillin (Cutaneous maculopapular rash)', 'Codeine (Nausea)']
  },
  'pat-002': {
    lastConsultDate: '12 Oct 2026, 11:30 AM',
    lastConsultLocation: 'OPD Station 03 • Diabetology & Internal Med',
    upcomingDate: '26 Oct 2026, 10:00 AM',
    upcomingDaysLabel: 'In 10 Days',
    upcomingPurpose: 'Repeat Glycemic Panel (HbA1c) & Diabetic Peripheral Neuropathy Review',
    icdDiagnosis: 'E11.40 (Type 2 Diabetes Mellitus with Diabetic Neuropathy) • I10 (Hypertension)',
    clinicalConsultSummary: 'Patient presented with burning bilateral feet paresthesias and fasting glycemic fluctuations. Recent HbA1c 8.4%. Foot inspection revealed intact protective monofilament sensation with mild vibration reduction at hallux. Titrated Metformin ER and added Pregabalin 75mg at bedtime with diabetic foot care counseling.',
    priorVisitsHistory: [
      { date: '12 Oct 2026', doctor: 'Dr. Kiran Patel, MD', reason: 'HbA1c elevation & peripheral tingling in lower extremities', outcome: 'Medications optimized; advised daily foot checks' },
      { date: '15 Jul 2026', doctor: 'Dr. Kiran Patel, MD', reason: 'Quarterly diabetic wellness & microalbuminuria screen', outcome: 'Urine ACR within normal limits; statin continued' },
      { date: '04 Apr 2026', doctor: 'Dr. Kiran Patel, MD', reason: 'Blood pressure and glycemic titration', outcome: 'BP well controlled at 130/84 mmHg' }
    ],
    vitalsHistory: [
      { date: '12 Oct 2026', bp: '134/84', pulse: '76 bpm', temp: '98.4°F', spo2: '98%', bmi: '26.4' },
      { date: '15 Jul 2026', bp: '132/82', pulse: '74 bpm', temp: '98.6°F', spo2: '99%', bmi: '26.8' }
    ],
    activePrescriptions: [
      { drug: 'Metformin ER 1000mg', dose: '1000mg', freq: '1-0-1 (Twice Daily)', duration: '60 Days', instructions: 'Take with main meals to prevent gastrointestinal upset' },
      { drug: 'Glimepiride 2mg', dose: '2mg', freq: '1-0-0 (Morning)', duration: '60 Days', instructions: 'Take 15 mins before breakfast' },
      { drug: 'Pregabalin 75mg', dose: '75mg', freq: '0-0-1 (Bedtime)', duration: '30 Days', instructions: 'Take at night for neuropathic lower limb tingling' },
      { drug: 'Atorvastatin 10mg', dose: '10mg', freq: '0-0-1 (Bedtime)', duration: '60 Days', instructions: 'Cardiovascular risk reduction' }
    ],
    scansAttached: [
      { id: 'scan-1', name: 'Brain MRI Sequence with FLAIR', date: '12 Oct 2026', modality: 'MRI', slices: 148, finding: 'Mild age-related periventricular white matter changes; no acute ischemic event' },
      { id: 'scan-2', name: 'Bilateral Lower Extremity Arterial Doppler', date: '12 Oct 2026', modality: 'USG', slices: 24, finding: 'Triphasic waveforms in dorsalis pedis and posterior tibial arteries; no critical stenosis' }
    ],
    chronicConditions: ['Type 2 Diabetes Mellitus (Diagnosed 2014)', 'Diabetic Peripheral Neuropathy', 'Primary Hypertension'],
    allergies: ['Sulfa Drugs (Mild urticaria)']
  },
  'pat-003': {
    lastConsultDate: '08 Oct 2026, 02:15 PM',
    lastConsultLocation: 'OPD Station 03 • Endocrine & Internal Med',
    upcomingDate: '22 Oct 2026, 02:00 PM',
    upcomingDaysLabel: 'In 6 Days',
    upcomingPurpose: 'Repeat Thyroid Function (TSH, FT4) & Hemoglobin Re-evaluation',
    icdDiagnosis: 'E06.3 (Autoimmune Thyroiditis / Hashimoto Disease) • D50.9 (Iron Deficiency Anemia)',
    clinicalConsultSummary: 'Consulted for marked lethargy, cold intolerance, dry skin, and menstrual irregularity. Serum TSH elevated at 9.2 mIU/L, Anti-TPO antibodies strongly positive (>450 IU/mL), Serum Ferritin 12 ng/mL indicating depleted iron stores. Up-titrated Levothyroxine to 75mcg and commenced oral iron therapy with Vitamin C.',
    priorVisitsHistory: [
      { date: '08 Oct 2026', doctor: 'Dr. Kiran Patel, MD', reason: 'Persistent fatigue, weight gain, high TSH report review', outcome: 'Levothyroxine increased; commenced Ferrous Ascorbate' },
      { date: '18 Aug 2026', doctor: 'Dr. Kiran Patel, MD', reason: 'General checkup for malaise and dizziness', outcome: 'Ordered full thyroid panel and iron indices' }
    ],
    vitalsHistory: [
      { date: '08 Oct 2026', bp: '118/74', pulse: '66 bpm', temp: '97.8°F', spo2: '99%', bmi: '24.2' },
      { date: '18 Aug 2026', bp: '114/72', pulse: '68 bpm', temp: '98.0°F', spo2: '99%', bmi: '24.5' }
    ],
    activePrescriptions: [
      { drug: 'Levothyroxine Sodium 75mcg', dose: '75mcg', freq: '1-0-0 (Empty Stomach)', duration: '45 Days', instructions: 'Take early morning with a full glass of water 60 mins before breakfast' },
      { drug: 'Ferrous Ascorbate 100mg + Folic Acid', dose: '100mg', freq: '0-1-0 (Afternoon)', duration: '60 Days', instructions: 'Take after lunch with citrus juice; avoid calcium/dairy within 2 hours' },
      { drug: 'Methylcobalamin (B12) 1500mcg', dose: '1500mcg', freq: '1-0-0 (Morning)', duration: '30 Days', instructions: 'Daily oral supplementation' }
    ],
    scansAttached: [
      { id: 'scan-1', name: 'High-Resolution Neck & Thyroid Ultrasound', date: '08 Oct 2026', modality: 'USG', slices: 18, finding: 'Diffusely heterogeneous thyroid echotexture compatible with chronic lymphocytic thyroiditis; no suspicious discrete nodules (TIRADS 2)' }
    ],
    chronicConditions: ['Hashimoto Autoimmune Thyroiditis', 'Microcytic Hypochromic Anemia'],
    allergies: ['No Known Drug Allergies (NKDA)']
  },
  'pat-004': {
    lastConsultDate: '14 Oct 2026, 10:45 AM',
    lastConsultLocation: 'OPD Station 03 • Spine & Internal Med',
    upcomingDate: '28 Oct 2026, 11:30 AM',
    upcomingDaysLabel: 'In 12 Days',
    upcomingPurpose: 'Lumbo-Sacral Radiculopathy Re-assessment & Physio Progress Review',
    icdDiagnosis: 'M51.16 (Intervertebral Disc Disorder with Radiculopathy, Lumbar Region)',
    clinicalConsultSummary: 'Patient presented with acute-on-chronic low back pain radiating down the right lateral calf and dorsum of foot (L5 dermatome) exacerbated by forward flexion and prolonged sitting. Straight leg raise positive on right at 45 degrees. Lumbar MRI confirms L4-L5 disc protrusion touching traversing nerve root. Recommended conservative regimen with short-course muscle relaxant, pregabalin, and physical therapy.',
    priorVisitsHistory: [
      { date: '14 Oct 2026', doctor: 'Dr. Kiran Patel, MD', reason: 'Right sciatic radicular pain and low back stiffness', outcome: 'Initiated multimodal analgesia and physical therapy referral' },
      { date: '02 Sep 2026', doctor: 'Dr. Kiran Patel, MD', reason: 'Musculoskeletal lumbago after lifting heavy luggage', outcome: 'Advised rest and NSAID therapy' }
    ],
    vitalsHistory: [
      { date: '14 Oct 2026', bp: '130/86', pulse: '80 bpm', temp: '98.6°F', spo2: '98%', bmi: '25.8' }
    ],
    activePrescriptions: [
      { drug: 'Aceclofenac 100mg + Thiocolchicoside 4mg', dose: '100mg/4mg', freq: '1-0-1 (Twice Daily)', duration: '7 Days', instructions: 'Take after meals with water' },
      { drug: 'Pregabalin 75mg', dose: '75mg', freq: '0-0-1 (Night)', duration: '14 Days', instructions: 'Take before sleep for neuropathic radicular pain' },
      { drug: 'Pantoprazole 40mg', dose: '40mg', freq: '1-0-0 (Morning)', duration: '7 Days', instructions: 'Gastroprotective agent' }
    ],
    scansAttached: [
      { id: 'scan-1', name: 'Lumbo-Sacral Spine MRI with Axial/Sagittal T2', date: '14 Oct 2026', modality: 'MRI', slices: 96, finding: 'Posterocentral and right paracentral disc protrusion at L4-L5 causing mild thecal sac impingement' },
      { id: 'scan-2', name: 'Digital Standing Spine Radiograph (AP/Lat)', date: '14 Oct 2026', modality: 'X-RAY', slices: 2, finding: 'Mild lumbar lordosis straightening; vertebral body heights preserved' }
    ],
    chronicConditions: ['Lumbar Disc Desiccation (L4-L5)', 'Mild Hyperuricemia'],
    allergies: ['Aspirin (Bronchospasm / Wheezing)']
  },
  'pat-005': {
    lastConsultDate: 'Today, 11:00 AM',
    lastConsultLocation: 'OPD Station 03 • Surgical Follow-up & Internal Med',
    upcomingDate: '05 Nov 2026, 09:30 AM',
    upcomingDaysLabel: 'In 20 Days',
    upcomingPurpose: 'Late Post-Operative Cholecystectomy Clearance & Liver Function Check',
    icdDiagnosis: 'K91.5 (Postcholecystectomy Syndrome) • K80.20 (Calculus of Gallbladder without Cholecystitis)',
    clinicalConsultSummary: 'Follow-up consultation following laparoscopic cholecystectomy performed 3 weeks ago. Patient reports complete resolution of pre-operative right upper quadrant biliary colic. Port-site scars clean, healed by primary intention without erythema or discharge. Tolerating regular soft low-fat diet well with normal bowel function.',
    priorVisitsHistory: [
      { date: '16 Oct 2026 (Today)', doctor: 'Dr. Kiran Patel, MD', reason: '3-week post-laparoscopic cholecystectomy review', outcome: 'Surgical recovery uneventful; discharged to routine follow-up' },
      { date: '25 Sep 2026', doctor: 'Dr. Kiran Patel, MD', reason: 'Pre-operative medical clearance and cardiac risk assessment', outcome: 'Cleared for laparoscopic surgery under General Anesthesia' }
    ],
    vitalsHistory: [
      { date: 'Today 11:00 AM', bp: '122/78', pulse: '72 bpm', temp: '98.4°F', spo2: '99%', bmi: '23.6' }
    ],
    activePrescriptions: [
      { drug: 'Pantoprazole 40mg', dose: '40mg', freq: '1-0-0 (Morning)', duration: '14 Days', instructions: 'Take 30 mins before breakfast' },
      { drug: 'Ursodeoxycholic Acid 300mg', dose: '300mg', freq: '0-0-1 (Night)', duration: '30 Days', instructions: 'Digestive bile acid support' },
      { drug: 'Multivitamin & Zinc Syrup', dose: '10ml', freq: '1-0-0 (Morning)', duration: '30 Days', instructions: 'Post-operative nutritional replenishment' }
    ],
    scansAttached: [
      { id: 'scan-1', name: 'Post-Operative Upper Abdomen Ultrasound', date: 'Today, 10:15 AM', modality: 'USG', slices: 12, finding: 'Cholecystectomy bed normal; no fluid collection or hematoma; common bile duct caliber normal (4.2mm)' },
      { id: 'scan-2', name: 'Gallbladder Surgical Histopathology Biopsy', date: '01 Oct 2026', modality: 'LAB', slices: 3, finding: 'Chronic calculous cholecystitis with cholesterolosis; negative for dysplasia or malignancy' }
    ],
    chronicConditions: ['Status Post Laparoscopic Cholecystectomy (Sep 2026)', 'Osteopenia'],
    allergies: ['No Known Drug Allergies (NKDA)']
  }
};

export default function DoctorPatientDossierView({ 
  patients = [], 
  onOpenWorkspace,
  onOpenScans 
}) {
  const { addToast } = usePatients();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'TODAY' | 'HIGH_RISK'
  
  // Modal Pop-up State
  const [modalPatient, setModalPatient] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('summary'); // 'summary' | 'rx' | 'vitals' | 'scans'

  // Filtered Patient List
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const pDossier = EXTENDED_PATIENT_DOSSIER[p.id] || EXTENDED_PATIENT_DOSSIER['pat-001'];
      const query = searchQuery.toLowerCase();
      const matchSearch = p.fullName.toLowerCase().includes(query) ||
                          p.mrn.toLowerCase().includes(query) ||
                          pDossier.icdDiagnosis.toLowerCase().includes(query) ||
                          (p.questionnaire?.responses?.chiefComplaint || '').toLowerCase().includes(query);
      if (!matchSearch) return false;

      if (filterMode === 'TODAY') {
        return pDossier.lastConsultDate.toLowerCase().includes('today');
      }
      if (filterMode === 'HIGH_RISK') {
        return p.mlInsights?.overallRisk === 'HIGH';
      }
      return true;
    });
  }, [patients, searchQuery, filterMode]);

  const activeDossier = modalPatient ? (EXTENDED_PATIENT_DOSSIER[modalPatient.id] || EXTENDED_PATIENT_DOSSIER['pat-001']) : null;

  return (
    <main className="page-container doctor-page-container m3-page-animate" style={{ maxWidth: '100%', width: '100%', margin: 0, padding: '16px 20px', boxSizing: 'border-box' }}>
      
      {/* Simple, Clean Header: Normal Page Title (NOT a dashboard) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={20} color="#0077B6" />
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Patient History & Dossier Records
            </h2>
            <span style={{ fontSize: 11, background: '#CAF0F8', color: '#0077B6', padding: '2px 8px', borderRadius: 9999, fontWeight: 700, border: '1px solid #90E0EF' }}>
              Dr. Kiran Patel's Consulted Cohort ({filteredPatients.length})
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
            Clean registry of all patients consulted with highlighted last consultation dates, upcoming appointment reviews, and complete pop-up dossiers.
          </p>
        </div>

        {/* Search & Quick Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 240 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Search patient name, MRN, diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: 32,
                padding: '0 10px 0 30px',
                fontSize: 11.5,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'ALL', label: 'All Patients' },
              { id: 'TODAY', label: 'Consulted Today' },
              { id: 'HIGH_RISK', label: 'High Risk' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                className={`m3-btn ${filterMode === f.id ? 'm3-btn-filled' : 'm3-btn-tonal'}`}
                onClick={() => setFilterMode(f.id)}
                style={{
                  height: 32,
                  fontSize: 11,
                  padding: '0 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: filterMode === f.id ? 800 : 600,
                  background: filterMode === f.id ? '#0077B6' : '#edf8fc',
                  color: filterMode === f.id ? '#ffffff' : '#0077B6',
                  border: filterMode === f.id ? 'none' : '1px solid #bfe7f5'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* NORMAL, CLEAN PATIENT LIST (NO DASHBOARD METRIC JUNK) */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="m3-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-default)' }}>
                <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>
                  Patient Profile
                </th>
                <th style={{ padding: '12px 14px', fontWeight: 800, color: '#0369a1', fontSize: 11, textTransform: 'uppercase' }}>
                  Last Consultation Date
                </th>
                <th style={{ padding: '12px 14px', fontWeight: 800, color: '#047857', fontSize: 11, textTransform: 'uppercase' }}>
                  Upcoming Appointment Date
                </th>
                <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>
                  Consulted Diagnosis & Details
                </th>
                <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>
                  Actions & Dossier
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No patient records matched the search criteria.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p, idx) => {
                  const pDossier = EXTENDED_PATIENT_DOSSIER[p.id] || EXTENDED_PATIENT_DOSSIER['pat-001'];
                  const isHighRisk = p.mlInsights?.overallRisk === 'HIGH';

                  return (
                    <tr 
                      key={p.id}
                      style={{ 
                        borderBottom: idx === filteredPatients.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                        background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                        transition: 'background 0.15s ease'
                      }}
                      className="anim-hover-subtle"
                    >
                      {/* Patient Name & Details */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
                            color: '#ffffff',
                            fontSize: 13,
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {p.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)' }}>
                                {p.fullName}
                              </span>
                              {isHighRisk && (
                                <span style={{ fontSize: 9.5, padding: '1px 6px', background: '#fee2e2', color: '#dc2626', borderRadius: 4, fontWeight: 700 }}>
                                  High Risk
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                              {p.age}y {p.gender} • <strong style={{ fontFamily: 'var(--font-mono)' }}>{p.mrn}</strong> • {p.insurance?.provider || 'Self-Pay'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* HIGHLIGHTED LAST CONSULTATION DATE */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 10px',
                          borderRadius: 8,
                          background: '#f0f9ff',
                          border: '1.5px solid #bae6fd',
                          boxShadow: '0 1px 3px rgba(3, 105, 161, 0.08)'
                        }}>
                          <Clock size={13} color="#0284c7" />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#0369a1' }}>
                              {pDossier.lastConsultDate}
                            </div>
                            <div style={{ fontSize: 10, color: '#0c4a6e' }}>
                              {pDossier.lastConsultLocation.split('•')[0]}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* HIGHLIGHTED UPCOMING APPOINTMENT DATE */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 10px',
                          borderRadius: 8,
                          background: '#ecfdf5',
                          border: '1.5px solid #a7f3d0',
                          boxShadow: '0 1px 3px rgba(4, 120, 87, 0.08)'
                        }}>
                          <Calendar size={13} color="#059669" />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#047857', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{pDossier.upcomingDate.split(',')[0]}</span>
                              <span style={{ fontSize: 9.5, background: '#059669', color: '#ffffff', padding: '1px 6px', borderRadius: 9999, fontWeight: 700 }}>
                                {pDossier.upcomingDaysLabel}
                              </span>
                            </div>
                            <div style={{ fontSize: 10, color: '#065f46', maxWidth: 170, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {pDossier.upcomingPurpose}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Consulted Diagnosis */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle', maxWidth: 280 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                          {pDossier.icdDiagnosis.split('•')[0]}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          Chief Complaint: "{p.questionnaire?.responses?.chiefComplaint || 'Consultation review'}"
                        </div>
                      </td>

                      {/* Actions: Pop-up Dossier Button + Consult Button */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            className="m3-btn m3-btn-tonal anim-hover-lift"
                            onClick={() => {
                              setModalPatient(p);
                              setActiveModalTab('summary');
                            }}
                            style={{
                              height: 30,
                              fontSize: 11,
                              padding: '0 10px',
                              background: '#edf8fc',
                              color: '#0077B6',
                              border: '1px solid #bfe7f5',
                              fontWeight: 700,
                              gap: 5
                            }}
                            title="Open Complete Patient History & Longitudinal Dossier Pop-up"
                          >
                            <FileText size={12} color="#0077B6" />
                            <span>View Dossier</span>
                          </button>

                          <button
                            type="button"
                            className="m3-btn m3-btn-filled anim-hover-lift"
                            onClick={() => onOpenWorkspace?.(p.id)}
                            style={{
                              height: 30,
                              fontSize: 11,
                              padding: '0 10px',
                              background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
                              color: '#ffffff',
                              border: 'none',
                              fontWeight: 700,
                              gap: 4
                            }}
                            title="Open Patient Consultation Workspace"
                          >
                            <Stethoscope size={12} />
                            <span>Consult →</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          POP-UP MODAL: Comprehensive Patient History & Longitudinal Dossier
          (Clean, focused pop-up window opened via "View Dossier" button)
         ========================================================================= */}
      {modalPatient && activeDossier && (
        <div className="m3-modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: 16
        }}>
          <div className="card m3-dialog" style={{
            width: '100%',
            maxWidth: 860,
            maxHeight: '90vh',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            borderRadius: 'var(--radius-lg)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-default)',
              paddingBottom: 12,
              marginBottom: 12,
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
                  color: '#ffffff',
                  fontSize: 15,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {modalPatient.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                      {modalPatient.fullName}
                    </h3>
                    <span style={{ fontSize: 10.5, background: '#dbeafe', color: '#1e40af', padding: '1px 8px', borderRadius: 9999, fontWeight: 800 }}>
                      {modalPatient.mrn}
                    </span>
                    <span style={{ fontSize: 10.5, background: '#eff6ff', color: '#1d4ed8', padding: '1px 8px', borderRadius: 9999, fontWeight: 700 }}>
                      {modalPatient.insurance?.provider || 'Direct Self-Pay'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {modalPatient.age}y {modalPatient.gender} • Phone: {modalPatient.phone} • ABHA: {modalPatient.abhaId || '91-4820-1928-3819'}
                  </div>
                </div>
              </div>

              <button 
                className="icon-btn" 
                onClick={() => setModalPatient(null)}
                style={{ width: 28, height: 28 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* HIGHLIGHTED DATES CARDS INSIDE POP-UP */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginBottom: 12,
              flexShrink: 0
            }}>
              {/* Highlighted Last Consult Date */}
              <div style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: '#f0f9ff',
                border: '1.5px solid #bae6fd'
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#0369a1', marginBottom: 2 }}>
                  📌 Last Doctor Consultation
                </div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#0c4a6e' }}>
                  {activeDossier.lastConsultDate}
                </div>
                <div style={{ fontSize: 10.5, color: '#0369a1' }}>
                  {activeDossier.lastConsultLocation} • Dr. Kiran Patel, MD
                </div>
              </div>

              {/* Highlighted Upcoming Appointment Date */}
              <div style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: '#ecfdf5',
                border: '1.5px solid #a7f3d0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#047857' }}>
                    🗓️ Next Upcoming Appointment
                  </span>
                  <span style={{ fontSize: 9.5, background: '#059669', color: '#ffffff', padding: '1px 6px', borderRadius: 9999, fontWeight: 800 }}>
                    {activeDossier.upcomingDaysLabel}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#064e3b' }}>
                  {activeDossier.upcomingDate}
                </div>
                <div style={{ fontSize: 10.5, color: '#047857' }}>
                  {activeDossier.upcomingPurpose}
                </div>
              </div>
            </div>

            {/* Modal Tabs Container */}
            <div className="m3-view-tabs-container" style={{ marginBottom: 12, flexShrink: 0 }}>
              <button
                type="button"
                className={`m3-view-tab ${activeModalTab === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('summary')}
              >
                <FileText size={13} />
                <span>Consultation Notes & Diagnosis</span>
              </button>
              <button
                type="button"
                className={`m3-view-tab ${activeModalTab === 'rx' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('rx')}
              >
                <Pill size={13} />
                <span>Prescriptions History ({activeDossier.activePrescriptions.length})</span>
              </button>
              <button
                type="button"
                className={`m3-view-tab ${activeModalTab === 'vitals' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('vitals')}
              >
                <Activity size={13} />
                <span>Vitals Trajectory</span>
              </button>
              <button
                type="button"
                className={`m3-view-tab ${activeModalTab === 'scans' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('scans')}
              >
                <Layers size={13} />
                <span>PACS Scans ({activeDossier.scansAttached.length})</span>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
              
              {/* TAB 1: Summary */}
              {activeModalTab === 'summary' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ background: 'var(--bg-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 2 }}>
                      Documented ICD-10 Diagnoses:
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {activeDossier.icdDiagnosis}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 8, border: '1px solid var(--border-default)' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4 }}>
                      Clinical Consultation Notes:
                    </div>
                    <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-primary)', margin: 0 }}>
                      {activeDossier.clinicalConsultSummary}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                        Chronic Medical History:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#475569' }}>
                        {activeDossier.chronicConditions.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ background: '#fef2f2', padding: 10, borderRadius: 8, border: '1px solid #fecaca' }}>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: '#991b1b', marginBottom: 4 }}>
                        Allergies & Contraindications:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#b91c1c' }}>
                        {activeDossier.allergies.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Prescriptions */}
              {activeModalTab === 'rx' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeDossier.activePrescriptions.map((rx, idx) => (
                    <div key={idx} style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-default)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                          {rx.drug}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          Dose: {rx.dose} • Frequency: <strong>{rx.freq}</strong> • Duration: {rx.duration}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 1 }}>
                          Notes: {rx.instructions}
                        </div>
                      </div>
                      <span style={{ fontSize: 10, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: Vitals */}
              {activeModalTab === 'vitals' && (
                <div style={{ overflowX: 'auto' }}>
                  <table className="m3-table" style={{ width: '100%', fontSize: 11.5 }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>BP</th>
                        <th>Pulse</th>
                        <th>Temp</th>
                        <th>SpO2</th>
                        <th>BMI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeDossier.vitalsHistory.map((vh, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 700 }}>{vh.date}</td>
                          <td style={{ color: '#1d4ed8', fontWeight: 800 }}>{vh.bp}</td>
                          <td>{vh.pulse}</td>
                          <td>{vh.temp}</td>
                          <td style={{ color: '#15803d', fontWeight: 700 }}>{vh.spo2}</td>
                          <td>{vh.bmi}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: Scans Attached */}
              {activeModalTab === 'scans' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeDossier.scansAttached.map((sc, i) => (
                    <div key={i} style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                          {sc.name}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>
                          {sc.modality} • {sc.slices} Slices • Date: {sc.date}
                        </div>
                        <div style={{ fontSize: 11, color: '#b45309', fontWeight: 600, marginTop: 2 }}>
                          Finding: {sc.finding}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="m3-btn m3-btn-outlined"
                        onClick={() => {
                          setModalPatient(null);
                          onOpenScans?.(modalPatient.id);
                        }}
                        style={{ height: 28, fontSize: 11 }}
                      >
                        Open in PACS →
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-default)',
              paddingTop: 12,
              marginTop: 12,
              flexShrink: 0
            }}>
              <button
                type="button"
                className="m3-btn m3-btn-tonal"
                onClick={() => addToast(`Exported ${modalPatient.fullName}'s clinical dossier summary (PDF)`, 'info')}
                style={{ height: 32, fontSize: 11.5, gap: 5 }}
              >
                <Printer size={13} />
                <span>Print Dossier Summary</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className="m3-btn m3-btn-tonal"
                  onClick={() => setModalPatient(null)}
                  style={{ height: 32, fontSize: 11.5 }}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="m3-btn m3-btn-filled"
                  onClick={() => {
                    const patId = modalPatient.id;
                    setModalPatient(null);
                    onOpenWorkspace?.(patId);
                  }}
                  style={{ height: 32, fontSize: 11.5, background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: '#ffffff', gap: 5 }}
                >
                  <Stethoscope size={13} />
                  <span>Open in Consultation Workspace →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
