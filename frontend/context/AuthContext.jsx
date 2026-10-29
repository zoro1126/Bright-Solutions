/**
 * AuthContext.jsx — TASK-FE-1.1 (D19 useAuthStore alignment)
 * Bright Solutions — JWT Auth Context
 *
 * Security contract (per D19):
 *  - Access token stored IN MEMORY only (never localStorage/sessionStorage)
 *  - Silent refresh runs every 14 min (token expires at 15 min)
 *  - HTTP-only cookie carries refresh token (set/read by server)
 *  - On page reload: attempts GET /api/v1/auth/me using cookie-based refresh first
 */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

// ─── D13 RBAC permission map ───────────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  doctor:        ['opd:read','opd:checkin','consultation:read','consultation:write','consultation:sign','patients:read','cdss:read','ipd:read','prescriptions:write','forms:read'],
  nurse:         ['opd:read','patients:read','triage:write','ipd:read','ipd:nursing_write','mar:write','vitals:write','forms:read','forms:write'],
  receptionist:  ['patients:read','patients:write','opd:read','opd:checkin','billing:read','tokens:write'],
  chemist:       ['pharmacy:read','pharmacy:dispense','patients:read','prescriptions:read'],
  cashier:       ['billing:read','billing:write','patients:read','invoices:write'],
  admin:         ['admin:read','admin:write','staff:read','staff:write','audit:read','license:read','license:write','patients:read'],
  lab_technician:['pathology:read','pathology:write','patients:read'],
  super_admin:   ['*'],  // wildcard — all permissions
};

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Token stored in module-level variable (survives re-renders, not page reload) ──
// Also exposed via window.__bsAuth.getToken() for cross-module access without circular imports.
let _memoryToken = null;

export function getMemoryToken() {
  return _memoryToken;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]                   = useState(null);
  const [role, setRole]                   = useState(null);
  const [enabledModules, setEnabledModules] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading]         = useState(true);
  const refreshTimerRef                   = useRef(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const setSession = useCallback((token, userData) => {
    _memoryToken = token;
    setUser(userData);
    setRole(userData?.role || null);
    setEnabledModules(userData?.enabled_modules || ['OPD', 'IPD', 'PHARMACY', 'PATHOLOGY', 'BILLING']);
    setIsAuthenticated(true);
    // Persist non-sensitive info for display continuity across reload
    localStorage.setItem('bright_role', userData?.role || '');
    localStorage.setItem('bright_user', JSON.stringify({ name: userData?.full_name, role: userData?.role }));
  }, []);

  const clearSession = useCallback(() => {
    _memoryToken = null;
    setUser(null);
    setRole(null);
    setEnabledModules([]);
    setIsAuthenticated(false);
    localStorage.removeItem('bright_role');
    localStorage.removeItem('bright_user');
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
  }, []);

  // ── Silent Refresh (every 14 min) ──────────────────────────────────────────
  const silentRefresh = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',   // sends HTTP-only refresh cookie
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) { clearSession(); return; }
      const data = await res.json();
      _memoryToken = data.access_token;
      // update user if server returns updated profile
      if (data.user) {
        setUser(data.user);
        setEnabledModules(data.user.enabled_modules || enabledModules);
      }
    } catch {
      // network error — keep existing token, don't force logout
    }
  }, [clearSession, enabledModules]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = setInterval(silentRefresh, 14 * 60 * 1000); // 14 minutes
  }, [silentRefresh]);

  // ── Boot: try to restore session from HTTP-only cookie ────────────────────
  useEffect(() => {
    let cancelled = false;
    async function boot() {
      setIsLoading(true);
      try {
        // Attempt silent refresh first — if HTTP-only cookie is still valid
        const refreshRes = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (refreshRes.ok && !cancelled) {
          const refreshData = await refreshRes.json();
          _memoryToken = refreshData.access_token;
          // Fetch full profile
          const meRes = await fetch('/api/v1/auth/me', {
            headers: { 'Authorization': `Bearer ${_memoryToken}` },
            credentials: 'include',
          });
          if (meRes.ok && !cancelled) {
            const meData = await meRes.json();
            setSession(_memoryToken, meData);
            scheduleRefresh();
          } else if (!cancelled) {
            clearSession();
          }
        } else if (!cancelled) {
          // No valid session — check localStorage for role hint (UI only)
          const cachedRole = localStorage.getItem('bright_role');
          if (cachedRole) setRole(cachedRole); // display hint, not authenticated
          clearSession();
        }
      } catch {
        if (!cancelled) {
          // Backend offline — partial restore from localStorage for display
          const cachedRole = localStorage.getItem('bright_role');
          if (cachedRole) {
            setRole(cachedRole);
            // Allow offline operation with localStorage-derived state
          }
          clearSession();
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    boot();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (refreshTimerRef.current) clearInterval(refreshTimerRef.current); };
  }, []);

  // ── login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    const data = await res.json();
    // Server returns: { access_token, token_type, expires_in, user, enabled_modules }
    _memoryToken = data.access_token;
    setSession(data.access_token, data.user || { role: data.role, enabled_modules: data.enabled_modules });
    scheduleRefresh();
    return data;
  }, [setSession, scheduleRefresh]);

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      if (_memoryToken) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Authorization': `Bearer ${_memoryToken}` },
        });
      }
    } catch { /* ignore */ }
    clearSession();
  }, [clearSession]);

  // ── hasPermission ─────────────────────────────────────────────────────────
  const hasPermission = useCallback((code) => {
    if (!role) return false;
    const perms = ROLE_PERMISSIONS[role] || [];
    return perms.includes('*') || perms.includes(code);
  }, [role]);

  // ── hasModule ─────────────────────────────────────────────────────────────
  const hasModule = useCallback((code) => {
    return enabledModules.includes(code);
  }, [enabledModules]);

  const value = {
    user,
    role,
    token: _memoryToken,
    enabledModules,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasPermission,
    hasModule,
    getToken: () => _memoryToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
