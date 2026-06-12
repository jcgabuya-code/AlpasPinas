import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { colors, emeraldGradient } from '../styles/colors';
import { useIsMobile } from '../hooks/useIsMobile';

const ShieldIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

type NavItem = {
  label: string;
  to: string;
  hash?: string;
  end?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: '/', end: true },
  { label: 'About', to: '/', hash: '#about' },
  { label: 'Roster', to: '/roster' },
  { label: 'Events', to: '/events' },
  { label: 'Training', to: '/training' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Contact', to: '/', hash: '#contact' },
];

export const Navigation: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const c = colors[theme];
  const isMobile = useIsMobile();
  const [hovered, setHovered] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  // Training is a member activity — only surface it to signed-in users.
  const visibleItems = NAV_ITEMS.filter((item) =>
    item.label === 'Training' ? Boolean(user) : true,
  );
  const canSeeAdmin = Boolean(user?.isAdmin);

  return (
    <nav
      style={{
        backgroundColor: theme === 'dark' ? 'rgba(11, 12, 16, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${c.border}`,
        padding: '0.9rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Logo / wordmark */}
        <Link
          to="/"
          onClick={closeMenu}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            textDecoration: 'none',
            color: c.text,
          }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '999px', overflow: 'hidden', flexShrink: 0 }}>
            <img
              src="/logo.jpg"
              alt="AlpasPinas Dragonboat Team Malaysia"
              style={{
                width: '130%',
                height: '130%',
                marginLeft: '-15%',
                marginTop: '-15%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: isMobile ? '1.3rem' : '1.6rem',
              letterSpacing: '0.04em',
              color: c.text,
              lineHeight: 1,
            }}
          >
            ALPAS<span style={{ color: c.primary }}>PINAS</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '2.25rem', alignItems: 'center' }}>
            <ul
              style={{
                display: 'flex',
                gap: '1.75rem',
                listStyle: 'none',
                margin: 0,
                padding: 0,
              }}
            >
              {visibleItems.map((item) => {
                const key = `${item.to}${item.hash ?? ''}`;
                return (
                  <li key={key}>
                    <NavLink
                      to={{ pathname: item.to, hash: item.hash ?? '' }}
                      end={item.end}
                      onMouseEnter={() => setHovered(key)}
                      onMouseLeave={() => setHovered(null)}
                      style={({ isActive }) => ({
                        color:
                          hovered === key || (isActive && !item.hash) ? c.primary : c.text,
                        textDecoration: 'none',
                        fontWeight: 500,
                        fontSize: '0.95rem',
                        letterSpacing: '0.02em',
                        transition: 'color 0.15s ease',
                      })}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                style={{
                  background: 'transparent',
                  color: c.text,
                  border: `1px solid ${c.border}`,
                  width: '2.25rem',
                  height: '2.25rem',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {theme === 'dark' ? '☀' : '☾'}
              </button>

              {canSeeAdmin && (
                <Link
                  to="/admin"
                  aria-label="Admin panel"
                  title="Admin"
                  onMouseEnter={() => setHovered('__admin__')}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: '999px',
                    border: `1px solid ${hovered === '__admin__' ? c.primary + '88' : c.border}`,
                    color: hovered === '__admin__' ? c.primary : c.textSecondary,
                    textDecoration: 'none',
                    transition: 'color 0.15s ease, border-color 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  <ShieldIcon size={15} />
                </Link>
              )}

              {user ? (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    onMouseEnter={() => setHovered('__user__')}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      background: 'transparent',
                      color: c.text,
                      border: `1px solid ${hovered === '__user__' ? c.primary + '88' : c.border}`,
                      borderRadius: '999px',
                      padding: '0.5rem 0.9rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      transition: 'border-color 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    👤 {user.name.split(' ')[0]}
                  </button>

                  {userMenuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '0.5rem',
                        backgroundColor: c.surface,
                        border: `1px solid ${c.border}`,
                        borderRadius: '0.55rem',
                        minWidth: '200px',
                        boxShadow: `0 8px 24px ${c.primary}22`,
                        zIndex: 1000,
                      }}
                    >
                      <div style={{ padding: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', color: c.textSecondary, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                          Logged in
                        </div>
                        <div style={{ fontSize: '0.9rem', color: c.text, marginBottom: '0.75rem', fontWeight: 500 }}>
                          {user.name}
                        </div>
                        {user.mobile && (
                          <div style={{ fontSize: '0.75rem', color: c.textSecondary, marginBottom: '0.75rem' }}>
                            {user.mobile}
                          </div>
                        )}
                        <button
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                          }}
                          style={{
                            width: '100%',
                            background: 'transparent',
                            color: c.primary,
                            border: `1px solid ${c.primary}33`,
                            borderRadius: '0.4rem',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            transition: 'border-color 0.15s ease',
                          }}
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Link
                    to="/login"
                    style={{
                      color: c.text,
                      textDecoration: 'none',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      padding: '0.5rem 0.9rem',
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={() => setHovered('__login__')}
                    onMouseLeave={() => setHovered(null)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/join-team"
                    style={{
                      background: emeraldGradient(theme),
                      color: '#fff',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '999px',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      textDecoration: 'none',
                      letterSpacing: '0.02em',
                      boxShadow: `0 4px 14px ${c.primary}33`,
                    }}
                  >
                    Join the Team
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile: theme toggle + hamburger */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              style={{
                background: 'transparent',
                color: c.text,
                border: `1px solid ${c.border}`,
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '999px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              style={{
                background: 'transparent',
                color: c.text,
                border: `1px solid ${c.border}`,
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '0.4rem',
                cursor: 'pointer',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        )}
      </div>

      {/* Mobile dropdown menu */}
      {isMobile && menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: theme === 'dark' ? 'rgba(11, 12, 16, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${c.border}`,
            padding: '0.5rem 1rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
            boxShadow: `0 18px 40px ${theme === 'dark' ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.12)'}`,
          }}
        >
          {visibleItems.map((item) => {
            const key = `${item.to}${item.hash ?? ''}`;
            return (
              <NavLink
                key={key}
                to={{ pathname: item.to, hash: item.hash ?? '' }}
                end={item.end}
                onClick={closeMenu}
                style={({ isActive }) => {
                  const active = isActive && !item.hash;
                  return {
                    color: active ? c.primary : c.text,
                    backgroundColor: active ? `${c.primary}14` : 'transparent',
                    textDecoration: 'none',
                    fontWeight: active ? 600 : 500,
                    fontSize: '1.02rem',
                    letterSpacing: '0.01em',
                    padding: '0.85rem 0.9rem',
                    borderRadius: '0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                  };
                }}
              >
                {item.label}
              </NavLink>
            );
          })}

          {canSeeAdmin && (
            <NavLink
              to="/admin"
              onClick={closeMenu}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: isActive ? c.primary : c.text,
                backgroundColor: isActive ? `${c.primary}14` : 'transparent',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 500,
                fontSize: '1.02rem',
                letterSpacing: '0.01em',
                padding: '0.85rem 0.9rem',
                borderRadius: '0.6rem',
                transition: 'background-color 0.15s ease, color 0.15s ease',
              })}
            >
              <ShieldIcon size={16} />
              Admin
            </NavLink>
          )}

          {user ? (
            <div style={{ marginTop: '0.6rem', paddingTop: '1rem', borderTop: `1px solid ${c.border}` }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.9rem',
                  padding: '0 0.15rem',
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: '2.6rem',
                    height: '2.6rem',
                    borderRadius: '999px',
                    background: emeraldGradient(theme),
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {user.name.trim().charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '1rem', color: c.text, fontWeight: 600, lineHeight: 1.3 }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: c.textSecondary, lineHeight: 1.3 }}>
                    {user.mobile || 'Signed in'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  closeMenu();
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  color: c.primary,
                  border: `1px solid ${c.primary}44`,
                  borderRadius: '0.6rem',
                  padding: '0.75rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.6rem', paddingTop: '1rem', borderTop: `1px solid ${c.border}` }}>
              <Link
                to="/login"
                onClick={closeMenu}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  color: c.text,
                  border: `1px solid ${c.border}`,
                  padding: '0.8rem 1.25rem',
                  borderRadius: '0.6rem',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  letterSpacing: '0.02em',
                }}
              >
                Login
              </Link>
              <Link
                to="/join-team"
                onClick={closeMenu}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: emeraldGradient(theme),
                  color: '#fff',
                  padding: '0.8rem 1.25rem',
                  borderRadius: '0.6rem',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  letterSpacing: '0.02em',
                  boxShadow: `0 4px 14px ${c.primary}33`,
                }}
              >
                Join the Team
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
