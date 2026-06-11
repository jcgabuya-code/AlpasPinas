-- ============================================================================
-- AlpasPinas — baseline migration
-- ============================================================================
-- The full schema as of 2026-06-11 (Phases 1–3 + registration tokens), written
-- idempotently so it can apply cleanly to the existing project DB the first
-- time `supabase db push` runs. From here on, make schema changes in NEW
-- migration files (supabase migration new <name>) — never edit this one.
--
-- Covers: profiles, applications, roster + Row-Level Security (RLS).
-- Training signups are NOT here — they stay in Google Sheets.
--
-- Mental model for a Postgres/MS SQL person:
--   * These are real Postgres tables.
--   * `auth.users` is a Supabase-managed table (passwords, sessions). We never
--     touch it directly; our `profiles` table links to it 1:1 by id.
--   * RLS policies below are the security layer. With RLS enabled, a table
--     returns ZERO rows unless a policy explicitly allows the current user.
--   * `auth.uid()` = the logged-in user's id (like a session variable).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. TABLES
-- ----------------------------------------------------------------------------

-- profiles: one row per user account. Mirrors the old "Users" sheet, minus the
-- password (Supabase Auth owns that now).
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  mobile      text unique not null,
  name        text not null,
  email       text,
  birthday    date,
  gender      text check (gender in ('Male', 'Female')),
  side        text check (side in ('Left', 'Right', 'Coxswain', 'Coach')),
  weight      numeric check (weight between 30 and 200),
  status      text not null default 'active',
  is_admin    boolean not null default false,   -- replaces the client-side PIN gate
  created_at  timestamptz not null default now()
);

-- applications: public sign-up requests awaiting admin approval.
-- Mirrors the old "Applications" sheet.
create table if not exists public.applications (
  id               uuid primary key default gen_random_uuid(),
  mobile           text not null,
  name             text not null,
  email            text not null,
  status           text not null default 'pending'
                   check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at       timestamptz not null default now()
);

-- Registration-token columns (added after Phase 3). Approval mints a token;
-- the /register page is only usable with a live one. `alter ... if not exists`
-- keeps this file re-runnable.
alter table public.applications add column if not exists registration_token uuid;
alter table public.applications add column if not exists token_expires_at   timestamptz;
alter table public.applications add column if not exists token_used_at      timestamptz;

-- roster: the public team roster shown on the site. Separate from accounts —
-- not everyone on the roster necessarily has a login. Mirrors "Roster" sheet.
create table if not exists public.roster (
  id      uuid primary key default gen_random_uuid(),
  name    text not null,
  role    text,
  side    text,
  joined  date,
  photo   text,
  status  text not null default 'active'
);


-- ----------------------------------------------------------------------------
-- 2. ADMIN HELPER
-- ----------------------------------------------------------------------------
-- Why a function instead of a subquery in each policy?
-- An RLS policy on `profiles` that itself SELECTs from `profiles` to check
-- is_admin causes INFINITE RECURSION. A SECURITY DEFINER function runs with the
-- definer's rights and bypasses RLS, breaking the loop. This is the standard
-- Supabase pattern.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- approve_application(): the ONLY way to approve. Admin-only (checked inside,
-- since SECURITY DEFINER bypasses RLS). Sets status, mints a fresh token with
-- a 7-day expiry, and returns what the caller needs to send the email. Works
-- on 'approved' rows too, so admins can regenerate an expired link ("resend").
create or replace function public.approve_application(app_mobile text)
returns table (reg_token uuid, app_email text, app_name text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can approve applications.';
  end if;

  return query
  update public.applications a
     set status             = 'approved',
         registration_token = gen_random_uuid(),
         token_expires_at   = now() + interval '7 days',
         token_used_at      = null
   where a.mobile = app_mobile
     and a.status in ('pending', 'approved')
  returning a.registration_token, a.email, a.name;
end;
$$;

grant execute on function public.approve_application(text) to authenticated;

-- check_registration_token(): the /register page gate. Anonymous-callable; a
-- valid (approved, unused, unexpired) token reveals ONLY the applicant's email
-- and name — never the row. Invalid/expired tokens return zero rows.
create or replace function public.check_registration_token(check_token uuid)
returns table (app_email text, app_name text)
language sql
security definer
set search_path = public
as $$
  select email, name from public.applications
  where registration_token = check_token
    and status = 'approved'
    and token_used_at is null
    and token_expires_at > now();
$$;

grant execute on function public.check_registration_token(uuid) to anon, authenticated;

-- has_valid_registration_token(): the RLS gate for profile creation (replaces
-- is_email_approved). An approved email with an EXPIRED or USED token can no
-- longer register — the expiry is enforced server-side, not just in the UI.
create or replace function public.has_valid_registration_token(check_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.applications
    where lower(email) = lower(check_email)
      and status = 'approved'
      and token_used_at is null
      and token_expires_at > now()
  );
$$;

grant execute on function public.has_valid_registration_token(text) to anon, authenticated;

-- mark_token_used(): after a profile is created, burn the token so the link
-- is single-use. Trigger (not client code) so it can't be skipped.
create or replace function public.mark_token_used()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.applications
     set token_used_at = now()
   where lower(email) = lower(new.email)
     and status = 'approved'
     and token_used_at is null;
  return new;
end;
$$;

drop trigger if exists trg_mark_token_used on public.profiles;
create trigger trg_mark_token_used
  after insert on public.profiles
  for each row execute function public.mark_token_used();


-- ----------------------------------------------------------------------------
-- 3. ENABLE ROW-LEVEL SECURITY
-- ----------------------------------------------------------------------------
-- Once enabled, the default is DENY ALL. Nothing is readable/writable until a
-- policy below grants it. (This is the opposite of a fresh Postgres table.)
alter table public.profiles     enable row level security;
alter table public.applications enable row level security;
alter table public.roster       enable row level security;


-- ----------------------------------------------------------------------------
-- 4. POLICIES
-- ----------------------------------------------------------------------------
-- Roles: `anon` = not logged in (holds the public anon key).
--        `authenticated` = logged-in user.

-- `create policy` is NOT idempotent — re-running a plain CREATE errors and
-- aborts the rest of the script. We drop-then-create so this whole file is
-- safe to re-run any time.

-- --- profiles -----------------------------------------------------------------
-- A user can read their own profile; admins can read everyone.
drop policy if exists "profiles: self or admin can read" on public.profiles;
create policy "profiles: self or admin can read"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

-- A user can update their own profile; admins can update anyone.
drop policy if exists "profiles: self or admin can update" on public.profiles;
create policy "profiles: self or admin can update"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- A freshly signed-up user creates their OWN profile row, and only if their
-- email holds a live registration token. Three guards:
--   1. id = auth.uid()            → can only create their own row
--   2. email matches their login  → can't claim someone else's approved email
--   3. has_valid_registration_token(email) → approved AND link not expired/used
drop policy if exists "profiles: approved user can create own" on public.profiles;
create policy "profiles: approved user can create own"
  on public.profiles for insert
  with check (
    id = auth.uid()
    and lower(email) = lower(auth.jwt() ->> 'email')
    and public.has_valid_registration_token(email)
  );

-- --- applications -------------------------------------------------------------
-- Anyone (even anonymous) can submit an application — this is the public form.
-- No `to` clause: applies to the `public` pseudo-role (all roles), gated only
-- by `with check`. Keeping it role-agnostic avoids depending on how a given
-- API key resolves its role.
--
-- NOTE for the client: submit applications with a BARE insert — do NOT chain
-- .select(). INSERT ... RETURNING needs a SELECT policy to read the row back,
-- and the only SELECT policy here is admin-only, so .select() would fail with
-- an RLS error even though the insert itself is allowed.
--
-- `status = 'pending'` is critical: without it, anyone could insert an
-- application already marked 'approved' and self-bypass the registration gate.
-- Only admins can move an application to 'approved' (via the update policy).
drop policy if exists "applications: anyone can apply" on public.applications;
create policy "applications: anyone can apply"
  on public.applications for insert
  with check (status = 'pending');

-- Only admins can read or change applications.
drop policy if exists "applications: admin can read" on public.applications;
create policy "applications: admin can read"
  on public.applications for select
  using (public.is_admin());

drop policy if exists "applications: admin can update" on public.applications;
create policy "applications: admin can update"
  on public.applications for update
  using (public.is_admin())
  with check (public.is_admin());

-- --- roster -------------------------------------------------------------------
-- The roster is public — anyone can read it. No `to` clause: applies to all
-- roles, gated only by `using (true)`.
drop policy if exists "roster: public read" on public.roster;
create policy "roster: public read"
  on public.roster for select
  using (true);

-- Only admins can modify the roster.
drop policy if exists "roster: admin write" on public.roster;
create policy "roster: admin write"
  on public.roster for all
  using (public.is_admin())
  with check (public.is_admin());


-- ----------------------------------------------------------------------------
-- 5. HELPFUL INDEXES
-- ----------------------------------------------------------------------------
create index if not exists idx_profiles_mobile     on public.profiles (mobile);
create index if not exists idx_applications_status on public.applications (status);
create index if not exists idx_applications_token  on public.applications (registration_token);


-- ----------------------------------------------------------------------------
-- 6. CLEANUP
-- ----------------------------------------------------------------------------
-- is_email_approved was the pre-token registration gate; the policy above no
-- longer references it, so this drop succeeds. (Postgres blocks dropping a
-- function a policy still depends on — hence this runs after section 4.)
drop function if exists public.is_email_approved(text);
