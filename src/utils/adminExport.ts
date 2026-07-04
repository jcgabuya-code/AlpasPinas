/**
 * Standalone admin snapshot export — a single self-contained HTML file with
 * the current state of User Registrations, Training Sign-ups, and Boat
 * Assignments. No script, no network calls once generated: everything is
 * baked in as plain HTML/CSS, so it can be opened, printed, or archived
 * offline (e.g. to hand off a lineup sheet without giving someone admin
 * access).
 *
 * Deliberately reads from the same real data the admin pages use
 * (fetchBookings, not fetchBoatPlannerBench) so a VITE_SEED_BOOKINGS=1 dev
 * environment never leaks sample athletes into an exported snapshot.
 */
import { getApplications, type Application } from './users';
import { fetchBookings, attendingLabel, type Booking } from './bookings';
import { fetchTrainingEvents } from './trainingEvents';
import { type TrainingEvent } from '../components/TrainingCard';
import { loadPlan, CREW_PRESETS, type Boat } from './boatPlans';

const ROWS = 10;

const esc = (s: string): string =>
  s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]!));

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

/* ------------------------------ Applications ------------------------------ */

const applicationRow = (app: Application, showReason: boolean) => `
  <tr>
    <td>${esc(app.name)}</td>
    <td>${esc(app.mobile)}</td>
    <td>${esc(app.email)}</td>
    <td>${fmtDate(app.createdAt)}</td>
    <td>${
      app.status === 'approved'
        ? app.tokenUsedAt
          ? 'Registered'
          : app.tokenExpiresAt && new Date(app.tokenExpiresAt).getTime() > Date.now()
            ? `Awaiting registration (link expires ${fmtDate(app.tokenExpiresAt)})`
            : 'Link expired'
        : app.status === 'rejected'
          ? 'Rejected'
          : 'Pending'
    }</td>
    ${showReason ? `<td>${esc(app.rejectionReason ?? '')}</td>` : ''}
  </tr>`;

const buildApplicationsSection = (applications: Application[]): string => {
  const pending = applications.filter((a) => a.status === 'pending');
  const approved = applications.filter((a) => a.status === 'approved');
  const rejected = applications.filter((a) => a.status === 'rejected');

  const table = (rows: Application[], showReason: boolean) =>
    rows.length === 0
      ? `<p class="empty">None.</p>`
      : `<table>
          <thead><tr><th>Name</th><th>Mobile</th><th>Email</th><th>Applied</th><th>Status</th>${showReason ? '<th>Reason</th>' : ''}</tr></thead>
          <tbody>${rows.map((a) => applicationRow(a, showReason)).join('')}</tbody>
        </table>`;

  return `
    <section class="block">
      <h2>User Registrations</h2>
      <p class="summary">${pending.length} pending · ${approved.length} approved · ${rejected.length} rejected</p>

      <h3>Pending (${pending.length})</h3>
      ${table(pending, false)}

      <h3>Approved (${approved.length})</h3>
      ${table(approved, false)}

      <h3>Rejected (${rejected.length})</h3>
      ${table(rejected, true)}
    </section>`;
};

/* -------------------------------- Sign-ups -------------------------------- */

const bookingMeta = (b: Booking) =>
  [
    b.gender,
    b.side,
    b.weight !== undefined ? `${b.weight} kg` : null,
    ...(b.needPFD === 'Yes' ? ['PFD'] : []),
    ...(b.needPaddle === 'Yes' ? ['Paddle'] : []),
  ]
    .filter(Boolean)
    .join(' · ');

const buildSignupsSection = (bookings: Booking[], events: TrainingEvent[]): string => {
  const pending = bookings.filter((b) => b.status === 'waiting');
  const confirmed = bookings.filter((b) => b.status === 'confirmed');

  const byEvent = (list: Booking[]) =>
    events
      .map((ev) => ({ event: ev, rows: list.filter((b) => b.eventId === ev.id) }))
      .filter((g) => g.rows.length > 0);

  const eventGroup = (event: TrainingEvent, rows: Booking[]) => `
    <h4>${esc(event.title)}</h4>
    <table>
      <thead><tr><th>Name</th><th>Attending</th><th>Details</th></tr></thead>
      <tbody>
        ${rows
          .map(
            (b) => `<tr>
              <td>${esc(b.name)}</td>
              <td>${esc(attendingLabel(b.attending, event))}</td>
              <td>${esc(bookingMeta(b))}</td>
            </tr>`,
          )
          .join('')}
      </tbody>
    </table>`;

  const section = (title: string, list: Booking[]) => {
    const groups = byEvent(list);
    return `
      <h3>${title} (${list.length})</h3>
      ${groups.length === 0 ? '<p class="empty">None.</p>' : groups.map((g) => eventGroup(g.event, g.rows)).join('')}`;
  };

  return `
    <section class="block">
      <h2>Training Sign-ups</h2>
      <p class="summary">${pending.length} waitlisted · ${confirmed.length} confirmed</p>
      ${section('Waitlist', pending)}
      ${section('Confirmed', confirmed)}
    </section>`;
};

/* ---------------------------- Boat assignments ---------------------------- */

type PlanEntry = { event: TrainingEvent; day: TrainingEvent['days'][number]; boats: Boat[] };

const boatTable = (boat: Boat, bench: string[]): string => {
  const presetLabel = CREW_PRESETS.find((p) => p.id === (boat.preset ?? 'open'))?.label ?? 'Open';
  const cell = (name?: string) => (name ? `<td class="seat">${esc(name)}</td>` : `<td class="seat empty">—</td>`);
  const rows = Array.from({ length: ROWS }, (_, i) => {
    const n = i + 1;
    return `<tr><td class="num">${n}</td>${cell(boat.seats[`${n}L`])}${cell(boat.seats[`${n}R`])}</tr>`;
  }).join('');

  return `
    <h4>${esc(boat.name === presetLabel ? presetLabel : `${boat.name} · ${presetLabel}`)}</h4>
    <table class="boat">
      <tr><td class="full" colspan="3">Drummer — ${esc(boat.seats['DRUMMER'] ?? '—')}</td></tr>
      <tr><th>#</th><th>Left</th><th>Right</th></tr>
      ${rows}
      <tr><td class="full" colspan="3">Steers — ${esc(boat.seats['STEERS'] ?? '—')}</td></tr>
    </table>
    ${bench.length ? `<p class="bench"><strong>Not seated in this boat:</strong> ${esc(bench.join(', '))}</p>` : ''}`;
};

const buildBoatsSection = (entries: PlanEntry[]): string => {
  if (entries.length === 0) {
    return `<section class="block"><h2>Boat Assignments</h2><p class="empty">No boat lineups saved yet.</p></section>`;
  }
  const body = entries
    .map(({ event, day, boats }) => {
      const seatedAnywhere = new Set(boats.flatMap((b) => Object.values(b.seats)));
      return `
        <h3>${esc(event.title)} — ${esc(day.label)}</h3>
        <div class="boat-grid">
          ${boats
            .map((boat) => {
              const seatedHere = new Set(Object.values(boat.seats));
              const restBench = [...seatedAnywhere].filter((n) => !seatedHere.has(n));
              return `<div class="boat-card">${boatTable(boat, restBench)}</div>`;
            })
            .join('')}
        </div>`;
    })
    .join('');

  return `<section class="block"><h2>Boat Assignments</h2>${body}</section>`;
};

/* ---------------------------------- Page ---------------------------------- */

const STYLE = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #111; margin: 0; padding: 32px 40px 64px; background: #fff; }
  h1 { font-size: 24px; letter-spacing: 0.03em; margin: 0 0 4px; }
  .generated { color: #666; font-size: 13px; margin: 0 0 32px; }
  h2 { font-size: 19px; margin: 0 0 6px; padding-top: 18px; border-top: 2px solid #111; }
  section.block:first-of-type h2 { border-top: none; padding-top: 0; }
  h3 { font-size: 15px; margin: 18px 0 8px; }
  h4 { font-size: 13px; margin: 14px 0 6px; color: #334155; }
  .summary { color: #555; font-size: 13px; margin: 0 0 8px; }
  .empty { color: #94a3b8; font-size: 13px; font-style: italic; margin: 0 0 8px; }
  table { border-collapse: collapse; width: 100%; max-width: 720px; margin-bottom: 10px; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 9px; font-size: 12.5px; text-align: left; }
  th { background: #f1f5f9; font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; color: #475569; }
  table.boat { max-width: 320px; }
  table.boat td, table.boat th { text-align: center; }
  table.boat .num { width: 28px; color: #94a3b8; font-weight: 700; }
  table.boat .seat { text-align: left; }
  table.boat .seat.empty { color: #cbd5e1; }
  table.boat .full { background: #ecfdf5; font-weight: 700; text-align: left; }
  .bench { font-size: 12px; color: #334155; max-width: 320px; margin: 0 0 14px; }
  .boat-grid { display: flex; flex-wrap: wrap; gap: 24px; }
  .boat-card { break-inside: avoid; }
  section.block { break-inside: avoid-page; }
  @media print { @page { margin: 16mm; } }
`;

/** Assemble the full snapshot as a self-contained HTML string. */
export const buildAdminExportHtml = async (): Promise<string> => {
  const [applications, bookings, events] = await Promise.all([
    getApplications().catch(() => [] as Application[]),
    fetchBookings().catch(() => [] as Booking[]),
    fetchTrainingEvents().catch(() => [] as TrainingEvent[]),
  ]);

  const lakeEvents = events.filter((ev) => (ev.venue ?? 'lake') === 'lake');
  const planEntries: PlanEntry[] = [];
  for (const event of lakeEvents) {
    for (const day of event.days) {
      const boats = await loadPlan(event.id, day.key);
      if (boats.some((b) => Object.keys(b.seats).length > 0)) {
        planEntries.push({ event, day, boats });
      }
    }
  }

  const generatedAt = new Date().toLocaleString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  return `<!doctype html><html><head><meta charset="utf-8">
<title>Alpas Pinas — Admin Export</title>
<style>${STYLE}</style>
</head><body>
  <h1>ALPAS PINAS — ADMIN EXPORT</h1>
  <p class="generated">Generated ${esc(generatedAt)}</p>
  ${buildApplicationsSection(applications)}
  ${buildSignupsSection(bookings, events)}
  ${buildBoatsSection(planEntries)}
</body></html>`;
};

/** Build the snapshot and trigger a browser download of the .html file. */
export const downloadAdminExport = async (): Promise<void> => {
  const html = await buildAdminExportHtml();
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `alpas-admin-export-${stamp}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
