import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { colors } from '../styles/colors';
import { TrainingCard, type TrainingEvent } from '../components/TrainingCard';
import { getTrainingEvents, subscribeTrainingEvents } from '../utils/adminTrainingEvents';
import { BookingModal } from '../components/BookingModal';
import { MyBookingsPanel } from '../components/MyBookingsPanel';
import { ConfirmedNotification } from '../components/ConfirmedNotification';
import {
  cancelBooking,
  fetchBookings,
  fetchEventCounts,
  getAllBookings,
  getEventCounts,
  isUpcomingDate,
  subscribeBookings,
  type Booking,
  type EventCounts,
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

/** An event is shown while at least one of its days is still today-or-later. */
const isEventUpcoming = (ev: TrainingEvent) => ev.days.some((d) => isUpcomingDate(d.date));

export const Training: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const c = colors[theme];
  const isMobile = useIsMobile();

  const [events, setEvents] = useState<TrainingEvent[]>(() => getTrainingEvents());
  const [bookings, setBookings] = useState<Booking[]>(() => getAllBookings());
  const [counts, setCounts] = useState<EventCounts>(() => getEventCounts());
  const [modalEvent, setModalEvent] = useState<TrainingEvent | null>(null);
  const [confirmedNotices, setConfirmedNotices] = useState<Booking[]>([]);

  // Latest signed-in name, read inside the mount effect without re-subscribing.
  const myNameRef = useRef<string | undefined>(undefined);
  myNameRef.current = user?.name.trim().toLowerCase();

  useEffect(() => {
    const refresh = () => { setBookings(getAllBookings()); setCounts(getEventCounts()); };
    const unsub = subscribeBookings(refresh);
    const unsubEvents = subscribeTrainingEvents(() => setEvents(getTrainingEvents()));
    fetchEventCounts().then(setCounts);
    fetchBookings().then((fresh) => {
      // Detect the signed-in user's OWN newly confirmed bookings (status flipped
      // since last seen). Scoped by name so one person's approval doesn't pop a
      // confirmation modal for everyone viewing the page.
      const seen = getSeenStatuses();
      const me = myNameRef.current;
      const newlyConfirmed = fresh.filter((b) => {
        if (!me || b.name.trim().toLowerCase() !== me) return false;
        const key = `${b.eventId}::${b.name}`;
        return b.status === 'confirmed' && seen[key] !== 'confirmed';
      });
      if (newlyConfirmed.length > 0) setConfirmedNotices(newlyConfirmed);
      saveSeenStatuses(fresh);
      setBookings(fresh);
    });
    return () => { unsub(); unsubEvents(); };
  }, []);

  const handleCancel = (b: Booking) => {
    if (!b.id) return;
    cancelBooking(b.id).catch(() => {
      // Swallow — the list stays as-is; user can retry.
    });
  };

  // Past weekends drop off the public listing entirely.
  const upcomingEvents = useMemo(() => events.filter(isEventUpcoming), [events]);

  const eventById = useMemo(() => {
    const m = new Map<string, TrainingEvent>();
    events.forEach((e) => m.set(e.id, e));
    return m;
  }, [events]);

  // The signed-in user's own bookings, for events that still have at least one
  // upcoming day. Matched by name (bookings carry no user id). Without this the
  // panel would list — and offer to cancel — everyone's sign-ups.
  const myName = user?.name.trim().toLowerCase();

  // Event IDs the signed-in user has already signed up for — used to block a
  // second sign-up for the same weekend straight from the card.
  const myBookedEventIds = useMemo(() => {
    const ids = new Set<string>();
    if (!myName) return ids;
    bookings.forEach((b) => {
      if (b.name.trim().toLowerCase() === myName) ids.add(b.eventId);
    });
    return ids;
  }, [bookings, myName]);

  const myBookings = useMemo(
    () =>
      bookings
        .filter((b) => {
          if (!myName || b.name.trim().toLowerCase() !== myName) return false;
          const ev = eventById.get(b.eventId);
          return ev && isEventUpcoming(ev);
        })
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [bookings, eventById, myName],
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
      <section style={{ padding: isMobile ? '1.75rem 1.15rem 1.25rem' : '2.5rem 1.5rem 1.5rem', backgroundColor: c.background }}>
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
        <MyBookingsPanel
          bookings={myBookings}
          eventById={eventById}
          onCancel={handleCancel}
        />
      )}

      {/* Events grid */}
      <section style={{ padding: isMobile ? '0.75rem 1.15rem 4rem' : '1rem 1.5rem 5rem', backgroundColor: c.background }}>
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

          {upcomingEvents.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {upcomingEvents.map((ev) => (
                <TrainingCard
                  key={ev.id}
                  event={ev}
                  counts={counts}
                  onBook={setModalEvent}
                  alreadyBooked={myBookedEventIds.has(ev.id)}
                />
              ))}
            </div>
          ) : (
            <p
              style={{
                color: c.textSecondary,
                fontSize: '0.95rem',
                lineHeight: 1.6,
                margin: '0.5rem 0',
              }}
            >
              No upcoming weekends scheduled right now — check back soon.
            </p>
          )}

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
            real schedule. Sign-ups are saved to your team account.
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
