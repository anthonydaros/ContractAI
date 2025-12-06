"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { ContractSelector } from "@/components/contract/ContractSelector";
import { DocumentUploader } from "@/components/contract/DocumentUploader";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Scale,
  FileSearch,
  Sparkles,
  Brain,
  Lock,
  BarChart3,
  MousePointerClick,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAnalyze = async () => {
    if (selectedContract) {
      router.push(`/analysis?contract=${selectedContract}`);
    } else if (uploadedFile) {
      try {
        setIsUploading(true);
        const response = await api.uploadDocument(uploadedFile);
        if (response.success && response.upload_id) {
          router.push(`/analysis?upload=${response.upload_id}`);
        } else {
          console.error("Upload failed: No upload ID received");
          // Optionally handle error UI here
          setIsUploading(false);
        }
      } catch (error) {
        console.error("Upload failed:", error);
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#0f172a] overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 h-screen w-full z-0">
        <div className="absolute inset-0 bg-[url('/backgrounds/negotiation-bg.jpg')] bg-cover bg-center bg-no-repeat opacity-[0.15]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f172a]/20 to-[#0f172a]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">
        <Header />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="pb-24 pt-36 lg:pt-44">
            <Container>
              <div className="flex flex-col items-center text-center">
                {/* Badge */}
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 border border-slate-700/50 backdrop-blur-sm px-5 py-2.5 text-sm font-medium">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-slate-300">AI-Powered Legal Analysis</span>
                  </div>
                </div>

                {/* Heading */}
                <h1 className="hero-title max-w-4xl">
                  <span>Negotiate Contracts</span>
                  <br />
                  <span>Like a Pro</span>
                </h1>

                {/* Description */}
                <p className="mt-8 max-w-2xl text-lg text-slate-300 leading-relaxed md:text-xl">
                  Upload your contract and get an{" "}
                  <span className="text-blue-400 font-medium">instant AI-powered analysis</span>{" "}
                  that identifies risks, unfair terms, and provides smart rewrite suggestions.
                </p>

                {/* CTA Buttons */}
                <div className="mt-12 flex flex-col gap-4 sm:flex-row">
                  <Link href="#upload">
                    <Button className="h-14 px-10 text-base glow-button focus-ring">
                      <Sparkles className="mr-2.5 h-5 w-5" aria-hidden="true" />
                      Start Analysis
                      <ArrowRight className="ml-2.5 h-5 w-5" aria-hidden="true" />
                    </Button>
                  </Link>
                  <Link href="/analysis?contract=fair">
                    <Button
                      variant="outline"
                      className="h-14 px-10 text-base bg-slate-800/50 border-slate-700 hover:bg-slate-700/80 hover:border-slate-600 text-white focus-ring backdrop-blur-sm"
                    >
                      <FileSearch className="mr-2.5 h-5 w-5" aria-hidden="true" />
                      View Demo
                    </Button>
                  </Link>
                </div>

                {/* Trust Indicators */}
                <div
                  className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-slate-300"
                  role="list"
                  aria-label="Key features"
                >
                  {[
                    { icon: Lock, text: "100% Private & Secure" },
                    { icon: Brain, text: "Advanced AI Analysis" },
                    { icon: Zap, text: "Instant Results" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2" role="listitem">
                      <item.icon className="h-4 w-4 text-blue-500" aria-hidden="true" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>

                {/* Stats Bar */}
                <div className="mt-20 w-full max-w-4xl">
                  <div className="glass-card p-1">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-700">
                      {[
                        { value: "10K+", label: "Contracts Analyzed" },
                        { value: "99%", label: "Accuracy Rate" },
                        { value: "<30s", label: "Analysis Time" },
                        { value: "24/7", label: "Availability" }
                      ].map((stat, i) => (
                        <div key={i} className="px-6 py-5 text-center">
                          <div className="text-2xl md:text-3xl font-bold text-blue-400">{stat.value}</div>
                          <div className="text-xs md:text-sm text-slate-400 mt-1">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Container>
          </section>

          {/* Features Section */}
          <section className="py-28 relative" aria-labelledby="features-heading">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50" />
            <Container>
              <div className="text-center mb-16">
                <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Powerful Features
                </h2>
                <p className="text-slate-300 max-w-xl mx-auto">
                  Everything you need to understand and negotiate your contracts effectively
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Risk Detection",
                    description: "Instantly identify high-risk clauses that deviate from standard legal protections and industry norms.",
                    color: "text-emerald-500",
                    bgColor: "bg-emerald-500/10"
                  },
                  {
                    icon: Scale,
                    title: "Fairness Analysis",
                    description: "Compare your contract against fair market standards and applicable legal requirements.",
                    color: "text-blue-500",
                    bgColor: "bg-blue-500/10"
                  },
                  {
                    icon: Zap,
                    title: "Smart Rewrites",
                    description: "Get AI-generated suggestions to fix problematic clauses with legally sound alternatives.",
                    color: "text-amber-500",
                    bgColor: "bg-amber-500/10"
                  },
                  {
                    icon: BarChart3,
                    title: "Risk Scoring",
                    description: "Visual risk scores for each clause help you prioritize what needs attention first.",
                    color: "text-rose-500",
                    bgColor: "bg-rose-500/10"
                  },
                  {
                    icon: Brain,
                    title: "Legal References",
                    description: "Each analysis includes relevant legal references and citations for better understanding.",
                    color: "text-violet-500",
                    bgColor: "bg-violet-500/10"
                  },
                  {
                    icon: MousePointerClick,
                    title: "One-Click Export",
                    description: "Export your analysis as a professional PDF report to share with lawyers or colleagues.",
                    color: "text-cyan-500",
                    bgColor: "bg-cyan-500/10"
                  }
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="feature-card group hover:bg-slate-800/50 transition-colors"
                  >
                    <div className={`mb-6 inline-flex rounded-xl ${feature.bgColor} p-4 ${feature.color}`}>
                      <feature.icon className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-slate-300 leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </Container>
          </section>

          {/* Upload Section */}
          <section id="upload" className="py-28 relative" aria-labelledby="upload-heading">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50" />
            <Container>
              <div className="mb-16 text-center">
                <h2 id="upload-heading" className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Ready to Analyze?
                </h2>
                <p className="text-slate-300 max-w-xl mx-auto">
                  Choose a demo contract to explore the features, or upload your own document for analysis.
                </p>
              </div>

              <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
                {/* Demo Contracts */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <FileSearch className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-white">Try a Demo</h3>
                      <p className="text-xs sm:text-sm text-slate-400">Pre-loaded sample contracts</p>
                    </div>
                  </div>
                  <div className="glass-card p-4 sm:p-6">
                    <ContractSelector
                      onSelect={(id) => {
                        setSelectedContract(id);
                        setUploadedFile(null);
                      }}
                      selected={selectedContract}
                    />
                  </div>
                </div>

                {/* Upload Section */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-violet-500" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-white">Upload Document</h3>
                      <p className="text-xs sm:text-sm text-slate-400">PDF, DOCX, or TXT files</p>
                    </div>
                  </div>
                  <div className="glass-card p-4 sm:p-6 flex-1">
                    <DocumentUploader
                      onUpload={(file) => {
                        setUploadedFile(file);
                        setSelectedContract(null);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Analyze Button */}
              {(selectedContract || uploadedFile) && (
                <div className="mt-14 flex justify-center">
                  <Button
                    onClick={handleAnalyze}
                    disabled={isUploading}
                    className="h-14 px-8 sm:h-16 sm:px-14 text-lg glow-button focus-ring"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" aria-hidden="true" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-3 h-6 w-6" aria-hidden="true" />
                        Analyze {selectedContract ? "Demo Contract" : "Uploaded Document"}
                        <ArrowRight className="ml-3 h-5 w-5" aria-hidden="true" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </Container>
          </section>

          {/* How It Works */}
          <section className="py-28 relative" aria-labelledby="how-it-works-heading">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50" />
            <Container>
              <div className="text-center mb-16">
                <h2 id="how-it-works-heading" className="text-3xl md:text-4xl font-bold text-white mb-4">
                  How It Works
                </h2>
                <p className="text-slate-300 max-w-xl mx-auto">
                  Three simple steps to analyze and understand your contracts
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    step: "01",
                    title: "Upload Contract",
                    description: "Upload your contract in PDF, DOCX, or TXT format, or choose from our demo contracts."
                  },
                  {
                    step: "02",
                    title: "AI Analysis",
                    description: "Our AI analyzes every clause, identifying risks, legal issues, and unfair terms."
                  },
                  {
                    step: "03",
                    title: "Get Insights",
                    description: "Review detailed analysis with risk scores, explanations, and smart rewrite suggestions."
                  }
                ].map((item, i) => (
                  <div key={item.step} className="relative">
                    <div className="glass-card p-8 h-full">
                      <div className="text-6xl font-black text-blue-500/20 absolute top-4 right-6">
                        {item.step}
                      </div>
                      <div className="relative z-10">
                        <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                        <p className="text-slate-300">{item.description}</p>
                      </div>
                    </div>
                    {i < 2 && (
                      <div className="hidden md:flex absolute top-1/2 -right-[20px] transform -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-slate-800 border border-slate-700" aria-hidden="true">
                        <ArrowRight className="h-5 w-5 text-blue-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Container>
          </section>

          {/* CTA Section */}
          <section className="py-28 relative" aria-labelledby="cta-heading">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50" />
            <Container>
              <div className="glass-card p-6 sm:p-8 md:p-12 lg:p-16 text-center">
                <div className="inline-flex mb-8">
                  <div className="h-20 w-20 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <ShieldCheck className="h-10 w-10 text-blue-500" aria-hidden="true" />
                  </div>
                </div>

                <h2 id="cta-heading" className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                  Protect Yourself from Unfair Contracts
                </h2>
                <p className="text-slate-300 max-w-2xl mx-auto text-lg mb-10">
                  Don't sign another contract without understanding exactly what you're agreeing to.
                  Start your free analysis now.
                </p>
                <Link href="#upload">
                  <Button className="h-14 px-12 text-base glow-button focus-ring">
                    <Sparkles className="mr-2.5 h-5 w-5" aria-hidden="true" />
                    Get Started Free
                    <ArrowRight className="ml-2.5 h-5 w-5" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            </Container>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
