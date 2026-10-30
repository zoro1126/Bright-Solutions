/**
 * IPDPage.jsx — Inpatient Department Shell (Light Design)
 * Route: /ipd, /ipd/beds, /ipd/admissions/*
 *
 * Tabs: Bed Matrix | Active Admissions | Nurse Station & MAR | Discharge Queue
 */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BedMatrixPage from './BedMatrixPage';
import InpatientFolioPage from './InpatientFolioPage';
import {
  Bed, ClipboardList, Activity, LogOut,
  ChevronLeft, ChevronRight, Settings,
  User, AlertTriangle, CheckCircle2, Clock,
  Pill, Droplets, Heart, Search, Filter,
  ArrowRight, Phone,
} from 'lucide-react';

// ─── IPD Sidebar (Light Theme matching OPD sidebar) ──────────────────────────
function IPDSidebar({ activeTab, setActiveTab, collapsed, setCollapsed, onOpenFolio }) {
  const navItems = [
    { id: 'bed-matrix',  label: 'Bed Matrix & Admissions', icon: Bed,           badge: null },
    { id: 'admissions',  label: 'Active Admissions',        icon: ClipboardList, badge: 8   },
    { id: 'nursing',     label: 'Nurse Station & MAR',      icon: Activity,      badge: null },
    { id: 'discharge',   label: 'Discharge Queue',          icon: LogOut,        badge: 3   },
  ];

  const activeColor  = '#0d9488';
  const activeBg     = '#f0fdfa';
  const activeBorder = '#0d9488';

  return (
    <aside
      className={`m3-navigation-drawer ${collapsed ? 'collapsed' : ''}`}
      style={{ borderRight: '1px solid #e2e8f0' }}
    >
      {/* Header */}
      <div className="drawer-header">
        {collapsed ? (
          <button
            className="drawer-brand-btn-collapsed"
            onClick={() => setCollapsed(false)}
            title="Expand"
          >
            <div
              className="drawer-brand-icon"
              style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'linear-gradient(135deg,#0d9488,#0f766e)',
                boxShadow: '0 2px 6px rgba(13,148,136,0.35)',
                color: '#fff',
              }}
            >
              <Bed size={16} strokeWidth={2.4} />
            </div>
            <div className="drawer-expand-indicator">
              <ChevronRight size={10} strokeWidth={3} />
            </div>
          </button>
        ) : (
          <>
            <div className="drawer-brand">
              <div
                className="drawer-brand-icon"
                style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: 'linear-gradient(135deg,#0d9488,#0f766e)',
                  boxShadow: '0 2px 6px rgba(13,148,136,0.35)',
                  color: '#fff',
                }}
              >
                <Bed size={16} strokeWidth={2.4} />
              </div>
              <div className="drawer-brand-text">
                <span className="drawer-title" style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
                  Bright
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginTop: 1 }}>
                  IPD Ward OS
                </span>
              </div>
            </div>
            <button
              className="drawer-toggle-btn"
              onClick={() => setCollapsed(true)}
              title="Collapse"
              style={{ width: 22, height: 22 }}
            >
              <ChevronLeft size={13} />
            </button>
          </>
        )}
      </div>

      {/* Nav Items */}
      <div className="drawer-nav-list">
        {!collapsed && (
          <div className="drawer-section-label">
            <span style={{ color: activeColor, fontWeight: 700 }}>Inpatient Navigation</span>
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`m3-nav-item ${isActive ? 'active' : ''}`}
              style={
                isActive
                  ? { backgroundColor: activeBg, color: activeColor, borderLeft: `3px solid ${activeBorder}`, fontWeight: 700 }
                  : undefined
              }
              onClick={() => setActiveTab(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <div className="nav-icon-container" style={{ color: isActive ? activeColor : '#475569' }}>
                <Icon size={17} strokeWidth={isActive ? 2.5 : 2.2} />
              </div>
              {!collapsed && (
                <>
                  <span className="nav-label" style={{ color: isActive ? activeColor : '#334155', fontWeight: isActive ? 800 : 600 }}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="nav-badge" style={{ background: activeBg, color: activeColor, fontWeight: 700 }}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer staff card */}
      <div className="drawer-footer">
        <div className="drawer-nav-list" style={{ padding: 0 }}>
          <button className="m3-nav-item" title={collapsed ? 'Settings' : undefined}>
            <div className="nav-icon-container" style={{ color: '#475569' }}>
              <Settings size={17} strokeWidth={2.2} />
            </div>
            {!collapsed && <span className="nav-label" style={{ color: '#334155', fontWeight: 600 }}>Settings</span>}
          </button>
        </div>
        {collapsed ? (
          <div className="drawer-staff-collapsed" title="Sr. Mini Joseph • Charge Nurse">
            <div className="staff-avatar" style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)', color: '#fff' }}>MJ</div>
          </div>
        ) : (
          <div className="drawer-staff-card">
            <div className="staff-avatar" style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)', color: '#fff' }}>MJ</div>
            <div className="staff-info">
              <div className="staff-name" style={{ color: '#0f172a' }}>Sr. Mini Joseph</div>
              <div className="staff-role" style={{ color: '#0d9488' }}>Charge Nurse • Ward 02</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Mock ward data ───────────────────────────────────────────────────────────
const WARD_PATIENTS = [
  { id: 'BS-001003', name: 'Vijay Kumar',   bed: 'BED-103', ward: 'GWM-A', doc: 'Dr. Gupta',  day: 5, news2: 8,  shift: 'Morning', bp: '148/92', pulse: 112, spo2: 91, temp: 99.8, nextMed: '14:00', meds: ['Tab. Amlodipine 5mg', 'Inj. Lasix 40mg IV'] },
  { id: 'BS-001001', name: 'Ramesh Kumar',  bed: 'BED-101', ward: 'GWM-A', doc: 'Dr. Sharma', day: 3, news2: 2,  shift: 'Morning', bp: '126/80', pulse: 78,  spo2: 98, temp: 98.6, nextMed: '20:00', meds: ['Tab. Metformin 500mg', 'Tab. Atorvastatin 10mg'] },
  { id: 'BS-001002', name: 'Geeta Sharma',  bed: 'BED-102', ward: 'GWM-A', doc: 'Dr. Mehta',  day: 1, news2: 1,  shift: 'Evening', bp: '118/76', pulse: 72,  spo2: 99, temp: 98.2, nextMed: '20:00', meds: ['Tab. Paracetamol 500mg'] },
  { id: 'BS-001004', name: 'Sunita Devi',   bed: 'BED-104', ward: 'GWM-A', doc: 'Dr. Sharma', day: 2, news2: 3,  shift: 'Evening', bp: '134/86', pulse: 88,  spo2: 96, temp: 100.2, nextMed: '02:00', meds: ['Inj. Augmentin 1.2g IV', 'Tab. Pantoprazole 40mg'] },
  { id: 'BS-001119', name: 'Lakshmi Rajan', bed: 'BED-119', ward: 'ICU-A', doc: 'Dr. Gupta',  day: 2, news2: 11, shift: 'Morning', bp: '92/60',  pulse: 124, spo2: 88, temp: 103.4, nextMed: '14:00', meds: ['Inj. Noradrenaline drip', 'Inj. Meropenem 1g IV'] },
];

const DISCHARGE_QUEUE = [
  { id: 'BS-001005', name: 'Arjun Singh',   bed: 'BED-105', ward: 'GWM-A', doc: 'Dr. Mehta',  day: 4, condition: 'IMPROVED',  billAmount: 24500, advance: 10000, settled: false },
  { id: 'BS-001007', name: 'Mohan Rao',     bed: 'BED-107', ward: 'GWM-B', doc: 'Dr. Gupta',  day: 7, condition: 'STABLE',    billAmount: 38200, advance: 15000, settled: false },
  { id: 'BS-001012', name: 'Meena Chandra', bed: 'BED-112', ward: 'GWF-A', doc: 'Dr. Mehta',  day: 2, condition: 'RELIEVED',  billAmount: 12800, advance: 8000,  settled: true  },
];

// ─── Active Admissions Tab ────────────────────────────────────────────────────
function ActiveAdmissionsTab({ onOpenFolio }) {
  const news2Color = (s) => s >= 7 ? '#dc2626' : s >= 5 ? '#d97706' : '#10b981';
  const news2Bg    = (s) => s >= 7 ? '#fee2e2' : s >= 5 ? '#fffbeb' : '#f0fdf4';

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>Active Admissions</div>
        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#6d28d9', fontWeight: 700 }}>
          {WARD_PATIENTS.length} Admitted
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {WARD_PATIENTS.map(p => (
          <div key={p.id} style={{
            background: '#fff', borderRadius: 12, border: '1.5px solid #e2e8f0', padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 11,
              background: 'linear-gradient(135deg,#6d28d9,#5b21b6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {p.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{p.name}</span>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 800,
                  background: news2Bg(p.news2), color: news2Color(p.news2), border: `1px solid ${news2Color(p.news2)}40` }}>
                  NEWS2: {p.news2}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                {p.id} • {p.bed} • {p.ward} • Day {p.day} • {p.doc}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, minWidth: 280 }}>
              {[['BP', p.bp],['Pulse', p.pulse+'bpm'],['SpO₂', p.spo2+'%'],['Temp', p.temp+'°F']].map(([label,val]) => (
                <div key={label} style={{ background: '#f8fafc', borderRadius: 7, padding: '5px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8' }}>{label}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a' }}>{val}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => onOpenFolio({ patient: { name: p.name, uhid: p.id, doc: p.doc, admDay: p.day, news2: p.news2 }, bed: { id: p.bed, wardName: p.ward } })}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                background: 'linear-gradient(135deg,#6d28d9,#5b21b6)', color: '#fff', fontSize: 12, fontWeight: 700,
              }}>
              Open Folio <ArrowRight size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Nurse Station & MAR Tab ──────────────────────────────────────────────────
function NurseStationTab() {
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [marCells, setMarCells] = useState({});

  const filtered = WARD_PATIENTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.bed.toLowerCase().includes(search.toLowerCase())
  );

  const news2Color = (s) => s >= 7 ? '#dc2626' : s >= 5 ? '#d97706' : s >= 3 ? '#ca8a04' : '#10b981';
  const news2Bg    = (s) => s >= 7 ? '#fee2e2' : s >= 5 ? '#fffbeb' : s >= 3 ? '#fefce8' : '#f0fdf4';

  const toggleMAR = (patId, med, day) => {
    const key = `${patId}|${med}|${day}`;
    setMarCells(c => ({ ...c, [key]: !c[key] }));
  };

  const DAYS = ['Day 1','Day 2','Day 3','Day 4','Day 5','Day 6'];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>Nurse Station & MAR</div>
        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f0fdfa', border: '1px solid #99f6e4', color: '#0d9488', fontWeight: 700 }}>
          {WARD_PATIENTS.length} Active Patients
        </span>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 340, marginBottom: 16 }}>
        <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
        <input type="text" placeholder="Search patient or bed…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 12.5, outline: 'none', boxSizing: 'border-box' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedPatient ? '340px 1fr' : '1fr', gap: 16 }}>
        {/* Patient list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(p => (
            <div key={p.id}
              onClick={() => setSelectedPatient(selectedPatient?.id === p.id ? null : p)}
              style={{
                background: '#fff', borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                border: `1.5px solid ${selectedPatient?.id === p.id ? '#0d9488' : '#e2e8f0'}`,
                boxShadow: selectedPatient?.id === p.id ? '0 0 0 3px #0d948820' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{p.bed} • {p.ward} • Day {p.day} • {p.doc}</div>
                </div>
                <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 800,
                  background: news2Bg(p.news2), color: news2Color(p.news2), border: `1px solid ${news2Color(p.news2)}40` }}>
                  NEWS2: {p.news2}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {[['BP', p.bp],['Pulse', p.pulse+' bpm'],['SpO₂', p.spo2+'%'],['Temp', p.temp+'°F']].map(([label, val]) => (
                  <div key={label} style={{ background: '#f8fafc', borderRadius: 7, padding: '5px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8' }}>{label}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', marginTop: 1 }}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <Clock size={11} color="#64748b" />
                <span style={{ fontSize: 11, color: '#64748b' }}>Next med: <strong>{p.nextMed}</strong></span>
                {p.news2 >= 7 && (
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, color: '#dc2626' }}>
                    <AlertTriangle size={10} /> CRITICAL
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* MAR detail panel */}
        {selectedPatient && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
            {/* Patient header */}
            <div style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)', padding: '16px 20px' }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{selectedPatient.name}</div>
              <div style={{ fontSize: 11, color: '#99f6e4', marginTop: 2 }}>
                {selectedPatient.id} • {selectedPatient.bed} • {selectedPatient.ward} • {selectedPatient.doc}
              </div>
            </div>

            {/* Form 29 — 6-Day MAR Grid */}
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
                📋 Form 29 — Medication Administration Record (6-Day)
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#334155', borderBottom: '2px solid #e2e8f0', minWidth: 180 }}>Drug / Order</th>
                      {DAYS.map(d => (
                        <th key={d} style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#334155', borderBottom: '2px solid #e2e8f0', minWidth: 70 }}>{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPatient.meds.map((med, mi) => (
                      <tr key={mi} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Pill size={13} color="#0d9488" />
                            {med}
                          </div>
                        </td>
                        {DAYS.map((d, di) => {
                          const key = `${selectedPatient.id}|${med}|${di}`;
                          const given = marCells[key];
                          const past = di < selectedPatient.day - 1;
                          return (
                            <td key={di} style={{ padding: '6px', textAlign: 'center' }}>
                              <button
                                onClick={() => toggleMAR(selectedPatient.id, med, di)}
                                style={{
                                  width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                                  border: `1.5px solid ${given ? '#10b981' : past ? '#e2e8f0' : '#cbd5e1'}`,
                                  background: given ? '#f0fdf4' : past ? '#f8fafc' : '#fff',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'all 0.1s',
                                }}
                              >
                                {given
                                  ? <CheckCircle2 size={16} color="#10b981" />
                                  : <span style={{ fontSize: 9, fontWeight: 700, color: past ? '#cbd5e1' : '#94a3b8' }}>{past ? '—' : '○'}</span>
                                }
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Form 72 shift notes */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>📝 Form 72 — Shift Progress Notes</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {['Morning (07:00–15:00)','Evening (15:00–23:00)','Night (23:00–07:00)'].map((shift, si) => (
                    <div key={si}>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 5 }}>{shift}</label>
                      <textarea placeholder={`${shift.split(' ')[0]} handover notes…`} rows={4}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 11.5,
                          resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Nursing checklist */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>⚕ Nursing Care Checklist</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {['Vitals recorded in chart','Medications administered & signed','IV line patent & site checked','Pressure area care done','Fluid balance documented','Patient repositioned (2-hourly)'].map((item, i) => (
                    <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                      padding: '8px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <input type="checkbox" style={{ accentColor: '#0d9488' }} />
                      <span style={{ fontSize: 11.5, color: '#334155', fontWeight: 500 }}>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button style={{
                marginTop: 16, display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 20px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#0d9488,#0f766e)', color: '#fff', fontSize: 12.5, fontWeight: 700,
              }}>
                💾 Save Shift Record
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Discharge Queue Tab ──────────────────────────────────────────────────────
function DischargeQueueTab({ onOpenFolio }) {
  const navigate = useNavigate();
  const condColor = { STABLE: '#10b981', IMPROVED: '#0077b6', RELIEVED: '#6d28d9', LAMA: '#d97706', EXPIRED: '#64748b', TRANSFERRED: '#0d9488' };
  const condBg    = { STABLE: '#f0fdf4', IMPROVED: '#eff6ff', RELIEVED: '#f5f3ff', LAMA: '#fffbeb', EXPIRED: '#f8fafc', TRANSFERRED: '#f0fdfa' };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>Discharge Queue</div>
        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706', fontWeight: 700 }}>
          {DISCHARGE_QUEUE.filter(p => !p.settled).length} Pending Settlement
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {DISCHARGE_QUEUE.map(p => (
          <div key={p.id} style={{
            background: '#fff', borderRadius: 14, border: `1.5px solid ${p.settled ? '#d1fae5' : '#e2e8f0'}`,
            padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 11,
                  background: p.settled ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#d97706,#b45309)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: '#fff' }}>
                  {p.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    {p.id} • {p.bed} • Day {p.day} • {p.doc}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800,
                  background: condBg[p.condition] || '#f8fafc', color: condColor[p.condition] || '#64748b',
                  border: `1.5px solid ${condColor[p.condition] || '#e2e8f0'}40` }}>
                  {p.condition}
                </span>
                {p.settled
                  ? <span style={{ padding: '4px 12px', borderRadius: 8, background: '#f0fdf4', border: '1.5px solid #86efac', color: '#15803d', fontSize: 11, fontWeight: 800 }}>
                      ✅ SETTLED
                    </span>
                  : <span style={{ padding: '4px 12px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #fde68a', color: '#d97706', fontSize: 11, fontWeight: 800 }}>
                      ⏳ PENDING
                    </span>
                }
              </div>
            </div>

            {/* Bill summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[
                ['Gross Bill', `₹${p.billAmount.toLocaleString('en-IN')}`, '#0f172a'],
                ['Advance Paid', `₹${p.advance.toLocaleString('en-IN')}`, '#0d9488'],
                ['Balance Due', `₹${(p.billAmount - p.advance).toLocaleString('en-IN')}`, p.settled ? '#10b981' : '#dc2626'],
                ['Stay Duration', `${p.day} days`, '#6d28d9'],
              ].map(([label, value, color]) => (
                <div key={label} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  if (onOpenFolio) {
                    onOpenFolio({
                      patient: { name: p.name, uhid: p.id, admDay: p.day, doc: p.doc },
                      bed: { id: p.bed, wardName: 'General Ward' }
                    });
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8,
                  border: '1.5px solid #0d9488', background: '#fff', color: '#0d9488', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>
                📋 View Folio
              </button>
              <button
                onClick={() => navigate(`/ipd/admissions/${p.id}/discharge`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8,
                  border: '1.5px solid #6d28d9', background: '#fff', color: '#6d28d9', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>
                🖨️ Print Summary
              </button>
              {!p.settled && (
                <button
                  onClick={() => navigate(`/billing/ipd-settlement/${p.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8,
                    border: 'none', background: 'linear-gradient(135deg,#d97706,#b45309)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>
                  💰 Process Settlement <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── Main IPDPage ─────────────────────────────────────────────────────────────
export default function IPDPage({ onSwitchDept, onLogout }) {
  const [activeTab, setActiveTab]           = useState('bed-matrix');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // selectedAdmission: when user clicks "Open Folio" on an occupied bed
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  // When BedMatrix triggers "Open Folio" → switch to admissions tab
  const handleOpenFolio = (admission) => {
    setSelectedAdmission(admission);
    setActiveTab('admissions');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar
        dept="IPD"
        currentRole="nurse"
        onRoleChange={onSwitchDept}
        onLogout={onLogout}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <IPDSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        <main style={{ flex: 1, overflow: 'auto', background: '#f8fafc' }}>
          {activeTab === 'bed-matrix' && (
            <BedMatrixPage embedded onOpenFolioExternal={handleOpenFolio} />
          )}

          {activeTab === 'admissions' && (
            selectedAdmission
              ? <InpatientFolioPage admission={selectedAdmission} onBack={() => { setSelectedAdmission(null); }} />
              : <ActiveAdmissionsTab onOpenFolio={(adm) => { setSelectedAdmission(adm); }} />
          )}

          {activeTab === 'nursing' && (
            <NurseStationTab />
          )}

          {activeTab === 'discharge' && (
            <DischargeQueueTab onOpenFolio={handleOpenFolio} />
          )}
        </main>
      </div>
    </div>
  );
}
