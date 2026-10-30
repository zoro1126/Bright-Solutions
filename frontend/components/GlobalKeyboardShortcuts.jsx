/**
 * GlobalKeyboardShortcuts.jsx — TASK FE-7.5
 * Global keyboard shortcut handler.
 *
 * Shortcuts:
 *   Alt + R — Register new patient (triggers custom event)
 *   Alt + Q — Jump to OPD queue (/receptionist/token-queue)
 *   Alt + B — Jump to IPD Bed Matrix (/ipd/beds)
 *   Alt + D — Jump to Discharge queue (/ipd/discharge)
 *   Escape  — Close active modal (triggers custom event)
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GlobalKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      // Only fire if not inside an input/textarea
      const inField = ['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName);

      if (e.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('bs:close-modal'));
        return;
      }

      if (!e.altKey || inField) return;

      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('bs:open-register'));
          break;
        case 'q':
          e.preventDefault();
          navigate('/receptionist/token-queue');
          break;
        case 'b':
          e.preventDefault();
          navigate('/ipd/beds');
          break;
        case 'd':
          e.preventDefault();
          navigate('/ipd/discharge');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  return null; // renders nothing
}
