import React, { useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
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
  Download
} from 'lucide-react';
import { usePatients } from '../context/PatientContext';

const INITIAL_STAFF = [
  { id: 'usr-1', name: 'Dr. Kiran Patel', role: 'Doctor (Medical Oncology)', dept: 'OPD Station 03', shift: 'Morning (08:00 - 14:00)', email: 'kiran.patel@brightcare.in', active: true, consultationsCount: 142 },
  { id: 'usr-2', name: 'Dr. Swaminathan', role: 'Doctor (Surgical Oncology)', dept: 'Surgical Wing R-07', shift: 'Full Day (09:00 - 17:00)', email: 'swami.s@brightcare.in', active: true, consultationsCount: 98 },
  { id: 'usr-3', name: 'Dr. Radhika Sen', role: 'Doctor (Radiation Oncology)', dept: 'Linear Accel Lab', shift: 'Evening (14:00 - 20:00)', email: 'radhika.sen@brightcare.in', active: true, consultationsCount: 86 },
  { id: 'usr-4', name: 'Priya Raghavan', role: 'Receptionist', dept: 'Counter 01 (Triage)', shift: 'Morning (07:30 - 15:30)', email: 'priya.r@brightcare.in', active: true, consultationsCount: 310 },
  { id: 'usr-5', name: 'Ramesh V.', role: 'Cashier / Billing', dept: 'Counter B-02 (Settlement)', shift: 'Morning (08:00 - 16:00)', email: 'ramesh.v@brightcare.in', active: true, consultationsCount: 290 },
  { id: 'usr-6', name: 'Ananya Deshmukh', role: 'Triage Nurse', dept: 'Vitals & Intake Bay', shift: 'Rotational', email: 'ananya.d@brightcare.in', active: false, consultationsCount: 45 }
];

const INITIAL_AUDIT_LOGS = [
  { id: 'log-101', timestamp: '10:42 AM', user: 'Dr. Kiran Patel', role: 'Doctor', category: 'CDSS_OVERRIDE', severity: 'HIGH', patientMrn: 'MRN-2026-0142', details: 'Overrode mild hepatic transaminase caution to initiate Letrozole 2.5mg OD with scheduled LFT repeat in 14 days.' },
  { id: 'log-102', timestamp: '10:15 AM', user: 'Ramesh V.', role: 'Cashier', category: 'BILLING_ADJUSTMENT', severity: 'MEDIUM', patientMrn: 'MRN-2026-0143', details: 'Applied 100% Cashless Government Scheme package under Ayushman Bharat PM-JAY (AB-PMJAY) golden card verification.' },
  { id: 'log-103', timestamp: '09:50 AM', user: 'Priya Raghavan', role: 'Receptionist', category: 'TRIAGE_EDIT', severity: 'LOW', patientMrn: 'MRN-2026-0144', details: 'Updated emergency contact number and assigned walk-in to Dr. Swaminathan queue.' },
  { id: 'log-104', timestamp: '09:12 AM', user: 'Dr. Swaminathan', role: 'Doctor', category: 'CDSS_OVERRIDE', severity: 'HIGH', patientMrn: 'MRN-2026-0145', details: 'Approved surgical restaging biopsy despite border baseline INR 1.3 with fresh frozen plasma backup ordered.' },
  { id: 'log-105', timestamp: '08:30 AM', user: 'Admin System', role: 'System', category: 'USER_AUTH', severity: 'INFO', patientMrn: '—', details: 'Staff duty roster shift rollover completed automatically for OPD Morning shift.' }
];

export default function AdminPage({ currentRole = 'admin', onSwitchRole, activeSubTab = 'dashboard' }) {
  const { patients } = usePatients();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState(activeSubTab || 'dashboard'); // 'dashboard' | 'staff' | 'audit'
  
  // Staff state
  const [staffList, setStaffList] = useState(INITIAL_STAFF);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'Doctor (Medical Oncology)',
    dept: 'OPD Station 01',
    shift: 'Morning (08:00 - 14:00)',
    email: '',
    phone: ''
  });

  // Audit filter state
  const [auditFilter, setAuditFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');

  const toggleStaffStatus = (id) => {
    setStaffList(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const handleAddStaffSubmit = (e) => {
    e.preventDefault();
    if (!newStaff.name.trim()) return;
    const staffItem = {
      id: `usr-${Date.now()}`,
      name: newStaff.name,
      role: newStaff.role,
      dept: newStaff.dept,
      shift: newStaff.shift,
      email: newStaff.email || `${newStaff.name.toLowerCase().replace(/\s+/g, '.')}@brightcare.in`,
      active: true,
      consultationsCount: 0
    };
    setStaffList(prev => [staffItem, ...prev]);
    setIsAddStaffOpen(false);
    setNewStaff({
      name: '',
      role: 'Doctor (Medical Oncology)',
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
    <div className="m3-app-shell">
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
        />

        <main className="page-container m3-page-animate" style={{ maxWidth: '100%', width: '100%', margin: 0, padding: '16px 20px', boxSizing: 'border-box' }}>
          {/* Header Banner */}
          <div className="m3-doctor-patient-banner" style={{ marginBottom: 16 }}>
            <div className="stat-card-accent-blob blob-rose" style={{ top: -20, right: -20, width: 96, height: 96, opacity: 0.65 }} />
            <div className="m3-patient-banner-info" style={{ position: 'relative', zIndex: 1 }}>
              <div className="stat-squircle-badge badge-bg-rose" style={{ width: 44, height: 44, borderRadius: 13, fontSize: 16 }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-primary)' }}>
                    Executive Hospital Governance & Clinical Audit
                  </h2>
                  <span className="badge badge-ready">Real-Time Operational Oversight</span>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Hospital clinical performance, physician roster management, and regulatory compliance audit trail.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button 
                className={`m3-btn ${activeTab === 'dashboard' ? 'm3-btn-filled' : 'm3-btn-tonal'}`}
                onClick={() => setActiveTab('dashboard')}
                style={{ height: 32, fontSize: 11.5 }}
              >
                <TrendingUp size={14} />
                <span>Executive Analytics</span>
              </button>
              <button 
                className={`m3-btn ${activeTab === 'staff' ? 'm3-btn-filled' : 'm3-btn-tonal'}`}
                onClick={() => setActiveTab('staff')}
                style={{ height: 32, fontSize: 11.5 }}
              >
                <Users size={14} />
                <span>Staff Roster ({staffList.length})</span>
              </button>
              <button 
                className={`m3-btn ${activeTab === 'audit' ? 'm3-btn-filled' : 'm3-btn-tonal'}`}
                onClick={() => setActiveTab('audit')}
                style={{ height: 32, fontSize: 11.5 }}
              >
                <FileText size={14} />
                <span>Audit Logs</span>
              </button>
            </div>
          </div>

          {/* TAB 1: P-ADM-01 Executive Governance & Clinic Analytics */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Executive KPIs Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card-accent-blob blob-blue" />
                  <div className="stat-squircle-badge badge-bg-blue">
                    <Users size={16} strokeWidth={2.4} />
                  </div>
                  <div className="stat-card-value">184</div>
                  <div className="stat-card-label">Weekly Footfall</div>
                  <div style={{ fontSize: 10.5, color: '#15803d', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ArrowUpRight size={12} /> +14.2% vs last week
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-accent-blob blob-green" />
                  <div className="stat-squircle-badge badge-bg-green">
                    <Receipt size={16} strokeWidth={2.4} />
                  </div>
                  <div className="stat-card-value">₹4.82L</div>
                  <div className="stat-card-label">Gross Revenue Today</div>
                  <div style={{ fontSize: 10.5, color: '#15803d', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ArrowUpRight size={12} /> 94% Settled
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-accent-blob blob-yellow" />
                  <div className="stat-squircle-badge badge-bg-yellow">
                    <Activity size={16} strokeWidth={2.4} />
                  </div>
                  <div className="stat-card-value">92.4%</div>
                  <div className="stat-card-label">Clinical Resolution Rate</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Avg triage time: 6.8 min
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-accent-blob blob-rose" />
                  <div className="stat-squircle-badge badge-bg-rose">
                    <Stethoscope size={16} strokeWidth={2.4} />
                  </div>
                  <div className="stat-card-value">18 min</div>
                  <div className="stat-card-label">Avg Encounter Throughput</div>
                  <div style={{ fontSize: 10.5, color: '#15803d', fontWeight: 700, marginTop: 4 }}>
                    On-target benchmark
                  </div>
                </div>
              </div>

              {/* Analytics Visualization Panels */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
                {/* Panel 1: Weekly Footfall Velocity */}
                <div className="card" style={{ padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                        Weekly Walk-in Patient Footfall
                      </h3>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>
                        Distribution across OPD clinic shifts
                      </p>
                    </div>
                    <span className="badge badge-ready">7-Day Trend</span>
                  </div>

                  {/* Sleek CSS Bar Graph */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 130, padding: '0 8px', gap: 10 }}>
                    {[
                      { day: 'Mon', count: 38, pct: 76 },
                      { day: 'Tue', count: 42, pct: 84 },
                      { day: 'Wed', count: 35, pct: 70 },
                      { day: 'Thu', count: 48, pct: 96 },
                      { day: 'Fri', count: 50, pct: 100 },
                      { day: 'Sat', count: 32, pct: 64 },
                      { day: 'Sun', count: 18, pct: 36 }
                    ].map((item, idx) => (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>{item.count}</span>
                        <div style={{ width: '100%', maxWidth: 28, height: `${item.pct}%`, background: idx === 4 ? 'linear-gradient(180deg, #f59e0b, #d97706)' : 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: '6px 6px 2px 2px', transition: 'all 0.2s ease' }} />
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)' }}>{item.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Panel 2: Doctor Workload Distribution */}
                <div className="card" style={{ padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                        Physician Workload Distribution
                      </h3>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>
                        Active visits queue balance per consultant
                      </p>
                    </div>
                    <span className="card-count-badge">4 Active</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { name: 'Dr. Kiran Patel (Medical Onc.)', activeVisits: 14, capacity: 20, pct: 70, color: '#0284c7' },
                      { name: 'Dr. Swaminathan (Surgical Onc.)', activeVisits: 11, capacity: 15, pct: 73, color: '#10b981' },
                      { name: 'Dr. Radhika Sen (Radiation Onc.)', activeVisits: 8, capacity: 15, pct: 53, color: '#f59e0b' },
                      { name: 'Dr. Anand Deshmukh (Hematology)', activeVisits: 6, capacity: 12, pct: 50, color: '#6366f1' }
                    ].map((doc, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{doc.name}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            <strong>{doc.activeVisits}</strong> / {doc.capacity} Patients ({doc.pct}%)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: 7, background: 'var(--bg-subtle)', borderRadius: 9999, overflow: 'hidden' }}>
                          <div style={{ width: `${doc.pct}%`, height: '100%', background: doc.color, borderRadius: 9999 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Panel 3: Disease Prevalence & Clinical Case Mix */}
                <div className="card" style={{ padding: 18, gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                        Disease Prevalence & Clinical Case Mix (Current Month)
                      </h3>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>
                        ICD-10 clinical oncology diagnostic distribution
                      </p>
                    </div>
                    <span className="badge badge-active">ICD-10 Categorized</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    {[
                      { label: 'Breast Neoplasm (C50)', cases: 54, share: '32%', badge: 'High Footfall', color: '#ec4899' },
                      { label: 'Thoracic & Lung (C34)', cases: 38, share: '22%', badge: 'Smoker Clustering', color: '#f59e0b' },
                      { label: 'Colorectal Adenoma (C18)', cases: 31, share: '18%', badge: 'Surgical Workup', color: '#0284c7' },
                      { label: 'Gynecological / Endometrial', cases: 26, share: '15%', badge: 'Surveillance', color: '#10b981' },
                      { label: 'Hematologic / Lymphoma', cases: 22, share: '13%', badge: 'Daycare Chemotherapy', color: '#8b5cf6' }
                    ].map((c, idx) => (
                      <div key={idx} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: c.color, textTransform: 'uppercase' }}>
                          {c.share} Total Mix
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                          {c.label}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{c.cases} Patient Encounters</span>
                          <span style={{ fontSize: 9.5, fontWeight: 600, padding: '1px 5px', borderRadius: 4, background: 'var(--bg-surface)' }}>{c.badge}</span>
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
                  <option value="Doctor (Medical Oncology)">Doctor (Medical Oncology)</option>
                  <option value="Doctor (Surgical Oncology)">Doctor (Surgical Oncology)</option>
                  <option value="Doctor (Radiation Oncology)">Doctor (Radiation Oncology)</option>
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
    </div>
  );
}
