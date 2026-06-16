-- ============================================================================
-- AlpasPinas — training_signups
-- ============================================================================
-- Training weekend sign-ups. Previously lived in a Google Sheet (Apps Script
-- web app); migrated here so there's ONE backend with real Row-Level Security.
--
-- Identity model: every sign-up is tied to the logged-in user (`user_id` =
-- auth.uid()) — sign-up now REQUIRES login. Private fields (weight, birthday)
-- are readable only by the owner + admins; capacity counts come from the
-- PII-free `training_signup_counts()` RPC so the public /training page can
-- still show remaining seats without exposing rows.
--
-- Idempotent so it re-applies cleanly. New schema changes go in NEW migrations.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.training_signups (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  event_id     text not null,
  event_title  text,
  attending    text not null check (attending in ('sat', 'sun', 'both')),
  name         text not null,
  gender       text not null check (gender in ('Male', 'Female')),
  birthday     date,                       -- mandatory at the form level; nullable here for safety
  side         text not null check (side in ('Left', 'Right', 'Coxswain', 'Coach')),
  weight       numeric not null,
  need_pfd     boolean not null default false,
  need_paddle  boolean not null default false,
  status       text not null default 'waiting' check (status in ('waiting', 'confirmed')),
  created_at   timestamptz not null default now(),
  -- One sign-up per user per event (replaces the old client-side name dedup).
  unique (user_id, event_id)
);

create index if not exists training_signups_event_id_idx on public.training_signups (event_id);

-- ----------------------------------------------------------------------------
-- 2. ROW-LEVEL SECURITY
-- ----------------------------------------------------------------------------
-- Default deny. Owners manage their own row; admins manage everything. Approve
-- (waiting -> confirmed) is admin-only; cancel is a DELETE (owner or admin).
alter table public.training_signups enable row level security;

drop policy if exists "training_signups: user inserts own"   on public.training_signups;
drop policy if exists "training_signups: read own or admin"  on public.training_signups;
drop policy if exists "training_signups: admin updates"      on public.training_signups;
drop policy if exists "training_signups: owner or admin del" on public.training_signups;

create policy "training_signups: user inserts own"
  on public.training_signups for insert
  to authenticated
  with check (user_id = auth.uid() and status = 'waiting');

create policy "training_signups: read own or admin"
  on public.training_signups for select
  using (user_id = auth.uid() or public.is_admin());

create policy "training_signups: admin updates"
  on public.training_signups for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "training_signups: owner or admin del"
  on public.training_signups for delete
  using (user_id = auth.uid() or public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. CAPACITY COUNTS (PII-free, public)
-- ----------------------------------------------------------------------------
-- Per-event seat tallies for sat / sun. SECURITY DEFINER so it can aggregate
-- across all rows without exposing them; returns only counts, no names/weights.
-- A 'both' sign-up counts toward both days.
create or replace function public.training_signup_counts()
returns table (event_id text, sat int, sun int)
language sql
security definer
set search_path = public
as $$
  select
    s.event_id,
    count(*) filter (where s.attending in ('sat', 'both'))::int as sat,
    count(*) filter (where s.attending in ('sun', 'both'))::int as sun
  from public.training_signups s
  group by s.event_id;
$$;

grant execute on function public.training_signup_counts() to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. REALTIME
-- ----------------------------------------------------------------------------
-- Publish row changes so the app can live-update (RLS still applies: a user
-- gets their own status flips; admins get everything). Guarded so re-applying
-- doesn't error if the table is already in the publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'training_signups'
  ) then
    alter publication supabase_realtime add table public.training_signups;
  end if;
end $$;
