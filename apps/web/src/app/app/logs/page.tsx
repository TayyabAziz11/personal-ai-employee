'use client'

import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/layout/topbar'
import {
  ScrollText,
  ShieldCheck,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
} from 'lucide-react'

// ─── Audit log entry (Gold Tier schema) ────────────────────────────────────
interface AuditEntry {
  timestamp: string
  action_type: string
  actor: string
  target?: string
  parameters?: Record<string, unknown>
  approval_status: string
  approval_ref?: string
  approved_by: string
  result: string
  error?: string
}

// ─── Event log entry (legacy) ──────────────────────────────────────────────
interface EventEntry {
  id: string
  timestamp: string | Date
  level: string
  message: string
  source?: string
  metadata?: unknown
}

function resultBadge(result: string) {
  if (result === 'success')
    return <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-500/10 text-emerald-400">success</span>
  if (result === 'failure')
    return <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-red-500/10 text-red-400">failure</span>
  return <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-zinc-700/50 text-zinc-400">{result}</span>
}

function approvalBadge(status: string) {
  if (status === 'approved')
    return <span className="rounded px-1.5 py-0.5 text-[9px] bg-teal-500/10 text-teal-400">{status}</span>
  if (status === 'pending')
    return <span className="rounded px-1.5 py-0.5 text-[9px] bg-amber-500/10 text-amber-400">{status}</span>
  if (status === 'rejected')
    return <span className="rounded px-1.5 py-0.5 text-[9px] bg-red-500/10 text-red-400">{status}</span>
  return <span className="rounded px-1.5 py-0.5 text-[9px] bg-zinc-700/50 text-zinc-400">{status}</span>
}

function levelColor(level: string) {
  if (level === 'error') return 'text-red-400'
  if (level === 'warning') return 'text-amber-400'
  if (level === 'success') return 'text-emerald-400'
  return 'text-teal-400'
}

function formatTs(ts: string) {
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
}

// ─── Audit logs tab ─────────────────────────────────────────────────────────
function AuditLogsTab() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(7)
  const [availableDates, setAvailableDates] = useState<string[]>([])

  const load = useCallback(async (d: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/audit-logs?days=${d}`)
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setEntries(data.entries ?? [])
      setAvailableDates(data.availableDates ?? [])
    } catch {
      setError('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(days) }, [load, days])

  const counts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.result] = (acc[e.result] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[1, 7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-xs transition-all ${days === d ? 'bg-teal-500/10 border border-teal-500/20 text-teal-400' : 'border border-white/[0.06] text-zinc-500 hover:text-zinc-300'}`}
            >
              {d === 1 ? 'Today' : `Last ${d}d`}
            </button>
          ))}
        </div>
        <button
          onClick={() => load(days)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-all"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary badges */}
      {Object.entries(counts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-zinc-600">{entries.length} entries</span>
          {Object.entries(counts).map(([result, count]) => (
            <div key={result} className="flex items-center gap-1">
              {resultBadge(result)}
              <span className="text-[10px] text-zinc-600">{count}</span>
            </div>
          ))}
          {availableDates.length > 0 && (
            <span className="text-[10px] text-zinc-700">· {availableDates.length} log file(s) on disk</span>
          )}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12 text-xs text-zinc-600">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading audit logs…
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-12 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-zinc-700 mb-3" />
          <p className="text-sm font-medium text-zinc-500">No audit entries found</p>
          <p className="mt-1 text-xs text-zinc-700">
            Audit logs are written to <code className="text-teal-500/70">Logs/YYYY-MM-DD.json</code> whenever the AI executes an approved action.
          </p>
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[180px_1fr_100px_90px_90px] gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
            <span>Timestamp</span>
            <span>Action</span>
            <span>Approval</span>
            <span>By</span>
            <span>Result</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {entries.map((e, i) => (
              <div key={i} className="grid grid-cols-[180px_1fr_100px_90px_90px] gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <span className="text-[10px] font-mono text-zinc-600 truncate">
                  {formatTs(e.timestamp)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-zinc-300">{e.action_type}</p>
                  {e.target && <p className="truncate text-[10px] text-zinc-600">{e.target}</p>}
                  {e.approval_ref && (
                    <p className="truncate text-[10px] text-zinc-700 font-mono">{e.approval_ref}</p>
                  )}
                  {e.error && (
                    <p className="truncate text-[10px] text-red-400 mt-0.5">{e.error}</p>
                  )}
                </div>
                <span>{approvalBadge(e.approval_status)}</span>
                <span className="text-[10px] text-zinc-500">{e.approved_by}</span>
                <span>{resultBadge(e.result)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Event logs tab (legacy) ────────────────────────────────────────────────
function EventLogsTab() {
  const [logs, setLogs] = useState<EventEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/logs?live=true&pageSize=100')
      const data = await res.json()
      setLogs(data.logs ?? [])
    } catch {
      setError('Failed to load event logs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const levelCounts = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.level] = (acc[l.level] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {Object.entries(levelCounts).map(([level, count]) => (
            <div key={level} className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs">
              <span className={levelColor(level)}>{level}</span>
              <span className="font-mono text-zinc-600">{count}</span>
            </div>
          ))}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-all"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-xs text-zinc-600">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
        </div>
      )}

      {!loading && error && (
        <div className="text-xs text-red-400 px-1">{error}</div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="rounded-xl border border-white/[0.06] px-6 py-12 text-center text-xs text-zinc-600">
          No event logs found.
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
          {logs.map((l, i) => (
            <div key={l.id ?? i} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
              <span className={`mt-0.5 text-[10px] font-semibold w-16 shrink-0 ${levelColor(l.level)}`}>{l.level}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-300 break-words">{l.message}</p>
                {l.source && <p className="text-[10px] text-zinc-700 mt-0.5">{l.source}</p>}
              </div>
              <span className="text-[10px] font-mono text-zinc-700 shrink-0">
                {formatTs(String(l.timestamp))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function LogsPage() {
  const [tab, setTab] = useState<'audit' | 'events'>('audit')

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Topbar
        title="Logs"
        subtitle="Audit trail & event logs"
      />

      <div className="flex-1 overflow-y-auto bg-grid px-6 py-6">
        {/* Tab switcher */}
        <div className="mb-6 flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 w-fit">
          {([
            { key: 'audit', label: 'Audit Log', icon: ShieldCheck, desc: 'AI action audit trail (Logs/YYYY-MM-DD.json)' },
            { key: 'events', label: 'Event Log', icon: ScrollText, desc: 'System events & MCP actions' },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all ${tab === key ? 'bg-teal-500/10 border border-teal-500/20 text-teal-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'audit' ? <AuditLogsTab /> : <EventLogsTab />}
      </div>
    </div>
  )
}
