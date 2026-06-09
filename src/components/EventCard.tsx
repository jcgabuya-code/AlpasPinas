import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';

export type EventResult = {
  rank: number;
  category: string;
  time: string;
  notes?: string;
};

export type RaceEvent = {
  id: string;
  name: string;
  location: string;
  date: string;            // ISO date (YYYY-MM-DD or full ISO)
  type: string;            // Regatta / Festival / Training Camp / ...
  description: string;
  thumbnail?: string;      // URL to hero image for the card
  thumbnailCredit?: string;
  result: EventResult | null;
};

/** Parse the YYYY-MM-DD date string into a local Date (no timezone surprises). */
export const parseEventDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

export const isUpcoming = (iso: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseEventDate(iso) >= today;
};

const MONTHS_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** Medal color for podium ranks. Returns null for 4th+ so the card stays neutral. */
const medalColor = (rank: number): string | null => {
  if (rank === 1) return '#facc15'; // gold
  if (rank === 2) return '#cbd5e1'; // silver
  if (rank === 3) return '#d97706'; // bronze
  return null;
};

const medalLabel = (rank: number) => {
  if (rank === 1) return 'Gold';
  if (rank === 2) return 'Silver';
  if (rank === 3) return 'Bronze';
  const suffix = rank % 10 === 1 ? 'st' : rank % 10 === 2 ? 'nd' : rank % 10 === 3 ? 'rd' : 'th';
  return `${rank}${suffix}`;
};

export const EventCard: React.FC<{ event: RaceEvent }> = ({ event: e }) => {
  const { theme } = useTheme();
  const c = colors[theme];

  const d = parseEventDate(e.date);
  const day = d.getDate();
  const month = MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  const upcoming = isUpcoming(e.date);
  const medal = e.result ? medalColor(e.result.rank) : null;

  return (
    <article
      style={{
        backgroundColor: c.surface,
        borderRadius: '0.85rem',
        border: `1px solid ${c.border}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Thumbnail with overlaid date badge + medal */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          backgroundColor: c.surfaceAlt,
          overflow: 'hidden',
        }}
      >
        {e.thumbnail ? (
          <img
            src={e.thumbnail}
            alt={`${e.name} — ${e.location}`}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          // Fallback gradient when no thumbnail is provided.
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(135deg, ${c.primaryDark} 0%, ${c.primary} 60%, ${c.primaryLight} 100%)`,
            }}
          />
        )}

        {/* Bottom shadow for legibility of overlay chips */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.55) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Date badge — top-left */}
        <div
          style={{
            position: 'absolute',
            top: '0.7rem',
            left: '0.7rem',
            backgroundColor: 'rgba(11, 16, 20, 0.78)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            borderRadius: '0.55rem',
            padding: '0.4rem 0.6rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: '#fff',
            minWidth: '52px',
            border: upcoming ? `1px solid ${c.primary}88` : '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: upcoming ? c.primaryLight : 'rgba(255,255,255,0.75)',
            }}
          >
            {month}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              lineHeight: 1,
              letterSpacing: '0.01em',
            }}
          >
            {day}
          </span>
          <span
            style={{
              fontSize: '0.6rem',
              opacity: 0.75,
              marginTop: '0.1rem',
            }}
          >
            {year}
          </span>
        </div>

        {/* Medal — top-right (only for ranked past results) */}
        {medal && e.result && (
          <span
            style={{
              position: 'absolute',
              top: '0.85rem',
              right: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.7rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(11, 16, 20, 0.78)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              border: `1px solid ${medal}88`,
              color: medal,
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>●</span>
            {medalLabel(e.result.rank)}
          </span>
        )}
      </div>

      {/* Body */}
      <div
        style={{
          padding: '1.1rem 1.15rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.55rem',
          flex: 1,
        }}
      >
        <span
          style={{
            alignSelf: 'flex-start',
            padding: '0.25rem 0.65rem',
            borderRadius: '999px',
            border: `1px solid ${c.border}`,
            backgroundColor: c.background,
            color: c.textSecondary,
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {e.type}
        </span>
        <h3
          style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: c.text,
            margin: 0,
            lineHeight: 1.25,
          }}
        >
          {e.name}
        </h3>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.82rem',
            color: c.textSecondary,
          }}
        >
          <PinIcon color={c.textSecondary} />
          {e.location}
        </div>

        <p
          style={{
            fontSize: '0.85rem',
            color: c.textSecondary,
            lineHeight: 1.55,
            margin: '0.2rem 0 0 0',
          }}
        >
          {e.description}
        </p>

        {e.result && (
          <div
            style={{
              marginTop: '0.7rem',
              padding: '0.7rem 0.85rem',
              borderRadius: '0.55rem',
              backgroundColor: c.background,
              border: `1px solid ${c.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
            }}
          >
            <div
              style={{
                fontSize: '0.7rem',
                color: c.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 600,
              }}
            >
              Result · {e.result.category}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.6rem',
                color: c.text,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  letterSpacing: '0.02em',
                }}
              >
                {medalLabel(e.result.rank)}
              </span>
              <span style={{ fontSize: '0.85rem', color: c.textSecondary }}>
                · {e.result.time}
              </span>
            </div>
            {e.result.notes && (
              <div style={{ fontSize: '0.78rem', color: c.textSecondary, marginTop: '0.15rem' }}>
                {e.result.notes}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

const PinIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
