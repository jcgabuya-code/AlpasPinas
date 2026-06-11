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

import { supabase } from './supabase';

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
  isAdmin: boolean;
  createdAt: string;
};

export type Application = {
  mobile: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  rejectionReason?: string;
  registrationToken?: string | null;
  tokenExpiresAt?: string | null;
  tokenUsedAt?: string | null;
};

/* ===================================================================== */
/* Supabase auth (Phase 3a)                                              */
/* ===================================================================== */

// Shape of a row in the `profiles` table.
type ProfileRow = {
  id: string;
  mobile: string;
  name: string;
  email: string | null;
  birthday: string | null;
  gender: UserGender | null;
  side: UserSide | null;
  weight: number | null;
  is_admin: boolean;
  created_at: string;
};

const mapProfile = (row: ProfileRow): User => ({
  mobile: row.mobile,
  name: row.name,
  email: row.email,
  birthday: row.birthday,
  gender: row.gender,
  side: row.side,
  weight: row.weight,
  isAdmin: row.is_admin,
  createdAt: row.created_at,
});

/**
 * The profile of the currently signed-in user, or null if signed out.
 * Reads the Supabase session, then the matching `profiles` row.
 */
export const getCurrentProfile = async (): Promise<User | null> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error || !data) return null;
  return mapProfile(data as ProfileRow);
};

/** Sign in with email + password (Supabase Auth). Throws on failure. */
export const loginWithEmail = async (email: string, password: string): Promise<void> => {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) {
    // Normalise Supabase's message to match the app's existing copy.
    throw new Error(
      /invalid login credentials/i.test(error.message)
        ? 'Invalid email or password.'
        : error.message,
    );
  }
};

/**
 * Register via an emailed registration token: resolve the token (which also
 * yields the canonical approved email), create the auth user, then create the
 * profile row. RLS re-checks the token server-side, and a trigger burns it
 * after the profile insert, so the link is single-use and expiring. Email
 * confirmation is off, so sign-up returns a live session immediately.
 */
export const registerWithEmail = async (
  token: string,
  password: string,
  profile: {
    mobile: string;
    name: string;
    birthday?: string;
    gender: UserGender;
    side: UserSide;
    weight: number;
  },
): Promise<User> => {
  // 1. Resolve the token so we don't strand an auth user with no profile.
  const applicant = await checkRegistrationToken(token);
  if (!applicant) {
    throw new Error('This registration link is invalid or has expired. Please contact the team admin.');
  }
  const cleanEmail = applicant.email.trim();

  // 2. Create the auth user (confirmation off → immediate session).
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
  });
  if (signUpError) {
    throw new Error(
      /already registered/i.test(signUpError.message)
        ? 'An account with this email already exists. Try signing in.'
        : signUpError.message,
    );
  }
  const userId = signUpData.user?.id;
  if (!userId) throw new Error('Sign-up failed — no user returned.');

  // 3. Create the profile row (RLS re-checks approval as defense-in-depth).
  const { data: row, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      mobile: profile.mobile.trim(),
      name: profile.name.trim(),
      email: cleanEmail,
      birthday: profile.birthday?.trim() || null,
      gender: profile.gender,
      side: profile.side,
      weight: profile.weight,
    })
    .select()
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);
  if (!row) throw new Error('Profile creation failed.');

  return mapProfile(row as ProfileRow);
};

/** Sign out of Supabase. The auth listener clears the user. */
export const logout = async (): Promise<void> => {
  await supabase.auth.signOut();
};

/** Subscribe to Supabase auth changes; fires on sign-in / sign-out / refresh. */
export const onAuthChange = (handler: () => void) => {
  const { data } = supabase.auth.onAuthStateChange(() => handler());
  return () => data.subscription.unsubscribe();
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
      isAdmin: false,
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

type ApplicationRow = {
  id: string;
  mobile: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  registration_token: string | null;
  token_expires_at: string | null;
  token_used_at: string | null;
};

const mapApplication = (row: ApplicationRow): Application => ({
  mobile: row.mobile,
  name: row.name,
  email: row.email,
  status: row.status,
  createdAt: row.created_at,
  rejectionReason: row.rejection_reason ?? undefined,
  registrationToken: row.registration_token,
  tokenExpiresAt: row.token_expires_at,
  tokenUsedAt: row.token_used_at,
});

/** Admin-only: list all applications (RLS returns nothing for non-admins). */
export const getApplications = async (): Promise<Application[]> => {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as ApplicationRow[]).map(mapApplication);
};

/**
 * Admin-only: approve the application for this mobile via the
 * `approve_application` RPC, which mints a registration token with a 7-day
 * expiry. Also works on already-approved applications (regenerates the token,
 * i.e. "resend link"). Returns what the mailer needs.
 */
export const approveApplication = async (
  mobile: string,
): Promise<{ token: string; email: string; name: string }> => {
  const { data, error } = await supabase.rpc('approve_application', {
    app_mobile: mobile,
  });

  if (error) throw new Error(error.message);
  const row = (data as { reg_token: string; app_email: string; app_name: string }[])?.[0];
  if (!row) throw new Error('Application not found.');
  return { token: row.reg_token, email: row.app_email, name: row.app_name };
};

/**
 * Public: resolve a registration token to the applicant it belongs to.
 * Returns null when the token is unknown, expired, or already used — the
 * Register page stays locked in that case.
 */
export const checkRegistrationToken = async (
  token: string,
): Promise<{ email: string; name: string } | null> => {
  const { data, error } = await supabase.rpc('check_registration_token', {
    check_token: token,
  });

  if (error) throw new Error(error.message);
  const row = (data as { app_email: string; app_name: string }[])?.[0];
  return row ? { email: row.app_email, name: row.app_name } : null;
};

/**
 * Ask the Apps Script mailer to deliver the registration link. The script
 * builds the URL itself from the token; we only pass the token. Returns
 * whether the email went out — approval already succeeded either way, so the
 * caller should fall back to copy-link rather than treat this as fatal.
 */
export const sendRegistrationEmail = async (
  email: string,
  name: string,
  token: string,
): Promise<boolean> => {
  if (!isRemote) return false;
  try {
    const result = (await postToSheet({
      action: 'sendRegistrationEmail',
      secret: (import.meta.env.VITE_MAILER_SECRET ?? '').trim(),
      email,
      name,
      token,
    })) as { ok?: boolean };
    return Boolean(result?.ok);
  } catch {
    return false;
  }
};

/** Admin-only: reject the pending application for this mobile, with a reason. */
export const rejectApplication = async (mobile: string, reason: string): Promise<void> => {
  const { error } = await supabase
    .from('applications')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('mobile', mobile)
    .eq('status', 'pending');

  if (error) throw new Error(error.message);
};

/* ----------------------- application workflow ---------------------- */

/**
 * Public: submit a join application. BARE insert (no .select()) — the only
 * SELECT policy on applications is admin-only, so reading the row back would
 * fail RLS. Status defaults to 'pending' (and the insert policy enforces it).
 */
export const submitApplication = async (
  mobile: string,
  name: string,
  email: string,
): Promise<void> => {
  const { error } = await supabase
    .from('applications')
    .insert({ mobile: mobile.trim(), name: name.trim(), email: email.trim() });

  if (error) throw new Error(error.message);
};

/* --------------------------- subscriptions -------------------------- */

export const subscribeAuth = (handler: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
  };
};
