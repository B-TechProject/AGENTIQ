import React from 'react';
import { useApp } from '../context/AppContext';

const pillClass = "badge font-mono text-[11px] tracking-[0.18em] text-bone/70 bg-coal/60";

export default function Header() {
    const {
        isLiveMode, setIsLiveMode,
        apiUrl, setApiUrl,
        projectBrief, setProjectBrief,
        launchAgents, isRunning
    } = useApp();

    return (
        <header className="px-6 md:px-12 pt-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <p className={pillClass}>MCP-POWERED</p>
                    <h1 className="mt-4 text-4xl md:text-6xl font-display font-semibold leading-tight text-glow">
                        Agentic API Testing
                        <br />
                        Command Center
                    </h1>
                    <p className="mt-4 text-base md:text-lg text-bone/70 max-w-2xl">
                        Autonomous functional validation, safe security checks, and deployment
                        orchestration. Give the system a URL and a plain-English brief, then
                        let the agents run the entire lifecycle.
                    </p>
                </div>
                <div className="glass rounded-3xl p-6 shadow-glow max-w-sm w-full">
                    <div className="flex items-center justify-between">
                        <span className={pillClass}>{isLiveMode ? 'Live Mode' : 'Simulation Mode'}</span>
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`}></span>
                            <span className={`${isLiveMode ? 'text-emerald-300' : 'text-amber-300'} font-mono text-xs cursor-pointer select-none`} onClick={() => setIsLiveMode(!isLiveMode)}>
                                {isLiveMode ? 'Connected' : 'Offline'}
                            </span>
                        </div>
                    </div>
                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-bone/50">
                                API URL
                            </label>
                            <input
                                className="mt-2 w-full rounded-xl bg-ink/70 border border-white/10 px-4 py-3 text-sm focus:border-ember transition-colors"
                                placeholder="https://api.example.com"
                                value={apiUrl}
                                onChange={(e) => setApiUrl(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-bone/50">
                                What should it do?
                            </label>
                            <textarea
                                className="mt-2 w-full rounded-xl bg-ink/70 border border-white/10 px-4 py-3 text-sm h-20 focus:border-ember transition-colors resize-none"
                                placeholder="Login, create orders, enforce RBAC, return 200s"
                                value={projectBrief}
                                onChange={(e) => setProjectBrief(e.target.value)}
                            />
                        </div>
                        <button
                            className={`w-full rounded-xl font-semibold py-3 transition-all ${isRunning ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' : 'bg-ember text-ink hover:shadow-lg hover:shadow-ember/20'}`}
                            onClick={launchAgents}
                            disabled={isRunning}
                        >
                            {isRunning ? 'Agents Running...' : 'Launch Agents'}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
