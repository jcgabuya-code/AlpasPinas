import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { colors, brandGradient } from '../styles/colors';
import { useIsMobile } from '../hooks/useIsMobile';

/**
 * The new-member onboarding brand stage — a single two-panel card shared across
 * the four onboarding moments (Apply → Applied → Register → Welcome). The LEFT
 * panel is the immersive brand stage (aurora gradient, ALPASPINAS wordmark,
 * cadence pulse, a big Anton headline, and a vertical progress rail) — it stays
 * a fixed vivid bandila gradient in both themes, a hero moment rather than a
 * themed surface. The RIGHT panel hosts each screen's flow via `children` and
 * follows the site's light/dark theme, always on the bandila palette.
 */

export type OnboardingScreen = 'apply' | 'applied' | 'register' | 'welcome';

/** Fixed accent for the always-vivid left brand stage (not theme-driven). */
export const LEFT_SUN = '#fcd116';

export type OnbTokens = ReturnType<typeof useOnbTokens>;

/** Theme-aware tokens for the right-hand form panel and shared components. */
export const useOnbTokens = () => {
  const { theme } = useTheme();
  const c = colors.bandila[theme];
  return {
    bg: c.background,
    panel: c.surface,
    field: c.surfaceAlt,
    border: c.border,
    text: c.text,
    sub: c.textSecondary,
    accent: c.accent,
    accentLight: theme === 'light' ? c.accent : c.primaryLight,
    sun: c.sun,
    gradient: brandGradient('bandila', theme),
  };
};

export const onbLabelStyle = (onb: OnbTokens): React.CSSProperties => ({
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: onb.sub,
  display: 'block',
  margin: '0 0 0.4rem',
});

export const onbFieldStyle = (onb: OnbTokens): React.CSSProperties => ({
  width: '100%',
  padding: '0.75rem 0.9rem',
  borderRadius: '0.7rem',
  border: `1px solid ${onb.border}`,
  background: onb.field,
  color: onb.text,
  fontSize: '0.95rem',
  fontFamily: 'inherit',
});

export const onbPrimaryBtnStyle = (onb: OnbTokens): React.CSSProperties => ({
  width: '100%',
  background: onb.gradient,
  color: '#fff',
  border: 'none',
  borderRadius: '0.75rem',
  padding: '0.95rem',
  fontSize: '0.95rem',
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 12px 30px rgba(0,56,168,.4)',
  minHeight: '46px',
  fontFamily: 'inherit',
});

export const onbGhostBtnStyle = (onb: OnbTokens): React.CSSProperties => ({
  flex: 1,
  background: onb.field,
  border: `1px solid ${onb.border}`,
  color: onb.text,
  borderRadius: '0.75rem',
  padding: '0.8rem',
  fontSize: '0.92rem',
  fontWeight: 700,
  cursor: 'pointer',
  minHeight: '44px',
  fontFamily: 'inherit',
});

/** A bordered info/checklist row (icon + title + body) used on Applied & Welcome. */
export const OnbInfoRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay?: string;
}> = ({ icon, title, children, delay = '0s' }) => {
  const onb = useOnbTokens();
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.7rem',
        alignItems: 'flex-start',
        background: onb.field,
        border: `1px solid ${onb.border}`,
        borderRadius: '0.8rem',
        padding: '0.85rem',
        marginBottom: '0.6rem',
        animation: `onbRiseIn .5s ${delay} both`,
      }}
    >
      <span style={{ color: onb.accent, flex: '0 0 auto', display: 'flex', paddingTop: '1px' }}>{icon}</span>
      <div style={{ fontSize: '0.85rem' }}>
        <b style={{ display: 'block', color: onb.text, fontWeight: 700, marginBottom: '2px' }}>{title}</b>
        <span style={{ color: onb.sub, lineHeight: 1.45 }}>{children}</span>
      </div>
    </div>
  );
};

const LEFT_COPY: Record<OnboardingScreen, { kicker: string; a: string; b: string; sub: string }> = {
  apply: { kicker: 'New member', a: 'Paddle', b: 'with us', sub: 'A Filipino-rooted, internationally open dragon boat crew.' },
  applied: { kicker: 'Application in', a: "You're", b: 'on the list', sub: 'Check your inbox — your registration link is on its way.' },
  register: { kicker: 'Registration', a: 'Get in', b: 'the boat', sub: 'A few details so we can seat you right and keep you safe.' },
  welcome: { kicker: "You're in", a: 'Welcome', b: 'aboard', sub: 'Everything you need for session one, all in one place.' },
};

const RAIL_LABELS = ['Apply', 'Review', 'Register', 'Aboard'];
const SCREEN_INDEX: Record<OnboardingScreen, number> = { apply: 0, applied: 1, register: 2, welcome: 3 };

export const OnboardingShell: React.FC<{
  screen: OnboardingScreen;
  /** Appended to the Welcome headline ("Welcome / aboard, {firstName}"). */
  firstName?: string;
  children: React.ReactNode;
}> = ({ screen, firstName, children }) => {
  const onb = useOnbTokens();
  const isMobile = useIsMobile();
  const idx = SCREEN_INDEX[screen];
  const copy = LEFT_COPY[screen];
  const titleB = screen === 'welcome' && firstName ? `aboard, ${firstName}` : copy.b;
  const railFill = idx === 0 ? '0%' : `${(idx / 3) * 100}%`;

  const dotBase: React.CSSProperties = {
    position: 'relative',
    zIndex: 1,
    flex: '0 0 auto',
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.72rem',
    fontWeight: 800,
    transition: 'all 0.35s',
  };

  if (isMobile) {
    const mobileDotBase: React.CSSProperties = { ...dotBase, width: '26px', height: '26px' };
    const trackFill = idx === 0 ? '0%' : `calc((100% - 26px) * ${idx / 3})`;
    return (
      <div style={{ minHeight: '100vh', background: onb.bg, fontFamily: 'var(--font-body)', color: onb.text, display: 'flex', flexDirection: 'column' }}>
        {/* ================= HEADER · BRAND STAGE ================= */}
        <div
          className="onb-aurora"
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '1.5rem 1.4rem 1.5rem',
            background: 'linear-gradient(130deg,#001b66 0%,#0038a8 30%,#3b5bdb 55%,#7a1f7a 78%,#ce1126 100%)',
            backgroundSize: '280% 280%',
            borderRadius: '0 0 26px 26px',
          }}
        >
          <div className="onb-orb-a" style={{ position: 'absolute', top: '-60px', left: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,255,255,.35),transparent 70%)', filter: 'blur(24px)', opacity: 0.5, pointerEvents: 'none' }} />
          <div className="onb-orb-b" style={{ position: 'absolute', bottom: '-70px', right: '-30px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle,#ce1126,transparent 70%)', filter: 'blur(26px)', opacity: 0.45, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 80% at 15% 0%,transparent 45%,rgba(0,0,0,.32) 100%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', fontFamily: 'var(--font-display)', fontSize: '1.05rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#fff' }}>
            ALPAS<span style={{ color: LEFT_SUN }}>PINAS</span>
          </div>

          <div key={screen} className="onb-head" style={{ position: 'relative', marginTop: '1.5rem' }}>
            <div style={{ fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.8)', marginBottom: '0.55rem' }}>
              {copy.kicker}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', lineHeight: 0.98, textTransform: 'uppercase', margin: 0, color: '#fff', letterSpacing: '0.01em', textShadow: '0 5px 24px rgba(0,0,0,.28)' }}>
              {copy.a} {titleB}
            </h1>
          </div>

          {/* horizontal step tracker */}
          <div style={{ position: 'relative', marginTop: '1.5rem' }}>
            <div style={{ position: 'absolute', left: '13px', right: '13px', top: '12px', height: '2px', background: 'rgba(255,255,255,.2)', borderRadius: '2px' }} />
            <div style={{ position: 'absolute', left: '13px', top: '11px', height: '4px', background: 'linear-gradient(90deg,#fcd116,#fff)', borderRadius: '2px', width: trackFill, transition: 'width .55s cubic-bezier(.2,.7,.2,1)', boxShadow: '0 0 10px rgba(252,209,22,.5)' }} />
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
              {RAIL_LABELS.map((label, i) => {
                const done = i < idx;
                const active = i === idx;
                const dotStyle: React.CSSProperties = done
                  ? { ...mobileDotBase, background: 'rgba(255,255,255,.95)', border: '2px solid #fff', color: '#0038a8' }
                  : active
                    ? { ...mobileDotBase, background: LEFT_SUN, border: `2px solid ${LEFT_SUN}`, color: '#0a1018', boxShadow: '0 0 0 5px rgba(252,209,22,.22)' }
                    : { ...mobileDotBase, background: 'rgba(255,255,255,.1)', border: '2px solid rgba(255,255,255,.28)', color: 'rgba(255,255,255,.6)' };
                return (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', width: '26px' }}>
                    <div style={dotStyle}>{done ? '✓' : String(i + 1)}</div>
                    <div style={{ fontSize: '0.62rem', fontWeight: active ? 800 : 600, color: i <= idx ? '#fff' : 'rgba(255,255,255,.55)', transition: 'color .35s', whiteSpace: 'nowrap' }}>{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= CONTENT · FLOW ================= */}
        <div style={{ flex: 1, padding: '1.6rem 1.4rem 1.5rem' }}>
          <div key={screen} className="onb-screen" style={{ width: '100%' }}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: onb.bg,
        fontFamily: 'var(--font-body)',
        color: onb.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      {/* ambient drifting orbs */}
      <div
        className="onb-orb-a"
        style={{ position: 'absolute', top: '-120px', left: '-80px', width: '460px', height: '460px', borderRadius: '50%', background: 'radial-gradient(circle,#0038a8,transparent 70%)', filter: 'blur(30px)', opacity: 0.5, pointerEvents: 'none' }}
      />
      <div
        className="onb-orb-b"
        style={{ position: 'absolute', bottom: '-140px', right: '-60px', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle,#ce1126,transparent 70%)', filter: 'blur(34px)', opacity: 0.4, pointerEvents: 'none' }}
      />
      <div
        className="onb-orb-c"
        style={{ position: 'absolute', top: '40%', left: '50%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle,#fcd116,transparent 70%)', filter: 'blur(46px)', opacity: 0.12, pointerEvents: 'none' }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '960px',
          display: 'flex',
          flexWrap: 'wrap',
          borderRadius: '26px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,.09)',
          boxShadow: '0 40px 120px rgba(0,20,80,.55), 0 0 0 1px rgba(255,255,255,.02)',
        }}
      >
        {/* ================= LEFT · BRAND STAGE ================= */}
        <div
          className="onb-aurora"
          style={{
            position: 'relative',
            flex: '1 1 360px',
            minHeight: '560px',
            overflow: 'hidden',
            padding: '2.4rem 2.2rem',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(130deg,#001b66 0%,#0038a8 30%,#3b5bdb 55%,#7a1f7a 78%,#ce1126 100%)',
            backgroundSize: '280% 280%',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 20% 0%,transparent 40%,rgba(0,0,0,.35) 100%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', fontFamily: 'var(--font-display)', fontSize: '1.15rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#fff' }}>
            ALPAS<span style={{ color: LEFT_SUN }}>PINAS</span>
          </div>

          {/* headline — re-keyed per screen so it rises in on change */}
          <div key={screen} className="onb-head" style={{ position: 'relative', marginTop: '2.6rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.8)', marginBottom: '0.7rem' }}>
              {copy.kicker}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3.1rem', lineHeight: 0.98, textTransform: 'uppercase', margin: 0, color: '#fff', letterSpacing: '0.01em', textShadow: '0 6px 30px rgba(0,0,0,.28)' }}>
              {copy.a}
              <br />
              {titleB}
            </h1>
            <p style={{ margin: '1.1rem 0 0', maxWidth: '280px', fontSize: '0.95rem', lineHeight: 1.55, color: 'rgba(255,255,255,.82)' }}>{copy.sub}</p>
          </div>

          {/* progress rail */}
          <div style={{ position: 'relative', marginTop: 'auto', paddingTop: '1.8rem' }}>
            <div style={{ position: 'absolute', left: '12px', top: '2.6rem', bottom: '12px', width: '2px', background: 'rgba(255,255,255,.16)', borderRadius: '2px' }} />
            <div style={{ position: 'absolute', left: '11px', top: '2.6rem', width: '4px', background: 'linear-gradient(#fcd116,#fff)', borderRadius: '2px', height: railFill, transition: 'height .55s cubic-bezier(.2,.7,.2,1)', boxShadow: '0 0 12px rgba(252,209,22,.5)' }} />
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.05rem' }}>
              {RAIL_LABELS.map((label, i) => {
                const done = i < idx;
                const active = i === idx;
                const dotStyle: React.CSSProperties = done
                  ? { ...dotBase, background: 'rgba(255,255,255,.95)', border: '2px solid #fff', color: '#0038a8' }
                  : active
                    ? { ...dotBase, background: LEFT_SUN, border: `2px solid ${LEFT_SUN}`, color: '#0a1018', boxShadow: '0 0 0 6px rgba(252,209,22,.22)' }
                    : { ...dotBase, background: 'rgba(255,255,255,.1)', border: '2px solid rgba(255,255,255,.28)', color: 'rgba(255,255,255,.6)' };
                return (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={dotStyle}>{done ? '✓' : String(i + 1)}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: active ? 800 : 600, color: i <= idx ? '#fff' : 'rgba(255,255,255,.55)', transition: 'color .35s' }}>{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= RIGHT · FLOW ================= */}
        <div style={{ flex: '1 1 420px', minWidth: '320px', background: onb.panel, padding: '2.6rem 2.4rem', display: 'flex', alignItems: 'center' }}>
          <div key={screen} className="onb-screen" style={{ width: '100%', maxWidth: '360px', margin: '0 auto' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
