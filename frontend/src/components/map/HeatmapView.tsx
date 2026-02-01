import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

// Fix Leaflet icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface HeatmapProps {
    points: [number, number, number][]; // lat, lon, intensity
}

function HeatmapLayer({ points }: HeatmapProps) {
    const map = useMap();

    useEffect(() => {
        if (!points.length) return;

        // @ts-ignore - leaflet.heat adds heatLayer to L
        const heat = L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 18,
            max: 1.0,
            gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
        }).addTo(map);

        return () => {
            map.removeLayer(heat);
        };
    }, [map, points]);

    return null;
}

export default function HeatmapView({ flights }: { flights: any[] }) {
    // Transform flights to heat points
    // intensity 0.5 default, maybe higher if more clustered
    const points: [number, number, number][] = flights
        .filter(f => f.latitude && f.longitude)
        .map(f => [f.latitude!, f.longitude!, 0.6]);

    // Find center if possible or default to User location logic from earlier page
    // For now default to US View or 0,0
    const center: [number, number] = [39.82, -98.57]; // US Center

    return (
        <div className="h-[600px] w-full rounded-lg overflow-hidden border border-slate-700 relative z-0">
            <MapContainer
                center={center}
                zoom={4}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <HeatmapLayer points={points} />
            </MapContainer>
        </div>
    );
}
