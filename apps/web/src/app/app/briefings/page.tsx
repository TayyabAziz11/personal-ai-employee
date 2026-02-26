'use client'

import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/layout/topbar'
import {
  Newspaper,
  RefreshCw,
  Loader2,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  Target,
  DollarSign,
} from 'lucide-react'

interface BusinessGoals {
  monthly_goal: number | null
  current_mtd: number | null
  annual_target: number | null
  pct_to_target: number | null
  last_updated: string | null
}

interface BriefingMeta {
  filename: string
  title: string
  week: string
  period: string
  generated: string
  mode: string
  size: number
}

function renderMarkdown(md: string): string {
  // Minimal markdown → HTML for display
  return md
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-zinc-100 mt-6 mb-2">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-sm font-semibold text-zinc-300 mt-5 mb-2 border-b border-white/[0.06] pb-1">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-xs font-semibold text-zinc-400 mt-3 mb-1">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-200">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-zinc-800 px-1 py-0.5 text-[11px] text-teal-400 font-mono">$1</code>')
    .replace(/^---$/gm, '<hr class="border-white/[0.06] my-4" />')
    .replace(/^\| (.+) \|$/gm, (line) => {
      const cells = line.split('|').filter(Boolean).map((c) => c.trim())
      if (cells.every((c) => /^[-: ]+$/.test(c))) return '' // separator row
      return `<tr>${cells.map((c) => `<td class="border border-white/[0.06] px-3 py-1.5 text-xs text-zinc-400">${c}</td>`).join('')}</tr>`
    })
    .replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, (rows) => `<div class="overflow-x-auto my-3"><table class="w-full border-collapse text-xs">${rows}</table></div>`)
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-xs text-zinc-400 list-disc">$1</li>')
    .replace(/(<li [\s\S]*?<\/li>\n?)+/g, (items) => `<ul class="space-y-0.5 my-2">${items}</ul>`)
    .replace(/\n\n/g, '</p><p class="text-xs text-zinc-400 my-2">')
    .replace(/^(?!<[a-z])(.+)$/gm, (line) => line ? `<p class="text-xs text-zinc-400 my-1">${line}</p>` : '')
}

export default function BriefingsPage() {
  const [briefings, setBriefings] = useState<BriefingMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [loadingContent, setLoadingContent] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState<{ success: boolean; message?: string } | null>(null)
  const [goals, setGoals] = useState<BusinessGoals | null>(null)

  const loadBriefings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/briefings')
      const data = await res.json()
      setBriefings(data.briefings ?? [])
    } catch {
      setError('Failed to load briefings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBriefings()
    fetch('/api/goals').then((r) => r.json()).then((d) => { if (!d.error) setGoals(d) }).catch(() => {})
  }, [loadBriefings])

  async function openBriefing(filename: string) {
    setSelected(filename)
    setContent(null)
    setLoadingContent(true)
    try {
      const res = await fetch(`/api/briefings/${encodeURIComponent(filename)}`)
      const data = await res.json()
      setContent(data.content ?? '')
    } catch {
      setContent('Failed to load briefing content.')
    } finally {
      setLoadingContent(false)
    }
  }

  async function generateBriefing() {
    setGenerating(true)
    setGenerateResult(null)
    try {
      const res = await fetch('/api/briefings/generate', { method: 'POST' })
      const data = await res.json()
      setGenerateResult({
        success: data.success,
        message: data.success ? 'Briefing generated successfully!' : (data.error ?? 'Generation failed'),
      })
      if (data.success) {
        await loadBriefings()
      }
    } catch {
      setGenerateResult({ success: false, message: 'Network error' })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Topbar
        title="CEO Briefings"
        subtitle="Monday Morning Executive Briefings — AI-generated weekly business intelligence"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar list */}
        <div className="flex w-72 shrink-0 flex-col border-r border-white/[0.06] bg-[#080810]">
          {/* Generate button */}
          <div className="p-4 border-b border-white/[0.06]">
            <button
              onClick={generateBriefing}
              disabled={generating}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal-500/20 bg-teal-500/5 py-2.5 text-sm text-teal-400 hover:bg-teal-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Now
                </>
              )}
            </button>
            {generateResult && (
              <div className={`mt-2 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] ${generateResult.success ? 'border border-teal-500/20 bg-teal-500/5 text-teal-400' : 'border border-red-500/20 bg-red-500/5 text-red-400'}`}>
                {generateResult.success ? <CheckCircle2 className="h-3 w-3 shrink-0" /> : <AlertCircle className="h-3 w-3 shrink-0" />}
                {generateResult.message}
              </div>
            )}
          </div>

          {/* Briefing list */}
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-1.5">
                <Newspaper className="h-3.5 w-3.5 text-teal-400" />
                <p className="text-xs font-medium text-zinc-400">Briefings ({briefings.length})</p>
              </div>
              <button
                onClick={loadBriefings}
                disabled={loading}
                className="text-zinc-600 hover:text-zinc-300 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-8 text-xs text-zinc-600">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
              </div>
            )}

            {!loading && error && (
              <div className="px-4 py-3 text-xs text-red-400">{error}</div>
            )}

            {!loading && !error && briefings.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-zinc-600">
                No briefings found.<br />
                <span className="text-zinc-700">Click &ldquo;Generate Now&rdquo; to create your first briefing.</span>
              </div>
            )}

            <div className="space-y-0.5 px-2">
              {briefings.map((b) => (
                <button
                  key={b.filename}
                  onClick={() => openBriefing(b.filename)}
                  className={`w-full flex items-start gap-3 rounded-lg px-3 py-3 text-left transition-all hover:bg-white/[0.04] ${selected === b.filename ? 'bg-teal-500/5 border border-teal-500/20' : 'border border-transparent'}`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-teal-500/20 bg-teal-500/5">
                    <Newspaper className="h-4 w-4 text-teal-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-zinc-300">{b.week || b.title}</p>
                    <p className="truncate text-[10px] text-zinc-600">{b.period || b.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {b.mode && (
                        <span className={`text-[9px] rounded px-1 py-0.5 font-medium ${b.mode === 'MOCK' ? 'bg-amber-500/10 text-amber-500' : 'bg-teal-500/10 text-teal-500'}`}>
                          {b.mode}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className={`h-3.5 w-3.5 shrink-0 mt-1 ${selected === b.filename ? 'text-teal-400' : 'text-zinc-700'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content pane */}
        <div className="flex-1 overflow-y-auto bg-grid px-8 py-6">
          {/* Business Goals bar — always visible when goals loaded */}
          {goals && (
            <div className="mb-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-teal-400" />
                <h3 className="text-xs font-semibold text-zinc-300">Business Goals — Q1 2026</h3>
                {goals.last_updated && (
                  <span className="ml-auto text-[10px] text-zinc-700">Updated {goals.last_updated}</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    icon: DollarSign,
                    label: 'Monthly Goal',
                    value: goals.monthly_goal != null ? `$${goals.monthly_goal.toLocaleString()}` : '—',
                    color: 'text-zinc-300',
                  },
                  {
                    icon: TrendingUp,
                    label: 'MTD Revenue',
                    value: goals.current_mtd != null ? `$${goals.current_mtd.toLocaleString()}` : '—',
                    color: 'text-teal-400',
                  },
                  {
                    icon: Target,
                    label: '% to Target',
                    value: goals.pct_to_target != null ? `${goals.pct_to_target}%` : '—',
                    color: goals.pct_to_target != null && goals.pct_to_target >= 80
                      ? 'text-emerald-400'
                      : goals.pct_to_target != null && goals.pct_to_target >= 50
                        ? 'text-amber-400'
                        : 'text-red-400',
                  },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
                      <Icon className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-600">{label}</p>
                      <p className={`text-sm font-semibold ${color}`}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Progress bar */}
              {goals.pct_to_target != null && (
                <div className="mt-3">
                  <div className="h-1.5 w-full rounded-full bg-white/[0.05]">
                    <div
                      className={`h-1.5 rounded-full transition-all ${goals.pct_to_target >= 80 ? 'bg-emerald-500' : goals.pct_to_target >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, goals.pct_to_target)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {!selected && (
            <div className="flex h-[calc(100%-160px)] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/5">
                <Newspaper className="h-8 w-8 text-teal-400" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-300">Monday Morning CEO Briefing</h3>
              <p className="mt-2 max-w-sm text-xs text-zinc-500">
                Select a briefing from the left to read it, or click &ldquo;Generate Now&rdquo; to create a new one.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3 max-w-md">
                {[
                  { icon: Calendar, label: 'Weekly', desc: 'Every Sunday night / Monday morning' },
                  { icon: Sparkles, label: 'AI-Generated', desc: 'Reads logs, tasks, invoices, social data' },
                  { icon: Clock, label: '9 Sections', desc: 'KPIs, Wins, Risks, Revenue+AR, Social, Priorities, Proactive…' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <Icon className="h-5 w-5 text-teal-400 mb-2" />
                    <p className="text-xs font-medium text-zinc-300">{label}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selected && loadingContent && (
            <div className="flex items-center justify-center py-20 text-xs text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading briefing…
            </div>
          )}

          {selected && !loadingContent && content && (
            <div className="mx-auto max-w-3xl">
              {/* Markdown rendered content */}
              <div
                className="prose-zinc leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
