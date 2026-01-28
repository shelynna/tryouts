
import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * BEST PRACTICE: Custom Fetch Wrapper
 * This intercepts all Supabase network calls. If a request is aborted 
 * (due to navigation or timeout), it handles it silently instead of 
 * throwing an unhandled exception that crashes the UI.
 */
const customFetch = async (url: string, options: any) => {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message?.includes('aborted')) {
      // Return a dummy 'ok' response to Supabase internals to stop the error propagation
      return new Response(JSON.stringify({ data: null, error: null }), {
        status: 200,
        statusText: 'Aborted Silently',
      });
    }
    throw error;
  }
};

const getSafeStorage = () => {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch (e) {
    console.warn('[SML] localStorage unavailable, using memory fallback.');
    const memoryStorage: any = {};
    return {
      getItem: (key: string) => memoryStorage[key] || null,
      setItem: (key: string, value: string) => { memoryStorage[key] = value; },
      removeItem: (key: string) => { delete memoryStorage[key]; },
      clear: () => { for (const key in memoryStorage) delete memoryStorage[key]; }
    };
  }
};

export const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: getSafeStorage() as any,
  },
  global: {
    fetch: customFetch as any, // Inject the resilient fetch wrapper
  }
});
