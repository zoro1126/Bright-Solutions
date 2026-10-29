/**
 * EdgeSyncBeacon.jsx — TASK-FE-6.3 (D19 useEdgeSyncStore alignment)
 * Persistent bottom-right sync indicator.
 * 
 * States: CLOUD_ONLINE | LOCAL_EDGE_LAN | OFFLINE
 * Health ping: GET /api/v1/health every 30s
 * Never disrupts active forms.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Cloud, Wifi, WifiOff, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

const PING_INTERVAL = 30_000; // 30 seconds

export default function EdgeSyncBeacon() {
  const [status, setStatus]       = useState('CHECKING'); // CLOUD_ONLINE | LOCAL_EDGE_LAN | OFFLINE | CHECKING
  const [expanded, setExpanded]   = useState(false);
  const [lastSync, setLastSync]   = useState(null);
  const [pending, setPending]     = useState(0);
  const [serverType, setServerType] = useState('Primary Cloud');
  const intervalRef               = useRef(null);

  const ping = useCallback(async () => {
    // Rule 1: native offline event wins immediately (D19 precedence rule)
    if (!navigator.onLine) {
      setStatus('OFFLINE');
      return;
    }
    try {
      const res = await fetch('/api/v1/health', {
        credentials: 'include',
        signal: AbortSignal.timeout(5000),  // 5s timeout
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        // If the server reports it's running on local Docker LAN
        const isEdge = data.deployment === 'LOCAL_EDGE' || data.server === 'local';
        setStatus(isEdge ? 'LOCAL_EDGE_LAN' : 'CLOUD_ONLINE');
        setServerType(isEdge ? 'Local Hospital Docker' : 'Primary Cloud (Contabo)');
        setLastSync(new Date());
      } else {
        setStatus('LOCAL_EDGE_LAN'); // server responded but possibly degraded
        setServerType('Edge Fallback');
        setLastSync(new Date());
      }
    } catch {
      // Fetch failed — either network error or API truly offline
      if (!navigator.onLine) {
        setStatus('OFFLINE');
      } else {
        setStatus('LOCAL_EDGE_LAN'); // LAN might be up but primary cloud unreachable
        setServerType('Local Hospital LAN');
      }
    }
  }, []);

  // Initialize & schedule ping
  useEffect(() => {
    ping(); // immediate on mount
    intervalRef.current = setInterval(ping, PING_INTERVAL);

    // Native online/offline events — immediate state change (D19 precedence rule)
    const handleOffline = () => setStatus('OFFLINE');
    const handleOnline  = () => ping(); // re-ping on reconnect
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online',  handleOnline);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online',  handleOnline);
    };
  }, [ping]);

  // Status config
  const cfg = {
    CLOUD_ONLINE:   { icon: Cloud,   color: '#10B981', bg: '#D1FAE5', border: '#6EE7B7', label: 'Cloud Online',   dot: '#10B981' },
    LOCAL_EDGE_LAN: { icon: Wifi,    color: '#D97706', bg: '#FEF3C7', border: '#FDE68A', label: 'Local Edge LAN', dot: '#F59E0B' },
    OFFLINE:        { icon: WifiOff, color: '#DC2626', bg: '#FEE2E2', border: '#FCA5A5', label: 'Offline',        dot: '#EF4444' },
    CHECKING:       { icon: RefreshCw, color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1', label: 'Checking…',   dot: '#94A3B8' },
  }[status] || {};

  const Icon = cfg.icon;

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16,
      zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
    }}>
      {/* Expanded tooltip */}
      {expanded && (
        <div style={{
          background: '#fff', borderRadius: 12,
          border: '1px solid #E2E8F0',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          padding: '14px 16px', width: 220,
          fontSize: 11.5,
        }}>
          <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: 10, fontSize: 12 }}>
            Sync Status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Server</span>
              <span style={{ color: '#0F172A', fontWeight: 700 }}>{serverType}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Last synced</span>
              <span style={{ color: '#0F172A', fontWeight: 700 }}>
                {lastSync ? lastSync.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Pending changes</span>
              <span style={{ color: pending > 0 ? '#D97706' : '#10B981', fontWeight: 800 }}>
                {pending > 0 ? `${pending} queued` : 'All synced'}
              </span>
            </div>
          </div>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
            <button
              onClick={() => { ping(); setExpanded(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '6px', borderRadius: 7, background: '#F8FAFC', border: '1px solid #E2E8F0',
                color: '#334155', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
            >
              <RefreshCw size={11} /> Check now
            </button>
          </div>
        </div>
      )}

      {/* Main pill */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px 5px 8px',
          borderRadius: 9999,
          background: cfg.bg || '#F1F5F9',
          border: `1px solid ${cfg.border || '#E2E8F0'}`,
          color: cfg.color || '#64748B',
          fontSize: 11, fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          transition: 'all 0.2s',
        }}
      >
        {/* Pulsing status dot */}
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: cfg.dot || '#94A3B8',
          animation: status === 'CLOUD_ONLINE' ? 'none' : 'beaconPulse 2s ease-in-out infinite',
        }} />
        {Icon && <Icon size={12} style={{ animation: status === 'CHECKING' ? 'beaconSpin 1s linear infinite' : 'none' }} />}
        <span>{cfg.label || '—'}</span>
        {pending > 0 && (
          <span style={{
            width: 16, height: 16, borderRadius: '50%',
            background: '#F59E0B', color: '#fff',
            fontSize: 9, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {pending}
          </span>
        )}
        {expanded ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
      </button>

      <style>{`
        @keyframes beaconPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }
        @keyframes beaconSpin  { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

