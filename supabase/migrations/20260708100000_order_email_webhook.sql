-- Order confirmation email webhook
-- ---------------------------------------------------------------------------
-- Fire the `send-order-email` Edge Function whenever a new row lands in
-- public.merch_orders. Replaces the client-side Apps Script mailer: the browser
-- no longer sends email and holds no mailer secret — Postgres POSTs the new row
-- straight to the function.
--
-- The function URL and the shared header secret live in Supabase Vault (NOT in
-- this migration, since the repo is public). Set them ONCE after deploying the
-- function (see the block at the bottom of this file). Until both secrets exist
-- the trigger is a safe no-op, so this migration is harmless to apply early.

create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

create or replace function public.send_order_email_webhook()
returns trigger
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  fn_url text;
  fn_secret text;
begin
  select decrypted_secret into fn_url
    from vault.decrypted_secrets where name = 'order_email_fn_url';
  select decrypted_secret into fn_secret
    from vault.decrypted_secrets where name = 'order_email_webhook_secret';

  -- No-op until the operator has configured both Vault secrets.
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
      'type', 'INSERT',
      'table', 'merch_orders',
      'schema', 'public',
      'record', to_jsonb(new)
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_send_order_email on public.merch_orders;
create trigger trg_send_order_email
  after insert on public.merch_orders
  for each row execute function public.send_order_email_webhook();

-- ---------------------------------------------------------------------------
-- ONE-TIME OPERATOR SETUP (run in the Supabase SQL editor AFTER deploying the
-- function; do NOT commit real values). The webhook secret here must equal the
-- ORDER_WEBHOOK_SECRET function secret set via `supabase secrets set`.
--
--   select vault.create_secret(
--     'https://ywqsniqogwtucsbifosm.functions.supabase.co/send-order-email',
--     'order_email_fn_url');
--   select vault.create_secret('<same-random-value-as-ORDER_WEBHOOK_SECRET>',
--     'order_email_webhook_secret');
--
-- To rotate later: select vault.update_secret(id, '<new>') for the row.
-- ---------------------------------------------------------------------------
