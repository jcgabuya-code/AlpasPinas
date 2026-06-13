import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors, emeraldGradient } from '../styles/colors';
import { useIsMobile } from '../hooks/useIsMobile';

const LINKS: { label: string; to: string; hash?: string }[] = [
  { label: 'About', to: '/', hash: '#about' },
  { label: 'Roster', to: '/roster' },
  { label: 'Events', to: '/events' },
  { label: 'Training', to: '/training' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Contact', to: '/', hash: '#contact' },
];

export const Footer: React.FC = () => {
  const { theme } = useTheme();
  const c = colors[theme];
  const isMobile = useIsMobile();

  return (
    <footer
      style={{
        position: 'relative',
        backgroundColor: c.surface,
        color: c.text,
        overflow: 'hidden',
        borderTop: `1px solid ${c.border}`,
        padding: isMobile ? '3rem 1.5rem 2rem' : '4.5rem 2rem 2.5rem',
      }}
    >
      {/* soft emerald glow accent — subtle warmth, not a heavy block */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-40%',
          right: '-5%',
          width: '45%',
          height: '140%',
          background: `radial-gradient(circle, ${c.primary}1f 0%, transparent 68%)`,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', maxWidth: '1280px', margin: '0 auto' }}>
        {/* Top: brand + tagline + CTA */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: '1.5rem',
            paddingBottom: '2rem',
            borderBottom: `1px solid ${c.border}`,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: isMobile ? 'clamp(2.25rem, 11vw, 3rem)' : '3.25rem',
                letterSpacing: '0.02em',
                lineHeight: 1,
                color: c.text,
              }}
            >
              ALPAS<span style={{ color: c.primary }}>PINAS</span>
            </div>
            <p
              style={{
                margin: '0.85rem 0 0',
                color: c.textSecondary,
                fontSize: '1rem',
                maxWidth: '340px',
                lineHeight: 1.55,
              }}
            >
              One stroke. One team. Filipino dragon boat crew based in Malaysia.
            </p>
          </div>

          <Link
            to="/join-team"
            style={{
              flexShrink: 0,
              background: emeraldGradient(theme),
              color: '#fff',
              padding: '0.9rem 1.6rem',
              borderRadius: '999px',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '0.95rem',
              letterSpacing: '0.02em',
              boxShadow: `0 10px 30px ${c.primary}44`,
              whiteSpace: 'nowrap',
            }}
          >
            Join the Team →
          </Link>
        </div>

        {/* Link row */}
        <nav
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: isMobile ? '1rem 1.5rem' : '2rem',
            padding: '1.75rem 0',
          }}
        >
          {LINKS.map((l) => (
            <Link
              key={l.label}
              to={{ pathname: l.to, hash: l.hash ?? '' }}
              style={{
                color: c.textSecondary,
                fontSize: '0.92rem',
                fontWeight: 500,
                textDecoration: 'none',
                letterSpacing: '0.02em',
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Bottom legal row */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: '0.75rem',
            paddingTop: '1.5rem',
            borderTop: `1px solid ${c.border}`,
            color: c.textSecondary,
            fontSize: '0.8rem',
          }}
        >
          <span>© {new Date().getFullYear()} AlpasPinas Dragon Boat Team</span>
          <span style={{ letterSpacing: '0.06em' }}>@alpaspinasdbt</span>
        </div>
      </div>
    </footer>
  );
};
