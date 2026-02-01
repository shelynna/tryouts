
-- ============================================================================
-- SML MASTER SCHEMA (CONSOLIDATED v3.5 - ROBUST SEEDING)
-- Matches Production Requirements & Server-Side Calculation Rules
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CONFIGURATION & EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. CORE TABLES (Profiles, Settings, Logs)
-- ----------------------------------------------------------------------------

-- PROFILES (Public User Data)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    pickup_point TEXT,
    role TEXT DEFAULT 'USER', -- 'USER', 'ADMIN', 'STAFF'
    is_subscriber BOOLEAN DEFAULT FALSE,
    credit_balance NUMERIC DEFAULT 0,
    is_blocked BOOLEAN DEFAULT FALSE,
    referral_code TEXT,
    referred_by TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- APP SETTINGS (Global Config)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB
);

-- SYSTEM LOGS (Error Tracking)
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    level TEXT, -- 'INFO', 'WARN', 'ERROR'
    message TEXT,
    details TEXT,
    user_id UUID,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. STORE COMMERCE (Products, Cycles, Baskets)
-- ----------------------------------------------------------------------------

-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    size TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    image TEXT,
    images TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    stock_status TEXT DEFAULT 'IN_STOCK',
    stock_quantity INTEGER DEFAULT 100,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CYCLES (Monthly Windows)
CREATE TABLE IF NOT EXISTS public.cycles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    month_year TEXT,
    status TEXT DEFAULT 'OPEN', -- 'OPEN', 'LOCKED', 'CLOSED'
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ, -- The Lock Date
    delivery_date TIMESTAMPTZ,
    assessment_date TIMESTAMPTZ, -- Grace period end
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BASKETS (User Orders)
CREATE TABLE IF NOT EXISTS public.baskets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    cycle_id UUID REFERENCES public.cycles(id),
    status TEXT DEFAULT 'OPEN', -- 'OPEN', 'LOCKED', 'PAID', 'COLLECTED'
    total_price NUMERIC DEFAULT 0,
    amount_paid NUMERIC DEFAULT 0,
    delivery_fee NUMERIC DEFAULT 0,
    coupon_code TEXT,
    delivery_code TEXT,
    delivery_batch TEXT, -- 'A', 'B', 'C'
    
    -- Top Up Logic
    top_up_requested BOOLEAN DEFAULT FALSE,
    top_up_approved BOOLEAN DEFAULT FALSE,
    top_up_amount NUMERIC DEFAULT 0,
    top_up_denial_reason TEXT,
    
    -- Refund/Rollover
    refund_requested BOOLEAN DEFAULT FALSE,
    is_rolled_over BOOLEAN DEFAULT FALSE,
    
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, cycle_id)
);

-- BASKET ITEMS
CREATE TABLE IF NOT EXISTS public.basket_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    basket_id UUID REFERENCES public.baskets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    cycle_id UUID REFERENCES public.cycles(id),
    product_id UUID REFERENCES public.products(id),
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    total_price NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
    payment_status TEXT DEFAULT 'UNPAID',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(basket_id, product_id)
);

-- DELIVERY CODES (For Pickup)
CREATE TABLE IF NOT EXISTS public.delivery_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    delivery_code TEXT UNIQUE,
    basket_id UUID REFERENCES public.baskets(id),
    full_name TEXT,
    phone TEXT,
    hall TEXT, -- Replaces pickup_point
    batch TEXT,
    status TEXT DEFAULT 'READY', -- 'READY', 'COLLECTED'
    collected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COUPONS (Referrals/Associates)
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE,
    associate_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. SUBSCRIPTION & CREDIT (SML Pro Features)
-- ----------------------------------------------------------------------------

-- PLANS
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_amount NUMERIC(10,2) NOT NULL,
    price_currency VARCHAR(3) DEFAULT 'GHS',
    billing_period VARCHAR(50) DEFAULT 'semester',
    is_active BOOLEAN DEFAULT TRUE,
    features JSONB DEFAULT '[]'::jsonb,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.subscription_plans(id),
    status VARCHAR(50) DEFAULT 'active',
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    paystack_authorization_code VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- CREDIT FACILITIES
CREATE TABLE IF NOT EXISTS public.credit_facilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) UNIQUE,
    plan_code TEXT DEFAULT 'standard',
    credit_limit NUMERIC DEFAULT 0,
    available_credit NUMERIC DEFAULT 0,
    used_credit NUMERIC DEFAULT 0,
    outstanding_balance NUMERIC DEFAULT 0,
    interest_rate NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREDIT TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    credit_facility_id UUID REFERENCES public.credit_facilities(id),
    user_id UUID REFERENCES public.profiles(id),
    type TEXT, -- 'top_up', 'repayment'
    amount NUMERIC,
    balance_before NUMERIC,
    balance_after NUMERIC,
    description TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. MARKETING (Deals & Notifications)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(50),
    title TEXT,
    message TEXT,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exclusive_deals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    eligible_plans JSONB DEFAULT '["sml"]'::jsonb,
    discount_amount NUMERIC(10,2),
    discount_percentage INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    access_start TIMESTAMPTZ DEFAULT NOW(),
    access_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deal_claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.exclusive_deals(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'claimed',
    claimed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS unique_deal_claim ON deal_claims (user_id, deal_id);

-- ----------------------------------------------------------------------------
-- 6. PAYMENTS & LOGGING
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    basket_id UUID REFERENCES public.baskets(id),
    cycle_id UUID REFERENCES public.cycles(id),
    subscription_id UUID REFERENCES public.user_subscriptions(id),
    
    reference VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GHS',
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    channel VARCHAR(50),
    ip_address VARCHAR(45),
    paystack_data JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_methods (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade,
    paystack_authorization_code varchar(255) unique,
    last4 varchar(4),
    card_type varchar(50),
    bank varchar(100),
    country_code varchar(2),
    brand varchar(50),
    reusable boolean default true,
    is_active boolean default true,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public.payment_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    reference VARCHAR(255),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    request_data JSONB,
    response_data JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WEBHOOK EVENTS (For Audit)
CREATE TABLE IF NOT EXISTS public.paystack_webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event TEXT,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REFUNDS (Legacy / Optional)
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_reference TEXT,
    amount NUMERIC,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. VIEWS (Reporting)
-- ----------------------------------------------------------------------------

-- ADMIN USER CONTACTS VIEW (Used for Debtors Export)
CREATE OR REPLACE VIEW public.admin_user_contacts AS
SELECT 
    p.full_name,
    p.phone,
    p.email,
    p.pickup_point,
    c.name as cycle_name,
    c.id as cycle_id,
    b.total_price as total_due,
    b.amount_paid as total_paid,
    (b.total_price - b.amount_paid) as balance,
    b.status
FROM baskets b
JOIN profiles p ON b.user_id = p.id
JOIN cycles c ON b.cycle_id = c.id;

-- ----------------------------------------------------------------------------
-- 8. TRIGGERS & FUNCTIONS
-- ----------------------------------------------------------------------------

-- A. Auto-Profile Creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role, pickup_point, referral_code)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'role', 'USER'),
    COALESCE(new.raw_user_meta_data->>'pickup_point', 'Hall 7'),
    new.raw_user_meta_data->>'referral_code_input'
  )
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- B. Auto-Update Timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_modtime ON profiles;
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- C. AUTO-CALCULATE BASKET TOTALS (SERVER-SIDE LOGIC)
-- This trigger ensures that the Basket Total is always the sum of its items.
CREATE OR REPLACE FUNCTION public.update_basket_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.baskets 
    SET 
        total_price = (
            SELECT COALESCE(SUM(quantity * unit_price), 0) 
            FROM public.basket_items 
            WHERE basket_id = COALESCE(NEW.basket_id, OLD.basket_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.basket_id, OLD.basket_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_basket_totals ON public.basket_items;
CREATE TRIGGER trigger_update_basket_totals
AFTER INSERT OR UPDATE OR DELETE ON public.basket_items
FOR EACH ROW EXECUTE PROCEDURE public.update_basket_totals();

-- D. Check Cycle Access (Timeline Logic)
CREATE OR REPLACE FUNCTION check_cycle_access(p_user_id UUID, p_cycle_id UUID)
RETURNS TABLE (
    can_access BOOLEAN,
    can_add_to_cart BOOLEAN,
    can_pay BOOLEAN,
    phase VARCHAR(20),
    message TEXT
) AS $$
DECLARE
    v_user_join_date TIMESTAMPTZ;
    v_cycle_record RECORD;
    v_current_date TIMESTAMPTZ := NOW();
    v_open_date TIMESTAMPTZ;
    v_lock_date TIMESTAMPTZ;
    v_assess_date TIMESTAMPTZ;
BEGIN
    SELECT created_at INTO v_user_join_date FROM public.profiles WHERE id = p_user_id;
    SELECT * INTO v_cycle_record FROM public.cycles WHERE id = p_cycle_id;
    
    v_open_date := v_cycle_record.start_date;
    v_lock_date := v_cycle_record.end_date;
    v_assess_date := COALESCE(v_cycle_record.assessment_date, v_cycle_record.delivery_date); 

    IF v_user_join_date > v_lock_date THEN
        RETURN QUERY SELECT false, false, false, 'no_access'::VARCHAR, 'You joined after the cycle lock date'::TEXT;
        RETURN;
    END IF;
    
    IF v_current_date < v_open_date THEN
        RETURN QUERY SELECT true, false, false, 'upcoming'::VARCHAR, ('Cycle starts on ' || TO_CHAR(v_open_date, 'Mon DD, YYYY'))::TEXT;
    ELSIF v_current_date >= v_open_date AND v_current_date <= v_lock_date THEN
        RETURN QUERY SELECT true, true, true, 'active'::VARCHAR, ('Active until ' || TO_CHAR(v_lock_date, 'Mon DD, HH24:MI'))::TEXT;
    ELSIF v_current_date > v_lock_date AND v_current_date <= v_assess_date THEN
        RETURN QUERY SELECT true, false, true, 'locked'::VARCHAR, ('Cycle locked - payments accepted until ' || TO_CHAR(v_assess_date, 'Mon DD'))::TEXT;
    ELSE
        RETURN QUERY SELECT true, false, false, 'assessing'::VARCHAR, 'Cycle assessment in progress'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- E. Add Item To Cycle (Enforces locking)
CREATE OR REPLACE FUNCTION public.add_item_to_cycle(p_product_id uuid, p_quantity integer) 
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare
  v_cycle_id uuid;
  v_basket_id uuid;
  v_price numeric;
  v_user_id uuid;
  v_access record;
begin
  v_user_id := auth.uid();
  
  select id into v_cycle_id from cycles where start_date <= now() order by start_date desc limit 1;

  if v_cycle_id is null then
     return jsonb_build_object('success', false, 'message', 'No active cycle found');
  end if;

  select * into v_access from check_cycle_access(v_user_id, v_cycle_id);
  if not v_access.can_add_to_cart then
     return jsonb_build_object('success', false, 'message', 'Cycle is locked for new items');
  end if;

  insert into baskets (user_id, cycle_id, status) values (v_user_id, v_cycle_id, 'OPEN') on conflict (user_id, cycle_id) do nothing;
  select id into v_basket_id from baskets where user_id = v_user_id and cycle_id = v_cycle_id;
  
  select price into v_price from products where id = p_product_id;

  if p_quantity <= 0 then
    delete from basket_items where basket_id = v_basket_id and product_id = p_product_id;
  else
    insert into basket_items (basket_id, user_id, cycle_id, product_id, quantity, unit_price, payment_status)
    values (v_basket_id, v_user_id, v_cycle_id, p_product_id, p_quantity, v_price, 'UNPAID')
    on conflict (basket_id, product_id)
    do update set quantity = EXCLUDED.quantity, unit_price = EXCLUDED.unit_price;
  end if;

  -- NOTE: The basket total_price is updated automatically by the 'trigger_update_basket_totals' trigger.

  return jsonb_build_object('success', true, 'status', 'OPEN');
end;
$$;

-- F. Create Payment Record (Robust)
CREATE OR REPLACE FUNCTION create_payment_record(
    p_user_id UUID,
    p_reference VARCHAR(255),
    p_amount DECIMAL(10,2),
    p_currency VARCHAR(3) DEFAULT 'GHS',
    p_status VARCHAR(20) DEFAULT 'pending',
    p_payment_method VARCHAR(50) DEFAULT 'paystack',
    p_channel VARCHAR(50) DEFAULT 'unknown',
    p_ip_address VARCHAR(45) DEFAULT 'unknown',
    p_paystack_data JSONB DEFAULT '{}'::jsonb,
    p_subscription_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment_id UUID;
    v_basket_id UUID;
    v_cycle_id UUID;
    v_existing_id UUID;
BEGIN
    SELECT id INTO v_existing_id FROM payments WHERE reference = p_reference;
    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'payment_id', v_existing_id, 'message', 'Payment already exists');
    END IF;

    -- Extract Basket ID from metadata if available
    IF p_paystack_data ? 'metadata' AND (p_paystack_data->'metadata')::jsonb ? 'basketId' THEN
        BEGIN
            v_basket_id := (p_paystack_data->'metadata'->>'basketId')::UUID;
            IF v_basket_id IS NOT NULL THEN
                SELECT cycle_id INTO v_cycle_id FROM baskets WHERE id = v_basket_id;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_basket_id := NULL;
        END;
    END IF;

    -- Auto-match Basket if not provided
    IF v_basket_id IS NULL AND p_subscription_id IS NULL THEN
        SELECT id, cycle_id INTO v_basket_id, v_cycle_id 
        FROM baskets 
        WHERE user_id = p_user_id AND status IN ('OPEN', 'LOCKED', 'PARTIAL') 
        ORDER BY created_at DESC LIMIT 1;
    END IF;

    INSERT INTO payments (
        user_id, basket_id, cycle_id, reference, amount, currency, status, 
        payment_method, channel, ip_address, paystack_data, subscription_id
    ) VALUES (
        p_user_id, v_basket_id, v_cycle_id, p_reference, p_amount, p_currency, p_status, 
        p_payment_method, p_channel, p_ip_address, p_paystack_data, p_subscription_id
    ) RETURNING id INTO v_payment_id;

    -- Update Basket Balance
    IF v_basket_id IS NOT NULL AND p_status = 'success' THEN
        UPDATE baskets 
        SET amount_paid = amount_paid + p_amount,
            -- Add 0.01 tolerance for floating point math errors
            status = CASE WHEN (amount_paid + p_amount) >= (total_price - 0.01) THEN 'PAID' ELSE status END,
            updated_at = NOW()
        WHERE id = v_basket_id;
    END IF;

    INSERT INTO payment_logs (event_type, reference, user_id, request_data)
    VALUES ('rpc_payment_created', p_reference, p_user_id, jsonb_build_object('pid', v_payment_id));

    RETURN jsonb_build_object('success', true, 'payment_id', v_payment_id, 'message', 'Payment recorded');
EXCEPTION WHEN OTHERS THEN
    INSERT INTO payment_logs (event_type, reference, user_id, error_message)
    VALUES ('rpc_payment_error', p_reference, p_user_id, SQLERRM);
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- G. Auto-Delivery Code
CREATE OR REPLACE FUNCTION generate_delivery_code_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_user_profile RECORD;
    v_code TEXT;
BEGIN
    IF (NEW.status = 'PAID' OR NEW.status = 'COLLECTED') AND (OLD.status != 'PAID' AND OLD.status != 'COLLECTED') THEN
        IF EXISTS (SELECT 1 FROM delivery_codes WHERE basket_id = NEW.id) THEN
            RETURN NEW;
        END IF;

        SELECT * INTO v_user_profile FROM profiles WHERE id = NEW.user_id;
        v_code := 'SML-' || UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 4));

        INSERT INTO delivery_codes (delivery_code, basket_id, full_name, phone, hall, batch, status) 
        VALUES (v_code, NEW.id, v_user_profile.full_name, v_user_profile.phone, v_user_profile.pickup_point, 'A', 'READY');

        NEW.delivery_code := v_code;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_basket_paid ON baskets;
CREATE TRIGGER on_basket_paid BEFORE UPDATE ON baskets
FOR EACH ROW EXECUTE PROCEDURE generate_delivery_code_trigger();

-- H. Collect Basket
CREATE OR REPLACE FUNCTION collect_basket(p_delivery_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_basket_id uuid;
  v_user_name text;
  v_item_count int;
BEGIN
  SELECT basket_id INTO v_basket_id FROM delivery_codes WHERE delivery_code = p_delivery_code AND status = 'READY';
  
  IF v_basket_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid or already collected code');
  END IF;

  UPDATE delivery_codes SET status = 'COLLECTED', collected_at = NOW() WHERE delivery_code = p_delivery_code;
  UPDATE baskets SET status = 'COLLECTED', updated_at = NOW() WHERE id = v_basket_id;

  SELECT full_name INTO v_user_name FROM profiles WHERE id = (SELECT user_id FROM baskets WHERE id = v_basket_id);
  SELECT count(*) INTO v_item_count FROM basket_items WHERE basket_id = v_basket_id;

  RETURN jsonb_build_object('success', true, 'message', 'Collection successful', 'student', v_user_name, 'count', v_item_count);
END;
$$;

-- I. Claim Deal
CREATE OR REPLACE FUNCTION claim_exclusive_deal(p_user_id UUID, p_deal_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM exclusive_deals WHERE id = p_deal_id AND is_active = true AND access_start <= now() AND access_end >= now()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Deal not available');
  END IF;

  INSERT INTO deal_claims (user_id, deal_id, status) VALUES (p_user_id, p_deal_id, 'claimed') ON CONFLICT (user_id, deal_id) DO NOTHING;
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- J. Lock Cycle Logic
CREATE OR REPLACE FUNCTION lock_cycle_baskets()
RETURNS void AS $$
BEGIN
    UPDATE public.baskets b
    SET status = 'LOCKED', locked_at = NOW(), updated_at = NOW()
    FROM public.cycles c
    WHERE b.cycle_id = c.id AND c.end_date <= NOW() AND c.status = 'OPEN' AND b.status = 'OPEN';
    
    UPDATE public.cycles SET status = 'LOCKED', updated_at = NOW()
    WHERE end_date <= NOW() AND status = 'OPEN';
END;
$$ LANGUAGE plpgsql;

-- K. Start New Cycle
CREATE OR REPLACE FUNCTION start_new_cycle(p_name text, p_start_date timestamptz, p_end_date timestamptz, p_lock_date timestamptz, p_delivery_date timestamptz) 
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE cycles SET status = 'CLOSED' WHERE status = 'OPEN';
  INSERT INTO cycles (name, start_date, end_date, delivery_date, status, assessment_date)
  VALUES (p_name, p_start_date, p_end_date, p_delivery_date, 'OPEN', p_lock_date);
END;
$$;

-- L. Helper RPCs
CREATE OR REPLACE FUNCTION get_user_cycle_summary(p_cycle_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
  v_basket record;
  v_items jsonb;
BEGIN
  v_user_id := auth.uid();
  SELECT * INTO v_basket FROM baskets WHERE user_id = v_user_id AND cycle_id = p_cycle_id;
  IF v_basket IS NULL THEN RETURN NULL; END IF;

  SELECT jsonb_agg(jsonb_build_object(
    'productId', bi.product_id, 'quantity', bi.quantity, 'unitPrice', bi.unit_price, 'totalPrice', bi.total_price,
    'product', (SELECT row_to_json(p) FROM products p WHERE p.id = bi.product_id)
  )) INTO v_items FROM basket_items bi WHERE bi.basket_id = v_basket.id;

  RETURN jsonb_build_object(
    'id', v_basket.id, 'status', v_basket.status, 'totalValue', v_basket.total_price, 'amountPaid', v_basket.amount_paid,
    'balance', (v_basket.total_price - v_basket.amount_paid), 'delivery_fee', v_basket.delivery_fee,
    'coupon_code', v_basket.coupon_code, 'deliveryCode', v_basket.delivery_code, 'items', COALESCE(v_items, '[]'::jsonb),
    'metadata', jsonb_build_object('pickupPoint', (SELECT pickup_point FROM profiles WHERE id = v_user_id))
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_all_profiles_secure()
RETURNS SETOF profiles LANGUAGE sql SECURITY DEFINER AS $$
  SELECT * FROM profiles;
$$;

CREATE OR REPLACE FUNCTION get_procurement_list()
RETURNS TABLE ("productId" uuid, "productName" text, "unitSize" text, "totalQuantity" bigint, "unitPrice" numeric, "totalCost" numeric) 
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY SELECT 
    p.id, p.name, p.size, SUM(bi.quantity), p.price, SUM(bi.quantity * p.price)
  FROM basket_items bi JOIN products p ON bi.product_id = p.id JOIN baskets b ON bi.basket_id = b.id
  WHERE b.status IN ('PAID', 'COLLECTED') GROUP BY p.id, p.name, p.size, p.price;
END;
$$;

CREATE OR REPLACE FUNCTION get_associate_report()
RETURNS TABLE (associate_name text, coupon_code text, month text, active_users bigint) 
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY SELECT 
        c.associate_name, c.code, to_char(b.created_at, 'Mon YYYY'), count(distinct b.user_id)
    FROM coupons c LEFT JOIN baskets b ON b.coupon_code = c.code
    GROUP BY 1, 2, 3 ORDER BY 3 DESC;
END;
$$;

CREATE OR REPLACE FUNCTION admin_get_user_cycle_history(p_user_id uuid)
RETURNS TABLE ("cycleId" uuid, "cycleName" text, "status" text, "totalValue" numeric, "amountPaid" numeric, "balance" numeric, "itemCount" bigint, "deliveryCode" text, "deliveryStatus" text, "items" jsonb) 
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY SELECT 
        c.id, c.name, b.status, b.total_price, b.amount_paid, (b.total_price - b.amount_paid),
        (SELECT count(*) FROM basket_items bi WHERE bi.basket_id = b.id), b.delivery_code, b.status,
        (SELECT jsonb_agg(jsonb_build_object('name', p.name, 'size', p.size, 'quantity', bi.quantity, 'total', bi.total_price))
         FROM basket_items bi JOIN products p ON bi.product_id = p.id WHERE bi.basket_id = b.id)
    FROM baskets b JOIN cycles c ON b.cycle_id = c.id WHERE b.user_id = p_user_id ORDER BY c.start_date DESC;
END;
$$;

CREATE OR REPLACE FUNCTION approve_top_up(p_basket_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE baskets SET top_up_approved = true, amount_paid = total_price, status = 'PAID', updated_at = NOW() WHERE id = p_basket_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 9. SECURITY (Row Level Security)
-- ----------------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE baskets ENABLE ROW LEVEL SECURITY;
ALTER TABLE basket_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exclusive_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- CRITICAL: EXPLICIT PERMISSION GRANTS
-- Must run these to allow anon/authenticated access before policies kick in.
-- ----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Public Read Policies (For Marketplace / Landing Page)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public Read Products" ON products;
    CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public Read Cycles" ON cycles;
    CREATE POLICY "Public Read Cycles" ON cycles FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public Read Settings" ON app_settings;
    CREATE POLICY "Public Read Settings" ON app_settings FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public Read Plans" ON subscription_plans;
    CREATE POLICY "Public Read Plans" ON subscription_plans FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public Read Deals" ON exclusive_deals;
    CREATE POLICY "Public Read Deals" ON exclusive_deals FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- User Specific Policies
DO $$ BEGIN
    CREATE POLICY "User Own Profile" ON profiles FOR ALL USING (auth.uid() = id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "User Own Basket" ON baskets FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "User Own Items" ON basket_items FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "User Own Payments" ON payments FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "User Own Subs" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "User Own Claims" ON deal_claims FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Admin Policies
DO $$ BEGIN
    CREATE POLICY "Admin Full Access" ON products FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admin View Baskets" ON baskets FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admin Full Cycles" ON cycles FOR ALL USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
    );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admin Full Settings" ON app_settings FOR ALL USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
    );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 10. SEED DATA
-- ----------------------------------------------------------------------------

INSERT INTO public.subscription_plans (name, code, description, price_amount, display_order, features)
VALUES 
('Standard', 'standard', 'Pay as you go. Perfect for disciplined savers.', 0.00, 1, '[{"name":"Wholesale Prices","icon":"🛒","description":"Access low prices"},{"name":"Campus Delivery","icon":"🚚","description":"Free delivery on 28th"}]'),
('SML Subscriber', 'sml', 'Unlock credit facility and priority service.', 15.00, 2, '[{"name":"Credit Facility","icon":"💳","description":"Top-up loans available"},{"name":"Priority Delivery","icon":"⚡","description":"Skip the queue"},{"name":"Exclusive Deals","icon":"🌟","description":"Member-only discounts"}]')
ON CONFLICT (code) DO NOTHING;

-- SEED: ACTIVE CYCLE
-- Use DO block to prevent duplicates on name
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.cycles WHERE name = 'Launch Cycle') THEN
        INSERT INTO public.cycles (name, month_year, status, start_date, end_date, delivery_date)
        VALUES ('Launch Cycle', 'Current', 'OPEN', NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', NOW() + INTERVAL '35 days');
    END IF;
END $$;

-- SEED: PRODUCTS
-- Use INSERT ... SELECT ... WHERE NOT EXISTS for idempotency
INSERT INTO public.products (name, category, size, price, stock_status, image)
SELECT 'Perfumed Rice', 'Grains', '5kg', 120.00, 'IN_STOCK', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Perfumed Rice');

INSERT INTO public.products (name, category, size, price, stock_status, image)
SELECT 'Vegetable Oil', 'Oils', '1L Bottle', 45.00, 'IN_STOCK', 'https://images.unsplash.com/photo-1474979266404-7cadd259c308?auto=format&fit=crop&w=400&q=80'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Vegetable Oil');

INSERT INTO public.products (name, category, size, price, stock_status, image)
SELECT 'Canned Mackerel', 'Canned', '425g', 18.50, 'IN_STOCK', 'https://images.unsplash.com/photo-1597362925123-778f1d3569c6?auto=format&fit=crop&w=400&q=80'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Canned Mackerel');

INSERT INTO public.products (name, category, size, price, stock_status, image)
SELECT 'Indomie Noodles', 'Noodles', 'Box (40pcs)', 110.00, 'IN_STOCK', 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Indomie Noodles');

INSERT INTO public.products (name, category, size, price, stock_status, image)
SELECT 'Tomatoes Paste', 'Canned', '2.2kg', 65.00, 'IN_STOCK', 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?auto=format&fit=crop&w=400&q=80'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Tomatoes Paste');

-- SEED: APP SETTINGS
INSERT INTO public.app_settings (key, value) VALUES 
('GLOBAL_CONFIG', '{"isActive": true, "cycleName": "SML Launch Cycle", "deliveryDate": "2024-12-28", "basketServiceFeePercentage": 5, "topUpServiceFeePercentage": 10}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- SEED: EXCLUSIVE DEAL
INSERT INTO public.exclusive_deals (name, description, discount_percentage, access_end)
SELECT 'Flash Sale: Rice', 'Get 10% off all rice bags for the next 24 hours!', 10, NOW() + INTERVAL '24 hours'
WHERE NOT EXISTS (SELECT 1 FROM public.exclusive_deals WHERE name = 'Flash Sale: Rice');

-- Explicit Exec Permissions for RPCs
GRANT EXECUTE ON FUNCTION create_payment_record TO service_role;
GRANT EXECUTE ON FUNCTION create_payment_record TO authenticated;
GRANT EXECUTE ON FUNCTION check_cycle_access TO anon, authenticated, service_role;
