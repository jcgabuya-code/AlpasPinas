import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';
import { attendingLabel, type Booking } from '../utils/bookings';
import type { TrainingEvent } from './TrainingCard';

/**
 * Celebratory modal that pops when the signed-in user's own sign-up(s) flip to
 * `confirmed` since they last saw the page. Purely presentational — the parent
 * decides when to show it and tracks "seen" status.
 */
export const ConfirmedNotification: React.FC<{
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
