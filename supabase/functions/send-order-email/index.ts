// send-order-email — fired by a Postgres Database Webhook on INSERT into
// public.merch_orders (see migration). Emails the buyer a reservation summary
// and copies the team. No browser ever calls this and no secret lives in the
// client: the DB trigger POSTs the new row here with a shared secret header.
//
// Deployed with verify_jwt = false (see supabase/config.toml) because the caller
// is Postgres, not an authenticated user — we gate on ORDER_WEBHOOK_SECRET.
import { sendMail, formatMYR, type Mail } from '../_shared/smtp.ts';

type OrderItem = { productId: string; name: string; size?: string; qty: number; unitPrice: number };

type OrderRow = {
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  items: OrderItem[] | null;
  total: number | string;
  note: string | null;
  delivery_method: 'pickup' | 'delivery' | null;
  delivery_address: string | null;
};

type WebhookPayload = { type: string; table: string; record: OrderRow | null };

const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') ?? 'admin@alpaspinas.com';

const buildSummary = (o: OrderRow): string => {
  const items = Array.isArray(o.items) ? o.items : [];
  const lines = items.map(
    (it) =>
      `  • ${it.qty}× ${it.name}${it.size ? ` (${it.size})` : ''} — ${formatMYR(it.unitPrice * it.qty)}`,
  );
  const isDelivery = (o.delivery_method ?? 'pickup') === 'delivery';
  return (
    `${lines.join('\n')}\n\n` +
    `Total: ${formatMYR(Number(o.total))}\n` +
    `Fulfilment: ${isDelivery ? 'Delivery' : 'Self pick-up'}` +
    (isDelivery && o.delivery_address ? `\nAddress: ${o.delivery_address}` : '') +
    (o.note ? `\nNote: ${o.note}` : '')
  );
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  // Gate: only our DB webhook (which knows the secret) may trigger email.
  const expected = Deno.env.get('ORDER_WEBHOOK_SECRET');
  if (!expected || req.headers.get('x-webhook-secret') !== expected) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const o = payload.record;
  if (!o || !o.contact_email || !Array.isArray(o.items) || o.items.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: 'No order in payload' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const summary = buildSummary(o);
  const isDelivery = (o.delivery_method ?? 'pickup') === 'delivery';
  const name = o.contact_name || 'there';

  const mails: Mail[] = [
    {
      to: o.contact_email,
      subject: 'AlpasPinas — Reservation received',
      text:
        `Hi ${name},\n\n` +
        `Thanks! We've got your reservation. Here's what you reserved:\n\n` +
        `${summary}\n\n` +
        `This is a reservation, not a payment — no payment has been taken yet. ` +
        `The team will reach out to confirm availability` +
        (isDelivery ? ', share an estimated delivery date,' : ' and arrange pick-up') +
        ` and settle payment with you directly.\n\n` +
        `See you on the water!\n` +
        `AlpasPinas Team`,
    },
    {
      to: ADMIN_EMAIL,
      subject: `New shop reservation — ${name}`,
      text:
        `New reservation from ${name}` +
        (o.contact_email ? ` <${o.contact_email}>` : '') +
        (o.contact_phone ? ` · ${o.contact_phone}` : '') +
        `\n\n${summary}\n\n` +
        `Manage it in Admin → Shop Orders.`,
    },
  ];

  try {
    await sendMail(mails);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Order email failed:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
