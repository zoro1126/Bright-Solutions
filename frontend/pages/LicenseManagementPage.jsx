/**
 * LicenseManagementPage — TASK-FE-1.4
 * Route: /admin/licensing
 * Shows license status, quota, module checklist, and drag-and-drop .lic upload.
 * Calls: GET /api/v1/admin/license, POST /api/v1/admin/license/upload
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck, ShieldAlert, ShieldX, Clock, Upload, Clipboard,
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, Building2,
  Bed, Users, Package, Stethoscope, FlaskConical, ReceiptText, Pill
} from 'lucide-react';

// ─── Mock License Data (used when API is offline) ─────────────────────────────
const MOCK_LICENSE = {
  hospital_name: 'Bright Solutions Hospital',
  hospital_slug: 'shubham',
  tenant_id: 1,
  license_key: 'BS-ENT-2026-****-****-A7F2',
  status: 'ACTIVE',            // ACTIVE | GRACE_PERIOD | EXPIRED | CLOCK_TAMPERED
  issued_at: '2026-01-01T00:00:00Z',
  expires_at: '2027-01-01T00:00:00Z',
  days_remaining: 364,
  grace_days_remaining: null,
  max_beds: 60,
  max_doctors: 20,
  current_beds: 20,
  current_doctors: 5,
  enabled_modules: ['OPD', 'IPD', 'PHARMACY', 'PATHOLOGY', 'BILLING'],
  edition: 'Enterprise',
  issued_by: 'Bright Solutions Licensing Authority',
  last_verified_at: new Date().toISOString(),
};

const ALL_MODULES = [
  { code: 'OPD',       label: 'Outpatient (OPD)',     icon: Stethoscope },
  { code: 'IPD',       label: 'Inpatient (IPD)',       icon: Bed },
  { code: 'PHARMACY',  label: 'Pharmacy Dispensary',  icon: Pill },
  { code: 'PATHOLOGY', label: 'Pathology Laboratory', icon: FlaskConical },
  { code: 'BILLING',   label: 'Billing & Settlement', icon: ReceiptText },
];

function statusConfig(status) {
  switch (status) {
    case 'ACTIVE':
      return { color: '#10B981', bg: '#d1fae5', border: '#6ee7b7', icon: ShieldCheck, label: 'ACTIVE', bannerText: null };
    case 'GRACE_PERIOD':
      return { color: '#F59E0B', bg: '#fef3c7', border: '#fde68a', icon: ShieldAlert, label: 'GRACE PERIOD', bannerText: 'License expired — grace period active. Renew immediately to prevent read-only mode.' };
    case 'EXPIRED':
      return { color: '#EF4444', bg: '#fee2e2', border: '#fca5a5', icon: ShieldX, label: 'EXPIRED / READ-ONLY', bannerText: 'License has expired. System is in READ-ONLY mode. All writes are blocked.' };
    case 'CLOCK_TAMPERED':
      return { color: '#7C3AED', bg: '#ede9fe', border: '#c4b5fd', icon: AlertTriangle, label: 'CLOCK TAMPERED', bannerText: '⚠️ System clock tampering detected. Contact Bright Solutions support immediately.' };
    default:
      return { color: '#94A3B8', bg: '#f1f5f9', border: '#cbd5e1', icon: ShieldAlert, label: 'UNKNOWN', bannerText: null };
  }
}

function QuotaBar({ used, max, label, color = '#06B6D4' }) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const barColor = pct >= 90 ? '#EF4444' : pct >= 75 ? '#F59E0B' : color;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: barColor }}>{used} / {max}</span>
      </div>
      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 9999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 9999, transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{pct}% utilized</div>
    </div>
  );
}

export default function LicenseManagementPage({ addToast }) {
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const dropRef = useRef(null);
  const fileInputRef = useRef(null);

  // ─── Fetch License ─────────────────────────────────────────────────────────
  const fetchLicense = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('__bs_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/admin/license', { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLicense(data);
    } catch {
      // API offline — use mock
      setLicense(MOCK_LICENSE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLicense(); }, [fetchLicense]);

  // ─── File Upload ───────────────────────────────────────────────────────────
  const uploadLicFile = useCallback(async (file) => {
    if (!file || (!file.name.endsWith('.lic') && !file.type.includes('text'))) {
      addToast?.('Invalid file type. Please upload a .lic license file.', 'error');
      return;
    }
    setUploading(true);
    const form = new FormData();
    form.append('license_file', file);
    try {
      const token = sessionStorage.getItem('__bs_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/admin/license/upload', { method: 'POST', headers, body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setLicense(data.license || MOCK_LICENSE);
      addToast?.('✅ License renewed successfully! No page reload required.', 'success');
    } catch (e) {
      addToast?.(`License upload failed: ${e.message}`, 'error');
    } finally {
      setUploading(false);
    }
  }, [addToast]);

  const uploadLicString = useCallback(async () => {
    if (!pasteText.trim()) return;
    setUploading(true);
    try {
      const token = sessionStorage.getItem('__bs_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/admin/license/upload', {
        method: 'POST',
        headers,
        body: JSON.stringify({ license_string: pasteText.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setLicense(data.license || MOCK_LICENSE);
      setPasteText('');
      setPasteMode(false);
      addToast?.('✅ License string applied successfully!', 'success');
    } catch (e) {
      addToast?.(`License string failed: ${e.message}`, 'error');
    } finally {
      setUploading(false);
    }
  }, [pasteText, addToast]);

  // ─── Drag & Drop ───────────────────────────────────────────────────────────
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadLicFile(file);
  };

  if (loading) {
    return (
      <div style={{ padding: 32, display: 'flex', alignItems: 'center', gap: 12, color: '#94A3B8' }}>
        <RefreshCw size={18} className="spin" />
        <span>Loading license information...</span>
      </div>
    );
  }

  const cfg = statusConfig(license?.status || 'UNKNOWN');
  const StatusIcon = cfg.icon;
  const expiresDate = license?.expires_at ? new Date(license.expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Unknown';

  return (
    <div style={{ padding: '24px 28px', maxWidth: 860, margin: '0 auto' }}>

      {/* ── Banner (non-ACTIVE statuses) ───────────────────────────────── */}
      {cfg.bannerText && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 10,
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          color: cfg.color,
          fontWeight: 600,
          fontSize: 13,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <StatusIcon size={18} />
          {cfg.bannerText}
        </div>
      )}

      {/* ── License Status Card ────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color }}>
                <StatusIcon size={22} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{license?.hospital_name || 'Bright Solutions Hospital'}</div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Slug: {license?.hospital_slug} • Tenant ID: {license?.tenant_id}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{ padding: '3px 10px', borderRadius: 9999, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 11, fontWeight: 800, letterSpacing: '0.05em' }}>
                {cfg.label}
              </span>
              <span style={{ padding: '3px 10px', borderRadius: 9999, background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', fontSize: 11, fontWeight: 700 }}>
                {license?.edition || 'Enterprise'} Edition
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginBottom: 2 }}>LICENSE KEY</div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#334155', background: '#f8fafc', padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              {license?.license_key || '—'}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 8 }}>Issued by: {license?.issued_by}</div>
          </div>
        </div>

        {/* Expiry info */}
        <div style={{ display: 'flex', gap: 24, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>EXPIRES ON</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{expiresDate}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>DAYS REMAINING</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: license?.days_remaining <= 30 ? '#EF4444' : license?.days_remaining <= 90 ? '#F59E0B' : '#10B981' }}>
              {license?.days_remaining != null ? `${license.days_remaining} days` : (license?.grace_days_remaining != null ? `${license.grace_days_remaining} grace days` : '—')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>LAST VERIFIED</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
              {license?.last_verified_at ? new Date(license.last_verified_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={fetchLicense} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Quota Cards ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Bed size={16} color="#06B6D4" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Bed Quota</span>
          </div>
          <QuotaBar used={license?.current_beds || 20} max={license?.max_beds || 60} label="Active Beds" />
          <div style={{ fontSize: 11, color: '#94A3B8' }}>Licensed maximum: {license?.max_beds} beds</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Users size={16} color="#0D9488" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Doctor Quota</span>
          </div>
          <QuotaBar used={license?.current_doctors || 5} max={license?.max_doctors || 20} label="Active Doctors" color="#0D9488" />
          <div style={{ fontSize: 11, color: '#94A3B8' }}>Licensed maximum: {license?.max_doctors} doctors</div>
        </div>
      </div>

      {/* ── Module Checklist ─────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={16} color="#06B6D4" />
          Licensed SaaS Modules
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {ALL_MODULES.map(({ code, label, icon: Icon }) => {
            const active = (license?.enabled_modules || []).includes(code);
            return (
              <div key={code} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 10,
                background: active ? '#f0fdf4' : '#f8fafc',
                border: `1px solid ${active ? '#bbf7d0' : '#e2e8f0'}`,
              }}>
                <Icon size={15} color={active ? '#10B981' : '#94A3B8'} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: active ? '#065f46' : '#94A3B8' }}>{label}</div>
                  <div style={{ fontSize: 10, color: active ? '#10B981' : '#CBD5E1', fontWeight: 600 }}>
                    {active ? '✓ Licensed' : '✕ Add-on'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── License Renewal ──────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Upload size={16} color="#06B6D4" />
          Offline License Renewal
        </div>

        {/* Tab toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setPasteMode(false)}
            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: !pasteMode ? '#06B6D4' : '#f1f5f9', color: !pasteMode ? '#fff' : '#334155', border: 'none' }}
          >
            Upload .lic File
          </button>
          <button
            onClick={() => setPasteMode(true)}
            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: pasteMode ? '#06B6D4' : '#f1f5f9', color: pasteMode ? '#fff' : '#334155', border: 'none' }}
          >
            Paste License String
          </button>
        </div>

        {!pasteMode ? (
          /* Drag & Drop Zone */
          <div
            ref={dropRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#06B6D4' : '#CBD5E1'}`,
              borderRadius: 12,
              background: dragOver ? '#e0f9ff' : '#f8fafc',
              padding: '40px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".lic,.txt"
              style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLicFile(f); }}
            />
            {uploading ? (
              <div style={{ color: '#06B6D4', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <RefreshCw size={24} className="spin" />
                <span style={{ fontWeight: 600, fontSize: 13 }}>Uploading and verifying Ed25519 signature…</span>
              </div>
            ) : (
              <>
                <Upload size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  {dragOver ? 'Drop .lic file here' : 'Drag & drop .lic license file, or click to browse'}
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>Ed25519 signed offline license token • Air-gapped renewal supported</div>
              </>
            )}
          </div>
        ) : (
          /* Paste zone */
          <div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your license string here (Base64-encoded Ed25519 signed token)..."
              style={{
                width: '100%', minHeight: 120, fontFamily: 'monospace', fontSize: 12,
                padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1',
                background: '#f8fafc', color: '#0F172A', resize: 'vertical', boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                onClick={uploadLicString}
                disabled={uploading || !pasteText.trim()}
                style={{
                  padding: '8px 20px', borderRadius: 8, background: '#06B6D4', color: '#fff',
                  border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  opacity: (uploading || !pasteText.trim()) ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                {uploading ? <RefreshCw size={14} className="spin" /> : <CheckCircle2 size={14} />}
                Apply License
              </button>
              <button
                onClick={() => { navigator.clipboard?.readText?.().then(t => setPasteText(t)).catch(() => {}); }}
                style={{ padding: '8px 14px', borderRadius: 8, background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <Clipboard size={13} />
                Paste from Clipboard
              </button>
            </div>
          </div>
        )}
        <div style={{ marginTop: 12, fontSize: 11, color: '#94A3B8', lineHeight: 1.5 }}>
          License renewal is instant and does not require a server reboot. All active sessions continue uninterrupted. License tokens are verified using asymmetric Ed25519 cryptography (ADR-010).
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
