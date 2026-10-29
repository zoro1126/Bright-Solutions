/**
 * CounterLayout.jsx — High-speed Reception / Billing Counter (D15 §2.4)
 * No sidebar — tab-based navigation for speed.
 */
import React from 'react';
import { Activity, LogOut } from 'lucide-react';

const TABS_BY_ROLE = {
  receptionist: [
    { id: 'dashboard',    label: 'Dashboard' },
    { id: 'token-queue',  label: 'Token Queue' },
    { id: 'queue',        label: 'Patients' },
    { id: 'reports',      label: 'Reports' },
  ],
  cashier: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'billing',   label: 'Billing' },
    { id: 'receipt',   label: 'Receipts' },
  ],
};

export default function CounterLayout({
  children,
  activeTab,
  onTabChange,
  onLogout,
  user,
  role = 'receptionist',
  licenseStatus = null,
}) {
  const tabs = TABS_BY_ROLE[role] || TABS_BY_ROLE.receptionist;

  const roleColors = role === 'cashier'
    ? { accent: '#D97706', bg: '#FEF3C7', border: '#FDE68A', text: '#92400E' }
    : { accent: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A', text: '#92400E' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#FFFBEB' }}>
      {/* License Grace/Expired Banner */}
      {licenseStatus === 'GRACE_PERIOD' && (
        <div style={{ background: '#F59E0B', padding: '6px 20px', fontSize: 11.5, fontWeight: 700, color: '#fff', textAlign: 'center' }}>
          ⚠ LICENSE GRACE PERIOD — Renew immediately to avoid read-only mode. Go to Admin → Licensing.
        </div>
      )}
      {licenseStatus === 'EXPIRED' && (
        <div style={{ background: '#EF4444', padding: '6px 20px', fontSize: 11.5, fontWeight: 700, color: '#fff', textAlign: 'center' }}>
          🔴 LICENSE EXPIRED — System is in READ-ONLY mode. Contact administrator.
        </div>
      )}

      {/* Topbar */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 48, flexShrink: 0,
        background: '#fff', borderBottom: '1px solid #FDE68A',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: `linear-gradient(135deg, ${roleColors.accent}, #B45309)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={15} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>Bright</span>
          <span style={{ fontSize: 10.5, color: roleColors.accent, fontWeight: 700 }}>
            • {role === 'cashier' ? 'Billing & Settlement' : 'OPD Reception'}
          </span>
        </div>

        {/* Tab Nav */}
        <nav style={{ display: 'flex', gap: 2 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              style={{
                padding: '5px 14px', borderRadius: 8, fontSize: 11.5, fontWeight: 700,
                cursor: 'pointer', border: 'none',
                background: activeTab === tab.id ? roleColors.bg : 'transparent',
                color: activeTab === tab.id ? roleColors.text : '#64748B',
                borderBottom: activeTab === tab.id ? `2px solid ${roleColors.accent}` : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user && (
            <span style={{
              padding: '2px 10px', borderRadius: 9999,
              background: roleColors.bg, color: roleColors.text,
              fontSize: 10.5, fontWeight: 700, border: `1px solid ${roleColors.border}`,
            }}>
              {user.name || user.full_name || 'Staff'}
            </span>
          )}
          {onLogout && (
            <button onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', padding: 4 }}>
              <LogOut size={14} />
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

