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
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#1a1a1e] text-[#e8e8ea] select-none p-8 font-sans">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6366f1]/15 border border-[#6366f1]/30 mb-6">
            <Bug className="w-7 h-7 text-[#818cf8]" />
          </div>
          <h1 className="text-2xl font-bold text-[#e8e8ea] mb-2 tracking-tight">Something went wrong</h1>
          <p className="text-xs text-[#a3a3ab] max-w-md text-center leading-relaxed mb-6 font-sans">
            VibeGrid hit an unexpected error. Your workspaces are safely saved on disk. Reload the application to continue.
          </p>
          {this.state.message && (
            <pre className="text-[11px] font-mono text-[#a3a3ab] bg-[#232327] border border-[#333338] rounded-xl px-4 py-3 max-w-lg overflow-auto mb-6 whitespace-pre-wrap">
              {this.state.message}
            </pre>
          )}
          <button
            onClick={this.reload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6366f1] hover:bg-[#5558e6] text-xs font-semibold text-white transition-colors shadow-sm"
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
