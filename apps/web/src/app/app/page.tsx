import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  readWatcherStatuses,
  readNeedsActionCounts,
  readMcpActionsLog,
  readSystemLog,
  readAgentStats,
} from '@/lib/fs-reader'
import { Topbar } from '@/components/layout/topbar'
import { StatusCard } from '@/components/dashboard/status-card'
import { RunControls } from '@/components/dashboard/run-controls'
import { TimelineFeed } from '@/components/dashboard/timeline-feed'
import { SyncButton } from '@/components/dashboard/sync-button'
import { PendingPlans } from '@/components/plans/pending-plans'
import { SystemStatusCard } from '@/components/dashboard/system-status-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, statusColor, formatRelativeTime, redactPii } from '@/lib/utils'
import Link from 'next/link'
import {
  Mail,
  Briefcase,
  MessageSquare,
  Twitter,
  Instagram,
  ActivitySquare,
  AlertCircle,
  Clock,
  TrendingUp,
  Cpu,
  FileText,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Zap,
  ShieldCheck,
  BarChart2,
} from 'lucide-react'

// ── Brand config ─────────────────────────────────────────────────────────────

type Brand = 'linkedin' | 'gmail' | 'whatsapp' | 'instagram' | 'twitter' | 'odoo' | 'default'

const watcherConfig: Record<string, { icon: React.ReactNode; brand: Brand; label: string }> = {
  linkedin: {
    icon: <Briefcase className="h-4 w-4" />,
    brand: 'linkedin',
    label: 'LinkedIn',
  },
  gmail: {
    icon: <Mail className="h-4 w-4" />,
    brand: 'gmail',
    label: 'Gmail',
  },
  instagram: {
    icon: <Instagram className="h-4 w-4" />,
    brand: 'instagram',
    label: 'Instagram',
  },
  odoo: {
    icon: <ActivitySquare className="h-4 w-4" />,
    brand: 'odoo',
    label: 'Odoo',
  },
  twitter: {
    icon: <Twitter className="h-4 w-4" />,
    brand: 'twitter',
    label: 'Twitter / X',
  },
  whatsapp: {
    icon: <MessageSquare className="h-4 w-4" />,
    brand: 'whatsapp',
    label: 'WhatsApp',
  },
}

// Per-channel display config for activity strip
const channelActivityConfig: Array<{
  key: string
  label: string
  icon: React.ReactNode
  color: string
  bg: string
  border: string
}> = [
  {
    key: 'linkedin',
    label: 'LinkedIn Posts',
    icon: <Briefcase className="h-5 w-5" />,
    color: 'text-[#4da3ff]',
    bg: 'bg-[#0a66c2]/10',
    border: 'border-[#0a66c2]/20',
  },
  {
    key: 'gmail',
    label: 'Gmail Actions',
    icon: <Mail className="h-5 w-5" />,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp Msgs',
    icon: <MessageSquare className="h-5 w-5" />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    key: 'instagram',
    label: 'Instagram Posts',
    icon: <Instagram className="h-5 w-5" />,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
  },
  {
    key: 'twitter',
    label: 'Twitter Posts',
    icon: <Twitter className="h-5 w-5" />,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
  {
    key: 'odoo',
    label: 'Odoo Actions',
    icon: <ActivitySquare className="h-5 w-5" />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
]

// ── Data loading ──────────────────────────────────────────────────────────────

async function getDashboardData(userId: string) {
  const watchers    = readWatcherStatuses()
  const needsAction = readNeedsActionCounts()
  const fsLogs      = readMcpActionsLog(30)
  const systemLogs  = readSystemLog(20)
  const agentStats  = readAgentStats()

  let dbLogs: Array<{ id: string; timestamp: Date; level: string; source: string; message: string }> = []
  let lastRun = null
  let inboxSummary: Record<string, number> = {}
  let pendingPlans: Array<{
    id: string; title: string; channel: string; actionType: string; status: string
    scheduledAt: Date | null; createdAt: Date; payload: unknown
  }> = []
  let approvedPlans: typeof pendingPlans = []
  let recentPlans: typeof pendingPlans = []

  try {
    ;[dbLogs, lastRun, pendingPlans, approvedPlans, recentPlans] = await Promise.all([
      prisma.eventLog.findMany({ orderBy: { timestamp: 'desc' }, take: 30 }),
      prisma.run.findFirst({ orderBy: { startedAt: 'desc' } }),
      prisma.webPlan.findMany({
        where: { userId, status: 'pending_approval' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.webPlan.findMany({
        where: { userId, status: { in: ['approved', 'scheduled'] } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.webPlan.findMany({
        where: { userId, status: { in: ['executed', 'failed', 'rejected'] } },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
    ])

    const inboxGroups = await prisma.inboxItem.groupBy({
      by: ['source'],
      _count: { id: true },
      where: { status: 'unread' },
    })
    inboxSummary = Object.fromEntries(inboxGroups.map((g) => [g.source, g._count.id]))
  } catch { /* DB not ready */ }

  const events = dbLogs.length > 0
    ? dbLogs
    : fsLogs.map((e, i) => ({ id: `fs-${i}`, timestamp: e.timestamp, level: e.level, source: e.source, message: e.message }))

  const liveActivity = systemLogs.length > 0
    ? systemLogs
    : fsLogs.map((e, i) => ({ id: `fsl-${i}`, ...e }))

  return { watchers, needsAction, events, lastRun, inboxSummary, pendingPlans, approvedPlans, recentPlans, liveActivity, agentStats }
}

function serializePlans(plans: Array<{
  id: string; title: string; channel: string; actionType: string; status: string
  scheduledAt: Date | null; createdAt: Date; payload: unknown
}>) {
  return plans.map((p) => ({
    id: p.id, title: p.title, channel: p.channel, actionType: p.actionType,
    status: p.status, scheduledAt: p.scheduledAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(), payload: (p.payload as Record<string, unknown>) ?? {},
  }))
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId  = (session?.user as { id?: string })?.id ?? ''
  const { watchers, needsAction, events, lastRun, inboxSummary, pendingPlans, approvedPlans, recentPlans, liveActivity, agentStats } =
    await getDashboardData(userId)

  const totalInboxUnread = Object.values(inboxSummary).reduce((a, b) => a + b, 0)
  const totalPendingWeb  = pendingPlans.length + approvedPlans.length
  const approvalRate     = agentStats.total > 0
    ? Math.round((agentStats.approved / agentStats.total) * 100)
    : 0

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Topbar
        title="Dashboard"
        subtitle={`Welcome back, ${session?.user?.name ?? 'Agent'}`}
        actions={<SyncButton />}
      />

      <div className="flex-1 overflow-y-auto bg-grid px-6 py-6 space-y-6">

        {/* ── Quick stats row ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatChip icon={<AlertCircle className="h-4 w-4 text-amber-400" />}  label="Needs Action"     value={needsAction.needsAction}              valueClass="text-amber-400" />
          <StatChip icon={<Clock className="h-4 w-4 text-violet-400" />}       label="Pending Approval" value={needsAction.pendingApproval + totalPendingWeb} valueClass="text-violet-400" />
          <StatChip icon={<Mail className="h-4 w-4 text-sky-400" />}           label="Unread Inbox"     value={totalInboxUnread}                     valueClass="text-sky-400" />
          <StatChip icon={<TrendingUp className="h-4 w-4 text-teal-400" />}    label="Last Run"         value={lastRun ? formatRelativeTime(lastRun.startedAt) : 'Never'} valueClass={cn(statusColor(lastRun?.status ?? 'unknown'), 'text-sm')} />
        </div>

        {/* ── Agent Activity strip ──────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-teal-400" />
              Agent Activity
            </h2>
            <div className="flex items-center gap-4 text-[10px] text-zinc-600">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-teal-400" />
                {agentStats.approved} approved
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-400" />
                {agentStats.rejected} rejected
              </span>
              <span className="flex items-center gap-1">
                <BarChart2 className="h-3 w-3 text-zinc-500" />
                {approvalRate}% approval rate
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {channelActivityConfig.map(({ key, label, icon, color, bg, border }) => {
              const count = agentStats.byChannel[key] ?? 0
              return (
                <div
                  key={key}
                  className={cn(
                    'rounded-xl border p-4 flex flex-col gap-2',
                    count > 0 ? `${bg} ${border}` : 'border-white/[0.06] bg-white/[0.02]'
                  )}
                >
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', count > 0 ? bg : 'bg-white/[0.04]')}>
                    <span className={count > 0 ? color : 'text-zinc-600'}>{icon}</span>
                  </div>
                  <div>
                    <p className={cn('text-xl font-bold', count > 0 ? color : 'text-zinc-700')}>{count}</p>
                    <p className="text-[10px] text-zinc-600 leading-tight mt-0.5">{label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Main grid ─────────────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Watcher status */}
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Agent Watchers
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {watchers.map((w) => {
                  const cfg = watcherConfig[w.name]
                  return (
                    <StatusCard
                      key={w.name}
                      name={w.name}
                      displayName={w.displayName}
                      status={w.status}
                      lastRun={w.lastRun}
                      lastMessage={w.lastMessage}
                      icon={cfg?.icon}
                      brand={cfg?.brand ?? 'default'}
                      actionCount={agentStats.byChannel[w.name]}
                    />
                  )
                })}
              </div>
            </section>

            {/* Plans inbox */}
            {(pendingPlans.length > 0 || approvedPlans.length > 0 || recentPlans.length > 0) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-teal-400" />
                        Plans Inbox
                      </span>
                    </CardTitle>
                    <Link href="/app/command-center" className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-200">
                      <Cpu className="h-3 w-3" />
                      Create new
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <PendingPlans
                    pending={serializePlans(pendingPlans)}
                    approved={serializePlans(approvedPlans)}
                    recent={serializePlans(recentPlans)}
                  />
                </CardContent>
              </Card>
            )}

            {/* No plans yet — prompt */}
            {pendingPlans.length === 0 && approvedPlans.length === 0 && recentPlans.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <span className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-teal-400" />
                      Command Center
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-xs text-zinc-500">
                    Create and manage actions via the Command Center. Plans require your approval before execution.
                  </p>
                  <Link
                    href="/app/command-center"
                    className="inline-flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-2 text-sm font-medium text-teal-400 hover:bg-teal-500/20"
                  >
                    <Cpu className="h-4 w-4" />
                    Open Command Center
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Run controls */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Cycle</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-xs text-zinc-500">
                  Trigger the full perception → plan → report cycle. Dry-run is safe (no external
                  writes). Execute mode respects approval gates.
                </p>
                {lastRun && (
                  <div className="mb-4 flex items-center gap-2 text-xs">
                    <Badge variant={lastRun.status === 'completed' ? 'success' : lastRun.status === 'failed' ? 'error' : 'warning'}>
                      {lastRun.status}
                    </Badge>
                    <span className="text-zinc-500">
                      Last run {formatRelativeTime(lastRun.startedAt)} · {lastRun.mode} · {lastRun.scriptsRun} scripts
                    </span>
                  </div>
                )}
                <RunControls />
              </CardContent>
            </Card>

            {/* Audit + inbox summary row */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Audit log quick link */}
              <Link href="/app/logs" className="group block">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-teal-500/20 hover:bg-teal-500/[0.03] transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10">
                      <ShieldCheck className="h-4 w-4 text-teal-400" />
                    </div>
                    <p className="text-xs font-semibold text-zinc-300">Audit & Logs</p>
                  </div>
                  <p className="text-[10px] text-zinc-600 leading-relaxed">
                    Every AI-executed action is logged to <code className="text-teal-600">Logs/YYYY-MM-DD.json</code> with full approval trail.
                  </p>
                  <p className="mt-2 text-[10px] text-teal-500 group-hover:text-teal-400">
                    View audit log →
                  </p>
                </div>
              </Link>

              {/* Inbox summary */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
                    <Mail className="h-4 w-4 text-sky-400" />
                  </div>
                  <p className="text-xs font-semibold text-zinc-300">Inbox Summary</p>
                </div>
                {Object.keys(inboxSummary).length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(inboxSummary).map(([source, count]) => (
                      <div key={source} className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-2 py-2 text-center">
                        <p className="text-base font-bold text-teal-400">{count}</p>
                        <p className="text-[9px] capitalize text-zinc-600">{source}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-600">No unread items.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Agent summary card */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h3 className="mb-3 text-xs font-semibold text-zinc-400 flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-teal-400" />
                Lifetime Summary
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Total Actions', value: agentStats.total, color: 'text-zinc-200' },
                  { label: 'Approved', value: agentStats.approved, color: 'text-teal-400' },
                  { label: 'Rejected', value: agentStats.rejected, color: 'text-red-400' },
                  { label: 'Approval Rate', value: `${approvalRate}%`, color: approvalRate >= 80 ? 'text-teal-400' : 'text-amber-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500">{label}</span>
                    <span className={cn('text-sm font-bold', color)}>{value}</span>
                  </div>
                ))}
              </div>
              {agentStats.total > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 w-full rounded-full bg-white/[0.05]">
                    <div
                      className="h-1.5 rounded-full bg-teal-500 transition-all"
                      style={{ width: `${approvalRate}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Live activity */}
            <Card>
              <CardHeader>
                <CardTitle>Live Activity</CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[280px] pr-1">
                {liveActivity.length === 0 ? (
                  <p className="text-xs text-zinc-600">No activity yet. Run the daily cycle to start logging.</p>
                ) : (
                  <div className="space-y-2">
                    {liveActivity.slice(0, 20).map((entry, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px]">
                        <span className={cn(
                          'mt-0.5 flex-shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase',
                          entry.level === 'error'   ? 'bg-red-500/20 text-red-400' :
                          entry.level === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                          entry.level === 'success' ? 'bg-teal-500/20 text-teal-400' :
                          'bg-zinc-700/50 text-zinc-500'
                        )}>
                          {entry.level.slice(0, 4)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-zinc-400 leading-relaxed break-words">
                            {redactPii(entry.message.slice(0, 120))}
                          </p>
                          <p className="text-zinc-700 text-[9px]">{entry.source}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Event Timeline</CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[400px] pr-1">
                <TimelineFeed events={events} maxItems={40} />
              </CardContent>
            </Card>

            {/* PM2 process health */}
            <SystemStatusCard />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── StatChip ──────────────────────────────────────────────────────────────────

function StatChip({ icon, label, value, valueClass }: {
  icon: React.ReactNode; label: string; value: string | number; valueClass?: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0d0d1a] px-4 py-3">
      {icon}
      <div>
        <p className={cn('text-base font-bold', valueClass)}>{value}</p>
        <p className="text-[10px] text-zinc-600">{label}</p>
      </div>
    </div>
  )
}
