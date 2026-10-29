/**
 * AuthLayout.jsx — Clean centered login shell (D15 §2.1)
 * Used by: /login
 */
import React from 'react';
import { Activity } from 'lucide-react';

export default function AuthLayout({ children }) {
  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0D2137 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      {/* Hospital Brand */}
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'linear-gradient(135deg, #06B6D4, #0D9488)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px', boxShadow: '0 8px 24px rgba(6,182,212,0.35)',
        }}>
          <Activity size={28} color="#fff" strokeWidth={2.5} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#F1F5F9', letterSpacing: '-0.02em' }}>
          Bright Solutions
        </div>
        <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginTop: 2 }}>
          Clinical Management System
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: '#fff', borderRadius: 18,
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        width: '100%', maxWidth: 420,
        overflow: 'hidden',
      }}>
        {children}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 24, fontSize: 10.5, color: '#334155', textAlign: 'center' }}>
        Bright Solutions © {new Date().getFullYear()} • NABH Compliant • Secure HTTPS
      </div>
    </div>
  );
}

