import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { latencyData } from '../data/sampleData';

const pillClass = "badge font-mono text-[11px] tracking-[0.18em] text-bone/70 bg-coal/60";

export default function LatencyMap() {
    return (
        <div className="glass rounded-3xl p-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Latency Map</h2>
                <span className={pillClass}>Live Endpoints</span>
            </div>
            <div className="mt-8 h-56">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={latencyData} margin={{ left: -8, right: 12 }}>
                        <XAxis dataKey="name" stroke="rgba(247,244,239,0.4)" />
                        <YAxis stroke="rgba(247,244,239,0.4)" />
                        <Tooltip
                            contentStyle={{
                                background: "#131521",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: 12,
                            }}
                        />
                        <Bar dataKey="ms" fill="#f7c948" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <p className="mt-4 text-bone/60 text-sm">
                Smart routing prioritizes endpoints with latency above 150ms.
            </p>
        </div>
    );
}
