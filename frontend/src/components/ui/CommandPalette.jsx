import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Stethoscope, Receipt, Shield, ArrowRight, X } from 'lucide-react';
import { ROUTES } from '../../routes';

export function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const actions = [
    { id: 'p1', title: 'Ramesh Patel (UHID-2026-00002)', category: 'Patient', sub: 'Token #Q-102 • Stage 1 HTN', route: '/doctor/patient/2', icon: User },
    { id: 'p2', title: 'Sunita Rao (UHID-2026-00004)', category: 'Patient', sub: 'Token #Q-104 • Stage 2 HTN', route: '/doctor/patient/4', icon: User },
    { id: 'p3', title: 'Ananya Sharma (UHID-2026-00001)', category: 'Patient', sub: 'Token #Q-101 • Routine', route: '/doctor/patient/1', icon: User },
    { id: 'nav1', title: 'Receptionist Intake & Triage', category: 'Navigation', sub: 'New Patient Walk-in', route: ROUTES.RECEPTIONIST.INTAKE, icon: User },
    { id: 'nav2', title: 'Clinical Intake Questionnaire', category: 'Navigation', sub: 'MCQ & Voice Dictation', route: ROUTES.RECEPTIONIST.QUESTIONNAIRE, icon: Stethoscope },
    { id: 'nav3', title: 'Doctor Clinical Dashboard', category: 'Navigation', sub: 'Queue & Triage Risk', route: ROUTES.DOCTOR.DASHBOARD, icon: Stethoscope },
    { id: 'nav4', title: 'Cashier Checkout Desk', category: 'Navigation', sub: 'Itemized Billing & UPI QR', route: ROUTES.CASHIER.DASHBOARD, icon: Receipt },
    { id: 'nav5', title: 'Admin Executive Governance', category: 'Navigation', sub: 'Hospital Analytics & Staff', route: ROUTES.ADMIN.DASHBOARD, icon: Shield },
  ];

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase()) ||
    a.sub.toLowerCase().includes(query.toLowerCase())
  );

  // Focus input smoothly without layout flicker when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle keyboard navigation: Esc, Arrows, Enter
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length ? (prev + 1) % filtered.length : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          handleSelect(filtered[selectedIndex]);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  function handleSelect(action) {
    onClose();
    navigate(action.route);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 p-3 sm:p-4">
          {/* Hardware-accelerated smooth backdrop without blur spike to avoid paint flutter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#051A30]/60"
          />

          {/* Crisp, non-spring modal window */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-xl bg-white dark:bg-[#0A2540] text-[#051A30] dark:text-white rounded-2xl shadow-2xl border border-[#CBD5E1] dark:border-[#1B456E] overflow-hidden"
          >
            {/* Input Header */}
            <div className="px-3.5 py-3 border-b border-[#E2E8F0] dark:border-[#1B456E] flex items-center gap-3 bg-white dark:bg-[#0A2540]">
              <Search className="w-4.5 h-4.5 text-[#64748B] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Type patient name, UHID, or workspace shortcut..."
                className="w-full bg-transparent text-xs sm:text-sm text-[#0A2540] dark:text-white placeholder-[#94A3B8] focus:outline-none"
              />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F1F5F9] dark:bg-[#1B456E] text-[#64748B] shrink-0">
                ESC
              </span>
            </div>

            {/* Results List */}
            <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
              {filtered.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#64748B]">
                  No matching patients or navigation actions found.
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-left group transition-colors ${
                        isSelected
                          ? 'bg-[#FAF6EC] dark:bg-[#0F355A]'
                          : 'hover:bg-[#FAF6EC] dark:hover:bg-[#0F355A]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg shrink-0 ${
                            isSelected
                              ? 'bg-[#FFC21A] text-[#0A2540]'
                              : 'bg-[#E2E8F0] dark:bg-[#1B456E] text-[#0A2540] dark:text-[#FFC21A]'
                          }`}
                        >
                          <item.icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-[#051A30] dark:text-white truncate">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">
                            {item.sub}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#FFC21A] text-[#0A2540] font-bold'
                            : 'bg-[#E2E8F0]/60 dark:bg-[#1B456E]/60 text-[#64748B] dark:text-[#94A3B8]'
                        }`}
                      >
                        {item.category}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer keyboard hint */}
            <div className="px-3.5 py-2 bg-[#FAF6EC] dark:bg-[#071D33] border-t border-[#EAE4D3] dark:border-[#1B456E] flex items-center justify-between text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono">
              <div className="flex items-center gap-2">
                <span>↑↓ Navigate</span>
                <span>•</span>
                <span>↵ Select</span>
              </div>
              <span>Press ESC to exit</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
