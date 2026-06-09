import React, { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { type ColorPalette } from '../../styles/colors';
import { type ShowToast } from '../Admin';
import {
  getTrainingEvents,
  createTrainingEvent,
  updateTrainingEvent,
  deleteTrainingEvent,
} from '../../utils/adminTrainingEvents';
import {
  getRaceEvents,
  createRaceEvent,
  updateRaceEvent,
  deleteRaceEvent,
  type RaceEvent,
} from '../../utils/adminRaceEvents';
import { type TrainingEvent, type TrainingDay } from '../../components/TrainingCard';
import { getAllBookings, cancelBooking, attendingLabel, formatShortDate } from '../../utils/bookings';

type Tab = 'training' | 'races';
type Props = { showToast: ShowToast; c: ColorPalette; theme: 'dark' | 'light' };

/* ------------------------------------------------------------------ */

export const AdminEvents: React.FC<Props> = ({ c, showToast }) => {
  const [tab, setTab] = useState<Tab>('training');

  return (
    <div style={{ padding: '2rem 1.5rem 4rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: c.text, margin: '0 0 1.25rem', letterSpacing: '0.02em', lineHeight: 1 }}>
        EVENTS
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1.75rem' }}>
        {(['training', 'races'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '999px',
              border: `1px solid ${tab === t ? c.primary : c.border}`,
              background: tab === t ? `${c.primary}18` : 'transparent',
              color: tab === t ? c.primary : c.textSecondary,
              fontWeight: tab === t ? 600 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '0.02em',
            }}
          >
            {t === 'training' ? 'Training Sessions' : 'Race Events'}
          </button>
        ))}
      </div>

      {tab === 'training'
        ? <TrainingTab c={c} showToast={showToast} />
        : <RaceTab c={c} showToast={showToast} />}
    </div>
  );
};

/* ================================================================== */
/*  Training tab                                                        */
/* ================================================================== */

const blankDay = (): TrainingDay => ({
  key: 'sat',
  label: 'Saturday',
  date: '',
  time: '07:30',
  location: '',
  capacity: 22,
});

const blankTraining = (): TrainingEvent => ({
  id: `training-${Date.now()}`,
  title: '',
  description: '',
  thumbnail: '',
  days: [blankDay()],
});

const TrainingTab: React.FC<{ c: ColorPalette; showToast: ShowToast }> = ({ c, showToast }) => {
  const [events, setEvents] = useState<TrainingEvent[]>(() => getTrainingEvents());
  const [editing, setEditing] = useState<TrainingEvent | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const reload = () => setEvents(getTrainingEvents());

  const openNew = () => {
    setEditing(blankTraining());
    setIsNew(true);
  };

  const openEdit = (ev: TrainingEvent) => {
    setEditing(JSON.parse(JSON.stringify(ev)));
    setIsNew(false);
  };

  const save = () => {
    if (!editing) return;
    if (!editing.title.trim()) { showToast('Title is required.', 'error'); return; }
    if (editing.days.some((d) => !d.date)) { showToast('All days need a date.', 'error'); return; }
    if (isNew) createTrainingEvent(editing);
    else updateTrainingEvent(editing.id, editing);
    reload();
    setEditing(null);
    showToast(isNew ? 'Event created.' : 'Event updated.');
  };

  const remove = (id: string) => {
    deleteTrainingEvent(id);
    reload();
    setConfirmDelete(null);
    showToast('Event deleted.', 'info');
  };

  const allBookings = getAllBookings();

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button type="button" onClick={openNew} style={addBtn(c)}>
          <Plus size={14} /> New Session
        </button>
      </div>

      {/* Form */}
      {editing && (
        <TrainingForm ev={editing} setEv={setEditing} c={c} onSave={save} onCancel={() => setEditing(null)} isNew={isNew} />
      )}

      {/* List */}
      {events.length === 0 && !editing && (
        <EmptyMsg c={c} msg="No training sessions. Add one above." />
      )}

      {events.map((ev) => {
        const regs = allBookings.filter((b) => b.eventId === ev.id);
        const isExp = expanded === ev.id;
        return (
          <div
            key={ev.id}
            style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: '0.85rem', marginBottom: '0.75rem', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: c.text }}>{ev.title}</div>
                <div style={{ fontSize: '0.75rem', color: c.textSecondary, marginTop: '0.2rem' }}>
                  {ev.days.map((d) => `${d.label} ${formatShortDate(d.date)}`).join(' · ')} · {regs.length} sign-up{regs.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                <IconBtn icon={<Pencil size={14} />} onClick={() => openEdit(ev)} c={c} />
                {confirmDelete === ev.id ? (
                  <>
                    <ConfirmBtn label="Delete?" onClick={() => remove(ev.id)} />
                    <IconBtn icon="✕" onClick={() => setConfirmDelete(null)} c={c} />
                  </>
                ) : (
                  <IconBtn icon={<Trash2 size={14} />} onClick={() => setConfirmDelete(ev.id)} c={c} danger />
                )}
                <IconBtn icon={isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />} onClick={() => setExpanded(isExp ? null : ev.id)} c={c} />
              </div>
            </div>

            {/* Expanded registrations */}
            {isExp && (
              <div style={{ borderTop: `1px solid ${c.border}`, padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.textSecondary, marginBottom: '0.6rem' }}>
                  Registrations ({regs.length})
                </div>
                {regs.length === 0 && <p style={{ color: c.textSecondary, fontSize: '0.82rem' }}>No sign-ups yet.</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {regs.map((b) => (
                    <RegRow key={`${b.eventId}::${b.name}`} b={b} c={c} showToast={showToast} />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

const TrainingForm: React.FC<{
  ev: TrainingEvent;
  setEv: (ev: TrainingEvent) => void;
  c: ColorPalette;
  onSave: () => void;
  onCancel: () => void;
  isNew: boolean;
}> = ({ ev, setEv, c, onSave, onCancel, isNew }) => {
  const set = (patch: Partial<TrainingEvent>) => setEv({ ...ev, ...patch });
  const setDay = (idx: number, patch: Partial<TrainingDay>) =>
    set({ days: ev.days.map((d, i) => (i === idx ? { ...d, ...patch } : d)) });

  return (
    <div style={{ backgroundColor: c.surfaceAlt, border: `1px solid ${c.border}`, borderRadius: '0.85rem', padding: '1.25rem', marginBottom: '1rem' }}>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: c.text, marginBottom: '1rem' }}>
        {isNew ? 'New Training Session' : 'Edit Session'}
      </div>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <Field label="Title" value={ev.title} onChange={(v) => set({ title: v })} c={c} />
        <Field label="Description" value={ev.description} onChange={(v) => set({ description: v })} c={c} multiline />
        <Field label="Thumbnail URL" value={ev.thumbnail ?? ''} onChange={(v) => set({ thumbnail: v })} c={c} placeholder="/marina-putrajaya.jpg" />

        {ev.days.map((d, i) => (
          <div key={i} style={{ padding: '0.85rem', backgroundColor: c.surface, borderRadius: '0.6rem', border: `1px solid ${c.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.82rem', color: c.text }}>Day {i + 1}</span>
              {ev.days.length > 1 && (
                <button type="button" onClick={() => set({ days: ev.days.filter((_, j) => j !== i) })} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem' }}>
                  Remove
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
              <Field label="Key (sat/sun)" value={d.key} onChange={(v) => setDay(i, { key: v })} c={c} />
              <Field label="Label" value={d.label} onChange={(v) => setDay(i, { label: v })} c={c} />
              <Field label="Date" value={d.date} onChange={(v) => setDay(i, { date: v })} c={c} type="date" />
              <Field label="Time" value={d.time} onChange={(v) => setDay(i, { time: v })} c={c} type="time" />
              <Field label="Location" value={d.location} onChange={(v) => setDay(i, { location: v })} c={c} />
              <Field label="Capacity" value={String(d.capacity)} onChange={(v) => setDay(i, { capacity: Number(v) || 22 })} c={c} type="number" />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => set({ days: [...ev.days, blankDay()] })}
          style={{ ...ghostBtn(c), alignSelf: 'flex-start' }}
        >
          <Plus size={13} /> Add day
        </button>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button type="button" onClick={onSave} style={primaryBtn(c)}>Save</button>
        <button type="button" onClick={onCancel} style={ghostBtn(c)}>Cancel</button>
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

const RaceTab: React.FC<{ c: ColorPalette; showToast: ShowToast }> = ({ c, showToast }) => {
  const [events, setEvents] = useState<RaceEvent[]>(() => getRaceEvents());
  const [editing, setEditing] = useState<RaceEvent | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const reload = () => setEvents(getRaceEvents());

  const openNew = () => { setEditing(blankRace()); setIsNew(true); };
  const openEdit = (ev: RaceEvent) => { setEditing(JSON.parse(JSON.stringify(ev))); setIsNew(false); };

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) { showToast('Name is required.', 'error'); return; }
    if (!editing.date) { showToast('Date is required.', 'error'); return; }
    if (isNew) createRaceEvent(editing);
    else updateRaceEvent(editing.id, editing);
    reload();
    setEditing(null);
    showToast(isNew ? 'Race event created.' : 'Race event updated.');
  };

  const remove = (id: string) => {
    deleteRaceEvent(id);
    reload();
    setConfirmDelete(null);
    showToast('Event deleted.', 'info');
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button type="button" onClick={openNew} style={addBtn(c)}>
          <Plus size={14} /> New Race Event
        </button>
      </div>

      {editing && (
        <RaceForm ev={editing} setEv={setEditing} c={c} onSave={save} onCancel={() => setEditing(null)} isNew={isNew} />
      )}

      {events.length === 0 && !editing && <EmptyMsg c={c} msg="No race events yet." />}

      {events.map((ev) => (
        <div
          key={ev.id}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem', backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: '0.85rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: c.text }}>{ev.name}</div>
            <div style={{ fontSize: '0.75rem', color: c.textSecondary, marginTop: '0.2rem' }}>
              {ev.date} · {ev.location} · {ev.type}
              {ev.result && ` · #${ev.result.rank} ${ev.result.category}`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
            <IconBtn icon={<Pencil size={14} />} onClick={() => openEdit(ev)} c={c} />
            {confirmDelete === ev.id ? (
              <>
                <ConfirmBtn label="Delete?" onClick={() => remove(ev.id)} />
                <IconBtn icon="✕" onClick={() => setConfirmDelete(null)} c={c} />
              </>
            ) : (
              <IconBtn icon={<Trash2 size={14} />} onClick={() => setConfirmDelete(ev.id)} c={c} danger />
            )}
          </div>
        </div>
      ))}
    </>
  );
};

const RaceForm: React.FC<{
  ev: RaceEvent;
  setEv: (ev: RaceEvent) => void;
  c: ColorPalette;
  onSave: () => void;
  onCancel: () => void;
  isNew: boolean;
}> = ({ ev, setEv, c, onSave, onCancel, isNew }) => {
  const set = (patch: Partial<RaceEvent>) => setEv({ ...ev, ...patch });
  const hasResult = !!ev.result;

  return (
    <div style={{ backgroundColor: c.surfaceAlt, border: `1px solid ${c.border}`, borderRadius: '0.85rem', padding: '1.25rem', marginBottom: '1rem' }}>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: c.text, marginBottom: '1rem' }}>
        {isNew ? 'New Race Event' : 'Edit Race Event'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.65rem' }}>
        <Field label="Name" value={ev.name} onChange={(v) => set({ name: v })} c={c} />
        <Field label="Location" value={ev.location} onChange={(v) => set({ location: v })} c={c} />
        <Field label="Date" value={ev.date} onChange={(v) => set({ date: v })} c={c} type="date" />
        <div>
          <label style={labelStyle(c)}>Type</label>
          <select value={ev.type} onChange={(e) => set({ type: e.target.value })} style={inputStyle(c)}>
            {['Regatta', 'Festival', 'Training Camp', 'Friendly'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <Field label="Thumbnail URL" value={ev.thumbnail ?? ''} onChange={(v) => set({ thumbnail: v })} c={c} />
      </div>
      <div style={{ marginTop: '0.65rem' }}>
        <Field label="Description" value={ev.description} onChange={(v) => set({ description: v })} c={c} multiline />
      </div>

      {/* Result toggle */}
      <div style={{ marginTop: '0.85rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: c.text }}>
          <input
            type="checkbox"
            checked={hasResult}
            onChange={(e) => set({ result: e.target.checked ? { rank: 1, category: '', time: '', notes: '' } : null })}
          />
          Add race result
        </label>
        {hasResult && ev.result && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem', marginTop: '0.65rem', padding: '0.85rem', backgroundColor: c.surface, borderRadius: '0.6rem', border: `1px solid ${c.border}` }}>
            <Field label="Rank" value={String(ev.result.rank)} onChange={(v) => set({ result: { ...ev.result!, rank: Number(v) || 1 } })} c={c} type="number" />
            <Field label="Category" value={ev.result.category} onChange={(v) => set({ result: { ...ev.result!, category: v } })} c={c} />
            <Field label="Time" value={ev.result.time} onChange={(v) => set({ result: { ...ev.result!, time: v } })} c={c} placeholder="2:14.32" />
            <Field label="Notes" value={ev.result.notes} onChange={(v) => set({ result: { ...ev.result!, notes: v } })} c={c} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button type="button" onClick={onSave} style={primaryBtn(c)}>Save</button>
        <button type="button" onClick={onCancel} style={ghostBtn(c)}>Cancel</button>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  Registration row (training tab)                                     */
/* ================================================================== */

const RegRow: React.FC<{ b: ReturnType<typeof getAllBookings>[0]; c: ColorPalette; showToast: ShowToast }> = ({ b, c, showToast }) => {
  const [busy, setBusy] = useState(false);
  const [removed, setRemoved] = useState(false);

  if (removed) return null;

  const handleCancel = async () => {
    setBusy(true);
    try {
      await cancelBooking(b.eventId, b.name);
      setRemoved(true);
      showToast(`${b.name} removed.`, 'info');
    } catch {
      showToast('Could not remove.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const statusColor = b.status === 'confirmed' ? '#16a34a' : '#d97706';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.65rem', borderRadius: '0.5rem', backgroundColor: c.background, border: `1px solid ${c.border}`, flexWrap: 'wrap' }}>
      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: c.text, flex: 1 }}>{b.name}</span>
      <span style={{ fontSize: '0.68rem', color: c.textSecondary }}>{attendingLabel(b.attending)}</span>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: statusColor, textTransform: 'uppercase' }}>{b.status}</span>
      <button type="button" onClick={handleCancel} disabled={busy} style={{ padding: '0.25rem 0.6rem', borderRadius: '999px', border: '1px solid #ef444466', background: 'transparent', color: '#ef4444', fontSize: '0.72rem', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: busy ? 0.5 : 1 }}>
        Remove
      </button>
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
}> = ({ label, value, onChange, c, multiline, type = 'text', placeholder }) => (
  <div>
    <label style={labelStyle(c)}>{label}</label>
    {multiline ? (
      <textarea value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle(c), minHeight: '72px', resize: 'vertical' }} />
    ) : (
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle(c)} />
    )}
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

const IconBtn: React.FC<{ icon: React.ReactNode; onClick: () => void; c: ColorPalette; danger?: boolean }> = ({ icon, onClick, c, danger }) => (
  <button type="button" onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '0.4rem', border: `1px solid ${danger ? '#ef444455' : c.border}`, background: 'transparent', color: danger ? '#ef4444' : c.textSecondary, cursor: 'pointer', flexShrink: 0 }}>
    {icon}
  </button>
);

const ConfirmBtn: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button type="button" onClick={onClick} style={{ padding: '0.3rem 0.7rem', borderRadius: '0.4rem', border: 'none', background: '#ef4444', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
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
