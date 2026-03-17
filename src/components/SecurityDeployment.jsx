import React from 'react';

export default function SecurityDeployment() {
    return (
        <section className="mt-14 grid lg:grid-cols-3 gap-6">
            <div className="glass rounded-3xl p-6">
                <p className="badge bg-ink/60 text-ember border-ember/40">Security</p>
                <h3 className="mt-4 text-xl font-semibold">
                    Safe SQLi + XSS Probing
                </h3>
                <p className="mt-3 text-sm text-bone/70">
                    Controlled payloads detect vulnerable reflections, error leakage, and
                    authentication bypass patterns without exploitation.
                </p>
                <div className="mt-5 space-y-2 text-xs font-mono text-bone/60">
                    <p>Payload: ' OR '1'='1</p>
                    <p>Payload: &lt;script&gt;alert(1)&lt;/script&gt;</p>
                    <p>Header: Access-Control-Allow-Origin</p>
                </div>
            </div>
            <div className="glass rounded-3xl p-6">
                <p className="badge bg-ink/60 text-lake border-lake/40">Deployment</p>
                <h3 className="mt-4 text-xl font-semibold">
                    Render + Railway Assist
                </h3>
                <p className="mt-3 text-sm text-bone/70">
                    Generates config snippets, checks health endpoints, and re-runs the
                    security agent after deployment to ensure parity.
                </p>
                <button className="mt-6 w-full rounded-xl bg-lake text-ink font-semibold py-3 hover:bg-lake/90 transition-colors">
                    Deploy Sandbox Build
                </button>
            </div>
            <div className="glass rounded-3xl p-6">
                <p className="badge bg-ink/60 text-sun border-sun/40">Explain</p>
                <h3 className="mt-4 text-xl font-semibold">
                    Failure Analysis
                </h3>
                <p className="mt-3 text-sm text-bone/70">
                    The report narrates mismatches, suggests remediation steps, and
                    highlights contract violations with proposed fixes.
                </p>
                <button className="mt-6 w-full rounded-xl border border-white/10 py-3 text-sm hover:border-sun transition-colors">
                    Generate Summary
                </button>
            </div>
        </section>
    );
}
