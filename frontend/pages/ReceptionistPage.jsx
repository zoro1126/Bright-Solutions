import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatsRow from '../components/StatsRow';
import PatientQueue from '../components/PatientQueue';
import PatientDetailsDrawer from '../components/PatientDetailsDrawer';
import PatientRegistrationModal from '../components/PatientRegistrationModal';
import QuestionnaireModal from '../components/QuestionnaireModal';
import ToastContainer from '../components/ToastContainer';

export default function ReceptionistPage({ currentRole = 'receptionist', onSwitchRole }) {
  const [activeNavTab, setActiveNavTab] = useState('queue');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  const [activeQuestionnairePatient, setActiveQuestionnairePatient] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleOpenQuestionnaire = (patient) => {
    setActiveQuestionnairePatient(patient);
    setIsQuestionnaireOpen(true);
  };

  const handleRegisteredAndStartIntake = (newPatient) => {
    handleOpenQuestionnaire(newPatient);
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
    setActiveNavTab(tabId);
  };

  return (
    <div className="m3-app-shell">
      {/* Google M3 Sidebar Navigation Drawer */}
      <Sidebar 
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
        />

        <main className="page-container m3-page-animate">
          {/* Top metrics bar */}
          <StatsRow />

          {/* Main Reception Workspace: Full-Width Patient Queue */}
          <div className="reception-workspace">
            <PatientQueue
              onOpenRegister={() => setIsRegisterOpen(true)}
              onOpenQuestionnaire={handleOpenQuestionnaire}
              onOpenPatientDetails={() => setIsDetailsOpen(true)}
              externalFilter={activeNavTab}
              onFilterChange={(tabId) => setActiveNavTab(tabId)}
            />
          </div>
        </main>
      </div>

      {/* Patient Details & AI Dossier Pop-up Modal */}
      <PatientDetailsDrawer
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onOpenQuestionnaire={handleOpenQuestionnaire}
        onOpenDoctorWorkspace={() => onSwitchRole && onSwitchRole('doctor')}
      />

      {/* Registration Modal (Google M3 Dialog) */}
      <PatientRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegisteredAndStartIntake={handleRegisteredAndStartIntake}
      />

      {/* Oncology Intake Questionnaire Modal (100% MCQ / Click-based) */}
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

      {/* Dynamic Toasts */}
      <ToastContainer />
    </div>
  );
}
