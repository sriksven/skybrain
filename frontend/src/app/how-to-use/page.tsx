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

                {/* Section 4: Dashboard Legend */}
                <section className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-lg mb-12">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                        <span className="bg-orange-500/10 text-orange-400 p-2 rounded-lg mr-3">📖</span>
                        Understanding the Data
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Left Column: Data Fields */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-700 pb-2">Flight Data Fields</h3>
                            <ul className="space-y-3 text-sm text-slate-300">
                                <li className="flex flex-col">
                                    <span className="font-bold text-blue-400">Callsign (e.g., UAL123)</span>
                                    <span className="text-slate-400">The identifier used by Air Traffic Control.</span>
                                </li>
                                <li className="flex flex-col">
                                    <span className="font-bold text-blue-400">ICAO24 (e.g., a00001)</span>
                                    <span className="text-slate-400">The unique 24-bit hexadecimal address assigned to the aircraft hardware.</span>
                                </li>
                                <li className="flex flex-col">
                                    <span className="font-bold text-blue-400">Altitude</span>
                                    <span className="text-slate-400">Barometric altitude relative to standard pressure.</span>
                                </li>
                                <li className="flex flex-col">
                                    <span className="font-bold text-blue-400">Speed</span>
                                    <span className="text-slate-400">Ground speed of the aircraft.</span>
                                </li>
                            </ul>
                        </div>

                        {/* Right Column: Squawk Codes */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-700 pb-2">Squawk Codes (Transponder)</h3>
                            <p className="text-sm text-slate-400 mb-2">
                                4-digit codes pilots set to communicate status. Key codes highlighted in the dashboard:
                            </p>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 bg-red-900/20 p-2 rounded border border-red-900/30">
                                    <span className="font-mono font-bold text-red-500 bg-red-900/50 px-2 rounded">7700</span>
                                    <div className="text-sm">
                                        <span className="block font-bold text-red-400">General Emergency</span>
                                        <span className="text-slate-400 text-xs">Aircraft is in distress.</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-orange-900/20 p-2 rounded border border-orange-900/30">
                                    <span className="font-mono font-bold text-orange-500 bg-orange-900/50 px-2 rounded">7600</span>
                                    <div className="text-sm">
                                        <span className="block font-bold text-orange-400">Radio Failure</span>
                                        <span className="text-slate-400 text-xs">Lost communication with ATC.</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-red-900/20 p-2 rounded border border-red-900/30 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                                    <span className="font-mono font-bold text-red-500 bg-red-900/50 px-2 rounded z-10">7500</span>
                                    <div className="text-sm z-10">
                                        <span className="block font-bold text-red-400">Hijack</span>
                                        <span className="text-slate-400 text-xs">Unlawful interference.</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded border border-slate-700">
                                    <span className="font-mono font-bold text-slate-400 bg-slate-800 px-2 rounded">1200</span>
                                    <div className="text-sm">
                                        <span className="block font-bold text-slate-300">VFR (US)</span>
                                        <span className="text-slate-500 text-xs">Visual Flight Rules (North America).</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded border border-slate-700">
                                    <span className="font-mono font-bold text-slate-400 bg-slate-800 px-2 rounded">7000</span>
                                    <div className="text-sm">
                                        <span className="block font-bold text-slate-300">VFR (Europe)</span>
                                        <span className="text-slate-500 text-xs">Visual Flight Rules (Europe).</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
