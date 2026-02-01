
import React, { useState, useEffect } from 'react';
import type { Cycle, User } from '../../types';

export const CountdownTimer: React.FC<{ cycle: Cycle, user?: User }> = ({ cycle, user }) => {
  const [timeLeft, setTimeLeft] = useState<any>(null);
  
  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      // Handle both camelCase and snake_case properties
      // Tiered logic:
      const subLockDate = cycle.lockDate || cycle.lock_date || new Date();
      const standardLockDate = cycle.standardLockDate || cycle.standard_lock_date || subLockDate;
      const openDate = cycle.paymentStartDate || cycle.open_date || new Date();
      
      // Determine target lock based on user tier
      const effectiveLock = user?.isSubscriber ? subLockDate : standardLockDate;
      
      const target = new Date(cycle.status === 'active' || cycle.status === 'OPEN' ? effectiveLock : openDate);
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
  }, [cycle, user?.isSubscriber]);

  if (!timeLeft) return null;

  return (
    <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-center">
      <p className="text-xs font-bold text-brand-700 uppercase tracking-widest mb-2">
        {cycle.status === 'active' || cycle.status === 'OPEN' ? (user?.isSubscriber ? 'Subscriber Access Ends' : 'Access Locks In') : 'Next Cycle Opens In'}
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
