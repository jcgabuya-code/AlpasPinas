import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';
import { useIsMobile } from '../hooks/useIsMobile';
import { useInView } from '../hooks/useInView';
import { Eyebrow } from './SectionHeader';
import { sectionShell, contentMaxWidth } from '../styles/tokens';
import { useContent } from '../context/SiteContentContext';
import melakaTeam1 from '../../images/about/melaka-team1.jpg';
import alpasTeam1 from '../../images/about/alpasTeam-1.jpg';
import alpasTeam2 from '../../images/about/alpasTeam-2.jpg';
import alpasTeam3 from '../../images/about/alpasTeam-3.jpg';
import alpasTeam4 from '../../images/about/alpasTeam-4.jpg';
const alpasFemales = new URL('../../images/about/alpas-females.JPG', import.meta.url).href;
const alpasTeamTitiwangsa = new URL('../../images/about/alpasTeam-titiwangsa.JPG', import.meta.url).href;

// Hand-picked crew shots that cross-fade in the About frame. To add a photo from
// Instagram: download it into images/about/, import it above, and add an entry here with
// its own crop (objectPosition) so faces/subject stay framed in the 4:5 window.
// Each alt line is part of the voice — write it, don't leave it generic.
const ABOUT_PHOTOS: { src: string; alt: string; objectPosition: string }[] = [
  {
    src: melakaTeam1,
    alt: 'The AlpasPinas crew gathered by the Melaka River',
    objectPosition: 'center 55%',
  },
  {
    src: alpasTeamTitiwangsa,
    alt: 'AlpasPinas paddlers by Titiwangsa Lake with the Kuala Lumpur skyline behind them',
    objectPosition: 'center 65%',
  },
  {
    src: alpasTeam4,
    alt: 'The crew at the Love Boracay International Dragonboat Festival, Philippines',
    objectPosition: 'center 60%',
  },
  {
    src: alpasTeam3,
    alt: 'AlpasPinas celebrating on a white-sand beach with the dragon boat behind them',
    objectPosition: 'center 55%',
  },
  {
    src: alpasTeam2,
    alt: 'The crew flying the AlpasPinas flag by the lake in Titiwangsa',
    objectPosition: 'center 68%',
  },
  {
    src: alpasTeam1,
    alt: 'AlpasPinas gathered under cover with the team banner after training',
    objectPosition: 'center 45%',
  },
  {
    src: alpasFemales,
    alt: 'The AlpasPinas women paddlers before boarding, tent lights on at dusk',
    objectPosition: 'center 62%',
  },
];

// The team name is the brief. "Alpas" (Filipino) = to break free / breakaway — so
// the About section is built around the word itself: an oversized wordmark read as
// a dictionary entry, a crew-voice manifesto, and a cadence-dotted strip of the few
// facts that ground it. Numbers mirror the hero's stat readout (no new claims).
const FACTS = [
  { value: '2024', label: 'Founded' },
  { value: '20+', label: 'Paddlers, one crew' },
  { value: 'Malaysia', label: 'Home water' },
];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const About: React.FC = () => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const isDark = theme === 'dark';
  const isMobile = useIsMobile();
  const [ref, inView] = useInView<HTMLDivElement>();
  const manifesto = useContent(
    'about.manifesto',
    "Founded in 2024 by Filipino expats in Malaysia, AlpasPinas began as a way to bring a piece of home closer — dragon boat is just the excuse. Filipino spirit and camaraderie come first — we work hard on the water and laugh harder off it — and we've built a name for being the crew that welcomes anyone with open arms, no experience required. We paddle to break away: from the pack on the start line, and from anything that says a crew this far from home can't line up and win.",
  );

  const accent = isDark ? c.accent : c.primary;
  // The manifesto is the emotional core — keep it near-ink for contrast rather than
  // the faint secondary, which would drop below AA on this lifted surface.
  const ink = isDark ? 'rgba(245,247,245,0.88)' : c.text;
  const muted = c.textSecondary;

  // Draw the wake underline once when the section reveals. Reduced-motion users get
  // it fully drawn from the start (no scaleX transition).
  const reduced = useMemo(prefersReducedMotion, []);
  const wakeDrawn = reduced || inView;

  // Cross-fade through the hand-picked shots, unless the user prefers reduced motion
  // (then the first photo holds; the dots still allow manual selection).
  const [photo, setPhoto] = useState(0);
  useEffect(() => {
    if (ABOUT_PHOTOS.length < 2 || reduced) return;
    const id = window.setInterval(
      () => setPhoto((i) => (i + 1) % ABOUT_PHOTOS.length),
      5000,
    );
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <section
      id="about"
      style={{
        ...sectionShell,
        // Trim the band a little tighter than the default rhythm, and pull the
        // bottom in further so the facts strip sits closer to the next section.
        paddingBlock: 'clamp(2.75rem, 6vw, 4.5rem)',
        paddingBottom: 'clamp(2rem, 4vw, 3rem)',
        backgroundColor: c.surface,
        borderTop: `1px solid ${c.border}`,
      }}
    >
      <div ref={ref} style={{ maxWidth: contentMaxWidth, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '0.88fr 1.12fr',
            gap: isMobile ? '2rem' : 'clamp(2.5rem, 5vw, 4.5rem)',
            alignItems: 'center',
          }}
        >
          {/* Word-led column — the name, its meaning, and the crew's read on it */}
          <div className={`reveal${inView ? ' is-visible' : ''}`}>
            <Eyebrow>Our Story</Eyebrow>

            {/* The wordmark, set like a dictionary headword: AL·PAS with the raised
                syllable dot in the cadence amber, and a wake underline beneath. */}
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                margin: '0.2rem 0 0',
                lineHeight: 0.92,
                letterSpacing: '0.01em',
                fontSize: 'clamp(3.5rem, 11vw, 6rem)',
                color: c.text,
              }}
            >
              AL<span style={{ color: c.sun }}>·</span>PAS
            </h2>
            <div
              aria-hidden="true"
              style={{
                height: 5,
                width: isMobile ? '52%' : '44%',
                marginTop: '0.6rem',
                borderRadius: 999,
                background: `linear-gradient(90deg, ${c.sun}, ${c.sun}00)`,
                transform: wakeDrawn ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'left',
                transition: reduced ? 'none' : 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
              }}
            />

            {/* Etymology line — pronunciation, part of speech, and the gloss, with a
                crew-voice extension in the brand accent. */}
            <p
              style={{
                margin: '1.15rem 0 0',
                fontSize: '0.92rem',
                color: muted,
                letterSpacing: '0.01em',
              }}
            >
              <span style={{ fontStyle: 'italic' }}>/ˈal.pas/</span>
              <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>·</span>
              verb
              <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>·</span>
              Filipino
            </p>
            <p
              style={{
                margin: '0.5rem 0 0',
                fontSize: 'clamp(1.15rem, 2.4vw, 1.4rem)',
                lineHeight: 1.35,
                color: c.text,
                fontWeight: 600,
                textWrap: 'balance' as React.CSSProperties['textWrap'],
              }}
            >
              to break free; to break away.
              <span style={{ color: accent, fontWeight: 700 }}>
                {' '}For us — every paddle slipping the current as one.
              </span>
            </p>

            {/* Manifesto — proudly-specific: a diaspora crew that moves on one beat. */}
            <p
              style={{
                margin: '1.5rem 0 0',
                maxWidth: '52ch',
                fontSize: isMobile ? '1rem' : '1.05rem',
                lineHeight: 1.7,
                color: ink,
                textWrap: 'pretty' as React.CSSProperties['textWrap'],
              }}
            >
              {manifesto}
            </p>
          </div>

          {/* Photo column — one decisive team shot, framed to carry the section */}
          <div
            className={`reveal${inView ? ' is-visible' : ''}`}
            style={{ animationDelay: '0.12s' }}
          >
            <figure
              style={{
                margin: 0,
                position: 'relative',
                borderRadius: '1.1rem',
                overflow: 'hidden',
                border: `1px solid ${c.border}`,
                aspectRatio: isMobile ? '16 / 11' : '1 / 1',
                boxShadow: isDark
                  ? '0 26px 60px -30px rgba(0,0,0,0.85)'
                  : '0 26px 60px -30px rgba(15,23,42,0.35)',
              }}
            >
              {/* Cross-fading stack — only the active shot is opaque */}
              {ABOUT_PHOTOS.map((p, i) => (
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
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, rgba(8,13,20,0) 46%, rgba(8,13,20,0.5) 74%, rgba(8,13,20,0.9) 100%)',
                }}
              />
              <figcaption
                style={{
                  position: 'absolute',
                  left: '1.2rem',
                  bottom: '1.1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#fff',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: c.sun }}
                />
                AlpasPinas · Malaysia
              </figcaption>

              {/* Photo dots — indicate + jump between the hand-picked shots */}
              {ABOUT_PHOTOS.length > 1 && (
                <div
                  style={{
                    position: 'absolute',
                    right: '1.1rem',
                    bottom: '1.15rem',
                    display: 'flex',
                    gap: '0.4rem',
                  }}
                >
                  {ABOUT_PHOTOS.map((p, i) => (
                    <button
                      key={p.src}
                      type="button"
                      aria-label={`Show photo ${i + 1}`}
                      aria-current={i === photo}
                      onClick={() => setPhoto(i)}
                      style={{
                        width: 20,
                        height: 8,
                        padding: 0,
                        border: 'none',
                        borderRadius: 999,
                        cursor: 'pointer',
                        background: i === photo ? '#fff' : 'rgba(255,255,255,0.5)',
                        transform: i === photo ? 'scaleX(1)' : 'scaleX(0.4)',
                        transformOrigin: 'center',
                        transition: 'transform 0.3s ease, background 0.3s ease',
                      }}
                    />
                  ))}
                </div>
              )}
            </figure>
          </div>
        </div>

        {/* Facts strip — grounding numbers separated by cadence beat-dots (not a
            metric-card grid). Values echo the hero's stat readout. */}
        <div
          className={`reveal${inView ? ' is-visible' : ''}`}
          style={{
            animationDelay: '0.22s',
            marginTop: isMobile ? '1.75rem' : '2.25rem',
            paddingTop: isMobile ? '1.35rem' : '1.5rem',
            borderTop: `1px solid ${c.border}`,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            gap: isMobile ? '1.1rem 1.4rem' : '2.4rem',
          }}
        >
          {FACTS.map((f, i) => (
            <React.Fragment key={f.label}>
              {i > 0 && (
                <span
                  aria-hidden="true"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    backgroundColor: c.sun,
                    alignSelf: 'center',
                    flexShrink: 0,
                    display: isMobile ? 'none' : 'block',
                  }}
                />
              )}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
                    lineHeight: 1,
                    color: accent,
                  }}
                >
                  {f.value}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: muted,
                    maxWidth: '9rem',
                    lineHeight: 1.3,
                  }}
                >
                  {f.label}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};
