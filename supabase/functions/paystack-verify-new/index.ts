
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow from any origin for simplicity in Edge Functions, or restrict to specific domain
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); // Must use Service Role to bypass RLS if needed
    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!supabaseUrl || !supabaseKey || !paystackKey) {
      throw new Error("Missing server configuration");
    }

    const { reference, userId, type } = await req.json();
    
    if (!reference || !userId) {
        return new Response(JSON.stringify({ success: false, error: "Missing payment reference" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    console.log(`[Verify] Processing Ref: ${reference} for User: ${userId}`);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Verify with Paystack API
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${paystackKey}` },
    });
    
    const verifyJson = await verifyRes.json();

    if (!verifyJson.status || verifyJson.data.status !== "success") {
        const errorMsg = verifyJson.message || "Gateway verification failed";
        // Log the failure
        await supabase.from("payment_logs").insert({
            event_type: "verification_failed",
            reference,
            user_id: userId,
            response_data: verifyJson,
            error_message: errorMsg
        });
        
        return new Response(JSON.stringify({ success: false, error: errorMsg }), {
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    const pData = verifyJson.data;
    const amountGHS = pData.amount / 100; // Paystack amount is in kobo/pesewas
    const auth = pData.authorization;

    // 3. Record Payment via RPC (Secure Database Transaction)
    // This function handles deduplication (idempotency) based on the reference
    const { data: rpcData, error: rpcError } = await supabase.rpc("create_payment_record", {
        p_user_id: userId,
        p_reference: reference,
        p_amount: amountGHS,
        p_currency: pData.currency,
        p_status: "success",
        p_payment_method: auth?.channel || "paystack",
        p_channel: pData.channel,
        p_ip_address: pData.ip_address,
        p_paystack_data: pData,
        p_subscription_id: null // RPC will map based on logic if needed
    });

    if (rpcError) {
        console.error("RPC Error:", rpcError);
        throw new Error("Database recording failed: " + rpcError.message);
    }

    // 4. Store Payment Method Token (for future use)
    if (auth && auth.reusable && auth.channel === 'card') {
        await supabase.from('payment_methods').upsert({
            user_id: userId,
            paystack_authorization_code: auth.authorization_code,
            last4: auth.last4,
            card_type: auth.card_type,
            bank: auth.bank,
            country_code: auth.country_code,
            brand: auth.brand,
            reusable: true,
            is_active: true,
            metadata: auth 
        }, { onConflict: 'paystack_authorization_code' });
    }

    // 5. Handle Subscription Specific Logic
    if (type === 'subscription' || (pData.metadata && pData.metadata.type === 'SUBSCRIPTION')) {
        const now = new Date();
        const end = new Date(); 
        end.setMonth(end.getMonth() + 6); // 6 Month Semester

        // Enable subscriber status
        await supabase.from('profiles').update({ is_subscriber: true }).eq('id', userId);
        
        const planCode = pData.metadata?.plan_id || 'sml'; 
        
        // Find Plan ID
        const { data: plan } = await supabase.from('subscription_plans').select('id').eq('code', planCode).maybeSingle();
        
        if (plan) {
             await supabase.from('user_subscriptions').upsert({
                user_id: userId, 
                plan_id: plan.id, 
                status: 'active', 
                current_period_start: now.toISOString(), 
                current_period_end: end.toISOString(),
                paystack_authorization_code: auth?.authorization_code 
            }, { onConflict: 'user_id' });
        }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Verification successful", transactionId: rpcData?.payment_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Edge Function Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
