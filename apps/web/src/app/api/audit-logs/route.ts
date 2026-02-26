import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

function getRepoRoot() {
  if (process.env.REPO_ROOT) return process.env.REPO_ROOT
  return path.resolve(process.cwd(), '..', '..')
}

function getLogsDir() {
  return path.join(getRepoRoot(), 'Logs')
}

interface AuditEntry {
  timestamp: string
  action_type: string
  actor: string
  target?: string
  parameters?: Record<string, unknown>
  approval_status: string
  approval_ref?: string
  approved_by: string
  result: string
  error?: string
}

function readAuditFile(filePath: string): AuditEntry[] {
  if (!fs.existsSync(filePath)) return []
  const entries: AuditEntry[] = []
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        entries.push(JSON.parse(trimmed) as AuditEntry)
      } catch { /* skip malformed lines */ }
    }
  } catch { /* skip unreadable files */ }
  return entries
}

/**
 * GET /api/audit-logs?days=7&date=2026-02-25
 * Returns audit log entries from Logs/YYYY-MM-DD.json files.
 * Supports ?days=N (default 7) or ?date=YYYY-MM-DD for a specific date.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const specificDate = searchParams.get('date')
  const days = Math.min(30, Math.max(1, parseInt(searchParams.get('days') ?? '7', 10)))

  const logsDir = getLogsDir()
  const allEntries: AuditEntry[] = []

  if (specificDate) {
    const filePath = path.join(logsDir, `${specificDate}.json`)
    allEntries.push(...readAuditFile(filePath))
  } else {
    // Read last N days
    const now = new Date()
    for (let i = 0; i < days; i++) {
      const d = new Date(now)
      d.setUTCDate(d.getUTCDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const filePath = path.join(logsDir, `${dateStr}.json`)
      allEntries.push(...readAuditFile(filePath))
    }
  }

  // Sort newest first
  allEntries.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0
    return tb - ta
  })

  // Available date files (for date picker)
  let availableDates: string[] = []
  try {
    availableDates = fs.readdirSync(logsDir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .map((f) => f.replace('.json', ''))
      .sort()
      .reverse()
  } catch { /* ignore */ }

  return NextResponse.json({
    entries: allEntries,
    total: allEntries.length,
    availableDates,
  })
}
