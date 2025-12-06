"use client";

/**
 * RiskOverview Component
 *
 * A visual risk gauge component that displays the overall risk assessment
 * for a contract, including a circular progress indicator, risk level badge,
 * and executive summary.
 *
 * @module components/analysis/RiskOverview
 */
import { AlertTriangle, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props for the RiskOverview component.
 */
interface RiskOverviewProps {
  /** Risk level category */
  level: "low" | "medium" | "high" | "critical";
  /** Numeric risk score (0-100) */
  score: number;
  /** Executive summary text describing the overall risk */
  summary: string;
}

/**
 * Configuration object for risk level styling.
 * Maps each risk level to its visual properties.
 */
const riskConfig = {
  low: {
    label: "Low Risk",
    color: "text-emerald-400",
    bgColor: "bg-emerald-600",
    ringColor: "stroke-emerald-500",
    icon: CheckCircle2
  },
  medium: {
    label: "Medium Risk",
    color: "text-amber-400",
    bgColor: "bg-amber-600",
    ringColor: "stroke-amber-500",
    icon: AlertCircle
  },
  high: {
    label: "High Risk",
    color: "text-orange-400",
    bgColor: "bg-orange-600",
    ringColor: "stroke-orange-500",
    icon: AlertTriangle
  },
  critical: {
    label: "Critical Risk",
    color: "text-rose-400",
    bgColor: "bg-rose-600",
    ringColor: "stroke-rose-500",
    icon: XCircle
  }
} as const;

/**
 * RiskOverview - Displays a visual risk assessment gauge.
 *
 * This component renders a circular progress gauge showing the risk score,
 * a colored badge indicating the risk level, and an executive summary.
 * The gauge uses SVG for smooth animations and responsive scaling.
 *
 * @param props - Component props
 * @param props.level - Risk level category (low/medium/high/critical)
 * @param props.score - Numeric risk score from 0 to 100
 * @param props.summary - Executive summary describing the overall assessment
 *
 * @returns The rendered risk overview component
 *
 * @example
 * ```tsx
 * <RiskOverview
 *   level="high"
 *   score={75}
 *   summary="This contract contains several problematic clauses."
 * />
 * ```
 */
export function RiskOverview({ level, score, summary }: RiskOverviewProps) {
  const config = riskConfig[level];
  const Icon = config.icon;

  // Calculate SVG circle properties for the gauge
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div
      className="glass-card rounded-2xl p-6"
      role="region"
      aria-label="Risk Overview"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Gauge */}
        <div className="relative flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center">
          {/* SVG Gauge */}
          <svg
            className="h-full w-full -rotate-90 transform"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              className="text-slate-700"
              strokeWidth="6"
            />
            {/* Progress Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              className={config.ringColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: "stroke-dashoffset 0.5s ease-out"
              }}
            />
          </svg>

          {/* Center Content */}
          <div className="absolute flex flex-col items-center">
            <span
              className={cn("text-4xl sm:text-5xl font-bold", config.color)}
              aria-label={`Risk score: ${score} out of 100`}
            >
              {score}
            </span>
            <span className="text-xs uppercase text-slate-500 tracking-wider mt-1">
              Risk Score
            </span>
          </div>
        </div>

        {/* Risk Level Badge */}
        <div
          className={cn(
            "flex items-center gap-2 rounded-full px-5 py-2.5 text-white font-semibold",
            config.bgColor
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span className="uppercase tracking-wide text-sm">{config.label}</span>
        </div>

        {/* Summary */}
        <div className="text-center">
          <h3 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">
            Executive Summary
          </h3>
          <p className="text-sm leading-relaxed text-slate-300">
            {summary}
          </p>
        </div>
      </div>
    </div>
  );
}
