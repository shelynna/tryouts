import { supabase } from '../supabaseClient';
import { Logger } from '../logger';
import { formatCurrency } from '../utils';
import { getMe } from './authService';

export const verifyPayment = async (reference: string, basketId: string, amount: number) => {
    const type = basketId === 'subscription_upgrade' ? 'SUBSCRIPTION' : 'PAYMENT';
    const { data, error } = await supabase.rpc('process_payment', {
        p_reference: reference,
        p_basket_id: basketId === 'subscription_upgrade' ? null : basketId,
        p_amount: amount,
        p_type: type
    });

    if (error) {
        Logger.error("Payment Verification Failed", error, { reference, amount, type });
        throw error;
    }

    // ENRICHED LOGGING: Fetch user details to make the log human-readable
    // We fire and forget this fetch to avoid slowing down the UI
    getMe().then(user => {
        Logger.transaction(
            `Payment of ${formatCurrency(amount)} verified for ${user?.fullName || 'Unknown User'}`, 
            {
                amount,
                reference,
                type,
                basketId,
                pickupPoint: user?.pickupPoint,
                phone: user?.phoneNumber
            }
        );
    });

    return { status: true, data };
};
