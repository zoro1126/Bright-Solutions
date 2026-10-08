import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Stethoscope, Receipt, Shield, ArrowRight, X } from 'lucide-react';
import { ROUTES } from '../../routes';

export function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  function handleSelect(action) {
    onClose();
    navigate(action.route);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#051A30]/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative z-10 w-full max-w-xl bg-white dark:bg-[#0A2540] text-[#051A30] dark:text-white rounded-2xl shadow-2xl border border-[#CBD5E1] dark:border-[#1B456E] overflow-hidden"
          >
            {/* Input Header */}
            <div className="px-4 py-3.5 border-b border-[#E2E8F0] dark:border-[#1B456E] flex items-center gap-3">
              <Search className="w-5 h-5 text-[#64748B]" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a patient name, UHID, or workspace shortcut..."
                className="w-full bg-transparent text-sm placeholder-[#94A3B8] focus:outline-none"
              />
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F1F5F9] dark:bg-[#1B456E] text-[#64748B]">
                ESC
              </span>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#64748B]">
                  No matching patients or navigation actions found.
                </div>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-left hover:bg-[#F6F7FA] dark:hover:bg-[#0F355A] group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#E2E8F0] dark:bg-[#1B456E] text-[#0A2540] dark:text-[#FFE500]">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#051A30] dark:text-white">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                          {item.sub}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#E2E8F0]/60 dark:bg-[#1B456E]/60 text-[#64748B] dark:text-[#94A3B8] group-hover:bg-[#FFE500] group-hover:text-[#051A30] transition-colors">
                      {item.category}
                    </span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
