'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchAPI } from '@/lib/api';

interface Flight {
  icao24: string;
  callsign: string | null;
  origin_country: string;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  velocity: number | null;
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
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Features State
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [airportCode, setAirportCode] = useState('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const fetchFlights = useCallback(async () => {
    try {
      const data = await fetchAPI('/flights/live');
      // Show more flights since we have filters now
      setFlights(data.slice(0, 500));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch flights:', err);
      setError('Failed to load flight data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWeather = async (e: React.FormEvent) => {
    e.preventDefault();
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

  useEffect(() => {
    fetchFlights();
    const interval = setInterval(fetchFlights, 10000);
    return () => clearInterval(interval);
  }, [fetchFlights]);

  // Derived state for filtering
  const filteredFlights = useMemo(() => {
    return flights.filter(f => {
      const matchesSearch = searchQuery === '' ||
        (f.callsign && f.callsign.toLowerCase().includes(searchQuery.toLowerCase())) ||
        f.icao24.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCountry = countryFilter === '' ||
        f.origin_country === countryFilter;

      return matchesSearch && matchesCountry;
    });
  }, [flights, searchQuery, countryFilter]);

  // Unique countries for dropdown
  const countries = useMemo(() => {
    const list = Array.from(new Set(flights.map(f => f.origin_country))).sort();
    return list;
  }, [flights]);

  return (
    <main className="min-h-screen bg-slate-900 text-slate-200 p-8 font-mono">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header & Stats */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">SkyBrain Flight Data</h1>
            <p className="text-slate-400">Raw feed from OpenSky Network</p>
          </div>
          <div className="flex gap-8 text-right">
            <div>
              <div className="text-2xl font-bold text-blue-400">{filteredFlights.length}</div>
              <div className="text-xs text-slate-500 uppercase">Visible</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-600">{flights.length}</div>
              <div className="text-xs text-slate-500 uppercase">Total Loaded</div>
            </div>
          </div>
        </header>

        {/* Airport Weather Widget */}
        <section className="bg-slate-800/40 p-6 rounded-lg border border-slate-700">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            ☁️ Airport Weather Check
          </h2>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <form onSubmit={fetchWeather} className="flex gap-2">
              <input
                type="text"
                value={airportCode}
                onChange={(e) => setAirportCode(e.target.value.toUpperCase())}
                placeholder="ICAO Code (e.g. KJFK)"
                className="bg-slate-950 border border-slate-700 rounded px-4 py-2 text-white w-48 focus:border-blue-500 outline-none"
                maxLength={4}
              />
              <button
                type="submit"
                disabled={weatherLoading}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {weatherLoading ? 'Loading...' : 'Check'}
              </button>
            </form>

            {weatherError && (
              <div className="text-red-400 py-2">{weatherError}</div>
            )}

            {weatherData && (
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/50 p-4 rounded border border-slate-700/50">
                <div>
                  <div className="text-xs text-slate-500 uppercase">Airport</div>
                  <div className="font-bold text-white">{weatherData.airport}</div>
                  <div className="text-xs text-slate-400">{weatherData.city}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase">Temp</div>
                  <div className="font-bold text-xl text-yellow-400">{weatherData.temperature}°F</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase">Wind</div>
                  <div className="font-bold text-white">{weatherData.wind_speed} mph</div>
                  <div className="text-xs text-slate-400">Dir: {weatherData.wind_direction}°</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase">Condition</div>
                  {/* Simplified mapping relative to WMO codes */}
                  <div className="font-bold text-white">Code: {weatherData.condition_code}</div>
                  <div className="text-xs text-slate-400">{weatherData.is_day ? 'Day' : 'Night'}time</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Filters & Search */}
        <section className="flex flex-col md:flex-row gap-4 bg-slate-800/20 p-4 rounded-lg">
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
        </section>

        {/* Flight Data Table */}
        {loading && <div className="text-center py-20 animate-pulse">Loading live stream...</div>}

        {error && !loading && (
          <div className="p-4 bg-red-900/30 border border-red-700 text-red-300 rounded">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto border border-slate-700 rounded-lg shadow-xl bg-slate-800/50">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-xs sticky top-0">
                <tr>
                  <th className="p-4">ICAO24</th>
                  <th className="p-4">Callsign</th>
                  <th className="p-4">Origin Country</th>
                  <th className="p-4 text-right">Altitude</th>
                  <th className="p-4 text-right">Velocity</th>
                  <th className="p-4 text-right">Pos (Lat/Lon)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredFlights.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No flights match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredFlights.map((flight) => (
                    <tr key={flight.icao24} className="hover:bg-slate-700/50 transition-colors group">
                      <td className="p-4 font-mono font-bold text-blue-400 group-hover:text-blue-300">
                        {flight.icao24}
                      </td>
                      <td className="p-4 font-bold text-white">
                        {flight.callsign || <span className="text-slate-600 italic">No Callsign</span>}
                      </td>
                      <td className="p-4 text-slate-300">{flight.origin_country}</td>
                      <td className="p-4 text-right font-mono text-slate-300">
                        {flight.baro_altitude?.toLocaleString()} <span className="text-slate-600 text-xs">m</span>
                      </td>
                      <td className="p-4 text-right font-mono text-slate-300">
                        {flight.velocity?.toFixed(1)} <span className="text-slate-600 text-xs">m/s</span>
                      </td>
                      <td className="p-4 text-right font-mono text-xs text-slate-500">
                        {flight.latitude?.toFixed(2)}, {flight.longitude?.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
