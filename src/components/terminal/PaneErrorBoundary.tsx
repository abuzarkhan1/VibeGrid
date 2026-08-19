import React from 'react';
import { RotateCcw } from 'lucide-react';

interface PaneErrorBoundaryState {
  hasError: boolean;
}

interface PaneErrorBoundaryProps {

  id: string;
  children: React.ReactNode;
}

export class PaneErrorBoundary extends React.Component<PaneErrorBoundaryProps, PaneErrorBoundaryState> {
  constructor(props: PaneErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): PaneErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: PaneErrorBoundaryProps) {

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
