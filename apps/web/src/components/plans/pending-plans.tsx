'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  XCircle,
  Zap,
  Loader2,
  Clock,
  Briefcase,
  Mail,
  MessageSquare,
  Twitter,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface WebPlan {
  id: string
  title: string
  channel: string
  actionType: string
  status: string
  scheduledAt: string | null
  createdAt: string
  payload: Record<string, unknown>
}

interface PendingPlansProps {
  pending: WebPlan[]
  approved: WebPlan[]
  recent: WebPlan[]
}

const channelIcon: Record<string, React.ReactNode> = {
  linkedin: <Briefcase className="h-3.5 w-3.5 text-sky-400" />,
  gmail: <Mail className="h-3.5 w-3.5 text-red-400" />,
  whatsapp: <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />,
  twitter: <Twitter className="h-3.5 w-3.5 text-zinc-400" />,
}

const statusColors: Record<string, string> = {
  pending_approval: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  approved: 'text-teal-400 border-teal-500/30 bg-teal-500/10',
  scheduled: 'text-violet-400 border-violet-500/30 bg-violet-500/10',
  executed: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  failed: 'text-red-400 border-red-500/30 bg-red-500/10',
  rejected: 'text-zinc-500 border-zinc-700/50 bg-zinc-800/50',
  draft: 'text-zinc-400 border-zinc-600/30 bg-zinc-700/20',
}

function PlanRow({
  plan,
  showActions,
  onApprove,
  onReject,
  onExecute,
  processing,
}: {
  plan: WebPlan
  showActions: boolean
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onExecute?: (id: string) => void
  processing: string | null
}) {
  const [expanded, setExpanded] = useState(false)
  const isProcessing = processing === plan.id
  const p = plan.payload

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0d0d1a] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        {channelIcon[plan.channel] ?? <AlertTriangle className="h-3.5 w-3.5 text-zinc-500" />}

        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-zinc-200">{plan.title}</p>
          <p className="text-[10px] text-zinc-600">
            {formatRelativeTime(new Date(plan.createdAt))}
            {plan.scheduledAt && (
              <span className="ml-2 text-violet-400">
                · Scheduled: {new Date(plan.scheduledAt).toLocaleString()}
              </span>
            )}
          </p>
        </div>

        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusColors[plan.status] ?? 'text-zinc-400'}`}>
          {plan.status.replace('_', ' ')}
        </span>

        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-zinc-600 hover:text-zinc-300"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.04] px-4 py-3">
          {!!p.topic && (
            <p className="mb-2 text-xs text-zinc-400">
              <span className="text-zinc-600">Topic: </span>{String(p.topic)}
            </p>
          )}
          {!!p.body && (
            <p className="mb-2 text-xs leading-relaxed text-zinc-400 line-clamp-3">{String(p.body)}</p>
          )}
          {Array.isArray(p.hashtags) && (p.hashtags as unknown[]).length > 0 && (
            <p className="text-[10px] text-sky-400">{(p.hashtags as unknown[]).map((h) => `#${String(h)}`).join(' ')}</p>
          )}
        </div>
      )}

      {showActions && (
        <div className="flex items-center gap-2 border-t border-white/[0.04] px-4 py-2.5">
          {onApprove && (
            <button
              onClick={() => onApprove(plan.id)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-400 hover:bg-teal-500/20 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Approve
            </button>
          )}
          {onReject && (
            <button
              onClick={() => onReject(plan.id)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              <XCircle className="h-3 w-3" />
              Reject
            </button>
          )}
          {onExecute && (
            <button
              onClick={() => onExecute(plan.id)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
              Execute
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function PendingPlans({ pending, approved, recent }: PendingPlansProps) {
  const router = useRouter()
  const [processing, setProcessing] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function apiCall(url: string, planId: string, onDone: () => void) {
    setProcessing(planId)
    setErrors((e) => ({ ...e, [planId]: '' }))
    try {
      const res = await fetch(url, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) setErrors((e) => ({ ...e, [planId]: data.error ?? 'Failed' }))
      else onDone()
    } catch {
      setErrors((e) => ({ ...e, [planId]: 'Network error' }))
    } finally {
      setProcessing(null)
      router.refresh()
    }
  }

  const approve = (id: string) => apiCall(`/api/plans/${id}/approve`, id, () => {})
  const reject = (id: string) => apiCall(`/api/plans/${id}/reject`, id, () => {})
  const execute = (id: string) => apiCall(`/api/plans/${id}/execute`, id, () => {})

  const total = pending.length + approved.length + recent.length
  if (total === 0) return null

  return (
    <div className="space-y-6">
      {/* Pending approval */}
      {pending.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Pending Approval ({pending.length})
            </h3>
          </div>
          <div className="space-y-2">
            {pending.map((plan) => (
              <div key={plan.id}>
                <PlanRow
                  plan={plan}
                  showActions
                  onApprove={approve}
                  onReject={reject}
                  processing={processing}
                />
                {errors[plan.id] && (
                  <p className="mt-1 px-4 text-[10px] text-red-400">{errors[plan.id]}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Approved / scheduled */}
      {approved.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Approved — Ready to Execute ({approved.length})
            </h3>
          </div>
          <div className="space-y-2">
            {approved.map((plan) => (
              <div key={plan.id}>
                <PlanRow
                  plan={plan}
                  showActions
                  onExecute={execute}
                  onReject={reject}
                  processing={processing}
                />
                {errors[plan.id] && (
                  <p className="mt-1 px-4 text-[10px] text-red-400">{errors[plan.id]}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent history */}
      {recent.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Recent History
            </h3>
          </div>
          <div className="space-y-2">
            {recent.map((plan) => (
              <PlanRow key={plan.id} plan={plan} showActions={false} processing={null} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
