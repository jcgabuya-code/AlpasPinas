-- ============================================================================
-- AlpasPinas — cascade-delete sign-ups + boat plans with their training event
-- ============================================================================
-- training_signups.event_id and boat_plans.event_id were always plain text,
-- never a real foreign key to training_events.id — so deleting a session from
-- the admin schedule left its sign-ups and boat plan behind as orphans (2 such
-- boat_plans rows already exist: may-2026-weekend, jun-2026-weekend, both from
-- sessions deleted before this migration). Adding real FKs with ON DELETE
-- CASCADE means the existing single-table `delete from training_events` the
-- admin UI already does now cleans up both child tables automatically.
--
-- Idempotent so it re-applies cleanly.
-- ============================================================================

-- Pre-existing orphans have no training_events row to reference, so they'd
-- fail FK validation below — they're dead data from already-deleted sessions,
-- safe to drop.
delete from public.boat_plans bp
where not exists (select 1 from public.training_events te where te.id = bp.event_id);

delete from public.training_signups ts
where not exists (select 1 from public.training_events te where te.id = ts.event_id);

alter table public.training_signups drop constraint if exists training_signups_event_id_fkey;
alter table public.training_signups
  add constraint training_signups_event_id_fkey
  foreign key (event_id) references public.training_events (id) on delete cascade;

alter table public.boat_plans drop constraint if exists boat_plans_event_id_fkey;
alter table public.boat_plans
  add constraint boat_plans_event_id_fkey
  foreign key (event_id) references public.training_events (id) on delete cascade;
