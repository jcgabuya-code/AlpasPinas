import React, { useEffect, useState } from 'react';
import hero5Image from '../../images/hero-5-hd.png';
import heroAlpasImage from '../../images/alpas-hero4.png';

// ── Hero photo picker ─────────────────────────────────────────────────────────
// Edit-mode helper: flip between candidate hero photos live in the browser so the
// team can vote on which one they prefer. Flip HERO_PICKER to false to hide the
// on-screen toggle before shipping. The chosen index is remembered in localStorage
// and kept in sync across the desktop hero, mobile hero, and the nav control via a
// custom event, so the pill can live in the nav while the heroes just read the pick.
export const HERO_PICKER = false;
export const HERO_OPTIONS = [
  { src: heroAlpasImage, label: 'Alpas hero 4', short: 'Hero 4', objectPosition: '50% 36%' },
  { src: hero5Image, label: 'Mountain lake', short: 'Lake', objectPosition: '50% 36%' },
];
const HERO_PICK_KEY = 'alpas.heroPick';
const HERO_PICK_EVENT = 'alpas:heroPick';

export function useHeroPick(): [number, (i: number) => void] {
  const [pick, setPick] = useState<number>(() => {
    // Once the picker is disabled (vote finalized), always use the default so a
    // stale saved index can't pin the losing photo now that it can't be changed.
    if (!HERO_PICKER || typeof window === 'undefined') return 0;
    const raw = Number(window.localStorage.getItem(HERO_PICK_KEY));
    return Number.isInteger(raw) && raw >= 0 && raw < HERO_OPTIONS.length ? raw : 0;
  });
  useEffect(() => {
    const onPick = (e: Event) => setPick((e as CustomEvent<number>).detail);
    window.addEventListener(HERO_PICK_EVENT, onPick);
    return () => window.removeEventListener(HERO_PICK_EVENT, onPick);
  }, []);
  const choose = (i: number) => {
    window.localStorage.setItem(HERO_PICK_KEY, String(i));
    window.dispatchEvent(new CustomEvent(HERO_PICK_EVENT, { detail: i }));
  };
  return [pick, choose];
}

// Position-neutral pill that cycles the hero photo — its host decides placement
// (currently centered in the nav on the home page). Dark translucent surface keeps
// it legible when the transparent home nav floats it over the hero photo. `compact`
// tightens it for the short mobile nav bar. Rendered only when HERO_PICKER is on.
export const HeroPhotoPicker: React.FC<{ pick: number; onPick: (i: number) => void; compact?: boolean }> = ({
  pick,
  onPick,
  compact = false,
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: compact ? '0.25rem' : '0.4rem',
      padding: compact ? '0.28rem 0.35rem' : '0.4rem 0.5rem',
      borderRadius: '999px',
      background: 'rgba(11, 16, 20, 0.72)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.16)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
      whiteSpace: 'nowrap',
    }}
  >
    <span
      style={{
        fontSize: compact ? '0.54rem' : '0.62rem',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.6)',
        padding: compact ? '0 0.2rem' : '0 0.35rem',
      }}
    >
      Hero
    </span>
    {HERO_OPTIONS.map((opt, i) => (
      <button
        key={opt.label}
        type="button"
        onClick={() => onPick(i)}
        aria-pressed={pick === i}
        style={{
          cursor: 'pointer',
          border: 'none',
          borderRadius: '999px',
          padding: compact ? '0.26rem 0.5rem' : '0.32rem 0.7rem',
          fontSize: compact ? '0.62rem' : '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.02em',
          fontFamily: 'inherit',
          color: pick === i ? '#0b1014' : 'rgba(255,255,255,0.82)',
          background: pick === i ? '#f5f7f5' : 'transparent',
          transition: 'background 0.16s ease, color 0.16s ease',
        }}
      >
        {compact ? opt.short : opt.label}
      </button>
    ))}
  </div>
);
