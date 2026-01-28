// Comprehensive monitoring and diagnostics service
import { Logger } from './logger';
import { browserCapabilities, progressiveEnhancement } from './environment';

export interface DiagnosticReport {
  timestamp: string;
  environment: {
    userAgent: string;
    url: string;
    isOnline: boolean;
    connectionSpeed: string;
    screenSize: string;
    timezone: string;
  };
  capabilities: {
    localStorage: boolean;
    sessionStorage: boolean;
    serviceWorker: boolean;
    webGL: boolean;
    cookies: boolean;
  };
  performance: {
    loadTime: number;
    domReady: number;
    firstPaint?: number;
    largestContentfulPaint?: number;
  };
  errors: Array<{
    message: string;
    stack?: string;
    timestamp: string;
    context?: Record<string, any>;
  }>;
}

class MonitoringService {
  private errors: DiagnosticReport['errors'] = [];
  private startTime = Date.now();
  private domReadyTime = 0;
  private isInitialized = false;

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Initialize progressive enhancement
    progressiveEnhancement.init();

    // Monitor DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.domReadyTime = Date.now();
      });
    } else {
      this.domReadyTime = Date.now();
    }

    // Monitor performance metrics
    this.monitorPerformance();

    // Global error handler
    this.setupGlobalErrorHandling();

    // Network status monitoring
    this.monitorNetworkStatus();

    // Log initialization
    Logger.info('Monitoring service initialized', {
      capabilities: {
        localStorage: browserCapabilities.hasLocalStorage(),
        sessionStorage: browserCapabilities.hasSessionStorage(),
        serviceWorker: browserCapabilities.hasServiceWorker(),
        webGL: browserCapabilities.hasWebGL(),
        isOnline: browserCapabilities.isOnline(),
        connectionSpeed: browserCapabilities.getConnectionSpeed(),
      }
    });
  }

  private monitorPerformance() {
    // Use Performance Observer API if available
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          Logger.info('LCP measured', { value: lastEntry.startTime });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            Logger.info('FID measured', { value: entry.processingStart - entry.startTime });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

      } catch (error) {
        Logger.warn('Performance monitoring setup failed', { error });
      }
    }
  }

  private setupGlobalErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError(new Error(`Unhandled promise rejection: ${event.reason}`), {
        type: 'unhandledrejection',
        reason: event.reason,
      });
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.recordError(event.error || new Error(event.message), {
        type: 'uncaughterror',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Handle console errors (if in development)
    if (import.meta.env.DEV) {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        originalConsoleError.apply(console, args);
        this.recordError(new Error(args.join(' ')), { type: 'console.error' });
      };
    }
  }

  private monitorNetworkStatus() {
    window.addEventListener('online', () => {
      Logger.info('Network status changed', { status: 'online' });
    });

    window.addEventListener('offline', () => {
      Logger.warn('Network status changed', { status: 'offline' });
    });
  }

  recordError(error: Error, context?: Record<string, any>) {
    const errorEntry = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
    };

    this.errors.push(errorEntry);

    // Keep only last 50 errors to prevent memory issues
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }

    // Log immediately
    Logger.error('Error recorded', errorEntry);
  }

  generateReport(): DiagnosticReport {
    return {
      timestamp: new Date().toISOString(),
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        isOnline: navigator.onLine,
        connectionSpeed: browserCapabilities.getConnectionSpeed(),
        screenSize: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      capabilities: {
        localStorage: browserCapabilities.hasLocalStorage(),
        sessionStorage: browserCapabilities.hasSessionStorage(),
        serviceWorker: browserCapabilities.hasServiceWorker(),
        webGL: browserCapabilities.hasWebGL(),
        cookies: navigator.cookieEnabled,
      },
      performance: {
        loadTime: Date.now() - this.startTime,
        domReady: this.domReadyTime - this.startTime,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
        largestContentfulPaint: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime,
      },
      errors: [...this.errors],
    };
  }

  // Utility method to check if we should enable certain features
  shouldEnableFeature(feature: 'caching' | 'analytics' | 'pwa' | 'webgl'): boolean {
    switch (feature) {
      case 'caching':
        return browserCapabilities.hasLocalStorage() || browserCapabilities.hasSessionStorage();
      case 'analytics':
        return browserCapabilities.hasLocalStorage() && browserCapabilities.isOnline();
      case 'pwa':
        return browserCapabilities.hasServiceWorker() && 'caches' in window;
      case 'webgl':
        return browserCapabilities.hasWebGL();
      default:
        return true;
    }
  }
}

// Singleton instance
export const monitoring = new MonitoringService();

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  monitoring.init();
}