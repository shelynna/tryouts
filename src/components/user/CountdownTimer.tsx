
import React, { useState, useEffect } from 'react';
import type { Cycle } from '../../types';

export const CountdownTimer: React.FC<{ cycle: Cycle }> = ({ cycle }) => {
  const [timeLeft, setTimeLeft] = useState<any>(null);
  
  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      // Handle both camelCase and snake_case properties
      const lockDate = cycle.lockDate || cycle.lock_date || new Date();
      const openDate = cycle.paymentStartDate || cycle.open_date || new Date();
      
      const target = new Date(cycle.status === 'active' || cycle.status === 'OPEN' ? lockDate : openDate);
      const diff = target.getTime() - now.getTime();
      
      if (diff <= 0) return setTimeLeft(null);
      
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
    };
    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [cycle]);

  if (!timeLeft) return null;

  return (
    <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-center">
      <p className="text-xs font-bold text-brand-700 uppercase tracking-widest mb-2">
        {cycle.status === 'active' || cycle.status === 'OPEN' ? 'Cycle Locks In' : 'Next Cycle Opens In'}
      </p>
      <div className="flex justify-center gap-4 text-brand-900 font-mono font-bold text-xl">
        <div>{timeLeft.days}d</div>
        <div>{timeLeft.hours}h</div>
        <div>{timeLeft.minutes}m</div>
        <div>{timeLeft.seconds}s</div>
      </div>
    </div>
  );
};
