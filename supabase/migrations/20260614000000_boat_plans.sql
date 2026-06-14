-- ============================================================================
-- AlpasPinas — boat_plans
-- ============================================================================
-- Seat assignments per training event + day. The admin Boat Assignments planner
-- writes one row per (event_id, day_key); the `boats` JSON holds the full layout
-- (boat name + seatId → athlete name map). Admin-only — these are internal
-- planning artifacts, not public data. Training SIGN-UPS still live in Google
-- Sheets; this only stores who-sits-where on top of them.
--
-- Idempotent so it re-applies cleanly. New schema changes go in NEW migrations.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLE
-- ----------------------------------------------------------------------------
-- One plan per event+day. `boats` is the serialized layout:
--   [{ "id": "...", "name": "Boat A", "seats": { "1L": "Jane Doe", ... } }]
create table if not exists public.boat_plans (
  event_id    text not null,
  day_key     text not null,
  boats       jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null,
  primary key (event_id, day_key)
);

-- ----------------------------------------------------------------------------
-- 2. ROW-LEVEL SECURITY
-- ----------------------------------------------------------------------------
-- Default deny. Only admins can read or write boat plans (see is_admin() in the
-- baseline migration — SECURITY DEFINER, so no recursion).
alter table public.boat_plans enable row level security;

drop policy if exists "boat_plans: admin all" on public.boat_plans;
create policy "boat_plans: admin all"
  on public.boat_plans for all
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. updated_at / updated_by maintenance
-- ----------------------------------------------------------------------------
-- Stamp the editor + time on every write so the UI can show "last saved".
create or replace function public.touch_boat_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists trg_touch_boat_plan on public.boat_plans;
create trigger trg_touch_boat_plan
  before insert or update on public.boat_plans
  for each row execute function public.touch_boat_plan();
