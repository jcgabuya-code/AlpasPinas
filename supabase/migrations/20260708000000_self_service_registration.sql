-- ============================================================================
-- AlpasPinas — self-service registration toggle (trial period)
-- ============================================================================
-- During the trial we want applicants to skip the manual admin-approval step:
-- submitting the join form should immediately mint a registration token and
-- email the /register link, exactly as if an admin had approved it. After the
-- trial, flip the flag off and the old admin-approval gate is back — no code
-- change or redeploy needed.
--
-- The flag lives server-side (not just a client env var) because token minting
-- must happen with RLS-bypassing rights, and we don't want the "gate" to be
-- something a client could simply lie about.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. app_config: tiny key/value store for runtime feature flags.
-- ----------------------------------------------------------------------------
create table if not exists public.app_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Default the trial ON. `on conflict do nothing` keeps this re-runnable without
-- clobbering a value an admin has since toggled.
insert into public.app_config (key, value)
values ('auto_approve_registrations', 'true'::jsonb)
on conflict (key) do nothing;

alter table public.app_config enable row level security;

-- The only rows here are non-sensitive feature flags, so a public read is fine
-- (the join form needs to know which success message to show).
drop policy if exists "app_config: public read" on public.app_config;
create policy "app_config: public read"
  on public.app_config for select
  using (true);

-- Only admins can change a flag.
drop policy if exists "app_config: admin write" on public.app_config;
create policy "app_config: admin write"
  on public.app_config for all
  using (public.is_admin())
  with check (public.is_admin());


-- ----------------------------------------------------------------------------
-- 2. auto_approve_enabled(): server-side read of the flag.
-- ----------------------------------------------------------------------------
create or replace function public.auto_approve_enabled()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select (value #>> '{}')::boolean
       from public.app_config
      where key = 'auto_approve_registrations'),
    false);
$$;

grant execute on function public.auto_approve_enabled() to anon, authenticated;


-- ----------------------------------------------------------------------------
-- 3. set_auto_approve(): admin-only setter for the flag.
-- ----------------------------------------------------------------------------
create or replace function public.set_auto_approve(enabled boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change registration settings.';
  end if;

  insert into public.app_config (key, value, updated_at)
  values ('auto_approve_registrations', to_jsonb(enabled), now())
  on conflict (key) do update
    set value = excluded.value, updated_at = now();

  return enabled;
end;
$$;

grant execute on function public.set_auto_approve(boolean) to authenticated;


-- ----------------------------------------------------------------------------
-- 4. self_approve_application(): anon-callable, but ONLY while the flag is on.
-- ----------------------------------------------------------------------------
-- Mirrors approve_application (mint token + 7-day expiry) minus the admin check,
-- gated instead on auto_approve_enabled(). Matches on mobile AND email so a
-- caller can only mint a token for the application they just submitted (both
-- values are theirs), not enumerate other pending applicants by mobile alone.
create or replace function public.self_approve_application(app_mobile text, app_email text)
returns table (reg_token uuid, out_email text, out_name text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.auto_approve_enabled() then
    raise exception 'Self-service registration is currently disabled.';
  end if;

  return query
  update public.applications a
     set status             = 'approved',
         registration_token = gen_random_uuid(),
         token_expires_at   = now() + interval '7 days',
         token_used_at      = null
   where a.mobile = app_mobile
     and lower(a.email) = lower(app_email)
     and a.status in ('pending', 'approved')
  returning a.registration_token, a.email, a.name;
end;
$$;

grant execute on function public.self_approve_application(text, text) to anon, authenticated;
