import React, { useState } from 'react';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { colors } from '../styles/colors';
import { attendingLabel, formatShortDate, formatTime, type Booking } from '../utils/bookings';
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
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const accent = theme === 'dark' ? c.primaryLight : c.primary;
  const isMobile = useIsMobile();
  const [pendingCancel, setPendingCancel] = useState<string | null>(null);

  return (
    <section style={{ padding: isMobile ? '0 1.15rem 1rem' : '0 1.5rem 1rem', backgroundColor: c.background }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div
          style={{
            padding: '1.25rem',
            borderRadius: '0.85rem',
            border: `1px solid ${accent}55`,
            backgroundColor: `${accent}10`,
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: accent,
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
              const selectedDays = ev?.days.filter((d) => b.attending === 'both' || d.key === b.attending) ?? [];
              const detailTags = [
                b.side,
                b.weight !== undefined ? `${b.weight} kg` : null,
                ...(b.needPFD === 'Yes' ? ['PFD'] : []),
                ...(b.needPaddle === 'Yes' ? ['Paddle'] : []),
              ].filter((value): value is string => Boolean(value));
              return (
                <div
                  key={`${b.eventId}-${b.name}-${b.createdAt}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    padding: isMobile ? '0.9rem' : '1rem',
                    borderRadius: '0.65rem',
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
                          backgroundColor: `${accent}20`,
                          color: accent,
                          border: `1px solid ${accent}44`,
                        }}
                      >
                        {attendingLabel(b.attending, ev)}
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
                            backgroundColor: `${accent}20`,
                            color: accent,
                            border: `1px solid ${accent}44`,
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
                    <div style={{ fontSize: '0.88rem', color: c.text, fontWeight: 600, marginTop: '0.45rem' }}>
                      {ev ? ev.title : b.eventTitle ?? b.eventId}
                    </div>
                    {selectedDays.length > 0 ? (
                      <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.7rem' }}>
                        {selectedDays.map((day) => (
                          <div
                            key={day.key}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.65rem',
                              flexWrap: 'wrap',
                              color: c.textSecondary,
                              fontSize: '0.78rem',
                              lineHeight: 1.4,
                            }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: c.text }}>
                              <CalendarDays size={14} strokeWidth={1.8} aria-hidden />
                              <strong>{day.label}</strong>&nbsp;{formatShortDate(day.date)}
                            </span>
                            <span aria-hidden style={{ color: c.border }}>•</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Clock size={14} strokeWidth={1.8} aria-hidden />
                              {formatTime(day.time)}
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', minWidth: 0 }}>
                              <MapPin size={14} strokeWidth={1.8} aria-hidden style={{ flexShrink: 0 }} />
                              {day.location}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.78rem', color: c.textSecondary, marginTop: '0.3rem' }}>
                        Session details are being updated.
                      </div>
                    )}
                    {detailTags.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.7rem' }}>
                      {detailTags.map((tag) => (
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
                    )}
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
