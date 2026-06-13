import React, { useEffect, useState } from 'react';
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

// Shared wrapper so every nav glyph has identical sizing + stroke styling.
const Glyph: React.FC<{ size?: number; children: React.ReactNode }> = ({ size = 20, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

// ★ Custom dragon-boat glyph — hull, curling dragon-head prow, paddler scallops, water.
const HomeIcon = () => (
  <Glyph>
    <path d="M3 12.5 C4.5 16.5 19.5 16.5 21 12.5" />
    <path d="M3 12.5 H21" />
    <path d="M21 12.5 c1.6 -.4 2.2 -2 1.3 -3.1 c-.7 -.8 -1.9 -.5 -2 .6" />
    <circle cx="19.9" cy="10.8" r="0.55" fill="currentColor" stroke="none" />
    <path d="M6.5 13.6 q1 1.5 2 0" />
    <path d="M10.3 13.6 q1 1.5 2 0" />
    <path d="M14.1 13.6 q1 1.5 2 0" />
    <path d="M3 19 q2.5 -1.4 5 0 t5 0 t5 0" />
  </Glyph>
);
// Anchor — nautical team identity.
const AboutIcon = () => (
  <Glyph>
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7 V20" />
    <path d="M8.5 10 H15.5" />
    <path d="M4.5 13.5 C4.5 18 8 20.5 12 20.5 C16 20.5 19.5 18 19.5 13.5" />
    <path d="M4.5 13.5 l-1.8 .6" />
    <path d="M4.5 13.5 l1.2 1.6" />
    <path d="M19.5 13.5 l1.8 .6" />
    <path d="M19.5 13.5 l-1.2 1.6" />
  </Glyph>
);
// ★ Custom crossed-paddles glyph — the crew.
const RosterIcon = () => (
  <Glyph>
    <line x1="8" y1="16" x2="16" y2="7.6" />
    <ellipse cx="6.8" cy="16.8" rx="1.2" ry="2" transform="rotate(45 6.8 16.8)" />
    <line x1="15.1" y1="6.5" x2="16.9" y2="8.5" />
    <line x1="16" y1="16" x2="8" y2="7.6" />
    <ellipse cx="17.2" cy="16.8" rx="1.2" ry="2" transform="rotate(-45 17.2 16.8)" />
    <line x1="8.9" y1="6.5" x2="7.1" y2="8.5" />
  </Glyph>
);
// Medal — race results.
const EventsIcon = () => (
  <Glyph>
    <path d="M7.5 3 L10.5 9" />
    <path d="M16.5 3 L13.5 9" />
    <circle cx="12" cy="15" r="5.5" />
    <path d="M12 12.7 l.9 1.85 2.04 .27 -1.5 1.4 .38 2.02 -1.82 -.98 -1.82 .98 .38 -2.02 -1.5 -1.4 2.04 -.27 z" />
  </Glyph>
);
// Single paddle + ripples — training.
const TrainingIcon = () => (
  <Glyph>
    <path d="M13 4.5 L11 13" />
    <ellipse cx="10.6" cy="14.4" rx="1.5" ry="2.3" transform="rotate(13 10.6 14.4)" />
    <path d="M11.9 4.2 q1.6 -.7 2.7 .6" />
    <path d="M3.5 18.5 q2.5 -1.5 5 0 t5 0 t5 0" />
    <path d="M3.5 21 q2.5 -1.5 5 0 t5 0 t5 0" />
  </Glyph>
);
// Photo frame with a wave — gallery.
const GalleryIcon = () => (
  <Glyph>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <circle cx="8" cy="10" r="1.5" />
    <path d="M4 16.5 q2.5 -1.8 5 0 t5 0 t4 0" />
  </Glyph>
);
// Life ring — contact.
const ContactIcon = () => (
  <Glyph>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 3.5 V8.5" />
    <path d="M12 15.5 V20.5" />
    <path d="M3.5 12 H8.5" />
    <path d="M15.5 12 H20.5" />
  </Glyph>
);

const NAV_ICONS: Record<string, React.FC> = {
  Home: HomeIcon,
  About: AboutIcon,
  Roster: RosterIcon,
  Events: EventsIcon,
  Training: TrainingIcon,
  Gallery: GalleryIcon,
  Contact: ContactIcon,
};

// Logout arrow — used on the drawer's Sign Out row.
const LogoutIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

const CloseIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
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

  // Lock body scroll while the slide-in drawer is open.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  // Close the drawer on Escape for keyboard users.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

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

      {/* Mobile slide-in drawer */}
      {isMobile && (
        <>
          {/* Dimmed backdrop */}
          <div
            onClick={closeMenu}
            aria-hidden="true"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              opacity: menuOpen ? 1 : 0,
              pointerEvents: menuOpen ? 'auto' : 'none',
              transition: 'opacity 0.28s ease',
              zIndex: 200,
            }}
          />

          {/* Drawer panel */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              height: '100dvh',
              width: 'min(85vw, 360px)',
              backgroundColor: theme === 'dark' ? '#0b0c10' : '#ffffff',
              boxShadow: menuOpen ? '-12px 0 40px rgba(0,0,0,0.35)' : 'none',
              transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
              borderTopLeftRadius: '1.25rem',
              borderBottomLeftRadius: '1.25rem',
              overflow: 'hidden',
              zIndex: 201,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Gradient header block */}
            <div
              style={{
                background: emeraldGradient(theme),
                color: '#fff',
                padding: '1.4rem 1.25rem 1.5rem',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <button
                onClick={closeMenu}
                aria-label="Close menu"
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(255,255,255,0.18)',
                  color: '#fff',
                  border: 'none',
                  width: '2.1rem',
                  height: '2.1rem',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CloseIcon size={20} />
              </button>
              <div
                aria-hidden="true"
                style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  marginBottom: '0.85rem',
                }}
              >
                {user ? user.name.trim().charAt(0).toUpperCase() : 'AP'}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.4rem',
                  lineHeight: 1.15,
                  letterSpacing: '0.01em',
                }}
              >
                {user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Welcome aboard'}
              </div>
              <div style={{ fontSize: '0.88rem', opacity: 0.85, marginTop: '0.35rem' }}>
                {user ? 'Ready to hit the water?' : 'Join the AlpasPinas crew'}
              </div>
            </div>

            {/* Scrollable nav list */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
              }}
            >
          {visibleItems.map((item) => {
            const key = `${item.to}${item.hash ?? ''}`;
            const Icon = NAV_ICONS[item.label];
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
                    fontSize: '0.92rem',
                    letterSpacing: '0.01em',
                    padding: '0.5rem 0.7rem',
                    borderRadius: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.7rem',
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                  };
                }}
              >
                {({ isActive }) => {
                  const active = isActive && !item.hash;
                  return (
                    <>
                      <span
                        aria-hidden="true"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '1.6rem',
                          flexShrink: 0,
                          color: active ? c.primary : c.textSecondary,
                        }}
                      >
                        {Icon ? <Icon /> : null}
                      </span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                    </>
                  );
                }}
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
                gap: '0.7rem',
                color: isActive ? c.primary : c.text,
                backgroundColor: isActive ? `${c.primary}14` : 'transparent',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.92rem',
                letterSpacing: '0.01em',
                padding: '0.5rem 0.7rem',
                borderRadius: '0.7rem',
                transition: 'background-color 0.15s ease, color 0.15s ease',
              })}
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '1.6rem',
                      flexShrink: 0,
                      color: isActive ? c.primary : c.textSecondary,
                    }}
                  >
                    <ShieldIcon size={20} />
                  </span>
                  <span style={{ flex: 1 }}>Admin</span>
                </>
              )}
            </NavLink>
          )}
            </div>

            {/* Bottom block: sign-out (logged in) or auth CTAs (logged out) */}
            <div style={{ borderTop: `1px solid ${c.border}`, padding: '0.85rem 1rem 1rem' }}>
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.7rem',
                    background: 'transparent',
                    color: '#e5484d',
                    border: 'none',
                    padding: '0.65rem 0.85rem',
                    cursor: 'pointer',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    letterSpacing: '0.01em',
                    borderRadius: '0.7rem',
                    textAlign: 'left',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '1.6rem',
                      flexShrink: 0,
                      color: '#e5484d',
                    }}
                  >
                    <LogoutIcon />
                  </span>
                  <span style={{ flex: 1 }}>Sign Out</span>
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
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
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '0.72rem',
                  color: c.textSecondary,
                  marginTop: '0.9rem',
                  letterSpacing: '0.03em',
                }}
              >
                AlpasPinas Dragonboat · Malaysia
              </div>
            </div>
          </aside>
        </>
      )}
    </nav>
  );
};
