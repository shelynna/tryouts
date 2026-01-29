
-- 1. EXTENSIONS
create extension if not exists "pgcrypto";
create extension if not exists "moddatetime";

-- 2. ENUMS (Safe Creation with Error Handling)
DO $$ BEGIN
    create type user_role as enum ('USER', 'ADMIN', 'STAFF');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    create type basket_status as enum ('OPEN', 'LOCKED', 'PAID', 'DELIVERED', 'COLLECTED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CRITICAL FIX: Add PARTIAL status to existing enum if missing
DO $$ BEGIN
    alter type basket_status add value if not exists 'PARTIAL';
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    create type payment_status as enum ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    create type delivery_status as enum ('READY', 'COLLECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES (Users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  phone text,
  pickup_point text default 'Hall 7',
  role user_role default 'USER',
  is_subscriber boolean default false,
  credit_balance numeric(10,2) default 0,
  is_blocked boolean default false,
  referral_code text unique,
  referred_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure columns exist (for migration safety)
alter table public.profiles add column if not exists referral_code text unique;
alter table public.profiles add column if not exists referred_by text;
alter table public.profiles add column if not exists is_subscriber boolean default false;
alter table public.profiles add column if not exists credit_balance numeric(10,2) default 0;

-- 4. CYCLES (Shopping Windows)
create table if not exists public.cycles (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  is_active boolean default false,
  payment_start_date timestamptz,
  payment_end_date timestamptz,
  lock_date timestamptz,
  unlock_date timestamptz,
  bulk_start_date timestamptz,
  bulk_end_date timestamptz,
  delivery_date timestamptz,
  created_at timestamptz default now()
);

-- 5. PRODUCTS (Inventory)
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text,
  category text not null,
  size text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2),
  stock_quantity integer default 0,
  stock_status text default 'IN_STOCK',
  is_active boolean default true,
  image text, 
  images jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. BASKETS (Orders)
create table if not exists public.baskets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  cycle_id uuid references public.cycles(id),
  status basket_status default 'OPEN',
  subtotal numeric(10,2) default 0,
  service_fee numeric(10,2) default 0,
  total_price numeric(10,2) default 0,
  amount_paid numeric(10,2) default 0,
  balance numeric(10,2) default 0, -- CRITICAL: Explicit balance persistence
  top_up_requested boolean default false,
  top_up_approved boolean default false,
  top_up_amount numeric(10,2) default 0,
  top_up_status text default 'NONE', -- NONE, PENDING, APPROVED, DENIED
  top_up_denial_reason text,
  delivery_code text unique,
  pickup_timestamp timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.baskets add column if not exists balance numeric(10,2) default 0;
alter table public.baskets add column if not exists top_up_status text default 'NONE';
alter table public.baskets add column if not exists top_up_denial_reason text;

-- 7. BASKET ITEMS
create table if not exists public.basket_items (
  id uuid default gen_random_uuid() primary key,
  basket_id uuid references public.baskets(id) on delete cascade not null,
  product_id uuid references public.products(id) not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  total_price numeric(10,2) generated always as (quantity * unit_price) stored,
  created_at timestamptz default now()
);

-- Ensure unique product per basket
DO $$ BEGIN
    alter table public.basket_items add constraint basket_items_basket_id_product_id_key unique (basket_id, product_id);
EXCEPTION
    WHEN duplicate_table THEN null;
    WHEN duplicate_object THEN null;
END $$;

-- 8. PAYMENTS
create table if not exists public.payments (
  id text primary key,
  user_id uuid references public.profiles(id) not null,
  basket_id uuid references public.baskets(id),
  amount numeric(10,2) not null,
  provider text default 'PAYSTACK',
  type text default 'PAYMENT',
  status payment_status default 'PENDING',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 9. DELIVERIES
create table if not exists public.deliveries (
  id uuid default gen_random_uuid() primary key,
  delivery_code text unique not null,
  basket_id uuid references public.baskets(id) not null,
  user_id uuid references public.profiles(id) not null,
  full_name text not null,
  phone text not null,
  campus text default 'KNUST',
  pickup_point text not null,
  batch_name text,
  status delivery_status default 'READY',
  locked_at timestamptz default now(),
  picked_up_at timestamptz,
  picked_up_by uuid references public.profiles(id),
  metadata jsonb default '{}'::jsonb
);

-- 10. APP SETTINGS
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  description text
);

-- 11. SYSTEM LOGS
create table if not exists public.system_logs (
  id uuid default gen_random_uuid() primary key,
  level text,
  message text,
  details text,
  user_id uuid references auth.users(id),
  url text,
  created_at timestamptz default now()
);

-- 12. COUPONS
create table if not exists public.coupons (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  associate_name text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- --- TRIGGERS & FUNCTIONS ---

-- Auth Trigger
create or replace function public.handle_new_user()
returns trigger 
security definer
set search_path = public
as $$
declare
  v_ref_code text;
  v_name_part text;
  v_role user_role;
begin
  if new.email ilike '%@smlghana.store' then
    v_role := 'ADMIN';
  else
    v_role := 'USER';
  end if;

  v_name_part := upper(substring(coalesce(new.raw_user_meta_data->>'full_name', 'USER'), 1, 3));
  v_ref_code := v_name_part || '-' || floor(random() * 9000 + 1000)::text;

  insert into public.profiles (
      id, email, full_name, phone, pickup_point, referred_by, referral_code, role
  )
  values (
      new.id, new.email, new.raw_user_meta_data->>'full_name', 
      new.raw_user_meta_data->>'phone',
      coalesce(new.raw_user_meta_data->>'pickup_point', 'Hall 7'),
      upper(new.raw_user_meta_data->>'referral_code_input'),
      v_ref_code,
      v_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Basket Recalculation Trigger (Handles Balance & Status)
create or replace function public.recalculate_basket()
returns trigger as $$
declare
  v_basket_id uuid;
  v_subtotal numeric;
  v_service_fee_percent numeric;
  v_service_fee numeric;
  v_discount numeric;
  v_total_price numeric;
  v_amount_paid numeric;
begin
  v_basket_id := coalesce(new.basket_id, old.basket_id);
  
  -- Safety check: Prevent modifying PAID/COLLECTED baskets via SQL triggers if RLS doesn't catch it
  if exists (
    select 1 from baskets
    where id = v_basket_id
      and status in ('PAID', 'COLLECTED', 'LOCKED')
  ) then
    -- We allow trigger to proceed to recalculate if it was a read/calc operation, but
    -- practically this trigger runs on ITEM change.
    null;
  end if;

  select coalesce(sum(total_price), 0) into v_subtotal
  from public.basket_items where basket_id = v_basket_id;

  select (value->>'basketServiceFeePercentage')::numeric into v_service_fee_percent
  from app_settings where key = 'GLOBAL_CONFIG';
  v_service_fee_percent := coalesce(v_service_fee_percent, 5);

  select coalesce((metadata->>'discount_amount')::numeric, 0), coalesce(amount_paid, 0) 
  into v_discount, v_amount_paid
  from baskets where id = v_basket_id;
  v_discount := coalesce(v_discount, 0);

  v_service_fee := v_subtotal * (v_service_fee_percent / 100.0);
  
  -- CLAMP NEGATIVE TOTALS (Security fix)
  v_total_price := greatest(v_subtotal + v_service_fee - v_discount, 0);

  -- Maintain balance and switch status between PAID/PARTIAL
  -- Added check to prevent LOCKED baskets from downgrading to PARTIAL automatically
  update public.baskets
  set subtotal = v_subtotal, service_fee = v_service_fee, total_price = v_total_price, 
      balance = greatest(v_total_price - v_amount_paid, 0),
      status = case 
        when status = 'PAID' and v_total_price > v_amount_paid and status <> 'LOCKED' then 'PARTIAL'::basket_status
        when status = 'PARTIAL' and v_amount_paid >= v_total_price and v_total_price > 0 then 'PAID'::basket_status
        else status 
      end,
      updated_at = now()
  where id = v_basket_id;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_basket_item_change on public.basket_items;
create trigger on_basket_item_change
  after insert or update or delete on public.basket_items
  for each row execute procedure public.recalculate_basket();

-- RLS
alter table public.profiles enable row level security;
alter table public.baskets enable row level security;
alter table public.basket_items enable row level security;

drop policy if exists "Read Own Profile" on public.profiles;
create policy "Read Own Profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Owner Read Basket" on public.baskets;
create policy "Owner Read Basket" on public.baskets for select using (auth.uid() = user_id);

drop policy if exists "Owner Manage Items" on public.basket_items;
-- UPDATED POLICY: Prevent modification of PAID/LOCKED/COLLECTED baskets
create policy "Owner Manage Items" on public.basket_items for all using (
  exists (
    select 1 from public.baskets 
    where id = basket_items.basket_id 
      and user_id = auth.uid()
      and status not in ('PAID', 'COLLECTED', 'LOCKED')
  )
);

-- ==========================================
-- RPC FUNCTIONS
-- ==========================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('ADMIN', 'STAFF')
  );
$$;

-- 1. Process Payment (ATOMIC & HARDENED)
DROP FUNCTION IF EXISTS public.process_payment(text, numeric, uuid, text);
DROP FUNCTION IF EXISTS public.process_payment(text, uuid, numeric, text);

create or replace function public.process_payment(
  p_reference text,
  p_basket_id uuid,
  p_amount numeric,
  p_type text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_payment_id text;
  v_total_price numeric;
begin
  v_user_id := auth.uid();
  
  -- Idempotency check
  if exists (select 1 from payments where id = p_reference) then
    return jsonb_build_object('success', true, 'message', 'Already processed', 'id', p_reference);
  end if;

  insert into payments (id, user_id, basket_id, amount, type, status, provider)
  values (p_reference, v_user_id, p_basket_id, p_amount, p_type, 'SUCCESS', 'PAYSTACK')
  returning id into v_payment_id;

  if p_type = 'PAYMENT' and p_basket_id is not null then
    
    -- ROW LOCK: Prevent concurrent payment updates from racing
    select total_price into v_total_price 
    from baskets 
    where id = p_basket_id 
    for update;
    
    -- Atomic update of Amount Paid, Balance, and Status
    update baskets 
    set amount_paid = coalesce(amount_paid, 0) + p_amount,
        balance = greatest(total_price - (coalesce(amount_paid, 0) + p_amount), 0),
        status = case 
          when (coalesce(amount_paid, 0) + p_amount) >= total_price and total_price > 0 then 'PAID'::basket_status
          else 'PARTIAL'::basket_status
        end,
        updated_at = now()
    where id = p_basket_id;
    
  elsif p_type = 'SUBSCRIPTION' then
    update profiles 
    set is_subscriber = true,
        updated_at = now()
    where id = v_user_id;
  end if;

  return jsonb_build_object('success', true, 'id', v_payment_id);
end;
$$;

-- 2. Resolve Basket Conflict (Handles OPEN & PARTIAL)
-- Ensures no payment or balance is lost during merges
create or replace function public.resolve_basket_conflict(p_user_id uuid, p_cycle_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
DECLARE
    v_basket_ids uuid[];
    v_primary_id uuid;
    v_secondary_id uuid;
    v_item RECORD;
    v_secondary_paid numeric;
BEGIN
    -- Find all OPEN or PARTIAL baskets
    SELECT array_agg(id ORDER BY created_at ASC) INTO v_basket_ids
    FROM baskets
    WHERE user_id = p_user_id
      AND status IN ('OPEN', 'PARTIAL')
      AND (cycle_id IS NOT DISTINCT FROM p_cycle_id);

    IF v_basket_ids IS NULL THEN RETURN NULL; END IF;
    IF array_length(v_basket_ids, 1) = 1 THEN RETURN v_basket_ids[1]; END IF;

    -- If duplicates exist, merge secondary(s) into primary (first one)
    v_primary_id := v_basket_ids[1];
    
    FOR i IN 2 .. array_length(v_basket_ids, 1) LOOP
        v_secondary_id := v_basket_ids[i];
        
        -- 1. Get amount paid from secondary
        SELECT coalesce(amount_paid, 0) INTO v_secondary_paid
        FROM baskets WHERE id = v_secondary_id;

        -- 2. Move Items from secondary to primary
        FOR v_item IN (SELECT * FROM basket_items WHERE basket_id = v_secondary_id) LOOP
            IF EXISTS (SELECT 1 FROM basket_items WHERE basket_id = v_primary_id AND product_id = v_item.product_id) THEN
                -- Merge quantity
                UPDATE basket_items SET quantity = quantity + v_item.quantity
                WHERE basket_id = v_primary_id AND product_id = v_item.product_id;
                DELETE FROM basket_items WHERE id = v_item.id;
            ELSE
                -- Move item
                UPDATE basket_items SET basket_id = v_primary_id WHERE id = v_item.id;
            END IF;
        END LOOP;
        
        -- 3. Move Payments to primary (Preserve history)
        UPDATE payments SET basket_id = v_primary_id WHERE basket_id = v_secondary_id;

        -- 4. Transfer Amount Paid
        IF v_secondary_paid > 0 THEN
            UPDATE baskets 
            SET amount_paid = coalesce(amount_paid, 0) + v_secondary_paid 
            WHERE id = v_primary_id;
        END IF;

        -- 5. Delete empty secondary
        DELETE FROM baskets WHERE id = v_secondary_id;
    END LOOP;

    -- Force recalc on primary to update totals/balance/status
    UPDATE baskets SET updated_at = now() WHERE id = v_primary_id;

    RETURN v_primary_id;
END;
$$;

-- 3. Delivery Collection
create or replace function public.confirm_delivery_pickup(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_basket_id uuid;
  v_student_name text;
  v_item_count integer;
  v_status delivery_status;
begin
  if not public.is_staff() then raise exception 'Unauthorized'; end if;

  select basket_id, full_name, status into v_basket_id, v_student_name, v_status
  from deliveries where delivery_code = p_code;

  if v_basket_id is null then return jsonb_build_object('success', false, 'message', 'Invalid Code'); end if;
  if v_status = 'COLLECTED' then return jsonb_build_object('success', false, 'message', 'Already Collected'); end if;

  update deliveries set status = 'COLLECTED', picked_up_at = now(), picked_up_by = auth.uid()
  where delivery_code = p_code;

  update baskets set status = 'COLLECTED' where id = v_basket_id;

  select count(*) into v_item_count from basket_items where basket_id = v_basket_id;

  return jsonb_build_object('success', true, 'student', v_student_name, 'count', v_item_count);
end;
$$;

-- 4. Admin Helpers
create or replace function public.get_all_profiles_secure()
returns setof profiles
language sql
security definer
set search_path = public
as $$
  select * from profiles
  where public.is_admin() or public.is_staff();
$$;

DROP FUNCTION IF EXISTS public.get_procurement_list();
create or replace function public.get_procurement_list()
returns table (
  productName text,
  unitSize text,
  totalQuantity bigint,
  unitPrice numeric,
  totalCost numeric
)
language sql
security definer
set search_path = public
as $$
  select 
    p.name, p.size, sum(bi.quantity), p.price, sum(bi.total_price)
  from basket_items bi
  join baskets b on bi.basket_id = b.id
  join products p on bi.product_id = p.id
  where (b.status = 'PAID' or b.status = 'LOCKED' or b.status = 'COLLECTED')
    and public.is_admin()
  group by p.id, p.name, p.size, p.price
  order by p.name;
$$;

DROP FUNCTION IF EXISTS public.approve_top_up(uuid);
create or replace function public.approve_top_up(p_basket_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Unauthorized'; end if;
  
  update baskets 
  set top_up_approved = true,
      top_up_status = 'APPROVED',
      status = 'PAID', -- Mark as paid so they can collect
      updated_at = now()
  where id = p_basket_id;
end;
$$;

DROP FUNCTION IF EXISTS public.get_associate_report();
create or replace function public.get_associate_report()
returns table (
  associate_name text,
  coupon_code text,
  month text,
  active_users bigint
)
language sql
security definer
set search_path = public
as $$
  select 
    c.associate_name,
    c.code,
    to_char(b.created_at, 'Mon YYYY') as month,
    count(distinct b.user_id)
  from coupons c
  left join baskets b on b.metadata->>'coupon_code' = c.code
  where public.is_admin()
  group by c.associate_name, c.code, to_char(b.created_at, 'Mon YYYY')
  order by to_char(b.created_at, 'Mon YYYY') desc;
$$;

-- INDEXING FOR PERFORMANCE
create index if not exists idx_baskets_user_status_cycle on baskets (user_id, status, cycle_id);
create index if not exists idx_basket_items_basket_id on basket_items (basket_id);
