
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://api.smlghana.store',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!PAYSTACK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("Missing server configuration");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { userId, amount, email, planId, metadata, type } = await req.json();
    
    // Logic to determine amount if subscription
    let finalAmount = amount;
    if (type === 'subscription' && planId) {
        const { data: plan } = await supabase.from('subscription_plans').select('price_amount').eq('id', planId).single();
        if (plan) finalAmount = plan.price_amount;
    }

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email, 
            amount: Math.round(finalAmount * 100), 
            currency: 'GHS', 
            metadata: { user_id: userId, plan_id: planId, type, ...metadata } 
        })
    });
    
    const result = await res.json();
    if (!result.status) throw new Error(result.message);

    return new Response(JSON.stringify({ 
        success: true, 
        authorizationUrl: result.data.authorization_url, 
        reference: result.data.reference 
    }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
