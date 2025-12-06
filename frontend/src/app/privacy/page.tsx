"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";

export default function PrivacyPage() {
    return (
        <div className="flex min-h-screen flex-col bg-[#0f172a]">
            <Header />
            <main className="flex-1 py-32">
                <Container>
                    <div className="max-w-3xl mx-auto glass-card p-8 md:p-12">
                        <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>

                        <div className="prose prose-invert prose-lg text-slate-400">
                            <p className="lead text-xl text-slate-300">
                                Data Handling in this Demonstration Project.
                            </p>

                            <h3 className="text-white mt-8 mb-4">1. Portfolio Context</h3>
                            <p>
                                This application serves as a technical demonstration by <strong>Anthony Max</strong>.
                                It is not a commercial product and is not intended for processing sensitive real-world confidential data.
                            </p>

                            <h3 className="text-white mt-8 mb-4">2. Data Processing</h3>
                            <p>
                                When you upload a document:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>The content is processed temporarily by the AI to generate the analysis.</li>
                                <li>We do not claim ownership of any documents you test with this system.</li>
                                <li><strong>Recommendation:</strong> Do not upload sensitive personal or confidential corporate documents. Use the provided demo contracts or generic public documents for testing.</li>
                            </ul>

                            <h3 className="text-white mt-8 mb-4">3. Local Storage</h3>
                            <p>
                                This application may use your browser's local storage to save your session preferences (like theme or last analysis ID) to improve the user experience.
                            </p>

                            <h3 className="text-white mt-8 mb-4">4. Contact</h3>
                            <p>
                                If you have questions about this project or wish to discuss professional opportunities, please visit:
                                <a href="http://anthonymax.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 ml-1">
                                    anthonymax.com
                                </a>
                            </p>

                            <div className="mt-12 pt-8 border-t border-slate-700">
                                <p className="text-sm">
                                    Last updated: December 2025
                                </p>
                            </div>
                        </div>
                    </div>
                </Container>
            </main>
            <Footer />
        </div>
    );
}
