import React, { useState } from 'react';
import { sampleRequests } from '../data/sampleData';

const pillClass = "badge font-mono text-[11px] tracking-[0.18em] text-bone/70 bg-coal/60";

export default function RequestConsole() {
    const [showBuilder, setShowBuilder] = useState(false);

    return (
        <div className="glass rounded-3xl p-8 relative overflow-hidden">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Request Console</h2>
                <span className={pillClass}>Postman Mode</span>
            </div>
            <div className="mt-6 space-y-4">
                {sampleRequests.map((request) => (
                    <div
                        key={request.path}
                        className="data-card flex flex-col gap-2"
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-sun text-xs">
                                {request.method}
                            </span>
                            <span className="text-bone/60 text-xs">{request.latency}</span>
                        </div>
                        <p className="text-sm">{request.path}</p>
                        <p className="text-xs text-emerald-300">{request.status}</p>
                    </div>
                ))}
            </div>
            <button
                className="mt-6 w-full rounded-xl border border-white/10 py-3 text-sm hover:border-ember transition-colors"
                onClick={() => setShowBuilder(true)}
            >
                Open Request Builder
            </button>

            {/* Simple Modal Overlay */}
            {showBuilder && (
                <div className="absolute inset-0 bg-coal/95 flex flex-col items-center justify-center p-6 z-10 animate-fadeIn text-center">
                    <h3 className="text-xl font-semibold mb-4 text-glow">Request Builder</h3>
                    <p className="text-sm text-bone/70 mb-6">Advanced request construction is currently under development.</p>
                    <button
                        className="px-6 py-2 bg-ember text-ink rounded-lg font-bold hover:bg-ember/90 transition-colors"
                        onClick={() => setShowBuilder(false)}
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
}
