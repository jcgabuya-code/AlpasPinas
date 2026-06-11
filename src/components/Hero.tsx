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
        backgroundColor: c.background,
        backgroundImage: isDark
          ? `radial-gradient(circle at 80% 20%, ${c.primary}22 0%, transparent 45%),
             radial-gradient(circle at 10% 90%, ${c.primary}11 0%, transparent 50%),
             linear-gradient(180deg, ${c.background} 0%, #07080c 100%)`
          : `linear-gradient(135deg, ${c.background} 0%, ${c.primaryLight}22 100%)`,
        padding: isMobile ? '3rem 1.25rem 2.5rem' : '5rem 2rem 4rem',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1.25fr)',
          gap: isMobile ? '2rem' : '3.5rem',
          alignItems: 'center',
        }}
      >
        {/* Left: text content */}
        <div>
          {/* Logo + badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1.75rem' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '999px', overflow: 'hidden', flexShrink: 0, boxShadow: `0 8px 28px ${c.primary}33` }}>
              <img
                src="/logo.jpg"
                alt="AlpasPinas Dragonboat Team Malaysia logo"
                style={{ width: '130%', height: '130%', marginLeft: '-15%', marginTop: '-15%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <span
              style={{
                display: 'inline-block',
                padding: '0.35rem 0.9rem',
                borderRadius: '999px',
                border: `1px solid ${c.primary}55`,
                backgroundColor: `${c.primary}15`,
                color: c.primary,
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Filipino Dragon Boat Team · Malaysia
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: isMobile ? 'clamp(3.5rem, 20vw, 5.5rem)' : 'clamp(4rem, 9vw, 7rem)',
              fontWeight: 400,
              color: c.text,
              margin: '0 0 1.25rem 0',
              lineHeight: 0.9,
              letterSpacing: '0.01em',
            }}
          >
            RULERS OF
            <br />
            THE{' '}
            <span
              style={{
                background: emeraldGradient(theme),
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              WATER
            </span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
              color: c.textSecondary,
              margin: '0 0 2rem 0',
              maxWidth: '480px',
              lineHeight: 1.65,
            }}
          >
            One stroke. One team. AlpasPinas is a community of paddlers chasing
            speed, sync, and the thrill of the finish line.
          </p>

          {/* Stat chips */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {STATS.map((s) => (
              <div
                key={s.label}
                style={{
                  padding: '0.7rem 1.1rem',
                  backgroundColor: isDark ? c.surface : '#fff',
                  border: `1px solid ${c.border}`,
                  borderRadius: '0.65rem',
                  minWidth: '88px',
                }}
              >
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: c.text, letterSpacing: '0.02em', lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.68rem', color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.3rem' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a
              href="#contact"
              style={{
                background: emeraldGradient(theme),
                color: '#fff',
                padding: '0.95rem 1.75rem',
                borderRadius: '999px',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: '0.95rem',
                letterSpacing: '0.02em',
                boxShadow: `0 8px 28px ${c.primary}44`,
              }}
            >
              Contact Us →
            </a>
            <button
              type="button"
              onClick={() => setVideoOpen(true)}
              style={{
                backgroundColor: 'transparent',
                color: c.text,
                padding: '0.95rem 1.6rem',
                borderRadius: '999px',
                fontWeight: 600,
                fontSize: '0.95rem',
                border: `1px solid ${c.border}`,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                fontFamily: 'inherit',
                letterSpacing: '0.02em',
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
        </div>

        {/* Right: hero image card */}
        <div
          style={{
            position: 'relative',
            aspectRatio: '4 / 3',
            borderRadius: '1.25rem',
            overflow: 'hidden',
            border: `1px solid ${c.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: isMobile ? '260px' : '420px',
            backgroundColor: c.surface,
          }}
        >
          <img
            src="/team.jpg"
            alt="AlpasPinas Dragonboat Team — paddlers with team flag at the beach"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />

          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)',
            }}
          />

          {/* Next event badge */}
          {nextEvent && (
            <div
              style={{
                position: 'absolute',
                bottom: '1rem',
                left: '1rem',
                right: '1rem',
                backgroundColor: 'rgba(11,12,16,0.72)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.75rem',
                padding: '0.8rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '999px',
                  background: emeraldGradient(theme),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  flexShrink: 0,
                }}
              >
                🏆
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: '0.83rem', fontWeight: 600 }}>
                  Next race: {nextEvent.name}
                </div>
                <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.1rem' }}>
                  {parseEventDate(nextEvent.date).toLocaleDateString(undefined, DATE_FORMAT)} · {nextEvent.location}
                </div>
              </div>
            </div>
          )}
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
