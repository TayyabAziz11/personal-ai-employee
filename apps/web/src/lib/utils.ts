import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: Date | string | null): string {
  if (!date) return 'Never'
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  if (diffSecs < 60) return `${diffSecs}s ago`
  const diffMins = Math.floor(diffSecs / 60)
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function redactPii(text: string): string {
  return text
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '<redacted-email>')
    .replace(/\b\d{10,}\b/g, '<redacted-number>')
    .replace(/sk-[a-zA-Z0-9-]+/g, '<redacted-key>')
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer <redacted>')
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function statusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'healthy':
    case 'completed':
    case 'approved':
    case 'success':
      return 'text-emerald-400'
    case 'running':
    case 'unread':
    case 'pending_approval':
      return 'text-amber-400'
    case 'degraded':
    case 'draft':
      return 'text-yellow-400'
    case 'offline':
    case 'failed':
    case 'error':
      return 'text-red-400'
    case 'unknown':
    default:
      return 'text-zinc-500'
  }
}

export function statusDot(status: string): string {
  switch (status.toLowerCase()) {
    case 'healthy':
    case 'completed':
    case 'approved':
      return 'bg-emerald-400'
    case 'running':
    case 'unread':
    case 'pending_approval':
      return 'bg-amber-400 animate-pulse'
    case 'degraded':
      return 'bg-yellow-400'
    case 'offline':
    case 'failed':
      return 'bg-red-400'
    default:
      return 'bg-zinc-600'
  }
}

export function levelColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'success':
      return 'text-emerald-400'
    case 'warning':
      return 'text-amber-400'
    case 'error':
      return 'text-red-400'
    case 'info':
    default:
      return 'text-teal-400'
  }
}
