
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from './utils';

// --- Toast System ---
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };
  return { toasts, showToast, removeToast: (id: string) => setToasts(prev => prev.filter(t => t.id !== id)) };
};

export const ToastContainer: React.FC<{ toasts: Toast[], onRemove: (id: string) => void }> = ({ toasts, onRemove }) => (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-auto min-w-[300px] pointer-events-none">
    <AnimatePresence>
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={cn(
            "pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-full shadow-xl border backdrop-blur-md",
            toast.type === 'success' ? "bg-brand-900/90 text-white border-brand-700" :
            toast.type === 'error' ? "bg-red-900/90 text-white border-red-800" :
            "bg-stone-900/90 text-white border-stone-700"
          )}
        >
          {toast.type === 'success' ? <CheckCircle size={16} /> : toast.type === 'error' ? <AlertCircle size={16} /> : <Info size={16} />}
          <p className="text-sm font-medium">{toast.message}</p>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// --- Progress Ring ---
export const ProgressRing: React.FC<{ 
  progress: number, 
  size?: number, 
  stroke?: number,
  trackColor?: string,
  progressColor?: string 
}> = ({ 
  progress, 
  size = 180, 
  stroke = 8,
  trackColor = "text-stone-100",
  progressColor = "text-brand-500"
}) => {
  const radius = (size / 2) - (stroke * 1.5);
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          className={trackColor}
          strokeWidth={stroke}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          className={progressColor}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-serif font-bold text-current">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

// --- Progress Bar ---
export const ProgressBar: React.FC<{ progress: number; className?: string; barClassName?: string }> = ({ progress, className = '', barClassName = "bg-brand-900" }) => (
  <div className={cn("w-full bg-stone-100 rounded-full h-1.5 overflow-hidden", className)}>
    <motion.div 
      className={cn("h-full transition-all duration-700 ease-out", barClassName)} 
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
    />
  </div>
);

// --- Badge ---
export const Badge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const styles: Record<string, string> = {
    OPEN: 'bg-stone-100 text-stone-600',
    LOCKED: 'bg-orange-50 text-orange-700',
    COMPLETED: 'bg-emerald-50 text-emerald-700',
    COLLECTED: 'bg-brand-900 text-white',
  };
  return (
    <span className={cn("inline-flex items-center rounded-full font-medium border border-transparent", size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs', styles[status] || 'bg-stone-100 text-stone-700')}>
      {status}
    </span>
  );
};
