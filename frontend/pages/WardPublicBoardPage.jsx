/**
 * WardPublicBoardPage.jsx — TASK FE-6.2
 * Public unauthenticated fullscreen ward whiteboard display.
 * Route: /display/ward-matrix
 * No Navbar / Sidebar — chromeless TV display.
 * PHI-safe: shows only first name + last initial.
 */
import React, { useState, useEffect } from 'react';
import { Activity, Users, Clock, Wifi, WifiOff } from 'lucide-react';

// ── Mock data (same bed pool as BedMatrixPage) ─────────────────────────────
const MOCK_BEDS = [
  { id: 'BED-101', ward: 'General Ward Male',   section: 'GWM-A', status: 'OCCUPIED',     name: 'Ramesh Kumar',   doctor: 'Dr. Sharma', day: 3 },
  { id: 'BED-102', ward: 'General Ward Male',   section: 'GWM-A', status: 'OCCUPIED',     name: 'Geeta Sharma',   doctor: 'Dr. Mehta',  day: 1 },
  { id: 'BED-103', ward: 'General Ward Male',   section: 'GWM-A', status: 'CRITICAL',     name: 'Vijay Kumar',    doctor: 'Dr. Gupta',  day: 5, news2: 8 },
  { id: 'BED-104', ward: 'General Ward Male',   section: 'GWM-A', status: 'OCCUPIED',     name: 'Sunita Devi',    doctor: 'Dr. Sharma', day: 2 },
  { id: 'BED-105', ward: 'General Ward Male',   section: 'GWM-A', status: 'OCCUPIED',     name: 'Arjun Singh',    doctor: 'Dr. Mehta',  day: 4 },
  { id: 'BED-106', ward: 'General Ward Male',   section: 'GWM-B', status: 'OCCUPIED',     name: 'Priya Nair',     doctor: 'Dr. Sharma', day: 1 },
  { id: 'BED-107', ward: 'General Ward Male',   section: 'GWM-B', status: 'OCCUPIED',     name: 'Mohan Rao',      doctor: 'Dr. Gupta',  day: 7 },
  { id: 'BED-108', ward: 'General Ward Male',   section: 'GWM-B', status: 'OCCUPIED',     name: 'Kavitha Iyer',   doctor: 'Dr. Mehta',  day: 2 },
  { id: 'BED-109', ward: 'General Ward Male',   section: 'GWM-B', status: 'OCCUPIED',     name: 'Suresh Menon',   doctor: 'Dr. Gupta',  day: 3 },
  { id: 'BED-110', ward: 'General Ward Male',   section: 'GWM-B', status: 'OCCUPIED',     name: 'Anita Pillai',   doctor: 'Dr. Mehta',  day: 1 },
  { id: 'BED-111', ward: 'General Ward Female', section: 'GWF-A', status: 'OCCUPIED',     name: 'Rajiv Bose',     doctor: 'Dr. Gupta',  day: 6 },
  { id: 'BED-112', ward: 'General Ward Female', section: 'GWF-A', status: 'OCCUPIED',     name: 'Meena Chandra',  doctor: 'Dr. Mehta',  day: 2 },
  { id: 'BED-113', ward: 'General Ward Female', section: 'GWF-A', status: 'AVAILABLE',    name: null, doctor: null, day: null },
  { id: 'BED-114', ward: 'General Ward Female', section: 'GWF-A', status: 'AVAILABLE',    name: null, doctor: null, day: null },
  { id: 'BED-115', ward: 'General Ward Female', section: 'GWF-A', status: 'AVAILABLE',    name: null, doctor: null, day: null },
  { id: 'BED-116', ward: 'Semi-Private Ward',   section: 'SPW-1', status: 'AVAILABLE',    name: null, doctor: null, day: null },
  { id: 'BED-117', ward: 'Semi-Private Ward',   section: 'SPW-1', status: 'AVAILABLE',    name: null, doctor: null, day: null },
  { id: 'BED-118', ward: 'Semi-Private Ward',   section: 'SPW-1', status: 'CLEANING',     name: null, doctor: null, day: null },
  { id: 'BED-119', ward: 'ICU',                 section: 'ICU-A', status: 'OCCUPIED',     name: 'Lakshmi Rajan',  doctor: 'Dr. Gupta',  day: 2 },
  { id: 'BED-120', ward: 'ICU',                 section: 'ICU-A', status: 'OCCUPIED',     name: 'Deepak Shah',    doctor: 'Dr. Sharma', day: 1 },
  { id: 'BED-121', ward: 'ICU',                 section: 'ICU-A', status: 'MAINTENANCE',  name: null, doctor: null, day: null },
  { id: 'BED-122', ward: 'ICU',                 section: 'ICU-A', status: 'MAINTENANCE',  name: null, doctor: null, day: null },
];

const NURSING_SHIFTS = [
  { name: 'Sr. Mini Joseph',  role: 'Charge Nurse', ward: 'Ward 02', shift: 'Evening (3PM–11PM)' },
  { name: 'Ritu Patel',       role: 'Staff Nurse',  ward: 'GWM',     shift: 'Evening (3PM–11PM)' },
  { name: 'Anjali Desai',     role: 'Staff Nurse',  ward: 'GWF',     shift: 'Evening (3PM–11PM)' },
  { name: 'Preethi Nambiar',  role: 'Staff Nurse',  ward: 'ICU',     shift: 'Evening (3PM–11PM)' },
  { name: 'Sneha Kulkarni',   role: 'Jr. Nurse',    ward: 'SPW',     shift: 'Evening (3PM–11PM)' },
];

// PHI-safe: first name + last initial only
function obfuscateName(fullName) {
  if (!fullName) return null;
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

const STATUS_CONFIG = {
  OCCUPIED:    { bg: '#1e3a5f', border: '#3b82f6', badge: '#60a5fa', label: 'Occupied'    },
  CRITICAL:    { bg: '#3b1c1c', border: '#ef4444', badge: '#f87171', label: 'Critical'    },
  AVAILABLE:   { bg: '#14303a', border: '#10b981', badge: '#34d399', label: 'Available'   },
  CLEANING:    { bg: '#2d2a14', border: '#d97706', badge: '#fbbf24', label: 'Cleaning'    },
  MAINTENANCE: { bg: '#1e1e2a', border: '#6d28d9', badge: '#a78bfa', label: 'Maintenance' },
};

function BedCard({ bed }) {
  const cfg = STATUS_CONFIG[bed.status] || STATUS_CONFIG.AVAILABLE;
  const displayName = obfuscateName(bed.name);
  const isCritical = bed.status === 'CRITICAL';

  return (
    <div
      style={{
        background: cfg.bg,
        border: `2px solid ${cfg.border}`,
        borderRadius: 12,
        padding: '14px 16px',
        position: 'relative',
        animation: isCritical ? 'critBorderPulse 2s ease-in-out infinite' : 'none',
      }}
    >
      {/* Bed ID + Status badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: '#e2e8f0', fontVariantNumeric: 'tabular-nums' }}>
          {bed.id}
        </span>
        <span style={{
          fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
          background: `${cfg.badge}25`, border: `1px solid ${cfg.badge}60`,
          color: cfg.badge, letterSpacing: '0.06em',
        }}>
          {cfg.label.toUpperCase()}
        </span>
      </div>

      {/* Ward section */}
      <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>
        {bed.section} &bull; {bed.ward.replace('General Ward ', 'GW ').replace('Semi-Private Ward', 'SPW')}
      </div>

      {/* Patient info (PHI-safe) */}
      {displayName ? (
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', marginBottom: 2 }}>
            {displayName}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>{bed.doctor}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>Day {bed.day}</span>
          </div>
          {isCritical && (
            <div style={{
              marginTop: 6, padding: '3px 8px', borderRadius: 6,
              background: '#ef444420', border: '1px solid #ef444460',
              fontSize: 10, fontWeight: 800, color: '#f87171', textAlign: 'center',
            }}>
              ⚠ NEWS2: {bed.news2} — CRITICAL
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: '#475569', fontStyle: 'italic', marginTop: 4 }}>
          {bed.status === 'CLEANING' ? '🧹 Being cleaned' :
           bed.status === 'MAINTENANCE' ? '🔧 Maintenance' : 'Available'}
        </div>
      )}
    </div>
  );
}

export default function WardPublicBoardPage() {
  const [time, setTime] = useState(new Date());
  const [online, setOnline] = useState(true);
  const [beds, setBeds] = useState(MOCK_BEDS);
  const [activeWard, setActiveWard] = useState('All');

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // SSE with 30s polling fallback
  useEffect(() => {
    let es;
    let pollTimer;

    const startPolling = () => {
      pollTimer = setInterval(async () => {
        try {
          const r = await fetch('/api/v1/display/ward/beds');
          if (r.ok) { setBeds(await r.json()); setOnline(true); }
        } catch { setOnline(false); }
      }, 30000);
    };

    try {
      es = new EventSource('/api/v1/display/ward/stream');
      es.onmessage = (e) => {
        try { setBeds(JSON.parse(e.data)); setOnline(true); } catch {}
      };
      es.onerror = () => {
        setOnline(false);
        es.close();
        startPolling();
      };
    } catch {
      setOnline(false);
      startPolling();
    }

    return () => {
      if (es) es.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, []);

  const WARDS = ['All', 'General Ward Male', 'General Ward Female', 'Semi-Private Ward', 'ICU'];
  const filtered = activeWard === 'All' ? beds : beds.filter((b) => b.ward === activeWard);

  const stats = {
    total:     beds.length,
    occupied:  beds.filter((b) => ['OCCUPIED', 'CRITICAL'].includes(b.status)).length,
    available: beds.filter((b) => b.status === 'AVAILABLE').length,
    critical:  beds.filter((b) => b.status === 'CRITICAL').length,
  };

  return (
    <div style={{
      background: '#0F172A',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: '#e2e8f0',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ── Header ── */}
      <header style={{
        background: '#0a0f1e',
        borderBottom: '1px solid #1e293b',
        padding: '16px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg,#0d9488,#0f766e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
              Bright Solutions Hospital
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
              Ward Digital Whiteboard — Live Bed Status
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 28 }}>
          {[
            { label: 'Total Beds', value: stats.total,     color: '#94a3b8' },
            { label: 'Occupied',   value: stats.occupied,  color: '#60a5fa' },
            { label: 'Available',  value: stats.available, color: '#34d399' },
            { label: 'Critical',   value: stats.critical,  color: '#f87171' },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Clock + connection */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#e2e8f0', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.05em' }}>
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
            {online
              ? <><Wifi size={11} color="#34d399" /><span style={{ color: '#34d399' }}>Live</span></>
              : <><WifiOff size={11} color="#f87171" /><span style={{ color: '#f87171' }}>Offline – Mock Data</span></>}
          </div>
        </div>
      </header>

      {/* ── Ward Filter Tabs ── */}
      <div style={{
        background: '#0a0f1e',
        borderBottom: '1px solid #1e293b',
        padding: '10px 28px',
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
      }}>
        {WARDS.map((w) => (
          <button
            key={w}
            onClick={() => setActiveWard(w)}
            style={{
              padding: '7px 18px', borderRadius: 8, cursor: 'pointer',
              border: `1.5px solid ${activeWard === w ? '#0d9488' : '#1e293b'}`,
              background: activeWard === w ? '#0d948820' : 'transparent',
              color: activeWard === w ? '#34d399' : '#64748b',
              fontSize: 12, fontWeight: activeWard === w ? 800 : 600,
              whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}
          >
            {w}
          </button>
        ))}
      </div>

      {/* ── Main Content ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Bed Grid */}
        <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}>
            {filtered.map((bed) => <BedCard key={bed.id} bed={bed} />)}
          </div>
        </div>

        {/* Nursing Panel */}
        <aside style={{
          width: 220,
          background: '#0a0f1e',
          borderLeft: '1px solid #1e293b',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={14} color="#64748b" />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              On-Duty Nursing
            </span>
          </div>

          {NURSING_SHIFTS.map((n, i) => (
            <div key={i} style={{
              background: '#1e293b', borderRadius: 10, padding: '12px 14px',
              border: '1px solid #334155',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: 'linear-gradient(135deg,#0d9488,#0f766e)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: '#fff',
                }}>
                  {n.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#e2e8f0' }}>{n.name}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{n.role}</div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: '#475569' }}>
                Ward: <span style={{ color: '#94a3b8', fontWeight: 600 }}>{n.ward}</span>
              </div>
            </div>
          ))}

          {/* Legend */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid #1e293b', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Clock size={11} color="#64748b" />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>LEGEND</span>
            </div>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: v.badge }} />
                <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{v.label}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes critBorderPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
          50%      { box-shadow: 0 0 0 6px rgba(239,68,68,0.18); }
        }
      `}</style>
    </div>
  );
}

