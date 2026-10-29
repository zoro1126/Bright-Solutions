/**
 * ProtectedRoute.jsx — TASK-FE-1.6 (D15 §4 Guard Pipeline)
 *
 * Guard pipeline (in order):
 *  1. AuthGuard    — not authenticated → /login?returnUrl=
 *  2. RoleGuard    — wrong role → /{correct_role}/dashboard
 *  3. ModuleGuard  — module not licensed → /unauthorized?reason=MODULE_NOT_LICENSED
 *  4. PermGuard    — permission denied → /unauthorized?reason=PERMISSION_DENIED
 *
 * Falls back to localStorage `bright_role` if AuthContext is still loading
 * (prevents flash-redirect on page reload during boot).
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// Lazy import to avoid circular dep issues at module parse time
let _useAuth = null;
function getUseAuth() {
  if (!_useAuth) {
    try {
      _useAuth = require('../context/AuthContext.jsx').useAuth;
    } catch {
      _useAuth = null;
    }
  }
  return _useAuth;
}

export default function ProtectedRoute({
  children,
  allowedRole,
  requiredPermission,
  requiredModule,
}) {
  const location = useLocation();

  // Try to use AuthContext; fall back to localStorage during hydration
  let isAuthenticated = false;
  let isLoading       = false;
  let role            = null;
  let hasPermission   = () => true;
  let hasModule       = () => true;

  try {
    // Dynamic import avoids circular dep crash if AuthContext not yet wrapped
    const useAuth = React.useContext(
      React.lazy ? null : null // placeholder — see below
    );
    // We use a workaround: import is at module level in App.jsx which wraps everything
    // So here we read from window.__bsAuth if available (set by AuthContext on change)
    const auth = window.__bsAuth;
    if (auth) {
      isAuthenticated = auth.isAuthenticated;
      isLoading       = auth.isLoading;
      role            = auth.role;
      hasPermission   = auth.hasPermission || (() => true);
      hasModule       = auth.hasModule     || (() => true);
    }
  } catch { /* ignore */ }

  // Fallback to localStorage if auth context not yet ready
  if (!role) {
    role = localStorage.getItem('bright_role');
    isAuthenticated = !!(localStorage.getItem('bright_role') && localStorage.getItem('auth_token'));
  }

  // Still loading — show nothing (prevents flash redirect)
  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0F172A',
        fontSize: 14, color: '#64748B', fontWeight: 600,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid #06B6D4', borderTopColor: 'transparent',
            animation: 'prSpin 0.8s linear infinite',
            margin: '0 auto 12px',
          }} />
          Authenticating…
        </div>
        <style>{`@keyframes prSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // 1. AuthGuard
  const returnUrl = encodeURIComponent(location.pathname + location.search);
  if (!isAuthenticated && !role) {
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }

  // 2. RoleGuard
  if (allowedRole && role && allowedRole !== role) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  // 3. ModuleGuard
  if (requiredModule && !hasModule(requiredModule)) {
    return <Navigate to={`/unauthorized?reason=MODULE_NOT_LICENSED&module=${requiredModule}`} replace />;
  }

  // 4. PermissionGuard
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={`/unauthorized?reason=PERMISSION_DENIED&permission=${requiredPermission}`} replace />;
  }

  return children;
}

