
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

-- MIGRATION: Ensure columns exist if table was created previously
alter table public.profiles add column if not exists referral_code text unique;
alter table public.profiles add column if not exists referred_by text;
alter table public.profiles add column if not exists is_subscriber boolean default false;
alter table public.profiles add column if not exists credit_balance numeric(10,2) default 0;

-- 4. CYCLES (Shopping Windows)
create table if not exists public.cycles (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  is_active boolean default false,
  created_at timestamptz default now()
);

alter table public.cycles add column if not exists payment_start_date timestamptz;
alter table public.cycles add column if not exists payment_end_date timestamptz;
alter table public.cycles add column if not exists lock_date timestamptz;
alter table public.cycles add column if not exists unlock_date timestamptz;
alter table public.cycles add column if not exists bulk_start_date timestamptz;
alter table public.cycles add column if not exists bulk_end_date timestamptz;
alter table public.cycles add column if not exists delivery_date timestamptz;

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

-- MIGRATION: Ensure product columns
alter table public.products add column if not exists stock_quantity integer default 0;
alter table public.products add column if not exists stock_status text default 'IN_STOCK';
alter table public.products add column if not exists is_active boolean default true;

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
  top_up_requested boolean default false,
  top_up_approved boolean default false,
  top_up_amount numeric(10,2) default 0,
  delivery_code text unique,
  pickup_timestamp timestamptz,
  metadata jsonb default '{}'::jsonb,
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

-- 12. COUPONS (Expansion Associates)
create table if not exists public.coupons (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  associate_name text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- --- TRIGGERS & FUNCTIONS ---

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

create or replace function public.ensure_user_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text;
  v_meta jsonb;
begin
  v_user_id := auth.uid();
  select email, raw_user_meta_data into v_email, v_meta from auth.users where id = v_user_id;

  if v_user_id is not null and not exists (select 1 from public.profiles where id = v_user_id) then
      insert into public.profiles (id, email, full_name, phone, pickup_point)
      values (
        v_user_id, 
        v_email, 
        coalesce(v_meta->>'full_name', 'User'),
        v_meta->>'phone',
        coalesce(v_meta->>'pickup_point', 'Hall 7')
      );
  end if;
end;
$$;

create or replace function public.get_all_profiles_secure()
returns setof public.profiles
language sql
security definer
set search_path = public
as $$
  select * from public.profiles
  where (select role from public.profiles where id = auth.uid()) = 'ADMIN'
  order by created_at desc;
$$;

create or replace function public.handle_new_user()
returns trigger 
security definer
set search_path = public
as $$
declare
  v_ref_code text;
  v_name_part text;
begin
  v_name_part := upper(substring(coalesce(new.raw_user_meta_data->>'full_name', 'USER'), 1, 3));
  v_ref_code := v_name_part || '-' || floor(random() * 9000 + 1000)::text;

  begin
    insert into public.profiles (
        id, email, full_name, phone, pickup_point, referred_by, referral_code
    )
    values (
        new.id, new.email, new.raw_user_meta_data->>'full_name', 
        new.raw_user_meta_data->>'phone',
        coalesce(new.raw_user_meta_data->>'pickup_point', 'Hall 7'),
        upper(new.raw_user_meta_data->>'referral_code_input'),
        v_ref_code
    );
  exception when others then
    insert into public.profiles (id, email, full_name)
    values (new.id, new.email, new.raw_user_meta_data->>'full_name')
    on conflict (id) do nothing;
  end;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists handle_updated_at on public.profiles;
create trigger handle_updated_at before update on public.profiles for each row execute procedure moddatetime (updated_at);

drop trigger if exists handle_updated_at on public.products;
create trigger handle_updated_at before update on public.products for each row execute procedure moddatetime (updated_at);

drop trigger if exists handle_updated_at on public.baskets;
create trigger handle_updated_at before update on public.baskets for each row execute procedure moddatetime (updated_at);

create or replace function public.recalculate_basket()
returns trigger as $$
declare
  v_basket_id uuid;
  v_subtotal numeric;
  v_service_fee_percent numeric;
  v_service_fee numeric;
  v_discount numeric;
  v_total_price numeric;
begin
  v_basket_id := coalesce(new.basket_id, old.basket_id);
  
  select coalesce(sum(total_price), 0) into v_subtotal
  from public.basket_items where basket_id = v_basket_id;

  select (value->>'basketServiceFeePercentage')::numeric into v_service_fee_percent
  from app_settings where key = 'GLOBAL_CONFIG';
  v_service_fee_percent := coalesce(v_service_fee_percent, 5);

  select (metadata->>'discount_amount')::numeric into v_discount
  from baskets where id = v_basket_id;
  v_discount := coalesce(v_discount, 0);

  v_service_fee := v_subtotal * (v_service_fee_percent / 100.0);
  v_total_price := v_subtotal + v_service_fee - v_discount;

  update public.baskets
  set subtotal = v_subtotal, service_fee = v_service_fee, total_price = v_total_price, updated_at = now()
  where id = v_basket_id;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_basket_item_change on public.basket_items;
create trigger on_basket_item_change
  after insert or update or delete on public.basket_items
  for each row execute procedure public.recalculate_basket();

create or replace function public.generate_delivery_record(p_basket_id uuid)
returns text
language plpgsql
security definer
as $$
declare
    v_basket public.baskets%ROWTYPE;
    v_profile public.profiles%ROWTYPE;
    v_cycle_name text;
    v_hall_code text;
    v_new_code text;
    v_existing_code text;
begin
    select * into v_basket from public.baskets where id = p_basket_id;
    select * into v_profile from public.profiles where id = v_basket.user_id;
    select name into v_cycle_name from public.cycles where id = v_basket.cycle_id;

    select delivery_code into v_existing_code from public.deliveries where basket_id = p_basket_id;
    if v_existing_code is not null then
        return v_existing_code;
    end if;

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
    v_new_code := 'SML-' || v_hall_code || '-' || floor(random() * 90000 + 10000)::text;

    insert into public.deliveries (
        delivery_code, basket_id, user_id, 
        full_name, phone, pickup_point, batch_name
    ) values (
        v_new_code, p_basket_id, v_profile.id,
        v_profile.full_name, v_profile.phone, v_profile.pickup_point, v_cycle_name
    );

    update public.baskets 
    set delivery_code = v_new_code, status = 'PAID' 
    where id = p_basket_id;

    return v_new_code;
end;
$$;

create or replace function public.process_payment(
  p_reference text,
  p_basket_id uuid,
  p_amount numeric,
  p_type text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_basket public.baskets%ROWTYPE;
  v_already_exists boolean;
  v_delivery_code text;
begin
  v_user_id := auth.uid();
  
  select exists(select 1 from public.payments where id = p_reference) into v_already_exists;
  if v_already_exists then
    return jsonb_build_object('success', true, 'message', 'Payment already processed');
  end if;

  insert into public.payments (id, user_id, basket_id, amount, type, status)
  values (p_reference, v_user_id, (case when p_type = 'SUBSCRIPTION' then null else p_basket_id end), p_amount, p_type, 'SUCCESS');

  if p_type = 'SUBSCRIPTION' then
     update public.profiles set is_subscriber = true where id = v_user_id;
     return jsonb_build_object('success', true, 'message', 'Subscription activated');
  else
     update public.baskets 
     set amount_paid = coalesce(amount_paid, 0) + p_amount
     where id = p_basket_id
     returning * into v_basket;

     if v_basket.amount_paid >= (v_basket.total_price - 0.5) then
        v_delivery_code := public.generate_delivery_record(p_basket_id);
        return jsonb_build_object('success', true, 'message', 'Payment successful. Delivery Ready.', 'code', v_delivery_code);
     end if;

     return jsonb_build_object('success', true, 'message', 'Partial payment recorded');
  end if;
end;
$$;

create or replace function public.approve_top_up(p_basket_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_basket public.baskets%ROWTYPE;
  v_delivery_code text;
begin
  if not public.is_admin() then
    raise exception 'Permission denied';
  end if;

  select * into v_basket from public.baskets where id = p_basket_id;
  if not found then raise exception 'Basket not found'; end if;
  
  v_basket.top_up_amount := v_basket.total_price - v_basket.amount_paid;
  
  update public.baskets
  set top_up_approved = true, amount_paid = total_price
  where id = p_basket_id;
  
  v_delivery_code := public.generate_delivery_record(p_basket_id);

  return jsonb_build_object('success', true, 'message', 'Top-up approved. Delivery Ready.', 'code', v_delivery_code);
end;
$$;

create or replace function public.confirm_delivery_pickup(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_delivery public.deliveries%ROWTYPE;
    v_staff_id uuid;
begin
    v_staff_id := auth.uid();
    if not public.is_staff() then raise exception 'Permission denied: Staff only'; end if;

    select * into v_delivery from public.deliveries where delivery_code = upper(trim(p_code));
    
    if not found then
        return jsonb_build_object('success', false, 'message', 'Invalid Code. No order found.');
    end if;

    if v_delivery.status = 'COLLECTED' then
        return jsonb_build_object('success', false, 'message', 'Already collected on ' || to_char(v_delivery.picked_up_at, 'DD Mon HH12:MI AM'));
    end if;

    update public.deliveries
    set status = 'COLLECTED',
        picked_up_at = now(),
        picked_up_by = v_staff_id
    where id = v_delivery.id;

    update public.baskets
    set status = 'COLLECTED',
        pickup_timestamp = now()
    where id = v_delivery.basket_id;

    return jsonb_build_object(
        'success', true, 
        'message', 'Collection Confirmed', 
        'student', v_delivery.full_name,
        'item_count', (select count(*) from basket_items where basket_id = v_delivery.basket_id)
    );
end;
$$;

create or replace function public.get_procurement_list()
returns table ("productId" uuid, "productName" text, "unitSize" text, "totalQuantity" bigint, "unitPrice" numeric, "totalCost" numeric)
language sql
security definer
set search_path = public
as $$
  select p.id, p.name, p.size, sum(bi.quantity)::bigint, p.price, (sum(bi.quantity) * p.price)
  from public.basket_items bi
  join public.products p on bi.product_id = p.id
  join public.baskets b on bi.basket_id = b.id
  where b.status in ('PAID', 'DELIVERED', 'COLLECTED') and public.is_admin()
  group by p.id, p.name, p.size, p.price
  order by p.name;
$$;

-- ASSOCIATE REPORTING RPC (New)
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
      c.code as coupon_code,
      to_char(b.updated_at, 'YYYY-MM') as month,
      count(distinct b.user_id) as active_users
    from public.coupons c
    join public.profiles p on p.referred_by = c.code
    join public.baskets b on b.user_id = p.id
    where b.status in ('PAID', 'DELIVERED', 'COLLECTED')
    group by 1, 2, 3
    order by 3 desc, 4 desc;
$$;

-- RLS POLICIES
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.cycles enable row level security;
alter table public.baskets enable row level security;
alter table public.basket_items enable row level security;
alter table public.payments enable row level security;
alter table public.deliveries enable row level security; 
alter table public.app_settings enable row level security;
alter table public.system_logs enable row level security;
alter table public.coupons enable row level security;

-- Drop existing policies
drop policy if exists "Read Own Profile" on public.profiles;
drop policy if exists "Update Own Profile" on public.profiles;
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
drop policy if exists "Owner Read Delivery" on public.deliveries;
drop policy if exists "Staff Manage Delivery" on public.deliveries;
drop policy if exists "Public Read Settings" on public.app_settings;
drop policy if exists "Admin Write Settings" on public.app_settings;
drop policy if exists "Public Log Insert" on public.system_logs;
drop policy if exists "Admin View Logs" on public.system_logs;
drop policy if exists "Public Read Coupons" on public.coupons;
drop policy if exists "Admin Write Coupons" on public.coupons;

-- Policies
create policy "Read Own Profile" on public.profiles for select using (auth.uid() = id);
create policy "Update Own Profile" on public.profiles for update using (auth.uid() = id);
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
create policy "Owner Read Delivery" on public.deliveries for select using (auth.uid() = user_id);
create policy "Staff Manage Delivery" on public.deliveries for all using (public.is_staff());
create policy "Public Read Settings" on public.app_settings for select using (true);
create policy "Admin Write Settings" on public.app_settings for all using (public.is_admin());
create policy "Public Log Insert" on public.system_logs for insert with check (true);
create policy "Admin View Logs" on public.system_logs for select using (public.is_admin());

-- Coupon Policies
create policy "Public Read Coupons" on public.coupons for select using (true);
create policy "Admin Write Coupons" on public.coupons for all using (public.is_admin());

-- Storage
insert into storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
values ('assets', 'assets', true, false, 5242880, '{image/*}')
on conflict (id) do nothing;

drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Admin Upload" on storage.objects;
drop policy if exists "Admin Update" on storage.objects;
drop policy if exists "Admin Delete" on storage.objects;

create policy "Public Access" on storage.objects for select using ( bucket_id = 'assets' );
create policy "Admin Upload" on storage.objects for insert with check ( bucket_id = 'assets' and public.is_admin() );
create policy "Admin Update" on storage.objects for update using ( bucket_id = 'assets' and public.is_admin() );
create policy "Admin Delete" on storage.objects for delete using ( bucket_id = 'assets' and public.is_admin() );

-- Seed
insert into public.app_settings (key, value, description) values
('GLOBAL_CONFIG', '{"basketServiceFeePercentage": 5, "heroImages": []}'::jsonb, 'General frontend configuration')
on conflict (key) do nothing;

update public.cycles set payment_start_date = now() where payment_start_date is null;
update public.cycles set payment_end_date = now() + interval '30 days' where payment_end_date is null;
update public.cycles set lock_date = now() + interval '25 days' where lock_date is null;
update public.cycles set delivery_date = now() + interval '35 days' where delivery_date is null;

insert into public.cycles (name, payment_start_date, payment_end_date, lock_date, delivery_date, is_active) 
select 'Launch Cycle', now(), now() + interval '30 days', now() + interval '25 days', now() + interval '35 days', true
where not exists (select 1 from public.cycles where is_active = true);
