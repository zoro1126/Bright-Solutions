import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, message, type = 'success', duration = 4000, onUndo }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type, onUndo }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const icons = {
              success: <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />,
              warning: <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0" />,
              error: <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" />,
              info: <Info className="w-5 h-5 text-[#38BDF8] shrink-0" />,
            };

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="pointer-events-auto bg-[#0A2540] text-white p-4 rounded-xl shadow-xl border border-[#1B456E] flex items-start gap-3"
              >
                {icons[t.type] || icons.info}
                <div className="flex-1 min-w-0">
                  {t.title && <h4 className="text-xs font-bold tracking-tight text-white">{t.title}</h4>}
                  <p className="text-xs text-[#CBD5E1] mt-0.5 leading-relaxed">{t.message}</p>
                  {t.onUndo && (
                    <button
                      type="button"
                      onClick={() => {
                        t.onUndo();
                        removeToast(t.id);
                      }}
                      className="mt-2 text-xs font-bold text-[#FFC21A] hover:underline"
                    >
                      Undo Action
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="p-1 rounded-lg text-[#64748B] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
