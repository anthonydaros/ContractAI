"use client";

/**
 * Header Component
 *
 * Fixed navigation header with scroll-based styling and mobile menu.
 * SSR-safe implementation with proper event listener cleanup.
 *
 * @module components/layout/Header
 */
import Link from "next/link";
import { Container } from "./Container";
import { Button } from "@/components/ui/button";
import { Scale, Github, Menu, X, Sparkles } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

/**
 * Header - Main navigation component.
 *
 * Features:
 * - Scroll-based background transition
 * - Mobile-responsive menu
 * - SSR-safe window access
 * - Proper event listener cleanup to prevent memory leaks
 *
 * @returns The rendered header component
 */
export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /**
   * Handles scroll events to update header background.
   * Memoized to prevent unnecessary re-renders.
   */
  const handleScroll = useCallback(() => {
    // SSR safety check - window is only available in browser
    if (typeof window !== "undefined") {
      setScrolled(window.scrollY > 20);
    }
  }, []);

  useEffect(() => {
    // SSR safety check
    if (typeof window === "undefined") return;

    // Check initial scroll position
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <header className="fixed top-0 z-50 w-full">
      <div
        className={`mx-4 mt-4 rounded-2xl transition-colors duration-200 ${scrolled
            ? "bg-slate-900/95 backdrop-blur-sm border border-slate-800"
            : "bg-transparent border border-transparent"
          }`}
      >
        <Container className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 focus-ring rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Contract<span className="text-blue-400">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus-ring"
              asChild
            >
              <Link href="https://github.com/anthonydaros" target="_blank">
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Link>
            </Button>
            <Button
              size="sm"
              className="glow-button rounded-xl px-5 focus-ring"
              asChild
            >
              <Link href="#upload">
                <Sparkles className="mr-2 h-4 w-4" />
                Get Started
              </Link>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-xl text-white hover:bg-slate-800 focus-ring"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </Container>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="bg-slate-900 border border-slate-800 mx-4 mt-2 rounded-2xl md:hidden"
          role="menu"
        >
          <div className="p-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus-ring"
              asChild
              role="menuitem"
            >
              <Link href="https://github.com/anthonydaros" target="_blank">
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Link>
            </Button>
            <Button
              className="w-full glow-button rounded-xl focus-ring"
              asChild
              role="menuitem"
            >
              <Link href="#upload">
                <Sparkles className="mr-2 h-4 w-4" />
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
