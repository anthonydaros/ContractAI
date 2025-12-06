"use client";

/**
 * AnalysisContent Component
 *
 * Displays the complete analysis results for a contract, including
 * risk overview, clause-by-clause analysis, and export functionality.
 *
 * @module app/analysis/AnalysisContent
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { RiskOverview } from "@/components/analysis/RiskOverview";
import { ClauseCard } from "@/components/analysis/ClauseCard";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  ArrowLeft,
  Download,
  Share2,
  Loader2,
  AlertCircle,
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Check
} from "lucide-react";
import Link from "next/link";
import api, { AnalysisResult, Clause } from "@/lib/api";
import { cn } from "@/lib/utils";
import { sanitizeText } from "@/lib/sanitize";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Risk score mapping for visual gauge representation.
 * Values calibrated for optimal UX in the circular gauge display:
 * - low (25): Quarter gauge - indicates minimal risk
 * - medium (50): Half gauge - indicates moderate caution needed
 * - high (75): Three-quarter gauge - indicates significant concern
 * - critical (95): Near-full gauge - indicates severe risk requiring attention
 */
const RISK_SCORES: Record<string, number> = {
  low: 25,
  medium: 50,
  high: 75,
  critical: 95
};

/**
 * Sanitizes clause data to prevent XSS attacks.
 * Applies text sanitization to all user-facing string fields.
 *
 * @param clause - Raw clause data from API
 * @returns Sanitized clause data safe for rendering
 */
function sanitizeClause(clause: Clause): Clause {
  return {
    ...clause,
    clause_id: sanitizeText(clause.clause_id),
    original_text: sanitizeText(clause.original_text),
    topic: sanitizeText(clause.topic),
    risk_explanation: sanitizeText(clause.risk_explanation),
    law_reference: clause.law_reference ? sanitizeText(clause.law_reference) : null,
    suggested_rewrite: sanitizeText(clause.suggested_rewrite),
  };
}

/**
 * Sanitizes complete analysis result to prevent XSS attacks.
 *
 * Note: Enum fields (recommendation, overall_risk) are not sanitized
 * as they are server-controlled values, not user input.
 *
 * @param analysis - Raw analysis data from API
 * @returns Sanitized analysis data safe for rendering
 */
function sanitizeAnalysis(analysis: AnalysisResult): AnalysisResult {
  return {
    ...analysis,
    contract_id: sanitizeText(analysis.contract_id),
    contract_name: sanitizeText(analysis.contract_name),
    summary: sanitizeText(analysis.summary),
    // recommendation and overall_risk preserved as typed enums
    clauses: analysis.clauses.map(sanitizeClause),
  };
}

/**
 * Formats a topic string for display.
 * Converts snake_case to Title Case.
 *
 * @param topic - Topic string in snake_case
 * @returns Formatted topic string
 *
 * @example
 * formatTopic("rent_adjustment") // "Rent Adjustment"
 */
function formatTopic(topic: string): string {
  return topic
    .replace(/_/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * AnalysisContent - Main component for displaying contract analysis results.
 *
 * Features:
 * - Fetches and displays AI-powered contract analysis
 * - Risk overview with visual gauge
 * - Clause-by-clause breakdown with risk levels
 * - PDF export functionality
 * - Share results via URL copy
 *
 * @returns The rendered analysis content
 *
 * @example
 * ```tsx
 * // Usage in page component
 * <Suspense fallback={<Loading />}>
 *   <AnalysisContent />
 * </Suspense>
 * ```
 */
export function AnalysisContent() {
  const searchParams = useSearchParams();
  const contractId = searchParams.get("contract");
  const uploadId = searchParams.get("upload");
  const contentRef = useRef<HTMLDivElement>(null);

  /** Loading state while fetching analysis */
  const [loading, setLoading] = useState(true);
  /** Error message if analysis fails */
  const [error, setError] = useState<string | null>(null);
  /** Analysis result data */
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  /** PDF export in progress flag */
  const [isExporting, setIsExporting] = useState(false);
  /** Share link copied confirmation flag */
  const [isCopied, setIsCopied] = useState(false);

  /**
   * Fetches contract analysis from API.
   * Handles both mock contracts and uploaded documents.
   * Uses AbortController to cancel pending requests on unmount.
   */
  useEffect(() => {
    const abortController = new AbortController();

    async function fetchAnalysis() {
      setLoading(true);
      setError(null);

      try {
        let result: AnalysisResult;

        if (uploadId) {
          // Analyze uploaded document with abort signal
          result = await api.analyzeContract(
            "upload",
            undefined,
            uploadId,
            abortController.signal
          );
        } else if (contractId) {
          // Analyze mock contract with abort signal
          result = await api.analyzeContract(
            "mock",
            contractId,
            undefined,
            abortController.signal
          );
        } else {
          throw new Error("No contract or upload ID provided");
        }

        // SECURITY: Sanitize all text content before rendering
        const sanitizedResult = sanitizeAnalysis(result);
        setAnalysis(sanitizedResult);
      } catch (err) {
        // Ignore abort errors - they're expected on unmount
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        console.error("Analysis failed:", err);
        const errorMessage = err instanceof Error ? err.message : "Analysis failed";
        setError(errorMessage);
        setAnalysis(null);
      } finally {
        // Only update loading if not aborted
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchAnalysis();

    // Cleanup: abort pending request to prevent memory leaks and state updates on unmounted component
    return () => {
      abortController.abort();
    };
  }, [contractId, uploadId]);

  /** Error state for share functionality */
  const [shareError, setShareError] = useState(false);

  /**
   * Copies the current page URL to clipboard for sharing.
   * Handles errors gracefully with user feedback.
   */
  const handleShare = useCallback(async () => {
    // SSR safety check
    if (typeof window === "undefined") return;

    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setShareError(false);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
      setShareError(true);
      setIsCopied(false);
      setTimeout(() => setShareError(false), 3000);
    }
  }, []);

  /**
   * Exports the analysis results as a PDF document.
   * Uses html2canvas to capture the content and jsPDF to generate the PDF.
   */
  const handleExportPDF = useCallback(async () => {
    if (!contentRef.current || !analysis) return;
    setIsExporting(true);

    try {
      // Create a canvas from the content
      const canvas = await html2canvas(contentRef.current, {
        scale: 2, // Higher resolution
        backgroundColor: "#0f172a", // Match dark theme
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      // SECURITY: Sanitize filename to prevent path traversal
      const safeContractId = analysis.contract_id.replace(/[^a-zA-Z0-9_-]/g, "_");
      pdf.save(`Contract_Analysis_${safeContractId}.pdf`);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [analysis]);

  // Calculate risk score for gauge display
  const riskScore = analysis
    ? RISK_SCORES[analysis.overall_risk] || 50
    : 50;

  // Count clauses by severity
  const criticalCount = analysis?.clauses.filter(c => c.risk_level === "critical").length || 0;
  const highCount = analysis?.clauses.filter(c => c.risk_level === "high").length || 0;

  return (
    <div className="min-h-screen dark-gradient-bg">
      <Header />

      <main className="relative pb-20 pt-28">
        <Container>
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="glass-card p-12 text-center rounded-2xl">
                {/* Loading Icon */}
                <div className="mx-auto mb-8">
                  <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto bg-blue-600">
                    <Loader2 className="h-10 w-10 text-white animate-spin" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-3">Analyzing Contract</h2>
                <p className="text-slate-400 mb-8">AI is reviewing your document for risks...</p>

                {/* Progress Bar */}
                <div className="w-72 h-2 rounded-full overflow-hidden mx-auto bg-slate-700">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{
                      width: "100%",
                      animation: "pulse 2s ease-in-out infinite"
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="glass-card p-12 text-center rounded-2xl max-w-md">
                <div className="mx-auto mb-8">
                  <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto bg-rose-600">
                    <AlertCircle className="h-10 w-10 text-white" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-3">Analysis Failed</h2>
                <p className="text-slate-400 mb-6">{error}</p>

                <Link href="/">
                  <Button
                    variant="outline"
                    className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {!loading && !error && analysis && (
            <div>
              {/* Printable Content Area */}
              <div ref={contentRef} className="p-4 md:p-0 bg-[#0f172a] md:bg-transparent">
                {/* Dashboard Grid */}
                <div className="grid gap-8 lg:grid-cols-3">
                  {/* Left Column: Overview */}
                  <div className="lg:col-span-1">
                    <div className="sticky top-28 space-y-6">
                      <RiskOverview
                        level={analysis.overall_risk}
                        score={riskScore}
                        summary={analysis.summary}
                      />

                      {/* Quick Stats */}
                      <div className="glass-card rounded-2xl p-6">
                        <h3 className="mb-5 font-semibold flex items-center gap-2 text-white">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-blue-600">
                            <FileText className="h-4 w-4 text-white" />
                          </div>
                          Quick Stats
                        </h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-800/50">
                            <span className="text-slate-400">Total Clauses</span>
                            <span className="font-mono font-bold text-xl text-white">{analysis.clauses.length}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 rounded-xl bg-rose-500/5">
                            <span className="text-slate-400 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-rose-400" />
                              Critical
                            </span>
                            <span className="font-mono font-bold text-xl text-rose-400">{criticalCount}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 rounded-xl bg-orange-500/5">
                            <span className="text-slate-400 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-orange-400" />
                              High Risk
                            </span>
                            <span className="font-mono font-bold text-xl text-orange-400">{highCount}</span>
                          </div>
                        </div>
                      </div>

                      {/* Recommendation */}
                      <div
                        className={cn(
                          "glass-card rounded-2xl p-6 border",
                          analysis.recommendation === "SIGN"
                            ? "border-emerald-500/30"
                            : analysis.recommendation === "NEGOTIATE"
                              ? "border-amber-500/30"
                              : "border-rose-500/30"
                        )}
                      >
                        <h3 className="mb-4 font-semibold flex items-center gap-2 text-white">
                          <div
                            className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center",
                              analysis.recommendation === "SIGN"
                                ? "bg-emerald-600"
                                : analysis.recommendation === "NEGOTIATE"
                                  ? "bg-amber-600"
                                  : "bg-rose-600"
                            )}
                          >
                            <ShieldCheck className="h-4 w-4 text-white" />
                          </div>
                          Recommendation
                        </h3>
                        <div
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-xl",
                            analysis.recommendation === "SIGN"
                              ? "bg-emerald-500/10"
                              : analysis.recommendation === "NEGOTIATE"
                                ? "bg-amber-500/10"
                                : "bg-rose-500/10"
                          )}
                        >
                          {analysis.recommendation === "SIGN" ? (
                            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                          ) : analysis.recommendation === "NEGOTIATE" ? (
                            <AlertCircle className="h-7 w-7 text-amber-400" />
                          ) : (
                            <AlertTriangle className="h-7 w-7 text-rose-400" />
                          )}
                          <span
                            className={cn(
                              "text-lg font-bold",
                              analysis.recommendation === "SIGN"
                                ? "text-emerald-400"
                                : analysis.recommendation === "NEGOTIATE"
                                  ? "text-amber-400"
                                  : "text-rose-400"
                            )}
                          >
                            {analysis.recommendation === "SIGN" ? "Safe to Sign" :
                              analysis.recommendation === "NEGOTIATE" ? "Negotiate First" :
                                "Do Not Sign"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Detailed Clauses */}
                  <div className="lg:col-span-2">
                    <h2 className="mb-6 text-2xl font-bold tracking-tight flex items-center gap-3 text-white">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-blue-600">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      Clause Analysis
                    </h2>
                    <div className="space-y-4">
                      {analysis.clauses.map((clause) => (
                        <ClauseCard
                          key={clause.clause_id}
                          id={clause.clause_id}
                          title={formatTopic(clause.topic)}
                          risk={clause.risk_level}
                          text={clause.original_text}
                          explanation={clause.risk_explanation}
                          lawReference={clause.law_reference || undefined}
                          suggestion={clause.suggested_rewrite || undefined}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-16 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-800 pt-8">
                <Link href="/">
                  <Button
                    variant="ghost"
                    className="text-slate-500 hover:text-slate-300 hover:bg-transparent px-0"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Upload Another Contract
                  </Button>
                </Link>

                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    className="text-slate-500 hover:text-slate-300 hover:bg-transparent transition-all"
                    onClick={handleShare}
                    aria-label={isCopied ? "Link copied to clipboard" : shareError ? "Failed to copy link" : "Share results"}
                  >
                    {isCopied ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-emerald-500" aria-hidden="true" />
                        <span
                          className="text-emerald-500"
                          role="status"
                          aria-live="polite"
                          aria-atomic="true"
                        >
                          Link Copied!
                        </span>
                      </>
                    ) : shareError ? (
                      <>
                        <AlertCircle className="mr-2 h-4 w-4 text-rose-500" aria-hidden="true" />
                        <span
                          className="text-rose-500"
                          role="alert"
                          aria-live="assertive"
                        >
                          Copy Failed
                        </span>
                      </>
                    ) : (
                      <>
                        <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />
                        Share Results
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white"
                    onClick={handleExportPDF}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Export PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
