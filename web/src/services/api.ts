import axios, { AxiosError } from 'axios'

// ── Axios Instance ──────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

// Attach auth token if present
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('agentiq-auth')
  if (raw) {
    try {
      const { state } = JSON.parse(raw)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    } catch {
      // ignore
    }
  }
  return config
})

// Global error handler
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('agentiq-auth')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Types ───────────────────────────────────────────────────────────────────
export interface GeneratePayload {
  url: string
  method: string
  description: string
}

export interface GeneratedTest {
  name: string
  description?: string

  method: string
  url: string
  body?: any
  params?: Record<string, any>

  assertions: {
    check: string
    expected: number | string
    actual: number | string | null
    pass: boolean
  }
}
export interface AssertionObject {
  check: string
  expected: number | string
  actual: number | string | null
  pass: boolean
}

export interface TestResult {
  name: string
  status: 'pass' | 'fail'
  responseTime?: number
  assertions?: string | AssertionObject
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

export interface HistoryRun {
  id: string
  date: string
  url: string
  method: string
  status: 'pass' | 'fail'
  totalTests: number
  duration: string
  summary?: RunSummary
}

export interface CustomRequestPayload {
  url: string
  method: string
  headers?: Record<string, string>
  params?: Record<string, string>
  body?: any
}

export interface CustomResponseData {
  status: number
  headers: Record<string, string>
  data: any
  time: number
}


// ── Helper ───────────────────────────────────────────────────────────────────
const measureRequest = async (requestFn: () => Promise<any>): Promise<CustomResponseData> => {
  const start = Date.now()
  try {
    const response = await requestFn()
    return {
      status: response.status,
      headers: response.headers,
      data: response.data,
      time: Date.now() - start
    }
  } catch (error: any) {
    if (error.response) {
      // Return HTTP failure responses instead of throwing, precisely like Postman!
      return {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data,
        time: Date.now() - start
      }
    }
    throw error
  }
}

// ── API Functions ────────────────────────────────────────────────────────────
export const apiService = {
  generate: async (payload: GeneratePayload): Promise<CustomResponseData> => {
    return measureRequest(() => api.post('/ai/generate', payload))
  },

  run: async (payload: GeneratePayload): Promise<CustomResponseData> => {
    return measureRequest(() => api.post('/ai/run', payload))
  },

  securityScan: async (payload: { url: string }): Promise<CustomResponseData> => {
    return measureRequest(() => api.post('/security/scan', payload))
  },

  getHistory: async (): Promise<CustomResponseData> => {
    return measureRequest(() => api.get('/runs'))
  },

  getRunById: async (id: string): Promise<CustomResponseData> => {
    return measureRequest(() => api.get(`/runs/${id}`))
  },


  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },

  signup: async (name: string, email: string, password: string , confirmPassword: string) => {
    const { data } = await api.post('/auth/register', { name, email, password , confirmPassword})
    return data
  },

  deploy: async (repo: string, platform: string, branch: string) => {
    const { data } = await api.post('/deploy', { repo, platform, branch })
    return data
  },

  sendRequest: async (payload: CustomRequestPayload): Promise<CustomResponseData> => {
    const { data } = await api.post('/request/send', payload)
    return data
  },
}

