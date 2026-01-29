
import { supabase } from '../../supabaseClient';
import { Logger } from '../../logger';
import { AdminBasketEntry, ProcurementItem, TopUpRequest } from '../../../types';
import { getSettings } from '../systemService';

export const getAllBaskets = async (): Promise<AdminBasketEntry[]> => {
    const { data } = await supabase
      .from('baskets')
      .select(`
          id, status, total_price, amount_paid, user_id,
          profiles (full_name),
          items:basket_items (id)
      `)
      .order('amount_paid', { ascending: false });

    return (data || []).map((b: any) => ({
        basketId: b.id,
        userId: b.user_id,
        userName: b.profiles?.full_name || 'Unknown',
        status: b.status,
        totalValue: b.total_price || 0,
        amountPaid: b.amount_paid || 0,
        itemCount: b.items?.length || 0
    }));
};

export const getProcurementList = async (): Promise<ProcurementItem[]> => {
    const { data, error } = await supabase.rpc('get_procurement_list');
    if (error) {
      Logger.error("Failed to fetch procurement list", error);
      throw error;
    }
    return data || [];
};

export const getTopUpRequests = async (): Promise<(TopUpRequest & { userName?: string, userPhone?: string })[]> => {
    // UPDATED: Remove filter on potentially missing 'top_up_status' column
    const { data, error } = await supabase
      .from('baskets')
      .select(`
          id, user_id, top_up_amount, total_price, amount_paid, top_up_approved,
          profiles:user_id (full_name, phone)
      `)
      .eq('top_up_requested', true)
      .eq('top_up_approved', false);
    
    if (error) {
        // Log error but return empty array to prevent dashboard crash
        Logger.error("Failed to fetch top-up requests (Check DB schema)", error);
        return [];
    }

    const settings = await getSettings();

    return (data || []).map((b: any) => {
        const remaining = Math.max(0, (b.total_price || 0) - (b.amount_paid || 0));
        const topUpAmount = b.top_up_amount || remaining;
        const repayable = topUpAmount * (1 + (settings.topUpServiceFeePercentage / 100));

        // Safely access nested profile data
        const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;

        return {
            id: b.id, 
            userId: b.user_id,
            userName: profile?.full_name || 'Unknown User',
            userPhone: profile?.phone || '',
            basketId: b.id,
            amount: topUpAmount,
            totalRepayable: repayable,
            status: 'PENDING'
        };
    });
};

export const approveTopUp = async (basketId: string) => {
    const { data, error } = await supabase.rpc('approve_top_up', { p_basket_id: basketId });
    if (error) throw error;
    await Logger.transaction("Top-Up Approved", { basketId });
    return data;
};

export const denyTopUp = async (basketId: string, reason: string) => {
     // We only update supported columns. If top_up_status is missing in DB, this might still fail,
     // but the catch block in the UI will handle it.
     const { error } = await supabase
        .from('baskets')
        .update({ 
            top_up_requested: false, 
            top_up_approved: false, 
            top_up_amount: 0,
            top_up_denial_reason: reason 
        })
        .eq('id', basketId);
    if (error) throw error;
};
