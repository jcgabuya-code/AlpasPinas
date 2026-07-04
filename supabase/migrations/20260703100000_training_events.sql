-- ============================================================================
-- AlpasPinas — training_events
-- ============================================================================
-- The training SCHEDULE (what sessions exist — title, venue, days/times/
-- capacity), as distinct from training_signups (who's coming). Previously this
-- lived only in each browser's localStorage, seeded from a static
-- src/data/training.json — which meant admin edits never left the browser
-- that made them (a fresh browser/device always saw the stale seed data).
-- Moving it here gives it the same real backend as sign-ups.
--
-- `days` is stored as a JSON snapshot (small, fixed shape, never queried by
-- day fields individually) — same approach as merch_orders.items.
--
-- Public data: the schedule itself carries no PII, so anyone can read it;
-- only admins write. Follows the is_admin() + updated_at trigger patterns
-- used by boat_plans / merch_orders.
--
-- Idempotent so it re-applies cleanly. New schema changes go in NEW migrations.
-- ============================================================================

create table if not exists public.training_events (
  id               text primary key,
  title            text not null,
  description      text,
  thumbnail        text,
  thumbnail_credit text,
  venue            text not null default 'lake' check (venue in ('land', 'lake')),
  days             jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.training_events enable row level security;

drop policy if exists "training_events: public reads" on public.training_events;
drop policy if exists "training_events: admin writes" on public.training_events;

create policy "training_events: public reads"
  on public.training_events for select
  using (true);

create policy "training_events: admin writes"
  on public.training_events for all
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.touch_training_event()
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

drop trigger if exists trg_touch_training_event on public.training_events;
create trigger trg_touch_training_event
  before update on public.training_events
  for each row execute function public.touch_training_event();

-- Realtime, so the public /training page and admin panel live-update.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'training_events'
  ) then
    alter publication supabase_realtime add table public.training_events;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Seed with the current schedule (src/data/training.json) so production
-- doesn't lose the sessions already live on the public page. Safe to re-run —
-- ON CONFLICT DO NOTHING means later admin edits are never overwritten.
-- ----------------------------------------------------------------------------
insert into public.training_events (id, title, description, thumbnail, thumbnail_credit, venue, days)
values
  (
    'may-2026-weekend',
    'May 30-31 Training Weekend',
    'Two-day lake training. Saturday at Marina Putrajaya, Sunday at Subang PARC. Open to all paddlers — sign up for one day or both.',
    '/marina-putrajaya.jpg',
    'Photo by Elliot Andrews on Unsplash',
    'lake',
    '[
      {"key":"sat","label":"Saturday","date":"2026-05-30","time":"07:30","location":"Marina Putrajaya","capacity":22},
      {"key":"sun","label":"Sunday","date":"2026-05-31","time":"07:30","location":"Subang PARC","capacity":22}
    ]'::jsonb
  ),
  (
    'jun-2026-weekend',
    'June 27-28 Training Weekend',
    'Race-prep weekend. Both sessions at Marina Putrajaya. Focus on starts, exchanges, and 500m time trials.',
    '/marina-putrajaya.jpg',
    'Photo by Elliot Andrews on Unsplash',
    'lake',
    '[
      {"key":"sat","label":"Saturday","date":"2026-06-27","time":"07:30","location":"Marina Putrajaya","capacity":22},
      {"key":"sun","label":"Sunday","date":"2026-06-28","time":"07:30","location":"Marina Putrajaya","capacity":22}
    ]'::jsonb
  ),
  (
    'jul-2026-land-tue',
    'Land Conditioning — Tuesday',
    'Strength circuit, paddle ergs, and core work to build the engine off the water. All levels, drop-ins welcome.',
    null,
    null,
    'land',
    '[
      {"key":"session","label":"Tuesday","date":"2026-07-07","time":"19:00","location":"Subang PARC","capacity":16}
    ]'::jsonb
  ),
  (
    'jul-2026-land-thu',
    'Land Conditioning — Thursday',
    'Strength circuit, paddle ergs, and core work to build the engine off the water. All levels, drop-ins welcome.',
    null,
    null,
    'land',
    '[
      {"key":"session","label":"Thursday","date":"2026-07-09","time":"19:00","location":"Subang PARC","capacity":16}
    ]'::jsonb
  )
on conflict (id) do nothing;
