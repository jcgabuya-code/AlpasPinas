import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';
export type { Member } from '../utils/roster';
import type { Member } from '../utils/roster';

/**
 * Initials from a name, e.g. "Mateo Reyes" → "MR".
 */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

/**
 * Deterministic emerald-toned background color for the initials avatar based
 * on the name, so each member gets a stable, distinct color.
 */
export const avatarColor = (name: string) => {
  const palette = ['#10b981', '#047857', '#34d399', '#059669', '#6ee7b7', '#065f46'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
};

export const MemberCard: React.FC<{ member: Member }> = ({ member: m }) => {
  const { theme } = useTheme();
  const c = colors[theme];

  return (
    <article
      style={{
        backgroundColor: c.background,
        borderRadius: '0.85rem',
        border: `1px solid ${c.border}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Avatar — photo if provided, otherwise initials block */}
      <div
        style={{
          aspectRatio: '1 / 1',
          background: m.photo
            ? `center / cover no-repeat url(${m.photo})`
            : `linear-gradient(135deg, ${avatarColor(m.name)} 0%, ${avatarColor(
                m.name,
              )}cc 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {!m.photo && (
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '3.5rem',
              color: '#fff',
              letterSpacing: '0.04em',
              textShadow: '0 2px 12px rgba(0,0,0,0.2)',
            }}
          >
            {initials(m.name)}
          </span>
        )}

        {/* Side badge */}
        {m.side !== '—' && (
          <span
            style={{
              position: 'absolute',
              top: '0.75rem',
              right: '0.75rem',
              backgroundColor: 'rgba(11, 12, 16, 0.65)',
              backdropFilter: 'blur(6px)',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '0.3rem 0.55rem',
              borderRadius: '999px',
            }}
          >
            {m.side}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '1.1rem 1.15rem 1.25rem' }}>
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            color: c.primary,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '0.25rem',
          }}
        >
          {m.role}
        </div>
        <h3
          style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: c.text,
            margin: '0 0 0.5rem 0',
          }}
        >
          {m.name}
        </h3>
        <div
          style={{
            fontSize: '0.8rem',
            color: c.textSecondary,
          }}
        >
          Member since {m.joined}
        </div>
      </div>
    </article>
  );
};
