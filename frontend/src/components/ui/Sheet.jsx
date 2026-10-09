import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export function Sheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-2xl',
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
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop with subtle glass blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#051A30]/50 backdrop-blur-sm"
          />

          {/* Drawer Surface */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className={`relative z-10 w-full ${width} bg-white dark:bg-[#0A2540] text-[#051A30] dark:text-white shadow-2xl flex flex-col h-full border-l border-[#CBD5E1] dark:border-[#1B456E]`}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#E2E8F0] dark:border-[#1B456E] flex items-center justify-between bg-white dark:bg-[#0A2540] shrink-0">
              <div>
                <h2 className="text-lg font-bold text-[#0A2540] dark:text-white tracking-tight">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5 font-mono">
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-[#64748B] hover:text-[#0A2540] dark:hover:text-white hover:bg-[#F6F7FA] dark:hover:bg-[#0F355A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFC21A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
