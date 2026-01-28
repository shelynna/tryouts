
import React, { useState, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, helperText, className = '', type, required, ...props }, ref) => {
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
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-brand-600 transition-colors z-10">
              {icon}
            </div>
          )}
          <input 
            ref={ref}
            type={inputType}
            className={cn(
              "block w-full rounded-xl bg-white text-stone-900 placeholder:text-stone-400 font-medium transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-brand-500/80",
              "h-12 shadow-sm",
              icon ? 'pl-12 pr-4' : 'px-4',
              isPassword ? 'pr-12' : '',
              error ? 'ring-2 ring-red-400 focus:ring-red-500' : 'bg-stone-50 focus:bg-white',
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
              {showPassword ? <i className='bx bx-hide text-xl'></i> : <i className='bx bx-show text-xl'></i>}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-600 font-bold flex items-center gap-1">
          {error}
        </p>}
        {!error && helperText && <p className="mt-1 text-xs text-stone-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
