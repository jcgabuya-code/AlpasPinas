/**
 * Dev-only sample athletes for testing the admin Boat Assignments planner.
 *
 * Activated by VITE_SEED_BOOKINGS=1 in .env.local — when set, fetchBookings()
 * returns this roster instead of calling the Google Sheet, so the bench fills
 * up locally WITHOUT touching production training data. Remove the env line
 * (or this file) to turn it off.
 *
 * The roster is intentionally lopsided side-wise and varied in weight so the
 * side-matching warnings and the trim/balance panel are easy to exercise.
 */
import type { Booking, Gender, SideRole, Attending } from './bookings';

type Person = { name: string; gender: Gender; side: SideRole; weight: number };

// 24 paddlers (11 Left, 11 Right) + 2 steers-eligible coxswains + 1 coach.
const ROSTER: Person[] = [
  { name: 'JC Gabuya',     gender: 'Male', side: 'Left',     weight: 72 },
  { name: 'Aaron Cruz',      gender: 'Male',   side: 'Left',     weight: 78 },
  { name: 'Bianca Reyes',    gender: 'Female', side: 'Right',    weight: 58 },
  { name: 'Carlo Mendoza',   gender: 'Male',   side: 'Left',     weight: 84 },
  { name: 'Diana Santos',    gender: 'Female', side: 'Right',    weight: 61 },
  { name: 'Elias Tan',       gender: 'Male',   side: 'Left',     weight: 72 },
  { name: 'Faith Lim',       gender: 'Female', side: 'Right',    weight: 55 },
  { name: 'Gabriel Ong',     gender: 'Male',   side: 'Left',     weight: 90 },
  { name: 'Hana Yusof',      gender: 'Female', side: 'Right',    weight: 64 },
  { name: 'Ian Navarro',     gender: 'Male',   side: 'Left',     weight: 75 },

];

// Spread attendance so the day filter (sat / sun / both) has something to show.
const attendingFor = (i: number): Attending =>
  i % 5 === 0 ? 'sat' : i % 5 === 1 ? 'sun' : 'both';

// Seed the same roster onto both training events so whichever one is selected
// in the planner has a populated bench.
const EVENTS: { id: string; title: string }[] = [
  { id: 'jun-2026-weekend', title: 'June 27-28 Training Weekend' },
];

export const getSeedBookings = (): Booking[] => {
  const base = Date.parse('2026-06-01T00:00:00Z');
  return EVENTS.flatMap((ev) =>
    ROSTER.map((p, i) => ({
      eventId: ev.id,
      eventTitle: ev.title,
      attending: attendingFor(i),
      name: p.name,
      gender: p.gender,
      side: p.side,
      weight: p.weight,
      needPFD: 'No' as const,
      needPaddle: i % 3 === 0 ? ('Yes' as const) : ('No' as const),
      createdAt: new Date(base + i * 60000).toISOString(),
      status: 'confirmed' as const,
    })),
  );
};
