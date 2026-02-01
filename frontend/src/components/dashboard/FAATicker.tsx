'use client';

import { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';

interface Alert {
    airport: string;
    status: string;
    reason: string;
    delay: string;
    url: string;
}

export default function FAATicker() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAlerts = async () => {
            try {
                const data = await fetchAPI('/faa/alerts');
                setAlerts(data);
            } catch (err) {
                console.error('Failed to load FAA alerts', err);
            } finally {
                setLoading(false);
            }
        };

        loadAlerts();
        const interval = setInterval(loadAlerts, 60000); // 1 min update
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="h-8 bg-slate-950/50 animate-pulse rounded my-2"></div>;

    if (alerts.length === 0) {
        return (
            <div className="bg-slate-900/50 border border-slate-800 text-slate-500 text-xs px-4 py-2 rounded flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                No active FAA ground stops or major delays reported.
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden bg-amber-900/20 border border-amber-800/50 rounded-lg h-10 flex items-center">
            <div className="absolute left-0 top-0 bottom-0 bg-amber-900/80 px-3 flex items-center z-10 text-xs font-bold text-amber-100 uppercase tracking-wider shadow-lg">
                FAA Alerts
            </div>

            {/* Marquee Animation */}
            <div className="flex gap-8 items-center animate-marquee whitespace-nowrap pl-24">
                {alerts.concat(alerts).map((alert, i) => ( // Duplicate for seamless loop
                    <div key={`${alert.airport}-${i}`} className="flex items-center gap-2 text-sm text-amber-200/90">
                        <span className="font-bold bg-amber-950/80 px-1.5 rounded text-amber-400">{alert.airport}</span>
                        <span className="font-semibold text-amber-100">{alert.status}</span>
                        {alert.reason && <span className="opacity-75">- {alert.reason}</span>}
                        {alert.delay && <span className="text-amber-300">({alert.delay})</span>}
                        <span className="text-amber-800 mx-2">•</span>
                    </div>
                ))}
            </div>

            <style jsx>{`
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
        </div>
    );
}
