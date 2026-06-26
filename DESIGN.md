# Design

Visual system for AlpasPinas, captured from the live code (`src/styles/colors.ts`, `src/styles/tokens.ts`, `src/index.css`). Dark mode is the primary aesthetic. There are two brand palettes — **emerald** (default/original) and **ocean** (client-requested alt) — switchable via `ThemeContext`; both support dark + light. Identity preservation wins: new work composes within these tokens rather than introducing new colors.

## Color

Colors live in `src/styles/colors.ts` as `colors[brand][mode]`. Default is `emerald.dark`.

### Emerald (default) — dark

| Role | Token | Hex | Notes |
|---|---|---|---|
| Background | `background` | `#0b1014` | near-black, slight green tint |
| Surface | `surface` | `#121820` | cards, nav |
| Surface alt | `surfaceAlt` | `#1a2230` | nested surfaces |
| Text | `text` | `#f5f7f5` | off-white |
| Text secondary | `textSecondary` | `#9aa8a0` | muted green — verify ≥4.5:1 before use on body |
| Primary | `primary` | `#10b981` | emerald-500, brand core |
| Primary dark | `primaryDark` | `#047857` | emerald-700 |
| Primary light | `primaryLight` | `#6ee7b7` | emerald-300 |
| Accent | `accent` | `#34d399` | emerald-400 |
| Border | `border` | `#243240` | |
| Hover | `hover` | `#161f29` | |
| Band | `sand` | `#0e161b` | alternating section band |
| **Sun** | `sun` | `#f2b544` | **warm counter-accent — cadence/beat + promo motif ONLY, never a second general-purpose color** |

### Emerald — light
bg `#f7faf8`, surface `#ffffff`, text `#0b1014`, primary `#10b981`, accent `#059669` (darkened for contrast), sun `#d98e0b` (darkened for AA on light).

### Ocean (alt)
Cool-blue equivalent: primary `#0ea5e9` (sky-500), primaryLight `#7dd3fc`, accent `#38bdf8`; dark bg `#0a1018`. Same `sun` accent. Use only when brand is toggled to `ocean`.

### Signature gradient
`brandGradient(brand, mode)` in `colors.ts`:
- **emerald**: `linear-gradient(135deg, primaryDark → primary → primaryLight)` (3-green sweep) — used on CTAs, badges.
- **ocean**: `linear-gradient(135deg, #0ea5e9 → #8b5cf6 → #ef4444)` (blue → violet → red).

The merch product photography itself carries a **navy → red diagonal gradient with batik overlay** — treat that as the apparel's own palette inside cards; don't recolor it.

### Contrast (WCAG AA, required)
Body text ≥ 4.5:1, large/bold ≥ 3:1. `textSecondary` (`#9aa8a0`) on `background` is borderline — only for large or non-essential text; push toward `text` for body. Never signal promo/stock with color alone — pair with a label or icon.

## Typography

Loaded from Google Fonts in `index.css`. CSS vars: `--font-display`, `--font-body`.

- **Display**: `Bebas Neue` (single weight, ultra-condensed caps) — section headlines. Kept per client preference after reviewing alternatives.
- **Body**: `Inter` (400/500/600/700/800).
- **Utility/labels**: Inter 600, uppercase, wide tracking (`0.13em`).

### Type scale (`src/styles/tokens.ts`)
- Display `lg`: `clamp(2.5rem, 9vw, 4.5rem)`, line-height 0.95 — loudest section header.
- Display `md`: `clamp(2.25rem, 6vw, 3.5rem)`, line-height 1 — supporting headers.
- `displayStyle(size)` is the single source; don't re-derive sizes inline.
- Cap body line length 65–75ch. Hero clamp max already ≤ 4.5rem (within the ≤6rem ceiling).

## Approach: mobile-first

Design and build for the small screen first (~375px), then enhance upward — base styles target mobile, wider layouts are the progressive enhancement. Verify every surface at 375 / 768 / 1024 / 1440. Concretely: single-column by default; touch targets ≥ 44×44px (size chips, qty steppers, nav/cart buttons, remove links); body text ≥ 16px on mobile; tap (not hover) drives every primary action — hover is enhancement only, never the sole affordance; no horizontal scroll; respect safe areas. Existing `useIsMobile` + the `clamp()`-based `sectionShell`/type scale already lean fluid; keep new work the same.

## Layout & Rhythm

- **Section shell** (`sectionShell`): `padding-block: clamp(3.5rem, 8vw, 6rem)`, `padding-inline: clamp(1rem, 4vw, 2rem)` — one rhythm for every band, no JS breakpoints for spacing.
- **Content max width**: `1280px`.
- Responsive grids: `repeat(auto-fit, minmax(280px, 1fr))` (e.g. product grid ~`minmax(260px, 1fr)` as used in gallery).
- Eyebrow chip exists as a system element (`eyebrowChip`) **with the sun beat-dot** — it is a deliberate brand element here, not the generic AI eyebrow. Still, don't stamp it above *every* new section; use the cadence cadence/rhythm instead where possible.

## Components (existing, reuse)

Card patterns: `MemberCard`, `EventCard`, `TrainingCard`, `ProductCard` (to build). Modals: `VideoModal`, `BookingModal` (themed overlay, backdrop blur, ESC/backdrop close, body-scroll lock, confirmation success state — reuse this pattern for cart/checkout). `SectionHeader`, `Marquee`, `Navigation` (+ mobile drawer), `Footer`, `Layout` (Nav + Outlet + Footer). New merch UI should match these.

## Motion (signatures + rules)

Animations defined in `index.css`, all with `prefers-reduced-motion: reduce` fallbacks (required).

- **Cadence beat** (`.cadence-beat`): amber `sun` beat-ticks brighten left→right like a drummer setting stroke. The team's signature attention motif — extend this to the promo, not flashing badges.
- **Wake underline** (`.wake-underline`): thin line fills left→right under a keyword, echoing a hull's wake.
- **Hero rise / reveal** (`.hero-rise`, `.reveal.is-visible`): staggered opacity+translateY entrances, `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out). Compositor-only.
- **Wave/edge scroll, Ken Burns, marquee**: transform-driven (compositor-only) for GPU smoothness.
- Rules: ease-out curves, no bounce/elastic; animate transform/opacity (+ blur/mask where it earns it), never layout props; every animation needs a reduced-motion equivalent (crossfade or static).

## Anti-patterns to avoid (from PRODUCT.md)

No AI-template SaaS look (cream bg, eyebrow-on-every-section, identical icon-card grids, gradient text, hero-metric template). No loud/gamified deals styling (countdown timers, flashing discount badges, marketplace clutter). Promotions earn attention through hierarchy, placement, and the cadence motif — not noise.
