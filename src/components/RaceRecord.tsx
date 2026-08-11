import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';
import { sectionShell, contentMaxWidth } from '../styles/tokens';
import { SectionHeader } from './SectionHeader';
import { useInView } from '../hooks/useInView';
import { useIsMobile } from '../hooks/useIsMobile';
import { parseEventDate, medalColor, medalLabel, type RaceEvent } from './EventCard';
import eventsData from '../data/events.json';
import { useContent } from '../context/SiteContentContext';
import race1 from '../../images/race-1.jpg';
import race2 from '../../images/race-2.jpg';
import race3 from '../../images/race-3.jpeg';

// Race-day action that cross-fades in the Race Record card. Each source is a ~3:2
// landscape shot, so the card frame is 3:2 and the whole image fits (minimal crop).
// Team/roster photos live in the About section now — this card stays race action only.
const RACE_PHOTOS = [
  { src: race1, alt: 'AlpasPinas mid-stroke during a race, Philippine-flag paddles raised', objectPosition: 'center' },
  { src: race2, alt: 'AlpasPinas crews racing hard through the course', objectPosition: 'center' },
  { src: race3, alt: 'The AlpasPinas women’s crew driving through a race', objectPosition: 'center' },
];

/**
 * "On the Water" — the crew's race record. Binds to the real results in
 * events.json (any event with a `result`), newest first: a sticky team photo with
 * derived stats on the left, a results table on the right. Reuses EventCard's
 * medal helpers so podium colors stay consistent across the site.
 */
export const RaceRecord: React.FC = () => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const isDark = theme === 'dark';
  const isMobile = useIsMobile();
  const [ref, inView] = useInView<HTMLDivElement>();
  const [photo, setPhoto] = useState(0);
  const intro = useContent(
    'raceRecord.intro',
    "Seasons of racing across the region and a growing trophy shelf. Here's where we've lined up lately.",
  );

  const accent = isDark ? c.accent : c.primary;

  // Auto cross-fade through the team photos, unless the user prefers reduced motion
  // (then the first photo stays put; the dots still allow manual selection).
  useEffect(() => {
    if (RACE_PHOTOS.length < 2) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setPhoto((i) => (i + 1) % RACE_PHOTOS.length), 4500);
    return () => window.clearInterval(id);
  }, []);

  // Past races with a recorded result, newest first.
  const results = useMemo(
    () =>
      (eventsData as RaceEvent[])
        .filter((e) => e.result)
        .sort((a, b) => parseEventDate(b.date).getTime() - parseEventDate(a.date).getTime()),
    [],
  );

  const podiums = results.filter((e) => (e.result?.rank ?? 99) <= 3).length;

  if (results.length === 0) return null;

  const stat = (value: string | number, label: string) => (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '2rem' : '2.4rem', color: accent, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.66rem', letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(245,247,251,0.72)', marginTop: '0.3rem' }}>{label}</div>
    </div>
  );

  const photoCard = (
    <div
      style={{
        position: isMobile ? 'relative' : 'sticky',
        top: isMobile ? undefined : '5.5rem',
        borderRadius: '1.1rem',
        overflow: 'hidden',
        border: `1px solid ${c.border}`,
        aspectRatio: '3 / 2',
      }}
    >
      {/* Cross-fading photos, stacked; only the active one is opaque */}
      {RACE_PHOTOS.map((p, i) => (
        <img
          key={p.src}
          src={p.src}
          alt={i === photo ? p.alt : ''}
          aria-hidden={i === photo ? undefined : true}
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: p.objectPosition,
            display: 'block',
            opacity: i === photo ? 1 : 0,
            transition: 'opacity 1s ease',
          }}
        />
      ))}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,16,24,0) 38%, rgba(10,16,24,0.55) 70%, rgba(10,16,24,0.94) 100%)' }}
      />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: isMobile ? '1.2rem 1.3rem' : '1.4rem 1.5rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1.6rem', alignItems: 'flex-end' }}>
          {stat(podiums, 'Podium finishes')}
          {stat(results.length, 'Races logged')}
        </div>
        {/* Photo dots — indicate + jump between shots */}
        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, paddingBottom: '0.2rem' }}>
          {RACE_PHOTOS.map((p, i) => (
            <button
              key={p.src}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === photo}
              onClick={() => setPhoto(i)}
              style={{
                width: '20px',
                height: '8px',
                padding: 0,
                border: 'none',
                borderRadius: '999px',
                cursor: 'pointer',
                background: i === photo ? '#fff' : 'rgba(255,255,255,0.5)',
                transform: i === photo ? 'scaleX(1)' : 'scaleX(0.4)',
                transformOrigin: 'center',
                transition: 'transform 0.3s ease, background 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  // One results row: year · event/category · time · place badge.
  const row = (e: RaceEvent, i: number) => {
    const rank = e.result!.rank;
    const medal = medalColor(rank, isDark);
    return (
      <div
        key={e.id}
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr auto' : '68px 1fr auto auto',
          gap: isMobile ? '0.5rem 1rem' : '1.25rem',
          alignItems: 'center',
          padding: isMobile ? '1rem 0' : '1.25rem 0.25rem',
          borderTop: i === 0 ? 'none' : `1px solid ${c.border}`,
        }}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: c.textSecondary, gridRow: isMobile ? '1' : undefined }}>
          {parseEventDate(e.date).getFullYear()}
        </div>
        <div style={{ minWidth: 0, gridColumn: isMobile ? '1 / -1' : undefined, order: isMobile ? 2 : undefined }}>
          <div style={{ fontWeight: 700, fontSize: isMobile ? '1.08rem' : '1.22rem', color: c.text, lineHeight: 1.25 }}>{e.name}</div>
          <div style={{ fontSize: '0.9rem', color: c.textSecondary, marginTop: '0.25rem' }}>{e.result!.category}</div>
        </div>
        {!isMobile && (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: c.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
            {e.result!.time}
          </div>
        )}
        <span
          style={{
            justifySelf: isMobile ? 'end' : 'center',
            order: isMobile ? 1 : undefined,
            minWidth: '84px',
            textAlign: 'center',
            padding: '0.45rem 0.9rem',
            borderRadius: '999px',
            fontWeight: 800,
            fontSize: '0.86rem',
            letterSpacing: '0.03em',
            background: medal ? `${medal}22` : 'rgba(255,255,255,0.05)',
            border: `1px solid ${medal ? `${medal}66` : c.border}`,
            color: medal ?? c.textSecondary,
            whiteSpace: 'nowrap',
          }}
        >
          {medalLabel(rank)}
        </span>
      </div>
    );
  };

  return (
    <section
      style={{
        ...sectionShell,
        // A touch tighter than the default section rhythm.
        paddingBlock: 'clamp(2.75rem, 6vw, 4.5rem)',
        backgroundColor: c.background,
        borderTop: `1px solid ${c.border}`,
      }}
    >
      <div style={{ maxWidth: contentMaxWidth, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="On the Water"
          size="lg"
          style={{ marginBottom: isMobile ? '1.75rem' : '2.5rem' }}
          trailing={
            <p style={{ maxWidth: '360px', color: c.textSecondary, fontSize: '1.05rem', lineHeight: 1.6, margin: 0 }}>
              {intro}
            </p>
          }
        >
          RACE <span style={{ color: accent }}>RECORD</span>
        </SectionHeader>

        <div
          ref={ref}
          className={`reveal${inView ? ' is-visible' : ''}`}
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1.1fr',
            gap: isMobile ? '1.5rem' : '2.5rem',
            alignItems: 'start',
          }}
        >
          {photoCard}
          <div>{results.map((e, i) => row(e, i))}</div>
        </div>
      </div>
    </section>
  );
};
