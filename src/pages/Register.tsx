import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { registerWithToken } from '../utils/users';

const COUNTRY_CODES = [
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+1', country: 'USA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
];

export const Register: React.FC = () => {
  const { theme } = useTheme();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');
  const [isTokenMode] = useState(!!token);

  const [countryCode, setCountryCode] = useState('+60');
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const c = {
    background: theme === 'dark' ? '#0b1014' : '#f7faf8',
    surface: theme === 'dark' ? '#121820' : '#ffffff',
    text: theme === 'dark' ? '#f5f7f5' : '#0b1014',
    textSecondary: theme === 'dark' ? '#9aa8a0' : '#5b6863',
    primary: '#10b981',
    primaryDark: '#047857',
    primaryLight: '#6ee7b7',
    border: theme === 'dark' ? '#243240' : '#dde6e0',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: c.textSecondary,
    marginBottom: '0.4rem',
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.7rem 0.85rem',
    borderRadius: '0.55rem',
    border: `1px solid ${c.border}`,
    backgroundColor: c.surface,
    fontSize: '0.95rem',
    color: c.text,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isTokenMode && token) {
        // Token-based registration (approved application)
        await registerWithToken(token, password, birthday.trim() || undefined);
      } else {
        // Direct registration (legacy)
        if (!mobile.trim() || !name.trim()) {
          setError('Mobile and name are required.');
          setLoading(false);
          return;
        }
        const fullMobile = `${countryCode}${mobile.trim()}`;
        await register(
          fullMobile,
          name.trim(),
          email.trim() || undefined,
          birthday.trim() || undefined,
          password,
        );
      }
      navigate('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const gradientStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #047857 0%, #10b981 55%, #6ee7b7 100%)',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.background,
        padding: '2rem 1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: c.surface,
          borderRadius: '0.95rem',
          border: `1px solid ${c.border}`,
          overflow: 'hidden',
          boxShadow: `0 24px 80px ${c.primary}22`,
        }}
      >
        {/* Gradient stripe */}
        <div style={{ height: '3px', ...gradientStyle }} />

        {/* Form content */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: c.text,
                margin: 0,
                marginBottom: '0.5rem',
              }}
            >
              {isTokenMode ? 'Complete Your Registration' : 'Create Account'}
            </h1>
            <p style={{ color: c.textSecondary, margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
              {isTokenMode ? 'Set your password to activate your account' : 'Join the AlpasPinas team'}
            </p>
          </div>

          {!isTokenMode && !token && (
            <div
              style={{
                backgroundColor: '#dbeafe',
                border: `1px solid #93c5fd`,
                borderRadius: '0.55rem',
                padding: '0.75rem 0.85rem',
                color: '#1e40af',
                fontSize: '0.9rem',
              }}
            >
              ℹ️ Direct registration is currently disabled. Click "Join the Team" to apply.
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div
              style={{
                backgroundColor: '#ef444418',
                border: `1px solid #fca5a5`,
                borderRadius: '0.55rem',
                padding: '0.75rem 0.85rem',
                color: '#fca5a5',
                fontSize: '0.9rem',
              }}
            >
              {error}
            </div>
          )}

          {!isTokenMode && (
            <>
              {/* Country Code + Mobile */}
              <div>
                <label style={labelStyle}>Mobile Number</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    style={{
                      ...inputStyle,
                      flex: '0 0 120px',
                      padding: '0.7rem 0.6rem',
                    }}
                  >
                    {COUNTRY_CODES.map((cc) => (
                      <option key={cc.code} value={cc.code}>
                        {cc.flag} {cc.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="123456789"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  placeholder="Juan Dela Cruz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>Email (Optional)</label>
                <input
                  type="email"
                  placeholder="juan@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </>
          )}

          {/* Birthday */}
          <div>
            <label style={labelStyle}>Birthday (Optional)</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...gradientStyle,
              color: 'white',
              border: 'none',
              borderRadius: '0.6rem',
              padding: '0.85rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: `0 8px 24px ${c.primary}33`,
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          {/* Footer links */}
          {!isTokenMode && (
            <p style={{ textAlign: 'center', color: c.textSecondary, margin: 0, fontSize: '0.9rem' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: c.primary,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: 'inherit',
                }}
              >
                Sign in
              </button>
            </p>
          )}
          {isTokenMode && (
            <p style={{ textAlign: 'center', color: c.textSecondary, margin: 0, fontSize: '0.85rem' }}>
              This link will expire in 7 days
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
