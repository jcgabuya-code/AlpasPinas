import React, { useEffect, useState } from 'react';
import { type ColorPalette } from '../../styles/colors';
import { type ShowToast } from '../Admin';
import {
  approveBooking,
  attendingLabel,
  cancelBooking,
  fetchBookings,
  formatShortDate,
  type Booking,
} from '../../utils/bookings';
import { getTrainingEvents } from '../../utils/adminTrainingEvents';
import { type TrainingEvent } from '../../components/TrainingCard';

type Props = { showToast: ShowToast; c: ColorPalette; theme: 'dark' | 'light' };

export const AdminSignups: React.FC<Props> = ({ c, showToast }) => {
  const events = getTrainingEvents();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    fetchBookings().then(setBookings).finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const pending   = bookings.filter((b) => b.status === 'waiting');
  const confirmed = bookings.filter((b) => b.status === 'confirmed');

  const byEvent = (list: Booking[]) =>
    events
      .map((ev) => ({ event: ev, rows: list.filter((b) => b.eventId === ev.id) }))
      .filter((g) => g.rows.length > 0);

  const handleApprove = async (b: Booking) => {
    const key = `${b.eventId}::${b.name}`;
    setBusyKey(key);
    try {
      await approveBooking(b.eventId, b.name);
      setBookings((prev) =>
        prev.map((x) =>
          x.eventId === b.eventId && x.name === b.name ? { ...x, status: 'confirmed' } : x,
        ),
      );
      showToast(`${b.name} confirmed!`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to approve.', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleCancel = async (b: Booking) => {
    const key = `${b.eventId}::${b.name}`;
    setBusyKey(key);
    try {
      await cancelBooking(b.eventId, b.name);
      setBookings((prev) =>
        prev.filter((x) => !(x.eventId === b.eventId && x.name === b.name)),
      );
      showToast(`${b.name} removed.`, 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to cancel.', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div style={{ padding: '2rem 1.5rem 4rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: c.text, margin: '0 0 0.4rem', letterSpacing: '0.02em', lineHeight: 1 }}>
            SIGN-UPS
          </h1>
          <p style={{ color: c.textSecondary, fontSize: '0.9rem', margin: 0 }}>
            {loading ? 'Fetching…' : `${pending.length} pending · ${confirmed.length} confirmed`}
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          style={refreshBtn(c, loading)}
        >
          <span style={{ display: 'inline-block', animation: loading ? 'spin 0.9s linear infinite' : 'none' }}>↻</span>
          {loading ? 'Syncing…' : 'Refresh'}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {loading && <SkeletonList c={c} />}

      {!loading && (
        <>
          {/* Pending section */}
          <SectionHeader c={c} title="Pending approval" count={pending.length} accent="#d97706" />
          {pending.length === 0 ? (
            <EmptyState c={c} msg="No pending sign-ups." />
          ) : (
            byEvent(pending).map(({ event, rows }) => (
              <EventGroup key={event.id} event={event} rows={rows} c={c} busyKey={busyKey}
                onApprove={handleApprove} onCancel={handleCancel} showApprove />
            ))
          )}

          {/* Confirmed section */}
          <div style={{ marginTop: '2rem' }}>
            <SectionHeader c={c} title="Confirmed" count={confirmed.length} accent="#16a34a" />
            {confirmed.length === 0 ? (
              <EmptyState c={c} msg="No confirmed sign-ups yet." />
            ) : (
              byEvent(confirmed).map(({ event, rows }) => (
                <EventGroup key={event.id} event={event} rows={rows} c={c} busyKey={busyKey}
                  onApprove={handleApprove} onCancel={handleCancel} showApprove={false} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */

const SectionHeader: React.FC<{ c: ColorPalette; title: string; count: number; accent: string }> = ({ c, title, count, accent }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: c.text, letterSpacing: '0.02em' }}>
      {title.toUpperCase()}
    </span>
    <span style={{ padding: '0.15rem 0.6rem', borderRadius: '999px', background: accent + '20', border: `1px solid ${accent}44`, color: accent, fontSize: '0.68rem', fontWeight: 700 }}>
      {count}
    </span>
  </div>
);

const EmptyState: React.FC<{ c: ColorPalette; msg: string }> = ({ c, msg }) => (
  <div style={{ padding: '1.5rem', textAlign: 'center', borderRadius: '0.75rem', border: `1px dashed ${c.border}`, color: c.textSecondary, fontSize: '0.88rem', marginBottom: '1rem' }}>
    {msg}
  </div>
);

const SkeletonList: React.FC<{ c: ColorPalette }> = ({ c }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
    {[1, 2, 3].map((i) => (
      <div key={i} style={{ height: '68px', borderRadius: '0.75rem', backgroundColor: c.surface, border: `1px solid ${c.border}`, opacity: 1 - i * 0.2 }} />
    ))}
  </div>
);

const EventGroup: React.FC<{
  event: TrainingEvent;
  rows: Booking[];
  c: ColorPalette;
  busyKey: string | null;
  onApprove: (b: Booking) => void;
  onCancel: (b: Booking) => void;
  showApprove: boolean;
}> = ({ event, rows, c, busyKey, onApprove, onCancel, showApprove }) => (
  <div style={{ marginBottom: '1.5rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
      <span style={{ fontWeight: 600, fontSize: '0.88rem', color: c.text }}>{event.title}</span>
      {event.days.map((d) => (
        <span key={d.key} style={{ fontSize: '0.72rem', color: c.textSecondary }}>
          {d.label}: {formatShortDate(d.date)}
        </span>
      ))}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {rows.map((b) => {
        const key = `${b.eventId}::${b.name}`;
        const busy = busyKey === key;
        return (
          <div
            key={key}
            style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', padding: '0.75rem 0.9rem', borderRadius: '0.65rem', backgroundColor: c.surface, border: `1px solid ${c.border}` }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: c.text }}>{b.name}</span>
                <Chip label={attendingLabel(b.attending)} color={c.primary} />
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                {[b.gender, b.side, `${b.weight} kg`, ...(b.needPFD === 'Yes' ? ['PFD'] : []), ...(b.needPaddle === 'Yes' ? ['Paddle'] : [])].map((t) => (
                  <SmallChip key={t} label={t} c={c} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
              {showApprove && (
                <ActionBtn onClick={() => onApprove(b)} disabled={busy} color="#16a34a" label={busy ? '…' : '✓ Approve'} />
              )}
              <ActionBtn onClick={() => onCancel(b)} disabled={busy} color="#ef4444" label={busy ? '…' : 'Remove'} outline />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const Chip: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <span style={{ padding: '0.12rem 0.5rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', backgroundColor: color + '20', color, border: `1px solid ${color}44` }}>
    {label}
  </span>
);

const SmallChip: React.FC<{ label: string; c: ColorPalette }> = ({ label, c }) => (
  <span style={{ padding: '0.12rem 0.45rem', borderRadius: '999px', fontSize: '0.68rem', backgroundColor: c.background, color: c.textSecondary, border: `1px solid ${c.border}` }}>
    {label}
  </span>
);

const ActionBtn: React.FC<{ onClick: () => void; disabled: boolean; color: string; label: string; outline?: boolean }> = ({ onClick, disabled, color, label, outline }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: '0.4rem 0.85rem',
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
