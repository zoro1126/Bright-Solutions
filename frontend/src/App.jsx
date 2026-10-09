import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './app/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './app/AppLayout';
import { ROUTES } from './routes';

// Auth Page
import LoginPage from './features/auth/LoginPage';

// Receptionist Pages
import ReceptionistDashboardPage from './features/receptionist/ReceptionistDashboardPage';
import PatientRegistrationPage from './features/receptionist/PatientRegistrationPage';
import IntakeQuestionnairePage from './features/receptionist/IntakeQuestionnairePage';
import DiagnosticReportsPage from './features/receptionist/DiagnosticReportsPage';
import PatientQueuePage from './features/receptionist/PatientQueuePage';

// Doctor Pages
import DoctorDashboardPage from './features/doctor/DoctorDashboardPage';
import PatientDossierPage from './features/doctor/PatientDossierPage';
import DiagnosticViewerPage from './features/doctor/DiagnosticViewerPage';
import ConsultationStudioPage from './features/doctor/ConsultationStudioPage';

// Cashier Pages
import CashierDashboardPage from './features/cashier/CashierDashboardPage';
import ItemizedBillingPage from './features/cashier/ItemizedBillingPage';
import PaymentReceiptPage from './features/cashier/PaymentReceiptPage';

// Admin Pages
import AdminDashboardPage from './features/admin/AdminDashboardPage';
import StaffManagementPage from './features/admin/StaffManagementPage';
import AuditLogsPage from './features/admin/AuditLogsPage';

function RootRedirect() {
  const { user, role } = useAuth();
  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  switch (role) {
    case 'RECEPTIONIST':
      return <Navigate to={ROUTES.RECEPTIONIST.DASHBOARD} replace />;
    case 'DOCTOR':
      return <Navigate to={ROUTES.DOCTOR.DASHBOARD} replace />;
    case 'CASHIER':
      return <Navigate to={ROUTES.CASHIER.DASHBOARD} replace />;
    case 'ADMIN':
      return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
    default:
      return <Navigate to={ROUTES.RECEPTIONIST.DASHBOARD} replace />;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Standalone Login Page */}
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />

            {/* Authenticated Layout for All Portals */}
            <Route element={<AppLayout />}>
              {/* Receptionist Portal */}
              <Route path={ROUTES.RECEPTIONIST.DASHBOARD} element={<ReceptionistDashboardPage />} />
              <Route path={ROUTES.RECEPTIONIST.INTAKE} element={<Navigate to={`${ROUTES.RECEPTIONIST.DASHBOARD}?register=true`} replace />} />
              <Route path={ROUTES.RECEPTIONIST.QUESTIONNAIRE} element={<IntakeQuestionnairePage />} />
              <Route path="/receptionist/intake/questionnaire" element={<Navigate to={ROUTES.RECEPTIONIST.QUESTIONNAIRE} replace />} />
              <Route path={ROUTES.RECEPTIONIST.VOICE_INTAKE_ALIAS} element={<IntakeQuestionnairePage />} />
              <Route path={ROUTES.RECEPTIONIST.REPORTS} element={<DiagnosticReportsPage />} />
              <Route path={ROUTES.RECEPTIONIST.QUEUE} element={<PatientQueuePage />} />

              {/* Doctor Portal */}
              <Route path={ROUTES.DOCTOR.DASHBOARD} element={<DoctorDashboardPage />} />
              <Route path={ROUTES.DOCTOR.PATIENT_DOSSIER} element={<PatientDossierPage />} />
              <Route path={ROUTES.DOCTOR.VIEWER} element={<DiagnosticViewerPage />} />
              <Route path={ROUTES.DOCTOR.CONSULTATION} element={<ConsultationStudioPage />} />

              {/* Cashier Portal */}
              <Route path={ROUTES.CASHIER.DASHBOARD} element={<CashierDashboardPage />} />
              <Route path={ROUTES.CASHIER.BILLING} element={<ItemizedBillingPage />} />
              <Route path={ROUTES.CASHIER.RECEIPT} element={<PaymentReceiptPage />} />

              {/* Hospital Administrator Portal */}
              <Route path={ROUTES.ADMIN.DASHBOARD} element={<AdminDashboardPage />} />
              <Route path={ROUTES.ADMIN.STAFF} element={<StaffManagementPage />} />
              <Route path={ROUTES.ADMIN.AUDIT_LOGS} element={<AuditLogsPage />} />
            </Route>

            {/* Root & Fallback */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
