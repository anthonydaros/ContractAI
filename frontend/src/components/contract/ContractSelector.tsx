"use client";

/**
 * ContractSelector Component
 *
 * A selection interface for choosing demo contracts to analyze.
 * Displays contract options as selectable cards with risk indicators.
 * Supports keyboard navigation with arrow keys for accessibility.
 *
 * @module components/contract/ContractSelector
 */
import { useCallback, useRef } from "react";
import { CheckCircle2, AlertTriangle, HelpCircle, FileText, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Represents a selectable contract option.
 */
interface ContractOption {
  /** Unique identifier for the contract */
  id: string;
  /** Display name of the contract */
  name: string;
  /** Contract type category */
  type: string;
  /** Pre-assessed risk level */
  risk: "low" | "high" | "medium";
  /** Brief description of the contract */
  description: string;
}

/**
 * Available demo contracts for selection.
 */
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

/**
 * Configuration object for risk level styling.
 * Maps each risk level to its visual properties.
 */
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
} as const;

/**
 * Props for the ContractSelector component.
 */
interface ContractSelectorProps {
  /** Callback fired when a contract is selected */
  onSelect: (id: string) => void;
  /** Currently selected contract ID */
  selected?: string | null;
}

/**
 * ContractSelector - Interactive contract selection interface.
 *
 * Displays a list of demo contracts as selectable cards. Each card shows
 * the contract name, type, risk level badge, and brief description.
 * Supports keyboard navigation and ARIA attributes for accessibility.
 *
 * @param props - Component props
 * @param props.onSelect - Callback function called with the selected contract ID
 * @param props.selected - Optional ID of the currently selected contract
 *
 * @returns The rendered contract selector component
 *
 * @example
 * ```tsx
 * const [selectedContract, setSelectedContract] = useState<string | null>(null);
 *
 * <ContractSelector
 *   onSelect={setSelectedContract}
 *   selected={selectedContract}
 * />
 * ```
 */
export function ContractSelector({ onSelect, selected }: ContractSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Handles keyboard navigation within the contract list.
   * Supports ArrowUp, ArrowDown, Home, and End keys.
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, currentIndex: number) => {
      let newIndex: number | null = null;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          newIndex = Math.min(currentIndex + 1, MOCK_CONTRACTS.length - 1);
          break;
        case "ArrowUp":
          event.preventDefault();
          newIndex = Math.max(currentIndex - 1, 0);
          break;
        case "Home":
          event.preventDefault();
          newIndex = 0;
          break;
        case "End":
          event.preventDefault();
          newIndex = MOCK_CONTRACTS.length - 1;
          break;
        default:
          return;
      }

      if (newIndex !== null && newIndex !== currentIndex) {
        onSelect(MOCK_CONTRACTS[newIndex].id);
        const buttons = containerRef.current?.querySelectorAll("button");
        buttons?.[newIndex]?.focus();
      }
    },
    [onSelect]
  );

  return (
    <div
      ref={containerRef}
      className="space-y-3"
      role="listbox"
      aria-label="Select a demo contract"
    >
      {MOCK_CONTRACTS.map((contract, index) => {
        const risk = riskConfig[contract.risk];
        const RiskIcon = risk.icon;
        const isSelected = selected === contract.id;

        return (
          <button
            key={contract.id}
            type="button"
            role="option"
            aria-selected={isSelected}
            tabIndex={isSelected || (!selected && index === 0) ? 0 : -1}
            onClick={() => onSelect(contract.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              "relative w-full text-left cursor-pointer rounded-xl p-3 sm:p-4 transition-colors duration-200 border focus-ring",
              isSelected
                ? "bg-blue-500/10 border-blue-500/30"
                : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
            )}
          >
            {/* Selected Indicator */}
            {isSelected && (
              <div className="absolute -right-2 -top-2 h-7 w-7 rounded-full flex items-center justify-center bg-blue-600">
                <Check className="h-4 w-4 text-white" aria-hidden="true" />
              </div>
            )}

            <div className="flex items-start gap-3 sm:gap-4">
              {/* Icon */}
              <div
                className={cn(
                  "flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl border",
                  risk.bgColor,
                  risk.borderColor
                )}
              >
                <FileText className={cn("h-5 w-5 sm:h-6 sm:w-6", risk.color)} aria-hidden="true" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-1.5">
                  <h4 className="font-semibold text-white truncate">
                    {contract.name}
                  </h4>
                  <div
                    className={cn(
                      "self-start sm:self-auto flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
                      risk.bgColor,
                      risk.borderColor,
                      risk.color
                    )}
                  >
                    <RiskIcon className="h-3 w-3" aria-hidden="true" />
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
