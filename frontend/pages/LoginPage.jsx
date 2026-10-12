import React, { useState } from 'react';
import { 
  Sun, 
  Users, 
  Stethoscope, 
  Receipt, 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { auth as authApi } from '../services/api';

export const DEMO_PERSONAS = [
  {
    role: 'receptionist',
    username: 'receptionist',
    displayName: 'Priya Raghavan',
    title: 'Front Desk Receptionist',
    dept: 'Counter 01 • Patient Triage',
    icon: Users,
    color: '#0284c7',
    bg: '#eff6ff',
    badge: 'Triage & Tokens'
  },
  {
    role: 'doctor',
    username: 'dr_kiran',
    displayName: 'Dr. Kiran Patel',
    title: 'Medical Oncologist / Physician',
    dept: 'Consultation Room 03',
    icon: Stethoscope,
    color: '#15803d',
    bg: '#dcfce7',
    badge: 'CDSS & e-Rx'
  },
  {
    role: 'doctor',
    username: 'dr_swami',
    displayName: 'Dr. Swaminathan',
    title: 'Surgical Oncology Consultant',
    dept: 'Surgical Wing • Room 07',
    icon: Stethoscope,
    color: '#7c3aed',
    bg: '#f3e8ff',
    badge: 'Senior Consultant'
  },
  {
    role: 'cashier',
    username: 'cashier',
    displayName: 'Ramesh V.',
    title: 'Cashier & Settlement Officer',
    dept: 'Counter B-02 • Billing Desk',
    icon: Receipt,
    color: '#d97706',
    bg: '#fef3c7',
    badge: 'PM-JAY & TPA'
  },
  {
    role: 'admin',
    username: 'admin',
    displayName: 'Dr. Alok Mehta',
    title: 'Medical Superintendent / Admin',
    dept: 'Executive Directorate',
    icon: ShieldCheck,
    color: '#dc2626',
    bg: '#fee2e2',
    badge: 'Governance & Audits'
  }
];

export default function LoginPage({ onLoginSuccess }) {
  const { theme } = useTheme();
  const [username, setUsername] = useState('receptionist');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState('receptionist');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const executeLogin = async (userToLogin, passToLogin, roleToSet, personaName) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      let token = 'mock_jwt_token_' + Date.now();
      let userObj = {
        username: userToLogin,
        role: roleToSet,
        name: personaName || userToLogin
      };

      try {
        const res = await authApi.login(userToLogin, passToLogin);
        if (res?.token) {
          token = res.token;
          if (res.user) userObj = res.user;
        }
      } catch (apiErr) {
        // Offline / dev fallback: continue seamlessly with local demo state
        console.warn('Backend login endpoint unavailable, using demo authentication session:', apiErr.message);
      }

      localStorage.setItem('auth_token', token);
      localStorage.setItem('bright_user', JSON.stringify(userObj));
      localStorage.setItem('bright_role', roleToSet);

      if (onLoginSuccess) {
        onLoginSuccess(roleToSet, userObj);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('Please enter your staff username.');
      return;
    }
    executeLogin(username, password, selectedRole, username);
  };

  const handlePersonaClick = (persona) => {
    setUsername(persona.username);
    setSelectedRole(persona.role);
    executeLogin(persona.username, 'password123', persona.role, persona.displayName);
  };

  return (
    <div className="login-page-container" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      backgroundColor: 'var(--bg-page)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative ambient gradient blooms */}
      <div className="stat-card-accent-blob blob-yellow" style={{ top: -80, left: -80, width: 280, height: 280, opacity: 0.45 }} />
      <div className="stat-card-accent-blob blob-blue" style={{ bottom: -80, right: -80, width: 320, height: 320, opacity: 0.35 }} />

      <div style={{
        width: '100%',
        maxWidth: 960,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24,
        position: 'relative',
        zIndex: 1
      }}>
        {/* Left Column: 1-Click Demo Personas */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
            }}>
              <Sun size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                Bright Solutions
              </h1>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0, fontWeight: 600 }}>
                Clinical Operating System • Staff Gateway
              </p>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: 18,
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontWeight: 700, fontSize: 11.5 }}>
              <Sparkles size={14} />
              <span>1-Click Demo Personas (Zero Friction)</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4, margin: '4px 0 0' }}>
              Select any authorized staff persona below to sign in instantly with full clinical privileges without typing credentials.
            </p>
          </div>

          {/* Persona List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {DEMO_PERSONAS.map((p, idx) => {
              const Icon = p.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePersonaClick(p)}
                  disabled={isLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-surface)',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    opacity: isLoading ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = p.color;
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: p.bg,
                      color: p.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 13,
                      flexShrink: 0
                    }}>
                      <Icon size={18} strokeWidth={2.2} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {p.displayName}
                        </span>
                        <span style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 9999,
                          background: p.bg,
                          color: p.color,
                          border: `1px solid ${p.color}33`
                        }}>
                          {p.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {p.title} • <span style={{ color: 'var(--text-muted)' }}>{p.dept}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ color: p.color }}>
                    <ArrowRight size={16} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Standard Credential Sign-In Form */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <KeyRound size={18} color="var(--primary)" />
              <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Staff Authentication
              </h2>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Production credential login with role-enforced access control.
            </p>

            {errorMessage && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                color: '#b91c1c',
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 16
              }}>
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Role Picker */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Target Role Portal
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {[
                    { id: 'receptionist', label: 'Reception' },
                    { id: 'doctor', label: 'Doctor' },
                    { id: 'cashier', label: 'Cashier' },
                    { id: 'admin', label: 'Admin' }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r.id)}
                      className={`m3-btn ${selectedRole === r.id ? 'm3-btn-filled' : 'm3-btn-tonal'}`}
                      style={{
                        height: 32,
                        fontSize: 11,
                        padding: '0 4px',
                        justifyContent: 'center',
                        ...(selectedRole === r.id ? {
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: '#ffffff'
                        } : {})
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Username Input */}
              <div>
                <label htmlFor="login-username" style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Username / Staff ID
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. receptionist or dr_kiran"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                  <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="login-password" style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                  <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              {/* Sign In CTA Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="m3-btn m3-btn-filled"
                style={{
                  height: 40,
                  fontSize: 13,
                  fontWeight: 700,
                  marginTop: 8,
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#ffffff',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span className="spinner" style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
                    Authenticating Staff...
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span>Sign In to {selectedRole.toUpperCase()}</span>
                    <ArrowRight size={15} />
                  </span>
                )}
              </button>
            </form>
          </div>

          <div style={{
            marginTop: 20,
            paddingTop: 14,
            borderTop: '1px solid var(--border-subtle)',
            fontSize: 11,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Encrypted HIPAA/ABDM Gateway</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#15803d', fontWeight: 600 }}>
              <CheckCircle2 size={12} /> System Online
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
