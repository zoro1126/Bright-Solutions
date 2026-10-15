import React, { useState, useMemo, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import AdminFlowGuideModal from '../components/AdminFlowGuideModal';
import { 
  Users, 
  Receipt, 
  Stethoscope, 
  ShieldCheck, 
  TrendingUp, 
  Activity, 
  BarChart3, 
  UserCheck, 
  UserX, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  FileText, 
  Building2, 
  X,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  Download,
  Sparkles
} from 'lucide-react';
import { usePatients } from '../context/PatientContext';
import { admin as adminApi } from '../services/api';

const INITIAL_STAFF = [
  { id: 'usr-15', name: 'DevAdmin', role: 'Hospital Administrator', dept: 'Executive Directorate', shift: 'All Shifts', email: 'devadmin@clinic.com', active: true, consultationsCount: 0 },
  { id: 'usr-16', name: 'DevDoc', role: 'Doctor (General & Internal Medicine)', dept: 'OPD Chamber 01', shift: 'Morning (08:00 - 14:00)', email: 'devdoc@clinic.com', active: true, consultationsCount: 42 },
  { id: 'usr-17', name: 'DevRec', role: 'Receptionist', dept: 'Counter 01 (Triage)', shift: 'Morning (07:30 - 15:30)', email: 'devrec@clinic.com', active: true, consultationsCount: 65 },
  { id: 'usr-18', name: 'DevCash', role: 'Cashier / Billing', dept: 'Counter B-01 (Settlement)', shift: 'Morning (08:00 - 16:00)', email: 'devcash@clinic.com', active: true, consultationsCount: 58 }
];

const INITIAL_AUDIT_LOGS = [
  { id: 'log-101', timestamp: '10:42 AM', user: 'DevDoc', role: 'Doctor', category: 'CDSS_OVERRIDE', severity: 'HIGH', patientMrn: 'UHID-2026-00004', details: 'Confirmed Amlodipine 5mg + Telmisartan 40mg initiation with scheduled fasting lipid and renal panel repeat in 14 days.' },
  { id: 'log-102', timestamp: '10:15 AM', user: 'DevCash', role: 'Cashier', category: 'BILLING_ADJUSTMENT', severity: 'MEDIUM', patientMrn: 'UHID-2026-00002', details: 'Applied 100% Cashless Government Scheme package under Ayushman Bharat PM-JAY (AB-PMJAY) golden card verification.' },
  { id: 'log-103', timestamp: '09:50 AM', user: 'DevRec', role: 'Receptionist', category: 'TRIAGE_EDIT', severity: 'LOW', patientMrn: 'UHID-2026-00005', details: 'Updated emergency contact number and assigned walk-in to DevDoc queue.' },
  { id: 'log-104', timestamp: '09:12 AM', user: 'DevAdmin', role: 'Admin', category: 'USER_AUTH', severity: 'INFO', patientMrn: '—', details: 'Developer test credentials seeded and active session validated.' }
];

export default function AdminPage({ currentRole = 'admin', onSwitchRole, activeSubTab = 'dashboard', onLogout }) {
  const { patients } = usePatients();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState(activeSubTab || 'dashboard'); // 'dashboard' | 'staff' | 'audit'
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
  // Staff state
  const [staffList, setStaffList] = useState(INITIAL_STAFF);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'Doctor (General & Internal Medicine)',
    dept: 'OPD Station 01',
    shift: 'Morning (08:00 - 14:00)',
    email: '',
    phone: ''
  });

  // Audit filter state
  const [auditFilter, setAuditFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');

  // Fetch real staff roster from backend
  useEffect(() => {
    async function loadStaff() {
      try {
        const res = await adminApi.staff();
        if (Array.isArray(res) && res.length > 0) {
          const mapped = res.map(s => ({
            id: s.id,
            name: s.full_name || s.username,
            role: s.role === 'DOCTOR' ? 'Doctor (General & Internal Medicine)' : s.role === 'RECEPTIONIST' ? 'Receptionist' : s.role === 'CASHIER' ? 'Cashier / Billing' : 'Hospital Administrator',
            dept: s.role === 'DOCTOR' ? 'OPD Chamber 03' : s.role === 'RECEPTIONIST' ? 'Counter 01 (Triage)' : s.role === 'CASHIER' ? 'Counter B-02 (Settlement)' : 'Executive Directorate',
            shift: 'General OPD (08:00 - 16:00)',
            email: s.email || `${s.username}@clinic.com`,
            phone: s.phone || '+91 98765 43210',
            active: Boolean(s.is_active),
            consultationsCount: s.role === 'DOCTOR' ? 14 : 28
          }));
          setStaffList(mapped);
        }
      } catch (err) {
        console.warn('Backend staff load error, using local fallback:', err.message);
      }
    }
    loadStaff();
  }, []);

  const toggleStaffStatus = async (id) => {
    const current = staffList.find(s => s.id === id);
    const newActive = current ? !current.active : false;
    setStaffList(prev => prev.map(s => s.id === id ? { ...s, active: newActive } : s));
    try {
      if (typeof id === 'number') {
        await adminApi.toggleStatus(id, newActive);
      }
    } catch (err) {
      console.warn('Backend toggle status error:', err.message);
    }
  };

  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    if (!newStaff.name.trim()) return;
    const staffItem = {
      id: `usr-${Date.now()}`,
      name: newStaff.name,
      role: newStaff.role,
      dept: newStaff.dept,
      shift: newStaff.shift,
      email: newStaff.email || `${newStaff.name.toLowerCase().replace(/\s+/g, '.')}@clinic.com`,
      active: true,
      consultationsCount: 0
    };
    setStaffList(prev => [staffItem, ...prev]);
    setIsAddStaffOpen(false);

    try {
      const roleEnum = newStaff.role.toLowerCase().includes('doc') ? 'DOCTOR' : newStaff.role.toLowerCase().includes('cash') ? 'CASHIER' : 'RECEPTIONIST';
      await adminApi.createStaff({
        username: newStaff.email ? newStaff.email.split('@')[0] : `user_${Date.now()}`,
        password: 'password123',
        full_name: newStaff.name,
        role: roleEnum,
        email: newStaff.email || null,
        phone: newStaff.phone || null
      });
    } catch (err) {
      console.warn('Backend staff creation local fallback:', err.message);
    }

    setNewStaff({
      name: '',
      role: 'Doctor (General & Internal Medicine)',
      dept: 'OPD Station 01',
      shift: 'Morning (08:00 - 14:00)',
      email: '',
      phone: ''
    });
  };

  const filteredLogs = useMemo(() => {
    return INITIAL_AUDIT_LOGS.filter(log => {
      const matchSearch = log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
                          log.user.toLowerCase().includes(auditSearch.toLowerCase()) ||
                          log.patientMrn.toLowerCase().includes(auditSearch.toLowerCase());
      if (!matchSearch) return false;
      if (auditFilter === 'ALL') return true;
      return log.category === auditFilter;
    });
  }, [auditFilter, auditSearch]);

  return (
    <div className="m3-app-shell admin-theme">
      {/* Sidebar Navigation */}
      <Sidebar 
        role="admin"
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <div className="m3-main-viewport">
        <Navbar 
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          currentRole={currentRole}
          onRoleChange={onSwitchRole}
          onLogout={onLogout}
          onOpenAdminGuide={() => setIsGuideOpen(true)}
        />

        <main className="page-container m3-page-animate" style={{ maxWidth: '100%', width: '100%', margin: 0, padding: '16px 20px', boxSizing: 'border-box' }}>
          {/* Header Banner — Executive Sovereign Navy & Cobalt */}
          <div className="m3-doctor-patient-banner" style={{ marginBottom: 16, border: '1.5px solid var(--adm-banner-border, #bfdbfe)', background: 'var(--adm-banner-bg, linear-gradient(135deg, #ffffff 0%, #eff6ff 100%))' }}>
            <div className="stat-card-accent-blob" style={{ top: -20, right: -20, width: 96, height: 96, opacity: 0.65, background: 'radial-gradient(circle, var(--adm-accent-color, #2563eb) 0%, rgba(37, 99, 235, 0) 70%)' }} />
            <div className="m3-patient-banner-info" style={{ position: 'relative', zIndex: 1 }}>
              <div className="stat-squircle-badge" style={{ width: 44, height: 44, borderRadius: 13, fontSize: 16, background: 'var(--adm-brand-gradient, linear-gradient(135deg, #0f172a, #1e3a8a))', color: '#ffffff', boxShadow: 'var(--adm-brand-shadow, 0 4px 10px rgba(30, 58, 138, 0.35))' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 19, fontWeight: 900, color: 'var(--adm-banner-title, #0f172a)', letterSpacing: '-0.02em', margin: 0 }}>
                    Executive Hospital Governance & Clinical Audit
                  </h2>
                  <span className="brand-counter-pill" style={{ background: 'var(--adm-pill-bg, #dbeafe)', color: 'var(--adm-pill-color, #1e40af)', border: '1px solid var(--adm-pill-border, #93c5fd)', fontWeight: 700, fontSize: 10 }}>Real-Time Operational Oversight</span>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Hospital clinical performance, physician roster management, and regulatory compliance audit trail.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button 
                type="button"
                onClick={() => setIsGuideOpen(true)}
                className="m3-btn anim-hover-lift"
                style={{ 
                  height: 32, 
                  fontSize: 11.5,
                  background: 'linear-gradient(135deg, #dbeafe, #ffffff)',
                  color: '#1e40af',
                  border: '1.5px solid #93c5fd',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.15)'
                }}
                title="Open Executive Admin Guide"
              >
                <Sparkles size={13} color="#2563eb" />
                <span>Admin Guide ⚡</span>
              </button>
              <button 
                className="m3-btn"
                onClick={() => setActiveTab('dashboard')}
                style={{ 
                  height: 32, 
                  fontSize: 11.5,
                  background: activeTab === 'dashboard' ? 'var(--adm-brand-gradient, linear-gradient(135deg, #1e3a8a, #2563eb))' : 'var(--bg-subtle)',
                  color: activeTab === 'dashboard' ? '#ffffff' : 'var(--text-primary)',
                  border: activeTab === 'dashboard' ? 'none' : '1px solid var(--border-default)',
                  fontWeight: 700
                }}
              >
                <TrendingUp size={14} />
                <span>Executive Analytics</span>
              </button>
              <button 
                className="m3-btn"
                onClick={() => setActiveTab('staff')}
                style={{ 
                  height: 32, 
                  fontSize: 11.5,
                  background: activeTab === 'staff' ? 'var(--adm-brand-gradient, linear-gradient(135deg, #1e3a8a, #2563eb))' : 'var(--bg-subtle)',
                  color: activeTab === 'staff' ? '#ffffff' : 'var(--text-primary)',
                  border: activeTab === 'staff' ? 'none' : '1px solid var(--border-default)',
                  fontWeight: 700
                }}
              >
                <Users size={14} />
                <span>Staff Roster ({staffList.length})</span>
              </button>
              <button 
                className="m3-btn"
                onClick={() => setActiveTab('audit')}
                style={{ 
                  height: 32, 
                  fontSize: 11.5,
                  background: activeTab === 'audit' ? 'var(--adm-brand-gradient, linear-gradient(135deg, #1e3a8a, #2563eb))' : 'var(--bg-subtle)',
                  color: activeTab === 'audit' ? '#ffffff' : 'var(--text-primary)',
                  border: activeTab === 'audit' ? 'none' : '1px solid var(--border-default)',
                  fontWeight: 700
                }}
              >
                <FileText size={14} />
                <span>Audit Logs</span>
              </button>
            </div>
          </div>

          {/* TAB 1: P-ADM-01 Executive Governance & Clinic Analytics */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Executive KPIs Grid — High-Contrast Executive Navy & Metric Accents */}
              <div className="stats-grid">
                {/* Card 1: Weekly Footfall — Midnight Navy (#0f172a & #1e3a8a) */}
                <div className="stat-card anim-hover-lift">
                  <div className="stat-card-accent-blob" style={{ background: 'radial-gradient(circle, var(--adm-pill-bg, #dbeafe) 0%, rgba(219, 234, 254, 0) 70%)' }} />
                  <div className="stat-squircle-badge" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', color: '#ffffff', boxShadow: '0 4px 10px rgba(30, 58, 138, 0.35)' }}>
                    <Users size={16} strokeWidth={2.4} />
                  </div>
                  <div className="stat-card-value" style={{ color: 'var(--adm-banner-title, #0f172a)' }}>184</div>
                  <div className="stat-card-label">Weekly Footfall</div>
                  <div style={{ fontSize: 10.5, color: 'var(--adm-accent-color, #2563eb)', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ArrowUpRight size={12} /> +14.2% vs last week
                  </div>
                </div>

                {/* Card 2: Gross Revenue Today — Emerald Treasury (#065f46 & #059669) */}
                <div className="stat-card anim-hover-lift">
                  <div className="stat-card-accent-blob" style={{ background: 'radial-gradient(circle, #d1fae5 0%, rgba(209, 250, 229, 0) 70%)' }} />
                  <div className="stat-squircle-badge" style={{ background: 'linear-gradient(135deg, #065f46, #059669)', color: '#ffffff', boxShadow: '0 4px 10px rgba(5, 150, 105, 0.35)' }}>
                    <Receipt size={16} strokeWidth={2.4} />
                  </div>
                  <div className="stat-card-value" style={{ color: '#065f46' }}>₹4.82L</div>
                  <div className="stat-card-label">Gross Revenue Today</div>
                  <div style={{ fontSize: 10.5, color: '#059669', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ArrowUpRight size={12} /> 94% Settled
                  </div>
                </div>

                {/* Card 3: Clinical Resolution Rate — Royal Cobalt Blue (#1d4ed8 & #2563eb) */}
                <div className="stat-card anim-hover-lift">
                  <div className="stat-card-accent-blob" style={{ background: 'radial-gradient(circle, #dbeafe 0%, rgba(219, 234, 254, 0) 70%)' }} />
                  <div className="stat-squircle-badge" style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: '#ffffff', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.35)' }}>
                    <Activity size={16} strokeWidth={2.4} />
                  </div>
                  <div className="stat-card-value" style={{ color: '#1e3a8a' }}>92.4%</div>
                  <div className="stat-card-label">Clinical Resolution Rate</div>
                  <div style={{ fontSize: 10.5, color: '#2563eb', fontWeight: 700, marginTop: 4 }}>
                    Avg triage time: 6.8 min
                  </div>
                </div>

                {/* Card 4: Avg Encounter Throughput — Amber Gold (#d97706 & #b45309) */}
                <div className="stat-card anim-hover-lift">
                  <div className="stat-card-accent-blob" style={{ background: 'radial-gradient(circle, #fef3c7 0%, rgba(254, 243, 199, 0) 70%)' }} />
                  <div className="stat-squircle-badge" style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', color: '#ffffff', boxShadow: '0 4px 10px rgba(217, 119, 6, 0.35)' }}>
                    <Stethoscope size={16} strokeWidth={2.4} />
                  </div>
                  <div className="stat-card-value" style={{ color: '#78350f' }}>18 min</div>
                  <div className="stat-card-label">Avg Encounter Throughput</div>
                  <div style={{ fontSize: 10.5, color: '#b45309', fontWeight: 700, marginTop: 4 }}>
                    On-target benchmark
                  </div>
                </div>
              </div>

              {/* Analytics Visualization Panels */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
                {/* Panel 1: Gross Revenue & Settlement Trajectory Area Chart */}
                <div className="card" style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TrendingUp size={15} color="#0077B6" />
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          Daily Collections & Revenue Trajectory
                        </h3>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                        Settlement breakdown across Cashless Govt Scheme (AB-PMJAY) vs Private TPA
                      </p>
                    </div>
                    <span className="badge badge-ready">₹4.82L Target Beat</span>
                  </div>

                  {/* Legend */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12, fontSize: 11 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)' }}>
                      <span style={{ width: 12, height: 3, background: '#0077B6', borderRadius: 2 }} />
                      <span>AB-PMJAY Cashless</span>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)' }}>
                      <span style={{ width: 12, height: 3, background: '#00B4D8', borderRadius: 2 }} />
                      <span>Private / Corporate TPA</span>
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: 10.5, color: '#0077B6', fontWeight: 800 }}>
                      94% Settled On-Day
                    </span>
                  </div>

                  {/* SVG Area Graph */}
                  <div style={{ position: 'relative', height: 135 }}>
                    <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 360 110" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="adminAreaPmjay" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0077B6" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="#0077B6" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="adminAreaPrivate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00B4D8" stopOpacity="0.22" />
                          <stop offset="100%" stopColor="#00B4D8" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Grid lines */}
                      <line x1="10" y1="20" x2="350" y2="20" stroke="#CAF0F8" strokeDasharray="3 3" />
                      <line x1="10" y1="55" x2="350" y2="55" stroke="#CAF0F8" strokeDasharray="3 3" />
                      <line x1="10" y1="90" x2="350" y2="90" stroke="#CAF0F8" strokeDasharray="3 3" />
                      
                      {/* PMJAY Curve & Fill */}
                      <path d="M 20 80 Q 75 40 130 50 T 240 25 T 340 18 L 340 100 L 20 100 Z" fill="url(#adminAreaPmjay)" />
                      <path d="M 20 80 Q 75 40 130 50 T 240 25 T 340 18" fill="none" stroke="#0077B6" strokeWidth="2.5" strokeLinecap="round" />
                      
                      {/* Private TPA Curve & Fill */}
                      <path d="M 20 92 Q 75 65 130 72 T 240 45 T 340 38 L 340 100 L 20 100 Z" fill="url(#adminAreaPrivate)" />
                      <path d="M 20 92 Q 75 65 130 72 T 240 45 T 340 38" fill="none" stroke="#00B4D8" strokeWidth="2" strokeDasharray="4 2" strokeLinecap="round" />

                      {/* Key Marker Dots */}
                      <circle cx="240" cy="25" r="3.5" fill="#0077B6" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="340" cy="18" r="4" fill="#0077B6" stroke="#ffffff" strokeWidth="2" />
                    </svg>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4, padding: '0 4px' }}>
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Today</span>
                  </div>
                </div>

                {/* Panel 2: Weekly Walk-In Footfall with Coastal Theme Bar Graph */}
                <div className="card" style={{ padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <BarChart3 size={15} color="#00B4D8" />
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          Weekly Walk-in Patient Footfall
                        </h3>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                        Distribution across OPD clinic shifts & weekend velocity
                      </p>
                    </div>
                    <span className="badge badge-ready">7-Day Trend</span>
                  </div>

                  {/* Coastal Styled Bar Graph */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 130, padding: '0 8px', gap: 10 }}>
                    {[
                      { day: 'Mon', count: 38, h: 72 },
                      { day: 'Tue', count: 42, h: 80 },
                      { day: 'Wed', count: 35, h: 66 },
                      { day: 'Thu', count: 48, h: 90 },
                      { day: 'Fri', count: 50, h: 95 },
                      { day: 'Sat', count: 32, h: 60 },
                      { day: 'Sun', count: 18, h: 36 }
                    ].map((item, idx) => (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>{item.count}</span>
                        <div style={{ 
                          width: '100%', 
                          maxWidth: 28, 
                          height: item.h, 
                          background: idx === 4 ? 'linear-gradient(180deg, #0077B6, #00B4D8)' : '#CAF0F8', 
                          border: idx === 4 ? '1px solid #0077B6' : '1px solid #90E0EF', 
                          borderRadius: '6px 6px 2px 2px', 
                          transition: 'all 0.2s ease' 
                        }} />
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)' }}>{item.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Panel 3: Doctor Workload Distribution & Turnaround SLA */}
                <div className="card" style={{ padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Stethoscope size={15} color="#0077B6" />
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          Physician Workload & Case Complexity Matrix
                        </h3>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                        Active visits queue balance & CDSS clinical compliance
                      </p>
                    </div>
                    <span className="card-count-badge">4 Consultants Active</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { name: 'Dr. Kiran Patel (Medical Onc.)', activeVisits: 14, capacity: 20, pct: 70, color: '#0077B6' },
                      { name: 'Dr. Swaminathan (Surgical Onc.)', activeVisits: 11, capacity: 15, pct: 73, color: '#00B4D8' },
                      { name: 'Dr. Radhika Sen (Radiation Onc.)', activeVisits: 8, capacity: 15, pct: 53, color: '#0284c7' },
                      { name: 'Dr. Anand Deshmukh (Hematology)', activeVisits: 6, capacity: 12, pct: 50, color: '#0096c7' }
                    ].map((doc, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{doc.name}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            <strong>{doc.activeVisits}</strong> / {doc.capacity} Patients ({doc.pct}%)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: 7, background: '#CAF0F8', borderRadius: 9999, overflow: 'hidden' }}>
                          <div style={{ width: `${doc.pct}%`, height: '100%', background: doc.color, borderRadius: 9999 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Panel 4: Clinical Quality & Turnaround Time Benchmark */}
                <div className="card" style={{ padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Activity size={15} color="#00B4D8" />
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          OPD Patient Resolution Speed & Throughput
                        </h3>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                        End-to-end turnaround: Intake → Triage → Consultation → Settlement
                      </p>
                    </div>
                    <span className="badge badge-ready">18.2 min Avg</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { step: '1. Receptionist Intake Registration', time: '3.4 min', target: '< 4 min', pct: 85, color: '#0077B6' },
                      { step: '2. Clinical Vitals & Triage Staging', time: '4.8 min', target: '< 6 min', pct: 80, color: '#00B4D8' },
                      { step: '3. Physician Consultation & CDSS Rx', time: '8.2 min', target: '< 10 min', pct: 82, color: '#0284c7' },
                      { step: '4. Billing Settlement & Token Discharge', time: '1.8 min', target: '< 3 min', pct: 60, color: '#90E0EF' }
                    ].map((step, idx) => (
                      <div key={idx} style={{ padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{step.step}</span>
                          <span style={{ fontWeight: 700, color: '#0077B6' }}>{step.time} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({step.target})</span></span>
                        </div>
                        <div style={{ width: '100%', height: 5, background: '#CAF0F8', borderRadius: 9999, overflow: 'hidden' }}>
                          <div style={{ width: `${step.pct}%`, height: '100%', background: step.color, borderRadius: 9999 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Panel 5: Disease Prevalence & Clinical Case Mix */}
                <div className="card" style={{ padding: 18, gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                        Disease Prevalence & Clinical Case Mix (Current Month)
                      </h3>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>
                        ICD-10 clinical multispeciality diagnostic distribution
                      </p>
                    </div>
                    <span className="badge badge-active">ICD-10 Categorized</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    {[
                      { label: 'Essential Hypertension (I10)', cases: 54, share: '32%', badge: 'High Footfall', color: '#0077B6' },
                      { label: 'Type 2 Diabetes Mellitus (E11)', cases: 38, share: '22%', badge: 'Metabolic Clinic', color: '#00B4D8' },
                      { label: 'Bronchial Asthma & COPD (J44)', cases: 31, share: '18%', badge: 'Airway Clinic', color: '#0284c7' },
                      { label: 'Acid Peptic & Gallbladder (K80)', cases: 26, share: '15%', badge: 'GI / Surgery', color: '#0096c7' },
                      { label: 'Coronary Artery Disease (I25)', cases: 22, share: '13%', badge: 'Cardiology Care', color: '#48cae4' }
                    ].map((c, idx) => (
                      <div key={idx} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: c.color, textTransform: 'uppercase' }}>
                          {c.share} Total Mix
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                          {c.label}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, fontSize: 11 }}>
                          <span style={{ color: 'var(--text-secondary)' }}><strong>{c.cases}</strong> confirmed cases</span>
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#CAF0F8', color: '#0077B6', fontWeight: 600 }}>
                            {c.badge}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: P-ADM-02 Staff Provisioning & Duty Roster */}
          {activeTab === 'staff' && (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                    Hospital Staff Directory & Access Provisioning
                  </h3>
                  <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: 0 }}>
                    Manage physician stations, clinical roles, shifts, and immediate access revocation.
                  </p>
                </div>
                <button
                  className="m3-btn m3-btn-filled"
                  onClick={() => setIsAddStaffOpen(true)}
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', height: 32, fontSize: 12 }}
                >
                  <Plus size={14} />
                  <span>Onboard New Staff</span>
                </button>
              </div>

              {/* Staff Directory Table */}
              <div style={{ overflowX: 'auto' }}>
                <table className="m3-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 12px' }}>Staff Name</th>
                      <th style={{ padding: '10px 12px' }}>Role / Specialty</th>
                      <th style={{ padding: '10px 12px' }}>Assigned Station</th>
                      <th style={{ padding: '10px 12px' }}>Shift Window</th>
                      <th style={{ padding: '10px 12px' }}>Volume</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Security Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((st) => (
                      <tr key={st.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{st.name}</div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{st.email}</div>
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{st.role}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{st.dept}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{st.shift}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>{st.consultationsCount}</td>
                        <td style={{ padding: '10px 12px' }}>
                          {st.active ? (
                            <span className="badge badge-ready" style={{ fontSize: 10 }}>Active</span>
                          ) : (
                            <span className="badge badge-alert" style={{ fontSize: 10 }}>Inactive</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => toggleStaffStatus(st.id)}
                            className={`m3-btn ${st.active ? 'm3-btn-tonal' : 'm3-btn-filled'}`}
                            style={{ height: 26, fontSize: 11, padding: '0 8px' }}
                            title={st.active ? "Deactivate Account" : "Activate Account"}
                          >
                            {st.active ? (
                              <span style={{ color: '#b91c1c' }}>Deactivate</span>
                            ) : (
                              <span style={{ color: '#15803d' }}>Enable Access</span>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: P-ADM-03 Immutable Clinical Audit Trail */}
          {activeTab === 'audit' && (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                    Regulatory Compliance & Clinical Decision Audit Trail
                  </h3>
                  <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: 0 }}>
                    Immutable log of CDSS safety overrides, triage adjustments, and billing alterations.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text"
                      placeholder="Search audit trail..."
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      style={{
                        padding: '6px 10px 6px 28px',
                        fontSize: 11.5,
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-default)',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                    <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
                  </div>

                  {/* Filter category */}
                  <select
                    value={auditFilter}
                    onChange={(e) => setAuditFilter(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      fontSize: 11.5,
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  >
                    <option value="ALL">All Event Types</option>
                    <option value="CDSS_OVERRIDE">CDSS Safety Overrides</option>
                    <option value="BILLING_ADJUSTMENT">Billing Adjustments</option>
                    <option value="TRIAGE_EDIT">Triage Edits</option>
                    <option value="USER_AUTH">System & Auth Events</option>
                  </select>
                </div>
              </div>

              {/* Audit Table */}
              <div style={{ overflowX: 'auto' }}>
                <table className="m3-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px 10px' }}>Timestamp</th>
                      <th style={{ padding: '8px 10px' }}>Staff Actor</th>
                      <th style={{ padding: '8px 10px' }}>Category</th>
                      <th style={{ padding: '8px 10px' }}>Patient MRN</th>
                      <th style={{ padding: '8px 10px' }}>Action & Legal Justification</th>
                      <th style={{ padding: '8px 10px' }}>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>{log.timestamp}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{log.user}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>{log.role}</span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: log.category === 'CDSS_OVERRIDE' ? '#fee2e2' : log.category === 'BILLING_ADJUSTMENT' ? '#fef3c7' : '#eff6ff',
                            color: log.category === 'CDSS_OVERRIDE' ? '#b91c1c' : log.category === 'BILLING_ADJUSTMENT' ? '#b45309' : '#0284c7'
                          }}>
                            {log.category}
                          </span>
                        </td>
                        <td style={{ padding: '10px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{log.patientMrn}</td>
                        <td style={{ padding: '10px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{log.details}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 9999,
                            background: log.severity === 'HIGH' ? '#fee2e2' : log.severity === 'MEDIUM' ? '#fef3c7' : '#ecfdf5',
                            color: log.severity === 'HIGH' ? '#dc2626' : log.severity === 'MEDIUM' ? '#d97706' : '#15803d'
                          }}>
                            {log.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Onboard Staff Modal */}
      {isAddStaffOpen && (
        <div className="m3-modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div className="card m3-dialog" style={{ width: '100%', maxWidth: 460, padding: 22, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={18} color="var(--primary)" />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Onboard Clinical Staff Member
                </h3>
              </div>
              <button 
                className="icon-btn"
                onClick={() => setIsAddStaffOpen(false)}
                style={{ width: 24, height: 24 }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ramesh Kumar"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff(p => ({ ...p, name: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Role & Department
                </label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff(p => ({ ...p, role: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                >
                  <option value="Doctor (General & Internal Medicine)">Doctor (General & Internal Medicine)</option>
                  <option value="Doctor (General & Laparoscopic Surgery)">Doctor (General & Laparoscopic Surgery)</option>
                  <option value="Doctor (Cardiology & Interventional Care)">Doctor (Cardiology & Interventional Care)</option>
                  <option value="Receptionist">Receptionist (Front Desk)</option>
                  <option value="Cashier / Billing">Cashier / Billing Desk</option>
                  <option value="Triage Nurse">Triage Nurse</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Station / Room Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Consultation Room 04 or Counter 02"
                  value={newStaff.dept}
                  onChange={(e) => setNewStaff(p => ({ ...p, dept: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Duty Shift
                </label>
                <select
                  value={newStaff.shift}
                  onChange={(e) => setNewStaff(p => ({ ...p, shift: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                >
                  <option value="Morning (08:00 - 14:00)">Morning (08:00 - 14:00)</option>
                  <option value="Evening (14:00 - 20:00)">Evening (14:00 - 20:00)</option>
                  <option value="Full Day (09:00 - 17:00)">Full Day (09:00 - 17:00)</option>
                  <option value="Night / On-Call">Night / On-Call</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  className="m3-btn m3-btn-tonal"
                  onClick={() => setIsAddStaffOpen(false)}
                  style={{ height: 32, fontSize: 12 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="m3-btn m3-btn-filled"
                  style={{ height: 32, fontSize: 12, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                >
                  Confirm Provisioning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Admin Executive Flow Guide Modal */}
      <AdminFlowGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onSwitchTab={(tabId) => setActiveTab(tabId)}
        onOpenAddStaff={() => setIsAddStaffOpen(true)}
      />
    </div>
  );
}
