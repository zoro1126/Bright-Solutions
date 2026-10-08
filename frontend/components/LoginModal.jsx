import React, { useState, useEffect } from 'react';
import { LogIn, UserCheck, Shield, Key, Stethoscope, CreditCard, Sparkles, AlertCircle, Sun } from 'lucide-react';
import { loginUser, fetchAuthUsers } from '../services/api';

export default function LoginModal({
  isOpen,
  onLoginSuccess,
  onClose
}) {
  const [username, setUsername] = useState('receptionist_anita');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);

  useEffect(() => {
    async function loadUsers() {
      const users = await fetchAuthUsers();
      setAvailableUsers(users);
    }
    loadUsers();
  }, []);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await loginUser(username, password);
      onLoginSuccess(res.user, res.token);
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (user) => {
    setUsername(user.username);
    setPassword('password123');
    setLoading(true);
    setError(null);
    try {
      const res = await loginUser(user.username, 'password123');
      onLoginSuccess(res.user, res.token);
    } catch (err) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'DOCTOR': return <Stethoscope size={16} color="var(--navy-900)" />;
      case 'RECEPTIONIST': return <UserCheck size={16} color="var(--yellow-600)" />;
      case 'CASHIER': return <CreditCard size={16} color="var(--emerald-600)" />;
      case 'ADMIN': return <Shield size={16} color="var(--red-600)" />;
      default: return <UserCheck size={16} />;
    }
  };

  return (
    <div className="modal-overlay">
      <div 
        className="modal-content" 
        style={{ maxWidth: '640px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <div className="modal-title-icon">
              <Sun size={24} strokeWidth={2.4} />
            </div>
            <div>
              <h2>Bright Solutions Staff Portal</h2>
              <p>Role-Based Authentication for OPD Reception, Physicians, & Admin</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {error && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #F87171',
              color: '#B91C1C',
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Persona 1-Click Cards */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--navy-900)',
              marginBottom: '0.65rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <Sparkles size={16} color="var(--yellow-600)" />
              <span>1-Click Demo Persona Sign In:</span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.65rem'
            }}>
              {availableUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => handleQuickLogin(u)}
                  style={{
                    background: username === u.username ? 'var(--yellow-100)' : 'var(--navy-50)',
                    border: username === u.username ? '2px solid var(--yellow-500)' : '1px solid var(--border-light)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    transition: 'all 150ms ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getRoleIcon(u.role)}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--navy-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.full_name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {u.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1.25rem 0',
            color: 'var(--text-muted)',
            fontSize: '0.78rem'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
            <span style={{ padding: '0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Or Enter Credentials Manually
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Staff Username</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. receptionist_anita or dr_kulkarni"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Staff Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading}
            >
              <LogIn size={18} />
              <span>{loading ? 'Authenticating...' : 'Sign In to Bright Solutions'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
