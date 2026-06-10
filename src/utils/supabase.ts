/**
 * Supabase client — the single shared connection for the whole app.
 *
 * The browser holds the PUBLIC publishable key (safe to ship: Row-Level
 * Security in the database is what actually guards your data). Both values
 * come from .env.local:
 *
 *   VITE_SUPABASE_URL              https://<project-ref>.supabase.co
 *   VITE_SUPABASE_PUBLISHABLE_KEY  the publishable/public key from Settings → API
 *
 * Import the singleton anywhere:  import { supabase } from './supabase';
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const SUPABASE_PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim();

export const isSupabaseConfigured = SUPABASE_URL.length > 0 && SUPABASE_PUBLISHABLE_KEY.length > 0;

if (!isSupabaseConfigured) {
  // Surfaced in the dev console so a missing .env.local is obvious early.
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — ' +
      'auth and data calls will fail until .env.local is configured.',
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // needed for invite / magic-link / reset redirects
  },
});
