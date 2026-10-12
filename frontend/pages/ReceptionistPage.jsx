import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatsRow from '../components/StatsRow';
import PatientQueue from '../components/PatientQueue';
import PatientDetailsDrawer from '../components/PatientDetailsDrawer';
import PatientRegistrationModal from '../components/PatientRegistrationModal';
import QuestionnaireModal from '../components/QuestionnaireModal';
import ToastContainer from '../components/ToastContainer';
import ReportsUploadView from '../components/ReportsUploadView';
import ReceptionistDashboardView from '../components/ReceptionistDashboardView';
import TokenSlipModal from '../components/TokenSlipModal';
import { usePatients } from '../context/PatientContext';

export default function ReceptionistPage({ currentRole = 'receptionist', onSwitchRole, activeSubTab = 'dashboard', onLogout }) {
  const { patients } = usePatients();
  const [activeNavTab, setActiveNavTab] = useState(activeSubTab || 'dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  const [activeQuestionnairePatient, setActiveQuestionnairePatient] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [slipModalPatient, setSlipModalPatient] = useState(null);

  // 15-second polling interval for live queue, paused when tab is hidden (P-REC-05)
  useEffect(() => {
    let interval = null;
    const startPolling = () => {
      interval = setInterval(() => {
        if (!document.hidden) {
          // Poll / update live queue indicator
        }
      }, 15000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (interval) clearInterval(interval);
      } else {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startPolling();

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleOpenQuestionnaire = (patient) => {
    setActiveQuestionnairePatient(patient);
    setIsQuestionnaireOpen(true);
  };

  const handleRegisteredAndStartIntake = (newPatient) => {
    // Show printable token slip then start intake
    setSlipModalPatient(newPatient);
  };

  const handleNavTabChange = (tabId) => {
    if (tabId === 'doctors' && onSwitchRole) {
      onSwitchRole('doctor');
      return;
    }
    if (tabId === 'billing' && onSwitchRole) {
      onSwitchRole('cashier');
      return;
    }
    if (tabId === 'register') {
      setIsRegisterOpen(true);
      return;
    }
    setActiveNavTab(tabId);
  };

  return (
    <div className="m3-app-shell">
      {/* Sidebar Navigation */}
      <Sidebar 
        role="receptionist"
        activeTab={activeNavTab}
        setActiveTab={handleNavTabChange}
        onOpenRegister={() => setIsRegisterOpen(true)}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="m3-main-viewport">
        <Navbar 
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          currentRole={currentRole}
          onRoleChange={onSwitchRole}
          onLogout={onLogout}
        />

        <main className="page-container m3-page-animate" style={{ maxWidth: '100%', width: '100%', margin: 0, padding: '16px 20px', boxSizing: 'border-box' }}>
          {/* TAB 1: P-REC-01 Operations Dashboard */}
          {activeNavTab === 'dashboard' && (
            <ReceptionistDashboardView 
              onOpenRegister={() => setIsRegisterOpen(true)}
              onSelectPatientForQuestionnaire={(patient) => handleOpenQuestionnaire(patient)}
              onPrintSlip={(patient) => setSlipModalPatient(patient)}
            />
          )}

          {/* TAB 2 & 5: P-REC-05 Live OPD Patient Queue & Token Roster */}
          {(activeNavTab === 'queue' || activeNavTab === 'pending' || activeNavTab === 'insights') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <StatsRow />
              <div className="reception-workspace">
                <PatientQueue
                  onOpenRegister={() => setIsRegisterOpen(true)}
                  onOpenQuestionnaire={handleOpenQuestionnaire}
                  onOpenPatientDetails={() => setIsDetailsOpen(true)}
                  externalFilter={activeNavTab}
                  onFilterChange={(tabId) => setActiveNavTab(tabId)}
                />
              </div>
            </div>
          )}

          {/* TAB 4: P-REC-04 External Diagnostic Reports Ingestion */}
          {activeNavTab === 'reports' && (
            <ReportsUploadView 
              onSwitchToDoctor={() => onSwitchRole && onSwitchRole('doctor')}
            />
          )}
        </main>
      </div>

      {/* Patient Details Drawer Modal */}
      <PatientDetailsDrawer
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onOpenQuestionnaire={handleOpenQuestionnaire}
        onOpenDoctorWorkspace={() => onSwitchRole && onSwitchRole('doctor')}
      />

      {/* Registration Modal (P-REC-02) */}
      <PatientRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegisteredAndStartIntake={handleRegisteredAndStartIntake}
      />

      {/* Intake Questionnaire Modal (P-REC-03) */}
      {isQuestionnaireOpen && activeQuestionnairePatient && (
        <QuestionnaireModal
          isOpen={isQuestionnaireOpen}
          patient={activeQuestionnairePatient}
          onClose={() => {
            setIsQuestionnaireOpen(false);
            setActiveQuestionnairePatient(null);
          }}
        />
      )}

      {/* Printable Token Slip Modal */}
      {slipModalPatient && (
        <TokenSlipModal
          isOpen={Boolean(slipModalPatient)}
          patient={slipModalPatient}
          onClose={() => {
            const p = slipModalPatient;
            setSlipModalPatient(null);
            handleOpenQuestionnaire(p);
          }}
        />
      )}

      {/* Dynamic Toasts */}
      <ToastContainer />
    </div>
  );
}
