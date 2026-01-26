
import React from 'react';
import { cn } from './utils';

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; noPadding?: boolean }> = ({ children, className = '', noPadding = false }) => (
  <div className={cn("bg-white rounded-2xl shadow-soft border border-stone-100/50 overflow-hidden", className)}>
    {noPadding ? children : <div className="p-6 md:p-8">{children}</div>}
  </div>
);

// --- Tabs ---
export const Tabs: React.FC<{ 
  items: { id: string; label: string; icon?: React.ReactNode }[]; 
  activeId: string; 
  onChange: (id: string) => void;
  className?: string;
}> = ({ items, activeId, onChange, className = '' }) => {
  return (
    <div className={cn("flex gap-1 border-b border-stone-200 overflow-x-auto no-scrollbar", className)}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            "flex items-center gap-2 px-6 py-3 border-b-2 transition-all text-sm font-medium whitespace-nowrap",
            activeId === item.id 
              ? "border-brand-900 text-brand-900" 
              : "border-transparent text-stone-500 hover:text-brand-700 hover:border-stone-300"
          )}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
};
