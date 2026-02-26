import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execFileAsync = promisify(execFile)

function getRepoRoot() {
  if (process.env.REPO_ROOT) return process.env.REPO_ROOT
  return path.resolve(process.cwd(), '..', '..')
}

/**
 * POST /api/odoo/query
 * Execute a read-only Odoo query via brain_odoo_query_with_mcp_skill.py
 *
 * Body: { operation: 'list_unpaid_invoices' | 'revenue_summary' | 'ar_aging_summary' | 'list_customers', mode?: 'mock' | 'mcp' }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { operation?: string; mode?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const operation = body.operation || 'list_unpaid_invoices'
  // 'real' maps to 'mcp' (live Odoo); script only accepts 'mock' | 'mcp'
  const rawMode = body.mode || 'mock'
  const mode = rawMode === 'real' ? 'mcp' : (rawMode === 'mcp' ? 'mcp' : 'mock')

  const repoRoot = getRepoRoot()
  const script = path.join(repoRoot, 'scripts', 'brain_odoo_query_with_mcp_skill.py')

  try {
    const { stdout, stderr } = await execFileAsync(
      'python3',
      [script, '--mode', mode, '--operation', operation],
      {
        cwd: repoRoot,
        timeout: 30000,
        env: { ...process.env },
      }
    )

    // Parse last JSON line from stdout
    const lines = stdout.trim().split('\n').filter(Boolean)
    const lastLine = lines[lines.length - 1] || '{}'
    let result: Record<string, unknown> = {}
    try {
      result = JSON.parse(lastLine)
    } catch {
      // Try to find any JSON line
      for (const line of lines.reverse()) {
        try {
          result = JSON.parse(line)
          break
        } catch { /* skip */ }
      }
    }

    if (result.success === false) {
      return NextResponse.json({ error: result.error || 'Query failed', details: result }, { status: 500 })
    }

    return NextResponse.json({ success: true, operation, mode, mock: mode === 'mock', data: result, stderr: stderr?.slice(0, 500) })
  } catch (err: unknown) {
    const error = err as { message?: string; stderr?: string; code?: number }
    return NextResponse.json(
      { error: 'Odoo query execution failed', details: error.message, stderr: error.stderr },
      { status: 500 }
    )
  }
}

/**
 * GET /api/odoo/query?operation=list_unpaid_invoices&mode=mock
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const operation = searchParams.get('operation') || 'list_unpaid_invoices'
  const mode = searchParams.get('mode') || 'mock'

  return POST(new NextRequest(req.url, {
    method: 'POST',
    body: JSON.stringify({ operation, mode }),
    headers: { 'Content-Type': 'application/json', ...Object.fromEntries(req.headers) },
  }))
}
