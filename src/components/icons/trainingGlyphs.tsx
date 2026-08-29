import React from 'react';

// Shared hand-drawn glyph set for the training system — used by TrainingSchedule
// (Home v2) and the standalone /training page so both surfaces draw the exact
// same marks instead of maintaining duplicate SVGs.

export const PinGlyph: React.FC<{ color: string; size?: number }> = ({ color, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s-6.5-5.2-6.5-10.2A6.5 6.5 0 0 1 18.5 10.8C18.5 15.8 12 21 12 21z" />
    <circle cx="12" cy="10.5" r="2.4" />
  </svg>
);

export const StarGlyph: React.FC<{ color: string; size?: number }> = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z" />
  </svg>
);

// Land = dumbbell, lake = wave — the venue marks, shared by the schedule
// timeline and the training-card venue badge.
export const LandGlyph: React.FC<{ color: string; size?: number }> = ({ color, size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" />
  </svg>
);

export const WaveGlyph: React.FC<{ color: string; size?: number }> = ({ color, size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 8c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2M2 15c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2" />
  </svg>
);

// Kicker marks — a rising bar-chart for the strength/erg side, staggered ripple
// lines for the boat side. Matches the reference reel design exactly (plain
// colored bars, not an icon-library glyph).
export const BarsGlyph: React.FC<{ color: string }> = ({ color }) => (
  <span style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '14px' }} aria-hidden="true">
    <span style={{ width: '3px', height: '6px', background: color }} />
    <span style={{ width: '3px', height: '11px', background: color }} />
    <span style={{ width: '3px', height: '14px', background: color }} />
  </span>
);

export const LinesGlyph: React.FC<{ color: string }> = ({ color }) => (
  <span style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '16px' }} aria-hidden="true">
    <span style={{ height: '2px', borderRadius: '2px', background: color }} />
    <span style={{ height: '2px', borderRadius: '2px', marginLeft: '4px', background: color }} />
    <span style={{ height: '2px', borderRadius: '2px', background: color }} />
  </span>
);

export const WhatsAppGlyph: React.FC<{ size?: number }> = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2z" />
  </svg>
);
