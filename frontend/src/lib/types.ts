export type RiskLevel = "low" | "medium" | "high" | "critical";

export type Recommendation = "SIGN" | "NEGOTIATE" | "DO_NOT_SIGN";

export interface ContractPreview {
  id: string;
  name: string;
  description: string;
  risk_level: RiskLevel;
  preview: string;
}

export interface Contract {
  id: string;
  name: string;
  description: string;
  risk_level: RiskLevel;
  content: string;
}

export interface ClauseAnalysis {
  clause_id: string;
  original_text: string;
  topic: string;
  risk_level: RiskLevel;
  risk_explanation: string;
  law_reference: string | null;
  suggested_rewrite: string;
  diff_highlights?: string[];
}

export interface AnalysisResult {
  contract_id: string;
  contract_name: string;
  contract_type?: string;
  overall_risk: RiskLevel;
  summary: string;
  clauses: ClauseAnalysis[];
  total_issues: number;
  recommendation: Recommendation;
  analyzed_at: string;
}

export interface AnalysisState {
  status: "idle" | "loading" | "success" | "error";
  result: AnalysisResult | null;
  error: string | null;
}

export const riskLevelConfig: Record<RiskLevel, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  low: {
    label: "Low Risk",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
  },
  medium: {
    label: "Medium Risk",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  high: {
    label: "High Risk",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
  },
  critical: {
    label: "Critical Risk",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
  },
};

export const recommendationConfig: Record<Recommendation, {
  label: string;
  description: string;
  color: string;
}> = {
  SIGN: {
    label: "Safe to Sign",
    description: "This contract has acceptable terms.",
    color: "text-emerald-600",
  },
  NEGOTIATE: {
    label: "Negotiate First",
    description: "Request changes to problematic clauses before signing.",
    color: "text-amber-600",
  },
  DO_NOT_SIGN: {
    label: "Do Not Sign",
    description: "This contract has serious issues that need resolution.",
    color: "text-red-600",
  },
};
