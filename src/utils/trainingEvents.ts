/**
 * Training-events (schedule) store — Supabase backed.
 *
 * This is the SCHEDULE (title, venue, days/times/locations/capacity) — distinct
 * from training_signups (who's coming, in `bookings.ts`). Previously the
 * schedule lived only in each browser's localStorage, seeded from the static
 * `src/data/training.json` — so admin edits never left the browser that made
 * them; a fresh browser/device always saw the stale seed data. This module
 * replaces that with `public.training_events` (see
 * supabase/migrations/20260703100000_training_events.sql), the same real
 * backend training_signups already has.
 *
 * If Supabase isn't configured the module runs LOCAL-ONLY: seeded from
 * training.json into localStorage, so dev/UI still works without a project.
 */
import { supabase, isSupabaseConfigured } from './supabase';
import defaultEvents from '../data/training.json';
import { type TrainingEvent } from '../components/TrainingCard';

const isRemote = isSupabaseConfigured;

const STORAGE_KEY = 'alpas-training-events-v1';
const CHANGE_EVENT = 'alpas-training-events-changed';

let channelSeq = 0;

/* --------------------------- DB row <-> type --------------------------- */

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  thumbnail_credit: string | null;
  venue: 'land' | 'lake';
  days: TrainingEvent['days'];
  created_at: string;
};

const toEvent = (r: EventRow): TrainingEvent => ({
  id: r.id,
  title: r.title,
  description: r.description ?? '',
  thumbnail: r.thumbnail ?? undefined,
  thumbnailCredit: r.thumbnail_credit ?? undefined,
  venue: r.venue,
  days: Array.isArray(r.days) ? r.days : [],
});

const fromEvent = (ev: TrainingEvent) => ({
  id: ev.id,
  title: ev.title,
  description: ev.description || null,
  thumbnail: ev.thumbnail || null,
  thumbnail_credit: ev.thumbnailCredit || null,
  venue: ev.venue ?? 'lake',
  days: ev.days,
});

/* ------------------------------ local-only ------------------------------ */

const seedLocal = () => {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultEvents));
  }
};

const readLocal = (): TrainingEvent[] => {
  if (typeof window === 'undefined') return defaultEvents as TrainingEvent[];
  try {
    seedLocal();
    return JSON.parse(localStorage.getItem(STORAGE_KEY)!) as TrainingEvent[];
  } catch {
    return defaultEvents as TrainingEvent[];
  }
};

const writeLocal = (events: TrainingEvent[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

/* -------------------------------- reads --------------------------------- */

/** The full schedule, oldest-created first (matches the old JSON array order). */
export const fetchTrainingEvents = async (): Promise<TrainingEvent[]> => {
  if (!isRemote) return readLocal();
  const { data, error } = await supabase
    .from('training_events')
    .select('*')
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return (data as EventRow[]).map(toEvent);
};

/* -------------------------------- writes --------------------------------- */

/** Admin only (enforced by RLS). */
export const createTrainingEvent = async (ev: TrainingEvent): Promise<void> => {
  if (!isRemote) {
    writeLocal([...readLocal(), ev]);
    return;
  }
  const { error } = await supabase.from('training_events').insert(fromEvent(ev));
  if (error) throw new Error(error.message || 'Could not create the session.');
};

/** Admin only (enforced by RLS). */
export const updateTrainingEvent = async (id: string, updates: Partial<TrainingEvent>): Promise<void> => {
  if (!isRemote) {
    writeLocal(readLocal().map((ev) => (ev.id === id ? { ...ev, ...updates } : ev)));
    return;
  }
  const patch: Record<string, unknown> = {};
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.description !== undefined) patch.description = updates.description || null;
  if (updates.thumbnail !== undefined) patch.thumbnail = updates.thumbnail || null;
  if (updates.thumbnailCredit !== undefined) patch.thumbnail_credit = updates.thumbnailCredit || null;
  if (updates.venue !== undefined) patch.venue = updates.venue;
  if (updates.days !== undefined) patch.days = updates.days;
  const { error } = await supabase.from('training_events').update(patch).eq('id', id);
  if (error) throw new Error(error.message || 'Could not update the session.');
};

/** Admin only (enforced by RLS). */
export const deleteTrainingEvent = async (id: string): Promise<void> => {
  if (!isRemote) {
    writeLocal(readLocal().filter((ev) => ev.id !== id));
    return;
  }
  const { error } = await supabase.from('training_events').delete().eq('id', id);
  if (error) throw new Error(error.message || 'Could not delete the session.');
};

/**
 * Fires `handler` whenever the schedule changes: a same-tab local-only write,
 * a cross-tab localStorage change, or (remote mode) a Supabase realtime event
 * on `training_events`. Callers re-fetch inside `handler`. Returns an
 * unsubscribe fn.
 */
export const subscribeTrainingEvents = (handler: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) handler();
  };
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', onStorage);

  let channel: ReturnType<typeof supabase.channel> | null = null;
  if (isRemote) {
    channel = supabase
      .channel(`training_events_${channelSeq++}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'training_events' }, handler)
      .subscribe();
  }

  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', onStorage);
    if (channel) void supabase.removeChannel(channel);
  };
};
