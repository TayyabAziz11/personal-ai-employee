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
  FileText,
  Trash2,
  Check,
  X,
  ImageIcon,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SerializedWebPlan {
  id: string
  title: string
  channel: string
  actionType: string
  status: string
  scheduledAt: string | null
  createdAt: string
  updatedAt: string
  payload: Record<string, unknown>
  filePath: string | null
}

const channelIcon: Record<string, React.ReactNode> = {
  linkedin: <Briefcase className="h-3.5 w-3.5 text-sky-400" />,
  gmail: <Mail className="h-3.5 w-3.5 text-red-400" />,
  whatsapp: <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />,
  twitter: <Twitter className="h-3.5 w-3.5 text-zinc-400" />,
}

const STATUS_STYLES: Record<string, string> = {
  pending_approval: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  approved: 'text-teal-400 border-teal-500/30 bg-teal-500/10',
  scheduled: 'text-violet-400 border-violet-500/30 bg-violet-500/10',
  executing: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  executed: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  failed: 'text-red-400 border-red-500/30 bg-red-500/10',
  rejected: 'text-zinc-500 border-zinc-700/50 bg-zinc-800/50',
  draft: 'text-zinc-400 border-zinc-600/30 bg-zinc-700/20',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function PlanCard({
  plan,
  onApprove,
  onReject,
  onExecute,
  onDelete,
  processing,
  error,
}: {
  plan: SerializedWebPlan
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onExecute?: (id: string) => void
  onDelete?: (id: string) => void
  processing: string | null
  error?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isProcessing = processing === plan.id
  const p = plan.payload

  // Image preview state
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(
    typeof p.previewImageUrl === 'string' ? p.previewImageUrl : null
  )
  const [regenerating, setRegenerating] = useState(false)
  const [regenError, setRegenError] = useState<string | null>(null)
  const [imgBroken, setImgBroken] = useState(false)

  const canRegenerateImage =
    plan.channel === 'linkedin' &&
    p.imageMode === 'generate' &&
    ['pending_approval', 'approved', 'draft', 'scheduled'].includes(plan.status)

  async function regenerateImage() {
    setRegenerating(true)
    setRegenError(null)
    setImgBroken(false)
    try {
      const res = await fetch(`/api/plans/${plan.id}/regenerate-image`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Regeneration failed')
      setPreviewImageUrl(data.imageUrl)
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : 'Regeneration failed')
    } finally {
      setRegenerating(false)
    }
  }

  const showApprove = !!onApprove && ['pending_approval', 'draft', 'scheduled'].includes(plan.status)
  const showReject = !!onReject && !['executed', 'rejected'].includes(plan.status)
  const showExecute = !!onExecute && plan.status === 'approved'
  const showDelete = !!onDelete && plan.status !== 'executing'
  const hasActions = showApprove || showReject || showExecute || showDelete

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden transition-all',
      plan.status === 'pending_approval' ? 'border-amber-500/20' :
      plan.status === 'approved' ? 'border-teal-500/20' :
      plan.status === 'executed' ? 'border-emerald-500/20' :
      plan.status === 'failed' ? 'border-red-500/20' :
      plan.status === 'rejected' ? 'border-zinc-700/30' :
      'border-white/[0.06]',
      'bg-[#0d0d1a]'
    )}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-shrink-0">
          {channelIcon[plan.channel] ?? <AlertTriangle className="h-3.5 w-3.5 text-zinc-500" />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-zinc-200">{plan.title}</p>
          <div className="flex items-center gap-2 text-[10px] text-zinc-600">
            <span className="capitalize">{plan.channel}</span>
            <span>·</span>
            <span>{plan.actionType.replace(/_/g, ' ')}</span>
            <span>·</span>
            <span>{timeAgo(plan.createdAt)}</span>
            {plan.scheduledAt && (
              <>
                <span>·</span>
                <span className="text-violet-400">
                  <Clock className="inline h-2.5 w-2.5 mr-0.5" />
                  {new Date(plan.scheduledAt).toLocaleString()}
                </span>
              </>
            )}
          </div>
        </div>

        <span className={cn(
          'flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium',
          STATUS_STYLES[plan.status] ?? 'text-zinc-400'
        )}>
          {plan.status.replace(/_/g, ' ')}
        </span>

        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex-shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-white/[0.04] px-4 py-3 space-y-2">
          {!!p.topic && (
            <p className="text-xs text-zinc-400">
              <span className="text-zinc-600">Topic: </span>{String(p.topic)}
            </p>
          )}
          {!!p.body && (
            <p className="text-xs leading-relaxed text-zinc-400 line-clamp-4 whitespace-pre-wrap">{String(p.body)}</p>
          )}
          {!!p.subject && (
            <p className="text-xs text-zinc-400">
              <span className="text-zinc-600">Subject: </span>{String(p.subject)}
            </p>
          )}
          {!!p.recipient && (
            <p className="text-xs text-zinc-400">
              <span className="text-zinc-600">To: </span>{String(p.recipient)}
            </p>
          )}
          {Array.isArray(p.hashtags) && (p.hashtags as unknown[]).length > 0 && (
            <p className="text-[10px] text-sky-400">
              {(p.hashtags as unknown[]).map((h) => `#${String(h)}`).join(' ')}
            </p>
          )}
          {!!p.cta && (
            <p className="text-[10px] text-teal-400">→ {String(p.cta)}</p>
          )}

          {/* Image preview (LinkedIn posts with images) */}
          {plan.channel === 'linkedin' && !!p.imageMode && p.imageMode !== 'none' && (
            <div className="mt-1">
              {previewImageUrl && !imgBroken ? (
                <div className="overflow-hidden rounded-xl border border-white/[0.08]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewImageUrl}
                    alt="Post image preview"
                    className="w-full object-cover"
                    style={{ maxHeight: 220 }}
                    onError={() => setImgBroken(true)}
                  />
                  <div className="flex items-center justify-between border-t border-white/[0.04] bg-white/[0.02] px-3 py-1.5">
                    <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                      <ImageIcon className="h-3 w-3" />
                      {p.imageMode === 'generate' ? 'AI-generated image preview' : 'Image preview'}
                    </span>
                    {canRegenerateImage && (
                      <button
                        onClick={regenerateImage}
                        disabled={regenerating}
                        className="flex items-center gap-1 rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-[10px] font-medium text-violet-400 hover:bg-violet-500/20 disabled:opacity-40 transition-all"
                      >
                        {regenerating ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <RefreshCw className="h-2.5 w-2.5" />}
                        {regenerating ? 'Regenerating…' : 'Regenerate'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                  <span className="flex items-center gap-2 text-xs text-zinc-500">
                    <ImageIcon className="h-3.5 w-3.5" />
                    {imgBroken ? 'Preview expired' : p.imageMode === 'generate' ? 'AI-generated image (no preview yet)' : `Image: ${String(p.imageFile ?? 'provided')}`}
                  </span>
                  {canRegenerateImage && (
                    <button
                      onClick={regenerateImage}
                      disabled={regenerating}
                      className="flex items-center gap-1.5 rounded-md border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-medium text-violet-400 hover:bg-violet-500/20 disabled:opacity-40 transition-all"
                    >
                      {regenerating ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <RefreshCw className="h-2.5 w-2.5" />}
                      {regenerating ? 'Generating…' : imgBroken ? 'Refresh Preview' : 'Generate Preview'}
                    </button>
                  )}
                </div>
              )}
              {regenError && <p className="mt-1 text-[10px] text-red-400">{regenError}</p>}
            </div>
          )}

          {plan.filePath && (
            <p className="font-mono text-[9px] text-zinc-700">{plan.filePath}</p>
          )}
        </div>
      )}

      {/* Action buttons */}
      {hasActions && (
        <div className="flex items-center gap-2 border-t border-white/[0.04] px-4 py-2.5">
          {showApprove && (
            <button
              onClick={() => onApprove!(plan.id)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-400 hover:bg-teal-500/20 disabled:opacity-50 transition-all"
            >
              {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Approve
            </button>
          )}
          {showExecute && (
            <button
              onClick={() => onExecute!(plan.id)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 transition-all"
            >
              {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
              Execute
            </button>
          )}
          {showReject && (
            <button
              onClick={() => onReject!(plan.id)}
              disabled={isProcessing}
              className="ml-auto flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-all"
            >
              <XCircle className="h-3 w-3" />
              Reject
            </button>
          )}
          {showDelete && (
            confirmDelete ? (
              <div className={cn(
                'flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1',
                !showReject && 'ml-auto'
              )}>
                <span className="text-[10px] text-red-400 mr-1">Delete?</span>
                <button
                  onClick={() => { setConfirmDelete(false); onDelete!(plan.id) }}
                  disabled={isProcessing}
                  title="Confirm delete"
                  className="rounded p-0.5 text-red-400 hover:bg-red-500/20"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  title="Cancel"
                  className="rounded p-0.5 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={isProcessing}
                title="Delete plan"
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border border-zinc-700/40 bg-zinc-800/30 px-2.5 py-1.5 text-xs text-zinc-600 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 disabled:opacity-40 transition-all',
                  !showReject && 'ml-auto'
                )}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            )
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="border-t border-red-500/20 bg-red-500/5 px-4 py-2">
          <p className="text-[10px] text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}

interface PlansListProps {
  plans: SerializedWebPlan[]
  showApprove?: boolean
  showReject?: boolean
  showExecute?: boolean
  showDelete?: boolean
  emptyMessage?: string
}

export function PlansList({ plans, showApprove, showReject, showExecute, showDelete = true, emptyMessage }: PlansListProps) {
  const router = useRouter()
  const [processing, setProcessing] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [localPlans, setLocalPlans] = useState(plans)

  async function apiCall(url: string, planId: string, method = 'POST') {
    setProcessing(planId)
    setErrors((e) => ({ ...e, [planId]: '' }))
    setMessages((m) => ({ ...m, [planId]: '' }))
    try {
      const res = await fetch(url, { method })
      const data = await res.json()
      if (!res.ok && res.status !== 409) {
        setErrors((e) => ({ ...e, [planId]: data.error ?? 'Request failed' }))
      } else if (data.message) {
        setMessages((m) => ({ ...m, [planId]: data.message }))
      }
    } catch {
      setErrors((e) => ({ ...e, [planId]: 'Network error' }))
    } finally {
      setProcessing(null)
      router.refresh()
    }
  }

  async function handleDelete(id: string) {
    setProcessing(id)
    try {
      const res = await fetch(`/api/plans/${id}/delete`, { method: 'DELETE' })
      if (res.ok) {
        setLocalPlans((prev) => prev.filter((p) => p.id !== id))
      } else {
        const data = await res.json()
        setErrors((e) => ({ ...e, [id]: data.error ?? 'Delete failed' }))
      }
    } catch {
      setErrors((e) => ({ ...e, [id]: 'Network error' }))
    } finally {
      setProcessing(null)
    }
  }

  const approve = showApprove ? (id: string) => apiCall(`/api/plans/${id}/approve`, id) : undefined
  const reject = showReject ? (id: string) => apiCall(`/api/plans/${id}/reject`, id) : undefined
  const execute = showExecute ? (id: string) => apiCall(`/api/plans/${id}/execute`, id) : undefined
  const deleteFn = showDelete ? handleDelete : undefined

  if (localPlans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText className="mb-3 h-8 w-8 text-zinc-700" />
        <p className="text-sm text-zinc-500">{emptyMessage ?? 'No plans found.'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {localPlans.map((plan) => (
        <div key={plan.id}>
          <PlanCard
            plan={plan}
            onApprove={approve}
            onReject={reject}
            onExecute={execute}
            onDelete={deleteFn}
            processing={processing}
            error={errors[plan.id] || messages[plan.id]}
          />
        </div>
      ))}
    </div>
  )
}
