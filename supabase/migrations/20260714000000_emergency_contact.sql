-- ============================================================================
-- AlpasPinas — emergency contact fields on profiles
-- ============================================================================
-- Part of the onboarding revamp: the registration wizard's "safety check"
-- step now collects who to call if something happens on the water.
-- ============================================================================

alter table public.profiles
  add column if not exists emergency_contact_name  text,
  add column if not exists emergency_contact_phone  text;
