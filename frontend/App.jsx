import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { PatientProvider } from './context/PatientContext';
import ReceptionistPage from './pages/ReceptionistPage';
import DoctorPage from './pages/DoctorPage';
import NursePage from './pages/NursePage';
import ChemistPage from './pages/ChemistPage';
import CashierPage from './pages/CashierPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';

// Route Guard wrapper
function ProtectedRoute({ allowedRole, children }) {
  const currentRole = localStorage.getItem('bright_role');
  const token = localStorage.getItem('auth_token');

  if (!token && !currentRole) {
    return <Navigate to="/login" replace />;
  }

  // If role is strictly restricted and doesn't match, redirect to user's assigned role
  if (allowedRole && currentRole && allowedRole !== currentRole) {
    return <Navigate to={`/${currentRole}/dashboard`} replace />;
  }

  return children;
}

function RoleRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('bright_role') || 'receptionist';
  });

  const handleRoleChange = (role) => {
    setCurrentRole(role);
    localStorage.setItem('bright_role', role);
    navigate(`/${role}/dashboard`);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('bright_user');
    localStorage.removeItem('bright_role');
    navigate('/login');
  };

  return (
    <Routes>
        {/* P-00 Staff Gateway & Role Login */}
        <Route 
          path="/login" 
          element={
            <LoginPage 
              onLoginSuccess={(role) => {
                setCurrentRole(role);
                navigate(`/${role}/dashboard`);
              }} 
            />
          } 
        />

        {/* RECEPTIONIST PORTAL (P-REC-01 to P-REC-05) */}
        <Route 
          path="/receptionist" 
          element={
            <ProtectedRoute allowedRole="receptionist">
              <ReceptionistPage 
                currentRole="receptionist" 
                onSwitchRole={handleRoleChange} 
                activeSubTab="dashboard"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/receptionist/dashboard" 
          element={
            <ProtectedRoute allowedRole="receptionist">
              <ReceptionistPage 
                currentRole="receptionist" 
                onSwitchRole={handleRoleChange} 
                activeSubTab="dashboard"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/receptionist/intake" 
          element={
            <ProtectedRoute allowedRole="receptionist">
              <ReceptionistPage 
                currentRole="receptionist" 
                onSwitchRole={handleRoleChange} 
                activeSubTab="intake"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/receptionist/intake/questionnaire" 
          element={
            <ProtectedRoute allowedRole="receptionist">
              <ReceptionistPage 
                currentRole="receptionist" 
                onSwitchRole={handleRoleChange} 
                activeSubTab="pending"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/receptionist/reports" 
          element={
            <ProtectedRoute allowedRole="receptionist">
              <ReceptionistPage 
                currentRole="receptionist" 
                onSwitchRole={handleRoleChange} 
                activeSubTab="reports"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/receptionist/queue" 
          element={
            <ProtectedRoute allowedRole="receptionist">
              <ReceptionistPage 
                currentRole="receptionist" 
                onSwitchRole={handleRoleChange} 
                activeSubTab="queue"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/receptionist/pending" 
          element={
            <ProtectedRoute allowedRole="receptionist">
              <ReceptionistPage 
                currentRole="receptionist" 
                onSwitchRole={handleRoleChange} 
                activeSubTab="pending"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/receptionist/insights" 
          element={
            <ProtectedRoute allowedRole="receptionist">
              <ReceptionistPage 
                currentRole="receptionist" 
                onSwitchRole={handleRoleChange} 
                activeSubTab="insights"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />

        {/* OPD (CONSULTATION) PORTAL (P-DOC-01 to P-DOC-04) */}
        <Route 
          path="/doctor" 
          element={
            <ProtectedRoute allowedRole="doctor">
              <DoctorPage 
                currentRole="doctor" 
                onSwitchRole={handleRoleChange} 
                onSwitchToReception={() => handleRoleChange('receptionist')}
                activeSubTab="workspace"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/doctor/dashboard" 
          element={
            <ProtectedRoute allowedRole="doctor">
              <DoctorPage 
                currentRole="doctor" 
                onSwitchRole={handleRoleChange} 
                onSwitchToReception={() => handleRoleChange('receptionist')}
                activeSubTab="dashboard"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/doctor/patient/:id" 
          element={
            <ProtectedRoute allowedRole="doctor">
              <DoctorPage 
                currentRole="doctor" 
                onSwitchRole={handleRoleChange} 
                onSwitchToReception={() => handleRoleChange('receptionist')}
                activeSubTab="dossier"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/doctor/viewer/:visitId" 
          element={
            <ProtectedRoute allowedRole="doctor">
              <DoctorPage 
                currentRole="doctor" 
                onSwitchRole={handleRoleChange} 
                onSwitchToReception={() => handleRoleChange('receptionist')}
                activeSubTab="viewer"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/doctor/consultation/:visitId" 
          element={
            <ProtectedRoute allowedRole="doctor">
              <DoctorPage 
                currentRole="doctor" 
                onSwitchRole={handleRoleChange} 
                onSwitchToReception={() => handleRoleChange('receptionist')}
                activeSubTab="workspace"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />

        {/* NURSE PORTAL (Inpatient Ward, MAR, NEWS2, Tasks) */}
        <Route 
          path="/nurse" 
          element={
            <ProtectedRoute allowedRole="nurse">
              <NursePage 
                currentRole="nurse" 
                onSwitchRole={handleRoleChange} 
                activeSubTab="ward"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/nurse/dashboard" 
          element={
            <ProtectedRoute allowedRole="nurse">
              <NursePage 
                currentRole="nurse" 
                onSwitchRole={handleRoleChange} 
                activeSubTab="ward"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/nurse/ward" 
          element={
            <ProtectedRoute allowedRole="nurse">
              <NursePage 
                currentRole="nurse" 
                onSwitchRole={handleRoleChange} 
                activeSubTab="ward"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/nurse/mar" 
          element={
            <ProtectedRoute allowedRole="nurse">
              <NursePage 
                currentRole="nurse" 
                onSwitchRole={handleRoleChange} 
                activeSubTab="mar"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/nurse/vitals" 
          element={
            <ProtectedRoute allowedRole="nurse">
              <NursePage 
                currentRole="nurse" 
                onSwitchRole={handleRoleChange} 
                activeSubTab="vitals"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/nurse/tasks" 
          element={
            <ProtectedRoute allowedRole="nurse">
              <NursePage 
                currentRole="nurse" 
                onSwitchRole={handleRoleChange} 
                activeSubTab="tasks"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/nurse/sos" 
          element={
            <ProtectedRoute allowedRole="nurse">
              <NursePage 
                currentRole="nurse" 
                onSwitchRole={handleRoleChange} 
                activeSubTab="sos"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />

        {/* CHEMIST / PHARMACY PORTAL (e-Rx, Dispense, WHO Generics, Stock) */}
        <Route 
          path="/chemist" 
          element={
            <ProtectedRoute allowedRole="chemist">
              <ChemistPage 
                currentRole="chemist" 
                onSwitchRole={handleRoleChange} 
                activeSubTab="queue"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chemist/dashboard" 
          element={
            <ProtectedRoute allowedRole="chemist">
              <ChemistPage 
                currentRole="chemist" 
                onSwitchRole={handleRoleChange} 
                activeSubTab="queue"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chemist/queue" 
          element={
            <ProtectedRoute allowedRole="chemist">
              <ChemistPage 
                currentRole="chemist" 
                onSwitchRole={handleRoleChange} 
                activeSubTab="queue"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chemist/dispense" 
          element={
            <ProtectedRoute allowedRole="chemist">
              <ChemistPage 
                currentRole="chemist" 
                onSwitchRole={handleRoleChange} 
                activeSubTab="dispense"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chemist/generics" 
          element={
            <ProtectedRoute allowedRole="chemist">
              <ChemistPage 
                currentRole="chemist" 
                onSwitchRole={handleRoleChange} 
                activeSubTab="generics"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chemist/inventory" 
          element={
            <ProtectedRoute allowedRole="chemist">
              <ChemistPage 
                currentRole="chemist" 
                onSwitchRole={handleRoleChange} 
                activeSubTab="inventory"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />

        {/* CASHIER PORTAL (P-CSH-01 to P-CSH-03) */}
        <Route 
          path="/cashier" 
          element={
            <ProtectedRoute allowedRole="cashier">
              <CashierPage 
                currentRole="cashier" 
                onSwitchRole={handleRoleChange}
                activeSubTab="dashboard"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cashier/dashboard" 
          element={
            <ProtectedRoute allowedRole="cashier">
              <CashierPage 
                currentRole="cashier" 
                onSwitchRole={handleRoleChange}
                activeSubTab="dashboard"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cashier/billing/:visitId" 
          element={
            <ProtectedRoute allowedRole="cashier">
              <CashierPage 
                currentRole="cashier" 
                onSwitchRole={handleRoleChange}
                activeSubTab="billing"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cashier/receipt/:billId" 
          element={
            <ProtectedRoute allowedRole="cashier">
              <CashierPage 
                currentRole="cashier" 
                onSwitchRole={handleRoleChange}
                activeSubTab="receipt"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />

        {/* ADMIN PORTAL (P-ADM-01 to P-ADM-03) */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminPage 
                currentRole="admin" 
                onSwitchRole={handleRoleChange}
                activeSubTab="dashboard"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminPage 
                currentRole="admin" 
                onSwitchRole={handleRoleChange}
                activeSubTab="dashboard"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/staff" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminPage 
                currentRole="admin" 
                onSwitchRole={handleRoleChange}
                activeSubTab="staff"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/audit-logs" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminPage 
                currentRole="admin" 
                onSwitchRole={handleRoleChange}
                activeSubTab="audit"
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />

        {/* Default Fallback / Index */}
        <Route 
          path="*" 
          element={
            localStorage.getItem('auth_token') ? (
              <Navigate to={`/${localStorage.getItem('bright_role') || 'receptionist'}/dashboard`} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
    );
}

export default function App() {
  return (
    <ThemeProvider>
      <PatientProvider>
        <BrowserRouter>
          <RoleRouter />
        </BrowserRouter>
      </PatientProvider>
    </ThemeProvider>
  );
}
