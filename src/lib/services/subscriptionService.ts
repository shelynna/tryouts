
import { supabase } from '../supabaseClient';
import { verifyPayment } from './paymentService'; // Re-use the robust function
import type { UserSubscription, SubscriptionPlan, UserPlanContext } from '../supabase/types';

export class EnhancedSubscriptionService {
  
  // Initialize payment via Edge Function (Secure)
  async initializeSubscriptionPayment(params: {
    userId: string;
    planId: string;
    email: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; authorizationUrl?: string; reference?: string; error?: string; }> {
    try {
      const { data, error } = await supabase.functions.invoke('paystack-initialize', {
        body: {
          userId: params.userId,
          planId: params.planId,
          email: params.email,
          amount: 0, 
          type: 'subscription',
          metadata: params.metadata
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return {
        success: true,
        authorizationUrl: data.authorizationUrl,
        reference: data.reference,
      };
    } catch (error: any) {
      console.error('Subscription init failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify payment STRICTLY via Edge Function (UPDATED ENDPOINT)
  async verifyAndCompleteSubscription(params: { reference: string; userId: string; planId: string; }): Promise<{ success: boolean; subscription?: UserSubscription; error?: string; }> {
    try {
      // Delegate to central payment verification logic (which now includes fallback)
      await verifyPayment(params.reference, 'SUBSCRIPTION', 15.00);

      // Fetch the updated subscription state
      const subscription = await this.getUserSubscription(params.userId);
      return { success: true, subscription: subscription || undefined };

    } catch (error: any) {
      console.error("Subscription verification failed:", error);
      return { success: false, error: error.message };
    }
  }

  // Request Refund via Edge Function
  async processRefund(params: { userId: string; subscriptionId: string; amount?: number; reason?: string; }): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      const { data: payment } = await supabase.from('subscription_payments')
        .select('reference, currency, amount')
        .eq('subscription_id', params.subscriptionId)
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!payment) return { success: false, error: 'Original payment not found' };

      const { data, error } = await supabase.functions.invoke('paystack-refund', {
        body: {
            transactionReference: payment.reference,
            amount: params.amount,
            reason: params.reason,
            userId: params.userId
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return { success: true, refundId: data.refundId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Standard Getters (Existing logic adapted)
  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase.from('subscription_plans').select('*').eq('is_active', true).order('display_order', { ascending: true });
    if (error) return [];
    return data.map(plan => ({ ...plan, features: typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || []) }));
  }
  
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    // FIX: Split query to avoid 406 Error on Join
    const { data: sub, error } = await supabase.from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
    
    if (error || !sub) return null;

    let planData = undefined;
    if (sub.plan_id) {
        const { data: plan } = await supabase.from('subscription_plans')
            .select('*')
            .eq('id', sub.plan_id)
            .maybeSingle();
        
        if (plan) {
            planData = { 
                ...plan, 
                features: typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || []) 
            };
        }
    }

    return { ...sub, plan: planData };
  }

  async getUserPlanContext(userId: string): Promise<UserPlanContext | null> {
    const [sub, credit] = await Promise.all([
        this.getUserSubscription(userId),
        supabase.from('credit_facilities').select('*').eq('user_id', userId).maybeSingle().then(r => r.data)
    ]);
    const planCode = (sub?.plan?.code as 'standard' | 'sml') || 'standard';
    return {
      planCode, subscription: sub, credit,
      features: {
        hasCredit: planCode === 'sml' && (credit?.credit_limit || 0) > 0,
        hasPriorityProcessing: planCode === 'sml',
        hasPrioritySupport: planCode === 'sml',
        hasExclusiveDeals: planCode === 'sml',
        creditLimit: credit?.credit_limit || 0,
        availableCredit: credit?.available_credit || 0,
        priorityLevel: planCode === 'sml' ? 5 : 0,
      },
    };
  }

  async upgradeToSML(userId: string): Promise<{ success: boolean; error?: string }> {
      try {
          let planId = '';
          const { data: sml } = await supabase.from('subscription_plans').select('id').eq('code', 'sml').maybeSingle();
          if(sml) planId = sml.id;
          
          const now = new Date();
          const end = new Date(); end.setMonth(end.getMonth()+6);
          
          if (planId) {
            await supabase.from('user_subscriptions').upsert({ user_id: userId, plan_id: planId, status: 'active', current_period_start: now.toISOString(), current_period_end: end.toISOString() }, { onConflict: 'user_id' });
          }
          
          await supabase.from('profiles').update({ is_subscriber: true }).eq('id', userId);
          return { success: true };
      } catch(e:any) { 
          console.error("Upgrade failed", e);
          return { success: false, error: e.message }; 
      }
  }

  async downgradeToStandard(userId: string): Promise<{ success: boolean; error?: string }> {
      try {
          const { data: std } = await supabase.from('subscription_plans').select('id').eq('code', 'standard').maybeSingle();
          if(std) {
             await supabase.from('user_subscriptions').upsert({ user_id: userId, plan_id: std.id, status: 'active', current_period_start: new Date().toISOString(), current_period_end: new Date(2099, 0, 1).toISOString() }, { onConflict: 'user_id' });
          }
          await supabase.from('profiles').update({ is_subscriber: false }).eq('id', userId);
          return { success: true };
      } catch(e:any) { return { success: false, error: e.message }; }
  }
}

export const subscriptionService = new EnhancedSubscriptionService();
