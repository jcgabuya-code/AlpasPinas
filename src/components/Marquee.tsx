import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';
import sponsorsData from '../data/sponsors.json';
import { useIsMobile } from '../hooks/useIsMobile';

const ITEMS = [
  'BEGINNER FRIENDLY',
  'WEEKEND WATER SESSIONS',
  'ALL GEAR PROVIDED',
  'PUTRAJAYA + SUBANG PARC',
  'RACE DAYS + CREW SOCIALS',
  'FILIPINO CREW IN MALAYSIA',
];

const MOBILE_ITEMS = [
  'BEGINNER FRIENDLY',
  'ALL GEAR PROVIDED',
  'WEEKEND WATER SESSIONS',
  'PUTRAJAYA + SUBANG PARC',
];

type Sponsor = { name: string; logo: string; url: string };
const SPONSORS = sponsorsData as Sponsor[];
const MARQUEE_SCALE = 0.8;

const WaveIcon: React.FC<{ delay: number }> = ({ delay }) => (
  <span
    className="wave-float"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      animationDelay: `${delay}s`,
    }}
  >
    {/* Hand-traced from thenounproject.com/icon/ocean-wave-7473753 */}
    <svg width="19" height="19" viewBox="0 0 40 42" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          d[i + 3] = 0;
        } else {
          d[i] = d[i + 1] = d[i + 2] = 255;
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
      <img src={src} alt="" style={{ width: '74px', height: '40px', objectFit: 'contain', opacity: 0.85 }} />
    </span>
  );
};

const Separator: React.FC<{ delay: number; compact?: boolean }> = ({ delay, compact = false }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: compact ? `${0.35 * MARQUEE_SCALE}rem` : `${0.5 * MARQUEE_SCALE}rem` }}>
    <WaveIcon delay={delay} />
    <DragonboatIcon />
    <WaveIcon delay={delay + 0.15} />
  </span>
);

// One wave period: starts and ends at the same height so periods chain seamlessly.
const WAVE_PERIOD_W = 174.47;
const WAVE_PERIOD_PX = 175;
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
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${WAVE_PERIOD_W * WAVE_PERIODS} 46.35' preserveAspectRatio='none'>` +
  `<path fill='white' fill-opacity='0.18' d='${WAVE_PATH_D}'/>` +
  '</svg>'
)}")`;

const WAVE_TILE_W = WAVE_PERIOD_PX * WAVE_PERIODS;

const waveLayerBase: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  right: `-${WAVE_PERIOD_PX}px`,
  top: `${34 * MARQUEE_SCALE}px`,
  bottom: `${-34 * MARQUEE_SCALE}px`,
  backgroundImage: WAVE_URL,
  backgroundRepeat: 'repeat-x',
  backgroundSize: `${WAVE_TILE_W}px 100%`,
  backgroundPosition: 'bottom',
};

// Sponsor credit shown inline in the rotation: a "SPONSORED BY" tag plus the
// sponsor on a white pill (so logos stay legible against the emerald band).
const SponsorItem: React.FC<{ sponsor: Sponsor }> = ({ sponsor }) => {
  const [hasLogo, setHasLogo] = useState(Boolean(sponsor.logo));
  const [hover, setHover] = useState(false);
  const isLink = Boolean(sponsor.url);

  const chip = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${0.6 * MARQUEE_SCALE}rem`,
        backgroundColor: '#fff',
        borderRadius: '999px',
        padding: hasLogo
          ? `${0.4 * MARQUEE_SCALE}rem ${1 * MARQUEE_SCALE}rem ${0.4 * MARQUEE_SCALE}rem ${0.5 * MARQUEE_SCALE}rem`
          : `${0.45 * MARQUEE_SCALE}rem ${1 * MARQUEE_SCALE}rem`,
        boxShadow: hover && isLink ? '0 6px 18px rgba(0,0,0,0.28)' : '0 1px 4px rgba(0,0,0,0.15)',
        transform: hover && isLink ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {hasLogo && (
        <img
          src={sponsor.logo}
          alt={sponsor.name}
          onError={() => setHasLogo(false)}
          style={{ height: `${28 * MARQUEE_SCALE}px`, width: 'auto', objectFit: 'contain', display: 'block' }}
        />
      )}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: `${0.9 * MARQUEE_SCALE}rem`,
          letterSpacing: '0.05em',
          color: '#1a1a1a',
        }}
      >
        {sponsor.name}
      </span>
    </span>
  );

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: `${0.85 * MARQUEE_SCALE}rem` }}>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: `${0.78 * MARQUEE_SCALE}rem`,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        Sponsored by
      </span>
      {isLink ? (
        <a
          href={sponsor.url}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{ textDecoration: 'none', cursor: 'pointer' }}
        >
          {chip}
        </a>
      ) : (
        chip
      )}
    </span>
  );
};

const Inner: React.FC<{
  accent: string;
  items: string[];
  compact?: boolean;
  showSponsors?: boolean;
}> = ({ accent, items, compact = false, showSponsors = true }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: compact ? `${1.05 * MARQUEE_SCALE}rem` : `${1.6 * MARQUEE_SCALE}rem`,
      paddingRight: compact ? `${1.05 * MARQUEE_SCALE}rem` : `${1.6 * MARQUEE_SCALE}rem`,
      whiteSpace: 'nowrap',
    }}
  >
    {items.flatMap((item, i) => [
      // Each phrase leads with an amber cadence beat — the same drummer's-count
      // signature the hero uses — tying the marquee into the page's rhythm.
      <span key={`item-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: compact ? `${0.45 * MARQUEE_SCALE}rem` : `${0.7 * MARQUEE_SCALE}rem` }}>
        <span
          aria-hidden="true"
          style={{
            width: compact ? `${5 * MARQUEE_SCALE}px` : `${6 * MARQUEE_SCALE}px`,
            height: compact ? `${5 * MARQUEE_SCALE}px` : `${6 * MARQUEE_SCALE}px`,
            borderRadius: '999px',
            backgroundColor: accent,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: compact ? `${0.84 * MARQUEE_SCALE}rem` : `${0.94 * MARQUEE_SCALE}rem`,
            letterSpacing: compact ? '0.13em' : '0.16em',
            color: '#fff',
          }}
        >
          {item}
        </span>
      </span>,
      <Separator key={`sep-${i}`} delay={i * 0.25} compact={compact} />,
    ])}
    {showSponsors &&
      SPONSORS.flatMap((sponsor, i) => [
        <SponsorItem key={`sponsor-${i}`} sponsor={sponsor} />,
        <Separator key={`sponsor-sep-${i}`} delay={i * 0.25} compact={compact} />,
      ])}
  </span>
);

export const Marquee: React.FC<{ connected?: boolean }> = ({ connected = false }) => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const isMobile = useIsMobile();
  // Band color — matches the hero's blue (the AWAY headline accent). The hero renders
  // from the dark palette in both modes, so the marquee reads the dark accent too.
  const heroBlue = colors[brand].dark.accent;

  // Honor prefers-reduced-motion — a perpetually scrolling band is a classic
  // vestibular trigger, so freeze the scroll + wave + edge animations for it.
  const [reduced, setReduced] = useState(false);
  // Pause the content scroll on hover so visitors can read + click sponsor links.
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const anim = (value: string) => (reduced ? 'none' : value);

  // Two scrolling copies — memoized so hover (pause) re-renders don't rebuild the
  // sponsor/item trees (each SponsorItem does canvas work on mount).
  const track = useMemo(
    () => (
      <>
        <Inner
          accent={c.sun}
          items={isMobile ? MOBILE_ITEMS : ITEMS}
          compact={isMobile}
          showSponsors={!isMobile}
        />
        <Inner
          accent={c.sun}
          items={isMobile ? MOBILE_ITEMS : ITEMS}
          compact={isMobile}
          showSponsors={!isMobile}
        />
      </>
    ),
    [c.sun, isMobile]
  );

  // Band-colored fade at each end so items dissolve in/out instead of hard-cutting.
  const fadeBase: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 'clamp(28px, 8vw, 80px)',
    zIndex: 1,
    pointerEvents: 'none',
  };

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        position: 'relative',
        zIndex: 1,
        backgroundColor: heroBlue,
        borderTop: `1px solid ${heroBlue}`,
        borderBottom: `1px solid ${heroBlue}`,
        overflow: 'hidden',
        padding: isMobile ? `${0.72 * MARQUEE_SCALE}rem 0` : `${0.92 * MARQUEE_SCALE}rem 0`,
        marginTop: connected ? (isMobile ? '-0.35rem' : '-0.9rem') : isMobile ? '1.25rem' : '2rem',
      }}
    >
      {/* Wave layer 1 — primary scroll (transform-driven, compositor-only) */}
      <div style={{ ...waveLayerBase, animation: anim('waveScroll 6s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite') }} />
      {/* Wave layer 2 — offset for depth, scroll + swell combined into one transform */}
      <div style={{ ...waveLayerBase, backgroundSize: `${WAVE_TILE_W}px 80%`, opacity: 0.7, animation: anim('waveScrollSwell 6s cubic-bezier(0.36, 0.45, 0.63, 0.53) -1.25s infinite') }} />

      {/* Scrolling content sits above wave layers */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'inline-flex',
          animation: anim(`marquee ${isMobile ? 20 : 28}s linear infinite`),
          animationPlayState: paused ? 'paused' : 'running',
          willChange: 'transform',
        }}
      >
        {track}
      </div>

      {/* Edge fades — band-colored, so items dissolve in/out at both ends */}
      <div style={{ ...fadeBase, left: 0, background: `linear-gradient(90deg, ${heroBlue} 0%, ${heroBlue}00 100%)` }} />
      <div style={{ ...fadeBase, right: 0, background: `linear-gradient(270deg, ${heroBlue} 0%, ${heroBlue}00 100%)` }} />
    </div>
  );
};
