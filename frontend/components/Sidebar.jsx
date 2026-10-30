import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  UserPlus,
  FileText,
  Stethoscope,
  Receipt,
  BarChart3,
  Settings,
  Activity,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Sun,
  LayoutDashboard,
  ShieldCheck,
  FileCheck,
  Pill,
  Heart,
  ClipboardList,
  Package,
  Clock,
  Bed,
  LogOut,
  ExternalLink,
  ArrowRightCircle,
  Tv,
} from 'lucide-react';
import { usePatients } from '../context/PatientContext';

export default function Sidebar({
  activeTab = 'queue',
  setActiveTab,
  onOpenRegister,
  collapsed,
  setCollapsed,
  role = 'receptionist',
}) {
  const { stats } = usePatients();
  const navigate = useNavigate();
  const location = useLocation();

  // ─── Role config ──────────────────────────────────────────────────────────
  let brandTag = 'OPD Reception';
  let brandLogoIcon = Sun;
  let brandGradient = 'linear-gradient(135deg, #f59e0b, #d97706)';
  let brandShadow = '0 2px 6px rgba(245, 158, 11, 0.3)';
  let staffName = 'Priya Raghavan';
  let staffRole = 'OPD Reception • Counter 1';
  let staffAvatar = 'PR';
  let avatarGradient = 'linear-gradient(135deg, #f59e0b, #d97706)';
  let navItems = [];
  let sectionLabel = 'OPD Navigation';
  let activeNavBg = '#fef3c7';
  let activeNavColor = '#92400e';
  let activeNavBorder = '#d97706';

  if (role === 'admin') {
    brandTag = 'Admin Governance';
    brandLogoIcon = ShieldCheck;
    brandGradient = 'linear-gradient(135deg, #0f172a, #1e3a8a)';
    brandShadow = '0 4px 12px rgba(30,58,138,0.35)';
    staffName = 'Dr. Alok Mehta';
    staffRole = 'Medical Superintendent';
    staffAvatar = 'AM';
    avatarGradient = 'linear-gradient(135deg, #0f172a, #1e3a8a)';
    sectionLabel = 'Executive Governance';
    activeNavBg = '#dbeafe';
    activeNavColor = '#1e3a8a';
    activeNavBorder = '#2563eb';
    navItems = [
      { id: 'dashboard', label: 'Executive Analytics', icon: BarChart3 },
      { id: 'staff', label: 'Staff Roster & Access', icon: Users },
      { id: 'audit', label: 'Clinical Audit Trail', icon: FileText },
      { id: 'licensing', label: 'License & Quotas', icon: ShieldCheck, route: '/admin/licensing' },
    ];
  } else if (role === 'doctor') {
    brandTag = 'OPD Consultation';
    brandLogoIcon = Stethoscope;
    brandGradient = 'linear-gradient(135deg, #0f172a, #1e3a8a)';
    brandShadow = '0 4px 12px rgba(30,58,138,0.35)';
    staffName = 'Dr. Kiran Patel';
    staffRole = 'OPD Consultation • Cabin 01';
    staffAvatar = 'KP';
    avatarGradient = 'linear-gradient(135deg, #0f172a, #1e3a8a)';
    sectionLabel = 'Consultation';
    activeNavBg = '#caf0f8';
    activeNavColor = '#0077b6';
    activeNavBorder = '#0077b6';
    navItems = [
      { id: 'workspace',  label: 'Consultation & e-Rx', icon: Stethoscope, badge: stats?.total || 5, badgeBg: '#caf0f8', badgeColor: '#0077b6' },
      { id: 'dashboard',  label: 'OPD Queue & Dashboard', icon: LayoutDashboard },
      { id: 'dossier',    label: 'Patient History', icon: FileText },
      { id: 'viewer',     label: 'Diagnostic & PACS', icon: Layers },
    ];
  } else if (role === 'cashier') {
    brandTag = 'Cashier Desk';
    brandLogoIcon = Receipt;
    brandGradient = 'linear-gradient(135deg, #f59e0b, #d97706)';
    brandShadow = '0 4px 12px rgba(245,158,11,0.35)';
    staffName = 'Ramesh V.';
    staffRole = 'Cashier • Counter B-02';
    staffAvatar = 'RV';
    avatarGradient = 'linear-gradient(135deg, #f59e0b, #d97706)';
    sectionLabel = 'Billing';
    activeNavBg = '#fef3c7';
    activeNavColor = '#78350f';
    activeNavBorder = '#d97706';
    navItems = [
      { id: 'dashboard', label: 'Billing Dashboard', icon: BarChart3 },
      { id: 'billing',   label: 'Itemized Checkout', icon: Receipt, badge: stats?.pendingBilling || 3, badgeColor: '#78350f', badgeBg: '#fef3c7' },
      { id: 'receipt',   label: 'Settlement & Receipts', icon: FileCheck },
    ];
  } else if (role === 'nurse') {
    brandTag = 'Nurse Station';
    brandLogoIcon = Activity;
    brandGradient = 'linear-gradient(135deg, #0d9488, #0f766e)';
    brandShadow = '0 4px 12px rgba(13,148,136,0.35)';
    staffName = 'Sr. Mini Joseph';
    staffRole = 'Charge Nurse • Station 02';
    staffAvatar = 'MJ';
    avatarGradient = 'linear-gradient(135deg, #0d9488, #0f766e)';
    sectionLabel = 'Ward & Inpatient';
    activeNavBg = '#ccfbf1';
    activeNavColor = '#0f766e';
    activeNavBorder = '#0d9488';
    navItems = [
      { id: 'ward',   label: 'Ward Bed Census', icon: LayoutDashboard },
      { id: 'mar',    label: 'MAR Administration', icon: Pill },
      { id: 'vitals', label: 'NEWS2 Vitals', icon: Activity },
      { id: 'tasks',  label: 'Shift Tasks', icon: ClipboardList },
      { id: 'sos',    label: 'Rapid Response / SOS', icon: Heart },
    ];
  } else if (role === 'chemist') {
    brandTag = 'Dispensary';
    brandLogoIcon = Pill;
    brandGradient = 'linear-gradient(135deg, #16a34a, #059669)';
    brandShadow = '0 4px 12px rgba(22,163,74,0.35)';
    staffName = 'Karthik Ramamurthy';
    staffRole = 'Chief Pharmacist';
    staffAvatar = 'KR';
    avatarGradient = 'linear-gradient(135deg, #16a34a, #059669)';
    sectionLabel = 'Pharmacy';
    activeNavBg = '#dcfce7';
    activeNavColor = '#15803d';
    activeNavBorder = '#16a34a';
    navItems = [
      { id: 'queue',     label: 'e-Rx Review Queue', icon: Clock },
      { id: 'dispense',  label: 'Dispense Desk', icon: Package },
      { id: 'generics',  label: 'Generic Engine', icon: Sparkles },
      { id: 'inventory', label: 'Formulary & Stock', icon: Layers },
    ];
  } else {
    // receptionist
    navItems = [
      { id: 'dashboard',   label: 'Operations Dashboard', icon: LayoutDashboard },
      { id: 'token-queue', label: 'Token & Queue', icon: Clock, badge: stats?.waiting || stats?.total, badgeColor: '#b45309', badgeBg: '#fef3c7' },
      { id: 'queue',       label: 'All Patients', icon: Users, badge: stats?.total },
      { id: 'register',    label: 'New Registration', icon: UserPlus, action: onOpenRegister },
      { id: 'reports',     label: 'Reports Ingestion', icon: Layers },
    ];
  }

  const LogoIcon = brandLogoIcon;

  // ─── Handler: internal tab OR route navigation ────────────────────────────
  const handleItemClick = (item) => {
    if (item.route) {
      navigate(item.route);
      return;
    }
    if (item.action) {
      item.action();
      return;
    }
    if (setActiveTab) setActiveTab(item.id);
  };

  // Check if an item is "active" — either internal tab match or route match
  const isItemActive = (item) => {
    if (item.route) return location.pathname.startsWith(item.route) || activeTab === item.id;
    return activeTab === item.id;
  };

  return (
    <aside className={`m3-navigation-drawer ${collapsed ? 'collapsed' : ''}`}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="drawer-header">
        {collapsed ? (
          <button
            className="drawer-brand-btn-collapsed"
            onClick={() => setCollapsed(false)}
            title="Expand Navigation Drawer"
          >
            <div
              className="drawer-brand-icon"
              style={{ width: 28, height: 28, borderRadius: 7, background: brandGradient, boxShadow: brandShadow, color: '#fff' }}
            >
              <LogoIcon size={16} strokeWidth={2.4} />
            </div>
            <div className="drawer-expand-indicator">
              <ChevronRight size={10} strokeWidth={3} />
            </div>
          </button>
        ) : (
          <>
            <div className="drawer-brand">
              <div
                className="drawer-brand-icon"
                style={{ width: 28, height: 28, borderRadius: 7, background: brandGradient, boxShadow: brandShadow, color: '#fff' }}
              >
                <LogoIcon size={16} strokeWidth={2.4} />
              </div>
              <div className="drawer-brand-text">
                <span
                  className="drawer-title"
                  style={{ fontSize: 15, fontWeight: 900, letterSpacing: '-0.02em', color: '#0f172a' }}
                >
                  Bright
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginTop: 1 }}>
                  {brandTag}
                </span>
              </div>
            </div>
            <button
              className="drawer-toggle-btn"
              onClick={() => setCollapsed(true)}
              title="Collapse navigation drawer"
              style={{ width: 22, height: 22 }}
            >
              <ChevronLeft size={13} />
            </button>
          </>
        )}
      </div>

      {/* ── Nav Items ───────────────────────────────────────────────────── */}
      <div className="drawer-nav-list">
        {!collapsed && (
          <div className="drawer-section-label">
            <span style={{ color: activeNavColor, fontWeight: 700 }}>{sectionLabel}</span>
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item);

          return (
            <button
              key={item.id}
              className={`m3-nav-item ${isActive ? 'active' : ''}`}
              style={
                isActive
                  ? { backgroundColor: activeNavBg, color: activeNavColor, borderLeft: `3px solid ${activeNavBorder}`, fontWeight: 700 }
                  : undefined
              }
              onClick={() => handleItemClick(item)}
              title={collapsed ? item.label : undefined}
            >
              <div
                className="nav-icon-container"
                style={{ color: isActive ? activeNavColor : undefined }}
              >
                <Icon size={17} strokeWidth={isActive ? 2.5 : 2.2} />
              </div>
              {!collapsed && (
                <>
                  <span
                    className="nav-label"
                    style={{ color: isActive ? activeNavColor : undefined, fontWeight: isActive ? 800 : 600 }}
                  >
                    {item.label}
                  </span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className="nav-badge"
                      style={{
                        color: item.badgeColor || (isActive ? activeNavColor : 'inherit'),
                        backgroundColor: item.badgeBg || 'var(--bg-subtle)',
                        fontWeight: 700,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.route && (
                    <ExternalLink size={11} color="#94a3b8" style={{ flexShrink: 0 }} />
                  )}
                </>
              )}
            </button>
          );
        })}

        {/* ── Public TV Displays (OPD Waiting Room TV) — OPD roles only ─────────────── */}
        {role !== 'admin' && (
          <>
            {!collapsed && (
              <div
                className="drawer-section-label"
                style={{ marginTop: 14 }}
              >
                <span style={{ color: '#0284c7', fontWeight: 700 }}>TV Displays</span>
              </div>
            )}
            <a
              href="/display/waiting-room"
              target="_blank"
              rel="noopener noreferrer"
              className="m3-nav-item"
              title={collapsed ? 'Waiting Room TV Display' : undefined}
              style={{ textDecoration: 'none' }}
            >
              <div className="nav-icon-container" style={{ color: '#0284c7' }}>
                <Tv size={17} strokeWidth={2.2} />
              </div>
              {!collapsed && (
                <>
                  <span className="nav-label" style={{ color: '#334155', fontWeight: 600 }}>
                    Waiting Room TV
                  </span>
                  <ExternalLink size={12} color="#94a3b8" />
                </>
              )}
            </a>
          </>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="drawer-footer">
        <div className="drawer-nav-list" style={{ padding: 0 }}>
          <button
            className="m3-nav-item"
            title={collapsed ? 'Settings' : undefined}
          >
            <div className="nav-icon-container" style={{ color: '#475569' }}>
              <Settings size={17} strokeWidth={2.2} />
            </div>
            {!collapsed && (
              <span className="nav-label" style={{ color: '#334155', fontWeight: 600 }}>
                Settings
              </span>
            )}
          </button>
        </div>

        {collapsed ? (
          <div className="drawer-staff-collapsed" title={`${staffName} • ${staffRole}`}>
            <div className="staff-avatar" style={{ background: avatarGradient, color: '#fff' }}>
              {staffAvatar}
            </div>
          </div>
        ) : (
          <div className="drawer-staff-card">
            <div className="staff-avatar" style={{ background: avatarGradient, color: '#fff' }}>
              {staffAvatar}
            </div>
            <div className="staff-info">
              <div className="staff-name" style={{ color: '#0f172a' }}>{staffName}</div>
              <div className="staff-role" style={{ color: '#0077b6' }}>{staffRole}</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
