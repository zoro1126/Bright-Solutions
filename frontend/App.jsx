/**
 * App.jsx — Bright Solutions Clinical Management System
 *
 * Department-based routing:
 *   /opd  →  OPD (Reception + Consultation + Nurse Triage + Chemist + Cashier)
 *   /ipd  →  IPD (Bed Matrix + Admissions + Nursing + Discharge)
 *   /admin → Admin Governance
 *   /display/* → Public unauthenticated TV displays
 *   /login → Auth
 */
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { PatientProvider } from './context/PatientContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import ReceptionistPage from './pages/ReceptionistPage';
import DoctorPage from './pages/DoctorPage';
import NursePage from './pages/NursePage';
import ChemistPage from './pages/ChemistPage';
import CashierPage from './pages/CashierPage';
import AdminPage from './pages/AdminPage';
import IPDPage from './pages/IPDPage';
import NurseVitalsIntakePage from './pages/NurseVitalsIntakePage';
import BedMatrixPage from './pages/BedMatrixPage';
import WaitingRoomDisplayPage from './pages/WaitingRoomDisplayPage';
import WardPublicBoardPage from './pages/WardPublicBoardPage';
import LicenseManagementPage from './pages/LicenseManagementPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import EdgeSyncBeacon from './components/EdgeSyncBeacon';
import IpdSettlementPage from './pages/IpdSettlementPage';
import DischargeSummaryPage from './pages/DischargeSummaryPage';
import GlobalKeyboardShortcuts from './components/GlobalKeyboardShortcuts';
import ErrorBoundary from './components/ErrorBoundary';

// ─── Auth bridge ──────────────────────────────────────────────────────────────
function AuthBridge({ children }) {
  const auth = useAuth();
  useEffect(() => {
    window.__bsAuth = {
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading,
      role: auth.role,
      hasPermission: auth.hasPermission,
      hasModule: auth.hasModule,
      getToken: auth.getToken,
    };
    return () => { window.__bsAuth = null; };
  }, [auth]);
  return children;
}

// ─── Simple auth guard ────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const location = useLocation();
  const hasToken =
    localStorage.getItem('auth_token') || localStorage.getItem('bright_role');

  if (!hasToken) {
    return (
      <Navigate
        to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }
  return children;
}

// ─── Main Router ──────────────────────────────────────────────────────────────
function AppRouter() {
  const navigate = useNavigate();
  const [currentRole, setCurrentRole] = useState(
    () => localStorage.getItem('bright_role') || 'receptionist'
  );

  const handleLogout = async () => {
    try { await window.__bsAuth?.logout?.(); } catch {}
    localStorage.removeItem('auth_token');
    localStorage.removeItem('bright_user');
    localStorage.removeItem('bright_role');
    navigate('/login');
  };

  /**
   * handleDeptSwitch — called when user clicks OPD/IPD/Admin tabs in Navbar.
   * Navigates to the primary route for that department.
   */
  const handleDeptSwitch = (dept) => {
    if (dept === 'IPD') {
      navigate('/ipd');
    } else if (dept === 'ADMIN') {
      navigate('/admin/dashboard');
    } else {
      // OPD — go to last OPD role, default receptionist
      const role = localStorage.getItem('bright_role') || 'receptionist';
      const opdRoles = ['receptionist', 'doctor', 'nurse', 'chemist', 'cashier'];
      if (opdRoles.includes(role)) {
        navigate(`/${role}/dashboard`);
      } else {
        navigate('/receptionist/dashboard');
      }
    }
  };

  // Legacy role change — still needed by internal page callbacks
  const handleRoleChange = (role) => {
    setCurrentRole(role);
    localStorage.setItem('bright_role', role);
    navigate(`/${role}/dashboard`);
  };

  // ── Helpers to build page elements ──
  const mkRec = (tab) => (
    <ProtectedRoute>
      <ReceptionistPage
        currentRole="receptionist"
        onSwitchRole={handleRoleChange}
        activeSubTab={tab}
        onLogout={handleLogout}
      />
    </ProtectedRoute>
  );

  const mkDoc = (tab) => (
    <ProtectedRoute>
      <DoctorPage
        currentRole="doctor"
        onSwitchRole={handleRoleChange}
        onSwitchToReception={() => handleRoleChange('receptionist')}
        activeSubTab={tab}
        onLogout={handleLogout}
      />
    </ProtectedRoute>
  );

  const mkNurse = (tab) => (
    <ProtectedRoute>
      <NursePage
        currentRole="nurse"
        onSwitchRole={handleRoleChange}
        activeSubTab={tab}
        onLogout={handleLogout}
      />
    </ProtectedRoute>
  );

  const mkChem = (tab) => (
    <ProtectedRoute>
      <ChemistPage
        currentRole="chemist"
        onSwitchRole={handleRoleChange}
        activeSubTab={tab}
        onLogout={handleLogout}
      />
    </ProtectedRoute>
  );

  const mkCash = (tab) => (
    <ProtectedRoute>
      <CashierPage
        currentRole="cashier"
        onSwitchRole={handleRoleChange}
        activeSubTab={tab}
        onLogout={handleLogout}
      />
    </ProtectedRoute>
  );

  const mkAdmin = (tab) => (
    <ProtectedRoute>
      <AdminPage
        currentRole="admin"
        onSwitchRole={handleRoleChange}
        activeSubTab={tab}
        onLogout={handleLogout}
      />
    </ProtectedRoute>
  );

  const mkIPD = () => (
    <ProtectedRoute>
      <IPDPage onSwitchDept={handleDeptSwitch} onLogout={handleLogout} />
    </ProtectedRoute>
  );

  return (
    <>
      <GlobalKeyboardShortcuts />
      <ErrorBoundary label="application">
      <Routes>
        {/* ── Auth ──────────────────────────────────────────────────────── */}
        <Route
          path="/login"
          element={
            <LoginPage
              onLoginSuccess={(role) => {
                setCurrentRole(role);
                // Nurse → IPD department; all others → their OPD role page
                if (role === 'nurse') {
                  navigate('/ipd');
                } else {
                  navigate(`/${role}/dashboard`);
                }
              }}
            />
          }
        />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* ── Root redirect ─────────────────────────────────────────────── */}
        <Route
          path="/"
          element={
            localStorage.getItem('auth_token') || localStorage.getItem('bright_role') ? (
              <Navigate
                to={`/${localStorage.getItem('bright_role') || 'receptionist'}/dashboard`}
                replace
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ═══════════════════════════════════════════════════════════════
            OPD DEPARTMENT
            All OPD roles share the top OPD tab in Navbar.
        ════════════════════════════════════════════════════════════════ */}

        {/* Reception / Front Desk */}
        <Route path="/receptionist"                      element={mkRec('dashboard')} />
        <Route path="/receptionist/dashboard"            element={mkRec('dashboard')} />
        <Route path="/receptionist/token-queue"          element={mkRec('token-queue')} />
        <Route path="/receptionist/queue"                element={mkRec('queue')} />
        <Route path="/receptionist/intake"               element={mkRec('intake')} />
        <Route path="/receptionist/reports"              element={mkRec('reports')} />
        <Route path="/receptionist/pending"              element={mkRec('pending')} />
        <Route path="/receptionist/insights"             element={mkRec('insights')} />

        {/* Doctor Consultation */}
        <Route path="/doctor"                           element={mkDoc('workspace')} />
        <Route path="/doctor/dashboard"                 element={mkDoc('dashboard')} />
        <Route path="/doctor/consultation/:visitId"     element={mkDoc('workspace')} />
        <Route path="/doctor/patient/:id"               element={mkDoc('dossier')} />
        <Route path="/doctor/viewer/:visitId"           element={mkDoc('viewer')} />

        {/* Nurse Triage Vitals (OPD side) */}
        <Route
          path="/nurse/triage/:visitId"
          element={
            <ProtectedRoute>
              <NurseVitalsIntakePage />
            </ProtectedRoute>
          }
        />
        <Route path="/nurse"            element={mkNurse('ward')} />
        <Route path="/nurse/dashboard"  element={mkNurse('ward')} />
        <Route path="/nurse/ward"       element={mkNurse('ward')} />
        <Route path="/nurse/mar"        element={mkNurse('mar')} />
        <Route path="/nurse/vitals"     element={mkNurse('vitals')} />
        <Route path="/nurse/tasks"      element={mkNurse('tasks')} />
        <Route path="/nurse/sos"        element={mkNurse('sos')} />

        {/* Chemist / Pharmacy */}
        <Route path="/chemist"           element={mkChem('queue')} />
        <Route path="/chemist/dashboard" element={mkChem('queue')} />
        <Route path="/chemist/queue"     element={mkChem('queue')} />
        <Route path="/chemist/dispense"  element={mkChem('dispense')} />
        <Route path="/chemist/generics"  element={mkChem('generics')} />
        <Route path="/chemist/inventory" element={mkChem('inventory')} />

        {/* Cashier */}
        <Route path="/cashier"                      element={mkCash('dashboard')} />
        <Route path="/cashier/dashboard"            element={mkCash('dashboard')} />
        <Route path="/cashier/billing/:visitId"     element={mkCash('billing')} />
        <Route path="/cashier/receipt/:billId"      element={mkCash('receipt')} />

        {/* ═══════════════════════════════════════════════════════════════
            IPD DEPARTMENT
            Single IPDPage shell with internal tab navigation.
        ════════════════════════════════════════════════════════════════ */}
        <Route path="/ipd"                               element={mkIPD()} />
        <Route path="/ipd/beds"                          element={mkIPD()} />
        <Route path="/ipd/admissions"                    element={mkIPD()} />
        <Route path="/ipd/admissions/:id/folio"          element={mkIPD()} />
        <Route path="/ipd/nursing"                       element={mkIPD()} />
        <Route path="/ipd/discharge"                     element={mkIPD()} />

        {/* Billing IPD Settlement */}
        <Route path="/billing/ipd-settlement/:admissionId" element={<ProtectedRoute><IpdSettlementPage /></ProtectedRoute>} />
        <Route path="/ipd/admissions/:id/discharge" element={<ProtectedRoute><DischargeSummaryPage /></ProtectedRoute>} />

        {/* ═══════════════════════════════════════════════════════════════
            ADMIN DEPARTMENT
        ════════════════════════════════════════════════════════════════ */}
        <Route path="/admin"              element={mkAdmin('dashboard')} />
        <Route path="/admin/dashboard"    element={mkAdmin('dashboard')} />
        <Route path="/admin/staff"        element={mkAdmin('staff')} />
        <Route path="/admin/audit-logs"   element={mkAdmin('audit')} />
        <Route path="/admin/licensing"    element={mkAdmin('licensing')} />

        {/* ═══════════════════════════════════════════════════════════════
            PUBLIC DISPLAY (no auth)
        ════════════════════════════════════════════════════════════════ */}
        <Route path="/display/waiting-room" element={<WaitingRoomDisplayPage />} />
        <Route path="/display/ward-matrix" element={<WardPublicBoardPage />} />

        {/* ── Catch-all fallback ────────────────────────────────────────── */}
        <Route
          path="*"
          element={
            localStorage.getItem('auth_token') ||
            localStorage.getItem('bright_role') ? (
              <Navigate
                to={`/${localStorage.getItem('bright_role') || 'receptionist'}/dashboard`}
                replace
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
      </ErrorBoundary>

      {/* EdgeSyncBeacon — persistent on all authenticated screens */}
      {(localStorage.getItem('bright_role') ||
        window.__bsAuth?.isAuthenticated) && <EdgeSyncBeacon />}
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
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
