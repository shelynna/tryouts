
import { supabase } from './supabaseClient';

type LogContext = Record<string, any>;

const isAbortError = (error: any) => {
    if (!error) return false;
    
    // Standard Error check
    if (error.name === 'AbortError' || error.name === 'TimeoutError') return true;
    
    // Message string check for common technical triggers
    const msg = typeof error === 'string' ? error : (error.message || '');
    const lowMsg = msg.toLowerCase();
    return (
        lowMsg.includes('aborted') || 
        lowMsg.includes('abort') ||
        lowMsg.includes('signal') ||
        lowMsg.includes('timeout') ||
        lowMsg.includes('failed to fetch') ||
        lowMsg.includes('networkerror') ||
        lowMsg.includes('reason: undefined')
    );
};

export const Logger = {
  error: async (message: string, error?: any, context?: LogContext) => {
    // 1. SUPPRESS NOISE: Don't log AbortErrors or connectivity noise to DB
    if (isAbortError(error)) {
        return;
    }

    console.error(`[SMM Error] ${message}`, { error, context });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const details = {
        error: error ? (typeof error === 'object' ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error)) : null,
        ...context
      };

      // Fire and forget
      supabase.from('system_logs').insert({
        level: 'ERROR',
        message: message,
        details: JSON.stringify(details).substring(0, 5000),
        user_id: user?.id,
        url: typeof window !== 'undefined' ? window.location.href : undefined
      }).then(({ error: insertError }) => {
          if (insertError) console.warn("Failed to write error log", insertError);
      });
      
    } catch (logError) {
      // Fail silently
    }
  },

  warn: async (message: string, context?: LogContext) => {
    if (isAbortError(context)) return;
    console.warn(`[SMM Warn] ${message}`, context || '');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();

      supabase.from('system_logs').insert({
        level: 'WARN',
        message: message,
        details: JSON.stringify(context || {}),
        user_id: user?.id,
        url: typeof window !== 'undefined' ? window.location.href : undefined
      }).then(() => {});
    } catch (logError) {
      // Fail silently
    }
  },

  info: (message: string, context?: LogContext) => {
    console.log(`[SMM Info] ${message}`, context || '');
  },

  transaction: async (message: string, context?: LogContext) => {
    console.info(`[SMM Transaction] ${message}`, context || '');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: insertError } = await supabase.from('system_logs').insert({
        level: 'TRANSACTION',
        message: message,
        details: JSON.stringify(context || {}),
        user_id: user?.id,
        url: typeof window !== 'undefined' ? window.location.href : undefined
      });

      if (insertError) console.error("Failed to send transaction log", insertError);
    } catch (logError) {
      // Fail silently
    }
  }
};
