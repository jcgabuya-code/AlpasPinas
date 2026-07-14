-- ============================================================================
-- AlpasPinas — registration token also reveals the applicant's mobile
-- ============================================================================
-- The onboarding revamp's register wizard no longer re-asks for name / email /
-- mobile — they all carry over from the application. check_registration_token
-- already returned email + name; add the mobile so the client can prefill the
-- profile without a second field. Still anonymous-callable, still reveals only
-- these three columns for a valid (approved, unused, unexpired) token.
--
-- The return signature changes, so the function must be dropped and recreated
-- (create-or-replace cannot alter a function's return table).
-- ============================================================================

drop function if exists public.check_registration_token(uuid);

create function public.check_registration_token(check_token uuid)
returns table (app_email text, app_name text, app_mobile text)
language sql
security definer
set search_path = public
as $$
  select email, name, mobile from public.applications
  where registration_token = check_token
    and status = 'approved'
    and token_used_at is null
    and token_expires_at > now();
$$;

grant execute on function public.check_registration_token(uuid) to anon, authenticated;
