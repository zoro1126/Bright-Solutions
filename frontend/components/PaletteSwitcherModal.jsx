import React from 'react';
import { Palette, Check, X, Sparkles } from 'lucide-react';
import { PALETTES } from '../utils/themes';

export default function PaletteSwitcherModal({
  isOpen,
  currentPaletteId,
  onSelectPalette,
  onClose
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '820px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <div className="modal-title-icon" style={{ background: '#FACC15', color: '#0A2540' }}>
              <Palette size={22} />
            </div>
            <div>
              <h2>Bright Solutions Color Themes</h2>
              <p>10 Coherent Hospital Palettes featuring Yellow as Dominant Primary</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close palette selector">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: 10 Grid Cards */}
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1rem'
          }}>
            {PALETTES.map((palette) => {
              const isActive = palette.id === currentPaletteId;
              return (
                <div
                  key={palette.id}
                  onClick={() => onSelectPalette(palette.id)}
                  style={{
                    background: '#FFFFFF',
                    border: isActive ? '2px solid var(--blue-500)' : '1px solid var(--border-light)',
                    borderRadius: '12px',
                    padding: '1.1rem',
                    cursor: 'pointer',
                    transition: 'all 180ms ease',
                    boxShadow: isActive ? '0 4px 16px rgba(0, 85, 255, 0.15)' : 'var(--shadow-sm)',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--ochre-400)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--border-light)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {/* Active Badge */}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'var(--blue-500)',
                      color: '#FFFFFF',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0, 85, 255, 0.3)'
                    }}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}

                  {/* 4-Stripe Color Swatch Bar */}
                  <div style={{
                    display: 'flex',
                    height: '28px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    marginBottom: '0.85rem',
                    border: '1px solid rgba(0,0,0,0.08)'
                  }}>
                    {palette.swatches.map((color, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          flex: 1, 
                          backgroundColor: color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }} 
                      />
                    ))}
                  </div>

                  {/* Titles */}
                  <div style={{ paddingRight: isActive ? '2rem' : '0' }}>
                    <div style={{
                      fontFamily: 'var(--font-serif)',
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: 'var(--navy-900)'
                    }}>
                      {palette.name}
                    </div>
                    <div style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      marginTop: '0.2rem'
                    }}>
                      {palette.subtitle}
                    </div>
                  </div>

                  {/* Micro Specs */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '0.75rem',
                    fontSize: '0.72rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <span style={{
                      background: 'var(--navy-50)',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      fontFamily: 'monospace'
                    }}>
                      Primary: {palette.primaryYellow}
                    </span>
                    <span>•</span>
                    <span style={{
                      background: 'var(--navy-50)',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      fontFamily: 'monospace'
                    }}>
                      Base: {palette.complementary}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={14} color="#B89C14" />
            <span>Theme choice is saved locally across sessions.</span>
          </div>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done & Apply
          </button>
        </div>
      </div>
    </div>
  );
}
