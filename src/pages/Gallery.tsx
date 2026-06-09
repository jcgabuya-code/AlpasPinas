import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors, type ColorPalette } from '../styles/colors';
import galleryData from '../data/gallery.json';

type Category = 'Training' | 'Races' | 'Off-water';

type Photo = {
  id: string;
  category: Category;
  src: string;
  alt: string;
  caption: string;
  credit: string | null;
};

const CATEGORIES: Category[] = ['Training', 'Races', 'Off-water'];

export const Gallery: React.FC = () => {
  const { theme } = useTheme();
  const c = colors[theme];
  const all = galleryData as Photo[];

  const [filter, setFilter] = useState<'All' | Category>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () => (filter === 'All' ? all : all.filter((p) => p.category === filter)),
    [all, filter]
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: all.length };
    for (const cat of CATEGORIES) map[cat] = all.filter((p) => p.category === cat).length;
    return map;
  }, [all]);

  const close = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(
    () => setLightboxIndex((i) => (i === null ? i : (i + filtered.length - 1) % filtered.length)),
    [filtered.length]
  );
  const next = useCallback(
    () => setLightboxIndex((i) => (i === null ? i : (i + 1) % filtered.length)),
    [filtered.length]
  );

  // Keyboard nav + body-scroll lock while lightbox open
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxIndex, close, prev, next]);

  const active = lightboxIndex === null ? null : filtered[lightboxIndex];

  return (
    <>
      {/* Hero banner */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          height: 'clamp(140px, 22vw, 240px)',
          overflow: 'hidden',
          backgroundColor: c.surface,
        }}
      >
        <img
          src="/team.jpg"
          alt="AlpasPinas Dragonboat Team"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 25%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 45%, ${c.background} 100%)`,
          }}
        />
      </section>

      {/* Page header */}
      <section style={{ padding: '2.5rem 1.5rem 2rem', backgroundColor: c.background }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <Link
            to="/"
            style={{
              display: 'inline-block',
              color: c.textSecondary,
              textDecoration: 'none',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
            ← Back to home
          </Link>

          <span
            style={{
              display: 'inline-block',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              border: `1px solid ${c.primary}55`,
              backgroundColor: `${c.primary}15`,
              color: c.primary,
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '1rem',
            }}
          >
            Photo Gallery
          </span>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
              color: c.text,
              margin: '0 0 0.75rem 0',
              letterSpacing: '0.02em',
              lineHeight: 1,
            }}
          >
            THE <span style={{ color: c.primary }}>CREW</span> IN FRAMES
          </h1>

          <p
            style={{
              color: c.textSecondary,
              fontSize: '1rem',
              maxWidth: '600px',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Training grinds, race-day battles, and the moments off the water that hold
            the team together.
          </p>
        </div>
      </section>

      {/* Tabs + grid */}
      <section style={{ padding: '1rem 1.5rem 5rem', backgroundColor: c.background }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Category tab strip */}
          <div
            role="tablist"
            aria-label="Gallery category"
            style={{
              display: 'inline-flex',
              flexWrap: 'wrap',
              padding: '0.3rem',
              borderRadius: '999px',
              backgroundColor: c.surface,
              border: `1px solid ${c.border}`,
              marginBottom: '1.75rem',
              gap: '0.15rem',
            }}
          >
            <TabButton active={filter === 'All'} onClick={() => setFilter('All')} c={c} label="All" count={counts.All} />
            {CATEGORIES.map((cat) => (
              <TabButton
                key={cat}
                active={filter === cat}
                onClick={() => setFilter(cat)}
                c={c}
                label={cat}
                count={counts[cat]}
              />
            ))}
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '1rem',
              }}
            >
              {filtered.map((photo, i) => (
                <button
                  key={photo.id}
                  onClick={() => setLightboxIndex(i)}
                  style={{
                    position: 'relative',
                    padding: 0,
                    border: `1px solid ${c.border}`,
                    borderRadius: '0.85rem',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    backgroundColor: c.surface,
                    aspectRatio: '4 / 3',
                    display: 'block',
                  }}
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.7) 100%)',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '0.6rem',
                      left: '0.6rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      backgroundColor: `${c.primary}dd`,
                      color: '#fff',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {photo.category}
                  </span>
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '0.7rem',
                      left: '0.7rem',
                      right: '0.7rem',
                      color: '#fff',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      textAlign: 'left',
                      lineHeight: 1.3,
                    }}
                  >
                    {photo.caption}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '4rem 1rem',
                textAlign: 'center',
                color: c.textSecondary,
                backgroundColor: c.surface,
                borderRadius: '0.85rem',
                border: `1px dashed ${c.border}`,
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
              <div style={{ fontWeight: 600, color: c.text, marginBottom: '0.35rem' }}>
                No photos in this category yet
              </div>
              <div style={{ fontSize: '0.85rem' }}>Try the All tab.</div>
            </div>
          )}

          <p
            style={{
              marginTop: '2rem',
              color: c.textSecondary,
              fontSize: '0.78rem',
              textAlign: 'center',
              opacity: 0.7,
            }}
          >
            Some shots are placeholders — edit{' '}
            <code style={{ color: c.primary }}>src/data/gallery.json</code> and drop real
            photos in <code style={{ color: c.primary }}>public/gallery/</code> to swap them in.
          </p>
        </div>
      </section>

      {/* Lightbox */}
      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.caption}
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          {/* Close */}
          <button
            onClick={close}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '1.1rem',
              right: '1.1rem',
              width: '2.6rem',
              height: '2.6rem',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.12)',
              color: '#fff',
              fontSize: '1.3rem',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ✕
          </button>

          {filtered.length > 1 && (
            <>
              <NavArrow side="left" onClick={prev} />
              <NavArrow side="right" onClick={next} />
            </>
          )}

          <figure
            onClick={(e) => e.stopPropagation()}
            style={{
              margin: 0,
              maxWidth: 'min(1000px, 92vw)',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <img
              src={active.src}
              alt={active.alt}
              style={{
                maxWidth: '100%',
                maxHeight: '78vh',
                objectFit: 'contain',
                borderRadius: '0.5rem',
              }}
            />
            <figcaption
              style={{
                marginTop: '0.85rem',
                color: '#fff',
                textAlign: 'center',
                fontSize: '0.95rem',
              }}
            >
              {active.caption}
              <span style={{ opacity: 0.55, fontSize: '0.8rem', marginLeft: '0.6rem' }}>
                {active.category}
                {active.credit ? ` · ${active.credit}` : ''}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
};

const NavArrow: React.FC<{ side: 'left' | 'right'; onClick: () => void }> = ({ side, onClick }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
    style={{
      position: 'absolute',
      [side]: '1rem',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '3rem',
      height: '3rem',
      borderRadius: '999px',
      border: 'none',
      backgroundColor: 'rgba(255,255,255,0.12)',
      color: '#fff',
      fontSize: '1.5rem',
      cursor: 'pointer',
      lineHeight: 1,
    }}
  >
    {side === 'left' ? '‹' : '›'}
  </button>
);

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
      padding: '0.55rem 1.1rem',
      borderRadius: '999px',
      fontSize: '0.88rem',
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'inherit',
      border: 'none',
      backgroundColor: active ? c.primary : 'transparent',
      color: active ? '#fff' : c.textSecondary,
      transition: 'all 0.15s ease',
      letterSpacing: '0.02em',
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
