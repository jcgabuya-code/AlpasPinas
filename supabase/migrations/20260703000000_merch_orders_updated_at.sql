-- ============================================================================
-- AlpasPinas — merch_orders.updated_at
-- ============================================================================
-- Adds an `updated_at` column stamped on every write, so the admin order board
-- can age out fulfilled/cancelled orders from when they actually reached that
-- state (not from created_at, which only reflects when the order was placed).
--
-- Idempotent so it re-applies cleanly.
-- ============================================================================

alter table public.merch_orders
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.touch_merch_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_merch_order on public.merch_orders;
create trigger trg_touch_merch_order
  before update on public.merch_orders
  for each row execute function public.touch_merch_order();
