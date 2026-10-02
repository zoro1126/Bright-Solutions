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
  LayoutDashboard
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
  let staffName = 'Priya Raghavan';
  let staffRole = 'Receptionist • Counter 1';
  let staffAvatar = 'PR';
  let navItems = [];
  let sectionLabel = 'Main Navigation';

  if (role === 'doctor') {
    brandTag = 'Doctor Desk';
    BrandIcon = Stethoscope;
    staffName = 'Dr. Kiran Patel';
    staffRole = 'Oncologist • Station 03';
    staffAvatar = 'KP';
    sectionLabel = 'Clinical Navigation';
    navItems = [
      // { id: 'dashboard', label: 'Doctor Dashboard', icon: LayoutDashboard },
      { id: 'workspace', label: 'Clinical Workspace', icon: Stethoscope, badge: stats?.total || 5, badgeBg: '#fef3c7', badgeColor: '#b45309', active: true }
    ];
  } else if (role === 'cashier') {
    brandTag = 'Cashier Desk';
    BrandIcon = Receipt;
    staffName = 'Ramesh V.';
    staffRole = 'Cashier • Counter B-02';
    staffAvatar = 'RV';
    sectionLabel = 'Billing Navigation';
    // User requested: "Dont add menu options by yourself yet. I'll give details about the same to you soon."
    navItems = [
      { id: 'billing', label: 'Cashier & Billing Desk', icon: Receipt, active: true }
    ];
  } else {
    // Receptionist
    navItems = [
      { id: 'queue', label: 'Patient Queue', icon: Users, badge: stats?.total },
      { id: 'register', label: 'New Patient', icon: UserPlus, action: onOpenRegister },
      { id: 'pending', label: 'Pending Intake', icon: FileText, badge: stats?.pendingQuestionnaire, badgeColor: '#b45309', badgeBg: '#fef3c7' },
      { id: 'insights', label: 'AI Insights Ready', icon: Sparkles, badge: stats?.insightsReady, badgeColor: '#15803d', badgeBg: '#dcfce7' },
      { id: 'doctors', label: 'Doctor Stations', icon: Stethoscope },
      { id: 'billing', label: 'Billing Handoff', icon: Receipt },
      { id: 'reports', label: 'Desk Analytics', icon: BarChart3 }
    ];
  }

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
            <div className="drawer-brand-icon" style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)' }}>
              <Sun size={16} strokeWidth={2.4} />
            </div>
            <div className="drawer-expand-indicator">
              <ChevronRight size={10} strokeWidth={3} />
            </div>
          </button>
        ) : (
          <>
            <div className="drawer-brand">
              <div className="drawer-brand-icon" style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)' }}>
                <Sun size={16} strokeWidth={2.4} />
              </div>
              <div className="drawer-brand-text">
                <span className="drawer-title" style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Bright</span>
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
            <span>{sectionLabel}</span>
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active || activeTab === item.id;

          return (
            <button
              key={item.id}
              className={`m3-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else if (setActiveTab) {
                  setActiveTab(item.id);
                }
              }}
              title={collapsed ? item.label : undefined}
            >
              <div className="nav-icon-container">
                <Icon size={17} strokeWidth={isActive ? 2.5 : 2.2} />
              </div>
              {!collapsed && (
                <>
                  <span className="nav-label">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span 
                      className="nav-badge"
                      style={{ 
                        color: item.badgeColor || 'inherit', 
                        backgroundColor: item.badgeBg || 'var(--bg-subtle)' 
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

        {/* Minimal placeholder notice for Cashier pending user menu details */}
        {role === 'cashier' && !collapsed && (
          <div style={{
            margin: '12px 6px 0',
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border-default)',
            backgroundColor: 'var(--bg-subtle)',
            fontSize: '10.5px',
            color: 'var(--text-muted)',
            lineHeight: 1.35
          }}>
            <span style={{ fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>
              Navigation Menu Ready
            </span>
            Waiting for menu item configuration.
          </div>
        )}
      </div>

      <div className="drawer-footer">
        <div className="drawer-nav-list" style={{ padding: 0 }}>
          <button 
            className="m3-nav-item"
            title={collapsed ? `${brandTag} Settings` : undefined}
          >
            <div className="nav-icon-container">
              <Settings size={17} strokeWidth={2.2} />
            </div>
            {!collapsed && <span className="nav-label">Settings</span>}
          </button>
        </div>

        {collapsed ? (
          <div className="drawer-staff-collapsed" title={`${staffName} • ${staffRole}`}>
            <div className="staff-avatar">{staffAvatar}</div>
          </div>
        ) : (
          <div className="drawer-staff-card">
            <div className="staff-avatar">{staffAvatar}</div>
            <div className="staff-info">
              <div className="staff-name">{staffName}</div>
              <div className="staff-role">{staffRole}</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
