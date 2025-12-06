"use client";

import { CheckCircle2, AlertTriangle, HelpCircle, FileText, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContractOption {
  id: string;
  name: string;
  type: string;
  risk: "low" | "high" | "medium";
  description: string;
}

const MOCK_CONTRACTS: ContractOption[] = [
  {
    id: "fair",
    name: "Fair Rental Agreement",
    type: "Rental",
    risk: "low",
    description: "Standard residential lease with balanced terms and protections."
  },
  {
    id: "abusive",
    name: "Aggressive NDA",
    type: "NDA",
    risk: "high",
    description: "Highly restrictive non-disclosure with problematic clauses."
  },
  {
    id: "confusing",
    name: "Confusing Service Contract",
    type: "Service",
    risk: "medium",
    description: "Ambiguous terms regarding termination and hidden fees."
  }
];

const riskConfig = {
  low: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    label: "Low Risk"
  },
  medium: {
    icon: HelpCircle,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    label: "Medium Risk"
  },
  high: {
    icon: AlertTriangle,
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    label: "High Risk"
  }
};

interface ContractSelectorProps {
  onSelect: (id: string) => void;
  selected?: string | null;
}

export function ContractSelector({ onSelect, selected }: ContractSelectorProps) {
  return (
    <div className="space-y-3" role="listbox" aria-label="Select a demo contract">
      {MOCK_CONTRACTS.map((contract) => {
        const risk = riskConfig[contract.risk];
        const RiskIcon = risk.icon;
        const isSelected = selected === contract.id;

        return (
          <button
            key={contract.id}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(contract.id)}
            className={cn(
              "relative w-full text-left cursor-pointer rounded-xl p-4 transition-colors duration-200 border focus-ring",
              isSelected
                ? "bg-blue-500/10 border-blue-500/30"
                : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
            )}
          >
            {/* Selected Indicator */}
            {isSelected && (
              <div className="absolute -right-2 -top-2 h-7 w-7 rounded-full flex items-center justify-center bg-blue-600">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}

            <div className="flex items-start gap-4">
              {/* Icon */}
              <div
                className={cn(
                  "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border",
                  risk.bgColor,
                  risk.borderColor
                )}
              >
                <FileText className={cn("h-6 w-6", risk.color)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h4 className="font-semibold text-white truncate">
                    {contract.name}
                  </h4>
                  <div
                    className={cn(
                      "flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
                      risk.bgColor,
                      risk.borderColor,
                      risk.color
                    )}
                  >
                    <RiskIcon className="h-3 w-3" />
                    {risk.label}
                  </div>
                </div>
                <p className="text-sm text-slate-400 line-clamp-2">
                  {contract.description}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
