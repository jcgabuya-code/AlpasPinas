import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors, brandGradient } from '../styles/colors';
import { useIsMobile } from '../hooks/useIsMobile';

const LINKS: { label: string; to: string; hash?: string }[] = [
  { label: 'About', to: '/', hash: '#about' },
  { label: 'Roster', to: '/roster' },
  { label: 'Events', to: '/events' },
  { label: 'Training', to: '/training' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Shop', to: '/shop' },
  { label: 'Contact', to: '/', hash: '#contact' },
];

export const Footer: React.FC = () => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const isMobile = useIsMobile();

  return (
    <footer
      style={{
        position: 'relative',
        backgroundColor: c.surface,
        color: c.text,
        overflow: 'hidden',
        borderTop: `1px solid ${c.border}`,
        padding: isMobile ? '2rem 1.5rem 1.5rem' : '4.5rem 2rem 2.5rem',
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
            flexDirection: isMobile ? 'row' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'center' : 'center',
            gap: '1.5rem',
            paddingBottom: isMobile ? '1.1rem' : '2rem',
            borderBottom: `1px solid ${c.border}`,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: isMobile ? 'clamp(1.6rem, 7vw, 2rem)' : '3.25rem',
                letterSpacing: '0.02em',
                lineHeight: 1,
                color: c.text,
              }}
            >
              ALPAS<span style={{ color: c.primary }}>PINAS</span>
            </div>
            {!isMobile && (
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
            )}
          </div>

          <Link
            to="/join-team"
            style={{
              flexShrink: 0,
              background: brandGradient(brand, theme),
              color: '#fff',
              padding: isMobile ? '0.55rem 1rem' : '0.9rem 1.6rem',
              borderRadius: '999px',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: isMobile ? '0.82rem' : '0.95rem',
              letterSpacing: '0.02em',
              boxShadow: `0 10px 30px ${c.primary}44`,
              whiteSpace: 'nowrap',
            }}
          >
            Join {!isMobile && 'the Team '}→
          </Link>
        </div>

        {/* Link row */}
        {isMobile ? (
          <p
            style={{
              margin: 0,
              padding: '1rem 0',
              color: c.textSecondary,
              fontSize: '0.9rem',
              lineHeight: 1.9,
              letterSpacing: '0.01em',
            }}
          >
            {LINKS.map((l, i) => (
              <React.Fragment key={l.label}>
                <Link
                  to={{ pathname: l.to, hash: l.hash ?? '' }}
                  style={{
                    color: c.textSecondary,
                    fontWeight: 500,
                    textDecoration: 'none',
                    padding: '0.3rem 0',
                    display: 'inline-block',
                  }}
                >
                  {l.label}
                </Link>
                {i < LINKS.length - 1 && (
                  <span style={{ color: c.border, padding: '0 0.5rem' }}>·</span>
                )}
              </React.Fragment>
            ))}
          </p>
        ) : (
          <nav
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '2rem',
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
        )}

        {/* Bottom legal row */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            paddingTop: isMobile ? '0.85rem' : '1.5rem',
            borderTop: isMobile ? 'none' : `1px solid ${c.border}`,
            color: c.textSecondary,
            fontSize: isMobile ? '0.72rem' : '0.8rem',
          }}
        >
          <span>© {new Date().getFullYear()} AlpasPinas Dragon Boat Team</span>
          <span style={{ letterSpacing: '0.06em' }}>@alpaspinasdbt</span>
        </div>
      </div>
    </footer>
  );
};
