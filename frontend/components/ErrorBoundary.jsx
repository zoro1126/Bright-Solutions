/**
 * ErrorBoundary.jsx — TASK FE-7.4
 * React Error Boundary with graceful fallback UI.
 * Wrap clinical routes to prevent white-screen crashes.
 */
import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // In production: POST error to /api/v1/frontend-errors
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error } = this.state;
    const label = this.props.label || 'page';

    return (
      <div style={{
        minHeight: '60vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 20,
        padding: 40, background: '#f8fafc',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: '#fee2e2', border: '2px solid #fca5a5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertTriangle size={30} color="#dc2626" />
        </div>

        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>
            Something went wrong
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>
            The {label} encountered an unexpected error. Your work is safe — this component crashed independently.
          </div>
          {error && (
            <div style={{
              padding: '8px 12px', borderRadius: 8, background: '#fee2e2', border: '1px solid #fca5a5',
              fontSize: 11, fontFamily: 'monospace', color: '#991b1b', textAlign: 'left', marginTop: 10,
              maxHeight: 80, overflow: 'auto',
            }}>
              {error.toString()}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 20px', borderRadius: 9, cursor: 'pointer',
              border: '1.5px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 700,
            }}
          >
            <RefreshCw size={14} /> Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 20px', borderRadius: 9, cursor: 'pointer',
              border: 'none', background: 'linear-gradient(135deg,#0077b6,#0369a1)', color: '#fff', fontSize: 12, fontWeight: 700,
            }}
          >
            <Home size={14} /> Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
}
