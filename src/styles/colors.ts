// Two brand palettes, each with a dark + light mode.
//  - emerald: the original AlpasPinas look (dark is the primary aesthetic)
//  - ocean:   client-requested alt — ocean blue accent, violet→red signature gradient
const emerald = {
  dark: {
    background: '#0b1014',       // near-black with slight green tint
    surface: '#121820',          // lifted dark for cards/nav
    surfaceAlt: '#1a2230',       // even more lifted for nested cards
    text: '#f5f7f5',             // off-white
    textSecondary: '#9aa8a0',    // muted, slightly green
    primary: '#10b981',          // emerald-500 — AlpasPinas emerald
    primaryDark: '#047857',      // emerald-700
    primaryLight: '#6ee7b7',     // emerald-300
    accent: '#34d399',           // emerald-400 — bright accent
    border: '#243240',
    hover: '#161f29',
    overlay: 'rgba(0, 0, 0, 0.55)',
    sand: '#0e161b',             // alternating "cream" band — a touch lifted/warm vs background
    sun: '#f2b544',              // warm counter-accent (Filipino sun on water) — cadence/beat motif only
  },
  light: {
    background: '#f7faf8',       // cool white with a hint of green
    surface: '#ffffff',
    surfaceAlt: '#eef3ef',
    text: '#0b1014',
    textSecondary: '#5b6863',
    primary: '#10b981',
    primaryDark: '#047857',
    primaryLight: '#6ee7b7',
    accent: '#059669',           // emerald-600 — readable accent on light bg
    border: '#dde6e0',
    hover: '#eff4f0',
    overlay: 'rgba(255, 255, 255, 0.6)',
    sand: '#f3efe6',             // warm cream band — earthy contrast against white/emerald
    sun: '#d98e0b',              // warm counter-accent, darkened for contrast on light bg — cadence/beat motif only
  },
};

const ocean = {
  dark: {
    background: '#0a1018',       // near-black with a cool blue tint
    surface: '#111824',          // lifted dark for cards/nav
    surfaceAlt: '#1a2332',       // even more lifted for nested cards
    text: '#f5f7fb',             // off-white, cool
    textSecondary: '#9aa6bd',    // muted, slightly blue
    primary: '#0ea5e9',          // sky-500 — ocean blue
    primaryDark: '#0369a1',      // sky-700
    primaryLight: '#7dd3fc',     // sky-300
    accent: '#38bdf8',           // sky-400 — bright accent
    border: '#24324a',
    hover: '#161f2c',
    overlay: 'rgba(0, 0, 0, 0.55)',
    sand: '#0d141d',             // alternating band — a touch lifted/cool vs background
    sun: '#f2b544',              // warm counter-accent — cadence/beat motif only
  },
  light: {
    background: '#f6f9fc',       // cool white with a hint of blue
    surface: '#ffffff',
    surfaceAlt: '#eef3f9',
    text: '#0a1018',
    textSecondary: '#586478',
    primary: '#0ea5e9',
    primaryDark: '#0369a1',
    primaryLight: '#7dd3fc',
    accent: '#0284c7',           // sky-600 — readable accent on light bg
    border: '#dbe5f0',
    hover: '#eef4fb',
    overlay: 'rgba(255, 255, 255, 0.6)',
    sand: '#f1eef7',             // faint violet-tinted band — nods to the gradient
    sun: '#d98e0b',              // warm counter-accent, darkened for light bg — cadence/beat motif only
  },
};

export const colors = { emerald, ocean };

export type Brand = keyof typeof colors;        // 'emerald' | 'ocean'
export type ColorMode = keyof typeof emerald;   // 'dark' | 'light'
export type ColorPalette = typeof emerald.dark;

// Signature gradient per brand.
//  - emerald: primaryDark → primary → primaryLight (3-green sweep)
//  - ocean:   ocean blue → violet → red
export const brandGradient = (brand: Brand = 'emerald', mode: ColorMode = 'dark') => {
  if (brand === 'ocean') {
    return 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 50%, #ef4444 100%)';
  }
  const c = colors.emerald[mode];
  return `linear-gradient(135deg, ${c.primaryDark} 0%, ${c.primary} 55%, ${c.primaryLight} 100%)`;
};
