import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!supabaseUrl || !supabaseKey || !paystackKey) {
      throw new Error("Missing server configuration");
    }

    const { reference, userId, type } = await req.json();
    
    if (!reference || !userId) throw new Error("Missing reference or userId");

    // Initialize Supabase Admin Client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${paystackKey}` },
    });
    
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
        // Log Failure
        await supabase.from("payment_logs").insert({
            event_type: "verification_failed",
            reference,
            user_id: userId,
            response_data: verifyData,
            error_message: verifyData.message || "Gateway verification failed"
        });
        throw new Error(verifyData.message || "Payment verification failed");
    }

    const pData = verifyData.data;
    const amountGHS = pData.amount / 100;

    // Call RPC to record payment centrally
    const { data: rpcData, error: rpcError } = await supabase.rpc("create_payment_record", {
        p_user_id: userId,
        p_reference: reference,
        p_amount: amountGHS,
        p_currency: pData.currency,
        p_status: "success",
        p_payment_method: pData.authorization?.channel || "paystack",
        p_channel: pData.channel,
        p_ip_address: pData.ip_address,
        p_paystack_data: pData,
        p_subscription_id: null // RPC handles logic or update separate subscription table if needed
    });

    if (rpcError) {
        throw new Error(rpcError.message);
    }

    // Additional Logic for Subscriptions (if needed specifically separate from RPC)
    if (type === 'subscription') {
        const now = new Date();
        const end = new Date(); 
        end.setMonth(end.getMonth() + 6);

        // Update profile status
        await supabase.from('profiles').update({ is_subscriber: true }).eq('id', userId);
        
        // Record subscription specific entry
        // We assume plan_id comes from metadata or default to 'sml'
        const planIdVal = pData.metadata?.plan_id; 
        if(planIdVal) {
             await supabase.from('user_subscriptions').upsert({
                user_id: userId, 
                plan_id: planIdVal, 
                status: 'active', 
                current_period_start: now.toISOString(), 
                current_period_end: end.toISOString()
            }, { onConflict: 'user_id' });
        }
    }

    return new Response(
      JSON.stringify({ success: true, data: pData, message: "Verification successful" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Edge Function Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});