import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';
import { sectionShell, contentMaxWidth } from '../styles/tokens';
import { SectionHeader } from './SectionHeader';
import { ProductCard } from './ProductCard';
import { useIsMobile } from '../hooks/useIsMobile';
import { fetchProducts, type Product } from '../utils/merch';

/**
 * Home-page teaser for the shop. Leads with featured items, then fills with the
 * rest up to four so the band never looks sparse, and points everything at /shop.
 * Renders nothing until products load (no empty band on the marketing home).
 */
export const FeaturedGear: React.FC = () => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const isMobile = useIsMobile();
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    let active = true;
    fetchProducts().then((p) => {
      if (active) setProducts(p);
    });
    return () => {
      active = false;
    };
  }, []);

  // Featured first, then fill with the rest. Mobile leads with one feature card +
  // a short scroll row (cap 4); desktop is a single scroll strip of small cards.
  const ordered = useMemo(() => {
    if (!products) return [];
    const featured = products.filter((p) => p.isFeatured);
    const rest = products.filter((p) => !p.isFeatured);
    return [...featured, ...rest];
  }, [products]);

  // Translate vertical wheel to horizontal scroll so mouse-only desktop users can
  // move the strip (trackpads already scroll horizontally natively).
  const stripRef = useRef<HTMLDivElement>(null);
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = stripRef.current;
    if (!el || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    el.scrollLeft += e.deltaY;
  };

  if (!products || ordered.length === 0) return null;

  const shown = ordered.slice(0, 4);
  const deskItems = ordered.slice(0, 10);
  const lead = shown[0] ?? null;
  const supporting = shown.slice(1);

  return (
    <section style={{ ...sectionShell, backgroundColor: c.background }}>
      <div style={{ maxWidth: contentMaxWidth, margin: '0 auto' }}>
        <SectionHeader
          trailing={
            <Link
              to="/shop"
              style={{
                color: c.primary,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: isMobile ? '0.88rem' : '0.95rem',
                whiteSpace: 'nowrap',
              }}
            >
              Shop all gear →
            </Link>
          }
            style={{ marginBottom: isMobile ? '1.2rem' : '1.75rem' }}
        >
          GEAR <span style={{ color: c.primary }}>UP</span>
        </SectionHeader>

          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {lead && <ProductCard product={lead} feature />}
              {supporting.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    gap: '0.85rem',
                    overflowX: 'auto',
                    paddingBottom: '0.25rem',
                    scrollSnapType: 'x proximity',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                  }}
                >
                  {supporting.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        flex: '0 0 min(74vw, 290px)',
                        scrollSnapAlign: 'start',
                      }}
                    >
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Single horizontal scroll strip of small (~160px) cards — a light
            // "preview strip" distinct from the full /shop grid. Right-edge fade
            // hints there's more to scroll; vertical wheel is mapped to horizontal.
            <div style={{ position: 'relative' }}>
              <div
                ref={stripRef}
                onWheel={onWheel}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  overflowX: 'auto',
                  paddingBottom: '0.5rem',
                  scrollSnapType: 'x proximity',
                  scrollbarWidth: 'none',
                }}
              >
                {deskItems.map((p) => (
                  <div
                    key={p.id}
                    style={{ flex: '0 0 160px', scrollSnapAlign: 'start' }}
                  >
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
              {/* Fade affordance: signals the strip continues past the right edge. */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: '0.5rem',
                  width: '3rem',
                  pointerEvents: 'none',
                  background: `linear-gradient(to right, transparent, ${c.background})`,
                }}
              />
            </div>
          )}
      </div>
    </section>
  );
};
