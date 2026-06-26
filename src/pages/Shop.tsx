import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors, type ColorPalette } from '../styles/colors';
import { contentMaxWidth } from '../styles/tokens';
import { ProductCard } from '../components/ProductCard';
import { FeaturedSpotlight } from '../components/FeaturedSpotlight';
import { fetchProducts, type Product } from '../utils/merch';

export const Shop: React.FC = () => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  // Muted-but-AA body color — textSecondary is borderline on the dark bg.
  const muted = `color-mix(in srgb, ${c.text} 74%, ${c.background})`;

  const [products, setProducts] = useState<Product[] | null>(null); // null = loading
  const [filter, setFilter] = useState<string>('All');

  useEffect(() => {
    let active = true;
    fetchProducts().then((p) => {
      if (active) setProducts(p);
    });
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    if (!products) return [];
    return Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];
  }, [products]);

  // The single spotlighted item leads the page; it is shown ONLY in the
  // spotlight, never duplicated in the grid below.
  const spotlight = useMemo(() => (products ?? []).find((p) => p.isFeatured) ?? null, [products]);

  const gridProducts = useMemo(
    () => (products ?? []).filter((p) => p.id !== spotlight?.id),
    [products, spotlight],
  );

  const filtered = useMemo(
    () => (filter === 'All' ? gridProducts : gridProducts.filter((p) => p.category === filter)),
    [gridProducts, filter],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: gridProducts.length };
    for (const cat of categories) map[cat] = gridProducts.filter((p) => p.category === cat).length;
    return map;
  }, [gridProducts, categories]);

  return (
    <>
      {/* Header */}
      <section
        style={{
          paddingBlock: 'clamp(2.5rem, 6vw, 4rem) clamp(1rem, 3vw, 1.75rem)',
          paddingInline: 'clamp(1rem, 4vw, 2rem)',
          backgroundColor: c.background,
        }}
      >
        <div style={{ maxWidth: contentMaxWidth, margin: '0 auto' }}>
          <Link
            to="/"
            style={{ display: 'inline-block', color: muted, textDecoration: 'none', fontSize: '0.85rem', marginBottom: '1.25rem' }}
          >
            ← Back to home
          </Link>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
              color: c.text,
              margin: '0 0 0.9rem 0',
              letterSpacing: '0.02em',
              lineHeight: 0.98,
            }}
          >
            TEAM{' '}
            {/* Signature: the wake-line traces left→right under GEAR, echoing the hero. */}
            <span style={{ position: 'relative', display: 'inline-block', color: c.primary }}>
              GEAR
              <span
                aria-hidden="true"
                className="wake-underline"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: '0.02em',
                  height: '0.07em',
                  borderRadius: '999px',
                  background: `linear-gradient(90deg, ${c.primary}, ${c.sun})`,
                }}
              />
            </span>
          </h1>
          <p style={{ color: muted, fontSize: '1rem', maxWidth: '58ch', lineHeight: 1.6, margin: 0 }}>
            Race-day kit and training wear in the AlpasPinas colors. Reserve your size — we'll
            confirm and arrange payment with you directly.
          </p>
        </div>
      </section>

      {/* Featured spotlight — one thesis moment, shown only here */}
      {products && spotlight && (
        <section style={{ paddingBlock: 'clamp(0.5rem, 2vw, 1.5rem) clamp(2rem, 5vw, 3.5rem)', paddingInline: 'clamp(1rem, 4vw, 2rem)', backgroundColor: c.background }}>
          <div style={{ maxWidth: contentMaxWidth, margin: '0 auto' }}>
            <FeaturedSpotlight product={spotlight} />
          </div>
        </section>
      )}

      {/* Filter + grid */}
      <section style={{ paddingBlock: '0 clamp(3.5rem, 8vw, 6rem)', paddingInline: 'clamp(1rem, 4vw, 2rem)', backgroundColor: c.background }}>
        <div style={{ maxWidth: contentMaxWidth, margin: '0 auto' }}>
          {products && spotlight && gridProducts.length > 0 && (
            // A quiet tracked label, not a second display headline — keeps the page
            // from stacking two big headers around the spotlight.
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', margin: '0 0 1.1rem' }}>
              <h2
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: c.text,
                  margin: 0,
                }}
              >
                All Gear
              </h2>
              <span style={{ fontSize: '0.8rem', color: muted, fontWeight: 600 }}>
                {gridProducts.length} {gridProducts.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          )}
          {categories.length > 1 && (
            <div role="tablist" aria-label="Product category" style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '1.75rem', gap: '0.5rem' }}>
              <TabButton active={filter === 'All'} onClick={() => setFilter('All')} c={c} label="All" count={counts.All} />
              {categories.map((cat) => (
                <TabButton key={cat} active={filter === cat} onClick={() => setFilter(cat)} c={c} label={cat} count={counts[cat]} />
              ))}
            </div>
          )}

          {products === null ? (
            // Loading skeleton
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: '1rem' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  aria-hidden="true"
                  style={{ borderRadius: '0.9rem', border: `1px solid ${c.border}`, overflow: 'hidden', backgroundColor: c.surface }}
                >
                  <div style={{ aspectRatio: '1 / 1', backgroundColor: c.surfaceAlt }} />
                  <div style={{ padding: '0.9rem 1rem 1.05rem' }}>
                    <div style={{ height: '0.7rem', width: '40%', backgroundColor: c.surfaceAlt, borderRadius: '4px', marginBottom: '0.6rem' }} />
                    <div style={{ height: '0.9rem', width: '80%', backgroundColor: c.surfaceAlt, borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: '1rem' }}>
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '4rem 1rem',
                textAlign: 'center',
                color: muted,
                backgroundColor: c.surface,
                borderRadius: '0.9rem',
                border: `1px dashed ${c.border}`,
              }}
            >
              <div style={{ fontWeight: 600, color: c.text, marginBottom: '0.35rem' }}>
                {(products ?? []).length === 0 ? 'The shop is being stocked' : 'Nothing in this category yet'}
              </div>
              <div style={{ fontSize: '0.85rem' }}>
                {(products ?? []).length === 0 ? 'Check back soon — gear is on the way.' : 'Try the All tab.'}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  c: ColorPalette;
  label: string;
  count: number;
}> = ({ active, onClick, c, label, count }) => (
  <button
    role="tab"
    aria-selected={active}
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.55rem 1.1rem',
      borderRadius: '999px',
      fontSize: '0.88rem',
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'inherit',
      border: `1px solid ${active ? c.primary : c.border}`,
      backgroundColor: active ? c.primary : c.surface,
      color: active ? '#fff' : c.textSecondary,
      transition: 'all 0.15s ease',
      letterSpacing: '0.02em',
      boxShadow: active ? `0 4px 14px ${c.primary}33` : 'none',
    }}
  >
    {label}
    <span
      style={{
        marginLeft: '0.45rem',
        padding: '0.05rem 0.45rem',
        borderRadius: '999px',
        backgroundColor: active ? 'rgba(255,255,255,0.2)' : c.background,
        color: active ? '#fff' : c.textSecondary,
        fontSize: '0.72rem',
        fontWeight: 600,
        border: active ? 'none' : `1px solid ${c.border}`,
      }}
    >
      {count}
    </span>
  </button>
);
