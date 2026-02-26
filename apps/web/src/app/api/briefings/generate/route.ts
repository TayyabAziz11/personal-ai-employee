import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

const REPO_ROOT = process.env.REPO_ROOT ?? path.resolve(process.cwd(), '..', '..')

export async function POST() {
  const scriptPath = path.join(REPO_ROOT, 'scripts', 'brain_generate_weekly_ceo_briefing_skill.py')

  return new Promise<NextResponse>((resolve) => {
    const proc = spawn('python3', [scriptPath, '--mode', 'mock'], {
      cwd: REPO_ROOT,
      env: { ...process.env, PYTHONPATH: path.join(REPO_ROOT, 'src') },
    })

    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })

    proc.on('close', (code) => {
      if (code !== 0) {
        resolve(NextResponse.json({ success: false, error: stderr || 'Script exited with code ' + code }, { status: 500 }))
        return
      }

      // Try to parse JSON from last line
      const lines = stdout.trim().split('\n').filter(Boolean)
      let result: Record<string, unknown> = { success: true, output: stdout }
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const parsed = JSON.parse(lines[i])
          result = { success: true, ...parsed }
          break
        } catch { /* not JSON */ }
      }

      resolve(NextResponse.json(result))
    })

    proc.on('error', (err) => {
      resolve(NextResponse.json({ success: false, error: err.message }, { status: 500 }))
    })
  })
}
