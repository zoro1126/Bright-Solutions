/**
 * WardLayout.jsx — Inpatient Nurse Ward Station (D15 §2.3)
 * Features: Bed stats topbar, ward filter tabs, NEWS2 critical alert strip
 */
import React from 'react';
import { Activity, Bed, AlertTriangle, LogOut } from 'lucide-react';

const WARDS = [
  { id: 'all',  label: 'All Wards' },
  { id: 'GWM',  label: 'Gen. Male' },
  { id: 'GWF',  label: 'Gen. Female' },
  { id: 'SPW',  label: 'Semi-Pvt' },
  { id: 'ICU',  label: 'ICU' },
];

export default function WardLayout({
  children,
  onLogout,
  user,
  wardFilter = 'all',
  onWardFilterChange,
  bedStats = { total: 20, occupied: 0, available: 0, critical: 0 },
}) {
  const hasCritical = bedStats.critical > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#F0FDF4' }}>
      {/* Critical NEWS2 alert strip */}
      {hasCritical && (
        <div style={{
          background: 'linear-gradient(90deg, #7F1D1D, #991B1B)',
          padding: '6px 20px',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'wardPulse 1.8s ease-in-out infinite',
          flexShrink: 0,
        }}>
          <AlertTriangle size={14} color="#FCA5A5" />
          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#FEE2E2' }}>
            🚨 CRITICAL ALERT — {bedStats.critical} bed{bedStats.critical > 1 ? 's' : ''} with NEWS2 ≥ 7 — Rapid Response Required
          </span>
        </div>
      )}

      {/* Navbar */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 48, flexShrink: 0,
        background: '#fff', borderBottom: '1px solid #D1FAE5',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #0D9488, #0F766E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={15} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>Bright</span>
          <span style={{ fontSize: 10.5, color: '#0D9488', fontWeight: 700 }}>• Ward Station</span>
        </div>

        {/* Bed stats */}
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Total', val: bedStats.total,    color: '#334155' },
            { label: 'Occupied', val: bedStats.occupied, color: '#EF4444' },
            { label: 'Available', val: bedStats.available, color: '#10B981' },
            { label: 'Critical', val: bedStats.critical, color: '#DC2626' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color, fontFamily: 'monospace' }}>{val}</div>
              <div style={{ fontSize: 9.5, color: '#94A3B8', fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user && (
            <span style={{
              padding: '2px 10px', borderRadius: 9999,
              background: '#CCFBF1', color: '#0F766E',
              fontSize: 10.5, fontWeight: 700, border: '1px solid #99F6E4',
            }}>
              {user.name || 'Nurse'}
            </span>
          )}
          {onLogout && (
            <button onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', padding: 4 }}>
              <LogOut size={14} />
            </button>
          )}
        </div>
      </header>

      {/* Ward filter tabs */}
      <div style={{
        display: 'flex', gap: 4, padding: '6px 16px',
        background: '#fff', borderBottom: '1px solid #D1FAE5', flexShrink: 0,
      }}>
        {WARDS.map(w => (
          <button
            key={w.id}
            onClick={() => onWardFilterChange?.(w.id)}
            style={{
              padding: '5px 14px', borderRadius: 8, fontSize: 11.5,
              fontWeight: 700, cursor: 'pointer', border: 'none',
              background: wardFilter === w.id ? '#0D9488' : '#F0FDF4',
              color: wardFilter === w.id ? '#fff' : '#0F766E',
              transition: 'all 0.15s',
            }}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {children}
      </main>

      <style>{`
        @keyframes wardPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.75; } }
      `}</style>
    </div>
  );
}

