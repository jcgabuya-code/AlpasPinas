import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { colors, brandGradient, bandilaHero, type ColorPalette } from '../../styles/colors';
import { LEGACY_LIGHT_HERO } from '../../config/homeHero';
import { Marquee } from '../Marquee';
import { TrainingSchedule } from '../TrainingSchedule';
import {
  fetchProducts,
  effectivePrice,
  formatPrice,
  type Product,
} from '../../utils/merch';
import { useRaceEvents } from '../../utils/raceEvents';
import {
  parseEventDate,
  isUpcoming,
  medalColor,
  resultBadge,
  type RaceEvent,
} from '../EventCard';
import { HERO_OPTIONS, useHeroPick } from '../HeroPicker';
import melakaTeam1 from '../../../images/about/melaka-team1.jpg';
import alpasTeam1 from '../../../images/about/alpasTeam-1.jpg';
import alpasTeam2 from '../../../images/about/alpasTeam-2.jpg';
import alpasTeam3 from '../../../images/about/alpasTeam-3.jpg';
import alpasTeam4 from '../../../images/about/alpasTeam-4.jpg';
import race1 from '../../../images/race/race-1.jpeg';
import race2 from '../../../images/race/race-2.jpg';
import race3 from '../../../images/race/race-3.jpg';
import race4 from '../../../images/race/race-4.jpg';
import race5 from '../../../images/race/race-5.jpg';
const alpasFemales = new URL('../../../images/about/alpas-females.JPG', import.meta.url).href;
const alpasTeamTitiwangsa = new URL('../../../images/about/alpasTeam-titiwangsa.JPG', import.meta.url).href;
import { WhatsAppGlyph, YouTubeGlyph } from '../Hero';
import { ContactRow, LocationIcon, MailIcon, InstagramIcon } from '../Contact';
import { submitApplication, type ApplicationResult } from '../../utils/users';
import { cadenceAccentUri } from '../../styles/tokens';
import { useContent } from '../../context/SiteContentContext';
import { RaceRecordEditor } from '../RaceRecordEditor';
import { AboutEditor } from '../AboutEditor';
import { GearEditor } from '../GearEditor';

/**
 * MobileHome — the phone-width Home page, rebuilt to the AlpasPinas mobile
 * reference (images/AlpasPinas-Mobile.html). The reference's cream/navy palette
 * was the bandila theme, so every color here comes from the live ThemeContext
 * palette rather than a hardcode: the layout is the reference's, the colors are
 * the desktop site's, and it follows the brand/light-dark toggles in the drawer.
 *
 * The sticky app nav + drawer live in Navigation.tsx (mobile branch). This owns
 * the quick-jump pill bar and the section stack below it, wired to real data:
 * products from the shop, race results from the live race_events table, the training rhythm,
 * and the crew photos. Desktop renders the original section components untouched.
 */

const ABOUT_PHOTOS = [
  { src: melakaTeam1, alt: 'The AlpasPinas crew gathered by the Melaka River', pos: 'center 55%' },
  { src: alpasTeamTitiwangsa, alt: 'AlpasPinas paddlers by Titiwangsa Lake with the Kuala Lumpur skyline behind them', pos: 'center 65%' },
  { src: alpasTeam4, alt: 'The crew at the Love Boracay International Dragonboat Festival, Philippines', pos: 'center 60%' },
  { src: alpasTeam3, alt: 'AlpasPinas celebrating on a white-sand beach with the dragon boat behind them', pos: 'center 55%' },
  { src: alpasTeam2, alt: 'The crew flying the AlpasPinas flag by the lake in Titiwangsa', pos: 'center 68%' },
  { src: alpasTeam1, alt: 'AlpasPinas gathered under cover with the team banner after training', pos: 'center 45%' },
  { src: alpasFemales, alt: 'The AlpasPinas women paddlers before boarding, tent lights on at dusk', pos: 'center 62%' },
];

const RACE_PHOTOS = [
  { src: race1, alt: "The AlpasPinas women's crew driving hard through a race, paddles buried mid-stroke", pos: 'center' },
  { src: race2, alt: 'AlpasPinas powering their dragon boat through the course, Philippine-flag paddles flashing', pos: 'center' },
  { src: race3, alt: 'AlpasPinas paddlers receiving the team pennant at the Melaka Dragon Boat Festival ceremony', pos: 'center' },
  { src: race4, alt: 'AlpasPinas dragon boat seen from astern, the full crew in sync down the race lane', pos: 'center' },
  { src: race5, alt: 'AlpasPinas crew at the catch during the Melaka Dragon Boat Festival, arms raised in unison', pos: 'center' },
];

const FACTS = [
  { value: '2024', label: 'Founded' },
  { value: '20+', label: 'Paddlers, one crew' },
  { value: 'Malaysia', label: 'Home water' },
];


// The weekly rhythm, grouped land / water — mirrors TrainingSchedule's data.

const CONTACT_INFO: { label: string; value: string; icon: React.ReactNode }[] = [
  { label: 'Training base', value: 'Marina Putrajaya / Subang PARC', icon: <LocationIcon /> },
  { label: 'Email', value: 'admin@alpaspinas.com', icon: <MailIcon /> },
  { label: 'Instagram', value: '@alpaspinasdbt', icon: <InstagramIcon /> },
];

// Mirrors Contact.tsx's list — the "claim a seat" application carries the
// same mobile format the account is keyed on.
const COUNTRY_CODES = [
  { code: '+60', flag: '🇲🇾' },
  { code: '+63', flag: '🇵🇭' },
  { code: '+65', flag: '🇸🇬' },
  { code: '+1', flag: '🇺🇸' },
  { code: '+44', flag: '🇬🇧' },
  { code: '+61', flag: '🇦🇺' },
  { code: '+81', flag: '🇯🇵' },
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
  const navigate = useNavigate();
  const { theme, mode, brand } = useTheme();
  const { user } = useAuth();
  const c = colors[brand][theme];
  const isDark = theme === 'dark';
  const accent = isDark ? c.accent : c.primary;
  const grad = brandGradient(brand, theme);
  const manifesto = useContent(
    'about.manifesto',
    "Founded in 2024 by Filipino expats in Malaysia, AlpasPinas began as a way to bring a piece of home closer — dragon boat is just the excuse. Filipino spirit and camaraderie come first — we work hard on the water and laugh harder off it — and we've built a name for being the crew that welcomes anyone with open arms, no experience required. We paddle to break away: from the pack on the start line, and from anything that says a crew this far from home can't line up and win.",
  );
  const gearNote = useContent(
    'featuredGear.note',
    'Members race in club kit. Your jersey, paddle, and PFD are provided once you join the crew.',
  );
  const raceIntro = useContent(
    'raceRecord.intro',
    "We've raced in Malaysia, Singapore, and the Philippines — chasing podiums and having a blast together. Same crew, same rhythm, all in from catch to finish.",
  );

  // The hero band renders dark over an otherwise light page (light mode = dark hero +
  // light page). `heroC` / `heroIsDark` / `heroAccent` drive the hero section only; the
  // rest of the page keeps `c` / `isDark`. The original light hero is stashed behind
  // LEGACY_LIGHT_HERO.
  const heroMode = LEGACY_LIGHT_HERO && mode === 'light' ? 'light' : 'dark';
  const heroC = colors[brand][heroMode];
  const heroIsDark = heroMode === 'dark';
  const heroAccent = heroIsDark
    ? heroC.accent
    : brand === 'bandila'
      ? bandilaHero.blue
      : heroC.primary;

  // Light-mode-only hero overrides: the hero sits over a full-bleed photo, so the
  // page's dark navy text has no reliable contrast there. Both themes therefore use
  // light text over the photo (white in dark mode via c.text, forced light here),
  // with a dark drop shadow for legibility.
  const heroTextLight = '#f7f9f7';
  const heroSubLight = 'rgba(247, 249, 247, 0.92)';
  // Alpas Hero spec accents (light) — bandila gets the brighter hero blue + flag
  // yellow (matches the desktop hero); other brands keep their own light palette.
  const heroAccentLight = brand === 'bandila' ? bandilaHero.blue : c.primaryLight;
  const heroYellowLight = brand === 'bandila' ? bandilaHero.yellow : c.sun;
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
  // and takes over as the persistent quick-jump rail once the nav clears. It
  // stays hidden until then — a sentinel sitting at the very top of this page
  // (i.e. right where the nav ends) flags the moment it scrolls out of view.
  const PILL_H = 44;
  const navClearedRef = useRef<HTMLDivElement>(null);
  const [pillBarVisible, setPillBarVisible] = useState(false);
  useEffect(() => {
    const el = navClearedRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setPillBarVisible(!entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
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

  // ---- Race calendar, live from the admin-managed race_events table ----
  const { events: raceEvents } = useRaceEvents();

  // ---- Next race (hero badge) — soonest upcoming event ----
  const nextEvent = useMemo(() => {
    const upcoming = raceEvents
      .filter((e) => isUpcoming(e.date))
      .sort((a, b) => parseEventDate(a.date).getTime() - parseEventDate(b.date).getTime());
    return upcoming[0] ?? null;
  }, [raceEvents]);
  const nextRace = useMemo(() => {
    if (!nextEvent) return null;
    const when = parseEventDate(nextEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return { name: nextEvent.name, when };
  }, [nextEvent]);

  // ---- Race record (every race already run, newest first; placing optional) ----
  const results = useMemo(
    () =>
      raceEvents
        .filter((e) => !isUpcoming(e.date))
        .sort((a, b) => parseEventDate(b.date).getTime() - parseEventDate(a.date).getTime()),
    [raceEvents],
  );
  // Same event/date entered multiple categories collapses to one row —
  // category isn't shown here, so per-category rows just read as duplicates.
  const resultGroups = useMemo(() => {
    const map = new Map<string, RaceEvent[]>();
    for (const e of results) {
      const key = `${e.name}|${e.date}`;
      const group = map.get(key);
      if (group) group.push(e);
      else map.set(key, [e]);
    }
    return Array.from(map.values());
  }, [results]);

  // Podium/race counts follow the same one-row-per-event grouping as the list below.
  const podiums = resultGroups.filter((group) => group.some((e) => (e.result?.rank ?? 99) <= 3)).length;

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

  const statTile = (value: React.ReactNode, label: string) => (
    <div key={label} style={{ background: c.background, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '14px 10px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: c.text }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: c.textSecondary, marginTop: '4px', lineHeight: 1.3 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ background: c.background }}>
      <style>{SCROLL_CSS}</style>

      {/* Marks the top of the page (right where the app nav ends) so the pill
          bar below knows when the nav has scrolled out of view. */}
      <div ref={navClearedRef} />

      {/* Quick-jump pill bar — hidden until the nav clears, then sticks to the
          top and takes over as the persistent quick-jump rail. Pills share the
          width evenly (flex: 1, no overflow-x) so every label fits on one row
          without a horizontal scroll, at any phone width.
          Padding stays constant so only `height` + `border-color` animate — a
          single, rare, user-triggered toggle rather than continuous motion, so
          the transition here doesn't carry the layout-thrash cost that rule of
          thumb warns about. */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          height: pillBarVisible ? PILL_H : 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(3px, 1.4vw, 8px)',
          padding: '0 clamp(8px, 3vw, 18px)',
          background: c.background,
          borderBottom: `1px solid ${pillBarVisible ? c.border : 'transparent'}`,
          transition: 'height 0.22s ease, border-color 0.22s ease',
        }}
      >
        {pills.map((p) => (
          <button
            key={p.key}
            onClick={() => (p.key === 'contact' ? navigate('/join-team') : scrollTo(p.key))}
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
          paddingBottom: '20%',
          overflow: 'hidden',
          background: heroC.surface,
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
            background: heroIsDark
              ? `linear-gradient(180deg, ${hexToRgba(heroC.surface, 0.4)} 0%, ${hexToRgba(heroC.surface, 0.2)} 30%, ${hexToRgba(heroC.surface, 0.4)} 60%, ${hexToRgba(heroC.surface, 0.85)} 100%)`
              : `linear-gradient(180deg, ${hexToRgba(heroC.surface, 0.02)} 0%, ${hexToRgba(heroC.surface, 0.2)} 40%, ${hexToRgba(heroC.surface, 0.4)} 70%, ${hexToRgba(heroC.surface, 0.6)} 100%)`,
          }}
        />
        {/* Next Race — pinned to the top of the hero photo, above the scrim, so it
            uses the empty upper space while the headline block stays bottom-anchored. */}
        <div style={{ position: 'absolute', top: '100px', left: '22px', right: '22px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span
            className="stroke-in"
            style={{
              animationDelay: '0.04s',
              alignSelf: 'flex-start',
              background: heroIsDark ? `${heroAccent}24` : 'rgba(8,13,20,0.5)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              border: heroIsDark ? 'none' : '1px solid rgba(255,255,255,0.18)',
              color: heroIsDark ? heroAccent : heroAccentLight,
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
            <div className="stroke-in" style={{ animationDelay: '0.1s', fontSize: '0.85rem', color: heroIsDark ? heroC.text : heroSubLight, fontWeight: 600, textShadow: heroIsDark ? '0 1px 10px rgba(0,0,0,0.6)' : heroShadowLight }}>
              {nextRace.name} — {nextRace.when}
            </div>
          )}
        </div>
        <div style={{ position: 'relative', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', lineHeight: 0.98, letterSpacing: '0.01em' }}>
            <span className="stroke-in" style={{ display: 'block', position: 'relative', width: 'fit-content', color: heroIsDark ? heroC.text : heroTextLight, textShadow: heroIsDark ? '0 2px 30px rgba(0,0,0,0.35)' : heroShadowLight, animationDelay: '0.16s' }}>
              BREAK
            </span>
            <span className="stroke-in" style={{ display: 'block', position: 'relative', width: 'fit-content', color: heroIsDark ? heroAccent : heroAccentLight, textShadow: 'none', animationDelay: '0.42s' }}>
              AWAY
              <span
                aria-hidden="true"
                className="wake-underline"
                style={{ position: 'absolute', left: 0, right: 0, bottom: '0.04em', height: '0.07em', borderRadius: '999px', background: heroIsDark ? `linear-gradient(90deg, ${heroC.accent}, ${heroC.sun})` : `linear-gradient(90deg, ${heroAccentLight}, ${heroYellowLight})` }}
              />
            </span>
          </div>
          <div
            className="stroke-in"
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 400, color: heroIsDark ? heroAccent : heroAccentLight, letterSpacing: '0.02em', lineHeight: 1, animationDelay: '0.56s', textShadow: 'none' }}
          >
            on every stroke.
          </div>
          {/* Eyebrow tagline with a leading cadence beat — matches the desktop hero */}
          <div className="stroke-in" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px', animationDelay: '0.64s' }}>
            <span
              aria-hidden="true"
              className="cadence-beat"
              style={{ width: '7px', height: '7px', borderRadius: '999px', backgroundColor: heroC.sun, flexShrink: 0 }}
            />
            <span style={{ color: heroIsDark ? heroC.text : heroTextLight, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', textShadow: heroIsDark ? 'none' : heroShadowLight }}>
              Filipino Dragon Boat Team · Malaysia
            </span>
          </div>
          {/* <div className="stroke-in" style={{ fontSize: '0.9rem', lineHeight: 1.5, color: isDark ? c.textSecondary : heroSubLight, maxWidth: '300px', animationDelay: '0.72s', textShadow: isDark ? 'none' : heroShadowLight }}>
            {heroIntro}
          </div> */}
          <div className="stroke-in" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px', animationDelay: '0.8s' }}>

            {heroIsDark ? (
              <>
                {/* Book a Session — messages the crew (WhatsApp green) */}
                <button
                  onClick={() => navigate(user ? '/training' : '/join-team')}
                  style={{
                    background: 'linear-gradient(135deg, #1faa4d, #25D366)',
                    color: '#fff',
                    border: 'none',
                    padding: '0.72rem 1.25rem',
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
                  <WhatsAppGlyph size={30} />
                  Book a Session
                </button>
                {/* Watch Race — opens the highlight reel (YouTube red) */}
                <button
                  onClick={() => scrollTo('races')}
                  style={{
                    background: '#FF0000',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.18)',
                    padding: '0.72rem 1.2rem',
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
                  <YouTubeGlyph size={30} />
                  Watch Race
                </button>
              </>
            ) : (
              <>
                {/* Light mode (Alpas Hero spec): blue-filled primary with WhatsApp mark
                    in a green badge, over the photo. */}
                <button
                  onClick={() => navigate(user ? '/training' : '/join-team')}
                  style={{
                    background: heroAccentLight,
                    color: '#fff',
                    border: 'none',
                    padding: '0.72rem 1.25rem',
                    borderRadius: '999px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    letterSpacing: '0.01em',
                    boxShadow: `0 10px 28px ${heroAccentLight}66`,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#25d366', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <WhatsAppGlyph size={14} />
                  </span>
                  Book a Session
                </button>
                {/* Ghost secondary — glass over the photo (white ink), play mark in a
                    red badge. */}
                <button
                  onClick={() => scrollTo('races')}
                  style={{
                    background: 'rgba(8,13,20,0.42)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    color: '#fff',
                    border: '1.5px solid rgba(255,255,255,0.5)',
                    padding: '0.72rem 1.2rem',
                    borderRadius: '999px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    letterSpacing: '0.01em',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <span style={{ width: 28, height: 20, borderRadius: 6, background: '#ff0000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                  Watch Race
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section ref={refs.about} id="about" style={sectionBase(c.surface)}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          {eyebrow('Our Story')}
          <AboutEditor />
        </div>
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
          {manifesto}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '6px' }}>
          {FACTS.map((f) => statTile(f.value, f.label))}
        </div>
      </section>

      {/* ===== TRAINING ===== */}
      <section ref={refs.training} id="training-anchor">
        <TrainingSchedule />
      </section>

      <Marquee />

      {/* ===== GEAR ===== */}
      <section ref={refs.gear} id="gear" style={sectionBase(c.surface)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {eyebrow('The Locker')}
            {heading('GEAR UP')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <Link to="/shop" style={{ fontSize: '0.82rem', fontWeight: 700, color: accent, textDecoration: 'none', whiteSpace: 'nowrap' }}>Shop all →</Link>
            <GearEditor />
          </div>
        </div>

        <div className="apn-mobile-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
          {gearItems.map((p) => {
            const price = effectivePrice(p);
            const promo = p.promoPrice != null && p.promoPrice < p.price;
            return (
              <Link key={p.id} to={`/shop/${p.slug}`} style={{ flexShrink: 0, width: '200px', display: 'flex', flexDirection: 'column', gap: '8px', textDecoration: 'none' }}>
                <div style={{ position: 'relative', height: '230px', borderRadius: '12px', overflow: 'hidden', background: c.surfaceAlt }}>
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
          {gearNote}
        </div>
      </section>

      {/* ===== RACE RECORD ===== */}
      <section ref={refs.races} id="races" style={sectionBase(c.background)}>
        {eyebrow('On the Water')}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          {heading('EVENT RECORDS')}
          <RaceRecordEditor />
        </div>
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
          {raceIntro}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', color: c.text }}>{podiums}</div>
            <div style={{ fontSize: '0.75rem', color: c.textSecondary }}>Podium finishes</div>
          </div>
          <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', color: c.text }}>{resultGroups.length}</div>
            <div style={{ fontSize: '0.75rem', color: c.textSecondary }}>Races logged</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          {resultGroups.map((group) => {
            const e = group[0];
            const scored = group.filter((g) => g.result);
            const badges = Array.from(
              new Map(
                scored.map((g) => {
                  const rank = g.result!.rank;
                  const label = resultBadge(g.result!) ?? '';
                  const medal = rank ? medalColor(rank, isDark) : null;
                  return [`${label}-${medal}`, { label, medal }];
                }),
              ).values(),
            );
            const time = scored.length === 1 ? scored[0].result!.time : undefined;
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: c.surface, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: c.textSecondary, width: '34px', flexShrink: 0 }}>{parseEventDate(e.date).getFullYear()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
                  {time && <div style={{ fontSize: '0.75rem', color: c.textSecondary }}>{time}</div>}
                </div>
                {badges.length > 0 && (
                <div style={{ flexShrink: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '4px' }}>
                  {badges.map((b, bi) => (
                    <span key={bi} style={{ fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: '999px', background: b.medal ? `${b.medal}22` : 'transparent', border: `1px solid ${b.medal ? `${b.medal}66` : c.border}`, color: b.medal ?? c.textSecondary }}>
                      {b.label}
                    </span>
                  ))}
                </div>
                )}
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

// --- Claim Your Seat form — same submit flow as the desktop Contact section
//     (submitApplication: insert + trial-period auto-approve + registration email). ---
type Status = 'idle' | 'submitting' | 'success' | 'error';
type Values = { name: string; email: string; countryCode: string; mobile: string };
type Errors = { name?: string; email?: string; mobile?: string };

const ClaimYourSeat: React.FC<{
  sectionRef: React.RefObject<HTMLElement | null>;
  sectionStyle: React.CSSProperties;
  eyebrow: (t: string) => React.ReactNode;
  heading: (c: React.ReactNode, s?: string) => React.ReactNode;
  c: ColorPalette;
  accent: string;
  grad: string;
}> = ({ sectionRef, sectionStyle, eyebrow, heading, c, accent, grad }) => {
  const [values, setValues] = useState<Values>({ name: '', email: '', countryCode: '+60', mobile: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<ApplicationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const contactInvite = useContent(
    'contact.invite',
    "There's a seat in the boat with your name on it. Come try a session — no experience needed, all gear provided. We'll get you on the water within a week or two.",
  );

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;
    const next: Errors = {};
    if (!values.name.trim()) next.name = 'Tell us your name';
    if (!values.email.trim()) next.email = 'We need an email to reach you';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = 'That email looks off';
    if (!values.mobile.trim()) next.mobile = 'We need a mobile number for your account';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setStatus('submitting');
    setErrorMsg(null);
    try {
      const fullMobile = `${values.countryCode}${values.mobile.trim()}`;
      const res = await submitApplication(fullMobile, values.name.trim(), values.email.trim());
      setResult(res);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : null);
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
        {contactInvite}
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.9rem' }}>
        {CONTACT_INFO.map((row) => (
          <ContactRow key={row.label} icon={row.icon} label={row.label} value={row.value} color={accent} textColor={c.text} subColor={c.textSecondary} />
        ))}
      </ul>

      {status === 'success' ? (
        <div role="status" style={{ marginTop: '6px', border: `1px solid ${c.border}`, borderRadius: '14px', padding: '22px 18px', textAlign: 'center', background: c.background }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: c.text }}>
            {result?.autoApproved ? 'Check your email.' : 'Seat saved.'}
          </div>
          <div style={{ fontSize: '0.9rem', color: c.textSecondary, lineHeight: 1.55, marginTop: '6px' }}>
            Thanks{values.name.trim() ? `, ${values.name.trim().split(/\s+/)[0]}` : ''}!{' '}
            {result?.autoApproved
              ? result.emailSent
                ? `We've emailed a registration link to ${values.email.trim()}. Open it to set your password and finish creating your account — it's valid for 7 days.`
                : "Your registration link is ready, but the email didn't go through. Please email the team admin to have it re-sent."
              : "We've got your application — our admin team will review it and email you a registration link shortly."}
          </div>
          <button
            type="button"
            onClick={() => {
              setValues({ name: '', email: '', countryCode: '+60', mobile: '' });
              setErrors({});
              setResult(null);
              setErrorMsg(null);
              setStatus('idle');
            }}
            style={{ marginTop: '10px', background: 'none', border: 'none', color: accent, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Send another →
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
          {status === 'error' && (
            <div role="alert" style={{ fontSize: '0.82rem', color: c.text, background: '#ef44441a', border: '1px solid #ef444455', borderRadius: '10px', padding: '10px 12px', lineHeight: 1.5 }}>
              {errorMsg ?? "We couldn't send that just now. Please try again"} — if it keeps happening, email{' '}
              <a href="mailto:admin@alpaspinas.com" style={{ color: accent, fontWeight: 600 }}>admin@alpaspinas.com</a>.
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
            Mobile number
            <div style={{ display: 'flex', gap: '8px' }}>
              <select aria-label="Country code" value={values.countryCode} onChange={set('countryCode')} style={{ ...field, flex: '0 0 92px', padding: '0 8px' }}>
                {COUNTRY_CODES.map((cc) => (
                  <option key={cc.code} value={cc.code}>
                    {cc.flag} {cc.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                placeholder="12 345 6789"
                value={values.mobile}
                onChange={set('mobile')}
                style={{ ...field, flex: 1, borderColor: errors.mobile ? '#ef4444' : c.border }}
              />
            </div>
            {errors.mobile && <span style={{ color: '#ef4444', fontWeight: 500 }}>{errors.mobile}</span>}
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
