import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { colors, brandGradient } from '../styles/colors';
import { useIsMobile } from '../hooks/useIsMobile';
import { useInView } from '../hooks/useInView';
import { SectionHeader } from './SectionHeader';
import { sectionShell, contentMaxWidth } from '../styles/tokens';

// The four phases of a paddle stroke, each mapped to a reason to join. The boat
// only moves when a crew nails all four — so the section reads as one continuous
// stroke rather than a grid of unrelated benefit cards. `angle` rotates the paddle
// glyph to trace the blade's path through the water across the cycle.
const PHASES = [
  { n: '01', phase: 'Catch', title: 'Structured Training', desc: 'Weekly water sessions that drill timing, reach, and a clean catch.', angle: -36 },
  { n: '02', phase: 'Pull', title: 'Strength & Conditioning', desc: 'Land training builds the engine that powers every pull.', angle: -10 },
  { n: '03', phase: 'Drive', title: 'Race Ready', desc: 'Regattas and festivals — mixed, open, and women’s crews each season.', angle: 18 },
  { n: '04', phase: 'Recover', title: 'Real Community', desc: 'Breakfasts, socials, and travel together between the strokes.', angle: 44 },
];

// A single paddle, rotated to show its angle in the stroke. Drawn to match the
// site's hand-traced line-art icon system.
const PaddleGlyph: React.FC<{ rotate: number; size?: number }> = ({ rotate, size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: `rotate(${rotate}deg)`, transition: 'transform 0.3s ease' }}
    aria-hidden="true"
  >
    <path d="M9.2 3h5.6" />
    <path d="M12 3v9.2" />
    <path d="M12 12.2c-3.4 0-4.5 2.6-4 5.2.4 2 1.9 3.1 4 3.1s3.6-1.1 4-3.1c.5-2.6-.6-5.2-4-5.2Z" />
    <path d="M12 12.2V20" strokeWidth="1.1" opacity="0.5" />
  </svg>
);

const IconGear = () => (
  <svg width="24" height="24" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 4h8l2 4v6l-2 3H10L8 14V8Z" />
    <line x1="14" y1="4" x2="14" y2="17" strokeDasharray="2 1.5" />
    <path d="M8 8 C5 8 4 10 4 13 C4 17 6 20 9 21" />
    <path d="M20 8 C23 8 24 10 24 13 C24 17 22 20 19 21" />
    <path d="M9 21 Q14 24 19 21" />
  </svg>
);

const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 12.5l5 5 11-11" />
  </svg>
);

export const Features: React.FC = () => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const isDark = theme === 'dark';
  const isMobile = useIsMobile();
  const [ref, inView] = useInView<HTMLDivElement>();
  const [hovered, setHovered] = useState<number | null>(null);

  const accent = isDark ? c.primaryLight : c.primary;
  const medallionBg = isDark ? c.surface : '#fff';
  const lineFaint = `${c.primary}3a`;
  const hoverShadow = isDark ? '0 16px 36px -12px rgba(0,0,0,0.7)' : '0 16px 36px -14px rgba(15,23,42,0.28)';
  const last = PHASES.length - 1;

  // A node on the stroke axis — the rotated paddle in a circular medallion. Solid
  // fill so the connector line reads as passing into it. Hover fills it with the
  // brand gradient and lifts it off the line.
  const medallion = (i: number, size: number) => {
    const active = hovered === i;
    return (
      <div
        onMouseEnter={() => setHovered(i)}
        onMouseLeave={() => setHovered(null)}
        style={{
          position: 'relative',
          zIndex: 1,
          width: size,
          height: size,
          borderRadius: '50%',
          flexShrink: 0,
          background: active ? brandGradient(brand, theme) : medallionBg,
          border: `1.5px solid ${active ? 'transparent' : c.border}`,
          color: active ? '#fff' : accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: active ? hoverShadow : 'none',
          transform: active ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease, border-color 0.25s ease',
          cursor: 'default',
        }}
      >
        <PaddleGlyph rotate={PHASES[i].angle} size={size * 0.46} />
      </div>
    );
  };

  // The eyebrow + numeral + phase name header that sits above each reason's copy.
  const phaseHeader = (p: (typeof PHASES)[number], align: 'center' | 'flex-start') => (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: align, gap: '0.5rem', marginBottom: '0.4rem' }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', lineHeight: 1, color: accent, opacity: 0.4 }}>{p.n}</span>
      <span style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent }}>{p.phase}</span>
    </div>
  );

  const title = (t: string) => (
    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.02em', lineHeight: 1.05, color: c.text, margin: '0 0 0.35rem' }}>{t}</h3>
  );
  const desc = (d: string) => (
    <p style={{ color: c.textSecondary, fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>{d}</p>
  );

  return (
    <section id="about" style={{ backgroundColor: c.sand, ...sectionShell }}>
      <div style={{ maxWidth: contentMaxWidth, margin: '0 auto' }}>

        {/* Section header — introduces the stroke-cycle framing */}
        <SectionHeader eyebrow="The Stroke" size="lg" style={{ marginBottom: '0.9rem' }}>
          BUILT FOR{' '}
          <span
            style={{
              background: brandGradient(brand, theme),
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            THE WATER
          </span>
        </SectionHeader>
        <p style={{ color: c.textSecondary, fontSize: '1rem', lineHeight: 1.6, maxWidth: '540px', margin: `0 0 ${isMobile ? '2.5rem' : '3.5rem'}` }}>
          Four reasons to join — one for each phase of the stroke that drives the boat.
          Nail all four, and the whole crew flies.
        </p>

        {isMobile ? (
          /* Mobile — vertical stroke timeline */
          <div ref={ref}>
            {PHASES.map((p, i) => (
              <div key={p.n} style={{ display: 'flex', gap: '1.1rem', alignItems: 'stretch' }}>
                {/* Rail: medallion + the connecting current line down to the next phase */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {medallion(i, 52)}
                  {i < last && (
                    <div
                      className="stroke-flow-y"
                      style={{
                        flex: 1,
                        width: 3,
                        minHeight: 22,
                        marginTop: '0.4rem',
                        borderRadius: 999,
                        backgroundColor: lineFaint,
                        backgroundImage: `linear-gradient(180deg, transparent 0%, ${c.sun} 50%, transparent 100%)`,
                        backgroundSize: '100% 80px',
                        backgroundRepeat: 'repeat-y',
                      }}
                    />
                  )}
                </div>
                {/* Copy */}
                <div className={`reveal${inView ? ' is-visible' : ''}`} style={{ animationDelay: `${i * 0.1}s`, paddingBottom: i < last ? '1.9rem' : 0, paddingTop: '0.15rem' }}>
                  {phaseHeader(p, 'flex-start')}
                  {title(p.title)}
                  {desc(p.desc)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop — horizontal stroke cycle */
          <div ref={ref}>
            {/* Axis: connector line + the four medallions, centered per column */}
            <div style={{ position: 'relative', marginBottom: '1.75rem' }}>
              <div
                className="stroke-flow-x"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '12.5%',
                  right: '12.5%',
                  height: 3,
                  transform: 'translateY(-50%)',
                  borderRadius: 999,
                  backgroundColor: lineFaint,
                  backgroundImage: `linear-gradient(90deg, transparent 0%, ${c.sun} 50%, transparent 100%)`,
                  backgroundSize: '220px 100%',
                  backgroundRepeat: 'repeat-x',
                  zIndex: 0,
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {PHASES.map((p, i) => (
                  <div
                    key={p.n}
                    className={`reveal${inView ? ' is-visible' : ''}`}
                    style={{ animationDelay: `${i * 0.1}s`, display: 'flex', justifyContent: 'center' }}
                  >
                    {medallion(i, 64)}
                  </div>
                ))}
              </div>
            </div>
            {/* Copy row, centered under each medallion */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', columnGap: '1.5rem' }}>
              {PHASES.map((p, i) => (
                <div
                  key={p.n}
                  className={`reveal${inView ? ' is-visible' : ''}`}
                  style={{ animationDelay: `${i * 0.1 + 0.06}s`, textAlign: 'center', paddingInline: '0.5rem' }}
                >
                  {phaseHeader(p, 'center')}
                  {title(p.title)}
                  {desc(p.desc)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reassurance bar — gear is on us (the old "Gear Provided" card, reframed
            as a footnote so it doesn't compete with the four-phase cycle) */}
        <div
          className={`reveal${inView ? ' is-visible' : ''}`}
          style={{
            animationDelay: '0.5s',
            marginTop: isMobile ? '2.5rem' : '3.5rem',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: '1.25rem',
            padding: isMobile ? '1.4rem' : '1.4rem 1.75rem',
            borderRadius: '1rem',
            border: `1px solid ${c.border}`,
            backgroundColor: isDark ? c.surface : '#fff',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '0.75rem',
              flexShrink: 0,
              background: brandGradient(brand, theme),
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconGear />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: c.text, margin: '0 0 0.3rem', letterSpacing: '-0.01em' }}>
              Gear’s on us
            </h3>
            <p style={{ color: c.textSecondary, margin: 0, fontSize: '0.9rem', lineHeight: 1.55 }}>
              Boat, paddles, and life vests provided. Just bring water, sun protection, and the willingness to get wet.
            </p>
          </div>
          <span
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1.1rem',
              borderRadius: 999,
              backgroundColor: `${c.primary}15`,
              border: `1px solid ${c.primary}44`,
              color: accent,
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
            }}
          >
            No gear needed
            <IconCheck />
          </span>
        </div>
      </div>
    </section>
  );
};
