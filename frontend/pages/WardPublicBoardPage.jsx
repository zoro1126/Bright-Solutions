/**
 * WardPublicBoardPage.jsx — TASK FE-6.2
 * Public unauthenticated fullscreen ward whiteboard display (Clean White Theme).
 * Route: /display/ward-matrix
 * PHI-safe: shows only first name + last initial.
 */
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Clock, Wifi } from 'lucide-react';

// ── Mock data (same bed pool as BedMatrixPage) ─────────────────────────────
const MOCK_BEDS = [
  { id: 'BED-101', ward: 'General Ward Male',   section: 'GWM-A', status: 'OCCUPIED',     name: 'Ramesh Kumar',   doctor: 'Dr. Sharma', day: 3 },
  { id: 'BED-102', ward: 'General Ward Male',   section: 'GWM-A', status: 'OCCUPIED',     name: 'Geeta Sharma',   doctor: 'Dr. Mehta',  day: 1 },
  { id: 'BED-103', ward: 'General Ward Male',   section: 'GWM-A', status: 'CRITICAL',     name: 'Vijay Kumar',    doctor: 'Dr. Gupta',  day: 5, news2: 8 },
  { id: 'BED-104', ward: 'General Ward Male',   section: 'GWM-A', status: 'OCCUPIED',     name: 'Sunita Devi',    doctor: 'Dr. Sharma', day: 2 },
  { id: 'BED-105', ward: 'General Ward Male',   section: 'GWM-A', status: 'OCCUPIED',     name: 'Arjun Singh',    doctor: 'Dr. Mehta',  day: 4 },
  { id: 'BED-106', ward: 'General Ward Male',   section: 'GWM-B', status: 'OCCUPIED',     name: 'Priya Nair',     doctor: 'Dr. Sharma', day: 1 },
  { id: 'BED-107', ward: 'General Ward Male',   section: 'GWM-B', status: 'OCCUPIED',     name: 'Mohan Rao',      doctor: 'Dr. Gupta',  day: 7 },
  { id: 'BED-108', ward: 'General Ward Male',   section: 'GWM-B', status: 'OCCUPIED',     name: 'Kavitha Iyer',   doctor: 'Dr. Sharma', day: 2 },
  { id: 'BED-109', ward: 'General Ward Male',   section: 'GWM-B', status: 'OCCUPIED',     name: 'Suresh Menon',   doctor: 'Dr. Mehta',  day: 3 },
  { id: 'BED-110', ward: 'General Ward Male',   section: 'GWM-B', status: 'OCCUPIED',     name: 'Anita Pillai',   doctor: 'Dr. Gupta',  day: 1 },
  { id: 'BED-111', ward: 'General Ward Female', section: 'GWF-A', status: 'OCCUPIED',     name: 'Rajiv Bose',     doctor: 'Dr. Sharma', day: 6 },
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

function obfuscateName(fullName) {
  if (!fullName) return null;
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

const STATUS_CONFIG = {
  OCCUPIED:    { bg: '#ffffff', border: '#bfdbfe', badgeBg: '#eff6ff', badgeColor: '#1d4ed8', label: 'Occupied' },
  CRITICAL:    { bg: '#fff5f5', border: '#fca5a5', badgeBg: '#fee2e2', badgeColor: '#dc2626', label: 'Critical' },
  AVAILABLE:   { bg: '#ffffff', border: '#bbf7d0', badgeBg: '#f0fdf4', badgeColor: '#15803d', label: 'Available' },
  CLEANING:    { bg: '#ffffff', border: '#fde68a', badgeBg: '#fffbeb', badgeColor: '#b45309', label: 'Cleaning' },
  MAINTENANCE: { bg: '#ffffff', border: '#ddd6fe', badgeBg: '#f5f3ff', badgeColor: '#6d28d9', label: 'Maintenance' },
};

function BedCard({ bed }) {
  const cfg = STATUS_CONFIG[bed.status] || STATUS_CONFIG.AVAILABLE;
  const displayName = obfuscateName(bed.name);
  const isCritical = bed.status === 'CRITICAL';

  return (
    <div
      style={{
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        borderRadius: 10,
        padding: '12px 14px',
        position: 'relative',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>
          {bed.id}
        </span>
        <span style={{
          fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 6,
          background: cfg.badgeBg, border: `1px solid ${cfg.border}`,
          color: cfg.badgeColor, letterSpacing: '0.04em',
        }}>
          {cfg.label.toUpperCase()}
        </span>
      </div>

      <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>
        {bed.section} • {bed.ward.replace('General Ward ', 'GW ').replace('Semi-Private Ward', 'SPW')}
      </div>

      {displayName ? (
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
            {displayName}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>
            <span>{bed.doctor}</span>
            <span>Day {bed.day}</span>
          </div>
          {isCritical && (
            <div style={{
              marginTop: 6, padding: '3px 8px', borderRadius: 6,
              background: '#fee2e2', border: '1px solid #fca5a5',
              fontSize: 10, fontWeight: 800, color: '#dc2626', textAlign: 'center',
            }}>
              ⚠️ NEWS2: {bed.news2} — CRITICAL
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 11.5, color: bed.status === 'CLEANING' ? '#b45309' : '#94a3b8', fontStyle: 'italic', marginTop: 4 }}>
          {bed.status === 'CLEANING' ? '🧹 Being cleaned' : bed.status === 'MAINTENANCE' ? '🔧 Maintenance' : 'Ready for admission'}
        </div>
      )}
    </div>
  );
}

export default function WardPublicBoardPage() {
  const [beds] = useState(MOCK_BEDS);
  const [selectedWard, setSelectedWard] = useState('ALL');
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const total = beds.length;
  const occupied = beds.filter(b => b.status === 'OCCUPIED' || b.status === 'CRITICAL').length;
  const available = beds.filter(b => b.status === 'AVAILABLE').length;
  const critical = beds.filter(b => b.status === 'CRITICAL').length;

  const wards = ['ALL', 'General Ward Male', 'General Ward Female', 'Semi-Private Ward', 'ICU'];
  const filteredBeds = selectedWard === 'ALL' ? beds : beds.filter(b => b.ward === selectedWard);

  return (
    <div style={{
      width: '100vw', minHeight: '100vh',
      background: '#f8fafc',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1.5px solid #e2e8f0',
        padding: '14px 28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => window.location.href = '/ipd'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              background: '#f8fafc', border: '1.5px solid #cbd5e1',
              color: '#334155', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
            title="Return to IPD Station"
          >
            <ArrowLeft size={14} /> Back to IPD
          </button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
              Bright Solutions Hospital
            </div>
            <div style={{ fontSize: 11, color: '#0d9488', fontWeight: 700 }}>
              Ward Digital Whiteboard — Live Inpatient Bed Status
            </div>
          </div>
        </div>

        {/* Stats Pill */}
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'Total', count: total, color: '#0f172a', bg: '#f1f5f9' },
            { label: 'Occupied', count: occupied, color: '#0284c7', bg: '#eff6ff' },
            { label: 'Available', count: available, color: '#15803d', bg: '#f0fdf4' },
            { label: 'Critical', count: critical, color: '#dc2626', bg: '#fee2e2' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 8, padding: '4px 12px', textAlign: 'center', minWidth: 60 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b' }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.count}</div>
            </div>
          ))}
        </div>

        {/* Clock */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </div>
          <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} /> Live System Active
          </div>
        </div>
      </div>

      {/* ── Filter Tabs ─────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 28px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 8 }}>
        {wards.map(w => (
          <button
            key={w}
            onClick={() => setSelectedWard(w)}
            style={{
              padding: '6px 14px', borderRadius: 8,
              border: selectedWard === w ? '1.5px solid #0d9488' : '1px solid #e2e8f0',
              background: selectedWard === w ? '#f0fdfa' : '#f8fafc',
              color: selectedWard === w ? '#0d9488' : '#64748b',
              fontWeight: selectedWard === w ? 800 : 600, fontSize: 11.5, cursor: 'pointer',
            }}
          >
            {w === 'ALL' ? 'All Wards (22)' : w}
          </button>
        ))}
      </div>

      {/* ── Body: Grid + Nursing Sidebar ────────────────────────────────── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, padding: '20px 28px' }}>
        {/* Beds Matrix */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 12,
          alignContent: 'start',
        }}>
          {filteredBeds.map(b => (
            <BedCard key={b.id} bed={b} />
          ))}
        </div>

        {/* Nursing sidebar */}
        <div style={{ background: '#ffffff', borderRadius: 12, border: '1.5px solid #e2e8f0', padding: '16px', height: 'fit-content' }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={15} color="#0d9488" /> On-Duty Ward Staff
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {NURSING_SHIFTS.map(n => (
              <div key={n.name} style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{n.name}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>{n.role} • {n.ward}</div>
                <div style={{ fontSize: 9.5, color: '#0d9488', fontWeight: 600, marginTop: 2 }}>{n.shift}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Legend:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 10, color: '#475569' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#3b82f6' }} /> Occupied</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#ef4444' }} /> Critical</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }} /> Available</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#f59e0b' }} /> Cleaning</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
