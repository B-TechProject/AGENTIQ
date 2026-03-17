import React from 'react';

export default function Footer() {
    return (
        <footer className="px-6 md:px-12 pb-10">
            <div className="subtle-line pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-bone/60">
                <p>Agentic Platform UI · MCP-native · Safe security posture</p>
                <div className="flex gap-4 font-mono text-xs">
                    <span>v0.1.0</span>
                    <span className="animate-pulseLine text-emerald-400">System Ready</span>
                </div>
            </div>
        </footer>
    );
}
