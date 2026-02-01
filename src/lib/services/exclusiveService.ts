
import { supabase } from '../supabaseClient';
import type { ExclusiveDeal, DealClaim } from '../supabase/types';

export class ExclusiveDealsService {
  async getAvailableDeals(userId: string): Promise<ExclusiveDeal[]> {
    const now = new Date().toISOString();

    // 1. Fetch Plan Info Safely
    const { data: sub } = await supabase.from('user_subscriptions')
        .select('plan_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
    
    let planCode = 'standard';

    if (sub?.plan_id) {
        const { data: plan } = await supabase.from('subscription_plans')
            .select('code')
            .eq('id', sub.plan_id)
            .maybeSingle();
        if (plan?.code) planCode = plan.code;
    }

    // 2. Fetch Active Deals
    const { data: deals } = await supabase
      .from('exclusive_deals')
      .select('*')
      .eq('is_active', true)
      .lte('access_start', now)
      .gte('access_end', now);

    if (!deals) return [];

    // 3. Filter Client-Side
    return deals.filter(deal => {
        try {
            const eligible = Array.isArray(deal.eligible_plans)
                ? deal.eligible_plans
                : JSON.parse(deal.eligible_plans ?? '[]');
            
            return Array.isArray(eligible) && eligible.includes(planCode);
        } catch (e) {
            console.warn(`[SMM] Malformed eligibility for deal ${deal.id}`, e);
            return false;
        }
    });
  }

  async claimDeal(userId: string, dealId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('claim_exclusive_deal', {
        p_user_id: userId,
        p_deal_id: dealId,
      });
      
      if (error) throw error;
      
      if (data && data.success === false) {
          throw new Error(data.error || 'Failed to claim deal');
      }

      return { success: true };
    } catch (e: any) {
      console.error("[SMM] Claim error:", e);
      return { success: false, error: e.message };
    }
  }

  async getUserDealClaims(userId: string): Promise<DealClaim[]> {
    const { data } = await supabase
      .from('deal_claims')
      .select('*, deal:exclusive_deals(*)')
      .eq('user_id', userId);
    return data || [];
  }
}

export const exclusiveDealsService = new ExclusiveDealsService();
