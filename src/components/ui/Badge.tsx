
import React from 'react';
import { cn } from '../../lib/utils';

export const Badge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const styles: Record<string, string> = {
    OPEN: 'bg-stone-100 text-stone-600',
    LOCKED: 'bg-orange-50 text-orange-700',
    PAID: 'bg-emerald-50 text-emerald-700',
    COLLECTED: 'bg-brand-900 text-white',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    PENDING: 'bg-yellow-50 text-yellow-700',
    DENIED: 'bg-red-50 text-red-700',
    SUCCESS: 'bg-emerald-50 text-emerald-700',
    FAILED: 'bg-red-50 text-red-700',
    REFUNDED: 'bg-orange-50 text-orange-700'
  };
  return (
    <span className={cn(
      "inline-flex items-center rounded-full font-bold border border-transparent uppercase tracking-wider", 
      size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-3 py-1 text-[10px]', 
      styles[status] || 'bg-stone-100 text-stone-700'
    )}>
      {status}
    </span>
  );
};
