import React, { Component, ErrorInfo, ReactNode } from 'react';
import { API } from '../lib/api';
import { Button } from './ui/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Filter out benign errors like AbortError which happen frequently in SPAs during navigation
    const isBenign = 
        error.name === 'AbortError' || 
        error.message?.includes('aborted') || 
        error.message?.includes('signal');

    if (!isBenign) {
        console.error("Uncaught error:", error, errorInfo);
        API.reportError({
            error: error.toString(),
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            url: window.location.href
        });
    }
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-stone-50 p-6 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-stone-100 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
               <AlertTriangle size={32} strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-serif font-bold text-stone-900 mb-3">Something went wrong</h1>
            <p className="text-stone-500 mb-8 text-sm leading-relaxed">
              We encountered an unexpected issue. Our engineering team has been notified.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => window.location.reload()} size="lg" className="w-full shadow-lg shadow-red-500/10">
                <RefreshCw size={18} className="mr-2" /> Reload Application
              </Button>
              <Button variant="ghost" onClick={() => { window.localStorage.clear(); window.location.reload(); }} size="sm" className="text-stone-400 hover:text-stone-600">
                Clear Cache & Restart
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}