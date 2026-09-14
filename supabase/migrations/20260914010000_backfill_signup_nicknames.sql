-- ============================================================================
-- AlpasPinas — one-time backfill: apply existing nicknames to existing sign-ups
-- ============================================================================
-- training_signups.name is a snapshot captured at sign-up time (see
-- displayName() in src/utils/users.ts), so nicknames added to profiles AFTER
-- someone already signed up never reached their existing rows — only sign-ups
-- made from here on pick up a nickname automatically. This backfills every
-- current row once so today's nicknames show immediately on the Land/Lake
-- rosters, without waiting for people to re-sign-up.
--
-- Safe to re-run: only touches rows whose name doesn't already match the
-- profile's nickname.
-- ============================================================================

update public.training_signups s
set name = p.nickname
from public.profiles p
where s.user_id = p.id
  and p.nickname is not null
  and btrim(p.nickname) <> ''
  and s.name is distinct from p.nickname;
