-- ============================================================================
-- AlpasPinas — roster
-- ============================================================================
-- Member directory, moved off the Google Sheet (google/roster-script.gs) onto
-- Supabase. Public pages (/roster, /team) read active members with no login;
-- the admin Roster tab reads/writes everything and is gated by is_admin().
-- "Remove" stays a soft-delete (status -> inactive), same as the old sheet.
--
-- Idempotent so it re-applies cleanly. New schema changes go in NEW migrations.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.roster (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        text not null default 'Paddler',
  side        text not null default 'Left',
  joined      int  not null default extract(year from now()),
  photo       text,
  status      text not null default 'active' check (status in ('active', 'inactive')),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null
);

-- Case-insensitive unique name so edit/remove/setStatus-by-name (originalName
-- lookups from the admin UI) always target exactly one row.
create unique index if not exists roster_name_lower_idx on public.roster (lower(name));

-- ----------------------------------------------------------------------------
-- 2. ROW-LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.roster enable row level security;

-- Public directory pages only ever see active members.
drop policy if exists "roster: public read active" on public.roster;
create policy "roster: public read active"
  on public.roster for select
  using (status = 'active');

-- Admins see everything (including inactive) and can write.
drop policy if exists "roster: admin read all" on public.roster;
create policy "roster: admin read all"
  on public.roster for select
  using (public.is_admin());

drop policy if exists "roster: admin write" on public.roster;
create policy "roster: admin write"
  on public.roster for all
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. updated_at / updated_by maintenance
-- ----------------------------------------------------------------------------
create or replace function public.touch_roster()
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

drop trigger if exists trg_touch_roster on public.roster;
create trigger trg_touch_roster
  before insert or update on public.roster
  for each row execute function public.touch_roster();
