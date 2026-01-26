import React, { Component, ErrorInfo, ReactNode } from 'react';
import { API } from '../lib/api';
import { Button } from './ui/Button';
import { WifiOff } from 'lucide-react';

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
    console.error("Uncaught error:", error, errorInfo);
    
    // Silent Reporting
    API.reportError({
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-6 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
             <WifiOff size={32} />
          </div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 mb-2">Something went wrong</h1>
          <p className="text-stone-500 mb-8 max-w-md">
            Our engineering team has been notified automatically. Please try refreshing the page.
          </p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      );
    }

    return this.props.children;
  }
}