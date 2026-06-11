# AlpasPinas — Project Notes

> Running notes file so we can pick up where we left off across Cowork sessions.
> At the start of a new session, ask Claude to read this file.

## 🔖 Resume here next session

**Status (2026-06-11):** 🚧 Migrating **user/admin data to Supabase** (Postgres + Auth + RLS). **Training sign-ups stay on Google Sheets — untouched.** Phases 3a–3e done and committed; the new auth/registration/applications/admin flows are live and tested against the real Supabase project.

**Token-gated registration: ✅ DEPLOYED + E2E TESTED 2026-06-11.** Schema applied to production; Apps Script redeployed; full Playwright e2e passed (no-token blocked, bogus-token blocked, valid token → locked-email form → registered → token burned → link dead). Real email delivered via GmailApp. Test data cleaned up — DB now has only admin@alpaspinas.com + caloynezz's application.

**⭐ NEXT TASK:**
1. **Approve caloynezz@gmail.com via the admin UI** (`/admin` → Applications → "Resend email") — she's approved from the old system but has NO token, so she can't register until resent. This also exercises the one untested path: the `approve_application` RPC with a real admin JWT. ⚠️ Sends her a real email, and `APP_BASE_URL` in the Apps Script is still `http://localhost:5173` — flip it to the production URL first if the site is live for her.
2. ~~GitHub Action auto-deploy secrets~~ ✅ done 2026-06-11: DB password RESET via Management API (`PATCH /v1/projects/<ref>/database/password`) and saved in `.env.local` (`SUPABASE_DB_PASSWORD`); both `SUPABASE_ACCESS_TOKEN` + `SUPABASE_DB_PASSWORD` set as repo secrets via `gh secret set`. First push to main will smoke-test the Action (expect "Remote database is up to date").
3. Commit everything (token flow + migrations + workflow are all uncommitted).
4. ~~Test-data cleanup~~ ✅ done 2026-06-11 (old test@/newpaddler@/applytest@ rows + e2e artifacts deleted).

**Schema deploys — network gotcha:** this Mac's network **blocks outbound Postgres ports 5432/6543**, so local `supabase db push` hangs forever at "Initialising login role…". Workaround that works: run the migration SQL over HTTPS via the Management API — `POST https://api.supabase.com/v1/projects/ywqsniqogwtucsbifosm/database/query` with `{"query": "<sql>"}`, bearer token = CLI login token from keychain (`security find-generic-password -s "Supabase CLI" -w`). Then insert the version into `supabase_migrations.schema_migrations` so `db push` elsewhere stays in sync (baseline `20260611000000` recorded). The GitHub Action still uses normal `db push` — GitHub runners aren't port-blocked.

**How it works (decision 2026-06-11):** chose approval **email with expiring link** (old token UX restored on Supabase). Approval mints a `registration_token` (uuid, 7-day expiry) on the application row via admin-only RPC; the email is sent by the existing Apps Script Gmail mailer (Supabase can't send arbitrary email from the browser); `/register?token=…` is the only way in — no token = invitation-only screen; email field locked to the approved email; RLS profile-insert gate now requires a live token (expiry enforced server-side); a trigger burns the token after profile creation. Admin UI has Copy-link + Resend (resend regenerates the token, invalidating the old link).

**Also still pending:**
- Test-data cleanup SQL was provided but NOT confirmed run (delete `test@alpaspinas.com` + `newpaddler@` auth users + leftover application rows). See session log.
- Browser-verify the real admin login (`admin@alpaspinas.com` → `/admin`).
- Phase 3f (deferred by user): remove the dead legacy Sheets functions in `src/utils/users.ts` — kept for now, unused, build-clean.

**Supabase facts:**
- Project ref `ywqsniqogwtucsbifosm`. Env in gitignored `.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (publishable key — public, RLS-guarded). Must be set on new machines + production host.
- Schema source of truth: `supabase/migrations/` (CLI migrations; `schema.sql` is now just a pointer). Baseline = `20260611000000_baseline.sql` (tables `profiles`, `applications`, `roster`; `is_admin()` + registration-token SECURITY DEFINER helpers; RLS). New changes: `supabase migration new <name>` → write SQL → `supabase db push` (or push to main; `.github/workflows/supabase-migrations.yml` runs db push automatically — needs repo secrets `SUPABASE_ACCESS_TOKEN` + `SUPABASE_DB_PASSWORD`).
- Decisions: **email + password** login; **fresh start** (no data migrated); email confirmation **OFF**; admin = `profiles.is_admin` flag (replaced the old client-side PIN).
- Real admin: `admin@alpaspinas.com`, `is_admin=true` (created via dashboard Add-User + SQL profile insert, mobile blank).

**To pick up next time, paste this in a new thread:**

> Read `project-notes.md` in my AlpasPinas folder. Let's deploy and test the token-gated registration flow.

## Project overview

- **What:** Website for a dragon boat sports team called **AlpasPinas** (Filipino-inspired but internationally open)
- **Tagline (placeholder):** "One stroke. One team."
- **Stack:** React 19 + TypeScript + Vite
- **Theming:** Light/dark mode via `ThemeContext` (`src/context/ThemeContext.tsx`), defaults to dark
- **Design anchor:** `images/Website1.png` — dark hero, bold uppercase headlines, orange accents, photo gallery with filters, news, sponsors
- **Palette:** dark backgrounds with emerald green (`#10b981`) primary, deep emerald (`#047857`) and light mint (`#6ee7b7`) shades, and bright emerald (`#34d399`) accent — see `src/styles/colors.ts`. A reusable `emeraldGradient(theme)` helper provides the primaryDark → primary → primaryLight gradient used on CTAs and badges.
- **Typography:** Bebas Neue (display headlines), Inter (body) — loaded from Google Fonts in `src/index.css`

## File map (what lives where)

- `src/styles/colors.ts` — palette (light + dark)
- `src/index.css` — global resets + Google Fonts import + CSS variables for fonts
- `src/data/roster.json` — **single source of truth for the roster** — edit this to swap in real members
- `src/data/events.json` — **single source of truth for events** — upcoming races + past results, drives Events page and Hero next-race badge
- `src/data/training.json` — **training weekends** — id, title, description, days[] (key, label, date, time, location, capacity). Each event is a weekend with two days at potentially different venues, mirroring the team's real sheet. Drives `/training`.
- `src/utils/bookings.ts` — localStorage layer for training sign-ups. Booking shape matches the team's Google Sheet columns (Name, Gender, Side/Role, Weight, PFD?, Paddle?, attending Sat/Sun/Both). Phase 3 swaps this module for an Apps Script POST to the sheet.
- `src/components/` — section components (Navigation, Hero, Features, Team, Contact, Footer), `Layout`, `MemberCard`, `EventCard`, `TrainingCard`, `VideoModal`, `BookingModal`, `ScrollToHash`
- `src/pages/` — route-level pages: `Home.tsx`, `Roster.tsx`, `Events.tsx`, `Training.tsx`
- `src/context/ThemeContext.tsx` — theme provider + toggle
- `src/App.tsx` — routing setup (BrowserRouter + Routes)

## Asset placeholders (swap with real files when ready)

- **Logo:** ✅ Real logo wired in. File at `public/logo.jpg` (copied from `images/alpas logo.jpg`). Used in Navigation header (circular crop) and Hero section.
- **Hero photo:** ✅ Real team photo wired in. File at `public/team.jpg` (copied from `images/alpas team.JPG`). Used as the Hero right-side image with a gradient overlay for the floating race-badge.
- **Race highlight video:** ✅ `public/race-highlight.mp4` (18 MB H.264/720p, transcoded from `images/Boracay Race.MP4`) + `public/race-poster.jpg` poster frame. Played by `VideoModal` from the Hero "Watch Us Race" button. To swap in a different clip, replace these two files (or re-transcode via `ffmpeg -i <input> -vf scale=-2:720 -c:v libx264 -preset slow -crf 26 -c:a aac -b:a 96k -movflags +faststart public/race-highlight.mp4`).
- **Roster photos:** each member in `src/data/roster.json` has `"photo": null`. Set to a path like `"/team/mateo.jpg"` (place files in `public/team/`) and the MemberCard will render them automatically instead of the initials avatar.

## Plan

### Phase 1 — Make it look like AlpasPinas ✓ (done 2026-05-28)
- [x] New dark/orange palette (Website1 inspired)
- [x] Display + body typography (Bebas Neue + Inter)
- [x] Default to dark theme
- [x] Rebrand all text "Dragon Boat" → "AlpasPinas"
- [x] Redesigned Navigation (logo mark, wordmark, Join CTA)
- [x] Redesigned Hero (bold uppercase headline, stats badges, hero photo placeholder, next-race badge)
- [x] Redesigned Features (icon tiles, dragon-boat-specific content)
- [x] Redesigned Team/Roster (initials-avatar cards, side badge, JSON-driven)
- [x] Redesigned Contact (form + meta panel)
- [x] Redesigned Footer
- [x] Updated `index.html` title + meta description

### Phase 2 — Add the sports-team pages (in progress)
- [x] Add React Router for multi-page navigation (BrowserRouter + Layout + Outlet)
- [x] **Roster page** — promote roster to a full page with filters by role/side (`/roster`)
- [x] **Events page** — upcoming races/regattas + past results, driven by `src/data/events.json` (`/events`)
- [x] **Training booking** — recurring weekly schedule + sign-up modal with live capacity, localStorage persistence (`/training`)
- [x] Photo gallery section with category tabs (like Website1) — done 2026-05-29

### Phase 3 — Data & operations
- [x] Training sign-ups wired to Google Sheet via Apps Script web app (two-way sync) — code done 2026-05-29; needs user to deploy + set env (see `google/SHEET-SETUP.md`)
- [ ] Decide long-term data source (static JSON → Google Sheets/Airtable → backend)
- [ ] Wire Contact form to actually send (Formspree / EmailJS / Netlify Forms)
- [ ] Define content-update workflow (who edits roster/events, how)

### Phase 4 — Stretch
- [ ] Member login (only if booking needs it)
- [ ] News / announcements
- [ ] Newsletter signup
- [ ] Results / standings page

## Open questions

- Real branding details: any logo file, exact team colors, official tagline?
- Real roster: names, roles, sides, joined years, photos
- Training schedule: when, where, capacity per session?
- Public site only, or member-only features needed?

## Session log

### 2026-06-11 — Supabase migration for user/admin data (Phases 3a–3e)
- **Goal:** move user/admin storage off Google Sheets to a real DB. Chose **Supabase** (Postgres + Auth + RLS) for <100 users — serverless, direct-from-SPA, managed auth (fixes the old plaintext-password problem). **Training sign-ups stay on Sheets.**
- **Phase 1 — schema:** wrote `supabase/schema.sql` — `profiles` (links 1:1 to `auth.users`), `applications`, `roster`; `is_admin()` and `is_email_approved()` as SECURITY DEFINER helpers; RLS policies. User ran it in the Supabase SQL editor.
- **Phase 2 — client:** installed `@supabase/supabase-js`; `src/utils/supabase.ts` singleton reads `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`. User switched to the new **publishable** key (`sb_publishable_…`).
- **Phase 3a — login:** `AuthContext` now tracks the Supabase session (`onAuthChange` + `getCurrentProfile`); `Login.tsx` is email+password. Verified end-to-end with a scripted test user.
- **Phase 3b — registration + gate:** `registerWithEmail` = pre-check `is_email_approved` RPC → `signUp` → insert gated profile. `Register.tsx` rewritten to single-mode email sign-up (token flow removed; gender/side/weight required). RLS gate: profile insert allowed only if `id=auth.uid()` AND email matches the login AND email has an approved application.
- **Phase 3c — applications:** `submitApplication`/`getApplications`/`approve`/`reject` now hit Supabase. Public submit is a **bare insert** forced to `status='pending'`.
- **Phase 3e — admin gate:** removed the client-side `VITE_ADMIN_PIN`/`PinGate` from `Admin.tsx`; now gates on `user.isAdmin` (redirect to `/login` when signed out, "Not authorized" for non-admins). `User` type gained `isAdmin`.
- **RLS gotchas learned (important):** (1) new publishable keys are opaque — don't rely on `to anon`; use role-agnostic policies gated by `using`/`with check`. (2) Anonymous inserts must be **bare** (no `.select()`) — `INSERT…RETURNING` needs a SELECT policy and there isn't one for anon. (3) `create policy` isn't idempotent → schema uses `drop policy if exists`. (4) After creating RPC functions, may need `notify pgrst, 'reload schema'`.
- **Real admin created:** `admin@alpaspinas.com` via dashboard Add-User + a SQL profile insert with `is_admin=true`, mobile blank (it's a service account, not a paddler — skipped the register form).
- **Commits:** `93f03e5` (Supabase client + schema), `a897ee7` (auth/registration/applications/admin migration). `.env.local` stays gitignored.
- **Where we left off:** functional Phase 3 done. **Open:** approval-notification gap (see Resume-here — the user asked to do this tomorrow), test-data cleanup not confirmed, real-admin browser login not yet confirmed, Phase 3f cleanup deferred.

### 2026-05-30 — Phase 3 Step 2 verified LIVE
- User deployed the Apps Script web app and set `VITE_BOOKINGS_ENDPOINT` in `.env.local`. Confirmed end-to-end working: sign-ups write to the "Web Signups" tab and load back from the sheet on every site open.
- Confirmed behavior to user: opening the site loads booking data from Google Sheets via `fetchBookings()` on mount; localStorage is only an instant-paint cache / offline fallback. Sheet is source of truth across all devices.
- Reminder captured in Resume-here: the `/exec` URL lives in gitignored `.env.local` — must be re-set on new machines and in the production host's env settings.

### 2026-05-29 — Phase 3 Step 2: training sign-ups → Google Sheet (two-way sync)
- **Decisions:** two-way sync (sheet is source of truth, capacity accurate across devices); web sign-ups land in a dedicated append-only **"Web Signups"** tab (not the formatted per-weekend tabs).
- New `google/apps-script.gs` — Apps Script web app. `doGet` returns all active bookings as JSON; `doPost` handles `{action:'add', booking}` (append row) and `{action:'cancel', eventId, name}` (soft-cancel via Status column). Auto-creates the "Web Signups" tab + header. Uses LockService to avoid race conditions. Columns: Timestamp, EventId, EventTitle, Name, Gender, Side/Role, Weight (kg), Need PFD?, Need Paddle?, Joining, Status. attending key ↔ human label ("sat"↔"Saturday Only", etc.).
- Rewrote `src/utils/bookings.ts` — endpoint from `VITE_BOOKINGS_ENDPOINT`. `getAllBookings()` stays **synchronous** (reads localStorage cache, so capacity logic is unchanged). New `fetchBookings()` GETs from sheet + refreshes cache. `addBooking`/`cancelBooking` are now **async** and POST to the sheet, then refetch. POST uses `Content-Type: text/plain` to dodge the CORS preflight Apps Script can't answer. **If endpoint is blank → local-only mode** (old localStorage behavior) so dev works without the sheet. Cache key still `alpas-bookings-v2`.
- `BookingModal.tsx` — `handleSubmit` now async: pulls fresh list from sheet, re-checks dedup + capacity, awaits `addBooking`, shows inline error on failure. Added `submitting` state ("Saving…" + disabled button) and a `refreshTick` so day capacity recomputes after a sheet fetch on open. Passes `eventTitle` through.
- `Training.tsx` — fetches from sheet on mount (plus the existing cache subscription); cancel wrapped in async `handleCancel`. Updated stale footnote copy.
- Added `Booking.eventTitle?` (optional) so the sheet row carries the weekend title. Added `.env.example`; gitignored `.env*` except the example.
- Setup guide: `google/SHEET-SETUP.md` (paste script → deploy web app as Me/Anyone → copy /exec URL → `.env.local`).
- TypeScript compiles cleanly (`npx tsc -b` → exit 0).
- **Where we left off:** All code done. User must do the one-time deploy + set `VITE_BOOKINGS_ENDPOINT` per `google/SHEET-SETUP.md`, then test (submit a sign-up → row appears in sheet → shows on another browser).

### 2026-05-29 — Photo gallery (`/gallery`) — Phase 2 complete
- New `src/data/gallery.json` — 9 photos. Shape: `{ id, category ("Training" | "Races" | "Off-water"), src, alt, caption, credit }`. Mix of real project assets (`/team.jpg`, `/race-poster.jpg`) + Unsplash placeholders hot-linked via `images.unsplash.com` (`?w=1000&q=80&auto=format&fit=crop`).
- New `src/pages/Gallery.tsx` — hero banner (team.jpg), category tab strip (All / Training / Races / Off-water with live counts), responsive masonry-ish grid (`auto-fill, minmax(260px, 1fr)`, 4:3 tiles) with category pill + caption overlay on each tile, `loading="lazy"` images, and an empty state. Clicking a tile opens a lightbox: full-screen blurred backdrop, prev/next arrows, caption + category/credit, keyboard nav (Esc to close, ←/→ to page), body-scroll lock while open. Wrapping arrows cycle within the current filter.
- Created `public/gallery/` (with a README) for the user to drop real photo files; reference them in `gallery.json` as `/gallery/<file>`.
- Wired `/gallery` route in `App.tsx`; added Gallery link to `Navigation` and `Footer`.
- TypeScript compiles cleanly (`npx tsc -b` → exit 0).
- **Where we left off:** Phase 2 is fully done. Next is Phase 3 Step 2 — wire training sign-ups to the real Google Sheet via Apps Script. User has Google Sheet + account details ready.

### 2026-05-29 — Training booking refactored to match real Google Sheet
- User shared the real sheet (`Alpas Lake Training Sign-ups`, screenshot at `images/sample training booking.png`). Schema is: Name, Gender, Paddling Side/Role (Left/Right/Coxswain/Coach), Weight (kg), Need PFD?, Need Paddle?, attending Sat / Sun / Both, Payment, Attendance. Pattern is "training weekend at two venues" not "recurring weekly slot".
- Rewrote `src/data/training.json` from recurring sessions to training events with a `days[]` array. Each day has its own date, time, location, and capacity, so Sat at Marina Putrajaya + Sun at Subang PARC fits naturally.
- Rewrote `src/utils/bookings.ts`. New `Booking` type maps 1:1 to the sheet's input columns so the Phase 3 swap is a row append, not a remap. Replaced `countForOccurrence`/`nextOccurrences` with `countForEventDay` (paddler with `attending: "both"` counts toward both Sat and Sun) + `hasNameBooked` for soft dedup. Bumped storage key to `alpas-bookings-v2` so any old test data is ignored.
- Replaced `SessionCard.tsx` with `TrainingCard.tsx`. Shows event title + description, per-day rows (weekday, date, time, venue), per-day capacity meter, and a single "Sign up →" CTA that's disabled when the whole weekend is full or it's already past.
- Rewrote `BookingModal.tsx` with the real form fields: Name, Gender chips, Side/Role chips, Weight (numeric, 30-200 kg), Need PFD? chips, Need paddle? chips, Joining chips (Saturday only / Sunday only / Both). Each Joining chip auto-disables and is labeled "(full)" when that day has no seats; selecting "Both" snaps to a single day if one fills up while the modal is open. Confirmation view summarizes which days they got.
- Updated `Training.tsx`: "Your sign-ups" panel now shows event title + attending label + day dates + name + side + weight + PFD/paddle flags. Cancel still works by name.
- All Phase 1 + Phase 2 sites still type-clean (`npx tsc -b` → no output).
- **Phase 3 next step:** write an Apps Script web app behind the team's Google Sheet that accepts a POST with the Booking JSON and appends a row. Then change `addBooking` (and optionally `getAllBookings`/`cancelBooking`) in `bookings.ts` to call that endpoint. No UI changes needed.

### 2026-05-29 — Training booking (`/training`)
- New `src/data/training.json` — 4 recurring weekly sessions (Tue/Thu Sprint & Endurance, Sat Race-prep, Sun Newcomer clinic). Shape: `{ id, day, weekday (0-6), startTime, endTime, location, type, capacity, description }`. Weekday is the JS day index so we can compute upcoming dates.
- New `src/utils/bookings.ts` — single-purpose localStorage layer. `getAllBookings`, `addBooking`, `cancelBooking`, `countForOccurrence`, `hasEmailBooked`, `subscribeBookings` (same-tab via custom event + cross-tab via `storage`), `nextOccurrences(weekday, count)`, `formatShortDate`. Bookings keyed by `${sessionId}::${YYYY-MM-DD}` so the same session on different weeks is tracked separately. Designed so Phase 3 swap is one file.
- New `src/components/SessionCard.tsx` — recurring-session card. Shows day chip, type/time/location, description, capacity meter (gradient bar that turns red when full), and a "Book this session →" CTA. The next-session date next to the day chip auto-rolls forward.
- New `src/components/BookingModal.tsx` — themed form: pick from next 4 occurrence dates (each row shows seats left, disabled if full), name, email (validated), experience level chips (Newcomer / Recreational / Competitive). Submit writes to `bookings.ts`. Success state shows a big green check + "YOU'RE IN" hero with date/time/location. Detects duplicate-email bookings and post-write capacity races, both with inline error.
- New `src/pages/Training.tsx` — hero banner (team.jpg), "PADDLE WITH US" title, "Your upcoming bookings" panel that only appears when the browser has bookings (with cancel buttons), and the weekly schedule grid.
- Wired `/training` route in `App.tsx`; added Training to `Navigation` and `Footer`.
- Page re-renders live as bookings change — both from the modal in this tab and from other tabs (the `storage` event).
- TypeScript compiles cleanly (`npx tsc -b` → no output).
- **Phase 3 swap path:** replace the four functions in `src/utils/bookings.ts` (`getAllBookings`, `addBooking`, `cancelBooking`, `subscribeBookings`) with Formspree/Supabase/Airtable calls. UI doesn't change.
- **Where we left off:** Phase 2 has one piece left — Photo gallery with category tabs.

### 2026-05-29 — Event thumbnails (hot-linked from Unsplash)
- Each event in `src/data/events.json` now has `thumbnail` (URL) + `thumbnailCredit` (string). All 8 events have unique, location-appropriate photos sourced from Unsplash and served via `images.unsplash.com` with `?w=800&q=80&auto=format&fit=crop` query params (Unsplash's CDN, free to hot-link under the Unsplash License).
- Photo assignments: Pasig River → orange dragon boat team (Joseph Corl), Putrajaya 2026 → Putrajaya aerial (Ishan @seefromthesky), Subic Bay → calm sea sunset (Mick Haupt), Boracay → Boracay beach (Laurentiu Morariu), Manila Bay → Manila Bay sunset (Paolo Syiaco), Iloilo → dragon boats racing (Joseph Corl), Putrajaya 2024 → race with spectators (Junliang Deng), Training Camp → dragon boat lanes (Joseph Corl).
- Redesigned `EventCard.tsx`: thumbnail is now a 16:9 hero image at the top of the card. Date badge (month/day/year) overlays the top-left with a glassy backdrop; medal pill (gold/silver/bronze) overlays the top-right for podium finishes. A subtle top + bottom gradient keeps the chips legible over any photo. Type chip moves into the body. Existing result panel unchanged.
- Falls back to the emerald gradient block if `thumbnail` is missing — card still renders cleanly with no broken-image state.
- `<img loading="lazy">` so off-screen cards don't fetch their images until scrolled into view.
- No bytes added to the repo — everything streams from Unsplash's CDN. Swap in your own photos by replacing the URLs (or self-hosting under `public/events/`).
- TypeScript compiles cleanly (`npx tsc -b` → no output).
- **Where we left off:** Events page is visually rich. Phase 2 has two pieces left: Training booking and Photo gallery.

### 2026-05-29 — Events page (`/events`) + data-driven Hero badge
- New `src/data/events.json` — 8 sample events (3 upcoming, 5 past). Shape: `{ id, name, location, date (YYYY-MM-DD), type, description, result: { rank, category, time, notes } | null }`.
- New `src/components/EventCard.tsx` — shared card. Left date strip (month/day/year, tinted emerald for upcoming), type chip, location with pin icon, description, and a medal-colored result panel for past races (gold/silver/bronze for podium, neutral for 4th+). Exports `parseEventDate` and `isUpcoming` helpers.
- New `src/pages/Events.tsx` — hero banner (reuses team.jpg), Upcoming/Past tab toggle with counts, type filter chips derived from data, result count + clear-filter, empty state. Upcoming sorted ascending (next race first); past sorted descending (most recent first).
- Wired `/events` route in `App.tsx`, added Events link to `Navigation` and `Footer`.
- `Hero.tsx` "Next race" badge now reads from `events.json` — picks the soonest upcoming event automatically. Shows "Off-season" copy if none. Removes the hardcoded Pasig date that would have gone stale.
- TypeScript compiles cleanly (`npx tsc -b` → no output).
- **Where we left off:** Events page is live and data-driven. Phase 2 has two pieces left: Training booking and Photo gallery.

### 2026-05-29 — Race highlight video + VideoModal
- Transcoded `images/Boracay Race.MP4` (184 MB, 4K/30fps, 56s) → `public/race-highlight.mp4` (18 MB, 720p H.264, AAC 96k, faststart). Used `ffmpeg -vf scale=-2:720 -c:v libx264 -preset slow -crf 26 -c:a aac -b:a 96k -movflags +faststart`.
- Generated `public/race-poster.jpg` (~100 KB) from a frame at t=2s for instant first-paint before the video buffers.
- New `src/components/VideoModal.tsx`: full-screen themed overlay with backdrop blur, autoplay, native controls, close button + ESC + backdrop-click to dismiss, body-scroll lock while open, pause+reset on close, soft pop-in animation. Reusable — takes `src`, `poster`, `title` props.
- Updated `Hero.tsx`: "Watch Us Race" anchor → button. Now opens the modal. Added a small emerald-gradient circle with a play triangle so the button reads as video. Mounted `<VideoModal>` at the bottom of the Hero section.
- TypeScript compiles cleanly (`npx tsc -b` → no output).
- **Heads-up:** 18 MB sits in `public/` and is not gitignored. If repo size matters, consider hosting the video off-repo later (CDN/YouTube) — the `VideoModal` accepts any `src` URL.
- **Where we left off:** Race highlight is playable from the Hero. Next: pick the next Phase 2 piece (Events page, Training booking, or Photo gallery).

### 2026-05-29 — Palette swap: orange → emerald green (with gradient)
- Rewrote `src/styles/colors.ts`: emerald-family hex values across both dark and light themes. Background now has a faint green tint (`#0b1014` dark, `#f7faf8` light) to harmonize with the new primary.
- New palette: `primary #10b981` (emerald-500), `primaryDark #047857` (emerald-700), `primaryLight #6ee7b7` (emerald-300), `accent #34d399`/`#059669` (bright emerald / readable on light).
- Added a reusable `emeraldGradient(mode)` helper that returns `linear-gradient(135deg, primaryDark 0%, primary 55%, primaryLight 100%)` — single source of truth for the new CTA look.
- Applied gradient to: Hero "Join the Team →" CTA, Hero next-race badge dot, Navigation "Join the Team" button (with a soft drop shadow).
- Updated `MemberCard.avatarColor` palette from warm oranges to six emerald tones so initials avatars stay on-brand.
- All existing `c.primary`-tinted borders, eyebrow chips, hover states, and radial-gradient hero glows inherit the new color automatically (no per-component changes needed).
- TypeScript compiles cleanly (`npx tsc -b` → no output).
- **Where we left off:** Color theme is now emerald. Next: pick the next Phase 2 piece (Events page, Training booking, or Photo gallery).

### 2026-05-29 — About section icons replaced with inline SVGs
- Replaced 4 emoji icons in `Features.tsx` with custom inline SVG components: paddle+ripple (Structured Training), trophy+star (Race Ready), three-person group (Real Community), life vest (Gear Provided).
- Icons use `currentColor` + brand orange via the theme context — fully theme-aware.
- Each icon tile got a thin orange border (`${c.primary}30`) to tie tighter to the palette.
- **Note:** Vite 8 / Oxc parser is strict about curly/smart quotes in `.tsx` files — always use straight ASCII quotes.

### 2026-05-29 — Real logo + team photo wired in
- Copied `images/alpas logo.jpg` → `public/logo.jpg` and `images/alpas team.JPG` → `public/team.jpg` so Vite serves them at `/logo.jpg` and `/team.jpg`.
- **Navigation:** Replaced the `LogoMark` SVG placeholder with a circular crop of the real logo (40×40, with border). Removed the now-unused `LogoMark` component.
- **Hero:** Added the real logo as a 72×72 circular badge next to the "Filipino Dragon Boat Team" eyebrow chip. Updated the eyebrow text to "Filipino Dragon Boat Team · Malaysia" to match the logo's "(MALAYSIA)" branding.
- **Hero photo:** Replaced the placeholder block (dragon emoji + caption) with the real team group photo (`object-fit: cover`). Added a bottom-to-top gradient overlay so the floating "Next race" badge remains readable on top of the photo.
- **Roster page:** Added a full-bleed team-photo banner at the top of `/roster` (clamp-sized height, fades into the dark page background via gradient). Tightened the page header top padding to `2.5rem` to compensate.
- TypeScript compiles cleanly (`npx tsc -b` → no output).
- **Where we left off:** Real branding assets are live. Site should render with the actual logo + team photo on home and roster. Next: pick the next Phase 2 piece (Events page, Training booking, or Photo gallery).

### 2026-05-29 — Phase 2 step 1: routing + Roster page
- Added `react-router-dom@^7.0.0` to `package.json` (user needs to run `npm install` once).
- Created shared `Layout` component (Navigation + `<Outlet />` + Footer).
- Wired `BrowserRouter` + `Routes` in `App.tsx`. Routes: `/` → `Home`, `/roster` → `Roster`.
- Created `src/pages/Home.tsx` (composes Hero + Features + Team teaser + Contact).
- Extracted `MemberCard` from `Team.tsx` so both Home teaser and Roster page share it.
- Made `Team.tsx` a teaser: shows first 4 members + "View all N members →" CTA to `/roster`.
- Built `src/pages/Roster.tsx`: full roster, role + side filter chips (options derived from data), sort by seniority/name, result count + clear-filters, empty state.
- Updated `Navigation` + `Footer` to use router `Link`/`NavLink`. Anchor sections (`/#about`, `/#contact`) work from any page.
- Added `ScrollToHash` helper so hash navigation scrolls smoothly to the section after route changes.
- TS compiles cleanly aside from the expected "Cannot find react-router-dom" until `npm install` is run.
- ✅ User confirmed `npm install` ran successfully and the build errors cleared.
- **Where we left off:** Phase 2 step 1 done and verified working. User is closing this thread and resuming in a fresh thread inside their Claude Projects folder. Next: pick the next Phase 2 piece (Events page, Training booking, or Photo gallery).

### 2026-05-28 — Phase 1 visual rebrand
- Reviewed current code and the design mockups in `/images/`.
- Confirmed direction: anchor to Website1 (dark/bold/orange), use placeholders for assets, swap real assets later.
- Executed Phase 1 in full:
  - New palette in `src/styles/colors.ts`
  - Google Fonts (Bebas Neue + Inter) in `src/index.css`
  - Defaulted theme to dark in `ThemeContext.tsx`
  - Rewrote Navigation, Hero, Features, Team, Contact, Footer
  - Added `src/data/roster.json` as roster data source
  - Enabled `resolveJsonModule` in `tsconfig.app.json`
  - Fixed pre-existing type-only import warning in `ThemeContext.tsx`
  - Updated `index.html` title + meta description
- Verified `tsc -b` compiles cleanly (no type errors).
- Vite bundle was not verified in the sandbox due to a Linux ARM64 native binding missing from this environment — it should build fine on the user's Mac.
- **Where we left off:** Phase 1 done. Run `npm run dev` and check the site. Next: Phase 2 (router + Roster/Events/Training pages), and dropping real assets in to replace placeholders.
