export const APP_NAME = 'AgentIQ'
export const APP_VERSION = '1.0.0'

export const API_BASE_URL = '/api'
export const AI_MODEL = 'claude-sonnet-4-20250514'
export const AI_MAX_TOKENS = 1000

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const

export const DEPLOY_PLATFORMS = [
  { value: 'render',  label: 'Render' },
  { value: 'railway', label: 'Railway' },
] as const

export const METHOD_VARIANTS: Record<string, string> = {
  GET:    'green',
  POST:   'blue',
  PUT:    'orange',
  DELETE: 'red',
  PATCH:  'purple',
}

export const SEVERITY_VARIANTS: Record<string, string> = {
  critical: 'red',
  high:     'orange',
  medium:   'orange',
  low:      'gray',
}

export const TEST_TYPE_COLORS: Record<string, string> = {
  functional: '#00d4aa',
  security:   '#ef4444',
  edge:       '#f97316',
}

export const MOCK_PULSE_DATA = [
  { day: 'Mon', passed: 45, failed: 8  },
  { day: 'Tue', passed: 62, failed: 12 },
  { day: 'Wed', passed: 38, failed: 5  },
  { day: 'Thu', passed: 71, failed: 3  },
  { day: 'Fri', passed: 55, failed: 9  },
  { day: 'Sat', passed: 84, failed: 2  },
  { day: 'Sun', passed: 91, failed: 1  },
]

export const MOCK_HISTORY = [
  { id: '1', date: '2025-07-14 14:32', url: 'https://api.example.com/users',       method: 'GET',    status: 'pass', tests: 12, duration: '1.4s' },
  { id: '2', date: '2025-07-14 12:18', url: 'https://api.example.com/auth/login',  method: 'POST',   status: 'fail', tests: 8,  duration: '3.2s' },
  { id: '3', date: '2025-07-13 18:05', url: 'https://api.shop.com/products',       method: 'GET',    status: 'pass', tests: 15, duration: '2.1s' },
  { id: '4', date: '2025-07-13 11:44', url: 'https://api.example.com/orders/42',   method: 'DELETE', status: 'pass', tests: 6,  duration: '0.9s' },
  { id: '5', date: '2025-07-12 09:30', url: 'https://staging.api.io/v2/items',     method: 'PUT',    status: 'fail', tests: 10, duration: '4.7s' },
  { id: '6', date: '2025-07-11 16:22', url: 'https://api.example.com/search',      method: 'GET',    status: 'pass', tests: 20, duration: '1.8s' },
  { id: '7', date: '2025-07-10 10:00', url: 'https://api.example.com/webhook',     method: 'POST',   status: 'pass', tests: 5,  duration: '0.5s' },
] as const

export const MOCK_DEPLOYMENTS = [
  { id: '1', host: 'api-prod.onrender.com',   platform: 'render',  commit: 'a4f8c12', ago: '2h ago',  checks: '14/14 passed', status: 'live'    },
  { id: '2', host: 'api-staging.railway.app', platform: 'railway', commit: 'b7d1e44', ago: '6h ago',  checks: '12/14 passed', status: 'warning' },
] as const

export const MOCK_AGENTS = [
  { name: 'Test Agent',     icon: '🧪', status: 'Running 4 suites · 284 cases', pct: 87,  color: '#00d4aa', badge: 'green'  },
  { name: 'Security Agent', icon: '🛡', status: 'Scanning 2 endpoints',          pct: 62,  color: '#f97316', badge: 'orange' },
  { name: 'Deploy Agent',   icon: '🚀', status: 'Last deploy: 2h ago',            pct: 100, color: '#22c55e', badge: 'green'  },
] as const

export const NAV_ITEMS = [
  { section: 'Main', items: [
    { label: 'Command Center', to: '/',          icon: 'Zap'        },
    { label: 'Dashboard',      to: '/dashboard', icon: 'LayoutGrid' },
  ]},
  { section: 'Testing', items: [
    { label: 'Test Runner',      to: '/test',      icon: 'FlaskConical', badge: 'AI'   },
    { label: 'Security Scanner', to: '/security',  icon: 'Shield'                       },
    { label: 'History',          to: '/history',   icon: 'History'                      },
  ]},
  { section: 'Infrastructure', items: [
    { label: 'Deployment', to: '/deploy',  icon: 'Rocket', badge: 'Soon' },
    { label: 'Settings',   to: '/settings',icon: 'Settings'              },
  ]},
] as const
