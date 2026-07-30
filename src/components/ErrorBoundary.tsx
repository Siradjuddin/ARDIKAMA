import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const message = error?.message || String(error);
    if (
      message.includes('SecurityError') ||
      message.includes('$$typeof') ||
      message.includes('Blocked a frame with origin')
    ) {
      console.warn('Caught cross-origin window SecurityError in ErrorBoundary:', message);
      this.setState({ hasError: false, error: null });
    } else {
      console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
    }
  }

  public override render() {
    if (this.state.hasError && this.state.error) {
      const isSecurityError =
        this.state.error.message?.includes('SecurityError') ||
        this.state.error.message?.includes('$$typeof') ||
        this.state.error.message?.includes('Blocked a frame with origin');

      if (isSecurityError) {
        return this.props.children;
      }

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 text-center">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Sistem Mengalami Kendala
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Silakan muat ulang halaman atau coba kembali beberapa saat lagi.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-transform active:scale-95"
            >
              Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


