'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UnitSystem = 'metric' | 'imperial';

interface UnitContextType {
    unitSystem: UnitSystem;
    toggleUnitSystem: () => void;
    convertAltitude: (meters: number) => number;
    convertSpeed: (mps: number) => number;
    convertTemp: (celsius: number) => number;
    formatAltitude: (meters: number) => string;
    formatSpeed: (mps: number) => string;
    formatTemp: (celsius: number) => string;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export function UnitProvider({ children }: { children: ReactNode }) {
    const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');

    // Load preference from local storage
    useEffect(() => {
        const saved = localStorage.getItem('skybrain-units') as UnitSystem;
        if (saved) setUnitSystem(saved);
    }, []);

    const toggleUnitSystem = () => {
        setUnitSystem((prev) => {
            const next = prev === 'metric' ? 'imperial' : 'metric';
            localStorage.setItem('skybrain-units', next);
            return next;
        });
    };

    const convertAltitude = (meters: number) => {
        return unitSystem === 'metric' ? meters : meters * 3.28084;
    };

    const convertSpeed = (mps: number) => {
        return unitSystem === 'metric' ? mps * 3.6 : mps * 2.23694; // m/s to km/h or mph
    };

    const convertTemp = (celsius: number) => {
        // OpenMeteo was returning F by default in my previous weather code, 
        // but standard raw weather data is often C. 
        // Let's assume standard C input for generic helpers, but handle context carefully.
        return unitSystem === 'metric' ? celsius : (celsius * 9 / 5) + 32;
    };

    const formatAltitude = (meters: number) => {
        const val = convertAltitude(meters);
        const unit = unitSystem === 'metric' ? 'm' : 'ft';
        return `${Math.round(val).toLocaleString()} ${unit}`;
    };

    const formatSpeed = (mps: number) => {
        const val = convertSpeed(mps);
        const unit = unitSystem === 'metric' ? 'km/h' : 'mph';
        return `${Math.round(val).toLocaleString()} ${unit}`;
    };

    const formatTemp = (celsius: number) => {
        const val = convertTemp(celsius);
        const unit = unitSystem === 'metric' ? '°C' : '°F';
        return `${Math.round(val)} ${unit}`;
    };

    return (
        <UnitContext.Provider value={{
            unitSystem,
            toggleUnitSystem,
            convertAltitude,
            convertSpeed,
            convertTemp,
            formatAltitude,
            formatSpeed,
            formatTemp
        }}>
            {children}
        </UnitContext.Provider>
    );
}

export function useUnits() {
    const context = useContext(UnitContext);
    if (context === undefined) {
        throw new Error('useUnits must be used within a UnitProvider');
    }
    return context;
}
