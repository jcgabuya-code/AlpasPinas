import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { type ColorPalette } from '../../styles/colors';
import { type ShowToast } from '../Admin';
import { fetchBookings, type Booking } from '../../utils/bookings';
import { getTrainingEvents } from '../../utils/adminTrainingEvents';

/* ------------------------------------------------------------------ */

type SeatId = 'DRUMMER' | 'STEERS' | string; // `${row}L` | `${row}R`

type Boat = {
  id: string;
  name: string;
  seats: Record<SeatId, string>; // seatId → athlete name
};

const ROWS = 10;

const STORAGE_KEY = 'alpas-boat-plans-v1';

type StoredPlan = { eventId: string; dayKey: string; boats: Boat[] };

const loadPlan = (eventId: string, dayKey: string): Boat[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [emptyBoat('A')];
    const plans: StoredPlan[] = JSON.parse(raw);
    const found = plans.find((p) => p.eventId === eventId && p.dayKey === dayKey);
    return found ? found.boats : [emptyBoat('A')];
  } catch {
    return [emptyBoat('A')];
  }
};

const savePlan = (eventId: string, dayKey: string, boats: Boat[]) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const plans: StoredPlan[] = raw ? JSON.parse(raw) : [];
    const idx = plans.findIndex((p) => p.eventId === eventId && p.dayKey === dayKey);
    if (idx >= 0) plans[idx].boats = boats;
    else plans.push({ eventId, dayKey, boats });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch {}
};

const emptyBoat = (suffix: string): Boat => ({
  id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
  name: `Boat ${suffix}`,
  seats: {},
});

const BOAT_NAMES = ['A', 'B', 'C', 'D', 'E'];

/* ------------------------------------------------------------------ */

type Props = { showToast: ShowToast; c: ColorPalette; theme: 'dark' | 'light' };

export const AdminBoats: React.FC<Props> = ({ c, showToast }) => {
  const events = getTrainingEvents();
  const [eventId, setEventId] = useState(events[0]?.id ?? '');
  const [dayKey, setDayKey] = useState(events[0]?.days[0]?.key ?? '');
  const [boats, setBoats] = useState<Boat[]>([]);
  const [activeBoatId, setActiveBoatId] = useState('');
  const [selected, setSelected] = useState<string | null>(null); // selected bench athlete
  const [allBookings, setAllBookings] = useState<Booking[]>([]);

  // Load bookings
  useEffect(() => {
    fetchBookings().then(setAllBookings);
  }, []);

  // Load plan when event/day changes
  useEffect(() => {
    if (!eventId || !dayKey) return;
    const plan = loadPlan(eventId, dayKey);
    setBoats(plan);
    setActiveBoatId(plan[0]?.id ?? '');
    setSelected(null);
  }, [eventId, dayKey]);

  const persist = (updated: Boat[]) => {
    setBoats(updated);
    savePlan(eventId, dayKey, updated);
  };

  // Athletes for this event+day (any status)
  const athletes = allBookings.filter(
    (b) => b.eventId === eventId && (b.attending === 'both' || b.attending === dayKey),
  );

  // All assigned athletes across all boats
  const assignedNames = new Set(boats.flatMap((b) => Object.values(b.seats)));

  const unassigned = athletes.filter((b) => !assignedNames.has(b.name));

  const activeBoat = boats.find((b) => b.id === activeBoatId);

  const handleSeatClick = (seatId: SeatId) => {
    if (!activeBoat) return;
    const occupant = activeBoat.seats[seatId];

    if (selected) {
      // Place selected athlete in this seat
      const updated = boats.map((boat) => {
        if (boat.id !== activeBoatId) return boat;
        const newSeats = { ...boat.seats };
        // Remove selected athlete from any seat they were in (within this boat)
        Object.keys(newSeats).forEach((k) => {
          if (newSeats[k] === selected) delete newSeats[k];
        });
        if (occupant) {
          // If seat was occupied, just clear it (occupant goes back to bench)
        }
        newSeats[seatId] = selected;
        return { ...boat, seats: newSeats };
      });
      persist(updated);
      setSelected(null);
    } else if (occupant) {
      // Click occupied seat with nothing selected → remove from seat
      const updated = boats.map((boat) => {
        if (boat.id !== activeBoatId) return boat;
        const newSeats = { ...boat.seats };
        delete newSeats[seatId];
        return { ...boat, seats: newSeats };
      });
      persist(updated);
    }
  };

  const handleBenchClick = (name: string) => {
    setSelected((prev) => (prev === name ? null : name));
  };

  const addBoat = () => {
    if (boats.length >= 5) { showToast('Maximum 5 boats.', 'error'); return; }
    const suffix = BOAT_NAMES[boats.length] ?? String(boats.length + 1);
    const newBoat = emptyBoat(suffix);
    const updated = [...boats, newBoat];
    persist(updated);
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

  const currentEvent = events.find((e) => e.id === eventId);

  return (
    <div style={{ padding: '2rem 1.5rem 4rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: c.text, margin: '0 0 0.4rem', letterSpacing: '0.02em', lineHeight: 1 }}>
        BOAT ASSIGNMENTS
      </h1>
      <p style={{ color: c.textSecondary, fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
        Assign athletes to boat seats. Changes auto-save.
      </p>

      {/* Event + Day selectors */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
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
      </div>

      {!eventId || !dayKey ? (
        <p style={{ color: c.textSecondary }}>Select an event and day above.</p>
      ) : (
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Bench */}
          <div
            style={{
              width: 'min(220px, 100%)',
              flexShrink: 0,
              backgroundColor: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: '0.85rem',
              padding: '1rem',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.textSecondary, marginBottom: '0.75rem' }}>
              Bench ({unassigned.length})
            </div>
            {athletes.length === 0 && (
              <p style={{ fontSize: '0.8rem', color: c.textSecondary }}>No sign-ups for this day.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {athletes.map((b) => {
                const isAssigned = assignedNames.has(b.name);
                const isSel = selected === b.name;
                return (
                  <button
                    key={b.name}
                    type="button"
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
                      cursor: isAssigned ? 'default' : 'pointer',
                      fontFamily: 'inherit',
                      opacity: isAssigned ? 0.5 : 1,
                      transition: 'background-color 0.1s, border-color 0.1s',
                    }}
                  >
                    <div>{b.name}</div>
                    <div style={{ fontSize: '0.68rem', color: c.textSecondary }}>{b.side} · {b.weight}kg</div>
                  </button>
                );
              })}
            </div>
            {selected && (
              <button
                type="button"
                onClick={() => setSelected(null)}
                style={{ marginTop: '0.75rem', width: '100%', padding: '0.4rem', borderRadius: '0.45rem', border: `1px solid ${c.border}`, background: 'transparent', color: c.textSecondary, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Deselect
              </button>
            )}
          </div>

          {/* Boat area */}
          <div style={{ flex: 1, minWidth: 0 }}>
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

            {/* Rename input */}
            {activeBoat && (
              <input
                value={activeBoat.name}
                onChange={(e) => renameBoat(activeBoat.id, e.target.value)}
                placeholder="Boat name"
                style={{ ...selectStyle(c), marginBottom: '1rem', maxWidth: '200px' }}
              />
            )}

            {/* Boat grid */}
            {activeBoat && (
              <BoatGrid boat={activeBoat} selected={selected} onSeatClick={handleSeatClick} c={c} />
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
    </div>
  );
};

/* ------------------------------------------------------------------ */

const BoatGrid: React.FC<{
  boat: Boat;
  selected: string | null;
  onSeatClick: (seatId: SeatId) => void;
  c: ColorPalette;
}> = ({ boat, selected, onSeatClick, c }) => {
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
      {/* Direction label */}
      <div style={{ fontSize: '0.65rem', textAlign: 'center', color: c.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
        ↑ Direction of travel
      </div>

      {/* Drummer */}
      <SeatBox id="DRUMMER" label="Drummer" boat={boat} selected={selected} onClick={onSeatClick} c={c} full />

      {/* Paddler rows */}
      {Array.from({ length: ROWS }, (_, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.35rem' }}>
          <SeatBox id={`${i + 1}L`} label={`${i + 1}L`} boat={boat} selected={selected} onClick={onSeatClick} c={c} />
          <SeatBox id={`${i + 1}R`} label={`${i + 1}R`} boat={boat} selected={selected} onClick={onSeatClick} c={c} />
        </div>
      ))}

      {/* Steers */}
      <SeatBox id="STEERS" label="Steers" boat={boat} selected={selected} onClick={onSeatClick} c={c} full />
    </div>
  );
};

const SeatBox: React.FC<{
  id: SeatId;
  label: string;
  boat: Boat;
  selected: string | null;
  onClick: (id: SeatId) => void;
  c: ColorPalette;
  full?: boolean;
}> = ({ id, label, boat, selected, onClick, c, full }) => {
  const occupant = boat.seats[id];
  const isEmpty = !occupant;
  const canPlace = !!selected && isEmpty;

  const bg = occupant
    ? '#16a34a18'
    : canPlace
    ? `${c.primary}18`
    : c.surfaceAlt;

  const border = occupant
    ? '1px solid #16a34a55'
    : canPlace
    ? `1px solid ${c.primary}66`
    : `1px dashed ${c.border}`;

  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      title={occupant ? `${occupant} — click to remove` : selected ? `Place ${selected} here` : label}
      style={{
        width: full ? '100%' : '90px',
        minHeight: '44px',
        padding: '0.3rem 0.45rem',
        borderRadius: '0.45rem',
        border,
        backgroundColor: bg,
        color: occupant ? '#16a34a' : c.textSecondary,
        fontSize: '0.72rem',
        fontWeight: occupant ? 600 : 400,
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'center',
        transition: 'background-color 0.1s, border-color 0.1s',
        overflow: 'hidden',
      }}
    >
      {occupant ? (
        <>
          <div style={{ fontSize: '0.65rem', color: c.textSecondary, marginBottom: '0.1rem' }}>{label}</div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.2, wordBreak: 'break-word' }}>
            {occupant.split(' ')[0]}
          </div>
        </>
      ) : (
        <div style={{ color: canPlace ? c.primary : c.textSecondary }}>{label}</div>
      )}
    </button>
  );
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
