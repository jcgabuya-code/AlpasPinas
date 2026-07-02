import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { colors, brandGradient } from '../styles/colors';
import { initials, avatarColor } from './MemberCard';
import type { Member } from '../utils/roster';

// "Left" / "Right" / "—" → a compact L / R badge (blank for non-paddlers).
const sideAbbr = (side: string) => (side === 'Left' ? 'L' : side === 'Right' ? 'R' : '');

const StarGlyph = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.5l2.6 5.7 6.2.6-4.7 4.1 1.4 6.1L12 17.8 6.5 19l1.4-6.1L3.2 8.8l6.2-.6z" />
  </svg>
);

// A paddler as a collectible "player card": portrait photo, name + position, an
// L/R side badge, optional rating bars, and a since-year / races footer. Captains
// and coaches get a premium gradient frame.
export const CrewCard: React.FC<{ member: Member }> = ({ member: m }) => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const isDark = theme === 'dark';
  const [hover, setHover] = useState(false);

  const accent = isDark ? c.primaryLight : c.primary;
  const premium = /captain|coach/i.test(m.role);
  const side = sideAbbr(m.side);
  const position = m.position || m.role;

  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        borderRadius: '0.9rem',
        overflow: 'hidden',
        backgroundColor: isDark ? c.background : c.surface,
        border: `1px solid ${hover ? c.primary : c.border}`,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: hover
          ? isDark
            ? '0 18px 40px -16px rgba(0,0,0,0.75)'
            : '0 18px 40px -18px rgba(15,23,42,0.3)'
          : 'none',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.2s ease',
      }}
    >
      {/* Premium frame accent — gradient top edge for captains / coaches */}
      {premium && (
        <div aria-hidden="true" style={{ height: '4px', background: brandGradient(brand, theme) }} />
      )}

      {/* Portrait */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '4 / 5',
          background: m.photo
            ? `center / cover no-repeat url(${m.photo})`
            : `linear-gradient(150deg, ${avatarColor(m.name, brand)} 0%, ${avatarColor(m.name, brand)}b3 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!m.photo && (
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '3.25rem',
              color: '#fff',
              letterSpacing: '0.04em',
              textShadow: '0 2px 14px rgba(0,0,0,0.25)',
            }}
          >
            {initials(m.name)}
          </span>
        )}

        {/* Side badge */}
        {side && (
          <span
            style={{
              position: 'absolute',
              top: '0.6rem',
              right: '0.6rem',
              minWidth: '1.4rem',
              textAlign: 'center',
              padding: '0.18rem 0.45rem',
              borderRadius: '999px',
              fontSize: '0.66rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: '#fff',
              backgroundColor: 'rgba(11,12,16,0.6)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          >
            {side}
          </span>
        )}

        {/* Races chip */}
        {typeof m.races === 'number' && (
          <span
            style={{
              position: 'absolute',
              bottom: '0.6rem',
              left: '0.6rem',
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: '0.25rem',
              padding: '0.2rem 0.55rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(11,12,16,0.55)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              color: '#fff',
            }}
          >
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', lineHeight: 1 }}>{m.races}</span>
            <span style={{ fontSize: '0.6rem', letterSpacing: '0.08em', opacity: 0.85 }}>RACES</span>
          </span>
        )}
      </div>

      {/* Info panel */}
      <div style={{ padding: '0.9rem 1rem 1.05rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', letterSpacing: '0.02em', color: c.text, margin: 0, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {m.name}
            </h3>
            {premium && <span style={{ color: c.sun, flexShrink: 0 }}><StarGlyph /></span>}
          </div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: accent, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.3rem' }}>
            {position}
          </div>
        </div>

        {/* Rating bars */}
        {m.ratings && m.ratings.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {m.ratings.map((r) => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '1.9rem', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', color: c.textSecondary }}>{r.label}</span>
                <span style={{ flex: 1, height: '5px', borderRadius: '999px', backgroundColor: `${c.primary}1f`, overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${Math.max(0, Math.min(100, r.value))}%`, borderRadius: '999px', background: brandGradient(brand, theme) }} />
                </span>
                <span style={{ width: '1.5rem', textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: c.text }}>{r.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ fontSize: '0.72rem', color: c.textSecondary, borderTop: `1px solid ${c.border}`, paddingTop: '0.6rem' }}>
          Crew since <span style={{ color: c.text, fontWeight: 600 }}>’{String(m.joined).slice(2)}</span>
        </div>
      </div>
    </article>
  );
};
