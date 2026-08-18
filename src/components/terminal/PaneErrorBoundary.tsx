import React from 'react';
import { RotateCcw } from 'lucide-react';

interface PaneErrorBoundaryState {
  hasError: boolean;
}

interface PaneErrorBoundaryProps {
  /** Layout node id — remounts the boundary (and resets error state) when the
   * pane identity changes (e.g. workspace switch). */
  id: string;
  children: React.ReactNode;
}

/**
 * UX audit P3 #33: a crash inside ONE terminal pane (xterm renderer, addon,
 * resize race) previously took down the entire grid via the app-wide
 * ErrorBoundary. This per-pane boundary isolates the failure: the pane shows a
 * compact reload card while every other pane keeps running.
 */
export class PaneErrorBoundary extends React.Component<PaneErrorBoundaryProps, PaneErrorBoundaryState> {
  constructor(props: PaneErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): PaneErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: PaneErrorBoundaryProps) {
    // The pane was replaced (new layout id) — reset so the new pane renders.
    if (prevProps.id !== this.props.id && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  private retry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center gap-3 bg-black p-4 select-none">
          <p className="text-xs text-white/40 text-center max-w-[220px] leading-relaxed">
            This terminal pane hit an error and stopped rendering.
          </p>
          <button
            onClick={this.retry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-white/90 text-black text-[11px] font-medium transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reload this pane
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}