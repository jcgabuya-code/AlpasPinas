/**
 * Training booking store — Google Sheet backed (Phase 3).
 *
 * The team's Google Sheet (via an Apps Script web app) is the source of
 * truth. We keep a localStorage *cache* so the UI can render instantly and
 * keep working offline; the cache is refreshed from the sheet on load and
 * after every mutation.
 *
 * Endpoint: set VITE_BOOKINGS_ENDPOINT (the Apps Script /exec URL) in a
 * .env file. If it's empty, the module runs in LOCAL-ONLY mode (pure
 * localStorage, same as before the sheet was wired) so dev still works.
 */

const ENDPOINT = (import.meta.env.VITE_BOOKINGS_ENDPOINT ?? '').trim();
const isRemote = ENDPOINT.length > 0;

const CACHE_KEY = 'alpas-bookings-v2';
const CHANGE_EVENT = 'alpas-bookings-changed';

export type Gender = 'Male' | 'Female';
export type SideRole = 'Left' | 'Right' | 'Coxswain' | 'Coach';
export type YesNo = 'Yes' | 'No';
export type Attending = 'sat' | 'sun' | 'both';

export type BookingStatus = 'waiting' | 'confirmed';

export type Booking = {
  eventId: string;
  eventTitle?: string;
  attending: Attending;
  name: string;
  gender: Gender;
  side: SideRole;
  weight: number;       // kg
  needPFD: YesNo;
  needPaddle: YesNo;
  createdAt: string;    // ISO timestamp
  status: BookingStatus;
};

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

/* ----------------------------- network ------------------------------ */

/**
 * Pull the authoritative list from the sheet and refresh the cache.
 * In local-only mode this just returns the current cache.
 * Returns the freshest list it could get (falls back to cache on error).
 */
export const fetchBookings = async (): Promise<Booking[]> => {
  if (!isRemote) return getAllBookings();
  try {
    const res = await fetch(ENDPOINT, { method: 'GET' });
    const data = await res.json();
    if (data && data.ok && Array.isArray(data.bookings)) {
      const bookings = (data.bookings as Booking[]).map((b) => ({
        ...b,
        status: (b.status === 'confirmed' ? 'confirmed' : 'waiting') as BookingStatus,
      }));
      writeCache(bookings);
      return bookings;
    }
  } catch {
    // network down — keep showing the cache
  }
  return getAllBookings();
};

// Apps Script web apps accept a "simple" POST (text/plain) without a CORS
// preflight, which a JSON content-type would otherwise trigger.
const postToSheet = async (payload: unknown): Promise<unknown> => {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  try {
    return await res.json();
  } catch {
    throw new Error(
      `Apps Script returned non-JSON (HTTP ${res.status}). ` +
      `Make sure the deployment is set to "Execute as: Me" and "Who has access: Anyone".`,
    );
  }
};

/* ----------------------------- queries ------------------------------ */

/** Does this booking cover the given day key? "both" covers sat and sun. */
export const coversDay = (b: Booking, dayKey: string) =>
  b.attending === 'both' || b.attending === dayKey;

/** Count bookings for one event + one day (sat/sun). */
export const countForEventDay = (
  bookings: Booking[],
  eventId: string,
  dayKey: string,
) =>
  bookings.filter((b) => b.eventId === eventId && coversDay(b, dayKey)).length;

/** Has this name already booked this event (any day)? Used for soft dedup. */
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
 * Add a booking. Writes to the sheet (remote mode) or just the cache
 * (local mode), then refreshes the cache so capacity counts are current.
 * Returns the created booking.
 */
export const addBooking = async (
  b: Omit<Booking, 'createdAt'>,
): Promise<Booking> => {
  if (!isRemote) {
    const booking: Booking = { ...b, status: 'waiting', createdAt: new Date().toISOString() };
    writeCache([...getAllBookings(), booking]);
    return booking;
  }

  const result = (await postToSheet({ action: 'add', booking: b })) as {
    ok?: boolean;
    booking?: Booking;
    error?: string;
  };
  if (!result || !result.ok) {
    throw new Error(result?.error || 'Could not save your sign-up. Please try again.');
  }
  const saved = result.booking ?? { ...b, createdAt: new Date().toISOString() };
  // Refresh from the sheet so everyone's latest counts are reflected.
  await fetchBookings();
  return saved;
};

/** Approve (confirm) every waiting booking matching this event + name. */
export const approveBooking = async (
  eventId: string,
  name: string,
): Promise<void> => {
  if (!isRemote) {
    const lc = name.trim().toLowerCase();
    writeCache(
      getAllBookings().map((b) =>
        b.eventId === eventId && b.name.toLowerCase() === lc
          ? { ...b, status: 'confirmed' as BookingStatus }
          : b,
      ),
    );
    return;
  }

  const result = (await postToSheet({ action: 'approve', eventId, name })) as {
    ok?: boolean;
    approved?: number;
    error?: string;
  };
  if (!result || !result.ok) {
    const raw = result?.error ?? '';
    const msg = raw === 'Unknown action'
      ? 'Approve action not found — redeploy the Apps Script as a new version (Manage deployments → Edit → New version).'
      : raw || 'Could not approve booking.';
    throw new Error(msg);
  }
  if (result.approved === 0) {
    throw new Error(
      `No waiting signup matched for "${name}" on event "${eventId}". ` +
      `The row may already be confirmed, cancelled, or the sheet is out of sync — try Refresh.`,
    );
  }
  await fetchBookings();
};

/** Cancel every booking matching this event + name. */
export const cancelBooking = async (
  eventId: string,
  name: string,
): Promise<void> => {
  if (!isRemote) {
    const lc = name.trim().toLowerCase();
    writeCache(
      getAllBookings().filter(
        (b) => !(b.eventId === eventId && b.name.toLowerCase() === lc),
      ),
    );
    return;
  }

  const result = (await postToSheet({ action: 'cancel', eventId, name })) as {
    ok?: boolean;
    error?: string;
  };
  if (!result || !result.ok) {
    throw new Error(result?.error || 'Could not cancel. Please try again.');
  }
  await fetchBookings();
};

/* --------------------------- subscriptions -------------------------- */

/** Subscribe to booking changes (same tab + cross tab). Returns unsubscribe. */
export const subscribeBookings = (handler: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === CACHE_KEY) handler();
  };
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', onStorage);
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
