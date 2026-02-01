
import { supabase } from '../supabaseClient';
import type { CreditFacility, CreditTransaction } from '../supabase/types';

export class CreditService {
  async getUserCreditFacility(userId: string): Promise<CreditFacility | null> {
    const { data, error } = await supabase
      .from('credit_facilities')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
    
    if (error) return null;
    return data;
  }
  
  async topUpCredit(
    userId: string,
    amount: number,
    description?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const facility = await this.getUserCreditFacility(userId);
      if (!facility) return { success: false, error: 'Credit facility not active' };

      // Record transaction
      const { error: txError } = await supabase.from('credit_transactions').insert({
        credit_facility_id: facility.id,
        user_id: userId,
        type: 'top_up',
        amount: amount,
        balance_before: facility.available_credit,
        balance_after: facility.available_credit + amount,
        description: description || 'Credit Top-up',
        status: 'completed'
      });

      if (txError) throw txError;

      // Update facility logic is handled by DB Triggers
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getCreditUtilization(userId: string) {
    const facility = await this.getUserCreditFacility(userId);
    if (!facility) return null;

    const utilizationRate = facility.credit_limit > 0
      ? (facility.used_credit / facility.credit_limit) * 100
      : 0;

    return {
      limit: facility.credit_limit,
      used: facility.used_credit,
      available: facility.available_credit,
      utilizationRate,
      outstanding: facility.outstanding_balance
    };
  }
}

export const creditService = new CreditService();
