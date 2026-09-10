import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Copy, Trash2, ChevronDown, MapPin, Trophy } from 'lucide-react';
import { type ColorPalette } from '../../styles/colors';
import { type ShowToast } from '../Admin';
import { useIsMobile } from '../../hooks/useIsMobile';
import {
  fetchTrainingEvents,
  createTrainingEvent,
  updateTrainingEvent,
  deleteTrainingEvent,
} from '../../utils/trainingEvents';
import {
  fetchRaceEvents,
  createRaceEvent,
  updateRaceEvent,
  deleteRaceEvent,
} from '../../utils/raceEvents';
import { type RaceEvent } from '../../components/EventCard';
import { type TrainingEvent, type TrainingDay } from '../../components/TrainingCard';
import { getAllBookings, cancelBooking, attendingLabel, formatShortDate, isUpcomingDate, type Booking } from '../../utils/bookings';
import { AdminSignups } from './AdminSignups';

type Props = { showToast: ShowToast; c: ColorPalette; theme: 'dark' | 'light' };

/* ------------------------------------------------------------------ */

// Shared keyframes/transition classes for both admin calendar pages.
const sharedStyles = (c: ColorPalette) => `
  .admin-focus:focus-visible { outline: 2px solid ${c.primary}; outline-offset: 2px; }
  @keyframes adm-ev-reveal { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  .anim-reveal { animation: adm-ev-reveal 280ms cubic-bezier(0.25, 1, 0.5, 1); }
  .anim-collapse { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 300ms cubic-bezier(0.25, 1, 0.5, 1); }
  .anim-collapse.is-open { grid-template-rows: 1fr; }
  .anim-collapse > div { overflow: hidden; min-height: 0; }
  .anim-chevron { transition: transform 250ms cubic-bezier(0.25, 1, 0.5, 1); }
  .anim-chevron.is-open { transform: rotate(180deg); }
  @media (prefers-reduced-motion: reduce) {
    .anim-reveal { animation: none; }
    .anim-collapse, .anim-chevron { transition: none; }
  }
`;

export const AdminTraining: React.FC<Props> = ({ c, showToast, theme }) => {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<'schedule' | 'signups'>('schedule');
  const activeBg = theme === 'dark' ? c.accent : c.primary;
  return (
    <div style={{ padding: isMobile ? '1.25rem 1rem 3rem' : '2rem 1.5rem 4rem' }}>
      <style>{sharedStyles(c)}</style>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: c.text, margin: '0 0 0.4rem', letterSpacing: '0.02em', lineHeight: 1 }}>
        TRAINING
      </h1>
      <p style={{ color: c.textSecondary, fontSize: '0.9rem', margin: '0 0 1.25rem' }}>
        Add a session here and paddlers book their own seat on the site — Duplicate copies a past week instead of retyping it.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', margin: `0 0 ${isMobile ? '1.25rem' : '1.5rem'}` }}>
        {([['schedule', 'Schedule'], ['signups', 'Sign-ups']] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className="admin-focus"
            style={{
              padding: '0.5rem 1.1rem',
              borderRadius: '999px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: `1px solid ${tab === id ? activeBg : c.border}`,
              background: tab === id ? activeBg : 'transparent',
              color: tab === id ? '#fff' : c.text,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'schedule'
        ? <TrainingTab c={c} showToast={showToast} isMobile={isMobile} />
        : <AdminSignups c={c} showToast={showToast} theme={theme} embedded />}
    </div>
  );
};

export const AdminEvents: React.FC<Props> = ({ c, showToast, theme }) => {
  const isMobile = useIsMobile();
  return (
    <div style={{ padding: isMobile ? '1.25rem 1rem 3rem' : '2rem 1.5rem 4rem' }}>
      <style>{sharedStyles(c)}</style>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: c.text, margin: '0 0 0.4rem', letterSpacing: '0.02em', lineHeight: 1 }}>
        EVENT RECORDS
      </h1>
      <p style={{ color: c.textSecondary, fontSize: '0.9rem', margin: `0 0 ${isMobile ? '1.25rem' : '1.5rem'}` }}>
        Add a race before it happens; check "Add race result" once it's run to record how the crew placed.
      </p>

      <RaceTab c={c} showToast={showToast} isMobile={isMobile} theme={theme} />
    </div>
  );
};

/* ================================================================== */
/*  Training tab                                                        */
/* ================================================================== */

/** A brand-new day's key/label always derive from its date (see `deriveDay`),
 * so a blank one just needs venue-appropriate time/location/capacity defaults. */
const blankDay = (venue: 'land' | 'lake' = 'lake'): TrainingDay => (
  venue === 'land'
    ? { key: '', label: '', date: '', time: '19:00', location: 'Subang PARC', capacity: 16 }
    : { key: '', label: '', date: '', time: '07:30', location: '', capacity: 22 }
);

const addDays = (iso: string, days: number): string => {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/** Lake/land sessions repeat weekly with the same fields — duplicating one and
 * bumping every day a week forward covers the common case with one click;
 * the form still opens so the admin can tweak (e.g. a dated weekend title). */
const duplicateTraining = (ev: TrainingEvent): TrainingEvent => ({
  ...ev,
  id: `training-${Date.now()}`,
  days: ev.days.map((d) => ({ ...d, date: d.date ? addDays(d.date, 7) : d.date })),
});

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DOW = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 } as const;

/** Next date landing on the given day-of-week (today counts). */
const nextDow = (target: number, from = new Date()): string => {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() + ((target - d.getDay() + 7) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** A day's key/label are never typed by hand — they always derive from its
 * date, so "Saturday" and "sat" can't drift out of sync with the calendar. */
const deriveDay = (date: string): { key: string; label: string } => {
  if (!date) return { key: '', label: '' };
  const label = WEEKDAYS[new Date(`${date}T00:00:00`).getDay()];
  return { key: label.slice(0, 3).toLowerCase(), label };
};

const formatMonthDay = (d: string): string => {
  const dt = new Date(`${d}T00:00:00`);
  return `${dt.toLocaleString('en-US', { month: 'long' })} ${dt.getDate()}`;
};

const monthDayRange = (d1: string, d2: string): string => {
  const a = new Date(`${d1}T00:00:00`);
  const b = new Date(`${d2}T00:00:00`);
  const am = a.toLocaleString('en-US', { month: 'long' });
  const bm = b.toLocaleString('en-US', { month: 'long' });
  return am === bm ? `${am} ${a.getDate()}-${b.getDate()}` : `${am} ${a.getDate()} – ${bm} ${b.getDate()}`;
};

/** Title is never typed by hand — always derived from venue + day dates, kept
 * in sync live as the admin edits either. Training tab is recurring lake/land
 * sessions only; one-off custom-named events belong in the Race/Events tab. */
const computeTitle = (ev: Pick<TrainingEvent, 'venue' | 'days'>): string => {
  const dates = ev.days.map((d) => d.date).filter(Boolean).sort();
  if ((ev.venue ?? 'lake') === 'land') {
    const label = ev.days[0]?.label;
    return label ? `Land Conditioning — ${label}` : 'Land Conditioning';
  }
  if (dates.length === 0) return 'New Lake Training';
  if (dates.length === 1) return `${formatMonthDay(dates[0])} Lake Training`;
  return `${monthDayRange(dates[0], dates[dates.length - 1])} Lake Training`;
};

/** Most recent day matching `match` among existing events of `venue` — the
 * template (time/location/capacity) a freshly-created recurring session copies. */
const latestMatchingDay = (events: TrainingEvent[], venue: 'land' | 'lake', match: (d: TrainingDay) => boolean): TrainingDay | undefined =>
  events
    .filter((e) => (e.venue ?? 'lake') === venue)
    .flatMap((e) => e.days.filter(match))
    .sort((a, b) => a.date.localeCompare(b.date))
    .pop();

/** One week after `lastDate` (same weekday) — rolled forward again if that
 * landed in the past, e.g. nobody created a session for a couple of weeks.
 * With no `lastDate`, falls back to the next real occurrence of `targetDow`. */
const nextRecurrence = (lastDate: string | undefined, targetDow: number): string => {
  let candidate = lastDate ? addDays(lastDate, 7) : nextDow(targetDow);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  while (new Date(`${candidate}T00:00:00`) < today) candidate = addDays(candidate, 7);
  return candidate;
};

/** Quick-create: lake weekend (Sat + Sun), one week after the last one — or
 * the next real Sat/Sun if there's no history yet. Location/time/capacity and
 * the title/description are all pre-filled; the form still opens to tweak. */
const presetLakeWeekend = (events: TrainingEvent[]): TrainingEvent => {
  const sat = latestMatchingDay(events, 'lake', (d) => d.key === 'sat');
  const sun = latestMatchingDay(events, 'lake', (d) => d.key === 'sun');
  // Sunday is always the day after Saturday (never rolled independently —
  // that could desync the pair, e.g. Sunday landing before Saturday).
  const satDate = nextRecurrence(sat?.date, DOW.sat);
  const sunDate = addDays(satDate, 1);
  const loc1 = sat?.location || 'Marina Putrajaya';
  const loc2 = sun?.location || 'Subang PARC';
  const days = [
    { ...deriveDay(satDate), date: satDate, time: sat?.time || '07:30', location: loc1, capacity: sat?.capacity ?? 22 },
    { ...deriveDay(sunDate), date: sunDate, time: sun?.time || '07:30', location: loc2, capacity: sun?.capacity ?? 22 },
  ];
  return {
    id: `training-${Date.now()}`,
    title: computeTitle({ venue: 'lake', days }),
    description: loc1 === loc2
      ? `Two-day lake training at ${loc1}. Open to all paddlers — sign up for one day or both.`
      : `Two-day lake training. Saturday at ${loc1}, Sunday at ${loc2}. Open to all paddlers — sign up for one day or both.`,
    thumbnail: '',
    venue: 'lake',
    days,
  };
};

const LAND_DESCRIPTION = 'Strength circuit, paddle ergs, and core work to build the engine off the water. All levels, drop-ins welcome.';

/** Quick-create: land session, defaults to Tuesday, one week after the last
 * Tuesday session — or the next real Tuesday if there's no history yet. */
const presetLandSession = (events: TrainingEvent[]): TrainingEvent => {
  const tue = latestMatchingDay(events, 'land', (d) => d.label === 'Tuesday');
  const date = nextRecurrence(tue?.date, DOW.tue);
  const days = [{ ...deriveDay(date), date, time: tue?.time || '19:00', location: tue?.location || 'Subang PARC', capacity: tue?.capacity ?? 16 }];
  return {
    id: `training-${Date.now()}`,
    title: computeTitle({ venue: 'land', days }),
    description: LAND_DESCRIPTION,
    thumbnail: '',
    venue: 'land',
    days,
  };
};

/** All of an event's days are in the past. */
const isPastEvent = (ev: TrainingEvent) => !ev.days.some((d) => isUpcomingDate(d.date));
const earliestDay = (ev: TrainingEvent) => ev.days.reduce((min, d) => (d.date < min ? d.date : min), ev.days[0]?.date ?? '');
const latestDay = (ev: TrainingEvent) => ev.days.reduce((max, d) => (d.date > max ? d.date : max), ev.days[0]?.date ?? '');

export const TrainingTab: React.FC<{ c: ColorPalette; showToast: ShowToast; isMobile: boolean }> = ({ c, showToast, isMobile }) => {
  const [events, setEvents] = useState<TrainingEvent[]>([]);
  const [editing, setEditing] = useState<TrainingEvent | null>(null);
  const [isNew, setIsNew] = useState(false);
  // Days already persisted (present when editing opened) keep their original
  // key/label frozen — only days added/created fresh this session auto-derive
  // from their date. See TrainingForm's setDay.
  const [existingDayCount, setExistingDayCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  const reload = () => fetchTrainingEvents().then(setEvents);

  useEffect(() => { reload(); }, []);

  const openPreset = (ev: TrainingEvent) => {
    setEditing(ev);
    setIsNew(true);
    setExistingDayCount(0);
  };

  const openEdit = (ev: TrainingEvent) => {
    setEditing(JSON.parse(JSON.stringify(ev)));
    setIsNew(false);
    setExistingDayCount(ev.days.length);
  };

  const openDuplicate = (ev: TrainingEvent) => {
    setEditing(duplicateTraining(ev));
    setIsNew(true);
    setExistingDayCount(0);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) { showToast('Title is required.', 'error'); return; }
    if (editing.days.some((d) => !d.date)) { showToast('All days need a date.', 'error'); return; }
    setSaving(true);
    try {
      if (isNew) await createTrainingEvent(editing);
      else await updateTrainingEvent(editing.id, editing);
      await reload();
      setEditing(null);
      showToast(isNew ? 'Event created.' : 'Event updated.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save the session.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteTrainingEvent(id);
      await reload();
      showToast('Event deleted.', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete the session.', 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

  const allBookings = getAllBookings();
  const upcoming = events.filter((ev) => !isPastEvent(ev)).sort((a, b) => earliestDay(a).localeCompare(earliestDay(b)));
  const past = events.filter(isPastEvent).sort((a, b) => latestDay(b).localeCompare(latestDay(a)));

  const rowProps = (ev: TrainingEvent) => ({
    ev,
    regs: allBookings.filter((b) => b.eventId === ev.id),
    c,
    showToast,
    isMobile,
    isExpanded: expanded === ev.id,
    onToggleExpand: () => setExpanded(expanded === ev.id ? null : ev.id),
    onEdit: () => openEdit(ev),
    onDuplicate: () => openDuplicate(ev),
    confirming: confirmDelete === ev.id,
    onAskDelete: () => setConfirmDelete(ev.id),
    onCancelDelete: () => setConfirmDelete(null),
    onConfirmDelete: () => remove(ev.id),
  });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button type="button" onClick={() => openPreset(presetLandSession(events))} className="admin-focus" style={addBtnOutline(c)}>
          <Plus size={16} /> Add Land Session
        </button>
        <button type="button" onClick={() => openPreset(presetLakeWeekend(events))} className="admin-focus" style={addBtn(c)}>
          <Plus size={16} /> Add Lake Weekend
        </button>
      </div>

      {/* Form */}
      {editing && (
        <TrainingForm ev={editing} setEv={setEditing} c={c} onSave={save} onCancel={() => setEditing(null)} isNew={isNew} existingDayCount={existingDayCount} saving={saving} />
      )}

      {/* List */}
      {events.length === 0 && !editing && (
        <EmptyMsg c={c} msg="No training sessions. Add one above." />
      )}
      {events.length > 0 && upcoming.length === 0 && !editing && (
        <EmptyMsg c={c} msg="No upcoming sessions. Add one above, or check past sessions below." />
      )}

      {upcoming.map((ev) => <TrainingRow key={ev.id} {...rowProps(ev)} />)}

      {past.length > 0 && (
        <div style={{ marginTop: upcoming.length > 0 ? '1.5rem' : 0 }}>
          <button
            type="button"
            onClick={() => setShowPast((s) => !s)}
            className="admin-focus"
            style={{ ...ghostBtn(c), width: '100%', justifyContent: 'center' }}
          >
            <ChevronDown size={14} className={`anim-chevron${showPast ? ' is-open' : ''}`} />
            {showPast ? 'Hide' : 'Show'} past sessions ({past.length})
          </button>
          <div className={`anim-collapse${showPast ? ' is-open' : ''}`}>
            <div style={{ marginTop: '0.75rem' }}>
              {past.map((ev) => <TrainingRow key={ev.id} {...rowProps(ev)} />)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const TrainingRow: React.FC<{
  ev: TrainingEvent;
  regs: Booking[];
  c: ColorPalette;
  showToast: ShowToast;
  isMobile: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  confirming: boolean;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}> = ({ ev, regs, c, showToast, isMobile, isExpanded, onToggleExpand, onEdit, onDuplicate, confirming, onAskDelete, onCancelDelete, onConfirmDelete }) => {
  const deleteLabel = regs.length > 0
    ? `Delete ${ev.title} — also removes ${regs.length} sign-up${regs.length !== 1 ? 's' : ''}`
    : `Delete ${ev.title}`;

  return (
    <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: '0.85rem', marginBottom: '0.75rem', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: c.text }}>{ev.title}</div>
          <div style={{ fontSize: '0.75rem', color: c.textSecondary, marginTop: '0.2rem' }}>
            {ev.days.map((d) => `${d.label} ${formatShortDate(d.date)}`).join(' · ')} · {regs.length} sign-up{regs.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
          <IconBtn icon={<Pencil size={14} />} onClick={onEdit} c={c} label={`Edit ${ev.title}`} />
          <IconBtn icon={<Copy size={14} />} onClick={onDuplicate} c={c} label={`Duplicate ${ev.title}`} />
          {confirming ? (
            <>
              <ConfirmBtn label="Delete?" onClick={onConfirmDelete} />
              <IconBtn icon="✕" onClick={onCancelDelete} c={c} label="Cancel delete" />
            </>
          ) : (
            <IconBtn icon={<Trash2 size={14} />} onClick={onAskDelete} c={c} danger label={deleteLabel} />
          )}
          <IconBtn icon={<ChevronDown size={14} className={`anim-chevron${isExpanded ? ' is-open' : ''}`} />} onClick={onToggleExpand} c={c} label={isExpanded ? 'Collapse' : 'Show registrations'} />
        </div>
      </div>

      {/* Expanded registrations */}
      <div className={`anim-collapse${isExpanded ? ' is-open' : ''}`}>
        <div>
          <div style={{ borderTop: `1px solid ${c.border}`, padding: '0.75rem 1rem' }}>
            <RegList regs={regs} event={ev} c={c} showToast={showToast} isMobile={isMobile} />
          </div>
        </div>
      </div>
    </div>
  );
};

const TrainingForm: React.FC<{
  ev: TrainingEvent;
  setEv: (ev: TrainingEvent) => void;
  c: ColorPalette;
  onSave: () => void;
  onCancel: () => void;
  isNew: boolean;
  /** Days at index < this were already persisted when the form opened — their
   * key/label are frozen (existing sign-ups reference them). Days at or past
   * this index are new this session and auto-derive key/label from date. */
  existingDayCount: number;
  saving: boolean;
}> = ({ ev, setEv, c, onSave, onCancel, isNew, existingDayCount, saving }) => {
  // Title always derives from venue + day dates — recomputed on every change
  // so it can never drift from what's actually on the form.
  const set = (patch: Partial<TrainingEvent>) => {
    const merged = { ...ev, ...patch };
    setEv({ ...merged, title: computeTitle(merged) });
  };
  const setDay = (idx: number, patch: Partial<TrainingDay>) =>
    set({
      days: ev.days.map((d, i) => {
        if (i !== idx) return d;
        const merged = { ...d, ...patch };
        // Only a brand-new day's key/label follow the date; an existing
        // day's are frozen so its sign-ups don't detach from capacity counts.
        return patch.date !== undefined && i >= existingDayCount
          ? { ...merged, ...deriveDay(merged.date) }
          : merged;
      }),
    });

  // Venue is decided by which quick-create button opened this form (Land
  // Session vs Lake Weekend) — day count/defaults/title all follow from it,
  // so it isn't editable here. Wrong button? Cancel and click the right one.
  const venueLabel = (ev.venue ?? 'lake') === 'land' ? 'Land' : 'Lake';

  return (
    <div className="anim-reveal" style={{ backgroundColor: c.surfaceAlt, border: `1px solid ${c.border}`, borderRadius: '0.85rem', padding: '1.25rem', marginBottom: '1rem' }}>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: c.text, marginBottom: '1rem' }}>
        {isNew ? `New ${venueLabel} Session` : `Edit ${venueLabel} Session`}
      </div>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <div>
          <label style={labelStyle(c)}>Title (auto)</label>
          <div style={{ ...inputStyle(c), color: c.textSecondary, backgroundColor: c.surface }}>{ev.title}</div>
        </div>
        <Field label="Description" value={ev.description} onChange={(v) => set({ description: v })} c={c} multiline hint="Shown on the training card — what to bring, what to expect." />
        <Field label="Thumbnail URL" value={ev.thumbnail ?? ''} onChange={(v) => set({ thumbnail: v })} c={c} placeholder="/marina-putrajaya.jpg" hint="Blank shows a plain color card instead of a photo." />

        {ev.days.map((d, i) => (
          <div key={i} className="anim-reveal" style={{ padding: '0.85rem', backgroundColor: c.surface, borderRadius: '0.6rem', border: `1px solid ${c.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.82rem', color: c.text }}>
                Day {i + 1}{d.label ? ` · ${d.label}` : ''}
              </span>
              {ev.days.length > 1 && (
                <button type="button" onClick={() => set({ days: ev.days.filter((_, j) => j !== i) })} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem' }}>
                  Remove
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
              <Field label="Date" value={d.date} onChange={(v) => setDay(i, { date: v })} c={c} type="date" />
              <Field label="Time" value={d.time} onChange={(v) => setDay(i, { time: v })} c={c} type="time" />
              <Field label="Location" value={d.location} onChange={(v) => setDay(i, { location: v })} c={c} placeholder="Subang PARC" hint="Where paddlers show up — shown on their booking." />
              <Field label="Capacity" value={String(d.capacity)} onChange={(v) => setDay(i, { capacity: Number(v) || 22 })} c={c} type="number" hint="Sign-ups beyond this go to the waitlist." />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => set({ days: [...ev.days, blankDay(ev.venue)] })}
          style={{ ...ghostBtn(c), alignSelf: 'flex-start' }}
        >
          <Plus size={13} /> Add day
        </button>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button type="button" onClick={onSave} disabled={saving} style={{ ...primaryBtn(c), opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} style={{ ...ghostBtn(c), opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  Race tab                                                            */
/* ================================================================== */

const blankRace = (): RaceEvent => ({
  id: `race-${Date.now()}`,
  name: '',
  location: '',
  date: '',
  type: 'Regatta',
  description: '',
  thumbnail: '',
  result: null,
});

export const RaceTab: React.FC<{ c: ColorPalette; showToast: ShowToast; isMobile: boolean; theme: 'dark' | 'light' }> = ({ c, showToast, isMobile, theme }) => {
  const [events, setEvents] = useState<RaceEvent[]>([]);
  const [editing, setEditing] = useState<RaceEvent | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const reload = () => fetchRaceEvents().then(setEvents);

  useEffect(() => { reload(); }, []);

  const openNew = () => { setEditing(blankRace()); setIsNew(true); };
  const openEdit = (ev: RaceEvent) => { setEditing(JSON.parse(JSON.stringify(ev))); setIsNew(false); };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) { showToast('Name is required.', 'error'); return; }
    if (!editing.date) { showToast('Date is required.', 'error'); return; }
    setSaving(true);
    try {
      if (isNew) await createRaceEvent(editing);
      else await updateRaceEvent(editing.id, editing);
      await reload();
      setEditing(null);
      showToast(isNew ? 'Race event created.' : 'Race event updated.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save the race event.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteRaceEvent(id);
      await reload();
      showToast('Event deleted.', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete the race event.', 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button type="button" onClick={openNew} className="admin-focus" style={addBtn(c)}>
          <Plus size={14} /> New Race Event
        </button>
      </div>

      {editing && (
        <RaceForm ev={editing} setEv={setEditing} c={c} onSave={save} onCancel={() => setEditing(null)} isNew={isNew} saving={saving} />
      )}

      {events.length === 0 && !editing && <EmptyMsg c={c} msg="No race events yet." />}

      {events.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 240 : 290}px, 1fr))`, gap: isMobile ? '0.85rem' : '1.1rem' }}>
          {sortRaces(events).map((ev) => (
            <RaceCard
              key={ev.id}
              ev={ev}
              c={c}
              theme={theme}
              isMobile={isMobile}
              confirming={confirmDelete === ev.id}
              onEdit={() => openEdit(ev)}
              onAskDelete={() => setConfirmDelete(ev.id)}
              onCancelDelete={() => setConfirmDelete(null)}
              onConfirmDelete={() => remove(ev.id)}
            />
          ))}
        </div>
      )}
    </>
  );
};

/* ------------------------- race card + helpers -------------------------- */

// Upcoming (soonest first), then past (most recent first) — matches how an
// admin scans a calendar: what's next, then history.
const sortRaces = (events: RaceEvent[]): RaceEvent[] => {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = events.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date));
  return [...upcoming, ...past];
};

const dateChip = (iso: string): { mon: string; day: string } => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { mon: '—', day: '—' };
  return { mon: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(), day: String(d.getDate()) };
};

// Podium (rank 1–3) gets a warm medal accent; other finishes (or a stage-only
// result with no rank, e.g. "Semi-Final") stay neutral.
const medalColor = (rank?: number): string =>
  rank === 1 ? '#d4a017' : rank === 2 ? '#9ca3af' : rank === 3 ? '#c2703d' : '';

const RaceCard: React.FC<{
  ev: RaceEvent;
  c: ColorPalette;
  theme: 'dark' | 'light';
  isMobile: boolean;
  confirming: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}> = ({ ev, c, theme, isMobile, confirming, onEdit, onAskDelete, onCancelDelete, onConfirmDelete }) => {
  const { mon, day } = dateChip(ev.date);
  const upcoming = ev.date >= new Date().toISOString().slice(0, 10);
  const btn = isMobile ? 40 : 32;

  return (
    <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: '1rem', padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* date chip + type pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ width: 52, height: 52, borderRadius: '0.7rem', background: theme === 'dark' ? c.primary : `${c.primary}1f`, color: theme === 'dark' ? '#fff' : c.primary, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.1, flexShrink: 0 }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em' }}>{mon}</span>
          <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>{day}</span>
        </div>
        <span style={{ display: 'inline-flex', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: c.hover, color: c.text, whiteSpace: 'nowrap' }}>
          {ev.type}
        </span>
      </div>

      {/* title + location */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '1rem', color: c.text, lineHeight: 1.25 }}>{ev.name}</div>
        {ev.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: c.textSecondary, marginTop: '0.3rem' }}>
            <MapPin size={13} strokeWidth={1.8} aria-hidden style={{ flexShrink: 0 }} /> {ev.location}
          </div>
        )}
      </div>

      {/* footer: result (or upcoming) + edit/delete */}
      <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: '0.8rem', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
        <div style={{ minWidth: 0, fontSize: '0.8rem' }}>
          {ev.result ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: medalColor(ev.result.rank) || c.textSecondary, fontWeight: 600 }}>
              <Trophy size={13} strokeWidth={1.9} aria-hidden style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ev.result.rank ? `#${ev.result.rank}` : ev.result.stage} · {ev.result.category}
              </span>
            </span>
          ) : (
            <span style={{ color: c.textSecondary }}>{upcoming ? 'Upcoming' : 'No result recorded'}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
          {confirming ? (
            <>
              <ConfirmBtn label="Delete?" onClick={onConfirmDelete} />
              <IconBtn icon="✕" onClick={onCancelDelete} c={c} size={btn} label="Cancel delete" />
            </>
          ) : (
            <>
              <IconBtn icon={<Pencil size={14} />} onClick={onEdit} c={c} size={btn} label={`Edit ${ev.name}`} />
              <IconBtn icon={<Trash2 size={14} />} onClick={onAskDelete} c={c} size={btn} danger label={`Delete ${ev.name}`} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const RaceForm: React.FC<{
  ev: RaceEvent;
  setEv: (ev: RaceEvent) => void;
  c: ColorPalette;
  onSave: () => void;
  onCancel: () => void;
  isNew: boolean;
  saving: boolean;
}> = ({ ev, setEv, c, onSave, onCancel, isNew, saving }) => {
  const set = (patch: Partial<RaceEvent>) => setEv({ ...ev, ...patch });
  const hasResult = !!ev.result;

  return (
    <div className="anim-reveal" style={{ backgroundColor: c.surfaceAlt, border: `1px solid ${c.border}`, borderRadius: '0.85rem', padding: '1.25rem', marginBottom: '1rem' }}>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: c.text, marginBottom: '1rem' }}>
        {isNew ? 'New Race Event' : 'Edit Race Event'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.65rem' }}>
        <Field label="Name" value={ev.name} onChange={(v) => set({ name: v })} c={c} />
        <Field label="Location" value={ev.location} onChange={(v) => set({ location: v })} c={c} placeholder="Putrajaya, Malaysia" />
        <Field label="Date" value={ev.date} onChange={(v) => set({ date: v })} c={c} type="date" hint="Add it before race day; fill in Result after." />
        <div>
          <label style={labelStyle(c)}>Type</label>
          <select value={ev.type} onChange={(e) => set({ type: e.target.value })} style={inputStyle(c)}>
            {['Regatta', 'Festival', 'Training Camp', 'Friendly'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <Field label="Thumbnail URL" value={ev.thumbnail ?? ''} onChange={(v) => set({ thumbnail: v })} c={c} hint="Blank shows a plain color card instead of a photo." />
      </div>
      <div style={{ marginTop: '0.65rem' }}>
        <Field label="Description" value={ev.description} onChange={(v) => set({ description: v })} c={c} multiline hint="Shown when a visitor expands this race's card." />
      </div>

      {/* Result toggle */}
      <div style={{ marginTop: '0.85rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: c.text }}>
          <input
            type="checkbox"
            checked={hasResult}
            onChange={(e) => set({ result: e.target.checked ? { category: '' } : null })}
          />
          Add race result
        </label>
        {hasResult && ev.result && (
          <>
            <p style={{ fontSize: '0.75rem', color: c.textSecondary, margin: '0.5rem 0 0' }}>
              Fill in Rank if the crew placed, or Stage instead if they didn't reach the final (e.g. eliminated in a heat) — not both.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem', marginTop: '0.65rem', padding: '0.85rem', backgroundColor: c.surface, borderRadius: '0.6rem', border: `1px solid ${c.border}` }}>
              <Field label="Rank" value={ev.result.rank != null ? String(ev.result.rank) : ''} onChange={(v) => set({ result: { ...ev.result!, rank: v === '' ? undefined : Number(v) } })} c={c} type="number" placeholder="1" hint="Final placing, e.g. 1 for gold." />
              <Field label="Stage (if no rank)" value={ev.result.stage ?? ''} onChange={(v) => set({ result: { ...ev.result!, stage: v || undefined } })} c={c} placeholder="Semi-Final" />
              <Field label="Category" value={ev.result.category} onChange={(v) => set({ result: { ...ev.result!, category: v } })} c={c} placeholder="Mixed 500m" hint="The race category, shown next to the result." />
              <Field label="Time" value={ev.result.time ?? ''} onChange={(v) => set({ result: { ...ev.result!, time: v } })} c={c} placeholder="2:14.32" />
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <Field label="Notes" value={ev.result.notes ?? ''} onChange={(v) => set({ result: { ...ev.result!, notes: v } })} c={c} placeholder="Optional — e.g. first international podium" />
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button type="button" onClick={onSave} disabled={saving} style={{ ...primaryBtn(c), opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} style={{ ...ghostBtn(c), opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  Registration list (training tab)                                    */
/* ================================================================== */

/**
 * Scannable roster: one summary line hoists the facts shared by everyone
 * (confirmed count, "all both days"), then a dense multi-column grid of names.
 * Per-row tags appear ONLY as exceptions (waitlisted, or a partial-day
 * attendance) — printing "Sat + Sun / Confirmed" on all 19 rows was noise.
 */
const RegList: React.FC<{
  regs: ReturnType<typeof getAllBookings>;
  event: TrainingEvent;
  c: ColorPalette;
  showToast: ShowToast;
  isMobile: boolean;
}> = ({ regs, event, c, showToast, isMobile }) => {
  if (regs.length === 0) {
    return <p style={{ color: c.textSecondary, fontSize: '0.82rem', margin: 0 }}>No sign-ups yet.</p>;
  }

  const confirmed = regs.filter((b) => b.status === 'confirmed');
  const waiting = regs.filter((b) => b.status === 'waiting');
  const multiDay = event.days.length > 1;
  // Everyone attending the whole event → say it once instead of on every row.
  const allBothDays = multiDay && regs.every((b) => b.attending === 'both');

  return (
    <>
      <style>{`
        .regcell { transition: background-color 0.12s; }
        .regcell:hover { background: ${c.surfaceAlt}; }
        .regcell:hover .regcell-x { opacity: 1; }
      `}</style>

      {/* Summary — the facts shared by the whole list, stated once. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.35rem 0.7rem', marginBottom: '0.7rem', fontSize: '0.78rem', color: c.textSecondary }}>
        <span style={{ fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.72rem' }}>Registrations</span>
        <span style={{ fontWeight: 700, color: c.text }}>{confirmed.length} confirmed</span>
        {waiting.length > 0 && <><span aria-hidden>·</span><span style={{ color: '#d97706', fontWeight: 700 }}>{waiting.length} waitlist</span></>}
        {allBothDays && <><span aria-hidden>·</span><span>all both days</span></>}
      </div>

      {/* Dense grid — auto-fills columns so a long roster stays short. */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.1rem 0.5rem' }}>
        {regs.map((b) => (
          <RegCell key={`${b.eventId}::${b.name}`} b={b} event={event} c={c} showToast={showToast} isMobile={isMobile} allBothDays={allBothDays} />
        ))}
      </div>
    </>
  );
};

const RegCell: React.FC<{
  b: ReturnType<typeof getAllBookings>[0];
  event: TrainingEvent;
  c: ColorPalette;
  showToast: ShowToast;
  isMobile: boolean;
  allBothDays: boolean;
}> = ({ b, event, c, showToast, isMobile, allBothDays }) => {
  const [busy, setBusy] = useState(false);
  const [removed, setRemoved] = useState(false);

  if (removed) return null;

  const handleCancel = async () => {
    if (!b.id) return;
    setBusy(true);
    try {
      await cancelBooking(b.id);
      setRemoved(true);
      showToast(`${b.name} removed.`, 'info');
    } catch {
      showToast('Could not remove.', 'error');
    } finally {
      setBusy(false);
    }
  };

  // Only when it deviates from the norm: partial-day attendance (multi-day
  // events where "all both days" doesn't hold) and waitlisted status.
  const exception = !allBothDays && b.attending !== 'both' ? attendingLabel(b.attending, event) : null;
  const isWaiting = b.status === 'waiting';

  return (
    <div className="regcell" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.4rem', borderRadius: '0.4rem', minWidth: 0, opacity: busy ? 0.5 : 1 }}>
      <span style={{ fontWeight: 600, fontSize: '0.83rem', color: c.text, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</span>
      {isWaiting && <span style={{ fontSize: '0.56rem', fontWeight: 800, letterSpacing: '0.06em', color: '#d97706', flexShrink: 0 }}>WAIT</span>}
      {exception && <span style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.04em', color: '#d97706', flexShrink: 0 }}>{exception}</span>}
      <button type="button" aria-label={`Remove ${b.name}`} className="regcell-x admin-focus" onClick={handleCancel} disabled={busy}
        style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: busy ? 'not-allowed' : 'pointer', fontSize: '0.82rem', lineHeight: 1, flexShrink: 0, padding: '0 0.15rem', opacity: isMobile ? 0.6 : 0, transition: 'opacity 0.12s' }}>✕</button>
    </div>
  );
};

/* ================================================================== */
/*  Shared UI atoms                                                     */
/* ================================================================== */

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  c: ColorPalette;
  multiline?: boolean;
  type?: string;
  placeholder?: string;
  hint?: string;
}> = ({ label, value, onChange, c, multiline, type = 'text', placeholder, hint }) => (
  <div>
    <label style={labelStyle(c)}>{label}</label>
    {multiline ? (
      <textarea value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle(c), minHeight: '72px', resize: 'vertical' }} />
    ) : (
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle(c)} />
    )}
    {hint && <span style={{ display: 'block', fontSize: '0.7rem', color: c.textSecondary, marginTop: '0.25rem' }}>{hint}</span>}
  </div>
);

const labelStyle = (c: ColorPalette): React.CSSProperties => ({
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 600,
  color: c.textSecondary,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  marginBottom: '0.3rem',
});

const inputStyle = (c: ColorPalette): React.CSSProperties => ({
  width: '100%',
  padding: '0.5rem 0.7rem',
  borderRadius: '0.45rem',
  border: `1px solid ${c.border}`,
  backgroundColor: c.background,
  color: c.text,
  fontSize: '0.88rem',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
});

const IconBtn: React.FC<{ icon: React.ReactNode; onClick: () => void; c: ColorPalette; danger?: boolean; size?: number; label?: string }> = ({ icon, onClick, c, danger, size = 30, label }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="admin-focus"
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: '0.4rem', border: `1px solid ${danger ? '#ef444455' : c.border}`, background: 'transparent', color: danger ? '#ef4444' : c.textSecondary, cursor: 'pointer', flexShrink: 0 }}
  >
    {icon}
  </button>
);

const ConfirmBtn: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button type="button" onClick={onClick} className="admin-focus" style={{ padding: '0.3rem 0.7rem', borderRadius: '0.4rem', border: 'none', background: '#ef4444', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
    {label}
  </button>
);

const EmptyMsg: React.FC<{ c: ColorPalette; msg: string }> = ({ c, msg }) => (
  <div style={{ padding: '2rem', textAlign: 'center', borderRadius: '0.75rem', border: `1px dashed ${c.border}`, color: c.textSecondary, fontSize: '0.88rem' }}>
    {msg}
  </div>
);

const addBtn = (c: ColorPalette): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.5rem 1rem',
  borderRadius: '999px',
  border: 'none',
  background: c.primary,
  color: '#fff',
  fontWeight: 600,
  fontSize: '0.82rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
});

// Same "add" affordance as addBtn (accent-colored, bold, plus icon) but outlined
// rather than filled — for a secondary add action sitting next to a primary one,
// so it still reads as actionable instead of fading into a muted ghost button.
const addBtnOutline = (c: ColorPalette): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.5rem 1rem',
  borderRadius: '999px',
  border: `1.5px solid ${c.primary}`,
  background: 'transparent',
  color: c.primary,
  fontWeight: 600,
  fontSize: '0.82rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
});

const primaryBtn = (c: ColorPalette): React.CSSProperties => ({
  padding: '0.55rem 1.2rem',
  borderRadius: '0.5rem',
  border: 'none',
  background: c.primary,
  color: '#fff',
  fontWeight: 600,
  fontSize: '0.88rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
});

const ghostBtn = (c: ColorPalette): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem',
  padding: '0.55rem 1rem',
  borderRadius: '0.5rem',
  border: `1px solid ${c.border}`,
  background: 'transparent',
  color: c.textSecondary,
  fontWeight: 500,
  fontSize: '0.88rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
});
