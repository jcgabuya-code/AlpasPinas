import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors, type ColorPalette } from '../styles/colors';
import { contentMaxWidth } from '../styles/tokens';
import { useIsMobile } from '../hooks/useIsMobile';
import { ProductCard } from '../components/ProductCard';
import { FeaturedSpotlight } from '../components/FeaturedSpotlight';
import { fetchProducts, type Product } from '../utils/merch';

export const Shop: React.FC = () => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const accent = theme === 'dark' ? c.accent : c.primary;
  const isMobile = useIsMobile();
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

  // "All Gear" becomes a horizontal swipe row on mobile (rather than a tall
  // 2-column grid) — one screen's worth of browsing without a wall of vertical
  // scroll. Two scrollability tells, one passive and one active:
  //  - the progress track below the row: its thumb is already narrower than
  //    the track at rest, before any touch, which is the "there's more here"
  //    signal a clipped edge card can't give you until you've started dragging.
  //  - the edge fades: a plain clipped card at the row's edge reads as "the
  //    layout ran out of room," a fade that recedes as you reach the end reads
  //    as "there's more, and here's where it stops."
  const railRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [thumb, setThumb] = useState({ widthPct: 100, leftPct: 0 });

  const updateRailEdges = () => {
    const el = railRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    const widthPct = Math.min(100, (el.clientWidth / el.scrollWidth) * 100);
    const scrollableWidth = el.scrollWidth - el.clientWidth;
    const leftPct = scrollableWidth > 0 ? (el.scrollLeft / scrollableWidth) * (100 - widthPct) : 0;
    setThumb({ widthPct, leftPct });
  };

  useEffect(() => {
    if (!isMobile) return;
    const el = railRef.current;
    if (!el) return;
    // Filter changes swap the row's contents — snap back to the start and
    // re-measure rather than leaving the track/fade in a stale state.
    el.scrollTo({ left: 0 });
    updateRailEdges();
    const onResize = () => updateRailEdges();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, filtered.length]);

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
            style={{
              display: 'inline-block',
              color: muted,
              textDecoration: 'none',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              marginInlineStart: '-0.4rem',
              padding: '0.4rem',
            }}
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
            <span style={{ position: 'relative', display: 'inline-block', color: accent }}>
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
            <div
              role="tablist"
              aria-label="Product category"
              className={isMobile ? 'scroll-strip' : undefined}
              style={
                isMobile
                  ? {
                      display: 'flex',
                      flexWrap: 'nowrap',
                      overflowX: 'auto',
                      WebkitOverflowScrolling: 'touch',
                      marginInline: 'clamp(-1rem, -4vw, -2rem)',
                      paddingInline: 'clamp(1rem, 4vw, 2rem)',
                      marginBottom: '1.5rem',
                      gap: '0.5rem',
                    }
                  : { display: 'flex', flexWrap: 'wrap', marginBottom: '1.75rem', gap: '0.5rem' }
              }
            >
              <TabButton active={filter === 'All'} onClick={() => setFilter('All')} c={c} label="All" count={counts.All} isMobile={isMobile} />
              {categories.map((cat) => (
                <TabButton key={cat} active={filter === cat} onClick={() => setFilter(cat)} c={c} label={cat} count={counts[cat]} isMobile={isMobile} />
              ))}
            </div>
          )}

          {products === null ? (
            // Loading skeleton — matches whichever layout (rail or grid) the
            // real content below will render in, so nothing reflows on load.
            isMobile ? (
              <div className="scroll-strip" style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto' }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    aria-hidden="true"
                    style={{ flex: '0 0 42%', borderRadius: '0.9rem', border: `1px solid ${c.border}`, overflow: 'hidden', backgroundColor: c.surface }}
                  >
                    <div style={{ aspectRatio: '4 / 3', backgroundColor: c.surfaceAlt }} />
                    <div style={{ padding: '0.9rem 1rem 1.05rem' }}>
                      <div style={{ height: '0.7rem', width: '40%', backgroundColor: c.surfaceAlt, borderRadius: '4px', marginBottom: '0.6rem' }} />
                      <div style={{ height: '0.9rem', width: '80%', backgroundColor: c.surfaceAlt, borderRadius: '4px' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
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
            )
          ) : filtered.length > 0 ? (
            isMobile ? (
              // Horizontal swipe row — see railRef effect above for the fade logic.
              <div style={{ position: 'relative' }}>
                <div
                  ref={railRef}
                  onScroll={updateRailEdges}
                  className="scroll-strip"
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    scrollSnapType: 'x proximity',
                    paddingBottom: '0.15rem',
                  }}
                >
                  {filtered.map((p) => (
                    <div key={p.id} style={{ flex: '0 0 42%', scrollSnapAlign: 'start' }}>
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
                {/* Edge fades — the scrollability tell. A card clipped flush at the
                    row's edge reads as "layout ran out of room"; a fade that only
                    shows on the side there's more to see reads as "swipe here." */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: '0.15rem',
                    left: 0,
                    width: '28px',
                    background: `linear-gradient(to right, ${c.background}, transparent)`,
                    opacity: canScrollLeft ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                    pointerEvents: 'none',
                  }}
                />
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: '0.15rem',
                    right: 0,
                    width: '28px',
                    background: `linear-gradient(to left, ${c.background}, transparent)`,
                    opacity: canScrollRight ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                    pointerEvents: 'none',
                  }}
                />
                {/* Progress track — the at-rest tell. The thumb starts narrower
                    than the track, before any touch, so the row reads as
                    scrollable the instant it renders. */}
                {thumb.widthPct < 100 && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'relative',
                      height: '3px',
                      borderRadius: '999px',
                      marginTop: '0.7rem',
                      backgroundColor: c.border,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: `${thumb.widthPct}%`,
                        left: `${thumb.leftPct}%`,
                        borderRadius: '999px',
                        backgroundColor: c.primary,
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: '1rem' }}>
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )
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
  isMobile?: boolean;
}> = ({ active, onClick, c, label, count, isMobile }) => (
  <button
    role="tab"
    aria-selected={active}
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      flexShrink: 0,
      minHeight: isMobile ? '44px' : undefined,
      padding: isMobile ? '0.6rem 1.15rem' : '0.55rem 1.1rem',
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
