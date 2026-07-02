import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';
import { useIsMobile } from '../hooks/useIsMobile';
import { useInView } from '../hooks/useInView';
import { SectionHeader } from './SectionHeader';
import { sectionShell, contentMaxWidth } from '../styles/tokens';

// The weekly training rhythm — two weeknight land/technique sessions plus the
// weekend full-crew water time. `open` sessions welcome drop-ins; the closed one
// is crew-only. Mirrors the Home v2 reference's "Weekly Rhythm" timeline.
type Venue = 'land' | 'lake';

type Session = {
  venue: Venue;
  day: string;
  cadence: string;
  time: string;
  title: string;
  focus: string;
  loc: string;
  level: string;
  open: boolean;
  openLabel: string;
  spots: string;
};

const SCHEDULE: Session[] = [
  {
    venue: 'land',
    day: 'TUE',
    cadence: 'Weeknight',
    time: '7:00 – 9:00 PM',
    title: 'Land & Erg Conditioning',
    focus: 'Strength circuit, paddle ergs, and core work to build the engine off the water.',
    loc: 'Subang PARC',
    level: 'All levels',
    open: true,
    openLabel: 'Drop-ins welcome',
    spots: '8 spots left',
  },
  {
    venue: 'land',
    day: 'THU',
    cadence: 'Weeknight',
    time: '7:00 – 9:00 PM',
    title: 'Land & Erg Conditioning',
    focus: 'Strength circuit, paddle ergs, and core work to build the engine off the water.',
    loc: 'Subang PARC',
    level: 'All levels',
    open: true,
    openLabel: 'Drop-ins welcome',
    spots: '8 spots left',
  },
  {
    venue: 'lake',
    day: 'SAT',
    cadence: 'Weekend',
    time: '7:00 – 10:00 AM',
    title: 'Full Crew Session',
    focus: 'Full-boat pieces, race starts, and crew building. The best place to try paddling.',
    loc: 'Marina Putrajaya',
    level: 'All levels',
    open: true,
    openLabel: 'Beginner friendly',
    spots: 'Open seat',
  },
  {
    venue: 'lake',
    day: 'SUN',
    cadence: 'Weekend',
    time: '7:00 – 10:00 AM',
    title: 'Full Crew Session',
    focus: 'Full-boat pieces, race starts, and crew building. The best place to try paddling.',
    loc: 'Marina Putrajaya',
    level: 'All levels',
    open: true,
    openLabel: 'Beginner friendly',
    spots: 'Open seat',
  },
];

// The two disciplines, rendered as stacked labeled bands. Each band keeps the
// single-timeline rhythm but carries its own mini-header + glyph so land and
// water training read as distinct blocks.
type Group = { venue: Venue; label: string; tag: string };
const GROUPS: Group[] = [
  { venue: 'land', label: 'On Land', tag: 'Strength & Erg' },
  { venue: 'lake', label: 'On the Water', tag: 'Boat time' },
];

// "Book a Session" / "Reserve a seat" message the crew, so they carry the WhatsApp
// green + glyph — consistent with the hero CTA.
const WA_GRADIENT = 'linear-gradient(135deg, #1faa4d, #25D366)';

const PinGlyph: React.FC<{ color: string; size?: number }> = ({ color, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s-6.5-5.2-6.5-10.2A6.5 6.5 0 0 1 18.5 10.8C18.5 15.8 12 21 12 21z" />
    <circle cx="12" cy="10.5" r="2.4" />
  </svg>
);

const StarGlyph: React.FC<{ color: string; size?: number }> = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z" />
  </svg>
);

// Land = dumbbell, lake = wave — the group-header marks.
const LandGlyph: React.FC<{ color: string; size?: number }> = ({ color, size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" />
  </svg>
);

const WaveGlyph: React.FC<{ color: string; size?: number }> = ({ color, size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 8c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2M2 15c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2" />
  </svg>
);

const WhatsAppGlyph: React.FC<{ size?: number }> = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2z" />
  </svg>
);

export const TrainingSchedule: React.FC = () => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const isDark = theme === 'dark';
  const isMobile = useIsMobile();
  const [ref, inView] = useInView<HTMLDivElement>();
  const [reserveHover, setReserveHover] = useState(false);

  const accent = isDark ? c.primaryLight : c.primary;
  const cardBg = c.surface;

  // Open/closed status pill — open sessions glow in the brand accent; closed
  // (crew-only) sessions read as a quiet neutral chip.
  const statusBadge = (s: Session) =>
    s.open ? (
      <span
        style={{
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.8rem',
          borderRadius: '999px',
          background: `${c.primary}1f`,
          border: `1px solid ${c.primary}59`,
          color: accent,
          fontSize: '0.74rem',
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        <span aria-hidden="true" style={{ width: '6px', height: '6px', borderRadius: '999px', backgroundColor: c.primary }} />
        {s.openLabel}
      </span>
    ) : (
      <span
        style={{
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.35rem 0.8rem',
          borderRadius: '999px',
          background: isDark ? 'rgba(255,255,255,0.04)' : c.surfaceAlt,
          border: `1px solid ${c.border}`,
          color: c.textSecondary,
          fontSize: '0.74rem',
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        {s.openLabel}
      </span>
    );

  // The card body — title + status, focus copy, and the location / level / spots
  // footer. Shared by the desktop timeline and the mobile stack.
  const card = (s: Session) => (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${c.border}`,
        borderRadius: '0.95rem',
        padding: isMobile ? '1.1rem 1.15rem' : '1.25rem 1.4rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.9rem', marginBottom: '0.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.25rem' : '1.42rem', letterSpacing: '0.02em', lineHeight: 1.05, color: c.text, margin: 0 }}>
          {s.title}
        </h3>
        {statusBadge(s)}
      </div>
      <p style={{ fontSize: '0.88rem', lineHeight: 1.55, color: c.textSecondary, margin: '0 0 0.95rem', maxWidth: '560px' }}>
        {s.focus}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', color: c.textSecondary }}>
          <PinGlyph color={accent} />
          {s.loc}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.textSecondary }}>
          <StarGlyph color={accent} />
          {s.level}
        </span>
        <span style={{ marginLeft: isMobile ? 0 : 'auto', fontSize: '0.78rem', fontWeight: 800, color: accent }}>
          {s.spots}
        </span>
      </div>
    </div>
  );

  // Left meta column — day / cadence / time. Right-aligned on desktop so it reads
  // into the timeline rail; left-aligned inline on mobile.
  const meta = (s: Session) => (
    <>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.4rem' : '1.85rem', color: accent, lineHeight: 1 }}>{s.day}</div>
      <div style={{ fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.textSecondary, marginTop: '0.35rem' }}>{s.cadence}</div>
      <div style={{ fontSize: '0.82rem', color: c.textSecondary, marginTop: '0.5rem', fontVariantNumeric: 'tabular-nums' }}>{s.time}</div>
    </>
  );

  return (
    <section
      style={{
        backgroundColor: c.background,
        borderTop: `1px solid ${c.border}`,
        ...sectionShell,
        // Tighten the bottom so the following marquee band sits closer on desktop.
        paddingBottom: 'clamp(1.75rem, 3vw, 2.75rem)',
      }}
    >
      <div style={{ maxWidth: contentMaxWidth, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="The Weekly Rhythm"
          size="lg"
          style={{ marginBottom: isMobile ? '2.25rem' : '2.75rem' }}
          trailing={
            <p style={{ maxWidth: '350px', color: c.textSecondary, fontSize: '0.95rem', lineHeight: 1.55, margin: 0 }}>
              Four sessions a week — weeknights for fitness and technique, weekends for full-crew
              water time. Sessions marked <span style={{ color: accent, fontWeight: 700 }}>open</span> welcome
              drop-ins, no membership needed.
            </p>
          }
        >
          TRAINING <span style={{ color: accent }}>SCHEDULE</span>
        </SectionHeader>

        {/* Group band header — glyph + "On Land" / "On the Water" + a quiet tag,
            with a hairline rule running out to the right. */}
        {(() => {
          const groupHeader = (g: Group, delay: number) => (
            <div
              className={`reveal${inView ? ' is-visible' : ''}`}
              style={{
                animationDelay: `${delay}s`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.7rem',
                marginBottom: isMobile ? '1.1rem' : '1.35rem',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 34,
                  height: 34,
                  flexShrink: 0,
                  borderRadius: '0.6rem',
                  background: `${c.primary}1f`,
                  border: `1px solid ${c.primary}59`,
                }}
              >
                {g.venue === 'land' ? <LandGlyph color={accent} /> : <WaveGlyph color={accent} />}
              </span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.2rem' : '1.35rem', letterSpacing: '0.03em', color: c.text, margin: 0, whiteSpace: 'nowrap' }}>
                {g.label}
              </h3>
              <span style={{ fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.textSecondary, whiteSpace: 'nowrap' }}>
                {g.tag}
              </span>
              <span aria-hidden="true" style={{ flex: 1, height: '1px', backgroundColor: c.border, marginLeft: '0.3rem' }} />
            </div>
          );

          let idx = 0;
          return (
            <div ref={ref}>
              {GROUPS.map((g, gi) => {
                const sessions = SCHEDULE.filter((s) => s.venue === g.venue);
                if (sessions.length === 0) return null;
                const header = groupHeader(g, idx * 0.08);
                idx += 1;
                return (
                  <div key={g.venue} style={{ marginTop: gi === 0 ? 0 : isMobile ? '2rem' : '2.5rem' }}>
                    {header}
                    {isMobile
                      ? /* Mobile — stacked cards with an inline meta header */
                        sessions.map((s) => {
                          const delay = idx++ * 0.08;
                          return (
                            <div
                              key={s.day + s.title}
                              className={`reveal${inView ? ' is-visible' : ''}`}
                              style={{ animationDelay: `${delay}s`, marginBottom: '1rem' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', marginBottom: '0.6rem' }}>
                                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: accent, lineHeight: 1 }}>{s.day}</span>
                                <span style={{ fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.textSecondary }}>{s.cadence}</span>
                                <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: c.textSecondary, fontVariantNumeric: 'tabular-nums' }}>{s.time}</span>
                              </div>
                              {card(s)}
                            </div>
                          );
                        })
                      : /* Desktop — meta · rail · card timeline */
                        sessions.map((s, i) => {
                          const isLast = i === sessions.length - 1;
                          const delay = idx++ * 0.08;
                          return (
                            <div
                              key={s.day + s.title}
                              className={`reveal${inView ? ' is-visible' : ''}`}
                              style={{ animationDelay: `${delay}s`, display: 'grid', gridTemplateColumns: '150px 40px 1fr', alignItems: 'start' }}
                            >
                              {/* Meta column */}
                              <div style={{ textAlign: 'right', padding: '0.35rem 0 1.75rem' }}>{meta(s)}</div>

                              {/* Timeline rail + node */}
                              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                                <span
                                  aria-hidden="true"
                                  style={{
                                    position: 'absolute',
                                    top: i === 0 ? '0.6rem' : 0,
                                    bottom: isLast ? 'auto' : 0,
                                    height: isLast ? '0.6rem' : undefined,
                                    width: '2px',
                                    backgroundColor: c.border,
                                  }}
                                />
                                <span
                                  aria-hidden="true"
                                  style={{
                                    position: 'relative',
                                    marginTop: '0.55rem',
                                    width: '13px',
                                    height: '13px',
                                    borderRadius: '999px',
                                    backgroundColor: c.background,
                                    border: `2px solid ${c.primary}`,
                                    boxShadow: `0 0 0 4px ${c.primary}1f`,
                                  }}
                                />
                              </div>

                              {/* Card */}
                              <div style={{ margin: '0 0 1rem 0.5rem' }}>{card(s)}</div>
                            </div>
                          );
                        })}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* New-here CTA — beginner-friendly nudge into the Saturday session */}
        <div
          className={`reveal${inView ? ' is-visible' : ''}`}
          style={{
            animationDelay: '0.4s',
            marginTop: '1rem',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '1rem' : '1.4rem',
            padding: isMobile ? '1.3rem' : '1.4rem 1.6rem',
            borderRadius: '1rem',
            border: `1px solid ${c.border}`,
            backgroundColor: cardBg,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '0.75rem',
              flexShrink: 0,
              background: WA_GRADIENT,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <WhatsAppGlyph />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: c.text, margin: '0 0 0.25rem' }}>
              New here? Start on a Saturday.
            </h3>
            <p style={{ color: c.textSecondary, fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              Weekend sessions are beginner-friendly and all gear is provided. Message us to reserve
              your seat for this week.
            </p>
          </div>
          <a
            href="#contact"
            onMouseEnter={() => setReserveHover(true)}
            onMouseLeave={() => setReserveHover(false)}
            style={{
              flexShrink: 0,
              alignSelf: isMobile ? 'stretch' : 'auto',
              textAlign: 'center',
              textDecoration: 'none',
              background: WA_GRADIENT,
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.9rem',
              padding: '0.85rem 1.4rem',
              borderRadius: '999px',
              whiteSpace: 'nowrap',
              transform: reserveHover ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: reserveHover
                ? '0 16px 34px rgba(37,211,102,0.46)'
                : '0 10px 26px rgba(37,211,102,0.34)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            Reserve a seat →
          </a>
        </div>
      </div>
    </section>
  );
};
