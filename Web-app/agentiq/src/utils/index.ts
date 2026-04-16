import { clsx, type ClassValue } from 'clsx'

/** Merge Tailwind class names safely */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/** Format a date string to a readable format */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Truncate a URL to a readable length */
export function truncateUrl(url: string, max = 40): string {
  if (url.length <= max) return url
  try {
    const u = new URL(url)
    const path = u.pathname + u.search
    return `${u.host}${path.length > 20 ? path.slice(0, 20) + '…' : path}`
  } catch {
    return url.slice(0, max) + '…'
  }
}

/** Returns initials from a full name */
export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/** Human-friendly relative time */
export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1)  return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24)   return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/** Map an HTTP method to its badge colour variant */
export function methodVariant(method: string): string {
  const map: Record<string, string> = {
    GET: 'green', POST: 'blue', DELETE: 'red', PUT: 'orange', PATCH: 'purple',
  }
  return map[method.toUpperCase()] ?? 'gray'
}

/** Map severity string to badge colour variant */
export function severityVariant(severity: string): string {
  const map: Record<string, string> = {
    critical: 'red', high: 'orange', medium: 'orange', low: 'gray',
  }
  return map[severity.toLowerCase()] ?? 'gray'
}

/** Strip markdown code fences from AI response text */
export function stripJSON(raw: string): string {
  return raw.replace(/```json|```/g, '').trim()
}

/** Sleep for n milliseconds */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
