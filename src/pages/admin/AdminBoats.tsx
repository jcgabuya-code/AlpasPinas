import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, AlertTriangle, Scale, Wand2, ChevronDown, ChevronRight, Eraser, Share2, Printer, Check, Image as ImageIcon } from 'lucide-react';
import { brandGradient, type ColorPalette } from '../../styles/colors';
import { useTheme } from '../../context/ThemeContext';
import { type ShowToast } from '../Admin';
import { fetchBoatPlannerBench, ageFromBirthday, MASTERS_AGE, type Booking, type Gender, type SideRole } from '../../utils/bookings';
import { getTrainingEvents } from '../../utils/adminTrainingEvents';
import { useIsMobile } from '../../hooks/useIsMobile';
import {
  loadPlan,
  loadPlanCached,
  savePlan,
  emptyBoat,
  CREW_PRESETS,
  type Boat,
  type CrewPreset,
  type SeatId,
} from '../../utils/boatPlans';

/** Per-athlete attributes used for side-matching, weight balance + crew presets. */
type AthleteInfo = { side: SideRole; weight: number; gender: Gender; age?: number };

/** Does an athlete satisfy a boat's crew preset? Warn-only — never blocks. */
const fitsPreset = (preset: CrewPreset | undefined, info?: AthleteInfo): boolean => {
  if (!preset || preset === 'open' || preset === 'mixed') return true;
  if (!info) return false;
  if (preset === 'male') return info.gender === 'Male';
  if (preset === 'female') return info.gender === 'Female';
  if (preset === 'masters') return info.age !== undefined && info.age >= MASTERS_AGE;
  return true;
};

/** Short reason an athlete is off-preset (for tooltips / tags). null when they fit. */
const presetMismatchLabel = (preset: CrewPreset | undefined, info?: AthleteInfo): string | null => {
  if (fitsPreset(preset, info)) return null;
  if (preset === 'male') return 'not male';
  if (preset === 'female') return 'not female';
  if (preset === 'masters') return info?.age === undefined ? 'age unknown' : 'under 40';
  return null;
};

/* ------------------------------------------------------------------ */

const ROWS = 10;

/** Bench list sizing — how many cards are visible before it scrolls. */
const BENCH_ROW_PX = 40; // approx height of one compact card + gap
const BENCH_VISIBLE_ROWS = 5;
const BENCH_MAX_HEIGHT = BENCH_VISIBLE_ROWS * BENCH_ROW_PX;

/** What side an athlete must paddle to "fit" a given seat. */
type ExpectedSide = 'Left' | 'Right' | 'Coxswain' | 'Any';

const seatExpectedSide = (id: SeatId): ExpectedSide => {
  if (id === 'STEERS') return 'Coxswain';
  if (id === 'DRUMMER') return 'Any';
  if (id.endsWith('L')) return 'Left';
  if (id.endsWith('R')) return 'Right';
  return 'Any';
};

/** True when the occupant's preferred side conflicts with the seat. */
const isOffSide = (seatId: SeatId, occupantSide?: SideRole): boolean => {
  const expected = seatExpectedSide(seatId);
  if (expected === 'Any' || !occupantSide) return false;
  return occupantSide !== expected;
};

const isPaddlerSeat = (id: SeatId) => id !== 'DRUMMER' && id !== 'STEERS';

/** Row order from the centre outward — e.g. n=10 → [5,6,4,7,3,8,2,9,1,10].
 *  Seating heaviest-first in this order puts the weight in the "engine room"
 *  (middle rows) and tapers it toward the bow/stern, keeping trim even. */
const middleOutOrder = (n: number): number[] => {
  const order: number[] = [];
  let left = Math.floor((n + 1) / 2);
  let right = left + 1;
  while (order.length < n) {
    if (left >= 1) order.push(left--);
    if (right <= n && order.length < n) order.push(right++);
  }
  return order;
};

/** drag payload moved through dataTransfer */
type DragData = { name: string; fromSeat: SeatId | null };
const DRAG_MIME = 'application/x-alpas-athlete';

/* ------------------------------------------------------------------ */

type Props = { showToast: ShowToast; c: ColorPalette; theme: 'dark' | 'light' };

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export const AdminBoats: React.FC<Props> = ({ c, showToast, theme }) => {
  const { brand } = useTheme();
  const isMobile = useIsMobile();
  // Boat seating only makes sense for lake weekends — land conditioning
  // sign-ups carry no side/weight and would show up as an empty bench.
  const events = getTrainingEvents().filter((ev) => (ev.venue ?? 'lake') === 'lake');
  const [eventId, setEventId] = useState(events[0]?.id ?? '');
  const [dayKey, setDayKey] = useState(events[0]?.days[0]?.key ?? '');
  const [boats, setBoats] = useState<Boat[]>([]);
  const [activeBoatId, setActiveBoatId] = useState('');
  const [selected, setSelected] = useState<string | null>(null); // selected bench athlete
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [dragOverSeat, setDragOverSeat] = useState<SeatId | null>(null);
  const [pickerSeat, setPickerSeat] = useState<SeatId | null>(null); // mobile seat-picker sheet
  const [benchOpen, setBenchOpen] = useState(false); // mobile: bench collapsed by default
  const [benchQuery, setBenchQuery] = useState(''); // bench name filter
  const [excludeOtherBoats, setExcludeOtherBoats] = useState(false); // auto-seat: skip paddlers already in another boat
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [exportOpen, setExportOpen] = useState(false); // share / export lineup sheet

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load bookings once. Uses the boat-planner-only bench fetch, which is real
  // Supabase data unless VITE_SEED_BOOKINGS=1 fills it with a sample roster
  // for testing — either way, isolated from the shared bookings cache.
  useEffect(() => {
    fetchBoatPlannerBench().then(setAllBookings);
  }, []);

  // Load plan when event/day changes: paint the cache instantly, then refresh
  // from Supabase and reconcile.
  useEffect(() => {
    if (!eventId || !dayKey) return;
    let cancelled = false;
    const cached = loadPlanCached(eventId, dayKey);
    setBoats(cached);
    setActiveBoatId(cached[0]?.id ?? '');
    setSelected(null);
    setSaveStatus('idle');
    loadPlan(eventId, dayKey).then((plan) => {
      if (cancelled) return;
      setBoats(plan);
      setActiveBoatId((prev) => (plan.some((b) => b.id === prev) ? prev : plan[0]?.id ?? ''));
    });
    return () => {
      cancelled = true;
    };
  }, [eventId, dayKey]);

  // Flush any pending save on unmount.
  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  // Update state immediately, debounce the remote save (drag spam-safe).
  const persist = (updated: Boat[]) => {
    setBoats(updated);
    setSaveStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await savePlan(eventId, dayKey, updated);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
        showToast('Saved locally — could not sync to the server.', 'error');
      }
    }, 600);
  };

  // Athletes for this event+day (any status).
  const athletes = useMemo(
    () =>
      allBookings.filter(
        (b) => b.eventId === eventId && (b.attending === 'both' || b.attending === dayKey),
      ),
    [allBookings, eventId, dayKey],
  );

  // name → { side, weight, gender, age } for side-matching, weight balance + presets.
  const infoByName = useMemo(() => {
    const m = new Map<string, AthleteInfo>();
    athletes.forEach((b) =>
      // Boat planning only ever looks at lake bookings (side/weight are always
      // collected there); the fallback just satisfies the type for land rows
      // that could theoretically leak in.
      m.set(b.name, { side: b.side ?? 'Coach', weight: b.weight ?? 0, gender: b.gender, age: ageFromBirthday(b.birthday) }),
    );
    return m;
  }, [athletes]);

  const activeBoat = boats.find((b) => b.id === activeBoatId);

  // A person may sit in MULTIPLE boats, so "bench" is relative to the active
  // boat: everyone not already seated in *this* boat is available to add.
  const seatedInActiveBoat = useMemo(
    () => new Set(Object.values(activeBoat?.seats ?? {})),
    [activeBoat],
  );
  const unassigned = athletes.filter((b) => !seatedInActiveBoat.has(b.name));

  // Bench list filtered by the search box (case-insensitive name match).
  const benchAthletes = useMemo(() => {
    const q = benchQuery.trim().toLowerCase();
    return q ? athletes.filter((b) => b.name.toLowerCase().includes(q)) : athletes;
  }, [athletes, benchQuery]);

  // name → other boats they're already seated in (shown as a hint on the bench).
  const otherBoatsByName = useMemo(() => {
    const m = new Map<string, string[]>();
    boats.forEach((boat) => {
      if (boat.id === activeBoatId) return;
      new Set(Object.values(boat.seats)).forEach((name) => {
        m.set(name, [...(m.get(name) ?? []), boat.name]);
      });
    });
    return m;
  }, [boats, activeBoatId]);

  /* ----------------------------- seat ops --------------------------- */

  /** Place `name` into `toSeat` of the active boat; if `fromSeat` is given,
   *  swap with whatever sits in the target (move within the boat). A bench
   *  athlete dropped onto an occupied seat bumps the occupant back to the bench. */
  const placeAthlete = (name: string, fromSeat: SeatId | null, toSeat: SeatId) => {
    if (!activeBoat) return;
    // Strict crew preset: a paddler coming from the bench (fromSeat === null)
    // must satisfy this boat's preset. Moves WITHIN the boat (fromSeat set) are
    // always allowed — everyone already seated fits by construction.
    if (!fromSeat) {
      const mismatch = presetMismatchLabel(activeBoat.preset, infoByName.get(name));
      if (mismatch) {
        showToast(`${name} can't join ${activeBoat.name} — ${mismatch}.`, 'error');
        return;
      }
    }
    const updated = boats.map((boat) => {
      if (boat.id !== activeBoatId) return boat;
      const seats = { ...boat.seats };
      const displaced = seats[toSeat];

      if (fromSeat && fromSeat !== toSeat) {
        // Moving within the boat → swap occupants between the two seats.
        if (displaced) seats[fromSeat] = displaced;
        else delete seats[fromSeat];
      } else {
        // Coming from the bench → make sure they're not double-seated elsewhere.
        Object.keys(seats).forEach((k) => {
          if (seats[k] === name && k !== toSeat) delete seats[k];
        });
      }
      seats[toSeat] = name;
      return { ...boat, seats };
    });
    persist(updated);
  };

  /** Remove the occupant of `seatId` (back to the bench). */
  const clearSeat = (seatId: SeatId) => {
    if (!activeBoat) return;
    const updated = boats.map((boat) => {
      if (boat.id !== activeBoatId) return boat;
      const seats = { ...boat.seats };
      delete seats[seatId];
      return { ...boat, seats };
    });
    persist(updated);
  };

  const handleSeatClick = (seatId: SeatId) => {
    if (!activeBoat) return;
    // If a bench athlete is queued (desktop select-then-place shortcut), drop
    // them straight in. Otherwise open the member picker — same on every view.
    if (selected) {
      placeAthlete(selected, null, seatId);
      setSelected(null);
      return;
    }
    setPickerSeat(seatId);
  };

  const handleBenchClick = (name: string) => {
    // On mobile the flow is seat-first (tap a seat → pick), so bench taps are
    // informational only — don't enter the desktop select-then-place mode.
    if (isMobile) return;
    setSelected((prev) => (prev === name ? null : name));
  };

  /* ----------------------------- drag ops --------------------------- */

  const onSeatDrop = (toSeat: SeatId) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverSeat(null);
    const data = readDrag(e);
    if (!data) return;
    placeAthlete(data.name, data.fromSeat, toSeat);
    setSelected(null);
  };

  const onBenchDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = readDrag(e);
    if (data?.fromSeat) clearSeat(data.fromSeat);
  };

  /* ----------------------------- boat ops --------------------------- */

  const addBoat = () => {
    if (boats.length >= 5) { showToast('Maximum 5 boats.', 'error'); return; }
    const newBoat = emptyBoat();
    persist([...boats, newBoat]);
    setActiveBoatId(newBoat.id);
  };

  const removeBoat = (id: string) => {
    if (boats.length <= 1) { showToast('Need at least one boat.', 'error'); return; }
    const updated = boats.filter((b) => b.id !== id);
    persist(updated);
    if (activeBoatId === id) setActiveBoatId(updated[0]?.id ?? '');
  };

  const renameBoat = (id: string, name: string) => {
    persist(boats.map((b) => (b.id === id ? { ...b, name } : b)));
  };

  const setPreset = (id: string, preset: CrewPreset) => {
    // Selecting a preset also renames the boat to match it (e.g. "Mixed crew").
    const name = CREW_PRESETS.find((p) => p.id === preset)?.label ?? preset;
    // Strict crew preset: anyone already seated who no longer fits the new preset
    // is evicted to the bench, so the boat is always valid for its crew type.
    let evicted = 0;
    const updated = boats.map((b) => {
      if (b.id !== id) return b;
      const seats: Record<SeatId, string> = {};
      (Object.entries(b.seats) as [SeatId, string][]).forEach(([seatId, occupant]) => {
        if (fitsPreset(preset, infoByName.get(occupant))) seats[seatId] = occupant;
        else evicted++;
      });
      return { ...b, preset, name, seats };
    });
    persist(updated);
    if (evicted > 0) {
      showToast(`Switched to ${name} crew — ${evicted} off-preset paddler${evicted > 1 ? 's' : ''} returned to the bench.`);
    }
  };

  /**
   * Seat everyone available to this boat (not already in another boat) onto their
   * correct side, weight-balanced, and matching the boat's crew preset. Rebuilds
   * the active boat's seating from scratch.
   */
  const autoFillBoat = () => {
    if (!activeBoat) return;

    // A paddler may sit in more than one boat on the same day (e.g. an Open boat
    // AND a Mixed boat), so by default auto-seat draws from EVERYONE matching
    // this boat's preset — mirroring the manual flow. When "exclude paddlers
    // already in another boat" is on, it skips anyone seated elsewhere so a squad
    // gets split across boats instead.
    const takenElsewhere = new Set(
      boats.filter((b) => b.id !== activeBoatId).flatMap((b) => Object.values(b.seats)),
    );
    const pool = athletes
      .filter((a) => !excludeOtherBoats || !takenElsewhere.has(a.name))
      .filter((a) => fitsPreset(activeBoat.preset, infoByName.get(a.name)));
    if (pool.length === 0) {
      showToast(
        activeBoat.preset && activeBoat.preset !== 'open' && activeBoat.preset !== 'mixed'
          ? 'No available sign-ups match this crew preset.'
          : 'No available sign-ups to seat.',
        'error',
      );
      return;
    }

    const byWeightDesc = (a: Booking, b: Booking) => (b.weight ?? 0) - (a.weight ?? 0);
    const coxes = pool.filter((a) => a.side === 'Coxswain');
    const coaches = pool.filter((a) => a.side === 'Coach');
    const paddlerPool = pool.filter((a) => a.side === 'Left' || a.side === 'Right');

    // A dragon boat must paddle in PAIRS — equal numbers each side. An odd,
    // unpaired paddler lists the boat and skews the head-count, so seat only full
    // rows: floor(pool / 2) per side, capped at ROWS. The lightest odd paddler (and
    // anyone beyond capacity) stays on the bench.
    const perSide = Math.min(Math.floor(paddlerPool.length / 2), ROWS);
    const leftTarget = perSide;
    const rightTarget = perSide;

    // Seat the heaviest `perSide * 2` paddlers; lighter spares stay on the bench.
    const seated = [...paddlerPool].sort(byWeightDesc).slice(0, perSide * 2);

    // Weight-first side assignment: walk heaviest → lightest and drop each paddler
    // on whichever side currently carries less weight, so port/starboard kg end up
    // even. Once a side reaches its count target the rest go to the other side.
    // Preferred side only breaks ties (equal weight so far), so anyone placed
    // against their preference shows the usual off-side warning.
    const seatLeft: Booking[] = [];
    const seatRight: Booking[] = [];
    let leftKg = 0;
    let rightKg = 0;
    for (const a of seated) {
      const leftFull = seatLeft.length >= leftTarget;
      const rightFull = seatRight.length >= rightTarget;
      const toLeft = leftFull ? false
        : rightFull ? true
        : leftKg !== rightKg ? leftKg < rightKg
        : a.side === 'Left'; // even so far → honor their preferred side
      if (toLeft) { seatLeft.push(a); leftKg += a.weight ?? 0; }
      else { seatRight.push(a); rightKg += a.weight ?? 0; }
    }

    // Seat heaviest-first from the centre outward so weight sits amidships (trim).
    const order = middleOutOrder(ROWS);
    const seats: Record<SeatId, string> = {};
    seatLeft.sort(byWeightDesc).forEach((a, i) => { if (i < order.length) seats[`${order[i]}L`] = a.name; });
    seatRight.sort(byWeightDesc).forEach((a, i) => { if (i < order.length) seats[`${order[i]}R`] = a.name; });

    // Steers ← a coxswain; Drummer ← a coach (or a spare coxswain).
    const steers = coxes[0];
    if (steers) seats['STEERS'] = steers.name;
    const drummer = coaches[0] ?? coxes[1];
    if (drummer) seats['DRUMMER'] = drummer.name;

    persist(boats.map((b) => (b.id === activeBoatId ? { ...b, seats } : b)));
    setSelected(null);

    const paddlers = seatLeft.length + seatRight.length;
    const flipped =
      seatLeft.filter((a) => a.side === 'Right').length +
      seatRight.filter((a) => a.side === 'Left').length;
    const benched = pool.length - paddlers - (steers ? 1 : 0) - (drummer ? 1 : 0);
    showToast(
      `Seated ${paddlers} paddlers${steers ? ' + steers' : ''}${drummer ? ' + drummer' : ''}, weight-balanced.` +
        (flipped > 0 ? ` ${flipped} moved off-side to even the boat.` : '') +
        (benched > 0 ? ` ${benched} left on the bench.` : ''),
    );
  };

  /** Empty every seat in the active boat (athletes return to the bench). */
  const clearBoat = () => {
    if (!activeBoat) return;
    if (Object.keys(activeBoat.seats).length === 0) {
      showToast('This boat is already empty.', 'error');
      return;
    }
    if (!window.confirm(`Clear all seats in ${activeBoat.name}? Everyone goes back to the bench.`)) return;
    persist(boats.map((b) => (b.id === activeBoatId ? { ...b, seats: {} } : b)));
    setSelected(null);
    showToast(`Cleared ${activeBoat.name}.`);
  };

  const currentEvent = events.find((e) => e.id === eventId);

  return (
    <div style={{ padding: '2rem 1.5rem 4rem', maxWidth: 1180, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: c.text, margin: '0 0 0.4rem', letterSpacing: '0.02em', lineHeight: 1 }}>
        BOAT ASSIGNMENTS
      </h1>
      <p style={{ color: c.textSecondary, fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
        {isMobile
          ? 'Tap a seat to assign or change its paddler, or use Auto-seat to fill the boat instantly. Changes auto-save.'
          : 'Click a seat to pick a paddler, or drag athletes from the bench onto seats. Changes auto-save.'}
      </p>

      {/* Event + Day selectors. On mobile they share one no-wrap row to save
          vertical space: the event select flexes/shrinks (its long title truncates),
          the day select keeps its natural width, and "Saved" tucks in at the end. */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: isMobile ? 'nowrap' : 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        <select
          value={eventId}
          onChange={(e) => {
            const ev = events.find((x) => x.id === e.target.value);
            setEventId(e.target.value);
            setDayKey(ev?.days[0]?.key ?? '');
          }}
          style={{ ...selectStyle(c), ...(isMobile ? { flex: 1, minWidth: 0, padding: '0.5rem 0.6rem' } : {}) }}
        >
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>

        {currentEvent && (
          <select
            value={dayKey}
            onChange={(e) => setDayKey(e.target.value)}
            style={{ ...selectStyle(c), ...(isMobile ? { flexShrink: 0, padding: '0.5rem 0.6rem' } : {}) }}
          >
            {currentEvent.days.map((d) => (
              <option key={d.key} value={d.key}>{d.label}</option>
            ))}
          </select>
        )}

        <SaveIndicator status={saveStatus} c={c} />
      </div>

      {!eventId || !dayKey ? (
        <p style={{ color: c.textSecondary }}>Select an event and day above.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.5rem', flexWrap: isMobile ? 'nowrap' : 'wrap', alignItems: isMobile ? 'stretch' : 'flex-start' }}>
          {/* Left sidebar — bench + (desktop) trim & balance stacked together. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: isMobile ? '100%' : 'min(240px, 100%)', flexShrink: 0 }}>
          {/* Bench — also a drop target to un-seat an athlete. On mobile the seat
              picker handles assignment, so it's collapsed by default (kept just
              for reference). */}
          {(() => {
          const benchListOpen = !isMobile || benchOpen;
          return (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onBenchDrop}
            style={{
              width: '100%',
              flexShrink: 0,
              backgroundColor: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: '0.85rem',
              padding: '1rem',
            }}
          >
            {isMobile ? (
              <button
                type="button"
                onClick={() => setBenchOpen((o) => !o)}
                aria-expanded={benchOpen}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
                  background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: c.textSecondary,
                }}
              >
                {benchOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                Bench ({unassigned.length})
              </button>
            ) : (
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.textSecondary, marginBottom: '0.75rem' }}>
                Bench ({unassigned.length})
              </div>
            )}
            {benchListOpen && athletes.length === 0 && (
              <p style={{ fontSize: '0.8rem', color: c.textSecondary, marginTop: isMobile ? '0.75rem' : 0 }}>No sign-ups for this day.</p>
            )}
            {benchListOpen && athletes.length > 0 && (
              <input
                value={benchQuery}
                onChange={(e) => setBenchQuery(e.target.value)}
                placeholder="Search bench…"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  marginTop: '0.75rem',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '0.45rem',
                  border: `1px solid ${c.border}`,
                  backgroundColor: c.surfaceAlt,
                  color: c.text,
                  fontSize: '0.8rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            )}
            {benchListOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.6rem', maxHeight: BENCH_MAX_HEIGHT, overflowY: 'auto' }}>
              {benchAthletes.length === 0 && (
                <p style={{ fontSize: '0.78rem', color: c.textSecondary, margin: '0.25rem 0' }}>No one matches “{benchQuery}”.</p>
              )}
              {benchAthletes.map((b) => {
                // "Assigned" here = already in THIS boat (a person may be in others).
                const isAssigned = seatedInActiveBoat.has(b.name);
                const isSel = selected === b.name;
                const elsewhere = otherBoatsByName.get(b.name);
                const offPreset = !!activeBoat && !fitsPreset(activeBoat.preset, infoByName.get(b.name));
                // Off-preset paddlers can't join this boat (strict crew preset), so
                // they're shown but non-interactive — same as ones already seated here.
                const blocked = isAssigned || offPreset;
                return (
                  <button
                    key={b.name}
                    type="button"
                    draggable={!blocked}
                    onDragStart={(e) => !blocked && writeDrag(e, { name: b.name, fromSeat: null })}
                    onClick={() => !blocked && handleBenchClick(b.name)}
                    title={offPreset ? `Can't join ${activeBoat?.name} — ${presetMismatchLabel(activeBoat?.preset, infoByName.get(b.name))}` : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.35rem 0.6rem',
                      borderRadius: '0.4rem',
                      border: `1px solid ${isSel ? c.primary : offPreset ? '#f59e0b66' : c.border}`,
                      backgroundColor: isSel ? `${c.primary}22` : isAssigned ? c.background : c.surfaceAlt,
                      color: blocked ? c.textSecondary : c.text,
                      fontSize: '0.82rem',
                      fontWeight: isSel ? 700 : 500,
                      textAlign: 'left',
                      cursor: blocked ? 'not-allowed' : 'grab',
                      fontFamily: 'inherit',
                      opacity: blocked ? 0.5 : 1,
                      transition: 'background-color 0.1s, border-color 0.1s',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', minWidth: 0 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                      {offPreset && <AlertTriangle size={11} color="#f59e0b" style={{ flexShrink: 0 }} />}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: c.textSecondary, flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {sideLabel(b.side)} · {b.weight}kg
                      {elsewhere && elsewhere.length > 0 && (
                        <span style={{ color: c.primary }}> · {elsewhere.join(', ')}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            )}
            {benchListOpen && selected && (
              <button
                type="button"
                onClick={() => setSelected(null)}
                style={{ marginTop: '0.75rem', width: '100%', padding: '0.4rem', borderRadius: '0.45rem', border: `1px solid ${c.border}`, background: 'transparent', color: c.textSecondary, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Deselect
              </button>
            )}
          </div>
          );
          })()}

          {/* Trim & balance lives under the bench on desktop; on mobile it sits
              above the grid (rendered inside the grid row instead). */}
          {!isMobile && activeBoat && (
            <BalancePanel boat={activeBoat} infoByName={infoByName} c={c} />
          )}
          </div>

          {/* Boat area */}
          <div style={{ flex: isMobile ? 'unset' : 1, width: isMobile ? '100%' : 'auto', minWidth: 0 }}>
            {/* Boat tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
              {boats.map((boat) => (
                <div key={boat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.1rem' }}>
                  <button
                    type="button"
                    onClick={() => setActiveBoatId(boat.id)}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '999px',
                      border: `1px solid ${boat.id === activeBoatId ? c.primary : c.border}`,
                      background: boat.id === activeBoatId ? `${c.primary}18` : 'transparent',
                      color: boat.id === activeBoatId ? c.primary : c.textSecondary,
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {boat.name}
                  </button>
                  {boats.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBoat(boat.id)}
                      style={{ background: 'transparent', border: 'none', color: c.textSecondary, cursor: 'pointer', padding: '0.2rem', lineHeight: 1 }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addBoat}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.75rem', borderRadius: '999px', border: `1px dashed ${c.border}`, background: 'transparent', color: c.textSecondary, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <Plus size={12} /> Add boat
              </button>
            </div>

            {/* Rename + boat actions (auto-seat, clear, share on one line) */}
            {activeBoat && (
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.6rem', alignItems: isMobile ? 'stretch' : 'center', flexWrap: isMobile ? 'nowrap' : 'wrap', marginBottom: '1rem' }}>
                <input
                  value={activeBoat.name}
                  onChange={(e) => renameBoat(activeBoat.id, e.target.value)}
                  placeholder="Boat name"
                  style={{ ...selectStyle(c), width: isMobile ? '100%' : undefined, maxWidth: isMobile ? '100%' : '200px', boxSizing: 'border-box' }}
                />
                {/* The three actions share a row; on mobile they split evenly. */}
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={autoFillBoat}
                    title="Seat everyone signed up by their side and balance the weight"
                    style={{
                      flex: isMobile ? 1 : undefined,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      padding: '0.5rem 0.8rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      background: brandGradient(brand, theme),
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      boxShadow: `0 4px 14px ${c.primary}33`,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    <Wand2 size={15} /> Auto-seat
                  </button>
                  <button
                    type="button"
                    onClick={clearBoat}
                    title="Empty every seat in this boat — everyone returns to the bench"
                    style={{
                      flex: isMobile ? 1 : undefined,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      padding: '0.5rem 0.8rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${c.border}`,
                      background: 'transparent',
                      color: c.textSecondary,
                      fontWeight: 600,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    <Eraser size={15} /> Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportOpen(true)}
                    title="Preview the lineup, copy it as an image, or print a boat sheet"
                    style={{
                      flex: isMobile ? 1 : undefined,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      padding: '0.5rem 0.8rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${c.border}`,
                      background: 'transparent',
                      color: c.textSecondary,
                      fontWeight: 600,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    <Share2 size={15} /> Share
                  </button>
                </div>
                {boats.length > 1 && (
                  <label
                    title="When on, auto-seat skips anyone already seated in another boat — useful for splitting a squad across boats"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: c.textSecondary, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <input
                      type="checkbox"
                      checked={excludeOtherBoats}
                      onChange={(e) => setExcludeOtherBoats(e.target.checked)}
                      style={{ accentColor: c.primary, cursor: 'pointer' }}
                    />
                    Exclude paddlers already in another boat
                  </label>
                )}
              </div>
            )}

            {/* Crew preset — drives auto-seat eligibility + off-preset warnings. */}
            {activeBoat && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.textSecondary }}>
                  Crew
                </span>
                {CREW_PRESETS.map((p) => {
                  const active = (activeBoat.preset ?? 'open') === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPreset(activeBoat.id, p.id)}
                      style={{
                        padding: '0.35rem 0.8rem',
                        borderRadius: '999px',
                        border: `1px solid ${active ? c.primary : c.border}`,
                        background: active ? `${c.primary}18` : 'transparent',
                        color: active ? c.primary : c.textSecondary,
                        fontWeight: active ? 700 : 500,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Balance summary + grid. On mobile, column-reverse floats the
                Trim & balance table above the boat grid. */}
            {activeBoat && (
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', gap: '1.5rem', alignItems: isMobile ? 'stretch' : 'flex-start' }}>
                {/* Mobile only — trim & balance floats above the grid. */}
                {isMobile && (
                  <BalancePanel boat={activeBoat} infoByName={infoByName} c={c} fullWidth />
                )}
                <div style={{ display: 'flex', justifyContent: isMobile ? 'center' : 'flex-start', flex: isMobile ? 'unset' : '1 1 0', minWidth: 0 }}>
                  <BoatGrid
                    boat={activeBoat}
                    selected={selected}
                    selectedSide={selected ? infoByName.get(selected)?.side : undefined}
                    infoByName={infoByName}
                    dragOverSeat={dragOverSeat}
                    onSeatClick={handleSeatClick}
                    onSeatDrop={onSeatDrop}
                    onSeatDragOver={(id) => setDragOverSeat(id)}
                    onSeatDragLeave={() => setDragOverSeat(null)}
                    onSeatDragStart={(e, name, fromSeat) => writeDrag(e, { name, fromSeat })}
                    c={c}
                    fluid={isMobile}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {selected && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '0.6rem 1.25rem',
            borderRadius: '999px',
            backgroundColor: c.primary,
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 600,
            zIndex: 50,
            boxShadow: `0 8px 24px ${c.primary}44`,
          }}
        >
          Placing: {selected} — click a seat
        </div>
      )}

      {pickerSeat && activeBoat && (
        <SeatPickerSheet
          seatId={pickerSeat}
          boat={activeBoat}
          candidates={unassigned}
          infoByName={infoByName}
          c={c}
          isMobile={isMobile}
          onPlace={(name) => { placeAthlete(name, null, pickerSeat); setPickerSeat(null); }}
          onRemove={() => { clearSeat(pickerSeat); setPickerSeat(null); }}
          onClose={() => setPickerSeat(null)}
        />
      )}

      {exportOpen && activeBoat && (
        <ExportSheet
          boat={activeBoat}
          eventTitle={currentEvent?.title ?? ''}
          dayLabel={currentEvent?.days.find((d) => d.key === dayKey)?.label ?? ''}
          bench={unassigned.map((b) => b.name)}
          c={c}
          isMobile={isMobile}
          showToast={showToast}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Mobile seat picker — tap a seat, choose an athlete from a bottom sheet.    */

const seatLabel = (id: SeatId): string =>
  id === 'DRUMMER' ? 'Drummer' : id === 'STEERS' ? 'Steers' : id;

const seatSideHint = (id: SeatId): string => {
  const e = seatExpectedSide(id);
  return e === 'Any' ? 'any side' : e === 'Coxswain' ? 'coxswain / steers' : `${e} side`;
};

const SeatPickerSheet: React.FC<{
  seatId: SeatId;
  boat: Boat;
  candidates: Booking[];
  infoByName: Map<string, AthleteInfo>;
  c: ColorPalette;
  isMobile: boolean;
  onPlace: (name: string) => void;
  onRemove: () => void;
  onClose: () => void;
}> = ({ seatId, boat, candidates, infoByName, c, isMobile, onPlace, onRemove, onClose }) => {
  const occupant = boat.seats[seatId];
  // Off-preset for this boat's crew? (warn-only).
  const offPresetName = (name: string) => !fitsPreset(boat.preset, infoByName.get(name));
  // Side match first, then on-preset, then heaviest first within each group.
  const sorted = [...candidates].sort((a, b) => {
    const aOff = isOffSide(seatId, a.side);
    const bOff = isOffSide(seatId, b.side);
    if (aOff !== bOff) return aOff ? 1 : -1;
    const aPre = offPresetName(a.name);
    const bPre = offPresetName(b.name);
    if (aPre !== bPre) return aPre ? 1 : -1;
    return (b.weight ?? 0) - (a.weight ?? 0);
  });

  // Mobile slides up from the bottom; desktop drops in as a centered modal.
  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 401,
        maxHeight: '72vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: c.surface,
        borderTop: `1px solid ${c.border}`,
        borderTopLeftRadius: '1rem',
        borderTopRightRadius: '1rem',
        boxShadow: '0 -12px 32px rgba(0,0,0,0.35)',
        animation: 'alpas-sheet-up 220ms cubic-bezier(0.22,1,0.36,1)',
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 401,
        width: 'min(440px, calc(100vw - 3rem))',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: '1rem',
        boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        animation: 'alpas-modal-in 180ms cubic-bezier(0.22,1,0.36,1)',
      };

  return (
    <>
      <style>{`
        @keyframes alpas-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes alpas-modal-in { from { opacity: 0; transform: translate(-50%, -46%); } to { opacity: 1; transform: translate(-50%, -50%); } }
      `}</style>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 400, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
      />
      <div style={panelStyle}>
        {/* Grab handle — mobile only */}
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0 0.25rem' }}>
            <div style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: c.border }} />
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: `${isMobile ? '0.5rem' : '1.1rem'} 1.25rem 0.75rem` }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: c.text }}>Seat {seatLabel(seatId)}</div>
            <div style={{ fontSize: '0.78rem', color: c.textSecondary }}>Prefers {seatSideHint(seatId)}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'transparent', border: `1px solid ${c.border}`, color: c.textSecondary, width: 30, height: 30, borderRadius: 999, cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit', flexShrink: 0 }}
          >
            ×
          </button>
        </div>

        {/* Current occupant → remove */}
        {occupant && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', margin: '0 1.25rem 0.5rem', padding: '0.65rem 0.85rem', borderRadius: '0.6rem', backgroundColor: c.surfaceAlt, border: `1px solid ${c.border}` }}>
            <span style={{ fontSize: '0.88rem', color: c.text }}>Currently: <strong>{occupant}</strong></span>
            <button
              type="button"
              onClick={onRemove}
              style={{ background: 'transparent', border: '1px solid #ef444466', color: '#ef4444', padding: '0.35rem 0.8rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
            >
              Remove
            </button>
          </div>
        )}

        {/* Candidate list */}
        <div style={{ overflowY: 'auto', padding: '0.25rem 1.25rem 1.5rem' }}>
          {sorted.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: c.textSecondary, textAlign: 'center', padding: '1rem 0' }}>
              Everyone available is already seated.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {sorted.map((a) => {
                const off = isOffSide(seatId, a.side);
                const presetTag = presetMismatchLabel(boat.preset, infoByName.get(a.name));
                // Strict crew preset: off-preset paddlers are shown but can't be
                // placed (off-SIDE is still allowed — that's only a warning).
                const blocked = !!presetTag;
                return (
                  <button
                    key={a.name}
                    type="button"
                    onClick={() => !blocked && onPlace(a.name)}
                    disabled={blocked}
                    title={blocked ? `Can't join ${boat.name} — ${presetTag}` : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.6rem',
                      width: '100%',
                      padding: '0.7rem 0.85rem',
                      borderRadius: '0.55rem',
                      border: `1px solid ${off || presetTag ? '#f59e0b55' : c.border}`,
                      backgroundColor: c.surfaceAlt,
                      color: c.text,
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      textAlign: 'left',
                      cursor: blocked ? 'not-allowed' : 'pointer',
                      opacity: blocked ? 0.5 : 1,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{a.name}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', color: c.textSecondary, flexShrink: 0 }}>
                      {presetTag && (
                        <span style={{ color: '#f59e0b', fontWeight: 700 }}>{presetTag}</span>
                      )}
                      {off && (
                        <span style={{ color: '#f59e0b', fontWeight: 700 }}>off-side</span>
                      )}
                      {sideLabel(a.side)} · {a.weight}kg
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Share / Export — preview the printable sheet, copy it as an image,   */
/* or print it. Same layout everywhere so the preview === the printout.  */

/** Brand hand-drawn line-art used on the printable sheet (see public/icons). */
const SHEET_ICONS = {
  boat: '/icons/dragonboat-icon2.png',
  paddle: '/icons/paddle-icon1.png',
} as const;

/** Fetch an asset and return it as a base64 data URL, cached so we fetch once.
 *  Inlining is required for the copy-image path: an external URL won't load once
 *  the sheet is serialized into an SVG and rendered as an image. */
const dataUrlCache = new Map<string, Promise<string>>();
const loadDataUrl = (path: string): Promise<string> => {
  let p = dataUrlCache.get(path);
  if (!p) {
    p = fetch(path)
      .then((r) => r.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result as string);
            fr.onerror = reject;
            fr.readAsDataURL(blob);
          }),
      );
    dataUrlCache.set(path, p);
  }
  return p;
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });

/** Render the boat lineup straight onto a 2× canvas and export it as a PNG.
 *  We draw with the Canvas 2D API (not an SVG <foreignObject>) on purpose:
 *  WebKit/Safari taints — and then refuses to export — any canvas that has had a
 *  foreignObject-bearing SVG drawn onto it, so that approach silently fails on
 *  Mac/iOS. Drawing primitives + data-URL icons keeps the canvas exportable
 *  everywhere, with no dependencies. */
const FONT_STACK = '-apple-system, "Segoe UI", Roboto, sans-serif';

const lineupToPngBlob = async (
  boat: Boat,
  eventTitle: string,
  dayLabel: string,
  bench: string[],
  iconUrls: { boat?: string; paddle?: string },
): Promise<Blob | null> => {
  const presetLabel = CREW_PRESETS.find((p) => p.id === (boat.preset ?? 'open'))?.label ?? 'Open';
  const crewLine = boat.name === presetLabel ? presetLabel : `${boat.name} · ${presetLabel}`;

  const SCALE = 2;
  const W = 440;
  const PAD = 28;
  const innerW = W - PAD * 2;
  const ROW_H = 30;

  const [boatImg, paddleImg] = await Promise.all([
    iconUrls.boat ? loadImage(iconUrls.boat).catch(() => null) : Promise.resolve(null),
    iconUrls.paddle ? loadImage(iconUrls.paddle).catch(() => null) : Promise.resolve(null),
  ]);

  // Measuring pass — wrap the bench line so we can size the canvas before drawing
  // (setting canvas height resets the 2D context, so height must be known first).
  const meas = document.createElement('canvas').getContext('2d');
  if (!meas) return null;
  meas.font = `13px ${FONT_STACK}`;
  const benchLines: string[] = [];
  if (bench.length) {
    const words = `Not seated: ${bench.join(', ')}`.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (meas.measureText(test).width > innerW && line) { benchLines.push(line); line = word; }
      else line = test;
    }
    if (line) benchLines.push(line);
  }

  const titleH = 28;
  const metaH = 17;
  let total = PAD + titleH + 2;
  if (eventTitle) total += metaH;
  if (dayLabel) total += metaH;
  total += 16 + 20 + 10; // subtitle (margin-top, height, margin-bottom)
  total += (ROWS + 3) * ROW_H; // drummer + header + rows + steers
  if (benchLines.length) total += 14 + benchLines.length * 18;
  total += PAD;

  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = Math.ceil(total) * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, total);

  /** Truncate with an ellipsis so long names never spill out of their cell. */
  const fit = (s: string, maxW: number): string => {
    if (ctx.measureText(s).width <= maxW) return s;
    let t = s;
    while (t.length > 1 && ctx.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
    return `${t}…`;
  };

  let y = PAD;

  // Title (dragonboat icon + name).
  let x = PAD;
  if (boatImg) { ctx.drawImage(boatImg, x, y, 28, 28); x += 37; }
  ctx.fillStyle = '#111';
  ctx.font = `700 20px ${FONT_STACK}`;
  ctx.textAlign = 'left';
  ctx.fillText('ALPAS PINAS — Boat Lineup', x, y + 21);
  y += titleH + 2;

  // Meta lines.
  ctx.font = `13px ${FONT_STACK}`;
  ctx.fillStyle = '#555';
  if (eventTitle) { ctx.fillText(eventTitle, PAD, y + 12); y += metaH; }
  if (dayLabel) { ctx.fillText(dayLabel, PAD, y + 12); y += metaH; }

  // Subtitle (paddle icon + crew line).
  y += 16;
  x = PAD;
  if (paddleImg) { ctx.drawImage(paddleImg, x, y, 20, 20); x += 27; }
  ctx.fillStyle = '#111';
  ctx.font = `700 16px ${FONT_STACK}`;
  ctx.fillText(fit(crewLine, x - PAD > 0 ? innerW - (x - PAD) : innerW), x, y + 16);
  y += 30;

  // Table.
  const numW = 36;
  const sideW = (innerW - numW) / 2;
  const cols = [
    { x: PAD, w: numW },
    { x: PAD + numW, w: sideW },
    { x: PAD + numW + sideW, w: sideW },
  ];
  const border = (cx: number, cw: number) => {
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx + 0.5, y + 0.5, cw, ROW_H);
  };
  const midY = () => y + ROW_H / 2 + 4;

  const fullRow = (label: string) => {
    ctx.fillStyle = '#ecfdf5';
    ctx.fillRect(PAD, y, innerW, ROW_H);
    border(PAD, innerW);
    ctx.fillStyle = '#111';
    ctx.font = `700 13px ${FONT_STACK}`;
    ctx.textAlign = 'left';
    ctx.fillText(fit(label, innerW - 20), PAD + 10, midY());
    y += ROW_H;
  };

  fullRow(`Drummer — ${boat.seats['DRUMMER'] ?? '—'}`);

  // Header.
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(PAD, y, innerW, ROW_H);
  cols.forEach((col) => border(col.x, col.w));
  ctx.fillStyle = '#475569';
  ctx.font = `700 11px ${FONT_STACK}`;
  ctx.textAlign = 'center';
  ctx.fillText('#', cols[0].x + cols[0].w / 2, midY());
  ctx.fillText('LEFT', cols[1].x + cols[1].w / 2, midY());
  ctx.fillText('RIGHT', cols[2].x + cols[2].w / 2, midY());
  y += ROW_H;

  // Rows.
  for (let i = 1; i <= ROWS; i++) {
    cols.forEach((col) => border(col.x, col.w));
    ctx.fillStyle = '#94a3b8';
    ctx.font = `700 13px ${FONT_STACK}`;
    ctx.textAlign = 'center';
    ctx.fillText(String(i), cols[0].x + cols[0].w / 2, midY());

    ctx.textAlign = 'left';
    ctx.font = `13px ${FONT_STACK}`;
    const l = boat.seats[`${i}L`];
    const r = boat.seats[`${i}R`];
    ctx.fillStyle = l ? '#111' : '#cbd5e1';
    ctx.fillText(fit(l ?? '—', sideW - 18), cols[1].x + 10, midY());
    ctx.fillStyle = r ? '#111' : '#cbd5e1';
    ctx.fillText(fit(r ?? '—', sideW - 18), cols[2].x + 10, midY());
    y += ROW_H;
  }

  fullRow(`Steers — ${boat.seats['STEERS'] ?? '—'}`);

  // Bench.
  if (benchLines.length) {
    y += 14;
    ctx.fillStyle = '#334155';
    ctx.font = `13px ${FONT_STACK}`;
    ctx.textAlign = 'left';
    for (const line of benchLines) { ctx.fillText(line, PAD, y + 12); y += 18; }
  }

  return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
};

/** The printable boat sheet as React — a white "paper" card (fixed light colors,
 *  system fonts) so it reads the same in the preview, the copied image, and the
 *  printout, regardless of the app's dark/light theme. */
const LineupSheet = React.forwardRef<
  HTMLDivElement,
  { boat: Boat; eventTitle: string; dayLabel: string; bench: string[]; boatIcon?: string; paddleIcon?: string }
>(({ boat, eventTitle, dayLabel, bench, boatIcon, paddleIcon }, ref) => {
  const presetLabel = CREW_PRESETS.find((p) => p.id === (boat.preset ?? 'open'))?.label ?? 'Open';
  const cell: React.CSSProperties = { border: '1px solid #cbd5e1', padding: '7px 10px', fontSize: 13, textAlign: 'center' };
  const th: React.CSSProperties = { ...cell, background: '#f1f5f9', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#475569' };
  const full: React.CSSProperties = { ...cell, textAlign: 'left', background: '#ecfdf5', fontWeight: 700 };
  const seat = (name?: string): React.CSSProperties => ({ ...cell, textAlign: 'left', color: name ? '#111' : '#cbd5e1' });

  return (
    <div
      ref={ref}
      style={{ width: 440, boxSizing: 'border-box', padding: 28, background: '#fff', color: '#111', fontFamily: '-apple-system, "Segoe UI", Roboto, sans-serif' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 20, fontWeight: 700, letterSpacing: '0.04em', margin: '0 0 2px' }}>
        {boatIcon ? <img src={boatIcon} alt="" width={28} height={28} style={{ display: 'block' }} /> : <span>🐉</span>}
        <span>ALPAS PINAS — Boat Lineup</span>
      </div>
      {eventTitle && <div style={{ color: '#555', fontSize: 13, margin: '0 0 2px' }}>{eventTitle}</div>}
      {dayLabel && <div style={{ color: '#555', fontSize: 13, margin: '0 0 2px' }}>{dayLabel}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 16, fontWeight: 700, margin: '16px 0 10px' }}>
        {paddleIcon ? <img src={paddleIcon} alt="" width={20} height={20} style={{ display: 'block' }} /> : <span>⛵</span>}
        <span>{boat.name === presetLabel ? presetLabel : `${boat.name} · ${presetLabel}`}</span>
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          <tr><td colSpan={3} style={full}>Drummer — {boat.seats['DRUMMER'] ?? '—'}</td></tr>
          <tr><th style={{ ...th, width: 32 }}>#</th><th style={th}>Left</th><th style={th}>Right</th></tr>
          {Array.from({ length: ROWS }, (_, i) => {
            const n = i + 1;
            const l = boat.seats[`${n}L`];
            const r = boat.seats[`${n}R`];
            return (
              <tr key={n}>
                <td style={{ ...cell, width: 32, color: '#94a3b8', fontWeight: 700 }}>{n}</td>
                <td style={seat(l)}>{l ?? '—'}</td>
                <td style={seat(r)}>{r ?? '—'}</td>
              </tr>
            );
          })}
          <tr><td colSpan={3} style={full}>Steers — {boat.seats['STEERS'] ?? '—'}</td></tr>
        </tbody>
      </table>
      {bench.length > 0 && (
        <p style={{ fontSize: 13, color: '#334155', margin: '14px 0 0' }}>
          <strong>Not seated:</strong> {bench.join(', ')}
        </p>
      )}
    </div>
  );
});
LineupSheet.displayName = 'LineupSheet';

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]!));

/** Open a print-friendly window with the boat laid out as a grid and print it. */
const printLineup = (
  boat: Boat,
  eventTitle: string,
  dayLabel: string,
  bench: string[],
): void => {
  const presetLabel = CREW_PRESETS.find((p) => p.id === (boat.preset ?? 'open'))?.label ?? 'Open';
  const origin = window.location.origin;
  const cell = (name?: string) =>
    name
      ? `<td class="seat">${escapeHtml(name)}</td>`
      : `<td class="seat empty">—</td>`;

  const rows = Array.from({ length: ROWS }, (_, i) => {
    const n = i + 1;
    return `<tr><td class="num">${n}</td>${cell(boat.seats[`${n}L`])}${cell(boat.seats[`${n}R`])}</tr>`;
  }).join('');

  const benchHtml = bench.length
    ? `<p class="bench"><strong>Not seated:</strong> ${escapeHtml(bench.join(', '))}</p>`
    : '';

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(boat.name)} — Lineup</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #111; margin: 32px; }
  h1 { font-size: 20px; margin: 0 0 2px; letter-spacing: 0.04em; display: flex; align-items: center; gap: 9px; }
  .meta { color: #555; font-size: 13px; margin: 0 0 2px; }
  h2 { font-size: 16px; margin: 16px 0 10px; display: flex; align-items: center; gap: 7px; }
  h1 img { width: 28px; height: 28px; }
  h2 img { width: 20px; height: 20px; }
  table { border-collapse: collapse; width: 100%; max-width: 460px; }
  td, th { border: 1px solid #cbd5e1; padding: 7px 10px; font-size: 13px; text-align: center; }
  th { background: #f1f5f9; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #475569; }
  .num { width: 32px; color: #94a3b8; font-weight: 700; }
  .seat { text-align: left; }
  .seat.empty { color: #cbd5e1; }
  .full { background: #ecfdf5; font-weight: 700; text-align: left; }
  .bench { font-size: 13px; color: #334155; margin-top: 14px; max-width: 460px; }
  @page { margin: 16mm; }
</style></head><body>
  <h1><img src="${origin}${SHEET_ICONS.boat}" alt="">ALPAS PINAS — Boat Lineup</h1>
  ${eventTitle ? `<p class="meta">${escapeHtml(eventTitle)}</p>` : ''}
  ${dayLabel ? `<p class="meta">${escapeHtml(dayLabel)}</p>` : ''}
  <h2><img src="${origin}${SHEET_ICONS.paddle}" alt="">${escapeHtml(boat.name === presetLabel ? presetLabel : `${boat.name} · ${presetLabel}`)}</h2>
  <table>
    <tr><td class="full" colspan="3">Drummer — ${escapeHtml(boat.seats['DRUMMER'] ?? '—')}</td></tr>
    <tr><th>#</th><th>Left</th><th>Right</th></tr>
    ${rows}
    <tr><td class="full" colspan="3">Steers — ${escapeHtml(boat.seats['STEERS'] ?? '—')}</td></tr>
  </table>
  ${benchHtml}
  <script>window.onload = function () { window.print(); };</script>
</body></html>`;

  const win = window.open('', '_blank', 'width=520,height=720');
  if (!win) return;
  win.document.write(html);
  win.document.close();
};

const ExportSheet: React.FC<{
  boat: Boat;
  eventTitle: string;
  dayLabel: string;
  bench: string[];
  c: ColorPalette;
  isMobile: boolean;
  showToast: ShowToast;
  onClose: () => void;
}> = ({ boat, eventTitle, dayLabel, bench, c, isMobile, showToast, onClose }) => {
  const [copied, setCopied] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  // The sheet renders at a fixed 440px (so the copied image is always crisp and
  // consistent); scale it DOWN to fit the modal for display only. offsetWidth/
  // Height — and therefore the PNG capture — are unaffected by the CSS transform.
  const SHEET_W = 440;
  const [scale, setScale] = useState(1);
  const [sheetH, setSheetH] = useState(0);
  const [icons, setIcons] = useState<{ boat?: string; paddle?: string }>({});

  // Inline the brand icons so they survive the copy-image serialization.
  useEffect(() => {
    let alive = true;
    Promise.all([loadDataUrl(SHEET_ICONS.boat), loadDataUrl(SHEET_ICONS.paddle)])
      .then(([boat, paddle]) => { if (alive) setIcons({ boat, paddle }); })
      .catch(() => { /* fall back to emoji */ });
    return () => { alive = false; };
  }, []);

  useLayoutEffect(() => {
    const measure = () => {
      if (sheetRef.current) setSheetH(sheetRef.current.offsetHeight);
      const el = previewRef.current;
      if (el) {
        const cs = getComputedStyle(el);
        const avail = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        setScale(Math.min(1, avail / SHEET_W));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (previewRef.current) ro.observe(previewRef.current);
    return () => ro.disconnect();
  }, [boat, eventTitle, dayLabel, bench, icons]);

  const copyImage = async () => {
    try {
      if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
        throw new Error('clipboard image not supported');
      }
      // Pass a Promise<Blob> so Safari keeps the write inside the user gesture
      // while the PNG renders asynchronously.
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': lineupToPngBlob(boat, eventTitle, dayLabel, bench, icons).then((b) => {
            if (!b) throw new Error('render failed');
            return b;
          }),
        }),
      ]);
      setCopied(true);
      showToast('Lineup image copied — paste it into your chat.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Could not copy image. Use Print / Save as PDF instead.', 'error');
    }
  };

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 401,
        maxHeight: '82vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: c.surface,
        borderTop: `1px solid ${c.border}`,
        borderTopLeftRadius: '1rem',
        borderTopRightRadius: '1rem',
        boxShadow: '0 -12px 32px rgba(0,0,0,0.35)',
        animation: 'alpas-sheet-up 220ms cubic-bezier(0.22,1,0.36,1)',
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 401,
        width: 'min(480px, calc(100vw - 3rem))',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: '1rem',
        boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        animation: 'alpas-modal-in 180ms cubic-bezier(0.22,1,0.36,1)',
      };

  return (
    <>
      <style>{`
        @keyframes alpas-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes alpas-modal-in { from { opacity: 0; transform: translate(-50%, -46%); } to { opacity: 1; transform: translate(-50%, -50%); } }
      `}</style>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 400, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
      />
      <div style={panelStyle}>
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0 0.25rem' }}>
            <div style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: c.border }} />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: `${isMobile ? '0.5rem' : '1.1rem'} 1.25rem 0.75rem` }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: c.text }}>Share / Export</div>
            <div style={{ fontSize: '0.78rem', color: c.textSecondary }}>{boat.name} lineup</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'transparent', border: `1px solid ${c.border}`, color: c.textSecondary, width: 30, height: 30, borderRadius: 999, cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit', flexShrink: 0 }}
          >
            ×
          </button>
        </div>

        <div ref={previewRef} style={{ overflow: 'auto', padding: '0.6rem 0.75rem 0.85rem', display: 'flex', justifyContent: 'center', backgroundColor: c.background }}>
          {/* Placeholder sized to the SCALED sheet so it lays out tightly; the inner
              wrapper holds the full-size sheet and shrinks it via transform. */}
          <div style={{ width: SHEET_W * scale, height: sheetH ? sheetH * scale : undefined, flexShrink: 0 }}>
            <div style={{ width: SHEET_W, transform: `scale(${scale})`, transformOrigin: 'top left', boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
              <LineupSheet ref={sheetRef} boat={boat} eventTitle={eventTitle} dayLabel={dayLabel} bench={bench} boatIcon={icons.boat} paddleIcon={icons.paddle} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', padding: '0.75rem 1.25rem 1.25rem', borderTop: `1px solid ${c.border}`, marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={copyImage}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              padding: '0.7rem 1rem',
              borderRadius: '0.55rem',
              border: 'none',
              background: c.primary,
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {copied ? <Check size={16} /> : <ImageIcon size={16} />} {copied ? 'Copied' : 'Copy image'}
          </button>
          <button
            type="button"
            onClick={() => printLineup(boat, eventTitle, dayLabel, bench)}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              padding: '0.7rem 1rem',
              borderRadius: '0.55rem',
              border: `1px solid ${c.border}`,
              background: 'transparent',
              color: c.text,
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ */

const BoatGrid: React.FC<{
  boat: Boat;
  selected: string | null;
  selectedSide?: SideRole;
  infoByName: Map<string, AthleteInfo>;
  dragOverSeat: SeatId | null;
  onSeatClick: (seatId: SeatId) => void;
  onSeatDrop: (seatId: SeatId) => (e: React.DragEvent) => void;
  onSeatDragOver: (seatId: SeatId) => void;
  onSeatDragLeave: () => void;
  onSeatDragStart: (e: React.DragEvent, name: string, fromSeat: SeatId) => void;
  c: ColorPalette;
  fluid?: boolean;
}> = ({ boat, selected, selectedSide, infoByName, dragOverSeat, onSeatClick, onSeatDrop, onSeatDragOver, onSeatDragLeave, onSeatDragStart, c, fluid }) => {
  const seatProps = (id: SeatId) => {
    const occupant = boat.seats[id];
    return {
      id,
      boat,
      selected,
      selectedSide,
      occupantSide: infoByName.get(occupant)?.side,
      occupantWeight: infoByName.get(occupant)?.weight,
      occupantOffPreset: !!occupant && !fitsPreset(boat.preset, infoByName.get(occupant)),
      isDragOver: dragOverSeat === id,
      onClick: onSeatClick,
      onDrop: onSeatDrop,
      onDragOver: onSeatDragOver,
      onDragLeave: onSeatDragLeave,
      onSeatDragStart,
      c,
      fluid,
    };
  };

  return (
    <div
      style={{
        display: fluid ? 'flex' : 'inline-flex',
        flexDirection: 'column',
        gap: '0.35rem',
        padding: '1rem',
        backgroundColor: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: '0.85rem',
        // Fluid (mobile): fill the column and never exceed it, so the boat
        // scales down instead of forcing a horizontal scroll.
        ...(fluid ? { width: '100%', maxWidth: '100%', boxSizing: 'border-box' as const } : {}),
      }}
    >
      <div style={{ fontSize: '0.65rem', textAlign: 'center', color: c.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
        ↑ Bow · direction of travel
      </div>

      <SeatBox {...seatProps('DRUMMER')} label="Drummer" full />

      {/* Port / Starboard column headers */}
      <div style={{ display: 'flex', gap: '0.35rem', margin: '0.15rem 0' }}>
        {(['Port', 'Starboard'] as const).map((side) => (
          <div key={side} style={{ ...(fluid ? { flex: 1, minWidth: 0 } : { width: '96px' }), textAlign: 'center', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.textSecondary }}>
            {side}
          </div>
        ))}
      </div>

      {Array.from({ length: ROWS }, (_, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.35rem' }}>
          <SeatBox {...seatProps(`${i + 1}L`)} label={`${i + 1}L`} />
          <SeatBox {...seatProps(`${i + 1}R`)} label={`${i + 1}R`} />
        </div>
      ))}

      <SeatBox {...seatProps('STEERS')} label="Steers" full />

      <div style={{ fontSize: '0.6rem', textAlign: 'center', color: c.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.1rem' }}>
        Stern
      </div>
    </div>
  );
};

const SeatBox: React.FC<{
  id: SeatId;
  label: string;
  boat: Boat;
  selected: string | null;
  selectedSide?: SideRole;
  occupantSide?: SideRole;
  occupantWeight?: number;
  occupantOffPreset?: boolean;
  isDragOver: boolean;
  onClick: (id: SeatId) => void;
  onDrop: (id: SeatId) => (e: React.DragEvent) => void;
  onDragOver: (id: SeatId) => void;
  onDragLeave: () => void;
  onSeatDragStart: (e: React.DragEvent, name: string, fromSeat: SeatId) => void;
  c: ColorPalette;
  full?: boolean;
  fluid?: boolean;
}> = ({ id, label, boat, selected, selectedSide, occupantSide, occupantWeight, occupantOffPreset, isDragOver, onClick, onDrop, onDragOver, onDragLeave, onSeatDragStart, c, full, fluid }) => {
  const occupant = boat.seats[id];
  const isEmpty = !occupant;
  const canPlace = !!selected && isEmpty;

  const offSide = isOffSide(id, occupantSide);
  // A seated occupant is flagged (amber) if they're on the wrong side OR don't
  // match the boat's crew preset.
  const warned = offSide || !!occupantOffPreset;
  // Would the currently-selected bench athlete be off-side if dropped here?
  const placeOffSide = canPlace && isOffSide(id, selectedSide);

  const amber = '#f59e0b';

  let bg = c.surfaceAlt;
  let border = `1px dashed ${c.border}`;
  let textColor = c.textSecondary;

  if (occupant) {
    bg = warned ? `${amber}1f` : '#16a34a18';
    border = warned ? `1px solid ${amber}` : '1px solid #16a34a55';
    textColor = warned ? amber : '#16a34a';
  } else if (isDragOver) {
    bg = `${c.primary}33`;
    border = `2px solid ${c.primary}`;
  } else if (canPlace) {
    bg = placeOffSide ? `${amber}1f` : `${c.primary}18`;
    border = placeOffSide ? `1px dashed ${amber}` : `1px solid ${c.primary}66`;
  }

  const warnReason = [
    offSide ? `off-side (prefers ${sideLabel(occupantSide)})` : '',
    occupantOffPreset ? 'off-preset for this crew' : '',
  ].filter(Boolean).join(', ');
  const title = occupant
    ? `${occupant}${warnReason ? ` — ${warnReason}` : ''} · click or drag to move`
    : selected
    ? `Place ${selected} here${placeOffSide ? ' (off-side)' : ''}`
    : label;

  return (
    <button
      type="button"
      draggable={!!occupant}
      onDragStart={(e) => occupant && onSeatDragStart(e, occupant, id)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(id); }}
      onDragLeave={onDragLeave}
      onDrop={onDrop(id)}
      onClick={() => onClick(id)}
      title={title}
      style={{
        position: 'relative',
        // Paddler seats: fixed 96px on desktop; on mobile flex to split the
        // row evenly so the grid fits the viewport without horizontal scroll.
        ...(full
          ? { width: '100%' }
          : fluid
          ? { flex: 1, minWidth: 0 }
          : { width: '96px' }),
        minHeight: '46px',
        padding: '0.3rem 0.45rem',
        borderRadius: '0.45rem',
        border,
        backgroundColor: bg,
        color: textColor,
        fontSize: '0.72rem',
        fontWeight: occupant ? 600 : 400,
        cursor: occupant ? 'grab' : 'pointer',
        fontFamily: 'inherit',
        textAlign: 'center',
        transition: 'background-color 0.1s, border-color 0.1s',
        overflow: 'hidden',
      }}
    >
      {warned && (
        <AlertTriangle
          size={11}
          color={amber}
          style={{ position: 'absolute', top: 3, right: 3 }}
        />
      )}
      {occupant ? (
        <>
          <div style={{ fontSize: '0.65rem', color: c.textSecondary, marginBottom: '0.1rem' }}>
            {label}{occupantWeight != null ? ` (${occupantWeight}kg)` : ''}
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.2, wordBreak: 'break-word' }}>
            {occupant.split(' ')[0]}
          </div>
        </>
      ) : (
        <div style={{ color: canPlace ? (placeOffSide ? amber : c.primary) : c.textSecondary }}>{label}</div>
      )}
    </button>
  );
};

/* ------------------------------------------------------------------ */
/* Weight balance + trim                                               */

const BalancePanel: React.FC<{
  boat: Boat;
  infoByName: Map<string, AthleteInfo>;
  c: ColorPalette;
  fullWidth?: boolean;
}> = ({ boat, infoByName, c, fullWidth }) => {
  const stats = useMemo(() => {
    let left = 0, right = 0, bow = 0, stern = 0, paddlers = 0, total = 0, missing = 0;
    let males = 0, females = 0, offPreset = 0;
    for (const [seatId, name] of Object.entries(boat.seats)) {
      const info = infoByName.get(name);
      const w = info?.weight ?? 0;
      if (!info || !info.weight) missing++;
      if (info?.gender === 'Male') males++;
      else if (info?.gender === 'Female') females++;
      if (!fitsPreset(boat.preset, info)) offPreset++;
      total += w;
      if (!isPaddlerSeat(seatId)) continue;
      paddlers++;
      const rowNum = parseInt(seatId, 10);
      if (seatId.endsWith('L')) left += w;
      else if (seatId.endsWith('R')) right += w;
      if (rowNum <= ROWS / 2) bow += w; else stern += w;
    }
    return { left, right, bow, stern, paddlers, total, missing, males, females, offPreset };
  }, [boat.seats, boat.preset, infoByName]);

  const presetLabel = CREW_PRESETS.find((p) => p.id === (boat.preset ?? 'open'))?.label ?? 'Open';

  const sideDelta = Math.abs(stats.left - stats.right);
  const trimDelta = Math.abs(stats.bow - stats.stern);

  return (
    <div
      style={{
        width: fullWidth ? '100%' : 'min(260px, 100%)',
        boxSizing: 'border-box',
        flexShrink: 0,
        backgroundColor: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: '0.85rem',
        padding: '1rem',
        ...(fullWidth ? {} : { position: 'sticky' as const, top: '1rem', alignSelf: 'flex-start' }),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.textSecondary, marginBottom: '0.85rem' }}>
        <Scale size={13} /> Trim &amp; balance
      </div>

      <BalanceBar label="Port / Starboard" aLabel="L" bLabel="R" a={stats.left} b={stats.right} c={c} />
      <DeltaLine delta={sideDelta} unit="kg side-to-side" c={c} good={sideDelta <= 10} />

      <div style={{ height: '0.85rem' }} />

      <BalanceBar label="Bow / Stern" aLabel="Bow" bLabel="Stern" a={stats.bow} b={stats.stern} c={c} />
      <DeltaLine delta={trimDelta} unit="kg bow-to-stern" c={c} good={trimDelta <= 20} />

      <div style={{ borderTop: `1px solid ${c.border}`, marginTop: '0.95rem', paddingTop: '0.7rem', fontSize: '0.78rem', color: c.textSecondary, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <Row k="Crew" v={presetLabel} c={c} />
        <Row k="Paddlers" v={`${stats.paddlers} / ${ROWS * 2}`} c={c} />
        <Row k="Gender" v={`${stats.males}M · ${stats.females}F`} c={c} />
        <Row k="Total weight" v={`${stats.total} kg`} c={c} />
        {stats.paddlers > 0 && (
          <Row k="Avg paddler" v={`${Math.round((stats.left + stats.right) / stats.paddlers)} kg`} c={c} />
        )}
        {stats.offPreset > 0 && (
          <div style={{ color: '#f59e0b', fontSize: '0.72rem', marginTop: '0.2rem' }}>
            {stats.offPreset} off-preset for {presetLabel}
          </div>
        )}
        {stats.missing > 0 && (
          <div style={{ color: '#f59e0b', fontSize: '0.72rem', marginTop: '0.2rem' }}>
            {stats.missing} seated without a weight on file
          </div>
        )}
      </div>
    </div>
  );
};

const BalanceBar: React.FC<{ label: string; aLabel: string; bLabel: string; a: number; b: number; c: ColorPalette }> = ({ label, aLabel, bLabel, a, b, c }) => {
  const total = a + b;
  const aPct = total > 0 ? (a / total) * 100 : 50;
  return (
    <div>
      <div style={{ fontSize: '0.72rem', color: c.textSecondary, marginBottom: '0.3rem' }}>{label}</div>
      <div style={{ display: 'flex', height: '0.85rem', borderRadius: '999px', overflow: 'hidden', border: `1px solid ${c.border}`, backgroundColor: c.surfaceAlt }}>
        <div style={{ width: `${aPct}%`, backgroundColor: c.primary, transition: 'width 0.2s' }} />
        <div style={{ width: `${100 - aPct}%`, backgroundColor: `${c.primary}55`, transition: 'width 0.2s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: c.text, marginTop: '0.2rem', fontWeight: 600 }}>
        <span>{aLabel} {a} kg</span>
        <span>{b} kg {bLabel}</span>
      </div>
    </div>
  );
};

const DeltaLine: React.FC<{ delta: number; unit: string; good: boolean; c: ColorPalette }> = ({ delta, unit, good, c }) => (
  <div style={{ fontSize: '0.7rem', marginTop: '0.25rem', color: delta === 0 ? c.textSecondary : good ? '#16a34a' : '#f59e0b' }}>
    {delta === 0 ? 'Perfectly even' : `Δ ${delta} ${unit}`}
  </div>
);

const Row: React.FC<{ k: string; v: string; c: ColorPalette }> = ({ k, v, c }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <span>{k}</span>
    <span style={{ color: c.text, fontWeight: 600 }}>{v}</span>
  </div>
);

/* ------------------------------------------------------------------ */

const SaveIndicator: React.FC<{ status: SaveStatus; c: ColorPalette }> = ({ status, c }) => {
  if (status === 'idle') return null;
  const map = {
    saving: { text: 'Saving…', color: c.textSecondary },
    saved: { text: 'Saved', color: '#16a34a' },
    error: { text: 'Saved locally only', color: '#f59e0b' },
  } as const;
  const { text, color } = map[status];
  return <span style={{ fontSize: '0.78rem', color, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{text}</span>;
};

/* ------------------------------------------------------------------ */

const sideLabel = (s?: SideRole): string => {
  if (s === 'Left') return 'L';
  if (s === 'Right') return 'R';
  return s ?? '—';
};

const writeDrag = (e: React.DragEvent, data: DragData) => {
  e.dataTransfer.setData(DRAG_MIME, JSON.stringify(data));
  e.dataTransfer.effectAllowed = 'move';
};

const readDrag = (e: React.DragEvent): DragData | null => {
  try {
    const raw = e.dataTransfer.getData(DRAG_MIME);
    return raw ? (JSON.parse(raw) as DragData) : null;
  } catch {
    return null;
  }
};

const selectStyle = (c: ColorPalette): React.CSSProperties => ({
  padding: '0.5rem 0.85rem',
  borderRadius: '0.5rem',
  border: `1px solid ${c.border}`,
  backgroundColor: c.surface,
  color: c.text,
  fontSize: '0.88rem',
  fontFamily: 'inherit',
  outline: 'none',
  cursor: 'pointer',
});
