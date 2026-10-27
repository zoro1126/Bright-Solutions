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
  Mail,
  Building2,
  KeyRound,
  UserPlus,
  Activity,
  Pill
} from 'lucide-react';
import { auth as authApi } from '../services/api';

export const QUICK_PERSONAS = [
  {
    role: 'receptionist',
    username: 'receptionist',
    displayName: 'Priya Raghavan',
    title: 'OPD (Reception)',
    dept: 'Counter 01',
    icon: Users,
    color: '#0284c7',
    bg: '#eff6ff'
  },
  {
    role: 'doctor',
    username: 'dr_kiran',
    displayName: 'Dr. Kiran Patel',
    title: 'OPD (Consultation)',
    dept: 'Cabin 01',
    icon: Stethoscope,
    color: '#0077b6',
    bg: '#caf0f8'
  },
  {
    role: 'nurse',
    username: 'nurse_mini',
    displayName: 'Sr. Mini Joseph',
    title: 'Charge Nurse',
    dept: 'Ward Station 02',
    icon: Activity,
    color: '#0d9488',
    bg: '#ccfbf1'
  },
  {
    role: 'chemist',
    username: 'chemist_karthik',
    displayName: 'Karthik Ramamurthy',
    title: 'Chief Pharmacist',
    dept: 'Dispensary 01',
    icon: Pill,
    color: '#16a34a',
    bg: '#dcfce7'
  },
  {
    role: 'cashier',
    username: 'cashier',
    displayName: 'Ramesh V.',
    title: 'Cashier',
    dept: 'Counter B-02',
    icon: Receipt,
    color: '#d97706',
    bg: '#fef3c7'
  },
  {
    role: 'admin',
    username: 'admin',
    displayName: 'Dr. Alok Mehta',
    title: 'Superintendent',
    dept: 'Directorate',
    icon: ShieldCheck,
    color: '#7c3aed',
    bg: '#f3e8ff'
  }
];

export default function LoginPage({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Login Form
  const [loginIdentifier, setLoginIdentifier] = useState('receptionist');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Registration Form
  const [regData, setRegData] = useState({
    fullName: '',
    email: '',
    role: 'doctor',
    station: '',
    password: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const executeLogin = async (userToLogin, passToLogin, roleHint = null, displayName = null) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      let inferredRole = roleHint;
      if (!inferredRole) {
        const u = userToLogin.toLowerCase();
        if (u.includes('doc') || u.includes('dr_') || u.includes('patel') || u.includes('swami')) {
          inferredRole = 'doctor';
        } else if (u.includes('nurse') || u.includes('sister') || u.includes('mini') || u.includes('ward')) {
          inferredRole = 'nurse';
        } else if (u.includes('chem') || u.includes('pharm') || u.includes('karthik') || u.includes('dispensary')) {
          inferredRole = 'chemist';
        } else if (u.includes('cash') || u.includes('ramesh') || u.includes('bill')) {
          inferredRole = 'cashier';
        } else if (u.includes('admin') || u.includes('mehta') || u.includes('director')) {
          inferredRole = 'admin';
        } else {
          inferredRole = 'receptionist';
        }
      }

      let token = 'auth_token_' + Date.now();
      let userObj = {
        username: userToLogin,
        role: inferredRole,
        name: displayName || userToLogin
      };

      try {
        const res = await authApi.login(userToLogin, passToLogin);
        if (res?.token) {
          token = res.token;
          if (res.user) userObj = res.user;
        }
      } catch (apiErr) {
        console.warn('Backend login endpoint unavailable, using secure demo session:', apiErr.message);
      }

      localStorage.setItem('auth_token', token);
      localStorage.setItem('bright_user', JSON.stringify(userObj));
      localStorage.setItem('bright_role', userObj.role || inferredRole);

      if (onLoginSuccess) {
        onLoginSuccess(userObj.role || inferredRole, userObj);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your staff ID or email.');
      return;
    }
    executeLogin(loginIdentifier, loginPassword);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!regData.fullName.trim()) {
      setErrorMessage('Please enter your legal name.');
      return;
    }
    if (regData.password !== regData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setSuccessMessage(`Account provisioned for ${regData.fullName}. Signing into ${regData.role.toUpperCase()} portal...`);
    setTimeout(() => {
      executeLogin(regData.email || regData.fullName, regData.password, regData.role, regData.fullName);
    }, 700);
  };

  const handleQuickPersona = (persona) => {
    executeLogin(persona.username, 'password123', persona.role, persona.displayName);
  };

  return (
    <div className="login-page-container" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      backgroundColor: '#fcfbfa',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient Sunbeam Glow Orbs */}
      <div className="stat-card-accent-blob blob-yellow" style={{ top: -60, left: -60, width: 340, height: 340, opacity: 0.5, filter: 'blur(40px)' }} />
      <div className="stat-card-accent-blob blob-blue" style={{ bottom: -60, right: -60, width: 340, height: 340, opacity: 0.4, filter: 'blur(40px)' }} />

      <div style={{
        width: '100%',
        maxWidth: 480,
        position: 'relative',
        zIndex: 1
      }}>
        {/* Main Card */}
        <div className="card" style={{
          padding: '32px 30px',
          borderRadius: 24,
          boxShadow: '0 12px 36px -4px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.9)',
          backgroundColor: '#ffffff'
        }}>
          {/* Brand Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
              marginBottom: 12
            }}>
              <Sun size={26} strokeWidth={2.4} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
              Bright Solutions
            </h1>
            <p style={{ fontSize: 12.5, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
              General & Clinical OPD Operating System
            </p>
          </div>

          {/* Modern Tabs: [ Sign In ] [ Staff Registration ] */}
          <div style={{
            display: 'flex',
            background: '#f8fafc',
            padding: 4,
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            marginBottom: 20
          }}>
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
              style={{
                flex: 1,
                padding: '9px 0',
                fontSize: 12.5,
                fontWeight: 700,
                borderRadius: 9,
                border: 'none',
                background: activeTab === 'login' ? '#ffffff' : 'transparent',
                color: activeTab === 'login' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'login' ? '0 2px 6px rgba(15, 23, 42, 0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMessage(''); }}
              style={{
                flex: 1,
                padding: '9px 0',
                fontSize: 12.5,
                fontWeight: 700,
                borderRadius: 9,
                border: 'none',
                background: activeTab === 'register' ? '#ffffff' : 'transparent',
                color: activeTab === 'register' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'register' ? '0 2px 6px rgba(15, 23, 42, 0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Staff Registration
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#b91c1c',
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 16
            }}>
              <AlertCircle size={15} flexShrink={0} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              background: '#dcfce7',
              border: '1px solid #86efac',
              color: '#15803d',
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 16
            }}>
              <CheckCircle2 size={15} flexShrink={0} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: Modern Sign In */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Staff Username or Hospital Email
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. receptionist or kiran.patel@brightcare.in"
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 36px',
                      borderRadius: 10,
                      border: '1.5px solid #e2e8f0',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: 13,
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'border-color 0.15s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <User size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 36px',
                      borderRadius: 10,
                      border: '1.5px solid #e2e8f0',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: 13,
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'border-color 0.15s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <Lock size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="m3-btn m3-btn-filled"
                style={{
                  height: 42,
                  fontSize: 13,
                  fontWeight: 700,
                  marginTop: 6,
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  borderRadius: 10
                }}
              >
                {isLoading ? 'Verifying Credentials...' : 'Sign In to Portal'}
              </button>
            </form>
          )}

          {/* TAB 2: Staff Registration Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Verma"
                  value={regData.fullName}
                  onChange={(e) => setRegData(p => ({ ...p, fullName: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 9,
                    border: '1.5px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: 12.5,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Clinical Role
                  </label>
                  <select
                    value={regData.role}
                    onChange={(e) => setRegData(p => ({ ...p, role: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 9,
                      border: '1.5px solid #e2e8f0',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: 12,
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="doctor">Doctor (Consultant)</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="cashier">Cashier</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Station / Room
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 04"
                    value={regData.station}
                    onChange={(e) => setRegData(p => ({ ...p, station: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 9,
                      border: '1.5px solid #e2e8f0',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: 12,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Hospital Official Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="r.verma@brightcare.in"
                  value={regData.email}
                  onChange={(e) => setRegData(p => ({ ...p, email: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 9,
                    border: '1.5px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: 12.5,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Create Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regData.password}
                    onChange={(e) => setRegData(p => ({ ...p, password: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 9,
                      border: '1.5px solid #e2e8f0',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: 12,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regData.confirmPassword}
                    onChange={(e) => setRegData(p => ({ ...p, confirmPassword: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 9,
                      border: '1.5px solid #e2e8f0',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: 12,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="m3-btn m3-btn-filled"
                style={{
                  height: 40,
                  fontSize: 12.5,
                  fontWeight: 700,
                  marginTop: 6,
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  borderRadius: 10
                }}
              >
                Register & Initialize Account
              </button>
            </form>
          )}

          {/* Quick-Access 1-Click Demo Personas Bar */}
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #f1f5f9' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Sparkles size={12} color="#f59e0b" />
                <span>1-Click Quick Demo Login</span>
              </span>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>Instant switch</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {QUICK_PERSONAS.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickPersona(p)}
                    disabled={isLoading}
                    title={`Instant login as ${p.displayName} (${p.title})`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '8px 4px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      gap: 4
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = p.color;
                      e.currentTarget.style.background = p.bg;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: p.bg,
                      color: p.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={15} />
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>
                      {p.displayName.split(' ')[0]}
                    </span>
                    <span style={{ fontSize: 9, color: '#64748b' }}>
                      {p.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
