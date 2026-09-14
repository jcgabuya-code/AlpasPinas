import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock3, Lock, MapPin } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { colors, brandGradient, type ColorPalette } from '../styles/colors';
import type { TrainingEvent } from './TrainingCard';
import {
  addBooking,
  fetchBookings,
  fetchEventCounts,
  formatShortDate,
  formatTime,
  getEventCounts,
  hasNameBooked,
  takenForDay,
  type EventCounts,
  type Attending,
  type BookingStatus,
  type Gender,
  type SideRole,
  type YesNo,
} from '../utils/bookings';
import { displayName } from '../utils/users';

type BookingModalProps = {
  open: boolean;
  event: TrainingEvent | null;
  onClose: () => void;
};

const GENDERS: Gender[] = ['Male', 'Female'];
const YES_NO: YesNo[] = ['Yes', 'No'];

// "Sat 19 – Sun 20 Sep" for a shared-time/location weekend; null (falls back
// to per-day lines) if the days differ in time or venue.
function formatDateRange(days: TrainingEvent['days']): string | null {
  if (days.length < 2) return null;
  const [first, ...rest] = days;
  if (rest.some((d) => d.time !== first.time || d.location !== first.location)) return null;

  const dayPart = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
  };
  const [, lastMonth] = days[days.length - 1].date.split('-').map(Number);
  const monthPart = new Date(2000, (lastMonth ?? 1) - 1, 1).toLocaleDateString(undefined, { month: 'short' });

  return `${days.map((d) => dayPart(d.date)).join(' – ')} ${monthPart}`;
}

export const BookingModal: React.FC<BookingModalProps> = ({ open, event, onClose }) => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const accent = theme === 'dark' ? c.accent : c.primary;
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Land sign-ups skip the boat-specific fields (side/weight/PFD/paddle) — not
  // relevant to weeknight conditioning.
  const isLand = event?.venue === 'land';
  // Single-day events (typical for land) don't need a "which day" picker at
  // all — the sign-up covers that one day, full stop.
  const singleDay = (event?.days.length ?? 0) <= 1;

  // Form state — name/gender/side/weight default from the logged-in
  // user's profile (captured at registration) but stay editable per sign-up.
  // Birthday is captured mandatorily at registration and read straight off
  // the profile — no editable field here.
  const [name, setName] = useState(user ? displayName(user) : '');
  const [gender, setGender] = useState<Gender>(user?.gender ?? 'Male');
  const [side, setSide] = useState<SideRole>(user?.side ?? 'Left');
  const [weight, setWeight] = useState<string>(user?.weight ? String(user.weight) : '');
  const [needPFD, setNeedPFD] = useState<YesNo>('No');
  const [needPaddle, setNeedPaddle] = useState<YesNo>('No');
  const [attending, setAttending] = useState<Attending>('both');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Live capacity counts (PII-free) from the counts RPC.
  const [counts, setCounts] = useState<EventCounts>(() => getEventCounts());

  // Reset whenever the modal opens for a new event, and pull live counts.
  useEffect(() => {
    if (open && event) {
      setName(user ? displayName(user) : '');
      setGender(user?.gender ?? 'Male');
      setSide(user?.side ?? 'Left');
      setWeight(user?.weight ? String(user.weight) : '');
      setNeedPFD('No');
      setNeedPaddle('No');
      setAttending(event.days.length === 1 ? event.days[0].key : 'both');
      setError(null);
      setResult(null);
      setSubmitting(false);
      fetchEventCounts().then(setCounts);
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
    return event.days.map((d) => {
      const taken = takenForDay(counts, event.id, d.key);
      return { day: d, remaining: Math.max(0, d.capacity - taken), full: taken >= d.capacity };
    });
  }, [event, counts]); // recompute when counts refresh

  if (!open || !event) return null;

  // No admin approval needed: a day with room confirms immediately. If every
  // covered day is full the sign-up still goes through — it just lands on
  // the waitlist instead of being blocked.
  const coveredDays =
    attending === 'both' ? event.days : event.days.filter((d) => d.key === attending);
  const joiningWaitlist = coveredDays.some(
    (d) => (dayStats.find((s) => s.day.key === d.key)?.remaining ?? 0) <= 0,
  );

  // Weight only matters for paddlers, not for coxswain/coach.
  const showWeight = !isLand && side !== 'Coxswain' && side !== 'Coach';

  // Section numbers reflect what's actually rendered, so hiding a section
  // (e.g. weight for a coxswain) doesn't leave a gap in the numbering.
  let sectionCount = 0;
  const daysSectionNum = !singleDay ? ++sectionCount : undefined;
  const roleSectionNum = !isLand ? ++sectionCount : undefined;
  const weightSectionNum = showWeight ? ++sectionCount : undefined;
  const equipmentSectionNum = !isLand ? ++sectionCount : undefined;

  // Condense a shared-time/location weekend into one line ("Sat 19 – Sun 20
  // Sep"); falls back to per-day lines when days differ in time or venue.
  const dateRange = formatDateRange(event.days);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError('Please enter your name.');
    const weightNum = Number(weight);
    if (!isLand && (!weight || Number.isNaN(weightNum) || weightNum < 30 || weightNum > 200))
      return setError('Please enter a weight in kg between 30 and 200.');

    // Re-check the freshest counts (capacity) + own rows (dedup) before writing.
    setSubmitting(true);
    let freshCounts = counts;
    try {
      const [mine, latest] = await Promise.all([fetchBookings(), fetchEventCounts()]);
      freshCounts = latest;
      setCounts(latest);
      if (hasNameBooked(mine, event.id, name)) {
        setSubmitting(false);
        return setError('You have already signed up for this weekend.');
      }
    } catch {
      // fall back to the counts we have if the refresh fails
    }

    // Confirmed only if every covered day still has room on the freshest
    // counts; otherwise this sign-up joins the waitlist for that day.
    const stillHasRoom = coveredDays.every(
      (d) => takenForDay(freshCounts, event.id, d.key) < d.capacity,
    );
    const status: BookingStatus = stillHasRoom ? 'confirmed' : 'waiting';

    try {
      await addBooking({
        eventId: event.id,
        eventTitle: event.title,
        attending,
        name: name.trim(),
        gender,
        birthday: user?.birthday ?? undefined,
        status,
        ...(isLand ? {} : { side, weight: weightNum, needPFD, needPaddle }),
      });
      setResult(status);
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
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobile ? 0 : '1.5rem',
        animation: 'alpas-fade-in 160ms ease-out',
      }}
    >
      <style>{`
        @keyframes alpas-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes alpas-pop-in { from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: scale(1) } }
        @keyframes alpas-slide-up { from { opacity: 0; transform: translateY(100%) } to { opacity: 1; transform: translateY(0) } }
        .alpas-booking-modal button:focus-visible,
        .alpas-booking-modal input:focus-visible {
          outline: 3px solid ${c.primary};
          outline-offset: 3px;
        }
      `}</style>

      <div
        onClick={(ev) => ev.stopPropagation()}
        className="alpas-booking-modal"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: isMobile ? '100%' : '560px',
          maxHeight: isMobile ? '92vh' : 'calc(100vh - 3rem)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          backgroundColor: c.surface,
          color: c.text,
          borderRadius: isMobile ? '1.1rem 1.1rem 0 0' : '0.95rem',
          border: `1px solid ${c.border}`,
          boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${c.primary}22`,
          animation: isMobile ? 'alpas-slide-up 240ms ease-out' : 'alpas-pop-in 200ms ease-out',
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

        {!user ? (
          <LoginPrompt c={c} theme={theme} onClose={onClose} />
        ) : result === 'confirmed' ? (
          <ConfirmedView event={event} attending={attending} name={name} onClose={onClose} />
        ) : result === 'waiting' ? (
          <WaitingView event={event} attending={attending} name={name} onClose={onClose} />
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: isMobile ? '1.5rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom))' : '1.75rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: accent,
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
                {dateRange ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: c.textSecondary, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem' }}>
                      <CalendarDays size={12} aria-hidden="true" />
                      <span style={{ fontWeight: 700, color: c.text }}>{dateRange}</span>
                    </span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem' }}>
                      <Clock3 size={12} aria-hidden="true" />
                      <span>{formatTime(event.days[0].time)}</span>
                    </span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem' }}>
                      <MapPin size={12} aria-hidden="true" />
                      <span>{event.days[0].location}</span>
                    </span>
                  </div>
                ) : (
                  event.days.map((d) => (
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', minWidth: '7.5rem' }}>
                        <CalendarDays size={12} aria-hidden="true" />
                        <span style={{ fontWeight: 700, color: c.text }}>{formatShortDate(d.date)}</span>
                      </span>
                      <span style={{ opacity: 0.4 }}>·</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem' }}>
                        <Clock3 size={12} aria-hidden="true" />
                        <span>{formatTime(d.time)}</span>
                      </span>
                      <span style={{ opacity: 0.4 }}>·</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem' }}>
                        <MapPin size={12} aria-hidden="true" />
                        <span>{d.location}</span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {isLand && (
              <div
                style={{
                  marginBottom: '1.1rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.55rem',
                  border: `1px solid ${c.border}`,
                  backgroundColor: c.surfaceAlt,
                  fontSize: '0.8rem',
                  color: c.textSecondary,
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 700, color: c.text, marginBottom: '0.3rem' }}>What to bring</div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                  <li>Yoga mat and resistance band, if you have them — a few extras on hand, but limited</li>
                  <li>Water</li>
                  <li>Extra clothes or a towel</li>
                </ul>
              </div>
            )}

            {user.gender ? (
              // Name + gender are both locked from the profile — one compact
              // summary line instead of two full field blocks.
              <div
                style={{
                  marginBottom: '1.1rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.55rem',
                  border: `1px dashed ${c.border}`,
                  backgroundColor: c.surfaceAlt,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  color: c.textSecondary,
                }}
              >
                <LockedBadge c={c} />
                <span>
                  Signing up as <strong style={{ color: c.text }}>{name}</strong> · {gender}
                </span>
              </div>
            ) : (
              <>
                <Field label="Name" locked c={c}>
                  <ReadOnlyValue value={name} c={c} isMobile={isMobile} />
                </Field>
                <Field label="Gender" c={c}>
                  <Chips options={GENDERS} value={gender} onChange={setGender} c={c} isMobile={isMobile} />
                </Field>
              </>
            )}

            {!singleDay && (
              <div style={{ marginBottom: '1.1rem' }}>
                <SectionHeader n={daysSectionNum} title="Which days" meta="Required" c={c} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: event.days.length > 1 ? '1fr 1fr' : '1fr', gap: '0.6rem' }}>
                    {event.days.map((d) => {
                      const stat = dayStats.find((s) => s.day.key === d.key);
                      return (
                        <AttendingChip
                          key={d.key}
                          label={`${d.label} only`}
                          status={stat?.full ? 'Waitlist' : `${stat?.remaining ?? 0} seats left`}
                          active={attending === d.key}
                          full={stat?.full ?? false}
                          onClick={() => setAttending(d.key)}
                          c={c}
                        />
                      );
                    })}
                  </div>
                  <AttendingChip
                    label="Both days"
                    status={dayStats
                      .map((s) => `${s.day.label}: ${s.full ? 'Waitlist' : `${s.remaining} seats`}`)
                      .join(' · ')}
                    active={attending === 'both'}
                    full={dayStats.some((s) => s.full)}
                    onClick={() => setAttending('both')}
                    c={c}
                    fullWidth
                  />
                </div>
              </div>
            )}

            {!isLand && (
              <div style={{ marginBottom: '1.1rem' }}>
                <SectionHeader n={roleSectionNum} title="Your role in the boat" meta="Pick one" c={c} />
                <div
                  style={{
                    border: `1px solid ${c.border}`,
                    borderRadius: '0.65rem',
                    padding: '0.9rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.7rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <span style={{ minWidth: '5.5rem', fontSize: '0.78rem', color: c.textSecondary }}>Paddling</span>
                    <Chips options={['Left', 'Right']} value={side} onChange={setSide} c={c} isMobile={isMobile} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <span style={{ minWidth: '5.5rem', fontSize: '0.78rem', color: c.textSecondary }}>Not paddling</span>
                    <Chips options={['Coxswain', 'Coach']} value={side} onChange={setSide} c={c} isMobile={isMobile} />
                  </div>
                </div>
              </div>
            )}

            {showWeight && (
              <div style={{ marginBottom: '1.1rem' }}>
                <SectionHeader n={weightSectionNum} title="Weight (kg)" meta="Kept private" c={c} />
                <input
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="72"
                  min={30}
                  max={200}
                  style={inputStyle(c, isMobile)}
                />
                <div style={{ fontSize: '0.72rem', color: c.textSecondary, marginTop: '0.3rem', lineHeight: 1.45 }}>
                  30–200 kg · used to balance the boat.
                </div>
              </div>
            )}

            {!isLand && (
              <div style={{ marginBottom: '1.1rem' }}>
                <SectionHeader n={equipmentSectionNum} title="Equipment" c={c} />
                <div>
                  <EquipmentRow
                    label="Need to borrow PFD?"
                    value={needPFD}
                    onChange={setNeedPFD}
                    c={c}
                    isMobile={isMobile}
                    showDivider
                  />
                  <EquipmentRow
                    label="Need to borrow paddle?"
                    value={needPaddle}
                    onChange={setNeedPaddle}
                    c={c}
                    isMobile={isMobile}
                  />
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                style={{
                  marginBottom: '0.85rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.5rem',
                  backgroundColor: `${c.danger}18`,
                  border: `1px solid ${c.danger}66`,
                  color: c.danger,
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            {joiningWaitlist && (
              <div
                style={{
                  marginBottom: '0.85rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.5rem',
                  backgroundColor: `${c.warning}18`,
                  border: `1px solid ${c.warning}44`,
                  color: c.warning,
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                }}
              >
                This session is full — you'll be added to the waitlist and confirmed if a spot opens.
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '0.6rem',
                border: 'none',
                background: brandGradient(brand, theme),
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.95rem',
                letterSpacing: '0.02em',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                opacity: submitting ? 0.8 : 1,
                boxShadow: `0 8px 24px ${c.primary}33`,
              }}
            >
              {submitting ? 'Saving…' : joiningWaitlist ? 'Join waitlist' : 'Confirm sign-up'}
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
              Your sign-up is saved to your team account.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

const LoginPrompt: React.FC<{ c: ColorPalette; theme: 'light' | 'dark'; onClose: () => void }> = ({ c, theme, onClose }) => {
  const { brand } = useTheme();
  const navigate = useNavigate();
  return (
    <div style={{ padding: '2.25rem 1.75rem', textAlign: 'center' }}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.5rem, 4vw, 1.9rem)',
          letterSpacing: '0.02em',
          margin: '0 0 0.6rem',
          lineHeight: 1.1,
        }}
      >
        SIGN IN TO SIGN UP
      </h2>
      <p style={{ color: c.textSecondary, fontSize: '0.92rem', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
        Training sign-ups are now tied to your team account. Log in (or register
        with your invite) to reserve your seat.
      </p>
      <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => { onClose(); navigate('/login'); }}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.6rem',
            border: 'none',
            background: brandGradient(brand, theme),
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: `0 8px 24px ${c.primary}33`,
          }}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.6rem',
            border: `1px solid ${c.border}`,
            background: 'transparent',
            color: c.text,
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const ConfirmedView: React.FC<{
  event: TrainingEvent;
  attending: Attending;
  name: string;
  onClose: () => void;
}> = ({ event, attending, name, onClose }) => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const joined =
    attending === 'both'
      ? event.days.map((d) => `${d.label} (${formatShortDate(d.date)})`).join(' + ')
      : (() => {
          const d = event.days.find((day) => day.key === attending);
          return d ? `${d.label} (${formatShortDate(d.date)}) at ${d.location}` : '';
        })();

  return (
    <div style={{ padding: '2rem 1.75rem', textAlign: 'center' }}>
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '999px',
          background: brandGradient(brand, theme),
          color: '#fff',
          margin: '0 auto 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.7rem',
          boxShadow: `0 8px 24px ${c.primary}40`,
        }}
      >
        ✓
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
        YOU'RE CONFIRMED
      </h2>
      <p style={{ color: c.textSecondary, fontSize: '0.92rem', margin: '0 0 0.4rem 0' }}>
        Spot locked in for {joined}.
      </p>
      <p style={{ color: c.textSecondary, fontSize: '0.8rem', margin: '0 0 1.5rem 0' }}>
        Registered as <strong style={{ color: c.text }}>{name}</strong>.
      </p>
      <button
        type="button"
        onClick={onClose}
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '999px',
          border: 'none',
          background: brandGradient(brand, theme),
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.9rem',
          cursor: 'pointer',
          fontFamily: 'inherit',
          boxShadow: `0 8px 24px ${c.primary}33`,
        }}
      >
        Got it, see you there!
      </button>
    </div>
  );
};

const WaitingView: React.FC<{
  event: TrainingEvent;
  attending: Attending;
  name: string;
  onClose: () => void;
}> = ({ event, attending, name, onClose }) => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
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
          background: `linear-gradient(135deg, ${c.warning}, ${c.warning}cc)`,
          color: '#fff',
          margin: '0 auto 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.7rem',
          boxShadow: `0 8px 24px ${c.warning}40`,
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
            backgroundColor: `${c.warning}18`,
            color: c.warning,
            border: `1px solid ${c.warning}44`,
          }}
        >
          <span style={{ fontSize: '0.55rem' }}>●</span> On the waitlist
        </span>
      </div>
      <p style={{ color: c.textSecondary, fontSize: '0.75rem', margin: '0 0 1.5rem 0', lineHeight: 1.6 }}>
        That session is full. We'll move you to confirmed if a spot opens up.<br />
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

const Field: React.FC<{ label: string; locked?: boolean; c: ColorPalette; children: React.ReactNode }> = ({
  label,
  locked,
  c,
  children,
}) => (
  <div style={{ marginBottom: '1rem' }}>
    {label && (
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: c.textSecondary,
          marginBottom: '0.4rem',
        }}
      >
        {label}
        {locked && <Lock size={11} aria-label="Locked — from your profile" />}
      </label>
    )}
    {children}
  </div>
);

// Visually distinct from an editable input: flat surface tint + dashed border
// + muted text, so a glance across the form tells locked fields from ones the
// paddler can actually change (solid border, background = c.background).
const ReadOnlyValue: React.FC<{ value: string; c: ColorPalette; isMobile: boolean }> = ({
  value,
  c,
  isMobile,
}) => (
  <div
    style={{
      ...inputStyle(c, isMobile),
      backgroundColor: c.surfaceAlt,
      border: `1px dashed ${c.border}`,
      color: c.textSecondary,
      cursor: 'not-allowed',
    }}
  >
    {value}
  </div>
);

function Chips<T extends string>({
  options,
  value,
  onChange,
  c,
  isMobile,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  c: ColorPalette;
  isMobile?: boolean;
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
            aria-pressed={active}
            style={{
              // 44px min touch target on mobile (WCAG 2.5.5 / iOS HIG).
              minHeight: isMobile ? '44px' : undefined,
              display: 'inline-flex',
              alignItems: 'center',
              padding: isMobile ? '0.6rem 1rem' : '0.45rem 0.85rem',
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

// A day-picker option: label + seat status stacked in a full card, not a
// small pill — the day you're joining is a bigger decision than a gear toggle.
const AttendingChip: React.FC<{
  label: string;
  status: string;
  active: boolean;
  /** Seats are gone for this option — still selectable, just joins the waitlist. */
  full: boolean;
  onClick: () => void;
  c: ColorPalette;
  fullWidth?: boolean;
}> = ({ label, status, active, full, onClick, c, fullWidth }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    aria-label={`${label}, ${status}`}
    style={{
      width: fullWidth ? '100%' : undefined,
      minHeight: '44px',
      textAlign: 'left',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.15rem',
      padding: '0.8rem 1rem',
      borderRadius: '0.65rem',
      cursor: 'pointer',
      border: `1px solid ${active ? c.primary : c.border}`,
      backgroundColor: active ? c.primary : c.background,
      fontFamily: 'inherit',
      transition: 'all 0.15s ease',
    }}
  >
    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: active ? '#fff' : c.text }}>{label}</span>
    <span style={{ fontSize: '0.76rem', color: active ? 'rgba(255,255,255,0.85)' : full ? c.warning : c.textSecondary }}>
      {status}
    </span>
  </button>
);

// Section number + title on the left, a short meta hint ("Required", "Pick
// one") on the right — mirrors the numbered-steps layout in the sign-up redesign.
const SectionHeader: React.FC<{ n?: number; title: string; meta?: string; c: ColorPalette }> = ({
  n,
  title,
  meta,
  c,
}) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.6rem' }}>
    <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.textSecondary }}>
      {n != null ? `${n} · ` : ''}
      {title}
    </div>
    {meta && <div style={{ fontSize: '0.68rem', color: c.textSecondary, whiteSpace: 'nowrap' }}>{meta}</div>}
  </div>
);

const LockedBadge: React.FC<{ c: ColorPalette }> = ({ c }) => (
  <span
    style={{
      flexShrink: 0,
      fontSize: '0.62rem',
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: c.textSecondary,
      backgroundColor: c.background,
      border: `1px solid ${c.border}`,
      padding: '0.2rem 0.45rem',
      borderRadius: '0.3rem',
    }}
  >
    Locked
  </span>
);

// A gear toggle row: label + short caption on the left, a "Default" tag
// (shown only while the value is still at its default 'No') + Yes/No on the right.
const EquipmentRow: React.FC<{
  label: string;
  caption?: string;
  value: YesNo;
  onChange: (v: YesNo) => void;
  c: ColorPalette;
  isMobile: boolean;
  showDivider?: boolean;
}> = ({ label, caption, value, onChange, c, isMobile, showDivider }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: isMobile ? 'flex-start' : 'center',
      gap: '0.6rem',
      padding: '0.75rem 0',
      borderBottom: showDivider ? `1px solid ${c.border}` : 'none',
    }}
  >
    <div>
      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: c.text }}>{label}</div>
      {caption && <div style={{ fontSize: '0.74rem', color: c.textSecondary, marginTop: '0.1rem' }}>{caption}</div>}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {value === 'No' && (
        <span
          style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: c.textSecondary,
            backgroundColor: c.surfaceAlt,
            padding: '0.25rem 0.5rem',
            borderRadius: '999px',
          }}
        >
          Default
        </span>
      )}
      <Chips options={YES_NO} value={value} onChange={onChange} c={c} isMobile={isMobile} />
    </div>
  </div>
);

// 16px font on mobile keeps iOS from zooming in when an input gains focus.
const inputStyle = (c: ColorPalette, isMobile = false): React.CSSProperties => ({
  width: '100%',
  padding: '0.7rem 0.85rem',
  borderRadius: '0.55rem',
  border: `1px solid ${c.border}`,
  backgroundColor: c.background,
  color: c.text,
  fontSize: isMobile ? '16px' : '0.95rem',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
});
