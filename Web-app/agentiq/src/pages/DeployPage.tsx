import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Rocket } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Input'
import { useToastStore } from '@/store/toastStore'

const schema = z.object({
  repo:     z.string().url('Enter a valid GitHub URL'),
  platform: z.string(),
  branch:   z.string().min(1, 'Branch required'),
})
type FormData = z.infer<typeof schema>

const platformOptions = [
  { value: 'render',  label: 'Render' },
  { value: 'railway', label: 'Railway' },
]

const deployments = [
  { host: 'api-prod.onrender.com',   commit: 'a4f8c12', ago: '2h ago',  checks: '14/14 passed', status: 'live'    as const },
  { host: 'api-staging.railway.app', commit: 'b7d1e44', ago: '6h ago',  checks: '12/14 passed', status: 'warning' as const },
]

export function DeployPage() {
  const toast    = useToastStore()
  const [deploying, setDeploying] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { repo: '', platform: 'render', branch: 'main' },
  })

  const onSubmit = async (_data: FormData) => {
    setDeploying(true)
    await new Promise((r) => setTimeout(r, 1200))
    setDeploying(false)
    toast.show('Deployment coming soon! Backend integration required.', 'warning', '🚀')
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Deployment</h1>
        <p className="text-sm text-text-secondary">Deploy your API and auto-trigger test & security suites</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Badge variant="orange">Coming Soon</Badge>
        <Badge variant="teal">Render Integration</Badge>
        <Badge variant="purple">Railway Integration</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Deploy Form */}
        <Card className="p-5">
          <div className="section-title mb-5">Deploy Configuration</div>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="GitHub Repository URL"
              placeholder="https://github.com/user/api-repo"
              error={errors.repo?.message}
              {...register('repo')}
            />
            <Select
              label="Platform"
              options={platformOptions}
              error={errors.platform?.message}
              {...register('platform')}
            />
            <Input
              label="Branch"
              placeholder="main"
              error={errors.branch?.message}
              {...register('branch')}
            />
            <button
              type="submit"
              className="btn-primary mt-1 disabled:opacity-50"
              disabled={deploying}
            >
              {deploying
                ? <><span className="spinner" style={{width:13,height:13}} /> Deploying…</>
                : <><Rocket size={13} /> Deploy API</>}
            </button>
          </form>
        </Card>

        <div className="flex flex-col gap-4">
          {/* Active Deployments */}
          <Card className="p-5">
            <div className="section-title mb-4">Active Deployments</div>
            <div className="flex flex-col gap-2">
              {deployments.map((d) => (
                <div key={d.host}
                     className="flex items-center gap-3 p-3.5 rounded border border-border"
                     style={{ background: '#0f1e35' }}>
                  <span
                    className="w-2 h-2 rounded-full shrink-0 pulse-dot"
                    style={{ background: d.status === 'live' ? '#22c55e' : '#f97316' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{d.host}</div>
                    <div className="text-[11px] font-mono text-text-muted">
                      commit: {d.commit} · {d.ago} · {d.checks}
                    </div>
                  </div>
                  <Badge variant={d.status === 'live' ? 'green' : 'orange'}>
                    {d.status === 'live' ? 'Live' : 'Warning'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Post-Deploy Actions */}
          <Card className="p-5">
            <div className="section-title mb-4">Post-Deploy Actions</div>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Run test suite automatically',     checked: true  },
                { label: 'Run security scan automatically',  checked: true  },
                { label: 'Notify on Slack',                  checked: false },
                { label: 'Send email report',                checked: false },
              ].map((item) => (
                <label key={item.label} className="flex items-center gap-3 text-sm cursor-pointer group">
                  <input
                    type="checkbox"
                    defaultChecked={item.checked}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: '#00d4aa' }}
                  />
                  <span className="text-text-secondary group-hover:text-text-primary transition-colors">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </Card>

          {/* Info Card */}
          <div className="p-4 rounded border border-teal/20 text-xs text-text-secondary leading-relaxed"
               style={{ background: 'rgba(0,212,170,0.05)' }}>
            <div className="text-teal font-semibold mb-1 text-sm">How it works</div>
            Connect your GitHub repo, choose a platform, and AgentIQ will deploy your API then
            automatically run the full test suite and security scan against the live deployment URL.
          </div>
        </div>
      </div>
    </div>
  )
}
