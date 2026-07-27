import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarDays, Backpack, MessageCircle, Shirt, Trophy, Lock, Check } from 'lucide-react';
import { checkRegistrationToken, registerWithEmail, type UserGender, type UserSide } from '../utils/users';
import { ageFromBirthday } from '../utils/bookings';
import {
  OnboardingShell,
  OnbInfoRow,
  useOnbTokens,
  onbLabelStyle,
  onbFieldStyle,
  onbPrimaryBtnStyle,
} from '../components/OnboardingShell';

const GENDERS: UserGender[] = ['Male', 'Female'];
const SIDES: UserSide[] = ['Left', 'Right', 'Coxswain', 'Coach'];

const STEP_TITLE: Record<number, string> = { 1: 'Set your password', 2: 'Welcome aboard', 3: 'One last thing' };
const STEP_SUB: Record<number, string> = {
  1: 'Choose a password to secure your crew account.',
  2: 'A couple of details so we can seat you in the boat.',
  3: "Who should we call if something comes up on the water? Totally optional.",
};
const STEP_META: Record<number, string> = { 1: 'Your account', 2: 'On the boat', 3: 'Safety check' };

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const onb = useOnbTokens();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [gate, setGate] = useState<'checking' | 'invalid' | 'valid'>('checking');
  const [screen, setScreen] = useState<'register' | 'welcome'>('register');
  const [step, setStep] = useState(1);

  // Carried from the application via the token — not re-asked in the flow.
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState<UserGender | ''>('');
  const [birthday, setBirthday] = useState('');
  const [side, setSide] = useState<UserSide | ''>('');
  const [weight, setWeight] = useState('');
  const [emName, setEmName] = useState('');
  const [emPhone, setEmPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pwRules = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Upper & lowercase letters', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: 'A number', met: /[0-9]/.test(password) },
    { label: 'A symbol', met: /[^A-Za-z0-9]/.test(password) },
  ];
  const pwScore = pwRules.filter((r) => r.met).length;
  const PW_STRENGTH_LABEL: Record<number, string> = { 0: 'Weak', 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong' };
  const PW_STRENGTH_COLOR: Record<number, string> = { 0: '#ef4444', 1: '#ef4444', 2: '#f59e0b', 3: '#3d7eff', 4: '#22c55e' };

  useEffect(() => {
    if (!token) {
      setGate('invalid');
      return;
    }
    let cancelled = false;
    checkRegistrationToken(token)
      .then((applicant) => {
        if (cancelled) return;
        if (applicant) {
          setEmail(applicant.email);
          setName(applicant.name);
          setMobile(applicant.mobile);
          setGate('valid');
        } else {
          setGate('invalid');
        }
      })
      .catch(() => {
        if (!cancelled) setGate('invalid');
      });
    return () => { cancelled = true; };
  }, [token]);

  const firstName = (name || '').trim().split(/\s+/)[0] || 'friend';

  const validateStep = (): string => {
    if (step === 1) {
      if (!password.trim()) return 'Password is required.';
      if (password.length < 8) return 'Password must be at least 8 characters.';
      if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) return 'Password needs both upper and lowercase letters.';
      if (!/[0-9]/.test(password)) return 'Password needs at least one number.';
      if (password !== confirmPassword) return 'Passwords do not match.';
    }
    if (step === 2) {
      if (!gender) return 'Please select your gender.';
      if (!birthday) return 'Please enter your date of birth.';
      const age = ageFromBirthday(birthday);
      if (age === undefined || age < 8 || age > 100) return 'Please enter a valid date of birth.';
      const w = Number(weight);
      if (!weight.trim() || Number.isNaN(w) || w < 30 || w > 200) return 'Please enter a weight in kg between 30 and 200.';
    }
    return '';
  };

  const handleBack = () => {
    setError('');
    setStep((s) => Math.max(1, s - 1));
  };

  const handleNext = async () => {
    setError('');
    const v = validateStep();
    if (v) return setError(v);

    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(token, password, {
        mobile,
        name,
        birthday,
        gender: gender as UserGender,
        side: side || null,
        weight: Number(weight),
        emergencyContactName: emName.trim() || undefined,
        emergencyContactPhone: emPhone.trim() || undefined,
      });
      setScreen('welcome');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // ===== GATE (checking / invalid) — not part of the 4-screen design ====
  if (gate !== 'valid') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: onb.bg, color: onb.text, padding: '2rem 1rem', fontFamily: 'var(--font-body)' }}>
        <div style={{ width: '100%', maxWidth: '420px', background: onb.panel, borderRadius: '1rem', border: `1px solid ${onb.border}`, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,20,80,.45)' }}>
          <div style={{ height: '3px', background: onb.gradient }} />
          <div style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
            {gate === 'checking' ? (
              <p style={{ color: onb.sub, margin: 0 }}>Checking your registration link…</p>
            ) : (
              <>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: onb.text, margin: '0 0 0.75rem' }}>Registration is by invitation</h1>
                <p style={{ color: onb.sub, fontSize: '0.9rem', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
                  This link is invalid, expired, or already used. Registration links expire 7 days after approval — if yours has lapsed, contact the team admin for a new one, or apply to join below.
                </p>
                <button className="onb-btn" onClick={() => navigate('/join-team')} style={{ ...onbPrimaryBtnStyle(onb), width: 'auto', padding: '0.85rem 1.5rem' }}>
                  <span>Apply to Join</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== WELCOME =====
  if (screen === 'welcome') {
    const quickLinks: { Icon: typeof CalendarDays; label: string; to: string }[] = [
      { Icon: CalendarDays, label: 'Training', to: '/training' },
      { Icon: Shirt, label: 'Gear', to: '/shop' },
      { Icon: Trophy, label: 'Events', to: '/events' },
    ];
    return (
      <OnboardingShell screen="welcome" firstName={firstName}>
        <p style={{ color: onb.sub, fontSize: '0.9rem', margin: '0 0 1.2rem', lineHeight: 1.55, animation: 'onbRiseIn .5s .05s both' }}>
          Here's everything you need for your first session, {firstName}.
        </p>

        <OnbInfoRow icon={<CalendarDays size={20} />} title="Training" delay=".12s">
          Sat &amp; Sun · 7:00–10:00 AM · Marina Putrajaya / Subang PARC — arrive 15 min early.
        </OnbInfoRow>
        <OnbInfoRow icon={<Backpack size={20} />} title="What to bring" delay=".19s">
          Water, quick-dry clothes, a change of clothes, sunscreen.
        </OnbInfoRow>
        <OnbInfoRow icon={<MessageCircle size={20} />} title="Questions?" delay=".26s">
          Message admin@alpaspinas.com or @alpaspinasdbt — we've got you on day one.
        </OnbInfoRow>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', margin: '1.1rem 0 1.2rem', animation: 'onbRiseIn .5s .33s both' }}>
          {quickLinks.map(({ Icon, label, to }) => (
            <button
              key={label}
              className="onb-quicklink"
              onClick={() => navigate(to)}
              style={{ background: onb.field, border: `1px solid ${onb.border}`, borderRadius: '0.7rem', padding: '0.9rem 0.5rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: onb.text, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Icon size={22} color={onb.accentLight} />
              {label}
            </button>
          ))}
        </div>

        <button className="onb-btn" onClick={() => navigate('/training')} style={{ ...onbPrimaryBtnStyle(onb), animation: 'onbRiseIn .5s .4s both' }}>
          <span>See this week's training</span>
        </button>
      </OnboardingShell>
    );
  }

  // ===== REGISTER WIZARD =====
  return (
    <OnboardingShell screen="register" firstName={firstName}>
      {/* progress bar */}
      <div style={{ height: '7px', background: onb.border, borderRadius: '99px', overflow: 'hidden', marginBottom: '0.6rem', animation: 'onbRiseIn .5s .02s both' }}>
        <i style={{ display: 'block', height: '100%', background: onb.gradient, borderRadius: '99px', transition: 'width .5s cubic-bezier(.2,.7,.2,1)', width: `${Math.round((step / 3) * 100)}%` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: onb.sub, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.3rem', animation: 'onbRiseIn .5s .06s both' }}>
        <span>Step {step} of 3</span>
        <span style={{ color: onb.accentLight }}>{STEP_META[step]}</span>
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: onb.text, margin: '0 0 0.4rem', letterSpacing: '-0.02em', animation: 'onbRiseIn .5s .1s both' }}>{STEP_TITLE[step]}</h2>
      <p style={{ color: onb.sub, fontSize: '0.9rem', margin: '0 0 1.4rem', lineHeight: 1.55, animation: 'onbRiseIn .5s .15s both' }}>{STEP_SUB[step]}</p>

      {error && (
        <div style={{ background: '#ef444418', border: '1px solid #fca5a5', borderRadius: '0.7rem', padding: '0.75rem 0.85rem', color: onb.danger, fontSize: '0.9rem', marginBottom: '1.1rem' }}>
          {error}
        </div>
      )}

      {step === 1 && (
        <>
          <div style={{ marginBottom: '1.1rem', animation: 'onbRiseIn .5s .2s both' }}>
            <label style={onbLabelStyle(onb)}>Email</label>
            <div style={{ ...onbFieldStyle(onb), opacity: 0.72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{email}</span>
              <Lock size={15} color={onb.sub} />
            </div>
          </div>
          <div style={{ marginBottom: '1.1rem', animation: 'onbRiseIn .5s .27s both' }}>
            <label style={onbLabelStyle(onb)}>Create Password</label>
            <div style={{ position: 'relative' }}>
              <input className="onb-field" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...onbFieldStyle(onb), paddingRight: '3.6rem' }} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', top: '50%', right: '0.6rem', transform: 'translateY(-50%)', background: 'none', border: 'none', color: onb.accent, cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.25rem' }}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {password && (
              <div style={{ marginTop: '0.6rem' }}>
                <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.5rem' }}>
                  {pwRules.map((_, i) => (
                    <div key={i} style={{ flex: 1, height: '4px', borderRadius: '99px', background: i < pwScore ? PW_STRENGTH_COLOR[pwScore] : onb.border, transition: 'background .2s' }} />
                  ))}
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: PW_STRENGTH_COLOR[pwScore], marginBottom: '0.5rem' }}>{PW_STRENGTH_LABEL[pwScore]}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem 0.6rem' }}>
                  {pwRules.map((rule) => (
                    <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', color: rule.met ? onb.text : onb.sub }}>
                      <span style={{ flex: '0 0 auto', width: '15px', height: '15px', borderRadius: '50%', border: `1.5px solid ${rule.met ? '#22c55e' : onb.border}`, background: rule.met ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {rule.met && <Check size={10} color="#fff" strokeWidth={3} />}
                      </span>
                      {rule.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ marginBottom: '1.7rem', animation: 'onbRiseIn .5s .34s both' }}>
            <label style={onbLabelStyle(onb)}>Confirm Password</label>
            <input className="onb-field" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Type it again" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={onbFieldStyle(onb)} />
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ marginBottom: '1.1rem', animation: 'onbRiseIn .5s .2s both' }}>
            <label style={onbLabelStyle(onb)}>Gender</label>
            <select className="onb-field" value={gender} onChange={(e) => setGender(e.target.value as UserGender)} style={onbFieldStyle(onb)}>
              <option value="" disabled>Select…</option>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '1.1rem', animation: 'onbRiseIn .5s .23s both' }}>
            <label style={onbLabelStyle(onb)}>Date of Birth</label>
            <input className="onb-field" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} max={new Date().toISOString().slice(0, 10)} style={onbFieldStyle(onb)} />
            <div style={{ fontSize: '0.72rem', color: onb.sub, marginTop: '0.4rem' }}>Used for age-based crews (e.g. Masters 40+) — kept private.</div>
          </div>
          <div style={{ marginBottom: '1.1rem', animation: 'onbRiseIn .5s .27s both' }}>
            <label style={onbLabelStyle(onb)}>Paddling Side / Role</label>
            <select className="onb-field" value={side} onChange={(e) => setSide(e.target.value as UserSide | '')} style={onbFieldStyle(onb)}>
              <option value="">Not sure yet</option>
              {SIDES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <div style={{ fontSize: '0.72rem', color: onb.sub, marginTop: '0.4rem' }}>First time paddling? Leave this — your coach will help you find your side.</div>
          </div>
          <div style={{ marginBottom: '1.7rem', animation: 'onbRiseIn .5s .34s both' }}>
            <label style={onbLabelStyle(onb)}>Weight (kg)</label>
            <input className="onb-field" type="number" inputMode="decimal" placeholder="72" value={weight} onChange={(e) => setWeight(e.target.value)} min={30} max={200} style={onbFieldStyle(onb)} />
            <div style={{ fontSize: '0.72rem', color: onb.sub, marginTop: '0.4rem' }}>Used to balance the boat — kept private.</div>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div style={{ marginBottom: '1.1rem', animation: 'onbRiseIn .5s .2s both' }}>
            <label style={onbLabelStyle(onb)}>Emergency Contact Name <span style={{ textTransform: 'none', fontWeight: 500, letterSpacing: 0 }}>(optional)</span></label>
            <input className="onb-field" placeholder="Full name" value={emName} onChange={(e) => setEmName(e.target.value)} style={onbFieldStyle(onb)} />
          </div>
          <div style={{ marginBottom: '1.7rem', animation: 'onbRiseIn .5s .27s both' }}>
            <label style={onbLabelStyle(onb)}>Emergency Contact Number <span style={{ textTransform: 'none', fontWeight: 500, letterSpacing: 0 }}>(optional)</span></label>
            <input className="onb-field" type="tel" placeholder="+60 12 345 6789" value={emPhone} onChange={(e) => setEmPhone(e.target.value)} style={onbFieldStyle(onb)} />
            <div style={{ fontSize: '0.72rem', color: onb.sub, marginTop: '0.4rem' }}>Only used in a real on-water emergency — add it now or later from your profile.</div>
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: '0.6rem', animation: 'onbRiseIn .5s .42s both' }}>
        <button type="button" className="onb-ghost" onClick={handleBack} disabled={loading || step === 1} style={{ flex: '0 0 38%', background: onb.field, border: `1px solid ${onb.border}`, color: onb.text, borderRadius: '0.75rem', padding: '0.9rem', fontSize: '0.95rem', fontWeight: 700, cursor: loading || step === 1 ? 'not-allowed' : 'pointer', opacity: step === 1 ? 0.5 : 1, minHeight: '46px', fontFamily: 'inherit' }}>
          Back
        </button>
        <button type="button" className="onb-btn" onClick={handleNext} disabled={loading} style={{ ...onbPrimaryBtnStyle(onb), flex: 1, width: 'auto', padding: '0.9rem', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
          <span>{loading ? 'Creating account…' : step === 3 ? 'Finish' : 'Next'}</span>
        </button>
      </div>

      <p style={{ textAlign: 'center', color: onb.sub, margin: '1rem 0 0', fontSize: '0.88rem' }}>
        Already have an account?{' '}
        <button type="button" className="onb-textlink" onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: onb.accent, cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit', fontWeight: 700 }}>
          Sign in
        </button>
      </p>
    </OnboardingShell>
  );
};
