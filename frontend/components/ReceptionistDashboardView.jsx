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
    { hour: '08:00', count: 6, waitTime: 3.2, pct: 45 },
    { hour: '09:00', count: 14, waitTime: 7.8, pct: 100 },
    { hour: '10:00', count: 11, waitTime: 6.4, pct: 78 },
    { hour: '11:00', count: 8, waitTime: 5.1, pct: 57 },
    { hour: '12:00', count: 5, waitTime: 4.0, pct: 36 },
    { hour: '13:00', count: 3, waitTime: 2.5, pct: 21 },
    { hour: '14:00', count: 7, waitTime: 4.8, pct: 50 },
    { hour: '15:00', count: 9, waitTime: 5.6, pct: 64 },
    { hour: '16:00', count: 4, waitTime: 3.0, pct: 28 }
  ];

  const triageBreakdown = [
    { label: 'Priority 1 (Urgent / Staging)', count: 3, pct: 18, color: '#ef4444', desc: '< 5 min triage target' },
    { label: 'Priority 2 (Standard Workup)', count: 9, pct: 56, color: '#f59e0b', desc: '< 10 min triage target' },
    { label: 'Priority 3 (Routine Follow-up)', count: 4, pct: 26, color: '#10b981', desc: '< 15 min triage target' }
  ];

  const doctorLoads = [
    { name: 'Dr. Kiran Patel (Medical Onc.)', station: 'Station 03', activeCount: patients.filter(p => p.doctorAssigned?.includes('Kiran')).length || 3, avgWait: '5.8 min', capacity: 6, color: '#0284c7' },
    { name: 'Dr. Swaminathan (Surgical Onc.)', station: 'Station 01', activeCount: patients.filter(p => p.doctorAssigned?.includes('Swami')).length || 2, avgWait: '7.2 min', capacity: 5, color: '#10b981' },
    { name: 'Dr. Radhika Sen (Radiation Onc.)', station: 'Station 04', activeCount: 1, avgWait: '3.4 min', capacity: 4, color: '#f59e0b' },
    { name: 'Dr. Anand Deshmukh (Hematology)', station: 'Station 02', activeCount: 2, avgWait: '4.1 min', capacity: 4, color: '#8b5cf6' }
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

      {/* Interactive Analytics Graphs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
        {/* Graph 1: Hourly Walk-In Footfall & Wait-Time Curve */}
        <div className="card" style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={15} color="#d97706" />
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Hourly Patient Flow & Wait-Time Curve
                </h3>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                Walk-in volume vs triage queue latency across morning & afternoon OPD
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-ready" style={{ fontSize: 10 }}>Peak: 09:00 AM (14 pts)</span>
            </div>
          </div>

          {/* Graph Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, fontSize: 11 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'linear-gradient(180deg, #f59e0b, #d97706)' }} />
              <span>Patient Registrations</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)' }}>
              <span style={{ width: 14, height: 2.5, background: '#0284c7', borderRadius: 2 }} />
              <span>Avg Wait Time (min)</span>
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 10.5, color: '#15803d', fontWeight: 700 }}>
              Avg Wait: 5.2 min
            </span>
          </div>

          {/* Dual-Metric Chart Container */}
          <div style={{ position: 'relative', height: 150, paddingTop: 10 }}>
            {/* SVG Wait Time Trend Curve */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 115, zIndex: 2, pointerEvents: 'none' }} viewBox="0 0 360 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="waitLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
                <linearGradient id="waitAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path 
                d="M 20 62 Q 58 14 96 22 T 172 44 T 248 72 T 324 48 L 340 65 L 340 100 L 20 100 Z" 
                fill="url(#waitAreaGrad)" 
              />
              <path 
                d="M 20 62 Q 58 14 96 22 T 172 44 T 248 72 T 324 48 L 340 65" 
                fill="none" 
                stroke="url(#waitLineGrad)" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
              />
              {/* Highlight Peak Circle */}
              <circle cx="58" cy="18" r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
            </svg>

            {/* Bar Columns */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 110, padding: '0 6px', gap: 6, position: 'relative', zIndex: 1 }}>
              {hourlyData.map((h, idx) => (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-secondary)' }}>{h.count}</span>
                  <div 
                    style={{ 
                      width: '100%', 
                      maxWidth: 22, 
                      height: `${h.pct * 0.75}%`, 
                      background: idx === 1 ? 'linear-gradient(180deg, #f59e0b, #d97706)' : 'rgba(245, 158, 11, 0.22)', 
                      border: idx === 1 ? '1px solid #d97706' : '1px solid rgba(245, 158, 11, 0.45)', 
                      borderRadius: '5px 5px 2px 2px',
                      transition: 'all 0.2s ease'
                    }} 
                    title={`${h.hour}: ${h.count} registrations, avg wait ${h.waitTime} min`}
                  />
                  <span style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 4 }}>{h.hour}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Graph 2: Triage Classification & SLA Compliance */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={15} color="#10b981" />
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Triage Urgency & Queue Velocity
                </h3>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                Clinical prioritization mix & intake speed compliance
              </p>
            </div>
            <span className="badge badge-ready">94.8% SLA Met</span>
          </div>

          {/* Visual Multi-Segment Bar */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', height: 10, borderRadius: 9999, overflow: 'hidden', gap: 2 }}>
              {triageBreakdown.map((item, idx) => (
                <div 
                  key={idx} 
                  style={{ width: `${item.pct}%`, background: item.color, height: '100%', borderRadius: 9999 }}
                  title={`${item.label}: ${item.count} patients (${item.pct}%)`}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {triageBreakdown.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-subtle)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>{item.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>{item.count} pts</span>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>{item.pct}% mix</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Graph 3: Doctor Consultation Station Queue & Load Balance */}
        <div className="card" style={{ padding: 18, gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Stethoscope size={15} color="#0284c7" />
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Real-Time Physician Station Queue & Throughput Velocity
                </h3>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                Balanced patient routing prevents room crowding and ensures smooth physician handover
              </p>
            </div>
            <span className="badge badge-active">4 Stations Active</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {doctorLoads.map((d, idx) => {
              const utilPct = Math.min(100, Math.round((d.activeCount / d.capacity) * 100));
              return (
                <div key={idx} style={{ padding: '12px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                      {d.station}
                    </span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: utilPct > 75 ? '#dc2626' : '#15803d' }}>
                      {utilPct > 75 ? 'Heavy Load' : 'Flow Normal'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d.name.split('(')[0]}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {d.name.includes('(') ? `(${d.name.split('(')[1]}` : ''}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Waiting: <strong>{d.activeCount}</strong>/{d.capacity}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Avg Wait: <strong style={{ color: d.color }}>{d.avgWait}</strong></span>
                  </div>

                  <div style={{ width: '100%', height: 6, background: 'var(--bg-subtle)', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{ width: `${utilPct}%`, height: '100%', background: d.color, borderRadius: 9999, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              );
            })}
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
