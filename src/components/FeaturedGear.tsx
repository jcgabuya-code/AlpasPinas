import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors, brandGradient } from '../styles/colors';
import { sectionShell, contentMaxWidth } from '../styles/tokens';
import { SectionHeader } from './SectionHeader';
import { useInView } from '../hooks/useInView';
import { useIsMobile } from '../hooks/useIsMobile';
import { fetchProducts, effectivePrice, formatPrice, inStock, type Product } from '../utils/merch';

/**
 * Home-page teaser for the shop ("The Locker" / GEAR UP). Leads with one large
 * featured product, then a compact list of the next few, and a note that members
 * race in club kit. Everything drives to the product page (sizes are chosen there);
 * the header links to the full /shop grid. Renders nothing until products load.
 */

const ArrowGlyph: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const StarGlyph: React.FC<{ size?: number }> = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.5l2.6 5.7 6.2.6-4.7 4.1 1.4 6.1L12 17.8 6.5 19l1.4-6.1L3.2 8.8l6.2-.6z" />
  </svg>
);

// Kit icon — folded jersey, for the "members race free" note.
const KitGlyph: React.FC<{ size?: number; color: string }> = ({ size = 20, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 12v9H4v-9" />
    <path d="M2 7h20v5H2z" />
    <path d="M12 22V7" />
    <path d="M12 7C12 7 11 3 8 3 6.3 3 6 5 7 6.2 8 7 12 7 12 7z" />
    <path d="M12 7C12 7 13 3 16 3 17.7 3 18 5 17 6.2 16 7 12 7 12 7z" />
  </svg>
);

const GRADIENT_FALLBACK = 'linear-gradient(135deg, #1e2a52 0%, #3a2a6e 50%, #b3322f 100%)';

export const FeaturedGear: React.FC = () => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const isDark = theme === 'dark';
  const isMobile = useIsMobile();
  const [ref, inView] = useInView<HTMLDivElement>();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchProducts().then((p) => {
      if (active) setProducts(p);
    });
    return () => {
      active = false;
    };
  }, []);

  // Featured first, then the rest — the lead card takes [0], the list takes the next few.
  const ordered = useMemo(() => {
    if (!products) return [];
    const featured = products.filter((p) => p.isFeatured);
    const rest = products.filter((p) => !p.isFeatured);
    return [...featured, ...rest];
  }, [products]);

  const accent = isDark ? c.accent : c.primary;
  const cardBg = c.surface;

  if (!products || ordered.length === 0) return null;

  const lead = ordered[0];
  const listItems = ordered.slice(1, 4);

  const leadPrice = effectivePrice(lead);
  const leadPromo = lead.promoPrice != null && lead.promoPrice < lead.price;

  // Featured product — full-bleed photo with a bottom scrim and the copy laid over it.
  const featuredCard = (
    <Link
      to={`/shop/${lead.slug}`}
      onMouseEnter={() => setHoverId(lead.id)}
      onMouseLeave={() => setHoverId(null)}
      style={{
        position: 'relative',
        display: 'flex',
        borderRadius: '1.1rem',
        overflow: 'hidden',
        border: `1px solid ${hoverId === lead.id ? `${c.primary}66` : c.border}`,
        backgroundColor: c.surfaceAlt,
        textDecoration: 'none',
        minHeight: isMobile ? '360px' : '440px',
        boxShadow: hoverId === lead.id ? '0 18px 40px rgba(0,0,0,0.32)' : 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {lead.imageUrl ? (
        <img
          src={lead.imageUrl}
          alt={lead.name}
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'left center',
            display: 'block',
            transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1)',
            transform: hoverId === lead.id ? 'scale(1.04)' : 'scale(1)',
          }}
        />
      ) : (
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: GRADIENT_FALLBACK }} />
      )}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(10,16,24,0.05) 0%, rgba(10,16,24,0.1) 40%, rgba(10,16,24,0.82) 78%, rgba(10,16,24,0.96) 100%)',
        }}
      />

      {/* Badge — promo label spends the sun accent; a plain featured item gets a quiet accent chip */}
      {lead.promoLabel ? (
        <span
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '999px',
            backgroundColor: c.sun,
            color: '#1a1205',
            fontSize: '0.7rem',
            fontWeight: 900,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          <StarGlyph />
          {lead.promoLabel}
        </span>
      ) : (
        <span
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '999px',
            background: `${c.primary}26`,
            border: `1px solid ${c.primary}66`,
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            color: '#fff',
            fontSize: '0.68rem',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Featured
        </span>
      )}

      <div style={{ position: 'relative', marginTop: 'auto', width: '100%', padding: isMobile ? '1.4rem 1.4rem 1.5rem' : '1.7rem 1.8rem 1.8rem' }}>
        {lead.category && (
          <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.accent, marginBottom: '0.55rem' }}>
            {lead.category}
          </div>
        )}
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.9rem' : '2.4rem', lineHeight: 0.98, letterSpacing: '0.01em', color: '#fff', margin: '0 0 0.5rem' }}>
          {lead.name}
        </h3>
        {lead.description && (
          <p style={{ color: 'rgba(245,247,251,0.82)', fontSize: '0.9rem', lineHeight: 1.55, maxWidth: '400px', margin: '0 0 1.1rem' }}>
            {lead.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', color: '#fff', lineHeight: 1 }}>
            {formatPrice(leadPrice, lead.currency)}
          </span>
          {leadPromo && (
            <span style={{ fontSize: '0.95rem', color: 'rgba(245,247,251,0.6)', textDecoration: 'line-through' }}>
              {formatPrice(lead.price, lead.currency)}
            </span>
          )}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.72rem 1.2rem',
              borderRadius: '999px',
              background: brandGradient(brand, theme),
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.86rem',
              boxShadow: `0 12px 30px ${c.primary}55`,
              transform: hoverId === lead.id ? 'translateX(3px)' : 'translateX(0)',
              transition: 'transform 0.2s ease',
            }}
          >
            Shop this
            <ArrowGlyph />
          </span>
          {lead.sizes.length > 0 && (
            <span style={{ fontSize: '0.8rem', color: 'rgba(245,247,251,0.7)', fontWeight: 600 }}>
              {lead.sizes.join(' · ')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );

  // One compact list row — thumb, name/sub/price, and a view affordance.
  const listRow = (p: Product) => {
    const price = effectivePrice(p);
    const soldOut = !inStock(p);
    const hovered = hoverId === p.id;
    return (
      <Link
        key={p.id}
        to={`/shop/${p.slug}`}
        onMouseEnter={() => setHoverId(p.id)}
        onMouseLeave={() => setHoverId(null)}
        style={{
          display: 'grid',
          gridTemplateColumns: '92px 1fr auto',
          gap: '1rem',
          alignItems: 'center',
          textDecoration: 'none',
          color: c.text,
          background: cardBg,
          border: `1px solid ${hovered ? `${c.primary}66` : c.border}`,
          borderRadius: '0.9rem',
          padding: '0.7rem',
          transform: hovered ? 'translateX(3px)' : 'translateX(0)',
          transition: 'border-color 0.18s ease, transform 0.18s ease',
        }}
      >
        <div style={{ width: '92px', height: '92px', borderRadius: '0.6rem', overflow: 'hidden', background: c.surfaceAlt, flexShrink: 0 }}>
          {p.imageUrl ? (
            <img src={p.imageUrl} alt={p.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'left center', display: 'block' }} />
          ) : (
            <div aria-hidden="true" style={{ width: '100%', height: '100%', background: GRADIENT_FALLBACK }} />
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', letterSpacing: '0.01em', lineHeight: 1, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.name}
            </span>
            {p.promoLabel && (
              <span style={{ flexShrink: 0, fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.08em', color: c.sun, border: `1px solid ${c.sun}66`, borderRadius: '999px', padding: '0.1rem 0.45rem', textTransform: 'uppercase' }}>
                {p.promoLabel}
              </span>
            )}
          </div>
          {p.description && (
            <div style={{ fontSize: '0.78rem', color: c.textSecondary, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.description}
            </div>
          )}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: soldOut ? c.textSecondary : accent, marginTop: '0.4rem' }}>
            {soldOut ? 'Sold out' : formatPrice(price, p.currency)}
          </div>
        </div>
        <span
          aria-hidden="true"
          style={{
            width: '2.4rem',
            height: '2.4rem',
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${c.primary}1f`,
            border: `1px solid ${c.primary}4d`,
            color: accent,
            flexShrink: 0,
          }}
        >
          <ArrowGlyph size={17} />
        </span>
      </Link>
    );
  };

  const membersNote = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.9rem',
        padding: '1rem 1.1rem',
        borderRadius: '0.9rem',
        border: `1px dashed ${c.primary}59`,
        background: `${c.primary}0d`,
      }}
    >
      <span style={{ width: '2.4rem', height: '2.4rem', flexShrink: 0, borderRadius: '0.6rem', background: `${c.primary}1f`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <KitGlyph color={accent} />
      </span>
      <p style={{ fontSize: '0.82rem', color: c.textSecondary, lineHeight: 1.5, margin: 0 }}>
        <span style={{ color: c.text, fontWeight: 800 }}>Members race in club kit.</span> Your jersey, paddle,
        and PFD are provided once you join the crew.
      </p>
    </div>
  );

  return (
    <section
      style={{
        ...sectionShell,
        // Tighten the top so the section sits closer to the marquee band above.
        paddingTop: 'clamp(1.75rem, 3vw, 2.75rem)',
        backgroundColor: c.background,
        borderTop: `1px solid ${c.border}`,
      }}
    >
      <div style={{ maxWidth: contentMaxWidth, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="The Locker"
          size="lg"
          style={{ marginBottom: isMobile ? '1.75rem' : '2.25rem' }}
          trailing={
            <Link
              to="/shop"
              style={{ color: accent, textDecoration: 'none', fontWeight: 700, fontSize: isMobile ? '0.88rem' : '0.95rem', whiteSpace: 'nowrap' }}
            >
              Shop all gear →
            </Link>
          }
        >
          GEAR <span style={{ color: accent }}>UP</span>
        </SectionHeader>

        <div
          ref={ref}
          className={`reveal${inView ? ' is-visible' : ''}`}
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1fr',
            gap: isMobile ? '1rem' : '1.4rem',
            alignItems: 'stretch',
          }}
        >
          {featuredCard}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {listItems.map((p) => listRow(p))}
            <div style={{ marginTop: listItems.length > 0 ? 'auto' : 0 }}>{membersNote}</div>
          </div>
        </div>
      </div>
    </section>
  );
};
