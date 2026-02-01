'use client';

import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Label
} from 'recharts';
import { useUnits } from '@/context/UnitContext';

interface ChartProps {
    data: any[];
}

export default function AltitudeChart({ data }: ChartProps) {
    const { unitSystem, formatAltitude, formatSpeed } = useUnits();

    // Transform data for chart
    const chartData = data.map(f => ({
        ...f,
        alt: unitSystem === 'metric' ? f.baro_altitude : (f.baro_altitude || 0) * 3.28084,
        vel: unitSystem === 'metric' ? (f.velocity || 0) * 3.6 : (f.velocity || 0) * 2.23694,
        callsign: f.callsign || f.icao24
    })).filter(d => d.alt > 0 && d.vel > 0);

    const xLabel = unitSystem === 'metric' ? 'Speed (km/h)' : 'Speed (mph)';
    const yLabel = unitSystem === 'metric' ? 'Altitude (m)' : 'Altitude (ft)';

    return (
        <div className="h-64 w-full bg-slate-800/40 border border-slate-700 rounded-lg p-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Live Traffic Energy Profile</h3>
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                        type="number"
                        dataKey="vel"
                        name="speed"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickFormatter={(val) => Math.round(val).toString()}
                    >
                        <Label value={xLabel} offset={0} position="insideBottom" fill="#64748b" fontSize={10} />
                    </XAxis>
                    <YAxis
                        type="number"
                        dataKey="alt"
                        name="altitude"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickFormatter={(val) => Math.round(val).toString()}
                    >
                        <Label value={yLabel} angle={-90} position="insideLeft" fill="#64748b" fontSize={10} />
                    </YAxis>
                    <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-xl text-xs">
                                        <div className="font-bold text-white mb-1">{data.callsign}</div>
                                        <div className="text-slate-400">Alt: <span className="text-white">{Math.round(data.alt)}</span></div>
                                        <div className="text-slate-400">Spd: <span className="text-white">{Math.round(data.vel)}</span></div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Scatter
                        name="Flights"
                        data={chartData}
                        fill="#3b82f6"
                        shape="circle"
                    />
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}
