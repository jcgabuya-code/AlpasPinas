-- ============================================================================
-- AlpasPinas — Supabase schema (Phase 1)
-- ============================================================================
-- Run this in the Supabase Studio SQL editor (Database → SQL Editor → New query).
-- It is idempotent-ish: safe to re-run during setup, but review before running
-- against data you care about.
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

-- is_email_approved(): does this email have an APPROVED application?
-- This is the registration gate (replaces the old email-token system). It's
-- SECURITY DEFINER so it can read `applications` (which is admin-only under
-- RLS) on behalf of an anonymous caller — but it only ever returns a boolean,
-- never exposes application rows. Granted to anon/authenticated so the Register
-- page can pre-check before attempting sign-up.
create or replace function public.is_email_approved(check_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.applications
    where lower(email) = lower(check_email) and status = 'approved'
  );
$$;

grant execute on function public.is_email_approved(text) to anon, authenticated;


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
-- email has an approved application. Three guards:
--   1. id = auth.uid()            → can only create their own row
--   2. email matches their login  → can't claim someone else's approved email
--   3. is_email_approved(email)    → must have been approved by an admin
drop policy if exists "profiles: approved user can create own" on public.profiles;
create policy "profiles: approved user can create own"
  on public.profiles for insert
  with check (
    id = auth.uid()
    and lower(email) = lower(auth.jwt() ->> 'email')
    and public.is_email_approved(email)
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
