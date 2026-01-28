
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

const MotionButton = motion.button as any;

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'white' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', size = 'md', fullWidth = false, loading = false, className = '', ...props 
}) => {
  const variants = {
    primary: "bg-brand-900 text-white hover:bg-brand-800 focus-visible:outline-brand-600 shadow-lg shadow-brand-900/20 border border-transparent",
    secondary: "bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-200",
    outline: "border border-stone-300 bg-transparent hover:bg-stone-50 text-stone-700 hover:text-stone-900",
    danger: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20",
    ghost: "bg-transparent hover:bg-stone-100 text-stone-600 hover:text-stone-900",
    white: "bg-white text-brand-900 hover:bg-stone-50 shadow-soft border border-stone-100"
  };

  const sizes = {
    sm: "h-9 px-4 text-xs rounded-lg",
    md: "h-11 px-6 text-sm rounded-xl",
    lg: "h-12 px-8 text-base rounded-xl",
    xl: "h-14 px-10 text-base font-bold rounded-2xl"
  };

  return (
    <MotionButton 
      whileTap={{ scale: loading || props.disabled ? 1 : 0.98 }}
      whileHover={{ y: loading || props.disabled ? 0 : -2 }}
      className={cn(
        "inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none",
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        className
      )} 
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <i className="bx bx-loader-alt bx-spin mr-2 text-lg"></i>
      ) : null}
      {children}
    </MotionButton>
  );
};
