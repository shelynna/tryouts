
import React from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { Button } from '../ui';
import { Check } from 'lucide-react';

interface PlanSelectorProps {
  userId: string;
  onPlanSelect?: (planCode: string) => void;
}

export const PlanSelector: React.FC<PlanSelectorProps> = ({ userId, onPlanSelect }) => {
  const { availablePlans, planContext, loading } = useSubscription(userId);
  const currentPlanCode = planContext?.planCode || 'standard';

  if (loading) return <div className="p-8 text-center text-stone-400">Loading plans...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {availablePlans.map((plan) => {
        const isCurrent = plan.code === currentPlanCode;
        const isSML = plan.code === 'sml';
        
        return (
          <div
            key={plan.id}
            className={`relative p-8 rounded-3xl border-2 transition-all ${
              isCurrent 
                ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500' 
                : 'border-stone-200 bg-white hover:border-brand-200 hover:shadow-lg'
            }`}
          >
            {isSML && !isCurrent && (
                <div className="absolute top-0 right-0 bg-brand-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl rounded-tr-[22px] uppercase tracking-widest">
                    Recommended
                </div>
            )}
            
            <div className="mb-6">
                <h3 className="text-2xl font-serif font-bold text-stone-900">{plan.name}</h3>
                <p className="text-stone-500 mt-2 text-sm">{plan.description}</p>
            </div>

            <div className="mb-8">
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-mono font-bold text-stone-900">
                        {plan.price_amount === 0 ? 'Free' : `GHS ${plan.price_amount}`}
                    </span>
                    <span className="text-stone-400 text-sm">
                        {plan.billing_period === 'forever' ? '/ forever' : `/ ${plan.billing_period}`}
                    </span>
                </div>
            </div>

            <ul className="space-y-4 mb-8">
                {plan.features?.map((feat: any, i: number) => (
                    <li key={i} className="flex gap-3 text-sm text-stone-700">
                        <span className="shrink-0 text-xl">{feat.icon}</span>
                        <div>
                            <span className="font-bold block">{feat.name}</span>
                            <span className="text-stone-500 text-xs">{feat.description}</span>
                        </div>
                    </li>
                ))}
            </ul>

            <Button 
                fullWidth 
                variant={isCurrent ? 'outline' : 'primary'}
                disabled={isCurrent}
                onClick={() => onPlanSelect?.(plan.code)}
                className={isCurrent ? 'border-brand-200 text-brand-700 bg-brand-50 opacity-100 cursor-default' : 'shadow-xl'}
            >
                {isCurrent ? (isSML ? 'Active Subscription' : 'Current Plan') : (isSML ? 'Upgrade Now' : 'Downgrade')}
            </Button>
          </div>
        );
      })}
    </div>
  );
};
