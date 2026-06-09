import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';
import { TrainingCard, type TrainingEvent } from '../components/TrainingCard';
import { getTrainingEvents, subscribeTrainingEvents } from '../utils/adminTrainingEvents';
import { BookingModal } from '../components/BookingModal';
import {
  attendingLabel,
  cancelBooking,
  fetchBookings,
  formatShortDate,
  getAllBookings,
  isUpcomingDate,
  subscribeBookings,
  type Booking,
} from '../utils/bookings';

const STATUS_SEEN_KEY = 'alpas-booking-status-seen';

const getSeenStatuses = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(STATUS_SEEN_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveSeenStatuses = (bookings: Booking[]) => {
  const seen: Record<string, string> = {};
  bookings.forEach((b) => {
    seen[`${b.eventId}::${b.name}`] = b.status;
  });
  localStorage.setItem(STATUS_SEEN_KEY, JSON.stringify(seen));
};

export const Training: React.FC = () => {
  const { theme } = useTheme();
  const c = colors[theme];

  const [events, setEvents] = useState<TrainingEvent[]>(() => getTrainingEvents());
  const [bookings, setBookings] = useState<Booking[]>(() => getAllBookings());
  const [modalEvent, setModalEvent] = useState<TrainingEvent | null>(null);
  const [pendingCancel, setPendingCancel] = useState<string | null>(null);
  const [confirmedNotices, setConfirmedNotices] = useState<Booking[]>([]);

  useEffect(() => {
    const refresh = () => setBookings(getAllBookings());
    const unsub = subscribeBookings(refresh);
    const unsubEvents = subscribeTrainingEvents(() => setEvents(getTrainingEvents()));
    fetchBookings().then((fresh) => {
      // Compare fresh statuses against last-seen to detect newly confirmed bookings.
      const seen = getSeenStatuses();
      const newlyConfirmed = fresh.filter((b) => {
        const key = `${b.eventId}::${b.name}`;
        return b.status === 'confirmed' && seen[key] !== 'confirmed';
      });
      if (newlyConfirmed.length > 0) setConfirmedNotices(newlyConfirmed);
      saveSeenStatuses(fresh);
      setBookings(fresh);
    });
    return () => { unsub(); unsubEvents(); };
  }, []);

  const handleCancel = (eventId: string, name: string) => {
    cancelBooking(eventId, name).catch(() => {
      // Swallow — the list stays as-is; user can retry.
    });
  };

  const eventById = useMemo(() => {
    const m = new Map<string, TrainingEvent>();
    events.forEach((e) => m.set(e.id, e));
    return m;
  }, [events]);

  // Bookings the user has made for events that still have at least one upcoming day.
  const myBookings = useMemo(
    () =>
      bookings
        .filter((b) => {
          const ev = eventById.get(b.eventId);
          return ev && ev.days.some((d) => isUpcomingDate(d.date));
        })
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [bookings, eventById],
  );

  return (
    <>
      {/* Hero banner */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          height: 'clamp(140px, 22vw, 240px)',
          overflow: 'hidden',
          backgroundColor: c.surface,
        }}
      >
        <img
          src="/team.jpg"
          alt="AlpasPinas team training"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 25%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 45%, ${c.background} 100%)`,
          }}
        />
      </section>

      {/* Page header */}
      <section style={{ padding: '2.5rem 1.5rem 1.5rem', backgroundColor: c.background }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <Link
            to="/"
            style={{
              display: 'inline-block',
              color: c.textSecondary,
              textDecoration: 'none',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
            ← Back to home
          </Link>

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
            Training sign-up
          </span>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
              color: c.text,
              margin: '0 0 0.75rem 0',
              letterSpacing: '0.02em',
              lineHeight: 1,
            }}
          >
            PADDLE WITH <span style={{ color: c.primary }}>US</span>
          </h1>

          <p
            style={{
              color: c.textSecondary,
              fontSize: '1rem',
              maxWidth: '640px',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Lake training weekends in Malaysia. Sign up for Saturday, Sunday, or both —
            tell us your side, weight, and whether you need a PFD or paddle.
          </p>
        </div>
      </section>

      {/* My bookings panel — only renders if user has at least one */}
      {myBookings.length > 0 && (
        <section style={{ padding: '0 1.5rem 1rem', backgroundColor: c.background }}>
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
                {myBookings.map((b) => {
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.78rem', color: c.textSecondary, whiteSpace: 'nowrap' }}>
                            Remove sign-up?
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setPendingCancel(null);
                              handleCancel(b.eventId, b.name);
                            }}
                            style={{
                              background: '#ef4444',
                              border: 'none',
                              color: '#fff',
                              padding: '0.4rem 0.85rem',
                              borderRadius: '999px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
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
                              padding: '0.4rem 0.85rem',
                              borderRadius: '999px',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
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
                            padding: '0.4rem 0.85rem',
                            borderRadius: '999px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
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
      )}

      {/* Events grid */}
      <section style={{ padding: '1rem 1.5rem 5rem', backgroundColor: c.background }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
              color: c.text,
              margin: '0.5rem 0 1.25rem',
              letterSpacing: '0.02em',
            }}
          >
            UPCOMING WEEKENDS
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {events.map((ev) => (
              <TrainingCard
                key={ev.id}
                event={ev}
                bookings={bookings}
                onBook={setModalEvent}
              />
            ))}
          </div>

          <p
            style={{
              marginTop: '2rem',
              color: c.textSecondary,
              fontSize: '0.78rem',
              textAlign: 'center',
              opacity: 0.7,
            }}
          >
            Edit{' '}
            <code style={{ color: c.primary }}>src/data/training.json</code> for the
            real schedule. Sign-ups are saved to the team's Google Sheet.
          </p>
        </div>
      </section>

      {confirmedNotices.length > 0 && (
        <ConfirmedNotification
          bookings={confirmedNotices}
          eventById={eventById}
          onClose={() => setConfirmedNotices([])}
        />
      )}

      <BookingModal
        open={modalEvent !== null}
        event={modalEvent}
        onClose={() => setModalEvent(null)}
      />
    </>
  );
};

const ConfirmedNotification: React.FC<{
  bookings: Booking[];
  eventById: Map<string, TrainingEvent>;
  onClose: () => void;
}> = ({ bookings, eventById, onClose }) => {
  const { theme } = useTheme();
  const c = colors[theme];

  return (
    <>
      <style>{`
        @keyframes alpas-confirmed-pop {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(480px, calc(100vw - 2rem))',
          backgroundColor: c.surface,
          border: `1px solid #16a34a55`,
          borderRadius: '1rem',
          boxShadow: `0 16px 48px rgba(0,0,0,0.35), 0 0 0 1px #16a34a22`,
          animation: 'alpas-confirmed-pop 220ms cubic-bezier(0.34,1.56,0.64,1)',
          overflow: 'hidden',
        }}
      >
        {/* Green top accent bar */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #16a34a, #22c55e)' }} />

        <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px #16a34a40',
                }}
              >
                ✓
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.15rem',
                    letterSpacing: '0.02em',
                    color: c.text,
                    lineHeight: 1.1,
                  }}
                >
                  YOU'RE CONFIRMED!
                </div>
                <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600, marginTop: '0.2rem' }}>
                  {bookings.length === 1 ? 'Your spot is locked in' : `${bookings.length} bookings confirmed`}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Dismiss"
              style={{
                background: 'transparent',
                border: `1px solid ${c.border}`,
                color: c.textSecondary,
                width: '28px',
                height: '28px',
                borderRadius: '999px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontFamily: 'inherit',
              }}
            >
              ×
            </button>
          </div>

          {/* Confirmed booking rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {bookings.map((b) => {
              const ev = eventById.get(b.eventId);
              return (
                <div
                  key={`${b.eventId}::${b.name}`}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.6rem',
                    backgroundColor: '#16a34a10',
                    border: '1px solid #16a34a30',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: c.text }}>{b.name}</div>
                    <div style={{ fontSize: '0.75rem', color: c.textSecondary, marginTop: '0.15rem' }}>
                      {ev ? ev.title : b.eventId} · {attendingLabel(b.attending)}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const,
                      backgroundColor: '#16a34a20',
                      color: '#16a34a',
                      border: '1px solid #16a34a44',
                    }}
                  >
                    ✓ Confirmed
                  </span>
                </div>
              );
            })}
          </div>

          {/* Message */}
          <p
            style={{
              margin: '0 0 1.25rem 0',
              fontSize: '0.82rem',
              color: c.textSecondary,
              lineHeight: 1.6,
            }}
          >
            Your spot is secured — please make sure to be there on time and ready to paddle.
            See you on the water! 🚣
          </p>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.6rem',
              border: 'none',
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 16px #16a34a33',
            }}
          >
            Got it, see you there!
          </button>
        </div>
      </div>
      </div>
    </>
  );
};
