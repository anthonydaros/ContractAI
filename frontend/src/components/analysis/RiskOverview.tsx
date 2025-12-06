"use client";

import { AlertTriangle, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskOverviewProps {
  level: "low" | "medium" | "high" | "critical";
  score: number;
  summary: string;
}

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
};

export function RiskOverview({ level, score, summary }: RiskOverviewProps) {
  const config = riskConfig[level];
  const Icon = config.icon;
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
        <div className="relative flex h-44 w-44 items-center justify-center">
          {/* SVG Gauge */}
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100" aria-hidden="true">
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
              className={cn("text-5xl font-bold", config.color)}
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
