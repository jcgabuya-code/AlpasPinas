---
name: screenshot
description: Launch and screenshot the running AlpasPinas app (React+Vite SPA), including the Supabase-auth-gated /admin panel, via Playwright. Use to visually verify any UI change at desktop or ~390px mobile before calling it done.
---

# Screenshot the AlpasPinas app

Drive the real app in a headless Chromium and capture what a user sees.
Playwright + Chromium are already installed (`playwright` dep, browser in
`~/Library/Caches/ms-playwright`). The driver is `scripts/shot.mjs`.

## 1. Make sure the dev server is running

```bash
curl -sf -o /dev/null http://localhost:5174 && echo up || (npm run dev >/tmp/vite.log 2>&1 &)
```

Vite picks the first free port from 5173; it commonly lands on **5174** here.
Check `/tmp/vite.log` for the actual `Local:` URL and pass `--base` if it differs.

## 2. Take shots

```bash
# public pages — no auth needed
node scripts/shot.mjs / --out scratchpad/home.png
node scripts/shot.mjs /shop --mobile --out scratchpad/shop-mobile.png

# auth-gated admin — logs in, then clicks a sidebar section
node scripts/shot.mjs /admin --section Boats --out scratchpad/boats.png
node scripts/shot.mjs /admin --section Boats --mobile --out scratchpad/boats-mobile.png
```

Then **Read the PNG** to actually look at it — a blank frame means it failed to
launch, not that the page is empty.

Flags: `--mobile` (390×844 @2x), `--section NAME` (click admin sidebar item),
`--full` (full-page), `--out PATH`, `--base URL`, `--wait MS`.

## 3. Admin credentials

`/admin` redirects to `/login` unless you're a logged-in admin
(`src/pages/Admin.tsx` — checks `user.isAdmin`). The driver logs in with
`PW_ADMIN_EMAIL` / `PW_ADMIN_PASSWORD`, read from the environment or from
`.env.local` (gitignored). If those keys are empty, admin shots fail with a
clear message — ask the user to fill them in `.env.local` (admin account is
`admin@alpaspinas.com`; the password is not stored anywhere in the repo).

## Notes

- Always verify UI at **both** desktop and ~390px mobile — the project rule is
  mobile-first for all UI (see memory `feedback_admin_mobile_pass`).
- This supersedes the older ad-hoc `scripts/test-admin*.mjs`, which used the
  dead PIN auth (`alpas2025`) from before the Supabase migration.
