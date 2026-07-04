import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { colors, brandGradient } from '../styles/colors';
import { useIsMobile } from '../hooks/useIsMobile';
import { SectionHeader } from './SectionHeader';
import { sectionShell, cadenceAccentUri } from '../styles/tokens';

// Line-art glyphs (handmade) to match the site's icon system.
const IconBase: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
export const LocationIcon = () => (
  <IconBase>
    <path d="M12 21s-6.5-5.2-6.5-10.2A6.5 6.5 0 0 1 18.5 10.8C18.5 15.8 12 21 12 21z" />
    <circle cx="12" cy="10.5" r="2.4" />
  </IconBase>
);
export const MailIcon = () => (
  <IconBase>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="M4 7.5l8 5.5 8-5.5" />
  </IconBase>
);
export const InstagramIcon = () => (
  <IconBase>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <circle cx="12" cy="12" r="3.6" />
    <circle cx="16.7" cy="7.3" r="0.7" fill="currentColor" stroke="none" />
  </IconBase>
);
const SeatIcon = ({ size = 22 }: { size?: number }) => (
  <IconBase size={size}>
    <rect x="6" y="11" width="12" height="3.6" rx="1" />
    <path d="M7.5 11V8.2A2.2 2.2 0 0 1 9.7 6h4.6a2.2 2.2 0 0 1 2.2 2.2V11" />
    <path d="M8 14.6V18M16 14.6V18" />
  </IconBase>
);
const CheckIcon = ({ size = 24 }: { size?: number }) => (
  <IconBase size={size}>
    <path d="M4 12.5l5 5 11-11" />
  </IconBase>
);
const AlertIcon = ({ size = 18 }: { size?: number }) => (
  <IconBase size={size}>
    <path d="M12 4 19.5 18.5 H4.5 Z" />
    <path d="M12 9.5v4" />
    <path d="M12 16.5h.01" />
  </IconBase>
);

type Values = { name: string; email: string; exp: string; message: string };
type Errors = { name?: string; email?: string };
type Status = 'idle' | 'submitting' | 'success' | 'error';

// INTEGRATION POINT — swap this stub for the real submission: a Supabase
// `applications` insert or an email relay. Resolve on success, throw on failure,
// and the loading/error states below stay wired with no further changes. The
// simulated delay only exists so the "submitting" state is visible until then.
async function submitApplication(_values: Values): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  // throw new Error('not wired'); // ← uncomment to preview the error state
}

export const Contact: React.FC = () => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const isMobile = useIsMobile();
  const accent = theme === 'dark' ? c.primaryLight : c.primary;

  const [values, setValues] = useState<Values>({ name: '', email: '', exp: 'any', message: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [focused, setFocused] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const validate = (): Errors => {
    const next: Errors = {};
    if (!values.name.trim()) next.name = 'Tell us your name';
    if (!values.email.trim()) next.email = 'We need an email to reach you';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = 'That email looks off';
    return next;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setStatus('submitting');
    try {
      await submitApplication(values);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const inputStyle = (id: keyof Errors | 'exp' | 'message', hasError?: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '0.85rem 1rem',
    borderRadius: '0.55rem',
    backgroundColor: c.background,
    color: c.text,
    boxSizing: 'border-box',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    outline: 'none',
    border: `1px solid ${hasError ? '#ef4444' : focused === id ? c.primary : c.border}`,
    transition: 'border-color 0.15s ease',
  });

  return (
    <section id="contact" style={{ backgroundColor: c.background, borderTop: `1px solid ${c.border}`, ...sectionShell }}>
      <div
        style={{
          maxWidth: '1080px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1.15fr)',
          gap: isMobile ? '2rem' : '3rem',
          alignItems: 'start',
        }}
      >
        {/* Left: the invitation */}
        <div>
          <SectionHeader eyebrow="The Open Seat" style={{ marginBottom: '0' }}>
            CLAIM YOUR <span style={{ color: c.primary }}>SEAT</span>
          </SectionHeader>

          {/* Cadence meter — same motif as the hero readout */}
          <div
            aria-hidden="true"
            style={{
              height: '16px',
              width: '100%',
              maxWidth: '300px',
              backgroundImage: cadenceAccentUri(c.sun),
              backgroundRepeat: 'repeat-x',
              backgroundSize: '80px 16px',
              backgroundPosition: 'left center',
              opacity: 0.9,
              WebkitMaskImage: 'linear-gradient(90deg, #000 70%, transparent 100%)',
              maskImage: 'linear-gradient(90deg, #000 70%, transparent 100%)',
              margin: '0.85rem 0 1.4rem',
            }}
          />

          <p style={{ color: c.textSecondary, fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '400px' }}>
            There's a seat in the boat with your name on it. Come try a session —
            no experience needed, all gear provided. We'll get you on the water
            within a week or two.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
            <ContactRow icon={<LocationIcon />} label="Training base" value="Marina Putrajaya / Subang PARC · weekends" color={c.primary} textColor={c.text} subColor={c.textSecondary} />
            <ContactRow icon={<MailIcon />} label="Email" value="admin@alpaspinas.com" color={c.primary} textColor={c.text} subColor={c.textSecondary} />
            <ContactRow icon={<InstagramIcon />} label="Instagram" value="@alpaspinasdbt" color={c.primary} textColor={c.text} subColor={c.textSecondary} />
          </ul>
        </div>

        {/* Right: the seat ticket — form, or the confirmation once claimed */}
        <div
          style={{
            backgroundColor: c.surface,
            borderRadius: '1rem',
            border: `1px solid ${c.border}`,
            overflow: 'hidden',
          }}
        >
          {/* Card header — the open seat */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1.25rem 2rem', borderBottom: `1px solid ${c.border}`, backgroundColor: c.surfaceAlt }}>
            <span
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                flexShrink: 0,
                border: `2px dashed ${c.primary}aa`,
                color: accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SeatIcon />
            </span>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent }}>The open seat</div>
              <div style={{ fontSize: '0.85rem', color: c.textSecondary, marginTop: '0.1rem' }}>One spot in the boat is yours.</div>
            </div>
          </div>

          {status === 'success' ? (
            <div role="status" style={{ padding: '2.75rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
              <span
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: brandGradient(brand, theme),
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.4rem',
                  boxShadow: `0 10px 30px ${c.primary}44`,
                }}
              >
                <CheckIcon size={28} />
              </span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.02em', color: c.text, margin: 0 }}>
                Seat saved.
              </h3>
              <p style={{ color: c.textSecondary, fontSize: '0.95rem', lineHeight: 1.6, margin: 0, maxWidth: '320px' }}>
                Thanks{values.name.trim() ? `, ${values.name.trim().split(/\s+/)[0]}` : ''}! We'll be in touch within a day or two about your first session.
              </p>
              <button
                type="button"
                onClick={() => {
                  setValues({ name: '', email: '', exp: 'any', message: '' });
                  setErrors({});
                  setStatus('idle');
                }}
                style={{ marginTop: '0.6rem', background: 'none', border: 'none', color: c.primary, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Send another →
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', padding: '1.75rem 2rem 2rem' }}>
              {status === 'error' && (
                <div
                  role="alert"
                  style={{
                    display: 'flex',
                    gap: '0.6rem',
                    alignItems: 'flex-start',
                    padding: '0.85rem 1rem',
                    borderRadius: '0.55rem',
                    backgroundColor: '#ef44441a',
                    border: '1px solid #ef444455',
                    color: c.text,
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                  }}
                >
                  <span aria-hidden="true" style={{ color: '#ef4444', flexShrink: 0, display: 'inline-flex', marginTop: '1px' }}>
                    <AlertIcon size={18} />
                  </span>
                  <span>
                    We couldn't send that just now. Please try again — if it keeps happening, email{' '}
                    <a href="mailto:admin@alpaspinas.com" style={{ color: accent, fontWeight: 600 }}>admin@alpaspinas.com</a>.
                  </span>
                </div>
              )}

              <Field label="Name" htmlFor="name" color={c.text} error={errors.name}>
                <input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={values.name}
                  onChange={set('name')}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                  style={inputStyle('name', Boolean(errors.name))}
                />
              </Field>

              <Field label="Email" htmlFor="email" color={c.text} error={errors.email}>
                <input
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  value={values.email}
                  onChange={set('email')}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  style={inputStyle('email', Boolean(errors.email))}
                />
              </Field>

              <Field label="Paddling experience" htmlFor="exp" color={c.text}>
                <select id="exp" value={values.exp} onChange={set('exp')} onFocus={() => setFocused('exp')} onBlur={() => setFocused(null)} style={inputStyle('exp')}>
                  <option value="any">Pick one…</option>
                  <option value="none">Never paddled before</option>
                  <option value="some">A bit — kayak / outrigger / etc.</option>
                  <option value="dragon">Done dragon boat before</option>
                </select>
              </Field>

              <Field label="Message" htmlFor="msg" color={c.text}>
                <textarea
                  id="msg"
                  placeholder="Tell us a bit about yourself…"
                  rows={4}
                  value={values.message}
                  onChange={set('message')}
                  onFocus={() => setFocused('message')}
                  onBlur={() => setFocused(null)}
                  style={{ ...inputStyle('message'), resize: 'vertical', minHeight: '110px' }}
                />
              </Field>

              <button
                type="submit"
                disabled={status === 'submitting'}
                aria-busy={status === 'submitting'}
                style={{
                  background: brandGradient(brand, theme),
                  color: '#fff',
                  border: 'none',
                  padding: '1rem 1.25rem',
                  borderRadius: '0.55rem',
                  fontSize: '0.98rem',
                  fontWeight: 600,
                  cursor: status === 'submitting' ? 'progress' : 'pointer',
                  letterSpacing: '0.02em',
                  fontFamily: 'inherit',
                  boxShadow: `0 10px 28px ${c.primary}44`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  opacity: status === 'submitting' ? 0.9 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {status === 'submitting' ? (
                  <>
                    <span
                      className="btn-spinner"
                      aria-hidden="true"
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.45)',
                        borderTopColor: '#fff',
                        display: 'inline-block',
                      }}
                    />
                    Claiming your seat…
                  </>
                ) : (
                  'Claim my seat →'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

const Field: React.FC<{ label: string; htmlFor: string; color: string; error?: string; children: React.ReactNode }> = ({ label, htmlFor, color, error, children }) => (
  <label htmlFor={htmlFor} style={{ display: 'block' }}>
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
    {error && (
      <span style={{ display: 'block', color: '#ef4444', fontSize: '0.78rem', marginTop: '0.35rem' }}>{error}</span>
    )}
  </label>
);

export const ContactRow: React.FC<{
  icon: React.ReactNode;
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
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
