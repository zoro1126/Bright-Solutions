import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Moon,
  Sun,
  Activity,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Shield,
  Stethoscope,
  Receipt,
  UserCheck,
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
    RECEPTIONIST: { label: 'Receptionist Desk', color: 'bg-[#38BDF8] text-[#051A30]', icon: UserCheck, defaultRoute: ROUTES.RECEPTIONIST.DASHBOARD },
    DOCTOR: { label: 'Physician Cockpit', color: 'bg-[#FFE500] text-[#051A30]', icon: Stethoscope, defaultRoute: ROUTES.DOCTOR.DASHBOARD },
    CASHIER: { label: 'Cashier Finance', color: 'bg-[#34D399] text-[#051A30]', icon: Receipt, defaultRoute: ROUTES.CASHIER.DASHBOARD },
    ADMIN: { label: 'Admin Governance', color: 'bg-[#C084FC] text-[#051A30]', icon: Shield, defaultRoute: ROUTES.ADMIN.DASHBOARD },
  };

  const currentRoleInfo = roleLabels[role] || roleLabels.RECEPTIONIST;

  function handleRoleSwitch(targetRole) {
    switchRole(targetRole);
    const targetRoute = roleLabels[targetRole]?.defaultRoute || '/';
    navigate(targetRoute);
  }

  // Derive breadcrumbs
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumb = pathParts.length > 0
    ? pathParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ')
    : 'Clinical Workspace';

  return (
    <div className="min-h-screen bg-[#F6F7FA] dark:bg-[#051A30] text-[#051A30] dark:text-white flex overflow-hidden font-sans">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside
        className={`hidden md:flex flex-col bg-[#0A2540] border-r border-[#1B456E] text-white transition-all duration-300 relative z-30 shrink-0 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#1B456E] shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-[#FFE500] flex items-center justify-center font-extrabold text-[#051A30] text-sm shrink-0 shadow-sm font-mono">
              B
            </div>
            {!collapsed && (
              <div className="truncate">
                <div className="text-sm font-black tracking-tight flex items-center gap-1.5">
                  <span>{BRAND_CONFIG.name}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFE500]" />
                </div>
                <div className="text-[10px] text-[#94A3B8] font-mono tracking-wider">
                  {BRAND_CONFIG.systemName}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg text-[#64748B] hover:text-white hover:bg-[#1B456E] transition-colors focus:outline-none"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Active Role Indicator Pill */}
        {!collapsed && (
          <div className="px-5 py-3 border-b border-[#1B456E]/60 bg-[#071D33]/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFE500] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFE500]" />
              </span>
              <span className="text-[11px] font-bold font-mono tracking-wide text-[#E2E8F0]">
                {currentRoleInfo.label}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Menu Items */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'text-[#051A30]'
                    : 'text-[#CBD5E1] hover:text-white hover:bg-[#1B456E]/40'
                }`}
                title={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-[#FFE500] rounded-xl shadow-sm"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon className={`w-4 h-4 shrink-0 relative z-10 ${isActive ? 'text-[#051A30]' : 'text-[#94A3B8] group-hover:text-white'}`} />
                {!collapsed && (
                  <span className="relative z-10 truncate tracking-tight">
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Quick Role Switcher Dock at Sidebar Bottom */}
        <div className="p-3 border-t border-[#1B456E] bg-[#071D33] shrink-0 space-y-3">
          {!collapsed && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] font-mono mb-2">
                Switch Role Portal
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
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all text-left truncate ${
                        isCurrent
                          ? 'bg-[#FFE500] text-[#051A30] font-bold shadow-xs'
                          : 'bg-[#0F355A] text-[#CBD5E1] hover:bg-[#1B456E] hover:text-white'
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

          {/* User Profile & Logout */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Avatar name={user?.full_name || 'Staff User'} role={role} size="sm" />
              {!collapsed && (
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">
                    {user?.full_name || 'Staff'}
                  </div>
                  <div className="text-[10px] text-[#94A3B8] font-mono truncate">
                    {user?.username}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#DC2626] hover:bg-[#1B456E] transition-colors"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN VIEWPORT WRAPPER --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP BAR / HEADER */}
        <header className="h-16 bg-white dark:bg-[#0A2540] border-b border-[#E2E8F0] dark:border-[#1B456E] px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 shadow-[0_1px_2px_0_rgba(10,37,64,0.02)]">
          {/* Left: Mobile hamburger & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-[#0A2540] dark:text-white hover:bg-[#F6F7FA] dark:hover:bg-[#0F355A]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="font-bold text-[#0A2540] dark:text-white">
                {currentRoleInfo.label}
              </span>
              <span className="text-[#94A3B8]">/</span>
              <span className="text-[#64748B] dark:text-[#CBD5E1] truncate max-w-[200px] sm:max-w-md">
                {breadcrumb}
              </span>
            </div>
          </div>

          {/* Right: Search, API Status, Dark Mode Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Command Palette Trigger */}
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F6F7FA] dark:bg-[#0F355A] hover:bg-[#E2E8F0] dark:hover:bg-[#1B456E] text-xs text-[#64748B] dark:text-[#CBD5E1] border border-[#CBD5E1]/60 dark:border-[#1B456E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFE500]"
            >
              <Search className="w-3.5 h-3.5 text-[#0A2540] dark:text-[#FFE500]" />
              <span className="hidden sm:inline">Search patients & actions</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 rounded text-[10px] bg-white dark:bg-[#0A2540] font-mono text-[#64748B] border border-[#CBD5E1]">
                Ctrl K
              </kbd>
            </button>

            {/* Small "FastAPI Online" pulse dot */}
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ECFDF5] dark:bg-[#0F355A] border border-[#A7F3D0] dark:border-[#1B456E] text-[11px] font-mono text-[#065F46] dark:text-[#34D399]"
              title="FastAPI Backend Online"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
              </span>
              <span className="font-semibold">FastAPI Online</span>
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-[#64748B] hover:text-[#0A2540] dark:hover:text-white hover:bg-[#F6F7FA] dark:hover:bg-[#0F355A] transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-[#FFE500]" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* MAIN SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="max-w-7xl mx-auto space-y-6"
          >
            {children || <Outlet />}
          </motion.div>
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
