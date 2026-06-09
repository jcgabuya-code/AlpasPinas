/**
 * Race/competition events admin store — seeded from events.json, persisted
 * in localStorage so admin CRUD changes reflect on the public Events page.
 */

import defaultEvents from '../data/events.json';

export type RaceEventResult = {
  rank: number;
  category: string;
  time: string;
  notes: string;
};

export type RaceEvent = {
  id: string;
  name: string;
  location: string;
  date: string;
  type: string;
  description: string;
  thumbnail?: string;
  thumbnailCredit?: string;
  result: RaceEventResult | null;
};

const STORAGE_KEY = 'alpas-race-events-v1';
const CHANGE_EVENT = 'alpas-race-events-changed';

const seed = () => {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultEvents));
  }
};

export const getRaceEvents = (): RaceEvent[] => {
  if (typeof window === 'undefined') return defaultEvents as RaceEvent[];
  try {
    seed();
    return JSON.parse(localStorage.getItem(STORAGE_KEY)!) as RaceEvent[];
  } catch {
    return defaultEvents as RaceEvent[];
  }
};

const write = (events: RaceEvent[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export const createRaceEvent = (ev: RaceEvent) => {
  write([...getRaceEvents(), ev]);
};

export const updateRaceEvent = (id: string, updates: Partial<RaceEvent>) => {
  write(getRaceEvents().map((ev) => (ev.id === id ? { ...ev, ...updates } : ev)));
};

export const deleteRaceEvent = (id: string) => {
  write(getRaceEvents().filter((ev) => ev.id !== id));
};

export const subscribeRaceEvents = (handler: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
};
