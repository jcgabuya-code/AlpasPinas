import React, { useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { colors, emeraldGradient } from '../styles/colors';
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

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
};

export const Hero: React.FC = () => {
  const { theme } = useTheme();
  const c = colors[theme];
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
        minHeight: isMobile ? '62dvh' : '68dvh',
        display: 'flex',
        overflow: 'hidden',
        backgroundColor: panel,
      }}
    >
      {/* Team photo — phone: contained at top (whole crew); wide: covers the right 60% top-to-bottom */}
      <img
        src="/team.jpg"
        alt="AlpasPinas Dragonboat Team — paddlers with team flag at the beach"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          left: isMobile ? 0 : 'auto',
          width: isMobile ? '100%' : '55%',
          height: '100%',
          objectFit: isMobile ? 'contain' : 'cover',
          objectPosition: isMobile ? 'center top' : 'center',
          // Wide: feather the photo's own left edge to transparent so it dissolves
          // into the panel — a true alpha blend, no panel-color wash over the image.
          ...(isMobile
            ? {}
            : {
                WebkitMaskImage:
                  'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.35) 2%, rgba(0,0,0,0.8) 4%, #000 6%)',
                maskImage:
                  'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.35) 2%, rgba(0,0,0,0.8) 4%, #000 6%)',
              }),
        }}
      />

      {/* Gradient — blends the panel seamlessly into the photo. Phone: vertical; wide: at the 40/60 seam */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: isMobile
            ? `linear-gradient(180deg, rgba(${panelRgb},0.4) 0%, rgba(${panelRgb},0) 20%, rgba(${panelRgb},0) 38%, rgba(${panelRgb},0.65) 68%, rgba(${panelRgb},0.96) 100%)`
            : // top+bottom fade only — the left seam is feathered by the image's own mask
              `linear-gradient(180deg, rgba(${panelRgb},1) 0%, rgba(${panelRgb},0) 6%, rgba(${panelRgb},0) 94%, rgba(${panelRgb},1) 100%)`,
        }}
      />

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
          padding: isMobile ? '1.75rem 1.25rem 2rem' : '1.5rem 2.5rem 1.5rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: isMobile ? '2rem' : '1rem',
        }}
      >
        {/* Top row: logo + identity badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: isMobile ? '54px' : '64px',
              height: isMobile ? '54px' : '64px',
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
          <span
            style={{
              display: 'inline-block',
              padding: '0.4rem 0.9rem',
              borderRadius: '999px',
              border: `1px solid ${chipBorder}`,
              backgroundColor: chipBg,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: c.text,
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
          {/* Next-race pill — phone only; on wide screens it's overlaid on the photo (see below) */}
          {isMobile && nextEvent && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.85rem 0.4rem 0.45rem',
                borderRadius: '999px',
                backgroundColor: chipBg,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: `1px solid ${chipBorder}`,
                marginBottom: '1.1rem',
              }}
            >
              <span
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '999px',
                  background: emeraldGradient(theme),
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                }}
              >
                🏆
              </span>
              <span style={{ color: c.text, fontSize: '0.78rem', fontWeight: 600 }}>
                Next race: {nextEvent.name}
                <span style={{ color: c.textSecondary, fontWeight: 400 }}>
                  {' · '}
                  {parseEventDate(nextEvent.date).toLocaleDateString(undefined, DATE_FORMAT)}
                </span>
              </span>
            </div>
          )}

          {/* Headline */}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: isMobile ? 'clamp(3.25rem, 17vw, 5rem)' : 'clamp(2.5rem, 4vw, 4.25rem)',
              fontWeight: 400,
              color: c.text,
              margin: 0,
              lineHeight: 0.9,
              letterSpacing: '0.01em',
              textShadow: isDark ? '0 2px 30px rgba(0,0,0,0.35)' : 'none',
            }}
          >
            RULERS OF
            <br />
            THE{' '}
            <span style={{ color: isDark ? c.primaryLight : c.primary }}>
              WATER
            </span>
          </h1>

          {/* Keyword tagline */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.65rem',
              marginTop: isMobile ? '1.1rem' : '0.7rem',
            }}
          >
            {KEYWORDS.map((word, i) => (
              <React.Fragment key={word}>
                {i > 0 && (
                  <span aria-hidden="true" style={{ color: isDark ? c.primaryLight : c.primary, fontSize: '0.9rem' }}>
                    ✦
                  </span>
                )}
                <span
                  style={{
                    color: c.text,
                    fontSize: isMobile ? '0.8rem' : '0.95rem',
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                  }}
                >
                  {word}
                </span>
              </React.Fragment>
            ))}
          </div>

          <p
            style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              color: c.textSecondary,
              margin: isMobile ? '1.1rem 0 1.6rem 0' : '0.7rem 0 1rem 0',
              maxWidth: '440px',
              lineHeight: 1.5,
            }}
          >
            One stroke. One team. A community of paddlers chasing speed, sync, and
            the thrill of the finish line.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: isMobile ? '2rem' : '1rem' }}>
            <a
              href="#contact"
              style={{
                background: emeraldGradient(theme),
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
                backgroundColor: chipBg,
                color: c.text,
                padding: isMobile ? '0.9rem 1.25rem' : '1rem 1.7rem',
                borderRadius: '999px',
                fontWeight: 600,
                fontSize: isMobile ? '0.92rem' : '0.98rem',
                border: `1px solid ${chipBorder}`,
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
                  background: emeraldGradient(theme),
                  color: '#fff',
                  fontSize: '0.65rem',
                  paddingLeft: '2px',
                }}
              >
                ▶
              </span>
              Watch Us Race
            </button>
          </div>

          {/* Stats strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              borderTop: `1px solid ${hairline}`,
              paddingTop: isMobile ? '1.25rem' : '0.9rem',
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
                    fontSize: isMobile ? '1.5rem' : '1.75rem',
                    color: c.text,
                    letterSpacing: '0.02em',
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: isMobile ? '0.6rem' : '0.7rem',
                    color: c.textSecondary,
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
