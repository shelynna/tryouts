
import { useState, useEffect, useCallback } from 'react';
import { subscriptionService } from '../lib/services/subscriptionService';
import { creditService } from '../lib/services/creditService';
import { exclusiveDealsService } from '../lib/services/exclusiveService';
import type {
  UserPlanContext,
  SubscriptionPlan,
  CreditFacility,
  ExclusiveDeal,
  DealClaim,
} from '../lib/supabase/types';

export const useSubscription = (userId: string) => {
  const [planContext, setPlanContext] = useState<UserPlanContext | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [creditFacility, setCreditFacility] = useState<CreditFacility | null>(null);
  const [exclusiveDeals, setExclusiveDeals] = useState<ExclusiveDeal[]>([]);
  const [claimedDeals, setClaimedDeals] = useState<DealClaim[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!userId) return;
    loadSubscriptionData();
  }, [userId]);
  
  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      const [context, plans, credit, deals, claims] = await Promise.all([
        subscriptionService.getUserPlanContext(userId),
        subscriptionService.getAvailablePlans(),
        creditService.getUserCreditFacility(userId),
        exclusiveDealsService.getAvailableDeals(userId),
        exclusiveDealsService.getUserDealClaims(userId),
      ]);
      
      setPlanContext(context);
      setAvailablePlans(plans);
      setCreditFacility(credit);
      setExclusiveDeals(deals);
      setClaimedDeals(claims);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return {
    planContext,
    availablePlans,
    creditFacility,
    exclusiveDeals,
    claimedDeals,
    loading,
    refresh: loadSubscriptionData,
    isSML: planContext?.planCode === 'sml',
    
    upgradeToSML: () => subscriptionService.upgradeToSML(userId),
    downgradeToStandard: () => subscriptionService.downgradeToStandard(userId),
    claimDeal: (dealId: string) => exclusiveDealsService.claimDeal(userId, dealId),
    getCreditUtilization: () => creditService.getCreditUtilization(userId)
  };
};
