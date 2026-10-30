/**
 * Navbar.jsx — Top App Bar
 * Replaced role-switcher with OPD | IPD department tabs.
 * Dept prop: 'OPD' | 'IPD' | 'ADMIN' — controls which tab is active.
 */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Stethoscope,
  Bed,
  ShieldCheck,
  LogOut,
  Sparkles,
  Activity,
  Sun,
  Receipt,
  Pill,
  Tv,
  ExternalLink,
} from 'lucide-react';

export default function Navbar({
  onToggleSidebar,
  currentRole = 'receptionist',
  dept,                    // 'OPD' | 'IPD' | 'ADMIN' — preferred over currentRole
  onRoleChange,            // kept for legacy compatibility; ignored when dept is passed
  onLogout,
  onOpenReceptionistGuide,
  onOpenDoctorGuide,
  onOpenAdminGuide,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDisplayMenu, setShowDisplayMenu] = useState(false);

  // Derive active dept from prop or from URL path
  const activeDept =
    dept ||
    (location.pathname.startsWith('/ipd') ? 'IPD' :
     location.pathname.startsWith('/admin') ? 'ADMIN' : 'OPD');

  const deptTabs = [
    {
      id: 'OPD',
      label: 'OPD',
      sublabel: 'Outpatient',
      icon: Stethoscope,
      route: '/receptionist/dashboard',
      activeColor: '#0077b6',
      activeBg: '#caf0f8',
      activeBorder: '#90e0ef',
    },
    {
      id: 'IPD',
      label: 'IPD',
      sublabel: 'Inpatient',
      icon: Bed,
      route: '/ipd',
      activeColor: '#0d9488',
      activeBg: '#ccfbf1',
      activeBorder: '#99f6e4',
    },
    {
      id: 'ADMIN',
      label: 'Admin',
      sublabel: 'Governance',
      icon: ShieldCheck,
      route: '/admin/dashboard',
      activeColor: '#6d28d9',
      activeBg: '#ede9fe',
      activeBorder: '#c4b5fd',
    },
  ];

  const activeDeptMeta = deptTabs.find((d) => d.id === activeDept) || deptTabs[0];

  return (
    <header
      className="app-header m3-top-app-bar"
      style={{ zIndex: 50 }}
    >
      {/* Left: Hamburger + Brand */}
      <div className="brand-section">
        {onToggleSidebar && (
          <button
            className="icon-btn m3-menu-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation drawer"
          >
            <Menu size={18} />
          </button>
        )}
        <div className="brand-info">
          <div className="brand-title">
            <span
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Sun size={16} color="#f59e0b" strokeWidth={2.5} />
              Bright
            </span>
            <span style={{ color: 'var(--border-default)', margin: '0 4px' }}>•</span>
            <span
              className="brand-title-text"
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: activeDeptMeta.activeColor,
              }}
            >
              {activeDept === 'IPD'
                ? 'Inpatient & Ward Station OS'
                : activeDept === 'ADMIN'
                ? 'Executive Governance & Audit'
                : 'Outpatient Clinical OS'}
            </span>
          </div>
        </div>
      </div>

      {/* Center: OPD / IPD / Admin Department Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: '#f1f5f9',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '3px 4px',
        }}
      >
        {deptTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeDept === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.route)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 9,
                border: isActive ? `1px solid ${tab.activeBorder}` : '1px solid transparent',
                background: isActive ? tab.activeBg : 'transparent',
                color: isActive ? tab.activeColor : '#64748b',
                fontWeight: isActive ? 800 : 600,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#e2e8f0';
                  e.currentTarget.style.color = '#334155';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#64748b';
                }
              }}
            >
              <Icon size={13} strokeWidth={isActive ? 2.5 : 2} />
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: isActive ? tab.activeColor : '#94a3b8',
                  opacity: 0.8,
                }}
              >
                {tab.sublabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right: Displays + Guide + Logout */}
      <div className="header-right">
        {/* Waiting Room TV link — OPD ONLY */}
        {activeDept === 'OPD' && (
          <a
            href="/display/waiting-room"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              height: 28,
              fontSize: 11,
              padding: '0 10px',
              borderRadius: 8,
              backgroundColor: '#eff6ff',
              color: '#0369a1',
              border: '1px solid #bae6fd',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
            title="Open Waiting Room Live TV Display in New Tab"
          >
            <Tv size={13} color="#0284c7" />
            <span>Waiting Room TV</span>
            <ExternalLink size={11} color="#0284c7" />
          </a>
        )}

        {/* Ward Board TV link — IPD ONLY */}
        {activeDept === 'IPD' && (
          <a
            href="/display/ward-matrix"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              height: 28,
              fontSize: 11,
              padding: '0 10px',
              borderRadius: 8,
              backgroundColor: '#f0fdfa',
              color: '#0f766e',
              border: '1px solid #99f6e4',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
            title="Open Ward Matrix Digital Whiteboard in New Tab"
          >
            <Tv size={13} color="#0d9488" />
            <span>Ward Board TV</span>
            <ExternalLink size={11} color="#0d9488" />
          </a>
        )}
        {((currentRole === 'receptionist' && onOpenReceptionistGuide) ||
          (currentRole === 'doctor' && onOpenDoctorGuide) ||
          (currentRole === 'admin' && onOpenAdminGuide)) && (
          <button
            className="m3-btn m3-btn-sm anim-hover-lift"
            onClick={() => {
              if (currentRole === 'receptionist' && onOpenReceptionistGuide) onOpenReceptionistGuide();
              else if (currentRole === 'doctor' && onOpenDoctorGuide) onOpenDoctorGuide();
              else if (currentRole === 'admin' && onOpenAdminGuide) onOpenAdminGuide();
            }}
            style={{
              height: 26,
              fontSize: 9.5,
              padding: '0 10px',
              borderRadius: 9999,
              backgroundColor: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
            }}
          >
            <Sparkles size={11} color="#d97706" />
            <span>Quick Guide ⚡</span>
          </button>
        )}

        {onLogout && (
          <button
            className="icon-btn anim-hover-lift"
            onClick={onLogout}
            title="Sign Out"
            aria-label="Sign Out"
            style={{
              color: 'var(--destructive, #dc2626)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginLeft: 4,
            }}
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    </header>
  );
}
