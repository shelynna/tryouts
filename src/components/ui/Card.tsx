
import React from 'react';
import { cn } from '../../lib/utils';

export const Card: React.FC<{ children: React.ReactNode; className?: string; noPadding?: boolean }> = ({ children, className = '', noPadding = false }) => (
  <div className={cn("bg-white rounded-2xl shadow-soft overflow-hidden", className)}>
    {noPadding ? children : <div className="p-6 md:p-8">{children}</div>}
  </div>
);