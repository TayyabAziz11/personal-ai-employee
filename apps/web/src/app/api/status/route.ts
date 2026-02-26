import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { readNeedsActionCounts, readWatcherStatuses } from '@/lib/fs-reader'

export async function GET() {
  try {
    const [connections, lastRun, needsAction, watcherStatuses] = await Promise.all([
      prisma.connection.findMany({ orderBy: { name: 'asc' } }),
      prisma.run.findFirst({ orderBy: { startedAt: 'desc' } }),
      Promise.resolve(readNeedsActionCounts()),
      Promise.resolve(readWatcherStatuses()),
    ])

    // Merge DB connections with live FS watcher statuses
    const connectionMap = Object.fromEntries(connections.map((c) => [c.name, c]))
    const liveConnections = watcherStatuses.map((w) => ({
      name: w.name,
      displayName: w.displayName,
      status: w.status,
      lastCheckedAt: w.lastRun,
      lastMessage: w.lastMessage,
      ...(connectionMap[w.name] ? { dbId: connectionMap[w.name].id } : {}),
    }))

    return NextResponse.json({
      connections: liveConnections,
      lastRun: lastRun
        ? {
            id: lastRun.id,
            mode: lastRun.mode,
            status: lastRun.status,
            startedAt: lastRun.startedAt,
            completedAt: lastRun.completedAt,
            summary: lastRun.summary,
          }
        : null,
      needsAction,
      repoRootAvailable: !!process.env.REPO_ROOT || true,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[status] error:', err)
    return NextResponse.json(
      { error: 'Status check failed', detail: String(err) },
      { status: 500 }
    )
  }
}
