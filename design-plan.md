# AlpasPinas — Landing Page Design Plan

> Pass-1 plan using the `frontend-design` skill. Brief: evolve the existing dark/emerald
> identity into something less templated, full landing page. Critiqued against the
> skill's three "AI-default" looks before committing.

## The subject, named

AlpasPinas is a Filipino dragon boat team based in Malaysia. **"Alpas" means *to break free / breakaway*** — the name itself is the brief. Dragon boat is the one paddling sport driven by a **drummer's beat** that syncs the whole crew. Audience: prospective paddlers + the team's own community. The landing page's single job: make a visitor feel the crew's *speed and synchronization* and want to join.

## Honest critique of the current look

The current anchor — near-black background + a single bright emerald accent + Bebas Neue caps — is close to **AI-default #2** (near-black + one acid accent). Bebas Neue is the single most-overused free display face. None of it is *wrong*; it just isn't yet a choice made *for this team*. The evolution keeps the dark+emerald equity but spends one deliberate risk to break out of the default.

## Tokens

**Color** — keep the emerald/dark equity, ground it in *water at dawn* and add one disciplined counter-accent (the Filipino sun on water — also a nod to the PH flag's sun). The warm accent is the un-templating move: it's used *only* on the cadence/beat motif, never as a second general-purpose color.

- `ink` `#07100E` — deep-water near-black (cooler/greener than before)
- `surface` `#0E1A17`
- `emerald` `#10B981` — primary (kept; brand equity)
- `mint` `#6EE7B7` — light accent
- `sun` `#F2B544` — **new** warm counter-accent, drumbeat/cadence only
- `text` `#F5F7F5`

**Type** — kept **Bebas Neue** (per the client's preference after reviewing Anton/Oswald/Teko/Saira alternatives). The boldness is spent on the sun accent + cadence signature rather than a font change. Body stays **Inter**.

- Display: `Bebas Neue` (single weight, ultra-condensed caps)
- Body: `Inter`
- Utility/labels: `Inter`, 600, uppercase, wide tracking

**Layout** — keep the proven hero split (text left / photo right; stacked on mobile). The change is rhythm, not structure: the eyebrow → headline → **cadence line** → CTAs → stats becomes a deliberate downbeat sequence.

**Signature — the cadence.** The keyword line `SPEED · SYNC · STRENGTH` becomes a **stroke-cadence strip**: the separators become amber beat-ticks that pulse left-to-right like a drummer setting the stroke, and the word `WATER` in the headline gets a thin animated **wake underline**. This is the one memorable element; everything else stays quiet. (Reduced-motion users get the static version.)

## Default-check

- Dark + single green → broken by the disciplined `sun` counter-accent tied to the team's Filipino identity.
- Bebas Neue → replaced with a face chosen for *this* subject (shoulders/strength).
- Numbered `01/02/03` markers → not used; the cadence beats encode real rhythm, not decoration.

## Rollout

1. Foundational tokens (font + accent) — cascade safely from `index.css` + `colors.ts`.
2. Hero signature (cadence strip + wake underline).
3. Carry the type scale + restraint through Features / Team / Contact (review each in `npm run dev`).
