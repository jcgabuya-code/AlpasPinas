/**
 * Dev-only sample athletes for testing the admin Boat Assignments planner.
 *
 * Activated by VITE_SEED_BOOKINGS=1 in .env.local — when set,
 * `fetchBoatPlannerBench()` (utils/bookings.ts) returns this roster instead
 * of real Supabase data, so the bench fills up locally WITHOUT touching
 * production training data. Scoped to the boat planner only — the public
 * /training page and everything else always reads real Supabase data
 * regardless of this flag. Remove the env line (or this file) to turn it off.
 *
 * The roster is intentionally lopsided side-wise and varied in weight so the
 * side-matching warnings and the trim/balance panel are easy to exercise.
 */
import type { Booking, Gender, SideRole } from './bookings';

type Person = { name: string; gender: Gender; side: SideRole; weight: number; birthday: string };

// Mixed roster — varied ages so the Masters (40+) crew preset has eligible and
// ineligible athletes of both genders to exercise. Sides are intentionally
// lopsided and weights are spread so side-matching warnings and the trim/balance
// panel are easy to exercise. Includes Coxswain + Coach so auto-seat can fill
// the steers + drummer seats.
const ROSTER: Person[] = [
  // Left paddlers
  { name: 'JC Gabuya',       gender: 'Male',   side: 'Left',     weight: 72, birthday: '1984-03-12' }, // 42 — masters
  { name: 'Aaron Cruz',      gender: 'Male',   side: 'Left',     weight: 78, birthday: '1990-07-20' }, // 35
  { name: 'Carlo Mendoza',   gender: 'Male',   side: 'Left',     weight: 84, birthday: '1980-11-05' }, // 45 — masters
  { name: 'Elias Tan',       gender: 'Male',   side: 'Left',     weight: 72, birthday: '1983-01-15' }, // 43 — masters
  { name: 'Gabriel Ong',     gender: 'Male',   side: 'Left',     weight: 90, birthday: '1978-04-18' }, // 48 — masters
  { name: 'Ian Navarro',     gender: 'Male',   side: 'Left',     weight: 75, birthday: '1988-08-08' }, // 37
  { name: 'Kevin Lao',       gender: 'Male',   side: 'Left',     weight: 80, birthday: '1992-10-02' }, // 33
  { name: 'Marco Dizon',     gender: 'Male',   side: 'Left',     weight: 68, birthday: '1996-12-19' }, // 29
  { name: 'Olivia Chua',     gender: 'Female', side: 'Left',     weight: 60, birthday: '1994-04-07' }, // 32
  { name: 'Patricia Uy',     gender: 'Female', side: 'Left',     weight: 57, birthday: '1999-08-23' }, // 26
  // Right paddlers
  { name: 'Bianca Reyes',    gender: 'Female', side: 'Right',    weight: 58, birthday: '1998-02-11' }, // 28
  { name: 'Diana Santos',    gender: 'Female', side: 'Right',    weight: 61, birthday: '1995-09-30' }, // 30
  { name: 'Faith Lim',       gender: 'Female', side: 'Right',    weight: 55, birthday: '2000-06-25' }, // 25
  { name: 'Hana Yusof',      gender: 'Female', side: 'Right',    weight: 64, birthday: '1985-05-10' }, // 41 — masters
  { name: 'Nadia Rahman',    gender: 'Female', side: 'Right',    weight: 62, birthday: '1982-03-28' }, // 44 — masters
  { name: 'Quincy Lee',      gender: 'Male',   side: 'Right',    weight: 86, birthday: '1979-07-14' }, // 46 — masters
  { name: 'Rafael Cruz',     gender: 'Male',   side: 'Right',    weight: 74, birthday: '1991-11-09' }, // 34
  { name: 'Sofia Mendez',    gender: 'Female', side: 'Right',    weight: 59, birthday: '1997-01-17' }, // 29
  // Coxswain (steers) + Coach (drummer)
  { name: 'Tomas Aquino',    gender: 'Male',   side: 'Coxswain', weight: 70, birthday: '1975-06-03' }, // 50 — masters
  { name: 'Uma Castillo',    gender: 'Female', side: 'Coach',    weight: 54, birthday: '1986-09-21' }, // 39
];

// Spread attendance so the day filter (sat / sun / both) has something to show.
const attendingFor = (i: number): string =>
  i % 5 === 0 ? 'sat' : i % 5 === 1 ? 'sun' : 'both';

// Seed the same roster onto both training events so whichever one is selected
// in the planner has a populated bench (the planner defaults to the first event).
const EVENTS: { id: string; title: string }[] = [
  { id: 'may-2026-weekend', title: 'May 30-31 Training Weekend' },
  { id: 'jun-2026-weekend', title: 'June 27-28 Training Weekend' },
];

export const getSeedBookings = (): Booking[] => {
  const base = Date.parse('2026-06-01T00:00:00Z');
  return EVENTS.flatMap((ev) =>
    ROSTER.map((p, i) => ({
      id: `seed-${ev.id}-${i}`,
      eventId: ev.id,
      eventTitle: ev.title,
      attending: attendingFor(i),
      name: p.name,
      gender: p.gender,
      birthday: p.birthday,
      side: p.side,
      weight: p.weight,
      needPFD: 'No' as const,
      needPaddle: i % 3 === 0 ? ('Yes' as const) : ('No' as const),
      createdAt: new Date(base + i * 60000).toISOString(),
      status: 'confirmed' as const,
    })),
  );
};
