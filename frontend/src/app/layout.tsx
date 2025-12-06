/**
 * Root Layout Component
 *
 * The root layout for the application. This component wraps all pages
 * and provides the base HTML structure, fonts, and global providers.
 *
 * @module app/layout
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

/**
 * Geist Sans font configuration.
 * Used as the primary font for body text.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/**
 * Geist Mono font configuration.
 * Used for code and monospace text.
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Application metadata for SEO and browser display.
 * Note: robots set to noindex,nofollow to prevent search engine indexing.
 */
export const metadata: Metadata = {
  title: "AI Contract Negotiator",
  description: "Analyze and negotiate contracts with AI confidence. Upload your contracts for instant risk assessment and clause-by-clause analysis.",
  keywords: ["contract analysis", "AI", "legal", "risk assessment", "negotiation"],
  authors: [{ name: "AI Contract Negotiator" }],
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    title: "AI Contract Negotiator",
    description: "Analyze and negotiate contracts with AI confidence. Upload your contracts for instant risk assessment and clause-by-clause analysis.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "AI Contract Negotiator - Analyze contracts with AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Contract Negotiator",
    description: "Analyze and negotiate contracts with AI confidence.",
    images: ["/og-image.svg"],
  },
};

/**
 * RootLayout - The root layout component for the application.
 *
 * Provides:
 * - HTML structure with language attribute
 * - Font variables for Geist Sans and Mono
 * - Global providers (ErrorBoundary, etc.)
 *
 * @param props - Component props
 * @param props.children - Page content to render
 *
 * @returns The root layout structure
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
