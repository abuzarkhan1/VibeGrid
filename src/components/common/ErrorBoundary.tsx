import React from 'react';
import { RotateCcw, Bug } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || String(error) };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[VibeGrid] Fatal render error:', error, info);
  }

  private reload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-bgDark text-white select-none p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest/20 border border-forest/40 mb-6">
            <Bug className="w-7 h-7 text-forest-bright" />
          </div>
          <h1 className="vg-serif text-3xl text-white mb-2">Something went wrong</h1>
          <p className="text-sm text-white/50 max-w-md text-center leading-relaxed mb-6">
            VibeGrid hit an unexpected error. Your workspaces are saved on disk — nothing is lost. Reload the app to continue.
          </p>
          {this.state.message && (
            <pre className="text-[11px] font-mono text-white/40 bg-black/40 border border-white/10 rounded-lg px-4 py-3 max-w-lg overflow-auto mb-6 whitespace-pre-wrap">
              {this.state.message}
            </pre>
          )}
          <button
            onClick={this.reload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-forest hover:bg-forest-bright text-sm font-medium text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reload VibeGrid
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
