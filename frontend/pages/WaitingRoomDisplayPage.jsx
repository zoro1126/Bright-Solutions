/**
 * WaitingRoomDisplayPage.jsx — TASK-FE-6.1
 * Route: /display/waiting-room
 *
 * Clean clinical white fullscreen TV display for hospital waiting room.
 * Zero PHI: Token # + Doctor + Room + Status only — NO full patient name.
 * SSE stream from /api/v1/display/queue/stream
 * Web Audio API chime on token change (no external audio file required)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Volume2 } from 'lucide-react';

// ─── Web Audio API chime (no audio file dependency) ──────────────────────────
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.7);
  } catch { /* audio not available */ }
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_STATE = {
  nowServing: { token: 14, doctor: 'Dr. Sharma', room: 'Cabin 01', status: 'CALLING' },
  queue: [
    { token: 15, doctor: 'Dr. Sharma',  room: 'Cabin 01', status: 'NEXT'    },
    { token: 16, doctor: 'Dr. Mehta',   room: 'Cabin 02', status: 'WAITING' },
    { token: 17, doctor: 'Dr. Sharma',  room: 'Cabin 01', status: 'WAITING' },
    { token: 18, doctor: 'Dr. Gupta',   room: 'Cabin 03', status: 'WAITING' },
    { token: 19, doctor: 'Dr. Mehta',   room: 'Cabin 02', status: 'WAITING' },
  ],
};

function Clock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '3.6vw', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace', lineHeight: 1, letterSpacing: '-0.02em' }}>
        {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
      </div>
      <div style={{ fontSize: '1.1vw', color: '#64748b', fontWeight: 700, marginTop: 4 }}>
        {time.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    CALLING:        { label: '📢 CALLING',        bg: '#eff6ff', border: '#3b82f6', color: '#1d4ed8' },
    IN_CONSULTATION:{ label: '🩺 IN CONSULT',     bg: '#f0fdf4', border: '#22c55e', color: '#15803d' },
    NEXT:           { label: '⏭ NEXT',            bg: '#fffbeb', border: '#f59e0b', color: '#b45309' },
    WAITING:        { label: '⏳ WAITING',         bg: '#f8fafc', border: '#cbd5e1', color: '#64748b' },
  }[status] || { label: status, bg: '#f8fafc', border: '#cbd5e1', color: '#64748b' };

  return (
    <span style={{
      padding: '6px 16px', borderRadius: 9999,
      background: cfg.bg, border: `1.5px solid ${cfg.border}`, color: cfg.color,
      fontSize: '1.1vw', fontWeight: 800, letterSpacing: '0.04em',
    }}>
      {cfg.label}
    </span>
  );
}

export default function WaitingRoomDisplayPage() {
  const [state, setState]         = useState(MOCK_STATE);
  const [connected, setConnected] = useState(false);
  const prevTokenRef              = useRef(null);
  const sseRef                    = useRef(null);

  // ── SSE connection ─────────────────────────────────────────────────────────
  const connectSSE = useCallback(() => {
    if (sseRef.current) sseRef.current.close();

    try {
      const es = new EventSource('/api/v1/display/queue/stream');
      sseRef.current = es;

      es.onopen = () => setConnected(true);

      es.addEventListener('QUEUE_UPDATE', (e) => {
        try {
          const data = JSON.parse(e.data);
          const newToken = data.now_serving?.token;
          if (newToken && newToken !== prevTokenRef.current) {
            playChime();
            prevTokenRef.current = newToken;
          }
          setState({
            nowServing: data.now_serving || state.nowServing,
            queue: data.queue || state.queue,
          });
        } catch { /* ignore malformed event */ }
      });

      es.onerror = () => {
        setConnected(false);
        es.close();
        setTimeout(pollFallback, 10_000);
      };
    } catch {
      setTimeout(pollFallback, 5000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Polling fallback ───────────────────────────────────────────────────────
  const pollFallback = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/display/queue/current');
      if (res.ok) {
        const data = await res.json();
        const newToken = data.now_serving?.token;
        if (newToken && newToken !== prevTokenRef.current) {
          playChime();
          prevTokenRef.current = newToken;
        }
        setState({
          nowServing: data.now_serving || state.nowServing,
          queue: data.queue || state.queue,
        });
        setConnected(true);
      }
    } catch { /* API offline — keep mock */ }
    setTimeout(pollFallback, 10_000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    connectSSE();
    return () => { sseRef.current?.close(); };
  }, [connectSSE]);

  const { nowServing, queue } = state;

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#ffffff', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      {/* ── Top bar: Hospital name + Back button + Clock ──────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '2vh 3.5vw',
        borderBottom: '2px solid #e2e8f0',
        background: '#ffffff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => window.location.href = '/receptionist/dashboard'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8,
              background: '#f8fafc', border: '1.5px solid #cbd5e1',
              color: '#334155', fontSize: '0.95vw', fontWeight: 700, cursor: 'pointer',
            }}
            title="Return to OPD Reception"
          >
            <ArrowLeft size={16} /> Back to OPD
          </button>
          <div>
            <div style={{ fontSize: '2.2vw', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
              Bright Solutions Hospital
            </div>
            <div style={{ fontSize: '1vw', color: '#0284c7', fontWeight: 700, marginTop: 4 }}>
              OPD Consultation Live Queue Display
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button
            onClick={playChime}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8,
              background: '#f1f5f9', border: '1px solid #cbd5e1',
              color: '#475569', fontSize: '0.85vw', fontWeight: 600, cursor: 'pointer',
            }}
            title="Test announcement chime"
          >
            <Volume2 size={14} /> Chime Test
          </button>
          <Clock />
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden', background: '#f8fafc' }}>

        {/* NOW SERVING — large left panel */}
        <div style={{
          flex: '1.3', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          borderRight: '2px solid #e2e8f0',
          padding: '2vh 4vw',
          background: '#ffffff',
        }}>
          <div style={{
            fontSize: '1.3vw', color: '#0284c7', fontWeight: 900,
            letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1vh',
          }}>
            Now Serving
          </div>

          {/* Giant token number */}
          <div style={{
            fontSize: '17vw', fontWeight: 900, color: '#0077b6',
            fontFamily: 'monospace', lineHeight: 0.85,
            letterSpacing: '-0.04em',
            margin: '1.5vh 0',
          }}>
            {nowServing?.token ?? '—'}
          </div>

          <div style={{ marginTop: '1vh', textAlign: 'center' }}>
            <div style={{ fontSize: '3vw', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
              {nowServing?.doctor || '—'}
            </div>
            <div style={{ fontSize: '1.6vw', color: '#475569', fontWeight: 700, marginTop: '0.4vh' }}>
              {nowServing?.room || '—'}
            </div>
          </div>

          <div style={{ marginTop: '2.5vh' }}>
            <StatusBadge status={nowServing?.status || 'CALLING'} />
          </div>

          {/* Connection dot */}
          <div style={{
            marginTop: '3vh', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.9vw', color: '#64748b', fontWeight: 600,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: connected ? '#10B981' : '#F59E0B',
            }} />
            {connected ? 'Live Network Connected' : 'Local Queue Active'}
          </div>
        </div>

        {/* QUEUE — right panel */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          padding: '3vh 3vw',
          overflow: 'hidden',
          background: '#f8fafc',
        }}>
          <div style={{ fontSize: '1.1vw', color: '#475569', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1.5vh' }}>
            Up Next In Lounge
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2vh', overflow: 'hidden' }}>
            {queue.slice(0, 6).map((item, i) => (
              <div
                key={item.token}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '1.5vh 2vw', borderRadius: 12,
                  background: i === 0 ? '#eff6ff' : '#ffffff',
                  border: `1.5px solid ${i === 0 ? '#3b82f6' : '#e2e8f0'}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  gap: '2vw',
                  opacity: i >= 4 ? 0.6 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {/* Token */}
                <div style={{
                  fontSize: '2.8vw', fontWeight: 900,
                  color: i === 0 ? '#1d4ed8' : '#334155',
                  fontFamily: 'monospace', lineHeight: 1, minWidth: '5vw', textAlign: 'right',
                }}>
                  {item.token}
                </div>
                {/* Doctor + Room */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.3vw', fontWeight: 800, color: '#0f172a' }}>
                    {item.doctor}
                  </div>
                  <div style={{ fontSize: '0.95vw', color: '#64748b', fontWeight: 600 }}>
                    {item.room}
                  </div>
                </div>
                {/* Status */}
                <StatusBadge status={item.status} />
              </div>
            ))}
            {queue.length === 0 && (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: '1.2vw', padding: '4vh 0' }}>
                No patients in queue
              </div>
            )}
          </div>

          {/* Footer notice */}
          <div style={{ marginTop: 'auto', paddingTop: '2vh', borderTop: '1.5px solid #e2e8f0', fontSize: '0.9vw', color: '#64748b', lineHeight: 1.5 }}>
            🔔 Please listen for your token announcement and proceed to the indicated cabin.<br />
            Kindly maintain silence and order in the consultation waiting lounge.
          </div>
        </div>
      </div>
    </div>
  );
}
