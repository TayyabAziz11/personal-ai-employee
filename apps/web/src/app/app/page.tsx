import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { readWatcherStatuses, readNeedsActionCounts, readMcpActionsLog } from '@/lib/fs-reader'
import { Topbar } from '@/components/layout/topbar'
import { StatusCard } from '@/components/dashboard/status-card'
import { RunControls } from '@/components/dashboard/run-controls'
import { TimelineFeed } from '@/components/dashboard/timeline-feed'
import { SyncButton } from '@/components/dashboard/sync-button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, statusColor, formatRelativeTime } from '@/lib/utils'
import {
  Mail,
  Briefcase,
  MessageSquare,
  Twitter,
  ActivitySquare,
  AlertCircle,
  Clock,
  TrendingUp,
} from 'lucide-react'

const watcherIcons: Record<string, React.ReactNode> = {
  gmail: <Mail className="h-4 w-4" />,
  linkedin: <Briefcase className="h-4 w-4" />,
  odoo: <ActivitySquare className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  whatsapp: <MessageSquare className="h-4 w-4" />,
}

async function getDashboardData() {
  // Read live filesystem data
  const watchers = readWatcherStatuses()
  const needsAction = readNeedsActionCounts()
  const fsLogs = readMcpActionsLog(30)

  // Read from DB (will be empty until sync runs)
  let dbLogs: Array<{
    id: string
    timestamp: Date
    level: string
    source: string
    message: string
  }> = []
  let lastRun = null
  let inboxSummary: Record<string, number> = {}

  try {
    ;[dbLogs, lastRun] = await Promise.all([
      prisma.eventLog.findMany({ orderBy: { timestamp: 'desc' }, take: 30 }),
      prisma.run.findFirst({ orderBy: { startedAt: 'desc' } }),
    ])

    const inboxGroups = await prisma.inboxItem.groupBy({
      by: ['source'],
      _count: { id: true },
      where: { status: 'unread' },
    })
    inboxSummary = Object.fromEntries(inboxGroups.map((g) => [g.source, g._count.id]))
  } catch {
    // DB not ready yet — show FS data only
  }

  // Merge events: prefer DB, fall back to FS
  const events =
    dbLogs.length > 0
      ? dbLogs
      : fsLogs.map((e, i) => ({
          id: `fs-${i}`,
          timestamp: e.timestamp,
          level: e.level,
          source: e.source,
          message: e.message,
        }))

  return { watchers, needsAction, events, lastRun, inboxSummary }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const { watchers, needsAction, events, lastRun, inboxSummary } = await getDashboardData()

  const totalInboxUnread = Object.values(inboxSummary).reduce((a, b) => a + b, 0)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Topbar
        title="Command Center"
        subtitle={`Welcome back, ${session?.user?.name ?? 'Agent'}`}
        actions={<SyncButton />}
      />

      <div className="flex-1 overflow-y-auto bg-grid px-6 py-6">
        {/* Quick stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatChip
            icon={<AlertCircle className="h-4 w-4 text-amber-400" />}
            label="Needs Action"
            value={needsAction.needsAction}
            valueClass="text-amber-400"
          />
          <StatChip
            icon={<Clock className="h-4 w-4 text-violet-400" />}
            label="Pending Approval"
            value={needsAction.pendingApproval}
            valueClass="text-violet-400"
          />
          <StatChip
            icon={<Mail className="h-4 w-4 text-sky-400" />}
            label="Unread Inbox"
            value={totalInboxUnread}
            valueClass="text-sky-400"
          />
          <StatChip
            icon={<TrendingUp className="h-4 w-4 text-teal-400" />}
            label="Last Run"
            value={lastRun ? formatRelativeTime(lastRun.startedAt) : 'Never'}
            valueClass={cn(statusColor(lastRun?.status ?? 'unknown'), 'text-sm')}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column: watchers + run controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Watcher status */}
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Agent Watchers
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {watchers.map((w) => (
                  <StatusCard
                    key={w.name}
                    name={w.name}
                    displayName={w.displayName}
                    status={w.status}
                    lastRun={w.lastRun}
                    lastMessage={w.lastMessage}
                    icon={watcherIcons[w.name]}
                  />
                ))}
              </div>
            </section>

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
                    <Badge
                      variant={
                        lastRun.status === 'completed'
                          ? 'success'
                          : lastRun.status === 'failed'
                            ? 'error'
                            : 'warning'
                      }
                    >
                      {lastRun.status}
                    </Badge>
                    <span className="text-zinc-500">
                      Last run {formatRelativeTime(lastRun.startedAt)} · {lastRun.mode} ·{' '}
                      {lastRun.scriptsRun} scripts
                    </span>
                  </div>
                )}
                <RunControls />
              </CardContent>
            </Card>

            {/* Inbox summary */}
            {Object.keys(inboxSummary).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Inbox Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(inboxSummary).map(([source, count]) => (
                      <div
                        key={source}
                        className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-center"
                      >
                        <p className="text-lg font-bold text-teal-400">{count}</p>
                        <p className="text-[10px] capitalize text-zinc-600">{source}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column: timeline */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Event Timeline</CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[600px] pr-1">
                <TimelineFeed events={events} maxItems={40} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatChip({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  valueClass?: string
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
