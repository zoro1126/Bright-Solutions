/**
 * TVDisplayLayout.jsx — Chromeless Waiting Room TV (D15 §2.6)
 * Zero auth, zero chrome, fullscreen dark.
 */
import React from 'react';

export default function TVDisplayLayout({ children }) {
  return (
    <div style={{
      width: '100vw', height: '100vh',
      overflow: 'hidden', background: '#0F172A',
      display: 'flex', flexDirection: 'column',
    }}>
      {children}
    </div>
  );
}

