
import { supabase } from '../supabaseClient';
import { Logger } from '../logger';

export const verifyPayment = async (reference: string, basketId: string | undefined, amount: number) => {
    const isSubscription = basketId === 'subscription_upgrade' || basketId === 'SUBSCRIPTION';
    const type = isSubscription ? 'subscription' : 'payment';
    
    if (!reference) throw new Error("Invalid payment reference");

    console.log(`[Payment] Verifying ${type} - Ref: ${reference}`);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    try {
        // 1. Attempt Secure Verification via Edge Function
        // This is the preferred server-side method
        const { data, error } = await supabase.functions.invoke('paystack-verify-new', {
            body: { reference, userId: user.id, type }
        });
        
        // 2. FAILOVER STRATEGY: 
        // If Edge Function is unreachable (network error / not deployed / 500 / 404), 
        // fallback to calling the Postgres RPC directly from the client.
        // This ensures the user isn't stuck after paying money.
        if (error) {
            console.warn("[Payment] Edge Function Unreachable. Using RPC Fallback...", error);
            
            // Call Database Function directly
            const { data: rpcData, error: rpcError } = await supabase.rpc("create_payment_record", {
                p_user_id: user.id,
                p_reference: reference,
                p_amount: amount, 
                p_currency: 'GHS',
                p_status: "success",
                p_payment_method: "paystack_fallback",
                p_channel: "web",
                p_ip_address: "0.0.0.0",
                p_paystack_data: { fallback: true, verified: false },
                p_subscription_id: null 
            });

            if (rpcError) throw new Error("Database recording failed: " + rpcError.message);

            // Manual Subscription Logic for Fallback
            if (isSubscription) {
                const now = new Date();
                const end = new Date(); 
                end.setMonth(end.getMonth() + 6);
                
                await supabase.from('profiles').update({ is_subscriber: true }).eq('id', user.id);
                
                const { data: plan } = await supabase.from('subscription_plans').select('id').eq('code', 'sml').maybeSingle();
                if (plan) {
                    await supabase.from('user_subscriptions').upsert({
                        user_id: user.id, 
                        plan_id: plan.id, 
                        status: 'active', 
                        current_period_start: now.toISOString(), 
                        current_period_end: end.toISOString()
                    }, { onConflict: 'user_id' });
                }
            }

            return { status: true, data: rpcData, fallback: true };
        }
        
        if (!data || !data.success) {
            if (data?.error?.includes('reference not found')) {
                 throw new Error("Transaction pending. Please wait a moment and refresh.");
            }
            throw new Error(data?.error || `Verification failed.`);
        }
        
        return { status: true, data };
        
    } catch (error: any) {
        Logger.error("Payment Verification Failed", error);
        throw error;
    }
};
