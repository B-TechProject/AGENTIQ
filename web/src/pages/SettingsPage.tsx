import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, Key, Bell, Shield, User } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { useToastStore } from '@/store/toastStore'

const profileSchema = z.object({
  name:  z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
})
type ProfileForm = z.infer<typeof profileSchema>

const apiSchema = z.object({
  backendUrl: z.string().url('Enter a valid URL').or(z.literal('')),
  apiKey:     z.string().optional(),
})
type ApiForm = z.infer<typeof apiSchema>

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: User   },
  { id: 'api',          label: 'API Config',     icon: Key    },
  { id: 'notifications', label: 'Notifications',  icon: Bell   },
  { id: 'security',      label: 'Security',       icon: Shield },
] as const
type TabId = typeof TABS[number]['id']

export function SettingsPage() {
  const { user }  = useAuth()
  const toast     = useToastStore()
  const [tab, setTab] = useState<TabId>('profile')

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  })
  const apiForm = useForm<ApiForm>({
    resolver: zodResolver(apiSchema),
    defaultValues: { backendUrl: 'http://localhost:3001', apiKey: '' },
  })

  const saveProfile = async (_d: ProfileForm) => {
    await new Promise((r) => setTimeout(r, 500))
    toast.show('Profile updated', 'success', '✓')
  }

  const saveApi = async (_d: ApiForm) => {
    await new Promise((r) => setTimeout(r, 400))
    toast.show('API config saved', 'success', '✓')
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Settings</h1>
        <p className="text-sm text-text-secondary">Manage your account, API connections, and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-44 shrink-0">
          <nav className="flex flex-col gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={[
                  'flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm font-medium transition-all duration-150 border text-left w-full',
                  tab === id
                    ? 'text-teal border-teal/30 bg-teal/10'
                    : 'text-text-secondary border-transparent hover:bg-bg-tertiary hover:text-text-primary hover:border-border',
                ].join(' ')}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="flex-1 min-w-0">

          {/* ── Profile ─────────────────────────── */}
          {tab === 'profile' && (
            <Card className="p-6">
              <div className="section-title mb-6">Profile Information</div>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-extrabold text-white shrink-0"
                     style={{ background: 'linear-gradient(135deg,#00d4aa,#a855f7)' }}>
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) ?? 'JD'}
                </div>
                <div>
                  <div className="font-semibold mb-0.5">{user?.name ?? 'John Dev'}</div>
                  <div className="text-sm text-text-muted">{user?.email ?? 'john@example.com'}</div>
                  <Badge variant="teal" className="mt-1.5">{user?.plan ?? 'pro'} plan</Badge>
                </div>
              </div>

              <form onSubmit={profileForm.handleSubmit(saveProfile)} className="flex flex-col gap-4">
                <Input label="Display Name" placeholder="John Dev"
                       error={profileForm.formState.errors.name?.message}
                       {...profileForm.register('name')} />
                <Input label="Email Address" type="email" placeholder="you@example.com"
                       error={profileForm.formState.errors.email?.message}
                       {...profileForm.register('email')} />
                <div className="flex justify-end pt-2">
                  <button type="submit"
                          disabled={profileForm.formState.isSubmitting}
                          className="btn-primary disabled:opacity-50">
                    <Save size={13} />
                    {profileForm.formState.isSubmitting ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </Card>
          )}

          {/* ── API Config ──────────────────────── */}
          {tab === 'api' && (
            <Card className="p-6">
              <div className="section-title mb-6">API Configuration</div>
              <form onSubmit={apiForm.handleSubmit(saveApi)} className="flex flex-col gap-4">
                <Input label="Backend Base URL"
                       placeholder="http://localhost:3001"
                       error={apiForm.formState.errors.backendUrl?.message}
                       {...apiForm.register('backendUrl')} />
                <Input label="API Key (optional)" type="password"
                       placeholder="sk-••••••••••••••••"
                       {...apiForm.register('apiKey')} />

                <div className="p-3 rounded border border-teal/20 text-xs text-text-secondary leading-relaxed"
                     style={{ background: 'rgba(0,212,170,0.05)' }}>
                  <span className="text-teal font-semibold">Note:</span> The backend URL is proxied through Vite in development.
                  In production set <code className="font-mono text-teal">VITE_API_URL</code> in your environment.
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit"
                          disabled={apiForm.formState.isSubmitting}
                          className="btn-primary disabled:opacity-50">
                    <Save size={13} />
                    {apiForm.formState.isSubmitting ? 'Saving…' : 'Save Config'}
                  </button>
                </div>
              </form>
            </Card>
          )}

          {/* ── Notifications ───────────────────── */}
          {tab === 'notifications' && (
            <Card className="p-6">
              <div className="section-title mb-6">Notification Preferences</div>
              <div className="flex flex-col gap-5">
                {[
                  { label: 'Test run completed',      sub: 'Get notified when any test suite finishes',           checked: true  },
                  { label: 'Security vulnerabilities', sub: 'Alert when a critical vulnerability is detected',     checked: true  },
                  { label: 'Deployment status',        sub: 'Updates on deploy success or failure',                checked: true  },
                  { label: 'Weekly summary',           sub: 'Receive a weekly digest of all testing activity',     checked: false },
                  { label: 'Agent offline',            sub: 'Alert when an agent goes offline unexpectedly',       checked: false },
                ].map((item) => (
                  <label key={item.label} className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" defaultChecked={item.checked}
                           className="mt-0.5 w-4 h-4 rounded cursor-pointer shrink-0"
                           style={{ accentColor: '#00d4aa' }}
                           onChange={() => toast.show('Preferences saved', 'success', '✓')} />
                    <div>
                      <div className="text-sm font-medium group-hover:text-text-primary transition-colors">{item.label}</div>
                      <div className="text-xs text-text-muted mt-0.5">{item.sub}</div>
                    </div>
                  </label>
                ))}
              </div>
            </Card>
          )}

          {/* ── Security ────────────────────────── */}
          {tab === 'security' && (
            <div className="flex flex-col gap-4">
              <Card className="p-6">
                <div className="section-title mb-5">Change Password</div>
                <div className="flex flex-col gap-4">
                  <Input label="Current Password" type="password" placeholder="••••••••" />
                  <Input label="New Password"     type="password" placeholder="••••••••" />
                  <Input label="Confirm New"      type="password" placeholder="••••••••" />
                  <div className="flex justify-end">
                    <button className="btn-primary" onClick={() => toast.show('Password updated', 'success', '🔒')}>
                      <Save size={13} /> Update Password
                    </button>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="section-title mb-5">Active Sessions</div>
                {[
                  { device: 'Chrome · macOS', ip: '192.168.1.1',  last: 'Now',      current: true  },
                  { device: 'Safari · iPhone', ip: '10.0.0.45',   last: '2h ago',   current: false },
                  { device: 'Firefox · Linux', ip: '172.16.0.12', last: '3 days ago',current: false },
                ].map((s) => (
                  <div key={s.device} className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
                    <div className="flex-1">
                      <div className="text-sm font-medium flex items-center gap-2">
                        {s.device}
                        {s.current && <Badge variant="green">Current</Badge>}
                      </div>
                      <div className="text-xs font-mono text-text-muted mt-0.5">{s.ip} · Last active {s.last}</div>
                    </div>
                    {!s.current && (
                      <button className="btn-danger text-xs py-1 px-3"
                              onClick={() => toast.show('Session revoked', 'warning', '⚠')}>
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </Card>

              <Card className="p-6">
                <div className="text-sm font-bold text-red mb-2">Danger Zone</div>
                <p className="text-xs text-text-muted mb-4">
                  Permanently delete your account and all associated data. This cannot be undone.
                </p>
                <button className="btn-danger"
                        onClick={() => toast.show('Contact support to delete your account', 'warning', '⚠')}>
                  Delete Account
                </button>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
