/**
 * Boat plan store — Supabase backed (admin-only).
 *
 * One plan per training event + day. Supabase (`boat_plans` table, admin-only
 * RLS) is the source of truth so every admin sees the same layout; we keep a
 * localStorage cache so the planner renders instantly and survives a flaky
 * connection. The cache is refreshed on load and after every save.
 *
 * If Supabase isn't configured (VITE_SUPABASE_* unset) the module runs in
 * LOCAL-ONLY mode — pure localStorage, same as the original planner — so dev
 * works without a backend.
 */
import { supabase, isSupabaseConfigured } from './supabase';

const isRemote = isSupabaseConfigured;

const CACHE_KEY = 'alpas-boat-plans-v1';

/* ------------------------------------------------------------------ */

export type SeatId = 'DRUMMER' | 'STEERS' | string; // `${row}L` | `${row}R`

export type Boat = {
  id: string;
  name: string;
  seats: Record<SeatId, string>; // seatId → athlete name
};

type StoredPlan = { eventId: string; dayKey: string; boats: Boat[] };

export const emptyBoat = (suffix: string): Boat => ({
  id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
  name: `Boat ${suffix}`,
  seats: {},
});

const defaultBoats = (): Boat[] => [emptyBoat('A')];

/* --------------------------- cache helpers --------------------------- */

const readCache = (): StoredPlan[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredPlan[]) : [];
  } catch {
    return [];
  }
};

const writeCache = (eventId: string, dayKey: string, boats: Boat[]) => {
  if (typeof window === 'undefined') return;
  const plans = readCache();
  const idx = plans.findIndex((p) => p.eventId === eventId && p.dayKey === dayKey);
  if (idx >= 0) plans[idx].boats = boats;
  else plans.push({ eventId, dayKey, boats });
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(plans));
};

/** Synchronous read of the cached plan — for instant first paint. */
export const loadPlanCached = (eventId: string, dayKey: string): Boat[] => {
  const found = readCache().find((p) => p.eventId === eventId && p.dayKey === dayKey);
  return found && found.boats.length ? found.boats : defaultBoats();
};

/* ----------------------------- network ------------------------------ */

/**
 * Load the authoritative plan for an event+day and refresh the cache.
 * Falls back to the cache (then a fresh default) on error or in local mode.
 */
export const loadPlan = async (eventId: string, dayKey: string): Promise<Boat[]> => {
  if (!isRemote) return loadPlanCached(eventId, dayKey);
  try {
    const { data, error } = await supabase
      .from('boat_plans')
      .select('boats')
      .eq('event_id', eventId)
      .eq('day_key', dayKey)
      .maybeSingle();
    if (error) throw error;
    const boats = (data?.boats as Boat[] | undefined) ?? [];
    if (boats.length) {
      writeCache(eventId, dayKey, boats);
      return boats;
    }
    // No row yet — start fresh (don't cache the default; it isn't real data).
    return defaultBoats();
  } catch {
    // Backend down — show whatever we last cached.
    return loadPlanCached(eventId, dayKey);
  }
};

/**
 * Persist a plan. Always writes the local cache (instant + offline); upserts to
 * Supabase in remote mode. Throws on a remote failure so the caller can surface
 * a "saved locally only" warning.
 */
export const savePlan = async (
  eventId: string,
  dayKey: string,
  boats: Boat[],
): Promise<void> => {
  writeCache(eventId, dayKey, boats);
  if (!isRemote) return;
  const { error } = await supabase
    .from('boat_plans')
    .upsert(
      { event_id: eventId, day_key: dayKey, boats },
      { onConflict: 'event_id,day_key' },
    );
  if (error) throw new Error(error.message);
};
