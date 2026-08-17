import { useLocation, Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'

const PAGE_META: Record<string, { title: string; crumb?: string }> = {
  '/':          { title: 'Command Center' },
  '/dashboard': { title: 'Dashboard',        crumb: 'Overview' },
  '/test':      { title: 'Test Runner',       crumb: 'Testing' },
  '/security':  { title: 'Security Scanner',  crumb: 'Testing' },
  '/history':   { title: 'Test History',      crumb: 'Testing' },
  '/deploy':    { title: 'Deployment',         crumb: 'Infrastructure' },
  '/settings':  { title: 'Settings',           crumb: 'Account' },
  '/login':     { title: 'Sign In' },
  '/signup':    { title: 'Create Account' },
}

export function Topbar() {
  const { pathname } = useLocation()
  const meta = PAGE_META[pathname] ?? { title: 'AgentIQ' }

  return (
    <header
      className="sticky top-0 z-40 h-14 flex items-center gap-3 px-6 border-b border-border"
      style={{ background: 'rgba(10,22,40,0.85)', backdropFilter: 'blur(12px)' }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {meta.crumb && (
          <>
            <span className="text-xs text-text-muted font-mono">{meta.crumb}</span>
            <span className="text-text-muted text-xs">/</span>
          </>
        )}
        <span className="text-sm font-semibold text-text-primary truncate">{meta.title}</span>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="teal" dot>MCP Powered</Badge>
        <Badge variant="purple">Simulation Mode</Badge>
        <Badge variant="green" dot>Agents Online</Badge>
      </div>
    </header>
  )
}
