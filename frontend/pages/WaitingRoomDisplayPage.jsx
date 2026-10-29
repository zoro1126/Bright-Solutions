/**
 * WaitingRoomDisplayPage.jsx — TASK-FE-6.1
 * Route: /display/waiting-room
 *
 * Chromeless fullscreen TV display for hospital waiting room.
 * Zero PHI: Token # + Doctor + Room + Status only — NO full patient name.
 * SSE stream from /api/v1/display/queue/stream
 * Web Audio API chime on token change (no external audio file required)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

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
      <div style={{ fontSize: '4vw', fontWeight: 900, color: '#94A3B8', fontFamily: 'monospace', lineHeight: 1, letterSpacing: '-0.02em' }}>
        {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
      </div>
      <div style={{ fontSize: '1.2vw', color: '#475569', fontWeight: 600, marginTop: 4 }}>
        {time.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    CALLING:        { label: '📢 CALLING',        bg: '#06B6D4', color: '#fff' },
    IN_CONSULTATION:{ label: '🩺 IN CONSULT',     bg: '#0D9488', color: '#fff' },
    NEXT:           { label: '⏭ NEXT',            bg: '#F59E0B', color: '#fff' },
    WAITING:        { label: '⏳ WAITING',         bg: '#334155', color: '#94A3B8' },
  }[status] || { label: status, bg: '#334155', color: '#94A3B8' };

  return (
    <span style={{
      padding: '4px 14px', borderRadius: 9999,
      background: cfg.bg, color: cfg.color,
      fontSize: '1.1vw', fontWeight: 800, letterSpacing: '0.05em',
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
        // Fallback to polling every 10s
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
    // Schedule next poll
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
      background: '#0F172A', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
    }}>
      {/* ── Top bar: Hospital name + Clock ────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '2.5vh 4vw 0',
        borderBottom: '1px solid #1E293B',
        paddingBottom: '1.5vh',
      }}>
        <div>
          <div style={{ fontSize: '2.5vw', fontWeight: 900, color: '#F1F5F9', letterSpacing: '-0.03em', lineHeight: 1 }}>
            Bright Solutions
          </div>
          <div style={{ fontSize: '1vw', color: '#475569', fontWeight: 600, marginTop: 4 }}>
            OPD Consultation Queue Display
          </div>
        </div>
        <Clock />
      </div>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>

        {/* NOW SERVING — large panel */}
        <div style={{
          flex: '1.4', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          borderRight: '1px solid #1E293B',
          padding: '2vh 4vw',
        }}>
          <div style={{ fontSize: '1.2vw', color: '#06B6D4', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1.5vh' }}>
            Now Serving
          </div>

          {/* Giant token number */}
          <div style={{
            fontSize: '18vw', fontWeight: 900, color: '#06B6D4',
            fontFamily: 'monospace', lineHeight: 0.85,
            letterSpacing: '-0.05em',
            textShadow: '0 0 60px rgba(6,182,212,0.4)',
            animation: 'tokenGlow 3s ease-in-out infinite',
          }}>
            {nowServing?.token ?? '—'}
          </div>

          <div style={{ marginTop: '2vh', textAlign: 'center' }}>
            <div style={{ fontSize: '3.2vw', fontWeight: 800, color: '#E2E8F0', letterSpacing: '-0.02em' }}>
              {nowServing?.doctor || '—'}
            </div>
            <div style={{ fontSize: '1.6vw', color: '#64748B', fontWeight: 600, marginTop: '0.5vh' }}>
              {nowServing?.room || '—'}
            </div>
          </div>

          <div style={{ marginTop: '2.5vh' }}>
            <StatusBadge status={nowServing?.status || 'CALLING'} />
          </div>

          {/* Connection dot */}
          <div style={{
            marginTop: '3vh', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.9vw', color: '#334155',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: connected ? '#10B981' : '#F59E0B',
              animation: 'beaconPulse 2s ease-in-out infinite',
            }} />
            {connected ? 'Live' : 'Polling'}
          </div>
        </div>

        {/* QUEUE — right panel */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          padding: '3vh 3vw',
          overflow: 'hidden',
        }}>
          <div style={{ fontSize: '1.1vw', color: '#475569', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1.5vh' }}>
            Up Next
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2vh', overflow: 'hidden' }}>
            {queue.slice(0, 6).map((item, i) => (
              <div
                key={item.token}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '1.5vh 2vw', borderRadius: '1vw',
                  background: i === 0 ? '#1E3A5F' : '#0D1B2A',
                  border: `1px solid ${i === 0 ? '#2563EB' : '#1E293B'}`,
                  gap: '2vw',
                  opacity: i >= 4 ? 0.5 : 1,
                  transition: 'all 0.3s',
                }}
              >
                {/* Token */}
                <div style={{ fontSize: '3vw', fontWeight: 900, color: i === 0 ? '#93C5FD' : '#64748B', fontFamily: 'monospace', lineHeight: 1, minWidth: '5vw', textAlign: 'right' }}>
                  {item.token}
                </div>
                {/* Doctor + Room */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.4vw', fontWeight: 700, color: i === 0 ? '#E2E8F0' : '#94A3B8' }}>
                    {item.doctor}
                  </div>
                  <div style={{ fontSize: '1vw', color: '#475569', fontWeight: 600 }}>
                    {item.room}
                  </div>
                </div>
                {/* Status */}
                <StatusBadge status={item.status} />
              </div>
            ))}
            {queue.length === 0 && (
              <div style={{ textAlign: 'center', color: '#334155', fontSize: '1.2vw', padding: '4vh 0' }}>
                No patients in queue
              </div>
            )}
          </div>

          {/* Footer notice */}
          <div style={{ marginTop: 'auto', paddingTop: '2vh', borderTop: '1px solid #1E293B', fontSize: '0.9vw', color: '#334155', lineHeight: 1.5 }}>
            🔔 Please listen for your token announcement and proceed to the indicated cabin.<br />
            Kindly maintain social distancing in the waiting area.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tokenGlow   { 0%, 100% { text-shadow: 0 0 60px rgba(6,182,212,0.4); } 50% { text-shadow: 0 0 90px rgba(6,182,212,0.7); } }
        @keyframes beaconPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}

