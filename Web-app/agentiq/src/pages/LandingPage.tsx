import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Shield, Rocket, Bot } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

const features = [
  {
    icon: Shield,
    title: 'Security Scanning',
    desc: 'Autonomous SQLi, XSS, and auth vulnerability detection across all endpoints.',
    badges: [
      { label: 'SQLi',  variant: 'red'    as const },
      { label: 'XSS',   variant: 'orange' as const },
      { label: 'Auth',  variant: 'purple' as const },
    ],
    to: '/security',
    color: 'rgba(239,68,68,0.12)',
  },
  {
    icon: Rocket,
    title: 'Auto Deployment',
    desc: 'Deploy to Render or Railway, then auto-trigger test suites on every push.',
    badges: [
      { label: 'Render',  variant: 'teal'   as const },
      { label: 'Railway', variant: 'purple' as const },
    ],
    to: '/deploy',
    color: 'rgba(59,130,246,0.12)',
  },
  {
    icon: Bot,
    title: 'AI Failure Analysis',
    desc: 'Every failing test gets a detailed AI explanation with suggested fixes.',
    badges: [
      { label: 'GPT-4o',   variant: 'teal'  as const },
      { label: 'Auto-fix', variant: 'green' as const },
    ],
    to: '/test',
    color: 'rgba(0,212,170,0.12)',
  },
]

const pipelineSteps = [
  { label: 'Discover', icon: '📡', state: 'done'    as const },
  { label: 'Test',     icon: '🧪', state: 'active'  as const },
  { label: 'Secure',   icon: '🛡', state: 'warning' as const },
  { label: 'Analyze',  icon: '📊', state: 'idle'    as const },
  { label: 'Deploy',   icon: '🚀', state: 'idle'    as const },
]

export function LandingPage() {
  const navigate = useNavigate()
  const [url, setUrl]   = useState('')
  const [desc, setDesc] = useState('')

  const handleLaunch = () => {
    if (!url.trim()) return
    navigate('/test', { state: { url, desc } })
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <section className="text-center py-14 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-[11px] font-mono text-teal border border-teal/25"
             style={{ background: 'rgba(0,212,170,0.08)' }}>
          <Zap size={10} /> Agentic AI Testing Platform
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
          Agentic API Testing<br />
          <span className="text-gradient">Command Center</span>
        </h1>

        <p className="text-base text-text-secondary leading-relaxed max-w-lg mx-auto mb-10">
          Autonomous agents that test, secure, and validate your APIs —
          powered by AI intelligence and real-time vulnerability detection.
        </p>

        {/* Launch Card */}
        <div className="max-w-xl mx-auto mb-12">
          <Card glow className="p-6 text-left">
            <div className="flex flex-col gap-4">
              <div>
                <label className="input-label">API Endpoint URL</label>
                <input
                  className="input-field"
                  type="url"
                  placeholder="https://api.example.com/v1/endpoint"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">What should the agents do?</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="Test authentication, validate responses, check rate limits..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  className="btn-orange flex-1 justify-center"
                  onClick={handleLaunch}
                  disabled={!url.trim()}
                >
                  <Zap size={14} /> Launch Agents
                </button>
                <button className="btn-ghost" onClick={() => navigate('/test')}>
                  Configure →
                </button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {features.map((f) => {
          const Icon = f.icon
          return (
            <Card key={f.title} hover onClick={() => navigate(f.to)} className="p-5">
              <div className="w-9 h-9 rounded-sm flex items-center justify-center mb-3"
                   style={{ background: f.color }}>
                <Icon size={18} className="text-text-secondary" />
              </div>
              <div className="text-sm font-bold mb-1.5">{f.title}</div>
              <div className="text-xs text-text-secondary leading-relaxed mb-3">{f.desc}</div>
              <div className="flex flex-wrap gap-1.5">
                {f.badges.map((b) => (
                  <Badge key={b.label} variant={b.variant}>{b.label}</Badge>
                ))}
              </div>
            </Card>
          )
        })}
      </section>

      {/* Pipeline */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="section-title">Agent Pipeline</div>
          <Badge variant="green" dot>Live</Badge>
        </div>
        <div className="flex">
          {pipelineSteps.map((step, i) => (
            <div
              key={step.label}
              className={`pipeline-step ${step.state === 'active' ? 'active' : step.state === 'done' ? 'done' : step.state === 'warning' ? 'warning' : ''}`}
            >
              <div className="text-lg mb-1">{step.icon}</div>
              <div className="text-[11px] font-mono text-text-secondary">{step.label}</div>
              <div className="text-[10px] mt-1" style={{
                color: step.state === 'done' ? '#22c55e' : step.state === 'active' ? '#00d4aa' : step.state === 'warning' ? '#f97316' : '#64748b'
              }}>
                {step.state === 'done' ? '● Done' : step.state === 'active' ? '● Running' : step.state === 'warning' ? '● Queued' : '○ Pending'}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
