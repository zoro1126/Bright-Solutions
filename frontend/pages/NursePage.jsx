import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { 
  Activity, 
  Pill, 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Check, 
  Search, 
  Thermometer, 
  Gauge, 
  Wind, 
  Plus, 
  X, 
  QrCode, 
  ClipboardList, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  User, 
  Stethoscope,
  Heart,
  Zap,
  Filter,
  Copy,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function NursePage({ 
  currentRole = 'nurse', 
  onSwitchRole, 
  activeSubTab = 'ward',
  onLogout 
}) {
  const { 
    wardBeds, 
    marRecords, 
    nursingTasks, 
    administerMedication, 
    recordBedVitals, 
    toggleNursingTask, 
    stats,
    addToast 
  } = usePatients();

  const [activeTab, setActiveTab] = useState(activeSubTab || 'ward');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [wardFilter, setWardFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected Patient / Bed for details or quick modal
  const [selectedBed, setSelectedBed] = useState(wardBeds[0] || null);

  // Modals
  const [isMarModalOpen, setIsMarModalOpen] = useState(false);
  const [activeMarItem, setActiveMarItem] = useState(null);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isSbarModalOpen, setIsSbarModalOpen] = useState(false);

  // Vitals Entry Form State
  const [vitalsInput, setVitalsInput] = useState({
    systolic: 120,
    diastolic: 80,
    pulse: 76,
    spo2: 98,
    respRate: 16,
    temp: 98.6,
    avpu: 'Alert',
    onOxygen: false
  });

  // Calculate NEWS2 (National Early Warning Score) deterministically
  const calculateNews2 = (v) => {
    let score = 0;
    // Respiration rate
    const rr = Number(v.respRate) || 16;
    if (rr <= 8 || rr >= 25) score += 3;
    else if (rr >= 21) score += 2;
    else if (rr >= 9 && rr <= 11) score += 1;

    // SpO2
    const spo2 = Number(v.spo2) || 98;
    if (spo2 <= 91) score += 3;
    else if (spo2 <= 93) score += 2;
    else if (spo2 <= 95) score += 1;

    // Oxygen
    if (v.onOxygen) score += 2;

    // Systolic BP
    const sbp = Number(v.systolic) || 120;
    if (sbp <= 90 || sbp >= 220) score += 3;
    else if (sbp <= 100) score += 2;
    else if (sbp <= 110) score += 1;

    // Pulse
    const hr = Number(v.pulse) || 75;
    if (hr <= 40 || hr >= 131) score += 3;
    else if (hr >= 111) score += 2;
    else if (hr <= 50 || hr >= 91) score += 1;

    // Temp
    const temp = Number(v.temp) || 98.6;
    if (temp <= 95.0) score += 3;
    else if (temp >= 102.4) score += 2;
    else if ((temp >= 95.1 && temp <= 96.8) || (temp >= 100.4 && temp <= 102.2)) score += 1;

    // Consciousness
    if (v.avpu !== 'Alert') score += 3;

    return score;
  };

  const currentNews2 = calculateNews2(vitalsInput);

  // Filtered Ward Beds
  const filteredBeds = wardBeds.filter(b => {
    if (wardFilter !== 'ALL' && !b.ward.toLowerCase().includes(wardFilter.toLowerCase())) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.patientName.toLowerCase().includes(q) ||
      b.bedNumber.toLowerCase().includes(q) ||
      b.mrn.toLowerCase().includes(q) ||
      b.diagnosis.toLowerCase().includes(q)
    );
  });

  // Filtered MAR Records
  const [marFilter, setMarFilter] = useState('ALL');
  const filteredMar = marRecords.filter(m => {
    if (marFilter === 'DUE' && m.status !== 'DUE_NOW' && m.status !== 'OVERDUE') return false;
    if (marFilter === 'GIVEN' && m.status !== 'GIVEN') return false;
    if (marFilter === 'SCHEDULED' && m.status !== 'SCHEDULED') return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.patientName.toLowerCase().includes(q) ||
      m.drug.toLowerCase().includes(q) ||
      m.bed.toLowerCase().includes(q) ||
      m.mrn.toLowerCase().includes(q)
    );
  });

  // Handle open Vitals Modal for a bed
  const handleOpenVitalsModal = (bed) => {
    setSelectedBed(bed);
    if (bed.vitals) {
      const bpParts = (bed.vitals.bp || '120/80').split('/');
      setVitalsInput({
        systolic: parseInt(bpParts[0], 10) || 120,
        diastolic: parseInt(bpParts[1], 10) || 80,
        pulse: bed.vitals.pulse || 76,
        spo2: bed.vitals.spo2 || 98,
        respRate: bed.vitals.respRate || 16,
        temp: parseFloat(bed.vitals.temp) || 98.6,
        avpu: bed.vitals.avpu || 'Alert',
        onOxygen: Boolean(bed.vitals.onOxygen)
      });
    }
    setIsVitalsModalOpen(true);
  };

  // Submit Vitals Record
  const handleSubmitVitals = () => {
    if (!selectedBed) return;
    const calculated = calculateNews2(vitalsInput);
    recordBedVitals(selectedBed.id, {
      bp: `${vitalsInput.systolic}/${vitalsInput.diastolic}`,
      pulse: vitalsInput.pulse,
      spo2: vitalsInput.spo2,
      respRate: vitalsInput.respRate,
      temp: `${vitalsInput.temp}°F`,
      avpu: vitalsInput.avpu,
      onOxygen: vitalsInput.onOxygen
    }, calculated);
    setIsVitalsModalOpen(false);
  };

  // Handle open MAR modal
  const handleOpenMarAdmin = (item) => {
    setActiveMarItem(item);
    setIsMarModalOpen(true);
  };

  // Confirm dose administration
  const handleConfirmAdminister = () => {
    if (!activeMarItem) return;
    administerMedication(activeMarItem.id, {
      administeredBy: 'Sr. Mini Joseph, RN',
      notes: 'Bedside BCMA Barcode Scanned & Verified'
    });
    setIsMarModalOpen(false);
  };

  return (
    <div className="m3-app-shell nurse-theme" style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden' }}>
      {/* Navigation Sidebar */}
      <Sidebar
        role="nurse"
        activeTab={activeTab === 'dashboard' ? 'ward' : activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <div className="m3-main-viewport" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Top Navigation Bar */}
        <Navbar
          currentRole={currentRole}
          onRoleChange={onSwitchRole}
          onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
          onLogout={onLogout}
        />

        {/* Main Nurse Workspace Viewport */}
        <main className="page-container m3-page-animate" style={{ maxWidth: '100%', width: '100%', margin: 0, padding: '16px 20px', boxSizing: 'border-box', overflowY: 'auto', flex: 1 }}>
          
          {/* Top Nurse Role Header Banner */}
          <div 
            className="m3-hero-banner"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)',
              border: '1.2px solid #99f6e4',
              borderRadius: 14,
              padding: '16px 20px',
              marginBottom: 18,
              boxShadow: '0 2px 10px rgba(13, 148, 136, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span 
                  style={{
                    backgroundColor: '#ccfbf1',
                    color: '#0f766e',
                    border: '1px solid #99f6e4',
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 20,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  Inpatient Care & Bedside Telemetry OS
                </span>
                <span className="live-dot" style={{ backgroundColor: '#0d9488' }} />
                <span style={{ fontSize: 11, color: '#0d9488', fontWeight: 700 }}>
                  Ward Telemetry Connected (100% Online)
                </span>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#134e4a', margin: '4px 0 2px' }}>
                Ward & Inpatient Nursing Station (Station 03)
              </h1>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                Lead Duty Nurse: <strong>Sr. Mini Joseph, RN</strong> • Shift: <strong>Morning (07:00 – 15:30)</strong> • Inpatient Capacity: <strong>5 / 8 Beds Occupied</strong>
              </p>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button 
                className="m3-btn m3-btn-outlined" 
                onClick={() => setIsSbarModalOpen(true)}
                style={{ fontSize: 11.5, height: 34, gap: 6, borderColor: '#99f6e4', color: '#0f766e' }}
              >
                <FileText size={14} />
                <span>SBAR Shift Handoff</span>
              </button>
              <button 
                className="m3-btn m3-btn-filled"
                onClick={() => handleOpenVitalsModal(selectedBed || wardBeds[0])}
                style={{ fontSize: 11.5, height: 34, gap: 6, backgroundColor: '#0d9488', color: '#ffffff' }}
              >
                <Activity size={14} />
                <span>Log Bedside Vitals (NEWS2)</span>
              </button>
            </div>
          </div>

          {/* Operational Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 18 }}>
            
            {/* Card 1: Active Inpatients */}
            <div className="stat-card" style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Active Inpatients</span>
                <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#ccfbf1', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={15} />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#134e4a', marginTop: 4 }}>
                {wardBeds.length} <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>/ 8 Beds</span>
              </div>
              <div style={{ fontSize: 11, color: '#0d9488', fontWeight: 600, marginTop: 2 }}>
                62.5% Ward Occupancy
              </div>
            </div>

            {/* Card 2: Medications Due Now */}
            <div className="stat-card" style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>MAR Doses Due</span>
                <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pill size={15} />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#b91c1c', marginTop: 4 }}>
                {marRecords.filter(m => m.status === 'DUE_NOW' || m.status === 'OVERDUE').length}
              </div>
              <div style={{ fontSize: 11, color: '#b91c1c', fontWeight: 600, marginTop: 2 }}>
                Requires 5-Rights Bedside Scan
              </div>
            </div>

            {/* Card 3: High Risk NEWS2 Deterioration Alert */}
            <div className="stat-card" style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>NEWS2 ≥ 7 Watch</span>
                <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={15} />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: wardBeds.some(b => b.news2Score >= 7) ? '#dc2626' : '#15803d', marginTop: 4 }}>
                {wardBeds.filter(b => b.news2Score >= 7).length} Patient
              </div>
              <div style={{ fontSize: 11, color: '#b45309', fontWeight: 600, marginTop: 2 }}>
                Hourly ICU telemetry observation
              </div>
            </div>

            {/* Card 4: Shift Care Tasks */}
            <div className="stat-card" style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Care Tasks Pending</span>
                <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ClipboardList size={15} />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                {nursingTasks.filter(t => !t.completed).length} <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>of {nursingTasks.length}</span>
              </div>
              <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 600, marginTop: 2 }}>
                Shift Handoff Checklist Active
              </div>
            </div>
          </div>

          {/* Sub-Navigation Switcher Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { id: 'ward', label: 'Ward & Bed Census', icon: Layers },
                { id: 'mar', label: 'Bedside MAR & Meds', icon: Pill, badge: marRecords.filter(m => m.status === 'DUE_NOW').length },
                { id: 'vitals', label: 'Vitals & NEWS2 Deterioration Flowsheet', icon: Activity },
                { id: 'tasks', label: 'Care Plan & Tasks', icon: ClipboardList, badge: nursingTasks.filter(t => !t.completed).length },
                { id: 'sos', label: 'Call Bell & Emergency Alerts', icon: AlertCircle }
              ].map(tab => {
                const isActive = activeTab === tab.id || (tab.id === 'ward' && activeTab === 'dashboard');
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '10px 14px',
                      fontSize: 12,
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? '#0d9488' : 'var(--text-secondary)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: isActive ? '2.5px solid #0d9488' : '2.5px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <TabIcon size={14} />
                    <span>{tab.label}</span>
                    {tab.badge > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 10, backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Live Search Input */}
            <div style={{ position: 'relative', width: 240, marginBottom: 6 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="m3-input-field"
                placeholder="Search bed, patient, drug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: 30, height: 32, fontSize: 11.5, borderRadius: 8, border: '1px solid var(--border-default)' }}
              />
            </div>
          </div>

          {/* VIEW 1: WARD & BED CENSUS */}
          {(activeTab === 'ward' || activeTab === 'dashboard') && (
            <div className="m3-animate-slide-down">
              {/* Ward Filter Buttons */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {['ALL', 'Ward A', 'Ward B', 'ICU', 'Day Care'].map(w => (
                  <button
                    key={w}
                    onClick={() => setWardFilter(w)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: wardFilter === w ? 700 : 500,
                      border: wardFilter === w ? '1.5px solid #0d9488' : '1px solid var(--border-default)',
                      backgroundColor: wardFilter === w ? '#ccfbf1' : 'var(--bg-surface)',
                      color: wardFilter === w ? '#0f766e' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {w === 'ALL' ? 'All Units (5 Beds)' : w}
                  </button>
                ))}
              </div>

              {/* Beds Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
                {filteredBeds.map(bed => {
                  const isHighRisk = bed.news2Score >= 7;
                  const isMedRisk = bed.news2Score >= 5 && bed.news2Score < 7;
                  const riskColor = isHighRisk ? '#dc2626' : isMedRisk ? '#d97706' : '#16a34a';
                  const riskBg = isHighRisk ? '#fef2f2' : isMedRisk ? '#fffbeb' : '#f0fdf4';

                  return (
                    <div
                      key={bed.id}
                      style={{
                        border: isHighRisk ? '1.5px solid #ef4444' : '1px solid var(--border-default)',
                        borderRadius: 12,
                        backgroundColor: 'var(--bg-surface)',
                        padding: 16,
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      {/* Bed Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10, marginBottom: 10 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{bed.bedNumber}</span>
                            <span className="mrn-tag" style={{ fontSize: 9.5 }}>{bed.mrn}</span>
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{bed.ward} • {bed.floor}</div>
                        </div>

                        {/* NEWS2 Indicator Badge */}
                        <div style={{ textAlign: 'right' }}>
                          <span 
                            style={{ 
                              fontSize: 10.5, 
                              fontWeight: 800, 
                              padding: '2px 8px', 
                              borderRadius: 12, 
                              backgroundColor: riskBg, 
                              color: riskColor,
                              border: `1px solid ${riskColor}40`
                            }}
                          >
                            NEWS2: {bed.news2Score} ({bed.news2Risk})
                          </span>
                        </div>
                      </div>

                      {/* Patient Info */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                          {bed.patientName} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>({bed.age}y {bed.gender})</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {bed.diagnosis}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>
                          Admitted Under: <strong>{bed.doctor}</strong>
                        </div>
                      </div>

                      {/* Bedside Telemetry Snapshot */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, backgroundColor: 'var(--bg-subtle)', padding: '8px 10px', borderRadius: 8, marginBottom: 12, textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>BP</div>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>{bed.vitals.bp}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>HR (Pulse)</div>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>{bed.vitals.pulse} bpm</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>SpO2</div>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: bed.vitals.spo2 < 95 ? '#dc2626' : 'var(--text-primary)' }}>{bed.vitals.spo2}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>Temp</div>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>{bed.vitals.temp}</div>
                        </div>
                      </div>

                      {/* Allergy & Safety Warning Tags */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {bed.allergies.map((alg, i) => (
                          <span key={i} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                            ⚠️ {alg}
                          </span>
                        ))}
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
                          Fall Risk: {bed.fallRisk}
                        </span>
                      </div>

                      {/* Bed Action Buttons */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="m3-btn m3-btn-outlined"
                          onClick={() => { setSelectedBed(bed); setActiveTab('mar'); }}
                          style={{ flex: 1, fontSize: 11, height: 32, gap: 5, borderColor: '#99f6e4', color: '#0f766e' }}
                        >
                          <Pill size={13} />
                          <span>MAR Meds</span>
                        </button>
                        <button
                          className="m3-btn m3-btn-filled"
                          onClick={() => handleOpenVitalsModal(bed)}
                          style={{ flex: 1, fontSize: 11, height: 32, gap: 5, backgroundColor: '#0d9488', color: '#ffffff' }}
                        >
                          <Activity size={13} />
                          <span>Log Vitals</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: BEDSIDE MAR (MEDICATION ADMINISTRATION RECORD) */}
          {activeTab === 'mar' && (
            <div className="m3-animate-slide-down">
              {/* MAR Filter Chips */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { id: 'ALL', label: 'All Active Meds' },
                    { id: 'DUE', label: 'Due Now / Overdue (Alert)' },
                    { id: 'SCHEDULED', label: 'Upcoming Scheduled' },
                    { id: 'GIVEN', label: 'Administered (History)' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setMarFilter(f.id)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: marFilter === f.id ? 700 : 500,
                        border: marFilter === f.id ? '1.5px solid #0d9488' : '1px solid var(--border-default)',
                        backgroundColor: marFilter === f.id ? '#ccfbf1' : 'var(--bg-surface)',
                        color: marFilter === f.id ? '#0f766e' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                  5-Rights Safety Protocol Enabled • Barcode Verification Ready
                </div>
              </div>

              {/* MAR Medication Table */}
              <div style={{ border: '1px solid var(--border-default)', borderRadius: 10, backgroundColor: 'var(--bg-surface)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1.2px solid var(--border-default)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 11 }}>
                      <th style={{ padding: '10px 14px' }}>Patient & Bed</th>
                      <th style={{ padding: '10px 14px' }}>Medication & Dose</th>
                      <th style={{ padding: '10px 14px' }}>Route & Freq</th>
                      <th style={{ padding: '10px 14px' }}>Schedule Window</th>
                      <th style={{ padding: '10px 14px' }}>Allergy / Safety Gate</th>
                      <th style={{ padding: '10px 14px' }}>Administration Status</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Bedside Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMar.map((item, idx) => {
                      const isDueNow = item.status === 'DUE_NOW';
                      const isOverdue = item.status === 'OVERDUE';
                      const isGiven = item.status === 'GIVEN';

                      return (
                        <tr 
                          key={item.id} 
                          style={{ 
                            borderBottom: '1px solid var(--border-subtle)',
                            backgroundColor: isOverdue ? '#fef2f2' : isDueNow ? '#fffbeb' : idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-subtle)' 
                          }}
                        >
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{item.patientName}</div>
                            <div style={{ fontSize: 10.5, color: '#0d9488', fontWeight: 700 }}>{item.bed}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.mrn}</div>
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Pill size={14} color="#0d9488" />
                              <span>{item.drug}</span>
                            </div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Brand: {item.brandExample}</div>
                            <div style={{ fontSize: 10.5, color: '#475569', fontStyle: 'italic', marginTop: 2 }}>{item.instructions}</div>
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontWeight: 700, padding: '2px 6px', borderRadius: 4, backgroundColor: '#f1f5f9', fontSize: 11 }}>
                              {item.route}
                            </span>
                            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>{item.frequency}</div>
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Clock size={12} />
                              <span>{item.scheduledTime}</span>
                            </div>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.orderType}</span>
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            {item.allergyCheck.includes('CAUTION') ? (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                                ⚠️ Cross-Sensitivity Warning
                              </span>
                            ) : (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, backgroundColor: '#dcfce7', color: '#15803d' }}>
                                ✅ Allergy Screen Clear
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            {isGiven ? (
                              <div>
                                <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 12, backgroundColor: '#dcfce7', color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <CheckCircle2 size={11} /> Administered
                                </span>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                                  {item.administeredAt} by {item.administeredBy}
                                </div>
                              </div>
                            ) : isOverdue ? (
                              <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 12, backgroundColor: '#fee2e2', color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <AlertTriangle size={11} /> Overdue Dose
                              </span>
                            ) : isDueNow ? (
                              <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 12, backgroundColor: '#fef3c7', color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={11} /> Due Now
                              </span>
                            ) : (
                              <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 12, backgroundColor: '#f1f5f9', color: '#475569' }}>
                                Scheduled Later
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            {!isGiven ? (
                              <button
                                className="m3-btn m3-btn-filled"
                                onClick={() => handleOpenMarAdmin(item)}
                                style={{ fontSize: 11, height: 30, padding: '0 10px', gap: 5, backgroundColor: isOverdue ? '#dc2626' : '#0d9488', color: '#ffffff' }}
                              >
                                <QrCode size={12} />
                                <span>Verify & Give</span>
                              </button>
                            ) : (
                              <button
                                className="m3-btn m3-btn-outlined"
                                disabled
                                style={{ fontSize: 10.5, height: 28, padding: '0 8px', opacity: 0.7 }}
                              >
                                <Check size={11} />
                                <span>Recorded</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 3: VITALS FLOWSHEET & AUTOMATED NEWS2 CALCULATOR */}
          {activeTab === 'vitals' && (
            <div className="m3-animate-slide-down">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
                
                {/* Vitals Telemetry Flowsheet */}
                <div style={{ border: '1px solid var(--border-default)', borderRadius: 12, backgroundColor: 'var(--bg-surface)', padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        Inpatient Telemetry Flowsheet
                      </h3>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Latest vital signs and trend observation</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, backgroundColor: '#ccfbf1', color: '#0f766e' }}>
                      Auto-NEWS2 Sync
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {wardBeds.map(bed => {
                      const isHigh = bed.news2Score >= 7;
                      return (
                        <div 
                          key={bed.id}
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            border: isHigh ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                            backgroundColor: isHigh ? '#fef2f2' : 'var(--bg-subtle)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <div>
                              <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 12.5 }}>{bed.patientName}</span>
                              <span style={{ fontSize: 11, color: '#0d9488', marginLeft: 6, fontWeight: 700 }}>({bed.bedNumber})</span>
                            </div>
                            <span 
                              style={{ 
                                fontSize: 10.5, 
                                fontWeight: 800, 
                                padding: '2px 7px', 
                                borderRadius: 10,
                                backgroundColor: isHigh ? '#fee2e2' : '#dcfce7',
                                color: isHigh ? '#b91c1c' : '#15803d'
                              }}
                            >
                              NEWS2: {bed.news2Score} ({bed.news2Risk})
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, fontSize: 11 }}>
                            <div><span style={{ color: 'var(--text-muted)', fontSize: 9.5 }}>BP:</span> <strong>{bed.vitals.bp}</strong></div>
                            <div><span style={{ color: 'var(--text-muted)', fontSize: 9.5 }}>HR:</span> <strong>{bed.vitals.pulse} bpm</strong></div>
                            <div><span style={{ color: 'var(--text-muted)', fontSize: 9.5 }}>SpO2:</span> <strong>{bed.vitals.spo2}%</strong></div>
                            <div><span style={{ color: 'var(--text-muted)', fontSize: 9.5 }}>RR:</span> <strong>{bed.vitals.respRate}</strong></div>
                            <div><span style={{ color: 'var(--text-muted)', fontSize: 9.5 }}>Temp:</span> <strong>{bed.vitals.temp}</strong></div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(0,0,0,0.05)', fontSize: 10.5 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Logged at {bed.vitals.lastRecorded}</span>
                            <button
                              onClick={() => handleOpenVitalsModal(bed)}
                              style={{ border: 'none', background: 'transparent', color: '#0d9488', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Update Telemetry →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* NEWS2 Clinical Escalation Protocol Card */}
                <div style={{ border: '1px solid var(--border-default)', borderRadius: 12, backgroundColor: 'var(--bg-surface)', padding: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                    Standardized NEWS2 Escalation Protocol
                  </h3>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
                    Automated physiological scoring based on Royal College of Physicians UK guidelines.
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ padding: 10, borderRadius: 8, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontWeight: 800, color: '#166534', fontSize: 12 }}>Score 0 – 4: Low Clinical Risk</div>
                      <div style={{ fontSize: 11, color: '#15803d', marginTop: 2 }}>
                        Standard ward observation. Routine 4 to 6 hourly monitoring by staff nurse.
                      </div>
                    </div>

                    <div style={{ padding: 10, borderRadius: 8, backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                      <div style={{ fontWeight: 800, color: '#92400e', fontSize: 12 }}>Score 5 – 6: Medium Clinical Risk (Threshold Trigger)</div>
                      <div style={{ fontSize: 11, color: '#b45309', marginTop: 2 }}>
                        Urgent review by duty medical registrar within 30 minutes. Step up monitoring to hourly.
                      </div>
                    </div>

                    <div style={{ padding: 10, borderRadius: 8, backgroundColor: '#fef2f2', border: '1.5px solid #ef4444' }}>
                      <div style={{ fontWeight: 800, color: '#b91c1c', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle size={14} />
                        <span>Score ≥ 7: High Clinical Risk (Critical Sepsis / Deterioration)</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>
                        Immediate emergency call to Medical Emergency Team (MET) / Intensive Care Specialist. Continuous bedside telemetry monitoring.
                      </div>
                      <button
                        className="m3-btn m3-btn-filled"
                        onClick={() => addToast('🚨 MET CODE BLUE ESCALATION: Emergency team alerted for High NEWS2 Patient!', 'error')}
                        style={{ marginTop: 8, fontSize: 11, height: 30, backgroundColor: '#dc2626', color: '#ffffff' }}
                      >
                        <Zap size={12} />
                        <span>Simulate Emergency MET Trigger</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: CARE PLAN & SBAR HANDOFF */}
          {activeTab === 'tasks' && (
            <div className="m3-animate-slide-down">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
                
                {/* Active Nursing Tasks Checklist */}
                <div style={{ border: '1px solid var(--border-default)', borderRadius: 12, backgroundColor: 'var(--bg-surface)', padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        Inpatient Care Tasks & Procedures
                      </h3>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Assigned to Morning Shift Nursing Team</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, backgroundColor: '#f1f5f9', color: '#475569' }}>
                      {nursingTasks.filter(t => !t.completed).length} Incomplete
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {nursingTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => toggleNursingTask(task.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: task.completed ? '1px solid var(--border-subtle)' : '1px solid var(--border-default)',
                          backgroundColor: task.completed ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div 
                          style={{ 
                            width: 18, 
                            height: 18, 
                            borderRadius: 4, 
                            border: task.completed ? '2px solid #0d9488' : '2px solid #cbd5e1',
                            backgroundColor: task.completed ? '#0d9488' : '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: 11
                          }}
                        >
                          {task.completed && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: task.completed ? 500 : 700, color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: task.completed ? 'line-through' : 'none' }}>
                            {task.title}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                            {task.patientName} • {task.bed} • Due: {task.dueTime}
                          </div>
                        </div>
                        <span 
                          style={{ 
                            fontSize: 9.5, 
                            fontWeight: 800, 
                            padding: '1px 6px', 
                            borderRadius: 4,
                            backgroundColor: task.priority === 'URGENT' ? '#fee2e2' : task.priority === 'HIGH' ? '#fef3c7' : '#f1f5f9',
                            color: task.priority === 'URGENT' ? '#b91c1c' : task.priority === 'HIGH' ? '#b45309' : '#475569'
                          }}
                        >
                          {task.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SBAR Shift Handoff Preview Card */}
                <div style={{ border: '1px solid var(--border-default)', borderRadius: 12, backgroundColor: 'var(--bg-surface)', padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        Shift Handoff (SBAR Protocol)
                      </h3>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Situation, Background, Assessment, Recommendation</div>
                    </div>
                    <button
                      className="m3-btn m3-btn-outlined"
                      onClick={() => setIsSbarModalOpen(true)}
                      style={{ fontSize: 11, height: 28, padding: '0 8px', gap: 4, borderColor: '#99f6e4', color: '#0f766e' }}
                    >
                      <Copy size={12} />
                      <span>Export Note</span>
                    </button>
                  </div>

                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5, backgroundColor: 'var(--bg-subtle)', padding: 12, borderRadius: 8 }}>
                    <div><strong>S (Situation):</strong> Ward 3 currently holding 5 patients. 1 Critical watch (Meera Nair, Bed 201, NEWS2=7) following laparotomy.</div>
                    <div style={{ marginTop: 6 }}><strong>B (Background):</strong> Meera Nair post-op day 1; Rajan Pillai ongoing cardiac review; Ananya Sharma awaiting hypertension discharge counseling.</div>
                    <div style={{ marginTop: 6 }}><strong>A (Assessment):</strong> High vigilance required for Bed 201 with SpO2 94% on oxygen. MAR doses administered at 100% compliance for morning window.</div>
                    <div style={{ marginTop: 6 }}><strong>R (Recommendation):</strong> Afternoon shift nurse to check Bed 201 abdominal drain at 13:00 and repeat NEWS2 vitals.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: CALL BELL & EMERGENCY ALERTS */}
          {activeTab === 'sos' && (
            <div className="m3-animate-slide-down">
              <div style={{ border: '1.5px solid #ef4444', borderRadius: 12, backgroundColor: '#fef2f2', padding: 20, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#dc2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#b91c1c' }}>
                      ACTIVE EMERGENCY CALL BELL: Bed A-102 (Rajan Pillai)
                    </div>
                    <div style={{ fontSize: 12, color: '#dc2626', marginTop: 2 }}>
                      Triggered at 12:28 PM • Nurse call button pressed at bedside table • Fall Risk: High (Red Band)
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button
                    className="m3-btn m3-btn-filled"
                    onClick={() => addToast('Bedside SOS Acknowledged. Staff nurse dispatched to Bed A-102.', 'success')}
                    style={{ backgroundColor: '#dc2626', color: '#fff', fontSize: 11.5, height: 32 }}
                  >
                    <Check size={14} />
                    <span>Acknowledge & Dispatch Nurse</span>
                  </button>
                  <button
                    className="m3-btn m3-btn-outlined"
                    onClick={() => addToast('Audio intercom opened to Bed A-102.', 'info')}
                    style={{ borderColor: '#f87171', color: '#b91c1c', fontSize: 11.5, height: 32 }}
                  >
                    <span>Open Intercom Speaker</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: BEDSIDE 5-RIGHTS MAR MEDICATION ADMINISTRATION */}
      {isMarModalOpen && activeMarItem && (
        <div className="modal-overlay m3-dialog-backdrop" onClick={() => setIsMarModalOpen(false)}>
          <div 
            className="modal-content m3-dialog-container" 
            style={{ maxWidth: 580, padding: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="m3-dialog-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: '#ccfbf1', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#134e4a', margin: 0 }}>
                    Bedside Barcode Medication Administration (BCMA)
                  </h3>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Verified 5-Rights Bedside Protocol</div>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setIsMarModalOpen(false)}><X size={16} /></button>
            </div>

            {/* Patient & Drug Summary */}
            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: 12, borderRadius: 8, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Patient: {activeMarItem.patientName}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#0d9488' }}>{activeMarItem.bed}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>MRN: {activeMarItem.mrn} • Prescribing Doctor: {activeMarItem.prescribedBy}</div>
              
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f766e' }}>{activeMarItem.drug}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Route: {activeMarItem.route} • Dose: {activeMarItem.dose}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, backgroundColor: '#fef3c7', color: '#b45309' }}>
                  Scheduled: {activeMarItem.scheduledTime}
                </span>
              </div>
            </div>

            {/* 5-Rights Verification Checklist */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>
                Bedside 5-Rights Automated Cross-Check:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, backgroundColor: '#f0fdf4', color: '#166534' }}>
                  <CheckCircle2 size={13} /> <span>1. Right Patient ({activeMarItem.patientName})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, backgroundColor: '#f0fdf4', color: '#166534' }}>
                  <CheckCircle2 size={13} /> <span>2. Right Drug ({activeMarItem.drug})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, backgroundColor: '#f0fdf4', color: '#166534' }}>
                  <CheckCircle2 size={13} /> <span>3. Right Dose ({activeMarItem.dose})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, backgroundColor: '#f0fdf4', color: '#166534' }}>
                  <CheckCircle2 size={13} /> <span>4. Right Route ({activeMarItem.route})</span>
                </div>
              </div>
            </div>

            {/* Barcode Scan Simulation */}
            <div style={{ border: '1.5px dashed #99f6e4', backgroundColor: '#f0fdfa', borderRadius: 8, padding: 12, textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0f766e' }}>
                Wristband & Vial Barcode Simulation: <span style={{ fontFamily: 'monospace' }}>BCMA-DOSE-{activeMarItem.id}</span>
              </div>
              <div style={{ fontSize: 10.5, color: '#0d9488', marginTop: 2 }}>
                Camera & Barcode scanner verified match with electronic hospital formulary
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="m3-btn m3-btn-text" onClick={() => setIsMarModalOpen(false)}>
                Cancel
              </button>
              <button 
                className="m3-btn m3-btn-filled" 
                onClick={handleConfirmAdminister}
                style={{ backgroundColor: '#0d9488', color: '#fff', fontSize: 12, height: 34 }}
              >
                <Check size={14} />
                <span>Confirm Dose Administered</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: BEDSIDE VITALS & NEWS2 RECORDING */}
      {isVitalsModalOpen && selectedBed && (
        <div className="modal-overlay m3-dialog-backdrop" onClick={() => setIsVitalsModalOpen(false)}>
          <div 
            className="modal-content m3-dialog-container" 
            style={{ maxWidth: 640, padding: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="m3-dialog-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: 10, marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#134e4a', margin: 0 }}>
                  Record Bedside Vitals & NEWS2 Deterioration Score
                </h3>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Patient: <strong>{selectedBed.patientName}</strong> ({selectedBed.bedNumber}) • {selectedBed.diagnosis}
                </div>
              </div>
              <button className="icon-btn" onClick={() => setIsVitalsModalOpen(false)}><X size={16} /></button>
            </div>

            {/* Live Calculated NEWS2 Banner */}
            <div 
              style={{ 
                padding: '10px 14px', 
                borderRadius: 8, 
                backgroundColor: currentNews2 >= 7 ? '#fef2f2' : currentNews2 >= 5 ? '#fffbeb' : '#f0fdf4',
                border: `1.5px solid ${currentNews2 >= 7 ? '#ef4444' : currentNews2 >= 5 ? '#f59e0b' : '#22c55e'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: currentNews2 >= 7 ? '#b91c1c' : currentNews2 >= 5 ? '#92400e' : '#166534' }}>
                  Live NEWS2 Score: {currentNews2} Points ({currentNews2 >= 7 ? 'HIGH RISK / SEPSIS WATCH' : currentNews2 >= 5 ? 'MEDIUM RISK' : 'LOW RISK'})
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {currentNews2 >= 7 ? '⚠️ Immediate Medical Emergency Team (MET) review advised!' : 'Standard clinical protocol observation.'}
                </div>
              </div>
              <span style={{ fontSize: 18, fontWeight: 900, color: currentNews2 >= 7 ? '#b91c1c' : currentNews2 >= 5 ? '#92400e' : '#166534' }}>
                {currentNews2}
              </span>
            </div>

            {/* Inputs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Systolic Blood Pressure (mmHg)</label>
                <input 
                  type="number"
                  className="m3-input-field" 
                  value={vitalsInput.systolic} 
                  onChange={(e) => setVitalsInput(prev => ({ ...prev, systolic: e.target.value }))}
                  style={{ width: '100%', height: 32, fontSize: 12, marginTop: 4 }} 
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Diastolic Blood Pressure (mmHg)</label>
                <input 
                  type="number" 
                  className="m3-input-field" 
                  value={vitalsInput.diastolic} 
                  onChange={(e) => setVitalsInput(prev => ({ ...prev, diastolic: e.target.value }))}
                  style={{ width: '100%', height: 32, fontSize: 12, marginTop: 4 }} 
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Pulse / Heart Rate (bpm)</label>
                <input 
                  type="number" 
                  className="m3-input-field" 
                  value={vitalsInput.pulse} 
                  onChange={(e) => setVitalsInput(prev => ({ ...prev, pulse: e.target.value }))}
                  style={{ width: '100%', height: 32, fontSize: 12, marginTop: 4 }} 
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>SpO2 Pulse Oximetry (%)</label>
                <input 
                  type="number" 
                  className="m3-input-field" 
                  value={vitalsInput.spo2} 
                  onChange={(e) => setVitalsInput(prev => ({ ...prev, spo2: e.target.value }))}
                  style={{ width: '100%', height: 32, fontSize: 12, marginTop: 4 }} 
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Respiratory Rate (breaths/min)</label>
                <input 
                  type="number" 
                  className="m3-input-field" 
                  value={vitalsInput.respRate} 
                  onChange={(e) => setVitalsInput(prev => ({ ...prev, respRate: e.target.value }))}
                  style={{ width: '100%', height: 32, fontSize: 12, marginTop: 4 }} 
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Body Temperature (°F)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="m3-input-field" 
                  value={vitalsInput.temp} 
                  onChange={(e) => setVitalsInput(prev => ({ ...prev, temp: e.target.value }))}
                  style={{ width: '100%', height: 32, fontSize: 12, marginTop: 4 }} 
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Consciousness (AVPU)</label>
                <select 
                  className="m3-input-field"
                  value={vitalsInput.avpu}
                  onChange={(e) => setVitalsInput(prev => ({ ...prev, avpu: e.target.value }))}
                  style={{ width: '100%', height: 32, fontSize: 12, marginTop: 4 }}
                >
                  <option value="Alert">Alert (A)</option>
                  <option value="Voice">Responsive to Voice (V)</option>
                  <option value="Pain">Responsive to Pain (P)</option>
                  <option value="Unresponsive">Unresponsive (U)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
                <input 
                  type="checkbox"
                  id="onO2Checkbox"
                  checked={vitalsInput.onOxygen}
                  onChange={(e) => setVitalsInput(prev => ({ ...prev, onOxygen: e.target.checked }))}
                />
                <label htmlFor="onO2Checkbox" style={{ fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Patient on Supplemental Oxygen (Adds 2 pts)
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="m3-btn m3-btn-text" onClick={() => setIsVitalsModalOpen(false)}>
                Cancel
              </button>
              <button 
                className="m3-btn m3-btn-filled" 
                onClick={handleSubmitVitals}
                style={{ backgroundColor: '#0d9488', color: '#fff', fontSize: 12, height: 34 }}
              >
                <Check size={14} />
                <span>Save Telemetry & Update Score</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SBAR SHIFT HANDOFF EXPORT */}
      {isSbarModalOpen && (
        <div className="modal-overlay m3-dialog-backdrop" onClick={() => setIsSbarModalOpen(false)}>
          <div 
            className="modal-content m3-dialog-container" 
            style={{ maxWidth: 600, padding: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="m3-dialog-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: 10, marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#134e4a', margin: 0 }}>
                Structured SBAR Shift Handover Sheet
              </h3>
              <button className="icon-btn" onClick={() => setIsSbarModalOpen(false)}><X size={16} /></button>
            </div>

            <textarea
              readOnly
              rows={12}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'monospace',
                lineHeight: 1.5,
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-subtle)'
              }}
              value={`HOSPITAL INPATIENT SBAR SHIFT HANDOVER
Hospital: Bright Solutions Medical Center
Ward: Station 03 - Inpatient & Step-Down
Outgoing Nurse: Sr. Mini Joseph, RN
Date/Time: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}

S (Situation):
- Total Inpatients: ${wardBeds.length}
- Critical Observation: 1 patient (Meera Nair, Bed ICU-04) with NEWS2 Score 7.

B (Background):
- Bed A-101 (Ananya Sharma): Stage 2 HTN; MAR Telmisartan 40mg administered; BP 142/92.
- Bed A-102 (Rajan Pillai): Chest pain observation; Metformin SR scheduled; fall risk high.
- Bed ICU-04 (Meera Nair): Post-op day 1 peritonitis watch; IV Ceftriaxone scheduled; pain score 6/10.

A (Assessment):
- All 5-rights bedside MAR medication doses administered at 100% compliance.
- No adverse drug events or transfusion reactions logged in current shift.

R (Recommendation for Incoming Evening Nurse):
1. Review Bed ICU-04 abdominal drain output at 13:00.
2. Check post-prandial blood sugar for Bed A-102 at 14:30.
3. Prepare discharge summary folder for Bed B-205 (Vikram Sengupta).`}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
              <button 
                className="m3-btn m3-btn-filled"
                onClick={() => {
                  navigator.clipboard?.writeText?.("HOSPITAL INPATIENT SBAR SHIFT HANDOVER...");
                  addToast("SBAR Handover copied to clipboard!", "success");
                  setIsSbarModalOpen(false);
                }}
                style={{ backgroundColor: '#0d9488', color: '#fff', fontSize: 12 }}
              >
                <Copy size={13} />
                <span>Copy to Clipboard</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper icon component for LayoutGrid
function LayoutGridIcon({ size = 14 }) {
  return <Layers size={size} />;
}
