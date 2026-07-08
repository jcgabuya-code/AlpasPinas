// send-registration-email — fired by a Postgres Database Webhook when a fresh
// registration_token is minted on public.applications (see migration). This
// covers BOTH the admin-approve path and the public self-service (trial) path,
// which is why it can't require an admin JWT — a self-approving applicant is
// anonymous. Instead, like send-order-email, it's driven by the DB and gated on
// a shared secret header (REG_WEBHOOK_SECRET).
//
// Deployed with verify_jwt = false (see supabase/config.toml): the caller is
// Postgres, not a user.
import { sendMail } from '../_shared/smtp.ts';

const APP_BASE_URL = Deno.env.get('APP_BASE_URL') ?? 'https://beta.alpaspinas.com';

type ApplicationRow = { email: string; name: string | null; registration_token: string | null };
type WebhookPayload = { type: string; table: string; record: ApplicationRow | null };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);

  const expected = Deno.env.get('REG_WEBHOOK_SECRET');
  if (!expected || req.headers.get('x-webhook-secret') !== expected) {
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: 'Bad request' }, 400);
  }

  const row = payload.record;
  const email = (row?.email ?? '').trim();
  const token = (row?.registration_token ?? '').trim();
  const name = (row?.name ?? 'there').trim();
  if (!email || !token) {
    // Nothing to send (e.g. token cleared) — ack so the webhook isn't retried.
    return json({ ok: false, error: 'No email/token in payload' }, 200);
  }

  const link = `${APP_BASE_URL}/register?token=${encodeURIComponent(token)}`;
  try {
    await sendMail([
      {
        to: email,
        subject: 'AlpasPinas — Complete Your Registration',
        text:
          `Hi ${name},\n\n` +
          `Welcome to AlpasPinas! Your application has been approved.\n\n` +
          `Click the link below to complete your registration and set your password:\n` +
          `${link}\n\n` +
          `This link will expire in 7 days.\n\n` +
          `See you on the water!\n` +
          `AlpasPinas Team`,
      },
    ]);
    return json({ ok: true, emailSent: true });
  } catch (err) {
    console.error('Registration email failed:', err);
    return json({ ok: false, emailSent: false, error: String(err) }, 500);
  }
});
