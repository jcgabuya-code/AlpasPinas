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

const WAVE_URL = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 174.47 46.35">' +
  '<path fill="white" fill-opacity="0.18" d="m 0,11.38448 c 0,0 21.133851,11.39531 43.617661,11.38441 C 66.101471,22.75799 107.96856,0.03262 130.508,7e-5 c 22.53944,-0.0325 43.96264,11.38441 43.96264,11.38441 V 46.34594 H 0 Z"/>' +
  '</svg>'
)}")`;

const waveLayerBase: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  // Same height as the strip, but shifted down so the wave sits lower.
  // overflow:hidden on the container clips the part that drops below.
  top: '34px',
  bottom: '-34px',
  backgroundImage: WAVE_URL,
  backgroundRepeat: 'repeat-x',
  backgroundSize: '175px 100%',
  backgroundPosition: 'bottom',
};

// Tileable wave-shaped edge divider, filled with the page background so it
// carves a wavy contour out of the emerald band. `flip` mirrors it for the
// bottom edge (wavy top boundary instead of wavy bottom boundary).
const edgeUrl = (fill: string, flip: boolean) => {
  const wave = flip
    ? 'M0 5 C6.66 9 13.33 9 20 5 C26.66 1 33.33 1 40 5 V10 H0 Z'
    : 'M0 5 C6.66 1 13.33 1 20 5 C26.66 9 33.33 9 40 5 V0 H0 Z';
  return `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 10" preserveAspectRatio="none"><path fill="${fill}" d="${wave}"/></svg>`
  )}")`;
};

export const Marquee: React.FC = () => {
  const { theme } = useTheme();
  const c = colors[theme];

  const edgeBase: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '13px',
    backgroundRepeat: 'repeat-x',
    backgroundSize: '300px 13px',
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
      }}
    >
      {/* Wave layer 1 — primary scroll */}
      <div style={{ ...waveLayerBase, animation: 'wave 6s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite' }} />
      {/* Wave layer 2 — offset for depth */}
      <div style={{ ...waveLayerBase, backgroundSize: '175px 80%', opacity: 0.7, animation: 'wave 6s cubic-bezier(0.36, 0.45, 0.63, 0.53) -1.25s infinite, swell 6s ease -1.25s infinite' }} />

      {/* Wavy top edge */}
      <div
        style={{
          ...edgeBase,
          top: 0,
          backgroundImage: edgeUrl(c.background, false),
          animation: 'waveEdge 5s linear infinite',
        }}
      />
      {/* Wavy bottom edge */}
      <div
        style={{
          ...edgeBase,
          bottom: 0,
          backgroundImage: edgeUrl(c.background, true),
          animation: 'waveEdge 5s linear infinite reverse',
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
