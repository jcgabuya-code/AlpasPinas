import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors, bandilaHero, type ColorPalette } from '../styles/colors';
import { VideoModal } from './VideoModal';
import eventsData from '../data/events.json';
import { isUpcoming, parseEventDate, type RaceEvent } from './EventCard';
import { useIsMobile } from '../hooks/useIsMobile';
import { HERO_OPTIONS, useHeroPick } from './HeroPicker';
import { LEGACY_LIGHT_HERO } from '../config/homeHero';
import { useContent } from '../context/SiteContentContext';


// Keyword tagline — echoes the team's identity, separated by emerald marks.
const KEYWORDS = ['SPEED', 'SYNC', 'STRENGTH'];

// Hand-drawn trophy — line-art to match the nav glyphs, with a ✦ sparkle in the cup
// echoing the SPEED ✦ SYNC ✦ STRENGTH motif.
const TrophyGlyph: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M7 4.5 H17 V7 A5 5 0 0 1 7 7 Z" />
    <path d="M7 5.5 H5 A2.2 2.2 0 0 0 7 9.3" />
    <path d="M17 5.5 H19 A2.2 2.2 0 0 1 17 9.3" />
    <path d="M12 12 V15" />
    <path d="M9.5 15 H14.5" />
    <path d="M10.5 15 L9 19.5" />
    <path d="M13.5 15 L15 19.5" />
    <path d="M8.5 19.5 H15.5" />
    <path d="M12 5.9 L12.6 7.2 L14 7.6 L12.6 8 L12 9.3 L11.4 8 L10 7.6 L11.4 7.2 Z" fill="currentColor" stroke="none" />
  </svg>
);

// Tileable fractal-noise grain (SVG data URI) — laid over the photo at low
// opacity for a cinematic film texture that also masks photo compression.
const GRAIN_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";


const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
};

const ArrowGlyph: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

// WhatsApp mark — the "Book a Session" CTA messages the crew, so it carries the
// recognizable WhatsApp glyph + green, matching the Home v2 reference.
export const WhatsAppGlyph: React.FC<{ size?: number; color?: string }> = ({ size = 22, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 1.8c2.16 0 4.19.84 5.72 2.37a8.06 8.06 0 0 1 2.37 5.72c0 4.46-3.63 8.09-8.1 8.09a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.07.81.82-3-.19-.31a8.05 8.05 0 0 1-1.24-4.3c0-4.46 3.63-8.09 8.1-8.09zm-3.04 4.3c-.14 0-.37.05-.57.27-.2.22-.75.74-.75 1.8s.77 2.09.88 2.23c.11.14 1.51 2.31 3.67 3.24.51.22.91.35 1.22.45.51.16.98.14 1.35.08.41-.06 1.27-.52 1.45-1.02.18-.5.18-.93.13-1.02-.05-.09-.2-.14-.41-.25-.21-.11-1.27-.63-1.46-.7-.2-.07-.34-.11-.48.11-.14.22-.55.7-.68.84-.12.14-.25.16-.46.05-.21-.11-.9-.33-1.71-1.06-.63-.56-1.06-1.26-1.18-1.47-.12-.22-.01-.33.1-.44.1-.1.21-.25.32-.38.11-.12.14-.21.21-.36.07-.14.04-.27-.02-.38-.05-.11-.48-1.18-.66-1.61-.17-.42-.35-.36-.48-.37l-.41-.01z" />
  </svg>
);

// YouTube play badge — the "Watch Race" CTA, red to read as "watch the highlight reel".
export const YouTubeGlyph: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.82.42A2.5 2.5 0 0 0 2.42 7.19 26 26 0 0 0 2 12a26 26 0 0 0 .42 4.81 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.42-4.81zM10 15V9l5.2 3-5.2 3z" />
  </svg>
);

// Instagram mark — line-art camera outline (matches the site's existing icon
// system, e.g. Contact.tsx's InstagramIcon), rendered white for a colored bubble.
export const InstagramGlyph: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="3.8" />
    <circle cx="17" cy="7" r="0.9" fill="#fff" stroke="none" />
  </svg>
);

// Facebook mark — the classic "f" glyph, filled white for a colored bubble.
export const FacebookGlyph: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
    <path d="M13.5 21v-7.2h2.4l.36-2.8h-2.76V9.1c0-.81.22-1.36 1.39-1.36h1.48V5.2A20 20 0 0 0 14.3 5c-2.15 0-3.62 1.31-3.62 3.72v2.28H8.25v2.8h2.43V21h2.82z" />
  </svg>
);

// Next-race badge styled as a tear-off race ticket: a tinted icon "stub", a dashed
// perforation, then the event details — the whole thing a link to the join section.
// Shared by the wide Hero (over the right photo) and mobile HeroPhoto (full-width).
export const NextRaceTicket: React.FC<{
  event: RaceEvent;
  c: ColorPalette;
  isDark: boolean;
  compact?: boolean;
}> = ({ event, c, isDark, compact = false }) => {
  const [hover, setHover] = useState(false);
  const glassBg = isDark ? 'rgba(6,10,14,0.66)' : 'rgba(255,255,255,0.74)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.68)';
  const stubBg = isDark ? `${c.accent}3a` : `${c.primary}24`;
  const accent = isDark ? c.accent : c.primary;
  const perfColor = isDark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.18)';
  const actionLabel = compact ? 'Reserve spot' : 'Reserve your seat';

  // Punched tear-line notches: a fixed-width stub means the perforation sits at a
  // known x, so two radial-gradient mask circles cut real half-holes (top + bottom)
  // straight through the frosted glass — the photo shows through, like a torn ticket.
  const stubW = compact ? 42 : 48;
  const notchR = compact ? 4 : 5;
  const notch = (y: string) =>
    `radial-gradient(circle ${notchR}px at ${stubW}px ${y}, transparent ${notchR}px, #000 ${notchR + 0.5}px)`;
  const maskImage = `${notch('0')}, ${notch('100%')}`;

  return (
    <Link
      to="/join-team"
      aria-label={`${actionLabel} for ${event.name}`}
      title={`${actionLabel} for ${event.name}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: compact ? 'flex' : 'inline-flex',
        alignItems: 'stretch',
        textDecoration: 'none',
        maxWidth: compact ? '100%' : '480px',
        background: glassBg,
        backdropFilter: 'blur(20px) saturate(135%)',
        WebkitBackdropFilter: 'blur(20px) saturate(135%)',
        border: `1px solid ${glassBorder}`,
        borderRadius: compact ? '0.8rem' : '0.95rem',
        overflow: 'hidden',
        boxShadow: hover ? '0 16px 44px rgba(0,0,0,0.42)' : '0 10px 30px rgba(0,0,0,0.32)',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        WebkitMaskImage: maskImage,
        maskImage,
        WebkitMaskComposite: 'source-in',
        maskComposite: 'intersect',
      }}
    >
      {/* Stub — tinted icon zone, the tear-off end of the ticket. Fixed width so the
          perforation + punched notches align to its right edge. */}
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: stubW,
          background: stubBg,
          color: accent,
          flexShrink: 0,
        }}
      >
        <TrophyGlyph size={compact ? 20 : 24} />
      </span>

      {/* Perforation — dashed tear line */}
      <span
        aria-hidden="true"
        style={{ width: 0, borderLeft: `1.5px dashed ${perfColor}`, alignSelf: 'stretch', margin: '0.4rem 0' }}
      />

      {/* Body — eyebrow + race name + date/location */}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '0.1rem',
          padding: compact ? '0.5rem 0.85rem' : '0.55rem 1.05rem',
        }}
      >
        <span style={{ fontSize: compact ? '0.56rem' : '0.6rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: accent }}>
          Next Race · Join Us
        </span>
        <span
          style={{
            fontSize: compact ? '0.8rem' : '0.92rem',
            fontWeight: 600,
            color: c.text,
            lineHeight: 1.2,
            whiteSpace: compact ? 'normal' : 'nowrap',
            overflow: 'hidden',
            textOverflow: compact ? 'clip' : 'ellipsis',
            display: compact ? '-webkit-box' : 'block',
            WebkitLineClamp: compact ? 2 : 'unset',
            WebkitBoxOrient: compact ? 'vertical' : 'initial',
          }}
        >
          {event.name}
        </span>
        <span style={{ fontSize: compact ? '0.64rem' : '0.74rem', color: c.textSecondary, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {parseEventDate(event.date).toLocaleDateString(undefined, DATE_FORMAT)} · {event.location}
        </span>
      </span>

      {/* Arrow affordance — nudges right on hover */}
      <span
        aria-hidden="true"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: compact ? 'center' : 'flex-end',
          justifyContent: 'center',
          gap: '0.18rem',
          paddingRight: compact ? '0.55rem' : '0.95rem',
          paddingLeft: compact ? '0.1rem' : '0.35rem',
          color: accent,
          flexShrink: 0,
          transform: hover ? 'translateX(3px)' : 'translateX(0)',
          transition: 'transform 0.2s ease',
        }}
      >
        {!compact && (
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Reserve Seat
          </span>
        )}
        <ArrowGlyph size={compact ? 15 : 16} />
      </span>
    </Link>
  );
};

// Photos for the mobile HeroPhoto slider. Add more entries here to extend the carousel.
const HERO_PHOTOS = [
  { src: HERO_OPTIONS[0].src, alt: 'AlpasPinas Dragonboat Team — paddlers with team flag at the beach', objectPosition: '60% 24%' },
  { src: '/team-2.jpg', alt: 'AlpasPinas Dragonboat Team', objectPosition: 'center 50%' },
];

// Stacked headline lines for the mobile hero — two paddle catches that stroke in a
// beat apart. "AWAY" carries the accent + wake underline.
const HEADLINE_LINES = [
  { text: 'BREAK', accent: false },
  { text: 'AWAY', accent: true },
];

export const Hero: React.FC = () => {
  const { mode, brand } = useTheme();
  // The hero is dark in both modes (dark page or light page) — light mode is a dark
  // hero over a light page. The original light hero is stashed behind LEGACY_LIGHT_HERO.
  const heroMode = LEGACY_LIGHT_HERO && mode === 'light' ? 'light' : 'dark';
  const c = colors[brand][heroMode];
  const isDark = heroMode === 'dark';
  const isMobile = useIsMobile();
  const [videoOpen, setVideoOpen] = useState(false);
  const [heroPick] = useHeroPick();
  const heroPhoto = HERO_OPTIONS[heroPick];
  const heroIntro = useContent(
    'hero.intro',
    'Start with a weekend session. No experience needed, all gear provided, and a crew that will get you on the water fast.',
  );

  // Theme-aware surface — the hero is dark-forward but honors light mode and the
  // ocean/bandila brands by reading every color from the active palette. The panel
  // intentionally matches Layout's c.background so the transparent merged nav above
  // it blends seamlessly into this stage.
  const panelRgb = isDark ? '11, 16, 20' : '247, 250, 248';
  const panel = `rgb(${panelRgb})`;

  // Scrim tint — dark washes the copy column near-black; light washes it a cool
  // off-white (matches the Alpas Hero design spec, rgb(233,241,240)).
  const scrimRgb = isDark ? panelRgb : '233, 241, 240';

  // Left-weighted legibility scrim over the photo. Dark blends into the water as a
  // vignette; light lays a stronger off-white column (per the design spec) that fades
  // to clear photo by ~66%.
  const heroScrim = isDark
    ? `linear-gradient(96deg, rgba(${scrimRgb},0.92) 0%, rgba(${scrimRgb},0.8) 22%, rgba(${scrimRgb},0.3) 42%, rgba(${scrimRgb},0.05) 55%, rgba(${scrimRgb},0) 70%)`
    : `linear-gradient(90deg, rgba(${scrimRgb},0.96) 0%, rgba(${scrimRgb},0.82) 26%, rgba(${scrimRgb},0.4) 48%, rgba(${scrimRgb},0) 66%)`;
  // Light-mode copy sits over a busier, brighter photo — a faint halo keeps it legible.
  const heroTextHalo = isDark ? undefined : `0 1px 12px rgba(${scrimRgb},0.72)`;
  const heroTopFade = `linear-gradient(180deg, rgba(${scrimRgb},${isDark ? 0.6 : 0.5}), transparent)`;

  // Alpas Hero spec accents for light mode — the bandila brand gets a brighter blue
  // that harmonizes with the water + a signature flag red; other brands fall back to
  // their own palette (the dark theme always keeps the app's own accent).
  const specBlue = brand === 'bandila' ? bandilaHero.blue : c.primary;
  const specRed = brand === 'bandila' ? bandilaHero.red : c.sun;

  const heroText = c.text;
  const heroSub = isDark ? 'rgba(245, 247, 245, 0.82)' : c.textSecondary;
  const heroAccent = isDark ? c.accent : specBlue;
  
  const chipBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.7)';
  const chipBorder = isDark ? 'rgba(255, 255, 255, 0.16)' : c.border;

  const nextEvent = useMemo(() => {
    const upcoming = (eventsData as RaceEvent[])
      .filter((e) => isUpcoming(e.date))
      .sort((a, b) => parseEventDate(a.date).getTime() - parseEventDate(b.date).getTime());
    return upcoming[0] ?? null;
  }, []);

  // ── Shared trailing blocks (identical on mobile + desktop; sizing keys off
  //    isMobile). Kept as locals so both layouts stay in lockstep. ───────────────
  const cadenceRow = (delay: string) => (
    <div className="stroke-in" style={{ marginTop: isMobile ? '1.1rem' : '1.25rem', animationDelay: delay }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem 1rem' }}>
        {KEYWORDS.map((word, i) => (
          <span key={word} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Cadence beat-tick — amber dot pulsing in sequence like a drummer's count. */}
            <span
              aria-hidden="true"
              className="cadence-beat"
              style={{
                width: isMobile ? '6px' : '7px',
                height: isMobile ? '6px' : '7px',
                borderRadius: '999px',
                backgroundColor: c.sun,
                flexShrink: 0,
                animationDelay: `${i * 0.18}s`,
              }}
            />
            <span
              style={{
                color: heroText,
                fontSize: isMobile ? '0.64rem' : '0.76rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
              }}
            >
              {word}
            </span>
          </span>
        ))}
      </div>
    </div>
  );

  const paragraph = (delay: string) => (
    <p
      className="stroke-in"
      style={{
        fontSize: isMobile ? '0.76rem' : '0.84rem',
        color: heroSub,
        margin: isMobile ? '0.9rem 0 1.25rem' : '1rem 0 1.4rem',
        maxWidth: '440px',
        lineHeight: 1.42,
        animationDelay: delay,
        textShadow: isMobile ? undefined : heroTextHalo,
      }}
    >
      {heroIntro}
    </p>
  );

  const ctaRow = (delay: string) => (
    <div
      className="stroke-in"
      style={{ display: 'flex', gap: isMobile ? '0.5rem' : '0.75rem', flexWrap: 'nowrap', marginBottom: isMobile ? '1.45rem' : '2.1rem', animationDelay: delay }}
    >
      {isDark ? (
        <>
          {/* Book a Session — messages the crew (WhatsApp green) */}
          <Link
            to="/join-team"
            aria-label="Book your first session"
            style={{
              background: 'linear-gradient(135deg, #1faa4d, #25D366)',
              color: '#fff',
              padding: isMobile ? '0.72rem 0.9rem' : '0.72rem 1.45rem',
              borderRadius: '999px',
              fontWeight: 800,
              textDecoration: 'none',
              fontSize: isMobile ? '0.66rem' : '0.86rem',
              letterSpacing: '0.01em',
              boxShadow: '0 12px 30px rgba(37,211,102,0.4)',
              whiteSpace: 'nowrap',
              flex: isMobile ? '1 1 0' : '0 0 auto',
              minWidth: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? '0.45rem' : '0.55rem',
            }}
          >
            <WhatsAppGlyph size={isMobile ? 30 : 34} />
            Book a Session
          </Link>
          {/* Watch Race — opens the highlight reel (YouTube red) */}
          <button
            type="button"
            onClick={() => setVideoOpen(true)}
            aria-label="Watch race highlights"
            style={{
              background: '#FF0000',
              color: '#fff',
              padding: isMobile ? '0.72rem 0.9rem' : '0.72rem 1.3rem',
              borderRadius: '999px',
              fontWeight: 800,
              fontSize: isMobile ? '0.66rem' : '0.86rem',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 12px 30px rgba(255,0,0,0.34)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: isMobile ? '0.4rem' : '0.5rem',
              fontFamily: 'inherit',
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
              flex: isMobile ? '1 1 0' : '0 0 auto',
              minWidth: 0,
              justifyContent: 'center',
            }}
          >
            <YouTubeGlyph size={isMobile ? 30 : 36} />
            Watch Race
          </button>
        </>
      ) : (
        <>
          {/* Light mode (Alpas Hero spec): blue-filled primary that harmonizes with the
              water, WhatsApp mark tucked into a small green badge. */}
          <Link
            to="/join-team"
            aria-label="Book your first session"
            style={{
              background: specBlue,
              color: '#fff',
              padding: isMobile ? '0.72rem 0.9rem' : '0.72rem 1.45rem',
              borderRadius: '999px',
              fontWeight: 800,
              textDecoration: 'none',
              fontSize: isMobile ? '0.66rem' : '0.86rem',
              letterSpacing: '0.01em',
              boxShadow: `0 10px 28px ${specBlue}55`,
              whiteSpace: 'nowrap',
              flex: isMobile ? '1 1 0' : '0 0 auto',
              minWidth: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? '0.5rem' : '0.6rem',
            }}
          >
            <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#25d366', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <WhatsAppGlyph size={15} />
            </span>
            Book a Session
          </Link>
          {/* Ghost/outline secondary, play mark in a small red badge. */}
          <button
            type="button"
            onClick={() => setVideoOpen(true)}
            aria-label="Watch race highlights"
            style={{
              background: 'transparent',
              color: c.text,
              padding: isMobile ? '0.72rem 0.9rem' : '0.72rem 1.3rem',
              borderRadius: '999px',
              fontWeight: 800,
              fontSize: isMobile ? '0.66rem' : '0.86rem',
              border: '1.5px solid rgba(11,31,30,0.28)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: isMobile ? '0.5rem' : '0.6rem',
              fontFamily: 'inherit',
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
              flex: isMobile ? '1 1 0' : '0 0 auto',
              minWidth: 0,
              justifyContent: 'center',
            }}
          >
            <span style={{ width: 30, height: 22, borderRadius: 6, background: '#ff0000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
            </span>
            Watch Race
          </button>
        </>
      )}
    </div>
  );

  // ── Mobile: text-only kinetic stack (the standalone HeroPhoto carousel carries
  //    the imagery below the marquee). The nav above keeps its compact logo, so no
  //    wordmark is repeated here. ────────────────────────────────────────────────
  if (isMobile) {
    return (
      <section
        id="home"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: panel,
          padding: '2.15rem 1.25rem 2.1rem',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `radial-gradient(120% 95% at 86% 6%, ${c.primary}${isDark ? '24' : '14'}, transparent 58%)`,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: GRAIN_URI,
            backgroundRepeat: 'repeat',
            opacity: isDark ? 0.05 : 0.035,
            mixBlendMode: isDark ? 'overlay' : 'multiply',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="stroke-in" style={{ marginBottom: '1.1rem', animationDelay: '0.04s' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '0.4rem 0.9rem',
                borderRadius: '999px',
                border: `1px solid ${chipBorder}`,
                backgroundColor: chipBg,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                color: heroText,
                fontSize: '0.46rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Filipino Dragon Boat Team · Malaysia
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(3.2rem, 17.6vw, 4.8rem)',
              fontWeight: 400,
              color: heroText,
              margin: 0,
              lineHeight: 0.84,
              letterSpacing: '0.005em',
              textShadow: isDark ? '0 2px 30px rgba(0,0,0,0.35)' : 'none',
            }}
          >
            {HEADLINE_LINES.map((line, i) => (
              <span
                key={line.text}
                className="stroke-in"
                style={{
                  display: 'block',
                  position: 'relative',
                  width: 'fit-content',
                  color: line.accent ? heroAccent : heroText,
                  animationDelay: `${0.16 + i * 0.26}s`,
                }}
              >
                {line.text}
                {line.accent && (
                  <span
                    aria-hidden="true"
                    className="wake-underline"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: '0.04em',
                      height: '0.07em',
                      borderRadius: '999px',
                      background: isDark
                        ? `linear-gradient(90deg, ${c.accent}, ${c.sun})`
                        : `linear-gradient(90deg, ${specBlue}, ${specRed})`,
                    }}
                  />
                )}
              </span>
            ))}
          </h1>

          <p
            className="stroke-in"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.28rem',
              fontWeight: 400,
              color: heroAccent,
              margin: '0.65rem 0 0',
              letterSpacing: '0.02em',
              lineHeight: 1,
              animationDelay: '0.46s',
            }}
          >
            on every stroke.
          </p>

          {cadenceRow('0.56s')}
          {paragraph('0.64s')}
          {ctaRow('0.72s')}
        </div>

        <VideoModal
          open={videoOpen}
          onClose={() => setVideoOpen(false)}
          src="/race-highlight.mp4"
          poster="/race-poster.jpg"
          title="AlpasPinas race highlight"
        />
      </section>
    );
  }

  // ── Desktop: full-bleed scenic stage with the masthead text anchored bottom-left,
  //    matching the Home v2 reference. The image is the stage; a left-weighted scrim
  //    keeps the type legible while the right side opens up to the photo.
  return (
    <section
      id="home"
      style={{
        position: 'relative',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'flex-end',
        overflow: 'hidden',
        backgroundColor: panel,
      }}
    >
      {/* Full-bleed scenic background. The image is the stage, not a side panel. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          background: panel,
        }}
      >
        <img
          src={heroPhoto.src}
          alt="AlpasPinas crew paddling across a mountain lake"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: heroPhoto.objectPosition,
            display: 'block',
          }}
        />
        {/* Left-weighted scrim — keeps the type readable, fades to clear photo at right */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: heroScrim,
          }}
        />
        {/* Top fade — grounds the transparent nav over the photo */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: '170px',
            pointerEvents: 'none',
            background: heroTopFade,
          }}
        />
        {/* Bottom fade — anchors the bottom-left masthead + bottom-right ticket so the
            type never floats over a bright patch of water. */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '46%',
            pointerEvents: 'none',
            background: `linear-gradient(0deg, rgba(${scrimRgb},${isDark ? 0.72 : 0.5}) 0%, rgba(${scrimRgb},0) 100%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: GRAIN_URI,
            backgroundRepeat: 'repeat',
            opacity: 0.06,
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Next-race ticket — bottom-right, over the photo */}
      {nextEvent && (
        <div style={{ position: 'absolute', zIndex: 2, bottom: 'clamp(2rem, 6vh, 3.4rem)', right: 'clamp(1.5rem, 4vw, 3.5rem)', width: 'min(380px, 34vw)' }}>
          <NextRaceTicket event={nextEvent} c={c} isDark={isDark} compact />
        </div>
      )}

      {/* Type column — anchored bottom-left, aligned to the nav's 1280 container */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 clamp(1.5rem, 4vw, 3.5rem) clamp(2.5rem, 6vh, 3.4rem)',
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          {/* Eyebrow label with a leading cadence beat */}
          <div className="stroke-in" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', animationDelay: '0.04s' }}>
            <span
              aria-hidden="true"
              className="cadence-beat"
              style={{ width: '8px', height: '8px', borderRadius: '999px', backgroundColor: c.sun, flexShrink: 0 }}
            />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: heroSub, textShadow: heroTextHalo }}>
              Filipino Dragon Boat Team · Malaysia
            </span>
          </div>

          {/* BREAK / AWAY masthead — AWAY carries the accent + wake underline */}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(3.6rem, 8.2vw, 7.4rem)',
              fontWeight: 400,
              color: heroText,
              margin: 0,
              lineHeight: 0.84,
              letterSpacing: '0.01em',
              textShadow: isDark ? '0 2px 30px rgba(0,0,0,0.35)' : 'none',
            }}
          >
            {HEADLINE_LINES.map((line, i) => (
              <span
                key={line.text}
                className="stroke-in"
                style={{
                  display: 'block',
                  position: 'relative',
                  width: 'fit-content',
                  color: line.accent ? heroAccent : heroText,
                  animationDelay: `${0.14 + i * 0.16}s`,
                }}
              >
                {line.text}
                {line.accent && (
                  <span
                    aria-hidden="true"
                    className="wake-underline"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: '-0.12em',
                      height: '0.055em',
                      borderRadius: '999px',
                      background: isDark
                        ? `linear-gradient(90deg, ${c.accent}, ${c.sun})`
                        : `linear-gradient(90deg, ${specBlue}, ${specRed})`,
                    }}
                  />
                )}
              </span>
            ))}
          </h1>

          {/* "— ON EVERY STROKE." — the signature line, set as a display kicker */}
          <div
            className="stroke-in"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.2rem, 1.9vw, 1.62rem)',
              fontWeight: 400,
              letterSpacing: '0.03em',
              color: heroText,
              marginTop: '1.1rem',
              animationDelay: '0.46s',
            }}
          >
            — ON EVERY STROKE.
          </div>

          {paragraph('0.54s')}
          {ctaRow('0.62s')}
        </div>
      </div>

      <VideoModal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        src="/race-highlight.mp4"
        poster="/race-poster.jpg"
        title="AlpasPinas race highlight"
      />
    </section>
  );
};

// Full-screen team photo section — on mobile this renders after the Hero + Marquee
// (its own scroll "page"), with the next-race badge frosted-overlaid on the photo.
export const HeroPhoto: React.FC = () => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const isDark = theme === 'dark';
  const panelRgb = isDark ? '11, 16, 20' : '247, 250, 248';
  const [heroPick] = useHeroPick();

  const nextEvent = useMemo(() => {
    const upcoming = (eventsData as RaceEvent[])
      .filter((e) => isUpcoming(e.date))
      .sort((a, b) => parseEventDate(a.date).getTime() - parseEventDate(b.date).getTime());
    return upcoming[0] ?? null;
  }, []);

  // The lead slide mirrors the desktop hero pick so the team can compare candidates
  // on mobile too; the remaining slides carry the rest of the carousel.
  const photos = useMemo(() => {
    const [lead, ...rest] = HERO_PHOTOS;
    const chosen = HERO_OPTIONS[heroPick];
    return [{ ...lead, src: chosen.src, objectPosition: chosen.objectPosition }, ...rest];
  }, [heroPick]);

  // Photo slider state.
  const count = photos.length;
  const [index, setIndex] = useState(0);
  const go = (i: number) => setIndex(((i % count) + count) % count);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  // Auto-advance every 5s, unless the user prefers reduced motion.
  useEffect(() => {
    if (count < 2) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => window.clearInterval(id);
  }, [count]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 40) go(index + (touchDeltaX.current < 0 ? 1 : -1));
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  return (
    <section
      aria-label="AlpasPinas Dragonboat Team photos"
      aria-roledescription="carousel"
      style={{
        position: 'relative',
        width: '100%',
        height: '60vh',
        marginTop: '2rem',
        overflow: 'hidden',
        backgroundColor: `rgb(${panelRgb})`,
      }}
    >
      {/* Swipeable slider track — slides translate horizontally; reduce the section
          height to widen each photo's visible crop (4:3 sides crop less when shorter). */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          transform: `translateX(-${index * 100}%)`,
          transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {photos.map((p) => (
          // Frame clips the Ken Burns overscan so the zoom never bleeds into neighbours.
          <div key={p.src} style={{ flex: '0 0 100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
            <img
              src={p.src}
              alt={p.alt}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: p.objectPosition,
                display: 'block',
              }}
            />
          </div>
        ))}
      </div>

      {/* Subtle top/bottom vignettes — top for the nav, bottom for the badge + dots */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.44) 100%)',
        }}
      />
      {/* Film grain for cinematic texture */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: GRAIN_URI,
          backgroundRepeat: 'repeat',
          opacity: 0.07,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      />

      {/* Pagination dots */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: '1.1rem',
          zIndex: 3,
          display: 'flex',
          justifyContent: 'center',
          gap: '0.4rem',
        }}
      >
        {HERO_PHOTOS.map((p, i) => (
          <button
            key={p.src}
            type="button"
            aria-label={`Show photo ${i + 1}`}
            aria-current={i === index}
            onClick={() => go(i)}
            style={{
              width: '22px',
              height: '8px',
              padding: 0,
              border: 'none',
              borderRadius: '999px',
              cursor: 'pointer',
              background: i === index ? '#fff' : 'rgba(255,255,255,0.55)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              transform: i === index ? 'scaleX(1)' : 'scaleX(0.36)',
              transformOrigin: 'center',
              transition: 'transform 0.3s ease, background 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Next-race ticket — sits just above the dots */}
      {nextEvent && (
        <div style={{ position: 'absolute', zIndex: 2, left: '1.25rem', right: '1.25rem', bottom: '3.4rem' }}>
          <NextRaceTicket event={nextEvent} c={c} isDark={isDark} compact />
        </div>
      )}
    </section>
  );
};
