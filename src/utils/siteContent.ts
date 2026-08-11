import { supabase } from './supabase';

// Admin-editable home page write-ups. Key -> current text, stored in the
// `site_content` table (public read, admin write — see migration
// 20260811000000_site_content.sql). Components fall back to their own
// hardcoded default when a key hasn't loaded yet or was never seeded.
export const CONTENT_KEYS = [
  'hero.intro',
  'about.manifesto',
  'training.intro',
  'training.cta',
  'featuredGear.note',
  'raceRecord.intro',
  'contact.invite',
] as const;

export type ContentKey = (typeof CONTENT_KEYS)[number];

export async function fetchSiteContent(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('site_content').select('key, value');
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
}

export async function updateSiteContent(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('site_content')
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}
