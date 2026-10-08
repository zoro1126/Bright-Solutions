import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroStats from './components/HeroStats';
import PatientQueueTable from './components/PatientQueueTable';
import RegistrationModal from './components/RegistrationModal';
import TokenIssuedModal from './components/TokenIssuedModal';
import PatientDetailModal from './components/PatientDetailModal';
import PaletteSwitcherModal from './components/PaletteSwitcherModal';
import LoginModal from './components/LoginModal';
import DashboardView from './components/DashboardView';

import { 
  fetchHealth, 
  fetchDoctors, 
  fetchNextToken, 
  fetchPatients, 
  registerPatient,
  fetchDashboardStats
} from './services/api';
import { PALETTES, applyPalette } from './utils/themes';

export default function App() {
  // Navigation & View
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'queue'

  // User Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('clinicos_user');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      id: 1,
      username: 'receptionist_anita',
      full_name: 'Anita Sharma',
      role: 'RECEPTIONIST',
      email: 'anita@clinic.com'
    };
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Theme Palette State
  const [currentPaletteId, setCurrentPaletteId] = useState(() => {
    return localStorage.getItem('clinicos_theme') || 'canary-navy';
  });
  const [isPaletteModalOpen, setIsPaletteModalOpen] = useState(false);

  // Clinic Core Data State
  const [health, setHealth] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [nextToken, setNextToken] = useState('Q-101');
  const [patients, setPatients] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Registration & Detail Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [tokenIssuedData, setTokenIssuedData] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Initial Theme Application
  useEffect(() => {
    applyPalette(currentPaletteId);
  }, [currentPaletteId]);

  // Load Clinic Data
  const loadData = async (query = '') => {
    setLoading(true);
    try {
      const [healthRes, docsRes, tokenRes, patientsRes, statsRes] = await Promise.all([
        fetchHealth(),
        fetchDoctors(),
        fetchNextToken(),
        fetchPatients(query),
        fetchDashboardStats()
      ]);
      setHealth(healthRes);
      setDoctors(docsRes);
      setNextToken(tokenRes);
      setPatients(patientsRes);
      setDashboardStats(statsRes);
    } catch (err) {
      console.error('Failed to load clinic data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Heartbeat poll for health & stats
    const interval = setInterval(async () => {
      const [h, s] = await Promise.all([
        fetchHealth(),
        fetchDashboardStats()
      ]);
      setHealth(h);
      if (s) setDashboardStats(s);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle Palette Switch
  const handleSelectPalette = (paletteId) => {
    setCurrentPaletteId(paletteId);
    applyPalette(paletteId);
  };

  const activePalette = PALETTES.find(p => p.id === currentPaletteId) || PALETTES[0];

  // Handle User Login
  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    localStorage.setItem('clinicos_user', JSON.stringify(user));
    if (token) localStorage.setItem('clinicos_token', token);
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('clinicos_user');
    localStorage.removeItem('clinicos_token');
    setIsLoginModalOpen(true);
  };

  // Handle Search Input
  const handleSearch = async (term) => {
    setSearchTerm(term);
    const p = await fetchPatients(term);
    setPatients(p);
  };

  // Handle Patient Registration
  const handleRegisterSubmit = async (payload) => {
    const result = await registerPatient(payload);
    setTokenIssuedData(result);
    setIsRegisterOpen(false);
    await loadData(searchTerm);
    return result;
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar 
        healthStatus={health}
        currentUser={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentPaletteName={activePalette.name}
        onOpenPaletteModal={() => setIsPaletteModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'dashboard' ? (
          <DashboardView
            currentUser={currentUser}
            stats={dashboardStats}
            onOpenRegisterModal={() => setIsRegisterOpen(true)}
            onSwitchToQueueTab={() => setActiveTab('queue')}
            onViewPatient={(patient) => setSelectedPatient(patient)}
          />
        ) : (
          <div>
            {/* Hero Section & Stats */}
            <HeroStats
              patientCount={patients.length}
              nextToken={nextToken}
              doctorCount={doctors.length}
              onOpenRegisterModal={() => setIsRegisterOpen(true)}
              onRefresh={() => loadData(searchTerm)}
              loading={loading}
            />

            {/* Patients Queue Roster & Triage Table */}
            <PatientQueueTable
              patients={patients}
              searchTerm={searchTerm}
              onSearchChange={handleSearch}
              onViewPatient={(patient) => setSelectedPatient(patient)}
              onOpenRegisterModal={() => setIsRegisterOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        doctors={doctors}
        nextToken={nextToken}
        onSuccess={handleRegisterSubmit}
      />

      <TokenIssuedModal
        isOpen={!!tokenIssuedData}
        tokenData={tokenIssuedData}
        onClose={() => setTokenIssuedData(null)}
      />

      <PatientDetailModal
        isOpen={!!selectedPatient}
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />

      <PaletteSwitcherModal
        isOpen={isPaletteModalOpen}
        currentPaletteId={currentPaletteId}
        onSelectPalette={handleSelectPalette}
        onClose={() => setIsPaletteModalOpen(false)}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onLoginSuccess={handleLoginSuccess}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}
