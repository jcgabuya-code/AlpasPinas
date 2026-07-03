-- ============================================================================
-- AlpasPinas — training_signups: generalize beyond sat/sun weekends
-- ============================================================================
-- Land training (weeknight strength/erg conditioning) joins lake weekends as a
-- second bookable discipline. Land sessions are single-day dated events, so the
-- `attending` column can no longer be a fixed sat/sun/both enum — it becomes
-- any event day-key (or 'both' meaning "every day of this event"). Land
-- sign-ups also don't carry boat-specific fields (side, weight, PFD, paddle),
-- so those columns become nullable.
--
-- Idempotent so it re-applies cleanly.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. GENERALIZE `attending`
-- ----------------------------------------------------------------------------
alter table public.training_signups drop constraint if exists training_signups_attending_check;
alter table public.training_signups add constraint training_signups_attending_check check (attending <> '');

-- ----------------------------------------------------------------------------
-- 2. MAKE BOAT-SPECIFIC FIELDS OPTIONAL
-- ----------------------------------------------------------------------------
alter table public.training_signups alter column side drop not null;
alter table public.training_signups alter column weight drop not null;
alter table public.training_signups alter column need_pfd drop not null;
alter table public.training_signups alter column need_paddle drop not null;

-- ----------------------------------------------------------------------------
-- 3. GENERALIZE THE CAPACITY-COUNTS RPC
-- ----------------------------------------------------------------------------
-- Old shape returned fixed (event_id, sat, sun) columns. New shape returns one
-- row per (event_id, attending) with its raw count; the client expands 'both'
-- against each event's actual day-keys at read time. Return-type change means
-- the function must be dropped before it's recreated.
drop function if exists public.training_signup_counts();

create function public.training_signup_counts()
returns table (event_id text, attending text, cnt int)
language sql
security definer
set search_path = public
as $$
  select s.event_id, s.attending, count(*)::int as cnt
  from public.training_signups s
  group by s.event_id, s.attending;
$$;

grant execute on function public.training_signup_counts() to anon, authenticated;
