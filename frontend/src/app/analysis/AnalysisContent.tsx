"use client";

import { useState, useEffect, useRef } from "react";
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
  Sparkles,
  Check
} from "lucide-react";
import Link from "next/link";
import api, { AnalysisResult } from "@/lib/api";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Mock data for fallback
const MOCK_ANALYSIS: AnalysisResult = {
  contract_id: "demo",
  contract_name: "Demo Contract Analysis",
  overall_risk: "high",
  summary: "This contract contains 3 problematic clauses related to liability limitations and termination. The indemnification clause allows for unlimited liability, which deviates significantly from market standards.",
  clauses: [
    {
      clause_id: "CLAUSE 3",
      original_text: "Rent of $2,000.00 with monthly adjustment by whichever index the LANDLORD deems most appropriate.",
      topic: "rent_adjustment",
      risk_level: "critical",
      risk_explanation: "Monthly rent adjustment is illegal under tenant protection laws. Additionally, allowing the landlord to choose the index arbitrarily violates the principle of good faith.",
      law_reference: "Tenant Protection Act - Section 18",
      suggested_rewrite: "The monthly rent shall be $2,000.00, subject to annual adjustment based on the Consumer Price Index (CPI), applied on the contract anniversary date."
    },
    {
      clause_id: "CLAUSE 4",
      original_text: "The LANDLORD may inspect the property AT ANY TIME, without prior notice to the tenant.",
      topic: "property_inspection",
      risk_level: "high",
      risk_explanation: "Unannounced inspections violate tenant privacy rights. The landlord cannot access the property without reasonable notice except in emergencies.",
      law_reference: "Civil Code - Article 1335",
      suggested_rewrite: "The LANDLORD may inspect the property with minimum 48 hours written notice, during business hours (9 AM - 6 PM)."
    },
    {
      clause_id: "CLAUSE 6",
      original_text: "The TENANT must pay 6 months' rent as advance security deposit, which shall not be refunded under any circumstances.",
      topic: "security_deposit",
      risk_level: "high",
      risk_explanation: "Security deposit exceeds legal limits (max 3 months) and non-refundable clause is illegal.",
      law_reference: "Tenant Protection Act - Section 38",
      suggested_rewrite: "Security deposit shall be 2 months' rent, to be returned within 30 days after lease termination."
    },
    {
      clause_id: "CLAUSE 1",
      original_text: "The owner rents the property to the tenant under the conditions below.",
      topic: "subject_matter",
      risk_level: "low",
      risk_explanation: "Standard introductory clause.",
      law_reference: null,
      suggested_rewrite: ""
    }
  ],
  total_issues: 3,
  recommendation: "DO_NOT_SIGN",
  analyzed_at: new Date().toISOString()
};

export function AnalysisContent() {
  const searchParams = useSearchParams();
  const contractId = searchParams.get("contract");
  const contentRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // Action states
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    async function fetchAnalysis() {
      setLoading(true);
      setError(null);

      try {
        if (contractId) {
          // Call real API
          const result = await api.analyzeContract("mock", contractId);
          setAnalysis(result);
        } else {
          // Use mock data for demo
          await new Promise(resolve => setTimeout(resolve, 1500));
          setAnalysis(MOCK_ANALYSIS);
        }
      } catch (err) {
        console.error("Analysis failed:", err);
        // Fallback to mock data on error
        setAnalysis(MOCK_ANALYSIS);
        setError("Using demo data - API connection failed");
      } finally {
        setLoading(false);
      }
    }

    fetchAnalysis();
  }, [contractId]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
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

      const imgWidth = 210; // A4 width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`Contract_Analysis_${analysis?.contract_id || "Report"}.pdf`);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const riskScore = analysis ? {
    low: 25,
    medium: 50,
    high: 75,
    critical: 95
  }[analysis.overall_risk] || 50 : 50;

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

          {/* Error Banner */}
          {error && !loading && (
            <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400" />
                <p className="text-amber-400">{error}</p>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {!loading && analysis && (
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
                          title={clause.topic.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
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
                  >
                    {isCopied ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-emerald-500" />
                        <span className="text-emerald-500">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="mr-2 h-4 w-4" />
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
