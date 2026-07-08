import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { colors, brandGradient, type ColorPalette } from '../../styles/colors';
import { Marquee } from '../Marquee';
import {
  fetchProducts,
  effectivePrice,
  formatPrice,
  type Product,
} from '../../utils/merch';
import eventsData from '../../data/events.json';
import {
  parseEventDate,
  isUpcoming,
  medalColor,
  medalLabel,
  type RaceEvent,
} from '../EventCard';
import { HERO_OPTIONS, useHeroPick } from '../HeroPicker';
import melakaTeam1 from '../../../images/melaka-team1.jpg';
import melakaTeam2 from '../../../images/melaka-team2.jpg';
import race1 from '../../../images/race-1.jpg';
import race2 from '../../../images/race-2.jpg';
import race3 from '../../../images/race-3.jpeg';
import { WhatsAppGlyph, YouTubeGlyph } from '../Hero';
import { ContactRow, LocationIcon, MailIcon, InstagramIcon } from '../Contact';
import { cadenceAccentUri } from '../../styles/tokens';

/**
 * MobileHome — the phone-width Home page, rebuilt to the AlpasPinas mobile
 * reference (images/AlpasPinas-Mobile.html). The reference's cream/navy palette
 * was the bandila theme, so every color here comes from the live ThemeContext
 * palette rather than a hardcode: the layout is the reference's, the colors are
 * the desktop site's, and it follows the brand/light-dark toggles in the drawer.
 *
 * The sticky app nav + drawer live in Navigation.tsx (mobile branch). This owns
 * the quick-jump pill bar and the section stack below it, wired to real data:
 * products from the shop, race results from events.json, the training rhythm,
 * and the crew photos. Desktop renders the original section components untouched.
 */

const ABOUT_PHOTOS = [
  { src: melakaTeam1, alt: 'The AlpasPinas crew gathered by the Melaka River', pos: 'center 55%' },
  { src: melakaTeam2, alt: 'AlpasPinas at the Melaka Dragonboat Championship', pos: 'center 45%' },
];

const RACE_PHOTOS = [
  { src: race1, alt: 'AlpasPinas mid-stroke during a race, Philippine-flag paddles raised', pos: 'center' },
  { src: race2, alt: 'AlpasPinas crews racing hard through the course', pos: 'center' },
  { src: race3, alt: "The AlpasPinas women's crew driving through a race", pos: 'center' },
];

const FACTS = [
  { value: 'Five', label: 'Seasons on the water' },
  { value: '20+', label: 'Paddlers, one crew' },
  { value: 'Malaysia', label: 'Home water' },
];

// Keyword tagline under the hero headline — mirrors the desktop hero's cadence
// row (SPEED · SYNC · STRENGTH), beat-ticked with the shared .cadence-beat class.
const KEYWORDS = ['SPEED', 'SYNC', 'STRENGTH'];

// The weekly rhythm, grouped land / water — mirrors TrainingSchedule's data.
const LAND = {
  label: 'On Land — Strength & Erg',
  cadence: 'TUE & THU · 7–9 PM',
  spots: 'Open',
  title: 'Land & Erg Conditioning',
  copy: 'Strength circuit, paddle ergs, and core work to build the engine off the water. Subang PARC · All levels · Drop-ins welcome.',
};
const WATER = {
  label: 'On the Water — Boat Time',
  cadence: 'SAT & SUN · 7–10 AM',
  spots: '8 spots left',
  title: 'Full Crew Session',
  copy: 'Full-boat pieces, race starts, and crew building. The best place to try paddling. Marina Putrajaya · Beginner friendly.',
};

const CONTACT_INFO: { label: string; value: string; icon: React.ReactNode }[] = [
  { label: 'Training base', value: 'Marina Putrajaya / Subang PARC', icon: <LocationIcon /> },
  { label: 'Email', value: 'admin@alpaspinas.com', icon: <MailIcon /> },
  { label: 'Instagram', value: '@alpaspinasdbt', icon: <InstagramIcon /> },
];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Turns a `#rrggbb` palette color into an rgba() string so the hero scrim can
// fade using the section's own surface color (any brand/theme) instead of a
// hardcoded tuple — keeps the blend seamless into the section below.
const hexToRgba = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Hide the pill/tag scrollbars — matches the reference's .apn-scroll rule.
const SCROLL_CSS = '.apn-mobile-scroll::-webkit-scrollbar{display:none}.apn-mobile-scroll{scrollbar-width:none;-ms-overflow-style:none}';

type SectionKey = 'home' | 'about' | 'training' | 'gear' | 'races' | 'contact';

export const MobileHome: React.FC = () => {
  const { theme, brand } = useTheme();
  const { user } = useAuth();
  const c = colors[brand][theme];
  const isDark = theme === 'dark';
  const accent = isDark ? c.primaryLight : c.primary;
  const grad = brandGradient(brand, theme);

  // Light-mode-only hero overrides: the hero sits over a full-bleed photo, and
  // now that the light-mode scrim is faint enough to see the image, the page's
  // dark navy text has no reliable contrast. Dark mode already uses light text
  // over the photo, so it's untouched.
  const heroTextLight = '#f7f9f7';
  const heroSubLight = 'rgba(247, 249, 247, 0.92)';
  const heroAccentLight = c.primaryLight;
  const heroShadowLight = '0 2px 14px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.5)';

  // Section refs so the pill bar and hero CTAs can jump to each band.
  const refs: Record<SectionKey, React.RefObject<HTMLElement | null>> = {
    home: useRef<HTMLElement>(null),
    about: useRef<HTMLElement>(null),
    training: useRef<HTMLElement>(null),
    gear: useRef<HTMLElement>(null),
    races: useRef<HTMLElement>(null),
    contact: useRef<HTMLElement>(null),
  };

  // The app nav scrolls away on mobile (its Layout wrapper is only nav-height
  // tall, so its sticky doesn't persist), so the pill bar pins to the very top
  // and takes over as the persistent quick-jump rail once the nav clears.
  const PILL_H = 44;
  const scrollTo = (key: SectionKey) => {
    refs[key].current?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const pills: { key: SectionKey; label: string }[] = [
    { key: 'home', label: 'Home' },
    { key: 'about', label: 'Story' },
    { key: 'training', label: 'Training' },
    { key: 'gear', label: 'Merch' },
    { key: 'races', label: 'Races' },
    ...(user ? [] : [{ key: 'contact' as SectionKey, label: 'Join' }]),
  ];

  // Jumped sections clear the pinned pill bar.
  const scrollMargin = PILL_H + 10;
  const sectionBase = (bg: string): React.CSSProperties => ({
    padding: '42px 22px',
    background: bg,
    borderTop: `1px solid ${c.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    scrollMarginTop: `${scrollMargin}px`,
  });

  const eyebrow = (text: string) => (
    <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: accent }}>
      {text}
    </span>
  );

  const heading = (children: React.ReactNode, size = '1.9rem') => (
    <div style={{ fontFamily: 'var(--font-display)', fontSize: size, lineHeight: 1, color: c.text }}>{children}</div>
  );

  // ---- Next race (hero badge) — soonest upcoming event from events.json ----
  const nextEvent = useMemo(() => {
    const upcoming = (eventsData as RaceEvent[])
      .filter((e) => isUpcoming(e.date))
      .sort((a, b) => parseEventDate(a.date).getTime() - parseEventDate(b.date).getTime());
    return upcoming[0] ?? null;
  }, []);
  const nextRace = useMemo(() => {
    if (!nextEvent) return null;
    const when = parseEventDate(nextEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return { name: nextEvent.name, when };
  }, [nextEvent]);

  // ---- Race record (results, newest first) ----
  const results = useMemo(
    () =>
      (eventsData as RaceEvent[])
        .filter((e) => e.result)
        .sort((a, b) => parseEventDate(b.date).getTime() - parseEventDate(a.date).getTime()),
    [],
  );
  const podiums = results.filter((e) => (e.result?.rank ?? 99) <= 3).length;

  // ---- Products (shop teaser) ----
  const [products, setProducts] = useState<Product[] | null>(null);
  useEffect(() => {
    let active = true;
    fetchProducts().then((p) => active && setProducts(p));
    return () => {
      active = false;
    };
  }, []);
  const gearItems = useMemo(() => {
    if (!products) return [];
    const featured = products.filter((p) => p.isFeatured);
    const rest = products.filter((p) => !p.isFeatured);
    return [...featured, ...rest].slice(0, 6);
  }, [products]);

  // ---- Cross-fading photo helper (About + Race Record) ----
  const [aboutPhoto, setAboutPhoto] = useState(0);
  const [racePhoto, setRacePhoto] = useState(0);
  const [heroPick] = useHeroPick();
  const heroPhoto = HERO_OPTIONS[heroPick];
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const a = window.setInterval(() => setAboutPhoto((i) => (i + 1) % ABOUT_PHOTOS.length), 5000);
    const r = window.setInterval(() => setRacePhoto((i) => (i + 1) % RACE_PHOTOS.length), 4500);
    return () => {
      window.clearInterval(a);
      window.clearInterval(r);
    };
  }, []);

  const primaryBtn: React.CSSProperties = {
    background: grad,
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.3rem',
    borderRadius: '999px',
    fontWeight: 700,
    fontSize: '0.9rem',
    letterSpacing: '0.02em',
    boxShadow: `0 4px 14px ${c.primary}40`,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  const statTile = (value: React.ReactNode, label: string) => (
    <div key={label} style={{ background: c.background, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '14px 10px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: c.text }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: c.textSecondary, marginTop: '4px', lineHeight: 1.3 }}>{label}</div>
    </div>
  );

  const trainingCard = (s: typeof LAND) => (
    <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: accent, letterSpacing: '0.03em' }}>{s.cadence}</span>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: c.textSecondary, background: c.background, border: `1px solid ${c.border}`, padding: '3px 9px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
          {s.spots}
        </span>
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: c.text }}>{s.title}</div>
      <div style={{ fontSize: '0.85rem', color: c.textSecondary, lineHeight: 1.5 }}>{s.copy}</div>
    </div>
  );

  return (
    <div style={{ background: c.background }}>
      <style>{SCROLL_CSS}</style>

      {/* Quick-jump pill bar — sticky beneath the app nav. Pills share the width
          evenly (flex: 1, no overflow-x) so every label fits on one row without
          a horizontal scroll, at any phone width. */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          height: PILL_H,
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(3px, 1.4vw, 8px)',
          padding: '0 clamp(8px, 3vw, 18px)',
          background: c.background,
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        {pills.map((p) => (
          <button
            key={p.key}
            onClick={() => scrollTo(p.key)}
            style={{
              flex: '1 1 0%',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              padding: 'clamp(5px, 1.6vw, 6px) clamp(4px, 2vw, 13px)',
              borderRadius: '999px',
              border: `1px solid ${c.border}`,
              background: 'transparent',
              color: c.textSecondary,
              fontSize: 'clamp(0.66rem, 2.9vw, 0.78rem)',
              fontWeight: 700,
              letterSpacing: '0.02em',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'center',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ===== HERO ===== */}
      {/* minHeight fills ~90% of the first screen beneath the pinned pill bar (nav
          scrolls away above it — see the pill bar comment), so the hero reads as a
          full "page one" on any device instead of a fixed, cramped box. */}
      <section
        ref={refs.home}
        style={{
          position: 'relative',
          minHeight: `calc(100dvh - ${PILL_H}px)`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          paddingBottom: '30%',
          overflow: 'hidden',
          background: c.surface,
          scrollMarginTop: `${scrollMargin}px`,
        }}
      >
        <img src={heroPhoto.src} alt="AlpasPinas crew paddling hard across the water" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 40%' }} />
        {/* Scrim — theme-aware, built from the section's own c.surface so it blends
            into the About section below with no hard seam. Dark mode ramps up early
            for legibility over a bright photo; light mode stays much lighter (the photo
            should read clearly) with only a light lift late, right behind the text. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: isDark
              ? `linear-gradient(180deg, ${hexToRgba(c.surface, 0.4)} 0%, ${hexToRgba(c.surface, 0.56)} 30%, ${hexToRgba(c.surface, 0.8)} 60%, ${hexToRgba(c.surface, 0.93)} 100%)`
              : `linear-gradient(180deg, ${hexToRgba(c.surface, 0.02)} 0%, ${hexToRgba(c.surface, 0.12)} 40%, ${hexToRgba(c.surface, 0.32)} 70%, ${hexToRgba(c.surface, 0.5)} 100%)`,
          }}
        />
        <div style={{ position: 'relative', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span
            className="stroke-in"
            style={{
              animationDelay: '0.04s',
              alignSelf: 'flex-start',
              background: isDark ? `${c.primary}24` : 'rgba(8,13,20,0.5)',
              backdropFilter: isDark ? undefined : 'blur(6px)',
              WebkitBackdropFilter: isDark ? undefined : 'blur(6px)',
              border: isDark ? 'none' : '1px solid rgba(255,255,255,0.18)',
              color: isDark ? accent : heroAccentLight,
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '5px 11px',
              borderRadius: '999px',
            }}
          >
            Next Race · Join Us
          </span>
          {nextRace && (
            <div className="stroke-in" style={{ animationDelay: '0.1s', fontSize: '0.85rem', color: isDark ? c.textSecondary : heroSubLight, fontWeight: 600, textShadow: isDark ? 'none' : heroShadowLight }}>
              {nextRace.name} — {nextRace.when}
            </div>
          )}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', lineHeight: 0.98, color: isDark ? c.text : heroTextLight, letterSpacing: '0.01em', textShadow: isDark ? '0 2px 30px rgba(0,0,0,0.35)' : heroShadowLight }}>
            <span className="stroke-in" style={{ display: 'block', position: 'relative', width: 'fit-content', animationDelay: '0.16s' }}>
              BREAK
            </span>
            <span className="stroke-in" style={{ display: 'block', position: 'relative', width: 'fit-content', color: isDark ? accent : heroAccentLight, animationDelay: '0.42s' }}>
              AWAY
              <span
                aria-hidden="true"
                className="wake-underline"
                style={{ position: 'absolute', left: 0, right: 0, bottom: '0.04em', height: '0.07em', borderRadius: '999px', background: `linear-gradient(90deg, ${c.primary}, ${c.sun})` }}
              />
            </span>
          </div>
          <div
            className="stroke-in"
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 400, color: isDark ? accent : heroAccentLight, letterSpacing: '0.02em', lineHeight: 1, animationDelay: '0.56s', textShadow: isDark ? 'none' : heroShadowLight }}
          >
            on every stroke.
          </div>
          {/* Cadence row — SPEED · SYNC · STRENGTH beat-ticks, matches desktop hero */}
          <div className="stroke-in" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem 1rem', marginTop: '2px', animationDelay: '0.64s' }}>
            {KEYWORDS.map((word, i) => (
              <span key={word} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  aria-hidden="true"
                  className="cadence-beat"
                  style={{ width: '6px', height: '6px', borderRadius: '999px', backgroundColor: c.sun, flexShrink: 0, animationDelay: `${i * 0.18}s` }}
                />
                <span style={{ color: isDark ? c.text : heroTextLight, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.15em', textShadow: isDark ? 'none' : heroShadowLight }}>{word}</span>
              </span>
            ))}
          </div>
          <div className="stroke-in" style={{ fontSize: '0.9rem', lineHeight: 1.5, color: isDark ? c.textSecondary : heroSubLight, maxWidth: '300px', animationDelay: '0.72s', textShadow: isDark ? 'none' : heroShadowLight }}>
            Start with a weekend session. No experience needed, all gear provided, and a crew that will get you on the water fast.
          </div>
          <div className="stroke-in" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px', animationDelay: '0.8s' }}>

            {/* Book a Session — messages the crew (WhatsApp green), matches desktop hero */}
            <button
              onClick={() => scrollTo('contact')}
              style={{
                background: 'linear-gradient(135deg, #1faa4d, #25D366)',
                color: '#fff',
                border: 'none',
                padding: '0.7rem 1.2rem',
                borderRadius: '999px',
                fontWeight: 800,
                fontSize: '0.85rem',
                letterSpacing: '0.01em',
                boxShadow: '0 12px 30px rgba(37,211,102,0.4)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <WhatsAppGlyph size={26} />
              Book a Session
            </button>
            {/* Watch Race — opens the highlight reel (YouTube red), matches desktop hero */}
            <button
              onClick={() => scrollTo('races')}
              style={{
                background: '#FF0000',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.18)',
                padding: '0.7rem 1.1rem',
                borderRadius: '999px',
                fontWeight: 800,
                fontSize: '0.85rem',
                letterSpacing: '0.01em',
                boxShadow: '0 12px 30px rgba(255,0,0,0.34)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <YouTubeGlyph size={29} />
              Watch Race
            </button>
          </div>
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section ref={refs.about} id="about" style={sectionBase(c.surface)}>
        {eyebrow('Our Story')}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.3rem', color: c.text }}>
            AL<span style={{ color: c.sun }}>·</span>PAS
          </span>
          <span style={{ fontSize: '0.85rem', color: c.textSecondary, fontStyle: 'italic' }}>/ˈal.pas/ · verb · Filipino</span>
        </div>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: c.text }}>to break free; to break away.</div>
        <div style={{ position: 'relative', width: '100%', height: '280px', borderRadius: '14px', overflow: 'hidden' }}>
          {ABOUT_PHOTOS.map((p, i) => (
            <img
              key={p.src}
              src={p.src}
              alt={i === aboutPhoto ? p.alt : ''}
              aria-hidden={i === aboutPhoto ? undefined : true}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: p.pos, opacity: i === aboutPhoto ? 1 : 0, transition: 'opacity 1s ease' }}
            />
          ))}
        </div>
        <div style={{ fontSize: '0.92rem', lineHeight: 1.6, color: c.textSecondary }}>
          AlpasPinas is a Filipino dragon boat crew in Malaysia — a home away from home that moves on a single beat. We paddle to break away: from the pack on the start line, and from anything that says a crew this far from home can't line up and win.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '6px' }}>
          {FACTS.map((f) => statTile(f.value, f.label))}
        </div>
      </section>

      {/* ===== TRAINING ===== */}
      <section ref={refs.training} id="training" style={sectionBase(c.background)}>
        {eyebrow('The Weekly Rhythm')}
        {heading('TRAINING SCHEDULE')}
        <div style={{ fontSize: '0.92rem', lineHeight: 1.6, color: c.textSecondary }}>
          Four sessions a week — weeknights for fitness and technique, weekends for full-crew water time. Sessions marked <b style={{ color: c.text }}>open</b> welcome drop-ins, no confirmation needed.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.textSecondary }}>{LAND.label}</div>
          {trainingCard(LAND)}
          <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.textSecondary, marginTop: '8px' }}>{WATER.label}</div>
          {trainingCard(WATER)}
        </div>

        <div style={{ background: `linear-gradient(135deg, ${c.primary}1a, ${c.primaryDark}0d)`, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '16px', marginTop: '6px' }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: c.text }}>New here? Start on a Saturday.</div>
          <div style={{ fontSize: '0.85rem', color: c.textSecondary, lineHeight: 1.5, margin: '6px 0 12px' }}>
            Weekend sessions are beginner-friendly and all gear is provided. Message us to reserve your seat for this week.
          </div>
          <Link to="/training" style={{ ...primaryBtn, display: 'inline-block', textDecoration: 'none', textAlign: 'center', padding: '0.7rem 1.2rem', fontSize: '0.85rem' }}>Reserve a seat →</Link>
        </div>
      </section>

      <Marquee />

      {/* ===== GEAR ===== */}
      <section ref={refs.gear} id="gear" style={sectionBase(c.surface)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {eyebrow('The Locker')}
            {heading('GEAR UP')}
          </div>
          <Link to="/shop" style={{ fontSize: '0.82rem', fontWeight: 700, color: accent, textDecoration: 'none', whiteSpace: 'nowrap' }}>Shop all →</Link>
        </div>

        <div className="apn-mobile-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
          {gearItems.map((p) => {
            const price = effectivePrice(p);
            const promo = p.promoPrice != null && p.promoPrice < p.price;
            return (
              <Link key={p.id} to={`/shop/${p.slug}`} style={{ flexShrink: 0, width: '160px', display: 'flex', flexDirection: 'column', gap: '8px', textDecoration: 'none' }}>
                <div style={{ position: 'relative', height: '160px', borderRadius: '12px', overflow: 'hidden', background: c.surfaceAlt }}>
                  {p.imageUrl && <img src={p.imageUrl} alt={p.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  {p.promoLabel && (
                    <span style={{ position: 'absolute', top: '8px', left: '8px', background: c.sun, color: '#1a1205', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.04em', padding: '3px 8px', borderRadius: '999px' }}>
                      {p.promoLabel}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: c.text, lineHeight: 1.3 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: c.text }}>{formatPrice(price, p.currency)}</span>
                  {promo && <span style={{ fontSize: '0.75rem', color: c.textSecondary, textDecoration: 'line-through' }}>{formatPrice(p.price, p.currency)}</span>}
                </div>
              </Link>
            );
          })}
        </div>
        <div style={{ fontSize: '0.8rem', color: c.textSecondary, lineHeight: 1.5 }}>
          Members race in club kit — your jersey, paddle, and PFD are provided once you join the crew.
        </div>
      </section>

      {/* ===== RACE RECORD ===== */}
      <section ref={refs.races} id="races" style={sectionBase(c.background)}>
        {eyebrow('On the Water')}
        {heading('RACE RECORD')}
        <div style={{ position: 'relative', width: '100%', height: '190px', borderRadius: '14px', overflow: 'hidden' }}>
          {RACE_PHOTOS.map((p, i) => (
            <img
              key={p.src}
              src={p.src}
              alt={i === racePhoto ? p.alt : ''}
              aria-hidden={i === racePhoto ? undefined : true}
              loading="lazy"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: p.pos, opacity: i === racePhoto ? 1 : 0, transition: 'opacity 1s ease' }}
            />
          ))}
        </div>
        <div style={{ fontSize: '0.92rem', lineHeight: 1.6, color: c.textSecondary }}>
          Seasons of racing across the region and a growing trophy shelf. Here's where we've lined up lately.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', color: c.text }}>{podiums}</div>
            <div style={{ fontSize: '0.75rem', color: c.textSecondary }}>Podium finishes</div>
          </div>
          <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', color: c.text }}>{results.length}</div>
            <div style={{ fontSize: '0.75rem', color: c.textSecondary }}>Races logged</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          {results.map((e) => {
            const rank = e.result!.rank;
            const medal = medalColor(rank);
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: c.surface, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: c.textSecondary, width: '34px', flexShrink: 0 }}>{parseEventDate(e.date).getFullYear()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
                  <div style={{ fontSize: '0.75rem', color: c.textSecondary }}>{e.result!.category} · {e.result!.time}</div>
                </div>
                <span style={{ flexShrink: 0, fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: '999px', background: medal ? `${medal}22` : 'transparent', border: `1px solid ${medal ? `${medal}66` : c.border}`, color: medal ?? c.textSecondary }}>
                  {medalLabel(rank)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== CLAIM YOUR SEAT ===== */}
      <ClaimYourSeat sectionRef={refs.contact} sectionStyle={sectionBase(c.surface)} eyebrow={eyebrow} heading={heading} c={c} accent={accent} grad={grad} />
    </div>
  );
};

// --- Claim Your Seat form — reference layout, wired to a submit stub that mirrors
//     the desktop Contact section (swap for a real Supabase insert / email relay). ---
type Status = 'idle' | 'submitting' | 'success' | 'error';

const ClaimYourSeat: React.FC<{
  sectionRef: React.RefObject<HTMLElement | null>;
  sectionStyle: React.CSSProperties;
  eyebrow: (t: string) => React.ReactNode;
  heading: (c: React.ReactNode, s?: string) => React.ReactNode;
  c: ColorPalette;
  accent: string;
  grad: string;
}> = ({ sectionRef, sectionStyle, eyebrow, heading, c, accent, grad }) => {
  const [values, setValues] = useState({ name: '', email: '', exp: 'any', message: '' });
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [status, setStatus] = useState<Status>('idle');

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;
    const next: { name?: string; email?: string } = {};
    if (!values.name.trim()) next.name = 'Tell us your name';
    if (!values.email.trim()) next.email = 'We need an email to reach you';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = 'That email looks off';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setStatus('submitting');
    try {
      await new Promise((r) => setTimeout(r, 900)); // INTEGRATION POINT — real submit
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const field: React.CSSProperties = {
    height: '46px',
    borderRadius: '10px',
    border: `1px solid ${c.border}`,
    background: c.background,
    padding: '0 14px',
    fontSize: '0.95rem',
    color: c.text,
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: c.textSecondary };

  return (
    <section ref={sectionRef} id="contact" style={{ ...sectionStyle, paddingBottom: '30px' }}>
      {eyebrow('The Open Seat')}
      {heading('CLAIM YOUR SEAT')}
      <div
        aria-hidden="true"
        style={{
          height: '14px',
          width: '100%',
          maxWidth: '260px',
          backgroundImage: cadenceAccentUri(c.sun),
          backgroundRepeat: 'repeat-x',
          backgroundSize: '70px 14px',
          backgroundPosition: 'left center',
          opacity: 0.9,
          WebkitMaskImage: 'linear-gradient(90deg, #000 70%, transparent 100%)',
          maskImage: 'linear-gradient(90deg, #000 70%, transparent 100%)',
          margin: '-6px 0 0',
        }}
      />
      <div style={{ fontSize: '0.92rem', lineHeight: 1.6, color: c.textSecondary }}>
        There's a seat in the boat with your name on it. Come try a session — no experience needed, all gear provided. We'll get you on the water within a week or two.
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.9rem' }}>
        {CONTACT_INFO.map((row) => (
          <ContactRow key={row.label} icon={row.icon} label={row.label} value={row.value} color={accent} textColor={c.text} subColor={c.textSecondary} />
        ))}
      </ul>

      {status === 'success' ? (
        <div role="status" style={{ marginTop: '6px', border: `1px solid ${c.border}`, borderRadius: '14px', padding: '22px 18px', textAlign: 'center', background: c.background }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: c.text }}>Seat saved.</div>
          <div style={{ fontSize: '0.9rem', color: c.textSecondary, lineHeight: 1.55, marginTop: '6px' }}>
            Thanks{values.name.trim() ? `, ${values.name.trim().split(/\s+/)[0]}` : ''}! We'll be in touch within a day or two about your first session.
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
          {status === 'error' && (
            <div role="alert" style={{ fontSize: '0.82rem', color: c.text, background: '#ef44441a', border: '1px solid #ef444455', borderRadius: '10px', padding: '10px 12px', lineHeight: 1.5 }}>
              We couldn't send that just now. Please try again, or email <a href="mailto:admin@alpaspinas.com" style={{ color: accent, fontWeight: 600 }}>admin@alpaspinas.com</a>.
            </div>
          )}
          <label style={labelStyle}>
            Name
            <input type="text" placeholder="Your full name" value={values.name} onChange={set('name')} style={{ ...field, borderColor: errors.name ? '#ef4444' : c.border }} />
            {errors.name && <span style={{ color: '#ef4444', fontWeight: 500 }}>{errors.name}</span>}
          </label>
          <label style={labelStyle}>
            Email
            <input type="email" placeholder="you@email.com" value={values.email} onChange={set('email')} style={{ ...field, borderColor: errors.email ? '#ef4444' : c.border }} />
            {errors.email && <span style={{ color: '#ef4444', fontWeight: 500 }}>{errors.email}</span>}
          </label>
          <label style={labelStyle}>
            Paddling experience
            <select value={values.exp} onChange={set('exp')} style={field}>
              <option value="any">Pick one…</option>
              <option value="none">Never paddled before</option>
              <option value="some">A bit — kayak / outrigger / etc.</option>
              <option value="dragon">Done dragon boat before</option>
            </select>
          </label>
          <label style={labelStyle}>
            Message
            <textarea placeholder="Tell us a bit about yourself" rows={3} value={values.message} onChange={set('message')} style={{ ...field, height: 'auto', padding: '12px 14px', resize: 'none' }} />
          </label>
          <button
            type="submit"
            disabled={status === 'submitting'}
            style={{ marginTop: '4px', background: grad, color: '#fff', border: 'none', padding: '0.9rem 1.3rem', borderRadius: '999px', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.02em', boxShadow: `0 6px 18px ${c.primary}47`, cursor: status === 'submitting' ? 'progress' : 'pointer', fontFamily: 'inherit', opacity: status === 'submitting' ? 0.9 : 1 }}
          >
            {status === 'submitting' ? 'Claiming your seat…' : 'Claim my seat →'}
          </button>
        </form>
      )}
    </section>
  );
};
