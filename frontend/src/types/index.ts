// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  name: string
  email: string
  plan: 'free' | 'pro' | 'enterprise'
  avatar?: string
}

// ─── Tests ───────────────────────────────────────────────────────────────────
export type TestType   = 'functional' | 'security' | 'edge'
export type TestStatus = 'pass' | 'fail'
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface GeneratedTest {
  name: string
  description: string
  assertion: string
  type: TestType
}

export interface TestResult {
  name: string
  status: TestStatus
  responseTime?: number
  assertions?: string
  explanation?: string
}

export interface SecurityResult {
  name: string
  vulnerable: boolean
  reason: string
  severity?: 'critical' | 'high' | 'medium' | 'low'
}

export interface RunSummary {
  totalTests: number
  passed: number
  failed: number
  vulnerabilities: number
}

export interface RunData {
  generatedTests: GeneratedTest[]
  result: {
    summary: RunSummary
    functional: TestResult[]
    security: SecurityResult[]
  }
}

// ─── History ─────────────────────────────────────────────────────────────────
export interface HistoryRun {
  id: string
  date: string
  url: string
  method: HttpMethod
  status: TestStatus
  totalTests: number
  duration: string
  summary?: RunSummary
}

// ─── Security Scan ────────────────────────────────────────────────────────────
export interface ScanResult {
  vulnerabilities: (SecurityResult & { severity: string })[]
  score: number
  endpointsScanned: number
}

// ─── Deployment ──────────────────────────────────────────────────────────────
export type DeployPlatform = 'render' | 'railway'

export interface Deployment {
  id: string
  host: string
  platform: DeployPlatform
  commit: string
  ago: string
  checks: string
  status: 'live' | 'warning' | 'failed'
}

// ─── Agent ───────────────────────────────────────────────────────────────────
export interface Agent {
  name: string
  icon: string
  status: string
  pct: number
  color: string
  badge: 'green' | 'orange' | 'red' | 'gray'
}
