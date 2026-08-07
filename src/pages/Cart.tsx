import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, submitOrder, type OrderItem, type DeliveryMethod } from '../utils/merch';

const emailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export const Cart: React.FC = () => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const accent = theme === 'dark' ? c.accent : c.primary;
  const { lines, subtotal, setQty, removeItem, clear } = useCart();
  const { user } = useAuth();

  const currency = lines[0]?.currency ?? 'MYR';

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.mobile ?? '');
  const [note, setNote] = useState('');
  const [method, setMethod] = useState<DeliveryMethod>('pickup');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [doneMethod, setDoneMethod] = useState<DeliveryMethod>('pickup');

  const canSubmit = useMemo(
    () =>
      lines.length > 0 &&
      name.trim().length > 1 &&
      emailValid(email) &&
      (method === 'pickup' || address.trim().length > 4) &&
      !submitting,
    [lines.length, name, email, method, address, submitting],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canSubmit) {
      if (name.trim().length <= 1) setError('Please enter your name.');
      else if (!emailValid(email)) setError('Please enter a valid email so we can confirm your order.');
      else if (method === 'delivery' && address.trim().length <= 4) setError('Please enter a delivery address.');
      return;
    }
    setSubmitting(true);
    const items: OrderItem[] = lines.map((l) => ({
      productId: l.productId,
      name: l.name,
      size: l.size,
      qty: l.qty,
      unitPrice: l.unitPrice,
    }));
    try {
      // The confirmation email is sent server-side by a DB trigger on insert
      // (send-order-email Edge Function) — the client just records the order.
      await submitOrder({
        contactName: name.trim(),
        contactEmail: email.trim(),
        contactPhone: phone.trim() || undefined,
        items,
        note: note.trim() || undefined,
        deliveryMethod: method,
        deliveryAddress: method === 'delivery' ? address.trim() : undefined,
      });
      setDoneMethod(method);
      clear();
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (done) {
    return (
      <section style={{ padding: '4rem 1.5rem 6rem', backgroundColor: c.background, minHeight: '60vh' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
          <div
            aria-hidden="true"
            style={{
              width: '4.5rem',
              height: '4.5rem',
              borderRadius: '999px',
              background: c.primary,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1.5rem',
            }}
          >
            ✓
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 6vw, 3rem)', color: c.text, margin: '0 0 0.75rem', letterSpacing: '0.01em' }}>
            ORDER RESERVED
          </h1>
          <p style={{ color: c.textSecondary, lineHeight: 1.7, marginBottom: '2rem' }}>
            Thanks! We've got your reservation and will reach out to <strong style={{ color: c.text }}>{email}</strong> to
            confirm availability{doneMethod === 'delivery' ? ', share an estimated delivery date,' : ''} and arrange payment.
            {doneMethod === 'pickup' ? ' You chose self pick-up — we\'ll confirm the pickup details.' : ''} No payment has been taken.
          </p>
          <Link
            to="/shop"
            style={{
              display: 'inline-block',
              background: c.primary,
              color: '#fff',
              textDecoration: 'none',
              padding: '0.8rem 1.6rem',
              borderRadius: '0.6rem',
              fontWeight: 700,
              boxShadow: `0 6px 18px ${c.primary}40`,
            }}
          >
            Keep shopping
          </Link>
        </div>
      </section>
    );
  }

  // Empty cart
  if (lines.length === 0) {
    return (
      <section style={{ padding: '4rem 1.5rem 6rem', backgroundColor: c.background, minHeight: '60vh' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 6vw, 3rem)', color: c.text, margin: '0 0 0.75rem' }}>
            YOUR CART IS EMPTY
          </h1>
          <p style={{ color: c.textSecondary, marginBottom: '2rem' }}>Nothing reserved yet — go grab some gear.</p>
          <Link
            to="/shop"
            style={{ display: 'inline-block', background: c.primary, color: '#fff', textDecoration: 'none', padding: '0.8rem 1.6rem', borderRadius: '0.6rem', fontWeight: 700, boxShadow: `0 6px 18px ${c.primary}40` }}
          >
            Browse the shop
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section style={{ padding: '2.5rem 1.5rem 5rem', backgroundColor: c.background }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <Link to="/shop" style={{ display: 'inline-block', color: c.textSecondary, textDecoration: 'none', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          ← Continue shopping
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.25rem, 6vw, 3.5rem)', color: c.text, margin: '0 0 1.75rem', letterSpacing: '0.02em' }}>
          YOUR <span style={{ color: accent }}>CART</span>
        </h1>

        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', alignItems: 'start' }}>
          {/* Line items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {lines.map((l) => {
              const key = `${l.productId}::${l.size ?? ''}`;
              return (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '0.85rem',
                    border: `1px solid ${c.border}`,
                    borderRadius: '0.75rem',
                    backgroundColor: c.surface,
                    alignItems: 'center',
                  }}
                >
                  <Link to={`/shop/${l.slug}`} style={{ flexShrink: 0 }}>
                    <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '0.55rem', overflow: 'hidden', backgroundColor: c.surfaceAlt }}>
                      {l.imageUrl ? (
                        <img src={l.imageUrl} alt={l.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
                      ) : (
                        <div aria-hidden="true" style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e2a52, #b3322f)' }} />
                      )}
                    </div>
                  </Link>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/shop/${l.slug}`} style={{ color: c.text, textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>
                      {l.name}
                    </Link>
                    <div style={{ fontSize: '0.8rem', color: c.textSecondary, marginTop: '0.2rem' }}>
                      {l.size ? `Size ${l.size} · ` : ''}{formatPrice(l.unitPrice, l.currency)} each
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: `1px solid ${c.border}`, borderRadius: '0.45rem', overflow: 'hidden' }}>
                        <button aria-label="Decrease quantity" onClick={() => setQty(l.productId, l.size, l.qty - 1)} style={qtyBtn(c)}>−</button>
                        <span style={{ minWidth: '2rem', textAlign: 'center', fontWeight: 600, color: c.text, fontSize: '0.9rem' }}>{l.qty}</span>
                        <button aria-label="Increase quantity" onClick={() => setQty(l.productId, l.size, l.qty + 1)} style={qtyBtn(c)}>+</button>
                      </div>
                      <button
                        onClick={() => removeItem(l.productId, l.size)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          minHeight: '2.75rem',
                          padding: '0 0.4rem',
                          background: 'transparent',
                          border: 'none',
                          color: c.textSecondary,
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          textDecoration: 'underline',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div style={{ fontWeight: 700, color: c.text, whiteSpace: 'nowrap' }}>
                    {formatPrice(l.unitPrice * l.qty, l.currency)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checkout form */}
          <form
            onSubmit={handleSubmit}
            style={{ border: `1px solid ${c.border}`, borderRadius: '0.85rem', backgroundColor: c.surface, padding: '1.4rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 600, color: c.text }}>Subtotal</span>
              <span style={{ fontWeight: 700, fontSize: '1.3rem', color: c.text }}>{formatPrice(subtotal, currency)}</span>
            </div>
            <p style={{ color: c.textSecondary, fontSize: '0.8rem', lineHeight: 1.6, margin: '0 0 1.25rem', paddingBottom: '1.25rem', borderBottom: `1px solid ${c.border}` }}>
              This is a reservation, not a payment. We'll confirm your items and arrange payment with you directly.
            </p>

            {/* Delivery method */}
            <div style={{ marginBottom: '0.85rem' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: c.text, marginBottom: '0.4rem' }}>
                How would you like to get it?
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {([
                  { id: 'pickup' as DeliveryMethod, label: 'Self pick-up' },
                  { id: 'delivery' as DeliveryMethod, label: 'Delivery' },
                ]).map((opt) => {
                  const sel = method === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setMethod(opt.id)}
                      aria-pressed={sel}
                      style={{
                        minHeight: '2.75rem',
                        padding: '0.6rem 0.9rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        border: `1px solid ${sel ? c.primary : c.border}`,
                        backgroundColor: sel ? c.primary : c.surface,
                        color: sel ? '#fff' : c.text,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {method === 'delivery' && (
              <Field label="Delivery address" c={c}>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  required
                  style={{ ...inputStyle(c), resize: 'vertical' }}
                  placeholder="Full address incl. postcode"
                  autoComplete="street-address"
                />
              </Field>
            )}

            <Field label="Name" c={c}>
              <input value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle(c)} autoComplete="name" />
            </Field>
            <Field label="Email" c={c}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle(c)} autoComplete="email" />
            </Field>
            <Field label="Phone (optional)" c={c}>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle(c)} autoComplete="tel" />
            </Field>
            <Field label="Note (optional)" c={c}>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} style={{ ...inputStyle(c), resize: 'vertical' }} placeholder="Anything we should know?" />
            </Field>

            {error && (
              <div role="alert" style={{ color: '#e5484d', fontSize: '0.85rem', marginBottom: '0.85rem' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                width: '100%',
                background: canSubmit ? c.primary : c.surfaceAlt,
                color: canSubmit ? '#fff' : c.textSecondary,
                border: 'none',
                padding: '0.9rem',
                borderRadius: '0.6rem',
                fontWeight: 700,
                fontSize: '1rem',
                letterSpacing: '0.02em',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                boxShadow: canSubmit ? `0 6px 18px ${c.primary}40` : 'none',
                transition: 'background-color 0.15s ease',
              }}
            >
              {submitting ? 'Reserving…' : 'Reserve these items'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

const qtyBtn = (c: import('../styles/colors').ColorPalette): React.CSSProperties => ({
  width: '2.75rem',
  height: '2.75rem',
  background: 'transparent',
  color: c.text,
  border: 'none',
  fontSize: '1.1rem',
  cursor: 'pointer',
  lineHeight: 1,
});

const inputStyle = (c: import('../styles/colors').ColorPalette): React.CSSProperties => ({
  width: '100%',
  padding: '0.7rem 0.8rem',
  borderRadius: '0.5rem',
  border: `1px solid ${c.border}`,
  backgroundColor: c.background,
  color: c.text,
  fontFamily: 'inherit',
  fontSize: '16px', // 16px keeps iOS Safari from zooming the page on focus
});

const Field: React.FC<{ label: string; c: import('../styles/colors').ColorPalette; children: React.ReactNode }> = ({ label, c, children }) => (
  <label style={{ display: 'block', marginBottom: '0.85rem' }}>
    <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: c.text, marginBottom: '0.4rem' }}>{label}</span>
    {children}
  </label>
);
