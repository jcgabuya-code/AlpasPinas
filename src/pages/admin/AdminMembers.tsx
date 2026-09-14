import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Mail, ShieldCheck, ShieldOff } from 'lucide-react';
import { type ColorPalette } from '../../styles/colors';
import { type ShowToast } from '../Admin';
import { useIsMobile } from '../../hooks/useIsMobile';
import {
  fetchAllProfiles,
  updateProfile,
  setUserAdmin,
  sendPasswordReset,
  type User,
  type UserGender,
  type UserSide,
  type ProfileEdit,
} from '../../utils/users';

type Props = { showToast: ShowToast; c: ColorPalette; theme: 'dark' | 'light'; embedded?: boolean };

const GENDERS: UserGender[] = ['Male', 'Female'];
const SIDES: UserSide[] = ['Left', 'Right', 'Coxswain', 'Coach'];

const COLUMNS = '1.6fr 1.2fr 1.6fr 1fr 0.9fr 1.6fr';

type EditState = { id: string; data: ProfileEdit };

const toEditable = (u: User): ProfileEdit => ({
  mobile: u.mobile,
  name: u.name,
  email: u.email ?? '',
  birthday: u.birthday ?? '',
  gender: u.gender ?? null,
  side: u.side ?? null,
  weight: u.weight ?? null,
  emergencyContactName: u.emergencyContactName ?? '',
  emergencyContactPhone: u.emergencyContactPhone ?? '',
});

export const AdminMembers: React.FC<Props> = ({ c, showToast, theme, embedded = false }) => {
  const isMobile = useIsMobile();
  const accent = theme === 'dark' ? c.accent : c.primary;
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<EditState | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmAdminChange, setConfirmAdminChange] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    fetchAllProfiles().then(setMembers).catch((err) => showToast(err instanceof Error ? err.message : 'Failed to load members.', 'error')).finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const adminCount = members.filter((m) => m.isAdmin).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => [m.name, m.mobile, m.email].some((v) => v?.toLowerCase().includes(q)));
  }, [members, query]);

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.data.name?.trim()) { showToast('Name is required.', 'error'); return; }
    setBusyId(editing.id);
    try {
      const updated = await updateProfile(editing.id, editing.data);
      setMembers((prev) => prev.map((m) => (m.id === editing.id ? updated : m)));
      setEditing(null);
      showToast(`${updated.name} updated.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update member.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleResetPassword = async (m: User) => {
    if (!m.email) { showToast(`${m.name} has no email on file.`, 'error'); return; }
    setBusyId(m.id);
    try {
      await sendPasswordReset(m.email);
      showToast(`Password reset emailed to ${m.email}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not send the reset email.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleAdmin = async (m: User) => {
    const next = !m.isAdmin;
    if (!next && adminCount <= 1) {
      showToast('At least one admin is required — promote someone else first.', 'error');
      setConfirmAdminChange(null);
      return;
    }
    setBusyId(m.id);
    try {
      await setUserAdmin(m.id, next);
      setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, isAdmin: next } : x)));
      showToast(next ? `${m.name} is now an admin.` : `${m.name} is no longer an admin.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update admin status.', 'error');
    } finally {
      setBusyId(null);
      setConfirmAdminChange(null);
    }
  };

  return (
    <div style={{ padding: embedded ? 0 : (isMobile ? '1.25rem 1rem 3rem' : '2rem 1.5rem 4rem') }}>
      <style>{`.admin-focus:focus-visible { outline: 2px solid ${c.primary}; outline-offset: 2px; }`}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: embedded ? 'flex-end' : 'space-between', gap: '1rem', marginBottom: isMobile ? '0.5rem' : '0.75rem', flexWrap: 'wrap' }}>
        {!embedded && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: c.text, margin: '0 0 0.4rem', letterSpacing: '0.02em', lineHeight: 1 }}>
              MEMBERS
            </h1>
            <p style={{ color: c.textSecondary, fontSize: '0.9rem', margin: 0 }}>
              Registered accounts — update contact info or send a password reset link.
            </p>
          </div>
        )}
        <button type="button" onClick={reload} disabled={loading} className="admin-focus" style={ghostBtnStyle(c, loading)}>
          <span style={{ display: 'inline-block', animation: loading ? 'spin 0.9s linear infinite' : 'none' }}>↻</span>
          {loading ? 'Syncing…' : 'Refresh'}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <input
        type="search"
        placeholder="Search by name, mobile, or email…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="admin-focus"
        style={{ ...inputStyle(c), maxWidth: 340, marginBottom: isMobile ? '1rem' : '1.25rem', display: 'block' }}
      />

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: '60px', borderRadius: '0.65rem', backgroundColor: c.surface, border: `1px solid ${c.border}`, opacity: 1 - i * 0.18 }} />
          ))}
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', border: `1px dashed ${c.border}`, borderRadius: '0.75rem', color: c.textSecondary, fontSize: '0.88rem' }}>
          {members.length === 0 ? 'No registered members yet.' : 'No members match your search.'}
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: '1rem', overflow: 'hidden' }}>
          {!isMobile && (
            <div style={{ display: 'grid', gridTemplateColumns: COLUMNS, gap: '1rem', alignItems: 'center', padding: '1rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: c.textSecondary, borderBottom: `1px solid ${c.border}` }}>
              <div>Name</div><div>Mobile</div><div>Email</div><div>Gender / Side</div><div>Admin</div><div>Actions</div>
            </div>
          )}

          {visible.map((m, i) => {
            const busy = busyId === m.id;
            const isLast = i === visible.length - 1;
            const confirming = confirmAdminChange === m.id;

            const adminPill = m.isAdmin ? (
              <span style={{ display: 'inline-flex', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: `${accent}22`, color: accent, whiteSpace: 'nowrap' }}>
                Admin
              </span>
            ) : (
              <span style={{ fontSize: '0.78rem', color: c.textSecondary }}>—</span>
            );

            const actions = (
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <IconBtn c={c} label={`Edit ${m.name}`} onClick={() => setEditing({ id: m.id, data: toEditable(m) })}><Pencil size={14} /></IconBtn>
                <IconBtn c={c} label={`Send password reset to ${m.name}`} onClick={() => handleResetPassword(m)} disabled={busy || !m.email}><Mail size={14} /></IconBtn>
                {confirming ? (
                  <>
                    <button type="button" onClick={() => handleToggleAdmin(m)} disabled={busy} className="admin-focus"
                      style={{ padding: '0.35rem 0.7rem', borderRadius: '0.4rem', border: 'none', background: m.isAdmin ? '#ef4444' : accent, color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: busy ? 0.5 : 1 }}>
                      {busy ? '…' : m.isAdmin ? 'Confirm remove' : 'Confirm make admin'}
                    </button>
                    <button type="button" onClick={() => setConfirmAdminChange(null)} className="admin-focus"
                      style={{ padding: '0.35rem 0.6rem', borderRadius: '0.4rem', border: `1px solid ${c.border}`, background: 'transparent', color: c.text, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <IconBtn
                    c={c}
                    label={
                      m.isAdmin && adminCount <= 1
                        ? 'At least one admin is required — promote someone else first'
                        : m.isAdmin
                          ? `Remove admin from ${m.name}`
                          : `Make ${m.name} an admin`
                    }
                    danger={m.isAdmin}
                    disabled={m.isAdmin && adminCount <= 1}
                    onClick={() => setConfirmAdminChange(m.id)}
                  >
                    {m.isAdmin ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                  </IconBtn>
                )}
              </div>
            );

            const isEditing = editing?.id === m.id;
            const editPanel = isEditing && editing && (
              <div style={{ padding: isMobile ? '0 1.1rem 1.1rem' : '0 1.25rem 1.25rem', backgroundColor: c.surfaceAlt, borderBottom: isLast ? 'none' : `1px solid ${c.border}` }}>
                <MemberEditForm
                  data={editing.data}
                  setData={(d) => setEditing({ ...editing, data: d })}
                  c={c}
                  onSave={handleSave}
                  onCancel={() => setEditing(null)}
                  busy={busyId === editing.id}
                />
              </div>
            );

            if (isMobile) {
              return (
                <React.Fragment key={m.id}>
                  <div style={{ padding: '1rem 1.1rem', backgroundColor: isEditing ? c.surfaceAlt : undefined, borderBottom: (isLast && !isEditing) ? 'none' : `1px solid ${c.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: c.text }}>{m.name}</div>
                        <div style={{ fontSize: '0.78rem', color: c.textSecondary, marginTop: '0.15rem' }}>{m.mobile}{m.email ? ` · ${m.email}` : ''}</div>
                        <div style={{ fontSize: '0.78rem', color: c.textSecondary, marginTop: '0.15rem' }}>{[m.gender, m.side].filter(Boolean).join(' · ') || '—'}</div>
                      </div>
                      {adminPill}
                    </div>
                    <div style={{ marginTop: '0.75rem' }}>{actions}</div>
                  </div>
                  {editPanel}
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={m.id}>
                <div style={{ display: 'grid', gridTemplateColumns: COLUMNS, gap: '1rem', alignItems: 'center', padding: '0.85rem 1.25rem', backgroundColor: isEditing ? c.surfaceAlt : undefined, borderBottom: (isLast && !isEditing) ? 'none' : `1px solid ${c.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                  <div style={{ fontSize: '0.85rem', color: c.textSecondary }}>{m.mobile}</div>
                  <div style={{ fontSize: '0.85rem', color: c.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email || '—'}</div>
                  <div style={{ fontSize: '0.85rem', color: c.textSecondary }}>{[m.gender, m.side].filter(Boolean).join(' · ') || '—'}</div>
                  <div>{adminPill}</div>
                  {actions}
                </div>
                {editPanel}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */

const MemberEditForm: React.FC<{
  data: ProfileEdit;
  setData: (d: ProfileEdit) => void;
  c: ColorPalette;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
}> = ({ data, setData, c, onSave, onCancel, busy }) => {
  const set = (patch: Partial<ProfileEdit>) => setData({ ...data, ...patch });

  return (
    <div style={{ paddingTop: '0.85rem' }}>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: c.text, marginBottom: '1rem' }}>Edit Member</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.65rem' }}>
        <FieldInput label="Name" value={data.name ?? ''} onChange={(v) => set({ name: v })} c={c} />
        <FieldInput label="Mobile" value={data.mobile ?? ''} onChange={(v) => set({ mobile: v })} c={c} />
        <FieldInput label="Email" value={data.email ?? ''} onChange={(v) => set({ email: v })} c={c} type="email" hint="Contact copy only — doesn't change their sign-in email." />
        <FieldInput label="Birthday" value={data.birthday ?? ''} onChange={(v) => set({ birthday: v })} c={c} type="date" />
        <div>
          <label style={labelStyle(c)}>Gender</label>
          <select value={data.gender ?? ''} onChange={(e) => set({ gender: (e.target.value || null) as ProfileEdit['gender'] })} className="admin-focus" style={inputStyle(c)}>
            <option value="">—</option>
            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle(c)}>Side</label>
          <select value={data.side ?? ''} onChange={(e) => set({ side: (e.target.value || null) as ProfileEdit['side'] })} className="admin-focus" style={inputStyle(c)}>
            <option value="">—</option>
            {SIDES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <FieldInput label="Weight (kg)" value={data.weight != null ? String(data.weight) : ''} onChange={(v) => set({ weight: v ? Number(v) : null })} c={c} type="number" />
        <FieldInput label="Emergency Contact Name" value={data.emergencyContactName ?? ''} onChange={(v) => set({ emergencyContactName: v })} c={c} />
        <FieldInput label="Emergency Contact Phone" value={data.emergencyContactPhone ?? ''} onChange={(v) => set({ emergencyContactPhone: v })} c={c} />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button type="button" onClick={onSave} disabled={busy} className="admin-focus" style={{ ...addBtnStyle(c), opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} className="admin-focus" style={ghostBtnStyle(c, busy)}>Cancel</button>
      </div>
    </div>
  );
};

const FieldInput: React.FC<{ label: string; value: string; onChange: (v: string) => void; c: ColorPalette; type?: string; hint?: string }> = ({ label, value, onChange, c, type = 'text', hint }) => (
  <div>
    <label style={labelStyle(c)}>{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="admin-focus" style={inputStyle(c)} />
    {hint && <span style={{ display: 'block', fontSize: '0.68rem', color: c.textSecondary, marginTop: '0.25rem' }}>{hint}</span>}
  </div>
);

const IconBtn: React.FC<{ c: ColorPalette; label: string; danger?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }> = ({ c, label, danger, disabled, onClick, children }) => (
  <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className="admin-focus"
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '0.4rem', border: `1px solid ${danger ? '#ef444455' : c.border}`, background: 'transparent', color: danger ? '#ef4444' : c.textSecondary, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, flexShrink: 0 }}>
    {children}
  </button>
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

// Crude luminance check on the palette's own background — lets inputStyle pick
// a fill that clearly reads as editable in both themes (same fix as the
// Training schedule form's inputs — see AdminEvents.tsx).
const isDarkPalette = (c: ColorPalette): boolean => {
  const hex = c.background.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
};

const inputStyle = (c: ColorPalette): React.CSSProperties => ({
  width: '100%',
  padding: '0.5rem 0.7rem',
  borderRadius: '0.45rem',
  border: `1px solid ${c.border}`,
  // c.surface (not surfaceAlt) in dark mode: the edit panel itself sits on
  // c.surfaceAlt, and inputs need to read as distinct from that panel too.
  backgroundColor: isDarkPalette(c) ? c.surface : '#ffffff',
  color: c.text,
  fontSize: '0.88rem',
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

const ghostBtnStyle = (c: ColorPalette, disabled?: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.5rem 1rem',
  minHeight: 40,
  borderRadius: '999px',
  border: `1px solid ${c.border}`,
  background: 'transparent',
  color: disabled ? c.textSecondary : c.text,
  fontWeight: 500,
  fontSize: '0.82rem',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'inherit',
});
