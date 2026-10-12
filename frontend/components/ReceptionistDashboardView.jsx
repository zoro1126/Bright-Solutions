import React from 'react';
import { 
  Users, 
  UserPlus, 
  Clock, 
  Sparkles, 
  ArrowUpRight, 
  Printer, 
  Activity, 
  Calendar,
  CheckCircle2,
  Stethoscope,
  TrendingUp,
  FileText
} from 'lucide-react';
import { usePatients } from '../context/PatientContext';

export default function ReceptionistDashboardView({ onOpenRegister, onSelectPatientForQuestionnaire, onPrintSlip }) {
  const { patients, stats } = usePatients();

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const nextToken = 140 + patients.length + 1;
  const recentPatients = patients.slice(0, 5);

  const hourlyData = [
    { hour: '08:00', count: 6, pct: 50 },
    { hour: '09:00', count: 12, pct: 100 },
    { hour: '10:00', count: 9, pct: 75 },
    { hour: '11:00', count: 7, pct: 58 },
    { hour: '12:00', count: 4, pct: 33 },
    { hour: '13:00', count: 3, pct: 25 },
    { hour: '14:00', count: 5, pct: 42 }
  ];

  const doctorLoads = [
    { name: 'Dr. Kiran Patel (Medical Onc.)', activeCount: patients.filter(p => p.doctorAssigned?.includes('Kiran')).length || 3, color: '#0284c7' },
    { name: 'Dr. Swaminathan (Surgical Onc.)', activeCount: patients.filter(p => p.doctorAssigned?.includes('Swami')).length || 2, color: '#10b981' },
    { name: 'Dr. Radhika Sen (Radiation Onc.)', activeCount: 1, color: '#f59e0b' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Banner: Welcome + Register Shortcut */}
      <div className="card" style={{
        padding: '18px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
        background: 'var(--bg-surface)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="stat-card-accent-blob blob-yellow" style={{ top: -20, right: -20, width: 96, height: 96, opacity: 0.65 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Front Desk Command Center
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} /> {todayStr}
            </span>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 2px' }}>
            Good day, Reception Desk!
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
            Triage walk-in footfall is active. Next sequential token queued: <strong>#{nextToken}</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenRegister}
          className="m3-btn m3-btn-filled"
          style={{
            height: 38,
            fontSize: 12.5,
            fontWeight: 700,
            padding: '0 18px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
            zIndex: 1
          }}
        >
          <UserPlus size={16} />
          <span>+ Register New Patient</span>
        </button>
      </div>

      {/* 4 KPIs Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-accent-blob blob-blue" />
          <div className="stat-squircle-badge badge-bg-blue">
            <Users size={16} strokeWidth={2.4} />
          </div>
          <div className="stat-card-value">{patients.length}</div>
          <div className="stat-card-label">Today's Intake Count</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-accent-blob blob-yellow" />
          <div className="stat-squircle-badge badge-bg-yellow">
            <Clock size={16} strokeWidth={2.4} />
          </div>
          <div className="stat-card-value">#{nextToken}</div>
          <div className="stat-card-label">Next Token Number</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-accent-blob blob-green" />
          <div className="stat-squircle-badge badge-bg-green">
            <Activity size={16} strokeWidth={2.4} />
          </div>
          <div className="stat-card-value">5.2 min</div>
          <div className="stat-card-label">Avg Triage Speed</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-accent-blob blob-rose" />
          <div className="stat-squircle-badge badge-bg-rose">
            <Sparkles size={16} strokeWidth={2.4} />
          </div>
          <div className="stat-card-value">{stats.insightsReady}</div>
          <div className="stat-card-label">AI Insights Ready</div>
        </div>
      </div>

      {/* Hourly Walk-ins + Doctor Queue Balance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        {/* Hourly Footfall Chart */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Hourly Walk-in Footfall
              </h3>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Helps staff anticipate rush hours & relief breaks
              </p>
            </div>
            <span className="badge badge-ready">Peak: 09:00 AM</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, padding: '0 8px', gap: 8 }}>
            {hourlyData.map((h, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-secondary)' }}>{h.count}</span>
                <div style={{ width: '100%', maxWidth: 24, height: `${h.pct}%`, background: idx === 1 ? 'linear-gradient(180deg, #f59e0b, #d97706)' : 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: '4px 4px 2px 2px' }} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{h.hour}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Queue Balance */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Doctor Queue Balance
              </h3>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Distribute incoming walk-ins to avoid station bottlenecks
              </p>
            </div>
            <span className="badge badge-active">3 Doctors On Duty</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {doctorLoads.map((d, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.name}</span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{d.activeCount} waiting</span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'var(--bg-subtle)', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, d.activeCount * 25)}%`, height: '100%', background: d.color, borderRadius: 9999 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Registrations Feed */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Recent Patient Registrations (Live Feed)
            </h3>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Quickly reprint token slips or resume clinical intake anamnesis
            </p>
          </div>
          <span className="card-count-badge">{recentPatients.length} Recent</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="m3-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px 10px' }}>MRN / Token</th>
                <th style={{ padding: '8px 10px' }}>Patient Legal Name</th>
                <th style={{ padding: '8px 10px' }}>Demographics</th>
                <th style={{ padding: '8px 10px' }}>Assigned Physician</th>
                <th style={{ padding: '8px 10px' }}>Triage Vitals</th>
                <th style={{ padding: '8px 10px' }}>Status</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentPatients.map((p, idx) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '8px 10px' }}>
                    <span className="mrn-tag">#{141 + idx}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>{p.mrn}</span>
                  </td>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {p.fullName}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                    {p.age}y {p.gender} • {p.phone}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                    {p.doctorAssigned?.split('(')[0]}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>BP {p.vitals?.bp || '120/80'}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>• SpO2 {p.vitals?.spo2 || '99'}%</span>
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span className="badge badge-active" style={{ fontSize: 10 }}>{p.status}</span>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => onPrintSlip && onPrintSlip(p)}
                        className="m3-btn m3-btn-tonal"
                        style={{ height: 26, fontSize: 11, padding: '0 8px' }}
                        title="Reprint Token Slip"
                      >
                        <Printer size={12} />
                        <span>Slip</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectPatientForQuestionnaire && onSelectPatientForQuestionnaire(p)}
                        className="m3-btn m3-btn-filled"
                        style={{ height: 26, fontSize: 11, padding: '0 8px', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                        title="Open Intake Questionnaire"
                      >
                        <FileText size={12} />
                        <span>Intake</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
