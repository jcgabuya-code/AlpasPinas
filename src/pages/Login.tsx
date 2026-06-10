import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { theme } = useTheme();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed.';
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
              Sign In
            </h1>
            <p style={{ color: c.textSecondary, margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
              Welcome back to AlpasPinas
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Register link */}
          <p style={{ textAlign: 'center', color: c.textSecondary, margin: 0, fontSize: '0.9rem' }}>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              style={{
                background: 'none',
                border: 'none',
                color: c.primary,
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: 'inherit',
              }}
            >
              Register
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};
