'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchAPI } from '@/lib/api';
import { useUnits } from '@/context/UnitContext';
import FAATicker from '@/components/dashboard/FAATicker';

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
  const { unitSystem, toggleUnitSystem, formatAltitude, formatSpeed, formatTemp } = useUnits();

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
  const [timeToNextUpdate, setTimeToNextUpdate] = useState(10);

  const fetchFlights = useCallback(async () => {
    try {
      const data = await fetchAPI('/flights/live');
      setFlights(data.slice(0, 500));
      setError(null);
      setTimeToNextUpdate(10); // Reset timer
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

      return matchesSearch && matchesCountry;
    });
  }, [flights, searchQuery, countryFilter]);

  const countries = useMemo(() => {
    const list = Array.from(new Set(flights.map(f => f.origin_country))).sort();
    return list;
  }, [flights]);

  const getAirlineLogo = (callsign: string | null) => {
    if (!callsign || callsign.length < 3) return null;
    const code = callsign.substring(0, 3).toUpperCase();
    return `https://images.kiwi.com/airlines/64/${code}.png`;
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
            {/* Simple Toggle */}
            <button
              onClick={toggleUnitSystem}
              className="bg-slate-800 border border-slate-600 px-3 py-1 rounded text-xs font-bold hover:bg-slate-700 transition-colors"
            >
              {unitSystem === 'metric' ? 'METRIC' : 'IMPERIAL'}
            </button>

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
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <form onSubmit={fetchWeather} className="flex gap-2 relative">
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
                {weatherLoading ? '...' : 'Check'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    setWeatherLoading(true);
                    navigator.geolocation.getCurrentPosition(async (pos) => {
                      try {
                        const res = await fetchAPI(`/airports/nearest?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
                        setAirportCode(res.code);
                        // Trigger weather fetch immediately
                        const weatherRes = await fetchAPI(`/weather/${res.code}`);
                        setWeatherData(weatherRes);
                      } catch (e) {
                        setWeatherError('Could not find nearest airport');
                      } finally {
                        setWeatherLoading(false);
                      }
                    });
                  }
                }}
                className="text-xs text-slate-400 hover:text-blue-400 underline ml-2"
                title="Use my location"
              >
                📍 My Local
              </button>
            </form>

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
                  <th className="p-4 w-16">Airline</th>
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
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No flights match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredFlights.map((flight) => (
                    <tr key={flight.icao24} className="hover:bg-slate-700/50 transition-colors group">
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
                      <td className="p-4 font-mono font-bold text-blue-400 group-hover:text-blue-300 text-xs">
                        {flight.icao24}
                      </td>
                      <td className="p-4 font-bold text-white">
                        {flight.callsign || <span className="text-slate-600 italic">No Callsign</span>}
                      </td>
                      <td className="p-4 text-slate-300">{flight.origin_country}</td>
                      <td className="p-4 text-right font-mono text-slate-300">
                        {flight.baro_altitude ? formatAltitude(flight.baro_altitude) : '-'}
                      </td>
                      <td className="p-4 text-right font-mono text-slate-300">
                        {flight.velocity ? formatSpeed(flight.velocity) : '-'}
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
