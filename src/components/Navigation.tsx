import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { colors, brandGradient } from '../styles/colors';
import { useIsMobile } from '../hooks/useIsMobile';
import { cadenceAccentUri } from '../styles/tokens';

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
// Tag — shop / gear.
const ShopIcon = () => (
  <Glyph>
    <path d="M20.5 13.3 13.3 20.5a1.8 1.8 0 0 1-2.55 0l-7.2-7.2A1.8 1.8 0 0 1 3 12V4.5a1.5 1.5 0 0 1 1.5-1.5H12c.48 0 .94.19 1.28.53l7.22 7.22a1.8 1.8 0 0 1 0 2.55z" />
    <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
  </Glyph>
);
// Cart — header action.
const CartIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="20" r="1.3" />
    <circle cx="18" cy="20" r="1.3" />
    <path d="M2.5 3.5h2.2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.1a1.5 1.5 0 0 0 1.47-1.18L21 7.5H6" />
  </svg>
);
const NAV_ICONS: Record<string, React.FC> = {
  Home: HomeIcon,
  About: AboutIcon,
  Training: TrainingIcon,
  Merch: ShopIcon,
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

// Sun — shown in dark mode (tap to go light). Disc + eight rays, line-art to match.
const SunIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3.6" />
    <path d="M12 2.5v2.2" />
    <path d="M12 19.3v2.2" />
    <path d="M4.6 4.6l1.55 1.55" />
    <path d="M17.85 17.85l1.55 1.55" />
    <path d="M2.5 12h2.2" />
    <path d="M19.3 12h2.2" />
    <path d="M4.6 19.4l1.55-1.55" />
    <path d="M17.85 6.15l1.55-1.55" />
  </svg>
);

// Moon — shown in light mode (tap to go dark). Single crescent path.
const MoonIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.5 13.2A8 8 0 1 1 10.8 3.5a6.2 6.2 0 0 0 9.7 9.7z" />
  </svg>
);

// Hamburger — three rules, matching the stroke weight of the other glyphs.
const MenuIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </svg>
);

// Single paddler — head + shoulders, for the signed-in user chip.
const UserIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
  </svg>
);

// Cart link with a live count badge. Used in both desktop + mobile bars.
const CartBadge: React.FC<{ count: number; onClick?: () => void }> = ({ count, onClick }) => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  return (
    <Link
      to="/cart"
      onClick={onClick}
      aria-label={count > 0 ? `Cart, ${count} item${count === 1 ? '' : 's'}` : 'Cart'}
      title="Cart"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2.25rem',
        height: '2.25rem',
        borderRadius: '999px',
        border: `1px solid ${c.border}`,
        color: c.text,
        textDecoration: 'none',
        flexShrink: 0,
      }}
    >
      <CartIcon size={18} />
      {count > 0 && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-0.35rem',
            right: '-0.35rem',
            minWidth: '1.15rem',
            height: '1.15rem',
            padding: '0 0.3rem',
            borderRadius: '999px',
            backgroundColor: c.sun,
            color: '#1a1205',
            fontSize: '0.68rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
};

type NavItem = {
  label: string;
  to: string;
  hash?: string;
  end?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: '/', end: true },
  { label: 'About', to: '/', hash: '#about' },
  { label: 'Training', to: '/training' },
  { label: 'Merch', to: '/shop' },
];

export const Navigation: React.FC<{ integratedHome?: boolean }> = ({ integratedHome = false }) => {
  const { theme, toggleTheme, brand, toggleBrand } = useTheme();
  const { user, logout } = useAuth();
  const { count: cartCount } = useCart();
  const c = colors[brand][theme];
  const isMobile = useIsMobile();
  const [hovered, setHovered] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const closeMenu = () => setMenuOpen(false);

  // Merged masthead: on the Home page (wordmark hero only), the nav sits transparent
  // over the hero — its logo is dropped because the hero shows the giant ALPASPINAS
  // wordmark. Once the user scrolls past the top (or on any other page) it condenses
  // back to the normal solid, logo-bearing bar. Desktop only — mobile keeps its bar.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const mergedHome = integratedHome && location.pathname === '/';
  // On desktop Home the nav floats over the hero: it stays `position: fixed` the
  // whole time and only morphs its surface (transparent → frosted) on scroll, so
  // there's no layout jump from swapping position values. `overlay` is the pinned-
  // at-top, transparent state; `floating` is true for the entire home scroll.
  const floating = mergedHome && !isMobile;
  const overlay = floating && !scrolled;
  // The Home v2 hero shows BREAK / AWAY (not the wordmark), so the nav keeps its
  // logo + wordmark over the transparent masthead, matching the reference.
  const hideLogo = false;

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
        backgroundColor: overlay
          ? 'transparent'
          : theme === 'dark'
          ? 'rgba(11, 12, 16, 0.82)'
          : 'rgba(255, 255, 255, 0.82)',
        backdropFilter: overlay ? 'none' : 'blur(14px) saturate(140%)',
        WebkitBackdropFilter: overlay ? 'none' : 'blur(14px) saturate(140%)',
        borderBottom: `1px solid ${overlay ? 'transparent' : c.border}`,
        boxShadow: floating && scrolled ? '0 8px 30px rgba(0, 0, 0, 0.18)' : 'none',
        padding: overlay ? '1.15rem 0' : '0.9rem 0',
        // Stay fixed for the whole home scroll so only the surface animates (no
        // position swap = no jump); other pages keep the in-flow sticky bar.
        position: floating ? 'fixed' : 'sticky',
        top: 0,
        left: floating ? 0 : undefined,
        right: floating ? 0 : undefined,
        zIndex: 100,
        transition:
          'background-color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease, padding 0.35s ease',
      }}
    >
      <a
        href="#home"
        style={{
          position: 'absolute',
          left: '1rem',
          top: 'calc(100% + 0.5rem)',
          transform: 'translateY(-0.35rem) scale(0.98)',
          padding: '0.7rem 1rem',
          borderRadius: '999px',
          background: brandGradient(brand, theme),
          color: '#fff',
          fontWeight: 700,
          textDecoration: 'none',
          zIndex: 101,
          opacity: 0,
          pointerEvents: 'none',
          transition: 'opacity 0.18s ease, transform 0.18s ease',
        }}
        onFocus={(event) => {
          event.currentTarget.style.transform = 'translateY(0) scale(1)';
          event.currentTarget.style.opacity = '1';
          event.currentTarget.style.pointerEvents = 'auto';
        }}
        onBlur={(event) => {
          event.currentTarget.style.transform = 'translateY(-0.35rem) scale(0.98)';
          event.currentTarget.style.opacity = '0';
          event.currentTarget.style.pointerEvents = 'none';
        }}
      >
        Skip to home content
      </a>
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: overlay ? '0 1.1rem' : '0 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Logo / wordmark — hidden on the merged home masthead, where the hero shows
            the oversized ALPASPINAS instead (avoids a duplicate logo). */}
        {!hideLogo && (
        <Link
          to="/"
          onClick={closeMenu}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            textDecoration: 'none',
            color: c.text,
            flexShrink: 0,
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
        )}

        {/* Desktop nav — asymmetric: a tight, logo-anchored link cluster on the left,
            a single weighted action rail on the right. Rhythm through contrast:
            the two groups are internally tight and separated by one generous gap. */}
        {!isMobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginLeft: hideLogo ? 0 : '2.25rem',
              minWidth: 0,
              flex: 1,
            }}
          >
            <ul
              style={{
                display: 'flex',
                gap: '1.6rem',
                alignItems: 'center',
                listStyle: 'none',
                margin: 0,
                padding: 0,
                flexShrink: 0,
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

            {/* Right rail: quiet cosmetic duo → divider → functional/session actions,
                Join the Team (or the account chip) carries the most visual weight. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <button
                  onClick={toggleBrand}
                  aria-label={`Switch color theme (currently ${brand})`}
                  title={`Color: ${brand} — click to switch`}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${c.border}`,
                    width: '1.9rem',
                    height: '1.9rem',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      width: '0.95rem',
                      height: '0.95rem',
                      borderRadius: '999px',
                      background: brandGradient(brand, theme),
                    }}
                  />
                </button>
                <button
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  style={{
                    background: 'transparent',
                    color: c.textSecondary,
                    border: `1px solid ${c.border}`,
                    width: '1.9rem',
                    height: '1.9rem',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {theme === 'dark' ? <SunIcon size={15} /> : <MoonIcon size={15} />}
                </button>
              </div>

              <span aria-hidden="true" style={{ width: '1px', height: '20px', backgroundColor: c.border, flexShrink: 0 }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                <CartBadge count={cartCount} />

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
                      <UserIcon size={16} /> {user.name.split(' ')[0]}
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
                          <Link
                            to="/orders"
                            onClick={() => setUserMenuOpen(false)}
                            style={{
                              display: 'block',
                              textAlign: 'center',
                              color: c.text,
                              border: `1px solid ${c.border}`,
                              borderRadius: '0.4rem',
                              padding: '0.5rem',
                              marginBottom: '0.5rem',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            My Orders
                          </Link>
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
                        background: brandGradient(brand, theme),
                        color: '#fff',
                        border: 'none',
                        padding: '0.6rem 1.2rem',
                        borderRadius: '999px',
                        fontWeight: 700,
                        fontSize: '0.92rem',
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
          </div>
        )}

        {/* Mobile: theme toggle + hamburger */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={toggleBrand}
              aria-label={`Switch color theme (currently ${brand})`}
              title={`Color: ${brand} — click to switch`}
              style={{
                background: 'transparent',
                border: `1px solid ${c.border}`,
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '999px',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  width: '1.1rem',
                  height: '1.1rem',
                  borderRadius: '999px',
                  background: brandGradient(brand, theme),
                }}
              />
            </button>
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
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <CartBadge count={cartCount} onClick={closeMenu} />
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
              {menuOpen ? <CloseIcon size={18} /> : <MenuIcon />}
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
              backgroundColor: c.background,
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
                background: brandGradient(brand, theme),
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

              {/* Cadence meter — the page's signature stroke-beat, along the header's base */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: '14px',
                  backgroundImage: cadenceAccentUri('rgba(255,255,255,0.55)'),
                  backgroundRepeat: 'repeat-x',
                  backgroundSize: '80px 14px',
                  backgroundPosition: 'left center',
                  WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%)',
                  maskImage: 'linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%)',
                }}
              />
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
          {visibleItems.map((item, i) => {
            const key = `${item.to}${item.hash ?? ''}`;
            const Icon = NAV_ICONS[item.label];
            return (
              <NavLink
                key={key}
                to={{ pathname: item.to, hash: item.hash ?? '' }}
                end={item.end}
                onClick={closeMenu}
                className={menuOpen ? 'drawer-item-in' : undefined}
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
                    animationDelay: `${i * 0.04}s`,
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
                      {active && (
                        <span
                          aria-hidden="true"
                          style={{ width: '6px', height: '6px', borderRadius: '999px', backgroundColor: c.sun, flexShrink: 0 }}
                        />
                      )}
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
              className={menuOpen ? 'drawer-item-in' : undefined}
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
                animationDelay: `${visibleItems.length * 0.04}s`,
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
                  {isActive && (
                    <span
                      aria-hidden="true"
                      style={{ width: '6px', height: '6px', borderRadius: '999px', backgroundColor: c.sun, flexShrink: 0 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          )}
            </div>

            {/* Bottom block: sign-out (logged in) or auth CTAs (logged out) */}
            <div style={{ borderTop: `1px solid ${c.border}`, padding: '0.85rem 1rem 1rem' }}>
              {user ? (
                <>
                <Link
                  to="/orders"
                  onClick={closeMenu}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.7rem',
                    color: c.text,
                    textDecoration: 'none',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    borderRadius: '0.7rem',
                    marginBottom: '0.3rem',
                  }}
                >
                  <span aria-hidden="true" style={{ display: 'flex', width: '1.6rem', justifyContent: 'center', color: c.textSecondary }}>
                    <CartIcon size={18} />
                  </span>
                  <span style={{ flex: 1 }}>My Orders</span>
                </Link>
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
                </>
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
                      background: brandGradient(brand, theme),
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
