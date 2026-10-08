import React from 'react';
import { 
  Users, Hash, Stethoscope, HeartPulse, UserPlus, Eye, 
  Activity, ArrowRight, ShieldCheck, TrendingUp, Sun, Sparkles 
} from 'lucide-react';

export default function DashboardView({
  currentUser,
  stats,
  onOpenRegisterModal,
  onSwitchToQueueTab,
  onViewPatient
}) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const bpList = stats?.bp_breakdown || [];
  const totalBpRecords = bpList.reduce((acc, item) => acc + item.count, 0) || 1;

  const bmiList = stats?.bmi_breakdown || [];
  const totalBmiRecords = bmiList.reduce((acc, item) => acc + item.count, 0) || 1;

  const getBpColor = (stage) => {
    const s = (stage || '').toLowerCase();
    if (s.includes('crisis') || s.includes('stage 2')) return 'var(--red-600)';
    if (s.includes('stage 1') || s.includes('elevated')) return 'var(--yellow-600)';
    return 'var(--emerald-600)';
  };

  const getBmiColor = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('obese')) return 'var(--red-600)';
    if (c.includes('overweight')) return 'var(--yellow-600)';
    if (c.includes('underweight')) return 'var(--blue-500)';
    return 'var(--emerald-600)';
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy-950) 0%, var(--navy-900) 65%, #0B294E 100%)',
        border: '1px solid var(--navy-700)',
        borderBottom: '4px solid var(--yellow-400)',
        borderRadius: '16px',
        padding: '2.25rem 2.5rem',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
            <span style={{
              background: 'var(--yellow-400)',
              color: '#051A30',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.76rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              boxShadow: '0 2px 8px var(--yellow-glow)'
            }}>
              Bright Solutions • {currentUser?.role || 'STAFF'} PORTAL
            </span>
            <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>{currentDate}</span>
          </div>

          <h1 style={{ color: '#FFFFFF', fontSize: '2.1rem', marginBottom: '0.4rem' }}>
            Welcome back, {currentUser?.full_name || 'Staff Member'}
          </h1>
          <p style={{ color: '#E2E8F0', fontSize: '0.98rem', maxWidth: '640px' }}>
            Bright Solutions OPD Clinical Operations & Real-Time Biometric Triage Hub. Instant token coordination and queue telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary" 
            onClick={onSwitchToQueueTab}
            style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'var(--navy-900)' }}
          >
            <span>View OPD Queue Roster</span>
            <ArrowRight size={16} />
          </button>

          <button 
            className="btn btn-primary" 
            onClick={onOpenRegisterModal}
          >
            <UserPlus size={18} />
            <span>+ Register New Patient</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card card-yellow">
          <div className="stat-info">
            <span className="stat-label">Patients Registered</span>
            <span className="stat-value">{stats?.total_patients ?? 0}</span>
            <span className="stat-hint">
              <TrendingUp size={14} color="#B89C14" />
              <span>Today's Outpatient Encounters</span>
            </span>
          </div>
          <div className="stat-icon">
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card card-yellow">
          <div className="stat-info">
            <span className="stat-label">Next Queue Token</span>
            <span className="stat-value" style={{ color: '#030F1E' }}>
              {stats?.next_token || 'Q-101'}
            </span>
            <span className="stat-hint">
              <span>Auto-allocated sequential token</span>
            </span>
          </div>
          <div className="stat-icon" style={{ background: 'var(--yellow-400)', color: '#051A30' }}>
            <Hash size={24} />
          </div>
        </div>

        <div className="stat-card card-yellow">
          <div className="stat-info">
            <span className="stat-label">Attending Doctors</span>
            <span className="stat-value">{stats?.active_doctors ?? 3}</span>
            <span className="stat-hint">
              <span>Physicians on consultation duty</span>
            </span>
          </div>
          <div className="stat-icon">
            <Stethoscope size={24} />
          </div>
        </div>

        <div className="stat-card card-navy">
          <div className="stat-info">
            <span className="stat-label">Triage Protocols</span>
            <span className="stat-value">AHA 2017</span>
            <span className="stat-hint">
              <ShieldCheck size={14} color="var(--emerald-600)" />
              <span>100% Real-Time Biometric Capture</span>
            </span>
          </div>
          <div className="stat-icon">
            <HeartPulse size={24} />
          </div>
        </div>
      </div>

      {/* Analytics Section: Two Cards side-by-side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Card A: Blood Pressure Stages Breakdown */}
        <div className="table-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>AHA Blood Pressure Stages Breakdown</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Classification based on AHA/ACC 2017 clinical triage guidelines
              </p>
            </div>
            <HeartPulse size={22} color="var(--red-600)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {bpList.length === 0 ? (
              <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
                No blood pressure vitals logged yet today.
              </div>
            ) : (
              bpList.map((item, idx) => {
                const pct = Math.round((item.count / totalBpRecords) * 100);
                const color = getBpColor(item.stage);
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{item.stage}</span>
                      <span style={{ fontWeight: 700, color: color }}>
                        {item.count} patient{item.count > 1 ? 's' : ''} ({pct}%)
                      </span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div style={{
                      height: '8px',
                      background: 'var(--navy-50)',
                      borderRadius: '9999px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: color,
                        borderRadius: '9999px',
                        transition: 'width 300ms ease'
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Card B: Body Mass Index (BMI) Distribution */}
        <div className="table-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Body Mass Index (BMI) Distribution</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Computed automatically from triage height and weight
              </p>
            </div>
            <Activity size={22} color="var(--yellow-600)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {bmiList.length === 0 ? (
              <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
                No height/weight vitals captured yet.
              </div>
            ) : (
              bmiList.map((item, idx) => {
                const pct = Math.round((item.count / totalBmiRecords) * 100);
                const color = getBmiColor(item.category);
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{item.category}</span>
                      <span style={{ fontWeight: 700, color: color }}>
                        {item.count} patient{item.count > 1 ? 's' : ''} ({pct}%)
                      </span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div style={{
                      height: '8px',
                      background: 'var(--navy-50)',
                      borderRadius: '9999px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: color,
                        borderRadius: '9999px',
                        transition: 'width 300ms ease'
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Triage Activity Feed */}
      <div className="table-card">
        <div className="table-toolbar" style={{ justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Recent Patient Triage Activity</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Live stream of newly registered outpatient encounters and triage vitals
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onSwitchToQueueTab}>
            View All ({stats?.total_patients ?? 0})
          </button>
        </div>

        <div className="data-table-container">
          {(!stats?.recent_patients || stats.recent_patients.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No recent triage encounters available.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Patient Name & UHID</th>
                  <th>Assigned Physician</th>
                  <th>Blood Pressure</th>
                  <th>Pulse</th>
                  <th>SpO2</th>
                  <th>BMI</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_patients.map((p) => (
                  <tr key={p.patient_id || p.uhid}>
                    <td>
                      <span className="token-badge">{p.queue_token}</span>
                    </td>
                    <td>
                      <div className="patient-cell">
                        <span className="patient-name">{p.full_name}</span>
                        <div className="patient-sub">
                          <span className="uhid-code">{p.uhid}</span>
                          <span>•</span>
                          <span>{p.age ? `${p.age}y` : '--'}, {p.gender}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '0.88rem' }}>
                        {p.doctor_name || 'Dr. Vikram Kulkarni'}
                      </span>
                    </td>
                    <td>
                      <span className="vital-chip" style={{ fontWeight: 700 }}>
                        {p.systolic_bp ? `${p.systolic_bp}/${p.diastolic_bp} mmHg` : '--'}
                      </span>
                    </td>
                    <td>
                      <span className="vital-chip">{p.pulse_rate ? `${p.pulse_rate} bpm` : '--'}</span>
                    </td>
                    <td>
                      <span className="vital-chip" style={{ color: p.spo2_pct < 95 ? 'var(--red-600)' : 'var(--emerald-600)' }}>
                        {p.spo2_pct ? `${p.spo2_pct}%` : '--'}
                      </span>
                    </td>
                    <td>
                      <span className="bmi-badge bmi-normal">
                        {p.bmi ? `BMI ${p.bmi}` : '--'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => onViewPatient(p)}
                      >
                        <Eye size={13} />
                        <span>View Slip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
