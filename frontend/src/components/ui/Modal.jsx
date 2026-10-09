import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-xl',
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#051A30]/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative z-10 w-full ${maxWidth} bg-white dark:bg-[#0A2540] text-[#051A30] dark:text-white rounded-2xl shadow-2xl border border-[#CBD5E1] dark:border-[#1B456E] overflow-hidden max-h-[90vh] flex flex-col`}
          >
            <div className="px-6 py-4.5 border-b border-[#E2E8F0] dark:border-[#1B456E] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-[#0A2540] dark:text-white tracking-tight">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5 font-mono">
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-[#64748B] hover:text-[#0A2540] dark:hover:text-white hover:bg-[#F6F7FA] dark:hover:bg-[#0F355A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFC21A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
