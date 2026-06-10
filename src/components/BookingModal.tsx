import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { colors, emeraldGradient, type ColorPalette } from '../styles/colors';
import type { TrainingEvent } from './TrainingCard';
import {
  addBooking,
  countForEventDay,
  fetchBookings,
  formatShortDate,
  getAllBookings,
  hasNameBooked,
  type Attending,
  type Gender,
  type SideRole,
  type YesNo,
} from '../utils/bookings';

type BookingModalProps = {
  open: boolean;
  event: TrainingEvent | null;
  onClose: () => void;
};

const GENDERS: Gender[] = ['Male', 'Female'];
const SIDES: SideRole[] = ['Left', 'Right', 'Coxswain', 'Coach'];
const YES_NO: YesNo[] = ['Yes', 'No'];

export const BookingModal: React.FC<BookingModalProps> = ({ open, event, onClose }) => {
  const { theme } = useTheme();
  const c = colors[theme];
  const { user } = useAuth();

  // Form state — name defaults to the logged-in user and is locked to them.
  const [name, setName] = useState(user?.name ?? '');
  const [gender, setGender] = useState<Gender>('Male');
  const [side, setSide] = useState<SideRole>('Left');
  const [weight, setWeight] = useState<string>('');
  const [needPFD, setNeedPFD] = useState<YesNo>('No');
  const [needPaddle, setNeedPaddle] = useState<YesNo>('No');
  const [attending, setAttending] = useState<Attending>('both');
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Bumped after a sheet refresh so dayStats recomputes with live counts.
  const [refreshTick, setRefreshTick] = useState(0);

  // Reset whenever the modal opens for a new event, and pull live counts.
  useEffect(() => {
    if (open && event) {
      setName(user?.name ?? '');
      setGender('Male');
      setSide('Left');
      setWeight('');
      setNeedPFD('No');
      setNeedPaddle('No');
      setAttending('both');
      setError(null);
      setConfirmed(false);
      setSubmitting(false);
      fetchBookings().then(() => setRefreshTick((t) => t + 1));
    }
  }, [open, event, user]);

  // ESC + body scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const dayStats = useMemo(() => {
    if (!event) return [];
    const bookings = getAllBookings();
    return event.days.map((d) => {
      const taken = countForEventDay(bookings, event.id, d.key);
      return { day: d, remaining: Math.max(0, d.capacity - taken), full: taken >= d.capacity };
    });
  }, [event, open, confirmed, refreshTick]); // recompute on open, after a confirm, and on sheet refresh

  if (!open || !event) return null;

  const satStat = dayStats.find((s) => s.day.key === 'sat');
  const sunStat = dayStats.find((s) => s.day.key === 'sun');
  const satFull = satStat?.full ?? false;
  const sunFull = sunStat?.full ?? false;
  const bothFull = satFull && sunFull;

  // If their current selection is now invalid because seats just filled, snap
  // it to a still-open option.
  const effectiveAttending: Attending = (() => {
    if (attending === 'both' && (satFull || sunFull)) {
      if (!satFull) return 'sat';
      if (!sunFull) return 'sun';
    }
    if (attending === 'sat' && satFull && !sunFull) return 'sun';
    if (attending === 'sun' && sunFull && !satFull) return 'sat';
    return attending;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError('Please enter your name.');
    const weightNum = Number(weight);
    if (!weight || Number.isNaN(weightNum) || weightNum < 30 || weightNum > 200)
      return setError('Please enter a weight in kg between 30 and 200.');

    // Re-check against the freshest list from the sheet before writing.
    setSubmitting(true);
    let current = getAllBookings();
    try {
      current = await fetchBookings();
    } catch {
      // fall back to cache if the refresh fails
    }

    if (hasNameBooked(current, event.id, name)) {
      setSubmitting(false);
      return setError('This name is already booked for this weekend.');
    }

    const satTaken = countForEventDay(current, event.id, 'sat');
    const sunTaken = countForEventDay(current, event.id, 'sun');
    const satCap = event.days.find((d) => d.key === 'sat')?.capacity ?? 0;
    const sunCap = event.days.find((d) => d.key === 'sun')?.capacity ?? 0;

    if (effectiveAttending === 'sat' && satTaken >= satCap) {
      setSubmitting(false);
      setRefreshTick((t) => t + 1);
      return setError('Saturday just filled up.');
    }
    if (effectiveAttending === 'sun' && sunTaken >= sunCap) {
      setSubmitting(false);
      setRefreshTick((t) => t + 1);
      return setError('Sunday just filled up.');
    }
    if (effectiveAttending === 'both' && (satTaken >= satCap || sunTaken >= sunCap)) {
      setSubmitting(false);
      setRefreshTick((t) => t + 1);
      return setError('One of the days just filled up — pick a single day instead.');
    }

    try {
      await addBooking({
        eventId: event.id,
        eventTitle: event.title,
        attending: effectiveAttending,
        name: name.trim(),
        gender,
        side,
        weight: weightNum,
        needPFD,
        needPaddle,
      });
      setConfirmed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your sign-up.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Sign up for ${event.title}`}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'alpas-fade-in 160ms ease-out',
      }}
    >
      <style>{`
        @keyframes alpas-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes alpas-pop-in { from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: scale(1) } }
      `}</style>

      <div
        onClick={(ev) => ev.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '560px',
          maxHeight: 'calc(100vh - 3rem)',
          overflowY: 'auto',
          backgroundColor: c.surface,
          color: c.text,
          borderRadius: '0.95rem',
          border: `1px solid ${c.border}`,
          boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${c.primary}22`,
          animation: 'alpas-pop-in 200ms ease-out',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            width: '2rem',
            height: '2rem',
            borderRadius: '999px',
            border: `1px solid ${c.border}`,
            backgroundColor: c.background,
            color: c.text,
            fontSize: '1rem',
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>

        {confirmed ? (
          <WaitingView event={event} attending={effectiveAttending} name={name} onClose={onClose} />
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '1.75rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: c.primary,
                  fontWeight: 700,
                  marginBottom: '0.35rem',
                }}
              >
                Sign up
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.6rem, 4vw, 2.1rem)',
                  margin: 0,
                  letterSpacing: '0.02em',
                  lineHeight: 1.1,
                }}
              >
                {event.title.toUpperCase()}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.65rem' }}>
                {event.days.map((d) => (
                  <div
                    key={d.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.82rem',
                      color: c.textSecondary,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: c.text,
                        minWidth: '7.5rem',
                      }}
                    >
                      {formatShortDate(d.date)}
                    </span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span>{d.time}</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span>{d.location}</span>
                  </div>
                ))}
              </div>
            </div>

            <Field label="Name" c={c}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Brendz Reyes"
                readOnly={!!user}
                style={{
                  ...inputStyle(c),
                  ...(user ? { opacity: 0.7, cursor: 'not-allowed' } : null),
                }}
              />
              {user && (
                <div style={{ fontSize: '0.72rem', color: c.textSecondary, marginTop: '0.3rem' }}>
                  Signing up as your account name.
                </div>
              )}
            </Field>

            <Field label="Gender" c={c}>
              <Chips options={GENDERS} value={gender} onChange={setGender} c={c} />
            </Field>

            <Field label="Paddling side / role" c={c}>
              <Chips options={SIDES} value={side} onChange={setSide} c={c} />
            </Field>

            <Field label="Weight (kg)" c={c}>
              <input
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="72"
                min={30}
                max={200}
                style={inputStyle(c)}
              />
              <div style={{ fontSize: '0.72rem', color: c.textSecondary, marginTop: '0.3rem' }}>
                Used to balance the boat — kept private.
              </div>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="Need PFD?" c={c}>
                <Chips options={YES_NO} value={needPFD} onChange={setNeedPFD} c={c} />
              </Field>
              <Field label="Need paddle?" c={c}>
                <Chips options={YES_NO} value={needPaddle} onChange={setNeedPaddle} c={c} />
              </Field>
            </div>

            <Field label="Joining" c={c}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <AttendingChip
                  label="Saturday only"
                  active={effectiveAttending === 'sat'}
                  disabled={satFull}
                  onClick={() => setAttending('sat')}
                  c={c}
                />
                <AttendingChip
                  label="Sunday only"
                  active={effectiveAttending === 'sun'}
                  disabled={sunFull}
                  onClick={() => setAttending('sun')}
                  c={c}
                />
                <AttendingChip
                  label="Both days"
                  active={effectiveAttending === 'both'}
                  disabled={satFull || sunFull}
                  onClick={() => setAttending('both')}
                  c={c}
                />
              </div>
              <div style={{ fontSize: '0.72rem', color: c.textSecondary, marginTop: '0.4rem' }}>
                {satStat && sunStat && (
                  <>
                    Sat: <strong style={{ color: c.text }}>{satStat.remaining}</strong> seats ·{' '}
                    Sun: <strong style={{ color: c.text }}>{sunStat.remaining}</strong> seats
                  </>
                )}
              </div>
            </Field>

            {error && (
              <div
                role="alert"
                style={{
                  marginBottom: '0.85rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#ef444418',
                  border: '1px solid #ef444466',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={bothFull || submitting}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '0.6rem',
                border: 'none',
                background: bothFull ? c.border : emeraldGradient(theme),
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.95rem',
                letterSpacing: '0.02em',
                cursor: bothFull || submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                opacity: submitting ? 0.8 : 1,
                boxShadow: bothFull ? 'none' : `0 8px 24px ${c.primary}33`,
              }}
            >
              {bothFull ? 'Weekend full' : submitting ? 'Saving…' : 'Confirm sign-up'}
            </button>

            <p
              style={{
                marginTop: '0.85rem',
                fontSize: '0.72rem',
                color: c.textSecondary,
                textAlign: 'center',
                opacity: 0.75,
                lineHeight: 1.5,
              }}
            >
              Your sign-up is saved to the team's Google Sheet.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

const WaitingView: React.FC<{
  event: TrainingEvent;
  attending: Attending;
  name: string;
  onClose: () => void;
}> = ({ event, attending, name, onClose }) => {
  const { theme } = useTheme();
  const c = colors[theme];
  const joined =
    attending === 'both'
      ? event.days.map((d) => `${d.label} (${formatShortDate(d.date)})`).join(' + ')
      : (() => {
          const d = event.days.find((day) => day.key === attending);
          return d ? `${d.label} (${formatShortDate(d.date)}) at ${d.location}` : '';
        })();

  return (
    <div style={{ padding: '2rem 1.75rem', textAlign: 'center' }}>
      {/* Waiting icon — clock/hourglass feel */}
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '999px',
          background: 'linear-gradient(135deg, #d97706, #f59e0b)',
          color: '#fff',
          margin: '0 auto 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.7rem',
          boxShadow: '0 8px 24px #d9770640',
        }}
      >
        ⏳
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          letterSpacing: '0.02em',
          margin: '0 0 0.5rem 0',
          lineHeight: 1.1,
        }}
      >
        YOU'RE ON THE LIST
      </h2>
      <p style={{ color: c.textSecondary, fontSize: '0.92rem', margin: '0 0 0.4rem 0' }}>
        Sign-up received for {joined}.
      </p>
      <p style={{ color: c.textSecondary, fontSize: '0.8rem', margin: '0 0 0.75rem 0' }}>
        Registered as <strong style={{ color: c.text }}>{name}</strong>.
      </p>
      {/* Status pill */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 1rem',
            borderRadius: '999px',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            backgroundColor: '#d9770618',
            color: '#d97706',
            border: '1px solid #d9770644',
          }}
        >
          <span style={{ fontSize: '0.55rem' }}>●</span> Waiting for confirmation
        </span>
      </div>
      <p style={{ color: c.textSecondary, fontSize: '0.75rem', margin: '0 0 1.5rem 0', lineHeight: 1.6 }}>
        The coach will review and confirm your spot.<br />
        Check the Training page to see your status update.
      </p>
      <button
        type="button"
        onClick={onClose}
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '999px',
          border: `1px solid ${c.border}`,
          backgroundColor: c.background,
          color: c.text,
          fontWeight: 600,
          fontSize: '0.9rem',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Done
      </button>
    </div>
  );
};

const Field: React.FC<{ label: string; c: ColorPalette; children: React.ReactNode }> = ({
  label,
  c,
  children,
}) => (
  <div style={{ marginBottom: '1rem' }}>
    <label
      style={{
        display: 'block',
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: c.textSecondary,
        marginBottom: '0.4rem',
      }}
    >
      {label}
    </label>
    {children}
  </div>
);

function Chips<T extends string>({
  options,
  value,
  onChange,
  c,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  c: ColorPalette;
}) {
  return (
    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '999px',
              cursor: 'pointer',
              border: `1px solid ${active ? c.primary : c.border}`,
              backgroundColor: active ? c.primary : c.background,
              color: active ? '#fff' : c.text,
              fontSize: '0.82rem',
              fontWeight: 500,
              fontFamily: 'inherit',
              transition: 'all 0.15s ease',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

const AttendingChip: React.FC<{
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  c: ColorPalette;
}> = ({ label, active, disabled, onClick, c }) => (
  <button
    type="button"
    onClick={() => !disabled && onClick()}
    disabled={disabled}
    style={{
      padding: '0.5rem 0.9rem',
      borderRadius: '999px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      border: `1px solid ${active ? c.primary : c.border}`,
      backgroundColor: active ? c.primary : c.background,
      color: active ? '#fff' : disabled ? c.textSecondary : c.text,
      fontSize: '0.85rem',
      fontWeight: 600,
      fontFamily: 'inherit',
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.15s ease',
    }}
  >
    {label}
    {disabled && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem' }}>(full)</span>}
  </button>
);

const inputStyle = (c: ColorPalette): React.CSSProperties => ({
  width: '100%',
  padding: '0.7rem 0.85rem',
  borderRadius: '0.55rem',
  border: `1px solid ${c.border}`,
  backgroundColor: c.background,
  color: c.text,
  fontSize: '0.95rem',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
});
