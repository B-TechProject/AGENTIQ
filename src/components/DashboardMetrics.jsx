import React from 'react';

const pillClass = "badge font-mono text-[11px] tracking-[0.18em] text-bone/70 bg-coal/60";

export default function DashboardMetrics() {
    return (
        <section className="mt-16 glass rounded-3xl p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                    <p className={pillClass}>Unified Dashboard</p>
                    <h2 className="mt-3 text-3xl font-semibold">
                        Centralized Reports + Audit Trails
                    </h2>
                    <p className="mt-3 text-bone/70 max-w-2xl">
                        Every test run, security alert, and deployment log is stored with
                        MCP trace metadata. Build trend analytics, enforce SLAs, and share
                        evidence with stakeholders.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <span className="badge bg-ink/60 text-bone/70 border-white/10">
                        Test Logs
                    </span>
                    <span className="badge bg-ink/60 text-bone/70 border-white/10">
                        Vulnerability Records
                    </span>
                    <span className="badge bg-ink/60 text-bone/70 border-white/10">
                        Deployment Checks
                    </span>
                </div>
            </div>
            <div className="mt-8 grid md:grid-cols-3 gap-4">
                <div className="data-card">
                    <p className="text-sm text-bone/60">Total Test Cases</p>
                    <p className="text-3xl font-semibold mt-2">1,912</p>
                    <p className="text-xs text-emerald-300 mt-2">+12% this week</p>
                </div>
                <div className="data-card">
                    <p className="text-sm text-bone/60">High Severity Findings</p>
                    <p className="text-3xl font-semibold mt-2">4</p>
                    <p className="text-xs text-ember mt-2">2 unresolved</p>
                </div>
                <div className="data-card">
                    <p className="text-sm text-bone/60">Deployments Verified</p>
                    <p className="text-3xl font-semibold mt-2">18</p>
                    <p className="text-xs text-sun mt-2">Avg. 3 min smoke check</p>
                </div>
            </div>
        </section>
    );
}
