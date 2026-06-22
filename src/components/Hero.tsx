import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { colors, brandGradient } from '../styles/colors';
import { VideoModal } from './VideoModal';
import eventsData from '../data/events.json';
import { isUpcoming, parseEventDate, type RaceEvent } from './EventCard';
import { useIsMobile } from '../hooks/useIsMobile';

const STATS = [
  { value: '12+', label: 'Paddlers' },
  { value: '5 YRS', label: 'Racing' },
  { value: '#3', label: 'Regional Rank' },
];

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

// Photos for the mobile HeroPhoto slider. Add more entries here to extend the carousel.
const HERO_PHOTOS = [
  { src: '/team.jpg', alt: 'AlpasPinas Dragonboat Team — paddlers with team flag at the beach', objectPosition: 'center' },
  { src: '/team-2.jpg', alt: 'AlpasPinas Dragonboat Team', objectPosition: 'center 30%' },
];

export const Hero: React.FC = () => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const isDark = theme === 'dark';
  const isMobile = useIsMobile();
  const [videoOpen, setVideoOpen] = useState(false);

  // Theme-aware panel — the text side + gradient blend to this so light/dark stay aligned.
  const panelRgb = isDark ? '11, 16, 20' : '247, 250, 248';
  const panel = `rgb(${panelRgb})`;
  // Frosted chip surface that reads over both the panel and the photo, in both themes.
  const chipBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.7)';
  const chipBorder = isDark ? 'rgba(255,255,255,0.3)' : c.border;
  const hairline = isDark ? 'rgba(255,255,255,0.18)' : c.border;

  // Mobile now stacks a photo band above the text (like the wide split), so the
  // headline/CTAs/stats sit on the solid panel and use theme colors — only the race
  // pill overlaid on the photo needs over-image styling (handled inline).
  const onPhoto = false;
  const heroText = onPhoto ? '#fff' : c.text;
  const heroSub = onPhoto ? 'rgba(255,255,255,0.84)' : c.textSecondary;
  const heroAccent = onPhoto ? c.primaryLight : isDark ? c.primaryLight : c.primary;
  const heroHairline = onPhoto ? 'rgba(255,255,255,0.24)' : hairline;
  const heroChipBg = onPhoto ? 'rgba(255,255,255,0.14)' : chipBg;
  const heroChipBorder = onPhoto ? 'rgba(255,255,255,0.34)' : chipBorder;
  const heroTextShadow = onPhoto ? '0 1px 3px rgba(0,0,0,0.7), 0 2px 16px rgba(0,0,0,0.45)' : 'none';

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
        minHeight: isMobile ? 'auto' : '68dvh',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        overflow: 'hidden',
        backgroundColor: panel,
      }}
    >
      {/* Wide: team photo covers the right 55%, feathered into the panel at its left edge */}
      {!isMobile && (
        <img
          src="/team.jpg"
          alt="AlpasPinas Dragonboat Team — paddlers with team flag at the beach"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: '55%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            WebkitMaskImage:
              'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.35) 2%, rgba(0,0,0,0.8) 4%, #000 6%)',
            maskImage:
              'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.35) 2%, rgba(0,0,0,0.8) 4%, #000 6%)',
          }}
        />
      )}

      {/* Wide: top+bottom fade only — the left seam is feathered by the image's own mask */}
      {!isMobile && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(${panelRgb},1) 0%, rgba(${panelRgb},0) 6%, rgba(${panelRgb},0) 94%, rgba(${panelRgb},1) 100%)`,
          }}
        />
      )}

      {/* Next-race badge — overlaid on the photo (wide screens), frosted + seamless */}
      {!isMobile && nextEvent && (
        <div
          style={{
            position: 'absolute',
            zIndex: 2,
            bottom: '1.75rem',
            // Centered horizontally over the image (the right 55%): 45% + 55%/2
            left: '72.5%',
            right: 'auto',
            transform: 'translateX(-50%)',
            maxWidth: '520px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.95rem',
            background: isDark ? 'rgba(8,11,10,0.42)' : 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(20px) saturate(135%)',
            WebkitBackdropFilter: 'blur(20px) saturate(135%)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.55)'}`,
            borderRadius: '0.95rem',
            padding: '0.7rem 1.5rem 0.7rem 0.85rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.20)',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '999px',
              backgroundColor: isDark ? `${c.primary}26` : `${c.primary}1f`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? c.primaryLight : c.primary,
              flexShrink: 0,
            }}
          >
            <TrophyGlyph size={24} />
          </span>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: c.text, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
              Next race: {nextEvent.name}
            </div>
            <div style={{ fontSize: '0.74rem', color: c.textSecondary, marginTop: '0.15rem', whiteSpace: 'nowrap' }}>
              {parseEventDate(nextEvent.date).toLocaleDateString(undefined, DATE_FORMAT)} · {nextEvent.location}
            </div>
          </div>
        </div>
      )}

      {/* Content — phone: full-width column; wide: the left 40% text side */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: isMobile ? '100%' : '45%',
          marginRight: 'auto',
          padding: isMobile ? '2.75rem 1.25rem 2.75rem' : '1.5rem 2.5rem 1.5rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          // Mobile: natural top-down stack on the panel below the photo band.
          // Wide: cluster the whole group and center it so extra height becomes even
          // top/bottom margins instead of a dead gap.
          justifyContent: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? '1.5rem' : 'clamp(1.5rem, 4vh, 3rem)',
        }}
      >
        {/* Top row: identity badge. On mobile the logo lives in the merged-in nav above,
            so it's omitted here to avoid duplicating it; on wide screens it stays. */}
        <div
          className={isMobile ? 'hero-rise' : undefined}
          style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', animationDelay: '0.05s' }}
        >
          {!isMobile && (
            <div
              style={{
                width: '64px',
                height: '64px',
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
              border: `1px solid ${heroChipBorder}`,
              backgroundColor: heroChipBg,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: heroText,
              fontSize: isMobile ? '0.62rem' : '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Filipino Dragon Boat Team · Malaysia
          </span>
        </div>

        {/* Bottom: headline, tagline, CTAs, stats */}
        <div>
          {/* Headline */}
          <h1
            className={isMobile ? 'hero-rise' : undefined}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: isMobile ? 'clamp(3.25rem, 17vw, 5rem)' : 'clamp(2.5rem, 3.4vw + 1.4vh, 4.5rem)',
              fontWeight: 400,
              color: heroText,
              margin: 0,
              lineHeight: 0.9,
              letterSpacing: '0.01em',
              animationDelay: '0.18s',
              textShadow: onPhoto ? '0 1px 3px rgba(0,0,0,0.6), 0 2px 24px rgba(0,0,0,0.5)' : isDark ? '0 2px 30px rgba(0,0,0,0.35)' : 'none',
            }}
          >
            RULERS OF
            <br />
            THE{' '}
            {/* Signature: "WATER" carries a wake-line that traces left→right under it */}
            <span style={{ position: 'relative', display: 'inline-block', color: heroAccent }}>
              WATER
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
            </span>
          </h1>

          {/* Keyword tagline */}
          <div
            className={isMobile ? 'hero-rise' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.65rem',
              marginTop: isMobile ? '1.1rem' : '0.7rem',
              animationDelay: '0.30s',
            }}
          >
            {KEYWORDS.map((word, i) => (
              <React.Fragment key={word}>
                {/* Cadence beat-tick — amber dot that pulses in sequence like a
                    dragon-boat drummer's stroke count. Leads each word + repeats. */}
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
                    textShadow: heroTextShadow,
                  }}
                >
                  {word}
                </span>
              </React.Fragment>
            ))}
          </div>

          <p
            className={isMobile ? 'hero-rise' : undefined}
            style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              color: heroSub,
              margin: isMobile ? '1.1rem 0 1.6rem 0' : '0.7rem 0 1rem 0',
              maxWidth: '440px',
              lineHeight: 1.5,
              textShadow: heroTextShadow,
              animationDelay: '0.38s',
            }}
          >
            One stroke. One team. A community of paddlers chasing speed, sync, and
            the thrill of the finish line.
          </p>

          {/* CTAs */}
          <div
            className={isMobile ? 'hero-rise' : undefined}
            style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: isMobile ? '2rem' : '1rem', animationDelay: '0.46s' }}
          >
            <a
              href="#contact"
              style={{
                background: brandGradient(brand, theme),
                color: '#fff',
                padding: isMobile ? '0.9rem 1.4rem' : '1rem 1.9rem',
                borderRadius: '999px',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: isMobile ? '0.92rem' : '0.98rem',
                letterSpacing: '0.02em',
                boxShadow: `0 10px 30px ${c.primary}55`,
                whiteSpace: 'nowrap',
              }}
            >
              Contact Us →
            </a>
            <button
              type="button"
              onClick={() => setVideoOpen(true)}
              style={{
                backgroundColor: heroChipBg,
                color: heroText,
                padding: isMobile ? '0.9rem 1.25rem' : '1rem 1.7rem',
                borderRadius: '999px',
                fontWeight: 600,
                fontSize: isMobile ? '0.92rem' : '0.98rem',
                border: `1px solid ${heroChipBorder}`,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                fontFamily: 'inherit',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '1.5rem',
                  height: '1.5rem',
                  borderRadius: '999px',
                  background: brandGradient(brand, theme),
                  color: '#fff',
                  paddingLeft: '1px',
                }}
              >
                <PlayGlyph size={11} />
              </span>
              Watch Us Race
            </button>
          </div>

          {/* Stats strip */}
          <div
            className={isMobile ? 'hero-rise' : undefined}
            style={{
              display: 'flex',
              alignItems: 'stretch',
              borderTop: `1px solid ${heroHairline}`,
              paddingTop: isMobile ? '1.25rem' : '0.9rem',
              animationDelay: '0.54s',
            }}
          >
            {STATS.map((s, i) => (
              <div
                key={s.label}
                style={{
                  flex: 1,
                  paddingLeft: i === 0 ? 0 : isMobile ? '0.9rem' : '1.75rem',
                  borderLeft: i === 0 ? 'none' : `1px solid ${heroHairline}`,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: isMobile ? '1.5rem' : '1.75rem',
                    color: heroText,
                    letterSpacing: '0.02em',
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: isMobile ? '0.6rem' : '0.7rem',
                    color: heroSub,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginTop: '0.4rem',
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
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
              width: i === index ? '22px' : '8px',
              height: '8px',
              padding: 0,
              border: 'none',
              borderRadius: '999px',
              cursor: 'pointer',
              background: i === index ? '#fff' : 'rgba(255,255,255,0.55)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              transition: 'width 0.3s ease, background 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Next-race badge — sits just above the dots */}
      {nextEvent && (
        <div
          style={{
            position: 'absolute',
            zIndex: 2,
            left: '1.25rem',
            right: '1.25rem',
            bottom: '3.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.7rem',
            background: isDark ? 'rgba(8,11,10,0.5)' : 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(18px) saturate(135%)',
            WebkitBackdropFilter: 'blur(18px) saturate(135%)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.6)'}`,
            borderRadius: '0.85rem',
            padding: '0.55rem 1rem 0.55rem 0.6rem',
            boxShadow: '0 8px 26px rgba(0,0,0,0.22)',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '999px',
              backgroundColor: isDark ? `${c.primary}26` : `${c.primary}1f`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? c.primaryLight : c.primary,
              flexShrink: 0,
            }}
          >
            <TrophyGlyph size={20} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: c.text, lineHeight: 1.2 }}>
              Next race: {nextEvent.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: c.textSecondary, marginTop: '0.1rem' }}>
              {parseEventDate(nextEvent.date).toLocaleDateString(undefined, DATE_FORMAT)} · {nextEvent.location}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
