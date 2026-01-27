
import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// This new client is configured as requested, providing a clean foundation for the rebuilt auth system.
// We explicitly set storage to localStorage to avoid ambiguity and ensure persistence works
// even if third-party cookie blocking is active (since this is a first-party context).
export const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
}) as any;
