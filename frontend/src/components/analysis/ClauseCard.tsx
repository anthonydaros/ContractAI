"use client";

import { useState } from "react";
import { ChevronDown, AlertTriangle, BookOpen, Wand2, Copy, Check, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClauseCardProps {
  id: string;
  title: string;
  risk: "low" | "medium" | "high" | "critical";
  text: string;
  suggestion?: string;
  explanation: string;
  lawReference?: string;
}

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
};

export function ClauseCard({ id, title, risk, text, suggestion, explanation, lawReference }: ClauseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const config = riskConfig[risk];
  const RiskIcon = config.icon;

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
      {/* Header */}
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
            <RiskIcon className="h-3 w-3" />
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
        />
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div
          id={`clause-content-${id}`}
          className="border-t border-slate-700 p-5 space-y-5"
        >
          <div className="grid gap-5 lg:grid-cols-2">
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
                  <RiskIcon className={cn("h-5 w-5", config.color)} />
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
              <BookOpen className="h-5 w-5 text-blue-400" />
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
                    <Wand2 className="h-5 w-5 text-white" />
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
                      <Check className="mr-2 h-3 w-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-3 w-3" />
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
