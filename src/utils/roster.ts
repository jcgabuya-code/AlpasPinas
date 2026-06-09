/**
 * Roster store — Google Sheet backed.
 *
 * The team's Google Sheet (via an Apps Script web app) is the source of
 * truth. We keep a localStorage cache so the UI renders instantly and works
 * offline; the cache is refreshed from the sheet on load and after every
 * mutation.
 *
 * Endpoint: set VITE_ROSTER_ENDPOINT (the Apps Script /exec URL) in a
 * .env file. If empty, the module runs in LOCAL-ONLY mode (serves the
 * bundled roster.json) so dev still works without a sheet.
 */

import staticRoster from '../data/roster.json';

const ENDPOINT = (import.meta.env.VITE_ROSTER_ENDPOINT ?? '').trim();
const isRemote = ENDPOINT.length > 0;

const CACHE_KEY = 'alpas-roster-v1';
const CHANGE_EVENT = 'alpas-roster-changed';

export type MemberStatus = 'active' | 'inactive';

export type Member = {
  name: string;
  role: string;
  side: string;
  joined: number;
  photo: string | null;
  status?: MemberStatus;
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

/**
 * Pull the authoritative roster from the sheet and refresh the cache.
 * In local-only mode this just returns the current cache / static JSON.
 */
export const fetchRoster = async (): Promise<Member[]> => {
  if (!isRemote) return getAllRoster();
  try {
    const res = await fetch(ENDPOINT, { method: 'GET' });
    const data = await res.json();
    if (data && data.ok && Array.isArray(data.members)) {
      writeCache(data.members as Member[]);
      return data.members as Member[];
    }
  } catch {
    // offline — keep serving the cache
  }
  return getAllRoster();
};

const postToSheet = async (payload: unknown): Promise<unknown> => {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  return res.json();
};

/* ----------------------------- mutations ---------------------------- */

/** Add a new member. Writes to the sheet (remote) or just the cache (local). */
export const addMember = async (m: Omit<Member, 'photo'> & { photo?: string | null }): Promise<Member> => {
  const member: Member = { photo: null, ...m };
  if (!isRemote) {
    writeCache([...getAllRoster(), member]);
    return member;
  }
  const result = (await postToSheet({ action: 'add', member })) as {
    ok?: boolean;
    member?: Member;
    error?: string;
  };
  if (!result || !result.ok) {
    throw new Error(result?.error ?? 'Could not save member. Please try again.');
  }
  const saved = result.member ?? member;
  await fetchRoster();
  return saved;
};

/**
 * Fetch ALL members (including inactive) for admin use.
 * Passes ?admin=1 so the sheet returns status fields.
 */
export const fetchAllRoster = async (): Promise<Member[]> => {
  if (!isRemote) {
    return getAllRoster().map((m) => ({ ...m, status: 'active' as MemberStatus }));
  }
  try {
    const res = await fetch(`${ENDPOINT}?admin=1`, { method: 'GET' });
    const data = await res.json();
    if (data && data.ok && Array.isArray(data.members)) {
      return data.members as Member[];
    }
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
  const result = (await postToSheet({ action: 'edit', originalName, member: updates })) as {
    ok?: boolean;
    error?: string;
  };
  if (!result || !result.ok) {
    throw new Error(result?.error ?? 'Could not update member.');
  }
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
  const result = (await postToSheet({ action: 'setStatus', name, status })) as {
    ok?: boolean;
    error?: string;
  };
  if (!result || !result.ok) {
    throw new Error(result?.error ?? 'Could not update status.');
  }
  await fetchRoster();
};

/** Remove a member by name. Marks the sheet row as inactive. */
export const removeMember = async (name: string): Promise<void> => {
  if (!isRemote) {
    const lc = name.trim().toLowerCase();
    writeCache(getAllRoster().filter((m) => m.name.toLowerCase() !== lc));
    return;
  }
  const result = (await postToSheet({ action: 'remove', name })) as {
    ok?: boolean;
    error?: string;
  };
  if (!result || !result.ok) {
    throw new Error(result?.error ?? 'Could not remove member. Please try again.');
  }
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
