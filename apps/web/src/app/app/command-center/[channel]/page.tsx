'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  Briefcase,
  Mail,
  MessageSquare,
  Twitter,
  Instagram,
  ActivitySquare,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Eye,
  RefreshCw,
  Loader2,
  ExternalLink,
  User,
  AlertCircle,
  Send,
  Sparkles,
  Image,
  MessageCircle,
} from 'lucide-react'
import { ActionWizard, type Channel } from '@/components/command-center/action-wizard'

// ── Channel metadata ──────────────────────────────────────────────────────────

const CHANNEL_META: Record<string, {
  label: string
  icon: React.ElementType
  color: string
  bg: string
  border: string
  description: string
  readActions: { key: string; label: string; description: string }[]
  createActions: { key: string; label: string }[]
}> = {
  linkedin: {
    label: 'LinkedIn',
    icon: Briefcase,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    description: 'Build thought leadership, share announcements, and engage your professional network.',
    readActions: [
      { key: 'view_recent', label: 'View Recent Posts', description: 'Read your recent LinkedIn posts' },
    ],
    createActions: [
      { key: 'post_text', label: 'Create Text Post' },
      { key: 'post_image', label: 'Create Post with Image' },
    ],
  },
  gmail: {
    label: 'Gmail',
    icon: Mail,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    description: 'Manage your email with AI assistance. All send actions require your approval.',
    readActions: [
      { key: 'search_inbox', label: 'Search Inbox', description: 'Search your Gmail inbox' },
    ],
    createActions: [
      { key: 'draft_email', label: 'Draft Email' },
      { key: 'send_email', label: 'Send Email (Approval Required)' },
    ],
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: MessageSquare,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    description: 'Business messaging with safety gates. Connect your WhatsApp Business account to get started.',
    readActions: [],
    createActions: [{ key: 'send_message', label: 'Send Message' }],
  },
  instagram: {
    label: 'Instagram',
    icon: Instagram,
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/10',
    border: 'border-fuchsia-500/20',
    description: 'Publish image posts via Graph API with approval gates. Perception-only watcher monitors new media and comments.',
    readActions: [
      { key: 'view_ig_media', label: 'View Recent Media', description: 'Load recent Instagram posts and comments' },
    ],
    createActions: [
      { key: 'post_image', label: 'Create Post (Image)' },
    ],
  },
  twitter: {
    label: 'Twitter / X',
    icon: Twitter,
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/10',
    border: 'border-zinc-500/20',
    description: 'Post tweets and threads with approval gates.',
    readActions: [],
    createActions: [{ key: 'post_tweet', label: 'Post Tweet' }],
  },
  odoo: {
    label: 'Odoo Accounting',
    icon: ActivitySquare,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    description: 'Manage accounting operations: invoices, payments, revenue reporting. All write actions require approval.',
    readActions: [
      { key: 'query_invoices', label: 'Query Invoices', description: 'List unpaid and overdue invoices' },
      { key: 'revenue_summary', label: 'Revenue Summary', description: 'Total invoiced, paid, outstanding this year' },
      { key: 'ar_aging', label: 'AR Aging Report', description: 'Accounts receivable aging buckets (0-30, 31-60, 61-90, 90+)' },
    ],
    createActions: [
      { key: 'create_invoice', label: 'Create Invoice (Approval Required)' },
    ],
  },
}

interface IntegrationStatus {
  connected: boolean
  displayName?: string
  profileUrl?: string
  source?: string
  metadata?: {
    person_urn?: string
    scope?: string
    is_expired?: boolean
    picture?: string
    cached_at?: string
    source?: string
  }
}

interface RecentPost {
  id: string
  text: string
  created: string
  likes?: number
  comments?: number
}

interface ConnectResult {
  connected: boolean
  displayName?: string
  profileUrl?: string
  profilePicture?: string
  personUrn?: string
  scope?: string
  isExpired?: boolean
  message?: string
}

interface GmailMessage {
  id: string
  threadId: string
  from: string
  subject: string
  snippet: string
  date: string
  unread: boolean
}

function isNumericId(s?: string) {
  return s ? /^\d+$/.test(s.trim()) : false
}

function getFriendlyDisplayName(name?: string, channel?: string, personUrn?: string): string {
  if (!name) {
    if (channel === 'gmail') return 'Gmail Account'
    if (channel === 'whatsapp') return 'WhatsApp Account'
    if (channel === 'twitter') return 'Twitter Account'
    if (channel === 'instagram') return 'Instagram Account'
    if (channel === 'odoo') return 'Odoo Accounting'
    return 'LinkedIn User'
  }
  if (isNumericId(name)) {
    if (channel === 'instagram') return 'Instagram Business Account'
    return 'LinkedIn Member'
  }
  return name
}

export default function ChannelWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const channel = (params.channel as string) ?? 'linkedin'
  const meta = CHANNEL_META[channel]

  const [showWizard, setShowWizard] = useState(false)
  const [replyToSender, setReplyToSender] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<IntegrationStatus | null>(null)
  const [connectResult, setConnectResult] = useState<ConnectResult | null>(null)
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([])
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [postsError, setPostsError] = useState<string | null>(null)

  // Gmail inbox state
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([])
  const [loadingInbox, setLoadingInbox] = useState(false)
  const [inboxError, setInboxError] = useState<string | null>(null)
  const [inboxQuery, setInboxQuery] = useState('is:inbox')
  const [creatingReply, setCreatingReply] = useState<string | null>(null)
  const [replyCreated, setReplyCreated] = useState<string | null>(null)

  // WhatsApp inbox state
  const [waMessages, setWaMessages] = useState<{ id: string; sender: string; received_at: string; excerpt: string; status: string; unread_count?: number }[]>([])
  const [waConnected, setWaConnected] = useState(false)
  const [waLastStatus, setWaLastStatus] = useState<string>('unknown')
  const [loadingWaInbox, setLoadingWaInbox] = useState(false)
  const [refreshingWa, setRefreshingWa] = useState(false)
  const [waError, setWaError] = useState<string | null>(null)

  // WhatsApp compose / quick-send state
  const [waSendTo, setWaSendTo] = useState('')
  const [waSendMsg, setWaSendMsg] = useState('')
  const [waSending, setWaSending] = useState(false)
  const [waSendResult, setWaSendResult] = useState<{ success: boolean; error?: string } | null>(null)
  const [waGenerating, setWaGenerating] = useState(false)
  const [waGenTopic, setWaGenTopic] = useState('')

  const isStub = channel === 'twitter'

  // Instagram state
  const [igMedia, setIgMedia] = useState<{ id: string; caption?: string; media_type?: string; timestamp?: string; permalink?: string; comments_count?: number }[]>([])
  const [loadingIgMedia, setLoadingIgMedia] = useState(false)
  const [igMediaError, setIgMediaError] = useState<string | null>(null)

  // Odoo accounting state
  const [odooInvoices, setOdooInvoices] = useState<{ invoice_number: string; customer_name: string; amount_total: number; status: string; due_date?: string; days_overdue?: number }[]>([])
  const [odooRevenue, setOdooRevenue] = useState<{ total_invoiced: number; total_paid: number; total_outstanding: number } | null>(null)
  const [odooArAging, setOdooArAging] = useState<{ current: number; '1_30': number; '31_60': number; '61_90': number; over_90: number } | null>(null)
  const [loadingOdooData, setLoadingOdooData] = useState(false)
  const [odooError, setOdooError] = useState<string | null>(null)
  const [odooQueryType, setOdooQueryType] = useState<'invoices' | 'revenue' | 'aging'>('invoices')
  const [odooMockMode, setOdooMockMode] = useState(true)
  const [odooDegraded, setOodooDegraded] = useState(false)

  // Handle OAuth callback params
  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')

    if (connected === '1') {
      // Refresh status after successful OAuth
      fetch('/api/integrations/status')
        .then((r) => r.json())
        .then((data) => setStatus(data[channel] ?? { connected: false }))
        .catch(() => {})
      // Clean URL
      router.replace(`/app/command-center/${channel}`)
    } else if (error) {
      router.replace(`/app/command-center/${channel}`)
    }
  }, [channel, router, searchParams])

  useEffect(() => {
    fetch('/api/integrations/status')
      .then((r) => r.json())
      .then((data) => setStatus(data[channel] ?? { connected: false }))
      .catch(() => setStatus({ connected: false }))
      .finally(() => setLoadingStatus(false))
  }, [channel])

  useEffect(() => {
    if (channel !== 'whatsapp') return
    loadWaInbox()
    // Auto-refresh every 60 s so the inbox stays live without manual clicks
    const timer = setInterval(() => loadWaInbox(), 60_000)
    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel])

  useEffect(() => {
    if (channel !== 'odoo') return
    loadOdooData('invoices')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel])

  // Check CLI token (existing flow)
  async function handleConnectCliToken() {
    if (channel !== 'linkedin') return
    setConnecting(true)
    setConnectResult(null)
    const res = await fetch('/api/integrations/linkedin/connect', { method: 'POST' })
    const data: ConnectResult = await res.json()
    setConnectResult(data)
    if (data.connected) {
      setStatus({
        connected: true,
        displayName: data.displayName,
        profileUrl: data.profileUrl,
        metadata: { picture: data.profilePicture, person_urn: data.personUrn, scope: data.scope, is_expired: data.isExpired },
      })
    }
    setConnecting(false)
  }

  async function loadGmailInbox(q?: string) {
    setLoadingInbox(true)
    setInboxError(null)
    const query = q ?? inboxQuery
    const res = await fetch(`/api/gmail/inbox?q=${encodeURIComponent(query)}&max=15`)
    const data = await res.json()
    setGmailMessages(data.messages ?? [])
    if (data.error) setInboxError(data.error)
    setLoadingInbox(false)
  }

  async function createReplyPlan(msg: GmailMessage) {
    setCreatingReply(msg.id)
    setReplyCreated(null)
    try {
      const res = await fetch('/api/gmail/reply-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msg.id, from: msg.from, subject: msg.subject, snippet: msg.snippet }),
      })
      const data = await res.json()
      if (data.success) {
        setReplyCreated(msg.id)
        setTimeout(() => setReplyCreated(null), 3000)
      }
    } finally {
      setCreatingReply(null)
    }
  }

  async function loadInstagramMedia() {
    setLoadingIgMedia(true)
    setIgMediaError(null)
    try {
      const res = await fetch('/api/instagram/media')
      const data = await res.json()
      setIgMedia(data.media ?? [])
      if (data.error) setIgMediaError(data.error)
    } catch {
      setIgMediaError('Failed to load Instagram media')
    } finally {
      setLoadingIgMedia(false)
    }
  }

  async function loadOdooData(queryType: 'invoices' | 'revenue' | 'aging') {
    setLoadingOdooData(true)
    setOdooError(null)
    setOdooQueryType(queryType)
    const opMap: Record<string, string> = {
      invoices: 'list_unpaid_invoices',
      revenue: 'revenue_summary',
      aging: 'ar_aging_summary',
    }
    try {
      const res = await fetch('/api/odoo/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: opMap[queryType] }),
      })
      const data = await res.json()
      if (data.error) { setOdooError(data.error); return }
      const inner = data.data ?? data
      const isDegraded = inner.degraded === true
      setOodooDegraded(isDegraded)
      setOdooMockMode(data.mock ?? true)
      if (queryType === 'invoices') setOdooInvoices(inner.invoices ?? data.invoices ?? [])
      if (queryType === 'revenue') setOdooRevenue({ total_invoiced: inner.total_invoiced ?? 0, total_paid: inner.total_paid ?? 0, total_outstanding: inner.total_outstanding ?? 0 })
      if (queryType === 'aging') setOdooArAging(inner.aging ?? data.aging ?? null)
    } catch {
      setOdooError('Failed to load Odoo data')
      setOodooDegraded(true)
    } finally {
      setLoadingOdooData(false)
    }
  }

  async function loadRecentPosts() {
    if (channel !== 'linkedin') return
    setLoadingPosts(true)
    setPostsError(null)
    const res = await fetch('/api/linkedin/recent')
    const data = await res.json()
    setRecentPosts(data.posts ?? [])
    if (data.error) setPostsError(data.error)
    setLoadingPosts(false)
  }

  async function loadWaInbox() {
    setLoadingWaInbox(true)
    setWaError(null)
    try {
      const res = await fetch('/api/whatsapp/inbox')
      const data = await res.json()
      setWaMessages(data.messages ?? [])
      setWaConnected(data.connected ?? false)
      setWaLastStatus(data.lastStatus ?? 'unknown')
    } catch {
      setWaError('Failed to load WhatsApp inbox')
    } finally {
      setLoadingWaInbox(false)
    }
  }

  async function refreshWaInbox() {
    setRefreshingWa(true)
    setWaError(null)
    try {
      const res = await fetch('/api/whatsapp/inbox/refresh', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        await loadWaInbox()
      } else {
        setWaError(data.error ?? 'Refresh failed')
      }
    } catch {
      setWaError('Failed to refresh WhatsApp inbox')
    } finally {
      setRefreshingWa(false)
    }
  }

  async function sendDirectWaMessage() {
    if (!waSendTo.trim() || !waSendMsg.trim()) return
    setWaSending(true)
    setWaSendResult(null)
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: waSendTo.trim(), message: waSendMsg.trim() }),
      })
      const data = await res.json()
      setWaSendResult({ success: data.success, error: data.error })
      if (data.success) {
        setWaSendMsg('')
        setWaGenTopic('')
        // Refresh inbox after 2 s so the sent message appears
        setTimeout(() => loadWaInbox(), 2000)
      }
    } catch {
      setWaSendResult({ success: false, error: 'Network error — could not reach server' })
    } finally {
      setWaSending(false)
    }
  }

  async function generateWaMessage() {
    if (!waGenTopic.trim() && !waSendMsg.trim()) return
    setWaGenerating(true)
    try {
      const res = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: waGenTopic.trim() || waSendMsg.trim(),
          channel: 'whatsapp',
          tone: 'Casual',
          length: 'Short',
          intent: 'Greeting',
        }),
      })
      const data = await res.json()
      if (data.content) setWaSendMsg(data.content)
    } catch { /* ignore */ }
    finally { setWaGenerating(false) }
  }

  if (!meta) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-zinc-500">Unknown channel: {channel}</p>
      </div>
    )
  }

  const Icon = meta.icon
  const profilePicture = status?.metadata?.picture ?? connectResult?.profilePicture
  const rawDisplayName = status?.displayName ?? connectResult?.displayName
  const displayName = getFriendlyDisplayName(rawDisplayName, channel, status?.metadata?.person_urn)
  const profileUrl = status?.profileUrl ?? connectResult?.profileUrl
  const isExpired = status?.metadata?.is_expired ?? connectResult?.isExpired
  const isWebOAuth = status?.metadata?.source === 'web_oauth'

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#07070f]">
      {/* Topbar */}
      <div className="flex h-14 items-center gap-3 border-b border-white/[0.06] bg-[#080810] px-6">
        <button
          onClick={() => router.push('/app/command-center')}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Command Center
        </button>
        <span className="text-zinc-700">/</span>
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${meta.color}`} />
          <span className="text-sm font-semibold text-zinc-200">{meta.label}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {loadingStatus ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-600" />
          ) : status?.connected ? (
            <span className="flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 text-[10px] font-medium text-teal-400">
              <span className="h-1 w-1 rounded-full bg-teal-400 animate-pulse" />
              Connected{displayName && !isNumericId(rawDisplayName) ? ` · ${displayName}` : ''}
              {isExpired && <span className="ml-1 text-amber-400">(token expired)</span>}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full border border-zinc-700/50 bg-zinc-800/50 px-2.5 py-1 text-[10px] text-zinc-500">
              <AlertTriangle className="h-3 w-3" />
              Not Connected
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="flex w-80 flex-col border-r border-white/[0.06] bg-[#080810] overflow-y-auto">
          {/* Channel overview */}
          <div className={`m-4 rounded-xl border ${meta.border} ${meta.bg} p-4`}>
            <div className="mb-2 flex items-center gap-2">
              <Icon className={`h-5 w-5 ${meta.color}`} />
              <h3 className="text-sm font-semibold text-zinc-100">{meta.label}</h3>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">{meta.description}</p>
          </div>

          {/* Account details card */}
          {status?.connected && (
            <div className="mx-4 mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Connected Account</p>
              <div className="flex items-center gap-3">
                {profilePicture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profilePicture}
                    alt={displayName}
                    className="h-10 w-10 rounded-full ring-1 ring-white/10"
                  />
                ) : (
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${meta.border} ${meta.bg}`}>
                    <User className={`h-5 w-5 ${meta.color}`} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-200">
                    {displayName}
                  </p>
                  {profileUrl && (
                    <a
                      href={profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1 text-[10px] ${meta.color} hover:underline`}
                    >
                      View profile
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                  {isWebOAuth && (
                    <span className="mt-0.5 inline-flex items-center gap-1 rounded px-1 py-0.5 text-[8px] bg-teal-500/10 text-teal-500">
                      Web OAuth
                    </span>
                  )}
                </div>
              </div>

              {status.metadata?.person_urn && (
                <p className="mt-2 font-mono text-[9px] text-zinc-700 truncate">
                  {status.metadata.person_urn}
                </p>
              )}
              {status.metadata?.scope && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {status.metadata.scope.split(/[\s,]+/).filter(Boolean).map((s) => (
                    <span key={s} className="rounded px-1 py-0.5 text-[8px] bg-zinc-800 text-zinc-500">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {isExpired && (
                <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2 py-1.5">
                  <AlertCircle className="h-3 w-3 text-amber-400 flex-shrink-0" />
                  <p className="text-[10px] text-amber-400">Token may be expired. Reconnect to refresh.</p>
                </div>
              )}
            </div>
          )}




          {/* Refresh token button for expired LinkedIn */}
          {channel === 'linkedin' && status?.connected && isExpired && (
            <div className="mx-4 mb-4">
              <button
                onClick={handleConnectCliToken}
                disabled={connecting}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
              >
                {connecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Refresh Token
              </button>
            </div>
          )}

          {isStub && (
            <div className="mx-4 mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-xs text-amber-400">Twitter / X integration coming soon.</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex-1 px-4 pb-4">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-zinc-600">Actions</p>
            <div className="space-y-1.5">
              {meta.createActions.map((action) => (
                <button
                  key={action.key}
                  disabled={isStub}
                  onClick={() => setShowWizard(true)}
                  className={`flex w-full items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left text-sm text-zinc-300 transition-all ${isStub ? 'opacity-40 cursor-not-allowed' : 'hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-zinc-100'}`}
                >
                  <Plus className={`h-3.5 w-3.5 flex-shrink-0 ${meta.color}`} />
                  {action.label}
                </button>
              ))}

              {meta.readActions.map((action) => (
                <button
                  key={action.key}
                  disabled={isStub || !status?.connected}
                  onClick={
                    action.key === 'view_recent' ? loadRecentPosts
                    : action.key === 'search_inbox' ? () => loadGmailInbox()
                    : action.key === 'view_wa_inbox' ? loadWaInbox
                    : action.key === 'view_ig_media' ? loadInstagramMedia
                    : undefined
                  }
                  className={`flex w-full items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left text-sm text-zinc-300 transition-all ${isStub || !status?.connected ? 'opacity-40 cursor-not-allowed' : 'hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-zinc-100'}`}
                >
                  <Eye className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {showWizard ? (
            <ActionWizard
              channel={channel as Channel}
              initialRecipient={replyToSender}
              onClose={() => { setShowWizard(false); setReplyToSender(undefined) }}
            />
          ) : (
            <div className="flex-1 overflow-y-auto bg-grid px-6 py-6">
              {/* LinkedIn recent posts */}
              {channel === 'linkedin' && (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-300">Recent Posts</h3>
                    <button
                      onClick={loadRecentPosts}
                      disabled={loadingPosts || !status?.connected}
                      className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.05] disabled:opacity-40"
                    >
                      {loadingPosts ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Refresh
                    </button>
                  </div>

                  {postsError && (
                    <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-400" />
                      <p className="text-xs text-red-400">{postsError}</p>
                    </div>
                  )}

                  {loadingPosts && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
                    </div>
                  )}

                  {!loadingPosts && recentPosts.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] py-12 text-center">
                      <Briefcase className="mb-3 h-8 w-8 text-zinc-700" />
                      <p className="text-sm text-zinc-500">No recent posts loaded</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {status?.connected
                          ? 'Click Refresh to load your recent LinkedIn posts'
                          : 'Connect LinkedIn first to view recent posts'}
                      </p>
                      {!status?.connected && (
                        <button
                          onClick={handleConnectCliToken}
                          disabled={connecting}
                          className="mt-4 flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm text-sky-400 hover:bg-sky-500/20"
                        >
                          {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          Check LinkedIn Token
                        </button>
                      )}
                    </div>
                  )}

                  {recentPosts.map((post) => (
                    <div key={post.id} className="mb-3 rounded-xl border border-white/[0.06] bg-[#0d0d1a] p-4">
                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{post.text}</p>
                      <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-600">
                        <span>{post.created ? new Date(post.created).toLocaleString() : ''}</span>
                        <div className="flex items-center gap-3">
                          {post.likes !== undefined && <span>{post.likes} likes</span>}
                          {post.comments !== undefined && <span>{post.comments} comments</span>}
                          {profileUrl && (
                            <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sky-400 hover:underline">
                              <ExternalLink className="h-3 w-3" />
                              Profile
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4">
                    <button
                      onClick={() => setShowWizard(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/5 py-3 text-sm text-sky-400 hover:bg-sky-500/10 transition-all"
                    >
                      <Plus className="h-4 w-4" />
                      Create a new LinkedIn post
                    </button>
                  </div>
                </section>
              )}

              {/* Gmail Inbox */}
              {channel === 'gmail' && (
                <section>
                  {/* Toolbar */}
                  <div className="mb-4 flex items-center gap-2">
                    <input
                      value={inboxQuery}
                      onChange={(e) => setInboxQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadGmailInbox()}
                      placeholder="Gmail search (e.g. is:inbox, is:unread)"
                      className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-red-500/40"
                    />
                    <button
                      onClick={() => loadGmailInbox()}
                      disabled={loadingInbox}
                      className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.05] disabled:opacity-40"
                    >
                      {loadingInbox ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      {loadingInbox ? 'Loading…' : 'Load Inbox'}
                    </button>
                    <button
                      onClick={() => setShowWizard(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                    >
                      <Plus className="h-3 w-3" />
                      New Email
                    </button>
                  </div>

                  {inboxError && (
                    <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-400" />
                      <p className="text-xs text-red-400">{inboxError}</p>
                    </div>
                  )}

                  {/* Email list */}
                  {gmailMessages.length === 0 && !loadingInbox && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] py-12 text-center">
                      <Mail className="mb-3 h-8 w-8 text-zinc-700" />
                      <p className="text-sm text-zinc-500">No emails loaded</p>
                      <p className="mt-1 text-xs text-zinc-600">Click &quot;Load Inbox&quot; to fetch your Gmail messages</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {gmailMessages.map((msg) => {
                      const senderName = msg.from.replace(/<[^>]+>/, '').trim() || msg.from
                      const senderEmail = msg.from.match(/<([^>]+)>/)?.[1] ?? ''
                      const dateStr = msg.date ? new Date(msg.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
                      return (
                        <div
                          key={msg.id}
                          className={`group rounded-xl border transition-colors hover:border-white/[0.12] ${msg.unread ? 'border-red-500/20 bg-[#0f0a0a]' : 'border-white/[0.06] bg-[#0d0d1a]'}`}
                        >
                          {/* Email card header */}
                          <div className="flex items-start gap-3 px-4 pt-3 pb-2">
                            {/* Avatar circle */}
                            <div className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${msg.unread ? 'bg-red-500/20 text-red-300' : 'bg-zinc-800 text-zinc-400'}`}>
                              {senderName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              {/* Sender row */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {msg.unread && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />}
                                  <span className={`truncate text-xs font-semibold ${msg.unread ? 'text-zinc-100' : 'text-zinc-300'}`}>
                                    {senderName}
                                  </span>
                                  {senderEmail && <span className="hidden sm:block truncate text-[10px] text-zinc-600">&lt;{senderEmail}&gt;</span>}
                                </div>
                                <span className="flex-shrink-0 text-[10px] text-zinc-600">{dateStr}</span>
                              </div>
                              {/* Subject */}
                              <p className={`mt-0.5 truncate text-xs ${msg.unread ? 'font-semibold text-zinc-200' : 'font-medium text-zinc-400'}`}>
                                {msg.subject || '(no subject)'}
                              </p>
                            </div>
                          </div>
                          {/* Snippet + action row */}
                          <div className="flex items-end justify-between gap-3 px-4 pb-3">
                            <p className="flex-1 text-[11px] leading-relaxed text-zinc-600 line-clamp-2">{msg.snippet}</p>
                            <div className="flex-shrink-0">
                              {replyCreated === msg.id ? (
                                <span className="flex items-center gap-1 rounded-lg border border-teal-500/30 bg-teal-500/10 px-2 py-1 text-[10px] text-teal-400">
                                  <CheckCircle2 className="h-3 w-3" /> Plan created
                                </span>
                              ) : (
                                <button
                                  onClick={() => createReplyPlan(msg)}
                                  disabled={creatingReply === msg.id}
                                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-zinc-400 opacity-0 transition-all group-hover:opacity-100 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 disabled:opacity-50"
                                >
                                  {creatingReply === msg.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Eye className="h-3 w-3" />
                                  )}
                                  {creatingReply === msg.id ? 'Creating…' : 'Reply Plan'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* WhatsApp Inbox */}
              {channel === 'whatsapp' && (
                <section>
                  {/* Toolbar */}
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-zinc-300">WhatsApp Inbox</span>
                      <span className="ml-2 text-[10px] text-zinc-600">
                        {waConnected ? (
                          <span className="text-teal-400">● Session active</span>
                        ) : (
                          <span className="text-amber-400">● {waLastStatus === 'unknown' ? 'No session' : waLastStatus} — run: python3 scripts/wa_setup.py</span>
                        )}
                      </span>
                    </div>
                    <button
                      onClick={loadWaInbox}
                      disabled={loadingWaInbox}
                      className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.05] disabled:opacity-40"
                    >
                      {loadingWaInbox ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Load
                    </button>
                    <button
                      onClick={refreshWaInbox}
                      disabled={refreshingWa || !waConnected}
                      title={waConnected ? 'Fetch new messages from WhatsApp Web' : 'Session not active — run: python3 scripts/wa_setup.py'}
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40"
                    >
                      {refreshingWa ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      {refreshingWa ? 'Fetching…' : 'Fetch New'}
                    </button>
                    <button
                      onClick={() => setShowWizard(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <Plus className="h-3 w-3" />
                      Send Message
                    </button>
                  </div>

                  {waError && (
                    <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
                      <p className="text-xs text-amber-400">{waError}</p>
                    </div>
                  )}

                  {!waConnected && (
                    <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                      <p className="text-xs font-semibold text-amber-400 mb-1">WhatsApp Web not paired</p>
                      <p className="text-[11px] text-amber-300/70 leading-relaxed">
                        Pair your device to enable real-time message fetching:<br />
                        <code className="font-mono bg-black/30 px-1 py-0.5 rounded">python3 scripts/wa_setup.py</code>
                      </p>
                    </div>
                  )}

                  {waMessages.length === 0 && !loadingWaInbox && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] py-12 text-center">
                      <MessageSquare className="mb-3 h-8 w-8 text-zinc-700" />
                      <p className="text-sm text-zinc-500">No intake wrappers found</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {waConnected
                          ? 'Click "Fetch New" to pull unread messages from WhatsApp Web'
                          : 'Pair your session first, then click "Fetch New"'}
                      </p>
                    </div>
                  )}

                  {loadingWaInbox && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
                    </div>
                  )}

                  <div className="space-y-2">
                    {waMessages.map((msg) => {
                      const isUnread = msg.status === 'unread' || (msg.unread_count ?? 0) > 0
                      // WhatsApp timestamps are relative ("Yesterday", "10:30") or ISO
                      const dateStr = msg.received_at
                        ? (msg.received_at.includes('T')
                            ? new Date(msg.received_at).toLocaleString(undefined, {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                              })
                            : msg.received_at)
                        : ''
                      const initial = (msg.sender || '?').charAt(0).toUpperCase()
                      return (
                        <div
                          key={msg.id}
                          className={`group rounded-xl border p-4 transition-colors hover:border-white/[0.12] ${isUnread ? 'border-emerald-500/20 bg-[#080f0a]' : 'border-white/[0.06] bg-[#0d0d1a]'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${isUnread ? 'bg-emerald-500/25 text-emerald-200' : 'bg-zinc-800 text-zinc-400'}`}>
                                {initial}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {isUnread && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />}
                                  <p className={`text-xs font-semibold truncate ${isUnread ? 'text-zinc-100' : 'text-zinc-300'}`}>
                                    {msg.sender || '(unknown)'}
                                  </p>
                                </div>
                                {dateStr && <p className="text-[10px] text-zinc-600">{dateStr}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {(msg.unread_count ?? 0) > 0 && (
                                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white">
                                  {msg.unread_count}
                                </span>
                              )}
                              {msg.status === 'pending' && (msg.unread_count ?? 0) === 0 && (
                                <span className="rounded px-1.5 py-0.5 text-[9px] font-medium bg-amber-500/10 text-amber-400">
                                  pending
                                </span>
                              )}
                            </div>
                          </div>
                          {msg.excerpt && (
                            <p className={`mt-2 text-[11px] leading-relaxed line-clamp-2 ${isUnread ? 'text-zinc-400' : 'text-zinc-600'}`}>
                              {msg.excerpt}
                            </p>
                          )}
                          <div className="mt-2 flex justify-end gap-2">
                            <button
                              onClick={() => { setWaSendTo(msg.sender); setWaSendMsg('') }}
                              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-zinc-400 opacity-0 transition-all group-hover:opacity-100 hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400"
                            >
                              <Plus className="h-3 w-3" />
                              Quick Reply
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* ── Compose / Quick-Send panel ──────────────────────────── */}
                  <div className="mt-4 rounded-xl border border-emerald-500/20 bg-[#080f0a] p-4">
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                      Quick Send
                    </p>

                    {/* To field */}
                    <div className="mb-2">
                      <label className="mb-1 block text-[10px] text-zinc-500">To (contact name or phone)</label>
                      <input
                        value={waSendTo}
                        onChange={(e) => setWaSendTo(e.target.value)}
                        placeholder="Mom · +923001234567 · exact name in WhatsApp"
                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-500/40"
                      />
                    </div>

                    {/* Topic for AI generation */}
                    <div className="mb-2">
                      <label className="mb-1 block text-[10px] text-zinc-500">
                        Topic (optional — for AI generation)
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={waGenTopic}
                          onChange={(e) => setWaGenTopic(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && generateWaMessage()}
                          placeholder="e.g. remind about tomorrow's meeting"
                          className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-violet-500/40"
                        />
                        <button
                          onClick={generateWaMessage}
                          disabled={waGenerating || (!waGenTopic.trim() && !waSendMsg.trim())}
                          title="Generate message with AI (uses OpenAI from .env)"
                          className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-[11px] text-violet-400 hover:bg-violet-500/20 disabled:opacity-40"
                        >
                          {waGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                          {waGenerating ? 'Writing…' : 'AI Write'}
                        </button>
                      </div>
                    </div>

                    {/* Message body */}
                    <div className="mb-3">
                      <label className="mb-1 block text-[10px] text-zinc-500">Message</label>
                      <textarea
                        value={waSendMsg}
                        onChange={(e) => setWaSendMsg(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendDirectWaMessage()
                        }}
                        placeholder="Type your message… (Ctrl+Enter to send)"
                        rows={3}
                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-500/40 resize-none"
                      />
                    </div>

                    {/* Result banner */}
                    {waSendResult && (
                      <div className={`mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] ${waSendResult.success ? 'border-teal-500/30 bg-teal-500/10 text-teal-400' : 'border-red-500/20 bg-red-500/5 text-red-400'}`}>
                        {waSendResult.success ? (
                          <><CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> Message sent!</>
                        ) : (
                          <><AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {waSendResult.error}</>
                        )}
                      </div>
                    )}

                    {/* Send button */}
                    <button
                      onClick={sendDirectWaMessage}
                      disabled={waSending || !waSendTo.trim() || !waSendMsg.trim() || !waConnected}
                      title={!waConnected ? 'Pair WhatsApp first: python3 scripts/wa_setup.py' : 'Send message'}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2 text-sm font-medium text-white transition-all hover:bg-emerald-500 disabled:opacity-40"
                    >
                      {waSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {waSending ? 'Sending…' : 'Send WhatsApp Message'}
                    </button>
                    {!waConnected && (
                      <p className="mt-1.5 text-center text-[10px] text-amber-500">
                        Session not paired — run: <code className="font-mono">python3 scripts/wa_setup.py</code>
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* Instagram Media Feed */}
              {channel === 'instagram' && (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-300">Recent Media</h3>
                    <button
                      onClick={loadInstagramMedia}
                      disabled={loadingIgMedia}
                      className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.05] disabled:opacity-40"
                    >
                      {loadingIgMedia ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      {loadingIgMedia ? 'Loading…' : 'Load Media'}
                    </button>
                  </div>

                  {igMediaError && (
                    <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-400" />
                      <p className="text-xs text-red-400">{igMediaError}</p>
                    </div>
                  )}

                  {!status?.connected && (
                    <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                      <p className="text-xs font-semibold text-amber-400 mb-1">Instagram not connected</p>
                      <p className="text-[11px] text-amber-300/70 leading-relaxed">
                        Add a valid token to <code className="font-mono bg-black/30 px-1 py-0.5 rounded">.secrets/instagram_credentials.json</code><br />
                        Then run: <code className="font-mono bg-black/30 px-1 py-0.5 rounded">python3 scripts/instagram_oauth_helper.py --status</code>
                      </p>
                    </div>
                  )}

                  {loadingIgMedia && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
                    </div>
                  )}

                  {!loadingIgMedia && igMedia.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] py-12 text-center">
                      <Instagram className="mb-3 h-8 w-8 text-zinc-700" />
                      <p className="text-sm text-zinc-500">No media loaded</p>
                      <p className="mt-1 text-xs text-zinc-600">Click &quot;Load Media&quot; to fetch recent posts</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {igMedia.map((item) => (
                      <div key={item.id} className="rounded-xl border border-fuchsia-500/10 bg-[#0d0a10] p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10">
                            {item.media_type === 'VIDEO' ? (
                              <Eye className="h-4 w-4 text-fuchsia-400" />
                            ) : (
                              <Image className="h-4 w-4 text-fuchsia-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="rounded px-1.5 py-0.5 text-[9px] font-medium bg-fuchsia-500/10 text-fuchsia-400">
                                {item.media_type ?? 'IMAGE'}
                              </span>
                              <span className="text-[10px] text-zinc-600">
                                {item.timestamp ? new Date(item.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            {item.caption && (
                              <p className="mt-2 text-xs text-zinc-300 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                                {item.caption}
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-3 text-[10px] text-zinc-600">
                              {item.comments_count !== undefined && (
                                <span className="flex items-center gap-1">
                                  <MessageCircle className="h-3 w-3" />
                                  {item.comments_count} comments
                                </span>
                              )}
                              {item.permalink && (
                                <a
                                  href={item.permalink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-fuchsia-400 hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View on Instagram
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => setShowWizard(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 py-3 text-sm text-fuchsia-400 hover:bg-fuchsia-500/10 transition-all"
                    >
                      <Plus className="h-4 w-4" />
                      Create a new Instagram post
                    </button>
                  </div>
                </section>
              )}

              {/* ── Odoo Accounting ─────────────────────────────────────────────────── */}
              {channel === 'odoo' && (
                <section className="space-y-4">
                  {/* Degraded mode banner — Odoo offline */}
                  {odooDegraded && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 text-xs text-red-400">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        <strong>Odoo offline — degraded mode.</strong> Read-only data unavailable. Remediation tasks have been written to{' '}
                        <code className="text-red-300">Needs_Action/</code>. Check your Odoo instance and retry.
                      </span>
                    </div>
                  )}
                  {/* Mock mode banner */}
                  {!odooDegraded && odooMockMode && (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Mock mode — using fixture data. Configure <code className="mx-1 text-amber-300">.secrets/odoo_credentials.json</code> to connect a real Odoo instance.
                    </div>
                  )}

                  {/* Query selector */}
                  <div className="flex gap-2 flex-wrap">
                    {([
                      { key: 'invoices', label: 'Unpaid Invoices' },
                      { key: 'revenue', label: 'Revenue Summary' },
                      { key: 'aging', label: 'AR Aging' },
                    ] as const).map((q) => (
                      <button
                        key={q.key}
                        onClick={() => loadOdooData(q.key)}
                        disabled={loadingOdooData}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                          odooQueryType === q.key
                            ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                            : 'border-zinc-700/50 bg-zinc-800/50 text-zinc-400 hover:border-amber-500/20 hover:text-amber-400'
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                    <button
                      onClick={() => loadOdooData(odooQueryType)}
                      disabled={loadingOdooData}
                      className="ml-auto flex items-center gap-1.5 rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-all"
                    >
                      <RefreshCw className={`h-3 w-3 ${loadingOdooData ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>

                  {odooError && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {odooError}
                    </div>
                  )}

                  {loadingOdooData && (
                    <div className="flex items-center gap-2 py-8 justify-center text-xs text-zinc-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading Odoo data…
                    </div>
                  )}

                  {/* Invoices table */}
                  {!loadingOdooData && odooQueryType === 'invoices' && odooInvoices.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-amber-500/10">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-amber-500/10 bg-amber-500/5">
                            <th className="px-4 py-2 text-left font-medium text-amber-400">Invoice #</th>
                            <th className="px-4 py-2 text-left font-medium text-amber-400">Customer</th>
                            <th className="px-4 py-2 text-right font-medium text-amber-400">Amount</th>
                            <th className="px-4 py-2 text-left font-medium text-amber-400">Status</th>
                            <th className="px-4 py-2 text-left font-medium text-amber-400">Due</th>
                          </tr>
                        </thead>
                        <tbody>
                          {odooInvoices.map((inv, i) => (
                            <tr key={inv.invoice_number + i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-2.5 font-mono text-zinc-300">{inv.invoice_number}</td>
                              <td className="px-4 py-2.5 text-zinc-400">{inv.customer_name}</td>
                              <td className="px-4 py-2.5 text-right text-zinc-200 font-medium">${(inv.amount_total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              <td className="px-4 py-2.5">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  inv.status === 'overdue' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                  inv.status === 'unpaid' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                  'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                                }`}>
                                  {inv.status}
                                  {inv.days_overdue ? ` (${inv.days_overdue}d)` : ''}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-zinc-500">{inv.due_date ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!loadingOdooData && odooQueryType === 'invoices' && odooInvoices.length === 0 && !odooError && (
                    <p className="py-8 text-center text-xs text-zinc-600">No unpaid invoices found.</p>
                  )}

                  {/* Revenue summary cards */}
                  {!loadingOdooData && odooQueryType === 'revenue' && odooRevenue && (
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Total Invoiced', value: odooRevenue.total_invoiced, color: 'text-zinc-200' },
                        { label: 'Total Paid', value: odooRevenue.total_paid, color: 'text-teal-400' },
                        { label: 'Outstanding', value: odooRevenue.total_outstanding, color: 'text-amber-400' },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
                          <p className="text-[10px] text-zinc-500 mb-1">{stat.label}</p>
                          <p className={`text-lg font-bold ${stat.color}`}>
                            ${(stat.value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AR Aging buckets */}
                  {!loadingOdooData && odooQueryType === 'aging' && odooArAging && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-zinc-500 mb-3">Accounts Receivable Aging</p>
                      {([
                        { key: 'current', label: 'Current (not due)' },
                        { key: '1_30', label: '1–30 days overdue' },
                        { key: '31_60', label: '31–60 days overdue' },
                        { key: '61_90', label: '61–90 days overdue' },
                        { key: 'over_90', label: '90+ days overdue' },
                      ] as const).map((bucket) => {
                        const val = (odooArAging as Record<string, number>)[bucket.key] ?? 0
                        const maxVal = Math.max(...Object.values(odooArAging).map(Number))
                        const pct = maxVal > 0 ? (val / maxVal) * 100 : 0
                        const isRisk = bucket.key === '61_90' || bucket.key === 'over_90'
                        return (
                          <div key={bucket.key} className="flex items-center gap-3">
                            <span className="w-44 shrink-0 text-[10px] text-zinc-500">{bucket.label}</span>
                            <div className="flex-1 rounded-full bg-zinc-800 h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${isRisk ? 'bg-red-500' : 'bg-amber-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-20 text-right text-xs font-medium text-zinc-300">
                              ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Create invoice CTA */}
                  <div className="pt-2">
                    <button
                      onClick={() => setShowWizard(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 py-3 text-sm text-amber-400 hover:bg-amber-500/10 transition-all"
                    >
                      <Plus className="h-4 w-4" />
                      Create Invoice (requires approval)
                    </button>
                  </div>
                </section>
              )}

              {/* Stubs */}
              {isStub && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border ${meta.border} ${meta.bg}`}>
                    <Icon className={`h-8 w-8 ${meta.color}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-300">Coming Soon</h3>
                  <p className="mt-2 max-w-sm text-xs text-zinc-500">
                    {meta.label} integration is planned. The UI and plan flow are ready — backend execution will be wired up in the next release.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
