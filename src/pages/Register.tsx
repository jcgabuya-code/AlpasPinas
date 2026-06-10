import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { registerWithEmail, type UserGender, type UserSide } from '../utils/users';

const GENDERS: UserGender[] = ['Male', 'Female'];
const SIDES: UserSide[] = ['Left', 'Right', 'Coxswain', 'Coach'];

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
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+60');
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState<UserGender | ''>('');
  const [side, setSide] = useState<UserSide | ''>('');
  const [weight, setWeight] = useState('');
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

    if (!email.trim()) return setError('Email is required.');
    if (!name.trim()) return setError('Full name is required.');
    if (!mobile.trim()) return setError('Mobile number is required.');
    if (!gender) return setError('Please select your gender.');
    if (!side) return setError('Please select your paddling side / role.');

    const weightNum = Number(weight);
    if (!weight.trim() || Number.isNaN(weightNum) || weightNum < 30 || weightNum > 200) {
      return setError('Please enter a weight in kg between 30 and 200.');
    }

    if (!password.trim()) return setError('Password is required.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setLoading(true);
    try {
      await registerWithEmail(email, password, {
        mobile: `${countryCode}${mobile.trim()}`,
        name,
        birthday: birthday.trim() || undefined,
        gender,
        side,
        weight: weightNum,
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
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
              Complete Your Registration
            </h1>
            <p style={{ color: c.textSecondary, margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
              Use the email your application was approved with.
            </p>
          </div>

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

          {/* Email */}
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Full Name */}
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

          {/* Country Code + Mobile */}
          <div>
            <label style={labelStyle}>Mobile Number</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                style={{ ...inputStyle, flex: '0 0 120px', padding: '0.7rem 0.6rem' }}
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

          {/* Gender */}
          <div>
            <label style={labelStyle}>Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as UserGender)}
              style={inputStyle}
            >
              <option value="" disabled>
                Select…
              </option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Side / Role */}
          <div>
            <label style={labelStyle}>Paddling Side / Role</label>
            <select
              value={side}
              onChange={(e) => setSide(e.target.value as UserSide)}
              style={inputStyle}
            >
              <option value="" disabled>
                Select…
              </option>
              {SIDES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Weight */}
          <div>
            <label style={labelStyle}>Weight (kg)</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="72"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              min={30}
              max={200}
              style={inputStyle}
            />
            <div style={{ fontSize: '0.72rem', color: c.textSecondary, marginTop: '0.3rem' }}>
              Used to balance the boat — kept private.
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              autoComplete="new-password"
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
              autoComplete="new-password"
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

          {/* Footer link */}
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
        </form>
      </div>
    </div>
  );
};
