import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { type ColorPalette } from '../../styles/colors';
import { type ShowToast } from '../Admin';
import { useIsMobile } from '../../hooks/useIsMobile';
import {
  fetchAllRoster,
  addMember,
  editMember,
  setMemberStatus,
  removeMember,
  type Member,
  type MemberStatus,
} from '../../utils/roster';

type Theme = 'dark' | 'light';
type Props = { showToast: ShowToast; c: ColorPalette; theme: Theme };

const blankMember = (): Omit<Member, 'status'> => ({
  name: '',
  role: 'Paddler',
  side: 'Left',
  joined: new Date().getFullYear(),
  photo: null,
});

const ROLES = ['Paddler', 'Drummer', 'Steers', 'Coach', 'Manager'];
const SIDES = ['Left', 'Right', 'Both', 'N/A', '—'];

// Theme-aware status pills — measured ≥4.5:1 in both modes.
const STATUS: Record<Theme, { active: { bg: string; fg: string }; inactive: { bg: string; fg: string } }> = {
  dark: {
    active:   { bg: 'rgba(22,163,74,0.22)',  fg: '#4ade80' },
    inactive: { bg: 'rgba(148,163,184,0.20)', fg: '#cbd5e1' },
  },
  light: {
    active:   { bg: 'rgba(22,163,74,0.16)',  fg: '#14532d' },
    inactive: { bg: 'rgba(100,116,139,0.16)', fg: '#475569' },
  },
};

const COLUMNS = '2fr 1.1fr 1.1fr 0.9fr 0.8fr 1.4fr';

/* ------------------------------------------------------------------ */

export const AdminRoster: React.FC<Props> = ({ c, showToast, theme }) => {
  const isMobile = useIsMobile();
  // Deep-navy `primary` is illegible on dark surfaces — brighter dark-bg accent
  // for text/borders; light mode keeps the deep tone.
  const accent = theme === 'dark' ? c.accent : c.primary;
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editing, setEditing] = useState<{ original: string; data: Omit<Member, 'status'> } | null>(null);
  const [adding, setAdding] = useState(false);
  const [newMember, setNewMember] = useState<Omit<Member, 'status'>>(blankMember());
  const [busyName, setBusyName] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    fetchAllRoster().then(setMembers).finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const visible = members.filter((m) => {
    if (filter === 'active') return m.status !== 'inactive';
    if (filter === 'inactive') return m.status === 'inactive';
    return true;
  });

  const active   = members.filter((m) => m.status !== 'inactive').length;
  const inactive = members.filter((m) => m.status === 'inactive').length;
  const counts = { all: members.length, active, inactive };

  /* --- Add --- */
  const handleAdd = async () => {
    if (!newMember.name.trim()) { showToast('Name is required.', 'error'); return; }
    setBusyName('__add__');
    try {
      await addMember(newMember);
      reload();
      setAdding(false);
      setNewMember(blankMember());
      showToast(`${newMember.name} added.`);
    } catch {
      showToast('Could not add member.', 'error');
    } finally {
      setBusyName(null);
    }
  };

  /* --- Edit --- */
  const handleEdit = async () => {
    if (!editing) return;
    if (!editing.data.name.trim()) { showToast('Name is required.', 'error'); return; }
    setBusyName(editing.original);
    try {
      await editMember(editing.original, editing.data);
      reload();
      setEditing(null);
      showToast('Member updated.');
    } catch {
      showToast('Could not update member.', 'error');
    } finally {
      setBusyName(null);
    }
  };

  /* --- Toggle status --- */
  const handleToggleStatus = async (m: Member) => {
    const next: MemberStatus = m.status === 'inactive' ? 'active' : 'inactive';
    setBusyName(m.name);
    try {
      await setMemberStatus(m.name, next);
      setMembers((prev) => prev.map((x) => x.name === m.name ? { ...x, status: next } : x));
      showToast(`${m.name} ${next === 'active' ? 'activated' : 'deactivated'}.`, next === 'active' ? 'success' : 'info');
    } catch {
      showToast('Could not update status.', 'error');
    } finally {
      setBusyName(null);
    }
  };

  /* --- Remove --- */
  const handleRemove = async (name: string) => {
    setBusyName(name);
    try {
      await removeMember(name);
      reload();
      setConfirmRemove(null);
      showToast(`${name} removed.`, 'info');
    } catch {
      showToast('Could not remove.', 'error');
    } finally {
      setBusyName(null);
    }
  };

  const startEdit = (m: Member) => {
    setEditing({ original: m.name, data: { name: m.name, role: m.role, side: m.side, joined: m.joined, photo: m.photo } });
    setAdding(false);
  };

  return (
    <div style={{ padding: isMobile ? '1.25rem 1rem 3rem' : '2rem 1.5rem 4rem' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .admin-focus:focus-visible { outline: 2px solid ${c.primary}; outline-offset: 2px; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: isMobile ? '0.5rem' : '0.75rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: c.text, margin: '0 0 0.4rem', letterSpacing: '0.02em', lineHeight: 1 }}>
            ROSTER
          </h1>
          <p style={{ color: c.textSecondary, fontSize: '0.9rem', margin: 0 }}>
            Full member directory
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={reload} disabled={loading} className="admin-focus" style={ghostBtnStyle(c)}>
            <span style={{ display: 'inline-block', animation: loading ? 'spin 0.9s linear infinite' : 'none' }}>↻</span>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <button type="button" onClick={() => { setAdding(true); setEditing(null); }} className="admin-focus" style={addBtnStyle(c)}>
            <Plus size={15} /> Add Member
          </button>
        </div>
      </div>

      <div style={{ fontSize: '0.85rem', color: c.textSecondary, margin: `0 0 ${isMobile ? '1rem' : '1.25rem'}` }}>
        {loading ? 'Fetching…' : `${active} active · ${inactive} inactive`}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: isMobile ? '1rem' : '1.25rem', flexWrap: 'wrap' }}>
        {(['all', 'active', 'inactive'] as const).map((f) => {
          const on = filter === f;
          return (
            <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={on} className="admin-focus"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                padding: '0.5rem 0.95rem', minHeight: 40, borderRadius: '999px',
                border: `1px solid ${on ? c.primary : c.border}`,
                background: on ? c.primary : 'transparent',
                color: on ? '#fff' : c.text,
                fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
              }}
            >
              {f}
              <span style={{ fontSize: '0.72rem', fontWeight: 700, opacity: on ? 0.9 : 0.6 }}>{counts[f]}</span>
            </button>
          );
        })}
      </div>

      {/* Add / Edit form */}
      {adding && (
        <MemberForm
          data={newMember}
          setData={setNewMember}
          c={c}
          title="Add Member"
          onSave={handleAdd}
          onCancel={() => { setAdding(false); setNewMember(blankMember()); }}
          busy={busyName === '__add__'}
        />
      )}
      {editing && (
        <MemberForm
          data={editing.data}
          setData={(d) => setEditing({ ...editing, data: d })}
          c={c}
          title={`Edit: ${editing.original}`}
          onSave={handleEdit}
          onCancel={() => setEditing(null)}
          busy={busyName === editing.original}
        />
      )}

      {/* Skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: '60px', borderRadius: '0.65rem', backgroundColor: c.surface, border: `1px solid ${c.border}`, opacity: 1 - i * 0.18 }} />
          ))}
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', border: `1px dashed ${c.border}`, borderRadius: '0.75rem', color: c.textSecondary, fontSize: '0.88rem' }}>
          No members in this filter.
        </div>
      )}

      {/* Member table / cards */}
      {!loading && visible.length > 0 && (
        <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: '1rem', overflow: 'hidden' }}>
          {!isMobile && (
            <div style={{ display: 'grid', gridTemplateColumns: COLUMNS, gap: '1rem', alignItems: 'center', padding: '1rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: c.textSecondary, borderBottom: `1px solid ${c.border}` }}>
              <div>Member</div><div>Role</div><div>Position</div><div>Status</div><div>Joined</div><div>Actions</div>
            </div>
          )}

          {visible.map((m, i) => {
            const isInactive = m.status === 'inactive';
            const busy = busyName === m.name;
            const confirming = confirmRemove === m.name;
            const isLast = i === visible.length - 1;
            const set = isInactive ? STATUS[theme].inactive : STATUS[theme].active;

            const avatar = (
              <div style={{ width: 34, height: 34, borderRadius: '999px', background: `${c.primary}1f`, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: c.text, fontWeight: 700 }}>
                {m.photo ? <img src={m.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.name.charAt(0).toUpperCase()}
              </div>
            );
            const statusPill = (
              <span style={{ display: 'inline-flex', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: set.bg, color: set.fg, whiteSpace: 'nowrap' }}>
                {isInactive ? 'Inactive' : 'Active'}
              </span>
            );
            const actions = (
              <RowActions
                c={c} accent={accent} isMobile={isMobile} busy={busy} confirming={confirming} isInactive={isInactive}
                onEdit={() => startEdit(m)}
                onToggle={() => handleToggleStatus(m)}
                onAskRemove={() => setConfirmRemove(m.name)}
                onCancelRemove={() => setConfirmRemove(null)}
                onConfirmRemove={() => handleRemove(m.name)}
                name={m.name}
              />
            );

            if (isMobile) {
              return (
                <div key={`${m.name}::${i}`} style={{ padding: '1rem 1.1rem', borderBottom: isLast ? 'none' : `1px solid ${c.border}`, opacity: isInactive ? 0.72 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                      {avatar}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: c.text }}>{m.name}</div>
                        <div style={{ fontSize: '0.75rem', color: c.textSecondary, marginTop: '0.15rem' }}>{m.role} · {m.side} · {m.joined}</div>
                      </div>
                    </div>
                    {statusPill}
                  </div>
                  <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>{actions}</div>
                </div>
              );
            }

            return (
              <div key={`${m.name}::${i}`} style={{ display: 'grid', gridTemplateColumns: COLUMNS, gap: '1rem', alignItems: 'center', padding: '0.85rem 1.25rem', borderBottom: isLast ? 'none' : `1px solid ${c.border}`, opacity: isInactive ? 0.72 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', minWidth: 0 }}>
                  {avatar}
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: c.textSecondary }}>{m.role}</div>
                <div style={{ fontSize: '0.85rem', color: c.textSecondary }}>{m.side}</div>
                <div>{statusPill}</div>
                <div style={{ fontSize: '0.85rem', color: c.textSecondary }}>{m.joined}</div>
                {actions}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */

const RowActions: React.FC<{
  c: ColorPalette;
  accent: string;
  isMobile: boolean;
  busy: boolean;
  confirming: boolean;
  isInactive: boolean;
  name: string;
  onEdit: () => void;
  onToggle: () => void;
  onAskRemove: () => void;
  onCancelRemove: () => void;
  onConfirmRemove: () => void;
}> = ({ c, accent, isMobile, busy, confirming, isInactive, name, onEdit, onToggle, onAskRemove, onCancelRemove, onConfirmRemove }) => {
  const sz = isMobile ? 40 : 32;
  const minH = isMobile ? 40 : undefined;

  if (confirming) {
    return (
      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
        <button type="button" onClick={onConfirmRemove} disabled={busy} className="admin-focus"
          style={{ padding: '0.35rem 0.75rem', minHeight: minH, borderRadius: '0.4rem', border: 'none', background: '#ef4444', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: busy ? 0.5 : 1 }}>
          {busy ? '…' : 'Confirm'}
        </button>
        <button type="button" onClick={onCancelRemove} className="admin-focus"
          style={{ padding: '0.35rem 0.7rem', minHeight: minH, borderRadius: '0.4rem', border: `1px solid ${c.border}`, background: 'transparent', color: c.text, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
      <IconBtn c={c} size={sz} label={`Edit ${name}`} onClick={onEdit}><Pencil size={14} /></IconBtn>
      <button type="button" onClick={onToggle} disabled={busy} aria-label={isInactive ? `Activate ${name}` : `Deactivate ${name}`} className="admin-focus"
        style={{ padding: '0.35rem 0.75rem', minHeight: minH, borderRadius: '999px', border: `1px solid ${isInactive ? accent + '66' : c.border}`, background: 'transparent', color: isInactive ? accent : c.textSecondary, fontSize: '0.75rem', fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: busy ? 0.5 : 1, whiteSpace: 'nowrap' }}>
        {busy ? '…' : isInactive ? 'Activate' : 'Deactivate'}
      </button>
      <IconBtn c={c} size={sz} danger label={`Remove ${name}`} onClick={onAskRemove}><Trash2 size={14} /></IconBtn>
    </div>
  );
};

const IconBtn: React.FC<{ c: ColorPalette; size: number; label: string; danger?: boolean; onClick: () => void; children: React.ReactNode }> = ({ c, size, label, danger, onClick, children }) => (
  <button type="button" onClick={onClick} aria-label={label} title={label} className="admin-focus"
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: '0.4rem', border: `1px solid ${danger ? '#ef444455' : c.border}`, background: 'transparent', color: danger ? '#ef4444' : c.textSecondary, cursor: 'pointer', flexShrink: 0 }}>
    {children}
  </button>
);

/* ------------------------------------------------------------------ */

const MemberForm: React.FC<{
  data: Omit<Member, 'status'>;
  setData: (d: Omit<Member, 'status'>) => void;
  c: ColorPalette;
  title: string;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
}> = ({ data, setData, c, title, onSave, onCancel, busy }) => {
  const set = (patch: Partial<Omit<Member, 'status'>>) => setData({ ...data, ...patch });

  return (
    <div style={{ backgroundColor: c.surfaceAlt, border: `1px solid ${c.border}`, borderRadius: '0.85rem', padding: '1.25rem', marginBottom: '1.25rem' }}>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: c.text, marginBottom: '1rem' }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.65rem' }}>
        <FieldInput label="Name" value={data.name} onChange={(v) => set({ name: v })} c={c} />
        <div>
          <label style={labelStyle(c)}>Role</label>
          <select value={data.role} onChange={(e) => set({ role: e.target.value })} className="admin-focus" style={inputStyle(c)}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle(c)}>Side</label>
          <select value={data.side} onChange={(e) => set({ side: e.target.value })} className="admin-focus" style={inputStyle(c)}>
            {SIDES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <FieldInput label="Year Joined" value={String(data.joined)} onChange={(v) => set({ joined: Number(v) || data.joined })} c={c} type="number" />
        <FieldInput label="Photo URL" value={data.photo ?? ''} onChange={(v) => set({ photo: v || null })} c={c} placeholder="/photos/name.jpg" />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button type="button" onClick={onSave} disabled={busy} className="admin-focus" style={{ ...addBtnStyle(c), minHeight: 40, opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className="admin-focus" style={{ ...ghostBtnStyle(c), minHeight: 40 }}>Cancel</button>
      </div>
    </div>
  );
};

const FieldInput: React.FC<{ label: string; value: string; onChange: (v: string) => void; c: ColorPalette; type?: string; placeholder?: string }> = ({ label, value, onChange, c, type = 'text', placeholder }) => (
  <div>
    <label style={labelStyle(c)}>{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="admin-focus" style={inputStyle(c)} />
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
  // ≥16px avoids iOS Safari auto-zoom on focus.
  fontSize: '16px',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
});

const addBtnStyle = (c: ColorPalette): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.5rem 1rem',
  minHeight: 40,
  borderRadius: '999px',
  border: 'none',
  background: c.primary,
  color: '#fff',
  fontWeight: 600,
  fontSize: '0.82rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
});

const ghostBtnStyle = (c: ColorPalette): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.5rem 1rem',
  minHeight: 40,
  borderRadius: '999px',
  border: `1px solid ${c.border}`,
  background: 'transparent',
  color: c.textSecondary,
  fontWeight: 500,
  fontSize: '0.82rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
});
