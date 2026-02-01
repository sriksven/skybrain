import React from 'react';
import Link from 'next/link';

export default function HowToUse() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                        How to Use Skybrain
                    </h1>
                    <p className="text-xl text-slate-400">
                        Your guide to mastering real-time flight intelligence.
                    </p>
                    <div className="pt-4">
                        <Link href="/" className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>

                {/* Section 1: Chat Interface */}
                <section className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-lg">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                        <span className="bg-blue-500/10 text-blue-400 p-2 rounded-lg mr-3">💬</span>
                        AI Chat Interface
                    </h2>
                    <p className="text-slate-300 mb-4 leading-relaxed">
                        The heart of Skybrain is its conversational AI. You can ask natural language questions about flights, airports, and weather.
                    </p>
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-sm text-slate-400">
                        <p className="mb-2"><span className="text-blue-400">You:</span> "Why is my flight from JFK delayed?"</p>
                        <p><span className="text-emerald-400">Skybrain:</span> "Flights at JFK are experiencing delays due to strong crosswinds. Current average delay is 45 minutes."</p>
                    </div>
                </section>

                {/* Section 2: Airport Queries */}
                <section className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-lg">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                        <span className="bg-emerald-500/10 text-emerald-400 p-2 rounded-lg mr-3">✈️</span>
                        Airport Status
                    </h2>
                    <p className="text-slate-300 mb-4 leading-relaxed">
                        Get instant updates on airport conditions, ground stops, and delay programs.
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-slate-300">
                        <li>Check comprehensive status for any major US airport.</li>
                        <li>View real-time ground stop information.</li>
                        <li>See current temperature, wind, and visibility.</li>
                    </ul>
                </section>

                {/* Section 3: Comparisons */}
                <section className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-lg">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                        <span className="bg-purple-500/10 text-purple-400 p-2 rounded-lg mr-3">📊</span>
                        Smart Comparisons
                    </h2>
                    <p className="text-slate-300 mb-4 leading-relaxed">
                        Compare multiple airports side-by-side to make better travel decisions.
                    </p>
                    <p className="text-slate-300">
                        Simply ask: <span className="italic text-slate-400">"Compare weather at SFO and LAX"</span>
                    </p>
                </section>

            </div>
        </div>
    );
}
