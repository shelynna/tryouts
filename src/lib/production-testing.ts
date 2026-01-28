// Comprehensive testing utilities for production readiness
import { browserCapabilities } from './environment';
import { monitoring } from './monitoring';

export interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

export class ProductionReadinessTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    this.results = [];

    // Core functionality tests
    await this.testSupabaseConnection();
    await this.testStorageCapabilities();
    await this.testNetworkConnectivity();
    await this.testPaymentIntegration();
    await this.testPWAFeatures();

    // Performance tests
    await this.testPerformanceMetrics();
    await this.testBundleSize();

    // Security tests
    await this.testCSPCompliance();
    await this.testEnvironmentVariables();

    return this.results;
  }

  private addResult(result: TestResult) {
    this.results.push(result);
    console.log(`[${result.status}] ${result.name}: ${result.message}`);
  }

  private async testSupabaseConnection(): Promise<void> {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const { env } = await import('./env');

      const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

      // Test basic connection
      const { error } = await supabase.from('app_settings').select('key').limit(1);

      if (error) {
        this.addResult({
          name: 'Supabase Connection',
          status: 'FAIL',
          message: `Connection failed: ${error.message}`,
          details: error,
        });
      } else {
        this.addResult({
          name: 'Supabase Connection',
          status: 'PASS',
          message: 'Successfully connected to Supabase',
        });
      }
    } catch (error: any) {
      this.addResult({
        name: 'Supabase Connection',
        status: 'FAIL',
        message: `Connection test failed: ${error.message}`,
        details: error,
      });
    }
  }

  private async testStorageCapabilities(): Promise<void> {
    const capabilities = browserCapabilities;

    if (!capabilities.hasLocalStorage() && !capabilities.hasSessionStorage()) {
      this.addResult({
        name: 'Storage Capabilities',
        status: 'FAIL',
        message: 'No storage available - critical features will fail',
      });
    } else if (!capabilities.hasLocalStorage()) {
      this.addResult({
        name: 'Storage Capabilities',
        status: 'WARN',
        message: 'localStorage unavailable, using sessionStorage fallback',
      });
    } else {
      this.addResult({
        name: 'Storage Capabilities',
        status: 'PASS',
        message: 'Storage capabilities available',
      });
    }
  }

  private async testNetworkConnectivity(): Promise<void> {
    if (!navigator.onLine) {
      this.addResult({
        name: 'Network Connectivity',
        status: 'WARN',
        message: 'Currently offline - some features may not work',
      });
      return;
    }

    try {
      // Test connection to Supabase
      const response = await fetch('https://lupgtdooozmjtygjgbli.supabase.co/rest/v1/', {
        method: 'HEAD',
        mode: 'no-cors',
      });

      this.addResult({
        name: 'Network Connectivity',
        status: 'PASS',
        message: 'Network connectivity confirmed',
      });
    } catch (error) {
      this.addResult({
        name: 'Network Connectivity',
        status: 'FAIL',
        message: 'Network connectivity issues detected',
        details: error,
      });
    }
  }

  private async testPaymentIntegration(): Promise<void> {
    // Check if Paystack script can load
    try {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;

      const loadPromise = new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      await Promise.race([
        loadPromise,
        new Promise((_, reject) => setTimeout(reject, 5000)),
      ]);

      this.addResult({
        name: 'Payment Integration',
        status: 'PASS',
        message: 'Paystack integration available',
      });

      // Clean up
      document.head.removeChild(script);
    } catch (error) {
      this.addResult({
        name: 'Payment Integration',
        status: 'FAIL',
        message: 'Paystack integration failed to load',
        details: error,
      });
    }
  }

  private async testPWAFeatures(): Promise<void> {
    const capabilities = browserCapabilities;

    if (!capabilities.hasServiceWorker()) {
      this.addResult({
        name: 'PWA Features',
        status: 'WARN',
        message: 'Service Worker not supported - PWA features limited',
      });
    } else {
      this.addResult({
        name: 'PWA Features',
        status: 'PASS',
        message: 'PWA features supported',
      });
    }

    // Check manifest
    try {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (!manifestLink) {
        this.addResult({
          name: 'Web App Manifest',
          status: 'FAIL',
          message: 'Manifest link not found in HTML',
        });
      } else {
        const response = await fetch(manifestLink.getAttribute('href')!);
        if (response.ok) {
          this.addResult({
            name: 'Web App Manifest',
            status: 'PASS',
            message: 'Manifest accessible',
          });
        } else {
          this.addResult({
            name: 'Web App Manifest',
            status: 'FAIL',
            message: 'Manifest not accessible',
          });
        }
      }
    } catch (error) {
      this.addResult({
        name: 'Web App Manifest',
        status: 'FAIL',
        message: 'Manifest test failed',
        details: error,
      });
    }
  }

  private async testPerformanceMetrics(): Promise<void> {
    const report = monitoring.generateReport();

    if (report.performance.loadTime > 3000) {
      this.addResult({
        name: 'Performance Metrics',
        status: 'WARN',
        message: `Slow load time: ${report.performance.loadTime}ms`,
        details: report.performance,
      });
    } else {
      this.addResult({
        name: 'Performance Metrics',
        status: 'PASS',
        message: `Load time: ${report.performance.loadTime}ms`,
        details: report.performance,
      });
    }
  }

  private async testBundleSize(): Promise<void> {
    // This would typically be done in a build script
    // For runtime check, we can estimate based on performance
    const report = monitoring.generateReport();

    if (report.performance.domReady > 2000) {
      this.addResult({
        name: 'Bundle Size',
        status: 'WARN',
        message: 'Potential bundle size issues - slow DOM ready time',
        details: { domReady: report.performance.domReady },
      });
    } else {
      this.addResult({
        name: 'Bundle Size',
        status: 'PASS',
        message: 'Bundle size appears reasonable',
      });
    }
  }

  private async testCSPCompliance(): Promise<void> {
    // Check if CSP meta tag exists
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');

    if (!cspMeta) {
      this.addResult({
        name: 'CSP Compliance',
        status: 'FAIL',
        message: 'Content Security Policy not found',
      });
    } else {
      this.addResult({
        name: 'CSP Compliance',
        status: 'PASS',
        message: 'Content Security Policy configured',
      });
    }
  }

  private async testEnvironmentVariables(): Promise<void> {
    const { env } = await import('./env');

    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_PAYSTACK_PUBLIC_KEY',
    ];

    const missing = requiredVars.filter(key => !env[key as keyof typeof env]);

    if (missing.length > 0) {
      this.addResult({
        name: 'Environment Variables',
        status: 'FAIL',
        message: `Missing required environment variables: ${missing.join(', ')}`,
      });
    } else {
      this.addResult({
        name: 'Environment Variables',
        status: 'PASS',
        message: 'All required environment variables present',
      });
    }
  }

  // Utility method to run tests and generate report
  async generateReadinessReport(): Promise<{
    summary: { total: number; passed: number; failed: number; warnings: number };
    results: TestResult[];
    recommendations: string[];
  }> {
    const results = await this.runAllTests();

    const summary = {
      total: results.length,
      passed: results.filter(r => r.status === 'PASS').length,
      failed: results.filter(r => r.status === 'FAIL').length,
      warnings: results.filter(r => r.status === 'WARN').length,
    };

    const recommendations: string[] = [];

    if (summary.failed > 0) {
      recommendations.push('Fix all FAILED tests before deploying to production');
    }

    if (summary.warnings > 0) {
      recommendations.push('Address WARNING tests for optimal user experience');
    }

    if (!browserCapabilities.hasLocalStorage()) {
      recommendations.push('Consider implementing server-side session storage fallback');
    }

    if (!browserCapabilities.hasServiceWorker()) {
      recommendations.push('Implement offline support without service workers');
    }

    return { summary, results, recommendations };
  }
}

// Export singleton
export const readinessTester = new ProductionReadinessTester();