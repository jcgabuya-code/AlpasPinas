import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { type ColorPalette } from '../../styles/colors';
import { type ShowToast } from '../Admin';
import {
  fetchAllRoster,
  addMember,
  editMember,
  setMemberStatus,
  removeMember,
  type Member,
  type MemberStatus,
} from '../../utils/roster';

type Props = { showToast: ShowToast; c: ColorPalette; theme: 'dark' | 'light' };

const blankMember = (): Omit<Member, 'status'> => ({
  name: '',
  role: 'Paddler',
  side: 'Left',
  joined: new Date().getFullYear(),
  photo: null,
});

const ROLES = ['Paddler', 'Drummer', 'Steers', 'Coach', 'Manager'];
const SIDES = ['Left', 'Right', 'Both', 'N/A', '—'];

/* ------------------------------------------------------------------ */

export const AdminRoster: React.FC<Props> = ({ c, showToast }) => {
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

  return (
    <div style={{ padding: '2rem 1.5rem 4rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: c.text, margin: '0 0 0.4rem', letterSpacing: '0.02em', lineHeight: 1 }}>
            ROSTER
          </h1>
          <p style={{ color: c.textSecondary, fontSize: '0.9rem', margin: 0 }}>
            {loading ? 'Fetching…' : `${active} active · ${inactive} inactive`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={reload} disabled={loading} style={ghostBtnStyle(c)}>
            <span style={{ display: 'inline-block', animation: loading ? 'spin 0.9s linear infinite' : 'none' }}>↻</span>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <button type="button" onClick={() => { setAdding(true); setEditing(null); }} style={addBtnStyle(c)}>
            <Plus size={14} /> Add Member
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1.25rem' }}>
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              border: `1px solid ${filter === f ? c.primary : c.border}`,
              background: filter === f ? `${c.primary}18` : 'transparent',
              color: filter === f ? c.primary : c.textSecondary,
              fontWeight: filter === f ? 600 : 500,
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Add form */}
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

      {/* Edit form */}
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

      {/* Member list */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {visible.map((m) => {
            const isInactive = m.status === 'inactive';
            const busy = busyName === m.name;
            const confirming = confirmRemove === m.name;

            return (
              <div
                key={m.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.65rem',
                  backgroundColor: c.surface,
                  border: `1px solid ${isInactive ? c.border + '88' : c.border}`,
                  opacity: isInactive ? 0.65 : 1,
                  flexWrap: 'wrap',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '999px',
                    backgroundColor: c.surfaceAlt,
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    color: c.textSecondary,
                    fontWeight: 700,
                  }}
                >
                  {m.photo ? (
                    <img src={m.photo} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    m.name.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: c.text }}>{m.name}</span>
                    {isInactive && (
                      <span style={{ padding: '0.1rem 0.45rem', borderRadius: '999px', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', background: '#94a3b822', color: c.textSecondary, border: `1px solid ${c.border}`, textTransform: 'uppercase' }}>
                        Inactive
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: c.textSecondary, marginTop: '0.1rem' }}>
                    {m.role} · {m.side} · Joined {m.joined}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0, alignItems: 'center' }}>
                  {confirming ? (
                    <>
                      <button type="button" onClick={() => handleRemove(m.name)} disabled={busy} style={{ padding: '0.3rem 0.7rem', borderRadius: '0.4rem', border: 'none', background: '#ef4444', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: busy ? 0.5 : 1 }}>
                        {busy ? '…' : 'Confirm'}
                      </button>
                      <button type="button" onClick={() => setConfirmRemove(null)} style={{ padding: '0.3rem 0.65rem', borderRadius: '0.4rem', border: `1px solid ${c.border}`, background: 'transparent', color: c.textSecondary, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Edit */}
                      <button type="button" onClick={() => { setEditing({ original: m.name, data: { name: m.name, role: m.role, side: m.side, joined: m.joined, photo: m.photo } }); setAdding(false); }} style={iconBtnStyle(c)}>
                        <Pencil size={14} />
                      </button>
                      {/* Toggle status */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(m)}
                        disabled={busy}
                        style={{
                          padding: '0.3rem 0.7rem',
                          borderRadius: '999px',
                          border: `1px solid ${isInactive ? c.primary + '66' : c.border}`,
                          background: 'transparent',
                          color: isInactive ? c.primary : c.textSecondary,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: busy ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit',
                          opacity: busy ? 0.5 : 1,
                        }}
                      >
                        {busy ? '…' : isInactive ? 'Activate' : 'Deactivate'}
                      </button>
                      {/* Remove */}
                      <button type="button" onClick={() => setConfirmRemove(m.name)} style={iconBtnStyle(c, true)}>
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

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
          <select value={data.role} onChange={(e) => set({ role: e.target.value })} style={inputStyle(c)}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle(c)}>Side</label>
          <select value={data.side} onChange={(e) => set({ side: e.target.value })} style={inputStyle(c)}>
            {SIDES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <FieldInput label="Year Joined" value={String(data.joined)} onChange={(v) => set({ joined: Number(v) || data.joined })} c={c} type="number" />
        <FieldInput label="Photo URL" value={data.photo ?? ''} onChange={(v) => set({ photo: v || null })} c={c} placeholder="/photos/name.jpg" />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button type="button" onClick={onSave} disabled={busy} style={{ ...addBtnStyle(c), opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} style={ghostBtnStyle(c)}>Cancel</button>
      </div>
    </div>
  );
};

const FieldInput: React.FC<{ label: string; value: string; onChange: (v: string) => void; c: ColorPalette; type?: string; placeholder?: string }> = ({ label, value, onChange, c, type = 'text', placeholder }) => (
  <div>
    <label style={labelStyle(c)}>{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle(c)} />
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

const iconBtnStyle = (c: ColorPalette, danger?: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '30px',
  height: '30px',
  borderRadius: '0.4rem',
  border: `1px solid ${danger ? '#ef444455' : c.border}`,
  background: 'transparent',
  color: danger ? '#ef4444' : c.textSecondary,
  cursor: 'pointer',
  flexShrink: 0,
});

const addBtnStyle = (c: ColorPalette): React.CSSProperties => ({
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

const ghostBtnStyle = (c: ColorPalette): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.5rem 1rem',
  borderRadius: '999px',
  border: `1px solid ${c.border}`,
  background: 'transparent',
  color: c.textSecondary,
  fontWeight: 500,
  fontSize: '0.82rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
});
