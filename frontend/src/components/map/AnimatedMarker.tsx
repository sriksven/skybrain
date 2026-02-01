'use client';

import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';

interface AnimatedMarkerProps {
    icao24: string;
    latitude: number;
    longitude: number;
    rotation: number;
    callsign: string | null;
    originCountry: string;
    altitude: number | null;
    velocity: number | null;
}

// Animation duration in ms
const ANIMATION_DURATION = 30000;
const FRAME_INTERVAL = 50;

export default function AnimatedMarker({
    icao24,
    latitude,
    longitude,
    rotation,
    callsign,
    originCountry,
    altitude,
    velocity,
}: AnimatedMarkerProps) {
    const map = useMap();
    const markerRef = useRef<any>(null);
    const prevPosRef = useRef<{ lat: number; lng: number } | null>(null);
    const animationRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const [L, setL] = useState<any>(null);

    // Load Leaflet on client side
    useEffect(() => {
        import('leaflet').then((leaflet) => {
            setL(leaflet.default);
        });
    }, []);

    // Create plane icon with rotation
    const createIcon = (rot: number) => {
        if (!L) return null;
        return L.divIcon({
            className: 'animated-plane-marker',
            html: `<div style="transform: rotate(${rot}deg); font-size: 20px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">✈️</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        });
    };

    // Popup content
    const createPopupContent = () => {
        return `
      <div style="min-width: 180px; font-family: system-ui, sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="font-size: 16px; color: #3b82f6;">${callsign || 'N/A'}</strong>
          <span style="font-size: 10px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${icao24}</span>
        </div>
        <div style="font-size: 13px; color: #475569;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Origin:</span>
            <strong>${originCountry}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Altitude:</span>
            <strong>${altitude ? Math.round(altitude).toLocaleString() + ' m' : '---'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Speed:</span>
            <strong>${velocity ? Math.round(velocity * 3.6) + ' km/h' : '---'}</strong>
          </div>
        </div>
      </div>
    `;
    };

    // Linear interpolation
    const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

    // Animate marker position
    const animate = () => {
        if (!markerRef.current || !prevPosRef.current) return;

        const elapsed = Date.now() - startTimeRef.current;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

        const currentLat = lerp(prevPosRef.current.lat, latitude, progress);
        const currentLng = lerp(prevPosRef.current.lng, longitude, progress);

        markerRef.current.setLatLng([currentLat, currentLng]);

        if (progress < 1) {
            animationRef.current = window.setTimeout(animate, FRAME_INTERVAL);
        }
    };

    // Create and update marker
    useEffect(() => {
        if (!L || !map) return;

        const icon = createIcon(rotation);
        if (!icon) return;

        if (!markerRef.current) {
            // Create marker
            markerRef.current = L.marker([latitude, longitude], { icon })
                .bindPopup(createPopupContent())
                .addTo(map);
            prevPosRef.current = { lat: latitude, lng: longitude };
        } else {
            // Update existing marker
            markerRef.current.setIcon(icon);
            markerRef.current.setPopupContent(createPopupContent());

            // Cancel any ongoing animation
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }

            // Start new animation
            startTimeRef.current = Date.now();
            animate();
            prevPosRef.current = { lat: latitude, lng: longitude };
        }

        return () => {
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }
        };
    }, [L, latitude, longitude, rotation, map]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }
        };
    }, []);

    return null;
}
