# Project Notes

Running notes for this project. Updated when JC says "update the notes."

## Latest
_(2026-07-16)_ AdminEvents.tsx training-session revamp — in progress:
- **Done, browser-verified (desktop + mobile):** past sessions auto-collapse behind a "Show past sessions (N)" toggle — hidden from the main list, not deleted, still editable/deletable inside. New Duplicate (copy icon) button per session clones it with every day's date pushed +7 (same weekday) straight into the existing edit form, so recurring lake/land sessions don't need refilling every time. Delete button now warns (via tooltip) how many sign-ups will be removed if a session with registrations is deleted.
- **Written but NOT yet applied:** `supabase/migrations/20260716000000_training_events_cascade.sql` — adds real foreign keys (`training_signups.event_id`, `boat_plans.event_id` → `training_events.id`, `ON DELETE CASCADE`) so deleting a session in the admin UI automatically cleans up its sign-ups + boat plan (currently it doesn't — confirmed 2 real orphaned `boat_plans` rows live in the DB from already-deleted sessions: `may-2026-weekend`, `jun-2026-weekend`; the migration deletes those as part of applying). Needs `supabase db push` — waiting on JC's go-ahead, do this first next session.
- Bug fixed along the way: date-shift math was round-tripping through `.toISOString()`, which loses a day in Malaysia's UTC+8 (same gotcha the codebase already avoids in `formatShortDate`/`formatLongDate`).
- Nothing committed yet.

**Next:** run the migration, re-verify a real delete cascades correctly, then commit.
