-- ============================================================================
-- AlpasPinas — profiles.nickname
-- ============================================================================
-- Optional display name a paddler can set (at registration or later from their
-- profile). Where it's set, it's what shows on training sign-up rosters (Land
-- and Lake) instead of their full legal name — see displayName() in
-- src/utils/users.ts, the single place that resolves nickname-or-name.
--
-- Idempotent so it re-applies cleanly.
-- ============================================================================

alter table public.profiles add column if not exists nickname text;
