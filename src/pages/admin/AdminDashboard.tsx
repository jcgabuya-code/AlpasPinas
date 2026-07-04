import React, { useEffect, useState } from 'react';
import { type ColorPalette } from '../../styles/colors';
import { type ShowToast } from '../Admin';
import type { AdminSection } from '../Admin';
import { useIsMobile } from '../../hooks/useIsMobile';
import {
  fetchBookings,
  fetchEventCounts,
  getAllBookings,
  getEventCounts,
  takenForDay,
  isUpcomingDate,
  formatShortDate,
  formatLongDate,
  type Booking,
  type EventCounts,
} from '../../utils/bookings';
import { fetchTrainingEvents } from '../../utils/trainingEvents';
import { type TrainingEvent } from '../../components/TrainingCard';
import { getRaceEvents, type RaceEvent } from '../../utils/adminRaceEvents';
import { getAllRoster } from '../../utils/roster';
import { getApplications, type Application } from '../../utils/users';
import {
  Clock,
  CheckCircle2,
  Users,
  CalendarDays,
  Trophy,
  ArrowRight,
  ClipboardList,
  Anchor,
  PlusCircle,
} from 'lucide-react';

type Props = { showToast: ShowToast; c: ColorPalette; theme: 'dark' | 'light'; onNavigate: (s: AdminSection) => void };

type ActivityItem = { text: string; at: string; color: string };

const timeAgo = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export const AdminDashboard: React.FC<Props> = ({ c, onNavigate }) => {
  const isMobile = useIsMobile();
  const [bookings, setBookings] = useState<Booking[]>(() => getAllBookings());
  const [counts, setCounts] = useState<EventCounts>(() => getEventCounts());
  const [trainingEvents, setTrainingEvents] = useState<TrainingEvent[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchBookings().then(setBookings),
      fetchEventCounts().then(setCounts),
      fetchTrainingEvents().then(setTrainingEvents),
      getApplications().then(setApplications).catch(() => setApplications([])),
    ]).finally(() => setLoading(false));
  }, []);

  const raceEvents = getRaceEvents();
  const pending = applications.filter((a) => a.status === 'pending').length;
  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
  const members = getAllRoster().length;
  const upcomingRaces = raceEvents
    .filter((e) => isUpcomingDate(e.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextRace: RaceEvent | undefined = upcomingRaces[0];

  const stats: { label: string; value: number | string; sub: string; icon: React.ElementType; bg: string; fg: string }[] = [
    { label: 'Pending approvals', value: loading ? '…' : pending, sub: 'awaiting confirmation', icon: Clock, bg: '#f2b54422', fg: '#b3781a' },
    { label: 'Confirmed sign-ups', value: loading ? '…' : confirmed, sub: 'across all events', icon: CheckCircle2, bg: '#16a34a1f', fg: '#15803d' },
    { label: 'Active members', value: members, sub: 'on the roster', icon: Users, bg: `${c.primary}1f`, fg: c.primary },
    { label: 'Training sessions', value: trainingEvents.length, sub: 'in the schedule', icon: CalendarDays, bg: '#7c3aed1f', fg: '#7c3aed' },
    { label: 'Upcoming races', value: upcomingRaces.length, sub: 'on the calendar', icon: Trophy, bg: '#dc26261f', fg: '#dc2626' },
  ];

  // Upcoming trainings: flatten (event, day) pairs, keep future days, soonest first.
  const upcomingTrainings = trainingEvents
    .flatMap((ev) => ev.days.map((day) => ({ ev, day })))
    .filter(({ day }) => isUpcomingDate(day.date))
    .sort((a, b) => a.day.date.localeCompare(b.day.date))
    .slice(0, 3);

  // Recent activity: merge sign-ups + applications by recency, newest first.
  const activity: ActivityItem[] = [
    ...bookings.map((b): ActivityItem => ({
      text: `${b.name} signed up for ${b.eventTitle || 'a training session'}`,
      at: b.createdAt,
      color: '#15803d',
    })),
    ...applications.map((a): ActivityItem => ({
      text: a.status === 'pending'
        ? `${a.name} submitted a new registration`
        : `${a.name}'s registration was ${a.status}`,
      at: a.createdAt,
      color: a.status === 'pending' ? '#b3781a' : a.status === 'approved' ? '#15803d' : '#dc2626',
    })),
  ]
    .sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime())
    .slice(0, 5);

  const quickActions: { label: string; icon: React.ElementType; go: AdminSection }[] = [
    { label: 'Approve registrations', icon: ClipboardList, go: 'applications' },
    { label: 'Log training session', icon: CalendarDays, go: 'events' },
    { label: 'Assign boats', icon: Anchor, go: 'boats' },
    { label: 'Add new event', icon: PlusCircle, go: 'events' },
  ];

  return (
    <div style={{ padding: isMobile ? '1.25rem 1rem 3rem' : '2rem 1.5rem 4rem' }}>
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
      <p style={{ color: c.textSecondary, fontSize: '0.9rem', margin: `0 0 ${isMobile ? '1.25rem' : '2rem'}` }}>
        Team at a glance
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 150 : 200}px, 1fr))`,
          gap: isMobile ? '0.75rem' : '1rem',
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              padding: isMobile ? '1rem' : '1.25rem',
              borderRadius: '0.85rem',
              border: `1px solid ${c.border}`,
              backgroundColor: c.surface,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.7rem',
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '0.6rem',
                backgroundColor: s.bg,
                color: s.fg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <s.icon size={19} strokeWidth={1.8} />
            </div>
            <div
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.2rem)',
                fontFamily: 'var(--font-display)',
                color: c.text,
                letterSpacing: '0.02em',
                lineHeight: 1,
              }}
            >
              {s.value}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: c.text }}>{s.label}</div>
              <div style={{ fontSize: '0.75rem', color: c.textSecondary, marginTop: '0.15rem' }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.6fr) minmax(0, 1fr)',
          gap: isMobile ? '1rem' : '1.25rem',
          marginTop: isMobile ? '1.25rem' : '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.25rem', minWidth: 0 }}>
          {nextRace && (
            <div
              style={{
                backgroundColor: c.text,
                borderRadius: '1.1rem',
                padding: isMobile ? '1.25rem' : '1.75rem',
                color: c.background,
              }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.primary }}>
                Next up
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.35rem' : '1.6rem', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                {nextRace.name}
              </div>
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginTop: '0.7rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', opacity: 0.85 }}>
                  <CalendarDays size={15} strokeWidth={1.8} />
                  {formatLongDate(nextRace.date)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', opacity: 0.85 }}>
                  <Trophy size={15} strokeWidth={1.8} />
                  {nextRace.location}
                </div>
              </div>
              <button
                onClick={() => onNavigate('events')}
                style={{
                  marginTop: '1.25rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: c.background,
                  border: `1px solid rgba(255,255,255,0.18)`,
                  borderRadius: '0.6rem',
                  padding: '0.6rem 1.1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                View event details <ArrowRight size={14} />
              </button>
            </div>
          )}

          <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: '1.1rem', padding: isMobile ? '1.1rem' : '1.5rem' }}>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: c.text, marginBottom: '0.4rem' }}>Recent activity</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {activity.length === 0 && (
                <div style={{ padding: '0.9rem 0', fontSize: '0.85rem', color: c.textSecondary }}>Nothing yet.</div>
              )}
              {activity.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '0.3rem' : '0.75rem',
                    padding: '0.85rem 0',
                    borderBottom: i < activity.length - 1 ? `1px solid ${c.border}` : 'none',
                    alignItems: isMobile ? 'flex-start' : 'flex-start',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flex: 1 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color, flexShrink: 0, marginTop: 5 }} />
                    <div style={{ flex: 1, fontSize: '0.85rem', color: c.text }}>{item.text}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: c.textSecondary, whiteSpace: 'nowrap', paddingLeft: isMobile ? '1.15rem' : 0 }}>{timeAgo(item.at)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.25rem', minWidth: 0 }}>
          <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: '1.1rem', padding: isMobile ? '1.1rem' : '1.5rem' }}>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: c.text, marginBottom: '0.85rem' }}>Quick actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {quickActions.map((a) => (
                <div
                  key={a.label}
                  onClick={() => onNavigate(a.go)}
                  style={{
                    backgroundColor: c.hover,
                    borderRadius: '0.7rem',
                    padding: isMobile ? '0.85rem 0.7rem' : '1rem 0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <a.icon size={18} strokeWidth={1.8} color={c.primary} />
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: c.text }}>{a.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: '1.1rem', padding: isMobile ? '1.1rem' : '1.5rem' }}>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: c.text, marginBottom: '0.85rem' }}>Upcoming trainings</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {upcomingTrainings.length === 0 && (
                <div style={{ fontSize: '0.85rem', color: c.textSecondary }}>No upcoming sessions.</div>
              )}
              {upcomingTrainings.map(({ ev, day }) => {
                const taken = takenForDay(counts, ev.id, day.key);
                const full = taken >= day.capacity;
                return (
                  <div key={`${ev.id}-${day.key}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: c.text }}>{ev.title}</div>
                      <div style={{ fontSize: '0.75rem', color: c.textSecondary, marginTop: '0.1rem' }}>
                        {formatShortDate(day.date)} · {day.time}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.55rem',
                        borderRadius: '999px',
                        backgroundColor: full ? '#dc26261f' : '#15803d1f',
                        color: full ? '#dc2626' : '#15803d',
                      }}
                    >
                      {taken}/{day.capacity}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
