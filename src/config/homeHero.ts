// ── Home hero rollback switch ─────────────────────────────────────────────────
// One place to flip the home hero between its three built designs. Both Home.tsx
// (which hero to render) and Navigation.tsx (whether to merge into a transparent
// masthead on Home) read this, so changing it here switches everything together.
//
//   'wordmark' — current: oversized ALPASPINAS masthead fused with a transparent
//                nav (no nav logo at the top of Home). src/components/Hero.tsx
//   'kinetic'  — previous: BREAK / AWAY split hero + framed photo, standard nav.
//                src/components/Hero.kinetic.tsx
//   'legacy'   — original: RULERS OF THE WATER split photo/text hero, standard nav.
//                src/components/Hero.legacy.tsx
export type HomeHeroMode = 'wordmark' | 'kinetic' | 'legacy';

export const HOME_HERO: HomeHeroMode = 'wordmark';
