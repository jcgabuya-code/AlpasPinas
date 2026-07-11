// Three brand palettes, each with a dark + light mode.
//  - emerald: the original AlpasPinas look (dark is the primary aesthetic)
//  - ocean:   client-requested alt — pure ocean-blue accent + gradient
//  - bandila: royal-blue base, blue→crimson signature gradient (echoes the PH flag's blue + red)
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
    background: '#f8f4e8',       // light cream, faint warm-green undertone
    surface: '#fffdf5',          // near-cream, lifted for cards/nav
    surfaceAlt: '#f1ead8',
    text: '#0b1014',
    textSecondary: '#5b6863',
    primary: '#10b981',
    primaryDark: '#047857',
    primaryLight: '#6ee7b7',
    accent: '#059669',           // emerald-600 — readable accent on light bg
    border: '#e3dcc8',
    hover: '#f4eede',
    overlay: 'rgba(255, 255, 255, 0.6)',
    sand: '#efe6cf',             // deeper cream band — alternating-section contrast
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
    background: '#f7f2e4',       // light cream, cool blue accent carries the "ocean" read
    surface: '#fffcf2',          // near-cream, lifted for cards/nav
    surfaceAlt: '#efe6d2',
    text: '#0a1018',
    textSecondary: '#586478',
    primary: '#0ea5e9',
    primaryDark: '#0369a1',
    primaryLight: '#7dd3fc',
    accent: '#0284c7',           // sky-600 — readable accent on light bg
    border: '#e2dac2',
    hover: '#f2ebd5',
    overlay: 'rgba(255, 255, 255, 0.6)',
    sand: '#eee2c7',             // deeper cream band — alternating-section contrast
    sun: '#d98e0b',              // warm counter-accent, darkened for light bg — cadence/beat motif only
  },
};

const bandila = {
  dark: {
    background: '#0a1018',       // near-black with a cool blue tint (royal-blue base)
    surface: '#111824',          // lifted dark for cards/nav
    surfaceAlt: '#1a2332',       // even more lifted for nested cards
    text: '#f5f7fb',             // off-white, cool
    textSecondary: '#9aa6bd',    // muted, slightly blue
    primary: '#3b5bdb',          // royal blue — PH flag blue, brightened for dark-bg legibility
    primaryDark: '#0038a8',      // true PH flag blue (deep)
    primaryLight: '#93a8f2',     // light royal-blue tint
    accent: '#5b7cf5',           // bright royal-blue accent
    border: '#24324a',
    hover: '#161f2c',
    overlay: 'rgba(0, 0, 0, 0.55)',
    sand: '#1a1013',             // alternating band — a touch lifted/warm vs background (nods to the red)
    sun: '#fcd116',              // golden-yellow — PH flag sun/stars, cadence/beat motif only
  },
  light: {
    background: '#f8f3e3',       // light cream, gold-leaning — echoes the sun accent
    surface: '#fffcf1',          // near-cream, lifted for cards/nav
    surfaceAlt: '#f1e8d0',
    text: '#0a1018',
    textSecondary: '#586478',
    primary: '#3b5bdb',
    primaryDark: '#0038a8',
    primaryLight: '#93a8f2',
    accent: '#2541b8',           // deeper royal blue — readable accent on light bg
    border: '#e4dac0',
    hover: '#f3ecd7',
    overlay: 'rgba(255, 255, 255, 0.6)',
    sand: '#f0e4c4',             // deeper gold-cream band — nods to the sun/stars motif
    sun: '#caa406',              // golden-yellow, darkened for contrast on light bg — cadence/beat motif only
  },
};

export const colors = { emerald, ocean, bandila };

export type Brand = keyof typeof colors;        // 'emerald' | 'ocean' | 'bandila'
export type ColorMode = keyof typeof emerald;   // 'dark' | 'light'
export type ColorPalette = typeof emerald.dark;

// Signature gradient per brand.
//  - emerald: primaryDark → primary → primaryLight (3-green sweep)
//  - ocean:   pure ocean-blue sweep (deep → ocean → bright sky)
//  - bandila: royal blue → crimson red (PH flag's two field colors)
export const brandGradient = (brand: Brand = 'emerald', mode: ColorMode = 'dark') => {
  if (brand === 'ocean') {
    return 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 55%, #7dd3fc 100%)';
  }
  if (brand === 'bandila') {
    return 'linear-gradient(135deg, #0038a8 0%, #3b5bdb 55%, #ce1126 100%)';
  }
  const c = colors.emerald[mode];
  return `linear-gradient(135deg, ${c.primaryDark} 0%, ${c.primary} 55%, ${c.primaryLight} 100%)`;
};
