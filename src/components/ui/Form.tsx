
import React, { useRef } from 'react';
import { cn } from './utils';
import { ChevronDown } from 'lucide-react';

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-brand-600 transition-colors z-10">
            {icon}
          </div>
        )}
        <input 
          className={cn(
            "block w-full rounded-xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-300 transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none h-12",
            icon ? 'pl-11 pr-4' : 'px-4',
            error ? 'bg-red-50 text-red-900 border-red-200 focus:border-red-500 focus:ring-red-200' : '',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
        <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
        {error}
      </p>}
    </div>
  );
};

// --- OTP Input ---
export const OTPInput: React.FC<{ value: string; onChange: (val: string) => void }> = ({ value, onChange }) => {
  const inputs = useRef<HTMLInputElement[]>([]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const char = e.target.value.slice(-1);
    if (!char) return;
    const newVal = value.split('');
    newVal[index] = char;
    const finalVal = newVal.join('');
    onChange(finalVal);
    if (index < 3) inputs.current[index + 1].focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  return (
    <div className="flex justify-center gap-3">
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el!; }}
          type="text"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="w-14 h-16 text-center text-2xl font-serif font-bold rounded-xl bg-white border border-stone-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all"
        />
      ))}
    </div>
  );
};

// --- Select ---
export const Select: React.FC<{ label?: string; options: { label: string; value: string }[]; className?: string; [key: string]: any }> = ({ label, options, className = '', ...props }) => {
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
            "appearance-none w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-900 font-medium focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all cursor-pointer h-12",
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
    </div>
  );
};
