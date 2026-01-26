
import React from 'react';
import { cn } from './utils';
import { ChevronDown } from 'lucide-react';

export const Select: React.FC<{ label?: string; options: { label: string; value: string }[]; className?: string; error?: string; [key: string]: any }> = ({ label, options, className = '', error, ...props }) => {
  return (
    <div className="w-full text-left space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        <select 
          className={cn(
            "appearance-none w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-900 font-medium focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20 transition-all cursor-pointer h-12 shadow-sm",
            error ? 'border-red-300 ring-red-100' : '',
            className
          )}
          {...props}
        >
          {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-500">
           <ChevronDown size={16} />
        </div>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};
