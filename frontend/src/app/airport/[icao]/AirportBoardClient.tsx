'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { useUnits } from '@/context/UnitContext';
import { useWatchlist } from '@/context/WatchlistContext';
import AltitudeChart from '@/components/dashboard/AltitudeChart';
import { Star } from 'lucide-react';

interface FlightBoardItem {
    icao24: string;
    firstSeen: number;
    estDepartureAirport: string;
    lastSeen: number;
    estArrivalAirport: string;
    callsign: string;
}

interface LiveFlight {
    icao24: string;
    callsign: string | null;
    baro_altitude: number | null;
    velocity: number | null;
    squawk: string | null;
}

interface WeatherData {
    airport: string;
    city: string;
    temperature: number;
    condition_code: number;
    wind_speed: number;
    wind_direction: number;
    is_day: number;
}

interface AirportBoardClientProps {
    icao: string;
}

export default function AirportBoardClient({ icao }: AirportBoardClientProps) {
    const router = useRouter();
    const { formatTemp, formatSpeed } = useUnits();
    const { isWatched, addToWatchlist, removeFromWatchlist } = useWatchlist();

    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [arrivals, setArrivals] = useState<FlightBoardItem[]>([]);
    const [departures, setDepartures] = useState<FlightBoardItem[]>([]);
    const [liveFlights, setLiveFlights] = useState<LiveFlight[]>([]);

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'arrivals' | 'departures'>('arrivals');

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!icao) return;

                // Parallel fetch
                const [weatherData, arrivalsData, departuresData, liveData] = await Promise.all([
                    fetchAPI(`/weather/${icao}`).catch(() => null),
                    fetchAPI(`/airports/${icao}/arrivals`).catch(() => []),
                    fetchAPI(`/airports/${icao}/departures`).catch(() => []),
                    fetchAPI(`/airports/${icao}/live`).catch(() => [])
                ]);

                setWeather(weatherData);
                setArrivals(arrivalsData.slice(0, 20));
                setDepartures(departuresData.slice(0, 20));
                setLiveFlights(liveData);
            } catch (err) {
                console.error('Failed to load airport data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [icao]);

    const formatTime = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getAirlineLogo = (callsign: string | null) => {
        if (!callsign || callsign.length < 3) return null;
        const code = callsign.substring(0, 3).toUpperCase();
        return `https://images.kiwi.com/airlines/64/${code}.png`;
    };

    const toggleWatch = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (isWatched(id)) {
            removeFromWatchlist(id);
        } else {
            addToWatchlist(id);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-8 font-mono">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700 pb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="bg-slate-800 hover:bg-slate-700 p-2 rounded text-slate-400 hover:text-white transition-colors"
                        >
                            ← Back
                        </button>
                        <div>
                            <h1 className="text-4xl font-bold text-white tracking-widest">{icao}</h1>
                            <p className="text-slate-400">{weather?.city || 'Unknown Location'}</p>
                        </div>
                    </div>

                    {weather && (
                        <div className="flex gap-6 bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                            <div>
                                <div className="text-xs text-slate-500 uppercase">Temp</div>
                                <div className="text-2xl font-bold text-yellow-500">{formatTemp(weather.temperature)}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 uppercase">Wind</div>
                                <div className="font-bold">{formatSpeed(weather.wind_speed / 3.6)}</div>
                                <div className="text-xs text-slate-500">{weather.wind_direction}°</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 uppercase">Condition</div>
                                <div className="font-bold">{weather.condition_code}</div>
                                <div className="text-xs text-slate-500">{weather.is_day ? 'Day' : 'Night'}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Stats & Charts */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-800/40 border border-slate-700 p-4 rounded-lg">
                            <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">Live Traffic</h3>
                            <div className="text-3xl font-bold text-white">{liveFlights.length}</div>
                            <div className="text-xs text-slate-500">Aircraft nearby (50mi)</div>

                            <div className="mt-4 pt-4 border-t border-slate-700">
                                <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">On-Time Performance</h3>
                                <div className="text-3xl font-bold text-green-400">85%</div>
                                <div className="text-xs text-slate-500">Departures (Est)</div>
                            </div>
                        </div>

                        {/* Chart */}
                        {liveFlights.length > 0 && (
                            <AltitudeChart data={liveFlights} />
                        )}
                    </div>

                    {/* Right Column: Flight Boards */}
                    <div className="lg:col-span-2">
                        <div className="flex gap-4 mb-4">
                            <button
                                onClick={() => setActiveTab('arrivals')}
                                className={`px-6 py-2 rounded font-bold transition-all ${activeTab === 'arrivals' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                            >
                                Arrivals
                            </button>
                            <button
                                onClick={() => setActiveTab('departures')}
                                className={`px-6 py-2 rounded font-bold transition-all ${activeTab === 'departures' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                            >
                                Departures
                            </button>
                        </div>

                        <div className="bg-slate-800/40 border border-slate-700 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="p-4 w-10"></th>
                                        <th className="p-4 w-16">Airline</th>
                                        <th className="p-4">Time</th>
                                        <th className="p-4">Flight</th>
                                        <th className="p-4 text-right">
                                            {activeTab === 'arrivals' ? 'Origin' : 'Dest'}
                                        </th>
                                        <th className="p-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {activeTab === 'arrivals' ? (
                                        arrivals.length > 0 ? arrivals.map(flight => (
                                            <tr key={flight.icao24 + flight.lastSeen} className="hover:bg-slate-700/30">
                                                <td className="p-4">
                                                    <button
                                                        onClick={(e) => toggleWatch(flight.icao24, e)}
                                                        className="hover:bg-slate-700 p-1 rounded"
                                                    >
                                                        <Star
                                                            className={`w-4 h-4 ${isWatched(flight.icao24) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`}
                                                        />
                                                    </button>
                                                </td>
                                                <td className="p-4">
                                                    <img
                                                        src={getAirlineLogo(flight.callsign) || ''}
                                                        alt=""
                                                        className="w-6 h-6 object-contain opacity-70"
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                </td>
                                                <td className="p-4 font-mono">{formatTime(flight.lastSeen)}</td>
                                                <td className="p-4 font-bold text-white">{flight.callsign || flight.icao24}</td>
                                                <td className="p-4 text-right font-mono text-slate-300">{flight.estDepartureAirport || '---'}</td>
                                                <td className="p-4 text-right text-green-400">Arrived</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={6} className="p-8 text-center text-slate-500">No recent arrivals data available</td></tr>
                                        )
                                    ) : (
                                        departures.length > 0 ? departures.map(flight => (
                                            <tr key={flight.icao24 + flight.firstSeen} className="hover:bg-slate-700/30">
                                                <td className="p-4">
                                                    <button
                                                        onClick={(e) => toggleWatch(flight.icao24, e)}
                                                        className="hover:bg-slate-700 p-1 rounded"
                                                    >
                                                        <Star
                                                            className={`w-4 h-4 ${isWatched(flight.icao24) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`}
                                                        />
                                                    </button>
                                                </td>
                                                <td className="p-4">
                                                    <img
                                                        src={getAirlineLogo(flight.callsign) || ''}
                                                        alt=""
                                                        className="w-6 h-6 object-contain opacity-70"
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                </td>
                                                <td className="p-4 font-mono">{formatTime(flight.firstSeen)}</td>
                                                <td className="p-4 font-bold text-white">{flight.callsign || flight.icao24}</td>
                                                <td className="p-4 text-right font-mono text-slate-300">{flight.estArrivalAirport || '---'}</td>
                                                <td className="p-4 text-right text-amber-500">Departed</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={6} className="p-8 text-center text-slate-500">No recent departures data available</td></tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-right">Data based on recent OpenSky tracking events (approx. last 2 hours).</p>
                    </div>

                </div>
            </div>
        </main>
    );
}
