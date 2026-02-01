
import React, { useState, useEffect } from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { Button, ProgressBar } from '../ui';
import { formatCurrency } from '../../lib/utils';
import { TrendingUp, CreditCard, AlertTriangle, ShieldCheck } from 'lucide-react';

interface CreditFacilityProps {
  userId: string;
}

export const CreditFacility: React.FC<CreditFacilityProps> = ({ userId }) => {
  const { creditFacility, getCreditUtilization, loading } = useSubscription(userId);
  const [utilization, setUtilization] = useState<any>(null);

  useEffect(() => {
    if (creditFacility) {
      getCreditUtilization().then(setUtilization);
    }
  }, [creditFacility]);

  if (loading) return null;

  if (!creditFacility || !creditFacility.is_active) {
    return (
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 text-center">
            <AlertTriangle className="mx-auto text-stone-400 mb-2" size={24} />
            <h3 className="font-bold text-stone-900">Credit Facility Inactive</h3>
            <p className="text-sm text-stone-500 mt-1">Upgrade to SML Subscriber to access Top-Up credits.</p>
        </div>
    );
  }

  if (!utilization) return null;

  return (
    <div className="bg-white rounded-[2rem] p-6 border border-stone-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-bold text-xl text-stone-900 flex items-center gap-2">
            <CreditCard className="text-brand-600" /> Credit Facility
        </h3>
        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-emerald-100 flex items-center gap-1">
            <ShieldCheck size={12}/> Active
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Limit</p>
            <p className="text-xl font-mono font-bold text-stone-900">{formatCurrency(creditFacility.credit_limit)}</p>
        </div>
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Available</p>
            <p className="text-xl font-mono font-bold text-emerald-600">{formatCurrency(creditFacility.available_credit)}</p>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-xs font-bold text-stone-500 mb-2">
            <span>Utilization</span>
            <span>{utilization.utilizationRate.toFixed(0)}%</span>
        </div>
        <ProgressBar 
            progress={utilization.utilizationRate} 
            className="h-2" 
            barClassName={utilization.utilizationRate > 80 ? 'bg-red-500' : 'bg-brand-600'} 
        />
      </div>
      
      <p className="text-xs text-stone-400 mt-4 text-center">
        Use Top-Ups at checkout to complete your basket instantly.
      </p>
    </div>
  );
};
