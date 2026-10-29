/**
 * ChamberLayout.jsx — Doctor OPD Consultation Chamber (D15 §2.2)
 * Features: Pinned patient vitals bar, compact queue sidebar, autosave indicator
 */
import React, { useState } from 'react';
import {
  Activity, AlertTriangle, ChevronLeft, ChevronRight,
  Droplets, Heart, Thermometer, Wind, LogOut, Clock
} from 'lucide-react';

function PanicBadge({ label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 9999,
      background: '#FEE2E2', color: '#DC2626',
      fontSize: 9.5, fontWeight: 800,
      animation: 'chamberPulse 1.4s ease-in-out infinite',
    }}>
      <AlertTriangle size={9} /> {label}
    </span>
  );
}

function VitalsBar({ patient }) {
  if (!patient) return null;

  const v = patient.vitals || {};
  const spo2  = parseFloat(v.spo2)    || 99;
  const sys   = parseFloat((v.bp || '120/80').split('/')[0]) || 120;
  const temp  = parseFloat(v.temp)    || 98.4;
  const pulse = parseFloat(v.pulse)   || 72;

  const isPanic = spo2 < 92 || sys > 180 || sys < 90 || temp > 104 || pulse > 130 || pulse < 45;

  return (
    <div style={{
      background: isPanic
        ? 'linear-gradient(90deg, #1A0A0A, #2D0A0A)'
        : 'linear-gradient(90deg, #0F172A, #1E293B)',
      borderBottom: `2px solid ${isPanic ? '#DC2626' : '#06B6D4'}`,
      padding: '8px 20px',
      display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'nowrap',
      minHeight: 44, overflow: 'hidden',
    }}>
      {/* Patient identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 20, flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, #06B6D4, #0D9488)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
        }}>
          {(patient.fullName || 'P')[0]}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#F1F5F9', lineHeight: 1 }}>
            {patient.fullName || 'Unknown Patient'}
          </div>
          <div style={{ fontSize: 9.5, color: '#94A3B8', fontWeight: 600 }}>
            {patient.uhid || patient.mrn} • {patient.age}y {patient.gender?.[0]}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 28, background: '#334155', marginRight: 20, flexShrink: 0 }} />

      {/* Blood group */}
      {patient.bloodGroup && (
        <div style={{ marginRight: 16, flexShrink: 0 }}>
          <span style={{
            padding: '2px 8px', borderRadius: 6,
            background: '#7F1D1D', color: '#FCA5A5',
            fontSize: 10, fontWeight: 800
          }}>
            <Droplets size={9} style={{ display: 'inline', marginRight: 3 }} />
            {patient.bloodGroup}
          </span>
        </div>
      )}

      {/* Vitals */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 8.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>BP</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: sys > 180 || sys < 90 ? '#F87171' : '#34D399', fontFamily: 'monospace' }}>
            {v.bp || '—'}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 8.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
            <Heart size={8} style={{ display: 'inline' }} /> Pulse
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: pulse > 130 || pulse < 45 ? '#F87171' : '#34D399', fontFamily: 'monospace' }}>
            {v.pulse || '—'}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 8.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
            <Wind size={8} style={{ display: 'inline' }} /> SpO₂
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: spo2 < 92 ? '#F87171' : '#34D399', fontFamily: 'monospace' }}>
            {v.spo2 || '—'}%
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 8.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
            <Thermometer size={8} style={{ display: 'inline' }} /> Temp
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: temp > 104 ? '#F87171' : '#34D399', fontFamily: 'monospace' }}>
            {v.temp || '—'}°F
          </div>
        </div>
      </div>

      {/* Panic flags */}
      {isPanic && (
        <div style={{ marginLeft: 16, display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
          {spo2 < 92  && <PanicBadge label="HYPOXIA" />}
          {sys > 180  && <PanicBadge label="HTN CRISIS" />}
          {sys < 90   && <PanicBadge label="HYPOTENSION" />}
          {temp > 104 && <PanicBadge label="HYPERPYREXIA" />}
          {pulse > 130 && <PanicBadge label="TACHYCARDIA" />}
          {pulse < 45  && <PanicBadge label="BRADYCARDIA" />}
        </div>
      )}

      {/* Allergies */}
      {patient.allergies && patient.allergies.length > 0 && (
        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <span style={{
            padding: '2px 8px', borderRadius: 9999,
            background: '#FEF3C7', color: '#92400E',
            fontSize: 9.5, fontWeight: 800, border: '1px solid #FDE68A',
          }}>
            ⚠ Allergy: {patient.allergies.join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}

export default function ChamberLayout({
  children,
  activePatient,
  queuePreview = [],
  autoSaveStatus = null,
  onLogout,
  user,
}) {
  const [queueCollapsed, setQueueCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#F8FAFC' }}>
      {/* Top Navbar */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 44, flexShrink: 0,
        background: '#fff', borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: 'linear-gradient(135deg, #06B6D4, #0D9488)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={14} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>Bright</span>
          <span style={{ fontSize: 10, color: '#64748B', fontWeight: 700 }}>•</span>
          <span style={{ fontSize: 10.5, color: '#0077B6', fontWeight: 700 }}>OPD Consultation Chamber</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {autoSaveStatus && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: '#64748B' }}>
              <Clock size={11} />
              <span>{autoSaveStatus}</span>
            </div>
          )}
          {user && (
            <span style={{
              padding: '2px 10px', borderRadius: 9999,
              background: '#CAF0F8', color: '#0077B6',
              fontSize: 10.5, fontWeight: 700, border: '1px solid #90E0EF',
            }}>
              {user.name || user.full_name || 'Doctor'}
            </span>
          )}
          {onLogout && (
            <button onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', padding: 4 }}>
              <LogOut size={14} />
            </button>
          )}
        </div>
      </header>

      {/* Pinned Patient Vitals Bar */}
      {activePatient && <VitalsBar patient={activePatient} />}

      {/* Body: Queue sidebar + main content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Compact queue sidebar */}
        <aside style={{
          width: queueCollapsed ? 36 : 200,
          flexShrink: 0,
          background: '#fff',
          borderRight: '1px solid #E2E8F0',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.2s ease',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: queueCollapsed ? '10px 4px' : '10px 12px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: queueCollapsed ? 'center' : 'space-between',
          }}>
            {!queueCollapsed && (
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Queue</span>
            )}
            <button
              onClick={() => setQueueCollapsed(!queueCollapsed)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 2, display: 'flex', alignItems: 'center' }}
            >
              {queueCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
          {!queueCollapsed && (
            <div style={{ overflow: 'auto', flex: 1, padding: '6px 8px' }}>
              {queuePreview.length === 0 ? (
                <div style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center', padding: '12px 0' }}>No queue</div>
              ) : (
                queuePreview.map((p, i) => (
                  <div key={p.id || i} style={{
                    padding: '6px 8px', borderRadius: 6, marginBottom: 4,
                    background: p.status === 'IN_CONSULTATION' ? '#EFF6FF' : '#F8FAFC',
                    border: `1px solid ${p.status === 'IN_CONSULTATION' ? '#BFDBFE' : '#F1F5F9'}`,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#0F172A' }}>
                      #{p.tokenNumber} {p.fullName?.split(' ')[0]}
                    </div>
                    <div style={{ fontSize: 9, color: '#64748B', fontWeight: 600, marginTop: 1 }}>
                      {p.status === 'IN_CONSULTATION' ? '▶ Active' : `${p.status === 'WAITING' ? '⏳' : '✓'} ${p.status}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
      </div>

      <style>{`
        @keyframes chamberPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

