"use client";

/**
 * ErrorBoundary Component
 *
 * A React error boundary that catches JavaScript errors anywhere in the
 * child component tree and displays a fallback UI instead of crashing.
 *
 * @module components/ErrorBoundary
 */
import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Props for the ErrorBoundary component.
 */
interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

/**
 * State for the ErrorBoundary component.
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The caught error, if any */
  error: Error | null;
  /** Additional error info */
  errorInfo: string | null;
}

/**
 * ErrorBoundary - Catches and handles React component errors.
 *
 * This component uses React's error boundary pattern to catch errors
 * during rendering, lifecycle methods, and constructors of the whole
 * tree below it.
 *
 * Features:
 * - Catches JavaScript errors in child components
 * - Displays a user-friendly error message
 * - Provides options to retry or return home
 * - Logs errors for debugging
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * @example
 * // With custom fallback
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * Static method called when an error is thrown.
   * Updates state to trigger fallback UI.
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  /**
   * Lifecycle method called after an error has been thrown.
   * Used for logging error information.
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console in development
    console.error("ErrorBoundary caught an error:", error);
    console.error("Component stack:", errorInfo.componentStack);

    this.setState({
      errorInfo: errorInfo.componentStack || null
    });

    // In production, you would send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  /**
   * Resets the error state and attempts to re-render children.
   */
  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
          <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="mx-auto mb-6 h-16 w-16 rounded-2xl flex items-center justify-center bg-rose-600">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-white mb-3">
              Something went wrong
            </h1>
            <p className="text-slate-400 mb-6">
              An unexpected error occurred. Please try again or return to the home page.
            </p>

            {/* Error Details (Development) */}
            {process.env.NODE_ENV === "development" && error && (
              <div className="mb-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700 text-left">
                <p className="text-xs font-mono text-rose-400 break-words">
                  {error.message}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Link href="/">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
