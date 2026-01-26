
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from './utils';

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
    // Gradient hint on primary for depth
    primary: "bg-brand-900 text-white hover:bg-brand-800 shadow-lg shadow-brand-900/20 border border-brand-900",
    secondary: "bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200",
    outline: "border-2 border-stone-200 bg-transparent hover:border-brand-900 hover:text-brand-900 text-stone-600",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-soft",
    ghost: "bg-transparent hover:bg-stone-100 text-stone-600 hover:text-stone-900",
    white: "bg-white text-brand-900 hover:bg-stone-50 shadow-soft border border-stone-100"
  };

  const sizes = {
    sm: "h-9 px-4 text-xs rounded-lg",
    md: "h-11 px-6 text-sm rounded-xl",
    lg: "h-14 px-8 text-base rounded-2xl", // Taller and more rounded
    xl: "h-16 px-10 text-lg font-bold rounded-2xl"
  };

  return (
    <motion.button 
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none",
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        className
      )} 
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </motion.button>
  );
};
