import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { spawn } from 'child_process'
import path from 'path'

const REPO_ROOT = process.cwd().replace(/\/apps\/web$/, '')

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { to: string; message: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { to, message } = body
  if (!to?.trim()) return NextResponse.json({ error: 'Recipient (to) is required' }, { status: 400 })
  if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

  const scriptPath = path.join(REPO_ROOT, 'scripts', 'web_execute_plan.py')

  const jsonPayload = JSON.stringify({
    plan_id: `direct_${Date.now()}`,
    channel: 'whatsapp',
    action_type: 'send_message',
    payload: { to: to.trim(), message: message.trim() },
    title: `WhatsApp Direct → ${to.trim().slice(0, 30)}`,
    scheduled_at: null,
  })

  return new Promise<NextResponse>((resolve) => {
    const proc = spawn('python3', [scriptPath, '--json', jsonPayload], {
      cwd: REPO_ROOT,
      env: { ...process.env },
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })

    proc.on('close', (code: number | null) => {
      const success = code === 0

      // Parse last JSON line from stdout
      let result: Record<string, unknown> = {}
      try {
        const lines = stdout.trim().split('\n').filter(Boolean)
        const lastLine = lines[lines.length - 1]
        if (lastLine) result = JSON.parse(lastLine)
      } catch { /* ignore parse errors */ }

      if (success) {
        resolve(NextResponse.json({ success: true, result }))
      } else {
        const errMsg = (result.error as string) ?? stderr.slice(0, 400) ?? 'Send failed'
        resolve(NextResponse.json({ success: false, error: errMsg }, { status: 500 }))
      }
    })

    proc.on('error', (err: Error) => {
      resolve(NextResponse.json({ success: false, error: err.message }, { status: 500 }))
    })
  })
}
