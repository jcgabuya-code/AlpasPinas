import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { colors, brandGradient } from '../styles/colors';
import {
  attendingLabel,
  takenForDay,
  formatShortDate,
  isUpcomingDate,
  type Booking,
  type EventCounts,
} from '../utils/bookings';
import { Clock, MapPin, Users, ArrowRight, Check } from 'lucide-react';
import { LandGlyph, WaveGlyph } from './icons/trainingGlyphs';

export type TrainingDay = {
  key: string;        // 'sat' | 'sun' (free-form so future events can have any day key)
  label: string;      // 'Saturday'
  date: string;       // YYYY-MM-DD
  time: string;       // 'HH:MM'
  location: string;
  capacity: number;
};

export type TrainingEvent = {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  thumbnailCredit?: string;
  /** Which discipline this event belongs to — drives the venue badge + which
   * page section it renders in. Defaults to 'lake' for older data without it. */
  venue?: 'land' | 'lake';
  days: TrainingDay[];
};

type Props = {
  event: TrainingEvent;
  counts: EventCounts;
  onBook: (event: TrainingEvent) => void;
  /** The signed-in user's own sign-up for this event, if any — drives the
   * "you're in" treatment (badge, border, disabled button) up front instead of
   * only surfacing at submit time. */
  myBooking?: Booking;
};

export const TrainingCard: React.FC<Props> = ({ event, counts, onBook, myBooking }) => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const isMobile = useIsMobile();
  const alreadyBooked = !!myBooking;

  const dayStats = event.days.map((d) => {
    const taken = takenForDay(counts, event.id, d.key);
    const remaining = Math.max(0, d.capacity - taken);
    return { day: d, taken, remaining, full: remaining === 0 };
  });
  const anyOpen = dayStats.some((s) => !s.full);
  const stillUpcoming = event.days.some((d) => isUpcomingDate(d.date));

  return (
    <article
      style={{
        backgroundColor: alreadyBooked ? `${c.primary}0a` : c.surface,
        borderRadius: '0.85rem',
        border: `1px solid ${alreadyBooked ? c.primary + '80' : c.border}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Body */}
      <div
        style={{
          padding: isMobile ? '1.15rem 1.15rem 1.25rem' : '1.4rem 1.4rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '0.85rem' : '1rem',
          flex: 1,
        }}
      >
      {/* Title + description */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: isMobile ? '1.45rem' : '1.7rem',
              margin: 0,
              color: c.text,
              letterSpacing: '0.02em',
              lineHeight: 1.05,
            }}
          >
            {event.title.toUpperCase()}
          </h3>
          <span
            aria-hidden="true"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2rem',
              height: '2rem',
              flexShrink: 0,
              borderRadius: '999px',
              backgroundColor: `${c.primary}1f`,
              border: `1px solid ${c.primary}59`,
            }}
          >
            {event.venue === 'land' ? <LandGlyph color={c.primary} size={15} /> : <WaveGlyph color={c.primary} size={15} />}
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.65rem',
              borderRadius: '999px',
              backgroundColor: stillUpcoming ? `${c.primary}15` : c.surfaceAlt,
              border: `1px solid ${stillUpcoming ? c.primary + '55' : c.border}`,
              color: stillUpcoming ? c.primary : c.textSecondary,
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
            }}
          >
            {stillUpcoming ? 'Upcoming' : 'Past'}
          </span>
          {myBooking && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                backgroundColor: myBooking.status === 'confirmed' ? `${c.primary}22` : '#d9770620',
                border: `1px solid ${myBooking.status === 'confirmed' ? c.primary + '66' : '#d9770655'}`,
                color: myBooking.status === 'confirmed' ? c.primaryLight : '#d97706',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              {myBooking.status === 'confirmed' ? <Check size={11} /> : <span style={{ fontSize: '0.55rem' }}>●</span>}
              {myBooking.status === 'confirmed' ? "You're confirmed" : "You're on the list"} · {attendingLabel(myBooking.attending, event)}
            </span>
          )}
        </div>
        <p
          style={{
            color: c.textSecondary,
            fontSize: '0.88rem',
            lineHeight: 1.55,
            margin: '0.65rem 0 0 0',
          }}
        >
          {event.description}
        </p>
      </div>

      {/* Per-day breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {dayStats.map(({ day, remaining, full, taken }) => {
          const pct = Math.min(100, Math.round((taken / day.capacity) * 100));
          return (
            <div
              key={day.key}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '0.6rem',
                border: `1px solid ${c.border}`,
                backgroundColor: c.background,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.1rem',
                      letterSpacing: '0.02em',
                      color: c.text,
                    }}
                  >
                    {day.label.toUpperCase()} · {formatShortDate(day.date)}
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', fontSize: '0.78rem', color: c.textSecondary }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> {day.time}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={12} /> {day.location}
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.78rem',
                    color: full ? '#fca5a5' : c.textSecondary,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  <Users size={12} />
                  {full ? 'Full' : `${remaining} / ${day.capacity} left`}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '5px',
                  borderRadius: '999px',
                  backgroundColor: c.surfaceAlt,
                  overflow: 'hidden',
                  marginTop: '0.55rem',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: full ? '#ef4444' : brandGradient(brand, theme),
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onBook(event)}
        disabled={alreadyBooked || !stillUpcoming}
        style={{
          marginTop: '0.2rem',
          padding: '0.8rem 1rem',
          borderRadius: '999px',
          border: alreadyBooked ? `1px solid ${c.primary}66` : 'none',
          background: alreadyBooked ? `${c.primary}18` : !stillUpcoming ? c.border : brandGradient(brand, theme),
          color: alreadyBooked ? c.primaryLight : '#fff',
          fontWeight: 700,
          fontSize: '0.92rem',
          letterSpacing: '0.02em',
          cursor: alreadyBooked || !stillUpcoming ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          boxShadow: alreadyBooked || !stillUpcoming ? 'none' : `0 6px 18px ${c.primary}33`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
        }}
      >
        {alreadyBooked
          ? <><Check size={16} /><span>Already signed up</span></>
          : !stillUpcoming
            ? 'Past weekend'
            : !anyOpen
              ? <><span>Join waitlist</span><ArrowRight size={16} /></>
              : <><span>Sign up</span><ArrowRight size={16} /></>}
      </button>
      </div>
    </article>
  );
};
