/**
 * AdminLayout.jsx — Hospital Admin / Config (D15 §2.5)
 */
import React from 'react';
import { ShieldCheck, BarChart3, Users, FileText, Key, LogOut } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Executive Analytics',  icon: BarChart3 },
  { id: 'staff',     label: 'Staff & Access',        icon: Users },
  { id: 'audit',     label: 'Clinical Audit Trail',  icon: FileText },
  { id: 'licensing', label: 'License Management',    icon: Key },
];

export default function AdminLayout({ children, activeTab, onTabChange, onLogout, user, licenseStatus = null }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F8FAFC' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'linear-gradient(180deg, #0F172A 0%, #1E3A5F 100%)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '2px 0 12px rgba(0,0,0,0.2)',
      }}>
        {/* Brand */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1E3A5F' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: 'linear-gradient(135deg, #1E3A8A, #2563EB)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldCheck size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#F1F5F9', letterSpacing: '-0.02em' }}>Bright</div>
              <div style={{ fontSize: 9, color: '#64748B', fontWeight: 700 }}>Admin Console</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 9, color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 8px 4px' }}>
            Governance
          </div>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange?.(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 8,
                background: activeTab === id ? 'rgba(37,99,235,0.25)' : 'transparent',
                border: `1px solid ${activeTab === id ? '#2563EB' : 'transparent'}`,
                color: activeTab === id ? '#93C5FD' : '#94A3B8',
                fontSize: 12, fontWeight: activeTab === id ? 700 : 600,
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #1E3A5F' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#CBD5E1', marginBottom: 2 }}>
            {user?.name || user?.full_name || 'Administrator'}
          </div>
          <div style={{ fontSize: 9.5, color: '#475569', marginBottom: 10 }}>Medical Superintendent</div>
          {onLogout && (
            <button onClick={onLogout} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 7, padding: '5px 10px', color: '#F87171',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', width: '100%',
            }}>
              <LogOut size={12} /> Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{
          height: 48, padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fff', borderBottom: '1px solid #E2E8F0',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
            {NAV_ITEMS.find(n => n.id === activeTab)?.label || 'Admin Console'}
          </div>
          {licenseStatus && licenseStatus !== 'ACTIVE' && (
            <span style={{
              padding: '3px 12px', borderRadius: 9999,
              background: licenseStatus === 'GRACE_PERIOD' ? '#FEF3C7' : '#FEE2E2',
              color: licenseStatus === 'GRACE_PERIOD' ? '#92400E' : '#991B1B',
              fontSize: 10.5, fontWeight: 800,
              border: `1px solid ${licenseStatus === 'GRACE_PERIOD' ? '#FDE68A' : '#FCA5A5'}`,
            }}>
              {licenseStatus === 'GRACE_PERIOD' ? '⚠ GRACE PERIOD' : '🔴 EXPIRED'}
            </span>
          )}
        </header>
        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

