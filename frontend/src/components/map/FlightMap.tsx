'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { fetchAPI } from '@/lib/api';
import 'leaflet/dist/leaflet.css';

// Dynamic imports for Leaflet components
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

// Import AnimatedMarker dynamically
const AnimatedMarker = dynamic(
  () => import('./AnimatedMarker'),
  { ssr: false }
);

interface Flight {
  icao24: string;
  callsign: string | null;
  origin_country: string;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  velocity: number | null;
  true_track: number | null;
  on_ground: boolean;
}

// Inner map component that has access to useMap
function MapContent({ flights, tracks }: { flights: Flight[], tracks: Record<string, [number, number][]> }) {
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Flight Tracks */}
      {Object.entries(tracks).map(([icao24, positions]) => (
        positions.length > 1 && (
          <Polyline
            key={`track-${icao24}`}
            positions={positions}
            pathOptions={{ color: '#3b82f6', weight: 2, opacity: 0.5, dashArray: '5, 5' }}
          />
        )
      ))}

      {/* Flight Markers */}
      {flights.map((flight) => (
        flight.latitude && flight.longitude && (
          <AnimatedMarker
            key={flight.icao24}
            icao24={flight.icao24}
            latitude={flight.latitude}
            longitude={flight.longitude}
            rotation={flight.true_track || 0}
            callsign={flight.callsign}
            originCountry={flight.origin_country}
            altitude={flight.baro_altitude}
            velocity={flight.velocity}
          />
        )
      ))}
    </>
  );
}

export default function FlightMap() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [tracks, setTracks] = useState<Record<string, [number, number][]>>({});
  const [loading, setLoading] = useState(false); // Initial load only
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Request location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          console.error("Location access denied or failed:", err);
          setPermissionDenied(true);
          // Fallback to default fetch (global or default area if we wanted)
          setError("Location access needed to show flights around you.");
        }
      );
    } else {
      setError("Geolocation not supported by your browser.");
    }
  }, []);

  const fetchFlights = useCallback(async () => {
    if (!userLocation && !permissionDenied) return; // Wait for location decision

    try {
      const params = new URLSearchParams();

      if (userLocation) {
        // Calculate ~100 mile bbox (approx 1.5 degrees lat/lon for simplicity)
        // 1 degree lat ~= 69 miles
        // 1 degree lon ~= 69 miles * cos(lat)
        const radiusDeg = 1.5;
        params.append('lamin', (userLocation.lat - radiusDeg).toString());
        params.append('lamax', (userLocation.lat + radiusDeg).toString());
        params.append('lomin', (userLocation.lng - radiusDeg).toString());
        params.append('lomax', (userLocation.lng + radiusDeg).toString());
      }

      setError(null);
      const data = await fetchAPI(`/flights/live?${params.toString()}`);

      const validFlights = data.filter((f: Flight) =>
        f.longitude !== null &&
        f.latitude !== null &&
        !f.on_ground
      );

      setFlights(validFlights);
      setLastUpdate(new Date());

      // Update flight tracks
      setTracks(prev => {
        const newTracks = { ...prev };
        validFlights.forEach((f: Flight) => {
          if (f.latitude && f.longitude) {
            if (!newTracks[f.icao24]) {
              newTracks[f.icao24] = [];
            }
            // Add new position
            const lastPos = newTracks[f.icao24][newTracks[f.icao24].length - 1];
            // Only add if position moved significantly to avoid clutter
            if (!lastPos || (lastPos[0] !== f.latitude || lastPos[1] !== f.longitude)) {
              newTracks[f.icao24] = [...newTracks[f.icao24], [f.latitude, f.longitude]];
              // Limit track history length
              if (newTracks[f.icao24].length > 20) {
                newTracks[f.icao24] = newTracks[f.icao24].slice(-20);
              }
            }
          }
        });

        // Optional: Clean up stale tracks for flights no longer visible
        const activeIcaos = new Set(validFlights.map((f: Flight) => f.icao24));
        Object.keys(newTracks).forEach(key => {
          if (!activeIcaos.has(key)) {
            delete newTracks[key];
          }
        });

        return newTracks;
      });

    } catch (err) {
      console.error('Failed to fetch flights:', err);
      setError('Failed to load flight data');
    } finally {
      setLoading(false);
    }
  }, [userLocation, permissionDenied]);

  useEffect(() => {
    if (userLocation || permissionDenied) {
      setLoading(true);
      fetchFlights();
      const interval = setInterval(fetchFlights, 10000); // Faster updates for local view? 10s is better for tracks
      return () => clearInterval(interval);
    }
  }, [fetchFlights, userLocation, permissionDenied]);

  if (!isClient) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900">
        <div className="text-white text-xl">Initializing...</div>
      </div>
    );
  }

  // Waiting for location
  if (!userLocation && !permissionDenied && !error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
        <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p>Requesting your location to show nearby flights...</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-slate-900">
      {/* Stats Overlay */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-[9999] bg-slate-900/90 backdrop-blur-md text-white p-3 sm:p-4 rounded-xl shadow-2xl border border-slate-700/50">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-xs sm:text-sm uppercase tracking-wider text-slate-400">
            {userLocation ? 'Local Traffic (100mi)' : 'Global Traffic'}
          </h3>
        </div>
        <p className="text-xl sm:text-2xl font-bold">
          {loading ? '...' : flights.length.toLocaleString()}
          <span className="text-xs sm:text-sm font-normal text-slate-400 ml-1">aircraft</span>
        </p>
        <div className="text-[10px] sm:text-xs text-slate-500 mt-2 flex flex-col gap-1">
          <span>Updates every 10s</span>
          {lastUpdate && (
            <span>Last: {lastUpdate.toLocaleTimeString()}</span>
          )}
        </div>
        {error && (
          <div className="mt-2 text-red-400 text-xs">{error}</div>
        )}
        {permissionDenied && (
          <div className="mt-2 text-amber-400 text-xs">
            Location denied. Showing global view (restricted performance).
          </div>
        )}
      </div>

      <MapContainer
        center={userLocation ? [userLocation.lat, userLocation.lng] : [20, 0]}
        zoom={userLocation ? 8 : 2}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <MapContent flights={flights} tracks={tracks} />
      </MapContainer>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[9999] sm:hidden">
        <div className="bg-slate-800/80 text-slate-300 text-xs px-3 py-1.5 rounded-full backdrop-blur">
          Pinch to zoom • Tap plane for details
        </div>
      </div>
    </div>
  );
}
