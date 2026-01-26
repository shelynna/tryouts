
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from './utils';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
};

export const ToastContainer: React.FC<{ toasts: Toast[], onRemove: (id: string) => void }> = ({ toasts, onRemove }) => (
  <div className="fixed bottom-6 left-0 right-0 z-[120] flex flex-col items-center gap-3 pointer-events-none px-4">
    <AnimatePresence>
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          layout
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={() => onRemove(toast.id)}
          className={cn(
            "pointer-events-auto cursor-pointer flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl relative overflow-hidden min-w-[300px] max-w-md",
            toast.type === 'success' ? "bg-stone-900/90 text-white border-stone-800" :
            toast.type === 'error' ? "bg-red-600/90 text-white border-red-500" :
            "bg-white/90 text-stone-900 border-stone-200"
          )}
        >
          {/* Icon */}
          <div className={cn(
              "shrink-0 rounded-full p-1",
              toast.type === 'success' ? "bg-emerald-500 text-white" :
              toast.type === 'error' ? "bg-white/20 text-white" :
              "bg-brand-100 text-brand-600"
          )}>
             {toast.type === 'success' ? <CheckCircle size={18} strokeWidth={2.5} /> : 
              toast.type === 'error' ? <AlertCircle size={18} strokeWidth={2.5} /> : 
              <Info size={18} strokeWidth={2.5} />}
          </div>

          <div className="flex-1 pr-4">
             <p className="text-sm font-bold leading-tight">{toast.message}</p>
          </div>

          <button onClick={(e) => { e.stopPropagation(); onRemove(toast.id); }} className="opacity-50 hover:opacity-100 transition-opacity">
              <X size={16} />
          </button>

          {/* Progress Bar */}
          <motion.div 
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 4, ease: "linear" }}
            className={cn(
                "absolute bottom-0 left-0 h-1",
                toast.type === 'success' ? "bg-emerald-500" :
                toast.type === 'error' ? "bg-white/30" :
                "bg-brand-500"
            )}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);
