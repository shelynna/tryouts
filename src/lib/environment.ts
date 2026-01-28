// Environment-specific configurations
export const getCSPPolicy = (): string => {
  const isProduction = import.meta.env.PROD;
  const isDevelopment = import.meta.env.DEV;

  const basePolicy = {
    'default-src': "'self'",
    'script-src': "'self' 'unsafe-inline'",
    'connect-src': "'self'",
    'img-src': "'self' data: blob: https:",
    'style-src': "'self' 'unsafe-inline'",
    'font-src': "'self'",
    'frame-src': "'self'",
    'manifest-src': "'self'",
    'object-src': "'none'",
    'base-uri': "'self'",
    'form-action': "'self'",
  };

  // Add external services
  basePolicy['script-src'] += ' https://js.paystack.co https://*.paystack.co https://api.paystack.co https://cdn.paystack.co';
  basePolicy['connect-src'] += ' wss://*.supabase.co https://*.supabase.co https://api.paystack.co https://*.paystack.co';
  basePolicy['style-src'] += ' https://fonts.googleapis.com https://paystack.com https://unpkg.com';
  basePolicy['font-src'] += ' https://fonts.gstatic.com https://unpkg.com';
  basePolicy['frame-src'] += ' https://js.paystack.co https://checkout.paystack.com https://standard.paystack.co';

  // Development-specific allowances
  if (isDevelopment) {
    basePolicy['connect-src'] += ' http://localhost:* ws://localhost:*';
    basePolicy['script-src'] += ' http://localhost:*';
  }

  // Convert to CSP string
  return Object.entries(basePolicy)
    .map(([directive, sources]) => `${directive} ${sources}`)
    .join('; ');
};

// Feature detection utilities
export const browserCapabilities = {
  hasLocalStorage: (): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      const test = '__storage_test__';
      window.localStorage.setItem(test, 'test');
      window.localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },

  hasSessionStorage: (): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      const test = '__storage_test__';
      window.sessionStorage.setItem(test, 'test');
      window.sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },

  hasServiceWorker: (): boolean => {
    return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  },

  hasWebGL: (): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
    } catch {
      return false;
    }
  },

  isOnline: (): boolean => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  getConnectionSpeed: (): string => {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) return 'unknown';
    const conn = (navigator as any).connection;
    return conn?.effectiveType || 'unknown';
  }
};

// Progressive enhancement utilities
export const progressiveEnhancement = {
  // Initialize features based on capabilities
  init: () => {
    const capabilities = browserCapabilities;

    // Storage-based features
    if (!capabilities.hasLocalStorage()) {
      console.warn('localStorage unavailable - some features may not persist');
    }

    // Network-based features
    if (!capabilities.isOnline()) {
      console.warn('Offline mode detected - some features may be limited');
    }

    // Performance monitoring
    if (capabilities.getConnectionSpeed() === 'slow-2g' || capabilities.getConnectionSpeed() === '2g') {
      console.warn('Slow connection detected - optimizing for performance');
    }
  },

  // Graceful degradation for missing features
  withFallback: <T>(feature: () => T, fallback: T, featureName: string): T => {
    try {
      return feature();
    } catch (error) {
      console.warn(`${featureName} failed, using fallback:`, error);
      return fallback;
    }
  }
};