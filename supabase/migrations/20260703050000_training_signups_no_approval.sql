-- ============================================================================
-- AlpasPinas — training_signups: drop admin-approval requirement
-- ============================================================================
-- Sign-ups no longer need an admin to approve them. The app now decides
-- 'confirmed' vs 'waiting' at insert time (confirmed if the chosen day(s)
-- still have room, waiting if they're full) and writes that status directly.
-- The old insert policy hard-coded status = 'waiting', which forced every
-- sign-up through the admin "Pending approval" queue — that's no longer the
-- flow, so it's relaxed to just ownership. Admins can still manually flip a
-- waitlisted row to confirmed (e.g. after a cancellation frees a seat) via
-- the existing admin-update policy.
--
-- Idempotent so it re-applies cleanly.
-- ============================================================================

drop policy if exists "training_signups: user inserts own" on public.training_signups;

create policy "training_signups: user inserts own"
  on public.training_signups for insert
  to authenticated
  with check (user_id = auth.uid());
