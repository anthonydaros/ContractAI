"use client";

import { Container } from "./Container";
import { Scale, Heart, Github, Twitter, Linkedin } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative py-16">
      <Container>
        <div className="glass-card p-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            {/* Logo & Description */}
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">
                  Contract<span className="text-blue-400">AI</span>
                </span>
                <p className="text-sm text-slate-400">AI-Powered Contract Analysis</p>
              </div>
            </div>

            {/* Links */}
            <nav className="flex items-center gap-8 text-sm" aria-label="Footer navigation">
              <Link
                href="/terms"
                className="text-slate-400 hover:text-white transition-colors duration-200 focus-ring rounded"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-slate-400 hover:text-white transition-colors duration-200 focus-ring rounded"
              >
                Privacy
              </Link>
              <Link
                href="#"
                className="text-slate-400 hover:text-white transition-colors duration-200 focus-ring rounded"
              >
                Contact
              </Link>
            </nav>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {[
                { icon: Github, href: "https://github.com/anthonydaros", label: "GitHub" },
                { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
                { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" }
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white hover:border-slate-600 transition-colors duration-200 focus-ring"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="mt-8 pt-8 border-t border-slate-700">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Copyright */}
              <p className="text-sm text-slate-400 flex items-center gap-2">
                Built with
                <Heart className="h-4 w-4 text-rose-500" aria-hidden="true" />
                <span className="sr-only">love</span>
                for Justice
              </p>

              <p className="text-sm text-slate-400">
                © {new Date().getFullYear()} ContractAI. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
