"use client";

/**
 * Error Component
 *
 * Next.js App Router error boundary for route segments.
 * Catches errors in the segment's children and displays a recovery UI.
 *
 * @module app/error
 */
import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Props for the Error component.
 */
interface ErrorProps {
  /** The error that was thrown */
  error: Error & { digest?: string };
  /** Function to attempt recovery by re-rendering the segment */
  reset: () => void;
}

/**
 * Error - Next.js error boundary component for route segments.
 *
 * This component is automatically invoked when an error occurs in a
 * route segment. It provides a user-friendly error message and options
 * to retry or navigate away.
 *
 * @param props - Component props
 * @param props.error - The thrown error object
 * @param props.reset - Function to retry rendering
 *
 * @example
 * // This component is used automatically by Next.js
 * // when an error occurs in a route segment
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 dark-gradient-bg">
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
          We encountered an error while loading this page. Please try again.
        </p>

        {/* Error Details (Development) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700 text-left">
            <p className="text-xs font-mono text-rose-400 break-words">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-slate-500 mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
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
