import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useApp } from '../context/AppContext';

const pillClass = "badge font-mono text-[11px] tracking-[0.18em] text-bone/70 bg-coal/60";

export default function RunPulse() {
    const { runHistory } = useApp();

    return (
        <div className="glass rounded-3xl p-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Run Pulse</h2>
                <span className={pillClass}>Last 7 Days</span>
            </div>
            <div className="mt-8 h-56">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={runHistory} margin={{ left: -12, right: 12 }}>
                        <XAxis dataKey="name" stroke="rgba(247,244,239,0.4)" />
                        <YAxis stroke="rgba(247,244,239,0.4)" />
                        <Tooltip
                            contentStyle={{
                                background: "#131521",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: 12,
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="tests"
                            stroke="#ff6b3d"
                            fill="rgba(255,107,61,0.25)"
                        />
                        <Area
                            type="monotone"
                            dataKey="alerts"
                            stroke="#2aa9a1"
                            fill="rgba(42,169,161,0.2)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <p className="mt-4 text-bone/60 text-sm">
                Agents executed {runHistory.reduce((acc, curr) => acc + curr.tests, 0).toLocaleString()} tests and surfaced top anomalies in the last
                week.
            </p>
        </div>
    );
}
