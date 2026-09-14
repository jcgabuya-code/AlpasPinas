import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors, brandGradient } from '../styles/colors';
import { supabase } from '../utils/supabase';

/**
 * Lands here from the email Supabase sends for both the public "forgot
 * password" flow and an admin's "Send password reset" action — same link
 * shape either way. `detectSessionInUrl` (see utils/supabase.ts) already
 * turns the emailed link's token into a live "recovery" session before this
 * component mounts; from here it's just "set a new password".
 */
export const ResetPassword: React.FC = () => {
  const { theme, brand } = useTheme();
  const navigate = useNavigate();
  const c = colors[brand][theme];

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
  }, []);

  const gradientStyle: React.CSSProperties = { background: brandGradient(brand, theme) };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
    color: c.textSecondary, marginBottom: '0.4rem', display: 'block',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.7rem 0.85rem', borderRadius: '0.55rem', border: `1px solid ${c.border}`,
    backgroundColor: c.surface, fontSize: '0.95rem', color: c.text, boxSizing: 'border-box', fontFamily: 'inherit',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords don’t match.'); return; }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not set your new password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: c.background, padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '420px', backgroundColor: c.surface, borderRadius: '0.95rem', border: `1px solid ${c.border}`, overflow: 'hidden', boxShadow: `0 24px 80px ${c.primary}22` }}>
        <div style={{ height: '3px', ...gradientStyle }} />
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: c.text, margin: 0, marginBottom: '0.5rem' }}>Set New Password</h1>
            <p style={{ color: c.textSecondary, margin: 0, fontSize: '0.9rem' }}>
              {done ? 'Password updated — redirecting you to sign in…' : 'Choose a new password for your account.'}
            </p>
          </div>

          {!ready && !done && (
            <p style={{ color: c.textSecondary, fontSize: '0.9rem', margin: 0 }}>
              This link looks invalid or expired. Ask an admin to send you a new one, or use "Forgot password" from the sign-in page.
            </p>
          )}

          {ready && !done && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {error && (
                <div style={{ backgroundColor: '#ef444418', border: '1px solid #fca5a5', borderRadius: '0.55rem', padding: '0.75rem 0.85rem', color: c.danger, fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}
              <div>
                <label style={labelStyle}>New Password</label>
                <input type="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Confirm Password</label>
                <input type="password" autoComplete="new-password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inputStyle} />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{ ...gradientStyle, color: 'white', border: 'none', borderRadius: '0.6rem', padding: '0.85rem', fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: `0 8px 24px ${c.primary}33`, transition: 'opacity 0.2s' }}
              >
                {loading ? 'Saving…' : 'Save Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
