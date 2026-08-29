/**
 * Race/competition calendar — Supabase backed.
 *
 * Previously this lived only in each browser's localStorage (seeded from the
 * static `src/data/events.json`), which every public surface (home page race
 * record, Events page, hero "next race" badge) read straight from the JSON
 * file — so admin edits in AdminEvents.tsx never reached the public site at
 * all. This module replaces that with `public.race_events` (see
 * supabase/migrations/20260829000000_race_events.sql), the same real backend
 * training_events already has.
 *
 * If Supabase isn't configured the module runs LOCAL-ONLY: seeded from
 * events.json into localStorage, so dev/UI still works without a project.
 */
import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import defaultEvents from '../data/events.json';
import { type RaceEvent, type EventResult } from '../components/EventCard';

const isRemote = isSupabaseConfigured;

const STORAGE_KEY = 'alpas-race-events-v1';
const CHANGE_EVENT = 'alpas-race-events-changed';

let channelSeq = 0;

/* --------------------------- DB row <-> type --------------------------- */

type EventRow = {
  id: string;
  name: string;
  location: string;
  date: string;
  type: string;
  description: string | null;
  thumbnail: string | null;
  thumbnail_credit: string | null;
  result: EventResult | null;
};

const toEvent = (r: EventRow): RaceEvent => ({
  id: r.id,
  name: r.name,
  location: r.location,
  date: r.date,
  type: r.type,
  description: r.description ?? '',
  thumbnail: r.thumbnail ?? undefined,
  thumbnailCredit: r.thumbnail_credit ?? undefined,
  result: r.result,
});

const fromEvent = (ev: RaceEvent) => ({
  id: ev.id,
  name: ev.name,
  location: ev.location,
  date: ev.date,
  type: ev.type,
  description: ev.description || null,
  thumbnail: ev.thumbnail || null,
  thumbnail_credit: ev.thumbnailCredit || null,
  result: ev.result,
});

/* ------------------------------ local-only ------------------------------ */

const seedLocal = () => {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultEvents));
  }
};

const readLocal = (): RaceEvent[] => {
  if (typeof window === 'undefined') return defaultEvents as RaceEvent[];
  try {
    seedLocal();
    return JSON.parse(localStorage.getItem(STORAGE_KEY)!) as RaceEvent[];
  } catch {
    return defaultEvents as RaceEvent[];
  }
};

const writeLocal = (events: RaceEvent[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

/* -------------------------------- reads --------------------------------- */

export const fetchRaceEvents = async (): Promise<RaceEvent[]> => {
  if (!isRemote) return readLocal();
  const { data, error } = await supabase.from('race_events').select('*').order('date', { ascending: true });
  if (error || !data) return [];
  return (data as EventRow[]).map(toEvent);
};

/* -------------------------------- writes --------------------------------- */

/** Admin only (enforced by RLS). */
export const createRaceEvent = async (ev: RaceEvent): Promise<void> => {
  if (!isRemote) {
    writeLocal([...readLocal(), ev]);
    return;
  }
  const { error } = await supabase.from('race_events').insert(fromEvent(ev));
  if (error) throw new Error(error.message || 'Could not create the race event.');
};

/** Admin only (enforced by RLS). */
export const updateRaceEvent = async (id: string, updates: Partial<RaceEvent>): Promise<void> => {
  if (!isRemote) {
    writeLocal(readLocal().map((ev) => (ev.id === id ? { ...ev, ...updates } : ev)));
    return;
  }
  const patch: Record<string, unknown> = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.location !== undefined) patch.location = updates.location;
  if (updates.date !== undefined) patch.date = updates.date;
  if (updates.type !== undefined) patch.type = updates.type;
  if (updates.description !== undefined) patch.description = updates.description || null;
  if (updates.thumbnail !== undefined) patch.thumbnail = updates.thumbnail || null;
  if (updates.thumbnailCredit !== undefined) patch.thumbnail_credit = updates.thumbnailCredit || null;
  if (updates.result !== undefined) patch.result = updates.result;
  const { error } = await supabase.from('race_events').update(patch).eq('id', id);
  if (error) throw new Error(error.message || 'Could not update the race event.');
};

/** Admin only (enforced by RLS). */
export const deleteRaceEvent = async (id: string): Promise<void> => {
  if (!isRemote) {
    writeLocal(readLocal().filter((ev) => ev.id !== id));
    return;
  }
  const { error } = await supabase.from('race_events').delete().eq('id', id);
  if (error) throw new Error(error.message || 'Could not delete the race event.');
};

/**
 * Fires `handler` whenever the calendar changes: a same-tab local-only write,
 * a cross-tab localStorage change, or (remote mode) a Supabase realtime event
 * on `race_events`. Callers re-fetch inside `handler`. Returns an unsubscribe fn.
 */
export const subscribeRaceEvents = (handler: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) handler();
  };
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', onStorage);

  let channel: ReturnType<typeof supabase.channel> | null = null;
  if (isRemote) {
    channel = supabase
      .channel(`race_events_${channelSeq++}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'race_events' }, handler)
      .subscribe();
  }

  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', onStorage);
    if (channel) void supabase.removeChannel(channel);
  };
};

/** The live race calendar, kept in sync via `subscribeRaceEvents`. Shared by
 * every public surface (home page sections, Events page, hero "next race"
 * badge) so each one isn't re-deriving the same fetch/subscribe boilerplate.
 * `loaded` distinguishes "still fetching" from "genuinely no races" — callers
 * that hide themselves on an empty list should gate on it to avoid flashing
 * away on every page load before the first fetch resolves. */
export const useRaceEvents = (): { events: RaceEvent[]; loaded: boolean } => {
  const [events, setEvents] = useState<RaceEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const load = () => fetchRaceEvents().then((evs) => {
      setEvents(evs);
      setLoaded(true);
    });
    load();
    return subscribeRaceEvents(load);
  }, []);
  return { events, loaded };
};
