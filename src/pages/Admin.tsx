import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors, emeraldGradient, type ColorPalette } from '../styles/colors';
import {
  LayoutDashboard,
  ClipboardList,
  Anchor,
  CalendarDays,
  Users,
  Menu,
  X,
  ShieldCheck,
  Home,
} from 'lucide-react';

// Section components — lazy-loaded inline after the shell
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminSignups } from './admin/AdminSignups';
import { AdminBoats } from './admin/AdminBoats';
import { AdminEvents } from './admin/AdminEvents';
import { AdminRoster } from './admin/AdminRoster';

/* ------------------------------------------------------------------ */

const ADMIN_PIN = (import.meta.env.VITE_ADMIN_PIN ?? 'alpas2025').trim();
const AUTH_KEY = 'alpas-admin-auth';

export type AdminSection = 'dashboard' | 'signups' | 'boats' | 'events' | 'roster';
export type ToastType = 'success' | 'error' | 'info';
export type ShowToast = (msg: string, type?: ToastType) => void;

const SECTIONS: { id: AdminSection; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard',        icon: LayoutDashboard },
  { id: 'signups',   label: 'Sign-ups',          icon: ClipboardList  },
  { id: 'boats',     label: 'Boat Assignments',  icon: Anchor         },
  { id: 'events',    label: 'Events',            icon: CalendarDays   },
  { id: 'roster',    label: 'Roster',            icon: Users          },
];

/* ------------------------------------------------------------------ */

const Admin: React.FC = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === '1');
  const { theme } = useTheme();
  const navigate = useNavigate();

  if (!authed) {
    return (
      <PinGate
        theme={theme}
        onSuccess={() => {
          sessionStorage.setItem(AUTH_KEY, '1');
          setAuthed(true);
        }}
      />
    );
  }

  return (
    <AdminShell
      onLogout={() => {
        sessionStorage.removeItem(AUTH_KEY);
        setAuthed(false);
        navigate('/');
      }}
    />
  );
};

export default Admin;

/* ------------------------------------------------------------------ */

const PinGate: React.FC<{ theme: 'dark' | 'light'; onSuccess: () => void }> = ({
  theme,
  onSuccess,
}) => {
  const c = colors[theme];
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      onSuccess();
    } else {
      setError(true);
      setPin('');
      inputRef.current?.focus();
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.background,
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: 'min(380px, 100%)',
          backgroundColor: c.surface,
          border: `1px solid ${c.border}`,
          borderRadius: '1rem',
          overflow: 'hidden',
          boxShadow: theme === 'dark' ? '0 24px 64px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ height: '3px', background: emeraldGradient(theme) }} />
        <div style={{ padding: '2rem 1.75rem' }}>
          <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <ShieldCheck size={32} color={c.primary} />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.9rem',
                color: c.text,
                letterSpacing: '0.03em',
                lineHeight: 1,
              }}
            >
              ALPAS<span style={{ color: c.primary }}>PINAS</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: c.textSecondary, marginTop: '0.35rem' }}>
              Admin panel
            </div>
          </div>

          <form onSubmit={submit}>
            <label
              htmlFor="admin-pin"
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: c.textSecondary,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
              }}
            >
              Admin PIN
            </label>
            <input
              ref={inputRef}
              id="admin-pin"
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(false); }}
              autoFocus
              autoComplete="current-password"
              placeholder="Enter PIN"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.6rem',
                border: `1px solid ${error ? '#ef4444' : c.border}`,
                backgroundColor: c.background,
                color: c.text,
                fontSize: '1rem',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
            />
            {error && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#ef4444', fontWeight: 500 }}>
                Incorrect PIN. Try again.
              </div>
            )}
            <button
              type="submit"
              style={{
                marginTop: '1.1rem',
                width: '100%',
                padding: '0.8rem',
                borderRadius: '0.6rem',
                border: 'none',
                background: emeraldGradient(theme),
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */

type ToastState = { msg: string; type: ToastType } | null;

const AdminShell: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const c = colors[theme];
  const [active, setActive] = useState<AdminSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const showToast: ShowToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), type === 'error' ? 7000 : 3200);
  };

  const setActiveSection = (s: AdminSection) => {
    setActive(s);
    setSidebarOpen(false);
  };

  const sidebarContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: c.surface,
        borderRight: `1px solid ${c.border}`,
        padding: '1.25rem 0',
      }}
    >
      {/* Brand */}
      <div style={{ padding: '0 1.25rem 1.25rem', borderBottom: `1px solid ${c.border}` }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            color: c.text,
            letterSpacing: '0.03em',
            lineHeight: 1,
          }}
        >
          ALPAS<span style={{ color: c.primary }}>PINAS</span>
        </div>
        <span
          style={{
            display: 'inline-block',
            marginTop: '0.35rem',
            padding: '0.2rem 0.55rem',
            borderRadius: '999px',
            background: `${c.primary}18`,
            border: `1px solid ${c.primary}44`,
            color: c.primary,
            fontSize: '0.62rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.75rem 0' }}>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            width: '100%',
            padding: '0.65rem 0.75rem',
            borderRadius: '0.55rem',
            border: 'none',
            backgroundColor: 'transparent',
            color: c.textSecondary,
            fontWeight: 500,
            fontSize: '0.88rem',
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: 'inherit',
            letterSpacing: '0.01em',
            marginBottom: '0.15rem',
            transition: 'background-color 0.12s, color 0.12s',
          }}
          title="Go to home page"
        >
          <Home size={16} />
          Home
        </button>
        {SECTIONS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: '0.55rem',
                border: 'none',
                backgroundColor: isActive ? `${c.primary}18` : 'transparent',
                color: isActive ? c.primary : c.textSecondary,
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.88rem',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '0.01em',
                marginBottom: '0.15rem',
                transition: 'background-color 0.12s, color 0.12s',
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Sign out */}
      <div style={{ padding: '0.75rem' }}>
        <button
          type="button"
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            width: '100%',
            padding: '0.65rem 0.75rem',
            borderRadius: '0.55rem',
            border: `1px solid ${c.border}`,
            backgroundColor: 'transparent',
            color: c.textSecondary,
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );

  const currentLabel = SECTIONS.find((s) => s.id === active)?.label ?? '';

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', backgroundColor: c.background }}>
      {/* Desktop sidebar */}
      <div
        style={{
          width: '220px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100dvh',
          display: 'none',
        }}
        className="admin-sidebar-desktop"
      >
        {sidebarContent}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(2px)',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '240px',
              zIndex: 201,
            }}
          >
            {sidebarContent}
          </div>
        </>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile top bar */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0 1rem',
            height: '52px',
            borderBottom: `1px solid ${c.border}`,
            backgroundColor: c.surface,
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
          className="admin-topbar"
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'transparent',
              border: `1px solid ${c.border}`,
              color: c.text,
              width: '34px',
              height: '34px',
              borderRadius: '0.4rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: c.text }}>{currentLabel}</span>
        </header>

        {/* Section content */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <SectionContent active={active} showToast={showToast} c={c} theme={theme} />
        </main>
      </div>

      {/* Toast */}
      {toast && <Toast toast={toast} />}

      {/* Responsive: show sidebar on ≥768px, hide topbar */}
      <style>{`
        @media (min-width: 768px) {
          .admin-sidebar-desktop { display: block !important; }
          .admin-topbar { display: none !important; }
        }
      `}</style>
    </div>
  );
};

/* ------------------------------------------------------------------ */

const SectionContent: React.FC<{
  active: AdminSection;
  showToast: ShowToast;
  c: ColorPalette;
  theme: 'dark' | 'light';
}> = ({ active, showToast, c, theme }) => {
  switch (active) {
    case 'dashboard': return <AdminDashboard showToast={showToast} c={c} theme={theme} />;
    case 'signups':   return <AdminSignups   showToast={showToast} c={c} theme={theme} />;
    case 'boats':     return <AdminBoats     showToast={showToast} c={c} theme={theme} />;
    case 'events':    return <AdminEvents    showToast={showToast} c={c} theme={theme} />;
    case 'roster':    return <AdminRoster    showToast={showToast} c={c} theme={theme} />;
    default:          return null;
  }
};

/* ------------------------------------------------------------------ */

const Toast: React.FC<{ toast: { msg: string; type: ToastType } }> = ({ toast }) => {
  const isError = toast.type === 'error';
  const bg   = toast.type === 'success' ? '#16a34a' : isError ? '#ef4444' : '#0ea5e9';
  const icon = toast.type === 'success' ? '✓' : isError ? '✗' : 'ℹ';
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 300,
        padding: isError ? '0.85rem 1.25rem' : '0.65rem 1.25rem',
        borderRadius: isError ? '0.75rem' : '999px',
        backgroundColor: bg,
        color: '#fff',
        fontWeight: 600,
        fontSize: '0.85rem',
        lineHeight: 1.5,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        maxWidth: 'min(480px, calc(100vw - 2rem))',
        whiteSpace: isError ? 'normal' : 'nowrap',
        textAlign: isError ? 'left' : undefined,
      }}
    >
      <span style={{ marginRight: '0.4rem' }}>{icon}</span>{toast.msg}
    </div>
  );
};
