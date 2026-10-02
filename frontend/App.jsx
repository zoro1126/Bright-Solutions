import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { PatientProvider } from './context/PatientContext';
import { WalkthroughProvider } from './context/WalkthroughContext';
import ReceptionistPage from './pages/ReceptionistPage';
import DoctorPage from './pages/DoctorPage';
import CashierPage from './pages/CashierPage';
import SpotlightTour from './components/SpotlightTour';

function AppContent() {
  const [currentRole, setCurrentRole] = useState('receptionist'); // 'receptionist' | 'doctor' | 'cashier'

  return (
    <WalkthroughProvider onSwitchRole={setCurrentRole} currentRole={currentRole}>
      {currentRole === 'receptionist' && (
        <ReceptionistPage 
          currentRole={currentRole} 
          onSwitchRole={setCurrentRole} 
        />
      )}
      {currentRole === 'doctor' && (
        <DoctorPage 
          currentRole={currentRole} 
          onSwitchRole={setCurrentRole} 
          onSwitchToReception={() => setCurrentRole('receptionist')} 
        />
      )}
      {currentRole === 'cashier' && (
        <CashierPage 
          currentRole={currentRole} 
          onSwitchRole={setCurrentRole} 
        />
      )}

      {/* Interactive Spotlight Demo Tour */}
      <SpotlightTour onSwitchRole={setCurrentRole} currentRole={currentRole} />
    </WalkthroughProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <PatientProvider>
        <AppContent />
      </PatientProvider>
    </ThemeProvider>
  );
}
