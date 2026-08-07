import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';
import { useIsMobile } from '../hooks/useIsMobile';
import { effectivePrice, formatPrice, inStock, type Product } from '../utils/merch';

/**
 * The featured-item spotlight — distinct from the grid cards on purpose. Image
 * beside copy + promo + CTA, so the page leads with one "thesis" moment instead
 * of a scaled-up duplicate tile. The `sun` accent is spent here (promo label),
 * nowhere else on the page. The product is shown ONLY here, not also in the grid.
 */
export const FeaturedSpotlight: React.FC<{ product: Product }> = ({ product }) => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const accent = theme === 'dark' ? c.accent : c.primary;
  const isMobile = useIsMobile();
  const [hovered, setHovered] = useState(false);

  const price = effectivePrice(product);
  const hasPromo = product.promoPrice != null && product.promoPrice < product.price;
  const soldOut = !inStock(product);
  const image = product.imageUrl ?? product.images[0];
  // Muted-but-AA body color: textSecondary is borderline on the dark bg, so mix the
  // ink toward the background instead of using the washed-out gray for real copy.
  const muted = `color-mix(in srgb, ${c.text} 74%, ${c.background})`;

  return (
    // De-carded: no border/surface frame — the spotlight bleeds onto the page as a
    // hero moment, distinct from the bordered grid tiles below. The image carries a
    // soft shadow so it lifts off the background instead of a box outline.
    <article
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
        gap: isMobile ? '1.4rem' : 'clamp(2rem, 4vw, 3.5rem)',
        alignItems: 'center',
      }}
    >
      {/* Image */}
      <Link
        to={`/shop/${product.slug}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={product.name}
        style={{
          display: 'block',
          position: 'relative',
          borderRadius: '1rem',
          overflow: 'hidden',
          backgroundColor: c.surfaceAlt,
          aspectRatio: '4 / 3',
          boxShadow: hovered
            ? '0 26px 60px rgba(0,0,0,0.45)'
            : '0 18px 48px rgba(0,0,0,0.38)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
              display: 'block',
              transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
              transform: hovered ? 'scale(1.03)' : 'scale(1)',
            }}
          />
        ) : (
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1e2a52 0%, #3a2a6e 50%, #b3322f 100%)' }} />
        )}
      </Link>

      {/* Copy */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
          {hasPromo && product.promoLabel && !soldOut ? (
            <span
              style={{
                padding: '0.3rem 0.75rem',
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
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent }}>
              {/* Cadence beat-tick — ties the spotlight to the hero's stroke signature. */}
              <span aria-hidden="true" className="cadence-beat" style={{ width: '7px', height: '7px', borderRadius: '999px', backgroundColor: c.sun, flexShrink: 0 }} />
              Featured
            </span>
          )}
          {product.category && (
            <span style={{ fontSize: '0.75rem', color: muted }}>{product.category}</span>
          )}
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.1rem, 4.5vw, 3.4rem)',
            color: c.text,
            margin: '0 0 0.7rem',
            lineHeight: 1.0,
            letterSpacing: '0.01em',
          }}
        >
          {product.name}
        </h2>

        {product.description && (
          <p style={{ color: muted, lineHeight: 1.65, margin: '0 0 1.1rem', maxWidth: '46ch' }}>
            {product.description}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <span style={{ fontWeight: 700, fontSize: '1.5rem', color: hasPromo ? c.sun : c.text }}>
            {formatPrice(price, product.currency)}
          </span>
          {hasPromo && (
            <span style={{ fontSize: '1rem', color: c.textSecondary, textDecoration: 'line-through' }}>
              {formatPrice(product.price, product.currency)}
            </span>
          )}
        </div>

        <Link
          to={`/shop/${product.slug}`}
          style={{
            display: 'inline-block',
            background: soldOut ? c.surfaceAlt : c.primary,
            color: soldOut ? c.textSecondary : '#fff',
            textDecoration: 'none',
            padding: '0.8rem 1.6rem',
            borderRadius: '0.6rem',
            fontWeight: 700,
            fontSize: '0.98rem',
            letterSpacing: '0.02em',
            boxShadow: soldOut ? 'none' : `0 6px 18px ${c.primary}40`,
          }}
        >
          {soldOut ? 'Sold out' : 'Shop this →'}
        </Link>
      </div>
    </article>
  );
};
