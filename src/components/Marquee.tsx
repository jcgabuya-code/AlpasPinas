import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';
import sponsorsData from '../data/sponsors.json';

const ITEMS = [
  'ALPASPINAS',
  'DRAGON BOAT',
  'MALAYSIA',
  'ONE STROKE. ONE TEAM',
  'RULERS OF THE WATER',
  'FILIPINO PRIDE',
];

type Sponsor = { name: string; logo: string; url: string };
const SPONSORS = sponsorsData as Sponsor[];

const WaveIcon: React.FC<{ delay: number }> = ({ delay }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      animation: `waveFloat 2.6s ease-in-out infinite`,
      animationDelay: `${delay}s`,
    }}
  >
    {/* Hand-traced from thenounproject.com/icon/ocean-wave-7473753 */}
    <svg width="30" height="30" viewBox="0 0 40 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main wave arc — rises from bottom-left to the crest */}
      <path
        d="M3 26 C3 18, 5 10, 16 5"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Crest curl — sweeps right and loops back forming the barrel */}
      <path
        d="M16 5 C20 1, 30 1, 33 8 C36 15, 30 20, 24 17 C20 15, 20 10, 23 8"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right wave face — falls from curl down to the right */}
      <path
        d="M24 17 C28 14, 35 18, 35 26"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Inner barrel line — inside the curl */}
      <path
        d="M20 7 C20 12, 23 16, 27 16"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Water line 1 */}
      <path
        d="M2 30 C5 26, 9 26, 12 30 C15 34, 19 34, 22 30 C25 26, 29 26, 32 30 C35 34, 38 34, 38 32"
        stroke="rgba(255,255,255,0.75)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Water line 2 */}
      <path
        d="M2 37 C5 33, 9 33, 12 37 C15 41, 19 41, 22 37 C25 33, 29 33, 32 37 C35 41, 38 41, 38 39"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  </span>
);

const DragonboatIcon: React.FC = () => {
  const [src, setSrc] = useState('');

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const brightness = (d[i] + d[i + 1] + d[i + 2]) / 3;
        if (brightness > 180) {
          d[i + 3] = 0;            // light pixel → transparent
        } else {
          d[i] = d[i + 1] = d[i + 2] = 255; // dark pixel → white
        }
      }
      ctx.putImageData(imageData, 0, 0);
      setSrc(canvas.toDataURL());
    };
    img.src = '/icons/dragonboat-icon2.png';
  }, []);

  if (!src) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <img src={src} alt="" style={{ width: '104px', height: '60px', objectFit: 'contain', opacity: 0.85 }} />
    </span>
  );
};

const Separator: React.FC<{ delay: number }> = ({ delay }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
    <WaveIcon delay={delay} />
    <DragonboatIcon />
    <WaveIcon delay={delay + 0.15} />
  </span>
);

// Sponsor credit shown inline in the rotation: a "SPONSORED BY" tag plus the
// sponsor on a white pill (so logos stay legible against the emerald band).
const SponsorItem: React.FC<{ sponsor: Sponsor }> = ({ sponsor }) => {
  const [hasLogo, setHasLogo] = useState(Boolean(sponsor.logo));

  const chip = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.6rem',
        backgroundColor: '#fff',
        borderRadius: '999px',
        padding: hasLogo ? '0.4rem 1rem 0.4rem 0.5rem' : '0.45rem 1rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
      }}
    >
      {hasLogo && (
        <img
          src={sponsor.logo}
          alt={sponsor.name}
          onError={() => setHasLogo(false)}
          style={{ height: '28px', width: 'auto', objectFit: 'contain', display: 'block' }}
        />
      )}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.9rem',
          letterSpacing: '0.05em',
          color: '#1a1a1a',
        }}
      >
        {sponsor.name}
      </span>
    </span>
  );

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.85rem' }}>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.78rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        Sponsored by
      </span>
      {sponsor.url ? (
        <a href={sponsor.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          {chip}
        </a>
      ) : (
        chip
      )}
    </span>
  );
};

const Inner: React.FC = () => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '2rem',
      paddingRight: '2rem',
      whiteSpace: 'nowrap',
    }}
  >
    {ITEMS.flatMap((item, i) => [
      <span
        key={`item-${i}`}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1rem',
          letterSpacing: '0.18em',
          color: '#fff',
        }}
      >
        {item}
      </span>,
      <Separator key={`sep-${i}`} delay={i * 0.25} />,
    ])}
    {SPONSORS.flatMap((sponsor, i) => [
      <SponsorItem key={`sponsor-${i}`} sponsor={sponsor} />,
      <Separator key={`sponsor-sep-${i}`} delay={i * 0.25} />,
    ])}
  </span>
);

// One wave period: starts and ends at the same height (y≈11.38) so periods chain
// seamlessly. Written relative so it can be repeated to form a single continuous
// path — that avoids per-tile vertical seams that show on high-DPR mobile screens.
const WAVE_PERIOD_W = 174.47;
const WAVE_PERIOD_PX = 175; // rendered width of one period (matches the scroll keyframe)
// ~1400px wide: comfortably wider than any phone viewport (incl. landscape) so the
// repeat seam stays off-screen where it was visible (high-DPR mobile), but small
// enough to keep the animated layer's GPU texture cheap. Going much wider (we had
// 24 here) blows the mobile texture budget and makes layers flicker / drop paints.
const WAVE_PERIODS = 8;
const WAVE_REL_PERIOD =
  ' c 0,0 21.133851,11.39531 43.617661,11.38441' +
  ' c 22.4838,-0.0106 64.3509,-22.736 86.8903,-22.7685' +
  ' c 22.53944,-0.0325 43.96264,11.38441 43.96264,11.38441';

const WAVE_PATH_D =
  'm 0,11.38448' +
  WAVE_REL_PERIOD.repeat(WAVE_PERIODS) +
  ' V 46.34594 H 0 Z';

const WAVE_URL = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WAVE_PERIOD_W * WAVE_PERIODS} 46.35" preserveAspectRatio="none">` +
  `<path fill="white" fill-opacity="0.18" d="${WAVE_PATH_D}"/>` +
  '</svg>'
)}")`;

const WAVE_TILE_W = WAVE_PERIOD_PX * WAVE_PERIODS;

const waveLayerBase: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  // Extend one period past the right edge so the leftward transform scroll
  // (translateX up to -175px) never exposes a gap; overflow:hidden clips it.
  right: `-${WAVE_PERIOD_PX}px`,
  // Same height as the strip, but shifted down so the wave sits lower.
  // overflow:hidden on the container clips the part that drops below.
  top: '34px',
  bottom: '-34px',
  backgroundImage: WAVE_URL,
  backgroundRepeat: 'repeat-x',
  backgroundSize: `${WAVE_TILE_W}px 100%`,
  backgroundPosition: 'bottom',
};

// Wave-shaped edge divider, filled with the page background so it carves a wavy
// contour out of the emerald band. `flip` mirrors it for the bottom edge (wavy
// top boundary instead of wavy bottom boundary). Built as one continuous path
// across many periods so there are no per-tile vertical seams on high-DPR mobile.
const EDGE_PERIOD_W = 40;
const EDGE_PERIOD_PX = 300; // rendered width of one period (matches the waveEdge keyframe)
// ~1500px: wider than any phone viewport (keeps the seam off-screen) while staying
// small enough to keep the animated layer's texture cheap. See WAVE_PERIODS note.
const EDGE_PERIODS = 5;
const EDGE_TILE_W = EDGE_PERIOD_PX * EDGE_PERIODS;

const edgeUrl = (fill: string, flip: boolean) => {
  // One relative period of the wavy boundary; chains seamlessly start-to-end.
  const period = flip
    ? ' c 6.66 4 13.33 4 20 0 c 6.66 -4 13.33 -4 20 0'
    : ' c 6.66 -4 13.33 -4 20 0 c 6.66 4 13.33 4 20 0';
  const close = flip ? ' V10 H0 Z' : ' V0 H0 Z';
  const d = 'M0 5' + period.repeat(EDGE_PERIODS) + close;
  return `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${EDGE_PERIOD_W * EDGE_PERIODS} 10" preserveAspectRatio="none"><path fill="${fill}" d="${d}"/></svg>`
  )}")`;
};

export const Marquee: React.FC = () => {
  const { theme } = useTheme();
  const c = colors[theme];

  const edgeBase: React.CSSProperties = {
    position: 'absolute',
    // Extend one period past both edges so the transform scroll (which runs in
    // both directions — the bottom edge is reversed) never exposes a gap.
    left: `-${EDGE_PERIOD_PX}px`,
    right: `-${EDGE_PERIOD_PX}px`,
    height: '13px',
    backgroundRepeat: 'repeat-x',
    backgroundSize: `${EDGE_TILE_W}px 13px`,
    zIndex: 2,
    pointerEvents: 'none',
  };

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: c.primary,
        overflow: 'hidden',
        padding: '1.35rem 0',
        marginTop: '2.0rem',
      }}
    >
      {/* Wave layer 1 — primary scroll (transform-driven, compositor-only) */}
      <div style={{ ...waveLayerBase, animation: 'waveScroll 6s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite' }} />
      {/* Wave layer 2 — offset for depth, scroll + swell combined into one transform */}
      <div style={{ ...waveLayerBase, backgroundSize: `${WAVE_TILE_W}px 80%`, opacity: 0.7, animation: 'waveScrollSwell 6s cubic-bezier(0.36, 0.45, 0.63, 0.53) -1.25s infinite' }} />

      {/* Wavy top edge */}
      <div
        style={{
          ...edgeBase,
          top: 0,
          backgroundImage: edgeUrl(c.background, false),
          animation: 'edgeScroll 5s linear infinite',
        }}
      />
      {/* Wavy bottom edge */}
      <div
        style={{
          ...edgeBase,
          bottom: 0,
          backgroundImage: edgeUrl(c.background, true),
          animation: 'edgeScroll 5s linear infinite reverse',
        }}
      />

      {/* Scrolling content sits above wave layers */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'inline-flex',
          animation: 'marquee 28s linear infinite',
          willChange: 'transform',
        }}
      >
        <Inner />
        <Inner />
      </div>
    </div>
  );
};
