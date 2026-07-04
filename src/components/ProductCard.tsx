import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';
import { useIsMobile } from '../hooks/useIsMobile';
import { effectivePrice, formatPrice, inStock, type Product } from '../utils/merch';

/**
 * Product tile for the shop grid + featured band. Photo on top (the apparel's
 * own navy→red batik gradient carries the color), name + price below. Promo
 * items get a `sun`-accented label — the one place the warm accent is spent.
 * `feature` makes a taller, louder tile for the lead/featured slot.
 */
export const ProductCard: React.FC<{ product: Product; feature?: boolean }> = ({
  product,
  feature = false,
}) => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const isMobile = useIsMobile();
  const [hovered, setHovered] = useState(false);

  const price = effectivePrice(product);
  const hasPromo = product.promoPrice != null && product.promoPrice < product.price;
  const soldOut = !inStock(product);

  return (
    <Link
      to={`/shop/${product.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${hovered ? `${c.primary}66` : c.border}`,
        borderRadius: '0.9rem',
        overflow: 'hidden',
        backgroundColor: c.surface,
        textDecoration: 'none',
        color: c.text,
        transition: 'border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? `0 14px 30px rgba(0,0,0,0.28)` : 'none',
      }}
    >
      {/* Image — shorter on mobile grid tiles (4:3, not square) so more rows fit
          the screen without scrolling; the feature slot stays 4:3 everywhere. */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: feature ? '4 / 3' : isMobile ? '4 / 3' : '1 / 1',
          backgroundColor: c.surfaceAlt,
          overflow: 'hidden',
        }}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              // Product shots pair front+back side-by-side; a square tile cropped to
              // center lands in the gap, so square tiles bias left to the front view.
              // The wider 4:3 feature tile keeps both views in frame.
              objectPosition: feature ? 'center top' : 'left center',
              display: 'block',
              transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
            }}
          />
        ) : (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, #1e2a52 0%, #3a2a6e 50%, #b3322f 100%)',
            }}
          />
        )}

        {/* Promo label — the sun accent, paired with text (not color alone) */}
        {hasPromo && product.promoLabel && !soldOut && (
          <span
            style={{
              position: 'absolute',
              top: isMobile ? '0.55rem' : '0.7rem',
              left: isMobile ? '0.55rem' : '0.7rem',
              padding: isMobile ? '0.24rem 0.58rem' : '0.28rem 0.7rem',
              borderRadius: '999px',
              backgroundColor: c.sun,
              color: '#1a1205',
              fontSize: isMobile ? '0.62rem' : '0.68rem',
              fontWeight: 800,
              letterSpacing: isMobile ? '0.06em' : '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {product.promoLabel}
          </span>
        )}

        {/* Sold-out scrim */}
        {soldOut && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontSize: '0.9rem',
            }}
          >
            Sold out
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: isMobile ? '0.8rem 0.85rem 0.9rem' : '0.9rem 1rem 1.05rem', display: 'flex', flexDirection: 'column', gap: isMobile ? '0.28rem' : '0.35rem', flex: 1 }}>
        {product.category && (
          <span style={{ fontSize: isMobile ? '0.64rem' : '0.7rem', color: c.textSecondary, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {product.category}
          </span>
        )}
        <span
          style={{
            fontWeight: 600,
            fontSize: feature ? (isMobile ? '1.05rem' : '1.15rem') : isMobile ? '0.94rem' : '1rem',
            lineHeight: feature && isMobile ? 1.18 : 1.25,
            color: c.text,
          }}
        >
          {product.name}
        </span>

        <div style={{ marginTop: 'auto', paddingTop: isMobile ? '0.4rem' : '0.5rem', display: 'flex', alignItems: 'baseline', gap: isMobile ? '0.4rem' : '0.55rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: isMobile ? '0.96rem' : '1.05rem', color: hasPromo ? c.sun : c.text }}>
            {formatPrice(price, product.currency)}
          </span>
          {hasPromo && (
            <span style={{ fontSize: isMobile ? '0.78rem' : '0.85rem', color: c.textSecondary, textDecoration: 'line-through' }}>
              {formatPrice(product.price, product.currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
