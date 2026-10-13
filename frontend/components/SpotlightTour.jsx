import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWalkthrough } from '../context/WalkthroughContext';
import { usePatients } from '../context/PatientContext';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  RotateCcw,
  MousePointerClick,
  Minus,
  Maximize2,
  Move
} from 'lucide-react';

export default function SpotlightTour({ onSwitchRole, currentRole }) {
  const { 
    isGuideActive, 
    currentStep, 
    totalSteps, 
    currentStepData, 
    stopGuide, 
    nextStep, 
    prevStep, 
    startGuide 
  } = useWalkthrough();

  const { addToast } = usePatients();
  
  const [targetRect, setTargetRect] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragPos, setDragPos] = useState(null); // { x, y } if user drags card
  const activeElementRef = useRef(null);

  // Recalculate target element position
  const updatePosition = useCallback(() => {
    if (!isGuideActive || !currentStepData?.selector) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(currentStepData.selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect(prev => {
          if (
            prev &&
            Math.abs(prev.top - rect.top) < 0.5 &&
            Math.abs(prev.left - rect.left) < 0.5 &&
            Math.abs(prev.width - rect.width) < 0.5 &&
            Math.abs(prev.height - rect.height) < 0.5
          ) {
            return prev;
          }
          return {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            bottom: rect.bottom,
            right: rect.right
          };
        });
        activeElementRef.current = el;
        return;
      }
    }

    setTargetRect(null);
  }, [isGuideActive, currentStepData]);

  // Synchronize role when step requires a specific role
  useEffect(() => {
    if (!isGuideActive || !currentStepData) return;

    if (currentStepData.role && onSwitchRole && currentRole !== currentStepData.role) {
      onSwitchRole(currentStepData.role);
    }
  }, [isGuideActive, currentStep, currentStepData, onSwitchRole, currentRole]);

  // Continuously sync bounding rect during animations & scrolls
  useEffect(() => {
    if (!isGuideActive) return;

    let animFrameId = null;
    const tick = () => {
      updatePosition();
      animFrameId = requestAnimationFrame(tick);
    };
    animFrameId = requestAnimationFrame(tick);

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [isGuideActive, updatePosition]);

  // Try to find target element with retry polling (handles modal animation or tab switching)
  useEffect(() => {
    if (!isGuideActive) return;

    let retryCount = 0;
    const maxRetries = 25;
    let timer = null;

    const tryFind = () => {
      const el = currentStepData?.selector ? document.querySelector(currentStepData.selector) : null;
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const vh = window.innerHeight || document.documentElement.clientHeight;
          const vw = window.innerWidth || document.documentElement.clientWidth;
          const inViewport = (
            rect.top >= 40 &&
            rect.left >= 0 &&
            rect.bottom <= vh - 20 &&
            rect.right <= vw
          );

          if (!inViewport) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

          updatePosition();
          return;
        }
      }

      // Special helper: if target is step 2, 3, or 4 but registration modal is not open, open it
      if ((currentStep === 2 || currentStep === 3 || currentStep === 4) && retryCount === 6) {
        const regBtn = document.querySelector('[data-tour="new-patient-btn"]');
        if (regBtn) regBtn.click();
      }

      // If target is step 12 but cashier popup is not open, open it
      if (currentStep === 12 && retryCount === 6) {
        const settleBtn = document.querySelector('[data-tour="settle-bill-btn"]');
        if (settleBtn) settleBtn.click();
      }

      if (retryCount < maxRetries) {
        retryCount++;
        timer = setTimeout(tryFind, 100);
      } else {
        updatePosition();
      }
    };

    tryFind();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isGuideActive, currentStep, currentStepData, updatePosition]);

  // Direct user click on highlighted element advances the tour!
  useEffect(() => {
    if (!isGuideActive || !activeElementRef.current) return;

    const el = activeElementRef.current;
    const handleTargetClick = () => {
      setTimeout(() => {
        if (currentStep < totalSteps) {
          nextStep();
        } else {
          setShowVictory(true);
        }
      }, 350);
    };

    el.addEventListener('click', handleTargetClick);
    return () => {
      el.removeEventListener('click', handleTargetClick);
    };
  }, [isGuideActive, currentStep, totalSteps, nextStep, targetRect]);

  // Keyboard controls (Arrow keys & Escape)
  useEffect(() => {
    if (!isGuideActive) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        stopGuide();
      } else if (e.key === 'ArrowRight') {
        if (currentStep < totalSteps) nextStep();
        else setShowVictory(true);
      } else if (e.key === 'ArrowLeft') {
        if (currentStep > 1) prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGuideActive, currentStep, totalSteps, nextStep, prevStep, stopGuide]);

  // Auto-action execution when user clicks "⚡ Auto-Click / Do It"
  const handleDoIt = () => {
    setIsExecuting(true);

    if (currentStepData?.selector) {
      const el = document.querySelector(currentStepData.selector);
      if (el) {
        el.click();
        addToast(`🎯 Executed: ${currentStepData.title}`, 'info');
        setTimeout(() => {
          setIsExecuting(false);
          if (currentStep < totalSteps) {
            nextStep();
          } else {
            setShowVictory(true);
          }
        }, 400);
        return;
      }
    }

    setTimeout(() => {
      setIsExecuting(false);
      if (currentStep < totalSteps) {
        nextStep();
      } else {
        setShowVictory(true);
      }
    }, 450);
  };

  // Drag handling so the user can easily reposition the guide card anywhere
  const handleDragStart = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const currentCard = e.currentTarget.closest('.tour-callout-card');
    if (!currentCard) return;
    const rect = currentCard.getBoundingClientRect();
    const initialLeft = rect.left;
    const initialTop = rect.top;

    const onMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const newLeft = Math.max(12, Math.min(window.innerWidth - 370, initialLeft + dx));
      const newTop = Math.max(12, Math.min(window.innerHeight - 250, initialTop + dy));
      setDragPos({ x: newLeft, y: newTop });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  if (!isGuideActive) return null;

  // SMART NON-OVERLAPPING POSITIONING:
  // Ensures the guide callout card NEVER blocks the button that needs to be clicked!
  let tooltipStyle = {};
  let pointerPlacement = 'above';
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const tooltipWidth = 360;
  const tooltipHeight = 240;

  if (dragPos) {
    // User custom dragged position
    tooltipStyle = { top: `${dragPos.y}px`, left: `${dragPos.x}px` };
  } else if (targetRect) {
    // Check if a modal dialog is currently visible on screen
    const isModalActive = !!document.querySelector('.modal-overlay, .m3-dialog-backdrop');

    if (isModalActive) {
      // When a modal dialog is open in the center, park the guide card safely at the bottom corner!
      // This completely guarantees it NEVER overlaps the modal inputs or buttons!
      if (targetRect.left > vw / 2) {
        // Target is on right side of modal -> place card on bottom-left
        tooltipStyle = { bottom: '24px', left: '24px' };
      } else {
        // Target is on left side of modal -> place card on bottom-right
        tooltipStyle = { bottom: '24px', right: '24px' };
      }
      pointerPlacement = targetRect.top > 120 ? 'above' : 'below';
    } else {
      // Non-modal page elements:
      // Place the card on the side of the screen with maximum clearance so it never covers the button or table!
      if (targetRect.left > vw / 2) {
        // Target is on the right half of the screen -> place card comfortably on the left side
        const safeTop = Math.max(70, Math.min(vh - tooltipHeight - 30, targetRect.top - 20));
        tooltipStyle = { top: `${safeTop}px`, left: '24px' };
      } else {
        // Target is on the left half of the screen -> place card comfortably on the right side
        const safeTop = Math.max(70, Math.min(vh - tooltipHeight - 30, targetRect.top - 20));
        tooltipStyle = { top: `${safeTop}px`, right: '24px' };
      }
      pointerPlacement = targetRect.top > 120 ? 'above' : 'below';
    }
  } else {
    // Fallback corner placement
    tooltipStyle = { bottom: '24px', right: '24px' };
  }

  const progressPct = Math.round((currentStep / totalSteps) * 100);

  return (
    <>
      {/* Dimmed Screen Backdrop & Cutout Spotlight */}
      {targetRect && (
        <div 
          className="tour-spotlight-box"
          style={{
            top: `${targetRect.top - 6}px`,
            left: `${targetRect.left - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`
          }}
        >
          {/* Animated Pointer Badge pointing directly to the target */}
          <div className={`tour-spotlight-pointer-badge badge-${pointerPlacement}`}>
            {pointerPlacement === 'above' ? (
              <>
                <span className="pointer-icon">👇</span>
                <span className="pointer-text">CLICK HERE</span>
              </>
            ) : (
              <>
                <span className="pointer-icon">👆</span>
                <span className="pointer-text">CLICK HERE</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Guided Tour Tooltip Callout Card */}
      {isMinimized ? (
        /* Minimized Sleek Pill HUD */
        <div 
          className="tour-callout-minimized anim-hover-lift"
          style={tooltipStyle}
          onClick={() => setIsMinimized(false)}
          title="Click to expand Guide window"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="game-quest-pill" style={{ fontSize: 10, padding: '2px 8px', fontWeight: 700 }}>
              Step {currentStep} of {totalSteps}
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>
              {currentStepData?.title}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              className="tour-btn-auto"
              style={{ height: 26, fontSize: 10.5, padding: '0 8px' }}
              onClick={(e) => {
                e.stopPropagation();
                handleDoIt();
              }}
              disabled={isExecuting}
            >
              <Zap size={11} fill="#ffffff" />
              <span>Auto</span>
            </button>
            <button 
              className="game-hud-ctrl-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(false);
              }}
              title="Expand"
              style={{ width: 22, height: 22 }}
            >
              <Maximize2 size={12} />
            </button>
          </div>
        </div>
      ) : (
        /* Full Expanded Tour Card */
        <div 
          className="tour-callout-card m3-animate-scale"
          style={tooltipStyle}
        >
          {/* Ambient Top Glow */}
          <div className="stat-card-accent-blob blob-yellow" style={{ top: -20, right: -20, width: 100, height: 100, opacity: 0.4 }} />

          {/* Card Header (Draggable) */}
          <div 
            className="tour-card-header" 
            onMouseDown={handleDragStart}
            style={{ cursor: 'grab', userSelect: 'none' }}
            title="Drag to reposition guide anywhere"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Move size={12} color="var(--text-muted)" style={{ opacity: 0.7 }} />
              <span className="game-quest-pill" style={{ fontSize: 10, padding: '2px 8px', fontWeight: 700 }}>
                Step {currentStep} of {totalSteps}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button 
                className="game-hud-ctrl-btn" 
                onClick={() => setIsMinimized(true)} 
                title="Minimize Guide (Free screen view)"
                style={{ width: 24, height: 24 }}
              >
                <Minus size={14} />
              </button>
              <button 
                className="game-hud-ctrl-btn" 
                onClick={stopGuide} 
                title="Exit Tour (Esc)"
                style={{ width: 24, height: 24 }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="tour-card-body">
            <div className="tour-target-badge">
              <MousePointerClick size={12} color="#f59e0b" />
              <span>Target: <strong>{currentStepData?.targetDescription || 'Highlighted Button'}</strong></span>
            </div>

            <h4 className="tour-card-title">
              {currentStepData?.title}
            </h4>
            <p className="tour-card-desc">
              {currentStepData?.description}
            </p>

            <div className="tour-card-hint">
              <Sparkles size={13} color="#f59e0b" style={{ flexShrink: 0 }} />
              <span>{currentStepData?.hint || 'Click the highlighted element on screen to proceed.'}</span>
            </div>
          </div>

          {/* Dynamic Progress Line */}
          <div style={{ height: 3, background: 'var(--border-subtle)', width: '100%' }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${progressPct}%`, 
                background: 'linear-gradient(90deg, #f59e0b, #10b981)', 
                transition: 'width 0.3s ease' 
              }} 
            />
          </div>

          {/* Card Footer Actions */}
          <div className="tour-card-footer">
            <div style={{ display: 'flex', gap: 5 }}>
              <button
                className="tour-btn-nav"
                onClick={prevStep}
                disabled={currentStep === 1 || isExecuting}
                title="Previous Step (Left Arrow)"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                className="tour-btn-nav"
                onClick={nextStep}
                disabled={currentStep === totalSteps || isExecuting}
                title="Next Step (Right Arrow)"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                className="tour-btn-auto anim-hover-lift"
                onClick={handleDoIt}
                disabled={isExecuting}
                title="Auto-click the highlighted button"
              >
                <Zap size={13} fill="#ffffff" />
                <span>{isExecuting ? 'Doing it...' : '⚡ Auto-Click'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Celebration Modal */}
      {showVictory && (
        <div className="modal-overlay m3-dialog-backdrop" onClick={() => setShowVictory(false)}>
          <div 
            className="modal-content m3-dialog-container game-victory-modal m3-animate-scale"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520, textAlign: 'center', padding: '32px 28px' }}
          >
            <div className="victory-trophy-container" style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <CheckCircle2 size={34} color="#059669" />
            </div>

            <span className="game-quest-pill" style={{ margin: '8px auto 6px', fontSize: 10.5, fontWeight: 700, padding: '3px 10px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
              Workflow Walkthrough Complete
            </span>

            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>
              Care Stream Flow Verified
            </h2>
            
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
              You have experienced the complete hospital flow: from <strong>Patient Registration & Triage Vitals</strong>, <strong>AI Triage Screening</strong>, <strong>Diagnostic Imaging</strong>, <strong>Digital Clinical Rx</strong>, through to <strong>100% Cashless PM-JAY Settlement & Official Tax Invoicing</strong>.
            </p>

            <div className="victory-stats-grid">
              <div className="victory-stat-item">
                <span className="victory-stat-val">12 / 12</span>
                <span className="victory-stat-lbl">Steps Completed</span>
              </div>
              <div className="victory-stat-item">
                <span className="victory-stat-val">3 Roles</span>
                <span className="victory-stat-lbl">Reception • Doctor • Cashier</span>
              </div>
              <div className="victory-stat-item">
                <span className="victory-stat-val">100%</span>
                <span className="victory-stat-lbl">Cashless Settled</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
              <button 
                className="m3-btn m3-btn-outlined"
                onClick={() => {
                  setShowVictory(false);
                  startGuide();
                }}
              >
                <RotateCcw size={14} />
                <span>Replay Walkthrough</span>
              </button>
              <button 
                className="m3-btn m3-btn-filled"
                onClick={() => {
                  setShowVictory(false);
                  stopGuide();
                }}
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#ffffff' }}
              >
                <span>Free Exploration Mode</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
