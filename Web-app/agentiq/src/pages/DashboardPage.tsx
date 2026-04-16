import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { Badge }     from '@/components/ui/Badge'
import { Card }      from '@/components/ui/Card'
import { Modal }     from '@/components/ui/Modal'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { MOCK_PULSE_DATA, MOCK_AGENTS, METHOD_VARIANTS } from '@/constants'

const statCards = [
  { label: 'Total Test Cases',     value: '2,847', delta: '+12% this week', up: true,  color: '#00d4aa' },
  { label: 'High Severity',        value: '14',    delta: '+3 new findings', up: false, color: '#f97316' },
  { label: 'Deployments Verified', value: '98',    delta: '+6 this week',   up: true,  color: '#22c55e' },
  { label: 'Avg Response Time',    value: '142ms', delta: '-18ms improvement',up:true,  color: '#a855f7' },
]

const logRows = [
  { time: '14:32:01', endpoint: 'GET /api/users',       method: 'GET',    status: 'pass', duration: '142ms' },
  { time: '14:28:44', endpoint: 'POST /api/auth/login', method: 'POST',   status: 'fail', duration: '891ms' },
  { time: '14:21:09', endpoint: 'DELETE /api/items/42', method: 'DELETE', status: 'pass', duration: '77ms'  },
  { time: '14:15:33', endpoint: 'PUT /api/users/7',     method: 'PUT',    status: 'pass', duration: '203ms' },
]

const methodColor: Record<string, string> = METHOD_VARIANTS

export function DashboardPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'logs' | 'vulns' | 'deploys'>('logs')
  const [modal, setModal] = useState<{ open: boolean; endpoint: string }>({ open: false, endpoint: '' })

  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Dashboard</h1>
        <p className="text-sm text-text-secondary">Real-time overview of your testing infrastructure</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card overflow-hidden">
            <div className="absolute top-0 right-0 w-14 h-14 rounded-bl-full opacity-15"
                 style={{ background: s.color }} />
            <div className="text-[11px] font-mono text-text-muted uppercase tracking-widest mb-2">{s.label}</div>
            <div className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: s.color }}>{s.value}</div>
            <div className={`text-[11px] font-mono ${s.up ? 'text-green' : 'text-red'}`}>{s.delta}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Run Pulse */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title">Run Pulse</div>
            <span className="text-[11px] font-mono text-text-muted">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={MOCK_PULSE_DATA} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a3050" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0f1e35', border: '1px solid #1a3050', borderRadius: 8, fontFamily: 'JetBrains Mono', fontSize: 12 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="passed" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="failed" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
              <span className="w-2 h-2 rounded-sm bg-green inline-block" />Passed
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
              <span className="w-2 h-2 rounded-sm bg-red inline-block" />Failed
            </div>
          </div>
        </Card>

        {/* Agent Status */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title">Agent Status</div>
            <Badge variant="green">All Online</Badge>
          </div>
          <div className="flex flex-col gap-3">
            {MOCK_AGENTS.map((a) => (
              <div key={a.name}
                   className="flex items-start gap-3 p-3 rounded border border-border"
                   style={{ background: '#0f1e35' }}>
                <div className="w-9 h-9 rounded-sm flex items-center justify-center text-lg shrink-0"
                     style={{ background: a.color + '22' }}>
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold mb-0.5">{a.name}</div>
                  <div className="text-[11px] font-mono text-text-muted">{a.status}</div>
                  <div className="mt-2 h-1 rounded-full bg-bg-secondary overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                         style={{ width: `${a.pct}%`, background: a.color }} />
                  </div>
                </div>
                <Badge variant={a.badge}>{a.pct}%</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <div className="p-5">
          <div className="flex gap-1 border-b border-border mb-5">
            {(['logs', 'vulns', 'deploys'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 -mb-px ${
                  tab === t
                    ? 'text-teal border-teal'
                    : 'text-text-secondary border-transparent hover:text-text-primary'
                }`}
              >
                {t === 'logs' ? 'Test Logs' : t === 'vulns' ? 'Vulnerability Records' : 'Deployment Checks'}
              </button>
            ))}
          </div>

          {tab === 'logs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {['Time', 'Endpoint', 'Method', 'Status', 'Duration', 'Action'].map((h) => (
                      <th key={h} className="text-left px-3 py-3 text-[11px] font-mono text-text-muted uppercase tracking-wide border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logRows.map((r) => (
                    <tr key={r.time} className="table-row cursor-pointer" onClick={() => setModal({ open: true, endpoint: r.endpoint })}>
                      <td className="px-3 py-3 font-mono text-xs text-text-muted border-b border-border/50">{r.time}</td>
                      <td className="px-3 py-3 text-teal border-b border-border/50">{r.endpoint}</td>
                      <td className="px-3 py-3 border-b border-border/50"><Badge variant={methodColor[r.method] as any}>{r.method}</Badge></td>
                      <td className="px-3 py-3 border-b border-border/50"><Badge variant={r.status === 'pass' ? 'green' : 'red'}>{r.status.toUpperCase()}</Badge></td>
                      <td className="px-3 py-3 font-mono text-xs text-text-secondary border-b border-border/50">{r.duration}</td>
                      <td className="px-3 py-3 border-b border-border/50">
                        <button className="btn-ghost text-xs py-1 px-3" onClick={(e) => { e.stopPropagation(); setModal({ open: true, endpoint: r.endpoint }) }}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'vulns' && (
            <div className="flex flex-col gap-3">
              <div className="vuln-card vuln-danger">
                <span className="text-xl mt-0.5">⚠</span>
                <div>
                  <div className="text-sm font-bold text-red mb-1">SQL Injection — POST /api/login</div>
                  <div className="text-xs text-text-secondary">Username parameter concatenated into SQL without sanitization.</div>
                </div>
              </div>
              <div className="vuln-card vuln-warn">
                <span className="text-xl mt-0.5">⚡</span>
                <div>
                  <div className="text-sm font-bold text-orange mb-1">XSS Reflected — GET /api/search</div>
                  <div className="text-xs text-text-secondary">Query parameter reflected without encoding.</div>
                </div>
              </div>
              <div className="vuln-card vuln-safe">
                <span className="text-xl mt-0.5">✓</span>
                <div>
                  <div className="text-sm font-bold text-green mb-1">Auth Headers — All Endpoints</div>
                  <div className="text-xs text-text-secondary">Bearer token validation properly implemented. No bypass found.</div>
                </div>
              </div>
            </div>
          )}

          {tab === 'deploys' && (
            <div className="flex flex-col gap-2">
              {[
                { host: 'api-prod.onrender.com',   detail: 'Deployed 2h ago · All 14 checks passed', variant: 'green' as const, dotColor: '#22c55e', label: 'Live' },
                { host: 'api-staging.railway.app', detail: 'Deployed 6h ago · 2 checks failed',       variant: 'orange' as const, dotColor: '#f97316', label: 'Warning' },
              ].map((d) => (
                <div key={d.host} className="flex items-center gap-3 p-3.5 rounded border border-border" style={{ background: '#0f1e35' }}>
                  <span className="w-2 h-2 rounded-full shrink-0 pulse-dot" style={{ background: d.dotColor }} />
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{d.host}</div>
                    <div className="text-[11px] font-mono text-text-muted">{d.detail}</div>
                  </div>
                  <Badge variant={d.variant}>{d.label}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Run Detail Modal */}
      <Modal open={modal.open} onClose={() => setModal({ open: false, endpoint: '' })} title={`Run — ${modal.endpoint}`}>
        <div className="flex gap-2 flex-wrap mb-5">
          <Badge variant="green">12 Passed</Badge>
          <Badge variant="red">2 Failed</Badge>
          <Badge variant="teal">142ms avg</Badge>
        </div>
        <CodeBlock code={JSON.stringify({
          endpoint: modal.endpoint,
          timestamp: new Date().toISOString(),
          summary: { total: 14, passed: 12, failed: 2 },
          tests: [
            { name: 'Status 200',        status: 'pass', time: 142 },
            { name: 'Schema Validation', status: 'pass', time: 88  },
            { name: 'Auth Required',     status: 'fail', explanation: 'Returned 200 without auth token' },
          ]
        }, null, 2)} />
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-ghost" onClick={() => setModal({ open: false, endpoint: '' })}>Close</button>
          <button className="btn-primary" onClick={() => { setModal({ open: false, endpoint: '' }); navigate('/test') }}>Re-run Tests</button>
        </div>
      </Modal>
    </div>
  )
}
