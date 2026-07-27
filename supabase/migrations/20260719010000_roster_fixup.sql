-- ============================================================================
-- AlpasPinas — roster fixup
-- ============================================================================
-- `public.roster` already existed on the remote DB (created outside migration
-- history, before this repo had a roster.sql), so the previous migration's
-- `create table if not exists` / `create policy` no-opped on it and left three
-- real problems:
--   1. `joined` was typed `date`; the app always sends a plain year int
--      (e.g. 2021) — every insert/edit would fail on that column.
--   2. `updated_at` / `updated_by` were missing even though trg_touch_roster
--      already references them on every insert/update.
--   3. A stray "roster: public read" policy (qual: true) let anyone read
--      INACTIVE members too, bypassing the intended "active only" public read.
-- Table was empty (0 rows) when this was written, so the type change is safe.
-- ============================================================================

alter table public.roster
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid references auth.users (id) on delete set null;

alter table public.roster alter column joined type int using extract(year from joined)::int;
alter table public.roster alter column joined set default extract(year from now());
alter table public.roster alter column joined set not null;

drop policy if exists "roster: public read" on public.roster;
