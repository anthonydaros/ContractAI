/**
 * Next.js Configuration
 *
 * Configures the Next.js application for production deployment
 * including security headers, image optimization, and Docker support.
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",

  // Optimize images
  images: {
    unoptimized: true,
  },

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Security headers configuration
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
          {
            // Prevent MIME type sniffing
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // Prevent clickjacking attacks
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            // Enable XSS filter (legacy browsers)
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            // Control referrer information
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // Restrict browser features
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=(), payment=()",
          },
          {
            // Content Security Policy
            // NOTE: 'unsafe-inline' needed for Next.js styles, adjust for production
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' http://localhost:8000 https://*.anthropic.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
