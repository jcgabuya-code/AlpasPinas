import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { colors } from '../styles/colors';
import { attendingLabel, formatShortDate, type Booking } from '../utils/bookings';
import type { TrainingEvent } from './TrainingCard';

/**
 * "Your sign-ups" panel — lists the signed-in user's own bookings with status
 * badges and an inline cancel-with-confirm. Owns its own confirm-cancel state;
 * the parent supplies the (already name-filtered, upcoming-only) bookings and
 * the cancel handler.
 */
export const MyBookingsPanel: React.FC<{
  bookings: Booking[];
  eventById: Map<string, TrainingEvent>;
  onCancel: (b: Booking) => void;
}> = ({ bookings, eventById, onCancel }) => {
  const { theme } = useTheme();
  const c = colors[theme];
  const isMobile = useIsMobile();
  const [pendingCancel, setPendingCancel] = useState<string | null>(null);

  return (
    <section style={{ padding: isMobile ? '0 1.15rem 1rem' : '0 1.5rem 1rem', backgroundColor: c.background }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div
          style={{
            padding: '1.25rem',
            borderRadius: '0.85rem',
            border: `1px solid ${c.primary}55`,
            backgroundColor: `${c.primary}10`,
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: c.primary,
              fontWeight: 700,
              marginBottom: '0.75rem',
            }}
          >
            Your sign-ups
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {bookings.map((b) => {
              const ev = eventById.get(b.eventId);
              const cancelKey = `${b.eventId}::${b.name}`;
              const confirming = pendingCancel === cancelKey;
              const dayDates =
                b.attending === 'both'
                  ? ev?.days.map((d) => formatShortDate(d.date)).join(' + ')
                  : formatShortDate(
                      ev?.days.find((d) => d.key === b.attending)?.date ?? '',
                    );
              return (
                <div
                  key={`${b.eventId}-${b.name}-${b.createdAt}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '0.55rem',
                    backgroundColor: c.surface,
                    border: `1px solid ${confirming ? '#ef444466' : c.border}`,
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    {/* Name + attending badge + status badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: c.text }}>
                        {b.name}
                      </span>
                      <span
                        style={{
                          padding: '0.15rem 0.55rem',
                          borderRadius: '999px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase' as const,
                          backgroundColor: `${c.primary}20`,
                          color: c.primary,
                          border: `1px solid ${c.primary}44`,
                        }}
                      >
                        {attendingLabel(b.attending)}
                      </span>
                      {b.status === 'confirmed' ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.15rem 0.55rem',
                            borderRadius: '999px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase' as const,
                            backgroundColor: '#16a34a20',
                            color: '#16a34a',
                            border: '1px solid #16a34a44',
                          }}
                        >
                          <span style={{ fontSize: '0.6rem' }}>✓</span> Confirmed
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.15rem 0.55rem',
                            borderRadius: '999px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase' as const,
                            backgroundColor: '#d9770620',
                            color: '#d97706',
                            border: '1px solid #d9770644',
                          }}
                        >
                          <span style={{ fontSize: '0.55rem' }}>●</span> Waiting
                        </span>
                      )}
                    </div>
                    {/* Event title + dates */}
                    <div style={{ fontSize: '0.78rem', color: c.textSecondary, marginTop: '0.2rem' }}>
                      {ev ? ev.title : b.eventId} · {dayDates}
                    </div>
                    {/* Detail chips */}
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.45rem' }}>
                      {[
                        b.side,
                        `${b.weight} kg`,
                        ...(b.needPFD === 'Yes' ? ['PFD'] : []),
                        ...(b.needPaddle === 'Yes' ? ['Paddle'] : []),
                      ].map((tag) => (
                        <span
                          key={tag}
                          style={{
                            padding: '0.15rem 0.55rem',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 500,
                            backgroundColor: c.background,
                            color: c.textSecondary,
                            border: `1px solid ${c.border}`,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {confirming ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        flexShrink: 0,
                        flexWrap: 'wrap',
                        width: isMobile ? '100%' : 'auto',
                      }}
                    >
                      <span style={{ fontSize: '0.78rem', color: c.textSecondary, whiteSpace: 'nowrap' }}>
                        Remove sign-up?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingCancel(null);
                          onCancel(b);
                        }}
                        style={{
                          background: '#ef4444',
                          border: 'none',
                          color: '#fff',
                          padding: '0.55rem 0.85rem',
                          borderRadius: '999px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          flex: isMobile ? 1 : 'none',
                        }}
                      >
                        Yes, remove
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingCancel(null)}
                        style={{
                          background: 'transparent',
                          border: `1px solid ${c.border}`,
                          color: c.textSecondary,
                          padding: '0.55rem 0.85rem',
                          borderRadius: '999px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          flex: isMobile ? 1 : 'none',
                        }}
                      >
                        Keep
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPendingCancel(cancelKey)}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${c.border}`,
                        color: c.textSecondary,
                        padding: '0.55rem 0.85rem',
                        borderRadius: '999px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        width: isMobile ? '100%' : 'auto',
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
