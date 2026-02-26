/**
 * Sync service — reads filesystem vault and upserts into Neon Postgres.
 */
import { prisma } from '@/lib/db'
import {
  readMcpActionsLog,
  readPlansFromFs,
  readInboxFromFs,
  readWatcherStatuses,
  readSystemLog,
} from '@/lib/fs-reader'

export interface SyncResult {
  connections: number
  plans: number
  inboxItems: number
  eventLogs: number
  errors: string[]
}

export async function syncFromFilesystem(): Promise<SyncResult> {
  const result: SyncResult = { connections: 0, plans: 0, inboxItems: 0, eventLogs: 0, errors: [] }

  // 1. Sync watcher/connection statuses
  try {
    const watchers = readWatcherStatuses()
    for (const w of watchers) {
      await prisma.connection.upsert({
        where: { name: w.name },
        update: {
          status: w.status,
          lastCheckedAt: w.lastRun ?? new Date(),
          displayName: w.displayName,
          metadata: { lastMessage: w.lastMessage, logFile: w.logFile },
        },
        create: {
          name: w.name,
          displayName: w.displayName,
          status: w.status,
          lastCheckedAt: w.lastRun ?? new Date(),
          metadata: { lastMessage: w.lastMessage, logFile: w.logFile },
        },
      })
      result.connections++
    }
  } catch (e) {
    result.errors.push(`connections: ${String(e)}`)
  }

  // 2. Sync plans
  try {
    const plans = readPlansFromFs()
    for (const p of plans) {
      await prisma.plan.upsert({
        where: { id: `fs:${p.filePath}` },
        update: {
          title: p.title,
          status: p.status,
          filePath: p.filePath,
          updatedAt: new Date(),
        },
        create: {
          id: `fs:${p.filePath}`,
          title: p.title,
          status: p.status,
          filePath: p.filePath,
          createdAt: p.createdAt,
        },
      })
      result.plans++
    }
  } catch (e) {
    result.errors.push(`plans: ${String(e)}`)
  }

  // 3. Sync inbox items from filesystem
  try {
    const items = readInboxFromFs()
    for (const item of items.slice(0, 100)) {
      const id = `fs:${item.filePath}`
      await prisma.inboxItem.upsert({
        where: { id },
        update: {
          excerpt: item.excerpt,
          status: item.status,
          updatedAt: new Date(),
        },
        create: {
          id,
          source: item.source,
          receivedAt: item.receivedAt,
          excerpt: item.excerpt,
          status: item.status,
          filePath: item.filePath,
          piiRedacted: true,
        },
      })
      result.inboxItems++
    }
  } catch (e) {
    result.errors.push(`inbox: ${String(e)}`)
  }

  // 4. Sync recent event logs from mcp_actions.log + system_log.md
  try {
    const mcpLogs = readMcpActionsLog(100)
    const sysLogs = readSystemLog(50)
    const allLogs = [...mcpLogs, ...sysLogs]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 150)

    for (const log of allLogs) {
      const id = `fs:${log.source}:${log.timestamp.getTime()}:${log.message.slice(0, 20)}`
      try {
        await prisma.eventLog.upsert({
          where: { id },
          update: {},
          create: {
            id,
            timestamp: log.timestamp,
            level: log.level,
            source: log.source,
            message: log.message,
            metadata: (log.metadata as object) ?? undefined,
          },
        })
        result.eventLogs++
      } catch { /* skip duplicate */ }
    }
  } catch (e) {
    result.errors.push(`eventLogs: ${String(e)}`)
  }

  return result
}
