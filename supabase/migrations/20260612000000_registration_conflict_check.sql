-- Add a server-side helper for registration validation.
-- This allows anonymous registration flows to verify whether a mobile
-- number or email is already associated with an existing profile.
create or replace function public.check_registration_conflict(
  check_mobile text,
  check_email text
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
    ) as mobile_taken,
    exists (
      select 1 from public.profiles
      where lower(email) = lower(trim(check_email))
    ) as email_taken;
$$;

grant execute on function public.check_registration_conflict(text, text) to anon, authenticated;
