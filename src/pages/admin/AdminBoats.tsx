import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, AlertTriangle, Scale, Wand2, ChevronDown, ChevronRight } from 'lucide-react';
import { emeraldGradient, type ColorPalette } from '../../styles/colors';
import { type ShowToast } from '../Admin';
import { fetchBookings, type Booking, type SideRole } from '../../utils/bookings';
import { getTrainingEvents } from '../../utils/adminTrainingEvents';
import { useIsMobile } from '../../hooks/useIsMobile';
import {
  loadPlan,
  loadPlanCached,
  savePlan,
  emptyBoat,
  type Boat,
  type SeatId,
} from '../../utils/boatPlans';

/* ------------------------------------------------------------------ */

const ROWS = 10;
const BOAT_NAMES = ['A', 'B', 'C', 'D', 'E'];

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
  const isMobile = useIsMobile();
  const events = getTrainingEvents();
  const [eventId, setEventId] = useState(events[0]?.id ?? '');
  const [dayKey, setDayKey] = useState(events[0]?.days[0]?.key ?? '');
  const [boats, setBoats] = useState<Boat[]>([]);
  const [activeBoatId, setActiveBoatId] = useState('');
  const [selected, setSelected] = useState<string | null>(null); // selected bench athlete
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [dragOverSeat, setDragOverSeat] = useState<SeatId | null>(null);
  const [pickerSeat, setPickerSeat] = useState<SeatId | null>(null); // mobile seat-picker sheet
  const [benchOpen, setBenchOpen] = useState(false); // mobile: bench collapsed by default
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load bookings once.
  useEffect(() => {
    fetchBookings().then(setAllBookings);
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

  // name → { side, weight } for side-matching + weight balance.
  const infoByName = useMemo(() => {
    const m = new Map<string, { side: SideRole; weight: number }>();
    athletes.forEach((b) => m.set(b.name, { side: b.side, weight: b.weight }));
    return m;
  }, [athletes]);

  // All assigned athletes across all boats.
  const assignedNames = new Set(boats.flatMap((b) => Object.values(b.seats)));
  const unassigned = athletes.filter((b) => !assignedNames.has(b.name));
  const activeBoat = boats.find((b) => b.id === activeBoatId);

  /* ----------------------------- seat ops --------------------------- */

  /** Place `name` into `toSeat` of the active boat; if `fromSeat` is given,
   *  swap with whatever sits in the target (move within the boat). A bench
   *  athlete dropped onto an occupied seat bumps the occupant back to the bench. */
  const placeAthlete = (name: string, fromSeat: SeatId | null, toSeat: SeatId) => {
    if (!activeBoat) return;
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
    // Mobile: open the per-seat picker sheet (no drag, no bench/seat scrolling).
    if (isMobile) {
      setPickerSeat(seatId);
      return;
    }
    if (selected) {
      placeAthlete(selected, null, seatId);
      setSelected(null);
    } else if (activeBoat.seats[seatId]) {
      clearSeat(seatId);
    }
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
    const suffix = BOAT_NAMES[boats.length] ?? String(boats.length + 1);
    const newBoat = emptyBoat(suffix);
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

  /**
   * Seat everyone available to this boat (bench + whoever's already in it, never
   * poaching from other boats) onto their correct side, weight-balanced. Rebuilds
   * the active boat's seating from scratch.
   */
  const autoFillBoat = () => {
    if (!activeBoat) return;

    const takenElsewhere = new Set(
      boats.filter((b) => b.id !== activeBoatId).flatMap((b) => Object.values(b.seats)),
    );
    const pool = athletes.filter((a) => !takenElsewhere.has(a.name));
    if (pool.length === 0) {
      showToast('No available sign-ups to seat.', 'error');
      return;
    }

    const byWeightDesc = (a: Booking, b: Booking) => b.weight - a.weight;
    const lefts = pool.filter((a) => a.side === 'Left').sort(byWeightDesc);
    const rights = pool.filter((a) => a.side === 'Right').sort(byWeightDesc);
    const coxes = pool.filter((a) => a.side === 'Coxswain');
    const coaches = pool.filter((a) => a.side === 'Coach');

    const order = middleOutOrder(ROWS);
    const seats: Record<SeatId, string> = {};
    lefts.forEach((a, i) => { if (i < order.length) seats[`${order[i]}L`] = a.name; });
    rights.forEach((a, i) => { if (i < order.length) seats[`${order[i]}R`] = a.name; });

    // Steers ← a coxswain; Drummer ← a coach (or a spare coxswain).
    const steers = coxes[0];
    if (steers) seats['STEERS'] = steers.name;
    const drummer = coaches[0] ?? coxes[1];
    if (drummer) seats['DRUMMER'] = drummer.name;

    persist(boats.map((b) => (b.id === activeBoatId ? { ...b, seats } : b)));
    setSelected(null);

    const paddlers = Math.min(lefts.length, ROWS) + Math.min(rights.length, ROWS);
    const benched = pool.length - paddlers - (steers ? 1 : 0) - (drummer ? 1 : 0);
    showToast(
      `Seated ${paddlers} paddlers${steers ? ' + steers' : ''}${drummer ? ' + drummer' : ''}, weight-balanced.` +
        (benched > 0 ? ` ${benched} left on the bench.` : ''),
    );
  };

  const currentEvent = events.find((e) => e.id === eventId);

  return (
    <div style={{ padding: '2rem 1.5rem 4rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: c.text, margin: '0 0 0.4rem', letterSpacing: '0.02em', lineHeight: 1 }}>
        BOAT ASSIGNMENTS
      </h1>
      <p style={{ color: c.textSecondary, fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
        {isMobile
          ? 'Tap a seat to assign or change its paddler, or use Auto-seat to fill the boat instantly. Changes auto-save.'
          : 'Drag athletes from the bench onto seats — or tap one, then tap a seat. Changes auto-save.'}
      </p>

      {/* Event + Day selectors */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        <select
          value={eventId}
          onChange={(e) => {
            const ev = events.find((x) => x.id === e.target.value);
            setEventId(e.target.value);
            setDayKey(ev?.days[0]?.key ?? '');
          }}
          style={selectStyle(c)}
        >
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>

        {currentEvent && (
          <select value={dayKey} onChange={(e) => setDayKey(e.target.value)} style={selectStyle(c)}>
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
              width: isMobile ? '100%' : 'min(220px, 100%)',
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
            {benchListOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: isMobile ? '0.75rem' : 0, ...(isMobile ? { maxHeight: 220, overflowY: 'auto' as const } : {}) }}>
              {athletes.map((b) => {
                const isAssigned = assignedNames.has(b.name);
                const isSel = selected === b.name;
                return (
                  <button
                    key={b.name}
                    type="button"
                    draggable={!isAssigned}
                    onDragStart={(e) => !isAssigned && writeDrag(e, { name: b.name, fromSeat: null })}
                    onClick={() => !isAssigned && handleBenchClick(b.name)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.7rem',
                      borderRadius: '0.45rem',
                      border: `1px solid ${isSel ? c.primary : c.border}`,
                      backgroundColor: isSel ? `${c.primary}22` : isAssigned ? c.background : c.surfaceAlt,
                      color: isAssigned ? c.textSecondary : c.text,
                      fontSize: '0.82rem',
                      fontWeight: isSel ? 700 : 500,
                      textAlign: 'left',
                      cursor: isAssigned ? 'default' : 'grab',
                      fontFamily: 'inherit',
                      opacity: isAssigned ? 0.5 : 1,
                      transition: 'background-color 0.1s, border-color 0.1s',
                    }}
                  >
                    <div>{b.name}</div>
                    <div style={{ fontSize: '0.68rem', color: c.textSecondary }}>{sideLabel(b.side)} · {b.weight}kg</div>
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

            {/* Rename + auto-seat */}
            {activeBoat && (
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <input
                  value={activeBoat.name}
                  onChange={(e) => renameBoat(activeBoat.id, e.target.value)}
                  placeholder="Boat name"
                  style={{ ...selectStyle(c), maxWidth: '200px' }}
                />
                <button
                  type="button"
                  onClick={autoFillBoat}
                  title="Seat everyone signed up by their side and balance the weight"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 0.95rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: emeraldGradient(theme),
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
                  <Wand2 size={15} /> Auto-seat &amp; balance
                </button>
              </div>
            )}

            {/* Balance summary + grid. On mobile, column-reverse floats the
                Trim & balance table above the boat grid. */}
            {activeBoat && (
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', gap: '1.5rem', flexWrap: isMobile ? 'nowrap' : 'wrap', alignItems: isMobile ? 'stretch' : 'flex-start' }}>
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
                />
                <BalancePanel boat={activeBoat} infoByName={infoByName} c={c} fullWidth={isMobile} />
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

      {isMobile && pickerSeat && activeBoat && (
        <SeatPickerSheet
          seatId={pickerSeat}
          boat={activeBoat}
          candidates={unassigned}
          c={c}
          onPlace={(name) => { placeAthlete(name, null, pickerSeat); setPickerSeat(null); }}
          onRemove={() => { clearSeat(pickerSeat); setPickerSeat(null); }}
          onClose={() => setPickerSeat(null)}
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
  c: ColorPalette;
  onPlace: (name: string) => void;
  onRemove: () => void;
  onClose: () => void;
}> = ({ seatId, boat, candidates, c, onPlace, onRemove, onClose }) => {
  const occupant = boat.seats[seatId];
  // Matching side first, then heaviest first within each group.
  const sorted = [...candidates].sort((a, b) => {
    const aOff = isOffSide(seatId, a.side);
    const bOff = isOffSide(seatId, b.side);
    if (aOff !== bOff) return aOff ? 1 : -1;
    return b.weight - a.weight;
  });

  return (
    <>
      <style>{`@keyframes alpas-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 400, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
      />
      <div
        style={{
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
        }}
      >
        {/* Grab handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0 0.25rem' }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: c.border }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.5rem 1.25rem 0.75rem' }}>
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
                return (
                  <button
                    key={a.name}
                    type="button"
                    onClick={() => onPlace(a.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.6rem',
                      width: '100%',
                      padding: '0.7rem 0.85rem',
                      borderRadius: '0.55rem',
                      border: `1px solid ${off ? '#f59e0b55' : c.border}`,
                      backgroundColor: c.surfaceAlt,
                      color: c.text,
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{a.name}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', color: c.textSecondary, flexShrink: 0 }}>
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

const BoatGrid: React.FC<{
  boat: Boat;
  selected: string | null;
  selectedSide?: SideRole;
  infoByName: Map<string, { side: SideRole; weight: number }>;
  dragOverSeat: SeatId | null;
  onSeatClick: (seatId: SeatId) => void;
  onSeatDrop: (seatId: SeatId) => (e: React.DragEvent) => void;
  onSeatDragOver: (seatId: SeatId) => void;
  onSeatDragLeave: () => void;
  onSeatDragStart: (e: React.DragEvent, name: string, fromSeat: SeatId) => void;
  c: ColorPalette;
}> = ({ boat, selected, selectedSide, infoByName, dragOverSeat, onSeatClick, onSeatDrop, onSeatDragOver, onSeatDragLeave, onSeatDragStart, c }) => {
  const seatProps = (id: SeatId) => ({
    id,
    boat,
    selected,
    selectedSide,
    occupantSide: infoByName.get(boat.seats[id])?.side,
    isDragOver: dragOverSeat === id,
    onClick: onSeatClick,
    onDrop: onSeatDrop,
    onDragOver: onSeatDragOver,
    onDragLeave: onSeatDragLeave,
    onSeatDragStart,
    c,
  });

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: '0.35rem',
        padding: '1rem',
        backgroundColor: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: '0.85rem',
      }}
    >
      <div style={{ fontSize: '0.65rem', textAlign: 'center', color: c.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
        ↑ Direction of travel
      </div>

      <SeatBox {...seatProps('DRUMMER')} label="Drummer" full />

      {Array.from({ length: ROWS }, (_, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.35rem' }}>
          <SeatBox {...seatProps(`${i + 1}L`)} label={`${i + 1}L`} />
          <SeatBox {...seatProps(`${i + 1}R`)} label={`${i + 1}R`} />
        </div>
      ))}

      <SeatBox {...seatProps('STEERS')} label="Steers" full />
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
  isDragOver: boolean;
  onClick: (id: SeatId) => void;
  onDrop: (id: SeatId) => (e: React.DragEvent) => void;
  onDragOver: (id: SeatId) => void;
  onDragLeave: () => void;
  onSeatDragStart: (e: React.DragEvent, name: string, fromSeat: SeatId) => void;
  c: ColorPalette;
  full?: boolean;
}> = ({ id, label, boat, selected, selectedSide, occupantSide, isDragOver, onClick, onDrop, onDragOver, onDragLeave, onSeatDragStart, c, full }) => {
  const occupant = boat.seats[id];
  const isEmpty = !occupant;
  const canPlace = !!selected && isEmpty;

  const offSide = isOffSide(id, occupantSide);
  // Would the currently-selected bench athlete be off-side if dropped here?
  const placeOffSide = canPlace && isOffSide(id, selectedSide);

  const amber = '#f59e0b';

  let bg = c.surfaceAlt;
  let border = `1px dashed ${c.border}`;
  let textColor = c.textSecondary;

  if (occupant) {
    bg = offSide ? `${amber}1f` : '#16a34a18';
    border = offSide ? `1px solid ${amber}` : '1px solid #16a34a55';
    textColor = offSide ? amber : '#16a34a';
  } else if (isDragOver) {
    bg = `${c.primary}33`;
    border = `2px solid ${c.primary}`;
  } else if (canPlace) {
    bg = placeOffSide ? `${amber}1f` : `${c.primary}18`;
    border = placeOffSide ? `1px dashed ${amber}` : `1px solid ${c.primary}66`;
  }

  const title = occupant
    ? `${occupant}${offSide ? ` — off-side (prefers ${sideLabel(occupantSide)})` : ''} · click or drag to move`
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
        width: full ? '100%' : '90px',
        minHeight: '44px',
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
      {offSide && (
        <AlertTriangle
          size={11}
          color={amber}
          style={{ position: 'absolute', top: 3, right: 3 }}
        />
      )}
      {occupant ? (
        <>
          <div style={{ fontSize: '0.65rem', color: c.textSecondary, marginBottom: '0.1rem' }}>{label}</div>
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
  infoByName: Map<string, { side: SideRole; weight: number }>;
  c: ColorPalette;
  fullWidth?: boolean;
}> = ({ boat, infoByName, c, fullWidth }) => {
  const stats = useMemo(() => {
    let left = 0, right = 0, bow = 0, stern = 0, paddlers = 0, total = 0, missing = 0;
    for (const [seatId, name] of Object.entries(boat.seats)) {
      const info = infoByName.get(name);
      const w = info?.weight ?? 0;
      if (!info || !info.weight) missing++;
      total += w;
      if (!isPaddlerSeat(seatId)) continue;
      paddlers++;
      const rowNum = parseInt(seatId, 10);
      if (seatId.endsWith('L')) left += w;
      else if (seatId.endsWith('R')) right += w;
      if (rowNum <= ROWS / 2) bow += w; else stern += w;
    }
    return { left, right, bow, stern, paddlers, total, missing };
  }, [boat.seats, infoByName]);

  const sideDelta = Math.abs(stats.left - stats.right);
  const trimDelta = Math.abs(stats.bow - stats.stern);

  return (
    <div
      style={{
        width: fullWidth ? '100%' : 'min(240px, 100%)',
        boxSizing: 'border-box',
        flexShrink: 0,
        backgroundColor: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: '0.85rem',
        padding: '1rem',
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
        <Row k="Paddlers" v={`${stats.paddlers} / ${ROWS * 2}`} c={c} />
        <Row k="Total weight" v={`${stats.total} kg`} c={c} />
        {stats.paddlers > 0 && (
          <Row k="Avg paddler" v={`${Math.round((stats.left + stats.right) / stats.paddlers)} kg`} c={c} />
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
  return <span style={{ fontSize: '0.78rem', color, fontWeight: 600 }}>{text}</span>;
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
