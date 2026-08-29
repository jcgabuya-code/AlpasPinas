-- ============================================================================
-- AlpasPinas — race_events
-- ============================================================================
-- The race/competition calendar (name, location, date, type, description,
-- result) shown on the home page ("On the Water" record), the standalone
-- Events page, and the hero's "next race" badge. Previously this lived only
-- in each browser's localStorage (admin CRUD in AdminEvents.tsx), seeded from
-- a static src/data/events.json that the public pages read directly — so
-- admin edits never reached the public site at all. Moving it here gives it
-- the same real backend training_events already has.
--
-- `result` is a small fixed-shape JSON snapshot (rank/stage/category/time/
-- notes), same approach as training_events.days.
--
-- Public data: no PII, so anyone can read; only admins write. Follows the
-- is_admin() + updated_at trigger patterns used by training_events.
--
-- Idempotent so it re-applies cleanly. New schema changes go in NEW migrations.
-- ============================================================================

create table if not exists public.race_events (
  id               text primary key,
  name             text not null,
  location         text not null,
  date             date not null,
  type             text not null default 'Regatta',
  description      text,
  thumbnail        text,
  thumbnail_credit text,
  result           jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.race_events enable row level security;

drop policy if exists "race_events: public reads" on public.race_events;
drop policy if exists "race_events: admin writes" on public.race_events;

create policy "race_events: public reads"
  on public.race_events for select
  using (true);

create policy "race_events: admin writes"
  on public.race_events for all
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.touch_race_event()
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

drop trigger if exists trg_touch_race_event on public.race_events;
create trigger trg_touch_race_event
  before update on public.race_events
  for each row execute function public.touch_race_event();

-- Realtime, so the home/Events pages and admin panel live-update.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'race_events'
  ) then
    alter publication supabase_realtime add table public.race_events;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Seed with the current race history (src/data/events.json) so production
-- doesn't lose the results already live on the public page. Safe to re-run —
-- ON CONFLICT DO NOTHING means later admin edits are never overwritten.
-- ----------------------------------------------------------------------------
insert into public.race_events (id, name, location, date, type, description, result)
values
  (
    'singapore-2025',
    'Isang Bangkang Malaya',
    'Singapore',
    '2025-06-01',
    'Regatta',
    'The club''s first international racing debut, going up against crews from across the region.',
    '{"rank":4,"category":"Open","notes":"4th place on debut — the result that set the stage for a Malaysia campaign."}'::jsonb
  ),
  (
    'penang-2026-open',
    'Penang Mini Dragonboat Race',
    'Penang, Malaysia',
    '2026-01-24',
    'Regatta',
    'Malaysia debut — 27 paddlers across four categories, racing hot weather and choppy open-sea conditions that capsized or scattered several other crews.',
    '{"rank":3,"category":"Open","notes":"Bronze medal — the club''s first Malaysia-debut podium."}'::jsonb
  ),
  (
    'penang-2026-mixed',
    'Penang Mini Dragonboat Race',
    'Penang, Malaysia',
    '2026-01-24',
    'Regatta',
    'Malaysia debut — 27 paddlers across four categories, racing hot weather and choppy open-sea conditions that capsized or scattered several other crews.',
    '{"stage":"Semi-Final","category":"Mixed"}'::jsonb
  ),
  (
    'penang-2026-women',
    'Penang Mini Dragonboat Race',
    'Penang, Malaysia',
    '2026-01-24',
    'Regatta',
    'Malaysia debut — 27 paddlers across four categories, racing hot weather and choppy open-sea conditions that capsized or scattered several other crews.',
    '{"stage":"Semi-Final","category":"Women"}'::jsonb
  ),
  (
    'penang-2026-masters',
    'Penang Mini Dragonboat Race',
    'Penang, Malaysia',
    '2026-01-24',
    'Regatta',
    'Malaysia debut — 27 paddlers across four categories, racing hot weather and choppy open-sea conditions that capsized or scattered several other crews.',
    '{"stage":"Semi-Final","category":"Masters"}'::jsonb
  )
on conflict (id) do nothing;
