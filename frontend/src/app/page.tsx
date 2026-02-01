'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { fetchAPI } from '@/lib/api';
import { useUnits } from '@/context/UnitContext';
import { useWatchlist } from '@/context/WatchlistContext';
import FAATicker from '@/components/dashboard/FAATicker';
import SkyBrainChat from '@/components/ai/SkyBrainChat';
import FlightDetailPanel from '@/components/FlightDetailPanel';
// Import icons from lucide-react
import { Plane, Helicopter, Star, Map as MapIcon, List as ListIcon, Info } from 'lucide-react';

const HeatmapView = dynamic(() => import('@/components/map/HeatmapView'), {
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-slate-800 animate-pulse rounded-lg border border-slate-700 flex items-center justify-center text-slate-500">Loading Map...</div>
});

interface Flight {
  icao24: string;
  callsign: string | null;
  origin_country: string;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  geo_altitude: number | null;
  velocity: number | null;
  vertical_rate: number | null;
  true_track: number | null;
  squawk: string | null;
  category: number;
  position_source: number;
  last_contact: number;
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

export default function Home() {
  const { unitSystem, toggleUnitSystem, formatAltitude, formatSpeed, formatTemp } = useUnits();
  const { isWatched, addToWatchlist, removeFromWatchlist } = useWatchlist();

  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Features State
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  // Set default to Logan (KBOS) as requested
  const [airportCode, setAirportCode] = useState('KBOS');
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'heatmap'>('list');

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [timeToNextUpdate, setTimeToNextUpdate] = useState(10);
  const [airportList, setAirportList] = useState<any[]>([]);

  // Detailed Flight State
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [flightHistory, setFlightHistory] = useState<any[]>([]);

  useEffect(() => {
    if (selectedFlight) {
      fetchAPI(`/flights/${selectedFlight.icao24}/track`)
        .then(setFlightHistory)
        .catch(e => console.error("Track error", e));
    }
  }, [selectedFlight]);

  // Fetch Airport List for Dropdown
  useEffect(() => {
    fetchAPI('/airports/list').then(data => setAirportList(data)).catch(console.error);
  }, []);

  const fetchFlights = useCallback(async () => {
    try {
      const data = await fetchAPI('/flights/live');
      setFlights(data.slice(0, 3000)); // Increase limit for heatmap
      setError(null);
      setTimeToNextUpdate(10); // Reset timer
    } catch (err) {
      console.error('Failed to fetch flights:', err);
      setError('Failed to load flight data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWeather = async () => {
    if (!airportCode) return;

    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const data = await fetchAPI(`/weather/${airportCode}`);
      setWeatherData(data);
    } catch (err) {
      setWeatherError('Airport not found or weather unavailable');
      setWeatherData(null);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Initial Fetch: Flights + Default Weather (KBOS)
  useEffect(() => {
    fetchFlights();
    fetchWeather();

    const mockInterval = setInterval(() => {
      setTimeToNextUpdate(prev => Math.max(0, prev - 1));
    }, 1000);
    const interval = setInterval(fetchFlights, 10000);
    return () => {
      clearInterval(interval);
      clearInterval(mockInterval);
    };
  }, [fetchFlights]);

  const filteredFlights = useMemo(() => {
    return flights.filter(f => {
      const matchesSearch = searchQuery === '' ||
        (f.callsign && f.callsign.toLowerCase().includes(searchQuery.toLowerCase())) ||
        f.icao24.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCountry = countryFilter === '' ||
        f.origin_country === countryFilter;

      const matchesWatchlist = !showWatchlistOnly || isWatched(f.icao24);

      return matchesSearch && matchesCountry && matchesWatchlist;
    });
  }, [flights, searchQuery, countryFilter, showWatchlistOnly, isWatched]);

  const countries = useMemo(() => {
    const list = Array.from(new Set(flights.map(f => f.origin_country))).sort();
    return list;
  }, [flights]);

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

  // Helper to determine row style based on Squawk
  const getSquawkStyle = (squawk: string | null) => {
    if (!squawk) return '';
    if (squawk === '7700') return 'bg-red-900/40 border-l-4 border-l-red-500 animate-pulse'; // Emergency
    if (squawk === '7600') return 'bg-orange-900/40 border-l-4 border-l-orange-500'; // Radio Loss
    if (squawk === '7500') return 'bg-red-900/60 border-l-4 border-l-red-600 animate-pulse'; // Hijack
    return '';
  };

  const getCategoryIcon = (cat: number) => {
    switch (cat) {
      case 8: return <Helicopter className="w-5 h-5 text-green-400" aria-label="Helicopter" />;
      case 6: return <Plane className="w-6 h-6 text-purple-400" aria-label="Heavy Aircraft" />;
      case 5: return <Plane className="w-6 h-6 text-purple-400" aria-label="Heavy Aircraft" />;
      case 4: return <Plane className="w-5 h-5 text-blue-400" aria-label="Large Aircraft" />;
      case 2:
      case 3: return <Plane className="w-4 h-4 text-slate-400" aria-label="Light Aircraft" />;
      case 9: return <Plane className="w-4 h-4 text-yellow-400 rotate-45" aria-label="Glider" />;
      default: return <Plane className="w-5 h-5 text-slate-500" aria-label="Unknown" />;
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-200 p-8 font-mono">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header & Stats */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">SkyBrain Flight Data</h1>
            <p className="text-slate-400">Raw feed from OpenSky Network</p>
          </div>

          <div className="flex gap-6 items-center">
            <button
              onClick={toggleUnitSystem}
              className="bg-slate-800 border border-slate-600 px-3 py-1 rounded text-xs font-bold hover:bg-slate-700 transition-colors"
            >
              {unitSystem === 'metric' ? 'METRIC' : 'IMPERIAL'}
            </button>

            <Link
              href="/how-to-use"
              className="bg-slate-800 border border-slate-600 px-3 py-1 rounded text-xs font-bold hover:bg-slate-700 transition-colors text-slate-300"
            >
              HOW TO USE
            </Link>

            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase mb-1">Update in</div>
              <div className="h-1 w-24 bg-slate-800 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${(timeToNextUpdate / 10) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="text-right border-l border-slate-700 pl-6">
              <div className="text-2xl font-bold text-blue-400">{filteredFlights.length}</div>
              <div className="text-xs text-slate-500 uppercase">Visible</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-600">{flights.length}</div>
              <div className="text-xs text-slate-500 uppercase">Total</div>
            </div>
          </div>
        </header>

        {/* FAA Ticker */}
        <FAATicker />

        {/* Airport Weather Widget */}
        <section className="bg-slate-800/40 p-6 rounded-lg border border-slate-700">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            ☁️ Airport Weather Check
          </h2>
          <div className="flex flex-col gap-4 w-full">

            <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-900/50 p-4 rounded border border-slate-700">
              {/* 1. City / State Search */}
              <div className="flex flex-col gap-1 w-full md:w-auto">
                <label className="text-xs text-slate-400 uppercase font-bold">Search City / State</label>
                <input
                  list="city-suggestions"
                  placeholder="Type City (e.g. Boston)..."
                  className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white w-full md:w-64 focus:border-blue-500 outline-none"
                  onChange={(e) => {
                    // Find matching airport logic
                    const val = e.target.value;
                    // Search by City or Name
                    const match = airportList.find(a =>
                      a.city.toLowerCase() === val.toLowerCase() ||
                      a.name.toLowerCase() === val.toLowerCase()
                    );
                    if (match) {
                      setAirportCode(match.code);
                    }
                  }}
                />
                <datalist id="city-suggestions">
                  {airportList.map((a) => (
                    <option key={a.code} value={a.city}>{a.name} ({a.code})</option>
                  ))}
                </datalist>
              </div>

              <div className="text-slate-500 pb-2 hidden md:block">→</div>

              {/* 2. Direct ICAO Code */}
              <div className="flex flex-col gap-1 w-full md:w-auto">
                <label className="text-xs text-slate-400 uppercase font-bold">Airport Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={airportCode}
                    onChange={(e) => setAirportCode(e.target.value.toUpperCase())}
                    placeholder="KBOS"
                    className="bg-slate-950 border border-slate-700 rounded px-4 py-2 text-white w-full md:w-24 font-mono text-center focus:border-blue-500 outline-none"
                    maxLength={4}
                  />
                  <button
                    onClick={fetchWeather}
                    disabled={weatherLoading}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 font-bold whitespace-nowrap"
                  >
                    {weatherLoading ? '...' : 'Check'}
                  </button>
                </div>
              </div>

              <div className="border-l border-slate-700 pl-4 ml-2 hidden md:block">
                <button
                  type="button"
                  disabled={weatherLoading}
                  onClick={() => {
                    if (navigator.geolocation) {
                      setWeatherLoading(true);
                      setWeatherError(null);
                      navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                          try {
                            const res = await fetchAPI(`/airports/nearest?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
                            setAirportCode(res.code);
                            // Fetch weather for the found airport code immediately
                            try {
                              const weatherRes = await fetchAPI(`/weather/${res.code}`);
                              setWeatherData(weatherRes);
                            } catch (innerErr) {
                              // If weather fetch fails, we still set the code
                            }
                          } catch (e) {
                            setWeatherError('Could not find nearest major airport');
                          } finally {
                            setWeatherLoading(false);
                          }
                        },
                        (err) => {
                          console.error("Geolocation Error:", err);
                          // Fallback logic
                          const manual = window.prompt("Location failed. Enter Airport Code (e.g. KBOS):", "KBOS");
                          if (manual) {
                            setAirportCode(manual.toUpperCase());
                            fetchAPI(`/weather/${manual.toUpperCase()}`).then(setWeatherData).catch(() => setWeatherError('Airport not found'));
                          } else {
                            let msg = 'Location failed.';
                            if (err.code === 1) msg = 'Location denied. Check browser settings.';
                            else if (err.code === 2) msg = 'Location unavailable.';
                            else if (err.code === 3) msg = 'Location timed out.';
                            setWeatherError(msg);
                          }
                          setWeatherLoading(false);
                        },
                        { timeout: 10000, enableHighAccuracy: false }
                      );
                    } else {
                      setWeatherError('Geolocation not supported');
                    }
                  }}
                  className="text-xs text-slate-400 hover:text-blue-400 underline ml-2 disabled:opacity-50"
                  title="Find nearest airport"
                >
                  {weatherLoading ? 'Locating...' : '📍 My Local'}
                </button>

              </div>
            </div>

            {weatherError && (
              <div className="text-red-400 py-2">{weatherError}</div>
            )}

            {weatherData && (
              <div className="flex-1 bg-slate-900/50 p-4 rounded border border-slate-700/50 relative group">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-slate-500 uppercase">Airport</div>
                    <div className="font-bold text-white flex items-center gap-2">
                      {weatherData.airport}
                      <a href={`/airport/${airportCode}`} className="text-[10px] bg-blue-900/50 text-blue-300 px-1.5 rounded border border-blue-800 hover:bg-blue-800 transition-colors">
                        VIEW BOARD →
                      </a>
                    </div>
                    <div className="text-xs text-slate-400">{weatherData.city}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase">Temp</div>
                    <div className="font-bold text-xl text-yellow-400">{formatTemp(weatherData.temperature)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase">Wind</div>
                    <div className="font-bold text-white">{formatSpeed(weatherData.wind_speed / 3.6)}</div>
                    <div className="text-xs text-slate-400">Dir: {weatherData.wind_direction}°</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase">Condition</div>
                    <div className="font-bold text-white">Code: {weatherData.condition_code}</div>
                    <div className="text-xs text-slate-400">{weatherData.is_day ? 'Day' : 'Night'}time</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Filters & Controls */}
        <section className="flex flex-col md:flex-row gap-4 bg-slate-800/20 p-4 rounded-lg items-end">
          <div className="flex-1">
            <label className="block text-xs text-slate-500 uppercase mb-1">Search Flight</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Callsign (e.g. UAL123) or ICAO24..."
              className="bg-slate-950 border border-slate-700 rounded px-4 py-2 text-white w-full focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-slate-500 uppercase mb-1">Origin Country</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-4 py-2 text-white w-full focus:border-blue-500 outline-none appearance-none"
            >
              <option value="">All Countries</option>
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'heatmap' : 'list')}
              className={`px-4 py-2 rounded flex items-center gap-2 border font-bold transition-colors ${viewMode === 'heatmap'
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
            >
              {viewMode === 'list' ? <MapIcon className="w-4 h-4" /> : <ListIcon className="w-4 h-4" />}
              {viewMode === 'list' ? 'Heatmap' : 'List'}
            </button>

            <button
              onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
              className={`px-4 py-2 rounded flex items-center gap-2 border font-bold transition-colors ${showWatchlistOnly
                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
            >
              <Star className={`w-4 h-4 ${showWatchlistOnly ? 'fill-yellow-400' : ''}`} />
              {showWatchlistOnly ? 'Only Watched' : 'Watchlist'}
            </button>
          </div>
        </section>

        {/* Content View */}
        {loading && <div className="text-center py-20 animate-pulse">Loading live stream...</div>}

        {
          error && !loading && (
            <div className="p-4 bg-red-900/30 border border-red-700 text-red-300 rounded">
              {error}
            </div>
          )
        }

        {
          !loading && !error && (
            <>
              {viewMode === 'heatmap' ? (
                <HeatmapView flights={filteredFlights} />
              ) : (
                <div className="overflow-x-auto border border-slate-700 rounded-lg shadow-xl bg-slate-800/50">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-xs sticky top-0">
                      <tr>
                        <th className="p-4 w-10"></th>
                        <th className="p-4 w-12 text-center">Type</th>
                        <th className="p-4 w-16">Airline</th>
                        <th className="p-4">Flight</th>
                        <th className="p-4">Country</th>
                        <th className="p-4 group relative cursor-help">
                          <span className="border-b border-dashed border-slate-600">Squawk</span>
                          <div className="hidden group-hover:block absolute bottom-full left-0 w-48 p-2 bg-slate-800 border border-slate-600 text-xs text-slate-300 rounded shadow-xl z-10 mb-2">
                            Transponder code. <br /> 7700 = Emergency
                          </div>
                        </th>
                        <th className="p-4 text-right">Altitude</th>
                        <th className="p-4 text-right">Speed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {filteredFlights.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500">
                            {showWatchlistOnly
                              ? "Your watchlist is empty or no watched flights are currently active."
                              : "No flights match your search criteria."}
                          </td>
                        </tr>
                      ) : (
                        filteredFlights.map((flight) => (
                          <tr
                            key={flight.icao24}
                            onClick={() => setSelectedFlight(flight)}
                            className={`hover:bg-slate-700/50 transition-colors group cursor-pointer ${getSquawkStyle(flight.squawk)}`}
                          >
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
                            <td className="p-4 flex justify-center items-center">
                              {getCategoryIcon(flight.category)}
                            </td>
                            <td className="p-4">
                              {flight.callsign && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={getAirlineLogo(flight.callsign) || ''}
                                  alt="logo"
                                  className="w-8 h-8 object-contain opacity-80"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              )}
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-white">
                                {flight.callsign || <span className="text-slate-600 italic">No Callsign</span>}
                              </div>
                              <div className="font-mono text-blue-400/80 text-xs cursor-help" title={`ICAO24 ID: ${flight.icao24}`}>
                                {flight.icao24}
                              </div>
                            </td>
                            <td className="p-4 text-slate-300 text-xs">{flight.origin_country}</td>
                            <td className="p-4 font-mono text-xs">
                              {flight.squawk ? (
                                <span className={`px-2 py-0.5 rounded ${['7700', '7600', '7500'].includes(flight.squawk) ? 'bg-red-600 text-white font-bold' : 'bg-slate-800 text-slate-400'}`}>
                                  {flight.squawk}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="p-4 text-right font-mono text-slate-300">
                              {flight.baro_altitude ? formatAltitude(flight.baro_altitude) : '-'}
                            </td>
                            <td className="p-4 text-right font-mono text-slate-300">
                              {flight.velocity ? formatSpeed(flight.velocity) : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )
        }

        {/* AI Chat Widget */}
        <SkyBrainChat />

        <FlightDetailPanel
          flight={selectedFlight}
          history={flightHistory}
          onClose={() => setSelectedFlight(null)}
        />

      </div >
    </main >
  );
}
