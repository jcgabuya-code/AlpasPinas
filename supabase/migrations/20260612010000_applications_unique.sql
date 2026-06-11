-- Enforce unique mobile and email for join applications.
-- This prevents duplicate pending applications and avoids admin approval ambiguity.
create unique index if not exists idx_applications_mobile_unique on public.applications (mobile);
create unique index if not exists idx_applications_email_unique on public.applications (lower(email));

create or replace function public.check_application_conflict(
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
