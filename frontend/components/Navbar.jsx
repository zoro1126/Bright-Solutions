import React from 'react';
import { 
  Sun, Stethoscope, Palette, LogOut, UserCheck, 
  LayoutDashboard, Users 
} from 'lucide-react';

export default function Navbar({
  healthStatus,
  currentUser,
  activeTab,
  onTabChange,
  currentPaletteName,
  onOpenPaletteModal,
  onOpenLoginModal,
  onLogout
}) {
  const isOnline = healthStatus?.status === 'healthy';

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand Section */}
        <div className="brand-section">
          <div className="brand-icon-wrapper">
            <Sun size={26} strokeWidth={2.4} />
          </div>
          <div>
            <div className="brand-title">
              Bright<span className="brand-accent">Solutions</span>
              <span className="brand-badge">OPD Suite</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
              <Stethoscope size={13} color="var(--yellow-400)" />
              <span>Outpatient Department & Clinical Triage</span>
            </div>
          </div>
        </div>

        {/* Center Tabs: Dashboard & Queue - Yellow as Active Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '0.35rem',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          <button
            type="button"
            onClick={() => onTabChange('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.1rem',
              borderRadius: '7px',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'dashboard' ? 700 : 500,
              cursor: 'pointer',
              border: activeTab === 'dashboard' ? '1px solid var(--yellow-500)' : 'none',
              transition: 'all 150ms ease',
              background: activeTab === 'dashboard' ? 'var(--yellow-400)' : 'transparent',
              color: activeTab === 'dashboard' ? '#051A30' : '#E2E8F0',
              boxShadow: activeTab === 'dashboard' ? '0 2px 10px var(--yellow-glow-strong)' : 'none'
            }}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('queue')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.1rem',
              borderRadius: '7px',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'queue' ? 700 : 500,
              cursor: 'pointer',
              border: activeTab === 'queue' ? '1px solid var(--yellow-500)' : 'none',
              transition: 'all 150ms ease',
              background: activeTab === 'queue' ? 'var(--yellow-400)' : 'transparent',
              color: activeTab === 'queue' ? '#051A30' : '#E2E8F0',
              boxShadow: activeTab === 'queue' ? '0 2px 10px var(--yellow-glow-strong)' : 'none'
            }}
          >
            <Users size={16} />
            <span>OPD Queue & Intake</span>
          </button>
        </div>

        {/* Right Section: Palette Switcher, Health, User Profile */}
        <div className="navbar-actions">
          {/* Live Palette Switcher Button */}
          <button
            type="button"
            className="btn btn-sm"
            onClick={onOpenPaletteModal}
            style={{
              background: 'var(--yellow-400)',
              border: '1.5px solid var(--yellow-500)',
              color: '#051A30',
              gap: '0.45rem',
              fontWeight: 700,
              boxShadow: '0 2px 8px var(--yellow-glow)'
            }}
            title="Switch color themes live (Yellow Primary)"
          >
            <Palette size={15} />
            <span>Theme: {currentPaletteName?.split('&')[0]?.trim() || 'Theme'}</span>
          </button>

          {/* Health Status Pill */}
          <div className="health-pill" title={healthStatus?.database ? `DB: ${healthStatus.database}` : 'Checking server'}>
            <span className={`health-dot ${isOnline ? '' : 'offline'}`} />
            <span style={{ fontSize: '0.78rem' }}>{isOnline ? 'FastAPI 8000' : 'Offline'}</span>
          </div>

          {/* User Persona Profile */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div 
                className="user-badge" 
                onClick={onOpenLoginModal}
                style={{ cursor: 'pointer' }}
                title="Click to switch persona"
              >
                <div className="user-avatar">
                  {currentUser.full_name?.charAt(0) || 'U'}
                </div>
                <div className="user-details">
                  <span className="user-name">{currentUser.full_name}</span>
                  <span className="user-role">
                    {currentUser.role} • Switch
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#94A3B8',
                  borderRadius: '8px',
                  padding: '0.45rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 150ms ease'
                }}
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              onClick={onOpenLoginModal}
            >
              <UserCheck size={15} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
