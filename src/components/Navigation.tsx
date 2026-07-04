import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { colors, brandGradient } from '../styles/colors';
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

// Cart — header action.
const CartIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="20" r="1.3" />
    <circle cx="18" cy="20" r="1.3" />
    <path d="M2.5 3.5h2.2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.1a1.5 1.5 0 0 0 1.47-1.18L21 7.5H6" />
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

// Right chevron — trails each oversized drawer nav link.
const ChevronRight = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 5l7 7-7 7" />
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

  // Drawer nav — the mobile reference's link set. Home-page sections resolve via
  // ScrollToHash (matching ids live in MobileHome). Training points members at the
  // sign-up route, and visitors at the schedule section on the home page.
  const drawerLinks: { label: string; to: string; hash?: string }[] = [
    { label: 'Home', to: '/' },
    { label: 'About', to: '/', hash: '#about' },
    { label: 'Training', to: user ? '/training' : '/', hash: user ? undefined : '#training' },
    { label: 'Merch', to: '/shop' },
    { label: 'Races', to: '/', hash: '#races' },
    ...(user ? [] : [{ label: 'Join Us', to: '/', hash: '#contact' }]),
  ];

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
        padding: isMobile ? '0.5rem 0' : overlay ? '1.15rem 0' : '0.9rem 0',
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
          <div style={{ width: isMobile ? '38px' : '56px', height: isMobile ? '38px' : '56px', borderRadius: '999px', overflow: 'hidden', flexShrink: 0 }}>
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

        {/* Mobile: cart + animated hamburger. The theme + brand toggles moved into
            the drawer's Appearance row (matching the mobile reference). */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CartBadge count={cartCount} onClick={closeMenu} />
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              style={{
                position: 'relative',
                background: 'transparent',
                border: `1px solid ${c.border}`,
                width: '2.38rem',
                height: '2.38rem',
                borderRadius: '999px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ position: 'relative', width: '18px', height: '13px' }}>
                <span style={{ position: 'absolute', left: 0, top: menuOpen ? '5.5px' : '0px', width: '18px', height: '2px', borderRadius: '2px', background: c.text, transform: menuOpen ? 'rotate(45deg)' : 'rotate(0deg)', transformOrigin: 'center', transition: 'top 0.28s cubic-bezier(0.65,0,0.35,1), transform 0.28s cubic-bezier(0.65,0,0.35,1)' }} />
                <span style={{ position: 'absolute', left: 0, top: '5.5px', width: '18px', height: '2px', borderRadius: '2px', background: c.text, opacity: menuOpen ? 0 : 1, transition: 'opacity 0.18s' }} />
                <span style={{ position: 'absolute', left: 0, top: menuOpen ? '5.5px' : '11px', width: '18px', height: '2px', borderRadius: '2px', background: c.text, transform: menuOpen ? 'rotate(-45deg)' : 'rotate(0deg)', transformOrigin: 'center', transition: 'top 0.28s cubic-bezier(0.65,0,0.35,1), transform 0.28s cubic-bezier(0.65,0,0.35,1)' }} />
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile full-screen drawer — matches the AlpasPinas mobile reference: a
          fade-in overlay with oversized Anton nav links, an Appearance row (brand
          swatch + light/dark toggle), and auth-aware actions below. */}
      {isMobile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          style={{
            // Explicit viewport sizing (not inset:0) because the nav's
            // backdrop-filter makes it the containing block for fixed children —
            // inset:0 would size the drawer to the bar, not the screen.
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100dvh',
            zIndex: 200,
            background: c.background,
            display: 'flex',
            flexDirection: 'column',
            opacity: menuOpen ? 1 : 0,
            pointerEvents: menuOpen ? 'auto' : 'none',
            transition: 'opacity 0.22s ease',
          }}
        >
          {/* Header: logo + close */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', height: '60px', borderBottom: `1px solid ${c.border}`, flexShrink: 0 }}>
            <Link to="/" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', textDecoration: 'none', color: c.text }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '999px', overflow: 'hidden', flexShrink: 0 }}>
                <img src="/logo.jpg" alt="AlpasPinas" style={{ width: '130%', height: '130%', marginLeft: '-15%', marginTop: '-15%', objectFit: 'cover', display: 'block' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', letterSpacing: '0.03em', color: c.text }}>
                ALPAS<span style={{ color: c.primary }}>PINAS</span>
              </span>
            </Link>
            <button
              onClick={closeMenu}
              aria-label="Close menu"
              style={{ width: '2.38rem', height: '2.38rem', borderRadius: '999px', border: `1px solid ${c.border}`, background: 'transparent', color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <CloseIcon size={18} />
            </button>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 26px 26px', display: 'flex', flexDirection: 'column' }}>
            {/* Oversized nav links, staggered fade-in */}
            <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '10px' }}>
              {drawerLinks.map((item, i) => {
                const active = item.hash
                  ? location.pathname === item.to && location.hash === item.hash
                  : location.pathname === item.to && !location.hash;
                return (
                  <NavLink
                    key={item.label}
                    to={{ pathname: item.to, hash: item.hash ?? '' }}
                    onClick={closeMenu}
                    className={menuOpen ? 'drawer-item-in' : undefined}
                    style={{
                      animationDelay: `${0.08 + i * 0.05}s`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '13px 4px',
                      textDecoration: 'none',
                      borderBottom: `1px solid ${c.border}`,
                      color: active ? c.primary : c.text,
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.4rem',
                      letterSpacing: '0.02em',
                    }}
                  >
                    <span>{item.label}</span>
                    <ChevronRight />
                  </NavLink>
                );
              })}

              {canSeeAdmin && (
                <NavLink
                  to="/admin"
                  onClick={closeMenu}
                  className={menuOpen ? 'drawer-item-in' : undefined}
                  style={({ isActive }) => ({
                    animationDelay: `${0.08 + drawerLinks.length * 0.05}s`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '13px 4px',
                    textDecoration: 'none',
                    borderBottom: `1px solid ${c.border}`,
                    color: isActive ? c.primary : c.text,
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.4rem',
                    letterSpacing: '0.02em',
                  })}
                >
                  <span>Admin</span>
                  <ChevronRight />
                </NavLink>
              )}
            </div>

            {/* Appearance row — brand swatch + light/dark toggle */}
            <div
              className={menuOpen ? 'drawer-item-in' : undefined}
              style={{ animationDelay: '0.5s', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 4px', marginTop: '4px', borderBottom: `1px solid ${c.border}` }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: c.textSecondary }}>Appearance</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={toggleBrand}
                  aria-label={`Switch color theme (currently ${brand})`}
                  title={`Color: ${brand} — tap to switch`}
                  style={{ background: 'transparent', border: `1px solid ${c.border}`, width: '32px', height: '32px', borderRadius: '999px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                >
                  <span style={{ width: '16px', height: '16px', borderRadius: '999px', background: brandGradient(brand, theme) }} />
                </button>
                <button
                  onClick={toggleTheme}
                  aria-label="Toggle light or dark theme"
                  style={{ background: 'transparent', color: c.text, border: `1px solid ${c.border}`, width: '32px', height: '32px', borderRadius: '999px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {theme === 'dark' ? <SunIcon size={15} /> : <MoonIcon size={15} />}
                </button>
              </div>
            </div>

            {/* Signed-in user identity */}
            {user && (
              <div
                className={menuOpen ? 'drawer-item-in' : undefined}
                style={{ animationDelay: '0.53s', display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 4px', borderBottom: `1px solid ${c.border}` }}
              >
                <UserIcon size={18} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: c.text }}>{user.name}</div>
                  {user.mobile && (
                    <div style={{ fontSize: '0.8rem', color: c.textSecondary, marginTop: '2px' }}>{user.mobile}</div>
                  )}
                </div>
              </div>
            )}

            {/* Auth-aware actions */}
            {user ? (
              <>
                <Link
                  to="/orders"
                  onClick={closeMenu}
                  className={menuOpen ? 'drawer-item-in' : undefined}
                  style={{ animationDelay: '0.56s', padding: '16px 4px', textDecoration: 'none', color: c.text, fontWeight: 600, fontSize: '1rem', borderBottom: `1px solid ${c.border}` }}
                >
                  My Orders
                </Link>
                <button
                  onClick={() => { logout(); closeMenu(); }}
                  className={menuOpen ? 'drawer-item-in' : undefined}
                  style={{ animationDelay: '0.6s', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: `1px solid ${c.border}`, padding: '16px 4px', color: '#e5484d', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={closeMenu}
                className={menuOpen ? 'drawer-item-in' : undefined}
                style={{ animationDelay: '0.56s', padding: '16px 4px', textDecoration: 'none', color: c.text, fontWeight: 600, fontSize: '1rem', borderBottom: `1px solid ${c.border}` }}
              >
                Login
              </Link>
            )}

            {/* Join CTA */}
            {!user && (
              <Link
                to="/join-team"
                onClick={closeMenu}
                className={menuOpen ? 'drawer-item-in' : undefined}
                style={{ animationDelay: '0.64s', marginTop: '20px', textAlign: 'center', background: brandGradient(brand, theme), color: '#fff', padding: '1rem 1.3rem', borderRadius: '999px', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', letterSpacing: '0.02em', boxShadow: `0 6px 18px ${c.primary}47` }}
              >
                Join the Team
              </Link>
            )}

            <div
              className={menuOpen ? 'drawer-item-in' : undefined}
              style={{ animationDelay: '0.7s', marginTop: 'auto', paddingTop: '26px', fontSize: '0.78rem', color: c.textSecondary, textAlign: 'center' }}
            >
              One stroke. One team.
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
