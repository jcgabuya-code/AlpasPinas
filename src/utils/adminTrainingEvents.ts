/**
 * Training-events admin store — seeded from training.json, persisted in
 * localStorage so both the public Training page and the admin panel read
 * the same source of truth.
 */

import defaultEvents from '../data/training.json';
import { type TrainingEvent } from '../components/TrainingCard';

const STORAGE_KEY = 'alpas-training-events-v1';
const CHANGE_EVENT = 'alpas-training-events-changed';

const seed = () => {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultEvents));
  }
};

export const getTrainingEvents = (): TrainingEvent[] => {
  if (typeof window === 'undefined') return defaultEvents as TrainingEvent[];
  try {
    seed();
    return JSON.parse(localStorage.getItem(STORAGE_KEY)!) as TrainingEvent[];
  } catch {
    return defaultEvents as TrainingEvent[];
  }
};

const write = (events: TrainingEvent[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export const createTrainingEvent = (ev: TrainingEvent) => {
  write([...getTrainingEvents(), ev]);
};

export const updateTrainingEvent = (id: string, updates: Partial<TrainingEvent>) => {
  write(getTrainingEvents().map((ev) => (ev.id === id ? { ...ev, ...updates } : ev)));
};

export const deleteTrainingEvent = (id: string) => {
  write(getTrainingEvents().filter((ev) => ev.id !== id));
};

export const subscribeTrainingEvents = (handler: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
};
