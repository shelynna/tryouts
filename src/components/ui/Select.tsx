
import React from 'react';
import { cn } from '../../lib/utils';
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
            "appearance-none w-full rounded-xl bg-white px-4 py-3 text-stone-900 font-medium focus:ring-2 focus:ring-brand-500/80 focus:outline-none transition-all cursor-pointer h-12 shadow-sm",
            error ? 'ring-1 ring-red-400' : 'bg-stone-50 focus:bg-white',
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