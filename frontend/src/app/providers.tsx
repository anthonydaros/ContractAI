"use client";

/**
 * Providers Component
 *
 * Client-side providers wrapper for the application.
 * Wraps children with ErrorBoundary and any other context providers.
 *
 * @module app/providers
 */
import { ReactNode } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

/**
 * Props for the Providers component.
 */
interface ProvidersProps {
  /** Child components to wrap with providers */
  children: ReactNode;
}

/**
 * Providers - Application-wide providers wrapper.
 *
 * This component wraps the application with necessary providers
 * including error boundaries. Add additional providers here as needed
 * (e.g., theme provider, auth provider, state management).
 *
 * @param props - Component props
 * @param props.children - Child components to render
 *
 * @example
 * ```tsx
 * <Providers>
 *   <App />
 * </Providers>
 * ```
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
