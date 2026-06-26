import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';
import { fetchFeaturedProducts, effectivePrice, formatPrice, inStock, type Product } from '../utils/merch';

/**
 * Site-wide announcement strip, above the nav. Surfaces the top promo product
 * (a featured item with a promo_label) so a visitor notices it the instant the
 * page loads — the one place the warm `sun` accent runs full-bleed.
 *
 * Dismissible and remembered per-promo in localStorage: closing hides THIS promo;
 * a new featured item (different id) shows again. Attention comes from a warm
 * amber→ember gradient + the cadence beat-ticks (the team's stroke signature) —
 * not flashing badges. The beat uses .cadence-beat, which carries its own
 * prefers-reduced-motion fallback.
 */
const DISMISS_KEY = 'alpas-promo-dismissed';

export const PromoBar: React.FC = () => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const [promo, setPromo] = useState<Product | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(DISMISS_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let active = true;
    fetchFeaturedProducts().then((items) => {
      if (!active) return;
      // Prefer a featured item that has a promo label and is in stock.
      const pick =
        items.find((p) => p.promoLabel && inStock(p)) ?? items.find((p) => inStock(p)) ?? null;
      setPromo(pick);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!promo || dismissed === promo.id) return null;

  const price = effectivePrice(promo);
  const hasPromo = promo.promoPrice != null && promo.promoPrice < promo.price;

  // Warm promo gradient — lighter tone: a pale lit amber high → a softened sun
  // core → a gentle warm-orange low. Airy rather than saturated, but still the
  // sun family so it stays the promo accent.
  const amberHi = `color-mix(in srgb, ${c.sun} 60%, #ffffff 40%)`;
  const amberCore = `color-mix(in srgb, ${c.sun} 88%, #ffffff 12%)`;
  const ember = `color-mix(in srgb, ${c.sun} 80%, #e0863a 20%)`;

  const close = () => {
    setDismissed(promo.id);
    try {
      window.localStorage.setItem(DISMISS_KEY, promo.id);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      role="region"
      aria-label="Promotion"
      style={{
        // The promo accent, full-bleed — a light warm amber sweep, not flat.
        background: `linear-gradient(100deg, ${amberHi} 0%, ${amberCore} 44%, ${ember} 100%)`,
        color: '#1a1205',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.6rem 0.5rem 1rem',
        position: 'relative',
        zIndex: 1,
        // Lift off the nav + a lit top edge for a touch of depth.
        boxShadow: '0 2px 12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.45)',
      }}
    >
      <Link
        to={`/shop/${promo.slug}`}
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem 0.65rem',
          flexWrap: 'wrap',
          color: '#1a1205',
          textDecoration: 'none',
          fontSize: '0.85rem',
          lineHeight: 1.35,
        }}
      >
        {/* Cadence beat-ticks — the drummer's stroke setting the promo's pulse.
            Animated via .cadence-beat (which has its own reduced-motion fallback). */}
        <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', flexShrink: 0 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="cadence-beat"
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '999px',
                backgroundColor: '#1a1205',
                animationDelay: `${i * 0.18}s`,
              }}
            />
          ))}
        </span>

        {promo.promoLabel && (
          <span
            style={{
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontSize: '0.72rem',
              backgroundColor: '#1a1205',
              color: c.sun,
              padding: '0.16rem 0.55rem',
              borderRadius: '999px',
              flexShrink: 0,
            }}
          >
            {promo.promoLabel}
          </span>
        )}
        <span style={{ fontWeight: 600 }}>
          {promo.name}
          {hasPromo && (
            <>
              {' — '}
              <span style={{ fontWeight: 800 }}>{formatPrice(price, promo.currency)}</span>{' '}
              <span style={{ textDecoration: 'line-through', opacity: 0.6, fontWeight: 500 }}>
                {formatPrice(promo.price, promo.currency)}
              </span>
            </>
          )}
        </span>
        <span style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Reserve yours →</span>
      </Link>

      <button
        onClick={close}
        aria-label="Dismiss promotion"
        style={{
          flexShrink: 0,
          width: '2.75rem',
          height: '2.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          color: '#1a1205',
          fontSize: '1.1rem',
          cursor: 'pointer',
          borderRadius: '999px',
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
};
