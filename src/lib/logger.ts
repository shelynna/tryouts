
import { supabase } from './supabaseClient';

type LogContext = Record<string, any>;

export const Logger = {
  error: async (message: string, error?: any, context?: LogContext) => {
    console.error(`[SMM Error] ${message}`, { error, context });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Combine error details and context into a single JSON object for the database
      const details = {
        error: error ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : null,
        ...context
      };

      await supabase.from('system_logs').insert({
        level: 'ERROR',
        message: message,
        details: JSON.stringify(details),
        user_id: user?.id,
        url: typeof window !== 'undefined' ? window.location.href : undefined
      });
    } catch (logError) {
      console.error("Failed to send log to server", logError);
    }
  },

  warn: async (message: string, context?: LogContext) => {
    console.warn(`[SMM Warn] ${message}`, context || '');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('system_logs').insert({
        level: 'WARN',
        message: message,
        details: JSON.stringify(context || {}),
        user_id: user?.id,
        url: typeof window !== 'undefined' ? window.location.href : undefined
      });
    } catch (logError) {
      console.error("Failed to send log to server", logError);
    }
  },

  info: (message: string, context?: LogContext) => {
    console.log(`[SMM Info] ${message}`, context || '');
  },

  transaction: async (message: string, context?: LogContext) => {
    console.info(`[SMM Transaction] ${message}`, context || '');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('system_logs').insert({
        level: 'TRANSACTION',
        message: message,
        details: JSON.stringify(context || {}),
        user_id: user?.id,
        url: typeof window !== 'undefined' ? window.location.href : undefined
      });
    } catch (logError) {
      console.error("Failed to send transaction log to server", logError);
    }
  }
};
