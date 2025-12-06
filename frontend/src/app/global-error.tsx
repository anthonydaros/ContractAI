"use client";

/**
 * Global Error Component
 *
 * Next.js App Router global error boundary. Catches errors in the root
 * layout and provides a minimal recovery UI with its own html/body tags.
 *
 * @module app/global-error
 */
import { useEffect } from "react";

/**
 * Props for the GlobalError component.
 */
interface GlobalErrorProps {
  /** The error that was thrown */
  error: Error & { digest?: string };
  /** Function to attempt recovery by re-rendering */
  reset: () => void;
}

/**
 * GlobalError - Root-level error boundary for the application.
 *
 * This component handles errors that occur in the root layout itself.
 * It must include its own html and body tags since the root layout
 * may have failed to render.
 *
 * @param props - Component props
 * @param props.error - The thrown error object
 * @param props.reset - Function to retry rendering
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{
        margin: 0,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backgroundColor: "#0f172a",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
        <div style={{
          maxWidth: "28rem",
          width: "100%",
          textAlign: "center",
          padding: "2rem",
          borderRadius: "1rem",
          backgroundColor: "rgba(30, 41, 59, 0.8)",
          border: "1px solid rgba(51, 65, 85, 0.5)"
        }}>
          {/* Error Icon */}
          <div style={{
            width: "4rem",
            height: "4rem",
            margin: "0 auto 1.5rem",
            borderRadius: "1rem",
            backgroundColor: "#e11d48",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>

          {/* Error Message */}
          <h1 style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "white",
            marginBottom: "0.75rem"
          }}>
            Critical Error
          </h1>
          <p style={{
            color: "#94a3b8",
            marginBottom: "1.5rem"
          }}>
            A critical error occurred. Please refresh the page to try again.
          </p>

          {/* Error Details (Development) */}
          {process.env.NODE_ENV === "development" && (
            <div style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              borderRadius: "0.5rem",
              backgroundColor: "rgba(15, 23, 42, 0.5)",
              border: "1px solid rgba(51, 65, 85, 0.5)",
              textAlign: "left"
            }}>
              <p style={{
                fontSize: "0.75rem",
                fontFamily: "monospace",
                color: "#f43f5e",
                wordBreak: "break-word"
              }}>
                {error.message}
              </p>
              {error.digest && (
                <p style={{
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  color: "#64748b",
                  marginTop: "0.5rem"
                }}>
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem"
          }}>
            <button
              onClick={reset}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                border: "none",
                backgroundColor: "#2563eb",
                color: "white",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background-color 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#1d4ed8"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#2563eb"}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = "/"}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                border: "1px solid #334155",
                backgroundColor: "rgba(30, 41, 59, 0.5)",
                color: "#cbd5e1",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background-color 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.8)"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.5)"}
            >
              Go Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
