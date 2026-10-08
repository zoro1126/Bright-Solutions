import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Moon,
  Sun,
  Bell,
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
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { NAVIGATION_CONFIG } from './navigationConfig';
import { CommandPalette } from '../components/ui/CommandPalette';
import { Avatar } from '../components/ui/Avatar';
import { BRAND_CONFIG, ROUTES } from '../routes';

export function AppLayout({ children }) {
  const { user, role, switchRole, logout, darkMode, setDarkMode } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const navItems = NAVIGATION_CONFIG[role] || NAVIGATION_CONFIG.RECEPTIONIST;

  const roleLabels = {
    RECEPTIONIST: {
      label: 'Reception Desk',
      sublabel: 'Head Receptionist',
      defaultRoute: ROUTES.RECEPTIONIST.DASHBOARD,
      promoAction: 'Register Patient',
      promoTitle: 'New Walk-In Intake',
      promoDesc: 'Capture vitals and print queue token slip.',
      promoRoute: ROUTES.RECEPTIONIST.INTAKE,
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
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header with Sun Mark */}
        <div className="h-20 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Sun Mark Icon with warm amber gradient */}
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#E08A00] via-[#FFC21A] to-[#FFE500] flex items-center justify-center text-[#0A2540] shrink-0 shadow-[0_2px_8px_rgba(255,194,26,0.35)]">
              <Sun className="w-5 h-5 text-[#0A2540] stroke-[2.5]" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <div className="text-base font-extrabold tracking-tight text-[#0A2540] dark:text-white">
                  Bright Solutions
                </div>
                <div className="text-[10px] text-[#8A740C] dark:text-[#FFE08A] font-semibold tracking-wider uppercase">
                  Clinical OS
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-xl text-[#94A3B8] hover:text-[#0A2540] dark:hover:text-white hover:bg-[#FAF6EC] dark:hover:bg-[#0F355A] transition-colors focus:outline-none"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Menu Items */}
        <nav className="flex-1 py-4 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all group ${
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
        <div className="p-4 border-t border-[#EAE4D3] dark:border-[#1B456E] bg-white dark:bg-[#0A2540] shrink-0 space-y-3">
          {/* Quick Action Promo-Style Card */}
          {!collapsed && (
            <div className="p-4 rounded-3xl bg-[#FAF6EC] dark:bg-[#071D33] border border-[#FFEDB8] dark:border-[#1B456E] text-[#0A2540] dark:text-white space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#FFC21A] text-[#0A2540] flex items-center justify-center font-bold">
                  <Activity className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0A2540] dark:text-white leading-none">
                    {currentRoleInfo.promoTitle}
                  </h4>
                  <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 line-clamp-1">
                    {currentRoleInfo.promoDesc}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(currentRoleInfo.promoRoute)}
                className="w-full py-2 px-3 rounded-full bg-[#0A2540] hover:bg-[#0F355A] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <span>{currentRoleInfo.promoAction}</span>
                <ArrowUpRight className="w-3 h-3 text-[#FFC21A]" />
              </button>
            </div>
          )}

          {/* Role Switcher Pills (All 4 roles) */}
          {!collapsed && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] font-mono mb-1.5 px-1">
                Portal Switcher
              </div>
              <div className="grid grid-cols-2 gap-1.5">
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
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all truncate ${
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

          {/* Sign Out Row */}
          <div className="flex items-center justify-between pt-1 border-t border-[#FAF6EC] dark:border-[#1B456E]">
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] hover:text-[#DC2626] transition-colors py-1 px-1"
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN VIEWPORT WRAPPER --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#FFFDF8] dark:bg-[#051A30]">
        {/* TOP BAR / HEADER */}
        <header className="h-20 px-6 sm:px-8 flex items-center justify-between z-20 shrink-0">
          {/* Left: Page Title & Greeting */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-[#0A2540] dark:text-white hover:bg-[#FAF6EC] dark:hover:bg-[#0F355A]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0A2540] dark:text-white font-sans">
                {pageTitle}
              </h1>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5 font-medium">
                {pageGreeting}
              </p>
            </div>
          </div>

          {/* Right: Rounded Pill Search, Circular Buttons, User Avatar */}
          <div className="flex items-center gap-3">
            {/* Rounded Pill Search */}
            <div
              onClick={() => setCmdOpen(true)}
              className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-full bg-white dark:bg-[#0A2540] border border-[#EAE4D3] dark:border-[#1B456E] text-xs text-[#94A3B8] hover:border-[#FFC21A] cursor-pointer shadow-[0_1px_2px_0_rgba(10,37,64,0.02)] transition-all w-56 lg:w-72"
            >
              <Search className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="flex-1 text-[#64748B] dark:text-[#CBD5E1]">Search anything</span>
              <kbd className="text-[10px] bg-[#FAF6EC] dark:bg-[#0F355A] text-[#64748B] px-1.5 py-0.5 rounded-md font-mono border border-[#EAE4D3]/60">
                ⌘K
              </kbd>
            </div>

            {/* Circular Bell Button */}
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="w-10 h-10 rounded-full bg-white dark:bg-[#0A2540] border border-[#EAE4D3] dark:border-[#1B456E] flex items-center justify-center text-[#0A2540] dark:text-white hover:bg-[#FAF6EC] dark:hover:bg-[#0F355A] transition-colors relative shadow-xs"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#FFC21A] absolute top-2.5 right-2.5 ring-2 ring-white dark:ring-[#0A2540]" />
            </button>

            {/* Circular Theme / Settings Button */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="w-10 h-10 rounded-full bg-white dark:bg-[#0A2540] border border-[#EAE4D3] dark:border-[#1B456E] flex items-center justify-center text-[#0A2540] dark:text-white hover:bg-[#FAF6EC] dark:hover:bg-[#0F355A] transition-colors shadow-xs"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-[#FFC21A]" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile Block (Avatar, Name, Role) */}
            <div className="flex items-center gap-3 pl-2 border-l border-[#EAE4D3] dark:border-[#1B456E]">
              <div className="w-10 h-10 rounded-full bg-[#0A2540] text-white flex items-center justify-center font-bold text-sm shrink-0 border border-[#FFEDB8]/80">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-[#0A2540] dark:text-white leading-tight">
                  {user?.full_name || 'Dr. Vikram Kulkarni'}
                </div>
                <div className="text-[11px] text-[#8A740C] dark:text-[#FFE08A] font-medium leading-tight">
                  {currentRoleInfo.sublabel}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN SCROLLABLE CONTENT IN ONE LARGE ROUNDED CONTAINER (~32px radius, #FAF6EC) */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="w-full max-w-[1520px] mx-auto rounded-[32px] bg-[#FAF6EC] dark:bg-[#071D33] border border-[#EAE4D3] dark:border-[#1B456E] p-5 sm:p-7 lg:p-8 min-h-[calc(100vh-130px)] flex flex-col justify-between">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="flex-1 space-y-6"
            >
              {children || <Outlet />}
            </motion.div>

            {/* Standard Reference Footer Line */}
            <footer className="mt-8 pt-4 border-t border-[#EAE4D3] dark:border-[#1B456E] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#94A3B8] gap-3">
              <div>
                Copyright © 2026 Bright Solutions Clinical Suite. All rights reserved.
              </div>
              <div className="flex items-center gap-4">
                <a href="#privacy" className="hover:text-[#0A2540] dark:hover:text-white transition-colors">Privacy Policy</a>
                <a href="#terms" className="hover:text-[#0A2540] dark:hover:text-white transition-colors">Term and conditions</a>
                <a href="#contact" className="hover:text-[#0A2540] dark:hover:text-white transition-colors">Contact</a>
              </div>
            </footer>
          </div>
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
