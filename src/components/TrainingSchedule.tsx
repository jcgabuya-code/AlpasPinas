import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors, brandGradient } from '../styles/colors';
import { useIsMobile } from '../hooks/useIsMobile';
import { useInView } from '../hooks/useInView';
import { SectionHeader } from './SectionHeader';
import { sectionShell, contentMaxWidth } from '../styles/tokens';
import { useContent } from '../context/SiteContentContext';
import landPhoto from '../../images/training/land-training.jpg';
import waterPhoto from '../../images/training/water-training.jpg';
import { BarsGlyph, LinesGlyph } from './icons/trainingGlyphs';

// Lightbox detail marks — a teardrop pin (rotated square, one square corner) for
// "Where" and a clock face with two hand-bars for "When". Same border-only CSS-shape
// technique as the reference, no icon library.
const PinMark: React.FC<{ color: string }> = ({ color }) => (
  <span
    aria-hidden="true"
    style={{ flexShrink: 0, width: '15px', height: '15px', border: `2px solid ${color}`, borderRadius: '50% 50% 50% 2px', transform: 'rotate(-45deg)' }}
  />
);

const ClockMark: React.FC<{ color: string }> = ({ color }) => (
  <span aria-hidden="true" style={{ position: 'relative', flexShrink: 0, width: '15px', height: '15px', border: `2px solid ${color}`, borderRadius: '50%' }}>
    <span style={{ position: 'absolute', left: '5px', top: '2px', width: '2px', height: '5px', background: color }} />
    <span style={{ position: 'absolute', left: '5px', top: '5px', width: '5px', height: '2px', background: color }} />
  </span>
);

// CTA badge — a week strip (calendar body + 4 marked days) standing in for
// "four sessions a week", instead of spelling it out as flat "4×" text.
const WeekGlyph: React.FC<{ color: string; size?: number }> = ({ color, size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 3v3M16 3v3" />
    <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
    <path d="M3.5 9.5h17" />
    <circle cx="7.5" cy="14.5" r="1" fill={color} stroke="none" />
    <circle cx="11.5" cy="14.5" r="1" fill={color} stroke="none" />
    <circle cx="15.5" cy="14.5" r="1" fill={color} stroke="none" />
    <circle cx="19.5" cy="14.5" r="1" fill={color} stroke="none" />
  </svg>
);

// Training Reel — two hand-picked photos standing in for the weekly rhythm.
// Hover a side to lean in (desktop); on touch/narrow viewports both panels sit
// equal and every detail is already visible. Tap either side for the full frame
// in a lightbox. Reference: images/Training Reel Design Update/.
type Venue = 'land' | 'water';

type ReelSession = {
  venue: Venue;
  kicker: string;
  cadence: string;
  title: string;
  body: string;
  photo: string;
  photoAlt: string;
  lightboxTitle: string;
  lightboxBody: string;
  place: string;
  time: string;
};

const LAND: ReelSession = {
  venue: 'land',
  kicker: 'Strength & Erg',
  cadence: 'Tue & Thu · 7–9 PM',
  title: 'On Land',
  body: 'Strength circuit, paddle ergs, and core work to build the engine off the water.',
  photo: landPhoto,
  photoAlt: 'The AlpasPinas crew training under the lit dome at Botanical Gardens',
  lightboxTitle: 'Land & Erg Conditioning',
  lightboxBody:
    'Tuesdays and Thursdays we get loud on dry ground — strength circuits, paddle ergs, and core work to build the engine that shows up on race day.',
  place: 'Botanical Gardens',
  time: 'Tue & Thu · 7:00 – 9:00 PM · Drop-ins welcome',
};

const WATER: ReelSession = {
  venue: 'water',
  kicker: 'Boat Time',
  cadence: 'Sat & Sun · 7–10 AM',
  title: 'On the Water',
  body: 'Full-boat pieces and race starts at Marina Putrajaya — the best place to try paddling for the first time.',
  photo: waterPhoto,
  photoAlt: 'The full crew in the dragon boat under the bridge at Marina Putrajaya',
  lightboxTitle: 'Full Crew Session',
  lightboxBody:
    'Weekend mornings are full-boat pieces, race starts, and crew building at Marina Putrajaya. The best place to try paddling for the first time.',
  place: 'Marina Putrajaya / Subang PARC',
  time: 'Sat & Sun · 7:00 – 10:00 AM · 8 spots left',
};

const SESSIONS = [LAND, WATER];

export const TrainingSchedule: React.FC = () => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const isDark = theme === 'dark';
  const isMobile = useIsMobile();
  const [ref, inView] = useInView<HTMLDivElement>();
  const [active, setActive] = useState<Venue | null>(null);
  const [lightbox, setLightbox] = useState<ReelSession | null>(null);
  const [reserveHover, setReserveHover] = useState(false);
  const [bookHover, setBookHover] = useState(false);

  const intro = useContent(
    'training.intro',
    'Weeknights we build the engine on land. Weekends we put it in the boat. Hover a side to lean in — tap it for the full frame.',
  );
  const cta = useContent(
    'training.cta',
    'Four sessions a week. Weekend sessions are beginner-friendly and all gear is provided.',
  );

  const accent = isDark ? c.accent : c.primary;

  // Esc to close the lightbox + lock body scroll while it's open.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox]);

  const openKey = (e: React.KeyboardEvent, s: ReelSession) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setLightbox(s);
    }
  };

  const hintLabel = isMobile
    ? 'Tap a photo for the full frame'
    : active
      ? `${active === 'land' ? 'Land' : 'Water'} session — tap for the full frame`
      : 'Hover to lean in · tap to open';

  const panel = (s: ReelSession) => {
    const on = isMobile || active === s.venue;
    const grow = isMobile ? 1 : active === s.venue ? 1.75 : active ? 0.75 : 1;
    return (
      <div
        key={s.venue}
        role="button"
        tabIndex={0}
        aria-label={`${s.title} — ${s.lightboxTitle}`}
        onMouseEnter={() => setActive(s.venue)}
        onFocus={() => setActive(s.venue)}
        onMouseLeave={() => setActive(null)}
        onClick={() => setLightbox(s)}
        onKeyDown={(e) => openKey(e, s)}
        style={{
          flex: `${grow} 1 0`,
          minWidth: 'min(320px, 100%)',
          minHeight: 'clamp(360px, 56vw, 460px)',
          position: 'relative',
          borderRadius: '1.4rem',
          overflow: 'hidden',
          cursor: 'pointer',
          background: s.venue === 'land' ? '#14121A' : '#0F1A22',
          transition: 'flex-grow 0.55s cubic-bezier(0.22,1,0.36,1)',
          boxShadow: '0 24px 60px -30px rgba(11,11,12,0.55)',
          outline: 'none',
        }}
      >
        <img
          src={s.photo}
          alt={s.photoAlt}
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 38%',
            transform: on ? 'scale(1.06)' : 'scale(1)',
            filter: on ? 'saturate(1.1) contrast(1.04)' : 'saturate(0.9)',
            transition: 'transform 0.8s cubic-bezier(0.22,1,0.36,1), filter 0.5s ease',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(190deg, rgba(12,14,18,0.15) 0%, rgba(12,14,18,0.25) 42%, rgba(12,14,18,0.88) 100%)',
          }}
        />

        {/* Kicker chip — top-left */}
        <div
          style={{
            position: 'absolute',
            top: '1.1rem',
            left: '1.2rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.8rem',
            borderRadius: '999px',
            background: c.background,
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          {s.venue === 'land' ? <BarsGlyph color={accent} /> : <LinesGlyph color={accent} />}
          <span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: c.text }}>
            {s.kicker}
          </span>
        </div>

        {/* Content — bottom-left */}
        <div style={{ position: 'absolute', left: '1.2rem', right: '1.2rem', bottom: '1.3rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.55rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.1em', color: s.venue === 'land' ? '#8FA0FF' : '#7FD9E8', textTransform: 'uppercase' }}>
            {s.cadence}
          </span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4.4vw, 3rem)', lineHeight: 0.92, margin: 0, color: '#FBF3E4', textTransform: 'uppercase' }}>
            {s.title}
          </h3>
          <p
            style={{
              margin: 0,
              maxWidth: '30ch',
              fontSize: '0.92rem',
              lineHeight: 1.55,
              color: 'rgba(251,243,228,0.85)',
              opacity: on ? 1 : 0,
              maxHeight: on ? '5.5rem' : 0,
              transform: on ? 'translateY(0)' : 'translateY(8px)',
              overflow: 'hidden',
              transition: 'opacity 0.4s ease 0.1s, max-height 0.5s ease, transform 0.45s ease',
            }}
          >
            {s.body}
          </p>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: on ? '0.7rem 1.1rem' : '0 1.1rem',
              borderRadius: '999px',
              background: '#FBF3E4',
              color: '#0B0B0C',
              fontWeight: 700,
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              opacity: on ? 1 : 0,
              height: on ? '2.4rem' : 0,
              transform: on ? 'translateY(0)' : 'translateY(6px)',
              transition: 'opacity 0.35s ease 0.08s, height 0.4s ease, transform 0.4s ease, padding 0.4s ease',
            }}
          >
            View &amp; Book Slot <span style={{ color: accent }}>→</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <section
      id="training"
      style={{
        backgroundColor: c.background,
        borderTop: `1px solid ${c.border}`,
        ...sectionShell,
        paddingBottom: 'clamp(1.75rem, 3vw, 2.75rem)',
      }}
    >
      <div style={{ maxWidth: contentMaxWidth, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="Two Sides, One Crew"
          size="lg"
          style={{ marginBottom: isMobile ? '2.25rem' : '2.75rem' }}
          trailing={
            <p style={{ maxWidth: '26rem', color: c.textSecondary, fontSize: '1.1rem', fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
              {intro}
            </p>
          }
        >
          TRAINING <span style={{ color: accent }}>REEL</span>
        </SectionHeader>

        <div
          ref={ref}
          className={`reveal${inView ? ' is-visible' : ''}`}
          onMouseLeave={() => setActive(null)}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', minHeight: isMobile ? undefined : '28rem' }}
        >
          {SESSIONS.map(panel)}
        </div>

        {/* Dots + hint — desktop only; mobile shows both panels already-expanded */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1.1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {SESSIONS.map((s) => (
                <span
                  key={s.venue}
                  aria-hidden="true"
                  style={{
                    width: '2.3rem',
                    height: '0.55rem',
                    borderRadius: '999px',
                    background: active === s.venue ? accent : c.border,
                    transform: active === s.venue ? 'scaleX(1)' : 'scaleX(0.24)',
                    transformOrigin: 'center',
                    transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1), background 0.3s ease',
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.textSecondary }}>
              {hintLabel}
            </span>
          </div>
        )}

        {/* New-here CTA — beginner-friendly nudge into the Saturday session */}
        <div
          className={`reveal${inView ? ' is-visible' : ''}`}
          style={{
            animationDelay: '0.3s',
            marginTop: isMobile ? '1.5rem' : '1rem',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '1rem' : '1.4rem',
            padding: isMobile ? '1.3rem' : '1.4rem 1.6rem',
            borderRadius: '1rem',
            border: `1px solid ${c.border}`,
            backgroundColor: c.surface,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '0.75rem',
              flexShrink: 0,
              background: brandGradient(brand, theme),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 22px ${c.primary}33`,
            }}
          >
            <WeekGlyph color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: c.text, margin: '0 0 0.25rem' }}>
              New here? Start on a Saturday.
            </h3>
            <p style={{ color: c.textSecondary, fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              {cta}
            </p>
          </div>
          <Link
            to="/training"
            onMouseEnter={() => setReserveHover(true)}
            onMouseLeave={() => setReserveHover(false)}
            style={{
              flexShrink: 0,
              alignSelf: isMobile ? 'stretch' : 'auto',
              textAlign: 'center',
              textDecoration: 'none',
              background: brandGradient(brand, theme),
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.9rem',
              padding: '0.85rem 1.4rem',
              borderRadius: '999px',
              whiteSpace: 'nowrap',
              transform: reserveHover ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: reserveHover ? `0 16px 34px ${c.primary}55` : `0 10px 26px ${c.primary}3d`,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            Reserve a seat →
          </Link>
        </div>
      </div>

      {/* Lightbox — full frame + session detail */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.lightboxTitle}
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(11,11,12,0.82)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(12px, 3vw, 48px)',
          }}
        >
          {/* Close — fixed to the viewport corner so it's always reachable, even if
              the frame's content scrolls internally on a short phone screen. This is
              the primary way to close on touch devices, which have no Esc key. */}
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Close"
            style={{
              position: 'fixed',
              top: '1rem',
              right: '1rem',
              zIndex: 1001,
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '999px',
              border: 'none',
              background: 'rgba(11,11,12,0.75)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              color: '#FBF3E4',
              fontSize: '1.3rem',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            ×
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              display: 'flex',
              flexWrap: 'wrap',
              maxWidth: '68rem',
              width: '100%',
              maxHeight: '100%',
              overflow: 'auto',
              background: c.surface,
              borderRadius: '1.4rem',
            }}
          >
            <div style={{ flex: '1 1 28rem', minWidth: 'min(300px, 100%)', maxHeight: '60vh', display: 'flex' }}>
              <img
                src={lightbox.photo}
                alt={lightbox.photoAlt}
                style={{ width: '100%', height: '100%', objectFit: 'cover', maxHeight: '60vh' }}
              />
            </div>
            <div style={{ flex: '1 1 19rem', minWidth: 'min(280px, 100%)', padding: 'clamp(22px, 3vw, 40px) clamp(20px, 3vw, 34px)', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent }}>
                {lightbox.kicker}
              </span>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 2.8rem)', lineHeight: 0.92, margin: 0, color: c.text, textTransform: 'uppercase' }}>
                {lightbox.lightboxTitle}
              </h4>
              <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: c.textSecondary }}>
                {lightbox.lightboxBody}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.4rem', paddingTop: '1.1rem', borderTop: `1px solid ${c.border}` }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.textSecondary }}>Where</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: c.text, marginTop: '0.3rem' }}>
                    <PinMark color={accent} />
                    {lightbox.place}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.textSecondary }}>When</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: c.text, marginTop: '0.3rem' }}>
                    <ClockMark color={accent} />
                    {lightbox.time}
                  </div>
                </div>
              </div>
              <Link
                to="/training"
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => setBookHover(true)}
                onMouseLeave={() => setBookHover(false)}
                style={{
                  marginTop: '0.4rem',
                  textAlign: 'center',
                  textDecoration: 'none',
                  background: brandGradient(brand, theme),
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  padding: '0.85rem 1.4rem',
                  borderRadius: '999px',
                  transform: bookHover ? 'translateY(-2px)' : 'translateY(0)',
                  boxShadow: bookHover ? `0 16px 34px ${c.primary}55` : `0 10px 26px ${c.primary}3d`,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                Book my slot →
              </Link>
              <span style={{ marginTop: isMobile ? 0 : 'auto', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.textSecondary }}>
                {isMobile ? 'Tap outside or the × to close' : 'Click anywhere or press Esc to close'}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
