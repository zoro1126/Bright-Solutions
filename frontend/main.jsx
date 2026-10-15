import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Exception caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: 24,
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: 520,
            width: '100%',
            background: '#ffffff',
            borderRadius: 16,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            padding: 32,
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 24,
              fontWeight: 800
            }}>
              !
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
              Something interrupted this view
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 20 }}>
              An unexpected application error occurred. You can reload the page to restore your active session.
            </p>
            {this.state.error?.message && (
              <pre style={{
                textAlign: 'left',
                background: '#f1f5f9',
                padding: 12,
                borderRadius: 8,
                fontSize: 11,
                color: '#334155',
                overflowX: 'auto',
                marginBottom: 20,
                maxHeight: 120
              }}>
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 24px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reload Clinical Workspace
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
