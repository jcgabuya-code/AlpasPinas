export const colors = {
  // Dark theme is the primary aesthetic (matches mockup)
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
  },
};

export type ColorMode = keyof typeof colors;
export type ColorPalette = typeof colors.dark;

// Reusable emerald gradient — primaryDark → primary → primaryLight
export const emeraldGradient = (mode: ColorMode = 'dark') => {
  const c = colors[mode];
  return `linear-gradient(135deg, ${c.primaryDark} 0%, ${c.primary} 55%, ${c.primaryLight} 100%)`;
};
