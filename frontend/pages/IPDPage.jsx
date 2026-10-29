/**
 * IPDPage.jsx — Inpatient Department Shell (Light Design)
 * Route: /ipd, /ipd/beds, /ipd/admissions/*
 *
 * Tabs: Bed Matrix | Active Admissions | Nurse Station & MAR | Discharge Queue
 */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BedMatrixPage from './BedMatrixPage';
import InpatientFolioPage from './InpatientFolioPage';
import {
  Bed, ClipboardList, Activity, LogOut,
  ChevronLeft, ChevronRight, Settings, Sun,
} from 'lucide-react';

// ─── IPD Sidebar (Light Theme matching OPD sidebar) ──────────────────────────
function IPDSidebar({ activeTab, setActiveTab, collapsed, setCollapsed, onOpenFolio }) {
  const navItems = [
    { id: 'bed-matrix',  label: 'Bed Matrix & Admissions', icon: Bed,           badge: null },
    { id: 'admissions',  label: 'Active Admissions',        icon: ClipboardList, badge: 8   },
    { id: 'nursing',     label: 'Nurse Station & MAR',      icon: Activity,      badge: null },
    { id: 'discharge',   label: 'Discharge Queue',          icon: LogOut,        badge: 3   },
  ];

  const activeColor  = '#0d9488';
  const activeBg     = '#f0fdfa';
  const activeBorder = '#0d9488';

  return (
    <aside
      className={`m3-navigation-drawer ${collapsed ? 'collapsed' : ''}`}
      style={{ borderRight: '1px solid #e2e8f0' }}
    >
      {/* Header */}
      <div className="drawer-header">
        {collapsed ? (
          <button
            className="drawer-brand-btn-collapsed"
            onClick={() => setCollapsed(false)}
            title="Expand"
          >
            <div
              className="drawer-brand-icon"
              style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'linear-gradient(135deg,#0d9488,#0f766e)',
                boxShadow: '0 2px 6px rgba(13,148,136,0.35)',
                color: '#fff',
              }}
            >
              <Bed size={16} strokeWidth={2.4} />
            </div>
            <div className="drawer-expand-indicator">
              <ChevronRight size={10} strokeWidth={3} />
            </div>
          </button>
        ) : (
          <>
            <div className="drawer-brand">
              <div
                className="drawer-brand-icon"
                style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: 'linear-gradient(135deg,#0d9488,#0f766e)',
                  boxShadow: '0 2px 6px rgba(13,148,136,0.35)',
                  color: '#fff',
                }}
              >
                <Bed size={16} strokeWidth={2.4} />
              </div>
              <div className="drawer-brand-text">
                <span className="drawer-title" style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
                  Bright
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginTop: 1 }}>
                  IPD Ward OS
                </span>
              </div>
            </div>
            <button
              className="drawer-toggle-btn"
              onClick={() => setCollapsed(true)}
              title="Collapse"
              style={{ width: 22, height: 22 }}
            >
              <ChevronLeft size={13} />
            </button>
          </>
        )}
      </div>

      {/* Nav Items */}
      <div className="drawer-nav-list">
        {!collapsed && (
          <div className="drawer-section-label">
            <span style={{ color: activeColor, fontWeight: 700 }}>Inpatient Navigation</span>
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`m3-nav-item ${isActive ? 'active' : ''}`}
              style={
                isActive
                  ? { backgroundColor: activeBg, color: activeColor, borderLeft: `3px solid ${activeBorder}`, fontWeight: 700 }
                  : undefined
              }
              onClick={() => setActiveTab(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <div className="nav-icon-container" style={{ color: isActive ? activeColor : '#475569' }}>
                <Icon size={17} strokeWidth={isActive ? 2.5 : 2.2} />
              </div>
              {!collapsed && (
                <>
                  <span className="nav-label" style={{ color: isActive ? activeColor : '#334155', fontWeight: isActive ? 800 : 600 }}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="nav-badge" style={{ background: activeBg, color: activeColor, fontWeight: 700 }}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer staff card */}
      <div className="drawer-footer">
        <div className="drawer-nav-list" style={{ padding: 0 }}>
          <button className="m3-nav-item" title={collapsed ? 'Settings' : undefined}>
            <div className="nav-icon-container" style={{ color: '#475569' }}>
              <Settings size={17} strokeWidth={2.2} />
            </div>
            {!collapsed && <span className="nav-label" style={{ color: '#334155', fontWeight: 600 }}>Settings</span>}
          </button>
        </div>
        {collapsed ? (
          <div className="drawer-staff-collapsed" title="Sr. Mini Joseph • Charge Nurse">
            <div className="staff-avatar" style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)', color: '#fff' }}>MJ</div>
          </div>
        ) : (
          <div className="drawer-staff-card">
            <div className="staff-avatar" style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)', color: '#fff' }}>MJ</div>
            <div className="staff-info">
              <div className="staff-name" style={{ color: '#0f172a' }}>Sr. Mini Joseph</div>
              <div className="staff-role" style={{ color: '#0d9488' }}>Charge Nurse • Ward 02</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Placeholder tab ──────────────────────────────────────────────────────────
function PlaceholderTab({ icon: Icon, title, subtitle, color = '#0d9488' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16, color: '#64748b' }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: `${color}15`, border: `1.5px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        <Icon size={30} strokeWidth={1.5} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#334155', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>{subtitle}</div>
      </div>
    </div>
  );
}

// ─── Main IPDPage ─────────────────────────────────────────────────────────────
export default function IPDPage({ onSwitchDept, onLogout }) {
  const [activeTab, setActiveTab]           = useState('bed-matrix');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // selectedAdmission: when user clicks "Open Folio" on an occupied bed
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  // When BedMatrix triggers "Open Folio" → switch to admissions tab
  const handleOpenFolio = (admission) => {
    setSelectedAdmission(admission);
    setActiveTab('admissions');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar
        dept="IPD"
        currentRole="nurse"
        onRoleChange={onSwitchDept}
        onLogout={onLogout}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <IPDSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        <main style={{ flex: 1, overflow: 'auto', background: '#f8fafc' }}>
          {activeTab === 'bed-matrix' && (
            <BedMatrixPage embedded onOpenFolioExternal={handleOpenFolio} />
          )}

          {activeTab === 'admissions' && (
            selectedAdmission
              ? <InpatientFolioPage admission={selectedAdmission} onBack={() => { setSelectedAdmission(null); }} />
              : <PlaceholderTab icon={ClipboardList} title="Active Admissions" subtitle="Click 'Open Folio' on any occupied bed to view patient folio" color="#6d28d9" />
          )}

          {activeTab === 'nursing' && (
            <PlaceholderTab icon={Activity} title="Nurse Station & MAR" subtitle="Form 29 MAR + Form 72 Shift Notes — Phase FE-4" color="#0d9488" />
          )}

          {activeTab === 'discharge' && (
            <PlaceholderTab icon={LogOut} title="Discharge Queue" subtitle="10-Head Billing Settlement — Phase FE-5" color="#d97706" />
          )}
        </main>
      </div>
    </div>
  );
}
