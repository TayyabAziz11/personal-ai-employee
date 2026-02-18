import { prisma } from '@/lib/db'
import { readMcpActionsLog, readSystemLog } from '@/lib/fs-reader'
import { Topbar } from '@/components/layout/topbar'
import { TimelineFeed } from '@/components/dashboard/timeline-feed'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

async function getLogs() {
  try {
    const dbLogs = await prisma.eventLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 200,
    })
    if (dbLogs.length > 0) {
      return { logs: dbLogs, source: 'db' as const }
    }
  } catch { /* DB not ready */ }

  // Fall back to live FS logs
  const mcpLogs = readMcpActionsLog(150)
  const sysLogs = readSystemLog(50)
  const combined = [...mcpLogs, ...sysLogs]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 200)
    .map((l, i) => ({ id: `fs-${i}`, ...l }))

  return { logs: combined, source: 'fs' as const }
}

export default async function LogsPage() {
  const { logs, source } = await getLogs()

  const levelCounts = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.level] = (acc[l.level] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Topbar
        title="Event Logs"
        subtitle={`${logs.length} entries · source: ${source}`}
      />

      <div className="flex-1 overflow-y-auto bg-grid px-6 py-6">
        {/* Level summary */}
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(levelCounts).map(([level, count]) => (
            <div
              key={level}
              className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs"
            >
              <span
                className={
                  level === 'error'
                    ? 'text-red-400'
                    : level === 'warning'
                      ? 'text-amber-400'
                      : level === 'success'
                        ? 'text-emerald-400'
                        : 'text-teal-400'
                }
              >
                {level}
              </span>
              <span className="font-mono text-zinc-600">{count}</span>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <TimelineFeed events={logs} maxItems={200} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
