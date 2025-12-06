"use client";

/**
 * ClauseCard Component
 *
 * An expandable card component for displaying individual contract clause
 * analysis results, including risk assessment, legal references, and
 * AI-suggested rewrites.
 *
 * @module components/analysis/ClauseCard
 */
import { useState } from "react";
import {
  ChevronDown,
  AlertTriangle,
  BookOpen,
  Wand2,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Props for the ClauseCard component.
 */
interface ClauseCardProps {
  /** Unique identifier for the clause */
  id: string;
  /** Display title for the clause */
  title: string;
  /** Risk level assessment */
  risk: "low" | "medium" | "high" | "critical";
  /** Original clause text from the contract */
  text: string;
  /** AI-suggested replacement text */
  suggestion?: string;
  /** Detailed explanation of the risk assessment */
  explanation: string;
  /** Reference to relevant law or regulation */
  lawReference?: string;
}

/**
 * Configuration object for risk level styling.
 * Maps each risk level to its visual properties and icon.
 */
const riskConfig = {
  low: {
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    icon: CheckCircle2,
    label: "Low"
  },
  medium: {
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    icon: AlertCircle,
    label: "Medium"
  },
  high: {
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    icon: AlertTriangle,
    label: "High"
  },
  critical: {
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
    icon: XCircle,
    label: "Critical"
  }
} as const;

/**
 * ClauseCard - Expandable card displaying clause analysis details.
 *
 * Features:
 * - Collapsible interface showing risk level and title by default
 * - Expanded view with original text, risk explanation, and suggested rewrite
 * - Copy-to-clipboard functionality for suggested rewrites
 * - Color-coded risk indicators
 * - Legal reference display when available
 *
 * @param props - Component props
 * @param props.id - Clause identifier (e.g., "CLAUSE 3")
 * @param props.title - Clause topic title
 * @param props.risk - Risk level (low/medium/high/critical)
 * @param props.text - Original clause text
 * @param props.suggestion - Optional AI-suggested rewrite
 * @param props.explanation - Risk explanation text
 * @param props.lawReference - Optional legal reference
 *
 * @returns The rendered clause card component
 *
 * @example
 * ```tsx
 * <ClauseCard
 *   id="CLAUSE 3"
 *   title="Rent Adjustment"
 *   risk="high"
 *   text="Monthly rent may be adjusted at landlord's discretion."
 *   explanation="This clause violates tenant protection laws."
 *   lawReference="Tenant Protection Act - Section 18"
 *   suggestion="Monthly rent shall be adjusted annually based on CPI."
 * />
 * ```
 */
export function ClauseCard({
  id,
  title,
  risk,
  text,
  suggestion,
  explanation,
  lawReference
}: ClauseCardProps) {
  /** Controls the expanded/collapsed state of the card */
  const [isExpanded, setIsExpanded] = useState(false);
  /** Indicates if the suggestion has been copied to clipboard */
  const [copied, setCopied] = useState(false);

  const config = riskConfig[risk];
  const RiskIcon = config.icon;

  /**
   * Copies the suggested rewrite to the clipboard.
   * Shows a confirmation state for 2 seconds after copying.
   */
  const handleCopy = async () => {
    if (suggestion) {
      await navigator.clipboard.writeText(suggestion);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden transition-colors duration-200 border glass-card",
        isExpanded ? "border-blue-500/30" : "border-slate-700"
      )}
    >
      {/* Header - Clickable to expand/collapse */}
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between p-5 transition-colors duration-200 hover:bg-slate-800/50 focus-ring text-left"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={`clause-content-${id}`}
      >
        <div className="flex items-center gap-4">
          {/* Risk Badge */}
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase border",
              config.bgColor,
              config.borderColor,
              config.color
            )}
          >
            <RiskIcon className="h-3 w-3" aria-hidden="true" />
            {config.label}
          </div>

          {/* Title */}
          <div>
            <span className="font-semibold text-white">{title}</span>
            <span className="ml-2 text-xs text-slate-500">{id}</span>
          </div>
        </div>

        <ChevronDown
          className={cn(
            "h-5 w-5 text-slate-500 transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div
          id={`clause-content-${id}`}
          className="border-t border-slate-700 p-5 space-y-5"
        >
          <div className="grid gap-5 md:grid-cols-2">
            {/* Original Text */}
            <div className="rounded-xl p-4 border border-slate-700 bg-slate-800/50">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Original Clause
              </h4>
              <p className="font-mono text-sm leading-relaxed text-slate-300">
                {text}
              </p>
            </div>

            {/* Risk Analysis */}
            <div className={cn("rounded-xl p-4 border", config.bgColor, config.borderColor)}>
              <div className="flex items-start gap-3">
                <div className={cn(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border",
                  config.bgColor,
                  config.borderColor
                )}>
                  <RiskIcon className={cn("h-5 w-5", config.color)} aria-hidden="true" />
                </div>
                <div>
                  <h4 className={cn("font-semibold mb-2", config.color)}>
                    Risk Analysis
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {explanation}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Law Reference */}
          {lawReference && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
              <BookOpen className="h-5 w-5 text-blue-400" aria-hidden="true" />
              <span className="text-sm text-slate-400">
                <span className="font-semibold text-slate-300">Legal Reference:</span>{" "}
                {lawReference}
              </span>
            </div>
          )}

          {/* Suggested Rewrite */}
          {suggestion && (
            <div className="rounded-xl p-5 border border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-emerald-600">
                    <Wand2 className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                  <h4 className="font-semibold text-emerald-400">
                    Suggested Rewrite
                  </h4>
                </div>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy();
                  }}
                  className="rounded-xl text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 bg-transparent border focus-ring"
                  aria-label={copied ? "Copied to clipboard" : "Copy suggested rewrite to clipboard"}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-3 w-3" aria-hidden="true" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-3 w-3" aria-hidden="true" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="font-mono text-sm leading-relaxed p-4 rounded-lg bg-emerald-500/5 text-emerald-200 border border-emerald-500/10">
                {suggestion}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
