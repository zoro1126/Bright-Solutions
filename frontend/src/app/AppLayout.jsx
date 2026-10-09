import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Moon,
  Sun,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Shield,
  Stethoscope,
  Receipt,
  UserCheck,
  UserPlus,
  Plus,
  ChevronDown,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
  ArrowUpRight,
  Sparkles,
  Compass
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { NAVIGATION_CONFIG } from './navigationConfig';
import { CommandPalette } from '../components/ui/CommandPalette';
import { QuickStartGuideModal } from '../components/ui/QuickStartGuideModal';
import { Avatar } from '../components/ui/Avatar';
import { BRAND_CONFIG, ROUTES } from '../routes';

export function AppLayout({ children }) {
  const { user, role, switchRole, logout, darkMode, setDarkMode, toggleTheme } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Global keyboard shortcuts (Cmd+K for search, Cmd+G for guide)
  useEffect(() => {
    function handleGlobalKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const navItems = NAVIGATION_CONFIG[role] || NAVIGATION_CONFIG.RECEPTIONIST;

  const roleLabels = {
    RECEPTIONIST: {
      label: 'Reception Desk',
      sublabel: 'Head Receptionist',
      defaultRoute: ROUTES.RECEPTIONIST.DASHBOARD,
      promoAction: 'Register Patient',
      promoTitle: 'New Walk-In Intake',
      promoDesc: 'Capture vitals and print queue token slip.',
      promoRoute: `${ROUTES.RECEPTIONIST.DASHBOARD}?register=true`,
      icon: UserCheck
    },
    DOCTOR: {
      label: 'Physician Cockpit',
      sublabel: 'Attending Physician',
      defaultRoute: ROUTES.DOCTOR.DASHBOARD,
      promoAction: 'Call Next Patient',
      promoTitle: 'Waiting Lounge Queue',
      promoDesc: '3 patients waiting in OPD lounge.',
      promoRoute: '/doctor/consultation/102',
      icon: Stethoscope
    },
    CASHIER: {
      label: 'Cashier Finance',
      sublabel: 'Billing Counter 01',
      defaultRoute: ROUTES.CASHIER.DASHBOARD,
      promoAction: 'Open Next Bill',
      promoTitle: 'Unbilled Invoices',
      promoDesc: 'Reconcile signed consultation orders.',
      promoRoute: '/cashier/billing/102',
      icon: Receipt
    },
    ADMIN: {
      label: 'Admin Governance',
      sublabel: 'Executive Administrator',
      defaultRoute: ROUTES.ADMIN.DASHBOARD,
      promoAction: 'Provision Staff',
      promoTitle: 'Clinic Operations',
      promoDesc: 'Manage duty rosters and accounts.',
      promoRoute: ROUTES.ADMIN.STAFF,
      icon: Shield
    },
  };

  const currentRoleInfo = roleLabels[role] || roleLabels.RECEPTIONIST;

  function handleRoleSwitch(targetRole) {
    switchRole(targetRole);
    const targetRoute = roleLabels[targetRole]?.defaultRoute || '/';
    navigate(targetRoute);
  }

  // Derive human friendly title from path
  const getPageTitleAndGreeting = () => {
    const path = location.pathname;
    if (path.includes('/doctor/dashboard')) {
      return { title: 'Dashboard', greeting: `Hello ${user?.full_name || 'Dr. Vikram'}, welcome back!` };
    }
    if (path.includes('/receptionist/dashboard')) {
      return { title: 'Reception Dashboard', greeting: `Hello ${user?.full_name || 'Anita'}, walk-ins ready today!` };
    }
    if (path.includes('/cashier/dashboard')) {
      return { title: 'Billing Dashboard', greeting: `Hello ${user?.full_name || 'Rahul'}, shift collections active!` };
    }
    if (path.includes('/admin/dashboard')) {
      return { title: 'Executive Governance', greeting: 'Clinic governance & real-time analytics.' };
    }
    if (path.includes('/intake/questionnaire') || path.includes('/voice-intake')) {
      return { title: 'Clinical Intake Questionnaire', greeting: 'Structured MCQ anamnesis and voice dictation.' };
    }
    if (path.includes('/intake')) {
      return { title: 'Patient Registration & Vitals', greeting: 'Demographic intake and real-time hemodynamic triage.' };
    }
    if (path.includes('/reports')) {
      return { title: 'Diagnostic Scans Ingestion', greeting: 'Archive DICOM imaging, ECG strips, and lab blood panels.' };
    }
    if (path.includes('/queue')) {
      return { title: 'Live Patient Queue & Token Roster', greeting: 'Manage waiting lounge queue and reprint token slips.' };
    }
    if (path.includes('/doctor/patient')) {
      return { title: 'Patient Longitudinal Dossier', greeting: 'Longitudinal record, chronic history, and today vitals.' };
    }
    if (path.includes('/doctor/viewer')) {
      return { title: 'Diagnostic Media Visualizer', greeting: 'High-res DICOM axial imaging, ECG waveform, and lab panel.' };
    }
    if (path.includes('/doctor/consultation')) {
      return { title: 'Consultation & CDSS Studio', greeting: 'Differential diagnosis, deterministic safety engine, and e-Rx.' };
    }
    if (path.includes('/cashier/billing')) {
      return { title: 'Itemized Invoice & Copay', greeting: 'Review ledger tariffs, scan fees, and insurance copay.' };
    }
    if (path.includes('/cashier/receipt')) {
      return { title: 'Payment Tender & Official Receipt', greeting: 'Multi-mode settlement and 80mm printable tax invoice.' };
    }
    if (path.includes('/admin/staff')) {
      return { title: 'Staff Provisioning & Roster', greeting: 'Manage staff credentials, active shifts, and access levels.' };
    }
    if (path.includes('/admin/audit-logs')) {
      return { title: 'Clinical & Billing Audit Trail', greeting: 'Immutable, tamper-evident medical-legal quality ledger.' };
    }
    return { title: 'Clinical Dashboard', greeting: 'Bright Solutions Hospital Operating System' };
  };

  const { title: pageTitle, greeting: pageGreeting } = getPageTitleAndGreeting();

  return (
    <div className="min-h-screen bg-[#FFFDF8] dark:bg-[#051A30] text-[#0A2540] dark:text-white flex overflow-hidden font-sans">
      {/* --- DESKTOP LIGHT SIDEBAR --- */}
      <aside
        className={`hidden md:flex flex-col bg-white dark:bg-[#0A2540] border-r border-[#EAE4D3] dark:border-[#1B456E] transition-all duration-300 relative z-30 shrink-0 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Brand Header with Sun Mark (Compact 56px height) */}
        <div className="h-14 px-4 flex items-center justify-between shrink-0 border-b border-[#FAF6EC] dark:border-[#1B456E]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Sun Mark Icon with warm amber gradient */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E08A00] via-[#FFC21A] to-[#FFD24D] flex items-center justify-center text-[#0A2540] shrink-0 shadow-[0_2px_6px_rgba(255,194,26,0.3)]">
              <Sun className="w-4.5 h-4.5 text-[#0A2540] stroke-[2.5]" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <div className="text-sm font-extrabold tracking-tight text-[#0A2540] dark:text-white leading-tight">
                  Bright Solutions
                </div>
                <div className="text-[9px] text-[#8A740C] dark:text-[#FFE08A] font-semibold tracking-wider uppercase leading-none">
                  Clinical OS
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#0A2540] dark:hover:text-white hover:bg-[#FAF6EC] dark:hover:bg-[#0F355A] transition-colors focus:outline-none"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Navigation Menu Items */}
        <nav className="flex-1 py-2 px-2.5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== ROUTES.DOCTOR.DASHBOARD &&
               item.path !== ROUTES.RECEPTIONIST.DASHBOARD &&
               item.path !== ROUTES.CASHIER.DASHBOARD &&
               item.path !== ROUTES.ADMIN.DASHBOARD &&
               location.pathname.startsWith(item.path + '/'));
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-[#FFC21A] text-[#0A2540] shadow-xs font-bold'
                    : 'text-[#64748B] dark:text-[#CBD5E1] hover:text-[#0A2540] dark:hover:text-white hover:bg-[#FAF6EC] dark:hover:bg-[#0F355A]'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-[#0A2540] stroke-[2.5]' : 'text-[#64748B] dark:text-[#94A3B8] group-hover:scale-110'
                  }`}
                />
                {!collapsed && (
                  <span className="truncate tracking-tight font-sans">
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Contextual Quick-Action Card & Role Switcher */}
        <div className="p-2.5 border-t border-[#EAE4D3] dark:border-[#1B456E] bg-white dark:bg-[#0A2540] shrink-0 space-y-2">
          {/* Quick Action Promo-Style Card */}
          {!collapsed && (
            <div className="p-2.5 rounded-xl bg-[#FAF6EC] dark:bg-[#071D33] border border-[#FFEDB8] dark:border-[#1B456E] text-[#0A2540] dark:text-white space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#FFC21A] text-[#0A2540] flex items-center justify-center font-bold shrink-0">
                  <Activity className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div className="truncate">
                  <h4 className="text-[11px] font-bold text-[#0A2540] dark:text-white leading-tight truncate">
                    {currentRoleInfo.promoTitle}
                  </h4>
                  <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] truncate leading-tight">
                    {currentRoleInfo.promoDesc}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(currentRoleInfo.promoRoute)}
                className="w-full py-1.5 px-2.5 rounded-lg bg-[#0A2540] hover:bg-[#0F355A] text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-colors shadow-xs"
              >
                <span>{currentRoleInfo.promoAction}</span>
                <ArrowUpRight className="w-3 h-3 text-[#FFC21A]" />
              </button>
            </div>
          )}

          {/* Role Switcher Pills (All 4 roles) */}
          {!collapsed && (
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8] font-mono mb-1 px-1">
                Portal Switcher
              </div>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { r: 'RECEPTIONIST', label: 'Reception', icon: UserCheck },
                  { r: 'DOCTOR', label: 'Doctor', icon: Stethoscope },
                  { r: 'CASHIER', label: 'Cashier', icon: Receipt },
                  { r: 'ADMIN', label: 'Admin', icon: Shield },
                ].map(({ r, label, icon: RIcon }) => {
                  const isCurrent = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleSwitch(r)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 transition-all truncate ${
                        isCurrent
                          ? 'bg-[#FFC21A] text-[#0A2540] font-bold shadow-xs'
                          : 'bg-[#FAF6EC] dark:bg-[#0F355A] text-[#64748B] dark:text-[#CBD5E1] hover:text-[#0A2540]'
                      }`}
                    >
                      <RIcon className="w-3 h-3 shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Guide Launch in Sidebar & Sign Out */}
          <div className="flex items-center justify-between pt-1 border-t border-[#FAF6EC] dark:border-[#1B456E]">
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-[#8A740C] dark:text-[#FFE08A] hover:text-[#0A2540] transition-colors py-1 px-1"
              title="Open Quick Start Guide"
            >
              <Compass className="w-3.5 h-3.5" />
              {!collapsed && <span>Quick Guide</span>}
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] hover:text-[#DC2626] transition-colors py-1 px-1"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN VIEWPORT WRAPPER --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#FFFDF8] dark:bg-[#051A30]">
        {/* COMPACT TOP BAR / HEADER (h-14 / 56px) */}
        <header className="h-14 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 border-b border-[#FAF6EC] dark:border-[#1B456E]">
          {/* Left: Page Title & Greeting */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1.5 rounded-lg text-[#0A2540] dark:text-white hover:bg-[#FAF6EC] dark:hover:bg-[#0F355A]"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#0A2540] dark:text-white font-sans leading-none">
                {pageTitle}
              </h1>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 font-medium leading-none hidden sm:block">
                {pageGreeting}
              </p>
            </div>
          </div>

          {/* Right: Search Pill, Quick Guide Button, Theme Toggle, User Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Rounded Pill Search */}
            <div
              onClick={() => setCmdOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#0A2540] border border-[#EAE4D3] dark:border-[#1B456E] text-xs text-[#94A3B8] hover:border-[#FFC21A] cursor-pointer shadow-xs transition-all w-48 lg:w-60"
            >
              <Search className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="flex-1 text-[11px] text-[#64748B] dark:text-[#CBD5E1] truncate">Search anything...</span>
              <kbd className="text-[9px] bg-[#FAF6EC] dark:bg-[#0F355A] text-[#64748B] px-1 py-0.2 rounded font-mono border border-[#EAE4D3]/60">
                ⌘K
              </kbd>
            </div>

            {/* Quick Start Guide Interactive Modal Button */}
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF7E0] dark:bg-[#0F355A] hover:bg-[#FFC21A] hover:text-[#0A2540] text-[#0A2540] dark:text-white border border-[#FFEDB8] dark:border-[#1B456E] text-xs font-bold transition-all shadow-xs"
              title="Open Quick Start Guide for All Roles"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E08A00] dark:text-[#FFC21A]" />
              <span className="hidden md:inline text-[11px]">Quick Guide</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full bg-white dark:bg-[#0A2540] border border-[#EAE4D3] dark:border-[#1B456E] flex items-center justify-center text-[#0A2540] dark:text-white hover:bg-[#FAF6EC] dark:hover:bg-[#0F355A] transition-colors shadow-xs"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-[#FFC21A]" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* User Profile Block (Avatar, Name, Role) */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#EAE4D3] dark:border-[#1B456E]">
              <div className="w-8 h-8 rounded-full bg-[#0A2540] text-white flex items-center justify-center font-bold text-xs shrink-0 border border-[#FFEDB8]/80">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-[#0A2540] dark:text-white leading-tight">
                  {user?.full_name || 'Dr. Vikram Kulkarni'}
                </div>
                <div className="text-[10px] text-[#8A740C] dark:text-[#FFE08A] font-medium leading-none">
                  {currentRoleInfo.sublabel}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN SCROLLABLE CONTENT IN ONE COMPACT ROUNDED CONTAINER */}
        <main className="flex-1 overflow-y-auto px-2.5 sm:px-4 lg:px-5 pb-4">
          <div className="w-full max-w-[1520px] mx-auto rounded-2xl bg-[#FAF6EC] dark:bg-[#071D33] border border-[#EAE4D3] dark:border-[#1B456E] p-3.5 sm:p-4 lg:p-5 min-h-[calc(100vh-76px)] flex flex-col justify-between">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="flex-1 space-y-4"
            >
              {children || <Outlet />}
            </motion.div>

            {/* Standard Reference Footer Line (Compact) */}
            <footer className="mt-4 pt-2.5 border-t border-[#EAE4D3] dark:border-[#1B456E] flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#94A3B8] gap-2">
              <div>
                Copyright © 2026 Bright Solutions Clinical Suite. All rights reserved.
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setGuideOpen(true)}
                  className="hover:text-[#0A2540] dark:hover:text-white transition-colors text-[#8A740C] dark:text-[#FFE08A] font-bold"
                >
                  Quick Start Guide
                </button>
                <span>•</span>
                <a href="#privacy" className="hover:text-[#0A2540] dark:hover:text-white transition-colors">Privacy Policy</a>
                <span>•</span>
                <a href="#terms" className="hover:text-[#0A2540] dark:hover:text-white transition-colors">Terms & Conditions</a>
              </div>
            </footer>
          </div>
        </main>
      </div>

      {/* Global Command Palette (Deflickered & Keyboard-Navigable) */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* Interactive Multi-Role Quick Start Guide Modal */}
      <QuickStartGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        currentRole={role}
        onSwitchRole={handleRoleSwitch}
      />
    </div>
  );
}
