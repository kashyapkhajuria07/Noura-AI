'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    try {
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'error',
          message: error.message,
          stack: error.stack,
          context: { componentStack: errorInfo.componentStack },
          route: window.location.pathname,
        }),
      }).catch(() => {});
    } catch {}

    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-paper p-6">
          <div className="max-w-md w-full space-y-6 animate-fade-in-up">
            <div className="mx-auto w-16 h-16 border-brutal border-accent rounded-brutal-sm flex items-center justify-center bg-accent/10">
              <span className="font-mono text-display-sm font-bold text-accent">!</span>
            </div>

            <div className="text-center space-y-2">
              <h1 className="font-display text-heading font-bold">Something went wrong</h1>
              <p className="font-mono text-body-sm text-ink-400 italic">
                An unexpected error occurred. Our team has been notified.
              </p>
            </div>

            <div className="border-brutal-sm border-ink rounded-brutal-sm p-4 bg-ink-50 space-y-2">
              <p className="font-mono text-caption text-ink-400 uppercase tracking-wider">
                Error details
              </p>
              <p className="font-mono text-body-sm text-ink-700 break-words">
                {this.state.error?.message ?? 'Unknown error'}
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/dashboard';
                }}
                className="font-display text-body-sm font-semibold bg-ink text-paper border-brutal-sm border-ink rounded-brutal-sm shadow-brutal-sm px-5 py-2.5 hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="font-mono text-body-sm text-ink-400 hover:text-ink transition-colors px-4 py-2.5"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
