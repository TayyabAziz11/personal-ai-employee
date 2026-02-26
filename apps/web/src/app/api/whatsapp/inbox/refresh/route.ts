import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)
const REPO_ROOT = process.cwd().replace(/\/apps\/web$/, '')

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const watcherScript = path.join(
    REPO_ROOT,
    'src',
    'personal_ai_employee',
    'skills',
    'gold',
    'whatsapp_watcher_skill.py'
  )

  try {
    const { stdout, stderr } = await execAsync(
      `python3 "${watcherScript}" --mode real --max-results 20`,
      { cwd: REPO_ROOT, timeout: 90_000 }
    )

    // Parse count from summary line ("X scanned, Y created, …")
    const createdMatch = stdout.match(/(\d+) created/)
    const scannedMatch = stdout.match(/(\d+) scanned/)

    return NextResponse.json({
      success: true,
      scanned: scannedMatch ? parseInt(scannedMatch[1]) : 0,
      created: createdMatch ? parseInt(createdMatch[1]) : 0,
      output: stdout.slice(0, 500),
      stderr: stderr.slice(0, 200),
    })
  } catch (e: unknown) {
    const err = e as { message?: string; stderr?: string; stdout?: string }
    return NextResponse.json(
      {
        success: false,
        error: err.message ?? 'Watcher failed',
        stderr: (err.stderr ?? '').slice(0, 500),
      },
      { status: 500 }
    )
  }
}
