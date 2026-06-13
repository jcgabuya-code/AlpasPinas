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
  const accentGradient = isDark
    ? `linear-gradient(135deg, ${c.primaryLight} 0%, ${c.accent} 100%)`
    : `linear-gradient(135deg, ${c.primary} 0%, ${c.primaryDark} 100%)`;

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
        minHeight: isMobile ? '80dvh' : '66vh',
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
          width: isMobile ? '100%' : '60%',
          height: '100%',
          objectFit: isMobile ? 'contain' : 'cover',
          objectPosition: isMobile ? 'center top' : 'center',
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
            : `linear-gradient(90deg, rgba(${panelRgb},1) 0%, rgba(${panelRgb},1) 32%, rgba(${panelRgb},0) 54%)`,
        }}
      />

      {/* Content — phone: full-width column; wide: the left 40% text side */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: isMobile ? '100%' : '40%',
          marginRight: 'auto',
          padding: isMobile ? '1.75rem 1.25rem 2rem' : '3rem 2.5rem 3rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '2rem',
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
          {/* Next-race pill */}
          {nextEvent && (
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
              fontSize: isMobile ? 'clamp(3.25rem, 17vw, 5rem)' : 'clamp(3.5rem, 6vw, 6rem)',
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
            <span
              style={{
                background: accentGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
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
              marginTop: '1.1rem',
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
              fontSize: isMobile ? '0.95rem' : '1.1rem',
              color: c.textSecondary,
              margin: '1.1rem 0 1.6rem 0',
              maxWidth: '440px',
              lineHeight: 1.6,
            }}
          >
            One stroke. One team. A community of paddlers chasing speed, sync, and
            the thrill of the finish line.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
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
              paddingTop: '1.25rem',
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
                    fontSize: isMobile ? '1.5rem' : '2.1rem',
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
