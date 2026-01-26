
-- 1. EXTENSIONS
create extension if not exists "pgcrypto";
create extension if not exists "moddatetime";

-- 2. ENUMS (Safe Creation)
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

DO $$ BEGIN
    create type payment_status as enum ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
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

-- 4. CYCLES (Shopping Windows)
create table if not exists public.cycles (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  delivery_date timestamptz not null,
  is_active boolean default false,
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
  
  -- Financial Snapshots
  subtotal numeric(10,2) default 0,
  service_fee numeric(10,2) default 0,
  total_price numeric(10,2) default 0,
  amount_paid numeric(10,2) default 0,
  
  -- Top Up Logic
  top_up_requested boolean default false,
  top_up_approved boolean default false,
  top_up_amount numeric(10,2) default 0,

  -- Delivery Logic
  delivery_code text unique,
  pickup_timestamp timestamptz,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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

-- 9. APP SETTINGS
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  description text
);

-- --- TRIGGERS & FUNCTIONS ---

-- HELPER: Check Admin Status Safely (Prevents Recursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

-- 1. Handle New User (Auto-generate Referral Code)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_ref_code text;
  v_name_part text;
begin
  -- Generate a simplified referral code: First 3 letters of name + 4 random digits
  v_name_part := upper(substring(coalesce(new.raw_user_meta_data->>'full_name', 'USER'), 1, 3));
  v_ref_code := v_name_part || '-' || floor(random() * 9000 + 1000)::text;

  insert into public.profiles (id, email, full_name, referral_code)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', v_ref_code)
  on conflict (id) do nothing;
  
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger safely
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Handle Updated At
drop trigger if exists handle_updated_at on public.profiles;
create trigger handle_updated_at before update on public.profiles
  for each row execute procedure moddatetime (updated_at);

drop trigger if exists handle_updated_at on public.products;
create trigger handle_updated_at before update on public.products
  for each row execute procedure moddatetime (updated_at);

drop trigger if exists handle_updated_at on public.baskets;
create trigger handle_updated_at before update on public.baskets
  for each row execute procedure moddatetime (updated_at);

-- Basket Calculation Trigger
create or replace function public.recalculate_basket()
returns trigger as $$
begin
  update public.baskets
  set subtotal = (
    select coalesce(sum(total_price), 0)
    from public.basket_items
    where basket_id = coalesce(new.basket_id, old.basket_id)
  ),
  updated_at = now()
  where id = coalesce(new.basket_id, old.basket_id);
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_basket_item_change on public.basket_items;
create trigger on_basket_item_change
  after insert or update or delete on public.basket_items
  for each row execute procedure public.recalculate_basket();

-- SECURE PAYMENT PROCESSING FUNCTION
create or replace function public.process_payment(
  p_reference text,
  p_basket_id uuid,
  p_amount numeric,
  p_type text -- 'PAYMENT' or 'SUBSCRIPTION'
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_basket public.baskets%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_hall_code text;
  v_new_code text;
  v_already_exists boolean;
begin
  v_user_id := auth.uid();
  
  -- 1. Idempotency Check
  select exists(select 1 from public.payments where id = p_reference) into v_already_exists;
  if v_already_exists then
    return jsonb_build_object('success', true, 'message', 'Payment already processed');
  end if;

  -- 2. Insert Payment Record
  insert into public.payments (id, user_id, basket_id, amount, type, status)
  values (p_reference, v_user_id, (case when p_type = 'SUBSCRIPTION' then null else p_basket_id end), p_amount, p_type, 'SUCCESS');

  -- 3. Handle Logic based on Type
  if p_type = 'SUBSCRIPTION' then
     update public.profiles set is_subscriber = true where id = v_user_id;
     return jsonb_build_object('success', true, 'message', 'Subscription activated');
  else
     -- Update Basket Amount (Pay Small Small Logic)
     select * into v_basket from public.baskets where id = p_basket_id;
     if not found then
        raise exception 'Basket not found';
     end if;

     -- Calculate new paid amount
     update public.baskets 
     set amount_paid = coalesce(amount_paid, 0) + p_amount
     where id = p_basket_id
     returning * into v_basket;

     -- 4. Check for Completion & Generate Code
     -- Only mark as PAID if full amount is covered (tolerance of 0.5 GHS)
     if v_basket.amount_paid >= (v_basket.total_price - 0.5) and v_basket.status != 'PAID' then
        select * into v_profile from public.profiles where id = v_user_id;
        
        v_hall_code := case v_profile.pickup_point
            when 'Conti' then 'CNT'
            when 'Africa' then 'AFR'
            when 'Queens' then 'QNS'
            when 'Republic' then 'REP'
            when 'Indece' then 'IND'
            when 'SRC' then 'SRC'
            when 'Katanga' then 'KAT'
            when 'Hall 7' then 'HL7'
            when 'Brunei' then 'BRU'
            else 'GEN'
        end;

        v_new_code := 'SML-KNUST-' || v_hall_code || '-B1-' || floor(random() * 9000 + 1000)::text;

        update public.baskets
        set status = 'PAID',
            delivery_code = v_new_code
        where id = p_basket_id;
        
        return jsonb_build_object('success', true, 'message', 'Payment successful. Code generated.', 'code', v_new_code);
     end if;

     return jsonb_build_object('success', true, 'message', 'Partial payment recorded');
  end if;
end;
$$;

-- --- RLS POLICIES ---
-- Enable RLS
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.cycles enable row level security;
alter table public.baskets enable row level security;
alter table public.basket_items enable row level security;
alter table public.payments enable row level security;
alter table public.app_settings enable row level security;

-- Drop existing policies to prevent errors on re-run
drop policy if exists "Read Own Profile" on public.profiles;
drop policy if exists "Update Own Profile" on public.profiles;
drop policy if exists "Admin Read All Profiles" on public.profiles;
drop policy if exists "Admin Update All Profiles" on public.profiles;
drop policy if exists "Public Read Products" on public.products;
drop policy if exists "Admin Write Products" on public.products;
drop policy if exists "Public Read Cycles" on public.cycles;
drop policy if exists "Admin Write Cycles" on public.cycles;
drop policy if exists "Owner Read Basket" on public.baskets;
drop policy if exists "Owner Create Basket" on public.baskets;
drop policy if exists "Owner Update Basket Basics" on public.baskets;
drop policy if exists "Admin Manage Baskets" on public.baskets;
drop policy if exists "Owner Manage Items" on public.basket_items;
drop policy if exists "Owner Read Payments" on public.payments;
drop policy if exists "Admin Read Payments" on public.payments;
drop policy if exists "Public Read Settings" on public.app_settings;
drop policy if exists "Admin Write Settings" on public.app_settings;

-- Recreate Policies using is_admin() to prevent recursion
create policy "Read Own Profile" on public.profiles for select using (auth.uid() = id);
create policy "Update Own Profile" on public.profiles for update using (auth.uid() = id);
create policy "Admin Read All Profiles" on public.profiles for select using (public.is_admin());
create policy "Admin Update All Profiles" on public.profiles for update using (public.is_admin());

create policy "Public Read Products" on public.products for select using (true);
create policy "Admin Write Products" on public.products for all using (public.is_admin());

create policy "Public Read Cycles" on public.cycles for select using (true);
create policy "Admin Write Cycles" on public.cycles for all using (public.is_admin());

create policy "Owner Read Basket" on public.baskets for select using (auth.uid() = user_id);
create policy "Owner Create Basket" on public.baskets for insert with check (auth.uid() = user_id);
create policy "Owner Update Basket Basics" on public.baskets for update using (auth.uid() = user_id);
create policy "Admin Manage Baskets" on public.baskets for all using (public.is_admin());

create policy "Owner Manage Items" on public.basket_items for all using (exists (select 1 from public.baskets where id = basket_items.basket_id and user_id = auth.uid()));

create policy "Owner Read Payments" on public.payments for select using (user_id = auth.uid());
create policy "Admin Read Payments" on public.payments for select using (public.is_admin());

create policy "Public Read Settings" on public.app_settings for select using (true);
create policy "Admin Write Settings" on public.app_settings for all using (public.is_admin());

-- Seed Data (Safe Insert)
insert into public.app_settings (key, value, description) values
('GLOBAL_CONFIG', '{"basketServiceFeePercentage": 5, "heroImages": []}'::jsonb, 'General frontend configuration')
on conflict (key) do nothing;

insert into public.cycles (name, start_date, end_date, delivery_date, is_active) 
select 'Launch Cycle', now(), now() + interval '30 days', now() + interval '35 days', true
where not exists (select 1 from public.cycles where is_active = true);
