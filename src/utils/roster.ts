/**
 * Roster store — Supabase backed.
 *
 * `public.roster` is the source of truth (RLS: anyone reads active members,
 * only admins read/write everything). We keep a localStorage cache of the
 * public active list so the UI renders instantly and works offline; the cache
 * is refreshed from Supabase on load and after every mutation.
 *
 * If Supabase isn't configured (VITE_SUPABASE_* unset) the module runs in
 * LOCAL-ONLY mode (serves the bundled roster.json) so dev still works without
 * a backend.
 */

import staticRoster from '../data/roster.json';
import { supabase, isSupabaseConfigured } from './supabase';

const isRemote = isSupabaseConfigured;

const CACHE_KEY = 'alpas-roster-v1';
const CHANGE_EVENT = 'alpas-roster-changed';

export type MemberStatus = 'active' | 'inactive';

// Optional per-paddler stat bar (0–100), e.g. { label: 'PWR', value: 82 }.
export type Rating = { label: string; value: number };

export type Member = {
  name: string;
  role: string;
  side: string;
  joined: number;
  photo: string | null;
  status?: MemberStatus;
  // Optional profile stats — surfaced on the Crew Cards when present. Wire these
  // up from Supabase; cards degrade gracefully when they're absent.
  position?: string; // explicit boat position; falls back to `role`
  races?: number; // races completed
  ratings?: Rating[]; // up to ~3 rating bars
};

/* ----------------------------- cache -------------------------------- */

export const getAllRoster = (): Member[] => {
  if (typeof window === 'undefined') return staticRoster as Member[];
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return staticRoster as Member[];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Member[]) : (staticRoster as Member[]);
  } catch {
    return staticRoster as Member[];
  }
};

const writeCache = (members: Member[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(members));
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

/* ----------------------------- network ------------------------------ */

const MEMBER_COLUMNS = 'name, role, side, joined, photo';

/**
 * Pull the public (active-only) roster from Supabase and refresh the cache.
 * In local-only mode this just returns the current cache / static JSON.
 */
export const fetchRoster = async (): Promise<Member[]> => {
  if (!isRemote) return getAllRoster();
  try {
    const { data, error } = await supabase
      .from('roster')
      .select(MEMBER_COLUMNS)
      .eq('status', 'active')
      .order('joined', { ascending: true });
    if (error) throw error;
    const members = (data ?? []) as Member[];
    writeCache(members);
    return members;
  } catch {
    // offline — keep serving the cache
  }
  return getAllRoster();
};

/* ----------------------------- mutations ---------------------------- */

/** Add a new member. Writes to Supabase (remote) or just the cache (local). */
export const addMember = async (m: Omit<Member, 'photo'> & { photo?: string | null }): Promise<Member> => {
  const member: Member = { photo: null, ...m };
  if (!isRemote) {
    writeCache([...getAllRoster(), member]);
    return member;
  }
  const { data, error } = await supabase
    .from('roster')
    .insert({ name: member.name, role: member.role, side: member.side, joined: member.joined, photo: member.photo })
    .select(MEMBER_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  await fetchRoster();
  return data as Member;
};

/**
 * Fetch ALL members (including inactive) for admin use.
 */
export const fetchAllRoster = async (): Promise<Member[]> => {
  if (!isRemote) {
    return getAllRoster().map((m) => ({ ...m, status: 'active' as MemberStatus }));
  }
  try {
    const { data, error } = await supabase
      .from('roster')
      .select(`${MEMBER_COLUMNS}, status`)
      .order('joined', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Member[];
  } catch {
    // offline — fall back
  }
  return getAllRoster().map((m) => ({ ...m, status: 'active' as MemberStatus }));
};

/** Edit an existing member's fields by their original name. */
export const editMember = async (
  originalName: string,
  updates: Partial<Omit<Member, 'status'>>,
): Promise<void> => {
  if (!isRemote) {
    const lc = originalName.trim().toLowerCase();
    writeCache(
      getAllRoster().map((m) =>
        m.name.toLowerCase() === lc ? { ...m, ...updates } : m,
      ),
    );
    return;
  }
  const { error } = await supabase.from('roster').update(updates).eq('name', originalName);
  if (error) throw new Error(error.message);
  await fetchRoster();
};

/** Activate or deactivate a member. */
export const setMemberStatus = async (
  name: string,
  status: MemberStatus,
): Promise<void> => {
  if (!isRemote) {
    if (status === 'inactive') {
      const lc = name.trim().toLowerCase();
      writeCache(getAllRoster().filter((m) => m.name.toLowerCase() !== lc));
    }
    return;
  }
  const { error } = await supabase.from('roster').update({ status }).eq('name', name);
  if (error) throw new Error(error.message);
  await fetchRoster();
};

/** Remove a member by name. Marks the row as inactive (soft delete). */
export const removeMember = async (name: string): Promise<void> => {
  if (!isRemote) {
    const lc = name.trim().toLowerCase();
    writeCache(getAllRoster().filter((m) => m.name.toLowerCase() !== lc));
    return;
  }
  const { error } = await supabase.from('roster').update({ status: 'inactive' }).eq('name', name);
  if (error) throw new Error(error.message);
  await fetchRoster();
};

/* -------------------------- subscriptions --------------------------- */

/** Subscribe to roster changes (same tab + cross-tab). Returns unsubscribe fn. */
export const subscribeRoster = (handler: () => void) => {
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
