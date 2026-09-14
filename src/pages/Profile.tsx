import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors, type ColorPalette } from '../styles/colors';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword, type ProfileEdit, type UserGender, type UserSide } from '../utils/users';

const GENDERS: UserGender[] = ['Male', 'Female'];
const SIDES: UserSide[] = ['Left', 'Right', 'Coxswain', 'Coach'];

export const Profile: React.FC = () => {
  const { theme, brand } = useTheme();
  const { user, refreshUser } = useAuth();
  const c = colors[brand][theme];
  const accent = theme === 'dark' ? c.accent : c.primary;

  // Hooks must run unconditionally, so seed from `user` with fallbacks here and
  // only bail on the JSX below — RequireAuth guarantees `user` is set anyway.
  const [data, setData] = useState<ProfileEdit>({
    mobile: user?.mobile ?? '',
    name: user?.name ?? '',
    nickname: user?.nickname ?? '',
    email: user?.email ?? '',
    birthday: user?.birthday ?? '',
    gender: user?.gender ?? null,
    side: user?.side ?? null,
    weight: user?.weight ?? null,
    emergencyContactName: user?.emergencyContactName ?? '',
    emergencyContactPhone: user?.emergencyContactPhone ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  if (!user) return null;

  const set = (patch: Partial<ProfileEdit>) => setData({ ...data, ...patch });

  const labelStyle: React.CSSProperties = {
    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
    color: c.textSecondary, marginBottom: '0.4rem', display: 'block',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.8rem', borderRadius: '0.55rem', border: `1px solid ${c.border}`,
    backgroundColor: c.surface, fontSize: '0.92rem', color: c.text, boxSizing: 'border-box', fontFamily: 'inherit',
  };
  const card: React.CSSProperties = { backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: '0.85rem', padding: '1.5rem', marginBottom: '1.5rem' };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSavedMsg('');
    if (!data.name?.trim()) { setSaveError('Name is required.'); return; }
    setSaving(true);
    try {
      await updateProfile(user.id, data);
      await refreshUser();
      setSavedMsg('Profile updated.');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not update your profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMsg('');
    if (newPassword.length < 8) { setPasswordError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords don’t match.'); return; }
    setChangingPassword(true);
    try {
      await changePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg('Password updated.');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Could not update your password.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <section style={{ padding: '2.5rem 1.5rem 5rem', backgroundColor: c.background, minHeight: '60vh' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.25rem, 6vw, 3.5rem)', color: c.text, margin: '0 0 0.5rem', letterSpacing: '0.02em' }}>
          MY <span style={{ color: accent }}>PROFILE</span>
        </h1>
        <p style={{ color: c.textSecondary, fontSize: '1rem', margin: '0 0 2rem', lineHeight: 1.6 }}>
          Keep your info up to date and manage your account.
        </p>

        {/* Profile info */}
        <form onSubmit={handleSave} style={card}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: c.text, margin: '0 0 1.1rem' }}>Profile Info</h2>

          {saveError && (
            <div style={{ backgroundColor: '#ef444418', border: '1px solid #fca5a5', borderRadius: '0.55rem', padding: '0.7rem 0.85rem', color: c.danger, fontSize: '0.85rem', marginBottom: '1rem' }}>
              {saveError}
            </div>
          )}
          {savedMsg && (
            <div style={{ backgroundColor: `${c.primary}18`, border: `1px solid ${c.primary}55`, borderRadius: '0.55rem', padding: '0.7rem 0.85rem', color: c.text, fontSize: '0.85rem', marginBottom: '1rem' }}>
              {savedMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input value={data.name ?? ''} onChange={(e) => set({ name: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Nickname</label>
              <input value={data.nickname ?? ''} onChange={(e) => set({ nickname: e.target.value })} placeholder="What should we call you?" style={inputStyle} />
              <span style={{ display: 'block', fontSize: '0.72rem', color: c.textSecondary, marginTop: '0.3rem' }}>Shown on training sign-up rosters instead of your full name.</span>
            </div>
            <div>
              <label style={labelStyle}>Mobile</label>
              <input value={data.mobile ?? ''} onChange={(e) => set({ mobile: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={data.email ?? ''} onChange={(e) => set({ email: e.target.value })} style={inputStyle} />
              <span style={{ display: 'block', fontSize: '0.72rem', color: c.textSecondary, marginTop: '0.3rem' }}>Contact copy only — doesn't change your sign-in email.</span>
            </div>
            <div>
              <label style={labelStyle}>Birthday</label>
              <input type="date" value={data.birthday ?? ''} onChange={(e) => set({ birthday: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Gender</label>
              <select value={data.gender ?? ''} onChange={(e) => set({ gender: (e.target.value || null) as ProfileEdit['gender'] })} style={inputStyle}>
                <option value="">—</option>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Side</label>
              <select value={data.side ?? ''} onChange={(e) => set({ side: (e.target.value || null) as ProfileEdit['side'] })} style={inputStyle}>
                <option value="">—</option>
                {SIDES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Weight (kg)</label>
              <input type="number" value={data.weight != null ? String(data.weight) : ''} onChange={(e) => set({ weight: e.target.value ? Number(e.target.value) : null })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Emergency Contact Name</label>
              <input value={data.emergencyContactName ?? ''} onChange={(e) => set({ emergencyContactName: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Emergency Contact Phone</label>
              <input value={data.emergencyContactPhone ?? ''} onChange={(e) => set({ emergencyContactPhone: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{ marginTop: '1.25rem', background: accent, color: '#fff', border: 'none', borderRadius: '0.6rem', padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>

        {/* Password */}
        <form onSubmit={handleChangePassword} style={card}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: c.text, margin: '0 0 0.5rem' }}>Password</h2>
          <p style={{ color: c.textSecondary, fontSize: '0.88rem', margin: '0 0 1rem', lineHeight: 1.6 }}>
            You're signed in, so this takes effect right away — no email needed.
          </p>

          {passwordError && (
            <div style={{ backgroundColor: '#ef444418', border: '1px solid #fca5a5', borderRadius: '0.55rem', padding: '0.7rem 0.85rem', color: c.danger, fontSize: '0.85rem', marginBottom: '1rem' }}>
              {passwordError}
            </div>
          )}
          {passwordMsg && (
            <div style={{ backgroundColor: `${c.primary}18`, border: `1px solid ${c.primary}55`, borderRadius: '0.55rem', padding: '0.7rem 0.85rem', color: c.text, fontSize: '0.85rem', marginBottom: '1rem' }}>
              {passwordMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={labelStyle}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: '3.6rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', top: '50%', right: '0.6rem', transform: 'translateY(-50%)', background: 'none', border: 'none', color: accent, cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.25rem' }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            style={{ background: 'transparent', color: c.text, border: `1px solid ${c.border}`, borderRadius: '0.6rem', padding: '0.65rem 1.25rem', fontSize: '0.88rem', fontWeight: 700, cursor: changingPassword ? 'not-allowed' : 'pointer', opacity: changingPassword ? 0.7 : 1 }}
          >
            {changingPassword ? 'Saving…' : 'Change Password'}
          </button>
        </form>

        {/* Quick links */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <QuickLink to="/training" label="My Training Bookings" hint="See your upcoming sessions" c={c} />
          <QuickLink to="/orders" label="My Gear Orders" hint="Track your reservations" c={c} />
        </div>
      </div>
    </section>
  );
};

const QuickLink: React.FC<{ to: string; label: string; hint: string; c: ColorPalette }> = ({ to, label, hint, c }) => (
  <Link
    to={to}
    style={{ flex: '1 1 200px', backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: '0.85rem', padding: '1.1rem 1.25rem', textDecoration: 'none', display: 'block' }}
  >
    <div style={{ fontWeight: 700, color: c.text, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{label} →</div>
    <div style={{ fontSize: '0.8rem', color: c.textSecondary }}>{hint}</div>
  </Link>
);
