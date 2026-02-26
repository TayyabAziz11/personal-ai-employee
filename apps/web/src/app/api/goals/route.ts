import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

function getRepoRoot() {
  if (process.env.REPO_ROOT) return process.env.REPO_ROOT
  return path.resolve(process.cwd(), '..', '..')
}

/**
 * GET /api/goals
 * Parses Business/Goals/Business_Goals.md and returns key metrics.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const filePath = path.join(getRepoRoot(), 'Business', 'Goals', 'Business_Goals.md')

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({
      monthly_goal: null,
      current_mtd: null,
      annual_target: null,
      pct_to_target: null,
      last_updated: null,
    })
  }

  const content = fs.readFileSync(filePath, 'utf-8')

  function extractNumber(pattern: RegExp): number | null {
    const m = content.match(pattern)
    if (!m) return null
    return parseFloat(m[1].replace(/,/g, ''))
  }

  function extractString(pattern: RegExp): string | null {
    const m = content.match(pattern)
    return m ? m[1].trim() : null
  }

  const monthly_goal = extractNumber(/Monthly goal[:\s]+\$?([\d,]+)/i)
  const current_mtd = extractNumber(/Current MTD[:\s]+\$?([\d,]+)/i)
  const annual_target = extractNumber(/Annual target[:\s]+\$?([\d,]+)/i)
  const last_updated = extractString(/last_updated:\s*(.+)/)

  const pct_to_target =
    monthly_goal && current_mtd !== null
      ? Math.round((current_mtd / monthly_goal) * 100)
      : null

  return NextResponse.json({
    monthly_goal,
    current_mtd,
    annual_target,
    pct_to_target,
    last_updated,
  })
}
