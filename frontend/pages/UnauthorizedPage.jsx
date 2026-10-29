/**
 * UnauthorizedPage.jsx — TASK-FE-1.6 (D15 §4)
 * Shown when role/module/permission guard blocks access.
 */
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldX, Lock, ArrowLeft } from 'lucide-react';

const REASON_CONFIG = {
  MODULE_NOT_LICENSED: {
    icon: Lock,
    title: 'Module Not Licensed',
    color: '#F59E0B',
    bg: '#FEF3C7',
    desc: (params) =>
      `The "${params.get('module') || 'requested'}" module is not included in your current license. Contact your administrator to upgrade.`,
  },
  PERMISSION_DENIED: {
    icon: ShieldX,
    title: 'Access Denied',
    color: '#EF4444',
    bg: '#FEE2E2',
    desc: (params) =>
      `Your role does not have the "${params.get('permission') || 'required'}" permission to access this page.`,
  },
  default: {
    icon: ShieldX,
    title: 'Unauthorized',
    color: '#EF4444',
    bg: '#FEE2E2',
    desc: () => 'You do not have permission to view this page.',
  },
};

export default function UnauthorizedPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reason   = params.get('reason') || 'default';
  const cfg      = REASON_CONFIG[reason] || REASON_CONFIG.default;
  const Icon     = cfg.icon;
  const role     = localStorage.getItem('bright_role') || 'receptionist';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F8FAFC', padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 18, padding: '48px 40px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.1)', textAlign: 'center',
        maxWidth: 420, width: '100%',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: cfg.bg, margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={32} color={cfg.color} />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
          {cfg.title}
        </h1>

        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, margin: '0 0 24px' }}>
          {cfg.desc(params)}
        </p>

        {reason !== 'default' && (
          <div style={{
            padding: '8px 14px', borderRadius: 8,
            background: '#F8FAFC', border: '1px solid #E2E8F0',
            fontSize: 11, color: '#94A3B8', fontFamily: 'monospace',
            marginBottom: 24,
          }}>
            Reason: {reason} {params.get('module') ? `| Module: ${params.get('module')}` : ''} {params.get('permission') ? `| Permission: ${params.get('permission')}` : ''}
          </div>
        )}

        <button
          onClick={() => navigate(`/${role}/dashboard`)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 24px', borderRadius: 10,
            background: '#06B6D4', color: '#fff',
            border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          <ArrowLeft size={15} />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}

