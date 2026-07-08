// Shared SMTP sender for AlpasPinas Edge Functions.
//
// Replaces the old Google Apps Script GmailApp mailer. Sends over SMTP via
// denomailer, which works on the Supabase Edge (Deno) runtime. All connection
// details come from function secrets so no credentials live in the repo:
//
//   supabase secrets set \
//     SMTP_HOST=smtp.yourhost.com \
//     SMTP_PORT=465 \
//     SMTP_USER=admin@alpaspinas.com \
//     SMTP_PASS=<app-or-smtp-password> \
//     SMTP_FROM='AlpasPinas <admin@alpaspinas.com>'
//
// SMTP_PORT 465 => implicit TLS; 587 => STARTTLS.
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

export type Mail = {
  to: string;
  subject: string;
  /** Plain-text body. */
  text: string;
};

const env = (k: string): string => {
  const v = Deno.env.get(k);
  if (!v) throw new Error(`Missing required secret: ${k}`);
  return v;
};

/** Send one or more emails over a single SMTP connection. Throws on failure. */
export const sendMail = async (mails: Mail[]): Promise<void> => {
  const host = env('SMTP_HOST');
  const port = Number(Deno.env.get('SMTP_PORT') ?? '465');
  const from = env('SMTP_FROM');

  const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      tls: port === 465, // 465 = implicit TLS; 587 upgrades via STARTTLS
      auth: { username: env('SMTP_USER'), password: env('SMTP_PASS') },
    },
  });

  try {
    for (const m of mails) {
      await client.send({ from, to: m.to, subject: m.subject, content: m.text });
    }
  } finally {
    await client.close();
  }
};

/** MYR formatting to match the website's formatPrice, e.g. "RM 80". */
export const formatMYR = (amount: number): string => {
  const n = Number(amount) || 0;
  const s = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return `RM ${s}`;
};
