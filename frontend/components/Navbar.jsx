import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useWalkthrough } from '../context/WalkthroughContext';
import { Sun, Moon, Menu, Stethoscope, Users, Receipt, ShieldCheck, LogOut, Sparkles } from 'lucide-react';

export default function Navbar({ onToggleSidebar, currentRole = 'receptionist', onRoleChange, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const { isGuideActive, startGuide, stopGuide } = useWalkthrough();

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
            <span className="brand-title-text" style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {currentRole === 'doctor' 
                ? 'Oncologist Clinical Workspace' 
                : currentRole === 'cashier'
                ? 'Cashier & Settlement Desk'
                : currentRole === 'admin'
                ? 'Executive Governance'
                : 'Reception Desk'}
            </span>
            <span className="brand-counter-pill" style={{ fontSize: 8.5, fontWeight: 600, background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: 'none', padding: '1px 5px' }}>
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
        {/* Role Switcher Segmented Control */}
        {onRoleChange && (
          <div className="m3-role-switcher">
            <button
              className={`m3-role-btn ${currentRole === 'receptionist' ? 'active' : ''}`}
              onClick={() => onRoleChange('receptionist')}
              title="Reception Desk"
              data-tour="role-receptionist-btn"
            >
              <Users size={11} />
              <span>Receptionist</span>
            </button>
            <button
              className={`m3-role-btn ${currentRole === 'doctor' ? 'active' : ''}`}
              onClick={() => onRoleChange('doctor')}
              title="Oncologist Workspace"
              data-tour="role-doctor-btn"
            >
              <Stethoscope size={11} />
              <span>Doctor</span>
            </button>
            <button
              className={`m3-role-btn ${currentRole === 'cashier' ? 'active' : ''}`}
              onClick={() => onRoleChange('cashier')}
              title="Cashier & Billing"
              data-tour="role-cashier-btn"
            >
              <Receipt size={11} />
              <span>Cashier</span>
            </button>
            <button
              className={`m3-role-btn ${currentRole === 'admin' ? 'active' : ''}`}
              onClick={() => onRoleChange('admin')}
              title="Executive Admin"
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
          style={{ height: 24, fontSize: 9.5, padding: '0 8px', borderRadius: 9999 }}
        >
          <Sparkles size={11} className={isGuideActive ? "" : "m3-animate-pulse"} />
          <span>{isGuideActive ? 'Exit Guide' : 'Start Guide'}</span>
        </button>

        <button
          className="icon-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
        </button>

        {onLogout && (
          <button
            className="icon-btn"
            onClick={onLogout}
            title="Sign Out / Switch Staff Account"
            aria-label="Sign Out"
            style={{ color: '#b91c1c' }}
          >
            <LogOut size={13} />
          </button>
        )}
      </div>
    </header>
  );
}

