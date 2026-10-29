/**
 * App.jsx — Bright Solutions Clinical Management System
 * Updated for Phase FE-1: AuthProvider + Layout Shells + New Routes
 *
 * Route guard: ProtectedRoute uses window.__bsAuth bridge from AuthContext.
 * New routes added: /ipd/beds, /ipd/admissions/:id/*, /display/*, /admin/licensing,
 *                   /nurse/triage/:visitId, /unauthorized
 */
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { PatientProvider } from './context/PatientContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import ReceptionistPage from './pages/ReceptionistPage';
import DoctorPage       from './pages/DoctorPage';
import NursePage        from './pages/NursePage';
import ChemistPage      from './pages/ChemistPage';
import CashierPage      from './pages/CashierPage';
import AdminPage        from './pages/AdminPage';
import LoginPage        from './pages/LoginPage';
import UnauthorizedPage        from './pages/UnauthorizedPage';
import LicenseManagementPage   from './pages/LicenseManagementPage';
import NurseVitalsIntakePage   from './pages/NurseVitalsIntakePage';
import BedMatrixPage           from './pages/BedMatrixPage';
import WaitingRoomDisplayPage  from './pages/WaitingRoomDisplayPage';
import EdgeSyncBeacon from './components/EdgeSyncBeacon';

// ─── Auth bridge: expose auth methods to ProtectedRoute via window ─────────────
function AuthBridge({ children }) {
  const auth = useAuth();
  useEffect(() => {
    // Expose to window so ProtectedRoute (non-context) can access it
    window.__bsAuth = {
      isAuthenticated: auth.isAuthenticated,
      isLoading:       auth.isLoading,
      role:            auth.role,
      hasPermission:   auth.hasPermission,
      hasModule:       auth.hasModule,
      getToken:        auth.getToken,
    };
    return () => { window.__bsAuth = null; };
  }, [auth]);
  return children;
}

// ─── Route Guard (original-compatible, enhanced) ─────────────────────────────
function ProtectedRoute({ allowedRole, children }) {
  const location  = useLocation();
  const auth      = window.__bsAuth;
  const lsRole    = localStorage.getItem('bright_role');
  const lsToken   = localStorage.getItem('auth_token');

  // During auth loading — don't redirect yet
  if (auth?.isLoading) return null;

  // Not authenticated at all
  if (!auth?.isAuthenticated && !lsToken && !lsRole) {
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`} replace />;
  }

  const currentRole = auth?.role || lsRole;

  // Wrong role
  if (allowedRole && currentRole && allowedRole !== currentRole) {
    return <Navigate to={`/${currentRole}/dashboard`} replace />;
  }

  return children;
}

// ─── Router with all routes ───────────────────────────────────────────────────
function AppRouter() {
  const navigate = useNavigate();
  const [currentRole, setCurrentRole] = useState(() => localStorage.getItem('bright_role') || 'receptionist');

  const handleRoleChange = (role) => {
    setCurrentRole(role);
    localStorage.setItem('bright_role', role);
    navigate(`/${role}/dashboard`);
  };

  const handleLogout = async () => {
    try { await window.__bsAuth?.logout?.(); } catch {}
    localStorage.removeItem('auth_token');
    localStorage.removeItem('bright_user');
    localStorage.removeItem('bright_role');
    navigate('/login');
  };

  const mkRec = (tab) => (
    <ProtectedRoute allowedRole="receptionist">
      <ReceptionistPage currentRole="receptionist" onSwitchRole={handleRoleChange} activeSubTab={tab} onLogout={handleLogout} />
    </ProtectedRoute>
  );
  const mkDoc = (tab) => (
    <ProtectedRoute allowedRole="doctor">
      <DoctorPage currentRole="doctor" onSwitchRole={handleRoleChange} onSwitchToReception={() => handleRoleChange('receptionist')} activeSubTab={tab} onLogout={handleLogout} />
    </ProtectedRoute>
  );
  const mkNurse = (tab) => (
    <ProtectedRoute allowedRole="nurse">
      <NursePage currentRole="nurse" onSwitchRole={handleRoleChange} activeSubTab={tab} onLogout={handleLogout} />
    </ProtectedRoute>
  );
  const mkChem = (tab) => (
    <ProtectedRoute allowedRole="chemist">
      <ChemistPage currentRole="chemist" onSwitchRole={handleRoleChange} activeSubTab={tab} onLogout={handleLogout} />
    </ProtectedRoute>
  );
  const mkCash = (tab) => (
    <ProtectedRoute allowedRole="cashier">
      <CashierPage currentRole="cashier" onSwitchRole={handleRoleChange} activeSubTab={tab} onLogout={handleLogout} />
    </ProtectedRoute>
  );
  const mkAdmin = (tab) => (
    <ProtectedRoute allowedRole="admin">
      <AdminPage currentRole="admin" onSwitchRole={handleRoleChange} activeSubTab={tab} onLogout={handleLogout} />
    </ProtectedRoute>
  );

  return (
    <>
      <Routes>
        {/* ── Auth ──────────────────────────────────────────────────── */}
        <Route path="/login"        element={<LoginPage onLoginSuccess={(role) => { setCurrentRole(role); navigate(`/${role}/dashboard`); }} />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* ── Receptionist ─────────────────────────────────────────── */}
        <Route path="/receptionist"                     element={mkRec('dashboard')} />
        <Route path="/receptionist/dashboard"           element={mkRec('dashboard')} />
        <Route path="/receptionist/intake"              element={mkRec('intake')} />
        <Route path="/receptionist/intake/questionnaire" element={mkRec('pending')} />
        <Route path="/receptionist/reports"             element={mkRec('reports')} />
        <Route path="/receptionist/queue"               element={mkRec('queue')} />
        <Route path="/receptionist/pending"             element={mkRec('pending')} />
        <Route path="/receptionist/insights"            element={mkRec('insights')} />
        <Route path="/receptionist/token-queue"         element={mkRec('token-queue')} />

        {/* ── Doctor / OPD Consultation ────────────────────────────── */}
        <Route path="/doctor"                     element={mkDoc('workspace')} />
        <Route path="/doctor/dashboard"           element={mkDoc('dashboard')} />
        <Route path="/doctor/patient/:id"         element={mkDoc('dossier')} />
        <Route path="/doctor/viewer/:visitId"     element={mkDoc('viewer')} />
        <Route path="/doctor/consultation/:visitId" element={mkDoc('workspace')} />

        {/* ── Nurse ────────────────────────────────────────────────── */}
        <Route path="/nurse"              element={mkNurse('ward')} />
        <Route path="/nurse/dashboard"    element={mkNurse('ward')} />
        <Route path="/nurse/ward"         element={mkNurse('ward')} />
        <Route path="/nurse/mar"          element={mkNurse('mar')} />
        <Route path="/nurse/vitals"       element={mkNurse('vitals')} />
        <Route path="/nurse/tasks"        element={mkNurse('tasks')} />
        <Route path="/nurse/sos"          element={mkNurse('sos')} />
        {/* FE-2.3: Triage vitals standalone page */}
        <Route path="/nurse/triage/:visitId" element={
          <ProtectedRoute allowedRole="nurse">
            <NurseVitalsIntakePage />
          </ProtectedRoute>
        } />

        {/* ── IPD (FE-3.x) ─────────────────────────────────────────── */}
        <Route path="/ipd/beds" element={
          <ProtectedRoute>
            <BedMatrixPage />
          </ProtectedRoute>
        } />
        <Route path="/ipd/admissions/:id/folio" element={
          <ProtectedRoute>
            {/* Placeholder — InpatientFolioPage to be implemented in FE-4.x */}
            <div style={{ padding: 32, color: '#334155', fontSize: 16 }}>
              📋 Inpatient Folio — Coming in FE-4 (Phase 4)
            </div>
          </ProtectedRoute>
        } />
        <Route path="/ipd/admissions/:id/discharge" element={
          <ProtectedRoute>
            <div style={{ padding: 32, color: '#334155', fontSize: 16 }}>
              🏥 Discharge Summary — Coming in FE-5
            </div>
          </ProtectedRoute>
        } />

        {/* ── Billing / Settlement ─────────────────────────────────── */}
        <Route path="/billing/ipd-settlement/:admissionId" element={
          <ProtectedRoute allowedRole="cashier">
            <div style={{ padding: 32, color: '#334155', fontSize: 16 }}>
              💰 IPD Settlement — Coming in FE-5
            </div>
          </ProtectedRoute>
        } />

        {/* ── Chemist / Pharmacy ───────────────────────────────────── */}
        <Route path="/chemist"              element={mkChem('queue')} />
        <Route path="/chemist/dashboard"    element={mkChem('queue')} />
        <Route path="/chemist/queue"        element={mkChem('queue')} />
        <Route path="/chemist/dispense"     element={mkChem('dispense')} />
        <Route path="/chemist/generics"     element={mkChem('generics')} />
        <Route path="/chemist/inventory"    element={mkChem('inventory')} />

        {/* ── Cashier ──────────────────────────────────────────────── */}
        <Route path="/cashier"                      element={mkCash('dashboard')} />
        <Route path="/cashier/dashboard"            element={mkCash('dashboard')} />
        <Route path="/cashier/billing/:visitId"     element={mkCash('billing')} />
        <Route path="/cashier/receipt/:billId"      element={mkCash('receipt')} />

        {/* ── Admin ────────────────────────────────────────────────── */}
        <Route path="/admin"              element={mkAdmin('dashboard')} />
        <Route path="/admin/dashboard"    element={mkAdmin('dashboard')} />
        <Route path="/admin/staff"        element={mkAdmin('staff')} />
        <Route path="/admin/audit-logs"   element={mkAdmin('audit')} />
        {/* FE-1.4: License management */}
        <Route path="/admin/licensing" element={
          <ProtectedRoute allowedRole="admin">
            <LicenseManagementPage />
          </ProtectedRoute>
        } />

        {/* ── Public Display (no auth) ──────────────────────────────── */}
        <Route path="/display/waiting-room" element={<WaitingRoomDisplayPage />} />
        <Route path="/display/ward-matrix"  element={
          <div style={{ background: '#0F172A', minHeight: '100vh', padding: 32, color: '#94A3B8' }}>
            Ward Matrix Display — Coming in FE-6
          </div>
        } />

        {/* ── Fallback ──────────────────────────────────────────────── */}
        <Route path="*" element={
          localStorage.getItem('auth_token') || localStorage.getItem('bright_role') ? (
            <Navigate to={`/${localStorage.getItem('bright_role') || 'receptionist'}/dashboard`} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>

      {/* EdgeSyncBeacon — shown on all authenticated pages */}
      {(localStorage.getItem('bright_role') || window.__bsAuth?.isAuthenticated) && <EdgeSyncBeacon />}
    </>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PatientProvider>
          <BrowserRouter>
            <AuthBridge>
              <AppRouter />
            </AuthBridge>
          </BrowserRouter>
        </PatientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
