import React from 'react';
import { useApp } from '../context/AppContext';

export default function AgentPipeline() {
    const { agentStatuses } = useApp();
    const pillClass = "badge font-mono text-[11px] tracking-[0.18em] text-bone/70 bg-coal/60";

    const getStatusColor = (status) => {
        switch (status) {
            case 'Running': return 'text-amber-400 animate-pulse';
            case 'Complete': return 'text-emerald-400';
            default: return 'text-bone/50';
        }
    };

    return (
        <div className="glass rounded-3xl p-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Agent Pipeline</h2>
                <span className={pillClass}>3 STAGES</span>
            </div>
            <div className="mt-8 grid gap-4">
                {agentStatuses.map((agent) => (
                    <div
                        key={agent.title}
                        className={`data-card flex flex-col md:flex-row md:items-center md:justify-between gap-3 transition-all duration-300 ${agent.status === 'Running' ? 'border-ember/50 bg-ember/5' : ''}`}
                    >
                        <div>
                            <p className="text-lg font-semibold">{agent.title}</p>
                            <p className="text-bone/60 text-sm mt-1">{agent.detail}</p>
                        </div>
                        <span className={`text-sm font-mono ${getStatusColor(agent.status)}`}>{agent.status}</span>
                    </div>
                ))}
            </div>
            <div className="mt-6 subtle-line pt-6">
                <p className="text-bone/70 text-sm">
                    MCP handles secure tool-calling, so each agent can orchestrate test
                    runners, scanners, and deployment modules without manual wiring.
                </p>
            </div>
        </div>
    );
}
