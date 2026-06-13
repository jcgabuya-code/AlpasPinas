import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';
import { useIsMobile } from '../hooks/useIsMobile';

export const Contact: React.FC = () => {
  const { theme } = useTheme();
  const c = colors[theme];
  const isMobile = useIsMobile();
  const [focused, setFocused] = useState<string | null>(null);

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '0.85rem 1rem',
    borderRadius: '0.55rem',
    backgroundColor: c.background,
    color: c.text,
    boxSizing: 'border-box',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  };

  const inputStyle = (id: string): React.CSSProperties => ({
    ...inputBase,
    border: `1px solid ${focused === id ? c.primary : c.border}`,
  });

  return (
    <section
      id="contact"
      style={{
        backgroundColor: c.sand,
        padding: isMobile ? '3rem 1rem' : '6rem 1.5rem',
        borderTop: `1px solid ${c.border}`,
      }}
    >
      <div
        style={{
          maxWidth: '1080px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1.2fr)',
          gap: isMobile ? '2rem' : '3rem',
          alignItems: 'start',
        }}
      >
        {/* Left: copy + meta */}
        <div>
          <span
            style={{
              display: 'inline-block',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              border: `1px solid ${c.primary}55`,
              backgroundColor: `${c.primary}15`,
              color: c.primary,
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '1rem',
            }}
          >
            ✦ Get in Touch
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.25rem, 6vw, 3.5rem)',
              color: c.text,
              margin: '0 0 1rem 0',
              letterSpacing: '0.02em',
              lineHeight: 1,
            }}
          >
            JOIN THE <span style={{ color: c.primary }}>CREW</span>
          </h2>
          <p
            style={{
              color: c.textSecondary,
              fontSize: '1rem',
              lineHeight: 1.6,
              marginBottom: '2rem',
              maxWidth: '380px',
            }}
          >
            Curious about training, races, or just want to come try a session?
            Drop us a note and we'll get back within a day or two.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
            <ContactRow icon="📍" label="Training base" value="Marina Putrajaya / Subang PARC · weekends" color={c.primary} textColor={c.text} subColor={c.textSecondary} />
            <ContactRow icon="✉" label="Email" value="admin@alpaspinas.com" color={c.primary} textColor={c.text} subColor={c.textSecondary} />
            <ContactRow icon="📱" label="Instagram" value="@alpaspinasdbt" color={c.primary} textColor={c.text} subColor={c.textSecondary} />
          </ul>
        </div>

        {/* Right: form */}
        <form
          onSubmit={(e) => e.preventDefault()}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.1rem',
            padding: '2rem',
            backgroundColor: c.surface,
            borderRadius: '1rem',
            border: `1px solid ${c.border}`,
          }}
        >
          <Field label="Name" color={c.text}>
            <input
              id="name"
              type="text"
              placeholder="Your name"
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              style={inputStyle('name')}
            />
          </Field>

          <Field label="Email" color={c.text}>
            <input
              id="email"
              type="email"
              placeholder="you@email.com"
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              style={inputStyle('email')}
            />
          </Field>

          <Field label="Experience" color={c.text}>
            <select
              id="exp"
              onFocus={() => setFocused('exp')}
              onBlur={() => setFocused(null)}
              style={inputStyle('exp')}
              defaultValue="any"
            >
              <option value="any">Pick one…</option>
              <option value="none">Never paddled before</option>
              <option value="some">A bit — kayak / outrigger / etc.</option>
              <option value="dragon">Done dragon boat before</option>
            </select>
          </Field>

          <Field label="Message" color={c.text}>
            <textarea
              id="msg"
              placeholder="Tell us a bit about yourself…"
              rows={4}
              onFocus={() => setFocused('msg')}
              onBlur={() => setFocused(null)}
              style={{ ...inputStyle('msg'), resize: 'vertical', minHeight: '110px' }}
            />
          </Field>

          <button
            type="submit"
            style={{
              backgroundColor: c.primary,
              color: '#fff',
              border: 'none',
              padding: '0.95rem 1.25rem',
              borderRadius: '0.55rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.02em',
              boxShadow: `0 8px 24px ${c.primary}33`,
            }}
          >
            Send Message →
          </button>
        </form>
      </div>
    </section>
  );
};

const Field: React.FC<{ label: string; color: string; children: React.ReactNode }> = ({ label, color, children }) => (
  <label style={{ display: 'block' }}>
    <span
      style={{
        display: 'block',
        fontSize: '0.78rem',
        fontWeight: 600,
        color,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: '0.4rem',
      }}
    >
      {label}
    </span>
    {children}
  </label>
);

const ContactRow: React.FC<{
  icon: string;
  label: string;
  value: string;
  color: string;
  textColor: string;
  subColor: string;
}> = ({ icon, label, value, color, textColor, subColor }) => (
  <li style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
    <span
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '0.55rem',
        backgroundColor: `${color}1f`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.05rem',
        flexShrink: 0,
      }}
    >
      {icon}
    </span>
    <div>
      <div
        style={{
          fontSize: '0.7rem',
          color: subColor,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '0.15rem',
        }}
      >
        {label}
      </div>
      <div style={{ color: textColor, fontWeight: 500, fontSize: '0.95rem' }}>{value}</div>
    </div>
  </li>
);
