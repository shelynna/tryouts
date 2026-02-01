
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!;

    // 1. Authenticate User
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid user session' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Admin Client for operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { transactionReference, amount, reason } = await req.json();

    // 2. Validate Ownership & Status
    const { data: payment } = await supabase.from('subscription_payments')
      .select('id, status, user_id')
      .eq('reference', transactionReference)
      .maybeSingle();

    if (!payment || payment.user_id !== user.id) {
        return new Response(JSON.stringify({ success: false, error: 'Payment not found or unauthorized' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (payment.status === 'refunded') {
        return new Response(JSON.stringify({ success: false, error: 'Payment already refunded' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Process Refund
    const res = await fetch('https://api.paystack.co/refund', {
        method: 'POST',
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: transactionReference, amount: amount ? amount * 100 : undefined, customer_note: reason })
    });
    const result = await res.json();
    if (!result.status) throw new Error(result.message);

    // 4. Update DB status
    await supabase.from('subscription_payments').update({ status: 'refunded' }).eq('reference', transactionReference);

    return new Response(JSON.stringify({ success: true, refundId: result.data.id }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
