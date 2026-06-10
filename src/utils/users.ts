/**
 * User authentication store — Google Sheet backed.
 *
 * The team's Google Sheet (via an Apps Script web app) is the source of
 * truth for user registrations and login. We keep a localStorage session
 * so the UI knows the current user; the session is stored after every
 * login/logout.
 *
 * Endpoint: set VITE_USERS_ENDPOINT (the Apps Script /exec URL) in a
 * .env file. If empty, the module runs in LOCAL-ONLY mode (uses
 * localStorage for user storage) so dev still works without a sheet.
 */

// Use VITE_ROSTER_ENDPOINT (same Apps Script handles both roster and user operations)
const ENDPOINT = (import.meta.env.VITE_ROSTER_ENDPOINT ?? '').trim();
const isRemote = ENDPOINT.length > 0;

const SESSION_KEY = 'alpas-user-session';
const CHANGE_EVENT = 'alpas-user-changed';

export type UserGender = 'Male' | 'Female';
export type UserSide = 'Left' | 'Right' | 'Coxswain' | 'Coach';

export type User = {
  mobile: string;
  name: string;
  email?: string | null;
  birthday?: string | null;
  gender?: UserGender | null;
  side?: UserSide | null;
  weight?: number | null;
  createdAt: string;
};

export type Application = {
  mobile: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  rejectionReason?: string;
};

/* ----------------------------- cache -------------------------------- */

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed as User) ?? null;
  } catch {
    return null;
  }
};

const setCurrentUser = (user: User | null) => {
  if (typeof window === 'undefined') return;
  if (user) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

/* ----------------------------- network ------------------------------ */

const postToSheet = async (payload: unknown): Promise<unknown> => {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  return res.json();
};

/* ----------------------------- mutations ---------------------------- */

export const registerUser = async (
  mobile: string,
  name: string,
  email: string | undefined,
  birthday: string | undefined,
  password: string,
): Promise<User> => {
  if (!isRemote) {
    const user: User = {
      mobile: mobile.trim(),
      name: name.trim(),
      email: email?.trim() || undefined,
      birthday: birthday?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    // Check for duplicate in local storage
    const stored = localStorage.getItem('alpas-local-users');
    const users = stored ? JSON.parse(stored) : [];
    if (users.some((u: User) => u.mobile === mobile)) {
      throw new Error('Mobile number already registered.');
    }
    users.push(user);
    localStorage.setItem('alpas-local-users', JSON.stringify(users));
    setCurrentUser(user);
    return user;
  }

  const result = (await postToSheet({
    action: 'register',
    mobile,
    name,
    email,
    birthday,
    password,
  })) as {
    ok?: boolean;
    user?: User;
    error?: string;
  };

  if (!result || !result.ok) {
    throw new Error(result?.error ?? 'Could not register. Please try again.');
  }

  const user = result.user;
  if (user) {
    setCurrentUser(user);
    return user;
  }

  throw new Error('Registration failed: no user returned.');
};

export const loginUser = async (mobile: string, password: string): Promise<User> => {
  // Strip + prefix from mobile number to match stored format
  const cleanMobile = mobile.replace(/^\+/, '');

  if (!isRemote) {
    const stored = localStorage.getItem('alpas-local-users');
    const users = stored ? JSON.parse(stored) : [];
    const user = users.find(
      (u: User) => u.mobile === cleanMobile.trim(),
    );

    if (!user) {
      throw new Error('Invalid mobile or password.');
    }

    // In local mode, we store password in plaintext (demo only)
    // This is obviously insecure but matches the Apps Script behavior for consistency
    if ((user as any).password !== password) {
      throw new Error('Invalid mobile or password.');
    }

    setCurrentUser(user);
    return user;
  }

  const result = (await postToSheet({
    action: 'login',
    mobile: cleanMobile,
    password,
  })) as {
    ok?: boolean;
    user?: User;
    error?: string;
  };

  if (!result || !result.ok) {
    throw new Error(result?.error ?? 'Login failed. Please try again.');
  }

  const user = result.user;
  if (user) {
    setCurrentUser(user);
    return user;
  }

  throw new Error('Login failed: no user returned.');
};

export const logoutUser = (): void => {
  setCurrentUser(null);
};

/* -------------------- admin applications management ------------------- */

export const getApplications = async (): Promise<Application[]> => {
  if (!isRemote) {
    throw new Error('Applications require VITE_USERS_ENDPOINT to be set.');
  }

  const result = (await postToSheet({
    action: 'getApplications',
  })) as {
    ok?: boolean;
    applications?: Application[];
    error?: string;
  };

  if (!result || !result.ok) {
    throw new Error(result?.error ?? 'Could not fetch applications.');
  }

  return result.applications ?? [];
};

export const approveApplication = async (mobile: string): Promise<void> => {
  if (!isRemote) {
    throw new Error('Applications require VITE_USERS_ENDPOINT to be set.');
  }

  const result = (await postToSheet({
    action: 'approveApplication',
    mobile,
  })) as {
    ok?: boolean;
    message?: string;
    error?: string;
  };

  if (!result || !result.ok) {
    throw new Error(result?.error ?? 'Could not approve application.');
  }
};

export const rejectApplication = async (
  mobile: string,
  reason: string,
): Promise<void> => {
  if (!isRemote) {
    throw new Error('Applications require VITE_USERS_ENDPOINT to be set.');
  }

  const result = (await postToSheet({
    action: 'rejectApplication',
    mobile,
    reason,
  })) as {
    ok?: boolean;
    message?: string;
    error?: string;
  };

  if (!result || !result.ok) {
    throw new Error(result?.error ?? 'Could not reject application.');
  }
};

/* ----------------------- application workflow ---------------------- */

export const submitApplication = async (
  mobile: string,
  name: string,
  email: string,
): Promise<void> => {
  if (!isRemote) {
    throw new Error('Applications require VITE_USERS_ENDPOINT to be set.');
  }

  const result = (await postToSheet({
    action: 'submitApplication',
    mobile,
    name,
    email,
  })) as {
    ok?: boolean;
    message?: string;
    error?: string;
  };

  if (!result || !result.ok) {
    throw new Error(result?.error ?? 'Could not submit application. Please try again.');
  }
};

export const registerWithToken = async (
  token: string,
  password: string,
  birthday: string | undefined,
  profile: { gender: UserGender; side: UserSide; weight: number },
): Promise<User> => {
  if (!isRemote) {
    throw new Error('Token registration requires VITE_USERS_ENDPOINT to be set.');
  }

  const result = (await postToSheet({
    action: 'registerWithToken',
    token,
    password,
    birthday,
    gender: profile.gender,
    side: profile.side,
    weight: profile.weight,
  })) as {
    ok?: boolean;
    user?: User;
    error?: string;
  };

  if (!result || !result.ok) {
    throw new Error(result?.error ?? 'Registration failed. Please try again.');
  }

  const user = result.user;
  if (user) {
    setCurrentUser(user);
    return user;
  }

  throw new Error('Registration failed: no user returned.');
};

/* --------------------------- subscriptions -------------------------- */

export const subscribeAuth = (handler: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
  };
};
