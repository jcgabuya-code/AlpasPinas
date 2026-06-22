// Brand-agnostic design tokens — the intentional type scale + section rhythm the
// landing page is built on. Colors stay in colors.ts (they're brand/theme specific);
// everything here is the shared *system* the frontend-design pass standardizes so
// each section reads as one identity instead of re-deriving sizes inline.
import type React from 'react';

// Section shell — one rhythm for every band. Replaces the per-section isMobile
// padding branches (which had drifted to 6rem/3.5rem · 2rem/1rem/1.5rem). The
// clamp scales fluidly phone→desktop so no JS breakpoint is needed for spacing.
export const sectionShell: React.CSSProperties = {
  paddingBlock: 'clamp(3.5rem, 8vw, 6rem)',
  paddingInline: 'clamp(1rem, 4vw, 2rem)',
};

// Max content width for a section's inner container.
export const contentMaxWidth = '1280px';

// The eyebrow chip — the small uppercase label that leads each section header,
// with the amber `sun` beat-dot. Caller layers in the brand colors (primary tint
// + sun dot) since those are theme-specific.
export const eyebrowChip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.33rem 0.85rem',
  borderRadius: '999px',
  fontSize: '0.73rem',
  fontWeight: 600,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  marginBottom: '0.85rem',
};

// Display type scale for section headlines. Two deliberate steps:
//   lg — the page's loudest section header (Features "BUILT FOR THE WATER")
//   md — supporting section headers (Team, Contact)
// Single fluid clamp per step replaces the old desktop/mobile clamp swap.
export type DisplaySize = 'lg' | 'md';

const displaySizes: Record<DisplaySize, React.CSSProperties> = {
  lg: { fontSize: 'clamp(2.5rem, 9vw, 4.5rem)', lineHeight: 0.95, letterSpacing: '0.01em' },
  md: { fontSize: 'clamp(2.25rem, 6vw, 3.5rem)', lineHeight: 1, letterSpacing: '0.02em' },
};

export const displayStyle = (size: DisplaySize = 'md'): React.CSSProperties => ({
  fontFamily: 'var(--font-display)',
  fontWeight: 400,
  margin: 0,
  ...displaySizes[size],
});

// One tile of the headline accent — a row of soundwave/equalizer bars in `color`,
// as a CSS background url, tiled horizontally to read as a stroke-rate / drummer's-
// beat meter under a headline. Shared by the hero readout, the contact invite, and
// the mobile drawer header.
export const cadenceAccentUri = (color: string) => {
  const bars = [7, 12, 16, 10, 15, 8, 13, 11]
    .map((h, i) => {
      const cx = 5 + i * 10;
      return `<rect x='${cx - 1.5}' y='${9 - h / 2}' width='3' height='${h}' rx='1.5'/>`;
    })
    .join('');
  return `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='18' viewBox='0 0 80 18'><g fill='${color}'>${bars}</g></svg>`
  )}")`;
};
