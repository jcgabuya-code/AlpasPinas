/**
 * Training sign-up store — Supabase backed.
 *
 * One row per (user, event) in `public.training_signups`. Sign-up REQUIRES
 * login, so every row is tied to `auth.uid()`. Row-Level Security means a
 * normal user reads only their OWN rows; admins read everything. Capacity
 * counts come from the PII-free `training_signup_counts()` RPC so the public
 * /training page still shows remaining seats without exposing rows.
 *
 * We keep a localStorage cache (own rows + counts) for instant paint, refreshed
 * on load, after every mutation, and on Supabase realtime changes.
 *
 * If Supabase isn't configured the module runs LOCAL-ONLY (pure localStorage)
 * so dev still works. With VITE_SEED_BOOKINGS=1 it serves a sample roster so
 * the admin Boat Assignments planner has a bench to test with.
 */
import { supabase, isSupabaseConfigured } from './supabase';

const isRemote = isSupabaseConfigured;

const useSeed = (import.meta.env.VITE_SEED_BOOKINGS ?? '').trim() === '1';

const CACHE_KEY = 'alpas-bookings-v2';
const COUNTS_KEY = 'alpas-booking-counts-v1';
const CHANGE_EVENT = 'alpas-bookings-changed';

export type Gender = 'Male' | 'Female';
export type SideRole = 'Left' | 'Right' | 'Coxswain' | 'Coach';
export type YesNo = 'Yes' | 'No';
export type Attending = 'sat' | 'sun' | 'both';

export type BookingStatus = 'waiting' | 'confirmed';

export type Booking = {
  id?: string;          // Supabase row id (absent only for legacy local-mode rows)
  eventId: string;
  eventTitle?: string;
  attending: Attending;
  name: string;
  gender: Gender;
  birthday?: string;    // 'YYYY-MM-DD' — mandatory on new sign-ups; older rows may lack it
  side: SideRole;
  weight: number;       // kg
  needPFD: YesNo;
  needPaddle: YesNo;
  createdAt: string;    // ISO timestamp
  status: BookingStatus;
};

/** Per-event seat tallies from the counts RPC: eventId → { sat, sun }. */
export type EventCounts = Map<string, { sat: number; sun: number }>;

/* --------------------------- DB row <-> Booking --------------------------- */

type DbRow = {
  id: string;
  user_id: string;
  event_id: string;
  event_title: string | null;
  attending: Attending;
  name: string;
  gender: Gender;
  birthday: string | null;
  side: SideRole;
  weight: number | string;
  need_pfd: boolean;
  need_paddle: boolean;
  status: BookingStatus;
  created_at: string;
};

const toBooking = (r: DbRow): Booking => ({
  id: r.id,
  eventId: r.event_id,
  eventTitle: r.event_title ?? undefined,
  attending: r.attending,
  name: r.name,
  gender: r.gender,
  birthday: r.birthday ?? undefined,
  side: r.side,
  weight: Number(r.weight),
  needPFD: r.need_pfd ? 'Yes' : 'No',
  needPaddle: r.need_paddle ? 'Yes' : 'No',
  createdAt: r.created_at,
  status: r.status,
});

/** Insert payload — `user_id` is omitted (DB column defaults to auth.uid()). */
const toInsert = (b: Omit<Booking, 'createdAt' | 'status' | 'id'>) => ({
  event_id: b.eventId,
  event_title: b.eventTitle ?? null,
  attending: b.attending,
  name: b.name,
  gender: b.gender,
  birthday: b.birthday ?? null,
  side: b.side,
  weight: b.weight,
  need_pfd: b.needPFD === 'Yes',
  need_paddle: b.needPaddle === 'Yes',
});

/** Whole years between a 'YYYY-MM-DD' birthday and today. undefined if unknown/unparseable. */
export const ageFromBirthday = (birthday?: string): number | undefined => {
  if (!birthday) return undefined;
  const dob = new Date(birthday);
  if (Number.isNaN(dob.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
};

/** Masters category threshold (years). */
export const MASTERS_AGE = 40;

/* --------------------------- cache helpers --------------------------- */

/** Synchronous read of the cached bookings. Safe in non-browser contexts. */
export const getAllBookings = (): Booking[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Booking[]) : [];
  } catch {
    return [];
  }
};

const writeCache = (bookings: Booking[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(bookings));
  // Notify same-tab subscribers (the native 'storage' event only fires in
  // *other* tabs).
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

/** Synchronous read of the cached capacity counts. */
export const getEventCounts = (): EventCounts => {
  if (typeof window === 'undefined') return new Map();
  try {
    const raw = window.localStorage.getItem(COUNTS_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as Record<string, { sat: number; sun: number }>;
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
};

const writeCountsCache = (counts: EventCounts) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(COUNTS_KEY, JSON.stringify(Object.fromEntries(counts)));
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

/** Build a counts map from a Booking[] (used for seed/local mode). */
const countsFromList = (bookings: Booking[]): EventCounts => {
  const m: EventCounts = new Map();
  for (const b of bookings) {
    const c = m.get(b.eventId) ?? { sat: 0, sun: 0 };
    if (b.attending === 'sat' || b.attending === 'both') c.sat++;
    if (b.attending === 'sun' || b.attending === 'both') c.sun++;
    m.set(b.eventId, c);
  }
  return m;
};

/* ----------------------------- network ------------------------------ */

/**
 * Pull the sign-ups VISIBLE to the caller and refresh the cache. RLS scopes
 * this: a normal user gets only their OWN rows; admins get everything. In
 * local-only mode it returns the cache. Falls back to the cache on error.
 */
export const fetchBookings = async (): Promise<Booking[]> => {
  if (useSeed) {
    const { getSeedBookings } = await import('./seedBookings');
    const seeded = getSeedBookings();
    writeCache(seeded);
    return seeded;
  }
  if (!isRemote) return getAllBookings();
  const { data, error } = await supabase
    .from('training_signups')
    .select('*')
    .order('created_at', { ascending: true });
  if (error || !data) return getAllBookings(); // backend down — show the cache
  const bookings = (data as DbRow[]).map(toBooking);
  writeCache(bookings);
  return bookings;
};

/**
 * Pull PII-free capacity counts (all events) via the counts RPC and refresh
 * the cache. Anyone can call this — it powers the public capacity display.
 */
export const fetchEventCounts = async (): Promise<EventCounts> => {
  if (useSeed) {
    const { getSeedBookings } = await import('./seedBookings');
    const counts = countsFromList(getSeedBookings());
    writeCountsCache(counts);
    return counts;
  }
  if (!isRemote) return countsFromList(getAllBookings());
  const { data, error } = await supabase.rpc('training_signup_counts');
  if (error || !data) return getEventCounts();
  const counts: EventCounts = new Map();
  for (const row of data as { event_id: string; sat: number; sun: number }[]) {
    counts.set(row.event_id, { sat: row.sat, sun: row.sun });
  }
  writeCountsCache(counts);
  return counts;
};

/* ----------------------------- queries ------------------------------ */

/** Does this booking cover the given day key? "both" covers sat and sun. */
export const coversDay = (b: Booking, dayKey: string) =>
  b.attending === 'both' || b.attending === dayKey;

/** Seats taken for one event + one day (sat/sun) from the counts map. */
export const takenForDay = (
  counts: EventCounts,
  eventId: string,
  dayKey: string,
): number => {
  const c = counts.get(eventId);
  if (!c) return 0;
  return dayKey === 'sun' ? c.sun : c.sat;
};

/**
 * Has this user already signed up for this event? Soft pre-check on the
 * caller's OWN cached bookings; the DB `unique(user_id, event_id)` is the
 * real guard.
 */
export const hasNameBooked = (
  bookings: Booking[],
  eventId: string,
  name: string,
) => {
  const lc = name.trim().toLowerCase();
  return bookings.some(
    (b) => b.eventId === eventId && b.name.toLowerCase() === lc,
  );
};

/* ---------------------------- mutations ----------------------------- */

/**
 * Add a sign-up for the logged-in user (their `user_id` is filled by the DB
 * default). Refreshes own rows + counts. Throws a friendly message on the
 * unique-constraint violation (already signed up).
 */
export const addBooking = async (
  b: Omit<Booking, 'createdAt' | 'status' | 'id'>,
): Promise<Booking> => {
  if (!isRemote) {
    const booking: Booking = {
      ...b,
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      status: 'waiting',
      createdAt: new Date().toISOString(),
    };
    writeCache([...getAllBookings(), booking]);
    return booking;
  }

  const { data, error } = await supabase
    .from('training_signups')
    .insert(toInsert(b))
    .select()
    .single();
  if (error || !data) {
    if (error && /duplicate|unique/i.test(error.message)) {
      throw new Error('You have already signed up for this event.');
    }
    throw new Error(error?.message || 'Could not save your sign-up. Please try again.');
  }
  await Promise.all([fetchBookings(), fetchEventCounts()]);
  return toBooking(data as DbRow);
};

/** Approve (confirm) a waiting sign-up by id. Admin only (enforced by RLS). */
export const approveBooking = async (id: string): Promise<void> => {
  if (!isRemote) {
    writeCache(
      getAllBookings().map((b) =>
        b.id === id ? { ...b, status: 'confirmed' as BookingStatus } : b,
      ),
    );
    return;
  }
  const { error } = await supabase
    .from('training_signups')
    .update({ status: 'confirmed' })
    .eq('id', id);
  if (error) throw new Error(error.message || 'Could not approve booking.');
  await Promise.all([fetchBookings(), fetchEventCounts()]);
};

/** Cancel a sign-up by id (deletes the row). Owner or admin (enforced by RLS). */
export const cancelBooking = async (id: string): Promise<void> => {
  if (!isRemote) {
    writeCache(getAllBookings().filter((b) => b.id !== id));
    return;
  }
  const { error } = await supabase.from('training_signups').delete().eq('id', id);
  if (error) throw new Error(error.message || 'Could not cancel. Please try again.');
  await Promise.all([fetchBookings(), fetchEventCounts()]);
};

/* --------------------------- subscriptions -------------------------- */

let channelSeq = 0;

/**
 * Subscribe to sign-up changes. Wires up local cache events (same/cross tab)
 * AND a Supabase realtime channel: any change to `training_signups` (that the
 * caller is permitted to see) refreshes the cache + counts, which dispatches
 * CHANGE_EVENT → handler. Returns an unsubscribe fn.
 */
export const subscribeBookings = (handler: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === CACHE_KEY || e.key === COUNTS_KEY) handler();
  };
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', onStorage);

  let channel: ReturnType<typeof supabase.channel> | null = null;
  if (isRemote && !useSeed) {
    channel = supabase
      .channel(`training_signups_${channelSeq++}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'training_signups' },
        () => {
          // Refreshing the caches dispatches CHANGE_EVENT, which runs handler.
          void Promise.all([fetchBookings(), fetchEventCounts()]);
        },
      )
      .subscribe();
  }

  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', onStorage);
    if (channel) void supabase.removeChannel(channel);
  };
};

/* ----------------------------- helpers ------------------------------ */

/** Format YYYY-MM-DD as e.g. "Sat, May 30". */
export const formatShortDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

/** Format YYYY-MM-DD as e.g. "May 30, 2026". */
export const formatLongDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

/** True if YYYY-MM-DD is today or in the future. */
export const isUpcomingDate = (iso: string) => {
  const todayIso = new Date().toISOString().slice(0, 10);
  return iso >= todayIso;
};

/** Pretty-print attending value. */
export const attendingLabel = (a: Attending) =>
  a === 'both' ? 'Both days' : a === 'sat' ? 'Saturday only' : 'Sunday only';
