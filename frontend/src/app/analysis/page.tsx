"use client";

import { Suspense } from "react";
import { AnalysisContent } from "./AnalysisContent";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { Loader2 } from "lucide-react";

function LoadingFallback() {
  return (
    <div className="min-h-screen dark-gradient-bg">
      <Header />

      <main className="relative pb-20 pt-28">
        <Container>
          <div className="flex flex-col items-center justify-center py-32">
            <div className="glass-card p-12 text-center rounded-2xl">
              {/* Loading Icon */}
              <div className="mx-auto mb-8">
                <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto bg-blue-600">
                  <Loader2 className="h-10 w-10 text-white animate-spin" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-3">Loading...</h2>
              <p className="text-slate-400 mb-8">Please wait</p>

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
        </Container>
      </main>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AnalysisContent />
    </Suspense>
  );
}
