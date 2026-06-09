import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { colors, emeraldGradient } from '../styles/colors';
import { useIsMobile } from '../hooks/useIsMobile';

const IconPaddle = () => (
  <svg width="26" height="26" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="20" cy="8" rx="5" ry="3.5" transform="rotate(-45 20 8)" />
    <line x1="16.5" y1="11.5" x2="5" y2="23" />
    <line x1="5" y1="23" x2="3" y2="25" />
    <line x1="7" y1="21" x2="5" y2="23" />
    <path d="M2 19 Q5 17 8 19 Q11 21 14 19" strokeWidth="1.4" opacity="0.6" />
  </svg>
);

const IconTrophy = () => (
  <svg width="26" height="26" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 4h12v9a6 6 0 0 1-12 0V4Z" />
    <path d="M8 7H5a3 3 0 0 0 3 5" />
    <path d="M20 7h3a3 3 0 0 1-3 5" />
    <line x1="14" y1="19" x2="14" y2="23" />
    <line x1="10" y1="23" x2="18" y2="23" />
    <path d="M14 7l1 2.5h2.5l-2 1.5.8 2.5L14 12l-2.3 1.5.8-2.5-2-1.5H13Z" strokeWidth="1.2" />
  </svg>
);

const IconTeam = () => (
  <svg width="26" height="26" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="14" cy="9" r="3" />
    <path d="M9 24v-3a5 5 0 0 1 10 0v3" />
    <circle cx="6" cy="11" r="2.5" />
    <path d="M2 24v-2a4 4 0 0 1 7-2.6" />
    <circle cx="22" cy="11" r="2.5" />
    <path d="M26 24v-2a4 4 0 0 0-7-2.6" />
  </svg>
);

const IconGear = () => (
  <svg width="26" height="26" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 4h8l2 4v6l-2 3H10L8 14V8Z" />
    <line x1="14" y1="4" x2="14" y2="17" strokeDasharray="2 1.5" />
    <path d="M8 8 C5 8 4 10 4 13 C4 17 6 20 9 21" />
    <path d="M20 8 C23 8 24 10 24 13 C24 17 22 20 19 21" />
    <path d="M9 21 Q14 24 19 21" />
  </svg>
);

export const Features: React.FC = () => {
  const { theme } = useTheme();
  const c = colors[theme];
  const isDark = theme === 'dark';
  const isMobile = useIsMobile();
  const [hovered, setHovered] = useState<number | null>(null);

  const cardBase: React.CSSProperties = {
    borderRadius: '1rem',
    border: `1px solid ${c.border}`,
    overflow: 'hidden',
    transition: 'border-color 0.2s ease, transform 0.2s ease',
  };

  return (
    <section
      id="about"
      style={{
        backgroundColor: c.background,
        padding: isMobile ? '3.5rem 1rem' : '6rem 2rem',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* Section header */}
        <div style={{ marginBottom: isMobile ? '2rem' : '3rem' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '0.3rem 0.8rem',
              borderRadius: '999px',
              border: `1px solid ${c.primary}55`,
              backgroundColor: `${c.primary}15`,
              color: c.primary,
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '0.85rem',
            }}
          >
            Why AlpasPinas
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: isMobile ? 'clamp(2.5rem, 12vw, 3.5rem)' : 'clamp(3rem, 6vw, 4.5rem)',
              color: c.text,
              margin: 0,
              letterSpacing: '0.01em',
              lineHeight: 0.95,
            }}
          >
            BUILT FOR{' '}
            <span
              style={{
                background: emeraldGradient(theme),
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              THE WATER
            </span>
          </h2>
        </div>

        {/* Bento grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gridTemplateRows: isMobile ? 'auto' : '220px 220px auto',
            gap: '0.85rem',
          }}
        >

          {/* Card 1 — Training (large, with photo bg) */}
          <div
            onMouseEnter={() => setHovered(0)}
            onMouseLeave={() => setHovered(null)}
            style={{
              ...cardBase,
              gridColumn: isMobile ? undefined : '1 / 3',
              gridRow: isMobile ? undefined : '1 / 3',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              minHeight: isMobile ? '280px' : undefined,
              border: `1px solid ${hovered === 0 ? c.primary : c.border}`,
              transform: hovered === 0 ? 'translateY(-3px)' : 'translateY(0)',
              cursor: 'default',
            }}
          >
            <img
              src="/training-action.jpg"
              alt=""
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 40%',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.72) 100%)',
              }}
            />
            <div style={{ position: 'relative', zIndex: 1, padding: '1.75rem' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '0.65rem',
                  backgroundColor: `${c.primary}cc`,
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  marginBottom: '1rem',
                }}
              >
                <IconPaddle />
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2rem',
                  color: '#fff',
                  margin: '0 0 0.5rem 0',
                  letterSpacing: '0.02em',
                  lineHeight: 1,
                }}
              >
                Structured Training
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '0.9rem', lineHeight: 1.55, maxWidth: '380px' }}>
                Weekly water sessions plus land-based strength and conditioning.
                Programs scale from first-timer to race crew.
              </p>
            </div>
          </div>

          {/* Card 2 — Race Ready */}
          <div
            onMouseEnter={() => setHovered(1)}
            onMouseLeave={() => setHovered(null)}
            style={{
              ...cardBase,
              gridColumn: isMobile ? undefined : '3 / 4',
              gridRow: isMobile ? undefined : '1 / 2',
              padding: '1.5rem',
              backgroundColor: isDark ? c.surface : '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: `1px solid ${hovered === 1 ? c.primary : c.border}`,
              transform: hovered === 1 ? 'translateY(-3px)' : 'translateY(0)',
              cursor: 'default',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '0.65rem',
                backgroundColor: `${c.primary}18`,
                border: `1px solid ${c.primary}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: c.primary,
              }}
            >
              <IconTrophy />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: c.text, margin: '0 0 0.45rem', letterSpacing: '-0.01em' }}>
                Race Ready
              </h3>
              <p style={{ color: c.textSecondary, margin: 0, fontSize: '0.88rem', lineHeight: 1.55 }}>
                Local regattas and regional festivals — mixed, open, and women's crews each season.
              </p>
            </div>
          </div>

          {/* Card 3 — Community */}
          <div
            onMouseEnter={() => setHovered(2)}
            onMouseLeave={() => setHovered(null)}
            style={{
              ...cardBase,
              gridColumn: isMobile ? undefined : '3 / 4',
              gridRow: isMobile ? undefined : '2 / 3',
              padding: '1.5rem',
              background: isDark
                ? `linear-gradient(135deg, ${c.surface} 0%, ${c.primary}22 100%)`
                : `linear-gradient(135deg, #fff 0%, ${c.primary}12 100%)`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: `1px solid ${hovered === 2 ? c.primary : c.border}`,
              transform: hovered === 2 ? 'translateY(-3px)' : 'translateY(0)',
              cursor: 'default',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '0.65rem',
                backgroundColor: `${c.primary}18`,
                border: `1px solid ${c.primary}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: c.primary,
              }}
            >
              <IconTeam />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: c.text, margin: '0 0 0.45rem', letterSpacing: '-0.01em' }}>
                Real Community
              </h3>
              <p style={{ color: c.textSecondary, margin: 0, fontSize: '0.88rem', lineHeight: 1.55 }}>
                Filipino roots, open to anyone. Socials, post-training breakfasts, and travel together.
              </p>
            </div>
          </div>

          {/* Card 4 — Gear Provided (full-width, horizontal) */}
          <div
            onMouseEnter={() => setHovered(3)}
            onMouseLeave={() => setHovered(null)}
            style={{
              ...cardBase,
              gridColumn: isMobile ? undefined : '1 / 4',
              gridRow: isMobile ? undefined : '3 / 4',
              padding: isMobile ? '1.5rem' : '1.75rem 2rem',
              backgroundColor: isDark ? c.surface : '#fff',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: '1.5rem',
              border: `1px solid ${hovered === 3 ? c.primary : c.border}`,
              transform: hovered === 3 ? 'translateY(-3px)' : 'translateY(0)',
              cursor: 'default',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '0.75rem',
                background: emeraldGradient(theme),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              <IconGear />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: c.text, margin: '0 0 0.4rem', letterSpacing: '-0.01em' }}>
                Gear Provided
              </h3>
              <p style={{ color: c.textSecondary, margin: 0, fontSize: '0.92rem', lineHeight: 1.55 }}>
                Boat, paddles, and life vests are all on us. Just bring water, sun protection, and the willingness to get wet.
              </p>
            </div>
            <span
              style={{
                flexShrink: 0,
                padding: '0.5rem 1.1rem',
                borderRadius: '999px',
                backgroundColor: `${c.primary}15`,
                border: `1px solid ${c.primary}44`,
                color: c.primary,
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
              }}
            >
              No gear needed ✓
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
