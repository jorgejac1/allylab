import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Descriptive name for the section being protected */
  section?: string;
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 mb-3 text-red-600">
            <AlertTriangle size={24} />
            <span className="text-base/[normal] font-semibold">Something went wrong</span>
          </div>

          {this.props.section && (
            <p className="text-red-800 text-sm/[normal] mb-2">
              Error in: {this.props.section}
            </p>
          )}

          <p className="text-red-900 text-[13px] mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>

          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white border-none rounded-md text-sm/[normal] font-medium cursor-pointer"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/** Higher-order component version for wrapping components */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  section?: string
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary section={section || displayName}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `WithErrorBoundary(${displayName})`;
  return WithErrorBoundary;
}
