
import React, { useState } from 'react';
import { cn } from './utils';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, helperText, className = '', type, required, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-sm font-bold text-stone-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-stone-900 transition-colors z-10">
            {icon}
          </div>
        )}
        <input 
          type={inputType}
          className={cn(
            "block w-full rounded-lg bg-white text-stone-900 placeholder:text-stone-400 font-medium transition-all duration-200",
            "border border-stone-300 focus:border-stone-900",
            "focus:outline-none focus:ring-2 focus:ring-stone-900/10",
            "h-12 shadow-sm",
            icon ? 'pl-11 pr-4' : 'px-4',
            isPassword ? 'pr-12' : '',
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : '',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-400 hover:text-stone-600 focus:outline-none transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500 font-bold flex items-center gap-1">
        {error}
      </p>}
      {!error && helperText && <p className="mt-1.5 text-xs text-stone-500">{helperText}</p>}
    </div>
  );
};
