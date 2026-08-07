import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors, type ColorPalette } from '../styles/colors';
import { useIsMobile } from '../hooks/useIsMobile';
import { useCart } from '../context/CartContext';
import { effectivePrice, fetchProduct, formatPrice, inStock, type Product } from '../utils/merch';

type LoadState = 'loading' | 'ready' | 'notfound';

export const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const accent = theme === 'dark' ? c.accent : c.primary;
  const isMobile = useIsMobile();
  const { addItem } = useCart();
  // Muted-but-AA body color — textSecondary is borderline on the dark bg.
  const muted = `color-mix(in srgb, ${c.text} 74%, ${c.background})`;

  const [state, setState] = useState<LoadState>('loading');
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState<string | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  // Product shots are all cut on the same near-black studio backdrop, which is
  // slightly darker/flatter than the theme's navy surfaceAlt. Framing the gallery
  // in surfaceAlt made the two backdrops visible at once (a mismatched seam) any
  // time the photo doesn't fill the box exactly — e.g. the fixed-height mobile
  // frame letterboxing a wide front+back shot. Matching the frame to the photo's
  // own backdrop makes it read as one continuous background instead.
  const photoBackdrop = '#0d0d0f';

  useEffect(() => {
    let active = true;
    setState('loading');
    fetchProduct(slug ?? '').then((p) => {
      if (!active) return;
      if (p) {
        setProduct(p);
        setState('ready');
      } else {
        setState('notfound');
      }
    });
    return () => {
      active = false;
    };
  }, [slug]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const imgs = product.images.length > 0 ? product.images : product.imageUrl ? [product.imageUrl] : [];
    return imgs;
  }, [product]);

  if (state === 'loading') {
    return (
      <section style={{ padding: '3rem 1.5rem 5rem', backgroundColor: c.background, minHeight: '60vh' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))' }}>
          <div aria-hidden="true" style={{ aspectRatio: '1 / 1', borderRadius: '1rem', backgroundColor: c.surfaceAlt }} />
          <div aria-hidden="true">
            <div style={{ height: '2rem', width: '70%', backgroundColor: c.surfaceAlt, borderRadius: '6px', marginBottom: '1rem' }} />
            <div style={{ height: '1rem', width: '40%', backgroundColor: c.surfaceAlt, borderRadius: '6px' }} />
          </div>
        </div>
      </section>
    );
  }

  if (state === 'notfound' || !product) {
    return (
      <section style={{ padding: '5rem 1.5rem', backgroundColor: c.background, minHeight: '60vh', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: c.text, margin: '0 0 0.75rem' }}>
            NOT FOUND
          </h1>
          <p style={{ color: muted, marginBottom: '1.5rem' }}>
            That item isn't in the shop. It may have sold out or been taken down.
          </p>
          <Link
            to="/shop"
            style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}
          >
            ← Back to the shop
          </Link>
        </div>
      </section>
    );
  }

  const price = effectivePrice(product);
  const hasPromo = product.promoPrice != null && product.promoPrice < product.price;
  const soldOut = !inStock(product);
  const needsSize = product.sizes.length > 0;

  const handleAdd = () => {
    if (soldOut) return;
    if (needsSize && !size) {
      setSizeError(true);
      return;
    }
    addItem(product, { size, qty });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  return (
    <section
      style={{
        paddingBlock: isMobile ? '0.85rem 1.25rem' : 'clamp(2rem, 5vw, 3rem) clamp(3.5rem, 8vw, 6rem)',
        paddingInline: 'clamp(1rem, 4vw, 2rem)',
        backgroundColor: c.background,
        // Mobile: fit the page to the viewport (minus the nav bar) so a typical
        // product needs no scroll to reach Add to cart; a very long name/description
        // still overflows gracefully rather than being clipped.
        minHeight: isMobile ? 'calc(100dvh - 60px)' : undefined,
        display: isMobile ? 'flex' : undefined,
        flexDirection: isMobile ? 'column' : undefined,
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', display: isMobile ? 'flex' : undefined, flexDirection: isMobile ? 'column' : undefined, flex: isMobile ? 1 : undefined }}>
        <Link
          to="/shop"
          style={{ display: 'inline-block', color: muted, textDecoration: 'none', fontSize: '0.85rem', marginBottom: isMobile ? '0.6rem' : '1.5rem' }}
        >
          ← Back to the shop
        </Link>

        <div
          style={
            isMobile
              ? { display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }
              : { display: 'grid', gap: '2.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', alignItems: 'start' }
          }
        >
          {/* Gallery */}
          <div style={{ flexShrink: isMobile ? 0 : undefined }}>
            <div
              style={{
                position: 'relative',
                width: '100%',
                // Desktop: no forced aspect ratio — product shots are wide front+back
                // renders, so the box takes the image's natural ratio and shows it whole
                // rather than cropping it. Mobile: a fixed, shorter height instead, so the
                // gallery doesn't eat the one screen's worth of vertical space on its own;
                // objectFit: contain still shows the whole shot, just letterboxed.
                height: isMobile ? 'clamp(150px, 30dvh, 230px)' : undefined,
                minHeight: gallery[activeImage] ? undefined : isMobile ? '150px' : '20rem',
                aspectRatio: gallery[activeImage] ? undefined : '1 / 1',
                borderRadius: '1rem',
                overflow: 'hidden',
                backgroundColor: gallery[activeImage] ? photoBackdrop : c.surfaceAlt,
                border: `1px solid ${c.border}`,
              }}
            >
              {gallery[activeImage] ? (
                <img
                  src={gallery[activeImage]}
                  alt={product.name}
                  style={{ width: '100%', height: isMobile ? '100%' : 'auto', objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1e2a52 0%, #3a2a6e 50%, #b3322f 100%)' }} />
              )}
              {hasPromo && product.promoLabel && !soldOut && (
                <span
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    padding: '0.3rem 0.8rem',
                    borderRadius: '999px',
                    backgroundColor: c.sun,
                    color: '#1a1205',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {product.promoLabel}
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {gallery.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: isMobile ? '0.5rem' : '0.8rem', flexWrap: 'wrap' }}>
                {gallery.map((src, i) => (
                  <button
                    key={src + i}
                    onClick={() => setActiveImage(i)}
                    aria-label={`View image ${i + 1}`}
                    aria-current={i === activeImage}
                    style={{
                      width: isMobile ? '2.75rem' : '4.5rem',
                      height: isMobile ? '2.75rem' : '4.5rem',
                      borderRadius: '0.55rem',
                      overflow: 'hidden',
                      padding: 0,
                      cursor: 'pointer',
                      border: `2px solid ${i === activeImage ? c.primary : c.border}`,
                      backgroundColor: photoBackdrop,
                    }}
                  >
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div style={{ display: isMobile ? 'flex' : undefined, flexDirection: isMobile ? 'column' : undefined, flex: isMobile ? 1 : undefined, minHeight: 0 }}>
            {product.category && (
              <span style={{ fontSize: '0.75rem', color: muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {product.category}
              </span>
            )}
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: isMobile ? 'clamp(1.5rem, 7vw, 2.1rem)' : 'clamp(2rem, 5vw, 3rem)',
                color: c.text,
                margin: isMobile ? '0.25rem 0 0.4rem' : '0.4rem 0 0.9rem',
                letterSpacing: '0.01em',
                lineHeight: 1.02,
              }}
            >
              {product.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.7rem', marginBottom: isMobile ? '0.6rem' : '1.25rem' }}>
              <span style={{ fontWeight: 700, fontSize: isMobile ? '1.3rem' : '1.6rem', color: hasPromo ? c.sun : c.text }}>
                {formatPrice(price, product.currency)}
              </span>
              {hasPromo && (
                <span style={{ fontSize: isMobile ? '0.9rem' : '1.05rem', color: muted, textDecoration: 'line-through' }}>
                  {formatPrice(product.price, product.currency)}
                </span>
              )}
            </div>

            {product.description && (
              isMobile ? (
                <div style={{ marginBottom: '0.75rem' }}>
                  <p
                    style={{
                      color: muted,
                      lineHeight: 1.5,
                      margin: 0,
                      maxWidth: '52ch',
                      fontSize: '0.9rem',
                      display: showFullDesc ? 'block' : '-webkit-box',
                      WebkitLineClamp: showFullDesc ? undefined : 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: showFullDesc ? 'visible' : 'hidden',
                    }}
                  >
                    {product.description}
                  </p>
                  <button
                    onClick={() => setShowFullDesc((v) => !v)}
                    style={{ background: 'none', border: 'none', padding: '0.3rem 0 0', margin: 0, color: accent, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    {showFullDesc ? 'Show less' : 'Read more'}
                  </button>
                </div>
              ) : (
                <p style={{ color: muted, lineHeight: 1.7, marginBottom: '1.75rem', maxWidth: '52ch' }}>
                  {product.description}
                </p>
              )
            )}

            {/* Purchase controls — grouped and separated from the info above so the
                actionable cluster (size · quantity · add) reads as one unit. */}
            <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: isMobile ? '0.85rem' : '1.75rem', marginTop: isMobile ? 'auto' : undefined }}>
            {/* Size */}
            {needsSize && (
              <div style={{ marginBottom: isMobile ? '0.85rem' : '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: c.text, marginBottom: '0.55rem' }}>
                  Size{sizeError && <span style={{ color: '#e5484d', marginLeft: '0.5rem', fontWeight: 500 }}>· please pick a size</span>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {product.sizes.map((s) => {
                    const selected = size === s;
                    return (
                      <button
                        key={s}
                        onClick={() => {
                          setSize(s);
                          setSizeError(false);
                        }}
                        aria-pressed={selected}
                        style={{
                          minWidth: '2.9rem',
                          minHeight: '2.75rem',
                          padding: '0.5rem 0.95rem',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontWeight: 600,
                          fontSize: '1rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${selected ? c.primary : sizeError ? '#e5484d88' : c.border}`,
                          backgroundColor: selected ? c.primary : c.surface,
                          color: selected ? '#fff' : c.text,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div style={{ marginBottom: isMobile ? '0.85rem' : '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: c.text, marginBottom: '0.55rem' }}>Quantity</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', border: `1px solid ${c.border}`, borderRadius: '0.5rem', overflow: 'hidden' }}>
                <QtyButton label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} c={c}>−</QtyButton>
                <span style={{ minWidth: '2.75rem', textAlign: 'center', fontWeight: 600, color: c.text }}>{qty}</span>
                <QtyButton label="Increase quantity" onClick={() => setQty((q) => Math.min(99, q + 1))} disabled={qty >= 99} c={c}>+</QtyButton>
              </div>
            </div>

            {/* Add to cart */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <button
                onClick={handleAdd}
                disabled={soldOut}
                style={{
                  background: soldOut ? c.surfaceAlt : c.primary,
                  color: soldOut ? c.textSecondary : '#fff',
                  border: 'none',
                  padding: '0.85rem 1.6rem',
                  borderRadius: '0.6rem',
                  fontWeight: 700,
                  fontSize: '0.98rem',
                  letterSpacing: '0.02em',
                  cursor: soldOut ? 'not-allowed' : 'pointer',
                  boxShadow: soldOut ? 'none' : `0 6px 18px ${c.primary}40`,
                  transition: 'background-color 0.15s ease',
                  width: isMobile ? '100%' : undefined,
                }}
              >
                {soldOut ? 'Sold out' : 'Add to cart'}
              </button>
              {added && (
                <button
                  onClick={() => navigate('/cart')}
                  style={{
                    background: 'transparent',
                    color: accent,
                    border: `1px solid ${c.primary}55`,
                    padding: '0.85rem 1.3rem',
                    borderRadius: '0.6rem',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                  }}
                >
                  Added ✓ — View cart →
                </button>
              )}
            </div>

            <p style={{ color: muted, fontSize: isMobile ? '0.72rem' : '0.8rem', marginTop: isMobile ? '0.65rem' : '1.25rem', lineHeight: 1.5 }}>
              Reserve-only: adding to cart places a request. We'll confirm availability and arrange
              payment with you directly — no online payment yet.
            </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const QtyButton: React.FC<{
  label: string;
  onClick: () => void;
  disabled?: boolean;
  c: ColorPalette;
  children: React.ReactNode;
}> = ({ label, onClick, disabled, c, children }) => (
  <button
    aria-label={label}
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '2.75rem',
      height: '2.75rem',
      background: 'transparent',
      color: disabled ? c.textSecondary : c.text,
      border: 'none',
      fontSize: '1.2rem',
      cursor: disabled ? 'not-allowed' : 'pointer',
      lineHeight: 1,
    }}
  >
    {children}
  </button>
);
