import React, { useEffect, useState } from 'react';
import { type ColorPalette } from '../../styles/colors';
import { type ShowToast } from '../Admin';
import { fetchBookings, getAllBookings, type Booking } from '../../utils/bookings';
import { getTrainingEvents } from '../../utils/adminTrainingEvents';
import { getRaceEvents } from '../../utils/adminRaceEvents';
import { getAllRoster } from '../../utils/roster';

type Props = { showToast: ShowToast; c: ColorPalette; theme: 'dark' | 'light' };

export const AdminDashboard: React.FC<Props> = ({ c }) => {
  const [bookings, setBookings] = useState<Booking[]>(() => getAllBookings());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings()
      .then(setBookings)
      .finally(() => setLoading(false));
  }, []);

  const pending   = bookings.filter((b) => b.status === 'waiting').length;
  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
  const members   = getAllRoster().length;
  const training  = getTrainingEvents().length;
  const races     = getRaceEvents().filter((e) => e.date >= new Date().toISOString().slice(0, 10)).length;

  const stats: { label: string; value: number | string; sub: string; accent?: string }[] = [
    { label: 'Pending approvals', value: loading ? '…' : pending,   sub: 'awaiting confirmation', accent: pending > 0 ? '#d97706' : undefined },
    { label: 'Confirmed sign-ups', value: loading ? '…' : confirmed, sub: 'across all events' },
    { label: 'Active members',    value: members,   sub: 'on the roster' },
    { label: 'Training sessions', value: training,  sub: 'in the schedule' },
    { label: 'Upcoming races',    value: races,     sub: 'on the calendar' },
  ];

  return (
    <div style={{ padding: '2rem 1.5rem 4rem' }}>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
          color: c.text,
          margin: '0 0 0.4rem',
          letterSpacing: '0.02em',
          lineHeight: 1,
        }}
      >
        DASHBOARD
      </h1>
      <p style={{ color: c.textSecondary, fontSize: '0.9rem', margin: '0 0 2rem' }}>
        Team at a glance
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              padding: '1.25rem',
              borderRadius: '0.85rem',
              border: `1px solid ${s.accent ? s.accent + '55' : c.border}`,
              backgroundColor: s.accent ? s.accent + '0c' : c.surface,
            }}
          >
            <div
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
                fontFamily: 'var(--font-display)',
                color: s.accent ?? c.primary,
                letterSpacing: '0.02em',
                lineHeight: 1,
              }}
            >
              {s.value}
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: c.text, marginTop: '0.4rem' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '0.75rem', color: c.textSecondary, marginTop: '0.15rem' }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
