-- ============================================================================
-- AlpasPinas — merch (products + merch_orders)
-- ============================================================================
-- The team shop. Two tables:
--   * products      — the catalog. Public reads ACTIVE products; admins manage all.
--                     `is_featured` + promo_* drive the home-page featured section
--                     and the site-wide announcement bar.
--   * merch_orders  — inquiry / reserve orders (NO online payment yet). Anyone can
--                     submit a pending order; the buyer + admins can read it; admins
--                     move it through pending -> confirmed -> paid -> fulfilled and
--                     collect payment manually.
--
-- Follows the proven patterns from training_signups / boat_plans:
--   default-deny RLS, public.is_admin() gate (SECURITY DEFINER, no recursion),
--   bare anon INSERT (no RETURNING) for public order submission.
--
-- Idempotent so it re-applies cleanly. New schema changes go in NEW migrations.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PRODUCTS
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text unique not null,
  description  text,
  price        numeric not null check (price >= 0),
  currency     text not null default 'MYR',
  category     text,
  image_url    text,
  images       jsonb not null default '[]'::jsonb,   -- extra photos: ["/shop/a.jpg", ...]
  sizes        jsonb not null default '[]'::jsonb,    -- ["S","M","L","XL"] or [] if N/A
  stock        int,                                   -- null = unlimited; 0 = sold out
  is_active    boolean not null default true,         -- hide without deleting
  is_featured  boolean not null default false,        -- drives home featured section
  promo_label  text,                                  -- e.g. "LIMITED DROP", "20% OFF"
  promo_price  numeric check (promo_price is null or promo_price >= 0), -- sale price
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists products_active_idx   on public.products (is_active);
create index if not exists products_featured_idx on public.products (is_featured);

-- RLS: anyone reads ACTIVE products; admins read all + are the only writers.
alter table public.products enable row level security;

drop policy if exists "products: public reads active" on public.products;
drop policy if exists "products: admin writes"        on public.products;

create policy "products: public reads active"
  on public.products for select
  using (is_active or public.is_admin());

create policy "products: admin writes"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 2. MERCH ORDERS (inquiry / reserve)
-- ----------------------------------------------------------------------------
-- items snapshot shape:
--   [{ "product_id": "...", "name": "...", "size": "M", "qty": 2, "unit_price": 80 }]
-- Snapshotting name/unit_price/total means later catalog edits never rewrite
-- past orders.
create table if not exists public.merch_orders (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid default auth.uid() references auth.users (id) on delete set null,
  contact_name   text not null,
  contact_email  text not null,
  contact_phone  text,
  items          jsonb not null,
  total          numeric not null check (total >= 0),
  note           text,
  status         text not null default 'pending'
                 check (status in ('pending', 'confirmed', 'paid', 'fulfilled', 'cancelled')),
  created_at     timestamptz not null default now()
);

create index if not exists merch_orders_user_idx   on public.merch_orders (user_id);
create index if not exists merch_orders_status_idx on public.merch_orders (status);

-- RLS: anyone can submit a PENDING order (bare insert, no RETURNING — same anon
-- pattern as applications). Buyer reads own; admins read + manage all.
alter table public.merch_orders enable row level security;

drop policy if exists "merch_orders: anyone submits pending" on public.merch_orders;
drop policy if exists "merch_orders: read own or admin"      on public.merch_orders;
drop policy if exists "merch_orders: admin updates"          on public.merch_orders;
drop policy if exists "merch_orders: admin deletes"          on public.merch_orders;

create policy "merch_orders: anyone submits pending"
  on public.merch_orders for insert
  with check (status = 'pending');

create policy "merch_orders: read own or admin"
  on public.merch_orders for select
  using (user_id = auth.uid() or public.is_admin());

create policy "merch_orders: admin updates"
  on public.merch_orders for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "merch_orders: admin deletes"
  on public.merch_orders for delete
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. REALTIME (admin order board live-updates)
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'merch_orders'
  ) then
    alter publication supabase_realtime add table public.merch_orders;
  end if;
end $$;
