import React from 'react';
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
  Sliders,
  Sun,
  LayoutDashboard,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { usePatients } from '../context/PatientContext';

export default function Sidebar({ 
  activeTab = 'queue', 
  setActiveTab, 
  onOpenRegister, 
  collapsed, 
  setCollapsed,
  role = 'receptionist'
}) {
  const { stats } = usePatients();

  // Role-specific config
  let brandTag = 'Reception OS';
  let BrandIcon = Activity;
  let brandLogoIcon = Sun;
  let brandGradient = 'linear-gradient(135deg, #f59e0b, #d97706)';
  let brandShadow = '0 2px 6px rgba(245, 158, 11, 0.3)';
  let staffName = 'Priya Raghavan';
  let staffRole = 'Receptionist • Counter 1';
  let staffAvatar = 'PR';
  let avatarGradient = 'linear-gradient(135deg, #f59e0b, #d97706)';
  let navItems = [];
  let sectionLabel = 'Main Navigation';
  let activeNavBg = undefined;
  let activeNavColor = undefined;
  let activeNavBorder = undefined;

  if (role === 'admin') {
    brandTag = 'Admin OS';
    BrandIcon = ShieldCheck;
    brandLogoIcon = ShieldCheck;
    brandGradient = 'var(--adm-brand-gradient, linear-gradient(135deg, #0f172a, #1e3a8a))';
    brandShadow = 'var(--adm-brand-shadow, 0 4px 12px rgba(30, 58, 138, 0.35))';
    staffName = 'Dr. Alok Mehta';
    staffRole = 'Medical Superintendent';
    staffAvatar = 'AM';
    avatarGradient = 'linear-gradient(135deg, #0f172a, #1e3a8a)';
    sectionLabel = 'Executive Governance';
    activeNavBg = 'var(--adm-nav-active-bg, #dbeafe)';
    activeNavColor = 'var(--adm-nav-active-color, #1e3a8a)';
    activeNavBorder = 'var(--adm-nav-active-border, #2563eb)';
    navItems = [
      { id: 'dashboard', label: 'Executive Analytics', icon: BarChart3 },
      { id: 'staff', label: 'Staff Roster & Access', icon: Users },
      { id: 'audit', label: 'Clinical Audit Trail', icon: FileText }
    ];
  } else if (role === 'doctor') {
    brandTag = 'Doctor Desk';
    BrandIcon = Stethoscope;
    brandLogoIcon = Stethoscope;
    brandGradient = 'var(--doc-brand-gradient, linear-gradient(135deg, #0f172a, #1e3a8a))';
    brandShadow = 'var(--doc-brand-shadow, 0 4px 12px rgba(30, 58, 138, 0.35))';
    staffName = 'Dr. Kiran Patel';
    staffRole = 'Consultant Physician • Station 03';
    staffAvatar = 'KP';
    avatarGradient = 'linear-gradient(135deg, #0f172a, #1e3a8a)';
    sectionLabel = 'Clinical Navigation';
    activeNavBg = 'var(--doc-nav-active-bg, #CAF0F8)';
    activeNavColor = 'var(--doc-nav-active-color, #1e3a8a)';
    activeNavBorder = 'var(--doc-nav-active-border, #1e3a8a)';
    navItems = [
      { id: 'dashboard', label: 'Clinical Dashboard', icon: LayoutDashboard },
      { id: 'workspace', label: 'Consultation & e-Rx', icon: Stethoscope, badge: stats?.total || 5, badgeBg: '#CAF0F8', badgeColor: '#1e3a8a' },
      { id: 'dossier', label: 'Patient Dossier', icon: FileText },
      { id: 'viewer', label: 'Diagnostic Scans', icon: Layers }
    ];
  } else if (role === 'cashier') {
    brandTag = 'Cashier Desk';
    BrandIcon = Receipt;
    brandLogoIcon = Receipt;
    brandGradient = 'var(--csh-brand-gradient, linear-gradient(135deg, #f59e0b, #d97706))';
    brandShadow = 'var(--csh-brand-shadow, 0 4px 12px rgba(245, 158, 11, 0.35))';
    staffName = 'Ramesh V.';
    staffRole = 'Cashier • Counter B-02';
    staffAvatar = 'RV';
    avatarGradient = 'linear-gradient(135deg, #f59e0b, #d97706)';
    sectionLabel = 'Billing Navigation';
    activeNavBg = 'var(--csh-nav-active-bg, #fef3c7)';
    activeNavColor = 'var(--csh-nav-active-color, #78350f)';
    activeNavBorder = 'var(--csh-nav-active-border, #d97706)';
    navItems = [
      { id: 'dashboard', label: 'Billing Dashboard', icon: BarChart3 },
      { id: 'billing', label: 'Itemized Checkout', icon: Receipt, badge: stats?.pendingBilling || 3, badgeColor: '#78350f', badgeBg: '#fef3c7' },
      { id: 'receipt', label: 'Settlement & Receipts', icon: FileCheck, badge: 18, badgeColor: '#78350f', badgeBg: '#fef3c7' }
    ];
  } else {
    // Receptionist
    avatarGradient = 'linear-gradient(135deg, #f59e0b, #d97706)';
    navItems = [
      { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
      { id: 'queue', label: 'Live Patient Queue', icon: Users, badge: stats?.total },
      { id: 'register', label: 'New Patient Intake', icon: UserPlus, action: onOpenRegister },
      { id: 'pending', label: 'Pending Intake MCQ', icon: FileText, badge: stats?.pendingQuestionnaire, badgeColor: '#b45309', badgeBg: '#fef3c7' },
      { id: 'reports', label: 'Reports Ingestion', icon: Layers },
      { id: 'insights', label: 'AI Insights Ready', icon: Sparkles, badge: stats?.insightsReady, badgeColor: '#15803d', badgeBg: '#dcfce7' }
    ];
  }

  const LogoIcon = brandLogoIcon;

  return (
    <aside className={`m3-navigation-drawer ${collapsed ? 'collapsed' : ''}`}>
      <div className="drawer-header">
        {collapsed ? (
          <button 
            className="drawer-brand-btn-collapsed"
            onClick={() => setCollapsed(false)}
            title="Expand Navigation Drawer"
            aria-label="Expand Navigation Drawer"
          >
            <div className="drawer-brand-icon" style={{ width: 28, height: 28, borderRadius: 7, background: brandGradient, boxShadow: brandShadow, color: '#ffffff' }}>
              <LogoIcon size={16} strokeWidth={2.4} />
            </div>
            <div className="drawer-expand-indicator">
              <ChevronRight size={10} strokeWidth={3} />
            </div>
          </button>
        ) : (
          <>
            <div className="drawer-brand">
              <div className="drawer-brand-icon" style={{ width: 28, height: 28, borderRadius: 7, background: brandGradient, boxShadow: brandShadow, color: '#ffffff' }}>
                <LogoIcon size={16} strokeWidth={2.4} />
              </div>
              <div className="drawer-brand-text">
                <span className="drawer-title" style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: (role === 'doctor' || role === 'admin') ? '#0f172a' : 'var(--text-primary)' }}>Bright</span>
              </div>
            </div>
            <button 
              className="drawer-toggle-btn"
              onClick={() => setCollapsed(true)}
              title="Collapse navigation drawer"
              aria-label="Collapse navigation drawer"
              style={{ width: 22, height: 22 }}
            >
              <ChevronLeft size={13} />
            </button>
          </>
        )}
      </div>

      <div className="drawer-nav-list">
        {!collapsed && (
          <div className="drawer-section-label">
            <span style={{ color: (role === 'doctor' || role === 'admin') ? '#1e3a8a' : undefined, fontWeight: 700 }}>{sectionLabel}</span>
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active || activeTab === item.id;

          const itemCustomStyle = isActive && activeNavBg ? {
            backgroundColor: activeNavBg,
            color: activeNavColor,
            borderLeft: `3px solid ${activeNavBorder}`,
            fontWeight: 700
          } : undefined;

          return (
            <button
              key={item.id}
              className={`m3-nav-item ${isActive ? 'active' : ''}`}
              style={itemCustomStyle}
              onClick={() => {
                if (item.action) {
                  item.action();
                }
                if (setActiveTab) {
                  setActiveTab(item.id);
                }
              }}
              title={collapsed ? item.label : undefined}
            >
              <div className="nav-icon-container" style={{ color: isActive && activeNavColor ? activeNavColor : (role === 'doctor' ? (isActive ? '#1e3a8a' : '#475569') : undefined) }}>
                <Icon size={17} strokeWidth={isActive ? 2.5 : 2.2} />
              </div>
              {!collapsed && (
                <>
                  <span className="nav-label" style={{ color: isActive && activeNavColor ? activeNavColor : (role === 'doctor' ? (isActive ? '#1e3a8a' : '#334155') : undefined), fontWeight: isActive ? 800 : 600 }}>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span 
                    className="nav-badge"
                    style={{ 
                      color: item.badgeColor || (isActive && activeNavColor ? activeNavColor : (role === 'doctor' ? '#1e3a8a' : 'inherit')), 
                      backgroundColor: item.badgeBg || (role === 'doctor' ? '#CAF0F8' : 'var(--bg-subtle)'),
                      fontWeight: 700,
                      border: role === 'doctor' ? '1px solid #90E0EF' : (item.badgeBg === '#FDF4AF' ? '1px solid #e6dc7e' : undefined)
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </button>
          );
        })}


      </div>

      <div className="drawer-footer">
        <div className="drawer-nav-list" style={{ padding: 0 }}>
          <button 
            className="m3-nav-item"
            title={collapsed ? `${brandTag} Settings` : undefined}
          >
            <div className="nav-icon-container" style={{ color: '#475569' }}>
              <Settings size={17} strokeWidth={2.2} />
            </div>
            {!collapsed && <span className="nav-label" style={{ color: '#334155', fontWeight: 600 }}>Settings</span>}
          </button>
        </div>

        {collapsed ? (
          <div className="drawer-staff-collapsed" title={`${staffName} • ${staffRole}`}>
            <div className="staff-avatar" style={{ background: avatarGradient, color: '#ffffff', boxShadow: (role === 'doctor' || role === 'admin') ? '0 2px 8px rgba(30, 58, 138, 0.3)' : undefined }}>{staffAvatar}</div>
          </div>
        ) : (
          <div className="drawer-staff-card" style={{ backgroundColor: (role === 'doctor' || role === 'admin') ? 'rgba(202, 240, 248, 0.4)' : undefined, border: (role === 'doctor' || role === 'admin') ? '1px solid #bfe7f5' : undefined }}>
            <div className="staff-avatar" style={{ background: avatarGradient, color: '#ffffff', boxShadow: (role === 'doctor' || role === 'admin') ? '0 2px 8px rgba(30, 58, 138, 0.3)' : undefined }}>{staffAvatar}</div>
            <div className="staff-info">
              <div className="staff-name" style={{ color: '#0f172a' }}>{staffName}</div>
              <div className="staff-role" style={{ color: '#0077B6' }}>{staffRole}</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
