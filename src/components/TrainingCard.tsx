import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { colors, emeraldGradient } from '../styles/colors';
import {
  countForEventDay,
  formatShortDate,
  isUpcomingDate,
  type Booking,
} from '../utils/bookings';
import { Clock, MapPin, Users, ArrowRight } from 'lucide-react';

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
  days: TrainingDay[];
};

type Props = {
  event: TrainingEvent;
  bookings: Booking[];
  onBook: (event: TrainingEvent) => void;
};

export const TrainingCard: React.FC<Props> = ({ event, bookings, onBook }) => {
  const { theme } = useTheme();
  const c = colors[theme];

  const dayStats = event.days.map((d) => {
    const taken = countForEventDay(bookings, event.id, d.key);
    const remaining = Math.max(0, d.capacity - taken);
    return { day: d, taken, remaining, full: remaining === 0 };
  });
  const anyOpen = dayStats.some((s) => !s.full);
  const stillUpcoming = event.days.some((d) => isUpcomingDate(d.date));

  return (
    <article
      style={{
        backgroundColor: c.surface,
        borderRadius: '0.85rem',
        border: `1px solid ${c.border}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          backgroundColor: c.surfaceAlt,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {event.thumbnail ? (
          <img
            src={event.thumbnail}
            alt={event.title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: emeraldGradient(theme),
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
        <span
          style={{
            position: 'absolute',
            top: '0.7rem',
            left: '0.7rem',
            padding: '0.3rem 0.7rem',
            borderRadius: '999px',
            backgroundColor: 'rgba(11, 16, 20, 0.78)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            border: `1px solid ${stillUpcoming ? c.primary + '88' : 'rgba(255,255,255,0.1)'}`,
            color: stillUpcoming ? c.primaryLight : 'rgba(255,255,255,0.75)',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
          }}
        >
          {stillUpcoming ? 'Upcoming' : 'Past'}
        </span>
      </div>

      {/* Body */}
      <div
        style={{
          padding: '1.4rem 1.4rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          flex: 1,
        }}
      >
      {/* Title + description */}
      <div>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.7rem',
            margin: 0,
            color: c.text,
            letterSpacing: '0.02em',
            lineHeight: 1.05,
          }}
        >
          {event.title.toUpperCase()}
        </h3>
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
                    background: full ? '#ef4444' : emeraldGradient(theme),
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
        disabled={!anyOpen || !stillUpcoming}
        style={{
          marginTop: '0.2rem',
          padding: '0.8rem 1rem',
          borderRadius: '999px',
          border: 'none',
          background: !anyOpen || !stillUpcoming ? c.border : emeraldGradient(theme),
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.92rem',
          letterSpacing: '0.02em',
          cursor: !anyOpen || !stillUpcoming ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          boxShadow: !anyOpen || !stillUpcoming ? 'none' : `0 6px 18px ${c.primary}33`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
        }}
      >
        {!stillUpcoming
          ? 'Past weekend'
          : !anyOpen
            ? 'Both days full'
            : <><span>Sign up</span><ArrowRight size={16} /></>}
      </button>
      </div>
    </article>
  );
};
