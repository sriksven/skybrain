'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Use a simple mock notification for now, or browser API later
// We just store ICAO24 strings

interface WatchlistContextType {
    watchedFlights: string[];
    addToWatchlist: (icao24: string) => void;
    removeFromWatchlist: (icao24: string) => void;
    isWatched: (icao24: string) => boolean;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: ReactNode }) {
    const [watchedFlights, setWatchedFlights] = useState<string[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('skybrain-watchlist');
        if (saved) {
            try {
                setWatchedFlights(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse watchlist", e);
            }
        }
    }, []);

    const save = (list: string[]) => {
        localStorage.setItem('skybrain-watchlist', JSON.stringify(list));
        setWatchedFlights(list);
    };

    const addToWatchlist = (icao24: string) => {
        if (!watchedFlights.includes(icao24)) {
            save([...watchedFlights, icao24]);
            // Simple browser notification check
            if (Notification.permission === 'granted') {
                new Notification(`Flight ${icao24} added to watchlist`);
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
    };

    const removeFromWatchlist = (icao24: string) => {
        save(watchedFlights.filter(id => id !== icao24));
    };

    const isWatched = (icao24: string) => watchedFlights.includes(icao24);

    return (
        <WatchlistContext.Provider value={{
            watchedFlights,
            addToWatchlist,
            removeFromWatchlist,
            isWatched
        }}>
            {children}
        </WatchlistContext.Provider>
    );
}

export function useWatchlist() {
    const context = useContext(WatchlistContext);
    if (context === undefined) {
        throw new Error('useWatchlist must be used within a WatchlistProvider');
    }
    return context;
}
