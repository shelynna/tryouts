
import React from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { Button, Card, Badge } from '../ui';
import { formatCurrency } from '../../lib/utils';
import { Sparkles, Tag, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ExclusiveDeals: React.FC<{ userId: string }> = ({ userId }) => {
  const { exclusiveDeals, claimDeal, claimedDeals, isSML } = useSubscription(userId);
  const navigate = useNavigate();

  if (!isSML) {
      return (
          <div className="bg-gradient-to-r from-purple-50 to-white border border-purple-100 rounded-2xl p-8 text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <Sparkles className="text-purple-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-purple-900">Subscriber Exclusives</h3>
              <p className="text-sm text-purple-700 mt-1 mb-6 max-w-sm">Upgrade your plan to access flash sales, special discounts, and priority delivery slots.</p>
              <Button 
                onClick={() => navigate('/subscription/plans')}
                className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200"
              >
                Upgrade to Unlock <ArrowRight size={16} className="ml-2"/>
              </Button>
          </div>
      );
  }

  if (exclusiveDeals.length === 0) {
      return (
          <div className="text-center py-10 border-2 border-dashed border-stone-100 rounded-2xl">
              <Tag className="mx-auto text-stone-300 mb-2" size={24} />
              <p className="text-stone-400 font-bold text-sm">No active deals right now.</p>
          </div>
      );
  }

  const isClaimed = (dealId: string) => claimedDeals.some(c => c.deal_id === dealId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exclusiveDeals.map(deal => {
            const claimed = isClaimed(deal.id);
            return (
                <div key={deal.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl">
                        EXCLUSIVE
                    </div>
                    
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Tag size={20} />
                        </div>
                    </div>
                    
                    <h4 className="font-bold text-stone-900 mb-1">{deal.name}</h4>
                    <p className="text-xs text-stone-500 mb-4 line-clamp-2">{deal.description}</p>
                    
                    <div className="flex items-center justify-between mt-auto">
                        <div className="text-lg font-mono font-bold text-purple-700">
                            {deal.discount_percentage ? `${deal.discount_percentage}% OFF` : `-${formatCurrency(deal.discount_amount)}`}
                        </div>
                        <Button 
                            size="sm" 
                            variant={claimed ? 'outline' : 'primary'}
                            className={claimed ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'bg-purple-600 hover:bg-purple-700'}
                            onClick={() => !claimed && claimDeal(deal.id)}
                            disabled={claimed}
                        >
                            {claimed ? 'Claimed' : 'Claim'}
                        </Button>
                    </div>
                </div>
            );
        })}
    </div>
  );
};
