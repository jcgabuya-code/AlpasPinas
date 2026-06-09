import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';
import { useIsMobile } from '../hooks/useIsMobile';

export const Footer: React.FC = () => {
  const { theme } = useTheme();
  const c = colors[theme];
  const isMobile = useIsMobile();

  return (
    <footer
      style={{
        backgroundColor: c.surface,
        borderTop: `1px solid ${c.border}`,
        padding: '2.5rem 1.5rem 2rem',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: isMobile ? 'center' : 'space-between',
          alignItems: isMobile ? 'center' : 'center',
          gap: isMobile ? '1.25rem' : '1rem',
          textAlign: isMobile ? 'center' : 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.3rem',
              letterSpacing: '0.04em',
              color: c.text,
            }}
          >
            ALPAS<span style={{ color: c.primary }}>PINAS</span>
          </span>
          <span
            style={{
              color: c.textSecondary,
              fontSize: '0.85rem',
              borderLeft: `1px solid ${c.border}`,
              paddingLeft: '0.75rem',
              marginLeft: '0.25rem',
            }}
          >
            One stroke. One team.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to={{ pathname: '/', hash: '#about' }} style={{ color: c.textSecondary, fontSize: '0.85rem', textDecoration: 'none' }}>About</Link>
          <Link to="/roster" style={{ color: c.textSecondary, fontSize: '0.85rem', textDecoration: 'none' }}>Roster</Link>
          <Link to="/events" style={{ color: c.textSecondary, fontSize: '0.85rem', textDecoration: 'none' }}>Events</Link>
          <Link to="/training" style={{ color: c.textSecondary, fontSize: '0.85rem', textDecoration: 'none' }}>Training</Link>
          <Link to="/gallery" style={{ color: c.textSecondary, fontSize: '0.85rem', textDecoration: 'none' }}>Gallery</Link>
          <Link to={{ pathname: '/', hash: '#contact' }} style={{ color: c.textSecondary, fontSize: '0.85rem', textDecoration: 'none' }}>Contact</Link>
        </div>

        <div style={{ color: c.textSecondary, fontSize: '0.8rem' }}>
          © {new Date().getFullYear()} AlpasPinas Dragon Boat Team
        </div>
      </div>
    </footer>
  );
};
