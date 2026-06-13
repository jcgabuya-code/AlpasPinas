# AlpasPinas — Project Instructions

## Project Context

AlpasPinas is a dragon boat team portal website — a full-featured, full-stack web application for managing and engaging a sports team community.

## Development Guidelines

1. **Role:** Work as a full-stack developer. Implement both frontend and backend functionality as needed.
2. **UI/UX:** Refer to the design references below for current trends. Also search the web for additional inspiration when needed.
3. **Goal:** Build an intuitive, functional team portal with full features — registration, scheduling, results, communication, etc.
4. **Clarification:** If a prompt has too many viable directions, ask before proceeding to narrow down the approach.

## Project Structure

- `src/` — React + TypeScript app (pages, components, hooks).
- `supabase/` — schema, migrations, and edge functions for the Supabase backend.
- `google/` — Google Apps Script / Sheets backend code.
- `scripts/` — one-off developer & debugging scripts (`*.mjs`/`*.js`). Not part
  of the build or an automated test suite; run from the project root with
  `node scripts/<name>.mjs`. See `scripts/README.md`.
- `public/`, `images/` — static assets.
- Root config only: `vite.config.ts`, `eslint.config.js`, `tsconfig*.json`,
  `package.json`. Keep ad-hoc scripts out of the root — put them in `scripts/`.

## Claude Code Permissions

- All Bash commands (including curl) are allowed for this project folder only — configured in `.claude/settings.local.json` via a blanket `"Bash"` allow rule.

## UI Design References

### Design Inspiration
- [Dribbble](https://dribbble.com) — UI/UX shots from designers
- [Behance](https://behance.net) — full project case studies
- [Awwwards](https://awwwards.com) — award-winning websites
- [Land-book](https://land-book.com) — landing page gallery

### UI / Component Specific
- [Mobbin](https://mobbin.com) — real app UI patterns (web + mobile)
- [Screenlane](https://screenlane.com) — UI inspiration by component type
- [UI Garage](https://uigarage.net) — filtered by component/pattern

### Full Website Galleries
- [Siteinspire](https://siteinspire.com) — curated website showcase
- [One Page Love](https://onepagelove.com) — single-page sites
- [Godly](https://godly.website) — trendy/modern web design
