---
target: the home page
total_score: 31
p0_count: 0
p1_count: 2
timestamp: 2026-06-25T15-52-41Z
slug: src-pages-home-tsx
---
# Critique — Home page (`src/pages/Home.tsx` + section components)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Contact form confirms success but never sends; no loading/sending state |
| 2 | Match System / Real World | 4 | Crew-first, dragon-boat-native voice throughout; natural language |
| 3 | User Control and Freedom | 3 | Modal ESC/close, "Send another", anchor nav all present |
| 4 | Consistency and Standards | 3 | Gradient-text accent word breaks the otherwise-solid accent convention; eyebrow on every section |
| 5 | Error Prevention | 3 | Inline validation, type=email, select default — decent guardrails |
| 6 | Recognition Rather Than Recall | 4 | Everything visible, icons labelled, nothing hidden |
| 7 | Flexibility and Efficiency | 3 | Quick CTAs, marquee pause-on-hover; fine for a marketing page |
| 8 | Aesthetic and Minimalist Design | 2 | Hero fold is overloaded — badge + headline + cadence meter + 3 keyword beats + paragraph + 2 CTAs + 3 stats + race ticket + scroll cue all compete |
| 9 | Error Recovery | 3 | Plain-language inline errors ("That email looks off"); but form doesn't persist on nav |
| 10 | Help and Documentation | 3 | Contact details + invitation copy stand in for help |
| **Total** | | **31/40** | **Good — solid foundation, address the weak areas** |

## Anti-Patterns Verdict

**LLM assessment:** This does NOT read as generic AI slop. The stroke-cycle Features section, the tear-off race-ticket, the cadence beat-dots, the hand-drawn line-art glyphs, and the wake-underline are genuinely distinctive, on-brand moves that a template would never produce. The dark/emerald + reserved `sun` accent is committed and specific. Two real tells remain (below).

**Deterministic scan:** `detect.mjs` over all 8 home-page files returned **0 findings** (exit 0). The detector did not catch the gradient-text instance in `Features.tsx` (inline `WebkitBackgroundClip` on a styled span slips its pattern) — a false negative; the LLM review caught it.

**Visual overlays:** Not available — no browser-automation tool in this session, so no in-page overlay was injected. Source + detector only.

## Overall Impression

A confident, characterful page that already clears the "AI made this" bar. The biggest opportunity isn't more personality — it's **focus and follow-through**: the hero tries to say everything at once, and the entire page funnels to a contact form that silently does nothing. Fix those two and this is genuinely strong.

## What's Working

1. **The stroke-cycle Features section.** Mapping four reasons-to-join onto the four phases of a paddle stroke (Catch/Pull/Drive/Recover) with the rotating paddle glyph tracing the blade's path — that's a real concept, not a benefit grid. The numbered 01–04 markers are *earned* here because it's a genuine sequence.
2. **The race-ticket CTA.** The frosted, perforated, punch-notched "Next Race · Reserve Seat" ticket is a memorable, brand-true affordance that beats a generic button — and it reuses cleanly across wide hero + mobile photo.
3. **Cadence as a system, not decoration.** The amber beat-dots, the soundwave meter, and the wake-underline all carry the drummer's-count idea from PRODUCT.md's design principles, with reduced-motion fallbacks. The voice is consistent.

## Priority Issues

### [P1] The contact form is a dead end
**Why it matters:** Every CTA on the page ("Book Your First Session", the race ticket, the join card, "Claim my seat") points at `#contact`. The form validates, then shows "Seat saved. We'll be in touch within a day or two" — but `onSubmit` only sets local state (`// TODO: wire to backend`). Nothing is sent or stored. The page's single conversion goal silently fails, and it tells the user it succeeded. This is the most damaging issue on the page.
**Fix:** Wire submit to Supabase `applications` (or an email relay), add a sending/loading state and a real error path, and only show the success card on confirmed write. Until wired, the confirmation copy is a promise the site can't keep.
**Suggested command:** `/impeccable harden` (states + error path) — but the backend wire-up is the substance.

### [P1] Gradient text in the Features header
**Why it matters:** "BUILT FOR **THE WATER**" uses `background-clip: text` over `brandGradient` — an absolute ban in the skill AND an explicit anti-reference in your own PRODUCT.md. It's also inconsistent: every other section accent word (GEAR **UP**, MEET THE **CREW**, CLAIM YOUR **SEAT**) is a solid `c.primary`. This one section breaks the convention for no narrative reason.
**Fix:** Make "THE WATER" solid `c.primary` (or `primaryLight` in dark) like the others. Emphasis via the display weight/size it already has.
**Suggested command:** `/impeccable polish`

### [P2] Eyebrow chip on every section
**Why it matters:** All four content sections lead with the same pill-eyebrow: "Team Store", "The Stroke", "The Crew", "The Open Seat". Your own DESIGN.md warns: *"don't stamp it above every new section."* Repeated section-label pills are exactly the AI-grammar cadence the brand brief says to avoid — even with the sun beat-dot dressing it up. One or two as anchors is voice; four-for-four is scaffolding.
**Fix:** Keep the eyebrow on one or two sections (e.g. the Features anchor), and let the others open differently — the cadence meter alone, a bare display headline, or the earned 01–04 markers. Vary the cadence.
**Suggested command:** `/impeccable typeset` or `/impeccable layout`

### [P2] The hero fold is overloaded
**Why it matters:** The most important moment on the page asks the eye to process ~9 distinct elements at once: identity badge, headline, soundwave cadence meter, three SPEED·SYNC·STRENGTH keyword beats, paragraph, two CTAs, a three-cell stats strip, the race ticket, and a scroll cue. Three of those (meter + keyword beats + wake underline) are all saying "cadence." Nothing is allowed to dominate, so the headline and primary CTA lose force. (Heuristic 8 = 2.)
**Fix:** Pick one cadence expression for the hero (the meter OR the keyword beats, not both stacked), and consider demoting the stats strip — it competes with the CTA and the numbers read as placeholder (12+, 5 YRS, #3). Let the headline + one CTA + the race ticket carry the fold.
**Suggested command:** `/impeccable distill` or `/impeccable layout`

### [P3] "THE WATER" echoes between hero and Features
**Why it matters:** The hero headline ends "RULERS OF THE **WATER**"; the Features header is "BUILT FOR **THE WATER**". Close enough to read as an accidental repeat rather than a deliberate refrain.
**Fix:** Re-voice one of them (e.g. Features → "BUILT FROM THE **STROKE**", tying to the section's own concept).

## Persona Red Flags

**Casey (Distracted Mobile User):** The form sits at the very bottom of a long, dense scroll — every CTA above it jumps there, which is good, but if Casey is interrupted mid-form, all field values are lost (no persistence). The hero on mobile stacks a lot of content before the photo band; first meaningful CTA arrives after a tall block.

**Riley (Stress Tester):** Hits the headline issue immediately — submits the form, sees "Seat saved", assumes it worked. It didn't. This is Riley's textbook red flag: *a feature that appears to work but silently fails.* Also: refresh mid-form loses everything.

**Jordan (First-Timer):** Mostly well served — "Book Your First Session" is an unambiguous first action and the copy repeatedly reassures ("no experience needed, all gear provided"). The unlabeled soundwave meter could puzzle, but it's `aria-hidden` and decorative, so low risk.

**Maria (project persona — prospective Filipino paddler, browsing on her phone in KL):** Feels the crew energy fast (photos, marquee, crew cards) — the emotional job is done well. Her risk is the same dead-end form: she works up the nerve to "Claim my seat", gets told she's in, and never hears back because nothing sent.

## Minor Observations

- Hero stats (12+, 5 YRS, #3 Regional Ranking) look like placeholders; if so, real numbers or remove — a wrong "#3 ranking" is worse than none.
- `textSecondary` (#9aa8a0) body copy actually computes to ~7:1 on the darkest bg — DESIGN.md's "borderline" caution is conservative; dark mode is fine. Re-verify the **light** theme, where it's darkened.
- Two sections in a row use a near-identical accent-word treatment; the gradient one is the odd one out (see P1).
- The cadence soundwave meter appears in both Hero and Contact — good as a repeated signature, just make sure the hero doesn't also stack the keyword beats next to it.

## Questions to Consider

- What's the *one* thing the hero must say in two seconds? Everything else in that fold is negotiable.
- If the form is the page's whole purpose, why is it the least-finished element?
- Does every section need to announce itself with a label, or can the design carry the transition?
