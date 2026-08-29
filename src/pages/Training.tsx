import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { useInView } from '../hooks/useInView';
import { colors } from '../styles/colors';
import { sectionShell, contentMaxWidth } from '../styles/tokens';
import { Eyebrow } from '../components/SectionHeader';
import { TrainingCard, type TrainingEvent } from '../components/TrainingCard';
import { fetchTrainingEvents, subscribeTrainingEvents } from '../utils/trainingEvents';
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
  const { theme, brand } = useTheme();
  const { user } = useAuth();
  const c = colors[brand][theme];
  const isMobile = useIsMobile();
  const accent = theme === 'dark' ? c.primaryLight : c.primary;

  const [events, setEvents] = useState<TrainingEvent[]>([]);
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
    const unsubEvents = subscribeTrainingEvents(() => { fetchTrainingEvents().then(setEvents); });
    fetchTrainingEvents().then(setEvents);
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

  // Past sessions drop off the public listing entirely, split by discipline.
  const upcomingEvents = useMemo(() => events.filter(isEventUpcoming), [events]);
  const landEvents = useMemo(() => upcomingEvents.filter((ev) => (ev.venue ?? 'lake') === 'land'), [upcomingEvents]);
  const lakeEvents = useMemo(() => upcomingEvents.filter((ev) => (ev.venue ?? 'lake') === 'lake'), [upcomingEvents]);

  const eventById = useMemo(() => {
    const m = new Map<string, TrainingEvent>();
    events.forEach((e) => m.set(e.id, e));
    return m;
  }, [events]);

  // The signed-in user's own bookings, for events that still have at least one
  // upcoming day. Matched by name (bookings carry no user id). Without this the
  // panel would list — and offer to cancel — everyone's sign-ups.
  const myName = user?.name.trim().toLowerCase();

  // The signed-in user's own booking per event — surfaced directly on the card
  // (badge + border + disabled button) so "you're already in" is visible while
  // browsing, not just discovered at submit time in the modal.
  const myBookingByEventId = useMemo(() => {
    const m = new Map<string, Booking>();
    if (!myName) return m;
    bookings.forEach((b) => {
      if (b.name.trim().toLowerCase() === myName) m.set(b.eventId, b);
    });
    return m;
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

  const [landRef, landInView] = useInView<HTMLDivElement>();
  const [lakeRef, lakeInView] = useInView<HTMLDivElement>();

  // Shared lane pieces so the mobile stack and the desktop split-waterline layout
  // render from one source instead of duplicating the header/grid markup. Each
  // card already carries its own discipline kicker (photo banner), so the lane
  // itself only needs a small caption, not a duplicate icon+label.
  const renderLaneHeader = (label: string, inView: boolean) => (
    <div className={`reveal${inView ? ' is-visible' : ''}`} style={{ marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
      <Eyebrow>{label}</Eyebrow>
    </div>
  );

  const renderLaneCards = (laneEvents: TrainingEvent[], inView: boolean, emptyText: string) =>
    laneEvents.length > 0 ? (
      <div
        className={`reveal${inView ? ' is-visible' : ''}`}
        style={{
          animationDelay: '0.08s',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.25rem',
          alignContent: 'start',
        }}
      >
        {laneEvents.map((ev) => (
          <TrainingCard
            key={ev.id}
            event={ev}
            counts={counts}
            onBook={setModalEvent}
            myBooking={myBookingByEventId.get(ev.id)}
          />
        ))}
      </div>
    ) : (
      <p style={{ color: c.textSecondary, fontSize: '0.95rem', lineHeight: 1.6, margin: '0.5rem 0' }}>{emptyText}</p>
    );

  const landHeader = renderLaneHeader('ON LAND', landInView);
  const lakeHeader = renderLaneHeader('ON THE WATER', lakeInView);
  const landBody = renderLaneCards(landEvents, landInView, 'No land sessions scheduled right now — check back soon.');
  const lakeBody = renderLaneCards(lakeEvents, lakeInView, 'No upcoming weekends scheduled right now — check back soon.');
  const adminNote = (
    <p
      style={{
        color: c.textSecondary,
        fontSize: '0.78rem',
        textAlign: 'center',
        opacity: 0.6,
      }}
    >
      Manage sessions from the admin Events panel.
    </p>
  );

  return (
    <>
      {/* Header — Shop.tsx's already-v2 pattern: back-link, display h1 with the
          wake-underline motif on the accent word. No image hero, no eyebrow chip. */}
      <section
        style={{
          paddingBlock: isMobile ? 'clamp(2.5rem, 6vw, 4rem) 2rem' : 'clamp(3rem, 6vw, 5rem) clamp(2rem, 4vw, 3.5rem)',
          paddingInline: 'clamp(1rem, 4vw, 2rem)',
          backgroundColor: c.background,
        }}
      >
        <div style={{ maxWidth: contentMaxWidth, margin: '0 auto' }}>
          <Link
            to="/"
            style={{ display: 'inline-block', color: c.accent, textDecoration: 'none', fontSize: '0.85rem', marginBottom: isMobile ? '1.25rem' : '2rem' }}
          >
            ← Back to home
          </Link>

          {/* Masthead — on desktop the display headline and the intro sit as two
              columns of one editorial band so the line fills the width instead of
              a narrow left-stacked (mobile) column with dead space to the right. */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.55fr) minmax(0, 1fr)',
              columnGap: 'clamp(2rem, 5vw, 4.5rem)',
              rowGap: '1.1rem',
              alignItems: 'end',
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: isMobile ? 'clamp(2.5rem, 12vw, 3.5rem)' : 'clamp(3.5rem, 7vw, 5.5rem)',
                color: c.text,
                margin: 0,
                letterSpacing: '0.01em',
                lineHeight: 0.92,
                textWrap: 'balance' as const,
              }}
            >
              TRAIN WITH{' '}
              <span style={{ position: 'relative', display: 'inline-block', color: accent }}>
                US
                <span
                  aria-hidden="true"
                  className="wake-underline"
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: '0.02em',
                    height: '0.07em',
                    borderRadius: '999px',
                    background: `linear-gradient(90deg, ${accent}, ${c.sun})`,
                  }}
                />
              </span>
            </h1>

            <p
              style={{
                color: c.text,
                fontSize: isMobile ? '1rem' : '1.05rem',
                maxWidth: isMobile ? '640px' : 'none',
                lineHeight: 1.65,
                margin: 0,
                paddingTop: isMobile ? 0 : '1.1rem',
                borderTop: isMobile ? 'none' : `1px solid ${c.border}`,
              }}
            >
              Two disciplines, one crew: weeknight land conditioning to build the engine, weekend
              lake sessions to put it in the boat. Sign up below — all sessions save to your team
              account.
            </p>
          </div>
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

      {isMobile ? (
        <>
          {/* On Land — weeknight conditioning */}
          <section ref={landRef} style={{ backgroundColor: c.background, borderTop: `1px solid ${c.border}`, ...sectionShell }}>
            <div style={{ maxWidth: contentMaxWidth, margin: '0 auto' }}>
              {landHeader}
              {landBody}
            </div>
          </section>

          {/* On the Water — weekend lake crew time */}
          <section ref={lakeRef} style={{ backgroundColor: c.background, borderTop: `1px solid ${c.border}`, ...sectionShell }}>
            <div style={{ maxWidth: contentMaxWidth, margin: '0 auto' }}>
              {lakeHeader}
              {lakeBody}
              <div style={{ marginTop: '2.5rem' }}>{adminNote}</div>
            </div>
          </section>
        </>
      ) : (
        /* Desktop — Land and Water run as two equal lanes side by side on one
           unified background. The lane headers (glyph + label) carry the split;
           no divider, no tinted halves. Fills the width the old stacked single-
           column grids left empty. */
        <section style={{ borderTop: `1px solid ${c.border}`, backgroundColor: c.background, ...sectionShell }}>
          <div
            style={{
              maxWidth: contentMaxWidth,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              columnGap: 'clamp(1.5rem, 3vw, 2.5rem)',
              alignItems: 'start',
            }}
          >
            <div ref={landRef} style={{ display: 'flex', flexDirection: 'column' }}>
              {landHeader}
              {landBody}
            </div>

            <div ref={lakeRef} style={{ display: 'flex', flexDirection: 'column' }}>
              {lakeHeader}
              {lakeBody}
            </div>
          </div>

          <div style={{ maxWidth: contentMaxWidth, margin: '3rem auto 0' }}>{adminNote}</div>
        </section>
      )}

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
