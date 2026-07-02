// ⚠️ BACKUP — the "Kinetic stroke type" hero (BREAK / AWAY split + framed photo,
// standard nav). Frozen for rollback. To restore it, set HOME_HERO = 'kinetic' in
// src/config/homeHero.ts. The live hero is src/components/Hero.tsx.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { colors, brandGradient, type ColorPalette } from '../styles/colors';
import { contentMaxWidth } from '../styles/tokens';
import { VideoModal } from './VideoModal';
import eventsData from '../data/events.json';
import { isUpcoming, parseEventDate, type RaceEvent } from './EventCard';
import { useIsMobile } from '../hooks/useIsMobile';
import hero4Image from '../../images/hero-4.png';

// Split so the numeric part can count up on load while the prefix/suffix stay put
// — "#3" keeps its hash, "5 YRS" keeps its unit, "12+" keeps its plus.
const STATS = [
  { prefix: '', value: 12, suffix: '+', label: 'Crew Members' },
  { prefix: '', value: 5, suffix: ' YRS', label: 'Years Racing' },
  { prefix: '#', value: 3, suffix: '', label: 'Regional Ranking' },
];

// Count a number up from 0 to target with an easeOutCubic curve. Honors
// prefers-reduced-motion by jumping straight to the final value.
const useCountUp = (target: number, durationMs = 1100): number => {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setN(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return n;
};

const CountUp: React.FC<{ target: number }> = ({ target }) => <>{useCountUp(target)}</>;

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

// Filled play triangle — replaces the bare ▶ unicode glyph so the Watch CTA
// matches the line-art icon system used across the site.
const PlayGlyph: React.FC<{ size?: number }> = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5.5v13l10.5-6.5z" />
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

// Next-race badge styled as a tear-off race ticket: a tinted icon "stub", a dashed
// perforation, then the event details — the whole thing a link to the join section.
// Shared by the wide Hero (over the right photo) and mobile HeroPhoto (full-width).
const NextRaceTicket: React.FC<{
  event: RaceEvent;
  c: ColorPalette;
  isDark: boolean;
  compact?: boolean;
}> = ({ event, c, isDark, compact = false }) => {
  const [hover, setHover] = useState(false);
  const glassBg = isDark ? 'rgba(8,11,10,0.46)' : 'rgba(255,255,255,0.58)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.6)';
  const stubBg = isDark ? `${c.primary}3a` : `${c.primary}24`;
  const accent = isDark ? c.primaryLight : c.primary;
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
    <a
      href="#contact"
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
        boxShadow: hover ? '0 14px 40px rgba(0,0,0,0.30)' : '0 8px 28px rgba(0,0,0,0.20)',
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
    </a>
  );
};

// Photos for the mobile HeroPhoto slider. Add more entries here to extend the carousel.
const HERO_PHOTOS = [
  { src: hero4Image, alt: 'AlpasPinas Dragonboat Team — paddlers with team flag at the beach', objectPosition: '62% 34%' },
  { src: '/team-2.jpg', alt: 'AlpasPinas Dragonboat Team', objectPosition: 'center 30%' },
];

// Headline lines — two paddle catches that stroke in a beat apart. "AWAY" carries
// the accent + wake underline ("Alpas", the team name, means break free / breakaway).
const HEADLINE_LINES = [
  { text: 'BREAK', accent: false },
  { text: 'AWAY', accent: true },
];

export const Hero: React.FC = () => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const isDark = theme === 'dark';
  const isMobile = useIsMobile();
  const [videoOpen, setVideoOpen] = useState(false);

  // Theme-aware surface — the kinetic hero is dark-forward but honors light mode and
  // the ocean/bandila brands by reading every color from the active palette.
  const panelRgb = isDark ? '11, 16, 20' : '247, 250, 248';
  const panel = `rgb(${panelRgb})`;
  const heroText = c.text;
  // Body copy: on dark, textSecondary is borderline for AA, so wash bright ink at
  // 0.82 instead; on light the palette's own secondary already clears 4.5:1.
  const heroSub = isDark ? 'rgba(245, 247, 245, 0.82)' : c.textSecondary;
  const heroAccent = isDark ? c.primaryLight : c.primary;
  const hairline = isDark ? 'rgba(255, 255, 255, 0.14)' : c.border;
  const chipBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.7)';
  const chipBorder = isDark ? 'rgba(255, 255, 255, 0.16)' : c.border;

  const nextEvent = useMemo(() => {
    const upcoming = (eventsData as RaceEvent[])
      .filter((e) => isUpcoming(e.date))
      .sort((a, b) => parseEventDate(a.date).getTime() - parseEventDate(b.date).getTime());
    return upcoming[0] ?? null;
  }, []);

  return (
    <section
      id="home"
      style={{
        position: 'relative',
        minHeight: isMobile ? 'auto' : '84dvh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: panel,
      }}
    >
      {/* Ambient: a soft brand glow in the upper-right + faint film grain. On desktop,
          drifting wake streaks reinforce water motion behind the type without
          competing with it. All decorative + aria-hidden. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(120% 95% at 86% 6%, ${c.primary}${isDark ? '24' : '14'}, transparent 58%)`,
        }}
      />
      {!isMobile && (
        <div
          aria-hidden="true"
          className="wake-drift"
          style={{
            position: 'absolute',
            inset: '-12%',
            pointerEvents: 'none',
            opacity: isDark ? 0.06 : 0.05,
            backgroundImage: `repeating-linear-gradient(0deg, ${c.primaryLight} 0, ${c.primaryLight} 1.5px, transparent 1.5px, transparent 66px)`,
            WebkitMaskImage: 'radial-gradient(120% 75% at 26% 50%, #000, transparent 76%)',
            maskImage: 'radial-gradient(120% 75% at 26% 50%, #000, transparent 76%)',
          }}
        />
      )}
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

      {/* Content grid — desktop: type left, framed photo right. Mobile: type only (the
          standalone HeroPhoto carousel carries the imagery below the marquee). */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: contentMaxWidth,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.04fr 0.9fr',
          alignItems: 'center',
          gap: isMobile ? 0 : 'clamp(1.75rem, 4vw, 3.5rem)',
          padding: isMobile
            ? '2.15rem 1.25rem 2.1rem'
            : 'clamp(2.5rem, 6vh, 4.5rem) clamp(1.5rem, 4vw, 3rem)',
        }}
      >
        {/* LEFT — the type column */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Identity row — desktop pairs the logo with the chip; on mobile the chip
              stands alone (the logo lives in the merged-in nav above). */}
          <div
            className="stroke-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              marginBottom: isMobile ? '1.1rem' : '1.4rem',
              animationDelay: '0.04s',
            }}
          >
            {!isMobile && (
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: '999px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: `2px solid ${isDark ? 'rgba(255,255,255,0.5)' : c.border}`,
                  boxShadow: '0 8px 28px rgba(0,0,0,0.25)',
                }}
              >
                <img
                  src="/logo.jpg"
                  alt="AlpasPinas logo"
                  style={{ width: '130%', height: '130%', marginLeft: '-15%', marginTop: '-15%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            )}
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
                fontSize: isMobile ? '0.58rem' : '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Filipino Dragon Boat Team · Malaysia
            </span>
          </div>

          {/* Headline — BREAK / AWAY, each line a paddle catch that strokes in */}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: isMobile ? 'clamp(4rem, 22vw, 6rem)' : 'clamp(4.5rem, 9vw, 6rem)',
              fontWeight: 400,
              color: heroText,
              margin: 0,
              lineHeight: 0.82,
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
                      background: `linear-gradient(90deg, ${c.primary}, ${c.sun})`,
                    }}
                  />
                )}
              </span>
            ))}
          </h1>

          {/* Subline — pairs with the headline: "Break away — on every stroke." */}
          <p
            className="stroke-in"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: isMobile ? '1.6rem' : '1.9rem',
              fontWeight: 400,
              color: heroAccent,
              margin: isMobile ? '0.65rem 0 0' : '0.7rem 0 0',
              letterSpacing: '0.02em',
              lineHeight: 1,
              animationDelay: '0.46s',
            }}
          >
            on every stroke.
          </p>

          {/* Cadence readout — SPEED · SYNC · STRENGTH beats pulsing in sequence like a
              drummer's count. */}
          <div
            className="stroke-in"
            style={{ marginTop: isMobile ? '1.1rem' : '1.25rem', animationDelay: '0.56s' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem 1rem' }}>
              {KEYWORDS.map((word, i) => (
                <span key={word} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* Cadence beat-tick — amber dot that pulses in sequence like a
                      dragon-boat drummer's stroke count. */}
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
                      fontSize: isMobile ? '0.8rem' : '0.95rem',
                      fontWeight: 700,
                      letterSpacing: '0.18em',
                    }}
                  >
                    {word}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <p
            className="stroke-in"
            style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              color: heroSub,
              margin: isMobile ? '0.9rem 0 1.25rem' : '1rem 0 1.4rem',
              maxWidth: '440px',
              lineHeight: 1.42,
              animationDelay: '0.64s',
            }}
          >
            Start with a weekend session. No experience needed, all gear provided,
            and a crew that will get you on the water fast.
          </p>

          {/* CTAs — both sit on a single row at every width: trimmed labels + tighter
              sizing keep them on one line. */}
          <div
            className="stroke-in"
            style={{ display: 'flex', gap: isMobile ? '0.5rem' : '0.6rem', flexWrap: 'nowrap', marginBottom: isMobile ? '1.45rem' : '1.4rem', animationDelay: '0.72s' }}
          >
            <a
              href="#contact"
              aria-label="Book your first session"
              style={{
                background: brandGradient(brand, theme),
                color: '#fff',
                padding: isMobile ? '0.9rem 0.7rem' : '0.92rem 1.5rem',
                borderRadius: '999px',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: isMobile ? '0.82rem' : '0.92rem',
                letterSpacing: '0.02em',
                boxShadow: `0 10px 30px ${c.primary}55`,
                whiteSpace: 'nowrap',
                flex: isMobile ? '1 1 0' : '0 0 auto',
                minWidth: 0,
                textAlign: 'center',
              }}
            >
              Book a Session →
            </a>
            <button
              type="button"
              onClick={() => setVideoOpen(true)}
              aria-label="Watch race highlights"
              style={{
                backgroundColor: chipBg,
                color: heroText,
                padding: isMobile ? '0.9rem 0.7rem' : '0.92rem 1.4rem',
                borderRadius: '999px',
                fontWeight: 600,
                fontSize: isMobile ? '0.82rem' : '0.92rem',
                border: `1px solid ${chipBorder}`,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: isMobile ? '0.4rem' : '0.55rem',
                fontFamily: 'inherit',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                flex: isMobile ? '1 1 0' : '0 0 auto',
                minWidth: 0,
                justifyContent: 'center',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: isMobile ? '1.3rem' : '1.5rem',
                  height: isMobile ? '1.3rem' : '1.5rem',
                  borderRadius: '999px',
                  background: brandGradient(brand, theme),
                  color: '#fff',
                  paddingLeft: '1px',
                  flexShrink: 0,
                }}
              >
                <PlayGlyph size={isMobile ? 10 : 11} />
              </span>
              Watch Race
            </button>
          </div>

          {/* Stats strip */}
          <div
            className="stroke-in"
            style={{
              display: 'flex',
              alignItems: 'stretch',
              borderTop: `1px solid ${hairline}`,
              paddingTop: isMobile ? '1rem' : '0.9rem',
              maxWidth: isMobile ? 'none' : '440px',
              animationDelay: '0.8s',
            }}
          >
            {STATS.map((s, i) => (
              <div
                key={s.label}
                style={{
                  flex: 1,
                  paddingLeft: i === 0 ? 0 : isMobile ? '0.9rem' : '1.75rem',
                  borderLeft: i === 0 ? 'none' : `1px solid ${hairline}`,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: isMobile ? '1.38rem' : '1.75rem',
                    // Brand accent on the numerals (light end on dark, dark end on light
                    // so both stay AA) — gives the otherwise-flat stats strip a 2-tone
                    // hierarchy and reads as deliberate rather than placeholder.
                    color: isDark ? c.primaryLight : c.primaryDark,
                    letterSpacing: '0.02em',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {s.prefix}<CountUp target={s.value} />{s.suffix}
                </div>
                <div
                  style={{
                    fontSize: isMobile ? '0.64rem' : '0.7rem',
                    color: heroSub,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginTop: '0.34rem',
                    lineHeight: 1.25,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — framed photo inset (desktop only). The standalone HeroPhoto carousel
            handles imagery on mobile, so this column is skipped there. */}
        {!isMobile && (
          <div
            className="stroke-in"
            style={{
              position: 'relative',
              height: 'min(64dvh, 540px)',
              borderRadius: '1.1rem',
              overflow: 'hidden',
              border: `1px solid ${hairline}`,
              boxShadow: '0 24px 70px rgba(0,0,0,0.4)',
              animationDelay: '0.34s',
            }}
          >
            <img
              src={hero4Image}
              alt="AlpasPinas Dragonboat Team — paddlers with team flag at the beach"
              className="ken-burns"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '62% 34%', display: 'block' }}
            />
            {/* Film grain + edge vignette to seat the frame and the ticket */}
            <div
              aria-hidden="true"
              style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN_URI, backgroundRepeat: 'repeat', opacity: 0.07, mixBlendMode: 'overlay', pointerEvents: 'none' }}
            />
            <div
              aria-hidden="true"
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 24%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.5) 100%)' }}
            />
            {nextEvent && (
              <div style={{ position: 'absolute', zIndex: 2, left: '1rem', right: '1rem', bottom: '1rem' }}>
                <NextRaceTicket event={nextEvent} c={c} isDark={isDark} compact />
              </div>
            )}
          </div>
        )}
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

  const nextEvent = useMemo(() => {
    const upcoming = (eventsData as RaceEvent[])
      .filter((e) => isUpcoming(e.date))
      .sort((a, b) => parseEventDate(a.date).getTime() - parseEventDate(b.date).getTime());
    return upcoming[0] ?? null;
  }, []);

  // Photo slider state.
  const count = HERO_PHOTOS.length;
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
        {HERO_PHOTOS.map((p) => (
          // Frame clips the Ken Burns overscan so the zoom never bleeds into neighbours.
          <div key={p.src} style={{ flex: '0 0 100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
            <img
              src={p.src}
              alt={p.alt}
              className="ken-burns"
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
