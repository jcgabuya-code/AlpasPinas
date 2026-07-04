import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, MapPin } from 'lucide-react';
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

type Props = { showToast: ShowToast; c: ColorPalette; theme: 'dark' | 'light' };

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

export const AdminSignups: React.FC<Props> = ({ c, showToast, theme }) => {
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
    <div style={{ padding: isMobile ? '1.25rem 1rem 3rem' : '2rem 1.5rem 4rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: isMobile ? '0.5rem' : '0.75rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: c.text, margin: '0 0 0.4rem', letterSpacing: '0.02em', lineHeight: 1 }}>
            TRAINING SIGN-UPS
          </h1>
          <p style={{ color: c.textSecondary, fontSize: '0.9rem', margin: 0 }}>
            Manage sessions and paddler capacity
          </p>
        </div>
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
                    <RosterList
                      c={c}
                      event={s.event}
                      rows={roster}
                      busyKey={busyKey}
                      isMobile={isMobile}
                      onApprove={handleApprove}
                      onCancel={handleCancel}
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

const RosterList: React.FC<{
  c: ColorPalette;
  event: TrainingEvent;
  rows: Booking[];
  busyKey: string | null;
  isMobile: boolean;
  onApprove: (b: Booking) => void;
  onCancel: (b: Booking) => void;
}> = ({ c, event, rows, busyKey, isMobile, onApprove, onCancel }) => {
  if (rows.length === 0) {
    return <div style={{ padding: '1rem 0', fontSize: '0.85rem', color: c.textSecondary }}>No one signed up yet.</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingTop: '0.85rem' }}>
      {rows.map((b) => {
        const busy = busyKey === b.id;
        const waiting = b.status === 'waiting';
        const meta = [
          b.gender,
          b.side,
          b.weight !== undefined ? `${b.weight} kg` : null,
          ...(b.needPFD === 'Yes' ? ['PFD'] : []),
          ...(b.needPaddle === 'Yes' ? ['Paddle'] : []),
        ].filter(Boolean).join(' · ');

        const nameChips = (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', minWidth: 0 }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: c.text }}>{b.name}</span>
            <Chip label={attendingLabel(b.attending, event)} color={c.primary} />
            {waiting && <Chip label="Waitlist" color="#d97706" />}
          </div>
        );
        const metaText = meta && (
          <span
            style={{ flex: 1, minWidth: 0, fontSize: '0.76rem', color: c.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={meta}
          >
            {meta}
          </span>
        );
        const actions = (
          <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
            {waiting && <ActionBtn onClick={() => onApprove(b)} disabled={busy} big={isMobile} color="#16a34a" label={busy ? '…' : '✓ Confirm'} />}
            <ActionBtn onClick={() => onCancel(b)} disabled={busy} big={isMobile} color="#ef4444" label={busy ? '…' : 'Remove'} outline />
          </div>
        );

        // Mobile: stack name+chips on top, meta+actions on a second row so the
        // buttons never overflow the card. Desktop: everything on one line.
        return (
          <div
            key={b.id ?? `${b.eventId}::${b.name}`}
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'center',
              gap: isMobile ? '0.5rem' : '0.6rem',
              padding: '0.55rem 0.7rem',
              borderRadius: '0.5rem',
              backgroundColor: c.surface,
              border: `1px solid ${c.border}`,
            }}
          >
            {nameChips}
            {isMobile ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: metaText ? 'space-between' : 'flex-end', gap: '0.6rem' }}>
                {metaText}
                {actions}
              </div>
            ) : (
              <>
                {metaText || <span style={{ flex: 1 }} />}
                {actions}
              </>
            )}
          </div>
        );
      })}
    </div>
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

const Chip: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <span style={{ padding: '0.12rem 0.5rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', backgroundColor: color + '20', color, border: `1px solid ${color}44`, whiteSpace: 'nowrap', flexShrink: 0 }}>
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
