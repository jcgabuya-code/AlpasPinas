-- Fix RPC signature ordering for the application conflict helper.
-- Some Supabase clients resolve named parameters in alphabetical order,
-- so the function signature must match the client-side expectation.
create or replace function public.check_application_conflict(
  check_email text,
  check_mobile text
)
returns table (
  mobile_taken boolean,
  email_taken boolean
)
language sql
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.profiles
      where mobile = trim(check_mobile)
    )
    or exists (
      select 1 from public.applications
      where mobile = trim(check_mobile)
    ) as mobile_taken,
    exists (
      select 1 from public.profiles
      where lower(email) = lower(trim(check_email))
    )
    or exists (
      select 1 from public.applications
      where lower(email) = lower(trim(check_email))
    ) as email_taken;
$$;

grant execute on function public.check_application_conflict(text, text) to anon, authenticated;
