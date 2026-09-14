import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, Share2 } from 'lucide-react';
import { type ColorPalette } from '../../styles/colors';
import { type ShowToast } from '../Admin';
import { useIsMobile } from '../../hooks/useIsMobile';
import {
  approveBooking,
  attendingLabel,
  cancelBooking,
  coversDay,
  fetchBookings,
  formatShortDate,
  isUpcomingDate,
  type Booking,
} from '../../utils/bookings';
import { fetchTrainingEvents } from '../../utils/trainingEvents';
import { type TrainingEvent, type TrainingDay } from '../../components/TrainingCard';

// `embedded` = rendered inside the Training hub's tab strip, so it drops its
// own page padding + <h1> (the hub supplies those) and keeps just the content.
type Props = { showToast: ShowToast; c: ColorPalette; theme: 'dark' | 'light'; embedded?: boolean };

type VenueFilter = 'all' | 'land' | 'lake';

/** One session row = an (event, day) pair with its covering sign-ups. */
type Session = {
  event: TrainingEvent;
  day: TrainingDay;
  key: string;             // `${event.id}::${day.key}`
  confirmed: Booking[];
  waiting: Booking[];
};

// Theme-aware status pills. Foreground/background chosen so small bold pill text
// clears WCAG AA (≥4.5:1) in BOTH modes — measured, not eyeballed.
const STATUS = {
  dark: {
    open: { bg: 'rgba(22,163,74,0.22)', fg: '#4ade80' },
    full: { bg: 'rgba(239,68,68,0.22)', fg: '#f87171' },
    wait: { bg: 'rgba(245,158,11,0.22)', fg: '#fbbf24' },
  },
  light: {
    open: { bg: 'rgba(22,163,74,0.16)', fg: '#14532d' },
    full: { bg: 'rgba(239,68,68,0.16)', fg: '#991b1b' },
    wait: { bg: 'rgba(245,158,11,0.16)', fg: '#854d0e' },
  },
} as const;

export const AdminSignups: React.FC<Props> = ({ c, showToast, theme, embedded = false }) => {
  const isMobile = useIsMobile();
  const st = STATUS[theme];
  const [events, setEvents] = useState<TrainingEvent[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [venue, setVenue] = useState<VenueFilter>('all');

  const reload = () => {
    setLoading(true);
    fetchBookings().then(setBookings).finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    fetchTrainingEvents().then(setEvents);
  }, []);

  // Flatten every (event, day) into a session row, soonest first, and attach
  // the sign-ups that cover that day (confirmed = seat taken, waiting = waitlist).
  const sessions = useMemo<Session[]>(() => {
    const rows: Session[] = [];
    for (const event of events) {
      for (const day of event.days) {
        if (!isUpcomingDate(day.date)) continue; // hide backdated sessions
        const covering = bookings.filter((b) => b.eventId === event.id && coversDay(b, day.key));
        rows.push({
          event,
          day,
          key: `${event.id}::${day.key}`,
          confirmed: covering.filter((b) => b.status === 'confirmed'),
          waiting: covering.filter((b) => b.status === 'waiting'),
        });
      }
    }
    // Soonest first.
    return rows.sort((a, b) => a.day.date.localeCompare(b.day.date));
  }, [events, bookings]);

  const venueOf = (s: Session) => s.event.venue ?? 'lake';
  const landCount = sessions.filter((s) => venueOf(s) === 'land').length;
  const lakeCount = sessions.filter((s) => venueOf(s) === 'lake').length;
  const visible = venue === 'all' ? sessions : sessions.filter((s) => venueOf(s) === venue);

  const totalWaiting = visible.reduce((n, s) => n + s.waiting.length, 0);
  const totalConfirmed = visible.reduce((n, s) => n + s.confirmed.length, 0);

  const handleApprove = async (b: Booking) => {
    if (!b.id) return;
    setBusyKey(b.id);
    try {
      await approveBooking(b.id);
      setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: 'confirmed' } : x)));
      showToast(`${b.name} confirmed!`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to approve.', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleCancel = async (b: Booking) => {
    if (!b.id) return;
    setBusyKey(b.id);
    try {
      await cancelBooking(b.id);
      setBookings((prev) => prev.filter((x) => x.id !== b.id));
      showToast(`${b.name} removed.`, 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to cancel.', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const columns = '1.8fr 1.5fr 1.4fr 1.5fr 0.9fr';

  return (
    <div style={{ padding: embedded ? 0 : (isMobile ? '1.25rem 1rem 3rem' : '2rem 1.5rem 4rem') }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: embedded ? 'flex-end' : 'space-between', gap: '1rem', marginBottom: isMobile ? '0.5rem' : '0.75rem', flexWrap: 'wrap' }}>
        {!embedded && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: c.text, margin: '0 0 0.4rem', letterSpacing: '0.02em', lineHeight: 1 }}>
              TRAINING SIGN-UPS
            </h1>
            <p style={{ color: c.textSecondary, fontSize: '0.9rem', margin: 0 }}>
              Sign-ups confirm automatically within capacity; anyone past that lands on the waitlist — no approval needed from you.
            </p>
          </div>
        )}
        <button type="button" onClick={reload} disabled={loading} className="admin-focus" style={refreshBtn(c, loading)}>
          <span style={{ display: 'inline-block', animation: loading ? 'spin 0.9s linear infinite' : 'none' }}>↻</span>
          {loading ? 'Syncing…' : 'Refresh'}
        </button>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .admin-focus:focus-visible { outline: 2px solid ${c.primary}; outline-offset: 2px; }
      `}</style>

      {!loading && sessions.length > 0 && (
        <div style={{ display: 'flex', gap: '0.4rem', margin: '0 0 1rem' }}>
          <VenueTab label="All" count={sessions.length} active={venue === 'all'} onClick={() => setVenue('all')} c={c} />
          <VenueTab label="Lake" count={lakeCount} active={venue === 'lake'} onClick={() => setVenue('lake')} c={c} />
          <VenueTab label="Land" count={landCount} active={venue === 'land'} onClick={() => setVenue('land')} c={c} />
        </div>
      )}

      <div style={{ fontSize: '0.85rem', color: c.textSecondary, margin: `0 0 ${isMobile ? '1rem' : '1.25rem'}` }}>
        {loading ? 'Fetching…' : `${visible.length} session${visible.length === 1 ? '' : 's'} · ${totalConfirmed} confirmed${totalWaiting > 0 ? ` · ${totalWaiting} waitlisted` : ''}`}
      </div>

      {loading && <SkeletonList c={c} />}

      {!loading && visible.length === 0 && (
        <div style={{ padding: '2rem 1.25rem', textAlign: 'center', borderRadius: '1rem', border: `1px dashed ${c.border}`, color: c.textSecondary, fontSize: '0.88rem' }}>
          {sessions.length === 0 ? 'No training sessions scheduled.' : `No ${venue} training sessions coming up.`}
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: '1rem', overflow: 'hidden' }}>
          {!isMobile && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `2rem ${columns}`,
                gap: '1rem',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: c.textSecondary,
                borderBottom: `1px solid ${c.border}`,
              }}
            >
              <div />
              <div>Session</div><div>Date &amp; time</div><div>Location</div><div>Signed up</div><div>Status</div>
            </div>
          )}

          {visible.map((s, i) => {
            const taken = s.confirmed.length;
            const full = taken >= s.day.capacity;
            const pct = s.day.capacity > 0 ? Math.min(100, Math.round((taken / s.day.capacity) * 100)) : 0;
            const status = full ? st.full : st.open;
            const isOpen = expanded === s.key;
            const isLast = i === visible.length - 1;
            const roster = [...s.waiting, ...s.confirmed]; // actionable (waiting) first

            const bar = (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ flex: isMobile ? '0 0 70px' : 1, minWidth: 56, maxWidth: 90, height: 6, borderRadius: '99px', backgroundColor: c.hover, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: full ? '#dc2626' : c.primary }} />
                </div>
                <span style={{ fontSize: '0.8rem', color: c.textSecondary, whiteSpace: 'nowrap' }}>{taken}/{s.day.capacity}</span>
              </div>
            );

            const statusCell = (
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <Pill bg={status.bg} fg={status.fg} label={full ? 'Full' : 'Open'} />
                {s.waiting.length > 0 && <Pill bg={st.wait.bg} fg={st.wait.fg} label={`${s.waiting.length} waiting`} />}
              </div>
            );

            return (
              <div key={s.key} style={{ borderBottom: isLast && !isOpen ? 'none' : `1px solid ${c.border}` }}>
                {isMobile ? (
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : s.key)}
                    aria-expanded={isOpen}
                    className="admin-focus"
                    style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '1rem 1.1rem', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit', display: 'block' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: c.text }}>{s.event.title}</div>
                        <div style={{ fontSize: '0.78rem', color: c.textSecondary, marginTop: '0.2rem' }}>
                          {formatShortDate(s.day.date)} · {s.day.time}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: c.textSecondary, marginTop: '0.15rem' }}>
                          <MapPin size={12} strokeWidth={1.8} aria-hidden /> {s.day.location}
                        </div>
                      </div>
                      {isOpen ? <ChevronDown size={18} color={c.textSecondary} style={{ flexShrink: 0 }} aria-hidden /> : <ChevronRight size={18} color={c.textSecondary} style={{ flexShrink: 0 }} aria-hidden />}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                      {bar}
                      {statusCell}
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    className="admin-focus"
                    onClick={() => setExpanded(isOpen ? null : s.key)}
                    style={{ display: 'grid', gridTemplateColumns: `2rem ${columns}`, gap: '1rem', alignItems: 'center', padding: '1rem 1.25rem', cursor: 'pointer', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', fontFamily: 'inherit', color: 'inherit' }}
                  >
                    {isOpen ? <ChevronDown size={18} color={c.textSecondary} aria-hidden /> : <ChevronRight size={18} color={c.textSecondary} aria-hidden />}
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: c.text, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.event.title}</div>
                    <div style={{ fontSize: '0.85rem', color: c.textSecondary }}>{formatShortDate(s.day.date)} · {s.day.time}</div>
                    <div style={{ fontSize: '0.85rem', color: c.textSecondary, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.day.location}>{s.day.location}</div>
                    <div>{bar}</div>
                    {statusCell}
                  </button>
                )}

                {isOpen && (
                  <div style={{ padding: isMobile ? '0 1.1rem 1rem' : '0 1.25rem 1.25rem', backgroundColor: c.surfaceAlt }}>
                    <RosterBoard
                      c={c}
                      event={s.event}
                      day={s.day}
                      rows={roster}
                      capacity={s.day.capacity}
                      busyKey={busyKey}
                      isMobile={isMobile}
                      onApprove={handleApprove}
                      onCancel={handleCancel}
                      showToast={showToast}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */

type RosterProps = {
  c: ColorPalette;
  event: TrainingEvent;
  day: TrainingDay;
  rows: Booking[];
  capacity: number;
  busyKey: string | null;
  isMobile: boolean;
  onApprove: (b: Booking) => void;
  onCancel: (b: Booking) => void;
  showToast: ShowToast;
};

const sideShort: Record<string, string> = { Left: 'Port', Right: 'Starb', Coxswain: 'Cox', Coach: 'Coach' };

/**
 * Roster display: for lake sessions, splits paddlers into Port / Starboard
 * columns with running weight totals for boat balance. For land conditioning
 * sessions, shows a clean, direct attendee grid.
 */
const RosterBoard: React.FC<RosterProps> = ({ c, event, day, rows, capacity, busyKey, isMobile, onApprove, onCancel, showToast }) => {
  const [shareOpen, setShareOpen] = useState(false);
  if (rows.length === 0) {
    return <div style={{ padding: '1rem 0', fontSize: '0.85rem', color: c.textSecondary }}>No one signed up yet.</div>;
  }
  const isLand = event.venue === 'land';
  const confirmed = rows.filter((b) => b.status !== 'waiting');
  const waiting = rows.filter((b) => b.status === 'waiting');
  const left = confirmed.filter((b) => b.side === 'Left');
  const right = confirmed.filter((b) => b.side === 'Right');
  const crew = confirmed.filter((b) => b.side === 'Coxswain' || b.side === 'Coach');
  const unassigned = confirmed.filter((b) => b.side !== 'Left' && b.side !== 'Right' && b.side !== 'Coxswain' && b.side !== 'Coach');
  const males = confirmed.filter((b) => b.gender === 'Male').length;
  const females = confirmed.filter((b) => b.gender === 'Female').length;
  const gear = confirmed.filter((b) => b.needPFD === 'Yes' || b.needPaddle === 'Yes').length;
  const sum = (list: Booking[]) => list.reduce((n, b) => n + (b.weight ?? 0), 0);
  const lKg = sum(left), rKg = sum(right);
  const diff = Math.abs(lKg - rKg);

  const remove = (b: Booking) => {
    if (typeof window !== 'undefined' && !window.confirm(`Remove ${b.name} from this session?`)) return;
    onCancel(b);
  };

  const person = (b: Booking) => {
    const busy = busyKey === b.id;
    // Only surface the day when someone isn't attending the whole weekend —
    // otherwise every row would repeat the same tag (noise).
    const exception = b.attending !== 'both' ? attendingLabel(b.attending, event) : null;
    const showGear = !isLand && (b.needPFD === 'Yes' || b.needPaddle === 'Yes');
    return (
      <div key={b.id ?? `${b.eventId}::${b.name}`} className="rrow"
        style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', padding: '0.4rem 0.55rem', borderRadius: '0.4rem', opacity: busy ? 0.5 : 1 }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', minWidth: 0 }}>
          <span style={{ fontWeight: 600, fontSize: '0.82rem', color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
          {exception && <span style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.05em', color: '#d97706', flexShrink: 0 }}>{exception}</span>}
          {showGear && <span title="Needs gear" aria-label="Needs gear" style={{ fontSize: '0.62rem', color: '#d97706', flexShrink: 0 }}>◆</span>}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <span style={{ fontSize: '0.66rem', color: c.textSecondary, opacity: 0.8 }}>{b.gender === 'Male' ? 'M' : 'F'}</span>
          {!isLand && <span style={{ fontSize: '0.78rem', color: c.textSecondary, fontVariantNumeric: 'tabular-nums' }}>{b.weight ?? '–'}</span>}
          <button type="button" aria-label={`Remove ${b.name}`} className="admin-focus rrow-x" onClick={() => remove(b)} disabled={busy}
            style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.82rem', lineHeight: 1, opacity: isMobile ? 0.6 : 0, transition: 'opacity 0.12s' }}>✕</button>
        </span>
      </div>
    );
  };

  // A render helper (not a component) so it closes over `person` without
  // remounting the subtree on every render.
  const column = (label: string, list: Booking[], kg: number) => (
    <div style={{ flex: 1, minWidth: 0, border: `1px solid ${c.border}`, borderRadius: '0.6rem', overflow: 'hidden', backgroundColor: c.surface }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.55rem 0.7rem', borderBottom: `1px solid ${c.border}` }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.textSecondary }}>{label}</span>
        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: c.text }}>{list.length}</span>
      </div>
      <div style={{ padding: '0.4rem' }}>
        {list.length ? list.map(person) : <div style={{ padding: '0.5rem', fontSize: '0.76rem', color: c.textSecondary, fontStyle: 'italic' }}>None yet</div>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.7rem', borderTop: `1px solid ${c.border}`, fontSize: '0.76rem', fontWeight: 700, color: c.textSecondary }}>
        <span>Σ</span><span style={{ color: c.text, fontVariantNumeric: 'tabular-nums' }}>{kg} kg</span>
      </div>
    </div>
  );

  return (
    <div style={{ paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      <style>{`.rrow:hover { background: ${c.surfaceAlt}; } .rrow:hover .rrow-x { opacity: 1 !important; }`}</style>
      
      {isLand ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem 0.7rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem 0.7rem', fontSize: '0.78rem', color: c.textSecondary }}>
              <span style={{ fontWeight: 700, color: c.text }}>{confirmed.length}/{capacity} confirmed</span>
              <span>·</span>
              <span>{males}M · {females}F</span>
            </div>
            <ShareButton c={c} onClick={() => setShareOpen(true)} />
          </div>
          <div style={{ border: `1px solid ${c.border}`, borderRadius: '0.6rem', overflow: 'hidden', backgroundColor: c.surface, padding: '0.4rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.2rem' }}>
              {confirmed.length ? confirmed.map(person) : <div style={{ padding: '0.5rem', fontSize: '0.76rem', color: c.textSecondary, fontStyle: 'italic' }}>No confirmed sign-ups yet.</div>}
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem 0.7rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem 0.7rem', fontSize: '0.78rem', color: c.textSecondary }}>
              <span style={{ fontWeight: 700, color: c.text }}>{confirmed.length}/{capacity}</span>
              <span>·</span>
              <span>{males}M · {females}F</span>
              <span>·</span>
              <span style={{ color: diff > 8 ? '#d97706' : '#16a34a', fontWeight: 700 }}>
                {diff === 0 ? 'Sides balanced' : `${diff} kg ${lKg > rKg ? 'port-heavy' : 'starboard-heavy'}`}
              </span>
              {gear > 0 && <><span>·</span><span style={{ color: '#d97706' }}>{gear} need gear ◆</span></>}
            </div>
            <ShareButton c={c} onClick={() => setShareOpen(true)} />
          </div>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.9rem' }}>
            {column('Port', left, lKg)}
            {column('Starboard', right, rKg)}
          </div>
          {crew.length > 0 && (
            <div style={{ border: `1px solid ${c.border}`, borderRadius: '0.6rem', backgroundColor: c.surface, padding: '0.4rem 0.55rem' }}>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.textSecondary, padding: '0.15rem 0.15rem 0.35rem' }}>Crew</div>
              {crew.map(person)}
            </div>
          )}
          {unassigned.length > 0 && (
            <div style={{ border: `1px solid ${c.border}`, borderRadius: '0.6rem', backgroundColor: c.surface, padding: '0.4rem 0.55rem' }}>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.textSecondary, padding: '0.15rem 0.15rem 0.35rem' }}>Unassigned Side</div>
              {unassigned.map(person)}
            </div>
          )}
        </>
      )}

      {waiting.length > 0 && (
        <div>
          <div style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#d97706', margin: '0 0 0.4rem' }}>Waitlist · {waiting.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {waiting.map((b) => (
              <div key={b.id ?? `${b.eventId}::${b.name}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.6rem', borderRadius: '0.45rem', border: `1px solid ${c.border}`, backgroundColor: c.surface, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, fontSize: '0.82rem', color: c.text, flex: 1, minWidth: 80 }}>
                  {b.name}{' '}
                  <span style={{ color: c.textSecondary, fontWeight: 400 }}>
                    {isLand
                      ? (b.gender === 'Male' ? 'M' : 'F')
                      : `${sideShort[b.side ?? ''] ?? b.side ?? ''}${b.weight ? ` · ${b.weight}kg` : ''}`}
                  </span>
                </span>
                <ActionBtn onClick={() => onApprove(b)} disabled={busyKey === b.id} big={isMobile} color="#16a34a" label={busyKey === b.id ? '…' : '✓ Confirm'} />
                <ActionBtn onClick={() => remove(b)} disabled={busyKey === b.id} big={isMobile} color="#ef4444" label="Remove" outline />
              </div>
            ))}
          </div>
        </div>
      )}

      {shareOpen && (
        <RosterShareModal
          c={c}
          isMobile={isMobile}
          event={event}
          day={day}
          confirmed={confirmed}
          waiting={waiting}
          showToast={showToast}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
};

const ShareButton: React.FC<{ c: ColorPalette; onClick: () => void }> = ({ c, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title="Preview the sign-up list, copy it as an image, or print it"
    className="admin-focus"
    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.7rem', borderRadius: '999px', border: `1px solid ${c.border}`, background: 'transparent', color: c.textSecondary, fontWeight: 600, fontSize: '0.76rem', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}
  >
    <Share2 size={13} aria-hidden /> Share
  </button>
);

/* ------------------------------------------------------------------ */
/* Share / Export a single session's sign-up list — same idea as the    */
/* boat lineup share (AdminBoats.tsx): a plain-text-first summary       */
/* rendered onto a Canvas 2D (not an SVG foreignObject, which Safari     */
/* taints and then refuses to export) so it copies to the clipboard as  */
/* an image or prints, cross-browser.                                   */

const SHEET_FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';
const SHEET_W = 440;

const rosterLabel = (b: Booking, event: TrainingEvent) => {
  const exception = b.attending !== 'both' ? attendingLabel(b.attending, event) : null;
  return exception ? `${b.name}  (${exception})` : b.name;
};

/** Render a session's confirmed + waitlist names onto a 2× canvas and export as PNG. */
const rosterToPngBlob = async (
  event: TrainingEvent,
  day: TrainingDay,
  confirmed: Booking[],
  waiting: Booking[],
): Promise<Blob | null> => {
  const SCALE = 2;
  const PAD = 28;
  const ROW_H = 28;
  const innerW = SHEET_W - PAD * 2;

  const probe = document.createElement('canvas').getContext('2d');
  if (!probe) return null;

  const groups = [
    { label: `Confirmed — ${confirmed.length}/${day.capacity}`, tint: '#ecfdf5', rows: confirmed },
    ...(waiting.length ? [{ label: `Waitlist — ${waiting.length}`, tint: '#fffbeb', rows: waiting }] : []),
  ];

  let total = PAD + 26 + 22 + 18 + 14; // title + event title + meta + gap
  for (const g of groups) total += ROW_H + Math.max(g.rows.length, 1) * ROW_H + 10;
  total += PAD;

  const canvas = document.createElement('canvas');
  canvas.width = SHEET_W * SCALE;
  canvas.height = Math.ceil(total) * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, SHEET_W, total);

  const fit = (s: string, maxW: number): string => {
    if (ctx.measureText(s).width <= maxW) return s;
    let t = s;
    while (t.length > 1 && ctx.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
    return `${t}…`;
  };

  let y = PAD;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#111';
  ctx.font = `700 20px ${SHEET_FONT}`;
  ctx.fillText('ALPAS PINAS — Sign-ups', PAD, y + 18);
  y += 26;

  ctx.font = `700 16px ${SHEET_FONT}`;
  ctx.fillText(fit(event.title, innerW), PAD, y + 14);
  y += 22;

  ctx.font = `13px ${SHEET_FONT}`;
  ctx.fillStyle = '#555';
  ctx.fillText(fit(`${formatShortDate(day.date)} · ${day.time} · ${day.location}`, innerW), PAD, y + 12);
  y += 18 + 14;

  for (const g of groups) {
    ctx.fillStyle = g.tint;
    ctx.fillRect(PAD, y, innerW, ROW_H);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(PAD + 0.5, y + 0.5, innerW, ROW_H);
    ctx.fillStyle = '#111';
    ctx.font = `700 13px ${SHEET_FONT}`;
    ctx.fillText(g.label, PAD + 10, y + ROW_H / 2 + 4);
    y += ROW_H;

    if (g.rows.length === 0) {
      ctx.strokeRect(PAD + 0.5, y + 0.5, innerW, ROW_H);
      ctx.fillStyle = '#94a3b8';
      ctx.font = `italic 13px ${SHEET_FONT}`;
      ctx.fillText('None yet', PAD + 10, y + ROW_H / 2 + 4);
      y += ROW_H;
    } else {
      for (const b of g.rows) {
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(PAD + 0.5, y + 0.5, innerW, ROW_H);
        ctx.fillStyle = '#111';
        ctx.font = `600 13px ${SHEET_FONT}`;
        ctx.textAlign = 'left';
        ctx.fillText(fit(rosterLabel(b, event), innerW - 30), PAD + 10, y + ROW_H / 2 + 4);
        ctx.fillStyle = '#94a3b8';
        ctx.font = `12px ${SHEET_FONT}`;
        ctx.textAlign = 'right';
        ctx.fillText(b.gender === 'Male' ? 'M' : 'F', PAD + innerW - 10, y + ROW_H / 2 + 4);
        ctx.textAlign = 'left';
        y += ROW_H;
      }
    }
    y += 10;
  }

  return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
};

const esc = (s: string): string => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]!));

/** Open a print-ready window for the session's sign-up list (mirrors the boat lineup's print flow). */
const printRosterSheet = (event: TrainingEvent, day: TrainingDay, confirmed: Booking[], waiting: Booking[]) => {
  const table = (rows: Booking[]) =>
    rows.length === 0
      ? '<p class="empty">None yet.</p>'
      : `<table><tbody>${rows
          .map((b) => `<tr><td>${esc(rosterLabel(b, event))}</td><td class="gender">${b.gender === 'Male' ? 'M' : 'F'}</td></tr>`)
          .join('')}</tbody></table>`;

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(event.title)} — Sign-ups</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #111; margin: 32px; }
  h1 { font-size: 20px; margin: 0 0 2px; letter-spacing: 0.04em; }
  .meta { color: #555; font-size: 13px; margin: 0 0 14px; }
  h2 { font-size: 14px; margin: 18px 0 8px; padding: 6px 10px; background: #f1f5f9; border-radius: 4px; }
  table { border-collapse: collapse; width: 100%; max-width: 420px; }
  td { border: 1px solid #e2e8f0; padding: 6px 10px; font-size: 13px; }
  td.gender { width: 30px; text-align: right; color: #94a3b8; }
  .empty { color: #94a3b8; font-size: 13px; font-style: italic; }
  @page { margin: 16mm; }
</style></head><body>
  <h1>ALPAS PINAS — Sign-ups</h1>
  <p class="meta">${esc(event.title)} — ${esc(formatShortDate(day.date))} · ${esc(day.time)} · ${esc(day.location)}</p>
  <h2>Confirmed — ${confirmed.length}/${day.capacity}</h2>
  ${table(confirmed)}
  ${waiting.length ? `<h2>Waitlist — ${waiting.length}</h2>${table(waiting)}` : ''}
  <script>window.onload = function () { window.print(); };</script>
</body></html>`;

  const win = window.open('', '_blank', 'width=480,height=680');
  if (!win) return;
  win.document.write(html);
  win.document.close();
};

/** Plain-HTML preview of the same content the PNG/print renders — kept visually close so
 *  the modal preview matches what gets copied or printed. */
const RosterSheet = React.forwardRef<HTMLDivElement, { event: TrainingEvent; day: TrainingDay; confirmed: Booking[]; waiting: Booking[] }>(
  ({ event, day, confirmed, waiting }, ref) => {
    const row = (b: Booking) => (
      <div key={b.id ?? `${b.eventId}::${b.name}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.7rem', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>
        <span style={{ fontWeight: 600 }}>{rosterLabel(b, event)}</span>
        <span style={{ color: '#94a3b8' }}>{b.gender === 'Male' ? 'M' : 'F'}</span>
      </div>
    );
    const group = (label: string, rows: Booking[], tint: string) => (
      <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ background: tint, padding: '0.5rem 0.7rem', fontWeight: 700, fontSize: 13 }}>{label}</div>
        {rows.length === 0 ? <div style={{ padding: '0.5rem 0.7rem', fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>None yet</div> : rows.map(row)}
      </div>
    );
    return (
      <div ref={ref} style={{ width: SHEET_W, boxSizing: 'border-box', padding: 28, background: '#fff', color: '#111', fontFamily: SHEET_FONT }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.02em', margin: '0 0 2px' }}>ALPAS PINAS — Sign-ups</div>
        <div style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>{event.title}</div>
        <div style={{ fontSize: 13, color: '#555', margin: '0 0 14px' }}>{formatShortDate(day.date)} · {day.time} · {day.location}</div>
        {group(`Confirmed — ${confirmed.length}/${day.capacity}`, confirmed, '#ecfdf5')}
        {waiting.length > 0 && group(`Waitlist — ${waiting.length}`, waiting, '#fffbeb')}
      </div>
    );
  },
);

const RosterShareModal: React.FC<{
  c: ColorPalette;
  isMobile: boolean;
  event: TrainingEvent;
  day: TrainingDay;
  confirmed: Booking[];
  waiting: Booking[];
  showToast: ShowToast;
  onClose: () => void;
}> = ({ c, isMobile, event, day, confirmed, waiting, showToast, onClose }) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [sheetH, setSheetH] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      if (sheetRef.current) setSheetH(sheetRef.current.offsetHeight);
      const el = previewRef.current;
      if (el) {
        const cs = getComputedStyle(el);
        const avail = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        setScale(Math.min(1, avail / SHEET_W));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (previewRef.current) ro.observe(previewRef.current);
    return () => ro.disconnect();
  }, [event, day, confirmed, waiting]);

  const copyImage = async () => {
    try {
      if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
        throw new Error('clipboard image not supported');
      }
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': rosterToPngBlob(event, day, confirmed, waiting).then((b) => {
            if (!b) throw new Error('render failed');
            return b;
          }),
        }),
      ]);
      showToast('Sign-up list copied — paste it into your chat.');
    } catch {
      showToast('Could not copy image. Use Print / Save as PDF instead.', 'error');
    }
  };

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 401, maxHeight: '82vh',
        display: 'flex', flexDirection: 'column', backgroundColor: c.surface,
        borderTop: `1px solid ${c.border}`, borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem',
        boxShadow: '0 -12px 32px rgba(0,0,0,0.35)', animation: 'alpas-sheet-up 220ms cubic-bezier(0.22,1,0.36,1)',
      }
    : {
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 401,
        width: 'min(480px, calc(100vw - 3rem))', maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', backgroundColor: c.surface,
        border: `1px solid ${c.border}`, borderRadius: '1rem', boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        animation: 'alpas-modal-in 180ms cubic-bezier(0.22,1,0.36,1)',
      };

  return (
    <>
      <style>{`
        @keyframes alpas-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes alpas-modal-in { from { opacity: 0; transform: translate(-50%, -46%); } to { opacity: 1; transform: translate(-50%, -50%); } }
      `}</style>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 400, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} />
      <div style={panelStyle}>
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0 0.25rem' }}>
            <div style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: c.border }} />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: `${isMobile ? '0.5rem' : '1.1rem'} 1.25rem 0.75rem` }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: c.text }}>Share / Export</div>
            <div style={{ fontSize: '0.78rem', color: c.textSecondary }}>{event.title} sign-ups</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: `1px solid ${c.border}`, color: c.textSecondary, width: 30, height: 30, borderRadius: 999, cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit', flexShrink: 0 }}>×</button>
        </div>
        <div ref={previewRef} style={{ overflow: 'auto', padding: '0.6rem 0.75rem 0.85rem', display: 'flex', justifyContent: 'center', backgroundColor: c.background }}>
          <div style={{ width: SHEET_W * scale, height: sheetH ? sheetH * scale : undefined, flexShrink: 0 }}>
            <div style={{ width: SHEET_W, transform: `scale(${scale})`, transformOrigin: 'top left', boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
              <RosterSheet ref={sheetRef} event={event} day={day} confirmed={confirmed} waiting={waiting} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', padding: '0.75rem 1.25rem 1.25rem', borderTop: `1px solid ${c.border}`, marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={copyImage}
            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', padding: '0.7rem 1rem', borderRadius: '0.55rem', border: 'none', backgroundColor: c.primary, color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Copy Image
          </button>
          <button
            type="button"
            onClick={() => printRosterSheet(event, day, confirmed, waiting)}
            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', padding: '0.7rem 1rem', borderRadius: '0.55rem', border: `1px solid ${c.border}`, backgroundColor: 'transparent', color: c.text, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Print
          </button>
        </div>
      </div>
    </>
  );
};

const VenueTab: React.FC<{ label: string; count: number; active: boolean; onClick: () => void; c: ColorPalette }> = ({ label, count, active, onClick, c }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className="admin-focus"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.45rem',
      padding: '0.5rem 0.95rem',
      minHeight: 40,
      borderRadius: '999px',
      border: `1px solid ${active ? c.primary : c.border}`,
      backgroundColor: active ? c.primary : 'transparent',
      color: active ? '#fff' : c.text,
      fontSize: '0.82rem',
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'inherit',
    }}
  >
    {label}
    <span style={{ fontSize: '0.72rem', fontWeight: 700, opacity: active ? 0.9 : 0.6 }}>{count}</span>
  </button>
);

const Pill: React.FC<{ bg: string; fg: string; label: string }> = ({ bg, fg, label }) => (
  <span style={{ display: 'inline-flex', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: bg, color: fg, whiteSpace: 'nowrap' }}>
    {label}
  </span>
);

const ActionBtn: React.FC<{ onClick: () => void; disabled: boolean; color: string; label: string; big?: boolean; outline?: boolean }> = ({ onClick, disabled, color, label, big, outline }) => (
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    disabled={disabled}
    className="admin-focus"
    style={{
      padding: big ? '0.55rem 1rem' : '0.4rem 0.85rem',
      minHeight: big ? 44 : undefined,
      borderRadius: '999px',
      border: outline ? `1px solid ${color}66` : 'none',
      background: outline ? 'transparent' : color,
      color: outline ? color : '#fff',
      fontWeight: 600,
      fontSize: '0.78rem',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit',
      opacity: disabled ? 0.5 : 1,
      transition: 'opacity 0.15s',
    }}
  >
    {label}
  </button>
);

const SkeletonList: React.FC<{ c: ColorPalette }> = ({ c }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
    {[1, 2, 3].map((i) => (
      <div key={i} style={{ height: '64px', borderRadius: '0.75rem', backgroundColor: c.surface, border: `1px solid ${c.border}`, opacity: 1 - i * 0.2 }} />
    ))}
  </div>
);

const refreshBtn = (c: ColorPalette, loading: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.45rem 1rem',
  borderRadius: '999px',
  border: `1px solid ${c.border}`,
  backgroundColor: 'transparent',
  color: loading ? c.textSecondary : c.text,
  fontSize: '0.82rem',
  cursor: loading ? 'not-allowed' : 'pointer',
  fontFamily: 'inherit',
});
