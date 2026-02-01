import React from 'react';
import { Plane, X, Navigation, TrendingUp, TrendingDown, Wind } from 'lucide-react';

interface FlightDetailProps {
    flight: any;
    history: any[];
    onClose: () => void;
}

const formatValue = (val: any, unit: string = '') => val ? `${Math.round(val)}${unit}` : '-';

export default function FlightDetailPanel({ flight, history, onClose }: FlightDetailProps) {
    if (!flight) return null;

    const isClimbing = flight.vertical_rate > 0.5;
    const isDescending = flight.vertical_rate < -0.5;

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-slate-900/95 p-4 border-b border-slate-700 flex justify-between items-center z-10">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-wider font-mono">
                        {flight.callsign || flight.icao24}
                    </h2>
                    <div className="text-xs text-slate-400 uppercase tracking-widest">
                        {flight.origin_country} • {flight.icao24}
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                </button>
            </div>

            <div className="p-6 space-y-8">

                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Altitude */}
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <div className="text-xs text-slate-500 uppercase mb-1">Altitude</div>
                        <div className="text-2xl font-bold text-blue-400 font-mono">
                            {formatValue(flight.baro_altitude, 'm')}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            Geo: {formatValue(flight.geo_altitude, 'm')}
                        </div>
                    </div>

                    {/* Speed */}
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <div className="text-xs text-slate-500 uppercase mb-1">Gnd Speed</div>
                        <div className="text-2xl font-bold text-emerald-400 font-mono">
                            {formatValue(flight.velocity, 'm/s')}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Wind className="w-3 h-3" />
                            Mach {flight.velocity ? (flight.velocity / 340).toFixed(2) : '-'}
                        </div>
                    </div>

                    {/* Vertical Rate */}
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <div className="text-xs text-slate-500 uppercase mb-1">Vertical Spd</div>
                        <div className={`text-2xl font-bold font-mono flex items-center gap-2 ${isClimbing ? 'text-green-400' : isDescending ? 'text-orange-400' : 'text-slate-300'}`}>
                            {isClimbing && <TrendingUp className="w-5 h-5" />}
                            {isDescending && <TrendingDown className="w-5 h-5" />}
                            {formatValue(flight.vertical_rate, 'm/s')}
                        </div>
                    </div>

                    {/* Track / Heading */}
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <div className="text-xs text-slate-500 uppercase mb-1">True Track</div>
                        <div className="text-2xl font-bold text-white font-mono flex items-center gap-2">
                            <Navigation
                                className="w-5 h-5 text-slate-400"
                                style={{ transform: `rotate(${flight.true_track || 0}deg)` }}
                            />
                            {formatValue(flight.true_track, '°')}
                        </div>
                    </div>
                </div>

                {/* Flight Path Mini-Map */}
                <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-400 uppercase">Flight Path History</h3>
                    <div className="h-48 bg-slate-950 rounded border border-slate-800 relative overflow-hidden flex items-center justify-center">
                        {history.length > 2 ? (
                            <svg className="w-full h-full p-4" viewBox="0 0 100 100" preserveAspectRatio="none">
                                {/* This is a simple visualization placeholder. Real plotting requires scaling logic. */}
                                <path
                                    d={`M ${history.map((h, i) => `${(i / history.length) * 100},${50 + (Math.sin(i) * 10)}`).join(' L ')}`}
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="2"
                                    className="opacity-50"
                                />
                                <text x="50" y="50" fill="#64748b" fontSize="5" textAnchor="middle">
                                    Real map scaling requires more logic
                                </text>
                            </svg>
                        ) : (
                            <div className="text-slate-600 text-xs italic">
                                Tracking path... (waiting for updates)
                            </div>
                        )}
                    </div>
                </div>

                {/* Meta Info */}
                <div className="space-y-2 pt-4 border-t border-slate-800">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Squawk</span>
                        <span className="font-mono text-slate-300">{flight.squawk || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Position Src</span>
                        <span className="font-mono text-slate-300">{flight.position_source === 0 ? 'ADS-B' : 'Other'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Last Contact</span>
                        <span className="font-mono text-slate-300">{Math.round(Date.now() / 1000 - flight.last_contact)}s ago</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
