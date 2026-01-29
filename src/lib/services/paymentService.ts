
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

    // --- FORMATTED SUCCESS LOG ---
    getMe().then(user => {
        const dateStr = new Date().toLocaleString('en-GB', { 
            day: 'numeric', month: 'short', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        });
        
        // Extract Details safely
        const receiptNumber = data?.receipt_number || data?.id || 'N/A';
        const channel = data?.authorization?.channel || 'Mobile Money';
        const last4 = data?.authorization?.last4 ? `X${data.authorization.last4}` : 'X...';

        const logMessage = `
${formatCurrency(amount)}

Transaction Details

Reference ${reference}

Receipt Number ${receiptNumber}

Date ${dateStr}

${channel} Ending with ${last4}
`.trim();

        // Pass null or empty object for context if you don't want it printed next to the string in console
        Logger.transaction(logMessage, {});
    });

    return { status: true, data };
};
