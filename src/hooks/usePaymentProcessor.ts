
import { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { API } from '../lib/api';
import { useToast } from '../components/ui';
import { env } from '../lib/env';
import { useBasket } from '../context/BasketContext';

export const usePaymentProcessor = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const { showToast } = useToast();
    const { refreshBasket } = useBasket();
    
    // Ref to track if payment was successful to prevent "Cancelled" toast on close
    const paymentSuccessRef = useRef(false);

    const processPayment = async (
        amount: number,
        user: any,
        basketId: string | undefined,
        type: 'PAYMENT' | 'SUBSCRIPTION' = 'PAYMENT',
        onSuccess?: () => void
    ) => {
        if (!user?.email) {
            showToast("User email required for payment", "error");
            return;
        }

        if (amount <= 0) {
            showToast("Invalid payment amount", "error");
            return;
        }

        setIsProcessing(true);
        paymentSuccessRef.current = false;
        
        // Generate unique reference
        const reference = `SMM-${type === 'SUBSCRIPTION' ? 'SUB' : 'PAY'}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        try {
            const publicKey = env.VITE_PAYSTACK_PUBLIC_KEY;
            if (!publicKey) throw new Error("System Configuration Error: Missing Payment Key");
            
            // Dynamically load Paystack script if not present
            if (!window.PaystackPop) {
                await new Promise<void>((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://js.paystack.co/v1/inline.js';
                    script.async = true;
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error("Failed to load payment gateway"));
                    document.body.appendChild(script);
                });
            }

            const handler = window.PaystackPop.setup({
                key: publicKey,
                email: user.email,
                amount: Math.ceil(amount * 100), // Convert to kobo/pesewas
                currency: 'GHS',
                ref: reference,
                metadata: {
                    basketId: basketId || 'N/A',
                    type: type,
                    custom_fields: [
                        { display_name: "Payment Type", variable_name: "payment_type", value: type },
                        { display_name: "SML User", variable_name: "user_name", value: user.fullName }
                    ]
                },
                // FIX: Must use a synchronous function wrapper
                callback: function(response: any) {
                    paymentSuccessRef.current = true;
                    showToast("Verifying transaction...", "info");
                    
                    // Run async verification logic detached
                    (async () => {
                        try {
                            // Secure Server-Side Verification (with Fallback)
                            await API.verifyPayment(response.reference, type === 'SUBSCRIPTION' ? 'subscription_upgrade' : basketId, amount);
                            
                            // Success Logic
                            await refreshBasket();
                            if (type === 'SUBSCRIPTION') {
                                window.location.reload(); // Force reload for role update
                            } else {
                                if (onSuccess) onSuccess();
                                showToast("Payment successful! Basket updated.", "success");
                            }
                        } catch (err: any) {
                            console.error("Verification Error:", err);
                            showToast(err.message || "Payment verified but system update failed. Please refresh.", "error");
                        } finally {
                            setIsProcessing(false);
                        }
                    })();
                },
                onClose: function() {
                    if (!paymentSuccessRef.current) {
                        setIsProcessing(false);
                        showToast("Payment cancelled", "info");
                    }
                }
            });

            handler.openIframe();

        } catch (e: any) {
            setIsProcessing(false);
            showToast(e.message || "Could not initialize payment", "error");
        }
    };

    return { processPayment, isProcessing };
};
