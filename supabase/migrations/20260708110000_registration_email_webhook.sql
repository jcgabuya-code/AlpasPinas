-- Registration email webhook
-- ---------------------------------------------------------------------------
-- Fire the `send-registration-email` Edge Function whenever a fresh
-- registration_token is minted on public.applications. This fires for BOTH the
-- admin-approve path (approve_application) and the public self-service/trial
-- path (self_approve_application) — the browser no longer sends this email and
-- holds no mailer secret. Replaces the old Apps Script mailer + client call.
--
-- Function URL + shared secret live in Supabase Vault (names below); the secret
-- must equal the REG_WEBHOOK_SECRET function secret. No-op until both are set.

create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

create or replace function public.send_registration_email_webhook()
returns trigger
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  fn_url text;
  fn_secret text;
begin
  -- Only when a brand-new token was just set (approve / self-approve / resend).
  if new.registration_token is null
     or new.registration_token is not distinct from old.registration_token then
    return new;
  end if;

  select decrypted_secret into fn_url
    from vault.decrypted_secrets where name = 'reg_email_fn_url';
  select decrypted_secret into fn_secret
    from vault.decrypted_secrets where name = 'reg_email_webhook_secret';

  if fn_url is null or fn_secret is null then
    return new;
  end if;

  perform net.http_post(
    url     := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', fn_secret
    ),
    body    := jsonb_build_object(
      'type', 'UPDATE',
      'table', 'applications',
      'schema', 'public',
      'record', jsonb_build_object(
        'email', new.email,
        'name', new.name,
        'registration_token', new.registration_token
      )
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_send_registration_email on public.applications;
create trigger trg_send_registration_email
  after update on public.applications
  for each row execute function public.send_registration_email_webhook();

-- ---------------------------------------------------------------------------
-- ONE-TIME OPERATOR SETUP (Supabase SQL editor; do NOT commit real values):
--   select vault.create_secret(
--     'https://ywqsniqogwtucsbifosm.functions.supabase.co/send-registration-email',
--     'reg_email_fn_url');
--   select vault.create_secret('<same value as REG_WEBHOOK_SECRET>',
--     'reg_email_webhook_secret');
-- ---------------------------------------------------------------------------
