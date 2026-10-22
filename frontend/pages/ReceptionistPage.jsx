import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatsRow from '../components/StatsRow';
import PatientQueue from '../components/PatientQueue';
import PatientDetailsDrawer from '../components/PatientDetailsDrawer';
import PatientRegistrationModal from '../components/PatientRegistrationModal';
import ToastContainer from '../components/ToastContainer';
import ReportsUploadView from '../components/ReportsUploadView';
import ReceptionistDashboardView from '../components/ReceptionistDashboardView';
import TokenSlipModal from '../components/TokenSlipModal';
import TokenQueueManagementView from '../components/TokenQueueManagementView';
import ReceptionistFlowGuideModal from '../components/ReceptionistFlowGuideModal';
import { usePatients } from '../context/PatientContext';

export default function ReceptionistPage({ currentRole = 'receptionist', onSwitchRole, activeSubTab = 'dashboard', onLogout }) {
  const { patients } = usePatients();
  const [activeNavTab, setActiveNavTab] = useState(activeSubTab || 'dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsPatient, setDetailsPatient] = useState(null);
  const [slipModalPatient, setSlipModalPatient] = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Synchronize state when activeSubTab prop changes (e.g. from URL routing or external links)
  useEffect(() => {
    if (activeSubTab) {
      if (activeSubTab === 'intake' || activeSubTab === 'register') {
        setActiveNavTab('token-queue');
        setIsRegisterOpen(true);
      } else if (activeSubTab === 'pending' || activeSubTab === 'token-queue') {
        setActiveNavTab('token-queue');
      } else {
        setActiveNavTab(activeSubTab);
      }
    }
  }, [activeSubTab]);

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

  const handleRegisteredAndStartIntake = (newPatient) => {
    // Show printable token slip for new registration
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
    if (tabId === 'register' || tabId === 'intake') {
      setIsRegisterOpen(true);
      setActiveNavTab('queue');
      return;
    }
    setActiveNavTab(tabId);
  };

  return (
    <div className="m3-app-shell receptionist-theme">
      {/* Sidebar Navigation */}
      <Sidebar 
        role="receptionist"
        activeTab={activeNavTab}
        setActiveTab={handleNavTabChange}
        onOpenRegister={() => {
          setIsRegisterOpen(true);
          setActiveNavTab('queue');
        }}
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
          onOpenReceptionistGuide={() => setIsGuideOpen(true)}
        />

        <main className="page-container m3-page-animate" style={{ maxWidth: '100%', width: '100%', margin: 0, padding: '16px 20px', boxSizing: 'border-box' }}>
          {/* TAB 1: P-REC-01 Operations Dashboard */}
          {activeNavTab === 'dashboard' && (
            <ReceptionistDashboardView 
              onOpenRegister={() => {
                setIsRegisterOpen(true);
                setActiveNavTab('token-queue');
              }}
              onPrintSlip={(patient) => setSlipModalPatient(patient)}
            />
          )}

          {/* TAB 2: Token / Queue Management System (Replaces Pending MCQ Page) */}
          {(activeNavTab === 'token-queue' || activeNavTab === 'pending') && (
            <TokenQueueManagementView
              onOpenRegister={() => setIsRegisterOpen(true)}
              onPrintSlip={(patient) => setSlipModalPatient(patient)}
              onOpenPatientDetails={(p) => {
                setDetailsPatient(p);
                setIsDetailsOpen(true);
              }}
            />
          )}

          {/* TAB 3: All Patients Directory Queue */}
          {activeNavTab === 'queue' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <StatsRow />
              <div className="reception-workspace">
                <PatientQueue
                  onOpenRegister={() => setIsRegisterOpen(true)}
                  onPrintSlip={(p) => setSlipModalPatient(p)}
                  onOpenPatientDetails={(p) => {
                    setDetailsPatient(p);
                    setIsDetailsOpen(true);
                  }}
                  externalFilter="ALL"
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
        patient={detailsPatient}
        onClose={() => {
          setIsDetailsOpen(false);
          setDetailsPatient(null);
        }}
        onOpenDoctorWorkspace={() => onSwitchRole && onSwitchRole('doctor')}
      />

      {/* Registration Modal (P-REC-02) */}
      <PatientRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegisteredAndStartIntake={handleRegisteredAndStartIntake}
      />

      {/* Printable Token Slip Modal */}
      {slipModalPatient && (
        <TokenSlipModal
          isOpen={Boolean(slipModalPatient)}
          patient={slipModalPatient}
          onClose={() => setSlipModalPatient(null)}
        />
      )}

      {/* Interactive End-to-End Receptionist Flow Guide Modal */}
      <ReceptionistFlowGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onOpenRegister={() => {
          setIsRegisterOpen(true);
          setActiveNavTab('queue');
        }}
        onOpenSampleSlip={() => {
          const sample = patients[0] || {
            id: 'sample-p1',
            fullName: 'Sangeetha Krishnan',
            age: 52,
            gender: 'Female',
            doctorAssigned: 'Dr. Kiran Patel (Medical Oncology)',
            mrn: 'MRN-2026-141'
          };
          setSlipModalPatient(sample);
        }}
        onSwitchTab={(tabId) => setActiveNavTab(tabId)}
      />

      {/* Dynamic Toasts */}
      <ToastContainer />
    </div>
  );
}
