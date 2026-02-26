/**
 * File system reader — reads vault files from the repo root.
 * In production (Vercel), REPO_ROOT will be empty and all functions return
 * empty arrays gracefully. The DB holds synced data.
 */
import fs from 'fs'
import path from 'path'
import { redactPii } from '@/lib/utils'

// Resolve repo root: set REPO_ROOT env var explicitly, or auto-detect as 2 levels up
function getRepoRoot(): string {
  if (process.env.REPO_ROOT) return process.env.REPO_ROOT
  // apps/web is at <repo>/apps/web; process.cwd() in Next.js = apps/web
  return path.resolve(process.cwd(), '..', '..')
}

function safeReadDir(dirPath: string): string[] {
  try {
    if (!fs.existsSync(dirPath)) return []
    return fs.readdirSync(dirPath)
  } catch {
    return []
  }
}

function safeReadFile(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

// ── Needs Action ─────────────────────────────────────────────────────────────

export interface NeedsActionCounts {
  needsAction: number
  pendingApproval: number
  total: number
}

export function readNeedsActionCounts(): NeedsActionCounts {
  const root = getRepoRoot()
  const needsAction = safeReadDir(path.join(root, 'Needs_Action')).filter(
    (f) => f.endsWith('.md') || f.endsWith('.txt')
  ).length
  const pendingApproval = safeReadDir(path.join(root, 'Pending_Approval')).filter(
    (f) => f.endsWith('.md') || f.endsWith('.txt')
  ).length
  return { needsAction, pendingApproval, total: needsAction + pendingApproval }
}

// ── Plans ─────────────────────────────────────────────────────────────────────

export interface PlanFile {
  filePath: string
  title: string
  status: string
  createdAt: Date
}

export function readPlansFromFs(): PlanFile[] {
  const root = getRepoRoot()
  const plansDir = path.join(root, 'Plans')
  const files = safeReadDir(plansDir).filter((f) => f.startsWith('PLAN_') && f.endsWith('.md'))

  return files
    .map((f) => {
      const fullPath = path.join(plansDir, f)
      const content = safeReadFile(fullPath) ?? ''

      // Extract title from first heading or filename
      const headingMatch = content.match(/^#\s+(.+)$/m)
      const title = headingMatch
        ? headingMatch[1].trim()
        : f.replace(/^PLAN_\d{8}-\d{4}__/, '').replace(/\.md$/, '').replace(/_/g, ' ')

      // Infer status from folder + content
      let status = 'draft'
      const approvedDir = path.join(root, 'Approved')
      if (safeReadDir(approvedDir).includes(f)) status = 'approved'
      else if (content.toLowerCase().includes('status: approved')) status = 'approved'
      else if (content.toLowerCase().includes('status: pending')) status = 'pending_approval'
      else if (content.toLowerCase().includes('status: completed')) status = 'completed'
      else if (content.toLowerCase().includes('status: failed')) status = 'failed'

      // Parse date from filename PLAN_YYYYMMDD-HHMM
      const dateMatch = f.match(/PLAN_(\d{8})-(\d{4})/)
      let createdAt = new Date()
      if (dateMatch) {
        const ds = dateMatch[1]
        const ts = dateMatch[2]
        createdAt = new Date(
          `${ds.slice(0, 4)}-${ds.slice(4, 6)}-${ds.slice(6, 8)}T${ts.slice(0, 2)}:${ts.slice(2, 4)}:00`
        )
      }

      return {
        filePath: path.join('Plans', f),
        title,
        status,
        createdAt,
      }
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

// ── MCP Action Log ────────────────────────────────────────────────────────────

export interface LogEntry {
  timestamp: Date
  level: string
  source: string
  message: string
  metadata?: Record<string, unknown>
}

export function readMcpActionsLog(maxLines = 200): LogEntry[] {
  const root = getRepoRoot()
  const logPath = path.join(root, 'Logs', 'mcp_actions.log')
  const content = safeReadFile(logPath)
  if (!content) return []

  const lines = content.split('\n').filter(Boolean)
  const recent = lines.slice(-maxLines)

  return recent
    .map((line) => {
      try {
        const obj = JSON.parse(line)
        const ts = obj.timestamp || obj.ts || obj.time || new Date().toISOString()
        const level = (obj.level || obj.status || 'info').toLowerCase()
        const source = obj.source || obj.tool || obj.channel || 'system'
        const message = redactPii(
          obj.message || obj.action || obj.summary || obj.text || JSON.stringify(obj)
        )
        return {
          timestamp: new Date(ts),
          level: ['error', 'warning', 'success', 'info'].includes(level) ? level : 'info',
          source,
          message,
          metadata: obj.details ?? obj.metadata ?? undefined,
        }
      } catch {
        return {
          timestamp: new Date(),
          level: 'info',
          source: 'system',
          message: redactPii(line.slice(0, 200)),
        }
      }
    })
    .reverse()
}

// ── system_log.md ─────────────────────────────────────────────────────────────

export function readSystemLog(maxEntries = 100): LogEntry[] {
  const root = getRepoRoot()
  const logPath = path.join(root, 'system_log.md')
  const content = safeReadFile(logPath)
  if (!content) return []

  const entries: LogEntry[] = []
  const lines = content.split('\n')

  for (const line of lines) {
    // Match patterns like: - 2026-02-18 10:30 | INFO | source | message
    const match = line.match(/^\s*[-*]\s+(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}[^\|]*)\|?\s*(\w+)?\s*\|?\s*(\w+)?\s*\|?\s*(.+)?$/)
    if (match) {
      const ts = match[1]?.trim()
      const level = (match[2] || 'info').toLowerCase()
      const source = match[3] || 'system'
      const message = redactPii((match[4] || '').trim())
      if (ts && message) {
        entries.push({
          timestamp: new Date(ts),
          level: ['error', 'warning', 'success', 'info'].includes(level) ? level : 'info',
          source,
          message,
        })
      }
    }
  }

  return entries.slice(-maxEntries).reverse()
}

// ── Inbox items from Needs_Action ─────────────────────────────────────────────

export interface InboxFileItem {
  filePath: string
  source: string
  receivedAt: Date
  excerpt: string
  status: string
}

export function readInboxFromFs(): InboxFileItem[] {
  const root = getRepoRoot()
  const dirs = [
    { dir: path.join(root, 'Needs_Action'), status: 'unread' },
    { dir: path.join(root, 'Pending_Approval'), status: 'actioned' },
    { dir: path.join(root, 'Approved'), status: 'read' },
  ]

  const items: InboxFileItem[] = []

  for (const { dir, status } of dirs) {
    const files = safeReadDir(dir).filter((f) => f.endsWith('.md'))
    for (const f of files.slice(0, 50)) {
      const fullPath = path.join(dir, f)
      const content = safeReadFile(fullPath) ?? ''
      const source = detectSource(f, content)
      const createdAt = getFileMtime(fullPath)

      items.push({
        filePath: path.relative(root, fullPath),
        source,
        receivedAt: createdAt,
        excerpt: redactPii(content.slice(0, 300)),
        status,
      })
    }
  }

  return items.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime())
}

function detectSource(filename: string, content: string): string {
  const lower = filename.toLowerCase() + content.slice(0, 100).toLowerCase()
  if (lower.includes('gmail') || lower.includes('email')) return 'gmail'
  if (lower.includes('linkedin')) return 'linkedin'
  if (lower.includes('twitter') || lower.includes('tweet')) return 'twitter'
  if (lower.includes('whatsapp')) return 'whatsapp'
  if (lower.includes('odoo')) return 'odoo'
  return 'filesystem'
}

function getFileMtime(filePath: string): Date {
  try {
    return fs.statSync(filePath).mtime
  } catch {
    return new Date()
  }
}

// ── Watcher health ────────────────────────────────────────────────────────────

export interface WatcherStatus {
  name: string
  displayName: string
  logFile: string
  checkpointFile: string
  status: string
  lastRun: Date | null
  lastMessage: string
}

// ── Agent Activity Stats ──────────────────────────────────────────────────────

export interface AgentActivityStats {
  total: number
  approved: number
  rejected: number
  byChannel: Record<string, number>
  byAction: Record<string, number>
}

export function readAgentStats(): AgentActivityStats {
  const root = getRepoRoot()
  const stats: AgentActivityStats = { total: 0, approved: 0, rejected: 0, byChannel: {}, byAction: {} }

  const countDir = (dir: string, kind: 'approved' | 'rejected') => {
    const files = safeReadDir(path.join(root, dir)).filter(
      (f) => f.startsWith('WEBPLAN_') && f.endsWith('.md')
    )
    for (const f of files) {
      // WEBPLAN_YYYYMMDDHHII_Channel_ActionType_desc.md
      const parts = f.replace('.md', '').split('_')
      const channel = (parts[2] ?? 'unknown').toLowerCase()
      const action = [parts[3], parts[4]].filter(Boolean).join('_').toLowerCase()
      stats.byChannel[channel] = (stats.byChannel[channel] ?? 0) + 1
      stats.byAction[action] = (stats.byAction[action] ?? 0) + 1
      stats.total++
      if (kind === 'approved') stats.approved++
      else stats.rejected++
    }
  }

  countDir('Approved', 'approved')
  countDir('Rejected', 'rejected')
  return stats
}

export function readWatcherStatuses(): WatcherStatus[] {
  const root = getRepoRoot()
  const watchers = [
    { name: 'linkedin', displayName: 'LinkedIn', log: 'linkedin_watcher.log', cp: 'linkedin_watcher_checkpoint.json' },
    { name: 'gmail', displayName: 'Gmail', log: 'gmail_watcher.log', cp: 'gmail_checkpoint.json' },
    { name: 'instagram', displayName: 'Instagram', log: 'instagram_watcher.log', cp: 'instagram_watcher_checkpoint.json' },
    { name: 'odoo', displayName: 'Odoo', log: 'odoo_watcher.log', cp: 'odoo_watcher_checkpoint.json' },
    { name: 'twitter', displayName: 'Twitter', log: 'twitter_watcher.log', cp: 'twitter_watcher_checkpoint.json' },
    { name: 'whatsapp', displayName: 'WhatsApp', log: 'whatsapp_watcher.log', cp: 'whatsapp_watcher_checkpoint.json' },
  ]

  return watchers.map(({ name, displayName, log, cp }) => {
    const logPath = path.join(root, 'Logs', log)
    const cpPath = path.join(root, 'Logs', cp)

    const logContent = safeReadFile(logPath)
    const cpContent = safeReadFile(cpPath)

    let status = 'unknown'
    let lastRun: Date | null = null
    let lastMessage = 'No data'

    // Checkpoint = source of truth: healthy / log-only = degraded (ran but no checkpoint) / nothing = offline
    if (cpContent) {
      try {
        const cp = JSON.parse(cpContent)
        lastRun = cp.last_run ? new Date(cp.last_run) : cp.timestamp ? new Date(cp.timestamp) : null
        status = 'healthy'
      } catch {
        status = 'degraded'
      }
    } else if (logContent) {
      // Has log activity but never completed to a checkpoint — degraded
      status = 'degraded'
    } else {
      status = 'offline'
    }

    if (logContent) {
      const lines = logContent.split('\n').filter(Boolean)
      lastMessage = redactPii((lines[lines.length - 1] || '').slice(0, 120))
    }

    return {
      name,
      displayName,
      logFile: path.join('Logs', log),
      checkpointFile: path.join('Logs', cp),
      status,
      lastRun,
      lastMessage,
    }
  })
}
