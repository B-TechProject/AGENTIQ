import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutGrid, FlaskConical, Shield, History,
  Rocket, Zap, LogOut, Settings, Terminal
} from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
  badge?: string
}

const mainItems: NavItem[] = [
  { label: 'Command Center', to: '/',          icon: Zap         },
  { label: 'Dashboard',      to: '/dashboard', icon: LayoutGrid  },
]

const testingItems: NavItem[] = [
  { label: 'API Client',       to: '/api-client',icon: Terminal                     },
  { label: 'Test Runner',      to: '/test',     icon: FlaskConical, badge: 'AI'   },
  { label: 'Security Scanner', to: '/security', icon: Shield                       },
  { label: 'History',          to: '/history',  icon: History                      },
]


const infraItems: NavItem[] = [
  { label: 'Deployment', to: '/deploy',   icon: Rocket,   badge: 'Soon' },
  { label: 'Settings',   to: '/settings', icon: Settings               },
]

export function Sidebar() {
  const { user, logout: handleLogout, userInitials } = useAuth()

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-[220px] flex flex-col z-50 border-r border-border"
      style={{ background: '#0a1628' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-border">
        <div
          className="w-8 h-8 rounded-sm flex items-center justify-center font-extrabold text-sm text-white shrink-0"
          style={{ background: 'linear-gradient(135deg,#00d4aa,#a855f7)' }}
        >
          A
        </div>
        <div>
          <div className="text-sm font-bold tracking-wide text-text-primary">AGENTIQ</div>
          <div className="text-[10px] font-mono text-text-muted">API Testing</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <NavSection label="Main">
          {mainItems.map((item) => <SidebarLink key={item.to} {...item} />)}
        </NavSection>
        <NavSection label="Testing">
          {testingItems.map((item) => <SidebarLink key={item.to} {...item} />)}
        </NavSection>
        <NavSection label="Infrastructure">
          {infraItems.map((item) => <SidebarLink key={item.to} {...item} />)}
        </NavSection>
      </nav>

      {/* User footer */}
      <div className="px-2 py-3 border-t border-border">
        <div className="flex items-center gap-2 px-2 py-2 rounded-sm hover:bg-bg-tertiary transition-colors cursor-pointer group">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg,#00d4aa,#a855f7)' }}
          >
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-text-primary truncate">{user?.name ?? 'John Dev'}</div>
            <div className="text-[10px] font-mono text-teal capitalize">{user?.plan ?? 'pro'} Plan</div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green pulse-dot" />
            <button
              onClick={handleLogout}
              className="p-1 rounded text-text-muted hover:text-red transition-colors opacity-0 group-hover:opacity-100"
              title="Sign out"
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="px-2 py-1.5 text-[10px] font-mono text-text-muted uppercase tracking-widest">{label}</div>
      {children}
    </div>
  )
}

function SidebarLink({ to, label, icon: Icon, badge }: NavItem) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-2.5 px-2.5 py-2 rounded-sm mb-0.5 text-sm transition-all duration-150 border',
          isActive
            ? 'text-teal border-teal/30 bg-teal/10'
            : 'text-text-secondary border-transparent hover:bg-bg-tertiary hover:text-text-primary hover:border-border'
        )
      }
    >
      <Icon size={15} />
      <span className="flex-1">{label}</span>
      {badge && (
        <span
          className={clsx(
            'text-[10px] font-mono px-1.5 py-0.5 rounded-full border',
            badge === 'AI'   ? 'bg-teal/10 text-teal border-teal/30'     : '',
            badge === 'Soon' ? 'bg-orange/10 text-orange border-orange/30' : ''
          )}
        >
          {badge}
        </span>
      )}
    </NavLink>
  )
}
