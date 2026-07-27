import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Clock } from 'lucide-react';
import { submitApplication } from '../utils/users';
import {
  OnboardingShell,
  OnbInfoRow,
  useOnbTokens,
  onbLabelStyle,
  onbFieldStyle,
  onbPrimaryBtnStyle,
  onbGhostBtnStyle,
} from '../components/OnboardingShell';

const COUNTRY_CODES = [
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+1', country: 'USA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
];

export const JoinTeam: React.FC = () => {
  const navigate = useNavigate();
  const onb = useOnbTokens();

  const [countryCode, setCountryCode] = useState('+60');
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<null | { autoApproved: boolean; emailSent: boolean }>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!mobile.trim() || !name.trim() || !email.trim()) {
      setError('Mobile, name, and email are required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const fullMobile = `${countryCode}${mobile.trim()}`;
      const result = await submitApplication(fullMobile, name.trim(), email.trim());
      setSuccess(
        result.autoApproved
          ? { autoApproved: true, emailSent: result.emailSent }
          : { autoApproved: false, emailSent: false },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const errorBanner = error && (
    <div style={{ background: '#ef444418', border: '1px solid #fca5a5', borderRadius: '0.7rem', padding: '0.75rem 0.85rem', color: onb.danger, fontSize: '0.9rem', marginBottom: '1.1rem' }}>
      {error}
    </div>
  );

  // ===== APPLIED =====
  if (success) {
    return (
      <OnboardingShell screen="applied">
        <div style={{ textAlign: 'center' }}>
          {/* animated check */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div className="onb-ring" style={{ position: 'absolute', width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(61,126,255,.35)' }} />
            <svg viewBox="0 0 52 52" width="66" height="66" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="26" cy="26" r="24" stroke="rgba(61,126,255,.35)" strokeWidth="2" />
              <path className="onb-check" d="M15 27 l8 8 l15-16" stroke={onb.accent} strokeWidth="3.5" />
            </svg>
          </div>

          {success.autoApproved ? (
            <>
              <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: onb.text, margin: '0 0 0.5rem', letterSpacing: '-0.02em', animation: 'onbRiseIn .5s .1s both' }}>You're on the list!</h2>
              <p style={{ color: onb.sub, fontSize: '0.9rem', margin: '0 0 0.7rem', lineHeight: 1.55, animation: 'onbRiseIn .5s .16s both' }}>
                Thanks for applying to AlpasPinas.{' '}
                {success.emailSent ? "We've sent your registration link to" : 'Your registration link is ready.'}
              </p>
              {success.emailSent ? (
                <div style={{ display: 'inline-block', background: onb.field, border: `1px solid ${onb.border}`, color: onb.accentLight, padding: '0.4rem 0.9rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, animation: 'onbRiseIn .5s .22s both' }}>
                  {email.trim()}
                </div>
              ) : (
                <p style={{ color: onb.sub, fontSize: '0.85rem', margin: 0, animation: 'onbRiseIn .5s .22s both' }}>
                  The email didn't go through — contact the team admin to have it re-sent.
                </p>
              )}

              <div style={{ textAlign: 'left', marginTop: '1.6rem' }}>
                <OnbInfoRow icon={<Mail size={20} />} title="Check your inbox" delay=".3s">
                  Open the link to set your password. Peek in spam if it's hiding.
                </OnbInfoRow>
                <OnbInfoRow icon={<Clock size={20} />} title="Valid for 7 days" delay=".38s">
                  Link expires a week after approval — no rush, but don't sit on it.
                </OnbInfoRow>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.2rem', animation: 'onbRiseIn .5s .46s both' }}>
                <button className="onb-ghost" style={onbGhostBtnStyle(onb)} onClick={() => navigate('/#training')}>See training</button>
                <button className="onb-ghost" style={onbGhostBtnStyle(onb)} onClick={() => window.open('https://instagram.com/alpaspinasdbt', '_blank', 'noopener,noreferrer')}>Follow us</button>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: onb.text, margin: '0 0 0.5rem', letterSpacing: '-0.02em', animation: 'onbRiseIn .5s .1s both' }}>Application received!</h2>
              <p style={{ color: onb.sub, fontSize: '0.9rem', margin: '0 0 0.7rem', lineHeight: 1.55, animation: 'onbRiseIn .5s .16s both' }}>
                Thanks for applying to AlpasPinas. Our admin team will review your application and email your registration link shortly.
              </p>
              <div style={{ display: 'inline-block', background: onb.field, border: `1px solid ${onb.border}`, color: onb.accentLight, padding: '0.4rem 0.9rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, animation: 'onbRiseIn .5s .22s both' }}>
                {email.trim()}
              </div>
            </>
          )}

          <p style={{ textAlign: 'center', margin: '1.1rem 0 0', animation: 'onbRiseIn .5s .54s both' }}>
            <button className="onb-textlink" onClick={() => navigate('/')} style={{ color: onb.accent, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit', fontWeight: 800 }}>
              Back to home
            </button>
          </p>
        </div>
      </OnboardingShell>
    );
  }

  // ===== APPLY =====
  return (
    <OnboardingShell screen="apply">
      <form onSubmit={handleSubmit}>
        <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: onb.text, margin: '0 0 0.4rem', letterSpacing: '-0.02em', animation: 'onbRiseIn .5s .02s both' }}>Paddle with us</h2>
        <p style={{ color: onb.sub, fontSize: '0.9rem', margin: '0 0 1.6rem', lineHeight: 1.55, animation: 'onbRiseIn .5s .07s both' }}>
          Drop your details and we'll get you on the water. It takes about a minute.
        </p>

        {errorBanner}

        <div style={{ marginBottom: '1.1rem', animation: 'onbRiseIn .5s .13s both' }}>
          <label style={onbLabelStyle(onb)}>Full Name</label>
          <input className="onb-field" placeholder="Juan Dela Cruz" value={name} onChange={(e) => setName(e.target.value)} style={onbFieldStyle(onb)} />
        </div>
        <div style={{ marginBottom: '1.1rem', animation: 'onbRiseIn .5s .2s both' }}>
          <label style={onbLabelStyle(onb)}>Email Address</label>
          <input className="onb-field" type="email" placeholder="juan@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={onbFieldStyle(onb)} />
        </div>
        <div style={{ marginBottom: '1.7rem', animation: 'onbRiseIn .5s .27s both' }}>
          <label style={onbLabelStyle(onb)}>Mobile Number</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select className="onb-field" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} style={{ ...onbFieldStyle(onb), flex: '0 0 96px', padding: '0.75rem 0.6rem' }}>
              {COUNTRY_CODES.map((cc) => (
                <option key={cc.code} value={cc.code}>{cc.flag} {cc.code}</option>
              ))}
            </select>
            <input className="onb-field" type="tel" placeholder="123456789" value={mobile} onChange={(e) => setMobile(e.target.value)} style={{ ...onbFieldStyle(onb), flex: 1 }} />
          </div>
        </div>

        <button type="submit" className="onb-btn" disabled={loading} style={{ ...onbPrimaryBtnStyle(onb), opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer', animation: 'onbRiseIn .5s .34s both' }}>
          <span>{loading ? 'Submitting…' : 'Submit Application'}</span>
        </button>

        <p style={{ textAlign: 'center', margin: '1rem 0 0', animation: 'onbRiseIn .5s .4s both' }}>
          <button type="button" className="onb-textlink" onClick={() => navigate('/')} style={{ color: onb.sub, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'inherit', fontWeight: 600 }}>
            Back to home
          </button>
        </p>
      </form>
    </OnboardingShell>
  );
};
