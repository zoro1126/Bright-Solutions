import React from 'react';
import { useWalkthrough } from '../context/WalkthroughContext';
import { Menu, Stethoscope, Users, Receipt, ShieldCheck, LogOut, Sparkles } from 'lucide-react';

export default function Navbar({ onToggleSidebar, currentRole = 'receptionist', onRoleChange, onLogout }) {
  const { isGuideActive, startGuide, stopGuide } = useWalkthrough();

  // Role-based title colors for visual contrast
  let brandRoleColor = 'var(--text-secondary)';
  let brandPillBg = 'var(--bg-subtle)';
  let brandPillColor = 'var(--text-secondary)';
  let brandPillBorder = 'var(--border-default)';

  if (currentRole === 'doctor') {
    brandRoleColor = 'var(--doc-accent-color, #0077B6)';
    brandPillBg = 'var(--doc-pill-bg, #CAF0F8)';
    brandPillColor = 'var(--doc-pill-color, #0077B6)';
    brandPillBorder = 'var(--doc-pill-border, #90E0EF)';
  } else if (currentRole === 'admin') {
    brandRoleColor = 'var(--adm-accent-color, #0077B6)';
    brandPillBg = 'var(--adm-pill-bg, #CAF0F8)';
    brandPillColor = 'var(--adm-pill-color, #0077B6)';
    brandPillBorder = 'var(--adm-pill-border, #90E0EF)';
  } else if (currentRole === 'cashier') {
    brandRoleColor = 'var(--csh-accent-color, #059669)';
    brandPillBg = 'var(--csh-pill-bg, #d1fae5)';
    brandPillColor = 'var(--csh-pill-color, #065f46)';
    brandPillBorder = 'var(--csh-pill-border, #6ee7b7)';
  } else {
    brandRoleColor = '#d97706';
    brandPillBg = '#fef3c7';
    brandPillColor = '#92400e';
    brandPillBorder = '#fde68a';
  }

  return (
    <header className="app-header m3-top-app-bar">
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
            <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span>Bright</span>
            </span>
            <span style={{ color: 'var(--border-default)', margin: '0 2px' }}>•</span>
            <span className="brand-title-text" style={{ fontSize: 10.5, fontWeight: 700, color: brandRoleColor }}>
              {currentRole === 'doctor' 
                ? 'Consultant Clinical Workspace' 
                : currentRole === 'cashier'
                ? 'Cashier & Settlement Desk'
                : currentRole === 'admin'
                ? 'Executive Governance & Audit'
                : 'Front Desk & Reception'}
            </span>
            <span 
              className="brand-counter-pill" 
              style={{ 
                fontSize: 8.5, 
                fontWeight: 800, 
                background: brandPillBg, 
                color: brandPillColor, 
                border: `1px solid ${brandPillBorder}`, 
                padding: '1.5px 7px',
                borderRadius: 9999
              }}
            >
              {currentRole === 'doctor' 
                ? 'Dr. Kiran Patel' 
                : currentRole === 'cashier'
                ? 'Counter B-02'
                : currentRole === 'admin'
                ? 'Admin Desk'
                : 'Counter 01'}
            </span>
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* Role Switcher Segmented Control with High Contrast Identities */}
        {onRoleChange && (
          <div className="m3-role-switcher" style={{ border: '1px solid var(--border-default)' }}>
            <button
              className={`m3-role-btn ${currentRole === 'receptionist' ? 'active' : ''}`}
              onClick={() => onRoleChange('receptionist')}
              title="Reception Desk"
              data-tour="role-receptionist-btn"
              style={currentRole === 'receptionist' ? { backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 800 } : undefined}
            >
              <Users size={11} />
              <span>Receptionist</span>
            </button>
            <button
              className={`m3-role-btn ${currentRole === 'doctor' ? 'active' : ''}`}
              onClick={() => onRoleChange('doctor')}
              title="Doctor Desk"
              data-tour="role-doctor-btn"
              style={currentRole === 'doctor' ? { backgroundColor: 'var(--doc-pill-bg, #CAF0F8)', color: 'var(--doc-pill-color, #0077B6)', border: '1px solid var(--doc-pill-border, #90E0EF)', fontWeight: 800 } : undefined}
            >
              <Stethoscope size={11} />
              <span>Doctor</span>
            </button>
            <button
              className={`m3-role-btn ${currentRole === 'cashier' ? 'active' : ''}`}
              onClick={() => onRoleChange('cashier')}
              title="Cashier & Billing"
              data-tour="role-cashier-btn"
              style={currentRole === 'cashier' ? { backgroundColor: 'var(--csh-pill-bg, #d1fae5)', color: 'var(--csh-pill-color, #065f46)', border: '1px solid var(--csh-pill-border, #6ee7b7)', fontWeight: 800 } : undefined}
            >
              <Receipt size={11} />
              <span>Cashier</span>
            </button>
            <button
              className={`m3-role-btn ${currentRole === 'admin' ? 'active' : ''}`}
              onClick={() => onRoleChange('admin')}
              title="Executive Admin"
              style={currentRole === 'admin' ? { backgroundColor: 'var(--adm-pill-bg, #CAF0F8)', color: 'var(--adm-pill-color, #0077B6)', border: '1px solid var(--adm-pill-border, #90E0EF)', fontWeight: 800 } : undefined}
            >
              <ShieldCheck size={11} />
              <span>Admin</span>
            </button>
          </div>
        )}


        {/* Interactive Clinical Flow Guide Button */}
        <button
          className="m3-btn m3-btn-sm anim-hover-lift guide-start-btn"
          onClick={isGuideActive ? stopGuide : startGuide}
          title={isGuideActive ? "Close Interactive Walkthrough" : "Start Interactive Clinical Flow Guide"}
          data-tour="start-guide-btn"
          style={{ 
            height: 26, 
            fontSize: 9.5, 
            padding: '0 9px', 
            borderRadius: 9999,
            backgroundColor: 'var(--bg-subtle)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-default)',
            fontWeight: 700
          }}
        >
          <Sparkles size={11} className={isGuideActive ? "" : "m3-animate-pulse"} />
          <span>{isGuideActive ? 'Exit Guide' : 'Start Guide'}</span>
        </button>

        {onLogout && (
          <button
            className="icon-btn"
            onClick={onLogout}
            title="Sign Out / Switch Staff Account"
            aria-label="Sign Out"
            style={{ color: 'var(--destructive, #dc2626)' }}
          >
            <LogOut size={13} />
          </button>
        )}
      </div>
    </header>
  );
}

