import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false, ...props }) => (
  <div className={cn("bg-white rounded-2xl shadow-soft overflow-hidden", className)} {...props}>
    {noPadding ? children : <div className="p-6 md:p-8">{children}</div>}
  </div>
);